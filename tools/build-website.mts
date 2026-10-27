// (r89, owner 23 Oct AEDT: "Implement the real floating website") the family website at /home, made from the reviewed
// design (docs/website-review-20261023/prototype.html, itself made by that folder's sync-website.mjs from the release's
// own game files). The review page's demo controls (the Website / Welcome / In game switcher, the drawn game stage and its
// pretend Settings) are taken out; Play enters the real game, and inside the game (/home/?embed=1, js/website.ts) Close,
// Back to game and Escape ask the game to close the floating view. Pictures move out of the page into home/assets/
// under their own content hash, so the page is light and each picture is fetched once.
//   node tools/build-website.mts           write home/index.html and home/assets/
//   node tools/build-website.mts --check   change nothing; exit 1 if home/ is not what the design makes
import fs from 'fs';
import path from 'path';
import { createHash } from 'crypto';
import { fileURLToPath } from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(ROOT, 'docs/website-review-20261023/prototype.html'), HOME = path.join(ROOT, 'home'), ASSETS = path.join(HOME, 'assets');
const EXT: Record<string, string> = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp', 'font/woff2': 'woff2' };

/** cut one piece of the page out: from `start` to the end of `end` (both must be there, once) */
function cut(html: string, start: string, end: string, put = ''): string {
  const a = html.indexOf(start); if (a < 0) throw Error('the design no longer has: ' + start.slice(0, 60));
  const b = html.indexOf(end, a); if (b < 0) throw Error('the design no longer has: ' + end.slice(0, 60));
  if (html.indexOf(start, a + 1) >= 0) throw Error('the design has this twice: ' + start.slice(0, 60));
  return html.slice(0, a) + put + html.slice(b + end.length);
}

// the production behaviour, in place of the review page's demo modes (the rest of the page's script is kept as reviewed)
const LIVE = `const Q=new URLSearchParams(location.search),EMBED=Q.get('embed')==='1'&&window.parent!==window;
const keptLang=()=>{try{return localStorage.getItem('sv_parent_lang')}catch(e){return null}};
let lang=Q.get('lang')==='vi'||Q.get('lang')==='en'?Q.get('lang'):keptLang()==='vi'?'vi':'en';
const site=document.querySelector('#site-content'),host=document.querySelector('#standalone'),menu=document.querySelector('#menu-dialog'),dialog={get open(){return EMBED}};host.append(site);
document.body.dataset.mode=EMBED?'embedded':'website';if(EMBED)site.classList.add('overlay');
// inside the game the page only ever asks to close (Close, Back to game, Escape); it is told nothing and sends nothing else
function tell(what){if(EMBED)window.parent.postMessage({sv:'website',do:what},location.origin)}
function closeSite(){tell('close')}
function playGame(){if(EMBED){tell('play');return}window.svWebsitePlay?.();location.href='/'}
document.querySelectorAll('[data-action=play]').forEach(b=>b.onclick=playGame);document.querySelector('#close-site').onclick=closeSite;
document.querySelector('#language-button').onclick=()=>{lang=lang==='en'?'vi':'en';if(!EMBED)try{localStorage.setItem('sv_parent_lang',lang)}catch(e){}translate()};
document.querySelectorAll('[data-open-menu]').forEach(b=>b.onclick=()=>menu.showModal());document.querySelector('#close-menu').onclick=()=>menu.close();menu.addEventListener('click',e=>{if(e.target===menu)menu.close()});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&EMBED&&!document.querySelector('dialog[open]'))closeSite()});`;

export function makeWebsite(html: string): { page: string, files: Map<string, Buffer> } {
  let h = html.replace('window.svFestivalVisible=()=>true;', 'window.svFestivalVisible=()=>false;');
  h=h.replace(/id="(quest-(?:daily-fest_|hunt-|festival-)[\w-]+)"/g,'id="$1" data-festival-visible="false"');
  h = cut(h, '<div class="demo-bar">', '</div></div>\n');
  h = cut(h, '<section id="game-stage"', '</section>\n');
  h = cut(h, '<dialog id="site-dialog"', '</dialog>\n');
  // the language switch is the design's own: kept as it is, after the production start
  const tr = h.indexOf('function translate(){'), translate = tr < 0 ? '' : h.slice(tr, h.indexOf('\n', tr));
  if (!translate) throw Error('the design no longer has its translate()');
  h = cut(h, "let lang='en',mode='website',opener=null;", "menu.addEventListener('click',e=>{if(e.target===menu)menu.close()});", LIVE + '\n' + translate);
  h = h.replace(/<title>[^<]*<\/title>/, '<link rel="icon" href="/icons/icon-192.png"><title>Sparkle Valley | Family website · Trang web gia đình</title>');
  // first-party visit counts on the standalone site only, after a grown-up says yes (home/site.ts)
  h = h.replace('</body>', '<script type="module" src="/home/site.js"></script></body>');
  const files = new Map<string, Buffer>();
  h = h.replace(/data:([^;"']+);base64,([A-Za-z0-9+/=]+)/g, (_m, mime: string, encoded: string) => {
    const data = Buffer.from(encoded, 'base64'), ext = EXT[mime];
    if (!ext) throw Error('a picture of a kind the website cannot keep: ' + mime);
    const name = createHash('sha256').update(data).digest('hex').slice(0, 24) + '.' + ext;
    files.set(name, data); return '/home/assets/' + name;
  });
  if (/class="demo-bar"|data-mode-button=|id="game-stage"|id="site-dialog"|setMode\(/.test(h)) throw Error('a review-only control is still in the website');
  // (owner, 23 Oct AEDT: "no where in website or game should be sent to github, they are my source code")
  if (/github\.com|githubusercontent/i.test(h)) throw Error('the website links to GitHub: ' + (h.match(/.{60}github.{40}/i) || [''])[0]);
  return { page: h, files };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const { page, files } = makeWebsite(fs.readFileSync(SRC, 'utf8'));
  const want = new Set(files.keys()), have = fs.existsSync(ASSETS) ? fs.readdirSync(ASSETS) : [];
  if (process.argv.includes('--check')) {
    const now = fs.existsSync(path.join(HOME, 'index.html')) ? fs.readFileSync(path.join(HOME, 'index.html'), 'utf8') : '';
    const missing = [...want].filter(f => !have.includes(f)), extra = have.filter(f => !want.has(f));
    if (now !== page || missing.length || extra.length) { console.error(`home/ is not the reviewed design: run node tools/build-website.mts (page ${now === page ? 'same' : 'changed'}, ${missing.length} pictures missing, ${extra.length} left over)`); process.exit(1); }
    console.log(`home/ matches the reviewed design (${want.size} pictures)`);
  } else {
    fs.mkdirSync(ASSETS, { recursive: true });
    for (const f of have) if (!want.has(f)) fs.rmSync(path.join(ASSETS, f));
    for (const [f, data] of files) if (!have.includes(f)) fs.writeFileSync(path.join(ASSETS, f), data);
    fs.writeFileSync(path.join(HOME, 'index.html'), page);
    const kb = Math.round(Buffer.byteLength(page) / 1024), mb = ([...files.values()].reduce((n, b) => n + b.length, 0) / 1048576).toFixed(1);
    console.log(`home/index.html ${kb} KB, ${files.size} pictures in home/assets (${mb} MB)`);
  }
}
