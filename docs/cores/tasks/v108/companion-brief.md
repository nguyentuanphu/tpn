# v1.08 helper: companion

Branch: `work/v108-companion` (from `origin/release/v1.08`). Status file: `docs/cores/tasks/v108/companion.md`. Shared rules: `README.md` in this folder.

Plan parts B and E.
- B. The target chip (the coin goal chip, `js/kidplay.ts:96-130`) shows for every child with a companion.
  - The owner saw no chip for "Henry N", whose companion wears the gold crown and can buy hats. First find out why: probably every hat is bought (no next hat), or Studio's `saveGoal` switch is off.
  - When every hat is bought, the chip moves on to the next goal. Add 4 new companion hats, our own drawings, with English and Vietnamese names.
  - When nothing is left, it shows "Đủ mũ rồi! / All hats!" instead of hiding.
  - Add a check `companiongoal` for no hat, some hats and all hats.
- E. A new pad tab "Bạn đồng hành / Companions" between Ba lô and Cửa hàng (`js/ui/pad.ts`). It holds the companion (wear, feed, hats, coin goal), pets (adopt, feed, name) and companion hats. Ba lô keeps food, things bought, treasures, materials, clothes, kites and gliders.
- Check the tab on a phone, a tablet and a computer. Update the checks that open the Bag's pals section.
