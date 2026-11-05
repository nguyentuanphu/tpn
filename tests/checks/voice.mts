// Sparkle Valley checks: Voice and audio: voice packs, the microphone, songs and sounds.
// Run them through tests/run.mts (node run.mts <check>) or tests/suite.mts, not on their own.
// Moved unchanged from tests/run.mts (v1.07 split-tests, 2 Nov 2026 AEDT); see tests/checks/README.md.
import { fs, os, open, clear, noWelcome, start, URL, seedPlayers, sampled, SEED, only, want, check, ok, b, ownerSmoke } from './shared.mts';

await check('voicefirstchoice', async () => {
  const indexes = [];
  const P = await open(b, { play: false, route: async ctx => {
    ctx.on('request', q => { const m = /\/voices\/manifest[^/]*\.json/.exec(q.url()); if (m) indexes.push(m[0]); });
  } });
  try {
    await P.page.click('.screen.title .seg.lang [data-l="vi"]');
    await P.page.evaluate(async () => { window.__voiceIndexCheck = await import('/js/voice.js'); });
    await P.page.waitForFunction(() => !!window.__voiceIndexCheck.voicePack()?.signatures?.vi, null, { timeout: 30000 });
    ok(indexes.length === 1 && indexes[0] === '/voices/manifest-vi.json', 'first language choice fetched an unwanted index: ' + indexes.join(', '));
    ok(!P.errors.length, P.errors.join(' | '));
  } finally { await P.ctx.close(); }
  return 'choosing Vietnamese on the first click downloads only the Vietnamese index';
});

await check('voice', async () => {
  // HARD RULE: the downloaded (recorded) voices are the voice, on phones too. A recorded line must never be read by
  // the phone's own voice: not on a normal phone, and not on one whose Web Audio stays asleep (as iPhones do until a
  // tap takes, or after a call): then the plain audio player plays the same recording.
  const probe = async asleep => {
    const pre = `window.__speaks = 0; window.__plays = 0; window.__sources = 0;
      const sp = speechSynthesis.speak.bind(speechSynthesis); speechSynthesis.speak = u => { window.__speaks++; };
      HTMLMediaElement.prototype.play = function () { if (!/^data:/.test(this.src)) window.__plays++; setTimeout(() => this.onended && this.onended(), 50); return Promise.resolve(); };
      const st = AudioBufferSourceNode.prototype.start; AudioBufferSourceNode.prototype.start = function (...a) { if (this.buffer && this.buffer.length > 1) window.__sources++; return st.apply(this, a); };
      ${asleep ? "Object.defineProperty(AudioContext.prototype, 'state', { get: () => 'suspended' }); AudioContext.prototype.resume = () => Promise.resolve();" : ''}`;
    const P = await open(b, { w: 390, h: 760, touch: true, lang: 'vi', pre, settings: { voice: true } }); await clear(P.page);
    await P.page.mouse.click(195, 380); await P.page.waitForTimeout(300); // the child's first tap
    const r = await P.page.evaluate(async () => {
      const V = await import('/js/voice.js'), { FAMILY_PHRASES } = V; let rec = null; for (let i = 0; i < 60 && !V.voicePack(); i++) await new Promise(r => setTimeout(r, 250)); window.__svVoiceLog = (l, t, has) => { if (has && !rec) rec = t; };
      for (const ph of FAMILY_PHRASES) { V.sayIn('vi', ph.vi); if (rec) break; }
      if (!rec) return { none: true };
      // (17 Oct AEDT, flaky on GitHub) the running game may start a line of its own meanwhile (a welcome, a sticker),
      // which rightly stops this one with nothing played: the game is paused, and a line cut off by another one (seen by
      // the captions' listener) is said again, up to 3 times; the interruptions are reported
      if (window.__sv) window.__sv.paused = true;
      const others = []; V.spoken.push(t => others.push(t)); let cut = 0;
      for (let k = 0; k < 3; k++) { others.length = 0; window.__speaks = 0; window.__plays = 0; window.__sources = 0; await V.sayAsync(rec, rec); if (!others.length) break; cut++; }
      return { line: rec, speaks: window.__speaks, plays: window.__plays, sources: window.__sources, cut, diag: V.voiceDiag };
    });
    await P.ctx.close(); return r;
  };
  const awake = await probe(false), asleep = await probe(true);
  ok(!awake.none, 'no recorded line found to try');
  ok(awake.speaks === 0 && awake.sources > 0, 'a recorded line was not played from the recording: ' + JSON.stringify(awake));
  ok(asleep.speaks === 0 && asleep.plays > 0, 'with Web Audio asleep (iPhone), a recorded line used the phone voice: ' + JSON.stringify(asleep));
  return `"${awake.line}" plays from the recording on a phone, and still does with Web Audio asleep (plain player); the phone's voice is never used for it`;
});

await check('voiceroutes', async () => {const {execFileSync}=await import('node:child_process');return execFileSync(process.execPath,['../tools/voice-routing-audit.mts','--check'],{encoding:'utf8'}).trim();});

await check('voicepack', async () => {
  // HARD RULE (VOICE-001): the recorded voices are downloaded to the device by themselves, with a small quiet progress
  // bar; every open checks quietly that they are still there and fetches only what is missing. (A cut-down pack keeps it quick.)
  // a fresh phone: its own browser profile, the cut-down pack list from the very first load, saving voices on
  // (round R item 12: a phone on mobile data downloads beyond the core only after a grown-up's yes, packCell; this check
  // is about the quiet download itself, so the yes is given; voicearea checks the question)
  const ctx = await b.newContext({ viewport: { width: 390, height: 760 }, hasTouch: true, isMobile: true }), page = await ctx.newPage(), errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await ctx.addInitScript(seedPlayers);
  await ctx.addInitScript(() => { const o = JSON.parse(localStorage.getItem('sv2_settings') || '{}'); Object.assign(o, { lang: 'vi', voice: false, sound: false, music: false, quality: 'low', autoPack: true, packCell: true }); localStorage.setItem('sv2_settings', JSON.stringify(o)); });
  const P = { ctx, page, errors };
  await P.ctx.route('**/voices/manifest-*.json', async route => { const r = await route.fetch(), j = await r.json(), keep = Object.keys(j.lines).slice(0, 24), lines = {}, langOf = {}; for (const h of keep) { lines[h] = j.lines[h]; if (j.langOf) langOf[h] = j.langOf[h]; } await route.fulfill({ json: { ...j, lines, langOf, made: 'test', signature: 'test-' + j.language } }); });
  // every text the bar shows is written down as it changes
  await P.ctx.addInitScript(() => { window.__packLog = []; new MutationObserver(() => { const e = document.querySelector('.packbar span'); if (e && window.__packLog[window.__packLog.length - 1] !== e.textContent) window.__packLog.push(e.textContent); }).observe(document, { subtree: true, childList: true, characterData: true }); });
  let firstLoad = true;
  const openAgain = async () => { if (firstLoad) { firstLoad = false; await P.page.goto(URL); } else await P.page.reload(); await start(P.page); await clear(P.page); await P.page.waitForFunction(() => window.__packLog.some(x => /✓/.test(x)), null, { timeout: 60000 }).catch(() => { }); return P.page.evaluate(() => window.__packLog); };
  // (31 Oct 2026 AEDT) the recordings are kept as a few bundles with one index (js/voicestore.ts): counted through it, and no
  // single recording files may be left in the store
  const state = () => P.page.evaluate(async () => { const c = await caches.open('sv-voices'), S = (await import(String('/js/voicestore.js'))).voiceStore('sv-voices'); await S.flush();
    return { files: [...await S.keys()].filter(k => /^voices\/.+\.mp3$/.test(k)).length, singles: (await c.keys()).filter(r => /\.mp3$/.test(r.url)).length, saved: JSON.parse(localStorage.getItem('sv2_settings')).packSaved || '' }; });
  const first = await openAgain(), s1 = await state();
  ok(first.some(x => /%/.test(x)) && first.some(x => /✓/.test(x)) && s1.files >= 24 && !s1.singles && s1.saved === 'vi:test-vi', 'first open: ' + JSON.stringify({ first: first.slice(0, 4), s1 }));
  // next open: everything is there, so nothing downloads and the bar says nothing (round O, owner: it looked as if the
  // voices loaded on every start, and listing all the files each time cost battery)
  await P.page.reload(); await start(P.page); await clear(P.page); await P.page.waitForTimeout(10000);
  const second = await P.page.evaluate(() => window.__packLog);
  ok(!second.length, 'next open: ' + JSON.stringify(second));
  // the phone cleared some files: the next open fetches only those, quietly with the bar
  await P.page.evaluate(async () => { const S = (await import(String('/js/voicestore.js'))).voiceStore('sv-voices'); for (const k of [...await S.keys()].slice(0, 5)) await S.forget(k); await S.tidy(); });
  const third = await openAgain(), s3 = await state();
  await P.page.screenshot({ path: 'out/voicepack-phone.png' });
  const errs = P.errors; await P.ctx.close();
  ok(third.some(x => /✓/.test(x)) && s3.files >= 24, 'missing files were not fetched again: ' + JSON.stringify({ third: third.slice(0, 3), s3 }));
  const resumed = third.find(x => /đã lưu/.test(x)), counts = (resumed || '').match(/\d+/g)?.map(Number) || [];
  ok(counts.length >= 2 && counts[0] > 0 && counts[0] < counts[1], 'resumed progress must include voices already cached: ' + JSON.stringify({ resumed, counts }));
  ok(!errs.length, errs.join(' | '));
  return `first open downloads with a small bar (${first.map(x => '"' + x + '"').slice(0, 2).join(' → ')} … "${first[first.length - 1]}"), the next open shows and downloads nothing, and files the phone lost are fetched again`;
});

