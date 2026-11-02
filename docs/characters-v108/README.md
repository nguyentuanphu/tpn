# Characters with more life (v1.08)

Owner, 2 Nov 2026 AEDT: "bắt đầu làm nhân vật đẹp và có hồn và uyển chuyển hơn"; scope chosen by pop-up: "Làm hết, cả dáng người".

What changed (`js/avatar.ts`, with small changes in `js/gfx.ts`, `js/vehicles.ts`, `js/player.ts`, `js/main/hero-events.ts`):

- Body: knees and elbows. Each leg is a thigh and a shin, each arm an upper arm and a forearm, and the hands have a thumb. Each limb is still one shape, bent by two bones (a skinned shape), so a person costs no more draws than before (PERF-003).
- Movement:
  - Poses glide into each other instead of jumping: walk to stand, landing, waving.
  - Walking and running bend the knees and elbows and sway the hips. The head stays steady, and running leans forward with bigger swings.
  - Jumps stretch and landings squash, with the knees giving.
  - Standing: the chest breathes, the weight shifts from foot to foot, and the head looks round now and then.
  - Villagers close to the child turn their heads to look at them.
  - Ponytails and long hair swing.
- Face:
  - Bigger shining eyes: a warm brown iris, two sparkles and a small lash at the outer corner. Softer round blush.
  - Painted faces blink every few seconds, sometimes twice.
  - Faces smile with eyes curved like rainbows while cheering, waving or dancing.
  - Photo faces stay as they are.
- Riding: before the hands and feet are aimed at the handlebars and pedals, the knees and elbows straighten.

Pictures: `before-*.png` is v1.07, `after-*.png` is this branch. `a` and `b` are two moments of the same six children (standing, walking, running, jumping, cheering, waving), `face` is a close-up, and `after-cheer-wave.png` shows the happy faces. Each picture was made with `chars.html`.

Checks on the Release machine: `perf` passes (it failed at first with 434 draws when the knees were separate shapes, so they were joined into one bending shape), `battery` passes, and `startup` firstKB is 1056 (limit 1071). Its timings are over on this machine, as they are for v1.06 and v1.07. The full suite runs on GitHub.
