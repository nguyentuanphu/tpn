# Graph catalogue: what each graph means and connects to

All graph interfaces are proposed. Some source observations exist in code; this does not mean a deployed graph, complete history or live provider access. Default traffic is ordinary, and comparison periods use compatible date/currency/source bases.

Every graph must show its period, timezone/date basis, filters, source freshness, numerator/denominator or count unit, sample size, missing-data warning and a keyboard-accessible data table. Colour is never the only encoding. Switching a graph opens scoped detail; it never changes a game setting.

| Graph | Location | Visual | Source connections |
|---|---|---|---|
| G01 Reporting audience over time | Today / People | line | L01 |
| G02 Reported profiles and device mix | People | bars | L01 |
| G03 New and returning reporting installations | People | stacked bars | L01, L02 |
| G04 Reported play pattern | People / selected device | hour-by-day heatmap | L01 |
| G05 Website engagement | Game & website / Website | line + bars | L03 |
| G06 Website-to-play connection | Game & website / Website | separate stages; future matched funnel | L03, L02, L13 |
| G07 Activity popularity | Game & website | ranked bars | L01, L04 |
| G08 Activity outcomes | Game & website / selected activity | stacked outcomes | L01, L02, L04 |
| G09 Built-in story journeys | Game & website / selected story | opened and completed bars | L02, L04 |
| G10 Startup experience | Work / experience | median and p95 lines | L01, L02 |
| G11 Smoothness and reported errors | Work / experience | lines + affected-device bars | L01 |
| G12 Measured battery behaviour | Work / experience | qualified bars | L01 |
| G13 Reported connection outcomes | Work / experience | stacked bars | L02 |
| G14 Voice playback evidence | Game & website / Voice | stacked source/language bars | L02, L04 |
| G15 Content and website review coverage | Game & website | coverage matrix | L04 |
| G16 Release adoption | Work / releases | stacked version bars | L01, L04 |
| G17 Configuration delivery | Work / change | stacked states + delay distribution | L05, L06 |
| G18 Problems and recovery | Work | trend + ageing bars | L07, L08 |
| G19 Jobs and service readiness | Work / services | run timeline + status table | L09 |
| G20 Recorded cost trend | Money | stacked monthly columns | L10 |
| G21 Budget and commitments | Money | budget bar + commitments | L10 |
| G22 Recorded cash and upcoming obligations | Money | cash trend + due-date list | L10 |
| G23 Qualified operating forecast | Money | actual line + forecast band | L10 |
| G24 Cost per reporting activity | Money | unit-cost lines | L10, L01 |
| G25 Revenue and contribution | Money | qualified waterfall | L10 |
| G26 Update and backup observations | Work / experience; People / device | stacked result bars | L02 |

## G01 · Reporting audience over time

- **Location / visual:** Today / People · line.
- **Definition:** Distinct reporting active installations per day; new means first retained observation. Never sum daily distincts into monthly distincts.
- **Sources:** L01; field families DAY-01, DAY-03, DAY-04, DAY-05, ID-01.
- **Metric references:** M01, M02.
- **Click / keyboard drilldown:** Return to days and permitted device records.
- **Limits and implementation needs:** Cleared storage, opt-out and missing days bias audience; no global unique-child count.

**Enumerated runtime/proposed refinements:** Historical field families above are sufficient to identify the existing input; adapter/query validation still required.

## G02 · Reported profiles and device mix

- **Location / visual:** People · bars.
- **Definition:** Count reporting installation/profile pairs and distinct installations separately; group device/OS/browser and age band. Approximate online presence uses the current 5-minute freshness window, not permanent live status.
- **Sources:** L01; field families ID-07, ID-08, ID-10, ID-11, KID-01, KID-02.
- **Metric references:** M01, M03.
- **Click / keyboard drilldown:** Open selected device group then an authorised device.
- **Limits and implementation needs:** Profiles are not globally deduplicated children. Name reporting can be off.

**Enumerated runtime/proposed refinements:** EV-03, EV-15, EV-16, EV-17, UX-01, UX-02, UX-03, UX-04, UX-05, UX-09

## G03 · New and returning reporting installations

- **Location / visual:** People · stacked bars.
- **Definition:** New: first retained active day in window. Returning: active earlier in retained history. Exact-day D7 uses only matured cohorts and is a separate proposed metric.
- **Sources:** L01, L02; field families ID-01, DAY-01, EVENT-02, EVENT-03.
- **Metric references:** M02, M18.
- **Click / keyboard drilldown:** Open cohort definition and permissible records.
- **Limits and implementation needs:** Retention job, rollups and mature cohort reporting remain work; not all historical first-ever dates are known.

