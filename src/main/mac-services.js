'use strict';
// Ações Rápidas do Finder (Mac): cada atalho de 1 clique vira um .workflow em ~/Library/Services.
// App com assinatura ad hoc não pode ter extensão do Finder, então o caminho é o mesmo que o
// Automator usa quando alguém salva uma "Ação Rápida". Clique direito ▸ Ações Rápidas ▸ "MINIME: ...".
//
// O que decide se o item aparece (visto em workflows reais do Automator e em projetos testados no macOS 26/27):
// - NSIconName no Info.plist põe o item em "Ações Rápidas"; sem ele o item cai no submenu "Serviços".
// - O nome no menu vem do NSMenuItem do Info.plist, não do nome da pasta .workflow.
// - Workflow copiado à mão começa desligado. Ligar é gravar a chave dele em pbs ▸ NSServicesStatus,
//   igual aos Ajustes do Sistema. A gente só grava quando a chave não existe (respeita quem desligou).
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');
const { execFileSync, spawn } = require('node:child_process');

const MARK = 'MINIMEGenerated'; // marca nossa no Info.plist: só apagamos bundle que tem isso
const FORMAT = 1;
const FILE_PREFIX = 'MINIME - ';
const MENU_PREFIX = 'MINIME: ';
const DEFAULT_BUNDLE_ID = 'br.com.alanmore.minime';
const DEFAULT_EXECUTABLE = 'MINIME';
const MAX_NAME_BYTES = 180; // APFS aceita 255 bytes por nome; sobra espaço pro sufixo, ".workflow" e a pasta temporária
const STAGING = /^\..+\.minime-tmp$/;

const PBS = '/System/Library/CoreServices/pbs';
const DEFAULTS = '/usr/bin/defaults';
const PLUTIL = '/usr/bin/plutil';
const OSASCRIPT = '/usr/bin/osascript';
const FINDER = '/System/Library/CoreServices/Finder.app';

// Vídeo é public.movie e não public.audiovisual-content: este é o pai de public.movie E de public.audio,
// então os atalhos de vídeo apareceriam também em MP3 e WAV.
const BASE_TYPES = { image: ['public.image'], video: ['public.movie'], audio: ['public.audio'] };
BASE_TYPES.any = [...BASE_TYPES.image, ...BASE_TYPES.video, ...BASE_TYPES.audio];
const CAT_LABEL = { image: 'imagem', video: 'vídeo', audio: 'áudio', any: 'todos' };
// Tipo amplo demais pra entrar sozinho na lista (faria o atalho aparecer em qualquer arquivo).
const GENERIC = new Set(['public.item', 'public.data', 'public.content', 'public.composite-content',
  'public.audiovisual-content', 'public.text', 'public.plain-text', 'public.source-code', 'public.archive',
  'public.folder', 'public.directory', 'com.apple.package']);

// O que os Ajustes do Sistema gravam ao ligar uma Ação Rápida (Finder: menu e painel de pré-visualização; menu Serviços).
const PBS_ON = '<dict><key>presentation_modes</key><dict><key>ContextMenu</key><true/>'
  + '<key>FinderPreview</key><true/><key>ServicesMenu</key><true/><key>TouchBar</key><false/></dict></dict>';

// ---------- Texto, XML e plist ----------

function wellFormed(s) { return typeof s.toWellFormed === 'function' ? s.toWellFormed() : s; }

function clean(s) {
  return wellFormed(String(s == null ? '' : s)).normalize('NFC')
    .replace(/[\u0000-\u001F\u007F]+/g, ' ').replace(/\s+/g, ' ').trim();
}

function xmlEscape(s) {
  return wellFormed(String(s))
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\uFFFE\uFFFF]/g, '') // XML 1.0 não aceita
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}

