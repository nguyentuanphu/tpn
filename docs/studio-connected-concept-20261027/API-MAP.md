# Current routes and the proposed control interface

Source inspected at `a1f82e740e95bcd491f075980b8b891be79419e7`: `netlify/lib/management/http.mts`, `netlify/functions/management.mts`, `netlify/functions/parent-analytics.mts`, `netlify/lib/admins.mts`. These are existing code paths, not live-access verification. No new endpoint is created by this document.

## Information coming in

| Method / route | Producer / payload | Validated destination | Concept use |
|---|---|---|---|
| POST `/api/hello` | Game installation/session facts and retained daily buckets; ID/DAY/KID/PERF/BAT fields | Existing cleaned players or bot-players records | L01; People and legacy graphs |
| POST `/api/parent-analytics` | Website allowlisted event name, route/action/milestone/seconds/lang/device | Private parent-analytics aggregates; no user identity join | L03; website event graphs |
| POST `/api/management/events` | Versioned EV envelope and allowlisted OBS data | SQL immutable events; conflicting same-ID payload quarantine | L02; attempt and experience graphs |
| POST `/api/management/config-receipts` | RCPT identity, known revision/hash, timestamps, result/reason | SQL receipt after known published-version validation | L06; exact matching delivery evidence |
| POST `/api/tester` | Existing bounded problem/report and receipt context | Existing entitled tester/report services | L07; original evidence, not automatic cause |

These public producers do not authenticate a child’s identity or authorise Studio actions. Rate limits, origin handling and validators remain required. A website handoff endpoint is proposed only; no route name is chosen here.

## Private read routes

All routes below start `/studio/api/management/` and require authenticated server permission checks. Query support varies: dates/build/traffic are not necessarily supported by every source. Device/name context needs its additional permission even where a summary route is readable.

| GET suffix | Result / scope | Permission and constraint |
|---|---|---|
| `overview` | Legacy totals/metrics, quality; compatible detailed attempts/telemetry when available | `management.read`; detailed aggregation may be unsupported for selected child/device filters |
| `devices` | Bounded/paginated installation list | `management.read`; profile context only with private-detail permission |
| `children` | Reported profile/device linkage | `management.deviceDetail` |
| `devices/:id` | Scoped reporting installation detail | `management.deviceDetail` |
| `activities` | Source-backed catalogue | `management.read` |
| `activities/:id` | Selected catalogue/usage and compatible detailed outcomes | `management.read`; no inference from an ambiguous display name |
| `attention` | Original permitted evidence plus separate follow-ups if SQL configured | `management.read`; original tester text additionally needs tester access |
| `releases/:build` | Observed release evidence | `management.read`; not an automatic deploy action |
| `config` | Private current revision/change summaries | `management.read` |
| `changes/:id` | Fixed cohort and receipt coverage | `management.read` plus explicit device-detail check |
| `operations` | Provider/database/feed observations | `operations.read`; missing and stale feeds explicit |
| `finance` | Month/basis settings, records, quality and qualified summary | `finance.read`; invoice/cash basis explicit |
| `finance/export` | Existing ledger CSV export | `finance.read`; current export is not a new filtered snapshot API |
| `finance/history/:lineId` | Immutable line versions | `finance.read` |
| `finance/history/budget/:month` | Budget audit history | `finance.read` |

## Private write routes

| POST suffix | Request essentials | Effect / confirmation | Permission |
|---|---|---|---|
| `config` | `scopeKey: global`, expectedRevision, kind, body, reason; optional supported rollback | Private transaction + immutable version/cohort/audit; projection result available or pending | `management.configure` plus existing rules/content grant; rollback needs both |
| `config/project` | Project current known global revision | Conditional public projection + readback; no universal device-delivery claim | `management.configure` |
| `attention/:id` | expectedRevision, state, reason; owner/nextAction/evidence | Enforced follow-up transition + revision/audit; conflicts rejected | `management.triage` |
| `operations/refresh` | Refresh observation request | Observe current provider/feed state; not arbitrary execution | `operations.read` |
| `operations/run` | Bounded kind/inputs and required stable operation identity | Durable operation, selected provider action/check and later matched observation | `operations.run` plus bot/config grants where applicable |
| `finance/settings` | expectedRevision, reportingCurrency, reason | Explicit setup; currency locked after ledger starts | `finance.write` |
| `finance/preview` | lines OR CSV, expectedSettingsRevision | New/duplicate/correction preview and previewHash; no ledger mutation | `finance.write` |
| `finance/commit` | Same import, settings revision, previewHash, stable operationId, reason | Atomic ledger versions/batch/audit; repeated same operation returns prior result | `finance.write` |
| `finance/budget` | month, amountMinor, coverageThrough, expectedRevision, reason | Budget revision + audit | `finance.write` |

The existing config HTTP route commits a revisioned configuration and attempts publication. A redesigned **Save draft** control cannot call that route and pretend the result remains a private unpublished draft. A separate draft/review contract or existing suitable source-draft path must be deliberately integrated. Similarly, no separate due-date obligation write route, global People search, mature-cohort endpoint or generic graph export is claimed here.

## Outward publication

GET `/api/live` serves allowlisted public rules/content plus management revision/hash metadata, not private actor/cohort/audit/finance data. Game code fetches and persists those fields through its existing configuration reader. Game/website code and reviewed editorial source ship through their actual build/release pipeline, not through arbitrary config JSON. Website-source review and explicit release approval remain separate from config acknowledgement.
