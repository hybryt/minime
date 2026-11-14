'use strict';
// "Aumentar com IA" até 4K.
//   Padrão (foto) e vídeo: Real-ESRGAN pelo realesrgan-ncnn-vulkan (placa de vídeo via Vulkan).
//   Qualidade máxima (foto): UltraSharp V2 pelo ONNX Runtime (DirectML no Windows, CoreML no Mac),
//   num processo separado (upscale-worker.js) pra não travar o app.
const fs = require('node:fs');
const path = require('node:path');
const { spawn, fork } = require('node:child_process');
const sharp = require('sharp');
const ff = require('./ffmpeg');
const decode = require('./decode');

const EXE = process.platform === 'win32' ? '.exe' : '';
const PLAT = process.platform === 'win32' ? 'win' : process.platform === 'darwin' ? 'mac' : 'linux';
const STANDARD = 'realesrgan-x4plus';
const VIDEO = 'realesr-general-x4v3';
const V2 = '4x-UltraSharpV2.onnx';

// 4K deitado (3840 × 2160) ou em pé (2160 × 3840).
const BOX_LONG = 3840;
const BOX_SHORT = 2160;

let PATHS = null;
function paths() {
  if (PATHS) return PATHS;
  const root = path.join(__dirname, '..', '..', '..');
  const res = process.resourcesPath ? path.join(process.resourcesPath, 'upscale') : null;
  const bins = [res && path.join(res, 'bin'), path.join(root, 'vendor', `upscale-${PLAT}-${process.arch}`)].filter(Boolean);
  const models = [res && path.join(res, 'models'), path.join(root, 'vendor', 'upscale-models')].filter(Boolean);
  PATHS = {
    bin: bins.map((d) => path.join(d, `realesrgan-ncnn-vulkan${EXE}`)).find((f) => fs.existsSync(f)) || null,
    models: models.find((d) => fs.existsSync(path.join(d, `${STANDARD}.param`))) || null,
  };
  return PATHS;
}

// Por que a "Qualidade máxima" não roda aqui (null = roda).
// O ONNX Runtime atual não tem versão pra Mac Intel e, no Apple Silicon, exige macOS 14 (Sonoma).
function maxBlocker() {
  if (process.platform === 'darwin') {
    if (process.arch !== 'arm64') return 'Precisa de um Mac com Apple Silicon (M1 ou mais novo).';
    if (Number(String(require('node:os').release()).split('.')[0]) < 23) return 'Precisa do macOS 14 (Sonoma) ou mais novo.';
  }
  try {
    const pkg = require.resolve('onnxruntime-node/package.json');
    const dir = path.join(path.dirname(pkg), 'bin', 'napi-v6', process.platform, process.arch);
    if (!fs.existsSync(dir.replace('app.asar', 'app.asar.unpacked')) && !fs.existsSync(dir)) return 'Indisponível neste computador.';
  } catch { return 'Indisponível neste computador.'; }
  return null;
}

// Windows sem driver de placa de vídeo com Vulkan: o motor nem abre (e o Windows mostraria um aviso de DLL faltando).
function vulkanMissing() {
  if (process.platform !== 'win32') return false;
  const sys = path.join(process.env.SystemRoot || 'C:\\Windows', 'System32', 'vulkan-1.dll');
  return !fs.existsSync(sys);
}
const NO_VULKAN = 'Esta placa de vídeo não aceita o motor de IA (precisa de Vulkan). Atualize o driver da placa.';

