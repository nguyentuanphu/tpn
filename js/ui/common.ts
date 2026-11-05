// Shared pieces of the screens (split from js/ui.ts, v1.07): comfort settings, captions, toast,
// the language and learn buttons, folding headings, the jump row and the family website button.
import { T, applyLang } from '../i18n.js';
import { settings, saveSettings, HATS, reduceMotion } from '../state.js';
import { spoken } from '../voice.js';
import { SFX, Music } from '../audio.js';
import { cur } from '../money.js';
import { el, esc, $ } from '../util.js';
import { featureOn } from '../custom.js';
import { sayIn } from '../voice.js';
import { LEARN } from '../words2.js';
import { originFlags } from '../icons.js';
export const familyTrialOn = () => featureOn('familyDevices', false) || !!window.__sv?.tester;

export const PET_ICON = { puppy: '🐶', kitty: '🐱', bunny: '🐰', panda: '🐼', joey: '🦘', calf: '🐃' };
// the companion's and pets' hats (js/kidplay.js HATS), drawn as in the shop's Companion tab
export const PAL_HAT_ICON = { party: '🎉', flower: '🌸', nonla: '👒', crown: '👑',
  // (v1.08 companion) the four hats after the crown: our drawings, js/art/companion-hats.ts
  beanie: 'palhat:beanie', captain: 'palhat:captain', wizard: 'palhat:wizard', lotus: 'palhat:lotus' };
