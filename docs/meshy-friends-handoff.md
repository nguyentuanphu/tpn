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

## Where it stands

- Last full round pushed: round 78 (commit 50e9055e6), 636 of 2576 cases failing (77: 791, 76: 856, 75: 1029). Self-test passed (7 planted faults caught).
- Round 79 (kit paint 1.0): Sol and Finn jump armpits fixed but Clara got worse (139 to 226, her back views lighter than the dress); its Sol and Finn parts crashed. Round 80 runs with .975 into `D:WorkSpacemeshyittedudit-f80`; keep .975 only if the total beats round 78 (636), else go back to .95.

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
- The áo dài back panel lifted in a jump shows a white stripe.
- Seated skirts still look box-like from behind.
- Review pictures and sheets for the owner (`poses:walk,run,sit,jump,cheer,pics`, sheets by the scratchpad `sheet.py`) have not been sent since round 76.

## Pets

The Meshy dog is on branch `meshy-pets` (64e518476), owner approved, not merged. Pet lessons are in that branch's copy of the skill.
