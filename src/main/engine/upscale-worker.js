'use strict';
// Processo separado da "Qualidade máxima": roda o UltraSharp V2 no ONNX Runtime em blocos,
// pra foto de qualquer tamanho caber na memória da placa de vídeo. Recebe { cmd:'run', id, model, input, output }.
const ort = require('onnxruntime-node');
const sharp = require('sharp');

sharp.cache(false);
const port = process.parentPort || null;
const send = (m) => (port ? port.postMessage(m) : process.send(m));
const onMessage = (fn) => (port ? port.on('message', (e) => fn(e.data)) : process.on('message', fn));

const T = 256; // bloco de entrada
const OV = 16; // sobreposição entre blocos (some na emenda)
const S = 4; // o modelo aumenta 4x

let session = null;
let sessionKey = '';
let loading = null; // Promise do modelo abrindo (duas janelas pedindo juntas abrem uma vez só)
let provider = '';
const cancelled = new Set();

// Windows: DirectML (qualquer placa AMD, NVIDIA ou Intel). Mac: CoreML. Se a placa falhar, processador.
function providers(onlyCpu) {
  if (onlyCpu) return ['cpu'];
  if (process.platform === 'win32') return ['dml', 'cpu'];
  if (process.platform === 'darwin') return ['coreml', 'cpu'];
  return ['cpu'];
}

function load(model, onlyCpu = false) {
  const key = `${model}|${onlyCpu ? 'cpu' : 'auto'}`;
  if (session && sessionKey === key) return Promise.resolve(session);
  if (loading && loading.key === key) return loading.p;
  const p = (async () => {
    if (session) { try { await session.release(); } catch {} session = null; }
    let lastErr = null;
    for (const ep of providers(onlyCpu)) {
      try {
        const s = await ort.InferenceSession.create(model, { executionProviders: [ep], graphOptimizationLevel: 'all' });
        session = s; sessionKey = key; provider = ep;
        return s;
      } catch (e) { lastErr = e; }
    }
    throw lastErr || new Error('Não consegui abrir o modelo de IA.');
  })().finally(() => { if (loading && loading.p === p) loading = null; });
  loading = { key, p };
  return p;
}

function starts(len) {
  if (len <= T) return [0];
  const step = T - 2 * OV;
  const xs = [];
  for (let x = 0; ; x += step) {
    if (x + T >= len) { xs.push(len - T); break; }
    xs.push(x);
  }
  return [...new Set(xs)];
}

// A placa abriu o modelo mas falhou no meio (memória, driver): tenta de novo no processador, uma vez.
let forceCpu = false;
async function run(m) {
  try { return await runWith(m, forceCpu); } catch (e) {
    if ((e && e.cancelled) || forceCpu || provider === 'cpu') throw e;
    forceCpu = true;
    return runWith(m, true);
  }
}

async function runWith({ id, model, input, output }, onlyCpu) {
  const sess = await load(model, onlyCpu);
  const inName = sess.inputNames[0];
  const outName = sess.outputNames[0];
  const { data, info } = await sharp(input, { limitInputPixels: false }).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const W = info.width, H = info.height, OW = W * S, OH = H * S;
  const out = Buffer.alloc(OW * OH * 3);
  const ys = starts(H), xs = starts(W);
  const total = ys.length * xs.length;
  const tw = Math.min(T, W), th = Math.min(T, H);
  const buf = new Float32Array(3 * T * T);
  let done = 0;
  for (const y0 of ys) {
    for (const x0 of xs) {
      if (cancelled.has(id)) { cancelled.delete(id); throw Object.assign(new Error('Cancelado'), { cancelled: true }); }
      // Bloco de entrada (bordas repetem o último pixel quando a imagem é menor que o bloco).
      for (let y = 0; y < T; y++) {
        const sy = Math.min(H - 1, y0 + y);
        for (let x = 0; x < T; x++) {
          const si = (sy * W + Math.min(W - 1, x0 + x)) * 3;
          const di = y * T + x;
          buf[di] = data[si] / 255; buf[T * T + di] = data[si + 1] / 255; buf[2 * T * T + di] = data[si + 2] / 255;
        }
      }
      const res = await sess.run({ [inName]: new ort.Tensor('float32', buf, [1, 3, T, T]) });
      const o = res[outName].data;
      const OT = T * S, PL = OT * OT;
      // Só a parte útil do bloco: corta a sobreposição, menos nas bordas da imagem.
      const ux0 = x0 === 0 ? 0 : OV, uy0 = y0 === 0 ? 0 : OV;
      const ux1 = x0 + tw >= W ? tw : T - OV, uy1 = y0 + th >= H ? th : T - OV;
      for (let y = uy0 * S; y < uy1 * S; y++) {
        const gy = y0 * S + y;
        if (gy >= OH) continue;
        for (let x = ux0 * S; x < ux1 * S; x++) {
          const gx = x0 * S + x;
          if (gx >= OW) continue;
          const si = y * OT + x, di = (gy * OW + gx) * 3;
          const r = o[si] * 255, g = o[PL + si] * 255, b = o[2 * PL + si] * 255;
          out[di] = r < 0 ? 0 : r > 255 ? 255 : Math.round(r);
          out[di + 1] = g < 0 ? 0 : g > 255 ? 255 : Math.round(g);
          out[di + 2] = b < 0 ? 0 : b > 255 ? 255 : Math.round(b);
        }
      }
      if (typeof res[outName].dispose === 'function') res[outName].dispose();
      done++;
      send({ id, progress: done / total });
    }
  }
  await sharp(out, { raw: { width: OW, height: OH, channels: 3 }, limitInputPixels: false }).png({ compressionLevel: 1 }).toFile(output);
  return { provider };
}

onMessage(async (m) => {
  if (!m || !m.cmd) return;
  if (m.cmd === 'cancel') { cancelled.add(m.id); return; }
  if (m.cmd === 'run') {
    try { const r = await run(m); send({ id: m.id, done: true, provider: r.provider }); } catch (e) {
      send({ id: m.id, error: e && e.cancelled ? 'Cancelado' : String((e && e.message) || e), cancelled: !!(e && e.cancelled) });
    }
  }
});
