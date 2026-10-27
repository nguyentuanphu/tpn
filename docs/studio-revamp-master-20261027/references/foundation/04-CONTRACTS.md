# Builder contracts: data, APIs, storage and failure behavior

All `/management/` routes and transactional tables in this chapter are **proposed**. Existing `/api/hello`, `/api/tester`, `/api/live`, saves and website counters remain compatible. No route here is an instruction to call production.

## 1. Identifiers and ownership

| Identifier | Owner | Meaning / join rule |
|---|---|---|
| `activityId` | Existing catalogue | Bare stable ID such as `oanquan`; adapter converts existing `game:oanquan` event definition IDs |
| `storyId`, `featureId`, `festivalId`, `placeId` | Existing corresponding catalogue | Namespace explicitly; do not join translated text |
| `deviceId` | Installation | Existing random installation ID; no guarantee of unique person or resistance to spoofing |
| `sessionId` | Running game tab | New tab creates a new session; not a daily active user |
| `attemptId` | One operation attempt | UUID per activity/boot/connection/story/voice/update/backup operation; stable across retries |
| `eventId` | One event | UUID generated before durable enqueue, never regenerated for transport retry |
| `build` | Release | Existing labels parsed with `netlify/lib/build-number.mts`, not lexical sort |
| `sourceCommit` | Build pipeline | Full source SHA; unknown legacy data remains unknown, never filled from current HEAD |
| `configRevision` | Management configuration transaction | Monotonic integer within named scope; timestamps are not revision identifiers |
| `changeId`, `problemKey`, `runId`, `invoiceId` | Their service | Distinct types; do not reuse one string as a grant for another API |

## 2. Read-model response contract

New Studio views read a server-composed response. They must not download all raw personal events to calculate a public-looking chart in the browser.

```json
{
  "schemaVersion": 1,
  "generatedAt": "2026-10-26T00:00:00Z",
  "sourceAsOf": "2026-10-25T23:58:00Z",
  "period": {"from": "2026-10-19", "to": "2026-10-25", "basis": "legacy-device-day"},
  "scope": {"traffic": "ordinary", "build": "v1.01", "deviceClass": "all"},
  "metrics": [{"id": "M08", "value": 28, "unit": "FPS", "status": "observed", "sampleCount": 40}],
  "quality": ["reporting-devices-only", "legacy-local-day"],
  "nextCursor": null
}
```

This example is synthetic. `status` is `observed`, `estimated`, `unavailable` or `insufficient`. Unavailable/insufficient values are null, never zero. Preserve a real observed zero. Every result also carries formula version in its endpoint documentation/cache key. Pagination uses stable `(lastSeen, deviceId)` or equivalent tuple cursors, not a mutable offset. Normal page size 25; maximum 100; response size target 256 KB. Summary numbers must cover the full eligible scope, not just the returned page. Return total eligible count and applied filters; personal detail endpoints are separate.

Proposed Studio routes:

| Method / route | Inputs | Permission | Output / failures |
|---|---|---|---|
| GET `/studio/api/management/overview` | bounded period, build, traffic | `management.read` | Six-card summary with quality flags; no child names |
| GET `/studio/api/management/activities/:id` | catalogue ID, period, compatible build scope | `management.read` | Facts, usage, website provenance, issues, tests; unknown ID 404 |
| GET `/studio/api/management/devices` | cursor, class, build, freshness | `management.read` | Paged operational installation records without names by default |
| GET `/studio/api/management/devices/:id` | installation ID | `management.deviceDetail` | Restricted existing profile/context fields only when permitted |
| GET `/studio/api/management/attention` | status, severity, cursor | `management.read` | Evidence-linked signals, affected scope, owners |
| POST `/studio/api/management/attention/:id` | expectedRevision, owner, state, reason | `management.triage` | Audited transition; 409 stale revision; 422 invalid state |
| GET `/studio/api/management/releases/:build` | build | `management.read` | Candidate/production evidence, compatible comparisons, outstanding gaps |
| POST `/studio/api/management/config` | expectedRevision, scope, allowlisted patch, reason | existing `edit` or `releases` as applicable, plus audit path | Revisioned change; no arbitrary JSON property writes |
| GET `/studio/api/management/changes/:id` | change ID | `management.read`; actor fields further restricted | Change state and eligible/confirmed/unconfirmed counts |
| GET/POST `/studio/api/management/finance/lines` | period/cursor or validated line | `finance.read` / `finance.write` | Private ledger; 409 duplicate mismatched invoice line |
| GET `/studio/api/management/operations` | service/run filters | `operations.read` | Provider health, quotas and workflow outcomes with feed age |

