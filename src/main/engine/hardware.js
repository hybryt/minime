'use strict';
// Descobre o sistema (Windows ou Mac, x64 ou arm64), o processador e a placa de vídeo,
// e testa de verdade quais encoders e decoders de GPU funcionam. O resultado fica em cache:
// o teste roda uma vez por combinação de GPU + FFmpeg.
const { execFile, spawn } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const ff = require('./ffmpeg');

const CACHE_VERSION = 3;
const IS_MAC = process.platform === 'darwin';

const FAMILIES = IS_MAC
  ? [{ vendor: 'apple', label: 'Apple', h264: 'h264_videotoolbox', hevc: 'hevc_videotoolbox', decode: 'videotoolbox' }]
  : [
    { vendor: 'nvidia', label: 'NVIDIA', h264: 'h264_nvenc', hevc: 'hevc_nvenc', decode: 'd3d11va' },
    { vendor: 'amd', label: 'AMD', h264: 'h264_amf', hevc: 'hevc_amf', decode: 'd3d11va' },
    { vendor: 'intel', label: 'Intel', h264: 'h264_qsv', hevc: 'hevc_qsv', decode: 'd3d11va' },
  ];

function run(cmd, args, timeout = 10000) {
  return new Promise((resolve) => {
    ff.track(execFile(cmd, args, { windowsHide: true, timeout, maxBuffer: 8 << 20 }, (e, out) => resolve(e ? '' : String(out))));
  });
}

async function gpuNames() {
  if (IS_MAC) {
    const out = await run('system_profiler', ['SPDisplaysDataType', '-json'], 15000);
    try {
      const j = JSON.parse(out);
      return (j.SPDisplaysDataType || []).map((g) => g.sppci_model || g._name).filter(Boolean);
    } catch { return []; }
  }
  const out = await run('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command',
    '(Get-CimInstance Win32_VideoController | Select-Object -ExpandProperty Name) -join "|"']);
  return out.trim().split('|').map((s) => s.trim()).filter(Boolean);
}

async function osLabel() {
  if (IS_MAC) {
    const v = (await run('sw_vers', ['-productVersion'])).trim();
    return v ? `macOS ${v}` : 'macOS';
  }
  const build = Number(String(os.release()).split('.')[2] || 0);
  return build >= 22000 ? `Windows 11 (build ${build})` : `Windows 10 (build ${build})`;
}

function cpuName() {
  try { return os.cpus()[0].model.replace(/\s+/g, ' ').trim(); } catch { return 'Processador'; }
}

function testEncoder(enc) {
  return new Promise((resolve) => {
    const fmt = enc.endsWith('_qsv') ? 'nv12' : 'yuv420p';
    const p = ff.track(spawn(ff.ffmpegPath(), ['-hide_banner', '-loglevel', 'error', '-f', 'lavfi', '-i',
      'testsrc2=s=640x360:r=30:d=0.5', '-pix_fmt', fmt, '-c:v', enc, '-b:v', '1M', '-f', 'null', '-'], { windowsHide: true }));
    const t = setTimeout(() => { p.kill(); resolve(false); }, 12000);
    p.on('error', () => { clearTimeout(t); resolve(false); });
    p.on('close', (code) => { clearTimeout(t); resolve(code === 0); });
  });
}

// Decodificação na GPU: grava 1 s de H.264 e tenta ler de volta com o decoder de hardware.
function testDecoder(hwaccel, enc, tmpDir) {
  return new Promise((resolve) => {
    const sample = path.join(tmpDir, `minime-hw-${process.pid}.mp4`);
    const done = (ok) => { try { fs.unlinkSync(sample); } catch {} resolve(ok); };
    const mk = ff.track(spawn(ff.ffmpegPath(), ['-hide_banner', '-loglevel', 'error', '-y', '-f', 'lavfi', '-i',
      'testsrc2=s=1280x720:r=30:d=1', '-pix_fmt', 'yuv420p', '-c:v', enc || 'libx264', sample], { windowsHide: true }));
    mk.on('error', () => done(false));
    mk.on('close', (code) => {
      if (code !== 0) return done(false);
      const p = ff.track(spawn(ff.ffmpegPath(), ['-hide_banner', '-loglevel', 'error', '-hwaccel', hwaccel, '-i', sample,
        '-vf', 'scale=640:-2', '-f', 'null', '-'], { windowsHide: true }));
      const t = setTimeout(() => { p.kill(); done(false); }, 12000);
      p.on('error', () => { clearTimeout(t); done(false); });
      p.on('close', (c) => { clearTimeout(t); done(c === 0); });
    });
  });
}

function pickGpuLabel(names, vendor) {
  const re = { nvidia: /nvidia|geforce|rtx|gtx|quadro/i, amd: /amd|radeon/i, intel: /intel|arc|iris|uhd/i, apple: /apple|m\d/i }[vendor];
  const matches = names.filter((n) => re.test(n));
  // Prefere a placa dedicada (tem número de modelo) à integrada ("Radeon Graphics", "UHD Graphics").
  const score = (n) => (/\b(RX|RTX|GTX|Arc\s?[AB])\s?\d/i.test(n) ? 10 : 0) - (/\(TM\) Graphics$|UHD Graphics|Iris/i.test(n) ? 5 : 0);
  return matches.sort((a, b) => score(b) - score(a))[0] || null;
}

async function detect(cacheFile) {
  const [names, osName] = await Promise.all([gpuNames(), osLabel()]);
  let stamp = '';
  try { stamp = String(fs.statSync(ff.ffmpegPath()).mtimeMs); } catch {}
  const key = `${process.platform}-${process.arch}::${names.join('|')}::${stamp}`;
  const base = {
    platform: process.platform, arch: process.arch, os: osName, cpu: cpuName(),
    cores: os.cpus().length, memGB: Math.round(os.totalmem() / 1073741824),
  };
  if (cacheFile) {
    try {
      const c = JSON.parse(fs.readFileSync(cacheFile, 'utf8'));
      if (c.key === key && c.version === CACHE_VERSION) return { ...c.result, ...base };
    } catch {}
  }
  const encoders = await ff.listEncoders();
  const result = { ...base, gpus: names, vendor: null, gpuLabel: null, h264: null, hevc: null, hwDecode: null };
  for (const fam of FAMILIES) {
    if (!encoders.includes(fam.h264)) continue;
    const hasCard = IS_MAC || names.length === 0 || names.some((n) => pickGpuLabel([n], fam.vendor));
    if (!hasCard) continue;
    const okH264 = await testEncoder(fam.h264);
    if (!okH264) continue;
    const okHevc = encoders.includes(fam.hevc) ? await testEncoder(fam.hevc) : false;
    result.vendor = fam.vendor;
    result.gpuLabel = IS_MAC ? (names[0] || cpuName()) : (pickGpuLabel(names, fam.vendor) || `GPU ${fam.label}`);
    result.h264 = fam.h264;
    result.hevc = okHevc ? fam.hevc : null;
    result.hwDecode = (await testDecoder(fam.decode, fam.h264, os.tmpdir())) ? fam.decode : null;
    break;
  }
  if (cacheFile) {
    try {
      fs.mkdirSync(path.dirname(cacheFile), { recursive: true });
      const { os: _o, cpu: _c, cores: _n, memGB: _m, ...cached } = result;
      fs.writeFileSync(cacheFile, JSON.stringify({ key, version: CACHE_VERSION, result: cached }, null, 2));
    } catch {}
  }
  return result;
}

module.exports = { detect };
