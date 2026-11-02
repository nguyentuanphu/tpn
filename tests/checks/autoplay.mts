// Sparkle Valley checks: Auto play and quest plans.
// Run them through tests/run.mts (node run.mts <check>) or tests/suite.mts, not on their own.
// Moved unchanged from tests/run.mts (v1.07 split-tests, 2 Nov 2026 AEDT); see tests/checks/README.md.
import { fs, open, clear, start, only, check, ok, b, ownerSmoke } from './shared.mts';

await check('autoplayreleasegates', async () => (await import('../autoplay-release-gates.mts')).autoplayReleaseGatesCheck(b));

await check('legacyplans', async () => (await import('../legacy-play-plans.mts')).legacyPlayPlansCheck(b));

await check('autoplay', async () => {
  // (owner, 12 Oct AEDT; rebuilt 13 Oct after the owner tried it) the auto play check: its button shows under the
  // ladybird only where Studio's switch allows (every device or the ticked ones); it walks round water and walls, plays
  // games with a finger to their end, reads a story, talks to a villager, opens songs; the child never tires; stopping
  // never restarts the game, and on a device that is not a tester each run's progress goes back (rewards stay)
  const pre = rule => `try { localStorage.setItem('sv2_playerid', 'apcheck00001'); localStorage.setItem('sv2_live', JSON.stringify({ releases: { autoplay: ${JSON.stringify(rule)} }, festivals: {} })); } catch (e) { }`;
  for (const rule of [{ on: true, devices: ['zzzzzzzzzzzz'] }, { on: false }]) {
    const Q = await open(b, { w: 1024, h: 768, pre: pre(rule) }); await Q.page.waitForTimeout(2500);
    const shown = !!(await Q.page.$('.apbox:not([hidden]), .z-ap')); await Q.ctx.close(); ok(!shown, 'auto play showed where it is not allowed: ' + JSON.stringify(rule));
  }
  const P = await open(b, { w: 1024, h: 768, pre: pre({ on: true, devices: ['apcheck00001'] }) });
  await P.page.waitForSelector('.zoomer .z-ap', { timeout: 15000 });
  const btn = await P.page.evaluate(() => { const b = document.querySelector('.zoomer .z-ap'), r = b.getBoundingClientRect(); return { w: r.width, h: r.height, pill: !!document.querySelector('.apbox .pill'), hidden: document.querySelector('.apbox').hidden }; });
  ok(btn.w >= 44 && btn.h >= 44 && !btn.pill && btn.hidden, 'the button under the ladybird: ' + JSON.stringify(btn));
  await P.page.click('.zoomer .z-ap'); ok(await P.page.evaluate(() => !document.querySelector('.apbox').hidden && !!document.querySelector('.apbox [data-a=start]')), 'the button did not open the window');
  await P.page.evaluate(() => { window.__noRestart = 1; });
  // walking: a spot 22 to 40 m away with water or a wall on the straight way is reached on foot
  const walk = await P.page.evaluate(async () => {
    const G = __sv, h = G.heroes[0], x0 = h.pos.x, z0 = h.pos.z; let tg = null;
    for (let a = 0; a < 64 && !tg; a++) for (const d of [24, 30, 36]) { const x = x0 + Math.cos(a / 64 * 6.283) * d, z = z0 + Math.sin(a / 64 * 6.283) * d; if (!G.goodSpot(x, z)) continue; let blocked = false; for (let k = 1; k < 30; k++) if (!G.goodSpot(x0 + (x - x0) * k / 30, z0 + (z - z0) * k / 30)) { blocked = true; break; } if (blocked) { tg = { x, z }; break; } }
    if (!tg) return { none: true };
    const r = await G.autoplay.walkTo(tg.x, tg.z, 'watch');
    return { left: Math.hypot(h.pos.x - tg.x, h.pos.z - tg.z), flew: r.trail.some(t => /^fly/.test(t)), problems: r.problems, trail: r.trail };
  });
  ok(walk.none || (walk.left < 4 && !walk.flew && !walk.problems.length), 'the walk round water or a wall: ' + JSON.stringify(walk));
  const mine = () => P.page.evaluate(() => { const p = JSON.parse(localStorage.getItem('sv2_profiles') || '[]'), f = JSON.parse(localStorage.getItem('sv2_farm') || '{}');
    return JSON.stringify({ coins: f.coins, kids: p.map(x => ({ n: x.name, t: x.tales, w: x.wins, l: x.levels, q: x.quests })) }); });
  await P.page.evaluate(() => __sv.save && __sv.save()); await P.page.waitForTimeout(300);
  const before = await mine();
  const keys = await P.page.evaluate(async () => { const G = __sv, npc = G.interactables.find(i => /^npc_/.test(i.id));
    return ['game:counting', 'game:oddone', 'tale:' + G.TALES[0].id, 'place:farm', 'fest:midautumn', npc && 'tap:' + npc.id, 'songs'].filter(Boolean); });
  await P.page.evaluate(k => { __sv.autoplay.start(k, 'fast'); }, keys);
  await P.page.waitForTimeout(1500);
  const mid = await P.page.evaluate(() => { const h = __sv.heroes[0]; h.stamina = 0; return { on: __sv.autoplay.running(), folded: document.querySelector('.apbox').hidden, busy: document.querySelector('.zoomer .z-ap').classList.contains('on') }; });
  await P.page.waitForTimeout(600);
  const full = await P.page.evaluate(() => { const h = __sv.heroes[0]; return h.stamina >= h.staminaMax - .001; });
  let fingerSeen = false; for (let i = 0; i < 480 && await P.page.evaluate(() => __sv.autoplay.running()); i++) { await P.page.waitForTimeout(500); if (!fingerSeen) fingerSeen = await P.page.evaluate(() => { const f = document.querySelector('.apfinger'); return !!f && !f.hidden; }); }
  const end = await P.page.evaluate(() => ({ mark: window.__noRestart, rep: JSON.parse(localStorage.getItem('sv2_autoplay_report') || 'null'), win: !document.querySelector('.apbox').hidden, open: !!document.querySelector('.gl, .theatre') }));
  ok(mid.on && mid.folded && mid.busy && full, 'the run did not start, fold its window, light its button, or keep the child going: ' + JSON.stringify(mid) + ' ' + full);
  ok(end.mark === 1, 'the game restarted after the run');
  ok(fingerSeen, 'no finger on the screen while it played');
  const rep = end.rep; ok(rep && rep.done.length === keys.length && rep.reportState === 'disabled' && !rep.sent, 'no full report: ' + JSON.stringify(rep && rep.done.map(r => r.key)));
  const bad = rep.done.filter(r => r.problems.some(p => !/^slow:/.test(p)));
  ok(!bad.length, 'the check found: ' + JSON.stringify(bad.map(r => [r.key, r.problems])));
  const played = rep.done.filter(r => /^game:/.test(r.key)); ok(played.every(r => /(won|played): \d+ ✓, \d+ ✗, [1-9]/.test(r.said)), 'the games were not played: ' + JSON.stringify(played.map(r => [r.key, r.said])));
  ok(end.win && !end.open, 'after the run the window shows the report and nothing is left open');
  ok(await mine() === before, "this device is not a tester: the run's progress was not put back: " + (await mine()) + ' vs ' + before);
  // stopping: at once, the game goes on (no restart)
  await P.page.evaluate(() => { __sv.autoplay.start(['game:memory', 'game:sums', 'game:shapes'], 'watch'); });
  await P.page.waitForTimeout(4000);
  await P.page.evaluate(() => __sv.autoplay.stop());
  let stopped = false; for (let i = 0; i < 40 && !stopped; i++) { await P.page.waitForTimeout(250); stopped = await P.page.evaluate(() => !__sv.autoplay.running()); }
  const after = await P.page.evaluate(() => ({ mark: window.__noRestart, open: !!document.querySelector('.gl:not(.out)'), finger: !document.querySelector('.apfinger').hidden, paused: __sv.paused }));
  ok(stopped && after.mark === 1 && !after.open && !after.finger && !after.paused, 'Stop: ' + JSON.stringify({ stopped, ...after }));
  // putting progress back keeps the rewards (js/keepcopy.js): quests and wins go back, stickers and the badge stay
  const kc = await P.page.evaluate(async () => { const K = await import('/js/keepcopy.js'), S = await import('/js/state.js'), p = S.profiles[0], same = p;
    K.takeCopy('sv2_check_copy'); const q0 = JSON.stringify(p.quests), st0 = p.stickers.length;
    p.quests.checkdone = true; p.wins.checkgame = 3; p.stickers.push('checksticker'); p.look.badge = 'b1'; S.farm.coins += 50; const c1 = S.farm.coins;
    K.putCopyBack('sv2_check_copy', __sv);
    return { quests: JSON.stringify(S.profiles[0].quests) === q0, wins: !S.profiles[0].wins.checkgame, sticker: S.profiles[0].stickers.length === st0 + 1, badge: S.profiles[0].look.badge === 'b1', coins: S.farm.coins === c1 - 50, same: S.profiles[0] === same, gone: !localStorage.getItem('sv2_check_copy') }; });
  ok(Object.values(kc).every(Boolean), 'progress back, rewards kept: ' + JSON.stringify(kc));
  const errs = P.errors.filter(e => !/pageerror: .*(Load failed|aborted)/.test(e)); await P.ctx.close();
  ok(!errs.length, errs.slice(0, 3).join(' | '));
  return `hidden where not allowed; button under the ladybird (${btn.w}px); walked ${walk.none ? '(no blocked spot near)' : 'round water or a wall on foot'}; ${keys.length} steps at Quick with a finger (${played.map(r => r.key.slice(5) + ' ' + r.said).join('; ')}), stamina kept full, no restart; this device's run put back; Stop at once, no restart; rewards kept when progress goes back`;
});

