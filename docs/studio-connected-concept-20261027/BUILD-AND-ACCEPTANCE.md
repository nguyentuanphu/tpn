# Builder handoff, sequencing and acceptance

This concept expands the earlier B01–B12 foundation; it does not replace historical evidence or declare those tickets finished. Runtime implementation remains paused for concept review. Nothing here grants main merge, Netlify deployment, paid provisioning, family-save deletion or a version bump.

## Work packages and dependencies

| Package | Concrete output | Dependency | Evidence needed |
|---|---|---|---|
| D01 Capability inventory | Every current Studio route/action → destination, permission, source, retained/replaced status | Existing 41-page review and current source | No capability silently lost; domain map alone is insufficient |
| D02 Shared navigation and shells | Approved desktop/tablet/phone layouts and EN/VI terms | Owner concept review; shared UX rules | Representative flows, loading/errors, keyboard/safe areas |
| D03 Scoped data adapters | Graph/read-model contracts with source unit/time basis/freshness | D01; registry current/historical distinction | Supported/unsupported filters and permission boundaries |
| D04 People journey | Profile-on-installation → device/problem/change evidence | D02/D03; L01/L02/L06/L07 | No name-based identity merge; no private-data leakage |
| D05 Graph components | Responsive charts, accessible tables, explain/data/drilldown | D02/D03; GRAPHS definitions | Formula/sample/zero/unknown tests for each actual adapter |
| D06 Content/control editor | Selected item, dependencies, impact preview, revision conflict and delivery | D02/D03; L04/L05/L06 | No draft published; global vs per-rule targeting distinction |
| D07 Work/release journey | Issue assignment, original evidence, tests, approval and provider state | D02/D03; L07/L08/L09 | No drag-to-deploy; actual verification required |
| D08 Money journey | Ledger, imports, budgets, coverage, qualified graphs | Existing finance service; D02/D03 | Exact minor units/FX; immutable history; no unsupported bank/profit claim |
| D09 Optional new measurements | Short-lived website handoff, mature cohorts, obligation due dates | Separate approved contracts, retention and migrations | No speculative fields/endpoints portrayed as current |
| D10 Activation and migration | Secure Netlify binding, category retention/deletion, recovery drill, route retirement | Prior packages; real authority/access | Preview/live segregation, schema checks, physical-device limits, regression and owner approval |

D09 is not required to make D04 or D08 useful. Deliver one complete journey before migrating all screens. Preserve functional existing backend validations and audit history; do not rewrite them only to match new visual components.

## Per-field implementation checklist

For each new/changed field, extend the registry with: stable ID; exact key/type/unit/nullable/default; producer; collection purpose/eligibility; validation and bounds; endpoint/method; canonical storage and migration; join/dedup identity; permission; consumer/graph/control; public/private projection; date basis/freshness; retention/deletion/backup treatment; missing/error state; read/write evidence; test and source reference. This concept’s family-level rows are not a replacement for a production field schema.

Any producer that cannot supply a field must leave it explicitly unsupported, not fabricate a value. A proposed route/schema must be designed and reviewed before a form starts sending it. Event-client reports remain untrusted observations, not authentication or proof a physical action occurred.

## Acceptance scenarios

| ID | Scenario | Expected result |
|---|---|---|
| A01 | Two profiles have the same first name on different installations | Separate records; no automatic merge |
| A02 | One installation has two participating profiles | One installation, two local-profile records; attempts and participations labelled separately |
| A03 | Name reporting is disabled | Names absent; allowed anonymous evidence can remain; no blank name silently matched elsewhere |
| A04 | Summary-only operator opens People or a tester image | Detail/image denied or withheld by server; graphs do not leak name-bearing data |
| A05 | Website has 100 views and 20 Play clicks | Event counts shown; no claim of 20 successful new players |
| A06 | Game boot observations exist without handoff | Separate populations shown; matched conversion unavailable |
| A07 | Owner selects a child filter unsupported by an event adapter | Explicit unavailable or visibly separate scope; no unfiltered chart under selected-child label |
| A08 | FPS cohort has unequal sample counts per device | Weighted sum/count; not average of device averages |
| A09 | No eligible battery samples | Unavailable/no samples; no zero-energy claim |
| A10 | Attempt starts but no terminal event arrives | Pending/unknown remains explicit, no invented abandonment/completion |
| A11 | Voice playback cancels or times out | Separate cancelled/unknown; confirmed-only rate explained |
| A12 | Same event ID retries identical/different payload | Idempotent identical receipt; conflicting payload quarantined, not double-counted |
| A13 | Device rule selection is edited in global config | UI explains global publication vs rule applicability; no fake per-device revision API |
| A14 | Two operators save the same base revision | Second stale write rejected; draft retained for comparison |
| A15 | SQL save succeeds but public projection fails | Saved/pending projection, not applied or universally live |
| A16 | Projection readback succeeds, device stays offline | Available/unconfirmed; offline is not confirmed failure |
| A17 | Receipt references wrong hash/unknown revision | Reject invalid receipt; coverage does not increase |
| A18 | New device reports after cohort snapshot | Display separately; fixed denominator not silently changed |
| A19 | User drags a task into review/live column | State rules require evidence; no automatic main merge/deployment |
| A20 | Provider dispatch acknowledgement is lost | Unknown/observe state; no automatic unsafe repeat |
| A21 | Website anchor exists but reviewed source differs | Alignment gap visible; do not call content current |
| A22 | Recording inventory has never been audited | Not-audited, not 100% recorded |
| A23 | Invoice import repeats or corrects a source line | Duplicate recognised; correction creates new immutable version |
| A24 | Mixed currencies lack required FX | Comparable totals unavailable with reason, not zero or naive sum |
| A25 | Cash date and service period fall in different months | Cash/invoice views differ with clear basis; no accidental double count |
| A26 | Commitment has linked actual settlement/credit | Remaining reservation respects actual linkage and service constraints |
| A27 | No true dueAt exists | No fabricated overdue badge from service period end |
| A28 | Ledger/source coverage is incomplete | Forecast/profit/unit-cost limits clearly disclosed or metric unavailable |
| A29 | Graph point opens detail then Back | Same supported scope and original scroll retained |
| A30 | Phone, tablet, keyboard or long VI label | Readable graph/table, reachable action, stable shell and explicit scope |
| A31 | User requests deletion or restore | Separate authoritative workflow; do not erase saves or financial history based on a concept action |
| A32 | Export hits bounds or permissions omit records | Explicit failure/coverage limitation; never silently labelled complete |

## Validation layers

Document validation checks IDs, cross-references, pinned sources, local links, manifests and consistency. Prototype browser review checks layouts and interactions with fictional data only. Runtime work needs source-specific formula/contract tests, real SQL transaction checks, server permission tests, existing repository changed-check/full-suite policy and visual/device review. A passing mockup never establishes secure production access, provider health or a complete game release.

Before production use of newly detailed real-family records: approve and implement category retention/deletion, verify grants and preview/live database bindings, rehearse recovery, and record any physical-device/Windows gaps. The selected SQL service is existing Netlify Database; credentials stay in secure server bindings.
