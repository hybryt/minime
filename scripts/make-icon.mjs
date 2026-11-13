// Gera o ícone do app (build/icon.ico + src/renderer/assets/icon.png) a partir de um SVG.
// Desenho: placa de tinta, um quadro branco (o arquivo) e, no canto, a versão mini dele em amarelo.
import sharp from 'sharp';
import { writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

const svg = (size) => `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 256 256">
  <rect x="8" y="8" width="240" height="240" rx="56" fill="#1B1B1F"/>
  <rect x="44" y="44" width="168" height="168" rx="30" fill="#F3F3F1"/>
  <rect x="128" y="128" width="64" height="64" rx="14" fill="#FFCC00"/>
  <rect x="64" y="64" width="40" height="8" rx="4" fill="#E6007E"/>
  <rect x="64" y="80" width="26" height="8" rx="4" fill="#009FE3"/>
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