**Enumerated runtime/proposed refinements:** EV-03, EV-07, EV-09

## G04 · Reported play pattern

- **Location / visual:** People / selected device · hour-by-day heatmap.
- **Definition:** Sum reported minutes per device-local hour/day; label timezone basis. Profile participation minutes may overlap in shared play.
- **Sources:** L01; field families DAY-01, DAY-03, DAY-07, KID-03, KID-04.
- **Metric references:** M04.
- **Click / keyboard drilldown:** Open selected day and activity summary.
- **Limits and implementation needs:** Reported active play is not total screen time; no precise minute-by-minute timeline from daily buckets.

**Enumerated runtime/proposed refinements:** Historical field families above are sufficient to identify the existing input; adapter/query validation still required.

## G05 · Website engagement

- **Location / visual:** Game & website / Website · line + bars.
- **Definition:** Page views, Play clicks and reported active seconds shown as separate event series. Clicks/views is an event ratio, not person conversion.
- **Sources:** L03; field families WEB-01, WEB-02, WEB-03, WEB-04, WEB-05, WEB-06, WEB-07, WEB-08.
- **Metric references:** M13, M14, M15.
- **Click / keyboard drilldown:** Open route/language/device aggregate.
- **Limits and implementation needs:** Best-effort dropped requests and opt-out; no unique visitor or session linkage.

**Enumerated runtime/proposed refinements:** Historical field families above are sufficient to identify the existing input; adapter/query validation still required.

## G06 · Website-to-play connection

- **Location / visual:** Game & website / Website · separate stages; future matched funnel.
- **Definition:** Current website views/clicks and game boot observations are separate panels. Matched funnel only after L13 exists, with eligible handoff denominator and pending/expired outcomes.
- **Sources:** L03, L02, L13; field families WEB-01, WEB-06, EVENT-06.
- **Metric references:** M13, M14, M20.
- **Click / keyboard drilldown:** Inspect stage definition and current gap.
- **Limits and implementation needs:** No numerical conversion arrow between unmatched populations; no cross-device attribution.

**Enumerated runtime/proposed refinements:** EV-03, EV-05, EV-06, EV-07, OBS-06, OBS-07, HAND-01, HAND-02, HAND-03, HAND-04, HAND-05, HAND-06, HAND-07, HAND-08

## G07 · Activity popularity

- **Location / visual:** Game & website · ranked bars.
- **Definition:** Game starts per kind:id where available; story opens historically aggregate, named story attempts only from detailed events.
- **Sources:** L01, L04; field families DAY-04, DAY-05, KID-05, CONTENT-01, CONTENT-03.
- **Metric references:** M04, M07.
- **Click / keyboard drilldown:** Open one game/story editor with evidence.
- **Limits and implementation needs:** A popular activity is not proof of learning benefit or quality.

**Enumerated runtime/proposed refinements:** CAT-01, CAT-02, CAT-03, CAT-04, OBS-01, OBS-08

## G08 · Activity outcomes

- **Location / visual:** Game & website / selected activity · stacked outcomes.
- **Definition:** Detailed attempts: completed/abandoned/pending/unknown/inconsistent within same start cohort. Legacy participation ratios kept separately.
- **Sources:** L01, L02, L04; field families KID-06, KID-07, KID-08, EVENT-05.
- **Metric references:** M05, M06, M19.
- **Click / keyboard drilldown:** Open outcome definition and anonymous attempt evidence; names need detail permission.
- **Limits and implementation needs:** Do not mix attempt and profile-participation denominators; no causal difficulty claim.

**Enumerated runtime/proposed refinements:** EV-03, EV-05, EV-06, EV-07, OBS-01, OBS-02, OBS-03, OBS-04, OBS-05

## G09 · Built-in story journeys

- **Location / visual:** Game & website / selected story · opened and completed bars.
- **Definition:** Match built-in opened/completed events by device+attemptId+storyId; pending/unknown separate. Completion follows actual instrumented final-page condition.
- **Sources:** L02, L04; field families EVENT-07, CONTENT-03.
- **Metric references:** M07.
- **Click / keyboard drilldown:** Open story and recording/review details.
- **Limits and implementation needs:** Earlier aggregate opens cannot be backfilled into per-story completion.

