import { testerArcadeAvailable } from './content/tester-arcades.js';
import { subjectDifficulty, useAreas } from './content/subjects.js';
import { GAME_INFO as SUBJECT_AREAS } from './content/activities.js';
import { fruitParadeAvailable } from './content/fruit-parade.js';
// Sparkle Valley: boot, the game loop, split-screen, NPCs, quests and rewards.
import './emojiswap.js'; // (first: no phone emoji on the page or on any canvas)
import { THREE, sprite, P, merge, toonVC } from './gfx.js';
import { createSeeThrough } from './seethrough.js';
import { withRideView } from './rideview.js';
import { mountRenderRecovery } from './render-recovery.js';
import { gpuInfo } from './gpu.js';
import { RoomEnvironment } from '../vendor/RoomEnvironment.js';
import { settings, saveSettings, saveProfiles, farm, profiles, claimTab, heldByOtherTab } from './state.js';
import { T, nm, onLang, registerName } from './i18n.js';
import { say, hush, loadClips, setVoiceGenders } from './voice.js';
import { SFX, Music, ac } from './audio.js';
import { ICONS } from './icons.js';
import { openSongs } from './songs.js';
import { songsFor, VN_AREAS, familySongs } from './content/songs.js';
import { fmt } from './money.js';
import { el, esc, $, dist2, pick, wait, clamp } from './util.js';
import { createWorld, levelUnderBuildings, widenFlatLand, paintMap, paintWater, paintMapRows, paintWaterRows, heightAt, regionAt, REGION_NAMES, MARKET, CHINA, INDIA, SHRINES, TOWERS, LEAFIES, VILLAGE, HOME, PLAYGROUND, REVEAL_R, WATER, PLATEAU, TOWN, AUSSIE, LAKE, ULURU, HALF, STUDIO_ON_MAP, PARKED, CITIES } from './world.js';
import { studioPosition } from './studio-position.js';
import { landmarkAt, MAP_VERSION, onThisMap, rowSlot } from './content/map.js';
import { build, seatRider, VEHICLES } from './vehicles.js';
import { buildAvatar, nameAvatar, applyNpcFaces, buildOwl, buildGourd, avatarURL, OUTLINED, showStill, wakeLateAvatars, lateLeft, buildAllLate, loadFriendModels, wearVillagerModel } from './avatar.js';
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
import { canStartGame, openGame, gameOpen, GAMES } from './games/frame.js';
import { gameInfo } from './content/activities.js';
const gameInfoAge = id => { try { return gameInfo(id).ageMin; } catch (e) { return 0; } };
import './games/all.js'; // every mini-game (js/games/all.js)
import { openHowTo } from './howto.js';
import { createFarm, jobProgress, ensureJobs } from './farm.js';
import { createPlaces } from './places.js';
import { createTown } from './town.js';
import { SCHOOL } from './content/school-place.js';
import type { createSchool } from './school.js';
import { createRegions, LANDMARKS } from './regions.js';
import { createGathering } from './gather.js';
import { tickAnimals } from './animals.js';
// (v1.07 startup, PERF-001) about twenty parts of the valley (Asia, heritage sites, pets, ferries, festivals, traffic, the
// folk show, learning corners...) are made during the build steps after the title screen: loaded then (`later` below), not
// in the start-up download; only their types are imported here
import type { createPets } from './pets.js';
import type { createFerries } from './ferry.js';
import type { createFestivals } from './festivals.js';
import {configureFestivalStartup} from './festival-live.js';
import {projectPublicFestivals} from './content/festival-visibility.js';
import {FESTCAL} from './content/festcal.js';
import { createRoads, plantRoadside, createCrossings } from './roads.js';
import { addArea, startAreas, areasNear, areasDone, areasLeft, areaList } from './areas.js'; // (v1.08d valley) parts built after the start, nearest first
import type { createSignposts } from './signposts.js';
import type { createWeather } from './weather.js';
import { createNameTags } from './nametags.js';
import { RELEASES } from './content/releases.js';
import { liveBoot, releaseNew, featureOn, releaseOn, liveRule, onLive, keptOn, markTried, triedFromSave, setPlayers, MONEY_GAMES } from './custom.js';
import { cachedCanvas } from './worldcache.js';
import { recall, preload } from './worldmemo.js';
import { events } from './core/events.js';
import { createPlaceBook } from './placebook.js';
import { createFamilyCards } from './familycards.js';
import { attach as attachStickers } from './stickers.js'; // the sticker book (chat B, 16 Oct): give(id), has(id), count()
import type { createMyHouse } from './myhouse.js';
import { createReport, addMinute } from './report.js';
import { createCoop } from './coop.js';
import { createTwinChests } from './twinchests.js';
import { createClaims } from './claims.js';
import { createNetGames, onlineDef, ONLINE_GAMES } from './netgames.js';
import { createSimple, wantsSimple, warmLumi } from './simple.js';
import { id as makeId } from './core/ids.js';
import { createCities } from './cities.js';
import { createChatter, LINES as CHAT_LINES } from './chatter.js';
import { createKites } from './kite.js';
import { createPlots } from './plots.js';
import { createReeds } from './reeds.js';
import type { createLotus } from './lotus.js';
import { addFamilyBuildings, applyWorldEdits } from './worldedit.js';
import { buildPowerLines } from './powerlines.js';
import { CUSTOM } from './custom.js';
import type { createFolkShow } from './folkshow.js';
import { createAds } from './ads.js';
import { buildSolids, solidCircleHit } from './solids.js';
import { startCounting, countPlay, watchHero, noteReload, managementBootReady } from './players.js';
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
import type { createSecrets } from './secrets.js';
import { PROLOGUE, showStory, storyCheck, showQuestTale, QUEST_TALES } from './story.js';
import { openWardrobe, openGamesHub, openQuick, nextGameAfter } from './ui.js';
import { installOnlineGames } from './main/online-games.js';
import type { RideCar } from './main/online-games.js';
import { installFriends } from './main/friends.js';
import { installTalks } from './main/talks.js';
import { installQuests } from './main/quests.js';
import { installInteractables } from './main/interactables.js';
import { installHeroEvents } from './main/hero-events.js';
import { installTalking } from './main/talking.js';
import { installLayout } from './main/layout.js';
// (owner point 10) this page is the game: it claims the tab, so an older game tab stops saving (js/state.js)
claimTab();

