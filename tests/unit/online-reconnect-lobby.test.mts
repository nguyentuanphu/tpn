// Unit tests for online websocket reconnection, relay crypto, and lobby resynchronization.
// Mock minimal browser globals for Node.js test environment before importing web modules
if (typeof globalThis.window === 'undefined') globalThis.window = globalThis;
if (typeof globalThis.addEventListener === 'undefined') {
  globalThis.addEventListener = () => {};
  globalThis.removeEventListener = () => {};
}
if (typeof globalThis.document === 'undefined') globalThis.document = { createElement: () => ({}), addEventListener: () => {} };
if (typeof globalThis.localStorage === 'undefined') {
  const store = new Map();
  globalThis.localStorage = {
    getItem: k => store.get(k) ?? null,
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: k => store.delete(k),
    clear: () => store.clear(),
  };
}
if (typeof globalThis.navigator === 'undefined') globalThis.navigator = { language: 'en' };

import test from 'node:test';
import assert from 'node:assert/strict';
import { BROKERS, topicFor, keyFor, seal, open, Channel } from '../../js/relay.js';
const { Net, okRoom, ROOM_LEN } = await import('../../js/net.js');

test('BROKERS returns default secure websocket brokers', () => {
  const brokers = BROKERS();
  assert.ok(Array.isArray(brokers));
  assert.ok(brokers.length >= 2);
  for (const b of brokers) {
    assert.ok(b.startsWith('wss://'), `Broker ${b} must use secure websocket protocol`);
  }
});

test('topicFor and keyFor derive deterministic encrypted topics and keys', async () => {
  const topic1 = await topicFor('room', '123456');
  const topic2 = await topicFor('room', '123456');
  assert.equal(topic1, topic2);
  assert.ok(topic1.startsWith('sparklevalley/v2/room/'));

  const diffTopic = await topicFor('mem', '123456');
  assert.notEqual(topic1, diffTopic);

  const key1 = await keyFor('123456');
  const key2 = await keyFor('123456');
  assert.ok(key1 instanceof CryptoKey);
  assert.ok(key2 instanceof CryptoKey);
});

test('seal and open correctly encrypt and decrypt payloads with AES-GCM', async () => {
  const key = await keyFor('test-secret-key-123');
  const payload = { t: 'hello', name: 'Bé Na', from: 'guest-1', v: 42 };
  const sealed = await seal(key, payload);
  assert.ok(sealed instanceof Uint8Array);
  assert.ok(sealed.length > 12); // 12-byte IV + ciphertext

  const opened = await open(key, sealed);
  assert.deepEqual(opened, payload);

  // Tampered ciphertext fails decryption cleanly and returns null
  const tampered = new Uint8Array(sealed);
  tampered[tampered.length - 1] ^= 0xff;
  const bad = await open(key, tampered);
  assert.equal(bad, null);
});

test('okRoom enforces 6-digit room code format', () => {
  assert.equal(ROOM_LEN, 6);
  assert.equal(okRoom('123456'), true);
  assert.equal(okRoom('000000'), true);
  assert.equal(okRoom('999999'), true);
  assert.equal(okRoom('12345'), false);
  assert.equal(okRoom('1234567'), false);
  assert.equal(okRoom('abcdef'), false);
  assert.equal(okRoom(''), false);
  assert.equal(okRoom(null), false);
  assert.equal(okRoom(undefined), false);
});

test('channel reconnects and subscribes again after a websocket close', async t => {
  const originalWebSocket = globalThis.WebSocket;
  const sockets = [];
  class FakeWebSocket {
    static OPEN = 1;
    constructor(url) {
      this.url = url;
      this.readyState = 1;
      this.sent = [];
      sockets.push(this);
      queueMicrotask(() => this.onopen());
    }
    send(packet) {
      this.sent.push(packet);
      if (packet[0] === 0x10) queueMicrotask(() => this.onmessage({ data: new Uint8Array([0x20, 0x02, 0, 0]).buffer }));
    }
    close() { this.readyState = 3; this.onclose(); }
  }
  globalThis.WebSocket = FakeWebSocket;
  t.mock.timers.enable({ apis: ['setTimeout'] });
  try {
    const channel = new Channel({ kind: 'room', code: '123456' });
    channel.key = await keyFor('123456');
    channel.topic = 'sparklevalley/v2/room/test';
    const connecting = channel._connect('wss://example.test/mqtt', null);
    await new Promise(queueMicrotask);
    await new Promise(queueMicrotask);
    await connecting;
    assert.equal(sockets.length, 1);
    assert.ok(sockets[0].sent.some(packet => packet[0] === 0x82), 'initial connection subscribes to the room topic');

    sockets[0].close();
    t.mock.timers.tick(4000);
    await new Promise(queueMicrotask);
    await new Promise(queueMicrotask);
    assert.equal(sockets.length, 2);
    assert.ok(sockets[1].sent.some(packet => packet[0] === 0x82), 'reconnection subscribes to the room topic again');
    channel.close();
  } finally {
    globalThis.WebSocket = originalWebSocket;
  }
});

test('heartbeat re-announces only admitted cloud guests and stops after leaving', t => {
  t.mock.timers.enable({ apis: ['setInterval'] });
  const room = Object.create(Net);
  Object.assign(room, { role: 'guest', cloudOn: true, knocking: false, hostId: 'host-1', remotes: {}, send() {}, emit() {} });
  let hellos = 0;
  room._helloCloud = () => hellos++;
  room._startPings();
  t.mock.timers.tick(22000);
  assert.equal(hellos, 11);
  room.knocking = true;
  t.mock.timers.tick(2000);
  assert.equal(hellos, 11);
  room.knocking = false; room.cloudOn = false;
  t.mock.timers.tick(2000);
  assert.equal(hellos, 11);
  room.cloudOn = true; room.role = null;
  t.mock.timers.tick(2000);
  assert.equal(hellos, 11);
  clearInterval(room._pt);
});