await check('autoplaycover', async () => {
  // (#337-#349, r82) auto play reports a button with something else on top of it, but not the tester's own report window
  // or ladybird: a tester filing a report while auto play ran made 13 reports of "a button covered" by that window
  const P = await open(b, { w: 1024, h: 768, pre: `try { localStorage.setItem('sv2_playerid', 'apcheck00001'); localStorage.setItem('sv2_live', JSON.stringify({ releases: { autoplay: { on: true, devices: ['apcheck00001'] } }, festivals: {} })); } catch (e) { }` });
  await P.page.waitForFunction(() => window.__sv && __sv.autoplay && __sv.autoplay.tapFor, null, { timeout: 20000 }); await clear(P.page);
  const r = await P.page.evaluate(async () => {
    const out = {};
    for (const [key, cls] of [['plain', 'zzcover'], ['tester', 'modal tpanel'], ['ladybird', 'z-lb']]) {
      const btn = document.createElement('button'); btn.textContent = 'Try me'; btn.style.cssText = 'position:fixed;left:300px;top:300px;width:120px;height:60px;z-index:10';
      const lid = document.createElement('div'); lid.className = cls; lid.style.cssText = 'position:fixed;left:250px;top:250px;width:240px;height:160px;z-index:20;background:#eee';
      document.body.append(btn, lid); const notes = []; await __sv.autoplay.tapFor(btn, n => notes.push(n)); out[key] = notes.filter(n => /covered|bị che/.test(n)).length; btn.remove(); lid.remove();
    }
    return out;
  });
  const errs = P.errors; await P.ctx.close();
  ok(r.plain === 1 && r.tester === 0 && r.ladybird === 0 && !errs.length, JSON.stringify({ r, errs }));
  return 'a button under something else is reported; under the tester\'s own report window or ladybird it is not';
});

