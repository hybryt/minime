'use strict';
// Vídeo e áudio com FFmpeg: monta os argumentos, estima o tamanho final e escolhe CPU ou GPU.
const ff = require('./ffmpeg');

const AUDIO_TARGETS = new Set(['mp3', 'wav', 'm4a', 'flac', 'ogg', 'opus']);
const LOSSLESS_AUDIO = new Set(['wav', 'flac']);
const LOSSLESS_CODECS = new Set(['flac', 'alac', 'wavpack', 'ape', 'tta']);

// Contêiner aceita esses codecs sem recodificar?
const REMUX = {
  mp4: { v: ['h264', 'hevc', 'av1', 'mpeg4'], a: ['aac', 'mp3', 'ac3', 'eac3', 'alac', 'opus', 'flac'] },
  mov: { v: ['h264', 'hevc', 'mpeg4', 'prores', 'mjpeg'], a: ['aac', 'mp3', 'ac3', 'eac3', 'alac', 'pcm_s16le', 'pcm_s24le'] },
  mkv: { v: null, a: null },
  avi: { v: ['mpeg4', 'h264', 'mjpeg', 'msmpeg4v3'], a: ['mp3', 'ac3', 'pcm_s16le'] },
  webm: { v: ['vp8', 'vp9', 'av1'], a: ['opus', 'vorbis'] },
};
const TEXT_SUBS = new Set(['subrip', 'ass', 'ssa', 'mov_text', 'webvtt', 'text']);

function outputKind(category, target) {
  if (category === 'image' && target === 'mp4') return 'video';
  if (category === 'video' && AUDIO_TARGETS.has(target)) return 'audio';
  if (category === 'audio') return 'audio';
  return category;
}

function canRemux(info, target) {
  const rule = REMUX[target];
  if (!rule || !info || !info.video) return false;
  if (rule.v && !rule.v.includes(info.video.codec)) return false;
  if (rule.a && info.audio.some((a) => !rule.a.includes(a.codec))) return false;
  return true;
}

const even = (n) => Math.max(2, Math.round(n / 2) * 2);

// "1080p" = lado menor com 1080 px (funciona pra vídeo deitado e em pé). Nunca aumenta.
function outDims(info, resolution) {
  const w = info.video ? info.video.width : 1280;
  const h = info.video ? info.video.height : 720;
  if (!resolution || resolution === 'original') return { w: even(w), h: even(h) };
  const R = Number(resolution);
  const short = Math.min(w, h);
  if (short <= R) return { w: even(w), h: even(h) };
  const k = R / short;
  return { w: even(w * k), h: even(h * k) };
}

const CODEC_FACTOR = { h264: 1, h265: 0.65, vp9: 0.7, mpeg4: 1.6 };

// Slider 0..100 vira bits por pixel. Curva exponencial: o meio da régua cai num bitrate sensato.
function videoBitrate(q, dims, fps, codec, sourceBitrate) {
  const bpp = 0.015 * Math.pow(0.2 / 0.015, Math.max(0, Math.min(100, q)) / 100);
  let b = bpp * dims.w * dims.h * Math.min(fps || 30, 60) * (CODEC_FACTOR[codec] || 1);
  if (sourceBitrate > 0) b = Math.min(b, sourceBitrate * (codec === 'mpeg4' ? 1.5 : 1));
  return Math.max(250e3, Math.round(b / 1e4) * 1e4);
}

const KBPS = {
  default: [64, 96, 128, 160, 192, 224, 256, 320],
  opus: [32, 48, 64, 80, 96, 128, 160, 192],
  ogg: [64, 80, 96, 128, 160, 192, 224, 256],
  m4a: [64, 96, 128, 160, 192, 224, 256, 320],
};

function audioKbps(target, q, info) {
  const table = KBPS[target] || KBPS.default;
  const idx = Math.round((Math.max(0, Math.min(100, q)) / 100) * (table.length - 1));
  let k = table[idx];
  // Fonte com perda e bitrate conhecido: acima dela o arquivo só engorda, sem ganho.
  const src = info && info.audio && info.audio[0];
  if (src && src.bitrate && !LOSSLESS_CODECS.has(src.codec) && !String(src.codec).startsWith('pcm')) {
    const ceil = table.find((v) => v * 1000 >= src.bitrate * 0.98) || table[table.length - 1];
    k = Math.min(k, ceil);
  }
  return k;
}

function pickVideoEncoder(target, vs, hw) {
  if (target === 'webm') return { codec: 'vp9', encoder: 'libvpx-vp9', gpu: false };
  if (target === 'avi') return { codec: 'mpeg4', encoder: 'mpeg4', gpu: false };
  const codec = vs.codec === 'h265' ? 'h265' : 'h264';
  const hwEnc = hw && (codec === 'h265' ? hw.hevc : hw.h264);
  const useGpu = vs.engine !== 'cpu' && !!hwEnc;
  if (useGpu) return { codec, encoder: hwEnc, gpu: true };
  return { codec, encoder: codec === 'h265' ? 'libx265' : 'libx264', gpu: false };
}

