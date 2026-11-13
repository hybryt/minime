; Gerado por scripts/gen-nsis.mjs. Não edite à mão.
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
    ${If} $0 == error
      Abort
    ${EndIf}
    StrCpy $MinimePrefsShown "1"
    ${NSD_CreateCheckbox} 0 6u 100% 12u "Atualizar o MINIME automaticamente"
    Pop $MinimeAutoCtl
    ${NSD_Check} $MinimeAutoCtl
    ${NSD_CreateLabel} 12u 20u 95% 20u "Sempre que o app abrir com internet, ele procura a versão mais nova no GitHub, baixa e instala quando você fechar."
    Pop $0
    ${NSD_CreateCheckbox} 0 50u 100% 12u "Abrir o MINIME quando o Windows iniciar"
    Pop $MinimeLoginCtl
    ${NSD_CreateLabel} 12u 64u 95% 20u "Desmarcado, o MINIME só roda quando você abre. Ao fechar a janela, ele para tudo na hora."
    Pop $0
    nsDialogs::Show
  FunctionEnd

  Function MinimePrefsLeave
    ${NSD_GetState} $MinimeAutoCtl $MinimeAuto
    ${NSD_GetState} $MinimeLoginCtl $MinimeLogin
  FunctionEnd
!endif

!macro customPageAfterChangeDir
  Page custom MinimePrefsCreate MinimePrefsLeave
!macroend

