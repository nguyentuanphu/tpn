// Together quests (round F, co-op online): when friends share a room, both games pick the same quest from the room
// code (a seeded stream, js/core/rng.js), so no new kind of network message is needed: "Visit the Lotus pond, Mirror
// Lake and China Town together". A place counts when this child is in it with a friend from the room standing within
// 15 m (friends' positions already come over the network). Finishing gives every child in it coins and a cheer, and
// the next quest starts. Progress lasts while the room is open (a new room is a new set of quests).
import { T } from './i18n.js';
import { say } from './voice.js';
import { SFX } from './audio.js';
import { farm, saveFarm } from './state.js';
import { regionAt } from './world.js';
import { stream } from './core/rng.js';
import { events } from './core/events.js';
import { id as makeId } from './core/ids.js';
import { PLACES, placeName } from './placebook.js';
import { pic } from './art.js';
import { fmt } from './money.js';
import { esc } from './util.js';

// places near each other in the middle of the valley, so a quest is a walk, not a long trip
const NEAR = ['home', 'village', 'town', 'market', 'aussie', 'lake', 'bamboo', 'meadow', 'paddies', 'china', 'india'];
export const TOGETHER_M = 15, REWARD = 15;
/** the n-th quest of a room: 3 different places, the same on every device in the room */
export function questFor(code, n = 0) {
  const r = stream('coop/' + code), pool = NEAR.filter(id => PLACES.some(x => x.id === id));
  let q = []; for (let k = 0; k <= n; k++) q = r.shuffle(pool).slice(0, 3);
  return q;
}

export function createCoop(G, { Net, toast }) {
  let code = null, n = 0, done = {}, t = 0, quest = [];
  const reset = c => { code = c; n = 0; done = {}; quest = c ? questFor(c, 0) : []; };
  const friendsNear = h => Object.values(G.partners).filter(P => P.pos && P.pos.y > -40 && Math.hypot(P.pos.x - h.pos.x, P.pos.z - h.pos.z) <= TOGETHER_M);
  const api = {
    get active() { return !!code && quest.length > 0; }, get quest() { return quest.slice(); }, get done() { return { ...done }; }, get count() { return n; },
    // the Pad's Adventures page: the quest and its places (nothing when not in a room with a friend)
    html() {
      if (!api.active || !Object.keys(G.partners).length) return '';
      return `<h3>${pic('🤝')} ${T('Together quest', 'Nhiệm vụ cùng bạn')}</h3><p class="note">${T('Go to these places with your friend. A place counts when you are there together!', 'Cùng bạn đi đến những nơi này. Hai bạn cùng có mặt thì mới được tính nhé!')}</p>
        <ol class="quests">${quest.map(id => `<li class="${done[id] ? 'done' : ''}"><span>${done[id] ? '✅' : pic((PLACES.find(x => x.id === id) || {}).icon || '🗺️')}</span>${esc(placeName(id))}</li>`).join('')}</ol>`;
    },
    // (tests) check now instead of waiting for the next second
    tick() { step(); }
  };
  function step() {
    const c = Net.connected && Net.code ? String(Net.code) : null;
    if (c !== code) { reset(c); if (c && Object.keys(G.partners).length) announce(); }
    if (!api.active || !Object.keys(G.partners).length) return;
    if (!api.announced) announce();
    for (const h of G.heroes) {
      const rg = regionAt(h.pos.x, h.pos.z);
      if (!quest.includes(rg) || done[rg] || !friendsNear(h).length) continue;
      done[rg] = true; SFX.chime && SFX.chime();
      const k = quest.filter(id => done[id]).length;
      G.huds[h.i] && G.huds[h.i].toast(`🤝 ${T('Together in', 'Cùng nhau ở')} ${placeName(rg)}! (${k}/${quest.length})`);
      events.emit('ProgressChanged', { profileId: makeId('player', h.profile.id || 'guest'), what: 'coop', placeId: makeId('place', rg), count: k });
      if (k === quest.length) finish(); else say('Together! Well done!', 'Cùng nhau! Giỏi lắm!');
      break;
    }
  }
  function announce() {
    api.announced = true;
    G.heroes.forEach(h => toast(h, `🤝 ${T('Together quest: visit', 'Nhiệm vụ cùng bạn: đến')} ${quest.map(placeName).join(', ')}`));
  }
  function finish() {
    farm.coins += REWARD; saveFarm();
    G.heroes.forEach(h => { toast(h, `🎉 ${T('Quest done together!', 'Hoàn thành nhiệm vụ cùng nhau!')} +${fmt(REWARD)}`); G.celebrate && G.celebrate(h); });
    say('You finished the quest together!', 'Các con đã cùng nhau hoàn thành nhiệm vụ!');
    n++; done = {}; quest = questFor(code, n); api.announced = false;
    setTimeout(() => { if (api.active) announce(); }, 4000);
  }
  G.world.updaters.push(dt => { t += dt; if (t >= 1) { t = 0; step(); } });
  return api;
}
