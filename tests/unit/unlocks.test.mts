import test from 'node:test';
import assert from 'node:assert/strict';

// Set up minimal browser globals for importing modules in node:test
globalThis.document = {
  documentElement: { lang: 'en' },
  addEventListener: () => {},
  querySelector: () => null,
  querySelectorAll: () => []
};
globalThis.window = globalThis;
globalThis.location = { href: 'http://localhost/' };
globalThis.localStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {}
};

const { isOpen, progressOf, FIRST_SET_GAMES, FIRST_SET_TALES, SECOND_SET_GAMES } = await import('../../js/content/unlocks.js');
const { normalizeProfile } = await import('../../js/state.js');
// (r90, owner 24 Oct AEDT) the second set is held in Studio (New games / New stories) until the owner releases it: these
// tests check the unlocking as after that release, and the last one checks the hold itself
const { CUSTOM } = await import('../../js/custom.js');
const { SECOND_SET_TALES } = await import('../../js/content/unlocks.js');
const release = on => { CUSTOM.releases = { ...(CUSTOM.releases || {}), newGames: { on }, newStories: { on } }; };
release(true);

test('first-set games and tales are always open by default', () => {
  const profile = normalizeProfile({ id: 'p1', name: 'Bé' });
  for (const [area, games] of Object.entries(FIRST_SET_GAMES)) {
    if (games.length > 0) {
      assert.equal(isOpen(profile, games[0], 'game', area), true, `first game in ${area} should be open`);
    }
  }
  for (const [shelf, tales] of Object.entries(FIRST_SET_TALES)) {
    if (tales.length > 0) {
      assert.equal(isOpen(profile, tales[0], 'tale', shelf), true, `first tale in ${shelf} should be open`);
    }
  }
});

test('second-set game is locked until each first-set game is finished 3 times', () => {
  const profile = normalizeProfile({ id: 'p1', name: 'Bé' });
  const area = 'animals';
  const games = FIRST_SET_GAMES[area];
  assert.ok(games.length > 0);
  const secondSetGameId = SECOND_SET_GAMES[area][0];

  assert.equal(isOpen(profile, secondSetGameId, 'game', area), false);
  const p1 = progressOf(profile, 'game', area);
  assert.equal(p1.done < 3, true);

  // Win each game 2 times -> still locked
  profile.wins = {};
  for (const g of games) profile.wins[g] = 2;
  assert.equal(isOpen(profile, secondSetGameId, 'game', area), false);

  // Win each game 3 times -> unlocked!
  for (const g of games) profile.wins[g] = 3;
  assert.equal(isOpen(profile, secondSetGameId, 'game', area), true);
  const p2 = progressOf(profile, 'game', area);
  assert.equal(p2.done >= 3, true);
});

test('migration of old profile: tales boolean becomes taleReads count of 1', () => {
  const oldProfile = {
    id: 'p_old',
    name: 'Tí',
    tales: { banhchung: true, sontinh: true }
  };
  const normalized = normalizeProfile(oldProfile);
  assert.equal(normalized.taleReads.banhchung, 1);
  assert.equal(normalized.taleReads.sontinh, 1);
});

test('unlockAll flag opens all games and stories regardless of wins', () => {
  const profile = normalizeProfile({ id: 'p1', name: 'Bé', unlockAll: true });
  assert.equal(isOpen(profile, 'any_future_game', 'game', 'animals'), true);
  assert.equal(isOpen(profile, 'any_future_tale', 'tale', '🇻🇳'), true);
});
test('held in Studio (New games / New stories off): a second-set game or story never opens, not even with unlock all', () => {
  release(false);
  const profile = normalizeProfile({ id: 'p1', name: 'Bé' }); profile.unlockAll = true;
  const [area, games] = Object.entries(SECOND_SET_GAMES)[0], [shelf, tales] = Object.entries(SECOND_SET_TALES)[0];
  assert.equal(isOpen(profile, games[0], 'game', area), false, 'a held game stays shut');
  assert.equal(isOpen(profile, tales[0], 'tale', shelf), false, 'a held story stays shut');
  release(true);
  assert.equal(isOpen(profile, games[0], 'game', area), true, 'released with unlock all: open');
});