**Enumerated runtime/proposed refinements:** EV-03, EV-05, EV-07, OBS-08, OBS-09

## G10 · Startup experience

- **Location / visual:** Work / experience · median and p95 lines.
- **Definition:** Split legacy capped startup samples from reportable boot attempts. For proposed p95 use matched ready-start nearest-rank distribution, show n; no directional status below 20.
- **Sources:** L01, L02; field families PERF-04, PERF-05, PERF-06, PERF-07, PERF-08, EVENT-06.
- **Metric references:** M10, M20, M21.
- **Click / keyboard drilldown:** Open build/device cohort and startup-stage evidence.
- **Limits and implementation needs:** Failures before instrumentation invisible; first picture and first playable are different measures. p95 chart requires validated rollup implementation.

**Enumerated runtime/proposed refinements:** EV-03, EV-05, EV-06, EV-07, OBS-06, OBS-07

## G11 · Smoothness and reported errors

- **Location / visual:** Work / experience · lines + affected-device bars.
- **Definition:** Weighted FPS=sum samples/count; low-FPS count/count; error-affected distinct active devices/active devices.
- **Sources:** L01; field families PERF-01, PERF-02, PERF-03, DAY-09, DAY-10.
- **Metric references:** M08, M09, M38.
- **Click / keyboard drilldown:** Open selected build/device and problem evidence.
- **Limits and implementation needs:** Low FPS <20 at current legacy threshold; stuck detection is not a confirmed defect.

**Enumerated runtime/proposed refinements:** Historical field families above are sufficient to identify the existing input; adapter/query validation still required.

## G12 · Measured battery behaviour

- **Location / visual:** Work / experience · qualified bars.
- **Definition:** Battery percentage-point loss / measured battery hours; active drawing FPS excludes idle and unmeasured intervals.
- **Sources:** L01; field families BAT-01, BAT-02, BAT-07, BAT-08, BAT-09, BAT-10.
- **Metric references:** M11, M12.
- **Click / keyboard drilldown:** Inspect supported samples and measurement definitions.
- **Limits and implementation needs:** Many browsers cannot measure battery; not watts, monetary energy cost or all-device battery performance.

**Enumerated runtime/proposed refinements:** Historical field families above are sufficient to identify the existing input; adapter/query validation still required.

## G13 · Reported connection outcomes

- **Location / visual:** Work / experience · stacked bars.
- **Definition:** Success / eligible matched connection-attempt starts; pending/unknown remain in denominator; direct/relay split.
- **Sources:** L02; field families EVENT-08.
- **Metric references:** M22.
- **Click / keyboard drilldown:** Inspect outcome codes without room codes or media.
- **Limits and implementation needs:** Current hooks cover guest join; host/reconnect coverage incomplete.

**Enumerated runtime/proposed refinements:** EV-03, EV-05, EV-07, OBS-10, OBS-11, OBS-12

## G14 · Voice playback evidence

- **Location / visual:** Game & website / Voice · stacked source/language bars.
- **Definition:** Current recorded success rate: confirmed successes / confirmed success-or-failure observations; cancelled/unknown shown separately, not hidden in denominator.
- **Sources:** L02, L04; field families EVENT-09, CONTENT-08.
- **Metric references:** M23.
- **Click / keyboard drilldown:** Open affected asset context where safely known.
- **Limits and implementation needs:** Browser playback completion is not proof of audibility; no speech content collection. Current wire event is voice.result, not legacy proposal voice.playback/result.

**Enumerated runtime/proposed refinements:** OBS-13, OBS-14, OBS-15

## G15 · Content and website review coverage

- **Location / visual:** Game & website · coverage matrix.
- **Definition:** Rows=kind:id; columns EN/VI metadata, implementation, reviewed guide source and recording audit. Counts use explicit required-item inventory.
- **Sources:** L04; field families CONTENT-01, CONTENT-03, CONTENT-07, CONTENT-08.
- **Metric references:** M26, M27.
- **Click / keyboard drilldown:** Open missing item and reviewer action.
- **Limits and implementation needs:** Catalogue recordings currently not-audited. Anchor exists does not mean source alignment; missing review is not complete coverage.

**Enumerated runtime/proposed refinements:** CAT-01, CAT-02, CAT-03, CAT-04, CAT-06, CAT-08, CAT-09, CAT-10, CAT-11, CAT-12, CAT-13

## G16 · Release adoption

