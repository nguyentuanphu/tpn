# Acceptance and evidence plan

This chapter defines future product acceptance. [VALIDATION-REPORT.md](VALIDATION-REPORT.md) records what was actually checked for this documentation package. Do not copy expected outcomes below into a “passed” report without executing them on the named source.

## Required scenario matrix

| ID | Setup / action | Required observable result | Tickets |
|---|---|---|---|
| V01 | Load legacy fixture with one ordinary installation and one bot installation | Audience excludes bot store; synthetic view exposes it explicitly | B02 |
| V02 | Sender v1.02 delivers old v1.01 daily bucket | Play remains attributed to v1.01 and the day played; latest sender build kept separately | B02 |
| V03 | FPS counters [60,2,0] and [10,1,1] | Weighted result 70/3 FPS; low-sample fraction 1/3; not average of device averages | B02/B03 |
| V04 | No battery API versus measured zero battery loss | First is unavailable with no measured minutes; second can be observed zero | B02/B03 |
| V05 | 125 installations, page size 25, tied timestamps | Stable pagination reaches all 125 without duplicates; Home total not 25 or capped at 100 | B02/B03 |
| V06 | A problem is fixed in candidate code but no deployment evidence exists | Status fixed_in_code; never deployed or verified | B04 |
| V07 | Catalogue title changes EN/VI; stable activity ID unchanged; guide SHA old | Joins stay intact and guide shows stale review, not disappeared usage | B05 |
| V08 | Feature off after trial use, targeted tester, held new set, offline device | Explanation matches actual resolver including retention exceptions; offline device actual state unconfirmed | B06 |
| V09 | Call every writable route as viewer/editor/custom/owner/desktop key | Server denies every ungranted capability, even when UI is bypassed | B07 |
| V10 | Two operators submit same expected revision | First succeeds, second gets 409 and keeps draft; audit identifies both outcomes without secrets | B04/B07/B09 |
| V11 | Open views in both Studios, EN/VI, 390/820/1280, narrow phone and landscape | Controls readable/reachable; stable shell, focus, draft, scroll and navigation retained | B03–B12 |
| V12 | Send identical event batch twice; drop first response | One stored event per ID; repeated IDs acknowledged; client clears queue only after receipt | B08 |
| V13 | Send same ID with changed payload; concurrent identical sends | Mismatch 409/quarantined; concurrent identical sends count once transactionally | B08 |
| V14 | Completion arrives before start, then start arrives; terminal outcomes conflict | Orphan held then matched; conflict marked inconsistent, not silently counted twice | B08 |
| V15 | Start 23:59, finish 00:01, split-screen two players | One matched operation attempt in start cohort, not two unique starts; legacy participations labelled separately | B08 |
| V16 | Offline queue, full local storage, Analytics off, stale clock, schema unknown | Play/save unaffected; bounded loss surfaced; opt-out stops new queue/send; bad schema/clock handled explicitly | B08 |
| V17 | Config DB write commits; projection fails | Change remains pending availability; no successful-delivery badge; retry projects latest compatible revision | B09 |
| V18 | Cohort 10 devices; 6 apply, 1 rejects, 3 silent; 2 new installations appear later | Coverage 6/10 applied, 1 rejected, 3 unconfirmed; new installations separate from denominator | B09 |
| V19 | Old client ignores revision; rollback to compatible older body | Old client continues safely; unconfirmed not falsely applied; rollback gets a new increasing revision | B09 |
| V20 | Import same invoice twice, then modified copy, multi-currency without rate | Duplicate safe; changed line requires correction; missing FX unavailable; no silent money overwrite | B10 |
| V21 | Actual 120, commitment 30, budget 200; zero reported active hours | Actual remaining 80; commitment-adjusted remaining 50; cost/hour unavailable | B10 |
| V22 | Provider dispatch returns accepted, run later fails; billing API forbidden | Dispatch and failed outcome separate; forbidden data unavailable, not zero cost or successful job | B11 |
| V23 | Restore a staging backup and compare selected records/checksums | Recovery evidence names backup version, elapsed time, recovered watermark and differences; failed drill remains failed | B11 |
| V24 | Candidate game and generated website use different source locks or versions | Release blocked; no mixed-source marketing promise or false aligned-version badge | B12 |
| V25 | Required check fails/skips or production device unavailable | Report keeps exact limitation; cannot claim complete acceptance; owner gate remains | B12 |

