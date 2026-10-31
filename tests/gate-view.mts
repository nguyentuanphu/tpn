import assert from 'node:assert/strict';
import fs from 'node:fs';
import type { Browser } from 'playwright';
import { open, clear, noWelcome } from './harness.mjs';

// #369: the reported Hanoi position, with the camera looking through its real entrance gate.
export async function gateViewCheck(browser: Browser): Promise<string> {
  const dir = 'out/gate-view'; fs.mkdirSync(dir, { recursive: true });
  // (owner, 31 Oct 2026 AEDT) the gates are hidden unless Studio switches them on (a welcome sign stands beside the road
  // instead); this check is about the camera seeing through a gate, so it plays with Studio's 'gates' switch on
  const P = await open(browser, { w: 430, h: 517, touch: true, pre: `try { const l = JSON.parse(localStorage.getItem('sv2_live') || '{}'); l.releases = { ...(l.releases || {}), gates: { on: true } }; localStorage.setItem('sv2_live', JSON.stringify(l)); } catch (e) { }` });
  const rows: { name: string; hit: boolean; faded: boolean; restored: boolean; collidersIntact: boolean }[] = [];
  try {
    await clear(P.page); await noWelcome(P.page);
    for (const [name, w, h] of [['phone', 430, 517], ['tablet', 820, 1180], ['computer', 1180, 820]] as const) {
      await P.page.setViewportSize({ width: w, height: h });
      const row = await P.page.evaluate(async name => {
        const G = window.__sv, h = G.heroes[0], S = G.seeThrough;
        if (!G.scene || !S) throw Error('camera fading unavailable');
        const v = '/js/gfx.js', { THREE }: typeof import('../js/gfx.js') = await import(v);
        const u = '/js/world.js', { CITIES }: typeof import('../js/world.js') = await import(u);
        const state = '/js/state.js', { settings }: typeof import('../js/state.js') = await import(state);
        const city = CITIES.find(c => c.id === 'hanoi'); if (!city) throw Error('Hanoi unavailable');
        const [gx, gz] = city.gates[0];
        const gate = G.scene.children.find(o => o instanceof THREE.Mesh && Math.abs(o.position.x - gx) < .01 && Math.abs(o.position.z - gz) < .01);
        if (!(gate instanceof THREE.Mesh) || Array.isArray(gate.material)) throw Error('real Hanoi gate unavailable');
        G.paused = true; settings.camMode = 'easy';
        const colliders = JSON.stringify(h.world.colliders);
        h.place(150, -130); h.view = 'follow'; h.zoom = 1; h.speed = 0; h.manualCamT = 60;
        h.camYaw = Math.atan2(gx - h.pos.x, gz - h.pos.z); h.camPitch = .55;
        G.scene.updateMatrixWorld(true);
        for (let k = 0; k < 60; k++) { h.finish(.05, k * .05, G, 0); S.step(.05); }
        const head = new THREE.Vector3(h.pos.x, h.pos.y + 1.15, h.pos.z), direction = head.clone().sub(h.cam.position);
        const ray = new THREE.Raycaster(h.cam.position, direction.clone().normalize(), 0, direction.length());
        const hit = ray.intersectObject(gate, true).length > 0;
        const faded = gate.material.transparent && gate.material.opacity <= .3;
        return { name, hit, faded, collidersIntact: JSON.stringify(h.world.colliders) === colliders };
      }, name);
      await P.page.screenshot({ path: `${dir}/${name}.png` });
      const restored = await P.page.evaluate(async () => {
        const G = window.__sv, h = G.heroes[0], S = G.seeThrough; if (!G.scene || !S) throw Error('camera fading unavailable');
        const v = '/js/gfx.js', { THREE }: typeof import('../js/gfx.js') = await import(v);
        const u = '/js/world.js', { CITIES }: typeof import('../js/world.js') = await import(u);
        const city = CITIES.find(c => c.id === 'hanoi'); if (!city) throw Error('Hanoi unavailable');
        const [gx, gz] = city.gates[0];
        const gate = G.scene.children.find(o => o instanceof THREE.Mesh && Math.abs(o.position.x - gx) < .01 && Math.abs(o.position.z - gz) < .01);
        if (!(gate instanceof THREE.Mesh) || Array.isArray(gate.material)) throw Error('real Hanoi gate unavailable');
        h.place(0, -230);
        for (let k = 0; k < 60; k++) { h.finish(.05, k * .05, G, 0); S.step(.05); }
        return gate.material.opacity === 1 && !gate.material.transparent;
      });
      rows.push({ ...row, restored }); fs.writeFileSync(`${dir}/observations.json`, JSON.stringify(rows, null, 2));
    }
    assert.ok(rows.every(row => row.hit), 'fixture camera must actually see the blocking gate: ' + JSON.stringify(rows));
    assert.ok(rows.every(row => row.faded), 'Hanoi gate blocks the child without fading: ' + JSON.stringify(rows));
    assert.ok(rows.every(row => row.restored && row.collidersIntact), 'fading changes solid geometry or fails to restore: ' + JSON.stringify(rows));
    assert.deepEqual(P.errors, []);
    return 'real Hanoi gate fades from the reported 150,-130 position at 430x517, tablet and computer sizes; collision data stays intact and materials restore';
  } finally { await P.ctx.close(); }
}