// ---------- renderer & world ----------
// (battery round, owner 12 Oct AEDT) Graphics: Fast, Auto, Pretty (60 frames a second) and Pretty+ ('max': the same
// picture as Pretty, drawn as fast as the screen goes)
// (#341, v1.07) a computer drawing without a working graphics chip (js/gpu.ts) gets the lighter picture on Auto too
const GPU = gpuInfo();
const quality = settings.quality === 'auto' ? (GPU.soft || (navigator.hardwareConcurrency || 4) <= 4 || Math.min(screen.width, screen.height) < 500 ? 'low' : 'mid') : settings.quality === 'max' ? 'high' : settings.quality;
// (battery round) the device's everyday graphics chip, not its strongest one: a MacBook's big chip and a phone's top
// speed drain the battery for a picture the children cannot tell apart
const PR_AUTO = 1.5; // (battery round) on Auto the picture is never drawn sharper than 1.5x the screen's pixels
let renderer;
try { renderer = new THREE.WebGLRenderer({ antialias: quality !== 'low', preserveDrawingBuffer: false, powerPreference: 'default' }); }
catch (cause) { const error = new Error('The 3D picture could not start.', { cause }); error.name = 'GraphicsUnavailableError'; throw error; }
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, quality === 'low' ? 1.25 : quality === 'high' ? 2 : settings.quality === 'auto' ? PR_AUTO : 1.6));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.NoToneMapping; // flat illustrated colours, exactly as painted
if (quality !== 'low') { renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap; }
document.getElementById('stage').appendChild(renderer.domElement);
// Suspended Home Screen apps need a fresh frame clock and drawing buffer on return.
// Never start a reload timer in the background: it may fire before the browser restores WebGL.
let resumeDrawing: (() => void) | undefined;
let rememberRecoverySpot: (() => void) | undefined;
const restoreContext = renderer.getContext().getExtension('WEBGL_lose_context');
mountRenderRecovery({
  canvas: renderer.domElement,
  lost: () => renderer.getContext().isContextLost(),
  restore: () => restoreContext?.restoreContext(),
  refresh: () => resumeDrawing?.(),
  save: () => { try { rememberRecoverySpot?.(); } catch {} finally { saveProfiles(true); } },
  show: retry => {
    if (document.querySelector('.ctxlost')) return;
    const card = el('div', 'ctxlost', `<div>${pic('🌈')}</div><p>${T('The valley is coming back. Your saved progress is kept.', 'Thung lũng đang trở lại. Tiến trình đã lưu vẫn được giữ.')}</p>`);
    const button = el('button', 'btn primary big', T('Try again', 'Thử lại')); button.style.minHeight = button.style.minWidth = '64px'; button.onclick = retry; card.append(button); document.body.append(card);
  },
  hide: () => document.querySelectorAll('.ctxlost').forEach(e => e.remove()),
  reload: () => { noteReload('3D picture lost', G); location.reload(); }
});
const scene = new THREE.Scene();
{ // soft sky light bouncing off everything, so materials look real rather than flat
  const pm = new THREE.PMREMGenerator(renderer); scene.environment = pm.fromScene(new RoomEnvironment(), .04).texture; pm.dispose();
}
// how long each start-up step takes (ms since this file began; tests/run.mts "perf" and Grown-ups › Advanced read it)
const BOOT0 = performance.now(), bootTimes: Record<string, number> = { start: Math.round(BOOT0) }, bootMark = k => { bootTimes[k] = Math.round(performance.now() - BOOT0); const steps = ['world', 'people', 'town', 'roads', 'pretraffic', 'traffic', 'things', 'wideland', 'levelled', 'roadside', 'solids', 'shaders', 'ready']; const n = steps.indexOf(k); if (n >= 0) window.svLaunchProgress?.(n + 1, steps.length, T(`Preparing the valley: ${n + 1}/${steps.length}`, `Chuẩn bị thung lũng: ${n + 1}/${steps.length}`)); };
// (round R, faster launch) the title and "Who's playing?" show at once; the valley is built behind them in steps, with a
// breath between steps so the screen keeps answering taps. Pressing Go before it is ready waits a moment (startWhenBuilt).
let framesSeen = 0, framesDone = null; const firstFrames = new Promise(r => { framesDone = r; });
let bootDone = null, booted = false; const bootReady = new Promise<void>(r => { bootDone = () => { booted = true; r(); }; });
// (v1.08d valley, PERF-001) work that waits until the child can move: 1.5 s after the valley is ready its files are all
// fetched side by side, then each part is made in its own quiet moment of the page (requestIdleCallback, or a short pause
// where there is none), so the first walk never stutters and the first download is only what the start needs. A part
// that fails is only noted (it never stops the others).
type AfterPart<M> = { load: () => Promise<M>, make: (m: M) => unknown };
const afterQueue: AfterPart<any>[] = []; let afterOpen = false;
const idle = () => new Promise<void>(r => (window as any).requestIdleCallback ? (window as any).requestIdleCallback(() => r(), { timeout: 250 }) : setTimeout(r, 60));
const runPart = async <M,>(p: AfterPart<M>, loading: Promise<M>) => { try { const m = await loading; await idle(); await p.make(m); } catch (e) { console.warn('after start', e); } };
let afterChain: Promise<unknown> = Promise.resolve();
const startPart = <M,>(p: AfterPart<M>) => { const loading = p.load(); loading.catch(() => { }); afterChain = afterChain.then(() => runPart(p, loading)); };
const afterStart = <M,>(load: () => Promise<M>, make: (m: M) => unknown) => { const p = { load, make }; if (afterOpen) startPart(p); else afterQueue.push(p); };
void bootReady.then(() => setTimeout(() => { afterOpen = true; for (const p of afterQueue.splice(0)) startPart(p); }, 1500));
// (v1.07 startup) while a game or story opened from the Simple screen before the valley was built is up (simpleFirst),
// the building waits between its steps, so the game runs smoothly; it goes on when the child is back on the Simple screen
let earlySimple = false;
const breathe = async () => { await new Promise(r => setTimeout(r, 0)); while (earlySimple && (gameOpen() || document.querySelector('.theatre, .storybook'))) await new Promise(r => setTimeout(r, 300)); };
// (v1.07 startup, owner's plan focus 1: "the Simple screen does not need the 3D world, so it must open at once") a child
// alone who starts on the Simple screen and has seen Ông Cú's prologue gets it at once, before the valley is built: games
// and stories open over it as always. The session in the valley starts behind it once the valley is built and no game
// or story is open; a place or the valley button waits for it with the progress bar (G.untilValley).
let worldMade = false, sessionStarted = false, sessionUp: () => void = () => {}; const sessionReady = new Promise<void>(r => { sessionUp = r; });
// (v1.07, KE-HOACH focus 1 "can play") when a child could first play: the Simple screen up or the valley session started,
// in ms since the page was opened, and how long the child waited after Go; sent with the start-up timings (js/players.ts,
// js/tester.ts; kept apart from bootTimes, whose steps count from the game's code) so Studio shows real devices
const playTimes: { at?: number, waited?: number } = {}, canPlay = (waitedMs: number) => { if (playTimes.at == null) { playTimes.at = Math.round(performance.now()); playTimes.waited = Math.round(waitedMs); } };
const untilValley = async () => {
  if (sessionStarted) return;
  const w = document.createElement('div'); w.className = 'bootwait'; w.innerHTML = `<div class="spin"></div><p>${T('Getting the valley ready…', 'Đang chuẩn bị thung lũng…')}</p>`;
  document.body.appendChild(w); try { await sessionReady; } finally { w.remove(); }
};
function simpleFirst(mode, chosen) {
  const p = chosen[0];
  if (booted || !worldMade || mode !== 'solo' || chosen.length !== 1 || !wantsSimple(p) || !(p.story && p.story.prologue)) return false;
  setPlayers(chosen); G.mode = mode;
  const h = new Hero(0, p, scene, world), at = HOME_SPOT(0); h.place(at.x, at.z);
  G.heroes = [h]; G.huds = [new Hud(0, h, G)]; G.regionOf[0] = null;
  G.simple.show(); canPlay(0); earlySimple = true;
  void (async () => {
    await bootReady; earlySimple = false;
    // a game, story or film opened from the Simple screen finishes first
    while (gameOpen() || document.querySelector('.gl, .storybook, .theatre')) await wait(400);
    startSession(mode, chosen);
  })();
  return true;
}
async function startWhenBuilt(mode, chosen) {
  if (simpleFirst(mode, chosen)) return;
  const t0 = performance.now();
  if (!booted) {
    const w = document.createElement('div'); w.className = 'bootwait'; w.innerHTML = `<div class="spin"></div><p>${T('Getting the valley ready…', 'Đang chuẩn bị thung lũng…')}</p>`;
    document.body.appendChild(w); await bootReady; w.remove();
  }
  startSession(mode, chosen); canPlay(performance.now() - t0);
}
document.getElementById('boot')?.remove();
// (owner, 30 Oct 2026 AEDT: "it loads too long") "Who's playing?" opens at the first tap; only Go waits for the valley,
// with its progress bar (js/launch.js), and only when it is not built yet
showTitle(async () => { showWho((mode, chosen) => startWhenBuilt(mode, chosen)); });
// the region's sub-name under the region's name (js/symbols.js), once that part is loaded
let regionLabel: (rg: string) => string = () => '';
const openTheatre = (...a: Parameters<typeof import('./tales.js').openTheatre>) => import('./tales.js').then(m => m.openTheatre(...a));
// (v1.07 startup) Welcome is painted before the valley starts building: a breath of one frame (a timeout alone gave the
// browser no chance to draw, so Welcome showed only after the first building steps); at most 100 ms, as a hidden page
// gets no frames
await new Promise(r => { const t = setTimeout(r, 100); requestAnimationFrame(() => requestAnimationFrame(() => { clearTimeout(t); r(undefined); })); });
const roadMemo = recall('roads'); // (js/worldmemo.ts) read while the valley starts building
await preload(); // (the ground's kept heights, needed by the first step)
const world = createWorld(scene, quality); worldMade = true; bootMark('world'); await breathe();
// the map picture: read back from the device when this build painted it before (js/worldcache.js)
const waterPic = cachedCanvas('water', 256, paintWater, bootReady, paintWaterRows); waterPic.onReady = () => world.waterMap(waterPic.canvas); // (round T4a) each river's colour and the foam along the shores
const mapPic = cachedCanvas('map', 320, paintMap, bootReady, paintMapRows); // (round T: 320 px for the 480 m valley) bootMark('map');
mapPic.onReady = () => { G.fogMaps = {}; }; // (a map shown before the picture was ready is drawn again)
const titleCam = new THREE.PerspectiveCamera(50, 1, .3, 1200);

