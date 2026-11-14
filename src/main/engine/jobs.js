'use strict';
// Orquestra a lista de arquivos: leitura, miniaturas, estimativa de tamanho e a fila de conversão.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const F = require('./formats');
const ff = require('./ffmpeg');
const img = require('./image');
const av = require('./av');
const up = require('./upscale');
const { upscaleVideo } = require('./upscale-video');
const decode = require('./decode');

const os = require('node:os');

const items = new Map(); // id -> item
const estimateCache = new Map(); // chave -> bytes
const inFlight = new Set(); // arquivos de saída sendo gravados agora (apagados se o app fechar no meio)
let hw = null;

function setHardware(h) { hw = h; }

// ---------- Entrada de arquivos ----------

function walk(dir, out, depth = 0) {
  if (depth > 6 || out.length > 3000) return;
  let entries = [];
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
  for (const e of entries) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out, depth + 1);
    else if (F.categoryOf(F.extOf(e.name))) out.push(p);
  }
}

function expandPaths(paths) {
  const out = [];
  for (const p of paths) {
    try {
      const st = fs.statSync(p);
      if (st.isDirectory()) walk(p, out);
      else if (F.categoryOf(F.extOf(p))) out.push(p);
    } catch {}
  }
  return [...new Set(out.map((p) => path.resolve(p)))];
}

function fmtDuration(s) {
  if (!s) return '';
  s = Math.round(s);
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
  const pad = (n) => String(n).padStart(2, '0');
  return h ? `${h}:${pad(m)}:${pad(sec)}` : `${m}:${pad(sec)}`;
}

function describe(item) {
  const i = item.info;
  // RAW: o MINIME usa a foto que a câmera grava junto (algumas, como a Sony, guardam uma versão menor).
  if (item.category === 'image') return `${i.width} × ${i.height}${i.pages > 1 ? ` · ${i.pages} quadros` : ''}${F.isRaw(F.canonical(item.ext)) ? ' · foto da câmera' : ''}`;
  if (item.category === 'video') {
    const v = i.video;
    return [fmtDuration(i.duration), v ? `${v.width} × ${v.height}` : '', v ? `${Math.round(v.fps)} fps` : ''].filter(Boolean).join(' · ');
  }
  const a = i.audio[0];
  return [fmtDuration(i.duration), a ? `${Math.round((a.bitrate || i.bitrate || 0) / 1000) || '?'} kbps` : ''].filter(Boolean).join(' · ');
}

async function probeOne(p) {
  const ext = F.extOf(p);
  const category = F.categoryOf(ext);
  const size = fs.statSync(p).size;
  const id = crypto.createHash('sha1').update(p.toLowerCase()).digest('hex').slice(0, 12);
  const base = { id, path: p, name: path.basename(p), ext, category, size };
  try {
    const info = category === 'image' ? await img.probeImage(p, ext) : await ff.probe(p);
    if (category === 'video' && !info.video) throw new Error('Não encontrei a faixa de vídeo nesse arquivo.');
    if (category === 'audio' && !info.audio.length) throw new Error('Não encontrei áudio nesse arquivo.');
    const item = { ...base, info, ok: true };
    item.meta = describe(item);
    item.targets = F.targetsFor(ext).map((t) => F.describeTarget(category, t, ext));
    item.defaultTarget = F.defaultTarget(ext);
    items.set(id, item);
    return publicItem(item);
  } catch (e) {
    const item = { ...base, ok: false, error: friendlyError(e), targets: [], meta: '' };
    items.set(id, item);
    return publicItem(item);
  }
}

function publicItem(it) {
  return {
    id: it.id, path: it.path, name: it.name, ext: it.ext, category: it.category, size: it.size,
    ok: it.ok, error: it.error || null, meta: it.meta, targets: it.targets, defaultTarget: it.defaultTarget,
    hasAudio: it.info ? (it.category === 'image' ? false : it.info.audio.length > 0) : false,
    hasCover: it.info ? !!it.info.hasCover : false,
    alpha: it.category === 'image' && it.info ? !!it.info.hasAlpha : false,
  };
}

