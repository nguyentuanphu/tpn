# Current system: evidence, authority and gaps

Baseline: `ac76cf6097a8071bf2da4be90fe81fd0af8201d6`. This is a source inspection, not a fresh production audit. Paths below are repository-relative; proposed modules in later chapters do not yet exist.

## Existing components

| Responsibility | Current files / route | Authority and storage | Important limit |
|---|---|---|---|
| Game boot and world | `index.html`, `js/main.ts`, `js/launch.js`, `js/world.ts` | Game runtime | Old docs saying no build are outdated for TypeScript sources |
| Build | `tools/build.mts`, `tsconfig.base.json` | Generates ignored JS from erasable TypeScript | Keep tracked declarations and generated outputs distinct |
| Activities | `js/games/registry.ts`, `js/games/frame.ts`, `js/content/activities.ts` | Stable registered game IDs, shared frame | Translated labels are not stable keys; browser imports use generated `.js` |
| Events | `js/core/events.ts` | In-process event bus | Not a durable remote event ledger |
| Story/reward/unlocks | `js/talesdata.ts`, `js/content/unlocks.ts`, `js/content/secondset.ts`, `js/stickers.js` | Versioned catalogues and profile progress | New-set availability and completion requirements are separate gates |
| Saves | `js/state.ts`, `js/content/savecopy.ts` | localStorage with IndexedDB/Cache recovery and explicit copies | Not an always-synchronised central save service |
| Game analytics producer | `js/players.ts` | `sv2_playerid`, `sv2_hello_out`, `sv2_bot_telemetry` | Current game analytics can include first names and age groups |
| Game analytics ingestion | `netlify/functions/hello.mts`, `netlify/lib/hello-clean.mts` | `/api/hello`, validation/rate limits | Public telemetry is self-reported, not authenticated reward evidence |
| Reporting | `netlify/lib/players.mts` | `players`, separately `bot-players`; `/studio/api/players` | Existing daily totals cannot provide exact attempt funnels |
| Parent website | `home/index.html`, `home/site.ts`, `home/analytics.ts` | Generated public page | Standalone counts and embedded website behavior differ |
| Website generation | `tools/build-website.mts`, `docs/website-review-20261023/sync-website.mjs` | Reviewed prototype + source fingerprints -> `home/` | No current general live catalogue API synchronising all descriptions |
| Floating website | `js/website.ts` | Isolated frame with language and bounded navigation messages | Does not pass saves, player profiles or analytics into the website |
| Website analytics | `netlify/functions/parent-analytics.mts` | `/api/parent-analytics`, store `parent-analytics`, keys `sum/<UTC day>` | No stable visitor/session identity; counts are best effort |
| Studio shared UI/engine | `studio/ui/app.ts`, `studio/core.cts` | One implementation for online/local modes | Some functions need connected website services or local capabilities |
| Studio local server | `studio/studio.cts` | Loopback server; settings outside game folder | Windows packaging is a separate build and validation target |
| Studio online | `netlify/functions/studio.mts` | `/studio/api/*`, cookie/key authentication | Git proxy read access does not establish API/provider privileges |
| Live rules/content | `netlify/lib/live.mts`, `js/custom.js` | `live` store, `/api/live`, device `sv2_live` | Public response; no per-device applied revision receipt today |
| Deferred publication | `studio/core.cts` githubStore(), `studio.mts` heldOn() | `studio-pending` -> `studio-draft` -> approved family publication | Do not reinterpret as general permission to merge application code |
| Tester reports | `js/tester.ts`, `js/report-outbox.ts`, `netlify/functions/tester.mts`, `netlify/lib/tester.mts` | `/api/tester`, private `testers` | Entitlement, redaction, receipt and retention matter |
| Auth/permissions | `netlify/lib/admins.mts`, `guard.mts`, `accesslog.mts` | `studio-admins`, `guard`, `studio-log` | Existing audit log is not full before/after change history |
| Family photos | `netlify/lib/family.mts`, `family-devices.mts`, `js/familydevices.ts` | Private photo APIs/collections and membership | Distinct from statistics family codes and save transfer |
| Online play | `js/net.ts`, `js/relay.ts`, `netlify/functions/turn.mts` | WebRTC/PeerJS, MQTT relay, temporary TURN details | No complete join-success business denominator currently demonstrated |
| Voice | `js/voice.ts`, `js/voice-index.ts`, `js/voicepack.ts`, `tools/make-voice-pack.mts` | Language manifests and recordings; missing-line inbox | Missing-line counts do not give playback-success percentage |
| Synthetic jobs | `netlify/lib/child-bots.mts`, `netlify/functions/child-bots.mts`, `.github/workflows/nightly-child-bots.yml` | Private bot schedule, workflow artifacts | Schedule currently uses UTC; do not silently reinterpret as Sydney time |
| Hosting/release | `netlify.toml`, `build-netlify.sh`, `.github/workflows/` | GitHub/Netlify and owner release gate | Drag/drop deployment does not provide server functions |

