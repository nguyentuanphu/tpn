# Meshy friends: handoff for the next chat

Updated 11 Nov 2026 AEDT. Paste the prompt below into a new chat if this one runs out of usage.

## Short prompt

```
Tiếp tục việc sửa lỗi 4 bạn Meshy (Finn, Sol, Clara, Lumi) trong game Sparkle Valley.
Thư mục D:\WorkSpace\sv-meshy-prod, nhánh meshy-production-20261107. Trả lời tiếng Việt, ngắn.
Đọc trước: CLAUDE.md, .claude/skills/meshy-characters/SKILL.md, docs/meshy-friends-handoff.md (phần "Where it stands" và "Next").
Việc trước mắt: dựng lại quần áo Clara, Sol, Finn bằng make_clothes.py mới (dress_own.ps1, chỉ Lumi đã dựng),
chạy vòng soi đầy đủ 86, rồi tìm tiếp nguyên nhân mép tay áo/quần short răng cưa trong game (xem "Next").
Luật: không gọi Meshy / không tiêu credit; không merge main, không deploy, không tăng version; hỏi chủ bằng pop-up;
commit và push nhánh mỗi giờ (pull --no-rebase trước), không force-push; không commit content/management-catalogue.json;
xem ảnh lỗi cỡ thật; ghi bài học vào SKILL.md và cập nhật file handoff này.
```

## Cloud prompt (a chat on claude.ai/code, not on the owner's PC)

The cloud has only the GitHub branch: no `D:\WorkSpace\meshy` (Meshy sources, Blender work files, old audit pictures) and no Blender, so it cannot rebuild clothes (`make_clothes.py`, `make_character.ps1`). It can fix the game side (`js/friend-model.ts`: skinning, skirt bones, shader paint) and audit the committed models.

```
Repo tpn, nhánh meshy-production-20261107 (game Sparkle Valley). Trả lời tiếng Việt, ngắn.
Đọc trước: CLAUDE.md, .claude/skills/meshy-characters/SKILL.md, docs/meshy-friends-handoff.md.
Đây là máy cloud: không có D:\WorkSpace\meshy, không có Blender, nên không dựng lại quần áo;
chỉ sửa phía game (js/friend-model.ts) và soi các mô hình đã có trong nhánh.
Chuẩn bị: cd tests && npm ci && npx playwright install chromium;
chạy server: node tools/meshy/serve.mjs "$PWD" 8765 (để chạy nền); build: node tools/build.mts.
Soi nhanh: cd tests && node ../tools/meshy/audit.mts ../out-q clara poses:sit,everyday,pics
Soi đủ 4 bạn: node ../tools/meshy/audit.mts ../out-full clara,sol,finn,lumi (so với vòng 80: 577 lỗi trên 2576).
Bảng ảnh: python3 tools/meshy/review_sheet.py <thư mục có clara/ sol/ ...> <thư mục ra> (cần Pillow).
Việc: (chat trên máy của chủ làm váy ngồi; đừng sửa các dòng sit_ trong js/friend-model.ts) áo dài khi nhảy
lộ quần trắng có vệt sẫm ở vạt sau; rồi các lỗi khác trong "Still to look at". Xem ảnh lỗi cỡ thật.
Luật: không gọi Meshy, không tiêu credit; không merge main, không deploy, không tăng version;
hỏi chủ bằng pop-up; commit và push lên nhánh này mỗi giờ (pull --no-rebase trước), không force-push;
không commit content/management-catalogue.json (build tự sửa); ghi bài học vào SKILL.md và cập nhật file handoff.
Không đổi file models/*.glb (chỉ máy của chủ dựng lại được).
```

## Where it stands

**Hand-over, 12 Nov 2026 (AEDT), owner asked to stop and pass to another account.** Nothing is running.

- Last full round: 85, 561 of 2576 failing (`D:\WorkSpace\meshyittedudit-f85`), before the face refits. Round 86 not run yet.
- Faces (all four refitted, fit_people.py + js/friend-model.ts): closed/smiling eyes keep blush and freckles; no straight lines at Lumi's temples, no patch in Finn's fringe; Clara's far eye closes at three-quarters; glances fill with even white; light models' faces 256 px. Quick audit (rest): eyes 0, skin tone 0. Owner saw and circled the earlier version; the fixes for his circles are in, shots in `D:\WorkSpace\meshyittedaces-92`, `faces-93`.
- Two small fit changes made after the last refit are NOT yet applied to any model: the lid 2 px wider (faint rings round one closed eye of Sol and Lumi) and a larger light-model island margin (.012, the cracked far face). Refit all four (`fit_person.ps1`) to apply them, then look at the closed eyes of all four.
- make_clothes.py changes made today; **only Lumi is dressed with them** (Clara, Sol, Finn are on the 12 Nov morning dress):
  - body points that are not hair carry blue 1 (no dark slits through shirts), all four already dressed with this;
  - arm points past a garment's sleeve cut are never covered by it; no 6 mm open-edge exception in the body cover; hems and the next ring stand 6 and 3 mm off the body;
  - garment weights trimmed to 4 bones on their own side (tops had up to 8; glTF keeps 4).
  - Steps (3b) sleeve-on-arm weights and the helper exclusion for sleeves are switched off (`if False`): no effect.
