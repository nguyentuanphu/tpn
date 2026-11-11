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

- 11 Nov afternoon (this chat): the mouth piece had silently used the lids' picture size and grid (a `TP = ...` hidden
  behind a `#` comment in the middle of its line): fixed, the mouth has its own 96 px picture again (the firefly was
  822 KB, over 800). The lash line on the lids is drawn with soft edges (was stair steps). Firefly lids: `lid_out`
  (moved outwards over lashes that flick out), `lid_wide` 1.2, `lid_px` 176. Debug fit writes `<kind>-lidsrc<i>.png`
  (the painted face, the eye found in red, the lid's edge in green). Dragon close shots (09:23 models) looked at: fine.

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
