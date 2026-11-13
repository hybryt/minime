'use strict';
// Processo principal: janelas, instância única (junta vários arquivos do botão direito) e ponte com o motor.
const { app, BrowserWindow, ipcMain, dialog, shell, nativeTheme, Menu, screen } = require('electron');
const path = require('node:path');
const fs = require('node:fs');
const { execFileSync } = require('node:child_process');
const jobs = require('./engine/jobs');
const ff = require('./engine/ffmpeg');
const updater = require('./updater');
const hardware = require('./engine/hardware');
const F = require('./engine/formats');
const shellMenu = require('./shell');

const SITE = 'https://alanmore.com.br';
const RENDERER = path.join(__dirname, '..', 'renderer', 'index.html');
const ICON = path.join(__dirname, '..', 'renderer', 'assets', 'icon.png');

const IS_MAC = process.platform === 'darwin';
const IS_WIN = process.platform === 'win32';

app.setAppUserModelId('br.com.alanmore.minime');

// Mac: arquivos chegam pelo Finder ("Abrir com", arrastar no ícone do Dock), não pela linha de comando.
let started = false;
const openQueue = [];
app.on('open-file', (e, file) => {
  e.preventDefault();
  if (app.isReady() && started) handleLaunch({ mode: 'open', files: [file] });
  else openQueue.push(file);
});

// ---------- Argumentos ----------
// MINIME.exe --quick webp "C:\foto.jpg"   (menu do botão direito)
// MINIME.exe --open "C:\foto.jpg"         (Mais opções / Abrir com)
function parseArgs(argv) {
  const args = argv.slice(app.isPackaged ? 1 : 2);
  const out = { mode: null, target: null, files: [] };
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === '--quick') { out.mode = 'quick'; out.target = String(args[++i] || '').toLowerCase(); continue; }
    if (a === '--open') { out.mode = out.mode || 'open'; continue; }
    if (a === '--login') { out.login = true; continue; }
    if (a === '--register-shell') { out.mode = 'register'; continue; }
    if (a === '--unregister-shell') { out.mode = 'unregister'; continue; }
    if (a.startsWith('--')) continue;
    try { if (fs.existsSync(a)) out.files.push(path.resolve(a)); } catch {}
  }
  return out;
}

const launch = parseArgs(process.argv);

function shellCommand() {
  return shellMenu.launchCommand(app.isPackaged, process.execPath, app.getAppPath());
}

if (launch.mode === 'register' || launch.mode === 'unregister') {
  app.whenReady().then(async () => {
    try { await (launch.mode === 'register' ? shellMenu.register(shellCommand()) : shellMenu.unregister()); } catch {}
    app.exit(0);
  });
} else if (!app.requestSingleInstanceLock({ launch })) {
  app.exit(0);
} else {
  app.on('second-instance', (_e, argv, _cwd, data) => {
    handleLaunch(data && data.launch ? data.launch : parseArgs(argv));
  });
  app.whenReady().then(start);
}

// ---------- Hardware (detectado em segundo plano, com cache) ----------

let hwPromise = null;
function getHardware() {
  if (!hwPromise) {
    hwPromise = hardware.detect(path.join(app.getPath('userData'), 'hardware.json'))
      .then((h) => { jobs.setHardware(h); return h; })
      .catch(() => null);
  }
  return hwPromise;
}

// ---------- Janelas ----------

let mainWin = null;
const quickWins = new Map(); // webContents.id -> { win, target, createdAt, started }
const pending = new Map(); // webContents.id -> dados de abertura

// Cor de fundo da janela (aparece antes do HTML carregar) e dos botões nativos de fechar e minimizar.
function palette() {
  return nativeTheme.shouldUseDarkColors
    ? { bg: '#0E1016', fg: '#F5F5F7' }
    : { bg: '#EEF0F5', fg: '#1D1D1F' };
}

// ---------- Preferências (tema Sistema, Claro ou Escuro) ----------

