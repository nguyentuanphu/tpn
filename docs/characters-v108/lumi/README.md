# Lumi, the star gardener (Blender model)

Owner, 2 Nov 2026 AEDT: sent `owner-concept.png` (Lumi, star gardener: leaf hair, overalls, satchel, star lantern) and asked for characters "giống 90% như vầy", built in Blender ("Blender ngay").

- The model is made by script, so every change can be repeated: `tools/blender/lumi.py`. Blender 4.2 LTS runs headless in the Release machine. Run `blender -b -P tools/blender/lumi.py -- <out dir> render`.
- `try3-*.png` shows the third try: front, side, back, three-quarter and face. It is a Cycles render, not the game.
- Done so far: chibi proportions, leaf hair in overlapping rows over a cap, a sprout and a star clip, big green eyes with sparkles, blush, an open smile, overalls with leaf pockets, a satchel with a star, and boots.
- Still to do:
  - A fringe over the forehead.
  - A smaller forehead and fuller cheeks.
  - Rolled sleeves, socks showing and the lantern.
  - A skeleton for the game's animation, a lighter version for phones, and a glTF export.
  - Loading it in the game.