async function addPaths(paths) {
  const files = expandPaths(paths);
  const out = await pool(files, 6, probeOne);
  return out;
}

function remove(ids) { for (const id of ids) items.delete(id); }

async function thumb(id) {
  const it = items.get(id);
  if (!it || !it.ok) return null;
  try {
    if (it.category === 'image') {
      const b = await img.thumbnail(it.path, it.ext, 160);
      return `data:image/webp;base64,${b.toString('base64')}`;
    }
    const b = await ff.thumbnail(it.path, it.info, 160);
    return b && b.length ? `data:image/jpeg;base64,${b.toString('base64')}` : null;
  } catch { return null; }
}

// ---------- Utilidades ----------

async function pool(list, n, fn) {
  const out = new Array(list.length);
  let i = 0;
  const workers = Array.from({ length: Math.min(n, list.length) }, async () => {
    while (i < list.length) {
      const k = i++;
      out[k] = await fn(list[k], k);
    }
  });
  await Promise.all(workers);
  return out;
}

function friendlyError(e) {
  const m = String((e && e.message) || e);
  if (/Invalid data found|could not find codec|unsupported image format|Input file contains unsupported/i.test(m)) return 'Arquivo corrompido ou num formato que não consegui ler.';
  if (/No such file|ENOENT/i.test(m)) return 'O arquivo não existe mais nesse caminho.';
  if (/EACCES|EPERM|Permission denied/i.test(m)) return 'Sem permissão pra gravar nessa pasta.';
  if (/ENOSPC|No space left/i.test(m)) return 'Disco cheio.';
  if (/Cancelado/i.test(m)) return 'Cancelado.';
  return m.length > 180 ? `${m.slice(0, 180)}…` : m;
}

async function avInfoFor(it) {
  if (it.category !== 'image') return it.info;
  if (!it.avInfo) it.avInfo = await ff.probe(it.path);
  return it.avInfo;
}

// GIF animado indo pra MP4 é tratado como vídeo.
async function asAvItem(it) {
  return { ...it, info: await avInfoFor(it) };
}

// ---------- Estimativa ----------

function imageKey(it, target, s) {
  return JSON.stringify([it.path, it.size, target, s.objective === 'lossless', Math.round(s.quality), s.resize, !!s.stripMetadata,
    img.upscaleOn(s) ? `${s.upscale}:${s.upscaleSize}` : '']);
}

const estimateGens = new Map(); // chave da janela -> geração atual

