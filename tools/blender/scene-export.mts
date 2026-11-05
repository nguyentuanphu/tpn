// Export the in-game tale film's scenes for Blender (round v1.08c, blender helper): the story pages (part 2) and the
// Blender films (part 3) are drawn in Blender from the same sets, props, animals and camera as the game's own film, with
// the costume kit's people (tools/blender/costumes.py) in place of the game's actors.
//   SV_URL=http://localhost:8765/ CHROMIUM=… node tools/blender/scene-export.mts <out dir> <tale id> [at=0.3,0.8 | fps=12] [pages=0,1]
// Writes <out>/<tale>-p<k>.json for each page (with at=, <tale>-p<k>-<j>.json for each moment): the sky, the camera,
// every mesh (its geometry, vertex colours and place) and every actor (its look, kit, place, turn, size and what it does),
// the page's length and the child's help moment. Without at= one moment is taken, near the middle of the page.
import fs from 'fs';
import { launch, open } from '../../tests/harness.mts';
const [out, id, ...rest] = process.argv.slice(2);
const only = (rest.find(a => a.startsWith('pages=')) || '').slice(6).split(',').filter(Boolean).map(Number);
// at=0.3,0.8: moments of the page (parts of its length) to take, for the Blender films' pictures
const at = (rest.find(a => a.startsWith('at=')) || '').slice(3).split(',').filter(Boolean).map(Number);
// fps=12: every frame of the page, for an animated Blender film (made later on a machine with a graphics card; owner, 5 Nov 2026 AEDT)
const fps = +(rest.find(a => a.startsWith('fps=')) || 'fps=0').slice(4);
fs.mkdirSync(out, { recursive: true });
const b = await launch();
const P = await open(b, { w: 1280, h: 760, fast: false });
await P.page.evaluate(() => { (window as any).__sv?.renderer?.setPixelRatio(.25); });
await P.page.evaluate(async id => {
  const st = document.createElement('div'); st.id = 'xstage'; st.style.cssText = 'position:fixed;left:0;top:0;width:320px;height:180px;z-index:99999;background:#000'; document.body.appendChild(st);
  const C = await import('/js/content/films.js'); const script = C.FILMS[id] || await (await import('/js/content/talefilms.js')).taleFilm(id);
  const F = await import('/js/film.js'); (window as any).__xf = F.createFilm(st, script, { name: 'Na' }); (window as any).__xn = script.pages.length;
}, id);
const n = await P.page.evaluate(() => (window as any).__xn);
for (let k = 0; k < n; k++) {
  if (only.length && !only.includes(k)) continue;
  const shots = await P.page.evaluate(async ([k, at, fps]) => {
    const W = window as any, f = W.__xf; f.page(k); f.narrated();
    const p = f.now, frame = () => new Promise(r => requestAnimationFrame(r));
    W.__svFilmRate = 0.000001; // the film's own clock stands still: this export moves it
    await frame(); await frame();
    let n = 0; const step = async (to: number) => { while (p.t < to) { if (p.hold) p.release(true); p.t = Math.min(to, p.t + 1 / 30); p.tick(0, p.t); if (++n % 45 === 0) await frame(); } };
    const root = p.root, b64 = (a: Float32Array | Uint32Array) => { let s = ''; const u = new Uint8Array(a.buffer, a.byteOffset, a.byteLength); for (let i = 0; i < u.length; i += 32768) s += String.fromCharCode.apply(null, u.subarray(i, i + 32768)); return btoa(s); };
    const actorOf = (o: any) => { while (o) { if (o.userData && o.userData.actor) return o.userData.actor; o = o.parent; } return null; };
    const shown = (o: any) => { while (o) { if (!o.visible) return false; o = o.parent; } return true; };
    // one moment of the page: every mesh (its geometry in world space, its colours), every actor, the camera
    const capture = () => {
      root.updateMatrixWorld(true); const meshes: any[] = [];
      root.traverse((o: any) => {
        if (!o.isMesh || actorOf(o) || !o.geometry || !shown(o)) return;
        const g = o.geometry, pos = g.attributes.position; if (!pos || pos.count > 400000) return;
        const m = Array.isArray(o.material) ? o.material[0] : o.material; if (!m || m.opacity === 0) return;
        const col = g.attributes.color && m.vertexColors ? Float32Array.from(g.attributes.color.array) : null;
        meshes.push({ pos: b64(Float32Array.from(pos.array)), idx: g.index ? b64(Uint32Array.from(g.index.array)) : null, col: col ? b64(col) : null, size: col ? g.attributes.color.itemSize : 0,
          color: m.color ? '#' + m.color.getHexString() : '#ffffff', emit: !!(m.emissive && m.emissive.getHex()) || m.type === 'MeshBasicMaterial', opacity: m.transparent ? m.opacity : 1, m: [Array.from(o.matrixWorld.elements)] });
      });
      const actors = p.actors.filter((a: any) => shown(a.o) && a.o.scale.x > .05).map((a: any) => ({ look: a.look, kit: a.look.kit || null, m: [Array.from(a.o.matrixWorld.elements)], state: [a.state], mood: a.mood }));
      return { t: p.t, sky: p.skyNow || ['#9ad0ff', '#e8f6ff'], look: p.look || null, fov: 42, cams: [[p.camPos.toArray(), p.camLook.toArray()]], meshes, actors };
    };
    // every frame of the page: each mesh once (from the frame it first shows), then its place in every frame; the actors'
    // place, what they do and their face in every frame; the camera in every frame
    if (fps) {
      const seen = new Map<any, number>(), meshes: any[] = [], actors = p.actors.map((a: any) => ({ look: a.look, kit: a.look.kit || null, m: [] as any[], state: [] as any[], mood: [] as any[] })), cams: any[] = [];
      const len = p.len + .6; let f = 0;
      for (let t = 0; t <= len; t += 1 / fps, f++) {
        await step(t); root.updateMatrixWorld(true);
        root.traverse((o: any) => {
          if (!o.isMesh || actorOf(o) || !o.geometry) return;
          let i = seen.get(o);
          if (i === undefined) { if (!shown(o)) return; const g = o.geometry, pos = g.attributes.position; if (!pos || pos.count > 400000) return; const m = Array.isArray(o.material) ? o.material[0] : o.material; if (!m) return;
            const col = g.attributes.color && m.vertexColors ? Float32Array.from(g.attributes.color.array) : null;
            seen.set(o, i = meshes.length); meshes.push({ from: f, pos: b64(Float32Array.from(pos.array)), idx: g.index ? b64(Uint32Array.from(g.index.array)) : null, col: col ? b64(col) : null, size: col ? g.attributes.color.itemSize : 0,
              color: m.color ? '#' + m.color.getHexString() : '#ffffff', emit: !!(m.emissive && m.emissive.getHex()) || m.type === 'MeshBasicMaterial', opacity: m.transparent ? m.opacity : 1, m: [], vis: [] }); }
          const e = meshes[i]; while (e.m.length < f - e.from) { e.m.push(e.m[e.m.length - 1] || Array.from(o.matrixWorld.elements)); e.vis.push(0); }
          e.m.push(Array.from(o.matrixWorld.elements)); e.vis.push(shown(o) ? 1 : 0);
        });
        p.actors.forEach((a: any, i: number) => { actors[i].m.push(Array.from(a.o.matrixWorld.elements)); actors[i].state.push(shown(a.o) && a.o.scale.x > .05 ? a.state : 'hidden'); actors[i].mood.push(a._face || a.mood); });
        cams.push([p.camPos.toArray(), p.camLook.toArray()]);
      }
      W.__svFilmRate = 1;
      return [{ t: 0, fps, frames: f, sky: p.skyNow || ['#9ad0ff', '#e8f6ff'], look: p.look || null, fov: 42, cams, meshes, actors, len: p.len, help: null }];
    }
    // the child's help moment: when it comes and where its tap ring is on the picture (16:9, the camera of that moment)
    const helps = p.ev.filter((e: any) => e.help).map((e: any) => ({ t: e.t, en: e.help.en, vi: e.help.vi, at: e.help.at }));
    const THREE = (await import('/vendor/three.module.js')) as any, cam = new THREE.PerspectiveCamera(42, 16 / 9, .1, 600);
    let help: any = null; const out: any[] = [];
    const takeHelp = async (h: any) => { await step(h.t); const pt = h.at ? h.at() : null; cam.position.copy(p.camPos); cam.lookAt(p.camLook); cam.updateMatrixWorld(true);
      let x = 50, y = 55; if (pt) { const v = pt.clone().project(cam); x = Math.round((v.x + 1) * 50); y = Math.round((1 - v.y) * 50); } help = { t: h.t, x, y, en: h.en, vi: h.vi }; };
    const len0 = p.len, plan = (at.length ? at : [.62]).map((f: number) => ({ t: Math.max(.5, len0 * f) })).concat(helps.slice(0, 1).map((h: any) => ({ t: h.t, h })));
    plan.sort((a: any, b: any) => a.t - b.t);
    for (const it of plan as any[]) { if (it.h) await takeHelp(it.h); else { await step(it.t); out.push(capture()); } }
    await step(p.len + .2);
    W.__svFilmRate = 1;
    return out.map(o => Object.assign(o, { len: p.len, help }));
  }, [k, at, fps] as any);
  shots.forEach((d: any, j: number) => fs.writeFileSync(`${out}/${id}-p${k}${fps ? '-frames' : at.length ? '-' + j : ''}.json`, JSON.stringify(d)));
  console.log(id, 'page', k, shots.map((d: any) => `${d.meshes.length} meshes ${d.actors.length} actors at ${d.t.toFixed(1)} s`).join('; '), 'length', shots[0].len.toFixed(1), shots[0].help ? 'help at ' + shots[0].help.t.toFixed(1) : '');
}
await b.close();
