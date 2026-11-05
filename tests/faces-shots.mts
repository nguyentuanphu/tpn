// (v1.08e faces) close-ups of the four friends and three villagers, eyes open, mid-blink and in their moods, on a phone,
// a tablet and a computer: node tests/faces-shots.mts <out folder> [before|after] (the game server on :8765)
import { launch, open, clear } from './harness.mts';
import fs from 'fs';
const out = process.argv[2] || 'docs/world-models-v108e/faces', tag = process.argv[3] || 'after';
fs.mkdirSync(out, { recursive: true });
const b = await launch();
const ALL = { phone: [390, 844], tablet: [820, 1180], computer: [1280, 800] }, SIZES = process.env.DEV ? { [process.env.DEV]: ALL[process.env.DEV] } : ALL;
for (const [dev, [w, h]] of Object.entries(SIZES)) {
  const P = await open(b, { w, h }); await clear(P.page);
  for (const moods of (process.env.MOODS ? [process.env.MOODS.split(',')] : [['smile', 'half', 'blink'], ['happy', 'o', 'sad']])) {
    const png = await P.page.evaluate(async ({ w, h, moods }) => {
      const A = await import('/js/avatar.js'), { THREE } = await import('/js/gfx.js');
      const people = [
        { set: 'boy', friend: 'finn', skin: '#f2c6a0' }, { set: 'boy', friend: 'sol', skin: '#c98d62' },
        { set: 'girl', friend: 'clara', skin: '#f6d2b5' }, { set: 'girl', friend: 'lumi', skin: '#e8b48c' },
        { style: 'shirt', color: '#f2f2f2', hair: '#1a1410', hairStyle: 'short', hat: 'none', skin: '#e8b48c', back: 'none', glider: 0 },
        { style: 'aodai', color: '#7a4aa0', hair: '#1a1410', hairStyle: 'long', hat: 'none', skin: '#f0c6a0', back: 'none', glider: 0 },
        { style: 'tunic', color: '#6b4a2a', hair: '#8a8a8a', hairStyle: 'buns', hat: 'none', skin: '#c98d62', back: 'none', glider: 0 }];
      for (const p of people) if (p.friend) await A.loadFriendModels(p.friend);
      const r = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true }); r.setSize(w, h); r.setPixelRatio(1);
      const sc = new THREE.Scene(); sc.background = new THREE.Color('#bfe3f2');
      sc.add(new THREE.HemisphereLight('#ffffff', '#8a9a70', 1.6)); const d = new THREE.DirectionalLight('#ffffff', 1.6); d.position.set(2, 4, 5); sc.add(d);
      const cols = moods.length, rows = people.length, wide = w > h;
      // a grid: one row per person (one column per mood); wide screens put people across instead
      const [nx, ny] = wide ? [rows, cols] : [cols, rows];
      const avs = [];
      people.forEach((p, i) => moods.forEach((m, j) => {
        const av = A.buildAvatar(p); sc.add(av.root); A.animate(av, 'idle', 0); av.life.mood = m; if (av.faceMat && av.faceMat.map) A.setFaceMood(av.faceMat.map, m);
        const [cx, cy] = wide ? [i, j] : [j, i]; avs.push({ av, cx, cy });
      }));
      // square cells, each the close-up of one head (about 0.8 m across), drawn one person at a time
      const cell = Math.floor(Math.min(w / nx, h / ny)), ox = Math.floor((w - nx * cell) / 2), oy = Math.floor((h - ny * cell) / 2), hp = new THREE.Vector3();
      const cam = new THREE.OrthographicCamera(-.34, .34, .34, -.34, -10, 10);
      r.setScissorTest(true); r.setScissor(0, 0, w, h); r.setClearColor('#bfe3f2'); r.clear();
      avs.forEach(({ av }) => { av.root.visible = false; });
      avs.forEach(({ av, cx, cy }) => {
        av.root.visible = true; av.root.updateMatrixWorld(true); av.head.getWorldPosition(hp); cam.position.set(hp.x, hp.y + .04, hp.z + 2); cam.updateMatrixWorld(true);
        const x0 = ox + cx * cell, y0 = h - oy - (cy + 1) * cell; r.setViewport(x0, y0, cell, cell); r.setScissor(x0 + 2, y0 + 2, cell - 4, cell - 4);
        r.render(sc, cam); av.root.visible = false;
      });
      const url = r.domElement.toDataURL('image/png'); r.dispose(); return url;
    }, { w, h, moods });
    fs.writeFileSync(`${out}/${tag}-${dev}-${moods.join('-')}.png`, Buffer.from(png.split(',')[1], 'base64'));
  }
  if (P.errors.length) console.log(dev, P.errors.slice(0, 3));
  await P.ctx.close();
}
await b.close(); console.log('shots in', out);