await check('voiceonline', async () => {
  // (owner, 31 Oct 2026 AEDT: "voices play online; download only to play offline; the Welcome says the voices are
  // online; with no internet and no voices, tell the user what to download and how") a new device downloads no voice
  // pack by itself: the Welcome says the voices play over the internet and how to keep them, a line heard is kept, and
  // with no internet a grown-up is told where to keep them all
  const P = await open(b, { w: 390, h: 844, touch: true, play: false, lang: 'en', settings: { autoPack: null, voice: true } });
  const mp3 = []; P.page.on('request', q => { if (/\/voices\/.*\.mp3/.test(q.url())) mp3.push(q.url()); });
  await P.page.waitForSelector('.screen.title .tt-voice', { timeout: 60000 });
  const note = await P.page.$eval('.screen.title .tt-voice', e => ({ shown: !e.hidden && e.getBoundingClientRect().height > 0, text: e.innerText }));
  await P.page.screenshot({ path: 'out/voiceonline-welcome-phone.png' });
  ok(note.shown && /over the internet/.test(note.text) && /Keep all voices on this device/.test(note.text), 'the Welcome note: ' + JSON.stringify(note));
  await start(P.page); await clear(P.page);
  await P.page.mouse.click(195, 420); await P.page.waitForTimeout(20000);
  const r = await P.page.evaluate(async () => {
    const V = await import('/js/voice.js'), S = (await import('/js/voicestore.js')).voiceStore('sv-voices');
    for (let i = 0; i < 60 && !V.voicePack(); i++) await new Promise(r => setTimeout(r, 250));
    if (window.__sv) window.__sv.paused = true;
    let rec = null; window.__svVoiceLog = (l, t, has) => { if (has && !rec) rec = t; };
    for (const ph of V.FAMILY_PHRASES) { V.sayIn('en', ph.en); if (rec) break; }
    await new Promise(r => setTimeout(r, 2500)); await S.flush();
    return { rec, kept: await S.count(), saved: !!(await import('/js/state.js')).settings.packSaved };
  });
  ok(mp3.length < 60, `a new device downloaded ${mp3.length} recordings by itself (the voices play online)`);
  ok(r.rec && r.kept >= 1 && !r.saved, 'a line heard over the internet is kept: ' + JSON.stringify(r));
  // no internet: a line not kept cannot play, and a grown-up is told what to keep and where
  await P.ctx.setOffline(true);
  await P.page.evaluate(async () => { const V = await import('/js/voice.js'); for (const ph of V.FAMILY_PHRASES.slice(-6)) V.sayIn('en', ph.en); });
  const card = await P.page.waitForSelector('.voice-offline', { timeout: 15000 }).then(() => P.page.$eval('.voice-offline', e => ({ text: e.innerText, buttons: [...e.querySelectorAll('button')].map(x => Math.round(x.getBoundingClientRect().height)) })), () => null);
  await P.page.screenshot({ path: 'out/voiceonline-offline-phone.png' });
  ok(card && /No internet/.test(card.text) && /Keep all voices on this device/.test(card.text) && card.buttons.every(h => h >= 44), 'the offline note: ' + JSON.stringify(card));
  await P.page.click('.voice-offline button:last-child'); await P.page.waitForTimeout(300);
  ok(!(await P.page.$('.voice-offline')), 'OK closes the offline note');
  const errs = P.errors.filter(e => !/Failed to fetch|ERR_INTERNET_DISCONNECTED|NetworkError|net::/.test(e)); await P.ctx.close(); ok(!errs.length, errs.join('\n'));
  return `the Welcome says the voices play online and how to keep them; a new device downloaded ${mp3.length} recordings by itself; ${r.kept} heard kept; offline a grown-up is told "Keep all voices on this device" (buttons ${card.buttons.join('/')} px)`;
});

await check('mixedhanoivoice', async () => (await import('../mixed-hanoi-voice.mts')).mixedHanoiVoiceCheck(b));

await check('hanoivoice', async () => (await import('../hanoi-voice.mts')).hanoiVoiceCheck(b));

await check('voicebackground', async () => {
  // Owner, v1.01: male previews select the actual male file while female remains default.
  // (owner's decision, 3 Nov 2026 AEDT, v1.08 voices-aside: female voices only; not a weakened check) the male voices are
  // put aside (voices-aside/README.md): a male preview plays the female recording, the male choice is not shown in
  // Grown-ups, and a device that had chosen the male voices moves to the female ones.
  // The explicit offline job keeps downloading after Save & close and Settings redraws.
  const {lineHash}=await import('../../js/packhash.js'), requests=[];
  const preview={en:lineHash('en','Hello! Welcome to Sparkle Valley.'),vi:lineHash('vi','Xin chào! Chào mừng con đến Thung Lũng Lấp Lánh.')};
  const P=await open(b,{w:390,h:844,touch:true,lang:'vi',settings:{autoPack:false,voice:false,voiceMale:true,voiceViVariant:'leminh',packCell:true},route:async ctx=>{
    await ctx.route('**/voices/manifest-*.json',async rt=>{const r=await rt.fetch(),j=await r.json(),keys=[...new Set([preview[j.language],...Object.keys(j.lines).slice(0,30)])].filter(k=>j.lines[k]);await rt.fulfill({json:{...j,lines:Object.fromEntries(keys.map(k=>[k,j.lines[k]])),langOf:Object.fromEntries(keys.map(k=>[k,j.language])),made:'background-test',signature:'background-'+j.language}})});
    await ctx.route('**/voices/**/*.mp3',async rt=>{requests.push(rt.request().url());await new Promise(r=>setTimeout(r,350));await rt.fulfill({response:await rt.fetch()})});
  }});
  try{
    await clear(P.page);
    await P.page.evaluate(async()=>{const S=await import('/js/state.js');S.settings.voice=true;__sv.paused=true;const V=await import('/js/voice.js');V.hush();await V.previewPackVoice('f')});
    const female=requests.some(u=>u.includes('/vi/f/'+preview.vi+'.mp3'));
    const cut=requests.length;
    await P.page.evaluate(async()=>{await (await import('/js/voice.js')).previewPackVoice('m')});
    ok(female&&!requests.some(u=>/\/(en|vi)\/m\/|fpt-leminh/.test(u)),'a recording that was put aside was asked for: '+JSON.stringify(requests.slice(-6)));
    ok(requests.slice(cut).every(u=>!u.includes('/vi/m/')),'the male preview did not play the female recording: '+JSON.stringify(requests.slice(cut)));
    const moved=await P.page.evaluate(async()=>{const S=(await import('/js/state.js')).settings;return{male:S.voiceMale,vi:S.voiceViVariant,packCell:S.packCell}});
    ok(moved.male===false&&moved.vi==='standard'&&moved.packCell===true,'a device that had chosen the male voices or Lê Minh did not move to the female voices, or lost another setting: '+JSON.stringify(moved));
    await P.page.evaluate(async()=>(await import('/js/ui.js')).openGrownups());await P.page.waitForSelector('.grownups #gDone');
    await P.page.evaluate(()=>document.querySelectorAll('.grownups details').forEach(d=>d.open=true));
    const hidden=await P.page.evaluate(()=>({male:!!document.querySelector('#gVoiceMale'),maleBtn:!!document.querySelector('.grownups [data-pv="m"]'),leminh:!!document.querySelector('#gVietnamesePack, #gHanoiDownload')}));
    ok(!hidden.male&&!hidden.maleBtn&&!hidden.leminh,'Grown-ups still shows a voice that was put aside: '+JSON.stringify(hidden));
    await P.page.waitForSelector('.grownups #xPackSave');
    await P.page.evaluate(()=>document.querySelectorAll('.grownups details').forEach(d=>d.open=true));
    await P.page.locator('#xPackSave').click();
    const before=await P.page.evaluate(async()=>(await (await import(String('/js/voicestore.js'))).voiceStore('sv-voices').keys()).size);
    await P.page.locator('#gDone').click();
    await P.page.waitForSelector('.grownups',{state:'detached'});
    // Playwright 1.56 treats a returned Promise as truthy; poll asynchronous CacheStorage explicitly.
    for(let attempt=0;attempt<240;attempt++){
      const count=await P.page.evaluate(async()=>(await (await import(String('/js/voicestore.js'))).voiceStore('sv-voices').keys()).size);
      if(count>before+6)break;
      await P.page.waitForTimeout(250);
    }
    const result=await P.page.evaluate(async()=>({open:!!document.querySelector('.grownups'),male:(await import('/js/state.js')).settings.voiceMale,auto:(await import('/js/state.js')).settings.autoPack,progress:document.querySelector('.packbar')?.textContent,files:(await (await import(String('/js/voicestore.js'))).voiceStore('sv-voices').keys()).size}));
    ok(!result.open&&result.male===false&&result.auto&&result.progress&&result.files>before+6,'settings close stopped background download/progress: '+JSON.stringify({before,result}));
    await P.page.waitForFunction(()=>/✓/.test(document.querySelector('.packbar')?.textContent||''),null,{timeout:60000});
    ok(!P.errors.length,P.errors.join(' | '));
    ok(!requests.some(u=>/\/(en|vi)\/m\/|fpt-leminh/.test(u)),'the offline download asked for a recording that was put aside');
    return 'female voices only (owner, 3 Nov 2026 AEDT): both previews play the female MP3, no male or Lê Minh choice in Grown-ups, a device that had chosen them moved to female with its other settings kept; the explicit offline download continues with shared progress after Save & close';
  }finally{await P.ctx.unrouteAll({behavior:'ignoreErrors'});await P.ctx.close()}
});

