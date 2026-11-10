// Check `petskills` (Meshy pets, owner 10 Nov 2026 AEDT: "Mỗi con sẽ có một skills đặc biệt riêng"): each pet's own skills
// (js/pets.ts PET_SKILLS). The puppy's:
//   1. fetch: "Throw the ball" next to the puppy throws a ball ahead; the puppy runs to it, carries it in its mouth and
//      brings it back to the child's feet;
//   2. dig for treasure: the puppy digs (the dig move when its model has it) and the child gets 2 coins, counted for the
//      day (at most 5 a day);
//   3. lead the way: "lead the way!" with a far goal sends the puppy on ahead towards it; it stops at the goal.
import { open } from './harness.mts';

const ok = (c: unknown, msg: string) => { if (!c) throw new Error(msg); };

export async function petSkillsCheck(b) {
  const P = await open(b, { w: 1180, h: 820 });
  try {
    const wait = (ms: number) => P.page.waitForTimeout(ms);
    const ready = await P.page.evaluate(async () => {
      const G = (window as any).__sv; for (let i = 0; i < 100 && !(G.pets && G.pets.live && G.pets.live().length); i++) await new Promise(r => setTimeout(r, 100));
      const h = G.heroes[0], L = G.pets.live().find((x: any) => x.h === h && x.pt.kind === 'puppy');
      if (!L) return { err: 'the first child has no puppy following' };
      G.paused = false; document.querySelectorAll('.storybook, .dialog, .modal, .reward').forEach(e => e.remove());
      return { ok: true };
    });
    ok(!ready.err, ready.err);
    // 1. fetch
    const thrown = await P.page.evaluate(() => {
      const G = (window as any).__sv, h = G.heroes[0], it = G.interactables.find((x: any) => x.id === 'fetch0');
      if (!it) return { err: 'no "Throw the ball" next to the puppy' };
      if (!it.visible(h)) return { err: '"Throw the ball" is hidden' };
      it.act(h); const L = G.pets.live()[0]; return { stage: L.task && L.task.stage };
    });
    ok(!thrown.err, thrown.err); ok(thrown.stage === 'fly', `the ball was not thrown: ${JSON.stringify(thrown)}`);
    let seen = new Set<string>(), back: any = null;
    for (let i = 0; i < 60; i++) {
      await wait(500);
      const s = await P.page.evaluate(() => { const G = (window as any).__sv, h = G.heroes[0], L = G.pets.live()[0];
        return { stage: L.task ? L.task.stage : 'done', held: !!(L.ball && L.ball.parent && L.ball.parent !== G.scene), d: Math.hypot(L.obj.position.x - h.pos.x, L.obj.position.z - h.pos.z), clip: L.obj.userData.rig.clip }; });
      seen.add(s.stage + (s.held ? '+held' : ''));
      if (s.stage === 'done') { back = s; break; }
    }
    ok(back, `the puppy did not bring the ball back in 30 s (stages seen: ${[...seen].join(', ')})`);
    ok(seen.has('back+held'), `the puppy did not carry the ball in its mouth (stages seen: ${[...seen].join(', ')})`);
    ok(back.d < 2.5, `the puppy dropped the ball ${back.d.toFixed(1)} m from the child`);
    // 2. dig
    const before = await P.page.evaluate(async () => { const S = await import(String('/js/state.js')); const G = (window as any).__sv, L = G.pets.live()[0];
      L.task = { kind: 'dig', t: 0 }; return { coins: S.farm.coins, digs: L.pt.digDay === new Date().toDateString() ? L.pt.digs || 0 : 0 }; });
    let dug: any = null, dclip = '';
    for (let i = 0; i < 40; i++) {
      await wait(400);
      const s = await P.page.evaluate(async () => { const S = await import(String('/js/state.js')); const G = (window as any).__sv, L = G.pets.live()[0];
        return { busy: !!L.task, coins: S.farm.coins, digs: L.pt.digs || 0, clip: L.obj.userData.rig.clip, model: !!L.obj.userData.rig.model }; });
      if (s.clip === 'dig') dclip = 'dig';
      if (!s.busy) { dug = s; break; }
    }
    ok(dug, 'the puppy did not finish digging in 16 s');
    ok(dug.coins === before.coins + 2, `digging gave ${dug.coins - before.coins} coins, not 2`);
    ok(dug.digs === before.digs + 1, `the day's digs went ${before.digs} to ${dug.digs}`);
    if (dug.model) ok(dclip === 'dig', 'the puppy\'s model did not play its dig move');
    // 3. lead the way
    const led = await P.page.evaluate(() => {
      const G = (window as any).__sv, h = G.heroes[0], L = G.pets.live()[0];
      h.walkTo = { x: h.pos.x + 45, z: h.pos.z, name: 'the test goal' };
      const it = G.interactables.find((x: any) => x.id === 'lead0');
      if (!it) return { err: 'no "lead the way" next to the puppy' };
      if (!it.visible(h)) return { err: '"lead the way" is hidden with a goal 45 m away' };
      it.act(h); return { kind: L.task && L.task.kind };
    });
    ok(!led.err, led.err); ok(led.kind === 'lead', 'the puppy did not start leading');
    await wait(3000);
    const ahead = await P.page.evaluate(() => { const G = (window as any).__sv, h = G.heroes[0], L = G.pets.live()[0]; return { dx: L.obj.position.x - h.pos.x, task: L.task && L.task.kind }; });
    ok(ahead.task === 'lead' && ahead.dx > 2, `the puppy is not on ahead towards the goal: ${JSON.stringify(ahead)}`);
    const end = await P.page.evaluate(async () => { const G = (window as any).__sv, h = G.heroes[0], L = G.pets.live()[0];
      h.place(h.walkTo.x - 3, h.walkTo.z); for (let i = 0; i < 40 && L.task; i++) await new Promise(r => setTimeout(r, 100)); return { task: L.task && L.task.kind }; });
    ok(!end.task, 'the puppy kept leading at the goal');
    const errs = P.errors.filter(e => !/creature-|world model/.test(e));
    ok(!errs.length, errs.join('; '));
    console.log('  petskills: fetch', [...seen].join('>'), '; dig +2 coins', dclip ? '(dig move)' : '(code shape)', '; lead ahead', ahead.dx.toFixed(1), 'm');
  } finally { await P.ctx.close(); }
}