function xmlDecode(s) {
  return s.replace(/&(#x[0-9a-f]+|#\d+|amp|lt|gt|quot|apos);/gi, (_, e) => {
    if (e[0] === '#') return String.fromCodePoint(/^#x/i.test(e) ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10));
    return { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" }[e.toLowerCase()];
  });
}

// Serializador mínimo de plist XML (o mesmo formato que o Automator grava: tabs e chaves em ordem).
function plistValue(v, depth) {
  const pad = '\t'.repeat(depth);
  if (v === true) return `${pad}<true/>`;
  if (v === false) return `${pad}<false/>`;
  if (typeof v === 'number') {
    if (!Number.isInteger(v)) throw new TypeError('plist: só número inteiro');
    return `${pad}<integer>${v}</integer>`;
  }
  if (typeof v === 'string') return `${pad}<string>${xmlEscape(v)}</string>`;
  if (Array.isArray(v)) {
    if (!v.length) return `${pad}<array/>`;
    return [`${pad}<array>`, ...v.map((x) => plistValue(x, depth + 1)), `${pad}</array>`].join('\n');
  }
  if (v && typeof v === 'object') {
    const keys = Object.keys(v);
    if (!keys.length) return `${pad}<dict/>`;
    const out = [`${pad}<dict>`];
    for (const k of keys) out.push(`${pad}\t<key>${xmlEscape(k)}</key>`, plistValue(v[k], depth + 1));
    out.push(`${pad}</dict>`);
    return out.join('\n');
  }
  throw new TypeError(`plist: tipo não suportado (${typeof v})`);
}

function toPlist(root) {
  return '<?xml version="1.0" encoding="UTF-8"?>\n'
    + '<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">\n'
    + `<plist version="1.0">\n${plistValue(root, 0)}\n</plist>\n`;
}

// UUID fixo por atalho (derivado do id): gerar de novo não muda o arquivo à toa.
function stableUuid(...parts) {
  const h = crypto.createHash('sha1').update(['minime-quick-action', ...parts].join('\u0000')).digest();
  h[6] = (h[6] & 0x0f) | 0x50; // versão 5 (derivado de nome)
  h[8] = (h[8] & 0x3f) | 0x80; // variante RFC 4122
  const x = h.subarray(0, 16).toString('hex').toUpperCase();
  return `${x.slice(0, 8)}-${x.slice(8, 12)}-${x.slice(12, 16)}-${x.slice(16, 20)}-${x.slice(20)}`;
}

// ---------- Nomes de arquivo ----------

// "/" separa pastas e ":" é o separador antigo do Mac (o Finder mostra um como o outro). Os dois viram " - ".
// No Windows (só no autoteste) o sistema recusa mais alguns caracteres.
const ILLEGAL = process.platform === 'win32' ? /\s*[/:<>"\\|?*]+\s*/g : /\s*[/:]+\s*/g;
function fileSafe(s) { return clean(s).replace(ILLEGAL, ' - ').replace(/\s+/g, ' ').trim(); }

// Corta em bytes UTF-8 sem partir um caractere no meio.
function clip(s, maxBytes) {
  let out = '';
  for (const ch of s) {
    if (Buffer.byteLength(out + ch) > maxBytes) break;
    out += ch;
  }
  return out.trim();
}

// O APFS padrão ignora maiúscula/minúscula e a forma Unicode do acento: "Ação" e "ação" são o mesmo nome.
function nameKey(name) { return name.normalize('NFC').toLowerCase(); }

// ---------- Script do "Executar Script de Shell" ----------

function sh(s) { return `'${String(s).replace(/'/g, `'\\''`)}'`; }

// Escapa os especiais de regex estendida (pgrep -f). "]" e "}" sozinhos já são literais.
function ere(s) { return String(s).replace(/[\\^$.|?*+()[{]/g, '\\$&'); }

// bash 3.2 (o /bin/bash do Mac). Arquivos chegam como argumentos ("$@"), já com caminho absoluto.
function buildScript({ appPath, executable, bundleId, args }) {
  const bin = `${appPath}/Contents/MacOS/${executable}`;
  const pre = args.length ? `${args.map(sh).join(' ')} ` : '';
  return [
    '# Gerado pelo MINIME (Ações Rápidas do Finder). Não edite: o app reescreve este arquivo.',
    `APP=${sh(appPath)}`,
    `BIN=${sh(bin)}`,
    '[ "$#" -gt 0 ] || exit 0',
    '# App aberto: um 2º processo entrega atalho e arquivos ao que já tá rodando (instância única) e sai.',
    '# O ^ e o ( |$) evitam casar com os ajudantes (Contents/Frameworks) e com este próprio script;',
    '# o -U fica só no usuário logado (outra conta com o MINIME aberto não conta).',
    `if [ -x "$BIN" ] && /usr/bin/pgrep -U "$UID" -f ${sh(`^${ere(bin)}( |$)`)} >/dev/null 2>&1; then`,
    '  set -m # grupo de processos próprio: sobrevive ao fim da Ação Rápida',
    `  /usr/bin/nohup "$BIN" ${pre}"$@" </dev/null >/dev/null 2>&1 &`,
    '  exit 0',
    'fi',
    '# App fechado: o macOS abre o MINIME já com o atalho e os arquivos.',
    `/usr/bin/open -a "$APP" --args ${pre}"$@" >/dev/null 2>&1 && exit 0`,
    '# Plano B: o app mudou de pasta. Procura pelo identificador do pacote.',
    `exec /usr/bin/open -b ${sh(bundleId)} --args ${pre}"$@"`,
    '',
  ].join('\n');
}

// ---------- Conteúdo do bundle ----------

function buildInfo(b) {
  return toPlist({
    MINIMEFormat: FORMAT,
    [MARK]: true,
    MINIMEItemId: b.id,
    NSServices: [{
      NSBackgroundColorName: 'background',
      NSIconName: b.iconName,
      NSMenuItem: { default: b.menuTitle },
      NSMessage: 'runWorkflowAsService',
      NSRequiredContext: { NSApplicationIdentifier: 'com.apple.finder' },
      NSSendFileTypes: b.types,
    }],
  });
}

// Igual ao que o Automator 2.10 grava pra "Ação Rápida recebe arquivos ou pastas no Finder".
// A entrada é genérica (fileSystemObject): quem filtra o tipo é o NSSendFileTypes do Info.plist.
function buildDocument(b) {
  const arg = (name, value, i) => ({ 'default value': value, name, required: '0', type: '0', uuid: String(i) });
  return toPlist({
    AMApplicationBuild: '534',
    AMApplicationVersion: '2.10',
    AMDocumentVersion: '2',
    actions: [{
      action: {
        AMAccepts: { Container: 'List', Optional: true, Types: ['com.apple.cocoa.string'] },
        AMActionVersion: '2.0.3',
        AMApplication: ['Automator'],
        AMParameterProperties: { COMMAND_STRING: {}, CheckedForUserDefaultShell: {}, inputMethod: {}, shell: {}, source: {} },
        AMProvides: { Container: 'List', Types: ['com.apple.cocoa.string'] },
        ActionBundlePath: '/System/Library/Automator/Run Shell Script.action',
        ActionName: 'Run Shell Script',
        ActionParameters: { COMMAND_STRING: b.script, CheckedForUserDefaultShell: true, inputMethod: 1, shell: '/bin/bash', source: '' },
        BundleIdentifier: 'com.apple.RunShellScript',
        CFBundleVersion: '2.0.3',
        CanShowSelectedItemsWhenRun: false,
        CanShowWhenRun: true,
        Category: ['AMCategoryUtilities'],
        'Class Name': 'RunShellScriptAction',
        InputUUID: stableUuid(b.id, 'input'),
        Keywords: ['Shell', 'Script', 'Command', 'Run', 'Unix'],
        OutputUUID: stableUuid(b.id, 'output'),
        ShowWhenRun: false,
        UUID: stableUuid(b.id, 'action'),
        UnlocalizedApplications: ['Automator'],
        arguments: {
          0: arg('inputMethod', 0, 0),
          1: arg('CheckedForUserDefaultShell', false, 1),
          2: arg('source', '', 2),
          3: arg('COMMAND_STRING', '', 3),
          4: arg('shell', '/bin/sh', 4),
        },
        isViewVisible: 1,
        location: '309.000000:305.000000',
        nibPath: '/System/Library/Automator/Run Shell Script.action/Contents/Resources/Base.lproj/main.nib',
      },
      isViewVisible: 1,
    }],
    connectors: {},
    workflowMetaData: {
      applicationBundleID: 'com.apple.finder',
      applicationBundleIDsByPath: { [FINDER]: 'com.apple.finder' },
      applicationPath: FINDER,
      applicationPaths: [FINDER],
      inputTypeIdentifier: 'com.apple.Automator.fileSystemObject',
      outputTypeIdentifier: 'com.apple.Automator.nothing',
      presentationMode: 15,
      processesInput: false,
      serviceApplicationBundleID: 'com.apple.finder',
      serviceApplicationPath: FINDER,
      serviceInputTypeIdentifier: 'com.apple.Automator.fileSystemObject',
      serviceOutputTypeIdentifier: 'com.apple.Automator.nothing',
      serviceProcessesInput: false,
      systemImageName: 'NSActionTemplate',
      useAutomaticInputType: false,
      workflowTypeIdentifier: 'com.apple.Automator.servicesMenu',
    },
  });
}

// ---------- Entrada ----------

function checkAppPath(p) {
  const s = String(p || '').replace(/\/+$/, '');
  if (!s.startsWith('/') || !/\.app$/i.test(s)) {
    throw new TypeError(`mac-services: appPath precisa ser o caminho absoluto do .app (veio "${s}")`);
  }
  // App em quarentena rodando de cópia temporária (App Translocation): o caminho some ao fechar o app.
  if (s.includes('/AppTranslocation/')) {
    const e = new Error('mac-services: o MINIME tá rodando de um local temporário. Mova o app pra pasta Aplicativos antes de instalar as Ações Rápidas.');
    e.code = 'MINIME_TEMP_LOCATION';
    throw e;
  }
  return s;
}

function normalizeItems(items) {
  if (!Array.isArray(items)) throw new TypeError('mac-services: items precisa ser uma lista');
  const seen = new Set();
  return items.map((it, i) => {
    const id = clean(it && it.id);
    if (!id) throw new TypeError(`mac-services: o item ${i} não tem id`);
    if (seen.has(id)) throw new TypeError(`mac-services: id repetido (${id})`);
    seen.add(id);
    const title = clean(it.title);
    if (!title) throw new TypeError(`mac-services: o item ${id} não tem título`);
    const category = it.category || 'any';
    if (!BASE_TYPES[category]) throw new TypeError(`mac-services: categoria desconhecida no item ${id} (${category})`);
    const args = Array.isArray(it.args) ? it.args.map(String) : [];
    const types = Array.isArray(it.types) && it.types.length ? it.types.map(clean).filter(Boolean) : null;
    return { id, title, category, args, types };
  });
}

function servicesDir(opts) {
  return (opts && opts.servicesDir) || process.env.MINIME_SERVICES_DIR || path.join(os.homedir(), 'Library', 'Services');
}

// Mexer no sistema (pbs, defaults, osascript) só no Mac e só na pasta de verdade, a menos que peçam.
function systemOn(opts) {
  if (process.platform !== 'darwin') return false;
  const overridden = !!((opts && opts.servicesDir) || process.env.MINIME_SERVICES_DIR);
  return opts && typeof opts.system === 'boolean' ? opts.system : !overridden;
}

// ---------- Pasta Services ----------

function isOurs(bundle) {
  try {
    const txt = fs.readFileSync(path.join(bundle, 'Contents', 'Info.plist'), 'utf8');
    return new RegExp(`<key>${MARK}</key>\\s*<true\\s*/>`).test(txt);
  } catch { return false; }
}

function scan(dir) {
  let names;
  try { names = fs.readdirSync(dir); } catch (e) { if (e.code === 'ENOENT') return []; throw e; }
  return names.filter((n) => /\.workflow$/i.test(n)).map((n) => {
    const p = path.join(dir, n);
    return { name: n, path: p, ours: isOurs(p) };
  });
}

// Sobra de uma gravação interrompida (pasta oculta com nome nosso).
function cleanupStaging(dir) {
  let names = [];
  try { names = fs.readdirSync(dir); } catch { return; }
  for (const n of names) if (STAGING.test(n)) fs.rmSync(path.join(dir, n), { recursive: true, force: true });
}

function listFiles(dir, base = dir) {
  let out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out = out.concat(listFiles(p, base));
    else out.push(path.relative(base, p).split(path.sep).join('/'));
  }
  return out;
}

function sameFiles(dir, files) {
  try {
    const rels = Object.keys(files);
    if (listFiles(dir).sort().join('\n') !== rels.slice().sort().join('\n')) return false;
    return rels.every((rel) => fs.readFileSync(path.join(dir, rel)).equals(Buffer.from(files[rel])));
  } catch { return false; }
}

// Grava numa pasta oculta ao lado e troca de uma vez: o sistema nunca lê um bundle pela metade.
function writeBundle(dir, name, files) {
  const target = path.join(dir, name);
  const tmp = path.join(dir, `.${name}.minime-tmp`);
  fs.rmSync(tmp, { recursive: true, force: true });
  try {
    for (const [rel, data] of Object.entries(files)) {
      const p = path.join(tmp, ...rel.split('/'));
      fs.mkdirSync(path.dirname(p), { recursive: true });
      fs.writeFileSync(p, data);
    }
    fs.rmSync(target, { recursive: true, force: true });
    fs.renameSync(tmp, target);
  } catch (e) {
    fs.rmSync(tmp, { recursive: true, force: true });
    throw e;
  }
}

function readIcon(iconPath) {
  if (!iconPath) return null;
  const ext = path.extname(String(iconPath)).slice(1).toLowerCase();
  if (!['png', 'tif', 'tiff', 'icns', 'pdf', 'jpg', 'jpeg'].includes(ext)) return null;
  try { return { file: `Contents/Resources/icon.${ext}`, data: fs.readFileSync(iconPath) }; } catch { return null; }
}

// Um nome livre pra cada atalho: não repete entre si nem pisa em .workflow que não é nosso.
function allocateName(item, taken, foreign) {
  const base = clip(fileSafe(FILE_PREFIX + item.title), MAX_NAME_BYTES);
  const tries = [base, `${base} (${CAT_LABEL[item.category]})`, `${base} (${clip(fileSafe(item.id), 30)})`];
  for (let i = 0; ; i++) {
    const name = `${i < tries.length ? tries[i] : `${base} (${i - tries.length + 2})`}.workflow`;
    const k = nameKey(name);
    if (!taken.has(k) && !foreign.has(k)) { taken.add(k); return name; }
  }
}

function plan(items, ctx, existing) {
  const taken = new Set();
  const foreign = new Set(existing.filter((e) => !e.ours).map((e) => nameKey(e.name)));
  return items.map((it) => {
    const extra = it.category === 'any'
      ? [...(ctx.extras.image || []), ...(ctx.extras.video || []), ...(ctx.extras.audio || [])]
      : (ctx.extras[it.category] || []);
    const types = [...new Set(it.types || [...BASE_TYPES[it.category], ...extra])];
    const menuTitle = MENU_PREFIX + it.title;
    const script = buildScript({ appPath: ctx.appPath, executable: ctx.executable, bundleId: ctx.bundleId, args: it.args });
    const b = { id: it.id, menuTitle, types, script, iconName: ctx.icon ? 'icon' : 'NSActionTemplate' };
    const files = { 'Contents/Info.plist': buildInfo(b), 'Contents/document.wflow': buildDocument(b) };
    if (ctx.icon) files[ctx.icon.file] = ctx.icon.data;
    return { ...b, name: allocateName(it, taken, foreign), files };
  });
}

// ---------- Sistema (só no Mac) ----------

// Pergunta ao macOS o tipo (UTI) de cada extensão. Extensão que nenhum app declara (ex.: .mkv num Mac
// sem VLC/IINA) ganha um tipo "dyn.…" que não é public.movie: sem isso o atalho não aparece pra ela.
const LOOKUP_JXA = `
ObjC.import('Foundation');
$.NSBundle.bundleWithPath('/System/Library/Frameworks/UniformTypeIdentifiers.framework').load;
function run(argv) {
  const UTType = $.NSClassFromString('UTType');
  const bases = ['public.image', 'public.movie', 'public.audio'].map((id) => UTType.typeWithIdentifier(id));
  return argv.map((arg) => {
    const ext = arg.slice(1);
    const t = UTType.typeWithFilenameExtension(ext);
    if (!t || t.isNil()) return ext;
    return [ext, t.identifier.js].concat(bases.map((b) => (t.conformsToType(b) ? '1' : '0'))).join('\\t');
  }).join('\\n');
}`;

function lookupTypes(extensions) {
  const all = ['image', 'video', 'audio'].flatMap((c) => (extensions && extensions[c]) || []);
  const exts = [...new Set(all.map((e) => String(e).toLowerCase().replace(/^\./, '')).filter((e) => /^[a-z0-9]+$/.test(e)))];
  const map = new Map();
  if (!exts.length) return map;
  const out = execFileSync(OSASCRIPT, ['-l', 'JavaScript', '-e', LOOKUP_JXA, ...exts.map((e) => `.${e}`)],
    { encoding: 'utf8', timeout: 20000, stdio: ['ignore', 'pipe', 'ignore'] });
  for (const line of out.split('\n')) {
    const [ext, id, ...flags] = line.trim().split('\t');
    if (ext && id) map.set(ext, { id, conforms: flags.map((f) => f === '1') });
  }
  return map;
}

// Tipos a somar em cada categoria: os das extensões que não caem no tipo base dela.
function extraTypes(extensions, lookup) {
  const order = ['image', 'video', 'audio'];
  const out = { image: [], video: [], audio: [] };
  order.forEach((cat, i) => {
    for (const raw of (extensions && extensions[cat]) || []) {
      const r = lookup.get(String(raw).toLowerCase().replace(/^\./, ''));
      if (!r || GENERIC.has(r.id) || r.conforms[i]) continue;
      if (!out[cat].includes(r.id)) out[cat].push(r.id);
    }
  });
  return out;
}

function statusKey(menuTitle) { return `(null) - ${menuTitle} - runWorkflowAsService`; }

function existingKeys(xml) {
  const keys = new Set();
  for (const m of String(xml).matchAll(/<key>([^<]*)<\/key>/g)) keys.add(xmlDecode(m[1]).normalize('NFC'));
  return keys;
}

// Argumentos do "defaults write pbs NSServicesStatus -dict-add": a chave vai como <string> XML,
// senão o "(null)" do começo é lido como lista e o comando falha.
function enableArgs(titles, have) {
  const args = ['write', 'pbs', 'NSServicesStatus', '-dict-add'];
  for (const t of new Set(titles)) {
    const key = statusKey(t).normalize('NFC');
    if (have.has(key)) continue;
    args.push(`<string>${xmlEscape(key)}</string>`, PBS_ON);
  }
  return args.length > 4 ? args : null;
}

function enable(titles) {
  let raw;
  try { raw = execFileSync(DEFAULTS, ['export', 'pbs', '-'], { timeout: 10000, stdio: ['ignore', 'pipe', 'ignore'] }); } catch { raw = Buffer.alloc(0); }
  let xml = raw.toString('utf8');
  if (raw.length && !xml.trimStart().startsWith('<')) {
    // Veio binário: converte. Se nem isso der, não mexe (pra não religar o que a pessoa desligou).
    try { xml = execFileSync(PLUTIL, ['-convert', 'xml1', '-o', '-', '-'], { input: raw, timeout: 10000, stdio: ['pipe', 'pipe', 'ignore'] }).toString('utf8'); } catch { return 0; }
  }
  const args = enableArgs(titles, existingKeys(xml));
  if (!args) return 0;
  execFileSync(DEFAULTS, args, { timeout: 10000, stdio: 'ignore' });
  return (args.length - 4) / 2;
}

// Avisa o sistema que a pasta Services mudou (o Automator faz o mesmo ao salvar). Leva uns segundos: não espera.
function refresh() {
  try {
    const child = spawn(PBS, ['-update'], { detached: true, stdio: 'ignore' });
    child.on('error', () => {});
    child.unref();
  } catch {}
}

// ---------- API ----------

// install({ appPath, items, servicesDir?, extensions?, iconPath?, executable?, bundleId?, enable?, system? })
// items: [{ id, title, category: 'image'|'video'|'audio'|'any', args: [...], types?: [UTI...] }]
// extensions (opcional): { image: [...], video: [...], audio: [...] } pra cobrir extensão sem tipo no Mac.
function install(opts = {}) {
  const appPath = checkAppPath(opts.appPath);
  const items = normalizeItems(opts.items || []);
  const dir = servicesDir(opts);
  const sys = systemOn(opts);
  fs.mkdirSync(dir, { recursive: true });
  cleanupStaging(dir);

  let extras = {};
  if (sys && opts.extensions) {
    try { extras = extraTypes(opts.extensions, lookupTypes(opts.extensions)); } catch { extras = {}; }
  }
  const existing = scan(dir);
  const bundles = plan(items, {
    appPath,
    executable: clean(opts.executable) || DEFAULT_EXECUTABLE,
    bundleId: clean(opts.bundleId) || DEFAULT_BUNDLE_ID,
    icon: readIcon(opts.iconPath),
    extras,
  }, existing);

  // Primeiro tira os nossos que saíram da lista, depois grava só o que mudou.
  const keep = new Set(bundles.map((b) => nameKey(b.name)));
  let removed = 0;
  for (const e of existing) {
    if (e.ours && !keep.has(nameKey(e.name))) { fs.rmSync(e.path, { recursive: true, force: true }); removed++; }
  }
  let updated = 0;
  for (const b of bundles) {
    const target = path.join(dir, b.name);
    if (fs.existsSync(target) && sameFiles(target, b.files)) continue;
    writeBundle(dir, b.name, b.files);
    updated++;
  }

  let enabled = 0;
  if (sys && opts.enable !== false && bundles.length) {
    try { enabled = enable(bundles.map((b) => b.menuTitle)); } catch { enabled = 0; }
  }
  if (sys && (updated || removed || enabled)) refresh();
  return { installed: bundles.length, updated, removed, enabled };
}

// Apaga só os .workflow com a nossa marca. As chaves em pbs ficam: reinstalar mantém o que a pessoa escolheu.
function uninstall(opts = {}) {
  const dir = servicesDir(opts);
  let removed = 0;
  for (const e of scan(dir)) {
    if (e.ours) { fs.rmSync(e.path, { recursive: true, force: true }); removed++; }
  }
  cleanupStaging(dir);
  if (removed && systemOn(opts)) refresh();
  return { removed };
}

function isInstalled(opts = {}) {
  return scan(servicesDir(opts)).some((e) => e.ours);
}

module.exports = {
  install,
  uninstall,
  isInstalled,
  // Pra teste: peças puras, sem tocar no disco nem no sistema.
  _test: { toPlist, xmlEscape, xmlDecode, buildScript, buildInfo, buildDocument, fileSafe, clip, stableUuid, statusKey, enableArgs, existingKeys, extraTypes, ere, sh, PBS_ON, BASE_TYPES },
};
