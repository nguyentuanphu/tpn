// Fetches 3–5 freely licensed photos of every landmark from Wikimedia Commons into photos/<key>/ and lists them in
// photos/index.json. (Owner, 17 Oct AEDT: photos are now linked from Wikimedia or Flickr, not saved; Studio's Real
// photos page does that. This tool saves copies, so it is kept only as a last resort, as Studio's own saving is;
// rule PRIV-011.) A developer runs it on a computer with the internet. A grown-up can take a photo off in Studio
// (photos/blocked.json is respected here too).
//
//   node tools/fetch-landmark-photos.mts                 places without photos, 4 each
//   node tools/fetch-landmark-photos.mts --max 5         3 to 5 per place
//   node tools/fetch-landmark-photos.mts --only opera,uluru   just these landmarks (ids from js/realworld.js REAL)
//   node tools/fetch-landmark-photos.mts --force         fetch again for places that already have photos
//   node tools/fetch-landmark-photos.mts --kinds         also the kinds of houses and the symbol animals
//   node tools/fetch-landmark-photos.mts --dry           only list what would be fetched
// In the cloud sandbox: NODE_USE_ENV_PROXY=1 NODE_EXTRA_CA_CERTS=/root/.ccr/ca-bundle.crt node tools/fetch-landmark-photos.mts
//
// photos/index.json: { "<key>": [{ "src": "photos/<key>/1.jpg", "file": "File:….jpg", "caption": "…", "credit": "Artist ·
// CC BY-SA 4.0 · Wikimedia Commons", "licence": "CC BY-SA 4.0", "page": "https://commons.wikimedia.org/wiki/File:…" }] }
// The key is photoKey(sources) as in js/realworld.js (the first Wikipedia article's title, lower case, dashes).
// Photos are at most 1280 px: resized with sharp when it is installed, otherwise Wikimedia's own 1280 px thumbnail.
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d; }, has = k => process.argv.includes(k);
const MAX = Math.min(5, Math.max(3, +arg('--max', 4) || 4)), ONLY = arg('--only', '') ? new Set(arg('--only', '').split(',').map(s => s.trim())) : null;
// --link (1 Nov 2026 AEDT, the owner's rule since 17 Oct: photos are linked, not saved): list Wikimedia's own picture
// address instead of saving a copy
const FORCE = has('--force'), DRY = has('--dry'), KINDS = has('--kinds'), LINK = has('--link'), SIZE = 1280;
const UA = { 'User-Agent': 'SparkleValleyPhotos/1.0 (family game; developer tool fetching freely licensed photos)', accept: 'application/json' };
const BAD = /\.(svg|gif|tif|tiff|webm|ogv|ogg|oga|wav|mp3|pdf)$|logo|flag of|map|locator|coat of arms|seal of|icon|diagram|signature|plan of|chart/i;
// free to reuse with a credit: public domain, CC0, CC BY and CC BY-SA (never NC or ND)
const FREE = l => /^(public domain|pd\b|cc0|cc[ -]by(-sa)?([ -][\d.]+)?)/i.test(l) && !/nc|nd/i.test(l);
const wait = ms => new Promise(r => setTimeout(r, ms));
const strip = h => String(h || '').replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#0?39;|&apos;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/\s+/g, ' ').trim();
// the same key as js/realworld.js photoKey (Studio uses it too)
const photoKey = sources => sources[0].toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-|-$/g, '').slice(0, 60);
const readJSON = (rel, def) => { try { return JSON.parse(fs.readFileSync(path.join(ROOT, rel), 'utf8')); } catch (e) { return def; } };

