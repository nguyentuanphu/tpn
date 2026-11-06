// Check `faces` (v1.08e faces, owner 6 Nov 2026 AEDT: "soft eyes with lids"; the faces looked stiff, the eyes open all
// round and never closing). For each of the four friends (their Blender model) and a villager (the painted face):
//   1. they blink within 7 seconds, through a half-closed frame (half, closed, half: about 150 ms);
//   2. the lids close fully on the blink: no eye white is left in the closed face, while the open face shows some;
//   3. the face changes for happy, surprised and sad (feel(), the game's moments: a win, a find, a lost game);
//   4. the eyes turn toward a child standing to one side (a person's own left or right), and straight ahead again;
//   5. the villager's open eye has a lid: its white starts well under the eye's top;
//   6. (part 2) only the child's own friend's high-detail model is downloaded; it is drawn near, the light one far away
//      and when the high-detail one is blocked;
//   7. (part 3, owner 6 Nov 2026 AEDT: "like a real 3D person") each friend's model, light and high-detail, has a sculpted
//      face of real shapes: lids that close over the eyes (rays from the front find eye white open, none closed, less
//      half-closed), a mouth that changes shape for each mood (smile, open, sad, surprised, happy, shy, excited, sleep),
//      and a head that is not a sphere (its width differs from its depth and its height, its nose in front).
import { open, clear } from './harness.mts';

const ok = (c: unknown, msg: string) => { if (!c) throw new Error(msg); };

