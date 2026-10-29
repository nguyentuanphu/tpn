# Metric definitions

These definitions control labels, formulas and eligibility. Existing-derived means an adapter/report can derive a limited measure from existing data; it does not mean every proposed card exists. Proposed metrics require the named build ticket.

For every metric show period, timezone/bucket basis, source build, data freshness, sample size, ordinary/test traffic scope, formula version and limitations. Missing denominator means unavailable. Do not clamp a misleading ratio into 0–100%; surface the inconsistent data.

## M01: Reporting active installations

- Status: **existing-derived**; data group: `DAY`; ticket: `B02`.
- Formula: Count distinct id with m>0 or game starts>0 or stories opened>0 within period.
- Unit: installations.
- Interpretation limit: Do not label unique children or total audience.

## M02: New observed installations

- Status: **existing-derived**; data group: `ID`; ticket: `B02`.
- Formula: Count distinct id whose earliest retained observed play date is in period.
- Unit: installations.
- Interpretation limit: Cleared storage and late first reports change this.

## M03: Currently reporting online

- Status: **existing-derived**; data group: `ID`; ticket: `B03`.
- Formula: Count devices with active session presence newer than LIVE_MS (5 minutes).
- Unit: installations.
- Interpretation limit: Presence is approximate; stale means unconfirmed/offline.

## M04: Play time

- Status: **existing-derived**; data group: `DAY`; ticket: `B02`.
- Formula: Sum accepted days[].m for eligible ordinary traffic; exclude bot store.
- Unit: minutes.
- Interpretation limit: Menu/paused time follows existing producer hooks; not total screen time.

## M05: Completion participation ratio

- Status: **existing-derived**; data group: `KID`; ticket: `B05`.
- Formula: Sum g[id][1] / sum g[id][0] over matching profile/device/day buckets.
- Unit: ratio.
- Interpretation limit: Not attempt conversion: split-screen creates two participations and late terminal events can cross windows.

## M06: Early-exit participation ratio

- Status: **existing-derived**; data group: `KID`; ticket: `B05`.
- Formula: Sum g[id][2] / sum g[id][0] over matching buckets.
- Unit: ratio.
- Interpretation limit: Do not infer difficulty or dissatisfaction as a confirmed cause.

## M07: Story opens

- Status: **existing-derived**; data group: `DAY`; ticket: `B05`.
- Formula: Sum days[].t.
- Unit: opens.
- Interpretation limit: No existing completion count should be invented.

## M08: Sampled FPS

- Status: **existing-derived**; data group: `PERF`; ticket: `B03`.
- Formula: sum f[0] / sum f[1] when f[1]>0.
- Unit: FPS.
- Interpretation limit: Weighted by samples; do not average device averages.

## M09: Low-FPS samples

- Status: **existing-derived**; data group: `PERF`; ticket: `B03`.
- Formula: sum f[2] / sum f[1] when f[1]>0.
- Unit: ratio.
- Interpretation limit: Current threshold below 20 FPS.

## M10: Startup median

- Status: **existing-derived**; data group: `PERF`; ticket: `B03`.
- Formula: Median retained st[][2], split by st[][3] and originating build.
- Unit: milliseconds.
- Interpretation limit: Capped samples, not population p95.

## M11: Measured active drawing FPS

- Status: **existing-derived**; data group: `BAT`; ticket: `B03`.
- Formula: sum b[1] / sum b[9] when seconds>0.
- Unit: FPS.
- Interpretation limit: Exclude idle and unmeasured intervals.

## M12: Battery loss per measured hour

- Status: **existing-derived**; data group: `BAT`; ticket: `B03`.
- Formula: (sum b[7]/10) / (sum b[6]/60) when battery minutes>0.
- Unit: percentage points/hour.
- Interpretation limit: Unavailable on many browsers; never watts or device energy cost.

## M13: Website page views

- Status: **existing-derived**; data group: `WEB`; ticket: `B03`.
- Formula: Sum pageViews counters for selected allowlisted routes.
- Unit: events.
- Interpretation limit: Not unique visitors, visits or people.

## M14: Website Play clicks

- Status: **existing-derived**; data group: `WEB`; ticket: `B03`.
- Formula: Sum playConversions.
- Unit: clicks.
- Interpretation limit: Existing counter name does not mean a successful game start.

## M15: Website reading time

- Status: **existing-derived**; data group: `WEB`; ticket: `B03`.
- Formula: Sum activeTimeTotalSec.
- Unit: seconds.
- Interpretation limit: Best-effort; no per-visitor retention or complete session funnel.

## M16: Affected reporting devices

- Status: **existing-derived**; data group: `ISSUE`; ticket: `B04`.
- Formula: Distinct report id per problem/build within retained evidence.
- Unit: installations.
- Interpretation limit: Unreported devices are unknown; reporting count differs from total incidence.

## M17: Open confirmed regressions

- Status: **proposed**; data group: `ISSUE`; ticket: `B04`.
- Formula: Count triaged problems with confirmed regression classification and nonterminal status.
- Unit: problems.
- Interpretation limit: Existing auto reports do not prove regression.

## M18: Observed D7 return

- Status: **proposed**; data group: `EVENT`; ticket: `B08`.
- Formula: Eligible cohort installations observed active on cohortDay+7 / installations first active on cohortDay; exact-day definition.
- Unit: ratio.
- Interpretation limit: Only matured cohorts; late data window 7 days; label provisional; no cross-device person identity.

## M19: Attempt completion

- Status: **proposed**; data group: `EVENT`; ticket: `B08`.
- Formula: Distinct completed attemptIds / eligible started attemptIds from same start cohort.
- Unit: ratio.
- Interpretation limit: Include pending outcomes separately; abandoned/expired definitions in contracts.

