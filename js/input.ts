// Controls for up to two players: a floating joystick and camera-drag area per screen half,
// on-screen buttons, keyboard, and game controllers.
export class Pad {
  constructor() { this.mx = 0; this.mz = 0; this.cdx = 0; this.cdy = 0; this.run = false; this.jumpHeld = false; this._jump = false; this._act = false; this._menu = false; }
  jump() { const v = this._jump; this._jump = false; return v; }
  act() { const v = this._act; this._act = false; return v; }
  menu() { const v = this._menu; this._menu = false; return v; }
}
export const pads = [new Pad(), new Pad()];

// rects: function returning [{x,y,w,h}] in CSS pixels for each active player
// onTap(player, x, y) is called for a quick tap (used for tap-to-walk).
export function initInput(canvas, rects, isBlocked, onTap) {
  const touches = new Map(); // pointerId -> {p, kind:'stick'|'cam', x0,y0,x,y, el}
  const which = (x, y) => { const r = rects(); for (let i = 0; i < r.length; i++) { const q = r[i]; if (x >= q.x && x < q.x + q.w && y >= q.y && y < q.y + q.h) return i; } return -1; };
  const stickEls = [0, 1].map(() => { const b = document.createElement('div'); b.className = 'stick'; b.innerHTML = '<i></i>'; b.hidden = true; document.body.appendChild(b); return b; });
  canvas.addEventListener('pointerdown', e => {
    if (isBlocked()) return;
    const p = which(e.clientX, e.clientY); if (p < 0) return;
    // (a half turned round for the player at the far end: their left is the screen's right, their up the screen's down)
    const r = rects()[p], s = r.rot === 180 ? -1 : 1, left = (s > 0 ? e.clientX - r.x : r.x + r.w - e.clientX) < r.w * .45;
    const kind = left && e.pointerType !== 'mouse' ? 'stick' : 'cam';
    if (kind === 'stick' && [...touches.values()].some(t => t.p === p && t.kind === 'stick')) return;
    touches.set(e.pointerId, { p, kind, s, x0: e.clientX, y0: e.clientY, x: e.clientX, y: e.clientY, t0: performance.now(), moved: 0 });
    if (kind === 'stick') { const s = stickEls[p]; s.style.left = e.clientX + 'px'; s.style.top = e.clientY + 'px'; s.firstChild.style.transform = ''; }
    try { canvas.setPointerCapture(e.pointerId); } catch (err) { }
  });
  canvas.addEventListener('pointermove', e => {
    const t = touches.get(e.pointerId); if (!t) return;
    const pad = pads[t.p];
    if (t.kind === 'stick') {
      let dx = e.clientX - t.x0, dy = e.clientY - t.y0; const d = Math.hypot(dx, dy), R = 55;
      if (d > R) { dx = dx / d * R; dy = dy / d * R; }
      if (t.moved + d > 14) { stickEls[t.p].hidden = false; pad.mx = t.s * dx / R; pad.mz = -t.s * dy / R; pad.goal = null; }
      stickEls[t.p].firstChild.style.transform = `translate(${dx}px,${dy}px)`;
    } else { pad.cdx += t.s * (e.clientX - t.x); pad.cdy += t.s * (e.clientY - t.y); }
    t.moved += Math.abs(e.clientX - t.x) + Math.abs(e.clientY - t.y);
    t.x = e.clientX; t.y = e.clientY;
  });
  const end = e => {
    const t = touches.get(e.pointerId); if (!t) return; touches.delete(e.pointerId);
    // a short tap that hardly moved = "walk there"
    if (e.type === 'pointerup' && t.moved < 14 && performance.now() - t.t0 < 350 && onTap) onTap(t.p, e.clientX, e.clientY);
    if (t.kind === 'stick') { pads[t.p].mx = 0; pads[t.p].mz = 0; stickEls[t.p].hidden = true; }
  };
  canvas.addEventListener('pointerup', end); canvas.addEventListener('pointercancel', end); canvas.addEventListener('lostpointercapture', end);

  // Keyboard: player 1 = WASD (+ arrows when alone), Space jump, Shift run, E/Enter act, Q/R camera, Tab menu.
  // Player 2 = arrows, / jump, . act, , run, [ ] camera.
  const keys = new Set();
  const onKey = (e, down) => {
    if (isBlocked() && down) return;
    const k = e.code; if (down) keys.add(k); else keys.delete(k);
    const two = rects().length > 1;
    if (down && !e.repeat) {
      if (k === 'Space') pads[0]._jump = true;
      if (k === 'KeyE' || (k === 'Enter' && !two)) pads[0]._act = true;
      if (k === 'Tab') { pads[0]._menu = true; e.preventDefault(); }
      if (two && k === 'Slash') pads[1]._jump = true;
      if (two && (k === 'Period' || k === 'Enter')) pads[1]._act = true;
    }
    if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(k)) e.preventDefault();
  };
  window.addEventListener('keydown', e => onKey(e, true)); window.addEventListener('keyup', e => onKey(e, false));
  window.addEventListener('blur', () => keys.clear());

  // Mouse wheel zoom is handled by main; here just return a polling function.
  return function poll(dt) {
    const two = rects().length > 1;
    const kb = (up, dn, lf, rt) => [(keys.has(rt) ? 1 : 0) - (keys.has(lf) ? 1 : 0), (keys.has(up) ? 1 : 0) - (keys.has(dn) ? 1 : 0)];
    const p0 = kb('KeyW', 'KeyS', 'KeyA', 'KeyD'), arrows = kb('ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight');
    const stickActive = i => [...touches.values()].some(t => t.p === i && t.kind === 'stick');
    if (!stickActive(0)) { const m = two ? p0 : [p0[0] || arrows[0], p0[1] || arrows[1]]; pads[0].mx = m[0]; pads[0].mz = m[1]; }
    if (two && !stickActive(1)) { pads[1].mx = arrows[0]; pads[1].mz = arrows[1]; }
    pads[0].run = keys.has('ShiftLeft') || pads[0]._btnRun; pads[0].jumpHeld = keys.has('Space') || pads[0]._btnJump;
    pads[1].run = keys.has('Comma') || pads[1]._btnRun; pads[1].jumpHeld = keys.has('Slash') || pads[1]._btnJump;
    if (keys.has('KeyQ')) pads[0].cdx -= 400 * dt; if (keys.has('KeyR')) pads[0].cdx += 400 * dt;
    if (keys.has('BracketLeft')) pads[1].cdx -= 400 * dt; if (keys.has('BracketRight')) pads[1].cdx += 400 * dt;
    // Game controllers: left stick move, right stick camera, A act, B run, X/Y jump, Start menu.
    const gps = navigator.getGamepads ? [...navigator.getGamepads()].filter(Boolean) : [];
    gps.slice(0, 2).forEach((g, i) => {
      const pad = pads[i], dz = v => Math.abs(v) < .15 ? 0 : v;
      const lx = dz(g.axes[0] || 0), ly = dz(g.axes[1] || 0), rx = dz(g.axes[2] || 0), ry = dz(g.axes[3] || 0);
      if (lx || ly) { pad.mx = lx; pad.mz = -ly; }
      pad.cdx += rx * 500 * dt; pad.cdy += ry * 300 * dt;
      const b = n => g.buttons[n] && g.buttons[n].pressed;
      pad._gp = pad._gp || {};
      const edge = (n, f) => { const v = b(n); if (v && !pad._gp[n]) f(); pad._gp[n] = v; };
      edge(0, () => pad._act = true); edge(2, () => pad._jump = true); edge(3, () => pad._jump = true); edge(9, () => pad._menu = true);
      if (b(1)) pad.run = true; if (b(2) || b(3)) pad.jumpHeld = true;
    });
  };
}