- **Sleeve and shorts hems still ragged in the game** (skin-coloured teeth). Ruled out, each with game shots: helper bones (`HELP_T=0` and `1` in game_shots: no change), shoulder smoothing, sleeve weights, the body painted past the hem, the 6 mm cover rule, hem offset, the 4-bone limit. In Blender, posed with arms down (scratchpad `pose_render.py`: body red, chosen garments yellow), the hems are clean. `HIDE=body` in game_shots poses shows the clothes alone: the real short sleeves are short and their edge is jagged in the game.

## Next

1. `powershell -File tools/meshy/dress_own.ps1 -Id clara` (and sol, finn; lumi with `-LightTex 512`), copy `D:\WorkSpace\meshyitted\<id>-own\<id>-dressed-{light,hd}-packed.glb` to `models/<id>.glb`, `<id>-hd.glb`; or refit first (`fit_person.ps1 -Id <id>-swim -Ref 'D:\WorkSpace\meshy\work-v108\<id>-game-hd.glb' -Prefix <id>-`) to apply the two face changes. In Git Bash pass the Ref path in single quotes: double quotes lost the backslashes and every fit failed.
2. Round 86 (all four, parts one minute apart, rerun lost parts alone, then `audit.mts <out> merge`); compare with round 85.
3. Ragged hems: compare the garment's vertex positions after the game's skinning with Blender's for the same pose (dump `skinnedMesh` positions in the browser), or check gltfpack's quantisation of weights/positions (`-vp`/`-vt` bits) and the exporter's normalisation. Fix in code, then rebuild all four.
4. Send the owner the review sheets (scratchpad `sheet.py`, see round 83) and the closed-eye/glance shots.

- (12 Nov 2026) Owner's circles fixed: no straight lines at Lumi's temples, no patch in Finn's fringe, Clara's far eye closes at three-quarters; glances fill with even white (no grey block); light models' faces 256 px. All four refitted. Open: sleeve hems ragged (clean in Blender with arms down: look at the game side next), faint rings round one closed eye of Sol and Lumi.
- (12 Nov, 7 am AEDT) All four refitted with the final closed-eye rule (blush and freckles kept, no flat patch; faint rings remain on one eye of Sol and Lumi). Quick audit, rest pose: eyes 0, skin tone 0. Round 85 (561) was before the refits; next full round 86.
- (11 Nov, night) Owner: Lumi's face worse. Fixed: closed/smiling eyes keep blush and freckles; no dark slits through shirts; Lumi light model 512 px. All four refitted and redressed; round 85 (`audit-f85`) running. Open: sleeve hems ragged (skin teeth), Lumi's light face cracked close up. The half-turn helper is no longer on sleeve points (make_clothes.py step 3): it did not fix the sleeves; keep or drop by round 85.
- **Round 84 (11 Nov 2026, 7 pm AEDT): 575 of 2576 failing** (`audit-f84`; Clara 181, Sol 98, Finn 101, Lumi 195). New: the áo dài back panel no longer folds at the knee when jumping (js/friend-model.ts, `skirtB` takes half the shin), the light models have their limbs again. Most other changes from 83 are 1-pixel rag flicker. Next in the list below: Clara's rain coat hem at the back, the braid-tip blotch, the knee through leggings (now seen under a lifted skirt).
- (11 Nov, evening) Light models (far away) fixed: they had lost their forearms (and Lumi's knees, part of Finn's shin) in the body reduction; only the trunk is thinned now (make_clothes.py, `CL_BODY_REDUCE`). All four rebuilt and installed; widths match the -hd models. Not audited again yet (round 84).
- **Round 83 (11 Nov 2026, 5 pm AEDT): 576 of 2576 failing** (82: 578, 80: 577), `D:\WorkSpace\meshyittedudit-f83` (every case has its `-look` picture). Clara 186, Sol 96, Finn 102, Lumi 192. All four models rebuilt with: a top round the neck on the body's own weights, and a skirt's waistband top on the trunk. Review sheets sent to the owner: `D:\WorkSpace\meshyittedeview-f83` (made with the scratchpad `sheet.py`: `part-<id>/<id>-<kind>-<pose>-<view>-look.png`, 5 poses x tq/back, and feet/feetback).
- Seen in the round 83 sheets, worst first: (1) every friend's áo dài jumping, from behind: the back panel lifts and shows the white trousers with a dark stripe and a wedge (still the first thing to fix); (2) Clara's rain coat hem ragged at the back with the trousers showing through (jump, cheer back), and faint light streaks on the backs of tops (Clara's áo dài and coat); (3) a pale blotch at Clara's braid tips where they lie on the skirt or panel (walk, run, jump, cheer, three-quarter view); (4) Clara's festival leggings' knee through the skirt sitting; (5) seated skirts and áo dài backs hang to the ground behind the seat like a board (two tries failed: deeper tuck, shortening).

- Round 82 (11 Nov 2026 AEDT, `D:\WorkSpace\meshyittedudit-f82`): the round 80 code again (the kit lit-like-a-garment WIP and the seated skirt shortening are both dropped, see SKILL.md), plus Finn's collar on the body's own weights (make_clothes.py step 4, only Finn rebuilt so far). Clara 185 (81: 189), Sol 97 (96), Lumi 194 (195); Finn: see the round 82 note below.
- The kit lit like a garment (kf_) was tried and dropped: the body under the clothes is in the garment's shadow, so it showed darker patches (Clara quick test kit 11 -> 47 failing of 116).
- Round 81 (seated skirt back shortened): 594, dropped. Round 80 (kit paint .975): 577 of 2576.
- Clara's largest faults now: `bodice>skirt` when running (run2: 190 to 265 px, everyday and festival): the bodice shows over the skirt's top. Likely cause: the skirt's waistband takes 35% of the skirtF/skirtB bones (make_clothes.py, cone(), `sw = .35 + 2.2 t`), which turn round the hips' axis, so a forward thigh pulls the waistband's front backwards into the bodice. Try a smaller share at the very top (and the bodice's hem share to match), then audit Clara.

