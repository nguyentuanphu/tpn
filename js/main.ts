import { testerArcadeAvailable } from './content/tester-arcades.js';
import { fruitParadeAvailable } from './content/fruit-parade.js';
// Sparkle Valley: boot, the game loop, split-screen, NPCs, quests and rewards.
import './emojiswap.js'; // (first: no phone emoji on the page or on any canvas)
import { THREE, sprite, P, merge, toonVC } from './gfx.js';
import { createSeeThrough } from './seethrough.js';
import { withRideView } from './rideview.js';
import { RoomEnvironment } from '../vendor/RoomEnvironment.js';
import { settings, saveSettings, saveProfiles, farm, profiles, claimTab } from './state.js';
import { T, nm, onLang, registerName } from './i18n.js';
import { say, hush, loadClips, setVoiceGenders } from './voice.js';
import { SFX, Music, ac } from './audio.js';
import { ICONS } from './icons.js';
import { openSongs } from './songs.js';
import { songsFor, VN_AREAS, familySongs } from './content/songs.js';
import { fmt } from './money.js';
import { el, esc, $, dist2, pick, wait, clamp } from './util.js';
import { createWorld, levelUnderBuildings, widenFlatLand, paintMap, paintWater, heightAt, regionAt, REGION_NAMES, MARKET, CHINA, INDIA, SHRINES, TOWERS, LEAFIES, VILLAGE, HOME, PLAYGROUND, REVEAL_R, WATER, PLATEAU, TOWN, AUSSIE, LAKE, ULURU, HALF, STUDIO_ON_MAP, PARKED } from './world.js';
import { studioPosition } from './studio-position.js';
import { landmarkAt, MAP_VERSION, onThisMap, rowSlot } from './content/map.js';
import { buildAvatar, nameAvatar, applyNpcFaces, buildOwl, buildGourd, avatarURL, OUTLINED, showStill } from './avatar.js';
import { Hero } from './player.js';
import { Hud, fogMapFor, EMOTES } from './hud.js';
import { pads, initInput } from './input.js';
import { Net, MAX_ROOM, ROOM_LEN, okPub } from './net.js';
import { showTitle, showWho, dialog, dialogHooks, reward, openPad, openCooking, openShop, toast, modal, openGrownups } from './ui.js';
import { holdButton } from './popups.js';
import { pic } from './art.js';
import { openChat, personaByName, PERSONAS } from './chat.js';
import { voiceCommand, voiceControlOn } from './commands.js';
import { ITEMS, RECIPES, GATHER, STICKERS, QUESTS, dishInfo } from './data.js';
import { openGame, gameOpen, GAMES } from './games/frame.js';
import { gameInfo } from './content/activities.js';
const gameInfoAge = id => { try { return gameInfo(id).ageMin; } catch (e) { return 0; } };
import './games/all.js'; // every mini-game (js/games/all.js)
import { openHowTo } from './howto.js';
import { createFarm, jobProgress, ensureJobs } from './farm.js';
import { createPlaces } from './places.js';
import { createTown } from './town.js';
import { createRegions, LANDMARKS } from './regions.js';
import { createGathering } from './gather.js';
import { tickAnimals } from './animals.js';
import { createAsia } from './asia.js';
import { createHeritage } from './heritage.js';
import { createPets } from './pets.js';
import { createFerries } from './ferry.js';
import { createPassport } from './passport.js';
import { createFestivals } from './festivals.js';
import { createWeather } from './weather.js';
import { createFun, confetti } from './fun.js';
import { createLearning } from './learn.js';
import { createShowcase } from './showcase.js';
import { createRoads, plantRoadside, createCrossings } from './roads.js';
import { createSignposts } from './signposts.js';
import { createNameTags } from './nametags.js';
import { createTraffic } from './traffic.js';
import { RELEASES } from './content/releases.js';
import { releaseNew, featureOn, releaseOn, liveRule, onLive, keptOn, markTried, triedFromSave, setPlayers, MONEY_GAMES } from './custom.js';
import { cachedCanvas } from './worldcache.js';
import { events } from './core/events.js';
import { createPlaceBook } from './placebook.js';
import { createFamilyCards } from './familycards.js';
import { attach as attachStickers } from './stickers.js'; // the sticker book (chat B, 16 Oct): give(id), has(id), count()
import { createMyHouse } from './myhouse.js';
import { createReport, addMinute } from './report.js';
import { createCoop } from './coop.js';
import { createTwinChests } from './twinchests.js';
import { createClaims } from './claims.js';
import { createNetGames, onlineDef, ONLINE_GAMES } from './netgames.js';
import { createSimple, wantsSimple } from './simple.js';
import { id as makeId } from './core/ids.js';
import { createCities } from './cities.js';
import { createChatter, LINES as CHAT_LINES } from './chatter.js';
import { createKites } from './kite.js';
import { createHawkers } from './hawkers.js';
import { createSuburbs } from './suburbs.js';
import { createPlots } from './plots.js';
import { createReeds } from './reeds.js';
import { createSymbols, regionLabel } from './symbols.js';
import { createRegionSites } from './regionsites.js';
import { createVnFun } from './vnfun.js';
import { createLotus } from './lotus.js';
import { openTheatre } from './tales.js';
import { addFamilyBuildings, applyWorldEdits } from './worldedit.js';
import { buildPowerLines } from './powerlines.js';
import { CUSTOM } from './custom.js';
import { createFolkShow } from './folkshow.js';
import { createAds } from './ads.js';
import { buildSolids, solidCircleHit } from './solids.js';
import { startCounting, countPlay, watchHero, noteReload } from './players.js';
import { startPackBar } from './packbar.js';
import { codeHTML, bindCode, padHTML, boxHTML, animalSay } from './roomcode.js';
// the family's defaults from Sparkle Studio: applied once each time they change there (a grown-up can still change
// them on the device afterwards)
// (r81, owner 17 Oct AEDT) Studio's Defaults are live: applied again as soon as the website's answer brings new ones
{ const packDefaults = () => { const D = CUSTOM.defaults, sig = D ? JSON.stringify(D) : '';
  if (D && typeof D === 'object' && settings.packDefaults !== sig) {
    const ok = { restMins: v => +v >= 0 && +v <= 120 && String(+v), lang: v => ['en', 'vi'].includes(v) && v, currency: v => ['AUD', 'VND'].includes(v) && v, bilingual: v => typeof v === 'boolean' && { v }, captions: v => typeof v === 'boolean' && { v }, calm: v => typeof v === 'boolean' && { v }, music: v => typeof v === 'boolean' && { v }, textSize: v => [0, 1, 2].includes(+v) && { v: +v } };
    for (const [k, f] of Object.entries(ok)) if (k in D) { const r = f(D[k]); if (r !== false && r != null) settings[k] = typeof r === 'object' ? r.v : r; }
    if (['AUD', 'VND'].includes(D.currency)) settings.curPinned = true; // (round S) a family's own pick stops it following the language
    settings.packDefaults = sig; saveSettings();
  } }; packDefaults(); onLive(packDefaults); }
import { setupTrading, openTrade } from './trade.js';
import { createSecrets, SECRETS } from './secrets.js';
import { PROLOGUE, showStory, storyCheck, showQuestTale, QUEST_TALES } from './story.js';
import { openWardrobe, openGamesHub, openQuick, nextGameAfter } from './ui.js';
// (owner point 10) this page is the game: it claims the tab, so an older game tab stops saving (js/state.js)
claimTab();

// ---------- renderer & world ----------
// (battery round, owner 12 Oct AEDT) Graphics: Fast, Auto, Pretty (60 frames a second) and Pretty+ ('max': the same
// picture as Pretty, drawn as fast as the screen goes)
const quality = settings.quality === 'auto' ? ((navigator.hardwareConcurrency || 4) <= 4 || Math.min(screen.width, screen.height) < 500 ? 'low' : 'mid') : settings.quality === 'max' ? 'high' : settings.quality;
// (battery round) the device's everyday graphics chip, not its strongest one: a MacBook's big chip and a phone's top
// speed drain the battery for a picture the children cannot tell apart
const PR_AUTO = 1.5; // (battery round) on Auto the picture is never drawn sharper than 1.5x the screen's pixels
let renderer;
try { renderer = new THREE.WebGLRenderer({ antialias: quality !== 'low', preserveDrawingBuffer: false, powerPreference: 'default' }); }
catch (e) { $('#boot').innerHTML = `<p>${T('Sorry, this device cannot show the 3D world.', 'Xin lỗi, máy này không hiển thị được thế giới 3D.')}</p>`; throw e; }
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, quality === 'low' ? 1.25 : quality === 'high' ? 2 : settings.quality === 'auto' ? PR_AUTO : 1.6));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.NoToneMapping; // flat illustrated colours, exactly as painted
if (quality !== 'low') { renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap; }
document.getElementById('stage').appendChild(renderer.domElement);
// If the phone runs short of memory it can take the 3D picture away (the screen goes white and Safari may reload
// the page). Save at once, show a friendly card, and if the picture does not come back by itself, reload: progress
// is already saved, so the child carries on where they were.
{
  let lostT: ReturnType<typeof setTimeout> | 0 = 0;
  renderer.domElement.addEventListener('webglcontextlost', e => {
    e.preventDefault(); try { G.heroes.forEach(h => { if (h.profile && h.onGround && !h.towerClimb && !h.indoors) { h.profile.pos = { x: +h.lastSafe.x.toFixed(1), z: +h.lastSafe.z.toFixed(1) }; h.profile.posMap = MAP_VERSION; } }); saveProfiles(true); } catch (err) { }
    if (!document.querySelector<HTMLElement>('.ctxlost')) document.body.appendChild(el('div', 'ctxlost', `<div>🌈</div><p>${T('One moment, the valley is coming back…', 'Chờ một chút, thung lũng đang trở lại…')}</p>`));
    clearTimeout(lostT); lostT = setTimeout(() => { noteReload('3D picture lost', G); location.reload(); }, 4000); // (#355: noted for Studio's report)
  });
  renderer.domElement.addEventListener('webglcontextrestored', () => { clearTimeout(lostT); document.querySelectorAll<HTMLElement>('.ctxlost').forEach(e => e.remove()); });
}
const scene = new THREE.Scene();
{ // soft sky light bouncing off everything, so materials look real rather than flat
  const pm = new THREE.PMREMGenerator(renderer); scene.environment = pm.fromScene(new RoomEnvironment(), .04).texture; pm.dispose();
}
// how long each start-up step takes (ms since this file began; tests/run.mjs "perf" and Grown-ups › Advanced read it)
const BOOT0 = performance.now(), bootTimes = { start: Math.round(BOOT0) }, bootMark = k => { bootTimes[k] = Math.round(performance.now() - BOOT0); const steps = ['world', 'people', 'town', 'roads', 'pretraffic', 'traffic', 'things', 'wideland', 'levelled', 'roadside', 'solids', 'shaders', 'ready']; const n = steps.indexOf(k); if (n >= 0) window.svLaunchProgress?.(n + 1, steps.length, T(`Preparing the valley: ${n + 1}/${steps.length}`, `Chuẩn bị thung lũng: ${n + 1}/${steps.length}`)); };
// (round R, faster launch) the title and "Who's playing?" show at once; the valley is built behind them in steps, with a
// breath between steps so the screen keeps answering taps. Pressing Go before it is ready waits a moment (startWhenBuilt).
let framesSeen = 0, framesDone = null; const firstFrames = new Promise(r => { framesDone = r; });
let bootDone = null, booted = false; const bootReady = new Promise<void>(r => { bootDone = () => { booted = true; r(); }; });
const breathe = () => new Promise(r => setTimeout(r, 0));
async function startWhenBuilt(mode, chosen) {
  if (!booted) {
    const w = document.createElement('div'); w.className = 'bootwait'; w.innerHTML = `<div class="spin"></div><p>${T('Getting the valley ready…', 'Đang chuẩn bị thung lũng…')}</p>`;
    document.body.appendChild(w); await bootReady; w.remove();
  }
  startSession(mode, chosen);
}
document.getElementById('boot')?.remove();
showTitle(async () => { await bootReady; showWho((mode, chosen) => startWhenBuilt(mode, chosen)); });
await breathe();
const world = createWorld(scene, quality); bootMark('world'); await breathe();
// the map picture: read back from the device when this build painted it before (js/worldcache.js)
const waterPic = cachedCanvas('water', 256, paintWater, bootReady); waterPic.onReady = () => world.waterMap(waterPic.canvas); // (round T4a) each river's colour and the foam along the shores
const mapPic = cachedCanvas('map', 320, paintMap, bootReady); // (round T: 320 px for the 480 m valley) bootMark('map');
mapPic.onReady = () => { G.fogMaps = {}; }; // (a map shown before the picture was ready is drawn again)
const titleCam = new THREE.PerspectiveCamera(50, 1, .3, 1200);

// (TypeScript, r86) the shared game object: every part main.ts, and the modules it hands G to, add to it. Parts made
// later in the start-up are optional; the modules that add their own part are typed by what main.ts uses of it.
/** a child in the valley (js/player.js), with what the other modules add to it */
type SvHeroT = Hero & { walkTo?: { x: number, z: number, friend?: string, name?: string } | null, _tiredHint?: boolean, _rescuing?: boolean, cancelCarry?: (() => void) | null, indoors?: unknown, view?: string, zoom?: number,
  carry?: unknown, carryIt?: unknown, followId?: string | null, goalAct?: SvItem | null, _dancing?: boolean, _followHop?: number };
type SvAt = (h: SvHeroT, x: number, z: number) => Promise<void>;
/** a window that closes by itself when the children walk away from where it opened */
type SvWalkClose = HTMLElement & { _from?: { x: number, z: number }[], _autoClose?: (() => void) | null };
/** someone walking about who is not a child playing here: a wanderer at home, or a friend online */
type SvPerson = { av: { root: THREE.Object3D, anim?(st: string, t: number, sp: number): void }, tag: THREE.Object3D, pos: THREE.Vector3, yaw: number };
type SvFriend = SvPerson & { id: string, name: string, st: string, look: Record<string, unknown>, photoURL: string, [k: string]: unknown };
/** a friend's game played online: who sits where, and which seat is mine (js/netgames.ts) */
type SvOnline = import('./games/frame.js').GameOnline;
/** something in the valley a child can walk up to and use (a person, a game, a door…) */
interface SvItem { id?: string, x: number, z: number, r?: number, icon?: string, bubble?: string, slot?: string, auto?: boolean,
  y?: number, label?: () => string, short?: () => string, visible?: (h?: SvHeroT) => boolean, act(h: SvHeroT, game?: SvGame): void | Promise<unknown>, npc?: unknown, st?: unknown, [k: string]: unknown }
type SvHome = { hs: { x: number, z: number }, name(): string, people: { name: string }[] };
export interface SvMain {
  actCount: number; events: typeof events; settings: typeof settings; world: typeof world; scene: typeof scene; pads: typeof pads;
  heroes: SvHeroT[]; huds: Hud[]; mode: string; partner: unknown; zoom: number; fogMaps: Record<string, HTMLCanvasElement>;
  regionOf: (string | null)[]; interactables: SvItem[]; gatherState: Record<string, unknown>; bubbles: { s: THREE.Sprite, target: { pos: THREE.Vector3 }, until?: number }[];
  paused?: boolean; lastPlayer?: number; firstFrames?: typeof firstFrames; renderer?: typeof renderer; npcs?: typeof NPCS;
  halfBusy?: (i?: number) => boolean; quality?: typeof quality; battery?: { frameMs: number, titleMs: number, idleMs: number, idleFps: number, [k: string]: unknown };
  // places, people and things of the valley (each made by its own module)
  farm?: ReturnType<typeof createFarm>; ferries?: ReturnType<typeof createFerries>; festivals?: ReturnType<typeof createFestivals>;
  folkShow?: ReturnType<typeof createFolkShow>; hoilang?: ReturnType<typeof import('./hoilang.js').createHoiLang>; kidplay?: ReturnType<typeof createKidPlay>;
  kites?: ReturnType<typeof createKites>; lanterns?: ReturnType<typeof createLanterns>; lotus?: ReturnType<typeof createLotus>;
  nameTags?: ReturnType<typeof createNameTags>; netGames?: ReturnType<typeof createNetGames>; pets?: ReturnType<typeof createPets>;
  placeBook?: ReturnType<typeof createPlaceBook>; places?: ReturnType<typeof createPlaces>; plots?: ReturnType<typeof createPlots>;
  reeds?: ReturnType<typeof createReeds>; report?: ReturnType<typeof createReport>; secrets?: ReturnType<typeof createSecrets>;
  seeThrough?: ReturnType<typeof createSeeThrough>; shop?: ReturnType<typeof import('./shop.js').createShop>; signposts?: ReturnType<typeof createSignposts>;
  simple?: ReturnType<typeof createSimple>; town?: ReturnType<typeof createTown>; weather?: ReturnType<typeof createWeather>;
  yard?: ReturnType<typeof createYard>; chests?: ReturnType<typeof createTwinChests>; claims?: ReturnType<typeof createClaims>;
  coop?: ReturnType<typeof createCoop>; familyCards?: ReturnType<typeof createFamilyCards>; parents?: ReturnType<typeof import('./parents.js').createParents>;
  boxes?: ReturnType<typeof import('./boxes.js').createBoxes>; surprises?: ReturnType<typeof import('./surprises.js').createSurprises>; myHouse?: ReturnType<typeof createMyHouse> | null;
  solidsReady?: ReturnType<typeof buildSolids>;
  // parts other modules add (js/homes.js, js/traffic.js, js/wayfind.js, js/autoplay.js, js/tester.js, js/fun.js, js/chatter.js, js/learn.js…)
  homes?: { list: SvHome[], enter(h: SvHeroT, home: SvHome): void, inside(): SvHome | null, isInside(h: SvHeroT): boolean, [k: string]: unknown }; traffic?: { apply(big: boolean): void, [k: string]: unknown };
  wayfind?: { open(i: number): void, stop(quiet?: boolean): void, [k: string]: unknown }; autoplay?: { running(): boolean, unmount(): void, [k: string]: unknown };
  tester?: { [k: string]: unknown }; tapReact?: (h: SvHeroT, ray: THREE.Raycaster) => boolean; chatGroup?: (...a: unknown[]) => unknown;
  showcaseCam?: (i: number, h: SvHeroT, dt: number) => boolean; TALES?: { id: string, title(): string, [k: string]: unknown }[];
  readTaleNow?: (h: SvHeroT, tale: { id: string }, sync?: unknown) => Promise<unknown>;
  GAME_SPOT?: Record<string, string>; lookUpT?: number; tapTargets?: THREE.Object3D[]; travelling?: boolean;
  // values main.ts shares
  LANDMARKS?: typeof LANDMARKS; STICKERS?: typeof STICKERS; VIEWS?: typeof VIEWS; getViews?: (i: number) => typeof VIEWS; PLACES?: { id?: string, x: number, z: number, [k: string]: unknown }[];
  bootTimes?: Record<string, number>; mapPic?: typeof mapPic; waterPic?: typeof waterPic; parked?: unknown;
  bubbleIcons?: THREE.Sprite[]; wanderers?: (SvPerson & { tx: number, tz: number, wave: number })[]; partners?: Record<string, SvFriend>;
  caroSize?: number; _padRemotes?: number; _familyMsgLive?: boolean; _owlAuto?: boolean; _previewed?: boolean; _reading?: boolean;
  resumedAway?: boolean; valleyGrew?: boolean; closeUp?: number | null;
  // what main.ts does for the screens and the other modules (made further down)
  GAMES_ICON?: (id: string) => string; keep?: (id: string, def?: boolean) => boolean; tried?: (h: SvHeroT | SvHeroT['profile'], id: string) => void;
  toast?: (h: SvHeroT, m: string) => void; dialog?: typeof dialog; hint?: (h: SvHeroT, k: string) => void; hurt?: (h: SvHeroT, n: number) => void;
  stats?: (h: SvHeroT, sp: number) => void; eat?: (h: SvHeroT, id: string) => void; mount?: (h: SvHeroT, b: unknown) => void;
  job?: (kind: string, n?: number, h?: SvHeroT) => void; checkQuests?: (h: SvHeroT) => void; onCooked?: (h: SvHeroT) => void; onGlide?: (h: SvHeroT) => void;
  objective?: (h: SvHeroT) => string; objectiveIcon?: (h: SvHeroT) => string; sayObjective?: (i: number) => void; goToObjective?: (i: number) => Promise<void>;
  kidTalk?: (h: SvHeroT, game: string, name: string, line: string) => void; townTalk?: (h: SvHeroT, who: unknown) => Promise<void>;
  chatWith?: (i: number, pid: string, firstAsk?: boolean) => void; emote?: (i: number, id: string) => void; fx?: (x: number, y: number, z: number, ch: string) => void;
  rescue?: (h: SvHeroT, fainted?: boolean) => Promise<void>; onTowerTop?: (h: SvHeroT, tw: (typeof TOWERS)[number]) => Promise<void>;
  travel?: SvAt; travelTo?: SvAt; landBy?: SvAt; clearSpot?: (x: number, z: number, pad?: number) => [number, number]; goodSpot?: (x: number, z: number) => boolean;
  npcAt?: (id: string) => { x: number, z: number } | undefined; npcNear?: (x: number, z: number, r?: number) => SvItem | null; gameSpot?: (id: string) => SvItem | undefined;
  goToGame?: (i: number, id: string) => void; playGameOnline?: (id: string, level: number, online: SvOnline) => Promise<ReturnType<typeof openGame> extends Promise<infer R> ? R | undefined : unknown>;
  openPad?: (i: number, tab?: string) => void; closePad?: () => void; closePadNow?: () => void; openGamesHub?: (i: number) => void; openQuick?: (i: number) => void;
  openWardrobe?: (i: number) => void; openWhere?: (i: number) => void; openTrade?: (i: number, id?: string) => void; openSongs?: (start?: unknown) => void;
  openSound?: (anchor?: Element) => Promise<unknown>; openPlayTogether?: () => void; mapCard?: () => void; avatarPreview?: (i: number) => void;
  rebuildHero?: (i: number) => void; changePlayer?: () => void; cycleView?: (i: number) => void; setView?: (i: number, id: string) => void;
  zoomBy?: (i: number, f: number, quiet?: boolean) => void; snapshot?: (i: number, max?: number, q?: number) => string; screenFacts?: () => Record<string, unknown>;
  camBlockers?: () => THREE.Object3D[]; camBlockerMats?: () => unknown; farCull?: (now: number) => void; fogMapFor?: (p: { id: string }) => HTMLCanvasElement;
  setAudio?: (kind: string, on: boolean) => void; toggleAudio?: (kind: string) => void; toggleMute?: () => Promise<void>; voiceCommand?: (i: number) => void;
  sideStories?: () => unknown[]; walkAwayClose?: (node: SvWalkClose, close: () => void) => void; barsHTML?: (n: number) => string;
  // friends online
  together?: () => boolean; shareStatus?: () => void; listenFriends?: () => void; autoMeet?: () => void; onNet?: () => void; netTick?: (body: Element) => void;
  netQuality?: (id: string) => ReturnType<typeof Net.quality>; drawOnlinePanel?: (body: Element, redraw: () => void) => void;
  inviteFriend?: (code: string) => Promise<unknown>; joinFriend?: (room: string, hostPub?: string) => Promise<void>; inviteGame?: (game: string, to?: string, level?: number, size?: number) => void;
  meetAndPlay?: (i: number, id: string, source?: string) => Promise<void>; findFriend?: (i: number) => [string, string] | null | void;
  say?: (en: string, vi: string) => void; adventure?: { hud(h: Hud): void, [k: string]: unknown }; _advLoad?: Promise<unknown>; followFriend?: (i: number, id: string) => void;
  friendWhere?: (h: SvHeroT, P: { pos: THREE.Vector3 }) => string; askFriendToCome?: (h: SvHeroT, id: string) => void;
  flyToFriend?: (h: SvHeroT, id: string) => void; walkToFriend?: (h: SvHeroT, id: string) => void;
  // values and functions main.ts shares
  save?: typeof save; give?: typeof give; goAndDo?: typeof goAndDo; playGame?: typeof playGame; currentQuest?: typeof currentQuest;
  questTarget?: typeof questTarget; sendHello?: typeof sendHello; worldHidden?: typeof worldHidden; rects?: typeof rects;
  reward?: typeof reward; fmt?: typeof fmt; addCoins?: (xu: number) => void; giveSticker?: typeof giveSticker; voiceControlOn?: typeof voiceControlOn;
  readingCheck?: () => void; faceToFace?: () => boolean;
}
const G: SvMain = {
  actCount: 0,
  events, // the event bus (js/core/events.js, architecture step 1)
  settings, world, scene, pads, heroes: [], huds: [], mode: 'solo', partner: null, zoom: 1,
  fogMaps: {}, regionOf: [], interactables: [], gatherState: {}, bubbles: []
};
G.firstFrames = firstFrames; // (the valley has been drawn a few times: js/solids.js)
// (round R, owner) two children on one screen: each child's windows sit in their own half and pause only that child, so
// the other keeps playing. With two halves "paused" means the half of whoever touched last (G.lastPlayer); alone it is a flag.
let pausedFlag = false;
const twoHalves = () => G.heroes.length > 1;
G.halfBusy = () => false;
Object.defineProperty(G, 'paused', { get: () => twoHalves() ? G.halfBusy(G.lastPlayer) : pausedFlag, set: v => { pausedFlag = !!v; }, enumerable: true });
window.__sv = G; // handy for debugging in the browser console
window.svFeatureOn = featureOn; // (owner, 16 Oct) js/launch.js asks Studio about the update notice through this
// phones and tablets (round P): the layout keeps the joystick's half of the screen free (css: body.touch)
if (matchMedia('(pointer: coarse)').matches || navigator.maxTouchPoints > 0) document.body.classList.add('touch');
G.renderer = renderer;

