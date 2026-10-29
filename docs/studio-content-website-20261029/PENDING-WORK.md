# Pending workstream B work

Recorded 29 October 2026 AEDT at the owner's request. Delivered implementation and evidence: `ba9f7c43b87734bbcb7620787afd4a32f4275f74` on `work/studio-content-website-20261029`. Workstream B is handed off with the open items below; it is not fully complete.

| ID | Owner | Pending work | Completion evidence required |
|---|---|---|---|
| B-P01: spotdiff | B / next content worker | Define actual comparison rounds, difference targets, hints and accessible selection/completion rules; implement the intended game. Existing source is only a painting proposal. | Real launch, target validation, completion, early exit and preserved progress; EN/VI, touch/keyboard, age/difficulty, device layouts, existing release/item/progress gates and offline packaging |
| B-P02: hiddenpic | B / next content worker | Define hidden-object targets, placement, hints and found-state/completion rules; implement the intended game. Existing source is only a painting proposal. | The same functional, gate, accessibility, layout, progress and offline evidence as B-P01, including correct and incorrect target selection |
| B-P03: paperfold | B / next content worker | Define the intended folding sequence, crease interaction and progression; implement the intended game. Existing source paints a boat illustration without folding. | Actual fold progression and completion, recoverable exit, preserved progress, EN/VI/input/layout/gate/offline evidence |
| B-P04: rongran | Content decision, then B implementation | Resolve the distinct intended behavior and source requirements. No registration or implementation was found. Do not alias it to dragon or delete either stable ID to reconcile counts. | Recorded content decision, implementation and metadata/loader integration, followed by real functional and gate evidence |
| B-P05: guidance recordings | B / authorised voice worker | Record the twelve missing EN/VI guidance lines listed in VOICE.md through the approved voice workflow when an authorised speech binding is available. Never put credentials in chat or source. | Shipped manifest/file verification, actual decoding/playback and relevant device listening review; update voice-audit.json and voice-validation.json with exact source evidence |

## Preserve while completing these items

Keep all four game IDs declared-only and unavailable until their intended implementations and real catalogue/loader integration are verified. Their source proposals remain in js/games/art-pending.ts; rongran remains a declaration in js/content/secondset.ts. Metadata or recording presence is not playability proof.

Preserve the twenty-two delivered activities, existing saves/purchases/progress, typed identifiers, shared item Off, group release and progress requirements. Follow the existing A/B file boundaries. Do not independently change A-owned Studio, shared runtime, APIs/database, save types or tests. Do not merge main, deploy, choose versions, provision paid services or alter real family data.

## Separate A-owned integration follow-up

These are recorded for coordination, not reassigned to B:

- Reconcile the two stale policy assertions in tests/unit/studio-off-policy.test.mjs using A-TEST-REQUEST.md; preserve the fail-closed assertions. Recorded unit result: 426 passed, two failed, one legacy skip.
- Review and regenerate the combined website facts/art and global review lock after actual review. B deliberately left the global lock unchanged.
- Collect exact-source comprehensive CI and finish combined-tree/physical-device/release validation. Delivery CI was dispatched for ba9f7c43: https://github.com/nguyentuanphu/tpn/actions/runs/40823547500. Its completion is not asserted by this pending-work record.

## Resume references

Read HANDOFF.md, CONTENT-REVIEW.md, VALIDATION.md, art-audit.json, VOICE.md and the source/dependency inventories in this folder. Read the current repository instructions and A's latest status before implementation. Commit and push only the assigned work branch; final integration remains with A.
