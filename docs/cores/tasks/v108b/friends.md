**ready for Release** (parts 1 and 2: the whole brief except the items under "Left for later") (5 Nov 2026, 21:30 AEDT, last code commit `7ce35e35a`)

# v1.08b helper: friends (status)

Branch `work/v108b-friends` (from `origin/integrate/v108`). Brief: `friends-brief.md`. Plan: `docs/plans/new-friends-characters.md`.

## Plan (5 Nov 2026 AEDT; the owner's go is given)

The brief is eight steps; this session does the parts every later step builds on, so the game works end to end with the
new friends today, and leaves the heavy model work as its own next piece:

1. Data: the four friends (`js/content/friends.ts`): name, title, hello lines (EN/VI), hair, clothes and colours read from
   the gallery renders; four outfit kinds per friend; the one-time move of old saves.
2. Fallback first: the code builder (`js/avatar.ts`) draws a child in their friend's hair, clothes and colours (the plan's
   safety net "if a model cannot load"), so everything that draws a child (the valley, two players, online friends, films,
   vehicles) shows the new friends now. Villagers are not touched.
3. Welcome (`js/ui/friends-ui.ts`, `js/ui/profile.ts`): name, boy or girl (two big cards), the two friends of that set
   turning slowly with a spoken hello, five skin tones, then the editor (age, start screen, difficulty, photo).
4. Old saves: boys to Finn, girls to Clara (set guessed from clothes when missing), skin carried over, nothing removed;
   old tops and bottoms become free outfits of the same colour; the one-time "Các bạn mới đã đến! / New friends are here!"
   card; online friends on older versions shown as the default friend of their set (`js/net.ts`).
5. Backpack: "Nhân vật & Trang phục / Character & Outfits" with the two friends of the child's set (one tap, free) and the
   outfits owned. Gender only in Grown-ups › Children › Edit.
6. Checks: `newfriends`, `friendmigrate`, `friendswap`, `wearfit`, plus the existing ones the brief names.

## Changes to shared files (small, named here)

- `js/state.ts`: one import, the new player's default look gets `set`, `friend`, `suit`; `normalizeProfile` calls `migrateFriend`.
- `js/avatar.ts`: one import; `buildAvatar` and `avatarURL` draw from `friendLook(look)`; legs take `look.legs` when set.
- `js/net.ts`: `cleanHello` gives a hello with no friend the default friend of its set.
- `js/ui/pad.ts`: the clothes heading renamed "Character & Outfits", the friend and outfit rows, their taps.
- `js/ui/profile.ts`: Welcome steps before the editor for a new player; the editor's "My friend" row; the one-time card
  before play.
- `sw.ts`: the friends' modules, loaders, models and 16 pictures in the offline list.
- `css/style.css`: unchanged in the end (the friends' styles are added by `js/ui/friends-row.ts`, not in the first download).
- Part 2 also: `js/player.ts` (rebuild when the model arrives), `js/shop.ts` (the Outfits tab button and the glasses
  pictures), `js/content/shop.ts` (the glasses slot and six items), `js/main.ts` (Cô Mai and Bác Ba's age, name tags
  above a grown-up), `js/film.ts` (one line: the model's mood), `js/cartoon.ts` (the tale people's face and hair),
  `build-netlify.sh` and `tests/checks/shared.mts` (copy `models/`).
- `tests/harness.mts`: `start()` taps "Let's play" on the one-time card (the seeded children are old saves), as it skips
  the prologue. `tests/checks/startup.mts` `firstplayer` goes through the new Welcome steps. Neither check was weakened:
  both still check what they checked, through the new screens.
- `tests/checks/play.mts`: the four new checks at the end, one marked block.

For the games helper: nothing added to the Bag besides the "Character & Outfits" section. For the story helper: the people
builder now draws a child from `friendLook()`; tale costumes are yours, the tale theatre's 2D people are not redrawn yet.

## Owner's decisions

- 5 Nov 2026 AEDT (owner, via Release): "dont mention (Finn) at all, if name has been created then dont add the character
  names". A named child is shown by their own name only, everywhere; the "Henry (Finn)" item is dropped (nothing writes a
  friend's name after a child's name).
