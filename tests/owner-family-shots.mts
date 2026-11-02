// (owner, 16 Oct AEDT: "show me and I will decide") pictures of the new family devices and photo sharing (points
// 39-45), step by step, on two pretend devices (a phone and a tablet) using the real private-family action handler
// in place of the Netlify service, as owner-family-smoke.mts does. Usage: node owner-family-shots.mts <folder> [vi]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { familyAction } from '../netlify/lib/family-devices.mts';
import { launch, open, clear } from './harness.mts';
const root = fileURLToPath(new URL('../', import.meta.url)), out = path.join(root, 'docs/owner-repair-20261014/evidence', process.argv[2] || 'family-now'), lang = process.argv[3] || 'en';
fs.mkdirSync(out, { recursive: true });
const records = new Map();
const store = { get: async key => structuredClone(records.get(key) ?? null), setJSON: async (key, value) => records.set(key, structuredClone(value)), delete: async key => records.delete(key), list: async ({ prefix }) => ({ blobs: [...records.keys()].filter(k => k.startsWith(prefix || '')).map(key => ({ key })) }) };
// (the trial is off unless Studio switches it on; these pretend devices have it on, as Studio would)
const trialOn = ctx => ctx.route('**/content/custom.json*', async r => { let j = {}; try { j = await (await r.fetch()).json(); } catch (e) { } j.features = { ...(j.features || {}), familyDevices: true }; await r.fulfill({ contentType: 'application/json', body: JSON.stringify(j) }); });
const route = async ctx => { await trialOn(ctx); return familyRoute(ctx); };
const familyRoute = async ctx => ctx.route('**/api/family-devices/*', async r => {
  try { const req = r.request(), token = (req.headers().authorization || '').replace(/^Bearer /, ''); const value = await familyAction(store, new URL(req.url()).pathname.split('/').pop(), req.postDataJSON(), token); await r.fulfill({ json: value }); }
  catch (e) { await r.fulfill({ status: e.status || 500, json: { error: e.message } }); }
});
const browser = await launch(), steps = [];
async function panel(page) { await clear(page); await page.evaluate(async () => { const U = await import('/js/ui.js'); U.openGrownups(); }); await page.locator('[data-sec="familydevices"] > summary').click(); await page.waitForTimeout(500); }
const shot = async (page, name, what) => { await page.locator('[data-sec="familydevices"]').scrollIntoViewIfNeeded().catch(() => { }); await page.waitForTimeout(400); const file = `${steps.length + 1}-${name}-${lang}.png`; await page.screenshot({ path: path.join(out, file) }); steps.push({ file, what }); };
try {
  const a = await open(browser, { w: 390, h: 844, touch: true, lang, route });
  await panel(a.page); await shot(a.page, 'phone-start', 'Phone, Grown-ups: the new family section before anything is set up');
  const recovery = a.page.waitForEvent('download'); await a.page.click('.fd-create'); await (await recovery).saveAs(path.join(out, 'recovery-example.json')); await a.page.waitForSelector('.fd-pair');
  await shot(a.page, 'phone-family-made', 'Phone: family created; a recovery file was saved to the device');
  await a.page.click('.fd-pair'); await a.page.waitForFunction(() => document.querySelector('.fd-paircode')?.textContent.includes('-'));
  await shot(a.page, 'phone-pairing-code', 'Phone: a one-use pairing code to type on the other device');
  const code = (await a.page.locator('.fd-paircode').innerText()).match(/[A-F0-9]{4}(?:-[A-F0-9]{4}){3}/)[0];
  const b = await open(browser, { w: 820, h: 1180, touch: true, lang, route });
  await panel(b.page); await b.page.fill('.fd-label', 'Tablet'); await b.page.fill('.fd-code', code);
  await shot(b.page, 'tablet-enter-code', 'Tablet, Grown-ups: name the device and type the code');
  await b.page.click('.fd-join'); await b.page.waitForTimeout(1500);
  await shot(b.page, 'tablet-waiting', 'Tablet: waiting for the first device to approve it');
  await panel(a.page); await a.page.waitForSelector('[data-action="approve"]');
  await shot(a.page, 'phone-approve', 'Phone: the request to approve or refuse');
  await a.page.click('[data-action="approve"]'); // (the panel's own 15 s status check may connect it first, taking the button away: that is fine for a parent too)
 await b.page.locator('.fd-refresh').click({ timeout: 5000 }).catch(() => { }); await b.page.waitForSelector('.fd-photo', { timeout: 30000 });
  await shot(b.page, 'tablet-connected', 'Tablet: connected to the family');
  const image = await a.page.evaluate(() => { const c = document.createElement('canvas'); c.width = c.height = 96; const g = c.getContext('2d'); g.fillStyle = '#ffcf6b'; g.fillRect(0, 0, 96, 96); g.fillStyle = '#3b2a4f'; g.beginPath(); g.arc(48, 40, 18, 0, 7); g.fill(); g.fillRect(24, 62, 48, 30); return c.toDataURL('image/png').split(',')[1]; });
  await a.page.locator('.fd-photo').setInputFiles({ name: 'grandma.png', mimeType: 'image/png', buffer: Buffer.from(image, 'base64') });
  await a.page.waitForFunction(() => document.querySelector('.fd-status')?.textContent.includes('Photo saved') || document.querySelector('.fd-status')?.textContent.includes('Đã lưu'), null, { timeout: 30000 }).catch(() => { });
  await shot(a.page, 'phone-photo-saved', 'Phone: a family photo chosen for a villager and saved');
  await b.page.evaluate(async () => { await (await import('/js/familydevices.js')).refreshDevicePhotos({ force: true }); }); await panel(b.page);
  await shot(b.page, 'tablet-photo-arrived', 'Tablet: the photo arrived; it shows on that villager in the game');
  await panel(a.page); await shot(a.page, 'phone-devices-list', 'Phone: the list of connected devices, each can be removed');
} finally {
  await browser.close();
  fs.writeFileSync(path.join(out, `steps-${lang}.json`), JSON.stringify(steps, null, 2) + '\n');
}
console.log(JSON.stringify(steps));