const THEMES = ['system', 'light', 'dark'];
const prefsFile = () => path.join(app.getPath('userData'), 'prefs.json');
function readPrefs() {
  try { return JSON.parse(fs.readFileSync(prefsFile(), 'utf8')) || {}; } catch { return {}; }
}
function writePrefs(patch) {
  const next = { ...readPrefs(), ...patch };
  try { fs.mkdirSync(path.dirname(prefsFile()), { recursive: true }); fs.writeFileSync(prefsFile(), JSON.stringify(next, null, 2)); } catch {}
  return next;
}
function applyTheme(theme) {
  nativeTheme.themeSource = THEMES.includes(theme) ? theme : 'system';
}

function baseOptions(extra) {
  const c = palette();
  // Windows: botões nativos flutuando sobre o fundo. Mac: os três botões coloridos alinhados à barra de vidro.
  const chrome = IS_MAC
    ? { titleBarStyle: 'hiddenInset', trafficLightPosition: { x: 20, y: 23 } }
    : { titleBarStyle: 'hidden', titleBarOverlay: { color: '#00000000', symbolColor: c.fg, height: 44 } };
  return {
    show: false,
    backgroundColor: c.bg,
    icon: !IS_MAC && fs.existsSync(ICON) ? ICON : undefined,
    ...chrome,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      spellcheck: false,
    },
    ...extra,
  };
}

// Teste automatizado: roteiro de prints (MINIME_SHOT=prefixo, MINIME_STEPS=JSON). Sem a variável, não faz nada.
async function devShots(win) {
  const prefix = process.env.MINIME_SHOT;
  if (!prefix) return;
  const steps = JSON.parse(process.env.MINIME_STEPS || '[{"wait":2500,"shot":"1"}]');
  const mode = new URL(win.webContents.getURL()).searchParams.get('mode') || 'main';
  for (const s of steps) {
    if (s.mode && s.mode !== mode) continue;
    if (s.js) { try { await win.webContents.executeJavaScript(s.js); } catch (e) { console.log('step js error', e.message); } }
    if (s.wait) await new Promise((r) => setTimeout(r, s.wait));
    if (s.shot) {
      const img = await win.webContents.capturePage();
      fs.writeFileSync(`${prefix}-${mode}-${s.shot}.png`, img.toPNG());
    }
    if (s.log) {
      try { console.log('LOG', JSON.stringify(await win.webContents.executeJavaScript(s.log))); } catch (e) { console.log('LOG error', e.message); }
    }
  }
  if (process.env.MINIME_QUIT) app.exit(0);
}

function harden(win) {
  win.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  win.webContents.on('will-navigate', (e) => e.preventDefault());
  win.once('ready-to-show', () => { win.show(); devShots(win); });
  const id = win.webContents.id;
  win.on('closed', () => { jobs.cancel(String(id)); pending.delete(id); quickWins.delete(id); });
}

function createMainWindow(files = [], { minimized = false } = {}) {
  if (mainWin && !mainWin.isDestroyed()) {
    if (mainWin.isMinimized()) mainWin.restore();
    mainWin.focus();
    const p = pending.get(mainWin.webContents.id);
    if (files.length && p && !p.delivered) p.files.push(...files);
    else if (files.length) mainWin.webContents.send('launch:add', { files });
    return mainWin;
  }
  mainWin = new BrowserWindow(baseOptions({ width: 1220, height: 790, minWidth: 960, minHeight: 640, title: 'MINIME' }));
  pending.set(mainWin.webContents.id, { mode: 'main', target: null, files });
  harden(mainWin);
  // Aberto junto com o computador: já aparece minimizado, sem roubar a tela.
  if (minimized) mainWin.once('show', () => mainWin.minimize());
  mainWin.on('closed', () => { mainWin = null; });
  mainWin.loadFile(RENDERER, { query: { mode: 'main' } });
  return mainWin;
}

