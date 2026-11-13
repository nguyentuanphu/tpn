# Meshy characters at scale: plan (9 Nov 2026)

Owner, 9 Nov 2026: the four friends' outfits are temporary; dozens more outfits, hats and gear are coming, and dozens of
villagers and animals will be made with Meshy. Four friends took days. Tools must make them in bulk, fast and right, and
every friend, villager and animal must have emotions.

## Principles

1. **The auditor is the gate, not the owner's eyes.** Every build runs `tools/meshy/audit.mts` (in the game: every
   outfit, pose, view, skin tone and mood). A build goes to the owner only when every count is under its limit, with the
   numbers and the fault pictures. The owner reviews look and style, not defects.
2. **Data, not code, for each new thing.** A new outfit, hat or piece of gear is a row in a table (its shape type, the body
   region it covers, thickness, layer, colours, sockets), not a new branch in a script.
3. **One command per character**, start to end, failing loudly: fit, face moods, (friends) clothes, pack, audit, sheets.
4. **One method per kind of body**, proven on one character, then run on all of that kind (people, four-legged
   animals, birds ...).
5. **No Meshy credits without the owner's yes in chat.** The pipeline runs on models already paid for; new paid jobs
   are listed and approved first.

## The pieces

### A. Auditor (`tools/meshy/audit.mts`), first version 9 Nov
Measured per case, painted magenta in the fault pictures, summary in `summary.txt`:
- `kit`: the grey swim kit visible while dressed.
- `poke`: body or an inner layer visible inside an outer garment, less than 1.2 cm in front of it (ID + depth pictures).
- `hairtone`: hair-coloured pixels that darken with the skin tone.
- `skintone`: skin-coloured pixels that do not change with the tone.
To add: `eyes` (white or iris left when eyes are closed, every mood, every side), `mouth` (mood pieces' edges seen from
the side), `gap` (holes: background seen through a garment), `float` (a hat or gear off its socket), `size` (light model
over 500 KB), and the same for villagers (no clothes) and animals.

### B. Garments as data (`tools/meshy/garments.json`)
Each garment: `kind` shell (copied from the body's surface) | cone (hung from the waist) | part (a fixed mesh fitted to a
socket: hats, glasses, backpacks), the region (`top`, `hem`, `sleeve`, `leg` as fractions along the body's own joints),
`thick`, `layer` (0 inner, 1 tops, 2 outer, 3 shoes and hats), and its cover bit. `make_clothes.py` reads the table; the
game reads the same table (cover bits, layers) so they never disagree.

### C. Garments that move right
- Body and inner layers under a worn garment are not drawn (done 9 Nov).
- Hems follow the thighs: the lowest band of a top takes part of the leg weights.
- Skirts and the áo dài's panels: weights from both legs, smoothed, so the front panel moves with the front leg.
- Armpits: garment weights smoothed round the shoulder so raised arms do not fold the shirt inside out.
- Checked by the auditor in walk, run, cheer, wave, dance, jump, sit and climb.

### D. Emotions for everyone
- People (friends, villagers): their own painted face, mood pieces over the eyes and mouth (`fit_people.py`), already
  in use; the auditor checks every mood.
- Animals: the same idea on an animal face (eyes and mouth found on the painted face), plus body emotes in the
  animation (ears, tail, head tilt, hop). A pilot on one dog first, with a four-legged rig, before any batch.

### E. One command
`tools/meshy/make_character.ps1 -Id <id> -Kind friend|villager|animal` runs everything above and stops at the first
failure; `-Batch <list>` runs many overnight and writes one report.

## Owner, 9 Nov 2026 (evening): "cái nào đẹp và chỉn chu hơn thì làm"; push every 3 hours

- Hard poses keep their full range (arms up, sitting); the clothes are fixed with corrective helper bones at the
  shoulders and hips (the polished way), not by limiting the poses.
- Commit and push the branch about every 2 hours (owner: the account may run out of usage) (tools and game code; models only after approval).

## What the auditor still needs to be trustworthy

1. **Tested itself:** a set of planted faults (cover bits removed, a braid toned, a hole cut in a shirt, an eye left
   open) that every check must catch, and clean references where every check must stay quiet. Run before trusting a
   round's numbers.
2. **Full coverage:** each animation sampled over its whole cycle (not one frame), eight views plus from above and below,
   near and far (the light model), day and night, every mood, every outfit and accessory.
3. **More checks:** shapes against the design (a bib must stay a bib: silhouette compared with the rest pose), flicker
   between frames (z-fighting), hats and gear on their sockets, feet on the ground, hair through shoulders, mouths in
   every mood, likeness to the ChatGPT reference sheet, budgets (triangles, KB, bones, influences per vertex).
4. **A review page** for the owner: worst first, before/after against the last approved version, approve buttons, so
   the owner looks only at style and at what the checks cannot judge.
5. **Speed:** several browsers in parallel, unchanged characters skipped, quick mode while working, full mode before a
   round goes out.

## Tools for bulk work

- Reference-sheet check before paying Meshy (views agree, body only, proportions, no props in hands).
- Meshy queue with the owner's approved budget and the ledger (exists: `overnight.ps1`, journal).
- Rig check (joints where they belong) and one animation set per skeleton type: child, adult, elder, four-legged,
  bird; driven helper bones (skirts, shoulders, ears, tails).
- Faces and moods per kind: people (own painted face, mood pieces), animals (eyes and mouth found on the animal face,
  plus body emotes: ears, tail, head tilt, hop).
- Garments and gear as data (`garments.json`, sockets for hats, glasses, backs).
- One command per character and per batch, with the audit gate and the review page.

## Quality tiers

- **Tier A, the four friends (the player's own character):** body plus code-made clothes that change, every pose,
  every tone, every mood, full audit, helper bones, hand review of every sheet.
- **Tier B, every villager (the 11 named and the 61 regional) and every animal** (owner, 9 Nov 2026: "Mức C gộp chung
  mức B"): whole Meshy models (clothes painted on, no changing), own face moods, their own animations (idle, walk, talk,
  wave, sit; animals by skeleton type), the full audit of all of those, and the owner's review of each, run in batches.

## Order

1. Auditor without false alarms; eyes and mouth checks added. Run on the four friends.
2. Garment table; `make_clothes.py` reads it (same results as today first, then new outfits are rows).
3. Moving garments (C) until the auditor passes every pose.
4. `make_character.ps1` with the audit gate; the four friends through it; then to the owner.
5. Villagers (11) through the same command, no clothes, moods checked.
6. Animal pilot (one dog), with the owner's approval for any spend.
