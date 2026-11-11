# Regional villagers, pilot 1 (cloud session, 10 Nov 2026 AEDT)

Six regional people, one per region, as whole Meshy models (clothes painted on) on their own painted faces with mood
pieces, the same way as the 11 named villagers. Branch `meshy-regional-cloud` (from `meshy-villagers`). Nothing is in
the game for children until the owner approves, and the game role each one replaces is the owner's choice.

| Id | Sheet | Views sent to Meshy | Game reference (lumi.py role) |
|----|-------|---------------------|-------------------------------|
| r045 | 045 Northern girl | front, left side | vn-schoolgirl |
| r050 | 050 Huế grandma | front, left side, back | vn-grandma |
| r057 | 057 Sài Gòn dad | front, left side, back | vn-dad |
| r064 | 064 City mum | front, left side, back | au-mum |
| r074 | 074 Coastal grandma | front, left side, back | au-grandma |
| r084 | 084 Outback boy | front, left side, back | au-boy |

Job specifications: `job-specifications/r<nnn>.json` (checked by `tools/meshy/run_batch.py check --asset r<nnn>`).

## Owner's decisions (10 Nov 2026 AEDT, pop-ups in the cloud chat)

- Plan approved ("Go"); every paid Meshy call asked first (24 calls, each answered "Gửi").
- 045: only the front and left-side views go to Meshy. The back view lays the braids on the jacket's back, the other
  two put them in front of the shoulders (as clara-r2). Result: two braids in front, as drawn.
- GitHub refuses releases from the cloud session (HTTP 403 "Creating, editing, or deleting releases is not permitted
  for this session type"), so the draft release `meshy-regional-pilot-1` could not be made. Owner's choice: the journal
  (`meshy-jobs-cloud.sqlite3`) and the raw files are sent to the owner in the chat after each paid step, to keep in
  `D:\WorkSpace\meshy`. Nothing raw is committed. A later session starts from the journal the owner attaches.
- Game roles (pop-up, asked before the review): r045, r050, r057 and r064 are **not put in the game yet**; the files are only
  kept. Nothing in `js/crowd-models.ts` changes.

## Spending (from the journal)

24 paid calls, 270 credits, the whole pilot budget: per person multi-image to 3D `meshy-7.1` 30, Remesh 30k 5,
Remesh 9k (`source@9000`) 5, Auto-Rigging humanoid (height 1.25) 5. Balance before: 2064. No request was retried.

## How it was run (Linux cloud machine)

- Blender 4.2.9 LTS Linux, PowerShell 7.4 (`pwsh`), Node 22, Python 3 with Pillow, numpy, scipy; Playwright's Chromium
  under `tests/`. Blender's renders need `libegl1` (`apt-get install libegl1`).
- `SV_MESHY_ROOT=/work/meshy`, `SV_BLENDER=/usr/local/bin/blender`, `SV_URL=http://127.0.0.1:8793/` (a small Node
  static server of our own). Defaults on the owner's PC are unchanged.
- Paid steps: `python tools/meshy/regional_pilot.py submit r<nnn> make|remesh30k|remesh9k|rig`, then `wait` (poll and
  download); `status` prints the journal and the credits left under the 270 cap.
- Game references: `blender -b -P tools/blender/lumi.py -- $SV_MESHY_ROOT/work-v108 villager role=<role> game glb hd`.
- Fit: `pwsh -File tools/meshy/fit_person.ps1 -Id r<nnn> -Villager -NoLimbTint -LidMatch -FaceUV 2 -PieceSnap .001 -MouthFind -LookSolid -VTile 256 -Ref $SV_MESHY_ROOT/work-v108/villager-<role>-game-hd.glb` (face flags since 11 Nov 2026; per-person flags in HANDOFF-PILOT-1.md).
- Audit: `cd tests; node ../tools/meshy/audit_villager.mts <out> r045@vn-schoolgirl,...` (a regional person is worn by a
  crowd person the game would give that role, or one of the same age when the valley has none of that role this load).
- Shots: `node ../tools/meshy/game_shots.mts <out> village r045@vn-schoolgirl,...`, sheet `review_sheets.py village`.