function createQuickWindow(target, files) {
  const win = new BrowserWindow(baseOptions({
    width: 480, height: 660, resizable: false, maximizable: false, fullscreenable: false, title: 'MINIME',
  }));
  const id = win.webContents.id;
  pending.set(id, { mode: 'quick', target, files });
  quickWins.set(id, { win, target, createdAt: Date.now(), started: false });
  harden(win);
  win.loadFile(RENDERER, { query: { mode: 'quick' } });
  return win;
}

// Vários arquivos selecionados no Explorer chegam como vários processos: junta tudo na mesma janela.
function handleLaunch(l) {
  if (!l) return;
  if (l.mode === 'quick' && l.files.length) {
    const recent = [...quickWins.values()].find((q) => q.target === l.target && !q.started && Date.now() - q.createdAt < 4000 && !q.win.isDestroyed());
    if (recent) {
      recent.createdAt = Date.now();
      const id = recent.win.webContents.id;
      const p = pending.get(id);
      if (p && !p.delivered) p.files.push(...l.files);
      else recent.win.webContents.send('launch:add', { files: l.files });
      recent.win.focus();
      return;
    }
    createQuickWindow(l.target, l.files);
    return;
  }
  createMainWindow(l.files, { minimized: !!l.login && !l.files.length });
}

function appMenu() {
  if (!IS_MAC) return null;
  return Menu.buildFromTemplate([
    { label: 'MINIME', submenu: [{ role: 'about', label: 'Sobre o MINIME' }, { type: 'separator' }, { role: 'hide', label: 'Ocultar MINIME' }, { role: 'hideOthers', label: 'Ocultar outros' }, { type: 'separator' }, { role: 'quit', label: 'Sair do MINIME' }] },
    { label: 'Editar', submenu: [{ role: 'undo', label: 'Desfazer' }, { role: 'redo', label: 'Refazer' }, { type: 'separator' }, { role: 'cut', label: 'Recortar' }, { role: 'copy', label: 'Copiar' }, { role: 'paste', label: 'Colar' }, { role: 'selectAll', label: 'Selecionar tudo' }] },
    { label: 'Janela', submenu: [{ role: 'minimize', label: 'Minimizar' }, { role: 'zoom', label: 'Zoom' }, { role: 'close', label: 'Fechar janela' }] },
  ]);
}

// ---------- Preferências de sistema: atualizar sozinho e abrir com o computador ----------

// O instalador do Windows grava as escolhas da tela "Preferências" em HKCU\Software\MINIME.
function installerPrefs() {
  if (!IS_WIN || !app.isPackaged) return null;
  try {
    const out = execFileSync('reg.exe', ['query', 'HKCU\\Software\\MINIME', '/v', 'AutoUpdate'], { windowsHide: true }).toString();
    const m = /AutoUpdate\s+REG_DWORD\s+0x([0-9a-f]+)/i.exec(out);
    return m ? { autoUpdate: parseInt(m[1], 16) === 1 } : null;
  } catch { return null; }
}

function loginOptions() {
  return IS_WIN ? { name: 'MINIME', path: process.execPath, args: ['--login'] } : {};
}
function getOpenAtLogin() {
  if (!app.isPackaged) return !!readPrefs().openAtLogin;
  try { return !!app.getLoginItemSettings(loginOptions()).openAtLogin; } catch { return false; }
}
function setOpenAtLogin(on) {
  // Em desenvolvimento só guarda a escolha: registrar o electron.exe no início do Windows seria errado.
  if (app.isPackaged) app.setLoginItemSettings({ openAtLogin: !!on, ...loginOptions() });
  writePrefs({ openAtLogin: !!on });
  return getOpenAtLogin();
}

function prefsInit() {
  let p = readPrefs();
  if (p.autoUpdate === undefined) {
    const inst = installerPrefs();
    p = writePrefs({ autoUpdate: inst ? inst.autoUpdate : true, firstRunDone: !!inst });
  }
  return p;
}

function broadcast(channel, data) {
  for (const w of BrowserWindow.getAllWindows()) if (!w.isDestroyed()) w.webContents.send(channel, data);
}