!macro customInstall
  ; .jpg
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.jpg\shell\MINIME" "MUIVerb" "Converter com MINIME"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.jpg\shell\MINIME" "Icon" "$INSTDIR\MINIME.exe,0"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.jpg\shell\MINIME" "SubCommands" ""
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.jpg\shell\MINIME" "MultiSelectModel" "Player"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.jpg\shell\MINIME\shell\00_same" "MUIVerb" "Comprimir (mesmo formato)"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.jpg\shell\MINIME\shell\00_same" "MultiSelectModel" "Player"
  WriteRegDWORD HKCU "Software\Classes\SystemFileAssociations\.jpg\shell\MINIME\shell\00_same" "CommandFlags" 64
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.jpg\shell\MINIME\shell\00_same\command" "" '"$INSTDIR\MINIME.exe" --quick same "%1"'
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.jpg\shell\MINIME\shell\i11_png" "MUIVerb" "PNG"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.jpg\shell\MINIME\shell\i11_png" "MultiSelectModel" "Player"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.jpg\shell\MINIME\shell\i11_png\command" "" '"$INSTDIR\MINIME.exe" --quick png "%1"'
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.jpg\shell\MINIME\shell\i12_webp" "MUIVerb" "WebP"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.jpg\shell\MINIME\shell\i12_webp" "MultiSelectModel" "Player"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.jpg\shell\MINIME\shell\i12_webp\command" "" '"$INSTDIR\MINIME.exe" --quick webp "%1"'
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.jpg\shell\MINIME\shell\i13_avif" "MUIVerb" "AVIF"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.jpg\shell\MINIME\shell\i13_avif" "MultiSelectModel" "Player"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.jpg\shell\MINIME\shell\i13_avif\command" "" '"$INSTDIR\MINIME.exe" --quick avif "%1"'
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.jpg\shell\MINIME\shell\i14_tiff" "MUIVerb" "TIFF"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.jpg\shell\MINIME\shell\i14_tiff" "MultiSelectModel" "Player"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.jpg\shell\MINIME\shell\i14_tiff\command" "" '"$INSTDIR\MINIME.exe" --quick tiff "%1"'
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.jpg\shell\MINIME\shell\i15_gif" "MUIVerb" "GIF"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.jpg\shell\MINIME\shell\i15_gif" "MultiSelectModel" "Player"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.jpg\shell\MINIME\shell\i15_gif\command" "" '"$INSTDIR\MINIME.exe" --quick gif "%1"'
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.jpg\shell\MINIME\shell\i16_ico" "MUIVerb" "ICO (ícone)"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.jpg\shell\MINIME\shell\i16_ico" "MultiSelectModel" "Player"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.jpg\shell\MINIME\shell\i16_ico\command" "" '"$INSTDIR\MINIME.exe" --quick ico "%1"'
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.jpg\shell\MINIME\shell\z99_open" "MUIVerb" "Abrir no MINIME…"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.jpg\shell\MINIME\shell\z99_open" "MultiSelectModel" "Player"
  WriteRegDWORD HKCU "Software\Classes\SystemFileAssociations\.jpg\shell\MINIME\shell\z99_open" "CommandFlags" 32
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.jpg\shell\MINIME\shell\z99_open\command" "" '"$INSTDIR\MINIME.exe" --open "%1"'
  ; .jpeg
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.jpeg\shell\MINIME" "MUIVerb" "Converter com MINIME"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.jpeg\shell\MINIME" "Icon" "$INSTDIR\MINIME.exe,0"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.jpeg\shell\MINIME" "SubCommands" ""
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.jpeg\shell\MINIME" "MultiSelectModel" "Player"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.jpeg\shell\MINIME\shell\00_same" "MUIVerb" "Comprimir (mesmo formato)"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.jpeg\shell\MINIME\shell\00_same" "MultiSelectModel" "Player"
  WriteRegDWORD HKCU "Software\Classes\SystemFileAssociations\.jpeg\shell\MINIME\shell\00_same" "CommandFlags" 64
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.jpeg\shell\MINIME\shell\00_same\command" "" '"$INSTDIR\MINIME.exe" --quick same "%1"'
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.jpeg\shell\MINIME\shell\i11_png" "MUIVerb" "PNG"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.jpeg\shell\MINIME\shell\i11_png" "MultiSelectModel" "Player"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.jpeg\shell\MINIME\shell\i11_png\command" "" '"$INSTDIR\MINIME.exe" --quick png "%1"'
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.jpeg\shell\MINIME\shell\i12_webp" "MUIVerb" "WebP"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.jpeg\shell\MINIME\shell\i12_webp" "MultiSelectModel" "Player"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.jpeg\shell\MINIME\shell\i12_webp\command" "" '"$INSTDIR\MINIME.exe" --quick webp "%1"'
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.jpeg\shell\MINIME\shell\i13_avif" "MUIVerb" "AVIF"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.jpeg\shell\MINIME\shell\i13_avif" "MultiSelectModel" "Player"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.jpeg\shell\MINIME\shell\i13_avif\command" "" '"$INSTDIR\MINIME.exe" --quick avif "%1"'
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.jpeg\shell\MINIME\shell\i14_tiff" "MUIVerb" "TIFF"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.jpeg\shell\MINIME\shell\i14_tiff" "MultiSelectModel" "Player"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.jpeg\shell\MINIME\shell\i14_tiff\command" "" '"$INSTDIR\MINIME.exe" --quick tiff "%1"'
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.jpeg\shell\MINIME\shell\i15_gif" "MUIVerb" "GIF"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.jpeg\shell\MINIME\shell\i15_gif" "MultiSelectModel" "Player"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.jpeg\shell\MINIME\shell\i15_gif\command" "" '"$INSTDIR\MINIME.exe" --quick gif "%1"'
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.jpeg\shell\MINIME\shell\i16_ico" "MUIVerb" "ICO (ícone)"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.jpeg\shell\MINIME\shell\i16_ico" "MultiSelectModel" "Player"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.jpeg\shell\MINIME\shell\i16_ico\command" "" '"$INSTDIR\MINIME.exe" --quick ico "%1"'
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.jpeg\shell\MINIME\shell\z99_open" "MUIVerb" "Abrir no MINIME…"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.jpeg\shell\MINIME\shell\z99_open" "MultiSelectModel" "Player"
  WriteRegDWORD HKCU "Software\Classes\SystemFileAssociations\.jpeg\shell\MINIME\shell\z99_open" "CommandFlags" 32
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.jpeg\shell\MINIME\shell\z99_open\command" "" '"$INSTDIR\MINIME.exe" --open "%1"'
  ; .jfif
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.jfif\shell\MINIME" "MUIVerb" "Converter com MINIME"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.jfif\shell\MINIME" "Icon" "$INSTDIR\MINIME.exe,0"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.jfif\shell\MINIME" "SubCommands" ""
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.jfif\shell\MINIME" "MultiSelectModel" "Player"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.jfif\shell\MINIME\shell\00_same" "MUIVerb" "Comprimir (mesmo formato)"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.jfif\shell\MINIME\shell\00_same" "MultiSelectModel" "Player"
  WriteRegDWORD HKCU "Software\Classes\SystemFileAssociations\.jfif\shell\MINIME\shell\00_same" "CommandFlags" 64
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.jfif\shell\MINIME\shell\00_same\command" "" '"$INSTDIR\MINIME.exe" --quick same "%1"'
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.jfif\shell\MINIME\shell\i11_png" "MUIVerb" "PNG"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.jfif\shell\MINIME\shell\i11_png" "MultiSelectModel" "Player"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.jfif\shell\MINIME\shell\i11_png\command" "" '"$INSTDIR\MINIME.exe" --quick png "%1"'
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.jfif\shell\MINIME\shell\i12_webp" "MUIVerb" "WebP"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.jfif\shell\MINIME\shell\i12_webp" "MultiSelectModel" "Player"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.jfif\shell\MINIME\shell\i12_webp\command" "" '"$INSTDIR\MINIME.exe" --quick webp "%1"'
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.jfif\shell\MINIME\shell\i13_avif" "MUIVerb" "AVIF"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.jfif\shell\MINIME\shell\i13_avif" "MultiSelectModel" "Player"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.jfif\shell\MINIME\shell\i13_avif\command" "" '"$INSTDIR\MINIME.exe" --quick avif "%1"'
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.jfif\shell\MINIME\shell\i14_tiff" "MUIVerb" "TIFF"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.jfif\shell\MINIME\shell\i14_tiff" "MultiSelectModel" "Player"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.jfif\shell\MINIME\shell\i14_tiff\command" "" '"$INSTDIR\MINIME.exe" --quick tiff "%1"'
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.jfif\shell\MINIME\shell\i15_gif" "MUIVerb" "GIF"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.jfif\shell\MINIME\shell\i15_gif" "MultiSelectModel" "Player"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.jfif\shell\MINIME\shell\i15_gif\command" "" '"$INSTDIR\MINIME.exe" --quick gif "%1"'
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.jfif\shell\MINIME\shell\i16_ico" "MUIVerb" "ICO (ícone)"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.jfif\shell\MINIME\shell\i16_ico" "MultiSelectModel" "Player"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.jfif\shell\MINIME\shell\i16_ico\command" "" '"$INSTDIR\MINIME.exe" --quick ico "%1"'
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.jfif\shell\MINIME\shell\z99_open" "MUIVerb" "Abrir no MINIME…"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.jfif\shell\MINIME\shell\z99_open" "MultiSelectModel" "Player"
  WriteRegDWORD HKCU "Software\Classes\SystemFileAssociations\.jfif\shell\MINIME\shell\z99_open" "CommandFlags" 32
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.jfif\shell\MINIME\shell\z99_open\command" "" '"$INSTDIR\MINIME.exe" --open "%1"'
  ; .png
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.png\shell\MINIME" "MUIVerb" "Converter com MINIME"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.png\shell\MINIME" "Icon" "$INSTDIR\MINIME.exe,0"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.png\shell\MINIME" "SubCommands" ""
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.png\shell\MINIME" "MultiSelectModel" "Player"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.png\shell\MINIME\shell\00_same" "MUIVerb" "Comprimir (mesmo formato)"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.png\shell\MINIME\shell\00_same" "MultiSelectModel" "Player"
  WriteRegDWORD HKCU "Software\Classes\SystemFileAssociations\.png\shell\MINIME\shell\00_same" "CommandFlags" 64
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.png\shell\MINIME\shell\00_same\command" "" '"$INSTDIR\MINIME.exe" --quick same "%1"'
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.png\shell\MINIME\shell\i10_jpg" "MUIVerb" "JPG"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.png\shell\MINIME\shell\i10_jpg" "MultiSelectModel" "Player"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.png\shell\MINIME\shell\i10_jpg\command" "" '"$INSTDIR\MINIME.exe" --quick jpg "%1"'
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.png\shell\MINIME\shell\i12_webp" "MUIVerb" "WebP"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.png\shell\MINIME\shell\i12_webp" "MultiSelectModel" "Player"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.png\shell\MINIME\shell\i12_webp\command" "" '"$INSTDIR\MINIME.exe" --quick webp "%1"'
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.png\shell\MINIME\shell\i13_avif" "MUIVerb" "AVIF"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.png\shell\MINIME\shell\i13_avif" "MultiSelectModel" "Player"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.png\shell\MINIME\shell\i13_avif\command" "" '"$INSTDIR\MINIME.exe" --quick avif "%1"'
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.png\shell\MINIME\shell\i14_tiff" "MUIVerb" "TIFF"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.png\shell\MINIME\shell\i14_tiff" "MultiSelectModel" "Player"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.png\shell\MINIME\shell\i14_tiff\command" "" '"$INSTDIR\MINIME.exe" --quick tiff "%1"'
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.png\shell\MINIME\shell\i15_gif" "MUIVerb" "GIF"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.png\shell\MINIME\shell\i15_gif" "MultiSelectModel" "Player"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.png\shell\MINIME\shell\i15_gif\command" "" '"$INSTDIR\MINIME.exe" --quick gif "%1"'
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.png\shell\MINIME\shell\i16_ico" "MUIVerb" "ICO (ícone)"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.png\shell\MINIME\shell\i16_ico" "MultiSelectModel" "Player"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.png\shell\MINIME\shell\i16_ico\command" "" '"$INSTDIR\MINIME.exe" --quick ico "%1"'
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.png\shell\MINIME\shell\z99_open" "MUIVerb" "Abrir no MINIME…"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.png\shell\MINIME\shell\z99_open" "MultiSelectModel" "Player"
  WriteRegDWORD HKCU "Software\Classes\SystemFileAssociations\.png\shell\MINIME\shell\z99_open" "CommandFlags" 32
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.png\shell\MINIME\shell\z99_open\command" "" '"$INSTDIR\MINIME.exe" --open "%1"'
  ; .webp
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.webp\shell\MINIME" "MUIVerb" "Converter com MINIME"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.webp\shell\MINIME" "Icon" "$INSTDIR\MINIME.exe,0"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.webp\shell\MINIME" "SubCommands" ""
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.webp\shell\MINIME" "MultiSelectModel" "Player"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.webp\shell\MINIME\shell\00_same" "MUIVerb" "Comprimir (mesmo formato)"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.webp\shell\MINIME\shell\00_same" "MultiSelectModel" "Player"
  WriteRegDWORD HKCU "Software\Classes\SystemFileAssociations\.webp\shell\MINIME\shell\00_same" "CommandFlags" 64
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.webp\shell\MINIME\shell\00_same\command" "" '"$INSTDIR\MINIME.exe" --quick same "%1"'
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.webp\shell\MINIME\shell\i10_jpg" "MUIVerb" "JPG"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.webp\shell\MINIME\shell\i10_jpg" "MultiSelectModel" "Player"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.webp\shell\MINIME\shell\i10_jpg\command" "" '"$INSTDIR\MINIME.exe" --quick jpg "%1"'
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.webp\shell\MINIME\shell\i11_png" "MUIVerb" "PNG"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.webp\shell\MINIME\shell\i11_png" "MultiSelectModel" "Player"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.webp\shell\MINIME\shell\i11_png\command" "" '"$INSTDIR\MINIME.exe" --quick png "%1"'
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.webp\shell\MINIME\shell\i13_avif" "MUIVerb" "AVIF"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.webp\shell\MINIME\shell\i13_avif" "MultiSelectModel" "Player"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.webp\shell\MINIME\shell\i13_avif\command" "" '"$INSTDIR\MINIME.exe" --quick avif "%1"'
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.webp\shell\MINIME\shell\i14_tiff" "MUIVerb" "TIFF"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.webp\shell\MINIME\shell\i14_tiff" "MultiSelectModel" "Player"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.webp\shell\MINIME\shell\i14_tiff\command" "" '"$INSTDIR\MINIME.exe" --quick tiff "%1"'
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.webp\shell\MINIME\shell\i15_gif" "MUIVerb" "GIF"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.webp\shell\MINIME\shell\i15_gif" "MultiSelectModel" "Player"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.webp\shell\MINIME\shell\i15_gif\command" "" '"$INSTDIR\MINIME.exe" --quick gif "%1"'
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.webp\shell\MINIME\shell\i16_ico" "MUIVerb" "ICO (ícone)"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.webp\shell\MINIME\shell\i16_ico" "MultiSelectModel" "Player"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.webp\shell\MINIME\shell\i16_ico\command" "" '"$INSTDIR\MINIME.exe" --quick ico "%1"'
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.webp\shell\MINIME\shell\z99_open" "MUIVerb" "Abrir no MINIME…"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.webp\shell\MINIME\shell\z99_open" "MultiSelectModel" "Player"
  WriteRegDWORD HKCU "Software\Classes\SystemFileAssociations\.webp\shell\MINIME\shell\z99_open" "CommandFlags" 32
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.webp\shell\MINIME\shell\z99_open\command" "" '"$INSTDIR\MINIME.exe" --open "%1"'
  ; .avif
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.avif\shell\MINIME" "MUIVerb" "Converter com MINIME"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.avif\shell\MINIME" "Icon" "$INSTDIR\MINIME.exe,0"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.avif\shell\MINIME" "SubCommands" ""
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.avif\shell\MINIME" "MultiSelectModel" "Player"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.avif\shell\MINIME\shell\00_same" "MUIVerb" "Comprimir (mesmo formato)"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.avif\shell\MINIME\shell\00_same" "MultiSelectModel" "Player"
  WriteRegDWORD HKCU "Software\Classes\SystemFileAssociations\.avif\shell\MINIME\shell\00_same" "CommandFlags" 64
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.avif\shell\MINIME\shell\00_same\command" "" '"$INSTDIR\MINIME.exe" --quick same "%1"'
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.avif\shell\MINIME\shell\i10_jpg" "MUIVerb" "JPG"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.avif\shell\MINIME\shell\i10_jpg" "MultiSelectModel" "Player"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.avif\shell\MINIME\shell\i10_jpg\command" "" '"$INSTDIR\MINIME.exe" --quick jpg "%1"'
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.avif\shell\MINIME\shell\i11_png" "MUIVerb" "PNG"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.avif\shell\MINIME\shell\i11_png" "MultiSelectModel" "Player"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.avif\shell\MINIME\shell\i11_png\command" "" '"$INSTDIR\MINIME.exe" --quick png "%1"'
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.avif\shell\MINIME\shell\i12_webp" "MUIVerb" "WebP"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.avif\shell\MINIME\shell\i12_webp" "MultiSelectModel" "Player"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.avif\shell\MINIME\shell\i12_webp\command" "" '"$INSTDIR\MINIME.exe" --quick webp "%1"'
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.avif\shell\MINIME\shell\i14_tiff" "MUIVerb" "TIFF"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.avif\shell\MINIME\shell\i14_tiff" "MultiSelectModel" "Player"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.avif\shell\MINIME\shell\i14_tiff\command" "" '"$INSTDIR\MINIME.exe" --quick tiff "%1"'
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.avif\shell\MINIME\shell\i15_gif" "MUIVerb" "GIF"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.avif\shell\MINIME\shell\i15_gif" "MultiSelectModel" "Player"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.avif\shell\MINIME\shell\i15_gif\command" "" '"$INSTDIR\MINIME.exe" --quick gif "%1"'
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.avif\shell\MINIME\shell\i16_ico" "MUIVerb" "ICO (ícone)"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.avif\shell\MINIME\shell\i16_ico" "MultiSelectModel" "Player"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.avif\shell\MINIME\shell\i16_ico\command" "" '"$INSTDIR\MINIME.exe" --quick ico "%1"'
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.avif\shell\MINIME\shell\z99_open" "MUIVerb" "Abrir no MINIME…"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.avif\shell\MINIME\shell\z99_open" "MultiSelectModel" "Player"
  WriteRegDWORD HKCU "Software\Classes\SystemFileAssociations\.avif\shell\MINIME\shell\z99_open" "CommandFlags" 32
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.avif\shell\MINIME\shell\z99_open\command" "" '"$INSTDIR\MINIME.exe" --open "%1"'
  ; .tif
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.tif\shell\MINIME" "MUIVerb" "Converter com MINIME"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.tif\shell\MINIME" "Icon" "$INSTDIR\MINIME.exe,0"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.tif\shell\MINIME" "SubCommands" ""
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.tif\shell\MINIME" "MultiSelectModel" "Player"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.tif\shell\MINIME\shell\i10_jpg" "MUIVerb" "JPG"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.tif\shell\MINIME\shell\i10_jpg" "MultiSelectModel" "Player"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.tif\shell\MINIME\shell\i10_jpg\command" "" '"$INSTDIR\MINIME.exe" --quick jpg "%1"'
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.tif\shell\MINIME\shell\i11_png" "MUIVerb" "PNG"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.tif\shell\MINIME\shell\i11_png" "MultiSelectModel" "Player"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.tif\shell\MINIME\shell\i11_png\command" "" '"$INSTDIR\MINIME.exe" --quick png "%1"'
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.tif\shell\MINIME\shell\i12_webp" "MUIVerb" "WebP"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.tif\shell\MINIME\shell\i12_webp" "MultiSelectModel" "Player"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.tif\shell\MINIME\shell\i12_webp\command" "" '"$INSTDIR\MINIME.exe" --quick webp "%1"'
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.tif\shell\MINIME\shell\i13_avif" "MUIVerb" "AVIF"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.tif\shell\MINIME\shell\i13_avif" "MultiSelectModel" "Player"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.tif\shell\MINIME\shell\i13_avif\command" "" '"$INSTDIR\MINIME.exe" --quick avif "%1"'
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.tif\shell\MINIME\shell\i15_gif" "MUIVerb" "GIF"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.tif\shell\MINIME\shell\i15_gif" "MultiSelectModel" "Player"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.tif\shell\MINIME\shell\i15_gif\command" "" '"$INSTDIR\MINIME.exe" --quick gif "%1"'
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.tif\shell\MINIME\shell\i16_ico" "MUIVerb" "ICO (ícone)"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.tif\shell\MINIME\shell\i16_ico" "MultiSelectModel" "Player"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.tif\shell\MINIME\shell\i16_ico\command" "" '"$INSTDIR\MINIME.exe" --quick ico "%1"'
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.tif\shell\MINIME\shell\z99_open" "MUIVerb" "Abrir no MINIME…"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.tif\shell\MINIME\shell\z99_open" "MultiSelectModel" "Player"
  WriteRegDWORD HKCU "Software\Classes\SystemFileAssociations\.tif\shell\MINIME\shell\z99_open" "CommandFlags" 32
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.tif\shell\MINIME\shell\z99_open\command" "" '"$INSTDIR\MINIME.exe" --open "%1"'
  ; .tiff
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.tiff\shell\MINIME" "MUIVerb" "Converter com MINIME"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.tiff\shell\MINIME" "Icon" "$INSTDIR\MINIME.exe,0"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.tiff\shell\MINIME" "SubCommands" ""
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.tiff\shell\MINIME" "MultiSelectModel" "Player"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.tiff\shell\MINIME\shell\i10_jpg" "MUIVerb" "JPG"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.tiff\shell\MINIME\shell\i10_jpg" "MultiSelectModel" "Player"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.tiff\shell\MINIME\shell\i10_jpg\command" "" '"$INSTDIR\MINIME.exe" --quick jpg "%1"'
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.tiff\shell\MINIME\shell\i11_png" "MUIVerb" "PNG"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.tiff\shell\MINIME\shell\i11_png" "MultiSelectModel" "Player"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.tiff\shell\MINIME\shell\i11_png\command" "" '"$INSTDIR\MINIME.exe" --quick png "%1"'
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.tiff\shell\MINIME\shell\i12_webp" "MUIVerb" "WebP"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.tiff\shell\MINIME\shell\i12_webp" "MultiSelectModel" "Player"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.tiff\shell\MINIME\shell\i12_webp\command" "" '"$INSTDIR\MINIME.exe" --quick webp "%1"'
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.tiff\shell\MINIME\shell\i13_avif" "MUIVerb" "AVIF"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.tiff\shell\MINIME\shell\i13_avif" "MultiSelectModel" "Player"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.tiff\shell\MINIME\shell\i13_avif\command" "" '"$INSTDIR\MINIME.exe" --quick avif "%1"'
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.tiff\shell\MINIME\shell\i15_gif" "MUIVerb" "GIF"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.tiff\shell\MINIME\shell\i15_gif" "MultiSelectModel" "Player"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.tiff\shell\MINIME\shell\i15_gif\command" "" '"$INSTDIR\MINIME.exe" --quick gif "%1"'
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.tiff\shell\MINIME\shell\i16_ico" "MUIVerb" "ICO (ícone)"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.tiff\shell\MINIME\shell\i16_ico" "MultiSelectModel" "Player"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.tiff\shell\MINIME\shell\i16_ico\command" "" '"$INSTDIR\MINIME.exe" --quick ico "%1"'
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.tiff\shell\MINIME\shell\z99_open" "MUIVerb" "Abrir no MINIME…"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.tiff\shell\MINIME\shell\z99_open" "MultiSelectModel" "Player"
  WriteRegDWORD HKCU "Software\Classes\SystemFileAssociations\.tiff\shell\MINIME\shell\z99_open" "CommandFlags" 32
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.tiff\shell\MINIME\shell\z99_open\command" "" '"$INSTDIR\MINIME.exe" --open "%1"'
  ; .bmp
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.bmp\shell\MINIME" "MUIVerb" "Converter com MINIME"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.bmp\shell\MINIME" "Icon" "$INSTDIR\MINIME.exe,0"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.bmp\shell\MINIME" "SubCommands" ""
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.bmp\shell\MINIME" "MultiSelectModel" "Player"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.bmp\shell\MINIME\shell\i10_jpg" "MUIVerb" "JPG"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.bmp\shell\MINIME\shell\i10_jpg" "MultiSelectModel" "Player"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.bmp\shell\MINIME\shell\i10_jpg\command" "" '"$INSTDIR\MINIME.exe" --quick jpg "%1"'
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.bmp\shell\MINIME\shell\i11_png" "MUIVerb" "PNG"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.bmp\shell\MINIME\shell\i11_png" "MultiSelectModel" "Player"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.bmp\shell\MINIME\shell\i11_png\command" "" '"$INSTDIR\MINIME.exe" --quick png "%1"'
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.bmp\shell\MINIME\shell\i12_webp" "MUIVerb" "WebP"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.bmp\shell\MINIME\shell\i12_webp" "MultiSelectModel" "Player"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.bmp\shell\MINIME\shell\i12_webp\command" "" '"$INSTDIR\MINIME.exe" --quick webp "%1"'
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.bmp\shell\MINIME\shell\i13_avif" "MUIVerb" "AVIF"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.bmp\shell\MINIME\shell\i13_avif" "MultiSelectModel" "Player"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.bmp\shell\MINIME\shell\i13_avif\command" "" '"$INSTDIR\MINIME.exe" --quick avif "%1"'
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.bmp\shell\MINIME\shell\i14_tiff" "MUIVerb" "TIFF"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.bmp\shell\MINIME\shell\i14_tiff" "MultiSelectModel" "Player"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.bmp\shell\MINIME\shell\i14_tiff\command" "" '"$INSTDIR\MINIME.exe" --quick tiff "%1"'
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.bmp\shell\MINIME\shell\i15_gif" "MUIVerb" "GIF"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.bmp\shell\MINIME\shell\i15_gif" "MultiSelectModel" "Player"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.bmp\shell\MINIME\shell\i15_gif\command" "" '"$INSTDIR\MINIME.exe" --quick gif "%1"'
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.bmp\shell\MINIME\shell\i16_ico" "MUIVerb" "ICO (ícone)"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.bmp\shell\MINIME\shell\i16_ico" "MultiSelectModel" "Player"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.bmp\shell\MINIME\shell\i16_ico\command" "" '"$INSTDIR\MINIME.exe" --quick ico "%1"'
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.bmp\shell\MINIME\shell\z99_open" "MUIVerb" "Abrir no MINIME…"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.bmp\shell\MINIME\shell\z99_open" "MultiSelectModel" "Player"
  WriteRegDWORD HKCU "Software\Classes\SystemFileAssociations\.bmp\shell\MINIME\shell\z99_open" "CommandFlags" 32
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.bmp\shell\MINIME\shell\z99_open\command" "" '"$INSTDIR\MINIME.exe" --open "%1"'
  ; .gif
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.gif\shell\MINIME" "MUIVerb" "Converter com MINIME"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.gif\shell\MINIME" "Icon" "$INSTDIR\MINIME.exe,0"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.gif\shell\MINIME" "SubCommands" ""
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.gif\shell\MINIME" "MultiSelectModel" "Player"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.gif\shell\MINIME\shell\00_same" "MUIVerb" "Comprimir (mesmo formato)"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.gif\shell\MINIME\shell\00_same" "MultiSelectModel" "Player"
  WriteRegDWORD HKCU "Software\Classes\SystemFileAssociations\.gif\shell\MINIME\shell\00_same" "CommandFlags" 64
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.gif\shell\MINIME\shell\00_same\command" "" '"$INSTDIR\MINIME.exe" --quick same "%1"'
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.gif\shell\MINIME\shell\i10_jpg" "MUIVerb" "JPG"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.gif\shell\MINIME\shell\i10_jpg" "MultiSelectModel" "Player"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.gif\shell\MINIME\shell\i10_jpg\command" "" '"$INSTDIR\MINIME.exe" --quick jpg "%1"'
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.gif\shell\MINIME\shell\i11_png" "MUIVerb" "PNG"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.gif\shell\MINIME\shell\i11_png" "MultiSelectModel" "Player"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.gif\shell\MINIME\shell\i11_png\command" "" '"$INSTDIR\MINIME.exe" --quick png "%1"'
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.gif\shell\MINIME\shell\i12_webp" "MUIVerb" "WebP"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.gif\shell\MINIME\shell\i12_webp" "MultiSelectModel" "Player"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.gif\shell\MINIME\shell\i12_webp\command" "" '"$INSTDIR\MINIME.exe" --quick webp "%1"'
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.gif\shell\MINIME\shell\i13_avif" "MUIVerb" "AVIF"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.gif\shell\MINIME\shell\i13_avif" "MultiSelectModel" "Player"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.gif\shell\MINIME\shell\i13_avif\command" "" '"$INSTDIR\MINIME.exe" --quick avif "%1"'
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.gif\shell\MINIME\shell\i14_tiff" "MUIVerb" "TIFF"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.gif\shell\MINIME\shell\i14_tiff" "MultiSelectModel" "Player"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.gif\shell\MINIME\shell\i14_tiff\command" "" '"$INSTDIR\MINIME.exe" --quick tiff "%1"'
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.gif\shell\MINIME\shell\i16_ico" "MUIVerb" "ICO (ícone)"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.gif\shell\MINIME\shell\i16_ico" "MultiSelectModel" "Player"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.gif\shell\MINIME\shell\i16_ico\command" "" '"$INSTDIR\MINIME.exe" --quick ico "%1"'
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.gif\shell\MINIME\shell\i17_mp4" "MUIVerb" "MP4 (vídeo)"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.gif\shell\MINIME\shell\i17_mp4" "MultiSelectModel" "Player"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.gif\shell\MINIME\shell\i17_mp4\command" "" '"$INSTDIR\MINIME.exe" --quick mp4 "%1"'
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.gif\shell\MINIME\shell\z99_open" "MUIVerb" "Abrir no MINIME…"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.gif\shell\MINIME\shell\z99_open" "MultiSelectModel" "Player"
  WriteRegDWORD HKCU "Software\Classes\SystemFileAssociations\.gif\shell\MINIME\shell\z99_open" "CommandFlags" 32
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.gif\shell\MINIME\shell\z99_open\command" "" '"$INSTDIR\MINIME.exe" --open "%1"'
  ; .ico
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.ico\shell\MINIME" "MUIVerb" "Converter com MINIME"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.ico\shell\MINIME" "Icon" "$INSTDIR\MINIME.exe,0"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.ico\shell\MINIME" "SubCommands" ""
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.ico\shell\MINIME" "MultiSelectModel" "Player"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.ico\shell\MINIME\shell\i10_jpg" "MUIVerb" "JPG"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.ico\shell\MINIME\shell\i10_jpg" "MultiSelectModel" "Player"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.ico\shell\MINIME\shell\i10_jpg\command" "" '"$INSTDIR\MINIME.exe" --quick jpg "%1"'
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.ico\shell\MINIME\shell\i11_png" "MUIVerb" "PNG"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.ico\shell\MINIME\shell\i11_png" "MultiSelectModel" "Player"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.ico\shell\MINIME\shell\i11_png\command" "" '"$INSTDIR\MINIME.exe" --quick png "%1"'
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.ico\shell\MINIME\shell\i12_webp" "MUIVerb" "WebP"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.ico\shell\MINIME\shell\i12_webp" "MultiSelectModel" "Player"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.ico\shell\MINIME\shell\i12_webp\command" "" '"$INSTDIR\MINIME.exe" --quick webp "%1"'
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.ico\shell\MINIME\shell\i13_avif" "MUIVerb" "AVIF"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.ico\shell\MINIME\shell\i13_avif" "MultiSelectModel" "Player"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.ico\shell\MINIME\shell\i13_avif\command" "" '"$INSTDIR\MINIME.exe" --quick avif "%1"'
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.ico\shell\MINIME\shell\i14_tiff" "MUIVerb" "TIFF"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.ico\shell\MINIME\shell\i14_tiff" "MultiSelectModel" "Player"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.ico\shell\MINIME\shell\i14_tiff\command" "" '"$INSTDIR\MINIME.exe" --quick tiff "%1"'
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.ico\shell\MINIME\shell\i15_gif" "MUIVerb" "GIF"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.ico\shell\MINIME\shell\i15_gif" "MultiSelectModel" "Player"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.ico\shell\MINIME\shell\i15_gif\command" "" '"$INSTDIR\MINIME.exe" --quick gif "%1"'
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.ico\shell\MINIME\shell\z99_open" "MUIVerb" "Abrir no MINIME…"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.ico\shell\MINIME\shell\z99_open" "MultiSelectModel" "Player"
  WriteRegDWORD HKCU "Software\Classes\SystemFileAssociations\.ico\shell\MINIME\shell\z99_open" "CommandFlags" 32
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.ico\shell\MINIME\shell\z99_open\command" "" '"$INSTDIR\MINIME.exe" --open "%1"'
  ; .svg
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.svg\shell\MINIME" "MUIVerb" "Converter com MINIME"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.svg\shell\MINIME" "Icon" "$INSTDIR\MINIME.exe,0"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.svg\shell\MINIME" "SubCommands" ""
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.svg\shell\MINIME" "MultiSelectModel" "Player"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.svg\shell\MINIME\shell\i10_jpg" "MUIVerb" "JPG"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.svg\shell\MINIME\shell\i10_jpg" "MultiSelectModel" "Player"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.svg\shell\MINIME\shell\i10_jpg\command" "" '"$INSTDIR\MINIME.exe" --quick jpg "%1"'
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.svg\shell\MINIME\shell\i11_png" "MUIVerb" "PNG"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.svg\shell\MINIME\shell\i11_png" "MultiSelectModel" "Player"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.svg\shell\MINIME\shell\i11_png\command" "" '"$INSTDIR\MINIME.exe" --quick png "%1"'
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.svg\shell\MINIME\shell\i12_webp" "MUIVerb" "WebP"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.svg\shell\MINIME\shell\i12_webp" "MultiSelectModel" "Player"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.svg\shell\MINIME\shell\i12_webp\command" "" '"$INSTDIR\MINIME.exe" --quick webp "%1"'
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.svg\shell\MINIME\shell\i13_avif" "MUIVerb" "AVIF"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.svg\shell\MINIME\shell\i13_avif" "MultiSelectModel" "Player"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.svg\shell\MINIME\shell\i13_avif\command" "" '"$INSTDIR\MINIME.exe" --quick avif "%1"'
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.svg\shell\MINIME\shell\i14_tiff" "MUIVerb" "TIFF"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.svg\shell\MINIME\shell\i14_tiff" "MultiSelectModel" "Player"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.svg\shell\MINIME\shell\i14_tiff\command" "" '"$INSTDIR\MINIME.exe" --quick tiff "%1"'
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.svg\shell\MINIME\shell\i15_gif" "MUIVerb" "GIF"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.svg\shell\MINIME\shell\i15_gif" "MultiSelectModel" "Player"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.svg\shell\MINIME\shell\i15_gif\command" "" '"$INSTDIR\MINIME.exe" --quick gif "%1"'
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.svg\shell\MINIME\shell\i16_ico" "MUIVerb" "ICO (ícone)"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.svg\shell\MINIME\shell\i16_ico" "MultiSelectModel" "Player"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.svg\shell\MINIME\shell\i16_ico\command" "" '"$INSTDIR\MINIME.exe" --quick ico "%1"'
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.svg\shell\MINIME\shell\z99_open" "MUIVerb" "Abrir no MINIME…"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.svg\shell\MINIME\shell\z99_open" "MultiSelectModel" "Player"
  WriteRegDWORD HKCU "Software\Classes\SystemFileAssociations\.svg\shell\MINIME\shell\z99_open" "CommandFlags" 32
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.svg\shell\MINIME\shell\z99_open\command" "" '"$INSTDIR\MINIME.exe" --open "%1"'
  ; .mp4
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.mp4\shell\MINIME" "MUIVerb" "Converter com MINIME"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.mp4\shell\MINIME" "Icon" "$INSTDIR\MINIME.exe,0"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.mp4\shell\MINIME" "SubCommands" ""
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.mp4\shell\MINIME" "MultiSelectModel" "Player"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.mp4\shell\MINIME\shell\00_same" "MUIVerb" "Comprimir (mesmo formato)"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.mp4\shell\MINIME\shell\00_same" "MultiSelectModel" "Player"
  WriteRegDWORD HKCU "Software\Classes\SystemFileAssociations\.mp4\shell\MINIME\shell\00_same" "CommandFlags" 64
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.mp4\shell\MINIME\shell\00_same\command" "" '"$INSTDIR\MINIME.exe" --quick same "%1"'
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.mp4\shell\MINIME\shell\v11_mov" "MUIVerb" "MOV"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.mp4\shell\MINIME\shell\v11_mov" "MultiSelectModel" "Player"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.mp4\shell\MINIME\shell\v11_mov\command" "" '"$INSTDIR\MINIME.exe" --quick mov "%1"'
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.mp4\shell\MINIME\shell\v12_mkv" "MUIVerb" "MKV"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.mp4\shell\MINIME\shell\v12_mkv" "MultiSelectModel" "Player"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.mp4\shell\MINIME\shell\v12_mkv\command" "" '"$INSTDIR\MINIME.exe" --quick mkv "%1"'
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.mp4\shell\MINIME\shell\v13_avi" "MUIVerb" "AVI"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.mp4\shell\MINIME\shell\v13_avi" "MultiSelectModel" "Player"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.mp4\shell\MINIME\shell\v13_avi\command" "" '"$INSTDIR\MINIME.exe" --quick avi "%1"'
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.mp4\shell\MINIME\shell\v14_webm" "MUIVerb" "WebM"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.mp4\shell\MINIME\shell\v14_webm" "MultiSelectModel" "Player"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.mp4\shell\MINIME\shell\v14_webm\command" "" '"$INSTDIR\MINIME.exe" --quick webm "%1"'
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.mp4\shell\MINIME\shell\v15_gif" "MUIVerb" "GIF animado"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.mp4\shell\MINIME\shell\v15_gif" "MultiSelectModel" "Player"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.mp4\shell\MINIME\shell\v15_gif\command" "" '"$INSTDIR\MINIME.exe" --quick gif "%1"'
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.mp4\shell\MINIME\shell\v16_mp3" "MUIVerb" "MP3 (só o áudio)"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.mp4\shell\MINIME\shell\v16_mp3" "MultiSelectModel" "Player"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.mp4\shell\MINIME\shell\v16_mp3\command" "" '"$INSTDIR\MINIME.exe" --quick mp3 "%1"'
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.mp4\shell\MINIME\shell\z99_open" "MUIVerb" "Abrir no MINIME…"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.mp4\shell\MINIME\shell\z99_open" "MultiSelectModel" "Player"
  WriteRegDWORD HKCU "Software\Classes\SystemFileAssociations\.mp4\shell\MINIME\shell\z99_open" "CommandFlags" 32
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.mp4\shell\MINIME\shell\z99_open\command" "" '"$INSTDIR\MINIME.exe" --open "%1"'
  ; .m4v
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.m4v\shell\MINIME" "MUIVerb" "Converter com MINIME"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.m4v\shell\MINIME" "Icon" "$INSTDIR\MINIME.exe,0"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.m4v\shell\MINIME" "SubCommands" ""
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.m4v\shell\MINIME" "MultiSelectModel" "Player"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.m4v\shell\MINIME\shell\v10_mp4" "MUIVerb" "MP4"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.m4v\shell\MINIME\shell\v10_mp4" "MultiSelectModel" "Player"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.m4v\shell\MINIME\shell\v10_mp4\command" "" '"$INSTDIR\MINIME.exe" --quick mp4 "%1"'
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.m4v\shell\MINIME\shell\v11_mov" "MUIVerb" "MOV"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.m4v\shell\MINIME\shell\v11_mov" "MultiSelectModel" "Player"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.m4v\shell\MINIME\shell\v11_mov\command" "" '"$INSTDIR\MINIME.exe" --quick mov "%1"'
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.m4v\shell\MINIME\shell\v12_mkv" "MUIVerb" "MKV"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.m4v\shell\MINIME\shell\v12_mkv" "MultiSelectModel" "Player"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.m4v\shell\MINIME\shell\v12_mkv\command" "" '"$INSTDIR\MINIME.exe" --quick mkv "%1"'
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.m4v\shell\MINIME\shell\v13_avi" "MUIVerb" "AVI"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.m4v\shell\MINIME\shell\v13_avi" "MultiSelectModel" "Player"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.m4v\shell\MINIME\shell\v13_avi\command" "" '"$INSTDIR\MINIME.exe" --quick avi "%1"'
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.m4v\shell\MINIME\shell\v14_webm" "MUIVerb" "WebM"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.m4v\shell\MINIME\shell\v14_webm" "MultiSelectModel" "Player"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.m4v\shell\MINIME\shell\v14_webm\command" "" '"$INSTDIR\MINIME.exe" --quick webm "%1"'
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.m4v\shell\MINIME\shell\v15_gif" "MUIVerb" "GIF animado"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.m4v\shell\MINIME\shell\v15_gif" "MultiSelectModel" "Player"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.m4v\shell\MINIME\shell\v15_gif\command" "" '"$INSTDIR\MINIME.exe" --quick gif "%1"'
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.m4v\shell\MINIME\shell\v16_mp3" "MUIVerb" "MP3 (só o áudio)"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.m4v\shell\MINIME\shell\v16_mp3" "MultiSelectModel" "Player"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.m4v\shell\MINIME\shell\v16_mp3\command" "" '"$INSTDIR\MINIME.exe" --quick mp3 "%1"'
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.m4v\shell\MINIME\shell\z99_open" "MUIVerb" "Abrir no MINIME…"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.m4v\shell\MINIME\shell\z99_open" "MultiSelectModel" "Player"
  WriteRegDWORD HKCU "Software\Classes\SystemFileAssociations\.m4v\shell\MINIME\shell\z99_open" "CommandFlags" 32
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.m4v\shell\MINIME\shell\z99_open\command" "" '"$INSTDIR\MINIME.exe" --open "%1"'
  ; .mkv
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.mkv\shell\MINIME" "MUIVerb" "Converter com MINIME"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.mkv\shell\MINIME" "Icon" "$INSTDIR\MINIME.exe,0"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.mkv\shell\MINIME" "SubCommands" ""
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.mkv\shell\MINIME" "MultiSelectModel" "Player"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.mkv\shell\MINIME\shell\00_same" "MUIVerb" "Comprimir (mesmo formato)"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.mkv\shell\MINIME\shell\00_same" "MultiSelectModel" "Player"
  WriteRegDWORD HKCU "Software\Classes\SystemFileAssociations\.mkv\shell\MINIME\shell\00_same" "CommandFlags" 64
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.mkv\shell\MINIME\shell\00_same\command" "" '"$INSTDIR\MINIME.exe" --quick same "%1"'
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.mkv\shell\MINIME\shell\v10_mp4" "MUIVerb" "MP4"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.mkv\shell\MINIME\shell\v10_mp4" "MultiSelectModel" "Player"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.mkv\shell\MINIME\shell\v10_mp4\command" "" '"$INSTDIR\MINIME.exe" --quick mp4 "%1"'
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.mkv\shell\MINIME\shell\v11_mov" "MUIVerb" "MOV"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.mkv\shell\MINIME\shell\v11_mov" "MultiSelectModel" "Player"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.mkv\shell\MINIME\shell\v11_mov\command" "" '"$INSTDIR\MINIME.exe" --quick mov "%1"'
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.mkv\shell\MINIME\shell\v13_avi" "MUIVerb" "AVI"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.mkv\shell\MINIME\shell\v13_avi" "MultiSelectModel" "Player"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.mkv\shell\MINIME\shell\v13_avi\command" "" '"$INSTDIR\MINIME.exe" --quick avi "%1"'
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.mkv\shell\MINIME\shell\v14_webm" "MUIVerb" "WebM"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.mkv\shell\MINIME\shell\v14_webm" "MultiSelectModel" "Player"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.mkv\shell\MINIME\shell\v14_webm\command" "" '"$INSTDIR\MINIME.exe" --quick webm "%1"'
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.mkv\shell\MINIME\shell\v15_gif" "MUIVerb" "GIF animado"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.mkv\shell\MINIME\shell\v15_gif" "MultiSelectModel" "Player"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.mkv\shell\MINIME\shell\v15_gif\command" "" '"$INSTDIR\MINIME.exe" --quick gif "%1"'
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.mkv\shell\MINIME\shell\v16_mp3" "MUIVerb" "MP3 (só o áudio)"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.mkv\shell\MINIME\shell\v16_mp3" "MultiSelectModel" "Player"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.mkv\shell\MINIME\shell\v16_mp3\command" "" '"$INSTDIR\MINIME.exe" --quick mp3 "%1"'
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.mkv\shell\MINIME\shell\z99_open" "MUIVerb" "Abrir no MINIME…"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.mkv\shell\MINIME\shell\z99_open" "MultiSelectModel" "Player"
  WriteRegDWORD HKCU "Software\Classes\SystemFileAssociations\.mkv\shell\MINIME\shell\z99_open" "CommandFlags" 32
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.mkv\shell\MINIME\shell\z99_open\command" "" '"$INSTDIR\MINIME.exe" --open "%1"'
  ; .mov
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.mov\shell\MINIME" "MUIVerb" "Converter com MINIME"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.mov\shell\MINIME" "Icon" "$INSTDIR\MINIME.exe,0"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.mov\shell\MINIME" "SubCommands" ""
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.mov\shell\MINIME" "MultiSelectModel" "Player"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.mov\shell\MINIME\shell\00_same" "MUIVerb" "Comprimir (mesmo formato)"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.mov\shell\MINIME\shell\00_same" "MultiSelectModel" "Player"
  WriteRegDWORD HKCU "Software\Classes\SystemFileAssociations\.mov\shell\MINIME\shell\00_same" "CommandFlags" 64
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.mov\shell\MINIME\shell\00_same\command" "" '"$INSTDIR\MINIME.exe" --quick same "%1"'
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.mov\shell\MINIME\shell\v10_mp4" "MUIVerb" "MP4"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.mov\shell\MINIME\shell\v10_mp4" "MultiSelectModel" "Player"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.mov\shell\MINIME\shell\v10_mp4\command" "" '"$INSTDIR\MINIME.exe" --quick mp4 "%1"'
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.mov\shell\MINIME\shell\v12_mkv" "MUIVerb" "MKV"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.mov\shell\MINIME\shell\v12_mkv" "MultiSelectModel" "Player"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.mov\shell\MINIME\shell\v12_mkv\command" "" '"$INSTDIR\MINIME.exe" --quick mkv "%1"'
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.mov\shell\MINIME\shell\v13_avi" "MUIVerb" "AVI"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.mov\shell\MINIME\shell\v13_avi" "MultiSelectModel" "Player"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.mov\shell\MINIME\shell\v13_avi\command" "" '"$INSTDIR\MINIME.exe" --quick avi "%1"'
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.mov\shell\MINIME\shell\v14_webm" "MUIVerb" "WebM"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.mov\shell\MINIME\shell\v14_webm" "MultiSelectModel" "Player"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.mov\shell\MINIME\shell\v14_webm\command" "" '"$INSTDIR\MINIME.exe" --quick webm "%1"'
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.mov\shell\MINIME\shell\v15_gif" "MUIVerb" "GIF animado"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.mov\shell\MINIME\shell\v15_gif" "MultiSelectModel" "Player"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.mov\shell\MINIME\shell\v15_gif\command" "" '"$INSTDIR\MINIME.exe" --quick gif "%1"'
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.mov\shell\MINIME\shell\v16_mp3" "MUIVerb" "MP3 (só o áudio)"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.mov\shell\MINIME\shell\v16_mp3" "MultiSelectModel" "Player"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.mov\shell\MINIME\shell\v16_mp3\command" "" '"$INSTDIR\MINIME.exe" --quick mp3 "%1"'
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.mov\shell\MINIME\shell\z99_open" "MUIVerb" "Abrir no MINIME…"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.mov\shell\MINIME\shell\z99_open" "MultiSelectModel" "Player"
  WriteRegDWORD HKCU "Software\Classes\SystemFileAssociations\.mov\shell\MINIME\shell\z99_open" "CommandFlags" 32
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.mov\shell\MINIME\shell\z99_open\command" "" '"$INSTDIR\MINIME.exe" --open "%1"'
  ; .avi
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.avi\shell\MINIME" "MUIVerb" "Converter com MINIME"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.avi\shell\MINIME" "Icon" "$INSTDIR\MINIME.exe,0"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.avi\shell\MINIME" "SubCommands" ""
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.avi\shell\MINIME" "MultiSelectModel" "Player"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.avi\shell\MINIME\shell\00_same" "MUIVerb" "Comprimir (mesmo formato)"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.avi\shell\MINIME\shell\00_same" "MultiSelectModel" "Player"
  WriteRegDWORD HKCU "Software\Classes\SystemFileAssociations\.avi\shell\MINIME\shell\00_same" "CommandFlags" 64
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.avi\shell\MINIME\shell\00_same\command" "" '"$INSTDIR\MINIME.exe" --quick same "%1"'
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.avi\shell\MINIME\shell\v10_mp4" "MUIVerb" "MP4"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.avi\shell\MINIME\shell\v10_mp4" "MultiSelectModel" "Player"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.avi\shell\MINIME\shell\v10_mp4\command" "" '"$INSTDIR\MINIME.exe" --quick mp4 "%1"'
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.avi\shell\MINIME\shell\v11_mov" "MUIVerb" "MOV"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.avi\shell\MINIME\shell\v11_mov" "MultiSelectModel" "Player"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.avi\shell\MINIME\shell\v11_mov\command" "" '"$INSTDIR\MINIME.exe" --quick mov "%1"'
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.avi\shell\MINIME\shell\v12_mkv" "MUIVerb" "MKV"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.avi\shell\MINIME\shell\v12_mkv" "MultiSelectModel" "Player"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.avi\shell\MINIME\shell\v12_mkv\command" "" '"$INSTDIR\MINIME.exe" --quick mkv "%1"'
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.avi\shell\MINIME\shell\v14_webm" "MUIVerb" "WebM"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.avi\shell\MINIME\shell\v14_webm" "MultiSelectModel" "Player"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.avi\shell\MINIME\shell\v14_webm\command" "" '"$INSTDIR\MINIME.exe" --quick webm "%1"'
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.avi\shell\MINIME\shell\v15_gif" "MUIVerb" "GIF animado"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.avi\shell\MINIME\shell\v15_gif" "MultiSelectModel" "Player"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.avi\shell\MINIME\shell\v15_gif\command" "" '"$INSTDIR\MINIME.exe" --quick gif "%1"'
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.avi\shell\MINIME\shell\v16_mp3" "MUIVerb" "MP3 (só o áudio)"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.avi\shell\MINIME\shell\v16_mp3" "MultiSelectModel" "Player"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.avi\shell\MINIME\shell\v16_mp3\command" "" '"$INSTDIR\MINIME.exe" --quick mp3 "%1"'
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.avi\shell\MINIME\shell\z99_open" "MUIVerb" "Abrir no MINIME…"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.avi\shell\MINIME\shell\z99_open" "MultiSelectModel" "Player"
  WriteRegDWORD HKCU "Software\Classes\SystemFileAssociations\.avi\shell\MINIME\shell\z99_open" "CommandFlags" 32
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.avi\shell\MINIME\shell\z99_open\command" "" '"$INSTDIR\MINIME.exe" --open "%1"'
  ; .webm
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.webm\shell\MINIME" "MUIVerb" "Converter com MINIME"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.webm\shell\MINIME" "Icon" "$INSTDIR\MINIME.exe,0"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.webm\shell\MINIME" "SubCommands" ""
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.webm\shell\MINIME" "MultiSelectModel" "Player"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.webm\shell\MINIME\shell\00_same" "MUIVerb" "Comprimir (mesmo formato)"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.webm\shell\MINIME\shell\00_same" "MultiSelectModel" "Player"
  WriteRegDWORD HKCU "Software\Classes\SystemFileAssociations\.webm\shell\MINIME\shell\00_same" "CommandFlags" 64
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.webm\shell\MINIME\shell\00_same\command" "" '"$INSTDIR\MINIME.exe" --quick same "%1"'
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.webm\shell\MINIME\shell\v10_mp4" "MUIVerb" "MP4"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.webm\shell\MINIME\shell\v10_mp4" "MultiSelectModel" "Player"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.webm\shell\MINIME\shell\v10_mp4\command" "" '"$INSTDIR\MINIME.exe" --quick mp4 "%1"'
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.webm\shell\MINIME\shell\v11_mov" "MUIVerb" "MOV"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.webm\shell\MINIME\shell\v11_mov" "MultiSelectModel" "Player"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.webm\shell\MINIME\shell\v11_mov\command" "" '"$INSTDIR\MINIME.exe" --quick mov "%1"'
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.webm\shell\MINIME\shell\v12_mkv" "MUIVerb" "MKV"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.webm\shell\MINIME\shell\v12_mkv" "MultiSelectModel" "Player"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.webm\shell\MINIME\shell\v12_mkv\command" "" '"$INSTDIR\MINIME.exe" --quick mkv "%1"'
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.webm\shell\MINIME\shell\v13_avi" "MUIVerb" "AVI"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.webm\shell\MINIME\shell\v13_avi" "MultiSelectModel" "Player"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.webm\shell\MINIME\shell\v13_avi\command" "" '"$INSTDIR\MINIME.exe" --quick avi "%1"'
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.webm\shell\MINIME\shell\v15_gif" "MUIVerb" "GIF animado"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.webm\shell\MINIME\shell\v15_gif" "MultiSelectModel" "Player"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.webm\shell\MINIME\shell\v15_gif\command" "" '"$INSTDIR\MINIME.exe" --quick gif "%1"'
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.webm\shell\MINIME\shell\v16_mp3" "MUIVerb" "MP3 (só o áudio)"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.webm\shell\MINIME\shell\v16_mp3" "MultiSelectModel" "Player"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.webm\shell\MINIME\shell\v16_mp3\command" "" '"$INSTDIR\MINIME.exe" --quick mp3 "%1"'
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.webm\shell\MINIME\shell\z99_open" "MUIVerb" "Abrir no MINIME…"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.webm\shell\MINIME\shell\z99_open" "MultiSelectModel" "Player"
  WriteRegDWORD HKCU "Software\Classes\SystemFileAssociations\.webm\shell\MINIME\shell\z99_open" "CommandFlags" 32
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.webm\shell\MINIME\shell\z99_open\command" "" '"$INSTDIR\MINIME.exe" --open "%1"'
  ; .wmv
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.wmv\shell\MINIME" "MUIVerb" "Converter com MINIME"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.wmv\shell\MINIME" "Icon" "$INSTDIR\MINIME.exe,0"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.wmv\shell\MINIME" "SubCommands" ""
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.wmv\shell\MINIME" "MultiSelectModel" "Player"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.wmv\shell\MINIME\shell\v10_mp4" "MUIVerb" "MP4"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.wmv\shell\MINIME\shell\v10_mp4" "MultiSelectModel" "Player"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.wmv\shell\MINIME\shell\v10_mp4\command" "" '"$INSTDIR\MINIME.exe" --quick mp4 "%1"'
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.wmv\shell\MINIME\shell\v11_mov" "MUIVerb" "MOV"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.wmv\shell\MINIME\shell\v11_mov" "MultiSelectModel" "Player"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.wmv\shell\MINIME\shell\v11_mov\command" "" '"$INSTDIR\MINIME.exe" --quick mov "%1"'
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.wmv\shell\MINIME\shell\v12_mkv" "MUIVerb" "MKV"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.wmv\shell\MINIME\shell\v12_mkv" "MultiSelectModel" "Player"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.wmv\shell\MINIME\shell\v12_mkv\command" "" '"$INSTDIR\MINIME.exe" --quick mkv "%1"'
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.wmv\shell\MINIME\shell\v13_avi" "MUIVerb" "AVI"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.wmv\shell\MINIME\shell\v13_avi" "MultiSelectModel" "Player"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.wmv\shell\MINIME\shell\v13_avi\command" "" '"$INSTDIR\MINIME.exe" --quick avi "%1"'
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.wmv\shell\MINIME\shell\v14_webm" "MUIVerb" "WebM"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.wmv\shell\MINIME\shell\v14_webm" "MultiSelectModel" "Player"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.wmv\shell\MINIME\shell\v14_webm\command" "" '"$INSTDIR\MINIME.exe" --quick webm "%1"'
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.wmv\shell\MINIME\shell\v15_gif" "MUIVerb" "GIF animado"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.wmv\shell\MINIME\shell\v15_gif" "MultiSelectModel" "Player"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.wmv\shell\MINIME\shell\v15_gif\command" "" '"$INSTDIR\MINIME.exe" --quick gif "%1"'
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.wmv\shell\MINIME\shell\v16_mp3" "MUIVerb" "MP3 (só o áudio)"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.wmv\shell\MINIME\shell\v16_mp3" "MultiSelectModel" "Player"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.wmv\shell\MINIME\shell\v16_mp3\command" "" '"$INSTDIR\MINIME.exe" --quick mp3 "%1"'
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.wmv\shell\MINIME\shell\z99_open" "MUIVerb" "Abrir no MINIME…"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.wmv\shell\MINIME\shell\z99_open" "MultiSelectModel" "Player"
  WriteRegDWORD HKCU "Software\Classes\SystemFileAssociations\.wmv\shell\MINIME\shell\z99_open" "CommandFlags" 32
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.wmv\shell\MINIME\shell\z99_open\command" "" '"$INSTDIR\MINIME.exe" --open "%1"'
  ; .flv
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.flv\shell\MINIME" "MUIVerb" "Converter com MINIME"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.flv\shell\MINIME" "Icon" "$INSTDIR\MINIME.exe,0"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.flv\shell\MINIME" "SubCommands" ""
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.flv\shell\MINIME" "MultiSelectModel" "Player"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.flv\shell\MINIME\shell\v10_mp4" "MUIVerb" "MP4"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.flv\shell\MINIME\shell\v10_mp4" "MultiSelectModel" "Player"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.flv\shell\MINIME\shell\v10_mp4\command" "" '"$INSTDIR\MINIME.exe" --quick mp4 "%1"'
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.flv\shell\MINIME\shell\v11_mov" "MUIVerb" "MOV"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.flv\shell\MINIME\shell\v11_mov" "MultiSelectModel" "Player"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.flv\shell\MINIME\shell\v11_mov\command" "" '"$INSTDIR\MINIME.exe" --quick mov "%1"'
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.flv\shell\MINIME\shell\v12_mkv" "MUIVerb" "MKV"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.flv\shell\MINIME\shell\v12_mkv" "MultiSelectModel" "Player"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.flv\shell\MINIME\shell\v12_mkv\command" "" '"$INSTDIR\MINIME.exe" --quick mkv "%1"'
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.flv\shell\MINIME\shell\v13_avi" "MUIVerb" "AVI"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.flv\shell\MINIME\shell\v13_avi" "MultiSelectModel" "Player"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.flv\shell\MINIME\shell\v13_avi\command" "" '"$INSTDIR\MINIME.exe" --quick avi "%1"'
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.flv\shell\MINIME\shell\v14_webm" "MUIVerb" "WebM"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.flv\shell\MINIME\shell\v14_webm" "MultiSelectModel" "Player"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.flv\shell\MINIME\shell\v14_webm\command" "" '"$INSTDIR\MINIME.exe" --quick webm "%1"'
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.flv\shell\MINIME\shell\v15_gif" "MUIVerb" "GIF animado"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.flv\shell\MINIME\shell\v15_gif" "MultiSelectModel" "Player"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.flv\shell\MINIME\shell\v15_gif\command" "" '"$INSTDIR\MINIME.exe" --quick gif "%1"'
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.flv\shell\MINIME\shell\v16_mp3" "MUIVerb" "MP3 (só o áudio)"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.flv\shell\MINIME\shell\v16_mp3" "MultiSelectModel" "Player"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.flv\shell\MINIME\shell\v16_mp3\command" "" '"$INSTDIR\MINIME.exe" --quick mp3 "%1"'
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.flv\shell\MINIME\shell\z99_open" "MUIVerb" "Abrir no MINIME…"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.flv\shell\MINIME\shell\z99_open" "MultiSelectModel" "Player"
  WriteRegDWORD HKCU "Software\Classes\SystemFileAssociations\.flv\shell\MINIME\shell\z99_open" "CommandFlags" 32
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.flv\shell\MINIME\shell\z99_open\command" "" '"$INSTDIR\MINIME.exe" --open "%1"'
  ; .mpg
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.mpg\shell\MINIME" "MUIVerb" "Converter com MINIME"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.mpg\shell\MINIME" "Icon" "$INSTDIR\MINIME.exe,0"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.mpg\shell\MINIME" "SubCommands" ""
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.mpg\shell\MINIME" "MultiSelectModel" "Player"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.mpg\shell\MINIME\shell\v10_mp4" "MUIVerb" "MP4"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.mpg\shell\MINIME\shell\v10_mp4" "MultiSelectModel" "Player"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.mpg\shell\MINIME\shell\v10_mp4\command" "" '"$INSTDIR\MINIME.exe" --quick mp4 "%1"'
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.mpg\shell\MINIME\shell\v11_mov" "MUIVerb" "MOV"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.mpg\shell\MINIME\shell\v11_mov" "MultiSelectModel" "Player"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.mpg\shell\MINIME\shell\v11_mov\command" "" '"$INSTDIR\MINIME.exe" --quick mov "%1"'
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.mpg\shell\MINIME\shell\v12_mkv" "MUIVerb" "MKV"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.mpg\shell\MINIME\shell\v12_mkv" "MultiSelectModel" "Player"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.mpg\shell\MINIME\shell\v12_mkv\command" "" '"$INSTDIR\MINIME.exe" --quick mkv "%1"'
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.mpg\shell\MINIME\shell\v13_avi" "MUIVerb" "AVI"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.mpg\shell\MINIME\shell\v13_avi" "MultiSelectModel" "Player"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.mpg\shell\MINIME\shell\v13_avi\command" "" '"$INSTDIR\MINIME.exe" --quick avi "%1"'
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.mpg\shell\MINIME\shell\v14_webm" "MUIVerb" "WebM"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.mpg\shell\MINIME\shell\v14_webm" "MultiSelectModel" "Player"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.mpg\shell\MINIME\shell\v14_webm\command" "" '"$INSTDIR\MINIME.exe" --quick webm "%1"'
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.mpg\shell\MINIME\shell\v15_gif" "MUIVerb" "GIF animado"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.mpg\shell\MINIME\shell\v15_gif" "MultiSelectModel" "Player"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.mpg\shell\MINIME\shell\v15_gif\command" "" '"$INSTDIR\MINIME.exe" --quick gif "%1"'
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.mpg\shell\MINIME\shell\v16_mp3" "MUIVerb" "MP3 (só o áudio)"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.mpg\shell\MINIME\shell\v16_mp3" "MultiSelectModel" "Player"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.mpg\shell\MINIME\shell\v16_mp3\command" "" '"$INSTDIR\MINIME.exe" --quick mp3 "%1"'
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.mpg\shell\MINIME\shell\z99_open" "MUIVerb" "Abrir no MINIME…"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.mpg\shell\MINIME\shell\z99_open" "MultiSelectModel" "Player"
  WriteRegDWORD HKCU "Software\Classes\SystemFileAssociations\.mpg\shell\MINIME\shell\z99_open" "CommandFlags" 32
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.mpg\shell\MINIME\shell\z99_open\command" "" '"$INSTDIR\MINIME.exe" --open "%1"'
  ; .mpeg
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.mpeg\shell\MINIME" "MUIVerb" "Converter com MINIME"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.mpeg\shell\MINIME" "Icon" "$INSTDIR\MINIME.exe,0"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.mpeg\shell\MINIME" "SubCommands" ""
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.mpeg\shell\MINIME" "MultiSelectModel" "Player"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.mpeg\shell\MINIME\shell\v10_mp4" "MUIVerb" "MP4"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.mpeg\shell\MINIME\shell\v10_mp4" "MultiSelectModel" "Player"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.mpeg\shell\MINIME\shell\v10_mp4\command" "" '"$INSTDIR\MINIME.exe" --quick mp4 "%1"'
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.mpeg\shell\MINIME\shell\v11_mov" "MUIVerb" "MOV"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.mpeg\shell\MINIME\shell\v11_mov" "MultiSelectModel" "Player"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.mpeg\shell\MINIME\shell\v11_mov\command" "" '"$INSTDIR\MINIME.exe" --quick mov "%1"'
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.mpeg\shell\MINIME\shell\v12_mkv" "MUIVerb" "MKV"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.mpeg\shell\MINIME\shell\v12_mkv" "MultiSelectModel" "Player"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.mpeg\shell\MINIME\shell\v12_mkv\command" "" '"$INSTDIR\MINIME.exe" --quick mkv "%1"'
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.mpeg\shell\MINIME\shell\v13_avi" "MUIVerb" "AVI"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.mpeg\shell\MINIME\shell\v13_avi" "MultiSelectModel" "Player"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.mpeg\shell\MINIME\shell\v13_avi\command" "" '"$INSTDIR\MINIME.exe" --quick avi "%1"'
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.mpeg\shell\MINIME\shell\v14_webm" "MUIVerb" "WebM"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.mpeg\shell\MINIME\shell\v14_webm" "MultiSelectModel" "Player"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.mpeg\shell\MINIME\shell\v14_webm\command" "" '"$INSTDIR\MINIME.exe" --quick webm "%1"'
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.mpeg\shell\MINIME\shell\v15_gif" "MUIVerb" "GIF animado"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.mpeg\shell\MINIME\shell\v15_gif" "MultiSelectModel" "Player"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.mpeg\shell\MINIME\shell\v15_gif\command" "" '"$INSTDIR\MINIME.exe" --quick gif "%1"'
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.mpeg\shell\MINIME\shell\v16_mp3" "MUIVerb" "MP3 (só o áudio)"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.mpeg\shell\MINIME\shell\v16_mp3" "MultiSelectModel" "Player"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.mpeg\shell\MINIME\shell\v16_mp3\command" "" '"$INSTDIR\MINIME.exe" --quick mp3 "%1"'
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.mpeg\shell\MINIME\shell\z99_open" "MUIVerb" "Abrir no MINIME…"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.mpeg\shell\MINIME\shell\z99_open" "MultiSelectModel" "Player"
  WriteRegDWORD HKCU "Software\Classes\SystemFileAssociations\.mpeg\shell\MINIME\shell\z99_open" "CommandFlags" 32
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.mpeg\shell\MINIME\shell\z99_open\command" "" '"$INSTDIR\MINIME.exe" --open "%1"'
  ; .mts
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.mts\shell\MINIME" "MUIVerb" "Converter com MINIME"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.mts\shell\MINIME" "Icon" "$INSTDIR\MINIME.exe,0"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.mts\shell\MINIME" "SubCommands" ""
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.mts\shell\MINIME" "MultiSelectModel" "Player"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.mts\shell\MINIME\shell\v10_mp4" "MUIVerb" "MP4"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.mts\shell\MINIME\shell\v10_mp4" "MultiSelectModel" "Player"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.mts\shell\MINIME\shell\v10_mp4\command" "" '"$INSTDIR\MINIME.exe" --quick mp4 "%1"'
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.mts\shell\MINIME\shell\v11_mov" "MUIVerb" "MOV"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.mts\shell\MINIME\shell\v11_mov" "MultiSelectModel" "Player"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.mts\shell\MINIME\shell\v11_mov\command" "" '"$INSTDIR\MINIME.exe" --quick mov "%1"'
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.mts\shell\MINIME\shell\v12_mkv" "MUIVerb" "MKV"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.mts\shell\MINIME\shell\v12_mkv" "MultiSelectModel" "Player"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.mts\shell\MINIME\shell\v12_mkv\command" "" '"$INSTDIR\MINIME.exe" --quick mkv "%1"'
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.mts\shell\MINIME\shell\v13_avi" "MUIVerb" "AVI"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.mts\shell\MINIME\shell\v13_avi" "MultiSelectModel" "Player"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.mts\shell\MINIME\shell\v13_avi\command" "" '"$INSTDIR\MINIME.exe" --quick avi "%1"'
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.mts\shell\MINIME\shell\v14_webm" "MUIVerb" "WebM"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.mts\shell\MINIME\shell\v14_webm" "MultiSelectModel" "Player"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.mts\shell\MINIME\shell\v14_webm\command" "" '"$INSTDIR\MINIME.exe" --quick webm "%1"'
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.mts\shell\MINIME\shell\v15_gif" "MUIVerb" "GIF animado"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.mts\shell\MINIME\shell\v15_gif" "MultiSelectModel" "Player"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.mts\shell\MINIME\shell\v15_gif\command" "" '"$INSTDIR\MINIME.exe" --quick gif "%1"'
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.mts\shell\MINIME\shell\v16_mp3" "MUIVerb" "MP3 (só o áudio)"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.mts\shell\MINIME\shell\v16_mp3" "MultiSelectModel" "Player"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.mts\shell\MINIME\shell\v16_mp3\command" "" '"$INSTDIR\MINIME.exe" --quick mp3 "%1"'
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.mts\shell\MINIME\shell\z99_open" "MUIVerb" "Abrir no MINIME…"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.mts\shell\MINIME\shell\z99_open" "MultiSelectModel" "Player"
  WriteRegDWORD HKCU "Software\Classes\SystemFileAssociations\.mts\shell\MINIME\shell\z99_open" "CommandFlags" 32
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.mts\shell\MINIME\shell\z99_open\command" "" '"$INSTDIR\MINIME.exe" --open "%1"'
  ; .m2ts
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.m2ts\shell\MINIME" "MUIVerb" "Converter com MINIME"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.m2ts\shell\MINIME" "Icon" "$INSTDIR\MINIME.exe,0"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.m2ts\shell\MINIME" "SubCommands" ""
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.m2ts\shell\MINIME" "MultiSelectModel" "Player"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.m2ts\shell\MINIME\shell\v10_mp4" "MUIVerb" "MP4"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.m2ts\shell\MINIME\shell\v10_mp4" "MultiSelectModel" "Player"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.m2ts\shell\MINIME\shell\v10_mp4\command" "" '"$INSTDIR\MINIME.exe" --quick mp4 "%1"'
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.m2ts\shell\MINIME\shell\v11_mov" "MUIVerb" "MOV"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.m2ts\shell\MINIME\shell\v11_mov" "MultiSelectModel" "Player"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.m2ts\shell\MINIME\shell\v11_mov\command" "" '"$INSTDIR\MINIME.exe" --quick mov "%1"'
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.m2ts\shell\MINIME\shell\v12_mkv" "MUIVerb" "MKV"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.m2ts\shell\MINIME\shell\v12_mkv" "MultiSelectModel" "Player"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.m2ts\shell\MINIME\shell\v12_mkv\command" "" '"$INSTDIR\MINIME.exe" --quick mkv "%1"'
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.m2ts\shell\MINIME\shell\v13_avi" "MUIVerb" "AVI"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.m2ts\shell\MINIME\shell\v13_avi" "MultiSelectModel" "Player"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.m2ts\shell\MINIME\shell\v13_avi\command" "" '"$INSTDIR\MINIME.exe" --quick avi "%1"'
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.m2ts\shell\MINIME\shell\v14_webm" "MUIVerb" "WebM"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.m2ts\shell\MINIME\shell\v14_webm" "MultiSelectModel" "Player"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.m2ts\shell\MINIME\shell\v14_webm\command" "" '"$INSTDIR\MINIME.exe" --quick webm "%1"'
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.m2ts\shell\MINIME\shell\v15_gif" "MUIVerb" "GIF animado"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.m2ts\shell\MINIME\shell\v15_gif" "MultiSelectModel" "Player"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.m2ts\shell\MINIME\shell\v15_gif\command" "" '"$INSTDIR\MINIME.exe" --quick gif "%1"'
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.m2ts\shell\MINIME\shell\v16_mp3" "MUIVerb" "MP3 (só o áudio)"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.m2ts\shell\MINIME\shell\v16_mp3" "MultiSelectModel" "Player"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.m2ts\shell\MINIME\shell\v16_mp3\command" "" '"$INSTDIR\MINIME.exe" --quick mp3 "%1"'
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.m2ts\shell\MINIME\shell\z99_open" "MUIVerb" "Abrir no MINIME…"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.m2ts\shell\MINIME\shell\z99_open" "MultiSelectModel" "Player"
  WriteRegDWORD HKCU "Software\Classes\SystemFileAssociations\.m2ts\shell\MINIME\shell\z99_open" "CommandFlags" 32
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.m2ts\shell\MINIME\shell\z99_open\command" "" '"$INSTDIR\MINIME.exe" --open "%1"'
  ; .3gp
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.3gp\shell\MINIME" "MUIVerb" "Converter com MINIME"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.3gp\shell\MINIME" "Icon" "$INSTDIR\MINIME.exe,0"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.3gp\shell\MINIME" "SubCommands" ""
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.3gp\shell\MINIME" "MultiSelectModel" "Player"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.3gp\shell\MINIME\shell\v10_mp4" "MUIVerb" "MP4"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.3gp\shell\MINIME\shell\v10_mp4" "MultiSelectModel" "Player"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.3gp\shell\MINIME\shell\v10_mp4\command" "" '"$INSTDIR\MINIME.exe" --quick mp4 "%1"'
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.3gp\shell\MINIME\shell\v11_mov" "MUIVerb" "MOV"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.3gp\shell\MINIME\shell\v11_mov" "MultiSelectModel" "Player"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.3gp\shell\MINIME\shell\v11_mov\command" "" '"$INSTDIR\MINIME.exe" --quick mov "%1"'
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.3gp\shell\MINIME\shell\v12_mkv" "MUIVerb" "MKV"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.3gp\shell\MINIME\shell\v12_mkv" "MultiSelectModel" "Player"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.3gp\shell\MINIME\shell\v12_mkv\command" "" '"$INSTDIR\MINIME.exe" --quick mkv "%1"'
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.3gp\shell\MINIME\shell\v13_avi" "MUIVerb" "AVI"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.3gp\shell\MINIME\shell\v13_avi" "MultiSelectModel" "Player"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.3gp\shell\MINIME\shell\v13_avi\command" "" '"$INSTDIR\MINIME.exe" --quick avi "%1"'
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.3gp\shell\MINIME\shell\v14_webm" "MUIVerb" "WebM"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.3gp\shell\MINIME\shell\v14_webm" "MultiSelectModel" "Player"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.3gp\shell\MINIME\shell\v14_webm\command" "" '"$INSTDIR\MINIME.exe" --quick webm "%1"'
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.3gp\shell\MINIME\shell\v15_gif" "MUIVerb" "GIF animado"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.3gp\shell\MINIME\shell\v15_gif" "MultiSelectModel" "Player"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.3gp\shell\MINIME\shell\v15_gif\command" "" '"$INSTDIR\MINIME.exe" --quick gif "%1"'
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.3gp\shell\MINIME\shell\v16_mp3" "MUIVerb" "MP3 (só o áudio)"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.3gp\shell\MINIME\shell\v16_mp3" "MultiSelectModel" "Player"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.3gp\shell\MINIME\shell\v16_mp3\command" "" '"$INSTDIR\MINIME.exe" --quick mp3 "%1"'
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.3gp\shell\MINIME\shell\z99_open" "MUIVerb" "Abrir no MINIME…"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.3gp\shell\MINIME\shell\z99_open" "MultiSelectModel" "Player"
  WriteRegDWORD HKCU "Software\Classes\SystemFileAssociations\.3gp\shell\MINIME\shell\z99_open" "CommandFlags" 32
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.3gp\shell\MINIME\shell\z99_open\command" "" '"$INSTDIR\MINIME.exe" --open "%1"'
  ; .ogv
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.ogv\shell\MINIME" "MUIVerb" "Converter com MINIME"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.ogv\shell\MINIME" "Icon" "$INSTDIR\MINIME.exe,0"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.ogv\shell\MINIME" "SubCommands" ""
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.ogv\shell\MINIME" "MultiSelectModel" "Player"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.ogv\shell\MINIME\shell\v10_mp4" "MUIVerb" "MP4"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.ogv\shell\MINIME\shell\v10_mp4" "MultiSelectModel" "Player"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.ogv\shell\MINIME\shell\v10_mp4\command" "" '"$INSTDIR\MINIME.exe" --quick mp4 "%1"'
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.ogv\shell\MINIME\shell\v11_mov" "MUIVerb" "MOV"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.ogv\shell\MINIME\shell\v11_mov" "MultiSelectModel" "Player"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.ogv\shell\MINIME\shell\v11_mov\command" "" '"$INSTDIR\MINIME.exe" --quick mov "%1"'
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.ogv\shell\MINIME\shell\v12_mkv" "MUIVerb" "MKV"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.ogv\shell\MINIME\shell\v12_mkv" "MultiSelectModel" "Player"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.ogv\shell\MINIME\shell\v12_mkv\command" "" '"$INSTDIR\MINIME.exe" --quick mkv "%1"'
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.ogv\shell\MINIME\shell\v13_avi" "MUIVerb" "AVI"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.ogv\shell\MINIME\shell\v13_avi" "MultiSelectModel" "Player"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.ogv\shell\MINIME\shell\v13_avi\command" "" '"$INSTDIR\MINIME.exe" --quick avi "%1"'
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.ogv\shell\MINIME\shell\v14_webm" "MUIVerb" "WebM"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.ogv\shell\MINIME\shell\v14_webm" "MultiSelectModel" "Player"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.ogv\shell\MINIME\shell\v14_webm\command" "" '"$INSTDIR\MINIME.exe" --quick webm "%1"'
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.ogv\shell\MINIME\shell\v15_gif" "MUIVerb" "GIF animado"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.ogv\shell\MINIME\shell\v15_gif" "MultiSelectModel" "Player"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.ogv\shell\MINIME\shell\v15_gif\command" "" '"$INSTDIR\MINIME.exe" --quick gif "%1"'
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.ogv\shell\MINIME\shell\v16_mp3" "MUIVerb" "MP3 (só o áudio)"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.ogv\shell\MINIME\shell\v16_mp3" "MultiSelectModel" "Player"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.ogv\shell\MINIME\shell\v16_mp3\command" "" '"$INSTDIR\MINIME.exe" --quick mp3 "%1"'
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.ogv\shell\MINIME\shell\z99_open" "MUIVerb" "Abrir no MINIME…"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.ogv\shell\MINIME\shell\z99_open" "MultiSelectModel" "Player"
  WriteRegDWORD HKCU "Software\Classes\SystemFileAssociations\.ogv\shell\MINIME\shell\z99_open" "CommandFlags" 32
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.ogv\shell\MINIME\shell\z99_open\command" "" '"$INSTDIR\MINIME.exe" --open "%1"'
  ; .mp3
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.mp3\shell\MINIME" "MUIVerb" "Converter com MINIME"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.mp3\shell\MINIME" "Icon" "$INSTDIR\MINIME.exe,0"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.mp3\shell\MINIME" "SubCommands" ""
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.mp3\shell\MINIME" "MultiSelectModel" "Player"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.mp3\shell\MINIME\shell\00_same" "MUIVerb" "Comprimir (mesmo formato)"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.mp3\shell\MINIME\shell\00_same" "MultiSelectModel" "Player"
  WriteRegDWORD HKCU "Software\Classes\SystemFileAssociations\.mp3\shell\MINIME\shell\00_same" "CommandFlags" 64
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.mp3\shell\MINIME\shell\00_same\command" "" '"$INSTDIR\MINIME.exe" --quick same "%1"'
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.mp3\shell\MINIME\shell\a11_m4a" "MUIVerb" "M4A"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.mp3\shell\MINIME\shell\a11_m4a" "MultiSelectModel" "Player"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.mp3\shell\MINIME\shell\a11_m4a\command" "" '"$INSTDIR\MINIME.exe" --quick m4a "%1"'
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.mp3\shell\MINIME\shell\a12_wav" "MUIVerb" "WAV"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.mp3\shell\MINIME\shell\a12_wav" "MultiSelectModel" "Player"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.mp3\shell\MINIME\shell\a12_wav\command" "" '"$INSTDIR\MINIME.exe" --quick wav "%1"'
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.mp3\shell\MINIME\shell\a13_flac" "MUIVerb" "FLAC"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.mp3\shell\MINIME\shell\a13_flac" "MultiSelectModel" "Player"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.mp3\shell\MINIME\shell\a13_flac\command" "" '"$INSTDIR\MINIME.exe" --quick flac "%1"'
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.mp3\shell\MINIME\shell\a14_opus" "MUIVerb" "Opus"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.mp3\shell\MINIME\shell\a14_opus" "MultiSelectModel" "Player"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.mp3\shell\MINIME\shell\a14_opus\command" "" '"$INSTDIR\MINIME.exe" --quick opus "%1"'
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.mp3\shell\MINIME\shell\a15_mp4" "MUIVerb" "MP4 (vídeo com onda sonora)"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.mp3\shell\MINIME\shell\a15_mp4" "MultiSelectModel" "Player"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.mp3\shell\MINIME\shell\a15_mp4\command" "" '"$INSTDIR\MINIME.exe" --quick mp4 "%1"'
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.mp3\shell\MINIME\shell\z99_open" "MUIVerb" "Abrir no MINIME…"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.mp3\shell\MINIME\shell\z99_open" "MultiSelectModel" "Player"
  WriteRegDWORD HKCU "Software\Classes\SystemFileAssociations\.mp3\shell\MINIME\shell\z99_open" "CommandFlags" 32
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.mp3\shell\MINIME\shell\z99_open\command" "" '"$INSTDIR\MINIME.exe" --open "%1"'
  ; .wav
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.wav\shell\MINIME" "MUIVerb" "Converter com MINIME"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.wav\shell\MINIME" "Icon" "$INSTDIR\MINIME.exe,0"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.wav\shell\MINIME" "SubCommands" ""
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.wav\shell\MINIME" "MultiSelectModel" "Player"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.wav\shell\MINIME\shell\a10_mp3" "MUIVerb" "MP3"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.wav\shell\MINIME\shell\a10_mp3" "MultiSelectModel" "Player"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.wav\shell\MINIME\shell\a10_mp3\command" "" '"$INSTDIR\MINIME.exe" --quick mp3 "%1"'
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.wav\shell\MINIME\shell\a11_m4a" "MUIVerb" "M4A"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.wav\shell\MINIME\shell\a11_m4a" "MultiSelectModel" "Player"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.wav\shell\MINIME\shell\a11_m4a\command" "" '"$INSTDIR\MINIME.exe" --quick m4a "%1"'
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.wav\shell\MINIME\shell\a13_flac" "MUIVerb" "FLAC"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.wav\shell\MINIME\shell\a13_flac" "MultiSelectModel" "Player"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.wav\shell\MINIME\shell\a13_flac\command" "" '"$INSTDIR\MINIME.exe" --quick flac "%1"'
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.wav\shell\MINIME\shell\a14_opus" "MUIVerb" "Opus"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.wav\shell\MINIME\shell\a14_opus" "MultiSelectModel" "Player"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.wav\shell\MINIME\shell\a14_opus\command" "" '"$INSTDIR\MINIME.exe" --quick opus "%1"'
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.wav\shell\MINIME\shell\a15_mp4" "MUIVerb" "MP4 (vídeo com onda sonora)"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.wav\shell\MINIME\shell\a15_mp4" "MultiSelectModel" "Player"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.wav\shell\MINIME\shell\a15_mp4\command" "" '"$INSTDIR\MINIME.exe" --quick mp4 "%1"'
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.wav\shell\MINIME\shell\z99_open" "MUIVerb" "Abrir no MINIME…"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.wav\shell\MINIME\shell\z99_open" "MultiSelectModel" "Player"
  WriteRegDWORD HKCU "Software\Classes\SystemFileAssociations\.wav\shell\MINIME\shell\z99_open" "CommandFlags" 32
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.wav\shell\MINIME\shell\z99_open\command" "" '"$INSTDIR\MINIME.exe" --open "%1"'
  ; .m4a
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.m4a\shell\MINIME" "MUIVerb" "Converter com MINIME"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.m4a\shell\MINIME" "Icon" "$INSTDIR\MINIME.exe,0"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.m4a\shell\MINIME" "SubCommands" ""
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.m4a\shell\MINIME" "MultiSelectModel" "Player"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.m4a\shell\MINIME\shell\00_same" "MUIVerb" "Comprimir (mesmo formato)"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.m4a\shell\MINIME\shell\00_same" "MultiSelectModel" "Player"
  WriteRegDWORD HKCU "Software\Classes\SystemFileAssociations\.m4a\shell\MINIME\shell\00_same" "CommandFlags" 64
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.m4a\shell\MINIME\shell\00_same\command" "" '"$INSTDIR\MINIME.exe" --quick same "%1"'
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.m4a\shell\MINIME\shell\a10_mp3" "MUIVerb" "MP3"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.m4a\shell\MINIME\shell\a10_mp3" "MultiSelectModel" "Player"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.m4a\shell\MINIME\shell\a10_mp3\command" "" '"$INSTDIR\MINIME.exe" --quick mp3 "%1"'
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.m4a\shell\MINIME\shell\a12_wav" "MUIVerb" "WAV"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.m4a\shell\MINIME\shell\a12_wav" "MultiSelectModel" "Player"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.m4a\shell\MINIME\shell\a12_wav\command" "" '"$INSTDIR\MINIME.exe" --quick wav "%1"'
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.m4a\shell\MINIME\shell\a13_flac" "MUIVerb" "FLAC"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.m4a\shell\MINIME\shell\a13_flac" "MultiSelectModel" "Player"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.m4a\shell\MINIME\shell\a13_flac\command" "" '"$INSTDIR\MINIME.exe" --quick flac "%1"'
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.m4a\shell\MINIME\shell\a14_opus" "MUIVerb" "Opus"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.m4a\shell\MINIME\shell\a14_opus" "MultiSelectModel" "Player"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.m4a\shell\MINIME\shell\a14_opus\command" "" '"$INSTDIR\MINIME.exe" --quick opus "%1"'
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.m4a\shell\MINIME\shell\a15_mp4" "MUIVerb" "MP4 (vídeo com onda sonora)"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.m4a\shell\MINIME\shell\a15_mp4" "MultiSelectModel" "Player"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.m4a\shell\MINIME\shell\a15_mp4\command" "" '"$INSTDIR\MINIME.exe" --quick mp4 "%1"'
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.m4a\shell\MINIME\shell\z99_open" "MUIVerb" "Abrir no MINIME…"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.m4a\shell\MINIME\shell\z99_open" "MultiSelectModel" "Player"
  WriteRegDWORD HKCU "Software\Classes\SystemFileAssociations\.m4a\shell\MINIME\shell\z99_open" "CommandFlags" 32
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.m4a\shell\MINIME\shell\z99_open\command" "" '"$INSTDIR\MINIME.exe" --open "%1"'
  ; .aac
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.aac\shell\MINIME" "MUIVerb" "Converter com MINIME"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.aac\shell\MINIME" "Icon" "$INSTDIR\MINIME.exe,0"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.aac\shell\MINIME" "SubCommands" ""
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.aac\shell\MINIME" "MultiSelectModel" "Player"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.aac\shell\MINIME\shell\a10_mp3" "MUIVerb" "MP3"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.aac\shell\MINIME\shell\a10_mp3" "MultiSelectModel" "Player"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.aac\shell\MINIME\shell\a10_mp3\command" "" '"$INSTDIR\MINIME.exe" --quick mp3 "%1"'
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.aac\shell\MINIME\shell\a11_m4a" "MUIVerb" "M4A"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.aac\shell\MINIME\shell\a11_m4a" "MultiSelectModel" "Player"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.aac\shell\MINIME\shell\a11_m4a\command" "" '"$INSTDIR\MINIME.exe" --quick m4a "%1"'
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.aac\shell\MINIME\shell\a12_wav" "MUIVerb" "WAV"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.aac\shell\MINIME\shell\a12_wav" "MultiSelectModel" "Player"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.aac\shell\MINIME\shell\a12_wav\command" "" '"$INSTDIR\MINIME.exe" --quick wav "%1"'
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.aac\shell\MINIME\shell\a13_flac" "MUIVerb" "FLAC"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.aac\shell\MINIME\shell\a13_flac" "MultiSelectModel" "Player"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.aac\shell\MINIME\shell\a13_flac\command" "" '"$INSTDIR\MINIME.exe" --quick flac "%1"'
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.aac\shell\MINIME\shell\a14_opus" "MUIVerb" "Opus"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.aac\shell\MINIME\shell\a14_opus" "MultiSelectModel" "Player"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.aac\shell\MINIME\shell\a14_opus\command" "" '"$INSTDIR\MINIME.exe" --quick opus "%1"'
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.aac\shell\MINIME\shell\a15_mp4" "MUIVerb" "MP4 (vídeo com onda sonora)"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.aac\shell\MINIME\shell\a15_mp4" "MultiSelectModel" "Player"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.aac\shell\MINIME\shell\a15_mp4\command" "" '"$INSTDIR\MINIME.exe" --quick mp4 "%1"'
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.aac\shell\MINIME\shell\z99_open" "MUIVerb" "Abrir no MINIME…"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.aac\shell\MINIME\shell\z99_open" "MultiSelectModel" "Player"
  WriteRegDWORD HKCU "Software\Classes\SystemFileAssociations\.aac\shell\MINIME\shell\z99_open" "CommandFlags" 32
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.aac\shell\MINIME\shell\z99_open\command" "" '"$INSTDIR\MINIME.exe" --open "%1"'
  ; .flac
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.flac\shell\MINIME" "MUIVerb" "Converter com MINIME"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.flac\shell\MINIME" "Icon" "$INSTDIR\MINIME.exe,0"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.flac\shell\MINIME" "SubCommands" ""
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.flac\shell\MINIME" "MultiSelectModel" "Player"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.flac\shell\MINIME\shell\a10_mp3" "MUIVerb" "MP3"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.flac\shell\MINIME\shell\a10_mp3" "MultiSelectModel" "Player"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.flac\shell\MINIME\shell\a10_mp3\command" "" '"$INSTDIR\MINIME.exe" --quick mp3 "%1"'
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.flac\shell\MINIME\shell\a11_m4a" "MUIVerb" "M4A"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.flac\shell\MINIME\shell\a11_m4a" "MultiSelectModel" "Player"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.flac\shell\MINIME\shell\a11_m4a\command" "" '"$INSTDIR\MINIME.exe" --quick m4a "%1"'
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.flac\shell\MINIME\shell\a12_wav" "MUIVerb" "WAV"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.flac\shell\MINIME\shell\a12_wav" "MultiSelectModel" "Player"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.flac\shell\MINIME\shell\a12_wav\command" "" '"$INSTDIR\MINIME.exe" --quick wav "%1"'
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.flac\shell\MINIME\shell\a14_opus" "MUIVerb" "Opus"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.flac\shell\MINIME\shell\a14_opus" "MultiSelectModel" "Player"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.flac\shell\MINIME\shell\a14_opus\command" "" '"$INSTDIR\MINIME.exe" --quick opus "%1"'
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.flac\shell\MINIME\shell\a15_mp4" "MUIVerb" "MP4 (vídeo com onda sonora)"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.flac\shell\MINIME\shell\a15_mp4" "MultiSelectModel" "Player"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.flac\shell\MINIME\shell\a15_mp4\command" "" '"$INSTDIR\MINIME.exe" --quick mp4 "%1"'
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.flac\shell\MINIME\shell\z99_open" "MUIVerb" "Abrir no MINIME…"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.flac\shell\MINIME\shell\z99_open" "MultiSelectModel" "Player"
  WriteRegDWORD HKCU "Software\Classes\SystemFileAssociations\.flac\shell\MINIME\shell\z99_open" "CommandFlags" 32
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.flac\shell\MINIME\shell\z99_open\command" "" '"$INSTDIR\MINIME.exe" --open "%1"'
  ; .ogg
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.ogg\shell\MINIME" "MUIVerb" "Converter com MINIME"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.ogg\shell\MINIME" "Icon" "$INSTDIR\MINIME.exe,0"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.ogg\shell\MINIME" "SubCommands" ""
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.ogg\shell\MINIME" "MultiSelectModel" "Player"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.ogg\shell\MINIME\shell\00_same" "MUIVerb" "Comprimir (mesmo formato)"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.ogg\shell\MINIME\shell\00_same" "MultiSelectModel" "Player"
  WriteRegDWORD HKCU "Software\Classes\SystemFileAssociations\.ogg\shell\MINIME\shell\00_same" "CommandFlags" 64
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.ogg\shell\MINIME\shell\00_same\command" "" '"$INSTDIR\MINIME.exe" --quick same "%1"'
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.ogg\shell\MINIME\shell\a10_mp3" "MUIVerb" "MP3"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.ogg\shell\MINIME\shell\a10_mp3" "MultiSelectModel" "Player"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.ogg\shell\MINIME\shell\a10_mp3\command" "" '"$INSTDIR\MINIME.exe" --quick mp3 "%1"'
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.ogg\shell\MINIME\shell\a11_m4a" "MUIVerb" "M4A"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.ogg\shell\MINIME\shell\a11_m4a" "MultiSelectModel" "Player"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.ogg\shell\MINIME\shell\a11_m4a\command" "" '"$INSTDIR\MINIME.exe" --quick m4a "%1"'
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.ogg\shell\MINIME\shell\a12_wav" "MUIVerb" "WAV"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.ogg\shell\MINIME\shell\a12_wav" "MultiSelectModel" "Player"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.ogg\shell\MINIME\shell\a12_wav\command" "" '"$INSTDIR\MINIME.exe" --quick wav "%1"'
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.ogg\shell\MINIME\shell\a13_flac" "MUIVerb" "FLAC"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.ogg\shell\MINIME\shell\a13_flac" "MultiSelectModel" "Player"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.ogg\shell\MINIME\shell\a13_flac\command" "" '"$INSTDIR\MINIME.exe" --quick flac "%1"'
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.ogg\shell\MINIME\shell\a14_opus" "MUIVerb" "Opus"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.ogg\shell\MINIME\shell\a14_opus" "MultiSelectModel" "Player"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.ogg\shell\MINIME\shell\a14_opus\command" "" '"$INSTDIR\MINIME.exe" --quick opus "%1"'
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.ogg\shell\MINIME\shell\a15_mp4" "MUIVerb" "MP4 (vídeo com onda sonora)"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.ogg\shell\MINIME\shell\a15_mp4" "MultiSelectModel" "Player"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.ogg\shell\MINIME\shell\a15_mp4\command" "" '"$INSTDIR\MINIME.exe" --quick mp4 "%1"'
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.ogg\shell\MINIME\shell\z99_open" "MUIVerb" "Abrir no MINIME…"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.ogg\shell\MINIME\shell\z99_open" "MultiSelectModel" "Player"
  WriteRegDWORD HKCU "Software\Classes\SystemFileAssociations\.ogg\shell\MINIME\shell\z99_open" "CommandFlags" 32
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.ogg\shell\MINIME\shell\z99_open\command" "" '"$INSTDIR\MINIME.exe" --open "%1"'
  ; .oga
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.oga\shell\MINIME" "MUIVerb" "Converter com MINIME"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.oga\shell\MINIME" "Icon" "$INSTDIR\MINIME.exe,0"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.oga\shell\MINIME" "SubCommands" ""
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.oga\shell\MINIME" "MultiSelectModel" "Player"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.oga\shell\MINIME\shell\00_same" "MUIVerb" "Comprimir (mesmo formato)"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.oga\shell\MINIME\shell\00_same" "MultiSelectModel" "Player"
  WriteRegDWORD HKCU "Software\Classes\SystemFileAssociations\.oga\shell\MINIME\shell\00_same" "CommandFlags" 64
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.oga\shell\MINIME\shell\00_same\command" "" '"$INSTDIR\MINIME.exe" --quick same "%1"'
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.oga\shell\MINIME\shell\a10_mp3" "MUIVerb" "MP3"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.oga\shell\MINIME\shell\a10_mp3" "MultiSelectModel" "Player"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.oga\shell\MINIME\shell\a10_mp3\command" "" '"$INSTDIR\MINIME.exe" --quick mp3 "%1"'
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.oga\shell\MINIME\shell\a11_m4a" "MUIVerb" "M4A"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.oga\shell\MINIME\shell\a11_m4a" "MultiSelectModel" "Player"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.oga\shell\MINIME\shell\a11_m4a\command" "" '"$INSTDIR\MINIME.exe" --quick m4a "%1"'
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.oga\shell\MINIME\shell\a12_wav" "MUIVerb" "WAV"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.oga\shell\MINIME\shell\a12_wav" "MultiSelectModel" "Player"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.oga\shell\MINIME\shell\a12_wav\command" "" '"$INSTDIR\MINIME.exe" --quick wav "%1"'
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.oga\shell\MINIME\shell\a13_flac" "MUIVerb" "FLAC"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.oga\shell\MINIME\shell\a13_flac" "MultiSelectModel" "Player"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.oga\shell\MINIME\shell\a13_flac\command" "" '"$INSTDIR\MINIME.exe" --quick flac "%1"'
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.oga\shell\MINIME\shell\a14_opus" "MUIVerb" "Opus"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.oga\shell\MINIME\shell\a14_opus" "MultiSelectModel" "Player"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.oga\shell\MINIME\shell\a14_opus\command" "" '"$INSTDIR\MINIME.exe" --quick opus "%1"'
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.oga\shell\MINIME\shell\a15_mp4" "MUIVerb" "MP4 (vídeo com onda sonora)"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.oga\shell\MINIME\shell\a15_mp4" "MultiSelectModel" "Player"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.oga\shell\MINIME\shell\a15_mp4\command" "" '"$INSTDIR\MINIME.exe" --quick mp4 "%1"'
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.oga\shell\MINIME\shell\z99_open" "MUIVerb" "Abrir no MINIME…"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.oga\shell\MINIME\shell\z99_open" "MultiSelectModel" "Player"
  WriteRegDWORD HKCU "Software\Classes\SystemFileAssociations\.oga\shell\MINIME\shell\z99_open" "CommandFlags" 32
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.oga\shell\MINIME\shell\z99_open\command" "" '"$INSTDIR\MINIME.exe" --open "%1"'
  ; .opus
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.opus\shell\MINIME" "MUIVerb" "Converter com MINIME"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.opus\shell\MINIME" "Icon" "$INSTDIR\MINIME.exe,0"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.opus\shell\MINIME" "SubCommands" ""
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.opus\shell\MINIME" "MultiSelectModel" "Player"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.opus\shell\MINIME\shell\00_same" "MUIVerb" "Comprimir (mesmo formato)"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.opus\shell\MINIME\shell\00_same" "MultiSelectModel" "Player"
  WriteRegDWORD HKCU "Software\Classes\SystemFileAssociations\.opus\shell\MINIME\shell\00_same" "CommandFlags" 64
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.opus\shell\MINIME\shell\00_same\command" "" '"$INSTDIR\MINIME.exe" --quick same "%1"'
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.opus\shell\MINIME\shell\a10_mp3" "MUIVerb" "MP3"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.opus\shell\MINIME\shell\a10_mp3" "MultiSelectModel" "Player"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.opus\shell\MINIME\shell\a10_mp3\command" "" '"$INSTDIR\MINIME.exe" --quick mp3 "%1"'
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.opus\shell\MINIME\shell\a11_m4a" "MUIVerb" "M4A"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.opus\shell\MINIME\shell\a11_m4a" "MultiSelectModel" "Player"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.opus\shell\MINIME\shell\a11_m4a\command" "" '"$INSTDIR\MINIME.exe" --quick m4a "%1"'
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.opus\shell\MINIME\shell\a12_wav" "MUIVerb" "WAV"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.opus\shell\MINIME\shell\a12_wav" "MultiSelectModel" "Player"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.opus\shell\MINIME\shell\a12_wav\command" "" '"$INSTDIR\MINIME.exe" --quick wav "%1"'
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.opus\shell\MINIME\shell\a13_flac" "MUIVerb" "FLAC"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.opus\shell\MINIME\shell\a13_flac" "MultiSelectModel" "Player"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.opus\shell\MINIME\shell\a13_flac\command" "" '"$INSTDIR\MINIME.exe" --quick flac "%1"'
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.opus\shell\MINIME\shell\a15_mp4" "MUIVerb" "MP4 (vídeo com onda sonora)"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.opus\shell\MINIME\shell\a15_mp4" "MultiSelectModel" "Player"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.opus\shell\MINIME\shell\a15_mp4\command" "" '"$INSTDIR\MINIME.exe" --quick mp4 "%1"'
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.opus\shell\MINIME\shell\z99_open" "MUIVerb" "Abrir no MINIME…"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.opus\shell\MINIME\shell\z99_open" "MultiSelectModel" "Player"
  WriteRegDWORD HKCU "Software\Classes\SystemFileAssociations\.opus\shell\MINIME\shell\z99_open" "CommandFlags" 32
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.opus\shell\MINIME\shell\z99_open\command" "" '"$INSTDIR\MINIME.exe" --open "%1"'
  ; .wma
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.wma\shell\MINIME" "MUIVerb" "Converter com MINIME"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.wma\shell\MINIME" "Icon" "$INSTDIR\MINIME.exe,0"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.wma\shell\MINIME" "SubCommands" ""
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.wma\shell\MINIME" "MultiSelectModel" "Player"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.wma\shell\MINIME\shell\a10_mp3" "MUIVerb" "MP3"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.wma\shell\MINIME\shell\a10_mp3" "MultiSelectModel" "Player"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.wma\shell\MINIME\shell\a10_mp3\command" "" '"$INSTDIR\MINIME.exe" --quick mp3 "%1"'
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.wma\shell\MINIME\shell\a11_m4a" "MUIVerb" "M4A"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.wma\shell\MINIME\shell\a11_m4a" "MultiSelectModel" "Player"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.wma\shell\MINIME\shell\a11_m4a\command" "" '"$INSTDIR\MINIME.exe" --quick m4a "%1"'
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.wma\shell\MINIME\shell\a12_wav" "MUIVerb" "WAV"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.wma\shell\MINIME\shell\a12_wav" "MultiSelectModel" "Player"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.wma\shell\MINIME\shell\a12_wav\command" "" '"$INSTDIR\MINIME.exe" --quick wav "%1"'
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.wma\shell\MINIME\shell\a13_flac" "MUIVerb" "FLAC"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.wma\shell\MINIME\shell\a13_flac" "MultiSelectModel" "Player"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.wma\shell\MINIME\shell\a13_flac\command" "" '"$INSTDIR\MINIME.exe" --quick flac "%1"'
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.wma\shell\MINIME\shell\a14_opus" "MUIVerb" "Opus"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.wma\shell\MINIME\shell\a14_opus" "MultiSelectModel" "Player"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.wma\shell\MINIME\shell\a14_opus\command" "" '"$INSTDIR\MINIME.exe" --quick opus "%1"'
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.wma\shell\MINIME\shell\a15_mp4" "MUIVerb" "MP4 (vídeo com onda sonora)"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.wma\shell\MINIME\shell\a15_mp4" "MultiSelectModel" "Player"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.wma\shell\MINIME\shell\a15_mp4\command" "" '"$INSTDIR\MINIME.exe" --quick mp4 "%1"'
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.wma\shell\MINIME\shell\z99_open" "MUIVerb" "Abrir no MINIME…"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.wma\shell\MINIME\shell\z99_open" "MultiSelectModel" "Player"
  WriteRegDWORD HKCU "Software\Classes\SystemFileAssociations\.wma\shell\MINIME\shell\z99_open" "CommandFlags" 32
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.wma\shell\MINIME\shell\z99_open\command" "" '"$INSTDIR\MINIME.exe" --open "%1"'
  ; .aif
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.aif\shell\MINIME" "MUIVerb" "Converter com MINIME"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.aif\shell\MINIME" "Icon" "$INSTDIR\MINIME.exe,0"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.aif\shell\MINIME" "SubCommands" ""
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.aif\shell\MINIME" "MultiSelectModel" "Player"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.aif\shell\MINIME\shell\a10_mp3" "MUIVerb" "MP3"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.aif\shell\MINIME\shell\a10_mp3" "MultiSelectModel" "Player"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.aif\shell\MINIME\shell\a10_mp3\command" "" '"$INSTDIR\MINIME.exe" --quick mp3 "%1"'
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.aif\shell\MINIME\shell\a11_m4a" "MUIVerb" "M4A"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.aif\shell\MINIME\shell\a11_m4a" "MultiSelectModel" "Player"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.aif\shell\MINIME\shell\a11_m4a\command" "" '"$INSTDIR\MINIME.exe" --quick m4a "%1"'
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.aif\shell\MINIME\shell\a12_wav" "MUIVerb" "WAV"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.aif\shell\MINIME\shell\a12_wav" "MultiSelectModel" "Player"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.aif\shell\MINIME\shell\a12_wav\command" "" '"$INSTDIR\MINIME.exe" --quick wav "%1"'
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.aif\shell\MINIME\shell\a13_flac" "MUIVerb" "FLAC"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.aif\shell\MINIME\shell\a13_flac" "MultiSelectModel" "Player"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.aif\shell\MINIME\shell\a13_flac\command" "" '"$INSTDIR\MINIME.exe" --quick flac "%1"'
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.aif\shell\MINIME\shell\a14_opus" "MUIVerb" "Opus"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.aif\shell\MINIME\shell\a14_opus" "MultiSelectModel" "Player"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.aif\shell\MINIME\shell\a14_opus\command" "" '"$INSTDIR\MINIME.exe" --quick opus "%1"'
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.aif\shell\MINIME\shell\a15_mp4" "MUIVerb" "MP4 (vídeo com onda sonora)"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.aif\shell\MINIME\shell\a15_mp4" "MultiSelectModel" "Player"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.aif\shell\MINIME\shell\a15_mp4\command" "" '"$INSTDIR\MINIME.exe" --quick mp4 "%1"'
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.aif\shell\MINIME\shell\z99_open" "MUIVerb" "Abrir no MINIME…"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.aif\shell\MINIME\shell\z99_open" "MultiSelectModel" "Player"
  WriteRegDWORD HKCU "Software\Classes\SystemFileAssociations\.aif\shell\MINIME\shell\z99_open" "CommandFlags" 32
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.aif\shell\MINIME\shell\z99_open\command" "" '"$INSTDIR\MINIME.exe" --open "%1"'
  ; .aiff
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.aiff\shell\MINIME" "MUIVerb" "Converter com MINIME"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.aiff\shell\MINIME" "Icon" "$INSTDIR\MINIME.exe,0"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.aiff\shell\MINIME" "SubCommands" ""
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.aiff\shell\MINIME" "MultiSelectModel" "Player"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.aiff\shell\MINIME\shell\a10_mp3" "MUIVerb" "MP3"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.aiff\shell\MINIME\shell\a10_mp3" "MultiSelectModel" "Player"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.aiff\shell\MINIME\shell\a10_mp3\command" "" '"$INSTDIR\MINIME.exe" --quick mp3 "%1"'
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.aiff\shell\MINIME\shell\a11_m4a" "MUIVerb" "M4A"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.aiff\shell\MINIME\shell\a11_m4a" "MultiSelectModel" "Player"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.aiff\shell\MINIME\shell\a11_m4a\command" "" '"$INSTDIR\MINIME.exe" --quick m4a "%1"'
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.aiff\shell\MINIME\shell\a12_wav" "MUIVerb" "WAV"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.aiff\shell\MINIME\shell\a12_wav" "MultiSelectModel" "Player"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.aiff\shell\MINIME\shell\a12_wav\command" "" '"$INSTDIR\MINIME.exe" --quick wav "%1"'
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.aiff\shell\MINIME\shell\a13_flac" "MUIVerb" "FLAC"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.aiff\shell\MINIME\shell\a13_flac" "MultiSelectModel" "Player"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.aiff\shell\MINIME\shell\a13_flac\command" "" '"$INSTDIR\MINIME.exe" --quick flac "%1"'
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.aiff\shell\MINIME\shell\a14_opus" "MUIVerb" "Opus"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.aiff\shell\MINIME\shell\a14_opus" "MultiSelectModel" "Player"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.aiff\shell\MINIME\shell\a14_opus\command" "" '"$INSTDIR\MINIME.exe" --quick opus "%1"'
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.aiff\shell\MINIME\shell\a15_mp4" "MUIVerb" "MP4 (vídeo com onda sonora)"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.aiff\shell\MINIME\shell\a15_mp4" "MultiSelectModel" "Player"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.aiff\shell\MINIME\shell\a15_mp4\command" "" '"$INSTDIR\MINIME.exe" --quick mp4 "%1"'
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.aiff\shell\MINIME\shell\z99_open" "MUIVerb" "Abrir no MINIME…"
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.aiff\shell\MINIME\shell\z99_open" "MultiSelectModel" "Player"
  WriteRegDWORD HKCU "Software\Classes\SystemFileAssociations\.aiff\shell\MINIME\shell\z99_open" "CommandFlags" 32
  WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.aiff\shell\MINIME\shell\z99_open\command" "" '"$INSTDIR\MINIME.exe" --open "%1"'
  ; Preferências: só grava quando a tela apareceu (atualização silenciosa mantém o que o usuário escolheu)
  ${If} $MinimePrefsShown == "1"
    WriteRegDWORD HKCU "Software\MINIME" "AutoUpdate" $MinimeAuto
    ${If} $MinimeLogin == ${BST_CHECKED}
      WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Run" "MINIME" '"$INSTDIR\MINIME.exe" --login'
    ${Else}
      DeleteRegValue HKCU "Software\Microsoft\Windows\CurrentVersion\Run" "MINIME"
    ${EndIf}
  ${EndIf}
  System::Call 'shell32::SHChangeNotify(i 0x08000000, i 0, p 0, p 0)'
