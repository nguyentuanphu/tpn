// The shared worker library also describes non-service workers. Check the host before using its lifecycle API.
function isServiceWorker(scope: typeof globalThis): scope is typeof globalThis & ServiceWorkerGlobalScope {
  return 'clients' in scope;
}
if (!isServiceWorker(self)) throw new Error('Service worker context required');
const worker = self;
// Offline support: cache the whole game on first visit, then serve from the cache.
// Bump VERSION whenever files change so devices pick up the update. Updates only replace the game's files:
// saved progress (localStorage, IndexedDB, and the 'sv-save' copy) and the voice pack are never deleted.
const VERSION = 'sv-2026-10-25-v1.02';
const FILES = [
  'js/content/tester-arcades.js', 'js/games/parade-engine.js', 'js/games/arcade-session.js', 'js/games/arcade-board.js', 'js/games/sparkleorchard.js', 'js/games/fruitbar-engine.js', 'js/games/sparklefruitbar.js',
  'js/games/trongnu.js', 'js/games/trongnu-rules.js',
  'js/content/fruit-parade.js', 'js/games/fruitparade.js', 'js/games/fruitparade-core.js', 'js/games/fruitparade-engine.js', 'js/games/fruitparade-session.js', 'js/games/fruitparade-input.js', 'js/games/fruitparade-style.js',
  'js/games/cacuangua.js', 'js/games/cacuangua-core.js', 'js/games/horse-session.js','js/games/oanquan-core.js','js/games/oanquan-online.js','js/content/family-quiz.js','js/family-quiz-store.js','js/family-quiz-editor.js','js/games/familyquiz-core.js','js/games/familyquiz.js','js/games/board-agreement.js','js/games/tug-core.js','js/games/tug-session.js','js/games/tug-online.js','js/games/shared-board-session.js','js/games/snakes-core.js','js/games/snakes.js', 'js/games/multiplayer-foundations.js', 'js/games/pending-vietnam.js', 'js/games/folk-court.js', 'js/games/folk-court-rules.js',
  './', 'index.html', 'manifest.webmanifest', 'css/style.css',
  'vendor/three.module.js', 'vendor/peerjs.min.js', 'vendor/RoomEnvironment.js', 'css/fonts.css',
  'fonts/Fredoka-latin-500.woff2', 'fonts/Fredoka-latin-ext-500.woff2', 'fonts/Baloo2-latin-600.woff2', 'fonts/Baloo2-latin-ext-600.woff2', 'fonts/Baloo2-vietnamese-600.woff2',
  'js/main.js', 'js/rideview.js', 'js/render-recovery.js', 'js/launch.js', 'js/screencapture.js', 'js/familydevices.js', 'js/family-backup.js', 'js/util.js', 'js/state.js', 'js/i18n.js', 'js/money.js', 'js/audio.js', 'js/voice.js', 'js/hanoi-pack.js', 'js/content/hanoi-pack-info.js', 'js/gfx.js',
  'js/world.js', 'js/avatar.js', 'js/player.js', 'js/input.js', 'js/net.js', 'js/mictest.js', 'js/hud.js', 'js/explain.js', 'js/ui.js', 'js/ui-settings.js', 'js/data.js',
  'js/farm.js', 'js/places.js', 'js/story.js', 'js/recorder.js', 'js/secrets.js', 'js/credits.js', 'js/howto.js', 'js/howto-player.js', 'js/howto-registry.js', 'js/howto-data.js', 'js/chat.js', 'js/chat-player.js',
  'js/listen.js', 'js/install.js', 'js/gather.js', 'js/trade.js', 'js/asia.js', 'js/heritage.js', 'js/pets.js', 'js/ferry.js', 'js/passport.js', 'js/festivals.js', 'js/weather.js', 'js/fun.js', 'js/learn.js', 'js/packhash.js', 'js/voice-fragments.js', 'js/showcase.js', 'js/games/music.js', 'js/icons.js', 'js/words2.js', 'js/games/asia.js', 'js/houses.js', 'js/commands.js', 'js/extras.js', 'js/town.js', 'js/powerlines.js', 'js/viwords.js', 'js/vehicles.js', 'js/traffic.js', 'js/film.js', 'js/content/films.js', 'js/content/talefilms.js', 'js/content/films/kit.js', 'js/content/film-looks.js', 'js/content/films/rongtien.js', 'js/content/films/caytre.js', 'js/content/films/tamcam.js', 'js/content/films/sodua.js', 'js/content/films/thachsanh.js', 'js/content/films/chucuoi.js', 'js/content/films/cockien.js', 'js/content/films/vusua.js', 'js/content/films/baluoiriu.js', 'js/content/films/quabau.js', 'js/content/films/thayboi.js', 'js/content/films/nhacmeo.js', 'js/content/films/ongtao.js', 'js/content/films/cachep.js', 'js/content/films/sontinh.js', 'js/content/films/rainbowserpent.js', 'js/content/films/emu.js', 'js/content/films/dotkangaroo.js', 'js/content/films/birdcolours.js', 'js/content/films/magicpudding.js', 'js/content/films/tiddalik.js', 'js/content/films/greatrace.js', 'js/content/films/maliang.js', 'js/content/films/weaver.js', 'js/content/films/nian.js', 'js/content/films/kongrong.js', 'js/content/films/change.js', 'js/content/films/crow.js', 'js/content/films/lionrabbit.js', 'js/content/films/ganesha.js', 'js/content/films/bluejackal.js', 'js/content/films/elephantmice.js', 'js/content/films/monkey.js', 'js/lanterns.js', 'js/companion.js', 'js/dinh.js', 'js/content/chapters.js', 'js/content/chapter2hanoi.js', 'js/content/chapter2props.js', 'js/content/chapter2films.js', 'js/content/chapter2text.js', 'js/yard.js', 'js/content/yard.js', 'js/content/map.js', 'js/openspot.js', 'js/handpad.js', 'js/kidplay.js', 'js/hoilang.js', 'js/surprises.js', 'js/parents.js', 'js/content/hoilang.js', 'js/content/surprises.js', 'js/content/parents.js', 'js/lunar.js', 'js/content/festcal.js', 'js/content/releases.js', 'js/emojiswap.js', 'js/regions.js', 'js/words.js', 'js/games/folk.js', 'js/games/folk2.js', 'js/roads.js', 'js/signposts.js', 'js/nametags.js', 'js/cities.js', 'js/games/cities.js', 'js/chatter.js', 'js/tales.js', 'js/tale-loader.js', 'js/talesdata.js', 'js/tales-content.js', 'js/kite.js', 'js/relay.js', 'js/hawkers.js', 'js/snacks.js', 'js/animals.js', 'js/homes.js', 'js/art.js', 'js/suburbs.js', 'js/games/learning.js', 'js/games/all.js', 'js/games/catalog.js', 'js/games/learning-meta.js', 'js/cartoon.js', 'js/games/tienlen.js', 'js/games/tienlenrules.js', 'js/realworld.js', 'js/symbols.js', 'js/games/more.js', 'js/regionsites.js', 'js/vnfun.js', 'js/custom.js', 'js/content/festival-visibility.js', 'js/festival-live.js', 'content/custom.json', 'js/build.js', 'js/worldedit.js', 'js/content/build-types.js', 'js/studio-position.js', 'js/folkshow.js', 'js/ads.js', 'js/solids.js', 'js/players.js', 'js/packbar.js', 'js/roomcode.js', 'js/photos.js', 'js/netmsg.js', 'js/lotus.js', 'js/worldcache.js', 'js/core/ids.js', 'js/core/events.js', 'js/core/rng.js', 'js/core/geo.js', 'js/placebook.js', 'js/familycards.js', 'js/home-decor-models.js', 'js/myhouse.js', 'js/popups.js', 'js/vendors.js', 'js/games/registry.js', 'js/content/rules.js', 'js/report.js', 'js/website.js', 'js/printpage.js', 'js/coop.js', 'js/netgames.js', 'js/twinchests.js', 'js/claims.js', 'js/simple.js', 'js/songs.js', 'js/content/songs.js', 'js/content/activities.js', 'js/content/unlocks.js', 'js/content/secondset.js', 'js/festdecor.js', 'js/festhunt.js', 'js/content/festhunt.js', 'js/seethrough.js', 'js/content/chapter3sydney.js', 'js/content/chapter3props.js', 'js/content/chapter3films.js', 'js/content/chapter3text.js', 'js/voicepack.js', 'js/voice-index.js', 'js/autoplay.js', 'js/content/autoplay.js', 'js/testergate.js', 'js/tester.js', 'js/tester-float.js', 'js/travel-stops.js', 'js/tester-detection.js', 'js/report-outbox.js', 'js/testerrewards.js', 'js/content/tester.js', 'js/plots.js', 'js/reeds.js', 'js/scrollhelp.js', 'js/chipinfo.js', 'js/soundsheet.js', 'js/content/familymissions.js', 'js/villagertalk.js', 'js/content/villagerlines.js', 'js/owlguide.js', 'js/pricetags.js', 'js/content/owllessons.js', 'js/jobs.js', 'js/content/jobs.js', 'js/wayfind.js', 'js/feel.js', 'js/stickers.js', 'js/stickerfx.js', 'js/content/stickers.js', 'js/adventure.js', 'js/content/adventures.js', 'js/dayplan.js', 'js/animalhomes.js', 'js/keepcopy.js', 'js/content/devname.js',
  'js/content/savecopy.js', 'js/content/familycode.js', 'js/games/money.js', 'js/games/moneylogic.js', 'js/games/frame.js', 'js/games/playwatch.js', 'js/games/thinking.js', 'js/games/bigthinkers.js', 'js/games/bigthinkers2.js', 'js/games/talkgames.js', 'js/games/drawing.js', 'js/games/drawshape.js', 'js/games/strategy.js', 'js/games/goat.js', 'js/games/goat-core.js', 'js/games/goat-art.js', 'js/games/vietnam.js', 'js/games/vietnam2.js', 'js/games/nature2.js', 'js/games/animals2.js', 'js/games/me2.js', 'js/games/thinking2.js', 'js/games/music2.js', 'js/games/words2.js', 'js/games/numbers2.js', 'js/games/shapes2.js', 'js/games/places2.js', 'js/games/outside.js', 'js/games/money2.js', 'js/games/reading2.js', 'js/games/market.js', 'js/games/farmgames.js',
  'js/shop.js', 'js/content/shop.js', 'js/boxes.js', 'js/content/boxes.js', // (round S: the clothes shop, mystery boxes, rankings, collectibles)
  'js/games/readingmenu.js', 'js/games/reading.js', 'js/content/reading.js', 'js/games/storyhelp.js', 'js/content/storyhelp.js', // (Play reading trial)
  'sounds/animals/cow.mp3', 'sounds/animals/sheep.mp3', 'sounds/animals/pig.mp3', 'sounds/animals/dog.mp3', 'sounds/animals/cat.mp3', // (owner, 17 Oct AEDT: real animal voices)
  'sounds/animals/duck.mp3', 'sounds/animals/hen.mp3', 'sounds/animals/horse.mp3', 'sounds/animals/frog.mp3', 'sounds/animals/owl.mp3',
  'icons/icon-180.png', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/launch/valley-portrait.jpg', 'icons/launch/valley-landscape.jpg'
];
// (Analytics & Infra, 10 Oct, owner: "can't even play offline when there is no internet") the newest copy when the
// network answers quickly, otherwise the saved copy after a short wait: a connection that never answers (Wi-Fi with no
// internet, weak phone signal) must never keep the game from starting. The network's answer still refreshes the copy.
const QUICK = 1500;
const PHOTO_HOST = /^https:\/\/((upload|thumb)\.wikimedia\.org|live\.staticflickr\.com|farm\d+\.staticflickr\.com)\//;
function quick(e, cacheName, req, fallback) {
  return caches.open(cacheName).then(c => {
    const net = fetch(req).then(r => { if (r.ok) return c.put(req, r.clone()).catch(() => { }).then(() => r); return r; });
    e.waitUntil(net.catch(() => { })); // (the refresh finishes even when the saved copy answered)
    const saved = () => c.match(req, { ignoreSearch: true });
    return new Promise<Response>(done => {
      let over = false;
      const giveSaved = () => saved().then(hit => { if (hit) { over = true; done(hit); } else if (!over) net.then(done, () => done(fallback())); });
      const t = setTimeout(giveSaved, QUICK);
      net.then(r => { if (over) return; clearTimeout(t); if (r.ok) { over = true; done(r); } else giveSaved(); }, () => { clearTimeout(t); if (!over) giveSaved(); });
    });
  });
}
const emptyJSON = () => new Response('{}', { headers: { 'Content-Type': 'application/json' } });
// (r80, owner 17 Oct AEDT: "users must have the latest r") the update saves each file as it arrives, so a game closed
// part way through goes on from there the next time instead of starting again; always the website's copy, never one the
// browser kept; a file that fails stops this try (the next one fetches only what is still missing). When every file is
// in, the new version takes over at once on every device, whatever version it had: no tap and no closing every window
// (a game already open is told, js/launch.js). Saves and the voice pack are never touched.
async function fill() {
  const c = await caches.open(VERSION), have = new Set((await c.keys()).map(r => new URL(r.url).pathname));
  const todo = FILES.filter(f => !have.has(new URL(f, worker.location.href).pathname));
  let i = 0;
  const one = async () => { while (i < todo.length) { const f = todo[i++]; const r = await fetch(new Request(f, { cache: 'reload' })); if (!r.ok) throw new Error(f + ': ' + r.status); await c.put(f, r); } };
  await Promise.all([one(), one(), one(), one(), one(), one()]);
}
worker.addEventListener('install', (e: ExtendableEvent) => { e.waitUntil(fill().then(() => worker.skipWaiting())); });
worker.addEventListener('message', (e: ExtendableMessageEvent) => { if (e.data?.type === 'SKIP_WAITING') worker.skipWaiting(); });
// (r80) this version's own copy first: the one older copy kept below is only for a game still open from before (its
// lazy parts); answering from it first had every updated device running the version before (r78 ran r77's files)
const saved = req => caches.open(VERSION).then(c => c.match(req, { ignoreSearch: true })).then(hit => hit || caches.match(req, { ignoreSearch: true }));
worker.addEventListener('activate', (e: ExtendableEvent) => { e.waitUntil(caches.keys().then(keys => { const old = keys.filter(k => k !== 'sv-family' && /^sv-20/.test(k) && k !== VERSION); const keep = old.slice(-1); return Promise.all(old.filter(k => !keep.includes(k)).map(k => caches.delete(k))); }).then(() => worker.clients.claim())); });
worker.addEventListener('fetch', (e: FetchEvent) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // (round R privacy, 9 Oct) family photos (api/family/…) are private: never kept here, straight to the network (the
  // game keeps its own copy in the "sv-family" cache); nor anything else under api/
  if (url.pathname.includes('/api/')) return;
  // (owner, 17 Oct AEDT) real photos shown from Wikimedia or Flickr (js/realworld.js PHOTO_HOST): kept here once seen,
  // so they still show without the internet; the newest 150 are kept (an image from another site comes back "opaque",
  // which is fine to keep and show)
  if (PHOTO_HOST.test(req.url)) {
    e.respondWith(caches.open('sv-photos').then(c => c.match(req, { ignoreVary: true }).then(hit => hit || fetch(req).then(r => {
      if (r.ok || r.type === 'opaque') e.waitUntil(c.put(req, r.clone()).then(() => c.keys()).then(ks => { const old = ks.filter(k => PHOTO_HOST.test(k.url)); return Promise.all(old.slice(0, Math.max(0, old.length - 150)).map(k => c.delete(k))); }).catch(() => { }));
      return r;
    }))));
    return;
  }
  if (url.origin !== location.origin) return;
  // Hashed chunks are immutable. An open previous-version game may still need its own lazy chunks.
  if (url.pathname.includes('/bundle/')) { e.respondWith(saved(req).then(hit => hit || fetch(req).then(r => { if (r.ok) e.waitUntil(caches.open(VERSION).then(c => c.put(req, r.clone()))); return r; }))); return; }
  // the voice pack: kept in its own cache (it survives game updates) and stored as lines are played
  if(url.pathname.startsWith('/voices/fpt-leminh-v1/')){
    e.respondWith(caches.open('sv-voices-fpt-leminh-v1').then(async c=>{
      if(url.pathname.endsWith('/manifest.json')){try{const r=await fetch(req);if(r.ok){e.waitUntil(c.put(req,r.clone()));return r;}}catch{}const saved=await c.match(req);return saved||new Response('Offline',{status:503});}
      return(await c.match(req))||fetch(req); // The voice service verifies the checksum before storing MP3s.
    }));return;
  }
  if (/\/voices\/manifest(?:-(?:en|vi|zh|hi))?\.json$/.test(url.pathname)) { // the saved list at once (slow phone data must never mean the phone's voice), refreshed behind
    e.respondWith(caches.open('sv-voices').then(c => c.match(req).then(hit => {
      const previous = hit?.clone(); // The response returned to the page will already be consumed when refresh finishes.
      const fresh = fetch(req).then(async r => {
        if (r.ok) {
          const text = await r.clone().text(); await c.put(req, r.clone());
          if (previous && text !== await previous.text()) {
            const manifest = JSON.parse(text);
            if (manifest && manifest.lines) {
              const clients = await worker.clients.matchAll({ type: 'window' });
              clients.forEach(client => client.postMessage({ type: manifest.language ? 'SV_VOICE_LANGUAGE_MANIFEST' : 'SV_VOICE_MANIFEST', manifest }));
            }
          }
        }
        return r;
      });
      if (hit) { e.waitUntil(fresh.catch(() => { })); return hit; }
      return fresh.catch(() => new Response('{}', { status: 404 }));
    })));
    return;
  }
  // the family's content pack (Sparkle Studio): the newest when online, the saved copy when offline
  // (audit, 9 Oct) js/content/*.js is game code: it stays with the rest of the game's files, never fetched on its own
  if (url.pathname.includes('/content/') && !url.pathname.includes('/js/content/')) {
    e.respondWith(quick(e, VERSION, req, emptyJSON));
    return;
  }
  // real photos of the landmarks saved with the game (Sparkle Studio → Photos): the list newest-first, photos kept once seen
  if (url.pathname.endsWith('/photos/index.json')) {
    e.respondWith(quick(e, 'sv-photos', req, emptyJSON));
    return;
  }
  if (url.pathname.includes('/photos/')) {
    e.respondWith(caches.open('sv-photos').then(c => c.match(req).then(hit => hit || fetch(req).then(r => { if (r.ok) c.put(req, r.clone()); return r; }))));
    return;
  }
  // (r89) the family website (/home, tools/build-website.mts): not part of the game's download. Its pictures are named
  // by their content, so each is kept once seen; the page itself comes fresh when online and from the copy kept on the
  // device when offline (only once it has been opened online)
  if (url.pathname === '/home' || url.pathname.startsWith('/home/')) {
    if (url.pathname.startsWith('/home/assets/')) e.respondWith(caches.open('sv-website').then(c => c.match(req).then(hit => hit || fetch(req).then(r => { if (r.ok) e.waitUntil(c.put(req, r.clone())); return r; }))));
    else e.respondWith(caches.open('sv-website').then(c => fetch(req).then(r => { if (r.ok) e.waitUntil(c.put(req, r.clone())); return r; }).catch(() => c.match(req, { ignoreSearch: true }).then(hit => hit || Response.error()))));
    return;
  }
  if (url.pathname.includes('/voices/') && url.pathname.endsWith('.mp3')) {
    e.respondWith(caches.open('sv-voices').then(c => c.match(req).then(hit => hit || fetch(req).then(r => { if (r.ok) c.put(req, r.clone()); return r; }))));
    return;
  }
  e.respondWith(saved(req).then(hit => hit || fetch(req)));
});
