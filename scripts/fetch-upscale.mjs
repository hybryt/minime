// Baixa o motor de "Aumentar com IA" e deixa em vendor/:
//   vendor/upscale-<sistema>-<arquitetura>/  binário do Real-ESRGAN (ncnn + Vulkan) de cada sistema
//   vendor/upscale-models/                   modelos (os mesmos no Windows e no Mac)
//     realesrgan-x4plus        foto, "Upscale padrão" (Real-ESRGAN, BSD-3)
//     realesr-general-x4v3     vídeo (Real-ESRGAN compacto, convertido do .pth oficial por convert-compact.mjs)
//     4x-UltraSharpV2.onnx     foto, "Qualidade máxima" (Kim2091, CC BY-NC-SA 4.0), roda no ONNX Runtime
// Uso: npm run fetch-upscale                (sistema e arquitetura desta máquina)
//      npm run fetch-upscale -- --mac        (Mac arm64 + x64)
//      npm run fetch-upscale -- --win        (Windows x64)
//      acrescente --force pra baixar de novo
import { createWriteStream, existsSync, mkdirSync, readdirSync, copyFileSync, rmSync, statSync, chmodSync, writeFileSync, readFileSync, renameSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { createHash } from 'node:crypto';
import os from 'node:os';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const VENDOR = join(ROOT, 'vendor');
const CACHE = join(VENDOR, '_cache');
const MODELS = join(VENDOR, 'upscale-models');
const argv = process.argv.slice(2);
const FORCE = argv.includes('--force');

const REL = 'https://github.com/xinntao/Real-ESRGAN/releases/download/v0.2.5.0';
// sha256 conferido no primeiro download (13/11/2026). Se o arquivo da origem mudar, o script para.
const FILES = {
  win: { url: `${REL}/realesrgan-ncnn-vulkan-20220424-windows.zip` },
  mac: { url: `${REL}/realesrgan-ncnn-vulkan-20220424-macos.zip` },
  general: { url: `${REL}/realesr-general-x4v3.pth` },
  v2: { url: 'https://huggingface.co/Kim2091/UltraSharpV2/resolve/main/4x-UltraSharpV2_fp32_op17.onnx' },
};
let HASHES = {};
try { HASHES = JSON.parse(readFileSync(join(ROOT, 'scripts', 'upscale-hashes.json'), 'utf8')); } catch {}

const targets = [];
if (argv.includes('--win')) targets.push(['win', 'x64']);
if (argv.includes('--mac')) targets.push(['mac', 'arm64'], ['mac', 'x64']);
if (!targets.length) {
  const plat = process.platform === 'win32' ? 'win' : process.platform === 'darwin' ? 'mac' : null;
  if (!plat) throw new Error('Sistema sem build configurado. Use --win ou --mac.');
  targets.push([plat, process.arch]);
}

const sha256 = (file) => createHash('sha256').update(readFileSync(file)).digest('hex');

async function download(key) {
  const { url } = FILES[key];
  mkdirSync(CACHE, { recursive: true });
  const file = join(CACHE, url.split('/').pop());
  if (!existsSync(file) || FORCE) {
    console.log('Baixando', url);
    const res = await fetch(url, { redirect: 'follow' });
    if (!res.ok) throw new Error(`Falha no download (${res.status}): ${url}`);
    const tmp = `${file}.part`;
    await pipeline(Readable.fromWeb(res.body), createWriteStream(tmp));
    renameSync(tmp, file);
    console.log(`  ${(statSync(file).size / 1e6).toFixed(1)} MB`);
  }
  const got = sha256(file);
  if (HASHES[key] && HASHES[key] !== got) throw new Error(`O arquivo ${file} não bate com o sha256 esperado (${HASHES[key]}). Apague e baixe de novo.`);
  if (!HASHES[key]) console.log(`  sha256 ${key}: ${got}`);
  return file;
}

function unzip(zip, dest) {
  const tar = process.platform === 'win32' ? join(process.env.SystemRoot || 'C:\\Windows', 'System32', 'tar.exe') : 'tar';
  mkdirSync(dest, { recursive: true });
  execFileSync(tar, ['-xf', zip, '-C', dest], { stdio: 'inherit' });
}

function findFile(dir, name) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) { const r = findFile(p, name); if (r) return r; } else if (e.name === name) return p;
  }
  return null;
}

