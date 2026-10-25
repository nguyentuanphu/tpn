/** A report control stays outside HUD/game stacking contexts. Position is device-local. */
export function floatReportButton(button: HTMLButtonElement, anchor: HTMLElement, seat: number, open: () => void, quick: () => void): () => void {
  const key = `sv2_report_position_${seat}`;
  let saved: { x: number; y: number } | undefined;
  try { const p = JSON.parse(localStorage.getItem(key) || 'null'); if (Number.isFinite(p?.x) && Number.isFinite(p?.y)) saved = p; } catch {}
  let down: { id: number; x: number; y: number; left: number; top: number } | undefined;
  let moved = false, held = false, lastTap = 0;
  let hold: ReturnType<typeof setTimeout> | undefined, tap: ReturnType<typeof setTimeout> | undefined;
  const stopHold = () => { clearTimeout(hold); hold = undefined; };
  button.classList.add('tester-floating');
  button.dataset.testerPlayer = String(seat);
  document.body.append(button);
  const bounds = () => {
    const s = getComputedStyle(button), v = visualViewport;
    const left = (v?.offsetLeft || 0) + 8 + (parseFloat(s.getPropertyValue('--safe-left')) || 0);
    const top = (v?.offsetTop || 0) + 8 + (parseFloat(s.getPropertyValue('--safe-top')) || 0);
    return { left, top, right: Math.max(left, (v?.offsetLeft || 0) + (v?.width || innerWidth) - button.offsetWidth - 8 - (parseFloat(s.getPropertyValue('--safe-right')) || 0)), bottom: Math.max(top, (v?.offsetTop || 0) + (v?.height || innerHeight) - button.offsetHeight - 8 - (parseFloat(s.getPropertyValue('--safe-bottom')) || 0)) };
  };
  const place = (x: number, y: number) => { const b = bounds(); button.style.left = `${Math.max(b.left, Math.min(b.right, x))}px`; button.style.top = `${Math.max(b.top, Math.min(b.bottom, y))}px`; };
  const layout = () => { const b = bounds(), a = anchor.getBoundingClientRect(); place(saved ? b.left + saved.x * (b.right - b.left) : a.right - button.offsetWidth, saved ? b.top + saved.y * (b.bottom - b.top) : a.bottom + 8); };
  const remember = () => { const b = bounds(), r = button.getBoundingClientRect(); saved = { x: (r.left - b.left) / Math.max(1, b.right - b.left), y: (r.top - b.top) / Math.max(1, b.bottom - b.top) }; try { localStorage.setItem(key, JSON.stringify(saved)); } catch {} };
  const reset = () => { clearTimeout(tap); stopHold(); lastTap = 0; saved = undefined; try { localStorage.removeItem(key); } catch {} layout(); };
  const start = (e: PointerEvent) => {
    if (down || e.button !== 0) return;
    e.preventDefault(); e.stopPropagation(); clearTimeout(tap);
    const r = button.getBoundingClientRect(); down = { id: e.pointerId, x: e.clientX, y: e.clientY, left: r.left, top: r.top }; moved = held = false;
    button.setPointerCapture(e.pointerId);
    hold = setTimeout(() => { held = true; lastTap = 0; quick(); }, 700);
  };
  const move = (e: PointerEvent) => {
    if (!down || e.pointerId !== down.id) return;
    e.preventDefault(); e.stopPropagation();
    if (Math.hypot(e.clientX - down.x, e.clientY - down.y) > 8) { moved = true; stopHold(); lastTap = 0; }
    if (moved) place(down.left + e.clientX - down.x, down.top + e.clientY - down.y);
  };
  const end = (e: PointerEvent) => {
    if (!down || e.pointerId !== down.id) return;
    e.preventDefault(); e.stopPropagation(); stopHold(); down = undefined;
    if (button.hasPointerCapture(e.pointerId)) button.releasePointerCapture(e.pointerId);
    if (moved) { remember(); return; }
    if (held || e.type !== 'pointerup') return;
    const now = performance.now();
    if (lastTap && now - lastTap < 350) { reset(); return; }
    lastTap = now; tap = setTimeout(() => { lastTap = 0; open(); }, 350);
  };
  const keydown = (e: KeyboardEvent) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); clearTimeout(tap); open(); } else if (e.key === 'Home') { e.preventDefault(); reset(); } };
  const click = (e: MouseEvent) => { e.stopPropagation(); if (e.detail === 0 && !held && !moved) open(); };
  const dblclick = (e: MouseEvent) => { e.preventDefault(); e.stopPropagation(); reset(); };
  button.addEventListener('pointerdown', start); button.addEventListener('pointermove', move); button.addEventListener('pointerup', end); button.addEventListener('pointercancel', end); button.addEventListener('lostpointercapture', end);
  button.addEventListener('keydown', keydown); button.addEventListener('click', click); button.addEventListener('dblclick', dblclick);
  addEventListener('resize', layout); visualViewport?.addEventListener('resize', layout); visualViewport?.addEventListener('scroll', layout); layout();
  return () => { stopHold(); clearTimeout(tap); removeEventListener('resize', layout); visualViewport?.removeEventListener('resize', layout); visualViewport?.removeEventListener('scroll', layout); button.remove(); };
}
