// Gera o ícone do app (build/icon.ico + src/renderer/assets/icon.png) a partir de um SVG.
// Desenho: squircle azul com brilho de vidro, um quadro branco (o arquivo) e, no canto, a versão mini dele.
import sharp from 'sharp';
import { writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

const svg = (size) => `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 256 256">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#4FA8FF"/><stop offset="1" stop-color="#5B3DF5"/></linearGradient>
    <linearGradient id="tile" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFFFFF"/><stop offset="1" stop-color="#E4ECFF"/></linearGradient>
    <linearGradient id="mini" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFC24D"/><stop offset="1" stop-color="#FF7A00"/></linearGradient>
    <linearGradient id="gloss" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFFFFF" stop-opacity=".38"/><stop offset=".5" stop-color="#FFFFFF" stop-opacity="0"/></linearGradient>
  </defs>
  <rect x="8" y="8" width="240" height="240" rx="56" fill="url(#bg)"/>
  <rect x="8" y="8" width="240" height="240" rx="56" fill="url(#gloss)"/>
  <rect x="50" y="50" width="156" height="156" rx="34" fill="url(#tile)" fill-opacity=".96"/>
  <rect x="122" y="122" width="62" height="62" rx="16" fill="url(#mini)"/>
  <rect x="9.5" y="9.5" width="237" height="237" rx="54.5" fill="none" stroke="#FFFFFF" stroke-opacity=".35" stroke-width="3"/>
</svg>`;

const sizes = [16, 24, 32, 48, 64, 128, 256];
const pngs = await Promise.all(sizes.map((s) => sharp(Buffer.from(svg(s))).png().toBuffer()));

const header = Buffer.alloc(6 + 16 * sizes.length);
header.writeUInt16LE(0, 0); header.writeUInt16LE(1, 2); header.writeUInt16LE(sizes.length, 4);
let offset = header.length;
sizes.forEach((z, i) => {
  const e = 6 + i * 16;
  header.writeUInt8(z >= 256 ? 0 : z, e); header.writeUInt8(z >= 256 ? 0 : z, e + 1);
  header.writeUInt16LE(1, e + 4); header.writeUInt16LE(32, e + 6);
  header.writeUInt32LE(pngs[i].length, e + 8); header.writeUInt32LE(offset, e + 12);
  offset += pngs[i].length;
});

mkdirSync(join(ROOT, 'build'), { recursive: true });
mkdirSync(join(ROOT, 'src/renderer/assets'), { recursive: true });
writeFileSync(join(ROOT, 'build/icon.ico'), Buffer.concat([header, ...pngs]));
writeFileSync(join(ROOT, 'src/renderer/assets/icon.png'), pngs[sizes.length - 1]);
writeFileSync(join(ROOT, 'src/renderer/assets/icon.svg'), svg(256));
console.log('Ícone gerado: build/icon.ico e src/renderer/assets/icon.png');