// jobs: [{id, target}] -> { [id]: { bytes, approx, detail } }
async function estimate(jobs, settings, key = 'default') {
  const gen = (estimateGens.get(key) || 0) + 1;
  estimateGens.set(key, gen);
  const stale = () => estimateGens.get(key) !== gen;
  const result = {};
  const imageJobs = [];
  for (const j of jobs) {
    const it = items.get(j.id);
    if (!it || !it.ok) continue;
    const kind = av.outputKind(it.category, j.target);
    if (kind === 'image') { imageJobs.push({ it, target: j.target }); continue; }
    try {
      const avIt = await asAvItem(it);
      const p = av.plan(avIt, j.target, settings, hw);
      result[j.id] = { bytes: Math.round(p.estimate), approx: !p.detail.remux, detail: p.detail };
    } catch (e) {
      result[j.id] = { bytes: 0, error: friendlyError(e) };
    }
  }

  // Imagens: codifica de verdade (até 12); acima disso, amostra e extrapola pela proporção.
  const s = settings.image;
  const LIMIT = 12;
  const sample = imageJobs.length <= LIMIT ? imageJobs
    : Array.from({ length: LIMIT }, (_, k) => imageJobs[Math.floor((k * imageJobs.length) / LIMIT)]);
  const sampled = new Set(sample.map((x) => x.it.id));
  await pool(sample, 3, async ({ it, target }) => {
    if (stale()) return;
    const key = imageKey(it, target, s);
    let bytes = estimateCache.get(key);
    if (bytes === undefined) {
      try {
        bytes = await img.estimateImage(it.path, it.ext, it.info, target, s);
        estimateCache.set(key, bytes);
        if (estimateCache.size > 4000) estimateCache.delete(estimateCache.keys().next().value);
      } catch (e) { result[it.id] = { bytes: 0, error: friendlyError(e) }; return; }
    }
    result[it.id] = { bytes, approx: img.aiApplies(it.info, s), detail: img.upscaleOn(s) ? aiDetail(it, s) : undefined };
  });
  if (stale()) return { stale: true };

  if (imageJobs.length > sample.length) {
    // Proporção saída/entrada por (formato de origem, destino), com bytes por pixel de reserva.
    const ratios = {};
    let pxBytes = 0, px = 0;
    for (const { it, target } of sample) {
      const r = result[it.id];
      if (!r || !r.bytes) continue;
      const k = `${it.ext}>${target}`;
      ratios[k] = ratios[k] || { a: 0, b: 0 };
      ratios[k].a += r.bytes; ratios[k].b += it.size;
      const d = finalDims(it, s);
      pxBytes += r.bytes; px += d.w * d.h;
    }
    for (const { it, target } of imageJobs) {
      if (sampled.has(it.id)) continue;
      const key = imageKey(it, target, s);
      const det = img.upscaleOn(s) ? aiDetail(it, s) : undefined;
      if (estimateCache.has(key)) { result[it.id] = { bytes: estimateCache.get(key), approx: img.aiApplies(it.info, s), detail: det }; continue; }
      const r = ratios[`${it.ext}>${target}`];
      const d = finalDims(it, s);
      const bytes = img.aiApplies(it.info, s) && px ? (d.w * d.h * pxBytes) / px : r && r.b ? (it.size * r.a) / r.b : px ? (d.w * d.h * pxBytes) / px : it.size;
      result[it.id] = { bytes: Math.round(bytes), approx: true, detail: det };
    }
  }
  return result;
}

// Lado a lado do arquivo final: ampliado pela IA, original (IA ligada mas não cresce) ou reduzido.
function finalDims(it, s) {
  if (img.aiApplies(it.info, s)) return up.targetDims(it.info.width, it.info.height, s.upscaleSize);
  if (img.aiEffective(s)) return { w: it.info.width, h: it.info.height };
  return img.resizedDims(it.info.width, it.info.height, s.resize);
}

// Tamanho final da foto ampliada (a tela mostra "vira 3840 × 2160").
function aiDetail(it, s) {
  if (!img.aiCandidate(it.info)) return undefined;
  const d = up.targetDims(it.info.width, it.info.height, s.upscaleSize);
  return d ? { upscale: true, w: d.w, h: d.h } : { upscale: true, already: true };
}

function capabilities(category, target, ids, settings) {
  const list = (ids || []).map((id) => items.get(id)).filter(Boolean);
  const kind = av.outputKind(category, target);
  if (kind === 'image') return img.capabilities(target, settings.image);
  return av.capabilities(category, target, list);
}

// ---------- Conversão ----------

const batches = new Map(); // chave da janela -> AbortController
const reservedGlobal = new Set(); // nomes em uso por qualquer janela convertendo agora

// Arquivo ampliado ganha " (4K)" (ou " (2x)") no nome: nunca sobrescreve nem se confunde com o original.
function aiSuffix(it, settings, kind) {
  let d = null;
  if (kind === 'image' && img.aiApplies(it.info, settings.image)) d = up.targetDims(it.info.width, it.info.height, settings.image.upscaleSize);
  else if (kind === 'video' && it.info && it.info.video && av.wantsUpscale(it, it.target || '', settings.video)) d = up.targetDimsVideo(it.info.video.width, it.info.video.height);
  if (!d) return '';
  const box = Math.max(d.w, d.h) >= up.BOX_LONG * 0.98 || Math.min(d.w, d.h) >= up.BOX_SHORT * 0.98;
  return box ? ' (4K)' : ` (${Math.round(d.k * 10) / 10}x)`.replace('.', ',');
}

