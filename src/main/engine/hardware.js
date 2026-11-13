'use strict';
// Descobre qual placa de vídeo o PC tem e quais encoders de GPU realmente funcionam.
// O resultado fica em cache: o teste roda uma vez por combinação de GPU + FFmpeg.
const { execFile, spawn } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const ff = require('./ffmpeg');

const FAMILIES = [
  { vendor: 'nvidia', label: 'NVIDIA', h264: 'h264_nvenc', hevc: 'hevc_nvenc' },
  { vendor: 'amd', label: 'AMD', h264: 'h264_amf', hevc: 'hevc_amf' },
  { vendor: 'intel', label: 'Intel', h264: 'h264_qsv', hevc: 'hevc_qsv' },
];

function gpuNames() {
  return new Promise((resolve) => {
    execFile('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command',
      '(Get-CimInstance Win32_VideoController | Select-Object -ExpandProperty Name) -join "|"'],
    { windowsHide: true, timeout: 10000 }, (e, out) => resolve(e ? [] : String(out).trim().split('|').map((s) => s.trim()).filter(Boolean)));
  });
}

function cpuName() {
  try { return require('node:os').cpus()[0].model.trim(); } catch { return 'Processador'; }
}

function testEncoder(enc) {
  return new Promise((resolve) => {
    const fmt = enc.endsWith('_qsv') ? 'nv12' : 'yuv420p';
    const p = spawn(ff.ffmpegPath(), ['-hide_banner', '-loglevel', 'error', '-f', 'lavfi', '-i',
      'testsrc2=s=640x360:r=30:d=0.5', '-pix_fmt', fmt, '-c:v', enc, '-b:v', '1M', '-f', 'null', '-'], { windowsHide: true });
    const t = setTimeout(() => { p.kill(); resolve(false); }, 12000);
    p.on('error', () => { clearTimeout(t); resolve(false); });
    p.on('close', (code) => { clearTimeout(t); resolve(code === 0); });
  });
}

function pickGpuLabel(names, vendor) {
  const re = { nvidia: /nvidia|geforce|rtx|gtx|quadro/i, amd: /amd|radeon/i, intel: /intel|arc|iris|uhd/i }[vendor];
  const matches = names.filter((n) => re.test(n));
  // Prefere a placa dedicada (tem número de modelo) à integrada ("Radeon Graphics", "UHD Graphics").
  const score = (n) => (/\b(RX|RTX|GTX|Arc\s?[AB])\s?\d/i.test(n) ? 10 : 0) - (/\(TM\) Graphics$|UHD Graphics|Iris/i.test(n) ? 5 : 0);
  return matches.sort((a, b) => score(b) - score(a))[0] || null;
}

async function detect(cacheFile) {
  const names = await gpuNames();
  let stamp = '';
  try { stamp = String(fs.statSync(ff.ffmpegPath()).mtimeMs); } catch {}
  const key = `${names.join('|')}::${stamp}`;
  if (cacheFile) {
    try {
      const c = JSON.parse(fs.readFileSync(cacheFile, 'utf8'));
      if (c.key === key && c.version === 2) return c.result;
    } catch {}
  }
  const encoders = await ff.listEncoders();
  const result = { cpu: cpuName(), gpus: names, vendor: null, gpuLabel: null, h264: null, hevc: null };
  for (const fam of FAMILIES) {
    if (!encoders.includes(fam.h264)) continue;
    const hasCard = names.length === 0 || names.some((n) => pickGpuLabel([n], fam.vendor));
    if (!hasCard) continue;
    const okH264 = await testEncoder(fam.h264);
    if (!okH264) continue;
    const okHevc = encoders.includes(fam.hevc) ? await testEncoder(fam.hevc) : false;
    result.vendor = fam.vendor;
    result.gpuLabel = pickGpuLabel(names, fam.vendor) || `GPU ${fam.label}`;
    result.h264 = fam.h264;
    result.hevc = okHevc ? fam.hevc : null;
    break;
  }
  if (cacheFile) {
    try {
      fs.mkdirSync(path.dirname(cacheFile), { recursive: true });
      fs.writeFileSync(cacheFile, JSON.stringify({ key, version: 2, result }, null, 2));
    } catch {}
  }
  return result;
}

module.exports = { detect };
