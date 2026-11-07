# Character production takeover

Branch: `meshy-production-20261107`. Base: undeployed `integrate/v108` at d51e062e5894a2229bd62e7b429dec87a9787a8f. Main remains unchanged.

Latest owner corrections: [Clara forward braids and coastal grandmother sleeves](meshy-production-20261107/OWNER-CORRECTIONS-20261107.md). Use these corrected sheets/crops for future fitting; preserve the historical anchor only as provenance.

## Latest merged pilot status takes precedence

Concurrent work through 48a4fdca8 has been preserved: Clara pilot, revision, remesh and rig records, 70 credits charged, reported remaining balance 2,979 on the owner PC. Read [CLARA-PILOT.md](meshy-production-20261107/CLARA-PILOT.md) and the live credit ledger before any paid work. The key/raw models/journal are on the owner PC, not supplied to this cloud environment. No completed task may be resubmitted or reset because current image hashes differ.

People fitting tools now exist as tools/meshy/fit_people.py, render_views.py, pose_check.py and the pilot joints files. Inspect them before recreating the fitting pipeline. Runtime face compatibility/pilot acceptance and bulk fitting remain open; no runtime deployment is claimed.

Submitted job specifications retain their OLD input hashes. Corrected Clara images have a separate unsubmitted draft, 01-clara-current-reference.json. Do not rerun build_reference_pack.py until its writer preserves submitted specifications; protecting that history is an explicit pending handoff task. Earlier zero-spend/no-GLB/account-missing statements below describe the initial reference phase and are superseded by the merged pilot records.

## Read these first

1. [Original owner production plan](meshy-production-20261107/OWNER-PRODUCTION-PLAN.md).
2. [Original 43-reference pack](meshy-production-20261107/README.md), [gallery](meshy-production-20261107/GALLERY.md), [current status](meshy-production-20261107/CURRENT-STATUS.md), [validation](meshy-production-20261107/VALIDATION.json).
3. [61 additional regional lines](meshy-regional-40-100/OWNER-MESSAGES.md), [supplementary owner rules](meshy-regional-40-100/RULES.md), [regional gallery](meshy-regional-40-100/GALLERY.md), [manifest](meshy-regional-40-100/ASSET-MANIFEST.json).
4. [v1.08 model compatibility](meshy-production-20261107/V108-COMPATIBILITY.md), [batch runner handbook](meshy-production-20261107/BATCH-RUNNER.md), [official API/pricing verification](meshy-production-20261107/OFFICIAL-MESHY-VERIFICATION.md).

## Scope and truth

The original 43 images and the additional 61 descriptions are separate inventories: 104 completed reference sheets total, with 311 individual view images (firefly has only front/top). Original numbers 40–43 are generic crowd parents; new numbers 40–43 are different regional people. Separate IDs/folders preserve both; do not silently replace them or claim there are only 100 distinct references.

Reference images are not GLB models. Technical image review is separate from owner approval, independent provider review and runtime validation. The image manifest is the per-item source of truth. The original Clara upload was inline without a downloadable file ID: the generated style anchor is identified honestly, not passed off as the original.

Only the original 43 models have the supplied 990-credit plan plus 10 reserve. No additional 61-model credit budget was approved or recorded. Public Meshy API IDs and 30/15-credit prices were verified; usable API balance, account settings and credentials were not. The initial reference phase made no paid calls or model generation. Subsequent merged pilot work records 70 credits and Clara generation/remesh/rigging; no runtime replacement, version bump or deployment is claimed.

## Continue 3D production

1. Check repo status and both manifests; inspect the final validation reports. Keep current source/provenance and correction attempts intact.
2. Verify account/API credit balance and private settings, then bind MESHY_API_KEY securely in environment settings. Never ask for a key in chat or commit it. Web-app free retries do not establish API retry entitlement.
3. Use tools/meshy/run_batch.py and BATCH-RUNNER.md. Default plan is offline. Its live SQLite journal and account metadata must live outside the repo; reuse one journal. No automatic POST retries: ambiguous responses reserve credits and block the batch until matched to known tasks.
4. Submit original Clara pilot first. Poll/download and review the actual geometry and textures before accepting the pilot and continuing A → G. The runner is offline-tested, not authenticated-provider validated. Keep raw downloads outside runtime destinations.
5. Obtain/recreate external clara/scripts/fit2.py: it is not in this repo. Fit people to actual v1.08 joints/material/face conventions; annotate joints, preserve skin shade/grip and moods, export light/high-detail versions. Do not assume a texture atlas works with the existing procedural materials or dressing system.
6. Prove one puppy conversion before processing other animal shapes; current world-creature Blender generation does not mean arbitrary Meshy geometry is fitted. Rig flying companions separately. Verify riding, tail/ear movement and species-specific skeletons.
7. Assign the additional regional roster to actual game entities explicitly before choosing any runtime path. Confirm a separate 3D budget before submitting these extra models. Existing game mappings/fallbacks remain until replacements pass review.
8. Validate mesh/texture size, memory/startup, animations, face/skin controls, clothing/riding, save compatibility, absent/offline load fallback and phone/tablet/computer renders. Follow tests/suite.mts; full release testing runs on GitHub. Read current repo rules before editing runtime.
9. Work on this review branch. Do not merge main, deploy or change the version without the owner’s release instruction.

## Copyable next-chat prompt

Continue character production in nguyentuanphu/tpn on branch meshy-production-20261107. Start with docs/CHARACTER-PRODUCTION-TAKEOVER.md and both referenced manifests/validation reports. Preserve the original 43-reference / 990-credit plan and the separate 61 regional references, their provenance, supplementary age/culture/pose/no-carried-equipment rules and distinct IDs. Review the saved galleries and per-item status before doing more image work. Reference images do not mean any new GLBs are complete. Verify Meshy account/API credit balance/private settings and secure MESHY_API_KEY binding; use the offline-tested durable batch runner for the original Clara pilot, then A–G. Never blindly repeat a paid POST. Obtain/recreate the missing people-fitting workflow, prove the puppy fitting pilot, rig companions, then validate actual v1.08 integration and device performance. The additional 61 models have no paid budget or runtime mappings yet. Record exact completed/blocked work on the board. Do not merge main, deploy, bump versions or spend beyond the recorded budget.
