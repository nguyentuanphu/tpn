// The content pages live at once (r81, owner 17 Oct AEDT): netlify/lib/live.mts keeps a checked section for Message,
// Missions, Quiz, Our stories, Villagers, Story characters, Memory Villages, Simple screen, Defaults, Ads and the photo
// links; only their own keys, a limit on every text and on the whole answer; /api/live sends them to every device, and
// saving them needs "Change pages" (or SparkleStudio.exe's key). Everything on in-memory stores, no browser.
import test from 'node:test';
import assert from 'node:assert/strict';
import { cleanContent, saveContent, readContent, saveLive, LiveError, LIVE_SECTIONS, CONTENT_MAX } from '../../netlify/lib/live.mts';
import { makeLive } from '../../netlify/functions/live.mts';
import { makeStudio } from '../../netlify/functions/studio.mts';
import * as admins from '../../netlify/lib/admins.mts';

const mem = () => { const m = new Map(); return { get: async (k, o) => m.has(k) ? (o && o.type === 'json' ? JSON.parse(m.get(k)) : m.get(k)) : null, set: async (k, v) => { m.set(k, String(v)); }, setJSON: async (k, v) => { m.set(k, JSON.stringify(v)); }, delete: async k => { m.delete(k); }, list: async ({ prefix = '' } = {}) => ({ blobs: [...m.keys()].filter(k => k.startsWith(prefix)).map(key => ({ key })) }) }; };
const PHOTO = 'family:' + 'a'.repeat(30);

test('each section keeps only its own keys and well-formed values', () => {
  const c = cleanContent({
    message: { en: ' Hello ', vi: 'Chào\u0007 con', from: 'x' },
    missions: [{ id: 'm1', en: 'Set the table', vi: 'Dọn bàn', who: '', done: { a: 1 }, extra: 1 }, { id: 'bad id!', en: 'x' }, { id: 'm2' }],
    quiz: [{ q: ['Who?', 'Ai?'], pic: 'cat', answers: [['Ba', 'Ba'], ['Me', 'Mẹ']], right: 1, evil: '<script>' }, { q: ['One answer'], answers: [['a', 'a']], right: 0 }, { q: ['x', 'x'], answers: [['a', 'a'], ['b', 'b']], right: 5 }],
    tales: [{ id: 't1', flag: '💛', en: 'Our trip', vi: 'Chuyến đi', pages: [['🚗', 'We went', 'Mình đi'], 'not a page'], secret: 1 }, { id: 't2', pages: [] }],
    names: { 'Bà Tư': { en: 'Grandma', vi: 'Bà nội', x: 1 }, __proto__: { en: 'x' }, '<b>': { en: 'x' }, empty: {} },
    genders: { 'Bà Tư': 'f', Grandma: 'f', Bob: 'x' },
    faces: { 'Bà Tư': { photo: PHOTO, skin: '#e8b48c', big: 'x' }, Bad: { photo: 'data:image/jpeg;base64,AAAA' }, Web: { photo: 'https://x.test/a.jpg' } },
    looks: { chi: { style: 'dress', color: '#ff0000', hair: 'red', extra: 1 }, nam: { style: 'dress' } },
    plots: { p1: { type: 'house', name: ['Home', 'Nhà'], owner: { name: 'Bà', line: ['Hi', 'Chào'], age: 90 }, color: '#00ff00', at: [1, 2] } },
    activities: { cats: { area: 'animals', little: true, hide: true, top: 1 }, dogs: { area: 'BAD AREA' } },
    itemAvailability: {'game:cats':false,'story:cats':true,'cats':false,'game:bad!':true,'game:odd':'no'},
    defaults: { restMins: 30, lang: 'vi', calm: true, bad: { a: 1 }, long: 'x'.repeat(40) },
    features: { traffic: false, powerPoles: true, odd: 'yes' },
    ads: { enabled: true, perDay: 99, items: [{ image: 'content/ads/a.png', by: 'Shop', en: 'Books', vi: 'Sách', link: 'https://shop.test/', where: ['boards', 'popup'], track: 1 }, { image: '../secret.png', en: 'x' }] },
    album: [{ id: 'f1', photo: PHOTO, en: 'Beach', vi: 'Biển', place: 'vungtau', gps: 'x' }, { id: 'f2', photo: 'data:image/jpeg;base64,AAAA' }],
    music: [{ file: 'content/music/a.mp3' }], world: { npcs: [] }, releases: { traffic: { on: false } }
  });
  assert.deepEqual(Object.keys(c).sort(), LIVE_SECTIONS.slice().sort());
  assert.deepEqual(c.itemAvailability,{'game:cats':false,'story:cats':true});
  assert.deepEqual(c.message, { en: 'Hello', vi: 'Chào con' });
  assert.deepEqual(c.missions, [{ id: 'm1', en: 'Set the table', vi: 'Dọn bàn' }]);
  assert.deepEqual(c.quiz, [{ q: ['Who?', 'Ai?'], answers: [['Ba', 'Ba'], ['Me', 'Mẹ']], right: 1, pic: 'cat' }]);
  assert.deepEqual(c.tales, [{ id: 't1', flag: '💛', en: 'Our trip', vi: 'Chuyến đi', pages: [['🚗', 'We went', 'Mình đi']] }]);
  assert.deepEqual(c.names, { 'Bà Tư': { en: 'Grandma', vi: 'Bà nội' } });
  assert.equal(Object.getPrototypeOf(c.names), Object.prototype);
  assert.deepEqual(c.genders, { 'Bà Tư': 'f', Grandma: 'f' });
  assert.deepEqual(c.faces, { 'Bà Tư': { photo: PHOTO, skin: '#e8b48c' } }); // photo links only, never a picture or another website
  assert.deepEqual(c.looks, { chi: { style: 'dress', color: '#ff0000' } });
  assert.deepEqual(c.plots, { p1: { type: 'house', name: ['Home', 'Nhà'], color: '#00ff00', owner: { name: 'Bà', line: ['Hi', 'Chào'] } } });
  assert.deepEqual(c.activities, { cats: { area: 'animals', little: true, hide: true } });
  assert.deepEqual(c.defaults, { restMins: 30, lang: 'vi', calm: true });
  assert.deepEqual(c.features, { traffic: false, powerPoles: true });
  assert.deepEqual(c.ads, { enabled: true, perDay: 10, items: [{ image: 'content/ads/a.png', by: 'Shop', en: 'Books', vi: 'Sách', link: 'https://shop.test/', where: ['boards'] }, { en: 'x' }] });
  assert.deepEqual(c.album, [{ id: 'f1', photo: PHOTO, en: 'Beach', vi: 'Biển', place: 'vungtau' }]);
  // a section sent as null is taken off (custom.json's is used again); a section not sent is left out
  assert.deepEqual(cleanContent({ message: null }), { message: null });
  assert.deepEqual(cleanContent({}), {});
});

