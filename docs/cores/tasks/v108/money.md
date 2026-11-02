# v1.08 helper: money (status)

**ready for Release** (3 Nov 2026, 9:45 am AEDT). Full suite left for Release (Release, 3 Nov AEDT: helpers never start it).

Branch `work/v108-money` (from `origin/release/v1.08`). Brief: `money-brief.md`. Shared rules: `README.md`.

## Plan (3 Nov 2026 AEDT)

Eleven new money games in the Học tab's money area, each also linked into Học vui › Toán (CORNER_LINKS), in the child's
home currency (Australian dollars or Vietnamese đồng, the coins and notes already drawn by us in
`js/art/things-money.ts`), ages 4 to 9, levels Easy, Medium, Hard and Talent:

| id | Name (EN / VI) | What the child does | Age (GAME_INFO) | Place (map pin) |
|---|---|---|---|---|
| shoppay | Shop and Pay / Mua Hàng Trả Tiền | add up the basket (Medium on), then pay it exactly with coins | 3 | Cô Mai's market |
| givechange | Give Change: Count Up / Đếm Thêm Trả Tiền Thừa | the shopkeeper counts up from the price to the money paid | 4 | Cô Mai's market |
| toysave | Save for a Toy / Để Dành Mua Đồ Chơi | how many weeks of pocket money until the piggy bank has enough | 4 | my house |
| needsfirst | Needs before Wants / Cần Trước, Muốn Sau | buy every need first, then one treat that fits the money left | 3 | Cô Mai's market |
| pricesort | Price Tag Line-up / Xếp Thẻ Giá | tap the price tags from the cheapest to the dearest | 3 | Cô Mai's market |
| marketday | Market Day / Phiên Chợ | at the sạp, pay with the smallest note that is enough (Talent: and the change) | 4 | Cô Mai's market |
| coinsort | Coin Sort / Phân Loại Tiền | each coin or note into the jar with its picture (Talent: count a jar) | 3 | the family's market stall |
| makeamount | Make the Amount / Ghép Đủ Số Tiền | make an amount exactly; Hard and Talent with the fewest coins | 3 | the family's market stall |
| budgetpicnic | Budget a Picnic / Đi Dã Ngoại Tiết Kiệm | one thing from each group, keeping enough for the rest | 4 | Cô Mai's market |
| chores | Earn by Chores / Làm Việc Nhà Kiếm Tiền | pick chores whose pay makes the goal exactly (tap again to undo) | 4 | my house |
| twomoney | Two Homes Money / Tiền Hai Nhà | Australian or Vietnamese money; Hard and Talent: name the coin or note | 3 | Cô Mai's market |

Each game has: English and Vietnamese text and voice (recorded with Azure), its own drawing (`js/art/money3.ts`, keys
`mn3:*`, plus the stall `mn3:sap` and the purse `mn3:purse`), a How to play guide film of three steps, a place for the
map pin, touch targets of 64 px (72 px for under-5s), and an auto play plan.

Files (new): `js/games/money3.ts` (the games), `js/games/moneylogic3.ts` (the sums), `js/games/money3-meta.ts` (the
guides), `js/art/money3.ts` (the drawings), `tests/unit/money3.test.mts` (the sums' unit test).

Shared files, each one block marked `// (v1.08 money)`:
- `js/content/activities.ts` GAME_INFO: the eleven ids at the end of the list (area `money`).
- `js/games/catalog.ts`: GAME_CATALOG entries and the `money3.ts` loader at the end.
- `js/content/hocvui.ts`: `CORNER_LINKS.hv_math.push(...)` at the end of the file.
- `js/art.ts`: one import of `./art/money3.js` at the end.
- `js/games/registry.ts`: one import of `./money3-meta.js`.
- `js/main/talks.ts`: `MONEY3_SPOT`, the new games' places, read by `G.gameSpot` (one line changed).
- `js/content/unlocks.ts`: `OPEN_AT_ONCE`. Without it the new games would count as the money area's first set, so the
  money second set (already open for many children) would close again until the new games were won 3 times each. They
  open at once instead and are not among the first games the second set waits for. Other helpers adding games to an
  area with a second set (numbers, shapes, words, animals …) need the same: add their ids to this set.

Not in the plan: no per-game Studio money switch (`MONEY_GAMES`) for the new games; Studio's own game switch
(itemEnabled) can still hide each one.

## Progress

- 3 Nov 2026 AEDT: games, sums, drawings, guides, places and links written; unit test added.
- 3 Nov 2026 AEDT: new spoken lines recorded with Azure (382 files, en-AU and vi-VN, both voices); no line has a child's name.
- 3 Nov 2026 AEDT: fixes from the checks: a type note in Two Homes Money; Market Day's definition carries `origin: 'vn'` like its menu entry.

## Checks (3 Nov 2026 AEDT, local, one at a time)

`suite.mts --changed` picked the full suite (the build adds `/js/art/money3.js` to `.gitignore`, which no check names).
Under Release's rule of 3 Nov the full suite is left for Release; these checks covering the change ran with `--only`:

- pass: validate, noemoji, arch, names, bilingual, rules, boot, contract, phone (desktop, phone, tablet), hubmap, simple,
  playhub, games (248 games), levelsa, hocvui (52 links), secondset, voicecover (every line recorded), guides (248 games),
  levelsall (225 games differ at Easy, Medium, Hard and Talent), types, unit (505 tests, with root packages installed).
- fail, not this branch: emoji, for a 🎯 in `docs/plans/v108-owner-batch-20261103.md` (Release's plan file, same on
  `origin/release/v1.08`).
- Auto play (a scratch run, not a check): each of the 11 games won at under-5, Easy, Medium, Hard and Talent, in
  English (AUD) and Vietnamese (VND): 110 of 110, no page errors.

Commits: 42f914a0 (games), 83123406 (voices), then the check fixes (see the branch log).

## Open questions

None.
