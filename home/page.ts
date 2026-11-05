// (v1.08c roads brief, part 2) the family website's page script, as typed code. Until v1.08 it was a 10 KB inline
// script in home/index.html, made from the design's own script (docs/website-review-20261023/prototype.html) with
// string replacements in tools/build-website.mts and navigation.mts. Now tools/build-website.mts takes the design's
// script out of the page and home/site.ts runs this instead. What families see stays the same
// (docs/website-review-20261023/WEBSITE-RULES.md): the four main destinations and their topic pages (home/navigation.ts),
// the menu, the language switch (English and Vietnamese, kept on this device), the Quest Guide's search and printing,
// the pictures, the festival calendar, the sample quiz and the example day.
// Inside the game (/home/?embed=1, js/website.ts) the page only ever asks the game to close (Close, Back to game,
// Escape); it is told nothing and sends nothing else.
import { moveSections, showRoute } from './navigation.js';

declare global { interface Window { svFestivalVisible?: (id: string) => boolean; svWebsitePlay?: () => void } }
type Lang = 'en' | 'vi';
const $ = <T extends Element = HTMLElement>(sel: string) => { const e = document.querySelector<T>(sel); if (!e) throw Error('the website page has no ' + sel); return e; };
const all = <T extends Element = HTMLElement>(sel: string) => [...document.querySelectorAll<T>(sel)];

