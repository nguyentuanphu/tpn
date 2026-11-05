# v1.08e creatures: the animals, pets and companions in Blender

Made by `tools/blender/world-creatures.py` (run with `node tools/make-creatures.mts`), from the game's own shapes
(`tools/blender/creatures-spec.json`, read by `node tools/blender/creatures-dump.mts`), so each model stands where the
code shape stands, at its size, facing the same way. Status and checks: `docs/cores/tasks/v108e/creatures.md`.

Fourth pass (owner, 6 Nov 2026 AEDT, "everything still needs better refinement"): plush-toy proportions, rounded
shapes and soft joints, toes, hooves and tufts, knees that bend, heads that follow the child. `moves.png`: puppy, cow and
kitty walking, cheering and asleep. The *-face.png pictures show the puppy greeting the child in the game.

Second pass (owner, 6 Nov 2026 AEDT: "better refinement ... check the cows and buffaloes horns ... emotions, facial
expressions, movements, eye blinks"): smooth clean shapes instead of the melted felt; shaped horns; a face on every
creature (shiny eyes with highlights, brows, a mouth, rosy cheeks) and moods.

- `sheet-1.png`, `sheet-2.png`: all 24 in idle, the code shape (top row of each pair) and the Blender model (bottom row).
- `horns.png`: cow, bull, calf, buffalo and unicorn: the code's horns (top) and the shaped horns (bottom).
- `moods-1.png` to `moods-3.png`: every creature, left to right: idle, happy (eyes "^ ^", open smile), sad (head and ears
  down, frown, brows up in the middle), surprised (eyes wide, little "o" mouth), asleep (lying down, eyes shut).
- `computer-face.png`, `tablet-face.png`, `phone-face.png`: the child's puppy in the game's own scene and light, caught
  mid-blink, at each screen size.
- `computer-before.png` / `computer-after.png`, `tablet-*`, `phone-*`: Lotus Village's hens, the puppy and the baby
  dragon in the game, with the models blocked (before) and loaded (after). The phone's after view is behind a tree.
