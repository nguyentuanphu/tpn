// Road screenshots for v1.07 roads (issue #34): the same spots and camera on phone, tablet and computer.
// Run from tests/ with the game served on :8765:  node ../docs/roads-concept-d/capture.mts before|after
import fs from 'node:fs';
import { launch, open, clear, noWelcome } from '../../tests/harness.mts';
const tag = process.argv[2] || 'after', dir = new URL('.', import.meta.url).pathname;
// [name, hero x, z, camera yaw (radians, 0 = looking +z), pitch, zoom]
const SPOTS = [
  ['town', 30, -24, -Math.PI / 2, .5, 1.1],          // island_e road at Phố Hai Quê's east gate
  ['village', 166, -38, Math.PI / 2, .55, 1.1],      // Làng Sen: village_link asphalt into the dirt lane
  ['island-ring', 92, -40, 0, .5, 1.2],              // the ring road round the home island
  ['dirt-path', 125, 86, Math.PI / 2, .55, 1.0],     // mv_e1 dirt road to the Memory Village
  ['crossing-vn', 147, 3, Math.PI * .75, .6, 1.3],   // link_vn meets vn_north / vn_south
  ['crossing-au', -126, -61, -Math.PI * .75, .6, 1.3], // aussie_road T off the Australia road
  ['footpath', 166, 92, Math.PI, .55, 1.0],          // hoian_walk
];
const SIZES = [['phone', 390, 844], ['tablet', 820, 1180], ['computer', 1180, 820]];
const b = await launch(), P = await open(b, { w: 1180, h: 820, touch: false, settings: { quality: 'high' } });
await clear(P.page); await noWelcome(P.page);
await P.page.evaluate(() => { const r = window.__sv.renderer; r.setPixelRatio(1); dispatchEvent(new Event('resize')); });
for (const [size, w, h] of SIZES) {
  await P.page.setViewportSize({ width: w, height: h });
  for (const [name, x, z, yaw, pitch, zoom] of SPOTS) {
    await P.page.evaluate(async ([x, z, yaw, pitch, zoom]) => {
      const G = window.__sv, H = G.heroes[0]; document.querySelectorAll('.storybook, .dialog, .modal, .vc-pop, .reward').forEach(e => e.remove());
      G.paused = false; H.place(x, z); H.view = 'follow'; H.zoom = zoom; H.speed = 0; H.manualCamT = 60; H.camYaw = yaw; H.camPitch = pitch;
    }, [x, z, yaw, pitch, zoom]);
    await P.page.waitForTimeout(1500);
    await P.page.evaluate(([yaw, pitch]) => { const H = window.__sv.heroes[0]; H.camYaw = yaw; H.camPitch = pitch; H.manualCamT = 60; }, [yaw, pitch]);
    await P.page.waitForTimeout(700);
    await P.page.screenshot({ path: `${dir}${tag}-${name}-${size}.jpg`, type: 'jpeg', quality: 72 });
  }
}
console.log(tag, 'errors:', P.errors.slice(0, 5));
await P.ctx.close(); await b.close();
