// Service-worker update UX stays safe while a child is playing: activate first, reload after controllerchange.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

class Element {
  constructor(tag) { this.tagName = tag.toUpperCase(); this.children = []; this.className = ''; this.hidden = false; this.isConnected = true; this.dataset = {}; }
  append(...children) { this.children.push(...children); }
  appendChild(child) { this.children.push(child); return child; }
  querySelector(selector) {
    if (selector === '.update-notice') return this.children.find(child => child.className === 'update-notice') || null;
    if (selector === 'h1' || selector === 'p') return this.children.find(child => child.tagName === selector.toUpperCase()) || new Element(selector);
    return null;
  }
  setAttribute() {}
  focus() {}
  remove() { this.isConnected = false; }
}

function launchHarness() {
  const listeners = new Map();
  const body = new Element('body');
  const boot = new Element('div');
  boot.querySelector = selector => selector === 'h1' || selector === 'p' ? new Element(selector) : null;
  const document = {
    body,
    visibilityState: 'visible',
    getElementById: () => boot,
    querySelector: selector => selector === '.update-notice' ? body.querySelector(selector) : null,
    createElement: tag => new Element(tag),
    addEventListener: (type, listener) => listeners.set(`document:${type}`, listener)
  };
  const serviceWorkerListeners = new Map();
  const serviceWorker = {
    controller: {},
    getRegistration: async () => ({ waiting: { postMessage: message => serviceWorker.waitingMessage = message }, addEventListener: () => {}, update: async () => {} }),
    addEventListener: (type, listener) => serviceWorkerListeners.set(type, listener),
    waitingMessage: null
  };
  let reloads = 0;
  const context = vm.createContext({
    window: { __sv: { heroes: [{}], save() {} }, svFeatureOn: () => true },
    document, navigator: { serviceWorker }, localStorage: { getItem: () => '{"content":{"features":{"explain_updateNotice":true}}}' },
    location: { reload: () => { reloads++; } },
    addEventListener: (type, listener) => listeners.set(`window:${type}`, listener),
    setInterval: () => 1, clearInterval: () => {}, setTimeout, clearTimeout, console
  });
  const source = fs.readFileSync(new URL('../../js/launch.js', import.meta.url), 'utf8');
  const start = source.indexOf('window.svOfferUpdate =');
  const end = source.indexOf('await new Promise', start);
  assert.ok(start >= 0 && end > start, 'launch update logic should remain present');
  vm.runInContext(source.slice(0, end), context, { filename: 'js/launch.js' });
  return { context, body, serviceWorker, serviceWorkerListeners, reloads: () => reloads };
}

test('waiting service worker activates first and reloads only after controllerchange', async () => {
  const h = launchHarness();
  h.context.window.svOfferUpdate();
  const notice = h.body.children.find(child => child.className === 'update-notice');
  assert.ok(notice, 'the update notice is shown while the game is active');
  const updateButton = notice.children.find(child => child.textContent === 'Update now');
  await updateButton.onclick();
  assert.equal(h.serviceWorker.waitingMessage?.type, 'SKIP_WAITING');
  assert.equal(h.reloads(), 0, 'activation does not reload before the new worker controls the page');
  h.serviceWorkerListeners.get('controllerchange')();
  assert.equal(h.reloads(), 1, 'reload follows controllerchange');
});