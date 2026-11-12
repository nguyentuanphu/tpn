# Handoff: pets and companions with Meshy (kept current every hour)

Last update: 12 Nov 2026 AEDT, evening (owner: stop, hand over to another Claude account). Branch `meshy-pets`, worktree `D:\WorkSpace\sv-meshy-pets` (owner's PC). Never merge
main, deploy or bump the version. Reply to the owner in Vietnamese, short; ask with pop-up questions. Ask before every
Meshy use (paid), through the journal `D:\WorkSpace\meshy\private\meshy-jobs.sqlite3`, never retry a paid POST, never
print the key; after a paid run `python tools/meshy/ledger_sync.py`. Back up (commit + push) every hour.

Read first: `.claude/skills/meshy-characters/SKILL.md` (section "Animals"), `docs/meshy-pets-20261110/PLAN.md`.

## Takeover summary (12 Nov 2026 AEDT, evening)

**Approved by the owner and committed:** puppy (11 Nov), dragon and firefly companions, near and light models
(12 Nov). Board line on `docs/cores/BOARD.md`: "ready for Release" for these.

**Five new pets, Meshy jobs PAID and DOWNLOADED (never resend):** owner pop-up 12 Nov "Cả 5 con, 200"; balance 1,764
to 1,564, ledger synced (charged 1295). Journal `D:\WorkSpace\meshy\private\meshy-jobs.sqlite3` holds:
multi-image kitty 01a1cd10-4d53, bunny 01a1cd10-56e6, panda 01a1cd10-6052, joey 01a1cd10-69e0, calf 01a1cd10-736f;
remesh 30k and @9000 for each (01a1cd14-...). Raw files: `D:\WorkSpace\meshyaw-models\C\<kind>.glb`,
`remesh\<kind>.glb`, `remesh\<kind>-9000.glb`. All five match their sheets (`D:\WorkSpace\meshy\petsaw-<kind>-cmp.png`).
**No pet is approved by the owner yet.** Their working models are committed as a hand-over snapshot only (owner asked
to upload everything): `models/world/creature-{kitty,bunny,panda,calf}[-hd].glb`. The joey has no Meshy model in the game yet.

Per pet (last full audits, `make_animal.ps1`; pictures under `D:\WorkSpace\meshy\pets\`):
- **kitty**: full audit 232 cases, **0 failing**. All HD close shots looked at (`kitty-7\shots\grid*.png`): looks like its
  sheet. Shut-eye lash specks then got `lash_dark/lash_spot/fill_near` (last run also 0 failing). Mild: the raised hind leg
  in `scratch`/`sit` looks flat. Next: owner's look (companion-style film or close sheet), then commit approval.
- **bunny**: full audit 232 cases, **3 failing: captain/other hats loose up to 27** (`audit.hatLoose` 16 in bunny.json;
  look at the hat pictures before changing it; the long ears come up through the hats). Hop walk floats by design
  (`audit.float` 120, reason in json). Light model 396 KB (`tex_far` 448).
- **panda**: full audit 232 cases, **37 failing: neck stretch** (up to 1,127) where the big head meets the body when the
  head turns, rolls, begs, scratches. `neck_soft` 0.1 did not fix it; try `head_back`, a lower `joints.head`, or the
  head plane's tilt; render `tools/meshy/weight_colours.py` first. Eyes: black eye patch kept when shut (`eye_grow` 0.5,
  `fill_near`, light `lash`); `audit.eyes` 100 with reason (the check counts the patch's black fur).
- **calf**: first audit only: near model 976 KB (over 800) -> `jpeg` 70 set but NOT rebuilt yet; shut-eye lash specks ->
  lash fill set, not rebuilt; tears are the bell, beg 351 is a leg/belly gap (`audit.tear` 360, reason in json). Its tail
  hangs down: check the tail weights with `weight_colours.py` (the tail rule takes points behind AND above the root).
- **joey**: NOT fitted. It stands upright on big hind feet with small arms and a long tail on the ground; the four-leg
  joint finder puts joints in the wrong places (`D:\WorkSpace\meshy\pets\joey-0\joey-joints-*.png`). Needs an upright
  mode in `fit_animal.py`: joints from `animal_joints/joey.json` by hand (arms = leg0/1 at the shoulders, hind legs =
  leg2/3), arm weights by distance to the arm, hind legs by the usual below-the-belly rule, a tail-down rule.
- **Skills** for the five (agreed proposals in PLAN.md) and the calf's rename ("Bê con") are not started.
- `js/creatures.ts` `MESHY_CREATURES` and `tests/world-creatures.mts` `MESHY` already list all five pets (a missing
  `-hd` file falls back).

**Nothing is running.** The last queue was stopped; `tests/check-times.json` (suite timing) is left uncommitted on purpose.

**Resume prompt (Vietnamese, for the next chat):**
> Tiếp tục thú cưng Meshy của Sparkle Valley ở worktree `D:\WorkSpace\sv-meshy-pets`, nhánh `meshy-pets`. Đọc
> `docs/meshy-pets-20261110/HANDOFF.md` (phần "Takeover summary"), rồi `.claude/skills/meshy-characters/SKILL.md` (phần
> Animals) và `docs/meshy-pets-20261110/PLAN.md`. Năm thú cưng đã trả tiền Meshy và đã tải về: KHÔNG gửi lại. Làm theo thứ
> tự: sửa cổ gấu trúc, mũ thỏ, dựng lại bê, rồi chế độ đứng cho chuột túi con; xem mọi ảnh ở kích thước thật; gửi chủ
> duyệt từng con bằng câu hỏi pop-up trước khi coi là xong. Không merge main, không deploy, không đổi số phiên bản. Trả
> lời chủ bằng tiếng Việt, ngắn.

## Where things stand
- **Puppy: done and approved** (owner 11 Nov "Okay approved"): models on the branch, pet scale 0.6, 18 moves,
  skills fetch / dig / lead the way, hats fitted, open mouth on the muzzle. Pets audit 232 cases, 0 failing.
- **Companions (dragon, firefly): approved by the owner (12 Nov 2026 AEDT, after the films: "Duyệt cả hai"), models committed** (working copy `models/world/creature-dragon*.glb`,
  `creature-firefly-hd.glb`; owner's approval needed before committing). Meshy spent 80 credits as approved (dragon 45
  incl. an unneeded rig, firefly 35; the firefly has no 9k remesh: companions use the near model, the far file stays the
  Blender one). Fit files: `tools/meshy/animal_joints/dragon.json`, `firefly.json`. Raw: `D:\WorkSpace\meshy\raw-models`.
- Owner: a companion is small when first met and grows as it is fed (`js/companion.ts`, scale 1 + 0.14 a level; dragon
  0.45 m at level 1). Sparkle keeps the game's own see-through wings and glow (Meshy's solid wings are cut).
- Last fixes: firefly lid colour from the ring just round the eye (peach mask on a navy head), `lid_size` 2.6; dragon `audit.hatLoose` 6 (egg-shaped head, gap hidden under the band). Earlier: hat skull top by point count (not width: antennae, horns), auditor loose/poke rules, firefly lids bigger
  (`lid_size` 3.2), mouth piece smaller (`mouth_patch` 1.2), firefly leg gaps allowed (`audit.tear` 120, reason in json).

- 11 Nov afternoon/evening (this chat). Firefly shut and happy lids fixed, auditor eyes 0 failing (was 9):
  - the mouth piece had silently used the lids' picture size and grid (a `TP = ...` hidden behind a `#` comment in
    the middle of its line): fixed, its own 96 px picture again;
  - lash line drawn with soft edges (was stair steps);
  - `fill_near`: the shut lid filled only from the face colour round the eye (was grey, mixed with the navy hair);
  - `lash_dark` 0.2 (the lash arc over the eye is 0.16) and `lash_spot` (small warm specks darker than the face round
    them) filled under the lid;
  - the specks that stayed were not in the picture: a debug build with the lids painted magenta (`LID_DEBUG=1` env)
    showed (1) the lid (size 2.9, `lid_out` 0.8) covering the whole head and riding on the antennae, (2) small bumps
    in Meshy's mesh poking through it. Now `lid_size` 2.2, `lid_lift` 0.006, `lid_rim` (rim off along the surface
    normal), `lid_spike` (lid points on something sticking out are left out), `lid_px` 160 (size limit);
  - debug fit writes `<kind>-lidsrc<i>.png` (eye found red, filled blue, lid edge green).
  Dragon: 09:23 models, close shots looked at, fine; audited again with the firefly.
