# The new friends replace today's characters: plan

Owner, 3 Nov 2026 AEDT: the new characters are nearly finished and will replace the children in the game. The owner asked for a plan covering:
- the Welcome screen for a new player, and for a child who already has a character;
- which new character each existing player moves to;
- a place in the pad to change to another character of the same gender;
- the Bag and the Shop;
- the villagers.

The designs:
- the lumi helper's gallery, `docs/characters-v108/gallery/` (artifact https://claude.ai/artifact/GXNNki8CLp3WZVcfniNUc6);
- the owner's choices, recorded in `docs/cores/tasks/v108/lumi.md`:
  - four friends: boys **Finn** and **Sol**, girls **Clara** and **Lumi**;
  - look 1 (felt hair, medium head, soft face);
  - seven moods each;
  - heights: children 1.6, grown-ups 2.0, grandparents 1.8 (WORLD-011);
  - 8 Vietnamese and 6 Australian neighbours;
  - 8 wardrobe outfits.

## How it works today (checked in the code)

| Part | Today | Where |
|---|---|---|
| Who builds people | One builder, `buildAvatar(look, photo)`. It is used for the child, the villagers, other children on the device, online friends and the story films. | `js/avatar.ts:207` |
| New player | Title → Who's playing → editor. The editor asks for photo, name, age (Little/Big), start screen, difficulty and "I am a..." (Girl/Boy). It also asks for hair style, hair colour and skin. With the shop on, the clothes, hat and back come from the shop. | `js/ui/profile.ts:79-183` |
| Gender | No separate field: `look.set = 'girl' or 'boy'`. If it is missing, it is guessed from the clothes. | `js/content/shop.ts:193` |
| Save | `sv2_profiles`. `look` holds `style, color, hat, back, hair, hairStyle, skin, glider, neck, top, bottom, feet, set, shoe, badge, star`. Saves have no version number; `normalizeProfile` tidies every save when it loads. | `js/state.ts:150-192` |
| Child's picture | A 2D picture: the photo, or a drawn face made from hair + skin. It is used in the picker, the HUD, Grown-ups, rankings, the friends list and some games. | `js/avatar.ts:115` |
| Changing the look | Grown-ups › Edit (the full editor), the farm wardrobe and the Shop's mirror. The pad's Bag has "Clothes and accessories" (wear or take off). | `js/ui-settings.ts:183`, `js/farm.ts:300`, `js/shop.ts:171`, `js/ui/pad.ts:285` |
| Shop | 70 items (64 sold, 6 tester rewards): 18 hats, 8 neck, 14 tops, 10 bottoms, 8 feet, 12 backs. 32 are for boys and 32 for girls; the other set's items can only be bought as a gift. Prices 30 / 70 / 120. Each item is fixed to the old body by hard-coded positions (no attach points). | `js/content/shop.ts:27-125` |
| Villagers | 11 named villagers with fixed looks: Mai, Ba, Tèo, Tí, Bông, Sứ, Jack, Mít, Bơm, Ruby, Lan. Studio can add up to 60 more. Crowds of people are made in about 20 places: cities, homes, town, traffic, school, festivals, and so on. | `js/main.ts:359-399` and others |
| Films | Story actors are made with `buildAvatar`, and the child's own look goes into the lantern films. The tale theatre (`js/cartoon.ts`) has its own 2D people. | `js/film.ts:84` |
| Vehicles | `seatRider` bends the knees and elbows of the old body. | `js/vehicles.ts:452` |
| Speed limits | The `perf` check allows 420 draws in the village and 490 at home. `battery` checks the far "still copies". `longplaymem` broke with bone textures before. `startup` limits the first download to 1071 KB. | `tests/perf-baseline.json`, `tests/checks/startup.mts` |
| 3D model files | The game cannot load `.glb` files yet; there is no loader. The four models are about 42 MB each. | `vendor/` |

## The plan

