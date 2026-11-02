import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { fakeGitHub, routeGitHub, fakeNetlify, memoryBlobs, testClock } from '../studio-check.mts';
import * as admins from '../../netlify/lib/admins.mts';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
test('Studio enforces session, CSRF and Website permission on bot settings and dispatch', async () => {
  const port = 8796, site = `http://localhost:${port}`, repo = 'family/authorization', password = 'auth-fixture-password-123';
  const gh = fakeGitHub(repo, { 'content/custom.json': '{}', 'js/build.js': fs.readFileSync(path.join(root, 'js/build.js')) });
  const unroute = routeGitHub(gh), liveStore = memoryBlobs(), adminStore = memoryBlobs();
  const server = await fakeNetlify({ port, players: memoryBlobs(), liveStore, adminStore, env: { STUDIO_PASSWORD: password, GITHUB_TOKEN: 'fixture-token', GITHUB_REPO: repo, URL: site } });
  const request = async (url: string, body?: unknown, cookie?: string, csrf = true) => {
    const response = await fetch(site + url, { method: body === undefined ? 'GET' : 'POST', headers: { 'Content-Type': 'application/json', ...(cookie ? { cookie } : {}), ...(csrf ? { 'X-Studio': '1' } : {}) }, body: body === undefined ? undefined : JSON.stringify(body) });
    return { status: response.status, body: await response.json(), cookie: (response.headers.get('set-cookie') || '').split(';')[0] };
  };
  const settings = { enabled: true, schedule: 'custom', time: '02:03', count: 2, duration: 5, profile: 'gentle-explorer' };
  try {
    assert.equal((await request('/studio/api/bot/run', settings)).status, 401);
    assert.equal((await request('/studio/api/live', { releases: { nightlyBots: settings } })).status, 401);
    const signed = await request('/studio/api/login', { password });
    assert.equal(signed.status, 200);
    const cookie = signed.cookie;
    assert.equal((await request('/studio/api/admins/save', { name: 'viewer.bot', password: 'viewer-bot-password-123', role: 'viewer' }, cookie)).status, 200);
    testClock.t += 31000;
    const viewerFirst = await request('/studio/api/login', { name: 'viewer.bot', password: 'viewer-bot-password-123' });
    const viewer = await request('/studio/api/login', { name: 'viewer.bot', password: 'viewer-bot-password-123', code: admins.totpNow(viewerFirst.body.secret, testClock.t) });
    assert.equal(viewer.status, 200);
    assert.equal((await request('/studio/api/bot/run', settings, viewer.cookie)).status, 403);
    assert.equal((await request('/studio/api/live', { releases: { nightlyBots: settings } }, viewer.cookie)).status, 403);
    assert.equal((await request('/studio/api/bot/run', settings, cookie, false)).status, 403);
    assert.equal((await request('/studio/api/live', { releases: { nightlyBots: settings } }, cookie, false)).status, 403);
    assert.equal((await request('/studio/api/live', { releases: { nightlyBots: { ...settings, duration: 99 } } }, cookie)).status, 400);
    assert.equal((await request('/studio/api/live', { releases: { nightlyBots: settings } }, cookie)).status, 200);
    assert.deepEqual(await liveStore.get('bot-schedule', { type: 'json' }), settings);
    assert.equal((await request('/api/live')).body.releases.nightlyBots, undefined);
    assert.deepEqual((await request('/studio/api/live', undefined, cookie)).body.releases.nightlyBots, settings);
    assert.equal((await request('/studio/api/bot/run', { ...settings, count: 99 }, cookie)).status, 400);
  } finally { server.close(); unroute(); }
});