function encoderArgs(enc, b) {
  const B = String(b), MAX = String(Math.round(b * 1.5)), BUF = String(Math.round(b * 2));
  const e = enc.encoder;
  if (e.endsWith('_amf')) return ['-c:v', e, '-usage', 'transcoding', '-quality', 'quality', '-rc', 'vbr_peak', '-b:v', B, '-maxrate', MAX, '-bufsize', BUF];
  if (e.endsWith('_nvenc')) return ['-c:v', e, '-preset', 'p5', '-tune', 'hq', '-rc', 'vbr', '-b:v', B, '-maxrate', MAX, '-bufsize', BUF];
  if (e.endsWith('_qsv')) return ['-c:v', e, '-preset', 'slow', '-b:v', B, '-maxrate', MAX, '-bufsize', BUF];
  if (e.endsWith('_videotoolbox')) return ['-c:v', e, '-b:v', B, '-maxrate', MAX, '-bufsize', BUF, '-realtime', '0', '-prio_speed', '0'];
  if (e === 'libx264') return ['-c:v', e, '-preset', 'medium', '-b:v', B, '-maxrate', MAX, '-bufsize', BUF];
  if (e === 'libx265') return ['-c:v', e, '-preset', 'medium', '-b:v', B, '-maxrate', MAX, '-bufsize', BUF, '-x265-params', 'log-level=error'];
  if (e === 'libvpx-vp9') return ['-c:v', e, '-b:v', B, '-maxrate', MAX, '-bufsize', BUF, '-deadline', 'good', '-cpu-used', '3', '-row-mt', '1', '-tile-columns', '2'];
  if (e === 'mpeg4') return ['-c:v', e, '-vtag', 'xvid', '-b:v', B, '-maxrate', MAX, '-bufsize', BUF, '-qmin', '2'];
  return ['-c:v', e, '-b:v', B];
}

function videoAudioArgs(info, target, q) {
  if (!info.audio.length) return { args: ['-an'], bitrate: 0 };
  const map = ['-map', '0:a?'];
  const want = { mp4: 'aac', mov: 'aac', mkv: 'aac', webm: 'opus', avi: 'mp3' }[target];
  const allSame = info.audio.every((a) => a.codec === want);
  if (allSame) return { args: [...map, '-c:a', 'copy'], bitrate: info.audio.reduce((s, a) => s + (a.bitrate || 160000), 0) };
  const k = want === 'opus' ? 128 : q >= 60 ? 192 : 128;
  const enc = { aac: 'aac', opus: 'libopus', mp3: 'libmp3lame' }[want];
  const extra = want === 'opus' && info.audio.some((a) => a.channels > 2) ? ['-ac', '2'] : [];
  return { args: [...map, '-c:a', enc, '-b:a', `${k}k`, ...extra], bitrate: k * 1000 * info.audio.length };
}

function subtitleArgs(info, target) {
  if (!info.subs.length) return [];
  if (target === 'mkv') return ['-map', '0:s?', '-c:s', 'copy', ...(info.hasAttachments ? ['-map', '0:t?'] : [])];
  if ((target === 'mp4' || target === 'mov') && info.subs.every((c) => TEXT_SUBS.has(c))) return ['-map', '0:s?', '-c:s', 'mov_text'];
  return [];
}

function containerArgs(target, codec) {
  const a = [];
  if (target === 'mp4' || target === 'mov') a.push('-movflags', '+faststart');
  if ((target === 'mp4' || target === 'mov') && (codec === 'h265' || codec === 'hevc')) a.push('-tag:v', 'hvc1');
  return a;
}

function gifParams(q) {
  return { fps: Math.round(8 + q * 0.12), colors: Math.max(32, Math.min(256, Math.round(32 + q * 2.24))) };
}

// ---------- Plano de conversão (args + estimativa) ----------

