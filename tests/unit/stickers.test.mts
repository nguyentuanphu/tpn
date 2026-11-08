// The sticker book (owner plan 16 Oct 2026 AEDT, chat B): the list (js/content/stickers.js) and the book's rules
// (js/stickers.js) without a browser. The browser check `stickers` (tests/run.mts) plays it in the game.
import test from 'node:test';
import assert from 'node:assert/strict';
import { THEMES, STICKERS, BY_ID, PAGES, PER_PAGE, pagesOf, LEGACY_EMOJI, fromEmoji, FIRST_THREE, BOOK_LINES, SHINY_CHANCE } from '../../js/content/stickers.js';
import { hasArt } from '../../js/art.js';
import { SURPRISES } from '../../js/content/surprises.js';
import { FESTCAL } from '../../js/content/festcal.js';
import fs from 'node:fs';
import * as book from '../../js/stickers.js';

// the SFX in js/audio.js a sticker may play (audio.js needs a browser, so its names are listed here and the browser
// check `stickers` checks each one is really there)
const SOUNDS = ['tap', 'ok', 'pop', 'chime', 'ding', 'secret', 'fanfare', 'coin', 'glide', 'splash', 'whoosh', 'hee', 'cook', 'moo', 'quack', 'woof', 'meow', 'baa', 'oink', 'cluck', 'neigh', 'sniff', 'bleat', 'chuff', 'calfmoo', 'purr', 'squeak', 'ribbit', 'water', 'harvest', 'trumpet', 'honk', 'squawk', 'chirp', 'hoot', 'tower', 'travel'];
const WAYS = ['prize', 'enter', 'postcard', 'find', 'cook', 'taste', 'fest', 'secret', 'surprise', 'tower', 'stamp', 'meet', 'act', 'learn'];
// the song keys of js/content/songs.js (it needs a browser: read from its text)
const SONG_KEYS = [...fs.readFileSync(new URL('../../js/content/songs.js', import.meta.url), 'utf8').matchAll(/\{ key: '([a-z0-9_]+)'/g)].map(m => m[1]);
const both = a => Array.isArray(a) && a.length === 2 && a.every(x => typeof x === 'string' && x.trim().length > 0);

test('the ten themes the owner named, each with a colour, a prize song and a house decoration', () => {
  for (const t of THEMES) assert.ok(both(t.tab) && t.tab.every(w => w.length <= 10), t.id + ' a short tab word in both languages');
  assert.deepEqual(THEMES.map(t => t.id), ['farm', 'wild', 'dishes', 'fruit', 'treasure', 'vietnam', 'world', 'festivals', 'friends', 'rare', 'learn']);
  for (const t of THEMES) {
    assert.match(t.color, /^#[0-9a-f]{6}$/i, t.id); assert.ok(hasArt(t.icon), t.id + ' tab picture');
    assert.ok(t.en && t.vi, t.id + ' both names'); assert.ok(SONG_KEYS.includes(t.song), t.id + ' song ' + t.song);
    assert.ok(t.decor.length === 3 && hasArt(t.decor[0]) && t.decor[1] && t.decor[2], t.id + ' decoration');
  }
});
test('every sticker: a unique id, a drawing, both names, a hint in both languages, a way to earn it and a sound', () => {
  assert.equal(Object.keys(BY_ID).length, STICKERS.length, 'ids are unique');
  for (const s of STICKERS) {
    assert.match(s.id, /^[a-z0-9_]+$/, s.id);
    assert.ok(THEMES.some(t => t.id === s.theme), s.id + ' theme');
    assert.ok(hasArt(s.icon), `${s.id}: ${s.icon} has a drawing in js/art.js`);
    assert.ok(s.en && s.vi, s.id + ' both names'); assert.ok(both(s.hint), s.id + ' hint in both languages');
    assert.ok(s.en.length <= 26 && s.vi.length <= 26, `${s.id}: the name fits under the picture in 2 lines (${s.en} / ${s.vi})`);
    assert.ok(Array.isArray(s.earn) && s.earn.length, s.id + ' a way to earn it');
    for (const w of s.earn) { const k = Object.keys(w); assert.equal(k.length, 1, s.id); assert.ok(WAYS.includes(k[0]), `${s.id}: way ${k[0]}`); assert.ok(typeof w[k[0]] === 'string' && w[k[0]], s.id); }
    assert.ok(SOUNDS.includes(s.sound), `${s.id}: sound ${s.sound}`);
  }
});
test('every page has exactly 9 (3 x 3) and one welcome sticker, so no page is ever empty (STK-1, STK-3)', () => {
  assert.equal(PER_PAGE, 9);
  for (const t of THEMES) {
    const ps = pagesOf(t.id); assert.ok(ps.length >= 1, t.id);
    ps.forEach((p, n) => { assert.equal(p.length, 9, `${t.id} page ${n + 1} has 9`); assert.equal(p.filter(s => s.starter).length, 1, `${t.id} page ${n + 1}: one starter`); });
  }
  assert.equal(PAGES.length, THEMES.reduce((a, t) => a + pagesOf(t.id).length, 0));
  assert.equal(STICKERS.length % 9, 0);
});
test('earning events that exist: surprises, festivals, and the older reward stickers each in one place', () => {
  const sp = new Set(SURPRISES.map(s => s.id)), fe = new Set(FESTCAL.map(f => f.id));
  for (const s of STICKERS) for (const w of s.earn) {
    if (w.surprise) assert.ok(sp.has(w.surprise), s.id + ' surprise ' + w.surprise);
    if (w.fest) assert.ok(fe.has(w.fest), s.id + ' festival ' + w.fest);
    if (w.stamp) assert.match(w.stamp, /^(vn|au|cn|in)_full$/, s.id);
    if (w.tower) assert.match(w.tower, /^tw_/, s.id);
  }
  // every festival of the calendar has its sticker, every surprise sticker too
  for (const F of FESTCAL) assert.ok(STICKERS.some(s => s.earn.some(w => w.fest === F.id)), 'festival ' + F.id);
  for (const p of SURPRISES.filter(x => x.sticker)) assert.ok(STICKERS.some(s => s.earn.some(w => w.prize === p.sticker)), 'surprise sticker ' + p.sticker);
  // nothing lost: every older emoji sticker is in exactly one sticker of the book
  for (const e of LEGACY_EMOJI) assert.equal(STICKERS.filter(s => s.earn.some(w => w.prize === e)).length, 1, 'older sticker ' + e);
  for (const s of STICKERS) for (const w of s.earn) if (w.prize) assert.ok(LEGACY_EMOJI.includes(w.prize), s.id + ' prize ' + w.prize);
  assert.equal(fromEmoji('🐱').id, 'cat'); assert.equal(fromEmoji('🤝').id, 'bestfriends'); assert.equal(fromEmoji('🍕'), null);
});
test('a new player gets 3 in the first minutes and the words are in both languages', () => {
  for (const id of FIRST_THREE) assert.ok(BY_ID[id], id);
  assert.deepEqual(FIRST_THREE.map(id => BY_ID[id].theme).sort(), ['farm', 'friends', 'vietnam']);
  for (const [k, v] of Object.entries(BOOK_LINES)) assert.ok(both(v), k);
  assert.equal(SHINY_CHANCE, 1 / 20);
});

// ---- the book itself (js/stickers.js), on plain profiles ----
const kid = (extra = {}) => ({ id: 'k1', name: 'Test', stickers: [], ...extra });
test('give, has and count: once with a New! badge, again only counts; seen() takes the badge away (STK-5)', () => {
  const p = kid();
  assert.equal(book.has('hen', p), false); assert.equal(book.count(p), 0);
  const r = book.give('hen', p); assert.equal(r.first, true); assert.equal(book.has('hen', p), true); assert.equal(book.count(p), 1);
  assert.deepEqual(book.freshIds(p), ['hen']);
  const again = book.give('hen', p, { rnd: () => .5 }); assert.equal(again.first, false); assert.equal(again.shiny, false); assert.equal(book.count(p), 1);
  book.seen('hen', p); assert.deepEqual(book.freshIds(p), []);
  assert.equal(book.give('no_such_sticker', p), null, 'an unknown id gives nothing');
});
test('a sticker earned again: 1 in 20 turns it shiny, once (S7)', () => {
  const p = kid(); book.give('cat', p);
  assert.equal(book.give('cat', p, { rnd: () => .2 }).shiny, false);
  const r = book.give('cat', p, { rnd: () => .01 }); assert.equal(r.shiny, true); assert.equal(book.isShiny('cat', p), true);
  assert.equal(book.give('cat', p, { rnd: () => .01 }).shiny, false, 'already shiny');
});
test('an old save keeps every treasure, place, postcard, older sticker and family card (S3, UX-009)', () => {
  const old = kid({ stickers: ['🐱', '🦋', '🤝', '🏮'], placeStickers: { village: 1, sydney: 2 }, visited: { hanoi: 1 }, postcards: { opera: true, turtle: true },
    found: { mango: 2, crown: 1, pebble: 5 }, dishes: { pho: 1 }, tasted: { gazza: 1 }, festivals: { tet: 'x' }, secrets: { golden: 1 }, towers: { tw_lake: 1 },
    surprises: { found: { rainbow: 1, chest: 1 } }, stamps: { vn_full: true }, familyCards: { f1: 5 } });
  const before = JSON.stringify(old);
  const n = book.sync(old);
  for (const id of ['cat', 'goldbutterfly', 'bestfriends', 'lantern', 'place_village', 'place_sydney', 'place_hanoi', 'pc_opera', 'pc_turtle', 'mango', 'crown', 'pebble', 'dish_pho', 'icecream', 'fest_tet', 'goldenapple', 'tw_lake', 'rainbow', 'chest', 'stamp_vn'])
    assert.equal(book.has(id, old), true, 'kept ' + id);
  assert.equal(n, 20);
  // nothing old was changed or taken away, and the first sync of an old save adds no New! badges
  const after = JSON.parse(JSON.stringify(old)); delete after.stickerBook; assert.equal(JSON.stringify(after), before);
  assert.deepEqual(book.freshIds(old), []);
  assert.deepEqual(old.familyCards, { f1: 5 });
  // something earned the old way later (a quest's random sticker) shows as new
  old.stickers.push('🦄'); assert.equal(book.sync(old), 1); assert.deepEqual(book.freshIds(old), ['unicorn']);
});
test('a full page and its prize, and a page that would be empty gets its welcome sticker', () => {
  const p = kid();
  const page = PAGES.find(x => x.key === 'farm.0');
  assert.equal(book.pageCount(page, p), 0);
  const g = book.welcome(page, p); assert.equal(g.id, page.stickers.find(s => s.starter).id); assert.equal(book.pageCount(page, p), 1);
  assert.equal(book.welcome(page, p), null, 'only when the page is empty');
  assert.equal(book.pageFull(page, p), false);
  page.stickers.forEach(s => book.give(s.id, p));
  assert.equal(book.pageFull(page, p), true);
  const prize = book.claimPrize(page, p); assert.ok(prize && prize.decor && prize.song, 'a decoration and a song');
  assert.ok(p.keepsakes.includes(prize.decor), 'the decoration is in the house chooser');
  assert.equal(book.claimPrize(page, p), null, 'once');
});
test('talking to someone and tapping an animal give their stickers (acted, meet)', () => {
  const p = kid();
  book.acted('npc_owl', p); assert.equal(book.has('owl', p), true);
  book.acted('nothing_here', p); book.meet('chicken', p); assert.equal(book.has('hen', p), true);
  book.meet('duck', p); assert.equal(book.has('duck', p), true);
});
