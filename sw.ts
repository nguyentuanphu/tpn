// The shared worker library also describes non-service workers. Check the host before using its lifecycle API.
function isServiceWorker(scope: typeof globalThis): scope is typeof globalThis & ServiceWorkerGlobalScope {
  return 'clients' in scope;
}
if (!isServiceWorker(self)) throw new Error('Service worker context required');
const worker = self;
// Offline support: cache the whole game on first visit, then serve from the cache.
// Bump VERSION whenever files change so devices pick up the update. Updates only replace the game's files:
// saved progress (localStorage, IndexedDB, and the 'sv-save' copy) and the voice pack are never deleted.
const VERSION = 'sv-2026-11-02-v1.07';
const FILES = [
  // (v1.08, Release) the files the v1.08 helpers added, all offline (checks offline and swupdate)
  'js/areas.js', 'js/art/emoji108b.js', 'js/art/frienditems.js', 'js/art/games108b.js', 'js/art/handson.js', 'js/art/lumi.js', 'js/art/maths3.js', 'js/art/money3.js', 'js/art/s2au.js',
  'js/art/s2vn.js', 'js/art/science2.js', 'js/art/tiengviet2.js', 'js/content/chapter10.js', 'js/content/chapter11.js', 'js/content/chapter12.js', 'js/content/chapter4.js', 'js/content/chapter5.js',
  'js/content/chapter6.js', 'js/content/chapter7.js', 'js/content/chapter8.js', 'js/content/chapter9.js', 'js/content/chapterfinale.js', 'js/content/chapterkit.js', 'js/content/festgame-ids.js',
  'js/content/festgames108b.js', 'js/content/festseason.js', 'js/content/friendquests.js', 'js/content/gameplace.js', 'js/content/games108b.js', 'js/content/kitfilms.js', 'js/content/learnpaths.js',
  'js/content/lumi.js', 'js/content/releasecal-core.js', 'js/content/releasecal-items.js', 'js/content/releasecal-names.js', 'js/content/releasecal.js', 'js/content/s2au-games.js',
  'js/content/s2au.js', 'js/content/s2aufilms.js', 'js/content/s2vn.js', 'js/content/s2vnfilms.js', 'js/content/subjects.js', 'js/dropspot.js', 'js/friendquest.js', 'js/games/art-pending.js',
  'js/games/games108b-meta.js', 'js/games/games108b.js', 'js/games/handson-meta.js', 'js/games/handson.js', 'js/games/reveal.js', 'js/games/s2au-meta.js', 'js/games/s2au.js', 'js/games/s2vn-meta.js',
  'js/games/s2vn.js', 'js/games/sudoku-core.js', 'js/games/variety.js', 'js/installgift.js', 'js/learnquest.js', 'js/lumi.js', 'js/playtogether.js',
  'js/s2au-region.js', 'js/s2au.js', 'js/s2vn.js', 'js/ui/calendar-news.js', 'js/validate.js', 'js/voicestore.js',
  'js/content/tester-arcades.js', 'js/games/parade-engine.js', 'js/games/arcade-session.js', 'js/games/arcade-board.js', 'js/games/sparkleorchard.js', 'js/games/fruitbar-engine.js', 'js/games/sparklefruitbar.js',
  'js/games/trongnu.js', 'js/games/trongnu-rules.js',
  'js/content/fruit-parade.js', 'js/games/fruitparade.js', 'js/games/fruitparade-core.js', 'js/games/fruitparade-engine.js', 'js/games/fruitparade-session.js', 'js/games/fruitparade-input.js', 'js/games/fruitparade-style.js',
  'js/games/cacuangua.js', 'js/games/cacuangua-core.js', 'js/games/horse-session.js','js/games/oanquan-core.js','js/games/oanquan-online.js','js/content/family-quiz.js','js/family-quiz-store.js','js/family-quiz-editor.js','js/games/familyquiz-core.js','js/games/familyquiz.js','js/games/board-agreement.js','js/games/tug-core.js','js/games/tug-session.js','js/games/tug-online.js','js/games/shared-board-session.js','js/games/snakes-core.js','js/games/snakes.js', 'js/games/multiplayer-foundations.js', 'js/games/pending-vietnam.js', 'js/games/folk-court.js', 'js/games/folk-court-rules.js',
  './', 'index.html', 'manifest.webmanifest', 'css/style.css',
  'vendor/three.module.js', 'vendor/peerjs.min.js', 'vendor/RoomEnvironment.js', 'css/fonts.css',
  'fonts/Fredoka-latin-500.woff2', 'fonts/Fredoka-latin-ext-500.woff2', 'fonts/Baloo2-latin-600.woff2', 'fonts/Baloo2-latin-ext-600.woff2', 'fonts/Baloo2-vietnamese-600.woff2',
  // (v1.07 split) the parts of js/main.js
  'js/main/online-games.js', 'js/main/friends.js', 'js/main/talks.js', 'js/main/quests.js', 'js/main/interactables.js', 'js/main/hero-events.js', 'js/main/talking.js', 'js/main/layout.js', 'js/main/later.js',
  'js/main.js', 'js/rideview.js', 'js/render-recovery.js', 'js/gpu.js', 'js/launch.js', 'js/screencapture.js', 'js/familydevices.js', 'js/family-backup.js', 'js/util.js', 'js/state.js', 'js/i18n.js', 'js/money.js', 'js/audio.js', 'js/voice.js', 'js/hanoi-pack.js', 'js/content/hanoi-pack-info.js', 'js/gfx.js',
  'js/world.js', 'js/world/places.js', 'js/world/ground.js', 'js/world/sites.js', 'js/world/paint.js', 'js/world/reshape.js', 'js/avatar.js', 'js/player.js', 'js/input.js', 'js/net.js', 'js/mictest.js', 'js/hud.js', 'js/explain.js', 'js/ui.js', 'js/ui-settings.js', 'js/data.js',
  // (v1.07 split-code) the parts of js/ui.js
  'js/ui/common.js', 'js/ui/grownups.js', 'js/ui/title.js', 'js/ui/profile.js', 'js/ui/quick.js', 'js/ui/festivals-ui.js',
  'js/ui/pad.js', 'js/ui/pad-map.js', 'js/ui/pad-album.js', 'js/ui/shops.js', 'js/ui/hub.js',
  // (v1.07 split-code) the parts of js/art.js
  'js/art/kit.js', 'js/art/pad-and-games.js', 'js/art/howto-tales.js', 'js/art/people-food.js', 'js/art/round30.js',
  'js/art/things-money.js', 'js/art/r90-audits.js', 'js/art/learning.js', 'js/art/english.js', 'js/art/lookup.js',
  'js/farm.js', 'js/places.js', 'js/story.js', 'js/recorder.js', 'js/secrets.js', 'js/credits.js', 'js/howto.js', 'js/howto-player.js', 'js/howto-registry.js', 'js/howto-data.js', 'js/howto-data2.js', 'js/chat.js', 'js/chat-player.js',
  'js/listen.js', 'js/install.js', 'js/gather.js', 'js/trade.js', 'js/asia.js', 'js/heritage.js', 'js/pets.js', 'js/ferry.js', 'js/passport.js', 'js/festivals.js', 'js/weather.js', 'js/fun.js', 'js/learn.js', 'js/packhash.js', 'js/voice-fragments.js', 'js/showcase.js', 'js/games/music.js', 'js/icons.js', 'js/words2.js', 'js/games/asia.js', 'js/houses.js', 'js/commands.js', 'js/extras.js', 'js/town.js', 'js/powerlines.js', 'js/viwords.js', 'js/vehicles.js', 'js/traffic.js', 'js/film.js', 'js/content/films.js', 'js/content/talefilms.js', 'js/content/films/kit.js', 'js/content/film-looks.js', 'js/content/films/rongtien.js', 'js/content/films/caytre.js', 'js/content/films/tamcam.js', 'js/content/films/sodua.js', 'js/content/films/thachsanh.js', 'js/content/films/chucuoi.js', 'js/content/films/cockien.js', 'js/content/films/vusua.js', 'js/content/films/baluoiriu.js', 'js/content/films/quabau.js', 'js/content/films/thayboi.js', 'js/content/films/nhacmeo.js', 'js/content/films/ongtao.js', 'js/content/films/cachep.js', 'js/content/films/sontinh.js', 'js/content/films/rainbowserpent.js', 'js/content/films/emu.js', 'js/content/films/dotkangaroo.js', 'js/content/films/birdcolours.js', 'js/content/films/magicpudding.js', 'js/content/films/tiddalik.js', 'js/content/films/greatrace.js', 'js/content/films/maliang.js', 'js/content/films/weaver.js', 'js/content/films/nian.js', 'js/content/films/kongrong.js', 'js/content/films/change.js', 'js/content/films/crow.js', 'js/content/films/lionrabbit.js', 'js/content/films/ganesha.js', 'js/content/films/bluejackal.js', 'js/content/films/elephantmice.js', 'js/content/films/monkey.js', 'js/lanterns.js', 'js/companion.js', 'js/dinh.js', 'js/content/chapters.js', 'js/content/chapter2hanoi.js', 'js/content/chapter2props.js', 'js/content/chapter2films.js', 'js/content/chapter2text.js', 'js/yard.js', 'js/content/yard.js', 'js/content/map.js', 'js/openspot.js', 'js/handpad.js', 'js/kidplay.js', 'js/hoilang.js', 'js/surprises.js', 'js/parents.js', 'js/content/hoilang.js', 'js/content/surprises.js', 'js/content/parents.js', 'js/lunar.js', 'js/content/festcal.js', 'js/content/releases.js', 'js/emojiswap.js', 'js/regions.js', 'js/words.js', 'js/games/folk.js', 'js/games/folk2.js', 'js/roads.js', 'js/signposts.js', 'js/nametags.js', 'js/cities.js', 'js/games/cities.js', 'js/chatter.js', 'js/tales.js', 'js/tale-loader.js', 'js/talesdata.js', 'js/tales-content.js', 'js/kite.js', 'js/relay.js', 'js/hawkers.js', 'js/snacks.js', 'js/animals.js', 'js/homes.js', 'js/art.js', 'js/suburbs.js', 'js/games/learning.js', 'js/games/all.js', 'js/games/catalog.js', 'js/games/learning-meta.js', 'js/games/hocvui-meta.js', 'js/content/hocvui.js', 'js/cartoon.js', 'js/games/tienlen.js', 'js/games/tienlenrules.js', 'js/realworld.js', 'js/symbols.js', 'js/games/more.js', 'js/regionsites.js', 'js/vnfun.js', 'js/custom.js', 'js/content/festival-visibility.js', 'js/festival-live.js', 'content/custom.json', 'js/build.js', 'js/worldedit.js', 'js/content/build-types.js', 'js/studio-position.js', 'js/folkshow.js', 'js/ads.js', 'js/solids.js', 'js/players.js', 'js/packbar.js', 'js/roomcode.js', 'js/photos.js', 'js/netmsg.js', 'js/lotus.js', 'js/worldcache.js', 'js/worldmemo.js', 'js/core/ids.js', 'js/core/events.js', 'js/core/rng.js', 'js/core/geo.js', 'js/placebook.js', 'js/familycards.js', 'js/home-decor-models.js', 'js/myhouse.js', 'js/popups.js', 'js/vendors.js', 'js/games/registry.js', 'js/content/rules.js', 'js/report.js', 'js/website.js', 'js/printpage.js', 'js/coop.js', 'js/netgames.js', 'js/twinchests.js', 'js/claims.js', 'js/simple.js', 'js/songs.js', 'js/content/songs.js', 'js/content/activities.js', 'js/content/install-state.js', 'js/content/unlocks.js', 'js/content/secondset.js', 'js/festdecor.js', 'js/festhunt.js', 'js/content/festhunt.js', 'js/seethrough.js', 'js/content/chapter3sydney.js', 'js/content/chapter3props.js', 'js/content/chapter3films.js', 'js/content/chapter3text.js', 'js/voicepack.js', 'js/voice-index.js', 'js/autoplay.js', 'js/content/autoplay.js', 'js/testergate.js', 'js/tester.js', 'js/tester-float.js', 'js/travel-stops.js', 'js/tester-detection.js', 'js/report-outbox.js', 'js/testerrewards.js', 'js/content/tester.js', 'js/plots.js', 'js/reeds.js', 'js/scrollhelp.js', 'js/chipinfo.js', 'js/soundsheet.js', 'js/content/familymissions.js', 'js/villagertalk.js', 'js/school.js', 'js/content/school-place.js', 'js/content/companions.js', 'js/content/villagerlines.js', 'js/owlguide.js', 'js/pricetags.js', 'js/content/owllessons.js', 'js/jobs.js', 'js/content/jobs.js', 'js/wayfind.js', 'js/feel.js', 'js/stickers.js', 'js/stickerfx.js', 'js/content/stickers.js', 'js/adventure.js', 'js/content/adventures.js', 'js/dayplan.js', 'js/animalhomes.js', 'js/keepcopy.js', 'js/content/devname.js',
  'js/content/savecopy.js', 'js/content/familycode.js', 'js/games/money.js', 'js/games/moneylogic.js', 'js/games/frame.js', 'js/games/playwatch.js', 'js/games/thinking.js', 'js/games/bigthinkers.js', 'js/games/bigthinkers2.js', 'js/games/science.js', 'js/games/tiengviet.js', 'js/games/english.js', 'js/games/english-meta.js', 'js/content/english.js', 'js/englishmode.js', 'js/games/talkgames.js', 'js/games/drawing.js', 'js/games/drawshape.js', 'js/games/strategy.js', 'js/games/goat.js', 'js/games/goat-core.js', 'js/games/goat-art.js', 'js/games/vietnam.js', 'js/games/vietnam2.js', 'js/games/nature2.js', 'js/games/animals2.js', 'js/games/me2.js', 'js/games/thinking2.js', 'js/games/music2.js', 'js/games/words2.js', 'js/games/numbers2.js', 'js/games/shapes2.js', 'js/games/places2.js', 'js/games/outside.js', 'js/games/money2.js', 'js/games/reading2.js', 'js/games/market.js', 'js/games/farmgames.js',
  'js/management-telemetry.js', 'js/core/reporting-policy.js', 'js/games/drawing2.js', 'js/games/crafts.js', 'js/games/art-pad.js',
  'js/shop.js', 'js/content/shop.js', 'js/boxes.js', 'js/content/boxes.js', // (round S: the clothes shop, mystery boxes, rankings, collectibles)
  'js/games/readingmenu.js', 'js/games/reading.js', 'js/content/reading.js', 'js/games/storyhelp.js', 'js/content/storyhelp.js', // (Play reading trial)
  'sounds/animals/cow.mp3', 'sounds/animals/sheep.mp3', 'sounds/animals/pig.mp3', 'sounds/animals/dog.mp3', 'sounds/animals/cat.mp3', // (owner, 17 Oct AEDT: real animal voices)
  'sounds/animals/duck.mp3', 'sounds/animals/hen.mp3', 'sounds/animals/horse.mp3', 'sounds/animals/frog.mp3', 'sounds/animals/owl.mp3',
  'js/notify.js', 'js/content/notify.js', 'js/art/notify.js', // (v1.08 notifications)
  // (v1.08 fixes) the new games of this round, their pictures (js/art/games108.js, loaded after the start) and guides
  'js/art/companion-hats.js', 'js/art/games108.js', 'js/content/science-places.js', 'js/content/tiengviet2.js',
  'js/games/maths-kit.js', 'js/games/maths3.js', 'js/games/maths3-meta.js', 'js/games/maths4.js',
  'js/games/money3.js', 'js/games/money3-meta.js', 'js/games/moneylogic3.js',
  'js/games/science2.js', 'js/games/science2-meta.js', 'js/games/tiengviet2.js', 'js/games/tiengviet2-meta.js',
  // (v1.08b friends) the four new friends: their data, the choosing screens and their pictures
  'js/content/friends.js', 'js/ui/friends-row.js', 'js/ui/friends-ui.js', 'js/friend-model.js', 'js/friend-view.js',
  'vendor/GLTFLoader.js', 'vendor/BufferGeometryUtils.js', 'vendor/SkeletonUtils.js', 'vendor/meshopt_decoder.module.js',
  'models/finn.glb', 'models/sol.glb', 'models/clara.glb', 'models/lumi.glb',
  'models/finn-hd.glb', 'models/sol-hd.glb', 'models/clara-hd.glb', 'models/lumi-hd.glb', // (v1.08e faces part 2) high-detail friends
  'js/crowd-models.js', // (v1.08e crowds) the gallery neighbours worn by crowd people near a child
  // (written out one by one: tools/bundle.mts reads the quoted names of the list)
  'icons/friends/finn-f.webp', 'icons/friends/finn-q.webp', 'icons/friends/finn-s.webp', 'icons/friends/finn-face.webp',
  'icons/friends/sol-f.webp', 'icons/friends/sol-q.webp', 'icons/friends/sol-s.webp', 'icons/friends/sol-face.webp',
  'icons/friends/clara-f.webp', 'icons/friends/clara-q.webp', 'icons/friends/clara-s.webp', 'icons/friends/clara-face.webp',
  'icons/friends/lumi-f.webp', 'icons/friends/lumi-q.webp', 'icons/friends/lumi-s.webp', 'icons/friends/lumi-face.webp',
  'js/vehicle-models.js', // (v1.08e vehicles) the vehicles models put in place (js/vehicles.ts wear)
  'js/modelkit.js', // (v1.08e) the shared loader of the Blender models of the world (models/world/*.glb load near the child)
  'js/creatures.js', // (v1.08e creatures) the Blender models of the animals, pets and companions: asked for near the child
  'models/world/boat-ferry.glb', 'models/world/boat-raft.glb', 'models/world/creature-bear.glb', 'models/world/creature-buffalo.glb', 'models/world/creature-bull.glb', 'models/world/creature-bunny.glb', 'models/world/creature-calf.glb', 'models/world/creature-chicken.glb', 'models/world/creature-cow.glb', 'models/world/creature-crane.glb', 'models/world/creature-dragon.glb', 'models/world/creature-elephant.glb', 'models/world/creature-emu.glb', 'models/world/creature-firefly.glb', 'models/world/creature-joey.glb', 'models/world/creature-kitty.glb', 'models/world/creature-koala.glb', 'models/world/creature-panda.glb', 'models/world/creature-peacock.glb', 'models/world/creature-penguin.glb', 'models/world/creature-pig.glb', 'models/world/creature-platypus.glb', 'models/world/creature-puppy.glb', 'models/world/creature-sheep.glb', 'models/world/creature-turtle.glb', 'models/world/creature-unicorn.glb', 'models/world/veh-baGac.glb', 'models/world/veh-bmx.glb', 'models/world/veh-bus.glb', 'models/world/veh-busAU.glb', 'models/world/veh-coach.glb', 'models/world/veh-cub.glb', 'models/world/veh-dream.glb', 'models/world/veh-dumpTruck.glb', 'models/world/veh-excavator.glb', 'models/world/veh-honda67.glb', 'models/world/veh-kidsBike.glb', 'models/world/veh-miniBike.glb', 'models/world/veh-packBike.glb', 'models/world/veh-postie.glb', 'models/world/veh-quadBike.glb', 'models/world/veh-roadBike.glb', 'models/world/veh-roadster.glb', 'models/world/veh-scooter.glb', 'models/world/veh-sedan.glb', 'models/world/veh-suv.glb', 'models/world/veh-tamTruck.glb', 'models/world/veh-taxi.glb', 'models/world/veh-touristCart.glb', 'models/world/veh-trailBike.glb', 'models/world/veh-tram.glb', 'models/world/veh-tramModern.glb', 'models/world/veh-ute.glb', 'models/world/veh-xichlo.glb',
  'js/offlinelevels.js', // (v1.08c voices) the offline levels in Grown-ups, loaded when Grown-ups opens
  'icons/icon-32.png', 'icons/icon-180.png', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/launch/valley-portrait.jpg', 'icons/launch/valley-landscape.jpg'
];
// (Analytics & Infra, 10 Oct, owner: "can't even play offline when there is no internet") the newest copy when the
// network answers quickly, otherwise the saved copy after a short wait: a connection that never answers (Wi-Fi with no
// internet, weak phone signal) must never keep the game from starting. The network's answer still refreshes the copy.
const QUICK = 1500;
// (owner, 30 Oct 2026 AEDT: "within 2 to 3 s something light must show") the start page waits at most a second for storage
const NAV_QUICK = 1000, NAV_LIMIT = 6000;
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
worker.addEventListener('activate', (e: ExtendableEvent) => { e.waitUntil(Promise.resolve(worker.registration.navigationPreload?.enable()).catch(() => { })); e.waitUntil(caches.keys().then(keys => { const old = keys.filter(k => k !== 'sv-family' && /^sv-20/.test(k) && k !== VERSION); const keep = old.slice(-1); return Promise.all(old.filter(k => !keep.includes(k)).map(k => caches.delete(k))); }).then(() => worker.clients.claim())); });
// (owner, 31 Oct 2026 AEDT: the installed app stayed white for about 30 s) the voices are kept as a few big bundles with
// one index (js/voicestore.ts); a recording is cut out of its bundle here. The index is read once and again whenever the
// game says it changed; the last bundles read are kept in memory for the next lines.
const STORE_DIRS: Record<string, string> = { 'sv-voices': 'voices/__store/', 'sv-voices-fpt-leminh-v1': 'voices/fpt-leminh-v1/__store/' };
type StoreIndex = { v: 1, next: number, files: Record<string, [number, number, number]> };
const storeIndexes = new Map<string, Promise<StoreIndex | null>>(), bundles = new Map<string, Blob>();
const storeIndex = (name: string) => { let p = storeIndexes.get(name); if (!p) { p = caches.open(name).then(c => c.match(new URL(STORE_DIRS[name] + 'index.json', worker.registration.scope).href)).then(r => r ? r.json() : null).catch(() => null); storeIndexes.set(name, p); } return p; };
async function fromStore(name: string, url: URL): Promise<Response | null> {
  const ix = await storeIndex(name), f = ix && ix.files[url.pathname.replace(/^\//, '') + url.search]; if (!f) return null;
  const key = name + ':' + f[0]; let blob = bundles.get(key);
  if (!blob) { const r = await (await caches.open(name)).match(new URL(STORE_DIRS[name] + 'b' + f[0] + '.bin', worker.registration.scope).href); if (!r) return null; blob = await r.blob(); bundles.set(key, blob); if (bundles.size > 3) bundles.delete(bundles.keys().next().value as string); }
  return new Response(blob.slice(f[1], f[1] + f[2], 'audio/mpeg'), { headers: { 'Content-Type': 'audio/mpeg' } });
}
worker.addEventListener('message', (e: ExtendableMessageEvent) => { if (e.data?.type === 'SV_VOICE_STORE') { storeIndexes.delete(String(e.data.name)); for (const k of [...bundles.keys()]) if (k.startsWith(String(e.data.name) + ':')) bundles.delete(k); } });
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
  // (v1.08e faces, part 2) a friend's high-detail model (models/<id>-hd.glb, about 0.5 MB): from the saved copy, or kept the
  // first time it loads (also when the offline list above has not finished saving it)
  // (v1.08e villagers) the villagers' models (about 400 KB each, 25 of them: 10 MB) are not in the list either: each is
  // kept the first time a child meets that villager, so the ones a child has met are there offline
  if (/\/models\/([a-z]+-hd|villager-[a-z-]+)\.glb$/.test(url.pathname)) { e.respondWith(saved(req).then(hit => hit || fetch(req).then(r => { if (r.ok) e.waitUntil(caches.open(VERSION).then(c => c.put(req, r.clone()))); return r; }))); return; }
  if (url.pathname.includes('/bundle/')) { e.respondWith(saved(req).then(hit => hit || fetch(req).then(r => { if (r.ok) e.waitUntil(caches.open(VERSION).then(c => c.put(req, r.clone()))); return r; }))); return; }
  // the voice pack: kept in its own cache (it survives game updates) and stored as lines are played
  if(url.pathname.startsWith('/voices/fpt-leminh-v1/')){
    e.respondWith(caches.open('sv-voices-fpt-leminh-v1').then(async c=>{
      if(url.pathname.endsWith('/manifest.json')){try{const r=await fetch(req);if(r.ok){e.waitUntil(c.put(req,r.clone()));return r;}}catch{}const saved=await c.match(req);return saved||new Response('Offline',{status:503});}
      return(await fromStore('sv-voices-fpt-leminh-v1',url))||(await c.match(req))||fetch(req); // The voice service verifies the checksum before storing MP3s.
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
  if (url.pathname.includes('/voices/') && /\.(mp3|opus)$/.test(url.pathname)) { // (v1.08b platform: Opus copies too)
    // (31 Oct 2026 AEDT) from its bundle, else a recording kept the old way, else the internet (the game keeps it, in a bundle)
    e.respondWith(fromStore('sv-voices', url).then(hit => hit || caches.open('sv-voices').then(c => c.match(req)).then(hit2 => hit2 || fetch(req))));
    return;
  }
  // (owner, 30 Oct AEDT: a white screen for about 28 s when the Home Screen app first opened after v1.03) while an
  // update is saving every file, the saved page can be slow to come out of storage: after a short wait the page comes
  // from the internet instead; offline, the saved page still answers whenever storage is ready
  // (owner, 30 Oct 2026 AEDT: "Safari couldn't open the page because the server stopped responding" in the installed app,
  // which plays offline) the game's own start page never ends on that error: the internet gets at most 6 s, and when it
  // fails, is slow or answers with an error, the saved game opens (also when the address carries something extra); a saved
  // page that came through a redirect is passed on clean, as Safari refuses a redirected page from here
  if (req.mode === 'navigate') {
    const root = new URL('./', worker.location.href), game = url.pathname === root.pathname || url.pathname === root.pathname + 'index.html';
    const clean = (r: Response | undefined) => r && r.redirected ? r.blob().then(b => new Response(b, { status: r.status, statusText: r.statusText, headers: r.headers })) : Promise.resolve(r);
    const shell = () => saved(new Request(root.href)).then(r => r || saved(new Request(root.href + 'index.html')));
    e.respondWith(new Promise<Response>(done => {
      let over = false, net: Promise<Response> | null = null;
      const give = (r: Response) => { if (!over) { over = true; done(r); } };
      // (owner, 31 Oct 2026 AEDT: the installed app stays white for about 30 s) the browser asks the website for the start
      // page while this worker is still starting (navigation preload, switched on below), so the answer is already on its way
      const ask = () => Promise.resolve(e.preloadResponse).then(r => r || fetch(req), () => fetch(req));
      const fromNet = () => net || (net = Promise.race([ask(), new Promise<Response>((_, no) => setTimeout(() => no(new Error('slow')), NAV_LIMIT))]));
      const fallback = () => (game ? shell().then(clean) : Promise.resolve(undefined)).then(r => give(r || Response.error()), () => give(Response.error()));
      const t = setTimeout(() => fromNet().then(r => { if (r.ok) give(r); }, () => { }), NAV_QUICK);
      saved(req).catch(() => undefined).then(clean).then(hit => { clearTimeout(t); if (hit) give(hit); else fromNet().then(r => { if (r.ok || !game) give(r); else fallback(); }, fallback); });
    }));
    return;
  }
  e.respondWith(saved(req).then(hit => hit || fetch(req)));
});
// (v1.08 notifications, owner plan docs/plans/push-notifications.md) push notifications for grown-ups. The website sends
// only which kinds are due and the texts that are the same for every family; the lines about the children (summary,
// balance, game of the week, achievements) are this device's own, kept by the game in the cache "sv-notify" (js/notify.ts).
// The joining below is js/content/notify.ts compose() (a service worker cannot import modules); the check pushnotify
// compares the two. A tap opens the game on the right screen (?open=), or tells the game that is already open.
type PushPayload = { v: 1, kinds: string[], title: string, lead?: string, parts: Record<string, string>, open: string, tag: string, lang: 'en' | 'vi' };
const PUSH_FALLBACK: Record<string, [string, string]> = {
  gotw: ['A game picked for this week is waiting in the valley.', 'Một trò chơi được chọn cho tuần này đang chờ trong thung lũng.'],
  weekly: ['Open Grown-ups to see this week’s play report.', 'Mở mục Phụ huynh để xem báo cáo chơi tuần này.'],
  balance: ['Try a mix of games this week: maths, words, stories and music.', 'Tuần này thử nhiều loại trò: toán, chữ, truyện và âm nhạc.'],
  invite: ['A friend’s family would like to play together. Open the game to say yes or no.', 'Gia đình một người bạn muốn cùng chơi. Mở trò chơi để đồng ý hoặc từ chối.'],
  tester: ['A problem you reported is fixed in the newest version. Please try it again.', 'Một lỗi bạn báo đã được sửa trong bản mới nhất. Bạn thử lại nhé.'],
};
const PUSH_OPENS = ['new', 'gotw', 'weekly', 'balance', 'achieve', 'word', 'bedtime', 'life', 'festival', 'event', 'invite', 'tester'];
function pushCompose(p: PushPayload, local: Record<string, { en: string, vi: string } | string> | null) {
  const lang = p.lang === 'vi' ? 'vi' : 'en', lines: string[] = [];
  if (p.lead) lines.push(p.lead);
  for (const k of p.kinds) { if ((k === 'festival' || k === 'event') && p.lead) continue; const own = local && local[k] as { en: string, vi: string }; const t = (own && own[lang]) || p.parts[k] || (PUSH_FALLBACK[k] && PUSH_FALLBACK[k][lang === 'vi' ? 1 : 0]); if (t) lines.push(t); }
  return { title: p.title, body: lines.join('\n').slice(0, 600), open: p.open, tag: p.tag };
}
const pushLocal = () => caches.open('sv-notify').then(c => c.match(new URL('__sv-notify.json', worker.registration.scope).href)).then(r => r ? r.json() : null).catch(() => null);
worker.addEventListener('push', (e: PushEvent) => {
  let p: PushPayload | null = null; try { p = e.data ? e.data.json() : null; } catch { p = null; }
  if (!p || p.v !== 1 || !Array.isArray(p.kinds)) return;
  e.waitUntil(pushLocal().then(local => {
    const m = pushCompose(p, local), game = p.kinds.includes('gotw') && local && typeof local.gotwId === 'string' ? local.gotwId : '';
    return worker.registration.showNotification(m.title, { body: m.body, tag: m.tag, icon: 'icons/icon-192.png', badge: 'icons/icon-192.png', lang: p.lang, data: { open: m.open, game, kinds: p.kinds } });
  }));
});
worker.addEventListener('notificationclick', (e: NotificationEvent) => {
  e.notification.close();
  const d = e.notification.data || {}, open = PUSH_OPENS.includes(d.open) ? d.open : 'home', game = /^[\w-]{1,40}$/.test(d.game || '') ? d.game : '';
  const u = new URL('./', worker.registration.scope); u.searchParams.set('open', open); if (open === 'gotw' && game) u.searchParams.set('game', game);
  e.waitUntil(worker.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
    const c = list.find(x => new URL(x.url).pathname === new URL(worker.registration.scope).pathname) as WindowClient | undefined;
    if (c) { c.postMessage({ type: 'SV_NOTIFY_OPEN', open, game }); return c.focus().then(() => undefined); }
    return worker.clients.openWindow(u.href).then(() => undefined);
  }));
});
