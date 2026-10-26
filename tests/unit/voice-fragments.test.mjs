import test from 'node:test';
import assert from 'node:assert/strict';
import { mixedVoiceFragments } from '../../js/voice-fragments.js';

test('mixed voice pieces preserve food/place words, numbers and boundary pauses', () => {
  assert.deepEqual(mixedVoiceFragments('Welcome to Hà Nội, enjoy bánh khọt!'), [
    { lang: 'en', text: 'Welcome to', pauseAfter: 40 },
    { lang: 'vi', text: 'Hà Nội', pauseAfter: 180 },
    { lang: 'en', text: 'enjoy', pauseAfter: 40 },
    { lang: 'vi', text: 'bánh khọt', pauseAfter: 0 }
  ]);
  assert.deepEqual(mixedVoiceFragments('2 bánh khọt?'), [
    { lang: 'en', text: '2', pauseAfter: 40 },
    { lang: 'vi', text: 'bánh khọt', pauseAfter: 0 }
  ]);
  assert.deepEqual(mixedVoiceFragments('Thánh Gióng'), [{ lang: 'vi', text: 'Thánh Gióng', pauseAfter: 0 }]);
  assert.equal(mixedVoiceFragments('Count the fruit!'), null);
  assert.equal(mixedVoiceFragments('?!'), null);
});
