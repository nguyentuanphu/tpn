// Tests for female-by-default voice selection and on-demand male voice opt-in
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

const { settings, ASIDE_VOICES_ON } = await import('../../js/state.js');
const { packMale } = await import('../../js/voicepack.js');
// (owner's decision, 3 Nov 2026 AEDT, v1.08 voices-aside: female voices only; not a weakened check) while the male voices
// are put aside (ASIDE_VOICES_ON off, voices-aside/README.md) no setting can switch the male recordings on

test('female voice default policy and opt-in settings', () => {
  // Test 1: By default, voiceMale is undefined/false
  delete settings.voiceMale;
  assert.equal(packMale(), false, 'Male voices must be disabled by default');

  // Test 2: Explicitly enabling male voices
  settings.voiceMale = true;
  if (ASIDE_VOICES_ON) assert.equal(packMale(), true, 'Male voices must be enabled when voiceMale is true');
  else assert.equal(packMale(), false, 'Male voices are put aside: voiceMale true must not download them');

  // Test 3: Disabling male voices
  settings.voiceMale = false;
  assert.equal(packMale(), false, 'Male voices must be disabled when voiceMale is false');
});

