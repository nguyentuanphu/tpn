# v1.08c blender: status (blender helper, started 5 Nov 2026 7:30 pm AEDT)

Branch `work/v108c-blender` from `origin/work/v108b-story`. Brief: `blender-brief.md`. The owner's go is given (5 Nov 2026 AEDT). Only Release merges and runs the full suite.

A scheduled task wakes this chat at 0:40, 5:40, 10:40, 15:40 and 20:40 AEDT (the owner: usage resets every 5 hours, from 12:40 am); it carries on from the last pushed part.

## Plan
1. **Costume kit** (`tools/blender/costumes.py`, run inside `lumi.py` as `role=kit-<id>`): 16 period outfits with their hair, headwear and shoes, made once on the game's villager body; front and three-quarter renders in `docs/characters-v108/costumes/`. The same ids in the game: `js/film-costume.ts` dresses a film actor with `LOOK({ kit: '<id>' })` in the kit's colours and shapes; the tale films' looks move to the kit where the story helper's dress differs (áo dài inside an old tale becomes áo tứ thân, tunics become áo nâu or áo the, and so on).
2. **Story pages redrawn** from the Blender characters, costumes and sets, 60-100 KB each, loaded with the tale; the 20 Vietnamese tales first.
3. **Five Blender films** (Bánh Chưng Bánh Giầy, Chú Cuội, Tấm Cám, Thánh Gióng, The Rainbow Serpent), about 1 minute, 720p, 4-6 MB, EN and VI female narration; downloaded when opened and kept for offline; help moments pause with the tap ring; the in-game film when offline; the four friends only as storytellers at the start and end.
4. **In-game film polish** (`js/film.ts`): lips with the voice, light depth blur, soft light by the story's time of day.

## Progress
- Part 1: in progress.

## Checks
(filled in per part)

## Owner's decisions
- 5 Nov 2026 AEDT (chat): a scheduled task resumes the work after each usage reset (every 5 hours from 12:40 am AEDT).
