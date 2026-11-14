'use strict';
// Processo principal: janelas, instância única (junta vários arquivos do botão direito) e ponte com o motor.
const { app, BrowserWindow, ipcMain, dialog, shell, nativeTheme, Menu, screen } = require('electron');
const path = require('node:path');
const fs = require('node:fs');
const { execFileSync, execFile } = require('node:child_process');
const jobs = require('./engine/jobs');
const ff = require('./engine/ffmpeg');
const updater = require('./updater');
const hardware = require('./engine/hardware');
const F = require('./engine/formats');
const shellMenu = require('./shell');
const presets = require('./presets');
const decode = require('./engine/decode');
const upscale = require('./engine/upscale');

const SITE = 'https://alanmore.com.br';
const RENDERER = path.join(__dirname, '..', 'renderer', 'index.html');
const ICON = path.join(__dirname, '..', 'renderer', 'assets', 'icon.png');

const IS_MAC = process.platform === 'darwin';
const IS_WIN = process.platform === 'win32';
// Versão portátil (um .exe só, sem instalar): o executável real fica em PORTABLE_EXECUTABLE_FILE;
// o process.execPath aponta pra uma pasta temporária que some ao fechar.
const PORTABLE_EXE = process.env.PORTABLE_EXECUTABLE_FILE || null;
const EXE_PATH = PORTABLE_EXE || process.execPath;

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
// MINIME.exe --preset img-jpg "C:\foto.jpg"  (atalho de 1 clique do botão direito: converte sozinho)
// MINIME.exe --quick webp "C:\foto.jpg"     (Mais formatos: janela rápida pra ajustar e converter)
// MINIME.exe --open "C:\foto.jpg"           (Abrir no MINIME / Abrir com)
function parseArgs(argv) {
  const args = argv.slice(app.isPackaged ? 1 : 2);
  const out = { mode: null, target: null, preset: null, files: [] };
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === '--quick') { out.mode = 'quick'; out.target = String(args[++i] || '').toLowerCase(); continue; }
    if (a === '--preset') {
      const p = presets.get(args[++i]);
      if (p) { out.mode = 'quick'; out.preset = p.id; out.target = `preset:${p.id}`; }
      continue;
    }
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
  return shellMenu.launchCommand(app.isPackaged, EXE_PATH, app.getAppPath());
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
    // Se o segundo processo não achou os arquivos (caminho relativo, permissão do Mac), tenta de novo por aqui.
    const l = data && data.launch;
    handleLaunch(l && (l.files.length || !l.mode) ? l : parseArgs(argv));
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

function createQuickWindow(target, files, preset) {
  const win = new BrowserWindow(baseOptions({
    width: 480, height: 660, resizable: false, maximizable: false, fullscreenable: false, title: 'MINIME',
  }));
  const id = win.webContents.id;
  pending.set(id, { mode: 'quick', target: preset ? null : target, preset: preset || null, files });
  // Mac: aberto pelo Finder (Ações Rápidas) a janela precisa vir pra frente.
  if (IS_MAC) win.once('ready-to-show', () => { try { app.focus({ steal: true }); } catch {} });
  quickWins.set(id, { win, target, createdAt: Date.now(), started: false });
  harden(win);
  win.loadFile(RENDERER, { query: { mode: 'quick' } });
  return win;
}

