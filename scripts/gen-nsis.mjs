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

// Menu com os atalhos padrão. Se o usuário mudou os atalhos, o app regrava as árvores ao abrir.
const model = shell.menuModel(null);
const install = [];
const uninstall = [];
for (const m of model.exts) {
  install.push(`    ; .${m.ext}`);
  install.push(`    DeleteRegKey HKCU "${m.key}"`);
  install.push(`    WriteRegStr HKCU "${m.key}" "MUIVerb" "${nsisStr(shell.MENU_LABEL)}"`);
  install.push(`    WriteRegStr HKCU "${m.key}" "Icon" "${EXE},0"`);
  install.push(`    WriteRegStr HKCU "${m.key}" "ExtendedSubCommandsKey" "${m.tree}"`);
  install.push(`    WriteRegStr HKCU "${m.key}" "MultiSelectModel" "Player"`);
  uninstall.push(`  DeleteRegKey HKCU "${m.key}"`);
}
const entry = (base, e) => {
  const k = `${base}\\shell\\${e.key}`;
  install.push(`    WriteRegStr HKCU "${k}" "MUIVerb" "${nsisStr(e.label)}"`);
  install.push(`    WriteRegStr HKCU "${k}" "MultiSelectModel" "Player"`);
  if (e.flags) install.push(`    WriteRegDWORD HKCU "${k}" "CommandFlags" ${e.flags}`);
  if (e.children) {
    install.push(`    WriteRegStr HKCU "${k}" "SubCommands" ""`);
    for (const c of e.children) entry(k, c);
  } else install.push(`    WriteRegStr HKCU "${k}\\command" "" '"${EXE}" ${e.args} "%1"'`);
};
for (const t of model.trees) {
  install.push(`    ; árvore ${t.name}`);
  install.push(`    DeleteRegKey HKCU "${t.key}"`);
  for (const e of t.entries) entry(t.key, e);
  uninstall.push(`  DeleteRegKey HKCU "${t.key}"`);
}

