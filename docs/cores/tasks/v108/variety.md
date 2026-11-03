# v1.08 helper: variety (status)

Branch: `work/v108-variety` (from `origin/fix/v108-startup-art`). Brief: [variety-brief.md](variety-brief.md). Shared rules: [README.md](README.md).

## Plan (3 Nov 2026 AEDT)

The owner, 3 Nov 2026 AEDT: in many games the rounds are all the same.

1. **Measure first.** A new probe, `tests/round-variety.mts`, opens every game at Easy, Medium, Hard and Talent and plays
   4 rounds in a row as a big kid, always tapping the right answer. It reads what the game offers through `playWatch.ask`
   (the same hook auto play uses, set by `untilRight`), so it covers every game that asks the child to pick, without
   per-game code. Each round is written down as what the child sees: the question line, the picture and the set of answers,
   with ids, inline positions and the answers' order taken out. A game repeats when two rounds look the same, or when the
   right answer sits in the same place every round. By hand: `cd tests && node round-variety.mts [id ...]` (the audit;
   writes `tests/out/round-variety.json`).
2. **Audit:** the list of games that repeat goes below, by level.
3. **Fix, starting with the v1.08 games** (science, maths, money, English, Tiếng Việt), then the older learning games:
   - the shared engines first (one fix covers many games): draw rounds from the whole pool with no repeat inside one game,
     and move the right answer so it never sits in one place every round;
   - then the games with their own round makers: bigger pools, varied numbers, objects and pictures, and at Hard and Talent
     a second kind of question where it fits.
   - Only our own drawings, English and Vietnamese for every new line; no layout changes (that is `work/v108-layout`).
4. **The check `roundvariety`** (end of `tests/run.mts`): every game with choices, 4 rounds at each level, no repeat.
   Games that ask the same thing on purpose go in `VARIETY_EXEMPT` with a reason.
5. Checks: `node suite.mts --changed`; if it picks the full suite, only the checks that cover the change with `--only`
   (the full suite is left for Release).

## Audit

(in progress)

## Progress

(in progress)

## Checks

(in progress)
