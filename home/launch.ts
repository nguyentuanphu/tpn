// (owner, 1 Nov 2026 AEDT: "finish first, and a Studio switch to set the launch date later"; pop-up answer "the website
// says it is open") Studio's Releases page has a launch date (release publicLaunch). The website shows a small banner at
// the top: before the date "Coming soon" with the days left, from the date "Open now" with Play now. Nothing shows while
// no date is set. The game itself is never held back: testers and families keep playing. The date comes from the public
// festival snapshot (/api/festivals), which carries no family data.
import { onPublicFestivals, publicFestivals, startPublicFestivals } from '../js/festival-live.js';
import { sydneyFestivalDate } from '../js/content/festival-visibility.js';

const vi = () => document.documentElement.lang === 'vi';
const daysBetween = (from: string, to: string) => Math.round((Date.parse(to + 'T00:00:00Z') - Date.parse(from + 'T00:00:00Z')) / 864e5);
const dateText = (iso: string) => new Intl.DateTimeFormat(vi() ? 'vi-VN' : 'en-AU', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(iso + 'T00:00:00Z'));

export function setupLaunchBanner() {
  if (typeof document === 'undefined') return;
  let bar: HTMLElement | null = null;
  const draw = () => {
    const launch = publicFestivals()?.launch || null;
    if (!launch) { bar?.remove(); bar = null; return; }
    const left = daysBetween(sydneyFestivalDate(), launch), open = left <= 0;
    if (!bar) {
      bar = document.createElement('div'); bar.className = 'launch-banner'; bar.setAttribute('role', 'status');
      bar.style.cssText = 'display:flex;flex-wrap:wrap;align-items:center;justify-content:center;gap:10px 16px;padding:10px 16px;background:#fff4c8;color:#3b2a4f;font-weight:700;text-align:center;border-bottom:2px solid #ffd23f';
      document.body.prepend(bar);
    }
    bar.dataset.state = open ? 'open' : 'soon';
    const text = open ? (vi() ? 'Thung Lũng Lấp Lánh đã mở! Mời cả nhà vào chơi.' : 'Sparkle Valley is open! Come and play.')
      : vi() ? `Sắp ra mắt: ${dateText(launch)} (còn ${left} ngày)` : `Coming soon: ${dateText(launch)} (${left} ${left === 1 ? 'day' : 'days'} to go)`;
    bar.innerHTML = '';
    const span = document.createElement('span'); span.textContent = text; bar.appendChild(span);
    if (open) {
      const a = document.createElement('a'); a.href = '../'; a.className = 'launch-play';
      a.textContent = vi() ? 'Chơi ngay' : 'Play now';
      a.style.cssText = 'display:inline-flex;align-items:center;min-height:44px;padding:0 18px;border-radius:999px;background:#45bb66;color:#fff;text-decoration:none';
      a.addEventListener('click', () => window.svWebsitePlay?.());
      bar.appendChild(a);
    }
  };
  onPublicFestivals(draw); startPublicFestivals(); draw();
  // the page's language switch changes <html lang>: say it again in the new language
  new MutationObserver(draw).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
}
