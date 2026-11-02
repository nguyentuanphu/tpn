// (v1.07 family-code, docs/cores/tasks/v107/family-code.md) The family code from start to end, with made-up families
// only: device A (a phone, English) makes a code; device B (a tablet, Vietnamese) types it and shows the same family;
// B saves a copy; device C (a computer, a wiped device: nothing of B on it) loads that copy and is in the same family
// with the same progress and device number, without typing anything; leaving the family on C removes only the code and
// keeps every child's progress. Phone, tablet and computer screenshots in both languages go to out/family-code/.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import type { Browser, Page } from 'playwright';
import { open } from './harness.mjs';

const FAMILY_BUTTONS = '#gFamCodeMake, #gFamCodeJoin, #gFamCodeIn, #gFamCodeCopy, #gFamCodeLeave';

async function openFamilyBox(page: Page, lang: string) {
  await page.evaluate(async lang => {
    document.querySelectorAll('.modal').forEach(m => m.remove());
    const S = await import(String('/js/state.js')); S.settings.lang = lang;
    window.__sv.paused = true; await (await import(String('/js/ui.js'))).openGrownups();
  }, lang);
  await page.locator('.grownups').waitFor();
  await page.evaluate(() => { const d = document.querySelector<HTMLDetailsElement>('.grownups details.gsec[data-sec="data"]'); if (d) d.open = true; });
  await page.locator('#gFamCodeBox').scrollIntoViewIfNeeded();
}
// after a tap the card is drawn again: keep the section open
async function reopen(page: Page) {
  await page.evaluate(() => { const d = document.querySelector<HTMLDetailsElement>('.grownups details.gsec[data-sec="data"]'); if (d) d.open = true; });
  await page.locator('#gFamCodeBox').scrollIntoViewIfNeeded();
}
async function shown(page: Page) {
  return page.evaluate(async () => {
    const F = await import(String('/js/content/familycode.js')), S = await import(String('/js/state.js'));
    const code = document.querySelector('.grownups .fam-code-val')?.textContent || '', name = document.querySelector('.grownups .fam-name-val')?.textContent || '';
    return { code, name, stored: S.settings.familyCode || '', expectName: code ? F.familyName(code, S.settings.lang) : '', qr: document.querySelector('.grownups svg.fam-qr')?.getAttribute('data-code') || '', make: !!document.querySelector('#gFamCodeMake') };
  });
}
async function smallTargets(page: Page) {
  return page.locator(FAMILY_BUTTONS).evaluateAll(nodes => nodes.map(e => { const r = e.getBoundingClientRect(); return { id: e.id, w: Math.round(r.width), h: Math.round(r.height) }; }).filter(r => r.w > 0 && r.h < 44));
}
async function shot(page: Page, name: string) {
  await reopen(page); await page.waitForTimeout(150);
  await page.screenshot({ path: `out/family-code/${name}.png` });
}
async function progress(page: Page) {
  return page.evaluate(async () => { const S = await import(String('/js/state.js')); return JSON.stringify({ profiles: S.profiles, coins: S.farm.coins }); });
}

