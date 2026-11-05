# v1.08e faces: friendly, living faces for the four friends and the villagers

Read first: `README.md` (this folder), `docs/cores/tasks/v108b/README.md`, `CLAUDE.md`, `js/friend-model.ts`, `js/avatar.ts`, `docs/characters-v108/README.md`.

## What the owner asked (6 Nov 2026 AEDT)

"Tôi cũng để ý thấy các nhân vật mới và villages mặt nhìn đơ cứng, không có hồn, mắt mở trọn tròng, không nhắm mắt nhìn rất sợ" ("the new characters' and the villagers' faces look stiff and lifeless; the eyes are wide open all round and never close, which looks scary").

**Pop-up answer: soft eyes with lids.**
- The upper lid covers part of the eye, and little white shows.
- The iris is big, with two sparkles.
- The cheeks have a pink blush.
- The look is gentle and warm, like a picture book.

**Whatever the style:**
- they blink regularly;
- they look at the child;
- they smile;
- their faces change with their mood.

## What to build

1. **Look first.** Take close-up screenshots of:
   - Finn, Sol, Clara and Lumi (`js/friend-model.ts`, `models/<id>.glb`, face atlas `face-*`);
   - the villagers (the code builder in `js/avatar.ts`), near and far.

   Write in your status file why the eyes look wide open and never close:
   - Is the blink frame missing?
   - Is the mood not driven?
   - Is the lid missing in the drawing?
2. **Redraw the eyes and faces** in the soft-eyes-with-lids style:
   - **The four friends:** redraw their face atlas (every mood: smile, blink, happy, surprised, curious, excited, sad, shy) with the Blender scripts in `tools/blender/` (`lumi*.py`, `game-light.py`), and rebuild `models/*.glb` within their size budget (friendmodel check).
   - **The villagers:** the painted faces in `js/avatar.ts` get the same eye shape, lids and blush.
   - The friends and villagers must look like one family.
   - Photo faces stay as they are.
3. **Make the faces live:**
   - A blink every 2-6 seconds, sometimes twice: lids close and open over about 150 ms.
   - The eyes and head turn to the child when the child is near (villagers already turn their heads; add the eyes).
   - Small eye moves now and then.
   - A smile when the child is near, waves or wins; the "happy" curved eyes when cheering.
   - The mood follows the moment: surprised at a find, sad when a game is lost, shy when greeted.
   - Drive it all through the existing mood hook (`follow(mood)` in `js/friend-model.ts`) and the code builder's face code. No per-frame cost beyond a texture offset or swap (`perf`, `battery`).
4. **The 2D pictures** of the friends (`icons/friends/*-face.webp` and the others, the Welcome picker, the HUD) get the new eyes too, so the game matches everywhere.
5. **Films and stories** use the same faces: the lips work in `js/film.ts` stays.

## Checks

- **Yours:** add `faces` (`tests/faces.mts`, at the end of `tests/run.mts`):
  - each friend and a villager blinks within 7 s;
  - the lids close fully on the blink;
  - the face changes for happy, surprised and sad;
  - the eyes turn toward a child standing to one side.
- **Existing:** `friendmodel`, `friendoutfits`, `wearfit`, `frienditems`, `newfriends` (if present), `perf`, `battery`, `longplaymem`, `startup`, `boot`, `films` (sample), `types`.
- **Screenshots:** close-ups of each friend and three villagers, before and after, eyes open and mid-blink, on phone, tablet and computer, in `docs/world-models-v108e/faces/`.

## Status file

`docs/cores/tasks/v108e/faces.md`

## Part 2: high-detail friends and close-ups (owner, 6 Nov 2026 AEDT, pop-ups)

The owner said: "The characters and villagers need higher definition or some refinement: in the game they don't look much different from the current characters, but with hair."

**Pop-up answers:**
- High-detail friend and villager models.
- Closer in key moments.

1. **A high-detail version of each friend:** `models/<id>-hd.glb`, made with the Blender scripts in `tools/blender/`.
   - About 20-25k triangles.
   - One painted 1024 px texture: fabric patterns, felt and knit detail, seams, buttons, hair strands. Use KTX2/basis, or WebP if the loader cannot do KTX2.
   - A baked normal or AO map for the felt and fabric.
   - The new faces from Part 1.
   - About 0.6-0.9 MB each. Never in the first download (`startup`).
2. **When it is used:**
   - **The HD model:** only the child's own chosen friend, loaded after the start; other friends are not downloaded until a child switches. It is drawn when the camera is within about 15 m.
   - **Today's light model:** far away, for other children on the device, online friends, and as the fallback.
   - Add both to the offline list (`sw.ts`). The HD models go in the Wi-Fi pack only for the friends in use.
3. **The look, for every person:**
   - a soft rim light;
   - a thin outline (inverted hull, or the game's existing outline if there is one);
   - more toon bands, or a smooth ramp, so the shading has depth.

   Check `perf` and `battery` after each step.
4. **Closer in key moments.** The play camera stays where it is. The camera eases in, over about 0.5 s and back, when:
   - the child talks to a villager;
   - the child wins a game;
   - the child waves or cheers;
   - the Welcome screen and the friend picker are shown.

   No close-up during movement or in games.
5. **Checks:**
   - extend `faces`: the HD model loads for the chosen friend only, and the light model is used far away and when the HD one is blocked;
   - `friendmodel` (new budgets written in the check with the owner's decision), `perf`, `battery`, `longplaymem`, `startup`, `phone`.
   - Screenshots of each friend in play and in a close-up, before and after, on phone, tablet and computer.

The 11 named villagers are made by the "villagers" helper on the second account (`villagers-brief.md`). Share your eye style, lighting, outline and texture setup with them through the files on GitHub: `tools/blender/` and a short note in your status file.
