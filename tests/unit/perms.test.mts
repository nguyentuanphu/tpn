// (owner, 14 Oct AEDT) Studio accounts get permissions one by one (netlify/lib/admins.mts PERMS); the roles are ready-made
// sets that do exactly what they did before; managing admins, Security and the Access log stay with the owner role
import test from 'node:test';
import assert from 'node:assert/strict';
import { allowed, needs, permsOf, put, PERMS, PRESETS } from '../../netlify/lib/admins.mts';

const mem = () => { const m = new Map(); return { get: async (k, o) => m.has(k) ? (o && o.type === 'json' ? JSON.parse(m.get(k)) : m.get(k)) : null, setJSON: async (k, v) => { m.set(k, JSON.stringify(v)); }, set: async (k, v) => { m.set(k, String(v)); }, delete: async k => { m.delete(k); }, list: async ({ prefix = '' } = {}) => ({ blobs: [...m.keys()].filter(k => k.startsWith(prefix)).map(key => ({ key })) }) }; };
const as = role => ({ role, perms: permsOf({ role }) });

test('a viewer still sees Analytics and tester reports only, and changes nothing', () => {
  const v = as('viewer');
  for (const a of ['info', 'whoami', 'content', 'players', 'inbox', 'testers', 'testers/problem/0123456789abcdef']) assert.ok(allowed(v, a, false), a);
  for (const a of ['file/content/custom.json', 'live', 'family/code', 'site/status']) assert.ok(!allowed(v, a, false), a);
  for (const a of ['content', 'live', 'github/publish', 'players/label', 'testers/set']) assert.ok(!allowed(v, a, true), a);
  assert.ok(allowed(v, 'admins/me', true)); // their own password
});

test('an editor does what it did before: every page and Publish, not code live, not a new family code, not the admins', () => {
  const e = as('editor');
  for (const [a, post] of [['content', true], ['live', true], ['github/publish', true], ['voices/extra', true], ['family/upload', true], ['players/label', true], ['testers/set', true], ['site/rebuild', true], ['file/content/custom.json', false]]) assert.ok(allowed(e, a, post), a);
  for (const [a, post] of [['github/merge', true], ['site/restore', true], ['family/code/new', true], ['admins/list', false], ['admins/save', true], ['keys/make', true], ['security/signout-all', true], ['log', false]]) assert.ok(!allowed(e, a, post), a);
});

test('a chosen set allows exactly what is ticked; admins, keys, security and the log never come one by one', () => {
  const c = { role: 'custom', perms: ['releases', 'pages'] };
  assert.ok(allowed(c, 'live', true)); assert.ok(allowed(c, 'live', false)); assert.ok(allowed(c, 'content', false));
  assert.ok(!allowed(c, 'content', true)); assert.ok(!allowed(c, 'players', false)); assert.ok(!allowed(c, 'github/publish', true));
  const all = { role: 'custom', perms: Object.keys(PERMS) };
  for (const [a, post] of [['admins/save', true], ['admins/list', false], ['keys/list', false], ['security/signout-all', true], ['log', false]]) assert.ok(!allowed(all, a, post), a);
  assert.ok(allowed(all, 'github/merge', true)); // "put code live" can be given on its own
  assert.equal(needs('github/merge', true), 'deploy'); assert.equal(needs('family/code/new', true), 'familycode');
  assert.ok(allowed('owner', 'admins/save', true));
});

test('saving an account keeps its chosen permissions, drops unknown ones, and a preset clears them', async () => {
  const S = mem();
  assert.deepEqual(await put(S, { name: 'ba.nam', password: 'a long password 1', role: 'custom', perms: ['analytics', 'testers', 'nonsense', 'analytics'] }, 'owner'), { ok: true });
  let a = JSON.parse(await S.get('a/ba.nam'));
  assert.deepEqual(permsOf(a), ['analytics', 'testers']);
  await put(S, { name: 'ba.nam', password: 'another password 2', role: 'custom' }, 'ba.nam'); // their own new password keeps them
  a = JSON.parse(await S.get('a/ba.nam')); assert.deepEqual(permsOf(a), ['analytics', 'testers']);
  await put(S, { name: 'ba.nam', role: 'editor' }, 'owner'); a = JSON.parse(await S.get('a/ba.nam'));
  assert.equal(a.perms, undefined); assert.deepEqual(permsOf(a), PRESETS.editor);
});