These are complete route names for the proposed namespace. Register permission IDs in `admins.PERMS` and test server-side. Do not assume a string permission makes the endpoint exist. Apply the current cookie/key authentication and request-origin/CSRF protections; do not weaken the existing `X-Studio`/same-origin handling. The desktop wrapper calls the same shared engine methods or a scoped connected service; missing capabilities show an explanation, never an empty success.

Add explicit operation-to-permission mappings before `admins.needs()` reaches its generic fallback. Unknown `/management/` operations must return 404, not inherit a broad page/edit capability. A helper that maps API operation names is not interchangeable with a direct permission-membership helper; include the current parent-analytics call described in the source inventory in that audit.

## 3. New event protocol

See [event schema](schemas/event.schema.json) and [synthetic examples](examples/events.json). Event names are a new external protocol; existing event-bus payloads must pass through an explicit adapter.

The other structural contracts are [read-model schema](schemas/read-model.schema.json), [configuration receipt](schemas/config-receipt.schema.json), and [finance line](schemas/finance-line.schema.json). JSON Schema proves allowed shape/types, not domain truth. Service checks must additionally verify catalogue membership, source/build provenance, time plausibility, periodStart <= periodEnd, supported ISO currencies/minor units, positive FX rates, known revision/hash/scope, current permission and nonconflicting operation lifecycle. The synthetic all-zero receipt hash is a format example, not a valid deployed revision.

Required common fields: `schemaVersion`, `eventId`, `deviceId`, `sessionId`, `attemptId`, `eventName`, `occurredAt`, `deviceDay`, `offsetMinutes`, `build`, `sourceCommit`, `environment`, `traffic`, `data`. `occurredAt` is an ISO UTC timestamp. Offset is minutes east of UTC, so Sydney daylight saving is +660; JavaScript `getTimezoneOffset()` has the opposite sign and must be negated. The server supplies `receivedAt`, canonical payload hash, accepted source classification and processing version.

No profile first names, photos, raw speech, chat text, family codes, credentials, complete URLs or raw IP enter this new measurement protocol. Existing restricted analytics remains a separately governed source; do not copy its personal fields into a new ledger by default.

| Event names | `data` fields | Terminal rules |
|---|---|---|
| `activity.started` | activityId, difficulty, mode | Exactly one attempt ID per launch, independent of player count |
| `activity.completed` | activityId | Completion is the existing frame's successful terminal result |
| `activity.abandoned` | activityId, reason | Explicit close/navigation/cancel; mutually exclusive with completed |
| `boot.started`, `boot.ready`, `boot.failed` | stage; ready includes elapsedMs; failed includes bounded reasonCode | Same boot attempt ID; failures before code runs remain unobservable |
| `story.opened`, `story.completed` | storyId | Completed means explicit final-page completion, not merely opening final page |
| `connection.attempt`, `connection.result` | transport; result includes outcome and elapsedMs | No room/friend code, address or audio payload |
| `voice.result` | source, outcome, language | Count one attempted playback; no text or personal recording reference |
| `update.result`, `backup.result` | outcome, reasonCode | Operation result only; never send save/backup contents |

An attempt pending after 24 hours is marked `outcome_unknown`, not abandoned. Later valid outcomes can revise its provisional rollup within a 7-day grace window. After that, keep a correction audit and recalculate explicitly rather than silently altering a signed-off report. An orphan terminal event is held for its start to arrive; do not invent a start. A conflicting completed/abandoned pair becomes `inconsistent`, excluded from terminal-ratio claims with a visible data-quality count. Counts from legacy daily buckets and new attempt events must never be summed as the same measure.