function planVideo(info, target, vs, hw) {
  const q = vs.quality;
  const dims = outDims(info, vs.resolution);
  const fps = info.video ? info.video.fps : 30;
  const dur = info.duration || 0;

  if (target === 'gif') {
    const g = gifParams(q);
    const vf = `fps=${g.fps},scale=${dims.w}:${dims.h}:flags=lanczos,split[a][b];[a]palettegen=max_colors=${g.colors}:stats_mode=diff[p];[b][p]paletteuse=dither=sierra2_4a:diff_mode=rectangle`;
    const est = dims.w * dims.h * g.fps * dur * (0.035 + (g.colors / 256) * 0.05);
    return { args: ['-map', '0:V:0', '-vf', vf, '-an', '-loop', '0'], estimate: est, detail: { fps: g.fps, colors: g.colors, w: dims.w, h: dims.h } };
  }

  const resolutionChanged = vs.resolution !== 'original' && (dims.w !== even(info.video.width) || dims.h !== even(info.video.height));
  if (vs.objective === 'copy' && canRemux(info, target) && !resolutionChanged) {
    const args = ['-map', '0:V:0', '-map', '0:a?', '-c', 'copy', ...subtitleArgs(info, target),
      ...containerArgs(target, info.video.codec)];
    return { args, estimate: info.size || 0, detail: { remux: true } };
  }

  const enc = pickVideoEncoder(target, vs, hw);
  // Decodificar na GPU só quando o encoder também é da GPU. Medido num Ryzen 7 7800X3D: HEVC 4K ficou 42% mais
  // rápido na GPU, mas H.264 4K ficou mais lento (copiar os quadros de volta custa mais que decodificar).
  // Então: processador forte (8+ núcleos) manda pra GPU só os codecs pesados; processador fraco manda tudo.
  const heavyCodecs = ['hevc', 'av1', 'vp9'];
  const decodable = hw && hw.cores >= 8 ? heavyCodecs : [...heavyCodecs, 'h264', 'mpeg2video'];
  const hwDecode = enc.gpu && hw && hw.hwDecode && decodable.includes(info.video.codec) ? hw.hwDecode : null;
  const srcBitrate = info.video && info.video.bitrate ? info.video.bitrate * (dims.w * dims.h) / Math.max(1, info.video.width * info.video.height) : 0;
  const b = videoBitrate(q, dims, fps, enc.codec, srcBitrate);
  const pix = enc.encoder.endsWith('_qsv') ? 'nv12' : 'yuv420p';
  const vf = `scale=${dims.w}:${dims.h}:flags=lanczos,setsar=1,format=${pix}`;
  const fpsArgs = fps > 60 ? ['-r', '60'] : [];
  const aud = videoAudioArgs(info, target, q);
  const args = ['-map', '0:V:0', ...aud.args, ...subtitleArgs(info, target), '-vf', vf, ...fpsArgs,
    ...encoderArgs(enc, b), ...containerArgs(target, enc.codec)];
  if (target === 'avi' || target === 'webm') args.push('-sn');
  const est = ((b + aud.bitrate) * dur) / 8 * 1.015;
  return { args, inputArgs: hwDecode ? ['-hwaccel', hwDecode] : [], estimate: est, detail: { bitrate: b, encoder: enc.encoder, gpu: enc.gpu, hwDecode, w: dims.w, h: dims.h } };
}

function planAudio(info, target, as, category) {
  const dur = info.duration || 0;
  const src = info.audio[0] || { channels: 2, sampleRate: 44100, bitsPerSample: 16, codec: '' };
  const srcLossless = LOSSLESS_CODECS.has(src.codec) || String(src.codec).startsWith('pcm');
  const coverArgs = category === 'audio' && info.hasCover && ['mp3', 'm4a', 'flac'].includes(target)
    ? ['-map', '0:v:0', '-c:v', 'copy', '-disposition:v:0', 'attached_pic'] : [];
  // A capa já está dentro do arquivo de origem: o que sobra além do áudio é praticamente ela.
  const audioBytes = (src.bitrate || info.bitrate || 0) * dur / 8;
  const coverBytes = coverArgs.length ? Math.max(0, Math.min(4e6, (info.size || 0) - audioBytes)) : 0;
  if (!info.audio.length) throw new Error('Esse arquivo não tem áudio.');

  if (target === 'wav') {
    const bits = srcLossless && src.bitsPerSample >= 24 ? 24 : 16;
    return { args: ['-map', '0:a:0', '-c:a', bits === 24 ? 'pcm_s24le' : 'pcm_s16le'], estimate: src.sampleRate * src.channels * (bits / 8) * dur + 44, detail: { lossless: true, bits } };
  }
  if (target === 'flac') {
    const bits = srcLossless && src.bitsPerSample >= 24 ? 24 : 16;
    const fmt = bits === 24 ? ['-sample_fmt', 's32'] : ['-sample_fmt', 's16'];
    return { args: ['-map', '0:a:0', ...coverArgs, '-c:a', 'flac', '-compression_level', '8', ...fmt], estimate: src.sampleRate * src.channels * (bits / 8) * dur * 0.58 + coverBytes, detail: { lossless: true, bits } };
  }
  const k = audioKbps(target, as.quality, info);
  const estimate = (k * 1000 * dur) / 8 * 1.01 + coverBytes;
  const multi = src.channels > 2 ? ['-ac', '2'] : [];
  switch (target) {
    case 'mp3': return { args: ['-map', '0:a:0', ...coverArgs, '-c:a', 'libmp3lame', '-b:a', `${k}k`, '-id3v2_version', '3', ...multi], estimate, detail: { kbps: k } };
    case 'm4a': return { args: ['-map', '0:a:0', ...coverArgs, '-c:a', 'aac', '-b:a', `${k}k`, '-movflags', '+faststart'], estimate, detail: { kbps: k } };
    case 'ogg': return { args: ['-map', '0:a:0', '-c:a', 'libvorbis', '-b:a', `${k}k`, ...multi], estimate, detail: { kbps: k } };
    case 'opus': return { args: ['-map', '0:a:0', '-c:a', 'libopus', '-b:a', `${k}k`, ...multi], estimate, detail: { kbps: k } };
    case 'mp4': return planAudioToVideo(info, as, k);
    default: throw new Error(`Formato de áudio não suportado: ${target}`);
  }
}

