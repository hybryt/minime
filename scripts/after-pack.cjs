// Depois de empacotar o Mac (antes de assinar): tira o que não roda nessa arquitetura.
//   sharp: bibliotecas da outra arquitetura
//   ONNX Runtime: cópia repetida da biblioteca (o binding usa libonnxruntime.1.dylib); no Mac Intel não existe
//     versão do ONNX Runtime, então sai tudo junto com o modelo da "Qualidade máxima"
//   Real-ESRGAN: o binário oficial é universal; fica só a parte desta arquitetura (lipo, quando disponível)
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const ARCH = { 1: 'x64', 3: 'arm64' };

function rm(p, label) {
  if (!fs.existsSync(p)) return;
  fs.rmSync(p, { recursive: true, force: true });
  console.log(`  after-pack: removido ${label}`);
}

// Windows: o ONNX Runtime vem com binários de todos os sistemas. Fica só o do Windows x64, sem o
// dxcompiler.dll (é do WebGPU; o DirectML roda sem ele, testado em 14/11/2026).
function afterPackWin(context) {
  const ortBin = path.join(context.appOutDir, 'resources', 'app.asar.unpacked', 'node_modules', 'onnxruntime-node', 'bin');
  if (!fs.existsSync(ortBin)) return;
  for (const v of fs.readdirSync(ortBin)) {
    const base = path.join(ortBin, v);
    for (const plat of fs.readdirSync(base)) if (plat !== 'win32') rm(path.join(base, plat), `onnxruntime-node ${plat}`);
    const win = path.join(base, 'win32');
    if (!fs.existsSync(win)) continue;
    for (const a of fs.readdirSync(win)) if (a !== 'x64') rm(path.join(win, a), `onnxruntime-node win32/${a}`);
    rm(path.join(win, 'x64', 'dxcompiler.dll'), 'onnxruntime-node dxcompiler.dll');
  }
}

exports.default = async function afterPack(context) {
  if (context.electronPlatformName === 'win32') return afterPackWin(context);
  if (context.electronPlatformName !== 'darwin') return;
  const arch = ARCH[context.arch];
  if (!arch) return;
  const other = arch === 'arm64' ? 'x64' : 'arm64';
  const app = `${context.packager.appInfo.productFilename}.app`;
  const res = path.join(context.appOutDir, app, 'Contents', 'Resources');
  const unpacked = path.join(res, 'app.asar.unpacked', 'node_modules');

  const img = path.join(unpacked, '@img');
  if (fs.existsSync(img)) {
    for (const d of fs.readdirSync(img)) {
      if (d.includes(`darwin-${other}`) || d.includes('win32') || d.includes('linux')) rm(path.join(img, d), `@img/${d}`);
    }
  }

  const ortBin = path.join(unpacked, 'onnxruntime-node', 'bin');
  if (arch === 'x64') {
    rm(ortBin, 'onnxruntime-node/bin (sem versão pra Mac Intel)');
    rm(path.join(res, 'upscale', 'models', '4x-UltraSharpV2.onnx'), 'modelo da qualidade máxima (Mac Intel)');
  } else if (fs.existsSync(ortBin)) {
    for (const v of fs.readdirSync(ortBin)) {
      for (const plat of fs.readdirSync(path.join(ortBin, v))) if (plat !== 'darwin') rm(path.join(ortBin, v, plat), `onnxruntime-node ${plat}`);
      const darwin = path.join(ortBin, v, 'darwin');
      if (fs.existsSync(path.join(darwin, other))) rm(path.join(darwin, other), `onnxruntime-node ${other}`);
      const dir = path.join(darwin, arch);
      if (!fs.existsSync(dir)) continue;
      for (const f of fs.readdirSync(dir)) {
        if (/^libonnxruntime\.\d+\.\d+\.\d+\.dylib$/.test(f) && fs.existsSync(path.join(dir, 'libonnxruntime.1.dylib'))) rm(path.join(dir, f), `onnxruntime-node ${f} (cópia repetida)`);
      }
    }
  }

  const ncnn = path.join(res, 'upscale', 'bin', 'realesrgan-ncnn-vulkan');
  if (fs.existsSync(ncnn)) {
    try {
      const thin = `${ncnn}.thin`;
      execFileSync('lipo', [ncnn, '-thin', arch === 'arm64' ? 'arm64' : 'x86_64', '-output', thin], { stdio: 'ignore' });
      fs.renameSync(thin, ncnn);
      fs.chmodSync(ncnn, 0o755);
      console.log(`  after-pack: realesrgan-ncnn-vulkan só ${arch}`);
    } catch { /* sem lipo (build fora do Mac): fica universal */ }
  }
};
