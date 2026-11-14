'use strict';
// Vídeo até 4K com IA. Três etapas em fila, com no máximo 2 lotes de quadros no disco:
//   1. FFmpeg decodifica em RGB e o app grava cada quadro em PNG (lote de dezenas de quadros)
//   2. Real-ESRGAN compacto amplia o lote inteiro de uma vez (o motor abre uma vez por lote)
//   3. cada quadro ampliado vai pro tamanho final e entra no encoder pelo stdin, junto com o áudio original
const fs = require('node:fs');
const path = require('node:path');
const { spawn } = require('node:child_process');
const sharp = require('sharp');
const ff = require('./ffmpeg');
const decode = require('./decode');
const up = require('./upscale');
const av = require('./av');

// Fila simples com limite: quem coloca espera quando está cheia.
class Queue {
  constructor(cap) { this.cap = cap; this.items = []; this.takers = []; this.putters = []; this.closed = false; }
  async put(x) {
    while (this.items.length >= this.cap && !this.closed) await new Promise((r) => this.putters.push(r));
    this.items.push(x);
    const t = this.takers.shift(); if (t) t();
  }
  async take() {
    while (!this.items.length) {
      if (this.closed) return null;
      await new Promise((r) => this.takers.push(r));
    }
    const x = this.items.shift();
    const p = this.putters.shift(); if (p) p();
    return x;
  }
  close() { this.closed = true; for (const t of this.takers.splice(0)) t(); for (const p of this.putters.splice(0)) p(); }
}

function writeAll(stream, buf) {
  return new Promise((resolve, reject) => {
    if (stream.destroyed) return reject(new Error('O encoder fechou no meio.'));
    if (stream.write(buf)) return resolve();
    const done = (e) => { stream.off('drain', done); stream.off('error', done); stream.off('close', closed); if (e) reject(e); else resolve(); };
    const closed = () => done(new Error('O encoder fechou no meio.'));
    stream.on('drain', done); stream.on('error', done); stream.on('close', closed);
  });
}

function waitClose(child, label) {
  return new Promise((resolve, reject) => {
    let err = '';
    if (child.stderr) child.stderr.on('data', (d) => { err += d; if (err.length > 20000) err = err.slice(-10000); });
    child.on('error', reject);
    child.on('close', (code, sig) => (code === 0 ? resolve() : reject(new Error(err.trim().split(/\r?\n/).slice(-2).join(' | ') || `${label} saiu com código ${code ?? sig}`))));
  });
}

