'use strict';
// Catálogo de formatos: o que o MINIME lê, pra onde converte e como cada destino se chama na tela.

// RAW de câmera: o MINIME lê a foto JPEG em tamanho cheio que a câmera grava dentro do arquivo (engine/raw.js).
const RAW_IN = ['cr2', 'cr3', 'crw', 'nef', 'nrw', 'arw', 'srf', 'sr2', 'dng', 'raf', 'orf', 'rw2', 'pef', 'srw', '3fr', 'iiq', 'erf', 'mef', 'mos', 'kdc', 'dcr', 'x3f'];
// Lidos pelo FFmpeg e entregues ao sharp como PNG (HEIC do iPhone, JPEG XL, Photoshop, BMP e ICO).
const FFMPEG_IMAGE = ['heic', 'heif', 'hif', 'jxl', 'psd', 'bmp', 'ico'];
const IMAGE_IN = ['jpg', 'jpeg', 'jfif', 'png', 'webp', 'avif', 'tif', 'tiff', 'bmp', 'gif', 'ico', 'svg', 'heic', 'heif', 'hif', 'jxl', 'psd', ...RAW_IN];
const VIDEO_IN = ['mp4', 'm4v', 'mkv', 'mov', 'avi', 'webm', 'wmv', 'flv', 'mpg', 'mpeg', 'ts', 'mts', 'm2ts', '3gp', 'ogv'];
const AUDIO_IN = ['mp3', 'wav', 'm4a', 'aac', 'flac', 'ogg', 'oga', 'opus', 'wma', 'aif', 'aiff'];

const IMAGE_OUT = ['jpg', 'png', 'webp', 'avif', 'tiff', 'gif', 'bmp', 'ico'];
const VIDEO_OUT = ['mp4', 'mkv', 'mov', 'avi', 'webm', 'gif', 'mp3', 'wav', 'm4a'];
const AUDIO_OUT = ['mp3', 'wav', 'm4a', 'flac', 'ogg', 'opus', 'mp4'];

// Rótulo e dica curta de cada destino (aparece no seletor de formato).
const TARGETS = {
  jpg: { label: 'JPG', hint: 'Fotos. Abre em qualquer lugar.' },
  png: { label: 'PNG', hint: 'Sem perda, aceita fundo transparente.' },
  webp: { label: 'WebP', hint: 'Leve, ideal pra site.' },
  avif: { label: 'AVIF', hint: 'O mais leve. Navegadores recentes.' },
  tiff: { label: 'TIFF', hint: 'Impressão e arquivo, sem perda.' },
  gif: { label: 'GIF', hint: 'Animação sem som.' },
  bmp: { label: 'BMP', hint: 'Bitmap sem compressão.' },
  ico: { label: 'ICO', hint: 'Ícone do Windows e favicon.' },
  mp4: { label: 'MP4', hint: 'Abre em qualquer aparelho.' },
  mkv: { label: 'MKV', hint: 'Guarda legendas e várias faixas.' },
  mov: { label: 'MOV', hint: 'Padrão Apple e edição.' },
  avi: { label: 'AVI', hint: 'Aparelhos e programas antigos.' },
  webm: { label: 'WebM', hint: 'Vídeo pra site.' },
  mp3: { label: 'MP3', hint: 'Toca em tudo.' },
  wav: { label: 'WAV', hint: 'Sem perda, pra edição.' },
  m4a: { label: 'M4A', hint: 'AAC, padrão do iPhone.' },
  flac: { label: 'FLAC', hint: 'Sem perda e menor que WAV.' },
  ogg: { label: 'OGG', hint: 'Vorbis, aberto e leve.' },
  opus: { label: 'Opus', hint: 'Voz e podcast, muito leve.' },
};

// Dicas que mudam conforme a origem (ex.: MP3 pra MP4 vira vídeo com onda sonora).
const CONTEXT_HINTS = {
  'audio>mp4': 'Vídeo com onda sonora ou capa, pra redes.',
  'video>mp3': 'Só o áudio do vídeo.',
  'video>wav': 'Só o áudio, sem perda.',
  'video>m4a': 'Só o áudio, em AAC.',
  'video>gif': 'Trecho animado, sem som.',
  'image>mp4': 'GIF animado vira vídeo.',
};

function extOf(p) {
  const m = /\.([^.\\/]+)$/.exec(p);
  return m ? m[1].toLowerCase() : '';
}

function categoryOf(ext) {
  if (IMAGE_IN.includes(ext)) return 'image';
  if (VIDEO_IN.includes(ext)) return 'video';
  if (AUDIO_IN.includes(ext)) return 'audio';
  return null;
}

// Normaliza extensões equivalentes (jpeg -> jpg) pra comparar origem e destino.
function canonical(ext) {
  return { jpeg: 'jpg', jfif: 'jpg', tif: 'tiff', aiff: 'aif', oga: 'ogg', heif: 'heic', hif: 'heic' }[ext] || ext;
}

const isRaw = (ext) => RAW_IN.includes(ext);
const viaFfmpeg = (ext) => FFMPEG_IMAGE.includes(ext);

// Destino de "mesmo formato" pro Aumentar com IA: formatos que o MINIME grava ficam iguais, o resto vira JPG
// (PNG quando o original tem transparência é decidido na hora, pela tela).
const KEEPABLE = new Set(['jpg', 'png', 'webp', 'avif', 'tiff']);
function keepTarget(ext) {
  const c = canonical(ext);
  return KEEPABLE.has(c) ? c : 'jpg';
}

function targetsFor(ext) {
  const cat = categoryOf(ext);
  if (cat === 'image') return ext === 'gif' ? [...IMAGE_OUT, 'mp4'] : IMAGE_OUT.slice();
  if (cat === 'video') return VIDEO_OUT.slice();
  if (cat === 'audio') return AUDIO_OUT.slice();
  return [];
}

// Formato sugerido quando o arquivo entra na lista.
function defaultTarget(ext) {
  const c = canonical(ext);
  const cat = categoryOf(ext);
  if (cat === 'image') {
    if (isRaw(c) || ['heic', 'jxl'].includes(c)) return 'jpg';
    if (c === 'psd') return 'png';
    return c === 'webp' ? 'jpg' : 'webp';
  }
  if (cat === 'video') return 'mp4';
  if (cat === 'audio') return 'mp3';
  return null;
}

function describeTarget(category, target, sourceExt) {
  const base = TARGETS[target] || { label: target.toUpperCase(), hint: '' };
  const hint = CONTEXT_HINTS[`${category}>${target}`] || base.hint;
  const same = canonical(sourceExt || '') === target;
  return { id: target, label: base.label, hint: same ? 'Mesmo formato, só comprime.' : hint, same };
}

module.exports = {
  IMAGE_IN, VIDEO_IN, AUDIO_IN, IMAGE_OUT, VIDEO_OUT, AUDIO_OUT, RAW_IN, FFMPEG_IMAGE, TARGETS,
  ALL_IN: [...IMAGE_IN, ...VIDEO_IN, ...AUDIO_IN],
  extOf, categoryOf, canonical, targetsFor, defaultTarget, describeTarget, isRaw, viaFfmpeg, keepTarget,
};
