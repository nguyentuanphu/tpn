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

## Checks

## Open questions