export async function facesCheck(b) {
  const P = await open(b, { w: 1024, h: 768 }); await clear(P.page);
  const r = await P.page.evaluate(async () => {
    const A = await import(String('/js/avatar.js')), { THREE } = await import(String('/js/gfx.js'));
    const bad: string[] = [], out: Record<string, unknown> = {}, sc = new THREE.Scene();
    const people: [string, Record<string, unknown>][] = [
      ['finn', { set: 'boy', friend: 'finn', skin: '#f2c6a0' }], ['sol', { set: 'boy', friend: 'sol', skin: '#c98d62' }],
      ['clara', { set: 'girl', friend: 'clara', skin: '#f6d2b5' }], ['lumi', { set: 'girl', friend: 'lumi', skin: '#8d5a3c' }],
      ['villager', { style: 'shirt', color: '#f2f2f2', hair: '#1a1410', hairStyle: 'short', hat: 'none', skin: '#e8b48c', back: 'none', glider: 0 }]];
    for (const [id] of people) if (id !== 'villager' && !(await A.loadFriendModels(id))) bad.push(id + ': no model');
    // the face shown now: the friend's visible face mesh, or the villager's mood square
    const shown = (av: any) => {
      if (av.model && av.model.face3d) { av.root.updateMatrixWorld(true); return av.model.mood; } // (part 3: one face, its mood keys)
      if (av.model) { let f = ''; av.root.updateMatrixWorld(true); av.model.obj.traverse((o: any) => { if (o.isMesh && o.visible && /^face-/.test(o.material.name)) f = o.material.name.slice(5); }); return f; }
      const o = av.faceMat.map.offset, i = Math.round(o.x * 4) + 4 * (2 - Math.round(o.y * 3)); return A.MOODS[i];
    };
    const NAME = { o: 'surprised' }, want = (av: any, m: string) => av.model ? (NAME[m] || m) : m;
    // the painted eye white is #fffdf8 (the sparkles are pure white, so they are not counted)
    const EYEW = (d: Uint8ClampedArray, k: number) => d[k + 3] > 200 && d[k] > 250 && d[k + 1] > 247 && d[k + 2] > 238 && d[k + 2] < 252;
    // how much eye white a face shows: the friend's face mesh corners of the eye-white colour, or the villager's pixels
    const whiteOf = (av: any, m: string) => {
      if (av.model && av.model.face3d) return (window as any).__rayWhite(av, want(av, m));
      if (av.model) { let n = 0; av.model.obj.traverse((o: any) => { if (o.isMesh && o.material.name === 'face-' + want(av, m)) { const c = o.geometry.attributes.color; for (let i = 0; i < c.count; i++) if (c.getX(i) > .9 && c.getY(i) > .9 && c.getZ(i) > .88) n++; } }); return n; }
      const img = av.faceMat.map.image as HTMLCanvasElement, i = A.MOODS.indexOf(m), S = img.width / 4, x = img.getContext('2d');
      const d = x.getImageData((i % 4) * S, Math.floor(i / 4) * S, S, S).data; let n = 0;
      for (let k = 0; k < d.length; k += 4) if (EYEW(d, k)) n++;
      return n;
    };
    // the villager's open eye: the highest eye white is well under the eye's top (.565 - .098 of the square): the lid covers it
    const lidOf = (av: any) => {
      const img = av.faceMat.map.image as HTMLCanvasElement, S = img.width / 4, x = img.getContext('2d'), d = x.getImageData(0, 0, S, S).data;
      let top = S; for (let y = 0; y < S && top === S; y++) for (let k = Math.round(.29 * S); k < Math.round(.46 * S); k++) if (EYEW(d, (y * S + k) * 4)) { top = y; break; }
      return { top: +(top / S).toFixed(3), eyeTop: .467 };
    };
    // (part 3) how much eye white the face shows from the front: the person drawn small and flat (the face in its corner
    // colours, everything else black, nothing in front), the white pixels counted
    const flatV = new THREE.MeshBasicMaterial({ vertexColors: true }), flatK = new THREE.MeshBasicMaterial({ color: '#000' });
    const rt = new THREE.WebGLRenderTarget(160, 160), px = new Uint8Array(160 * 160 * 4), rr = (window as any).__sv.renderer;
    (window as any).__rayWhite = (av: any, key: string) => {
      // (the model follows the person's mood each time it is drawn: the mood is set on the person too)
      if (av.life) { av.life.mood = key === 'surprised' ? 'o' : key; av.life.blink = av.life.t + 60; }
      av.model.follow(av.life ? av.life.mood : key); av.root.updateMatrixWorld(true);
      const box = new THREE.Box3(); av.model.face3d.forEach((o: any) => box.expandByObject(o, true));
      const sc = new THREE.Scene(), parent = av.root.parent; sc.add(av.root);
      const swap: [any, any][] = []; av.root.traverse((o: any) => { if (o.isMesh) { swap.push([o, o.material]); o.material = o.userData.face3d && o.geometry.attributes.color && !/^skin/.test(o.material.name) ? flatV : flatK; } });
      const c = box.getCenter(new THREE.Vector3()), h = (box.max.y - box.min.y) * .3, y0 = c.y + h * .7;
      const cam = new THREE.OrthographicCamera(-h * 1.6, h * 1.6, h, -h, .01, 10); cam.position.set(c.x, y0, box.max.z + 2); cam.lookAt(c.x, y0, 0);
      const was = rr.getRenderTarget(); rr.setRenderTarget(rt); rr.setClearColor('#000', 1); rr.clear(); rr.render(sc, cam); rr.readRenderTargetPixels(rt, 0, 0, 160, 160, px); rr.setRenderTarget(was);
      swap.forEach(([o, m]) => { o.material = m; }); if (parent) parent.add(av.root); else sc.remove(av.root);
      let n = 0; for (let k = 0; k < px.length; k += 4) if (px[k] > 225 && px[k + 1] > 225 && px[k + 2] > 210) n++;
      return n;
    };
    for (const [id, look] of people) {
      const av: any = A.buildAvatar(look); sc.add(av.root); av.root.position.set(0, 0, 0); av.root.rotation.y = 0;
      const seen = new Set<string>(); let first = -1, run: string[] = [];
      A.setLookTarget(null);
      for (let f = 0; f <= 7 * 30; f++) { const t = 1 + f / 30; A.animate(av, 'idle', t); const s = shown(av); seen.add(s); if (s === 'blink' && first < 0) first = t - 1; if (first >= 0 && run.length < 8) run.push(s); }
      if (!seen.has('blink')) bad.push(`${id}: no blink in 7 s (${[...seen]})`);
      if (!seen.has('half')) bad.push(`${id}: no half-closed frame (${[...seen]})`);
      // the moods: happy, surprised, sad, each a different face
      const L = av.life, moods: Record<string, string> = {};
      for (const m of ['happy', 'o', 'sad']) { L.blink = L.t + 50; A.feel(av, m, 2); A.animate(av, 'idle', L.t + 1 / 30); moods[m] = shown(av); if (moods[m] !== want(av, m)) bad.push(`${id}: ${m} shows ${moods[m]}`); }
      // a child to one side: the eyes turn to them (a person's left is +x when they face +z)
      L.feel = ''; L.glance = L.t + 50; L.blink = L.t + 50; const looks: Record<string, string> = {};
      for (const [side, x] of [['left', 2.2], ['right', -2.2], ['ahead', 0]] as [string, number][]) {
        A.setLookTarget({ x, z: x ? 1.2 : 2.5 }); for (let k = 0; k < 4; k++) A.animate(av, 'idle', L.t + 1 / 30); looks[side] = shown(av);
      }
      A.setLookTarget(null);
      if (looks.left !== 'lookL' || looks.right !== 'lookR' || looks.ahead !== 'smile') bad.push(`${id}: eyes ${JSON.stringify(looks)}`);
      // the lids close fully on the blink; the open eye shows some white
      const wb = whiteOf(av, 'blink'), ws = whiteOf(av, 'smile'), wh = whiteOf(av, 'half');
      if (wb > 0 || ws < 1 || wh >= ws) bad.push(`${id}: eye white open ${ws}, half ${wh}, closed ${wb}`);
      const lid = av.model ? null : lidOf(av); if (lid && !(lid.top > .49)) bad.push(`${id}: no lid (the white starts at ${lid.top} of the square, the eye's top is ${lid.eyeTop})`);
      out[id] = { blinkAt: +first.toFixed(2), run: run.join(' '), moods, looks, white: [ws, wh, wb], lid };
      sc.remove(av.root);
    }
    return { bad, out };
  });
  // (part 2) the high-detail model: only the child's own friend's is downloaded, after the start; it is drawn up close and
  // the light one far away; blocked, the light model stays and nothing breaks
  const hd = await P.page.evaluate(async () => {
    const G = (window as any).__sv, h = G.heroes[0], f = h.profile.look.friend;
    for (let k = 0; k < 80 && !h.av.modelHD; k++) await new Promise(r => setTimeout(r, 250));
    const near = h.av.modelHD ? { hd: h.av.modelHD.obj.visible, light: h.av.model.obj.visible } : null;
    
    const A = await import(String('/js/avatar.js')); A.showHD(h.av, false); const far = h.av.modelHD ? { hd: h.av.modelHD.obj.visible, light: h.av.model.obj.visible } : null; A.showHD(h.av, true);
    // (the browser's list of downloads fills up in the valley, so the loader itself is asked which high-detail models it holds)
    const asked = ['finn', 'sol', 'clara', 'lumi'].filter(id => A.FRIEND_MODELS.ready && A.FRIEND_MODELS.ready(id + '-hd')).map(id => id + '-hd.glb');
    return { f, has: !!h.av.modelHD, near, far, asked };
  });
  // (part 3, after part 2's count of downloads) the sculpted faces of the four friends, light and high-detail models
  const sculpt = await P.page.evaluate(async () => {
    const A = await import(String('/js/avatar.js')), { THREE } = await import(String('/js/gfx.js')), W = window as any;
    const bad: string[] = [], out: Record<string, unknown> = {};
    const LOOK = { finn: ['boy', '#f2c6a0'], sol: ['boy', '#c98d62'], clara: ['girl', '#f6d2b5'], lumi: ['girl', '#8d5a3c'] };
    for (const id of ['finn', 'sol', 'clara', 'lumi']) for (const hd of [false, true]) {
      if (hd && !(await A.loadFriendModels(id + '-hd'))) { bad.push(id + ': no high-detail model'); continue; }
      const av: any = A.buildAvatar({ set: LOOK[id][0], friend: id, skin: LOOK[id][1] }, null, { hd }), M = hd ? av.modelHD : av.model, tag = id + (hd ? '-hd' : '');
      if (!M) { bad.push(tag + ': no model'); continue; }
      if (hd) A.showHD(av, true);
      if (!M.face3d) { bad.push(tag + ': no sculpted face (face3d)'); continue; }
      A.animate(av, 'idle', 1); av.root.rotation.y = 0; av.root.updateMatrixWorld(true);
      const m = { ...av, model: M };
      // 1. the lids close: eye white seen open, less half-closed, none closed (blink, sleep, happy's curved eyes)
      const white: Record<string, number> = {}; for (const k of ['smile', 'half', 'blink', 'sleep', 'happy']) white[k] = W.__rayWhite(m, k);
      if (!(white.smile > 40) || !(white.half < white.smile) || white.blink > 0 || white.sleep > 0 || white.happy > 0) bad.push(`${tag}: eye white ${JSON.stringify(white)}`);
      // 2. the mouth changes shape per mood: its dark inside, each mood's own width, height and place
      const face = M.face3d.find((o: any) => o.geometry.attributes.color), g = face.geometry, pos = g.attributes.position, col = g.attributes.color, dict = face.morphTargetDictionary, tgt = g.morphAttributes.position, rel = g.morphTargetsRelative;
      // (the mouth's own dark red, #6f2b2b: linear .16, .024, .024 in the corners)
      const mouth: number[] = []; for (let i = 0; i < pos.count; i++) if (Math.abs(col.getX(i) - .161) < .025 && col.getY(i) < .04 && col.getZ(i) < .04) mouth.push(i);
      const shape: Record<string, number[]> = {};
      for (const k of ['smile', 'open', 'sad', 'surprised', 'happy', 'shy', 'excited', 'sleep']) {
        let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9; const t = k === 'smile' ? null : tgt[dict[k]];
        for (const i of mouth) { const x = pos.getX(i) + (t ? (rel ? t.getX(i) : t.getX(i) - pos.getX(i)) : 0), y = pos.getY(i) + (t ? (rel ? t.getY(i) : t.getY(i) - pos.getY(i)) : 0); x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
        shape[k] = [x1 - x0, y1 - y0, (y0 + y1) / 2].map(v => +v.toFixed(4));
      }
      const ks = Object.keys(shape), same: string[] = [];
      for (let a = 0; a < ks.length; a++) for (let b = a + 1; b < ks.length; b++) { const p = shape[ks[a]], q = shape[ks[b]]; if (Math.abs(p[0] - q[0]) < .002 && Math.abs(p[1] - q[1]) < .002 && Math.abs(p[2] - q[2]) < .002) same.push(ks[a] + '=' + ks[b]); }
      if (mouth.length < 20 || same.length) bad.push(`${tag}: mouth ${mouth.length} points, the same shape for ${same.join(', ')}`);
      // 3. the head is not a sphere: the skin bound to the head bone alone (its front third, without the ears), in the rest pose
      let hx0 = 1e9, hx1 = -1e9, hy0 = 1e9, hy1 = -1e9, hz0 = 1e9, hz1 = -1e9, front: number[] = null; const pts: number[][] = [];
      M.obj.traverse((o: any) => {
        if (!o.isSkinnedMesh || o.userData.face3d || o.userData.outline || !/^skin/.test(o.material.name)) return;
        const headIdx = o.skeleton.bones.findIndex((b: any) => b.name === 'head'), p = o.geometry.attributes.position, si = o.geometry.attributes.skinIndex, sw = o.geometry.attributes.skinWeight;
        for (let i = 0; i < p.count; i++) if (si.getX(i) === headIdx && sw.getX(i) > .99) pts.push([p.getX(i), p.getY(i), p.getZ(i)]);
      });
      for (const [x, y, z] of pts) { hy0 = Math.min(hy0, y); hy1 = Math.max(hy1, y); hz0 = Math.min(hz0, z); hz1 = Math.max(hz1, z); if (!front || z > front[2]) front = [x, y, z]; }
      const zc = hz0 + (hz1 - hz0) * .65; for (const [x, , z] of pts) if (z > zc) { hx0 = Math.min(hx0, x); hx1 = Math.max(hx1, x); }
      const Wd = hx1 - hx0, Dp = hz1 - hz0, Ht = hy1 - hy0, k1 = Math.abs(Wd - Dp) / Wd, k2 = Math.abs(Wd - Ht) / Wd;
      if (pts.length < 50 || !(k1 > .04 && k2 > .04) || !(Math.abs(front[0] - (hx0 + hx1) / 2) < Wd * .08)) /* (the stored points are packed: measured from the head's middle) */ bad.push(`${tag}: head ${pts.length} points, width ${Wd.toFixed(3)} depth ${Dp.toFixed(3)} height ${Ht.toFixed(3)}, front ${front && ((front[0] - (hx0 + hx1) / 2) / Wd).toFixed(3)} of the width from the middle`);
      out[tag] = { white, mouth: mouth.length, head: [Wd, Dp, Ht].map(v => +v.toFixed(3)) };
    }
    return { bad, out };
  });
  r.bad.push(...sculpt.bad);
  if (!hd.has) r.bad.push('no high-detail model for the child\'s friend');
  if (hd.asked.length !== 1 || hd.asked[0] !== hd.f + '-hd.glb') r.bad.push('high-detail models asked: ' + hd.asked.join());
  if (hd.near && !(hd.near.hd && !hd.near.light)) r.bad.push('up close: ' + JSON.stringify(hd.near));
  if (hd.far && !(!hd.far.hd && hd.far.light)) r.bad.push('far away: ' + JSON.stringify(hd.far));
  const Q = await open(b, { w: 900, h: 700, route: async ctx => { await ctx.route('**/models/*-hd.glb', q => q.abort()); } }); await clear(Q.page);
  const blocked = await Q.page.evaluate(async () => { const h = (window as any).__sv.heroes[0]; for (let k = 0; k < 40 && !h.av.model; k++) await new Promise(r => setTimeout(r, 250)); await new Promise(r => setTimeout(r, 1500)); return { model: !!h.av.model, hd: !!h.av.modelHD }; });
  if (!blocked.model || blocked.hd) r.bad.push('blocked: ' + JSON.stringify(blocked));
  const qErrs = Q.errors.filter(e => !/glb|friend model|Failed to fetch|aborted/i.test(e)); await Q.ctx.close();
  P.errors.push(...qErrs);
  const errs = P.errors; await P.ctx.close();
  ok(!r.bad.length && !errs.length, JSON.stringify({ bad: r.bad, errs, out: r.out }).slice(0, 2500));
  const o = r.out as Record<string, { blinkAt: number }>;
  const so = sculpt.out as Record<string, { white: Record<string, number>, head: number[] }>;
  return `${Object.entries(o).map(([k, v]) => `${k} blinks at ${v.blinkAt} s`).join(', ')}; half, closed, half; lids close fully; happy, surprised and sad faces; the eyes turn to a child on either side; the high-detail ${hd.f} only, near (light far away, light when blocked); sculpted faces (light and high-detail): lids close (eye white open ${Object.values(so).map(v => v.white.smile).join('/')}, closed 0), 8 mouth shapes, heads not spheres (${Object.entries(so).filter(([k]) => !k.endsWith('-hd')).map(([k, v]) => `${k} ${v.head.join('x')}`).join(', ')})`;
}
