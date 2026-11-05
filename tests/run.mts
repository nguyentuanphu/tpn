// Sparkle Valley regression checks. Start the game first (python3 -m http.server 8765 in the repo), then:
//   cd tests && npm install && node run.mts            all checks
//   node run.mts games features                        only some
//   node run.mts --update-contract                     re-record the UI structure (only when the owner asked for a UI change)
// Multiplayer runs when a local PeerJS server is up on 127.0.0.1:9000 (see the README in this folder).
//
// The checks live in groups under tests/checks/ (games, valley, voice, online, studio...; the list is in
// tests/checks/index.mts) and share tests/checks/shared.mts (the browser `b`, `check`, `ok`, `open`, `clear`...).
// A NEW CHECK: add it as its own `await check('name', async () => { ... });` block at the end of this file, just above
// "await b.close()", and add any shared name it uses to the import line below. Release moves it into the right group
// file when it merges (tests/checks/README.md says how). Every check name is unique across all the files.
import { b, check, results, sampled, SEED } from './checks/shared.mts';
import { GROUPS } from './checks/index.mts';
// one group after another, in this order (each file's checks in their own order)
for (const g of GROUPS) await import(`./checks/${g}.mts`);

// ---- checks not yet in a group (newest last) ----
await check('terrainmath', async () => (await import('./terrain-math.mts')).terrainMathCheck());
await check('renderaudit', async () => (await import('./render-audit.mts')).renderAudit(b));
await check('r87ui', async () => (await import('./r87-ui.mts')).r87UiCheck(b));
// (v1.07 family-code) make a family code on a phone, join it on a tablet, restore a wiped computer from the tablet's
// Save a copy and leave again, with made-up families only (tests/family-code-journey.mts)
await check('familycodejourney', async () => (await import('./family-code-journey.mts')).familyCodeJourneyCheck(b));
// (v1.07 levels) every game at Easy, Medium, Hard and Talent, and as an under-5: the levels differ (tests/levels-all.mts)
await check('levelsall', async () => (await import('./levels-all.mts')).levelsAllCheck(b));
// (v1.07, #746-#778) auto play stops, sends nothing and the valley stops drawing when another tab of the game takes over
await check('autoplayheld', async () => (await import('./autoplay-held.mts')).autoplayHeldCheck(b));
// (v1.07 old-bugs) #341 software graphics on Auto; #739 freeze reports on a browser without a long-task observer
await check('softgraphics', async () => (await import('./old-bugs.mts')).softGraphicsCheck(b));
await check('freezewhy', async () => (await import('./old-bugs.mts')).freezeWhyCheck(b));
await check('longplaymem', async () => (await import('./old-bugs.mts')).longPlayMemoryCheck(b));
// (v1.07 startup, owner's plan focus 1) the Simple screen and its games open before the valley is built (tests/simple-first.mts)
await check('simplefirst', async () => (await import('./simple-first.mts')).simpleFirstCheck(b));
// (v1.08 companion, owner's plan B) the coin goal chip with no hat, some hats and all hats: "All hats!" (tests/companion-goal.mts)
await check('companiongoal', async () => (await import('./companion-goal.mts')).companionGoalCheck(b));

// (v1.08 notifications) push notifications for grown-ups with a fake push service: Grown-ups on phone, tablet and computer,
// turning on, the switches, quiet hours, bundling, the service worker's text, a tap opens the right place (tests/push-notify-browser.mts)
await check('pushnotify', async () => (await import('./push-notify-browser.mts')).pushNotifyCheck(b));

// (v1.08 variety, owner 3 Nov 2026 AEDT: "the rounds are all the same") every game with choices, 4 rounds in a row at each
// level: no round repeats another and the right answer moves (tests/round-variety.mts); a sample of two levels per game
// each run, all four when the games change
await check('roundvariety', async () => (await import('./round-variety.mts')).roundVarietyCheck(b, { sample: sampled('roundvariety') ? SEED : null }));
// (v1.08b quality) every game on five screens, phone (fivescreens) and wide screens (fivescreenswide); every guide film,
// tale film and story page on five screens (fivescreensfilms) (tests/fivescreens-browser.mts)
await check('fivescreens', async () => (await import('./fivescreens-browser.mts')).fiveScreensCheck(b));
await check('fivescreenswide', async () => (await import('./fivescreens-browser.mts')).fiveScreensWideCheck(b));
await check('fivescreensfilms', async () => (await import('./fivescreens-films.mts')).fiveScreensFilmsCheck(b, { sample: sampled('fivescreensfilms') ? SEED : null }));
// (v1.08b quality) for grown-ups: the learning report by subject and the level by subject; Lumi as the guide; Play with Mum
// and Dad; the gentle play time (tests/quality-v108b-browser.mts)
await check('subjectlevel', async () => (await import('./quality-v108b-browser.mts')).subjectLevelCheck(b));
await check('learningreport', async () => (await import('./quality-v108b-browser.mts')).learningReportCheck(b));
await check('lumiguide', async () => (await import('./quality-v108b-browser.mts')).lumiGuideCheck(b));
await check('playtogether', async () => (await import('./quality-v108b-browser.mts')).playTogetherCheck(b));
await check('playtime', async () => (await import('./quality-v108b-browser.mts')).playTimeCheck(b));

await b.close();
const failed = results.filter(r => !r[1]);
console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
process.exit(failed.length ? 1 : 0);