// (issue #738) the Backpack section that holds the pets and the companion together, and their hats
export const PALS_NAME = () => T('Pets & Buddy', 'Thú cưng & Bạn đồng hành');
// (v1.08 companion, owner's plan E) the pad's tab that holds the companion, the pets and their hats
export const PALS_TAB = () => T('Companions', 'Bạn đồng hành');
export const STYLE_ICON = { dress: '👗', shirt: '👕', aodai: '🥻', tunic: '🧥', overalls: '👖', hoodie: '🧶' };
export const STYLE_NAME = { dress: () => T('Dress', 'Váy'), shirt: () => T('Shirt & shorts', 'Áo và quần đùi'), aodai: () => 'Áo dài', tunic: () => T('Explorer', 'Nhà thám hiểm'), overalls: () => T('Overalls', 'Quần yếm'), hoodie: () => T('Hoodie', 'Áo nỉ') };
// big text and calm mode change the whole page
export function applyComfort() { if (settings.textSize == null) settings.textSize = settings.bigText ? 1 : 0; document.body.classList.toggle('bigtext', settings.textSize >= 1); document.body.classList.toggle('biggertext', settings.textSize >= 2); document.body.classList.toggle('calm', reduceMotion()); if (Music.key) Music.refresh(); }
applyComfort();
// the device's "Reduce motion" switch, also when it is changed while playing
try { matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', () => applyComfort()); } catch (e) { }
// Captions: every spoken line also appears as text at the bottom (unless a speech box, game or storybook
// is already showing those words). On by default; grown-ups can switch it off.
let hideCaption = () => { };
{
  let cap = null, timers = [];
  const stop = () => { timers.forEach(clearTimeout); timers = []; };
  hideCaption = () => { stop(); cap && cap.classList.remove('show'); };
  // credits.js asks for this with an event (it cannot import ui.js: ui.js opens the credits)
  window.addEventListener('sv-hide-caption', () => hideCaption());
  // a long line is shown a sentence or two at a time, so the box never grows to cover the screen
  const chunks = text => {
    const out = []; let cur = '';
    for (const p of text.replace(/([.!?。…])\s+/g, '$1\u0001').split('\u0001')) { // (no lookbehind: older Safari)
      if (cur && (cur + ' ' + p).length > 90) { out.push(cur); cur = p; } else cur = cur ? cur + ' ' + p : p;
    }
    if (cur) out.push(cur);
    return out;
  };
  spoken.push(text => {
    if (settings.captions !== true || !text) return; // (v1.08f, owner 6 Nov: captions are off unless a grown-up turns them on)
    if (document.querySelector('.modal:not(.out), .wardrobe, .audio-tray, .dialog:not(.out), .storybook, .gl, .howto, .credits')) { hideCaption(); return; }
    if (!cap) { cap = el('div', 'caption'); cap.setAttribute('role', 'status'); cap.setAttribute('aria-live', 'polite'); document.body.appendChild(cap); }
    stop(); let at = 0;
    chunks(text).forEach(c => {
      const ms = 2200 + c.length * 70;
      timers.push(setTimeout(() => { if (document.querySelector('.modal:not(.out), .wardrobe, .audio-tray, .dialog:not(.out), .storybook, .gl, .howto, .credits')) { hideCaption(); return; } cap.textContent = c; cap.classList.add('show'); }, at));
      at += ms;
    });
    timers.push(setTimeout(() => cap.classList.remove('show'), at));
  });
}
export { hideCaption };
const toastProperties: { _t?: ReturnType<typeof setTimeout> } = {};
export const toast = Object.assign((msg: string) => { const t = $('#toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(toast._t); toast._t = setTimeout(() => t.classList.remove('show'), 3200); }, toastProperties);

export const flagBtns = () => `<div class="seg lang"><button data-l="en" class="${settings.lang === 'en' ? 'on' : ''}">${originFlags('au')} English</button><button data-l="vi" class="${settings.lang === 'vi' ? 'on' : ''}">${originFlags('vn')} Tiếng Việt</button></div>`;
// Small, quiet buttons to also learn Chinese or Hindi words (in China Town, India Village and First Words).
export const learnBtns = () => `<div class="learnrow" aria-label="${T('Also learn', 'Học thêm')}">🌏 ${Object.entries(LEARN).map(([k, l]) => `<button data-learn="${k}" class="${settings.learnLang === k ? 'on' : ''}" title="${l.name[settings.lang] || l.name.en}">${k === 'zh' ? '中文' : 'हिन्दी'}</button>`).join('')}</div>`;
export function bindLearn(root, after) {
  root.querySelectorAll('[data-learn]').forEach(b => b.onclick = e => {
    e.stopPropagation(); const k = b.dataset.learn; settings.learnLang = settings.learnLang === k ? '' : k; saveSettings(); SFX.tap();
    if (settings.learnLang) { const L = LEARN[k], w = L.words[0]; toast(`${L.flag} ${T('Also learning ' + L.name.en, 'Học thêm ' + L.name.vi)}: ${w[3]} (${w[4]})`); sayIn(k, w[3]); }
    after && after();
  });
}
export function bindLang(root, after) {
  root.querySelectorAll('.seg.lang button').forEach(b => b.onclick = () => { settings.lang = b.dataset.l; saveSettings(); applyLang(); SFX.tap(); after && after(); });
}
// ---------- Rename characters ----------
// (owner, 13 Oct AEDT: "within each, all the categories should be collapsible") each heading inside a part opens and
// closes what follows it, up to the next heading; the game remembers what was closed while it is open
const closedFolds = new Set();
export function foldHeadings(root, scope) {
  [...root.querySelectorAll(':scope > h3, :scope > div > h3')].forEach(h => { if (h.closest('details.hfold')) return; const nodes = []; let n = h.nextSibling;
    while (n && !(n.nodeType === 1 && (/^H[23]$/.test(n.tagName) || n.matches('details.gsec, details.hfold')))) { nodes.push(n); n = n.nextSibling; }
    if (!nodes.length) return; const k = scope + ':' + h.textContent.trim().slice(0, 40), d = document.createElement('details'), sm = document.createElement('summary');
    d.className = 'hfold'; d.open = !closedFolds.has(k); h.parentNode.insertBefore(d, h); sm.appendChild(h); d.appendChild(sm); nodes.forEach(x => d.appendChild(x));
    d.addEventListener('toggle', () => { if (d.open) closedFolds.delete(k); else closedFolds.add(k); }); });
}
// a sticky row of shortcuts at the top of a long page: one chip per section heading, tap to jump there
export function jumpNav(root, after) {
  const hs = [...root.querySelectorAll(':scope > h3, :scope h3.jump')].filter(h => h.textContent.trim());
  if (hs.length < 4) return;
  const nav = el('div', 'jumpnav');
  // (17 Oct AEDT) a jump lands the heading clear of the row: the row sticks below the window's top padding and its 44 px
  // buttons made it taller than the old fixed 64 px, so headings landed under it
  hs.forEach((h, k) => { const t = [...h.childNodes].filter(n => n.nodeName !== 'SMALL').map(n => n.textContent).join('').trim().replace(/\s+/g, ' '), b = el('button', '', esc([...t].length > 26 ? [...t].slice(0, 25).join('') + '…' : t)); b.onclick = () => { SFX.tap(); h.style.scrollMarginTop = nav.offsetHeight + (parseFloat(getComputedStyle(root).paddingTop) || 0) + 6 + 'px'; h.scrollIntoView({ behavior: 'smooth', block: 'start' }); }; nav.appendChild(b); h.style.scrollMarginTop = '64px'; });
  (after && after.parentNode === root ? after : root.firstElementChild).insertAdjacentElement('afterend', nav);
}
// ---------- the family website (r89): js/website.ts, loaded only when it is opened ----------
export const WEBSITE_ICON = '<svg class="ico" viewBox="0 0 48 48" aria-hidden="true"><path d="M5 24L24 9l19 15" fill="#ff8a5a" stroke="#3b2a4f" stroke-width="2.6" stroke-linejoin="round"/><path d="M10 23h28v20H10z" fill="#fff3d0" stroke="#3b2a4f" stroke-width="2.6"/><path d="M21 43V31h8v12" fill="#b07a4a" stroke="#3b2a4f" stroke-width="2.6"/><rect x="14" y="27" width="5" height="5" rx="1" fill="#8ed7f3" stroke="#3b2a4f" stroke-width="1.5"/><path d="M37 2l2.1 4.4 4.9.7-3.5 3.4.8 4.8-4.3-2.2-4.3 2.2.8-4.8L30 7.1l4.9-.7z" fill="#ffd23f" stroke="#3b2a4f" stroke-width="1.6" stroke-linejoin="round"/></svg>';
let siteRequest: Promise<void> | null = null;
export function openSite(opener: Element | null, section = ''): Promise<void> {
  if (siteRequest) return siteRequest;
  siteRequest = import('../website.js').then(m => { m.openWebsite(opener, undefined, section); }).catch(error => { window.svModuleGone?.(error); }).finally(() => { siteRequest = null; });
  return siteRequest;
}
