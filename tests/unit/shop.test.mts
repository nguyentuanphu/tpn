// The clothes shop (round S, owner plan 8 Oct: Round R Part 2 item 6): prices are about a day of play for a nice thing,
// the catalogue is balanced for girls and boys, worn things count as owned, and buying takes game coins only.
import test from 'node:test';
import assert from 'node:assert/strict';
import { DAY_COINS, priceOf, CLOTHES, ITEM, SLOTS, DEFAULT_OUTFITS, outfitOf, adoptWorn, owns, buy, wear, wearing, sortClothes, giveGift, GIRL_OF, versionFor } from '../../js/content/shop.js';

test('prices: a nice thing costs about one day of play', () => {
  const by = t => CLOTHES.filter(x => x.tier === t).map(priceOf);
  for (const p of CLOTHES.map(priceOf)) assert.ok(Number.isInteger(p) && p > 0 && p % 5 === 0, 'whole coins in fives: ' + p);
  for (const p of by('nice')) assert.ok(p >= DAY_COINS * .8 && p <= DAY_COINS * 1.3, 'nice ≈ a day: ' + p);
  assert.ok(Math.max(...by('small')) < Math.min(...by('nice')) && Math.max(...by('nice')) < Math.min(...by('special')), 'small < nice < special');
  assert.ok(Math.max(...by('special')) <= DAY_COINS * 2, 'nothing costs more than two days');
  assert.equal(priceOf({ tier: 'nice' }), priceOf({}), 'an unknown tier is priced as nice');
});
test('the catalogue: every kind of thing, both languages, about twice the choice for girls and for boys', () => {
  assert.deepEqual(SLOTS.map(s => s.id), ['hat', 'neck', 'top', 'bottom', 'feet', 'back']);
  assert.equal(new Set(CLOTHES.map(x => x.id)).size, CLOTHES.length, 'ids are unique');
  for (const x of CLOTHES) {
    assert.match(x.id, /^[a-z0-9_]{1,16}$/, 'ids pass the online look filter: ' + x.id);
    assert.ok(x.en && x.vi && x.en !== '' && x.vi !== '', 'English and Vietnamese: ' + x.id);
    assert.match(x.color, /^#[0-9a-f]{6}$/i); assert.ok(['g', 'b', 'both'].includes(x.for));
  }
  for (const s of SLOTS) { const g = CLOTHES.filter(x => x.slot === s.id && x.for !== 'b').length, b = CLOTHES.filter(x => x.slot === s.id && x.for !== 'g').length; assert.ok(g >= 3 && b >= 3, `${s.id}: ${g} for girls, ${b} for boys`); }
  const g = CLOTHES.filter(x => x.for !== 'b').length, b = CLOTHES.filter(x => x.for !== 'g').length;
  assert.ok(Math.abs(g - b) <= Math.max(g, b) * .2, `balanced: ${g} for girls, ${b} for boys`);
  // the old free hats and backs keep their ids, so a child already wearing one is drawn as before
  for (const id of ['cap', 'bow', 'flower', 'bunny', 'nonla', 'crown', 'wings', 'cape']) assert.ok(ITEM[id], id);
});
test('two default outfits', () => {
  assert.deepEqual(Object.keys(DEFAULT_OUTFITS), ['girl', 'boy']);
  assert.equal(outfitOf({ style: 'dress', color: '#ff5fa2' }), 'girl'); assert.equal(outfitOf({ style: 'shirt', color: '#3b6fe0' }), 'boy'); assert.equal(outfitOf({ style: 'hoodie', color: '#000000' }), null);
});
test('what a child already wears counts as owned', () => {
  const p = { look: { style: 'hoodie', hat: 'bunny', back: 'cape', neck: 'none' }, owned: { hats: ['none', 'pagri'] } };
  adoptWorn(p);
  assert.ok(owns(p, 'bunny') && owns(p, 'cape'), 'worn things are owned'); assert.ok(!owns(p, 'tiara'), 'not the rest');
  adoptWorn(p); assert.equal(p.owned.clothes.filter(x => x === 'bunny').length, 1, 'once only');
  const fresh = { look: {} }; adoptWorn(fresh); assert.deepEqual(fresh.owned.clothes, []);
  const won = { look: {}, owned: { hats: ['crown'] } }; assert.ok(owns(won, 'crown'), 'a hat won another way counts');
});
test('buying takes game coins and never more than there are', () => {
  // (r79: the tiara is girls' clothes, so this child is a girl; a boy buying it gets a gift box, tested below)
  const p = { look: { style: 'dress', color: '#ff5fa2', hat: 'none' }, owned: { hats: ['none'] } }, price = priceOf(ITEM.tiara);
  assert.deepEqual(buy(p, price - 1, 'tiara'), { ok: false, why: 'coins', price });
  assert.ok(!owns(p, 'tiara'));
  assert.deepEqual(buy(p, price, 'tiara'), { ok: true, price }); assert.ok(owns(p, 'tiara'));
  assert.equal(buy(p, 999, 'tiara').why, 'owned', 'never bought twice');
  assert.equal(buy(p, 999, 'nothing').why, 'unknown');
});
test('wearing: only what is owned, in its own slot, and the avatar reads it', () => {
  const p = { look: {}, owned: { clothes: ['jeans'] } };
  assert.ok(!wear(p, 'top', 'tee_red'), 'not owned'); assert.ok(!wear(p, 'top', 'jeans'), 'wrong slot'); assert.ok(!wear(p, 'cloak', 'none'), 'no such slot');
  assert.ok(wear(p, 'bottom', 'jeans')); assert.equal(p.look.bottom, 'jeans');
  const w = wearing(p.look); assert.equal(w.bottom.shape, 'pants'); assert.equal(w.top, null);
  assert.ok(wear(p, 'bottom', 'none')); assert.equal(wearing(p.look).bottom, null);
});

// (Round V, owner 13 Oct: "clothes can be gifted to the other sex or traded with the same sex")
test('clothes in a trade: the same set both ways; the other set only as a gift of its own clothes', async () => {
  const { clothesOk } = await import('../../js/content/shop.js');
  const g = CLOTHES.find(it => it.for === 'g'), bo = CLOTHES.find(it => it.for === 'b'), both = CLOTHES.find(it => it.for === 'both');
  assert.ok(g && bo, 'a girls\' and a boys\' piece exist');
  // same set: trade either way, coins and things too
  assert.ok(clothesOk({ clothes: [g.id] }, { items: { apple: 2 } }, 'girl', 'girl'));
  assert.ok(clothesOk({ clothes: [g.id] }, { clothes: [g.id] }, 'girl', 'girl'));
  assert.ok(!clothesOk({ items: { apple: 1 } }, { clothes: [bo.id] }, 'girl', 'girl'), 'asks only for clothes of the same set');
  // the other set: a gift, of the friend's own clothes, nothing asked back
  assert.ok(clothesOk({ clothes: [bo.id] }, {}, 'girl', 'boy'));
  if (both) assert.ok(clothesOk({ clothes: [both.id] }, {}, 'girl', 'boy'));
  assert.ok(!clothesOk({ clothes: [bo.id] }, { coins: 10 }, 'girl', 'boy'), 'no coins back for a gift');
  assert.ok(!clothesOk({ clothes: [bo.id] }, { items: { apple: 1 } }, 'girl', 'boy'), 'nothing back for a gift');
  assert.ok(!clothesOk({ clothes: [g.id] }, {}, 'girl', 'boy'), 'not a girls\' piece to a boy');
  assert.ok(!clothesOk({ clothes: ['nope'] }, {}, 'girl', 'girl'), 'unknown clothes refused');
  assert.ok(clothesOk({ items: { apple: 1 } }, { coins: 10 }, 'girl', 'boy'), 'no clothes: any trade as before');
});

// (r79, owner 16 Oct AEDT: "boy wears boys clothes, user can buy other genders clothes but for gifting only")
const GIRL = () => ({ look: { style: 'dress', color: '#ff5fa2', hat: 'none', back: 'none' }, owned: { hats: ['none'] } });
const BOY = () => ({ look: { style: 'shirt', color: '#3b6fe0', hat: 'none', back: 'none' }, owned: { hats: ['none'] } });
test('r79: nothing is shared; every thing for both sets has a girls\' version in its own colour', () => {
  assert.ok(!CLOTHES.some(x => x.for === 'both'), 'no shared clothes');
  assert.ok(Object.keys(GIRL_OF).length >= 17, 'the old shared things all have a girls\' version');
  for (const [b, g] of Object.entries(GIRL_OF)) {
    assert.equal(ITEM[b].for, 'b'); assert.equal(ITEM[g].for, 'g'); assert.equal(ITEM[g].slot, ITEM[b].slot); assert.equal(ITEM[g].shape, ITEM[b].shape);
    assert.notEqual(ITEM[g].color.toLowerCase() + (ITEM[g].trim || ''), ITEM[b].color.toLowerCase() + (ITEM[b].trim || ''), 'its own colour: ' + g);
    assert.notEqual(ITEM[g].en, ITEM[b].en, 'its own name: ' + g); assert.equal(!!ITEM[g].tester, !!ITEM[b].tester, 'tester rewards stay tester rewards');
  }
  assert.equal(versionFor('crown', 'girl'), 'crown_g'); assert.equal(versionFor('crown_g', 'boy'), 'crown'); assert.equal(versionFor('tiara', 'girl'), 'tiara');
});
test('r79: a child wears only their own set; the other set is bought as a gift box, never worn', () => {
  const b = BOY(), price = priceOf(ITEM.tiara);
  assert.deepEqual(buy(b, price, 'tiara'), { ok: true, price, gift: true }, 'a boy buys the tiara as a gift');
  assert.deepEqual(b.owned.gifts, ['tiara']); assert.ok(!b.owned.clothes.includes('tiara'));
  assert.ok(!wear(b, 'hat', 'tiara'), 'never worn by the boy');
  assert.ok(buy(b, price, 'tiara').gift, 'a second one for another friend'); assert.equal(b.owned.gifts.length, 2);
  assert.equal(buy(b, price - 1, 'tiara').why, 'coins', 'a gift still needs the coins');
  const g = GIRL(); g.owned.clothes = ['cap'];
  assert.ok(!wear(g, 'hat', 'cap'), 'a girl cannot put on a boys\' cap she somehow owns');
  assert.ok(buy(g, 999, 'crown_g').ok && wear(g, 'hat', 'crown_g'), 'her own rose-gold crown she can wear');
});
test('r79: an older save is put right once: shared things become her set\'s version, the other set becomes gift boxes', () => {
  const g = { look: { style: 'dress', color: '#ff5fa2', hat: 'bunny', top: 'tee_red', bottom: 'jeans', back: 'none' }, owned: { clothes: ['bunny', 'tee_red', 'jeans', 'bow', 'cape'] } };
  adoptWorn(g);
  assert.equal(g.look.hat, 'bunny_g', 'wears the girls\' bunny ears'); assert.equal(g.look.bottom, 'jeans_g'); assert.equal(g.look.top, 'none', 'the boys\' tee comes off');
  assert.deepEqual([...g.owned.clothes].sort(), ['bow', 'bunny_g', 'jeans_g'].sort());
  assert.deepEqual([...g.owned.gifts].sort(), ['cape', 'tee_red'].sort(), 'nothing lost: wrapped as gifts');
  const again = JSON.stringify(g); assert.equal(sortClothes(g), false, 'nothing more to do the second time'); assert.equal(JSON.stringify(g), again);
  const b = { look: { style: 'shirt', color: '#3b6fe0', hat: 'bunny', back: 'wings' }, owned: { clothes: ['bunny', 'wings'] } };
  adoptWorn(b); assert.equal(b.look.hat, 'bunny', 'a boy keeps the (boys\') bunny ears'); assert.equal(b.look.back, 'none'); assert.deepEqual(b.owned.gifts, ['wings']);
  const won = { look: { style: 'dress', color: '#ff5fa2' }, owned: { hats: ['crown'] } }; assert.ok(owns(won, 'crown_g'), 'a crown won counts as her rose-gold one');
});
test('r79: a gift box goes only to a child of the set it was made for', () => {
  const g = GIRL(), b = BOY(); g.owned.gifts = ['cape', 'cape'];
  assert.equal(giveGift(g, GIRL(), 'cape').why, 'set', 'not to another girl');
  assert.equal(giveGift(g, b, 'tiara').why, 'nogift', 'only what is wrapped');
  assert.ok(giveGift(g, b, 'cape').ok); assert.deepEqual(g.owned.gifts, ['cape']); assert.ok(owns(b, 'cape') && wear(b, 'back', 'cape'), 'he wears it');
  assert.ok(giveGift(g, b, 'cape').ok); assert.deepEqual(b.owned.gifts, ['cape'], 'a second one is kept as a gift to pass on'); assert.deepEqual(g.owned.gifts, []);
});