test('too long and too much are refused, not cut', async () => {
  assert.throws(() => cleanContent({ message: { en: 'x'.repeat(601) } }), e => e instanceof LiveError && e.why === 'long' && e.where === 'message' && e.n === 600);
  assert.doesNotThrow(() => cleanContent({ message: { en: 'ồ'.repeat(600) } })); // letters, not bytes
  assert.throws(() => cleanContent({ quiz: [{ q: ['x'.repeat(301), ''], answers: [['a', 'a'], ['b', 'b']], right: 0 }] }), e => e.why === 'long' && e.where === 'quiz');
  assert.throws(() => cleanContent({ names: { Bob: { en: 'x'.repeat(61) } } }), e => e.where === 'names');
  // at most 12 missions, 60 questions, 30 stories of 40 pages: and never more than 200 KB in all
  assert.equal(cleanContent({ missions: Array.from({ length: 20 }, (_, i) => ({ id: 'm' + i, en: 'x' })) }).missions.length, 12);
  const page = ['🌳', 'x'.repeat(600), 'y'.repeat(600)], tales = Array.from({ length: 30 }, (_, i) => ({ id: 't' + i, en: 'T', pages: Array(40).fill(page) }));
  assert.equal(cleanContent({ tales }).tales.length, 30);
  const S = mem();
  await assert.rejects(saveContent(S, { content: { tales } }, 'owner'), e => e instanceof LiveError && e.why === 'big' && e.n > CONTENT_MAX / 1024);
  assert.deepEqual((await readContent(S)).content, {}); // nothing kept
});