function start() {
  started = true;
  Menu.setApplicationMenu(appMenu());
  const prefs = prefsInit();
  applyTheme(prefs.theme);
  if (process.env.MINIME_THEME) nativeTheme.themeSource = process.env.MINIME_THEME;
  getHardware();
  updater.init({ autoUpdate: prefs.autoUpdate !== false, onState: (st) => broadcast('update:state', st) });
  const files = [...launch.files, ...openQueue.splice(0)];
  handleLaunch(launch.mode ? { ...launch, files } : { mode: 'open', files, login: launch.login });
  nativeTheme.on('updated', () => {
    const c = palette();
    for (const w of BrowserWindow.getAllWindows()) {
      try { w.setTitleBarOverlay({ color: '#00000000', symbolColor: c.fg }); w.setBackgroundColor(c.bg); } catch {}
      if (!w.isDestroyed()) w.webContents.send('theme:changed', { theme: nativeTheme.themeSource, dark: nativeTheme.shouldUseDarkColors });
    }
  });
}

// Fechou a última janela: o app sai de verdade, inclusive no Mac (nada fica rodando escondido).
app.on('window-all-closed', () => app.quit());
app.on('activate', () => { if (started && !BrowserWindow.getAllWindows().length) createMainWindow(); });

// Saída limpa: cancela conversões, mata todo FFmpeg e apaga arquivos que ficaram pela metade.
let quittingClean = false;
app.on('before-quit', (e) => {
  if (quittingClean) return;
  if (jobs.busyCount() > 0) {
    e.preventDefault();
    quittingClean = true;
    jobs.cancelAll();
    ff.killAll();
    const t0 = Date.now();
    const wait = () => {
      if (jobs.busyCount() === 0 || Date.now() - t0 > 3000) { ff.killAll(); jobs.cleanupPartials(); app.quit(); }
      else setTimeout(wait, 40);
    };
    wait();
    return;
  }
  ff.killAll();
  jobs.cleanupPartials();
});
app.on('will-quit', () => { ff.killAll(); jobs.cleanupPartials(); });
process.on('exit', () => ff.killAll());

// ---------- IPC ----------

const winOf = (e) => BrowserWindow.fromWebContents(e.sender);
const keyOf = (e) => String(e.sender.id);

ipcMain.handle('launch:get', (e) => {
  const p = pending.get(e.sender.id) || { mode: 'main', target: null, files: [] };
  p.delivered = true;
  return { mode: p.mode, target: p.target, files: p.files.slice() };
});

ipcMain.handle('files:add', (_e, paths) => jobs.addPaths(Array.isArray(paths) ? paths : []));
ipcMain.handle('files:remove', (_e, ids) => jobs.remove(ids || []));
ipcMain.handle('files:thumb', (_e, id) => jobs.thumb(id));

ipcMain.handle('estimate', async (e, { jobs: list, settings }) => {
  await getHardware();
  return jobs.estimate(list || [], settings, keyOf(e));
});

ipcMain.handle('caps', (_e, { category, target, ids, settings }) => jobs.capabilities(category, target, ids, settings));

ipcMain.handle('convert:start', async (e, { jobs: list, settings, dest }) => {
  await getHardware();
  const q = quickWins.get(e.sender.id);
  if (q) q.started = true;
  const sender = e.sender;
  return jobs.convertAll(list || [], settings, dest, (ev) => {
    if (!sender.isDestroyed()) sender.send('convert:progress', ev);
  }, keyOf(e));
});
ipcMain.handle('convert:cancel', (e) => jobs.cancel(keyOf(e)));

ipcMain.handle('dialog:files', async (e) => {
  const r = await dialog.showOpenDialog(winOf(e), {
    title: 'Escolher arquivos',
    properties: ['openFile', 'multiSelections'],
    filters: [
      { name: 'Imagens, vídeos e áudios', extensions: F.ALL_IN },
      { name: 'Imagens', extensions: F.IMAGE_IN },
      { name: 'Vídeos', extensions: F.VIDEO_IN },
      { name: 'Áudios', extensions: F.AUDIO_IN },
    ],
  });
  return r.canceled ? [] : r.filePaths;
});

