'use strict';
// Conversão de imagens com sharp (libvips): mozjpeg, PNG com redução de cores, WebP, AVIF, TIFF, GIF.
// BMP e ICO são lidos via FFmpeg e escritos aqui mesmo.
const fs = require('node:fs');
const sharp = require('sharp');
const ff = require('./ffmpeg');

sharp.cache(false);

const SHARP_CANT_READ = new Set(['bmp', 'ico']);

function lossless(s) { return s.objective === 'lossless'; }

// Qual parte das opções vale pra cada destino (a tela usa isso pra travar o slider).
function capabilities(target, s) {
  if (['tiff', 'bmp', 'ico'].includes(target)) return { slider: false, note: target === 'ico' ? 'Ícone com 7 tamanhos, de 16 a 256 px.' : `${target.toUpperCase()} é sem perda. O tamanho só muda com a resolução.` };
  if (target === 'png' && lossless(s)) return { slider: false, note: 'PNG sem perda: só compacta, cada pixel fica igual.' };
  if ((target === 'webp' || target === 'avif') && lossless(s)) return { slider: false, note: `${target === 'webp' ? 'WebP' : 'AVIF'} sem perda: cada pixel fica igual.` };
  return { slider: true, note: null };
}

async function probeImage(file, ext) {
  const size = fs.statSync(file).size;
  if (SHARP_CANT_READ.has(ext)) {
    const info = await ff.probe(file);
    const v = info.video || {};
    return { width: v.width || 0, height: v.height || 0, pages: 1, hasAlpha: true, size, orientation: 1 };
  }
  const m = await sharp(file, { failOn: 'none', limitInputPixels: false, density: ext === 'svg' ? 192 : undefined }).metadata();
  let w = m.width || 0, h = m.pageHeight && m.pages > 1 ? m.pageHeight : m.height || 0;
  if (m.orientation && m.orientation >= 5) [w, h] = [h, w];
  return { width: w, height: h, pages: m.pages || 1, hasAlpha: !!m.hasAlpha, size, orientation: m.orientation || 1, density: m.density };
}

function resizedDims(w, h, resize) {
  if (!resize || resize === 'original') return { w, h };
  const R = Number(resize);
  const long = Math.max(w, h);
  if (long <= R) return { w, h };
  const k = R / long;
  return { w: Math.max(1, Math.round(w * k)), h: Math.max(1, Math.round(h * k)) };
}

async function inputFor(file, ext) {
  if (SHARP_CANT_READ.has(ext)) return ff.decodeToPng(file);
  return file;
}

function baseImage(input, ext, info, target, s) {
  const animated = (target === 'webp' || target === 'gif') && info.pages > 1;
  let img = sharp(input, { animated, failOn: 'none', limitInputPixels: false, density: ext === 'svg' ? 192 : undefined });
  img = typeof img.autoOrient === 'function' ? img.autoOrient() : img.rotate();
  if (s.resize && s.resize !== 'original') {
    const R = Number(s.resize);
    img = img.resize({ width: R, height: R, fit: 'inside', withoutEnlargement: true });
  }
  if (!s.stripMetadata) img = img.keepMetadata();
  return img;
}

function encodeOptions(target, s) {
  const q = Math.max(1, Math.min(100, Math.round(s.quality)));
  switch (target) {
    case 'jpg':
      return lossless(s)
        ? { quality: 95, mozjpeg: true, chromaSubsampling: '4:4:4' }
        : { quality: Math.max(5, q), mozjpeg: true, chromaSubsampling: q >= 90 ? '4:4:4' : '4:2:0' };
    case 'png':
      return lossless(s)
        ? { compressionLevel: 9, adaptiveFiltering: true, palette: false }
        : { compressionLevel: 9, palette: true, quality: Math.max(5, q), colours: q >= 95 ? 256 : Math.round(24 + (q / 100) * 232), dither: 1.0, effort: 8 };
    case 'webp':
      return lossless(s) ? { lossless: true, effort: 4 } : { quality: q, effort: 4, smartSubsample: q >= 80 };
    case 'avif': {
      const aq = q <= 80 ? Math.round(q * 0.75) : Math.round(60 + (q - 80) * 1.5);
      return lossless(s) ? { lossless: true, effort: 4 } : { quality: Math.max(1, aq), effort: 4, chromaSubsampling: q >= 90 ? '4:4:4' : '4:2:0' };
    }
    case 'tiff':
      return { compression: 'lzw', predictor: 'horizontal' };
    case 'gif':
      return { colours: Math.max(8, Math.min(256, Math.round(8 + q * 2.48))), effort: 7, dither: 1.0 };
    default:
      return {};
  }
}

