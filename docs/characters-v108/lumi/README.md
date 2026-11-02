# Lumi, the star gardener (Blender model)

Owner, 2 Nov 2026 AEDT: sent `owner-concept.png` (Lumi, star gardener: leaf hair, overalls, satchel, star lantern) and asked for characters "giống 90% như vầy", built in Blender ("Blender ngay"). The owner then chose Finn and Flora's proportions for every character (`docs/cores/release.md`, 2 Nov). On 3 Nov the image-to-3D route was parked; Lumi stays Blender renders only, nothing in the game.

- The model is made by script, so every change can be repeated: `tools/blender/lumi.py` (shared helpers in `tools/blender/svkit.py`). Blender 4.2 LTS runs headless:
  - `blender -b -P tools/blender/lumi.py -- <out dir> chibi render faces` for the chibi Lumi of the concept;
  - `blender -b -P tools/blender/lumi.py -- <out dir> tall render faces` for Lumi in Finn and Flora's proportions (about 5 heads tall);
  - `blender -b -P tools/blender/lumi.py -- <out dir> <lumi|finn|flora> game render faces anim glb` for the friends at the game's size, with the skeleton, the moves and a `.glb` for the game (the current look, owner, 3 Nov);
  - add `quick` for small, fast test pictures; `python3 tools/blender/lumi-sheet.py <out dir> sheet.png [lumi finn flora] --style game` puts them on one page beside the concepts.
- The pictures are Cycles renders, not the game.

## Try 4 (v1.08, part A, 3 Nov 2026 AEDT)

- `try4-chibi-*.png`: the chibi Lumi the owner preferred (front, three-quarter, side, back, face-happy, face-curious, face-surprised), before the eyes were made smaller. The tall version stays in the script (`tall`); it was not chosen.
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

## Try 5: the game's size, a skeleton and moves (v1.08, 3 Nov 2026 AEDT)

The owner, 3 Nov: "I prefer the shorter chibi version but make the face more balance as the eyes are too big, you can try finn flora theo tỷ lệ này", then "Make sure them all can express emotions, đi uyển chuyển và movement tất cả mọi thứ phải như thật và bằng với kích thước người của những nhân vật khác trong game. Ráng làm cho chỉn chu thêm hơn nữa là mặt bớt tròn và mắt bớt to cho ba con". Pop-up answer: "Blender + file first": models, moves and a `.glb` now; loading them in the game is for Release or a later round.

- Size: the game's people (`js/avatar.ts`): about 1.6 tall, hips 0.6, knees about 0.33, shoulders (0.2, 0.97) (style `game`). The head is a little smaller than the game's (radius 0.235, centre 1.3), so about 3.3 heads tall (owner, 3 Nov: "mặt nhỏ hơn một xíu").
- Faces: less round than the chibi, cuter: eyes a little lower and wider apart (0.185 of the smaller head; the chibi had 0.27 of a bigger head), a soft jaw, rosy cheeks, a smaller mouth.
- Lumi, Finn and Flora share one body and face kit; each has their own hair, clothes and prop (Lumi the star lantern, Finn the glowing compass star and spyglass, Flora the flower staff).
- Six expressions, each its own face set: smile, blink, happy, curious, surprised, sad (the game's own moods are smile, blink, happy and "o").
- Skeleton with the game's joint names: `root > torso > head, armL > elbowL, armR > elbowR; root > legL > kneeL, legR > kneeR` (L is the friend's own left). Skin weights are made by the script (`tools/blender/lumi-rig.py`): the head, hair and faces move with `head`, the clothes on the body with `torso`, sleeves and boots with their own arm and leg, the hand props with `elbowL`.
- Moves, smooth and looping, like the game's own poses: `walk` (legs swing from the hip, the knee bends as the leg comes forward, arms swing against the legs, a small bob and twist), `idle` (breathing, the head looks around), `wave`, `cheer` (a jump with both arms up).
- `<who>-game.glb` (about 3 to 4 MB each): one skinned mesh for the body, one for the hair and one per face set, the four moves as animations, plain colours. A game shows one face set at a time. About 35k triangles for the body, 20k for the hair, 15k for a face: still heavy next to the game's own people, so a lighter version is one of the next steps.
- Pictures: `try5-<who>-front/three-quarter/side/back.png`, `try5-<who>-face-<mood>.png`, films `try5-<who>-walk/wave/cheer.gif`, and `try5-sheet.png`.
- Still to do: load the `.glb` in the game (Release or a later round), a lighter version for phones, hand poses for the moods.

## Try 6: Sol, the wardrobe and the villagers (v1.08, 3 Nov 2026 AEDT)

The owner, 3 Nov: "Làm thêm 1 bạn nam để đủ 2 cặp nam nữ, nhớ thiết kế thêm các phụ kiện liên quan như quần áo mũ nón giày dép etc các kiểu, và cho tôi biết dân làng sẽ nhìn như thế nào?"

- **Sol**, the fourth friend, from the owner's own concept (`concept-sol.png`): copper curls, amber eyes, a cream tunic with a felt sun, a honey cape with a brass clasp and a sun on the back, dark baggy trousers, strapped boots, a satchel, and a glowing sun crystal in a ring of rays over the left hand. Two pairs: Finn and Flora, Sol and Lumi. Run: `lumi.py -- <dir> sol game ...`.
- **The wardrobe** (`tools/blender/lumi-more.py`), for any friend or villager: `wear=hat:<straw|nonla|cap|beanie|crown>+shoes:<sandals|sneakers|rainboots>+scarf:<colour>`.
  - Hats: a straw sun hat with a ribbon, the nón lá (conical leaf hat) with a chin strap, a soft cap with a peak and a felt star, a knitted beanie with a pompom, a flower crown.
  - Shoes: sandals (toes showing), sneakers (white sole, a red stripe, laces), glossy yellow rain boots. They replace the friend's boots.
  - A knitted scarf in any colour.
  - Hats move with the head, shoes with the legs, so they all work with the skeleton and the moves.
- **Villagers** (`lumi.py -- <dir> villager role=<name> game ...`): the same kit and the same faces as the friends, in everyday Vietnamese village clothes, at the heights the game's rule WORLD-011 asks for (children 1.6, grown-ups 2.0, grandparents 1.8). The game today builds every person at about 1.6; using these heights is a game change for Release.
  - `farmer`: nón lá, a brown áo bà ba, dark trousers, sandals, a basket of greens.
  - `vendor`: hair in a bun, a pink áo bà ba, a white apron, sandals.
  - `grandma`: grey bun, round glasses, a purple áo bà ba, sandals.
  - `grandpa`: grey hair round the sides, a white moustache, a straw hat, a cream áo bà ba, a cane.
  - `kidboy`: a red cap, a blue T-shirt, shorts, sneakers. `kidgirl`: a bob with a flower clip, a yellow T-shirt, a pink skirt, sneakers.
  - Grown-ups have smaller eyes and a longer face than the children, so the friends still stand out as the cutest.
- `lineup` renders everyone with the same camera, so heights compare side by side: `try6-lineup.png` (villagers and friends) and `try6-wardrobe.png` (friends in different hats and shoes).