// Vários arquivos selecionados no Explorer chegam como vários processos: junta tudo na mesma janela.
function handleLaunch(l) {
  if (!l) return;
  if (l.mode === 'quick' && l.files.length) {
    // Atalho de 1 clique começa sozinho em menos de 1 s: processo atrasado do Explorer entra na mesma janela
    // (a tela guarda e converte logo depois). "Mais formatos" espera o usuário, então só junta antes de começar.
    const preset = String(l.target || '').startsWith('preset:');
    const recent = [...quickWins.values()].find((q) => q.target === l.target && (!q.started || preset) && Date.now() - q.createdAt < 4000 && !q.win.isDestroyed());
    if (recent) {
      recent.createdAt = Date.now();
      const id = recent.win.webContents.id;
      const p = pending.get(id);
      if (p && !p.delivered) p.files.push(...l.files);
      else recent.win.webContents.send('launch:add', { files: l.files });
      recent.win.focus();
      return;
    }
    createQuickWindow(l.target, l.files, l.preset);
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
  return IS_WIN ? { name: 'MINIME', path: EXE_PATH, args: ['--login'] } : {};
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

// ---------- Atalhos de 1 clique (menu do Windows e Ações Rápidas do Mac) ----------

const menuPrefs = () => presets.normalizeMenu(readPrefs().menuPresets);
const macServices = () => require('./mac-services');

// Itens das Ações Rápidas: os mesmos atalhos do menu do Windows, mais "Abrir no MINIME".
// O Finder liga e desliga cada item pelo título: título repetido entre tipos ganha o tipo no fim.
const CAT_TITLE = { image: 'imagem', video: 'vídeo', audio: 'áudio' };
function macItems(menu) {
  const items = [];
  const count = new Map();
  for (const cat of presets.CATS) for (const id of menu[cat]) { const l = presets.get(id).label; count.set(l, (count.get(l) || 0) + 1); }
  for (const cat of presets.CATS) {
    for (const id of menu[cat]) {
      const p = presets.get(id);
      const title = count.get(p.label) > 1 ? `${p.label} (${CAT_TITLE[cat]})` : p.label;
      items.push({ id: p.id, title, category: cat, args: ['--preset', p.id] });
    }
  }
  items.push({ id: 'open', title: 'Abrir no MINIME', category: 'any', args: ['--open'] });
  return items;
}
// Extensões que o Mac às vezes não reconhece como vídeo ou áudio (.mkv, .webm, .opus sem VLC instalado).
function macExtensions() {
  return { image: F.IMAGE_IN, video: F.VIDEO_IN.filter((e) => e !== 'ts'), audio: F.AUDIO_IN };
}
function macAppPath() {
  // .../MINIME.app/Contents/MacOS/MINIME -> .../MINIME.app
  const i = process.execPath.indexOf('.app/');
  return i > 0 ? process.execPath.slice(0, i + 4) : null;
}
function macInstall(menu) {
  const appPath = macAppPath();
  const inApps = typeof app.isInApplicationsFolder === 'function' ? app.isInApplicationsFolder() : true;
  if (!appPath || !inApps || appPath.includes('/AppTranslocation/')) {
    throw new Error('Arraste o MINIME pra pasta Aplicativos e abra de lá pra ativar as Ações Rápidas.');
  }
  macServices().install({ appPath, items: macItems(menu), extensions: macExtensions() });
  writePrefs({ macServicesVersion: app.getVersion() });
}

// Grava o estado do menu pro instalador respeitar numa atualização (Menu=0: o usuário desligou).
function rememberMenuChoice(on) {
  writePrefs({ menuOn: !!on });
  if (!IS_WIN || !app.isPackaged || PORTABLE_EXE) return;
  execFile('reg.exe', ['add', 'HKCU\\Software\\MINIME', '/v', 'Menu', '/t', 'REG_DWORD', '/d', on ? '1' : '0', '/f'], { windowsHide: true }, () => {});
}

async function menuStatus() {
  if (IS_WIN) return shellMenu.isRegistered();
  if (IS_MAC) { try { return macServices().isInstalled(); } catch { return false; } }
  return null;
}
async function setMenu(on) {
  if (IS_WIN) {
    if (on) await shellMenu.register(shellCommand(), menuPrefs()); else await shellMenu.unregister();
  } else if (IS_MAC) {
    if (on) macInstall(menuPrefs()); else macServices().uninstall();
  }
  rememberMenuChoice(on);
  return menuStatus();
}

// Ao abrir: troca o menu antigo (1.2) pelo novo, regrava atalhos personalizados que o instalador repôs
// e corrige o caminho do executável se o app mudou de pasta. Mac: atualiza as Ações Rápidas.
async function syncMenu() {
  try {
    if (IS_WIN && app.isPackaged && !PORTABLE_EXE) {
      const st = await shellMenu.registrationState();
      const p = readPrefs();
      if (!st) return;
      const cmd = shellCommand();
      if (st === 'old' || !(await shellMenu.commandMatches(cmd))) await shellMenu.register(cmd, menuPrefs());
      else if (p.menuPresets) await shellMenu.applyPresets(cmd, menuPrefs());
    } else if (IS_MAC && app.isPackaged) {
      const p = readPrefs();
      // Primeira abertura (ou versão nova): liga as Ações Rápidas. Dá pra desligar nas Preferências.
      if (p.menuOn === false) return;
      if (p.macServicesVersion === app.getVersion() && macServices().isInstalled()) return;
      try { macInstall(menuPrefs()); if (p.menuOn === undefined) writePrefs({ menuOn: true }); } catch {}
    }
  } catch (e) { console.log('syncMenu', e && e.message); }
}

function start() {
  started = true;
  Menu.setApplicationMenu(appMenu());
  const prefs = prefsInit();
  applyTheme(prefs.theme);
  if (process.env.MINIME_THEME) nativeTheme.themeSource = process.env.MINIME_THEME;
  decode.purgeOld();
  getHardware();
  setTimeout(syncMenu, 1500);
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
    upscale.killAll();
    const wait = () => {
      if (jobs.busyCount() === 0 || Date.now() - t0 > 3000) { ff.killAll(); upscale.killAll(); jobs.cleanupPartials(); app.quit(); }
      else setTimeout(wait, 40);
    };
    wait();
    return;
  }
  ff.killAll();
  upscale.killAll();
  jobs.cleanupPartials();
});
// Tudo que é temporário some junto: quadros de vídeo, fotos ampliadas, HEIC e RAW decodificados.
app.on('will-quit', () => { ff.killAll(); upscale.killAll(); jobs.cleanupPartials(); decode.cleanup(); decode.cleanupWork(); });
process.on('exit', () => { ff.killAll(); upscale.killAll(); });

// ---------- IPC ----------

const winOf = (e) => BrowserWindow.fromWebContents(e.sender);
const keyOf = (e) => String(e.sender.id);

ipcMain.handle('launch:get', (e) => {
  const p = pending.get(e.sender.id) || { mode: 'main', target: null, files: [] };
  p.delivered = true;
  return { mode: p.mode, target: p.target, preset: p.preset ? presets.get(p.preset) : null, files: p.files.slice() };
});

ipcMain.handle('presets:get', () => ({ list: presets.publicList(), menu: menuPrefs(), defaults: presets.DEFAULT_MENU, max: presets.MAX_PER_CAT }));
ipcMain.handle('presets:set', async (_e, menu) => {
  const next = presets.normalizeMenu(menu);
  writePrefs({ menuPresets: next });
  if (await menuStatus()) {
    if (IS_WIN) await shellMenu.applyPresets(shellCommand(), next);
    else if (IS_MAC) { try { macInstall(next); } catch {} }
  }
  return next;
});
ipcMain.handle('app:ai', () => upscale.available());

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
ipcMain.handle('app:info', () => ({ version: app.getVersion(), packaged: app.isPackaged, portable: !!PORTABLE_EXE, platform: process.platform }));
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

// Windows: menu do botão direito pelo registro. Mac: Ações Rápidas do Finder.
ipcMain.handle('menu:status', () => menuStatus());
ipcMain.handle('menu:set', (_e, on) => setMenu(!!on));

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
