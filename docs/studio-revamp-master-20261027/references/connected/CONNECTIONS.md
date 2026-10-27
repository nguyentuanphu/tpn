# Connections, identity and ownership

Code references are pinned to a1f82e740e95bcd491f075980b8b891be79419e7. No current row establishes live deployment/access. Proposed L13 has no active transport/store.

## L01 · Game usage → People and usage graphs

- **Producer:** [js/players.ts](https://github.com/nguyentuanphu/tpn/blob/a1f82e740e95bcd491f075980b8b891be79419e7/js/players.ts).
- **Transport:** POST /api/hello.
- **Storage / authority:** Private players / bot-players Blobs.
- **Studio destination:** People; Game & website.
- **Join:** installation id + local profile key + device day; originating build kept separate.
- **Access:** analytics for legacy; management.read for summaries; management.deviceDetail for names.
- **Status:** current_code_not_live_verified.
- **Limit:** Existing counters are reporting samples, not a complete audience or exact attempts.

## L02 · Detailed game events → outcome graphs

- **Producer:** [js/management-telemetry.ts](https://github.com/nguyentuanphu/tpn/blob/a1f82e740e95bcd491f075980b8b891be79419e7/js/management-telemetry.ts).
- **Transport:** POST /api/management/events.
- **Storage / authority:** PostgreSQL management_events; conflicts quarantined.
- **Studio destination:** People; Game & website; Work.
- **Join:** deviceId + eventId dedup; deviceId + attemptId lifecycle.
- **Access:** Consented collection; management.read; management.deviceDetail for profile context.
- **Status:** current_code_not_live_verified.
- **Limit:** Code exists; SQL binding, real-family retention and production activation remain unverified.

## L03 · Website observations → acquisition graphs

- **Producer:** [home/analytics.ts](https://github.com/nguyentuanphu/tpn/blob/a1f82e740e95bcd491f075980b8b891be79419e7/home/analytics.ts).
- **Transport:** POST /api/parent-analytics.
- **Storage / authority:** Private parent-analytics aggregate Blobs.
- **Studio destination:** Game & website → Website performance.
- **Join:** aggregate dimensions only: day/route/language/device; no person join.
- **Access:** Existing website opt-out; analytics / management.read.
- **Status:** current_code_not_live_verified.
- **Limit:** Page views and Play clicks cannot be joined to a particular child or confirmed boot.

## L04 · Shared source → game, website and Studio catalogue

- **Producer:** [tools/export-management-catalogue.mts](https://github.com/nguyentuanphu/tpn/blob/a1f82e740e95bcd491f075980b8b891be79419e7/tools/export-management-catalogue.mts).
- **Transport:** Versioned content/management-catalogue.json; website build/review pipeline.
- **Storage / authority:** Git/source snapshots; generated public content.
- **Studio destination:** Game & website → selected item.
- **Join:** kind + id; sourceCommit + sourceHash; guide review source.
- **Access:** Public catalogue reads; existing edit/site/release grants for actual writes.
- **Status:** current_code_not_live_verified.
- **Limit:** Code/source integration exists; current website alignment must not be assumed.

## L05 · Studio configuration → game availability/content

- **Producer:** [netlify/lib/management/transactional/service.mts](https://github.com/nguyentuanphu/tpn/blob/a1f82e740e95bcd491f075980b8b891be79419e7/netlify/lib/management/transactional/service.mts).
- **Transport:** POST /studio/api/management/config → conditional projection → GET /api/live.
- **Storage / authority:** SQL configs/config_versions/changes/projection_jobs/audit; public management-live Blob.
- **Studio destination:** Game & website → item control; Work → changes.
- **Join:** global scopeKey + revision + effectiveHash.
- **Access:** management.configure AND existing rules/content edit grant.
- **Status:** current_code_not_live_verified.
- **Limit:** Current HTTP publication supports global scope only. Friendly contextual editors are proposed.

## L06 · Device acknowledgement → delivery evidence

- **Producer:** [js/management-telemetry.ts](https://github.com/nguyentuanphu/tpn/blob/a1f82e740e95bcd491f075980b8b891be79419e7/js/management-telemetry.ts).
- **Transport:** POST /api/management/config-receipts → private change coverage.
- **Storage / authority:** SQL receipts joined to changes/config_versions.
- **Studio destination:** Work → change delivery; People → device.
- **Join:** deviceId + scopeKey + revision + effectiveHash.
- **Access:** Device-reported observation; management.read plus deviceDetail for private drilldown.
- **Status:** current_code_not_live_verified.
- **Limit:** Applied means client reports persistence, not every open screen immediately redrawn.

## L07 · Game problem report → Studio evidence

- **Producer:** [js/report.ts](https://github.com/nguyentuanphu/tpn/blob/a1f82e740e95bcd491f075980b8b891be79419e7/js/report.ts).
- **Transport:** POST /api/tester and private Studio tester routes.
- **Storage / authority:** Private testers records and screenshot storage.
- **Studio destination:** Work → problem; People → linked device.
- **Join:** clientId receipt; device/build/context; problem key.
- **Access:** Tester entitlement; testers permission for private text/images.
- **Status:** current_code_not_live_verified.
- **Limit:** Reports may contain sensitive context; masking/access and retention require review.

## L08 · Studio follow-up → work history

- **Producer:** [netlify/lib/management/transactional/service.mts](https://github.com/nguyentuanphu/tpn/blob/a1f82e740e95bcd491f075980b8b891be79419e7/netlify/lib/management/transactional/service.mts).
- **Transport:** POST /studio/api/management/attention/:id.
- **Storage / authority:** SQL attention + audit.
- **Studio destination:** Work → task inspector.
- **Join:** issue id + expectedRevision; deployment and verification references.
- **Access:** management.triage.
- **Status:** current_code_not_live_verified.
- **Limit:** Follow-up lifecycle does not automatically modify the original tester status.

## L09 · Providers → operations and release graphs

- **Producer:** [netlify/lib/management/operations-control.mts](https://github.com/nguyentuanphu/tpn/blob/a1f82e740e95bcd491f075980b8b891be79419e7/netlify/lib/management/operations-control.mts).
- **Transport:** GET operations; POST operations/refresh or operations/run under Studio API.
- **Storage / authority:** Provider observations; SQL operations + audit.
- **Studio destination:** Work → service/run/release.
- **Join:** operationId; matched provider run/deploy identifier.
- **Access:** operations.read/run; additional bot/config grants as applicable.
- **Status:** current_code_not_live_verified.
- **Limit:** Only bounded maintenance dispatches exist; network acceptance is not successful execution.

## L10 · Operator documents → Money graphs

- **Producer:** [netlify/lib/management/finance.mts](https://github.com/nguyentuanphu/tpn/blob/a1f82e740e95bcd491f075980b8b891be79419e7/netlify/lib/management/finance.mts).
- **Transport:** /studio/api/management/finance/{preview,commit,budget,settings}; GET snapshot/export/history.
- **Storage / authority:** SQL finance_lines/versions/settings/budgets/batches + audit.
- **Studio destination:** Money.
- **Join:** provider + accountAlias + sourceDocumentId + sourceLineId; revision; operationId.
- **Access:** finance.read / finance.write.
- **Status:** current_code_not_live_verified.
- **Limit:** Manual ledger, no provider-billing synchronisation, bank payments or full accounting claim.

## L11 · Local save/private family services → authorised family view

- **Producer:** [js/state.ts](https://github.com/nguyentuanphu/tpn/blob/a1f82e740e95bcd491f075980b8b891be79419e7/js/state.ts).
- **Transport:** Existing local save/copy and separately authorised family/photo services.
- **Storage / authority:** Local authoritative saves; separate private family/photo stores.
- **Studio destination:** People → explicitly authorised family tools.
- **Join:** local profile id + installation; explicit private family membership.
- **Access:** Separate family/photo permissions; analytics code is not photo authentication.
- **Status:** current_code_not_live_verified.
- **Limit:** No automatic remote save authority, cross-device merge or public exposure.

## L12 · Studio accounts → every private action

- **Producer:** [netlify/lib/admins.mts](https://github.com/nguyentuanphu/tpn/blob/a1f82e740e95bcd491f075980b8b891be79419e7/netlify/lib/admins.mts).
- **Transport:** Authenticated Studio routes; explicit grants checked server-side.
- **Storage / authority:** Private admin/session/key/access-log stores.
- **Studio destination:** Settings → access; audit in relevant item.
- **Join:** account id and grants; selected actor for audit.
- **Access:** Server role/custom-grant enforcement.
- **Status:** current_code_not_live_verified.
- **Limit:** Opening a workspace or hiding a button never grants or enforces authority by itself.

## L13 · Optional website Play handoff → reportable game boot

- **Producer:** [home/analytics.ts](https://github.com/nguyentuanphu/tpn/blob/a1f82e740e95bcd491f075980b8b891be79419e7/home/analytics.ts).
- **Transport:** PROPOSED: short-lived random handoff and bounded acknowledgement contract.
- **Storage / authority:** PROPOSED: short-retention handoff aggregate; no current table/endpoint.
- **Studio destination:** Game & website → acquisition.
- **Join:** PROPOSED: random single handoff, never child name, family code or fingerprint.
- **Access:** New collection/access/retention decision required; analytics opt-outs honoured.
- **Status:** proposed.
- **Limit:** Not implemented. Do not draw a current matched conversion funnel.

## Identity: relationships that must remain separate

| Entity | Identity / relationship | What it does not prove |
|---|---|---|
| Website observation | Aggregate dimensions, no stable visitor identity | A person, child, session or game installation |
| Installation | Random device/browser-storage ID | A physical person, permanent hardware identity or customer |
| Reported profile | Installation plus local profile key; optional first name | Global unique child identity; equal names are not a join |
| Session | One running tab/session ID | A new child or another installation |
| Attempt | Installation plus attemptId, compatible lifecycle | One profile participation in shared play |
| Family statistics link | Existing digest for statistics association | Authentication, photo membership or save ownership |
| Private family membership | Explicitly established private service relationship | Finance or unrestricted other-family access |
| Content | kind:id; source commit/hash | A display name or proof of website editorial review |
| Configuration | Scope + revision + effective hash | Game code version or universally applied change |
| Release | Reviewed commit/build and deployment evidence | Every offline device having updated |
| Invoice line | Source tuple plus revision history | Bank payment or provider-verified account balance |

## Current control precedence and targeting

Do not invent a new precedence engine in the UI. `netlify/lib/management/catalogue.mts` explains expected availability against current rules; actual clients also have local progress, cache and clock inputs. `LIVE-05` documents device selections inside a release rule. That is distinct from publishing a dedicated `device:...` or `feature:...` revision: current management HTTP only accepts global publication. Proposed specialised editors must preserve this distinction and existing tester/keep/restore policy.

## Public/private crossing rules

Website and game receive allowlisted public content and configuration. Child names, private reports/screenshots, family photo bytes, credentials, finance records and operator audit details do not travel in that projection. Studio reads private data through its actual scoped server APIs; the browser is not given a database credential. Netlify Database is the selected SQL provider, with native `NETLIFY_DB_URL` binding for server Functions; current workspace binding is absent. Existing Blobs/local save stores remain separate until an explicit migration is designed.

## Time and interpretation

Store event UTC time, server received time and device day/offset separately. Legacy play buckets use device-local dates; detailed event summaries currently use production UTC windows. Financial service-day allocation, cash paidAt UTC date and Sydney-labelled reports need visible bases. UI labels should not pretend these windows are interchangeable. Missing watermarks mean freshness unknown, not “updated just now”.