await check('autoplayhidden', async () => {
  // (#687-#694, #727, #730-#733) a tester's auto play with its tab in the background reported "stuck at …; still stuck;
  // slow: 0 frames a second" a minute apart: the valley is not drawn while the page is hidden, so nobody moves. The page
  // is hidden here as the browser does it (document.hidden, no animation frames) in the middle of a walk.
  const P = await open(b, { w: 900, h: 640, pre: `try { localStorage.setItem('sv2_playerid', 'apcheck00001'); localStorage.setItem('sv2_live', JSON.stringify({ releases: { autoplay: { on: true, devices: ['apcheck00001'] } }, festivals: {} })); } catch (e) { }
    (() => { let bg = false; const held = [], raf = window.requestAnimationFrame.bind(window);
      window.requestAnimationFrame = cb => { if (bg) { held.push(cb); return -1; } return raf(cb); };
      Object.defineProperty(Document.prototype, 'hidden', { configurable: true, get() { return bg; } });
      Object.defineProperty(Document.prototype, 'visibilityState', { configurable: true, get() { return bg ? 'hidden' : 'visible'; } });
      window.__bg = on => { bg = on; document.dispatchEvent(new Event('visibilitychange')); if (!on) for (const cb of held.splice(0)) raf(cb); }; })();` });
  await P.page.waitForFunction(() => window.__sv && __sv.autoplay && __sv.autoplay.walkTo, null, { timeout: 20000 }); await clear(P.page);
  const r = await P.page.evaluate(async () => {
    const G = __sv, h = G.heroes[0], x0 = h.pos.x, z0 = h.pos.z; let target = null;
    for (let k = 0; k < 64 && !target; k++) { const a = k / 64 * Math.PI * 2, x = x0 + Math.cos(a) * 8, z = z0 + Math.sin(a) * 8; if (!G.goodSpot(x, z)) continue;
      let clear = true; for (let t = 0; t <= 16; t++) if (!G.goodSpot(x0 + (x - x0) * t / 16, z0 + (z - z0) * t / 16)) clear = false; if (clear) target = { x, z }; }
    if (!target) return { none: true };
    const walking = G.autoplay.walkTo(target.x, target.z, 'fast');
    await new Promise(res => setTimeout(res, 400)); window.__bg(true); await new Promise(res => setTimeout(res, 500)); const at = { x: h.pos.x, z: h.pos.z };
    await new Promise(res => setTimeout(res, 7500)); const still = Math.hypot(h.pos.x - at.x, h.pos.z - at.z); window.__bg(false);
    const res = await Promise.race([walking, new Promise(res => setTimeout(() => res({ timeout: true }), 120000))]);
    return { res, still, left: Math.hypot(h.pos.x - target.x, h.pos.z - target.z) };
  });
  const errs = P.errors; await P.ctx.close();
  ok(!r.none && r.still < .05 && r.res && !r.res.timeout && !r.res.problems.length && r.left <= 2.05 && !errs.length, JSON.stringify({ r, errs }));
  return `walking with the page hidden for 8 s (the child stood still, ${r.still.toFixed(2)} m) went on when it came back and arrived with no "stuck"`;
});

