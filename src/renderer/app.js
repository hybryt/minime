/* MINIME: interface Liquid Glass. Dois modos: janela completa (main) e janela rápida (quick, do botão direito). */
(() => {
  'use strict';

  const api = window.minime;
  const MODE = new URLSearchParams(location.search).get('mode') === 'quick' ? 'quick' : 'main';
  document.documentElement.dataset.mode = MODE;
  document.documentElement.dataset.platform = api.platform || 'win32';
  const IS_MAC = api.platform === 'darwin';

  const app = document.getElementById('app');
  const popover = document.getElementById('popover');
  const toastEl = document.getElementById('toast');
  const dropEl = document.getElementById('dropzone');
  const reduceMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---------- Formatação ----------

  const nf0 = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 });
  const nf1 = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  function fmtBytes(b) {
    if (b === null || b === undefined || Number.isNaN(b)) return '–';
    const u = ['B', 'KB', 'MB', 'GB', 'TB'];
    let v = b, i = 0;
    while (v >= 1024 && i < u.length - 1) { v /= 1024; i++; }
    return `${i === 0 || v >= 100 ? nf0.format(v) : nf1.format(v)} ${u[i]}`;
  }
  function delta(before, after) {
    if (!before || after === null || after === undefined) return null;
    const p = Math.round(((after - before) / before) * 100);
    if (p === 0) return { text: 'igual', cls: 'same' };
    return p < 0 ? { text: `−${Math.abs(p)}%`, cls: 'down' } : { text: `+${nf0.format(p)}%`, cls: 'up' };
  }
  const plural = (n, one, many) => `${nf0.format(n)} ${n === 1 ? one : many}`;

  // ---------- Ícones (traço fino, pontas redondas) ----------

  const svg = (d, vb = 20, sw = 1.7) => `<svg viewBox="0 0 ${vb} ${vb}" fill="none" stroke="currentColor" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
  const I = {
    updown: svg('<path d="M4 6l4-3.5L12 6M4 10l4 3.5 4-3.5"/>', 16, 1.6),
    plus: svg('<path d="M10 4v12M4 10h12"/>'),
    trash: svg('<path d="M4.5 6h11M8 6V4.5h4V6M6 6l.7 9.5h6.6L14 6"/>'),
    sliders: svg('<path d="M3.5 6.5h7M14.5 6.5h2M3.5 13.5h2M9.5 13.5h7"/><circle cx="12.5" cy="6.5" r="2"/><circle cx="7.5" cy="13.5" r="2"/>'),
    x: svg('<path d="M5 5l10 10M15 5L5 15"/>', 20, 2),
    check: svg('<path d="M4.5 10.5l3.5 3.5 7.5-8"/>', 20, 2.4),
    bang: svg('<path d="M10 5v6M10 14.6v.1"/>', 20, 2.6),
    folder: svg('<path d="M2.8 6A1.6 1.6 0 0 1 4.4 4.4h3.4l1.7 1.7h6.1A1.6 1.6 0 0 1 17.2 7.7v6.7a1.6 1.6 0 0 1-1.6 1.6H4.4a1.6 1.6 0 0 1-1.6-1.6z"/>'),
    photo: svg('<rect x="3" y="4" width="14" height="12" rx="2.5"/><circle cx="7.6" cy="8.4" r="1.4"/><path d="M3.5 14l4-3.6 3 2.6 2.4-2 3.6 3.2"/>'),
    film: svg('<rect x="3" y="4.5" width="14" height="11" rx="2.5"/><path d="M8.6 7.8v4.4l3.8-2.2z" fill="currentColor" stroke="none"/>'),
    wave: svg('<path d="M4 9v2M7 6.5v7M10 4v12M13 7.5v5M16 9v2"/>'),
    system: svg('<circle cx="10" cy="10" r="6.5"/><path d="M10 3.5a6.5 6.5 0 0 1 0 13z" fill="currentColor" stroke="none"/>'),
    sun: svg('<circle cx="10" cy="10" r="3.2"/><path d="M10 2.5v1.7M10 15.8v1.7M17.5 10h-1.7M4.2 10H2.5M15.3 4.7l-1.2 1.2M5.9 14.1l-1.2 1.2M15.3 15.3l-1.2-1.2M5.9 5.9L4.7 4.7"/>'),
    moon: svg('<path d="M15.8 12.3A6.5 6.5 0 0 1 7.7 4.2a6.5 6.5 0 1 0 8.1 8.1z"/>'),
  };
  const appIcon = '<img class="appicon" src="assets/icon.png" alt="">';
  const wordmark = '<span class="wordmark" aria-label="minime"><span>m</span><span>i</span><span>n</span><span>i</span><span>m</span><span>e</span></span>';

  // ---------- Dados fixos ----------

  const AUDIO_T = new Set(['mp3', 'wav', 'm4a', 'flac', 'ogg', 'opus']);
  const KIND = { image: 'Imagem', video: 'Vídeo', audio: 'Áudio' };
  const CAT_PLURAL = { image: 'Imagens', video: 'Vídeos', audio: 'Áudios' };
  const FORMAT_LIST = {
    image: 'JPG PNG WebP AVIF TIFF GIF BMP ICO SVG',
    video: 'MP4 MKV MOV AVI WebM WMV FLV MPG 3GP',
    audio: 'MP3 WAV M4A AAC FLAC OGG Opus WMA AIFF',
  };

  const DEFAULTS = {
    image: { objective: 'balanced', quality: 80, resize: 'original', stripMetadata: true },
    video: { objective: 'balanced', quality: 60, resolution: 'original', engine: 'auto', codec: 'h264' },
    audio: { quality: 57, background: 'wave' },
  };

  const OBJ = {
    image: [
      { v: 'lossless', label: 'Sem perda', help: 'Cada pixel fica igual. PNG, WebP e AVIF saem sem perda; JPG vai a 95%.', apply: (s) => ({ ...s, quality: 100, stripMetadata: false }) },
      { v: 'balanced', label: 'Equilibrado', help: 'Diferença invisível a olho nu e arquivo bem menor.', apply: (s) => ({ ...s, quality: 80, stripMetadata: true }) },
      { v: 'web', label: 'Pra web', help: 'O menor arquivo pra site e rede social. Limita a 1920 px e tira os dados ocultos.', apply: (s) => ({ ...s, quality: 62, stripMetadata: true, resize: s.resize === 'original' ? 1920 : s.resize }) },
    ],
    video: [
      { v: 'copy', label: 'Sem perda', help: 'Troca só a embalagem (ex.: MKV pra MP4). Leva segundos e não perde nada.', apply: (s) => ({ ...s }) },
      { v: 'balanced', label: 'Equilibrado', help: 'Imagem boa e tamanho razoável.', apply: (s) => ({ ...s, quality: 60 }) },
      { v: 'small', label: 'Menor', help: 'Pra WhatsApp e e-mail: até 1080p e bitrate baixo.', apply: (s) => ({ ...s, quality: 35, resolution: s.resolution === 'original' ? 1080 : s.resolution }) },
    ],
  };
  const CUSTOM_HELP = 'Ajuste manual: o tamanho final acompanha a régua de qualidade.';

  const RESIZE = [['original', 'Original'], [3840, '3840 px (4K)'], [2560, '2560 px'], [1920, '1920 px (Full HD)'], [1280, '1280 px'], [800, '800 px']];
  const RESOLUTION = [['original', 'Original'], [2160, '4K (2160p)'], [1440, '1440p'], [1080, '1080p (Full HD)'], [720, '720p'], [480, '480p']];
  const ENGINE = [['auto', 'Automático', 'Usa a placa de vídeo quando ela der conta do formato.'], ['gpu', 'Placa de vídeo', 'Mais rápido.'], ['cpu', 'Processador', 'Mais lento, comprime um pouco melhor.']];
  const CODEC = [['h264', 'H.264'], ['h265', 'H.265']];
  const BG = [['wave', 'Onda'], ['cover', 'Capa'], ['black', 'Preto']];
  const THEMES = [['system', 'Sistema', I.system], ['light', 'Claro', I.sun], ['dark', 'Escuro', I.moon]];

  // ---------- Estado ----------

  const store = {
    load(k, d) { try { const v = JSON.parse(localStorage.getItem(k)); return v ?? d; } catch { return d; } },
    save(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
  };
  function mergeSettings(s) {
    const d = structuredClone(DEFAULTS);
    if (s) for (const k of Object.keys(d)) Object.assign(d[k], s[k] || {});
    return d;
  }

  const state = {
    items: [],
    settings: mergeSettings(store.load('minime.settings.v1', null)),
    dest: store.load('minime.dest.v1', { mode: 'same', folder: null }),
    lastTargets: store.load('minime.targets.v1', {}),
    tab: null,
    phase: 'idle',
    hw: null,
    caps: {},
    estimating: false,
    summary: null,
    quickTarget: null,
    loading: 0,
    menuOn: null,
    version: '',
    theme: 'system',
    prefs: null,
    update: null,
    system: null,
  };
  const saveSettings = () => store.save('minime.settings.v1', state.settings);
  const saveDest = () => store.save('minime.dest.v1', state.dest);

  const byId = (id) => state.items.find((i) => i.id === id);
  const okItems = () => state.items.filter((i) => i.ok);
  const pendingItems = () => okItems().filter((i) => i.status !== 'done');

  function kindOf(it) {
    if (it.category === 'image' && it.target === 'mp4') return 'video';
    if (it.category === 'video' && AUDIO_T.has(it.target)) return 'audio';
    if (it.category === 'audio') return 'audio';
    return it.category;
  }
  const order = (set) => ['image', 'video', 'audio'].filter((k) => set.has(k));
  const kindsPresent = () => order(new Set(okItems().map(kindOf)));
  const catsPresent = () => order(new Set(okItems().map((i) => i.category)));
  const targetLabel = (it, t = it.target) => (it.targets.find((x) => x.id === t) || { label: String(t).toUpperCase() }).label;

  function pickTarget(it) {
    const has = (t) => it.targets.some((x) => x.id === t);
    if (MODE === 'quick' && state.quickTarget) {
      if (state.quickTarget === 'same') { const s = it.targets.find((x) => x.same); if (s) return s.id; }
      else if (has(state.quickTarget)) return state.quickTarget;
    }
    const remembered = state.lastTargets[`${it.category}:${it.ext}`] || state.lastTargets[it.category];
    if (remembered && has(remembered)) return remembered;
    return it.defaultTarget;
  }

  // ---------- Vidro líquido: lente que entorta o que passa por trás ----------
  // Filtro SVG com mapa de deslocamento do tamanho de cada peça (técnica do GlassSurface do React Bits).

  const NS = 'http://www.w3.org/2000/svg';
  const lenses = new Map(); // chave -> { feImage, maps:[], size }
  let lensDefs = null;
  function lensFilter(key) {
    if (lenses.has(key)) return lenses.get(key);
    if (!lensDefs) {
      lensDefs = document.createElementNS(NS, 'svg');
      lensDefs.setAttribute('class', 'lens-defs');
      lensDefs.setAttribute('aria-hidden', 'true');
      document.body.appendChild(lensDefs);
    }
    const f = document.createElementNS(NS, 'filter');
    f.id = `lens-${key}`;
    f.setAttribute('color-interpolation-filters', 'sRGB');
    for (const [a, v] of [['x', '0%'], ['y', '0%'], ['width', '100%'], ['height', '100%']]) f.setAttribute(a, v);
    f.innerHTML = `<feImage x="0" y="0" width="100%" height="100%" preserveAspectRatio="none" result="map"/>
      ${['r', 'g', 'b'].map((c, i) => `<feDisplacementMap in="SourceGraphic" in2="map" xChannelSelector="R" yChannelSelector="B" result="d${c}"/>
        <feColorMatrix in="d${c}" type="matrix" values="${[0, 1, 2].map((r) => [0, 1, 2, 3, 4].map((col) => (col === r && r === i ? 1 : 0)).join(' ')).join(' ')} 0 0 0 1 0" result="${c}"/>`).join('')}
      <feBlend in="r" in2="g" mode="screen" result="rg"/><feBlend in="rg" in2="b" mode="screen" result="rgb"/>
      <feGaussianBlur in="rgb" stdDeviation="0.6"/>`;
    lensDefs.appendChild(f);
    const entry = { feImage: f.querySelector('feImage'), maps: [...f.querySelectorAll('feDisplacementMap')], size: '' };
    lenses.set(key, entry);
    return entry;
  }
  function lensMap(w, h, r) {
    const e = Math.min(w, h) * 0.035;
    const s = `<svg xmlns="${NS}" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><defs>
      <linearGradient id="r" x1="100%" y1="0%" x2="0%" y2="0%"><stop offset="0%" stop-color="#0000"/><stop offset="100%" stop-color="red"/></linearGradient>
      <linearGradient id="b" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="#0000"/><stop offset="100%" stop-color="blue"/></linearGradient>
      <filter id="s"><feGaussianBlur stdDeviation="${Math.max(6, Math.min(14, Math.min(w, h) * 0.12))}"/></filter></defs>
      <rect width="${w}" height="${h}" fill="black"/><rect width="${w}" height="${h}" rx="${r}" fill="url(#r)"/>
      <rect width="${w}" height="${h}" rx="${r}" fill="url(#b)" style="mix-blend-mode:difference"/>
      <rect x="${e}" y="${e}" width="${w - 2 * e}" height="${h - 2 * e}" rx="${Math.max(0, r - e)}" fill="hsl(0 0% 50% / .93)" filter="url(#s)"/></svg>`;
    return `data:image/svg+xml,${encodeURIComponent(s)}`;
  }
  function applyLens(el) {
    const key = el.dataset.lens;
    const w = Math.round(el.offsetWidth), h = Math.round(el.offsetHeight);
    if (!w || !h) return;
    const L = lensFilter(key);
    const r = Math.min(parseFloat(getComputedStyle(el).borderTopLeftRadius) || 0, h / 2, w / 2);
    const size = `${w}x${h}x${r}`;
    if (L.size !== size) {
      L.size = size;
      L.feImage.setAttribute('href', lensMap(w, h, r));
      const base = -Math.max(26, Math.min(72, h * 0.95));
      L.maps.forEach((m, i) => m.setAttribute('scale', String(base + i * 8)));
    }
    el.style.setProperty('--lens', `url(#lens-${key})`);
    el.classList.add('lensed');
  }
  const lensRO = new ResizeObserver((entries) => entries.forEach((e) => applyLens(e.target)));
  function refreshLenses(root = document) {
    root.querySelectorAll('[data-lens]').forEach((el) => { applyLens(el); lensRO.observe(el); });
  }

  // ---------- Controle segmentado: a "gota" desliza de uma opção pra outra ----------

  const segFrom = new Map(); // caminho -> índice antigo
  function segIndex(el) { return Number(el.style.getPropertyValue('--i')) || 0; }
  function flushSegs() {
    for (const [path, from] of segFrom) {
      const el = document.querySelector(`[data-seg="${path}"]`);
      if (!el) continue;
      const to = segIndex(el);
      segFrom.delete(path);
      if (from === to || reduceMotion() || from < 0 || el.classList.contains('none')) continue;
      el.animate([{ transform: `translateX(${from * 100}%)` }, { transform: `translateX(${to * 100}%)` }],
        { duration: 360, easing: 'cubic-bezier(.32,.72,0,1)', pseudoElement: '::before' });
    }
  }

  // ---------- Toast ----------

  let toastTimer = null;
  function toast(msg, ms = 3400) {
    toastEl.textContent = msg;
    toastEl.hidden = false;
    toastEl.dataset.lens = 'toast';
    applyLens(toastEl);
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { toastEl.hidden = true; }, ms);
  }

  // ---------- Entrada de arquivos ----------

  async function addPaths(paths) {
    if (!paths || !paths.length) return;
    if (state.phase === 'converting') { toast('Espere a conversão terminar pra adicionar mais arquivos.'); return; }
    if (state.phase === 'done') clearDone();
    state.loading++;
    const slow = setTimeout(() => toast('Lendo os arquivos…', 8000), 450);
    let added = [];
    try { added = await api.addPaths(paths); } catch (e) { toast(`Não consegui ler: ${e.message || e}`); }
    clearTimeout(slow);
    state.loading--;
    const known = new Set(state.items.map((i) => i.id));
    const fresh = added.filter((i) => !known.has(i.id));
    for (const it of fresh) {
      it.target = it.ok ? pickTarget(it) : null;
      it.est = null; it.status = null; it.progress = 0; it.thumb = undefined;
      state.items.push(it);
    }
    if (!added.length) toast('Nenhum arquivo compatível. O MINIME lê imagens, vídeos e áudios.');
    else if (!fresh.length) toast('Esses arquivos já estão na lista.');
    else toastEl.hidden = true;
    if (!state.tab || !kindsPresent().includes(state.tab)) state.tab = kindsPresent()[0] || null;
    render();
    loadThumbs(fresh.filter((i) => i.ok));
    await refreshCaps();
    scheduleEstimate(0);
  }

  async function loadThumbs(list) {
    let i = 0;
    const worker = async () => {
      while (i < list.length) {
        const it = list[i++];
        try { it.thumb = (await api.thumb(it.id)) || null; } catch { it.thumb = null; }
        if (!it.thumb) continue;
        for (const el of document.querySelectorAll(`.thumb[data-tid="${it.id}"]`)) {
          el.classList.remove('audio-art', 'video-art');
          el.innerHTML = `<img src="${it.thumb}" alt="">`;
        }
      }
    };
    await Promise.all([worker(), worker(), worker(), worker()]);
  }

  async function removeItems(ids) {
    await api.removeItems(ids);
    state.items = state.items.filter((i) => !ids.includes(i.id));
    if (!kindsPresent().includes(state.tab)) state.tab = kindsPresent()[0] || null;
    render();
    await refreshCaps();
    scheduleEstimate(0);
  }

  function clearDone() {
    const done = state.items.filter((i) => i.status === 'done').map((i) => i.id);
    state.items = state.items.filter((i) => i.status !== 'done');
    for (const it of state.items) { it.status = null; it.progress = 0; it.convError = null; }
    if (done.length) api.removeItems(done);
    state.phase = 'idle';
    state.summary = null;
  }

  // ---------- Capacidades e estimativa ----------

  async function refreshCaps() {
    const caps = {};
    for (const kind of kindsPresent()) {
      const its = okItems().filter((i) => kindOf(i) === kind);
      const pairs = [...new Set(its.map((i) => `${i.category}>${i.target}`))];
      const list = await Promise.all(pairs.map((p) => {
        const [c, t] = p.split('>');
        return api.caps(c, t, its.filter((i) => i.category === c && i.target === t).map((i) => i.id), state.settings);
      }));
      caps[kind] = {
        slider: list.some((c) => c.slider),
        note: list.every((c) => !c.slider) ? list[0].note : (list.find((c) => c.note) || {}).note || null,
        remux: list.some((c) => c.remux),
        remuxAll: list.length > 0 && list.every((c) => c.remuxAll),
      };
    }
    state.caps = caps;
    renderSettings();
  }

  let estTimer = null, estSeq = 0;
  function scheduleEstimate(delay = 160) {
    clearTimeout(estTimer);
    if (!pendingItems().length) { state.estimating = false; renderMeter(); return; }
    state.estimating = true;
    document.getElementById('meter')?.classList.add('calculating');
    estTimer = setTimeout(runEstimate, delay);
  }
  async function runEstimate() {
    const seq = ++estSeq;
    const jobs = pendingItems().map((i) => ({ id: i.id, target: i.target }));
    let res;
    try { res = await api.estimate(jobs, state.settings); } catch { res = null; }
    if (seq !== estSeq || !res || res.stale) return;
    for (const it of pendingItems()) if (res[it.id]) it.est = res[it.id];
    state.estimating = false;
    for (const it of state.items) updateRow(it);
    renderMeter();
    updateValueLabels();
  }

  function totals() {
    const t = { before: 0, after: 0, approx: false, byKind: { image: 0, video: 0, audio: 0 } };
    for (const it of okItems()) {
      t.before += it.size;
      let b = null;
      if (it.status === 'done' && it.outSize) b = it.outSize;
      else if (it.est && !it.est.error) { b = it.est.bytes; t.approx = t.approx || !!it.est.approx; }
      if (b !== null) { t.after += b; t.byKind[kindOf(it)] += b; }
    }
    return t;
  }

  // ---------- Render ----------

  function render() {
    closeMenu();
    const scroll = document.getElementById('scroller')?.scrollTop || 0;
    if (MODE === 'quick') renderQuick(); else renderMain();
    const sc = document.getElementById('scroller');
    if (sc) sc.scrollTop = scroll;
    refreshLenses();
    flushSegs();
  }

  function toolbar() {
    const busy = state.phase === 'converting';
    const has = state.items.length > 0;
    const files = MODE === 'main' ? `<span class="sep"></span>
      <button class="tb-btn" data-act="add" ${busy ? 'disabled' : ''} title="Adicionar arquivos">${I.plus}Adicionar</button>
      ${has ? `<button class="tb-btn icon" data-act="clear" ${busy ? 'disabled' : ''} title="Limpar a lista" aria-label="Limpar a lista">${I.trash}</button>` : ''}` : '';
    return `<div class="dragbar"></div>
      <nav class="toolbar glass" data-lens="toolbar">${appIcon}${wordmark}${files}
        <span class="sep"></span>
        <span id="upd-badge">${updateBadge()}</span>
        <button class="tb-btn icon" data-act="prefs" title="Aparência e ajustes" aria-label="Aparência e ajustes">${I.sliders}</button>
      </nav>`;
  }

  function updateBadge() {
    const u = state.update;
    if (!u) return '';
    if (u.status === 'ready') return `<button class="tb-btn update" data-act="prefs" title="Versão ${esc(u.version)} pronta pra instalar"><span class="live"></span>Atualizar</button>`;
    if (u.status === 'available') return `<button class="tb-btn update" data-act="prefs" title="Versão ${esc(u.version)} disponível"><span class="live"></span>Versão nova</button>`;
    return '';
  }
  function refreshBadge() {
    for (const el of document.querySelectorAll('#upd-badge')) el.innerHTML = updateBadge();
  }

  function credit(cls = 'credit') {
    return `<span class="${cls}">Criado por Alan Moreira. <button data-act="site" title="Abrir alanmore.com.br">alanmore.com.br</button></span>`;
  }

  function renderMain() {
    const has = state.items.length > 0;
    if (!has) {
      app.innerHTML = `<div class="shell empty"><section class="stage">${toolbar()}${emptyState()}</section></div>`;
      return;
    }
    app.innerHTML = `<div class="shell">
      <section class="stage">
        <div class="scroller" id="scroller">
          <header class="hero"><h1>Arquivos<span class="count num">${nf0.format(state.items.length)}</span></h1><div class="bulk">${bulk()}</div></header>
          <div class="plate" id="list">${state.items.map(rowHtml).join('')}</div>
        </div>
        ${toolbar()}
        <footer class="actionbar glass" data-lens="actionbar" id="actionbar">${actionbar()}</footer>
      </section>
      <aside class="inspector glass" aria-label="Ajustes da conversão">
        <div class="inspector-head" id="tabs">${tabsHtml()}</div>
        <div class="settings" id="settings">${state.tab ? settingsFor(state.tab) : ''}</div>
        <section class="meter group" id="meter"></section>
        <div class="credit-line">${credit('credit')}</div>
      </aside>
    </div>`;
    renderMeter(true);
    updateOverall();
  }

  function emptyState() {
    return `<div class="empty-wrap"><section class="drop-card glass">
      <div class="fan" aria-hidden="true">
        <span class="app-tile t-image">${I.photo}</span><span class="app-tile t-video">${I.film}</span><span class="app-tile t-audio">${I.wave}</span>
      </div>
      <h1>Solte aqui suas imagens, vídeos e áudios</h1>
      <p class="sub">Um arquivo, vários ou uma pasta inteira. Você escolhe o formato de cada um e vê o tamanho final antes de converter.</p>
      <button class="btn primary" data-act="add">${I.plus}Escolher arquivos</button>
      <div class="formats">${['image', 'video', 'audio'].map((k) => `<div><b><span class="dot ${k}"></span>${KIND[k]}</b><span>${FORMAT_LIST[k]}</span></div>`).join('')}</div>
      ${credit()}
    </section></div>`;
  }

  function bulk() {
    const cats = catsPresent();
    if (!cats.length) return '';
    const busy = state.phase === 'converting';
    return cats.map((c) => {
      const its = okItems().filter((i) => i.category === c);
      const ts = new Set(its.map((i) => i.target));
      const label = ts.size === 1 ? targetLabel(its[0]) : 'Vários';
      return `<span class="bulk-item"><span class="dot ${c}"></span>${CAT_PLURAL[c]}
        <button class="popup inline" data-menu="bulk" data-cat="${c}" ${busy ? 'disabled' : ''} aria-label="Converter todos os ${CAT_PLURAL[c].toLowerCase()} para"><span class="lbl">${esc(label)}</span>${I.updown.replace('aria-hidden', 'class="chev" aria-hidden')}</button></span>`;
    }).join('');
  }

  function thumbHtml(it) {
    const art = it.category === 'audio' ? 'audio-art' : it.category === 'video' ? 'video-art' : 'checker';
    const icon = it.category === 'video' ? I.film : it.category === 'audio' ? I.wave : I.photo;
    return `<div class="thumb ${it.thumb ? '' : art}" data-tid="${it.id}">${it.thumb ? `<img src="${it.thumb}" alt="">` : icon}</div>`;
  }

  function metaHtml(it) {
    const badge = `<span class="badge ${it.category}">${esc(it.ext.toUpperCase())}</span>`;
    if (!it.ok) return `<div class="meta err">${esc(it.error)}</div>`;
    if (it.status === 'running') return `<div class="meta">${badge}<span>Convertendo… ${Math.round((it.progress || 0) * 100)}%</span></div>`;
    if (it.status === 'queued') return `<div class="meta">${badge}<span>Na fila</span></div>`;
    if (it.status === 'done') return `<div class="meta">${badge}<span>Pronto. <button class="link-btn" data-act="show" data-id="${it.id}">Mostrar na pasta</button></span></div>`;
    if (it.status === 'error') return `<div class="meta err">${esc(it.convError || 'Falhou.')}</div>`;
    if (it.status === 'cancelled') return `<div class="meta">${badge}<span>Cancelado</span></div>`;
    if (it.est && it.est.error) return `<div class="meta err">${esc(it.est.error)}</div>`;
    return `<div class="meta">${badge}<span>${esc(it.meta)}</span></div>`;
  }

  function sizesHtml(it) {
    if (!it.ok) return `<div class="before">${fmtBytes(it.size)}</div>`;
    let after, approx = false;
    if (it.status === 'done') after = it.outSize;
    else if (it.est && !it.est.error) { after = it.est.bytes; approx = it.est.approx; }
    if (after === undefined || after === null) return `<div class="before">${fmtBytes(it.size)}</div><div class="pending">calculando…</div>`;
    const d = delta(it.size, after);
    return `<div class="before">${fmtBytes(it.size)}</div><div class="after-line"><span class="after num">${approx ? '~' : ''}${fmtBytes(after)}</span>${d ? `<span class="pill ${d.cls}">${d.text}</span>` : ''}</div>`;
  }

  function statusHtml(it) {
    const busy = state.phase === 'converting';
    if (it.status === 'queued' || it.status === 'running') {
      const c = 2 * Math.PI * 9;
      const p = it.status === 'running' ? it.progress || 0 : 0;
      return `<svg class="ring" viewBox="0 0 22 22" role="progressbar" aria-valuenow="${Math.round(p * 100)}" aria-valuemin="0" aria-valuemax="100"><circle class="track" cx="11" cy="11" r="9"/><circle class="bar" cx="11" cy="11" r="9" stroke-dasharray="${c}" stroke-dashoffset="${c * (1 - p)}"/></svg>`;
    }
    if (it.status === 'done') return `<button class="done-badge" data-act="show" data-id="${it.id}" title="Mostrar na pasta" aria-label="Mostrar ${esc(it.name)} na pasta">${I.check}</button>`;
    if (it.status === 'error') return `<span class="done-badge err" title="${esc(it.convError || 'Falhou')}">${I.bang}</span>`;
    if (it.status === 'cancelled') return `<span class="done-badge cancel" title="Cancelado">${I.x}</span>`;
    return `<button class="x-btn" data-act="remove" data-id="${it.id}" title="Tirar da lista" aria-label="Tirar ${esc(it.name)} da lista" ${busy ? 'disabled' : ''}>${I.x}</button>`;
  }

  function rowHtml(it) {
    const busy = state.phase === 'converting';
    return `<div class="row ${it.status === 'done' ? 'done' : ''}" data-id="${it.id}" ${busy ? 'data-busy' : ''}>
      ${thumbHtml(it)}
      <div class="name"><b title="${esc(it.path)}">${esc(it.name)}</b>${metaHtml(it)}</div>
      <div class="sizes num">${sizesHtml(it)}</div>
      <div>${it.ok ? `<button class="popup" data-menu="row" data-id="${it.id}" ${busy || it.status === 'done' ? 'disabled' : ''} aria-label="Formato de saída de ${esc(it.name)}"><span class="lbl">${esc(targetLabel(it))}</span>${I.updown.replace('aria-hidden', 'class="chev" aria-hidden')}</button>` : ''}</div>
      <div class="status">${statusHtml(it)}</div>
    </div>`;
  }

  function updateRow(it) {
    if (MODE === 'quick') return;
    const el = document.querySelector(`.row[data-id="${it.id}"]`);
    if (!el) return;
    el.classList.toggle('done', it.status === 'done');
    el.querySelector('.meta')?.replaceWith(htmlEl(metaHtml(it)));
    el.querySelector('.sizes').innerHTML = sizesHtml(it);
    const st = el.querySelector('.status');
    const ring = st.querySelector('.ring .bar');
    if (ring && it.status === 'running') {
      const c = 2 * Math.PI * 9;
      ring.setAttribute('stroke-dashoffset', String(c * (1 - (it.progress || 0))));
    } else st.innerHTML = statusHtml(it);
  }
  function htmlEl(html) { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; }

  // ---------- Ajustes ----------

  function chev() { return I.updown.replace('aria-hidden', 'class="chev" aria-hidden'); }

  function seg(path, options, current, extraClass = '') {
    const idx = options.findIndex(([v]) => String(v) === String(current));
    const cls = `seg ${extraClass} ${idx < 0 ? 'none' : ''}`;
    return `<div class="${cls}" data-seg="${path}" role="group" style="--n:${options.length};--i:${Math.max(0, idx)}">${options.map(([v, label, disabled, title, icon]) =>
      `<button type="button" data-v="${v}" aria-pressed="${String(v) === String(current)}" ${disabled ? 'disabled' : ''} ${title ? `title="${esc(title)}"` : ''}>${icon || ''}${esc(label)}</button>`).join('')}</div>`;
  }

  function popupBtn(menu, label, disabled = false) {
    return `<button class="popup" data-menu="${menu}" ${disabled ? 'disabled' : ''}><span class="lbl">${esc(label)}</span>${chev()}</button>`;
  }

  function rangeGroup(path, value, disabled, note) {
    return `<div class="group">
      <div class="g-title"><span>Qualidade</span><span class="value" data-value="${path}">${valueText(path)}</span></div>
      <input type="range" class="range" data-range="${path}" min="0" max="100" step="1" value="${value}" style="--pct:${value}%" ${disabled ? 'disabled' : ''} aria-label="Qualidade">
      <div class="range-scale"><span>Menor arquivo</span><span>Mais qualidade</span></div>
      ${note ? `<p class="help note">${esc(note)}</p>` : ''}
    </div>`;
  }

  function tabsHtml() {
    const kinds = kindsPresent();
    if (!kinds.length) return '';
    return seg('tab', kinds.map((k) => [k, KIND[k], false, '', `<span class="dot ${k}"></span>`]), state.tab, 'tabs');
  }

  function firstDetail(kind) {
    const it = pendingItems().find((i) => kindOf(i) === kind && i.est && i.est.detail);
    return it ? it.est.detail : null;
  }

  function valueText(path) {
    const s = state.settings;
    if (path === 'image.quality') return `${s.image.quality}%`;
    if (path === 'video.quality') {
      const d = firstDetail('video');
      if (!d) return `${s.video.quality}%`;
      if (d.remux) return 'original';
      if (d.fps && d.colors) return `${d.fps} fps, ${d.colors} cores`;
      if (d.bitrate) return `${nf1.format(d.bitrate / 1e6)} Mbps`;
      return `${s.video.quality}%`;
    }
    if (path === 'audio.quality') {
      const d = firstDetail('audio');
      if (d && d.kbps) return `${d.kbps} kbps`;
      if (d && d.lossless) return 'sem perda';
      return `${s.audio.quality}%`;
    }
    return '';
  }
  function updateValueLabels() {
    for (const el of document.querySelectorAll('[data-value]')) el.textContent = valueText(el.dataset.value);
  }

  function engineInfo() {
    const hw = state.hw;
    const s = state.settings.video;
    if (!hw) return { on: false, text: 'Procurando a placa de vídeo…' };
    const vids = okItems().filter((i) => kindOf(i) === 'video' && i.status !== 'done');
    const cpuOnly = vids.length > 0 && vids.every((i) => ['webm', 'avi', 'gif'].includes(i.target));
    const enc = s.codec === 'h265' ? hw.hevc : hw.h264;
    if (cpuOnly) return { on: false, text: `Processador. WebM, AVI e GIF não usam a placa de vídeo.` };
    if (s.engine === 'cpu') return { on: false, text: `Processador: ${hw.cpu}` };
    if (!enc) return { on: false, text: hw.gpuLabel ? `${hw.gpuLabel} não codifica ${s.codec === 'h265' ? 'H.265' : 'H.264'}. Usando o processador.` : 'Nenhuma placa de vídeo compatível. Usando o processador.' };
    return { on: true, text: `Usando a ${hw.gpuLabel}` };
  }

  function settingsFor(kind) {
    const s = state.settings;
    const caps = state.caps[kind] || { slider: true };
    if (kind === 'image') {
      const o = OBJ.image.find((x) => x.v === s.image.objective);
      return `
        <div class="group"><div class="g-title"><span>Objetivo</span></div>
          ${seg('image.objective', OBJ.image.map((x) => [x.v, x.label]), s.image.objective)}
          <p class="help" data-help="image">${esc(o ? o.help : CUSTOM_HELP)}</p></div>
        ${rangeGroup('image.quality', s.image.quality, !caps.slider, caps.note)}
        <div class="group rows">
          <div class="g-row"><span class="lbl"><b>Tamanho máximo</b><small>Lado maior da imagem</small></span>${popupBtn('image.resize', (RESIZE.find(([v]) => String(v) === String(s.image.resize)) || RESIZE[0])[1])}</div>
          <label class="g-row"><span class="lbl"><b>Remover dados ocultos</b><small>EXIF, GPS e modelo da câmera</small></span>
            <span class="switch"><input type="checkbox" data-check="image.stripMetadata" ${s.image.stripMetadata ? 'checked' : ''} aria-label="Remover dados ocultos"><i></i></span></label>
        </div>`;
    }
    if (kind === 'video') {
      const o = OBJ.video.find((x) => x.v === s.video.objective);
      const vids = okItems().filter((i) => kindOf(i) === 'video');
      const showCodec = vids.some((i) => ['mp4', 'mkv', 'mov'].includes(i.target));
      const copy = s.video.objective === 'copy' && caps.remux;
      const notAllRemux = copy && !caps.remuxAll;
      const pureCopy = copy && caps.remuxAll && s.video.resolution === 'original';
      const eng = engineInfo();
      const helpText = o ? (o.v === 'copy' && !caps.remux ? 'Pra esse formato o vídeo precisa ser recodificado.' : o.help) : CUSTOM_HELP;
      return `
        <div class="group"><div class="g-title"><span>Objetivo</span></div>
          ${seg('video.objective', OBJ.video.map((x) => [x.v, x.label, x.v === 'copy' && !caps.remux, x.v === 'copy' && !caps.remux ? 'Esse vídeo precisa ser recodificado pra esse formato.' : '']), s.video.objective === 'copy' && !caps.remux ? '' : s.video.objective)}
          <p class="help" data-help="video">${esc(helpText)}${notAllRemux ? ' Alguns arquivos vão ser recodificados.' : ''}</p></div>
        ${rangeGroup('video.quality', s.video.quality, pureCopy, pureCopy ? 'Sem recodificar, a qualidade fica idêntica à do original.' : null)}
        <div class="group rows">
          <div class="g-row"><span class="lbl"><b>Resolução</b>${copy && s.video.resolution !== 'original' ? '<small>Mudar obriga a recodificar</small>' : '<small>Nunca aumenta</small>'}</span>${popupBtn('video.resolution', (RESOLUTION.find(([v]) => String(v) === String(s.video.resolution)) || RESOLUTION[0])[1])}</div>
          ${showCodec && !pureCopy ? `<div class="g-row"><span class="lbl"><b>Codec</b><small>${s.video.codec === 'h265' ? 'Uns 35% menor, menos compatível' : 'Abre em qualquer aparelho'}</small></span>${seg('video.codec', CODEC, s.video.codec)}</div>` : ''}
          ${pureCopy ? '' : `<div class="g-row"><span class="lbl"><b>Motor</b><small>CPU ou placa de vídeo</small></span>${popupBtn('video.engine', (ENGINE.find(([v]) => v === s.video.engine) || ENGINE[0])[1])}</div>`}
        </div>
        ${pureCopy ? '' : `<div class="engine"><span class="led ${eng.on ? 'on' : ''}"></span><span>${esc(eng.text)}</span></div>`}`;
    }
    if (kind === 'audio') {
      const auds = okItems().filter((i) => kindOf(i) === 'audio');
      const toVideo = auds.some((i) => i.category === 'audio' && i.target === 'mp4');
      const anyCover = auds.some((i) => i.hasCover);
      return `
        ${rangeGroup('audio.quality', s.audio.quality, !caps.slider, caps.note || 'Se o original for mais leve que o escolhido, o MINIME segura no bitrate dele: acima disso o arquivo só engorda.')}
        ${toVideo ? `<div class="group"><div class="g-title"><span>Fundo do vídeo</span></div>
          ${seg('audio.background', BG.map(([v, l]) => [v, l, v === 'cover' && !anyCover, v === 'cover' && !anyCover ? 'Esse áudio não tem capa.' : '']), s.audio.background === 'cover' && !anyCover ? 'wave' : s.audio.background)}
          <p class="help">Vira um vídeo 1280 × 720 (capa em 1080 × 1080), pronto pra rede social.</p></div>` : ''}`;
    }
    return '';
  }

  function renderSettings() {
    const host = document.getElementById('settings');
    if (host) {
      if (MODE === 'quick') {
        const kinds = kindsPresent();
        host.innerHTML = kinds.map((k) => (kinds.length > 1 ? `<div class="g-title" style="padding:4px 4px 0">${KIND[k]}</div>` : '') + settingsFor(k)).join('');
      } else {
        const tabs = document.getElementById('tabs');
        if (tabs) tabs.innerHTML = tabsHtml();
        host.innerHTML = state.tab ? settingsFor(state.tab) : '';
      }
    }
    flushSegs();
  }

  // ---------- Medidor (estilo "Armazenamento") ----------

  const shown = { after: 0 };
  let tweenRaf = null;
  function renderMeter(fresh = false) {
    const el = document.getElementById('meter');
    if (!el) return;
    const t = totals();
    const isDone = state.phase === 'done';
    if (fresh || !el.dataset.ready) {
      el.dataset.ready = '1';
      el.innerHTML = `
        <div class="m-top"><b class="big num" data-m="after">–</b><span class="of num" data-m="of"></span><span class="pill" data-m="pill"></span></div>
        <div class="storage" role="img" data-m="bar"><i class="s-image" data-m="image"></i><i class="s-video" data-m="video"></i><i class="s-audio" data-m="audio"></i></div>
        <div class="legend" data-m="legend"></div>
        <div class="caption" data-m="caption"></div>`;
    }
    const q = (k) => el.querySelector(`[data-m="${k}"]`);
    el.classList.toggle('calculating', state.estimating && !isDone);
    const max = Math.max(t.before, t.after, 1);
    for (const k of ['image', 'video', 'audio']) q(k).style.flexBasis = `${(t.byKind[k] / max) * 100}%`;
    const d = delta(t.before, t.after);
    const pill = q('pill');
    pill.className = `pill ${d && t.after ? d.cls : ''}`;
    pill.textContent = d && t.after ? d.text : '';
    pill.hidden = !(d && t.after);
    q('of').textContent = `de ${fmtBytes(t.before)}`;
    const saved = t.before - t.after;
    const legend = ['image', 'video', 'audio'].filter((k) => t.byKind[k] > 0)
      .map((k) => `<span><i class="dot ${k}"></i>${CAT_PLURAL[k]} <b class="num">${fmtBytes(t.byKind[k])}</b></span>`);
    if (t.after && saved > 0) legend.push(`<span><i class="dot saved"></i>${isDone ? 'Economizado' : 'Economia'} <b class="num">${fmtBytes(saved)}</b></span>`);
    q('legend').innerHTML = legend.join('');
    q('bar').setAttribute('aria-label', `Tamanho final ${fmtBytes(t.after)} de ${fmtBytes(t.before)}`);
    q('caption').textContent = isDone ? 'Tamanho real dos arquivos convertidos.'
      : !t.after ? 'Calculando o tamanho final…'
        : t.approx ? 'Estimativa pelo bitrate escolhido. O tamanho exato sai na conversão.'
          : 'Tamanho exato, calculado agora com as opções atuais.';
    tween(q('after'), t.after, t.approx && !isDone);
  }

  function tween(el, target, approx) {
    cancelAnimationFrame(tweenRaf);
    if (!target) { el.textContent = '–'; shown.after = 0; return; }
    const from = shown.after;
    const start = performance.now();
    const dur = reduceMotion() ? 0 : 420;
    const step = (now) => {
      const k = dur ? Math.min(1, (now - start) / dur) : 1;
      shown.after = from + (target - from) * (1 - Math.pow(1 - k, 3));
      el.textContent = `${approx ? '~' : ''}${fmtBytes(shown.after)}`;
      if (k < 1) tweenRaf = requestAnimationFrame(step);
    };
    tweenRaf = requestAnimationFrame(step);
  }

  // ---------- Barra de ação ----------

  function destSeg() {
    return seg('dest.mode', [['same', 'Mesma pasta'], ['folder', 'Outra pasta…']], state.dest.mode === 'folder' && state.dest.folder ? 'folder' : 'same');
  }
  function destChip() {
    const d = state.dest;
    return d.mode === 'folder' && d.folder
      ? `<span class="chip" title="${esc(d.folder)}">${I.folder}<span>${esc(d.folder)}</span><button data-act="pick-folder">Trocar</button></span>` : '';
  }

  function actionbar() {
    const n = pendingItems().length;
    if (state.phase === 'converting') {
      return `<div class="progress-line"><div class="pl-text"><b>Convertendo</b><span class="num" id="overall-text"></span></div><div class="bar"><i id="overall"></i></div></div>
        <button class="btn" data-act="cancel">Cancelar</button>`;
    }
    if (state.phase === 'done' && state.summary) {
      const s = state.summary;
      const saved = s.inBytes - s.outBytes;
      const msg = s.error ? s.error
        : `${plural(s.done, 'arquivo convertido', 'arquivos convertidos')}${s.failed ? `, ${s.failed} com erro` : ''}${s.cancelled ? `, ${s.cancelled} cancelado${s.cancelled > 1 ? 's' : ''}` : ''}`;
      const sub = s.done ? (saved >= 0 ? `${fmtBytes(saved)} a menos` : `${fmtBytes(-saved)} a mais`) : '';
      return `<div class="grow result"><span class="done-badge ${s.done ? '' : 'err'}">${s.done ? I.check : I.bang}</span><b>${s.done ? 'Pronto.' : 'Não deu certo.'}</b><span>${esc(msg)}${sub ? `. ${sub}.` : '.'}</span></div>
        ${s.folders && s.folders.length ? `<button class="btn" data-act="open-out">${I.folder}Abrir pasta</button>` : ''}
        <button class="btn primary" data-act="new">Nova conversão</button>`;
    }
    return `<div class="grow"><span class="label">Salvar em</span>${destSeg()}${destChip()}</div>
      <button class="btn primary" data-act="convert" ${n ? '' : 'disabled'}>Converter ${plural(n, 'arquivo', 'arquivos')}</button>`;
  }

  function updateOverall() {
    const its = okItems().filter((i) => i.status);
    const p = its.length ? its.reduce((s, i) => s + (['done', 'error', 'cancelled'].includes(i.status) ? 1 : i.progress || 0), 0) / its.length : 0;
    const finished = its.filter((i) => ['done', 'error', 'cancelled'].includes(i.status)).length;
    const bar = document.getElementById('overall');
    if (bar) bar.style.width = `${p * 100}%`;
    const txt = document.getElementById('overall-text');
    const run = its.find((i) => i.status === 'running');
    if (txt) txt.textContent = `${nf0.format(finished)} de ${nf0.format(its.length)} prontos${run ? `. Agora: ${run.name}` : ''}`;
    const qb = document.getElementById('q-bar');
    if (qb) qb.style.width = `${p * 100}%`;
    const qt = document.getElementById('q-text');
    if (qt) qt.textContent = its.length > 1 ? `${nf0.format(finished)} de ${nf0.format(its.length)} prontos${run ? `. Agora: ${run.name}` : ''}` : `${Math.round(p * 100)}%`;
  }

  // ---------- Janela rápida ----------

  function quickTargetOptions() {
    const its = okItems();
    if (!its.length) return [];
    const sets = its.map((i) => new Set(i.targets.map((t) => t.id)));
    const common = its[0].targets.filter((t) => sets.every((s) => s.has(t.id)));
    const sameOk = its.every((i) => i.targets.some((t) => t.same));
    const opts = [];
    if (sameOk) opts.push({ v: 'same', label: 'Mesmo formato', hint: 'Só comprime, sem trocar a extensão.' }, { sep: true });
    for (const t of common) {
      const someSame = its.some((i) => i.targets.some((x) => x.id === t.id && x.same));
      opts.push({ v: t.id, label: t.label, hint: someSame && its.length > 1 ? `Os ${t.label} da seleção só são comprimidos.` : t.hint });
    }
    return opts;
  }
  function quickLabel() {
    if (state.quickTarget === 'same') return 'Mesmo formato';
    const it = okItems()[0];
    return it ? targetLabel(it, state.quickTarget) : String(state.quickTarget || '').toUpperCase();
  }

  function renderQuick() {
    const its = okItems();
    const bad = state.items.filter((i) => !i.ok);
    const first = its[0] || state.items[0];
    let body = '', foot = '';
    if (!first) {
      body = `<p class="help" style="padding:12px 6px">${state.loading ? 'Lendo o arquivo…' : 'Nenhum arquivo compatível.'}</p>`;
    } else {
      const total = its.reduce((s, i) => s + i.size, 0);
      const stack = its.slice(0, 3).map(thumbHtml).join('') || thumbHtml(first);
      const fileBlock = `<div class="q-file"><div class="stack">${stack}</div><div style="min-width:0">
        <b title="${esc(first.path)}">${esc(first.name)}</b>
        <small>${its.length > 1 ? `e mais ${plural(its.length - 1, 'arquivo', 'arquivos')}. ${fmtBytes(total)} no total` : `${esc(first.meta)}. ${fmtBytes(first.size)}`}</small>
        ${bad.length ? `<small style="display:block;color:var(--red-ink)">${plural(bad.length, 'arquivo ignorado', 'arquivos ignorados')}: ${esc(bad[0].error)}</small>` : ''}
      </div></div>`;
      if (state.phase === 'converting') {
        body = `${fileBlock}<div class="group q-progress"><div class="bar"><i id="q-bar"></i></div><p id="q-text">Começando…</p></div>`;
        foot = '<div class="actions"><span></span><button class="btn" data-act="cancel">Cancelar</button></div>';
      } else if (state.phase === 'done' && state.summary) {
        const s = state.summary;
        const failed = its.filter((i) => i.status === 'error');
        const d = delta(s.inBytes, s.outBytes);
        body = `<div class="q-done">
          <span class="done-badge ${s.done ? '' : 'err'}">${s.done ? I.check : I.bang}</span>
          <b>${s.done ? 'Pronto.' : 'Não deu certo.'}</b>
          ${s.done ? `<p class="num">${fmtBytes(s.inBytes)} viraram ${fmtBytes(s.outBytes)}${d ? ` (${d.text})` : ''}. ${plural(s.done, 'arquivo salvo', 'arquivos salvos')}.</p>` : ''}
          ${failed.map((i) => `<p class="err">${esc(i.name)}: ${esc(i.convError)}</p>`).join('')}
        </div>`;
        foot = `<div class="actions"><button class="btn" data-act="open-out">${I.folder}Mostrar na pasta</button><button class="btn primary" data-act="close">Fechar</button></div>`;
      } else {
        body = `${fileBlock}
          <div class="group"><div class="q-target"><span class="t">Converter para</span>${popupBtn('quick', quickLabel()).replace('class="popup"', 'class="popup big"')}</div></div>
          <div class="settings" id="settings" style="padding:0;overflow:visible"></div>
          <section class="meter group" id="meter"></section>
          <div class="group"><div class="g-title"><span>Salvar em</span></div>${destSeg()}${destChip()}</div>`;
        foot = `<div class="actions"><button class="btn small" data-act="full" ${its.length ? '' : 'disabled'}>Abrir no app completo</button><button class="btn primary" data-act="convert" ${its.length ? '' : 'disabled'}>Converter</button></div>`;
      }
    }
    app.innerHTML = `<div class="quick-shell">
      <div class="dragbar"></div>
      <nav class="toolbar glass" data-lens="toolbar">${appIcon}${wordmark}<span class="sep"></span><span id="upd-badge">${updateBadge()}</span><button class="tb-btn icon" data-act="prefs" title="Aparência e ajustes" aria-label="Aparência e ajustes">${I.sliders}</button></nav>
      <main class="sheet glass quick">
        <div class="sheet-body"><div class="sheet-inner">${body}</div></div>
        <div class="sheet-foot">${foot}${credit('credit-line')}</div>
      </main>
    </div>`;
    renderSettings();
    renderMeter(true);
    updateOverall();
    observeQuick();
  }

  // Janela rápida acompanha a altura do conteúdo (o processo principal limita à área útil da tela).
  let quickRO = null;
  function observeQuick() {
    if (!quickRO) {
      quickRO = new ResizeObserver(() => {
        const inner = document.querySelector('.sheet-inner');
        const foot = document.querySelector('.sheet-foot');
        if (!inner || !foot) return;
        const top = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--top')) || 50;
        api.fitHeight(Math.ceil(top + 10 + 14 + 6 + inner.scrollHeight + foot.offsetHeight + 10));
      });
    }
    quickRO.disconnect();
    const inner = document.querySelector('.sheet-inner');
    if (inner) quickRO.observe(inner);
  }

  // ---------- Menus ----------

  let menu = null;
  function openMenu(anchor, options, current, onPick) {
    closeMenu();
    popover.classList.remove('prefs-pop');
    popover.innerHTML = options.map((o, i) => o.sep ? '<div class="opt-sep"></div>'
      : `<button class="opt" role="option" aria-selected="${String(o.v) === String(current)}" data-i="${i}" ${o.disabled ? 'disabled' : ''}>
          <span class="check">${String(o.v) === String(current) ? I.check : ''}</span><b>${esc(o.label)}</b>${o.hint ? `<small>${esc(o.hint)}</small>` : ''}</button>`).join('');
    showPopover(anchor);
    menu = { anchor, options, onPick };
    (popover.querySelector('.opt[aria-selected="true"]') || popover.querySelector('.opt:not(:disabled)'))?.focus({ preventScroll: true });
  }
  function showPopover(anchor, minWidth = 220, alignRight = false) {
    popover.hidden = false;
    const r = anchor.getBoundingClientRect();
    popover.style.minWidth = `${Math.max(r.width, minWidth)}px`;
    const ph = popover.offsetHeight, pw = popover.offsetWidth;
    let top = r.bottom + 6, up = false;
    if (top + ph > innerHeight - 8 && r.top - ph - 6 > 8) { top = r.top - ph - 6; up = true; }
    const left = alignRight ? Math.min(innerWidth - pw - 8, Math.max(8, r.right - pw)) : Math.max(8, Math.min(r.left, innerWidth - pw - 8));
    popover.classList.toggle('up', up);
    popover.classList.toggle('right', alignRight);
    popover.style.top = `${Math.max(8, top)}px`;
    popover.style.left = `${left}px`;
    popover.dataset.lens = 'popover';
    applyLens(popover);
  }
  function closeMenu() { popover.hidden = true; popover.innerHTML = ''; menu = null; }

  function menuFor(el) {
    const kind = el.dataset.menu;
    const s = state.settings;
    if (kind === 'row') {
      const it = byId(el.dataset.id);
      return { options: it.targets.map((t) => ({ v: t.id, label: t.label, hint: t.hint })), current: it.target, pick: (v) => setTarget([it], v) };
    }
    if (kind === 'bulk') {
      const cat = el.dataset.cat;
      const its = okItems().filter((i) => i.category === cat);
      const seen = new Map();
      for (const i of its) for (const t of i.targets) if (!seen.has(t.id)) seen.set(t.id, { v: t.id, label: t.label, hint: t.same && its.length > 1 ? 'Formato de cada arquivo, só comprime.' : t.hint });
      const ts = new Set(its.map((i) => i.target));
      return { options: [...seen.values()], current: ts.size === 1 ? its[0].target : null, pick: (v) => setTarget(its.filter((i) => i.targets.some((t) => t.id === v)), v, cat) };
    }
    if (kind === 'quick') return { options: quickTargetOptions(), current: state.quickTarget, pick: (v) => { state.quickTarget = v; setTarget(okItems(), v); } };
    if (kind === 'image.resize') return { options: RESIZE.map(([v, l]) => ({ v, label: l })), current: s.image.resize, pick: (v) => setSetting('image', { resize: v === 'original' ? 'original' : Number(v) }) };
    if (kind === 'video.resolution') return { options: RESOLUTION.map(([v, l]) => ({ v, label: l, hint: v === 'original' ? 'Mantém a resolução do arquivo.' : '' })), current: s.video.resolution, pick: (v) => setSetting('video', { resolution: v === 'original' ? 'original' : Number(v) }) };
    if (kind === 'video.engine') {
      const hw = state.hw;
      return {
        options: ENGINE.map(([v, l, hint]) => ({ v, label: l, hint: v === 'gpu' && hw && !hw.h264 ? 'Nenhuma placa de vídeo compatível encontrada.' : v === 'gpu' && hw && hw.gpuLabel ? `${hint} ${hw.gpuLabel}.` : hint, disabled: v === 'gpu' && hw && !hw.h264 })),
        current: s.video.engine, pick: (v) => setSetting('video', { engine: v }),
      };
    }
    return null;
  }

  function setTarget(its, v, cat) {
    for (const it of its) {
      if (v === 'same') { const t = it.targets.find((x) => x.same); if (t) it.target = t.id; } else it.target = v;
      it.est = null;
    }
    if (cat) state.lastTargets[cat] = v;
    else if (its.length === 1 && MODE === 'main') state.lastTargets[`${its[0].category}:${its[0].ext}`] = v;
    store.save('minime.targets.v1', state.lastTargets);
    if (!kindsPresent().includes(state.tab)) state.tab = kindsPresent()[0];
    if (MODE === 'quick') render();
    else {
      for (const it of its) {
        const row = document.querySelector(`.row[data-id="${it.id}"]`);
        if (row) row.replaceWith(htmlEl(rowHtml(it)));
      }
      const b = document.querySelector('.bulk');
      if (b) b.innerHTML = bulk();
    }
    refreshCaps();
    scheduleEstimate(0);
  }

  function setSetting(kind, patch) {
    state.settings[kind] = { ...state.settings[kind], ...patch };
    saveSettings();
    renderSettings();
    refreshCaps();
    scheduleEstimate(60);
  }

  // ---------- Aparência e ajustes (popover) ----------

  function updateLine() {
    const u = state.update || {};
    const v = esc(u.version || '');
    switch (u.status) {
      case 'checking': return { text: 'Procurando versão nova…' };
      case 'latest': return { text: `Você está na versão mais recente (${esc(state.version)}).`, act: ['upd-check', 'Procurar de novo'] };
      case 'available': return u.selfInstall
        ? { text: `Versão ${v} disponível.`, act: ['upd-download', 'Baixar e instalar'] }
        : { text: `Versão ${v} disponível. No Mac, baixe e arraste pra Aplicativos.`, act: ['upd-download', 'Baixar no GitHub'] };
      case 'downloading': return { text: `Baixando a versão ${v}… ${u.percent || 0}%` };
      case 'ready': return { text: `Versão ${v} pronta. Instala sozinha quando você fechar o MINIME.`, act: ['upd-install', 'Reiniciar agora'] };
      case 'offline': return { text: 'Sem internet agora. Procuro de novo quando a conexão voltar.', act: ['upd-check', 'Tentar de novo'] };
      case 'error': return { text: esc(u.error || 'Não consegui procurar atualização.'), act: ['upd-check', 'Tentar de novo'] };
      case 'dev': return { text: 'Atualização desligada no modo de desenvolvimento.' };
      default: return { text: `Versão ${esc(state.version)}.`, act: ['upd-check', 'Procurar agora'] };
    }
  }

  function systemHtml() {
    const s = state.system;
    if (!s || !s.cpu) return '<p>Detectando o computador…</p>';
    const arch = s.arch === 'arm64' ? 'ARM 64 bits' : '64 bits (x64)';
    const gpu = s.h264
      ? `Vídeo pela ${esc(s.gpuLabel)}: codifica ${s.hevc ? 'H.264 e H.265' : 'H.264'}${s.hwDecode ? `, decodifica ${s.cores >= 8 ? 'HEVC, AV1 e VP9' : 'tudo'} na placa` : ''}.`
      : 'Vídeo pelo processador (nenhuma placa de vídeo compatível).';
    const lanes = s.lanes ? ` Converte ${s.lanes.light} imagens ou áudios juntos e ${s.lanes.video} ${s.lanes.video > 1 ? 'vídeos' : 'vídeo'} por vez.` : '';
    const emu = s.emulated ? ' <b>Esta cópia roda em modo de compatibilidade: instale a versão ARM pra ficar mais rápido.</b>' : '';
    return `<p>${esc(s.os)}, ${arch}. ${esc(s.cpu)} (${s.cores} núcleos), ${s.memGB} GB de memória. ${gpu}${lanes}${emu}</p>`;
  }

  function prefsHtml() {
    const pf = state.prefs || { autoUpdate: true, openAtLogin: false };
    const u = updateLine();
    const loginLabel = IS_MAC ? 'Abrir quando o Mac iniciar' : 'Abrir quando o Windows iniciar';
    const integration = IS_MAC
      ? '<div class="g-row"><span class="lbl"><b>No Finder</b><small>Botão direito no arquivo ▸ Abrir com ▸ MINIME, ou arraste até o ícone no Dock</small></span></div>'
      : `<label class="g-row"><span class="lbl"><b>Menu do botão direito</b><small>"Converter com MINIME" no Explorer. No Windows 11 fica em Mostrar mais opções.</small></span>
          <span class="switch"><input type="checkbox" data-check="menu" ${state.menuOn ? 'checked' : ''} aria-label="Menu do botão direito"><i></i></span></label>`;
    return `<div class="prefs">
      <div class="p-head"><img class="appicon" src="assets/icon.png" alt=""><div><b>MINIME</b><small>Versão ${esc(state.version)}. Converte e encolhe imagens, vídeos e áudios.</small></div></div>
      <div class="sect">Aparência</div>
      ${seg('theme', THEMES.map(([v, l, icon]) => [v, l, false, '', icon]), state.theme)}
      <div class="sect">Atualização e inicialização</div>
      <div class="group rows">
        <label class="g-row"><span class="lbl"><b>Atualizar automaticamente</b><small>${IS_MAC ? 'Procura versão nova no GitHub e avisa' : 'Baixa a versão nova e instala ao fechar'}</small></span>
          <span class="switch"><input type="checkbox" data-check="pref.autoUpdate" ${pf.autoUpdate ? 'checked' : ''} aria-label="Atualizar automaticamente"><i></i></span></label>
        <div class="g-row upd"><span class="lbl"><small id="upd-text">${u.text}</small></span>${u.act ? `<button class="btn small" data-act="${u.act[0]}">${u.act[1]}</button>` : ''}</div>
        <label class="g-row"><span class="lbl"><b>${loginLabel}</b><small>Desligado, o MINIME só roda quando você abre</small></span>
          <span class="switch"><input type="checkbox" data-check="pref.openAtLogin" ${pf.openAtLogin ? 'checked' : ''} aria-label="${loginLabel}"><i></i></span></label>
      </div>
      <div class="sect">Integração</div>
      <div class="group rows">${integration}</div>
      <div class="sect">Este computador</div>
      <div class="group">${systemHtml()}</div>
      <p>Ao fechar a janela, o MINIME para tudo na hora: nenhum processo fica rodando escondido.</p>
      <div class="credit-line">${credit()}</div>
    </div>`;
  }

  async function openPrefs(anchor) {
    closeMenu();
    if (state.menuOn === null && !IS_MAC) { try { state.menuOn = await api.menuStatus(); } catch { state.menuOn = false; } }
    try { state.prefs = await api.getPrefs(); state.update = state.prefs.update; } catch {}
    if (!state.system || !state.system.lanes) { try { state.system = await api.system(); } catch {} }
    popover.innerHTML = prefsHtml();
    popover.classList.add('prefs-pop');
    showPopover(anchor, 340, true);
    menu = { prefs: true, anchor };
    flushSegs();
  }
  function refreshPrefs() {
    if (!(menu && menu.prefs)) return;
    const scroll = popover.scrollTop;
    popover.innerHTML = prefsHtml();
    popover.scrollTop = scroll;
  }

  // ---------- Boas-vindas (primeiro uso) ----------

  function showWelcome() {
    if (MODE !== 'main' || document.getElementById('welcome')) return;
    const pf = state.prefs || { autoUpdate: true, openAtLogin: false };
    const loginLabel = IS_MAC ? 'Abrir quando o Mac iniciar' : 'Abrir quando o Windows iniciar';
    const el = document.createElement('div');
    el.id = 'welcome';
    el.className = 'welcome-backdrop';
    el.innerHTML = `<section class="welcome glass" data-lens="welcome" role="dialog" aria-modal="true" aria-labelledby="w-title">
      <img class="appicon" src="assets/icon.png" alt="">
      <h2 id="w-title">Bem-vindo ao MINIME</h2>
      <p>Duas escolhas rápidas. Dá pra mudar depois no ícone de ajustes.</p>
      <div class="group rows">
        <label class="g-row"><span class="lbl"><b>Atualizar automaticamente</b><small>Procura a versão mais nova no GitHub sempre que o app abre com internet</small></span>
          <span class="switch"><input type="checkbox" data-check="pref.autoUpdate" ${pf.autoUpdate ? 'checked' : ''} aria-label="Atualizar automaticamente"><i></i></span></label>
        <label class="g-row"><span class="lbl"><b>${loginLabel}</b><small>Desligado, o MINIME só roda quando você abre</small></span>
          <span class="switch"><input type="checkbox" data-check="pref.openAtLogin" ${pf.openAtLogin ? 'checked' : ''} aria-label="${loginLabel}"><i></i></span></label>
      </div>
      <button class="btn primary" data-act="welcome-done">Começar</button>
    </section>`;
    document.body.appendChild(el);
    refreshLenses(el);
    el.querySelector('[data-act="welcome-done"]').focus({ preventScroll: true });
  }

  function waitForScheme() {
    return new Promise((res) => {
      const mq = matchMedia('(prefers-color-scheme: dark)');
      let done = false;
      const fin = () => { if (!done) { done = true; res(); } };
      mq.addEventListener('change', fin, { once: true });
      setTimeout(fin, 280);
    });
  }
  async function setTheme(v) {
    if (v === state.theme) return;
    const run = async () => {
      const r = await api.setTheme(v);
      state.theme = r.theme;
      await waitForScheme();
      const el = popover.querySelector('[data-seg="theme"]');
      if (el) {
        const idx = THEMES.findIndex(([t]) => t === state.theme);
        el.style.setProperty('--i', String(idx));
        el.querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.v === state.theme)));
      }
    };
    if (document.startViewTransition && !reduceMotion()) document.startViewTransition(run);
    else run();
  }

  // ---------- Conversão ----------

  async function startConvert() {
    const list = pendingItems().filter((i) => !(i.est && i.est.error));
    if (!list.length) return;
    if (state.dest.mode === 'folder' && !state.dest.folder) {
      const f = await api.chooseFolder();
      if (!f) return;
      state.dest.folder = f; saveDest();
    }
    state.phase = 'converting';
    state.summary = null;
    for (const it of list) { it.status = 'queued'; it.progress = 0; it.convError = null; }
    render();
    let summary;
    try {
      summary = await api.convert(list.map((i) => ({ id: i.id, target: i.target })), state.settings, state.dest);
    } catch (e) {
      summary = { error: String(e.message || e).replace(/^Error invoking remote method '[^']+': (Error: )?/, ''), done: 0, failed: list.length, cancelled: 0, inBytes: 0, outBytes: 0, folders: [] };
    }
    state.summary = summary;
    state.phase = 'done';
    render();
  }

  api.onProgress((ev) => {
    const it = byId(ev.id);
    if (!it) return;
    it.status = ev.status;
    if (ev.progress !== undefined) it.progress = ev.progress;
    if (ev.outPath) it.outPath = ev.outPath;
    if (ev.outSize !== undefined) it.outSize = ev.outSize;
    if (ev.error) it.convError = ev.error;
    updateRow(it);
    updateOverall();
  });

  // ---------- Eventos ----------

  document.addEventListener('click', async (e) => {
    const opt = e.target.closest('.opt');
    if (opt && popover.contains(opt) && menu && menu.options) {
      const o = menu.options[Number(opt.dataset.i)];
      const pick = menu.onPick;
      closeMenu();
      if (o && !o.disabled) pick(o.v);
      return;
    }
    const inPrefs = menu && menu.prefs && popover.contains(e.target);

    const menuEl = e.target.closest('[data-menu]');
    if (menuEl && !menuEl.disabled) {
      if (menu && menu.anchor === menuEl) { closeMenu(); return; }
      const m = menuFor(menuEl);
      if (m) openMenu(menuEl, m.options, m.current, m.pick);
      return;
    }
    if (!popover.contains(e.target) && !e.target.closest('[data-act="prefs"]')) closeMenu();

    const segBtn = e.target.closest('[data-seg] button');
    if (segBtn && !segBtn.disabled) {
      const host = segBtn.closest('[data-seg]');
      onSeg(host.dataset.seg, segBtn.dataset.v, host);
      return;
    }
    if (inPrefs && !e.target.closest('[data-act]')) return;

    const act = e.target.closest('[data-act]');
    if (!act || act.disabled) return;
    switch (act.dataset.act) {
      case 'add': addPaths(await api.chooseFiles()); break;
      case 'clear': removeItems(state.items.map((i) => i.id)); break;
      case 'remove': removeItems([act.dataset.id]); break;
      case 'convert': startConvert(); break;
      case 'cancel': api.cancel(); act.disabled = true; act.textContent = 'Cancelando…'; break;
      case 'new': {
        const ids = state.items.map((i) => i.id);
        state.items = []; state.phase = 'idle'; state.summary = null; state.tab = null;
        await api.removeItems(ids);
        render();
        break;
      }
      case 'open-out': {
        const s = state.summary;
        const done = state.items.find((i) => i.status === 'done' && i.outPath);
        if (MODE === 'quick' && done) api.showItem(done.outPath);
        else if (s && s.folders && s.folders[0]) api.openFolder(s.folders[0]);
        break;
      }
      case 'show': { const it = byId(act.dataset.id); if (it && it.outPath) api.showItem(it.outPath); break; }
      case 'pick-folder': {
        const f = await api.chooseFolder(state.dest.folder);
        if (f) { state.dest = { mode: 'folder', folder: f }; saveDest(); rerenderDest(); }
        break;
      }
      case 'site': api.openSite(); break;
      case 'prefs': if (menu && menu.prefs) closeMenu(); else openPrefs(act); break;
      case 'full': api.openFull(state.items.map((i) => i.path)); break;
      case 'upd-check': state.update = await api.checkUpdate(true); refreshPrefs(); refreshBadge(); break;
      case 'upd-download': state.update = await api.downloadUpdate(); refreshPrefs(); break;
      case 'upd-install': state.update = await api.installUpdate(); refreshPrefs(); break;
      case 'welcome-done': {
        state.prefs = await api.setPrefs({ firstRunDone: true });
        const w = document.getElementById('welcome');
        if (w) w.remove();
        break;
      }
      case 'close': api.close(); break;
      default: break;
    }
  });

  function rerenderDest() {
    if (MODE === 'quick') { render(); return; }
    const bar = document.getElementById('actionbar');
    if (bar && state.phase === 'idle') { bar.innerHTML = actionbar(); flushSegs(); }
  }

  async function onSeg(path, v, host) {
    const from = segIndex(host);
    if (path === 'theme') {
      segFrom.delete(path);
      const idx = THEMES.findIndex(([t]) => t === v);
      host.style.setProperty('--i', String(idx));
      host.querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.v === v)));
      setTheme(v);
      return;
    }
    segFrom.set(path, host.classList.contains('none') ? -1 : from);
    if (path === 'tab') { state.tab = v; renderSettings(); return; }
    const [kind, key] = path.split('.');
    if (path === 'dest.mode') {
      if (v === 'folder') {
        const f = await api.chooseFolder(state.dest.folder);
        if (f) state.dest = { mode: 'folder', folder: f };
      } else state.dest = { mode: 'same', folder: state.dest.folder };
      saveDest(); rerenderDest();
      return;
    }
    if (key === 'objective') {
      const o = OBJ[kind].find((x) => x.v === v);
      state.settings[kind] = { ...o.apply(state.settings[kind]), objective: v };
      saveSettings();
      renderSettings();
      await refreshCaps();
      scheduleEstimate(0);
      return;
    }
    setSetting(kind, { [key]: v });
  }

  document.addEventListener('input', (e) => {
    const r = e.target.closest('[data-range]');
    if (!r) return;
    const [kind, key] = r.dataset.range.split('.');
    const v = Number(r.value);
    r.style.setProperty('--pct', `${v}%`);
    const s = state.settings[kind];
    s[key] = v;
    if (s.objective && s.objective !== 'custom' && OBJ[kind]) {
      const preset = OBJ[kind].find((x) => x.v === s.objective);
      const pv = preset ? preset.apply({ ...s }).quality : null;
      if (pv !== v) {
        const wasLossless = s.objective === 'lossless';
        s.objective = 'custom';
        const sg = document.querySelector(`[data-seg="${kind}.objective"]`);
        if (sg) { sg.classList.add('none'); sg.querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', 'false')); }
        const help = document.querySelector(`[data-help="${kind}"]`);
        if (help) help.textContent = CUSTOM_HELP;
        if (wasLossless) refreshCaps();
      }
    }
    if (kind === 'image') { const lbl = document.querySelector('[data-value="image.quality"]'); if (lbl) lbl.textContent = `${v}%`; }
    saveSettings();
    scheduleEstimate(kind === 'image' ? 200 : 90);
  });

  document.addEventListener('change', async (e) => {
    const c = e.target.closest('[data-check]');
    if (!c) return;
    if (c.dataset.check === 'menu') {
      c.disabled = true;
      try {
        state.menuOn = await api.setMenu(c.checked);
        toast(state.menuOn ? 'Menu do botão direito ativado.' : 'Menu do botão direito removido.');
      } catch (err) { toast(`Não consegui mudar o menu: ${err.message || err}`); }
      c.checked = !!state.menuOn; c.disabled = false;
      return;
    }
    const [kind, key] = c.dataset.check.split('.');
    if (kind === 'pref') {
      c.disabled = true;
      try { state.prefs = await api.setPrefs({ [key]: c.checked }); } catch {}
      c.checked = !!(state.prefs && state.prefs[key]);
      c.disabled = false;
      for (const other of document.querySelectorAll(`[data-check="${c.dataset.check}"]`)) other.checked = c.checked;
      if (key === 'openAtLogin') toast(c.checked ? 'O MINIME vai abrir junto com o computador.' : 'O MINIME só abre quando você abrir.');
      return;
    }
    state.settings[kind][key] = c.checked;
    saveSettings();
    scheduleEstimate(0);
  });

  document.addEventListener('keydown', (e) => {
    if (popover.hidden) return;
    if (e.key === 'Escape') { const a = menu && menu.anchor; closeMenu(); a?.focus(); e.preventDefault(); return; }
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      const opts = [...popover.querySelectorAll('.opt:not(:disabled)')];
      if (!opts.length) return;
      const i = opts.indexOf(document.activeElement);
      const n = e.key === 'ArrowDown' ? (i + 1) % opts.length : (i - 1 + opts.length) % opts.length;
      opts[n]?.focus();
      e.preventDefault();
    }
  });
  window.addEventListener('resize', closeMenu);
  window.addEventListener('blur', () => { if (!(menu && menu.prefs)) closeMenu(); });
  document.addEventListener('scroll', (e) => { if (menu && menu.options && e.target.id === 'scroller') closeMenu(); }, true);

  // Arrastar e soltar (arquivos e pastas)
  let dragDepth = 0;
  const hasFiles = (e) => e.dataTransfer && [...e.dataTransfer.types].includes('Files');
  window.addEventListener('dragenter', (e) => {
    if (!hasFiles(e)) return;
    e.preventDefault(); dragDepth++;
    if (state.phase !== 'converting' && dropEl.hidden) { dropEl.hidden = false; const g = dropEl.querySelector('.glass'); g.dataset.lens = 'drop'; applyLens(g); }
  });
  window.addEventListener('dragover', (e) => { e.preventDefault(); if (e.dataTransfer) e.dataTransfer.dropEffect = state.phase === 'converting' ? 'none' : 'copy'; });
  window.addEventListener('dragleave', () => { dragDepth = Math.max(0, dragDepth - 1); if (!dragDepth) dropEl.hidden = true; });
  window.addEventListener('drop', (e) => {
    e.preventDefault(); dragDepth = 0; dropEl.hidden = true;
    const files = e.dataTransfer ? [...e.dataTransfer.files] : [];
    addPaths(files.map((f) => api.pathForFile(f)).filter(Boolean));
  });

  // Testes automatizados pulam a tela de boas-vindas.
  function process_env_skip() { return /[?&]nowelcome=1/.test(location.search); }

  // ---------- Início ----------

  (async () => {
    try { const t = await api.getTheme(); state.theme = t.theme; } catch {}
    api.onTheme((t) => {
      state.theme = t.theme;
      const el = popover.querySelector('[data-seg="theme"]');
      if (el) {
        el.style.setProperty('--i', String(THEMES.findIndex(([v]) => v === t.theme)));
        el.querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.v === t.theme)));
      }
    });
    render();
    api.info().then((i) => { state.version = i.version; });
    api.onUpdate((u) => {
      state.update = u;
      refreshBadge();
      if (menu && menu.prefs) { const t = document.getElementById('upd-text'); if (t && u.status === 'downloading') t.textContent = updateLine().text; else refreshPrefs(); }
      if (u.status === 'ready' && u.selfInstall) toast(`Versão ${u.version} pronta. Instala quando você fechar o MINIME.`, 5000);
    });
    window.addEventListener('online', () => api.checkUpdate(false));
    api.getPrefs().then((pf) => {
      state.prefs = pf; state.update = pf.update; refreshBadge();
      if (!pf.firstRunDone && MODE === 'main' && !process_env_skip()) showWelcome();
    }).catch(() => {});
    api.system().then((sys) => { state.system = sys; }).catch(() => {});
    api.hardware().then((hw) => { state.hw = hw; renderSettings(); }).catch(() => {});
    const l = await api.getLaunch();
    if (l.mode === 'quick') state.quickTarget = l.target;
    if (l.files && l.files.length) await addPaths(l.files);
    else render();
    api.onLaunchAdd((d) => addPaths(d.files));
  })();
})();
