/** The overview may have a persistent fold; all five summary tiles start visible. */
export function readAnalyticsLayout() {
  const tiles = [...document.querySelectorAll('#page > .tiles .tile, #page > .analytics-overview .tiles .tile')];
  return {
    tiles: tiles.length,
    visibleTiles: tiles.filter(t => t.getBoundingClientRect().height > 0).length,
    top: document.querySelector<HTMLElement>('#page')!.innerText,
    more: document.querySelectorAll('details.more').length,
    open: document.querySelectorAll('details.more[open]').length,
    kinds: document.querySelectorAll('table.kinds tbody tr').length
  };
}
