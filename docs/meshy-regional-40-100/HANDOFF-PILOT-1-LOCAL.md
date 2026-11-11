# Handoff: regional villagers pilot 1, on the owner's PC (Windows)

Paste this into a new Claude Code chat on the owner's PC, in the `tpn` checkout:

---

You are a helper chat for Sparkle Valley (repository TPN). Continue the regional villagers pilot on branch
`meshy-regional-cloud` (never `main`, no deploy, no version bump, draft pull requests only). Reply in Vietnamese, short
and plain; every question as a pop-up (2 to 4 choices, the recommended one first). Commit and push the branch every hour.

Read first: `CLAUDE.md`, `.claude/skills/meshy-characters/SKILL.md` (sections "Villagers" and "Regional villagers"),
`docs/meshy-regional-40-100/PILOT-1.md` and `docs/meshy-regional-40-100/HANDOFF-PILOT-1.md` (the cloud version of this
prompt: same steps, Linux paths).

Start: `git fetch origin`, `git checkout meshy-regional-cloud`, `git pull --no-rebase`. Use the owner's PC defaults (no
`SV_MESHY_ROOT`, `SV_BLENDER`, `SV_PY`, `SV_NPX` needed): meshy root `D:\WorkSpace\meshy`, Python for pictures
`D:\WorkSpace\meshy\tools\pyenv\Scripts\python.exe`. Run `node tools/build.mts` before any shots.

State (11 Nov 2026 AEDT):
- All 24 paid Meshy steps are done: 270 credits, the whole budget. **No more paid calls.**
- The raw files are on this PC: `raw-r045.tar` ... `raw-r084.tar` (each holds `B/`, `remesh/` (30k and `-9000`),
  `rigged/`) and the journal `meshy-jobs-cloud.sqlite3`. Unpack each into `D:\WorkSpace\meshy\raw-models`
  (`tar -xf raw-r045.tar -C D:\WorkSpace\meshy\raw-models`, Windows has `tar`) and check the files land as
  `raw-models\B\r045...`, `raw-models\remesh\r045...`, `raw-models\rigged\r045...` (look at one tar's list first:
  `tar -tf raw-r045.tar`). The journal stays outside the repo; it is only read for the credits.
- Game references (only if `D:\WorkSpace\meshy\work-v108\villager-<role>-*-hd.glb` are missing):
  `blender -b -P tools/blender/lumi.py -- D:\WorkSpace\meshy\work-v108 villager role=<role> game glb hd`
  for vn-schoolgirl, vn-grandma, vn-dad, au-mum, au-grandma, au-boy (files `-game-hd`, `-adult-hd`, `-elder-hd`).
- Fit each person (two at a time):
  `powershell -File tools/meshy/fit_person.ps1 -Id <id> -Villager -NoLimbTint -LidMatch <flags> -Ref D:\WorkSpace\meshy\work-v108\villager-<ref>-hd.glb`
  | id | ref | flags |
  |----|-----|-------|
  | r045 | vn-schoolgirl-game | |
  | r050 | vn-grandma-elder | |
  | r057 | vn-dad-adult | -EyeDark |
  | r064 | au-mum-adult | |
  | r074 | au-grandma-elder | -EyeDark -SkinSMax .65 |
  | r084 | au-boy-game | -SkinSMax .65 |
  Send each run's output to a log file (`*> D:\WorkSpace\meshy\fit-<id>.log`).
- Install in the working copy only (`models/villager-<id>.glb`, from `D:\WorkSpace\meshy\fitted\<id>\<id>-mid-packed.glb`;
  not committed until the owner approves), then
  `cd tests; node ../tools/meshy/audit_villager.mts <out> r045@vn-schoolgirl,r050@vn-grandma,r057@vn-dad,r064@au-mum,r074@au-grandma,r084@au-boy`
  and `node ../tools/meshy/game_shots.mts <out> village <same list>`; sheet per person:
  `<pyenv python> tools/meshy/regional_sheet.py <shots> <id> docs/meshy-regional-40-100/reference-images/<nnn-name>/front.png <out.jpg> "<title>"`.
  Do not run other browser checks at the same time (the page server times out).
- Look at every sheet at full size. Owner said on 10 Nov: "hốc mắt chưa đẹp, học xem làm mắt như thế nào từ clara finn sol
  lumi". Fixed by `-LidMatch` (see the skill); check closed eyes again in the game.
- Known left: in three-quarter views the far eye can show past the nose (needs the game's shut-eye paint, which only
  friends with cover marks get: `js/friend-model.ts`, owned by another chat: put it on the board); r045's hair lock over the
  eye breaks up on a blink; small rim glints at r057's inner corners and a lash flick at r064's outer corner.
- Game roles: the owner chose "not in the game yet" for r045, r050, r057, r064; ask for r074 and r084 at the report.
- Report: one sheet per person (SendUserFile), the audit summary, sizes (all under 500 KB), credits (270, from the
  journal), then a pop-up: approve the 6 / fix something / stop. After approval, commit `models/villager-r*.glb` and the
  docs, and push `meshy-regional-cloud`.

---