- 5 Nov 2026 AEDT (owner's rule, via Release): helpers run only their own checks, never the full suite, and push only
  their own branch.

## Progress

- Part 1 (commits `b7b3621d9` to `49132a679`): data, the code person in the friend's colours, Welcome, old saves, the
  one-time card, Backpack rows, offline list, checks newfriends, friendmigrate, friendswap, wearfit.
- Part 2 (commits `15b14262a` to `7ce35e35a`):
  - **Light 3D models** `models/finn.glb`, `sol.glb`, `clara.glb`, `lumi.glb`: 92 to 114 KB each (meshopt), about 8,200
    triangles shown (Lumi about 14,000: her felt-leaf hair is about a thousand leaves that do not thin further), the
    game's joint names, eight face moods, colours in the corners plus a separate skin material, 5 draws each. Made by
    `node tools/make-friends.mts` (Blender `lumi.py ... game glb`, then `tools/blender/game-light.py`, then gltfpack).
    No 512 px texture: plain colours in the corners are lighter and look the same.
  - **Loader** `js/friend-model.ts` with GLTFLoader, meshopt decoder and SkeletonUtils from three r160 (`vendor/`): loads
    when a child with a friend is first built, never in the first download. The model copies the code person's joint
    turns just before each drawing, so walking, jumping, riding (`seatRider`) and film poses work unchanged, and the hats,
    glasses, necklaces and backs the code person wears stay on it. Until it arrives, or when it cannot load, the code
    person in the friend's colours is shown. No still copy for a friend's model (a few children only).
  - **Welcome and pictures** `js/friend-view.ts`: the Welcome cards show the model turning in the chosen skin tone (the
    renders stay underneath if a model cannot load); Who's playing, the HUD and Grown-ups show a portrait of the friend in
    the child's skin tone (made on the device).
  - **Villagers** (owner's choice A, `js/avatar.ts`): smaller eyes set lower, soft round cheeks, seven moods (smile, blink,
    happy, surprised, curious, sad, shy) on one 512 px picture, two-tone felt-look hair; heights by `look.age` (WORLD-011):
    child 1.6, grown-up 2.0, grandparent 1.8. Cô Mai is a grown-up, Bác Ba a grandparent; Studio villagers already have
    an age choice (kid, grown-up, grandparent) and are drawn at those heights now.
  - **Glasses and masks**: a new slot (sunglasses, round glasses, star mask, boys' and girls'), drawn on every face, sold
    in the shop, kept on the models.
  - **Outfits in the shop**: an Outfits tab (everyday free, áo dài 120, festival 120, rain day 70), tap once for the
    price, again to buy.
  - **Films**: the child's friend model in the lantern films (the films already used the child's look) with the film's
    moods; the tale theatre's 2D people redrawn in the new style (rounder head, smaller eyes, soft cheeks, felt shine).
  - **First download**: the friends' data, styles, titles, the shop tab and the editor row load later (Who's playing
    opens them), and `models/` is copied by `build-netlify.sh` and the checks' packed copy.

## Checks (5 Nov 2026 AEDT, last code commit `7ce35e35a`)

- New: `newfriends`, `friendmigrate`, `friendswap`, `wearfit` (22 hats, 6 glasses and masks, 8 neck, 12 backs, 8 shoes on
  all four), `friendmodel` (sizes, triangles, skin tone, joints, moods, a cap worn, no files: the code person stays),
  `friendoutfits`: pass.
- Existing: `unit`, `types`, `names`, `arch`, `preload`, `emoji`, `noemoji`, `bilingual`, `boot`, `contract`,
  `firstplayer`, `shop`, `r79clothes`, `bagpals`, `simple`, `vehicles`, `story`, `tales`, `films` (SAMPLE),
  `longplaymem`: pass. `phone` and `friendmodel` passed alone (beside other checks a click timed out); `perf` (village
  367 draws, home 448) and `battery` passed alone (they failed once while the voice recorder ran at the same time).
- Checks changed because the game changed (not weakened): `shop` 7 to 9 tabs and `r79clothes` 6 to 7 mirror tabs (the
  glasses slot and the Outfits tab); `tests/unit/shop.test.mts` lists the new slot; `tests/harness.mts` taps "Let's
  play" on the one-time card; `firstplayer` goes through the Welcome steps; the packed copy links `models/`.
- **`startup` is red at the limit, and so is `integrate/v108` itself on this machine**: first start 1073 KB, limit
  1040 x 1.03 = 1071. The base `origin/integrate/v108` (fetched 5 Nov) measured 1069 and 1072 KB in two runs here;
  this branch adds about 0.8 KB beside it in the same run (compared file by file). Second start 0 KB (the offline copy
  fills). Needs the owner's limit or a shrink elsewhere; Release decides.
- Not run: the full suite (Release's).

## New spoken lines (recorded with Azure, HoaiMy and Natasha)

The four hellos, "Hello! What is your name?", "Choose your friend!", "New friends are here!", the shop's "Outfits for
your friend. Tap one to see it, tap again to buy it." and the other new lines the voice tool found: 24 files. The voice
tool also removed 136 old mixed-line files from the pack; they are kept on this branch (Release decides at merge).

## Left for later

1. **Items in the hand from each friend's quests** (Finn's compass, Clara's flower staff, Sol's sun crystal, Lumi's star
   lantern): the models carry their item now, always; earning them needs quests (the story helper or a later round) and
   the item as its own part of the model.
2. **Studio's "kind" (Vietnamese or Australian) choice**: not added, so as not to collide with the platform helper's
   Studio redesign this round; Studio's age, clothes and hair choices already draw villagers in the new style.
3. **Crowds' heights**: the cities, homes and other places that make people at their own scale (children .78, and so on)
   keep it; only the named villagers and Studio villagers take the new heights.
4. Shoes swapped on the models (the models keep their own boots; shop shoes show on the code person).
