'use strict';
// Acesso ao FFmpeg empacotado: localizar os binários, rodar comandos, ler informações do arquivo.
const { spawn, execFile } = require('node:child_process');
const path = require('node:path');
const fs = require('node:fs');

let BIN_DIR = null;

function setBinDir(dir) { BIN_DIR = dir; }

function binDir() {
  if (BIN_DIR) return BIN_DIR;
  const candidates = [
    process.resourcesPath && path.join(process.resourcesPath, 'ffmpeg'),
    path.join(__dirname, '..', '..', '..', 'vendor', 'ffmpeg'),
  ].filter(Boolean);
  BIN_DIR = candidates.find((d) => fs.existsSync(path.join(d, 'ffmpeg.exe'))) || candidates[candidates.length - 1];
  return BIN_DIR;
}

const ffmpegPath = () => path.join(binDir(), 'ffmpeg.exe');
const ffprobePath = () => path.join(binDir(), 'ffprobe.exe');

const SPAWN_OPTS = { windowsHide: true };

// Roda um comando e devolve stdout como Buffer (pra pipes de imagem).
function runBuffer(bin, args, { timeout = 120000 } = {}) {
  return new Promise((resolve, reject) => {
    const p = spawn(bin, args, SPAWN_OPTS);
    const out = [];
    let err = '';
    const t = setTimeout(() => { p.kill(); reject(new Error('Tempo esgotado')); }, timeout);
    p.stdout.on('data', (d) => out.push(d));
    p.stderr.on('data', (d) => { err += d; if (err.length > 20000) err = err.slice(-10000); });
    p.on('error', (e) => { clearTimeout(t); reject(e); });
    p.on('close', (code) => {
      clearTimeout(t);
      if (code === 0) resolve(Buffer.concat(out));
      else reject(new Error(lastLines(err) || `ffmpeg saiu com código ${code}`));
    });
  });
}

function lastLines(s, n = 3) {
  return String(s).trim().split(/\r?\n/).filter(Boolean).slice(-n).join(' | ');
}

const num = (v) => (v === undefined || v === null || v === 'N/A' || Number.isNaN(Number(v)) ? 0 : Number(v));

function parseFps(r) {
  if (!r || r === '0/0') return 0;
  const [a, b] = String(r).split('/').map(Number);
  return b ? a / b : a;
}

// Lê duração, resolução, codecs e bitrates via ffprobe.
async function probe(file) {
  const buf = await runBuffer(ffprobePath(), [
    '-v', 'error', '-print_format', 'json', '-show_format', '-show_streams', file,
  ], { timeout: 30000 });
  const j = JSON.parse(buf.toString('utf8'));
  const fmt = j.format || {};
  const streams = j.streams || [];
  const vids = streams.filter((s) => s.codec_type === 'video');
  const realVideo = vids.find((s) => !(s.disposition && s.disposition.attached_pic));
  const cover = vids.find((s) => s.disposition && s.disposition.attached_pic);
  const audios = streams.filter((s) => s.codec_type === 'audio');
  const subs = streams.filter((s) => s.codec_type === 'subtitle');
  let duration = num(fmt.duration);
  if (!duration && realVideo) duration = num(realVideo.duration);
  if (!duration && audios[0]) duration = num(audios[0].duration);

  let video = null;
  if (realVideo) {
    let w = num(realVideo.width), h = num(realVideo.height);
    const rot = Math.abs(num((realVideo.side_data_list || []).find((d) => d.rotation !== undefined)?.rotation)
      || num(realVideo.tags && realVideo.tags.rotate));
    if (rot === 90 || rot === 270) [w, h] = [h, w];
    video = {
      codec: realVideo.codec_name,
      width: w,
      height: h,
      fps: Math.min(parseFps(realVideo.avg_frame_rate) || parseFps(realVideo.r_frame_rate) || 30, 120),
      bitrate: num(realVideo.bit_rate) || num(realVideo.tags && realVideo.tags.BPS),
      pixFmt: realVideo.pix_fmt,
      frames: num(realVideo.nb_frames),
    };
  }
  const audio = audios.map((a) => ({
    codec: a.codec_name,
    channels: num(a.channels) || 2,
    sampleRate: num(a.sample_rate) || 44100,
    bitrate: num(a.bit_rate) || num(a.tags && a.tags.BPS),
    bitsPerSample: num(a.bits_per_raw_sample) || num(a.bits_per_sample) || 16,
  }));
  const totalBitrate = num(fmt.bit_rate);
  // Muitos MKV não informam o bitrate do vídeo: estima pelo total menos o áudio.
  if (video && !video.bitrate && totalBitrate) {
    const aSum = audio.reduce((s, a) => s + (a.bitrate || 128000), 0);
    video.bitrate = Math.max(0, totalBitrate - aSum);
  }
  return {
    duration,
    size: num(fmt.size),
    bitrate: totalBitrate,
    container: fmt.format_name,
    video,
    audio,
    hasCover: !!cover,
    coverCodec: cover ? cover.codec_name : null,
    subs: subs.map((s) => s.codec_name),
    hasAttachments: streams.some((s) => s.codec_type === 'attachment'),
  };
}

