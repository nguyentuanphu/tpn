# v1.08e faces: status

**ready for Release** (6 Nov 2026, 20:45 AEDT): round 2 (heads, shading, hair, clothes, section 6); before that (18:45 AEDT): Part 3 (sculpted faces) and Release's hair, clothes and hands faults are done too; before that (14:20 AEDT): Part 1 (faces), Part 2 (high-detail friends, the people's look,
close-ups), the villagers brief (`villagers.md`) and Release's clear in-game shots
(`docs/world-models-v108e/faces/game/`, 28 pictures at 2x, Pretty, phone and computer). Next: Part 3 (sculpted faces). Part 1 was merged into `integrate/v108` already.
Branch `work/v108e-faces` (from `origin/integrate/v108`). Brief: `faces-brief.md`.

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

## 3. The four friends (done)

- `tools/blender/lumi.py` `face()`: the same soft eyes with lids in Blender: the eye white, iris, highlights and pupil
  stop at an arched lid line (the decals are cut by `under()`), a dark lash line along the lid (heavier at the outer
  corner; girls keep three curled lashes, boys get one small flick), a bigger iris, two sparkles, pink cheeks for
  everyone. Three new faces: `half`, `lookL`, `lookR` (eleven in all). `game-light.py`: each face 420 triangles (was
  280, which made the eye edges faceted).
- `models/finn.glb`, `sol.glb`, `clara.glb`, `lumi.glb` rebuilt (`node tools/make-friends.mts`, Blender 4.2.9):
  107, 108, 109, 130 KB; 8,040 / 8,024 / 8,026 / 13,880 triangles shown (limits 9,000 and 14,500).
- `js/friend-view.ts`: the Welcome cards' turning friend blinks (half, closed, half).
- Moments: "Say hello" to a villager (`js/villagertalk.ts`): the villager smiles shyly, the child's friend is happy;
  a secret found (`js/secrets.ts`): the child's friend is surprised; cheering, waving: happy; dancing: excited.

## 4. Part 2: high-detail friends, the people's look, close-ups (done)

- **High-detail friends** (`tools/blender/game-hd.py`, `node tools/make-friends.mts hd`): made in the same Blender session
  as the full model, so the felt mottle, fabric folds, seams, buttons and hair locks of the full model (about a million
  triangles) are baked from it: each part is thinned (about 21,000 triangles shown), the parts share one 1024 px UV
  picture (the hair on its own strip, the clothes on the rest), and the colour and the soft shadow in the folds (AO) are
  baked into one JPEG inside the `.glb`. `models/finn-hd.glb` 497 KB, `sol-hd` 501, `clara-hd` 568, `lumi-hd` 554 (under
  the 0.6-0.9 MB the brief allowed). Skin stays a plain colour (the child's skin tone); the faces keep their colours in
  the corners.
- **When it is used** (`js/player.ts`, `js/avatar.ts` `showHD`): only the child's own friend, loaded after the light model
  (other friends are never downloaded); drawn when the camera is within 15 m, the light model farther away, for other
  children and when the HD one cannot load. `sw.ts`: the four HD models are in the offline list (Release asked), and a
  first load is also kept.
- **The look, every person** (`js/gfx.ts` `personLook`, `outlineSkinned`): a five-band soft ramp (the valley keeps its
  four), a soft warm rim light on the edges, and the thin ink outline on the friends' models too (bent by their bones;
  hidden far away like the code people's). One shader for every person, no new picture.
- **Close-ups** (`js/player.ts`): the camera eases in (about half a second each way, 45 % closer, a little higher) and
  turns to a three-quarter view of the face while the child cheers or wins (`cheerT`), waves (`emoteT`) or talks to a
  villager (`momentT`, set by "Say hello"); never while moving, riding, gliding or climbing. The Welcome card's friend
  eases in from the full figure to knees-up as the card is shown (`js/friend-view.ts`).
- **Release's notes (6 Nov):** the villagers' half-blink frame is now a flatter closing lid (it is only inside a blink);
  the crowd's hair has soft locks all round the sides and back (no longer a flat helmet).
- Shots: `docs/world-models-v108e/faces/after-play-*.webp` and `after-closeup-*.webp` (phone, tablet, computer: the
  friend in play, then in a close-up); `tests/faces-play-shots.mts`.

## 5. Part 3: sculpted 3D faces (6 Nov 2026 AEDT)

- **The head** (`tools/blender/lumi-face3d.py`, `sculpt_head`, run by `lumi.py` for every game model; `flatface` keeps
  the old painted shapes): the oval head is shaped into a real head: a brow ridge, eye sockets, a small nose with a
  bridge and nostril wings, round cheeks, a soft muzzle and chin, narrower temples and cupped ears; grandparents get
  softer, lower cheeks and smile lines, children rounder cheeks. The faces check measures it: depth about 7 % more than
  the width, height about 11 % more, the nose in front.
- **The face** (`face3d`): one mesh, about 2,600 triangles: two eyeballs set in the sockets (white, an iris darker above
  and lighter below, a pupil, two sparkles), upper and lower lids as shells round them that close (the upper one with a
  dark lash line, three lashes for girls, one for boys), brows on the brow ridge, rosy cheeks and a mouth with lips.
  Its 13 moods are shape keys (smile is the rest shape): blink, half, happy, curious, surprised, sad, shy, excited,
  lookL, lookR, open (talking), sleep. The game sets one key at a time from the existing mood and blink hooks
  (`js/friend-model.ts`, `follow()`): nothing else in the game changed. The painted face stays for the code people far
  away.
- **Release's faults (6 Nov), fixed in the export:** Clara's dark triangles were the ink outline poking out between the
  locks (no outline on hair now; locks face outward and are drawn both sides); Mai's black forehead band and strips were
  texels the bake missed (no picture any more: each face keeps its material's flat colour, times the light baked into
  its corners: the studio light for the villagers, the soft fold shadow for the friends and all hair); the áo dài is one
  smooth fitted top over wide panels (the fitted layer under it stopped at the hips and stood out as a box; it stops at
  the waist now), and under a loose áo bà ba or cardigan the trousers start under the hem; long hair hangs from the
  shoulders, so it no longer swings through the body when the head turns; the riding hands (`hands-grip`) are hidden
  again in the high-detail models (they showed as a dark band at the wrist); long sleeves are fuller.
- **Crowds:** the 14 gallery neighbours each have their own sculpted head (more than the brief's six shared heads, from
  the same script); a crowd model farther than 12 m gives way to the person beside the child (at most 3 within 25 m).
- Sizes: friends' light models 129-153 KB, high-detail 226-270 KB, villagers 247-309 KB (no picture inside any more).
- Shots: `docs/world-models-v108e/faces/heads/` (before and after, friends, villagers and crowd, smiling and mid-blink,
  phone and computer, 2x), `docs/world-models-v108e/faces/hair/` (Clara's and Mai's hair, before and after).

- **More of Release's notes (6 Nov):** the left palm was mirrored (its faces turned inward) and drawn dark on every person;
  the top's fitted layer ran past the cuff and showed as a dark band at the wrist (it ends inside the sleeve, sleeves open
  at the cuff); the films' character kit (`lumi.py ... rig`, `storypage.py`) keeps its face sets with half, lookL and
  lookR (only the game models, `glb`, get the sculpted face; the films do not drive its shape keys yet).