// (TypeScript, r86) the shared game object: every part main.ts, and the modules it hands G to, add to it. Parts made
// later in the start-up are optional; the modules that add their own part are typed by what main.ts uses of it.
/** a child in the valley (js/player.js), with what the other modules add to it */
type SvHeroT = Hero & { walkTo?: { x: number, z: number, friend?: string, name?: string } | null, _tiredHint?: boolean, _rescuing?: boolean, cancelCarry?: (() => void) | null, indoors?: unknown, view?: string, zoom?: number,
  carry?: unknown, carryIt?: unknown, followId?: string | null, goalAct?: SvItem | null, _dancing?: boolean, _followHop?: number };
type SvAt = (h: SvHeroT, x: number, z: number, face?: { x: number, z: number }) => Promise<void>;
/** a window that closes by itself when the children walk away from where it opened */
type SvWalkClose = HTMLElement & { _from?: { x: number, z: number }[], _autoClose?: (() => void) | null };
/** someone walking about who is not a child playing here: a wanderer at home, or a friend online */
type SvPerson = { av: { root: THREE.Object3D, anim?(st: string, t: number, sp: number): void }, tag: THREE.Object3D, pos: THREE.Vector3, yaw: number };
export type SvFriend = SvPerson & { id: string, name: string, st: string, look: Record<string, unknown>, photoURL: string, [k: string]: unknown };
/** a friend's game played online: who sits where, and which seat is mine (js/netgames.ts) */
type SvOnline = import('./games/frame.js').GameOnline;
/** something in the valley a child can walk up to and use (a person, a game, a door…) */
interface SvItem { id?: string, x: number, z: number, r?: number, icon?: string, bubble?: string, slot?: string, auto?: boolean,
  y?: number, label?: () => string, short?: () => string, visible?: (h?: SvHeroT) => boolean, act(h: SvHeroT, game?: SvGame): void | Promise<unknown>, npc?: unknown, st?: unknown, [k: string]: unknown }