### 1. Welcome for a new player
1. **Name**, then **"Bạn là bạn trai hay bạn gái? / Are you a boy or a girl?"**: two big cards.
2. **Choose your friend.** The two friends of that gender stand side by side, turning slowly, with a name card and one spoken line each:
   - Boys: Finn, "Sky Explorer · Nhà thám hiểm bầu trời", and Sol, "Sun Keeper · Người giữ mặt trời".
   - Girls: Clara, "Bloom Keeper · Người giữ hoa", and Lumi, "Leaf Sprite · Tiên lá".

   The child taps one. The character waves and smiles (the "happy" mood) and says hello in English or Vietnamese.
3. **Skin tone** (5 tones, owner's answer 2). It is one row under the model, and the model changes colour straight away.
4. **Age, start screen and difficulty** stay as they are, on the same page.
5. **The photo** stays for the round picture (picker, HUD, friends list). It is no longer pasted onto the 3D face, because the new faces are drawn with moods and a photo would break them.
6. The child's name stays the child's name. Finn or Clara is the look, not a new name: "Henry (Finn)" in Grown-ups.

### 2. A child who already has a character (Who's playing)
- The cards in the picker show a picture of the chosen friend in the child's skin tone (a ready-made picture per friend and tone), or the photo if there is one.
- **The first time an existing child opens the new version** they see one card: "Các bạn mới đã đến! / New friends are here!".
  - It shows the two friends of the child's gender, with the one they were moved to already chosen.
  - The child can tap the other one, or tap "Chơi thôi / Let's play" to keep it.
  - It is shown once.

### 3. Which new character existing players get
- Gender comes from `look.set`:
  - boys go to **Finn**;
  - girls go to **Clara**.
  - If `set` is missing, it is guessed the same way the shop guesses it today.
- Their skin tone carries over to the new skin row.
- **Nothing is lost:**
  - coins, stickers, pets, companion and hats, gliders, items bought and every other save stays.
  - The old look fields stay in the save (not deleted), so the game can go back to them if something goes wrong.
- Online friends on an older version see the new characters as the default friend of the right gender. The new version keeps reading old looks.

### 4. Changing character in the pad
- In the Bag tab, the section "Nhân vật & Trang phục / Character & Outfits" (replacing "Clothes and accessories") has a row of the two friends of the child's gender at the top. One tap changes friend, for free, as often as the child likes. Everything worn stays worn.
- The farm wardrobe and the Shop mirror open the same section.
- **Changing gender is only in Grown-ups › Children › Edit** (press and hold), so a child cannot switch by accident.
- The new Bạn đồng hành tab (v1.08 plan, E) stays for the companion and pets only.

### 5. The Bag and the Shop
Today's tops and bottoms only fit the old body, and the new friends each have their own outfit, which is part of who they are. Plan:

| Slot | New | Why |
|---|---|---|
| **Outfits** (replaces top + bottom) | Each friend gets 4 outfits: everyday (as the concept), áo dài or tunic, festival, and rain or winter. Lumi's wardrobe already has 8 outfits drawn. Outfits are sold in the Shop for that friend. | They fit the model exactly; no clipping. |
| **Hat** | Kept. All 16 shop hats, the 4 passport hats and the tester hats are remade for the new head. Each friend's head has one hat point, so every hat fits all four. | Children keep what they bought. |
| **Neck** (scarf, necklace, bow tie) | Kept: one neck point. | |
| **Back** (wings, cape, backpack, shell) | Kept: one back point. | |
| **Feet** | Kept as shoes swapped on the model: sneakers, sandals, boots, rain boots, thongs (drawn in the gallery). | |
| **New: glasses / face** | Sunglasses, round glasses, a star mask. | Drawn in the gallery (Sol). |
| **New: in the hand** | Finn's compass, Clara's flower staff, Sol's sun crystal, Lumi's star lantern. The child earns each one from their friend's quests; it is not sold. | Gives each friend something to do. |

- **Hats, neck items, backs, shoes and glasses fit all four friends.** The boys/girls split stays only for outfits. Anything else of the other set can be bought or given as a gift, as today.
- **Tops and bottoms already bought** (they cannot be worn on the new body): each one becomes a new outfit of the same colour for the child's friend, free (owner's answer 3), with a note: "Áo cũ đã thành bộ đồ mới / Old clothes became new outfits".
- Shop pictures: each item gets a new 2D picture drawn from the new model (our own drawing).

