// Tester rewards (owner, 12 Oct 2026 AEDT; brief docs/cores/tasks/tester-reports.md §4), on a tester device only
// (js/tester.js loads it after the tester accepts). What the website says about this device's reports (the problems
// fixed or confirmed thanks to them, the kinds, this week's star) turns into:
//   - Bug Hunter badges (Bronze, Silver, Gold, Rainbow ladybird at 1, 10, 25, 50 reports that helped), worn on every
//     explorer's shirt on this device (look.badge: friends see it online too), with a reward pop-up for each new one;
//   - "Fixed!": Ông Cú thanks the tester by name, confetti and coins, once for each problem fixed;
//   - tester gear (the bug hunter's hat, the ladybird backpack, the detective cape for a full sticker page);
//   - a sticker for each kind of problem found (the sticker album), this week's star by the name (look.star);
//   - the Tester's Corner: badges, stickers, gear and the board of problems fixed thanks to this tester;
//   - (sneak peeks are listed in the ladybird's panel, js/tester.ts, with no pop-up: owner, 23 Oct AEDT).
import { T, nm } from './i18n.js';
import { profiles, saveProfiles } from './state.js';
import { el, esc } from './util.js';
import { pic } from './art.js';
import { modal, dialog, reward, confetti } from './popups.js';
import { say } from './voice.js';
import { ITEM, adoptWorn, versionFor, setOf } from './content/shop.js';
import * as C from './content/tester.js';
import { publicFixedVersion } from './tester-detection.js';

const KEY = 'sv2_tester_rw';
const get = d => { try { return JSON.parse(localStorage.getItem(KEY) || 'null') || d; } catch (e) { return d; } };
const put = v => { try { localStorage.setItem(KEY, JSON.stringify(v)); } catch (e) { } };
const L = pair => T(pair[0], pair[1]);
const sayLine = (l: string[]) => say(l[0], l[1]);
let G = null, statusOf = () => null, queue = Promise.resolve();
// (each moment waits until a child is in the valley and nothing else is open: never over the title screen or a game)
const free = () => new Promise<void>(res => { const ok = () => G.heroes && G.heroes.length && !G.paused && !document.querySelector('.screen.title, .screen.who, .modal, .dialog, .gl, .theatre, .storybook, .reward');
  if (ok()) return res(); const t = setInterval(() => { if (ok()) { clearInterval(t); res(); } }, 700); });
const later = f => { queue = queue.then(async () => { await free(); return f(); }).catch(() => { }); return queue; };

// the gear a tester has earned: by badge, and the cape for a full sticker page
const gearFor = (badge, kinds) => C.GEAR.filter(g => g.at === 'album' ? C.STICKER_KINDS.every(k => kinds.includes(k)) : badge && +badge.id.slice(2) >= +g.at.slice(2)).map(g => g.id);

function dress(st) {
  const badge = C.badgeFor(st.helped || 0), kinds = (st.helpedKinds || []).filter(k => C.STICKER_KINDS.includes(k)), gear = gearFor(badge, kinds);
  let changed = false;
  (profiles || []).forEach((p, i) => {
    const look = p.look = p.look || {}, was = JSON.stringify([look.badge, look.star, p.testerStickers, (p.owned || {}).clothes]);
    if (badge) look.badge = badge.id; else delete look.badge;
    if (st.star) look.star = 1; else delete look.star;
    p.testerStickers = kinds;
    // (r79) each child gets the version made for their own set (a girl's bug hunter hat is the purple one)
    if (gear.length) { adoptWorn(p); gear.map(id => versionFor(id, setOf(p.look))).forEach(id => { if (ITEM[id] && !p.owned.clothes.includes(id)) p.owned.clothes.push(id); }); }
    if (JSON.stringify([look.badge, look.star, p.testerStickers, (p.owned || {}).clothes]) !== was) changed = true;
  });
  if (changed) { saveProfiles(); (G.heroes || []).forEach((h, i) => G.rebuildHero && G.rebuildHero(i)); }
  return { badge, kinds, gear };
}