- **Checks (6 Nov 2026, 18:40 AEDT, one at a time, the final models):** `faces` pass (now with the sculpted face:
  lids close, eye white about 310 open, none closed; 8 mouth shapes; heads not spheres), `villagermodels` pass, `perf`
  pass (village 274 draws, 694k triangles), `battery` pass, `longplaymem` pass (it now counts the sculpted face's
  mood-key picture as in use, as it did the skeletons'), `friendmodel` pass (its limits raised by the brief's face
  budget: 12,000 and 17,500 triangles, one more part), `frienditems` pass. `suite --changed` would choose the full suite
  (shared files changed): left for Release's GitHub run.

## 6. Round 2: heads that read as heads (owner 6 Nov 2026 AEDT, via Release)

The owner saw the Part 3 shots: "from the front the heads still read as round balls with a face painted on".
- **Head shape** (`lumi-face3d.py` `sculpt_head`): the skull a little taller and narrower at the temples, the face plane
  flatter, then the features about twice as strong: a nose with a bridge and a tip that catch the light and a soft
  hollow under it, full cheeks that bulge past the jaw line, a defined chin and jaw, bigger ears turned out. The head (and
  ears) are now thinned on their own (2,600 triangles high-detail, 900 light) and joined to the body again, so the shape
  survives the thinning (before, the whole body shared one budget and the head lost its form).
- **Shading:** the skin's corners carry soft form shading, a key light from above-left (and the baked soft shadow or
  gallery light in the high-detail models); the game multiplies the child's skin tone by it (`skin-shade` material,
  `js/friend-model.ts`). The ink outline stays on the head's silhouette.