test('saving keeps the other sections and never touches Releases; /api/live sends them without the admin', async () => {
  const S = mem();
  await saveLive(S, { releases: { traffic: { on: false } }, festivals: {} }, 'owner');
  await saveContent(S, { content: { message: { en: 'Hi', vi: 'Chào' }, quiz: [] } }, 'ba.nam');
  await saveContent(S, { content: { missions: [{ id: 'm1', en: 'Help', vi: 'Giúp' }] } }, 'owner');
  let c = (await readContent(S)).content; assert.deepEqual(Object.keys(c).sort(), ['message', 'missions', 'quiz']);
  await saveContent(S, { content: { quiz: null } }, 'owner'); c = (await readContent(S)).content; assert.equal(c.quiz, undefined);
  // a Releases save afterwards leaves the content as it was
  await saveLive(S, { releases: { traffic: { on: true } }, festivals: {} }, 'owner'); assert.deepEqual((await readContent(S)).content.message, { en: 'Hi', vi: 'Chào' });
  const r = await makeLive({ liveStore: async () => S })(new Request('https://x/api/live')), j = await r.json();
  assert.equal(r.headers.get('cache-control'), 'public, max-age=30');
  assert.deepEqual(j.releases, { traffic: { on: true } }); assert.deepEqual(j.content.message, { en: 'Hi', vi: 'Chào' }); assert.ok(j.contentAt);
  assert.ok(!JSON.stringify(j).includes('ba.nam') && !('by' in j));
  // nothing saved live: the answer has no content, so every device keeps using custom.json
  const e = await (await makeLive({ liveStore: async () => mem() })(new Request('https://x/api/live'))).json(); assert.equal(e.content, undefined);
});

test('who may save them: "Change pages", and the exe key; a viewer may not', () => {
  assert.equal(admins.needs('live/content', true), 'edit'); assert.equal(admins.needs('live/content', false), 'pages');
  assert.ok(admins.allowed({ role: 'editor', perms: admins.PRESETS.editor }, 'live/content', true));
  assert.ok(!admins.allowed({ role: 'viewer', perms: admins.PRESETS.viewer }, 'live/content', true));
  assert.ok(!admins.allowed({ role: 'custom', perms: ['pages', 'releases'] }, 'live/content', true)); // switching features is not changing pages
  assert.ok(admins.allowed({ role: 'custom', perms: ['pages', 'edit'] }, 'live/content', true));
  assert.ok(admins.allowed({ role: 'exe' }, 'live/content', true) && admins.allowed({ role: 'exe' }, 'live/content', false));
  assert.ok(!admins.allowed({ role: 'exe' }, 'live', true)); // the exe still may not switch Releases
});

test('online Studio: the owner saves a section live, a long text is refused with a message', async () => {
  process.env.STUDIO_PASSWORD = 'a-long-studio-password'; process.env.GITHUB_TOKEN = '';
  const live = mem(), studio = makeStudio({ adminStore: async () => mem(), liveStore: async () => live, guardStore: async () => mem(), logStore: async () => mem(), familyStore: async () => mem(), heldStore: async () => mem(), playersStore: async () => mem() });
  const login = await studio(new Request('https://x/studio/api/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password: process.env.STUDIO_PASSWORD }) }), {});
  const cookie = (login.headers.get('set-cookie') || '').split(';')[0]; assert.ok(/^sv_studio=/.test(cookie));
  const send = body => studio(new Request('https://x/studio/api/live/content', { method: 'POST', headers: { cookie, 'X-Studio': '1', 'Content-Type': 'application/json' }, body: JSON.stringify(body) }), {});
  let r = await send({ content: { message: { en: 'Dinner at six', vi: 'Sáu giờ ăn tối' } } }); assert.equal(r.status, 200);
  assert.deepEqual((await readContent(live)).content.message, { en: 'Dinner at six', vi: 'Sáu giờ ăn tối' });
  r = await send({ content: { message: { en: 'x'.repeat(700) } } }); assert.equal(r.status, 400);
  assert.match((await r.json()).error, /^Some words are too long to go live \(Message: 600 letters at most\)/);
  r = await studio(new Request('https://x/studio/api/live/content', { headers: { cookie } }), {}); assert.deepEqual((await r.json()).content.message.vi, 'Sáu giờ ăn tối');
});