## Numerical examples every metric adapter must satisfy

**Existing participation versus new attempts.** Two profiles start and finish one local two-player game. Existing profile counters have starts=2, completions=2; new attempt ledger has starts=1, completed=1. They are both valid in their own units. Displaying “two games completed” by adding both is wrong.

**Observed D7 return.** On day 0 there are 10 first-observed eligible installations; 4 are active exactly on day 7. D7 is 4/10. Activity only on day 6 or day 8 does not meet this exact-day definition. Cohorts younger than 7 days are immature; 7 days of late-arrival grace makes the finalisation date explicit. Data reset can create another installation; do not relabel this child retention.

**Nearest-rank percentile.** For sorted durations [10,20,30,40,50], p95 is element ceil(0.95×5)=5, or 50. With n=5, show insufficient for a directional performance alert even if the raw percentile is visible with its sample count. Do not combine differently measured cold and service-worker-controlled starts.

**Traffic isolation.** Ten ordinary installations report 100 minutes; two bots report 900 minutes. Ordinary play is 100, not 1,000. A synthetic release test can be quality evidence without becoming audience growth.

**Currency.** USD 10.00 remains 1,000 USD cents. If an approved dated rate is AUD 1.50 per USD, converted expense is AUD 15.00 after the declared rounding rule. Without a rate, show USD 10.00 and exclude the unavailable conversion from an “all costs reconciled” claim.

**Late data.** A report received on 26 October for play on 23 October updates the 23 October source bucket and marks affected summaries revised. A received-today dashboard must not call it today's play. Historical buckets without valid timezone provenance remain labelled legacy-device-day.

## Negative tests and data protection

- Reject unknown keys, invalid IDs, overlong fields, non-finite numbers, oversized bodies, unknown catalogue references and unsupported schema versions.
- No family code, token, photo, raw speech or complete save enters the proposed events/summary endpoint; existing restricted personal fields are removed from management overview responses.
- Test direct unauthorised GET and POST, cross-scope requests, stale/revoked cookies, scoped desktop keys and unexpected origins.
- Verify public website/build exports contain no device IDs, test cohorts, admin identity, private photo references or financial information.
- Prove exact frame origin and source validation remain in the floating website; only bounded close/play navigation is accepted.
- Confirm names/identity changes never grant another family's access or change a progress owner's identity.
- Exercise import cancellation, projection timeout, database rollback, retention-job failure, old client protocol and restore recovery.

## Evidence record template

```text
Ticket / requirement IDs:
Source SHA and actual build:
Environment and provider scope (synthetic / staging / production):
Fixture or operation:
Command / runner / invocation:
Start/end and timezone:
Expected outcome:
Observed outcome:
Pass / fail / skipped / unavailable / not run:
Counts and any retries:
Screenshot/artifact path:
Database/queue state before and after:
Remaining limits / next action / owner:
```

## Repository verification workflow

Use `tests/suite.mjs` for game checks. Before running changed selection, inspect `--changed --list`. If it selects full suite, follow current `CLAUDE.md`: full suite on GitHub, local performance checks serially, no concurrent test runs beside the suite. Preserve runner timing/map updates intentionally; do not accidentally include them in an unrelated change.

Relevant existing checks include `unit`, `types`, `studio`, `studiolive`, `nostudio`, `phone`, `contract`, `ownerstudioperms`, `ownerstudiofailures`, `tester`, `testerreport`, `ownerfamily`, `offline`, `startup`, `perf`, `battery`, `multiplayer` and `cloud`; verify current names against the runner before choosing. Add behavior-level tests for new protocols/metrics instead of making existing assertions weaker.

Prior onboarding evidence (8 selected checks passed on v1.01) establishes that environment workflow, not correctness of this proposed management implementation. Document/HTML checks for this package are separate from future game, database, provider and Windows validation.
