# Sol's eyes on a clean face UV (branch meshy-sol-eyes)

Prototype of a new way to make shut eyes for the Meshy characters, on one model: Sol (high-detail model `models/sol-hd.glb`).
Cut from `meshy-production-20261107` (9396d9408). Worktree `D:\WorkSpace\sv-meshy-sol-eyes`, server port 8797.

## Why

The old way laid flat "face pieces" (cards) in front of the face, cut from a front photo, and the shader repainted the eyes
under them. Cards never match the curved head at turned views: pale rims, flat patches, inner-corner arcs. See the brief
in the facekit hand-over (`D:\WorkSpace\sv-meshy-facekit\docs\meshy-facekit\HANDOFF.md`).

## The new way

1. **Clean face UV, baked once** (`tools/meshy/soleyes/bake.py`). The front of the head (the face to near the ears, chin
   to hairline) of the skin mesh (`cloth-body` and `skin-tex` primitives, both on Meshy's 2048 atlas) gets one island in a
   cylindrical projection about the head's vertical axis (radius .2 m, +-1.2 rad, y 1.14 to 1.52 m, 1024 x 811 px, about
   2.1 px/mm; Meshy's atlas is about 1 px/mm here). Only the outermost surface is taken (a z-buffer on the radius), and
   only triangles with every corner inside the picture. The colour is copied texel by texel through each triangle's own
   barycentric coordinates from the original UVs: exact, no ray casting, no misses. Output `face-bake.png`: a portrait.
   (Pure numpy in Blender's bundled Python, not a Blender bake: same result, no ray misses, and the game model's
   attributes stay untouched.)
2. **Eye-free skin, made once** (`eyes.py`). Each eye = everything not skin connected to its white (white, iris, pupil,
   lashes, outline), its holes, its pale halo, stray lash flicks and the faint lid crease above it. The hole is rounded off
   (a ragged hole showed as a ragged pale shape), filled by a coarse-to-fine Laplace fill from the skin round it, plus the
   skin's measured grain, and faded into the painted skin over the hole's outer part. Output `face-noeyes.png`.
   LaMa was not used: there is no pyenv on this PC, and torch is a multi-GB install (the owner wants the PC light);
   the Laplace fill already gives clean closed-eye skin on this painted face.
3. **Moods drawn on that picture** (`eyes.py`, `mood-<k>.png`):
   - smile, sad, surprised (o): the eyes as painted;
   - lookL, lookR: inside the eye's opening (white and iris inside the painted outline, filled row and column) the iris
     slides by .16 of the eye's width, the rest takes the white's own shade per row;
   - blink: lash arc U (as the old pieces: y .62, bend .16), happy and excited: ^ (y .70, bend -.32), on the eye-free skin;
     dark brown (.20, .11, .07), 4.1 mm half-width like the old pieces;
   - half: the upper lid (eye-free skin) down to the middle of the opening, its edge a lash line.
   - mouths: unchanged, still the old pieces (their eye part made see-through, `old-pieces-mouth.png`).
4. **Game model** (`build.py`, then `pack.ps1`). The baked triangles leave the body and become one mesh per mood
   (`sol-face-<mood>`, material `face-<mood>`), all sharing the same corners (position, normal, skin mark colour, joints,
   weights) and each with its own UVs into one 2048 mood atlas (3 x 3 tiles of 682, 8 px gutters, jpg). js/friend-model.ts
   already shows the meshes whose material is `face-<mood>` for the mood, so **no game code changed**. The materials carry
   `skin_mark` (so they get the same skinTint shader as the body, drawn exactly like it) and no `skin_ref` / `own_face`.
   The old eye pieces (smile, blink, half, happy, lookL, lookR) are removed; surprised, sad, excited keep their mouths.
   **The flag**: the body materials lose `eye_boxes` (and get `face_uv: "soleyes"`): the shader's old eye repaint
   (skinTint, uEyeA/uEyeB, uShut) then never fires on this model. Every other model keeps its eye_boxes, its pieces and
   the old path.

## Commands (every heavy job through heavy.ps1)

```
PY='C:\Users\nguye\tools\blender-4.2.23-windows-x64\4.2\python\bin\python.exe'
SRC='D:\WorkSpace\meshy\fitted\sol-own\sol-dressed-hd.glb'   # the dressed, unpacked HD model behind models/sol-hd.glb
D='D:\WorkSpace\meshy\fitted\soleyes-bake'
powershell -NoProfile -Command "& 'D:\WorkSpace\meshy\tools\heavy.ps1' '$PY' 'tools\meshy\soleyes\bake.py' '$SRC' '$D'"
powershell -NoProfile -Command "& 'D:\WorkSpace\meshy\tools\heavy.ps1' '$PY' 'tools\meshy\soleyes\eyes.py' '$D'"
powershell -NoProfile -Command "& 'D:\WorkSpace\meshy\tools\heavy.ps1' '$PY' 'tools\meshy\soleyes\build.py' '$SRC' '$D' '$D\sol-hd-faceuv.glb'"
powershell -NoProfile -Command "& 'D:\WorkSpace\meshy\tools\heavy.ps1' powershell -NoProfile -File tools\meshy\soleyes\pack.ps1 '$D\sol-hd-faceuv.glb' '$D\sol-hd-faceuv-packed.glb'"
copy $D\sol-hd-faceuv-packed.glb models\sol-hd.glb
node tools/build.mts                       # the .js beside each .ts (never committed)
node tools/meshy/serve.mjs D:\WorkSpace\sv-meshy-sol-eyes 8797    (background)
powershell -NoProfile -Command "& 'D:\WorkSpace\meshy\tools\heavy.ps1' powershell -NoProfile -File tools\meshy\soleyes\shots.ps1 D:\WorkSpace\meshy\fitted\soleyes-shots-new new both"
powershell -NoProfile -Command "& 'D:\WorkSpace\meshy\tools\heavy.ps1' powershell -NoProfile -File tools\meshy\soleyes\shots.ps1 D:\WorkSpace\meshy\fitted\soleyes-shots-old old both"
$PY tools\meshy\soleyes\sheets.py D:\WorkSpace\meshy\fitted\soleyes-shots-old D:\WorkSpace\meshy\fitted\soleyes-shots-new D:\WorkSpace\meshy\fitted\soleyes-sheets
```

`shots.mts`: `old` answers `models/sol-hd.glb` with the production model (`OLD_GLB`, default
`D:\WorkSpace\meshy\fitted\sol-own\sol-dressed-hd-packed.glb`), same game code. `device`: the game's own camera on a
phone 390x844, tablet 820x1180, computer 1280x800 (the sizes of tests/festival-models.mts), Sol where the child stands,
turned to the camera by yaw 0, +-.4, +-.7, every mood; the head cut out at its real pixels. `close`: 1024 px head
close-ups, every mood, yaw -1.2 .. 1.2.

## Traps

- heavy.ps1 takes PowerShell's common parameters: any `-i`, `-o`, `-Out` after it is ambiguous or swallowed. Call scripts
  with positional arguments only (that is why `pack.ps1` and `shots.ps1` exist).
- A new worktree has no `tests/node_modules` and no built `.js`: a junction to `sv-meshy-prod\tests\node_modules` (not
  committed) and `node tools/build.mts`. build.mts touches `content/management-catalogue.json`: never commit it.
- Bash heredocs with long Python lines were cut short once (the rest of the command went into the file): check the tail.
- In game, at the play camera (about 9 to 11 m), Sol's head is only 17 px (phone) to 22 px (tablet) tall.
- A triangle with a corner outside the face picture would look into the next mood tile: bake.py keeps only triangles
  wholly inside.

## Results

(filled in below as rounds finish)
