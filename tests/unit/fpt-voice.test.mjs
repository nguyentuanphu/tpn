import test from 'node:test';
import assert from 'node:assert/strict';
import { recordTest, FPT_TEST_REQUEST, FPT_ENDPOINT } from '../../tools/fpt-voice-test.mts';

const mp3 = new Uint8Array(512);
mp3.set([0x49, 0x44, 0x33]);

test('FPT test uses the supplied Neo API, Le Minh and one Bearer-authenticated request', async () => {
  let count = 0;
  const result = await recordTest('fixture-key', async (url, init) => {
    count++;
    assert.equal(url, FPT_ENDPOINT);
    assert.equal(init.headers.Authorization, 'Bearer fixture-key');
    assert.equal(init.redirect, 'error');
    assert.deepEqual(JSON.parse(init.body), FPT_TEST_REQUEST);
    assert.equal(JSON.parse(init.body).voice, 'leminh');
    return new Response(mp3, { headers: { 'Content-Type': 'audio/mpeg' } });
  });
  assert.equal(count, 1);
  assert.deepEqual(result, mp3);
});

test('missing key stops before any paid request', async () => {
  await assert.rejects(recordTest('', () => { throw new Error('must not request'); }), /FPT_API_KEY/);
});

test('HTTP errors do not expose provider bodies or retry requests', async () => {
  let count = 0;
  await assert.rejects(recordTest('fixture-key', async () => {
    count++;
    return new Response('fixture-key must not be logged', { status: 401 });
  }), error => /HTTP 401/.test(error.message) && !error.message.includes('fixture-key'));
  assert.equal(count, 1);
});

test('a successful JSON response cannot be mistaken for MP3 audio', async () => {
  await assert.rejects(recordTest('fixture-key', async () => new Response('{"error":"not audio"}')), /expected MP3/);
});

test('transport errors cannot reveal credentials', async () => {
  await assert.rejects(recordTest('fixture-key', async () => { throw new Error('Bearer fixture-key'); }), error => !error.message.includes('fixture-key') && /No automatic retry/.test(error.message));
});