await check('autoplayfruitbar', async () => {
  // (#728 #730-#733) auto play left the Sparkle Fruit Bar as "could not work out how to play it" after 25 s (it watched the
  // empty frame under the Bar's own card) and closed it with the frame's Leave, under that card ("a button covered")
  const R = { autoplay: { on: true, devices: ['apcheck00001'] }, tester: { on: true, devices: ['apcheck00001'] }, sparklefruitbar_tester: { on: true }, sparklefruitbar_single: { on: true } };
  const P = await open(b, { w: 929, h: 1129, pre: `try { localStorage.setItem('sv2_playerid', 'apcheck00001'); localStorage.setItem('sv2_tester', JSON.stringify({ at: Date.now() })); localStorage.setItem('sv2_live', ${JSON.stringify(JSON.stringify({ releases: R, festivals: {} }))}); } catch (e) { }`,
    route: async ctx => { await ctx.route('**/api/live**', rt => rt.fulfill({ contentType: 'application/json', body: JSON.stringify({ releases: R, festivals: {} }) })); await ctx.route('**/api/tester**', rt => rt.fulfill({ contentType: 'application/json', body: '{"ok":true,"mine":[],"open":[]}' })); } });
  await P.page.waitForFunction(() => window.__sv && __sv.autoplay, null, { timeout: 20000 }); await clear(P.page);
  await P.page.evaluate(() => { __sv.gameSpot = () => null; __sv.autoplay.start(['game:sparklefruitbar'], 'x5'); });
  await P.page.waitForFunction(() => !__sv.autoplay.running() && (JSON.parse(localStorage.getItem('sv2_autoplay_report') || '{}').done || []).length === 1, null, { timeout: 300000 });
  const r = await P.page.evaluate(() => ({ row: JSON.parse(localStorage.getItem('sv2_autoplay_report')).done[0], open: !!document.querySelector('.gl, .parent-arcade') }));
  const errs = P.errors; await P.ctx.close();
  ok(r.row.key === 'game:sparklefruitbar' && r.row.ok && !r.row.skipped && r.row.problems.length === 0 && !r.open && !errs.length, JSON.stringify({ r, errs }));
  return `auto play played the Fruit Bar to the end (${r.row.said}) and closed it with its own ✕, no problems`;
});

