# Sparkle Valley: Meshy production

7 November 2026 AEDT. Branch `meshy-production-20261107`, based on undeployed `integrate/v108` at `d51e062e5894a2229bd62e7b429dec87a9787a8f`.

Latest combined state: [owner image corrections](OWNER-CORRECTIONS-20261107.md) are merged with [Clara pilot work](CLARA-PILOT.md) through 48a4fdca8. The ledger records 70 credits already charged on the owner PC; completed task history is preserved. The current corrected Clara images are a separate unsubmitted draft, not the inputs used by past paid tasks. Earlier zero-spend/account-blocked statements describe this cloud reference phase. No extra paid call was made for the image corrections. Read the combined takeover update before using the batch builder.

## Reference phase complete

- **43 turnaround sheets and 128 separate view crops** generated, saved and technically reviewed. [View all pictures](GALLERY.md); GitHub renders this Markdown gallery on phones. [HTML gallery](gallery.html) is also included for a local/preview web server; GitHub displays HTML as source.
- Owner supplied the young-Clara style image in this chat. [Provenance](REFERENCE-PROVENANCE.json) explicitly distinguishes that inline original from the generated local style anchor. Finn/Sol/Lumi also use the repository concepts. No final owner approval is implied by technical review.
- Corrections retained: Clara side direction; unrequested pet collars/bells; folded dragon wings; firefly dorsal view. Sol's transparent variant is separate from the grey-background production input.
- All 43 [job specifications](job-specifications), source prompts, hashes, crop coordinates, intended runtime destinations and initial [credit ledger](CREDIT-LEDGER.json) are saved.
- [Offline-tested batch runner](BATCH-RUNNER.md) supports explicit submission, durable duplicate/budget protection, polling, lost-response reconciliation and safe raw GLB download. No authenticated provider or paid call has been made.
- [Official pricing/API verification](OFFICIAL-MESHY-VERIFICATION.md): explicit model IDs and 30/15-credit prices match the 990-credit plan. Actual account balance/private settings and API entitlement remain unverified. No Meshy credential is bound.
- **0 new Meshy models, 0 credits spent, 0 new models rigged/integrated/deployed.** Full production is not complete. See [current status and remaining work](CURRENT-STATUS.md).
- [Additional owner rules](ADDITIONAL-REFERENCE-RULES.md) govern future sheets. The owner supplied all 61 regional descriptions; generation is tracked separately in [the regional pack](../meshy-regional-40-100/README.md), outside the original 43-model credit budget.

## Review and handoff

[Original owner plan](OWNER-PRODUCTION-PLAN.md) · [Roster](ASSETS.md) · [Execution steps](NEXT-STEPS.md) · [v1.08 compatibility](V108-COMPATIBILITY.md) · [Readiness](READINESS.json) · [Validation](VALIDATION.json).

Phone and desktop gallery screenshots are saved beside this README. These validate the review gallery, not game rendering with new 3D assets. A tablet screenshot is also included when recorded in validation.

## Tools

- `python tools/meshy/check_readiness.py`: offline roster/budget/hash/image availability checks.
- `python tools/meshy/save_references.py --crop-reviewed`: reproducible lossless crops using manifest coordinates; original sheets remain intact.
- `python tools/meshy/build_reference_pack.py`: regenerate gallery/job specifications from the reviewed files, preserving an existing credit ledger.
- `python tools/meshy/run_batch.py plan`: offline paid-batch summary; see the runner handbook before any other command.
- `python tools/meshy/test_batch.py`: expense/idempotency protection tests using fake transports only.

Do not rerun `prepare_references.py` to reset a progressed manifest. Do not run the obsolete five-character/single-image `tools/blender/make-3d.py` against this batch.

No runtime asset, subscription, payment, main merge, deployment or version was changed.