## Existing behavior that the design must preserve

- `LIVE_PAGES` allows messages, missions, quiz, stories, villagers, looks, plots, Simple screen, defaults/features, ads settings and album metadata to save live when connected. Music, map and uploaded voice/photo assets still have publication paths. Scope must be explained per page.
- `/api/live` includes public release/festival rules and allowed content, with a 30-second cache. Admin identity and private bot schedule are excluded. Public photo references are not photo bytes or authorisation.
- Existing public release rules can include targeted installation IDs. Do not treat those identifiers or the current targeting list as secrets. The proposed public website-specific projection must omit device targeting, and new private management fields must never be added to the existing public response by accident.
- Analytics off prevents game reporting. `reportNames === false` suppresses reported first names. Existing personal-data behavior must be described accurately; new management aggregates should omit names unless an operational view requires them.
- Game hello batches retry with a stable batch ID and server seen records. This is useful existing deduplication, not proof that all current multi-record updates are transactional or race-free.
- Synthetic hello data is separated into `bot-players` when both classification flags match. Do not pool that store into ordinary audience reports. Treat manually authorised test-device classification as a new filter requirement where not already supported.
- Website analytics counts unless a local opt-out says no. It is disabled in the game-embedded website. Current delivery does not inspect response success before dropping an in-memory batch, and aggregation reads and rewrites a daily document. Loss, duplicate counting under retries added later, and concurrent-write behavior need explicit design before claiming financial-grade accuracy.
- The game's day/hour buckets are device-local; parent website server summaries use UTC; tester daily summaries use Sydney; bot schedules use UTC. Normalising these without provenance would change their meaning.
- Existing family statistics grouping uses a family-code digest. It is neither the private family-photo authorisation nor progress synchronisation.
- Source-level permission inconsistency to verify: the parent-analytics handler calls `admins.allowed(me, 'analytics', false)`, but `admins.needs()` interprets API operation names and has no special case for the literal `analytics` string at this baseline. It therefore reaches the general read fallback rather than directly testing the Analytics permission. Do not assume its message proves the intended permission is enforced. B07/V09 must include this existing route in the role matrix and resolve the mapping explicitly; this documentation task does not change the handler or claim a production access test.

## Current storage map

| Store / location | Existing contents | Public? | Management use |
|---|---|---|---|
| Device `sv2_*` / IndexedDB / Cache | Settings, profiles, farm, safe copies, telemetry outbox, kept live data | No | Operational health summaries only through approved reporting |
| `players` | Daily/device records, presence, summaries, missing-line inbox | No | Existing source for ordinary device analytics |
| `bot-players` | Synthetic hello records | No | Synthetic quality dashboard, never audience growth |
| `parent-analytics` | Daily event aggregates | No | Website event counts with clear limits |
| `testers` | Entitled reports, problems, receipts and images | No | Triage, evidence and fix verification |
| `live` | Live public configuration plus private bot schedule in separate key | Partially projected | Read only public projection from public routes |
| `studio-pending` / draft Git branch | Deferred family file changes | Authenticated access | Publishing status and exact changed paths |
| `studio-admins`, `guard`, `studio-log` | Accounts, grants, lockouts, access history | No | Security operations; no secrets in read models |
| Private family collections | Photo data, membership, credentials | No | Separate restricted workflows, not KPI dimensions |

Detailed key shapes and fields are in [the data dictionary](02-DATA-DICTIONARY.md). Retention is not uniform: tester limits declare 60 days; players tidy handles older records and seen IDs; Studio access log lists 200 and keeps 1,000. Those are current mechanisms, not proof every cleanup has run on production. No complete finance ledger, exact attempt ledger or applied-revision service was found in the inspected modules.

