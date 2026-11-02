# Lumi, the star gardener (Blender model)

Owner, 2 Nov 2026 AEDT: sent `owner-concept.png` (Lumi, star gardener: leaf hair, overalls, satchel, star lantern) and asked for characters "giống 90% như vầy", built in Blender ("Blender ngay"). The owner then chose Finn and Flora's proportions for every character (`docs/cores/release.md`, 2 Nov). On 3 Nov the image-to-3D route was parked; Lumi stays Blender renders only, nothing in the game.

- The model is made by script, so every change can be repeated: `tools/blender/lumi.py` (shared helpers in `tools/blender/svkit.py`). Blender 4.2 LTS runs headless:
  - `blender -b -P tools/blender/lumi.py -- <out dir> chibi render faces` for the chibi Lumi of the concept;
  - `blender -b -P tools/blender/lumi.py -- <out dir> tall render faces` for Lumi in Finn and Flora's proportions (about 5 heads tall);
  - add `quick` for small, fast test pictures; `python3 tools/blender/lumi-sheet.py <out dir> sheet.png` puts them on one page beside the concept.
- The pictures are Cycles renders, not the game.

## Try 4 (v1.08, part A, 3 Nov 2026 AEDT)

- `try4-sheet.png`: the concept, then both versions from four sides and with three faces.
- `try4-chibi-*.png`: front, three-quarter, side, back, face-happy, face-curious, face-surprised.
- `try4-tall-*.png`: the same for the tall Lumi.
- Changed since try 3:
  - A fringe of leaves over the forehead, the tips just above the brows, so the forehead looks small.
  - Fuller cheeks and a soft round chin (the head is shaped; the face parts sit on the real skin, found by casting rays).
  - Softer lashes (a brown lid line, heavier at the outer corner, two small lashes) and soft green brows.
  - Bigger, darker eyes with a lighter lower iris and two shines, as in the concept.
  - Rounder, puffier leaf hair in seven rows plus the fringe and side locks; a curling sprout; a puffy felt star clip with two leaves.
  - Puffed shirt sleeves with a rolled cuff; cream socks with a folded, ribbed top; rust boots with a folded cuff, a sole and a leaf.
  - The glowing star lantern in Lumi's left hand: brass ring, cap, ribs and base, a glass jar, a glowing star over a little sprout, a soft light and glow.
  - Leaf pockets on both hips and on the bib, a felt star on the bib, the satchel with a star and leaves.
  - The concept's palette (sage, cream, peach, honey yellow, rust) and a felt look on hair and clothes (soft sheen, fine fibres, a gentle mottle).
  - Three faces as separate sets: happy (closed smiling eyes, open smile), curious (looking up, one brow raised, small mouth), surprised (wide eyes, raised brows, a small "oh").
- Still to do (not in this round):
  - Hand poses for the faces (finger on the chin for curious, hands on the cheeks for surprised) and a walking pose.
  - A skeleton for the game's animation, a lighter version for phones, a glTF export and loading it in the game (parked by the owner, 3 Nov).