await check('ownerwificard', async () => {
  const P=await open(b,{w:390,h:844,touch:true,settings:{autoPack:false,lang:'en',bilingual:false},pre:()=>{
    const c=new EventTarget();c.type='cellular';c.saveData=false;
    Object.defineProperty(navigator,'connection',{get:()=>c,configurable:true});
    window.__ownerWifi=()=>{c.type='wifi';c.dispatchEvent(new Event('change'));};
  },route:async ctx=>{
    await ctx.route('**/voices/areas.json',r=>r.fulfill({json:{groups:{core:'en_core_wifi',world:'en_world_wifi'},size:{core:{en:1024},world:{en:2048}}}}));
    await ctx.route('**/voices/en/f/*_wifi.mp3',r=>r.fulfill({contentType:'audio/mpeg',body:Buffer.from([0xff,0xfb,0x90,0])}));
  }});
  try {
    await clear(P.page);
    await P.page.evaluate(async()=>{
      const S=await import('/js/state.js'),V=await import('/js/voicepack.js');S.settings.autoPack=true;S.settings.packCell=false;delete S.settings.packAskAt;
      V.startPack({lines:{en_core_wifi:'f',en_world_wifi:'f'},langOf:{en_core_wifi:'en',en_world_wifi:'en'},areas:true,version:999,made:'owner-wifi-card'},e=>{if(e.state==='ask')V.askCard(e.mb);},()=>null);
    });
    await P.page.waitForSelector('.packask',{timeout:20000});
    // Switching network during a grown-up hold must cancel that pending mobile consent.
    await P.page.locator('.packask button').first().dispatchEvent('pointerdown');
    await P.page.waitForTimeout(200);
    await P.page.evaluate(()=>window.__ownerWifi());
    await P.page.waitForTimeout(1400);
    await P.page.waitForFunction(()=>!document.querySelector('.packask') && JSON.parse(localStorage.getItem('sv2_settings')||'{}').packLangs==='en',null,{timeout:12000});
    const s=await P.page.evaluate(()=>JSON.parse(localStorage.getItem('sv2_settings')));
    ok(s.packCell===false,'Wi-Fi continuation must not grant mobile-data permission');
    await P.page.evaluate(async()=>{(await import('/js/voicepack.js')).askCard(139);});
    ok(!(await P.page.locator('.packask').count()),'a delayed mobile prompt must not reopen on Wi-Fi');
    ok(!P.errors.length,P.errors.join(' | '));
  } finally {await P.ctx.close();}
  // (owner, 16 Oct: each explanation can be switched off in Studio) with explain_voiceAsk off, the same phone on mobile
  // data never asks and never fetches past the core voices: the rest waits for Wi-Fi
  let rest=0;
  const Q=await open(b,{w:390,h:844,touch:true,settings:{autoPack:false,lang:'en',bilingual:false},pre:()=>{
    const c=new EventTarget();c.type='cellular';c.saveData=false;Object.defineProperty(navigator,'connection',{get:()=>c,configurable:true});
  },route:async ctx=>{
    await ctx.route('**/content/custom.json*',async r=>{let j={};try{j=await(await r.fetch()).json();}catch(e){}j.features={...(j.features||{}),explain_voiceAsk:false};await r.fulfill({contentType:'application/json',body:JSON.stringify(j)});});
    await ctx.route('**/voices/areas.json',r=>r.fulfill({json:{groups:{core:'en_core_wifi',world:'en_world_wifi'},size:{core:{en:1024},world:{en:2048}}}}));
    await ctx.route('**/voices/en/f/*_wifi.mp3',r=>{if(/world/.test(r.request().url()))rest++;r.fulfill({contentType:'audio/mpeg',body:Buffer.from([0xff,0xfb,0x90,0])});});
  }});
  try {
    await clear(Q.page);
    await Q.page.evaluate(async()=>{
      const S=await import('/js/state.js'),V=await import('/js/voicepack.js');S.settings.autoPack=true;S.settings.packCell=false;delete S.settings.packAskAt;
      const ev=window.__packEv=[];V.startPack({lines:{en_core_wifi:'f',en_world_wifi:'f'},langOf:{en_core_wifi:'en',en_world_wifi:'en'},areas:true,version:998,made:'owner-wifi-card-off'},e=>{ev.push(e.state);if(e.state==='ask')V.askCard(e.mb);},()=>null);
    });
    // (the pack waits for the valley to be built first) the core is in, then a few seconds for a question that must not come
    await Q.page.waitForFunction(()=>window.__packEv.includes('ready'),null,{timeout:90000}).catch(()=>{});
    await Q.page.waitForTimeout(3000);
    const asked=await Q.page.evaluate(()=>window.__packEv);
    ok(asked.includes('ready')&&!asked.includes('ask')&&!(await Q.page.locator('.packask').count()),'switched off, the phone still asked: '+asked.join(','));
    ok(!rest,`switched off, ${rest} voice files past the core came over mobile data`);
    ok(!Q.errors.length,Q.errors.join(' | '));
  } finally {await Q.ctx.close();}
  return 'Bounded two-file fixture: Wi-Fi automatically completes remaining voices, dismisses the old mobile permission card and rejects delayed prompts without granting mobile consent; with Studio\'s explain_voiceAsk off, no question and nothing past the core on mobile data';
});

