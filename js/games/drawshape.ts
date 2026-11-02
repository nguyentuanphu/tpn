// Draw a Shape's recogniser (js/games/drawing.ts): how many corners a child's closed stroke has. Kept on its own, with
// no screen code, so the unit test checks it on wobbly strokes (tests/unit/drawshape.test.mts).
type Pt = { x: number; y: number };
// how many corners a closed stroke has (0 for a round one), or -1 when it is not closed or too small
export function cornersOf(pts: Pt[]): number {
  if (pts.length < 8) return -1;
  const xs = pts.map(p => p.x), ys = pts.map(p => p.y), size = Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys));
  if (size < 40 || Math.hypot(pts[0].x - pts[pts.length - 1].x, pts[0].y - pts[pts.length - 1].y) > size * .3) return -1;
  const cx = xs.reduce((a, b) => a + b, 0) / xs.length, cy = ys.reduce((a, b) => a + b, 0) / ys.length, rs = pts.map(p => Math.hypot(p.x - cx, p.y - cy)), mr = rs.reduce((a, b) => a + b, 0) / rs.length;
  if (Math.sqrt(rs.reduce((a, r) => a + (r - mr) ** 2, 0) / rs.length) / mr < .1) return 0;
  // the stroke made simple (Ramer–Douglas–Peucker), then the sharp turns counted
  const rdp = (P: Pt[], e: number): Pt[] => { let d = 0, k = 0; const a = P[0], b = P[P.length - 1], L = Math.hypot(b.x - a.x, b.y - a.y) || 1;
    for (let i = 1; i < P.length - 1; i++) { const di = Math.abs((b.y - a.y) * P[i].x - (b.x - a.x) * P[i].y + b.x * a.y - b.y * a.x) / L; if (di > d) { d = di; k = i; } }
    return d > e ? [...rdp(P.slice(0, k + 1), e).slice(0, -1), ...rdp(P.slice(k), e)] : [a, b]; };
  // (a closed loop starts and ends at one point, which would make every distance zero: split it at its farthest point)
  const far = rs.indexOf(Math.max(...rs)), loop = [...pts.slice(far), ...pts.slice(0, far), pts[far]], o = loop[0];
  const mid = loop.reduce((k, q, i) => Math.hypot(q.x - o.x, q.y - o.y) > Math.hypot(loop[k].x - o.x, loop[k].y - o.y) ? i : k, 0), e = size * .13;
  const S = [...rdp(loop.slice(0, mid + 1), e).slice(0, -1), ...rdp(loop.slice(mid), e).slice(0, -1)];
  // (a shaky hand makes two corners close together: they count as one)
  const C: Pt[] = []; for (let i = 0; i < S.length; i++) { const a = S[(i - 1 + S.length) % S.length], b = S[i], q = S[(i + 1) % S.length], ang = Math.abs(Math.atan2(a.y - b.y, a.x - b.x) - Math.atan2(q.y - b.y, q.x - b.x)), turn = Math.min(ang, Math.PI * 2 - ang); if (turn < Math.PI * .8) C.push(b); }
  const kept = C.filter((b, i) => !C.slice(0, i).some(a => Math.hypot(a.x - b.x, a.y - b.y) < size * .25));
  return kept.length;
}
