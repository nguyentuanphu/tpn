**ready for Release** (part 1 of the brief; see "Left for later") (5 Nov 2026, 19:10 AEDT, last code commit `49132a679`)

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
- `sw.ts`: the two new modules and the 16 friend pictures in the offline list.
- `css/style.css`: one block at the end marked `(v1.08b friends)`.
- `tests/harness.mts`: `start()` taps "Let's play" on the one-time card (the seeded children are old saves), as it skips
  the prologue. `tests/checks/startup.mts` `firstplayer` goes through the new Welcome steps. Neither check was weakened:
  both still check what they checked, through the new screens.
- `tests/checks/play.mts`: the four new checks at the end, one marked block.

For the games helper: nothing added to the Bag besides the "Character & Outfits" section. For the story helper: the people
builder now draws a child from `friendLook()`; tale costumes are yours, the tale theatre's 2D people are not redrawn yet.

## Owner's decisions

- None new in this session (the plan's answers of 3 Nov apply).

## Progress

- 5 Nov 2026 AEDT: plan; Blender 4.2.9 installed in `/opt/blender-dl`; data, fallback builder, Welcome, old saves, card,
  Backpack rows, offline list, checks. Commits `b7b3621d9` to `49132a679`.

## Checks (5 Nov 2026 AEDT)

- New: `newfriends` pass (phone portrait and landscape, tablet, computer: every step fits one screen, 44 px buttons,
  16 px text), `friendmigrate` pass, `friendswap` pass, `wearfit` pass (22 hats, 8 neck, 12 backs, 8 shoes on all four).
- Existing, run with `--only` (the `--changed` choice against `main` is the full suite, because `integrate/v108` is far
  ahead of `main`): pass `emoji`, `noemoji`, `preload`, `unit`, `names`, `bilingual`, `rules`, `arch`, `types`, `boot`,
  `contract`, `firstplayer`, `shop`, `r79clothes`, `bagpals`, `phone`, `simple`, `vehicles`, `films` (SAMPLE), and alone
  `perf` (village 375 draws, home 456), `battery`, `longplaymem`, `startup`.
- `startup` is at its limit: first start 1071 KB, limit 1040 x 1.03 = 1071 (`integrate/v108` itself is 1069 KB). The
  friend modules load only when needed; anything more in the first download needs the owner to raise the limit or
  something else to shrink.
- Fixed on the way: the offline list's friend pictures must be written out one by one (tools/bundle.mts reads quoted
  names; a generated list broke the packed offline copy).
- Not run: `stories` (no check of that name), `phone`/`simple`/`vehicles`/`films`/`perf`/`battery`/`longplaymem` were run
  before the last commit (it only made the friend modules load later), the full suite (Release's).

## New spoken lines (recorded with Azure, HoaiMy and Natasha)

The four hellos ("Hi, I'm Finn! Let's explore the sky!" and the others, EN and VI), "Hello! What is your name?",
"Choose your friend!", "New friends are here!": 14 files. The voice tool also removed 136 old mixed-line files from the
pack; they are kept on this branch (only the new files and the manifests changed), for Release to decide.

## Left for later (not done in this session)

1. **Light 3D models and the loader** (brief step 1): decimating the Blender friends to 6–8k triangles with a 512 px
   texture and mood atlas, a meshopt `.glb` each, a GLTFLoader from our vendored three (r160) loaded after Welcome, the
   skinned walk/idle/wave/cheer/ride, and the far still copy. Until then the code builder in the friend's colours is shown
   (the plan's fallback). The Welcome cards use the gallery renders, so the skin row does not recolour the picture yet.
2. Picker pictures per friend and skin tone (today: the drawn face with the friend's hair in the child's tone).
3. Outfits in the Shop (the four kinds per friend are in the data; buying them is not wired), the glasses slot, items in
   the hand from each friend's quests, new 2D shop pictures from the models.
4. Villagers in the new style (brief step 6: proportions, heights 1.6 / 2.0 / 1.8, smaller eyes, felt hair, seven moods),
   Studio's new look choices.
5. `seatRider` with the model joints, films with the chosen friend's model, the tale theatre's 2D people.
6. "Henry (Finn)" in Grown-ups.
