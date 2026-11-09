# Handoff: the four friends on their own Meshy heads (9 Nov 2026)

For a new Claude session or account taking over on the owner's PC. Read `.claude/skills/meshy-characters/SKILL.md` first: the owner's rules there override everything.

## Update, 10 Nov 2026 (read this first)

- **The four friends' models are on the branch** (owner, 10 Nov: "Tất cả mọi việc đẩy lên nhánh"), commit 40d44b765 and later. Not merged, not deployed, no version change.
- **Audit round 66** (`D:\WorkSpace\meshy\fitted\audit-f66`, a refit of all four; these models are on the branch): 302 of 944 cases fail. There are no swim kit, eye, skin tone or hair tone faults. What is left:
  - holes 133, folds 108, tears 115 and pokes 56, mostly áo dài (holes and folds in side views), rain (tears) and festival;
  - poses run, sit, climb, jump and cheer.
- **Fixed on 10 Nov, each checked in game pictures:**
  - Lumi's closed eyes from every side. The shut-eye paint never ran before: gltfpack stores positions as whole numbers, so `uDeq` in `js/friend-model.ts` now turns them back to metres. The waist and neck tests had the same bug.
  - Finn's streaks before the ears: the blink mood piece was too wide.
  - Lumi's shorts showing through her shirt's back and sides. Shirts now cover the trunk under the armpits (`ARMPIT` in `make_clothes.py`), and trousers and shorts above a top's local hem are hidden.
  - The ankle gap: boots now cover the bare feet.
- **Known false alarms in the auditor (next fix there):**
  - "Holes" between the legs in run and walk side views. With nothing hidden, the body's stretched crotch webbing fills that space, so the gap is counted. It is really the gap between the legs.
  - "Folds" of white trousers seen through the áo dài slits: same colour, hardly visible.
- **Next real fixes:**
  - Lumi festival sit front: the skirt's front swings up with the thighs, and you see inside the skirt (`skirtF` bone angles in `follow()`, `js/friend-model.ts`).
  - Clara's rain and everyday run left: tears.
  - Lumi's left shoulder is a little ragged when she cheers.
  - Sol's trouser cuffs are a little ragged just above the boots.
- **Tools added:**
  - `HIDE=<garment|face>` in `game_shots.mts`, to tell which layer shows.
  - `poses:<list>,pics` in `audit.mts`, to keep every case's picture and layers.
  - Rendering one garment alone in Blender (workbench) finds holes in a garment fast; see SKILL.md lessons.

## Update, 9 Nov 2026 evening

- Plan and tools for working at scale: `docs/meshy-pipeline-20261109/PLAN.md` and the skill's "Working at scale".
- One command: `powershell -File tools/meshy/make_character.ps1 -Batch clara,sol,finn,lumi -Kind friend -SkipFit -Out <dir>`
  (build, install in the working copy, full audit; exit 2 when the audit fails). Self-test of the auditor:
  `powershell -File tools/meshy/audit_selftest.ps1`.
- Owner's decisions: keep the full poses and fix the cloth (helper bones, the polished way); tier C merged into tier B
  (every villager and animal gets the full audit and review); commit AND push to GitHub about every 2 hours.
- Latest audit rounds: `D:\WorkSpace\meshyittedudit-f*` (summary.txt, cases.json, fault and layer pictures).
  Remaining at round 18: pokes and folds when the arms are raised high and when sitting, Lumi's bib losing its shape.
- Models in `models/` are the working copy only; they go on the branch after the owner approves.

## Owner's rules (short)

- Branch `meshy-production-20261107`, worktree `D:\WorkSpace\sv-meshy-prod`.
- Never merge main, deploy or bump the version.
- **No new Meshy spending without the owner's approval in chat.**
  - Never retry a paid request.
  - Never print or commit `MESHY_API_KEY`.
  - Journal: `D:\WorkSpace\meshy\private\meshy-jobs.sqlite3`.
- **Nothing goes on the branch until the owner approves in-game close-ups.**
  - Look at every sheet at full size yourself first. Test numbers and Blender renders hid problems before.
- Write each method you learn into the skill.
- Reply to the owner in Vietnamese, short and plain.

## State