## 4. Ingestion, acknowledgement and retry

Proposed public endpoint: POST `/api/management/events`, body `{schemaVersion:1, events:[...]}`. Maximum 50 events and 64 KB per request. Field limits are in the schema. Reject the entire malformed batch with 400; 413 oversized; 422 unsupported schema/content; 429 with Retry-After for rate limits. Authentication for reading is never exposed by this public intake.

Return a response only after committed storage:

```json
{"accepted":["11111111-1111-4111-8111-111111111111"],"duplicates":[],"rejected":[]}
```

The response lists exact event IDs. Retried matching `(deviceId,eventId,payloadHash)` is acknowledged as duplicate. Same ID with a different canonical hash is a 409 conflict and is quarantined; do not overwrite a stored event. Canonicalisation sorts object keys recursively, preserves JSON array order, and rejects non-finite numbers before hashing. Server receipt metadata is excluded from the canonical payload hash.

Client rules: persist before send; one flush at a time; remove only acknowledged IDs; persist retry ID and payload unchanged. Retry transient failures with full jitter at 1, 2, 4… seconds capped at 15 minutes; respect Retry-After; flush on reconnection; pause while hidden except bounded closing send. Beacon dispatch never counts as acknowledgement. Proposed local queue limit: 1 MB or 5,000 events and 30 days; preferentially keep terminal events for retained starts, expose dropped/expired counts, never let analytics storage evict saves. A storage failure must not stop play. Analytics off stops collection and sending, clears only the new unsent analytics queue, and preserves saves/private photos; document any historical server retention separately.

Public installation identifiers can be spoofed. Rate limit, validate catalogues/builds and separate environment/traffic classes. Server-configured synthetic-job identity should corroborate bot classification when available. These reports support operations, not entitlements, rewards, payments or proof of identity. Do not promise fraud-proof audience numbers.

## 5. Proposed durable storage

Phase 1 uses existing reporting adapters, without a new database. Before exact events, revisioned changes and finance writes, provision an approved managed PostgreSQL service with encrypted transport, private credentials, region, backup and cost settings agreed in decision D03. Provider choice is reserved; the required transactional behavior is not optional.

Use a migration with these minimum constraints. This is reference structure, not permission to create production resources:

