// Baixa o FFmpeg (build GPL "shared" do BtbN) e deixa só o necessário em vendor/ffmpeg.
// Uso: npm run fetch-ffmpeg
import { createWriteStream, existsSync, mkdirSync, readdirSync, copyFileSync, rmSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import os from 'node:os';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'vendor', 'ffmpeg');
const BRANCH = process.env.FFMPEG_BRANCH || '8.1';
const URL = `https://github.com/BtbN/FFmpeg-Builds/releases/download/latest/ffmpeg-n${BRANCH}-latest-win64-gpl-shared-${BRANCH}.zip`;

if (existsSync(join(OUT, 'ffmpeg.exe')) && !process.argv.includes('--force')) {
  console.log('FFmpeg já está em vendor/ffmpeg (use --force pra baixar de novo).');
  process.exit(0);
}

const tmp = join(os.tmpdir(), `minime-ffmpeg-${Date.now()}`);
mkdirSync(tmp, { recursive: true });
const zipPath = join(tmp, 'ffmpeg.zip');

console.log('Baixando', URL);
const res = await fetch(URL, { redirect: 'follow' });
if (!res.ok) throw new Error(`Falha no download: HTTP ${res.status}`);
await pipeline(Readable.fromWeb(res.body), createWriteStream(zipPath));
console.log(`Baixado: ${(statSync(zipPath).size / 1e6).toFixed(1)} MB. Extraindo...`);

const tar = join(process.env.SystemRoot || 'C:\\Windows', 'System32', 'tar.exe');
execFileSync(tar, ['-xf', zipPath, '-C', tmp], { stdio: 'inherit' });

const top = readdirSync(tmp).find((d) => d.startsWith('ffmpeg-'));
if (!top) throw new Error('Pasta do FFmpeg não encontrada no zip.');
const bin = join(tmp, top, 'bin');

rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });
for (const f of readdirSync(bin)) {
  if (f === 'ffplay.exe') continue; // não precisamos do player
  if (f.endsWith('.exe') || f.endsWith('.dll')) copyFileSync(join(bin, f), join(OUT, f));
}
const lic = join(tmp, top, 'LICENSE.txt');
if (existsSync(lic)) copyFileSync(lic, join(OUT, 'LICENSE-ffmpeg.txt'));
rmSync(tmp, { recursive: true, force: true });

const total = readdirSync(OUT).reduce((s, f) => s + statSync(join(OUT, f)).size, 0);
console.log(`Pronto: vendor/ffmpeg (${(total / 1e6).toFixed(1)} MB)`);