!macroend

!macro customUnInstall
  DeleteRegKey HKCU "Software\Classes\SystemFileAssociations\.jpg\shell\MINIME"
  DeleteRegKey HKCU "Software\Classes\SystemFileAssociations\.jpeg\shell\MINIME"
  DeleteRegKey HKCU "Software\Classes\SystemFileAssociations\.jfif\shell\MINIME"
  DeleteRegKey HKCU "Software\Classes\SystemFileAssociations\.png\shell\MINIME"
  DeleteRegKey HKCU "Software\Classes\SystemFileAssociations\.webp\shell\MINIME"
  DeleteRegKey HKCU "Software\Classes\SystemFileAssociations\.avif\shell\MINIME"
  DeleteRegKey HKCU "Software\Classes\SystemFileAssociations\.tif\shell\MINIME"
  DeleteRegKey HKCU "Software\Classes\SystemFileAssociations\.tiff\shell\MINIME"
  DeleteRegKey HKCU "Software\Classes\SystemFileAssociations\.bmp\shell\MINIME"
  DeleteRegKey HKCU "Software\Classes\SystemFileAssociations\.gif\shell\MINIME"
  DeleteRegKey HKCU "Software\Classes\SystemFileAssociations\.ico\shell\MINIME"
  DeleteRegKey HKCU "Software\Classes\SystemFileAssociations\.svg\shell\MINIME"
  DeleteRegKey HKCU "Software\Classes\SystemFileAssociations\.mp4\shell\MINIME"
  DeleteRegKey HKCU "Software\Classes\SystemFileAssociations\.m4v\shell\MINIME"
  DeleteRegKey HKCU "Software\Classes\SystemFileAssociations\.mkv\shell\MINIME"
  DeleteRegKey HKCU "Software\Classes\SystemFileAssociations\.mov\shell\MINIME"
  DeleteRegKey HKCU "Software\Classes\SystemFileAssociations\.avi\shell\MINIME"
  DeleteRegKey HKCU "Software\Classes\SystemFileAssociations\.webm\shell\MINIME"
  DeleteRegKey HKCU "Software\Classes\SystemFileAssociations\.wmv\shell\MINIME"
  DeleteRegKey HKCU "Software\Classes\SystemFileAssociations\.flv\shell\MINIME"
  DeleteRegKey HKCU "Software\Classes\SystemFileAssociations\.mpg\shell\MINIME"
  DeleteRegKey HKCU "Software\Classes\SystemFileAssociations\.mpeg\shell\MINIME"
  DeleteRegKey HKCU "Software\Classes\SystemFileAssociations\.mts\shell\MINIME"
  DeleteRegKey HKCU "Software\Classes\SystemFileAssociations\.m2ts\shell\MINIME"
  DeleteRegKey HKCU "Software\Classes\SystemFileAssociations\.3gp\shell\MINIME"
  DeleteRegKey HKCU "Software\Classes\SystemFileAssociations\.ogv\shell\MINIME"
  DeleteRegKey HKCU "Software\Classes\SystemFileAssociations\.mp3\shell\MINIME"
  DeleteRegKey HKCU "Software\Classes\SystemFileAssociations\.wav\shell\MINIME"
  DeleteRegKey HKCU "Software\Classes\SystemFileAssociations\.m4a\shell\MINIME"
  DeleteRegKey HKCU "Software\Classes\SystemFileAssociations\.aac\shell\MINIME"
  DeleteRegKey HKCU "Software\Classes\SystemFileAssociations\.flac\shell\MINIME"
  DeleteRegKey HKCU "Software\Classes\SystemFileAssociations\.ogg\shell\MINIME"
  DeleteRegKey HKCU "Software\Classes\SystemFileAssociations\.oga\shell\MINIME"
  DeleteRegKey HKCU "Software\Classes\SystemFileAssociations\.opus\shell\MINIME"
  DeleteRegKey HKCU "Software\Classes\SystemFileAssociations\.wma\shell\MINIME"
  DeleteRegKey HKCU "Software\Classes\SystemFileAssociations\.aif\shell\MINIME"
  DeleteRegKey HKCU "Software\Classes\SystemFileAssociations\.aiff\shell\MINIME"
  ; Desinstalação de verdade (não a troca de versão): remove início automático e preferências
  ${IfNot} ${isUpdated}
    DeleteRegValue HKCU "Software\Microsoft\Windows\CurrentVersion\Run" "MINIME"
    DeleteRegKey HKCU "Software\MINIME"
  ${EndIf}
  System::Call 'shell32::SHChangeNotify(i 0x08000000, i 0, p 0, p 0)'
!macroend
