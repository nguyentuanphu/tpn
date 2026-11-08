// The Sparkle Valley Handbook (helper "handbook", owner's ask 4 Nov 2026 AEDT; docs/cores/tasks/handbook-brief.md).
// One bilingual page (Vietnamese first, with an English switch and a search box) about everything in the game, made from
// the game's own data and the project's docs, so it always matches the code. Run before every "yes, deploy":
//   node tools/handbook.mts            writes docs/handbook/index.html and docs/handbook/img/
//   node tools/handbook-shots.mts      (optional, first) refreshes the "now" pictures from the running game
// It reads game modules in Node with small browser stand-ins; nothing in the game changes. Pictures are the game's own
// drawings (js/art.ts), its screenshots and renders; no phone emoji reach the page text.
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { registerHooks } from 'node:module';
import { exportManagementCatalogue } from './export-management-catalogue.mts';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'docs/handbook');
const IMG = path.join(OUT, 'img');
const rd = (f: string) => fs.readFileSync(path.join(ROOT, f), 'utf8');
const has = (f: string) => fs.existsSync(path.join(ROOT, f));
const git = (...a: string[]) => { try { return execFileSync('git', a, { cwd: ROOT, encoding: 'utf8', maxBuffer: 64 << 20 }); } catch { return ''; } };

// ---------- reading the game's modules in Node ----------
// the game imports './x.js' for a file written as x.ts (tools/build.mts makes the .js); always point Node at the .ts
registerHooks({
  resolve(spec, ctx, next) {
    if (spec.endsWith('.js') && ctx.parentURL?.startsWith('file:')) {
      // the .ts is the source; a .js beside it is only a build output, and mixing the two would load a module twice
      const t = new URL(spec, ctx.parentURL).href.replace(/\.js$/, '.ts');
      if (t.startsWith('file:') && fs.existsSync(fileURLToPath(t))) return next(t, ctx);
    }
    return next(spec, ctx);
  }
});
{
  const mem: Record<string, string> = {};
  const store = { getItem: (k: string) => mem[k] ?? null, setItem: (k: string, v: string) => { mem[k] = String(v); }, removeItem: (k: string) => { delete mem[k]; }, key: () => null, length: 0, clear() { } };
  const el = (): any => new Proxy(function () { } as any, { get: (_t, k) => k === Symbol.toPrimitive ? () => '' : k === 'style' || k === 'dataset' || k === 'classList' ? new Proxy({}, { get: () => () => { } }) : el(), apply: () => el() });
  const g = globalThis as any;
  Object.assign(g, { localStorage: store, sessionStorage: store, window: g, addEventListener() { }, removeEventListener() { }, innerWidth: 1200, innerHeight: 800,
    location: { search: '', hash: '', href: 'http://localhost/', pathname: '/', hostname: 'localhost' }, matchMedia: () => ({ matches: false, addEventListener() { } }), requestAnimationFrame: () => 0 });
  if (!g.navigator) g.navigator = { language: 'vi', userAgent: 'node' };
  g.document = { createElement: el, getElementById: () => null, querySelector: () => null, querySelectorAll: () => [], addEventListener() { }, body: el(), head: el(), documentElement: el(), fonts: { ready: Promise.resolve() } };
}
const quietWarn = console.warn; console.warn = () => { };
const load = async (f: string): Promise<any> => { try { return await import(pathToFileURL(path.join(ROOT, f)).href); } catch (e) { missing.push(`${f}: ${String((e as Error).message).slice(0, 120)}`); return {}; } };
const missing: string[] = [];

type P = { en: string; vi: string };
const I18N = await load('js/i18n.ts');
const bothOf = (f: () => string): P => { try { const [en, vi] = I18N.both(f); return { en: String(en), vi: String(vi) }; } catch { return { en: '', vi: '' }; } };
const pair = (x: any): P => !x ? { en: '', vi: '' } : typeof x === 'function' ? bothOf(x) : Array.isArray(x) ? { en: String(x[0] ?? ''), vi: String(x[1] ?? x[0] ?? '') } : typeof x === 'object' && 'en' in x ? { en: String(x.en), vi: String(x.vi ?? x.en) } : { en: String(x), vi: String(x) };

