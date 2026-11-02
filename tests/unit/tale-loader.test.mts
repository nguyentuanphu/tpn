import test from 'node:test';
import assert from 'node:assert/strict';
import { loadTale } from '../../js/tale-loader.js';
test('page turns arriving during a slow download are retained without republishing stale page zero', async () => {
  let finish, receive;
  const sent = [], later = [], full = { id: 'test', pages: [[], [], [], []] };
  const source = { send: n => sent.push(n), listen: fn => { receive = fn; } };
  const loading = loadTale({ id: 'test', load: () => new Promise(r => { finish = r; }) }, source);
  receive(1); receive(2); finish(full);
  const result = await loading;
  assert.equal(result.tale, full); assert.equal(result.startPage, 2); assert.deepEqual(sent, []);
  result.sync.listen(n => later.push(n)); receive(3); result.sync.send(1);
  assert.deepEqual(later, [3]); assert.deepEqual(sent, [1]);
});
test('failed or missing tale bodies reject without pretending the tale was read', async () => {
  await assert.rejects(loadTale({ id: 'gone', load: async () => null }, null), /Missing tale/);
  await assert.rejects(loadTale({ id: 'offline', load: async () => { throw Error('offline'); } }, null), /offline/);
});