// ---------- people of the valley ----------
const NPCS = [];
G.npcs = NPCS;
function nameTag(name, color = '#ffffff') {
  const c = document.createElement('canvas'); c.width = 256; c.height = 64; const x = c.getContext('2d');
  // drawn in the chosen language, and redrawn when it changes ("Ông Cú" is "Grandpa Owl" in English)
  const draw = () => {
    const text = nm(name); x.clearRect(0, 0, 256, 64);
    x.font = 'bold 34px Fredoka, "Baloo 2", sans-serif'; const w = Math.min(250, x.measureText(text).width + 30);
    x.fillStyle = 'rgba(15,30,35,.72)'; x.beginPath(); x.roundRect((256 - w) / 2, 8, w, 48, 24); x.fill();
    x.fillStyle = color; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(text, 128, 33, 240);
  };
  draw();
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  onLang(() => { draw(); t.needsUpdate = true; });
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, transparent: true, depthWrite: false, depthTest: false })); s.scale.set(3, .75, 1); s.renderOrder = 5;
  // (round R, owner: on phones a tag right in front of the camera filled the screen) fade it out when the camera is close
  s.onBeforeRender = (r, sc, cam) => { s.material.opacity = Math.min(1, Math.max(0, (cam.position.distanceTo(s.position) - 5) / 5)); };
  return s;
}
// a child does what an interactable offers (a tap, a walk-up, the Act button): the event bus hears InteractionStarted
// first (architecture §6; the sticker book listens: talking to someone, a ferry, the bunny's hutch), then it happens
function startAct(it, h) {
  try { events.emit('InteractionStarted', { playerId: makeId('player', h.profile.id || 'guest'), entityId: 'interaction:' + String(it.id).toLowerCase().replace(/[^a-z0-9]+/g, '-'), action: 'act', it: it.id }); } catch (e) { }
  return it.act(h, G);
}
/** a person of the valley: a drawn model or a look for the people's maker, where they stand and what they say */
type SvNpcDef = { id: string, name: string, faceName?: string, look?: Record<string, unknown>, model?: THREE.Object3D, x: number, z: number, face?: number, icon?: string, talk(h: SvHeroT): void | Promise<unknown> };
function addNPC({ id, name, faceName, look, model, x, z, face = 0, icon = '💬', talk }: SvNpcDef) {
  const A = model ? null : nameAvatar(buildAvatar(look, null), faceName || name, true, id), obj = model || A.root;
  const av = model ? null : obj;
  obj.position.set(x, world.groundAt(x, z), z); obj.rotation.y = face; scene.add(obj);
  const tag = nameTag(name); tag.position.set(x, obj.position.y + (model ? 3.4 : 2.0), z); scene.add(tag);
  const n = { id, name, x, z, obj, tag, avatar: av, A, talk }; registerName(name, icon);
  NPCS.push(n);
  world.colliders.push({ x, z, r: .7 });
  G.interactables.push({ id: 'npc_' + id, x, z, r: 3, icon, label: () => T('Talk to ', 'Nói chuyện với ') + nm(name), act: h => talk(h) });
  return n;
}
const V = VILLAGE;
const kidLook = (style, color, h, hs, hat) => ({ style, color, hat, back: 'none', hair: h, hairStyle: hs, skin: '#f6c7a5', glider: 0 });
let owl, gourd;
function setupNPCs() {
  owl = addNPC({ id: 'owl', name: 'Ông Cú', model: buildOwl(), x: PLATEAU.x - 2, z: PLATEAU.z - 8, face: .3, icon: '🦉', talk: owlTalk });
  addNPC({ id: 'mai', name: 'Cô Mai', look: { style: 'aodai', color: '#e8435a', hat: 'nonla', back: 'none', hair: '#1d1412', hairStyle: 'long', skin: '#f6c7a5', glider: 0 }, x: V.x + 2, z: V.z - 11.6, face: 0, icon: '🛒', talk: maiTalk });
  addNPC({ id: 'ba', name: 'Bác Ba', look: { style: 'overalls', color: '#5b7fbf', hat: 'none', back: 'none', hair: '#8a8a8a', hairStyle: 'short', skin: '#e0aa80', glider: 0 }, x: V.x - 4.5, z: V.z + 13, face: .8, icon: '🍲', talk: baTalk });
  addNPC({ id: 'teo', name: 'Tèo', look: kidLook('shirt', '#ffb52e', '#1d1412', 'spiky', 'none'), x: V.x + 16, z: V.z + 19.6, face: 0, icon: '🪨', talk: h => kidTalk(h, 'oanquan', 'Tèo', ['Want to play Ô ăn quan with me? It is a clever counting game!', 'Chơi Ô ăn quan với tớ không? Trò này phải tính toán giỏi đấy!']) });
  addNPC({ id: 'ti', name: 'Tí', look: kidLook('dress', '#ff7eb8', '#3b2618', 'buns', 'flower'), x: V.x - 18, z: V.z + 2.5, face: 0, icon: '🦶', talk: h => kidTalk(h, 'hopscotch', 'Tí', ['Let’s play hopscotch! Nhảy lò cò!', 'Chơi nhảy lò cò đi!']) });
  addNPC({ id: 'bong', name: 'Bống', look: kidLook('hoodie', '#9a6bff', '#1d1412', 'ponytail', 'bunny'), x: V.x + 10, z: V.z + 4, face: -1, icon: '⭕', talk: h => kidTalk(h, 'caro', 'Bống', ['Can you beat me at Caro? Get your shapes in a row!', 'Bạn có thắng được tớ môn cờ caro không?']) });
  addNPC({ id: 'su', name: 'Su', look: kidLook('overalls', '#5bbf6a', '#3b2618', 'short', 'cap'), x: V.x + 7.5, z: V.z + 18, face: -1.57, icon: '🪢', talk: h => kidTalk(h, 'tug', 'Su', ['Tug of war! Are you strong? Dô ta!', 'Kéo co nào! Bạn có khỏe không? Dô ta!']) });
  // the Folk Games Playground: friends from Australia and Vietnam, each teaching their own game
  const PG = PLAYGROUND, look = (style, color, hair, hairStyle, hat, skin = '#f6c7a5') => ({ style, color, hat, back: 'none', hair, hairStyle, skin, glider: 0 });
  addNPC({ id: 'jack', name: 'Jack 🇦🇺', look: look('shirt', '#3b6fe0', '#e8c26a', 'short', 'cap', '#ffe3d1'), x: PG.x - 3, z: PG.z - 3, face: .4, icon: '🐺',
    talk: h => kidTalk(h, 'mrwolf', 'Jack', ["G'day! I'm Jack from Australia. Want to play What's the time, Mr Wolf? I'll be the wolf! Grrr!", 'Chào bạn! Tớ là Jack đến từ nước Úc. Chơi "Mấy giờ rồi, ông Sói?" không? Tớ làm sói cho! Gừ gừ!']) });
  addNPC({ id: 'mit', name: 'Mít 🇻🇳', look: look('dress', '#ffd23f', '#1d1412', 'buns', 'flower'), x: PG.x + 1.5, z: PG.z + .5, face: -.6, icon: '🥢',
    talk: h => kidTalk(h, 'chuyen', 'Mít', ['Hi! I am Mít. In Vietnam we play Đánh chuyền with a ball and sticks. Jack calls it Knucklebones!', 'Chào bạn! Tớ là Mít. Ở Việt Nam tụi tớ chơi đánh chuyền với quả bóng và que. Jack gọi là Knucklebones đó!']) });
  addNPC({ id: 'bom', name: 'Bờm 🇻🇳', look: look('tunic', '#e8434a', '#1d1412', 'spiky', 'none'), x: PG.x + 5, z: PG.z - 4, face: -1, icon: '🐉',
    talk: h => kidTalk(h, 'dragon', 'Bờm', ['Let us be a dragon! Hold on tight and sing: Rồng rắn lên mây!', 'Mình làm rồng rắn nào! Bám chặt vào và hát: Rồng rắn lên mây!']) });
  addNPC({ id: 'ruby', name: 'Ruby 🇦🇺', look: look('overalls', '#a66bff', '#a8432a', 'long', 'bow', '#ffe3d1'), x: TOWN.x + 12.2, z: TOWN.z + 3.4, face: 1.4, icon: '🔮',
    talk: h => kidTalk(h, 'marbles', 'Ruby', ['I have got my lucky shooter marble! Can you knock the marbles out of the ring?', 'Tớ có viên bi cái may mắn nè! Bạn bắn được bi ra khỏi vòng không?']) });
  addNPC({ id: 'lan', name: 'Lan 🇻🇳', look: look('aodai', '#5fd39a', '#3b2618', 'ponytail', 'none'), x: PG.x - 6, z: PG.z + 3, face: 1.2, icon: '🪢',
    talk: h => kidTalk(h, 'skipping', 'Lan', ['Nhảy dây! Skipping! Jump when the rope comes down and count with me!', 'Nhảy dây nào! Nhảy lên khi dây quay xuống và đếm cùng tớ nhé!']) });
  gourd = addNPC({ id: 'gourd', name: 'Ông Bầu', model: buildGourd(), x: V.x - V.r + 8, z: V.z + 6, face: -1.2, icon: '🍃', talk: gourdTalk });
  // outlines only on characters near a player (keeps phones fast)
  let olT = 0; const _wp = new THREE.Vector3(), STILL = 20;
  world.updaters.push(dt => {
    if ((olT -= dt) > 0) return; olT = .4;
    const mine = new Set(G.heroes.map(h => h.av));
    OUTLINED.forEach(A => { if (!A.root.parent) return; A.root.getWorldPosition(_wp); const near = G.heroes.some(h => dist2(h.pos.x, h.pos.z, _wp.x, _wp.z) < 30); if (A._ol !== near) { A._ol = near; A.outlines.forEach(o => o.visible = near); if (A.stillLine) A.stillLine.visible = near; }
      // (battery round, PERF-003) far (STILL m from every child) and standing still for two looks: the one-piece still
      // copy (js/avatar.js); anyone walking, riding or near keeps every moving part. A child's own character never.
      const moved = A._wx !== _wp.x || A._wz !== _wp.z; A._wx = _wp.x; A._wz = _wp.z; A._calm = moved ? 0 : (A._calm || 0) + 1;
      showStill(A, !mine.has(A) && A._calm >= 2 && !G.heroes.some(h => dist2(h.pos.x, h.pos.z, _wp.x, _wp.z) < STILL)); });
  });
  // gentle idle animation
  // the children who host folk games are busy playing: they cheer, wave and clap now and then
  const PLAYERS = new Set(['teo', 'ti', 'bong', 'su', 'jack', 'mit', 'bom', 'ruby', 'lan']);
  world.updaters.push((dt, t) => NPCS.forEach((n, k) => {
    if (n.A && PLAYERS.has(n.id)) { const ph = Math.floor(t * .7 + k * 1.3) % 4; n.A.anim(ph === 0 ? 'cheer' : ph === 2 ? 'wave' : 'idle', t + k, 0); }
    else if (n.avatar) { n.avatar.children[0].position.y = Math.sin(t * 2 + k) * .03; }
    else n.obj.rotation.z = Math.sin(t * 1.5 + k) * .05;
  }));
  // and they talk to each other about their games
  const grp = ids => ids.map(id => (NPCS.find(n => n.id === id) || {}).obj).filter(Boolean);
  G.chatGroup(grp(['jack', 'mit', 'bom', 'lan']), CHAT_LINES.playground, { height: 2.7 });
  G.chatGroup(grp(['teo', 'su', 'bong', 'ti']), CHAT_LINES.village, { height: 2.7, face: false });
}

// ---------- interactables ----------
function setupInteractables() {
  G.interactables.push(...world.interactables);
  SHRINES.forEach(s => G.interactables.push({ id: s.id, x: s.x, z: s.z, r: 4.2, icon: '✨', label: () => T('Enter shrine', 'Vào đền') + ': ' + GAMES[s.game].name(), act: h => playGame(h.i, s.game, 'shrine', s) }));
  TOWERS.forEach(tw => G.interactables.push({ id: tw.id, x: tw.x, z: tw.z, r: 5.5, icon: '🧗', label: () => T('Climb ', 'Leo ') + tw.name(), visible: h => h.pos.y < world.towerMeshes[tw.id].y + 5, act: h => { SFX.whoosh(); h.startTowerClimb(tw); } }));
  LEAFIES.forEach(lf => G.interactables.push({ id: lf.id, x: +lf.x, z: +lf.z, r: lf.kind === 'rock' ? 2.6 : 1.8, icon: lf.kind === 'rock' ? '🪨' : '✨', auto: lf.kind === 'sparkle',
    label: () => lf.kind === 'rock' ? T('Lift rock', 'Nhấc hòn đá') : T('Touch the sparkle', 'Chạm tia lấp lánh'), visible: h => !h.profile.leafies[lf.id], act: h => foundLeafy(h, lf) }));
  world.pots.forEach((p, k) => G.interactables.push({ id: 'pot' + k, x: p.x, z: p.z, r: 2.8, icon: '🍲', label: () => T('Cook', 'Nấu ăn'), act: h => openCooking(G, h.i) }));
  G.interactables.push({ id: 'statue', x: world.statue.x, z: world.statue.z, r: 3.6, icon: '🪷', label: () => T('Lotus Statue', 'Tượng Sen'), act: statueTalk });
  GATHER.forEach(([item, x, z], k) => {
    const y = Math.max(heightAt(x, z), WATER) + .7, s = sprite(ITEMS[item].icon, 1.1); s.position.set(x, y, z); scene.add(s);
    const st = G.gatherState[k] = { s, ready: 0 };
    world.updaters.push((dt, t) => { s.visible = performance.now() > st.ready; s.position.y = y + Math.sin(t * 2 + k) * .12; });
    G.interactables.push({ st, id: 'g' + k, x, z, r: 2.4, icon: ITEMS[item].icon, label: () => T('Pick up ', 'Nhặt ') + ITEMS[item].name(), visible: () => performance.now() > st.ready,
      act: h => { st.ready = performance.now() + 120000; give(h, item, 1); } });
  });
}
// Floating bubble icons over every activity, so children who can't read can see where the fun is.
function setupBubbles() {
  const tex = {};
  // a round picture bubble with a big name tag underneath
  const mat = (ch, label) => { const key = ch + label; if (tex[key]) return tex[key]; const c = document.createElement('canvas'); c.width = 320; c.height = 200; const x = c.getContext('2d');
    const g = x.createRadialGradient(150, 62, 10, 160, 72, 64); g.addColorStop(0, '#ffffff'); g.addColorStop(.8, '#e9f8ff'); g.addColorStop(1, '#9fdcff');
    x.shadowColor = 'rgba(0,40,80,.35)'; x.shadowBlur = 10; x.shadowOffsetY = 4;
    x.fillStyle = g; x.beginPath(); x.arc(160, 70, 62, 0, Math.PI * 2); x.fill(); x.shadowColor = 'transparent';
    x.strokeStyle = '#ffffff'; x.lineWidth = 6; x.stroke();
    x.font = '72px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(ch, 160, 76);
    if (label) {
      x.font = 'bold 30px Fredoka, "Baloo 2", sans-serif'; const w = Math.min(310, x.measureText(label).width + 34);
      x.fillStyle = 'rgba(255,255,255,.96)'; x.beginPath(); x.roundRect(160 - w / 2, 142, w, 50, 25); x.fill();
      x.strokeStyle = '#ffb52e'; x.lineWidth = 4; x.stroke();
      x.fillStyle = '#3a2a20'; x.fillText(label, 160, 168, 290);
    }
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return tex[key] = new THREE.SpriteMaterial({ map: t, transparent: true, depthWrite: false }); };
  G.bubbleIcons = G.interactables.filter(it => it.bubble).map((it, k) => {
    const label = (it.short ? it.short() : it.label ? it.label() : '').replace(/^(Talk to |Nói chuyện với |Enter shrine: |Vào đền: )/, '');
    const s = new THREE.Sprite(mat(it.bubble, label.length > 22 ? label.slice(0, 21) + '…' : label)); s.scale.set(3.2, 2, 1); const y = heightAt(it.x, it.z) + 3.6; s.position.set(it.x, y, it.z); s.userData.it = it; scene.add(s);
    world.updaters.push((dt, t) => { s.position.y = y + Math.sin(t * 2 + k) * .15; const near = G.heroes.some(h => dist2(h.pos.x, h.pos.z, it.x, it.z) < it.r); s.material.opacity = near ? .45 : 1; });
    onLang(() => { const l = (it.short ? it.short() : it.label ? it.label() : '').replace(/^(Talk to |Nói chuyện với |Enter shrine: |Vào đền: )/, ''); s.material = mat(it.bubble, l.length > 22 ? l.slice(0, 21) + '…' : l); });
    return s;
  });
}
// Help finding the next goal: a golden light beam with a bouncing "!" over it, and for each player
// a glowing arrow plus a trail of sparkles on the ground leading the way.
function setupGuides() {
  const beam = new THREE.Mesh(new THREE.CylinderGeometry(.9, .9, 70, 16, 1, true), new THREE.MeshBasicMaterial({ color: '#ffd23f', transparent: true, opacity: .28, depthWrite: false, side: THREE.DoubleSide, fog: false }));
  const bang = sprite('❗', 2.4); bang.material.fog = false; scene.add(beam, bang);
  // (tester's notes, 12 Oct) tapping the "!" over the light goes there and does the step, like the Go button
  const bangIt = { id: 'quest_bang', x: 0, z: 0, r: 3, act: h => G.goToObjective(Math.max(0, G.heroes.indexOf(h))) };
  bang.userData.it = bangIt; (G.tapTargets = G.tapTargets || []).push(bang);
  const arrowGeo = new THREE.ConeGeometry(.45, 1.1, 4); arrowGeo.rotateX(Math.PI / 2);
  const feet = sprite('👣', .8).material; // footprints when walking to a place chosen on the map
  const guides = [0, 1].map((): { arrow: THREE.Mesh, dots: THREE.Sprite[], sparkle?: THREE.SpriteMaterial } => {
    const arrow = new THREE.Mesh(arrowGeo, new THREE.MeshBasicMaterial({ color: '#ffd23f', fog: false }));
    const dots = Array.from({ length: 14 }, () => { const d = sprite('✨', .7); d.material = d.material.clone(); scene.add(d); return d; });
    scene.add(arrow); return { arrow, dots };
  });
  world.updaters.push((dt, t) => {
    const h0 = G.heroes[0], tg0 = h0 && playing ? questTarget(h0) : null;
    beam.visible = bang.visible = !!tg0 && !h0.profile.questFold; // (Round V) nor its light
    if (tg0) { bangIt.x = tg0.x; bangIt.z = tg0.z; const gy = heightAt(tg0.x, tg0.z); beam.position.set(tg0.x, gy + 35, tg0.z); bang.position.set(tg0.x, gy + 5.2 + Math.abs(Math.sin(t * 3)) * .8, tg0.z); beam.material.opacity = .2 + Math.sin(t * 2) * .08; }
    guides.forEach((g, i) => {
      const h = G.heroes[i];
      if (h && h.walkTo && h.walkTo.friend) { const P = G.partners[h.walkTo.friend]; if (!P) h.walkTo = null; else { h.walkTo.x = P.pos.x; h.walkTo.z = P.pos.z; if (dist2(h.pos.x, h.pos.z, P.pos.x, P.pos.z) < 4) { SFX.chime(); hudFor(h).toast('👫 ' + T(`You found ${P.name}! Say hello!`, `Con đã gặp ${P.name}! Chào bạn đi!`)); say(`You found ${P.name}! Say hello!`, `Con đã gặp ${P.name} rồi! Chào bạn đi!`); h.walkTo = null; G.huds[h.i] && G.huds[h.i].toggleEmotes(true); } } }
      if (h && h.walkTo && dist2(h.pos.x, h.pos.z, h.walkTo.x, h.walkTo.z) < 7) { SFX.chime(); hudFor(h).toast('👣 ' + T(`You walked to ${h.walkTo.name}!`, `Con đã đi bộ đến ${h.walkTo.name}!`)); h.walkTo = null; }
      const tg = h && playing ? h.walkTo || (h.profile.questFold ? null : questTarget(h)) : null; // (Round V) a folded quest shows no arrow
      const d = tg ? dist2(h.pos.x, h.pos.z, tg.x, tg.z) : 0, show = !!tg && d > 5 && !G.paused;
      g.arrow.visible = show; g.dots.forEach(x => x.visible = show);
      if (!show) return;
      const dx = (tg.x - h.pos.x) / d, dz = (tg.z - h.pos.z) / d;
      g.arrow.position.set(h.pos.x + dx * 1.9, h.pos.y + .35 + Math.sin(t * 5) * .08, h.pos.z + dz * 1.9); g.arrow.rotation.set(0, Math.atan2(dx, dz), 0);
      const flow = (t * 3) % 2.2;
      const want = h.walkTo ? feet : g.sparkle || (g.sparkle = g.dots[0].material.clone());
      g.dots.forEach((x, k) => {
        if (x.material.map !== want.map) { x.material.map = want.map; x.material.needsUpdate = true; }
        const along = 3 + k * 2.2 + flow; if (along > Math.min(d - 1, 34)) { x.visible = false; return; }
        const px = h.pos.x + dx * along, pz = h.pos.z + dz * along;
        x.position.set(px, world.groundAt(px, pz, h.pos.y + 2) + .35, pz); x.material.opacity = 1 - along / 36;
      });
    });
  });
}
// Labels floating over whole areas so they are easy to recognise from far away.
function setupAreaSigns() {
  const sign = (en, vi, icon, x, z, h = 9) => {
    const c = document.createElement('canvas'); c.width = 640; c.height = 160; const g = c.getContext('2d');
    const draw = () => {
      const text = T(en, vi); g.clearRect(0, 0, 640, 160);
      g.font = 'bold 64px Fredoka, "Baloo 2", sans-serif'; const w = Math.min(630, g.measureText(text).width + 150);
      g.fillStyle = 'rgba(255,255,255,.95)'; g.beginPath(); g.roundRect(320 - w / 2, 20, w, 120, 60); g.fill(); g.strokeStyle = '#ff7eb8'; g.lineWidth = 8; g.stroke();
      g.font = '70px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif'; g.fillStyle = '#000'; g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillText(icon, 320 - w / 2 + 26, 84);
      g.font = 'bold 60px Fredoka, "Baloo 2", sans-serif'; g.fillStyle = '#4a2a5a'; g.textAlign = 'center'; g.fillText(text, 320 + 40, 84, w - 120);
    };
    draw();
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; onLang(() => { draw(); t.needsUpdate = true; });
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, transparent: true, depthWrite: false, fog: false })); s.scale.set(16, 4, 1); s.position.set(x, heightAt(x, z) + h, z); scene.add(s);
    // fade out when you are close (so it never blocks the view), fade in from further away
    world.updaters.push(() => { const d = Math.min(...G.heroes.map(o => dist2(o.pos.x, o.pos.z, x, z)), 1e9); s.material.opacity = clamp((d - 22) / 18, 0, 1); s.visible = s.material.opacity > .02; });
  };
  sign('Lotus Village', 'Làng Sen', '🏮', VILLAGE.x, VILLAGE.z - 4, 14);
  sign('Sunny Farm', 'Nông Trại', '🏡', HOME.x, HOME.z, 13);
  sign('Dawn Plateau', 'Cao Nguyên', '🦉', 0, 4, 12);
  sign('Mirror Lake', 'Hồ Gương', '🌊', 55, 125, 8);
  sign('Bamboo Forest', 'Rừng Tre', '🎋', -100, 85, 16);
  sign('Rice Fields', 'Đồng Lúa', '🌾', 112, -38, 8);
  sign('Two Homes Street', 'Phố Hai Quê', '🏘️', 28, 47, 12);
  sign('Three Regions Market', 'Chợ Ba Miền', '🏮', 121, 83, 12);
  sign('Aussie Corner', 'Góc Nước Úc', '🍦', -117, -12, 12);
}
// (tester's notes, 12 Oct) the (i) "about this place" buttons only come up right beside them, and a person to talk to
// comes first, so the button no longer pops up here and there while a child walks past
function nearest(h) {
  let best = null, bd = 1e9;
  for (const it of G.interactables) {
    if (it.visible && !it.visible(h)) continue;
    const d = dist2(h.pos.x, h.pos.z, it.x, it.z), info = it.icon === 'ℹ️';
    if (info && d > Math.max(1.3, it.r - 2.6)) continue; // (a dance group's sign: at the edge of its circle)
    const score = d + (info ? 1.5 : 0) - (it.icon === '💬' ? 1 : 0);
    if (d < it.r && score < bd && Math.abs((it.y ?? heightAt(it.x, it.z)) - h.pos.y) < 5) { best = it; bd = score; }
  }
  return best;
}

// ---------- rewards ----------
function save() { saveProfiles(); }
function give(h, item, n) {
  const p = h.profile; p.inv[item] = (p.inv[item] || 0) + n; save();
  SFX.pop(n); hudFor(h).toast(`+${n} ${ITEMS[item].icon} ${ITEMS[item].name()}`);
  say(`${n} ${ITEMS[item].name()}!`, `${n} ${ITEMS[item].name()}!`);
}
function addMoney(p, xu) { farm.coins += xu; save(); }
function giveSticker(p) { const left = STICKERS.filter(s => !p.stickers.includes(s)); if (!left.length) return null; const s = pick(left); p.stickers.push(s); save(); return s; }
const hudFor = h => G.huds[h.i];
G.give = give;
G.toast = (h, m) => hudFor(h).toast(m);
G.quality = quality; // (feel and sound) js/fun.js leaves out the running dust on 'low'
G.fx = (x, y, z, ch) => { const s = sprite(ch, 1.4); s.material = s.material.clone(); s.position.set(x, y, z); scene.add(s); const t0 = performance.now(); const f = () => { const k = (performance.now() - t0) / 900; s.position.y = y + k * 2; s.material.opacity = 1 - k; if (k < 1) requestAnimationFrame(f); else { scene.remove(s); s.material.dispose(); } }; f(); };
G.mount = (h, b) => { h.mount(b); h.profile.quests.buffalo = true; save(); say('Moo! Hold on tight!', 'Ụm bò! Bám chắc nhé!'); hudFor(h).toast(T('Press Jump to get off', 'Bấm Nhảy để xuống')); };

const fruitParadeModeOn = fruitParadeAvailable;

async function playGame(i: number, id: string, source: string, shrine?: (typeof SHRINES)[number]) {
  const h = G.heroes[i]; if (!h) return;
  if (id === 'sparklefruitbar' && !testerArcadeAvailable('sparklefruitbar',source === 'online'?'multi':'single')) return;
  if (id === 'sparkleorchard' && !testerArcadeAvailable('sparkleorchard',source === 'online'?'multi':'single')) return;
  if (id === 'fruitparade' && !fruitParadeModeOn('single')) { hudFor(h).toast(T('Sparkle Fruit Parade is not available yet.', 'Diễu hành trái cây lấp lánh chưa mở.')); return; }
  if (gameOpen()) { if (twoHalves()) hudFor(h).toast(T('Your friend is playing a game. Play it together, or wait a moment!', 'Bạn con đang chơi một trò. Chơi cùng bạn, hoặc chờ một chút nhé!')); return; }
  G.paused = true; hush();
  // friends in the room: play it together? (round H: every game can be played together)
  if (G.together() && source !== 'online' && !shrine) { G.paused = false; const k = await dialog(T('Play together?', 'Chơi cùng nhau?'), [['Your friends are here. Play this game together?', 'Các bạn đang ở đây. Chơi trò này cùng nhau nhé?']], [['👫 Together', '👫 Cùng nhau'], ['🙂 Just me', '🙂 Mình con']]); if (k === 0) { G.inviteGame(id); return; } G.paused = true; }
  countPlay('game', id); // anonymous: how often each game is played (js/players.js)
  if (MONEY_GAMES.includes(id)) G.tried(h, 'money_' + id); else if (/^rd_/.test(id)) G.tried(h, 'readingTrial');   // (batch rollout) a money game played stays this child's
  const players = G.heroes.map(x => x.profile); if (G.heroes.length > 1 && i === 1) players.reverse();
  // Level = how far this child has got in this game, shifted by the chosen difficulty.
  // the level the child chose inside this game (round M), else the grown-ups' difficulty for this child
  const p = h.profile, diff = (p.gameDiff && p.gameDiff[id]) || p.difficulty || 'easy', level = Math.min(5, (p.levels[id] || 1) + { easy: 0, medium: 1, hard: 2 }[diff]);
  const little = G.heroes.some(x => x.profile.age !== 'big'), strong = !little && diff !== 'easy';
  if (source === 'shrine') { SFX.secret(); say('A shrine! Let’s solve the puzzle.', 'Một ngôi đền! Cùng giải câu đố nào.'); await wait(600); }
  const completion = source === 'hub' || source === 'pad' || source === 'simple' ? 'choose' : 'return';
  const nextId = completion === 'choose' ? nextGameAfter(id) : null;
  // events alongside today's calls (architecture step 1): the activity, by id, and who plays it
  const actId = makeId('act', id, String(++G.actCount)), playerIds = players.map(q => makeId('player', q.id || 'guest'));
  events.emit('ActivityStarted', { activityId: actId, kind: 'game', defId: makeId('game', id), players: playerIds, source });
  const res = await openGame(id, { players, level, little, strong, nextId, completion, style: source === 'folk' || id === 'market' ? 'village' : 'shrine', levelPick: { value: diff } });
  G.paused = false;
  // another level chosen inside the game: remember it for this game and start again
  if (res.restart) { events.emit('ActivityAbandoned', { activityId: actId, reason: 'level' }); p.gameDiff = { ...(p.gameDiff || {}), [id]: res.restart }; save(); return playGame(i, id, source, shrine); }
  if (res.won) events.emit('ActivityCompleted', { activityId: actId, defId: makeId('game', id), players: playerIds, result: { won: true, stars: res.stars || 0, level } });
  else events.emit('ActivityAbandoned', { activityId: actId, reason: 'left' });
  // (r79, owner point 7) a game opened from Play goes back to Play, one opened from the Pad's Games page back to that page;
  // one opened by talking to a villager (or at a shrine) closes straight back to the valley
  const back = () => { if (source === 'hub') G.openGamesHub(i); else if (source === 'pad') G.openPad(i, 'games'); };
  if (!res.won || id === 'sparklefruitbar') { back(); return; }
  // after the rewards: straight on to the next game, or this one again, if the child chose that
  const then = () => { if (res.next === 'next' && nextId) return playGame(i, nextId, source); if (res.next === 'again') return playGame(i, id, source, shrine); back(); };
  // winning Kite Flying earns the whistling kite (diều sáo), which then flies above you everywhere
  if (id === 'kite' && !p.kite) {
    p.kite = true; p.kiteOn = true; save(); G.kites.sync();
    setTimeout(async () => { await reward('🪁', T('A whistling kite!', 'Diều sáo!'), T('It flies above you wherever you go, and its bamboo flute sings in the wind. Switch it on or off in your Backpack.', 'Diều bay theo con khắp nơi, và ống sáo tre hát vi vu trong gió. Bật hoặc tắt trong Ba lô nhé.')); }, 3600);
  }
  for (const hero of G.heroes) {
    // move up a level after every 2 wins
    const q = hero.profile; q.wins[id] = (q.wins[id] || 0) + 1;
    if (q.wins[id] % 2 === 0 && (q.levels[id] || 1) < 5) { q.levels[id] = (q.levels[id] || 1) + 1; if (hero === h) setTimeout(() => { hudFor(h).toast(T('⭐ Level up! ', '⭐ Lên cấp! ') + (q.levels[id])); SFX.chime(); }, 3000); }
    else if (!q.levels[id]) q.levels[id] = 1;
    q.stats.games = (q.stats.games || 0) + 1;
    if (source === 'shrine' && shrine && !q.shrines[shrine.id]) {
      q.shrines[shrine.id] = true; q.orbs++; addMoney(q, 20);
      const st = giveSticker(q);
      if (hero === h) {
        world.setShrineDone(shrine.id, true);
        await reward('🔮', T('Sparkle Orb!', 'Ngọc Lấp Lánh!'), T(`+${fmt(20)} and a new sticker ${st || ''}. Bring 4 orbs to the Lotus Statue!`, `+${fmt(20)} và một hình dán mới ${st || ''}. Mang 4 viên ngọc đến Tượng Sen nhé!`));
      }
    } else if (source === 'folk' || source === 'place' || id === 'market') {
      const first = !q.quests['played_' + id];
      q.quests['played_' + id] = true; if (source !== 'place') q.quests[id === 'market' ? 'market' : 'folk'] = true;
      const amt = id === 'market' ? 25 : source === 'place' ? 8 : 12; addMoney(q, amt);
      const st = first ? giveSticker(q) : null;
      if (hero === h) await reward(id === 'market' ? '💰' : '🎉', T(`+${fmt(amt)}!`, `+${fmt(amt)}!`), st ? T(`New sticker ${st}!`, `Hình dán mới ${st}!`) : T('Thank you for playing!', 'Cảm ơn con đã chơi!'));
    } else {
      addMoney(q, 5); if (hero === h) hudFor(h).toast(`+${fmt(5)} 💰`);
    }
  }
  save(); checkQuests(h);
  G.job('puzzle', 1, h); if (id === 'balloon') G.job('fly', 1, h); if (id === 'bubbles') G.job('bubbles', 1, h);
  setTimeout(then, 300);
}
G.playGame = playGame;
G.job = (kind, n = 1, h) => jobProgress(G, kind, n, h);
G.STICKERS = STICKERS;
G.openWardrobe = i => { if (twoHalves()) G.lastPlayer = i; if (G.paused) return; G.paused = true; G.closeUp = null; openWardrobe(G, i, () => { G.paused = false; G.closeUp = null; }); };

