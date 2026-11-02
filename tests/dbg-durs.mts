// (films batch, while writing) the recorded length of each page's words: node dbg-durs.mts id…
import fs from 'fs';
globalThis.localStorage = { getItem: () => null, setItem() {} }; globalThis.window = globalThis; globalThis.document = { addEventListener() {}, createElement: () => ({ getContext: () => null }), documentElement: {}, querySelectorAll: () => [] }; globalThis.addEventListener = () => {};
const R = new URL('..', import.meta.url).pathname;
const { lineHash } = await import(R + 'js/packhash.js');
const man = JSON.parse(fs.readFileSync(R + 'voices/manifest.json'));
const dur = (lang, text) => { const h = lineHash(lang, text), s = man.lines[h]; if (!s) return null; return Math.min(...[...s].map(x => { try { return fs.statSync(`${R}voices/${lang}/${x}/${h}.mp3`).size / 4000; } catch (e) { return 99; } })); };
const src = fs.readFileSync(R + 'js/learn.js', 'utf8') + fs.readFileSync(R + 'js/talesdata.js', 'utf8');
for (const id of process.argv.slice(2)) {
  const m = new RegExp(`(?:id: '${id}'|tale\\('${id}')[\\s\\S]*?\\]\\]`).exec(src); if (!m) { console.log(id, '?'); continue; }
  const pages = [...m[0].matchAll(/\[\s*'[^']*',\s*'((?:[^'\\]|\\.)*)',\s*'((?:[^'\\]|\\.)*)'\s*\]/g)].map(x => [x[1].replace(/\\'/g, "'"), x[2].replace(/\\'/g, "'")]);
  console.log(id + ': ' + pages.map(([en, vi]) => `${dur('en', en)?.toFixed(1)}/${dur('vi', vi)?.toFixed(1)}`).join('  '));
}
