// (15 Nov 2026, the shared face kit) What the game sets for a shut eye on one friend: the face box, the shut picture and its
// tile, and which pieces are shown.   cd tests; SV_URL=http://localhost:8796/ node ../tools/meshy/facekit/probe.mts sol blink
import { createRequire } from 'node:module';
import { open, clear } from '../../../tests/harness.mts';
const { chromium } = createRequire(new URL('../../../tests/package.json', import.meta.url))('playwright');
const [ID = 'sol', MOOD = 'blink'] = process.argv.slice(2);
const b = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const P = await open(b, { w: 900, h: 700, fast: false }); await clear(P.page);
const r = await P.page.evaluate(async ([ID, MOOD]) => {
  const G = (window as any).__sv, A = await import(String('/js/avatar.js'));
  const h = G.heroes[0]; let top = h.av.root; while (top.parent) top = top.parent;
  await A.loadFriendModels(ID); await A.loadFriendModels(ID + '-hd'); const av: any = A.buildAvatar({ set: 'girl', friend: ID, skin: '#f6c7a5' }, null, { hd: true }); A.showHD(av, true); top.add(av.root);
  for (let i = 0; i < 200 && !av.modelHD; i++) await new Promise(r => setTimeout(r, 100));
  const M = av.modelHD; if (!M) return 'no model';
  M.follow(MOOD); const out: any = { mood: M.mood, mats: [], faces: [] };
  M.obj.traverse((o: any) => { if (!o.isMesh) return; const m = o.material, u = m.userData && m.userData.kitU;
    if (/^face-/.test(m.name || '')) out.faces.push([m.name, o.visible, !!m.map]);
    if (u) out.mats.push({ name: m.name, shut: u.shut.value, shutOn: u.shutOn && u.shutOn.value, fbox: u.fbox && u.fbox.value.toArray(), tile: u.shutTile && u.shutTile.value.toArray(), map: !!(u.shutMap && u.shutMap.value), eyeBoxes: !!m.userData.eye_boxes, faceBox: m.userData.face_box, fzf: u.fzf && u.fzf.value }); });
  return out; }, [ID, MOOD]);
console.log(JSON.stringify(r, null, 1)); await b.close();
