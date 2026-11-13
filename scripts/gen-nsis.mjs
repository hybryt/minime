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
const RUN = 'Software\\Microsoft\\Windows\\CurrentVersion\\Run';
const out = `; Gerado por scripts/gen-nsis.mjs. Não edite à mão.
; Menu do botão direito do MINIME (por usuário, sem pedir administrador)
; e a tela "Preferências": atualizar automaticamente e abrir quando o Windows iniciar.

!include MUI2.nsh
!include nsDialogs.nsh
!include LogicLib.nsh

!ifndef BUILD_UNINSTALLER
  Var MinimePrefsShown
  Var MinimeAutoCtl
  Var MinimeLoginCtl
  Var MinimeAuto
  Var MinimeLogin

  Function MinimePrefsCreate
    !insertmacro MUI_HEADER_TEXT "Preferências" "Como o MINIME deve se comportar no seu computador. Dá pra mudar depois no app."
    nsDialogs::Create 1018
    Pop $0
    \${If} $0 == error
      Abort
    \${EndIf}
    StrCpy $MinimePrefsShown "1"
    \${NSD_CreateCheckbox} 0 6u 100% 12u "Atualizar o MINIME automaticamente"
    Pop $MinimeAutoCtl
    \${NSD_Check} $MinimeAutoCtl
    \${NSD_CreateLabel} 12u 20u 95% 20u "Sempre que o app abrir com internet, ele procura a versão mais nova no GitHub, baixa e instala quando você fechar."
    Pop $0
    \${NSD_CreateCheckbox} 0 50u 100% 12u "Abrir o MINIME quando o Windows iniciar"
    Pop $MinimeLoginCtl
    \${NSD_CreateLabel} 12u 64u 95% 20u "Desmarcado, o MINIME só roda quando você abre. Ao fechar a janela, ele para tudo na hora."
    Pop $0
    nsDialogs::Show
  FunctionEnd

  Function MinimePrefsLeave
    \${NSD_GetState} $MinimeAutoCtl $MinimeAuto
    \${NSD_GetState} $MinimeLoginCtl $MinimeLogin
  FunctionEnd
!endif

!macro customPageAfterChangeDir
  Page custom MinimePrefsCreate MinimePrefsLeave
!macroend

!macro customInstall
${install.join('\n')}
  ; Preferências: só grava quando a tela apareceu (atualização silenciosa mantém o que o usuário escolheu)
  \${If} $MinimePrefsShown == "1"
    WriteRegDWORD HKCU "Software\\MINIME" "AutoUpdate" $MinimeAuto
    \${If} $MinimeLogin == \${BST_CHECKED}
      WriteRegStr HKCU "${RUN}" "MINIME" '"$INSTDIR\\MINIME.exe" --login'
    \${Else}
      DeleteRegValue HKCU "${RUN}" "MINIME"
    \${EndIf}
  \${EndIf}
${notify}
!macroend

!macro customUnInstall
${uninstall.join('\n')}
  ; Desinstalação de verdade (não a troca de versão): remove início automático e preferências
  \${IfNot} \${isUpdated}
    DeleteRegValue HKCU "${RUN}" "MINIME"
    DeleteRegKey HKCU "Software\\MINIME"
  \${EndIf}
${notify}
!macroend
`;

// NSIS Unicode só lê UTF-8 com BOM; sem ele os acentos quebram.
writeFileSync(join(ROOT, 'build/installer.nsh'), `﻿${out}`, 'utf8');
console.log(`build/installer.nsh gerado (${shell.menuSpec().length} extensões).`);
