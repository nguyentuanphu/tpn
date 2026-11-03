# v1.08 helper: variety (status)

**ready for Release** (3 Nov 2026, 11:30 pm AEDT). Full suite left for Release (owner, 3 Nov 2026 AEDT).

Branch: `work/v108-variety` (from `origin/fix/v108-startup-art`). Brief: [variety-brief.md](variety-brief.md). Shared rules: [README.md](README.md).

## Plan (3 Nov 2026 AEDT)

The owner, 3 Nov 2026 AEDT: in many games the rounds are all the same.

1. **Measure first.** A new probe, `tests/round-variety.mts`, opens every game at Easy, Medium, Hard and Talent and plays
   4 rounds in a row as a big kid, always tapping the right answer. It reads what the game offers through `playWatch.ask`
   (the same hook auto play uses, set by `untilRight`), so it covers every game that asks the child to pick, without
   per-game code. In learning games it also reads a guess offered with `tapOne` (the science experiments). Each round is
   written down as what the child sees: the question line, the picture and the set of answers (ids and inline styles
   taken out, except where a thing stands and how it is turned), and the place of the right answer in the order the child
   sees the answers. A game repeats when two rounds look the same, or when the right answer is in the same place in every
   round at every level (rows of answers only: not things spread about a scene, not free choices where every answer is
   right). By hand: `cd tests && node round-variety.mts [id ...]` (`RV_LOG=1` prints each game; the result is in
   `tests/out/round-variety.json`).
2. **Audit** (below).
3. **Fix**, the v1.08 games first (science, maths, money, English, Tiếng Việt), then the older learning games:
   - shared helpers in `js/games/variety.ts`: `deck` (every item once before any comes back, never twice in a row),
     `fresh` (ask the round maker again until it makes something not seen in this game), `mover` (the right answer never
     where it was the round before; with two answers never three times in a row in one place);
   - the shared maths engine (`js/games/maths-kit.ts`, all 21 new maths games): `distinct()` rounds and a moving answer;
   - each game with its own round maker: bigger pools dealt from a deck, varied numbers and pictures, and a second kind of
     question where one kind repeated (Pizza Fractions at Easy).
   - Only our own drawings; English and Vietnamese; no layout changes (that is `work/v108-layout`).
4. **The check `roundvariety`** (end of `tests/run.mts`).
5. Checks: `node suite.mts --changed` picks the full suite (the build adds the new `js/games/variety.js` to
   `.gitignore`), so only the checks that cover the change ran, with `--only`; the full suite is left for Release.

## Audit (3 Nov 2026 AEDT)

299 games, 4 rounds in a row at each of the four levels.

**Before the fixes:** 38 games flagged. Real repeats: Number Train, Rainbow Paints, Pattern Picnic, Catch-and-Release Fish,
Emu Egg Basket, Crab Walk, Zither Strings, Loud and Quiet, Pairs or Odd?, Turn It Round, Kick to Kick, Little Nippers,
Rolling Hoops, Cans for Coins, At the Bank, Pizza Fractions (Easy asked one question only), Two Homes Money, Ball Box Can,
Tone Detective, Odd One Out. (Found by reading the code at the same time and fixed too: What's the Time?, Add It Up,
Count With Me, Letter Hunt, Shadow Shapes, the English games, the Tiếng Việt games, Save for a Toy, Give Change.)
The rest (the place trips, the reading corner games) were the probe reading answers in the order the game made them,
not the order on screen; fixed in the probe.

**After the fixes:** every game with choices passes, except the two named on purpose in the check:
- `VARIETY_EXEMPT`: Crab Walk (left or right: only two ways; never three times the same way now) and Loud and Quiet
  (the question is a sound; the screen is the same on purpose; never the same answer three times in a row now).
- `PLACE_EXEMPT` (place rule only): Read Along in Tiếng Việt (tap the words in reading order: the next word is always the
  first one left).

**Not measured by this check (143 games):** board games, card games, drag and drawing games, free pads, action games
played by moving or holding, four science experiments whose only choice is a drag (Ramps, Seesaw, Shadow, Bottle Music),
and the money games that make an amount from coins (Shop and Pay, Give Change, Needs First, Price Line-up, Coin Sort,
Make the Amount, Chores). Their rounds come from shuffled pools or the moves of the game; Give Change was read by hand and
now never asks the same sum twice.

## What changed

- New: `js/games/variety.ts`, `tests/round-variety.mts`, check `roundvariety` at the end of `tests/run.mts`.
- Shared files, small changes:
  - `js/games/frame.ts` (`tapOne` notes what it offers, `playWatch.offer`) and `js/games/playwatch.ts` (its type);
  - `tests/run.mts` (the check), `tests/suite.mts` (`roundvariety` with the heavy checks, and a sample of two levels per
    game unless the games changed, like `reading`);
  - `.gitignore` (the build adds `js/games/variety.js`).
- Games: `maths-kit.ts`, `maths3.ts` (Pizza Fractions at Easy: two, three or four friends share, the wrong pizzas are
  cut unfairly, not cut, or cut for another number), `maths4.ts`, `english.ts`, `tiengviet.ts`, `tiengviet2.ts` (also: One
  Word, Many Tones could leave the right picture out of the choices at Medium and up), `learning.ts`, `thinking.ts`
  (Number Train at Easy now counts up to 7 so four trains differ), `bigthinkers2.ts`, `nature2.ts`, `animals2.ts`,
  `music2.ts`, `numbers2.ts`, `outside.ts`, `shapes2.ts`, `farmgames.ts`, `money2.ts`, `money3.ts`.
- Voice: 44 missing lines recorded with Azure (the new pizza questions and lines other branches had added), `voices/`.
  No line with a child's name.

## Checks (3 Nov 2026 AEDT, on `work/v108-variety`)

`node suite.mts --changed` picks the full suite (the new file goes into `.gitignore`), so the checks that cover the change
ran one at a time with `--only` (base `origin/fix/v108-startup-art`). The full suite is left for Release.

| Check | Result |
|---|---|
| emoji, noemoji, arch, names, bilingual, rules, types | pass |
| unit | pass (515), after `npm ci` in the repo root (the first run had no `pg` package here) |
| preload | pass, after `node tools/preload.mts`: the list in `index.html` was already out of date on `fix/v108-startup-art` (the same tool there gives the same change: `js/art/english.js` and `js/games/english-meta.js` out, `js/content/science-places.js` in) |
| boot, contract, phone | pass |
| games (299), gamelevel, levelsa, levelsb, levelsall (276), gameends, gameflow, soundgames | pass |
| hocvui, englishmode, school, ownerlearningprogression, ownerthinkinglevels, ownerlearninglayout, r79learning | pass |
| voicepack, voicecover | pass |
| roundvariety (new, every level, 33 min) | pass: 156 games with choices, 4 rounds in a row at each level |
| online checks | not run (nothing online changed) |

Screenshots looked at (phone 390 x 844, tablet 820 x 1180, computer 1280 x 800): Pizza Fractions at Easy, Number Train at
Easy, Listen and Choose at Hard. Tidy on all three, layout unchanged.

## For Release

- `.gitignore` and `index.html` (preload list) changed; both are made by the tools.
- `voices/manifest-*.json` and `voices/areas.json` changed with the 44 new recordings: if another branch recorded too,
  keep both sets of lines (or run `node tools/make-voice-pack.mts --engine azure` again after merging).
- `roundvariety` takes about 33 minutes in full here (3 pages side by side); in a sample run two levels per game.

## Commits

- `work/v108-variety`: see `git log origin/fix/v108-startup-art..work/v108-variety`.
