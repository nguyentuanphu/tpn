# Meshy friends: handoff for the next chat

Updated 11 Nov 2026 AEDT. Paste the prompt below into a new chat if this one runs out of usage.

## Short prompt

```
Tiếp tục việc sửa lỗi 4 bạn Meshy (Finn, Sol, Clara, Lumi) trong game Sparkle Valley.
Thư mục D:\WorkSpace\sv-meshy-prod, nhánh meshy-production-20261107. Trả lời tiếng Việt, ngắn.
Đọc trước: CLAUDE.md, .claude/skills/meshy-characters/SKILL.md, docs/meshy-friends-handoff.md.
Luật: không gọi Meshy / không tiêu credit khi chưa hỏi; không merge main, không deploy, không tăng version;
hỏi bằng pop-up; không in hay commit MESHY_API_KEY; không upload meshy-jobs.sqlite3;
commit và push lên nhánh mỗi giờ, cập nhật file handoff này.
Việc: chạy vòng soi, xem ảnh lỗi cỡ thật, sửa lỗi nhìn thấy được, ghi bài học vào SKILL.md,
rồi gửi chủ ảnh trong game (bảng ảnh) kèm báo cáo ngắn.
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

## Found by the auditor's new checks (branch meshy-audit-coverage, 11 Nov 2026 AEDT; not fixed there)

- **Every light model (`models/<id>.glb`, drawn more than 15 m from a child's camera) has lost its arms.** The new `far` check (light model's outline against the high-detail model's, same pose and view) counts 1165 to 5310 px per front view, rest pose, everyday: Sol 2903, Clara 3429, Finn 1388, Lumi 5310. The arms below the sleeves are missing on all four (Finn: only the hands, his sleeves are long); Lumi also loses her knees between shorts and boots (feet view 19867 px), Finn part of one shin. It is in the files, not the drawing: Sol's light body is 0.57 m wide in the rest pose against 0.76 m for the high-detail one (x -0.25 to 0.32, lopsided). Pictures: `D:\WorkSpace\meshy\fitted\acov-far` (`*-light-rest-*-far.png`, missing parts magenta). Likely the light model's body reduction (`CL_BODY_REDUCE`, `tex_max.py`, `GH_TEX_MAX`) or its cover mark cut the arms. Rerun: `node ../tools/meshy/audit.mts <out> <id> poses:rest,everyday,light`.
- **At night the skin, face and hair keep their day brightness while the clothes darken** (new `glow` check, night pass, Sol everyday: 7392 px in the front view, every view over the limit). The clothes darken to about .74 of their day light (the garment paint is mostly emissive, `paint()` in js/friend-model.ts), the skin-tinted body, face pieces and hair not at all, so in the dark valley the child's face, arms and hair look lit from inside. Pictures: `D:\WorkSpace\meshy\fitted\acov-b2\sol-everyday@night-rest-front-glow.png` and `-look.png`. Whether the whole friend should darken more (the valley and Grandpa Owl darken far more) is for the owner; at least the skin and hair should darken with the clothes. Rerun: `poses:rest,everyday,night,pics`.
- Items in the hand: Sol's item follows the hand (grip 0 to 2 cm); no fault found.
- Self-test on this branch (11 Nov 2026 AEDT, commit cec29b26b): all 12 planted faults caught (the 7 old ones plus lightpoke, far, glow, grip, face).

## Still to look at

- `rag`: mostly 1 to 2 px outline specks.
- Finn's collar specks.
- Clara's trouser crotch gap when walking (áo dài walk2 feetright).
- The áo dài back panel lifted in a jump shows a white stripe.
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
