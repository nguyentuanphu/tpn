// Sparkle Valley checks: Owner-reported problems (rounds checked by the owner).
// Run them through tests/run.mts (node run.mts <check>) or tests/suite.mts, not on their own.
// Moved unchanged from tests/run.mts (v1.07 split-tests, 2 Nov 2026 AEDT); see tests/checks/README.md.
import { open, clear, noWelcome, start, only, check, ok, b, ownerSmoke } from './shared.mts';

await check('ownerkidgoal', async () => {
  for (const lang of ['en','vi']) {
    const P=await open(b,{w:390,h:844,touch:true,lang});
    const tapGoal=async()=>{
      const box=await P.page.locator('.c-goal:visible').boundingBox();ok(box,'goal button visible');
      const x=box.x+box.width/2,y=box.y+box.height/2;
      ok(await P.page.evaluate(({x,y})=>!!document.elementFromPoint(x,y)?.closest('.c-goal'),{x,y}),'goal button receives the tap');
      await P.page.mouse.click(x,y); // the existing ready chip pulses continuously; its centre remains tappable
    };
    try {
      await clear(P.page);
      await P.page.evaluate(async()=>{
        const G=__sv,h=G.heroes[0],S=await import('/js/state.js');
        h.profile.lanterns={companion:'firefly',done:{p_owl:true},chapters:{}};
        G.lanterns.companions.sync();G.addCoins(100-S.farm.coins);G.kidplay.refresh();
      });
      await tapGoal();await P.page.waitForTimeout(250);
      const read=()=>P.page.evaluate(async()=>({coins:(await import('/js/state.js')).farm.coins,hat:__sv.heroes[0].profile.lanterns.pet?.hat||null}));
      const first=await read();ok(first.coins===100&&!first.hat,'explaining the goal must not spend coins: '+JSON.stringify({lang,first}));
      await P.page.waitForSelector('.dialog .dchoices button');
      const text=await P.page.locator('.dialog .dtext').innerText();
      ok((lang==='en'?/hat.*companion|companion.*hat/i:/mũ.*bạn đồng hành|bạn đồng hành.*mũ/i).test(text),'goal purpose missing: '+text);
      await P.page.locator('.dialog .dchoices button').last().click();await P.page.waitForTimeout(300);
      ok((await read()).coins===100,'cancel keeps all coins');
      await tapGoal();await P.page.locator('.dialog .dchoices button').first().click();await P.page.waitForTimeout(600);
      const bought=await read();ok(bought.coins===70&&bought.hat==='party','explicit first-hat purchase only: '+JSON.stringify(bought));
      await tapGoal();
      // Another action can change the shared coins while help is open: never overdraw.
      await P.page.evaluate(async()=>{const S=await import('/js/state.js');__sv.addCoins(0-S.farm.coins);});
      await P.page.locator('.dialog .dchoices button').first().click();await P.page.waitForTimeout(400);
      const raced=await read();ok(raced.coins===0&&raced.hat==='party','purchase rechecks the balance');
      ok(!P.errors.length,P.errors.join(' | '));
    } finally {await P.ctx.close();}
  }
  return 'EN/VI phone: target tap explains companion hat saving without spending; Cancel keeps coins; explicit Buy spends exactly30; stale balance cannot overdraw';
});

