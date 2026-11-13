# Meshy friends: handoff for the next chat

Updated 13 Nov 2026 AEDT. Paste the prompt below into a new chat if this one runs out of usage.

## Short prompt

```
Tiếp tục việc sửa lỗi 4 bạn Meshy (Finn, Sol, Clara, Lumi) trong game Sparkle Valley.
Thư mục D:\WorkSpace\sv-meshy-prod, nhánh meshy-production-20261107. Trả lời tiếng Việt, ngắn.
Đọc trước: CLAUDE.md, .claude/skills/meshy-characters/SKILL.md, docs/meshy-friends-handoff.md (phần "Where it stands" và "Next").
Việc trước mắt (13/11, 8 giờ 20): sửa mảng mi nhắm sáng hơn má (Sol, Lumi, Finn), răng ở mép tay áo Lumi,
rồi vòng soi 86 và "cổng" trước khi hỏi chủ approve (xem "Where it stands", "Gate" và "Next").
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

## Gate before asking the owner to approve (owner, 12 Nov 2026 evening AEDT)

Owner: villagers and animals mostly fail at the face, eyes, eye sockets and nose; too many approvals were asked while the face, neck and clothes still had faults, so look seriously and bring only the best version. Do not ask for approval until, for every friend:
1. The auditor (`audit.mts`) does not go back from the last round, and the face has 0 faults (eyes open, shut, half, sad, glancing, every mood; eye sockets seen at ±.4 and ±.7, both sides, from above and below; nose; neck and collar; sleeve and trouser hems).
2. A standard sheet at 1024 px, every picture looked at full size: face front, ±.4, ±.7, both sides, from above and below, every mood, neck and nape, back of the head, whole child in the poses.
3. A second reviewer who does not know what was fixed: a subagent given only the sheets' paths and the checklist, looking at full size and listing faults. Each fault it finds is fixed or written down with why it is not one.
4. Every fault the owner ever circled (this file and SKILL.md) is checked again, one by one, on the new pictures.
5. Only when 1 to 4 are clean: ask once for all four friends, with the sheets and a list of what was fixed and what is left. Otherwise keep working, do not ask.
The auditor branch (meshy-audit-coverage) is adding a mouth check, then eye sockets, nose and neck.

## Where it stands

**13 Nov 2026 (AEDT), about 8:20 am.** Nothing of this chat is running. Models committed at 269e98787.

- Face audit (auditor branch meshy-audit-coverage a39af972a, copied as `tools/meshy/audit-cov.mts`, not committed; `cd tests; node ../tools/meshy/audit-cov.mts <out> <id> poses:face,pics` against this branch's server 8765):
  - Sol: eyes 0, lid 0, mouth 0, face 0 (`D:\WorkSpace\meshy\fitted\f9-sol`).
  - Finn: eyes 0, lid 0, mouth 0; face 5 cases at -0.7/-1.2 (worst 73 px): a few specks at the hair's edge by the ear (`f8-finn`).
  - Clara: eyes 0, lid 0, face 0; mouth 4 cases at three-quarters (worst 75 px) while the mouths look right (`f9-clara`).
  - Lumi: eyes 0, lid 0; mouth 5 cases at ±0.7, labelled by the auditor "a mood piece edge over the cheek" (`f8-lumi`): real, see the next point.
- (fixed 13 Nov, about 1 pm AEDT) **Closed eyes were tall flat ovals over the blush** (Sol, Lumi, Finn): the lid in `lid()` now ends along the eye's own lower curve, column by column (`_em`: eye, grey or far-from-skin pixels in `_far`). Models a8645de07. Face audit after it: eyes 0 for all four; lid at most 19 px (Clara, small grey or pale specks at the lash ends, inner corners), Sol 10; Lumi's lid edge on the cheek 262 -> 21 px; Finn face 62 px at -1.2 (hair edge by the ear). Tried and dropped: the shader's eye core reaching half again lower (Clara's lid 13 -> 44, reverted).
- Mouths (fit_people.py): the lips are found as a line; the old mouth is wiped by `erase_mouth()` (its own filler), over a box wider and taller than the line; the mouth piece covers all of it and nothing in it counts as hair (Clara's red lips are hair-coloured); the reduced face layer is put back on the face 4.5 mm in front (Clara's sculpted lips came through). The o mouth is dark wine red: **owner decided 13 Nov 2026 (AEDT): keep it wine red.**
- Closed eyes in the game (js/friend-model.ts): excited shuts the painted eye; inside the eye's core every texel is lid, marked or not, only blush stays; shut texels are replaced outright.
- Ragged hems: cause 1 fixed (limb points within 2 cm inside a limb cut are not painted in the cloth colour; Sol clean in `arms` close-ups). Cause 2 open (Lumi most):
  cream teeth hanging from the sleeve over the arm (`D:\WorkSpace\meshy\fitted\arms-3\lumi-idle-armR-front.png`) and a torn look round a raised arm. Ruled out (13 Nov, each tried in game close-ups and reverted): painting the kit past a hem in skin colour; pushing the hem and its next ring out from the limb's own axis instead of the nearest body point's normal. Next: render Lumi's top-short alone in Blender near the hem, posed as in `idle`, to see whether the teeth are in the garment's shape or come from the game's skinning.
- **Round 86 (13 Nov 2026, 4 pm AEDT): 575 of 2576 failing** (85: 561), `D:\WorkSpace\meshy\fitted\audit-f86`. kit 208 (206), poke 210 (174), rag 220 (245), **bite 21 (2)**, tear 14, hole 2. The new bites are Sol sitting in trousers (everyday, festival, rain; feetleft/feetright 298 to 483 px): a wedge left empty beside the back of the shirt. Not the 2 cm hem rule: Sol dressed without it (`CL_HEM_IN=-10`, a test switch, not committed) had the same bites. Likely one of the 12 Nov make_clothes.py changes, which before round 85 only Lumi was dressed with (hems 6/3 mm off the body, weights trimmed to 4 bones, no 6 mm open-edge exception). Next: the same A/B on each of those, Sol `poses:sit`.
- **Round 87 (13 Nov 2026, 8 pm AEDT): 571 of 2576 failing** (86: 575, 85: 561), `D:\WorkSpace\meshy\fitted\audit-f87`, all four redressed with the 4-bone trim off (make_clothes.py step 5, b22948563): kit 214 (85: 206), poke 187 (174), rag 233 (245), bite 8 (2), tear 22 (14), hole 2, eyes 0, skin and hair tone 0. Still 10 over round 85: compare part by part (`cases.json`) to find which friend and kind grew (bites: Sol sitting, 6 small cases left; tears grew).
- The 1024 px sheets and the second reviewer are not done. The approval gate applies: do not ask the owner yet.
- Blender crashes on about one fit in three on the shared machine (`EXCEPTION_ACCESS_VIOLATION`); retry: `powershell -File tools/meshy/refit_friends.ps1 clara sol finn lumi` tries each fit three times and installs both sizes.

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

(13 Nov, 8:20 am) Next, in order: the lighter closed-eye ovals over the blush (see above); Lumi's sleeve teeth (cause 2); round 86 (all four, parts a minute apart, then `audit.mts <out> merge`, compare with 85: 561); the standard 1024 px sheets and a second-reviewer subagent; only then ask the owner, once, for all four.

Old list (12 Nov):

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
