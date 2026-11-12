# Sparkle Valley — farm cloud trial

13/11/2026 AEDT. Branch `meshy-farm-cloud`, based on `origin/meshy-pets` at `a89a0b877`.

Owner scope: cow (25), sheep (26), chicken (24) only. Each: Meshy 7.1 standard, 2k, three recorded views (30 credits), remesh 30k (5), remesh 9k **from 30k** (5). Total ceiling 120. Ask before every paid command; no rigging, fitting, runtime changes, merge, deployment or version bump.

Balance verified by GET `/openapi/v1/balance` at 08:06:01 AEDT: **1614** (1599 monthly + 15 permanent). Owner approved cow original via pop-up. Exactly one paid POST submitted. Balance after submission: **1584**; charged **30/120**. Task SUCCEEDED and GLB downloaded immediately.

Private files (never commit/upload): `/workspace/meshy-farm-account.json`, `/workspace/meshy-jobs-farm.sqlite3`. New journal; cow original reserved/submitted, remesh table empty. Key comes only from cloud `MESHY_API_KEY`. Reserve before POST, never resend; uncertainty/failure means stop and reconcile. Existing 35 paid models and prior pet tasks are outside this trial and must never be resubmitted.

Runner exception is restricted to these three group E assets with tierOverride, 30-credit spec and approval text; live submission also requires approvedTierOverrides and verified balance/cap in external account metadata. Other groups retain their tier rules. Farm remesh requires the same account metadata, enforces cumulative jobs+remesh cap and the 30k→9k chain.

Offline validation: existing `test_batch.py` 14 tests PASS; `test_farm.py` PASS; all three `check` commands PASS (nine image hashes verified, zero network calls). Suite selection requests full suite because the source branch differs widely from main; no local full suite run. No game/UI changes.

## Outputs and review — pending generation

| Animal | Original task | 30k task | 9k task | Charged | Face / legs / coat / holes |
|---|---|---|---|---|---|
| cow | `01a1d19a-7a61-7711-9f5a-8687a2c45778` | pending | pending | 30 | Original four views reviewed: eyes and pink muzzle/nostrils clear; four legs/hooves separate, short black/white coat and tail tuft intact; no obvious holes/broken geometry in these views (not a topology guarantee). |
| sheep | pending | pending | pending | 0 | Not generated; not reviewed |
| chicken | pending | pending | pending | 0 | Not generated; not reviewed |

Download each successful GLB immediately to external raw storage, then copy delivery files here. Deliver original, 30k, 9k and four-angle previews for each animal. Archive any file over 50 MB and record its path. Inspect eyes, muzzle/beak, nose, legs, fur/wool/feathers and holes/broken geometry before reporting quality. Signed URLs stay in the private journal only.

## Next paid command (requires owner answer)

From repository root:

```sh
python tools/meshy/run_batch.py submit --asset cow --journal /workspace/meshy-jobs-farm.sqlite3 --account /workspace/meshy-farm-account.json
```

This command makes one POST, reserving 30 credits first. It does not authorize any remesh or other animal.

## Cow original — 13/11/2026 08:14 AEDT

- Owner explicitly approved this 30-credit POST via pop-up; no other paid step approved yet.
- Task `01a1d19a-7a61-7711-9f5a-8687a2c45778`: SUCCEEDED.
- [Original GLB](cow/original.glb): 39,939,624 bytes, 1,293,114 triangles; SHA256 `e38895cdad1d7a01559dcef3207762a1a041ebb632e506ca86ed8f770eb3639a`.
- Raw model rendered directly using repository Three.js/GLTFLoader and headless Chromium (no Blender/fitting). Four reviewed views: [front](cow/original-front.png), [left](cow/original-left.png), [back](cow/original-back.png), [right](cow/original-right.png).
- Face: large brown eyes with white rims; pink rounded muzzle, two visible nostrils and subtle mouth line. Short white/black fur, forehead tufts and tail tuft visible. Four legs and cloven hooves appear intact. No obvious holes or shattered parts in the four static views; underside/interior and animation not checked.
- Balance 1614 → 1584; observed charge 30. Remesh 30k and 9k not submitted. Sheep/chicken not submitted.
- Next paid command, only after separate owner approval:

```sh
python tools/meshy/remesh_once.py submit --source-asset cow --polycount 30000 --approved --journal /workspace/meshy-jobs-farm.sqlite3 --account /workspace/meshy-farm-account.json
```

Cost 5 credits; cumulative total would become 35/120. Never resend original cow.
