# v1.07 split-code: status

**Resumed 2 Nov 2026 AEDT. Steps 1 to 3 done and pushed; step 4 (GitHub full suite, screenshots, pull request) in progress. Not ready for Release yet.**

Branch: `work/v107-split-code`. Brief: `split-code-brief.md`.

## Plan

1. Split `js/ui.ts` into `js/ui/` (pure move, `js/ui.ts` re-exports everything). One commit. DONE.
2. Split `js/art.ts` (170 KB) into drawing groups under `js/art/`, same re-exports. One commit. DONE.
3. Write the v1.08 split plan for `js/main.ts` and `js/world.ts` here (no code change to either this round). DONE (below).
4. Push, start `full-suite.yml` on the branch (workflow_dispatch), screenshots of Play, profile and Grown-ups on phone, tablet and computer, then "ready for Release".

## Done

### Step 1: `js/ui.ts` split (commit 21345a17)

`js/ui.ts` (128 KB) is now a 1.3 KB file that re-exports the same 31 names (plus `holdButton`, `modal`, `dialog`, `dialogHooks`, `reward` from `popups.js`, as before). Parts:

| File | Size | Holds |
|---|---|---|
| `js/ui/common.ts` | 9 KB | comfort, captions, toast, language/learn buttons, foldHeadings, jumpNav, website button, icons and names |
| `js/ui/grownups.ts` | 1 KB | openGrownups, openRecorder (load `ui-settings.js`) |
| `js/ui/title.ts` | 5 KB | showTitle |
| `js/ui/profile.ts` | 18 KB | showWho, twoViewNow, openEditor |
| `js/ui/quick.ts` | 7 KB | openQuick |
| `js/ui/festivals-ui.ts` | 5 KB | festCalendarHTML, openFestivals |
| `js/ui/pad.ts` | 51 KB | openPad |
| `js/ui/pad-map.ts` | 2 KB | the Pad map picture |
| `js/ui/pad-album.ts` | 11 KB | the Album tab (sticker book) |
| `js/ui/shops.ts` | 7 KB | openCooking, openShop, openWardrobe |
| `js/ui/hub.ts` | 16 KB | openGamesHub, HUB, folkGames, nextGameAfter |

How it was kept a pure move:
- Lines were moved by a script; a line-by-line comparison against the old file shows nothing lost or changed, apart from the added `export` words, the header comments and the album wrapper.
- `pad.ts` alone would have been 62 KB, over the 60 KB goal. The Album tab's three inner functions (drawAlbum, albumMoreHTML, bindAlbumMore) moved unchanged into `albumTab(game, i, hero, p, m, close, savePhoto)`, which receives exactly the names they used inside openPad (all constants, none reassigned).
- No circular imports between the parts (`arch`: 0 circles, as allowed).
- `friends.ts` from the brief: the Friend tab is 11 lines inside openPad that call `game.drawOnlinePanel`; the online panel itself lives elsewhere, so no separate file.

