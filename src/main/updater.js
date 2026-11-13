'use strict';
// Atualização pelo GitHub Releases do repositório público hybryt/minime.
// Só roda enquanto o app está aberto: nada fica residente no computador.
// Windows: baixa e instala sozinho (se o usuário deixar). Mac sem assinatura Apple: avisa e abre a página do instalador.
const { app, shell, net } = require('electron');

const RELEASES_URL = 'https://github.com/hybryt/minime/releases/latest';
// A versão portátil não tem instalador pra se substituir: avisa e abre a página, como no Mac.
const PORTABLE = !!process.env.PORTABLE_EXECUTABLE_FILE;
const SELF_INSTALL = process.platform === 'win32' && !PORTABLE;
const CHECK_EVERY = 6 * 3600e3;
const MIN_GAP = 30 * 60e3;

let updater = null;
let notify = () => {};
let lastCheck = 0;
const state = { status: 'idle', version: null, percent: 0, error: null, selfInstall: SELF_INSTALL, portable: PORTABLE, current: app.getVersion() };

function set(patch) {
  Object.assign(state, patch);
  notify({ ...state });
}

function friendly(e) {
  const m = String((e && e.message) || e || '');
  if (/net::|ENOTFOUND|ECONN|ETIMEDOUT|EAI_AGAIN|network/i.test(m)) return 'Sem conexão com o GitHub agora.';
  if (/404|Cannot find latest|No published versions/i.test(m)) return 'Nenhuma versão publicada ainda.';
  if (/signature|code sign/i.test(m)) return 'O Mac não aceitou instalar sozinho. Baixe pela página de versões.';
  return m.split('\n')[0].slice(0, 160) || 'Não consegui procurar atualização.';
}

// Compara "1.2.10" com "1.2.9" número a número.
function newer(a, b) {
  const pa = String(a).replace(/^v/, '').split('.').map(Number);
  const pb = String(b).replace(/^v/, '').split('.').map(Number);
  for (let i = 0; i < 3; i++) { if ((pa[i] || 0) !== (pb[i] || 0)) return (pa[i] || 0) > (pb[i] || 0); }
  return false;
}

// Portátil: pergunta direto à API do GitHub qual é a última versão publicada.
async function checkPortable() {
  set({ status: 'checking', error: null });
  try {
    const res = await net.fetch('https://api.github.com/repos/hybryt/minime/releases/latest', { headers: { Accept: 'application/vnd.github+json', 'User-Agent': 'MINIME-updater' } });
    if (res.status === 404) return set({ status: 'error', error: 'Nenhuma versão publicada ainda.' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const j = await res.json();
    if (newer(j.tag_name, app.getVersion())) set({ status: 'available', version: String(j.tag_name).replace(/^v/, '') });
    else set({ status: 'latest', version: null });
  } catch (e) { set({ status: 'error', error: friendly(e) }); }
}

function init({ autoUpdate, onState }) {
  notify = onState || notify;
  if (!app.isPackaged && !process.env.MINIME_UPDATE_DEV) { set({ status: 'dev' }); return; }
  if (PORTABLE) {
    updater = { portable: true };
    setTimeout(() => check(false), 6000).unref();
    setInterval(() => check(false), CHECK_EVERY).unref();
    return;
  }
  try { ({ autoUpdater: updater } = require('electron-updater')); } catch { set({ status: 'unsupported' }); return; }
  updater.logger = null;
  updater.allowPrerelease = false;
  updater.autoDownload = SELF_INSTALL && !!autoUpdate;
  updater.autoInstallOnAppQuit = SELF_INSTALL && !!autoUpdate;
  updater.on('checking-for-update', () => set({ status: 'checking', error: null }));
  updater.on('update-available', (info) => set({ status: updater.autoDownload ? 'downloading' : 'available', version: info.version, percent: 0 }));
  updater.on('update-not-available', () => set({ status: 'latest', version: null }));
  updater.on('download-progress', (p) => set({ status: 'downloading', percent: Math.round(p.percent || 0) }));
  updater.on('update-downloaded', (info) => set({ status: 'ready', version: info.version, percent: 100 }));
  updater.on('error', (e) => set({ status: 'error', error: friendly(e) }));
  // Primeira checagem logo depois de abrir; depois a cada 6 h enquanto o app estiver aberto.
  setTimeout(() => check(false), 6000).unref();
  setInterval(() => check(false), CHECK_EVERY).unref();
}

async function check(manual) {
  if (!updater) return { ...state };
  if (!net.isOnline()) { if (manual) set({ status: 'offline', error: null }); return { ...state }; }
  if (!manual && Date.now() - lastCheck < MIN_GAP) return { ...state };
  if (['downloading', 'ready'].includes(state.status)) return { ...state };
  lastCheck = Date.now();
  if (PORTABLE) { await checkPortable(); return { ...state }; }
  try { await updater.checkForUpdates(); } catch (e) { set({ status: 'error', error: friendly(e) }); }
  return { ...state };
}

function setAuto(on) {
  if (!updater || PORTABLE) return;
  updater.autoDownload = SELF_INSTALL && !!on;
  updater.autoInstallOnAppQuit = SELF_INSTALL && !!on;
  if (on && state.status === 'available' && SELF_INSTALL) download();
}

async function download() {
  if (!SELF_INSTALL) { shell.openExternal(RELEASES_URL); return { ...state }; }
  if (!updater || state.status !== 'available') return { ...state };
  set({ status: 'downloading', percent: 0 });
  try { await updater.downloadUpdate(); } catch (e) { set({ status: 'error', error: friendly(e) }); }
  return { ...state };
}

function install() {
  if (updater && state.status === 'ready') setImmediate(() => updater.quitAndInstall(true, true));
}

const getState = () => ({ ...state });

module.exports = { init, check, setAuto, download, install, getState, RELEASES_URL };
