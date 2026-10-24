// Sparkle Studio: the grown-ups' dashboard for Sparkle Valley, running on the family's own computer.
// Double-click SparkleStudio.exe (or run `node studio/studio.cts`): it starts a small private web server on this
// computer only (http://localhost:7777) and opens the dashboard in the browser. It edits the game folder it sits in
// (or the folder chosen in Settings):
//   · content/custom.json                   the family's content pack (message, names, faces, stories, quiz, defaults)
//   · family photos (faces, album)         never in the game folder (round R privacy, 9 Oct): see "family photos" below
//   · voices/                               the offline voice pack (new lines made with Azure, Piper or the microphone)
//   · photos/                               real photos of the landmarks (from Wikipedia/Commons, with credits)
//   · sparkle-valley-netlify.zip            the publish zip, and an optional one-click deploy to Netlify
// Publishing to GitHub sends only what the family changed (content, voices, photos); Netlify then updates the site.
// The pages and their work are the same as the online Studio's (studio/ui and studio/core.cts); see core.cts.
// Keys (Azure, Netlify, GitHub) are kept only on this computer, in %APPDATA%\SparkleStudio\settings.json, never in the game.
'use strict';
const http = require('http'), fs = require('fs'), path = require('path'), os = require('os'), zlib = require('zlib'), vm = require('vm'), { spawn, execFile } = require('child_process');

const { createStudio, buildRank, folderStore, MIME }: StudioEngine = require('./core.cts');
let sea = null; try { sea = require('node:sea'); if (!sea.isSea()) sea = null; } catch (e) { sea = null; }
const UI_DIR = path.join(__dirname, 'ui');
const asset = name => { if (sea) { try { return Buffer.from(sea.getAsset(name)); } catch (e) { return null; } } const p = path.join(UI_DIR, name); return fs.existsSync(p) ? fs.readFileSync(p) : null; };

// ---------- settings (on this computer only) ----------
const CONF_DIR = path.join(process.env.APPDATA || path.join(os.homedir(), '.config'), 'SparkleStudio'), CONF = path.join(CONF_DIR, 'settings.json');
// what Settings keeps (keys only here, never in the game folder)
type Settings = { gameDir?: string, piperExe?: string, piperModels?: Record<string, string>, azureRegion?: string, azureKey?: string,
  netlifySite?: string, netlifyToken?: string, githubRepo?: string, githubBranch?: string, githubToken?: string, siteUrl?: string, studioKey?: string,
  studioPassword?: string, [setting: string]: unknown };
let conf: Settings = {}; try { conf = JSON.parse(fs.readFileSync(CONF, 'utf8')); } catch (e) { conf = {}; }
delete conf.studioPassword; // (round R privacy) the website now takes a Studio key, never the password: the old one is not kept
const saveConf = () => { fs.mkdirSync(CONF_DIR, { recursive: true }); fs.writeFileSync(CONF, JSON.stringify(conf, null, 1)); };
const isGame = d => d && fs.existsSync(path.join(d, 'index.html')) && fs.existsSync(path.join(d, 'js', 'main.js'));
const AS_EXE = !!sea || !!process.env.STUDIO_AS_EXE; // (tests: behave like the packed exe, which has no repository around it)
function findGame() {
  const tries = [process.argv[2], conf.gameDir, path.dirname(process.execPath), process.cwd(), AS_EXE ? null : path.resolve(__dirname, '..')].filter(Boolean);
  for (const t of tries) for (const d of [t, path.dirname(t), path.dirname(path.dirname(t))]) if (isGame(d)) return path.resolve(d); // the folder, or one or two up (studio/dist/)
  return null;
}
let GAME = findGame();
const G = (...p) => path.join(GAME, ...p);
const safeJoin = (root, rel) => { const p = path.resolve(root, '.' + path.sep + decodeURIComponent(rel).replace(/^[\\/]+/, '')); const r = path.resolve(root); return p === r || p.startsWith(r + path.sep) ? p : null; };

// ---------- helpers ----------
const send = (res, code, body, type = 'application/json; charset=utf-8') => { res.writeHead(code, { 'Content-Type': type, 'Cache-Control': 'no-store' }); res.end(typeof body === 'string' || Buffer.isBuffer(body) ? body : JSON.stringify(body)); };
const readBody = (req, max = 60e6) => new Promise((ok, no) => { const ch = []; let n = 0; req.on('data', c => { n += c.length; if (n > max) { no(new Error('too big')); req.destroy(); } else ch.push(c); }); req.on('end', () => ok(Buffer.concat(ch))); req.on('error', no); });