- **Hair** (`lumi-hair.py`, the villagers' sculpted locks): rounder, thicker locks with the edges rolled under (the
  friends' locks stay as approved), near-black hair lifted a little toward a warm brown so the locks show; Bác Ba's
  tufts are soft round tufts.
- **Clothes:** no cream collar on the villagers (the friends' collar); Bác Ba's áo bà ba up to the shoulders with wide
  trousers; a fitted top is never pulled in above the chest (the ledge). The other named villagers already wear their
  own (Tèo and Bờm a school shirt with a collar, Tí and Mít dresses, Jack a tee and shorts, Ruby a dress with a bow,
  Lan an áo dài, Bống a tee, shorts and bunny ears); their sleeves follow the body's arms, so they still share its soft
  shoulders (not changed this round).
- The back of the skull a little fuller too (a child's head is deeper than it is wide).
- **Checks (6 Nov 2026, 20:45 AEDT, one at a time, the final models):** `faces` pass, `villagermodels` pass, `perf` pass
  (village 271 draws, 691k triangles), `battery` pass, `longplaymem` pass (535 pictures held, 528 in use),
  `friendmodel` pass (light models about 10,300 triangles, Lumi 16,300), `frienditems` pass.
- Shots: `docs/world-models-v108e/faces/heads/` (`before-*` Part 2, `round1-*` Part 3, `after-*` this round, and
  `after-turn0.8-*` three-quarter views), `docs/world-models-v108e/faces/hair/after-full-*` (full length).

## The style, for the villagers helper (shared setup)

- Eyes: `face()` in `tools/blender/lumi.py` (the `op` lid heights per mood, `lidz()` the arch, `under()` cuts any decal
  at the lid). The painted 2D version for code-built people is `drawFeatures` in `js/avatar.ts` (`LID`).
- Moods every model needs (mesh collection and material `face-<mood>`): smile, blink, happy, curious, surprised, sad,
  shy, excited, half, lookL, lookR. `lookL` is the person's own left (the viewer's right).
- Texture: `tools/blender/game-hd.py` (budgets, the UV split, the colour + AO bake; villagers: 512 px, about 8,000
  triangles). Lighting and outline: `personLook` and `outlineSkinned` in `js/gfx.ts`, applied by `js/friend-model.ts` to
  any model it loads (friends and villagers).

- 2D pictures: `icons/friends/<id>-f, -q, -s, -face.webp` rendered again in Blender with the new eyes
  (`node tools/make-friend-pictures.mts`, Cycles, quick).
- Close-ups before and after: `docs/world-models-v108e/faces/` (`before-*`, `after-*`, phone, tablet, computer:
  smile, half, blink; happy, surprised, sad), made by `node tests/faces-shots.mts <folder> <tag>` (MOODS=, DEV=, HD=1).

## Checks (6 Nov 2026, 04:40 AEDT, one at a time, in this container)

| Check | Result |
|---|---|
| `faces` (new, end of `tests/run.mts`, `tests/faces.mts`) | pass: each friend and a villager blinks within 7 s (half, closed, half), the lids close fully, happy, surprised and sad show, the eyes turn to a child on either side, the villager's lid covers the eye's top |
| `friendmodel` | pass (107, 108, 109, 130 KB; 8,040 / 8,024 / 8,026 / 13,880 triangles in 6 parts, +5 outlines); now expects 11 faces, and counts the Part 2 outlines on their own (at most 6) |
| `frienditems` | pass (7 parts drawn with the item; outlines counted apart, as in `friendmodel`) |
| `newfriends`, `wearfit`, `friendoutfits`, `boot`, `types` | pass |
| `perf` | pass (home 165 draws, village 282 draws) |
| `battery` | pass (168/168 far people still) |
| `longplaymem` | pass |
| `startup` | pass (first start 1038 KB, within the check's 1025 KB + 3 %) |
| `films` | not run here (Release's suite; the film faces now use `drawFeatures`) |

## Final checks (6 Nov 2026, 07:35 AEDT, one run, in this container, the branch's last code)

`villagermodels`, `faces`, `friendmodel`, `frienditems`, `perf` (home 162 draws, village 302), `battery` (44/44 far
people still), `longplaymem`, `startup` (first start 1038 KB), `boot`, `types`, `films` (11 stories): all pass. Also
passed on this branch in earlier runs today: `offline`, `swupdate`, `village`, `areastream`, `dayplan`, `newfriends`,
`wearfit`, `friendoutfits`.

Checks changed (with the reason):
- `friendmodel`: 11 faces (was 8); the outlines of a model are counted on their own (at most 6), not as its parts.
- `frienditems`: the outlines are not counted as the model's parts (as in `friendmodel`).
- `longplaymem` (`tests/old-bugs.mts`): a skinned model's skeleton keeps its bone turns in a picture of its own, outside
  any material; it is now counted as in the valley with its model. Without this, the 62 "held" pictures were exactly
  those (the run without the villager models was clean).

## Owner's decisions

- 6 Nov 2026 AEDT (pop-up, in this chat): "Everything still need better refinement" → next is Part 2 (high-detail
  friends, rim light, outline and deeper shading for every person), then the 11 villagers.

## Assumed (owner can change)

- "Sad when a game is lost": the learning games never lose (the gentle rule: nothing lost, no timers), so no game end
  shows sad; `feel(A, 'sad')` is there for stories and any game that has a loss.