### 6. The villagers
- **The 11 named villagers** each get a design in the new style: Vietnamese villagers in everyday Vietnamese clothes, the Australians (Jack, Ruby) in everyday Australian clothes, at the new heights. The gallery already has 14 neighbours to start from.
- **Crowds** (cities, traffic, school, festivals, the 60 Studio villagers) cannot all be 3D model files: there are too many, and the phone would slow down. Two ways; the owner chose A:
  - **A (recommended):** the builder in `js/avatar.ts` is reshaped to the new style: new proportions and heights, the new face (smaller eyes, soft cheeks), felt-look hair and the seven moods. The villagers then look like they live with the four friends, but stay light, and their far still copies and the speed checks keep working.
  - **B:** every villager is a model file. This looks closest to the gallery, but it is heavy: many megabytes more and slower phones.
- **Studio:** the villager and story-character pages get the new look choices: kind (VN or AU), age (child, grown-up, grandparent), clothes and hair. Old Studio villagers are moved to the closest new look.
- **Films and tale theatre:** the films use the new friends and villagers; the 2D theatre people are redrawn to match.
- **Vehicles:** `seatRider` gets the new friends' joints; the gallery already has the bicycle, motorbike and bus with the friends riding.

### 7. How the models get into the game (technical)
1. **Light models for phones.** From 42 MB to about 300 to 500 KB each:
   - about 6,000 to 8,000 triangles;
   - one 512 px picture for the body;
   - faces as a mood atlas, as today;
   - the shared skeleton with the game's joint names;
   - compressed `.glb` (meshopt).
2. **A model loader** (three.js GLTFLoader, our vendored copy). It loads after Welcome appears, so the first download stays under its limit (startup check).
3. **Animation:** walk, run, jump, idle, wave, cheer and ride, from the Blender rig. The far still copy (battery check) and a test that the memory does not grow (longplaymem) come first, because skinning broke that check once before.
4. **Safety:** if a model cannot load (old phone, no network on the very first start), the child is shown with the reshaped builder in the friend's colours, so the game never stops.
5. **Offline:** the models go into the offline list (`sw.ts`) and the Wi-Fi pack.

### 8. Checks
- New:
  - `newfriends`: the Welcome flow for a boy and a girl, choosing each friend, and the skin row.
  - `friendmigrate`: old saves (boy, girl, no `set`) are moved, nothing is lost, and the card is shown once.
  - `friendswap`: changing friend in the pad, gender locked.
  - `wearfit`: every hat, neck, back, shoe and glasses item on all four friends, with no floating and no clipping.
- Existing checks stay as they are and must pass: `perf`, `battery`, `longplaymem`, `startup`, `phone`, `vehicles`, `stories`, `films`, `shop`, `simple`, and the full suite.
- Screenshots on phone, tablet and computer before each report.

### 9. Order and rounds
- **v1.09:**
  - the light models of the four friends and the loader;
  - Welcome, migration, the pad change row;
  - hats, neck, back, shoes and glasses fitted;
  - the outfits shop;
  - old tops and bottoms turned into new outfits.
- **v1.10:**
  - the villagers in the new style (the 11 named ones first, then crowds and Studio);
  - films, tale theatre and vehicles;
  - items in the hand from the friends' quests.
- Each round goes through the full suite on GitHub and the owner's "yes, deploy".

## Owner's answers (3 Nov 2026 AEDT, pop-ups)
1. Existing players: boys to Finn, girls to Clara, with the one-time card to change.
2. Skin tone: yes, 5 tones (the old tone carries over).
3. Tops and bottoms already bought: **turned into new outfits**. Each old item becomes a new outfit of the same colour for the child's friend, free, instead of coins back.
4. Villagers and crowds: A, the builder in code reshaped to the new style (light).