async function foundLeafy(h, lf) {
  const p = h.profile; if (p.leafies[lf.id]) return;
  p.leafies[lf.id] = true; save();
  if (G.heroes.every(x => x.profile.leafies[lf.id])) world.hideLeafy(lf.id);
  SFX.hee(); G.fx(lf.x, heightAt(lf.x, lf.z) + 1.5, lf.z, '🍃');
  const n = Object.keys(p.leafies).length;
  const line = pick([['Hee hee! You found me!', 'Hí hí! Bạn tìm thấy tớ rồi!'], ['Peekaboo! You found me!', 'Ú òa! Bạn tìm ra tớ rồi!'], ['Yay! I was hiding here!', 'A ha! Tớ trốn ở đây nè!']]);
  say(line[0], line[1]);
  hudFor(h).toast(T(`🍃 Leafy found! ${n}/24`, `🍃 Tìm thấy Lá Lá! ${n}/24`));
  checkQuests(h);
}

// ---------- NPC talks ----------
async function owlTalk(h) {
  const p = h.profile; SFX.hoot();
  if (G.lanterns && await G.lanterns.owl(h)) return; // (round R) the story's prologue, once
  if (!p.quests.owl) {
    await dialog('Ông Cú', [
      [`Hoo hoo! Good morning, ${p.name}! Welcome to Sparkle Valley.`, `Hú hú! Chào buổi sáng, ${p.name}! Chào mừng con đến Thung Lũng Lấp Lánh.`, 'Hoo hoo! Good morning, little one! Welcome to Sparkle Valley.', 'Hú hú! Chào buổi sáng con! Chào mừng con đến Thung Lũng Lấp Lánh.'],
      ['I am Ông Cú, the wisest bird in the valley. This valley is full of puzzles, friends and secrets.', 'Ông là Ông Cú, chú cú già thông thái. Thung lũng này có rất nhiều câu đố, bạn bè và bí mật.'],
      ['See that tall tower glowing orange? Climb it, and your map will light up!', 'Con thấy cái tháp cao màu cam kia không? Leo lên đó, bản đồ của con sẽ sáng lên!'],
      ['Then solve the three shrines here on the plateau, and I will give you a special present.', 'Sau đó giải ba ngôi đền trên cao nguyên này, ông sẽ tặng con một món quà đặc biệt.']
    ]);
    G.heroes.forEach(x => { x.profile.quests.owl = true; }); save(); G.heroes.forEach(x => checkQuests(x)); return;
  }
  const done3 = ['sh_pattern', 'sh_count', 'sh_letters'].every(s => p.shrines[s]);
  if (done3 && !p.glider) {
    await dialog('Ông Cú', [
      ['Hoo! You solved all three shrines. How clever you are!', 'Hú! Con giải được cả ba đền rồi. Con thông minh quá!'],
      ['Here is your present: the Leaf Glider! Jump, then press Jump again in the air to float like a leaf.', 'Quà của con đây: Cánh Lá! Nhảy lên, rồi bấm Nhảy lần nữa trên không để bay như chiếc lá.'],
      ['Glide down to Lotus Village. My friends there would love to meet you!', 'Hãy lượn xuống Làng Sen. Các bạn ở đó rất muốn gặp con!']
    ]);
    p.glider = true; save(); h.buildModel();
    await reward('🪂', T('Leaf Glider!', 'Cánh Lá!'), T('Jump, then Jump again in the air', 'Nhảy, rồi bấm Nhảy lần nữa trên không'));
    checkQuests(h); return;
  }
  const q = currentQuest(p);
  const tips = {
    tower1: ['Climb the glowing tower right next to us. Walk up to it and press the action button.', 'Leo lên cái tháp phát sáng ngay cạnh đây. Đi đến gần và bấm nút hành động nhé.'],
    plateau: ['Look for the orange shrines with the beams of light. There are three on the plateau.', 'Tìm những ngôi đền màu cam có cột sáng. Trên cao nguyên có ba ngôi đền.'],
    village: ['Lotus Village is to the east, across the river bridge. Follow the red pin on your map!', 'Làng Sen ở phía đông, qua cây cầu bắc qua sông. Đi theo cái ghim đỏ trên bản đồ nhé!']
  };
  const tip = q && tips[q.id] || ['Explore everywhere! Climb high, look under rocks, and talk to everyone.', 'Khám phá khắp nơi nhé! Leo lên cao, nhìn dưới các hòn đá, và nói chuyện với mọi người.'];
  await dialog('Ông Cú', [['Hoo hoo! ' + tip[0], 'Hú hú! ' + tip[1]]]);
  // (Round U) then one new thing about the valley, on a picture page (loaded only now)
  if (!G.keep('owlGuide')) return;   // (rollout) Studio switch 'owlGuide'
  G.tried(h, 'owlGuide');
  const was = G.paused; G.paused = true; try { await (await import('./owlguide.js')).owlLesson(p); } finally { G.paused = was; }
}
async function maiTalk(h) {
  const k = await dialog('Cô Mai', [['Xin chào! Fresh fruit and pretty hats! Would you like to buy something, or help me sell?', 'Xin chào con! Trái cây tươi và mũ xinh đây! Con muốn mua gì, hay giúp cô bán hàng?']],
    [['🛒 Buy', '🛒 Mua'], ['💰 Help sell (earn money)', '💰 Giúp bán hàng (kiếm tiền)'], ['👋 Bye', '👋 Tạm biệt']]);
  if (k === 0) openShop(G, h.i);
  if (k === 1) playGame(h.i, 'market', 'folk');
}
async function baTalk(h) {
  const k = await dialog('Bác Ba', [['Ah, a young chef! Put ingredients in my pot and see what we can cook. Try rice with mango!', 'À, đầu bếp nhí đây rồi! Cho nguyên liệu vào nồi xem mình nấu được món gì. Thử gạo với xoài xem!']],
    [['🍲 Cook', '🍲 Nấu ăn'], ['👋 Bye', '👋 Tạm biệt']]);
  if (k === 0) openCooking(G, h.i);
}
async function kidTalk(h, game, name, line) {
  const k = await dialog(name, [line], [['▶ Play!', '▶ Chơi!'], ['📺 How to play', '📺 Xem cách chơi'], ['👋 Later', '👋 Để sau']]);
  if (k === 0) playGame(h.i, game, 'folk');
  if (k === 1) { G.paused = true; openHowTo(game, { onPlay: () => { G.paused = false; playGame(h.i, game, 'folk'); }, onClose: () => { if (!gameOpen()) G.paused = false; } }); }
}
// ---------- Two Homes Street: talking to the neighbours ----------
G.kidTalk = (h, game, name, line) => kidTalk(h, game, name, line);
G.townTalk = async (h, who) => {
  if (who === 'sau') {
    const k = await dialog('Cô Tam', [['School is out! Nước mía đây! Fresh sugarcane juice, cold and sweet. A glass gives you lots of energy!', 'Tan trường rồi! Nước mía đây con! Mát lạnh, ngọt lịm. Uống một ly là khỏe re!']],
      [[`🥤 Buy a glass (${fmt(5)})`, `🥤 Mua một ly (${fmt(5)})`], ['👋 Bye', '👋 Tạm biệt']]);
    if (k !== 0) return;
    if (farm.coins < 5) { await dialog('Cô Tam', [['Not enough money? Here, this one is on me. Have a nice day!', 'Không đủ tiền hả? Thôi cô mời con ly này. Chúc con vui nhé!']]); }
    else addMoney(null, -5);
    SFX.chime(); h.bonusStamina = Math.max(h.bonusStamina || 0, 1); // one extra stamina wheel h.stamina = h.staminaMax; h.hearts = Math.max(h.hearts, h.profile.hearts);
    await reward('🥤', T('Yum! Sugarcane juice!', 'Ngon quá! Nước mía!'), T('Full of energy: you can run and climb longer.', 'Tràn đầy năng lượng: chạy và leo được lâu hơn.'));
  }
  if (who === 'tu') {
    const k = await dialog('Bác 2', [['Hello little one! We are playing cards. Want to join? We can play Snap, an Aussie game my neighbour taught me!', 'Chào con! Tụi chú đang đánh bài. Con chơi không? Mình chơi Snap, trò của Úc mà ông hàng xóm dạy chú đó!']],
      [['▶ Play Snap!', '▶ Chơi Snap!'], ['📺 How to play', '📺 Xem cách chơi'], ['👋 Later', '👋 Để sau']]);
    if (k === 0) playGame(h.i, 'snap', 'folk');
    if (k === 1) { G.paused = true; openHowTo('snap', { onPlay: () => { G.paused = false; playGame(h.i, 'snap', 'folk'); }, onClose: () => { if (!gameOpen()) G.paused = false; } }); }
  }
  if (who === 'tienlen') {
    const k = await dialog('Anh Ba', [['Hey! Con Vật and I are playing Tiến Lên, southern style. Sit down, I’ll deal you thirteen cards!', 'Ê em! Anh với Con Vật đang đánh Tiến Lên miền Nam nè. Ngồi xuống, anh chia cho em mười ba lá!']],
      [['▶ Play Tiến Lên (southern rules)', '▶ Chơi Tiến Lên miền Nam'], ['▶ Play Tiến Lên (northern rules)', '▶ Chơi Tiến Lên miền Bắc'], ['📺 How to play', '📺 Xem cách chơi'], ['👋 Later', '👋 Để sau']]);   // (Round V, owner 13 Oct: miền Bắc too)
    if (k === 0) playGame(h.i, 'tienlen', 'folk');
    if (k === 1) playGame(h.i, 'tienlenbac', 'folk');
    if (k === 2) { G.paused = true; openHowTo('tienlen', { onPlay: () => { G.paused = false; playGame(h.i, 'tienlen', 'folk'); }, onClose: () => { if (!gameOpen()) G.paused = false; } }); }
  }
  if (who === 'tuan') {
    const k = await dialog('Anh Tuấn', [['Đá cầu! We kick the shuttlecock and never let it touch the ground. Want to try?', 'Đá cầu nè! Tụi anh đá quả cầu, không để nó rơi xuống đất. Em thử không?']],
      [['▶ Play!', '▶ Chơi!'], ['📺 How to play', '📺 Xem cách chơi'], ['👋 Later', '👋 Để sau']]);
    if (k === 0) playGame(h.i, 'dacau', 'folk');
    if (k === 1) { G.paused = true; openHowTo('dacau', { onPlay: () => { G.paused = false; playGame(h.i, 'dacau', 'folk'); }, onClose: () => { if (!gameOpen()) G.paused = false; } }); }
  }
};
// ---------- chatting with villagers ----------
G.chatWith = (i, pid, firstAsk) => { if (!PERSONAS[pid] || gameOpen()) return; const was = G.paused; G.paused = true; openChat(G, i, pid, () => { G.paused = was && !!document.querySelector<HTMLElement>('.modal'); }, firstAsk); };
G.voiceCommand = i => voiceCommand(G, i); G.voiceControlOn = voiceControlOn;
dialogHooks.canChat = name => !!personaByName(name);
dialogHooks.chat = name => {
  const [pid] = personaByName(name), n = NPCS.find(x => x.id === pid) || { x: 0, z: 0 };
  const h = G.heroes.slice().sort((a, b) => dist2(a.pos.x, a.pos.z, n.x, n.z) - dist2(b.pos.x, b.pos.z, n.x, n.z))[0];
  if (h) G.chatWith(h.i, pid);
};
// ---------- the Games hub: every game, by place, playable straight away ----------
const GAME_SPOT = { music: 'musiccorner', firstwords: 'g_firstwords', tangram: 'g_tangram', snakes: 'g_snakes', rangoli: 'g_rangoli', datnieu: 'g_datnieu', kite: 'g_kite', chichi: 'g_chichi', sackrace: 'g_sackrace', cricket: 'g_cricket', parcel: 'g_parcel', words: 'g_words', snap: 'cards', tienlen: 'tienlen', tienlenbac: 'tienlen', dacau: 'dacau', mrwolf: 'npc_jack', chuyen: 'npc_mit', dragon: 'npc_bom', marbles: 'npc_ruby', skipping: 'npc_lan', oanquan: 'npc_teo', hopscotch: 'npc_ti', caro: 'npc_bong', tug: 'npc_su', market: 'npc_mai', jigsaw: 'easel', bunny: 'hutch', balloon: 'balloon', bubbles: 'bubbles',
  tower: 'blocks', order: 'order', sortout: 'bear', duckmaze: 'duckmaze', memory: 'chest', tune: 'xylo', shapes: 'theatre', oddone: 'frog' };
G.gameSpot = id => G.interactables.find(it => it.id === (GAME_SPOT[id] || (G.GAME_SPOT || {})[id] || (SHRINES.find(s => s.game === id) || {}).id));
G.openQuick = i => { if (twoHalves()) G.lastPlayer = i; if (G.paused) return; G.paused = true; openQuick(G, i); };
G.openGamesHub = i => { if (twoHalves()) G.lastPlayer = i; if (G.paused) return; G.paused = true; openGamesHub(G, i, () => { G.paused = false; }); };
// Games hub / map: fly straight to the friend who runs a game (or a place), then start it there
const npcLike = it => /^(npc_|g_|v_|pc_|cards$|dacau$|musiccorner$|bear$|stall$)/.test(it.id || '');
// the nearest open spot to (x, z): not inside a building, tree or stall, not in water. Travelling lands there.
G.clearSpot = (x, z, pad = .9) => {
  // (reports #251/#256) inside the valley's walkable edge, as G.goodSpot: past it the child is held at the edge beside what stands there
  const W = G.world, free = (px, pz) => Math.abs(px) <= HALF - 10 && Math.abs(pz) <= HALF - 10 && heightAt(px, pz) > WATER + .3 && !(W.solidAt && (W.solidAt(px, pz) || W.solidAt(px + .6, pz) || W.solidAt(px - .6, pz) || W.solidAt(px, pz + .6) || W.solidAt(px, pz - .6))) && !solidCircleHit(W, px, pz) && !W.colliders.some(c => c.r > 0 && Math.hypot(c.x - px, c.z - pz) < c.r + pad) && !W.boxes.some(b => px > b.x0 - pad && px < b.x1 + pad && pz > b.z0 - pad && pz < b.z1 + pad);
  if (free(x, z)) return [x, z];
  for (let r = 1.5; r <= 14; r += 1.25) for (let k = 0; k < 16; k++) { const a = k / 16 * Math.PI * 2, px = x + Math.cos(a) * r, pz = z + Math.sin(a) * r; if (free(px, pz)) return [px, pz]; }
  return [x, z];
};
G.landBy = async (h, x, z) => { const [sx, sz] = G.clearSpot(x + 1.8, z + 1.4); await G.travel(h, sx - 4.5, sz - 1); h.yaw = Math.atan2(x - h.pos.x, z - h.pos.z); h.camYaw = h.yaw + Math.PI; };
G.meetAndPlay = async (i, id, source = 'place') => {
  const h = G.heroes[i], it = G.gameSpot(id); if (!h) return;
  if (!it) { return G.playGame(i, id, source); return; }
  if (dist2(h.pos.x, h.pos.z, it.x, it.z) > 4) await G.landBy(h, it.x, it.z);
  G.fx && G.fx(it.x, heightAt(it.x, it.z) + 2.4, it.z, '🎮'); await wait(500);
  return G.playGame(i, id, source);
};
// the villager nearest to a place on the map (within 20 m), so travelling lands you right next to them
G.npcNear = (x, z, r = 20) => G.interactables.filter(it => npcLike(it) && Number.isFinite(it.x) && dist2(it.x, it.z, x, z) < r).sort((a, b) => dist2(a.x, a.z, x, z) - dist2(b.x, b.z, x, z))[0] || null;
G.travelTo = async (h, x, z, snapToNpc = true) => { const n = snapToNpc ? G.npcNear(x, z) : null; if (n) { await G.landBy(h, n.x, n.z); hudFor(h).toast('👋 ' + n.label()); } else await G.travel(h, x, z); };
G.goToGame = (i, id) => { const h = G.heroes[i], it = G.gameSpot(id); if (!h || !it) return; (async () => { if (dist2(h.pos.x, h.pos.z, it.x, it.z) > 45) await G.travel(h, it.x - 1.5, it.z + 2); goAndDo(h, it); })(); };
// ---------- objective helpers ----------
G.objectiveIcon = h => { const q = currentQuest(h.profile); return q ? q.icon : '🏆'; };
G.sayObjective = i => { const h = G.heroes[i]; if (!h) return; const q = currentQuest(h.profile); if (!q) return; const tale = q.tale || QUEST_TALES[q.id]; if (tale) say(tale[2], tale[3]); else say(q.title(), q.title()); };
// is there water, a wall or something big on the straight way between two spots? (the last 1.5 m, by the goal, is left out)
const wayBlocked = (x0, z0, x1, z1) => { const n = Math.ceil(Math.hypot(x1 - x0, z1 - z0) / 1.2); for (let k = 1; k < n - 1; k++) { const x = x0 + (x1 - x0) * k / n, z = z0 + (z1 - z0) * k / n; if (!G.goodSpot(x, z)) return true; } return false; };
// "Go" button: walk to the goal (or fly there if it is far away) and start it on arrival.
G.goToObjective = async i => {
  const h = G.heroes[i]; if (!h || G.paused) return;
  const tg = questTarget(h); if (!tg) { G.sayObjective(i); return; }
  const it = G.interactables.filter(x => !x.auto && (!x.visible || x.visible(h))).sort((a, b) => dist2(a.x, a.z, tg.x, tg.z) - dist2(b.x, b.z, tg.x, tg.z))[0];
  const near = it && dist2(it.x, it.z, tg.x, tg.z) < 6 ? it : null;
  say('Let\u2019s go!', 'Đi thôi!');
  if (dist2(h.pos.x, h.pos.z, tg.x, tg.z) > 45) { await G.travel(h, tg.x - 1.5, tg.z + 2); }
  // (tester's notes, 12 Oct) a goal across water or past a wall (by Hồ Gươm: the bridge's rail, the lake): walking
  // straight there only slid along the rail in circles, so the child lands on open ground right beside it instead
  const dest = near || tg;
  if (dist2(h.pos.x, h.pos.z, dest.x, dest.z) > 3 && wayBlocked(h.pos.x, h.pos.z, dest.x, dest.z)) await G.landBy(h, dest.x, dest.z);
  if (near) goAndDo(h, near); else h.goal = { x: tg.x, z: tg.z };
};
const GOURD_GIFTS: [number, string, number][] = [[3, 'money', 15], [6, 'money', 25], [10, 'glider', 2], [15, 'money', 40], [20, 'money', 60], [24, 'glider', 4]];
async function gourdTalk(h) {
  const p = h.profile, n = Object.keys(p.leafies).length;
  const due = GOURD_GIFTS.filter(([need]) => n >= need && !p.quests['gourd' + need]);
  if (!due.length) {
    const next = GOURD_GIFTS.find(([need]) => n < need);
    await dialog('Ông Bầu', [['Yahoo! I love Leafies, the little spirits hiding all over the valley.', 'Ố là la! Ông thích các bạn Lá Lá lắm, chúng trốn khắp thung lũng.'],
      [next ? `You found ${n}. Find ${next[0]} and I will give you a present!` : 'You found every single Leafy! You are amazing!', next ? `Con tìm được ${n} bạn rồi. Tìm đủ ${next[0]} bạn, ông sẽ tặng quà!` : 'Con tìm được tất cả các bạn Lá Lá! Con giỏi quá!'],
      ['Look under odd rocks and touch sparkles on high places!', 'Nhìn dưới những hòn đá lạ và chạm vào tia lấp lánh ở chỗ cao nhé!'],
      ...(G.secrets.hint(h) ? [['Psst… a secret: ' + G.secrets.hint(h), 'Suỵt… bí mật nhé: ' + G.secrets.hint(h)]] : [])]);
    return;
  }
  for (const [need, kind, what] of due) {
    p.quests['gourd' + need] = true;
    if (kind === 'hat') { if (!p.owned.hats.includes(what)) p.owned.hats.push(what); await reward({ flower: '🌸', bunny: '🐰', crown: '👑' }[what], T('A new hat!', 'Mũ mới!'), T('Wear it from your Backpack', 'Đội mũ trong Ba lô nhé')); }
    if (kind === 'glider') { if (!p.owned.gliders.includes(what)) p.owned.gliders.push(what); await reward('🪂', T('A new glider colour!', 'Màu cánh lượn mới!'), ''); }
    if (kind === 'money') { addMoney(p, what); await reward('💰', '+' + fmt(what), ''); }
  }
  save(); say('Thank you for finding my Leafy friends!', 'Cảm ơn con đã tìm các bạn Lá Lá của ông!');
}
async function statueTalk(h) {
  const p = h.profile;
  if (world.isNight() && !(p.secrets || {}).wish) { G.fx(world.statue.x, heightAt(world.statue.x, world.statue.z) + 8, world.statue.z, '🌠'); await G.secrets.unlock(h, 'wish'); return; }
  if (p.orbs < 4) { await dialog(T('Lotus Statue', 'Tượng Sen'), [[`Bring me 4 Sparkle Orbs from the shrines and I will make you stronger. You have ${p.orbs}.`, `Hãy mang đến 4 Ngọc Lấp Lánh từ các ngôi đền, ta sẽ giúp con mạnh hơn. Con đang có ${p.orbs} viên.`]]); return; }
  const k = await dialog(T('Lotus Statue', 'Tượng Sen'), [['Four Sparkle Orbs! What would you like?', 'Bốn Ngọc Lấp Lánh! Con muốn gì nào?']], [['❤️ One more heart', '❤️ Thêm một trái tim'], ['💚 More stamina', '💚 Thêm sức bền'], ['Not now', 'Để sau']]);
  if (k === 0 || k === 1) {
    if (k === 1 && p.staminaMax >= 3) { toast(T('Your stamina is already the biggest!', 'Sức bền đã lớn nhất rồi!')); return; }
    p.orbs -= 4; if (k === 0) { p.hearts = Math.min(12, p.hearts + 1); h.hearts = p.hearts; } else { p.staminaMax = Math.min(3, p.staminaMax + .5); h.stamina = p.staminaMax; }
    p.quests.statue = true; save();
    await reward(k === 0 ? '❤️' : '💚', k === 0 ? T('One more heart!', 'Thêm một trái tim!') : T('More stamina!', 'Thêm sức bền!'), '');
    checkQuests(h);
  }
}

// ---------- quests ----------
const questDone = (p, q) => !!p.quests[q.id] || !!(q.check && q.check(p));
// (round R) the story's step comes first; when no chapter is open, the valley's adventure list as before
// (round R, owner 9 Oct) the goal bar follows the lantern story; a side story (bà Huệ and ông Nghi's yard) shows there only
// when the child chose to follow it on the Adventures page (profile.follow), or when the story has no step open right now
const sideQuest = p => G.yard && G.yard.quest(p);
function currentQuest(p) {
  if (p.follow === 'yard' && sideQuest(p)) return sideQuest(p);
  return (G.lanterns && G.lanterns.quest(p)) || sideQuest(p) || QUESTS.find(q => !questDone(p, q));
}
G.sideStories = () => G.yard && G.keep('story_yard') ? [G.yard.side] : [];
G.currentQuest = currentQuest;
function questTarget(h) {
  const p = h.profile, q = currentQuest(p); if (!q) return null;
  if (q.target) return q.target();
  const near = list => list.slice().sort((a, b) => dist2(a.x, a.z, h.pos.x, h.pos.z) - dist2(b.x, b.z, h.pos.x, h.pos.z))[0];
  switch (q.at) {
    case 'owl': return { x: owl.x, z: owl.z };
    case 'tw_plateau': return TOWERS[0];
    case 'plateauShrine': return near(SHRINES.slice(0, 3).filter(s => !p.shrines[s.id]));
    case 'village': return { x: V.x - V.r + 2, z: V.z };
    case 'mai': return NPCS.find(n => n.id === 'mai');
    case 'pot': return near(world.pots);
    case 'kids': return NPCS.find(n => n.id === 'teo');
    case 'playground': return NPCS.find(n => n.id === 'jack');
    case 'market': return { x: MARKET.x - 22, z: MARKET.z };
    case 'aussie': return { x: AUSSIE.x - 4, z: AUSSIE.z };
    case 'postcard': return near(LANDMARKS.filter(l => !(p.postcards || {})[l.id]).map(l => ({ x: l.x, z: l.z + 2 })));
    case 'buffalo': return near(world.buffalo.map(b => ({ x: b.mesh.position.x, z: b.mesh.position.z })));
    case 'leafy': return near(LEAFIES.filter(l => !p.leafies[l.id]));
    case 'statue': return p.orbs >= 4 ? world.statue : near(SHRINES.filter(s => !p.shrines[s.id] && p.discovered[s.id])) || world.statue;
    case 'tower': return near(TOWERS.filter(t => !p.towers[t.id]));
    case 'shrine': return near(SHRINES.filter(s => !p.shrines[s.id] && p.discovered[s.id])) || near(SHRINES.filter(s => !p.shrines[s.id]));
  }
  return null;
}
G.questTarget = questTarget;
G.objective = h => { const q = currentQuest(h.profile); return q ? q.title() : T('You finished the adventure! Keep exploring!', 'Con đã hoàn thành cuộc phiêu lưu! Tiếp tục khám phá nhé!'); };
G.checkQuests = h => checkQuests(h);
G.save = save; G.addCoins = xu => addMoney(null, xu); G.giveSticker = p => giveSticker(p); G.reward = reward; G.fmt = fmt;
async function checkQuests(h) {
  const p = h.profile;
  G.boxes && G.boxes.questDone(h, QUESTS.filter(q => questDone(p, q)).length); // (round S, owner plan 8 Oct) a finished quest earns a mystery box (js/boxes.js)
  // story chapters open when their quest is done (pause the world while the book is open)
  if (!G._reading) { G._reading = true; try { await storyCheck(G, h, id => questDone(p, QUESTS.find(q => q.id === id))); } finally { G._reading = false; } }
  const k = 'seen_' + (currentQuest(p) || { id: 'all' }).id;
  if (!p.quests[k]) {
    p.quests[k] = true; save();
    const q = currentQuest(p);
    // every new goal is told as a little story; "Let's go!" walks there straight away
    if (q && q.id !== 'owl') setTimeout(async () => {
      // wait until no game, book, chat or menu is open
      for (let k = 0; k < 600 && (gameOpen() || document.querySelector<HTMLElement>('.storybook, .modal, .dialog, .reward, .howto')); k++) await wait(500);
      if (currentQuest(p) !== q || !playing) return;
      const was = G.paused; G.paused = true; const go = await showQuestTale(q, p.name); G.paused = was;
      if (go) G.goToObjective(h.i); else hudFor(h)?.toast(T('New goal: ', 'Mục tiêu mới: ') + q.title());
    }, 2600);
    if (!q) celebrateAll(h);
  }
}
async function celebrateAll(h) {
  await reward('🏆', T('You are a Sparkle Valley hero!', 'Con là anh hùng Thung Lũng Lấp Lánh!'), T('Every quest done. Amazing!', 'Hoàn thành mọi nhiệm vụ. Tuyệt vời!'));
  if (!h.profile.owned.hats.includes('crown')) { h.profile.owned.hats.push('crown'); save(); }
}

