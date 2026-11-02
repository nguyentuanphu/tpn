// A frame-by-frame film recorder for the game (owner, 11 Oct: real footage, not stills).
// The page's clock (performance.now, Date.now, requestAnimationFrame, timers, CSS animations) is taken over once the
// game is ready; each film frame moves it on by exactly 1/30 s and saves a picture, so the film is smooth whatever the
// speed of the test machine.
import fs from 'fs';
import { launch, open, clear } from '../../tests/harness.mjs';

export const VT = () => {
  const R = { now: performance.now.bind(performance), dnow: Date.now, raf: window.requestAnimationFrame.bind(window), caf: window.cancelAnimationFrame.bind(window), st: window.setTimeout.bind(window), ct: window.clearTimeout.bind(window), si: window.setInterval.bind(window), ci: window.clearInterval.bind(window) };
  let on = false, vt = 0, dbase = 0, tid = 1e7, rid = 1e7;
  const timers = new Map(), rafs = new Map();
  performance.now = () => on ? vt : R.now();
  Date.now = () => on ? dbase + vt : R.dnow();
  window.requestAnimationFrame = cb => { if (!on) return R.raf(cb); const id = rid++; rafs.set(id, cb); return id; };
  window.cancelAnimationFrame = id => { if (!rafs.delete(id)) R.caf(id); };
  window.setTimeout = (cb, ms = 0, ...a) => { if (!on) return R.st(cb, ms, ...a); const id = tid++; timers.set(id, { t: vt + Math.max(0, +ms || 0), cb, a }); return id; };
  window.clearTimeout = id => { if (!timers.delete(id)) R.ct(id); };
  window.setInterval = (cb, ms = 0, ...a) => { if (!on) return R.si(cb, ms, ...a); const iv = Math.max(4, +ms || 0), id = tid++; timers.set(id, { t: vt + iv, cb, a, iv }); return id; };
  window.clearInterval = id => { if (!timers.delete(id)) R.ci(id); };
  window.__vt = {
    start() { vt = R.now(); dbase = R.dnow() - vt; on = true; for (const a of document.getAnimations()) try { a.pause(); } catch (e) { } },
    async advance(ms) {
      const end = vt + ms;
      for (let guard = 0; guard < 500; guard++) {
        let next = null; for (const e of timers) if (e[1].t <= end && (!next || e[1].t < next[1].t)) next = e;
        if (!next) break;
        const [id, t] = next; vt = Math.max(vt, t.t); if (t.iv) t.t += t.iv; else timers.delete(id);
        try { typeof t.cb === 'function' ? t.cb(...t.a) : (0, eval)(t.cb); } catch (e) { console.error(e); }
        await null;
      }
      vt = end;
      for (const a of document.getAnimations()) try { if (a.playState === 'running') a.pause(); a.currentTime = (a.currentTime || 0) + ms; } catch (e) { }
      const cbs = [...rafs.values()]; rafs.clear();
      for (const cb of cbs) try { cb(vt); } catch (e) { console.error(e); }
      await null;
    }
  };
};

// a film: rec.hold(seconds), rec.do(async fn between frames), frames saved as JPEG under dir
export async function film({ w, h, dpr = 1, lang, dir, screen = 'valley', mode = 'solo', pixelRatio, settings = {}, route }) {
  fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(dir, { recursive: true });
  const b = await launch();
  const P = await open(b, { w, h, dpr, lang, touch: true, fast: false, screen, mode, pre: VT, route, settings: { quality: 'high', alwaysDay: true, captions: false, ...settings } });
  const page = P.page;
  await clear(page);
  await page.evaluate(pr => { window.__sv.renderer.setPixelRatio(pr); dispatchEvent(new Event('resize')); }, pixelRatio || dpr);
  await page.waitForTimeout(1500);
  await page.evaluate(() => window.__vt.start());
  let n = 0; const marks = [];
  const FPS = 25, step = 1000 / FPS;
  const rec = {
    page, G: fn => page.evaluate(fn),
    frames: () => n, marks, mark(id) { marks.push([id, n / FPS]); },
    async hold(sec, each) {
      const k = Math.round(sec * FPS);
      for (let i = 0; i < k; i++) {
        if (each) await each(i / FPS, i);
        await page.evaluate(ms => window.__vt.advance(ms), step);
        await page.screenshot({ path: `${dir}/f${String(++n).padStart(5, '0')}.jpg`, type: 'jpeg', quality: 88 });
      }
    },
    async tap(sel, opts = {}) { const el = await page.$(sel); if (!el) { console.log('no', sel); return false; } const bb = await el.boundingBox(); if (!bb) return false; await page.mouse.click(bb.x + bb.width / 2, bb.y + bb.height / 2); return true; },
    async tapText(text, scope = 'body') { const ok = await page.evaluate(([t, s]) => { const re = new RegExp(t, 'i'); const el = [...document.querySelectorAll(`${s} button, ${s} [role=button], ${s} .qbtn, ${s} .sp-card, ${s} a`)].find(e => re.test(e.textContent) && e.getBoundingClientRect().width); if (!el) return null; const r = el.getBoundingClientRect(); return [r.x + r.width / 2, r.y + r.height / 2]; }, [text, scope]); if (!ok) { console.log('no text', text); return false; } await page.mouse.click(ok[0], ok[1]); return true; },
    async close() { await b.close(); }
  };
  return rec;
}