await check('ownervoicewifi', async () => {
  // A tiny real downloader run exercises full Wi-Fi completion and a language change
  // while an area request is in flight, without downloading a 139 MiB fixture.
  const langs = ['en', 'vi'], groups = ['core', 'nearby', 'games'], lines = {}, langOf = {}, hashes = {};
  for (const g of groups) for (const L of langs) {
    const h = L + '_' + g; lines[h] = ['f']; langOf[h] = L; (hashes[g] ||= []).push(h);
  }
  let releaseNear, nearStarted;
  const started = new Promise(resolve => { nearStarted = resolve; });
  const held = new Promise(resolve => { releaseNear = resolve; });
  const got = [];
  const P = await open(b, {w:390,h:844,touch:true,pre:`Object.defineProperty(navigator,'connection',{get:()=>({type:'wifi',saveData:false}),configurable:true});`,settings:{lang:'en',bilingual:false,autoPack:false},route:async ctx => {
    await ctx.route('**/voices/areas.json', r => r.fulfill({json:{groups:Object.fromEntries(Object.entries(hashes).map(([g,hs])=>[g,hs.join(' ')])),size:{}}}));
    // (r82, lighter loading) the game reads one voice list per language: the same tiny pack, served per language, so a
    // language change loads this test's Vietnamese list rather than the real one
    await ctx.route(/\/voices\/manifest-(en|vi|zh|hi)\.json$/, r => { const L = /manifest-(\w+)\.json$/.exec(r.request().url())[1];
      r.fulfill({json:{version:999,made:'owner-wifi-language-switch',language:L,areas:true,cast:{[L]:['f']},voices:{},tpl:{},lines:Object.fromEntries(Object.entries(lines).filter(([h])=>langOf[h]===L))}}); });
    await ctx.route('**/voices/*/f/*_*.mp3', async r => {
      const file = new globalThis.URL(r.request().url()).pathname;
      got.push(file);
      if (file.endsWith('/en_nearby.mp3')) { nearStarted(); await held; }
      await r.fulfill({status:200,contentType:'audio/mpeg',body:Buffer.from([0xff,0xfb,0x90,0])});
    });
  }});
  try {
    await clear(P.page);
    await P.page.evaluate(async pack => {
      const S=await import('/js/state.js'), V=await import('/js/voicepack.js');
      S.settings.autoPack=true; S.settings.packCell=false;
      window.__ownerPackProgress=[];
      // (r82, lighter loading) a newly loaded language list restarts the downloader with the game's own reporter: hear it too
      (await import('/js/voice.js')).onPackProgress(e=>window.__ownerPackProgress.push(e));
      V.startPack(pack,e=>window.__ownerPackProgress.push(e),()=> 'nearby');
    },{lines,langOf,areas:true,version:999,made:'owner-wifi-language-switch'});
    let timer;
    try { await Promise.race([started,new Promise((_,reject)=>{timer=setTimeout(()=>reject(new Error('Wi-Fi did not automatically start the nearby area after core')),20000);})]); }
    finally {clearTimeout(timer);}
    ok(got[0].endsWith('/en_core.mp3') && !got.some(u=>u.includes('/vi/')),'selected English core comes first: '+JSON.stringify(got));
    await P.page.evaluate(async()=>{const S=await import('/js/state.js'),{events}=await import('/js/core/events.js');S.settings.lang='vi';events.emit('LanguageChanged');});
    await P.page.waitForTimeout(1900); // the debounced recheck happens during the held request
    releaseNear();
    await P.page.waitForFunction(()=>{
      const s=JSON.parse(localStorage.getItem('sv2_settings')||'{}');
      return s.packLangs==='vi' && window.__ownerPackProgress.some(e=>e.state==='ready' && !e.core);
    },null,{timeout:20000});
    const urls=await P.page.evaluate(async()=> [...await (await import(String('/js/voicestore.js'))).voiceStore('sv-voices').keys()]);
    ok(groups.every(g=>urls.some(u=>u.endsWith('/vi_'+g+'.mp3'))),'full selected Vietnamese pack automatically completed on Wi-Fi: '+JSON.stringify(got));
    ok(!got.some(u=>u.endsWith('/en_games.mp3')),'old-language remaining areas should stop after the in-flight batch');
    const progress=await P.page.evaluate(()=>window.__ownerPackProgress);
    ok(progress.every(e=>e.state!=='loading'||e.done<=e.total),'bounded progress after language change');
    ok(!P.errors.length,P.errors.join(' | '));
    return 'Bounded six-file fixture: Wi-Fi automatically starts core then nearby; changing language during a held area request completes every selected-language file, stops remaining old-language areas, preserves cache and bounded progress (not full asset/audio/device proof)';
  } finally {releaseNear();await P.ctx.close();}
});

await check('voicecover', async () => {
  // (round R item 12) the coverage check: every line the game can speak has its recordings (both voices), is in the
  // pack's list and in an area; lines with changing words are templates whose fixed pieces, gap words and numbers are
  // recorded as parts; what can't be listed in advance is counted with its reason (tools/make-voice-pack.mts --cover)
  const { execFileSync } = await import('child_process');
  let out = ''; try { out = execFileSync(process.execPath, ['../tools/make-voice-pack.mts', '--cover'], { encoding: 'utf8', maxBuffer: 1 << 26 }); } catch (e) { out = (e.stdout || '') + ''; }
  const r = JSON.parse(out.trim().split('\n').pop());
  ok(!r.bad.length, `${r.bad.length} lines not covered: ` + r.bad.slice(0, 12).join(' | '));
  // in the game: a line with a number is put together from recorded parts, and a gap that is a name is left out; the
  // phone's own voice is never used for either
  const pre = `window.__speaks = 0; window.__srcs = 0; speechSynthesis.speak = u => { window.__speaks++; setTimeout(() => u.onend && u.onend(), 10); };
    const st = AudioBufferSourceNode.prototype.start; AudioBufferSourceNode.prototype.start = function (...a) { if (this.buffer && this.buffer.length > 1) { window.__srcs++; setTimeout(() => this.onended && this.onended(), 30); } return st.apply(this, a); };`;
  const P = await open(b, { w: 900, h: 640, pre, settings: { voice: true, bilingual: false } }); await clear(P.page);
  const g = await P.page.evaluate(async () => {
    const V = await import('/js/voice.js'), wait = ms => new Promise(r => setTimeout(r, ms));
    for (let k = 0; k < 60 && !V.voicePack(); k++) await wait(250);
    const res = {};
    // (17 Oct AEDT, flaky on GitHub) a line of the running game's own (a welcome, a sticker) rightly stops this one part
    // way: the game is paused, and a line cut off by another one (seen by the captions' listener) is said again, up to 3
    // times; the interruptions are reported
    if (window.__sv) window.__sv.paused = true;
    const others = []; V.spoken.push(t => others.push(t));
    for (const [key, line] of [['number', 'That costs 47. Sell some things first!'], ['name', 'Zorbly is here! Hold on and kick your legs: tap, tap, tap!']]) {
      res[key] = { parts: V.lineParts('en', line), cut: 0 };
      for (let k = 0; k < 3; k++) { others.length = 0; window.__speaks = 0; window.__srcs = 0; await V.sayAsync(line, line); if (!others.length) break; res[key].cut++; }
      res[key].speaks = window.__speaks; res[key].srcs = window.__srcs; res[key].diag = { ...V.voiceDiag }; // (why a part did not play, when it does not)
    }
    return res;
  });
  const errs = P.errors; await P.ctx.close();
  ok(g.number.parts && g.number.parts.some(p => p[1] === '47') && !g.number.speaks && g.number.srcs >= 3, 'a line with a number: ' + JSON.stringify(g.number));
  ok(g.name.parts && g.name.parts.some(p => p[1] === 'Zorbly') && !g.name.speaks && g.name.srcs >= 1, 'a line with a name: ' + JSON.stringify(g.name));
  ok(!errs.length, errs.join(' | '));
  return `${r.lines} lines and ${r.parts} parts recorded, ${r.templates} templates, ${r.areas} areas; ${Object.entries(r.reasons).map(([k, v]) => `${v} × ${k}`).join('; ')}; "That costs 47." plays from ${g.number.srcs} recorded parts and a name in a gap is left out, never the phone's voice`;
});

