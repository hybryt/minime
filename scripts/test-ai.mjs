// Teste do "Aumentar com IA" sem interface: gera imagens e um vídeo de exemplo, amplia nos 3 modos e mede.
// Uso: npm run test:ai [pasta-de-trabalho]   (precisa de npm run fetch-ffmpeg e npm run fetch-upscale antes)
import { createRequire } from 'node:module';
import { mkdirSync, existsSync, rmSync, readdirSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import os from 'node:os';

const require = createRequire(import.meta.url);
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const E = (m) => require(join(ROOT, 'src/main/engine', m));
const ff = E('ffmpeg.js');
const jobs = E('jobs.js');
const up = E('upscale.js');
const decode = E('decode.js');
const hwmod = E('hardware.js');

const WORK = process.argv[2] || join(os.tmpdir(), 'minime-test-ai');
const IN = join(WORK, 'in');
const OUT = join(WORK, 'out');
rmSync(OUT, { recursive: true, force: true });
mkdirSync(IN, { recursive: true });
mkdirSync(OUT, { recursive: true });

const gen = (name, args) => {
  const p = join(IN, name);
  if (!existsSync(p)) execFileSync(ff.ffmpegPath(), ['-hide_banner', '-loglevel', 'error', '-y', ...args, p]);
  return p;
};
gen('fractal.jpg', ['-f', 'lavfi', '-i', 'mandelbrot=s=960x540:end_pts=1', '-frames:v', '1', '-q:v', '5']);
gen('padrao.png', ['-f', 'lavfi', '-i', 'testsrc2=s=640x360', '-frames:v', '1']);
gen('grande.jpg', ['-f', 'lavfi', '-i', 'testsrc2=s=4000x3000', '-frames:v', '1']);
gen('clipe.mp4', ['-f', 'lavfi', '-i', 'testsrc2=s=640x360:r=30:d=3', '-f', 'lavfi', '-i', 'sine=f=440:d=3',
  '-c:v', 'libx264', '-preset', 'veryfast', '-c:a', 'aac']);

const settings = (image, video) => ({
  image: { objective: 'custom', quality: 90, resize: 'original', stripMetadata: true, upscale: 'off', upscaleSize: '4k', ...image },
  video: { objective: 'balanced', quality: 60, resolution: 'original', engine: 'auto', codec: 'h264', upscale: false, ...video },
  audio: { quality: 57, background: 'wave' },
});

let failures = 0;
async function run(label, names, s, check) {
  const items = await jobs.addPaths(names.map((n) => join(IN, n)));
  const list = items.map((i) => ({ id: i.id, target: i.category === 'video' ? 'mp4' : 'jpg' }));
  const t0 = Date.now();
  const errors = [];
  const r = await jobs.convertAll(list, s, { mode: 'folder', folder: OUT }, (e) => { if (e.status === 'error') errors.push(e.error); }, label);
  const ok = r.failed === 0 && check(r);
  if (!ok) failures++;
  console.log(`${ok ? 'ok  ' : 'FALHOU'} ${label.padEnd(28)} ${String(Date.now() - t0).padStart(6)} ms  ${r.done} pronto(s)${errors.length ? `  erros: ${errors.join(' | ')}` : ''}`);
}

const h = await hwmod.detect(join(WORK, 'hardware.json'));
jobs.setHardware(h);
console.log('Motor de IA:', JSON.stringify(up.available()));
await run('foto padrão (lote de 2)', ['fractal.jpg', 'padrao.png'], settings({ upscale: 'standard' }), (r) => r.done === 2);
if (up.available().max) await run('foto qualidade máxima', ['padrao.png'], settings({ upscale: 'max' }), (r) => r.done === 1);
else console.log('--   qualidade máxima indisponível neste computador');
await run('foto já em 4K (sem IA)', ['grande.jpg'], settings({ upscale: 'standard' }), (r) => r.done === 1);
await run('vídeo até 4K', ['clipe.mp4'], settings({}, { upscale: true }), (r) => r.done === 1);

for (const f of readdirSync(OUT)) console.log('   ', f, `${Math.round(statSync(join(OUT, f)).size / 1024)} KB`);
up.killAll();
decode.cleanup();
decode.cleanupWork();
console.log(failures ? `${failures} teste(s) falharam.` : 'Tudo certo.');
process.exit(failures ? 1 : 0);