## Infrastructure and connection boundaries

| Caller -> destination | Transport / purpose | Authentication or restriction | Existing / proposed |
|---|---|---|---|
| Child browser -> Netlify CDN | HTTPS assets, game and `/home` | Public released resources; service worker/cache on device | Existing |
| Child browser -> `/api/hello` | HTTPS bounded analytics and presence | Public input with validation/rate limits; Analytics setting governs collection | Existing |
| Entitled tester -> `/api/tester` | HTTPS private report intake and own receipts | Server validates tester entitlement and bounded payload | Existing |
| Game -> `/api/live` | HTTPS public allowed configuration | Public cached response, not a private command channel | Existing |
| Game -> private photo APIs | HTTPS photo access or device-collection operations | Family-code or device-membership mechanism as applicable; separate from statistics code | Existing |
| Game -> PeerJS / WebRTC / MQTT services | Introduction, peer connections and relay | Existing room/friend admission and media controls; scoped temporary TURN details | Existing |
| Floating website <-> game frame | Same-origin bounded navigation messages | Exact frame source/origin validation; language passed, no save payload | Existing |
| Standalone website -> parent analytics endpoint | HTTPS aggregate event intake | Allowlisted fields, rate limiting and local opt-out; embedded counting disabled | Existing |
| Online Studio -> same-origin Studio functions | HTTPS authenticated reads/writes | Current owner/admin cookies, permissions and scoped desktop keys | Existing |
| Netlify functions -> Netlify Blobs | Server-side storage SDK | Site-bound service access, never browser credentials | Existing |
| Studio server -> GitHub API | Read source, create family draft/publish, inspect/dispatch allowed workflows | Server-side token with required repository scopes; Git proxy access alone does not grant this API access | Existing capabilities, actual scope must be checked |
| Studio server -> Azure Speech | Generate recordings | Server/local configured Azure credential; no child-browser voice key | Existing optional capability |
| Studio server -> Netlify management API | Site status/rebuild/restore where permitted | Provider token; application permissions and release approval still apply | Existing optional capability |
| Windows Studio -> local loopback server | Dashboard and local game on `127.0.0.1:7777` by default | Local machine boundary; settings in application data outside the checkout | Existing |
| Connected desktop Studio -> online Studio | HTTPS scoped family/report/live-content operations | Studio key; not the owner's website password | Existing |
| Management functions -> PostgreSQL | TLS transactional ledger/config/audit/finance | Private least-privilege server role; no browser connection string | Proposed |
| Management adapters -> billing/job providers | HTTPS read-only billing/usage or bounded job actions | Explicit provider-specific scopes; no inferred credential availability | Proposed expansion |

Production and staging must have separate provider scopes, stores and public origins before new management writes are enabled. Development uses synthetic fixtures and local services; never point an automated test at real family data. Keep a service inventory with owner, endpoint class, data classification, timeout, quota, last successful check and recovery path. Provider/domain discovery is read-only until the specific operation is authorised.

Existing configuration names include `STUDIO_PASSWORD`, `GITHUB_TOKEN`, `GITHUB_REPO`, `GITHUB_BRANCH`, `AZURE_KEY`, `AZURE_REGION`, `NETLIFY_TOKEN` and `FAMILY_CODE`; only names are documented here. Proposed database and billing bindings must be added through secure environment configuration after provider selection. Do not print or export their values into the handbook, browser code, screenshots or repository.

## Gaps to close deliberately

1. Map game IDs to reviewed website explanations and Studio operational pages without duplicating catalogue authority.
2. Add common read-model metadata, pagination, data-quality flags and comparison eligibility.
3. Add attempt/boot/connection/outcome measurement before offering exact funnels and p95.
4. Add revisioned scoped changes and receipts before offering applied-device coverage.
5. Add explicit finance inputs, reconciliation, currency and cost-allocation policy.
6. Add before/after audit, owner/action links and operational recovery evidence.
7. Keep personal fields, public content, operational reports and financial permissions separate.

The historical architecture document contains both implemented and proposed sections. A described future entity/service layer is not evidence that it exists. Always resolve claims against source and tests at the selected commit.