// Áudio vira MP4: onda sonora animada, capa do álbum ou tela preta.
function planAudioToVideo(info, as, k) {
  const dur = info.duration || 0;
  const bg = as.background === 'cover' && !info.hasCover ? 'wave' : (as.background || 'wave');
  const t = ['-t', String(dur.toFixed(3))];
  let pre = [], fc, vBits;
  if (bg === 'cover') {
    fc = '[0:v:0]scale=1080:1080:force_original_aspect_ratio=decrease,pad=1080:1080:(ow-iw)/2:(oh-ih)/2:color=0x19191C,setsar=1,loop=loop=-1:size=1:start=0,fps=12,format=yuv420p[v]';
    vBits = 60e3;
  } else if (bg === 'black') {
    pre = ['-f', 'lavfi', '-i', 'color=c=black:s=1280x720:r=12'];
    fc = '[1:v]format=yuv420p[v]';
    vBits = 20e3;
  } else {
    pre = ['-f', 'lavfi', '-i', 'color=c=0x19191C:s=1280x720:r=25'];
    fc = '[0:a:0]showwaves=s=1280x400:mode=cline:rate=25:scale=sqrt:colors=0xE6007E|0x00A0E3[w];[1:v][w]overlay=0:160:format=auto,format=yuv420p[v]';
    vBits = 350e3;
  }
  const args = [...pre, '-filter_complex', fc, '-map', '[v]', '-map', '0:a:0', '-c:v', 'libx264', '-preset', 'veryfast',
    '-tune', bg === 'wave' ? 'animation' : 'stillimage', '-crf', bg === 'wave' ? '26' : '30', '-c:a', 'aac', '-b:a', `${k}k`,
    '-movflags', '+faststart', '-shortest', ...t];
  return { args, estimate: ((vBits + k * 1000) * dur) / 8 * 1.02, detail: { kbps: k, background: bg } };
}

// Monta o comando completo: ffmpeg [entradas] [args] saída.
function plan(item, target, settings, hw) {
  const kind = outputKind(item.category, target);
  const info = item.info;
  let p;
  if (kind === 'audio') p = planAudio(info, target, settings.audio, item.category);
  else p = planVideo(info, target, settings.video, hw);
  // Entradas extras (lavfi) precisam vir depois do -i principal pra numeração [0] ser o arquivo.
  const inputArgs = p.inputArgs || [];
  const argsWithInput = [...inputArgs, '-i', item.path, ...p.args];
  const argsNoHw = ['-i', item.path, ...p.args];
  return { ...p, kind, argsWithInput, argsNoHw, usesHwDecode: inputArgs.length > 0 };
}

function capabilities(category, target, items) {
  const kind = outputKind(category, target);
  if (kind === 'audio') {
    if (LOSSLESS_AUDIO.has(target)) return { slider: false, note: `${target.toUpperCase()} é sem perda: o tamanho depende só da duração.` };
    return { slider: true, note: null };
  }
  const ok = (items || []).filter((it) => it.info);
  return { slider: true, remux: ok.some((it) => canRemux(it.info, target)), remuxAll: ok.length > 0 && ok.every((it) => canRemux(it.info, target)) };
}

async function convert(item, target, settings, hw, outPath, { onProgress, signal } = {}) {
  const p = plan(item, target, settings, hw);
  try {
    await ff.runWithProgress([...p.argsWithInput, outPath], { duration: item.info.duration, onProgress, signal });
  } catch (e) {
    // Arquivo que a GPU não conseguiu ler: tenta de novo decodificando no processador.
    if (!p.usesHwDecode || e.cancelled || (signal && signal.aborted)) throw e;
    if (onProgress) onProgress(0);
    await ff.runWithProgress([...p.argsNoHw, outPath], { duration: item.info.duration, onProgress, signal });
  }
  return p;
}

module.exports = { plan, convert, capabilities, canRemux, outputKind, audioKbps, videoBitrate, outDims, gifParams };
