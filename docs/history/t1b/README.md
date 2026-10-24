# T1b tidy streets: what r60 looks like (11 Oct AEDT)

Stage T1b of Round T (`docs/cores/ROUND-T.md`). Measured and looked at on r60 (main `bb99e134`) by the robot chat
(`claude/peaceful-hopper-un7oym`), 11 Oct AEDT. The plan was shown to the owner; **the owner has not said "go" yet**.

## How it was measured
- `measure.mjs`: opens the game and, for every kiosk, market seller and walking seller (`v_*`, `h_*` taps), writes the
  distance to the nearest road's edge, the nearest building and the nearest other seller (`r60.json`).
  Run: `cd tests && CHROMIUM=/opt/pw-browsers/chromium node ../docs/t1b/measure.mjs out/t1b.json`
- `sky.mjs`: renders a sky view (68 m wide, north up) of a place. Run: `cd tests && CHROMIUM=/opt/pw-browsers/chromium node ../docs/t1b/sky.mjs out/sky`
- The pictures of r60 are in `sky-r60/`.
- These measure the tap points, not the stall bodies; the real check in `js/validate.js` should measure the stalls'
  own solids (the boxes in `regions.js`, the kiosks' colliders in `cities.js`).

## What is wrong in r60
12 of 39 spots break the new rules; `validate.js` finds none of them (it only checks ROAD-004, "standing on a road").
- **Three Regions Market** (`market.png`): stalls on both sides of the walking street; three stalls alone in the grass (purple, pink, green).
- **Aussie Corner** (`aussie.png`): Mrs Kelly's tap point on the road (-0.4 m); the ice-cream van on the kerb (0.8 m from the road, 1 m from a building); two green kiosks on the grass behind the footpath.
- **Two Homes Street** (`town.png`): the two kiosks pushed against the brick building (2.5 and 2.8 m), 12 to 16 m from the street; the north footpath crowded in front of the houses.
- **Hà Nội, Bắc Ninh** (`hanoi.png`, `bacninh.png`): one kiosk on each side of the main street at the kerb (Bắc Ninh 0.9 m).
- **Lotus Village** (`village.png`): kiosks 0.3 m from the dirt road by the market gate.
- **China, India** (`china.png`, `india.png`): kiosks 1.3 m from the road, one each side of the gate street.

Cause (unchanged since r56): T1 widened roads to 6.4 m but `vendors.js` (±5.6 m), `cities.js` kiosks (u ±4.6, both
sides), `cities.js` `streetSpot` (2.2 m from houses, 1.6 m from the road, falls back to the street's centre) and
`hawkers.js` routes (+2.6 m) kept fixed offsets from the road's centre.

## The plan shown to the owner
1. **Rules first, shown failing on r60:** in `docs/ARCHITECTURE.md` §9 (then `node tools/rules-from-doc.mts`) and
   `js/validate.js`: every stall and kiosk 1.5 m or more from the road's edge and 3 m or more from any building; 1.2 m
   between neighbours; facing its street; one row on one side of the place's main street; none alone in a field;
   walking sellers on the footpath, never on a road or through a house.
2. **One market row per place** in `js/content/map.js`: street, side, start, gap; `rowSlot(place, i)` worked out from
   `ROAD_WIDTH`. `vendors.js`, `cities.js` (kiosks) and `hawkers.js` take their spots from it.
3. **Each place:** the market in one row on the north side, the strays joining it; Aussie Corner's shops in one row,
   the van in a parking spot, the kiosks in the row; Two Homes Street's kiosks in a clear row on the south footpath;
   cities, Lotus Village, China and India: kiosks on one side, set back from the kerb. Where a house blocks a row, the
   house moves back or the row moves to the square.
4. **Looked at:** sky views of every place before and after, phone, tablet and computer screenshots, the full suite;
   then the round report with the Netlify zip and the owner's "yes, deploy".
Files: `js/content/map.js`, `js/vendors.js`, `js/cities.js` (kiosks), `js/hawkers.js`, `js/validate.js`,
`docs/ARCHITECTURE.md`, `js/content/rules.js`, a new check in `tests/run.mjs`. No new spoken lines.

## Built (r61, 11 Oct AEDT, after the owner's "go")
The owner said "go" at about 5:25 pm AEDT, with the ice-cream van and Uncle Robbo's sausage sizzle joining Aussie
Corner's row.
- **Rules first:** STALL-001…004 in `docs/ARCHITECTURE.md` §9.5 (and `js/content/rules.js`), measured on each stall's own
  footprint in `js/validate.js` (`world.stalls`, `world.walks`, filled by the builders), new check `stalls`. On r60
  they found **97 problems** (`rules-r60.txt`; the r60 measurement above missed the market's trade stall, Music Corner
  and clothes shop, the three "alone in the grass", and the walking sellers). After: **0** (`stalls.mjs`).
- **One market row per place** in `js/content/map.js`: `STALL` (the distances), `MARKET_ROWS` (street, width, side,
  first slot, spacing; the cities' rows come from their main gate), `rowSlot(place, i, depth)` (1.5 m back from the
  street's edge, worked out from its width) and `walkPath(place)` (the footpath across the street from the row).
  `js/vendors.js`, `js/regions.js`, `js/cities.js` (kiosks), `js/hawkers.js`, `js/main.js` (trade stall),
  `js/learn.js` (Music Corner) and `js/shop.js` (clothes shop) take their spots from it.
- **Each place** (`sky-r61/`):
  - Three Regions Market: all 11 stalls in one row on the north side, north to south Vietnam from the gate; the game
    hosts (Bông, Bà Năm, the pots) on the south side; Chùa Một Cột's pond 3.5 m further back.
  - Aussie Corner: the row on the south footpath, facing the shops: the ice-cream van in its own paved bay, the vanilla
    slice kiosk, then past the crossing Uncle Robbo's sausage sizzle and the pavlova kiosk. The shopkeepers stay at their
    shop doors; their tap spots are on the footpath, no longer on the road.
  - Two Homes Street: the two kiosks on the south footpath east of the crossing, clear of the brick houses.
  - The cities: two kiosks on one side just inside the main gate (Bắc Ninh: the south side, clear of the Quan họ boat);
    the landmarks further back (u ±8.6, v −4) so the kiosks and the sellers' footpath keep 3 m from them.
  - Lotus Village: the kiosks on the north side of the lane in from the old gate. China, India: one side, just inside
    the gate.
  - Walking sellers: on the footpath across the street from each row (the market: the far half of its walking street).
- **Not changed:** Lotus Village's three umbrella stalls round its square (a market-day group, not street stalls), Mr.
  Bear's stall at Sunny Farm, and the villagers standing on Two Homes Street's north footpath.
- **Looked at:** sky views (`sky-r61/`) and phone, tablet and computer screenshots side by side (`shots-r61/`, made by
  `shots.mjs`). Full suite 97/98: `startup` red as on r60 (first download 1088 KB, the voice manifest; title 1.6 s; on
  the board for Voice & Audio and World).