await check('ownerautoplaytransport', async () => {
  const P=await open(b,{w:900,h:640}); await clear(P.page);
  await P.page.evaluate(()=>{const G=__sv,h=G.heroes[0],i=G.interactables.find(i=>/^ride_/.test(i.id)&&G.traffic.slots[+i.id.slice(5)].id==='bus');h.place(i.x+2,i.z);window.__board=i.act(h,G).then(()=>{G.paused=true;});});
  await P.page.locator('.dialog .dchoices button').first().click(); await P.page.locator('.stoppick [data-next]').click();
  const r=await P.page.evaluate(async()=>{
    await window.__board; const G=__sv,h=G.heroes[0],slot=G.traffic.slots.find(s=>s.passenger===h);slot.mover.wait=100;
    await new Promise(resolve=>setTimeout(resolve,200));
    const o=slot.v.o,exit={x:o.position.x+Math.cos(o.rotation.y)*2.6,z:o.position.z-Math.sin(o.rotation.y)*2.6};
    let target=null;
    for(let k=0;k<64&&!target;k++){const a=k/64*Math.PI*2,x=exit.x+Math.cos(a)*12,z=exit.z+Math.sin(a)*12;
      if(!G.goodSpot(x,z))continue;let clear=true;for(let t=0;t<=20;t++)if(!G.goodSpot(exit.x+(x-exit.x)*t/20,exit.z+(z-exit.z)*t/20))clear=false;if(clear)target={x,z};}
    if(!target)throw Error('No clear walking target from actual bus exit');
    const {mountAutoplay}=await import('/js/autoplay.js');mountAutoplay(G);
    const result=await Promise.race([G.autoplay.walkTo(target.x,target.z,'fast'),new Promise(resolve=>setTimeout(()=>resolve({timeout:true}),30000))]);
    const out={result,carried:!!h.carry,passenger:slot.passenger===h,left:Math.hypot(h.pos.x-target.x,h.pos.z-target.z)};G.autoplay.stop();return out;
  });
  const errors=P.errors;await P.ctx.close();ok(!r.result?.timeout&&!r.carried&&!r.passenger&&r.left<=2.1&&!r.result.trail.some(t=>/^fly/.test(t))&&!errors.length,JSON.stringify({r,errors}));
  return 'Actual bus passenger exits through normal Jump before purposeful on-foot navigation; arrives within2m without flying';
});

await check('ownerautoplaystrategy', async () => {
  const P = await open(b, { w: 390, h: 844, touch: true, pre: () => {
    localStorage.setItem('sv2_playerid','autoplan0001'); localStorage.setItem('sv2_live',JSON.stringify({releases:{autoplay:{on:true,devices:['autoplan0001']}},festivals:{}}));
  }, route: async ctx => {
    await ctx.route('**/api/live**',rt=>rt.fulfill({contentType:'application/json',body:JSON.stringify({releases:{autoplay:{on:true,devices:['autoplan0001']}},festivals:{}})}));
    await ctx.route('**/api/tester**',rt=>rt.fulfill({contentType:'application/json',body:JSON.stringify({ok:true,rid:'synthetic-plan-receipt',mine:[],open:[]})}));
  } }); await clear(P.page);
  await P.page.waitForFunction(() => !!__sv.autoplay, null, {timeout:15000});
  await P.page.evaluate(() => {
    const p = __sv.heroes[0].profile; p.age='big'; p.difficulty='hard'; p.gameDiff={...(p.gameDiff||{}),hanoi:'hard'};
    // Test playing separately from the independently covered world walk; force the old random picker into a repeatable cycle.
    __sv.gameSpot=()=>null; Math.random=()=>.01; __sv.autoplay.start(['game:hanoi'],'x5');
  });
  await P.page.waitForFunction(() => !__sv.autoplay.running() && JSON.parse(localStorage.getItem('sv2_autoplay_report')||'{}').done?.length === 1, null, {timeout:180000});
  const report=await P.page.evaluate(()=>JSON.parse(localStorage.getItem('sv2_autoplay_report')));
  const errors=P.errors; await P.ctx.close();
  const row=report.done[0];
  ok(row.key==='game:hanoi' && row.ok && /^won:/.test(row.said) && !errors.length, JSON.stringify({row,errors}));
  return 'Real autoplay solves the4-disc Hanoi activity through legal UI taps and records won, independent of the random fallback';
});