```sql
CREATE TABLE management_events (
  device_id text NOT NULL, event_id uuid NOT NULL,
  session_id text NOT NULL, attempt_id uuid NOT NULL,
  event_name text NOT NULL, occurred_at timestamptz NOT NULL,
  received_at timestamptz NOT NULL DEFAULT now(),
  build text NOT NULL, source_commit text NOT NULL,
  environment text NOT NULL, traffic text NOT NULL,
  payload_hash text NOT NULL, payload jsonb NOT NULL,
  PRIMARY KEY (device_id,event_id)
);
CREATE INDEX management_event_period ON management_events(occurred_at,build,traffic);
CREATE INDEX management_attempt ON management_events(device_id,attempt_id,event_name);
CREATE TABLE management_configs (
  scope_key text PRIMARY KEY, revision bigint NOT NULL,
  body jsonb NOT NULL, effective_hash text NOT NULL,
  updated_at timestamptz NOT NULL, actor_id text NOT NULL
);
CREATE TABLE management_config_versions (
  scope_key text NOT NULL, revision bigint NOT NULL,
  body jsonb NOT NULL, effective_hash text NOT NULL,
  created_at timestamptz NOT NULL, actor_id text NOT NULL,
  PRIMARY KEY(scope_key,revision)
);
CREATE TABLE management_changes (
  change_id uuid PRIMARY KEY, scope_key text NOT NULL,
  revision bigint NOT NULL, previous_revision bigint NOT NULL,
  before_hash text NOT NULL, after_hash text NOT NULL,
  actor_id text NOT NULL, reason text NOT NULL,
  state text NOT NULL, created_at timestamptz NOT NULL,
  available_at timestamptz, UNIQUE(scope_key,revision)
);
CREATE TABLE management_receipts (
  device_id text NOT NULL, scope_key text NOT NULL,
  revision bigint NOT NULL, effective_hash text NOT NULL,
  result text NOT NULL, received_at timestamptz NOT NULL,
  payload jsonb NOT NULL,
  PRIMARY KEY(device_id,scope_key,revision)
);
CREATE TABLE management_projection_jobs (
  job_id uuid PRIMARY KEY, scope_key text NOT NULL,
  target_revision bigint NOT NULL, state text NOT NULL,
  attempt_count integer NOT NULL DEFAULT 0,
  next_attempt_at timestamptz NOT NULL,
  last_error_code text, UNIQUE(scope_key,target_revision)
);
CREATE TABLE management_attention (
  attention_id uuid PRIMARY KEY, source_kind text NOT NULL,
  source_id text NOT NULL, revision bigint NOT NULL,
  owner_id text, state text NOT NULL,
  evidence jsonb NOT NULL, next_action text,
  updated_at timestamptz NOT NULL,
  UNIQUE(source_kind,source_id)
);
CREATE TABLE management_audit (
  audit_id uuid PRIMARY KEY, entity_type text NOT NULL,
  entity_id text NOT NULL, revision bigint NOT NULL,
  actor_id text NOT NULL, reason text NOT NULL,
  redacted_change jsonb NOT NULL, at timestamptz NOT NULL,
  UNIQUE(entity_type,entity_id,revision)
);
CREATE TABLE management_finance_lines (
  line_id uuid PRIMARY KEY, provider text NOT NULL,
  account_alias text NOT NULL, source_document_id text NOT NULL,
  source_line_id text NOT NULL, kind text NOT NULL,
  amount_minor bigint NOT NULL, currency char(3) NOT NULL,
  payload jsonb NOT NULL, revision bigint NOT NULL,
  UNIQUE(provider,account_alias,source_document_id,source_line_id,kind)
);
CREATE TABLE management_finance_versions (
  line_id uuid NOT NULL REFERENCES management_finance_lines(line_id),
  revision bigint NOT NULL, payload jsonb NOT NULL,
  actor_id text NOT NULL, reason text NOT NULL,
  created_at timestamptz NOT NULL,
  PRIMARY KEY(line_id,revision)
);
```

Add database CHECK constraints reflecting validated enums/ranges, indexes for cursor queries, migration versioning and explicit restricted application roles in the implementation. Server credentials never enter browser bundles. A rollup table must key `(metricVersion,period,scopeHash)` with `sourceWatermark`, `generatedAt`, sample counts and quality flags. Derive it from committed rows, not client increments. A replay over the same source set must produce the same result. Store projection/outbox jobs transactionally with configuration changes. Support migrations run against fixtures and a staging copy before production; no destructive reset.

Configuration version bodies are immutable and contain only allowlisted public configuration; keep them so a compatible earlier body can be selected for rollback. Do not store credential material in version bodies or audit diffs. Finance corrections append a version and an audit row in the same transaction as the current-line change. Attention owns assignment and management milestones; the existing tester store continues to own its original problem status. Any required write back into that store uses an explicit pending projection job and read-back confirmation, never an unacknowledged dual write or two independent authorities for the same status.

Why a transactional store: existing blob read-modify-write counters cannot alone guarantee exactly-once multi-record writes under concurrency. Do not add a counter and call it transaction-safe. Provider unavailability blocks new transactional writes; existing game/live paths remain available until an explicitly tested cutover.

## 6. Revisioned configuration and compatibility

1. Client reads current scope and revision. It submits expectedRevision plus an allowlisted patch and human reason.
2. Server checks the current account's existing content/release permission and target scope. In a transaction, lock the scope row, compare revision, validate the effective body, increment revision, write change and projection job. A stale editor receives 409 with latest revision, never last-write-wins.
3. A single projector publishes the latest effective public view into the existing live blob. All writers to that projection must pass through this path once cut over. Use a dedicated PostgreSQL advisory lock held on the same connection during bounded projection, with a write timeout; never rely on a non-atomic blob lease.
4. Read back the projected revision/hash. Only then mark the change available. Failed projection remains pending with its error; retry latest state, not an older queued snapshot. Proposed metadata is additive to the existing public response; old clients ignore it.
5. Game resolves existing feature behavior, applies allowed configuration, persists kept revision/hash and submits an acknowledgement to NEW POST `/api/management/config-receipts`. Receipt contains device ID, scope key, revision, hash, fetched/applied timestamps, result and bounded reason code. Reject unknown revisions/hash mismatches; duplicate matching receipts are safe.
6. Studio snapshots the eligible last-30-day reporting installations at change time and displays confirmed, rejected, unsupported and unconfirmed. Later new devices appear separately. Device claims are self-reported; do not label them cryptographic proof.

