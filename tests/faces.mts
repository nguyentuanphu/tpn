// Check `faces` (v1.08e faces, owner 6 Nov 2026 AEDT: "soft eyes with lids"; the faces looked stiff, the eyes open all
// round and never closing). For each of the four friends (their Blender model) and a villager (the painted face):
//   1. they blink within 7 seconds, through a half-closed frame (half, closed, half: about 150 ms);
//   2. the lids close fully on the blink: no eye white is left in the closed face, while the open face shows some;
//   3. the face changes for happy, surprised and sad (feel(), the game's moments: a win, a find, a lost game);
//   4. the eyes turn toward a child standing to one side (a person's own left or right), and straight ahead again;
//   5. the villager's open eye has a lid: its white starts well under the eye's top.
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
  const errs = P.errors; await P.ctx.close();
  ok(!r.bad.length && !errs.length, JSON.stringify({ bad: r.bad, errs, out: r.out }).slice(0, 2500));
  const o = r.out as Record<string, { blinkAt: number }>;
  return `${Object.entries(o).map(([k, v]) => `${k} blinks at ${v.blinkAt} s`).join(', ')}; half, closed, half; lids close fully; happy, surprised and sad faces; the eyes turn to a child on either side`;
}
