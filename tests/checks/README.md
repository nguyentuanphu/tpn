# The checks, by group

(v1.07 split-tests, 2 Nov 2026 AEDT.) The browser checks that used to fill `tests/run.mjs` (297 of them, 7,700 lines)
now live here, one file per group. Nothing about running them changed: `node run.mjs <check ...>`,
`node suite.mjs --changed`, `--list`, `--only`, `--jobs`, `--shard` and the GitHub full suite work as before, and every
check kept its exact name.

| File | What it checks |
| --- | --- |
| `shared.mjs` | Not checks: what they all share. The browser `b`, `check`, `ok`, `open`, `clear`, `start`, `URL`, `sampled`, `SEED`, `packedSite`, `serveFolder`, `pairKeys`, `withEmo`, `testerPre`, `testerSite`, `ACCEPTED`, `ownerSmoke` and the imports of the helper modules. Importing it builds the game (unless `SV_BUILT`) and starts the browser. |
| `index.mjs` | The list of groups, in the order `run.mjs` runs them. `suite.mjs` reads it too. |
| `code.mjs` | Code and content rules without game play: unit tests, rule registry, types, names, emoji, preload, validate. |
| `content.mjs` | The family website content, captures and art. |
| `startup.mjs` | Start-up, saves, offline, updates and install. |
| `screens.mjs` | Simple screen, hub, HUD and layout on phone, tablet and computer. |
| `games.mjs` | The games: play, levels, rules and win screens. |
| `learning.mjs` | Hoc vui, school, reading and thinking levels. |
| `valley.mjs` | The valley and the map: roads, water, bridges, places, riding and the camera. |
| `play.mjs` | Everyday play: bag, shop, clothes, photos, family, jobs and daily adventures. |
| `online.mjs` | Online and friends: playing together, rooms, cloud and messages. |
| `studio.mjs` | Studio and the owner's desk. |
| `voice.mjs` | Voice and audio: voice packs, the microphone, songs and sounds. |
| `tester.mjs` | Testers and reports. |
| `festivals.mjs` | Festivals. |
| `stories.mjs` | Stories, tales, films and guides. |
| `autoplay.mjs` | Auto play and quest plans. |
| `owner.mjs` | Owner-reported problems (rounds checked by the owner). |

The last few checks (`terrainmath`, `renderaudit`, `r87ui`) stay at the end of `tests/run.mjs` on purpose: that is where
new checks land, and keeping the old last lines there lets a branch that added a check at the end of the old
`run.mjs` merge without a conflict.

## Adding a new check

1. Add it as its own block at the end of `tests/run.mjs`, just above `await b.close();`:
   ```js
   await check('mynewcheck', async () => {
     const P = await open(b, { w: 1024, h: 768 }); await clear(P.page);
     ...
     return 'what it proved';
   });
   ```
2. Add any shared name it uses (`open`, `clear`, `ok`, `start`...) to the `import { ... } from './checks/shared.mjs'`
   line at the top of `run.mjs`.
3. The name must be new across all the files (`node suite.mjs --list --only mynewcheck` shows whether it is found).
   The block starts with `await check('name'` at the start of a line and ends with `});` at the start of a line: that
   is how `suite.mjs --changed` finds it.

## Moving a check into a group (Release, when it merges)

1. Cut the whole block (its comment lines too) from `run.mjs` and paste it at the end of the right group file.
2. In the group file, add to its `import { ... } from './shared.mjs'` line any shared name the block uses that is not
   there yet. A name that is missing only fails when the check runs (`ReferenceError`), so run the check once:
   `node run.mjs mynewcheck`.
3. A path relative to the file moves one folder down: `import('./x.mts')` becomes `import('../x.mts')`,
   `import('../js/x.js')` becomes `import('../../js/x.js')`, `new globalThis.URL('../sw.js', import.meta.url)`
   becomes `'../../sw.js'`. Paths given to `fs` and to child processes are relative to `tests/` (the working folder)
   and stay as they are.
4. A helper several checks share goes into `shared.mjs` with `export`, never copied into a group.

A branch made before the split that changed a check in the old `run.mjs`: find the check by name in its group file
(`grep -n "check('name'" tests/run.mjs tests/checks/*.mjs`) and make the same change there.

## Order

`run.mjs` runs the groups in the order of `index.mjs`, each file's checks in their own order, then its own checks. The
order is not the order of the old single file: no check depends on another (each opens its own window, and every window
is closed after each check), and the GitHub full suite already runs them in different sets on its 8 machines.
