// (Round U, owner 11 Oct: "I can't drag left and right on phone as well as on desktop"; "on a tablet I can't scroll down
// the Map to see the destinations") Every row that scrolls sideways (the Backpack's tabs, the Pad's chips, the wardrobe
// rows…) and every scrolling page in a pop-up (the Pad, Grown-ups) moves under a finger and under a mouse:
//   · a mouse drags a sideways row, and its wheel turns into a sideways scroll there
//   · a finger swipe that the browser did not turn into a scroll (Safari keeps the page's "no gestures" rule more
//     strictly than Chrome) moves the row or the page by hand
// A drag that moved more than a few pixels does not count as a tap on the button under it.
export const ROWS = '.jumpnav, .hubtabs, .pad-tabs, .wrow, .cb-acts, .cb-quick, .festrow, .sg-groups, .mapcities, .mapchips, .hscroll';
export const PAGES = '.pad-body, .modal, .gl, .wardrobe, .rec .rec-body';
const canX = e => e.scrollWidth > e.clientWidth + 2, canY = e => e.scrollHeight > e.clientHeight + 2;

export function installScrollHelp(doc = document) {
  // ---- mouse: drag a sideways row; the wheel scrolls it sideways ----
  let drag = null, moved = false;
  doc.addEventListener('pointerdown', e => {
    if (e.pointerType !== 'mouse' || e.button !== 0) return;
    const row = e.target.closest && e.target.closest(ROWS); if (!row || !canX(row)) return;
    drag = { row, x: e.clientX, left: row.scrollLeft }; moved = false;
  });
  doc.addEventListener('pointermove', e => {
    if (!drag) return; const dx = e.clientX - drag.x;
    if (Math.abs(dx) > 6) moved = true;
    if (moved) { drag.row.scrollLeft = drag.left - dx; drag.row.classList.add('dragging'); }
  });
  const end = () => { if (drag) drag.row.classList.remove('dragging'); drag = null; };
  doc.addEventListener('pointerup', end); doc.addEventListener('pointercancel', end);
  // a drag is not a tap
  doc.addEventListener('click', e => { if (moved) { e.stopPropagation(); e.preventDefault(); moved = false; } }, true);
  doc.addEventListener('wheel', e => {
    const row = e.target.closest && e.target.closest(ROWS); if (!row || !canX(row) || Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
    const before = row.scrollLeft; row.scrollLeft += e.deltaY; if (row.scrollLeft !== before) e.preventDefault();
  }, { passive: false });

  // ---- finger: if the browser did not scroll, scroll by hand ----
  let t = null;
  doc.addEventListener('touchstart', e => {
    if (e.touches.length !== 1) { t = null; return; }
    const tg = e.target.closest ? e.target : null; if (!tg) return;
    t = { x: e.touches[0].clientX, y: e.touches[0].clientY, row: tg.closest(ROWS), page: tg.closest(PAGES), axis: null };
  }, { passive: true });
  doc.addEventListener('touchmove', e => {
    if (!t || e.touches.length !== 1) return;
    const x = e.touches[0].clientX, y = e.touches[0].clientY, dx = x - t.x, dy = y - t.y;
    if (!t.axis) { if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return; t.axis = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y'; }
    const el = t.axis === 'x' ? (t.row && canX(t.row) ? t.row : null) : findY(t.page);
    t.x = x; t.y = y; if (!el) return;
    const before = t.axis === 'x' ? el.scrollLeft : el.scrollTop;
    // let the browser scroll first; only if nothing moved by the next frame, move it by hand
    requestAnimationFrame(() => {
      const now = t && t.axis === 'x' ? el.scrollLeft : el.scrollTop;
      if (now !== before) return;
      if (t && t.axis === 'x') el.scrollLeft -= dx; else el.scrollTop -= dy;
    });
  }, { passive: true });
  doc.addEventListener('touchend', () => { t = null; }, { passive: true });
}
// the nearest page that can scroll up and down: the touched one, or one inside it (a pop-up's card body)
function findY(page) {
  for (let e = page; e; e = e.parentElement && e.parentElement.closest(PAGES)) { if (canY(e)) return e; const inner = e.querySelector('.pad-body'); if (inner && canY(inner)) return inner; }
  return null;
}
