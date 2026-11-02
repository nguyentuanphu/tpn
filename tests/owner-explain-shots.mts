// (owner, 16 Oct: "explanations discrete, small but still understandable"; Studio switch) pictures of every kind of
// on-screen explanation, so before and after can be compared. Usage: node owner-explain-shots.mts <evidence folder>
// (SV_URL picks the game; SV_LANGS=en,vi; SV_W/SV_H the screen)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { launch, open, start, clear } from './harness.mts';
const root = fileURLToPath(new URL('../', import.meta.url)), out = path.join(root, 'docs/owner-repair-20261014/evidence', process.argv[2] || 'explain-now');
fs.mkdirSync(out, { recursive: true });
const W = +(process.env.SV_W || 390), H = +(process.env.SV_H || 844), langs = (process.env.SV_LANGS || 'en,vi').split(',');
const b = await launch(), result = {};
const boxOf = (p, sel) => p.evaluate(s => [...document.querySelectorAll(s)].filter(e => e.getClientRects().length).map(e => { const r = e.getBoundingClientRect(), cs = getComputedStyle(e); return { sel: s, w: Math.round(r.width), h: Math.round(r.height), font: cs.fontSize, text: e.textContent.trim().slice(0, 140) }; }), sel);
try {
  for (const lang of langs) {
    const P = await open(b, { w: W, h: H, touch: true, lang, play: false, settings: { captions: true } });
    await start(P.page); await clear(P.page);
    const shot = async (name, sel) => { await P.page.waitForTimeout(700); await P.page.screenshot({ path: path.join(out, `phone-${lang}-${name}.png`) }); result[`${lang}-${name}`] = sel ? await boxOf(P.page, sel) : null; };
    const reset = async () => { await P.page.keyboard.press('Escape').catch(() => { }); await clear(P.page); await P.page.evaluate(() => { document.querySelectorAll('.caption, .update-notice, .packask').forEach(e => e.remove()); }); await P.page.waitForTimeout(400); };
    // 1. the goal card, always there
    await shot('goal-card', '.hud .quest');
    // 2. hearts explanation as a caption, then as a note with captions off
    await P.page.locator('.hud .hearts').first().click(); await shot('hearts-caption', '.caption');
    await reset(); await P.page.evaluate(() => { __sv.settings && (__sv.settings.captions = false); }).catch(() => { });
    await P.page.locator('.hud .hearts').first().click(); await shot('hearts-note', '.htoast.show');
    await P.page.evaluate(() => { __sv.settings && (__sv.settings.captions = true); }).catch(() => { }); await reset();
    // 3. the daily gift note
    await P.page.evaluate(async () => { const E = await import('/js/explain.js').catch(() => null), h = __sv.huds?.[0]; if (E) E.explain(h, 'gift', ['A surprise gift is near One Pillar Pagoda today!', 'Hôm nay có quà gần Chùa Một Cột!'], ['There is a surprise gift in the valley today. Can you find it?', 'Hôm nay có một món quà bất ngờ trong thung lũng. Con tìm được không?']); else h?.toast?.(__sv.settings.lang === 'vi' ? 'Hôm nay có quà bất ngờ gần Chùa Một Cột!' : 'A surprise gift is waiting near One Pillar Pagoda today!'); }); await shot('gift-note', '.htoast.show'); await reset();
    // 4. the update notice
    await P.page.evaluate(() => window.svOfferUpdate?.()); await shot('update-notice', '.update-notice'); await reset();
    // 5. the voice pack question
    await P.page.evaluate(async () => (await import('/js/voicepack.js')).askCard(40)); await shot('voice-question', '.packask'); await reset();
    // 6. a game's guidance line
    await P.page.evaluate(() => __sv.openGamesHub(0)); await P.page.waitForSelector('.hplay', { timeout: 20000 }); await P.page.locator('.hplay').first().click();
    await P.page.waitForSelector('.gl:not(.out)', { timeout: 30000 }); await shot('game-guidance', '.gl-help');
    await P.page.locator('.gl-x').first().click().catch(() => { }); await P.page.waitForTimeout(800); await reset();
    // 7. how to play
    await P.page.evaluate(async () => (await import('/js/howto.js')).openHowTo('counting', {})); await P.page.waitForTimeout(2500); await shot('how-to-play', '.howto .ht-cap, .howto .ht-titlecard'); await reset();
    // 8. Ông Cú's lesson
    await P.page.evaluate(async () => { const p = __sv.heroes[0].profile; (await import('/js/owlguide.js')).owlLesson(p); }); await P.page.waitForTimeout(1500); await shot('owl-lesson', '.owl-lesson .sb-text, .owl-lesson .sb-title'); await reset();
    await P.ctx.close();
  }
} finally { await b.close(); fs.writeFileSync(path.join(out, 'sizes.json'), JSON.stringify(result, null, 2) + '\n'); }
console.log(JSON.stringify(result, null, 1).slice(0, 4000));