// ---------- Piper: free voices that run on this computer, no internet (https://github.com/rhasspy/piper) ----------
// The grown-up downloads piper.exe and a voice model (.onnx) per language and puts their paths in Settings.
// lame.min.js (the MP3 encoder, a plain script run in its own little world)
type Lame = { Mp3Encoder: new (channels: number, rate: number, kbps: number) => { encodeBuffer(s: Int16Array): Int8Array, flush(): Int8Array } };
let lame: Lame | null = null;
function lameLib() { if (lame) return lame; const src = asset('lame.min.js'); if (!src) throw new Error('The MP3 encoder is missing.'); const ctx: Record<string, unknown> & { lamejs?: Lame } = { console, Math, Int8Array, Int16Array, Int32Array, Float32Array, Float64Array, Uint8Array, Array, ArrayBuffer }; ctx.window = ctx; ctx.self = ctx; vm.runInNewContext(src.toString('utf8'), ctx); lame = ctx.lamejs; return lame; }
function wavToMp3(buf) {
  // a plain 16-bit PCM WAV (what Piper writes) → MP3 32 kbps mono
  let p = 12, rate = 22050, ch = 1, data = null;
  while (p < buf.length - 8) { const id = buf.toString('ascii', p, p + 4), n = buf.readUInt32LE(p + 4); if (id === 'fmt ') { ch = buf.readUInt16LE(p + 10); rate = buf.readUInt32LE(p + 12); } if (id === 'data') { data = buf.subarray(p + 8, p + 8 + n); break; } p += 8 + n + (n & 1); }
  if (!data) throw new Error('Piper did not make a WAV file.');
  const L = lameLib(), samples = new Int16Array(data.buffer, data.byteOffset, Math.floor(data.length / 2 / ch) * ch);
  const mono = ch === 1 ? samples : Int16Array.from({ length: samples.length / ch }, (_, i) => samples[i * ch]);
  const enc = new L.Mp3Encoder(1, rate, 32), out = [];
  for (let i = 0; i < mono.length; i += 1152) { const b = enc.encodeBuffer(mono.subarray(i, i + 1152)); if (b.length) out.push(Buffer.from(b)); }
  const e = enc.flush(); if (e.length) out.push(Buffer.from(e));
  return Buffer.concat(out);
}
function piperSay(lang, text) {
  const exe = conf.piperExe, model = conf.piperModels && conf.piperModels[lang];
  if (!exe || !fs.existsSync(exe)) return Promise.reject(new Error('Set the path to piper.exe in Settings first.'));
  if (!model || !fs.existsSync(model)) return Promise.reject(new Error(`Set a Piper voice model for ${lang} in Settings first.`));
  const tmp = path.join(os.tmpdir(), 'sparkle-piper-' + Date.now() + '-' + Math.random().toString(36).slice(2) + '.wav');
  return new Promise((ok, no) => {
    const p = spawn(exe, ['--model', model, '--output_file', tmp], { windowsHide: true }); let err = '';
    p.stderr.on('data', d => { err += d; }); p.on('error', no);
    p.on('close', code => { try { if (code !== 0 || !fs.existsSync(tmp)) return no(new Error('Piper stopped: ' + err.slice(-200))); const mp3 = wavToMp3(fs.readFileSync(tmp)); fs.unlinkSync(tmp); ok(mp3); } catch (e) { no(e); } });
    p.stdin.end(text);
  });
}