await check('ownerheartstap', async () => {
  // (owner, 16 Oct AEDT, point 50) the hearts explain themselves when tapped; the rest of the card still opens Settings.
  // (owner, 16 Oct: "discrete, small but understandable"; one Studio switch per thing) a short note of two lines at
  // most, clear of the buttons, and a short spoken line, each with its own switch; never a caption box as well
  const P = await open(b, { w: 390, h: 844, touch: true }); await clear(P.page);
  const voices = []; P.page.on('request', q => { const m = /\/voices\/(en|vi)\/\w\/(7863c82e65276c14|e751803424298077)\.mp3/.exec(q.url()); if (m) voices.push(m[2]); });
  // (Full run 37: the daily gift's own note took the HUD note while this ran) the gift's note and voice stay quiet here
  const sw = (id, on) => P.page.evaluate(([id, on]) => import('/js/custom.js').then(C => { C.CUSTOM.features = { ...(C.CUSTOM.features || {}), [id]: on }; }), [id, on]);
  await sw('explain_gift_note', false); await sw('explain_gift_voice', false);
  await noWelcome(P.page); // (Grandpa Owl's welcome caption fell inside the first tap's look on slower machines)
  // the voice is on here (the checks start with it off), and any way it speaks counts: a recorded file or the device voice
  await P.page.evaluate(async () => { (await import('/js/state.js')).settings.voice = true; window.__spoke = []; window.__explained = []; addEventListener('sv-explain', e => window.__explained.push(e.detail)); const s = speechSynthesis.speak.bind(speechSynthesis); speechSynthesis.speak = u => { window.__spoke.push(u.text); try { s(u); } catch (e) { } }; });
  const box = await P.page.evaluate(() => { const h = document.querySelector('.hud .hearts'), r = h.getBoundingClientRect(); return { y: r.y + r.height / 2, x: r.x + r.width / 2, hit: Math.round(r.height), role: h.getAttribute('role'), label: h.getAttribute('aria-label') }; });
  const tap = async () => { await P.page.waitForTimeout(3600); voices.length = 0; await P.page.evaluate(() => { window.__spoke = []; window.__explained = []; }); await P.page.touchscreen.tap(box.x, box.y); await P.page.waitForTimeout(1500); const ex = await P.page.evaluate(() => window.__explained.filter(e => e.kind === 'hearts')); if (ex.some(e => e.spoken)) voices.push('spoken'); };
  const look = () => P.page.evaluate(() => { const n = document.querySelector('.hud .htoast.show'), r = n?.getBoundingClientRect();
    const hits = !r ? [] : [...document.querySelectorAll('.hud button, .hud .z-view, .hud .dk, .hud .quest, .hud .pcard')].filter(e => { const q = e.getBoundingClientRect(); return q.width && r.left < q.right && r.right > q.left && r.top < q.bottom && r.bottom > q.top; }).map(e => e.className);
    return { note: n?.textContent || '', explain: !!n?.classList.contains('explain'), lines: r ? Math.round(r.height / (parseFloat(getComputedStyle(n).lineHeight) || 21)) : 0, h: Math.round(r?.height || 0), w: Math.round(r?.width || 0), hits, caption: document.querySelector('.caption.show')?.textContent || '', settings: !!document.querySelector('.modal:not(.out)') }; });
  await tap(); const both = { ...(await look()), voice: [...voices] };
  await sw('explain_hearts_note', false); await tap(); const voiceOnly = { ...(await look()), voice: [...voices] };
  await sw('explain_hearts_note', true); await sw('explain_hearts_voice', false); await tap(); const noteOnly = { ...(await look()), voice: [...voices] };
  await sw('explain_hearts_note', false); await tap(); const none = { ...(await look()), voice: [...voices] };
  await clear(P.page); await P.page.locator('.hud .pav').first().tap(); await P.page.waitForTimeout(800);
  const card = await P.page.evaluate(() => !!document.querySelector('.modal:not(.out)'));
  const errors = P.errors; await P.ctx.close();
  const r = { box, both, voiceOnly, noteOnly, none, card, errors };
  ok(box.role === 'button' && /hearts/i.test(box.label) && box.hit >= 44, 'hearts tap target: ' + JSON.stringify(box));
  ok(/^Hearts show how strong you are\. Little ones never lose them\.$/.test(both.note) && both.explain && both.h <= 60 && !both.hits.length && !both.caption && both.voice.length >= 1 && !both.settings, 'note and voice: ' + JSON.stringify(both));
  ok(!voiceOnly.note && !voiceOnly.caption && voiceOnly.voice.includes('spoken'), 'note switched off: ' + JSON.stringify(voiceOnly));
  ok(noteOnly.note && !noteOnly.caption && !noteOnly.voice.length, 'voice switched off: ' + JSON.stringify(noteOnly));
  ok(!none.note && !none.caption && !none.voice.length, 'both switched off: ' + JSON.stringify(none));
  ok(card && !errors.length, JSON.stringify({ card, errors }));
  return `hearts: own 44 px tap target; a short note (${both.h} px, clear of every button) and a short spoken line, each switched by Studio on its own, never a caption box; the picture (with its gear) still opens Settings`;
});