// ---------- text helpers ----------
const EMO = /[\p{Extended_Pictographic}\u{1F1E6}-\u{1F1FF}\u{1F3FB}-\u{1F3FF}\u{FE0F}\u{200D}\u{20E3}\u{E0020}-\u{E007F}]/gu;
const noEmo = (s: string) => String(s ?? '').replace(EMO, '').replace(/[ \t]{2,}/g, ' ').replace(/\(\s*\)/g, '').trim();
const esc = (s: string) => noEmo(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const md = (s: string) => esc(s).replace(/`([^`]+)`/g, '<code>$1</code>').replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>').replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1');
const fold = (s: string) => noEmo(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/\s+/g, ' ');
/** both languages, the page shows one */
const L = (p: P | string | undefined, vi?: string) => { if (p === undefined || p === null) return ""; const x = typeof p === 'string' ? { en: p, vi: vi ?? p } : p; return x.en === x.vi || !x.vi ? esc(x.en) : `<span class="l-vi">${esc(x.vi)}</span><span class="l-en">${esc(x.en)}</span>`; };
const LM = (en: string, vi: string) => `<span class="l-vi">${md(vi)}</span><span class="l-en">${md(en)}</span>`;
const S = (...parts: (P | string | undefined)[]) => ` data-s="${esc(fold(parts.filter(Boolean).map(p => typeof p === 'string' ? p : p!.en + ' ' + p!.vi).join(' ')))}"`;

// ---------- the game's own drawings, as one sprite ----------
const ART = await load('js/art.ts');
try { await ART.moreArt?.(); } catch { }
const sprite = new Map<string, string>();
const art = (icon: string | undefined, cls = '') => {
  if (!icon) return '';
  let id = sprite.get(icon);
  if (!id) {
    let svg: string | null = null; try { svg = ART.artSVG?.(icon) ?? null; } catch { }
    if (!svg) return '';
    id = 'a' + sprite.size; sprite.set(icon, id);
    const view = /viewBox="([^"]+)"/.exec(svg)?.[1] || '0 0 48 48';
    symbols.push(`<symbol id="${id}" viewBox="${view}">${svg.replace(/^<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '')}</symbol>`);
  }
  return `<svg class="art ${cls}" aria-hidden="true"><use href="#${id}"></use></svg>`;
};
const symbols: string[] = [];

// ---------- pictures: small JPEGs in docs/handbook/img ----------
fs.rmSync(path.join(IMG, 'then'), { recursive: true, force: true });
fs.rmSync(path.join(IMG, 'cast'), { recursive: true, force: true });
fs.mkdirSync(path.join(IMG, 'then'), { recursive: true }); fs.mkdirSync(path.join(IMG, 'cast'), { recursive: true });
const tmp = fs.mkdtempSync(path.join(OUT, '.tmp-'));
/** copy a picture (a file, or ref:path from git) into img/<dir>/<name>.jpg, at most width w */
const pic = (src: string, dir: string, name: string, w = 760): string | null => {
  let file = path.join(ROOT, src);
  if (src.includes(':') && !fs.existsSync(file)) {
    const [ref, p] = [src.slice(0, src.indexOf(':')), src.slice(src.indexOf(':') + 1)];
    try { const buf = execFileSync('git', ['show', `${ref}:${p}`], { cwd: ROOT, maxBuffer: 64 << 20 }); file = path.join(tmp, path.basename(p)); fs.writeFileSync(file, buf); } catch { return null; }
  }
  if (!fs.existsSync(file)) return null;
  const rel = `img/${dir}/${name}.jpg`;
  try { execFileSync('convert', [file + '[0]', '-resize', `${w}x${w}>`, '-strip', '-interlace', 'Plane', '-quality', '64', path.join(OUT, rel)]); } catch { return null; }
  return rel;
};

// ---------- data ----------
const build = /\bBUILD\s*=\s*['"]([^'"]+)['"]/.exec(rd('js/build.ts'))?.[1] || '?';
const commit = git('rev-parse', '--short', 'HEAD').trim();
const now = new Date();
const sydney = new Intl.DateTimeFormat('en-AU', { timeZone: 'Australia/Sydney', day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit', timeZoneName: 'short' }).format(now);
const cat = exportManagementCatalogue();
const games = cat.entries.filter(e => e.kind === 'game' && e.coverage.implementation);
const stories = cat.entries.filter(e => e.kind === 'story');
const CATALOG = await load('js/games/catalog.ts');
const iconOf = new Map<string, string>((CATALOG.GAME_CATALOG || []).map((g: any) => [g.id, g.icon]));
const ACT = await load('js/content/activities.ts');
const areaName = new Map<string, P>((ACT.AREAS || []).map((a: any) => [a.key, pair(a.name)]));
const areaIcon = new Map<string, string>((ACT.AREAS || []).map((a: any) => [a.key, a.icon]));
areaName.set('reading', { en: 'Reading', vi: 'Tập đọc' });
const HOWR = await load('js/howto-registry.ts'); await load('js/howto-data.ts'); await load('js/howto-data2.ts');
const HOWTO: Record<string, any> = HOWR.HOWTO || {};
const FILMS = await load('js/content/films.ts');
const TALEF = await load('js/content/talefilms.ts');
const FEST = await load('js/content/festcal.ts');
const REL = await load('js/content/releases.ts');
const MAP = await load('js/content/map.ts');
const STK = await load('js/content/stickers.ts');
const CH = await load('js/content/chapters.ts');
const COMP = await load('js/content/companions.ts');
const ADV = await load('js/content/adventures.ts');
const JOBS = await load('js/content/jobs.ts');
const SHOP = await load('js/content/shop.ts');
const VIL = await load('js/content/villagerlines.ts');
const RULES = await load('js/content/rules.ts');
const NOTI = await load('js/content/notify.ts');
const SECOND = await load('js/content/secondset.ts');
console.warn = quietWarn;
let custom: any = {}; try { custom = JSON.parse(rd('content/custom.json')); } catch { }
const stickers: any[] = STK.STICKERS || [];
const placeName = (id: string): P => { const s = stickers.find(x => x.id === 'place_' + id); if (s) return pair(s); const p = (MAP.PLACES || []).find((x: any) => x.id === id); return p?.name ? pair(p.name) : { en: id, vi: id }; };
const festivals: any[] = FEST.FESTCAL || [];
const releases: any[] = REL.RELEASES || [];

// ---------- docs ----------
const claude = rd('CLAUDE.md');
type Decision = { date: string; sort: string; text: string; src: string };
const MONTHS: Record<string, number> = { sep: 9, oct: 10, nov: 11, dec: 12, jan: 1, feb: 2 };
const dateOf = (s: string): [string, string] | null => {
  const m = /(\d{1,2})\s*(Sep|Oct|Nov|Dec|Jan|Feb)[a-z]*\.?\s*(20\d\d)?/i.exec(s); if (!m) return null;
  const mo = MONTHS[m[2].slice(0, 3).toLowerCase()], y = m[3] ? +m[3] : mo <= 2 ? 2027 : 2026;
  return [`${+m[1]} ${m[2].slice(0, 3)} ${y}`, `${y}-${String(mo).padStart(2, '0')}-${m[1].padStart(2, '0')}`];
};
const decisions: Decision[] = [];
{
  const seen = new Set<string>();
  const files = ['docs/cores/release.md', ...fs.readdirSync(path.join(ROOT, 'docs/cores')).filter(f => f.endsWith('.md') && f !== 'release.md').map(f => 'docs/cores/' + f)];
  for (const f of files) {
    let inside = false, headDate: [string, string] | null = null, cur: string[] = [];
    const flush = () => {
      const text = cur.join(' ').replace(/\s+/g, ' ').trim(); cur = [];
      if (!inside || text.length < 25) return;
      const d = dateOf(text) || headDate; if (!d) return;
      const key = text.slice(0, 160); if (seen.has(key)) return; seen.add(key);
      decisions.push({ date: d[0], sort: d[1], text, src: f });
    };
    for (const line of rd(f).split('\n')) {
      const h = /^#{1,4}\s+(.*)/.exec(line);
      if (h) { flush(); inside = /owner/i.test(h[1]) && /decision|direction|addition/i.test(h[1]); headDate = dateOf(h[1]); continue; }
      if (/^\s*[-*]\s+/.test(line) && !/^\s{2,}/.test(line)) { flush(); cur.push(line.replace(/^\s*[-*]\s+/, '')); }
      else if (!line.trim()) flush();
      else cur.push(line.trim().replace(/^[-*]\s+/, '- '));
    }
    flush();
  }
  decisions.sort((a, b) => b.sort.localeCompare(a.sort));
}
// the bold-led standing rules in CLAUDE.md
const claudeRules = claude.split(/\n\s*\n/).map(b => b.trim()).filter(b => /^\*\*[^*]+\*\*/.test(b) && !/^\*\*Owner-approved UI/.test(b))
  .map(b => { const m = /^\*\*([^*]+)\*\*\s*([\s\S]*)/.exec(b)!; return { title: m[1].replace(/[:.]$/, ''), body: m[2].replace(/\n/g, ' ') }; });
const uxRules = rd('docs/SO-TAY-THIET-KE.md').split('\n').filter(l => /^- \*\*UX-0\d\d/.test(l)).map(l => l.slice(2));
const planDocs = fs.readdirSync(path.join(ROOT, 'docs/plans')).filter(f => f.endsWith('.md')).map(f => {
  const t = rd('docs/plans/' + f); const title = /^#\s+(.*)/m.exec(t)?.[1] || f;
  const first = t.split(/\n\s*\n/).map(x => x.trim()).find(x => x && !x.startsWith('#')) || '';
  return { f, title, first: first.replace(/\n/g, ' ').slice(0, 420) };
});
const story = rd('docs/cores/STORY.md');
const storyRows = story.split('\n').filter(l => /^\|\s*(Prologue|\d|Finale)/.test(l)).map(l => l.split('|').slice(1, -1).map(c => c.trim()));
const storyChanged = story.split('\n').filter(l => /^- \*\*(Chapter|The Finale|Season)/.test(l)).map(l => l.slice(2));
const mainLog = (git('log', 'origin/main', '--format=%ad\t%s', '--date=format:%Y-%m-%d') || git('log', 'main', '--format=%ad\t%s', '--date=format:%Y-%m-%d'))
  .split('\n').map(l => l.split('\t')).filter(([, s]) => s && /^(v\d\.\d\d|r\d\d(\.\d)?)\b[^:]*:/.test(s) && /\(#\d+\)|yes, deploy\)/.test(s))
  .filter(([, s], i, a) => a.findIndex(([, t]) => t.split(':')[0] === s.split(':')[0]) === i);

// ---------- the page ----------
type Section = { id: string; title: P; html: string };
const sections: Section[] = [];
const add = (id: string, en: string, vi: string, html: string) => sections.push({ id, title: { en, vi }, html });
const item = (search: string, html: string, cls = '') => `<div class="it ${cls}"${S(search)}>${html}</div>`;
const chip = (p: P | string) => `<span class="chip">${L(p)}</span>`;
const note = (en: string, vi: string) => `<p class="note">${LM(en, vi)}</p>`;
const ages = (a?: number) => a === undefined ? '' : a <= 2 ? L('All ages (2+)', 'Mọi tuổi (2+)') : a >= 5 ? L('Big kids (5 to 8)', 'Bé lớn (5 đến 8 tuổi)') : L(`From ${a}`, `Từ ${a} tuổi`);
const hard = (d?: number) => d === 1 ? L('Easy', 'Dễ') : d === 2 ? L('A bit harder', 'Khó hơn chút') : d === 3 ? L('Hardest', 'Khó nhất') : '';

// 1. Overview
{
  const places: any[] = MAP.PLACES || [];
  const cities = places.filter(p => p.kind === 'city');
  const nums: [number, string, string][] = [
    [games.length, 'games', 'trò chơi'], [stories.length, 'stories', 'truyện'], [festivals.length, 'festivals', 'lễ hội'], [cities.length, 'cities', 'thành phố'],
    [places.length, 'places on the map', 'địa điểm trên bản đồ'], [stickers.length, 'stickers', 'hình dán'], [(SHOP.CLOTHES || []).length, 'clothes in the shop', 'món đồ trong cửa hàng'],
    [(ADV.ADVENTURES || []).length, 'daily adventures', 'chuyến phiêu lưu hằng ngày'], [releases.length, 'Studio switches', 'công tắc Studio'], [Object.keys(HOWTO).length, 'how-to guides', 'hướng dẫn chơi'],
    [Number(ART.ART_COUNT?.() || 0), 'drawings of our own', 'hình vẽ của riêng mình']];
  add('overview', 'Overview', 'Tổng quan', `
    <div class="lede">${LM(
      'Sparkle Valley is a 3D valley where children aged 2 to 8 play, learn and explore the two homes of their family: **Vietnam and Australia**, with a China Town and an India Village beside them. Everything a child sees and hears is in **English and Vietnamese**. One child plays alone, two play side by side on one screen, or a family plays together online.',
      'Thung Lũng Lấp Lánh là một thung lũng 3D nơi các bé từ 2 đến 8 tuổi chơi, học và khám phá hai quê hương của gia đình: **Việt Nam và nước Úc**, cùng Phố Người Hoa và Làng Ấn Độ bên cạnh. Mọi thứ bé thấy và nghe đều có **tiếng Việt và tiếng Anh**. Một bé chơi một mình, hai bé chơi chung một màn hình, hoặc cả nhà chơi cùng nhau qua mạng.')}</div>
    ${item('version ' + build, `<p class="kv"><b>${L('Version', 'Phiên bản')}</b> ${esc(build)} · <b>${L('Made from commit', 'Tạo từ commit')}</b> <code>${esc(commit)}</code> · <b>${L('Made', 'Ngày tạo')}</b> ${esc(sydney)}</p>`)}
    <div class="nums">${nums.map(([n, en, vi]) => `<div class="num it"${S(en, vi)}><b>${n}</b><span>${L(en, vi)}</span></div>`).join('')}</div>
    ${item('ages under 5 big kids', `<h3>${L('Two age groups', 'Hai nhóm tuổi')}</h3><p>${LM(
      '**Little ones (under 5)** start on the Simple screen with big pictures, spoken guides and no reading; touch targets are 64 px or more. **Big kids (5 to 8)** get the whole valley, harder levels, quests, the shop and collections; touch targets are 44 px or more.',
      '**Bé nhỏ (dưới 5 tuổi)** bắt đầu ở màn hình Đơn giản với hình to, lời hướng dẫn đọc to và không cần biết chữ; nút bấm từ 64 px. **Bé lớn (5 đến 8 tuổi)** có cả thung lũng, cấp độ khó hơn, nhiệm vụ, cửa hàng và bộ sưu tập; nút bấm từ 44 px.')}</p>`)}`);
}

// 2. Owner's rules
{
  const named: [string, string, string, string][] = [
    ['deploy', 'Nothing reaches main (and Netlify) until the owner has checked the round and said **"yes, deploy"**. Release asks once per round.', 'Không gì lên `main` (và Netlify) cho tới khi chủ dự án xem vòng làm việc và nói rõ **"yes, deploy"**. Release hỏi một lần mỗi vòng.', 'CLAUDE.md'],
    ['one screen', 'Every game and child screen fits on **one screen with no scrolling**, on phone, tablet and computer. Answers sit side by side on wide screens; level and stars share the title row.', 'Mọi trò chơi và màn hình của bé nằm gọn **trên một màn hình, không cuộn**, trên điện thoại, máy tính bảng và máy tính. Màn rộng thì đáp án nằm cạnh nhau; cấp độ và sao chung hàng với tiêu đề.', 'CLAUDE.md'],
    ['two languages', 'English and Vietnamese for everything a child sees or hears.', 'Tiếng Anh và tiếng Việt cho mọi thứ bé thấy và nghe.', 'CLAUDE.md'],
    ['own art', 'Every picture is **our own drawing** in `js/art.ts`, never a phone emoji, on screen and on canvases. A new picture gets a new drawing.', 'Mọi hình là **hình tự vẽ** trong `js/art.ts`, không bao giờ dùng emoji của điện thoại. Hình mới thì vẽ mới.', 'CLAUDE.md'],
    ['touch size', 'Touch targets 44 px or more, **64 px for under-5s**.', 'Nút bấm từ 44 px, **64 px cho bé dưới 5 tuổi**.', 'CLAUDE.md, UX-003'],
    ['female voices', 'The English and Vietnamese voices are **female** (Natasha, Hoài My). Male voices and the Lê Minh pack are kept aside in `voices-aside/`, not published; Chinese and Hindi keep their male voices.', 'Giọng tiếng Anh và tiếng Việt là **giọng nữ** (Natasha, Hoài My). Giọng nam và gói Lê Minh được cất riêng trong `voices-aside/`, không phát hành; tiếng Trung và tiếng Hindi giữ giọng nam.', 'release.md, 3 Nov 2026'],
    ['TypeScript', 'All game, Studio, server, service worker and tool code is **TypeScript**.', 'Toàn bộ mã game, Studio, máy chủ, service worker và công cụ viết bằng **TypeScript**.', 'release.md, 3 Nov 2026'],
    ['Sydney time', 'Times and dates are in **Sydney time** (AEDT in summer, AEST otherwise), converted from UTC before quoting.', 'Giờ và ngày theo **giờ Sydney** (AEDT mùa hè, AEST các tháng khác), đổi từ UTC trước khi ghi.', 'CLAUDE.md'],
    ['pop-up questions', 'Questions to the owner are always **pop-up questions** with 2 to 4 choices, the recommended one first. No answer in 15 minutes: carry on with the recommended choice, except deploy, version, children\'s data, keys and payments.', 'Câu hỏi cho chủ dự án luôn là **câu hỏi bật lên** với 2 đến 4 lựa chọn, lựa chọn khuyên dùng đứng đầu. Sau 15 phút không trả lời: làm theo lựa chọn khuyên dùng, trừ deploy, số phiên bản, dữ liệu của bé, khoá và thanh toán.', 'CLAUDE.md']];
  add('rules', "The owner's rules", 'Quy tắc của chủ dự án', `
    <div class="rules">${named.map(([k, en, vi, src]) => item(k + ' ' + en + ' ' + vi, `<h3>${esc(k)}</h3><p>${LM(en, vi)}</p><p class="src">${esc(src)}</p>`, 'rule')).join('')}</div>
    <h3 class="sub">${L('Every standing rule in CLAUDE.md', 'Mọi quy tắc thường trực trong CLAUDE.md')}</h3>
    ${note('Quoted as written in CLAUDE.md (English).', 'Trích nguyên văn từ CLAUDE.md (tiếng Anh).')}
    ${claudeRules.map(r => item(r.title + ' ' + r.body, `<details><summary>${md(r.title)}</summary><p>${md(r.body)}</p></details>`)).join('')}
    <h3 class="sub">${L('Interface rules UX-001 to UX-010', 'Quy tắc giao diện UX-001 đến UX-010')}</h3>
    ${uxRules.map(r => item(r, `<p>${md(r)}</p>`)).join('')}
    <h3 class="sub">${L('Rules the checks enforce', 'Quy tắc được kiểm tra tự động')} (js/content/rules.ts)</h3>
    <div class="tbl"><table><thead><tr><th>ID</th><th>${L('Weight', 'Mức')}</th><th>${L('Rule', 'Quy tắc')}</th><th>${L('Check', 'Kiểm tra')}</th></tr></thead><tbody>
    ${Object.entries(RULES.RULES || {}).map(([id, r]: [string, any]) => `<tr class="it"${S(id, r.text, r.check)}><td><code>${esc(id)}</code></td><td>${esc(r.severity)}</td><td>${md(r.text)}</td><td>${esc(r.check || '')}</td></tr>`).join('')}
    </tbody></table></div>`);
}

// 3. Decision log
add('decisions', 'Decision log', 'Nhật ký quyết định', `
  ${note(`${decisions.length} decisions the owner made, newest first, collected from the "Owner's decisions" parts of docs/cores/. Quoted as written (mostly English).`,
    `${decisions.length} quyết định của chủ dự án, mới nhất trước, gom từ các mục "Owner's decisions" trong docs/cores/. Trích nguyên văn (phần lớn bằng tiếng Anh).`)}
  <ol class="log">${decisions.map(d => `<li class="it"${S(d.date, d.text, d.src)}><time>${esc(d.date)}</time><div><p>${md(d.text)}</p><p class="src">${esc(d.src)}</p></div></li>`).join('')}</ol>`);

// 4. World
{
  const places: any[] = MAP.PLACES || [];
  const KIND: Record<string, P> = { city: { en: 'City', vi: 'Thành phố' }, village: { en: 'Village', vi: 'Làng' }, site: { en: 'Site', vi: 'Địa điểm' }, street: { en: 'Street', vi: 'Phố' }, island: { en: 'Island', vi: 'Đảo' } };
  const CC: Record<string, P> = { vn: { en: 'Vietnam', vi: 'Việt Nam' }, au: { en: 'Australia', vi: 'Nước Úc' }, home: { en: 'Home island', vi: 'Đảo nhà' }, cn: { en: 'China Town', vi: 'Phố Người Hoa' }, in: { en: 'India Village', vi: 'Làng Ấn Độ' }, asia: { en: 'Asia', vi: 'Châu Á' } };
  const lm = Object.entries(MAP.LANDMARK_AT || {}) as [string, any][];
  const lmName = (id: string): P => { const s = stickers.find(x => x.id === id || x.id === 'lm_' + id || x.id === 'landmark_' + id); return s ? pair(s) : { en: id, vi: id }; };
  const vehicles = releases.filter(r => r.group === 'world');
  const mapShot = pic('docs/launch-2027/shots/map-vi.jpg', 'then', 'map-v107', 520);
  add('world', 'The world', 'Thế giới', `
    ${mapShot ? `<figure class="it"${S('map ban do')}><img src="${mapShot}" alt="" loading="lazy" width="360" height="640"><figcaption>${L('The map on the pad (v1.07, 2 Nov 2026)', 'Bản đồ trên máy tính bảng của bé (v1.07, 2/11/2026)')}</figcaption></figure>` : ''}
    <p>${LM(`The map (version ${MAP.MAP_VERSION ?? '?'}) has ${places.length} places in groups: the home island, Vietnam, Australia, China Town and India Village. Heights (h) are the ground height in metres of the game's world; rivers, bridges and ferries join them.`,
      `Bản đồ (phiên bản ${MAP.MAP_VERSION ?? '?'}) có ${places.length} địa điểm theo nhóm: đảo nhà, Việt Nam, nước Úc, Phố Người Hoa và Làng Ấn Độ. Độ cao (h) là độ cao mặt đất tính bằng mét trong thế giới game; sông, cầu và phà nối các nơi với nhau.`)}</p>
    <div class="tbl"><table><thead><tr><th>${L('Place', 'Địa điểm')}</th><th>${L('Kind', 'Loại')}</th><th>${L('Region', 'Vùng')}</th><th>${L('Height', 'Độ cao')}</th><th>${L('Landmarks', 'Công trình')}</th></tr></thead><tbody>
    ${places.map(p => { const n = placeName(p.id), marks = lm.filter(([, v]) => v.place === p.id).map(([k]) => lmName(k)); return `<tr class="it"${S(p.id, n, ...marks)}><td>${art(p.icon, 'sm')} ${L(n)}</td><td>${L(KIND[p.kind] || p.kind)}</td><td>${L(CC[p.cc] || p.cc)}</td><td class="n">${p.h ?? ''}</td><td>${marks.map(m => L(m)).join(', ')}</td></tr>`; }).join('')}
    </tbody></table></div>
    <h3 class="sub">${L('Vehicles and the road world', 'Xe cộ và đường sá')}</h3>
    <ul class="list">${vehicles.map(v => `<li class="it"${S(v.id, v)}>${L(pair(v))} ${v.def ? chip({ en: 'on', vi: 'bật' }) : chip({ en: 'off', vi: 'tắt' })}</li>`).join('')}</ul>
    <p class="src">js/content/map.ts · js/content/releases.ts</p>`);
}

// 5. Characters
{
  const LUMI = 'origin/work/v108-lumi-refine';
  const friends: [string, string, string, P][] = [
    ['finn', 'Finn', 'Finn', { en: 'The boy friend. Existing boy players become Finn (owner, 3 Nov 2026).', vi: 'Bạn trai. Người chơi là bé trai sẽ thành Finn (chủ dự án, 3/11/2026).' }],
    ['clara', 'Clara', 'Clara', { en: 'The girl friend, called Flora in the concept pictures; named Clara everywhere from 3 Nov 2026.', vi: 'Bạn gái, trong tranh ý tưởng tên là Flora; từ 3/11/2026 gọi là Clara ở mọi nơi.' }],
    ['sol', 'Sol', 'Sol', { en: 'A friend from the concept pictures of the four adventurers.', vi: 'Một người bạn trong tranh ý tưởng bốn nhà thám hiểm.' }],
    ['lumi', 'Lumi', 'Lumi', { en: 'A friend from the concept pictures; her front view was refined in v1.08.', vi: 'Một người bạn trong tranh ý tưởng; dáng nhìn thẳng được làm lại ở v1.08.' }]];
  const cast = friends.map(([id, en, , about]) => {
    const pics = ['front', 'three-quarter', 'face-happy'].map(v => pic(`${LUMI}:docs/artifacts/sparkle-valley-characters/img/${id}-${v}.jpg`, 'cast', `${id}-${v}`, 360)).filter(Boolean) as string[];
    return item(en + ' ' + about.en + ' ' + about.vi, `<h3>${esc(en)}</h3><div class="strip">${pics.map(p => `<img src="${p}" alt="${esc(en)}" loading="lazy" width="160" height="200">`).join('')}</div><p>${L(about)}</p>`, 'friend');
  }).join('');
  const people = ['vn-grandma', 'vn-grandpa', 'vn-farmer', 'vn-vendor', 'vn-aodai', 'vn-schoolgirl', 'au-grandma', 'au-grandpa', 'au-mum', 'au-dad', 'au-girl', 'au-boy']
    .map(id => [id, pic(`${LUMI}:docs/artifacts/sparkle-valley-characters/img/${id}-full.jpg`, 'cast', id, 240)] as const).filter(([, p]) => p);
  const givers = Object.entries(ADV.GIVERS || {}) as [string, any][];
  const jobs = VIL.VILLAGER_JOBS || {};
  const comps = Object.entries(COMP.COMPANIONS || {}) as [string, any][];
  add('characters', 'Characters', 'Nhân vật', `
    <h3 class="sub">${L('The four friends', 'Bốn người bạn')}</h3>
    ${note('Gallery pictures from docs/artifacts/sparkle-valley-characters/ on the branch work/v108-lumi-refine (v1.08 renders). In v1.09 the friends replace today\'s player characters.', 'Hình từ docs/artifacts/sparkle-valley-characters/ trên nhánh work/v108-lumi-refine (bản dựng v1.08). Ở v1.09 các bạn này thay cho nhân vật người chơi hiện nay.')}
    <div class="grid2">${cast}</div>
    <h3 class="sub">${L('Villagers of the two homes', 'Dân làng hai quê')}</h3>
    <div class="strip wrap">${people.map(([id, p]) => `<figure class="it mini"${S(id)}><img src="${p}" alt="" loading="lazy" width="96" height="160"><figcaption>${esc(id.replace(/^(vn|au)-/, (m) => m === 'vn-' ? 'VN · ' : 'AU · '))}</figcaption></figure>`).join('')}</div>
    <h3 class="sub">${L('Named villagers (quest givers)', 'Dân làng có tên (người giao nhiệm vụ)')}</h3>
    <div class="cards">${givers.map(([id, g]) => item(id + ' ' + g.en + ' ' + g.vi, `${art(g.icon)}<b>${L(pair(g))}</b>`, 'card')).join('')}</div>
    <h3 class="sub">${L('Villager jobs', 'Nghề của dân làng')}</h3>
    ${Object.entries(jobs).map(([cc, list]: [string, any]) => item(cc + ' ' + list.map((j: any) => j[1] + ' ' + j[2]).join(' '), `<p><b>${esc(cc.toUpperCase())}</b> ${list.map((j: any) => `${art(j[0], 'sm')}${L(j[1], j[2])}`).join(' · ')}</p>`)).join('')}
    <h3 class="sub">${L('Companions and animals', 'Bạn đồng hành và con vật')}</h3>
    <div class="cards">${comps.map(([id, c]) => item(id + ' ' + c.en + ' ' + c.vi, `${art(c.icon)}<b>${L(pair(c))}</b><span class="muted">${L('companion: fed once a day, learns tricks, wears hats', 'bạn đồng hành: cho ăn mỗi ngày, học trò mới, đội mũ')}</span>`, 'card')).join('')}</div>
    <p>${L('Animal stickers a child can meet:', 'Con vật bé có thể gặp và sưu tập:')} ${stickers.filter(s => s.theme === 'farm' || s.theme === 'wild').map(s => `<span class="it tag"${S(s)}>${art(s.icon, 'sm')}${L(pair(s))}</span>`).join(' ')}</p>
    <p class="src">js/content/adventures.ts GIVERS · js/content/villagerlines.ts · js/content/companions.ts · js/content/stickers.ts</p>`);
}

// 6. Games
{
  const guides = FILMS.GUIDES || {};
  const byArea = new Map<string, typeof games>();
  for (const g of games) { if (!byArea.has(g.area)) byArea.set(g.area, []); byArea.get(g.area)!.push(g); }
  const levels = LM('Every game has four levels. **Easy** plays levels 1 to 2, **Medium** 2 to 3, **Hard** 4 to 5, and **Talent** level 5 with the game\'s own extra challenge; wins move a child up inside the band. Grown-ups set the level per child, and a child can pick one inside a game.',
    'Mỗi trò chơi có bốn mức. **Dễ** chơi cấp 1 đến 2, **Vừa** cấp 2 đến 3, **Khó** cấp 4 đến 5, và **Tài năng** cấp 5 với thử thách riêng của trò chơi; thắng thì bé lên cấp trong mức đó. Người lớn chọn mức cho từng bé, và bé có thể tự chọn trong trò chơi.');
  const one = (g: (typeof games)[number]) => {
    const h = HOWTO[g.id], steps: any[] = h?.steps || [];
    const film = guides[g.id] ? L('3D guide film', 'Phim hướng dẫn 3D') : h ? L('Picture guide', 'Hướng dẫn bằng hình') : L('No guide yet', 'Chưa có hướng dẫn');
    const tags = [ages(g.ageMin), hard(g.difficulty), g.online ? L('Plays online', 'Chơi qua mạng') : '', g.unlock.secondSet ? L('Second set: opens after 3 finishes of the first games', 'Bộ thứ hai: mở sau khi xong 3 lần các trò đầu') : ''].filter(Boolean);
    return `<details class="it game"${S(g.id, g.name, areaName.get(g.area), h?.origin, ...steps.map(s => pair(s)))}><summary>${art(iconOf.get(g.id))}<span class="gname">${L(g.name)}</span><span class="muted">${tags[0] || ''}</span></summary>
      <div class="gbody"><p class="tags">${tags.map(t => `<span class="chip">${t}</span>`).join('')}<span class="chip">${film}</span></p>
      ${h?.origin ? `<p class="origin">${L(pair(h.origin))}</p>` : ''}
      ${steps.length ? `<ol class="steps">${steps.filter(s => !s.title).map(s => `<li>${L(pair(s))}</li>`).join('')}</ol>` : ''}
      ${h?.real ? `<p class="muted">${L({ en: 'In real life: ', vi: 'Ngoài đời: ' })}${L(pair(h.real))}</p>` : ''}
      <p class="src">${L('Area', 'Khu')}: ${L(areaName.get(g.area) || g.area)} · id <code>${esc(g.id)}</code></p></div></details>`;
  };
  add('games', 'Games', 'Trò chơi', `
    <p>${LM(`${games.length} games in ${byArea.size} areas. Each area is a part of the valley and a shelf on the Simple screen; Studio can move a game, hide it or open it to under-5s.`, `${games.length} trò chơi trong ${byArea.size} khu. Mỗi khu là một nơi trong thung lũng và một kệ trên màn hình Đơn giản; Studio có thể chuyển, ẩn hoặc mở trò chơi cho bé dưới 5 tuổi.`)}</p>
    ${item('levels easy medium hard talent', `<p class="callout">${levels}</p>`)}
    ${[...byArea.entries()].map(([a, list]) => `<div class="group"><h3 class="sub">${art(areaIcon.get(a), 'sm')} ${L(areaName.get(a) || { en: a, vi: a })} <span class="muted">${list.length}</span></h3>${list.map(one).join('')}</div>`).join('')}
    <p class="src">content/management-catalogue.json (tools/export-management-catalogue.mts) · js/howto-data*.ts · js/content/films.ts · js/main.ts (levels) · docs/levels/README.md</p>`);
}

// 7. Stories and films
{
  const films = TALEF.TALE_FILMS || {};
  const SHELF: Record<string, P> = { '🇻🇳': { en: 'Vietnamese tales', vi: 'Truyện Việt Nam' }, '🇦🇺': { en: 'Australian tales', vi: 'Truyện nước Úc' }, '💛': { en: 'Family and feelings', vi: 'Gia đình và cảm xúc' }, '🇨🇳': { en: 'Chinese tales', vi: 'Truyện Trung Hoa' }, '🇮🇳': { en: 'Indian tales', vi: 'Truyện Ấn Độ' }, '🌍': { en: 'World tales', vi: 'Truyện thế giới' } };
  const shelves = new Map<string, typeof stories>();
  for (const s of stories) { if (!shelves.has(s.area)) shelves.set(s.area, []); shelves.get(s.area)!.push(s); }
  const chapters: any[] = CH.CHAPTERS || [];
  const first = stories.filter(s => !s.unlock.secondSet).length;
  add('stories', 'Stories and films', 'Truyện và phim', `
    <p>${LM(`${stories.length} stories: ${first} in the first set and ${stories.length - first} in the second set (they open after the shelf's first stories are finished 3 times, when Studio's "New stories" is on). ${Object.keys(films).length} tales are also 3D films.`,
      `${stories.length} truyện: ${first} truyện bộ đầu và ${stories.length - first} truyện bộ thứ hai (mở sau khi xong 3 lần các truyện đầu của kệ, khi Studio bật "Truyện mới"). ${Object.keys(films).length} truyện có phim 3D.`)}</p>
    ${[...shelves.entries()].map(([k, list]) => `<div class="group"><h3 class="sub">${art(k, 'sm')} ${L(SHELF[k] || { en: k, vi: k })} <span class="muted">${list.length}</span></h3><ul class="list cols">${list.map(s => `<li class="it"${S(s.id, s.name)}>${L(s.name)}${films[s.id] ? ' ' + chip({ en: 'film', vi: 'phim' }) : ''}${s.unlock.secondSet ? ' ' + chip({ en: 'set 2', vi: 'bộ 2' }) : ''}</li>`).join('')}</ul></div>`).join('')}
    <h3 class="sub">${L('The lantern story', 'Truyện đèn lồng')}</h3>
    ${item('lantern story den long', `<p>${LM('The night before the great lantern festival, the wind blows the valley\'s magic lanterns away across Vietnam and Australia. Ông Cú asks the child and their companion to bring them home, one region per chapter: arrive, help, play, hear a tale, find the lantern, then a festival night when a landmark lights up.',
      'Đêm trước lễ hội đèn lồng lớn, gió thổi bay những chiếc đèn lồng thần kỳ của thung lũng qua Việt Nam và nước Úc. Ông Cú nhờ bé và bạn đồng hành mang đèn về, mỗi chương một vùng: đến nơi, giúp đỡ, chơi, nghe truyện, tìm đèn, rồi một đêm hội khi một công trình sáng đèn.')}</p>`)}
    ${chapters.map(c => item(c.id + ' ' + c.en + ' ' + c.vi, `<details><summary><b>${L(pair(c))}</b> <span class="muted">${(c.steps || []).length} ${L('steps', 'bước')}</span></summary><ol class="steps">${(c.steps || []).map((s: any) => `<li>${L(pair(s))}</li>`).join('')}</ol></details>`)).join('')}
    <div class="tbl"><table><thead><tr><th>${L('Chapter', 'Chương')}</th><th>${L('Region', 'Vùng')}</th><th>${L('Lantern found by', 'Tìm đèn nhờ')}</th><th>${L('Landmark', 'Công trình')}</th><th>${L('Festival night', 'Đêm hội')}</th><th>${L('Release', 'Ra mắt')}</th></tr></thead><tbody>
    ${storyRows.map(r => `<tr class="it"${S(r.join(' '))}>${r.map(c => `<td>${md(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>
    ${note('The table is the original plan of 9 Oct 2026. Changed by the owner on 3 Nov 2026 for v1.09:', 'Bảng là kế hoạch ban đầu ngày 9/10/2026. Chủ dự án đổi ngày 3/11/2026 cho v1.09:')}
    <ul class="list">${storyChanged.map(l => `<li class="it"${S(l)}>${md(l)}</li>`).join('')}</ul>
    <h3 class="sub">${L('The period-costume rule', 'Quy tắc trang phục xưa')}</h3>
    ${item('costume period trang phuc', `<p class="callout">${LM('In fairy and folk tales, people wear the clothes of the tale\'s own time. A costume kit makes each period outfit and hairstyle once, in Blender, for every tale that needs it, and a `talecostume` check keeps modern outfits and the four friends out of folk-tale pages (plan `docs/plans/games-one-home-and-films.md`, v1.09).',
      'Trong truyện cổ tích và truyện dân gian, nhân vật mặc trang phục của thời đó. Một bộ trang phục làm mỗi bộ đồ và kiểu tóc xưa một lần bằng Blender, dùng cho mọi truyện cần, và bài kiểm tra `talecostume` không cho đồ hiện đại hay bốn người bạn xuất hiện trong trang truyện dân gian (kế hoạch `docs/plans/games-one-home-and-films.md`, v1.09).')}</p>`)}
    <p class="src">js/talesdata.ts · js/learn.ts · js/content/talefilms.ts · js/content/chapters.ts · docs/cores/STORY.md</p>`);
}

// 8. Quests, festivals and the calendar
{
  const whenOf = (w: any): P => !w ? { en: '', vi: '' } : w.lunar ? { en: `Lunar ${w.lunar[0]}/${w.lunar[1]}`, vi: `Âm lịch ${w.lunar[0]}/${w.lunar[1]}` } : w.date ? { en: `${w.date[1]}/${w.date[0]}`, vi: `${w.date[1]}/${w.date[0]}` }
    : 'easter' in w ? { en: 'Easter' + (w.easter ? ` ${w.easter > 0 ? '+' : ''}${w.easter} days` : ''), vi: 'Lễ Phục Sinh' + (w.easter ? ` ${w.easter > 0 ? '+' : ''}${w.easter} ngày` : '') }
    : w.nth ? { en: `Weekday ${w.nth[1]}, week ${w.nth[2]} of month ${w.nth[0]}`, vi: `Thứ ${w.nth[1] + 1}, tuần ${w.nth[2]} của tháng ${w.nth[0]}` } : w.table ? { en: 'Hindu calendar (table)', vi: 'Lịch Hindu (bảng)' } : { en: JSON.stringify(w), vi: JSON.stringify(w) };
  const groups = FEST.GROUPS || {};
  const rel = Object.entries(custom.releases || {}) as [string, any][];
  const relName = (id: string): P => { const r = releases.find(x => x.id === id); return r ? pair(r) : { en: id, vi: id }; };
  const adv: any[] = ADV.ADVENTURES || [];
  const kinds: string[] = ADV.STEP_KINDS || [];
  const KINDP: Record<string, P> = { go: { en: 'go somewhere', vi: 'đi đến một nơi' }, find: { en: 'find things', vi: 'tìm đồ' }, give: { en: 'give something', vi: 'trao quà' }, talk: { en: 'talk to someone', vi: 'nói chuyện' }, play: { en: 'play a game', vi: 'chơi một trò' }, cook: { en: 'cook a dish', vi: 'nấu một món' } };
  const slots: any[] = SHOP.SLOTS || [], clothes: any[] = SHOP.CLOTHES || [];
  const themes: any[] = STK.THEMES || [];
  add('quests', 'Quests, festivals and the calendar', 'Nhiệm vụ, lễ hội và lịch', `
    <h3 class="sub">${L(`The ${festivals.length} festivals`, `${festivals.length} lễ hội`)}</h3>
    ${note('Each festival comes on its real date every year (worked out on the device). A party decorates for 3 weeks before with an evening show on the day; a quiet day of remembering shows only a few days before. Grown-ups can switch any festival off or move it in Studio.', 'Mỗi lễ hội đến đúng ngày thật mỗi năm (máy tự tính). Lễ vui trang trí 3 tuần trước và có chương trình buổi tối ngày lễ; ngày tưởng nhớ chỉ hiện vài ngày trước, nhẹ nhàng. Người lớn có thể tắt hoặc dời ngày lễ trong Studio.')}
    <div class="tbl"><table><thead><tr><th>${L('Festival', 'Lễ hội')}</th><th>${L('Group', 'Nhóm')}</th><th>${L('Date', 'Ngày')}</th><th>${L('Kind', 'Kiểu')}</th><th>${L('Show', 'Biểu diễn')}</th><th>${L('Where', 'Ở đâu')}</th></tr></thead><tbody>
    ${festivals.map(f => `<tr class="it"${S(f.id, f, ...(f.lines || []).map((l: any) => pair(l)))}><td>${art(f.icon, 'sm')} ${L(pair(f))}</td><td>${L(pair(groups[f.group]))}</td><td>${L(whenOf(f.when))}${f.days > 1 ? ` · ${f.days} ${L('days', 'ngày')}` : ''}</td><td>${f.kind === 'quiet' ? L('quiet', 'tưởng nhớ') : L('party', 'lễ vui')}</td><td>${esc(f.show || '')}</td><td>${(f.where || []).map((w: string) => L(placeName(w))).join(', ')}</td></tr>`).join('')}
    </tbody></table></div>
    <h3 class="sub">${L('The release calendar', 'Lịch ra mắt')}</h3>
    ${note('From content/custom.json "releases": the date each feature starts, with its New badge days. One batch every Saturday (AEDT).', 'Từ content/custom.json "releases": ngày mỗi tính năng bắt đầu và số ngày có nhãn Mới. Mỗi thứ Bảy một đợt (AEDT).')}
    <div class="tbl"><table><thead><tr><th>${L('Starts', 'Bắt đầu')}</th><th>${L('What', 'Nội dung')}</th><th>${L('New badge', 'Nhãn Mới')}</th></tr></thead><tbody>
    ${rel.filter(([, r]) => r && typeof r === 'object' && r.start).sort((a, b) => String(a[1].start).localeCompare(String(b[1].start))).map(([id, r]) => `<tr class="it"${S(id, relName(id), r.start)}><td class="n">${esc(r.start)}</td><td>${L(relName(id))}</td><td class="n">${r.newDays ?? ''}</td></tr>`).join('')}
    </tbody></table></div>
    <h3 class="sub">${L('Quests', 'Nhiệm vụ')}</h3>
    ${item('quest adventure ' + kinds.join(' '), `<p>${LM(`**${adv.length} daily adventures** from the villagers; each is a few steps of these kinds:`, `**${adv.length} chuyến phiêu lưu hằng ngày** do dân làng giao; mỗi chuyến gồm vài bước thuộc các loại:`)} ${kinds.map(k => chip(KINDP[k] || k)).join(' ')}</p>`)}
    ${item('jobs ' + Object.keys(JOBS.JOBS || {}).join(' '), `<p>${LM(`**Job board** jobs in ${Object.keys(JOBS.JOBS || {}).length} places: find something, or deliver something, and learn what the place does.`, `**Bảng việc** ở ${Object.keys(JOBS.JOBS || {}).length} nơi: tìm đồ hoặc giao đồ, và biết nơi đó làm gì.`)}</p>`)}
    ${item('lantern chapters steps', `<p>${LM('**Story quests**: the lantern chapters (above, in Stories).', '**Nhiệm vụ truyện**: các chương truyện đèn lồng (ở phần Truyện).')}</p>`)}
    <ul class="list">${adv.map(a => `<li class="it"${S(a.id, a, (ADV.GIVERS || {})[a.giver])}>${art(a.icon, 'sm')}${L(pair(a))} <span class="muted">${L(pair((ADV.GIVERS || {})[a.giver]))}${a.festival ? ' · ' + esc(a.festival) : ''}</span></li>`).join('')}</ul>
    <h3 class="sub">${L('Rewards, coins, stickers and the shop', 'Phần thưởng, xu, hình dán và cửa hàng')}</h3>
    ${item('coins', `<p>${LM(`Coins come from games, quests and the daily adventure (${ADV.COINS ?? '?'} a step; a full week of adventures gives a week prize). Coins buy clothes in the shop by the market: prices go by tier (small x${SHOP.TIERS?.small}, nice x${SHOP.TIERS?.nice}, special x${SHOP.TIERS?.special}).`,
      `Xu có từ trò chơi, nhiệm vụ và chuyến phiêu lưu hằng ngày (${ADV.COINS ?? '?'} xu một bước; đủ một tuần phiêu lưu được quà tuần). Xu dùng mua quần áo ở cửa hàng cạnh chợ: giá theo hạng (nhỏ x${SHOP.TIERS?.small}, đẹp x${SHOP.TIERS?.nice}, đặc biệt x${SHOP.TIERS?.special}).`)}</p>`)}
    <div class="cards">${slots.map(s => item(s.id + ' ' + s.en + ' ' + s.vi, `${art(s.icon)}<b>${L(pair(s))}</b><span class="muted">${clothes.filter(c => c.slot === s.id).length} ${L('items', 'món')}</span>`, 'card')).join('')}</div>
    ${item('stickers ' + themes.map(t => t.en + ' ' + t.vi).join(' '), `<p>${LM(`**${stickers.length} stickers** in ${themes.length} themes, ${STK.PER_PAGE ?? 9} to a page; a full page gives a golden frame, a new song and a house decoration.`, `**${stickers.length} hình dán** trong ${themes.length} chủ đề, mỗi trang ${STK.PER_PAGE ?? 9} hình; đủ trang được khung vàng, bài hát mới và đồ trang trí nhà.`)}</p><p>${themes.map(t => `${art(t.icon, 'sm')}${L(pair(t))} <span class="muted">${stickers.filter(s => s.theme === t.id).length}</span>`).join(' · ')}</p>`)}
    <p class="src">js/content/festcal.ts · content/custom.json · js/content/adventures.ts · js/content/jobs.ts · js/content/shop.ts · js/content/stickers.ts</p>`);
}

// 9. Grown-ups and Studio
{
  const groups = REL.RELEASE_GROUPS || {};
  const byG = new Map<string, any[]>();
  for (const r of releases) { if (!byG.has(r.group)) byG.set(r.group, []); byG.get(r.group)!.push(r); }
  const kinds: any[] = NOTI.KINDS || [];
  add('grownups', 'Grown-ups and Studio', 'Người lớn và Studio', `
    ${item('grown-ups section', `<p>${LM('**Grown-ups** (behind a grown-up question) holds each child\'s age and level, time limits, language and voices, offline downloads, photos, the family code, backups, reports and notifications. **Sparkle Studio** is the family\'s and the owner\'s control room on the website: content, festivals, releases and reports.',
      'Mục **Người lớn** (sau một câu hỏi dành cho người lớn) có tuổi và mức của từng bé, giới hạn thời gian, ngôn ngữ và giọng đọc, tải ngoại tuyến, ảnh, mã gia đình, sao lưu, báo cáo và thông báo. **Sparkle Studio** là phòng điều khiển của gia đình và chủ dự án trên trang web: nội dung, lễ hội, ra mắt và báo cáo.')}</p>`)}
    <h3 class="sub">${L('Notifications for grown-ups', 'Thông báo cho người lớn')}</h3>
    <ul class="list">${kinds.map(k => `<li class="it"${S(k.id, k, k.hintEn, k.hintVi)}><b>${L(pair(k))}</b> <span class="muted">${L(k.hintEn || '', k.hintVi || '')}</span> ${k.def ? chip({ en: 'on', vi: 'bật' }) : chip({ en: 'off', vi: 'tắt' })}</li>`).join('')}</ul>
    <h3 class="sub">${L(`Studio switches (${releases.length})`, `Công tắc Studio (${releases.length})`)}</h3>
    ${note('Every switch on Studio\'s Releases page, with what it is when Studio never set it. Each festival is a switch too (fest_<id>).', 'Mọi công tắc ở trang Ra mắt của Studio, kèm trạng thái khi Studio chưa đặt. Mỗi lễ hội cũng là một công tắc (fest_<id>).')}
    ${[...byG.entries()].map(([g, list]) => `<details class="group" ${g === 'kids' ? 'open' : ''}><summary><b>${L(pair(groups[g]) .en ? pair(groups[g]) : { en: g, vi: g })}</b> <span class="muted">${list.length}</span></summary><ul class="list">${list.map(r => `<li class="it"${S(r.id, r)}><code>${esc(r.id)}</code> ${L(pair(r))} ${r.def ? chip({ en: 'on', vi: 'bật' }) : chip({ en: 'off', vi: 'tắt' })}</li>`).join('')}</ul></details>`).join('')}
    <p class="src">js/content/releases.ts · js/content/notify.ts · docs/cores/studio.md</p>`);
}

// 10. Voices and offline
{
  let man: any = {}; try { man = JSON.parse(rd('voices/manifest.json')); } catch { }
  const size = (d: string) => { let n = 0; const walk = (p: string) => { for (const e of fs.readdirSync(p, { withFileTypes: true })) { const f = path.join(p, e.name); if (e.isDirectory()) walk(f); else n += fs.statSync(f).size; } }; try { walk(path.join(ROOT, d)); } catch { } return n; };
  const mb = (n: number) => (n / 1048576).toFixed(0) + ' MB';
  const langs = Object.entries(man.voices || {}) as [string, any][];
  const lines = Object.keys(man.lines || {}).length;
  add('voices', 'Voices and offline', 'Giọng đọc và ngoại tuyến', `
    <div class="tbl"><table><thead><tr><th>${L('Language', 'Ngôn ngữ')}</th><th>${L('Voice', 'Giọng')}</th><th>${L('Size in the repo', 'Dung lượng')}</th></tr></thead><tbody>
    ${langs.map(([l, v]) => Object.entries(v).map(([sex, x]: [string, any]) => `<tr class="it"${S(l, x.name)}><td>${esc(l)}</td><td>${esc(x.name)} (${sex === 'f' ? L('female', 'nữ') : L('male', 'nam')})</td><td class="n">${mb(size('voices/' + l))}</td></tr>`).join('')).join('')}
    </tbody></table></div>
    ${item('voice pack lines', `<p>${LM(`${lines} recorded lines (engine: ${man.engine || '?'}, made ${man.made || '?'}). Voice packs download in the background; a child\'s name is never recorded, it is read by the device.`, `${lines} câu đã thu (công cụ: ${man.engine || '?'}, ngày ${man.made || '?'}). Gói giọng tải ngầm; tên của bé không bao giờ được thu sẵn, máy tự đọc.`)}</p>`)}
    ${item('offline light automatic full opus', `<p class="callout">${LM('**Offline levels (planned for v1.09):** Light, Automatic (the default) and Full in Grown-ups, with voices in Opus (MP3 kept for devices that cannot play it). Festival packs download on Wi-Fi a few days before their decorations and are removed after the festival on Light.',
      '**Mức ngoại tuyến (dự kiến v1.09):** Nhẹ, Tự động (mặc định) và Đầy đủ trong mục Người lớn, giọng đọc dạng Opus (giữ MP3 cho máy không phát được). Gói lễ hội tải qua Wi-Fi vài ngày trước khi trang trí và được xoá sau lễ ở mức Nhẹ.')}</p>`)}
    <p class="src">voices/manifest.json · js/voicepack.ts · docs/plans/v109-extras.md</p>`);
}

// 11. The website
{
  const home = rd('home/index.html');
  const nav = [...(/<nav class="quick-nav"[\s\S]*?<\/nav>/.exec(home)?.[0] || '').matchAll(/href="#([^"]+)"[^>]*data-en="([^"]*)"[^>]*data-vi="([^"]*)"/g)];
  const secs = [...home.matchAll(/<section[^>]*id="([^"]+)"[\s\S]{0,600}?<h2[^>]*data-en="([^"]*)"[^>]*data-vi="([^"]*)"/g)];
  const shot = has('docs/handbook/img/now/website-computer.jpg') ? 'img/now/website-computer.jpg' : null;
  add('website', 'The website', 'Trang web', `
    ${item('website rules four destinations', `<p>${LM('The family website (`home/`) uses the game\'s own source, art, fonts, theme and release. It keeps full bilingual detail and **four main destinations**:', 'Trang web gia đình (`home/`) dùng chung mã nguồn, hình vẽ, phông chữ, giao diện và phiên bản với game. Trang có đủ nội dung song ngữ và **bốn điểm đến chính**:')}</p>`)}
    <div class="cards">${nav.map(m => item(m[1] + ' ' + m[2] + ' ' + m[3], `<b>${L(m[2], m[3])}</b><code>#${esc(m[1])}</code>`, 'card')).join('')}</div>
    ${shot ? `<figure><img src="${shot}" alt="" loading="lazy" width="640" height="400"><figcaption>${L(`The website now (${build})`, `Trang web hiện nay (${build})`)}</figcaption></figure>` : ''}
    <h3 class="sub">${L('What it shows', 'Trang web có gì')}</h3>
    <ul class="list">${secs.map(m => `<li class="it"${S(m[1], m[2], m[3])}>${L(m[2], m[3])} <code>#${esc(m[1])}</code></li>`).join('')}</ul>
    <p class="src">home/index.html · docs/website-review-20261023/WEBSITE-RULES.md</p>`);
}

// 12. How we work
{
  const cores = /split into 8 cores, one AI chat per core \(([^)]+)\)/.exec(claude)?.[1].split(/,\s*/) || [];
  const steps: [string, string][] = [
    ['Helpers work on their own branch (`core/<name>` or the branch they were given) and push when their checks pass. Never to `main`.', 'Các trợ lý làm trên nhánh riêng (`core/<tên>` hoặc nhánh được giao) và đẩy lên khi kiểm tra đạt. Không bao giờ lên `main`.'],
    ['Each helper runs `cd tests && node suite.mts --changed` (only the checks for what changed) and writes the result in its core file.', 'Mỗi trợ lý chạy `cd tests && node suite.mts --changed` (chỉ các kiểm tra cho phần đã đổi) và ghi kết quả vào tệp của mình.'],
    ['Release collects every branch marked "ready for Release" on the board and merges them into the release branch.', 'Release gom mọi nhánh ghi "ready for Release" trên bảng và hợp vào nhánh phát hành.'],
    ['The full suite runs on GitHub (`.github/workflows/full-suite.yml`, 8 machines, about 30 minutes). A red check is fixed, never waved through.', 'Bộ kiểm tra đầy đủ chạy trên GitHub (`.github/workflows/full-suite.yml`, 8 máy, khoảng 30 phút). Kiểm tra đỏ thì sửa, không bỏ qua.'],
    ['Locally Release runs only the speed checks, each alone: `node suite.mts --jobs 1 --only perf,battery,startup`, and looks at phone, tablet and computer screenshots.', 'Trên máy, Release chỉ chạy các kiểm tra tốc độ, từng cái một: `node suite.mts --jobs 1 --only perf,battery,startup`, và xem ảnh điện thoại, máy tính bảng, máy tính.'],
    ['Before every "yes, deploy": `node tools/handbook.mts`, commit `docs/handbook/`, republish the Handbook to the same link.', 'Trước mỗi "yes, deploy": chạy `node tools/handbook.mts`, commit `docs/handbook/`, đăng lại Sổ tay vào cùng đường dẫn.'],
    ['Release reports the round (what changed, how tested) and asks one pop-up question: **"yes, deploy"**. That one answer merges into `main`; Netlify builds from it.', 'Release báo cáo vòng (đổi gì, kiểm tra thế nào) và hỏi một câu bật lên: **"yes, deploy"**. Câu trả lời đó hợp vào `main`; Netlify tự dựng từ đó.']];
  add('work', 'How we work', 'Cách làm việc', `
    <h3 class="sub">${L('The cores', 'Các nhóm (core)')}</h3>
    <div class="cards">${cores.map(c => item(c, `<b>${esc(c)}</b>`, 'card')).join('')}</div>
    ${note('One AI chat per core; with no core named, a chat is Release. The GitHub repo is the only shared memory: the board docs/cores/BOARD.md is the status page.', 'Mỗi core một cuộc trò chuyện AI; không nêu core thì là Release. Kho GitHub là bộ nhớ chung duy nhất: bảng docs/cores/BOARD.md là trang trạng thái.')}
    <h3 class="sub">${L('The release steps', 'Các bước phát hành')}</h3>
    <ol class="steps big">${steps.map(([en, vi]) => `<li class="it"${S(en, vi)}>${LM(en, vi)}</li>`).join('')}</ol>
    ${item('bug robot', `<p>${LM('**The bug robot** (`.github/workflows/bug-fixer.yml`) picks up issues labelled `bug` and a core: a small bug is fixed on `bugfix/<core>-<issue>` with a draft pull request; a big bug gets a plan and waits for the owner\'s "go".', '**Rô-bốt sửa lỗi** (`.github/workflows/bug-fixer.yml`) nhận các issue gắn nhãn `bug` và tên core: lỗi nhỏ được sửa trên `bugfix/<core>-<issue>` với pull request nháp; lỗi lớn có kế hoạch và chờ chủ dự án nói "go".')}</p>`)}
    <p class="src">CLAUDE.md · docs/cores/README.md · tests/suite.mts</p>`);
}

// 13. Roadmap
add('roadmap', 'The roadmap', 'Lộ trình', `
  <h3 class="sub">${L('What each version brought', 'Mỗi phiên bản mang gì')}</h3>
  ${note('From the merge messages on main (English).', 'Từ thông điệp hợp nhánh trên main (tiếng Anh).')}
  <ol class="log">${mainLog.map(([d, s]) => `<li class="it"${S(d, s)}><time>${esc(d)}</time><div><p><b>${esc(s.split(':')[0])}</b> ${esc(s.slice(s.indexOf(':') + 1).replace(/\s*\(#\d+\)\s*$/, ''))}</p></div></li>`).join('')}</ol>
  <h3 class="sub">${L(`In progress: ${build === 'v1.07' ? 'v1.08' : 'the next round'}`, `Đang làm: ${build === 'v1.07' ? 'v1.08' : 'vòng tiếp theo'}`)}</h3>
  ${item('v1.08 in progress', `<p>${LM('v1.08 gathers the helpers of 3 to 5 Nov 2026: characters with more life, one-screen layouts and more varied rounds, push notifications, the open bugs, twelve more science experiments, the Aussie voice fix and this Handbook. It ships only after the owner\'s "yes, deploy".', 'v1.08 gom việc của các trợ lý từ 3 đến 5/11/2026: nhân vật có hồn hơn, bố cục một màn hình và lượt chơi đa dạng hơn, thông báo đẩy, các lỗi còn mở, thêm mười hai thí nghiệm khoa học, sửa giọng tiếng Úc và Sổ tay này. Chỉ phát hành sau khi chủ dự án nói "yes, deploy".')}</p>`)}
  <h3 class="sub">${L('Next: the plans', 'Tiếp theo: các kế hoạch')}</h3>
  ${planDocs.map(p => item(p.f + ' ' + p.title + ' ' + p.first, `<details><summary><b>${md(p.title)}</b> <code>${esc(p.f)}</code></summary><p>${md(p.first)}</p></details>`)).join('')}
  <p class="src">git log main · docs/plans/ · docs/cores/STORY.md</p>`);

// Then and now
{
  type Pic = { src: string; date: P };
  const pairs: { key: string; title: P; then: Pic[]; now: Pic[] }[] = [
    { key: 'hanoi', title: { en: 'Hà Nội', vi: 'Hà Nội' }, then: [{ src: 'docs/history/t1b/sky-r60/hanoi.png', date: { en: 'r60, 11 Oct 2026', vi: 'r60, 11/10/2026' } }, { src: 'docs/history/t1b/shots-r61/hanoi.jpg', date: { en: 'r61, 11 Oct 2026', vi: 'r61, 11/10/2026' } }], now: [{ src: 'docs/handbook/img/now/valley-hanoi-computer.jpg', date: { en: 'now', vi: 'hiện nay' } }, { src: 'docs/launch-2027/shots/valley-hanoi-vi.jpg', date: { en: 'v1.07, 2 Nov 2026', vi: 'v1.07, 2/11/2026' } }] },
    { key: 'village', title: { en: 'Lotus Village', vi: 'Làng Sen' }, then: [{ src: 'docs/history/t1b/sky-r60/village.png', date: { en: 'r60, 11 Oct 2026', vi: 'r60, 11/10/2026' } }], now: [{ src: 'docs/handbook/img/now/valley-village-computer.jpg', date: { en: 'now', vi: 'hiện nay' } }, { src: 'docs/launch-2027/shots/valley-village-vi.jpg', date: { en: 'v1.07, 2 Nov 2026', vi: 'v1.07, 2/11/2026' } }] },
    { key: 'aussie', title: { en: 'Australia: Aussie Corner to Sydney', vi: 'Nước Úc: từ Góc Nước Úc đến Sydney' }, then: [{ src: 'docs/history/t1b/shots-r61/aussie.jpg', date: { en: 'Aussie Corner, r61, 11 Oct 2026', vi: 'Góc Nước Úc, r61, 11/10/2026' } }], now: [{ src: 'docs/handbook/img/now/valley-sydney-computer.jpg', date: { en: 'Sydney now', vi: 'Sydney hiện nay' } }, { src: 'docs/launch-2027/shots/valley-sydney-vi.jpg', date: { en: 'Sydney, v1.07, 2 Nov 2026', vi: 'Sydney, v1.07, 2/11/2026' } }] },
    { key: 'market', title: { en: 'The market and the town', vi: 'Chợ và phố' }, then: [{ src: 'docs/history/t1b/shots-r61/market.jpg', date: { en: 'r61, 11 Oct 2026', vi: 'r61, 11/10/2026' } }], now: [{ src: 'docs/concept-d/now-road-town.jpg', date: { en: 'Town road, 30 Oct 2026', vi: 'Đường phố, 30/10/2026' } }] },
    { key: 'characters', title: { en: 'Characters', vi: 'Nhân vật' }, then: [{ src: 'docs/characters-v108/before-a.png', date: { en: 'v1.07', vi: 'v1.07' } }, { src: 'docs/characters-v108/before-face.png', date: { en: 'v1.07 face', vi: 'gương mặt v1.07' } }], now: [{ src: 'docs/characters-v108/after-a.png', date: { en: 'v1.08: knees, elbows, breathing, blinking', vi: 'v1.08: gối, khuỷu tay, thở, chớp mắt' } }, { src: 'docs/handbook/img/cast/finn-front.jpg', date: { en: 'v1.09 friends: Finn', vi: 'Bạn mới v1.09: Finn' } }] },
    { key: 'simple', title: { en: 'The Simple screen', vi: 'Màn hình Đơn giản' }, then: [{ src: 'docs/history/round-u/shots/phone-simple-cards.png', date: { en: 'r62, 12 Oct 2026', vi: 'r62, 12/10/2026' } }], now: [{ src: 'docs/handbook/img/now/simple-phone.jpg', date: { en: 'now', vi: 'hiện nay' } }, { src: 'docs/launch-2027/shots/simple-vi.jpg', date: { en: 'v1.07', vi: 'v1.07' } }] },
    { key: 'games', title: { en: 'The games menu', vi: 'Danh mục trò chơi' }, then: [{ src: 'docs/history/r69/shots/computer-hub-learning.png', date: { en: 'r69, 13 Oct 2026', vi: 'r69, 13/10/2026' } }, { src: 'docs/history/r90-shots/computer-games-vi.png', date: { en: 'r90 (v1), 24 Oct 2026', vi: 'r90 (v1), 24/10/2026' } }], now: [{ src: 'docs/handbook/img/now/hub-computer.jpg', date: { en: 'now', vi: 'hiện nay' } }] },
    { key: 'game', title: { en: 'A game screen', vi: 'Màn hình trò chơi' }, then: [{ src: 'docs/history/r69/shots/phone-reading-game.png', date: { en: 'r69, 13 Oct 2026', vi: 'r69, 13/10/2026' } }], now: [{ src: 'docs/handbook/img/now/game-count-phone.jpg', date: { en: 'now: Count With Me', vi: 'hiện nay: Cùng Đếm Nào' } }, { src: 'docs/handbook/img/now/game-oanquan-phone.jpg', date: { en: 'now: Ô Ăn Quan', vi: 'hiện nay: Ô Ăn Quan' } }] },
    { key: 'title', title: { en: 'The welcome screen', vi: 'Màn hình chào' }, then: [{ src: 'docs/history/r90-shots/computer-title.png', date: { en: 'r90 (v1), 24 Oct 2026', vi: 'r90 (v1), 24/10/2026' } }], now: [{ src: 'docs/handbook/img/now/title-computer.jpg', date: { en: 'now', vi: 'hiện nay' } }] },
    { key: 'shop', title: { en: 'The shop and wardrobe', vi: 'Cửa hàng và tủ đồ' }, then: [{ src: 'docs/history/r70/shots/computer-shop.png', date: { en: 'r70, 13 Oct 2026', vi: 'r70, 13/10/2026' } }], now: [{ src: 'docs/launch-2027/shots/wardrobe-vi.jpg', date: { en: 'v1.07, 2 Nov 2026', vi: 'v1.07, 2/11/2026' } }] },
    { key: 'grownups', title: { en: 'Grown-ups', vi: 'Người lớn' }, then: [{ src: 'docs/v1.01-shots/computer-en-grownups.png', date: { en: 'v1.01, 25 Oct 2026', vi: 'v1.01, 25/10/2026' } }], now: [{ src: 'docs/handbook/img/now/grownups-computer.jpg', date: { en: 'now', vi: 'hiện nay' } }, { src: 'docs/handbook/img/now/grownups-phone.jpg', date: { en: 'now, phone', vi: 'hiện nay, điện thoại' } }] },
    { key: 'website', title: { en: 'The website', vi: 'Trang web' }, then: [{ src: 'docs/website-review-20261023/evidence/welcome-phone.png', date: { en: 'website review, 23 Oct 2026', vi: 'duyệt trang web, 23/10/2026' } }], now: [{ src: 'docs/handbook/img/now/website-phone.jpg', date: { en: 'now', vi: 'hiện nay' } }] },
    { key: 'studio', title: { en: 'Studio', vi: 'Studio' }, then: [{ src: 'docs/history/r86-studio-controls/computer-en-lab-devices.png', date: { en: 'r86, 18 Oct 2026', vi: 'r86, 18/10/2026' } }], now: [{ src: 'docs/studio-home-20261030/computer.png', date: { en: 'Studio home, 30 Oct 2026', vi: 'Trang đầu Studio, 30/10/2026' } }, { src: 'docs/handbook/img/now/studio-computer.jpg', date: { en: 'now: the Studio frame, taken without its server (so the page reads 404)', vi: 'hiện nay: khung Studio, chụp khi không có máy chủ (nên trang ghi 404)' } }] }];
  const fig = (p: Pic, side: string, name: string) => {
    const rel = p.src.startsWith('docs/handbook/') ? (has(p.src) ? p.src.replace('docs/handbook/', '') : null) : pic(p.src, 'then', name);
    return rel ? `<figure class="${side}"><img src="${rel}" alt="" loading="lazy" width="380" height="240"><figcaption>${L(p.date)}</figcaption></figure>` : '';
  };
  const nowCount = fs.existsSync(path.join(IMG, 'now')) ? fs.readdirSync(path.join(IMG, 'now')).length : 0;
  add('then-now', 'Then and now', 'Trước và nay', `
    <p>${LM(`How the valley grew, from the early rounds (r60, 11 Oct 2026) to ${build}. Pictures marked "now" were taken from the current game with Playwright for this Handbook (${nowCount} pictures, phone, tablet and computer, in docs/handbook/img/now/).`,
      `Thung lũng đã lớn lên thế nào, từ các vòng đầu (r60, 11/10/2026) đến ${build}. Ảnh ghi "hiện nay" được chụp từ game hiện tại bằng Playwright cho Sổ tay này (${nowCount} ảnh, điện thoại, máy tính bảng và máy tính, trong docs/handbook/img/now/).`)}</p>
    ${pairs.map(p => item(p.key + ' ' + p.title.en + ' ' + p.title.vi, `<h3>${L(p.title)}</h3><div class="tn"><div class="col"><span class="lbl">${L('Then', 'Trước')}</span>${p.then.map((x, i) => fig(x, 'then', `${p.key}-then-${i}`)).join('')}</div><div class="col"><span class="lbl now">${L('Now', 'Nay')}</span>${p.now.map((x, i) => fig(x, 'now', `${p.key}-now-${i}`)).join('')}</div></div>`, 'pair')).join('')}
    ${nowCount ? `<h3 class="sub">${L('The game now on three screens', 'Game hiện nay trên ba màn hình')}</h3><div class="strip wrap">${fs.readdirSync(path.join(IMG, 'now')).filter(f => /^(simple|hub|title)-/.test(f)).sort().map(f => `<figure class="mini3"><img src="img/now/${f}" alt="" loading="lazy" width="200" height="160"><figcaption>${esc(f.replace(/\.jpg$/, ''))}</figcaption></figure>`).join('')}</div>` : ''}`);
}
fs.rmSync(tmp, { recursive: true, force: true });

// order: the 13 parts, then Then and now after the roadmap
const toc = sections.map((s, i) => `<a href="#${s.id}"><span class="no">${i + 1}</span>${L(s.title)}</a>`).join('');
const body = sections.map((s, i) => `<section class="sec" id="${s.id}"><h2><span class="no">${i + 1}</span>${L(s.title)}</h2>${s.html}</section>`).join('\n');
const html = `<meta charset="utf-8">
<title>Sparkle Valley Handbook</title>
<meta name="claude:viewport-fit-sides" content="cover">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Baloo+2:wght@600;800&family=Be+Vietnam+Pro:wght@400;600&display=swap">
<style>
/* Layout: a storybook almanac. Sticky bar with language switch and search; table of contents beside the parts on wide screens, folded on phones. Colours from the game's own website palette. */
:root{--paper:#fff9ed;--card:#ffffff;--ink:#3b2a4f;--muted:#76688a;--line:#e8ddf7;--purple:#7a4fe0;--pink:#e2508f;--sky:#e7f7ff;--gold:#b77900;
--display:'Baloo 2','Be Vietnam Pro',system-ui,sans-serif;--body:'Be Vietnam Pro',system-ui,-apple-system,'Segoe UI',sans-serif;--mono:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){--paper:#1c1626;--card:#261e33;--ink:#f1eaff;--muted:#b3a6c6;--line:#3b3050;--purple:#b69aff;--pink:#ff8cbc;--sky:#20304a;--gold:#ffc552;color-scheme:dark}}
:root[data-theme="dark"]{--paper:#1c1626;--card:#261e33;--ink:#f1eaff;--muted:#b3a6c6;--line:#3b3050;--purple:#b69aff;--pink:#ff8cbc;--sky:#20304a;--gold:#ffc552;color-scheme:dark}
html[data-lang="vi"] .l-en,html[data-lang="en"] .l-vi{display:none}
body{background:var(--paper);color:var(--ink);font:16px/1.6 var(--body)}
body::before{content:"";position:fixed;inset:0 0 auto;height:env(safe-area-inset-top,0px);z-index:10;background:var(--paper)}
.wrap-all{max-width:1180px;margin:0 auto;padding-left:max(16px,env(safe-area-inset-left,0px));padding-right:max(16px,env(safe-area-inset-right,0px));padding-block:0 64px}
header.bar{position:sticky;top:env(safe-area-inset-top,0px);z-index:5;background:var(--paper);border-bottom:2px solid var(--line);padding-block:10px;display:flex;flex-wrap:wrap;gap:10px 16px;align-items:center}
.brand{font:800 1.5rem/1.1 var(--display);color:var(--purple);margin:0;flex:1 1 220px;min-width:0}
.brand small{display:block;font:600 .8rem/1.3 var(--body);color:var(--muted);letter-spacing:.04em}
.langs{display:flex;border:2px solid var(--purple);border-radius:999px;overflow:hidden}
.langs button{font:600 .95rem var(--body);border:0;background:transparent;color:var(--purple);padding:8px 16px;min-height:44px;cursor:pointer}
.langs button[aria-pressed="true"]{background:var(--purple);color:var(--paper)}
.search{flex:1 1 260px;display:flex;gap:8px;align-items:center;min-width:0}
.search input{flex:1;min-width:0;font:inherit;padding:10px 14px;min-height:44px;border:2px solid var(--line);border-radius:12px;background:var(--card);color:var(--ink)}
.search input:focus,button:focus-visible,a:focus-visible,summary:focus-visible{outline:3px solid var(--pink);outline-offset:2px}
.count{font-size:.85rem;color:var(--muted);white-space:nowrap;font-variant-numeric:tabular-nums}
.layout{display:grid;grid-template-columns:240px minmax(0,1fr);gap:32px;margin-top:24px}
nav.toc{position:sticky;top:calc(env(safe-area-inset-top,0px) + 90px);align-self:start;display:flex;flex-direction:column;gap:2px;max-height:calc(100vh - 110px);overflow:auto}
nav.toc a{display:flex;gap:10px;align-items:baseline;padding:6px 10px;border-radius:10px;color:var(--ink);text-decoration:none;font-weight:600}
nav.toc a:hover{background:var(--line)}
.no{font:800 .85rem var(--display);color:var(--pink);min-width:1.4em;font-variant-numeric:tabular-nums}
details.toc-m{display:none}
main{min-width:0}
.sec{overflow-wrap:anywhere;padding-block:8px 28px;border-bottom:2px dashed var(--line);scroll-margin-top:110px}
h2{font:800 2rem/1.15 var(--display);margin:16px 0 12px;text-wrap:balance;display:flex;gap:12px;align-items:baseline}
h2 .no{font-size:1.2rem}
h3{font:700 1.15rem/1.3 var(--display);margin:0 0 6px;text-wrap:balance}
h3.sub{margin:22px 0 10px;color:var(--purple);display:flex;gap:8px;align-items:center}
p{margin:0 0 10px;max-width:72ch}
.lede{font-size:1.15rem;max-width:66ch;margin-bottom:14px}
.note{color:var(--muted);font-size:.92rem}
.src{color:var(--muted);font:.78rem/1.4 var(--mono);margin-top:6px}
.muted{color:var(--muted);font-size:.9rem}
code{font:.85em var(--mono);background:var(--line);padding:1px 5px;border-radius:5px;overflow-wrap:anywhere}
.kv{font-size:.95rem}
.nums{display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:10px;margin:14px 0}
.num{background:var(--card);border:2px solid var(--line);border-radius:14px;padding:10px 14px;display:flex;flex-direction:column}
.num b{font:800 1.9rem/1 var(--display);color:var(--purple);font-variant-numeric:tabular-nums}
.num span{font-size:.88rem;color:var(--muted)}
.rules{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:12px}
.rule{background:var(--card);border-radius:14px;padding:14px;border:2px solid var(--line)}
.rule h3{color:var(--pink);text-transform:uppercase;letter-spacing:.06em;font-size:.9rem}
.callout{background:var(--sky);border-radius:14px;padding:12px 16px;max-width:none}
details{margin:0}
details>summary{cursor:pointer;padding:6px 0}
.game{border-bottom:1px solid var(--line)}
.game>summary{display:flex;gap:10px;align-items:center;min-height:52px;list-style:none}
.game>summary::-webkit-details-marker{display:none}
.gname{font-weight:600;flex:1;min-width:0}
.gbody{padding:0 0 12px 58px}
.art{width:44px;height:44px;flex:none}
.art.sm{width:24px;height:24px;vertical-align:-6px;margin-right:4px}
.chip{display:inline-block;font-size:.78rem;font-weight:600;padding:2px 9px;border-radius:999px;background:var(--line);color:var(--ink);margin:0 4px 4px 0}
.tags{margin-bottom:6px}
.origin{font-style:italic}
ol.steps{margin:6px 0 8px;padding-left:22px}
ol.steps li{margin-bottom:4px}
ol.steps.big li{margin-bottom:10px}
.list{padding-left:20px;margin:6px 0 10px}
.list li{margin-bottom:4px}
.list.cols{columns:2 260px;column-gap:28px}
.cards{display:grid;grid-template-columns:repeat(auto-fill,minmax(170px,1fr));gap:10px;margin:8px 0 12px}
.card{display:flex;flex-direction:column;gap:4px;align-items:flex-start;background:var(--card);border:2px solid var(--line);border-radius:14px;padding:10px 12px}
.tag{display:inline-flex;align-items:center;margin:0 8px 6px 0}
.tbl{overflow-x:auto;margin:8px 0 12px;border:2px solid var(--line);border-radius:12px}
table{border-collapse:collapse;width:100%;font-size:.9rem}
th,td{text-align:left;padding:7px 10px;border-bottom:1px solid var(--line);vertical-align:top}
th{background:var(--line);font-weight:600;white-space:nowrap}
td.n{font-variant-numeric:tabular-nums;white-space:nowrap}
ol.log{list-style:none;padding:0;margin:8px 0}
ol.log li{display:grid;grid-template-columns:110px minmax(0,1fr);gap:12px;padding:10px 0;border-bottom:1px solid var(--line)}
ol.log time{font:800 .95rem var(--display);color:var(--pink);font-variant-numeric:tabular-nums}
.grid2{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:16px}
.friend{background:var(--card);border:2px solid var(--line);border-radius:16px;padding:12px}
.strip{display:flex;gap:8px;overflow-x:auto;margin-bottom:8px}
.strip.wrap{flex-wrap:wrap;overflow:visible}
.strip img{height:160px;width:auto;border-radius:10px;background:var(--sky)}
figure{margin:0 0 10px}
figure img{border-radius:12px;border:2px solid var(--line);display:block;height:auto;max-width:100%}
figcaption{font-size:.82rem;color:var(--muted);margin-top:4px}
figure.mini img{height:150px;width:auto}
figure.mini3 img{height:170px;width:auto}
.pair{background:var(--card);border:2px solid var(--line);border-radius:16px;padding:14px;margin-bottom:16px}
.tn{display:grid;grid-template-columns:1fr 1fr;gap:14px}
.tn .col{min-width:0;display:flex;flex-direction:column;gap:6px}
.lbl{font:800 .85rem var(--display);text-transform:uppercase;letter-spacing:.08em;color:var(--muted)}
.lbl.now{color:var(--purple)}
.tn img{max-height:340px;width:auto}
.empty{display:none;padding:24px;background:var(--card);border-radius:14px;border:2px dashed var(--line)}
body.searching .empty.show{display:block}
body.searching .it.off,body.searching .sec.off{display:none}
mark{background:var(--gold);color:var(--paper);border-radius:3px}
@media (max-width:860px){.layout{grid-template-columns:minmax(0,1fr)}nav.toc{display:none}details.toc-m{display:block;margin-top:12px;background:var(--card);border-radius:12px;padding:4px 12px;border:2px solid var(--line)}
 details.toc-m nav{display:flex;flex-direction:column}details.toc-m a{padding:8px 4px;color:var(--ink);text-decoration:none;font-weight:600;display:flex;gap:10px}
 .gbody{padding-left:0}.bar{padding-block:6px;gap:6px 8px}.brand{font-size:1.15rem;flex-basis:100%}.brand small{display:none}.langs button{padding:6px 10px;font-size:.85rem}.search{flex:1 1 150px}.count{display:none}.tn{grid-template-columns:minmax(0,1fr)}ol.log li{grid-template-columns:minmax(0,1fr);gap:2px}h2{font-size:1.6rem}}
@media (prefers-reduced-motion:no-preference){html{scroll-behavior:smooth}}
</style>
<svg width="0" height="0" style="position:absolute" aria-hidden="true">${symbols.join('')}</svg>
<div class="wrap-all">
<header class="bar">
  <h1 class="brand"><span class="l-vi">Sổ tay Thung Lũng Lấp Lánh</span><span class="l-en">Sparkle Valley Handbook</span><small>${esc(build)} · ${esc(sydney)}</small></h1>
  <div class="langs" role="group" aria-label="Language / Ngôn ngữ"><button type="button" id="lang-vi" data-l="vi" aria-pressed="true">Tiếng Việt</button><button type="button" id="lang-en" data-l="en" aria-pressed="false">English</button></div>
  <label class="search" for="q"><input id="q" type="search" autocomplete="off" placeholder="Tìm trò chơi, lễ hội, quy tắc... / Search"><span class="count" id="count"></span></label>
</header>
<details class="toc-m"><summary>${L('Contents', 'Mục lục')}</summary><nav>${toc}</nav></details>
<div class="layout"><nav class="toc" aria-label="Contents">${toc}</nav>
<main>
<div class="empty" id="empty">${L('Nothing matches. Try another word, with or without Vietnamese marks.', 'Không tìm thấy. Thử từ khác, có hoặc không có dấu.')}</div>
${body}
<p class="src">${L('Made by tools/handbook.mts from the game\'s code and docs.', 'Tạo bởi tools/handbook.mts từ mã nguồn và tài liệu của game.')} ${missing.length ? esc('Could not read: ' + missing.join('; ')) : ''}</p>
</main></div></div>
<script>
(function(){
  var root=document.documentElement;
  function setLang(l){root.setAttribute('data-lang',l);root.lang=l;document.querySelectorAll('.langs button').forEach(function(b){b.setAttribute('aria-pressed',String(b.dataset.l===l));});
    var q=document.getElementById('q');q.placeholder=l==='vi'?'Tìm trò chơi, lễ hội, quy tắc...':'Search games, festivals, rules...';try{localStorage.setItem('svh-lang',l);}catch(e){}}
  var saved='vi';try{saved=localStorage.getItem('svh-lang')||'vi';}catch(e){}
  setLang(saved==='en'?'en':'vi');
  document.querySelectorAll('.langs button').forEach(function(b){b.addEventListener('click',function(){setLang(b.dataset.l);});});
  function fold(s){return s.toLowerCase().normalize('NFD').replace(/[\\u0300-\\u036f]/g,'').replace(/đ/g,'d').replace(/\\s+/g,' ').trim();}
  var items=[].slice.call(document.querySelectorAll('.it')),secs=[].slice.call(document.querySelectorAll('.sec')),count=document.getElementById('count'),empty=document.getElementById('empty');
  var t=0;
  function run(){var raw=document.getElementById('q').value,q=fold(raw),words=q.split(' ').filter(Boolean);
    document.body.classList.toggle('searching',words.length>0);
    if(!words.length){items.forEach(function(i){i.classList.remove('off');});secs.forEach(function(s){s.classList.remove('off');});count.textContent='';empty.classList.remove('show');return;}
    var n=0;items.forEach(function(i){var s=i.getAttribute('data-s')||'';var ok=words.every(function(w){return s.indexOf(w)>=0;});i.classList.toggle('off',!ok);if(ok){n++;if(i.tagName==='DETAILS'&&words.join('').length>2)i.open=true;}});
    secs.forEach(function(s){var any=s.querySelector('.it:not(.off)');s.classList.toggle('off',!any);});
    count.textContent=n+(root.lang==='vi'?' kết quả':' found');empty.classList.toggle('show',n===0);}
  document.getElementById('q').addEventListener('input',function(){clearTimeout(t);t=setTimeout(run,120);});
})();
</script>
`;
fs.mkdirSync(OUT, { recursive: true });
fs.writeFileSync(path.join(OUT, 'index.html'), html);
const total = (d: string): number => fs.readdirSync(d, { withFileTypes: true }).reduce((n, e) => n + (e.isDirectory() ? total(path.join(d, e.name)) : fs.statSync(path.join(d, e.name)).size), 0);
console.log(`Handbook: docs/handbook/index.html (${(html.length / 1024).toFixed(0)} KB), pictures ${(total(IMG) / 1048576).toFixed(1)} MB; ${games.length} games, ${stories.length} stories, ${festivals.length} festivals, ${decisions.length} decisions, ${sprite.size} drawings.`);
if (missing.length) console.log('Could not read:', missing.join('; '));