// Arquitetura do executável do Mac: binário universal (fat) serve pros dois.
function machArchs(file) {
  const b = readFileSync(file);
  const magic = b.readUInt32BE(0);
  if (magic === 0xcafebabe) {
    const n = b.readUInt32BE(4);
    const out = [];
    for (let i = 0; i < n; i++) {
      const cpu = b.readUInt32BE(8 + i * 20);
      out.push(cpu === 0x01000007 ? 'x64' : cpu === 0x0100000c ? 'arm64' : `cpu${cpu}`);
    }
    return out;
  }
  const cpu = b.readUInt32LE(4);
  return [cpu === 0x01000007 ? 'x64' : cpu === 0x0100000c ? 'arm64' : `cpu${cpu}`];
}

async function engine(plat, arch) {
  const out = join(VENDOR, `upscale-${plat}-${arch}`);
  const exe = plat === 'win' ? 'realesrgan-ncnn-vulkan.exe' : 'realesrgan-ncnn-vulkan';
  if (existsSync(join(out, exe)) && !FORCE) { console.log(`Motor já está em vendor/upscale-${plat}-${arch}.`); return; }
  const zip = await download(plat);
  const tmp = join(os.tmpdir(), `minime-upscale-${plat}-${Date.now()}`);
  unzip(zip, tmp);
  rmSync(out, { recursive: true, force: true });
  mkdirSync(out, { recursive: true });
  const bin = findFile(tmp, exe);
  if (!bin) throw new Error(`${exe} não encontrado no zip.`);
  copyFileSync(bin, join(out, exe));
  if (plat === 'win') {
    // OpenMP da Microsoft: o executável não abre sem ele.
    const omp = findFile(tmp, 'vcomp140.dll');
    if (omp) copyFileSync(omp, join(out, 'vcomp140.dll'));
  } else {
    chmodSync(join(out, exe), 0o755);
    const archs = machArchs(join(out, exe));
    if (!archs.includes(arch)) throw new Error(`O binário do Mac não tem ${arch} (tem ${archs.join(', ')}).`);
    console.log(`  Mac: binário com ${archs.join(' + ')}`);
  }
  // Modelo de foto padrão vem junto no zip oficial.
  mkdirSync(MODELS, { recursive: true });
  for (const f of ['realesrgan-x4plus.param', 'realesrgan-x4plus.bin']) {
    const src = findFile(tmp, f);
    if (!src) throw new Error(`${f} não encontrado no zip.`);
    if (!existsSync(join(MODELS, f)) || FORCE) copyFileSync(src, join(MODELS, f));
  }
  rmSync(tmp, { recursive: true, force: true });
  console.log(`Pronto: vendor/upscale-${plat}-${arch}`);
}

async function models() {
  mkdirSync(MODELS, { recursive: true });
  const v2 = join(MODELS, '4x-UltraSharpV2.onnx');
  if (!existsSync(v2) || FORCE) copyFileSync(await download('v2'), v2);
  const gen = join(MODELS, 'realesr-general-x4v3.bin');
  if ((!existsSync(gen) || FORCE) && process.env.MINIME_SKIP_CONVERT !== '1') {
    const pth = await download('general');
    execFileSync(process.execPath, [join(ROOT, 'scripts', 'convert-compact.mjs'), pth, join(MODELS, 'realesr-general-x4v3')], { stdio: 'inherit' });
  }
  writeFileSync(join(MODELS, 'LICENSES.txt'), [
    'Modelos de "Aumentar com IA" do MINIME',
    '',
    'realesrgan-x4plus e realesr-general-x4v3: Real-ESRGAN, de Xintao Wang e equipe.',
    '  https://github.com/xinntao/Real-ESRGAN  (licença BSD-3-Clause)',
    '  realesr-general-x4v3 foi convertido do arquivo .pth oficial para o formato ncnn, sem retreinar.',
    'Motor realesrgan-ncnn-vulkan: https://github.com/xinntao/Real-ESRGAN-ncnn-vulkan (MIT) sobre ncnn da Tencent (BSD-3-Clause).',
    '',
    '4x-UltraSharpV2: de Kim2091. https://huggingface.co/Kim2091/UltraSharpV2',
    '  Licença CC BY-NC-SA 4.0: uso não comercial, com crédito ao autor, e obras derivadas na mesma licença.',
    '  O MINIME é gratuito e de código aberto. Quem usar o MINIME pra fins comerciais deve usar o modo "Upscale padrão".',
    '',
  ].join('\n'));
}

for (const [plat, arch] of targets) await engine(plat, arch);
await models();
const size = (d) => readdirSync(d).reduce((s, f) => s + statSync(join(d, f)).size, 0);
console.log(`Modelos: ${(size(MODELS) / 1e6).toFixed(1)} MB em vendor/upscale-models`);
