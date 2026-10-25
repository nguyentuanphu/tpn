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

test('Neo signed FPT storage responses download without forwarding the API key', async () => {
  const calls = [];
  const url = 'https://s3-han02.fptcloud.com/sample.mp3?signature=fixture';
  const result = await recordTest('fixture-key', async (target, init) => {
    calls.push({ target, init });
    return calls.length === 1 ? Response.json({ audio_url: url }) : new Response(mp3);
  });
  assert.deepEqual(result, mp3);
  assert.equal(calls.length, 2);
  assert.equal(calls[1].target, url);
  assert.equal(calls[1].init.headers, undefined);
  assert.equal(calls[1].init.redirect, 'error');
});

test('unrelated download hosts and embedded credentials are not followed', async () => {
  for (const url of ['https://unrelated.invalid/audio.mp3', 'https://name:password@s3-han02.fptcloud.com/audio.mp3']) {
    let calls = 0;
    await assert.rejects(recordTest('fixture-key', async () => { calls++; return Response.json({ url }); }), /expected MP3/);
    assert.equal(calls, 1);
  }
});

test('failed FPT storage responses stop without retrying or printing signed URLs', async () => {
  const url = 'https://s3-han02.fptcloud.com/sample.mp3?signature=private';
  let calls = 0;
  await assert.rejects(recordTest('fixture-key', async () => ++calls === 1 ? Response.json({ url }) : new Response('', { status: 403 })), error => /storage returned HTTP 403/.test(error.message) && !error.message.includes('private'));
  assert.equal(calls, 2);
});
