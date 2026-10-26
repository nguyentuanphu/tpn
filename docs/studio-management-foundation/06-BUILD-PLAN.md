# Ordered implementation tickets

This is a specification, not completed product work. Build in dependency order. Ticket IDs are referenced by the data and metric registers. No ticket may infer a missing datum, change save identity, weaken a check, publish an unreviewed guide, or bypass the owner's deployment gate.

## Common definition of done

For every ticket: record source SHA; implement validation and server permissions; preserve existing contracts; write meaningful failure-path checks; run relevant existing checks; inspect EN/VI phone/tablet/computer UI when changed; document missing physical-device/provider coverage; update the requirement map and evidence. Generated JavaScript is built through the repository tool and is not committed. New routes/data stores remain feature-gated until compatibility checks pass.

Use the current checkout. Coordinate shared file changes through the board. Existing authorisation here is to build the foundation documents; runtime tickets are a proposed subsequent implementation programme. No new version or deployment is approved by this handbook.

## B01 — Confirm baseline, boundaries and definitions

- **Owner:** Release + Analytics & Infra + Studio; business owner resolves reserved decisions.
- **Depends on:** none. **Size:** small.
- **Read:** current project rules; this package; current `admins.mts`, `players.mts`, `live.mts`, `home/analytics.ts`.
- **Work:** verify every registry path against the intended build; record whether operating metrics concern installations, profiles or attempts; separate statistics codes/photo credentials/save copies; agree D01–D09 in the decision register.
- **Files:** this package and core coordination docs only.
- **Accept:** R01/R02/R03/R04. Every future route is labelled proposed; no real credentials/personal data enter fixtures; all changed contracts have owners.
- **Stop:** a new provider/database is not required for read-only discovery. Record missing choices without blocking B02–B05.

## B02 — Add read adapters and trusted metric definitions

- **Owner:** Analytics & Infra; Studio consumes interfaces. **Depends:** B01. **Size:** medium.
- **Existing files:** `netlify/lib/players.mts`, `hello-clean.mts`, `netlify/functions/studio.mts`, `netlify/lib/admins.mts`, `home/analytics.ts`, `netlify/functions/parent-analytics.mts`.
- **Proposed new files:** `netlify/lib/management/read.mts`, `metrics.mts`, `quality.mts`, `types/management.d.ts`.
- **Work:** named adapters for compact arrays; source-native date basis; ordinary/bot separation; common response envelope; sample counts; stable cursor pagination and uncapped totals. Preserve raw existing stores and API fields. Expose only read-only management routes initially. Register `management.read` with owner-only default and explicit preset allowlists here, before exposing routes; B07 expands the remaining new permissions and audit. No generic editor preset may inherit this key accidentally.
- **Tests:** fixtures with late arrivals, mixed originating/sender builds, two profiles on one attempt, null measurements, existing zero, robot data, >100 devices, malformed cursor and 403 access.
- **Accept:** R05/R06/R07/R08 and V01–V05. Exact attempt conversion, D7 and p95 remain unavailable where inputs do not exist.
- **Rollback:** disable new routes/cards; existing reports continue unchanged.

## B03 — Build Home, performance and paged device views

- **Owner:** Studio + Analytics & Infra. **Depends:** B02. **Size:** medium.
- **Files:** `studio/ui/app.ts`, `studio/ui/style.css`, `studio/ui/vi.js`, `types/studio.d.ts`, new read adapters; shared engine in `studio/core.cts`.
- **Work:** six-card Home; existing data first; filter provenance; device list/detail with fresh/stale/unsupported states; weighted FPS and sample-aware startup. Register server permissions before UI.
- **Tests:** both Studio modes, all roles, EN/VI, 390/820/1280 widths, keyboard/rotation/safe-area states, delayed/error responses and pagination. No new service requests added to game startup.
- **Accept:** R07/R08/R09/R10 and V03/V05/V11. Finance can be “not configured.”
- **Rollback:** retain original Home and hide new management navigation behind a flag.

## B04 — Connect attention and support evidence

- **Owner:** Studio + Analytics & Infra. **Depends:** B02/B03. **Size:** medium.
- **Files:** `netlify/lib/tester.mts`, `netlify/functions/studio.mts`, `studio/ui/app.ts`; proposed `netlify/lib/management/attention.mts` and transactional state storage when writable revisions are enabled.
- **Work:** adapt existing tester states, stable evidence links, affected reporting installation counts, ownership/next-action, version-aware fix/deploy/verification milestones. Read-only attention can ship first; audited multi-user writes depend on D03 storage and B07.
- **Tests:** duplicate reports, redacted screenshots, unrelated build evidence, reopened problem, stale concurrent edits, viewer write denial and existing tester receipt/reward behavior.
- **Accept:** R11/R12 and V06/V10. Never claim an automatic symptom proves a bug or that a code fix is deployed.
- **Rollback:** preserve existing tester records and fall back to the original tester screen.

