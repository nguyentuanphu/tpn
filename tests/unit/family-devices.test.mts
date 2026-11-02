import test from 'node:test';
import assert from 'node:assert/strict';
import { familyAction } from '../../netlify/lib/family-devices.mts';
const memory = () => { const map = new Map(); return { get: async key => map.has(key) ? structuredClone(map.get(key)) : null, setJSON: async (key, value) => map.set(key, structuredClone(value)), delete: async key => map.delete(key), list: async ({ prefix }) => ({ blobs: [...map.keys()].filter(key => key.startsWith(prefix)).map(key => ({ key })) }) }; };
test('removed devices do not exhaust pairing and recovery capacity', async () => {
  const S = memory(), first = await familyAction(S, 'create', {}, '', 1);
  // Keep revocation records, but make room when a family replaces old devices.
  for (let i = 0; i < 29; i++) {
    const replacement = await familyAction(S, 'recover', { recovery: first.recovery }, '', i + 2);
    const status = await familyAction(S, 'status', {}, replacement.token, i + 2);
    const originalStatus = await familyAction(S, 'status', {}, first.token, i + 2);
    const target = originalStatus.devices.find(d => d.state === 'approved' && d.id !== status.devices.find(d => d.at === 1).id);
    await familyAction(S, 'remove', { device: target.id }, first.token, i + 2);
    await assert.rejects(familyAction(S, 'status', {}, replacement.token), { status: 403 });
  }
  const pair = await familyAction(S, 'pair', {}, first.token, 40);
  const joined = await familyAction(S, 'join', { code: pair.code }, '', 41);
  assert.equal((await familyAction(S, 'status', {}, joined.token, 42)).pending, true);
  const recovered = await familyAction(S, 'recover', { recovery: first.recovery }, '', 43);
  assert.equal((await familyAction(S, 'status', {}, recovered.token, 44)).pending, false);
  assert.equal((await familyAction(S, 'status', {}, first.token, 44)).devices.filter(d => d.state === 'removed').length, 29);
});
test('photo restore rejects oversized or invalid backups before changing existing photos', async () => {
  const S = memory(), first = await familyAction(S, 'create', {}, '', 1);
  const image = 'data:image/jpeg;base64,AAAA';
  await familyAction(S, 'photo', { npc: 'owl', image }, first.token, 2);
  const backup = photos => ({ format: 'sparkle-family-photos-v1', photos });
  const tooMany = Object.fromEntries(Array.from({length:61}, (_,i) => [`character_${i}`, {image}]));
  await assert.rejects(familyAction(S, 'import', backup(tooMany), first.token, 3), {status:409});
  await assert.rejects(familyAction(S, 'import', backup(Object.fromEntries(Object.entries(tooMany).slice(0,60))), first.token, 3), {status:409});
  await assert.rejects(familyAction(S, 'import', backup([]), first.token, 3), {status:400});
  assert.deepEqual(Object.keys((await familyAction(S, 'manifest', {}, first.token, 4)).photos), ['owl']);
  // An invalid later row cannot leave an earlier valid replacement applied.
  await assert.rejects(familyAction(S, 'import', backup({owl:{image:'data:image/jpeg;base64,BBBB'},bad:{image:'invalid'}}), first.token, 5), {status:400});
  assert.equal((await familyAction(S, 'get-photo', {npc:'owl'}, first.token, 6)).image, image);
});
test('thirty active devices still enforce the family capacity limit', async () => {
  const S = memory(), first = await familyAction(S, 'create', {}, '', 1);
  for (let i = 0; i < 29; i++) await familyAction(S, 'recover', {recovery:first.recovery}, '', i + 2);
  const pair = await familyAction(S, 'pair', {}, first.token, 40);
  await assert.rejects(familyAction(S, 'join', {code:pair.code}, '', 41), {status:409});
  await assert.rejects(familyAction(S, 'recover', {recovery:first.recovery}, '', 42), {status:409});
});
test('private families are isolated; a pairing code does not approve a device', async () => {
  const S = memory(), first = await familyAction(S, 'create', { label: 'Phone' }, '', 1), other = await familyAction(S, 'create', {}, '', 1);
  await familyAction(S, 'photo', { npc: 'owl', image: 'data:image/jpeg;base64,AAAA' }, first.token, 2);
  assert.deepEqual((await familyAction(S, 'manifest', {}, other.token, 3)).photos, {});
  const pair = await familyAction(S, 'pair', {}, first.token, 4), joined = await familyAction(S, 'join', { code: pair.code, label: 'Tablet' }, '', 5);
  await assert.rejects(familyAction(S, 'manifest', {}, joined.token, 6), { status: 403 });
  await assert.rejects(familyAction(S, 'join', { code: pair.code }, '', 6), { status: 403 });
  const pending = (await familyAction(S, 'status', {}, first.token, 6)).devices.find(d => d.state === 'pending');
  await familyAction(S, 'approve', { device: pending.id }, first.token, 7);
  assert.equal((await familyAction(S, 'get-photo', { npc: 'owl' }, joined.token, 8)).image, 'data:image/jpeg;base64,AAAA');
  await familyAction(S, 'remove', { device: pending.id }, first.token, 9);
  await assert.rejects(familyAction(S, 'get-photo', { npc: 'owl' }, joined.token, 10), { status: 403 });
});
test('expired codes fail; recovery and photo migration require the right private files', async () => {
  const S = memory(), first = await familyAction(S, 'create', {}, '', 1), pair = await familyAction(S, 'pair', {}, first.token, 2);
  await assert.rejects(familyAction(S, 'join', { code: pair.code }, '', 600003), { status: 403 });
  await assert.rejects(familyAction(S, 'recover', { recovery: 'wrong' }, '', 3), { status: 403 });
  const recovered = await familyAction(S, 'recover', { recovery: first.recovery }, '', 3);
  assert.equal((await familyAction(S, 'status', {}, recovered.token, 4)).pending, false);
  await assert.rejects(familyAction(S, 'photo', { npc: '<script>', image: 'data:image/jpeg;base64,AAAA' }, first.token, 5), { status: 400 });
  await assert.rejects(familyAction(S, 'photo', { npc: 'owl', image: 'javascript:evil' }, first.token, 5), { status: 400 });
  await familyAction(S, 'photo', { npc: 'owl', image: 'data:image/jpeg;base64,AAAA' }, first.token, 5);
  const backup = { format: 'sparkle-family-photos-v1', photos: { owl: await familyAction(S, 'get-photo', { npc: 'owl' }, first.token, 6) } };
  const newHost = memory(), migrated = await familyAction(newHost, 'create', {}, '', 7);
  await familyAction(newHost, 'import', backup, migrated.token, 8);
  assert.equal((await familyAction(newHost, 'get-photo', { npc: 'owl' }, migrated.token, 9)).image, backup.photos.owl.image);
  assert.equal((await familyAction(newHost, 'manifest', {}, migrated.token, 10)).photos.owl.at, 8);
});