Files that follow the move: `index.html` preload list (`node tools/preload.mts`), `sw.ts` offline list (new lines, under 200 characters), `.gitignore` (made by `tools/build.mts`), `tests/check-map.json` (the new files take `js/ui.js`'s checks until GitHub refreshes the map), `tools/voice-lines.mts` (now reads `js/ui/`; `js/ui/*.js` counts as `js/ui.js` for areas and core order, so the voice pack does not change: the same 4441 lines before and after), `tools/reviewed-voice-delta.mts` (`js/ui/*.ts` are public game sources like `js/ui.ts`).

First download: the same code, plus about 2 KB of repeated import lines across the parts. Later, `pad*.ts`, `shops.ts` and `hub.ts` (about 87 KB) could load only when opened; that loading change is left to the startup helper.

### Checks (2 Nov 2026 AEDT, on 21345a17's tree)

- pass: emoji, preload, arch, names, rules, unit (480), types, boot, contract, phone (10 screens on desktop, phone, tablet), offline.
- `--changed` picks the full suite (`.gitignore` changed): to run on GitHub, not started yet.
- Not yet looked at: screenshots of Play, profile and Grown-ups.

### Step 2: `js/art.ts` split (commit c84338e7)

`js/art.ts` (180 KB) is now a short file: it imports the seven drawing groups in their old order and re-exports `pic`, `hasArt`, `labelArt`, `artSVG` and `ART_COUNT`. The order matters because `def()` replaces a picture and `add()` only fills a gap (some pictures, such as the cow, are drawn twice on purpose), so each group is a side-effect import that runs in the same order as before.

| File | Size | Holds |
|---|---|---|
| `js/art/kit.ts` | 2 KB | the outline (`O`, `W`, `N`), small shapes, the table `ART`, `def()`, `add()` |
| `js/art/pad-and-games.ts` | 35 KB | the Pad, Games hub tabs, learning, games and folk games, animals, coins |
| `js/art/howto-tales.ts` | 34 KB | round 29: how-to films and fairy tales (`face`, `num`, `arrow`, `hand`, shapes) |
| `js/art/people-food.ts` | 21 KB | second set (people, food, animals, things), festival calendar |
| `js/art/round30.ts` | 31 KB | round 30: food, drink, plants, animals, faces, people, clothes |
| `js/art/things-money.ts` | 30 KB | round 30 things and places, money games' coins and notes, medals |
| `js/art/r90-audits.ts` | 14 KB | r90 games and the October 2026 audits |
| `js/art/learning.ts` | 12 KB | r79 skill stickers, the Fun learning tab |
| `js/art/lookup.ts` | 2 KB | `pic()`, `hasArt()`, `labelArt()`, `artSVG()`, `ART_COUNT()` |

Proof it is the same: the old file (with `ART` exported) and the new `ART` were loaded side by side: 896 keys, the same order, every drawing the same text, `pic()` and `labelArt()` give the same output. A new drawing now goes into the group it belongs to in `js/art/` (CLAUDE.md's rule "our drawing in js/art.ts" still holds: `js/art.ts` is the way in; Release may want to update that wording).

Also changed: preload list, `sw.ts` offline list, `.gitignore`, check-map, and the provenance file lists in `tests/content-art-browser.mjs` and `tests/owner-desk-browser.mjs` (they hashed `js/art.ts`; they now also hash the parts).

Checks (2 Nov 2026 AEDT): pass emoji, noemoji (Who's playing, valley, Vui chơi, 8 Pad tabs, Grown-ups, 237 games), preload, arch (0 circles), names, bilingual, types, unit (480), boot.

### Step 3: plan for v1.08 (`js/main.ts`, `js/world.ts`; not touched this round)

**`js/main.ts` (215 KB, 2,016 lines).** Sections and sizes today: imports 8 KB; renderer and world 18 KB (118-289); people of the valley 20 KB (290-500); rewards and `playGame` 9 KB (501-605); NPC talks and quests 22 KB (606-847); hero events 12 KB (848-981); talking and bubbles 7 KB (982-1073); games with friends online 30 KB (1074-1307); friends, codes and the online panel 27 KB (1308-1514); layout 13 KB (1515-1652); starting a session 8 KB (1653-1735); the loop 17 KB (1736-1922); boot 23 KB (1923-end).

The hard part is shared state: main.ts has 14 module-level `let`s (`renderer`, `resumeDrawing`, `framesSeen`, `bootDone` and others) that several sections assign. An imported binding cannot be assigned, so a pure line move does not work for them. Plan:
1. First commit (still one file): gather those `let`s into one object `S` in a new `js/main/state.ts` (`S.renderer = ...`), a mechanical rename checked by `names`, `types` and the full suite. Everything else in main.ts already goes through `G` (the game object).
2. Then move sections, one commit each, in this order (least shared first): `main/online-games.ts` (1074-1307), `main/friends.ts` (1308-1514), `main/talks.ts` (606-847, NPC talks and quests), `main/npcs.ts` (290-500), `main/rewards.ts` (501-605 with `playGame`; the plan's `game-launch.ts`), `main/layout.ts` (1515-1652), `main/loop.ts` (1736-1922). `main.ts` keeps the renderer, session start and boot (about 50 KB) and keeps its exports (`SvMain` and the rest).
3. Startup gain: online games and friends (57 KB) are not needed before the first frame; once they are separate files the startup helper can load them with `import()` when the child opens Friends or a room. Leave that loading change to startup.
4. Watch: the order of side effects at load (main.ts runs code at the top level while it loads); `arch` must stay at 0 circles, so the new files may import `state.ts` and each other only one way, never `main.ts`.

**`js/world.ts` (121 KB, 1,292 lines).** Today: map data and places 12 KB (1-118); roads, rivers, water and `heightAt` 23 KB (119-340); regions, shrines, towers, plots and lots 12 KB (341-491); `createWorld()` 60 KB (492-1132, one function: sky, terrain, trees, village houses and stalls, bridges, shrines, towers, Leafies, animals, walking surface); painting the map and water 6 KB (1133-1200); levelling ground under buildings 9 KB (1201-1292).

Plan (after the roads helper's v1.07 change is merged, because it changes this file):
1. Pure moves first: `world/places.ts` (1-118 and 341-491), `world/ground.ts` (119-340: roads, water, height), `world/paint.ts` (1133-1200), `world/reshape.ts` (1201-1292). `world.ts` re-exports everything, as `ui.ts` does now. The 3 module `let`s (one is `WIDE`, used by `oldHeightAt`) stay with `heightAt` in `ground.ts`.
2. `createWorld()` is 60 KB alone. Split it like the Pad's Album tab: each "----------" part (sky, terrain, trees, village, bridges, shrines and towers, Leafies, animals, walking surface) becomes `buildSky(scene, quality, ...)` and so on in `world/build-*.ts`, receiving the same local names it uses now, so its text stays the same. This goes with "build each region" in focus 1 of the owner's plan.
3. Watch: `perf` and `startup` (the world is built at start), `solid`, `roads`, `flat`, `roadshape`, `mapcoords`.

### Step 4 (in progress)

- Screenshots (2 Nov 2026 AEDT, `split-code-shots/`): title, Who's playing, Play, Grown-ups and the Pad album on phone (390 x 844), tablet (820 x 1180) and computer (1440 x 900). All tidy, no page errors.
- Draft pull request: #788.
- Full suite on GitHub: run 41382179883 (started by hand on ca22c5dc), queued at 2:16 pm AEDT. Result to follow.

## Exact next step

When the full suite finishes: if it is green, write the result here and mark this file "ready for Release"; if a check is red, fix the code (never the check) and run it again.

Local test notes: `cd tests && npm install` brings a Playwright whose browser is missing; run checks with `CHROMIUM=/opt/pw-browsers/chromium`. Root `npm ci` is needed for the `unit` check (`pg`). `tools/build.mts` rewrites `content/management-catalogue.json`; it is restored before each commit.

## Owner's decisions

- 2 Nov 2026 AEDT (through Release): the session that changed each file splits it. The roads helper splits `js/world.ts` and the startup helper splits `js/main.ts`, both following the plan above. split-code does not split those two files.

## Open questions

None.