## B05 — Build one complete activity page and coverage audit

- **Owner:** Studio + Play + Voice & Audio + Release. **Depends:** B02/B03. **Size:** medium.
- **Existing files:** `js/content/activities.ts`, `js/games/registry.ts`, `js/content/releases.ts`, `js/content/unlocks.ts`, voice manifests, `tools/build-website.mts`, website review tooling.
- **Proposed files:** `tools/export-management-catalogue.mts`, `netlify/lib/management/catalogue.mts`, catalogue snapshot schema/fixtures.
- **Work:** start with `oanquan`; join stable ID to catalogue, participation counts, guide provenance, voice coverage, existing problems and test references. Separate reviewed editorial prose from extracted facts. Then apply the same adapter to all registered activities/stories. No unsupported runtime deep links.
- **Tests:** unknown IDs; renamed EN/VI title with same ID; held/unlocked activity; missing VI recording; stale guide source; missing reward; family-authored content excluded from public exports.
- **Accept:** R13/R14/R15 and V07. One source SHA, no private data in export, truthful limited coverage denominator.
- **Rollback:** retain generated catalogue for inspection; hide new activity view without changing game availability.

## B06 — Explain effective availability and every change's scope

- **Owner:** Studio + Play + Kid UI. **Depends:** B05. **Size:** medium.
- **Files:** `js/custom.js`, `js/content/releases.ts`, `js/content/unlocks.ts`, `studio/ui/app.ts`, `netlify/lib/live.mts`.
- **Work:** document and test actual precedence including schedule, targeted devices, tried-content retention and special wayfind semantics. Prefer shared pure resolver/parity fixtures. Explain Save-live versus Publish by page and uploaded asset. Do not change disable/retention semantics incidentally.
- **Tests:** same feature across ordinary/test devices, empty scope, explicit off after use, new-set hold, unlock threshold, dates across timezone boundaries, offline stale cache.
- **Accept:** R16 and V08. Expected server evaluation is distinguished from observed device state.
- **Rollback:** explanation-only changes can be removed without reverting stored rules.

## B07 — Add explicit permissions and before/after audit

- **Owner:** Studio + Analytics & Infra. **Depends:** B01/B02; D03 before audited transactional writes. **Size:** medium.
- **Files:** `netlify/lib/admins.mts`, `accesslog.mts`, `netlify/functions/studio.mts`, `studio/core.cts`; proposed `netlify/lib/management/audit.mts` and migrations.
- **Work:** register management/finance/operations permissions; prevent editor preset auto-inheritance; preserve desktop key scope. Add explicit operation-to-permission mappings before generic fallbacks; audit the existing parent-analytics handler's use of `admins.allowed()` with a permission-name string. Add revisioned audit for new management mutations with actor/reason, redacted before/after summary and correlation ID. Keep security access log separate.
- **Tests:** role × route × GET/POST matrix, direct API writes, missing/stale auth, custom permissions, owner revocation, desktop key denied finance/deploy, redacted audit errors and multi-editor conflict.
- **Accept:** R10/R17/R18 and V09/V10. No authentication changes to the existing owner/admin policy without separate review.
- **Rollback:** new grants default deny; do not erase audit or invalidate unrelated existing grants.

## B08 — Add exact event measurement safely

- **Owner:** Analytics & Infra with Play, Kid UI, Voice & Audio and Online hooks. **Depends:** B02/B07 + D03/D05/D06. **Size:** large.
- **Proposed files:** `netlify/functions/management-events.mts`, `netlify/lib/management/events.mts`, `rollups.mts`, `js/management-telemetry.ts`, migrations.
- **Existing hooks:** `js/core/events.ts`, `js/games/frame.ts`, `js/launch.js`, `js/net.ts`, `js/voice.ts`; additions must respect core ownership and event lifecycle.
- **Work:** implement schema before hooks; transactional dedup; durable bounded queue; matched attempt IDs; provisional outcomes and corrections; scoped rollups with source watermark. Server first, client flag second, dependent cards last. Legacy and new metrics remain separately labelled.
- **Tests:** same event twice; same ID changed body; partial server failure/rollback; two concurrent sends; out-of-order terminals; midnight attempts; offline >grace; opt-out; quota-full; bot isolation; failed early boot visibility limits.
- **Accept:** R19/R20/R21/R22 and V12–V16. Exact funnels appear only after fixtures reconcile. Measure payload, startup and memory overhead against budgets.
- **Rollback:** disable producer and cards; maintain legacy reporting; retain/expire queued data under documented consent policy.

