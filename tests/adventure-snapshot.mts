/** Diagnostics preserve the existing adventure walking assertion. */
export function adventureWalkSnapshot() {
  const g = window.__sv as any, h = g.heroes[0], trail = g.adventure.trails.get(h);
  const modal = !!document.querySelector('.modal.advwin'), trails = g.adventure.trails.size;
  const walking = !!(h.goal || trail?.walk);
  return { valid: !modal && trails === 1 && walking, modal, trails, walking,
    paused: g.paused, step: g.adventure.today(h).step, x: h.pos.x, z: h.pos.z,
    blockers: [...document.querySelectorAll('.modal,.dialog,.reward,.storybook')].map(e => e.className) };
}
