// (v1.08e faces, part 3) close-ups of the people's heads, smiling and mid-blink, at 2x on a phone and a computer: the four
// friends (high-detail), the 11 named villagers and six crowd neighbours (child, grown-up, grandparent; Vietnam,
// Australia), each wearing its model in the game page, drawn with the valley's kind of light.
//   node tests/head-shots.mts <out folder> <before|after>      (the game server on :8765)
// <tag>-friends-<mood>-<dev>.png, <tag>-villagers-<mood>-<dev>.png, <tag>-crowd-<mood>-<dev>.png
import { launch, open, clear } from './harness.mts';
import fs from 'fs';
const out = process.argv[2] || 'docs/world-models-v108e/faces/heads', tag = process.argv[3] || 'after';
fs.mkdirSync(out, { recursive: true });
const b = await launch();
const SETS0 = {
  friends: ['finn', 'sol', 'clara', 'lumi'],
  villagers: ['mai', 'ba', 'teo', 'ti', 'bong', 'su', 'jack', 'mit', 'bom', 'ruby', 'lan'],
  crowd: ['vn-schoolboy', 'vn-aodai', 'vn-grandma', 'au-girl', 'au-dad', 'au-grandpa'],
};
// FULL=1 IDS=mai: those people only, head to feet (<tag>-full-<set>-<mood>-<dev>.png)
const SETS = process.env.IDS ? Object.fromEntries(Object.entries(SETS0).map(([k, v]) => [k, v.filter(i => process.env.IDS.split(',').includes(i))]).filter(([, v]) => v.length)) : SETS0;
for (const [dev, w, h] of [['phone', 390, 844], ['computer', 1280, 800]] as [string, number, number][]) {
  const P = await open(b, { w, h, dpr: 2, settings: { quality: 'high' } }); await clear(P.page);
  for (const [set, ids] of Object.entries(SETS).filter(([k]) => !process.env.ONLY || process.env.ONLY.split(',').includes(k))) for (const mood of ['smile', 'blink']) {
    const png = await P.page.evaluate(async ({ w, h, set, ids, mood, full, turn }) => {
      const A = await import(String('/js/avatar.js')), { THREE } = await import(String('/js/gfx.js')), G = (window as any).__sv;
      const LOOK = { finn: ['boy', '#f2c6a0'], sol: ['boy', '#c98d62'], clara: ['girl', '#f6d2b5'], lumi: ['girl', '#8d5a3c'] };
      const people: any[] = [];
      for (const id of ids) {
        let av: any;
        if (set === 'friends') {
          await A.loadFriendModels(id); await A.loadFriendModels(id + '-hd');
          av = A.buildAvatar({ set: LOOK[id][0], friend: id, skin: LOOK[id][1] }, null, { hd: true });
        } else {
          const n = set === 'villagers' ? G.npcs.find((x: any) => x.id === id) : null;
          const look = n ? n.A.look : { style: 'shirt', color: '#f2f2f2', hair: '#1a1410', hairStyle: 'short', hat: 'none', skin: '#e8b48c', back: 'none', glider: 0 };
          av = A.buildAvatar(look); await A.loadFriendModels('villager-' + id); A.wearVillagerModel(av, 'villager-' + id);
        }
        people.push(av);
      }
      const r = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true }); r.setPixelRatio(2); r.setSize(w, h); r.outputColorSpace = THREE.SRGBColorSpace;
      // the valley's kind of light: a sky and ground fill and a warm sun from the front and above
      const sc = new THREE.Scene(); sc.add(new THREE.HemisphereLight('#fff6e8', '#7f9a6a', 1.5)); const d = new THREE.DirectionalLight('#fff1d6', 1.8); d.position.set(1.5, 4, 5); sc.add(d);
      const cols = w > h ? Math.min(ids.length, 6) : Math.min(ids.length, 2), rows = Math.ceil(ids.length / cols);
      const cw = w / cols, ch = h / rows;
      r.setScissorTest(true); r.setClearColor('#bfe3f2'); r.setScissor(0, 0, w, h); r.setViewport(0, 0, w, h); r.clear();
      for (const p of people) { sc.add(p.root); p.root.visible = false; }
      people.forEach((p, i) => {
        A.setLookTarget(null); A.animate(p, 'idle', 1); const L = p.life; if (L) { L.blink = L.t + 60; L.glance = L.t + 60; L.feel = mood === 'blink' ? 'blink' : ''; L.feelUntil = L.t + 60; }
        A.animate(p, 'idle', 1 + 1 / 30); p.root.rotation.y = .3; p.root.visible = true; p.root.updateMatrixWorld(true);
        // the camera in front of the head, framing it and the shoulders
        let hb: any = null; if (p.model) p.model.obj.traverse((o: any) => { if (o.isBone && o.name === 'head') hb = o; });
        // (the head joint is at the neck: the head's middle is above it; the whole height frames the head and shoulders)
        const bx = new THREE.Box3().setFromObject(p.model ? p.model.obj : p.rig, true), H = bx.max.y - bx.min.y;
        const hp = (hb || p.head).getWorldPosition(new THREE.Vector3()); hp.y += H * .055;
        if (full) hp.y = bx.min.y + H * .5; // (FULL=1: head to feet)
        const half = H * (full ? .56 : .21), cam = new THREE.PerspectiveCamera(22, cw / ch, .05, 50), dist = half / Math.tan(11 * Math.PI / 180) * Math.max(1, ch / cw * .75);
        const fy = Math.sin(.3 + turn), fz = Math.cos(.3 + turn); /* (TURN=<radians>: the camera round to a three-quarter or side view) */ cam.position.set(hp.x + fy * dist, hp.y + half * .15, hp.z + fz * dist); cam.lookAt(hp.x, hp.y - half * .15, hp.z);
        const cx = i % cols, cy = Math.floor(i / cols), x0 = Math.floor(cx * cw), y0 = Math.floor(h - (cy + 1) * ch);
        r.setViewport(x0, y0, Math.floor(cw), Math.floor(ch)); r.setScissor(x0 + 1, y0 + 1, Math.floor(cw) - 2, Math.floor(ch) - 2);
        r.render(sc, cam); p.root.visible = false;
      });
      const url = r.domElement.toDataURL('image/png'); r.dispose(); return url;
    }, { w, h, set, ids, mood, full: !!process.env.FULL, turn: +(process.env.TURN || 0) });
    fs.writeFileSync(`${out}/${tag}${process.env.FULL ? '-full' : ''}${process.env.TURN ? '-turn' + process.env.TURN : ''}-${set}-${mood}-${dev}.png`, Buffer.from(png.split(',')[1], 'base64'));
    console.log(dev, set, mood);
  }
  if (P.errors.length) console.log(dev, P.errors.slice(0, 3));
  await P.ctx.close();
}
await b.close(); console.log('shots in', out);
