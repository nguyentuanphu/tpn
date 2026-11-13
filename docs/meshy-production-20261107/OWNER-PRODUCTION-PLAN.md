# Sparkle Valley × Meshy: one Pro month, 1,000 credits

Goal: make every character and creature we can in one month of Meshy Pro, with the reference pictures made first in
ChatGPT (free of Meshy credits), so Meshy credits go only on 3D models.

## 1. Credit budget (Meshy price list, checked 7 Nov 2026)

| Meshy operation | Credits |
|---|---|
| Image/Multi-image → 3D, **Meshy 7.1**, with 2K texture | **30** |
| Image/Multi-image → 3D, **Meshy 6 Lite**, with texture | **15** |
| Texture only (retexture) | 10 |
| Meshy rigging / animation | 5 / 3 per action (**not needed**: the game uses its own skeleton, we rig in Blender) |
| Meshy text-to-image | 3-9 (**not needed**: ChatGPT makes the pictures) |

Pro also gives **4 free retries per model** in the web app: if a result is wrong, retry instead of starting a new task.
Pro models are **private and ours** (no "made with Meshy" credit needed), downloads are unlimited, and the API works
(the repo's `tools/blender/make-3d.py` can then run batches).

**The split:** characters seen close up (friends, villagers, pets, companions) on Meshy 7.1; things seen from a
distance (farm and wild animals, the crowd) on Meshy 6 Lite. The game shrinks every model to 8,000-22,000 triangles
anyway, so Lite loses little for far-away things.

| Group | Count | Model | Credits |
|---|---|---|---|
| A. Friends (Clara again in 7.1, Finn, Sol, Lumi) | 4 | 7.1 | 120 |
| B. Named villagers | 11 | 7.1 | 330 |
| C. Pets | 6 | 7.1 | 180 |
| D. Companions | 2 | 7.1 | 60 |
| E. Farm animals | 6 | 6 Lite | 90 |
| F. Wild and fantasy animals | 10 | 6 Lite | 150 |
| G. Crowd neighbours (the 4 seen most) | 4 | 6 Lite | 60 |
| **Total** | **43** | | **990** |

The other 10 crowd neighbours: the next month, or keep their Blender models (they are only shown near a child).

**Order:** make *all* the ChatGPT pictures first and check them (send them to Claude: hands empty, full body, nothing
overlapping), then subscribe and run Meshy in one go, A → G. Start the month only when the pictures are ready.

## 2. Making the pictures in ChatGPT

**Use multi-view.** Meshy Pro takes up to 4 views of one character for the same 30 credits, and the back and sides
come out much better than from one front picture (our Clara's back of the head was a guess). So ask ChatGPT for a
**turnaround sheet**: front, side and back on one picture. Claude can crop each sheet into the separate views Meshy
wants.

**Keep the style the same for all 43.** In one ChatGPT chat, upload the young Clara picture
(`clara/clara-young-2.webp`) first and say it is the style reference. Then paste the STYLE block once, and for each
asset paste only its line from section 3.

### STYLE block (paste once at the start of the chat)

> I am making 3D models for a cozy children's game for ages 4-9. Every picture I ask for in this chat must match the
> art style of the attached reference image: a cute stylized 3D render like a premium animated family film, rounded
> soft shapes, soft clay-like materials with fine fabric and fur texture, warm friendly colours, big expressive eyes,
> rosy cheeks, gentle smiles. Each picture is a **character turnaround sheet** on a plain light grey background with
> soft even studio lighting and no shadows on the ground: the same character shown three times side by side at the
> same size: **front view, side view (facing left), back view**. Full body in every view, nothing cropped, a little
> space between the views. Clean and simple: nothing in the hands, no props held, no text, no labels, no watermark.
> For people: standing straight in a relaxed A-pose, arms slightly away from the body, open empty hands, feet flat,
> hair, braids and ponytails kept clear of the arms. For animals: standing on all fours in a calm neutral pose, legs
> slightly apart so each leg is visible, tail visible, mouth closed. Large head and short body proportions, cute and
> chubby. I will now send one character per message; reply with just the picture.

### Then one message per asset, for example

> Turnaround sheet: Bờm, a cheerful 8-year-old Vietnamese boy with short tousled black hair, a bright red short-sleeved
> button shirt, navy shorts and simple sneakers.

If a picture breaks a rule (something in a hand, arms touching the body, a cut-off foot), reply: "Same character, but
[the fix]. Keep everything else the same."

## 3. The 43 assets: one line each for ChatGPT

### A. Friends (Meshy 7.1). Base each on its concept picture: upload `docs/characters-v108/concept-<name>.png` with the line.
1. **Clara**: 8-year-old girl, peach-pink hair in two long braids with small white flowers, cream blouse with puffy sleeves, lavender layered dress with leaf embroidery and petal-shaped hem, brown leather harness and one satchel, sage-green tights, brown lace-up boots, a small leaf pendant. (Redo in 7.1 using our young-Clara picture as the front view.)
2. **Finn**, sky explorer: 8-year-old boy, messy dark navy-blue hair, teal explorer jacket with gold trim and rolled sleeves, cream shirt, brown leather belts with a small brass compass on the belt, loose cream trousers, chunky brown boots, a small brown backpack.
3. **Sol**, twilight twin: 8-year-old boy, curly copper-orange hair, golden-yellow short cape with sun embroidery, cream tunic with a sun emblem, brown leather belt and bracers, dark brown trousers, brown boots.
4. **Lumi**, star gardener: small leaf sprite child, hair made of soft green leaves with a tiny flower, cream shirt, green overalls with a leaf pocket, a small brown satchel, brown sandals. (Her star lantern is left out: we add it as a separate prop.)

### B. Named villagers (Meshy 7.1)
5. **Auntie Mai**: kind Vietnamese woman in her thirties, long straight black hair, small earrings, red áo dài over loose white trousers, tan sandals, woven conical nón lá hat.
6. **Uncle Ba**: cheerful elderly Vietnamese man, short tuft of grey-white hair, grey moustache, blue áo bà ba shirt, wide dark navy trousers, sandals; a little shorter and rounder than an adult.
7. **Tèo**: 8-year-old Vietnamese boy, short spiky black hair, orange-yellow button shirt, navy shorts, sneakers.
8. **Tí**: 7-year-old Vietnamese girl, dark brown hair in two short pigtails, flower hair clip, bright pink dress, white sandals.
9. **Bông**: 8-year-old Vietnamese girl, black high ponytail, headband with small white bunny ears, purple t-shirt, dark purple shorts, white sandals.
10. **Su**: 8-year-old Vietnamese boy, short dark brown hair, green bucket hat, green t-shirt, dark green shorts, sneakers.
11. **Jack**: 8-year-old Australian boy, sandy-blond hair, freckles, royal blue bucket hat, blue t-shirt, khaki shorts, flip-flops.
12. **Mít**: 6-year-old Vietnamese girl, black hair in two short pigtails, flower clip, sunny yellow dress, white sandals.
13. **Bờm**: 8-year-old Vietnamese boy, short tousled black hair, bright red button shirt, navy shorts, sneakers.
14. **Ruby**: 8-year-old Australian girl, auburn red hair in two pigtails with a purple bow, a few freckles, violet dress, black sneakers.
15. **Lan**: 9-year-old Vietnamese girl, dark brown ponytail, mint-green children's áo dài over loose white trousers, white sandals.

### C. Pets (Meshy 7.1). The child's own animal, seen close.
16. **Puppy**: a small golden-brown puppy with floppy ears, a white chest patch, a short wagging tail and a red collar.
17. **Kitty**: a slim little orange tabby kitten with pointed ears, white paws, a tail held up, and a blue collar with a tiny bell.
18. **Bunny**: a round fluffy white bunny with long upright ears with pink insides, a pink nose and a cotton-ball tail.
19. **Panda**: a chubby baby panda cub, black and white, round ears, sitting-ready short legs, standing on all fours.
20. **Joey**: a young grey-brown kangaroo joey standing upright on its hind legs, small front paws held in front of its chest, long tail touching the ground, big ears.
21. **Calf**: a small light-brown calf with a white face patch, little nubs where horns will grow, a short tail with a tuft, a small bell on a ribbon.

### D. Companions (Meshy 7.1)
22. **Little Dragon**: a tiny friendly baby dragon, soft mint-green scales, a cream belly, small rounded wings folded at the sides, two little nub horns, big kind eyes, a short tail with a leaf-shaped tip, standing on its back legs.
23. **Sparkle the firefly**: a cute round firefly about the size of a cat, a soft yellow glowing tail-light, a dark blue body, big friendly eyes, small antennae with round tips, two pairs of translucent wings spread open. (One front + top view instead of the turnaround.)

### E. Farm animals (Meshy 6 Lite)
24. **Chicken**: a plump white hen with a red comb, yellow beak and legs.
25. **Cow**: a friendly black-and-white dairy cow with small horns and a bell.
26. **Sheep**: a fluffy cream sheep with a round woolly body, black face and legs.
27. **Pig**: a round pink pig with a curly tail and floppy ears.
28. **Water buffalo**: a calm grey Vietnamese water buffalo with wide curved horns.
29. **Bull**: a sturdy brown bull with short curved horns and a nose ring.

### F. Wild and fantasy animals (Meshy 6 Lite)
30. **Mr. Bear**, the shopkeeper: a big friendly brown bear standing upright, a green apron, small round glasses (hands empty and open, in an A-pose like the people).
31. **Unicorn**: a small white unicorn with a pastel rainbow mane and tail and a golden spiral horn.
32. **Koala**: a chubby grey koala standing on all fours, big fluffy ears, a large dark nose.
33. **Emu**: a tall brown emu with shaggy feathers and long legs.
34. **Platypus**: a brown platypus with a flat duck-like bill, a flat tail and webbed feet.
35. **Elephant**: a baby grey elephant with big ears and a short curled trunk.
36. **Penguin**: a small chubby black-and-white penguin with orange feet and beak.
37. **Turtle**: a green sea turtle with a domed patterned shell and flippers.
38. **Peacock**: a blue-green peacock with its tail feathers folded behind it.
39. **Crane**: a white red-crowned crane standing tall on one straight pair of legs, wings folded.

### G. Crowd neighbours (Meshy 6 Lite), the 4 seen most; the other 10 can follow
40. **Vietnamese mum in áo dài**: woman, long black hair, earrings, light blue áo dài over white trousers, nón lá, tan sandals.
41. **Vietnamese dad**: man, short black hair, light blue polo shirt, dark grey trousers, a wristwatch, sandals, a motorbike helmet on his head.
42. **Australian dad**: man, short brown hair, sunglasses, a wide-brimmed bush hat, blue short-sleeved shirt, khaki shorts, brown boots.
43. **Australian mum**: woman, blonde ponytail, straw hat, a sunny yellow dress, orange sandals, earrings and a necklace.

Later (next month): Vietnamese farmer (brown áo bà ba, nón lá), street vendor (pink áo bà ba, apron, bun),
Vietnamese grandma (purple áo bà ba, grey bun, glasses), Vietnamese grandpa (cream áo bà ba, straw hat, moustache),
schoolboy and schoolgirl (white shirts, navy, red scarves), Australian grandma (lilac cardigan, grey curls, pearls),
Australian grandpa (green polo, bucket hat, long socks), Australian boy (ginger, teal tee, orange shorts),
Australian girl (dark skin, pigtails, light blue dress, straw hat).

## 4. Meshy settings (Pro)

- Image to 3D → **Multi-view on**, upload front, side and back (the cropped turnaround).
- A to D: **Meshy 7.1**, High Detail, **Texture on**, Resolution Standard, Image Enhancement **off**, Licence **Private**.
- E to G: **Meshy 6 Lite**, High Detail, Texture on.
- Pose: off (the pictures already stand in an A-pose; the game uses its own skeleton).
- Wrong result? Use a **free retry** (4 per model) before anything else.
- Download every model as **GLB** into `D:\WorkSpace\meshy\<group>\<name>.glb`.

## 5. After Meshy (Claude, in Blender)

- **People** (A, B, G): the Clara pipeline (`clara/scripts/fit2.py`): the game's skeleton, skin tone as its own part, the
  face with 9 moods, light and high-detail versions. Each needs about 10 joint points marked on its front picture.
- **Animals** (C, E, F): **not built yet**. The game draws animals with their own code-made shapes and moves
  (`js/animals.ts`); a Meshy animal needs a four-legged version of the fitting script (legs, tail, ears, head). Plan one
  pet (the puppy) as the test before converting the rest.
- **Companions** (D): fly or float: a simple bob-and-flap rig.
