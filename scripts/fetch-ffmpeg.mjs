// Baixa o FFmpeg certo pra cada sistema e deixa em vendor/ffmpeg-<sistema>-<arquitetura>.
//   Windows x64: build GPL "shared" do BtbN (github.com/BtbN/FFmpeg-Builds)
//   Mac arm64 e x64: build estático do Martin Riedl (ffmpeg.martin-riedl.de), com VideoToolbox
// Uso: npm run fetch-ffmpeg                      (sistema e arquitetura desta máquina)
//      npm run fetch-ffmpeg -- --mac              (Mac arm64 + x64)
//      npm run fetch-ffmpeg -- --win              (Windows x64)
//      acrescente --force pra baixar de novo
import { createWriteStream, existsSync, mkdirSync, readdirSync, copyFileSync, rmSync, statSync, chmodSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import os from 'node:os';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const argv = process.argv.slice(2);
const FORCE = argv.includes('--force');
const BRANCH = process.env.FFMPEG_BRANCH || '8.1';

const targets = [];
if (argv.includes('--win')) targets.push(['win', 'x64']);
if (argv.includes('--mac')) targets.push(['mac', 'arm64'], ['mac', 'x64']);
if (!targets.length) {
  const plat = process.platform === 'win32' ? 'win' : process.platform === 'darwin' ? 'mac' : null;
  if (!plat) throw new Error('Sistema sem build configurado. Use --win ou --mac.');
  targets.push([plat, process.arch]);
}

async function download(url, file) {
  const res = await fetch(url, { redirect: 'follow' });
  if (!res.ok) throw new Error(`Falha no download (${res.status}): ${url}`);
  await pipeline(Readable.fromWeb(res.body), createWriteStream(file));
  return statSync(file).size;
}

function unzip(zip, dest) {
  const tar = process.platform === 'win32' ? join(process.env.SystemRoot || 'C:\\Windows', 'System32', 'tar.exe') : 'tar';
  mkdirSync(dest, { recursive: true });
  execFileSync(tar, ['-xf', zip, '-C', dest], { stdio: 'inherit' });
}

const dirSize = (d) => readdirSync(d).reduce((s, f) => s + statSync(join(d, f)).size, 0);

async function fetchWin(out) {
  const url = `https://github.com/BtbN/FFmpeg-Builds/releases/download/latest/ffmpeg-n${BRANCH}-latest-win64-gpl-shared-${BRANCH}.zip`;
  const tmp = join(os.tmpdir(), `minime-ffmpeg-${Date.now()}`);
  mkdirSync(tmp, { recursive: true });
  console.log('Baixando', url);
  const size = await download(url, join(tmp, 'ffmpeg.zip'));
  console.log(`Baixado: ${(size / 1e6).toFixed(1)} MB. Extraindo...`);
  unzip(join(tmp, 'ffmpeg.zip'), tmp);
  const top = readdirSync(tmp).find((d) => d.startsWith('ffmpeg-'));
  if (!top) throw new Error('Pasta do FFmpeg não encontrada no zip.');
  const bin = join(tmp, top, 'bin');
  for (const f of readdirSync(bin)) {
    if (f === 'ffplay.exe') continue;
    if (f.endsWith('.exe') || f.endsWith('.dll')) copyFileSync(join(bin, f), join(out, f));
  }
  const lic = join(tmp, top, 'LICENSE.txt');
  if (existsSync(lic)) copyFileSync(lic, join(out, 'LICENSE-ffmpeg.txt'));
  rmSync(tmp, { recursive: true, force: true });
}

async function fetchMac(out, arch) {
  const a = arch === 'arm64' ? 'arm64' : 'amd64';
  const tmp = join(os.tmpdir(), `minime-ffmpeg-mac-${arch}-${Date.now()}`);
  mkdirSync(tmp, { recursive: true });
  for (const tool of ['ffmpeg', 'ffprobe']) {
    const url = `https://ffmpeg.martin-riedl.de/redirect/latest/macos/${a}/release/${tool}.zip`;
    console.log('Baixando', url);
    const zip = join(tmp, `${tool}.zip`);
    const size = await download(url, zip);
    console.log(`  ${tool}: ${(size / 1e6).toFixed(1)} MB`);
    unzip(zip, tmp);
    copyFileSync(join(tmp, tool), join(out, tool));
    chmodSync(join(out, tool), 0o755);
  }
  writeFileSync(join(out, 'LICENSE-ffmpeg.txt'), 'FFmpeg (GPL v3), build estático de https://ffmpeg.martin-riedl.de/\nCódigo-fonte: https://ffmpeg.org\n');
  rmSync(tmp, { recursive: true, force: true });
}

for (const [plat, arch] of targets) {
  const out = join(ROOT, 'vendor', `ffmpeg-${plat}-${arch}`);
  const exe = plat === 'win' ? 'ffmpeg.exe' : 'ffmpeg';
  if (existsSync(join(out, exe)) && !FORCE) {
    console.log(`FFmpeg já está em vendor/ffmpeg-${plat}-${arch} (use --force pra baixar de novo).`);
    continue;
  }
  rmSync(out, { recursive: true, force: true });
  mkdirSync(out, { recursive: true });
  if (plat === 'win') await fetchWin(out);
  else await fetchMac(out, arch);
  console.log(`Pronto: vendor/ffmpeg-${plat}-${arch} (${(dirSize(out) / 1e6).toFixed(1)} MB)`);
}
