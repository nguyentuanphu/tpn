# Optional functions and resource controls

Status: proposed extension, not an implemented switch panel or production guarantee. Owner requests a comprehensive Studio with independently switchable functions to protect game experience. This supplements the connected concept and implementation checkpoint; it does not declare all games, controls or analytics complete.

## Owner-facing design

Settings → Functions & resource use is the proposed management location. Home shows a compact optional-reporting status, source freshness and any changes awaiting delivery. Reuse game artwork, shared components, English/Vietnamese labels and explicit status text. Do not add a competing primary navigation area.

Each function card explains its purpose, affected game/website/server surfaces, prerequisites, current and desired settings, timing, resource budget, privacy eligibility and evidence of delivery. Separate three controls:

| Control | What turning it off does | What it does not establish |
|---|---|---|
| Collect | Stops that optional producer and its future optional uploads once policy is received | Instant control of offline or incompatible clients |
| Process | Stops its optional background aggregation or scheduled analysis after in-flight work is resolved | Deletion of existing data or elimination of database storage cost |
| Show | Hides its graphs/workspace for a selected Studio role/view | Reduced game collection or server processing |

Suggested presets: Essential, Standard, Detailed temporarily, Custom. These are proposed labels; publish no preset until its exact function membership, sample limits and budgets are documented. Detailed mode requires an expiry and automatic return to the prior policy. Never silently enable new collection through a preset update.

## Function families

| Family | Recommended initial policy | Required boundary |
|---|---|---|
| Core gameplay, saves, security and necessary delivery | Protected service controls | Optional analytics switches cannot disable or corrupt these |
| Optional engagement summaries | Reuse existing eligible reporting | Parent Analytics off overrides Studio enabling |
| Marketing attribution and cohorts | Off pending contracts and eligibility review | No child names in marketing identifiers; unknown links remain unknown |
| Detailed performance diagnostics | Off except bounded authorised investigation | Sampled, expiring, no per-frame network events |
| Experiments and promotional placement | Off until real consumers and rollback exist | Separate exposure collection from actual content behaviour |
| Optional provider synchronisation | Off until existing-service access is verified | No new paid resources, purchases or payments |
| Finance views and recorded ledger | Permission-gated server/Studio function | Opening Money adds no game telemetry |

Gameplay feature availability is a separate control family: games, stories, quests, rewards, festivals, world content and website placements each require a real capability audit. Do not equate disabling measurement with disabling play. Where disabling an active activity would interrupt play, define a safe transition per feature; preserve saves and earned progress.

## Verified starting points

Source inspection during this turn found:

- `js/players.ts`: `managementEnabled()` requires parent `countPlayers` not false, eligible site context and `featureOn('managementTelemetry', false)`; optional module loading is guarded. Existing legacy reporting is separate and must also be audited before claiming all collection stopped.
- `js/management-telemetry.ts`: eligibility checks, bounded behaviour to inspect, optional queue clearing and lifecycle stop methods already exist. Their presence is not proof of end-to-end resource budgets or universal shutoff coverage.
- Current configuration publication is global. Existing individual feature rules may select devices, but dedicated device/cohort revision publication is not established. Do not render unsupported targeting as available.
- A configuration receipt establishes reported revision/hash persistence, not proof that every collector, screen or background job stopped.

## Proposed policy contract

Before implementing, define and version an explicit schema; these field names are illustrative, not existing API guarantees:

`schemaVersion`, `revision`, `functionId`, `collectEnabled`, `processEnabled`, `visibilityByGrant`, `samplingPolicy`, `maxBatchBytes`, `maxRequestsPerSession`, `queueMaxBytes`, `queueMaxAge`, `rawRetention`, `aggregateRetention`, `expiresAt`, `compatibleBuilds`, `changedBy`, `reason`, `publishedAt`.

Every quantity needs a type, unit, bounds, default and verified measurement method. No numeric default is approved by this document. Store private actor/audit data server-side; publish only the minimal client-safe projection. Never include child names, credentials or unnecessary internal metadata in public configuration.

