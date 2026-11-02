# v1.07 levels: status

Branch: `work/v107-levels`. Helper "levels" (brief: `levels-brief.md`). Times in AEDT.

## Plan (written 2 Nov 2026, 11:10 am AEDT; owner's go already given)

1. **Measure first.** A probe script opens every registered game at under-5, Easy, Medium, Hard and Talent and records
   what the stage shows (the game's `data-lv`, the frame's tier and Talent flag, counts of buttons and elements).
   This tells which games already write their level numbers and which play the same at every level.
2. **Every game writes its level numbers.** Each game puts the numbers it uses (choices, board size, speed, time,
   hints) on its stage as `data-lv` (the convention v1.06 began for group B). Games that do not yet do it get one small
   line in their own file.
3. **Fix games whose levels do not differ:** small, in the game's own file, using `api.smart` / `api.talent` /
   `api.tier()` so Easy < Medium < Hard <= Talent. Under-5s stay gentle (they play as Easy, Talent hidden).
4. **One new check `levelsall`** (at the end of `tests/run.mjs`): opens every game at all four levels and as an under-5;
   fails when a game's `data-lv` is missing, when Easy equals Talent, when the four levels are not at least three different
   settings, when Talent is offered to an under-5, or when the under-5 values are not the Easy values. Games where the
   levels deliberately do not apply (drawing pads, free play) are listed in the check with the reason.
5. **`docs/levels/`:** one table per Play area: every game, what Easy, Medium, Hard and Talent change, read from code
   (the same numbers the game writes to `data-lv`).
6. **Design handbook:** the rule "a new game must have all four levels" in `docs/SO-TAY-THIET-KE.md`, marked proposed.
7. Checks: `node suite.mjs --changed`; if it picks the full suite, push and start `full-suite.yml` on GitHub.

Shared files touched: `tests/run.mjs` (one new check at the end) only. Talent stays hidden for under-5s (owner).

## Progress

Resumed 2 Nov 2026 about 2:05 pm AEDT on Release's "resume".

Done (committed on `work/v107-levels`, not yet tested in the browser beyond a few games):
- `js/games/frame.ts`: new `api.lvNote(choices, used)`; the values a game picks are on the layer as `data-lvnote`.
- Every file's `lv(...)` helper now calls `api.lvNote` (19 files), so values picked through it are recorded.
- Seven sub-agents read every game file and: recorded real level values in `data-lv` where `lv(...)` did not cover
  them (values written before the first tap), and made small fixes where levels did not differ:
  jigsaw, oddone (farmgames), days (more), coinnote (money), busfare, party (money2), cyclo, lighthouse, operaseats
  (places2), reading2 shared runner (11 rd_ games), rd_readalong, rd_storychoice (reading), dragon (folk: values written
  at start), tug (vietnam: written before count-in), trongnu, sparkleorchard and fruitparade (written on open),
  finishpic and shadowpic (art-pad.ts: marks needed 12/12/18/24/30, brush 16/10/8/6/5).
- `tests/levels-all.mts` + one line in `tests/run.mjs`: the check `levelsall`. Exempt (LV-004): 20 free art pads, `music`,
  `rd_book`, `sparklefruitbar` (game of chance with promised fixed odds).
- Proposed rules LV-001 to LV-004 added at the end of `docs/SO-TAY-THIET-KE.md`.
- Draft level tables from the agents: `docs/levels/draft/g1..g7-*.md` (not yet merged into `docs/levels/`).
- A trial on 8 games (pattern, counting, caro, jigsaw, finishpic, cyclo, coinnote, danhdao) passed.

Checks (2 Nov 2026, about 2:40 pm AEDT, commit d67bbe81):
- `levelsall` on every game, one page: PASS, 214 games, 25 exempt with reasons, 792 s locally.
- `node suite.mjs --changed` picks the full suite (tests/levels-all.mts is shared test code), so it runs on GitHub:
  full-suite.yml run 41382885760 started by workflow_dispatch on work/v107-levels (result below when done).
- Local quick checks: arch, bilingual, rules, noemoji, preload PASS; `types` skipped and `unit` failed only because
  this machine lacks the `pg` and `typescript` packages (not related to this branch; GitHub installs them).
- Screenshots looked at, phone 390 x 844, tablet 820 x 1180, computer 1366 x 768: jigsaw 5 x 5, oddone 7 pictures,
  rd_rhyme 4 choices (Talent), finishpic 30 marks (Talent), cyclo (Hard). All tidy on phone and tablet.
  Found, not caused by this branch (the first Cyclo question did not change): on the computer screen the Cyclo Ride
  answer buttons sit below the bottom edge (1366 x 768). For Release / Kid UI.

Owner's decisions:
- familyquiz is exempt from levelsall (the family writes the questions): assumed, owner can change.
- Talent stays hidden for under-5s (owner, 1 Nov 2026 AEDT).

Open points:
- Games that pick values from `api.level` (folk, money, market, some thinking games): a child who climbs inside the
  Easy band (level 2) plays like a fresh Medium child. The check opens fresh children, so it cannot see this. Later work.
- Rules LV-001 to LV-004 in the design handbook are proposed; the owner confirms.
- An earlier probe saw the page close (crash) around the games after `danhdao`; the check now replaces a crashed page
  and names the game.

## Next steps (done 1 to 3)

1. `node tools/build.mts`, then `git checkout content/management-catalogue.json` (the build rewrites it), start
   `python3 -m http.server 8765`, and run `levelsall` on all games once (one page; runner in the scratchpad or
   `cd tests && node run.mjs levelsall`). Fix each game it names, in that game's file.
2. Decide familyquiz (recommended: exempt), add it to `LEVEL_EXEMPT`.
3. Merge `docs/levels/draft/*.md` into `docs/levels/README.md` (one table per Play tab, plus how to read `data-lv`) and
   delete the draft folder.
4. Run `cd tests && node suite.mjs --changed` (expect the full suite: push and start full-suite.yml on GitHub);
   look at phone/tablet/computer screenshots of jigsaw 4 x 4 / 5 x 5, oddone 6, reading games at Talent.
5. Write "ready for Release" at the top of this file and open a draft PR "v1.07 levels: ...".
