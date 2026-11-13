// Teste do motor sem interface: gera arquivos de exemplo, estima, converte e compara estimativa x real.
// Uso: node scripts/test-engine.mjs [pasta-de-trabalho]
import { createRequire } from 'node:module';
import { mkdirSync, existsSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import os from 'node:os';

const require = createRequire(import.meta.url);
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const ff = require(join(ROOT, 'src/main/engine/ffmpeg.js'));
const jobs = require(join(ROOT, 'src/main/engine/jobs.js'));
const hwmod = require(join(ROOT, 'src/main/engine/hardware.js'));

const WORK = process.argv[2] || join(os.tmpdir(), 'minime-test');
const FIX = join(WORK, 'in');
const OUT = join(WORK, 'out');
rmSync(OUT, { recursive: true, force: true });
mkdirSync(FIX, { recursive: true });
mkdirSync(OUT, { recursive: true });

const FF = ff.ffmpegPath();
const gen = (name, args) => {
  const p = join(FIX, name);
  if (!existsSync(p)) execFileSync(FF, ['-hide_banner', '-loglevel', 'error', '-y', ...args, p]);
  return p;
};

console.log('Gerando arquivos de teste em', FIX);
const files = [
  gen('foto.jpg', ['-f', 'lavfi', '-i', 'mandelbrot=s=4000x3000:end_pts=1', '-frames:v', '1', '-q:v', '2']),
  gen('logo.png', ['-f', 'lavfi', '-i', 'testsrc2=s=1200x800,format=rgba,geq=r=r(X\\,Y):g=g(X\\,Y):b=b(X\\,Y):a=if(lt(hypot(X-600\\,Y-400)\\,350)\\,255\\,0)', '-frames:v', '1']),
  gen('scan.bmp', ['-f', 'lavfi', '-i', 'testsrc2=s=1600x1200', '-frames:v', '1']),
  gen('clipe.mkv', ['-f', 'lavfi', '-i', 'testsrc2=s=1920x1080:r=30:d=12', '-f', 'lavfi', '-i', 'sine=f=440:d=12',
    '-c:v', 'libx264', '-preset', 'veryfast', '-b:v', '8M', '-c:a', 'aac', '-b:a', '192k']),
  gen('vertical.mov', ['-f', 'lavfi', '-i', 'testsrc2=s=1080x1920:r=30:d=6', '-f', 'lavfi', '-i', 'sine=f=220:d=6',
    '-c:v', 'libx264', '-preset', 'veryfast', '-b:v', '6M', '-c:a', 'aac']),
  gen('voz.wav', ['-f', 'lavfi', '-i', 'anoisesrc=d=30:c=pink:a=0.2', '-ac', '2', '-ar', '48000']),
  gen('musica.mp3', ['-f', 'lavfi', '-i', 'sine=f=330:d=25', '-ac', '2', '-b:a', '128k']),
];

const hw = await hwmod.detect(null);
console.log('Hardware:', JSON.stringify(hw));
jobs.setHardware(hw);

const list = await jobs.addPaths(files);
for (const it of list) console.log(`  ${it.ok ? 'ok ' : 'ERR'} ${it.name.padEnd(14)} ${it.category.padEnd(6)} ${it.meta} ${it.error || ''}`);

const settings = {
  image: { objective: 'balanced', quality: 80, resize: 'original', stripMetadata: true },
  video: { objective: 'balanced', quality: 60, resolution: 'original', engine: 'auto', codec: 'h264' },
  audio: { quality: 57, background: 'wave' },
};
const byName = Object.fromEntries(list.map((i) => [i.name, i]));
const plan = [
  ['foto.jpg', 'webp'], ['foto.jpg', 'avif'], ['foto.jpg', 'png'], ['foto.jpg', 'jpg'], ['logo.png', 'jpg'],
  ['logo.png', 'ico'], ['logo.png', 'webp'], ['scan.bmp', 'png'], ['foto.jpg', 'bmp'], ['foto.jpg', 'tiff'],
  ['clipe.mkv', 'mp4'], ['clipe.mkv', 'avi'], ['clipe.mkv', 'webm'], ['clipe.mkv', 'gif'], ['clipe.mkv', 'mp3'],
  ['vertical.mov', 'mp4'], ['voz.wav', 'mp3'], ['voz.wav', 'flac'], ['musica.mp3', 'wav'], ['musica.mp3', 'mp4'], ['musica.mp3', 'opus'],
];
const jobsList = plan.map(([n, t]) => ({ id: byName[n].id, target: t, label: `${n} > ${t}` }));

// Converte em lotes por destino diferente da mesma origem (a fila aceita qualquer mistura).
// A estimativa é por item (na tela cada arquivo tem um destino), então estima job a job.
const est = {};
for (const j of jobsList) est[j.label] = (await jobs.estimate([j], settings))[j.id];
const results = {};
const t0 = Date.now();
for (const j of jobsList) {
  // um job por vez aqui só pra facilitar a leitura do relatório
  await jobs.convertAll([j], settings, { mode: 'folder', folder: OUT }, (ev) => {
    if (ev.status === 'done' || ev.status === 'error') results[j.label] = ev;
  });
}
console.log(`\nConversões em ${((Date.now() - t0) / 1000).toFixed(1)} s`);
const mb = (b) => (b / 1e6).toFixed(2).padStart(7);
console.log('arquivo > destino          origem   estimado     real   erro');
for (const j of jobsList) {
  const it = list.find((i) => i.id === j.id);
  const e = est[j.label] || {};
  const r = results[j.label] || {};
  if (r.status === 'error') { console.log(`${j.label.padEnd(24)} ERRO: ${r.error}`); continue; }
  const err = r.outSize && e.bytes ? `${(((e.bytes - r.outSize) / r.outSize) * 100).toFixed(0)}%` : '-';
  console.log(`${j.label.padEnd(24)} ${mb(it.size)} ${mb(e.bytes || 0)} ${mb(r.outSize || 0)}  ${err.padStart(5)}  ${e.detail ? JSON.stringify(e.detail) : ''}`);
}
