'use strict';
// Menu do botão direito do Windows: "Converter com MINIME ▸" com os atalhos de 1 clique do tipo do arquivo,
// "Mais formatos ▸" (abre a janela rápida com o formato escolhido) e "Abrir no MINIME…".
// Cada extensão aponta (ExtendedSubCommandsKey) pra uma árvore por tipo em HKCU\Software\Classes\MINIME.Menu.*,
// então trocar os atalhos nas Preferências reescreve só as 4 árvores.
// A mesma especificação gera o script do instalador (scripts/gen-nsis.mjs).
const { execFile } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const F = require('./engine/formats');
const presets = require('./presets');

const ROOT_KEY = 'Software\\Classes\\SystemFileAssociations';
const CLASSES = 'Software\\Classes';
const MENU_NAME = 'MINIME';
const MENU_LABEL = 'Converter com MINIME';

// "Mais formatos": todos os destinos de cada tipo, na janela rápida (dá pra ajustar antes de converter).
const MORE = {
  image: [['same', 'Comprimir (mesmo formato)'], ['jpg', 'JPG'], ['png', 'PNG'], ['webp', 'WebP'], ['avif', 'AVIF'], ['tiff', 'TIFF'], ['gif', 'GIF'], ['bmp', 'BMP'], ['ico', 'ICO (ícone)']],
  video: [['same', 'Comprimir (mesmo formato)'], ['mp4', 'MP4'], ['mkv', 'MKV'], ['mov', 'MOV'], ['avi', 'AVI'], ['webm', 'WebM'], ['gif', 'GIF animado'], ['mp3', 'MP3 (só o áudio)'], ['m4a', 'M4A (só o áudio)'], ['wav', 'WAV (só o áudio)']],
  audio: [['same', 'Comprimir (mesmo formato)'], ['mp3', 'MP3'], ['m4a', 'M4A'], ['wav', 'WAV'], ['flac', 'FLAC'], ['ogg', 'OGG'], ['opus', 'Opus'], ['mp4', 'MP4 (vídeo com onda sonora)']],
};
const TREES = [
  { id: 'Image', cat: 'image' },
  { id: 'ImageGif', cat: 'image', gif: true },
  { id: 'Video', cat: 'video' },
  { id: 'Audio', cat: 'audio' },
];
// ECF_SEPARATORBEFORE = 0x20
const SEP_BEFORE = 0x20;
// .ts também é código TypeScript: fica fora do menu (mas o app aceita arrastando).
const NO_MENU = new Set(['ts']);

const pad = (n) => String(n).padStart(2, '0');
const treeName = (t) => `MINIME.Menu.${t.id}`;

function treeFor(ext) {
  const cat = F.categoryOf(ext);
  if (cat === 'image') return ext === 'gif' ? 'ImageGif' : 'Image';
  return cat === 'video' ? 'Video' : 'Audio';
}

// O que o menu mostra, com a escolha de atalhos do usuário (ou a padrão).
function menuModel(menuPrefs) {
  const chosen = presets.normalizeMenu(menuPrefs);
  const trees = TREES.map((t) => {
    const entries = chosen[t.cat].map((id, i) => ({ key: `a${pad(i + 1)}_${id}`, label: presets.get(id).label, args: `--preset ${id}` }));
    const more = MORE[t.cat].slice();
    if (t.gif) more.push(['mp4', 'MP4 (vídeo)']);
    entries.push({
      key: 'y90_more', label: 'Mais formatos', flags: SEP_BEFORE,
      children: more.map(([target, label], i) => ({ key: `b${pad(i + 1)}_${target}`, label, args: `--quick ${target}` })),
    });
    entries.push({ key: 'z99_open', label: 'Abrir no MINIME…', args: '--open' });
    return { ...t, key: `${CLASSES}\\${treeName(t)}`, name: treeName(t), entries };
  });
  const exts = F.ALL_IN.filter((ext) => !NO_MENU.has(ext)).map((ext) => ({
    ext, key: `${ROOT_KEY}\\.${ext}\\shell\\${MENU_NAME}`, tree: `MINIME.Menu.${treeFor(ext)}`,
  }));
  return { trees, exts };
}

// ---------- Registro em tempo de execução (modo dev, Preferências e atualização) ----------