await check('ownerallquestapproaches', async () => {
  const P=await open(b,{w:1280,h:800});await clear(P.page);
  const result=await P.page.evaluate(async()=>{
    const G=__sv,{CHAPTERS}=await import('/js/content/chapters.js'),{YARD_STEPS}=await import('/js/content/yard.js'),{QUESTS}=await import('/js/data.js'),W=await import('/js/world.js'),C=(await import('/js/custom.js')).CUSTOM;
    C.features={...(C.features||{}),story_prologue:true,story_ch1:true,story_ch2:true,story_ch3:true,story_yard:true,storyActions:true};
    await G.lanterns.loadCh('ch2');await G.lanterns.loadCh('ch3');G.paused=true;
    const h=G.heroes[0],p=h.profile,originalNight=G.world.isNight,rows=[],blocked=[],missing=[],duplicates=[];
    const stand=(x,z)=>W.heightAt(x,z)>W.WATER+.25 && !G.world.boxes.some(b=>x>b.x0-.35&&x<b.x1+.35&&z>b.z0-.35&&z<b.z1+.35)
      && !G.world.colliders.some(c=>c.r>0&&c.top==null&&Math.hypot(c.x-x,c.z-z)<c.r+.35)
      && ![[0,0],[.3,0],[-.3,0],[0,.3],[0,-.3]].some(([dx,dz])=>G.world.solidAt?.(x+dx,z+dz));
    const approach=(q,r)=>{
      if(!q||!Number.isFinite(q.x)||!Number.isFinite(q.z))return null;
      for(let d=0;d<=Math.max(.4,r-.35);d+=.35)for(let k=0;k<24;k++){
        const a=k/24*Math.PI*2,x=q.x+Math.cos(a)*d,z=q.z+Math.sin(a)*d;
        if(stand(x,z))return {x,z,d};
      }
      return null;
    };
    const record=(kind,id,q,r,night)=>{
      if(!q||!Number.isFinite(q.x)||!Number.isFinite(q.z)){missing.push({kind,id,night});return;}
      const at=approach(q,r);rows.push({kind,id,night,x:q.x,z:q.z,reach:r,approach:at});if(!at)blocked.push({kind,id,night,x:q.x,z:q.z,reach:r});
    };
    const steps=CHAPTERS.flatMap(ch=>ch.steps);
    try {
      for(const night of [false,true]){
        G.world.isNight=()=>night;
        for(const age of ['little','big']){
          p.age=age;const done={};
          for(const step of steps){
            if(step.big&&age==='little'){done[step.id]=true;continue;}
            p.lanterns={done:{...done},chapters:{},...(step.owl?{}:{companion:'firefly'})};
            const q=G.lanterns.quest(p);
            if(q?.id!=='L_'+step.id){missing.push({kind:'chapter-selection',id:step.id,age,night,actual:q?.id});done[step.id]=true;continue;}
            record('chapter-'+age,step.id,q.target(),3,night);
            const visible=G.interactables.filter(i=>/^story_/.test(i.id)&&i.r>0&&i.visible?.(h));
            const ids=new Map();for(const i of visible){ids.set(i.id,(ids.get(i.id)||0)+1);record('story-interaction-'+age,i.id,i,i.r,night);}
            for(const [id,count]of ids)if(count>1)duplicates.push({id,count,step:step.id,age,night});
            done[step.id]=true;
          }
        }
        p.age='big';const done={};
        for(const step of YARD_STEPS){
          p.yard={done:{...done},jobs:{}};
          for(const i of G.interactables.filter(i=>/^yard_/.test(i.id)&&i.r>0&&i.visible?.(h)))record('yard-interaction',i.id,i,i.r,night);
          const q=G.yard.quest(p);if(q)record('yard-goal',q.id,q.target(),3,night);
          done[step.id]=true;
        }
        // Classic markers can point to a physical tower/statue: require a free approach,
        // rather than declaring every intentionally solid landmark centre invalid.
        const lanternQuest=G.lanterns.quest,yardQuest=G.yard.quest;G.lanterns.quest=()=>null;G.yard.quest=()=>null;
        try{
          const done={};
          for(const step of QUESTS){
            p.quests={...done};p.visited={};p.towers={};p.shrines={};p.discovered={};p.read={};p.orbs=0;
            const q=G.currentQuest(p);
            if(q?.id===step.id){const target=G.questTarget(h);if(target){const interaction=G.interactables.find(i=>i.id===target.id)||G.interactables.find(i=>Math.hypot(i.x-target.x,i.z-target.z)<.1);record('classic',step.id,target,interaction?.r||3.4,night);}else missing.push({kind:'classic-target',id:step.id,night});}
            if(step.id==='shrines'){
              const completed=W.SHRINES.slice(0,3),known=W.SHRINES[7];
              p.shrines=Object.fromEntries(completed.map(q=>[q.id,true]));p.discovered={...p.shrines,[known.id]:true};
              const first=G.questTarget(h);if(first?.id!==known.id)missing.push({kind:'known-shrine-priority',night,actual:first?.id});
              delete p.discovered[known.id];const fallback=G.questTarget(h);
              if(!fallback||p.shrines[fallback.id])missing.push({kind:'remaining-undiscovered-shrine',night,actual:fallback?.id});
            }
            done[step.id]=true;
          }
        }finally{G.lanterns.quest=lanternQuest;G.yard.quest=yardQuest;}
      }
    }finally{G.world.isNight=originalNight;G.paused=false;}
    return {rows,blocked,missing,duplicates};
  });
  fs.writeFileSync('out/owner-all-quest-approaches.json',JSON.stringify(result,null,2));
  const errors=P.errors;await P.ctx.close();
  ok(result.rows.length>60&&!result.blocked.length&&!result.missing.length&&!errors.length,JSON.stringify({total:result.rows.length,blocked:result.blocked,missing:result.missing,errors}));
  return `${result.rows.length} chapter/yard/classic targets have dry collision-free approaches within interaction range for child ages and light/dark predicates; static approach proof only, full route traversal and timed NPC availability remain pending`;
});