- **Location / visual:** Work / releases · stacked version bars.
- **Definition:** Observed sender-build distribution across distinct reporting devices; daily-originating build separately labelled.
- **Sources:** L01, L04; field families ID-04, DAY-02, CONTENT-06.
- **Metric references:** M01.
- **Click / keyboard drilldown:** Open version cohort and review evidence.
- **Limits and implementation needs:** Sender build is not all gameplay within a retained bucket; no claim about non-reporting installs.

**Enumerated runtime/proposed refinements:** EV-11, CAT-06

## G17 · Configuration delivery

- **Location / visual:** Work / change · stacked states + delay distribution.
- **Definition:** Exact revision/hash applied receipts / fixed eligible reporting cohort saved with change; rejected/unsupported/unconfirmed separate; later/new devices shown outside cohort.
- **Sources:** L05, L06; field families DELIVERY-01, DELIVERY-02, DELIVERY-03, DELIVERY-04, DELIVERY-05.
- **Metric references:** M24, M36.
- **Click / keyboard drilldown:** Open revision → eligible devices → available permitted receipt.
- **Limits and implementation needs:** Actual current service counts exact revision/hash; do not use historical metric wording that credits arbitrary later revisions. Device clock skew can invalidate delay.

**Enumerated runtime/proposed refinements:** RCPT-01, RCPT-02, RCPT-03, RCPT-04, RCPT-05, RCPT-06, RCPT-07, RCPT-08, RCPT-09, CFG-01, CFG-06, CFG-07, CFG-09, CFG-12, CFG-13, CFG-14

## G18 · Problems and recovery

- **Location / visual:** Work · trend + ageing bars.
- **Definition:** New/open/verified work by date, unique reporting devices by issue/build; proposed verified recovery duration=verifiedAt-firstReportAt for qualified cases.
- **Sources:** L07, L08; field families ISSUE-02, ISSUE-11, OPS-05.
- **Metric references:** M16, M17, M25.
- **Click / keyboard drilldown:** Open original report plus separate follow-up and verification.
- **Limits and implementation needs:** Observed report rate is not total defect incidence; confirmed regression and recovery charts need validated classification/time fields.

**Enumerated runtime/proposed refinements:** TASK-01, TASK-02, TASK-03, TASK-04, TASK-05, TASK-06, TASK-07, TASK-08, TASK-09, TASK-10, TASK-11, TASK-12, TASK-13, TASK-14, UX-06

## G19 · Jobs and service readiness

- **Location / visual:** Work / services · run timeline + status table.
- **Definition:** Terminal successful eligible provider runs / terminal eligible observed runs; queued/running/unknown separate. Quota forecast only matching real provider window/usage.
- **Sources:** L09; field families OPS-06, OPS-07.
- **Metric references:** M34, M35, M37.
- **Click / keyboard drilldown:** Open provider observation, run or durable operation.
- **Limits and implementation needs:** Provider credentials/feeds may be absent/stale. Do not invent quotas or convert dispatch accepted into success.

**Enumerated runtime/proposed refinements:** Historical field families above are sufficient to identify the existing input; adapter/query validation still required.

## G20 · Recorded cost trend

- **Location / visual:** Money · stacked monthly columns.
- **Definition:** Eligible nonvoid expense/credit original minor units allocated by service days, converted explicitly; cash view uses paidAt UTC date separately.
- **Sources:** L10; field families MONEY-01, MONEY-02, MONEY-03, MONEY-04, MONEY-06.
- **Metric references:** M28.
- **Click / keyboard drilldown:** Open category → invoice line → immutable history.
- **Limits and implementation needs:** Current manual-ledger coverage must be visible; missing FX means unavailable comparable totals, not zero.

**Enumerated runtime/proposed refinements:** FIN-01, FIN-02, FIN-03, FIN-04, FIN-05, FIN-06, FIN-07, FIN-08, FIN-09, FIN-10, FIN-11, FIN-12, FIN-13, FIN-14, FIN-15, FIN-16, FIN-17, FIN-18, FIN-19, FIN-20, FIN-21, FIN-22, FIN-23, FCTL-01, FCTL-06, FCTL-08, FCTL-09

## G21 · Budget and commitments

- **Location / visual:** Money · budget bar + commitments.
- **Definition:** Budget minus recognised actual expense minus remaining separately reserved commitments; link settlements to avoid double counting.
- **Sources:** L10; field families MONEY-03, MONEY-04, MONEY-05.
- **Metric references:** M29.
- **Click / keyboard drilldown:** Open budget, commitment and linked actuals.
- **Limits and implementation needs:** Estimates are distinct; credits and commitment settlement must pass service constraints.