// ---------- hero events ----------
G.onTowerTop = async (h, tw) => {
  const p = h.profile; if (p.towers[tw.id]) { hudFor(h).toast(T('What a view! Jump off and glide!', 'Đẹp quá! Nhảy xuống và lượn nào!')); return; }
  p.towers[tw.id] = true;
  [...SHRINES, ...TOWERS].forEach(s => { if (dist2(s.x, s.z, tw.x, tw.z) < REVEAL_R) p.discovered[s.id] = true; });
  save(); delete G.fogMaps[p.id]; world.setTowerDone(tw.id, true);
  SFX.tower(); h.cheerT = 2.5;
  await wait(1200);
  await reward('🗺️', T('Map updated!', 'Bản đồ đã cập nhật!'), tw.name());
  say(p.glider ? 'Now jump off and glide!' : 'Your map is lit up! Look for the orange shrines.', p.glider ? 'Giờ nhảy xuống và lượn nào!' : 'Bản đồ đã sáng lên! Tìm những ngôi đền màu cam nhé.');
  checkQuests(h);
};
G.onGlide = h => { if (!h.profile.quests.glided) { h.profile.quests.glided = true; save(); say('Wheee! You are flying!', 'Vút! Con đang bay rồi!'); } };
G.hint = (h, k) => { if (k === 'tired' && !h._tiredHint) { h._tiredHint = true; hudFor(h).toast(T('Too tired to climb. Rest a moment!', 'Mệt quá không leo được. Nghỉ một chút nhé!')); setTimeout(() => h._tiredHint = false, 6000); } };
G.stats = (h, sp) => { h.profile.stats.steps = (h.profile.stats.steps || 0) + 1; };
G.hurt = (h, n) => {
  // Falls never hurt little ones. Big kids on Hard lose a heart (food heals), and are carried to safety at zero.
  if (h.profile.age !== 'big' || h.profile.difficulty !== 'hard') { SFX.bump && SFX.bump(); return; }
  h.hearts = Math.max(0, h.hearts - n); SFX.no(); hudFor(h).toast(T('Oof! Big fall!', 'Ui da! Ngã đau quá!'));
  if (h.hearts <= 0) G.rescue(h, true);
};
G.rescue = async (h, fainted) => {
  if (!fainted && G.pets && G.pets.rescue(h)) return; // a pet comes to pull them out of the water
  if (h._rescuing) return; h._rescuing = true;
  const f = el('div', 'fade white'); document.body.appendChild(f); SFX.travel();
  say(fainted ? 'Oh dear! Ông Cú carried you somewhere safe.' : 'Splash! Ông Cú helped you out of the water.', fainted ? 'Ôi! Ông Cú đã đưa con đến chỗ an toàn.' : 'Ùm! Ông Cú đã kéo con lên bờ.');
  await wait(700);
  h.place(h.lastSafe.x, h.lastSafe.z); h.stamina = h.staminaMax; h.exhausted = false; if (fainted) h.hearts = h.profile.hearts;
  f.classList.add('out'); setTimeout(() => f.remove(), 600); h._rescuing = false;
};
G.travel = async (h, x, z) => {
  if (!Number.isFinite(x) || !Number.isFinite(z)) { console.warn('travel: no place to go to'); return; } // never fly into nowhere (a black screen)
  const f = el('div', 'fade blue'); document.body.appendChild(f); SFX.travel();
  await wait(650); if (h.riding) h.dismount();
  if (h.cancelCarry) { h.cancelCarry(); h.cancelCarry = null; }
  h.place(x + 4.5, z + 1); h.gliding = false; h.camYaw = Math.PI;
  f.classList.add('out'); setTimeout(() => f.remove(), 700);
};
G.eat = (h, id) => {
  const p = h.profile; if (!p.dishes[id]) return;
  const r = dishInfo(id) || { heal: 1, bonus: 0, name: () => T('Mystery stew', 'Món hầm bí ẩn') };
  p.dishes[id]--; save();
  h.hearts = Math.min(p.hearts, h.hearts + r.heal); h.bonusStamina = r.bonus; h.stamina = p.staminaMax + r.bonus; h.exhausted = false;
  SFX.ok(); say(`Yum yum! ${r.name()}!`, `Măm măm! ${r.name()}!`); h.cheerT = 1.2;
};
G.onCooked = (h) => { checkQuests(h); G.job('cook', 1, h); };
G.rebuildHero = i => { const h = G.heroes[i]; if (h) { h.buildModel(); G.huds[i].refreshWho(); sendHello(); } };
G.fogMapFor = p => G.fogMaps[p.id] || (G.fogMaps[p.id] = fogMapFor(p, mapPic.now()));
G.mapPic = mapPic; G.waterPic = waterPic; // (the checks read where each picture came from)
G.avatarPreview = i => {
  const h = G.heroes[i]; if (!h) return '';
  const preview = new THREE.Scene(); preview.background = new THREE.Color('#f1eaff'); preview.environment = scene.environment;
  const avatar = h.av.root.clone(true); avatar.position.set(0, 0, 0); avatar.rotation.set(0, .12, 0); preview.add(avatar);
  preview.add(new THREE.HemisphereLight(0xffffff, 0xd9c79a, 1.8)); const sun = new THREE.DirectionalLight(0xffffff, 2); sun.position.set(3, 5, 4); preview.add(sun);
  // Hidden gliders/idle copies must not enlarge the bounds and shrink the outfit.
  avatar.updateMatrixWorld(true); const bounds=new THREE.Box3();
  avatar.traverseVisible(o=>{if(o instanceof THREE.Mesh&&o.geometry){if(!o.geometry.boundingBox)o.geometry.computeBoundingBox();bounds.union(o.geometry.boundingBox.clone().applyMatrix4(o.matrixWorld));}});
  const size=bounds.getSize(new THREE.Vector3()),center=bounds.getCenter(new THREE.Vector3()),width=260,height=320,aspect=width/height;
  const cam=new THREE.PerspectiveCamera(32,aspect,.1,100),distance=Math.max(size.y,size.x/aspect)/(2*Math.tan(THREE.MathUtils.degToRad(16)))*1.12;
  cam.position.set(center.x,center.y,center.z+distance+size.z/2);cam.lookAt(center);
  const target=new THREE.WebGLRenderTarget(width,height);target.texture.colorSpace=THREE.SRGBColorSpace;
  const previousTarget=renderer.getRenderTarget(),viewport=renderer.getViewport(new THREE.Vector4()),scissor=renderer.getScissor(new THREE.Vector4()),scissorTest=renderer.getScissorTest();
  try {
    // setViewport takes logical screen units even for a render target. The game's
    // adaptive pixel ratio can be below 1; compensate so the target is filled.
    const ratio=renderer.getPixelRatio();
    renderer.setRenderTarget(target);renderer.setScissorTest(false);renderer.setViewport(0,0,width/ratio,height/ratio);renderer.render(preview,cam);
    const bytes=new Uint8Array(width*height*4);renderer.readRenderTargetPixels(target,0,0,width,height,bytes);
    const c=document.createElement('canvas');c.width=width;c.height=height;const ctx=c.getContext('2d'),data=ctx.createImageData(width,height);
    for(let y=0;y<height;y++)data.data.set(bytes.subarray((height-y-1)*width*4,(height-y)*width*4),y*width*4);
    ctx.putImageData(data,0,0);return c.toDataURL('image/jpeg',.85);
  } finally {renderer.setRenderTarget(previousTarget);renderer.setViewport(viewport);renderer.setScissor(scissor);renderer.setScissorTest(scissorTest);target.dispose();}
};
G.snapshot = (i, max = 720, q = .8) => {
  const h = G.heroes[i] || G.heroes[0], w = renderer.domElement.width, hh = renderer.domElement.height;
  renderer.setScissorTest(false); renderer.setViewport(0, 0, w / renderer.getPixelRatio(), hh / renderer.getPixelRatio());
  h.cam.aspect = w / hh; h.cam.updateProjectionMatrix(); G.huds.forEach(x => x.root.style.visibility = 'hidden');
  withRideView(h, () => renderer.render(scene, h.cam));
  const c = document.createElement('canvas'), k = Math.min(1, max / Math.max(w, hh)); c.width = w * k; c.height = hh * k; c.getContext('2d').drawImage(renderer.domElement, 0, 0, c.width, c.height);
  G.huds.forEach(x => x.root.style.visibility = '');
  return c.toDataURL('image/jpeg', q);
};
G.LANDMARKS = LANDMARKS; // (round R) the Pad map lists each place's landmarks under it
G.PLACES = [
  { g: 'home', key: 'farm', icon: '🏡', name: () => T('Sunny Farm', 'Nông trại'), x: HOME.x - 4, z: HOME.z + 2 },
  { g: 'vn', key: 'village', icon: '🏮', name: () => T('Lotus Village', 'Làng Sen'), x: VILLAGE.x - VILLAGE.r + 6, z: VILLAGE.z },
  { g: 'asia', key: 'china', icon: '🐼', name: () => T('China Town', 'Làng Trung Hoa'), x: CHINA.x, z: CHINA.z + 12 },
  { g: 'asia', key: 'india', icon: '🐘', name: () => T('India Village', 'Làng Ấn Độ'), x: INDIA.x, z: INDIA.z + 15 },
  { g: 'home', icon: '🦉', name: () => T('Dawn Plateau (Ông Cú)', 'Cao nguyên Bình Minh (Ông Cú)'), x: PLATEAU.x - 2, z: PLATEAU.z - 3 },
  { g: 'vn', icon: '💃', name: () => T('Village festival stage (Lotus Village)', 'Sân khấu hội làng (Làng Sen)'), x: VILLAGE.x - 6, z: VILLAGE.z + 25, under: 'village' },
  { g: 'home', key: 'town', icon: '🏘️', name: () => T('Two Homes Street', 'Phố Hai Quê'), x: TOWN.x - 4, z: TOWN.z - 1 },
  { g: 'home', icon: '🏖️', name: () => T('Beach', 'Bãi biển'), x: landmarkAt('bondi')[0] + 6, z: landmarkAt('bondi')[1] - 4 },   // (round T: the southern beach)
  { g: 'vn', icon: '🏮', name: () => T('Three Regions Market', 'Chợ Ba Miền'), x: MARKET.x - 22, z: MARKET.z },
  { g: 'au', icon: '🍦', name: () => T('Aussie Corner', 'Góc Nước Úc'), x: AUSSIE.x - 4, z: AUSSIE.z },
  { g: 'au', icon: '🎭', name: () => T('Opera House', 'Nhà hát Opera'), x: landmarkAt('opera')[0] - 6, z: landmarkAt('opera')[1], under: 'sydney' },   // (the older Opera House stands here; listed under Sydney)
  { g: 'au', key: 'uluru', icon: '🪨', name: () => T('Uluru', 'Uluru'), x: ULURU.x, z: ULURU.z - 20 },
  { g: 'home', icon: '🐻', name: () => T('Mr. Bear’s shop (farm)', 'Cửa hàng Bác Gấu (nông trại)'), x: HOME.x - 21, z: HOME.z + 6, under: 'farm' }
];
G.changePlayer = () => {
  save(); Net.close(); Net.stopListening(); playing = false; G.paused = true; $('#huds').hidden = true;
  G.heroes.forEach(h => { if (h.riding) h.dismount(); scene.remove(h.av.root); }); G.huds.forEach(h => h.destroy()); G.heroes = []; G.huds = [];
  showWho((mode, chosen) => startSession(mode, chosen));
};
// Children who are not playing right now still wander around the farm.
G.wanderers = [];
function setupWanderers(active) {
  G.wanderers.forEach(w => { scene.remove(w.av.root); scene.remove(w.tag); }); G.wanderers = [];
  for (let i = G.interactables.length - 1; i >= 0; i--) if (/^wander\d/.test(G.interactables[i].id)) G.interactables.splice(i, 1);
  profiles.filter(p => !active.includes(p)).slice(0, 4).forEach((p, k) => {
    const av = buildAvatar(p.look, p.photo), tag = nameTag(p.name); av.root.userData.own = true; // (Round V) another child of this device
    const x = HOME.x - 8 + k * 4, z = HOME.z + 4;
    av.root.position.set(x, heightAt(x, z), z); scene.add(av.root); scene.add(tag);
    const w = { av, tag, tx: x, tz: z, pos: av.root.position, yaw: 0, wave: 0 }; G.wanderers.push(w);
    G.interactables.push({ id: 'wander' + k, get x() { return w.pos.x; }, get z() { return w.pos.z; }, r: 2.5, icon: '👋', label: () => T('Say hi to ', 'Chào ') + nm(p.name),
      act: h => { SFX.ok(); w.wave = 2.5; w.tx = w.pos.x; w.tz = w.pos.z; w.yaw = Math.atan2(h.pos.x - w.pos.x, h.pos.z - w.pos.z); say('Hi! Want to play together later?', 'Chào bạn! Lát nữa mình chơi cùng nhau nhé?'); } });
  });
}
world.updaters.push((dt, t) => G.wanderers.forEach((w, k) => {
  const p = w.pos, dx = w.tx - p.x, dz = w.tz - p.z, d = Math.hypot(dx, dz);
  let st = 'idle', sp = 0;
  if (w.wave > 0) { w.wave -= dt; st = 'wave'; }
  else if (d < .3) { if (Math.random() < dt * .25) { const a = Math.random() * 6.28, r = 4 + Math.random() * 14; w.tx = HOME.x + Math.cos(a) * r; w.tz = HOME.z + Math.sin(a) * r; } }
  else { sp = 2.2; w.yaw = Math.atan2(dx, dz); p.x += dx / d * sp * dt; p.z += dz / d * sp * dt; st = 'walk'; }
  world.collide(p, .4); p.y = world.groundAt(p.x, p.z, p.y + 1); w.av.root.rotation.y = w.yaw; w.av.anim(st, t + k, sp); w.tag.position.set(p.x, p.y + 2, p.z);
}));
G.openPad = (i, tab) => { if (twoHalves()) G.lastPlayer = i; if (G.paused) return; G.paused = true; openPad(G, i, tab); };
G.closePad = () => { G.paused = false; };
G.closePadNow = () => { const m = document.querySelector<HTMLElement>('.modal.pad'); if (m) { m.remove(); G.paused = false; } };   // (Round V) close the Pad from outside it

// ---------- talking: quick phrases, speech bubbles, voice calls ----------
function bubble(target, text) {
  const c = document.createElement('canvas'); c.width = 512; c.height = 128; const x = c.getContext('2d');
  x.font = 'bold 44px Fredoka, "Baloo 2", sans-serif'; const w = Math.min(500, x.measureText(text).width + 50);
  x.fillStyle = '#fff'; x.strokeStyle = '#2a3a40'; x.lineWidth = 6; x.beginPath(); x.roundRect((512 - w) / 2, 6, w, 92, 40); x.fill(); x.stroke();
  x.beginPath(); x.moveTo(236, 96); x.lineTo(256, 124); x.lineTo(276, 96); x.fill();
  x.fillStyle = '#2a3a40'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(text, 256, 54);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, transparent: true, depthTest: false })); s.scale.set(3.2, .8, 1); s.renderOrder = 6;
  scene.add(s); G.bubbles.push({ s, target, until: performance.now() + 3500 });
}
G.emote = (i, id) => {
  const e = EMOTES.find(e => e.id === id), h = G.heroes[i]; if (!e || !h) return;
  bubble(h, e.icon + ' ' + T(e.en, e.vi)); h.emoteT = 2;
  say(e.en, e.vi); // (names can't be recorded: the recorded words only)
  Net.send({ t: 'emote', id });
};
// Kid-sized mute buttons: 🎵 turns music on/off, 🔊 turns sound effects and the talking voice on/off together.
G.toggleAudio = kind => {
  if (kind === 'music') { settings.music = !settings.music; if (settings.music) Music.refresh(); else Music.stop(); }
  else { const on = !(settings.sound || settings.voice); settings.sound = on; settings.voice = on; if (!on) hush(); }
  saveSettings(); SFX.tap(); G.huds.forEach(h => h.refreshAudio());
};
// (Round U) one switch at a time: music, sound effects or the talking voice (the Sound switches: js/soundsheet.js)
G.setAudio = (kind, on) => {
  settings[kind] = !!on;
  if (kind === 'music') { if (on) Music.refresh(); else Music.stop(); }
  if (kind === 'voice' && !on) hush();
  saveSettings(); G.huds.forEach(h => h.refreshAudio());
};
G.openSound = anchor => import('./soundsheet.js').then(m => m.openSoundSheet(G, anchor));
// (r63) the first tap asks for the microphone and turns it on; then each tap turns it off or on again
G.toggleMute = async () => { if (!Net.micLive) { Net.resumeAudio(); await Net.getMic(true); } else { Net.setMuted(!Net.muted); Net.resumeAudio(); } G.huds.forEach(hd => hd.setCall(Net.connected, false, Net.muted || !Net.micLive)); };
// Keyboard shortcuts on computers (shown as little key badges on the buttons). Player 1's screen.
addEventListener('keydown', e => {
  if (!playing || e.repeat || e.ctrlKey || e.metaKey || e.altKey || /INPUT|TEXTAREA|SELECT/.test((e.target instanceof Element && e.target.tagName) || '')) return;
  const k = e.code === 'KeyG' || e.key === 'g' || e.key === 'G' ? 'KeyG' : e.code;
  // Escape closes the top pop-up, chat or game card
  if (k === 'Escape') { const x = [...document.querySelectorAll<HTMLElement>('.modal .x, .vc-pop .vc-x, .chatwin .x, .dlg-close')].pop(); if (x) { x.click(); e.preventDefault(); } return; }
  if (G.paused || gameOpen() || document.querySelector<HTMLElement>('.modal, .storybook, .vc-pop')) return;
  const two = G.heroes.length > 1, i = 0;
  const map = { KeyG: () => G.openGamesHub(i), KeyM: () => G.openPad(i, 'map'), KeyB: () => G.openPad(i, 'bag'), KeyK: () => G.voiceCommand(i),
    KeyT: () => G.huds[i].toggleEmotes(), KeyC: () => Net.connected && G.toggleMute(), KeyN: () => G.toggleAudio('music'), KeyO: () => G.toggleAudio('sound'),
    KeyF: () => G.goToObjective(i), KeyP: () => G.openPad(i, 'friend'), KeyV: () => G.cycleView(i), KeyY: () => G.openWhere(i),
    Equal: () => G.zoomBy(i, .8), NumpadAdd: () => G.zoomBy(i, .8), Minus: () => G.zoomBy(i, 1.25), NumpadSubtract: () => G.zoomBy(i, 1.25) };
  if (two && ['KeyK', 'KeyT'].includes(k)) return;
  const f = map[k]; if (f) { e.preventDefault(); e.stopImmediatePropagation(); f(); }
}, true);
// the photo friends see: a 160 px copy of the child's photo. The picture has to finish loading before it can
// be copied (copying straight away gave friends a black square), so the first hello may go without it and a
// second hello follows as soon as it is ready.
const helloPhotos = new Map();
function helloPhoto(src) {
  if (!src) return null;
  if (helloPhotos.has(src)) return helloPhotos.get(src);
  helloPhotos.set(src, null);
  const im = new Image();
  im.onload = () => { try { const c = document.createElement('canvas'); c.width = c.height = 160; c.getContext('2d').drawImage(im, 0, 0, 160, 160); helloPhotos.set(src, c.toDataURL('image/jpeg', .7));
    // send it again once the room is open (it may still be opening)
    const resend = (n = 0) => { if (!G.heroes[0] || G.heroes[0].profile.photo !== src) return; if (Net.role) sendHello(); else if (n < 90) setTimeout(() => resend(n + 1), 1000); }; resend(); } catch (e) { } };
  im.src = src;
  return null;
}
function sendHello() {
  const h = G.heroes[0]; if (!h) return;
  const photo = helloPhoto(h.profile.photo);
  const friend = settings.friendsOn ? settings.friendCode : null;
  Net.send({ t: 'hello', name: h.profile.name, look: h.profile.look, photo, friend });
  return { name: h.profile.name, look: h.profile.look, photo, friend };
}
G.sendHello = sendHello;
// Friends in the same room: one avatar and name tag each.
G.partners = {};
Object.defineProperty(G, 'partner', { get: () => Object.values(G.partners)[0] || null }); // older code: the first friend
Net.on('hello', r => {
  G.netGames?.rejoined(r.id);
  const old = G.partners[r.id]; if (old) { scene.remove(old.av.root); scene.remove(old.tag); }
  const av = buildAvatar(Object.assign({ style: 'shirt', color: '#3d7fd6', hat: 'none', back: 'none', hair: '#1d1412', hairStyle: 'short', skin: '#f6c7a5', glider: 0 }, r.look || {}), r.photo);
  scene.add(av.root); const tag = nameTag((r.name || T('Friend', 'Bạn')) + (r.look && r.look.star ? ' ★' : ''), '#9ff0ff'); // (a week's star tester: ★) scene.add(tag);
  av.root.userData.own = true; // (Round V) a friend online, never a villager
  G.partners[r.id] = { id: r.id, av, tag, pos: old ? old.pos : new THREE.Vector3(0, -50, 0), yaw: 0, st: 'idle', name: r.name, look: r.look || {}, photoURL: avatarURL({ photo: r.photo, look: Object.assign({ hair: '#1d1412', skin: '#f6c7a5' }, r.look) }) };
  if (!old) { SFX.chime(); say('Your friend is here! Say hello!', 'Bạn của con đã đến! Chào bạn đi!'); toast(T(`${r.name} is here!`, `${r.name} đã đến!`)); }
  G.huds.forEach(hd => hd.setCall(true, false, Net.muted || !Net.micLive));
  if (G.onNet) G.onNet();
});
Net.on('emote', d => { const e = EMOTES.find(e => e.id === d.id), P = G.partners[d.from]; if (!e || !P) return; bubble(P, e.icon + ' ' + T(e.en, e.vi)); say(e.en, e.vi); });
// ---------- games with friends online (js/netgames.js, round G) ----------
const remoteName = id => (Net.remotes[id] && Net.remotes[id].name) || T('Your friend', 'Bạn');
G.simple = createSimple(G);
G.openSongs = start => openSongs(G, start); for (const f of familySongs()) Music.files[f.key] = f.file; // 🎵 Songs (round N)
G.netGames = createNetGames({
  net: { ids: () => Object.keys(Net.remotes), send: d => Net.send(d),sendQuiz:(to:string,gid:string,questions:import('./content/family-quiz.js').FamilyQuestion[])=>Net.sendFamilyQuiz(to,gid,questions,()=>G.netGames.session?.gid===gid&&G.netGames.session.seats.includes(to)&&!G.netGames.session.gone.has(G.netGames.session.seats.indexOf(to))) }, me: () => Net.me,
  onAsk: d => { // "Mít wants to play Caro with you!"
    if(document.querySelector('.parent-arcade,.parent-arcade-invite')){G.netGames.answer(d,false);return;}
    if (d.game === 'fruitparade' && !fruitParadeModeOn('multi')) { G.netGames.answer(d, false); return; }
    if(d.game === 'sparkleorchard' && !testerArcadeAvailable('sparkleorchard','multi') || d.game === 'sparklefruitbar' && !testerArcadeAvailable('sparklefruitbar','multi')) {G.netGames.answer(d,false);return;}
    const h = G.heroes[0], tale = /^tale-/.test(d.game) && (G.TALES || []).find(x => 'tale-' + x.id === d.game), gname = tale ? T('the story “' + tale.title() + '”', 'truyện “' + tale.title() + '”') : (GAMES[d.game] && GAMES[d.game].name()) || (d.game==='familyquiz'?T('Family Quiz','Đố Vui Gia Đình'):d.game); SFX.chime();
    say('A friend wants to play a game with you!', 'Một bạn muốn chơi trò chơi với con!');
    const stars = '⭐'.repeat(d.level || 1);
    dialog(remoteName(d.from), [[`🎲 ${remoteName(d.from)} wants to play ${gname} with you! (${stars})`, `🎲 ${remoteName(d.from)} muốn chơi ${gname} với con! (${stars})`, 'Your friend wants to play a game with you!', 'Bạn của con muốn chơi một trò với con!']], [['▶ Play', '▶ Chơi'], ['Not now', 'Để sau']])
      .then(k => { G.netGames.answer(d, k === 0 && !gameOpen() && !!h); if (k === 0) G.closePadNow(); });   // (Round V) yes closes the Friends page
  },
  onStart: (s, ask) => {
    if (!s) { toast(T('Nobody could play just now. Try again later!', 'Lúc này chưa bạn nào chơi được. Lát nữa thử lại nhé!')); return; }
    if (s.game === 'fruitparade' && !fruitParadeModeOn('multi')) { G.netGames.leave(); return; }
    if(s.game === 'sparkleorchard' && !testerArcadeAvailable('sparkleorchard','multi') || s.game === 'sparklefruitbar' && !testerArcadeAvailable('sparklefruitbar','multi')) {G.netGames.leave();return;}
    const names = s.seats.map(id => id === Net.me ? G.heroes[0].profile.name : remoteName(id));
    // every move is tied to this game: a story or game that is still winding down can't send into (or end) a newer one
    const live = () => !!G.netGames.session && G.netGames.session.gid === s.gid, end = () => { if (live()) G.netGames.leave(); };
    const online = { mine: s.mine, names, seed: s.gid, size: s.size, connected: () => !!Net.connected, present: seat => seat === s.mine || !s.gone.has(seat) && !!Net.remotes[s.seats[seat]], leave: end,familyQuiz:()=>live()?G.netGames.familyQuiz():null,shareFamilyQuiz:(questions:import('./content/family-quiz.js').FamilyQuestion[])=>live()&&G.netGames.shareFamilyQuiz(questions),requestFamilyQuiz:()=>{if(live())G.netGames.requestFamilyQuiz();}, peek: (n, seat) => live() ? G.netGames.session?.moves.get(n)?.get(seat) : undefined, onMove: f => live() ? G.netGames.onMove(f) : undefined, move: (n, mv) => live() && G.netGames.move(n, mv), next: (n, seat) => live() ? G.netGames.next(n, seat) : Promise.resolve(null), all: n => live() ? G.netGames.all(n) : Promise.resolve([]) };
    if (/^tale-/.test(s.game)) { // a tale read together: page turns travel as moves
      const t = (G.TALES || []).find(x => 'tale-' + x.id === s.game); if (!t || !G.readTaleNow) { end(); return; }
      let seq = 0; const sync = { send: p => online.move(seq++, p), listen: fn => online.onMove((seat, n, mv) => { if (seat !== s.mine) fn(mv); }) };
      G.readTaleNow(G.heroes[0], t, sync).finally(end); return;
    }
    // (Round V, owner 13 Oct) the Friends page closes when the game starts (it stayed in front of the game); "Play again"
    // after a game with friends asks the same friends again (it did nothing)
    G.closePadNow();
    G.playGameOnline(s.game, s.level || 1, online).then(res => { end(); if (res && res.next === 'again') setTimeout(() => G.inviteGame(s.game, s.seats.find(id => id !== Net.me), s.level || 1, s.size), 400); }, end);
  },
  onEnd: id => toast(T(`${remoteName(id)} left the game.`, `${remoteName(id)} đã rời trò chơi.`))
});
for (const k of ['gask', 'gyes', 'gno', 'gstart', 'gmove', 'gbye','gquiz','gquizreq']) Net.on(k, d => G.netGames.receive(d));
// first come, first served pickups when playing together (js/claims.js)
G.claims = createClaims(G, { net: { connected: () => Net.connected, send: d => Net.send(d), name: id => remoteName(id) }, toast: (h, m) => hudFor(h).toast(m), say, T });
Net.on('claim', d => G.claims.receive(d));
// invite: one friend to a two-player game, or everyone in the room to a party game
// (owner, round G: in games with friends the players choose how hard it is: the one who invites picks 1 to 5)
G.together = () => Net.connected && Object.keys(Net.remotes).length > 0 && !G.netGames.session;
// (r63, owner: the children choose, e.g. a bigger Caro board) Caro also asks the board's size, 3 to 19 squares a side
const CARO_SIZES = [3, 6, 9, 13, 15, 19];
// (Round V, owner 13 Oct: "add a coop game button, then it shows a list of games") every game to play with the friends in the
// room on one page: the games made for friends (turns on each device), any game raced side by side, and stories read together
G.openPlayTogether = () => {
  const ids = Object.keys(Net.remotes); if (!ids.length) { toast(T('Nobody is in your room yet.', 'Chưa có bạn nào trong phòng.')); return; }
  const little = G.heroes[0].profile.age !== 'big', made = Object.keys(ONLINE_GAMES).filter(id => (id !== 'sparklefruitbar' || testerArcadeAvailable('sparklefruitbar','multi')) && (id !== 'sparkleorchard' || testerArcadeAvailable('sparkleorchard','multi')) && GAMES[id] && (id !== 'fruitparade' || fruitParadeModeOn('multi')));
  const race = Object.keys(GAMES).filter(id => !ONLINE_GAMES[id] && (!little || !gameInfoAge(id) || gameInfoAge(id) < 5)), tales = (G.TALES || []).slice(0, 12);
  const btn = (id: string, sub?: string) => `<button class="pt-g" data-g="${esc(id)}" aria-label="${esc(GAMES[id].name())}">${pic(GAMES[id].icon)}<b>${esc(GAMES[id].name())}</b>${sub ? `<small>${sub}</small>` : ''}</button>`;
  const turnGames = made.filter(id => !ONLINE_GAMES[id].all);
  const groupGames = made.filter(id => ONLINE_GAMES[id].all);
  const m = modal('playtogether', `<button class="x" aria-label="${T('Close', 'Đóng')}">✕</button><h2>${pic('🎲')} ${T('Play together', 'Chơi cùng nhau')}</h2>
    <div class="pt-grid pt-made">
      ${turnGames.length ? `<h3 style="grid-column:1/-1">${pic('🎲')} ${T('Board and turn-taking', 'Bàn cờ và lần lượt')}</h3>${turnGames.map(id => btn(id, T(`up to ${ONLINE_GAMES[id].max}`, `tối đa ${ONLINE_GAMES[id].max}`))).join('')}` : ''}
      ${groupGames.length ? `<h3 style="grid-column:1/-1">${pic('👫')} ${T('Team and cooperative', 'Đồng đội và hợp tác')}</h3>${groupGames.map(id => btn(id, T(`up to ${ONLINE_GAMES[id].max}`, `tối đa ${ONLINE_GAMES[id].max}`))).join('')}` : ''}
    </div>
    <h3>${pic('🏁')} ${T('Race side by side', 'Thi đua cùng nhau')} <small>${T('everyone plays the same game, stars for all', 'mọi người chơi cùng một trò, ai cũng có sao')}</small></h3><div class="pt-grid">${race.map(id => btn(id)).join('')}</div>
    ${tales.length ? `<h3>${pic('📖')} ${T('Read a story together', 'Đọc truyện cùng nhau')}</h3><div class="pt-grid">${tales.map(t => `<button class="pt-g" data-g="tale-${esc(t.id)}" aria-label="${esc(t.title())}">${pic('📖')}<b>${esc(t.title())}</b></button>`).join('')}</div>` : ''}`);
  m.querySelector('.x').onclick = () => m.close();
  m.querySelectorAll('[data-g]').forEach(b => b.onclick = () => { SFX.tap(); m.close(); G.inviteGame(b.dataset.g, ids[0]); });
  return m;
};
G.inviteGame = (game, to, level, size) => {
  if(game === 'sparkleorchard' && !testerArcadeAvailable('sparkleorchard','multi') || game === 'sparklefruitbar' && !testerArcadeAvailable('sparklefruitbar','multi')) return;
  if (game === 'fruitparade' && !fruitParadeModeOn('multi')) { toast(T('Sparkle Fruit Parade is not available yet.', 'Diễu hành trái cây lấp lánh chưa mở.')); return; }
  const p = G.heroes[0].profile;
  if (level == null) return new Promise(res => {
    const m = modal('gamelevel', `<button class="x" aria-label="${T('Close', 'Đóng')}">✕</button><h2>${pic(GAMES[game] ? GAMES[game].icon : '🎲')} ${esc(GAMES[game] ? GAMES[game].name() : game)}</h2>
      ${game === 'caro' ? `<p class="note center">${T('First, how big is the board?', 'Trước hết, bàn cờ to cỡ nào?')}</p><div class="lvl-pick caro-size">${CARO_SIZES.map(n => `<button class="btn ${n === (G.caroSize || 6) ? 'primary' : ''}" data-size="${n}"><b>${n} × ${n}</b><small>${n <= 3 ? T('3 in a row', '3 hình liền') : n <= 6 ? T('4 in a row', '4 hình liền') : T('5 in a row', '5 hình liền')}</small></button>`).join('')}</div>` : ''}
      <p class="note center">${T('How hard? Everyone plays at this level.', 'Khó cỡ nào? Mọi người chơi cùng một cấp.')}</p>
      <div class="lvl-pick">${[1, 2, 3, 4, 5].map(l => `<button class="btn ${l === Math.min(5, p.levels[game] || 1) ? 'primary' : ''}" data-lvl="${l}"><b>${'⭐'.repeat(l)}</b><small>${[T('Very easy', 'Rất dễ'), T('Easy', 'Dễ'), T('Medium', 'Vừa'), T('Hard', 'Khó'), T('Very hard', 'Rất khó')][l - 1]}</small></button>`).join('')}</div>`);
    m.querySelector('.x').onclick = () => { m.close(); res(null); };
    m.querySelectorAll('[data-size]').forEach(b => b.onclick = () => { SFX.tap(); G.caroSize = +b.dataset.size; m.querySelectorAll('[data-size]').forEach(x => x.classList.toggle('primary', x === b)); });
    m.querySelectorAll('[data-lvl]').forEach(b => b.onclick = () => { SFX.tap(); m.close(); res(G.inviteGame(game, to, +b.dataset.lvl, game === 'caro' ? (G.caroSize || 6) : undefined)); });
  });
  const gid = G.netGames.invite(game, Math.max(1, Math.min(5, level)), (onlineDef(game) || {}).all ? undefined : to, { size });
  if (gid) toast(T('Invitation sent! Waiting for an answer…', 'Đã gửi lời mời! Đang chờ trả lời…')); return gid;
};
G.playGameOnline = async (id, level, online) => {
  if(id==='familyquiz')(await import('./games/familyquiz.js')).registerFamilyQuiz();
  if(id === 'sparklefruitbar' && !testerArcadeAvailable('sparklefruitbar','multi'))return;
  if(id === 'sparkleorchard' && !testerArcadeAvailable('sparkleorchard','multi'))return;
  if (id === 'fruitparade' && !fruitParadeModeOn('multi')) return;
  if (gameOpen()) return; G.paused = true; hush();
  const p = G.heroes[0].profile, little = p.age !== 'big';
  const actId = makeId('act', id, String(++G.actCount)), playerIds = online.names.map((_, s) => s === online.mine ? makeId('player', p.id || 'guest') : makeId('player', 'online-' + s));
  events.emit('ActivityStarted', { activityId: actId, kind: 'game', defId: makeId('game', id), players: playerIds, source: 'online' });
  const res = await openGame(id, { players: [p], level, little, strong: false, online, style: 'village' });
  G.paused = false;
  if (res.won && id !== 'sparklefruitbar') { events.emit('ActivityCompleted', { activityId: actId, defId: makeId('game', id), players: playerIds, result: { won: true, stars: res.stars || 0, level } }); farm.coins += 5; save(); }
  else events.emit('ActivityAbandoned', { activityId: actId, reason: 'left' });
  return res;
};

