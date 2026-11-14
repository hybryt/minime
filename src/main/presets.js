'use strict';
// Atalhos de 1 clique: aparecem no menu do botão direito (Windows) e nas Ações Rápidas do Finder (Mac).
// Cada atalho diz o formato de saída e os ajustes que a janela rápida aplica antes de converter sozinha.
// target 'same' = mesmo formato do arquivo (só comprime). target 'keep' = mesmo formato quando dá pra gravar,
// senão JPG (usado pelo "Aumentar com IA": HEIC e RAW, por exemplo, viram JPG).

const PRESETS = [
  // Imagem
  { id: 'img-jpg', cat: 'image', label: 'JPG 80% · mesma resolução', target: 'jpg', image: { objective: 'balanced', quality: 80, resize: 'original' } },
  { id: 'img-jpg-75', cat: 'image', label: 'JPG 80% · 75% da resolução', target: 'jpg', image: { objective: 'balanced', quality: 80, resize: '75%' } },
  { id: 'img-jpg-50', cat: 'image', label: 'JPG 80% · metade da resolução', target: 'jpg', image: { objective: 'balanced', quality: 80, resize: '50%' } },
  { id: 'img-jpg-fhd', cat: 'image', label: 'JPG 80% · até Full HD (1920 px)', target: 'jpg', image: { objective: 'balanced', quality: 80, resize: 1920 } },
  { id: 'img-webp', cat: 'image', label: 'WebP 80% · mesma resolução', target: 'webp', image: { objective: 'balanced', quality: 80, resize: 'original' } },
  { id: 'img-webp-web', cat: 'image', label: 'WebP pra site · até 1920 px', target: 'webp', image: { objective: 'web', quality: 62, resize: 1920 } },
  { id: 'img-avif', cat: 'image', label: 'AVIF 70% · o mais leve', target: 'avif', image: { objective: 'custom', quality: 70, resize: 'original' } },
  { id: 'img-png', cat: 'image', label: 'PNG sem perda', target: 'png', image: { objective: 'lossless', quality: 100, resize: 'original' } },
  { id: 'img-same', cat: 'image', label: 'Comprimir · mesmo formato', target: 'same', image: { objective: 'balanced', quality: 80, resize: 'original' } },
  { id: 'img-up', cat: 'image', label: 'Aumentar com IA · até 4K', target: 'keep', image: { objective: 'custom', quality: 92, resize: 'original', upscale: 'standard', upscaleSize: '4k' } },
  { id: 'img-up-max', cat: 'image', label: 'Aumentar com IA · qualidade máxima', target: 'keep', image: { objective: 'custom', quality: 92, resize: 'original', upscale: 'max', upscaleSize: '4k' } },
  // Vídeo
  { id: 'vid-mp4', cat: 'video', label: 'MP4 · mesma resolução', target: 'mp4', video: { objective: 'balanced', quality: 60, resolution: 'original', codec: 'h264' } },
  { id: 'vid-mp4-1080', cat: 'video', label: 'MP4 · até 1080p', target: 'mp4', video: { objective: 'balanced', quality: 60, resolution: 1080, codec: 'h264' } },
  { id: 'vid-mp4-720', cat: 'video', label: 'MP4 leve · 720p (WhatsApp)', target: 'mp4', video: { objective: 'small', quality: 35, resolution: 720, codec: 'h264' } },
  { id: 'vid-h265', cat: 'video', label: 'MP4 H.265 · uns 35% menor', target: 'mp4', video: { objective: 'balanced', quality: 60, resolution: 'original', codec: 'h265' } },
  { id: 'vid-webm', cat: 'video', label: 'WebM · pra site', target: 'webm', video: { objective: 'balanced', quality: 55, resolution: 'original' } },
  { id: 'vid-gif', cat: 'video', label: 'GIF animado', target: 'gif', video: { objective: 'custom', quality: 50, resolution: 480 } },
  { id: 'vid-mp3', cat: 'video', label: 'Só o áudio (MP3)', target: 'mp3', audio: { quality: 57 } },
  { id: 'vid-same', cat: 'video', label: 'Comprimir · mesmo formato', target: 'same', video: { objective: 'balanced', quality: 60, resolution: 'original' } },
  { id: 'vid-up', cat: 'video', label: 'Aumentar com IA · até 4K', target: 'mp4', video: { objective: 'balanced', quality: 70, resolution: 'original', upscale: true } },
  // Áudio
  { id: 'aud-mp3-320', cat: 'audio', label: 'MP3 · 320 kbps', target: 'mp3', audio: { quality: 100 } },
  { id: 'aud-mp3-192', cat: 'audio', label: 'MP3 · 192 kbps', target: 'mp3', audio: { quality: 57 } },
  { id: 'aud-mp3-128', cat: 'audio', label: 'MP3 · 128 kbps (menor)', target: 'mp3', audio: { quality: 29 } },
  { id: 'aud-m4a', cat: 'audio', label: 'M4A · 192 kbps', target: 'm4a', audio: { quality: 57 } },
  { id: 'aud-wav', cat: 'audio', label: 'WAV sem perda', target: 'wav', audio: { quality: 57 } },
  { id: 'aud-flac', cat: 'audio', label: 'FLAC sem perda', target: 'flac', audio: { quality: 57 } },
  { id: 'aud-opus', cat: 'audio', label: 'Opus · 96 kbps (voz e podcast)', target: 'opus', audio: { quality: 57 } },
];

const BY_ID = new Map(PRESETS.map((p) => [p.id, p]));
const CATS = ['image', 'video', 'audio'];
const MAX_PER_CAT = 6;

const DEFAULT_MENU = {
  image: ['img-jpg', 'img-jpg-75', 'img-jpg-50', 'img-webp', 'img-up'],
  video: ['vid-mp4', 'vid-mp4-1080', 'vid-mp4-720', 'vid-mp3', 'vid-up'],
  audio: ['aud-mp3-192', 'aud-mp3-128', 'aud-m4a', 'aud-wav', 'aud-flac'],
};

function get(id) { return BY_ID.get(String(id || '')) || null; }

// Escolha salva nas Preferências, limpa: só ids conhecidos, da categoria certa, sem repetir, até MAX_PER_CAT.
function normalizeMenu(menu) {
  const out = {};
  for (const c of CATS) {
    const list = Array.isArray(menu && menu[c]) ? menu[c] : DEFAULT_MENU[c];
    out[c] = [...new Set(list)].filter((id) => { const p = get(id); return p && p.cat === c; }).slice(0, MAX_PER_CAT);
  }
  return out;
}

// O que a tela recebe (sem funções, pronto pra IPC).
function publicList() {
  return PRESETS.map(({ id, cat, label, target }) => ({ id, cat, label, target }));
}

module.exports = { PRESETS, DEFAULT_MENU, MAX_PER_CAT, CATS, get, normalizeMenu, publicList };
