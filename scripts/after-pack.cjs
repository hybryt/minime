// Depois de empacotar o Mac: tira as bibliotecas do sharp da outra arquitetura
// (o app de Apple Silicon não precisa da versão Intel e vice-versa).
const fs = require('node:fs');
const path = require('node:path');

const ARCH = { 1: 'x64', 3: 'arm64' };

exports.default = async function afterPack(context) {
  if (context.electronPlatformName !== 'darwin') return;
  const arch = ARCH[context.arch];
  if (!arch) return;
  const other = arch === 'arm64' ? 'x64' : 'arm64';
  const app = `${context.packager.appInfo.productFilename}.app`;
  const img = path.join(context.appOutDir, app, 'Contents', 'Resources', 'app.asar.unpacked', 'node_modules', '@img');
  if (!fs.existsSync(img)) return;
  for (const d of fs.readdirSync(img)) {
    if (d.includes(`darwin-${other}`) || d.includes('win32') || d.includes('linux')) {
      fs.rmSync(path.join(img, d), { recursive: true, force: true });
      console.log(`  after-pack: removido @img/${d}`);
    }
  }
};
