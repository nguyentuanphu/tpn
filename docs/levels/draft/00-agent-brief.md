# Brief for a levels sub-agent (Sparkle Valley, repo /home/user/tpn, branch work/v107-levels)

You help the "levels" helper of round v1.07. Goal (owner's plan, Focus 2): every game in Play plays differently at Easy,
Medium, Hard and Talent, writes the numbers it uses for its level onto the game frame so a check can compare them, and
has a documented row saying what each level changes. Read `docs/cores/tasks/v107/levels-brief.md` (short) first.

## How levels work in code (read `js/games/frame.ts` around `const api = {` if you need detail)

- `api.little`: under-5 child. Must always play gently (Easy values or gentler), can never lose, never sees Talent.
- `api.smart`: 0 Easy, 1 Medium, 2 Hard, 3 Talent (0 for under-5s).
- `api.talent`: true only at Talent (never for under-5s).
- `api.level`: a number 1..5 inside the chosen level's band: Easy 1-2, Medium 2-3, Hard 4-5, Talent 5 (a fresh child
  starts at the band's bottom: Easy 1, Medium 2, Hard 4, Talent 5). Code that only branches on `api.level <= 1` vs
  `=== 2` etc. may make Medium equal Hard or Easy equal Medium; check it.
- `api.tier()`: 0 under-5, 1 Easy, 2 Medium, 3 Hard and Talent (moves at most one step with the child's answers).
- `api.lvNote(choices, used)`: NEW. Records one level setting on the frame (`data-lvnote`). The per-file helper
  `lv(api, e, m, h, t = h)` (and the 5-argument `lv(api, little, easy, medium, hard, talent)`) already calls it, so any
  value picked through `lv(...)` is recorded automatically. You do not need to add anything for those.
- `data-lv` on the stage: games also write their own level numbers: `api.stage.dataset.lv = [a, b, c].join(',')`
  (several files have a `mark(api, ...v)` helper that does exactly this; use it where it exists).

The new check `levelsall` opens every game as an under-5 and at Easy, Medium, Hard and Talent, waits about 0.7 s
WITHOUT tapping anything, and reads `stage.dataset.lv + '|' + layer.dataset.lvnote`. It fails a game when that
signature is empty, when Easy equals Talent, or when the four levels give fewer than three different signatures.

## Your job, for every game registered in your files

1. Read the game's code and work out exactly what Easy, Medium, Hard and Talent change (and what under-5s get).
2. Make sure the values that differ are recorded before the first tap: either picked through `lv(...)`, or written to
   `api.stage.dataset.lv` (or `mark(...)`) at the start of the game. Write the real values (number of choices, board
   size, speed or time in ms, rounds, hints on/off, computer skill), not the level's name, index or tier number on its
   own. If a game already writes `data-lv`, keep it (other checks, `levelsa`, `levelsb`, `hocvui`, read some of them);
   you may append values to it.
3. If the levels do not really differ (Easy equals Talent, or fewer than three of the four levels differ), make a SMALL
   fix in that game's own code so they do, in something a child sees or feels: more choices, a bigger board, more
   rounds, faster speed, less time, fewer helper hints, a smarter computer player. Use `lv(...)`, `api.smart` or
   `api.talent`. Keep under-5s exactly as gentle as before. Never make Talent show less than it does now, never make
   Easy harder than it is now (other checks compare Easy with Talent counts).
4. Online play (`api.online`): leave the online path's settings as they are (both players must agree); only change the
   solo/local path.
5. Exceptions: a pure free-play pad with no goal and nothing to get right (free drawing, free music pad) may keep one
   setting. Do not invent levels for it; list it as an exception with a one-line reason. Games that have a goal are
   not exceptions.
6. Everything a child sees or hears stays in English and Vietnamese (`T(en, vi)` / `api.say(en, vi)`); only our own
   drawings (`js/art.ts`), no new emoji; touch targets at least 44 px (64 px for under-5s). Keep code style: short,
   comment new behaviour with `// (v1.07 levels) ...` in plain English.

## Rules

- Edit ONLY the files listed for you. Do not touch `js/games/frame.ts`, tests, docs, or other games' files.
- Do NOT run the browser, the test suite, `tools/build.mts`, a web server, git commit or git push: another process is
  using the machine and the lead will build, test and commit. Check syntax of each file you changed with:
  `node -e "const m=require('node:module'),fs=require('fs');fs.writeFileSync(process.argv[2],m.stripTypeScriptTypes(fs.readFileSync(process.argv[1],'utf8')))" <file.ts> <scratch>/x.mjs && node --check <scratch>/x.mjs`
  using the scratch folder given to you.
- Write your table fragment (markdown, English, no emoji) to the path given to you: one row per game:
  `| id | Name (EN / VI) | Under-5 | Easy | Medium | Hard | Talent | Recorded as | Change this round |`
  Cells are short and concrete, read from code (for example "3 choices, 4 rounds", "board 3 x 3", "computer misses 40 %",
  "hint shown"). "Recorded as" names the values in `data-lv` / `lv(...)`. "Change this round" is "none", "recorded only",
  "fixed: <what>" or "exception: <why>".
- Your final message: the list of games you fixed (one line each), games only recorded, exceptions, and anything you
  were unsure of. Keep it compact.