type SvHome = { hs: { x: number, z: number }, name(): string, people: { name: string }[] };
export interface SvMain {
  actCount: number; crowdModels?: unknown; // (v1.08e crowds)
  events: typeof events; settings: typeof settings; world: typeof world; scene: typeof scene; pads: typeof pads;
  heroes: SvHeroT[]; huds: Hud[]; mode: string; partner: unknown; zoom: number; fogMaps: Record<string, HTMLCanvasElement>;
  regionOf: (string | null)[]; interactables: SvItem[]; gatherState: Record<string, unknown>; bubbles: { s: THREE.Sprite, target: { pos: THREE.Vector3 }, until?: number }[];
  paused?: boolean; lastPlayer?: number; untilValley?: () => Promise<void>; playTimes?: { at?: number, waited?: number }; firstFrames?: typeof firstFrames; whenPlaying?: Promise<void>; renderer?: typeof renderer; npcs?: typeof NPCS;
  halfBusy?: (i?: number) => boolean; quality?: typeof quality; gpu?: { name: string, soft: boolean }; battery?: { frameMs: number, titleMs: number, idleMs: number, idleFps: number, [k: string]: unknown };
  // places, people and things of the valley (each made by its own module)
  farm?: ReturnType<typeof createFarm>; ferries?: ReturnType<typeof createFerries>; festivals?: ReturnType<typeof createFestivals>;
  folkShow?: ReturnType<typeof createFolkShow>; hoilang?: ReturnType<typeof import('./hoilang.js').createHoiLang>; kidplay?: ReturnType<typeof createKidPlay>;
  kites?: ReturnType<typeof createKites>; lanterns?: ReturnType<typeof createLanterns>; lotus?: ReturnType<typeof createLotus>;
  nameTags?: ReturnType<typeof createNameTags>; netGames?: ReturnType<typeof createNetGames>; pets?: ReturnType<typeof createPets>;
  placeBook?: ReturnType<typeof createPlaceBook>; places?: ReturnType<typeof createPlaces>; plots?: ReturnType<typeof createPlots>;
  reeds?: ReturnType<typeof createReeds>; report?: ReturnType<typeof createReport>; secrets?: ReturnType<typeof createSecrets>;
  seeThrough?: ReturnType<typeof createSeeThrough>; shop?: ReturnType<typeof import('./shop.js').createShop>; signposts?: ReturnType<typeof createSignposts>;
  simple?: ReturnType<typeof createSimple>; town?: ReturnType<typeof createTown>; school?: ReturnType<typeof createSchool>; schoolReady?: Promise<unknown>; weather?: ReturnType<typeof createWeather>;
  friendQuests?: ReturnType<typeof import('./friendquest.js').createFriendQuests>; // (v1.08d polish)
  yard?: ReturnType<typeof createYard>; chests?: ReturnType<typeof createTwinChests>; claims?: ReturnType<typeof createClaims>;
  coop?: ReturnType<typeof createCoop>; familyCards?: ReturnType<typeof createFamilyCards>; parents?: ReturnType<typeof import('./parents.js').createParents>;
  boxes?: ReturnType<typeof import('./boxes.js').createBoxes>; surprises?: ReturnType<typeof import('./surprises.js').createSurprises>; myHouse?: ReturnType<typeof createMyHouse> | null;
  solidsReady?: ReturnType<typeof buildSolids>;
  roadMemo?: unknown; // the roads' heights kept from the last start of this build (js/worldmemo.ts, js/roads.js)
  // parts other modules add (js/homes.js, js/traffic.js, js/wayfind.js, js/autoplay.js, js/tester.js, js/fun.js, js/chatter.js, js/learn.js…)
  homes?: { list: SvHome[], enter(h: SvHeroT, home: SvHome): void, inside(): SvHome | null, isInside(h: SvHeroT): boolean, [k: string]: unknown }; traffic?: { apply(big: boolean): void, [k: string]: unknown };
  wayfind?: { open(i: number): void, stop(quiet?: boolean): void, [k: string]: unknown }; autoplay?: { running(): boolean, unmount(): void, [k: string]: unknown };
  tester?: { [k: string]: unknown }; tapReact?: (h: SvHeroT, ray: THREE.Raycaster) => boolean; chatGroup?: (...a: unknown[]) => unknown;
  showcaseCam?: (i: number, h: SvHeroT, dt: number) => boolean; TALES?: { id: string, title(): string, [k: string]: unknown }[];
  readTaleNow?: (h: SvHeroT, tale: { id: string }, sync?: unknown) => Promise<unknown>;
  GAME_SPOT?: Record<string, string>; hostNews?: (h: any) => void; learnQuest?: any; // (v1.08b games)
  hostLineOf?: (id: string) => [string, string] | null; s2vn?: any; // (v1.08d s2vn) Season 2, Vietnam (js/s2vn.ts)
   lookUpT?: number; tapTargets?: THREE.Object3D[]; travelling?: boolean;
  // values main.ts shares
  LANDMARKS?: typeof LANDMARKS; STICKERS?: typeof STICKERS; VIEWS?: typeof VIEWS; getViews?: (i: number) => typeof VIEWS; PLACES?: { id?: string, x: number, z: number, [k: string]: unknown }[];
  bootTimes?: Record<string, number>; mapPic?: typeof mapPic; waterPic?: typeof waterPic; parked?: unknown;
  areas?: { near: (x: number, z: number, r?: number) => Promise<void>, done: () => Promise<void>, left: () => number, late: () => number, list: () => { id: string, x: number, z: number, built: boolean, asleep: boolean, ms?: number }[], all: () => Promise<unknown> }; // (v1.08d valley, js/areas.ts)
  bubbleIcons?: THREE.Sprite[]; wanderers?: (SvPerson & { tx: number, tz: number, wave: number })[]; partners?: Record<string, SvFriend>;
  caroSize?: number; _again?: { game: string, from: string[], until: number, timer: ReturnType<typeof setTimeout> } | null; _padRemotes?: number; _familyMsgLive?: boolean; _owlAuto?: boolean; _previewed?: boolean; _reading?: boolean;
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
  travel?: SvAt; travelTo?: (h: SvHeroT, x: number, z: number, snapToNpc?: boolean) => Promise<void>; landBy?: SvAt; faceOwl?: (h: SvHeroT, near?: number) => void; setDown?: (...a: any[]) => unknown; // (v1.08b quality)
  clearSpot?: (x: number, z: number, pad?: number) => [number, number]; goodSpot?: (x: number, z: number) => boolean;
  npcAt?: (id: string) => { x: number, z: number } | undefined; npcNear?: (x: number, z: number, r?: number) => SvItem | null; gameSpot?: (id: string) => SvItem | undefined;
  goToGame?: (i: number, id: string) => void; playGameOnline?: (id: string, level: number, online: SvOnline) => Promise<ReturnType<typeof openGame> extends Promise<infer R> ? R | undefined : unknown>;
  openPad?: (i: number, tab?: string) => void; closePad?: () => void; closePadNow?: () => void; openGamesHub?: (i: number) => void; openQuick?: (i: number) => void;
  openWardrobe?: (i: number) => void; openWhere?: (i: number) => void; openTrade?: (i: number, id?: string) => void; openSongs?: (start?: unknown) => void;
  openSound?: (anchor?: Element) => Promise<unknown>; openPlayTogether?: () => void; mapCard?: () => void; avatarPreview?: (i: number) => void;
  rebuildHero?: (i: number) => void; changePlayer?: () => void; cycleView?: (i: number) => void; setView?: (i: number, id: string, quiet?: boolean) => void;
  zoomBy?: (i: number, f: number, quiet?: boolean) => void; snapshot?: (i: number, max?: number, q?: number) => string; screenFacts?: () => Record<string, unknown>;
  camBlockers?: () => THREE.Object3D[]; camBlockerMats?: () => unknown; farCull?: (now: number) => void; fogMapFor?: (p: { id: string }) => HTMLCanvasElement;
  setAudio?: (kind: string, on: boolean) => void; toggleAudio?: (kind: string) => void; toggleMute?: () => Promise<void>; voiceCommand?: (i: number) => void;
  sideStories?: () => unknown[]; walkAwayClose?: (node: SvWalkClose, close: () => void) => void; barsHTML?: (n: number) => string;
  // friends online
  together?: () => boolean; shareStatus?: () => void; listenFriends?: () => void; autoMeet?: () => void; onNet?: () => void; netTick?: (body: Element) => void;
  netQuality?: (id: string) => ReturnType<typeof Net.quality>; drawOnlinePanel?: (body: Element, redraw: () => void) => void;
  inviteFriend?: (code: string) => Promise<unknown>; joinFriend?: (room: string, hostPub?: string) => Promise<void>; inviteGame?: (game: string, to?: string, level?: number, size?: number, wait?: number) => unknown;
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
G.untilValley = untilValley; G.playTimes = playTimes;
G.firstFrames = firstFrames; // (the valley has been drawn a few times: js/solids.js)
// (the solid map's second look waits for play: on Welcome and Who's playing nothing in the valley moves yet, so animals and
// cars standing still there were counted or not by timing, and the saved map was missed: check solid)
let playStarted: () => void = () => {}; G.whenPlaying = new Promise<void>(r => { playStarted = r; });
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
  const tag = nameTag(name); tag.position.set(x, obj.position.y + (model ? 3.4 : 2.0 * ((A && A.height) || 1)), z); scene.add(tag); // (v1.08b: above a grown-up's head)
  const n = { id, name, x, z, obj, tag, avatar: av, A, talk, _vm: '' }; registerName(name, icon);
  NPCS.push(n);
  world.colliders.push({ x, z, r: .7 });
  G.interactables.push({ id: 'npc_' + id, x, z, r: 3, icon, label: () => T('Talk to ', 'Nói chuyện với ') + nm(name), act: h => talk(h) });
  return n;
}
const V = VILLAGE;
const kidLook = (style, color, h, hs, hat) => ({ style, color, hat, back: 'none', hair: h, hairStyle: hs, skin: '#f6c7a5', glider: 0 });
let owl, gourd;
/** the child faces Ông Cú and the camera stands behind the child (at spawn, near him) */
function faceOwl(h, near = 30) {
  if (!owl || !h || Math.hypot(owl.x - h.pos.x, owl.z - h.pos.z) > near) return false;
  h.yaw = Math.atan2(owl.x - h.pos.x, owl.z - h.pos.z); h.camYaw = h.yaw + Math.PI; h.manualCamT = 0;
  h.camPos.set(h.pos.x + Math.sin(h.camYaw) * h.camDist, h.pos.y + 4, h.pos.z + Math.cos(h.camYaw) * h.camDist);
  return true;
}
G.faceOwl = faceOwl;
function setupNPCs() {
  owl = addNPC({ id: 'owl', name: 'Ông Cú', model: buildOwl(), x: PLATEAU.x - 2, z: PLATEAU.z - 8, face: .3, icon: '🦉', talk: owlTalk });
  addNPC({ id: 'mai', name: 'Cô Mai', look: { style: 'aodai', color: '#e8435a', hat: 'nonla', back: 'none', hair: '#1d1412', hairStyle: 'long', skin: '#f6c7a5', glider: 0, age: 'adult' }, x: V.x + 2, z: V.z - 11.6, face: 0, icon: '🛒', talk: maiTalk });
  addNPC({ id: 'ba', name: 'Bác Ba', look: { style: 'overalls', color: '#5b7fbf', hat: 'none', back: 'none', hair: '#8a8a8a', hairStyle: 'short', skin: '#e0aa80', glider: 0, age: 'elder' }, x: V.x - 4.5, z: V.z + 13, face: .8, icon: '🍲', talk: baTalk });
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
  // (v1.08e villagers) the 11 named villagers' own models, loaded when a child comes within 40 m (a few at a time), worn
  // in place of the code person (js/avatar.ts wearVillagerModel); blocked or not yet arrived, the code person stays
  const NAMED_MODELS = new Set(['mai', 'ba', 'teo', 'ti', 'bong', 'su', 'jack', 'mit', 'bom', 'ruby', 'lan']); let vmT = 0;
  world.updaters.push(dt => {
    if ((vmT -= dt) > 0) return; vmT = .5;
    for (const n of NPCS) {
      if (!n.A || n._vm || !NAMED_MODELS.has(n.id) || !G.heroes.some(h => dist2(h.pos.x, h.pos.z, n.obj.position.x, n.obj.position.z) < 1600)) continue;
      n._vm = 'loading'; const key = 'villager-' + n.id;
      loadFriendModels(key).then(ok => { n._vm = ok && wearVillagerModel(n.A, key) ? 'worn' : 'code'; });
    }
  });
  // gentle idle animation
  // the children who host folk games are busy playing: they cheer, wave and clap now and then
  const PLAYERS = new Set(['teo', 'ti', 'bong', 'su', 'jack', 'mit', 'bom', 'ruby', 'lan']);
  world.updaters.push((dt, t) => NPCS.forEach((n, k) => {
    if (n.A && PLAYERS.has(n.id)) { const ph = Math.floor(t * .7 + k * 1.3) % 4; n.A.anim(ph === 0 ? 'cheer' : ph === 2 ? 'wave' : 'idle', t + k, 0); }
    else if (n.A && n._vm === 'worn') n.A.anim('idle', t + k, 0); // (v1.08e villagers) a villager's model blinks, looks and breathes
    else if (n.avatar) { n.avatar.children[0].position.y = Math.sin(t * 2 + k) * .03; }
    else n.obj.rotation.z = Math.sin(t * 1.5 + k) * .05;
  }));
  // and they talk to each other about their games
  const grp = ids => ids.map(id => (NPCS.find(n => n.id === id) || {}).obj).filter(Boolean);
  G.chatGroup(grp(['jack', 'mit', 'bom', 'lan']), CHAT_LINES.playground, { height: 2.7 });
  G.chatGroup(grp(['teo', 'su', 'bong', 'ti']), CHAT_LINES.village, { height: 2.7, face: false });
}

