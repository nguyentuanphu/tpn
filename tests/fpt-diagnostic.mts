import test from 'node:test';
import assert from 'node:assert/strict';
import { safeFptError } from '../tools/fpt-auth-diagnostic.mts';
test('provider diagnostics retain useful reasons without credentials or storage signatures', () => {
  const key = 'test-secret-123';
  const result = safeFptError(401, { error: { code: 'insufficient_balance', message: `Balance exhausted; ${key}; https://storage.example/audio?signature=private` } }, key);
  assert.equal(result.code, 'insufficient_balance');assert.match(result.reason, /Balance exhausted/);
  assert.ok(!JSON.stringify(result).includes(key));assert.ok(!JSON.stringify(result).includes('signature=private'));
  assert.equal(safeFptError(401, '<html>private provider body</html>', key).reason, 'No safe structured error message was returned.');
});
