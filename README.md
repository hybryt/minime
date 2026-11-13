# MINIME

Converte e encolhe imagens, vídeos e áudios no Windows. Arrasta, escolhe o formato, vê o tamanho final antes de converter.

Criado por [Alan Moreira](https://alanmore.com.br).

```
┌──────────────┐     ┌────────────────────┐     ┌─────────────────────┐     ┌──────────────┐
│ 📂 Arrasta   │ ──▶ │ ⚙️ Escolhe formato │ ──▶ │ 📏 Vê o tamanho     │ ──▶ │ ✅ Converter │
│ arquivos ou  │     │ por arquivo ou     │     │ final mudar ao vivo │     │ mesma pasta  │
│ pastas       │     │ "converter todos"  │     │ enquanto mexe na    │     │ ou outra     │
└──────────────┘     └────────────────────┘     │ qualidade           │     └──────────────┘
                                                └─────────────────────┘
        ou: botão direito no arquivo ▶ Converter com MINIME ▶ WebP  (janela rápida)
```

## O que ele faz

| Tipo | Lê | Converte pra |
|---|---|---|
| 🟨 Imagem | JPG, PNG, WebP, AVIF, TIFF, GIF, BMP, ICO, SVG | JPG, PNG, WebP, AVIF, TIFF, GIF, BMP, ICO (GIF animado também vira MP4) |
| 🟥 Vídeo | MP4, MKV, MOV, AVI, WebM, WMV, FLV, MPG, TS, MTS, 3GP | MP4, MKV, MOV, AVI, WebM, GIF animado, e só o áudio em MP3, WAV ou M4A |
| 🟦 Áudio | MP3, WAV, M4A, AAC, FLAC, OGG, Opus, WMA, AIFF | MP3, M4A, WAV, FLAC, OGG, Opus, e MP4 (vídeo com onda sonora ou capa) |

Escolher o mesmo formato da origem só comprime (ex.: JPG pesado vira JPG leve).

### Ajustes, do jeito curto

```
🟨 Imagem
├── Objetivo: Sem perda │ Equilibrado │ Pra web
├── Qualidade 0 a 100% (o tamanho final é calculado codificando a imagem de verdade)
├── Tamanho máximo: Original, 3840, 2560, 1920, 1280 ou 800 px (lado maior)
└── Remover dados ocultos (EXIF, GPS, modelo da câmera)

🟥 Vídeo
├── Objetivo: Sem perda (só troca a embalagem, ex.: MKV pra MP4) │ Equilibrado │ Menor
├── Qualidade 0 a 100% ▶ vira Mbps, mostrado ao lado
├── Resolução: Original, 4K, 1440p, 1080p, 720p, 480p (nunca aumenta)
├── Codec: H.264 (abre em tudo) ou H.265 (uns 35% menor)
└── Motor: Automático │ Placa de vídeo │ Processador

🟦 Áudio
├── Qualidade 0 a 100% ▶ vira kbps (nunca passa do bitrate do original)
└── Áudio pra MP4: fundo com onda sonora, capa do álbum ou preto
```

### CPU ou GPU

Na primeira abertura o MINIME testa os encoders de vídeo da máquina (NVIDIA NVENC, AMD AMF, Intel Quick Sync) e guarda o resultado. No modo **Automático**, H.264 e H.265 vão pra placa de vídeo quando ela funciona; WebM, AVI e GIF ficam no processador (não têm encoder de GPU comum). Imagens usam o processador com libvips, que já é multinúcleo.

## Instalação

1. Rode `MINIME-Setup-1.1.0.exe`. Não pede administrador (instala só pro seu usuário).
2. O Windows pode mostrar "O Windows protegeu o computador", porque o instalador não tem assinatura digital paga. Clique em **Mais informações** e **Executar assim mesmo**.
3. Pronto: atalho na área de trabalho, no menu Iniciar e o item **Converter com MINIME** no botão direito.

> No Windows 11 o item aparece em **Mostrar mais opções** (ou com Shift + F10), junto dos menus clássicos. Dá pra ligar e desligar o menu pelo ícone de ajustes, na barra de cima do app.

Pra desinstalar: Configurações ▶ Aplicativos ▶ MINIME ▶ Desinstalar. O menu do botão direito sai junto.

## Rodar e compilar a partir do código

Precisa de Node.js 20 ou mais novo.

```bash
npm install
```

```bash
npm run fetch-ffmpeg
```

```bash
npm start
```

Pra gerar o instalador em `dist/`:

```bash
npm run build
```

O `fetch-ffmpeg` baixa o build GPL "shared" do FFmpeg ([BtbN/FFmpeg-Builds](https://github.com/BtbN/FFmpeg-Builds)) pra `vendor/ffmpeg`. Os binários não ficam no repositório.

Teste do motor sem interface (gera arquivos de exemplo, estima, converte e compara estimativa com o tamanho real):

```bash
npm run test:engine
```

## Como o código está organizado

```
src/
├── main/
│   ├── main.js          janelas, instância única (junta vários arquivos do botão direito), IPC
│   ├── preload.js       ponte segura entre a tela e o motor
│   ├── shell.js         especificação do menu do botão direito (registro do Windows)
│   └── engine/
│       ├── formats.js   o que lê, pra onde converte, rótulos e dicas
│       ├── image.js     sharp/libvips: JPG (mozjpeg), PNG (redução de cores), WebP, AVIF, TIFF, GIF, BMP, ICO
│       ├── av.js        FFmpeg: argumentos, estimativa de tamanho, escolha CPU/GPU
│       ├── ffmpeg.js    execução, progresso, ffprobe, miniaturas
│       ├── hardware.js  detecção e teste dos encoders de GPU
│       └── jobs.js      lista, estimativa em lote, fila de conversão, nomes sem sobrescrever
└── renderer/            interface Liquid Glass (HTML, CSS e JS puros)
scripts/
├── fetch-ffmpeg.mjs     baixa o FFmpeg
├── make-icon.mjs        gera o ícone
├── gen-nsis.mjs         gera o build/installer.nsh a partir do shell.js
└── test-engine.mjs      teste do motor
```

O arquivo original nunca é sobrescrito: se `foto.webp` já existe, sai `foto (1).webp`.

## Visual

Linguagem inspirada no Liquid Glass da Apple (macOS Tahoe e iOS 26), adaptada pro Windows 11.

```
🔮 Duas camadas
├── Conteúdo ..... lista de arquivos e papel de parede suave (com grão)
└── Vidro ........ barra de cima, painel de ajustes, barra de ação, menus e avisos
     └── a lista rola por baixo do vidro, e um filtro SVG entorta e separa as cores
         do que passa atrás (mesma técnica do GlassSurface do React Bits)
```

| Papel | Claro | Escuro |
|---|---|---|
| Fundo | `#EEF0F5` | `#0E1016` |
| Texto | `#1D1D1F` | `#F5F5F7` |
| Destaque (botão Converter, seleção) | `#007AFF` | `#0A84FF` |
| Imagem | `#FF9500` | `#FF9F0A` |
| Vídeo | `#FF2D55` | `#FF375F` |
| Áudio | `#AF52DE` | `#BF5AF2` |
| Economia | `#34C759` | `#30D158` |

- Aparência: **Sistema**, **Claro** ou **Escuro**, no ícone de ajustes da barra de cima. A troca tem transição suave e fica salva.
- Tipografia: Geist (desenho próximo ao SF da Apple, licença livre), com números tabulares no medidor.
- O medidor segue o estilo "Armazenamento" do iPhone: barra dividida por tipo de arquivo e o que sobra é a economia.
- Respeita "Efeitos de transparência" desligado (vidro vira superfície sólida) e "Mostrar animações" desligado.

## Licenças

- Código do MINIME: MIT (veja `LICENSE`).
- FFmpeg: GPL v3, distribuído como binário separado em `resources/ffmpeg`. Código-fonte em [ffmpeg.org](https://ffmpeg.org) e [BtbN/FFmpeg-Builds](https://github.com/BtbN/FFmpeg-Builds).
- sharp (Apache 2.0) com libvips (LGPL 3.0).
- Geist: SIL Open Font License 1.1.
- Electron: MIT.
