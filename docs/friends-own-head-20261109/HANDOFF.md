# Handoff: the four friends on their own Meshy heads (9 Nov 2026)

For a new Claude session or account taking over on the owner's PC. Read `.claude/skills/meshy-characters/SKILL.md` first: the owner's rules there override everything.

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
  - Latest build (round r57) is at `D:\WorkSpace\meshy\fitted\review-B2-20261109\`.
  - That folder holds `<id>.glb`, `<id>-hd.glb` and the sheets `1-mat.png` (eyes), `2-mau-da.jpg` (skin tones) and `3-quan-ao.jpg` (outfits).
  - The sheets were sent to the owner and are **waiting for approval**.
- **Checks:** all 7 pass with these models installed:
  - friendmodel, friendoutfits, friendswap, wearfit, frienditems, faces, villagermodels.
- **Sizes:** light models 423, 383, 450 and 386 KB, under the 500 KB limit. HD models are 1.5 to 1.9 MB.
- **The branch has the tools only** (last commit `fddad6fc3`). `models/` on the branch still holds the old models.
- **Spending:** no new Meshy credits were spent on 9 Nov. The swim bodies were paid for on 8 Nov.

## Known small issues left

- When Clara's right eye is closed, a tiny light speck stays at its inner corner.
- On the darkest skin tone, a few small flecks remain at the edge of Clara's hair beside her cheek.
- Finn and Sol each have a small dot in the middle of the collar.
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
