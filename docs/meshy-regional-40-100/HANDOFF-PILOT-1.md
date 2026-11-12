# Handoff: regional villagers pilot 1

Branch `meshy-regional-cloud` (never `main`, no deploy, no version bump, draft pull requests only). Written 12 Nov 2026,
about 16:30 AEDT, when the owner stopped this chat so that another Claude account takes over.

## Where it stands (12 Nov 2026 AEDT)

- **Meshy spending is finished:** 24 paid steps, 270 credits, the whole budget (journal `meshy-jobs-cloud.sqlite3`, tables
  jobs, remesh and rigging). **No more paid calls.** The raw files are on the owner's PC in
  `D:\WorkSpace\meshy\raw-models\{B,remesh,rigged}` (also sent to the owner as `raw-r045.tar` ... `raw-r084.tar`).
- **The six models are committed** in `models/villager-r045.glb` ... `villager-r084.glb` (the owner asked on 12 Nov to
  upload everything). They are the round fitted 12 Nov at about 16:00 AEDT with every face fix up to commit 77c841356.
  Audit of that round: 120 cases, **0 failing** (eyes worst 2, mouth worst 53, oldmouth worst 16, lookstill 0, size
  worst 486 KB). The 1024 px face pictures of that round are in `review-20261112/moods-<id>.jpg` (each: smile, blink,
  half / happy, o, sad / look left, look right, excited) with `review-20261112/audit.log`.
- **Owner's approval is still open.** Third approval pop-up (12 Nov): "Sửa lại 3 lỗi và kiểm tra lại mắt và mí của r45":
  r084's half lid (bare white crescent), r064's hair notch by the left eye, r045's eye corners and lids. Fixed in the
  code and seen fixed at 1024 px in the committed round, except two small things still visible: a small dark fleck over
  r045's right eye on shut eyes (the end of a painted hair strand), and a faint light fleck at the hair's edge by r064's
  left eye on shut eyes. Commit 751e6d0a4 (a small dark mark already half under a shut lid closes whole) targets r045's
  fleck but **was never seen in the game**: its refit was stopped when the owner stopped work. The committed models do
  not have it.
- **Game roles:** the owner chose "not in the game yet" for all six (r045, r050, r057, r064 on 10 Nov; r074, r084 on
  12 Nov). Nothing in `js/crowd-models.ts` changes.
- Nothing is running. The test server on port 8794 and every Blender fit of this chat were stopped.

## Next steps

1. Refit all six with the code at the branch tip (it has 751e6d0a4), two at a time:
   `pwsh -File tools/meshy/fit_person.ps1 -Id <id> -Villager -NoLimbTint -LidMatch -FaceUV 2 -PieceSnap .001 -MouthFind -LookSolid -LidSoft -VTile 256 <flags> -Ref $SV_MESHY_ROOT/work-v108/villager-<ref>-hd.glb`
   (with `FIT_SAVE_F=$SV_MESHY_ROOT/fitted/<id>/F.png` set, for the preview tool, and `FIT_LOG=<file>` to keep Blender's lines)

   | id | ref | flags | hair colour for the preview |
   |----|-----|-------|------|
   | r045 | vn-schoolgirl-game | | .764,.459,.449 |
   | r050 | vn-grandma-elder | | .78,.632,.545 |
   | r057 | vn-dad-adult | -EyeDark | .36,.21,.124 |
   | r064 | au-mum-adult | | .101,.078,.072 |
   | r074 | au-grandma-elder | -EyeDark -SkinSMax .65 | .935,.428,.325 |
   | r084 | au-boy-game | -SkinSMax .65 | .671,.477,.341 |

2. Copy `$SV_MESHY_ROOT/fitted/<id>/<id>-mid-packed.glb` to `models/villager-<id>.glb`, then from `tests`:
   `node ../tools/meshy/audit_villager.mts <out> r045@vn-schoolgirl,r050@vn-grandma,r057@vn-dad,r064@au-mum,r074@au-grandma,r084@au-boy`
   (must say failing 0; r064's earring has twice been counted as an open eye in a side view, 15 px: look at the picture),
   then `SHOT_SIZE=1024 SHOT_DIST=.45 SHOT_UP=.06 node ../tools/meshy/game_shots.mts <out> village <same list>` and
   the 480 px `game_shots.mts` run for the sheets (`tools/meshy/regional_sheet.py`). The test server is
   `node tools/meshy/serve.mjs <worktree> <port>` from the `sv-meshy-prod` worktree (it is not on this branch), with
   `SV_URL=http://127.0.0.1:<port>/`.
3. **Look at every mood of every person at 1024 px, eye by eye**, against the ChatGPT front
   (`reference-images/<nnn-name>/front.png`), before asking anything. Check r045's eyes and lids above all (owner).
4. Report to the owner in Vietnamese (pictures sent as files), then one pop-up: approve the 6 (recommended) / fix more
   / stop. On approval, commit the refitted models and docs and push the branch. Release merges, not this chat.
5. The 11 named villagers (another chat's work) were fitted before these face flags and share the mouth and look faults:
   refit them with the same flags and audit them (put it on the board).

## Known left (not for this pilot)

- The far eye can show past the nose in three-quarter views of shut eyes: needs the game's shut-eye paint in
  `js/friend-model.ts`, owned by another chat (put it on `docs/cores/BOARD.md`).
- r084's "o" mouth is small (sized from his faint painted lips).

## Tools made in this pilot

- `tools/meshy/face_moods_preview.py`: the nine mood faces from a fit's `F.png` in minutes, no Blender (`ALPHA=<mood>`
  writes the piece's alpha, change and masks). The picture can be clean while the game is not (the 3D pieces): the
  game at 1024 px is the judge.
- `game_shots.mts`: `SHOT_SIZE`, `SHOT_DIST`, `SHOT_UP` for face close-ups.
- `audit_villager.mts`: `oldmouth` (a painted mouth left under "o" and sad, lip-coloured, box from the 5th-95th
  percentile of the change) and `lookstill` (look moods that move nothing).
- `fit_person.ps1` face flags: `-FaceUV 2`, `-PieceSnap .001`, `-MouthFind`, `-LookSolid`, `-LidSoft` (and `FIT_HALF`).
  What each fixes and what was tried and dropped: `.claude/skills/meshy-characters/SKILL.md`, "Eyes, nose and mouth".

## Resume prompt (paste into the new chat)

> Bạn là chat phụ của Sparkle Valley (repo TPN). Tiếp tục pilot người làng vùng miền trên nhánh `meshy-regional-cloud`
> (không đụng `main`, không deploy, không đổi số phiên bản). Trả lời tôi bằng tiếng Việt, ngắn gọn; mọi câu hỏi dùng
> pop-up 2-4 lựa chọn, lựa chọn nên chọn đứng đầu. Commit và push nhánh mỗi giờ. Không gọi Meshy trả tiền nữa (đã dùng
> hết 270 credit). Đọc trước: `CLAUDE.md`, `.claude/skills/meshy-characters/SKILL.md` (phần "Eyes, nose and mouth"),
> `docs/meshy-regional-40-100/PILOT-1.md` và `docs/meshy-regional-40-100/HANDOFF-PILOT-1.md`, rồi làm theo "Next steps":
> fit lại 6 người, audit, chụp mặt cận cảnh 1024 px, tự soi từng mắt và mí (nhất là r045) trước khi hỏi tôi duyệt.
