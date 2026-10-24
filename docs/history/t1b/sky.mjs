import { launch, open } from '../../../tests/harness.mjs';
import fs from 'fs';
const out = process.argv[2]; fs.mkdirSync(out, { recursive: true });
const b = await launch(); const { page } = await open(b, { w: 1000, h: 700, fast: false });
const places = process.argv[3] ? process.argv[3].split(',') : ['aussie', 'bacninh', 'village', 'town', 'china', 'india', 'market', 'hanoi'];
for (const id of places) {
  const url = await page.evaluate(async id => {
    const THREE = (await import('/js/gfx.js')).THREE; const { PLACES, anchorOf } = await import('/js/content/map.js');
    const G = __sv; const [x, z] = anchorOf(id); const R = 34;
    const cam = new THREE.OrthographicCamera(-R, R, R * .7, -R * .7, 1, 400); cam.position.set(x, 150, z + .01); cam.up.set(0, 0, -1); cam.lookAt(x, 0, z); cam.layers.enableAll();
    const r = G.renderer; const pr = r.getPixelRatio(); r.setPixelRatio(1); r.setSize(1000, 700, false); r.render(G.scene, cam);
    const d = r.domElement.toDataURL('image/png'); r.setPixelRatio(pr); return d;
  }, id);
  fs.writeFileSync(`${out}/${id}.png`, Buffer.from(url.split(',')[1], 'base64'));
  console.log(id);
}
await b.close();
