# Handoff: pets and companions with Meshy (kept current every hour)

Last update: 11 Nov 2026 AEDT, 14:10 (new pets chat after the earlier one stopped at 12:48). Branch `meshy-pets`, worktree `D:\WorkSpace\sv-meshy-pets` (owner's PC). Never merge
main, deploy or bump the version. Reply to the owner in Vietnamese, short; ask with pop-up questions. Ask before every
Meshy use (paid), through the journal `D:\WorkSpace\meshy\private\meshy-jobs.sqlite3`, never retry a paid POST, never
print the key; after a paid run `python tools/meshy/ledger_sync.py`. Back up (commit + push) every hour.

Read first: `.claude/skills/meshy-characters/SKILL.md` (section "Animals"), `docs/meshy-pets-20261110/PLAN.md`.

## Where things stand
- **Puppy: done and approved** (owner 11 Nov "Okay approved"): models on the branch, pet scale 0.6, 18 moves,
  skills fetch / dig / lead the way, hats fitted, open mouth on the muzzle. Pets audit 232 cases, 0 failing.
- **Companions (dragon, firefly): in progress, models NOT committed** (working copy `models/world/creature-dragon*.glb`,
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

## Next steps
1. Rebuild both companions (`blender -b -P tools/meshy/fit_animal.py -- <kind> <near remesh> <far remesh> <out>`;
   firefly: near for both), pack with gltfpack `-cc -kn -km -ke -vp 12 -vt 10 -vn 6`, install `-hd` (and dragon far).
2. `cd tests; SV_URL=http://localhost:8777/ node ../tools/meshy/audit_pets.mts <out> dragon,firefly quick`, then full;
   look at every marked picture before changing a limit. Also re-audit `puppy` (the hat skull rule changed).
3. Pictures: `node ../tools/meshy/pet_shots.mts <out> companion dragon,firefly` (level 1 and 5, hat, with the child),
   `close dragon-hd,firefly-hd`, `mouth`, `legs` as needed.
4. Checks: `node suite.mts --only worldcreatures,petskills,companionhats,companiongoal,animalhomes,phone --jobs 1`.
5. Send the owner the sheets and ask approval (pop-up); then commit the companion models.
6. Afterwards: the other pets (kitty, bunny, panda, joey, calf) need Meshy credits (ask first) and their own skills
   (agreed proposal in PLAN.md).

## Running here
- Own server: `node <scratch>/serve.mjs D:/WorkSpace/sv-meshy-pets 8777` (127.0.0.1), or the `pets-game` entry in
  `D:\WorkSpace\.claude\launch.json`. Never use port 8765 (the friends' auditor).
- Blender: `C:\Users\nguye\tools\blender-4.2.23-windows-x64\blender.exe`; Python for pictures:
  `D:\WorkSpace\meshy\tools\pyenv\Scripts\python.exe`. After any `js/*.ts` change: `node tools/build.mts`.
- The machine is shared and slow: run long jobs in the background, page timeouts are raised in the tools.
