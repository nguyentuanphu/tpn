# v1.07 split-code: status

**Paused (2 Nov 2026 AEDT) at Release's request (usage). Waiting for "resume" after 2 pm AEDT. Not ready for Release yet.**

Branch: `work/v107-split-code`. Brief: `split-code-brief.md`.

## Plan

1. Split `js/ui.ts` into `js/ui/` (pure move, `js/ui.ts` re-exports everything). One commit. DONE.
2. Split `js/art.ts` (170 KB) into drawing groups under `js/art/`, same re-exports. One commit. NEXT.
3. Write the v1.08 split plan for `js/main.ts` and `js/world.ts` here (no code change to either this round).
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

## Exact next step (on "resume")

1. Look at `js/art.ts` structure (`awk` top-level declarations and sizes), group the drawings (people, animals, food, places, objects...), and split with the same script approach into `js/art/*.ts`; `js/art.ts` re-exports `pic`, `hasArt` and every other export. Update preload, `sw.ts`, `.gitignore`, check-map; check `tests/unit/stickers.test.mjs` and `tools/emoji-audit.mts` (they import `js/art.js`, which keeps working).
2. Write the main.ts / world.ts v1.08 plan here.
3. Push, start `full-suite.yml` on the branch, take the screenshots, open the draft pull request, mark "ready for Release".

Local test notes: `cd tests && npm install` brings a Playwright whose browser is missing; run checks with `CHROMIUM=/opt/pw-browsers/chromium`. Root `npm ci` is needed for the `unit` check (`pg`). `tools/build.mts` rewrites `content/management-catalogue.json`; it is restored before each commit.

## Open questions

None.
