// Sparkle Studio's engine: the work behind every page (content, faces, ads, voices, photos, publishing, the website,
// the health check, players). It is the same program in both places the Studio runs:
//   · the exe on the family's computer (studio.cts): files in the game folder, keys in %APPDATA%\SparkleStudio
//   · online, on the game's own website (netlify/functions/studio.mts): files in GitHub, keys in Netlify's
//     environment variables, behind the grown-ups' password
// Only where the files live (a "store") and a few computer-only things (Piper, the zip, opening folders) differ,
// so the two never drift apart. STUDIO_VERSION goes up with the game's build number (tests check this), and the
// exe compares itself with the online Studio on the Check page.
'use strict';
const fs = require('fs'), path = require('path'), crypto = require('crypto');
const { splitManifest } = require('../tools/voice-manifests.cts');
const STUDIO_VERSION = require('./version.json').studio;
// the order of game builds, the same rule as netlify/lib/build-number.mts (owner, 24 Oct 2026 AEDT): r83 → 83,
// r89.1 → 89.1, r90 (shown as v1) → 1000, v1.01 → 1001, v2.00 → 2000; anything else → 0
const buildRank = (b: unknown): number => { const s = String(b || ''); if (s === 'r90') return 1000; let m = /^r(\d{1,4}(?:\.\d{1,2})?)$/.exec(s); if (m) return +m[1]; m = /^v(\d{1,2})\.(\d{2})$/.exec(s); return m ? 1000 * +m[1] + +m[2] : 0; };

// ---------- where the files live ----------
// A store reads and writes the game's files by their path in the game (content/custom.json, voices/vi/f/….mp3).
//   read(rel) → Buffer | null · write(rel, buf) · remove(rel) · list(dir) → file names · walk(dir) → paths
//   flush(message) → called once at the end of each request (the online store makes one commit of it)
const safeJoin = (root, rel) => { const p = path.resolve(root, '.' + path.sep + decodeURIComponent(rel).replace(/^[\\/]+/, '')); const r = path.resolve(root); return p === r || p.startsWith(r + path.sep) ? p : null; };
function folderStore(root) {
  const at = rel => { const p = root && safeJoin(root, rel); if (!p) throw new Error('bad path'); return p; };
  return {
    kind: 'folder', where: root || '', backup: true,
    ok: () => !!root && fs.existsSync(path.join(root, 'index.html')) && ['main.js', 'main.ts'].some(f => fs.existsSync(path.join(root, 'js', f))), // (r86: main is TypeScript; the exe makes main.js from it when asked)
    read: async rel => { try { const p = at(rel); return fs.statSync(p).isFile() ? fs.readFileSync(p) : null; } catch (e) { return null; } },
    write: async (rel, buf) => { const p = at(rel); fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, buf); },
    remove: async rel => { const p = at(rel); if (fs.existsSync(p)) fs.unlinkSync(p); },
    list: async dir => { try { return fs.readdirSync(at(dir), { withFileTypes: true }).filter(d => d.isFile()).map(d => d.name); } catch (e) { return []; } },
    walk: async dir => { const out = [], go = rel => { let st; try { st = fs.statSync(at(rel)); } catch (e) { return; } if (st.isDirectory()) { for (const f of fs.readdirSync(at(rel))) { if (rel === 'content' && f === 'old') continue; go(rel + '/' + f); } } else out.push(rel); }; go(dir); return out; },
    flush: async () => null
  };
}