await check('ownerquesttargets', async () => {
  const P = await open(b, { w: 1280, h: 800 }); await clear(P.page);
  const r = await P.page.evaluate(async () => {
    const G = __sv; await G.lanterns.loadCh('ch2'); await G.lanterns.loadCh('ch3');
    const targets = G.interactables.filter(i => /^story_(light|ribbon)/.test(i.id));
    const blocked = targets.filter(i => G.world.boxes.some(box => i.x > box.x0 - .6 && i.x < box.x1 + .6 && i.z > box.z0 - .6 && i.z < box.z1 + .6) || G.world.solidAt?.(i.x,i.z)).map(i => ({id:i.id,x:i.x,z:i.z}));
    const sydney = targets.filter(i => /^story_light_c3_fly_/.test(i.id));
    return { total:targets.length, sydney:sydney.length, blocked };
  });
  const errors = P.errors; await P.ctx.close();
  ok(r.sydney === 3 && r.total >= 9 && !r.blocked.length && !errors.length, JSON.stringify({ ...r, errors }));
  return `${r.total} chapter ribbons/lights, including all3 Sydney targets, remain outside house boxes and collision solids`;
});

await check('ownerautoplaynormal', async () => {
  return await ownerSmoke('owner-autoplay-plans.mts', ['--speed=x1','--ids=robot,sortout']);
});

await check('ownerautoplaynormalmaze', async () => {
  return await ownerSmoke('owner-autoplay-plans.mts', ['--speed=x1','--ids=maze']);
});

await check('ownerautoplaynormalduck', async () => {
  return await ownerSmoke('owner-autoplay-plans.mts', ['--speed=x1','--ids=duckmaze']);
});

await check('ownerautoplay2x', async () => {
  return await ownerSmoke('owner-autoplay-plans.mts', ['--speed=x2']);
});

await check('ownerautoplay3x', async () => {
  return await ownerSmoke('owner-autoplay-plans.mts', ['--speed=x3']);
});

await check('ownerautoplaynavigation', async () => {
  return await ownerSmoke('owner-autoplay-navigation.mts');
});

await check('ownerautoplayplans', async () => {
  return await ownerSmoke('owner-autoplay-plans.mts', process.env.SV_AUTOPLAY_BASELINE === '1' ? ['--baseline'] : []);
});

await check('autoplayshrine', async () => (await import('../autoplay-shrine.mts')).autoplayShrineCheck(b));