// what the website says → badges, gear, stickers, the star, thank-yous and sneak peeks (each moment once)
export function apply(st) {
  if (!st) return; const seen = get({ badge: '', thanked: {}, star: '', peeks: {}, stickers: [] }), out = dress(st);
  later(async () => {
    if (out.badge && out.badge.id !== seen.badge) { await free(); seen.badge = out.badge.id; put(seen); sayLine(C.TESTER_LINES.badge); await reward(pic('🐞'), T(out.badge.en, out.badge.vi), T('Bug Hunter badge, worn on your shirt', 'Huy hiệu Săn Bọ, đeo trên áo')); }
    const newSt = out.kinds.filter(k => !(seen.stickers || []).includes(k));
    if (newSt.length) { await free(); seen.stickers = out.kinds; put(seen); await reward(pic(C.STICKER_ICON[newSt[0]]), T('A new tester sticker!', 'Một hình dán người thử mới!'), T('In the Tester\'s Corner', 'Trong Góc người thử')); }
    const week = new Date(); week.setDate(week.getDate() - week.getDay()); const wk = week.toISOString().slice(0, 10);
    if (st.star && seen.star !== wk) { await free(); seen.star = wk; put(seen); sayLine(C.TESTER_LINES.star); await reward(pic('⭐'), T('Star tester of the week!', 'Người thử ngôi sao của tuần!'), T('A gold star by your name for a week', 'Một ngôi sao vàng bên tên con trong một tuần')); }
    for (const p of (st.mine || []).filter(p => ['fixed', 'confirmed'].includes(p.status) && !seen.thanked[p.k])) { await free(); seen.thanked[p.k] = 1; put(seen); await thankNow(p); }
    // (r90, owner 23 Oct AEDT: the "Tester preview" pop-up at every start was very annoying) releases a tester sees early
    // are listed in the ladybird's panel instead (js/tester.ts testerNews), with no pop-up
  });
}
// "You found this, and now it is fixed!": Ông Cú thanks the tester by name (the name is shown, not spoken), confetti, coins
// (owner, 24 Oct AEDT: no Ông Cú thank-you speech or confetti for a fix, coins given quietly)
async function thankNow(p) {
  const coins = C.COINS.helped + (p.spoken ? C.COINS.spoken : 0);
  if (G.addCoins) G.addCoins(coins);
}

export const thank = p => later(() => thankNow(p));

// the Tester's Corner: badge and the next one, the sticker album, the gear, this week's star, and the board of problems
// fixed thanks to this tester
export function corner() {
  const st = statusOf() || {}, helped = st.helped || 0, badge = C.badgeFor(helped), next = C.nextBadge(helped), kinds = (st.helpedKinds || []).filter(k => C.STICKER_KINDS.includes(k));
  const fixed = (st.mine || []).filter(p => ['fixed', 'confirmed'].includes(p.status)), gear = gearFor(badge, kinds);
  const m = modal('tpanel tcorner', `<div class="tp-head"><span class="tp-lb">${pic('🐞')}</span><h2>${T('Tester\'s Corner', 'Góc người thử')}</h2><button class="x" aria-label="${T('Close', 'Đóng')}">✕</button></div>
    <div class="tc-badges">${C.BADGES.map(b => `<div class="tc-badge ${badge && +b.id.slice(2) <= +badge.id.slice(2) ? 'on' : ''} ${b.id}"><span>${pic('🐞')}</span><b>${T(b.en, b.vi)}</b><small>${b.at}</small></div>`).join('')}</div>
    <p class="note">${next ? T(`Reports that helped: ${helped}. ${next.at - helped} more for the ${next.en}.`, `Báo cáo đã giúp: ${helped}. Thêm ${next.at - helped} nữa để có ${next.vi}.`) : T(`Reports that helped: ${helped}. Every badge won!`, `Báo cáo đã giúp: ${helped}. Đã có mọi huy hiệu!`)}${st.star ? ' ' + T('This week\'s star tester!', 'Người thử ngôi sao của tuần!') : ''}</p>
    <h3>${T('Sticker album', 'Album hình dán')}</h3><div class="tc-stickers">${C.STICKER_KINDS.map(k => { const kd = C.KINDS.find(x => x.id === k); return `<div class="tc-st ${kinds.includes(k) ? 'on' : ''}">${pic(C.STICKER_ICON[k])}<small>${T(kd.en, kd.vi)}</small></div>`; }).join('')}</div>
    <h3>${T('Tester gear', 'Đồ của người thử')}</h3><div class="tc-gear">${C.GEAR.map(g => { const it = ITEM[g.id]; return `<div class="tc-g ${gear.includes(g.id) ? 'on' : ''}"><b>${esc(T(it.en, it.vi))}</b><small>${g.at === 'album' ? T('a full sticker page', 'đủ trang hình dán') : esc(T(C.BADGES.find(b => b.id === g.at).en, C.BADGES.find(b => b.id === g.at).vi))}</small></div>`; }).join('')}</div>
    <h3>${T('Fixed thanks to you', 'Đã sửa nhờ con')}</h3><div class="tm-list">${fixed.length ? fixed.map(p => `<div class="tm-row s-fixed"><b>${esc(p.title)}</b><small>${esc(publicFixedVersion(p.fixedIn))}</small></div>`).join('') : `<p class="note">${T('Nothing yet: keep looking!', 'Chưa có: tiếp tục tìm nhé!')}</p>`}</div>`);
  m.querySelector('.x').onclick = () => m.close();
  return m;
}

export function mountRewards(game, getStatus) {
  G = game; statusOf = getStatus;
  G.testerRewards = { apply, thank, corner, unmount: () => { delete G.testerRewards; } };
}