export function startPage(): void {
  moveSections();
  const Q = new URLSearchParams(location.search), EMBED = Q.get('embed') === '1' && window.parent !== window;
  const keptLang = () => { try { return localStorage.getItem('sv_parent_lang'); } catch (e) { return null; } };
  const asked = Q.get('lang');
  let lang: Lang = asked === 'vi' || asked === 'en' ? asked : keptLang() === 'vi' ? 'vi' : 'en';
  const pick = (en: string | undefined, vi: string | undefined) => (lang === 'en' ? en : vi) || '';
  const site = $('#site-content'), host = $('#standalone'), menu = $<HTMLDialogElement>('#menu-dialog');
  host.append(site);
  document.body.dataset.mode = EMBED ? 'embedded' : 'website';
  if (EMBED) site.classList.add('overlay');

  const tell = (what: 'close' | 'play') => { if (EMBED) window.parent.postMessage({ sv: 'website', do: what }, location.origin); };
  const closeSite = () => tell('close');
  const playGame = () => { if (EMBED) { tell('play'); return; } window.svWebsitePlay?.(); location.href = '/'; };
  all('[data-action=play]').forEach(b => { b.onclick = playGame; });
  $('#close-site').onclick = closeSite;
  $('#language-button').onclick = () => { lang = lang === 'en' ? 'vi' : 'en'; if (!EMBED) try { localStorage.setItem('sv_parent_lang', lang); } catch (e) { } translate(); };
  all('[data-open-menu]').forEach(b => { b.onclick = () => menu.showModal(); });
  $('#close-menu').onclick = () => menu.close();
  menu.addEventListener('click', e => { if (e.target === menu) menu.close(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && EMBED && !document.querySelector('dialog[open]')) closeSite(); });

  // ---- pictures, shown large ----
  const imageDialog = $<HTMLDialogElement>('#image-dialog'), large = $<HTMLImageElement>('#large-image');
  let imageSource: HTMLImageElement | null = null, imageOpener: HTMLElement | null = null;
  const showImage = (img: HTMLImageElement) => {
    large.src = pick(img.dataset.imageEn, img.dataset.imageVi) || img.src;
    large.alt = pick(img.dataset.altEn, img.dataset.altVi);
    $('#image-caption').textContent = large.alt;
  };
  all('[data-view-image]').forEach(b => { b.onclick = () => { imageSource = b.querySelector('img'); imageOpener = b; if (imageSource) showImage(imageSource); imageDialog.showModal(); $('#close-image').focus(); }; });
  $('#close-image').onclick = () => imageDialog.close();
  imageDialog.addEventListener('close', () => imageOpener?.focus());
  imageDialog.addEventListener('click', e => { if (e.target === imageDialog) imageDialog.close(); });

  // ---- the Quest Guide: search in either language ----
  const search = $<HTMLInputElement>('#quest-search'), items = all('.guide-item');
  const normal = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/đ/g, 'd');
  items.forEach(el => { el.dataset.search = normal([...el.querySelectorAll<HTMLElement>('[data-en]')].map(n => n.dataset.en + ' ' + n.dataset.vi).join(' ')); });
  const shownItems = () => items.filter(el => el.dataset.festivalVisible !== 'false').length;
  function filterQuests() {
    const q = normal(search.value.trim()); let found = 0;
    items.forEach(el => { el.hidden = el.dataset.festivalVisible === 'false' || !!q && !(el.dataset.search || '').includes(q); if (!el.hidden) found++; });
    $('#quest-results').textContent = q ? (lang === 'en' ? `${found} matching guide entries. Clear search to see all.` : `Có ${found} mục phù hợp. Xóa tìm kiếm để xem tất cả.`)
      : (lang === 'en' ? `${shownItems()} guide entries. Search in English or Vietnamese.` : `Có ${shownItems()} mục hướng dẫn. Tìm bằng tiếng Anh hoặc tiếng Việt.`);
  }
  all('[data-quiz-answer]').forEach(b => { b.onclick = () => {
    const result = $('#sample-quiz-result'), ok = b.dataset.quizAnswer === 'thanks';
    result.dataset.en = ok ? 'Yes! Thank you is a kind way to recognise someone’s help. Try saying it in both languages together.' : 'Good night is for bedtime. Try the other answer!';
    result.dataset.vi = ok ? 'Đúng rồi! Cảm ơn là lời tử tế khi được giúp đỡ. Cùng thử nói bằng cả hai ngôn ngữ nhé.' : 'Chúc ngủ ngon dùng lúc đi ngủ. Thử đáp án còn lại nhé!';
    result.textContent = result.dataset[lang] || '';
  }; });
  search.oninput = filterQuests;
  $('#clear-search').onclick = () => { search.value = ''; filterQuests(); search.focus(); };

  // ---- one page at a time (home/navigation.ts) ----
  const route = () => showRoute({ showAllFestivals: () => { festivalFilter = 'all'; applyFestivalFilter(); }, clearSearch: () => { if (search.value) { search.value = ''; filterQuests(); } } });
  document.addEventListener('click', e => {
    const a = e.target instanceof Element ? e.target.closest('a[href^="#"]') : null;
    if (!a || (!site.contains(a) && !menu.contains(a))) return;
    e.preventDefault(); if (menu.open) menu.close();
    const next = a.getAttribute('href') || '';
    if (location.hash === next) route(); else location.hash = next;
  });
  window.addEventListener('hashchange', route);

  // ---- printing the Quest Guide opens every entry, then puts them back ----
  let printState: [HTMLDetailsElement, boolean][] = [];
  window.addEventListener('beforeprint', () => { printState = all<HTMLDetailsElement>('.quest-page details').map(el => [el, el.open]); printState.forEach(([el]) => { el.open = true; }); });
  window.addEventListener('afterprint', () => printState.forEach(([el, open]) => { el.open = open; }));
  $('#print-guide').onclick = () => window.print();

  // ---- the festival calendar ----
  let festivalFilter = 'all';
  const festivalYear = $<HTMLSelectElement>('#festival-year');
  function applyFestivalCountdowns() {
    const day = 864e5, now = new Date(), today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
    const n = (k: number) => lang === 'en' ? (k === 1 ? '1 day' : k + ' days') : k + ' ngày';
    const at = (s: string) => { const [y, m, d] = s.split('-').map(Number); return Date.UTC(y, m - 1, d); };
    all('.festival-countdown').forEach(el => {
      const iso: Record<string, string | null> = JSON.parse(el.dataset.festIso || '{}'), len = +(el.dataset.festDays || 0) || 1, build = +(el.dataset.festBuild || 0) || 3;
      const next = Object.values(iso).filter((s): s is string => !!s).map(at).find(t => t + len * day > today);
      if (next == null) { el.hidden = true; return; }
      el.hidden = false;
      const to = Math.round((next - today) / day), deco = to - build, parts: string[] = [];
      if (to <= 0) { el.textContent = lang === 'en' ? 'On today: decorations, the hunt and the festival game' : 'Hôm nay: trang trí, truy tìm và trò chơi lễ hội'; el.classList.add('now'); return; }
      el.classList.remove('now');
      parts.push(deco > 0 ? (lang === 'en' ? 'Decorations in ' + n(deco) : 'Trang trí sau ' + n(deco)) : (lang === 'en' ? 'Decorations up now' : 'Đã trang trí'));
      if (el.dataset.festHunt) {
        const hs = Math.max(next - 7 * day, at(el.dataset.festHunt)), h = Math.round((hs - today) / day);
        if (hs < next + len * day) parts.push(h > 0 ? (lang === 'en' ? 'Festival hunt in ' + n(h) : 'Truy tìm lễ hội sau ' + n(h)) : (lang === 'en' ? 'Festival hunt on now' : 'Đang truy tìm lễ hội'));
      }
      parts.push(lang === 'en' ? (to === 1 ? 'Festival day tomorrow' : 'Festival day in ' + n(to)) : (to === 1 ? 'Ngày lễ là ngày mai' : 'Ngày lễ sau ' + n(to)));
      el.innerHTML = parts.map(x => '<span>' + x + '</span>').join('');
    });
  }
  function applyFestivalDates() {
    all('[data-festival-dates]').forEach(el => { const p: [string, string] | undefined = JSON.parse(el.dataset.festivalDates || '{}')[festivalYear.value]; if (p) el.textContent = p[lang === 'en' ? 0 : 1]; });
    applyFestivalCountdowns();
  }
  function applyFestivalFilter() {
    let n = 0; const visible = window.svFestivalVisible || (() => false);
    all('.festival-card').forEach(el => { el.hidden = !visible(el.id.slice('festival-'.length)) || festivalFilter !== 'all' && el.dataset.festivalGroup !== festivalFilter; if (!el.hidden) n++; });
    all('[data-festival-filter]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.festivalFilter === festivalFilter)));
    $('#festival-count').textContent = lang === 'en' ? `${n} events shown · Studio calendar` : `Hiện ${n} dịp · lịch từ Studio`;
  }
  festivalYear.onchange = applyFestivalDates;
  all('[data-festival-filter]').forEach(b => { b.onclick = () => { festivalFilter = b.dataset.festivalFilter || 'all'; applyFestivalFilter(); }; });
  document.addEventListener('sv-festivals-change', () => { filterQuests(); applyFestivalDates(); applyFestivalFilter(); });

  // ---- the example day (Parent settings) ----
  all('[data-demo-day]').forEach(button => { button.onclick = () => {
    all('[data-demo-day]').forEach(b => b.setAttribute('aria-pressed', String(b === button)));
    const out = $('.example-day-detail'); out.dataset.en = button.dataset.labelEn; out.dataset.vi = button.dataset.labelVi; out.textContent = out.dataset[lang] || '';
  }; });

  // ---- the language: every text in both languages on the page (data-en / data-vi), pictures and their words ----
  function translate() {
    all('[data-demo-day]').forEach(b => b.setAttribute('aria-label', pick(b.dataset.labelEn, b.dataset.labelVi)));
    document.documentElement.lang = lang;
    all('[data-en]').forEach(el => { el.innerHTML = el.dataset[lang] || ''; });
    $('#language-button').textContent = lang === 'en' ? 'VI' : 'EN';
    if (EMBED) $('.play-label').textContent = lang === 'en' ? 'Back to game' : 'Trở lại trò chơi';
    all<HTMLImageElement>('[data-image-en]').forEach(img => { img.src = pick(img.dataset.imageEn, img.dataset.imageVi); img.alt = pick(img.dataset.altEn, img.dataset.altVi); });
    all<HTMLImageElement>('[data-static-art]').forEach(img => { img.alt = pick(img.dataset.altEn, img.dataset.altVi); });
    filterQuests(); applyFestivalDates(); applyFestivalFilter();
    if (imageDialog.open && imageSource) showImage(imageSource);
  }
  translate(); route();
}
