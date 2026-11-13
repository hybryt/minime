'use strict';
// Menu do botão direito do Windows ("Converter com MINIME ▸ PNG, WebP, ...").
// A mesma especificação gera o script do instalador (scripts/gen-nsis.mjs) e o registro em modo dev.
const { execFile } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const F = require('./engine/formats');

const ROOT_KEY = 'Software\\Classes\\SystemFileAssociations';
const MENU_NAME = 'MINIME';
const MENU_LABEL = 'Converter com MINIME';

// Ordem fixa por destino. A chave do registro define a ordem e permite seleção mista de arquivos.
const MENU = {
  image: [['jpg', 'JPG'], ['png', 'PNG'], ['webp', 'WebP'], ['avif', 'AVIF'], ['tiff', 'TIFF'], ['gif', 'GIF'], ['ico', 'ICO (ícone)'], ['mp4', 'MP4 (vídeo)']],
  video: [['mp4', 'MP4'], ['mov', 'MOV'], ['mkv', 'MKV'], ['avi', 'AVI'], ['webm', 'WebM'], ['gif', 'GIF animado'], ['mp3', 'MP3 (só o áudio)']],
  audio: [['mp3', 'MP3'], ['m4a', 'M4A'], ['wav', 'WAV'], ['flac', 'FLAC'], ['opus', 'Opus'], ['mp4', 'MP4 (vídeo com onda sonora)']],
};
const PREFIX = { image: 'i', video: 'v', audio: 'a' };
const COMPRESSIBLE = new Set(['jpg', 'png', 'webp', 'avif', 'gif', 'mp4', 'mkv', 'mov', 'avi', 'webm', 'mp3', 'm4a', 'ogg', 'opus']);

// ECF_SEPARATORBEFORE = 0x20, ECF_SEPARATORAFTER = 0x40
// .ts também é código TypeScript: fica fora do menu (mas o app aceita arrastando).
const NO_MENU = new Set(['ts']);

function menuSpec() {
  return F.ALL_IN.filter((ext) => !NO_MENU.has(ext)).map((ext) => {
    const cat = F.categoryOf(ext);
    const c = F.canonical(ext);
    const entries = [];
    // O Explorer ordena os itens pelo nome da chave: "00_" vem antes de qualquer letra.
    if (COMPRESSIBLE.has(c)) entries.push({ key: '00_same', label: 'Comprimir (mesmo formato)', args: '--quick same', flags: 0x40 });
    MENU[cat].forEach(([t, label], i) => {
      if (t === c) return;
      if (cat === 'image' && t === 'mp4' && ext !== 'gif') return;
      entries.push({ key: `${PREFIX[cat]}${String(10 + i)}_${t}`, label, args: `--quick ${t}`, flags: 0 });
    });
    entries.push({ key: 'z99_open', label: 'Abrir no MINIME…', args: '--open', flags: 0x20 });
    return { ext, key: `${ROOT_KEY}\\.${ext}\\shell\\${MENU_NAME}`, entries };
  });
}

// ---------- Registro em tempo de execução (modo dev e botão "reinstalar menu") ----------

function regEscape(s) { return String(s).replace(/\\/g, '\\\\').replace(/"/g, '\\"'); }

function buildRegFile(command) {
  const lines = ['Windows Registry Editor Version 5.00', ''];
  for (const m of menuSpec()) {
    const base = `HKEY_CURRENT_USER\\${m.key}`;
    lines.push(`[${base}]`, `"MUIVerb"="${regEscape(MENU_LABEL)}"`, `"Icon"="${regEscape(command.icon)}"`,
      '"SubCommands"=""', '"MultiSelectModel"="Player"', '');
    for (const e of m.entries) {
      lines.push(`[${base}\\shell\\${e.key}]`, `"MUIVerb"="${regEscape(e.label)}"`, '"MultiSelectModel"="Player"');
      if (e.flags) lines.push(`"CommandFlags"=dword:${e.flags.toString(16).padStart(8, '0')}`);
      lines.push('', `[${base}\\shell\\${e.key}\\command]`, `@="${regEscape(`${command.prefix} ${e.args} "%1"`)}"`, '');
    }
  }
  return lines.join('\r\n');
}

function buildUnregFile() {
  const lines = ['Windows Registry Editor Version 5.00', ''];
  for (const m of menuSpec()) lines.push(`[-HKEY_CURRENT_USER\\${m.key}]`, '');
  return lines.join('\r\n');
}

function regImport(content) {
  return new Promise((resolve, reject) => {
    const file = path.join(os.tmpdir(), `minime-${Date.now()}.reg`);
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

function register(cmd) { return regImport(buildRegFile(cmd)); }
function unregister() { return regImport(buildUnregFile()); }

function isRegistered() {
  return new Promise((resolve) => {
    execFile('reg.exe', ['query', `HKCU\\${ROOT_KEY}\\.jpg\\shell\\${MENU_NAME}`], { windowsHide: true }, (e) => resolve(!e));
  });
}

module.exports = { menuSpec, register, unregister, isRegistered, launchCommand, MENU_LABEL, ROOT_KEY, MENU_NAME };
