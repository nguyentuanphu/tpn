// @ts-check
// The event bus (architecture §6, layer L0): one system says something happened, any other system may listen, and
// neither knows the other. Synchronous; payloads are plain data with ids, never objects. A listener that throws is
// logged and skipped, so it never stops the one who emitted (graceful failure). Only the adopted events (§6 table)
// may be emitted: a typo is caught at once instead of silently reaching nobody.
//   import { events } from './core/events.js';
//   const off = events.on('ActivityCompleted', e => …);  events.emit('ActivityCompleted', { … });  off();

export const EVENT_NAMES = [
  'WorldGenerated', 'WorldValidated', 'WorldReady',
  'PlayerEnteredVillage', 'PlayerLeftVillage', 'InteractionStarted',
  'ActivityStarted', 'ActivityCompleted', 'ActivityAbandoned',
  'ItemsChanged', 'CoinsChanged', 'ProgressChanged',
  'FerryDeparted', 'FerryArrived', 'VehicleBlocked',
  'SettingsChanged', 'LanguageChanged', 'SaveCompleted', 'SaveFailed',
  'PeerJoined', 'PeerLeft', 'DialogRequested', 'ToastRequested', 'HowToRequested',
  // added in round E (docs/ARCHITECTURE.md §6): a sticker, a postcard or a house decoration was earned or placed
  'StickerEarned', 'PostcardEarned', 'HomeDecorated',
  'ArcadeAdventureTriggered'
];
const KNOWN = new Set(EVENT_NAMES);

/** @typedef {(payload: any, name: string) => void} Listener */
export function createBus({ strict = true, log = (/** @type {any[]} */ ...a) => console.warn(...a) } = {}) {
  /** @type {Map<string, Set<Listener>>} */
  const map = new Map();
  /** @type {{ name: string, payload: any, t: number }[]} */
  const recent = [];
  const check = (/** @type {string} */ name) => { if (strict && !KNOWN.has(name) && name !== '*') throw new Error(`unknown event "${name}" (add it to EVENT_NAMES and §6 first)`); };
  const bus = {
    /** @param {string} name  @param {Listener} fn  @returns {() => void} the way to stop listening */
    on(name, fn) { check(name); if (!map.has(name)) map.set(name, new Set()); map.get(name).add(fn); return () => { const s = map.get(name); if (s) s.delete(fn); }; },
    /** @param {string} name  @param {Listener} fn */
    once(name, fn) { const off = bus.on(name, (p, n) => { off(); fn(p, n); }); return off; },
    /** @param {string} name  @param {any} [payload] @returns {number} how many listeners heard it */
    emit(name, payload = {}) {
      check(name);
      recent.push({ name, payload, t: Date.now() }); if (recent.length > 50) recent.shift();
      let n = 0;
      for (const key of [name, '*']) for (const fn of [...(map.get(key) || [])]) { n++; try { fn(payload, name); } catch (e) { log(`event ${name}: a listener failed`, e); } }
      return n;
    },
    /** the last 50 events (tests and Grown-ups › Advanced) */
    recent: () => recent.slice(),
    clear() { map.clear(); recent.length = 0; }
  };
  return bus;
}
// the game's one bus
export const events = createBus();
