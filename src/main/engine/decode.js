'use strict';
// Entrada de imagens que o sharp não abre sozinho: HEIC/HEIF, JPEG XL, PSD, BMP e ICO (pelo FFmpeg)
// e RAW de câmera (prévia JPEG embutida). O resultado vai pra uma pasta temporária e é reaproveitado
// enquanto o arquivo não mudar; a pasta é limpa ao fechar o app e na próxima abertura.
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');
const { execFile } = require('node:child_process');
const F = require('./formats');
const ff = require('./ffmpeg');

const ROOT = path.join(os.tmpdir(), 'MINIME');
const DIR = path.join(ROOT, `cache-${process.pid}`);
const inflight = new Map(); // chave -> Promise<caminho>

function ensureDir() { fs.mkdirSync(DIR, { recursive: true }); return DIR; }

// Pastas de sessões anteriores que ficaram (app fechado à força): apaga as que não são deste processo.
function purgeOld() {
  let entries = [];
  try { entries = fs.readdirSync(ROOT, { withFileTypes: true }); } catch { return; }
  for (const e of entries) {
    if (!e.isDirectory() || e.name === path.basename(DIR)) continue;
    const m = /^(cache|work)-(\d+)/.exec(e.name);
    if (!m) continue;
    const pid = Number(m[2]);
    let alive = false;
    try { process.kill(pid, 0); alive = true; } catch {}
    if (!alive) { try { fs.rmSync(path.join(ROOT, e.name), { recursive: true, force: true }); } catch {} }
  }
}

function cleanup() { try { fs.rmSync(DIR, { recursive: true, force: true }); } catch {} }

// Pasta de trabalho temporária (ex.: quadros do vídeo durante o upscale). Some com cleanup() ou ao terminar.
function workDir(tag) {
  const d = path.join(ROOT, `work-${process.pid}`, `${tag}-${crypto.randomBytes(4).toString('hex')}`);
  fs.mkdirSync(d, { recursive: true });
  return d;
}
function cleanupWork() { try { fs.rmSync(path.join(ROOT, `work-${process.pid}`), { recursive: true, force: true }); } catch {} }

function keyOf(file) {
  const st = fs.statSync(file);
  return crypto.createHash('sha1').update(`${path.resolve(file).toLowerCase()}|${st.size}|${st.mtimeMs}`).digest('hex').slice(0, 16);
}

// Cada arquivo é decodificado uma vez só, mesmo com várias leituras em paralelo (estimativa e conversão).
const CAP = 2 * 1024 ** 3; // o cache nunca passa de 2 GB: sai primeiro o mais antigo
function prune(keep) {
  let files = [];
  try { files = fs.readdirSync(DIR).filter((f) => !f.endsWith('.part')).map((f) => { const p = path.join(DIR, f); const st = fs.statSync(p); return { p, size: st.size, t: st.mtimeMs }; }); } catch { return; }
  let total = files.reduce((s, f) => s + f.size, 0);
  for (const f of files.sort((a, b) => a.t - b.t)) {
    if (total <= CAP) break;
    if (f.p === keep) continue;
    try { fs.unlinkSync(f.p); total -= f.size; } catch {}
  }
}
function cached(file, ext, outExt, make) {
  const key = `${keyOf(file)}.${outExt}`;
  const out = path.join(ensureDir(), key);
  if (fs.existsSync(out)) return Promise.resolve(out);
  if (inflight.has(key)) return inflight.get(key);
  const tmp = `${out}.part`;
  const p = make(tmp)
    .then(() => { fs.renameSync(tmp, out); prune(out); return out; })
    .catch((e) => { try { fs.unlinkSync(tmp); } catch {} throw e; })
    .finally(() => inflight.delete(key));
  inflight.set(key, p);
  return p;
}

// Conversão terminou: o decodificado desse arquivo não precisa mais ficar no disco.
function release(file, ext) {
  const c = F.canonical(ext);
  if (!F.isRaw(c) && !F.viaFfmpeg(c)) return;
  try {
    const k = keyOf(file);
    for (const e of ['png', 'jpg']) { try { fs.unlinkSync(path.join(DIR, `${k}.${e}`)); } catch {} }
  } catch {}
}

// HEIC do iPhone vem em blocos de 512 px: o FFmpeg 8 monta a grade sozinho.
function ffmpegToPng(file, tmp) {
  return ff.runBuffer(ff.ffmpegPath(), [
    '-hide_banner', '-loglevel', 'error', '-i', file, '-frames:v', '1',
    '-f', 'image2pipe', '-c:v', 'png', '-compression_level', '1', 'pipe:1',
  ], { timeout: 120000 }).then((buf) => {
    if (!buf.length) throw new Error('Arquivo corrompido ou num formato que não consegui ler.');
    fs.writeFileSync(tmp, buf);
  });
}