Net.on('left', r => {
  G.netGames.left(r.id);
  const P = G.partners[r.id]; if (P) { scene.remove(P.av.root); scene.remove(P.tag); delete G.partners[r.id]; }
  if (!Net.connected || !Object.keys(G.partners).length) G.huds.forEach(hd => hd.setCall(false));
  toast(T(`${r.name || 'Your friend'} left.`, `${r.name || 'Bạn'} đã rời đi.`)); if (G.onNet) G.onNet();
});
// "Come and meet me!": a friend asks you to come to where they are
Net.on('meet', d => {
  const P = G.partners[d.from]; if (!P || !G.heroes[0]) return;
  SFX.chime(); bubble(P, '📣 ' + T('Come here!', 'Lại đây nè!'));
  dialog(P.name, [[`📣 ${P.name} wants to meet you! Shall we go?`, `📣 ${P.name} muốn gặp con! Mình đi nhé?`, 'Your friend wants to meet you! Shall we go?', 'Bạn của con muốn gặp con! Mình đi nhé?']], [['👣 Walk there', '👣 Đi bộ đến'], ['✨ Fly there', '✨ Bay đến'], ['🙂 Not now', '🙂 Để sau']])
    .then(k => { const h = G.heroes[0]; if (k === 0) G.walkToFriend(h, P.id); if (k === 1) G.flyToFriend(h, P.id); if (k === 2) Net.send({ t: 'emote', id: 'wait' }); });
});
G.flyToFriend = (h, id) => { const P = G.partners[id]; if (!P || P.pos.y < -40) return; G.travel(h, P.pos.x - 4.5 + 1.5, P.pos.z - 1 + 1.5); setTimeout(() => { bubble(h, '👋 ' + T('Hi!', 'Chào!')); Net.send({ t: 'emote', id: 'hi' }); }, 900); };
G.followFriend = (i, id) => { const h = G.heroes[i]; if (!h) return; if (h.followId === id) { h.followId = null; h.goal = null; hudFor(h).toast('👣 ' + T('Stopped following.', 'Ngừng đi theo.')); return; } h.followId = id; const nm2 = remoteName(id); hudFor(h).toast('🚶 ' + T(`Following ${nm2}. Move the joystick to stop.`, `Đang đi theo ${nm2}. Đẩy cần điều khiển để dừng.`)); say('Follow your friend!', 'Đi theo bạn nào!'); };
G.walkToFriend = (h, id) => { const P = G.partners[id]; if (!P || P.pos.y < -40) return; h.walkTo = { friend: id, x: P.pos.x, z: P.pos.z, name: P.name }; say('Follow the footprints to your friend!', 'Đi theo dấu chân đến chỗ bạn nhé!'); };
G.askFriendToCome = (h, id) => { const P = G.partners[id]; if (!P) return; Net.send({ t: 'meet', to: id }); bubble(h, '📣 ' + T('Come here!', 'Lại đây nè!')); hudFor(h).toast('📣 ' + T(`Asked ${P.name} to come to you`, `Đã gọi ${P.name} đến chỗ con`)); };
// where are my friends? a little card with each friend's distance and direction, and ways to meet
const compass = (h, x, z) => { const a = Math.atan2(x - h.pos.x, -(z - h.pos.z)); return ['⬆️ ' + T('north', 'phía bắc'), '↗️ ' + T('north-east', 'đông bắc'), '➡️ ' + T('east', 'phía đông'), '↘️ ' + T('south-east', 'đông nam'), '⬇️ ' + T('south', 'phía nam'), '↙️ ' + T('south-west', 'tây nam'), '⬅️ ' + T('west', 'phía tây'), '↖️ ' + T('north-west', 'tây bắc')][(Math.round(a / (Math.PI / 4)) + 8) % 8]; };
G.friendWhere = (h, P) => { const rg = regionAt(P.pos.x, P.pos.z); return (REGION_NAMES[rg] ? REGION_NAMES[rg]() : ''); };
G.findFriend = i => {
  const h = G.heroes[i]; if (!h) return null;
  const list = Object.values(G.partners).filter(P => P.pos.y > -40);
  if (!list.length) { G.openPad(i, 'friend'); return ['No friends are in your room yet. Start a room and tell your friend the number!', 'Chưa có bạn nào trong phòng. Tạo phòng rồi đọc số cho bạn nhé!']; }
  document.querySelector<HTMLElement>('.vc-pop')?.remove();
  const pop = el('div', 'vc-pop friendfind', `<p class="vc-heard">👫 ${T('Where are my friends?', 'Bạn của con ở đâu?')}</p>
    ${list.map(P => { const d = Math.round(dist2(h.pos.x, h.pos.z, P.pos.x, P.pos.z)); return `<div class="ff-row"><img src="${P.photoURL || ''}" alt="" ${P.photoURL ? '' : 'hidden'}><div class="ff-txt"><b>${esc(nm(P.name))}</b><small>${d} m · ${compass(h, P.pos.x, P.pos.z)}${G.friendWhere(h, P) ? ' · ' + esc(G.friendWhere(h, P)) : ''}</small></div>
      <div class="ff-btns"><button class="btn primary" data-walk="${P.id}">👣 ${T('Walk', 'Đi bộ')}</button><button class="btn" data-fly="${P.id}">✨ ${T('Fly', 'Bay')}</button><button class="btn" data-call="${P.id}">📣 ${T('Ask to come', 'Gọi bạn đến')}</button></div></div>`; }).join('')}`);
  const x = el('button', 'vc-x', '✕'); pop.appendChild(x); x.onclick = () => pop.remove();
  document.body.appendChild(pop); SFX.tap(); G.walkAwayClose(pop, () => pop.remove());
  pop.querySelectorAll('[data-walk]').forEach(b => b.onclick = () => { pop.remove(); G.walkToFriend(h, b.dataset.walk); });
  pop.querySelectorAll('[data-fly]').forEach(b => b.onclick = () => { pop.remove(); G.flyToFriend(h, b.dataset.fly); });
  pop.querySelectorAll('[data-call]').forEach(b => b.onclick = () => { pop.remove(); G.askFriendToCome(h, b.dataset.call); });
  return null;
};
// the signal bars change every few seconds: only their words are updated (round O, owner: the Friends screen was
// redrawn whole every two seconds, so a tap could land on a button that had just been replaced and ✕ seemed stuck)
Net.on('quality', () => { const b = document.querySelector<HTMLElement>('.pad .online.on'); if (b && G.netTick) G.netTick(b); });
addEventListener('online', () => { toast(T('Back online!', 'Có mạng lại rồi!')); G.listenFriends && G.listenFriends(); });
addEventListener('offline', () => toast(T('No internet right now. Friends will come back when it returns.', 'Đang mất mạng. Khi có mạng lại, các bạn sẽ quay lại.')));
Net.on('micchange', () => G.huds.forEach(hd => hd.setCall(Net.connected, false, Net.muted || !Net.micLive)));
Net.on('talking', on => G.huds.forEach(hd => hd.setCall(Net.connected, on, Net.muted || !Net.micLive)));
const _np = new THREE.Vector3();
let netStatus = '';
Net.on('status', s => {
  let msg = {
    waiting: T(`Room code: ${s.code}. Tell your friend this number!`, `Mã phòng: ${s.code}. Đọc số này cho bạn nhé!`), connecting: T('Connecting…', 'Đang kết nối…'), connected: T('Connected! You can talk now.', 'Đã kết nối! Giờ có thể nói chuyện rồi.'),
    nocode: T('No room with that number. Check the code.', 'Không có phòng số này. Kiểm tra lại mã nhé.'),
    mictap: T('Your microphone is off. Tap 🎙️ Mic to talk to your friend.', 'Micrô đang tắt. Chạm nút 🎙️ Micrô để nói chuyện với bạn nhé.'),
    micdenied: T('The microphone is switched off for this game. A grown-up can allow it: iPhone Settings → Safari (or the game) → Microphone → Allow.', 'Micrô đang bị tắt cho trò chơi này. Người lớn có thể bật: Cài đặt iPhone → Safari (hoặc trò chơi) → Micrô → Cho phép.'),
    micbusy: T('Another app or a call (like FaceTime) is using the microphone. End the call, then tap 🎙️ Mic again.', 'Một ứng dụng khác hoặc cuộc gọi (như FaceTime) đang dùng micrô. Hãy tắt cuộc gọi rồi chạm 🎙️ Micrô lần nữa nhé.'),
    micask: T('Asking for the microphone… On iPhone or iPad, tap Allow.', 'Đang xin dùng micrô… Trên iPhone hoặc iPad, chạm Cho phép nhé.'),
    micold: T('This iPhone or iPad cannot use the microphone in the game. A grown-up can update it to iOS 14.3 or newer, or open the game in Safari.', 'iPhone hoặc iPad này chưa dùng được micrô trong trò chơi. Người lớn có thể cập nhật lên iOS 14.3 trở lên, hoặc mở trò chơi trong Safari.'),
    micon: T('Microphone on: your friend can hear you!', 'Đã bật micrô: bạn có thể nghe con nói rồi!'),
    micstop: T('The iPhone switched the microphone off (the game went to the background). Tap 🎙️ Mic to turn it on again.', 'iPhone đã tắt micrô (khi trò chơi chạy nền). Chạm 🎙️ Micrô để bật lại nhé.'),
    micstuck: T('The iPhone has not answered. Close the game fully (swipe it away), open it again, then tap 🎙️ Mic.', 'iPhone chưa trả lời. Hãy tắt hẳn trò chơi (vuốt lên để đóng), mở lại rồi chạm 🎙️ Micrô nhé.'),
    nomic: T('No microphone: your friend will not hear you, but you can still play and use the talk buttons.', 'Không có micrô: bạn sẽ không nghe được con, nhưng vẫn chơi và dùng nút nói được.'),
    left: T('The room has closed.', 'Phòng đã đóng.'), full: T('That room is full (6 players). Start your own room!', 'Phòng đã đủ 6 người. Hãy tạo phòng mới nhé!'), tapaudio: T('Tap the 🎙️ button to hear your friend.', 'Chạm nút 🎙️ để nghe bạn nói.'), cloud: T('Connected through the cloud relay! You can play and use the talk buttons. (Voice calls need a direct link: try both on Wi-Fi, or ask a grown-up to add a relay.)', 'Đã kết nối qua mạng đám mây! Chơi và dùng nút nói được. (Gọi bằng giọng nói cần kết nối trực tiếp: thử cả hai dùng Wi-Fi, hoặc nhờ người lớn thêm máy chủ trung chuyển.)'), error: T('Could not connect. Check the internet and try again.', 'Không kết nối được. Kiểm tra mạng rồi thử lại.'),
    removed: T('The room’s starter asked you to leave the room.', 'Chủ phòng đã mời con ra khỏi phòng.'),
    off: T('Playing with friends is off. Ask a grown-up to turn it on.', 'Chơi cùng bạn đang tắt. Nhờ người lớn bật lên nhé.'),
    knocking: T('Knock knock! Waiting for the room’s starter to let you in…', 'Cốc cốc! Đang chờ chủ phòng cho con vào…'),
    oldmap: T('Your friend has a different valley. Ask a grown-up to update the game.', 'Thung lũng của bạn khác với của con. Nhờ người lớn cập nhật trò chơi nhé.'),
    denied: T('The room’s starter said not this time. You can start your own room!', 'Chủ phòng chưa cho vào lần này. Con có thể tự tạo phòng nhé!'),
    noanswer: T('Nobody opened the door. Ask your friend to tap “Let in”, or start your own room.', 'Chưa ai mở cửa. Nhờ bạn chạm “Cho vào”, hoặc tự tạo phòng nhé.'),
    slow: T('Still connecting… This can take a little longer when you are on different networks.', 'Vẫn đang kết nối… Khi hai máy ở hai mạng khác nhau có thể lâu hơn một chút.'),
    stuck: T('Could not link the two devices. Try: both on Wi-Fi (or both on mobile data), start the room on the other device, or ask a grown-up to add a relay in Grown-ups → Internet and playing online.', 'Không nối được hai máy. Thử: cả hai dùng Wi-Fi (hoặc cả hai dùng 4G), để máy kia tạo phòng, hoặc nhờ người lớn thêm máy chủ trung chuyển trong mục Phụ huynh → Internet và chơi trực tuyến.')
  }[s.key] || '';
  if (s.key === 'oldmap') G.mapCard();
  if (s.key === 'waiting') { const code = s.code; msg = T(`Room code: ${code} (${animalSay(code)}). Tell your friend!`, `Mã phòng: ${code} (${animalSay(code)}). Đọc cho bạn nhé!`); }
  // with Friends open the message shows in it, not over its tabs (round O)
  netStatus = msg; if (msg && s.key !== 'oldmap' && !document.querySelector<HTMLElement>('.pad .online')) toast(msg); /* (the map card says it) */ if (G.onNet) G.onNet(); if (['waiting', 'connected', 'cloud', 'left'].includes(s.key)) G.shareStatus();
});
// Knock knock: someone wants to come into my room. The room's starter sees their name and picture and decides;
// they hear and see nothing of the room until then. Saved friends come straight in (net.js).
let knockPop = null;
const showKnock = () => {
  const k = [...Net.knocks.values()].sort((a, b) => a.at - b.at)[0];
  if (!k) { if (knockPop) { knockPop.remove(); knockPop = null; } return; }
  if (knockPop && knockPop.isConnected && knockPop.dataset.id === k.id) return;
  if (knockPop) knockPop.remove();
  const name = k.name || T('Someone', 'Một bạn');
  knockPop = el('div', 'vc-pop knockpop', `<p class="vc-heard">🚪 ${T('Knock knock!', 'Cốc cốc!')}</p><div class="ff-row"><img src="${avatarURL({ photo: k.photo, look: Object.assign({ hair: '#1d1412', skin: '#f6c7a5' }, k.look) })}" alt=""><div class="ff-txt"><b>${esc(nm(name))}</b><small>${T('wants to come into your room', 'muốn vào phòng của con')}</small></div></div>
    <div class="ff-btns"><button class="btn primary" data-in>✅ ${T('Let in', 'Cho vào')}</button><button class="btn" data-no>❌ ${T('No thanks', 'Không, cảm ơn')}</button></div>
    <small class="note">${T('Only let in someone you know. A grown-up can help.', 'Chỉ cho người con biết vào thôi. Người lớn có thể giúp con.')}</small>`);
  knockPop.dataset.id = k.id; document.body.appendChild(knockPop); SFX.chime();
  say('Someone is knocking. Do you want to let them in?', 'Có bạn đang gõ cửa. Con có muốn cho bạn vào không?'); // (the name and photo are on the card)
  knockPop.querySelector('[data-in]').onclick = () => { SFX.tap(); Net.admit(k.id); };
  knockPop.querySelector('[data-no]').onclick = () => { SFX.tap(); Net.deny(k.id); };
};
Net.on('knock', () => { showKnock(); if (G.onNet) G.onNet(); });
// ---------- friends: codes, invites, the online panel ----------
const CODE_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
if (!settings.friendCode) { settings.friendCode = Array.from({ length: 6 }, () => CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)]).join(''); saveSettings(); }
if (!Array.isArray(settings.friends)) settings.friends = [];
// online by default: a child who has friends on the list lets them see when they are playing (from round 28 on;
// a grown-up or the child can still switch it off in the online panel). (round R privacy, 9 Oct) only once a grown-up
// has turned online play on: until then nothing is shared at all
if (settings.online && settings.friends.length && !settings.friendsOnR28) { settings.friendsOn = true; settings.friendsOnR28 = true; saveSettings(); }
// leaving a room with friends in it to go to another one is asked first (round O)
const leaveOk = async () => !(Net.role && Net.count > 1) || (await dialog(T('Your room', 'Phòng của con'), [[`You are playing with ${Object.values(Net.remotes).map(r => nm(r.name)).join(', ')}. Leave this room?`, `Con đang chơi với ${Object.values(Net.remotes).map(r => nm(r.name)).join(', ')}. Rời phòng này nhé?`, 'You are playing with friends. Leave this room?', 'Con đang chơi với các bạn. Rời phòng này nhé?']], [['✅ Leave and go', '✅ Rời và sang'], ['❌ Stay', '❌ Ở lại']])) === 0;
// (Online, r57, ROUND-T §4) a friend on another map layout can't play together (positions are raw x, z): a picture card
// with a voice instead of joining (owner, 11 Oct: only the one who wanted to join is told)
G.mapCard = () => {
  document.querySelectorAll<HTMLElement>('.modal.mapcard').forEach(m => m.remove());
  const m = modal('mapcard', `<div class="mc-pic">${pic('🗺️')}</div><h2>${T('Different valley', 'Thung lũng khác')}</h2>
    <p class="center">${T('Your friend has a different valley. Ask a grown-up to update the game.', 'Thung lũng của bạn khác với của con. Nhờ người lớn cập nhật trò chơi nhé.')}</p>
    <div class="actions center"><button class="btn primary big" data-ok>${T('OK', 'Được rồi')}</button></div>`);
  say('Your friend has a different valley. Ask a grown-up to update the game.', 'Thung lũng của bạn khác với của con. Nhờ người lớn cập nhật trò chơi nhé.');
  m.querySelector('[data-ok]').onclick = () => { SFX.tap(); m.close(); };
};
const onInvite = async inv => {
  if (!settings.online) return;
  if (!Net.sameMap(inv.map)) { SFX.chime(); G.mapCard(); return; } // (r57) another map layout: the card instead of joining
  SFX.chime(); say('A friend invites you to play!', 'Một bạn mời con chơi cùng!');
  const k = await dialog(T('Invitation', 'Lời mời'), [[`👫 ${inv.name} invites you to play together! Join their room ${inv.room}?`, `👫 ${inv.name} mời con chơi cùng! Vào phòng ${inv.room} nhé?`, 'A friend invites you to play together! Shall we join?', 'Một bạn mời con chơi cùng! Mình vào nhé?']], [['✅ Join', '✅ Vào'], ['❌ Not now', '❌ Để sau']]);
  // (round R privacy) the invitation came locked from a saved friend; when they started the room, only their key may answer the knock
  if (k === 0 && await leaveOk()) Net.join(inv.room, sendHello() || {}, { hostPub: inv.hostPub });
};
// invite a friend: into my room, starting one first when I have none
// (round R privacy, 9 Oct) an invitation carries my room number locked for that friend, so it needs the friend's key, saved
// when the two played together and tapped ＋👫: 'nokey' without it (the child is told to say the room number instead)
G.inviteFriend = async code => {
  if (!settings.online) return false;
  if (!Net.canInvite(code)) return 'nokey';
  const h = G.heroes[0]; if (!Net.role) await Net.host(sendHello() || {});
  if (Net.role !== 'host' && Net.role !== 'guest') return false;
  const both = await Promise.all([Net.invite(code, h ? h.profile.name : ''), Net.cloudInvite(code, h ? h.profile.name : '')]);
  return both[0] || both[1];
};
const inviteToast = ok => toast(ok === 'nokey' ? T('Invitations work after you have played together once and tapped ＋👫. For now, tell your friend your room number.', 'Lời mời dùng được sau khi hai bạn đã chơi cùng một lần và chạm ＋👫. Bây giờ con đọc số phòng cho bạn nhé.') : ok ? T('Invitation sent!', 'Đã gửi lời mời!') : T('Your friend is not online right now.', 'Bạn ấy đang không trực tuyến.'));
G.joinFriend = async (room, hostPub) => { if (await leaveOk()) await Net.join(room, sendHello() || {}, { hostPub }); };
G.listenFriends = () => {
  // (round R privacy, 9 Oct) online play off: no listening, no status, nothing shared
  if (!settings.online || !playing) { Net.stopListening(); Net.friendsStop(); return; }
  if (settings.friendsOn) Net.listenForFriends(settings.friendCode, onInvite); else Net.stopListening();
  // friends' status (online, where in the valley, which room) through the cloud relay
  if (playing && (settings.friendsOn || settings.friends.length)) {
    Net.friendsStart({ code: settings.friendCode, share: !!settings.friendsOn, onInvite, onChange: () => { if (G.onNet) G.onNet(); G.autoMeet(); } }).then(() => { Net.friendsWatch(settings.friends.map(f => f.code)); G.shareStatus(); });
  } else Net.friendsStop();
};
// Friends: told, never moved (round O, owner: "if a friend comes online, don't put us in one room by ourselves, just
// tell the player; if my friend and A are in one room and I have B in another, how would that work?"). When a friend
// on the list starts playing, a small card says so once, with 📨 Invite (into my room; a room is started when I have
// none) and, when they are already in a room, ▶ Go to their room (with friends in my room, it asks before leaving).
// Nobody changes room unless they tap; the friend who is invited decides too.
const told = new Set();
G.autoMeet = () => {
  if (!playing || !settings.online || settings.autoMeet === false || !settings.friendsOn || !settings.friends.length) return;
  const now = Date.now();
  for (const f of settings.friends) {
    const st = Net.friends.status[f.code], on = st && st.online && now - (st.seen || 0) < 3 * 60000;
    if (!on) { told.delete(f.code); continue; }
    if (told.has(f.code) || (st.room && st.room === Net.code)) { told.add(f.code); continue; }
    if (gameOpen() || (G.worldHidden && G.worldHidden() && !(G.simple && G.simple.open)) || document.querySelector<HTMLElement>('.friendnote, .storybook, .dialog, .modal, .theatre')) continue; // (later: not over a game, a story or a question)
    told.add(f.code); friendNote(f, st);
  }
};
function friendNote(f, st) {
  const name = nm(st.name || f.name), where = st.at && REGION_NAMES[st.at] ? REGION_NAMES[st.at]() : '';
  const pop = el('div', 'vc-pop friendnote', `<p class="vc-heard">🟢 ${esc(T(`${name} is playing!`, `${name} đang chơi!`))}</p><div class="ff-row"><div class="ff-txt"><small>${esc(where)}${st.room ? ' · ' + T('in a room', 'đang ở trong phòng') + ` (${(st.players || 1)}/${MAX_ROOM})` : ''}</small></div></div>
    <div class="ff-btns"><button class="btn primary" data-inv>📨 ${T('Invite', 'Mời bạn')}</button>${st.room && (st.players || 1) < MAX_ROOM && Net.sameMap(st.map) ? `<button class="btn" data-go>▶ ${T('Go to their room', 'Sang phòng bạn')}</button>` : ''}<button class="btn" data-no>${T('Later', 'Để sau')}</button></div>`);
  document.body.appendChild(pop); SFX.chime(); say('Your friend is playing too!', 'Bạn của con cũng đang chơi!');
  const close = () => { pop.remove(); clearTimeout(t); }, t = setTimeout(close, 45000);
  pop.querySelector('[data-no]').onclick = () => { SFX.tap(); close(); };
  pop.querySelector('[data-inv]').onclick = async () => { SFX.tap(); close(); inviteToast(await G.inviteFriend(f.code)); };
  const go = pop.querySelector('[data-go]'); if (go) go.onclick = () => { SFX.tap(); close(); G.joinFriend(st.room, st.host ? f.pub : null); };
}
setInterval(() => G.autoMeet(), 12000);
// what my friends see about me (only when sharing is switched on): (round R privacy, 9 Oct) everyone with my friend code
// sees only "playing now"; my name, the place I am in and my room go locked to each saved friend whose key I have (net.js)
G.shareStatus = () => { const h = G.heroes[0]; if (!h || !settings.online || !settings.friendsOn) return; Net.friendsShare({ map: Net.mapVersion, name: h.profile.name, at: G.regionOf[0] || '', room: Net.role && !Net.knocking ? Net.code : null, players: Net.role ? Net.count : 0, host: Net.role === 'host' }); };
setInterval(() => { if (playing) G.shareStatus(); }, 45000);
// signal bars: ▂▄▆█ with the strong ones lit
G.netQuality = id => Net.quality(id);
G.barsHTML = n => `<span class="bars b${n}" aria-label="${n}/4"><i></i><i></i><i></i><i></i></span>`;
const routeName = r => r === 'cloud' ? T('cloud relay', 'qua mạng đám mây') : T('direct', 'trực tiếp');
const friendStatus = f => {
  const st = Net.friends.status[f.code];
  if (!st) return `<small class="fst off">⚪ ${T('Not seen yet', 'Chưa thấy')}</small>`;
  if (!st.online || Date.now() - (st.seen || 0) > 3 * 60000) { const m = st.lastOnline ? Math.max(1, Math.round((Date.now() - st.lastOnline) / 60000)) : null; return `<small class="fst off">⚪ ${T('Offline', 'Đang tắt')}${m ? ' · ' + (m < 60 ? T(`${m} min ago`, `${m} phút trước`) : T(`${Math.round(m / 60)} h ago`, `${Math.round(m / 60)} giờ trước`)) : ''}</small>`; }
  const where = st.at && REGION_NAMES[st.at] ? REGION_NAMES[st.at]() : T('in the valley', 'trong thung lũng');
  return `<small class="fst on">🟢 ${T('Online', 'Đang chơi')} · ${esc(where)}${st.room ? ' · ' + T('room', 'phòng') + ' ' + esc(st.room) : ''}</small>`;
};
// (round R privacy, 9 Oct) a friend made in a room (＋👫) is saved with their key: it lets them straight into my room later
// (if they can prove it), and locks invitations and "where I am" notes for them alone
const addFriend = (code: string, name?: string, pub?: string) => { code = String(code || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6); if (code.length !== 6 || code === settings.friendCode) return false; let f = settings.friends.find(x => x.code === code); if (f) { if (name) f.name = name; } else settings.friends.push(f = { code, name: name || code }); if (okPub(pub)) f.pub = pub; settings.friendsOn = true; saveSettings(); G.listenFriends(); return true; };
// (Round V, owner 13 Oct) the microphone test for grown-ups (js/mictest.js), with or without a room
const micTestHTML = () => `<p class="center"><button class="btn" data-mictest>🎙️ ${T('Microphone test (grown-ups)', 'Thử micrô (người lớn)')}</button></p>`;
const netLineHTML = () => (n => `<p class="note center netline">📶 ${T('This device', 'Máy này')}: ${n.online ? (n.type ? esc(n.type) + ' · ' : '') + (n.eff ? esc(n.eff.toUpperCase()) + ' · ' : '') + (n.down ? n.down + ' Mbps · ' : '') : T('no internet!', 'mất mạng!') + ' · '}${n.cloud ? T(`cloud relay on (${n.brokers} server${n.brokers === 1 ? '' : 's'})`, `đang dùng mạng đám mây (${n.brokers} máy chủ)`) : T('direct link', 'kết nối trực tiếp')}${n.voice ? ' · 🎙️ ' + T('voice on', 'đang gọi') : n.cloud ? ' · ' + T('voices can’t travel over the cloud relay yet: use 💬', 'giọng nói chưa đi qua mạng đám mây được: dùng nút 💬') : ''}</p>`)(Net.netInfo());
const pqHTML = id => (q => q ? `<small class="pq">${G.barsHTML(q.bars)} ${q.rtt != null ? q.rtt + ' ms' : '…'} · ${routeName(q.route)}${q.weak ? ' · ' + T('weak', 'yếu') : ''}</small>` : '')(Net.quality(id));
G.netTick = body => {
  const nl = body.querySelector<HTMLElement>('.netline'); if (nl) nl.outerHTML = netLineHTML();
  body.querySelectorAll<HTMLElement>('.prow.roomp[data-pid]').forEach(row => { const old = row.querySelector<HTMLElement>('.pq'), now = pqHTML(row.dataset.pid); if (old) old.outerHTML = now || ''; else if (now) row.querySelector<HTMLElement>('.pw').insertAdjacentHTML('beforeend', now); });
};
// (bug #37, owner 11 Oct) a small note for grown-ups saying where the switch is (Grown-ups → "Internet and playing online"
// → "Use the internet"), with the Grown-ups button right here: press and hold only, so a child can't switch it on
const gUHow = on => `<div class="gunote"><p class="note">${on
  ? T('For grown-ups: press and hold Grown-ups → Internet and playing online → untick Use the internet to switch playing with friends off.', 'Dành cho người lớn: nhấn giữ nút Phụ huynh → Internet và chơi trực tuyến → bỏ chọn Dùng internet để tắt chơi cùng bạn.')
  : T('For grown-ups: press and hold Grown-ups → Internet and playing online → tick Use the internet to switch playing with friends on.', 'Dành cho người lớn: nhấn giữ nút Phụ huynh → Internet và chơi trực tuyến → chọn Dùng internet để bật chơi cùng bạn.')}</p>
  <button class="grown gu-hold"><span class="ring"></span>${T('Grown-ups', 'Phụ huynh')}<small>${T('press and hold', 'nhấn giữ')}</small></button></div>`;
