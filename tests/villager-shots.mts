// (v1.08e villagers) the 11 named villagers before (the code person) and after (their Blender model), and a crowd of code
// people in the new style, on a phone, a tablet and a computer: node tests/villager-shots.mts <out folder>
import { launch, open, clear } from './harness.mts';
import fs from 'fs';
const out = process.argv[2] || 'docs/world-models-v108e/villagers';
fs.mkdirSync(out, { recursive: true });
const b = await launch();
const ALL = { phone: [390, 844], tablet: [820, 1180], computer: [1280, 800] }, SIZES = process.env.DEV ? { [process.env.DEV]: ALL[process.env.DEV] } : ALL;
for (const [dev, [w, h]] of Object.entries(SIZES)) {
  const P = await open(b, { w, h }); await clear(P.page);
  for (const kind of ['named', 'crowd']) {
    const png = await P.page.evaluate(async ({ w, h, kind }) => {
      const A = await import('/js/avatar.js'), { THREE } = await import('/js/gfx.js'), G = (window as any).__sv;
      const IDS = ['mai', 'ba', 'teo', 'ti', 'bong', 'su', 'jack', 'mit', 'bom', 'ruby', 'lan'];
      const r = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true }); r.setSize(w, h); r.setPixelRatio(1); r.outputColorSpace = THREE.SRGBColorSpace;
      const sc = new THREE.Scene(); sc.add(new THREE.HemisphereLight('#ffffff', '#8a9a70', 1.6)); const d = new THREE.DirectionalLight('#ffffff', 1.6); d.position.set(2, 4, 5); sc.add(d);
      const people: any[] = [];
      if (kind === 'named') for (const id of IDS) {
        const look = G.npcs.find((n: any) => n.id === id).A.look;
        const before = A.buildAvatar(look); await A.loadFriendModels('villager-' + id); const after = A.buildAvatar(look); A.wearVillagerModel(after, 'villager-' + id);
        people.push(before, after);
      } else {
        const L = (style: string, color: string, hair: string, hairStyle: string, skin: string, age?: string) => ({ style, color, hair, hairStyle, hat: 'none', skin, back: 'none', glider: 0, age });
        [L('shirt', '#f2f2f2', '#1a1410', 'short', '#e8b48c'), L('aodai', '#7a4aa0', '#1a1410', 'long', '#f0c6a0', 'adult'), L('tunic', '#6b4a2a', '#8a8a8a', 'buns', '#c98d62', 'elder'),
          L('overalls', '#5b7fbf', '#3b2618', 'ponytail', '#f6c7a5'), L('dress', '#ff7eb8', '#a8432a', 'buns', '#ffe3d1'), L('shirt', '#3b6fe0', '#e8c26a', 'spiky', '#ffe3d1'),
          L('hoodie', '#9a6bff', '#1d1412', 'long', '#8d5a3c', 'adult'), L('shirt', '#5bbf6a', '#1d1412', 'short', '#c98d62', 'adult')].forEach(l => people.push(A.buildAvatar(l)));
      }
      // a row (or two on a tall screen): before and after side by side for the named ones
      const n = people.length, cols = kind === 'named' ? (w > h ? 11 : 4) : (w > h ? 8 : 4), rows = Math.ceil(n / (kind === 'named' ? 2 * Math.min(cols, 11) / 2 : cols));
      const per = kind === 'named' ? 2 : 1, perRow = kind === 'named' ? (w > h ? 6 : 2) : cols, rws = Math.ceil(n / per / perRow);
      const cellW = w / (perRow * per), cellH = h / rws, span = 2.7, cam = new THREE.OrthographicCamera(-span / 2 * cellW / cellH, span / 2 * cellW / cellH, span / 2, -span / 2, -10, 10);
      cam.position.set(0, 1.2, 3); cam.lookAt(0, 1.2, 0);
      r.setScissorTest(true); r.setClearColor('#bfe3f2'); r.setScissor(0, 0, w, h); r.clear();
      people.forEach((p, i) => { sc.add(p.root); p.root.visible = false; A.animate(p, 'idle', 1); });
      people.forEach((p, i) => {
        const k = Math.floor(i / per), cx = (k % perRow) * per + (i % per), cy = Math.floor(k / perRow);
        p.root.visible = true; p.root.rotation.y = .35; p.root.updateMatrixWorld(true);
        const x0 = Math.floor(cx * cellW), y0 = Math.floor(h - (cy + 1) * cellH); r.setViewport(x0, y0, Math.floor(cellW), Math.floor(cellH)); r.setScissor(x0 + 1, y0 + 1, Math.floor(cellW) - 2, Math.floor(cellH) - 2);
        r.render(sc, cam); p.root.visible = false;
      });
      const url = r.domElement.toDataURL('image/png'); r.dispose(); return url;
    }, { w, h, kind });
    fs.writeFileSync(`${out}/after-${kind}-${dev}.png`, Buffer.from(png.split(',')[1], 'base64'));
  }
  if (P.errors.length) console.log(dev, P.errors.slice(0, 3));
  await P.ctx.close();
}
await b.close(); console.log('shots in', out);