await check('voicearea', async () => {
  // (round R item 12, owner 10 Oct: "wifi should automatically, ask user to allow download over mobile") a new phone on
  // mobile data downloads only the core, only in its children's language, then asks a grown-up (press and hold); Not now
  // keeps it at the core; on Wi-Fi the rest comes area by area, the place the child is in first; a computer that can't
  // tell counts as Wi-Fi; a start with the core already there downloads nothing
  const areas = JSON.parse(fs.readFileSync('../voices/areas.json', 'utf8')), groupOf = new Map();
  for (const [g, hs] of Object.entries(areas.groups)) for (const h of String(hs).split(' ')) groupOf.set(h, g);
  const mb = n => n / 1048576, core = areas.size.core;
  // (16 Oct: a Vietnamese line added without its language was looked for under voices/en/, so the core pack never
  // finished and the grown-ups' question never came) every line of the pack is a file where the game looks for it
  { const man = JSON.parse(fs.readFileSync('../voices/manifest.json', 'utf8')), other = new Map(); for (const [L, hs] of Object.entries(man.other || {})) for (const h of String(hs).split(' ')) if (h) other.set(h, L);
    const gone = []; for (const [h, slots] of Object.entries(man.lines)) for (const sl of slots) { const f = `../voices/${other.get(h) || 'en'}/${sl}/${h}.mp3`; if (!fs.existsSync(f)) gone.push(f.slice(3)); }
    ok(!gone.length, `${gone.length} voice files are not where the game looks for them: ${gone.slice(0, 4).join(', ')}`); }
  ok(mb(core.en) >= 5 && mb(core.en) <= 8 && mb(core.vi) >= 5 && mb(core.vi) <= 8, `the core pack is not 5–8 MB per language: en ${mb(core.en).toFixed(1)}, vi ${mb(core.vi).toFixed(1)}`);
  const place = ['hanoi', 'village', 'town', 'market'].find(g => areas.groups[g] && g !== 'core') || Object.keys(areas.groups).find(g => !['core', 'games', 'stories', 'festivals', 'world'].includes(g));
  // a pretend connection the check can switch: navigator.connection.type 'cellular' or 'wifi'
  const net = type => `(() => { const c = new EventTarget(); c.type = '${type}'; c.saveData = false; Object.defineProperty(navigator, 'connection', { get: () => c, configurable: true }); window.__setNet = t => { c.type = t; c.dispatchEvent(new Event('change')); }; })();`;
  const watch = P => { const got = []; P.page.on('request', q => { const m = /\/voices\/(\w+)\/(\w)\/([\w-]+)\.mp3/.exec(q.url()); if (m) got.push({ lang: m[1], g: groupOf.get(m[3]) || 'world' }); }); return got; };
  const P = await open(b, { w: 390, h: 760, touch: true, play: false, pre: net('cellular'), settings: { autoPack: true, lang: 'en', bilingual: false } });
  const got = watch(P);
  await start(P.page); await clear(P.page);
  await P.page.mouse.click(195, 380);
  await P.page.waitForSelector('.packask', { timeout: 180000 });
  await P.page.waitForTimeout(1500);
  const n1 = got.length, notCore = got.filter(x => x.g !== 'core'), notEn = got.filter(x => x.lang !== 'en');
  const text = await P.page.$eval('.packask', e => e.textContent);
  await P.page.screenshot({ path: 'out/voicearea-phone.png' });
  ok(n1 > 50 && !notCore.length && !notEn.length, `mobile data: ${n1} files, ${notCore.length} not in the core (${JSON.stringify(notCore.slice(0, 3))}), ${notEn.length} not English`);
  ok(/mobile data/.test(text) && /\d+ MB/.test(text), 'the question: ' + text);
  // a quick tap on Yes is not a yes (a little one's finger); Not now closes it and nothing more downloads
  await P.page.click('.packask button'); await P.page.waitForTimeout(400);
  ok(await P.page.$('.packask'), 'a quick tap on Yes said yes');
  await P.page.click('.packask button:last-child'); await P.page.waitForTimeout(3000);
  ok(!(await P.page.$('.packask')) && got.length === n1, `after Not now: ${got.length - n1} more files`);
  // onto Wi-Fi, in a place: the rest downloads by itself, that place first
  await P.page.evaluate(async place => { const { events } = await import('/js/core/events.js'); events.emit('PlayerEnteredVillage', { playerId: 'player:test', villageId: 'place:' + place }); window.__setNet('wifi'); }, place);
  for (let k = 0; k < 60 && got.length < n1 + 12; k++) await P.page.waitForTimeout(500);
  const next = got.slice(n1, n1 + 12);
  ok(next.length >= 12 && next.every(x => x.g === place) && next.every(x => x.lang === 'en'), `on Wi-Fi the first files after the core: ${JSON.stringify(next.slice(0, 4))} (wanted ${place})`);
  await P.ctx.close();
  // (sample: the mobile-data part always; the next start and the computer take turns; all when voice files change)
  const vsam = sampled('voicearea'), doQ = !vsam || SEED % 2 === 0, doC = !vsam || SEED % 2 === 1, errs = [...P.errors];
  if (doQ) {
  // the next start on mobile data, core there, Not now said: nothing downloads and nothing is asked
  const Q = await open(b, { w: 390, h: 760, touch: true, play: false, pre: net('cellular'), settings: { autoPack: true, lang: 'en', bilingual: false } });
  // (a fresh profile: give it the core first, with the grown-up's answer already given)
  const got2 = watch(Q); await start(Q.page); await clear(Q.page); await Q.page.mouse.click(195, 380);
  await Q.page.waitForSelector('.packask', { timeout: 180000 }); await Q.page.click('.packask button:last-child');
  const n2 = got2.length; await Q.page.reload(); await start(Q.page); await clear(Q.page); await Q.page.mouse.click(195, 380); await Q.page.waitForTimeout(10000);
  const again = got2.length - n2, asked = !!(await Q.page.$('.packask'));
  errs.push(...Q.errors); await Q.ctx.close();
  ok(!again && !asked, `next start with the core there: ${again} files downloaded, asked again: ${asked}`);
  }
  if (doC) {
  // a computer that can't tell its connection counts as Wi-Fi: past the core with no question
  const C = await open(b, { w: 1180, h: 760, play: false, pre: `Object.defineProperty(navigator, 'connection', { get: () => undefined, configurable: true });`, settings: { autoPack: true, lang: 'vi', bilingual: false } });
  const got3 = watch(C); await start(C.page); await clear(C.page); await C.page.mouse.click(590, 380);
  // (r63, owner: the bar said 108 %) every progress report stays at or under 100 %, the bar's words too
  await C.page.evaluate(async () => { const V = await import('/js/voice.js'); window.__packOver = []; V.onPackProgress(e => { if (e.state === 'loading' && e.done > e.total) window.__packOver.push(e.done + '/' + e.total); const t = document.querySelector('.packbar') && document.querySelector('.packbar').textContent; const m = t && /(\d+)\s*%/.exec(t); if (m && +m[1] > 100) window.__packOver.push(t); }); });
  // (the core, about 550 files, comes first: in the full suite that can take a few minutes)
  for (let k = 0; k < 720 && !got3.some(x => x.g !== 'core'); k++) await C.page.waitForTimeout(500);
  const asked3 = !!(await C.page.$('.packask')), en3 = got3.filter(x => x.lang === 'en').length, over3 = await C.page.evaluate(() => window.__packOver); await C.ctx.close();
  ok(!over3.length, `the voices bar went past 100 %: ${over3.slice(0, 3).join(', ')}`);
  ok(got3.some(x => x.g !== 'core') && !asked3 && !en3, `a computer: past the core ${got3.some(x => x.g !== 'core')}, asked ${asked3}, English files for a Vietnamese family ${en3}`);
  }
  ok(!errs.length, errs.join(' | '));
  return `${vsam ? `SAMPLE (${doQ ? 'next start' : 'computer'} part this run; all when voice files change): ` : ''}core ${mb(core.en).toFixed(1)} MB (English) / ${mb(core.vi).toFixed(1)} MB (Vietnamese) of ${(Object.values(areas.size).reduce((a, z) => a + (z.en || 0) + (z.vi || 0) + (z.zh || 0) + (z.hi || 0), 0) / 1048576).toFixed(0)} MB; mobile data: ${n1} core files in English only, then "${text.slice(0, 50)}…" (hold for yes); Wi-Fi: ${place} first; the next start downloads nothing; a computer goes on by itself`;
});

await check('welcomevoice', async () => {
  // HARD RULE 11: the recorded voice is the voice. Lines with a child's or friend's name can't be recorded, so the game
  // shows the name and speaks a recorded line (owner, round F: the welcome was still in the phone's voice). A new
  // player: tapping their picture, starting, and Ông Cú's welcome must speak only recorded lines.
  const P = await open(b, { w: 900, h: 640, play: false, settings: { voice: true } });
  await P.page.evaluate(() => { localStorage.removeItem('sv2_voiceMisses'); });
  const said = [];
  await P.page.exposeFunction('__said', t => said.push(t));
  await P.page.evaluate(async () => { const V = await import('/js/voice.js'), S = await import('/js/state.js'); V.spoken.push(t => window.__said(t)); S.profiles[0].name = 'Kiwi'; S.profiles[0].quests.owl = false; S.saveProfiles(true); }); // (a name no recording can know, like a real child's)
  await (await import('../harness.mts')).start(P.page);
  const r = await P.page.evaluate(async () => {
    const G = __sv, h = G.heroes[0], V = await import('/js/voice.js'), wait = ms => new Promise(r => setTimeout(r, ms));
    for (let k = 0; k < 40 && !V.voicePack(); k++) await wait(250);
    if (!document.querySelector('.dialog:not(.out)')) { h.profile.quests.owl = false; G._owlAuto = false; }
    const owl = G.interactables.find(i => /owl/i.test(i.id || '')); if (owl) { h.place(owl.x, owl.z + 1.5); }
    // (round R) with the story on, Ông Cú's welcome is the prologue film, then "Who will fly with you, Kiwi?"
    for (let k = 0; k < 60 && !document.querySelector('.dialog:not(.out)'); k++) { await wait(250); const x = document.querySelector('.theatre .th-x'); if (x && k > 8) x.click(); }
    const d = document.querySelector('.dialog .dtext'), shown = d ? d.textContent : '';
    return { shown, pack: !!V.voicePack() };
  });
  const rec = await P.page.evaluate(async lines => { const V = await import('/js/voice.js'), hash = (await import('/js/packhash.js')).lineHash, pack = V.voicePack(); return lines.map(t => [t, !!(pack && pack.lines[hash('en', t)])]); }, said);
  const errs = P.errors; await P.ctx.close();
  const notRecorded = rec.filter(([, ok]) => !ok).map(([t]) => t);
  ok(r.pack && /Good morning, Kiwi|with you, Kiwi/.test(r.shown) && said.length && !notRecorded.length && !errs.length, JSON.stringify({ shown: r.shown, said, notRecorded, errs }));
  return `Ông Cú's welcome shows the child's name ("${r.shown.slice(0, 40)}…") and every spoken line (${said.length}) has a recording`;
});