const bindGUHow = (body, redraw) => {
  const b = body.querySelector('.gu-hold'); if (!b) return;
  holdButton(b, async () => {
    await openGrownups(() => { if (document.body.contains(body)) redraw(); });
    const d = document.querySelector<HTMLDetailsElement>('.modal.grownups details[data-sec="online"]'); if (d) { d.open = true; d.scrollIntoView({ block: 'start' }); }
  });
};
G.drawOnlinePanel = (body, redraw) => {
  // (Round V, owner 13 Oct) a friend who accepts and comes into the room closes the Friends page, so the child sees them
  G._padRemotes = Object.keys(Net.remotes).length;
  G.onNet = () => { if (!document.body.contains(body)) return; const n = Object.keys(Net.remotes).length; if (n > G._padRemotes) { G._padRemotes = n; G.closePadNow(); return; } G._padRemotes = n; redraw(); };
  const h = G.heroes[0];
  // (round R privacy, 9 Oct, owner) online play is off until a grown-up turns it on (Grown-ups → Playing online): no Start, no Join
  if (!settings.online) { body.innerHTML = `<div class="online off"><p class="note center onlineoff">🔒 ${T('Playing with friends is off. Ask a grown-up to turn it on.', 'Chơi cùng bạn đang tắt. Nhờ người lớn bật lên nhé.')}</p>
    ${gUHow(false)}</div>`; bindGUHow(body, redraw); return; }
  // (Round V, owner 13 Oct) "My friends" folds away (remembered on this device)
  const friendsBox = () => `<details class="ocard friends" ${settings.friendsFold ? '' : 'open'}><summary><h3>👫 ${T('My friends', 'Bạn của con')}</h3></summary>
      <p class="note">${T('My friend code', 'Mã bạn bè của con')}: <b class="fcode">${settings.friendCode}</b></p>
      <label class="tog"><input type="checkbox" id="fOn" ${settings.friendsOn ? 'checked' : ''}> ${T('Friends can see when I am playing and where, and invite me (needs the internet)', 'Bạn bè thấy khi con đang chơi, đang ở đâu, và mời con được (cần có mạng)')}</label>
      <div class="flist">${settings.friends.map(f => `<div class="frow"><span class="fwho">🧒 <b>${esc(nm((Net.friends.status[f.code] || {}).name || f.name))}</b> <small>${esc(f.code)}</small>${friendStatus(f)}</span>${(Net.friends.status[f.code] || {}).online && (Net.friends.status[f.code] || {}).room && Net.code !== Net.friends.status[f.code].room ? (Net.sameMap(Net.friends.status[f.code].map) ? `<button class="btn primary" data-joinf="${esc(Net.friends.status[f.code].room)}" data-fc="${esc(f.code)}">▶ ${T('Join', 'Vào chơi')}</button>` : `<button class="btn mapdiff" data-mapdiff aria-label="${T('Different valley', 'Thung lũng khác')}" title="${T('Different valley', 'Thung lũng khác')}">🗺️</button>`) : ''}${(Net.friends.status[f.code] || {}).online && !(Net.code && Net.friends.status[f.code].room === Net.code) ? `<button class="btn" data-inv="${f.code}">📨 ${T('Invite', 'Mời')}</button>` : ''}<button class="btn" data-rm="${f.code}" aria-label="${T('Remove', 'Xóa')}">✕</button></div>`).join('') || `<p class="note">${T('No friends yet. Add a friend code, or add someone after playing together.', 'Chưa có bạn nào. Nhập mã bạn bè, hoặc thêm bạn sau khi chơi cùng.')}</p>`}</div>
      <div class="vrow"><input type="text" id="fAdd" maxlength="6" placeholder="${T('Friend code', 'Mã bạn bè')}" autocomplete="off"><button class="btn" id="fAddB">＋ ${T('Add', 'Thêm')}</button></div>
      ${settings.friends.length ? `<p class="note">${T('Friends are never put in a room by themselves: 📨 Invite asks them, ▶ Join goes to theirs.', 'Bạn bè không bao giờ tự bị đưa vào phòng: 📨 Mời là hỏi bạn, ▶ Vào chơi là sang phòng bạn.')}</p>` : ''}${gUHow(true)}</details>`;
  const bindFriends = () => {
    bindGUHow(body, redraw);
    { const d = body.querySelector<HTMLDetailsElement>('details.friends'); if (d) d.ontoggle = () => { settings.friendsFold = !d.open; saveSettings(); }; }
    body.querySelectorAll<HTMLElement>('[data-mapdiff]').forEach(b => b.onclick = () => { SFX.tap(); G.mapCard(); });
    body.querySelector<HTMLInputElement>('#fOn').onchange = () => { settings.friendsOn = body.querySelector<HTMLInputElement>('#fOn').checked; saveSettings(); G.listenFriends(); };
    body.querySelector<HTMLElement>('#fAddB').onclick = () => { if (addFriend(body.querySelector<HTMLInputElement>('#fAdd').value)) { SFX.chime(); redraw(); } else toast(T('A friend code has 6 letters and numbers.', 'Mã bạn bè gồm 6 chữ và số.')); };
    body.querySelectorAll<HTMLElement>('[data-rm]').forEach(b => b.onclick = () => { settings.friends = settings.friends.filter(f => f.code !== b.dataset.rm); saveSettings(); redraw(); });
    body.querySelectorAll<HTMLElement>('[data-joinf]').forEach(b => b.onclick = async () => { SFX.tap(); const f = settings.friends.find(x => x.code === b.dataset.fc), st = Net.friends.status[b.dataset.fc] || {}; await G.joinFriend(b.dataset.joinf, f && st.host ? f.pub : null); redraw(); });
    body.querySelectorAll<HTMLButtonElement>('[data-inv]').forEach(b => b.onclick = async () => { b.disabled = true; inviteToast(await G.inviteFriend(b.dataset.inv)); b.disabled = false; });
    body.querySelectorAll<HTMLElement>('[data-mictest]').forEach(b => b.onclick = () => { SFX.tap(); import('./mictest.js').then(M => M.openMicTest()); });
  };
  if (Net.connected || Net.role === 'host') {
    const list = Object.values(Net.remotes);
    body.innerHTML = `<div class="online on">
      <p class="note center">${Net.code ? T(`Room code · ${Net.count}/6 players`, `Mã phòng · ${Net.count}/6 người chơi`) : ''}</p>${Net.code && Net.role === 'host' ? codeHTML(Net.code) : Net.code ? `<p class="center"><b class="bigcode">${Net.code}</b></p>` : ''}
      ${Net.role === 'host' && Net.knocks.size ? `<div class="ocard knocks"><h3>🚪 ${T('At the door', 'Đang gõ cửa')}</h3>${[...Net.knocks.values()].map(k => `<div class="prow"><img src="${avatarURL({ photo: k.photo, look: Object.assign({ hair: '#1d1412', skin: '#f6c7a5' }, k.look) })}" alt=""><div class="pw"><b>${esc(nm(k.name || T('Someone', 'Một bạn')))}</b></div><button class="btn primary" data-admit="${esc(k.id)}">✅ ${T('Let in', 'Cho vào')}</button><button class="btn" data-deny="${esc(k.id)}">❌</button></div>`).join('')}</div>` : ''}
      ${netStatus ? `<p class="note center status">${esc(netStatus)}</p>` : ''}
      ${netLineHTML()}
      <div class="plist">${list.map(r => `<div class="prow roomp" data-pid="${esc(r.id)}"><img src="${avatarURL({ photo: r.photo, look: Object.assign({ hair: '#1d1412', skin: '#f6c7a5' }, r.look) })}" alt=""><div class="pw"><b>${esc(nm(r.name))}</b>${pqHTML(r.id)}</div>
        <div class="rp-btns"><button class="btn" data-walkf="${esc(r.id)}">👣 ${T('Walk', 'Đi bộ')}</button><button class="btn" data-fly="${esc(r.id)}">✨ ${T('Fly', 'Bay')}</button><button class="btn" data-callf="${esc(r.id)}">📣 ${T('Ask to come', 'Gọi đến')}</button><button class="btn" data-tr="${esc(r.id)}">🔄 ${T('Trade', 'Đổi đồ')}</button><button class="btn" data-caro="${esc(r.id)}">⭕ ${T('Caro', 'Caro')}</button><button class="btn ${G.heroes[0] && G.heroes[0].followId === r.id ? 'primary' : ''}" data-follow="${esc(r.id)}">🚶 ${G.heroes[0] && G.heroes[0].followId === r.id ? T('Stop following', 'Thôi đi theo') : T('Follow', 'Đi theo')}</button>${Net.role === 'host' ? `<button class="btn" data-kick="${esc(r.id)}" aria-label="${T('Remove from the room', 'Mời ra khỏi phòng')}">🚪</button>` : ''}${r.friend && !settings.friends.some(f => f.code === r.friend && f.pub && f.pub === r.pub) ? `<button class="btn" data-addf="${esc(r.friend)}" data-n="${esc(r.name)}" data-pid="${esc(r.id)}" aria-label="${T('Add as a friend', 'Thêm làm bạn')}">＋👫</button>` : ''}</div></div>`).join('') || `<p class="note center">${T('Waiting for friends to join… Tell them the room code!', 'Đang chờ bạn vào… Đọc mã phòng cho bạn nhé!')}</p>`}</div>
      ${list.length ? `<div class="actions center"><button class="btn primary big" data-together>🎲 ${T('Play together', 'Chơi cùng nhau')}</button></div>` : ''}
      ${list.length ? `<div class="actions center"><button class="btn" data-rpsall>✌️ ${T('Oẳn tù tì with everyone', 'Oẳn tù tì cả phòng')}</button><button class="btn" data-allg="memory">🃏 ${T('Memory Match together', 'Lật hình cùng nhau')}</button><button class="btn" data-allg="tienlen">🎴 ${T('Tiến Lên together', 'Tiến Lên cùng nhau')}</button></div>` : ''}
      <p class="note center">${T('Talk to each other with your voices, or use the 💬 buttons. Up to 6 players in a room.', 'Nói chuyện bằng giọng nói, hoặc dùng nút 💬. Mỗi phòng tối đa 6 người.')}</p>
      <div class="actions center"><button class="btn big${Net.micLive ? '' : ' primary'}" id="oMute">${!Net.micLive ? '🎙️ ' + T('Microphone on', 'Bật micrô') : Net.muted ? '🔇 ' + T('Unmute', 'Bật mic') : '🎙️ ' + T('Mute', 'Tắt mic')}</button><button class="btn big danger" id="oEnd">📵 ${T('Leave the room', 'Rời phòng')}</button></div>
      ${micTestHTML()}${friendsBox()}</div>`;
    body.querySelector<HTMLElement>('#oMute').onclick = async () => { SFX.tap(); await G.toggleMute(); redraw(); };
    bindCode(body);
    body.querySelectorAll<HTMLElement>('[data-admit]').forEach(b => b.onclick = () => { SFX.tap(); Net.admit(b.dataset.admit); });
    body.querySelectorAll<HTMLElement>('[data-deny]').forEach(b => b.onclick = () => { SFX.tap(); Net.deny(b.dataset.deny); });
    body.querySelector<HTMLElement>('#oEnd').onclick = () => { Net.close(); Object.keys(G.partners).forEach(id => Net.emit('left', { id, name: G.partners[id].name })); G.huds.forEach(hd => hd.setCall(false)); redraw(); };
    body.querySelectorAll<HTMLElement>('[data-fly]').forEach(b => b.onclick = () => { const P = G.partners[b.dataset.fly]; if (P) { $('.modal.pad')?.remove(); G.paused = false; G.flyToFriend(G.heroes[0], P.id); } });
    body.querySelectorAll<HTMLElement>('[data-walkf]').forEach(b => b.onclick = () => { $('.modal.pad')?.remove(); G.paused = false; G.walkToFriend(G.heroes[0], b.dataset.walkf); });
    body.querySelectorAll<HTMLElement>('[data-callf]').forEach(b => b.onclick = () => { $('.modal.pad')?.remove(); G.paused = false; G.askFriendToCome(G.heroes[0], b.dataset.callf); });
    body.querySelectorAll<HTMLElement>('[data-kick]').forEach(b => b.onclick = () => { if (confirm(T('Remove this player from the room?', 'Mời bạn này ra khỏi phòng?'))) { Net.kick(b.dataset.kick); setTimeout(redraw, 600); } });
    body.querySelectorAll<HTMLElement>('[data-tr]').forEach(b => b.onclick = () => { $('.modal.pad')?.remove(); G.paused = false; openTrade(G, G.heroes[0], b.dataset.tr); });
    // games with friends (round G): Caro with one friend, Oẳn tù tì with everyone in the room
    body.querySelectorAll<HTMLElement>('[data-follow]').forEach(b => b.onclick = () => { SFX.tap(); G.followFriend(0, b.dataset.follow); $('.modal.pad')?.remove(); G.paused = false; });
    body.querySelectorAll<HTMLElement>('[data-caro]').forEach(b => b.onclick = () => { SFX.tap(); G.inviteGame('caro', b.dataset.caro); });
    { const r = body.querySelector<HTMLElement>('[data-rpsall]'); if (r) r.onclick = () => { SFX.tap(); G.inviteGame('oantuti'); }; }
    body.querySelectorAll<HTMLElement>('[data-allg]').forEach(b => b.onclick = () => { SFX.tap(); G.inviteGame(b.dataset.allg); });
    { const t = body.querySelector<HTMLElement>('[data-together]'); if (t) t.onclick = () => { SFX.tap(); G.openPlayTogether(); }; }
    body.querySelectorAll<HTMLElement>('[data-addf]').forEach(b => b.onclick = () => { addFriend(b.dataset.addf, b.dataset.n, (Net.remotes[b.dataset.pid] || {}).pub); SFX.chime(); toast(T('Friend added!', 'Đã thêm bạn!')); redraw(); });
    bindFriends();
    return;
  }
  if (Net.role === 'guest' && Net.knocking) {
    body.innerHTML = `<div class="online knockwait"><p class="note center">🚪 ${T(`Knock knock on room <b class="bigcode">${esc(Net.code)}</b>`, `Cốc cốc phòng <b class="bigcode">${esc(Net.code)}</b>`)}</p>
      <p class="note center status">${esc(netStatus)}</p><p class="note center">🔇 ${T('Your microphone stays off until you are let in.', 'Micrô của con tắt cho đến khi được cho vào.')}</p>
      <div class="actions center"><button class="btn big" id="oStop">✕ ${T('Stop knocking', 'Thôi không gõ nữa')}</button></div>${friendsBox()}</div>`;
    body.querySelector<HTMLElement>('#oStop').onclick = () => { Net.close(); redraw(); };
    bindFriends(); return;
  }
  let code = '', animals = !!settings.padAnimals;
  body.innerHTML = `<div class="online">
    <p class="note center">${T('Play together from up to 6 phones or tablets, and talk with your voices! Everyone needs the internet.', 'Chơi cùng nhau tối đa 6 máy và nói chuyện bằng giọng nói! Mọi máy đều cần có mạng.')}</p>
    <div class="two-col">
      <div class="ocard"><h3>1. ${T('Start a room', 'Tạo phòng')}</h3><button class="btn big primary" id="oHost">📞 ${T('Start', 'Bắt đầu')}</button>${Net.role === 'host' && Net.code ? codeHTML(Net.code) : ''}<p class="note">${T('Friends knock, and you choose who comes in. Saved friends come straight in.', 'Bạn bè gõ cửa, con chọn ai được vào. Bạn đã lưu thì vào thẳng.')}</p></div>
      <div class="ocard joinpad"><h3>2. ${T('Join a room', 'Vào phòng')}</h3><div class="padwrap"></div></div>
    </div><p class="note center status">${esc(netStatus)}</p>${micTestHTML()}${friendsBox()}</div>`;
  body.querySelector<HTMLElement>('#oHost').onclick = async () => { ac(); await Net.host(sendHello() || {}); redraw(); };
  bindCode(body);
  const go = () => { Net.join(code, sendHello() || {}); setTimeout(redraw, 50); };
  const drawPad = () => {
    const wrap = body.querySelector<HTMLElement>('.padwrap'); wrap.innerHTML = padHTML(animals);
    const box = wrap.querySelector<HTMLElement>('.codebox'), show = () => { box.innerHTML = boxHTML(code, animals); }; show();
    wrap.querySelectorAll<HTMLElement>('[data-mode]').forEach(b => b.onclick = () => { SFX.tap(); animals = b.dataset.mode === 'ani'; settings.padAnimals = animals; saveSettings(); drawPad(); });
    wrap.querySelectorAll<HTMLElement>('.numpad button').forEach(b => b.onclick = () => {
      const v = b.dataset.v; SFX.tap();
      if (v === 'back') code = code.slice(0, -1); else if (v === 'ok') { if (code.length === ROOM_LEN) go(); } else if (code.length < ROOM_LEN) code += v;
      show();
      if (code.length === ROOM_LEN && v !== 'ok') go();
    });
  };
  drawPad();
  bindFriends();
};