let gpuState = null; // { ok, name, error }
let STATIC = null; // o que não muda enquanto o app está aberto
function available() {
  if (!STATIC) {
    const p = paths();
    const ncnn = !!(p.bin && p.models);
    if (ncnn && vulkanMissing()) gpuState = { ok: false, name: null, error: NO_VULKAN };
    const why = maxBlocker();
    STATIC = {
      ncnn,
      video: ncnn && fs.existsSync(path.join(p.models, `${VIDEO}.param`)),
      max: !!(p.models && fs.existsSync(path.join(p.models, V2))) && !why,
      maxWhy: why || (p.models && fs.existsSync(path.join(p.models, V2)) ? null : 'Indisponível neste computador.'),
    };
  }
  const gpuBad = !!(gpuState && !gpuState.ok);
  return {
    standard: STATIC.ncnn && !gpuBad,
    video: STATIC.video && !gpuBad,
    max: STATIC.max,
    maxWhy: STATIC.maxWhy,
    gpu: gpuState ? gpuState.name : null,
    gpuError: gpuBad ? gpuState.error : null,
  };
}
// O modo escolhido roda neste computador? (a tela desliga o que não roda; o motor segue a mesma regra)
function modeAvailable(mode) {
  const a = available();
  if (mode === 'max') return a.max;
  if (mode === 'video') return a.video;
  return a.standard;
}

// Tamanho final: 4x (ou 2x) limitado ao quadro 4K. null = a imagem já está em 4K ou maior.
function targetDims(w, h, size = '4k') {
  const long = Math.max(w, h), short = Math.min(w, h);
  if (!long || !short) return null;
  const k = Math.min(size === '2x' ? 2 : 4, BOX_LONG / long, BOX_SHORT / short);
  if (k < 1.1) return null;
  return { w: Math.max(1, Math.round(w * k)), h: Math.max(1, Math.round(h * k)), k };
}
const even = (n) => Math.max(2, Math.round(n / 2) * 2);
function targetDimsVideo(w, h) {
  const t = targetDims(w, h, '4k');
  return t ? { w: even(t.w), h: even(t.h), k: t.k } : null;
}

// ---------- Real-ESRGAN (ncnn) ----------

// O binário imprime a lista de placas e o progresso com vírgula ou ponto, conforme o idioma do sistema.
const GPU_LINE = /^\[(\d+) (.+?)\]\s+queueC/;
const PCT = /(\d{1,3})[.,](\d{2})%/g;
const INTEGRATED = /(Radeon\(TM\) Graphics|Radeon Graphics|Intel\(R\) (UHD|HD|Iris)|Microsoft Basic|llvmpipe|SwiftShader)/i;

function pickGpuName(text) {
  const devs = new Map();
  for (const line of text.split(/\r?\n/)) { const m = GPU_LINE.exec(line); if (m) devs.set(Number(m[1]), m[2]); }
  const list = [...devs.values()];
  return list.find((n) => !INTEGRATED.test(n)) || list[0] || null;
}

