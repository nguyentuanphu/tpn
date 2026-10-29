# Combined source and merge review

Destination: `handoff/studio-combined-20261029`. No main merge, deployment, version change or production operation.

Both original histories are present. Workstream A's uploaded checkpoint was fa917a06, runtime47782b13; its additional CI-observation commiteccefe60 is also preserved. Workstream B's delivered branch tip is c930f461, runtime/layout47a9079e. Common base: f62a48c9. Merge125a5492 combines them, and the later commits on this branch reconcile tests and finish the documented A work. INTEGRATION-RECORD.json gives immutable full SHAs and ancestry checks.

## Merge and reconciliation

- The sole content conflict was sw.ts. Keep the original offline list, A's `js/core/reporting-policy.js` and B's `js/games/drawing2.js`, `crafts.js`, `art-pad.js`, exactly once each. No version constant changed. art-pending.js is intentionally not registered or a gameplay dependency.
- Keep A's private drafts, scoped item/function controls, explicit Off precedence, parent eligibility, server policy and existing SQL schema003. Keep B's concrete art helper, registrations/catalogue/GAME_INFO metadata, guides, artwork and full source inventories. Tests/run.mjs contains both A regression repairs and B's six content checks.
- Shared policy assertions now identify exactly hiddenpic/paperfold/rongran/spotdiff. All four must be rejected as runtime events; all22integrated art IDs are accepted in B's synthetic test. A's privacy/contradictory-metadata/fail-closed assertions remain.
- Owner's Desk declared-only search uses paperfold, not the now-integrated aodai. The probe discovers all current game definitions instead of assuming the old207count.
- Both event fixtures supply a minimal asynchronous live-store `get` adapter. A null store cannot represent a working source once the server checks reporting policy before ingestion; production enforcement was not relaxed.
- Advanced editor recovery now retains visible JSON, blocks writes after uncertain responses and requires current settings to be reloaded. Invalid JSON is corrected locally before a request. Contextual editors retain the same protection.
- The welcome-sticker mutation was diagnosed explicitly (`0.stickerBook`) and isolated with the established noWelcome test helper. All other profile fields are still compared. Asphalt colour uses3,584plain pixels; the required regional colour gap, kerb/dash checks and material limits remain.
- Money chart labels use the existing currency exponent and exact major-unit string formatter. Geometry still uses original integer values; no ledger arithmetic, FX, storage or API contract changed.

## Generated facts and review boundaries

The source catalogue and optional-output public source/dependency/media exports are refreshed from the combined tree. B's original evidence is retained as history; generated test outputs are preserved separately before restoring the historical bytes.

The static website facts are generated from a committed combined source. This does **not** establish global editorial review. Keep game-review-lock.json unchanged until the next integration chat has reviewed the combined actual guides/art, all relevant source deltas and four bilingual destinations. Preserve the drift report and expected failing gate; do not update the lock merely to make CI green.

A public module/import manifest is complete only within its listed roots. It is not every runtime entity, placed instance, private record, provider account or control effect. The four pending game IDs stay unavailable until actual mechanics/integration/evidence exist.

## Safe continuation

Use the exact root prompt. Read-only `node tools/check-management-database.mts` reports readiness without printing credentials. This environment has no NETLIFY_DB_URL/MANAGEMENT_DATABASE_URL or authorised speech key; no migration/provisioning/paid fallback was attempted. Migration is an explicit future operator step after backup/preview/grant review, not an automatic part of this handoff.