- 11 Nov evening, owner: "Đom đóm thiếu cánh ... tại sao lại ko so sánh với model". True: the game kept only the code
  shape's two small pale ovals, nearly invisible, and the `close` shots (bare model) can never show the game's wings,
  so nobody compared with the sheet. Now `sparkleWings` (`js/companion.ts`): four see-through wings drawn as the sheet
  has them (big pair from the top of the chest tipped up, small pair below tipped down, pale sheen, cream rim, veins),
  on the model's body bone, beating back and forth. Fit: `cut_pale` 0.14, `cut_light`, `cut_sat` cut the white wing-root
  strands left beside the chest. **Lesson: compare every companion with its reference sheet in the `companion` shots
  (the game's own group), not only the bare-model `close` shots.**
  Dragon rebuilt with `lash_dark`, `lash_spot`, `lid_lift` 0.004 (the far model's lid showed painted lash marks).

- 11 Nov evening, end: audit firefly+dragon full 169 cases, 0 failing (per-animal limits with reasons in the json).
  Checks with `SV_URL=8777`: companionhats, companiongoal, animalhomes, petskills, phone pass; `worldcreatures` fails on
  two things older than today: it checks the firefly's far file (still the Blender one, no Meshy far was made) for
  lids, and compares the dragon's size with the old code dragon (flat, 0.8 m wings) although the owner chose a small
  standing dragon. The check needs a Meshy-companion rule (near model, owner's size); not changed yet.
  Sheets for the owner: `companions/firefly-sheet.png`, `companions/dragon-sheet.png` (reference beside the game).

- 12 Nov, owner asked to see both flying, flying fast, tricks, near and far, all angles, HD or normal:
  `tools/meshy/companion_film.mts` films (held page clock, the world stepped by the tool; six views; hover, walk, run,
  loop, spin; `far` swaps in the light model). Films: `D:\WorkSpace\meshy\petsilm\{firefly,dragon,dragon-far}.mp4`.
  Fast flight looked like hovering: companions now lean into the flight and beat their wings faster with speed
  (`js/companion.ts`). Companions always use the HD (near) model in the game; the dragon also has a light one (fallback),
  the firefly's fallback is still the Blender model. Build note: on this loaded machine `node tools/build.mts` can fail in
  its catalogue step (1.5 s timeout); `node tools/build.mts d:/workspace/sv-meshy-pets` (lower case) compiles only.

- 12 Nov, owner: a light Meshy firefly in place of the Blender fallback ("Có"). `tools/meshy/decimate.py` made
  `raw-models/remesh/firefly-9000.glb` (31k to 9k triangles, no credits); fit as usual (`lid_grid_far` 44 so the light
  lids cover the lashes): `creature-firefly.glb` 386 KB. Audit 112 cases, 0 failing with the limits in firefly.json
  (reasons there). Film `film/firefly-far.mp4`. Approved by the owner (12 Nov 2026 AEDT, "Duyệt") and committed.

- 12 Nov, small tasks (owner: "Việc nhỏ 1-4"): `worldcreatures` passes with a Meshy-companion rule (the owner's height
  from the fit json, the middle on the companion box in `tools/blender/creatures-spec.json`, 21,000 triangles for a light
  model; reasons in the check). A 7k firefly body to fit the old 16,000 broke her shut-eye line, so it was not used.
  Dragon light lids `lid_grid_far` 28: the happy face's lash marks gone; owner approved, committed. Audit firefly+dragon
  224 cases 0 failing. Board: "ready for Release".

## Next steps
1. Server: `node <scratch>/serve.mjs D:/WorkSpace/sv-meshy-pets 8777` (or launch entry `pets-game`).
2. One pet at a time: `powershell -File tools/meshy/make_animal.ps1 -Kind <kind> -Out D:\WorkSpace\meshy\pets\<kind>-N`
   (add `-Quick` while tuning). Never two auditors on one server. Look at `audit\summary.txt`, every marked picture,
   then the close shots (`shots\`) in sets of four at full size. Weights: `tools/meshy/weight_colours.py`.
3. Order: panda neck, bunny hats, calf rebuild (size, lashes, tail), joey upright mode.
4. Owner's look per pet (pop-up), then skills (PLAN.md) and the calf's name.
5. Checks: `SV_URL=http://localhost:8777/ node suite.mts --only worldcreatures,petskills,companionhats,companiongoal,animalhomes,phone --jobs 1`.

## Running here
- Own server: `node <scratch>/serve.mjs D:/WorkSpace/sv-meshy-pets 8777` (127.0.0.1), or the `pets-game` entry in
  `D:\WorkSpace\.claude\launch.json`. Never use port 8765 (the friends' auditor).
- Blender: `C:\Users\nguye\tools\blender-4.2.23-windows-x64\blender.exe`; Python for pictures:
  `D:\WorkSpace\meshy\tools\pyenv\Scripts\python.exe`. After any `js/*.ts` change: `node tools/build.mts`.
- The machine is shared and slow: run long jobs in the background, page timeouts are raised in the tools.