function regEscape(s) { return String(s).replace(/\\/g, '\\\\').replace(/"/g, '\\"'); }

function entryLines(base, e, command) {
  const k = `${base}\\shell\\${e.key}`;
  const lines = [`[${k}]`, `"MUIVerb"="${regEscape(e.label)}"`, '"MultiSelectModel"="Player"'];
  if (e.flags) lines.push(`"CommandFlags"=dword:${e.flags.toString(16).padStart(8, '0')}`);
  if (e.children) {
    lines.push('"SubCommands"=""', '');
    for (const c of e.children) lines.push(...entryLines(k, c, command));
    return lines;
  }
  lines.push('', `[${k}\\command]`, `@="${regEscape(`${command.prefix} ${e.args} "%1"`)}"`, '');
  return lines;
}

function treeLines(model, command) {
  const lines = [];
  for (const t of model.trees) {
    const base = `HKEY_CURRENT_USER\\${t.key}`;
    lines.push(`[-${base}]`, '', `[${base}]`, '');
    for (const e of t.entries) lines.push(...entryLines(base, e, command));
  }
  return lines;
}

function buildRegFile(command, menuPrefs) {
  const model = menuModel(menuPrefs);
  const lines = ['Windows Registry Editor Version 5.00', ''];
  for (const m of model.exts) {
    const base = `HKEY_CURRENT_USER\\${m.key}`;
    // Apaga antes: a versão 1.2 tinha os itens direto na extensão (SubCommands).
    lines.push(`[-${base}]`, '', `[${base}]`, `"MUIVerb"="${regEscape(MENU_LABEL)}"`, `"Icon"="${regEscape(command.icon)}"`,
      `"ExtendedSubCommandsKey"="${m.tree}"`, '"MultiSelectModel"="Player"', '');
  }
  lines.push(...treeLines(model, command));
  return lines.join('\r\n');
}

function buildTreesFile(command, menuPrefs) {
  return ['Windows Registry Editor Version 5.00', '', ...treeLines(menuModel(menuPrefs), command)].join('\r\n');
}

function buildUnregFile() {
  const model = menuModel(null);
  const lines = ['Windows Registry Editor Version 5.00', ''];
  for (const m of model.exts) lines.push(`[-HKEY_CURRENT_USER\\${m.key}]`, '');
  for (const t of model.trees) lines.push(`[-HKEY_CURRENT_USER\\${t.key}]`, '');
  return lines.join('\r\n');
}

function regImport(content) {
  return new Promise((resolve, reject) => {
    const file = path.join(os.tmpdir(), `minime-${process.pid}-${Date.now()}.reg`);
    fs.writeFileSync(file, Buffer.concat([Buffer.from([0xff, 0xfe]), Buffer.from(content, 'utf16le')]));
    execFile('reg.exe', ['import', file], { windowsHide: true }, (e) => {
      try { fs.unlinkSync(file); } catch {}
      if (e) reject(e); else resolve();
    });
  });
}

function launchCommand(isPackaged, execPath, appPath) {
  const exe = `"${execPath}"`;
  return {
    prefix: isPackaged ? exe : `${exe} "${appPath}"`,
    icon: isPackaged ? `${execPath},0` : path.join(appPath, 'build', 'icon.ico'),
  };
}

// O Explorer lê o registro toda vez que monta o menu: não precisa reiniciar nada.
async function register(cmd, menuPrefs) { await regImport(buildRegFile(cmd, menuPrefs)); }
async function applyPresets(cmd, menuPrefs) { await regImport(buildTreesFile(cmd, menuPrefs)); }
async function unregister() { await regImport(buildUnregFile()); }

function query(args) {
  return new Promise((resolve) => execFile('reg.exe', ['query', ...args], { windowsHide: true }, (e, out) => resolve(e ? null : String(out))));
}

// false = sem menu; 'old' = menu da versão 1.2 (itens direto na extensão); 'new' = menu com atalhos.
async function registrationState() {
  const out = await query([`HKCU\\${ROOT_KEY}\\.jpg\\shell\\${MENU_NAME}`]);
  if (out === null) return false;
  return /ExtendedSubCommandsKey/i.test(out) ? 'new' : 'old';
}
async function isRegistered() { return !!(await registrationState()); }

// O comando gravado aponta pra este executável? (portátil movido, reinstalado em outra pasta...)
// O reg.exe responde na página de código do console: acento vira outro caractere. Compara só o ASCII.
async function commandMatches(cmd) {
  const out = await query([`HKCU\\${CLASSES}\\MINIME.Menu.Image\\shell\\z99_open\\command`, '/ve']);
  const ascii = (s) => String(s).toLowerCase().replace(/[^\x20-\x7e]+/g, '?');
  return !!out && ascii(out).includes(ascii(cmd.prefix));
}

module.exports = {
  menuModel, register, unregister, applyPresets, isRegistered, registrationState, commandMatches, launchCommand,
  MENU_LABEL, ROOT_KEY, MENU_NAME, CLASSES, MORE,
};
