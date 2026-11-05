// Check `faces` (v1.08e faces, owner 6 Nov 2026 AEDT: "soft eyes with lids"; the faces looked stiff, the eyes open all
// round and never closing). For each of the four friends (their Blender model) and a villager (the painted face):
//   1. they blink within 7 seconds, through a half-closed frame (half, closed, half: about 150 ms);
//   2. the lids close fully on the blink: no eye white is left in the closed face, while the open face shows some;
//   3. the face changes for happy, surprised and sad (feel(), the game's moments: a win, a find, a lost game);
//   4. the eyes turn toward a child standing to one side (a person's own left or right), and straight ahead again;
//   5. the villager's open eye has a lid: its white starts well under the eye's top;
//   6. (part 2) only the child's own friend's high-detail model is downloaded; it is drawn near, the light one far away
//      and when the high-detail one is blocked.
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
      if (av.model) { let f = ''; av.root.updateMatrixWorld(true); av.model.obj.traverse((o: any) => { if (o.isMesh && o.visible && /^face-/.test(o.material.name)) f = o.material.name.slice(5); }); return f; }
      const o = av.faceMat.map.offset, i = Math.round(o.x * 4) + 4 * (2 - Math.round(o.y * 3)); return A.MOODS[i];
    };
    const NAME = { o: 'surprised' }, want = (av: any, m: string) => av.model ? (NAME[m] || m) : m;
    // the painted eye white is #fffdf8 (the sparkles are pure white, so they are not counted)
    const EYEW = (d: Uint8ClampedArray, k: number) => d[k + 3] > 200 && d[k] > 250 && d[k + 1] > 247 && d[k + 2] > 238 && d[k + 2] < 252;
    // how much eye white a face shows: the friend's face mesh corners of the eye-white colour, or the villager's pixels
    const whiteOf = (av: any, m: string) => {
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
  return `${Object.entries(o).map(([k, v]) => `${k} blinks at ${v.blinkAt} s`).join(', ')}; half, closed, half; lids close fully; happy, surprised and sad faces; the eyes turn to a child on either side; the high-detail ${hd.f} only, near (light far away, light when blocked)`;
}