**Enumerated runtime/proposed refinements:** FIN-06, FIN-07, FIN-08, FIN-16, FIN-18, FIN-19, FCTL-06, FCTL-07

## G22 · Recorded cash and upcoming obligations

- **Location / visual:** Money · cash trend + due-date list.
- **Definition:** Cash trend from paidAt records only. A true due-date schedule is proposed and requires explicit dueAt/settlement data; existing commitments alone do not prove due dates.
- **Sources:** L10; field families MONEY-03, MONEY-04.
- **Metric references:** M28.
- **Click / keyboard drilldown:** Open payment-status evidence or obligation.
- **Limits and implementation needs:** No bank balance, live payment verification or bank-payment action. A missing dueAt cannot become overdue.

**Enumerated runtime/proposed refinements:** FIN-06, FIN-07, FIN-08, FIN-13, FIN-19, UX-12

## G23 · Qualified operating forecast

- **Location / visual:** Money · actual line + forecast band.
- **Definition:** Use fixed commitments plus variable actual-to-date plus remaining days times trailing 7 complete-day variable mean, only when required coverage is asserted.
- **Sources:** L10; field families MONEY-02, MONEY-03, MONEY-04, MONEY-05.
- **Metric references:** M30.
- **Click / keyboard drilldown:** Open basis, covered dates and assumptions.
- **Limits and implementation needs:** Forecast is an estimate, not cash runway. Band must have an explicit method before numeric uncertainty limits are shown.

**Enumerated runtime/proposed refinements:** FIN-06, FIN-07, FIN-10, FIN-11, FIN-16, FCTL-06, FCTL-08

## G24 · Cost per reporting activity

- **Location / visual:** Money · unit-cost lines.
- **Definition:** Comparable operating cost / reporting active installations; cost / (reported minutes/60). Show period, currency, coverage and actual denominator.
- **Sources:** L10, L01; field families MONEY-03, MONEY-06, MONEY-08, DAY-03, ID-01.
- **Metric references:** M31, M32.
- **Click / keyboard drilldown:** Open invoice numerator and reporting usage denominator subject to permissions.
- **Limits and implementation needs:** Not cost per unique child/customer; more complete analytics can change the ratio without a true cost change.

**Enumerated runtime/proposed refinements:** FIN-07, FIN-08, FIN-20, FIN-21, FIN-22, FIN-23, FCTL-06, FCTL-08

## G25 · Revenue and contribution

- **Location / visual:** Money · qualified waterfall.
- **Definition:** Recognised eligible revenue - refunds - payment fees - explicitly attributed variable costs, using documented allocation; require approved revenue definition.
- **Sources:** L10; field families MONEY-07, MONEY-08.
- **Metric references:** M33.
- **Click / keyboard drilldown:** Open each contributing record and allocation.
- **Limits and implementation needs:** Deferred until revenue/attribution policy and sufficient records exist; no assumed monetisation of children.

**Enumerated runtime/proposed refinements:** FIN-06, FIN-07, FIN-08, FIN-14, FIN-16, FIN-20, FIN-21

## G26 · Update and backup observations

- **Location / visual:** Work / experience; People / device · stacked result bars.
- **Definition:** Count update.result and backup.result by operation/outcome; initiated/cancelled/failed/succeeded separate. No reuse of boot-readiness formula for this chart.
- **Sources:** L02; field families EVENT-10, PRIVATE-02.
- **Metric references:** New outcome breakdown; no historical metric reused.
- **Click / keyboard drilldown:** Inspect safe reason codes and relevant device if authorised.
- **Limits and implementation needs:** Browser export completion does not prove durable off-device backup or restore recoverability.

**Enumerated runtime/proposed refinements:** EV-03, EV-05, EV-07, OBS-16, OBS-17, OBS-18, OBS-19, OBS-20

## Placement without visual overload

Today gets one compact audience trend plus a selectable experience/cost summary, behind the primary decision. People gets audience/device mix with optional activity pattern. Each selected game gets popularity/outcomes and its review matrix. Work gets experience, releases and operational graphs. Money gets costs, budget and qualified forecasts. Put two principal graphs in a screen’s first section; further graphs belong in named sections or selectable views, not a wall of 26 charts.

Comparison does not prove causation. Release annotations describe timing; they do not establish a release caused a change in usage or performance. Small private groups need an approved suppression policy before aggregate sharing; no arbitrary threshold is claimed already enforced.
