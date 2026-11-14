; Gerado por scripts/gen-nsis.mjs. Não edite à mão.
; Menu do botão direito do MINIME (por usuário, sem pedir administrador)
; e a tela "Preferências": atualizar automaticamente e abrir quando o Windows iniciar.

!include MUI2.nsh
!include nsDialogs.nsh
!include LogicLib.nsh

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
  ; Menu do botão direito: só grava se o usuário não desligou no app (o app grava Menu=0 em HKCU\Software\MINIME).
  ReadRegDWORD $MinimeMenuOff HKCU "Software\MINIME" "Menu"
  ${If} $MinimeMenuOff != "0"
    ; .jpg
    DeleteRegKey HKCU "Software\Classes\SystemFileAssociations\.jpg\shell\MINIME"
    WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.jpg\shell\MINIME" "MUIVerb" "Converter com MINIME"
    WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.jpg\shell\MINIME" "Icon" "$INSTDIR\MINIME.exe,0"
    WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.jpg\shell\MINIME" "ExtendedSubCommandsKey" "MINIME.Menu.Image"
    WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.jpg\shell\MINIME" "MultiSelectModel" "Player"
    ; .jpeg
    DeleteRegKey HKCU "Software\Classes\SystemFileAssociations\.jpeg\shell\MINIME"
    WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.jpeg\shell\MINIME" "MUIVerb" "Converter com MINIME"
    WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.jpeg\shell\MINIME" "Icon" "$INSTDIR\MINIME.exe,0"
    WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.jpeg\shell\MINIME" "ExtendedSubCommandsKey" "MINIME.Menu.Image"
    WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.jpeg\shell\MINIME" "MultiSelectModel" "Player"
    ; .jfif
    DeleteRegKey HKCU "Software\Classes\SystemFileAssociations\.jfif\shell\MINIME"
    WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.jfif\shell\MINIME" "MUIVerb" "Converter com MINIME"
    WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.jfif\shell\MINIME" "Icon" "$INSTDIR\MINIME.exe,0"
    WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.jfif\shell\MINIME" "ExtendedSubCommandsKey" "MINIME.Menu.Image"
    WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.jfif\shell\MINIME" "MultiSelectModel" "Player"
    ; .png
    DeleteRegKey HKCU "Software\Classes\SystemFileAssociations\.png\shell\MINIME"
    WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.png\shell\MINIME" "MUIVerb" "Converter com MINIME"
    WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.png\shell\MINIME" "Icon" "$INSTDIR\MINIME.exe,0"
    WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.png\shell\MINIME" "ExtendedSubCommandsKey" "MINIME.Menu.Image"
    WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.png\shell\MINIME" "MultiSelectModel" "Player"
    ; .webp
    DeleteRegKey HKCU "Software\Classes\SystemFileAssociations\.webp\shell\MINIME"
    WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.webp\shell\MINIME" "MUIVerb" "Converter com MINIME"
    WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.webp\shell\MINIME" "Icon" "$INSTDIR\MINIME.exe,0"
    WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.webp\shell\MINIME" "ExtendedSubCommandsKey" "MINIME.Menu.Image"
    WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.webp\shell\MINIME" "MultiSelectModel" "Player"
    ; .avif
    DeleteRegKey HKCU "Software\Classes\SystemFileAssociations\.avif\shell\MINIME"
    WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.avif\shell\MINIME" "MUIVerb" "Converter com MINIME"
    WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.avif\shell\MINIME" "Icon" "$INSTDIR\MINIME.exe,0"
    WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.avif\shell\MINIME" "ExtendedSubCommandsKey" "MINIME.Menu.Image"
    WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.avif\shell\MINIME" "MultiSelectModel" "Player"
    ; .tif
    DeleteRegKey HKCU "Software\Classes\SystemFileAssociations\.tif\shell\MINIME"
    WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.tif\shell\MINIME" "MUIVerb" "Converter com MINIME"
    WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.tif\shell\MINIME" "Icon" "$INSTDIR\MINIME.exe,0"
    WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.tif\shell\MINIME" "ExtendedSubCommandsKey" "MINIME.Menu.Image"
    WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.tif\shell\MINIME" "MultiSelectModel" "Player"
    ; .tiff
    DeleteRegKey HKCU "Software\Classes\SystemFileAssociations\.tiff\shell\MINIME"
    WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.tiff\shell\MINIME" "MUIVerb" "Converter com MINIME"
    WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.tiff\shell\MINIME" "Icon" "$INSTDIR\MINIME.exe,0"
    WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.tiff\shell\MINIME" "ExtendedSubCommandsKey" "MINIME.Menu.Image"
    WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.tiff\shell\MINIME" "MultiSelectModel" "Player"
    ; .bmp
    DeleteRegKey HKCU "Software\Classes\SystemFileAssociations\.bmp\shell\MINIME"
    WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.bmp\shell\MINIME" "MUIVerb" "Converter com MINIME"
    WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.bmp\shell\MINIME" "Icon" "$INSTDIR\MINIME.exe,0"
    WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.bmp\shell\MINIME" "ExtendedSubCommandsKey" "MINIME.Menu.Image"
    WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.bmp\shell\MINIME" "MultiSelectModel" "Player"
    ; .gif
    DeleteRegKey HKCU "Software\Classes\SystemFileAssociations\.gif\shell\MINIME"
    WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.gif\shell\MINIME" "MUIVerb" "Converter com MINIME"
    WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.gif\shell\MINIME" "Icon" "$INSTDIR\MINIME.exe,0"
    WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.gif\shell\MINIME" "ExtendedSubCommandsKey" "MINIME.Menu.ImageGif"
    WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.gif\shell\MINIME" "MultiSelectModel" "Player"
    ; .ico
    DeleteRegKey HKCU "Software\Classes\SystemFileAssociations\.ico\shell\MINIME"
    WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.ico\shell\MINIME" "MUIVerb" "Converter com MINIME"
    WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.ico\shell\MINIME" "Icon" "$INSTDIR\MINIME.exe,0"
    WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.ico\shell\MINIME" "ExtendedSubCommandsKey" "MINIME.Menu.Image"
    WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.ico\shell\MINIME" "MultiSelectModel" "Player"
    ; .svg
    DeleteRegKey HKCU "Software\Classes\SystemFileAssociations\.svg\shell\MINIME"
    WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.svg\shell\MINIME" "MUIVerb" "Converter com MINIME"
    WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.svg\shell\MINIME" "Icon" "$INSTDIR\MINIME.exe,0"
    WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.svg\shell\MINIME" "ExtendedSubCommandsKey" "MINIME.Menu.Image"
    WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.svg\shell\MINIME" "MultiSelectModel" "Player"
    ; .heic
    DeleteRegKey HKCU "Software\Classes\SystemFileAssociations\.heic\shell\MINIME"
    WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.heic\shell\MINIME" "MUIVerb" "Converter com MINIME"
    WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.heic\shell\MINIME" "Icon" "$INSTDIR\MINIME.exe,0"
    WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.heic\shell\MINIME" "ExtendedSubCommandsKey" "MINIME.Menu.Image"
    WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.heic\shell\MINIME" "MultiSelectModel" "Player"
    ; .heif
    DeleteRegKey HKCU "Software\Classes\SystemFileAssociations\.heif\shell\MINIME"
    WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.heif\shell\MINIME" "MUIVerb" "Converter com MINIME"
    WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.heif\shell\MINIME" "Icon" "$INSTDIR\MINIME.exe,0"
    WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.heif\shell\MINIME" "ExtendedSubCommandsKey" "MINIME.Menu.Image"
    WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.heif\shell\MINIME" "MultiSelectModel" "Player"
    ; .hif
    DeleteRegKey HKCU "Software\Classes\SystemFileAssociations\.hif\shell\MINIME"
    WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.hif\shell\MINIME" "MUIVerb" "Converter com MINIME"
    WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.hif\shell\MINIME" "Icon" "$INSTDIR\MINIME.exe,0"
    WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.hif\shell\MINIME" "ExtendedSubCommandsKey" "MINIME.Menu.Image"
    WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.hif\shell\MINIME" "MultiSelectModel" "Player"
    ; .jxl
    DeleteRegKey HKCU "Software\Classes\SystemFileAssociations\.jxl\shell\MINIME"
    WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.jxl\shell\MINIME" "MUIVerb" "Converter com MINIME"
    WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.jxl\shell\MINIME" "Icon" "$INSTDIR\MINIME.exe,0"
    WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.jxl\shell\MINIME" "ExtendedSubCommandsKey" "MINIME.Menu.Image"
    WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.jxl\shell\MINIME" "MultiSelectModel" "Player"
    ; .psd
    DeleteRegKey HKCU "Software\Classes\SystemFileAssociations\.psd\shell\MINIME"
    WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.psd\shell\MINIME" "MUIVerb" "Converter com MINIME"
    WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.psd\shell\MINIME" "Icon" "$INSTDIR\MINIME.exe,0"
    WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.psd\shell\MINIME" "ExtendedSubCommandsKey" "MINIME.Menu.Image"
    WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.psd\shell\MINIME" "MultiSelectModel" "Player"
    ; .cr2
    DeleteRegKey HKCU "Software\Classes\SystemFileAssociations\.cr2\shell\MINIME"
    WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.cr2\shell\MINIME" "MUIVerb" "Converter com MINIME"
    WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.cr2\shell\MINIME" "Icon" "$INSTDIR\MINIME.exe,0"
    WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.cr2\shell\MINIME" "ExtendedSubCommandsKey" "MINIME.Menu.Image"
    WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.cr2\shell\MINIME" "MultiSelectModel" "Player"
    ; .cr3
    DeleteRegKey HKCU "Software\Classes\SystemFileAssociations\.cr3\shell\MINIME"
    WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.cr3\shell\MINIME" "MUIVerb" "Converter com MINIME"
    WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.cr3\shell\MINIME" "Icon" "$INSTDIR\MINIME.exe,0"
    WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.cr3\shell\MINIME" "ExtendedSubCommandsKey" "MINIME.Menu.Image"
    WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.cr3\shell\MINIME" "MultiSelectModel" "Player"
    ; .crw
    DeleteRegKey HKCU "Software\Classes\SystemFileAssociations\.crw\shell\MINIME"
    WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.crw\shell\MINIME" "MUIVerb" "Converter com MINIME"
    WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.crw\shell\MINIME" "Icon" "$INSTDIR\MINIME.exe,0"
    WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.crw\shell\MINIME" "ExtendedSubCommandsKey" "MINIME.Menu.Image"
    WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.crw\shell\MINIME" "MultiSelectModel" "Player"
    ; .nef
    DeleteRegKey HKCU "Software\Classes\SystemFileAssociations\.nef\shell\MINIME"
    WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.nef\shell\MINIME" "MUIVerb" "Converter com MINIME"
    WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.nef\shell\MINIME" "Icon" "$INSTDIR\MINIME.exe,0"
    WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.nef\shell\MINIME" "ExtendedSubCommandsKey" "MINIME.Menu.Image"
    WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.nef\shell\MINIME" "MultiSelectModel" "Player"
    ; .nrw
    DeleteRegKey HKCU "Software\Classes\SystemFileAssociations\.nrw\shell\MINIME"
    WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.nrw\shell\MINIME" "MUIVerb" "Converter com MINIME"
    WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.nrw\shell\MINIME" "Icon" "$INSTDIR\MINIME.exe,0"
    WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.nrw\shell\MINIME" "ExtendedSubCommandsKey" "MINIME.Menu.Image"
    WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.nrw\shell\MINIME" "MultiSelectModel" "Player"
    ; .arw
    DeleteRegKey HKCU "Software\Classes\SystemFileAssociations\.arw\shell\MINIME"
    WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.arw\shell\MINIME" "MUIVerb" "Converter com MINIME"
    WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.arw\shell\MINIME" "Icon" "$INSTDIR\MINIME.exe,0"
    WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.arw\shell\MINIME" "ExtendedSubCommandsKey" "MINIME.Menu.Image"
    WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.arw\shell\MINIME" "MultiSelectModel" "Player"
    ; .srf
    DeleteRegKey HKCU "Software\Classes\SystemFileAssociations\.srf\shell\MINIME"
    WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.srf\shell\MINIME" "MUIVerb" "Converter com MINIME"
    WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.srf\shell\MINIME" "Icon" "$INSTDIR\MINIME.exe,0"
    WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.srf\shell\MINIME" "ExtendedSubCommandsKey" "MINIME.Menu.Image"
    WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.srf\shell\MINIME" "MultiSelectModel" "Player"
    ; .sr2
    DeleteRegKey HKCU "Software\Classes\SystemFileAssociations\.sr2\shell\MINIME"
    WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.sr2\shell\MINIME" "MUIVerb" "Converter com MINIME"
    WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.sr2\shell\MINIME" "Icon" "$INSTDIR\MINIME.exe,0"
    WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.sr2\shell\MINIME" "ExtendedSubCommandsKey" "MINIME.Menu.Image"
    WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.sr2\shell\MINIME" "MultiSelectModel" "Player"
    ; .dng
    DeleteRegKey HKCU "Software\Classes\SystemFileAssociations\.dng\shell\MINIME"
    WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.dng\shell\MINIME" "MUIVerb" "Converter com MINIME"
    WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.dng\shell\MINIME" "Icon" "$INSTDIR\MINIME.exe,0"
    WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.dng\shell\MINIME" "ExtendedSubCommandsKey" "MINIME.Menu.Image"
    WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.dng\shell\MINIME" "MultiSelectModel" "Player"
    ; .raf
    DeleteRegKey HKCU "Software\Classes\SystemFileAssociations\.raf\shell\MINIME"
    WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.raf\shell\MINIME" "MUIVerb" "Converter com MINIME"
    WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.raf\shell\MINIME" "Icon" "$INSTDIR\MINIME.exe,0"
    WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.raf\shell\MINIME" "ExtendedSubCommandsKey" "MINIME.Menu.Image"
    WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.raf\shell\MINIME" "MultiSelectModel" "Player"
    ; .orf
    DeleteRegKey HKCU "Software\Classes\SystemFileAssociations\.orf\shell\MINIME"
    WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.orf\shell\MINIME" "MUIVerb" "Converter com MINIME"
    WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.orf\shell\MINIME" "Icon" "$INSTDIR\MINIME.exe,0"
    WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.orf\shell\MINIME" "ExtendedSubCommandsKey" "MINIME.Menu.Image"
    WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.orf\shell\MINIME" "MultiSelectModel" "Player"
    ; .rw2
    DeleteRegKey HKCU "Software\Classes\SystemFileAssociations\.rw2\shell\MINIME"
    WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.rw2\shell\MINIME" "MUIVerb" "Converter com MINIME"
    WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.rw2\shell\MINIME" "Icon" "$INSTDIR\MINIME.exe,0"
    WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.rw2\shell\MINIME" "ExtendedSubCommandsKey" "MINIME.Menu.Image"
    WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.rw2\shell\MINIME" "MultiSelectModel" "Player"
    ; .pef
    DeleteRegKey HKCU "Software\Classes\SystemFileAssociations\.pef\shell\MINIME"
    WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.pef\shell\MINIME" "MUIVerb" "Converter com MINIME"
    WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.pef\shell\MINIME" "Icon" "$INSTDIR\MINIME.exe,0"
    WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.pef\shell\MINIME" "ExtendedSubCommandsKey" "MINIME.Menu.Image"
    WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.pef\shell\MINIME" "MultiSelectModel" "Player"
    ; .srw
    DeleteRegKey HKCU "Software\Classes\SystemFileAssociations\.srw\shell\MINIME"
    WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.srw\shell\MINIME" "MUIVerb" "Converter com MINIME"
    WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.srw\shell\MINIME" "Icon" "$INSTDIR\MINIME.exe,0"
    WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.srw\shell\MINIME" "ExtendedSubCommandsKey" "MINIME.Menu.Image"
    WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.srw\shell\MINIME" "MultiSelectModel" "Player"
    ; .3fr
    DeleteRegKey HKCU "Software\Classes\SystemFileAssociations\.3fr\shell\MINIME"
    WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.3fr\shell\MINIME" "MUIVerb" "Converter com MINIME"
    WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.3fr\shell\MINIME" "Icon" "$INSTDIR\MINIME.exe,0"
    WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.3fr\shell\MINIME" "ExtendedSubCommandsKey" "MINIME.Menu.Image"
    WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.3fr\shell\MINIME" "MultiSelectModel" "Player"
    ; .iiq
    DeleteRegKey HKCU "Software\Classes\SystemFileAssociations\.iiq\shell\MINIME"
    WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.iiq\shell\MINIME" "MUIVerb" "Converter com MINIME"
    WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.iiq\shell\MINIME" "Icon" "$INSTDIR\MINIME.exe,0"
    WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.iiq\shell\MINIME" "ExtendedSubCommandsKey" "MINIME.Menu.Image"
    WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.iiq\shell\MINIME" "MultiSelectModel" "Player"
    ; .erf
    DeleteRegKey HKCU "Software\Classes\SystemFileAssociations\.erf\shell\MINIME"
    WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.erf\shell\MINIME" "MUIVerb" "Converter com MINIME"
    WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.erf\shell\MINIME" "Icon" "$INSTDIR\MINIME.exe,0"
    WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.erf\shell\MINIME" "ExtendedSubCommandsKey" "MINIME.Menu.Image"
    WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.erf\shell\MINIME" "MultiSelectModel" "Player"
    ; .mef
    DeleteRegKey HKCU "Software\Classes\SystemFileAssociations\.mef\shell\MINIME"
    WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.mef\shell\MINIME" "MUIVerb" "Converter com MINIME"
    WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.mef\shell\MINIME" "Icon" "$INSTDIR\MINIME.exe,0"
    WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.mef\shell\MINIME" "ExtendedSubCommandsKey" "MINIME.Menu.Image"
    WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.mef\shell\MINIME" "MultiSelectModel" "Player"
    ; .mos
    DeleteRegKey HKCU "Software\Classes\SystemFileAssociations\.mos\shell\MINIME"
    WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.mos\shell\MINIME" "MUIVerb" "Converter com MINIME"
    WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.mos\shell\MINIME" "Icon" "$INSTDIR\MINIME.exe,0"
    WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.mos\shell\MINIME" "ExtendedSubCommandsKey" "MINIME.Menu.Image"
    WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.mos\shell\MINIME" "MultiSelectModel" "Player"
    ; .kdc
    DeleteRegKey HKCU "Software\Classes\SystemFileAssociations\.kdc\shell\MINIME"
    WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.kdc\shell\MINIME" "MUIVerb" "Converter com MINIME"
    WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.kdc\shell\MINIME" "Icon" "$INSTDIR\MINIME.exe,0"
    WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.kdc\shell\MINIME" "ExtendedSubCommandsKey" "MINIME.Menu.Image"
    WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.kdc\shell\MINIME" "MultiSelectModel" "Player"
    ; .dcr
    DeleteRegKey HKCU "Software\Classes\SystemFileAssociations\.dcr\shell\MINIME"
    WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.dcr\shell\MINIME" "MUIVerb" "Converter com MINIME"
    WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.dcr\shell\MINIME" "Icon" "$INSTDIR\MINIME.exe,0"
    WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.dcr\shell\MINIME" "ExtendedSubCommandsKey" "MINIME.Menu.Image"
    WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.dcr\shell\MINIME" "MultiSelectModel" "Player"
    ; .x3f
    DeleteRegKey HKCU "Software\Classes\SystemFileAssociations\.x3f\shell\MINIME"
    WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.x3f\shell\MINIME" "MUIVerb" "Converter com MINIME"
    WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.x3f\shell\MINIME" "Icon" "$INSTDIR\MINIME.exe,0"
    WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.x3f\shell\MINIME" "ExtendedSubCommandsKey" "MINIME.Menu.Image"
    WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.x3f\shell\MINIME" "MultiSelectModel" "Player"
    ; .mp4
    DeleteRegKey HKCU "Software\Classes\SystemFileAssociations\.mp4\shell\MINIME"
    WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.mp4\shell\MINIME" "MUIVerb" "Converter com MINIME"
    WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.mp4\shell\MINIME" "Icon" "$INSTDIR\MINIME.exe,0"
    WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.mp4\shell\MINIME" "ExtendedSubCommandsKey" "MINIME.Menu.Video"
    WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.mp4\shell\MINIME" "MultiSelectModel" "Player"
    ; .m4v
    DeleteRegKey HKCU "Software\Classes\SystemFileAssociations\.m4v\shell\MINIME"
    WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.m4v\shell\MINIME" "MUIVerb" "Converter com MINIME"
    WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.m4v\shell\MINIME" "Icon" "$INSTDIR\MINIME.exe,0"
    WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.m4v\shell\MINIME" "ExtendedSubCommandsKey" "MINIME.Menu.Video"
    WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.m4v\shell\MINIME" "MultiSelectModel" "Player"
    ; .mkv
    DeleteRegKey HKCU "Software\Classes\SystemFileAssociations\.mkv\shell\MINIME"
    WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.mkv\shell\MINIME" "MUIVerb" "Converter com MINIME"
    WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.mkv\shell\MINIME" "Icon" "$INSTDIR\MINIME.exe,0"
    WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.mkv\shell\MINIME" "ExtendedSubCommandsKey" "MINIME.Menu.Video"
    WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.mkv\shell\MINIME" "MultiSelectModel" "Player"
    ; .mov
    DeleteRegKey HKCU "Software\Classes\SystemFileAssociations\.mov\shell\MINIME"
    WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.mov\shell\MINIME" "MUIVerb" "Converter com MINIME"
    WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.mov\shell\MINIME" "Icon" "$INSTDIR\MINIME.exe,0"
    WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.mov\shell\MINIME" "ExtendedSubCommandsKey" "MINIME.Menu.Video"
    WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.mov\shell\MINIME" "MultiSelectModel" "Player"
    ; .avi
    DeleteRegKey HKCU "Software\Classes\SystemFileAssociations\.avi\shell\MINIME"
    WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.avi\shell\MINIME" "MUIVerb" "Converter com MINIME"
    WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.avi\shell\MINIME" "Icon" "$INSTDIR\MINIME.exe,0"
    WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.avi\shell\MINIME" "ExtendedSubCommandsKey" "MINIME.Menu.Video"
    WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.avi\shell\MINIME" "MultiSelectModel" "Player"
    ; .webm
    DeleteRegKey HKCU "Software\Classes\SystemFileAssociations\.webm\shell\MINIME"
    WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.webm\shell\MINIME" "MUIVerb" "Converter com MINIME"
    WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.webm\shell\MINIME" "Icon" "$INSTDIR\MINIME.exe,0"
    WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.webm\shell\MINIME" "ExtendedSubCommandsKey" "MINIME.Menu.Video"
    WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.webm\shell\MINIME" "MultiSelectModel" "Player"
    ; .wmv
    DeleteRegKey HKCU "Software\Classes\SystemFileAssociations\.wmv\shell\MINIME"
    WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.wmv\shell\MINIME" "MUIVerb" "Converter com MINIME"
    WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.wmv\shell\MINIME" "Icon" "$INSTDIR\MINIME.exe,0"
    WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.wmv\shell\MINIME" "ExtendedSubCommandsKey" "MINIME.Menu.Video"
    WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.wmv\shell\MINIME" "MultiSelectModel" "Player"
    ; .flv
    DeleteRegKey HKCU "Software\Classes\SystemFileAssociations\.flv\shell\MINIME"
    WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.flv\shell\MINIME" "MUIVerb" "Converter com MINIME"
    WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.flv\shell\MINIME" "Icon" "$INSTDIR\MINIME.exe,0"
    WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.flv\shell\MINIME" "ExtendedSubCommandsKey" "MINIME.Menu.Video"
    WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.flv\shell\MINIME" "MultiSelectModel" "Player"
    ; .mpg
    DeleteRegKey HKCU "Software\Classes\SystemFileAssociations\.mpg\shell\MINIME"
    WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.mpg\shell\MINIME" "MUIVerb" "Converter com MINIME"
    WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.mpg\shell\MINIME" "Icon" "$INSTDIR\MINIME.exe,0"
    WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.mpg\shell\MINIME" "ExtendedSubCommandsKey" "MINIME.Menu.Video"
    WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.mpg\shell\MINIME" "MultiSelectModel" "Player"
    ; .mpeg
    DeleteRegKey HKCU "Software\Classes\SystemFileAssociations\.mpeg\shell\MINIME"
    WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.mpeg\shell\MINIME" "MUIVerb" "Converter com MINIME"
    WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.mpeg\shell\MINIME" "Icon" "$INSTDIR\MINIME.exe,0"
    WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.mpeg\shell\MINIME" "ExtendedSubCommandsKey" "MINIME.Menu.Video"
    WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.mpeg\shell\MINIME" "MultiSelectModel" "Player"
    ; .mts
    DeleteRegKey HKCU "Software\Classes\SystemFileAssociations\.mts\shell\MINIME"
    WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.mts\shell\MINIME" "MUIVerb" "Converter com MINIME"
    WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.mts\shell\MINIME" "Icon" "$INSTDIR\MINIME.exe,0"
    WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.mts\shell\MINIME" "ExtendedSubCommandsKey" "MINIME.Menu.Video"
    WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.mts\shell\MINIME" "MultiSelectModel" "Player"
    ; .m2ts
    DeleteRegKey HKCU "Software\Classes\SystemFileAssociations\.m2ts\shell\MINIME"
    WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.m2ts\shell\MINIME" "MUIVerb" "Converter com MINIME"
    WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.m2ts\shell\MINIME" "Icon" "$INSTDIR\MINIME.exe,0"
    WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.m2ts\shell\MINIME" "ExtendedSubCommandsKey" "MINIME.Menu.Video"
    WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.m2ts\shell\MINIME" "MultiSelectModel" "Player"
    ; .3gp
    DeleteRegKey HKCU "Software\Classes\SystemFileAssociations\.3gp\shell\MINIME"
    WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.3gp\shell\MINIME" "MUIVerb" "Converter com MINIME"
    WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.3gp\shell\MINIME" "Icon" "$INSTDIR\MINIME.exe,0"
    WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.3gp\shell\MINIME" "ExtendedSubCommandsKey" "MINIME.Menu.Video"
    WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.3gp\shell\MINIME" "MultiSelectModel" "Player"
    ; .ogv
    DeleteRegKey HKCU "Software\Classes\SystemFileAssociations\.ogv\shell\MINIME"
    WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.ogv\shell\MINIME" "MUIVerb" "Converter com MINIME"
    WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.ogv\shell\MINIME" "Icon" "$INSTDIR\MINIME.exe,0"
    WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.ogv\shell\MINIME" "ExtendedSubCommandsKey" "MINIME.Menu.Video"
    WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.ogv\shell\MINIME" "MultiSelectModel" "Player"
    ; .mp3
    DeleteRegKey HKCU "Software\Classes\SystemFileAssociations\.mp3\shell\MINIME"
    WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.mp3\shell\MINIME" "MUIVerb" "Converter com MINIME"
    WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.mp3\shell\MINIME" "Icon" "$INSTDIR\MINIME.exe,0"
    WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.mp3\shell\MINIME" "ExtendedSubCommandsKey" "MINIME.Menu.Audio"
    WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.mp3\shell\MINIME" "MultiSelectModel" "Player"
    ; .wav
    DeleteRegKey HKCU "Software\Classes\SystemFileAssociations\.wav\shell\MINIME"
    WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.wav\shell\MINIME" "MUIVerb" "Converter com MINIME"
    WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.wav\shell\MINIME" "Icon" "$INSTDIR\MINIME.exe,0"
    WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.wav\shell\MINIME" "ExtendedSubCommandsKey" "MINIME.Menu.Audio"
    WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.wav\shell\MINIME" "MultiSelectModel" "Player"
    ; .m4a
    DeleteRegKey HKCU "Software\Classes\SystemFileAssociations\.m4a\shell\MINIME"
    WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.m4a\shell\MINIME" "MUIVerb" "Converter com MINIME"
    WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.m4a\shell\MINIME" "Icon" "$INSTDIR\MINIME.exe,0"
    WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.m4a\shell\MINIME" "ExtendedSubCommandsKey" "MINIME.Menu.Audio"
    WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.m4a\shell\MINIME" "MultiSelectModel" "Player"
    ; .aac
    DeleteRegKey HKCU "Software\Classes\SystemFileAssociations\.aac\shell\MINIME"
    WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.aac\shell\MINIME" "MUIVerb" "Converter com MINIME"
    WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.aac\shell\MINIME" "Icon" "$INSTDIR\MINIME.exe,0"
    WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.aac\shell\MINIME" "ExtendedSubCommandsKey" "MINIME.Menu.Audio"
    WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.aac\shell\MINIME" "MultiSelectModel" "Player"
    ; .flac
    DeleteRegKey HKCU "Software\Classes\SystemFileAssociations\.flac\shell\MINIME"
    WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.flac\shell\MINIME" "MUIVerb" "Converter com MINIME"
    WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.flac\shell\MINIME" "Icon" "$INSTDIR\MINIME.exe,0"
    WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.flac\shell\MINIME" "ExtendedSubCommandsKey" "MINIME.Menu.Audio"
    WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.flac\shell\MINIME" "MultiSelectModel" "Player"
    ; .ogg
    DeleteRegKey HKCU "Software\Classes\SystemFileAssociations\.ogg\shell\MINIME"
    WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.ogg\shell\MINIME" "MUIVerb" "Converter com MINIME"
    WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.ogg\shell\MINIME" "Icon" "$INSTDIR\MINIME.exe,0"
    WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.ogg\shell\MINIME" "ExtendedSubCommandsKey" "MINIME.Menu.Audio"
    WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.ogg\shell\MINIME" "MultiSelectModel" "Player"
    ; .oga
    DeleteRegKey HKCU "Software\Classes\SystemFileAssociations\.oga\shell\MINIME"
    WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.oga\shell\MINIME" "MUIVerb" "Converter com MINIME"
    WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.oga\shell\MINIME" "Icon" "$INSTDIR\MINIME.exe,0"
    WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.oga\shell\MINIME" "ExtendedSubCommandsKey" "MINIME.Menu.Audio"
    WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.oga\shell\MINIME" "MultiSelectModel" "Player"
    ; .opus
    DeleteRegKey HKCU "Software\Classes\SystemFileAssociations\.opus\shell\MINIME"
    WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.opus\shell\MINIME" "MUIVerb" "Converter com MINIME"
    WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.opus\shell\MINIME" "Icon" "$INSTDIR\MINIME.exe,0"
    WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.opus\shell\MINIME" "ExtendedSubCommandsKey" "MINIME.Menu.Audio"
    WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.opus\shell\MINIME" "MultiSelectModel" "Player"
    ; .wma
    DeleteRegKey HKCU "Software\Classes\SystemFileAssociations\.wma\shell\MINIME"
    WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.wma\shell\MINIME" "MUIVerb" "Converter com MINIME"
    WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.wma\shell\MINIME" "Icon" "$INSTDIR\MINIME.exe,0"
    WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.wma\shell\MINIME" "ExtendedSubCommandsKey" "MINIME.Menu.Audio"
    WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.wma\shell\MINIME" "MultiSelectModel" "Player"
    ; .aif
    DeleteRegKey HKCU "Software\Classes\SystemFileAssociations\.aif\shell\MINIME"
    WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.aif\shell\MINIME" "MUIVerb" "Converter com MINIME"
    WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.aif\shell\MINIME" "Icon" "$INSTDIR\MINIME.exe,0"
    WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.aif\shell\MINIME" "ExtendedSubCommandsKey" "MINIME.Menu.Audio"
    WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.aif\shell\MINIME" "MultiSelectModel" "Player"
    ; .aiff
    DeleteRegKey HKCU "Software\Classes\SystemFileAssociations\.aiff\shell\MINIME"
    WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.aiff\shell\MINIME" "MUIVerb" "Converter com MINIME"
    WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.aiff\shell\MINIME" "Icon" "$INSTDIR\MINIME.exe,0"
    WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.aiff\shell\MINIME" "ExtendedSubCommandsKey" "MINIME.Menu.Audio"
    WriteRegStr HKCU "Software\Classes\SystemFileAssociations\.aiff\shell\MINIME" "MultiSelectModel" "Player"
    ; árvore MINIME.Menu.Image
    DeleteRegKey HKCU "Software\Classes\MINIME.Menu.Image"
    WriteRegStr HKCU "Software\Classes\MINIME.Menu.Image\shell\a01_img-jpg" "MUIVerb" "JPG 80% · mesma resolução"
    WriteRegStr HKCU "Software\Classes\MINIME.Menu.Image\shell\a01_img-jpg" "MultiSelectModel" "Player"
    WriteRegStr HKCU "Software\Classes\MINIME.Menu.Image\shell\a01_img-jpg\command" "" '"$INSTDIR\MINIME.exe" --preset img-jpg "%1"'
    WriteRegStr HKCU "Software\Classes\MINIME.Menu.Image\shell\a02_img-jpg-75" "MUIVerb" "JPG 80% · 75% da resolução"
    WriteRegStr HKCU "Software\Classes\MINIME.Menu.Image\shell\a02_img-jpg-75" "MultiSelectModel" "Player"
    WriteRegStr HKCU "Software\Classes\MINIME.Menu.Image\shell\a02_img-jpg-75\command" "" '"$INSTDIR\MINIME.exe" --preset img-jpg-75 "%1"'
    WriteRegStr HKCU "Software\Classes\MINIME.Menu.Image\shell\a03_img-jpg-50" "MUIVerb" "JPG 80% · metade da resolução"
    WriteRegStr HKCU "Software\Classes\MINIME.Menu.Image\shell\a03_img-jpg-50" "MultiSelectModel" "Player"
    WriteRegStr HKCU "Software\Classes\MINIME.Menu.Image\shell\a03_img-jpg-50\command" "" '"$INSTDIR\MINIME.exe" --preset img-jpg-50 "%1"'
    WriteRegStr HKCU "Software\Classes\MINIME.Menu.Image\shell\a04_img-webp" "MUIVerb" "WebP 80% · mesma resolução"
    WriteRegStr HKCU "Software\Classes\MINIME.Menu.Image\shell\a04_img-webp" "MultiSelectModel" "Player"
    WriteRegStr HKCU "Software\Classes\MINIME.Menu.Image\shell\a04_img-webp\command" "" '"$INSTDIR\MINIME.exe" --preset img-webp "%1"'
    WriteRegStr HKCU "Software\Classes\MINIME.Menu.Image\shell\a05_img-up" "MUIVerb" "Aumentar com IA · até 4K"
    WriteRegStr HKCU "Software\Classes\MINIME.Menu.Image\shell\a05_img-up" "MultiSelectModel" "Player"
    WriteRegStr HKCU "Software\Classes\MINIME.Menu.Image\shell\a05_img-up\command" "" '"$INSTDIR\MINIME.exe" --preset img-up "%1"'
    WriteRegStr HKCU "Software\Classes\MINIME.Menu.Image\shell\y90_more" "MUIVerb" "Mais formatos"
    WriteRegStr HKCU "Software\Classes\MINIME.Menu.Image\shell\y90_more" "MultiSelectModel" "Player"
    WriteRegDWORD HKCU "Software\Classes\MINIME.Menu.Image\shell\y90_more" "CommandFlags" 32
    WriteRegStr HKCU "Software\Classes\MINIME.Menu.Image\shell\y90_more" "SubCommands" ""
    WriteRegStr HKCU "Software\Classes\MINIME.Menu.Image\shell\y90_more\shell\b01_same" "MUIVerb" "Comprimir (mesmo formato)"
    WriteRegStr HKCU "Software\Classes\MINIME.Menu.Image\shell\y90_more\shell\b01_same" "MultiSelectModel" "Player"
    WriteRegStr HKCU "Software\Classes\MINIME.Menu.Image\shell\y90_more\shell\b01_same\command" "" '"$INSTDIR\MINIME.exe" --quick same "%1"'
    WriteRegStr HKCU "Software\Classes\MINIME.Menu.Image\shell\y90_more\shell\b02_jpg" "MUIVerb" "JPG"
    WriteRegStr HKCU "Software\Classes\MINIME.Menu.Image\shell\y90_more\shell\b02_jpg" "MultiSelectModel" "Player"
    WriteRegStr HKCU "Software\Classes\MINIME.Menu.Image\shell\y90_more\shell\b02_jpg\command" "" '"$INSTDIR\MINIME.exe" --quick jpg "%1"'
    WriteRegStr HKCU "Software\Classes\MINIME.Menu.Image\shell\y90_more\shell\b03_png" "MUIVerb" "PNG"
    WriteRegStr HKCU "Software\Classes\MINIME.Menu.Image\shell\y90_more\shell\b03_png" "MultiSelectModel" "Player"
    WriteRegStr HKCU "Software\Classes\MINIME.Menu.Image\shell\y90_more\shell\b03_png\command" "" '"$INSTDIR\MINIME.exe" --quick png "%1"'
    WriteRegStr HKCU "Software\Classes\MINIME.Menu.Image\shell\y90_more\shell\b04_webp" "MUIVerb" "WebP"
    WriteRegStr HKCU "Software\Classes\MINIME.Menu.Image\shell\y90_more\shell\b04_webp" "MultiSelectModel" "Player"
    WriteRegStr HKCU "Software\Classes\MINIME.Menu.Image\shell\y90_more\shell\b04_webp\command" "" '"$INSTDIR\MINIME.exe" --quick webp "%1"'
    WriteRegStr HKCU "Software\Classes\MINIME.Menu.Image\shell\y90_more\shell\b05_avif" "MUIVerb" "AVIF"
    WriteRegStr HKCU "Software\Classes\MINIME.Menu.Image\shell\y90_more\shell\b05_avif" "MultiSelectModel" "Player"
    WriteRegStr HKCU "Software\Classes\MINIME.Menu.Image\shell\y90_more\shell\b05_avif\command" "" '"$INSTDIR\MINIME.exe" --quick avif "%1"'
    WriteRegStr HKCU "Software\Classes\MINIME.Menu.Image\shell\y90_more\shell\b06_tiff" "MUIVerb" "TIFF"
    WriteRegStr HKCU "Software\Classes\MINIME.Menu.Image\shell\y90_more\shell\b06_tiff" "MultiSelectModel" "Player"
    WriteRegStr HKCU "Software\Classes\MINIME.Menu.Image\shell\y90_more\shell\b06_tiff\command" "" '"$INSTDIR\MINIME.exe" --quick tiff "%1"'
    WriteRegStr HKCU "Software\Classes\MINIME.Menu.Image\shell\y90_more\shell\b07_gif" "MUIVerb" "GIF"
    WriteRegStr HKCU "Software\Classes\MINIME.Menu.Image\shell\y90_more\shell\b07_gif" "MultiSelectModel" "Player"
    WriteRegStr HKCU "Software\Classes\MINIME.Menu.Image\shell\y90_more\shell\b07_gif\command" "" '"$INSTDIR\MINIME.exe" --quick gif "%1"'
    WriteRegStr HKCU "Software\Classes\MINIME.Menu.Image\shell\y90_more\shell\b08_bmp" "MUIVerb" "BMP"
    WriteRegStr HKCU "Software\Classes\MINIME.Menu.Image\shell\y90_more\shell\b08_bmp" "MultiSelectModel" "Player"
    WriteRegStr HKCU "Software\Classes\MINIME.Menu.Image\shell\y90_more\shell\b08_bmp\command" "" '"$INSTDIR\MINIME.exe" --quick bmp "%1"'
    WriteRegStr HKCU "Software\Classes\MINIME.Menu.Image\shell\y90_more\shell\b09_ico" "MUIVerb" "ICO (ícone)"
    WriteRegStr HKCU "Software\Classes\MINIME.Menu.Image\shell\y90_more\shell\b09_ico" "MultiSelectModel" "Player"
    WriteRegStr HKCU "Software\Classes\MINIME.Menu.Image\shell\y90_more\shell\b09_ico\command" "" '"$INSTDIR\MINIME.exe" --quick ico "%1"'
    WriteRegStr HKCU "Software\Classes\MINIME.Menu.Image\shell\z99_open" "MUIVerb" "Abrir no MINIME…"
    WriteRegStr HKCU "Software\Classes\MINIME.Menu.Image\shell\z99_open" "MultiSelectModel" "Player"
    WriteRegStr HKCU "Software\Classes\MINIME.Menu.Image\shell\z99_open\command" "" '"$INSTDIR\MINIME.exe" --open "%1"'
    ; árvore MINIME.Menu.ImageGif
    DeleteRegKey HKCU "Software\Classes\MINIME.Menu.ImageGif"
    WriteRegStr HKCU "Software\Classes\MINIME.Menu.ImageGif\shell\a01_img-jpg" "MUIVerb" "JPG 80% · mesma resolução"
    WriteRegStr HKCU "Software\Classes\MINIME.Menu.ImageGif\shell\a01_img-jpg" "MultiSelectModel" "Player"
    WriteRegStr HKCU "Software\Classes\MINIME.Menu.ImageGif\shell\a01_img-jpg\command" "" '"$INSTDIR\MINIME.exe" --preset img-jpg "%1"'
    WriteRegStr HKCU "Software\Classes\MINIME.Menu.ImageGif\shell\a02_img-jpg-75" "MUIVerb" "JPG 80% · 75% da resolução"
    WriteRegStr HKCU "Software\Classes\MINIME.Menu.ImageGif\shell\a02_img-jpg-75" "MultiSelectModel" "Player"
    WriteRegStr HKCU "Software\Classes\MINIME.Menu.ImageGif\shell\a02_img-jpg-75\command" "" '"$INSTDIR\MINIME.exe" --preset img-jpg-75 "%1"'
    WriteRegStr HKCU "Software\Classes\MINIME.Menu.ImageGif\shell\a03_img-jpg-50" "MUIVerb" "JPG 80% · metade da resolução"
    WriteRegStr HKCU "Software\Classes\MINIME.Menu.ImageGif\shell\a03_img-jpg-50" "MultiSelectModel" "Player"
    WriteRegStr HKCU "Software\Classes\MINIME.Menu.ImageGif\shell\a03_img-jpg-50\command" "" '"$INSTDIR\MINIME.exe" --preset img-jpg-50 "%1"'
    WriteRegStr HKCU "Software\Classes\MINIME.Menu.ImageGif\shell\a04_img-webp" "MUIVerb" "WebP 80% · mesma resolução"
    WriteRegStr HKCU "Software\Classes\MINIME.Menu.ImageGif\shell\a04_img-webp" "MultiSelectModel" "Player"
    WriteRegStr HKCU "Software\Classes\MINIME.Menu.ImageGif\shell\a04_img-webp\command" "" '"$INSTDIR\MINIME.exe" --preset img-webp "%1"'
    WriteRegStr HKCU "Software\Classes\MINIME.Menu.ImageGif\shell\a05_img-up" "MUIVerb" "Aumentar com IA · até 4K"
    WriteRegStr HKCU "Software\Classes\MINIME.Menu.ImageGif\shell\a05_img-up" "MultiSelectModel" "Player"
    WriteRegStr HKCU "Software\Classes\MINIME.Menu.ImageGif\shell\a05_img-up\command" "" '"$INSTDIR\MINIME.exe" --preset img-up "%1"'
    WriteRegStr HKCU "Software\Classes\MINIME.Menu.ImageGif\shell\y90_more" "MUIVerb" "Mais formatos"
    WriteRegStr HKCU "Software\Classes\MINIME.Menu.ImageGif\shell\y90_more" "MultiSelectModel" "Player"
    WriteRegDWORD HKCU "Software\Classes\MINIME.Menu.ImageGif\shell\y90_more" "CommandFlags" 32
    WriteRegStr HKCU "Software\Classes\MINIME.Menu.ImageGif\shell\y90_more" "SubCommands" ""
    WriteRegStr HKCU "Software\Classes\MINIME.Menu.ImageGif\shell\y90_more\shell\b01_same" "MUIVerb" "Comprimir (mesmo formato)"
    WriteRegStr HKCU "Software\Classes\MINIME.Menu.ImageGif\shell\y90_more\shell\b01_same" "MultiSelectModel" "Player"
    WriteRegStr HKCU "Software\Classes\MINIME.Menu.ImageGif\shell\y90_more\shell\b01_same\command" "" '"$INSTDIR\MINIME.exe" --quick same "%1"'
    WriteRegStr HKCU "Software\Classes\MINIME.Menu.ImageGif\shell\y90_more\shell\b02_jpg" "MUIVerb" "JPG"
    WriteRegStr HKCU "Software\Classes\MINIME.Menu.ImageGif\shell\y90_more\shell\b02_jpg" "MultiSelectModel" "Player"
    WriteRegStr HKCU "Software\Classes\MINIME.Menu.ImageGif\shell\y90_more\shell\b02_jpg\command" "" '"$INSTDIR\MINIME.exe" --quick jpg "%1"'
    WriteRegStr HKCU "Software\Classes\MINIME.Menu.ImageGif\shell\y90_more\shell\b03_png" "MUIVerb" "PNG"
    WriteRegStr HKCU "Software\Classes\MINIME.Menu.ImageGif\shell\y90_more\shell\b03_png" "MultiSelectModel" "Player"
    WriteRegStr HKCU "Software\Classes\MINIME.Menu.ImageGif\shell\y90_more\shell\b03_png\command" "" '"$INSTDIR\MINIME.exe" --quick png "%1"'
    WriteRegStr HKCU "Software\Classes\MINIME.Menu.ImageGif\shell\y90_more\shell\b04_webp" "MUIVerb" "WebP"
    WriteRegStr HKCU "Software\Classes\MINIME.Menu.ImageGif\shell\y90_more\shell\b04_webp" "MultiSelectModel" "Player"
    WriteRegStr HKCU "Software\Classes\MINIME.Menu.ImageGif\shell\y90_more\shell\b04_webp\command" "" '"$INSTDIR\MINIME.exe" --quick webp "%1"'
    WriteRegStr HKCU "Software\Classes\MINIME.Menu.ImageGif\shell\y90_more\shell\b05_avif" "MUIVerb" "AVIF"
    WriteRegStr HKCU "Software\Classes\MINIME.Menu.ImageGif\shell\y90_more\shell\b05_avif" "MultiSelectModel" "Player"
    WriteRegStr HKCU "Software\Classes\MINIME.Menu.ImageGif\shell\y90_more\shell\b05_avif\command" "" '"$INSTDIR\MINIME.exe" --quick avif "%1"'
    WriteRegStr HKCU "Software\Classes\MINIME.Menu.ImageGif\shell\y90_more\shell\b06_tiff" "MUIVerb" "TIFF"
    WriteRegStr HKCU "Software\Classes\MINIME.Menu.ImageGif\shell\y90_more\shell\b06_tiff" "MultiSelectModel" "Player"
    WriteRegStr HKCU "Software\Classes\MINIME.Menu.ImageGif\shell\y90_more\shell\b06_tiff\command" "" '"$INSTDIR\MINIME.exe" --quick tiff "%1"'
    WriteRegStr HKCU "Software\Classes\MINIME.Menu.ImageGif\shell\y90_more\shell\b07_gif" "MUIVerb" "GIF"
    WriteRegStr HKCU "Software\Classes\MINIME.Menu.ImageGif\shell\y90_more\shell\b07_gif" "MultiSelectModel" "Player"
    WriteRegStr HKCU "Software\Classes\MINIME.Menu.ImageGif\shell\y90_more\shell\b07_gif\command" "" '"$INSTDIR\MINIME.exe" --quick gif "%1"'
    WriteRegStr HKCU "Software\Classes\MINIME.Menu.ImageGif\shell\y90_more\shell\b08_bmp" "MUIVerb" "BMP"
    WriteRegStr HKCU "Software\Classes\MINIME.Menu.ImageGif\shell\y90_more\shell\b08_bmp" "MultiSelectModel" "Player"
    WriteRegStr HKCU "Software\Classes\MINIME.Menu.ImageGif\shell\y90_more\shell\b08_bmp\command" "" '"$INSTDIR\MINIME.exe" --quick bmp "%1"'
    WriteRegStr HKCU "Software\Classes\MINIME.Menu.ImageGif\shell\y90_more\shell\b09_ico" "MUIVerb" "ICO (ícone)"
    WriteRegStr HKCU "Software\Classes\MINIME.Menu.ImageGif\shell\y90_more\shell\b09_ico" "MultiSelectModel" "Player"
    WriteRegStr HKCU "Software\Classes\MINIME.Menu.ImageGif\shell\y90_more\shell\b09_ico\command" "" '"$INSTDIR\MINIME.exe" --quick ico "%1"'
    WriteRegStr HKCU "Software\Classes\MINIME.Menu.ImageGif\shell\y90_more\shell\b10_mp4" "MUIVerb" "MP4 (vídeo)"
    WriteRegStr HKCU "Software\Classes\MINIME.Menu.ImageGif\shell\y90_more\shell\b10_mp4" "MultiSelectModel" "Player"
    WriteRegStr HKCU "Software\Classes\MINIME.Menu.ImageGif\shell\y90_more\shell\b10_mp4\command" "" '"$INSTDIR\MINIME.exe" --quick mp4 "%1"'
    WriteRegStr HKCU "Software\Classes\MINIME.Menu.ImageGif\shell\z99_open" "MUIVerb" "Abrir no MINIME…"
    WriteRegStr HKCU "Software\Classes\MINIME.Menu.ImageGif\shell\z99_open" "MultiSelectModel" "Player"
    WriteRegStr HKCU "Software\Classes\MINIME.Menu.ImageGif\shell\z99_open\command" "" '"$INSTDIR\MINIME.exe" --open "%1"'
    ; árvore MINIME.Menu.Video
    DeleteRegKey HKCU "Software\Classes\MINIME.Menu.Video"
    WriteRegStr HKCU "Software\Classes\MINIME.Menu.Video\shell\a01_vid-mp4" "MUIVerb" "MP4 · mesma resolução"
    WriteRegStr HKCU "Software\Classes\MINIME.Menu.Video\shell\a01_vid-mp4" "MultiSelectModel" "Player"
    WriteRegStr HKCU "Software\Classes\MINIME.Menu.Video\shell\a01_vid-mp4\command" "" '"$INSTDIR\MINIME.exe" --preset vid-mp4 "%1"'
    WriteRegStr HKCU "Software\Classes\MINIME.Menu.Video\shell\a02_vid-mp4-1080" "MUIVerb" "MP4 · até 1080p"
    WriteRegStr HKCU "Software\Classes\MINIME.Menu.Video\shell\a02_vid-mp4-1080" "MultiSelectModel" "Player"
    WriteRegStr HKCU "Software\Classes\MINIME.Menu.Video\shell\a02_vid-mp4-1080\command" "" '"$INSTDIR\MINIME.exe" --preset vid-mp4-1080 "%1"'
    WriteRegStr HKCU "Software\Classes\MINIME.Menu.Video\shell\a03_vid-mp4-720" "MUIVerb" "MP4 leve · 720p (WhatsApp)"
    WriteRegStr HKCU "Software\Classes\MINIME.Menu.Video\shell\a03_vid-mp4-720" "MultiSelectModel" "Player"
    WriteRegStr HKCU "Software\Classes\MINIME.Menu.Video\shell\a03_vid-mp4-720\command" "" '"$INSTDIR\MINIME.exe" --preset vid-mp4-720 "%1"'
    WriteRegStr HKCU "Software\Classes\MINIME.Menu.Video\shell\a04_vid-mp3" "MUIVerb" "Só o áudio (MP3)"
    WriteRegStr HKCU "Software\Classes\MINIME.Menu.Video\shell\a04_vid-mp3" "MultiSelectModel" "Player"
    WriteRegStr HKCU "Software\Classes\MINIME.Menu.Video\shell\a04_vid-mp3\command" "" '"$INSTDIR\MINIME.exe" --preset vid-mp3 "%1"'
    WriteRegStr HKCU "Software\Classes\MINIME.Menu.Video\shell\a05_vid-up" "MUIVerb" "Aumentar com IA · até 4K"
    WriteRegStr HKCU "Software\Classes\MINIME.Menu.Video\shell\a05_vid-up" "MultiSelectModel" "Player"
    WriteRegStr HKCU "Software\Classes\MINIME.Menu.Video\shell\a05_vid-up\command" "" '"$INSTDIR\MINIME.exe" --preset vid-up "%1"'
    WriteRegStr HKCU "Software\Classes\MINIME.Menu.Video\shell\y90_more" "MUIVerb" "Mais formatos"
    WriteRegStr HKCU "Software\Classes\MINIME.Menu.Video\shell\y90_more" "MultiSelectModel" "Player"
    WriteRegDWORD HKCU "Software\Classes\MINIME.Menu.Video\shell\y90_more" "CommandFlags" 32
    WriteRegStr HKCU "Software\Classes\MINIME.Menu.Video\shell\y90_more" "SubCommands" ""
    WriteRegStr HKCU "Software\Classes\MINIME.Menu.Video\shell\y90_more\shell\b01_same" "MUIVerb" "Comprimir (mesmo formato)"
    WriteRegStr HKCU "Software\Classes\MINIME.Menu.Video\shell\y90_more\shell\b01_same" "MultiSelectModel" "Player"
    WriteRegStr HKCU "Software\Classes\MINIME.Menu.Video\shell\y90_more\shell\b01_same\command" "" '"$INSTDIR\MINIME.exe" --quick same "%1"'
    WriteRegStr HKCU "Software\Classes\MINIME.Menu.Video\shell\y90_more\shell\b02_mp4" "MUIVerb" "MP4"
    WriteRegStr HKCU "Software\Classes\MINIME.Menu.Video\shell\y90_more\shell\b02_mp4" "MultiSelectModel" "Player"
    WriteRegStr HKCU "Software\Classes\MINIME.Menu.Video\shell\y90_more\shell\b02_mp4\command" "" '"$INSTDIR\MINIME.exe" --quick mp4 "%1"'
    WriteRegStr HKCU "Software\Classes\MINIME.Menu.Video\shell\y90_more\shell\b03_mkv" "MUIVerb" "MKV"
    WriteRegStr HKCU "Software\Classes\MINIME.Menu.Video\shell\y90_more\shell\b03_mkv" "MultiSelectModel" "Player"
    WriteRegStr HKCU "Software\Classes\MINIME.Menu.Video\shell\y90_more\shell\b03_mkv\command" "" '"$INSTDIR\MINIME.exe" --quick mkv "%1"'
    WriteRegStr HKCU "Software\Classes\MINIME.Menu.Video\shell\y90_more\shell\b04_mov" "MUIVerb" "MOV"
    WriteRegStr HKCU "Software\Classes\MINIME.Menu.Video\shell\y90_more\shell\b04_mov" "MultiSelectModel" "Player"
    WriteRegStr HKCU "Software\Classes\MINIME.Menu.Video\shell\y90_more\shell\b04_mov\command" "" '"$INSTDIR\MINIME.exe" --quick mov "%1"'
    WriteRegStr HKCU "Software\Classes\MINIME.Menu.Video\shell\y90_more\shell\b05_avi" "MUIVerb" "AVI"
    WriteRegStr HKCU "Software\Classes\MINIME.Menu.Video\shell\y90_more\shell\b05_avi" "MultiSelectModel" "Player"
    WriteRegStr HKCU "Software\Classes\MINIME.Menu.Video\shell\y90_more\shell\b05_avi\command" "" '"$INSTDIR\MINIME.exe" --quick avi "%1"'
    WriteRegStr HKCU "Software\Classes\MINIME.Menu.Video\shell\y90_more\shell\b06_webm" "MUIVerb" "WebM"
    WriteRegStr HKCU "Software\Classes\MINIME.Menu.Video\shell\y90_more\shell\b06_webm" "MultiSelectModel" "Player"
    WriteRegStr HKCU "Software\Classes\MINIME.Menu.Video\shell\y90_more\shell\b06_webm\command" "" '"$INSTDIR\MINIME.exe" --quick webm "%1"'
    WriteRegStr HKCU "Software\Classes\MINIME.Menu.Video\shell\y90_more\shell\b07_gif" "MUIVerb" "GIF animado"
    WriteRegStr HKCU "Software\Classes\MINIME.Menu.Video\shell\y90_more\shell\b07_gif" "MultiSelectModel" "Player"
    WriteRegStr HKCU "Software\Classes\MINIME.Menu.Video\shell\y90_more\shell\b07_gif\command" "" '"$INSTDIR\MINIME.exe" --quick gif "%1"'
    WriteRegStr HKCU "Software\Classes\MINIME.Menu.Video\shell\y90_more\shell\b08_mp3" "MUIVerb" "MP3 (só o áudio)"
    WriteRegStr HKCU "Software\Classes\MINIME.Menu.Video\shell\y90_more\shell\b08_mp3" "MultiSelectModel" "Player"
    WriteRegStr HKCU "Software\Classes\MINIME.Menu.Video\shell\y90_more\shell\b08_mp3\command" "" '"$INSTDIR\MINIME.exe" --quick mp3 "%1"'
    WriteRegStr HKCU "Software\Classes\MINIME.Menu.Video\shell\y90_more\shell\b09_m4a" "MUIVerb" "M4A (só o áudio)"
    WriteRegStr HKCU "Software\Classes\MINIME.Menu.Video\shell\y90_more\shell\b09_m4a" "MultiSelectModel" "Player"
    WriteRegStr HKCU "Software\Classes\MINIME.Menu.Video\shell\y90_more\shell\b09_m4a\command" "" '"$INSTDIR\MINIME.exe" --quick m4a "%1"'
    WriteRegStr HKCU "Software\Classes\MINIME.Menu.Video\shell\y90_more\shell\b10_wav" "MUIVerb" "WAV (só o áudio)"
    WriteRegStr HKCU "Software\Classes\MINIME.Menu.Video\shell\y90_more\shell\b10_wav" "MultiSelectModel" "Player"
    WriteRegStr HKCU "Software\Classes\MINIME.Menu.Video\shell\y90_more\shell\b10_wav\command" "" '"$INSTDIR\MINIME.exe" --quick wav "%1"'
    WriteRegStr HKCU "Software\Classes\MINIME.Menu.Video\shell\z99_open" "MUIVerb" "Abrir no MINIME…"
    WriteRegStr HKCU "Software\Classes\MINIME.Menu.Video\shell\z99_open" "MultiSelectModel" "Player"
    WriteRegStr HKCU "Software\Classes\MINIME.Menu.Video\shell\z99_open\command" "" '"$INSTDIR\MINIME.exe" --open "%1"'
    ; árvore MINIME.Menu.Audio
    DeleteRegKey HKCU "Software\Classes\MINIME.Menu.Audio"
    WriteRegStr HKCU "Software\Classes\MINIME.Menu.Audio\shell\a01_aud-mp3-192" "MUIVerb" "MP3 · 192 kbps"
    WriteRegStr HKCU "Software\Classes\MINIME.Menu.Audio\shell\a01_aud-mp3-192" "MultiSelectModel" "Player"
    WriteRegStr HKCU "Software\Classes\MINIME.Menu.Audio\shell\a01_aud-mp3-192\command" "" '"$INSTDIR\MINIME.exe" --preset aud-mp3-192 "%1"'
    WriteRegStr HKCU "Software\Classes\MINIME.Menu.Audio\shell\a02_aud-mp3-128" "MUIVerb" "MP3 · 128 kbps (menor)"
    WriteRegStr HKCU "Software\Classes\MINIME.Menu.Audio\shell\a02_aud-mp3-128" "MultiSelectModel" "Player"
    WriteRegStr HKCU "Software\Classes\MINIME.Menu.Audio\shell\a02_aud-mp3-128\command" "" '"$INSTDIR\MINIME.exe" --preset aud-mp3-128 "%1"'
    WriteRegStr HKCU "Software\Classes\MINIME.Menu.Audio\shell\a03_aud-m4a" "MUIVerb" "M4A · 192 kbps"
    WriteRegStr HKCU "Software\Classes\MINIME.Menu.Audio\shell\a03_aud-m4a" "MultiSelectModel" "Player"
    WriteRegStr HKCU "Software\Classes\MINIME.Menu.Audio\shell\a03_aud-m4a\command" "" '"$INSTDIR\MINIME.exe" --preset aud-m4a "%1"'
    WriteRegStr HKCU "Software\Classes\MINIME.Menu.Audio\shell\a04_aud-wav" "MUIVerb" "WAV sem perda"
    WriteRegStr HKCU "Software\Classes\MINIME.Menu.Audio\shell\a04_aud-wav" "MultiSelectModel" "Player"
    WriteRegStr HKCU "Software\Classes\MINIME.Menu.Audio\shell\a04_aud-wav\command" "" '"$INSTDIR\MINIME.exe" --preset aud-wav "%1"'
    WriteRegStr HKCU "Software\Classes\MINIME.Menu.Audio\shell\a05_aud-flac" "MUIVerb" "FLAC sem perda"
    WriteRegStr HKCU "Software\Classes\MINIME.Menu.Audio\shell\a05_aud-flac" "MultiSelectModel" "Player"
    WriteRegStr HKCU "Software\Classes\MINIME.Menu.Audio\shell\a05_aud-flac\command" "" '"$INSTDIR\MINIME.exe" --preset aud-flac "%1"'
    WriteRegStr HKCU "Software\Classes\MINIME.Menu.Audio\shell\y90_more" "MUIVerb" "Mais formatos"
    WriteRegStr HKCU "Software\Classes\MINIME.Menu.Audio\shell\y90_more" "MultiSelectModel" "Player"
    WriteRegDWORD HKCU "Software\Classes\MINIME.Menu.Audio\shell\y90_more" "CommandFlags" 32
    WriteRegStr HKCU "Software\Classes\MINIME.Menu.Audio\shell\y90_more" "SubCommands" ""
    WriteRegStr HKCU "Software\Classes\MINIME.Menu.Audio\shell\y90_more\shell\b01_same" "MUIVerb" "Comprimir (mesmo formato)"
    WriteRegStr HKCU "Software\Classes\MINIME.Menu.Audio\shell\y90_more\shell\b01_same" "MultiSelectModel" "Player"
    WriteRegStr HKCU "Software\Classes\MINIME.Menu.Audio\shell\y90_more\shell\b01_same\command" "" '"$INSTDIR\MINIME.exe" --quick same "%1"'
    WriteRegStr HKCU "Software\Classes\MINIME.Menu.Audio\shell\y90_more\shell\b02_mp3" "MUIVerb" "MP3"
    WriteRegStr HKCU "Software\Classes\MINIME.Menu.Audio\shell\y90_more\shell\b02_mp3" "MultiSelectModel" "Player"
    WriteRegStr HKCU "Software\Classes\MINIME.Menu.Audio\shell\y90_more\shell\b02_mp3\command" "" '"$INSTDIR\MINIME.exe" --quick mp3 "%1"'
    WriteRegStr HKCU "Software\Classes\MINIME.Menu.Audio\shell\y90_more\shell\b03_m4a" "MUIVerb" "M4A"
    WriteRegStr HKCU "Software\Classes\MINIME.Menu.Audio\shell\y90_more\shell\b03_m4a" "MultiSelectModel" "Player"
    WriteRegStr HKCU "Software\Classes\MINIME.Menu.Audio\shell\y90_more\shell\b03_m4a\command" "" '"$INSTDIR\MINIME.exe" --quick m4a "%1"'
    WriteRegStr HKCU "Software\Classes\MINIME.Menu.Audio\shell\y90_more\shell\b04_wav" "MUIVerb" "WAV"
    WriteRegStr HKCU "Software\Classes\MINIME.Menu.Audio\shell\y90_more\shell\b04_wav" "MultiSelectModel" "Player"
    WriteRegStr HKCU "Software\Classes\MINIME.Menu.Audio\shell\y90_more\shell\b04_wav\command" "" '"$INSTDIR\MINIME.exe" --quick wav "%1"'
    WriteRegStr HKCU "Software\Classes\MINIME.Menu.Audio\shell\y90_more\shell\b05_flac" "MUIVerb" "FLAC"
    WriteRegStr HKCU "Software\Classes\MINIME.Menu.Audio\shell\y90_more\shell\b05_flac" "MultiSelectModel" "Player"
    WriteRegStr HKCU "Software\Classes\MINIME.Menu.Audio\shell\y90_more\shell\b05_flac\command" "" '"$INSTDIR\MINIME.exe" --quick flac "%1"'
    WriteRegStr HKCU "Software\Classes\MINIME.Menu.Audio\shell\y90_more\shell\b06_ogg" "MUIVerb" "OGG"
    WriteRegStr HKCU "Software\Classes\MINIME.Menu.Audio\shell\y90_more\shell\b06_ogg" "MultiSelectModel" "Player"
    WriteRegStr HKCU "Software\Classes\MINIME.Menu.Audio\shell\y90_more\shell\b06_ogg\command" "" '"$INSTDIR\MINIME.exe" --quick ogg "%1"'
    WriteRegStr HKCU "Software\Classes\MINIME.Menu.Audio\shell\y90_more\shell\b07_opus" "MUIVerb" "Opus"
    WriteRegStr HKCU "Software\Classes\MINIME.Menu.Audio\shell\y90_more\shell\b07_opus" "MultiSelectModel" "Player"
    WriteRegStr HKCU "Software\Classes\MINIME.Menu.Audio\shell\y90_more\shell\b07_opus\command" "" '"$INSTDIR\MINIME.exe" --quick opus "%1"'
    WriteRegStr HKCU "Software\Classes\MINIME.Menu.Audio\shell\y90_more\shell\b08_mp4" "MUIVerb" "MP4 (vídeo com onda sonora)"
    WriteRegStr HKCU "Software\Classes\MINIME.Menu.Audio\shell\y90_more\shell\b08_mp4" "MultiSelectModel" "Player"
    WriteRegStr HKCU "Software\Classes\MINIME.Menu.Audio\shell\y90_more\shell\b08_mp4\command" "" '"$INSTDIR\MINIME.exe" --quick mp4 "%1"'
    WriteRegStr HKCU "Software\Classes\MINIME.Menu.Audio\shell\z99_open" "MUIVerb" "Abrir no MINIME…"
    WriteRegStr HKCU "Software\Classes\MINIME.Menu.Audio\shell\z99_open" "MultiSelectModel" "Player"
    WriteRegStr HKCU "Software\Classes\MINIME.Menu.Audio\shell\z99_open\command" "" '"$INSTDIR\MINIME.exe" --open "%1"'
  ${EndIf}
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
  DeleteRegKey HKCU "Software\Classes\SystemFileAssociations\.heic\shell\MINIME"
  DeleteRegKey HKCU "Software\Classes\SystemFileAssociations\.heif\shell\MINIME"
  DeleteRegKey HKCU "Software\Classes\SystemFileAssociations\.hif\shell\MINIME"
  DeleteRegKey HKCU "Software\Classes\SystemFileAssociations\.jxl\shell\MINIME"
  DeleteRegKey HKCU "Software\Classes\SystemFileAssociations\.psd\shell\MINIME"
  DeleteRegKey HKCU "Software\Classes\SystemFileAssociations\.cr2\shell\MINIME"
  DeleteRegKey HKCU "Software\Classes\SystemFileAssociations\.cr3\shell\MINIME"
  DeleteRegKey HKCU "Software\Classes\SystemFileAssociations\.crw\shell\MINIME"
  DeleteRegKey HKCU "Software\Classes\SystemFileAssociations\.nef\shell\MINIME"
  DeleteRegKey HKCU "Software\Classes\SystemFileAssociations\.nrw\shell\MINIME"
  DeleteRegKey HKCU "Software\Classes\SystemFileAssociations\.arw\shell\MINIME"
  DeleteRegKey HKCU "Software\Classes\SystemFileAssociations\.srf\shell\MINIME"
  DeleteRegKey HKCU "Software\Classes\SystemFileAssociations\.sr2\shell\MINIME"
  DeleteRegKey HKCU "Software\Classes\SystemFileAssociations\.dng\shell\MINIME"
  DeleteRegKey HKCU "Software\Classes\SystemFileAssociations\.raf\shell\MINIME"
  DeleteRegKey HKCU "Software\Classes\SystemFileAssociations\.orf\shell\MINIME"
  DeleteRegKey HKCU "Software\Classes\SystemFileAssociations\.rw2\shell\MINIME"
  DeleteRegKey HKCU "Software\Classes\SystemFileAssociations\.pef\shell\MINIME"
  DeleteRegKey HKCU "Software\Classes\SystemFileAssociations\.srw\shell\MINIME"
  DeleteRegKey HKCU "Software\Classes\SystemFileAssociations\.3fr\shell\MINIME"
  DeleteRegKey HKCU "Software\Classes\SystemFileAssociations\.iiq\shell\MINIME"
  DeleteRegKey HKCU "Software\Classes\SystemFileAssociations\.erf\shell\MINIME"
  DeleteRegKey HKCU "Software\Classes\SystemFileAssociations\.mef\shell\MINIME"
  DeleteRegKey HKCU "Software\Classes\SystemFileAssociations\.mos\shell\MINIME"
  DeleteRegKey HKCU "Software\Classes\SystemFileAssociations\.kdc\shell\MINIME"
  DeleteRegKey HKCU "Software\Classes\SystemFileAssociations\.dcr\shell\MINIME"
  DeleteRegKey HKCU "Software\Classes\SystemFileAssociations\.x3f\shell\MINIME"
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
  DeleteRegKey HKCU "Software\Classes\MINIME.Menu.Image"
  DeleteRegKey HKCU "Software\Classes\MINIME.Menu.ImageGif"
  DeleteRegKey HKCU "Software\Classes\MINIME.Menu.Video"
  DeleteRegKey HKCU "Software\Classes\MINIME.Menu.Audio"
  ; Desinstalação de verdade (não a troca de versão): remove início automático e preferências
  ${IfNot} ${isUpdated}
    DeleteRegValue HKCU "Software\Microsoft\Windows\CurrentVersion\Run" "MINIME"
    DeleteRegKey HKCU "Software\MINIME"
  ${EndIf}
  System::Call 'shell32::SHChangeNotify(i 0x08000000, i 0, p 0, p 0)'
!macroend
