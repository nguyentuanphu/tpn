# Production status — 7 November 2026 AEDT

**Overnight update, 8 Nov 2026 (owner asleep; authorised: up to 1,000 credits, skin shifted from the original, on the
branch, puppy too).** `tools/meshy/overnight.ps1` ran the people in plan order (model 30, remesh 30k 5, remesh 9k 5,
Meshy rig 5 = 45 each), never retrying a paid call. CREDIT-LEDGER.json is now synced from the private journal by
`tools/meshy/ledger_sync.py`. On the branch (not main, not deployed): Clara, Finn, Sol and Lumi (light + high-detail,
all 12 friend checks pass) and all 11 named villagers (`models/villager-<id>.glb`, one ~1 MB model each, 512 px
picture; `fit_person.ps1 -Villager`). Face pictures: closed lids cover the whole eye, the two eye boxes mirror each
other, the glance moves a round iris; the hair colour is also sampled from the back of the head (a hat such as Mai's
nón lá is not hair). Known: the friends' light models (288 px) look patchy at a three-quarter view up close (the
high-detail model is used close up); the puppy is generated for review only (the valley's animals are code-built;
an animal model path is new runtime work for the owner to decide; review renders in D:\WorkSpace\meshy\fitted\puppy). Regional sheets: none in chatgpt-fixes yet. Batch finished: balance 3,049 -> 2,304, 745 credits in all (675 overnight, under the 1,000 cap); the ledger matches.

**Latest combined update:** reference corrections merged with pilot work through 48a4fdca8. CREDIT-LEDGER.json records 70 credits total (pilot 30, revision 30, remesh 5, rig 5), with reported balance 2,979 on the owner PC. Existing tasks/raw downloads/fitting tools are preserved. The corrected Clara sheet and kaftan sheet are uploaded separately from historical submitted inputs; no additional Meshy task was made by this correction. Read CLARA-PILOT.md and OWNER-CORRECTIONS-20261107.md before continuing. Earlier zero-spend/account-blocked paragraphs below describe the initial reference phase and are superseded by these pilot records. No runtime replacement or deployment.


**Update, 7 Nov 2026 evening: account verified, Clara pilot generated and fitted, not integrated.** See
[CLARA-PILOT.md](CLARA-PILOT.md). Key bound on the owner's PC; balance 3,049 → 3,019 after the one 30-credit pilot job
(task `01a1b551-4e41-7544-a5da-564f88acc6f3`); raw GLB outside the repository. Pilot quality is high but has four
braids (the reviewed back view disagrees with the front/side); fitting trims them. `tools/meshy/fit_people.py`
(recreated people fitter), `tools/meshy/render_views.py` and `joints/clara.json` added. **Blocked on the owner:**
pilot acceptance, and the face path (v1.08 tests require the sculpted `face3d`; the fitted pilot uses face pictures).
Recommended before more paid jobs: check every remaining sheet's views for front/back disagreements. Remaining 42
original assets unsubmitted (960 planned credits); the 61 regional assets still have no budget or runtime mapping.
No runtime model replaced, no merge, deploy or version change.

The original reference-image phase is complete. Full 3D production is blocked by account access; no new runtime model is claimed complete.

## Completed

- Original owner plan preserved, 43-asset roster and prompts, v1.08 runtime compatibility review.
- 43 turnaround sheets, 128 separate lossless crops, technical visual review, correction attempts retained, prompt/source/hash/crop provenance.
- Sol transparent variant preserved separately; grey-background Meshy inputs intact.
- Phone/desktop gallery browser checks: 43 cards, 171 image links all HTTP 200, no horizontal overflow. These are gallery checks, not new game-model renders.
- Published Meshy API model IDs, multi-image contract and 30/15-credit prices verified from official sources.
- 43 offline job specifications, 990-credit plan and 10-credit reserve; initial spending ledger zero.
- Batch runner implemented with persistent duplicate/lost-response/budget guards, polling/reconciliation and safe raw GLB download. Ten offline tests passed. No authenticated provider call made.

## Blocked until account access is supplied securely

- No MESHY_API_KEY binding, authenticated account verification or usable API balance is available.
- Confirm actual account credit balance/private settings; Pro membership does not establish usable API balance automatically. No subscription purchase has occurred.
- Submit Clara pilot, inspect geometry/textures, then generate/download the remaining original assets in A–G order. All 43 new Meshy models remain unsubmitted; credits spent zero.

## After raw generation

- Obtain/recreate external clara/scripts/fit2.py; joint annotations, people fitting, skin/material/face compatibility, light/high-detail exports.
- Puppy fitting pilot before bulk animals; species-specific skeletons, neutral pose/animation validation and companion bob/flap rigs.
- Runtime integration, texture/memory/startup budgets, dressing/riding/moods/skin tones/save/offline fallbacks, phone/tablet/computer game renders and relevant release checks.
- Main merge, version selection and deployment remain separate release decisions.

## Additional regional batch

Owner supplied 61 more references in chatgpt-messages-40-100.md. All 61 sheets and 183 crops are generated and technically reviewed in ../meshy-regional-40-100/ with separate IDs because the source numbers overlap the original roster at 40–43. Both rosters are preserved. The additional batch has no paid 3D budget recorded and must not consume the original 990-credit allocation.