// ---------- interactables ----------
const { setupAreaSigns, nearest, setupGuides, setupBubbles, setupInteractables } = installInteractables(G, { world, scene, questTarget: h => questTarget(h), isPlaying: () => playing, hudFor: h => hudFor(h), statueTalk: h => statueTalk(h), playGame, give, foundLeafy });

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
G.quality = quality; G.gpu = GPU; // (feel and sound) js/fun.js leaves out the running dust on 'low'
G.fx = (x, y, z, ch) => { const s = sprite(ch, 1.4); s.material = s.material.clone(); s.position.set(x, y, z); scene.add(s); const t0 = performance.now(); const f = () => { const k = (performance.now() - t0) / 900; s.position.y = y + k * 2; s.material.opacity = 1 - k; if (k < 1) requestAnimationFrame(f); else { scene.remove(s); s.material.dispose(); } }; f(); };
G.mount = (h, b) => { h.mount(b); h.profile.quests.buffalo = true; save(); say('Moo! Hold on tight!', 'Ụm bò! Bám chắc nhé!'); hudFor(h).toast(T('Press Jump to get off', 'Bấm Nhảy để xuống')); };

const fruitParadeModeOn = fruitParadeAvailable;
useAreas(id => SUBJECT_AREAS[id]?.[0]);   // (v1.08b quality) the subjects of the learning report and the level by subject

