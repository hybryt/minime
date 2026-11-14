'use strict';
// Foto RAW de câmera (fase 1): em vez de revelar o RAW, pega o JPEG de prévia que a
// própria câmera grava dentro do arquivo. Acha todos os JPEGs embutidos, fica com o
// maior que o sharp abre e descobre a orientação (EXIF do próprio JPEG ou a do RAW).
const fs = require('node:fs');
const sharp = require('sharp');

const RAW_EXTS = [
  'cr2', 'cr3', 'crw', 'nef', 'nrw', 'arw', 'srf', 'sr2', 'dng', 'raf', 'orf', 'rw2',
  'pef', 'srw', '3fr', 'iiq', 'erf', 'mef', 'mos', 'kdc', 'dcr', 'x3f',
];

const NO_PREVIEW = 'Não achei uma imagem de prévia dentro desse RAW.';
const MIN_BYTES = 50 * 1024; // abaixo disso é miniatura: só entra se não tiver outra
const MAX_TRIES = 4;         // no máximo isso de candidatas passa pelo sharp
const SOI = Buffer.from([0xff, 0xd8, 0xff]);

// Tamanho em bytes de cada tipo de campo TIFF.
const TIFF_TYPE_SIZE = [0, 1, 1, 2, 4, 8, 1, 1, 2, 4, 8, 4, 8, 4, 0, 0, 8, 8, 8];

// ---------- JPEG ----------

// Percorre os segmentos a partir do SOI até o EOI de verdade. O APP1 do EXIF costuma
// trazer uma miniatura com EOI próprio; pulando segmento por tamanho ele não engana.
// Devolve null se não serve de prévia (RAW em JPEG sem perda, 12/16 bits, lixo).
// end = -1 quando o cabeçalho é bom mas não deu pra achar o fim.
function parseJpeg(buf, start, limit) {
  let p = start + 2;
  let frame = null, exif = null, scans = 0;
  while (p + 2 <= limit) {
    if (buf[p] !== 0xff) break;
    let m = buf[p + 1];
    while (m === 0xff && p + 2 < limit) m = buf[++p + 1]; // bytes de preenchimento
    if (m === 0xd9) {
      if (frame && scans) return { start, end: p + 2, ...frame, exif };
      break;
    }
    if (m === 0xd8 || m === 0x00) break;
    if ((m >= 0xd0 && m <= 0xd7) || m === 0x01) { p += 2; continue; }
    if (p + 4 > limit) break;
    const len = buf.readUInt16BE(p + 2);
    if (len < 2 || p + 2 + len > limit) break;
    if (m >= 0xc0 && m <= 0xcf && m !== 0xc4 && m !== 0xc8 && m !== 0xcc) {
      // SOF: só baseline, estendido e progressivo de 8 bits. SOF3 etc. é o próprio RAW.
      if (m > 0xc2 || frame || len < 8 || buf[p + 4] !== 8) return null;
      const height = buf.readUInt16BE(p + 5), width = buf.readUInt16BE(p + 7), comps = buf[p + 9];
      if (!width || !height || (comps !== 1 && comps !== 3)) return null;
      frame = { width, height };
    } else if (m === 0xe1 && !exif && len >= 16 && buf.toString('latin1', p + 4, p + 10) === 'Exif\0\0') {
      exif = { start: p + 10, end: p + 2 + len };
    }
    p += 2 + len;
    if (m === 0xda) {
      if (!frame) return null;
      scans++;
      // Dados comprimidos: FF00 é byte escapado e FFD0..FFD7 é RST; outro FFxx é marcador.
      for (;;) {
        p = buf.indexOf(0xff, p);
        if (p < 0 || p + 1 >= limit) return { start, end: -1, ...frame, exif };
        const x = buf[p + 1];
        if (x === 0x00 || (x >= 0xd0 && x <= 0xd7)) p += 2;
        else if (x === 0xff) p += 1;
        else break;
      }
    }
  }
  return frame ? { start, end: -1, ...frame, exif } : null;
}

// ---------- TIFF (CR2, NEF, ARW, DNG, ORF, RW2, PEF, CMT1 do CR3, EXIF do JPEG...) ----------

function tiffReader(buf, base, end) {
  const le = buf[base] === 0x49;
  return {
    base, end,
    u16: (o) => (o >= 0 && o + 2 <= end ? (le ? buf.readUInt16LE(o) : buf.readUInt16BE(o)) : 0),
    u32: (o) => (o >= 0 && o + 4 <= end ? (le ? buf.readUInt32LE(o) : buf.readUInt32BE(o)) : 0),
  };
}