await check('ownerexplainswitches', async () => {
  // (owner, 16 Oct AEDT: "all options to switch on/off one by one, each telling what will be switched off") with every
  // explanation switch on (the default) and then off from Studio (content/custom.json features): the daily gift's note
  // and voice, a game's question line (its space kept), the update notice. The hearts are checked in ownerheartstap
  const ids = ['explain_gift_note', 'explain_gift_voice', 'explain_gameLine', 'explain_updateNotice', 'explain_voiceAsk', 'explain_hearts_note', 'explain_hearts_voice'];
  const C = await import('../../js/content/releases.js');
  const listed = ids.filter(id => C.RELEASES.some(r => r.id === id && r.group === 'explain' && r.def === true && / Off: | Tắt: |Off:|Tắt:/.test(r.en + r.vi) && r.vi));
  ok(listed.length === ids.length && C.RELEASE_GROUPS.explain, 'Studio switches missing, or not saying what Off does: ' + ids.filter(id => !listed.includes(id)).join(', '));
  const run = async off => {
    const route = off ? async ctx => ctx.route('**/content/custom.json*', async r => { let j = {}; try { j = await (await r.fetch()).json(); } catch (e) { } j.features = { ...(j.features || {}), ...Object.fromEntries(ids.map(id => [id, false])) }; await r.fulfill({ contentType: 'application/json', body: JSON.stringify(j) }); }) : null;
    const P = await open(b, { w: 390, h: 844, touch: true, play: false, route, pre: () => { window.__ex = []; addEventListener('sv-explain', e => window.__ex.push({ ...e.detail, note: [...document.querySelectorAll('.hud .htoast.show')].map(n => n.textContent).join(' ') })); } });
    await start(P.page); await clear(P.page);
    await P.page.waitForFunction(() => window.__ex.some(e => e.kind === 'gift'), null, { timeout: 20000 }).catch(() => { });
    const gift = await P.page.evaluate(() => { const ex = window.__ex.filter(e => e.kind === 'gift'); return { ex, note: ex.map(e => e.note).join(' ') }; });
    await P.page.evaluate(() => window.svOfferUpdate?.()); await P.page.waitForTimeout(500);
    const notice = await P.page.evaluate(() => !!document.querySelector('.update-notice'));
    await P.page.evaluate(() => document.querySelector('.update-notice')?.remove());
    // (review R3) a part of the game that has gone after a deploy still offers the update with the switch off
    await P.page.evaluate(() => window.svModuleGone?.(new TypeError('Importing a module script failed.'))); await P.page.waitForTimeout(500);
    const gone = await P.page.evaluate(() => !!document.querySelector('.update-notice'));
    await P.page.evaluate(() => document.querySelector('.update-notice')?.remove());
    await P.page.evaluate(() => __sv.openGamesHub(0)); await P.page.waitForSelector('.hplay', { timeout: 20000 }); await P.page.locator('.hplay').first().click();
    await P.page.waitForSelector('.gl:not(.out)', { timeout: 30000 }); await P.page.waitForTimeout(1500);
    const line = await P.page.evaluate(() => { const h = document.querySelector('.gl .gl-help'), r = h.getBoundingClientRect(); return { text: h.textContent.trim(), shown: getComputedStyle(h).visibility !== 'hidden', h: Math.round(r.height) }; });
    const errors = P.errors; await P.ctx.close(); return { gift, notice, gone, line, errors };
  };
  const on = await run(false), off = await run(true);
  ok(on.gift.ex.length && on.gift.ex.every(e => e.shown && e.spoken) && /gift/i.test(on.gift.note), 'gift on: ' + JSON.stringify(on.gift));
  ok(off.gift.ex.length && off.gift.ex.every(e => !e.shown && !e.spoken) && !/gift/i.test(off.gift.note), 'gift off: ' + JSON.stringify(off.gift));
  ok(on.notice && !off.notice, `update notice on ${on.notice}, off ${off.notice}`);
  ok(on.gone && off.gone, `a gone part must offer the update even with the notice off: on ${on.gone}, off ${off.gone}`);
  ok(on.line.text && on.line.shown && off.line.text && !off.line.shown && off.line.h === on.line.h, 'game question line: ' + JSON.stringify({ on: on.line, off: off.line }));
  ok(!on.errors.length && !off.errors.length, JSON.stringify([on.errors, off.errors]));
  return `${ids.length} Studio switches (each says what Off does, EN/VI); switched off: no gift note or voice, no update notice, a game's question line hidden with its space kept; on: all shown`;
});