ipcMain.handle('dialog:folder', async (e, current) => {
  const r = await dialog.showOpenDialog(winOf(e), {
    title: 'Salvar os arquivos convertidos em',
    defaultPath: current || undefined,
    properties: ['openDirectory', 'createDirectory'],
  });
  return r.canceled ? null : r.filePaths[0];
});

ipcMain.handle('shell:showItem', (_e, p) => { if (p && fs.existsSync(p)) shell.showItemInFolder(p); });
ipcMain.handle('shell:openFolder', (_e, p) => { if (p && fs.existsSync(p)) shell.openPath(p); });
ipcMain.handle('shell:site', () => shell.openExternal(SITE));

ipcMain.handle('theme:get', () => ({ theme: nativeTheme.themeSource, dark: nativeTheme.shouldUseDarkColors }));
ipcMain.handle('theme:set', (_e, theme) => {
  if (!THEMES.includes(theme)) return { theme: nativeTheme.themeSource, dark: nativeTheme.shouldUseDarkColors };
  writePrefs({ theme });
  applyTheme(theme);
  return { theme: nativeTheme.themeSource, dark: nativeTheme.shouldUseDarkColors };
});

ipcMain.handle('app:hardware', () => getHardware());
ipcMain.handle('app:info', () => ({ version: app.getVersion(), packaged: app.isPackaged, platform: process.platform }));
ipcMain.handle('app:system', async () => {
  const hw = await getHardware();
  return { ...(hw || {}), emulated: !!app.runningUnderARM64Translation, lanes: jobs.lanes() };
});

function prefsView() {
  const p = readPrefs();
  return { autoUpdate: p.autoUpdate !== false, openAtLogin: getOpenAtLogin(), firstRunDone: !!p.firstRunDone, update: updater.getState() };
}
ipcMain.handle('prefs:get', () => prefsView());
ipcMain.handle('prefs:set', (_e, patch = {}) => {
  if ('autoUpdate' in patch) { writePrefs({ autoUpdate: !!patch.autoUpdate }); updater.setAuto(!!patch.autoUpdate); }
  if ('openAtLogin' in patch) setOpenAtLogin(!!patch.openAtLogin);
  if ('firstRunDone' in patch) writePrefs({ firstRunDone: !!patch.firstRunDone });
  return prefsView();
});
ipcMain.handle('update:check', (_e, manual) => updater.check(!!manual));
ipcMain.handle('update:download', () => updater.download());
ipcMain.handle('update:install', () => { if (jobs.busyCount() === 0) updater.install(); return updater.getState(); });

// O menu do botão direito pelo registro é só do Windows. No Mac o caminho é "Abrir com" no Finder.
ipcMain.handle('menu:status', () => (IS_WIN ? shellMenu.isRegistered() : null));
ipcMain.handle('menu:set', async (_e, on) => {
  if (!IS_WIN) return null;
  if (on) await shellMenu.register(shellCommand()); else await shellMenu.unregister();
  return shellMenu.isRegistered();
});

ipcMain.handle('window:openFull', (e, paths) => {
  createMainWindow(Array.isArray(paths) ? paths : []);
  const w = winOf(e);
  if (w && w !== mainWin) setTimeout(() => { if (!w.isDestroyed()) w.close(); }, 50);
});
ipcMain.on('window:fit', (e, h) => {
  const w = winOf(e);
  if (!w || w === mainWin) return;
  const area = screen.getDisplayMatching(w.getBounds()).workAreaSize.height;
  const height = Math.max(360, Math.min(area - 24, Math.round(h)));
  const [cw, ch] = w.getContentSize();
  if (Math.abs(ch - height) > 2) w.setContentSize(cw, height, false);
});
ipcMain.on('window:close', (e) => { const w = winOf(e); if (w) w.close(); });
