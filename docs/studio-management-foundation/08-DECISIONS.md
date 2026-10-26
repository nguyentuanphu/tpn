# Decisions, assumptions and unresolved prerequisites

This package is authorised design/documentation work. Proposed implementation defaults are recommendations, not claims of owner approval. A future builder must record the selected decision, date, actor and affected tickets before activating dependent behavior. Continue independent work while a prerequisite is unresolved; do not invent access or approval.

| ID | Topic | Recommended design | Status / dependency |
|---|---|---|---|
| D01 | Audience | Single organisation; Studio for authorised administrators; ordinary parents use website/Grown-ups | Design assumption supported by current repository; confirm if scope changes |
| D02 | Navigation | Keep existing five Studio sections and four website destinations | Existing project direction; new subviews proposed |
| D03 | Transactional storage | Existing adapters first; approved managed PostgreSQL for new exact events, config/audit and finance | Provider, region, credentials, backup and spend require owner/infrastructure selection before B07 transactional writes/B08/B09/B10 |
| D04 | Accounting | AUD reporting proposal; original currencies retained; explicit FX; tax-exclusive operating view with tax shown separately | Reporting currency/tax/accounting treatment reserved before Finance activation; no paid model assumed |
| D05 | New collection | No child names/profile identity in new attempt ledger; installation-level operation outcomes only | New collection/retention and parent-facing explanation require product review before B08 activation |
| D06 | Retention | New event/cohort detail 90 days; nonpersonal aggregates 13 months; audits/finance separately agreed | Retention and deletion/backup lifecycle require owner review; existing stores not silently changed |
| D07 | Finance source | Manual entry/import first, selected read-only billing adapters later | Real provider account scopes/credentials missing until securely configured; do not request values in chat |
| D08 | Operations | Read-only status first; bounded dispatch after permissions, dedup and limits | Existing bot UTC schedules preserved; changing schedule timezone is a separate reviewed migration |
| D09 | Notifications | In-Studio alerts and weekly report first | Email/chat/push destinations and sending require separate explicit authorisation |
| D10 | Website attribution | Separate website clicks from reportable game starts | No person-level acquisition funnel or child tracking token in this design |
| D11 | Rollout | Small read-only slice before transactional instrumentation; compatibility and owner deployment gate | Proposed sequencing; approval of docs does not approve implementation/release |
| D12 | Health thresholds | Sample-aware initial trends and 70/90/100% budget alerts | Starter proposals; operator reviews thresholds, comparable cohort and false-positive rate |

## Architecture decision records to create during implementation

For D03 record provider/region, cost cap, service-role separation, migration mechanism, transaction/lock semantics, connection handling in serverless runtime, restore test and rollback plan. If the selected provider cannot support required constraints or advisory-lock behavior, revise the configuration projector contract explicitly before implementing; do not emulate transactions with unprotected blob counters.

For D05/D06 record exact payload allowlist, user-facing collection explanation, opt-out behavior, deletion/redaction path, retention job, personal-data scope and backup-expiration implications. Data collected only on reporting devices cannot be advertised as complete audience coverage.

For D04 record actual/estimate/commitment treatment, invoice recognition period, cash versus accrual presentation, tax display, credits/refunds, FX source/rounding, and who can reconcile/correct a line. This is an operational finance design; statutory/tax accounting needs its applicable accounting process.

## Risk register

| Risk | Observable symptom | Mitigation / test | Owner |
|---|---|---|---|
| Duplicate legacy and new counts | Sudden usage jump after instrumentation rollout | Separate schema/metric version and cohort; V12–V15 | Analytics & Infra |
| Wrong day/build attribution | Regression blamed on current build for offline old play | Preserve originating build and source day; V02 | Analytics & Infra |
| Personal data leaks into public site | Device/profile/credential fields in export | Allowlisted catalogue projection and negative fixtures; V07/V09 | Release + Studio |
| Editor gains finance/operations implicitly | New permission key included by generic editor preset | Explicit role allowlists and complete route matrix; V09 | Studio |
| Save shown as universal delivery | Offline installations counted updated | Fixed eligible cohort, receipts and unconfirmed state; V18 | Studio |
| Partial config cutover | Old direct writer overwrites revisioned projection | Identify all writers; gated cutover; serial projector; V17 | Analytics & Infra |
| Storage failure affects play | Queue exceptions stall activity/save | Bounded queue and independent failure handling; V16 | Kid UI + Analytics |
| Financial false precision | Missing invoice displayed as zero | Reconciliation coverage and unavailable state; V20/V21 | Owner + Studio |
| Costly bot/voice job loop | Repeated runs or unexpected provider bill | Bounded dispatch, duplicate ID, cooldown, quotas; V22 | Analytics & Infra |
| Historic doc treated as current code | Proposed service assumed implemented | Pinned evidence matrix and source recheck; B01 | Release |
| Full scope overwhelms mobile | Dense tables and too many navigation levels | Six-card Home, contextual drill-down, V11 screenshots | Studio |
| Database outage breaks legacy live service | Existing game fetches fail during adoption | Keep current blob projection/read compatibility; controlled cutover and rollback | Analytics & Infra |

## Non-goals and deliberately deferred work

- Multi-organisation tenancy, charging organisations, subscription management and payments.
- Remote editing/erasing of children's authoritative progress or automatic save sync.
- Educational grading, psychological profiling or a claim that usage proves learning outcomes.
- Tracking an individual child between marketing website and game.
- AI automatically approving releases, changing budgets, diagnosing root cause as fact, or sending external messages.
- Replacing three.js, the existing game architecture or Studio's shared local/online implementation.
- A heavy management SDK loaded before the game's playable screen.

These boundaries protect delivery scope and clarify what a later proposal would need to change.
