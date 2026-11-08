// (v1.08c roads brief, part 2) the family website's four destinations, as typed code. This was a string template in
// docs/website-review-20261023/navigation.mts, written into the page's inline script; the generator now only makes the
// HTML (the groups, the topic pages, the menu and the cards), and this file is the one source of how the page moves
// its sections and shows one page at a time:
//   - the live website (/home) runs it through home/page.ts (built like the rest: tools/build.mts, type-checked);
//   - the design preview (docs/website-review-20261023/prototype.html) gets the same code, made into JavaScript by
//     build-preview.mts, so the two cannot drift apart.
// No imports: the preview inlines this file as it is.

/** the sections each topic page holds, moved there from the long design page (nothing is copied or removed) */
export const DESTINATIONS: Record<string, string[]> = {
  learn: ['games', 'art-guide', 'folk', 'stories'],
  guides: ['rewards', 'festival-overview'],
  family: ['parents', 'parent-controls', 'family-quiz', 'faq', 'help']
};
const PAGES = '.topic-page,.quest-page,.festival-page,.home-page';

/** put every retained section on its topic page (a missing one is an error: a section must never vanish quietly) */
export function moveSections(doc: Document = document): void {
  for (const [page, ids] of Object.entries(DESTINATIONS)) {
    const parent = doc.querySelector('.' + page + '-page');
    if (!parent) throw Error('Missing topic page ' + page);
    for (const id of ids) {
      const node = doc.getElementById(id);
      if (!node) throw Error('Missing retained section ' + id);
      parent.append(node);
    }
  }
  const intro = doc.querySelector('.parent-intro'), family = doc.querySelector('.family-page');
  if (intro && family) family.append(intro);
}

export type RouteHooks = {
  /** a festival card was asked for: show every festival again */
  showAllFestivals: () => void;
  /** a quest was asked for: clear the guide's search so it is not hidden */
  clearSearch: () => void;
};
/** show the page that holds the address's section (#discover when there is none), mark its main destination, open
 *  its menu group, and bring the section into view (focused when the address asked for it) */
export function showRoute(hooks: RouteHooks, doc: Document = document): void {
  let id: string;
  try { id = decodeURIComponent(location.hash.slice(1) || 'discover'); } catch { id = 'discover'; }
  const target = doc.getElementById(id) || doc.getElementById('discover');
  if (!target) return;
  const page = (target.closest(PAGES) || doc.querySelector('.home-page')) as HTMLElement | null;
  if (!page) return;
  doc.querySelectorAll<HTMLElement>(PAGES).forEach(p => { p.hidden = p !== page; });
  const guide = page.classList.contains('quest-page'), festival = page.classList.contains('festival-page');
  const category = guide || festival ? 'guides' : page.dataset.topic || 'discover';
  doc.querySelectorAll('.quick-nav a').forEach(a => { if (a.getAttribute('href') === '#' + category) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
  doc.querySelectorAll<HTMLDetailsElement>('.menu-group').forEach(g => { g.open = g.dataset.menuGroup === category; });
  if (festival && id.startsWith('festival-')) hooks.showAllFestivals();
  if (id.startsWith('quest-')) hooks.clearSearch();
  if (target instanceof HTMLDetailsElement) target.open = true;
  target.scrollIntoView({ behavior: 'instant', block: 'start' });
  if (location.hash) { target.setAttribute('tabindex', '-1'); target.focus({ preventScroll: true }); }
}
