/** Diagnostics preserve the existing adventure walking assertion. */
export function adventureWalkSnapshot() {
  const g = window.__sv as any, h = g.heroes[0], trail = g.adventure.trails.get(h);
  const modal = !!document.querySelector('.modal.advwin'), trails = g.adventure.trails.size;
  const walking = !!(h.goal || trail?.walk);
  return { valid: !modal && trails === 1 && walking, modal, trails, walking,
    paused: g.paused, step: g.adventure.today(h).step, x: h.pos.x, z: h.pos.z,
    blockers: [...document.querySelectorAll('.modal,.dialog,.reward,.storybook')].map(e => e.className) };
}

/** The original missed-day and chest fixture, with a snapshot at its existing deadline. */
export async function adventureDaySnapshot() { const G = window.__sv as any, h = G.heroes[0], A = G.adventure, r = A.today(h), d = r.day;
      Object.assign(r, { day: d - 1, stamps: [d - 5, d - 3], last: 'house', lastDay: d - 1, done: true, told: false });
      const r2 = A.today(h); const kept = r2.stamps.length, fresh = r2.id && !r2.done && r2.day === d;
      await new Promise<void>(res => setTimeout(res, 1600)); const observedAtOldDeadline = r2.told === d;
      const diagnostic = {paused:G.paused, blockers:[...document.querySelectorAll('.modal,.dialog,.reward,.storybook,.howto,.resttime,.dancebreak,.bedtime,.songs,.gl')].map(e=>e.className), day:r2.day, expectedDay:d, told:r2.told, id:r2.id, step:r2.step, observedAtOldDeadline};
      // The updater runs once a second and delivers a queued step clue first.
      // Preserve the assertion; wait for its state rather than racing that scheduler.
      const deadline=performance.now()+3400;
      while(r2.told!==d&&performance.now()<deadline)await new Promise<void>(resolve=>setTimeout(resolve,100));
      const told=r2.told===d;
      r2.stamps = [d - 6, d - 5, d - 4, d - 3, d - 2, d - 1]; const pet = h.profile.lanterns = h.profile.lanterns || {}; pet.pet = pet.pet || {}; pet.pet.hats = [];
      r2.prizes = []; A.finish(h); await new Promise<void>(res => setTimeout(res, 2500)); document.querySelectorAll<HTMLElement>('.advchest .adv-coin').forEach(c => c.click());
      for (let k = 0; k < 20 && document.querySelector('.modal.advchest'); k++) { document.querySelectorAll<HTMLElement>('.advchest .adv-go:not([hidden])').forEach(b => b.click()); await new Promise<void>(res => setTimeout(res, 500)); }
      return { kept, fresh, told, diagnostic, chests: r2.chests, stamps: r2.stamps.length, hat: (h.profile.lanterns.pet.hats || []).includes('party') };
}

/** Start far from the target, independent of introductory walking already in progress. */
export async function seedAdventureWalk(age: string) {
  const g=window.__sv as any,h=g.heroes[0];h.profile.age=age;h.goal=null;h.goalAct=null;
  const [x,z]=(await import(String('/js/content/map.js'))).anchorOf('plateau');h.place(x,z);
  // A visual frame may be skipped by the battery cap. Keep the fixture's region in sync
  // with its explicit teleport before force() performs its immediate arrival check.
  g.regionOf[0]=(await import(String('/js/world.js'))).regionAt(x,z);
  if(g.regionOf[0]!=='plateau')throw Error('Adventure fixture did not start on the plateau');
  g.adventure.force(0,'house');
}