// cinematic camera: a shot spec is applied just before each frame is drawn (the game keeps running underneath)
// follow {back, up, side, look}: behind the child; orbit {c:[x,z], r, up, a0, a1, dur, look:[x,z,y]}; dolly {from:[x,z,y], to:[x,z,y], look:[x,z,y]|null, dur}
export async function cine(page, spec) {
  await page.evaluate(spec => {
    const G = window.__sv, R = G.renderer;
    if (!R.__cineHooked) { const orig = R.render.bind(R); R.render = (s, c) => { if (window.__cine) try { document.querySelectorAll('.theatre, .storybook, .region-banner, .banner, .vc-pop, .toast, .modal, .dialog').forEach(e => e.remove()); G.paused = false; window.__cine(c); } catch (e) { } return orig(s, c); }; R.__cineHooked = true; }
    if (!spec) { window.__cine = null; document.querySelector('#huds').style.visibility = ''; return; }
    document.querySelector('#huds').style.visibility = spec.hud ? '' : 'hidden';
    const g = (x, z) => G.world.groundAt(x, z), t0 = performance.now(), h = G.heroes[0];
    const ease = k => k < 0 ? 0 : k > 1 ? 1 : k * k * (3 - 2 * k);
    let sm = null;
    window.__cine = cam => {
      const k = ease((performance.now() - t0) / 1000 / (spec.dur || 10)), p = h.pos;
      let pos, look;
      if (spec.type === 'follow') {
        const yaw = h.yaw + (spec.side || 0); sm = sm == null ? yaw : sm + Math.atan2(Math.sin(yaw - sm), Math.cos(yaw - sm)) * .04;
        pos = [p.x - Math.sin(sm) * spec.back, p.y + spec.up, p.z - Math.cos(sm) * spec.back]; look = [p.x, p.y + (spec.look || 1.2), p.z];
      } else if (spec.type === 'orbit') {
        const a = spec.a0 + (spec.a1 - spec.a0) * k, c = spec.c;
        pos = [c[0] + Math.sin(a) * spec.r, g(c[0], c[1]) + spec.up, c[1] + Math.cos(a) * spec.r];
        look = spec.look ? [spec.look[0], g(spec.look[0], spec.look[1]) + spec.look[2], spec.look[1]] : [p.x, p.y + 1.2, p.z];
      } else {
        const f = spec.from, t = spec.to, x = f[0] + (t[0] - f[0]) * k, z = f[1] + (t[1] - f[1]) * k;
        pos = [x, g(x, z) + f[2] + (t[2] - f[2]) * k, z];
        look = spec.look ? [spec.look[0], g(spec.look[0], spec.look[1]) + spec.look[2], spec.look[1]] : [p.x, p.y + 1.2, p.z];
      }
      cam.position.set(pos[0], pos[1], pos[2]); cam.lookAt(look[0], look[1], look[2]);
    };
  }, spec);
}
// the child walks (or runs) towards a point: steer each frame so "forward" points at it
export async function walkTo(rec, x, z, sec, run = true) {
  await rec.page.keyboard.down('ArrowUp'); if (run) await rec.page.keyboard.down('Shift');
  await rec.hold(sec, async () => { await rec.page.evaluate(([x, z]) => { const h = window.__sv.heroes[0]; const dx = x - h.pos.x, dz = z - h.pos.z; h.camYaw = Math.atan2(-dx, -dz); h.manualCamT = 99; }, [x, z]); });
  await rec.page.keyboard.up('ArrowUp'); if (run) await rec.page.keyboard.up('Shift');
}
export async function placeAt(rec, x, z, faceX, faceZ) {
  await rec.page.evaluate(([x, z, fx, fz]) => { const h = window.__sv.heroes[0]; h.place(x, z); const a = Math.atan2(fx - x, fz - z); h.yaw = a; h.camYaw = a + Math.PI; h.manualCamT = 99; document.querySelectorAll('.toast, .region-banner, .banner, .vc-pop, .storybook').forEach(e => e.remove()); }, [x, z, faceX ?? x, faceZ ?? z - 10]);
}