// ---------- layout ----------
// (Round V, owner's iPhone notes 13 Oct: a black strip at the bottom) on an iPhone in Safari the window's height stops
// above the browser's bottom bar, so the page's dark background showed under the game: the game fills the large
// screen height (100lvh) instead, measured by a hidden probe; the same as the window's height everywhere else
const lvhProbe = (() => { try { if (!CSS.supports('height', '100lvh')) return null; const d = document.createElement('div'); d.style.cssText = 'position:fixed;left:0;top:0;width:0;height:100lvh;visibility:hidden;pointer-events:none'; document.body.appendChild(d); return d; } catch (e) { return null; } })();
// (owner, 13 Oct AEDT, iOS 27 Home Screen app on r70: still a blur band at the top and the dock cut at the bottom) a
// Home Screen app has no browser bar to float over, and there the large screen height is taller than the space iOS
// gives the page: the dock went under the bottom edge and the page could scroll a little (iOS then draws its blur under
// the status bar). In a Home Screen app the game takes the space it is given and the page cannot scroll. Grown-ups →
// Screen and world → "Fit the screen" can choose by hand (settings.screenFit: 'auto', 'fill' or 'fit').
const homeApp = () => { try { return matchMedia('(display-mode: standalone)').matches || navigator.standalone === true; } catch (e) { return false; } };
const fitView = () => settings.screenFit === 'fill' ? false : settings.screenFit === 'fit' ? true : homeApp();
const givenH = () => Math.round(Math.min(innerHeight, document.documentElement.clientHeight || innerHeight, window.visualViewport ? visualViewport.height + visualViewport.offsetTop : innerHeight));
let fitWas = null;
const vh = () => {
  const fit = fitView(), h = fit ? givenH() : Math.max(innerHeight, lvhProbe ? lvhProbe.offsetHeight : 0), key = fit + ':' + h;
  if (key !== fitWas) { fitWas = key; const r = document.documentElement; r.classList.toggle('fitview', fit); r.style.setProperty('--appH', h + 'px'); }
  return h;
};
// what the screen says about itself (Grown-ups → Screen and world, for finding out what an iPhone does)
G.screenFacts = () => ({ app: homeApp(), fit: fitView(), inner: innerHeight, client: document.documentElement.clientHeight, visual: window.visualViewport ? Math.round(visualViewport.height) : 0, large: lvhProbe ? lvhProbe.offsetHeight : 0, screen: screen.height, used: vh() });
// Two players face to face (owner, round R: a tablet lying on the table with a child at each end): the screen is cut
// across the middle; player 1 has the near half, player 2 the far half turned half a turn (rot 180) so it faces them.
// On a computer or TV both halves face the same way, side by side ('side'). Grown-ups can pick either (settings.twoView).
const faceToFace = () => settings.twoView === 'face' || (settings.twoView !== 'side' && document.body.classList.contains('touch'));
function rects() {
  const W = innerWidth, H = vh();
  if (G.heroes.length < 2) return [{ x: 0, y: 0, w: W, h: H, rot: 0 }];
  if (faceToFace()) return [{ x: 0, y: H / 2, w: W, h: H / 2, rot: 0 }, { x: 0, y: 0, w: W, h: H / 2, rot: 180 }];
  return W >= H ? [{ x: 0, y: 0, w: W / 2, h: H, rot: 0 }, { x: W / 2, y: 0, w: W / 2, h: H, rot: 0 }] : [{ x: 0, y: 0, w: W, h: H / 2, rot: 0 }, { x: 0, y: H / 2, w: W, h: H / 2, rot: 0 }];
}
G.rects = rects; G.faceToFace = () => G.heroes.length > 1 && faceToFace();
// Windows (the Pad, games, stories, dialogs, rewards) are added to the page. With two players each one is moved into a
// holder over the half of the child who opened it (G.lastPlayer = whoever touched or pressed last); face to face the far
// child's holder is turned half a turn, so their windows face them (round R, owner: "the other child can keep playing").
G.lastPlayer = 0;
const holders = [0, 1].map(() => { const w = document.createElement('div'); w.className = 'halfwrap'; return w; });
G.halfBusy = i => !!holders[i] && holders[i].isConnected && [...holders[i].children].some(c => !c.classList.contains('out') && !c.classList.contains('confetti') && /(^|\s)(modal|gl|storybook|vc-pop|dialog|reward|chatwin|handpad)(\s|$)/.test(c.className));
const NOT_A_WINDOW = /(^|\s)(hud|stick|facewrap|halfwrap|caption|title|confetti|fade|apfinger|testertoast|packbar)(\s|$)/;
function placeHolders() {
  const r = rects(), two = twoHalves();
  holders.forEach((w, i) => {
    if (!two) { [...w.children].forEach(c => document.body.appendChild(c)); w.remove(); return; }
    const q = r[i]; Object.assign(w.style, { left: q.x + 'px', top: q.y + 'px', width: q.w + 'px', height: q.h + 'px' });
    w.classList.toggle('facewrap', q.rot === 180);
  });
}
document.addEventListener('pointerdown', e => {
  if (!twoHalves()) return;
  const t = e.target instanceof Element ? e.target : null, w = t && t.closest('.halfwrap');
  if (w) { G.lastPlayer = holders.findIndex(x => x === w); return; }
  if (t && t.closest('.hud')) { const k = G.huds.findIndex(h => h.root.contains(t)); if (k >= 0) { G.lastPlayer = k; return; } }
  const k = rects().findIndex(q => e.clientX >= q.x && e.clientX < q.x + q.w && e.clientY >= q.y && e.clientY < q.y + q.h); if (k >= 0) G.lastPlayer = k;
}, true);
new MutationObserver(list => {
  if (!twoHalves()) { placeHolders(); return; }
  for (const m of list) for (const n of m.addedNodes) {
    if (!(n instanceof HTMLElement) || n.parentNode !== document.body || n.tagName === 'CANVAS' || n.tagName === 'SCRIPT' || n.id === 'split' || NOT_A_WINDOW.test(n.className)) continue;
    const w = holders[G.lastPlayer] || holders[0];
    if (!w.isConnected) { document.body.appendChild(w); placeHolders(); }
    w.appendChild(n);
  }
}).observe(document.body, { childList: true });
// a turned-round half: its picture is turned in the camera itself, so taps and the 3D view stay matched
const _rotZ = new THREE.Matrix4().makeRotationZ(Math.PI);
function aimCam(h, q) {
  h.cam.aspect = q.w / q.h; h.cam.updateProjectionMatrix();
  if (q.rot === 180) { h.cam.projectionMatrix.premultiply(_rotZ); h.cam.projectionMatrixInverse.copy(h.cam.projectionMatrix).invert(); }
}
function resize() {
  renderer.setSize(innerWidth, vh());
  const r = rects();
  G.heroes.forEach((h, i) => { h.cam.aspect = r[i].w / r[i].h; h.cam.updateProjectionMatrix(); G.huds[i] && G.huds[i].layout(r[i], G.heroes.length > 1); });
  titleCam.aspect = innerWidth / vh(); titleCam.updateProjectionMatrix(); placeHolders();
  const sp = $('#split'); sp.hidden = G.heroes.length < 2;
  // a small round switch in the middle of the line: face to face ⇄ side by side, any time (round R, owner)
  let sw = sp.querySelector('.viewsw');
  if (!sw) { sw = document.createElement('button'); sw.className = 'viewsw'; sw.onpointerdown = e => { e.stopPropagation(); }; sw.onclick = e => { e.stopPropagation(); settings.twoView = faceToFace() ? 'side' : 'face'; saveSettings(); SFX.tap(); resize(); }; sp.appendChild(sw); }
  sw.innerHTML = faceToFace() ? ICONS.sideView : ICONS.faceView; sw.setAttribute('aria-label', faceToFace() ? T('Sit side by side', 'Ngồi cạnh nhau') : T('Sit face to face', 'Ngồi đối diện nhau'));
  if (G.heroes.length > 1) { const v = innerWidth >= vh() && !faceToFace(); Object.assign(sp.style, v ? { left: innerWidth / 2 - 2 + 'px', top: 0, width: '4px', height: '100%' } : { top: vh() / 2 - 2 + 'px', left: 0, height: '4px', width: '100%' }); }
}
addEventListener('resize', resize);
// Phones (especially iPhone home-screen apps) sometimes report the wrong size after rotating or after the
// keyboard closes, leaving part of the screen empty. Check often and fix the size whenever it drifts.
addEventListener('orientationchange', () => setTimeout(resize, 300));
if (window.visualViewport) visualViewport.addEventListener('resize', () => setTimeout(resize, 100));
addEventListener('focusout', () => setTimeout(() => { window.scrollTo(0, 0); resize(); }, 150));
setInterval(() => { const c = renderer.domElement; if (Math.abs(c.clientWidth - innerWidth) > 2 || Math.abs(c.clientHeight - vh()) > 2) resize(); }, 700);
const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
function onTap(i, x, y) {
  const h = G.heroes[i]; if (!h || G.paused) return;
  if (h._dancing) { G.places.note(h); return; }
  const r = rects()[i]; ndc.set((x - r.x) / r.w * 2 - 1, -((y - r.y) / r.h) * 2 + 1);
  aimCam(h, r); ray.setFromCamera(ndc, h.cam);
  // tapping a bubble, a water drop or a ripe crop walks there and does it
  const hitB = ray.intersectObjects([...(G.bubbleIcons || []), ...(G.tapTargets || [])], false).find(x => x.object.visible);
  if (hitB) { goAndDo(h, hitB.object.userData.it); return; }
  // (tester's notes, 12 Oct) inside a house the floor is the room's, not the valley's ground: a tap on (or right by)
  // someone or something in the room walks up to it and does it, a tap on the floor walks there
  if (G.homes && G.homes.isInside(h)) {
    const v = new THREE.Vector3(), px = (q, dy) => { v.set(q.x, (q.y ?? h.pos.y) + dy, q.z).project(h.cam); return Math.hypot((v.x - ndc.x) * r.w / 2, (v.y - ndc.y) * r.h / 2); };
    let it = null, bd = 70;
    for (const q of G.interactables) { if (q.y == null || Math.abs(q.y - h.pos.y) > 5 || dist2(h.pos.x, h.pos.z, q.x, q.z) > 16 || (q.visible && !q.visible(h))) continue; const d = Math.min(px(q, .3), px(q, 1.2)); if (d < bd) { bd = d; it = q; } }
    if (it) { goAndDo(h, it); return; }
    const pt = ray.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0, 1, 0), -h.pos.y), v);
    if (pt && dist2(h.pos.x, h.pos.z, pt.x, pt.z) < 16) { h.goal = { x: pt.x, z: pt.z }; G.fx(pt.x, h.pos.y + .3, pt.z, '✨'); }
    return;
  }
  // tap a person, animal, tree or critter and it reacts (js/fun.js)
  if (G.tapReact && G.tapReact(h, ray)) return;
  const hit = ray.intersectObject(world.terrain, false)[0];
  if (hit) { h.goal = { x: hit.point.x, z: hit.point.z }; G.fx(hit.point.x, hit.point.y + .3, hit.point.z, '✨'); }
}
function goAndDo(h, it) {
  if (!it) return;
  if (dist2(h.pos.x, h.pos.z, it.x, it.z) < (it.plot ? 7 : it.r)) { SFX.tap(); if (twoHalves()) G.lastPlayer = Math.max(0, G.heroes.indexOf(h)); startAct(it, h); return; }
  h.goal = approach(h, it); h.goalAct = it;
}
G.goAndDo = goAndDo;
// stop just in front of an activity rather than inside it
function approach(h, it) { const dx = h.pos.x - it.x, dz = h.pos.z - it.z, d = Math.hypot(dx, dz) || 1, k = Math.max(.5, Math.min(it.r * .6, 2.5)); return { x: it.x + dx / d * k, z: it.z + dz / d * k }; }
const poll = initInput(renderer.domElement, rects, () => G.paused || !G.heroes.length, onTap);
// the mouse wheel zooms the screen under the pointer (split screen has two)
renderer.domElement.addEventListener('wheel', e => { const r = rects(), k = Math.max(0, r.findIndex(q => e.clientX >= q.x && e.clientX < q.x + q.w && e.clientY >= q.y && e.clientY < q.y + q.h)); G.zoomBy(k, e.deltaY > 0 ? 1.1 : .9, true); }, { passive: true });
// zooming out also lifts the camera up, so rooftops no longer pull it back in (it used to look as if zoom did nothing)
// camera views: behind (normal) → high up → street level (to see house fronts) → my face (close-up when standing still)
const VIEWS = [['follow', '🎥', 'Behind me', 'Sau lưng'], ['high', '🦅', 'High up', 'Trên cao'], ['street', '🏘️', 'Street view', 'Ngang phố'], ['face', '😊', 'My face', 'Mặt của con']];
G.VIEWS = VIEWS;
G.getViews = i => { const h = G.heroes[i], riding = h && (h.riding || (h.carry && h.state === 'sit')) && settings.ridePov !== false; return riding ? VIEWS.map(v => v[0] === 'follow' ? ['follow', v[1], 'Rider’s eyes', 'Qua mắt người cưỡi'] : v) : VIEWS; };
G.setView = (i, id) => { const h = G.heroes[i]; if (!h) return; h.view = id; h.manualCamT = 0; const views = G.getViews(i), v = views.find(v => v[0] === id) || views[0]; G.huds[i] && G.huds[i].toast(v[1] + ' ' + T(v[2], v[3])); const b = G.huds[i] && G.huds[i].q('.z-view'); if (b) b.firstChild.textContent = v[1]; };
G.cycleView = i => { const h = G.heroes[i]; if (!h) return; SFX.tap(); const k = VIEWS.findIndex(v => v[0] === (h.view || 'follow')); G.setView(i, VIEWS[(k + 1) % VIEWS.length][0]); };
G.zoomBy = (i, f, quiet) => {
  const h = G.heroes[i]; if (!h) return;
  const z = clamp((h.zoom || 1) * f, .35, 2.2);
  if (Math.abs(z - (h.zoom || 1)) < .001) { if (!quiet) { SFX.no && SFX.no(); G.huds[i] && G.huds[i].toast(f < 1 ? T('That is as close as it goes!', 'Gần nhất rồi!') : T('That is as far as it goes!', 'Xa nhất rồi!')); } return; }
  h.zoom = z; h.manualCamT = 0; if (!quiet) SFX.tap();
};

// ---------- starting a session ----------
// A child comes back where they were (owner, round 30): the spot is saved every 5 s and when the game is put away.
// It is only used if it is still a good place to stand (the valley may have changed since): on the map, on dry
// ground, not inside a building, a wall or a tree; otherwise the child starts at the usual spot by the owl.
const HOME_SPOT = i => ({ x: PLATEAU.x - 3 + i * 2.5, z: PLATEAU.z - 4 }); // (round T: by Ông Cú, from the map)
G.goodSpot = (x, z) => {
  const W = G.world; if (!Number.isFinite(x) || !Number.isFinite(z) || Math.abs(x) > HALF - 10 || Math.abs(z) > HALF - 10) return false;
  if (heightAt(x, z) < WATER + .3) return false;
  if (W.solidAt && [[0, 0], [.6, 0], [-.6, 0], [0, .6], [0, -.6]].some(([dx, dz]) => W.solidAt(x + dx, z + dz))) return false;
  if (solidCircleHit(W, x, z)) return false;
  return !W.colliders.some(c => c.r > 0 && c.top == null && Math.hypot(c.x - x, c.z - z) < c.r + .45) && !W.boxes.some(b => x > b.x0 - .45 && x < b.x1 + .45 && z > b.z0 - .45 && z < b.z1 + .45);
};
const keepSpot = () => G.heroes.forEach(h => { if (h.profile && h.onGround && !h.towerClimb && !h.indoors && G.goodSpot(h.lastSafe.x, h.lastSafe.z)) { h.profile.pos = { x: +h.lastSafe.x.toFixed(1), z: +h.lastSafe.z.toFixed(1) }; h.profile.posMap = MAP_VERSION; } }); // (round T: stamped with the layout)
// the "New!" moment (round R, owner): what Studio's Releases page marked new, once per child, at most three at a time
// (round T) once, when a child who already played opens the valley's new layout
async function grownMoment() {
  for (let k = 0; k < 60 && document.querySelector<HTMLElement>('.storybook, .reward, .modal, .dialog'); k++) await new Promise(r => setTimeout(r, 500));
  say('The valley has grown! New rivers, bridges and places to visit.', 'Thung lũng đã lớn hơn rồi! Có sông mới, cầu mới và nhiều nơi mới để đi chơi.'); // (read aloud: under-5s can't read it)
  await reward('🗺️', T('The valley has grown!', 'Thung lũng đã lớn hơn rồi!'), T('New rivers, bridges and places to visit. Your stickers, stories, farm and house are all still here.', 'Có sông mới, cầu mới và nhiều nơi mới để đi chơi. Nhãn dán, truyện, nông trại và nhà của con vẫn còn nguyên.'));
}
async function newMoment(h) {
  if (!h || !h.profile) return; const p = h.profile; p.seenNew = p.seenNew && typeof p.seenNew === 'object' ? p.seenNew : {};
  const fresh = RELEASES.filter(r => releaseNew(r.id) && !p.seenNew[r.id]).slice(0, 3); if (!fresh.length) return;
  for (let k = 0; k < 60 && document.querySelector<HTMLElement>('.storybook, .reward, .modal, .dialog'); k++) await new Promise(r => setTimeout(r, 500));
  fresh.forEach(r => { p.seenNew[r.id] = new Date().toISOString().slice(0, 10); }); save();
  await reward('🆕', T('New in the valley!', 'Mới trong thung lũng!'), fresh.map(r => T(r.en, r.vi)).join(' · '));
}
// (batch rollout, owner 13 Oct AEDT) a feature held back or switched off in Studio stays for a child who already used it:
// G.keep(id) is on when its switch is on or anyone playing used it; G.tried(h, id) remembers a use (js/custom.js)
G.keep = (id, def = true) => keptOn(id, G.heroes.map(h => h.profile), def);
G.tried = (h, id) => { const p = h && (h.profile || h); if (markTried(p, id)) save(); };
function startSession(mode, chosen) {
  if (chosen.map(triedFromSave).some(Boolean)) save(); setPlayers(chosen); if (G.readingCheck) G.readingCheck();
  G.mode = mode; G.heroes.forEach(h => scene.remove(h.av.root)); G.huds.forEach(h => h.destroy()); G.heroes = []; G.huds = [];
  chosen.forEach((p, i) => {
    const h = new Hero(i, p, scene, world);
    // (round T) a spot saved on an older layout of the valley is not used: the child starts at home, once, with "The valley
    // has grown!" (stickers, stories, the farm and the house are kept: they are not places on the map)
    if (i === 0) G.valleyGrew = false;
    if (p.pos && !onThisMap(p.posMap)) { p.pos = null; p.posMap = MAP_VERSION; G.valleyGrew = true; save(); }
    const back = p.pos && G.goodSpot(p.pos.x, p.pos.z), start = back ? p.pos : HOME_SPOT(i);
    h.place(start.x, start.z); h.camYaw = Math.PI * .85;
    if (i === 0) G.resumedAway = false;
    if (back && Math.hypot(start.x - HOME_SPOT(i).x, start.z - HOME_SPOT(i).z) > 12) { if (i === 0) G.resumedAway = true; const rg = regionAt(start.x, start.z), where = REGION_NAMES[rg] ? REGION_NAMES[rg]() : ''; setTimeout(() => toast(where ? T(`Welcome back, ${p.name}! You were in ${where}.`, `Chào mừng ${p.name} quay lại! Lần trước con ở ${where}.`) : T(`Welcome back, ${p.name}! You are where you left off.`, `Chào mừng ${p.name} quay lại! Con ở đúng chỗ lần trước.`)), 1500); }
    G.heroes.push(h); G.huds.push(new Hud(i, h, G)); G.regionOf[i] = null; if (i === 0) helloPhoto(h.profile.photo); // ready before a friend joins
  });
  // shrine & tower colours follow the first player
  const p0 = chosen[0];
  SHRINES.forEach(s => world.setShrineDone(s.id, !!p0.shrines[s.id]));
  TOWERS.forEach(t => world.setTowerDone(t.id, !!p0.towers[t.id]));
  LEAFIES.forEach(l => { const o = world.leafyMeshes[l.id]; if (o) o.visible = !chosen.every(p => p.leafies[l.id]); });
  setupWanderers(chosen);
  // (round R) the vehicles' real look when every child playing is 5 or older, the toy look for under-5s
  if (G.traffic) G.traffic.apply(chosen.every(p => p.age === 'big'));
  G.pets.sync(); G.pets.refreshInteractables(); G.kites.sync();
  G.festivals.greet(G.heroes[0]);
  // (round R) a grown-up's festival preview from Sparkle Studio (?festival=halloween), once
  { const pf = new URLSearchParams(location.search).get('festival'); if (pf && !G._previewed) { G._previewed = true; setTimeout(() => G.festivals.visit(0, pf), 1800); } }
  // (round R) the "New!" moment: something Studio released in the last few days, shown once to each child
  setTimeout(() => newMoment(G.heroes[0]), 4000);
  if (G.valleyGrew) setTimeout(grownMoment, 2500);
  resize(); G.paused = false; playing = true; G.listenFriends();
  // a note from the grown-ups (Sparkle Studio), once a day
  // (r81, owner 17 Oct AEDT) Studio's message is live: a new one that arrives while playing is shown too (once)
  { const familyMsg = () => { const M = CUSTOM.message, today = new Date().toDateString(), sig = M ? String(M.en || '') + '|' + String(M.vi || '') : '';
    const seen = () => settings.familyMsgDay === today && (settings.familyMsgSig == null || settings.familyMsgSig === sig);
    // (audit, 9 Oct) marked as seen only once it is really shown: it waits while a story, a game or a panel is open
    if (M && (M.en || M.vi) && !seen()) { let tries = 0; const tryShow = () => { if (seen() || ++tries > 200 || CUSTOM.message !== M) return; if (G.paused) { setTimeout(tryShow, 3000); return; } settings.familyMsgDay = today; settings.familyMsgSig = sig; saveSettings(); G.paused = true; dialog('💌 ' + T('From your family', 'Lời nhắn của gia đình'), [[String(M.en || M.vi).slice(0, 400), String(M.vi || M.en).slice(0, 400)]]).then(() => { G.paused = false; }); }; setTimeout(tryShow, 4000); } };
    familyMsg(); if (!G._familyMsgLive) { G._familyMsgLive = true; onLive(familyMsg); } }
  $('#huds').hidden = false;
  const p = chosen[0];
  // the welcome is words on the screen, not a voice (owner, round 30: with the child's name in it, only the phone's
  // own voice could say it); a new player still hears where to go, in a recorded line without the name
  const greet = () => { if (!p.quests.owl && !(G.heroes.length === 1 && wantsSimple(p))) { toast(T(`Hello ${p.name}! Walk over to the owl and say hi.`, `Chào ${p.name}! Đi đến chỗ chú cú và chào ông nhé.`)); say('Walk over to the owl and say hi!', 'Con đi đến chỗ chú cú và chào ông nhé!'); } else if (!G.resumedAway) toast(T(`Welcome back, ${p.name}!`, `Chào mừng ${p.name} quay lại!`)); };
  if (!(p.story && p.story.prologue)) {
    G.paused = true;
    showStory(PROLOGUE, chosen.map(x => x.name).join(T(' and ', ' và '))).then(() => { chosen.forEach(x => { x.story = x.story || {}; x.story.prologue = true; }); save(); G.paused = false; greet(); });
  } else greet();
  if (mode === 'online') { G.paused = true; openPad(G, 0, 'friend'); }
  else G.simple.start(); // the Simple screen for a child who wants it (js/simple.js)
}

// ---------- the loop ----------
let playing = false, last = performance.now(), t = 0, sendT = 0, saveT = 0, minT = performance.now();
// friends keep seeing where I am: 10 times a second on its own clock (so a slow phone still sends on time),
// and once a second while a menu or a game is open or the app is in the background
let sentAt = 0;
setInterval(() => {
  const h0 = G.heroes[0], idle = G.paused || gameOpen() || document.hidden, nowMs = performance.now();
  if (!playing || !h0 || !Net.connected || nowMs - sentAt < (idle ? 950 : 90)) return;
  sentAt = nowMs;
  Net.send({ t: 's', x: +h0.pos.x.toFixed(2), y: +h0.pos.y.toFixed(2), z: +h0.pos.z.toFixed(2), yaw: +h0.yaw.toFixed(2), st: idle ? 'idle' : h0.state, sp: idle ? 0 : +h0.speed.toFixed(1) });
}, 100);
// Sharp on phones that can manage it: with Graphics on Auto, the 3D picture is drawn at up to 2× the screen's
// pixels and steps down a little whenever the game starts to stutter (phones started blurry at 1.25×).
const adapt = { pr: renderer.getPixelRatio(), max: Math.min(window.devicePixelRatio || 1, PR_AUTO), min: 1, sum: 0, n: 0, t0: performance.now() };
function adaptResolution(rawMs) {
  if (settings.quality !== 'auto' || document.hidden || rawMs > 250) return;
  adapt.sum += rawMs; adapt.n++;
  if (performance.now() - adapt.t0 < 2500) return;
  const ms = adapt.sum / adapt.n; adapt.sum = adapt.n = 0; adapt.t0 = performance.now();
  const next = ms < 19 ? Math.min(adapt.max, adapt.pr + .25) : ms > 30 ? Math.max(adapt.min, adapt.pr - .25) : adapt.pr;
  if (next !== adapt.pr) { adapt.pr = next; renderer.setPixelRatio(next); renderer.setSize(innerWidth, vh(), false); }
}
// Battery (owner, round O: "the game uses too much battery"): on phones and tablets the valley is drawn 30 times a
// second (smooth enough for walking; half the work), unless Graphics is on "Pretty".
// (battery round, owner 12 Oct AEDT: "my MacBook takes almost 10 % at once") computers too: 60 a second (a 120 Hz
// screen drew 120), 30 on Fast; Pretty is 60 everywhere and only Pretty+ draws as fast as the screen. The title screen
// is drawn 20 times a second, and when nothing moves for IDLE_MS (no touch, key or mouse, every child and camera still,
// no friend online) the valley is drawn IDLE_FPS times a second until anything happens.
const FRAME_MS = settings.quality === 'max' ? 0 : settings.quality === 'high' || (settings.quality !== 'low' && !matchMedia('(pointer: coarse)').matches) ? 1000 / 60 : 1000 / 30;
const TITLE_MS = 1000 / 20, IDLE_MS = 15000, IDLE_FPS = 8;
// what the drawing costs, for the battery statistics (js/players.js takes it once a minute) and the `battery` check
const BAT = G.battery = { frameMs: FRAME_MS, titleMs: TITLE_MS, idleMs: IDLE_MS, idleFps: IDLE_FPS, idle: false, input: performance.now(), moved: performance.now(), key: '', at: null, atT: 0, due: 0, prStart: renderer.getPixelRatio(), prMax: settings.quality === 'auto' ? adapt.max : renderer.getPixelRatio(),
  // (counted only while a child plays and something moves: the title, the idle frames and the time the world rests
  // behind a game or a menu are left out, so frames a second say how smooth playing is)
  frames: 0, work: 0, draws: 0, ms: 0, idleFrames: 0, lastDrawn: 0,
  capMs: () => !playing ? Math.max(FRAME_MS, TITLE_MS) : BAT.idle ? 1000 / IDLE_FPS : FRAME_MS,
  // at most one drawing per cap ms, on any screen (a 120 or 144 Hz screen gets 60 on average, not 72); st keeps `due`
  gate: (st, now, cap) => { if (!cap) return true; if (now < st.due - 2) return false; st.due = Math.max(st.due + cap, now - cap); return true; },
  take: () => { const o = { frames: BAT.frames, work: BAT.work, draws: BAT.draws, ms: BAT.ms, idleFrames: BAT.idleFrames, pr: renderer.getPixelRatio() }; BAT.frames = BAT.work = BAT.draws = BAT.ms = BAT.idleFrames = 0; return o; } };
document.addEventListener('visibilitychange', () => { if (document.hidden) BAT.lastDrawn = 0; });
for (const e of ['pointerdown', 'pointermove', 'keydown', 'wheel', 'touchstart']) addEventListener(e, () => { BAT.input = performance.now(); if (BAT.idle) { BAT.idle = false; BAT.due = 0; } }, { capture: true, passive: true });
// still: every child and their camera moving slower than 10 cm a second (a settled camera keeps creeping by about a
// centimetre a second, which nobody sees), the same pose, no input, no friend online, nothing on the way
function stillCheck(now) {
  const at = G.heroes.flatMap(h => [h.pos.x, h.pos.y, h.pos.z, h.yaw, h.cam.position.x, h.cam.position.y, h.cam.position.z]), key = G.heroes.map(h => h.state).join('|');
  const sec = Math.max(.001, (now - (BAT.atT || 0)) / 1000);
  if (key !== BAT.key || !BAT.at || BAT.at.length !== at.length || at.some((v, i) => Math.abs(v - BAT.at[i]) / sec > .1)) { BAT.key = key; BAT.moved = now; }
  BAT.at = at; BAT.atT = now;
  const idle = now - BAT.input > IDLE_MS && now - BAT.moved > IDLE_MS && !Object.keys(G.partners).length && !G.travelling && !G.places.dancing;
  if (idle !== BAT.idle) { BAT.idle = idle; BAT.due = 0; }
}
// pages that cover the whole screen: nothing of the valley shows, so it isn't drawn at all (the Simple screen, which
// under-5s start on, the 🎵 Songs page, often left playing lullabies at bedtime, and the real photos)
const worldHidden = () => (G.simple && G.simple.open) || !!document.querySelector<HTMLElement>('.songs, .realview');
G.worldHidden = worldHidden;
function frame(now) {
  requestAnimationFrame(frame);
  if (framesSeen < 4 && ++framesSeen === 4) framesDone(); // (js/solids.js waits for these)
  if (!BAT.gate(BAT, now, BAT.capMs())) return; // (battery round)
  if (playing && !BAT.idle) adaptResolution(now - last - (FRAME_MS ? FRAME_MS - 1000 / 60 : 0)); // (the wait between frames is not slowness)
  // (battery round) while idle the frames are far apart: the world keeps its pace (nothing is moving that could jump)
  const dt = Math.min(BAT.idle ? .15 : .05, (now - last) / 1000); last = now; t += dt;
  const work0 = performance.now();
  // the 3D world rests while a full-screen game, the storybook or a page that covers it is open (saves battery)
  // (two players: the world rests only when both halves have a window open)
  if (twoHalves() && playing ? G.halfBusy(0) && G.halfBusy(1) : gameOpen() || document.querySelector<HTMLElement>('.storybook, .theatre.film') || (G.paused && document.querySelector<HTMLElement>('.modal')) || (playing && worldHidden())) { BAT.lastDrawn = 0; return; }
  world.update(dt, t);
  if (playing) G.farCull(now); // (round T: small things far from every camera are not drawn)
  if (!playing) {
    BAT.lastDrawn = 0;
    const a = t * .05;
    titleCam.position.set(PLATEAU.x + Math.cos(a) * 70, 42, PLATEAU.z + Math.sin(a) * 70); titleCam.lookAt(PLATEAU.x, 16, PLATEAU.z); // (round T: round Ông Cú's home)
    world.updateSky(0, titleCam.position);
    renderer.setScissorTest(false); renderer.setViewport(0, 0, innerWidth, vh()); renderer.render(scene, titleCam);
    return;
  }
  stillCheck(now); if (BAT.idle) BAT.idleFrames++;
  let drawn = 0;
  poll(dt);
  const two = twoHalves();
  if (two || (!G.paused && !gameOpen())) {
    G.heroes.forEach((h, i) => {
      // (two players) a child with a window open in their half waits; the other keeps playing
      if (two && G.halfBusy(i)) { pads[i].act(); pads[i].jump(); pads[i].menu(); h.state = 'idle'; h.finish(dt, t, G, 0); return; }
      if (pads[i].menu()) { G.lastPlayer = i; G.openPad(i); return; }
      // following a friend (owner, round G): walk behind them by yourself; touching the joystick stops it
      if (h.followId) {
        const P = G.partners[h.followId], pd = pads[i];
        if (!P || P.pos.y < -40) { h.followId = null; hudFor(h).toast('👣 ' + T('Your friend left: stopped following.', 'Bạn đã đi: ngừng đi theo.')); }
        else if (pd.mx || pd.mz) { h.followId = null; h.goal = null; hudFor(h).toast('👣 ' + T('Stopped following.', 'Ngừng đi theo.')); }
        else { const dx = P.pos.x - h.pos.x, dz = P.pos.z - h.pos.z, d = Math.hypot(dx, dz); if (d > 3.2) { h.goal = { x: P.pos.x - dx / d * 2.2, z: P.pos.z - dz / d * 2.2 }; h.goalT = 0; if (d > 40 && !(h._followHop > performance.now())) { h._followHop = performance.now() + 5000; G.travel(h, P.pos.x - dx / d * 3, P.pos.z - dz / d * 3); } } else if (h.goal) h.goal = null; }
      }
      h.update(dt, pads[i], t, G);
      if (i === 0) watchHero(h, pads[i], dt, G.regionOf[i]); // stuck: pushing to walk without moving (Studio's report)
      if (!h.profile.quests.owl && !G._owlAuto && dist2(h.pos.x, h.pos.z, owl.x, owl.z) < 6) { G._owlAuto = true; owlTalk(h); }
      if (h.goalAct && !h.goal) { const it = h.goalAct; h.goalAct = null; if (dist2(h.pos.x, h.pos.z, it.x, it.z) < it.r + .8) { SFX.tap(); (G.lastPlayer = i, startAct(it, h)); } }
      const it = h.carry ? h.carryIt || null : nearest(h);
      if (it && it.auto) (G.lastPlayer = i, it.act(h, G));
      G.huds[i].setAction(it && !it.auto ? it : null);
      h._dancing = G.places.onStage(h);
      if (pads[i].act() && it) { SFX.tap(); (G.lastPlayer = i, startAct(it, h)); }
      // discover shrines and towers you walk near
      for (const s of [...SHRINES, ...TOWERS]) if (!h.profile.discovered[s.id] && dist2(s.x, s.z, h.pos.x, h.pos.z) < 45) { h.profile.discovered[s.id] = true; save(); }
      const rg = h.indoors ? G.regionOf[i] : regionAt(h.pos.x, h.pos.z); // inside a house: still where the house is
      if (rg !== G.regionOf[i]) {
        if (i === 0) setTimeout(() => G.shareStatus(), 50);
        if (G.regionOf[i] !== null) { const sub = regionLabel(rg); G.huds[i].showRegion(REGION_NAMES[rg]() + (sub ? ' · ' + sub : '')); }
        { const who = makeId('player', h.profile.id || 'guest'); if (G.regionOf[i]) events.emit('PlayerLeftVillage', { playerId: who, villageId: makeId('place', G.regionOf[i]) }); if (rg) events.emit('PlayerEnteredVillage', { playerId: who, villageId: makeId('place', rg), first: !(h.profile.visited || {})[rg] }); }
        G.regionOf[i] = rg; if (G.lanterns) G.lanterns.onRegion(h, rg);
        const vis = h.profile.visited = h.profile.visited || {}; if (!vis[rg]) { vis[rg] = true; save(); }
        if (rg === 'village' && !h.profile.quests.village) { h.profile.quests.village = true; save(); hudFor(h).toast(T('Welcome to Lotus Village! Xin chào!', 'Chào mừng đến Làng Sen!')); checkQuests(h); } // (words, not a voice)
      }
    });
  } else {
    pads.forEach(p => { p.act(); p.jump(); p.menu(); });
    if (G.closeUp != null && G.heroes[G.closeUp]) { const h = G.heroes[G.closeUp]; h.state = 'idle'; h.finish(dt, t, G, 0); }
  }
  walkedAway();
  if (G.seeThrough) G.seeThrough.step(dt);
  // music follows the first player
  const h0 = G.heroes[0];
  // (round N) during a festival its own songs play; in the Vietnam areas, Vietnamese tunes (a family's recordings from
  // Studio first); the 🎵 Songs page, while open, chooses the music itself
  if (h0 && !gameOpen() && !Music.pinned) {
    const rg = G.regionOf[0], nearPond = G.farm && dist2(h0.pos.x, h0.pos.z, G.farm.pondPos.x, G.farm.pondPos.z) < 12;
    const fest = G.festivals && G.festivals.current && G.festivals.current(), festSongs = fest ? songsFor(fest) : [], turn = l => l[Math.floor(t / 90) % l.length];
    Music.play(G.places.dancing ? G.places.song() : h0.gliding ? 'glide' : festSongs.length ? turn(festSongs) : nearPond ? 'pond' : rg === 'home' ? 'farm' : world.isNight() ? 'night'
      : VN_AREAS.includes(rg) ? turn(songsFor('vn')) : SHRINES.some(s => dist2(s.x, s.z, h0.pos.x, h0.pos.z) < 8) ? 'shrine' : 'field');
  }
  $('#songBtn').hidden = !G.places.dancing || G.paused;
  if (!G.paused) world.updateSky(dt, h0.pos, h0.pos);
  if (G.lookUpT > 0) G.lookUpT -= dt;
  // friends online
  for (const P of Object.values(G.partners)) {
    const r = Net.remotes[P.id]; if (!r || !r.s) continue; const s = r.s;
    P.pos.lerp(_np.set(s.x, s.y, s.z), Math.min(1, dt * 10)); P.yaw = s.yaw;
    P.av.root.position.copy(P.pos); P.av.root.rotation.y = P.yaw; P.av.anim(s.st || 'idle', t, s.sp || 0); P.tag.position.set(P.pos.x, P.pos.y + 2.0, P.pos.z);
  }
  // bubbles
  G.bubbles = G.bubbles.filter(b => { const p = b.target.pos; b.s.position.set(p.x, p.y + 2.45, p.z); if (now > b.until) { scene.remove(b.s); b.s.material.map.dispose(); b.s.material.dispose(); return false; } return true; });
  // save positions now and then
  // (every 5 s of real time: game time runs slow on a struggling phone, which saved far less often)
  if (now - saveT >= 5000) { saveT = now; keepSpot(); save(); }
  // one minute of play for the grown-ups' report (real minutes, only while the game is in front and not on a menu)
  if (now - minT >= 60000) { minT = now; if (!document.hidden && !G.paused) G.heroes.forEach(h => addMinute(h.profile)); }
  // render each player's view
  const r = rects(), H = vh();
  renderer.setScissorTest(G.heroes.length > 1);
  G.heroes.forEach((h, i) => {
    const q = r[i];
    renderer.setViewport(q.x, H - q.y - q.h, q.w, q.h); renderer.setScissor(q.x, H - q.y - q.h, q.w, q.h);
    G.showcaseCam(i, h, dt); // a landmark fly-around takes over the camera
    if (r.length > 1) aimCam(h, q);
    world.updateSky(0, h.cam.position, h.pos);
    withRideView(h, () => renderer.render(scene, h.cam)); drawn += renderer.info.render.calls;
    if (G.nameTags) G.nameTags.update(i, h, q);
    const p = h.profile;
    // what the minimap shows, worked out only when it is redrawn
    const markersFor = () => { const markers = [];
    SHRINES.forEach(s => markers.push({ x: s.x, z: s.z, icon: p.shrines[s.id] ? '🔷' : '🔶', size: 16 }));
    TOWERS.forEach(tw => markers.push({ x: tw.x, z: tw.z, icon: '🗼', size: 18 }));
    G.PLACES.forEach(pl => markers.push({ x: pl.x, z: pl.z, icon: pl.icon, size: 18 }));
    NPCS.forEach(n => markers.push({ x: n.x, z: n.z, icon: '•', size: 14 }));
    G.ferries.ferries.forEach(F => markers.push({ x: F.model.position.x, z: F.model.position.z, icon: '⛴️', size: 16 }));
    G.heroes.forEach((o, j) => { if (j !== i) markers.push({ x: o.pos.x, z: o.pos.z, icon: '🧒', size: 18 }); });
    Object.values(G.partners).forEach(P => { if (P.pos.y > -40) markers.push({ x: P.pos.x, z: P.pos.z, icon: '🧒', size: 18, friend: P.name || '?' }); });
    const qt = questTarget(h); if (qt) markers.push({ x: qt.x, z: qt.z, pin: true });
    return markers; };
    G.huds[i].update(dt, h.cam, () => G.fogMapFor(p), markersFor);
  });
  // Slow active frames count too; title, idle, covered and hidden time reset the active interval.
  if (!BAT.idle && !document.hidden) { BAT.frames++; BAT.work += performance.now() - work0; BAT.draws += drawn; if (BAT.lastDrawn > 0) BAT.ms += Math.max(0, now - BAT.lastDrawn); BAT.lastDrawn = now; }
  else BAT.lastDrawn = 0;
}

