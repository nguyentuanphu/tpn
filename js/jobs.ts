// (Round U, owner 11 Oct: a village job board) A board in each place with a helping job (js/content/jobs.js): find
// something lost nearby, or take something to a stall. The child taps the board, says yes, and a bobbing picture shows
// where to go; tapping it finishes the job: coins, a sticker, and a line about what the place is for. Built after the
// title (js/main.js) from the places and the stalls already in the valley.
import { THREE, toonVC, P, merge, sprite } from './gfx.js';
import { T, onLang } from './i18n.js';
import { dialog } from './popups.js';
import { SFX } from './audio.js';
import { edgeDist, heightAt } from './world.js';
import { saveProfiles } from './state.js';
import { JOBS } from './content/jobs.js';
import { rowStreet } from './content/map.js';

export const JOB_PAY = 3;

export function createJobs(G) {
  const { scene, world } = G, boards = [], active = new Map();   // active: hero -> { key, job, it, mark }
  // (batch rollout) Studio switch 'jobs': off or not started yet, the boards stay hidden from children who never took a job
  const on = () => !G.keep || G.keep('jobs');
  // a spot a child can stand on: off roads and streets, on land, clear of walls, solids and other taps
  const free = (x, z, room = 1.6, gap = 2.8) => {
    if (!(edgeDist(x, z) > 2) || !(heightAt(x, z) > .5)) return false;
    const q = { x, z }; world.collide(q, room); if (Math.hypot(q.x - x, q.z - z) > .01) return false;
    return !G.interactables.some(i => Number.isFinite(i.x) && Math.hypot(i.x - x, i.z - z) < gap);
  };
  const ring = (cx, cz, r0, r1, a0 = 0) => { const out = []; for (let r = r0; r <= r1; r += 2) for (let a = 0; a < 360; a += 15) { const t = (a + a0) * Math.PI / 180; out.push([cx + Math.sin(t) * r, cz + Math.cos(t) * r]); } return out; };
  const ground = (x, z) => world.groundAt ? world.groundAt(x, z) : heightAt(x, z);
  const sign = () => {
    const c = document.createElement('canvas'); c.width = 256; c.height = 160; const g = c.getContext('2d');
    const draw = () => { g.fillStyle = '#f6e7c8'; g.fillRect(0, 0, 256, 160); g.strokeStyle = '#8a5a3b'; g.lineWidth = 10; g.strokeRect(5, 5, 246, 150);
      g.fillStyle = '#5a3a20'; g.textAlign = 'center'; g.textBaseline = 'middle'; let s = 46, txt = T('Jobs', 'Việc làm'); g.font = `bold ${s}px Fredoka, "Baloo 2", sans-serif`; while (g.measureText(txt).width > 220 && s > 20) { s -= 2; g.font = `bold ${s}px Fredoka, "Baloo 2", sans-serif`; } g.fillText(txt, 128, 52);
      for (const [x, y] of [[60, 112], [128, 112], [196, 112]]) { g.fillStyle = '#ffffff'; g.fillRect(x - 26, y - 22, 52, 44); g.strokeStyle = '#c0392b'; g.lineWidth = 3; g.strokeRect(x - 26, y - 22, 52, 44); } };
    draw(); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; onLang(() => { draw(); t.needsUpdate = true; });
    const m = new THREE.MeshBasicMaterial({ map: t }), g2 = new THREE.Group(), a = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 1.12), m), b2 = a.clone();
    a.position.z = .02; b2.rotation.y = Math.PI; b2.position.z = -.02; g2.add(a, b2); return g2;   // (readable from both sides)
  };
  const legs = merge([P(new THREE.BoxGeometry(.14, 2.3, .14), '#8a5a3b', [-.85, 1.15, 0]), P(new THREE.BoxGeometry(.14, 2.3, .14), '#8a5a3b', [.85, 1.15, 0]), P(new THREE.BoxGeometry(2.1, .14, .3), '#c0392b', [0, 2.34, 0])]);

  for (const pl of (G.PLACES || []).filter(p => p.key && JOBS[p.key] && Number.isFinite(p.x))) {
    // by the start of the place's market street, across from the stalls (or near the middle of a place with no street)
    const S = rowStreet(pl.key), [ax, az] = S ? [S.a[0] + S.dx * 2 - S.nx * (S.w / 2 + 2.6), S.a[1] + S.dz * 2 - S.nz * (S.w / 2 + 2.6)] : [pl.x, pl.z];
    const at = ring(ax, az, S ? 0 : 12, 30).find(([x, z]) => free(x, z, 1.8, 4)); if (!at) continue;
    const [x, z] = at, y = ground(x, z), grp = new THREE.Group(); grp.position.set(x, y, z); grp.rotation.y = S ? Math.atan2(S.nx, S.nz) : Math.atan2(pl.x - x, pl.z - z);   // (facing the street, or the place's middle)
    grp.add(new THREE.Mesh(legs, toonVC())); const s = sign(); s.position.set(0, 1.6, 0); grp.add(s);
    const ic = sprite('📋', .7); ic.position.set(0, 2.85, 0); grp.add(ic); scene.add(grp);
    const col = { x, z, r: .5 }; world.colliders.push(col);
    const B = { key: pl.key, x, z, place: pl, grp, col };
    G.interactables.push({ id: 'job_' + pl.key, x, z, r: 2.2, icon: '📋', bubble: '📋', label: () => T('Job board', 'Bảng việc làm'), visible: () => on(), act: h => tapBoard(h, B) });
    boards.push(B);
  }

  const clear = h => { const a = active.get(h); if (!a) return; scene.remove(a.mark); const k = G.interactables.indexOf(a.it); if (k >= 0) G.interactables.splice(k, 1); active.delete(h); };
  // where the job's picture goes: something lost 10-26 m from the board, or the front of a stall in its place
  const targetOf = (B, job) => {
    if (job.kind === 'deliver') {
      const stalls = (world.stalls || []).filter(s => s.place === job.to); const s = stalls[Math.floor(Math.random() * stalls.length)];
      if (s) { const fx = Math.sin(s.face || 0), fz = Math.cos(s.face || 0); return [s.x + fx * (s.d / 2 + 1.6), s.z + fz * (s.d / 2 + 1.6)]; }
    }
    const spots = ring(B.x, B.z, 10, 26, Math.random() * 360).filter(([x, z]) => free(x, z, .8)); return spots.length ? spots[Math.floor(Math.random() * Math.min(spots.length, 24))] : null;
  };
  async function tapBoard(h, B) {
    SFX.tap(); const p = h.profile, J = JOBS[B.key], a = active.get(h);
    if (a && a.key === B.key) { await dialog(T('Job board', 'Bảng việc làm'), [[a.job.en, a.job.vi]]); return; }
    const done = (p.jobsDone = p.jobsDone || {}), job = J.jobs[(done[B.key] || 0) % J.jobs.length];
    const k = await dialog(T('Job board', 'Bảng việc làm'), [[job.en, job.vi]], [['✅ Yes, I will help!', '✅ Dạ, con giúp!'], ['👋 Later', '👋 Để sau']]);
    if (k !== 0) return; if (G.tried) G.tried(h, 'jobs');
    const to = targetOf(B, job); if (!to) return;
    clear(h);
    const mark = sprite(job.icon, 1.1), y = ground(to[0], to[1]); mark.position.set(to[0], y + 1.2, to[1]); scene.add(mark);
    const it = { id: 'jobt_' + B.key, x: to[0], z: to[1], r: 2.2, icon: job.icon, bubble: job.icon, label: () => job.kind === 'find' ? T('Found it!', 'Tìm thấy rồi!') : T('Give it', 'Đưa đồ'), act: hh => hh === h && finish(h, B, job) };
    G.interactables.push(it); active.set(h, { key: B.key, job, it, mark, y });
    G.toast && G.toast(h, `${job.icon} ${T('Look for the bobbing picture!', 'Tìm hình đang nhún nhảy nhé!')}`);
  }
  async function finish(h, B, job) {
    const p = h.profile; clear(h); SFX.chime();
    const done = (p.jobsDone = p.jobsDone || {}); done[B.key] = (done[B.key] || 0) + 1; saveProfiles();
    G.addCoins(JOB_PAY); const st = G.giveSticker(p);
    await G.reward(job.icon, T('Thank you for helping!', 'Cảm ơn con đã giúp!'), T(`+${G.fmt(JOB_PAY)}${st ? ' and a sticker ' + st : ''}`, `+${G.fmt(JOB_PAY)}${st ? ' và hình dán ' + st : ''}`));
    await dialog(T('Job board', 'Bảng việc làm'), [JOBS[B.key].learn]);
  }
  world.updaters.push((dt, t) => { for (const a of active.values()) a.mark.position.y = a.y + 1.2 + Math.sin(t * 3) * .25;
    const v = on(); if (boards.length && boards[0].grp.visible !== v) boards.forEach(B => { B.grp.visible = v; B.col.r = v ? .5 : 0; }); });
  G.jobs = { boards, active, tapBoard, finish };
  return G.jobs;
}