// GitHub, for the online Studio. The family's changes go to a draft branch ("studio-draft") first, so the website
// does not rebuild on every click; Publish copies them onto the main branch as one commit (exactly like the exe's
// Publish). Only the family's own files can be written: content/, voices/, photos/, tools/voice-extra.json.
const FAMILY = rel => /^(content|voices|photos)\//.test(rel) || rel === 'tools/voice-extra.json';
// (tests point the exe at a pretend GitHub with STUDIO_GITHUB_API; it is never set for families)
// what the Studio sends to GitHub or Netlify
type Ask = { method?: string, body?: string };
const GH_API = (typeof process !== 'undefined' && process.env && process.env.STUDIO_GITHUB_API) || 'https://api.github.com';
function ghApi(token) {
  // (owner, 12 Oct: real photos would not publish, "error 504") GitHub sometimes answers 502, 503 or 504 when it is busy:
  // such a request is tried twice more after a short wait before it counts as an error
  return async (p: string, opt: Ask = {}) => {
    for (let a = 0; ; a++) {
      let r; try { r = await fetch(GH_API + p, { ...opt, headers: { Authorization: 'Bearer ' + token, Accept: 'application/vnd.github+json', 'User-Agent': 'sparkle-studio', 'X-GitHub-Api-Version': '2022-11-28', ...(opt.body ? { 'Content-Type': 'application/json' } : {}) } }); }
      catch (e) { if (a < 2) { await new Promise(res => setTimeout(res, 700 * (a + 1))); continue; } throw e; }
      if ([502, 503, 504].includes(r.status) && a < 2) { await r.text().catch(() => ''); await new Promise(res => setTimeout(res, 700 * (a + 1))); continue; }
      const t = await r.text(); let j: any = {}; try { j = JSON.parse(t); } catch (e) { }
      if (!r.ok) { const e: Error & { status?: number } = new Error(`GitHub ${r.status}: ${(j.message || t).slice(0, 160)}`); e.status = r.status; throw e; }
      return j;
    }
  };
}
const TREES = new Map(), BLOBS = new Map(); // kept between requests while the function stays warm (by sha: never stale)
// where the branches point, kept for a few seconds between requests (round K: a tab change online cost several GitHub
// calls each time); any save or publish from this server forgets it at once
const REFS = new Map(), REFS_TTL = 15e3;
// held (round P, owner: "everything is very slow when clicking; combine all changes and push in one go"): online,
// a save is kept on the website itself (Netlify Blobs) in a moment, and reads see it at once; nothing goes to GitHub
// until Publish, which sends every waiting change as one commit. held = { index(): {rel: size|null}, get(rel), put(map), clear() }.
function githubStore({ token, repo, branch = 'main', draft = 'studio-draft', api = ghApi(token), held = null }) {
  const R = `/repos/${repo}`, gh = api, pending = new Map(); let st = null, idx = null;
  const heldIndex = async () => held ? (idx || (idx = await held.index())) : {};
  const treeShaOf = async commit => TREES.has(commit) ? TREES.get(commit).sha : (await gh(`${R}/git/commits/${commit}`)).tree.sha;
  const treeOf = async commit => {
    if (TREES.has(commit)) return TREES.get(commit);
    const c = await gh(`${R}/git/commits/${commit}`), t = await gh(`${R}/git/trees/${c.tree.sha}?recursive=1`), map = new Map();
    for (const x of t.tree) if (x.type === 'blob') map.set(x.path, x.sha);
    const out = { sha: c.tree.sha, map }; if (TREES.size > 40) TREES.clear(); TREES.set(commit, out); return out;
  };
  const refSha = async b => { try { return (await gh(`${R}/git/ref/heads/${encodeURIComponent(b)}`)).object.sha; } catch (e) { if (e.status === 404) return null; throw e; } };
  // main, and the draft only while it has changes main does not (otherwise everything is read from main)
  // where main and the draft point (the whole list of files is only fetched when something needs it: round K)
  const RK = repo + '|' + branch + '|' + draft;
  const state = async () => {
    if (st) return st;
    const kept = REFS.get(RK);
    if (kept && Date.now() - kept.t < REFS_TTL) st = { ...kept.s, mainTree: null, draftTree: null };
    else {
      const main = await refSha(branch); if (!main) throw new Error(`The branch ${branch} is not in ${repo}.`);
      const d = await refSha(draft); let ahead = 0, base = null;
      if (d && d !== main) { const c = await gh(`${R}/compare/${encodeURIComponent(branch)}...${encodeURIComponent(draft)}`); ahead = c.ahead_by; base = c.merge_base_commit.sha; }
      st = { main, draftSha: d, d: ahead ? d : null, base, mainTree: null, draftTree: null };
      REFS.set(RK, { t: Date.now(), s: { main, draftSha: d, d: st.d, base } });
    }
    return st;
  };
  const forget = () => { st = null; REFS.delete(RK); };
  const full = async () => { const s = await state(); if (!s.mainTree) s.mainTree = await treeOf(s.main); if (s.d && !s.draftTree) s.draftTree = await treeOf(s.d); return s; };
  const commitFor = async rel => { const s = await state(); return FAMILY(rel) && s.d ? s.d : s.main; };
  // one file or one folder straight from GitHub, without the list of every file (unless that list is here already)
  const contents = async (rel, commit) => { try { return await gh(`${R}/contents/${rel.split('/').map(encodeURIComponent).join('/')}?ref=${commit}`); } catch (e) { if (e.status === 404) return null; throw e; } };
  const shaOf = async rel => { const c = await commitFor(rel); if (TREES.has(c)) return TREES.get(c).map.get(rel); const j = await contents(rel, c); return j && !Array.isArray(j) && j.type === 'file' ? j.sha : null; };
  const blob = async sha => { if (BLOBS.has(sha)) return BLOBS.get(sha); const b = Buffer.from((await gh(`${R}/git/blobs/${sha}`)).content, 'base64'); if (b.length < 400e3) { if (BLOBS.size > 200) BLOBS.clear(); BLOBS.set(sha, b); } return b; };
  const names = async (dir, deep) => {
    const pre = dir.replace(/\/$/, '') + '/', out = new Set(), c = await commitFor(pre);
    let listed = false;
    if (!deep && !TREES.has(c)) { // one folder: GitHub lists up to 1,000 files this way; a bigger folder needs the full list
      const j = await contents(pre.slice(0, -1), c);
      if (!j) listed = true; else if (Array.isArray(j) && j.length < 1000) { for (const x of j) if (x.type === 'file') out.add(x.name); listed = true; }
    }
    if (!listed) { const t = await treeOf(c); for (const p of t.map.keys()) if (p.startsWith(pre) && (deep || !p.slice(pre.length).includes('/'))) out.add(deep ? p : p.slice(pre.length)); }
    for (const [p, v] of [...Object.entries(await heldIndex()), ...pending]) if (p.startsWith(pre) && (deep || !p.slice(pre.length).includes('/'))) { const k = deep ? p : p.slice(pre.length); if (v != null) out.add(k); else out.delete(k); }
    return [...out];
  };
  const commitOn = async (parent, items, message) => {
    let tree = await treeShaOf(parent); // (in parts: a voice pack top-up can be thousands of files; 100 at a time, as 400 made GitHub time out)
    for (let i = 0; i < items.length; i += 100) tree = (await gh(`${R}/git/trees`, { method: 'POST', body: JSON.stringify({ base_tree: tree, tree: items.slice(i, i + 100) }) })).sha;
    return (await gh(`${R}/git/commits`, { method: 'POST', body: JSON.stringify({ message, tree, parents: [parent] }) })).sha;
  };
  const setRef = async (b, sha, force) => { try { await gh(`${R}/git/refs/heads/${encodeURIComponent(b)}`, { method: 'PATCH', body: JSON.stringify({ sha, force: !!force }) }); } catch (e) { if (e.status !== 422 && e.status !== 404) throw e; if (await refSha(b)) throw e; await gh(`${R}/git/refs`, { method: 'POST', body: JSON.stringify({ ref: 'refs/heads/' + b, sha }) }); } };
  // everything this request (or the held changes) wrote: one commit on the draft branch
  async function toDraft(message) {
    forget(); // a change always starts from where the branches really are now
    for (let a = 0; ; a++) {
      const s = await state(), parent = s.d || s.main, items = [], have = [...pending.values()].some(v => !v) ? (await treeOf(parent)).map : new Map();
      for (const [rel, buf] of pending) {
        if (buf) items.push({ path: rel, mode: '100644', type: 'blob', sha: (await gh(`${R}/git/blobs`, { method: 'POST', body: JSON.stringify({ content: buf.toString('base64'), encoding: 'base64' }) })).sha });
        else if (have.has(rel)) items.push({ path: rel, mode: '100644', type: 'blob', sha: null });
      }
      if (!items.length) { pending.clear(); return null; }
      const sha = await commitOn(parent, items, message || 'Sparkle Studio online: draft');
      try { await setRef(draft, sha, !s.d); pending.clear(); forget(); return sha; } // a draft with nothing unpublished is simply restarted from main
      catch (e) { if (a > 1 || e.status !== 422) throw e; forget(); } // someone else saved at the same moment: once more on top of theirs
    }
  }
  // the family's files that changed on the draft are put onto main as one commit, then the draft starts again from
  // main. Files that changed only on main (e.g. published from the exe meanwhile) are left as they are.
  async function publishDraft(message) {
    forget(); const s = await full(); if (!s.d) return { changed: 0, note: 'Nothing new to publish: the website already has everything.' };
    const base = (await treeOf(s.base)).map, mine = s.draftTree.map, items = [];
    for (const p of new Set([...base.keys(), ...mine.keys()])) if (FAMILY(p) && base.get(p) !== mine.get(p)) items.push(mine.has(p) ? { path: p, mode: '100644', type: 'blob', sha: mine.get(p) } : s.mainTree.map.has(p) ? { path: p, mode: '100644', type: 'blob', sha: null } : null);
    const list = items.filter(Boolean); if (!list.length) return { changed: 0, note: 'Nothing new to publish: the website already has everything.' };
    const sha = await commitOn(s.main, list, message || `Family update from Sparkle Studio online (${list.length} files)`);
    await setRef(branch, sha, false); await setRef(draft, sha, true); forget();
    return { changed: list.length, commit: sha.slice(0, 7), url: `https://github.com/${repo}/commit/${sha}` };
  }
  return {
    kind: 'github', where: `${repo} · ${branch}`, backup: false, ok: () => true, holds: !!held,
    read: async rel => {
      if (pending.has(rel)) return pending.get(rel);
      const hi = await heldIndex(); if (rel in hi) return hi[rel] == null ? null : held.get(rel);
      const c = await commitFor(rel);
      if (!TREES.has(c)) { const j = await contents(rel, c); if (!j || Array.isArray(j) || j.type !== 'file') return null; if (BLOBS.has(j.sha)) return BLOBS.get(j.sha); if (j.encoding === 'base64' && j.content) { const b = Buffer.from(j.content, 'base64'); if (b.length < 400e3) BLOBS.set(j.sha, b); return b; } return blob(j.sha); }
      const sha = TREES.get(c).map.get(rel); return sha ? blob(sha) : null;
    },
    write: async (rel, buf) => { if (!FAMILY(rel)) throw new Error('Online, only the family’s own files can change.'); pending.set(rel, Buffer.from(buf)); },
    remove: async rel => { if (!FAMILY(rel)) throw new Error('Online, only the family’s own files can change.'); pending.set(rel, null); },
    list: dir => names(dir, false), walk: dir => names(dir, true),
    // what this request changed: kept on the website until Publish (held), or else one commit on the draft branch
    flush: async message => {
      if (!pending.size) return null;
      if (held) { await held.put(pending); idx = null; pending.clear(); return 'held'; }
      return toDraft(message);
    },
    // the changes waiting on the website, and dropping them (the draft branch itself is left as it is)
    waiting: async () => Object.keys(await heldIndex()).sort(),
    discard: async () => { if (held) await held.clear(); idx = null; return { ok: true }; },
    // Publish: every waiting change as one commit on the draft, then the draft onto main as one commit
    publish: async message => {
      const hi = await heldIndex(), keys = Object.keys(hi);
      if (keys.length) { for (const k of keys) pending.set(k, hi[k] == null ? null : await held.get(k)); await toDraft(`Sparkle Studio online: ${keys.length} saved change${keys.length === 1 ? '' : 's'}`); await held.clear(); idx = null; }
      return publishDraft(message);
    },
    // (owner, 12 Oct) online, Publish in steps: each call sends at most `n` waiting changes to the draft (one website
    // request has only seconds, and a photo upload takes a moment each), then the last call puts the draft live
    publishStep: async (message, n = 12) => {
      const hi = await heldIndex(), keys = Object.keys(hi).sort();
      if (!keys.length) return { more: false, left: 0, result: await publishDraft(message) };
      const part = keys.slice(0, n);
      for (const k of part) pending.set(k, hi[k] == null ? null : await held.get(k));
      await toDraft(`Sparkle Studio online: ${part.length} saved change${part.length === 1 ? '' : 's'}`); await held.drop(part); idx = null;
      return { more: true, left: keys.length - part.length, sent: part.length };
    },
    unpublished: async () => Object.keys(await heldIndex()).length > 0 || !!(await state()).d,
    // (the exe) the family's files as GitHub has them now: the draft while it has unpublished changes, else main
    familyShas: async () => { const s = await full(), out = new Map(); for (const [p, sha] of (s.d ? s.draftTree : s.mainTree).map) if (FAMILY(p)) out.set(p, sha); return out; },
    // (the exe) files already uploaded as blobs → one commit on the draft branch (never on main)
    saveDraft: async (items, message) => {
      forget();
      for (let a = 0; ; a++) {
        const s = await state(), sha = await commitOn(s.d || s.main, items, message || 'Sparkle Studio: draft');
        try { await setRef(draft, sha, !s.d); forget(); return sha; } catch (e) { if (a > 1 || e.status !== 422) throw e; forget(); }
      }
    }
  };
}

