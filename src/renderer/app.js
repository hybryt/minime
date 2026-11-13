/* MINIME: interface. Uma tela só, dois modos: janela completa (main) e janela rápida (quick, menu do botão direito). */
(() => {
  'use strict';

  const api = window.minime;
  const MODE = new URLSearchParams(location.search).get('mode') === 'quick' ? 'quick' : 'main';
  document.documentElement.dataset.mode = MODE;

  const app = document.getElementById('app');
  const popover = document.getElementById('popover');
  const toastEl = document.getElementById('toast');
  const dropEl = document.getElementById('dropzone');

  // ---------- Formatação ----------

  const nf0 = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 });
  const nf1 = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  function fmtBytes(b) {
    if (b === null || b === undefined || Number.isNaN(b)) return '–';
    const u = ['B', 'KB', 'MB', 'GB', 'TB'];
    let v = b, i = 0;
    while (v >= 1024 && i < u.length - 1) { v /= 1024; i++; }
    const n = i === 0 || v >= 100 ? nf0.format(v) : nf1.format(v);
    return `${n} ${u[i]}`;
  }
  function delta(before, after) {
    if (!before || after === null || after === undefined) return null;
    const p = Math.round(((after - before) / before) * 100);
    if (p === 0) return { text: 'igual', up: false };
    return p < 0 ? { text: `−${Math.abs(p)}%`, up: false } : { text: `+${nf0.format(p)}%`, up: true };
  }
  const plural = (n, one, many) => `${nf0.format(n)} ${n === 1 ? one : many}`;

  // ---------- Ícones ----------

  const I = {
    chev: '<svg class="chev" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M4 6l4 4 4-4"/></svg>',
    plus: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M8 3v10M3 8h10"/></svg>',
    x: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M4 4l8 8M12 4l-8 8"/></svg>',
    gear: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M3 6h8M15 6h2M3 14h2M9 14h8"/><circle cx="13" cy="6" r="2"/><circle cx="7" cy="14" r="2"/></svg>',
    film: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M7 5v14M17 5v14M3 9h4M3 15h4M17 9h4M17 15h4"/></svg>',
    wave: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><path d="M4 10v4M8 7v10M12 4v16M16 8v8M20 11v2"/></svg>',
    photo: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="M4 18l5-5 4 4 3-3 4 4"/></svg>',
    folder: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M2 4.5A1.5 1.5 0 0 1 3.5 3h3l1.5 1.5h4.5A1.5 1.5 0 0 1 14 6v5.5a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 2 11.5z"/></svg>',
  };

  // ---------- Dados fixos ----------

  const AUDIO_T = new Set(['mp3', 'wav', 'm4a', 'flac', 'ogg', 'opus']);
  const KIND = { image: 'Imagem', video: 'Vídeo', audio: 'Áudio' };
  const CAT_PLURAL = { image: 'Imagens', video: 'Vídeos', audio: 'Áudios' };
  const FORMAT_LIST = {
    image: 'JPG PNG WebP AVIF TIFF GIF BMP ICO SVG',
    video: 'MP4 MKV MOV AVI WebM WMV FLV MPG TS 3GP',
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
  const CUSTOM_HELP = 'Ajuste manual: o tamanho final acompanha o controle de qualidade.';

  const RESIZE = [['original', 'Original'], [3840, '3840 px (4K)'], [2560, '2560 px'], [1920, '1920 px (Full HD)'], [1280, '1280 px'], [800, '800 px']];
  const RESOLUTION = [['original', 'Original'], [2160, '4K (2160p)'], [1440, '1440p'], [1080, '1080p (Full HD)'], [720, '720p'], [480, '480p']];
  const ENGINE = [['auto', 'Automático', 'Usa a placa de vídeo quando ela der conta do formato.'], ['gpu', 'Placa de vídeo', 'Mais rápido.'], ['cpu', 'Processador', 'Mais lento, comprime um pouco melhor.']];
  const CODEC = [['h264', 'H.264'], ['h265', 'H.265']];
  const BG = [['wave', 'Onda sonora'], ['cover', 'Capa'], ['black', 'Preto']];

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
  function kindsPresent() {
    const s = new Set(okItems().map(kindOf));
    return ['image', 'video', 'audio'].filter((k) => s.has(k));
  }
  function catsPresent() {
    const s = new Set(okItems().map((i) => i.category));
    return ['image', 'video', 'audio'].filter((k) => s.has(k));
  }
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

  // ---------- Toast ----------

  let toastTimer = null;
  function toast(msg, ms = 3400) {
    toastEl.textContent = msg;
    toastEl.hidden = false;
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
        const el = document.querySelector(`[data-id="${it.id}"] .thumb, .q-file .thumb[data-tid="${it.id}"]`);
        if (el && it.thumb) { el.insertAdjacentHTML('afterbegin', `<img src="${it.thumb}" alt="">`); el.querySelector('svg')?.remove(); }
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
    let before = 0, after = 0, approx = false, missing = false;
    for (const it of okItems()) {
      before += it.size;
      if (it.status === 'done' && it.outSize) after += it.outSize;
      else if (it.est && !it.est.error) { after += it.est.bytes; approx = approx || !!it.est.approx; }
      else missing = true;
    }
    return { before, after, approx, missing };
  }

  // ---------- Render principal ----------

  function render() {
    closeMenu();
    const scroll = document.getElementById('list')?.scrollTop || 0;
    if (MODE === 'quick') renderQuick();
    else renderMain();
    const list = document.getElementById('list');
    if (list) list.scrollTop = scroll;
  }

  function titlebar() {
    return `<header class="titlebar">
      <span class="wordmark" aria-label="minime"><span>m</span><span>i</span><span>n</span><span>i</span><span>m</span><span>e</span></span>
      <span class="spacer"></span>
      <button class="icon-btn" data-act="about" title="Sobre e ajustes do MINIME" aria-label="Sobre e ajustes">${I.gear}</button>
    </header>`;
  }

  function renderMain() {
    const has = state.items.length > 0;
    app.innerHTML = `${titlebar()}
      <main class="workspace ${has ? '' : 'empty'}">${has ? filesPane() + panel() : emptyState()}</main>
      ${has ? footer() : ''}`;
    if (has) { renderMeter(true); updateOverall(); }
  }

  function credit() {
    return `<span class="credit">Criado por Alan Moreira. <button data-act="site" title="Abrir alanmore.com.br">alanmore.com.br</button></span>`;
  }

  function emptyState() {
    return `<section class="empty-state">
      <div class="drop-target">
        <span class="crop tl"></span><span class="crop tr"></span><span class="crop bl"></span><span class="crop br"></span>
        <h1 class="empty-title">Solte aqui suas imagens, vídeos e áudios.</h1>
        <p class="empty-sub">Um arquivo, vários ou uma pasta inteira. Você escolhe o formato de cada um e vê o tamanho final antes de converter.</p>
        <div class="empty-actions">
          <button class="btn primary big" data-act="add">${I.plus}Escolher arquivos</button>
        </div>
        <div class="formats">
          ${['image', 'video', 'audio'].map((k) => `<div class="formats-row"><b><span class="swatch ${k}"></span>${KIND[k]}</b><span>${FORMAT_LIST[k]}</span></div>`).join('')}
        </div>
        <p class="empty-sub" style="margin:22px 0 0;font-size:12.5px">${credit()}</p>
      </div>
    </section>`;
  }

  function filesPane() {
    const n = state.items.length;
    return `<section class="files">
      <div class="files-head">
        <h2>Arquivos<span class="count">${nf0.format(n)}</span></h2>
        <span class="spacer"></span>
        <button class="btn ghost small" data-act="add" ${state.phase === 'converting' ? 'disabled' : ''}>${I.plus}Adicionar</button>
        <button class="btn ghost small" data-act="clear" ${state.phase === 'converting' ? 'disabled' : ''}>Limpar lista</button>
      </div>
      <div class="bulk">${bulk()}</div>
      <div class="list" id="list">${state.items.map(rowHtml).join('')}</div>
    </section>`;
  }

  function bulk() {
    const cats = catsPresent();
    if (!cats.length) return '<span>Nenhum arquivo válido na lista.</span>';
    return `<span>Converter todos:</span>${cats.map((c) => {
      const its = okItems().filter((i) => i.category === c);
      const ts = new Set(its.map((i) => i.target));
      const label = ts.size === 1 ? targetLabel(its[0]) : 'Vários';
      return `<span class="bulk-item"><span class="swatch ${c}"></span>${CAT_PLURAL[c]}
        <button class="select inline" data-menu="bulk" data-cat="${c}" ${state.phase === 'converting' ? 'disabled' : ''}><span class="lbl">${esc(label)}</span>${I.chev}</button></span>`;
    }).join('')}`;
  }

  function thumbHtml(it, attrs = '') {
    const icon = it.category === 'video' ? I.film : it.category === 'audio' ? I.wave : I.photo;
    const checker = it.category === 'image' ? 'checker' : '';
    const inner = it.thumb ? `<img src="${it.thumb}" alt="">` : icon;
    return `<div class="thumb ${checker}" ${attrs}>${inner}<span class="tag ${it.category}">${esc(it.ext.toUpperCase())}</span></div>`;
  }

  function rowState(it) {
    if (!it.ok) return `<small class="err">${esc(it.error)}</small>`;
    if (it.status === 'running') return `<small class="state">Convertendo… ${Math.round((it.progress || 0) * 100)}%</small>`;
    if (it.status === 'queued') return '<small class="state">Na fila</small>';
    if (it.status === 'done') return `<small class="state">Pronto. <button class="show-btn" data-act="show" data-id="${it.id}">Mostrar na pasta</button></small>`;
    if (it.status === 'error') return `<small class="err">${esc(it.convError || 'Falhou.')}</small>`;
    if (it.status === 'cancelled') return '<small class="state">Cancelado</small>';
    if (it.est && it.est.error) return `<small class="err">${esc(it.est.error)}</small>`;
    return `<small>${esc(it.meta)}</small>`;
  }

  function sizesHtml(it) {
    if (!it.ok) return `<div>${fmtBytes(it.size)}</div>`;
    let after, approx = false;
    if (it.status === 'done') after = it.outSize;
    else if (it.est && !it.est.error) { after = it.est.bytes; approx = it.est.approx; }
    if (after === undefined || after === null) return `<div>${fmtBytes(it.size)}</div><div class="pending">calculando…</div>`;
    const d = delta(it.size, after);
    return `<div>${fmtBytes(it.size)}</div><div><span class="after num">${approx ? '~' : ''}${fmtBytes(after)}</span> ${d ? `<span class="delta ${d.up ? 'up' : ''}">${d.text}</span>` : ''}</div>`;
  }

  function rowHtml(it) {
    const cls = [it.status === 'done' ? 'done' : '', it.status === 'error' || !it.ok ? 'failed' : ''].join(' ');
    const busy = state.phase === 'converting';
    return `<div class="row ${cls}" data-id="${it.id}" data-kind="${it.ok ? kindOf(it) : ''}">
      ${thumbHtml(it)}
      <div class="name"><b title="${esc(it.path)}">${esc(it.name)}</b>${rowState(it)}</div>
      <div class="sizes num">${sizesHtml(it)}</div>
      <div>${it.ok ? `<button class="select" data-menu="row" data-id="${it.id}" ${busy || it.status === 'done' ? 'disabled' : ''} aria-label="Formato de saída de ${esc(it.name)}"><span class="lbl">${esc(targetLabel(it))}</span>${I.chev}</button>` : ''}</div>
      <button class="icon-btn" data-act="remove" data-id="${it.id}" title="Tirar da lista" aria-label="Tirar ${esc(it.name)} da lista" ${busy ? 'disabled' : ''}>${I.x}</button>
      <div class="row-progress"><i style="width:${it.status === 'running' || it.status === 'done' ? Math.round((it.progress || 0) * 100) : 0}%"></i></div>
    </div>`;
  }

  function updateRow(it) {
    if (MODE === 'quick') return;
    const el = document.querySelector(`.row[data-id="${it.id}"]`);
    if (!el) return;
    el.classList.toggle('done', it.status === 'done');
    el.classList.toggle('failed', it.status === 'error' || !it.ok);
    el.querySelector('.name small')?.replaceWith(htmlEl(rowState(it)));
    el.querySelector('.sizes').innerHTML = sizesHtml(it);
    const bar = el.querySelector('.row-progress i');
    if (bar) bar.style.width = `${it.status === 'running' || it.status === 'done' ? Math.round((it.progress || 0) * 100) : 0}%`;
  }
  function htmlEl(html) { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; }

  // ---------- Painel de ajustes ----------

  function panel() {
    return `<aside class="panel">
      <div class="tabs" role="tablist" id="tabs">${tabsHtml()}</div>
      <div class="settings" id="settings">${state.tab ? settingsFor(state.tab) : ''}</div>
      <section class="meter" id="meter"></section>
    </aside>`;
  }

  function tabsHtml() {
    return kindsPresent().map((k) => `<button class="tab" role="tab" data-tab="${k}" aria-selected="${state.tab === k}"><span class="swatch ${k}"></span>${KIND[k]}</button>`).join('');
  }

  function seg(path, options, current, extra = {}) {
    return `<div class="seg" data-seg="${path}" role="group">${options.map(([v, label, disabled, title]) =>
      `<button type="button" data-v="${v}" aria-pressed="${String(v) === String(current)}" ${disabled ? 'disabled' : ''} ${title ? `title="${esc(title)}"` : ''}>${esc(label)}</button>`).join('')}</div>`;
  }

  function selectBtn(menu, label, disabled = false) {
    return `<button class="select" data-menu="${menu}" ${disabled ? 'disabled' : ''}><span class="lbl">${esc(label)}</span>${I.chev}</button>`;
  }

  function rangeField(path, value, label, disabled, note) {
    return `<div class="field">
      <label>${label}<span class="value" data-value="${path}">${valueText(path)}</span></label>
      <input type="range" class="range" data-range="${path}" min="0" max="100" step="1" value="${value}" style="--pct:${value}%" ${disabled ? 'disabled' : ''} aria-label="${label}">
      <div class="range-scale"><span>Menor arquivo</span><span>Mais qualidade</span></div>
      ${note ? `<p class="help note">${esc(note)}</p>` : ''}
    </div>`;
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
      if (d.remux) return 'sem recodificar';
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
    if (cpuOnly) return { on: false, text: `Processador (${hw.cpu}). WebM, AVI e GIF não usam a placa de vídeo.` };
    if (s.engine === 'cpu') return { on: false, text: `Processador: ${hw.cpu}` };
    if (!enc) return { on: false, text: hw.gpuLabel ? `${hw.gpuLabel} não codifica ${s.codec === 'h265' ? 'H.265' : 'H.264'}. Usando o processador.` : `Nenhuma placa de vídeo compatível. Usando o processador (${hw.cpu}).` };
    return { on: true, text: `Placa de vídeo: ${hw.gpuLabel}` };
  }

  function settingsFor(kind) {
    const s = state.settings;
    const caps = state.caps[kind] || { slider: true };
    if (kind === 'image') {
      const o = OBJ.image.find((x) => x.v === s.image.objective);
      return `
        <div class="field"><div class="label">Objetivo</div>
          ${seg('image.objective', OBJ.image.map((x) => [x.v, x.label]), s.image.objective)}
          <p class="help" data-help="image">${esc(o ? o.help : CUSTOM_HELP)}</p></div>
        ${rangeField('image.quality', s.image.quality, 'Qualidade', !caps.slider, caps.note)}
        <div class="field"><label>Tamanho máximo <span>lado maior</span></label>
          ${selectBtn('image.resize', (RESIZE.find(([v]) => String(v) === String(s.image.resize)) || RESIZE[0])[1])}</div>
        <label class="toggle"><b>Remover dados ocultos</b><small>EXIF, GPS e modelo da câmera</small>
          <span class="switch"><input type="checkbox" data-check="image.stripMetadata" ${s.image.stripMetadata ? 'checked' : ''}><i></i></span></label>`;
    }
    if (kind === 'video') {
      const o = OBJ.video.find((x) => x.v === s.video.objective);
      const vids = okItems().filter((i) => kindOf(i) === 'video');
      const showCodec = vids.some((i) => ['mp4', 'mkv', 'mov'].includes(i.target));
      const copy = s.video.objective === 'copy' && caps.remux;
      const eng = engineInfo();
      const notAllRemux = copy && !caps.remuxAll;
      const pureCopy = copy && caps.remuxAll && s.video.resolution === 'original';
      return `
        <div class="field"><div class="label">Objetivo</div>
          ${seg('video.objective', OBJ.video.map((x) => [x.v, x.label, x.v === 'copy' && !caps.remux, x.v === 'copy' && !caps.remux ? 'Esse vídeo precisa ser recodificado pra esse formato.' : '']), s.video.objective === 'copy' && !caps.remux ? 'balanced-x' : s.video.objective)}
          <p class="help" data-help="video">${esc(o ? (o.v === 'copy' && !caps.remux ? 'Pra esse formato o vídeo precisa ser recodificado.' : o.help) : CUSTOM_HELP)}${notAllRemux ? ' Alguns arquivos vão ser recodificados.' : ''}</p></div>
        ${rangeField('video.quality', s.video.quality, 'Qualidade', pureCopy, pureCopy ? 'Sem recodificar, a qualidade fica idêntica à do original.' : null)}
        <div class="field"><label>Resolução</label>
          ${selectBtn('video.resolution', (RESOLUTION.find(([v]) => String(v) === String(s.video.resolution)) || RESOLUTION[0])[1])}
          ${copy && s.video.resolution !== 'original' ? '<p class="help">Mudar a resolução obriga a recodificar o vídeo.</p>' : ''}</div>
        ${showCodec && !pureCopy ? `<div class="field"><div class="label">Codec</div>${seg('video.codec', CODEC, s.video.codec)}
          <p class="help">${s.video.codec === 'h265' ? 'Uns 35% menor que o H.264. Aparelho e programa antigo podem não abrir.' : 'Abre em qualquer aparelho, navegador e editor.'}</p></div>` : ''}
        ${pureCopy ? '' : `<div class="field"><label>Motor de conversão</label>
          ${selectBtn('video.engine', (ENGINE.find(([v]) => v === s.video.engine) || ENGINE[0])[1])}
          <div class="engine-line"><span class="dot ${eng.on ? 'on' : ''}"></span><span>${esc(eng.text)}</span></div></div>`}`;
    }
    if (kind === 'audio') {
      const auds = okItems().filter((i) => kindOf(i) === 'audio');
      const toVideo = auds.some((i) => i.category === 'audio' && i.target === 'mp4');
      const anyCover = auds.some((i) => i.hasCover);
      return `
        ${rangeField('audio.quality', s.audio.quality, 'Qualidade', !caps.slider, caps.note)}
        <p class="help" style="margin-top:-8px">Se o original for mais leve que o escolhido, o MINIME segura no bitrate dele: acima disso o arquivo só engorda.</p>
        ${toVideo ? `<div class="field"><div class="label">Fundo do vídeo</div>
          ${seg('audio.background', BG.map(([v, l]) => [v, l, v === 'cover' && !anyCover, v === 'cover' && !anyCover ? 'Esse áudio não tem capa.' : '']), s.audio.background === 'cover' && !anyCover ? 'wave' : s.audio.background)}
          <p class="help">Áudio em MP4 vira vídeo 1280 × 720 (capa em 1080 × 1080), pronto pra rede social.</p></div>` : ''}`;
    }
    return '';
  }

  function renderSettings() {
    const host = document.getElementById('settings');
    if (!host) return;
    if (MODE === 'quick') {
      const kinds = kindsPresent();
      host.innerHTML = kinds.map((k) => (kinds.length > 1 ? `<div class="label" style="font-weight:700">${KIND[k]}</div>` : '') + settingsFor(k)).join('');
      return;
    }
    const tabs = document.getElementById('tabs');
    if (tabs) tabs.innerHTML = tabsHtml();
    host.innerHTML = state.tab ? settingsFor(state.tab) : '';
  }

  // ---------- Medidor ----------

  const shown = { before: 0, after: 0 };
  let tweenRaf = null;
  function renderMeter(fresh = false) {
    const el = document.getElementById('meter');
    if (!el) return;
    const t = totals();
    const n = okItems().length;
    const isDone = state.phase === 'done';
    if (fresh || !el.dataset.ready) {
      el.dataset.ready = '1';
      el.innerHTML = `
        <div class="meter-head"><span>${MODE === 'quick' ? 'Simulação' : plural(n, 'arquivo', 'arquivos')}</span><span data-m="kind"></span></div>
        <div class="meter-line before"><span>Antes</span><b class="figure num" data-m="before"></b></div>
        <div class="bar before"><i data-m="bbar"></i></div>
        <div class="meter-line after"><span>${isDone ? 'Depois' : 'Depois'}</span><span><b class="figure num" data-m="after"></b><span class="delta" data-m="delta"></span></span></div>
        <div class="bar after" data-m="abarwrap"><i data-m="abar"></i></div>
        <div class="caption" data-m="caption"></div>`;
    }
    const q = (k) => el.querySelector(`[data-m="${k}"]`);
    el.classList.toggle('calculating', state.estimating && !isDone);
    const head = el.querySelector('.meter-head span');
    if (head && MODE !== 'quick') head.textContent = plural(n, 'arquivo', 'arquivos');
    const max = Math.max(t.before, t.after, 1);
    q('bbar').style.width = `${(t.before / max) * 100}%`;
    q('abar').style.width = `${t.after ? Math.max(1.5, (t.after / max) * 100) : 0}%`;
    const d = delta(t.before, t.after);
    q('abarwrap').classList.toggle('up', !!(d && d.up));
    const dEl = q('delta');
    dEl.textContent = d && t.after ? d.text : '';
    dEl.className = `delta ${d && d.up ? 'up' : ''}`;
    q('caption').textContent = isDone
      ? 'Tamanho real dos arquivos convertidos.'
      : !t.after ? 'Calculando o tamanho final…'
        : t.approx ? 'Estimativa pelo bitrate escolhido. O tamanho exato sai na conversão.'
          : 'Tamanho exato, calculado agora com as opções atuais.';
    tween(q('before'), q('after'), t, t.approx && !isDone);
  }

  function tween(bEl, aEl, t, approx) {
    cancelAnimationFrame(tweenRaf);
    const from = { ...shown };
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const start = performance.now();
    const dur = reduce ? 0 : 380;
    const step = (now) => {
      const k = dur ? Math.min(1, (now - start) / dur) : 1;
      const e = 1 - Math.pow(1 - k, 3);
      shown.before = from.before + (t.before - from.before) * e;
      shown.after = from.after + (t.after - from.after) * e;
      bEl.textContent = fmtBytes(shown.before);
      aEl.textContent = t.after ? `${approx ? '~' : ''}${fmtBytes(shown.after)}` : '–';
      if (k < 1) tweenRaf = requestAnimationFrame(step);
    };
    tweenRaf = requestAnimationFrame(step);
  }

  // ---------- Rodapé ----------

  function destHtml() {
    const d = state.dest;
    const chip = d.mode === 'folder' && d.folder
      ? `<span class="path-chip" title="${esc(d.folder)}">${I.folder}<span>${esc(d.folder)}</span><button data-act="pick-folder">Trocar</button></span>` : '';
    return `<span class="label">Salvar em</span>${seg('dest.mode', [['same', 'Mesma pasta'], ['folder', 'Outra pasta…']], d.mode === 'folder' && d.folder ? 'folder' : 'same')}${chip}`;
  }

  function footer() {
    const n = pendingItems().length;
    let left = destHtml(), cta = '';
    if (state.phase === 'converting') {
      left = '<div class="result"><b>Convertendo</b><span class="num" id="overall-text"></span></div>';
      cta = '<button class="btn big" data-act="cancel">Cancelar</button>';
    } else if (state.phase === 'done' && state.summary) {
      const s = state.summary;
      const saved = s.inBytes - s.outBytes;
      const msg = s.error ? s.error
        : `${plural(s.done, 'arquivo convertido', 'arquivos convertidos')}${s.failed ? `, ${s.failed} com erro` : ''}${s.cancelled ? `, ${s.cancelled} cancelado${s.cancelled > 1 ? 's' : ''}` : ''}`;
      const sub = s.done ? (saved >= 0 ? `${fmtBytes(saved)} a menos` : `${fmtBytes(-saved)} a mais`) : '';
      left = `<div class="result"><b>${s.done ? 'Pronto.' : 'Não deu certo.'}</b><span>${esc(msg)}${sub ? `. ${sub}.` : '.'}</span></div>`;
      cta = `${s.folders && s.folders.length ? `<button class="btn" data-act="open-out">${I.folder}Abrir pasta</button>` : ''}
        <button class="btn primary big" data-act="new">Nova conversão</button>`;
    } else {
      cta = `<button class="btn primary big" data-act="convert" ${n ? '' : 'disabled'}>Converter ${plural(n, 'arquivo', 'arquivos')}</button>`;
    }
    return `<footer class="footer">
      <div class="overall"><i id="overall"></i></div>
      <div class="dest">${left}</div>
      ${credit()}
      <div class="cta">${cta}</div>
    </footer>`;
  }

  function updateOverall() {
    const its = okItems().filter((i) => i.status);
    const bar = document.getElementById('overall');
    const txt = document.getElementById('overall-text');
    if (!its.length) { if (bar) bar.style.width = '0'; return; }
    const p = its.reduce((s, i) => s + (i.status === 'done' || i.status === 'error' || i.status === 'cancelled' ? 1 : i.progress || 0), 0) / its.length;
    if (bar) bar.style.width = `${state.phase === 'converting' ? p * 100 : 0}%`;
    const finished = its.filter((i) => ['done', 'error', 'cancelled'].includes(i.status)).length;
    if (txt) txt.textContent = `${nf0.format(finished)} de ${nf0.format(its.length)} prontos`;
    const qb = document.getElementById('q-bar');
    if (qb) qb.style.width = `${p * 100}%`;
    const qt = document.getElementById('q-text');
    if (qt) {
      const run = its.find((i) => i.status === 'running');
      qt.textContent = its.length > 1 ? `${nf0.format(finished)} de ${nf0.format(its.length)} prontos${run ? `. Agora: ${run.name}` : ''}` : `${Math.round(p * 100)}%`;
    }
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
      opts.push({ v: t.id, label: t.label, hint: someSame && its.length > 1 ? `${t.hint.replace('Mesmo formato, só comprime.', '')} Os ${t.label} da seleção só são comprimidos.`.trim() : t.hint });
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
    let body = '';
    if (!first) {
      body = `<p class="empty-sub" style="margin:0">${state.loading ? 'Lendo o arquivo…' : 'Nenhum arquivo compatível.'}</p>`;
    } else {
      const total = its.reduce((s, i) => s + i.size, 0);
      const stack = its.slice(0, 3).map((i) => thumbHtml(i, `data-tid="${i.id}"`)).join('');
      const fileBlock = `<div class="q-file"><div class="stack">${stack || thumbHtml(first)}</div><div style="min-width:0">
        <b title="${esc(first.path)}">${esc(first.name)}</b>
        <small>${its.length > 1 ? `e mais ${plural(its.length - 1, 'arquivo', 'arquivos')}. ${fmtBytes(total)} no total` : `${esc(first.meta)}. ${fmtBytes(first.size)}`}</small>
        ${bad.length ? `<small class="err" style="display:block;color:var(--danger)">${plural(bad.length, 'arquivo ignorado', 'arquivos ignorados')}: ${esc(bad[0].error)}</small>` : ''}
      </div></div>`;
      if (state.phase === 'converting') {
        body = `${fileBlock}<div class="q-progress"><div class="bigbar"><i id="q-bar"></i></div><p id="q-text">Começando…</p></div>`;
      } else if (state.phase === 'done' && state.summary) {
        const s = state.summary;
        const failed = its.filter((i) => i.status === 'error');
        const d = delta(s.inBytes, s.outBytes);
        body = `<div class="q-done">
          <b>${s.done ? 'Pronto.' : 'Não deu certo.'}</b>
          ${s.done ? `<p class="num">${fmtBytes(s.inBytes)} viraram ${fmtBytes(s.outBytes)}${d ? ` (${d.text})` : ''}. ${plural(s.done, 'arquivo salvo', 'arquivos salvos')}.</p>` : ''}
          ${failed.map((i) => `<p class="err">${esc(i.name)}: ${esc(i.convError)}</p>`).join('')}
        </div>`;
      } else {
        body = `${fileBlock}
          <div class="q-target"><span class="label">Converter para</span>${selectBtn('quick', quickLabel())}</div>
          <div class="settings" id="settings"></div>
          <section class="meter" id="meter"></section>
          <div class="q-dest"><span class="label">Salvar em</span>${seg('dest.mode', [['same', 'Mesma pasta'], ['folder', 'Outra pasta…']], state.dest.mode === 'folder' && state.dest.folder ? 'folder' : 'same')}
            ${state.dest.mode === 'folder' && state.dest.folder ? `<span class="path-chip" title="${esc(state.dest.folder)}">${I.folder}<span>${esc(state.dest.folder)}</span><button data-act="pick-folder">Trocar</button></span>` : ''}</div>`;
      }
    }
    let actions;
    if (state.phase === 'converting') actions = '<span></span><button class="btn big" data-act="cancel">Cancelar</button>';
    else if (state.phase === 'done') actions = `<button class="btn" data-act="open-out">${I.folder}Mostrar na pasta</button><button class="btn primary big" data-act="close">Fechar</button>`;
    else actions = `<button class="btn ghost" data-act="full" ${its.length ? '' : 'disabled'}>Abrir no app completo</button><button class="btn primary big" data-act="convert" ${its.length ? '' : 'disabled'}>Converter</button>`;
    app.innerHTML = `${titlebar()}<main class="quick"><div class="quick-inner">${body}</div></main>
      <div class="q-bottom"><div class="q-actions">${actions}</div><div class="q-credit">${credit()}</div></div>`;
    observeQuick();
    renderSettings();
    renderMeter(true);
    updateOverall();
  }

  // ---------- Menus (popover) ----------

  let menu = null;
  function openMenu(anchor, options, current, onPick) {
    closeMenu();
    popover.innerHTML = options.map((o, i) => o.sep ? '<div class="opt-sep"></div>'
      : `<button class="opt ${String(o.v) === String(current) ? 'active' : ''}" role="option" data-i="${i}" ${o.disabled ? 'disabled' : ''}>
          <b>${esc(o.label)}</b>${String(o.v) === String(current) ? '<span class="check">✓</span>' : '<span></span>'}${o.hint ? `<small>${esc(o.hint)}</small>` : ''}</button>`).join('');
    showPopover(anchor);
    menu = { anchor, options, onPick };
    (popover.querySelector('.opt.active') || popover.querySelector('.opt:not(:disabled)'))?.focus();
  }
  function showPopover(anchor, minWidth = 220) {
    popover.hidden = false;
    const r = anchor.getBoundingClientRect();
    const w = Math.max(r.width, minWidth);
    popover.style.minWidth = `${w}px`;
    const ph = popover.offsetHeight;
    const pw = popover.offsetWidth;
    let top = r.bottom + 6;
    let up = false;
    if (top + ph > innerHeight - 8 && r.top - ph - 6 > 8) { top = r.top - ph - 6; up = true; }
    popover.classList.toggle('up', up);
    popover.style.top = `${Math.max(8, top)}px`;
    popover.style.left = `${Math.max(8, Math.min(r.right - pw, innerWidth - pw - 8, r.left))}px`;
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
    if (kind === 'quick') {
      return { options: quickTargetOptions(), current: state.quickTarget, pick: (v) => { state.quickTarget = v; setTarget(okItems(), v); } };
    }
    if (kind === 'image.resize') return { options: RESIZE.map(([v, l]) => ({ v, label: l })), current: s.image.resize, pick: (v) => setSetting('image', { resize: v === 'original' ? 'original' : Number(v) }) };
    if (kind === 'video.resolution') return { options: RESOLUTION.map(([v, l]) => ({ v, label: l, hint: v === 'original' ? 'Mantém a resolução do arquivo.' : 'Nunca aumenta: vídeo menor fica como está.' })), current: s.video.resolution, pick: (v) => setSetting('video', { resolution: v === 'original' ? 'original' : Number(v) }) };
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
      document.querySelector('.bulk').innerHTML = bulk();
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

  // ---------- Sobre (engrenagem) ----------

  async function openAbout(anchor) {
    closeMenu();
    const hw = state.hw;
    if (state.menuOn === null) { try { state.menuOn = await api.menuStatus(); } catch { state.menuOn = false; } }
    popover.innerHTML = `<div class="about">
      <span class="wordmark" aria-label="minime"><span>m</span><span>i</span><span>n</span><span>i</span><span>m</span><span>e</span></span>
      <p>Converte e encolhe imagens, vídeos e áudios. Versão ${esc(state.version)}.</p>
      <label class="toggle"><b>Menu do botão direito</b><small>"Converter com MINIME" no Explorer</small>
        <span class="switch"><input type="checkbox" data-check="menu" ${state.menuOn ? 'checked' : ''}><i></i></span></label>
      <p>No Windows 11 o menu aparece em <b>Mostrar mais opções</b> (ou Shift + F10).</p>
      <hr>
      <p>Motor de vídeo: ${hw ? esc(hw.h264 ? `${hw.gpuLabel} (${hw.h264.split('_')[1].toUpperCase()}) e ${hw.cpu}` : hw.cpu) : 'detectando…'}</p>
      <p>Imagens: libvips com mozjpeg. Vídeo e áudio: FFmpeg.</p>
      <hr>
      <p>${credit()}</p>
    </div>`;
    showPopover(anchor, 300);
    menu = { about: true };
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
    if (menu && menu.about && popover.contains(e.target) && !e.target.closest('[data-act="site"]')) return;

    const menuEl = e.target.closest('[data-menu]');
    if (menuEl && !menuEl.disabled) {
      if (menu && menu.anchor === menuEl) { closeMenu(); return; }
      const m = menuFor(menuEl);
      if (m) openMenu(menuEl, m.options, m.current, m.pick);
      return;
    }
    if (!popover.contains(e.target)) closeMenu();

    const segBtn = e.target.closest('[data-seg] button');
    if (segBtn && !segBtn.disabled) return onSeg(segBtn.closest('[data-seg]').dataset.seg, segBtn.dataset.v);

    const tab = e.target.closest('[data-tab]');
    if (tab) { state.tab = tab.dataset.tab; renderSettings(); return; }

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
      case 'about': if (menu && menu.about) closeMenu(); else openAbout(act); break;
      case 'full': api.openFull(state.items.map((i) => i.path)); break;
      case 'close': api.close(); break;
      default: break;
    }
  });

  function rerenderDest() {
    if (MODE === 'quick') { render(); return; }
    const d = document.querySelector('.footer .dest');
    if (d) d.innerHTML = destHtml();
  }

  async function onSeg(path, v) {
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
        document.querySelectorAll(`[data-seg="${kind}.objective"] button`).forEach((b) => b.setAttribute('aria-pressed', 'false'));
        const help = document.querySelector(`[data-help="${kind}"]`);
        if (help) help.textContent = CUSTOM_HELP;
        if (wasLossless) refreshCaps();
      }
    }
    if (kind === 'image') document.querySelector('[data-value="image.quality"]').textContent = `${v}%`;
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
    state.settings[kind][key] = c.checked;
    saveSettings();
    scheduleEstimate(0);
  });

  document.addEventListener('keydown', (e) => {
    if (!popover.hidden) {
      if (e.key === 'Escape') { const a = menu && menu.anchor; closeMenu(); a?.focus(); e.preventDefault(); return; }
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        const opts = [...popover.querySelectorAll('.opt:not(:disabled)')];
        const i = opts.indexOf(document.activeElement);
        const n = e.key === 'ArrowDown' ? (i + 1) % opts.length : (i - 1 + opts.length) % opts.length;
        opts[n]?.focus();
        e.preventDefault();
      }
    }
  });
  window.addEventListener('resize', closeMenu);
  window.addEventListener('blur', () => { if (!(menu && menu.about)) closeMenu(); });

  // Arrastar e soltar (arquivos e pastas)
  let dragDepth = 0;
  const hasFiles = (e) => e.dataTransfer && [...e.dataTransfer.types].includes('Files');
  window.addEventListener('dragenter', (e) => { if (!hasFiles(e)) return; e.preventDefault(); dragDepth++; if (state.phase !== 'converting') dropEl.hidden = false; });
  window.addEventListener('dragover', (e) => { e.preventDefault(); if (e.dataTransfer) e.dataTransfer.dropEffect = state.phase === 'converting' ? 'none' : 'copy'; });
  window.addEventListener('dragleave', () => { dragDepth = Math.max(0, dragDepth - 1); if (!dragDepth) dropEl.hidden = true; });
  window.addEventListener('drop', (e) => {
    e.preventDefault(); dragDepth = 0; dropEl.hidden = true;
    const files = e.dataTransfer ? [...e.dataTransfer.files] : [];
    addPaths(files.map((f) => api.pathForFile(f)).filter(Boolean));
  });

  // Janela rápida acompanha a altura do conteúdo (o processo principal limita à área útil da tela).
  let quickRO = null;
  function observeQuick() {
    if (!quickRO) {
      quickRO = new ResizeObserver(() => {
        const inner = document.querySelector('.quick-inner');
        const top = document.querySelector('.titlebar');
        const bottom = document.querySelector('.q-bottom');
        if (inner && top && bottom) api.fitHeight(Math.ceil(top.offsetHeight + inner.scrollHeight + bottom.offsetHeight));
      });
    }
    quickRO.disconnect();
    const inner = document.querySelector('.quick-inner');
    if (inner) quickRO.observe(inner);
  }

  // ---------- Início ----------

  (async () => {
    render();
    api.info().then((i) => { state.version = i.version; });
    api.hardware().then((hw) => { state.hw = hw; renderSettings(); }).catch(() => {});
    const l = await api.getLaunch();
    if (l.mode === 'quick') state.quickTarget = l.target;
    if (l.files && l.files.length) await addPaths(l.files);
    else render();
    api.onLaunchAdd((d) => addPaths(d.files));
  })();
})();