function runNcnn(args, { signal, onPercent, onStderr } = {}) {
  const p = paths();
  return new Promise((resolve, reject) => {
    if (!p.bin) return reject(new Error('Motor de IA não encontrado nesta instalação.'));
    const child = ff.track(spawn(p.bin, args, { windowsHide: true, cwd: path.dirname(p.bin) }));
    let err = '';
    const onAbort = () => { try { child.kill('SIGKILL'); } catch {} };
    if (signal) { if (signal.aborted) onAbort(); signal.addEventListener('abort', onAbort, { once: true }); }
    child.stdout.on('data', () => {});
    child.stderr.on('data', (d) => {
      const s = d.toString();
      err += s; if (err.length > 40000) err = err.slice(-20000);
      if (onStderr) onStderr(s);
      if (onPercent) { let m, last = null; PCT.lastIndex = 0; while ((m = PCT.exec(s))) last = Number(`${m[1]}.${m[2]}`); if (last !== null) onPercent(Math.min(1, last / 100)); }
    });
    child.on('error', (e) => { if (signal) signal.removeEventListener('abort', onAbort); reject(e); });
    child.on('close', (code) => {
      if (signal) signal.removeEventListener('abort', onAbort);
      if (signal && signal.aborted) return reject(Object.assign(new Error('Cancelado'), { cancelled: true }));
      // 0xC0000135 (3221225781) = DLL não encontrada no Windows; sem nenhuma placa listada também é sem Vulkan.
      const noGpu = /invalid gpu device|vkCreateInstance failed/i.test(err) || code === 3221225781 || code === -1073741515
        || (code !== 0 && !GPU_LINE.test(err.split(/\r?\n/).find((l) => GPU_LINE.test(l)) || ''));
      if (noGpu) {
        gpuState = { ok: false, name: null, error: NO_VULKAN };
        return reject(new Error(gpuState.error));
      }
      if (!gpuState || !gpuState.name) gpuState = { ok: true, name: pickGpuName(err), error: null };
      if (code === 0) resolve(err);
      else reject(new Error(err.trim().split(/\r?\n/).filter((l) => !GPU_LINE.test(l) && !/^\[\d+ /.test(l) && !/%$/.test(l)).slice(-2).join(' | ') || `motor de IA saiu com código ${code}`));
    });
  });
}

function ncnnArgs(input, output, model, format = 'png', threads) {
  const a = ['-i', input, '-o', output, '-n', model, '-s', '4', '-m', paths().models, '-f', format];
  if (threads) a.push('-j', threads);
  return a;
}

// ---------- UltraSharp V2 (ONNX Runtime, processo separado) ----------

let worker = null;
let workerIdle = null;
let reqSeq = 0;
const waiting = new Map(); // id -> { resolve, reject, onProgress }

function startWorker() {
  if (worker) return worker;
  const script = path.join(__dirname, 'upscale-worker.js');
  let electron = null;
  try { electron = require('electron'); } catch {}
  let me = null;
  if (electron && electron.utilityProcess && typeof electron.utilityProcess.fork === 'function') {
    const w = electron.utilityProcess.fork(script, [], { serviceName: 'MINIME IA', stdio: 'ignore' });
    me = { send: (m) => w.postMessage(m), kill: () => { try { w.kill(); } catch {} }, raw: w };
    w.on('message', onWorkerMessage);
    w.on('exit', () => onWorkerExit(me));
  } else {
    // Testes fora do Electron (node puro).
    const w = fork(script, [], { stdio: 'ignore' });
    me = { send: (m) => w.send(m), kill: () => { try { w.kill('SIGKILL'); } catch {} }, raw: w };
    w.on('message', onWorkerMessage);
    w.on('exit', () => onWorkerExit(me));
  }
  worker = me;
  return worker;
}
function onWorkerMessage(m) {
  const r = waiting.get(m.id);
  if (!r) return;
  if (m.progress !== undefined) { if (r.onProgress) r.onProgress(m.progress); return; }
  waiting.delete(m.id);
  if (m.error) r.reject(Object.assign(new Error(m.error), { cancelled: !!m.cancelled }));
  else r.resolve(m);
  scheduleIdle();
}
// Só reage à saída do processo certo: o fechado por inatividade não derruba um novo que já começou.
function onWorkerExit(which) {
  if (worker && worker !== which) return;
  worker = null;
  for (const [, r] of waiting) r.reject(new Error('O processo de IA fechou no meio. Tente de novo.'));
  waiting.clear();
}
// Sem uso por 2 minutos: fecha o processo e devolve a memória da placa de vídeo.
function scheduleIdle() {
  clearTimeout(workerIdle);
  if (waiting.size) return;
  workerIdle = setTimeout(() => { if (worker && !waiting.size) { worker.kill(); worker = null; } }, 120000);
}
function killWorker() { clearTimeout(workerIdle); if (worker) worker.kill(); worker = null; }

function runV2(input, output, { signal, onProgress } = {}) {
  return new Promise((resolve, reject) => {
    if (signal && signal.aborted) return reject(Object.assign(new Error('Cancelado'), { cancelled: true }));
    const w = startWorker();
    clearTimeout(workerIdle);
    const id = ++reqSeq;
    const onAbort = () => w.send({ cmd: 'cancel', id });
    const done = (fn) => (v) => { if (signal) signal.removeEventListener('abort', onAbort); fn(v); };
    waiting.set(id, { resolve: done(resolve), reject: done(reject), onProgress });
    if (signal) signal.addEventListener('abort', onAbort, { once: true });
    w.send({ cmd: 'run', id, model: path.join(paths().models, V2), input, output });
  });
}

// ---------- Foto ----------

// Entrada pro modelo: já girada pela orientação EXIF e sem canal alfa (a transparência volta no final).
async function prepareInput(src, file) {
  await sharp(src, { failOn: 'none', limitInputPixels: false }).autoOrient().removeAlpha().toColourspace('srgb')
    .png({ compressionLevel: 1 }).toFile(file);
}

// Redimensiona a saída 4x pro tamanho final e devolve a transparência do original.
async function finalize(aiOut, src, dims, hasAlpha, file) {
  let img = sharp(aiOut, { limitInputPixels: false }).resize(dims.w, dims.h, { kernel: 'lanczos3', fit: 'fill' });
  if (hasAlpha) {
    const alpha = await sharp(src, { failOn: 'none', limitInputPixels: false }).autoOrient().ensureAlpha().extractChannel('alpha')
      .resize(dims.w, dims.h, { kernel: 'lanczos3', fit: 'fill' }).raw().toBuffer();
    img = sharp(await img.removeAlpha().raw().toBuffer(), { raw: { width: dims.w, height: dims.h, channels: 3 } })
      .joinChannel(alpha, { raw: { width: dims.w, height: dims.h, channels: 1 } });
  }
  await img.png({ compressionLevel: 1 }).toFile(file);
  return file;
}

function notBigger() {
  return new Error('Essa imagem já está em 4K ou maior. Não precisa aumentar.');
}

// Tamanho de verdade depois de girar pela orientação EXIF (não confia no que veio de fora).
async function orientedSize(src) {
  const m = await sharp(src, { failOn: 'none', limitInputPixels: false }).metadata();
  const w = m.width || 0, h = m.pageHeight && m.pages > 1 ? m.pageHeight : m.height || 0;
  return m.orientation && m.orientation >= 5 ? { width: h, height: w, hasAlpha: !!m.hasAlpha } : { width: w, height: h, hasAlpha: !!m.hasAlpha };
}

// Uma foto: devolve { file, dims, cleanup }. file é um PNG no tamanho final, pronto pra codificar.
async function upscaleImage({ src, mode = 'standard', size = '4k', signal, onProgress }) {
  const { width, height, hasAlpha } = await orientedSize(src);
  const dims = targetDims(width, height, size);
  if (!dims) throw notBigger();
  const av = available();
  if (mode === 'max' && !av.max) throw new Error(`A qualidade máxima não roda neste computador. ${av.maxWhy || ''}`.trim());
  if (mode !== 'max' && !av.standard) throw new Error(av.gpuError || 'O motor de IA não está disponível nesta instalação.');
  const dir = decode.workDir('foto');
  const cleanup = () => { try { fs.rmSync(dir, { recursive: true, force: true }); } catch {} };
  try {
    const inp = path.join(dir, 'in.png');
    const out = path.join(dir, 'ai.png');
    await prepareInput(src, inp);
    const step = (p) => { if (onProgress) onProgress(Math.min(0.9, p * 0.9)); };
    if (mode === 'max') await runV2(inp, out, { signal, onProgress: step });
    else await runNcnn(ncnnArgs(inp, out, STANDARD), { signal, onPercent: step });
    if (!fs.existsSync(out)) throw new Error('O motor de IA não gerou a imagem.');
    const file = await finalize(out, src, dims, hasAlpha, path.join(dir, 'final.png'));
    try { fs.unlinkSync(inp); fs.unlinkSync(out); } catch {}
    return { file, dims, cleanup };
  } catch (e) { cleanup(); throw e; }
}

// Várias fotos no modo padrão de uma vez: o motor abre uma vez só (economiza uns 3 s por foto).
// entries: [{ key, src }]. onReady(key, { file, dims, cleanup }) a cada foto pronta.
async function upscaleBatch(entries, { size = '4k', signal, onProgress, onReady, onError } = {}) {
  const av = available();
  if (!av.standard) throw new Error(av.gpuError || 'O motor de IA não está disponível nesta instalação.');
  const dir = decode.workDir('lote');
  const inDir = path.join(dir, 'in');
  const outDir = path.join(dir, 'out');
  fs.mkdirSync(inDir); fs.mkdirSync(outDir);
  const list = [];
  for (const [i, e] of entries.entries()) {
    if (signal && signal.aborted) break;
    try {
      const sz = await orientedSize(e.src);
      const dims = targetDims(sz.width, sz.height, size);
      if (!dims) { onError(e.key, notBigger()); continue; }
      const name = String(i).padStart(5, '0');
      await prepareInput(e.src, path.join(inDir, `${name}.png`));
      list.push({ ...e, hasAlpha: sz.hasAlpha, dims, name });
    } catch (err) { onError(e.key, err); }
  }
  const pending = new Map(list.map((e) => [e.name, e]));
  // O motor grava cada PNG ao terminar a foto: entrega o que já tem o fim do arquivo (bloco IEND) gravado.
  const finishOne = async (e) => {
    pending.delete(e.name);
    const file = path.join(outDir, `${e.name}.png`);
    const one = decode.workDir('foto');
    try {
      const final = await finalize(file, e.src, e.dims, e.hasAlpha, path.join(one, 'final.png'));
      try { fs.unlinkSync(file); fs.unlinkSync(path.join(inDir, `${e.name}.png`)); } catch {}
      onReady(e.key, { file: final, dims: e.dims, cleanup: () => { try { fs.rmSync(one, { recursive: true, force: true }); } catch {} } });
    } catch (err) { try { fs.rmSync(one, { recursive: true, force: true }); } catch {} onError(e.key, err); }
  };
  const tasks = [];
  const sweep = () => {
    for (const e of [...pending.values()]) {
      if (pngComplete(path.join(outDir, `${e.name}.png`))) tasks.push(finishOne(e));
    }
  };
  let timer = null;
  try {
    if (list.length) {
      timer = setInterval(sweep, 400);
      await runNcnn(ncnnArgs(inDir, outDir, STANDARD, 'png', '2:1:2'), {
        signal,
        onPercent: (p) => {
          const first = list.find((e) => pending.has(e.name));
          if (first && onProgress) onProgress(first.key, p);
        },
      });
      clearInterval(timer); timer = null;
      sweep();
      for (const e of [...pending.values()]) { pending.delete(e.name); onError(e.key, new Error('O motor de IA não gerou a imagem.')); }
    }
    await Promise.all(tasks);
  } finally {
    if (timer) clearInterval(timer);
    try { fs.rmSync(dir, { recursive: true, force: true }); } catch {}
  }
}

// PNG completo termina com o bloco IEND (12 bytes: tamanho 0, "IEND", CRC).
function pngComplete(file) {
  let fd = null;
  try {
    const st = fs.statSync(file);
    if (st.size < 60) return false;
    fd = fs.openSync(file, 'r');
    const b = Buffer.alloc(8);
    fs.readSync(fd, b, 0, 8, st.size - 8);
    return b.toString('latin1', 0, 4) === 'IEND';
  } catch { return false; } finally { if (fd !== null) try { fs.closeSync(fd); } catch {} }
}

// Estimativa de tamanho sem rodar a IA: amplia com lanczos (o resultado da IA tem mais detalhe, então é aproximado).
async function proxyImage(src, _hasAlpha, size) {
  const { width, height, hasAlpha } = await orientedSize(src);
  const dims = targetDims(width, height, size);
  if (!dims) throw notBigger();
  const buf = await sharp(src, { failOn: 'none', limitInputPixels: false }).autoOrient()
    .resize(dims.w, dims.h, { kernel: 'lanczos3', fit: 'fill' })[hasAlpha ? 'ensureAlpha' : 'removeAlpha']()
    .png({ compressionLevel: 1 }).toBuffer();
  return { buffer: buf, dims };
}

function killAll() { killWorker(); }

module.exports = {
  paths, available, modeAvailable, targetDims, targetDimsVideo, runNcnn, ncnnArgs, upscaleImage, upscaleBatch, proxyImage,
  killAll, STANDARD, VIDEO, BOX_LONG, BOX_SHORT, pickGpuName,
};