Effective optional collection requires all of: supported build, eligible context, published function enablement, parent permission, valid unexpired policy and remaining resource allowance. Any explicit applicable disable wins. Handle policy expiry and unsupported versions explicitly; optional diagnostics default off when valid eligibility cannot be established. Compatibility with legacy behaviour needs a documented migration, not a silent change to core game controls.

## End-to-end flow and implementation sequence

1. Inventory each producer, timer, listener, uploader, ingestion endpoint, scheduler, database query and dashboard consumer. Record real source path, stable function ID, permission, data fields and current default. Include legacy analytics and website reporting; do not audit only management telemetry.
2. Add a function registry with explicit implemented/partial/proposed/unsupported status. Map each switch to its actual consumers and dependencies. Reject unknown function IDs and unsupported scope server-side.
3. Define versioned schema and permission checks. Separate a private draft/review mechanism from publication: existing configuration POST publishes and cannot be labelled private Save draft.
4. Build the proposed Settings cards and Home summary. Preview affected surfaces, expected timing, retained-data behaviour and budget before publication. Enforce permissions on the server.
5. Publish the minimal policy through the supported configuration path. Track desired, published and received revision separately, with incompatible/offline/unconfirmed states. Do not add frequent configuration polling solely for this panel.
6. Make each optional producer check effective policy before lazy loading, recording, scheduling, retrying and uploading. Stop timers/listeners when disabled. Abort optional in-flight requests where safe; acknowledge that already accepted requests cannot be recalled.
7. For optional analytics disablement, clear only that function's unsent queue according to its explicit policy. Do not clear saves, durable user-filed problem reports or other functions' queues. Audit the existing queue behaviour before reuse.
8. Enforce server-side ingestion disablement so stale clients cannot create accepted optional reporting records indefinitely. This still incurs incoming network/function overhead; rate limits and response policy are required. Drain/cancel optional jobs safely and prevent new scheduling. Preserve security/audit requirements.
9. Run dashboard queries against cached summaries with bounded filters. Hiding a dashboard is independent from pausing work. When processing is paused, show last processed time and backlog policy instead of live/zero labels.
10. Verify actual Netlify Database binding, account limits, indexes and retention before expanding collection. Use existing service, not new provisioning. Report measured requests, bytes and storage growth; distinguish estimates from provider billing.
11. Validate all switch paths, gather evidence and document the remaining capabilities before release review. No main merge, deploy, paid provisioning or production-data deletion is authorised here.

## Required acceptance evidence

- Compare off/on game startup, responsiveness, memory, battery proxies and uploaded bytes on equivalent workloads. Establish numeric acceptance budgets before enabling; do not invent a universal zero-overhead claim.
- Off before startup: no optional module download, collector timer or optional analytics upload for the disabled function. Minimal shared policy-check overhead may remain.
- Off mid-session: no new collection after effective disable; bounded in-flight behaviour and queue disposition verified. Other functions and gameplay remain healthy.
- Parent Analytics off beats Studio on; separate privacy eligibility remains enforced.
- Offline client: Studio says pending/unconfirmed; server rejects disabled optional ingestion as specified. Local policy takes effect only when received or its defined expiry occurs.
- Cold, warm, offline, stale/expired policy, unsupported build, configuration failure, storage full, retry storm and rapid on/off all preserve saves and play.
- Unauthorised writes fail server-side; Studio visibility is not the access-control mechanism. Marketing cannot query child names.
- Show off does not falsely claim collection or processing stopped. Process off exposes freshness correctly. Previously stored data follows its stated retention, not an implied deletion.
- Phone/tablet/computer and EN/VI controls remain understandable and accessible. Physical-device performance coverage and any missing checks are explicitly reported.

## Handoff

Next builder: read `CLAUDE.md`, `HANDOFF.md`, UX-001–010, this file, the connected concept controls/data map, current configuration HTTP/service code, `js/players.ts` and `js/management-telemetry.ts`. Produce the inventory and capability matrix first, then schema and a single end-to-end optional-function implementation. Broaden only after its off/on, privacy, delivery and performance evidence passes. Update the master design, acceptance checklist and next-chat prompt as capabilities become real.
