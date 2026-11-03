# v1.08 helper: lumi (status)

Branch: `work/v108-lumi-refine` (from `origin/release/v1.08`). Brief: `lumi-brief.md`. Plan part A: Blender renders only, nothing in the game changes.

## Plan (3 Nov 2026 AEDT)

1. Install Blender 4.2 LTS (4.2.3) in `/opt` and run it headless.
2. Rewrite `tools/blender/lumi.py` so one script builds both versions:
   - `chibi`: the concept's chibi Lumi, refined;
   - `tall`: Lumi in Finn and Flora's proportions (about 5 heads tall, same head size and eye size as `finn.py`).
3. Refinements from the brief: a fringe of leaves over the forehead, a smaller forehead and fuller cheeks (the head is shaped, the face parts sit on the real surface), softer brown lashes and soft green brows, rolled sleeves, cream socks with a folded top, the glowing star lantern (brass, glass, a felt star that lights the scene), leaf pockets (hips and bib), the concept's palette (sage, cream, peach, honey yellow) and a felt look (soft sheen, fine fibres, gentle colour mottle).
4. Faces as separate sets: smile (body renders), happy, curious and surprised.
5. Add the shared helpers to `tools/blender/svkit.py` (felt, soft blush, glass, puffy star); `finn.py` keeps working.
6. Renders to `docs/characters-v108/lumi/`: front, side, back, three-quarter and the three faces for each version, and one sheet beside the concept.
7. Checks: nothing in the game changes, so `cd tests && node suite.mts --changed` (expected: quick checks only).

## Owner's decisions

- 3 Nov 2026 AEDT (chat): "I prefer the shorter chibi version but make the face more balance as the eyes are too big, you can try finn flora theo tỷ lệ này". The chibi is the chosen Lumi; the eyes were made smaller (eye size .27 to .21 of the head, a little closer together). Finn and Flora were tried as chibis with the same body and face kit (`lumi.py -- <dir> finn chibi`, `flora chibi`). The tall version stays in the script and the docs, but it is not the chosen look.

- 3 Nov 2026 AEDT (chat): "Make sure them all can express emotions, đi uyển chuyển và movement ... bằng với kích thước người của những nhân vật khác trong game", "mặt bớt tròn và mắt bớt to cho ba con". Built at the game's people size, with a skeleton using the game's joint names, six moods and walk, idle, wave, cheer.
- 3 Nov 2026 AEDT (pop-up): "Blender + file first (Recommended)": models, moves and a `.glb` now; loading them in the game is for Release or a later round.
- 3 Nov 2026 AEDT (chat): "Làm cho dễ thương hơn và mặt nhỏ hơn một xíu": a smaller head (radius .235) and a cuter face.
- 3 Nov 2026 AEDT (chat): "Làm thêm 1 bạn nam để đủ 2 cặp nam nữ ... phụ kiện ... dân làng sẽ nhìn như thế nào?": Sol added (boys Finn and Sol, girls Flora and Lumi), a wardrobe, villagers.
- 3 Nov 2026 AEDT (chat): "I am ok with new heights" (children 1.6, grown-ups 2.0, grandparents 1.8, rule WORLD-011); more accessories, boy and girl differences, villagers that look Vietnamese and Australian in everyday clothes, cuter friends. The heights in the game are a game change for Release.
- 3 Nov 2026 AEDT (chat and pop-ups): the shoulders looked stiff, "như 2 cái cây"; pop-ups chose a one-piece sculpted body, big soft sculpted locks for hair, and face A (a small oval). The owner then said the hair, face and body still looked wrong, and from three whole looks side by side chose: "số 1 vẫn đẹp nhất nhưng với medium head and soft face" (look 1, felt hair like the first Lumi, with a medium head and a soft face). This is now the default (`look=felt`); `look=now` and `look=toy` stay in the script.

## Progress

- 3 Nov 2026 AEDT: Blender 4.2.3 installed; plan written.
- 3 Nov 2026 AEDT: chibi and tall Lumi built and rendered (commit 1, scripts and notes).
- 3 Nov 2026 AEDT: the owner chose the chibi; eyes smaller; chibi Finn (navy messy hair, teal coat, cream trousers, strapped boots, satchel, spyglass, glowing compass star) and chibi Flora (pink wavy hair, two braids, flower clip, lilac dress with a petal hem, cream puff sleeves, sage tights, laced boots, flower staff) added to the same script.

## Checks

- Nothing in the game changed (only `tools/blender/` and docs).
- `cd tests && node suite.mts --changed --base origin/release/v1.08`: the build rewrites `content/management-catalogue.json` (already stale on `release/v1.08`, not from this branch), so `--changed` asks for the full suite. Per Release's rule (3 Nov), the full suite is left for Release; the 9 quick checks it would have picked were run with `--only`:
  - pass: arch, names, rules, bilingual, types, noemoji, preload, unit (497 unit tests, after `npm ci` at the root for `pg`).
  - fail, not this branch: emoji, an emoji in `docs/plans/v108-owner-batch-20261103.md` (Release's plan file). Left for Release.
- `finn.py` still builds with the extended `svkit.py`.
- The renders were looked at (front, three-quarter, side, back, three faces). These are pictures, not game screens, so the phone, tablet and computer check does not apply.