// ---------- boot ----------
loadClips();
createChatter(G);
setupNPCs(); setupInteractables();
bootMark('people'); G.farm = createFarm(G); world.updaters.push(G.farm.update); await breathe();
G.places = createPlaces(G); world.updaters.push(G.places.update);
world.heroesNear = (x, z, r) => G.heroes.some(h => dist2(h.pos.x, h.pos.z, x, z) < r);   // (Round V) a ridden animal goes home out of every child's sight
G.town = createTown(G);
G.GAMES_ICON = id => (GAMES[id] || {}).icon || "🎮";
createRegions(G);
G.dialog = (name, lines, choices) => dialog(name, lines, choices);
// little ones (under 5) get big picture buttons in conversations
dialogHooks.little = () => G.heroes.some(h => h.profile.age !== 'big');
// where everyone stood when a conversation opened; walking about 9 m away closes it (checked in the loop)
dialogHooks.where = () => G.heroes.map(h => ({ x: h.pos.x, z: h.pos.z }));
// Any talk box (a villager's words, the chat window, "where are my friends", the picture choices) closes by itself
// when the child walks 6 m away from where it opened (owner, round 30). G.walkAwayClose(box, close) signs a box up.
const WALK_AWAY = 6;
G.walkAwayClose = (node, close) => { node._from = G.heroes.map(h => ({ x: h.pos.x, z: h.pos.z })); node._autoClose = close; node.classList.add('walkclose'); };
const walkedAway = () => {
  if (G.travelling) return;
  for (const d of document.querySelectorAll<SvWalkClose>('.dialog:not(.out), .walkclose')) {
    if (!d._from || !d._autoClose || !d._from.length) continue;
    if (G.heroes.every((h, k) => !d._from[k] || dist2(h.pos.x, h.pos.z, d._from[k].x, d._from[k].z) > WALK_AWAY)) { const f = d._autoClose; d._autoClose = null; f(); SFX.tap(); }
  }
};
onLang(() => G.huds.forEach(hd => hd.refreshWho && hd.refreshWho()));
createAsia(G);
bootMark('town'); createRoads(G); bootMark('roads'); await breathe();
createCities(G);
createHawkers(G);
createSuburbs(G); // speciality buildings along the roads out of each city (before the homes are made)
world.familyBuilt = addFamilyBuildings(G); // houses and buildings the family added in Sparkle Studio (they become homes too)
buildPowerLines(G); // power poles (when switched on in Studio) wired to each other by themselves
bootMark('pretraffic'); createTraffic(G); bootMark('traffic'); await breathe(); // motorbikes, cars, buses, trams, xích lô and bicycles (js/traffic.js; Studio switches)
createHeritage(G, { give, sfx: SFX, say, toast: (h, m) => hudFor(h).toast(m) });
createSymbols(G, { sfx: SFX, dialog }); // each region's symbol animal, in a corner of its city square
createRegionSites(G); // more famous places of each region, just outside its city
createVnFun(G, { sfx: SFX, say, dialog, toast: (h, m) => hudFor(h).toast(m) }); // children playing north and south; buffalo and bull festivals
G.placeBook = createPlaceBook(G, { toast: (h, m) => hudFor(h).toast(m), save }); // the places sticker book listens to the event bus (js/placebook.js)
G.familyCards = createFamilyCards(G, { toast: (h, m) => hudFor(h).toast(m), save }); // family photos from Studio arrive as postcards (js/familycards.js)
attachStickers(G); // the sticker book knows who is playing (js/stickers.js)
G.myHouse = G.homes ? createMyHouse(G) : null; // decorate your own house at Sunny Farm (js/myhouse.js)
G.report = createReport(G, { save }); // the play report for grown-ups counts games and minutes (js/report.js)
G.coop = createCoop(G, { Net, toast: (h, m) => hudFor(h).toast(m) }); // together quests in an online room (js/coop.js)
G.chests = createTwinChests(G, { toast: (h, m) => hudFor(h).toast(m), save }); // treasure chests that open for two friends (js/twinchests.js)
G.lotus = createLotus(G, { say, toast: (h, m) => hudFor(h).toast(m) }); // Lotus Village: well, shrine, pond bench and boat, hens, a dog, a bicycle and a buffalo cart (Phase 2)
G.reward = reward;
G.pets = createPets(G);
G.ferries = createFerries(G);
G.kites = createKites(G);
createPassport(G);
G.festivals = createFestivals(G);
// (owner, 12 Oct) the auto play check for grown-ups testing the game: only on the devices Studio's Releases page allows
// (switch `autoplay`: every device, or the ticked ones); everywhere else nothing of it is even downloaded
{ const apGate = async () => { const A = await import('./content/autoplay.js'); let me = ''; try { me = localStorage.getItem('sv2_playerid') || ''; } catch (e) { }
    if (A.apAllowed(releaseOn('autoplay', false) && liveRule('tester')?.policies?.[me]?.autoplay !== false, liveRule('autoplay'), me)) (await import('./autoplay.js')).mountAutoplay(G); else if (G.autoplay) G.autoplay.unmount(); };
  apGate(); onLive(apGate); }
// (owner, 12 Oct) tester devices report problems by themselves and with the ladybird (js/testergate.js, js/tester.js)
import('./testergate.js').then(m => m.testerGate(G));
G.weather = createWeather(G);
createFun(G);
createLearning(G);
// the main story, Đèn Lồng Thung Lũng (js/lanterns.js, chapters in js/content/chapters.js): after the storyteller and the villagers
G.npcAt = id => (n => n && { x: n.x, z: n.z })(NPCS.find(n => n.id === id));
// (loaded while the valley is built behind the title screen, so the title comes up sooner: PERF-001)
const [{ createLanterns }, { createYard }, { createKidPlay }] = await Promise.all([import('./lanterns.js'), import('./yard.js'), import('./kidplay.js')]);
G.lanterns = createLanterns(G, { dialog, say, reward, save, openTheatre });
// bà Huệ and ông Nghi's yard near the Huệ Nghi shop (js/yard.js): a side story
G.yard = createYard(G, { dialog, say, reward, save });
// the companion grows, a coin goal, a gift every day (js/kidplay.js; Studio group 'For little ones')
G.kidplay = createKidPlay(G, { say, save });
createShowcase(G);
world.updaters.push((dt, t) => tickAnimals(dt, t, G.heroes)); // every animal walks, hops, wags and looks around
createGathering(G, { give, sfx: SFX, say, toast: (h, m) => hudFor(h).toast(m) });
setupTrading(G);
// "My market stall" at the Three Regions Market: trade with friends who are playing online
{
  const S = rowSlot('market', 9, 1.4), sx = S.x, sz = S.z, y = heightAt(sx, sz), parts = [];   // (T1b) in the market row, after the south's stalls
  parts.push(P(new THREE.BoxGeometry(2.6, .9, 1.2), '#c98a4a', [0, .45, 0]), P(new THREE.BoxGeometry(2.8, .1, 1.4), '#f6e7c8', [0, .95, 0]));
  [[-1.25, -.55], [1.25, -.55], [-1.25, .55], [1.25, .55]].forEach(([x, z]) => parts.push(P(new THREE.CylinderGeometry(.06, .06, 2.3, 6), '#8a5a3b', [x, 1.15, z])));
  for (let i = 0; i < 6; i++) parts.push(P(new THREE.BoxGeometry(.5, .08, 1.7), i % 2 ? '#ffffff' : '#2fb04f', [-1.25 + i * .5, 2.35, 0], [.12, 0, 0]));
  const balls: [string, number][] = [['#ff4f9a', -.8], ['#ffd23f', -.2], ['#3cc7e8', .4], ['#5fd36a', .9]]; balls.forEach(([c, x]) => parts.push(P(new THREE.SphereGeometry(.16, 10, 8), c, [x, 1.12, .15])));
  const m = new THREE.Mesh(merge(parts), toonVC()); m.position.set(sx, y, sz); m.rotation.y = S.face; m.castShadow = true; scene.add(m); world.colliders.push({ x: sx, z: sz, r: 1.4 }); world.stalls.push({ id: 'stall', place: 'market', kind: 'stall', x: sx, z: sz, w: 2.8, d: 1.4, face: S.face, tap: 'stall' });
  G.interactables.push({ id: 'stall', x: sx + S.fx * 1.45, z: sz + S.fz * 1.45, r: 3, icon: '🏪', label: () => T('My market stall: trade with friends', 'Sạp hàng của con: đổi đồ với bạn'), act: h => G.openTrade(h.i) });
}
// ---- (round S, owner plan 8 Oct: Round R Part 2 items 6 and 10) the clothes shop by the market and the wardrobe (js/shop.js);
// mystery boxes, family rankings and the collection book for 5 to 8 year olds at Medium or Hard (js/boxes.js) ----
{ const [{ createShop }, { createBoxes }] = await Promise.all([import('./shop.js'), import('./boxes.js')]); G.shop = createShop(G, { say, save }); G.boxes = createBoxes(G, { say, save }); }
// ---- (round S) end ----
// villagers the family added in Sparkle Studio (content pack "npcs"): placed where they were put on the map, saying
// their own lines in both languages
G.parked = PARKED; // (round T) the family's Studio map content made on an older layout: put aside, never placed
for (const c of (Array.isArray(CUSTOM.npcs) ? CUSTOM.npcs : []).slice(0, 60)) {
  const position = studioPosition(c, STUDIO_ON_MAP);
  if (!position || Math.abs(position.x) > HALF - 10 || Math.abs(position.z) > HALF - 10) continue;
  const name = String(c.name || '').trim().slice(0, 40); if (!name) continue;
  const L = c.look || {}, hex = v => typeof v === 'string' && /^#[0-9a-f]{6}$/i.test(v) ? v : null;
  const look = { style: ['dress', 'shirt', 'aodai', 'tunic', 'overalls', 'hoodie'].includes(L.style) ? L.style : 'shirt', color: hex(L.color) || '#5fb0ff', hat: 'none', back: 'none', hair: hex(L.hair) || '#2a1d14', hairStyle: ['buns', 'short', 'long', 'ponytail', 'spiky'].includes(L.hairStyle) ? L.hairStyle : 'short', skin: hex(L.skin) || '#f1c6a4', glider: 0, age: L.age === 'old' || L.age === 'kid' ? L.age : 'adult' };
  const lines = (Array.isArray(c.lines) ? c.lines : []).filter(l => Array.isArray(l) && (l[0] || l[1])).slice(0, 12).map(l => [String(l[0] || l[1]).slice(0, 300), String(l[1] || l[0]).slice(0, 300)]);
  if (c.gender === 'f' || c.gender === 'm') { CUSTOM.genders = { ...(CUSTOM.genders || {}), [name]: c.gender }; setVoiceGenders(CUSTOM.genders); }
  addNPC({ id: 'fam_' + (c.id || name.replace(/[^\p{L}\p{N}]+/gu, '_')), name, faceName: c.faceName, look, x: position.x, z: position.z, face: +c.face || 0, icon: typeof c.icon === 'string' ? c.icon.slice(0, 4) : '💬', talk: () => dialog(name, lines.length ? lines : [['Hello! Nice to see you!', 'Xin chào! Gặp con vui quá!']]) });
}
// each village's games time table (with a countdown board) and its singer; after every host is in place
G.folkShow = createFolkShow(G, { looks: [kidLook('shirt', '#ff7eb8', '#1d1412', 'buns', 'none'), kidLook('overalls', '#3cc7e8', '#3b2618', 'short', 'cap'), kidLook('dress', '#ffb52e', '#1d1412', 'ponytail', 'flower')] });
// (round S, owner plan 8 Oct) Hội làng three times a day, surprises, and the grown-ups' features: each in its own file,
// loaded while the valley is built (js/hoilang.js after the games boards it uses; Studio switches in the 'kids' group)
{ const [{ createHoiLang }, { createSurprises }, { createParents }] = await Promise.all([import('./hoilang.js'), import('./surprises.js'), import('./parents.js')]);
  G.hoilang = createHoiLang(G, { say, save, reward }); G.surprises = createSurprises(G, { say, reward }); G.parents = createParents(G, { say, save, reward }); }
// (Play reading trial, owner 11 Oct AEDT) the ten reading games load only while Studio's readingTrial switch is on (now, or when it is switched on);
// on unless Studio switches it off (owner, 12 Oct AEDT)
// (batch rollout: also for a child who already played a reading game, checked again when a session starts)
{ const rd = () => { if (keptOn('readingTrial')) import('./games/readingmenu.js').catch(() => { }); }; rd(); G.readingCheck = rd; import('./custom.js').then(C => C.onLive(rd)); }
// level land under every building, stall and landmark placed above (and anything added in future rounds)
world.familyEdits = applyWorldEdits(G); // buildings the family moved or removed in Sparkle Studio
bootMark('things'); widenFlatLand(world, scene); bootMark('wideland'); await breathe(); // more level land round every village and city, for new buildings (nothing moves on the map)
createAds(G); // the family's own signboards (only when Sparkle Studio switched ads on)
world.levelled = levelUnderBuildings(world, scene); bootMark('levelled'); await breathe();
G.plots = createPlots(G); // (round T3) the Memory Villages' garden plots and the spare ones by each city, on their levelled ground
G.reeds = createReeds(G); // (round T4a) reeds along the banks, water hyacinth in the quiet waters (two draws)
world.roadside = plantRoadside(G); // soft road edges and flowers, once everything stands
G.signposts = createSignposts(G); // (round T4b, js/signposts.js) a picture signpost at every road junction
G.nameTags = createNameTags(G); // (round T4b, js/nametags.js) names float over the places nearby, at most 4
bootMark('roadside'); G.solidsReady = buildSolids(G); bootMark('solids'); // (no breath here: the solid map is read once everything below is placed too) // nobody walks through houses and things (js/solids.js)
startPackBar(); // the recorded voices downloading: a small bar at the bottom (js/packbar.js)
startCounting(G); // how many children play, and what they play, for Studio's report (js/players.js; Grown-ups can switch it off)
// solid things the camera must never go inside: big, opaque, still-standing meshes (collected once, refreshed
// now and then so new houses, landmarks and boats are included)
{
  let list = [];
  const collect = () => {
    list = []; const sphere = new THREE.Sphere();
    scene.traverse(o => {
      if (!(o instanceof THREE.Mesh) || o instanceof THREE.InstancedMesh || o.userData.outline || o.userData.noCam || o === world.terrain || !o.visible) return;
      const mt = o.material; if (!mt || Array.isArray(mt) || mt.transparent || mt.side === THREE.BackSide || mt.isMeshBasicMaterial) return;
      if (!o.geometry.boundingSphere) o.geometry.computeBoundingSphere();
      sphere.copy(o.geometry.boundingSphere).applyMatrix4(o.matrixWorld);
      if (sphere.radius < 3 || sphere.radius > 120) return; // trees, lamps and stalls are too small to matter
      if (G.heroes.some(h => h.av.root.getObjectById(o.id))) return;
      list.push(o);
    });
    mats = [...new Set(list.map(o => o.material))];
  };
  let at = -1e9;
  let mats = [];
  G.camBlockerMats = () => mats;
  G.seeThrough = createSeeThrough(G); // (bug #33) things between the camera and a child fade instead of pulling the camera in
  G.camBlockers = () => { const now = performance.now(); if (now - at > 8000) { at = now; collect(); } return list; };
}
// (round T, PERF-003) far small things: in the 480 m valley a child can see right across it, and the fog hides what is
// far away anyway. Each small thing (a person, a stall, a house, a motorbike: a top-level shape no wider than SMALL m,
// taken whole so its parts go together) further from every camera than its size allows is not drawn: a 1 m lantern
// from 110 m, a 7 m house from 230 m, never more than FAR m. Busy little things (people, vehicles: thousands of
// triangles per metre of size) go from DETAIL m, where a child is about 15 px tall. The dark outlines go from OUTLINE m:
// they are about 0.01 m wide, a sixth of a pixel there (characters already hide theirs from 30 m). What is not drawn
// moves to layer 1, which the cameras do not show (`visible` is left alone). Checked twice a second; the list is
// gathered again every 30 s, and what is added to the scene joins it straight away.
{
  const FAR = 240, DETAIL = 65, OUTLINE = 40, SMALL = 14, BUSY = 4000, LABEL = 80, BUBBLE = 100, units = [], box = new THREE.Box3(), s = new THREE.Sphere(), v = new THREE.Vector3();
  let at = -1e9, next = 0, count = -1, seen = new WeakSet();
  const skip = o => o === world.terrain || o.userData.road || o.userData.noFar || o.isInstancedMesh || o.isLight || o.isCamera;
  const visit = (o, top, heroes) => {
    if (skip(o) || heroes.has(o)) return;
    box.setFromObject(o); if (box.isEmpty()) return; box.getBoundingSphere(s);
    if (s.radius > SMALL) { o.children.forEach(c => visit(c, top, heroes)); return; }
    const meshes = []; let tris = 0;
    o.traverse(m => { if (!(m.isMesh || m.isSprite) || skip(m)) return; meshes.push(m); const g = m.geometry; if (m.isMesh) tris += (g.index ? g.index.count : g.attributes.position.count) / 3; });
    if (!meshes.length) return;
    // (r86, S3) a picture or name on a sprite is unreadable from LABEL m (about 25 px wide on a phone); an activity's
    // bubble, which shows children where the fun is, stays to BUBBLE m. Each sprite is a draw of its own.
    const flat = meshes.every(m => m.isSprite), d = flat ? Math.min(FAR, o.userData.it ? BUBBLE : LABEL) : Math.min(FAR, 90 + 20 * s.radius, tris > BUSY * Math.max(1, s.radius) ? DETAIL : FAR);
    o.updateMatrixWorld(); units.push({ o, top, c: o.worldToLocal(s.center.clone()), far2: d * d, meshes });
  };
  // (all of it every 30 s; in between only what was added to the scene, which takes no time)
  const gather = full => {
    const heroes = new Set(G.heroes.map(h => h.av.root));
    const drop = u => u.meshes.forEach(m => m.layers.set(0)); // (shown again; measured afresh if it comes back)
    if (full) { units.forEach(drop); units.length = 0; seen = new WeakSet(); }
    else for (let i = units.length; i--;) if (units[i].top.parent !== scene) { drop(units[i]); seen.delete(units[i].top); units.splice(i, 1); }
    for (const o of scene.children) if (!seen.has(o)) { seen.add(o); visit(o, o, heroes); }
  };
  G.farCull = now => {
    if (now < next || !G.heroes.length) return; next = now + 500;
    if (now - at > 30000) { at = now; count = scene.children.length; gather(true); }
    else if (scene.children.length !== count) { count = scene.children.length; gather(false); } // (vehicles are made when a child comes near)
    const cams = G.heroes.map(h => h.cam.position), O2 = OUTLINE * OUTLINE;
    for (const u of units) {
      v.copy(u.c).applyMatrix4(u.o.matrixWorld); let d2 = 1e12;
      for (const c of cams) d2 = Math.min(d2, (c.x - v.x) ** 2 + (c.z - v.z) ** 2);
      for (const m of u.meshes) m.layers.set(d2 > u.far2 || (m.userData.outline && d2 > O2) ? 1 : 0);
      // (battery round) a person's still copy, made after the list was gathered, goes with the person
      const st = u.o.userData.still; if (st) for (const m of st.children) m.layers.set(d2 > u.far2 || (m.userData.outline && d2 > O2) ? 1 : 0);
    }
  };
}
G.openTrade = (i, id) => { if (G.paused) return; openTrade(G, G.heroes[i], id); };
G.secrets = createSecrets(G);
ensureJobs();
G.claims.wrap(); // (after every pickup exists: first come, first served online)
createCrossings(G); // Road warnings beside the existing crossings, after all doors/stalls are known.
setupBubbles(); setupAreaSigns(); setupGuides();
$('#songBtn').onclick = () => G.places.nextSong();
resize();
// (round R, faster launch) the first picture prepares every material's shader at once (a few seconds on a phone): the
// title is already painted by then, and the valley is drawn behind it a frame later
{ let go = false; const start = () => { if (go) return; go = true; bootMark('shaders'); requestAnimationFrame(frame); };
  requestAnimationFrame(() => setTimeout(start, 30)); }
// (Round U, owner: rows and pages scroll by finger and mouse everywhere: js/scrollhelp.js; loaded after the title)
import('./scrollhelp.js').then(m => m.installScrollHelp());
// (Round U) every villager answers a tap with a fact or a saying of their region (js/villagertalk.js)
import('./villagertalk.js').then(m => m.createVillagerTalk(G)).then(() => import('./dayplan.js')).then(m => m.createDayPlan(G));   // (Round U) villagers' day plan
import('./pricetags.js').then(m => m.createPriceTags(G));
import('./jobs.js').then(m => m.createJobs(G));
import('./wayfind.js').then(m => m.createWayfind(G));   // (Round U) "Where is…?" sparkles
G.openWhere = i => featureOn('wayfind', false) && G.wayfind && G.wayfind.open(i);
onLive(() => { if (!featureOn('wayfind',false)) { G.wayfind?.stop(true); document.querySelectorAll<HTMLElement>('.wherepick').forEach(m => m.querySelector<HTMLElement>('.x')?.click()); } });
import('./animalhomes.js').then(m => m.createAnimalHomes(G));   // (Round U) animals with homes   // (Round U) a job board in every place   // (Round U) a coin-picture price over every food stall
// (Round U) a tap on a coin, orb or Leafy chip (top bar, Backpack) says what it is (js/chipinfo.js, loaded on the first tap)
document.addEventListener('click', e => { const c = e.target instanceof Element && e.target.closest<HTMLElement>('[data-chip]'); if (c) import('./chipinfo.js').then(m => m.showChip(c.dataset.chip, c)); });
import('./state.js').then(S => { if (S.restoredFromCopy) setTimeout(() => toast(T('Your progress was brought back from the safe copy on this device.', 'Tiến trình chơi đã được khôi phục từ bản lưu dự phòng trên máy.')), 1200); });
document.addEventListener('visibilitychange', () => { if (document.hidden) { if (playing) keepSpot(); save(); hush(); } });
addEventListener('pagehide', () => { if (playing) keepSpot(); saveProfiles(true); });
bootMark('ready'); G.bootTimes = bootTimes; bootDone();
// (owner, 16 Oct AEDT) no device contacts the family service unless Studio switches the trial on, or on a tester device
{ const refresh = () => (featureOn('familyDevices', false) || G.tester) ? import('./familydevices.js').then(m => m.refreshDevicePhotos()).catch(() => {}) : null; refresh(); addEventListener('online', refresh); setInterval(refresh, 60000); }