- **Friends Finn, Sol, Clara and Lumi:**
  - The owner chose the **own-head way (B)**: the whole Meshy swim model with its own face moods, and clothes made in code.
  - Latest build (round r59, 9 Nov evening: hair found as one piece in the skin mark, so Clara's braids, Sol's temple curls and Finn's fringe keep their colour on every tone; smoother shirt shading) is at `D:\WorkSpace\meshy\fitted\review-r59-20261109\` (same files and sheets as below). r57 is kept in `review-B2-20261109`.
  - That folder holds `<id>.glb`, `<id>-hd.glb` and the sheets `1-mat.png` (eyes), `2-mau-da.jpg` (skin tones) and `3-quan-ao.jpg` (outfits).
  - The sheets were sent to the owner and are **waiting for approval**.
- **Checks:** all 7 pass with these models installed:
  - friendmodel, friendoutfits, friendswap, wearfit, frienditems, faces, villagermodels.
- **Sizes:** light models 423, 383, 450 and 386 KB, under the 500 KB limit. HD models are 1.5 to 1.9 MB.
- **The branch has the tools only** (last commit `fddad6fc3`). `models/` on the branch still holds the old models.
- **Spending:** no new Meshy credits were spent on 9 Nov. The swim bodies were paid for on 8 Nov.

## Known small issues left

- (r59) Seen from the side, a faint lighter patch on Sol's cheek where a face piece ends.
- (r59) Finn's dark locks before the ear are Meshy's own sideburn hair, not a fault; ask the owner whether to remove them.
- On the darkest skin tone, a few small flecks remain at the edge of Clara's hair beside her cheek.
- Finn and Sol each have a small dot in the middle of the collar (a push-out fix was tried on 9 Nov and failed: see the skill).
- Paths in "When the owner approves" below: use `review-r59-20261109` once r59 is approved.
- Garments are flat colour (no fabric picture).

## When the owner approves

1. Install the approved files:
   ```
   foreach($id in "finn","sol","clara","lumi"){ Copy-Item "D:\WorkSpace\meshy\fitted\review-B2-20261109\$id.glb" models\$id.glb -Force; Copy-Item "D:\WorkSpace\meshy\fitted\review-B2-20261109\$id-hd.glb" models\$id-hd.glb -Force }
   ```
2. Run the checks from `tests/`:
   ```
   node run.mts friendmodel friendoutfits friendswap wearfit frienditems faces villagermodels
   ```
3. Commit `models/` with a message naming the approval.
4. Push the branch. Never merge.

## Rebuilding one friend (after a tool change)

```
powershell -File tools/meshy/fit_person.ps1 -Id <id>-swim -Ref D:\WorkSpace\meshy\work-v108\<id>-game-hd.glb -Prefix <id>-
powershell -File tools/meshy/dress_own.ps1 -Id <id>
```

Then copy the packed files from `D:\WorkSpace\meshy\fitted\<id>-own\` into `models\` (working copy only) and take the shots from `tests/`:

```
node ..\tools\meshy\game_shots.mts D:/WorkSpace/meshy/fitted/<round>-faces faces finn,sol,clara,lumi
node ..\tools\meshy\game_shots.mts D:/WorkSpace/meshy/fitted/<round>-tones tones finn,sol,clara,lumi
node ..\tools\meshy\game_shots.mts D:/WorkSpace/meshy/fitted/<round>-outfits outfits finn,sol,clara,lumi
```

Make the sheets with `D:\WorkSpace\meshy\tools\pyenv\Scripts\python.exe tools/meshy/review_sheets.py <eyes|chins|tones|outfits> <shots dir> finn,sol,clara,lumi <out.jpg>`.

Before committing tools, restore the branch files:

```
git checkout -- models content/management-catalogue.json tests/check-times.json
```

## Next work (after the friends are approved)

- **The 11 villagers:** rebuild with the same own-face method and review them the same way. They have no shop, so they stay whole Meshy models.
- **Regional villagers (61):** no budget approved yet.
- **Animals, pets and companions:** plan a dog pilot with a four-legged rig. Ask the owner before any spending.
- **More chats or accounts:** once a method is approved, the work can be split. One chat per group, never two chats on the same files, and paid Meshy jobs on one journal per group.
