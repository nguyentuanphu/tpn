import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const source = fs.readFileSync(new URL('../../js/ui-settings.ts', import.meta.url), 'utf8');

test('voice pack preview wakes Web Audio before playing', () => {
  const start = source.indexOf("card.querySelectorAll('[data-pv]')");
  const end = source.indexOf("const c = card.querySelector('#gMissClear')", start);
  assert.ok(start >= 0 && end > start, 'settings must keep a dedicated voice preview handler');
  const handler = source.slice(start, end);
  assert.ok(handler.includes('const audio = ac()'));
  assert.ok(handler.includes('await audio.resume()'));
  assert.ok(handler.includes('await previewPackVoice(b.dataset.pv)'));
  assert.ok(handler.indexOf('await audio.resume()') < handler.indexOf('await previewPackVoice'), 'audio must resume before preview playback');
});