function outputPathFor(it, target, dest, reserved, suffix = '') {
  const dir = dest && dest.mode === 'folder' && dest.folder ? dest.folder : path.dirname(it.path);
  const base = path.basename(it.path, path.extname(it.path)) + suffix;
  let candidate = path.join(dir, `${base}.${target}`);
  let n = 1;
  const taken = (p) => fs.existsSync(p) || reserved.has(p.toLowerCase()) || reservedGlobal.has(p.toLowerCase()) || p.toLowerCase() === it.path.toLowerCase();
  while (taken(candidate)) candidate = path.join(dir, `${base} (${n++}).${target}`);
  reserved.add(candidate.toLowerCase());
  reservedGlobal.add(candidate.toLowerCase());
  return candidate;
}

// jobs: [{id, target}], dest: {mode:'same'|'folder', folder}
async function convertAll(jobs, settings, dest, emit, key = 'default') {
  if (batches.has(key)) throw new Error('Essa janela já está convertendo.');
  const controller = new AbortController();
  batches.set(key, controller);
  const reserved = new Set();
  const started = Date.now();
  if (dest && dest.mode === 'folder' && dest.folder) fs.mkdirSync(dest.folder, { recursive: true });

  
  const prepared = jobs.map((j) => {
    const it = items.get(j.id);
    if (!it || !it.ok) return null;
    const kind = av.outputKind(it.category, j.target);
    const ai = (kind === 'image' && img.aiApplies(it.info, settings.image))
      || (kind === 'video' && av.wantsUpscale(it, j.target, settings.video) && !!up.targetDimsVideo(it.info.video.width, it.info.video.height));
    return { it, target: j.target, kind, ai, out: outputPathFor(it, j.target, dest, reserved, ai ? aiSuffix({ ...it, target: j.target }, settings, kind) : '') };
  }).filter(Boolean);

  const summary = { done: 0, failed: 0, cancelled: 0, inBytes: 0, outBytes: 0, folders: new Set() };

  // Modo padrão com várias fotos: o motor de IA amplia todas num lote só; cada uma segue assim que fica pronta.
  const aiImages = prepared.filter((j) => j.ai && j.kind === 'image');
  const aiVideos = prepared.filter((j) => j.ai && j.kind === 'video');
  let batchRun = null;
  if (aiImages.length > 1 && settings.image.upscale === 'standard') {
    const byKey = new Map();
    for (const j of aiImages) {
      j.aiReady = {};
      j.aiReady.promise = new Promise((res, rej) => { j.aiReady.resolve = res; j.aiReady.reject = rej; });
      j.aiReady.promise.catch(() => {});
      byKey.set(j.it.id, j);
    }
    batchRun = (async () => {
      const entries = [];
      for (const j of aiImages) {
        try { entries.push({ key: j.it.id, src: await img.sourceOf(j.it.path, j.it.ext) }); } catch (e) { j.aiReady.reject(e); }
      }
      await up.upscaleBatch(entries, {
        size: settings.image.upscaleSize,
        signal: controller.signal,
        onProgress: (key, p) => emit({ id: key, status: 'running', progress: Math.min(0.9, p * 0.9) }),
        onReady: (key, r) => byKey.get(key).aiReady.resolve(r),
        onError: (key, e) => byKey.get(key).aiReady.reject(e),
      });
    })().catch((e) => { for (const j of aiImages) j.aiReady.reject(e); });
  }

  const runOne = async (job) => {
    const { it, target, kind, out } = job;
    if (controller.signal.aborted) { summary.cancelled++; emit({ id: it.id, status: 'cancelled' }); return; }
    emit({ id: it.id, status: job.aiReady ? 'queued' : 'running', progress: 0, outPath: out });
    inFlight.add(out);
    let aiCleanup = null;
    try {
      if (kind === 'image') {
        const ctx = {};
        if (job.ai) {
          const r = job.aiReady ? await job.aiReady.promise : await up.upscaleImage({
            src: await img.sourceOf(it.path, it.ext), mode: settings.image.upscale, size: settings.image.upscaleSize,
            signal: controller.signal, onProgress: (p) => emit({ id: it.id, status: 'running', progress: p }),
          });
          aiCleanup = r.cleanup;
          ctx.upscaled = r.file;
          emit({ id: it.id, status: 'running', progress: 0.92 });
        }
        await img.convertImage(it.path, it.ext, it.info, target, settings.image, out, ctx);
        emit({ id: it.id, status: 'running', progress: 1 });
      } else {
        const avIt = await asAvItem(it);
        let last = 0;
        const onProgress = (p, extra) => {
          if (p - last >= 0.005 || p === 1) { last = p; emit({ id: it.id, status: 'running', progress: p, eta: extra && extra.eta }); }
        };
        if (job.ai) {
          try {
            await upscaleVideo(avIt, target, settings, hw, out, { signal: controller.signal, onProgress });
          } catch (e) {
            // Encoder da placa recusou (ex.: vídeo em pé em 2160 × 3840): refaz codificando no processador.
            if (!e.retryCpu || controller.signal.aborted) throw e;
            last = 0; onProgress(0, {});
            await upscaleVideo(avIt, target, { ...settings, video: { ...settings.video, engine: 'cpu' } }, hw, out, { signal: controller.signal, onProgress });
          }
        } else await av.convert(avIt, target, settings, hw, out, { signal: controller.signal, onProgress });
      }
      if (aiCleanup) aiCleanup();
      if (kind === 'image') decode.release(it.path, it.ext);
      inFlight.delete(out);
      const outSize = fs.statSync(out).size;
      summary.done++; summary.inBytes += it.size; summary.outBytes += outSize; summary.folders.add(path.dirname(out));
      emit({ id: it.id, status: 'done', progress: 1, outPath: out, outSize });
    } catch (e) {
      if (aiCleanup) aiCleanup();
      if (kind === 'image') decode.release(it.path, it.ext);
      inFlight.delete(out);
      try { fs.unlinkSync(out); } catch {}
      if (e.cancelled || controller.signal.aborted) { summary.cancelled++; emit({ id: it.id, status: 'cancelled' }); }
      else { summary.failed++; emit({ id: it.id, status: 'error', error: friendlyError(e) }); }
    }
  };

  // Pistas: vídeo um ou dois por vez (já usa todos os núcleos ou a GPU), imagem e áudio vários por vez,
  // e a IA numa pista própria (fotos primeiro, depois vídeos, um de cada vez na placa de vídeo).
  const heavy = prepared.filter((j) => j.kind === 'video' && !j.ai);
  const light = prepared.filter((j) => j.kind !== 'video' && !j.ai);
  const lane = lanes();
  const aiLane = (async () => {
    await pool(aiImages, batchRun ? 2 : 1, runOne);
    await pool(aiVideos, 1, runOne);
  })();
  try {
    await Promise.all([pool(heavy, lane.video, runOne), pool(light, lane.light, runOne), aiLane, batchRun]);
  } finally {
    batches.delete(key);
    for (const p of reserved) reservedGlobal.delete(p);
  }
  return {
    done: summary.done, failed: summary.failed, cancelled: summary.cancelled,
    inBytes: summary.inBytes, outBytes: summary.outBytes, folders: [...summary.folders],
    seconds: (Date.now() - started) / 1000,
  };
}

// Quantas conversões rodam juntas, pelo tamanho do processador e pela placa de vídeo.
// Vídeo na GPU aguenta 2 sessões em paralelo; no processador, 1 (o FFmpeg já usa todos os núcleos).
function lanes() {
  const cores = Math.max(1, os.cpus().length);
  return {
    video: hw && hw.h264 ? 2 : 1,
    light: Math.max(2, Math.min(8, Math.round(cores / 3))),
    cores,
  };
}

function cancel(key = 'default') { const c = batches.get(key); if (c) c.abort(); }
function cancelAll() { for (const c of batches.values()) c.abort(); }
function isBusy(key = 'default') { return batches.has(key); }
function busyCount() { return batches.size; }
// Fechou o app no meio: apaga na hora o que ficou pela metade (chamado depois de matar o FFmpeg).
function cleanupPartials() {
  for (const p of inFlight) { try { fs.unlinkSync(p); } catch {} }
  inFlight.clear();
}

module.exports = { setHardware, addPaths, remove, thumb, estimate, capabilities, convertAll, cancel, cancelAll, isBusy, busyCount, cleanupPartials, lanes, expandPaths, items };