await check('micoff', async () => {
  // (r63, owner: "the microphone should always be off until the user turns it on"; on an iPhone the tap did nothing)
  // starting or joining a room never asks for the microphone; the HUD's Mic button starts off; one tap asks (inside the
  // tap) and turns it on; the next tap turns it off (the track goes quiet), the next on again
  const P = await open(b, { w: 900, h: 640, pre: `(() => { window.__gum = 0; const md = navigator.mediaDevices; if (!md) return; const real = md.getUserMedia.bind(md);
    md.getUserMedia = c => { window.__gum++; const a = new AudioContext(), o = a.createOscillator(), d = a.createMediaStreamDestination(); o.connect(d); o.start(); return Promise.resolve(d.stream); }; })()` });
  await clear(P.page);
  const r = await P.page.evaluate(async () => {
    const { Net } = await import('/js/net.js'), G = __sv, wait = ms => new Promise(r => setTimeout(r, ms)), said = [];
    Net.on('status', s => said.push(s.key));
    const startMuted = Net.muted;
    Net.host({ name: 'Bé Na' }).catch(() => { }); await wait(1500);
    const asked = window.__gum, hint = said.includes('mictap');
    const btn = () => document.querySelector('.dk.call'), label = () => btn() && btn().querySelector('small').textContent;
    G.huds.forEach(hd => hd.setCall(true, false, Net.muted || !Net.mic)); const before = label();
    await G.toggleMute(); const on = { mic: !!Net.mic, muted: Net.muted, live: Net.mic && Net.mic.getAudioTracks()[0].enabled, label: label(), asked: window.__gum };
    await G.toggleMute(); const off = { muted: Net.muted, live: Net.mic.getAudioTracks()[0].enabled, label: label(), asked: window.__gum };
    await G.toggleMute(); const again = { muted: Net.muted, live: Net.mic.getAudioTracks()[0].enabled };
    try { Net.close(); } catch (e) { }
    return { startMuted, asked, hint, before, on, off, again };
  });
  const errs = P.errors.filter(e => !/peer|Peer|socket|lost connection/i.test(e)); await P.ctx.close();
  ok(r.startMuted && r.asked === 0, `starting a room asked for the microphone ${r.asked} times (muted at start: ${r.startMuted})`);
  ok(r.hint, 'no "your microphone is off" hint when the room started');
  ok(r.before === 'Mic off', `the Mic button says "${r.before}" before a tap`);
  ok(r.on.mic && !r.on.muted && r.on.live && r.on.label === 'Mic on' && r.on.asked === 1, 'the first tap: ' + JSON.stringify(r.on));
  ok(r.off.muted && !r.off.live && r.off.label === 'Mic off' && r.off.asked === 1, 'the second tap: ' + JSON.stringify(r.off));
  ok(!r.again.muted && r.again.live, 'the third tap: ' + JSON.stringify(r.again));
  ok(!errs.length, errs.join(' | '));
  return 'a room starts with the microphone off and asks for nothing; Mic off → one tap asks and turns it on → off → on';
});

await check('songs', async () => {
  // round N (owner): Trung Thu music at Trung Thu (and Tết at Tết…), Vietnamese tunes in the Vietnam areas, a 🎵 Songs
  // page (from the Simple screen's Music group and from Settings) with hát ru words, a night look and a sleep timer;
  // the family's Studio recordings come first; plus the reef stays in the lake and the star counter clears the top bar
  const P = await open(b, { w: 390, h: 844, touch: true }); await clear(P.page);
  await P.page.mouse.click(200, 420);
  const r = await P.page.evaluate(async () => {
    const S = await import('/js/state.js'), A = await import('/js/audio.js'), W = await import('/js/world.js'), C = await import('/js/content/songs.js'), CU = await import('/js/custom.js'), w = t => new Promise(res => setTimeout(res, t)), G = __sv, out = {};
    S.settings.music = true; A.Music.stop();
    // a festival: its own songs
    S.settings.festival = 'midautumn'; G.festivals.rebuild(); await w(800); out.trungthu = A.Music.key;
    S.settings.festival = 'none'; G.festivals.rebuild();
    // the Vietnam village: Vietnamese tunes
    const h = G.heroes[0]; h.pos.x = W.VILLAGE.x; h.pos.z = W.VILLAGE.z + 4; h.pos.y = W.heightAt(h.pos.x, h.pos.z); await w(1200); out.region = G.regionOf[0]; out.village = A.Music.key;
    // the family's recording comes first for its tags
    CU.CUSTOM.music = [{ id: 'bairu', file: 'content/music/bairu.mp3', en: 'Our lullaby', vi: 'Bài ru của mẹ', tags: ['lullaby', 'midautumn'] }];
    out.famFest = C.songsFor('midautumn'); out.famVn = C.songsFor('vn');
    // the 🎵 Songs page: lullabies with words, night, sleep timer; the valley leaves the music alone while it is open
    const pg = G.openSongs('lullaby'); await w(300);
    document.querySelector('.songs [data-s="ru1"]').click(); await w(300);
    out.page = { night: document.querySelector('.songs').classList.contains('night'), words: document.querySelectorAll('.sg-words p').length, key: A.Music.key, pinned: A.Music.pinned, family: !!document.querySelector('.songs [data-g="family"]'), timer: document.querySelectorAll('.sg-sleep [data-t]').length };
    await w(1200); out.stillLullaby = A.Music.key;
    A.Music.fadeOut(.3); await w(600); out.faded = A.Music.key;
    pg.close(); out.closed = { page: !!document.querySelector('.songs'), pinned: A.Music.pinned };
    delete CU.CUSTOM.music;
    // the reef: inside the lake, on ground under the water
    out.reef = (G.world.waterSites || []).map(s => ({ id: s.id, inside: Math.hypot(s.x - W.LAKE.x, s.z - W.LAKE.z) + s.r < W.LAKE.r - 2, under: W.heightAt(s.x, s.z) < W.WATER - .3 }));
    return out;
  });
  // the Simple screen's Music group starts with 🎵 Songs; Settings has a Songs card
  await P.page.evaluate(() => { __sv.simple.show(); __sv.simple.openGroup('games', 'music'); document.querySelectorAll('.dialog').forEach(d => d.remove()); });
  r.simple = await P.page.evaluate(async () => { const first = __sv.simple.view.stops.find(x => x === 'songs'); [...document.querySelectorAll('.sp-stop')].find(b => /^(Songs|Bài hát)$/.test(b.getAttribute('aria-label'))).click(); await new Promise(res => setTimeout(res, 400)); const open = !!document.querySelector('.songs'); document.querySelector('.songs .sg-x').click(); __sv.simple.hide(); return { first, open }; });
  // the star counter sits under the game's top bar (it covered 📺 on notched phones)
  await P.page.evaluate(() => { __sv.playGame(0, 'counting'); }); await P.page.waitForSelector('.gl .starbox'); // (not waiting for the game to end)
  r.star = await P.page.evaluate(() => { const s = document.querySelector('.gl .starbox').getBoundingClientRect(), hb = [...document.querySelectorAll('.gl-head button')].map(b => b.getBoundingClientRect()); return { clear: hb.every(b => s.top >= b.bottom - 1 || s.bottom <= b.top || s.right <= b.left || s.left >= b.right) }; });
  const errs = P.errors; await P.ctx.close();
  ok(['trungthu1', 'trungthu2'].includes(r.trungthu), 'Trung Thu music: ' + r.trungthu);
  ok(r.region === 'village' && ['village', 'village2', 'vn_sang', 'vn_dong', 'folk'].includes(r.village), 'Vietnam area music: ' + JSON.stringify([r.region, r.village]));
  ok(r.famFest.join() === 'file:bairu' && r.famVn.includes('vn_sang'), 'family recordings first: ' + JSON.stringify([r.famFest, r.famVn]));
  ok(r.page.night && r.page.words >= 4 && r.page.key === 'ru1' && r.page.pinned && r.page.family && r.page.timer === 3 && r.stillLullaby === 'ru1' && r.faded === null && !r.closed.page && !r.closed.pinned, 'songs page: ' + JSON.stringify(r.page) + ' ' + r.stillLullaby + ' ' + r.faded + ' ' + JSON.stringify(r.closed));
  ok(r.simple.first === 'songs' && r.simple.open, 'Simple screen songs: ' + JSON.stringify(r.simple));
  ok(r.reef.length === 2 && r.reef.every(x => x.inside && x.under), 'water landmarks: ' + JSON.stringify(r.reef));
  ok(r.star.clear && !errs.length, JSON.stringify({ star: r.star, errs }));
  return `Trung Thu → ${r.trungthu}; Lotus Village → ${r.village}; family recordings first; Songs page: lullaby words, night, sleep timer, valley music left alone; Simple screen Music group starts with Songs; reef and Hạ Long inside the lake; star counter clear of the top bar`;
});