test('concurrent uploads to different characters are retained and rebind is explicit', async () => {
 const S = memory(), family = await familyAction(S, 'create', {}, '', 1);
 await Promise.all(['owl','Bà Năm'].map(npc => familyAction(S, 'photo', { npc, image:'data:image/jpeg;base64,AAAA' }, family.token, 2)));
 assert.deepEqual(Object.keys((await familyAction(S,'manifest',{},family.token,3)).photos).sort(), ['Bà Năm','owl']);
 await familyAction(S,'rebind',{from:'owl',to:'owl_new'},family.token,4);
 const photos = (await familyAction(S,'manifest',{},family.token,5)).photos; assert.ok(photos.owl_new); assert.equal(photos.owl,undefined);
 await assert.rejects(familyAction(S,'photo',{npc:'__proto__',image:'data:image/jpeg;base64,AAAA'},family.token,6), {status:400});
});
test('moving a photo whose picture is missing refuses instead of writing an empty picture', async () => {
  const S = memory(), first = await familyAction(S, 'create', {}, '', 1);
  await familyAction(S, 'photo', { npc: 'owl', image: 'data:image/jpeg;base64,AAAA' }, first.token, 2);
  const keys = [...(await S.list({ prefix: 'picture/' })).blobs.map(b => b.key)]; for (const k of keys) await S.delete(k);
  await assert.rejects(familyAction(S, 'rebind', { from: 'owl', to: 'cat' }, first.token, 3), { status: 404 });
  assert.deepEqual((await familyAction(S, 'manifest', {}, first.token, 4)).photos, { owl: { at: 2 } });
});