Scope definitions: `global`, `device:<installation-id>` and catalogue-backed feature scopes only. Global and scoped layers have deterministic precedence documented per field; do not change the existing `releaseOn`, `featureOn`, `keptOn` semantics as a side effect. Explicit disabling currently interacts with previously tried retention; B06 must enumerate exceptions rather than assume all switches behave identically. No revision may invoke arbitrary JavaScript or remote save mutation.

Rollback creates a new revision carrying a previously validated compatible configuration. It does not decrement revision or delete change history. Application rollback uses existing Release approval, compatible assets/saves and a separate deployment record.

## 7. Website and catalogue contract

The initial adapter reads actual source IDs and reviewed website provenance. A proposed catalogue export includes `kind`, `id`, bilingual name, category, supported modes/difficulties, relevant feature IDs, source SHA, guide reference, reward references and coverage results. It never contains profiles, device lists, private photo references or test policies.

Parent editorial copy remains authored/reviewed, joined by stable IDs. Keep the four existing top-level website destinations. A build fails if its source identity differs from the game release, an activity ID is unknown, a promised reward is absent, or required EN/VI content is missing. New runtime activity deep links require a separate tested navigation contract; do not invent routes from labels.

For public live calendar facts, define a minimal allowlisted projection with cache headers and no selected-device IDs. Until that projection exists, label the website calendar as build-time information and avoid promising real-time parity. One administrator saving a private/test-device rule must not reveal the rule publicly.

## 8. Finance writes and calculation

Money is integer minor units plus ISO currency. Store original currency amounts and tax separately. Proposed reporting default is AUD, with owner approval of currency and tax basis before activation. A converted value requires explicit decimal FX rate, source and date; absence gives unavailable. Never use binary floating-point for persisted money or cumulative FX calculations; use decimal arithmetic with documented rounding at presentation/import boundaries.

`actual`, `estimate`, `commitment`, `credit` and `revenue` are distinct classifications. Idempotent imports key provider, account alias, source document and source line, with content hash comparison. Corrections retain prior versions and actor/reason; no silent overwrite of reconciled invoices. Invoice PDFs, tokens and payment details stay outside the repository and normal telemetry.

First phase supports manual entry/CSV import with preview, validation and reconciliation. Provider adapters later report their last successful sync, missing periods, scope and errors. A Git read credential is not a billing credential. Scheduled job dispatch is not evidence of completed work or actual cost. No automatic purchases, payments or external notifications are included.

## 9. Time, retention, quality and limits

New event instants are UTC; management business-period display uses Australia/Sydney and labels AEDT/AEST. Preserve source-native day labels for legacy data. Mixed legacy/UTC/Sydney periods must be visibly distinguished until a valid adapter can align them. Validate wildly future events against receipt time and quarantine implausible clocks; do not silently move them to a more convenient day.

Proposed retention for new stores: event detail 90 days; pseudonymous device/cohort detail 90 days; nonpersonal daily aggregates 13 months; configuration audit and finance according to an owner-approved retention policy before activation. Retention must have a job, last-success marker, deletion count, failure alert and recovery instructions. Existing tester/private-photo retention stays independent. Historical aggregation/deletion must not claim anonymisation merely because names were removed.

Initial proposed operating budgets: management requests p95 <2 seconds for cached overview; no eager management scripts in game startup; new telemetry average <=10 KB per active installation-day excluding explicitly permitted screenshots on the existing tester path; rate limits and storage growth observed in staging. These are acceptance targets to measure, not measured results. Drop nonessential analytics work before blocking play or saves. New schema versions need compatibility fixtures and rollout order server first, client second, new cards last.