async function upscaleVideo(item, target, settings, hw, outPath, { signal, onProgress } = {}) {
  const info = item.info;
  const v = info.video;
  const dims = up.targetDimsVideo(v.width, v.height);
  if (!dims) throw new Error('Esse vídeo já está em 4K. Não precisa aumentar.');
  const avail = up.available();
  if (!avail.video) throw new Error(avail.gpuError || 'O motor de IA de vídeo não está disponível nesta instalação.');

  const fps = Math.min(60, v.fps || 30);
  const W = v.width, H = v.height;
  const FRAME = W * H * 3;
  const total = Math.max(1, Math.round((info.duration || 0) * fps));
  // Lote: uns 30 MP de entrada (58 quadros em 540p, 16 em 1080p).
  const N = Math.max(16, Math.min(120, Math.round(3e7 / (W * H))));
  const vs = settings.video;
  const enc = av.planUpscaleEncode(info, target, vs, hw, dims, fps);
  const matrix = av.sourceMatrix(v);

  const work = decode.workDir('video');
  const inner = new AbortController();
  const abortAll = () => inner.abort();
  if (signal) { if (signal.aborted) abortAll(); signal.addEventListener('abort', abortAll, { once: true }); }
  const children = [];
  const killChildren = () => { for (const c of children) { try { if (c.exitCode === null) c.kill('SIGKILL'); } catch {} } };
  inner.signal.addEventListener('abort', killChildren, { once: true });

  const FF = ff.ffmpegPath();
  // Decodifica já girado (o FFmpeg aplica a rotação do celular) e em quadros de tempo constante.
  const dec = ff.track(spawn(FF, ['-hide_banner', '-loglevel', 'error', '-nostdin', '-i', item.path, '-map', '0:V:0',
    '-vf', `fps=${fps},scale=${W}:${H}:in_color_matrix=${matrix}:flags=lanczos,format=rgb24`, '-f', 'rawvideo', '-pix_fmt', 'rgb24', 'pipe:1'],
  { windowsHide: true }));
  children.push(dec);
  const encP = ff.track(spawn(FF, ['-hide_banner', '-loglevel', 'error', '-nostdin', '-y',
    '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', `${dims.w}x${dims.h}`, '-framerate', String(fps), '-i', 'pipe:0',
    '-i', item.path, ...enc.args, outPath], { windowsHide: true }));
  children.push(encP);
  const decDone = waitClose(dec, 'decodificador');
  const encDone = waitClose(encP, 'encoder');
  // Quem falhou primeiro: se foi o encoder da placa de vídeo, dá pra tentar de novo no processador.
  let firstFail = null;
  decDone.catch(() => {});
  encDone.catch(() => { if (!inner.signal.aborted) { firstFail = firstFail || 'encoder'; abortAll(); } });
  encP.stdin.on('error', () => {});

  const toUpscale = new Queue(1); // lotes gravados esperando a IA
  const toEncode = new Queue(1); // lotes ampliados esperando o encoder
  // Cancelou ou deu erro em qualquer etapa: destrava as filas pra ninguém ficar esperando.
  inner.signal.addEventListener('abort', () => { toUpscale.close(); toEncode.close(); }, { once: true });
  let done = 0;
  const t0 = Date.now();
  const report = () => {
    if (!onProgress) return;
    const p = Math.min(0.995, done / total);
    const el = (Date.now() - t0) / 1000;
    const eta = done > 8 && el > 4 ? Math.round((el / done) * (total - done)) : null;
    onProgress(p, { eta });
  };
  let seq = 0;
  const newBatch = () => {
    const d = path.join(work, `b${String(++seq).padStart(5, '0')}`);
    fs.mkdirSync(path.join(d, 'in'), { recursive: true });
    fs.mkdirSync(path.join(d, 'out'));
    return { dir: d, count: 0 };
  };

  // Etapa 1: lê quadros crus e grava PNG (compressão mínima, é só intermediário).
  const reader = (async () => {
    let batch = newBatch();
    let pending = Buffer.alloc(0);
    for await (const chunk of dec.stdout) {
      if (inner.signal.aborted) break;
      pending = pending.length ? Buffer.concat([pending, chunk]) : chunk;
      while (pending.length >= FRAME) {
        const frame = pending.subarray(0, FRAME);
        pending = pending.subarray(FRAME);
        const name = String(batch.count).padStart(6, '0');
        await sharp(Buffer.from(frame), { raw: { width: W, height: H, channels: 3 } }).png({ compressionLevel: 1 })
          .toFile(path.join(batch.dir, 'in', `${name}.png`));
        batch.count++;
        if (batch.count >= N) { await toUpscale.put(batch); batch = newBatch(); }
      }
    }
    await decDone;
    if (batch.count) await toUpscale.put(batch); else fs.rmSync(batch.dir, { recursive: true, force: true });
    toUpscale.close();
  })();

  // Etapa 2: IA no lote inteiro (saída em JPG 100%: grava rápido e quase sem perda).
  const upscaler = (async () => {
    for (;;) {
      const b = await toUpscale.take();
      if (!b) break;
      await up.runNcnn(up.ncnnArgs(path.join(b.dir, 'in'), path.join(b.dir, 'out'), up.VIDEO, 'jpg', '2:2:2'), { signal: inner.signal });
      fs.rmSync(path.join(b.dir, 'in'), { recursive: true, force: true });
      await toEncode.put(b);
    }
    toEncode.close();
  })();

  // Etapa 3: tamanho final e encoder.
  const encoder = (async () => {
    for (;;) {
      const b = await toEncode.take();
      if (!b) break;
      for (let i = 0; i < b.count; i++) {
        if (inner.signal.aborted) return;
        const f = path.join(b.dir, 'out', `${String(i).padStart(6, '0')}.jpg`);
        if (!fs.existsSync(f)) throw new Error('O motor de IA pulou um quadro do vídeo.');
        const raw = await sharp(f).resize(dims.w, dims.h, { kernel: 'lanczos3', fit: 'fill' }).removeAlpha().raw().toBuffer();
        await writeAll(encP.stdin, raw);
        done++;
        if (done % 3 === 0) report();
      }
      fs.rmSync(b.dir, { recursive: true, force: true });
    }
    encP.stdin.end();
  })();

  try {
    const stages = [['reader', reader], ['ia', upscaler], ['encoder', encoder]];
    await Promise.all(stages.map(([label, p]) => p.catch((e) => { if (!inner.signal.aborted) firstFail = firstFail || label; abortAll(); throw e; })));
    await encDone;
    if (onProgress) onProgress(1, { eta: 0 });
  } catch (e) {
    abortAll();
    if (signal && signal.aborted) throw Object.assign(new Error('Cancelado'), { cancelled: true });
    if (firstFail === 'encoder' && enc.gpu) throw Object.assign(e, { retryCpu: true });
    throw e;
  } finally {
    if (signal) signal.removeEventListener('abort', abortAll);
    killChildren();
    try { fs.rmSync(work, { recursive: true, force: true }); } catch {}
  }
}

module.exports = { upscaleVideo };
