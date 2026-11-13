// Gera build/installer.nsh: o instalador grava o menu "Converter com MINIME" no registro do usuário
// e o desinstalador apaga tudo. A lista vem de src/main/shell.js (a mesma usada pelo app).
import { createRequire } from 'node:module';
import { writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const shell = require(join(ROOT, 'src/main/shell.js'));

const EXE = '$INSTDIR\\MINIME.exe';
const nsisStr = (s) => String(s).replace(/\$/g, '$$$$').replace(/"/g, '$\\"');

const install = [];
const uninstall = [];
for (const m of shell.menuSpec()) {
  const k = m.key;
  install.push(`  ; .${m.ext}`);
  install.push(`  WriteRegStr HKCU "${k}" "MUIVerb" "${nsisStr(shell.MENU_LABEL)}"`);
  install.push(`  WriteRegStr HKCU "${k}" "Icon" "${EXE},0"`);
  install.push(`  WriteRegStr HKCU "${k}" "SubCommands" ""`);
  install.push(`  WriteRegStr HKCU "${k}" "MultiSelectModel" "Player"`);
  for (const e of m.entries) {
    const sk = `${k}\\shell\\${e.key}`;
    install.push(`  WriteRegStr HKCU "${sk}" "MUIVerb" "${nsisStr(e.label)}"`);
    install.push(`  WriteRegStr HKCU "${sk}" "MultiSelectModel" "Player"`);
    if (e.flags) install.push(`  WriteRegDWORD HKCU "${sk}" "CommandFlags" ${e.flags}`);
    install.push(`  WriteRegStr HKCU "${sk}\\command" "" '"${EXE}" ${e.args} "%1"'`);
  }
  uninstall.push(`  DeleteRegKey HKCU "${k}"`);
}

const notify = "  System::Call 'shell32::SHChangeNotify(i 0x08000000, i 0, p 0, p 0)'";
const out = `; Gerado por scripts/gen-nsis.mjs. Não edite à mão.
; Menu do botão direito do MINIME (por usuário, sem pedir administrador).

!macro customInstall
${install.join('\n')}
${notify}
!macroend

!macro customUnInstall
${uninstall.join('\n')}
${notify}
!macroend
`;

// NSIS Unicode só lê UTF-8 com BOM; sem ele os acentos quebram.
writeFileSync(join(ROOT, 'build/installer.nsh'), `﻿${out}`, 'utf8');
console.log(`build/installer.nsh gerado (${shell.menuSpec().length} extensões).`);
