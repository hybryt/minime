'use strict';
// Ponte segura entre a tela e o processo principal.
const { contextBridge, ipcRenderer, webUtils } = require('electron');

const on = (channel) => (cb) => {
  const fn = (_e, data) => cb(data);
  ipcRenderer.on(channel, fn);
  return () => ipcRenderer.removeListener(channel, fn);
};

contextBridge.exposeInMainWorld('minime', {
  getLaunch: () => ipcRenderer.invoke('launch:get'),
  onLaunchAdd: on('launch:add'),
  // Um File por chamada: a ponte do Electron não atravessa FileList inteira.
  pathForFile: (file) => { try { return webUtils.getPathForFile(file) || ''; } catch { return ''; } },
  addPaths: (paths) => ipcRenderer.invoke('files:add', paths),
  removeItems: (ids) => ipcRenderer.invoke('files:remove', ids),
  thumb: (id) => ipcRenderer.invoke('files:thumb', id),
  estimate: (jobs, settings) => ipcRenderer.invoke('estimate', { jobs, settings }),
  caps: (category, target, ids, settings) => ipcRenderer.invoke('caps', { category, target, ids, settings }),
  convert: (jobs, settings, dest) => ipcRenderer.invoke('convert:start', { jobs, settings, dest }),
  cancel: () => ipcRenderer.invoke('convert:cancel'),
  onProgress: on('convert:progress'),
  chooseFiles: () => ipcRenderer.invoke('dialog:files'),
  chooseFolder: (current) => ipcRenderer.invoke('dialog:folder', current),
  showItem: (p) => ipcRenderer.invoke('shell:showItem', p),
  openFolder: (p) => ipcRenderer.invoke('shell:openFolder', p),
  openSite: () => ipcRenderer.invoke('shell:site'),
  hardware: () => ipcRenderer.invoke('app:hardware'),
  getTheme: () => ipcRenderer.invoke('theme:get'),
  setTheme: (t) => ipcRenderer.invoke('theme:set', t),
  onTheme: on('theme:changed'),
  info: () => ipcRenderer.invoke('app:info'),
  platform: process.platform,
  system: () => ipcRenderer.invoke('app:system'),
  getPrefs: () => ipcRenderer.invoke('prefs:get'),
  setPrefs: (patch) => ipcRenderer.invoke('prefs:set', patch),
  checkUpdate: (manual) => ipcRenderer.invoke('update:check', manual),
  downloadUpdate: () => ipcRenderer.invoke('update:download'),
  installUpdate: () => ipcRenderer.invoke('update:install'),
  onUpdate: on('update:state'),
  menuStatus: () => ipcRenderer.invoke('menu:status'),
  setMenu: (on) => ipcRenderer.invoke('menu:set', on),
  openFull: (paths) => ipcRenderer.invoke('window:openFull', paths),
  fitHeight: (h) => ipcRenderer.send('window:fit', h),
  close: () => ipcRenderer.send('window:close'),
});
