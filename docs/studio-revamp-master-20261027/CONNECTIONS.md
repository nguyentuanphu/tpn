# Connections and field contracts

## Information coming in

| Source | Existing entry | Storage/authority | Studio use |
|---|---|---|---|
| Game permitted daily usage | POST `/api/hello` | Existing cleaned players/bot-players reporting records | Reporting installs, names/device context with permission, daily play/errors |
| Game detailed observations | POST `/api/management/events` | Validated immutable SQL events and conflict quarantine | Compatible activity/boot/voice/connection outcomes |
| Website aggregate events | POST `/api/parent-analytics` | Private aggregate reporting | Page/actions/engagement, not identified child conversion |
| Game configuration observations | POST `/api/management/config-receipts` | Known revision/hash receipt records | Fixed-cohort coverage and selected-device evidence |
| User-filed problem reports | POST `/api/tester` | Existing entitled report services | Original evidence plus separate management follow-up |
| Versioned content/art | Source extraction and release tooling | Git source, exact reviewed commit | Typed catalogue, explanation/art/release alignment |
| Existing provider feeds | Bounded server adapters | Provider facts plus observation cache | Operations, usage and cost where actually supported |
| Operator financial documents | Private finance preview/commit | Audited SQL ledger | Recorded cost/budget views with coverage caveats |

Private reads are under `/studio/api/management/`: overview, devices, children, devices/:id, activities, activities/:id, attention, releases/:build, config, changes/:id, operations, finance and finance/history routes. Actual permission/query support varies. Use included `references/connected/API-MAP.md` and current code before changing a route. Never invent a ready endpoint from a UI concept.

## Changes going out

Studio edit → validated private draft/review (new contract needed) → supported configuration or reviewed source change → public projection/build → game/website consumer → readback/eligible device observation.

Existing POST config commits and attempts publication; it is not a private Save draft API. Current revisioned management scope is global. A rule selecting devices is not a dedicated device-scoped revision. Public `/api/live` exposes only allowlisted configuration/revision metadata; exclude child names, private actor/cohort/audit and finances. A matching receipt means reported persistence, not universal feature redraw or active-session transition.

Website/game structured facts, fonts, art and release labels come from the same immutable reviewed source. Editorial explanations and screenshots still need human/owner review gates. A Studio control is working only when its consumer and effect have been demonstrated. Some changes require a source build/release rather than live configuration.

## Authority boundaries

- Local game saves own local play progress. Analytics cannot overwrite them.
- Private family membership/content uses its own access model; Studio management permission is not a substitute.
- Stable profile/installation IDs establish only their recorded relationship. Names are display data, not join keys.
- Website visits and game installations stay unlinked unless a deliberate eligible handoff establishes a limited relationship. No fingerprinting.
- Git owns reviewed source; provider evidence owns actual deployment/billing facts; finance ledger owns recorded documents and corrections.
- Existing Netlify SQL stores management transactions; existing reporting/blob sources are not silently migrated into one SQL table.

## Every field must have this contract

| Required entry | Example or rule |
|---|---|
| Stable key, type, unit | Integer minutes differs from elapsed milliseconds; exact finance minor units differ by currency exponent |
| Nullable/default/bounds | Missing retained day stays null, not zero; specify rejected values |
| Purpose and eligibility | Why collected; parent permission; build/context restrictions |
| Producer and hook | Exact source path/function and lifecycle trigger |
| Transport and validator | Existing/proposed route, schema version, size limits, rejection |
| Store and authority | Namespace/table/record key, not “database” alone |
| Join and cardinality | Stable typed item/profile/installation IDs; no name joins |
| Permission and projection | Server grant, private/public allowlist, allowed consumers |
| Time basis and freshness | Device-local daily bucket vs UTC event; generatedAt/watermark |
| Metric/control consumer | Graph formula/denominator or actual setting read path |
| Retention and recovery | Category-specific duration, expiry, backup/restore/deletion rules |
| Missing and failure state | Zero/no samples/not collected/unknown/unavailable/stale |
| Evidence and status | Historical/current/proposed, source commit, test and known gap |

Existing 279-entry register is included in JSON/CSV/Markdown. It includes overlapping historical families and refinements; it is not every leaf of every gameplay save. Extend it for all new fields rather than treating this broad proposal as permission to collect everything.

## Control acceptance contract

Every action names purpose, actor permission, stable target, current/effective value, desired value, supported scope, dependencies, validation, expected revision, preview, change reason, audit, actual consumer, safe apply timing, retry/conflict, rollback availability and effect evidence. Destructive changes and payments remain separately authorised. Unsupported scope remains disabled with explanation.