// Mac: o próprio sistema abre HEIC (fallback quando o FFmpeg não consegue).
function sipsToPng(file, tmp) {
  return new Promise((resolve, reject) => {
    execFile('/usr/bin/sips', ['-s', 'format', 'png', file, '--out', tmp], { timeout: 120000 }, (e) => (e ? reject(e) : resolve()));
  });
}

// Gira conforme a orientação EXIF. sharp aplica flip/flop antes de girar (ver docs): 5 = flip+90, 7 = flop+90.
function orient(img, o) {
  if (o === 2) return img.flop();
  if (o === 3) return img.rotate(180);
  if (o === 4) return img.flip();
  if (o === 5) return img.flip().rotate(90);
  if (o === 6) return img.rotate(90);
  if (o === 7) return img.flop().rotate(90);
  if (o === 8) return img.rotate(270);
  return img;
}

// Prévia do RAW, com a orientação que só o RAW conhece (o JPEG de dentro muitas vezes não tem EXIF).
// manual = a orientação precisa ser aplicada por quem usar o buffer (o autoOrient do sharp não vê).
async function rawPreview(file) {
  const raw = require('./raw');
  const sharp = require('sharp');
  const r = await raw.extractPreview(file);
  const meta = await sharp(r.buffer).metadata();
  const o = r.orientation || 1;
  const manual = o !== 1 && !(meta.orientation && meta.orientation === o) ? o : 1;
  const exif = meta.orientation || 1;
  const final = manual !== 1 ? manual : exif;
  const [w, h] = final >= 5 ? [meta.height, meta.width] : [meta.width, meta.height];
  return { buffer: r.buffer, manual, width: w || 0, height: h || 0 };
}

// RAW: prévia JPEG da câmera. Quando a orientação está só no RAW (não no JPEG), gira aqui uma vez.
async function rawToJpeg(file, tmp) {
  const sharp = require('sharp');
  const r = await rawPreview(file);
  if (r.manual === 1) { fs.writeFileSync(tmp, r.buffer); return; }
  await orient(sharp(r.buffer, { failOn: 'none' }), r.manual).withMetadata({ orientation: 1 })
    .jpeg({ quality: 97, chromaSubsampling: '4:4:4', mozjpeg: true }).toFile(tmp);
}

// Caminho que o sharp consegue abrir pra esse arquivo.
async function sourceFor(file, ext) {
  const c = F.canonical(ext);
  if (F.isRaw(c)) return cached(file, c, 'jpg', (tmp) => rawToJpeg(file, tmp));
  if (F.viaFfmpeg(c)) {
    return cached(file, c, 'png', async (tmp) => {
      try { await ffmpegToPng(file, tmp); } catch (e) {
        // Mac: o próprio sistema abre HEIC, JPEG XL (macOS 14+) e PSD em CMYK, que o FFmpeg recusa.
        if (process.platform === 'darwin' && ['heic', 'jxl', 'psd'].includes(c)) await sipsToPng(file, tmp);
        else throw e;
      }
    });
  }
  return file;
}

const needsDecode = (ext) => { const c = F.canonical(ext); return F.isRaw(c) || F.viaFfmpeg(c); };

// Miniatura sem decodificar a foto inteira no disco: RAW pela prévia, HEIC/JXL/PSD já reduzido pelo FFmpeg.
async function thumbSource(file, ext) {
  const c = F.canonical(ext);
  const sharp = require('sharp');
  if (F.isRaw(c)) {
    const r = await rawPreview(file);
    return r.manual !== 1 ? orient(sharp(r.buffer, { failOn: 'none' }), r.manual) : sharp(r.buffer, { failOn: 'none' }).autoOrient();
  }
  if (['heic', 'jxl', 'psd'].includes(c)) {
    try {
      // HEIC em grade já passa por um filtro interno do FFmpeg (não aceita -vf): -s reduz nos dois casos.
      const p = await ff.probeStill(file);
      const k = p.width && p.height ? 320 / Math.min(p.width, p.height) : 0;
      if (k > 0 && k < 1) {
        const even = (n) => Math.max(2, Math.round(n / 2) * 2);
        const buf = await ff.runBuffer(ff.ffmpegPath(), ['-hide_banner', '-loglevel', 'error', '-i', file, '-frames:v', '1',
          '-s', `${even(p.width * k)}x${even(p.height * k)}`, '-f', 'image2pipe', '-c:v', 'png', 'pipe:1'], { timeout: 60000 });
        if (buf.length) return sharp(buf).autoOrient();
      }
    } catch {}
  }
  return sharp(await sourceFor(file, ext), { failOn: 'none', limitInputPixels: false }).autoOrient();
}

module.exports = { sourceFor, needsDecode, purgeOld, cleanup, workDir, cleanupWork, release, rawPreview, orient, thumbSource, ROOT };