// Lê uma IFD. Cada tag vira { type, count, at } (at = posição absoluta do valor).
function readIfd(r, off) {
  const pos = r.base + off;
  if (off < 8 || pos + 2 > r.end) return null;
  const n = r.u16(pos);
  if (!n || n > 1000 || pos + 2 + n * 12 > r.end) return null;
  const tags = new Map();
  for (let i = 0; i < n; i++) {
    const e = pos + 2 + i * 12;
    const type = r.u16(e + 2), count = r.u32(e + 4);
    const size = (TIFF_TYPE_SIZE[type] || 1) * count;
    tags.set(r.u16(e), { type, count, at: size <= 4 ? e + 8 : r.base + r.u32(e + 8) });
  }
  return { tags, next: r.u32(pos + 2 + n * 12) };
}

function tagValues(r, t, max) {
  if (!t) return [];
  const out = [];
  const n = Math.min(t.count, max || 1);
  for (let i = 0; i < n; i++) {
    if (t.type === 3 || t.type === 8) out.push(r.u16(t.at + i * 2));
    else if (t.type === 4 || t.type === 9 || t.type === 13) out.push(r.u32(t.at + i * 4));
    else break;
  }
  return out;
}

function tagValue(r, t) {
  return tagValues(r, t, 1)[0];
}

function validOrientation(v) {
  return Number.isInteger(v) && v >= 1 && v <= 8 ? v : 0;
}

// Só a orientação da IFD0 (usado no EXIF do JPEG de prévia).
function tiffOrientation(buf, start, end) {
  if (end - start < 8) return 0;
  const r = tiffReader(buf, start, end);
  const ifd = readIfd(r, r.u32(start + 4));
  return ifd ? validOrientation(tagValue(r, ifd.tags.get(0x0112))) : 0;
}

// Varre IFD0, a cadeia de IFDs e as SubIFDs: orientação + JPEGs com endereço explícito.
function parseTiffRaw(buf, base, end, firstIfd, info) {
  const r = tiffReader(buf, base, end);
  const seen = new Set();
  const queue = [{ off: firstIfd, chain: true }];
  let first = true;
  while (queue.length && seen.size < 64) {
    const { off, chain } = queue.shift();
    if (seen.has(off)) continue;
    seen.add(off);
    const ifd = readIfd(r, off);
    if (!ifd) continue;
    const t = ifd.tags;
    if (first) {
      first = false;
      const o = validOrientation(tagValue(r, t.get(0x0112)));
      if (o && !info.orientation) info.orientation = o;
    }
    // JPEGInterchangeFormat / Length (ARW, NEF, DNG, miniaturas)
    const jOff = tagValue(r, t.get(0x0201)), jLen = tagValue(r, t.get(0x0202));
    if (jOff && jLen) info.explicit.push({ off: base + jOff, len: jLen });
    // Faixa única de dados (CR2 IFD0, prévia do DNG)
    const strips = t.get(0x0111), counts = t.get(0x0117);
    if (strips && counts && strips.count === 1) {
      info.explicit.push({ off: base + tagValue(r, strips), len: tagValue(r, counts) });
    }
    // JpgFromRaw do Panasonic RW2 (tag 0x2E, bloco inteiro dentro da tag)
    const rw2 = t.get(0x002e);
    if (rw2 && rw2.type === 7 && rw2.count > 1000) info.explicit.push({ off: rw2.at, len: rw2.count });
    const photometric = tagValue(r, t.get(0x0106));
    const width = tagValue(r, t.get(0x0100)), height = tagValue(r, t.get(0x0101));
    if (photometric === 32803 || photometric === 34892) {
      // Imagem RAW principal (CFA ou LinearRaw): JPEG que comece aí dentro nunca é prévia
      const offs = tagValues(r, t.get(0x0144) || strips, 100000);
      const lens = tagValues(r, t.get(0x0145) || counts, 100000);
      offs.forEach((o, i) => info.exclude.push([base + o, base + o + (lens[i] || 1)]));
    } else if (photometric === 2 && tagValue(r, t.get(0x0103)) === 1 && width && height && strips && counts) {
      // RGB 8 bits sem compressão (o IIQ da Phase One só tem isso): reserva se não houver JPEG
      const bits = tagValues(r, t.get(0x0102), 3);
      if (tagValue(r, t.get(0x0115)) === 3 && bits.every((b) => b === 8) && tagValue(r, t.get(0x011c)) !== 2) {
        info.rgb.push({ width, height, offs: tagValues(r, strips, 100000).map((o) => base + o), lens: tagValues(r, counts, 100000) });
      }
    }
    for (const sub of tagValues(r, t.get(0x014a), 32)) queue.push({ off: sub, chain: false });
    if (chain && ifd.next) queue.push({ off: ifd.next, chain: true });
  }
}