// ---------- the places, read from the game's own files (no browser modules are loaded) ----------
const src = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');
// an object written in a game file (its text), read as it is: its values as the caller says they are
const literal = <T,>(text: string, start: string, close: string): Record<string, T> => { const a = text.indexOf(start); if (a < 0) return {}; const b = text.indexOf(close, a); return Function(`return (${text.slice(a + start.length - 1, b + close.indexOf('}') + 1)})`)(); };
function places() {
  const real = { ...literal(src('js/realworld.js'), 'export const REAL = {', '\n};'), ...literal(src('js/regionsites.js'), 'Object.assign(REAL, {', '\n});') };
  const out = new Map();
  for (const [id, r] of Object.entries(real)) if (!ONLY || ONLY.has(id)) out.set(photoKey(r[0]), { id, sources: r[0] });
  if (KINDS && !ONLY) {
    for (const [kind, s] of Object.entries(literal<string[]>(src('js/realworld.js'), 'export const REAL_KINDS = {', '\n};'))) if (s && s.length && !out.has(photoKey(s))) out.set(photoKey(s), { id: kind, sources: s });
    // (1 Nov 2026 AEDT) the symbol animals' photos (js/symbols.ts: each line's list of Wikipedia pages)
    for (const m of src('js/symbols.ts').matchAll(/\[('(?:en|vi):[^']+'(?:,\s*'(?:en|vi):[^']+')*)\]/g)) { const s = [...m[1].matchAll(/'([^']+)'/g)].map(x => x[1]); if (!out.has(photoKey(s))) out.set(photoKey(s), { id: 'symbol', sources: s }); }
    const sym = src('js/symbols.js'), block = sym.slice(sym.indexOf('const SYMBOLS = ['), sym.indexOf('\n];', sym.indexOf('const SYMBOLS = [')));
    for (const m of block.matchAll(/\[((?:'(?:en|vi):[^']+'(?:,\s*)?)+)\]\]/g)) { const s = Function(`return [${m[1]}]`)(); if (!out.has(photoKey(s))) out.set(photoKey(s), { id: 'symbol', sources: s }); }
  }
  return [...out.entries()].map(([key, v]) => ({ key, ...v }));
}

// ---------- Wikimedia ----------
async function getJSON(url) {
  for (let a = 0; a < 6; a++) {
    const r = await fetch(url, { headers: UA }).catch(() => null);
    if (r && r.ok) return r.json();
    if (r && r.status !== 429 && r.status < 500) return null;
    await wait(5000 * (a + 1)); // (Wikimedia asks a busy tool to wait: 429)
  }
  return null;
}
const info = (title, ii, lead) => {
  const md = ii.extmetadata || {}, v = k => strip(md[k] && md[k].value), licence = v('LicenseShortName') || v('License');
  return { file: title, url: ii.thumburl || ii.url, mime: ii.mime || '', width: ii.width || 0, height: ii.height || 0, licence, free: FREE(licence) && v('NonFree') !== 'true',
    caption: (v('ImageDescription') || title.replace(/^File:|\.\w+$/g, '')).slice(0, 160), artist: v('Artist').slice(0, 80), page: ii.descriptionurl || 'https://commons.wikimedia.org/wiki/' + encodeURIComponent(title.replace(/ /g, '_')), lead };
};
const IIPROP = `prop=imageinfo&iiprop=url|mime|size|extmetadata&iiurlwidth=${SIZE}`;
// the pictures the article's editors chose, its main picture first
async function articlePhotos(lang, title) {
  const base = `https://${lang}.wikipedia.org/w/api.php?format=json&formatversion=2&redirects=1&titles=${encodeURIComponent(title)}`;
  const lead = ((((await getJSON(base + '&action=query&prop=pageimages&piprop=name')) || {}).query || {}).pages || [])[0];
  const leadName = String((lead && lead.pageimage) || '').replace(/ /g, '_');
  const all = await getJSON(base + `&action=query&generator=images&gimlimit=60&${IIPROP}`);
  return (((all || {}).query || {}).pages || []).filter(pg => pg.imageinfo && pg.imageinfo[0])
    .map(pg => info(pg.title, pg.imageinfo[0], pg.title.replace(/^[^:]+:/, '').replace(/ /g, '_') === leadName));
}
// more of the place from the whole Commons library
async function commonsSearch(q) {
  const j = await getJSON(`https://commons.wikimedia.org/w/api.php?action=query&format=json&formatversion=2&generator=search&gsrnamespace=6&gsrlimit=20&gsrsearch=${encodeURIComponent(q + ' filetype:bitmap')}&${IIPROP}`);
  return (((j || {}).query || {}).pages || []).filter(pg => pg.imageinfo && pg.imageinfo[0]).map(pg => info(pg.title, pg.imageinfo[0], false));
}
async function candidates(sources) {
  const out = [];
  for (const s of sources) { const [lang, title] = s.split(/:(.+)/); try { out.push(...await articlePhotos(lang, title)); } catch (e) { } await wait(300); }
  for (const s of sources) { if (out.filter(c => c.free).length >= MAX) break; try { out.push(...await commonsSearch(s.split(/:(.+)/)[1])); } catch (e) { } await wait(300); }
  const words = sources[0].split(/:(.+)/)[1].toLowerCase().split(/\s+/).filter(w => w.length > 2);
  const score = c => (c.lead ? 100 : 0) + Math.min(30, c.width / 60) + (c.width > c.height ? 10 : 0) + words.filter(w => (c.file + ' ' + c.caption).toLowerCase().includes(w)).length * 8;
  const seen = new Set();
  return out.filter(c => c.free && /^image\/(jpeg|png|webp)$/.test(c.mime) && !BAD.test(c.file) && c.width >= 640 && /^https:\/\/upload\.wikimedia\.org\//.test(c.url) && !seen.has(c.file) && seen.add(c.file))
    .sort((a, b) => score(b) - score(a));
}

// ---------- saving ----------
let sharp = null; try { sharp = (await import('sharp')).default; } catch (e) { } // optional: not a dependency of the game
async function save(c, key, n) {
  if (LINK) return { url: c.url, file: c.file, caption: c.caption, credit: [c.artist, c.licence, 'Wikimedia Commons'].filter(Boolean).join(' · ').slice(0, 200), licence: c.licence, page: c.page };
  const r = await fetch(c.url, { headers: { 'User-Agent': UA['User-Agent'] } }).catch(() => null);
  if (!r || !r.ok || !/^image\//.test(r.headers.get('content-type') || '')) return null;
  let buf = Buffer.from(await r.arrayBuffer()), ext = c.mime === 'image/png' ? 'png' : c.mime === 'image/webp' ? 'webp' : 'jpg';
  if (sharp) { try { buf = await sharp(buf).rotate().resize({ width: SIZE, height: SIZE, fit: 'inside', withoutEnlargement: true }).jpeg({ quality: 82, mozjpeg: true }).toBuffer(); ext = 'jpg'; } catch (e) { } }
  const rel = `photos/${key}/${n}.${ext}`;
  fs.mkdirSync(path.join(ROOT, 'photos', key), { recursive: true }); fs.writeFileSync(path.join(ROOT, rel), buf);
  return { src: rel, file: c.file, caption: c.caption, credit: [c.artist, c.licence, 'Wikimedia Commons'].filter(Boolean).join(' · ').slice(0, 200), licence: c.licence, page: c.page };
}

const index = readJSON('photos/index.json', {}), blocked = readJSON('photos/blocked.json', {});
const list = places().filter(p => FORCE || !(index[p.key] && index[p.key].length));
console.log(`${list.length} place(s) to fetch, ${MAX} photos each${sharp ? ', resized with sharp' : `, Wikimedia's ${SIZE} px thumbnails (sharp not installed)`}${DRY ? ' (dry run)' : ''}`);
let done = 0, none = [];
for (const p of list) {
  const block = new Set(blocked[p.key] || []);
  const picks = (await candidates(p.sources)).filter(c => !block.has(c.file) && !block.has(c.url)).slice(0, MAX);
  if (DRY) { console.log(`${p.key} (${p.id}): ${picks.map(c => c.file + ' [' + c.licence + ']').join(', ') || 'nothing free found'}`); continue; }
  const old = index[p.key] || [], out = [];
  for (const c of picks) { const e = await save(c, p.key, out.length + 1); if (e) out.push(e); await wait(300); }
  if (out.length) {
    // files of the old list that were not written again are taken away
    for (const o of old) if (/^photos\/[\w\p{L}\p{N}./-]+$/u.test(o.src || '') && !o.src.includes('..') && !out.some(e => e.src === o.src)) { try { fs.unlinkSync(path.join(ROOT, o.src)); } catch (e) { } }
    index[p.key] = out;
    fs.writeFileSync(path.join(ROOT, 'photos/index.json'), JSON.stringify(index, null, 1)); // after every place, so a stop loses nothing
  } else none.push(p.key);
  console.log(`${++done}/${list.length} ${p.key}: ${out.length} photo(s)`);
}
if (none.length) console.log('No free photos found for: ' + none.join(', ') + ' (try Studio → Real photos, which also searches Openverse)');