await check('soundsw', async () => {
  // (Round U, owner 11 Oct: "there are no sounds and voices option to turn on and off") the Simple screen's Sound button
  // and the valley's Sound button open three big switches (music, sounds, voice); each turns only its own sound on or off
  const out = [];
  const P = await open(b, { w: 390, h: 844, touch: true, screen: null }); const page = P.page;
  await page.waitForSelector('.simple-screen:not([hidden]) .sp-sound', { timeout: 20000 });
  await page.evaluate(() => document.querySelectorAll('.dialog').forEach(d => d.remove()));
  const flip = async (k, want) => { await page.click(`.soundsheet .ss-sw[data-k="${k}"]`); await page.waitForTimeout(200); const v = await page.evaluate(() => { const s = __sv.settings; return { music: !!s.music, sound: !!s.sound, voice: !!s.voice }; }); return v; };
  await page.click('.sp-sound'); await page.waitForSelector('.soundsheet .ss-sw', { timeout: 5000 }).catch(() => out.push('Simple screen: no Sound switches'));
  if (!out.length) {
    const s0 = await page.evaluate(() => ({ music: !!__sv.settings.music, sound: !!__sv.settings.sound, voice: !!__sv.settings.voice }));
    const s1 = await flip('voice'); if (s1.voice === s0.voice || s1.sound !== s0.sound || s1.music !== s0.music) out.push('voice switch: ' + JSON.stringify([s0, s1]));
    const s2 = await flip('music'); if (s2.music === s1.music || s2.voice !== s1.voice) out.push('music switch: ' + JSON.stringify([s1, s2]));
    const s3 = await flip('sound'); if (s3.sound === s2.sound || s3.voice !== s2.voice) out.push('sound switch: ' + JSON.stringify([s2, s3]));
    const n = await page.evaluate(() => document.querySelectorAll('.soundsheet .ss-sw').length); if (n !== 3) out.push(n + ' switches');
    await page.keyboard.press('Escape'); await page.waitForTimeout(300);
  }
  // the valley: the dock's Sound button (computer size, where the dock shows it)
  const Q = await open(b, { w: 1280, h: 800 }); await clear(Q.page);
  await Q.page.click('.hud .dk.snd'); const v = await Q.page.waitForSelector('.soundsheet .ss-sw', { timeout: 5000 }).then(() => true, () => false);
  if (!v) out.push('valley: the Sound button opens no switches');
  const errs = P.errors.concat(Q.errors); await P.ctx.close(); await Q.ctx.close();
  ok(!out.length && !errs.length, out.join(' | ') + JSON.stringify(errs));
  return 'Sound on the Simple screen and in the valley: music, sounds and voice, each switched on its own';
});

await check('mictest', async () => {
  // (Round V, owner 13 Oct: the microphone does nothing in Friends or in voice control) the grown-ups' microphone test in
  // Friends works without a room and says exactly what the device answered: on with a sound bar, or the error's name and
  // where to allow it
  const P = await open(b, { w: 390, h: 844, touch: true }); await clear(P.page);
  const r = await P.page.evaluate(async () => {
    const G = __sv, wait = ms => new Promise(r => setTimeout(r, ms)), md = navigator.mediaDevices, real = md.getUserMedia.bind(md);
    G.openPad(0, 'friend'); await wait(500);
    const btn = document.querySelector('.pad [data-mictest]'); if (!btn) return { btn: false };
    btn.click(); await wait(300);
    const m = document.querySelector('.modal.mictest'), lines = () => [...m.querySelectorAll('.mt-lines li')].map(li => li.textContent);
    const before = lines();
    m.querySelector('[data-mic]').click(); for (let k = 0; k < 30 && !/ON/.test(lines()[2]); k++) await wait(100);
    const on = lines()[2];
    md.getUserMedia = async () => { const e = new Error('blocked'); e.name = 'NotAllowedError'; throw e; };
    m.querySelector('[data-mic]').click(); await wait(300); const blocked = lines()[2]; md.getUserMedia = real;
    const small = [...m.querySelectorAll('.btn')].filter(x => x.offsetParent && x.getBoundingClientRect().height < 44).length;
    m.querySelector('.x').click(); await wait(300);
    return { btn: true, before, on, blocked, small, gone: !document.querySelector('.modal.mictest') };
  });
  const errs = P.errors; await P.ctx.close();
  ok(r.btn && r.before.length === 4 && /iOS|Safari|Chrome|browser/.test(r.before[0]) && /ON/.test(r.on) && /NotAllowedError/.test(r.blocked) && /Settings/.test(r.blocked) && !r.small && r.gone && !errs.length, JSON.stringify(Object.assign(r, { errs })));
});

await check('owneraudiobounds', async () => {
  for (const [w,h,lang] of [[390,844,'en'],[390,844,'vi'],[844,390,'vi'],[1280,800,'en'],[1280,800,'vi']]) {
    const P=await open(b,{w,h,lang,touch:true}); await clear(P.page);
    await P.page.evaluate(()=>{ __sv.huds[0].setCall(true,false,true); });
    const layout=await P.page.evaluate(()=>{const nav=document.querySelector('.hud-tr .mini-wrap').getBoundingClientRect(), tools=document.querySelector('.hud-tr .tools');return {navBottom:nav.bottom,audio:tools.querySelector('.dk.snd')?.getBoundingClientRect().y,mic:tools.querySelector('.dk.call')?.getBoundingClientRect().y};});
    ok(layout.audio>=layout.navBottom && layout.mic>=layout.navBottom,'Audio/Mic must remain under navigation: '+JSON.stringify(layout));
    await P.page.evaluate(()=>__sv.openSound(document.querySelector('.dk.snd'))); await P.page.evaluate(()=>document.fonts.ready); await P.page.waitForTimeout(550);
    const inspect=async()=>{ const box=await P.page.locator('.audio-tray').boundingBox(), sizes=await P.page.locator('.audio-tray .ss-sw').evaluateAll(els=>els.map(e=>e.getBoundingClientRect().height));
      const order=await P.page.evaluate(()=>{const a=document.querySelector('.hud .dk.snd'),c=document.querySelector('.hud .dk.chat');return c.parentNode===a.parentNode ? a.getBoundingClientRect().right<=c.getBoundingClientRect().left : true;}); ok(order,'compact Audio must be left of chat after owner-requested swap');
      const vp=P.page.viewportSize(); ok(await P.page.locator('.audio-tray button').count()===3 && box.width<=216 && box.height<=76,'Audio must contain only three discreet icon controls: '+JSON.stringify(box)); ok(box.x>=11 && box.y>=11 && box.x+box.width<=vp.width-11 && box.y+box.height<=vp.height-11 && sizes.every(n=>n>=64),JSON.stringify({w:vp.width,h:vp.height,lang,box,sizes})); };
    await inspect();
    const before=await P.page.evaluate(async()=>({...((await import('/js/state.js')).settings)}));
    await P.page.locator('.audio-tray [data-k=music]').click();
    const after=await P.page.evaluate(async()=>({...((await import('/js/state.js')).settings)}));
    ok(before.sound===after.sound && before.voice===after.voice && before.music!==after.music,'Audio switches must remain independent');
    await P.page.setViewportSize({width:320,height:568}); await P.page.waitForTimeout(300); await inspect();
    await P.page.keyboard.press('Escape'); const focus=await P.page.evaluate(()=>{const a=document.activeElement,b=document.querySelector('.hud .dk.snd');return {correct:a===b,active:{tag:a.tagName,cls:a.className},visible:b.getClientRects().length,open:document.querySelectorAll('.audio-tray').length};}); ok(focus.correct,'Escape must return focus to Audio: '+JSON.stringify(focus)); await P.page.setViewportSize({width:w,height:h}); await P.page.waitForTimeout(100);
    ok(await P.page.locator('.audio-tray').count()===0,'Closed Audio must stay closed after viewport changes');
    const errors=P.errors; await P.ctx.close(); ok(!errors.length,errors.join(' | '));
  }
  return 'EN/VI phone and VI landscape keep12px margins through font/layout/viewport changes,64px switches and independent audio states';
});

await check('ownerroadvoice', async () => {
  return await ownerSmoke('owner-road-voice.mts');
});

await check('ownerlearningvoice', async () => {
  return await ownerSmoke('owner-learning-voice.mts');
});