// ---------- the publish zip (a small ZIP writer: deflate, CRC-32) ----------
const CRC = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
const crc32 = b => { let c = 0xffffffff; for (let i = 0; i < b.length; i++) c = CRC[(c ^ b[i]) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
function zipFolder(root, items, out) {
  const files = [];
  const walk = rel => { const abs = path.join(root, rel); if (!fs.existsSync(abs)) return; const st = fs.statSync(abs); if (st.isDirectory()) { for (const f of fs.readdirSync(abs)) { if (f === 'old' && rel.endsWith('content')) continue; walk(path.join(rel, f)); } } else files.push(rel); };
  items.forEach(walk);
  const fd = fs.openSync(out, 'w'), central = []; let off = 0;
  const w = b => { fs.writeSync(fd, b); off += b.length; };
  for (const rel of files) {
    const data = fs.readFileSync(path.join(root, rel)), name = Buffer.from(rel.split(path.sep).join('/'), 'utf8'), crc = crc32(data);
    const already = /\.(mp3|mp4|png|jpg|jpeg|woff2|zip)$/i.test(rel), body = already ? data : zlib.deflateRawSync(data, { level: 9 }), method = already ? 0 : 8;
    const h = Buffer.alloc(30); h.writeUInt32LE(0x04034b50, 0); h.writeUInt16LE(20, 4); h.writeUInt16LE(0x0800, 6); h.writeUInt16LE(method, 8); h.writeUInt32LE(0, 10); h.writeUInt32LE(crc, 14); h.writeUInt32LE(body.length, 18); h.writeUInt32LE(data.length, 22); h.writeUInt16LE(name.length, 26); h.writeUInt16LE(0, 28);
    const at = off; w(h); w(name); w(body);
    const c = Buffer.alloc(46); c.writeUInt32LE(0x02014b50, 0); c.writeUInt16LE(20, 4); c.writeUInt16LE(20, 6); c.writeUInt16LE(0x0800, 8); c.writeUInt16LE(method, 10); c.writeUInt32LE(0, 12); c.writeUInt32LE(crc, 16); c.writeUInt32LE(body.length, 20); c.writeUInt32LE(data.length, 24); c.writeUInt16LE(name.length, 28); c.writeUInt32LE(at, 42);
    central.push(Buffer.concat([c, name]));
  }
  const cd = Buffer.concat(central), start = off; w(cd);
  const e = Buffer.alloc(22); e.writeUInt32LE(0x06054b50, 0); e.writeUInt16LE(files.length, 8); e.writeUInt16LE(files.length, 10); e.writeUInt32LE(cd.length, 12); e.writeUInt32LE(start, 16); w(e);
  fs.closeSync(fd);
  return { files: files.length, bytes: off };
}
const PUBLISH = ['index.html', 'manifest.webmanifest', 'sw.js', 'netlify.toml', 'css', 'fonts', 'icons', 'js', 'vendor', 'videos', 'content', 'voices', 'photos'];

// ---------- family photos (owner, 9 Oct, round R privacy: family-only, random names, never public files) ----------
// Why both places: the children's devices can only reach the website, so when the website and a Studio key are set in
// Settings, every photo is sent to the website's private family store (the online Studio API, X-Studio-Key) and the
// devices fetch it there with the family code. A copy also stays here, in %APPDATA%\SparkleStudio\family-photos (outside
// the game folder, so it is never zipped, drafted or published), and the game run from this Studio reads it from
// there (/studio/game/api/family/<name>, this computer only). With no website set they stay on this computer only.
const FAM_DIR = path.join(CONF_DIR, 'family-photos'), FAMNAME = /^[\w-]{24,64}$/;
const linked = () => !!(conf.siteUrl && conf.studioKey);
async function siteApi(p: string, body?: unknown) {
  const r = await fetch(site() + '/studio/api/' + p, body === undefined ? { headers: { 'X-Studio-Key': conf.studioKey || '' } } : { method: 'POST', headers: { 'X-Studio-Key': conf.studioKey || '', 'X-Studio': '1', 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  if (!r.ok) { const j = await r.json().catch(() => ({})); throw new Error(j.error || 'The website said ' + r.status); }
  return r;
}
const famFile = name => { if (!FAMNAME.test(name || '')) throw new Error('bad name'); return path.join(FAM_DIR, name + '.jpg'); };
const family = {
  get where() { return linked() ? 'site' : 'computer'; },
  put: async (name, buf) => { if (linked()) await siteApi('family/upload', { name, data: Buffer.from(buf).toString('base64') }); fs.mkdirSync(FAM_DIR, { recursive: true }); fs.writeFileSync(famFile(name), buf); },
  get: async name => {
    const f = famFile(name); if (fs.existsSync(f)) return fs.readFileSync(f);
    if (!linked()) return null;
    try { const b = Buffer.from(await (await siteApi('familyphoto/' + name)).arrayBuffer()); fs.mkdirSync(FAM_DIR, { recursive: true }); fs.writeFileSync(f, b); return b; } catch (e) { return null; }
  },
  remove: async name => { try { fs.unlinkSync(famFile(name)); } catch (e) { } if (linked()) await siteApi('family/remove', { name }).catch(() => { }); },
  code: async () => linked() ? (await siteApi('family/code')).json() : { code: '', local: true },
  newCode: async () => { if (!linked()) return { error: 'Set the website and a Studio key in Settings first.' }; return (await siteApi('family/code/new', {})).json(); }
};

// ---------- updating itself (owner, 12 Oct: "the exe i have will get updated once there is new function") ----------
// A new exe is put on the GitHub branch "studio-exe" with version.json { studio, sha256, size, notes } (tools/publish-exe.sh).
// The exe asks for it with the GitHub key in Settings (the repository may be private). "Update now" downloads the new exe
// next to this one, checks its checksum, swaps it in (Windows lets a running exe be renamed) and starts it; the old one
// is removed on the next start. Settings and keys stay in %APPDATA%. If anything fails, the exe stays as it was.
const HERE = require('./version.json').studio, EXE_BRANCH = 'studio-exe';
const GH_UPD = () => process.env.STUDIO_GITHUB_API || 'https://api.github.com';
const num = v => buildRank(v); // (owner, 24 Oct 2026 AEDT) v1.01 sorts after r90, as on the website
const selfExe = () => process.env.STUDIO_UPDATE_EXE || (sea ? process.execPath : null);
async function exeFile(rel) {
  if (!conf.githubToken || !/^[\w.-]+\/[\w.-]+$/.test(conf.githubRepo || '')) throw new Error('Add the GitHub token and repository (owner/name) in Settings first.');
  const r = await fetch(`${GH_UPD()}/repos/${conf.githubRepo}/contents/${rel}?ref=${EXE_BRANCH}`, { headers: { Authorization: 'Bearer ' + conf.githubToken, Accept: 'application/vnd.github.raw', 'User-Agent': 'sparkle-studio', 'X-GitHub-Api-Version': '2022-11-28' } });
  if (r.status === 404) return null;
  if (!r.ok) throw new Error(`GitHub ${r.status} while looking for a new Sparkle Studio`);
  return Buffer.from(await r.arrayBuffer());
}
// newer: a higher version, or (owner, 12 Oct) a rebuild of the same version with fixes (its checksum differs from this exe's)
const mySum = () => { const e = selfExe(); try { return e ? require('crypto').createHash('sha256').update(fs.readFileSync(e)).digest('hex') : null; } catch (x) { return null; } };
const isNewer = v => num(v.studio) > num(HERE) || (num(v.studio) === num(HERE) && !!v.sha256 && !!selfExe() && v.sha256 !== mySum());
async function updateCheck() {
  const b = await exeFile('version.json'); if (!b) return { here: HERE, latest: null, newer: false, can: !!selfExe() };
  const v = JSON.parse(b.toString('utf8'));
  return { here: HERE, latest: v.studio, newer: isNewer(v), notes: String(v.notes || '').slice(0, 400), can: !!selfExe() };
}
let updating = false;
async function updateApply() {
  const exe = selfExe(); if (!exe) return { error: 'Only SparkleStudio.exe updates itself.' };
  if (updating) return { error: 'Already updating.' }; updating = true;
  try {
    const vb = await exeFile('version.json'); if (!vb) return { error: 'No new Sparkle Studio on GitHub.' };
    const v = JSON.parse(vb.toString('utf8')); if (!isNewer(v)) return { ok: true, latest: v.studio, note: 'Already the newest.' };
    log(`Updating Sparkle Studio ${HERE} to ${v.studio}…`);
    const buf = await exeFile('SparkleStudio.exe'); if (!buf) return { error: 'The new SparkleStudio.exe is not on GitHub.' };
    if (!v.sha256 || require('crypto').createHash('sha256').update(buf).digest('hex') !== v.sha256) return { error: 'The download did not match its checksum: nothing was changed.' };
    const dir = path.dirname(exe), base = path.basename(exe, '.exe'), neu = path.join(dir, base + '.new.exe'), old = path.join(dir, base + '.old.exe');
    fs.writeFileSync(neu, buf); try { fs.rmSync(old, { force: true }); } catch (e) { }
    fs.renameSync(exe, old);
    try { fs.renameSync(neu, exe); } catch (e) { fs.renameSync(old, exe); throw e; }
    log(`Sparkle Studio ${v.studio} is in place: starting it.`);
    const restart = process.env.STUDIO_UPDATE_NO_RESTART ? null : () => { server.close(); spawn(exe, process.argv.slice(2), { detached: true, stdio: 'ignore', env: { ...process.env, STUDIO_NO_OPEN: '1' } }).unref(); setTimeout(() => process.exit(0), 300); };
    return { ok: true, latest: v.studio, restart };
  } finally { updating = false; }
}
{ const exe = selfExe(); if (exe) setTimeout(() => { try { fs.rmSync(path.join(path.dirname(exe), path.basename(exe, '.exe') + '.old.exe'), { force: true }); } catch (e) { } }, 4000); } // left by an update

// ---------- keeping the game folder up to date (owner, 12 Oct: the exe showed the game as r38 while the website was r63) ----------
// The exe works on the game folder on this computer. When it starts (and every 30 minutes, and from Settings) it gets
// every game file that changed on GitHub's main branch. A content, voice or photo file changed here since the last time
// and not published yet is kept (and listed); content/*.json files it replaces are copied to content/old/ first.
// sync.json (next to the settings) remembers what GitHub had last time.
const SYNC = path.join(CONF_DIR, 'sync.json'), SYNC_SKIP = /^(\.git|node_modules|studio\/dist|studio\/\.build|content\/old)\//;
const FAM_FILE = rel => /^(content|voices|photos)\//.test(rel) || rel === 'tools/voice-extra.json';
const gitShaOf = b => require('crypto').createHash('sha1').update('blob ' + b.length + '\0').update(b).digest('hex');
type Sync = { state: string, done: number, total: number, msg: string, kept: string[], error: string, from?: string, to?: string, fresh?: boolean };
let sync: Sync = { state: 'idle', done: 0, total: 0, msg: '', kept: [], error: '' };
// GitHub's answer: each caller names the parts it reads (an answer that is not JSON reads as empty)
async function ghJ<T extends object>(p: string): Promise<Partial<T>> {
  const r = await fetch(`${GH_UPD()}/repos/${conf.githubRepo}${p}`, { headers: { Authorization: 'Bearer ' + conf.githubToken, Accept: 'application/vnd.github+json', 'User-Agent': 'sparkle-studio', 'X-GitHub-Api-Version': '2022-11-28' } });
  const t = await r.text(); let j: Partial<T> = {}; try { j = JSON.parse(t); } catch (e) { }
  if (!r.ok) throw new Error(`GitHub ${r.status} while getting the newest game`); return j;
}
const folderBuild = () => { try { return (/VERSION = 'sv-\d{4}-\d{2}-\d{2}-([^']+)'/.exec(fs.readFileSync(G('sw.js'), 'utf8')) || [])[1] || '?'; } catch (e) { return '?'; } };
// (owner, 12 Oct: "if the game folder is not latest or not available then it will download the latest from github")
// with no game folder at all, the newest game goes into a "SparkleValley" folder next to the exe
const newGameDir = () => path.join(path.dirname(selfExe() || process.execPath), 'SparkleValley');
async function syncFolder(force) {
  if (sync.state === 'running' || !conf.githubToken || !/^[\w.-]+\/[\w.-]+$/.test(conf.githubRepo || '')) return sync;
  const fresh = !GAME; if (fresh) { GAME = conf.gameDir && !isGame(conf.gameDir) ? path.resolve(conf.gameDir) : newGameDir(); fs.mkdirSync(GAME, { recursive: true }); force = true; }
  sync = { state: 'running', done: 0, total: 0, msg: '', kept: [], error: '', from: folderBuild(), fresh };
  try {
    const head = (await ghJ<{ object: { sha: string } }>(`/git/ref/heads/${encodeURIComponent(conf.githubBranch || 'main')}`)).object.sha;
    let rec: { commit?: string, dir?: string, shas?: Record<string, string> } = {}; try { rec = JSON.parse(fs.readFileSync(SYNC, 'utf8')) || {}; } catch (e) { rec = {}; }
    if (!force && rec.commit === head && rec.dir === GAME) { sync.state = 'done'; sync.msg = ''; return sync; }
    const t = await ghJ<{ truncated: boolean, tree: { path: string, type: string, sha: string }[] }>(`/git/trees/${(await ghJ<{ tree: { sha: string } }>(`/git/commits/${head}`)).tree.sha}?recursive=1`);
    if (t.truncated) throw new Error('GitHub sent only part of the game: get it as a ZIP from GitHub instead.');
    const tree = t.tree.filter(x => x.type === 'blob' && !SYNC_SKIP.test(x.path)), before = (rec.dir === GAME && rec.shas) || {}, todo = [], shas = {};
    for (const x of tree) {
      const f = safeJoin(GAME, x.path); if (!f) continue;
      let local = null; try { local = fs.readFileSync(f); } catch (e) { }
      const ls = local ? gitShaOf(local) : null; shas[x.path] = x.sha;
      if (ls === x.sha) continue;
      if (FAM_FILE(x.path) && local && before[x.path] && ls !== before[x.path]) { sync.kept.push(x.path); shas[x.path] = before[x.path]; continue; } // changed here, not published yet
      todo.push(x);
    }
    sync.total = todo.length;
    const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
    let k = 0;
    const worker = async () => { while (k < todo.length) { const x = todo[k++]; sync.msg = x.path;
      const b = Buffer.from((await ghJ<{ content: string }>(`/git/blobs/${x.sha}`)).content || '', 'base64'), f = safeJoin(GAME, x.path);
      if (/^content\/[^/]+\.json$/.test(x.path) && fs.existsSync(f)) { fs.mkdirSync(G('content', 'old'), { recursive: true }); fs.copyFileSync(f, G('content', 'old', stamp + '-' + path.basename(f))); }
      fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, b); sync.done++; } };
    await Promise.all(Array.from({ length: 6 }, worker));
    fs.mkdirSync(CONF_DIR, { recursive: true }); fs.writeFileSync(SYNC, JSON.stringify({ commit: head, dir: GAME, shas }));
    sync.state = 'done'; sync.to = folderBuild(); sync.msg = '';
    if (fresh) { if (!isGame(GAME)) throw new Error('GitHub sent only part of the game: get it as a ZIP from GitHub instead.'); conf.gameDir = GAME; saveConf(); }
    if (todo.length) { studio = null; log(`Game folder updated from GitHub: ${todo.length} files (${sync.from} to ${sync.to}); kept ${sync.kept.length} not published.`); }
  } catch (e) { sync.state = 'error'; sync.error = String(e && e.message || e); log('Getting the newest game: ' + sync.error); if (fresh && !isGame(GAME)) GAME = null; }
  return sync;
}

// ---------- the server ----------
// Everything a page asks for is done by the Studio engine (core.cts, the same as online); this file adds what only
// a computer can do: the game folder, keys saved here, Piper, the publish zip, opening folders and closing.
const store = () => folderStore(GAME);
const site = () => (conf.siteUrl || 'https://sparklevalley.netlify.app').replace(/\/+$/, '');
const local = {
  tts: (engine, lang, text) => piperSay(lang, text),
  settings: b => {
    for (const k of ['azureRegion', 'netlifySite', 'piperExe', 'githubRepo', 'githubBranch', 'siteUrl']) if (typeof b[k] === 'string') conf[k] = b[k].trim();
    for (const k of ['azureKey', 'netlifyToken', 'githubToken', 'studioKey']) if (typeof b[k] === 'string' && b[k].trim()) conf[k] = b[k].trim(); // empty = keep the saved one
    if (b.forget) for (const k of [].concat(b.forget)) delete conf[k];
    if (b.piperModels && typeof b.piperModels === 'object') conf.piperModels = Object.assign(conf.piperModels || {}, b.piperModels);
    if (typeof b.gameDir === 'string' && b.gameDir.trim()) { if (!isGame(b.gameDir.trim())) return { code: 400, body: { error: 'That folder has no game in it (index.html and js/main.js).' } }; conf.gameDir = path.resolve(b.gameDir.trim()); GAME = conf.gameDir; }
    saveConf(); studio = null; if (!GAME) setTimeout(() => syncFolder(false), 200); return { code: 200, body: { ok: true } }; // keys changed: the engine starts again with them (and the newest game is fetched)
  },
  // the players report lives on the website (Netlify): asked for with the Studio key saved here (round R privacy: the
  // website signs people in with two steps, so this computer has its own key, made online in Setup → Security)
  players: async () => { if (!conf.studioKey) throw new Error('Make a Studio key online (Setup → Security) and put it in Settings.'); return (await siteApi('players')).json(); },
  label: async b => (await siteApi('players/label', { id: b.id, label: b.label })).json(),
  inbox: async () => { if (!conf.studioKey) return []; try { return await (await siteApi('inbox')).json(); } catch (e) { return []; } },
  // (owner, 12 Oct) tester reports live on the website too: the same pages, asked for with this computer's Studio key
  testers: async (api, b) => { if (!conf.studioKey) throw new Error('Make a Studio key online (Setup → Security) and put it in Settings.'); return (await siteApi(api, b === null ? undefined : b)).json(); },
  // (r81, owner 17 Oct AEDT) the content pages go live at once: the same sections the online Studio saves, sent with
  // this computer's Studio key (the game folder keeps its own copy too, so Publish still works)
  live: async b => { if (!linked()) throw new Error('Set the website and a Studio key in Settings to put these pages live at once.'); return (await siteApi('live/content', b === null ? undefined : b)).json(); },
  onlineVersion: async () => { const r = await fetch(site() + '/studio/version.json', { cache: 'no-store' }); return r.ok ? (await r.json()).studio : null; },
  api: async (api, method, b) => {
    if (api === 'build' && method === 'POST') { const out = G('sparkle-valley-netlify.zip'); return { code: 200, body: Object.assign({ path: out }, zipFolder(GAME, PUBLISH, out)) }; }
    if (api === 'deploy' && method === 'POST') {
      if (!conf.netlifyToken || !conf.netlifySite) return { code: 400, body: { error: 'Add your Netlify token and site in Settings first.' } };
      const f = G('sparkle-valley-netlify.zip'); if (!fs.existsSync(f)) return { code: 400, body: { error: 'Build the zip first.' } };
      const r = await fetch(`https://api.netlify.com/api/v1/sites/${encodeURIComponent(conf.netlifySite)}/deploys`, { method: 'POST', headers: { Authorization: 'Bearer ' + conf.netlifyToken, 'Content-Type': 'application/zip' }, body: fs.readFileSync(f) });
      const t = await r.text(); let j: { message?: string, state?: string, ssl_url?: string, url?: string, deploy_ssl_url?: string, admin_url?: string } = {}; try { j = JSON.parse(t); } catch (e) { }
      if (!r.ok) return { code: 502, body: { error: `Netlify said ${r.status}: ${(j.message || t).slice(0, 200)}` } };
      return { code: 200, body: { ok: true, state: j.state, url: j.ssl_url || j.url || j.deploy_ssl_url, admin: j.admin_url } };
    }
    if (api === 'open' && method === 'POST') { openThing(b.folder ? GAME : `http://localhost:${PORT}/studio/game/`); return { code: 200, body: { ok: true } }; }
    return null;
  }
};
let studio = null, studioFor = null;
const engine = () => { if (!studio || studioFor !== GAME) { studio = createStudio({ store: store(), conf, local, family }); studioFor = GAME; } return studio; };
const PORT = +(process.env.STUDIO_PORT || 7777);
const server = http.createServer(async (req, res) => {
  try {
    if (!/^(localhost|127\.0\.0\.1)(:\d+)?$/.test(req.headers.host || '')) return send(res, 403, 'local only', 'text/plain');
    const url = new URL(req.url, 'http://localhost'), p = url.pathname;
    if (req.method === 'POST' && req.headers.origin && !/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(req.headers.origin)) return send(res, 403, { error: 'local only' });
    // the dashboard, at the same addresses as online (the website's /studio/), so the pages are exactly the same
    if (p === '/' || p === '/index.html' || p === '/studio') { res.writeHead(302, { Location: '/studio/' }); return res.end(); }
    if (p === '/studio/') return send(res, 200, asset('index.html'), MIME['.html']);
    if (p.startsWith('/studio/ui/')) { const b = asset(p.slice(11)); return b ? send(res, 200, b, MIME[path.extname(p)] || 'application/octet-stream') : send(res, 404, 'not found', 'text/plain'); }
    // (round R privacy) a family photo for the game run from here (this computer only, so no family code is asked)
    const fm = /^\/studio\/game\/api\/family\/([\w-]{24,64})$/.exec(p);
    if (fm) { const b = await family.get(fm[1]); if (!b) return send(res, 404, 'not found', 'text/plain'); res.writeHead(200, { 'Content-Type': 'image/jpeg', 'Cache-Control': 'private, no-store' }); return res.end(b); }
    // the game itself, to try things out (and the game's modules the pages load: they fetch content/ and voices/
    // from the page's own address)
    const gp = p.startsWith('/studio/game/') ? p.slice(13) : /^\/studio\/(content|voices)\//.test(p) ? p.slice(8) : null;
    if (gp !== null) {
      if (!GAME) return send(res, 404, 'no game folder', 'text/plain');
      const f = safeJoin(GAME, gp || 'index.html'); if (!f) return send(res, 403, 'no', 'text/plain');
      const file = fs.existsSync(f) && fs.statSync(f).isDirectory() ? path.join(f, 'index.html') : f;
      // (owner, 16 Oct AEDT: TypeScript) the game folder comes from GitHub, which has a converted file's .ts only: its .js
      // is made here as it is asked for, the same way tools/build.mts makes it (Node's type stripping, lines unchanged)
      if (!fs.existsSync(file) && /\.js$/.test(file) && fs.existsSync(file.slice(0, -3) + '.ts')) {
        try { return send(res, 200, Buffer.from(require('module').stripTypeScriptTypes(fs.readFileSync(file.slice(0, -3) + '.ts', 'utf8'), { mode: 'strip' })), MIME['.js']); }
        catch (e) { return send(res, 500, `${gp.replace(/\.js$/, '.ts')}: ${String(e && e.message || e).split('\n')[0]}`, 'text/plain'); }
      }
      if (!fs.existsSync(file)) return send(res, 404, 'not found', 'text/plain');
      return send(res, 200, fs.readFileSync(file), MIME[path.extname(file).toLowerCase()] || 'application/octet-stream');
    }
    if (!p.startsWith('/studio/api/')) return send(res, 404, 'not found', 'text/plain');
    const api = decodeURIComponent(p.slice(12)); lastSeen = Date.now();
    if (api === 'sync/status') return send(res, 200, { ...sync, build: folderBuild() });
    if (api === 'sync/start' && req.method === 'POST') { const b = JSON.parse((await readBody(req)).toString() || '{}'); syncFolder(!!b.force); return send(res, 200, { ...sync, build: folderBuild() }); }
    if (api === 'update/check') { try { return send(res, 200, await updateCheck()); } catch (e) { return send(res, 200, { here: HERE, error: e.message }); } }
    if (api === 'update/apply' && req.method === 'POST') { let r; try { r = await updateApply(); } catch (e) { r = { error: e.message }; } const go = r.restart; delete r.restart; send(res, 200, r); if (go) setTimeout(go, 400); return; }
    if (api === 'quit' && req.method === 'POST') { send(res, 200, { ok: true }); log('Closed from the dashboard.'); setTimeout(() => process.exit(0), 300); return; }
    if (api === 'zip') { const f = G('sparkle-valley-netlify.zip'); if (!fs.existsSync(f)) return send(res, 404, { error: 'Build the zip first.' }); res.writeHead(200, { 'Content-Type': 'application/zip', 'Content-Disposition': 'attachment; filename="sparkle-valley-netlify.zip"' }); return fs.createReadStream(f).pipe(res); }
    const r = await engine().handle(api, req.method, req.method === 'POST' ? await readBody(req) : null);
    if (api === 'info' && r.body) r.body.settingsFile = CONF;
    return r.raw ? send(res, r.code, r.raw, r.type) : send(res, r.code, r.body);
  } catch (e) { send(res, 500, { error: String(e && e.message || e) }); }
});
function openThing(u) {
  if (process.platform === 'win32') execFile('cmd', ['/c', 'start', '', u], { windowsHide: true });
  else if (process.platform === 'darwin') execFile('open', [u]); else execFile('xdg-open', [u], () => { });
}
// The dashboard opens in its own app window (Edge or Chrome "--app": no address bar, no tabs), else the default browser.
function openApp(u) {
  if (process.platform === 'win32') {
    const E = process.env, cands = [[E['ProgramFiles(x86)'], 'Microsoft\\Edge\\Application\\msedge.exe'], [E.ProgramFiles, 'Microsoft\\Edge\\Application\\msedge.exe'], [E.ProgramFiles, 'Google\\Chrome\\Application\\chrome.exe'], [E['ProgramFiles(x86)'], 'Google\\Chrome\\Application\\chrome.exe'], [E.LOCALAPPDATA, 'Google\\Chrome\\Application\\chrome.exe']];
    for (const [dir, rel] of cands) { if (!dir) continue; const exe = path.join(dir, rel); if (fs.existsSync(exe)) { try { spawn(exe, ['--app=' + u, '--window-size=1280,900'], { detached: true, stdio: 'ignore' }).unref(); return; } catch (e) { } } }
  }
  openThing(u);
}
// Packaged as the exe there is no console window: messages go to a log file next to the settings.
const LOG = path.join(CONF_DIR, 'studio.log');
try { fs.mkdirSync(CONF_DIR, { recursive: true }); fs.writeFileSync(LOG, ''); } catch (e) { }
const log = m => { console.log(m); try { fs.appendFileSync(LOG, new Date().toISOString() + ' ' + m + '\n'); } catch (e) { } };
process.on('uncaughtException', e => { log('error: ' + (e && e.stack || e)); });
// The exe stops by itself a few minutes after its window is closed (the dashboard checks in every 20 s; hidden windows may slow that to once a minute).
const AUTO_QUIT = !!sea || !!process.env.STUDIO_AUTO_QUIT, QUIT_AFTER = +(process.env.STUDIO_QUIT_MS || 180000);
let lastSeen = 0;
setInterval(() => { if (AUTO_QUIT && lastSeen && Date.now() - lastSeen > QUIT_AFTER) { log('No dashboard window for a while: stopping.'); process.exit(0); } }, 5000);
server.on('error', e => { if (e.code === 'EADDRINUSE') { log(`Sparkle Studio is already open: http://localhost:${PORT}`); openApp(`http://localhost:${PORT}/studio/`); setTimeout(() => process.exit(0), 1500); } else { log('error: ' + e.message); process.exit(1); } });
server.listen(PORT, '127.0.0.1', () => {
  log(`Sparkle Studio is running: http://localhost:${PORT} · game folder: ${GAME || '(choose it in Settings)'}`);
  if (!process.env.STUDIO_NO_OPEN) openApp(`http://localhost:${PORT}/studio/`);
  setTimeout(() => syncFolder(false), 1500); setInterval(() => syncFolder(false), 30 * 60e3); // the newest game, by itself
});
