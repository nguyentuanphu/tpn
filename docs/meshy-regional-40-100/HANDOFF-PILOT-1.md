# Handoff: regional villagers pilot 1 (short prompt for the next chat)

Paste this into a new cloud session on `nguyentuanphu/tpn`, branch `meshy-regional-cloud`:

---

You are a helper chat for Sparkle Valley (repository TPN). Continue the regional villagers pilot on branch
`meshy-regional-cloud` (never `main`, no deploy, no version bump, draft pull requests only). Reply in Vietnamese, short
and plain; every question as a pop-up (2 to 4 choices, the recommended one first). Commit and push the branch every hour.

Read first: `CLAUDE.md`, `.claude/skills/meshy-characters/SKILL.md` (sections "Villagers" and "Regional villagers"),
`docs/meshy-regional-40-100/PILOT-1.md` (owner's decisions, how it was run on Linux) and this file.

State (11 Nov 2026 AEDT):
- All 24 paid Meshy steps are done: 270 credits, the whole budget. **No more paid calls.** The journal and the raw files
  (`raw-r045.tar` ... `raw-r084.tar`: `B/`, `remesh/` (30k and `-9000`), `rigged/`) were sent to the owner in the chat;
  ask the owner to attach them (GitHub refuses releases from cloud sessions). Unpack into `$SV_MESHY_ROOT/raw-models`.
- Set up as in PILOT-1.md: Blender 4.2 Linux, `pwsh`, `libegl1`, scipy, `cd tests; npm ci; npx playwright install chromium`,
  a Node static server on port 8793, `SV_URL=http://127.0.0.1:8793/`, `SV_MESHY_ROOT=/work/meshy`, `SV_BLENDER`.
- Game references: `blender -b -P tools/blender/lumi.py -- $SV_MESHY_ROOT/work-v108 villager role=<role> game glb hd`
  for vn-schoolgirl, vn-grandma, vn-dad, au-mum, au-grandma, au-boy (files are `-game-hd`, `-adult-hd`, `-elder-hd`).
- Fit each person (about 10 to 40 min; two at a time):
  `pwsh -File tools/meshy/fit_person.ps1 -Id <id> -Villager -NoLimbTint -LidMatch -FaceUV 2 -PieceSnap .001 -MouthFind -LookSolid -LidSoft -VTile 256 <flags> -Ref $SV_MESHY_ROOT/work-v108/villager-<ref>-hd.glb`
  (the face flags since 11 Nov 2026, after the owner's "eyes, nose and mouth all have problems": see the skill's "Eyes, nose and mouth")
  | id | ref | flags |
  |----|-----|-------|
  | r045 | vn-schoolgirl-game | |
  | r050 | vn-grandma-elder | |
  | r057 | vn-dad-adult | -EyeDark |
  | r064 | au-mum-adult | |
  | r074 | au-grandma-elder | -EyeDark -SkinSMax .65 |
  | r084 | au-boy-game | -SkinSMax .65 |
- Install in the working copy only (`models/villager-<id>.glb`, from `$SV_MESHY_ROOT/fitted/<id>/<id>-mid-packed.glb`;
  not committed until the owner approves), then
  `cd tests; node ../tools/meshy/audit_villager.mts <out> r045@vn-schoolgirl,r050@vn-grandma,r057@vn-dad,r064@au-mum,r074@au-grandma,r084@au-boy`
  and `node ../tools/meshy/game_shots.mts <out> village <same list>`; sheet per person:
  `python3 tools/meshy/regional_sheet.py <shots> <id> docs/meshy-regional-40-100/reference-images/<nnn-name>/front.png <out.jpg> "<title>"`.
- Look at every sheet at full size. Owner said on 10 Nov: "hốc mắt chưa đẹp, học xem làm mắt như thế nào từ clara finn sol
  lumi". Fixed by `-LidMatch` (see the skill); check closed eyes again in the game.
- 11 Nov 2026 AEDT, owner: "Tất cả con mắt, mũi và miệng của các nhân vật đều có vấn đề". Found and fixed: the face was
  about 120 px wide in the picture (blurry eyes and nose: `-FaceUV 2` makes it one 360 px island); the mouth box was a
  fixed band of the picture (r057's strap and collar, r084's whole lower face: `-MouthFind`); the smile stayed under the
  "o" and sad mouths (lid fill kept the pink lips, and the lips passed as hair so the piece was see-through there:
  `-MouthFind` erases the mouth on its own and the mouth is never hair); mood pieces floated over hollows (`-PieceSnap`);
  the looking eyes were streaked with the old iris (`-LookSolid` draws the eye afresh). The audit now has an `oldmouth`
  check (a dark painted mouth left under the "o" and sad mouths), which caught three of the six on the first run.
- 11 Nov 2026, owner's second answer: "Mắt và miệng, nặng nhất là mắt, không soi kỹ hay sao mà đã hỏi?" The round had been
  judged on 480 px shots. Since then: `-LidSoft`, the convex-hull `-LookSolid`, and every report is judged on 1024 px face
  shots (`SHOT_SIZE=1024 SHOT_DIST=.45 SHOT_UP=.06`); `tools/meshy/face_moods_preview.py` previews a face fix without a fit.
- The 11 named villagers (other chat) were fitted before these flags: they share the mouth and look faults; refit them
  with the same flags and audit them.
- Known left: in three-quarter views the far eye can show past the nose (needs the game's shut-eye paint, which only
  friends with cover marks get: `js/friend-model.ts`, owned by another chat: put it on the board); r045's hair lock over the
  eye breaks up on a blink; small rim glints at r057's inner corners and a lash flick at r064's outer corner.
- Game roles: the owner chose "not in the game yet" for r045, r050, r057, r064; ask for r074 and r084 at the report.
- Report: one sheet per person, the audit summary, sizes (all under 500 KB), credits (270, from the journal), then a
  pop-up: approve the 6 / fix something / stop. After approval, commit `models/villager-r*.glb` and the docs, and push.

---