async function playGame(i: number, id: string, source: string, shrine?: (typeof SHRINES)[number]) {
  const h = G.heroes[i]; if (!h || !canStartGame(id,[h.profile])) return;
  if (id === 'sparklefruitbar' && !testerArcadeAvailable('sparklefruitbar',source === 'online'?'multi':'single')) return;
  if (id === 'sparkleorchard' && !testerArcadeAvailable('sparkleorchard',source === 'online'?'multi':'single')) return;
  if (id === 'fruitparade' && !fruitParadeModeOn('single')) { hudFor(h).toast(T('Sparkle Fruit Parade is not available yet.', 'Diễu hành trái cây lấp lánh chưa mở.')); return; }
  if (gameOpen()) { if (twoHalves()) hudFor(h).toast(T('Your friend is playing a game. Play it together, or wait a moment!', 'Bạn con đang chơi một trò. Chơi cùng bạn, hoặc chờ một chút nhé!')); return; }
  G.paused = true; hush();
  // friends in the room: play it together? (round H: every game can be played together)
  if (G.together() && source !== 'online' && !shrine) { G.paused = false; const k = await dialog(T('Play together?', 'Chơi cùng nhau?'), [['Your friends are here. Play this game together?', 'Các bạn đang ở đây. Chơi trò này cùng nhau nhé?']], [['👫 Together', '👫 Cùng nhau'], ['🙂 Just me', '🙂 Mình con']]); if (k === 0) { G.inviteGame(id); return; } G.paused = true; }
  if(!canStartGame(id,[h.profile])) { G.paused=false; return; }
  countPlay('game', id); // anonymous: how often each game is played (js/players.js)
  if (MONEY_GAMES.includes(id)) G.tried(h, 'money_' + id); else if (/^rd_/.test(id)) G.tried(h, 'readingTrial');   // (batch rollout) a money game played stays this child's
  const players = G.heroes.map(x => x.profile); if (G.heroes.length > 1 && i === 1) players.reverse();
  // Level = how far this child has got in this game, shifted by the chosen difficulty.
  // the level the child chose inside this game (round M), else the grown-ups' difficulty for this child
  // (owner, 1 Nov 2026 AEDT: "the levels often look the same") each level has its own band and wins move a child up inside it:
  // Easy 1-2, Medium 2-3, Hard 4-5, Talent 5 with the game's own extra challenge. (Before, Easy reached the top after a few wins.)
  // (v1.08b quality) with no level chosen in the game, the level follows the child per subject; a grown-up's subject level wins
  const p = h.profile, diff = (p.gameDiff && p.gameDiff[id]) || subjectDifficulty(p, id), band = ({ easy: [1, 2], medium: [2, 3], hard: [4, 5], talent: [5, 5] })[diff] || [1, 2];
  const level = Math.min(band[1], band[0] + Math.floor(((p.levels[id] || 1) - 1) / 2));
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
const { GAME_SPOT, baTalk, maiTalk, kidTalk, owlTalk } = installTalks(G, { playGame, twoHalves, save, checkQuests: h => checkQuests(h), hudFor, goAndDo: (h, it) => goAndDo(h, it), currentQuest: p => currentQuest(p), addMoney, NPCS }); // (the quests are made just below: js/main/quests.ts)
afterStart(() => import('./learnquest.js'), m => m.installLearnQuest(G)); // (v1.08b games) the learning journeys (v1.08d valley: after the start)

// ---------- objective helpers ----------
const { statueTalk, questTarget, currentQuest, gourdTalk, checkQuests } = installQuests(G, { world, save, V, NPCS, theOwl: () => owl, addMoney, isPlaying: () => playing, hudFor, goAndDo: (h, it) => goAndDo(h, it), giveSticker });

// ---------- hero events ----------
const { setupWanderers } = installHeroEvents(G, { renderer, scene, world, save, hudFor, mapPic, checkQuests, waterPic, twoHalves, startSession, sendHello: () => sendHello(), setPlaying: (v: boolean) => { playing = v; }, nameTag });

// ---------- talking: quick phrases, speech bubbles, voice calls ----------
const { helloPhoto, sendHello, bubble } = installTalking(G, { scene, isPlaying: () => playing, nameTag, friendRide: (P, s) => friendRide(P, s) });

// ---------- games with friends online (js/netgames.js, round G) ----------
const { friendRide, _np } = installOnlineGames(G, { scene, hudFor, bubble, save, fruitParadeModeOn, gameInfoAge });

// ---------- friends: codes, invites, the online panel ----------
installFriends(G, { sendHello, isPlaying: () => playing });

// ---------- layout ----------
const { goAndDo, ray, faceToFace, vh, rects, aimCam, resize, poll, VIEWS } = installLayout(G, { twoHalves, renderer, titleCam, world, startAct });

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
rememberRecoverySpot = keepSpot;
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
// Retain used access during future scheduling, but an explicit owner Off wins
// (the owner-approved explicit-off policy). G.tried remembers usage without removing saved progress (js/custom.ts).
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
    // (v1.08b quality, owner 5 Nov 2026 AEDT: "when the user spawn in, the owl blocks it, better to move the camera angle
    // to look at the owl instead") near Ông Cú the child faces him and the camera stands behind the child, so the owl
    // is in front of them both, never between the camera and the child
    faceOwl(h);
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
  resize(); G.paused = false; playing = true; playStarted(); G.listenFriends();
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
  else if (!G.simple.open) G.simple.start(); // the Simple screen for a child who wants it (js/simple.js); already up when it opened first
  if (!sessionStarted) { sessionStarted = true; sessionUp(); }
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
  // (#744, v1.06) what I ride travels too, so friends see me on the bicycle, car or buffalo and see it move
  const rd = h0.riding as (NonNullable<SvHeroT['riding']> & { id?: string, slot?: { id?: string } }) | null, slots = (G.traffic?.slots || []) as unknown[];
  // (owner, 1 Nov 2026 AEDT) riding as a passenger (bus, tram, taxi, xích lô) travels too, with pa: friends see the vehicle
  const pas = !rd ? (slots as Array<{ id?: string, passenger?: unknown }>).findIndex(sl => sl && sl.passenger === h0) : -1;
  const ride = !rd ? (pas >= 0 ? { rv: 'v' + pas, rm: (slots[pas] as { id?: string }).id, pa: 1 } : {}) : rd.slot && slots.includes(rd.slot) ? { rv: 'v' + slots.indexOf(rd.slot), rm: rd.slot.id } : rd.id ? { rv: rd.id } : {};
  Net.send({ t: 's', x: +h0.pos.x.toFixed(2), y: +h0.pos.y.toFixed(2), z: +h0.pos.z.toFixed(2), yaw: +h0.yaw.toFixed(2), st: idle && !rd ? 'idle' : h0.state, sp: idle ? 0 : +h0.speed.toFixed(1), ...ride });
}, 100);
// Sharp on phones that can manage it: with Graphics on Auto, the 3D picture is drawn at up to 2× the screen's
// pixels and steps down a little whenever the game starts to stutter (phones started blurry at 1.25×).
// (#341) without a graphics chip every pixel is drawn by the main processor: it may go down to half the screen's pixels
const adapt = { pr: renderer.getPixelRatio(), max: Math.min(window.devicePixelRatio || 1, PR_AUTO), min: GPU.soft ? .5 : 1, sum: 0, n: 0, t0: performance.now() };
function adaptResolution(rawMs) {
  // (#341) a frame over 250 ms counts as 250 ms: very slow frames (3 a second) were left out, so the picture never got
  // lighter on the computers that needed it most; a gap over 2 s is the game coming back from a pause, not slowness
  if (settings.quality !== 'auto' || document.hidden || rawMs > 2000) return;
  adapt.sum += Math.min(rawMs, 250); adapt.n++;
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
let frameRequest = 0;
function frame(now) {
  frameRequest = requestAnimationFrame(frame);
  if (framesSeen < 4 && ++framesSeen === 4) framesDone(); // (js/solids.js waits for these)
  if (!BAT.gate(BAT, now, BAT.capMs())) return; // (battery round)
  if (playing && !BAT.idle) adaptResolution(now - last - (FRAME_MS ? FRAME_MS - 1000 / 60 : 0)); // (the wait between frames is not slowness)
  // (battery round) while idle the frames are far apart: the world keeps its pace (nothing is moving that could jump)
  const dt = Math.min(BAT.idle ? .15 : .05, (now - last) / 1000); last = now; t += dt;
  const work0 = performance.now();
  // the 3D world rests while a full-screen game, the storybook or a page that covers it is open (saves battery)
  // (two players: the world rests only when both halves have a window open)
  // (#746, v1.07) and in a tab another tab of the game took over: it went on drawing the valley under its notice, so the
  // computer drew two games at once and both slowed (16 frames a second)
  if (heldByOtherTab()) { BAT.lastDrawn = 0; return; }
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
      if (G.hostNews) G.hostNews(h); // (v1.08b games) a host says once when a game at their place has just opened
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
    const rv = friendRide(P, s);
    P.av.root.position.copy(P.pos); P.av.root.rotation.y = P.yaw; P.av.anim(s.st || 'idle', t, s.sp || 0); P.tag.position.set(P.pos.x, P.pos.y + 2.0, P.pos.z);
    if (rv && rv.v && s.pa) { // a passenger: the vehicle is placed so its passenger seat is where the friend sits (P.pos)
      const v = rv.v as RideCar & { passenger?: number[], seat: number[] }, seat = v.passenger || (/^(bus|tram)/.test(s.rm || '') ? [-.45, v.seat[1], 0] : [-(v.seat[0] || .45), v.seat[1], v.seat[2] - (s.rm === 'touristCart' ? .9 : 0)]), c = Math.cos(P.yaw), sn = Math.sin(P.yaw);
      v.o.rotation.y = P.yaw; v.o.position.set(P.pos.x - (seat[0] * c + seat[2] * sn), P.pos.y - (seat[1] - .55), P.pos.z - (-seat[0] * sn + seat[2] * c)); }
    else if (rv && rv.v) { const v = rv.v, A = P.av as unknown as Parameters<typeof seatRider>[0]; v.o.position.copy(P.pos); v.o.rotation.y = P.yaw; v.wheels.forEach(w => { w.rotation.x += (s.sp || 0) * dt / v.wr; }); A.rig.position.y = 0; seatRider(A, v, v.seat, v.grips, v.feet, A.root.scale.x, false); }
    else if (rv && rv.animal) { const b = rv.animal; b.mesh.position.copy(P.pos); b.mesh.rotation.y = P.yaw; b.shadow.position.set(P.pos.x, P.pos.y + .05, P.pos.z); P.av.root.position.y += 1.6; P.tag.position.y += 1.6; }
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
// (v1.07 startup, PERF-001) parts of the valley a child does not need before the first tap are loaded during the build,
// not in the start-up download: those of the next steps now, side by side (the rest after the traffic, below); each one
// is made at its old place in the build order (nothing else changes). One that cannot be loaded stops the start where it
// is made, as a missing start-up file did (js/launch.ts shows Try again).
const soon = { asia: import('./asia.js'), hawkers: import('./hawkers.js'), suburbs: import('./suburbs.js'), traffic: import('./traffic.js') };
for (const p of Object.values(soon)) p.catch(() => { });
G.places = createPlaces(G); world.updaters.push(G.places.update);
world.heroesNear = (x, z, r) => G.heroes.some(h => dist2(h.pos.x, h.pos.z, x, z) < r);   // (Round V) a ridden animal goes home out of every child's sight
G.town = createTown(G);
// (Học vui phase 4) Trường Học Vui at the west end of Two Homes Street, Cô Tam at its door (js/school.js); loaded after the
// title screen, so it is not in the start-up download (PERF-001); G.schoolReady says when it stands
G.schoolReady = import('./school.js').then(m => { G.school = m.createSchool(G); if (G.school) Object.assign(G.PLACES.find(p => p.key === 'school'), G.school.place); return G.school; });
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
(await soon.asia).createAsia(G);
bootMark('town'); G.roadMemo = await roadMemo; createRoads(G); bootMark('roads'); await breathe();
createCities(G);
(await soon.hawkers).createHawkers(G);
(await soon.suburbs).createSuburbs(G); // speciality buildings along the roads out of each city (before the homes are made)
world.familyBuilt = addFamilyBuildings(G); // houses and buildings the family added in Sparkle Studio (they become homes too)
buildPowerLines(G); // power poles (when switched on in Studio) wired to each other by themselves
bootMark('pretraffic'); (await soon.traffic).createTraffic(G); bootMark('traffic'); await breathe(); // motorbikes, cars, buses, trams, xích lô and bicycles (js/traffic.js; Studio switches)
// (v1.07 startup, PERF-001) the parts made from here on, loaded side by side while the first ones are made
const laterAll = import('./main/later.js');
const later = Object.fromEntries((['heritage', 'symbols', 'regionSites', 'vnFun', 'myHouse', 'lotus', 'pets', 'ferry', 'passport', 'festivals', 'weather', 'fun',
  'learn', 'showcase', 'trade', 'folkShow', 'signposts', 'secrets'] as const).map(k => [k, laterAll.then(m => m[k])])) as { [K in keyof typeof import('./main/later.js')]: Promise<typeof import('./main/later.js')[K]> };
for (const p of Object.values(later)) p.catch(() => { });
(await later.heritage).createHeritage(G, { give, sfx: SFX, say, toast: (h, m) => hudFor(h).toast(m) });
await breathe(); // (v1.07: a breath for the Simple screen's taps)
{ const S = await later.symbols; regionLabel = S.regionLabel; // each region's symbol animal, in a corner of its city square
  // (v1.08d valley) each one is its own part, built after the start when the child is near its city (js/areas.ts)
  const at = (id: string): [number, number] => { const c = CITIES.find(k => k.id === id); return c ? [c.x, c.z] : id === 'china' ? [CHINA.x, CHINA.z] : id === 'india' ? [INDIA.x, INDIA.z] : [(AUSSIE.x0 + AUSSIE.x1) / 2, AUSSIE.roadZ]; };
  for (const where of S.SYMBOL_PLACES()) addArea('symbol:' + where, at(where), () => S.createSymbols(G, { sfx: SFX, dialog, only: where })); }
(await later.regionSites).createRegionSites(G); // more famous places of each region, just outside its city
(await later.vnFun).createVnFun(G, { sfx: SFX, say, dialog, toast: (h, m) => hudFor(h).toast(m) }); // children playing north and south; buffalo and bull festivals (v1.08d valley: kept here, its children host games on the folk games boards, js/folkshow.ts)
await breathe(); // (v1.07: a breath for the Simple screen's taps)
G.placeBook = createPlaceBook(G, { toast: (h, m) => hudFor(h).toast(m), save }); // the places sticker book listens to the event bus (js/placebook.js)
G.familyCards = createFamilyCards(G, { toast: (h, m) => hudFor(h).toast(m), save }); // family photos from Studio arrive as postcards (js/familycards.js)
attachStickers(G); // the sticker book knows who is playing (js/stickers.js)
// (v1.08b story) the install gift's code loads only on a game running installed (PERF-001)
import('./install.js').then(I => { const go = () => { if (I.isStandalone() && !(G as any).installGift) import('./installgift.js').then(m => m.mountInstallGift(G)).catch(e => console.warn('install gift', e)); }; go(); matchMedia('(display-mode: standalone)').addEventListener?.('change', go); }).catch(() => { });
{ const M = await later.myHouse; G.myHouse = G.homes ? M.createMyHouse(G) : null; } // decorate your own house at Sunny Farm (js/myhouse.js)
G.report = createReport(G, { save }); // the play report for grown-ups counts games and minutes (js/report.js)
G.coop = createCoop(G, { Net, toast: (h, m) => hudFor(h).toast(m) }); // together quests in an online room (js/coop.js)
G.chests = createTwinChests(G, { toast: (h, m) => hudFor(h).toast(m), save }); // treasure chests that open for two friends (js/twinchests.js)
G.lotus = (await later.lotus).createLotus(G, { say, toast: (h, m) => hudFor(h).toast(m) }); // Lotus Village: well, shrine, pond bench and boat, hens, a dog, a bicycle and a buffalo cart (Phase 2)
G.reward = reward;
G.pets = (await later.pets).createPets(G);
G.ferries = (await later.ferry).createFerries(G);
G.kites = createKites(G);
(await later.passport).createPassport(G);
if(liveBoot)configureFestivalStartup(liveBoot.then(live=>live?projectPublicFestivals(FESTCAL.map(f=>f.id),live,CUSTOM):null));
G.festivals = (await later.festivals).createFestivals(G);
await breathe(); // (v1.07: a breath for the Simple screen's taps)
// (owner, 12 Oct) the auto play check for grown-ups testing the game: only on the devices Studio's Releases page allows
// (switch `autoplay`: every device, or the ticked ones); everywhere else nothing of it is even downloaded
{ const apGate = async () => { const A = await import('./content/autoplay.js'); let me = ''; try { me = localStorage.getItem('sv2_playerid') || ''; } catch (e) { }
    if (A.apAllowed(releaseOn('autoplay', false) && liveRule('tester')?.policies?.[me]?.autoplay !== false, liveRule('autoplay'), me)) (await import('./autoplay.js')).mountAutoplay(G); else if (G.autoplay) G.autoplay.unmount(); };
  apGate(); onLive(apGate); }
// (owner, 12 Oct) tester devices report problems by themselves and with the ladybird (js/testergate.js, js/tester.js)
import('./testergate.js').then(m => m.testerGate(G));
// (v1.08 notifications) grown-ups' push notifications: this week's lines on the device, and a tap that opened the game (js/notify.js)
if (((settings as unknown as { push?: { on?: boolean } }).push || {}).on || /[?&]open=/.test(location.search)) import('./notify.js').then(m => m.startNotify(G)).catch(() => { });
G.weather = (await later.weather).createWeather(G);
(await later.fun).createFun(G);
(await later.learn).createLearning(G);
await breathe(); // (v1.07: a breath for the Simple screen's taps)
// the main story, Đèn Lồng Thung Lũng (js/lanterns.js, chapters in js/content/chapters.js): after the storyteller and the villagers
G.npcAt = id => (n => n && { x: n.x, z: n.z })(NPCS.find(n => n.id === id));
// (loaded while the valley is built behind the title screen, so the title comes up sooner: PERF-001)
const [{ createLanterns }, { createYard }, { createKidPlay }] = await Promise.all([import('./lanterns.js'), import('./yard.js'), import('./kidplay.js')]);
G.lanterns = createLanterns(G, { dialog, say, reward, save, openTheatre });
// bà Huệ and ông Nghi's yard near the Huệ Nghi shop (js/yard.js): a side story
G.yard = createYard(G, { dialog, say, reward, save });
// (v1.08d polish) each friend's quest of three steps, for the item in the friend's hand (js/friendquest.ts): loaded after the start
import('./friendquest.js').then(m => { G.friendQuests = m.createFriendQuests(G, { dialog, say, reward, save }); }).catch(e => console.warn('friend quests', e && e.message));
// the companion grows, a coin goal, a gift every day (js/kidplay.js; Studio group 'For little ones')
G.kidplay = createKidPlay(G, { say, save });
await breathe(); // (v1.07: a breath for the Simple screen's taps)
(await later.showcase).createShowcase(G);
world.updaters.push((dt, t) => tickAnimals(dt, t, G.heroes)); // every animal walks, hops, wags and looks around
createGathering(G, { give, sfx: SFX, say, toast: (h, m) => hudFor(h).toast(m) });
const { setupTrading, openTrade } = await later.trade;
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
G.folkShow = (await later.folkShow).createFolkShow(G, { looks: [kidLook('shirt', '#ff7eb8', '#1d1412', 'buns', 'none'), kidLook('overalls', '#3cc7e8', '#3b2618', 'short', 'cap'), kidLook('dress', '#ffb52e', '#1d1412', 'ponytail', 'flower')] });
// (round S, owner plan 8 Oct) Hội làng three times a day, surprises, and the grown-ups' features: each in its own file,
// loaded while the valley is built (js/hoilang.js after the games boards it uses; Studio switches in the 'kids' group)
{ const { createHoiLang } = await import('./hoilang.js'); G.hoilang = createHoiLang(G, { say, save, reward }); }
// (Play reading trial, owner 11 Oct AEDT) the ten reading games load only while Studio's readingTrial switch is on (now, or when it is switched on);
// on unless Studio switches it off (owner, 12 Oct AEDT)
// (batch rollout: also for a child who already played a reading game, checked again when a session starts)
{ const rd = () => { if (keptOn('readingTrial')) import('./games/readingmenu.js').catch(() => { }); }; afterStart(async () => null, rd); G.readingCheck = rd; /* (v1.08d valley: after the start) */ import('./custom.js').then(C => C.onLive(rd)); }
// level land under every building, stall and landmark placed above (and anything added in future rounds)
world.familyEdits = applyWorldEdits(G); // buildings the family moved or removed in Sparkle Studio
bootMark('things'); widenFlatLand(world, scene); bootMark('wideland'); await breathe(); // more level land round every village and city, for new buildings (nothing moves on the map)
createAds(G); // the family's own signboards (only when Sparkle Studio switched ads on)
world.levelled = levelUnderBuildings(world, scene); bootMark('levelled'); await breathe();
G.plots = createPlots(G); // (round T3) the Memory Villages' garden plots and the spare ones by each city, on their levelled ground
{ const S = await later.signposts; addArea('signposts', [PLATEAU.x, PLATEAU.z + 40], () => { G.signposts = S.createSignposts(G); }); } // (round T4b, js/signposts.js) a picture signpost at every road junction (v1.08d valley: after the start, one part for the whole valley: one shared picture)
bootMark('roadside');
// (v1.08d valley) the solid map is made again a moment after parts of the valley built later (js/areas.ts) stand
const solidsNow = () => { G.solidsReady = buildSolids(G); void G.solidsReady.then(afterSolids); return G.solidsReady; };
// Later buildings can cover an authored collectible. Keep its stable pickup ID and
// cooldown, but move the picture and interaction together onto nearby open ground.
const afterSolids = () => {
  for (const b of world.rideAnimals || world.buffalo || []) {
    if (b.rider) continue;
    const [x, z] = G.clearSpot(b.mesh.position.x, b.mesh.position.z, 1.1);
    b.mesh.position.set(x, heightAt(x, z), z); b.home = [x, z]; b.tx = x; b.tz = z;
  }
  for (const it of G.interactables) {
    if (!/^g\d+$/.test(it.id) || !it.st) continue;
    const state = it.st as { s: THREE.Sprite; baseY: number };
    const original = { x: it.x, z: it.z, y: world.groundAt(it.x, it.z) }, probe = { ...original };
    world.collide(probe, .45);
    if (Math.hypot(probe.x - original.x, probe.z - original.z) < .05) continue;
    const [x, z] = G.clearSpot(it.x, it.z, .6);
    it.x = x; it.z = z; state.baseY = Math.max(heightAt(x, z), WATER) + .7;
    state.s.position.set(x, state.baseY, z);
  }
}; solidsNow(); bootMark('solids'); // (no breath here: the solid map is read once everything below is placed too) // nobody walks through houses and things (js/solids.js)
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
G.secrets = (await later.secrets).createSecrets(G);
ensureJobs();
G.claims.wrap(); // (after every pickup exists: first come, first served online)
for (const [id, P0] of [['town', TOWN], ['aussie', AUSSIE]] as const) addArea('crossing:' + id, [P0.x - 4, P0.roadZ], () => createCrossings(G, [id])); // Road warnings beside the existing crossings, after all doors/stalls are known (v1.08d valley: each street's after the start, js/areas.ts)
setupBubbles(); setupAreaSigns(); setupGuides();
$('#songBtn').onclick = () => G.places.nextSong();
resize();
// (round R, faster launch) the first picture prepares every material's shader at once (a few seconds on a phone): the
// title is already painted by then, and the valley is drawn behind it a frame later
{ let started = false;
  const start = () => {
    if (!started) { started = true; bootMark('shaders'); }
    cancelAnimationFrame(frameRequest); last = performance.now(); BAT.due = 0; BAT.lastDrawn = 0;
    resize(); frameRequest = requestAnimationFrame(frame);
  };
  resumeDrawing = start;
  requestAnimationFrame(() => setTimeout(start, 30));
}
// (Round U, owner: rows and pages scroll by finger and mouse everywhere: js/scrollhelp.js; loaded after the title)
// (v1.08d valley, PERF-001: the first download holds only what the child needs to start moving) the parts below are made
// after the start, one at a time when the page has a quiet moment (afterStart, above)
afterStart(() => import('./scrollhelp.js'), m => m.installScrollHelp());
afterStart(() => warmLumi(), () => { }); // (v1.08d valley) Lumi's welcome, ready before the Simple screen first asks for it (js/simple.ts)
// (Round U) every villager answers a tap with a fact or a saying of their region (js/villagertalk.js)
afterStart(() => Promise.all([import('./villagertalk.js'), import('./dayplan.js')]), ([V, D]) => { V.createVillagerTalk(G); D.createDayPlan(G); });   // (Round U) villagers' day plan
// (v1.08e crowds, owner 6 Nov 2026 AEDT) crowd people near a child wear the gallery neighbours' Blender models (js/crowd-models.js)
afterStart(() => import('./crowd-models.js'), C => { G.crowdModels = C.createCrowdModels(G); });
afterStart(() => import('./pricetags.js'), m => m.createPriceTags(G));
afterStart(() => import('./jobs.js'), m => m.createJobs(G));
afterStart(() => import('./wayfind.js'), m => m.createWayfind(G));   // (Round U) "Where is…?" sparkles
setTimeout(() => { void import('./s2au.js').then(m => m.createS2au(G)).catch(e => console.warn('s2au', e)); }, 2000);   // (v1.08d s2au) Season 2, Australia: after the start
G.openWhere = i => featureOn('wayfind', false) && G.wayfind && G.wayfind.open(i);
onLive(() => { if (!featureOn('wayfind',false)) { G.wayfind?.stop(true); document.querySelectorAll<HTMLElement>('.wherepick').forEach(m => m.querySelector<HTMLElement>('.x')?.click()); } });
afterStart(() => import('./animalhomes.js'), m => m.createAnimalHomes(G));   // (Round U) animals with homes   // (Round U) a job board in every place   // (Round U) a coin-picture price over every food stall
// (Round U) a tap on a coin, orb or Leafy chip (top bar, Backpack) says what it is (js/chipinfo.js, loaded on the first tap)
document.addEventListener('click', e => { const c = e.target instanceof Element && e.target.closest<HTMLElement>('[data-chip]'); if (c) import('./chipinfo.js').then(m => m.showChip(c.dataset.chip, c)); });
import('./state.js').then(S => { if (S.restoredFromCopy) setTimeout(() => toast(T('Your progress was brought back from the safe copy on this device.', 'Tiến trình chơi đã được khôi phục từ bản lưu dự phòng trên máy.')), 1200); });
document.addEventListener('visibilitychange', () => { if (document.hidden) { if (playing) keepSpot(); save(); hush(); } });
addEventListener('pagehide', () => { if (playing) keepSpot(); saveProfiles(true); });
bootMark('ready'); G.bootTimes = bootTimes; bootDone(); managementBootReady();
// (v1.08d valley, js/areas.ts) the parts of the valley built after the start: nearest the child first (before a child is
// chosen: the spot the last child played at, or home); after each one its pickups join first come first served, its
// activities get their bubbles, and a moment later the solid map is made again with it
{ let again = null; const p0 = (profiles[0] && profiles[0].pos) || { x: PLATEAU.x - 3, z: PLATEAU.z - 4 };
  // (v1.08d valley) villagers far from every child are stand-ins until a child comes within 60 m (js/avatar.ts lateAvatar):
  // three of them at most four times a second while walking, all of them round a flight's landing spot at once
  G.areas = { near: async (x, z, r) => { wakeLateAvatars([{ x, z }], 60, 1e9); await areasNear(x, z, r); }, done: areasDone, left: areasLeft, late: lateLeft, list: areaList,
    all: async () => { for (const a of areaList()) if (!a.built) await areasNear(a.x, a.z, 1); buildAllLate(); } };
  { let acc = 0; world.updaters.push(dt => { acc += dt; if (acc < .25) return; acc = 0; if (G.heroes.length) wakeLateAvatars(G.heroes.map(h => h.pos), 60, 3); }); }
  // (v1.08e) the Blender models of the world (js/modelkit.ts): swapped in for the code shapes when a child comes near
  afterStart(() => import('./modelkit.js'), m => m.startWorldModels(G, world.updaters));
  afterStart(() => import('./creatures.js'), m => m.startCreatureModels());   // (v1.08e creatures) animals, pets and companions in Blender
  startAreas(G, { x: +p0.x || 0, z: +p0.z || 0 }, () => { G.claims.wrap(); setupBubbles(); clearTimeout(again); again = setTimeout(solidsNow, areasLeft() ? 2500 : 600); }); }
setTimeout(() => { void import('./art.js').then(a => a.moreArt()); }, 1500); // (v1.08) the new games' pictures, after the start
setTimeout(() => { void import('./s2vn.js').then(m => m.installS2vn(G)).catch(e => console.warn('season 2', e)); }, 2500); // (v1.08d s2vn) Season 2's new places, after the start
// (v1.08b platform, brief part 4: a lighter first download) the surprises and the grown-ups' features (family missions,
// the family message, the week note) have no place on the map: they are made 2 s after the child can start, not while
// the valley is built (everything that uses them asks whether they are there yet)
setTimeout(() => { void Promise.all([import('./surprises.js'), import('./parents.js')]).then(([{ createSurprises }, { createParents }]) => {
  G.surprises = createSurprises(G, { say, reward }); G.parents = createParents(G, { say, save, reward }); }).catch(e => console.warn('later parts', e)); }, 2000);
// (owner, 30 Oct 2026 AEDT: "load where the child is first, then the rest while in game") what only decorates the valley
// and nobody bumps into (reeds, flowers along the roads, the floating place names) is made just after the child can
// start, a step at a time between frames, on the ground's final shape
void (async () => { await breathe(); G.reeds = createReeds(G); await breathe(); world.roadside = plantRoadside(G); await breathe(); G.nameTags = createNameTags(G); bootTimes.decor = Math.round(performance.now() - BOOT0); })();
// (owner, 16 Oct AEDT) no device contacts the family service unless Studio switches the trial on, or on a tester device
{ const refresh = () => (featureOn('familyDevices', false) || G.tester) ? import('./familydevices.js').then(m => m.refreshDevicePhotos()).catch(() => {}) : null; refresh(); addEventListener('online', refresh); setInterval(refresh, 60000); }
