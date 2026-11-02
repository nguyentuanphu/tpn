// (r79, owner 16 Oct AEDT) pictures of the screens the owner reported, on a phone, a tablet and a computer (EN), with a
// Bag that holds the items from the owner's picture (long names, treasures, food from stalls).
// Usage (from tools/): node r79-shots.mts <folder name> [screens, e.g. bag,album,wardrobe,hud,camera] [devices]
// Pictures go to docs/owner-repair-20261014/evidence/<folder name>/<device>-<screen>.png
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { launch, open, clear } from '../tests/harness.mts';
const root = fileURLToPath(new URL('../', import.meta.url));
const out = path.join(root, 'docs/owner-repair-20261014/evidence', process.argv[2] || 'r79-shots');
const want = (process.argv[3] || 'bag,album,wardrobe,hud,camera').split(',');
const SIZES = { phone: [390, 844, true], bigphone: [430, 932, true], tablet: [820, 1180, true], computer: [1280, 800, false] };
const devices = (process.argv[4] || 'phone,tablet,computer').split(',');
fs.mkdirSync(out, { recursive: true });

// the owner's Bag: food from stalls with long names, treasures, a dish, clothes and words learned
const SEED = async page => page.evaluate(async () => {
  const p = window.__sv.heroes[0].profile;
  p.bought = { h_tauhu: 1, h_traicay: 1 };
  // a companion that was fed today and can do a trick (the Trick chip beside the player card)
  p.lanterns = { ...(p.lanterns || {}), companion: 'dragon', pet: { feeds: 6, hats: [], fed: Math.floor((Date.now() + 10 * 3600e3) / 864e5) } };
  p.inv = { ...(p.inv || {}), ruby: 1, crystal: 1, fossil: 1, bone: 2, pebble: 4 };
  p.words = { ...(p.words || {}), 'vn:bowl': true, 'vn:pineapple': true, 'vn:corn': true, "au:G'day": true, 'au:Mate': true, 'vs:Hết sảy': true };
  // clothes: some of her own set, one shared thing from an older save (jeans), one of the boys' set (cap) and a gift box
  p.owned = { ...(p.owned || {}), clothes: ['bow', 'dress_yellow', 'jeans', 'sunhat', 'cap', 'pearls'], gifts: ['cape'] };
  const C = await import('/js/content/shop.js'); C.adoptWorn(p);
  const S = await import('/js/state.js'); S.saveProfiles && S.saveProfiles();
});
const SCREENS = {
  bag: async page => { await page.evaluate(() => window.__sv.openPad(0, 'bag')); await page.waitForTimeout(1200); },
  album: async page => { await page.evaluate(() => window.__sv.openPad(0, 'album')); await page.waitForTimeout(1200); await page.evaluate(() => document.querySelector('.wordlist')?.scrollIntoView({ block: 'center' })); await page.waitForTimeout(500); },
  wardrobe: async page => { await page.evaluate(() => window.__sv.openPad(0, 'shop')); await page.waitForTimeout(1000); await page.evaluate(() => { const b = document.querySelector<HTMLElement>('[data-go="wardrobe"]'); b && b.click(); }); await page.waitForTimeout(1000); },
  shop: async page => { await page.evaluate(() => window.__sv.openPad(0, 'shop')); await page.waitForTimeout(1200); },
  gifts: async page => { await page.evaluate(() => window.__sv.openPad(0, 'bag')); await page.waitForTimeout(1200); await page.evaluate(() => { const g = document.querySelector<HTMLElement>('[data-gift]'); g && g.scrollIntoView({ block: 'center' }); g && g.click(); }); await page.waitForTimeout(600); },
  eat: async page => { await page.evaluate(() => window.__sv.openPad(0, 'bag')); await page.waitForTimeout(1200); await page.evaluate(() => document.querySelector<HTMLElement>('[data-snack]')?.click()); await page.waitForTimeout(600); },
  hud: async page => { await page.evaluate(() => { const b = document.querySelector<HTMLElement>('.dk.snd'); b && b.click(); }); await page.waitForTimeout(800); },
  camera: async page => { await page.evaluate(() => { const b = document.querySelector<HTMLElement>('.z-tray'); b && b.click(); }); await page.waitForTimeout(800); },
};
const b = await launch();
for (const dev of devices) {
  const [w, h, touch] = SIZES[dev];
  for (const scr of want) {
    const P = await open(b, { w, h, touch, settings: process.env.SV_TS ? { textSize: +process.env.SV_TS } : {} });
    await clear(P.page); await SEED(P.page);
    await SCREENS[scr](P.page);
    await P.page.screenshot({ path: path.join(out, `${dev}${process.env.SV_TS ? '-text' + process.env.SV_TS : ''}-${scr}.png`) });
    if (P.errors.length) console.log(dev, scr, 'errors:', P.errors.slice(0, 3).join(' | '));
    await P.ctx.close();
    console.log('took', dev, scr);
  }
}
await b.close();
