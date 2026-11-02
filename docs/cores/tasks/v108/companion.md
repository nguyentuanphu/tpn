**ready for Release** (all parts done; the GitHub full suite was started on this branch, see Checks).

# v1.08 helper: companion (plan parts B and E)

Branch `work/v108-companion` from `origin/release/v1.08`. Started 3 Nov 2026, 7:54 am AEDT.

## Plan

**B. The coin goal chip for every child with a companion.**
- Cause for "Henry N" (no chip): the chip is hidden when `nextHat()` finds nothing (`js/kidplay.ts` refresh: `showGoal = goal() && !!x`). Hats are bought strictly in order (party, flower, nón lá, crown), and the crown is the last one, so a companion wearing the gold crown means all four hats are bought: no next hat, no chip. The Studio switch `saveGoal` is not the cause: it defaults on, and `G.keep('saveGoal')` keeps it on for any child who bought a hat (`js/custom.ts` TRACES.saveGoal). Henry's live save was not read from this chat (family data is not reachable here); the reading is from the code.
- Four new companion hats after the crown, each with its own drawing (`js/art/companion-hats.ts`, imported from `js/art.ts`) and its own 3D model (`buildHat` in `js/kidplay.ts`), English and Vietnamese names: Woolly beanie / Mũ len (100), Captain's hat / Mũ thuyền trưởng (120), Wizard hat / Mũ phù thủy (150), Lotus crown / Vương miện hoa sen (180).
- When every hat is bought the chip stays and reads "All hats! / Đủ mũ rồi!"; a tap says so aloud and opens the Companions tab.
- New check `companiongoal` (tests/checks/play.mts): no hat, some hats, all hats.

**E. The Companions tab ("Bạn đồng hành") in the pad, between Ba lô and Cửa hàng.**
- `js/ui/pad.ts`: new tab `pals`; the Pets & Buddy section leaves the Bag and becomes the tab: the companion (feed, the coin goal card with Buy), pets (adopt, name and care) and the companion hats (wear on whoever, buy the next one). The Bag keeps food, bought things, treasures, ingredients, clothes, gifts, kites, festival prizes and gliders.
- The Shop tab moves to right after the new tab.
- Checks updated: `bagpals` opens the new tab (phone, tablet, computer); `shop` expects Shop after the Companions tab; `kidplay` and the new `companiongoal`.

Shared files touched (small): `js/art.ts` (one import line), `js/ui/common.ts` (hat icons, tab name), `js/shop.ts` (hat icons), `js/tester.ts` (news "Go" for saveGoal/companionGrow opens the new tab), `js/kidplay.ts`, `js/ui/pad.ts`, `css/style.css`.

Voice: the new lines (all-hats line) recorded with Azure if the key is set; otherwise listed below.

## Progress

- B done: 4 new hats (`js/kidplay.ts` HATS and buildHat, drawings in `js/art/companion-hats.ts`), the chip stays for every child with a companion and reads "All hats! / Đủ mũ rồi!" when nothing is left (a tap says so and opens the Companions tab). Commit 7086775d.
- E done: the `pals` tab "Companions / Bạn đồng hành" between Backpack and Shop (`js/ui/pad.ts` drawPals; the help card is now shared by the Bag and the new tab, `helpCardFor`). Three sections: Your companion (tile, Feed, coin goal card), Pets (pets, adopt or pet yard), Hats for your friends. The Bag no longer holds them.
- Voice: the two new lines (the chip's all-hats line in `KID_LINES.allHats` and the tab's all-hats card line) recorded with Azure, 8 files (commit after 7086775d).
- `index.html` preload list updated for the new art file; `tests/ui-contract.json` re-recorded: the only change is the new `pals` tab (owner asked for this UI change).
- Tester news "Go" for saveGoal and companionGrow opens the new tab (`js/tester.ts`).

## Checks (3 Nov 2026 AEDT, local, Chromium at /opt/pw-browsers/chromium)

- companiongoal (new, `tests/companion-goal.mts`, listed at the end of `tests/run.mts`): pass, phone 390x844, tablet 820x1180, computer 1366x800.
- bagpals (updated to open the new tab; the jump-row part is gone because the tab has 3 sections and no jump row): pass, tester phone 430x517, phone, tablet, computer.
- shop (updated: Shop right after Companions, Companions right after Backpack): pass.
- kidplay, testernews, noemoji, arch, names, bilingual, rules, types: pass.
- contract: pass after `--update-contract` (only the `pals` tab added).
- preload: pass after `node tools/preload.mts`.
- emoji: fail, not from this branch: an emoji in `docs/plans/v108-owner-batch-20261103.md` (Release's plan file).
- unit: 2 fail, not from this branch: `Cannot find package 'pg'` in this container (Studio server tests 53 and 61).
- `suite.mts --changed` picked the full suite (.gitignore changed), so it was not run locally: `full-suite.yml` was started on `work/v108-companion` by workflow_dispatch.

Screenshots looked at: out/bagpals-tester-phone.png, out/bagpals-computer.png, out/companiongoal-phone.png, out/companiongoal-tablet.png.

## Open questions

- Henry's real save was not read (family data is not reachable from this chat). The cause is from the code: wearing the crown means all four old hats are bought. If his chip is still missing after v1.08, the next thing to check is the Studio `saveGoal` release rule.
- Hat names and prices (100, 120, 150, 180 coins) are this helper's choice: owner can change.