// ---------- small helpers ----------
// (r65) the family's own files Studio may show: the same letters as the game's own check (js/realworld.js `ours`), so a
// folder named after a Vietnamese place (photos/en-bến-thành-market/1.jpg) opens too
const PHOTO_MAX = 1.5e6;
const OURFILE = /^(content|photos)\/[\w\p{L}\p{N}./-]+$/u, OURPHOTO = /^photos\/[\w\p{L}\p{N}./-]+$/u;
// (owner, 17 Oct AEDT: "point photos to Wikimedia") a photo on one of these sites is listed by its address, not saved
// (the same list is js/realworld.js PHOTO_HOST and sw.js); a photo anywhere else is saved as before, the last resort
const PHOTO_HOST = /^https:\/\/((upload|thumb)\.wikimedia\.org|live\.staticflickr\.com|farm\d+\.staticflickr\.com)\//;
// a Wikimedia photo is linked at thumb.wikimedia.org (Wikimedia's own address for its copies; upload.wikimedia.org refuses
// more), at the largest of its standard sizes up to 1280 px that fits the original (any other size is refused when
// linked, https://www.mediawiki.org/wiki/Common_thumbnail_sizes), without the ?utm_… it adds
const wmSized = (url: string, width: number) => {
  if (!/^https:\/\/(upload|thumb)\.wikimedia\.org\//.test(url)) return url;
  const u = url.split('?')[0].replace(/^https:\/\/upload\./, 'https://thumb.'), m = /^https:\/\/thumb\.wikimedia\.org\/wikipedia\/commons\/([0-9a-f])\/([0-9a-f]{2})\/([^/]+\.(?:jpe?g|png))$/i.exec(u);
  if (!m) return u; const step = [1280, 960, 500, 330, 250].find(x => x <= (width || 1280)) || 250;
  return `https://thumb.wikimedia.org/wikipedia/commons/thumb/${m[1]}/${m[2]}/${m[3]}/${step}px-${m[3]}`;
};
const slug = s => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').replace(/[^\w]+/g, '-').replace(/^-|-$/g, '').toLowerCase().slice(0, 40) || 'face';
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.svg': 'image/svg+xml', '.mp3': 'audio/mpeg', '.mp4': 'video/mp4', '.woff2': 'font/woff2', '.webmanifest': 'application/manifest+json', '.ico': 'image/x-icon', '.txt': 'text/plain; charset=utf-8', '.zip': 'application/zip', '.toml': 'text/plain' };
const mimeOf = f => MIME[path.extname(f).toLowerCase()] || 'application/octet-stream';
const xml = t => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const strip = h => String(h || '').replace(/<[^>]*>/g, '').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#039;/g, "'").replace(/\s+/g, ' ').trim();
const gitSha = b => crypto.createHash('sha1').update('blob ' + b.length + '\0').update(b).digest('hex');
const CAST = { en: ['f', 'm'], vi: ['f', 'm'], zh: ['m'], hi: ['m'] };
const AZ_VOICES = { en: { f: 'en-AU-NatashaNeural', m: 'en-AU-WilliamNeural' }, vi: { f: 'vi-VN-HoaiMyNeural', m: 'vi-VN-NamMinhNeural' }, zh: { m: 'zh-CN-YunxiNeural' }, hi: { m: 'hi-IN-MadhurNeural' } };
const LOCALE = { en: 'en-AU', vi: 'vi-VN', zh: 'zh-CN', hi: 'hi-IN' };
// ---------- family photos are family-only (owner, 9 Oct, round R privacy) ----------
// Photo faces and Family album pictures are never written into the game's files (which are public on the website and
// kept in GitHub). They go to a private family store under a random name, and content/custom.json says "family:<name>":
//   online   Netlify Blobs "family-photos" (netlify/lib/family.mts); the game fetches /api/family/<name> with the family code
//   the exe  sent to the website's family store with the Studio key when the website is set in Settings, and kept in
//            %APPDATA%\SparkleStudio\family-photos (the game run from the exe reads them there); never in the game folder
// family = { where: 'site' | 'computer', put(name, buf), get(name), remove(name), code(), newCode() } (from studio.cts / studio.mts)
const FAMREF = /^family:([\w-]{24,64})$/, FAMNAME = /^[\w-]{24,64}$/, OLDFAM = /^content\/(faces|album)\/[\w.-]+$/;
// the content pack (content/custom.json) as far as this file looks inside it; the rest is the pages' own
type Content = { faces?: Record<string, { photo?: string } | null>, album?: ({ photo?: string } | null)[], [section: string]: unknown };
const familyName = () => crypto.randomBytes(18).toString('base64url'); // 24 letters, nobody can guess one
const isJpeg = b => b && b.length > 3 && b[0] === 0xff && b[1] === 0xd8;
// every family photo the content pack names
function familyRefs(c: Content) {
  const out = new Set(), add = p => { const m = FAMREF.exec(String(p || '')); if (m) out.add(m[1]); };
  for (const f of Object.values((c && c.faces) || {})) add(f && f.photo);
  for (const x of Array.isArray(c && c.album) ? c.album : []) add(x && x.photo);
  return out;
}

// ---------- real photos of the landmarks (photos/<key>/n.jpg + photos/index.json) ----------
// More places to look than the Wikipedia article (all free to reuse, with the photographer's credit kept):
//   · Wikimedia Commons search: the whole Commons library, not just the pictures in the article
//   · Openverse (openverse.org): Creative Commons photos from Flickr, museums and other open collections
// Every candidate is scored (the article's own lead picture first, then big, landscape, named after the place) and
// the best are taken from the different sources, so the children see the place from several angles.
// a picture found for a landmark, and Wikimedia Commons' answer about one
type Found = { url: string, width?: number, height?: number, caption: string, credit: string, from: string, title: string, lead?: boolean };
type CommonsPage = { title: string, imageinfo?: { url: string, thumburl?: string, width: number, height: number, extmetadata?: Record<string, { value: string }> }[] };
type CommonsAnswer = { query?: { pages?: Record<string, CommonsPage> } };
const UA = { 'User-Agent': 'SparkleStudio/1.0 (family game dashboard)', accept: 'application/json' };
const BADPIC = /\.(svg|gif|tif|tiff|webm|ogv|ogg|oga|wav|mp3|pdf)$|logo|flag of|map|locator|coat of arms|seal of|icon|diagram|signature|plan of|chart/i;
async function bestPhotos(sources, max) {
  for (const s of sources) {
    const [lang, title] = s.split(/:(.+)/), t = encodeURIComponent(title.replace(/ /g, '_'));
    const ml = await fetch(`https://${lang}.wikipedia.org/api/rest_v1/page/media-list/${t}`, { headers: UA }).catch(() => null);
    // (round O) Wikipedia is retiring that list: the article's pictures from the main API instead
    if (!ml || !ml.ok) {
      const base = `https://${lang}.wikipedia.org/w/api.php?format=json&formatversion=2&redirects=1&titles=${encodeURIComponent(title)}`;
      const lead = await fetch(base + '&action=query&prop=pageimages&piprop=name', { headers: UA }).then(r => r.json()).then(j => ((j.query.pages || [])[0] || {}).pageimage || '').catch(() => '');
      const im = await fetch(base + '&action=query&prop=images&imlimit=60', { headers: UA }).then(r => r.json()).then(j => (((j.query.pages || [])[0] || {}).images || []).map(x => x.title)).catch(() => []);
      const files = im.filter(f => !BADPIC.test(f) && /\.(jpe?g|png|webp)$/i.test(f)).sort((a, b) => +(b.replace(/^[^:]+:/, '').replace(/ /g, '_') === lead.replace(/ /g, '_')) - +(a.replace(/^[^:]+:/, '').replace(/ /g, '_') === lead.replace(/ /g, '_')));
      if (files.length) return files.slice(0, max).map(f => ({ file: 'File:' + f.replace(/^[^:]+:/, ''), caption: '' }));
      continue;
    }
    const j = await ml.json(); let lead = '';
    try { const sm = await fetch(`https://${lang}.wikipedia.org/api/rest_v1/page/summary/${t}`, { headers: UA }); if (sm.ok) lead = decodeURIComponent(((await sm.json()).originalimage || {}).source || '').split('/').pop(); } catch (e) { }
    let items = (j.items || []).filter(it => it.type === 'image' && it.showInGallery !== false && !BADPIC.test(it.title || ''));
    items.sort((a, b) => +(b.title.replace(/^File:/, '').replace(/ /g, '_') === lead) - +(a.title.replace(/^File:/, '').replace(/ /g, '_') === lead));
    if (items.length) return items.slice(0, max).map(it => ({ file: it.title, caption: strip(it.caption && it.caption.html || it.caption && it.caption.text || '') }));
  }
  return [];
}
async function commonsInfo(file) {
  const r = await fetch(`https://commons.wikimedia.org/w/api.php?action=query&format=json&prop=imageinfo&iiprop=url|extmetadata|size&iiurlwidth=1280&titles=${encodeURIComponent(file)}`, { headers: UA });
  const j: CommonsAnswer = await r.json(), pg = Object.values(j.query?.pages || {})[0], ii = pg && pg.imageinfo && pg.imageinfo[0]; if (!ii) return null;
  const md = ii.extmetadata || {};
  return { url: ii.thumburl || ii.url, width: ii.width, credit: [strip(md.Artist && md.Artist.value).slice(0, 80), strip(md.LicenseShortName && md.LicenseShortName.value)].filter(Boolean).join(' · ') };
}
async function commonsSearch(name, n = 8) {
  const r = await fetch(`https://commons.wikimedia.org/w/api.php?action=query&format=json&generator=search&gsrnamespace=6&gsrlimit=${n}&gsrsearch=${encodeURIComponent(name + ' filetype:bitmap')}&prop=imageinfo&iiprop=url|extmetadata|size&iiurlwidth=1280`, { headers: UA });
  if (!r.ok) return []; const j: CommonsAnswer = await r.json();
  return Object.values(j.query?.pages || {}).map(pg => { const ii = pg.imageinfo && pg.imageinfo[0]; if (!ii || BADPIC.test(pg.title)) return null; const md = ii.extmetadata || {};
    return { url: ii.thumburl || ii.url, width: ii.width, height: ii.height, caption: strip(md.ImageDescription && md.ImageDescription.value || pg.title.replace(/^File:|\.\w+$/g, '')), credit: [strip(md.Artist && md.Artist.value).slice(0, 80), strip(md.LicenseShortName && md.LicenseShortName.value)].filter(Boolean).join(' · '), from: 'Wikimedia Commons', title: pg.title }; }).filter(Boolean);
}
async function openverse(name, n = 8) {
  const r = await fetch(`https://api.openverse.org/v1/images/?q=${encodeURIComponent(name)}&page_size=${n}&mature=false`, { headers: UA });
  if (!r.ok) return []; const j = await r.json();
  return (j.results || []).filter(x => x.url && /^https:/.test(x.url)).map(x => ({ url: x.url, width: x.width, height: x.height, caption: strip(x.title || ''), credit: [x.creator, (x.license || '').toUpperCase() + ' ' + (x.license_version || '')].filter(Boolean).join(' · ').trim(), from: x.source || 'Openverse', title: x.title || '' }));
}
async function gatherPhotos(sources, name, max) {
  const cands: Found[] = [];
  try { for (const p of await bestPhotos(sources, max + 2)) { const info = await commonsInfo(p.file); if (info) cands.push({ url: info.url, width: info.width, caption: p.caption, credit: info.credit, from: 'Wikipedia', title: p.file, lead: cands.length === 0 }); } } catch (e) { }
  const q = name || (sources[0] || '').split(':').slice(1).join(':');
  if (q) { try { cands.push(...await commonsSearch(q)); } catch (e) { } try { cands.push(...await openverse(q)); } catch (e) { } }
  const words = String(q).toLowerCase().split(/\s+/).filter(w => w.length > 2);
  const score = c => (c.lead ? 100 : 0) + Math.min(30, (c.width || 0) / 60) + (c.width && c.height && c.width > c.height ? 10 : 0) + words.filter(w => (c.title + ' ' + c.caption).toLowerCase().includes(w)).length * 8 - ((c.width || 0) && c.width < 500 ? 100 : 0);
  const seen = new Set(), bySrc: Record<string, Found[]> = {};
  cands.filter(c => !seen.has(c.url) && seen.add(c.url)).sort((a, b) => score(b) - score(a)).forEach(c => (bySrc[c.from] = bySrc[c.from] || []).push(c));
  const out = [], lists = Object.values(bySrc); while (out.length < max && lists.some(l => l.length)) for (const l of lists) if (l.length && out.length < max) out.push(l.shift()); // take turns between sources
  return out;
}

// ---------- the Studio ----------
//   store   where the game's files are (above)
//   conf    keys and names: azureKey, azureRegion, netlifyToken, netlifySite, githubToken, githubRepo, githubBranch, …
//   online  true on the website (computer-only things are switched off there)
//   local   computer-only helpers from studio.cts: tts (Piper), settings, build, deploy, open, players, info
type LocalHelpers = { tts?: Function, settings?: Function, build?: Function, deploy?: Function, open?: Function, players?: Function,
  info?: () => object, inbox?: Function, label?: (b: any) => Promise<any>, api?: Function, onlineVersion?: () => Promise<string>, testers?: (api: string, b: any) => Promise<any>, live?: (b: any) => Promise<any> };
function createStudio({ store, conf, online = false, local = {}, family = null }: { store: any, conf: any, online?: boolean, local?: LocalHelpers, family?: any }) {
  const S = store;
  const readJSON = async (rel, def) => { const b = await S.read(rel); if (!b) return def; try { return JSON.parse(b.toString('utf8')); } catch (e) { return def; } };
  const writeJSON = (rel, o, pretty = 1) => S.write(rel, Buffer.from(JSON.stringify(o, null, pretty)));
  const readContent = (): Promise<Content> => readJSON('content/custom.json', {});
  async function writeContent(obj) {
    const old = await S.read('content/custom.json');
    if (old && S.backup) await S.write('content/old/custom-' + new Date().toISOString().replace(/[:.]/g, '-') + '.json', old);
    await writeJSON('content/custom.json', obj);
  }
  async function voicesHave() {
    const out: Record<string, Record<string, string[]>> = {};
    for (const [L, slots] of Object.entries(CAST)) { out[L] = {}; for (const s of slots) out[L][s] = (await S.list(`voices/${L}/${s}`)).filter(f => f.endsWith('.mp3')).map(f => f.slice(0, -4)); }
    return out;
  }
  // how many recordings, from the pack's own list (one small file, not every folder: round K, the online Studio was slow)
  async function voiceCount() { const m = await readJSON('voices/manifest.json', null); if (m && m.lines && typeof m.lines === 'object') return Object.values(m.lines).reduce((a: number, v) => a + String(v).length, 0); return countVoices(await voicesHave()); }
  const countVoices = (h: Record<string, Record<string, string[]>>) => Object.values(h).reduce((a, s) => a + Object.values(s).reduce((b, l) => b + l.length, 0), 0);
  async function addToManifest(lang, slot, hash) {
    const m = await readJSON('voices/manifest.json', { version: 2, engine: 'mixed', cast: CAST, voices: {}, lines: {}, langOf: {} });
    m.lines = m.lines || {}; if (!m.other) m.langOf = m.langOf || {}; m.cast = m.cast || CAST; m.voices = m.voices || {};
    if (!m.voices[lang]) m.voices[lang] = {}; if (!m.voices[lang][slot]) m.voices[lang][slot] = { id: AZ_VOICES[lang][slot], name: AZ_VOICES[lang][slot] };
    if (m.other) { if (lang !== 'en' && !String(m.other[lang] || '').split(' ').includes(hash)) m.other[lang] = ((m.other[lang] || '') + ' ' + hash).trim(); } else m.langOf[hash] = lang; // (new packs list only the lines that are not English)
    m.lines[hash] = (m.lines[hash] || '').replace(slot, '') + slot; m.made = new Date().toISOString().slice(0, 10);
    for (const [language, shard] of Object.entries(splitManifest(m))) await S.write(`voices/manifest-${language}.json`, Buffer.from(JSON.stringify(shard)));
    await S.write('voices/manifest.json', Buffer.from(JSON.stringify(m)));
  }
  async function azureSay(lang, slot, text, runs) {
    if (!conf.azureKey || !conf.azureRegion) throw new Error(online ? 'Add AZURE_KEY and AZURE_REGION in Netlify (Site configuration → Environment variables) first.' : 'Add your Azure Speech key and region in Settings first.');
    const v = (conf.voices && conf.voices[lang] && conf.voices[lang][slot]) || AZ_VOICES[lang][slot];
    // (round R) an English line with Vietnamese words: those words in the Vietnamese voice of the same man or woman, with the
    // pauses at each switch set by hand (the same as js/viwords.js mixedSsml, which the page has already cut the line with)
    const vv = (conf.voices && conf.voices.vi && conf.voices.vi[slot]) || AZ_VOICES.vi[slot];
    const ok = Array.isArray(runs) && runs.length > 1 && runs.every(r => Array.isArray(r) && (r[0] === 'en' || r[0] === 'vi') && typeof r[1] === 'string') && runs.map(r => r[1]).join('') === text;
    const ssml = lang === 'en' && ok ? `<speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xmlns:mstts='http://www.w3.org/2001/mstts' xml:lang='en-AU'>` + runs.filter((r, i) => /[\p{L}\d]/u.test(r[1]) || i === runs.length - 1).map(([l, s], i, a) => {
      const end = s.trimEnd(), tail = i === a.length - 1 ? '' : /[.!?…]["”')]?$/.test(end) ? '350ms' : /[,;:]$/.test(end) ? '180ms' : '40ms';
      return `<voice name='${l === 'vi' ? vv : v}'>${i ? `<mstts:silence type='Leading-exact' value='0ms'/>` : ''}${tail ? `<mstts:silence type='Tailing-exact' value='${tail}'/>` : ''}${xml(s)}</voice>`; }).join('') + '</speak>'
      : `<speak version='1.0' xml:lang='${LOCALE[lang]}'><voice name='${v}'>${xml(text)}</voice></speak>`;
    for (let a = 0; ; a++) {
      const r = await fetch(`https://${conf.azureRegion}.tts.speech.microsoft.com/cognitiveservices/v1`, { method: 'POST', headers: { 'Ocp-Apim-Subscription-Key': conf.azureKey, 'Content-Type': 'application/ssml+xml', 'X-Microsoft-OutputFormat': 'audio-16khz-32kbitrate-mono-mp3', 'User-Agent': 'sparkle-studio' }, body: ssml });
      if (r.status === 401 || r.status === 403) throw new Error('Azure did not accept the key or region (' + r.status + '). Check them in Settings.');
      if ((r.status === 429 || r.status >= 500) && a < (online ? 1 : 6)) { await new Promise(ok => setTimeout(ok, online ? 2500 : 4000 * (a + 1))); continue; }
      if (!r.ok) throw new Error('Azure ' + r.status + ': ' + (await r.text()).slice(0, 160));
      return Buffer.from(await r.arrayBuffer());
    }
  }
  // one landmark's photos (the page asks for them one place at a time and shows the progress itself)
  async function getPhotos1({ key, sources, name }, max) {
    // (round P, owner: "let me remove photos that aren't of the place") a photo taken off is never fetched again
    const pix = await readJSON('photos/index.json', {}), blocked = new Set(((await readJSON('photos/blocked.json', {}))[key]) || []), out = [];
    const picks = (await gatherPhotos(sources, name, max + blocked.size + 4)).filter(p => !blocked.has(p.title) && !blocked.has(p.url));
    for (const p of picks) { if (out.length >= max) break;
      // (owner, 17 Oct AEDT) on Wikimedia or Flickr: listed by its address (checked that it answers), nothing saved
      if (PHOTO_HOST.test(p.url) && !/\s/.test(p.url)) {
        p.url = wmSized(p.url, p.width || 0);
        const h = await fetch(p.url, { method: 'HEAD', headers: { 'User-Agent': UA['User-Agent'] } }).catch(() => null);
        if (!h || !h.ok || !/image\//.test(h.headers.get('content-type') || 'image/')) continue;
        out.push({ url: p.url, file: p.title, caption: (p.caption || '').slice(0, 160), credit: [p.credit, p.from].filter(Boolean).join(' · ').slice(0, 200) }); continue;
      }
      // anywhere else (the last resort): a copy saved with the game, as before
      const img = await fetch(p.url, { headers: { 'User-Agent': UA['User-Agent'] } }); if (!img.ok || !/image\//.test(img.headers.get('content-type') || 'image/')) continue;
      // (r65) a photo over 1.5 MB is left for the next one: online Studio cannot send it back to show it, and it is heavy on a phone
      const buf = Buffer.from(await img.arrayBuffer()); if (buf.length > PHOTO_MAX) continue;
      const rel = `photos/${key}/${out.length + 1}.jpg`; await S.write(rel, buf);
      out.push({ src: rel, file: p.title, caption: (p.caption || '').slice(0, 160), credit: [p.credit, p.from].filter(Boolean).join(' · ').slice(0, 200) });
    }
    if (out.length) { for (const o of pix[key] || []) if (o && OURPHOTO.test(o.src || '') && !o.src.includes('..') && !out.some(n => n.src === o.src)) await S.remove(o.src); pix[key] = out; } // (r65) no old photo left behind
    await writeJSON('photos/index.json', pix);
    return { key, saved: out.length };
  }
  // ---------- GitHub from the exe: first a draft, then Publish (owner, round 30: the same two steps as online) ----------
  // 1. "Save a draft": only the family's files that differ from GitHub (content, voices, photos) go to the
  //    "studio-draft" branch as one commit. The website does not change.
  // 2. "Publish": the draft's changes are put onto main as one commit (the same Publish as online); Netlify builds the
  //    live site from main a minute or two later.
  const gh = conf.githubToken ? ghApi(conf.githubToken) : null;
  const ghStore = () => {
    if (!gh || !/^[\w.-]+\/[\w.-]+$/.test(conf.githubRepo || '')) throw new Error('Add the GitHub token and repository (owner/name) in Settings first.');
    return githubStore({ token: conf.githubToken, repo: conf.githubRepo, branch: conf.githubBranch || 'main', api: gh });
  };
  async function draftFromFolder(J, message) {
    const G = ghStore(), R = `/repos/${conf.githubRepo}`;
    // (owner, 12 Oct) never from a game folder older than the website: its old voices or content would undo newer ones
    { const ver = b => (/VERSION = 'sv-\d{4}-\d{2}-\d{2}-([^']+)'/.exec(b ? b.toString('utf8') : '') || [0, '?'])[1]; // (fresh: not the branch kept for a few seconds)
      const hereF = await S.read('sw.js').catch(() => null), thereF = await gh(`${R}/contents/sw.js?ref=${encodeURIComponent(conf.githubBranch || 'main')}`).then(j => Buffer.from(j.content || '', 'base64')).catch(() => null);
      const here = buildRank(ver(hereF)), there = buildRank(ver(thereF));
      if (here && there && here < there) throw new Error(`Your game folder is ${ver(hereF)} and the website is ${ver(thereF)}: get the newest game first (Settings, Get the newest game).`); }
    J.msg = 'Reading the website’s files…';
    const remote = await G.familyShas();
    const mine = [...await S.walk('content'), ...await S.walk('voices'), ...await S.walk('photos'), ...((await S.read('tools/voice-extra.json')) ? ['tools/voice-extra.json'] : [])].filter(rel => FAMILY(rel) && !rel.startsWith('content/old/'));
    const changed = []; for (const rel of mine) { const b = await S.read(rel); if (remote.get(rel) !== gitSha(b)) changed.push(rel); }
    // (round R privacy) family photos taken out of content/faces and content/album here are taken out of GitHub too
    const have = new Set(mine), gone = [...remote.keys()].filter(rel => OLDFAM.test(rel) && !have.has(rel));
    J.total = changed.length + gone.length; if (!J.total) return { changed: 0, note: 'Nothing new: GitHub already has everything.' };
    const items = gone.map(rel => ({ path: rel, mode: '100644', type: 'blob', sha: null }));
    for (const rel of changed) { J.msg = rel; const b = await S.read(rel); const blob = await gh(`${R}/git/blobs`, { method: 'POST', body: JSON.stringify({ content: b.toString('base64'), encoding: 'base64' }) }); items.push({ path: rel, mode: '100644', type: 'blob', sha: blob.sha }); J.done++; }
    J.msg = 'Saving the draft…';
    const sha = await G.saveDraft(items, message || `Family changes from Sparkle Studio (${changed.length} files)`);
    draftSeen = null; return { changed: J.total, draft: true, commit: sha.slice(0, 7), url: `https://github.com/${conf.githubRepo}/commit/${sha}` };
  }
  let draftSeen = null; // (the exe asks GitHub whether a draft waits at most every 30 s)
  async function publishDraft(J, message) { J.msg = 'Publishing the draft…'; const r = await ghStore().publish(message); J.done = J.total = r.changed; draftSeen = null; return r; }
  // ---------- the website: Netlify deploys and GitHub changes, to see and manage from the dashboard ----------
  async function nf(p: string, opt: Ask = {}) {
    const r = await fetch('https://api.netlify.com/api/v1' + p, { ...opt, headers: { Authorization: 'Bearer ' + conf.netlifyToken, 'User-Agent': 'sparkle-studio', ...(opt.body ? { 'Content-Type': 'application/json' } : {}) } });
    const t = await r.text(); let j: any = {}; try { j = JSON.parse(t); } catch (e) { }
    if (!r.ok) throw new Error(`Netlify ${r.status}: ${(j.message || t).slice(0, 160)}`);
    return j;
  }
  async function siteStatus() {
    const out: { netlify?: object, netlifyError?: string, github?: object, githubError?: string } = {};
    if (conf.netlifyToken && conf.netlifySite) {
      try {
        const site = await nf(`/sites/${encodeURIComponent(conf.netlifySite)}`), deps = await nf(`/sites/${encodeURIComponent(conf.netlifySite)}/deploys?per_page=10`);
        out.netlify = { name: site.name, url: site.ssl_url || site.url, admin: site.admin_url, repo: site.build_settings && site.build_settings.repo_url, branch: site.build_settings && site.build_settings.repo_branch, published: site.published_deploy && site.published_deploy.id,
          deploys: deps.map(d => ({ id: d.id, state: d.state, context: d.context, branch: d.branch, commit: (d.commit_ref || '').slice(0, 7), title: d.title || '', at: d.created_at, url: d.deploy_ssl_url || d.deploy_url, error: d.error_message || '', live: site.published_deploy && site.published_deploy.id === d.id })) };
      } catch (e) { out.netlifyError = String(e.message || e); }
    }
    if (gh && conf.githubRepo) {
      try {
        const R = `/repos/${conf.githubRepo}`, br = conf.githubBranch || 'main';
        const commits = await gh(`${R}/commits?sha=${encodeURIComponent(br)}&per_page=8`), pulls = await gh(`${R}/pulls?state=open&per_page=10`);
        out.github = { repo: conf.githubRepo, branch: br, commits: commits.map(c => ({ sha: c.sha.slice(0, 7), msg: (c.commit.message || '').split('\n')[0].slice(0, 120), at: c.commit.author && c.commit.author.date, url: c.html_url })),
          pulls: pulls.map(p => ({ n: p.number, title: p.title, draft: p.draft, branch: p.head && p.head.ref, url: p.html_url, at: p.updated_at })) };
      } catch (e) { out.githubError = String(e.message || e); }
    }
    return out;
  }
  // ---------- the health check ----------
  async function check() {
    const out = [], add = (ok, en, vi) => out.push({ ok, en, vi });
    add(S.ok(), `Game files: ${S.where}`, `Tệp game: ${S.where}`);
    const sw = await S.read('sw.js');
    if (sw) { const t = sw.toString('utf8'), m = /FILES\s*=\s*\[([\s\S]*?)\]/.exec(t), list = m ? [...m[1].matchAll(/'([^']+)'/g)].map(x => x[1]).filter(f => f !== './') : [];
      const miss = []; if (S.kind === 'folder') for (const f of list) if (!(await S.read(f))) miss.push(f);
      if (S.kind === 'folder') add(!miss.length, miss.length ? `Files the offline app needs but are missing: ${miss.join(', ')}` : `All ${list.length} offline files are there`, miss.length ? `Thiếu tệp cho chế độ ngoại tuyến: ${miss.join(', ')}` : `Đủ ${list.length} tệp ngoại tuyến`);
      const v = /VERSION = '([^']+)'/.exec(t); add(true, `Game version ${v ? v[1] : '?'}`, `Phiên bản ${v ? v[1] : '?'}`); } else add(false, 'sw.js could not be read', 'Không đọc được sw.js');
    const raw = await S.read('content/custom.json');
    if (raw) { try { JSON.parse(raw.toString('utf8')); add(true, 'The content pack is valid', 'Gói nội dung hợp lệ'); } catch (e) { add(false, 'content/custom.json is broken: ' + e.message, 'content/custom.json bị lỗi'); } } else add(true, 'No content pack yet (that is fine)', 'Chưa có gói nội dung (không sao)');
    const c = await readContent();
    for (const [id, f] of Object.entries(c.faces || {})) { const m = FAMREF.exec((f && f.photo) || ''); if (m ? !(family && await family.get(m[1]).catch(() => null)) : !(await S.read((f && f.photo) || 'x/none'))) add(false, `Face photo missing for ${id}`, `Thiếu ảnh khuôn mặt của ${id}`); }
    // (round R privacy) family photos still kept as public files: Family → Family code → Move family photos to private storage
    const pub = [...await S.list('content/faces'), ...await S.list('content/album')].length;
    if (pub) add(false, `${pub} family photo(s) are still public files (content/faces, content/album): Family → Family code → Move family photos to private storage`, `${pub} ảnh gia đình vẫn là tệp công khai (content/faces, content/album): Gia đình → Mã gia đình → Chuyển ảnh gia đình sang nơi riêng tư`);
    else add(true, family && family.where === 'site' ? 'Family photos are private (on the website, only with the family code)' : 'Family photos are private (on this computer only)', family && family.where === 'site' ? 'Ảnh gia đình được giữ riêng (trên trang web, chỉ mở bằng mã gia đình)' : 'Ảnh gia đình được giữ riêng (chỉ trên máy này)');
    const n = countVoices(await voicesHave()); add(n > 0, n ? `Voice pack: ${n} recordings` : 'No voice pack yet', n ? `Gói giọng: ${n} bản ghi` : 'Chưa có gói giọng');
    // the exe and the online Studio are one program: the same version in both places
    if (local.onlineVersion) { const o = await local.onlineVersion().catch(() => null); if (o) add(o === STUDIO_VERSION, o === STUDIO_VERSION ? `Sparkle Studio ${STUDIO_VERSION}: the same here and online` : `This Studio is ${STUDIO_VERSION} but the online Studio is ${o}: get the new SparkleStudio.exe (it comes with each game update)`, o === STUDIO_VERSION ? `Sparkle Studio ${STUDIO_VERSION}: giống nhau trên máy và trên mạng` : `Studio trên máy là ${STUDIO_VERSION} còn trên mạng là ${o}: hãy lấy SparkleStudio.exe mới (đi kèm mỗi bản cập nhật game)`); }
    if (S.unpublished && await S.unpublished()) add(true, 'There are saved changes waiting: press Publish to send them to the children', 'Có thay đổi đã lưu đang chờ: bấm Phát hành để gửi tới các con');
    return out;
  }
  async function villagerNames() {
    const b = await S.read('js/i18n.js'); if (!b) return [];
    const m = /const NAMES_EN = \{([\s\S]*?)\n\};/.exec(b.toString('utf8')); if (!m) return [];
    const seen = new Map(); for (const x of m[1].matchAll(/'([^']+)':\s*'([^']+)'/g)) if (!seen.has(x[1])) seen.set(x[1], x[2]);
    return [...seen.entries()].map(([vi, en]) => ({ id: vi, en })).sort((a, b) => a.id.localeCompare(b.id, 'vi'));
  }
  // ---------- one long job at a time in the exe (publishing), with progress the dashboard polls ----------
  let JOB = null;
  const job = (kind, f) => { if (JOB && !JOB.end) throw new Error('Something else is still running: ' + JOB.kind); JOB = { kind, done: 0, total: 0, msg: '', start: Date.now() }; f(JOB).then(r => { JOB.result = r; JOB.end = true; }, e => { JOB.error = String(e && e.message || e); JOB.end = true; }); return JOB; };

  const ok = (body, code = 200) => ({ code, body });
  const bad = (error, code = 400) => ({ code, body: { error } });
  const raw = (buf, type) => ({ code: 200, raw: buf, type });
  const parse = b => { try { return JSON.parse(b && b.length ? b.toString('utf8') : '{}'); } catch (e) { return {}; } };

  // handle(api, method, body) → { code, body } (JSON) or { code, raw, type }
  async function handle(api, method, bodyBuf) {
    const post = method === 'POST', b = post ? parse(bodyBuf) : {};
    if (api === 'ping') return ok({ ok: true });
    if (api === 'info') {
      const ready = S.ok(), nv = ready ? await voiceCount() : 0; let version = '?';
      try { version = /VERSION = '([^']+)'/.exec((await S.read('sw.js')).toString('utf8'))[1]; } catch (e) { }
      let unpublished = false; try { if (S.unpublished) unpublished = await S.unpublished(); else if (gh && conf.githubRepo) { if (!draftSeen || Date.now() - draftSeen.t > 30e3) draftSeen = { t: Date.now(), v: await ghStore().unpublished() }; unpublished = draftSeen.v; } } catch (e) { }
      return ok(Object.assign({ game: S.where, ok: ready, version, voices: nv, studio: STUDIO_VERSION, online, store: S.kind, unpublished,
        conf: { azure: !!conf.azureKey, azureRegion: conf.azureRegion || '', netlify: !!conf.netlifyToken, netlifySite: conf.netlifySite || '', github: !!conf.githubToken, githubRepo: conf.githubRepo || '', githubBranch: conf.githubBranch || 'main', piper: !!conf.piperExe, piperExe: conf.piperExe || '', piperModels: conf.piperModels || {}, siteUrl: conf.siteUrl || '', players: !!(online || (conf.siteUrl && conf.studioKey)), family: family ? family.where : '' } }, local.info ? local.info() : {}));
    }
    if (api === 'settings' && post) return local.settings ? local.settings(b) : bad('Online, the keys are set in Netlify: Site configuration → Environment variables.');
    if (!S.ok()) return bad('Choose the game folder in Settings first.');
    if (api === 'content') {
      if (!post) return ok(await readContent());
      const before = familyRefs(await readContent()), after = familyRefs(b); await writeContent(b);
      if (family) for (const n of before) if (!after.has(n)) await family.remove(n).catch(() => { }); // (round R privacy) a photo taken off is deleted from the family store
      return ok({ ok: true });
    }
    if (api === 'names') return ok(await villagerNames());
    // a photo face and a family photo that becomes a postcard in the game (js/familycards.js): (round R privacy) into the
    // private family store under a random name, never into content/ (which is public on the website and kept in GitHub)
    if ((api === 'face' || api === 'albumphoto') && post) {
      const m = /^data:image\/jpeg;base64,(.+)$/.exec(b.dataUrl || ''); if (!m) return bad(api === 'face' ? 'not a JPEG' : 'Choose a photo (JPG).');
      const buf = Buffer.from(m[1], 'base64'); if (!isJpeg(buf)) return bad('That is not a JPEG photo.'); if (buf.length > 600 * 1024) return bad('That photo is too big (over 600 KB).');
      if (!family) return bad('Family photos need the private family store.');
      const name = familyName(); await family.put(name, buf); return ok({ photo: 'family:' + name, where: family.where });
    }
    if (api.startsWith('familyphoto/')) { const n = api.slice(12); if (!family || !FAMNAME.test(n)) return bad('not found', 404); const f = await family.get(n).catch(() => null); return f ? raw(f, 'image/jpeg') : bad('not found', 404); }
    if (api === 'family/code') { if (!family) return bad('no family store'); return ok(await family.code()); }
    if (api === 'family/code/new' && post) { if (!family) return bad('no family store'); const r = await family.newCode(); return r.error ? bad(r.error) : ok(r); }
    // (round R privacy) one click: the photos still kept as public files (content/faces, content/album) go into the
    // private store, custom.json names them family:<name>, and the public files are removed (gone from the website
    // with the next Publish)
    if (api === 'family/migrate' && post) {
      if (!family) return bad('no family store');
      const c = await readContent(), moved = new Map(); let n = 0;
      const move = async rel => { if (moved.has(rel)) return moved.get(rel); const buf = await S.read(rel); if (!buf) return null; const name = familyName(); await family.put(name, buf); n++; moved.set(rel, 'family:' + name); return 'family:' + name; };
      for (const f of Object.values(c.faces || {})) if (f && OLDFAM.test(f.photo || '')) { const r = await move(f.photo); if (r) f.photo = r; }
      for (const x of Array.isArray(c.album) ? c.album : []) if (x && OLDFAM.test(x.photo || '')) { const r = await move(x.photo); if (r) x.photo = r; }
      if (n) await writeContent(c);
      const gone = [...await S.walk('content/faces'), ...await S.walk('content/album')]; for (const rel of gone) await S.remove(rel);
      return ok({ moved: n, removed: gone.length, where: family.where, content: c });
    }
    if (api === 'musicfile' && post) { // a family recording (round N): a lullaby, a festival song… (content/music/), published with the content pack
      const m = /^data:audio\/(?:mpeg|mp3);base64,(.+)$/.exec(b.dataUrl || ''); if (!m) return bad('Choose an MP3 file.');
      const buf = Buffer.from(m[1], 'base64'); if (buf.length > 4 * 1024 * 1024) return bad('That recording is too big (over 4 MB): try a shorter one, or a lower quality MP3.');
      const rel = 'content/music/' + (slug(b.id || 'song') || 'song') + '-' + Date.now().toString(36) + '.mp3'; await S.write(rel, buf); return ok({ file: rel });
    }
    if (api === 'adimage' && post) { // a picture for an ad (content/ads/), published with the content pack
      const m = /^data:image\/(jpeg|png);base64,(.+)$/.exec(b.dataUrl || ''); if (!m) return bad('Choose a JPG or PNG picture.');
      const buf = Buffer.from(m[2], 'base64'); if (buf.length > 600 * 1024) return bad('That picture is too big (over 600 KB). Make it smaller first.');
      const rel = 'content/ads/' + slug(b.id || 'ad') + '-' + Date.now().toString(36) + (m[1] === 'png' ? '.png' : '.jpg'); await S.write(rel, buf); return ok({ image: rel });
    }
    // the family's own files, to show them on the pages (faces, ad pictures, photos)
    if (api.startsWith('file/')) { const rel = api.slice(5); if (!OURFILE.test(rel) || rel.includes('..')) return bad('no', 403); const f = await S.read(rel); return f ? raw(f, mimeOf(rel)) : bad('not found', 404); }
    if (api === 'job') return ok(JOB || {});
    // (r65) the list without the photos whose file is gone (an old ✕ undone by a stale list); a POST also saves it so
    if (api === 'photos/index') { const pix = await readJSON('photos/index.json', {}), have = new Set(await S.walk('photos')), out = {}; let gone = 0;
      for (const [k, L] of Object.entries(pix)) { const kept = (Array.isArray(L) ? L : []).filter(p => p && ((typeof p.url === 'string' && PHOTO_HOST.test(p.url)) || have.has(p.src))); /* (17 Oct AEDT) a linked photo has no file */ gone += (Array.isArray(L) ? L.length : 0) - kept.length; if (kept.length) out[k] = kept; }
      if (gone && post) await writeJSON('photos/index.json', out); return ok(out); }
    if (api === 'photos/get1' && post) { const x = b.item || {}; if (!/^[\p{L}\p{N}-]{1,60}$/u.test(x.key || '') || !Array.isArray(x.sources)) return bad('bad place'); return ok(await getPhotos1(x, Math.min(8, Math.max(1, +b.max || 4)))); }
    if (api === 'photos/remove' && post) { const pix = await readJSON('photos/index.json', {}), L = pix[b.key] || []; const i = L.findIndex(p => (b.src && p.src === b.src) || (b.src && p.url === b.src)); if (i >= 0) { // (17 Oct AEDT) a linked photo by its address
      if (L[i].file && b.block !== false) { const bl = await readJSON('photos/blocked.json', {}); bl[b.key] = [...new Set([...(bl[b.key] || []), L[i].file, ...(L[i].url ? [L[i].url] : [])])].slice(-60); await writeJSON('photos/blocked.json', bl); } // not fetched again
      if (L[i].src && OURPHOTO.test(L[i].src) && !L[i].src.includes('..')) await S.remove(L[i].src); L.splice(i, 1); if (L.length) pix[b.key] = L; else delete pix[b.key]; await writeJSON('photos/index.json', pix); } return ok({ ok: true }); }
    if (api === 'voices/extra') {
      const L = await readJSON('tools/voice-extra.json', []);
      if (post) { const have = new Set(L.map(l => l.lang + '|' + l.text)); let n = 0; for (const l of b.lines || []) if (l && CAST[l.lang] && typeof l.text === 'string' && l.text.trim() && l.text.length < 400 && !have.has(l.lang + '|' + l.text)) { L.push({ lang: l.lang, text: l.text }); have.add(l.lang + '|' + l.text); n++; } if (n) await S.write('tools/voice-extra.json', Buffer.from(JSON.stringify(L, null, 0).replace(/\},\{/g, '},\n{') + '\n')); return ok({ added: n, total: L.length }); }
      return ok(L);
    }
    if (api === 'site/status') return ok(await siteStatus());
    if (api === 'site/rebuild' && post) { if (!conf.netlifyToken || !conf.netlifySite) return bad('Add your Netlify token and site in Settings first.'); await nf(`/sites/${encodeURIComponent(conf.netlifySite)}/builds`, { method: 'POST', body: '{}' }); return ok({ ok: true }); }
    if (api === 'site/restore' && post) { if (!/^[0-9a-f]{16,40}$/.test(b.id || '')) return bad('bad deploy'); await nf(`/sites/${encodeURIComponent(conf.netlifySite)}/deploys/${b.id}/restore`, { method: 'POST', body: '{}' }); return ok({ ok: true }); }
    if (api === 'github/merge' && post) { if (!(+b.n > 0) || !gh) return bad('bad pull request'); const r = await gh(`/repos/${conf.githubRepo}/pulls/${+b.n}/merge`, { method: 'PUT', body: JSON.stringify({ merge_method: 'merge' }) }); return ok({ ok: true, sha: r.sha }); }
    if (api === 'github/publish' && post) {
      const msg = String(b.message || '').slice(0, 200);
      // online, in steps (owner, 12 Oct: one request for every photo ran out of time, 504): the page calls again while `more`
      if (S.publishStep && b.step) { const r = await S.publishStep(msg); return ok(r.more ? { kind: 'github', end: false, step: true, more: true, left: r.left, sent: r.sent } : { kind: 'github', end: true, step: true, result: r.result, done: r.result.changed, total: r.result.changed }); }
      if (S.publish) { const result = await S.publish(msg); return ok({ kind: 'github', end: true, result, done: result.changed, total: result.changed }); } // online: straight away
      return ok(job('github', J => publishDraft(J, msg))); // the exe: the draft goes live
    }
    if (api === 'github/draft' && post) { if (S.publish) return bad('Online, every save already goes to the draft.'); return ok(job('github', J => draftFromFolder(J, String(b.message || '').slice(0, 200)))); }
    if (api === 'srcfiles') { const list = []; for (const d of ['js', 'js/games']) for (const f of (await S.list(d)).sort()) if (/\.(js|ts)$/.test(f)) list.push(d + '/' + f.replace(/\.ts$/, '.js')); return ok([...new Set(list)]); } // (r86: a TypeScript file is read as the .js made from it)
    if (api === 'voices/have') return ok(await voicesHave());
    // (Voice & Audio, 12 Oct) the daily voice recording (.github/workflows/voices-daily.yml): its last run's summary,
    // from the voices/daily branch while its recordings wait for Release to merge them, else from main
    if (api === 'voices/daily') {
      if (!gh || !/^[\w.-]+\/[\w.-]+$/.test(conf.githubRepo || '')) return ok(null);
      for (const ref of ['voices/daily', conf.githubBranch || 'main']) {
        try { const c = await gh(`/repos/${conf.githubRepo}/contents/tools/voice-daily.json?ref=${encodeURIComponent(ref)}`); if (c && c.content) return ok({ ...JSON.parse(Buffer.from(c.content, 'base64').toString('utf8')), ref }); } catch (e) { }
      }
      return ok(null);
    }
    if (api === 'voice' && post) {
      if (!CAST[b.lang] || !CAST[b.lang].includes(b.slot) || !/^[0-9a-f]{8}-?[0-9a-f]{1,8}$/.test(b.hash || '')) return bad('bad line');
      let mp3;
      if (b.engine === 'azure') mp3 = await azureSay(b.lang, b.slot, String(b.text || ''), b.runs);
      else if (b.engine === 'piper') { if (!local.tts) return bad('Piper runs on the family computer only (in SparkleStudio.exe).'); mp3 = await local.tts('piper', b.lang, String(b.text || '')); }
      else if (b.engine === 'upload') { const m = /^data:audio\/mpeg;base64,(.+)$/.exec(b.audio || ''); if (!m) return bad('not an MP3'); mp3 = Buffer.from(m[1], 'base64'); }
      else return bad('which engine?');
      await S.write(`voices/${b.lang}/${b.slot}/${b.hash}.mp3`, mp3); await addToManifest(b.lang, b.slot, b.hash);
      return ok({ ok: true, bytes: mp3.length });
    }
    // the missing lines inbox: lines the children's devices had to say with the machine voice (from the website)
    if (api === 'voices/inbox') { if (!local.inbox) return ok([]); try { return ok(await local.inbox()); } catch (e) { return ok([]); } }
    if (api === 'players/label' && post) { if (!local.label) return bad('Set the website address and the Studio password in Settings first.'); return ok(await local.label(b)); }
    if (api === 'players') { if (!local.players) return bad('Set the website address and the Studio password in Settings to see the players.'); return ok(await local.players(b)); }
    // (owner, 12 Oct) tester reports: on the website (the exe asks it with its Studio key)
    // (r81, owner 17 Oct AEDT) the content pages' live sections: the exe sends them to the website with its Studio key
    if (api === 'live/content') { if (!local.live) return bad('Set the website and a Studio key in Settings to put these pages live at once.'); try { return ok(await local.live(post ? b : null)); } catch (e) { return bad(String(e.message || e)); } }
    if (/^testers(\/(set|problem\/[a-f0-9]{16}|shot\/[a-f0-9]{16}))?$/.test(api)) { if (!local.testers) return bad('Set the website address and the Studio password in Settings to see the tester reports.'); try { return ok(await local.testers(api, post ? b : null)); } catch (e) { return bad(String(e.message || e)); } }
    if (api === 'bot/run' && post) {
      if (!gh || !/^[\w.-]+\/[\w.-]+$/.test(conf.githubRepo || '')) return bad('Configure a GitHub token and repository in Settings to dispatch bot tests.', 503);
      if (!Number.isInteger(b.count) || b.count < 1 || b.count > 10 || !['chaos-toddler', 'gentle-explorer', 'max-competence'].includes(b.profile) || !Number.isInteger(b.duration) || b.duration < 1 || b.duration > 30) return bad('Invalid bot configuration.');
      try {
        const workflowId = 'nightly-child-bots.yml';
        await gh(`/repos/${conf.githubRepo}/actions/workflows/${workflowId}/dispatches`, {
          method: 'POST',
          body: JSON.stringify({ ref: conf.githubBranch || 'main', inputs: { count: String(b.count), profile: b.profile, duration: String(b.duration) } })
        });
        return ok({ ok: true, workflow: workflowId });
      } catch (e: any) {
        return bad(String(e.message || e));
      }
    }
    if (api === 'check') return ok(await check());
    if (local.api) { const r = await local.api(api, method, b); if (r) return r; }
    return bad('unknown', 404);
  }
  return { handle, readContent, store: S, version: STUDIO_VERSION };
}

// ---------- the online Studio's password ----------
// The grown-ups' password is STUDIO_PASSWORD in Netlify. Signing in gives a token (kept in a cookie for 30 days)
// made from the password, so changing the password signs everyone out.
const tokenKey = pw => crypto.createHash('sha256').update('sparkle-studio:' + pw).digest();
const makeToken = (pw, days = 30) => { const exp = Date.now() + days * 864e5, sig = crypto.createHmac('sha256', tokenKey(pw)).update(String(exp)).digest('base64url'); return exp + '.' + sig; };
const checkToken = (pw, t) => { if (!pw || !t) return false; const [exp, sig] = String(t).split('.'); if (!(+exp > Date.now())) return false; const want = crypto.createHmac('sha256', tokenKey(pw)).update(String(exp)).digest('base64url'); return sig && sig.length === want.length && crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(want)); };
const samePassword = (pw, given) => { if (!pw || typeof given !== 'string') return false; const a = crypto.createHash('sha256').update(pw).digest(), b = crypto.createHash('sha256').update(given).digest(); return crypto.timingSafeEqual(a, b); };

const engine = { createStudio, buildRank, folderStore, githubStore, ghApi, STUDIO_VERSION, MIME, mimeOf, slug, CAST, makeToken, checkToken, samePassword, FAMILY, FAMREF, FAMNAME, familyRefs };
module.exports = engine;
// TypeScript cannot see module.exports across files (the only syntax that could, import = require, is not a type note),
// and an "export" would make esbuild treat this file as a module (the exe and the website bundle it): the engine's shape
// is given a name for every file instead, for studio.cts and netlify/functions/studio.mts
declare global { type StudioEngine = typeof engine; }
