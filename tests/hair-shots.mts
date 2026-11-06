// (v1.08e hair) the hair quality gate: Clara (high-detail and light), Mai and Tèo, front and three-quarter, on a phone
// (390x844) at 1x and 2x, and one 4x close-up per head, in the valley's kind of light (the game server on :8765):
//   node tests/hair-shots.mts <out folder> <tag>      IDS=clara,mai,teo
// <tag>-phone-<1x|2x>.png (one row per person: front, three-quarter), <tag>-close-<id>-<front|three-quarter>.png (4x)
import { launch, open, clear } from './harness.mts';
import fs from 'fs';
const out = process.argv[2] || 'docs/world-models-v108e/faces/hair-r3', tag = process.argv[3] || 'after';
const ids = (process.env.IDS || 'clara,clara-light,mai,teo').split(',');
fs.mkdirSync(out, { recursive: true });
const b = await launch();
async function shot(P: any, w: number, h: number, dpr: number, who: string[], turns: number[], zoom: number) {
  return P.page.evaluate(async ({ w, h, dpr, who, turns, zoom }) => {
    const A = await import(String('/js/avatar.js')), { THREE } = await import(String('/js/gfx.js')), G = (window as any).__sv;
    const LOOK = { finn: ['boy', '#f2c6a0'], sol: ['boy', '#c98d62'], clara: ['girl', '#f6d2b5'], lumi: ['girl', '#8d5a3c'] };
    const people: any[] = [];
    for (const id0 of who) {
      const light = id0.endsWith('-light'), id = id0.replace('-light', '');
      let av: any;
      if (LOOK[id]) {
        await A.loadFriendModels(id); if (!light) await A.loadFriendModels(id + '-hd');
        av = A.buildAvatar({ set: LOOK[id][0], friend: id, skin: LOOK[id][1] }, null, { hd: !light });
      } else {
        const n = G.npcs.find((x: any) => x.id === id);
        av = A.buildAvatar(n.A.look); await A.loadFriendModels('villager-' + id); A.wearVillagerModel(av, 'villager-' + id);
      }
      people.push(av);
    }
    const r = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true }); r.setPixelRatio(dpr); r.setSize(w, h); r.outputColorSpace = THREE.SRGBColorSpace;
    const sc = new THREE.Scene(); sc.add(new THREE.HemisphereLight('#fff6e8', '#7f9a6a', 1.5)); const d = new THREE.DirectionalLight('#fff1d6', 1.8); d.position.set(1.5, 4, 5); sc.add(d);
    const cols = turns.length, rows = people.length, cw = w / cols, ch = h / rows;
    r.setScissorTest(true); r.setClearColor('#bfe3f2'); r.setScissor(0, 0, w, h); r.setViewport(0, 0, w, h); r.clear();
    for (const p of people) { sc.add(p.root); p.root.visible = false; }
    people.forEach((p, i) => turns.forEach((turn, j) => {
      A.setLookTarget(null); A.animate(p, 'idle', 1); const L = p.life; if (L) { L.blink = L.t + 60; L.glance = L.t + 60; L.feel = ''; L.feelUntil = L.t + 60; }
      A.animate(p, 'idle', 1 + 1 / 30); p.root.rotation.y = 0; p.root.visible = true; p.root.updateMatrixWorld(true);
      let hb: any = null; if (p.model) p.model.obj.traverse((o: any) => { if (o.isBone && o.name === 'head') hb = o; });
      const bx = new THREE.Box3().setFromObject(p.model ? p.model.obj : p.rig, true), H = bx.max.y - bx.min.y;
      const hp = (hb || p.head).getWorldPosition(new THREE.Vector3()); hp.y += H * .07;
      const half = H * .21 / zoom, cam = new THREE.PerspectiveCamera(22, cw / ch, .05, 50), dist = half / Math.tan(11 * Math.PI / 180) * Math.max(1, ch / cw);
      cam.position.set(hp.x + Math.sin(turn) * dist, hp.y + half * .25, hp.z + Math.cos(turn) * dist); cam.lookAt(hp.x, hp.y - half * .1, hp.z);
      const x0 = Math.floor(j * cw), y0 = Math.floor(h - (i + 1) * ch);
      r.setViewport(x0, y0, Math.floor(cw), Math.floor(ch)); r.setScissor(x0 + 1, y0 + 1, Math.floor(cw) - 2, Math.floor(ch) - 2);
      r.render(sc, cam); p.root.visible = false;
    }));
    const url = r.domElement.toDataURL('image/png'); r.dispose(); return url;
  }, { w, h, dpr, who, turns, zoom });
}
const save = (name: string, png: string) => { fs.writeFileSync(`${out}/${tag}-${name}.png`, Buffer.from(png.split(',')[1], 'base64')); console.log(name); };
for (const dpr of [1, 2]) {
  const P = await open(b, { w: 390, h: 844, dpr, settings: { quality: 'high' } }); await clear(P.page);
  save(`phone-${dpr}x`, await shot(P, 390, 844, dpr, ids, [0, .8], 1));
  if (P.errors.length) console.log(P.errors.slice(0, 3));
  await P.ctx.close();
}
const P = await open(b, { w: 390, h: 390, dpr: 4, settings: { quality: 'high' } }); await clear(P.page);
for (const id of ids) for (const [v, t] of [['front', 0], ['three-quarter', .8]] as [string, number][]) save(`close-${id}-${v}`, await shot(P, 390, 390, 4, [id], [t], 1.25));
await P.ctx.close();
await b.close(); console.log('shots in', out);