// ---------- CR3 (ISO-BMFF) ----------

const CANON_UUID = '85c0b687820f11e08111f4ce462b6a48';

function walkBoxes(buf, start, end, visit) {
  let p = start;
  while (p + 8 <= end) {
    let size = buf.readUInt32BE(p), hdr = 8;
    const type = buf.toString('latin1', p + 4, p + 8);
    if (size === 1) {
      if (p + 16 > end) return;
      size = Number(buf.readBigUInt64BE(p + 8));
      hdr = 16;
    } else if (size === 0) size = end - p;
    if (size < hdr || p + size > end) return;
    visit(type, p + hdr, p + size);
    p += size;
  }
}

function parseCr3(buf, info) {
  const visit = (type, s, e) => {
    if (type === 'moov' || type === 'mdia' || type === 'minf') walkBoxes(buf, s, e, visit);
    else if (type === 'uuid' && e - s > 16 && buf.toString('hex', s, s + 16) === CANON_UUID) walkBoxes(buf, s + 16, e, visit);
    else if (type === 'CMT1') parseTiffRaw(buf, s, e, tiffReader(buf, s, e).u32(s + 4), info);
    else if (type === 'trak') {
      // Cada trilha aponta pro seu bloco no mdat; a primeira costuma ser o JPEG grande.
      const tr = {};
      const inner = (t2, s2, e2) => {
        if (t2 === 'mdia' || t2 === 'minf' || t2 === 'stbl') walkBoxes(buf, s2, e2, inner);
        else if (t2 === 'stsz' && e2 - s2 >= 16) tr.len = buf.readUInt32BE(s2 + 4) || buf.readUInt32BE(s2 + 12);
        else if (t2 === 'co64' && e2 - s2 >= 16) tr.off = Number(buf.readBigUInt64BE(s2 + 8));
        else if (t2 === 'stco' && e2 - s2 >= 12) tr.off = buf.readUInt32BE(s2 + 8);
      };
      walkBoxes(buf, s, e, inner);
      if (tr.off && tr.len) info.explicit.push({ off: tr.off, len: tr.len });
    }
  };
  walkBoxes(buf, 0, buf.length, visit);
}

// ---------- CRW (Canon CIFF, câmeras antigas) ----------

function parseCiff(buf, start, end, le, info, depth) {
  if (depth > 4 || end - start < 6) return;
  const u16 = (o) => (le ? buf.readUInt16LE(o) : buf.readUInt16BE(o));
  const u32 = (o) => (le ? buf.readUInt32LE(o) : buf.readUInt32BE(o));
  const table = start + u32(end - 4);
  if (table < start || table + 2 > end) return;
  const n = u16(table);
  for (let i = 0; i < n && table + 12 + i * 10 <= end; i++) {
    const e = table + 2 + i * 10;
    const tag = u16(e), size = u32(e + 2), off = start + u32(e + 6);
    if (tag & 0xc000 || off + size > end) continue; // valor guardado na própria entrada
    const kind = tag & 0x3800, id = tag & 0x3fff;
    if (kind === 0x2800 || kind === 0x3000) parseCiff(buf, off, off + size, le, info, depth + 1);
    else if (id === 0x2005) info.exclude.push([off, off + size]); // RawData: tem falso JPEG dentro
    else if (id === 0x2007) info.explicit.push({ off, len: size }); // JpgFromRaw
    else if (id === 0x1810 && size >= 16 && !info.orientation) {
      const rot = (((le ? buf.readInt32LE(off + 12) : buf.readInt32BE(off + 12)) % 360) + 360) % 360;
      info.orientation = { 0: 1, 90: 6, 180: 3, 270: 8 }[rot] || 0;
    }
  }
}

// ---------- contêiner ----------