export async function familyCodeJourneyCheck(browser: Browser) {
  await fs.mkdir('out/family-code', { recursive: true });
  const quiet = { voice: false, sound: false, music: false, autoPack: false, online: false, countPlayers: false };
  const A = await open(browser, { w: 390, h: 844, touch: true, lang: 'en', settings: quiet });
  const B = await open(browser, { w: 820, h: 1180, touch: true, lang: 'vi', settings: quiet });
  let C: Awaited<ReturnType<typeof open>> | null = null;
  try {
    // A makes the code
    await openFamilyBox(A.page, 'en');
    assert.deepEqual(await smallTargets(A.page), [], 'phone: family buttons 44 px or more');
    await shot(A.page, 'phone-en-no-code');
    await A.page.locator('#gFamCodeMake').click(); await reopen(A.page);
    const a = await shown(A.page);
    assert.match(a.code, /^[23456789A-HJ-NP-Z]{4}-[23456789A-HJ-NP-Z]{4}$/, 'a made code');
    assert.equal(a.stored, a.code); assert.equal(a.qr, a.code); assert.equal(a.name, a.expectName);
    assert.deepEqual(await smallTargets(A.page), [], 'phone: Copy and Leave 44 px or more');
    await shot(A.page, 'phone-en-family');
    await openFamilyBox(A.page, 'vi'); await shot(A.page, 'phone-vi-family');

    // B types it (lower case, with a space, as a grown-up would) and is in the same family
    await openFamilyBox(B.page, 'vi');
    await B.page.locator('#gFamCodeIn').fill(a.code.toLowerCase().replace('-', ' '));
    await B.page.locator('#gFamCodeJoin').click(); await reopen(B.page);
    const b = await shown(B.page);
    assert.equal(b.code, a.code, 'B joined the code A made'); assert.equal(b.name, b.expectName);
    const nameEn = await A.page.evaluate(async c => (await import(String('/js/content/familycode.js'))).familyName(c, 'en'), a.code);
    assert.equal(a.name, nameEn, 'A shows the family name in English');
    assert.deepEqual(await smallTargets(B.page), [], 'tablet: family buttons 44 px or more');
    await shot(B.page, 'tablet-vi-family');
    await openFamilyBox(B.page, 'en'); await shot(B.page, 'tablet-en-family');
    assert.equal((await shown(B.page)).name, nameEn, 'B shows the same family name as A');

    // B's children have some progress; B saves a copy (the browser download, as a phone without a share sheet does)
    await B.page.evaluate(async () => { const S = await import(String('/js/state.js')); S.farm.coins = 777; S.profiles[0].orbs = 5; S.saveFarm(); S.saveProfiles(true); });
    const bProgress = await progress(B.page), bDevice = await B.page.evaluate(() => localStorage.getItem('sv2_playerid') || '');
    await B.page.evaluate(() => { Object.defineProperty(navigator, 'canShare', { configurable: true, value: undefined }); });
    const [download] = await Promise.all([B.page.waitForEvent('download'), B.page.locator('#gSaveCopy').click()]);
    const copyText = await fs.readFile(await download.path(), 'utf8');
    const copy = JSON.parse(copyText);
    assert.equal(copy.settings.familyCode, a.code, 'the copy carries the family code');
    assert.ok(!/"fh"/.test(copyText), 'the copy holds the code, not a digest');

    // C is a wiped device: no family, other progress
    C = await open(browser, { w: 1280, h: 800, lang: 'en', settings: quiet });
    await openFamilyBox(C.page, 'en');
    const c0 = await shown(C.page);
    assert.ok(c0.make && !c0.code && !c0.stored, 'a wiped device starts without a family');
    assert.notEqual(await progress(C.page), bProgress);
    C.page.removeAllListeners('dialog');
    let asked = 0; C.page.on('dialog', d => { if (d.type() === 'confirm' && /Load save copy from|Mở bản sao lưu ngày/.test(d.message())) { asked++; void d.accept(); } else { C!.errors.push('unexpected dialog: ' + d.message()); void d.dismiss(); } });
    await C.page.locator('#gLoadCopy').setInputFiles({ name: download.suggestedFilename(), mimeType: 'application/json', buffer: Buffer.from(copyText) });
    await C.page.waitForFunction(async code => (await import(String('/js/state.js'))).settings.familyCode === code, a.code);
    assert.equal(asked, 1, 'loading asks the grown-up first');
    await openFamilyBox(C.page, 'en');
    const c1 = await shown(C.page);
    assert.equal(c1.code, a.code, 'the restored device is in the family again'); assert.equal(c1.name, nameEn);
    assert.equal(await progress(C.page), bProgress, 'the same progress');
    assert.equal(await C.page.evaluate(() => localStorage.getItem('sv2_playerid') || ''), bDevice, 'the same device number');
    assert.deepEqual(await smallTargets(C.page), [], 'computer: family buttons 44 px or more');
    await shot(C.page, 'computer-en-family');
    await openFamilyBox(C.page, 'vi'); await shot(C.page, 'computer-vi-family');

    // leaving removes only the code
    await C.page.locator('#gFamCodeLeave').click(); await reopen(C.page);
    const c2 = await shown(C.page);
    assert.ok(c2.make && !c2.code && !c2.stored, 'leaving removes the code from the device');
    assert.equal(await progress(C.page), bProgress, 'leaving keeps every child\'s progress');
    await shot(C.page, 'computer-vi-no-code');
    await openFamilyBox(C.page, 'en'); await shot(C.page, 'computer-en-no-code');
    await openFamilyBox(B.page, 'vi'); await B.page.locator('#gFamCodeLeave').click(); await reopen(B.page); await shot(B.page, 'tablet-vi-no-code');
    await openFamilyBox(A.page, 'vi'); await A.page.locator('#gFamCodeLeave').click(); await reopen(A.page); await shot(A.page, 'phone-vi-no-code');

    // a wrong code is refused with a message in the child's grown-up's language, and nothing is stored
    await A.page.locator('#gFamCodeIn').fill('ab!'); await A.page.locator('#gFamCodeJoin').click();
    const bad = await A.page.evaluate(async () => ({ msg: document.querySelector('#gFamCodeMsg')?.textContent || '', stored: (await import(String('/js/state.js'))).settings.familyCode || '' }));
    assert.ok(/8 ký tự/.test(bad.msg) && !bad.stored, 'a wrong code: ' + JSON.stringify(bad));

    const errors = [...A.errors, ...B.errors, ...C.errors];
    assert.deepEqual(errors, [], 'no errors');
    return `A (phone) made a code and showed "${nameEn}"; B (tablet, Vietnamese) typed it and showed the same family; B's copy loaded on a wiped computer gave the same family, progress and device number after one question; leaving kept the progress; a wrong code is refused; 11 screenshots in out/family-code`;
  } catch (error) {
    await A.page.screenshot({ path: 'out/family-code/fail-phone.png' }).catch(() => {});
    await B.page.screenshot({ path: 'out/family-code/fail-tablet.png' }).catch(() => {});
    if (C) await C.page.screenshot({ path: 'out/family-code/fail-computer.png' }).catch(() => {});
    throw error;
  } finally {
    await A.ctx.close(); await B.ctx.close(); if (C) await C.ctx.close();
  }
}
