# Helper brief C2: roads and the website script (replaces the parents brief)

The parents work (brief C) was also built by the quality helper on `work/v108b-quality`, which has all three parts with checks. **Stop the parents work.** Keep your branch `work/v108c-parents` as it is: Release compares the two and keeps one. Then do this brief, moved here from the quality helper so it has time for the five-screen fixes and the fly/drop-off audit.

**Branch:** `work/v108c-roads`, from `origin/integrate/v108`. Rules: `docs/cores/tasks/v108c/README.md`.

## Part 1 (one 5-hour window): Concept D roads (issue #34)
- **Redraw the roads and dirt roads** to the Concept D drawings in `docs/concept-d/` and `docs/roads-concept-d/`, in `js/roads.ts` and the road pieces it uses.
- **Keep everything that already uses the roads working:**
  - the road network and junctions;
  - traffic (`js/traffic.ts`);
  - buses and their stops;
  - the places on the map. Never move a place on the map.
- **Keep the speed limits:** `perf` (420 draws in the village, 490 at home), `battery`, `longplaymem`.
- **Checks:** `roads`, `solid`, `perf`, `battery`, `longplaymem`, `vehicles`, `traffic` (if present), `startup`.
- Screenshots of a village road, a city road and a dirt road on phone, tablet and computer, in `docs/roads-concept-d/after/`.

## Part 2: the website navigation script in TypeScript
- **The move:** the 10 KB inline navigation script in `home/index.html` is generated from string templates in `docs/website-review-20261023/navigation.mts`. Move it into `home/site.ts`, so it is type-checked and built like the rest. The generator then only keeps the HTML.
- **What stays the same for families:** the four main destinations, the topic pages, the menu, the language switch and the Quest Guide. Follow `docs/website-review-20261023/WEBSITE-RULES.md`.
- **Leave alone:** the 1 KB browser guard in `index.html` stays plain JavaScript, on purpose.
- **Checks:** `website`, `types`, and the website's own checks under `tests/` (`content-website-browser.mts` and the website set).