// Executa o ffmpeg com barra de progresso. onProgress recebe 0..1.
function runWithProgress(args, { duration = 0, onProgress, signal } = {}) {
  return new Promise((resolve, reject) => {
    const full = ['-hide_banner', '-nostdin', '-y', '-loglevel', 'error', '-progress', 'pipe:1', '-nostats', ...args];
    const p = spawn(ffmpegPath(), full, SPAWN_OPTS);
    let err = '';
    let buf = '';
    const onAbort = () => { try { p.kill('SIGKILL'); } catch {} };
    if (signal) {
      if (signal.aborted) onAbort();
      signal.addEventListener('abort', onAbort, { once: true });
    }
    p.stdout.on('data', (d) => {
      buf += d.toString();
      const lines = buf.split(/\r?\n/);
      buf = lines.pop();
      for (const line of lines) {
        const m = /^out_time_us=(\d+)/.exec(line) || /^out_time_ms=(\d+)/.exec(line);
        if (m && duration > 0 && onProgress) onProgress(Math.min(0.999, Number(m[1]) / 1e6 / duration));
        if (line === 'progress=end' && onProgress) onProgress(1);
      }
    });
    p.stderr.on('data', (d) => { err += d; if (err.length > 20000) err = err.slice(-10000); });
    p.on('error', (e) => reject(e));
    p.on('close', (code) => {
      if (signal) signal.removeEventListener('abort', onAbort);
      if (signal && signal.aborted) return reject(Object.assign(new Error('Cancelado'), { cancelled: true }));
      if (code === 0) resolve();
      else reject(new Error(lastLines(err) || `ffmpeg saiu com código ${code}`));
    });
  });
}

// Miniatura de vídeo (um quadro perto de 10% da duração) ou capa do áudio, em JPEG.
async function thumbnail(file, info, size = 160) {
  if (info && info.video) {
    const at = info.duration > 2 ? Math.min(info.duration * 0.1, 30) : 0;
    return runBuffer(ffmpegPath(), [
      '-hide_banner', '-loglevel', 'error', '-ss', String(at), '-i', file, '-frames:v', '1',
      '-vf', `scale=${size}:${size}:force_original_aspect_ratio=increase,crop=${size}:${size}`,
      '-f', 'image2pipe', '-c:v', 'mjpeg', '-q:v', '5', 'pipe:1',
    ], { timeout: 20000 });
  }
  if (info && info.hasCover) {
    return runBuffer(ffmpegPath(), [
      '-hide_banner', '-loglevel', 'error', '-i', file, '-map', '0:v:0', '-frames:v', '1',
      '-vf', `scale=${size}:${size}:force_original_aspect_ratio=increase,crop=${size}:${size}`,
      '-f', 'image2pipe', '-c:v', 'mjpeg', '-q:v', '5', 'pipe:1',
    ], { timeout: 20000 });
  }
  return null;
}

// Decodifica uma imagem que o sharp não lê (BMP, ICO) para PNG em memória.
function decodeToPng(file) {
  return runBuffer(ffmpegPath(), [
    '-hide_banner', '-loglevel', 'error', '-i', file, '-frames:v', '1', '-f', 'image2pipe', '-c:v', 'png', 'pipe:1',
  ], { timeout: 60000 });
}

function listEncoders() {
  return new Promise((resolve) => {
    execFile(ffmpegPath(), ['-hide_banner', '-encoders'], { ...SPAWN_OPTS, maxBuffer: 4 << 20 }, (e, out) => resolve(e ? '' : out));
  });
}

module.exports = { setBinDir, binDir, ffmpegPath, ffprobePath, probe, runBuffer, runWithProgress, thumbnail, decodeToPng, listEncoders };