## B09 — Add revisioned configuration and device receipts

- **Owner:** Studio + Analytics & Infra + Kid UI. **Depends:** B06/B07/B08 + D03. **Size:** large.
- **Files:** `netlify/lib/live.mts`, `netlify/functions/studio.mts`, `js/custom.js`, proposed config/receipt modules and migrations.
- **Work:** expectedRevision mutation, outbox projection, serial publication with read-back, additive metadata, client application acknowledgement, fixed eligible cohort, new-device separation, compatible rollback as new revision. Eliminate old direct writers during controlled cutover.
- **Tests:** concurrent editors; projection fails after DB commit; old writer attempts; old clients; offline device; mismatched hash; duplicate receipt; device clock skew; unknown scope; rollback conflict; no profile overwrite.
- **Accept:** R23/R24/R25 and V17–V19. Available, fetched and applied are different timestamps/states.
- **Rollback:** feature-gated additive metadata; keep published compatible config; never reset revisions or game saves.

## B10 — Add Finance with manual input first

- **Owner:** Studio + business owner + Analytics & Infra. **Depends:** B07 + D03/D04/D07. **Size:** medium/large.
- **Proposed files:** `netlify/lib/management/finance.mts`, `finance-import.mts`, ledger migrations, Studio finance view and private import fixtures.
- **Work:** explicit currency/minor units/tax basis, actual versus estimate/commitment, import preview/idempotency, reconciliation, budget, forecast with coverage flags, cost allocation definitions. Provider API integration is optional after manual ledger works.
- **Tests:** duplicate/corrected invoice line; credit/refund; missing FX; integer overflow; zero active hours; partial billing period; two editors; owner-only grants; no provider secret in response/log.
- **Accept:** R26/R27/R28 and V20/V21. No payments or claimed revenue model introduced.
- **Rollback:** hide view; preserve ledger and export/reconciliation audit; no destructive financial reset.

## B11 — Add bounded operations and recovery evidence

- **Owner:** Analytics & Infra + Studio + Release. **Depends:** B07; B10 for cost integration; D08/D09. **Size:** medium/large.
- **Existing files:** workflow definitions, child-bot scheduling, `studio/core.cts` website/provider helpers.
- **Proposed files:** `netlify/lib/management/operations.mts`, `providers/*.mts`, job/backup evidence records.
- **Work:** read-only service/feed health first, exact run IDs, terminal outcomes, retries, quota windows, stale-source state. Manual dispatch enforces bounded inputs, permission, cooldown and duplicate-operation ID. Add retention-job and restore-drill visibility.
- **Tests:** API forbidden, stale feed, dispatch accepted then failed, duplicated dispatch request, quota unknown, bot schedule UTC/Sydney display, restore failure, secret-redacted provider errors.
- **Accept:** R29/R30 and V22/V23. Production credential absence remains an explicit integration gap.
- **Rollback:** disable dispatch/adapters; leave original approved schedules unchanged.

## B12 — Integrate, verify and hand over

- **Owner:** Release. **Depends:** completed selected scope; unresolved reserved decisions remain listed. **Size:** medium.
- **Work:** reconcile catalogue and website source, migration/cutover/rollback drill, compatibility with installed old clients, full permission matrix, EN/VI visuals, physical-device matrix, local serial speed checks and required GitHub suite. Rebuild/test Windows executable if Studio changes.
- **Evidence:** exact source and build, datasets and formulas, provider scopes tested, every pass/fail/skip/retry, screenshots, restore result, generated Netlify package and outstanding limitations.
- **Accept:** R31/R32 and V24/V25. Ask for the current round's explicit deployment approval only after the reviewable result exists. No numerical deadline overrides missing correctness evidence.

## Suggested delivery slices

| Slice | Tickets / scope | Useful result | Relative effort |
|---|---|---|---|
| A | B01/B02 plus read-only B03/B04/B05 | Trustworthy overview and one complete activity path | Smallest useful production candidate |
| B | B06/B07 and complete catalogue/read views | Understandable controls, safe permissions and accountable work | Moderate integration |
| C | B08/B09 | Exact attempt measurements and observed delivery | Largest reliability/data work |
| D | B10/B11 | Finance and infrastructure control | Depends on provider access and billing choices |
| E | B12 per approved slice | Evidence-backed release and handover | Mandatory for every shipped slice |

Earlier conversational time ranges are preliminary planning estimates, not a schedule or completion commitment. Re-estimate after B01/B02 using actual gaps, access and review needs. A smaller read-only slice can be released before the full programme; data accuracy and explicit deployment approval remain required.