// Lê o que o formato informa: orientação e endereços de JPEG. A varredura vem depois.
function readContainer(buf) {
  const info = { orientation: 0, explicit: [], exclude: [], rgb: [] };
  if (buf.length < 16) return info;
  const head = buf.toString('latin1', 0, 4);
  try {
    if (head === 'II*\0' || head === 'MM\0*' || head === 'IIRO' || head === 'IIRS' || head === 'MMOR' || head === 'IIU\0') {
      parseTiffRaw(buf, 0, buf.length, tiffReader(buf, 0, buf.length).u32(4), info);
    } else if (buf.toString('latin1', 4, 8) === 'ftyp') {
      parseCr3(buf, info);
    } else if (buf.toString('latin1', 0, 15) === 'FUJIFILMCCD-RAW' && buf.length > 92) {
      info.explicit.push({ off: buf.readUInt32BE(84), len: buf.readUInt32BE(88) });
    } else if ((head.startsWith('II') || head.startsWith('MM')) && buf.toString('latin1', 6, 14) === 'HEAPCCDR') {
      const le = buf[0] === 0x49;
      parseCiff(buf, le ? buf.readUInt32LE(2) : buf.readUInt32BE(2), buf.length, le, info, 0);
    }
  } catch {
    // contêiner estranho: a varredura de JPEG resolve sozinha
  }
  return info;
}

function collectJpegs(buf, info) {
  const found = new Map();
  const add = (j) => { if (j && j.end > 0 && !found.has(j.start)) found.set(j.start, j); };
  // 1) Endereços que o formato informa (fim pelo tamanho declarado, se faltar o EOI)
  for (const { off, len } of info.explicit) {
    if (!(off >= 0 && len > 4 && off + 3 <= buf.length) || buf[off] !== 0xff || buf[off + 1] !== 0xd8) continue;
    const limit = Math.min(buf.length, off + len);
    const j = parseJpeg(buf, off, limit);
    if (j && j.end < 0) j.end = limit;
    add(j);
  }
  // 2) Varredura de todos os SOI (FF D8 FF) do arquivo
  for (let p = buf.indexOf(SOI); p >= 0; p = buf.indexOf(SOI, p + 2)) {
    if (!found.has(p)) add(parseJpeg(buf, p, buf.length));
  }
  const insideRaw = (p) => info.exclude.some(([s, e]) => p >= s && p < e);
  return [...found.values()].filter((j) => !insideRaw(j.start));
}

// Último recurso: miniatura RGB sem compressão vira JPEG.
async function rgbPreview(buf, info) {
  const best = info.rgb
    .filter((m) => m.offs.length === m.lens.length)
    .sort((a, b) => b.width * b.height - a.width * a.height)[0];
  if (!best) return null;
  const need = best.width * best.height * 3;
  const parts = best.offs.map((o, i) => buf.subarray(o, o + best.lens[i]));
  const pixels = Buffer.concat(parts);
  if (pixels.length < need) return null;
  try {
    const buffer = await sharp(pixels.subarray(0, need), { raw: { width: best.width, height: best.height, channels: 3 } })
      .jpeg({ quality: 92 })
      .toBuffer();
    return { buffer, width: best.width, height: best.height };
  } catch {
    return null;
  }
}

// O sharp consegue abrir? Decodifica reduzido (1/8 direto no libjpeg), então é rápido.
async function decodes(data) {
  try {
    await sharp(data, { failOn: 'error', limitInputPixels: false })
      .resize(64, 64, { fit: 'inside' })
      .raw()
      .toBuffer();
    return true;
  } catch {
    return false;
  }
}

function exifOrientationOf(buf, j) {
  return j.exif ? tiffOrientation(buf, j.exif.start, j.exif.end) : 0;
}

async function extractPreview(file) {
  const buf = await fs.promises.readFile(file);
  const info = readContainer(buf);
  const jpegs = collectJpegs(buf, info);
  jpegs.sort((a, b) => b.width * b.height - a.width * a.height || (b.end - b.start) - (a.end - a.start));

  // Orientação de reserva: a do contêiner ou, se ele não diz (RAF, X3F), a de algum EXIF embutido.
  let fallback = info.orientation;
  for (let i = 0; !fallback && i < jpegs.length; i++) fallback = exifOrientationOf(buf, jpegs[i]);

  const big = jpegs.filter((j) => j.end - j.start >= MIN_BYTES);
  const small = jpegs.filter((j) => j.end - j.start < MIN_BYTES);
  for (const pool of [big, small]) {
    for (const j of pool.slice(0, MAX_TRIES)) {
      const data = buf.subarray(j.start, j.end);
      if (!(await decodes(data))) continue;
      return {
        buffer: Buffer.from(data), // cópia: não segura o RAW inteiro na memória
        width: j.width,
        height: j.height,
        orientation: exifOrientationOf(buf, j) || fallback || 1,
      };
    }
  }
  const rgb = await rgbPreview(buf, info);
  if (rgb) return { ...rgb, orientation: fallback || 1 };
  throw new Error(NO_PREVIEW);
}

module.exports = { RAW_EXTS, extractPreview };