const notify = "  System::Call 'shell32::SHChangeNotify(i 0x08000000, i 0, p 0, p 0)'";
const RUN = 'Software\\Microsoft\\Windows\\CurrentVersion\\Run';
const out = `; Gerado por scripts/gen-nsis.mjs. Não edite à mão.
; Menu do botão direito do MINIME (por usuário, sem pedir administrador)
; e a tela "Preferências": atualizar automaticamente e abrir quando o Windows iniciar.

!include MUI2.nsh
!include nsDialogs.nsh
!include LogicLib.nsh
!include FileFunc.nsh

; Texto do alto da tela de pasta (o mesmo volta quando a pasta escolhida é válida).
!define MINIME_DIR_TEXT "O MINIME será instalado na pasta abaixo, só pro seu usuário e sem pedir senha de administrador. Pra usar outra, clique em Procurar e escolha uma pasta sua."
!define MUI_DIRECTORYPAGE_TEXT_TOP "\${MINIME_DIR_TEXT}"

; Instala sempre só pro usuário: a tela "Para quem instalar" tinha uma opção só (a outra pede administrador).
!macro customInstallMode
  StrCpy $isForceCurrentInstall "1"
!macroend

!ifndef BUILD_UNINSTALLER
  Var MinimeMenuOff
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

  Var MinimeDirChecked
  Var MinimeDirOk

  ; Tela de pasta: o instalador roda sem administrador, então só aceita pasta onde o usuário consegue gravar.
  ; Antes, escolher Arquivos de Programas terminava com arquivo faltando e atalho quebrado.
  ; O NSIS chama esta função a cada mudança no campo (Abort trava o Próximo); o teste no disco
  ; só roda de novo quando muda a pasta testada.
  Function .onVerifyInstDir
    Push $0
    Push $1
    Push $2
    Push $3
    ; Sobe até a primeira pasta que já existe: é nela que o instalador cria a dele.
    StrCpy $0 $INSTDIR
    \${Do}
      StrCpy $1 $0 1 -1
      \${If} $1 == "\\"
        StrCpy $0 $0 -1
      \${ElseIf} $0 == ""
        \${Break}
      \${ElseIf} \${FileExists} "$0\\*.*"
        \${Break}
      \${Else}
        \${GetParent} $0 $1
        \${If} $1 == $0
          StrCpy $1 ""
        \${EndIf}
        StrCpy $0 $1
      \${EndIf}
    \${Loop}

    \${If} $0 == ""
      StrCpy $2 "-1"
    \${ElseIf} $0 == $MinimeDirChecked
      StrCpy $2 $MinimeDirOk
    \${Else}
      ; Cria uma pasta e um arquivo de teste, do jeito que a instalação faz (C:\\ deixa criar pasta mas não arquivo).
      StrCpy $2 "0"
      System::Call 'kernel32::GetTickCount()i.r1'
      StrCpy $1 "$0\\~minime-teste-$1"
      ClearErrors
      CreateDirectory "$1"
      \${IfNot} \${Errors}
        FileOpen $3 "$1\\gravar.tmp" w
        \${IfNot} \${Errors}
          FileClose $3
          Delete "$1\\gravar.tmp"
          StrCpy $2 "1"
        \${EndIf}
        RMDir "$1"
      \${EndIf}
      StrCpy $MinimeDirChecked $0
      StrCpy $MinimeDirOk $2
    \${EndIf}

    ; A tela de pasta virou a primeira (a de modo pula sozinha): sem isso, "Voltar" fecharia o instalador.
    ; O NSIS mostra o botão de novo nas telas seguintes.
    \${If} $HWNDPARENT <> 0
      GetDlgItem $1 $HWNDPARENT 3
      ShowWindow $1 \${SW_HIDE}
    \${EndIf}

    ; O motivo aparece no texto do alto da tela (controle 1006 da página de pasta), em vermelho.
    FindWindow $1 "#32770" "" $HWNDPARENT
    \${If} $1 <> 0
      GetDlgItem $1 $1 1006
    \${EndIf}
    \${If} $1 <> 0
      \${If} $2 == "1"
        SetCtlColors $1 SYSCLR:8 SYSCLR:15
        SendMessage $1 \${WM_SETTEXT} 0 "STR:\${MINIME_DIR_TEXT}"
      \${Else}
        \${If} $2 == "-1"
          StrCpy $3 "Essa unidade não existe neste computador. Escolha uma pasta numa unidade que exista, como $LOCALAPPDATA\\Programs\\MINIME."
        \${Else}
          StrCpy $3 "Essa pasta só aceita gravação com permissão de administrador, e o MINIME instala sem pedir senha. Escolha uma pasta sua, como $LOCALAPPDATA\\Programs\\MINIME."
        \${EndIf}
        ; a cor vem antes do texto: é a troca de texto que redesenha
        SetCtlColors $1 0xC42B1C SYSCLR:15
        SendMessage $1 \${WM_SETTEXT} 0 "STR:$3"
      \${EndIf}
    \${EndIf}

    \${If} $2 == "1"
      Pop $3
      Pop $2
      Pop $1
      Pop $0
    \${Else}
      Pop $3
      Pop $2
      Pop $1
      Pop $0
      Abort
    \${EndIf}
  FunctionEnd
!endif

!macro customPageAfterChangeDir
  Page custom MinimePrefsCreate MinimePrefsLeave
!macroend

!macro customInstall
  ; Menu do botão direito: só grava se o usuário não desligou no app (o app grava Menu=0 em HKCU\\Software\\MINIME).
  ReadRegDWORD $MinimeMenuOff HKCU "Software\\MINIME" "Menu"
  \${If} $MinimeMenuOff != "0"
${install.join('\n')}
  \${EndIf}
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
console.log(`build/installer.nsh gerado (${model.exts.length} extensões, ${model.trees.length} árvores de menu).`);