await check('ownertheatreapproach', async () => {
  process.env.SV_FAR = '1';
  try { return await ownerSmoke('owner-theatre-walk.mts', ['out/theatre-walk.json', '4']); } finally { delete process.env.SV_FAR; }
});

await check('ownerround', async () => {
  return await ownerSmoke('owner-round-smoke.mts');
});

await check('ownerreporteddesktop', async () => {
  return await ownerSmoke('owner-reported-screens.mts', ['desktop']);
});

await check('ownerreportedphoneen', async () => {
  return await ownerSmoke('owner-reported-screens.mts', ['phone-en']);
});

await check('ownerreportedphonevi', async () => {
  return await ownerSmoke('owner-reported-screens.mts', ['phone-vi']);
});

await check('ownerhearts', async () => {
  const P = await open(b, { w:390,h:844,touch:true }); await clear(P.page);
  const result = await P.page.evaluate(async () => {
    const G=__sv, h=G.heroes[0], wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
    G.paused=true; h.profile.hearts=3; h.hearts=3;
    const protectedModes=[];
    for(const [age,difficulty] of [['little','hard'],['big','easy'],['big','medium']]) {
      h.profile.age=age;h.profile.difficulty=difficulty;G.hurt(h,2);
      protectedModes.push(h.hearts===3 && !h._rescuing);
    }
    h.profile.age='big';h.profile.difficulty='hard';G.hurt(h,2);
    const lost=h.hearts===1;
    const safe={x:h.lastSafe.x,z:h.lastSafe.z};h.pos.x+=12;h.stamina=0;h.exhausted=true;
    G.hurt(h,1);const started=h._rescuing && h.hearts===0;
    await wait(1000);
    const rescued=h.hearts===3 && h.stamina===h.staminaMax && !h.exhausted && !h._rescuing && Math.hypot(h.pos.x-safe.x,h.pos.z-safe.z)<.01;
    G.paused=false;return {protectedModes,lost,started,rescued};
  });
  ok(result.protectedModes.every(Boolean) && result.lost && result.started && result.rescued, JSON.stringify(result));
  ok(!P.errors.length,P.errors.join(' | '));await P.ctx.close();
  return 'fall-damage handler protects under-5/easy/medium; older Hard loses hearts; zero-heart rescue returns to lastSafe and restores hearts/stamina (emulated runtime, not a physical fall/device test)';
});

await check('ownerfamily', async () => {
  return await ownerSmoke('owner-family-smoke.mts');
});

await check('ownercapture', async () => {
  return await ownerSmoke('owner-capture-smoke.mts');
});
