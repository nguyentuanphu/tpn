# Studio revamp implementation continuation

29 October 2026 AEDT. Branch `review/studio-finance-20261027`; one agent. Continues the [consolidated design](../studio-revamp-master-20261027/README.md). No main merge, deployment, version change, paid provisioning, payments or private-data mutation.

## This slice

- Resumed clean uploaded handoff5c0c209a and confirmed the existing runtime35bcb63c has complete successful evidence:253/253 top-level checks,17 actual SQL cases, no retry records in the saved results. That success is the previous baseline, not automatic evidence for this slice.
- Produced a reproducible [public source inventory](INVENTORY.md) and [control-reference audit](CONTROL-COVERAGE.md), with machine-readable per-item JSON and source hashes.
- Implemented **Home / Trang chủ** in the actual Studio: at most three priorities, six source-explained figures, audience trend, reports, explicit content/control audit limits, source read-status/times and links to relevant tools and recorded Money. Existing game art/font/palette and old routes remain.
- Home reuses existing read APIs. It adds no game event, upload, polling timer, database migration or third-party script. Catalogue reads are static public-source facts behind existing management permission. Parent/child private information is not prefetched for Home.

## Audit interpretation

936 records cover public declarations and selected management mechanisms across all13domain categories. They include207catalogued games,92catalogued stories,26declared game IDs absent from catalogue metadata, chapter/quest/adventure/mission/job-board declarations, rewards, selected world map records, song placements and source-backed system mechanisms.

This is **partial inventory**: categories appear, but that does not establish every NPC, building, vendor, runtime instance, dynamic item or private/provider record. Song placements are distinct from tune keys; job boards are distinct from individual jobs. Counts are not a total of playable experiences or unique customers.

Of the26declared game IDs absent from the current catalogue,25have literal registration references in game modules. Only rongran has no such literal reference in this scan. This does not prove that rongran has no dynamic implementation, or that the other25load/play correctly. Preserve the references and verify catalogue discovery, lazy loading and actual outcomes before changing content. Do not rebuild or delete these games based on the catalogue gap alone.

104 release rules are declared;37have direct literal consumer call references;3have literal keptOn paths with a retention caveat. Dynamic rule consumers are not labelled missing merely because a literal search cannot find them. This new static audit executes no control-effect tests and therefore awards no new end-to-end verification. It does not erase older independently documented effect evidence.

The expanded wrapper scan also found15rules referenced through literal G.keep/game.keep calls. Combining direct and wrapper evidence gives16retention-caveat candidates (excluding wayfind's explicit special handling). The JSON separates direct references, wrappers and the js/main.ts bridge. Computed IDs and locally aliased keep functions remain further review work.

Explicit-off concern: `keptOn` in js/custom.ts can retain previously tried features. Direct paths are recorded for readingTrial, priceTags and sellersRemember; computed/dynamic paths need further review. Fixing these safely requires behaviour-specific regression and progress-preservation checks, not a metadata claim.

## Reproduce

From repository root: `node docs/studio-revamp-progress-20261029/tools/audit.mts`.

Run relevant application checks through tests/suite.mjs with the game server available. Set `STUDIO_OWNER_REVIEW_DIR` to this folder's screenshots path to preserve historical checkpoint captures. Details and failures belong in VALIDATION.md before reporting success.

## Next work

Finish all-domain inventory/capability coverage and explicit-off semantics; then one contextual item editor with actual private draft/review/publication. Add the proposed Collect/Process/Show panel with actual producer/job consumers and measured budgets. Marketing attribution/cohorts, remaining graphs, broader Work/services/finance and live Netlify lifecycle/recovery/device validation remain in scope, as specified in the master design.
