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

## Progress

- 3 Nov 2026 AEDT: Blender 4.2.3 installed; plan written.
