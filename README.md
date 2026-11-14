# MINIME

Converte, encolhe e **aumenta com IA** imagens, vídeos e áudios no **Windows** e no **Mac**. Arrasta, escolhe o formato, vê o tamanho final antes de converter.

Criado por [Alan Moreira](https://alanmore.com.br).

```
┌──────────────┐     ┌────────────────────┐     ┌─────────────────────┐     ┌──────────────┐
│ 📂 Arrasta   │ ──▶ │ ⚙️ Escolhe formato │ ──▶ │ 📏 Vê o tamanho     │ ──▶ │ ✅ Converter │
│ arquivos ou  │     │ por arquivo ou     │     │ final mudar ao vivo │     │ mesma pasta  │
│ pastas       │     │ "converter todos"  │     │ enquanto mexe na    │     │ ou outra     │
└──────────────┘     └────────────────────┘     │ qualidade           │     └──────────────┘
                                                └─────────────────────┘
  Windows: botão direito ▶ Converter com MINIME ▶ JPG 80% · mesma resolução  (converte sozinho)
  Mac:     botão direito ▶ Ações Rápidas ▶ MINIME: JPG 80% · mesma resolução
```

## O que ele faz

| Tipo | Lê | Converte pra |
|---|---|---|
| 🟨 Imagem | JPG, PNG, HEIC (iPhone), RAW de câmera, WebP, AVIF, TIFF, GIF, PSD, JPEG XL, BMP, ICO, SVG | JPG, PNG, WebP, AVIF, TIFF, GIF, BMP, ICO (GIF animado também vira MP4) |
| 🟥 Vídeo | MP4, MKV, MOV, AVI, WebM, WMV, FLV, MPG, TS, MTS, 3GP | MP4, MKV, MOV, AVI, WebM, GIF animado, e só o áudio em MP3, WAV ou M4A |
| 🟦 Áudio | MP3, WAV, M4A, AAC, FLAC, OGG, Opus, WMA, AIFF | MP3, M4A, WAV, FLAC, OGG, Opus, e MP4 (vídeo com onda sonora ou capa) |

Escolher o mesmo formato da origem só comprime (ex.: JPG pesado vira JPG leve).

RAW de câmera (Canon CR2/CR3/CRW, Nikon NEF, Sony ARW, Fujifilm RAF, Olympus ORF, Panasonic RW2, Pentax PEF, DNG, Sigma X3F e outros): o MINIME usa a foto JPEG que a câmera grava dentro do arquivo. Canon, Nikon e Pentax guardam em tamanho cheio; Sony, Panasonic e DNG de celular guardam uma versão menor (a Sony, 1616 × 1080), e a lista mostra "foto da câmera" ao lado do tamanho.

### Ajustes, do jeito curto

```
🟨 Imagem
├── Objetivo: Sem perda │ Equilibrado │ Pra web
├── Qualidade 0 a 100% (o tamanho final é calculado codificando a imagem de verdade)
├── ✨ Aumentar com IA: Desligado │ Padrão │ Máxima, e tamanho final: Até 4K │ 2 vezes
├── Tamanho máximo: Original, 75%, 50%, 25%, 3840, 2560, 1920, 1280 ou 800 px
└── Remover dados ocultos (EXIF, GPS, modelo da câmera)

🟥 Vídeo
├── Objetivo: Sem perda (só troca a embalagem, ex.: MKV pra MP4) │ Equilibrado │ Menor
├── Qualidade 0 a 100% ▶ vira Mbps, mostrado ao lado
├── ✨ Aumentar com IA (até 4K, quadro a quadro)
├── Resolução: Original, 4K, 1440p, 1080p, 720p, 480p (sem IA, nunca aumenta)
├── Codec: H.264 (abre em tudo) ou H.265 (uns 35% menor)
└── Motor: Automático │ Placa de vídeo │ Processador

🟦 Áudio
├── Qualidade 0 a 100% ▶ vira kbps (nunca passa do bitrate do original)
└── Áudio pra MP4: fundo com onda sonora, capa do álbum ou preto
```

### ✨ Aumentar com IA

Roda inteiro no computador, sem internet e sem conta. O arquivo ampliado ganha " (4K)" no nome e nunca substitui o original.

```
📷 Foto (até 4K)
├── Padrão ──▶ Real-ESRGAN x4plus na placa de vídeo (Vulkan)
│              uns 4 s por foto de 960 × 540 numa RX 9060 XT; limpa compressão de foto da internet
└── Máxima ──▶ UltraSharp V2 pelo ONNX Runtime (DirectML no Windows, CoreML no Mac com Apple Silicon)
               uns 17 a 20 s por foto; mais textura de pele, cabelo e tecido
🎬 Vídeo (até 4K) ─▶ Real-ESRGAN compacto (realesr-general-x4v3), quadro a quadro, em lotes
                     uns 6 quadros por segundo em 540p numa RX 9060 XT; o tempo que falta aparece na tela
```

- Foto ou vídeo que já está em 4K converte normal, sem aumentar.
- Várias fotos no modo padrão vão num lote só (o motor abre uma vez, uns 3 s a menos por foto).
- O tamanho final mostrado antes de converter é uma estimativa (com "~"): a IA cria textura, e textura pesa.
- Mac com processador Intel não tem a qualidade máxima (o ONNX Runtime não tem versão pra ele); o padrão e o vídeo funcionam.
- Placa de vídeo sem Vulkan (driver muito antigo ou máquina virtual): o app avisa e a IA fica desligada.

### Atalhos de 1 clique (botão direito)

```
Windows ─▶ botão direito no arquivo ▶ Converter com MINIME ▸
              JPG 80% · mesma resolução         ┐
              JPG 80% · 75% da resolução        │ 5 atalhos do tipo do arquivo
              JPG 80% · metade da resolução     │ (imagem, vídeo ou áudio):
              WebP 80% · mesma resolução        │ convertem sozinhos, sem abrir o app
              Aumentar com IA · até 4K          ┘
              ──────────
              Mais formatos ▸  (janela rápida pra ajustar antes)
              Abrir no MINIME…
Mac ──────▶ botão direito no arquivo ▶ Ações Rápidas ▶ MINIME: …  (os mesmos atalhos)
```

- Dá pra escolher até 6 atalhos por tipo em **Ajustes ▶ Atalhos de 1 clique**. O instalador respeita a escolha e o menu desligado numa atualização.
- Seleção misturada (fotos e vídeos juntos): o atalho converte só os arquivos do tipo dele e avisa quantos ficaram de fora.
- No Windows 11 o menu fica em **Mostrar mais opções**. O menu novo do Windows 11 (o primeiro, sem "Mostrar mais opções") só aceita apps com assinatura digital paga.
- No Mac, as Ações Rápidas são criadas na primeira abertura com o app na pasta Aplicativos. Se algum item não aparecer: botão direito ▶ Ações Rápidas ▶ Personalizar…
- Antes de apagar o MINIME do Mac, desligue as Ações Rápidas em **Ajustes**. Se já apagou, os itens ficam em `~/Library/Services` com o nome `MINIME - …workflow` e podem ir pro lixo.

### Desempenho: o MINIME se ajusta à máquina

Na primeira abertura ele mede o computador e guarda o resultado (refaz só se a placa de vídeo ou o FFmpeg mudarem).

```
🖥️ Detecta
├── Sistema e arquitetura ─▶ Windows x64, Mac Apple Silicon (arm64) ou Mac Intel (x64), todos nativos
├── Processador ───────────▶ núcleos e memória ─▶ quantas conversões rodam juntas
└── Placa de vídeo ────────▶ testa de verdade, codificando e decodificando um trecho
     ├── NVIDIA (NVENC), AMD (AMF), Intel (Quick Sync) no Windows
     └── VideoToolbox (Apple) no Mac

⚙️ Usa
├── H.264 e H.265 na GPU; WebM, AVI e GIF no processador
├── Decodificação na GPU só onde compensa (medido num Ryzen 7 7800X3D):
│    HEVC 4K ficou 42% mais rápido na GPU; H.264 4K ficou mais rápido no processador
│    ─▶ processador com 8+ núcleos: GPU decodifica HEVC, AV1 e VP9
│    ─▶ processador mais fraco: GPU decodifica tudo
├── 2 vídeos por vez na GPU (1 no processador, que já usa todos os núcleos)
└── Imagens e áudios em paralelo: 1 a cada 3 núcleos (de 2 a 8)
```

Se a GPU não conseguir ler algum arquivo, o MINIME tenta de novo sozinho decodificando no processador.

### Não fica nada rodando escondido

Fechou a janela, o MINIME cancela o que estava convertendo, encerra todo processo do FFmpeg, apaga os arquivos que ficaram pela metade e sai. Não existe processo em segundo plano pra "abrir mais rápido". A procura por atualização só acontece com o app aberto.

## Instalação

### Windows

1. Rode `MINIME-Setup-1.3.0.exe`. Não pede administrador (instala só pro seu usuário).
2. O Windows pode mostrar "O Windows protegeu o computador", porque o instalador não tem assinatura digital paga. Clique em **Mais informações** e **Executar assim mesmo**.
3. Na tela **Preferências** do instalador, escolha se o MINIME deve se atualizar sozinho e se abre junto com o Windows.
4. Pronto: atalho na área de trabalho, no menu Iniciar e o item **Converter com MINIME** no botão direito.

> No Windows 11 o item aparece em **Mostrar mais opções** (ou com Shift + F10), junto dos menus clássicos. Dá pra ligar e desligar o menu pelo ícone de ajustes, na barra de cima do app.

Pra desinstalar: Configurações ▶ Aplicativos ▶ MINIME ▶ Desinstalar. O menu do botão direito e o início automático saem juntos.

### Testar sem instalar

```
Atalho "Testar MINIME (sem instalar)" ─▶ roda o código desta pasta, abre em ~2 s, mostra o selo "Teste"
MINIME-Portatil-<versão>.exe ──────────▶ o app de verdade num arquivo só, abre em ~11 s (descompacta a cada vez)
dist/win-unpacked/MINIME.exe ──────────▶ o app empacotado já descompactado, abre em 1,5 s (sai do npm run build)
```

Nenhum dos três entra em Programas, cria atalho ou mexe no registro. O portátil apaga a pasta temporária ao fechar. Feche a cópia instalada antes de abrir uma de teste: as duas usam as mesmas preferências e só uma janela do MINIME roda por vez.

No Mac dá pra testar abrindo o MINIME direto de dentro do DMG, sem arrastar pra Aplicativos.

### Mac

1. Baixe o DMG certo na página [Releases](https://github.com/hybryt/minime/releases/latest):
   - `MINIME-1.3.0-mac-arm64.dmg` pra Mac com chip Apple (M1, M2, M3, M4)
   - `MINIME-1.3.0-mac-x64.dmg` pra Mac com processador Intel
2. Abra o DMG e arraste o MINIME pra pasta **Aplicativos**.
3. Na primeira vez o Mac avisa que não consegue verificar o desenvolvedor (o app não tem assinatura paga da Apple). Abra **Ajustes do Sistema ▶ Privacidade e Segurança**, desça até o aviso do MINIME e clique em **Abrir Mesmo Assim**. Só precisa fazer isso uma vez.
   - Alternativa pelo Terminal: `xattr -dr com.apple.quarantine /Applications/MINIME.app`
4. Na tela de boas-vindas, escolha se quer atualização automática e se o MINIME abre junto com o Mac.

No Finder: botão direito no arquivo ▶ **Ações Rápidas** ▶ **MINIME: …** (atalhos de 1 clique), **Abrir com** ▶ **MINIME**, ou arraste arquivos até o ícone no Dock. Abra o MINIME pela pasta Aplicativos pelo menos uma vez pra ele criar as Ações Rápidas.

### Atualização automática

```
App abre com internet ──▶ procura versão nova no GitHub Releases ──┬─▶ Windows: baixa e instala quando você fecha
     (e a cada 6 h enquanto aberto)                                 │    (ou clique em "Reiniciar agora")
                                                                    └─▶ Mac: avisa e abre a página pra baixar o DMG
```

Liga e desliga em **Ajustes ▶ Atualizar automaticamente**. No Mac a instalação é manual porque a Apple só deixa um app se substituir sozinho quando ele tem assinatura paga (Developer ID).

## Rodar e compilar a partir do código

Precisa de Node.js 20 ou mais novo. O instalador do Windows sai no Windows e o do Mac sai num Mac (ou pelo GitHub Actions, abaixo).

```bash
npm install
```

```bash
npm run fetch-ffmpeg
```

```bash
npm run fetch-upscale
```

```bash
npm start
```

Pra gerar o instalador do Windows em `dist/`:

```bash
npm run build
```

Num Mac, o instalador do Mac (Apple Silicon e Intel):

```bash
npm run fetch-ffmpeg -- --mac
```

```bash
npm run fetch-upscale -- --mac
```

```bash
npm run build:mac
```

O `fetch-ffmpeg` baixa o FFmpeg de cada sistema pra `vendor/ffmpeg-<sistema>-<arquitetura>`: no Windows o build GPL "shared" do [BtbN](https://github.com/BtbN/FFmpeg-Builds), no Mac o build estático do [Martin Riedl](https://ffmpeg.martin-riedl.de/) (com VideoToolbox). Os binários não ficam no repositório.

O `fetch-upscale` baixa o motor de IA pra `vendor/upscale-<sistema>-<arquitetura>` e os modelos pra `vendor/upscale-models`, conferindo o sha256 de cada arquivo (`scripts/upscale-hashes.json`): o realesrgan-ncnn-vulkan oficial (com o modelo x4plus), o UltraSharp V2 e o `realesr-general-x4v3.pth` oficial, que o `scripts/convert-compact.mjs` converte pro formato ncnn (mesmo método da conversão oficial do modelo de anime, conferida byte a byte).

### Publicar uma versão nova

```
mudar "version" no package.json ──▶ commit ──▶ tag v1.2.1 ──▶ git push --tags
                                                                     │
        GitHub Actions (.github/workflows/release.yml) ◀─────────────┘
        ├── máquina Windows ─▶ MINIME-Setup-1.2.1.exe + latest.yml
        ├── máquina Mac ─────▶ DMG e ZIP arm64 e x64 + latest-mac.yml (assinatura ad-hoc conferida)
        └── publica a Release ─▶ os apps instalados encontram a versão nova sozinhos
```

```bash
git tag v1.2.1
```

```bash
git push origin v1.2.1
```

Teste do motor sem interface (gera arquivos de exemplo, estima, converte e compara estimativa com o tamanho real):

```bash
npm run test:engine
```

Teste do Aumentar com IA (foto padrão em lote, qualidade máxima, foto já em 4K e vídeo):

```bash
npm run test:ai
```

## Como o código está organizado

```
src/
├── main/
│   ├── main.js          janelas, instância única (junta vários arquivos do botão direito), IPC
│   ├── preload.js       ponte segura entre a tela e o motor
│   ├── presets.js       atalhos de 1 clique (fonte única do menu do Windows e das Ações Rápidas)
│   ├── shell.js         menu do botão direito no registro do Windows (árvores por tipo)
│   ├── mac-services.js  Ações Rápidas do Finder (gera os .workflow em ~/Library/Services)
│   ├── updater.js       atualização pelo GitHub Releases (só com o app aberto)
│   └── engine/
│       ├── formats.js   o que lê, pra onde converte, rótulos e dicas
│       ├── decode.js    HEIC, JPEG XL, PSD, BMP, ICO e RAW viram imagem que o sharp lê (cache temporário)
│       ├── raw.js       acha a foto JPEG que a câmera grava dentro do RAW
│       ├── image.js     sharp/libvips: JPG (mozjpeg), PNG (redução de cores), WebP, AVIF, TIFF, GIF, BMP, ICO
│       ├── upscale.js   Aumentar com IA: Real-ESRGAN (ncnn) e UltraSharp V2 (ONNX Runtime)
│       ├── upscale-worker.js  processo separado da qualidade máxima
│       ├── upscale-video.js   vídeo até 4K: decodifica, amplia em lotes e recodifica
│       ├── av.js        FFmpeg: argumentos, estimativa de tamanho, escolha CPU/GPU
│       ├── ffmpeg.js    execução, progresso, ffprobe, miniaturas
│       ├── hardware.js  sistema, núcleos, memória e teste real de encoder e decoder de GPU
│       └── jobs.js      lista, estimativa em lote, fila de conversão, nomes sem sobrescrever
└── renderer/            interface Liquid Glass (HTML, CSS e JS puros)
scripts/
├── fetch-ffmpeg.mjs     baixa o FFmpeg
├── fetch-upscale.mjs    baixa o motor e os modelos de IA (com sha256)
├── convert-compact.mjs  converte o Real-ESRGAN compacto do PyTorch pro ncnn
├── make-icon.mjs        gera o ícone
├── gen-nsis.mjs         gera o build/installer.nsh (menu do botão direito e tela Preferências)
├── after-pack.cjs       no Mac, tira o que não roda na arquitetura de cada DMG
├── test-engine.mjs      teste do motor
└── test-ai.mjs          teste do Aumentar com IA
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
- FFmpeg: GPL v3, distribuído como binário separado em `resources/ffmpeg`. Código-fonte em [ffmpeg.org](https://ffmpeg.org), [BtbN/FFmpeg-Builds](https://github.com/BtbN/FFmpeg-Builds) e [ffmpeg.martin-riedl.de](https://ffmpeg.martin-riedl.de/).
- electron-updater: MIT.
- sharp (Apache 2.0) com libvips (LGPL 3.0).
- Geist: SIL Open Font License 1.1.
- Electron: MIT.
- ONNX Runtime: MIT.
- [Real-ESRGAN](https://github.com/xinntao/Real-ESRGAN) (modelos x4plus e realesr-general-x4v3), de Xintao Wang e equipe: BSD-3-Clause. Motor [realesrgan-ncnn-vulkan](https://github.com/xinntao/Real-ESRGAN-ncnn-vulkan) (MIT) sobre o [ncnn](https://github.com/Tencent/ncnn) da Tencent (BSD-3-Clause).
- [UltraSharp V2](https://huggingface.co/Kim2091/UltraSharpV2), de Kim2091: CC BY-NC-SA 4.0 (uso não comercial). O MINIME é gratuito e aberto; quem for usar o app pra fins comerciais deve ficar no modo padrão. A lista completa vai junto em `resources/upscale/models/LICENSES.txt`.