// ---------- ICO e BMP (escritos à mão) ----------

async function buildIco(img) {
  const base = await img.png().toBuffer();
  const meta = await sharp(base).metadata();
  const maxSide = Math.min(256, Math.max(meta.width, meta.height));
  const sizes = [16, 24, 32, 48, 64, 128, 256].filter((z) => z <= Math.max(16, maxSide));
  const pngs = await Promise.all(sizes.map((z) => sharp(base)
    .resize(z, z, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png({ compressionLevel: 9 }).toBuffer()));
  const header = Buffer.alloc(6 + 16 * sizes.length);
  header.writeUInt16LE(0, 0); header.writeUInt16LE(1, 2); header.writeUInt16LE(sizes.length, 4);
  let offset = header.length;
  sizes.forEach((z, i) => {
    const e = 6 + i * 16;
    header.writeUInt8(z >= 256 ? 0 : z, e);
    header.writeUInt8(z >= 256 ? 0 : z, e + 1);
    header.writeUInt8(0, e + 2); header.writeUInt8(0, e + 3);
    header.writeUInt16LE(1, e + 4); header.writeUInt16LE(32, e + 6);
    header.writeUInt32LE(pngs[i].length, e + 8); header.writeUInt32LE(offset, e + 12);
    offset += pngs[i].length;
  });
  return Buffer.concat([header, ...pngs]);
}

async function buildBmp(img) {
  const { data, info } = await img.flatten({ background: '#ffffff' }).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: w, height: h, channels } = info;
  const row = Math.ceil((w * 3) / 4) * 4;
  const imageSize = row * h;
  const out = Buffer.alloc(54 + imageSize);
  out.write('BM', 0, 'ascii');
  out.writeUInt32LE(54 + imageSize, 2); out.writeUInt32LE(54, 10);
  out.writeUInt32LE(40, 14); out.writeInt32LE(w, 18); out.writeInt32LE(h, 22);
  out.writeUInt16LE(1, 26); out.writeUInt16LE(24, 28); out.writeUInt32LE(0, 30);
  out.writeUInt32LE(imageSize, 34); out.writeInt32LE(2835, 38); out.writeInt32LE(2835, 42);
  for (let y = 0; y < h; y++) {
    const src = (h - 1 - y) * w * channels;
    const dst = 54 + y * row;
    for (let x = 0; x < w; x++) {
      const s = src + x * channels, d = dst + x * 3;
      out[d] = data[s + 2]; out[d + 1] = data[s + 1]; out[d + 2] = data[s];
    }
  }
  return out;
}

// Converte e devolve o arquivo final em memória.
async function encodeImage(file, ext, info, target, s) {
  const input = await inputFor(file, ext);
  let img = baseImage(input, ext, info, target, s);
  if (target === 'ico') return buildIco(img);
  if (target === 'bmp') return buildBmp(img);
  if (target === 'jpg') img = img.flatten({ background: '#ffffff' });
  const opts = encodeOptions(target, s);
  const fmt = { jpg: 'jpeg', tiff: 'tiff', png: 'png', webp: 'webp', avif: 'avif', gif: 'gif' }[target];
  if (!fmt) throw new Error(`Formato de imagem não suportado: ${target}`);
  return img.toFormat(fmt, opts).toBuffer();
}

// Tamanho final sem gravar arquivo. BMP é calculado; o resto é codificado de verdade.
async function estimateImage(file, ext, info, target, s) {
  if (target === 'bmp') {
    const { w, h } = resizedDims(info.width, info.height, s.resize);
    return 54 + Math.ceil((w * 3) / 4) * 4 * h;
  }
  const buf = await encodeImage(file, ext, info, target, s);
  return buf.length;
}

async function convertImage(file, ext, info, target, s, outPath) {
  const buf = await encodeImage(file, ext, info, target, s);
  await fs.promises.writeFile(outPath, buf);
  return buf.length;
}

async function thumbnail(file, ext, size = 160) {
  const input = await inputFor(file, ext);
  return sharp(input, { failOn: 'none', limitInputPixels: false, density: ext === 'svg' ? 96 : undefined })
    .autoOrient()
    .resize(size, size, { fit: 'cover' })
    .webp({ quality: 72, alphaQuality: 80 }).toBuffer();
}

module.exports = { probeImage, estimateImage, convertImage, thumbnail, capabilities, resizedDims };