await check('ownervoicerefresh', async () => {
  return await ownerSmoke('owner-voice-refresh.mts');
});

await check('ownervoiceindex', async () => {
  return await ownerSmoke('owner-voice-index-download.mts');
});

await check('ownerspeechcancel', async () => {
  return await ownerSmoke('owner-speech-cancel.mts');
});

await check('animalvoices', async () => {
  // (owner, 17 Oct AEDT: "the animal voice games, the voice is not real, need real voice for animals") every animal a
  // child is asked to tell apart in "Who Says That?" plays its real recording (sounds/animals/, a decoded file, not the
  // drawn-out tone), in the game and from the animals' sounds elsewhere; each file is in the offline list
  const sw = fs.readFileSync('../sw.js', 'utf8'), names = ['cow', 'sheep', 'pig', 'dog', 'cat', 'duck', 'hen', 'horse', 'frog', 'owl'];
  const offline = names.filter(n => !sw.includes(`'sounds/animals/${n}.mp3'`));
  // The automatic welcome sticker lands after 650 ms and plays SFX.shhk(): two 0.8 s noise buffers and one oscillator.
  // Seed it as already welcomed before the first sticker poll; it is unrelated to an animal's call.
  const pre = `(${seedPlayers.toString()})();
    { const profiles = JSON.parse(localStorage.getItem('sv2_profiles') || '[]');
      profiles.forEach(p => { p.stickerBook = { ...(p.stickerBook || {}), welcomed: Date.now() }; });
      localStorage.setItem('sv2_profiles', JSON.stringify(profiles)); }
    window.__rec = []; window.__animalBuffers = []; window.__osc = 0;
    const st = AudioBufferSourceNode.prototype.start; AudioBufferSourceNode.prototype.start = function (...a) { if (this.buffer && this.buffer.duration > .5) { window.__rec.push(+this.buffer.duration.toFixed(2)); window.__animalBuffers.push(this.buffer); } return st.apply(this, a); };
    const os = OscillatorNode.prototype.start; OscillatorNode.prototype.start = function (...a) { window.__osc++; return os.apply(this, a); };`;
  const P = await open(b, { w: 390, h: 844, touch: true, pre, settings: { sound: true, music: false } }); await noWelcome(P.page); await clear(P.page);
  await P.page.mouse.click(195, 420); await P.page.waitForTimeout(300); // (sound starts after a first tap, as on a phone)
  const r = await P.page.evaluate(async () => {
    const A = await import('/js/audio.js'), wait = ms => new Promise(r => setTimeout(r, ms)), out = {};
    const loaded = await A.loadAnimalCalls(8000); if (!loaded) throw new Error('Real animal recordings did not finish loading.'); __sv.paused = true; await wait(600); // (the valley's own ducks and frogs stay quiet while it listens)
    for (const call of ['moo', 'baa', 'oink', 'woof', 'meow', 'quack', 'cluck', 'neigh', 'ribbit', 'hoot']) {
      window.__rec.length = 0; window.__animalBuffers.length = 0; window.__osc = 0; const stop = A.animalCall(call); await wait(150);
      out[call] = { rec: window.__rec.slice(), tones: window.__osc, len: A.animalRecording(call) ? +A.animalRecording(call).duration.toFixed(2) : 0,
        correctRecording: window.__animalBuffers.length === 1 && window.__animalBuffers[0] === A.animalRecording(call) }; stop();
    }
    return out;
  });
  // in the game itself: the first round's sound is a recording
  const g = await P.page.evaluate(async () => { const A = await import('/js/audio.js'), wait = ms => new Promise(r => setTimeout(r, ms)); window.__rec.length = 0; window.__animalBuffers.length = 0; window.__osc = 0; __sv.playGame(0, 'animalsounds', 'replay'); for (let i = 0; i < 40 && !window.__rec.length; i++) await wait(250); return { rec: window.__rec.slice(), tones: window.__osc, realAnimal: window.__animalBuffers.length >= 1 && ['moo', 'baa', 'oink', 'woof', 'meow', 'quack', 'cluck', 'neigh', 'ribbit', 'hoot'].some(call => window.__animalBuffers[0] === A.animalRecording(call)) }; });
  const errs = P.errors; await P.ctx.close();
  const bad = Object.entries(r).filter(([, v]) => !(v.rec.length === 1 && v.len >= .6 && v.len <= 3 && !v.tones && v.correctRecording)).map(([k, v]) => k + ' ' + JSON.stringify(v));
  ok(!offline.length && !bad.length && g.rec.length >= 1 && g.realAnimal && !errs.length, JSON.stringify({ offline, bad, game: g, errs }));
  return `10 animals play their real recordings (${Object.entries(r).map(([k, v]) => `${k} ${v.len} s`).join(', ')}), exact buffer identities, none drawn as tones; "Who Says That?" starts with a recording; all 10 files in the offline list`;
});

await check('musicaudio', async () => (await import('../music-audio.mts')).musicAudioCheck(b));

await check('voiceopus', async () => {
  // (v1.08b platform, brief part 1) every recording also as Opus (tools/make-voice-opus.mts): a new device that plays Opus
  // gets the Opus copy (about half the size) and it plays; a device that already keeps MP3 recordings stays on MP3 (nothing
  // downloaded twice); a browser that cannot play Opus gets MP3; every MP3 in voices/ has its Opus copy and the manifests say so
  const { execFileSync } = await import('node:child_process');
  const files = JSON.parse(execFileSync(process.execPath, ['../tools/make-voice-opus.mts', '--check'], { encoding: 'utf8' }).trim().split('\n').pop());
  const man = JSON.parse(fs.readFileSync('../voices/manifest-en.json', 'utf8')), h = Object.keys(man.lines).find(k => String(man.lines[k]).includes('f'));
  const mp3 = fs.statSync(`../voices/en/f/${h}.mp3`).size, opus = fs.statSync(`../voices/en/f/${h}.opus`).size;
  const fresh = () => { if (!sessionStorage.getItem('fmt-reset')) { localStorage.removeItem('sv2_voiceFmt'); sessionStorage.setItem('fmt-reset', '1'); } };
  const look = (P, line) => P.page.evaluate(async line => { const V = await import('/js/voice.js'); let f = ''; for (let i = 0; i < 100; i++) { f = V.voiceFormat(); if (localStorage.getItem('sv2_voiceFmt')) break; await new Promise(r => setTimeout(r, 100)); }
    let secs = 0; if (f === 'opus') { const r = await fetch(`/voices/en/f/${line}.opus`), buf = await new AudioContext().decodeAudioData(await r.arrayBuffer()); secs = buf.duration; }
    return { f, kept: localStorage.getItem('sv2_voiceFmt'), secs }; }, line);
  // 1. a new device on a browser that plays Opus
  let P = await open(b, { pre: fresh }); const a = await look(P, h), e1 = P.errors; await P.ctx.close();
  // 2. a device that kept MP3 recordings before the Opus copies came
  P = await open(b, { pre: fresh }); await P.page.evaluate(async () => { const c = await caches.open('sv-voices'); await c.put(new URL('/voices/en/f/old.mp3', location.href).href, new Response(new Uint8Array([0xff, 0xfb]))); localStorage.removeItem('sv2_voiceFmt'); });
  await P.page.reload(); await P.page.waitForSelector('.screen.title, .valley, canvas', { timeout: 90000 }).catch(() => { }); const k = await look(P, h), e2 = P.errors; await P.ctx.close();
  // 3. a browser that cannot play Opus
  P = await open(b, { pre: () => { if (!sessionStorage.getItem('fmt-reset')) { localStorage.removeItem('sv2_voiceFmt'); sessionStorage.setItem('fmt-reset', '1'); } const was = HTMLMediaElement.prototype.canPlayType; HTMLMediaElement.prototype.canPlayType = function (t) { return /opus/.test(t) ? '' : was.call(this, t); }; } });
  const s = await look(P, h), e3 = P.errors; await P.ctx.close();
  const got = { files, sizes: { mp3, opus }, opusDevice: a, mp3Kept: k, noOpus: s, errs: [...e1, ...e2, ...e3] };
  ok(!files.missing && !files.stray && opus < mp3 * .65 && a.f === 'opus' && a.kept === 'opus' && a.secs > .3 && k.f === 'mp3' && k.kept === 'mp3' && s.f === 'mp3' && s.kept === 'mp3' && !got.errs.length, JSON.stringify(got));
  const tot = Object.values(files.per as Record<string, { mp3: number, opus: number }>).reduce((x, v) => x + v.opus, 0);
  return `${tot} recordings with an Opus copy; one line ${mp3} -> ${opus} bytes; a new Opus device plays the Opus copy (${a.secs.toFixed(1)} s), a device keeping MP3 stays on MP3, a browser without Opus gets MP3`;
});
