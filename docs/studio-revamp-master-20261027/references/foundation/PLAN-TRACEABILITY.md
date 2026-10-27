# Recorded plan → implementation and remaining work

27 October 2026 AEDT. The original plan and registries remain the historical design at `ac76cf60`. The current code incorporates the already released v1.02 from `b241286a`. Integrating that release is not approval to publish this new Studio/finance work.

The owner asked whether the work follows the earlier suggestions: **yes**. The table maps the original B01–B12 tickets to actual implementation, without treating a partial ticket as complete. New finance authorisation supersedes the earlier finance deferral. The primary agent continues alone.

| Original ticket | Implemented connection / evidence | Still required |
|---|---|---|
| B01 Baseline and definitions | Historical source hashes, 137 data-point definitions, 38 metrics, 23 connections, seven visual maps; current implementation map and decision record | Resolve remaining production/privacy/accounting choices before activation |
| B02 Read adapters | Existing device/child/play/website/tester stores → permission-aware reads with ordinary/bot distinction, date/build scope, pagination and unavailable states | Large-data rollups and durable source watermarks |
| B03 Management dashboard | Summary/device/child/activity/release/operations/finance views; EN/VI responsive browser evidence | Complete shared-home redesign, physical-device verification and desktop scope where still applicable |
| B04 Attention | Original tester evidence → revisioned owner/next-action lifecycle and immutable audit; deployed/verified evidence distinct | Issue-provider synchronisation and automated regression verification |
| B05 Activity coverage | Stable game/story IDs → source catalogue/detail and real guide anchors; regenerated against v1.02 (207 games / 92 stories) | 26 declared second-set metadata gaps; recording coverage audit and guide source alignment |
| B06 Availability/scope | Existing live precedence preserved; global revisioned controls and explicit saved/available/applied distinction | Shared effective-availability resolver, per-device/feature targeting and specialised editor conversion |
| B07 Permissions/audit | Explicit management/operations/finance grants, intentional editor allowlist, desktop finance denial, revisions and immutable audit/history | Review real administrator grants and live access before activation |
| B08 Exact events | Bounded consented queue → validation/dedup/quarantine → SQL → attempt/outcome aggregates; boot/story/guest join/voice/update/backup hooks | Retention/deletion, scalable rollups/cohorts, earlier boot blind spots, hosting/reconnect coverage and physical-device observation |
| B09 Configuration | Expected revisions → immutable versions → conditional public projection → device receipts; old writers blocked after cutover | Specialised revisioned editors, scheduled retry worker and targeted projection |
| B10 Finance | Manual ledger/CSV preview/atomic import, original currencies/tax/FX, source identity, corrections/voids/reconciliation/history, budget/coverage, conditional forecast and reporting unit costs | Actual provider invoices/scopes; production activation, financial retention/recovery, revenue attribution/contribution margin and optional provider billing adapters |
| B11 Operations/recovery | Read-only provider feeds, exact job/run identity, stale/unknown states, bounded durable bot dispatch, DB reads and config retry | Scheduled run reconciliation, full history, actual provider scopes, retention jobs and database restore drills |
| B12 Integration/validation | Local SQL/unit/type/browser/layout/speed evidence and review artifacts; full GitHub suite is the next release gate | Record the final GitHub result, fix failures, rerun affected checks, then explicit production release approval |

See [Finance handbook](FINANCE.md), [Netlify/operator connections](NETLIFY-AND-OPERATIONS.md), [current implementation](IMPLEMENTATION.md) and [validation](IMPLEMENTATION-VALIDATION.md). This is a management foundation with working code, not a claim that every future metric and operational automation in the original programme is finished.