## How to run

- Test server: Node `serve.mjs` on port 8765 must be running (it serves `D:\WorkSpace\sv-meshy-prod`).
- Self-test after any auditor change: `powershell -File tools/meshy/audit_selftest.ps1` (all lines must say "caught").
- Full round: `powershell -File tools/meshy/make_character.ps1 -Batch clara,sol,finn,lumi -Kind friend -SkipFit -Out D:/WorkSpace/meshy/fitted/audit-fNN`. The machine is busy, so parts can time out: rerun them, then `cd tests; node ../tools/meshy/audit.mts <out> merge`.
- Quick look: `cd tests; node ../tools/meshy/audit.mts <out> sol poses:jump,everyday,pics`.
- Build the game after editing `js/*.ts`: `node tools/build.mts`.

## Still to look at

- `rag`: mostly 1 to 2 px outline specks.
- Finn's collar specks.
- Clara's trouser crotch gap when walking (áo dài walk2 feetright).
- (fixed in round 84) The áo dài back panel lifted in a jump shows a white stripe.
- Seated skirts still look box-like from behind.
- Review pictures and sheets for the owner (`poses:walk,run,sit,jump,cheer,pics`, sheets by the scratchpad `sheet.py`) have not been sent since round 76.

## Pets

The Meshy dog is on branch `meshy-pets` (64e518476), owner approved, not merged. Pet lessons are in that branch's copy of the skill.

## New task prompt: what the auditor does not check yet (no other chat on it, 11 Nov 2026)

```
Repo tpn (game Sparkle Valley). Trả lời tiếng Việt, ngắn. Tạo nhánh mới meshy-audit-coverage từ
origin/meshy-production-20261107 và chỉ làm trên nhánh đó.
Đọc trước: CLAUDE.md, .claude/skills/meshy-characters/SKILL.md (dòng "Not yet in the auditor"), docs/meshy-friends-handoff.md.
Việc: dạy máy soi (tools/meshy/audit.mts) xem thêm những thứ nó chưa xem, mỗi thứ một lần, theo thứ tự:
1) mô hình nhẹ nhìn xa (models/<id>.glb, không phải -hd), 2) ánh sáng chiều tối và ban đêm,
3) đồ cầm trên tay, 4) các mặt cảm xúc khác và miệng.
Mỗi thứ mới: thêm một lỗi cài sẵn vào tools/meshy/audit_selftest.ps1 và chứng minh máy bắt được
(chạy powershell -File tools/meshy/audit_selftest.ps1, mọi dòng phải "caught"); xem ảnh lỗi cỡ thật.
Chỉ sửa tools/meshy/audit.mts, audit_selftest.ps1 và SKILL.md; không sửa js/, models/ (chat khác đang sửa).
Lỗi thật tìm được thì ghi vào docs/meshy-friends-handoff.md, không tự sửa.
Chạy: server node tools/meshy/serve.mjs "<repo>" 8765 (nền); soi nhanh: cd tests && node ../tools/meshy/audit.mts <out> clara poses:walk,everyday,pics
Luật: không gọi Meshy, không tiêu credit; không merge main, không deploy, không tăng version; hỏi chủ bằng pop-up;
commit và push nhánh mình mỗi giờ (pull --no-rebase trước), không force-push; không commit content/management-catalogue.json.
```
