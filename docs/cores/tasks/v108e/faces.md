# v1.08e faces: status

Working (6 Nov 2026 AEDT). Branch `work/v108e-faces` (from `origin/integrate/v108`). Brief: `faces-brief.md`.

## 1. Why the faces looked stiff (looked first, 6 Nov 2026, 03:10 AEDT)

Close-ups before the change: `docs/world-models-v108e/faces/before-*.webp` (phone, tablet, computer; smile and blink,
happy, surprised and sad), made by `tests/faces-shots.mts`.

- **The lid was missing in the drawing.** Villagers (`drawFeatures` in `js/avatar.ts`) and the four friends
  (`face()` in `tools/blender/lumi.py`) both drew the eye as a whole white oval with the iris in the middle and only a
  thin line over the top, so white showed all round the iris: the "eyes open all round" stare.
- **The blink frame was there but short and hard.** Villagers and friends do blink (every 1.8 to 5.3 s, 130 ms, one
  closed frame); there was no half-closed frame, so it read as a flicker, and the films' actors and the Welcome
  pictures never blinked at all.
- **The mood was hardly driven.** Only smile, blink and happy (cheer, wave, dance) were ever shown in the valley; the
  drawn surprised, curious, sad and shy faces were never used, and the eyes never moved (only the head turned).
- **The friends' face meshes were thinned to 280 triangles** each, so their eye edges were faceted.

## 2. Villagers (done, commit below)

- `js/avatar.ts` `drawFeatures`: soft eyes with lids: an arched upper lid covers the top of each eye with a soft dark
  lash line and a flick at the outer corner, a big warm-brown iris with two sparkles, a faint lower line, pinker
  cheeks. Twelve moods on one 640 by 480 picture (4 by 3, 160 px each): smile, blink, happy, o, curious, sad, shy,
  half, lookL, lookR, excited, sleep. The sad brows tipped the wrong way before (they looked cross): fixed.
- `animate()`: a blink is half, closed, half (about 150 ms) every 2 to 5 s, now and then two; the eyes turn to a child
  standing to one side (as the head already did); a glance left or right now and then; `feel(A, mood, secs)` shows a
  feeling for a moment; excited while dancing.
- `js/film.ts`: the films' faces are drawn by the same `drawFeatures` (smile, happy, sad, o, sleep), and the actors
  blink when quiet; the lips work is unchanged.
- `js/friend-model.ts`: the new moods map to the friends' new faces (`face-half`, `face-lookL`, `face-lookR`); a model
  made before them shows its nearest face.

## Checks

(to come)

## Assumed (owner can change)

(none yet)