## M20: Boot readiness

- Status: **proposed**; data group: `EVENT`; ticket: `B08`.
- Formula: Distinct boot IDs with ready / distinct reportable boot starts in start cohort.
- Unit: ratio.
- Interpretation limit: Never captures failures before instrumentation can run/send.

## M21: First playable time p95

- Status: **proposed**; data group: `EVENT`; ticket: `B08`.
- Formula: Nearest-rank p95 of matched readyAt-startedAt within comparable build/device cohort.
- Unit: milliseconds.
- Interpretation limit: Show n; target at least 20 samples before directional status.

## M22: Connection success

- Status: **proposed**; data group: `EVENT`; ticket: `B08`.
- Formula: Successful connection attemptIds / eligible connection attemptIds.
- Unit: ratio.
- Interpretation limit: Separate direct/relay and failures/timeouts; exclude synthetic runs.

## M23: Recorded voice success

- Status: **proposed**; data group: `EVENT`; ticket: `B08`.
- Formula: Successful recorded playback events / attempted recorded playback events.
- Unit: ratio.
- Interpretation limit: Requires source/outcome instrumentation; missing-line inbox is not a denominator.

## M24: Applied configuration coverage

- Status: **proposed**; data group: `DELIVERY`; ticket: `B09`.
- Formula: Eligible cohort devices acknowledging revision or later compatible effective hash / fixed eligible cohort size.
- Unit: ratio.
- Interpretation limit: Denominator from last-30-day reporting cohort snapshot; missing offline devices stay unconfirmed.

## M25: Confirmed report recovery time

- Status: **proposed**; data group: `ISSUE`; ticket: `B04`.
- Formula: Median verifiedAt-firstReportedAt for comparable resolved cases.
- Unit: hours.
- Interpretation limit: Separate fixed-in-code, deployed and verified.

## M26: Content recording coverage

- Status: **proposed**; data group: `CONTENT`; ticket: `B05`.
- Formula: Required static language/voice keys with playable verified recordings / required keys.
- Unit: ratio.
- Interpretation limit: Bounded static catalogue; dynamic lines and family recordings separately scoped.

## M27: Website review coverage

- Status: **proposed**; data group: `CONTENT`; ticket: `B05`.
- Formula: Changed catalogue items with current source-linked review / items requiring review.
- Unit: ratio.
- Interpretation limit: Review lock is evidence of reviewed work, not automatic prose correctness.

## M28: Actual operating cost

- Status: **proposed**; data group: `MONEY`; ticket: `B10`.
- Formula: Sum recognised actual expense lines in period after explicit currency conversion.
- Unit: reporting currency.
- Interpretation limit: Exclude estimates; show import completeness and tax basis.

## M29: Budget remaining

- Status: **proposed**; data group: `MONEY`; ticket: `B10`.
- Formula: Approved period budget - recognised actual costs - separately reserved commitments.
- Unit: reporting currency.
- Interpretation limit: Display actual-only and commitment-adjusted balances separately.

## M30: Monthly forecast

- Status: **proposed**; data group: `MONEY`; ticket: `B10`.
- Formula: Fixed monthly commitments + variable actual-to-date + remainingDays * trailing-7-complete-day variable mean.
- Unit: reporting currency.
- Interpretation limit: Avoid double-counting commitments; insufficient coverage -> unavailable.

## M31: Cost per reporting active installation

- Status: **proposed**; data group: `MONEY`; ticket: `B10`.
- Formula: Comparable recognised actual operating cost / M01.
- Unit: currency/installation.
- Interpretation limit: Reporting subset denominator; not acquisition cost or unique customer cost.

## M32: Cost per reported play hour

- Status: **proposed**; data group: `MONEY`; ticket: `B10`.
- Formula: Comparable actual operating cost / (M04/60).
- Unit: currency/reported hour.
- Interpretation limit: Reporting opt-outs bias denominator.

## M33: Contribution margin

- Status: **proposed**; data group: `MONEY`; ticket: `B10`.
- Formula: Recognised revenue - refunds - payment fees - attributed variable cost.
- Unit: reporting currency.
- Interpretation limit: Only after approved revenue model and accounting definitions.

## M34: Quota headroom

- Status: **proposed**; data group: `OPS`; ticket: `B11`.
- Formula: Provider limit - current billed/observed usage in matching billing window.
- Unit: provider units.
- Interpretation limit: Unknown limit or stale feed means unavailable.

## M35: Job success

- Status: **proposed**; data group: `OPS`; ticket: `B11`.
- Formula: Successful terminal workflow runs / terminal eligible runs.
- Unit: ratio.
- Interpretation limit: Queued/running/cancelled/retried visible separately.

## M36: Delivery delay

- Status: **proposed**; data group: `DELIVERY`; ticket: `B09`.
- Formula: Applied receipt timestamp - availableAt for eligible compatible devices.
- Unit: seconds.
- Interpretation limit: Device clock can be wrong; validate and show receipt-time alternative.

## M37: Days-to-quota estimate

- Status: **proposed**; data group: `OPS`; ticket: `B11`.
- Formula: Remaining quota / trailing-7-day matching usage mean.
- Unit: days.
- Interpretation limit: Only when same units/window and positive measured rate.

## M38: Affected-device error proportion

- Status: **existing-derived**; data group: `DAY`; ticket: `B03`.
- Formula: Distinct active reporting installations with error>0 / distinct active reporting installations.
- Unit: ratio.
- Interpretation limit: Not crash-free sessions; no existing complete session outcomes.
