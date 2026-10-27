# Implementation validation

> **Current status — 27 October 2026 AEDT:** application `35bffe6a` is under
> comprehensive (`all=true`) [GitHub validation](https://github.com/nguyentuanphu/tpn/actions/runs/40459786851).
> Comprehensive result: **249/250 checks passed**; `ownerreportedphonevi` failed on matched historical Home control181. All 17 real SQL cases passed. Investigation is active; this is a failed full-suite result.
> Focused local Finance/Studio checks, 399 unit passes, the existing legacy map
> exclusion, screenshots and prior failures are recorded below. No deployment
> or live Netlify SQL readiness is claimed.

Historical checkpoints below retain the status they had at the time. This current
status and the final comprehensive result take precedence over earlier pending
or superseded-run notes.

27 October 2026 AEDT. Synthetic records only. See [implementation and remaining work](IMPLEMENTATION.md).

## Recorded results

- Actual PostgreSQL 17.11 integration: 10/10 passed. Migration repeatability, rollback, 20 concurrent locked updates, concurrent duplicate ingestion, conflict quarantine without replacement, invalid-batch atomicity, competing configuration revisions, projection readback, receipt idempotence/hash checks and SQL constraints. Command: `node tests/management/postgres-integration.mjs` from the repository root. The runner restricts itself to a loopback database with a `_test` suffix and a fresh random schema.
- Focused repository suite: 4/4 passed, using `PLAYWRIGHT_BROWSERS_PATH=/workspace/.cache/ms-playwright node suite.mjs --jobs 1 --only managementstudio,types,unit,preload` from `tests`. This run recorded 262 unit passes, type checking and management navigation/filter browser coverage. Further integration improvements made after this run require the final rerun recorded below.
- Existing game boot and UI contract checks passed in the earlier focused run. That run also exposed and led to correction of catalogue-path resolution in the test working directory. The initial run exposed a timer typing error and the public live sanitisation regression; both were corrected. Failures are retained here rather than presented as first-pass successes.
- Six actual screenshots cover EN/VI at 390×844, 820×1180 and 1440×1000. The primary agent inspected phone, tablet and computer captures. Subsequent captures replace the synthetic label fixture with the exact legacy string storage shape and display the last report date correctly.

- A broader eight-check run passed phone (10 screens, 196 seconds), management browser saves/readback across six layouts, 266 unit tests and battery. It exposed an obsolete hard-coded 13-permission expectation after the explicit permission set grew to 19, plus a duplicate label property and an optional fixture typing error. Those were corrected; the permission check now compares the entire declared permission-ID set and still requires the original selected grants and 44 px controls. Performance/startup were initially blocked by npm's unavailable default cache; esbuild 0.25.10 was installed in the temporary tool directory using the writable cache. These are recorded failures followed by fixes, not first-pass successes.
- CI workflows now install the locked root server dependencies before server tests. A separate PostgreSQL 17 workflow exercises the real SQL tests in an ephemeral synthetic database. It is prepared in source, not claimed as having run on GitHub.

## Final rerun

- [Broader rerun](evidence/runtime-suite-2026-10-27.txt): **6/6 passed** — Studio regression, management browser flows, 266 unit tests, types, performance and startup, sequentially. [Machine-readable result](evidence/runtime-suite-2026-10-27.json).
- [Final targeted rerun](evidence/final-ui-suite-2026-10-27.txt): **3/3 passed** after rollback permission and follow-up/filter improvements — management browser flows, **267 unit tests**, and types. Browser coverage additionally saves follow-up assignments and global configuration, reads the public revision back, verifies old write rejection and checks management access without GitHub. [Machine-readable result](evidence/final-ui-suite-2026-10-27.json).
- [Real PostgreSQL result](evidence/postgres-2026-10-27.json): **11/11 passed**, including the public HTTP ingestion handler backed by actual SQL with synthetic child/device context and duplicate retries. Fresh-fetch receipt timestamps, recovery from storage failure, and rejection of immutable audit/version overwrites are covered.
- Migration CLI exercised twice against the synthetic loopback test database: version 1 applied, then repeat reported not applied. No production migration was attempted.
- Documentation validation: **887 consistency checks passed** after evidence links were added. Workflow YAML parsed successfully. `git diff --check` passed.
- Phone and battery checks passed in the earlier broader run; boot and UI contract passed earlier as recorded above. These passes are separate from the repository's full GitHub release suite.

## Performance findings

[Sequential speed output](evidence/speed-checks-2026-10-27.txt) records passing checks **with budget debt**: home 447 draws and village 352 draws against 250 budgets; village approximately 732,000 triangles against 300,000. The startup check reports tablet title about 0.9 seconds, valley readiness 16.4 seconds on first start and 16.9 seconds on the second, with a 3.6-second longest freeze. These figures must not be described as meeting every rendering/interaction budget. This implementation did not alter the world or renderer to conceal them.

## What these checks do not prove

No secure production database binding is configured in this environment. No production schema migration, paid provider activation, Netlify deployment, physical-device verification or Windows executable run has occurred. Provider permissions and actual device acknowledgements require verification in the selected environment.

`node suite.mjs --changed --list` selects the full suite because this change includes shared and test files. Repository policy places that suite on GitHub. The full suite has not been run or claimed as passing here; the working implementation must be committed/pushed under the owner's release process before that workflow can validate the exact branch. No main merge or version change is authorised by local passes.

The documentation validator checks the historical design package and schema examples. It now verifies pinned historical source hashes and explicitly reports runtime drift; it does not certify the newly implemented server or game behaviour. Runtime tests above provide that evidence.


## Netlify SQL and operations follow-up — 27 October 2026 AEDT

The owner selected Netlify Database and asked the primary agent to continue alone.
The runtime and trusted operator tools now prefer Netlify's native context-specific
`NETLIFY_DB_URL`; existing pg transactions and explicit checksum migrations remain.
No Netlify database was provisioned, production migration run or workflow dispatched
to a real provider. Provider responses and all family records in these tests are synthetic.

- [Real PostgreSQL integration](evidence/postgres-operations-2026-10-27.json): **14/14 passed**, now including read-only absent-schema detection, exact checksum readiness/drift detection, and concurrent operation dispatch with durable audits/reload idempotence. Each run removes only its own random schema.
- Preflight CLI: missing binding returned safe code `management_database_not_configured`, exit 2. With the native binding pointed at the isolated loopback PostgreSQL 17 test database it returned ready/current, local true and TLS false; this is intentionally local and does not verify remote Netlify TLS or write access.
- [First focused suite](evidence/operations-first-suite-2026-10-27.json): **9/10 checks passed**, including **285 unit tests**, types, preload, boot, contract, voice, save recovery, network-message validation and service-worker update recovery. The Studio assertion incorrectly expected `4990`; the actual UI correctly rendered `4,990`. The assertion now accepts EN/VI separators.
- [Browser follow-up](evidence/operations-browser-2026-10-27.json): passed real owner sign-in, child/device details, catalogue lookup, filters, attention editing and configuration publication in EN/VI at 390/820/1440 pixels. Twelve captures include six Operations views. Bounded database/bot submission and exact provider-run reconciliation passed with stub providers.
- The same browser check runs actual save/voice modules in a synthetic isolated document. It verifies download initiation, accepted share handoff, cancelled sharing, restore persistence success, failed storage readback and invalid restore. Actual recorded-player paths verify ended/error/cancellation/watchdog observations without treating a watchdog as confirmed success. Its initial fixture failed because it did not trigger voice-index loading; the fixture now triggers the normal click loader. [Initial fixture failure](evidence/operations-browser-initial-2026-10-27.txt) is retained.

The Operations screenshots were visually inspected at phone, tablet and computer
sizes. A follow-up styling change gives the reason field the existing standard text
input appearance and marks configured-but-unverified badges as attention states.
The full GitHub suite and physical-device/Windows verification remain unrun.
Production Netlify connection, real provider scopes, retention/deletion, database
restore drills, specialised revisioned editors and rendering budget debt remain open.
See [Netlify and operations](NETLIFY-AND-OPERATIONS.md) for scope and boundaries.


Final follow-up checks:

- [Final types/unit/browser suite](evidence/operations-final-suite-2026-10-27.json): **3/3 passed**, with 285 unit tests and the actual game boot producing matched started/ready events through its consented lazy client. Turning Analytics off cleared the detailed queue. The unit check constructs pg clients to verify URL SSL parameters cannot override certificate verification. Final Operations input styling, bilingual error feedback and attention badges are included.
- [Layout and speed suite](evidence/operations-layout-speed-2026-10-27.json): **5/5 passed**, including ten screens on phone/tablet/computer and sequential performance, battery and startup checks. [Exact speed output](evidence/operations-speed-2026-10-27.txt) retains rendering debt: home 439 draws, village 360 draws against 250 budgets; village 734,128 triangles against 300,000. Startup measured title 0.9 seconds, valley ready 16.4 seconds initially / 17.0 seconds second start and a 3.7-second longest freeze. These results do not establish that rendering budgets are met.

No full suite was run locally. Repository rules select GitHub for the full suite;
this round has not been pushed or deployed. All previous and first-failure evidence
remains separate from the final passing results.

[Documentation/build checks](evidence/operations-documentation-checks-2026-10-27.txt):
902 consistency checks passed; all 133 generated game/UI JavaScript files are
current. A final preflight still reports no database binding (expected exit 2).


## Finance and current-release integration — 27 October 2026 AEDT

The owner authorised finance and requested the full suite. Released v1.02
(`b241286a`) was integrated locally first. Merge overlaps in voice, connections,
live configuration and offline files were resolved while preserving both the
released behavior and management evidence. No new version or production release
was authorised.

- [Focused local suite](evidence/finance-local-suite-2026-10-27.json): **3/3 passed**; 397 unit tests, types (196 explicit game/test files and 76 server/Studio/tool files), authenticated Finance setup/preview/save/correction/history/CSV duplicate checks, existing management/config/operations flows, actual game boot/voice/save observations, EN/VI at 390/820/1440. Eighteen screen captures include six Finance views. The recorded voice regression also passed in a preceding focused run.
- [Real PostgreSQL](evidence/finance-postgres-2026-10-27.json): **17/17 passed**. New coverage includes migration v1→v2 preserving existing config records, concurrent duplicate finance commit, preserved correction versions and atomic rollback of ledger/version/audit writes after a synthetic storage failure. No production data or live provider is used.
- Documentation consistency: **917 checks passed**, four schemas and existing positive/negative fixtures, seven diagrams and 160 local links. Historical design hashes remain pinned; current v1.02 drift is explicitly reported.
- Initial finance type checks found four implementation type errors; these were fixed, not suppressed. Subsequent focused suites passed.

The source follows [B01–B12 traceability](PLAN-TRACEABILITY.md). Finance uses the
manual-first scope and explicit assumptions in [FINANCE.md](FINANCE.md). AUD and
separate invoice/cash views are the proposed default, configurable before the
first entry. No actual finance input is fabricated or committed.

GitHub full-suite and fresh sequential speed validation are pending at this
checkpoint. A final report will record the tested commit, run URL, failures and
reruns rather than treating a workflow dispatch as a passing result.


Follow-up review found a financial overflow edge case: individually valid source
amounts could overflow after FX or when combined. The implementation now rejects
FX overflow before persistence and returns explicit unavailable totals for
aggregate/budget overflow while preserving ledger access. Linked credits cannot
create negative net settlement. Focused regression checks are being rerun before
restarting the GitHub suite on this change.

A local overlap was detected between the speed suite and an extra focused run.
The extra run was terminated; its timeout and the overlapping timing log are
retained as discarded evidence, not passing release measurements:
[discarded focused log](evidence/finance-discarded-overlap-2026-10-27.txt),
[discarded timing log](evidence/finance-discarded-timing-overlap-2026-10-27.txt).
Affected timing checks will be repeated in isolation.


Post-review checks:

- [Final local Finance suite](evidence/finance-final-local-suite-2026-10-27.json): **3/3 passed**, including **399 unit tests**, types and the full EN/VI authenticated management/finance browser flows after the overflow and settlement guards. The discarded overlapping run is not reused.
- [Isolated speed rerun](evidence/finance-isolated-speed-2026-10-27.json): **3/3 passed**, with [exact output](evidence/finance-isolated-speed-details-2026-10-27.txt). Existing rendering debt remains: home 462 draws / village 393 draws against 250; 782,592 village triangles against 300,000. Title 1.0 s, valley ready 16.1 s initially / 16.6 s second start, longest freeze 3.8 s. These do not meet every rendering budget. The tiny subsequent mixed-voice language-argument change does not affect the disabled telemetry/default rendering path; its targeted regression is separate.
- [Mixed voice regression](evidence/finance-mixed-voice-2026-10-27.json): **2/2 passed** (types + mixed-Hanoi voice check). A new actual-browser case plays English recorded audio while the interface is Vietnamese and asserts recorded success with language `en`. The composite source order, pauses, fallback, cancellation, warmup, male preview and private on-device speech checks remain intact.

GitHub runs `40430213718` and `40430357563` were superseded by SQL-suite integration and financial safeguards. Run `40431137311` is superseded by the targeted spoken-language fix. Cancelled runs are not passing release evidence. The final suite must be recorded for the final application commit.


### First complete GitHub run — failed, retained

[Run 40431751008](https://github.com/nguyentuanphu/tpn/actions/runs/40431751008)
checked application commit `3967cf91` on 27 October 2026, 12:18–13:20 AEDT.
[All actual check outcomes](evidence/finance-first-full-github-2026-10-27.json):
**247/250 passed**, three failures: `emoji` (raw status glyphs in five published
text logs), `ownerstudiofolds` (management pages excluded from the shared folding
behavior), and `testerreport` (no receipt for the injected freeze within its
existing six-second wait, including retry). This is failed evidence.
`folkplay` and `ownerfamily` passed only on retry and remain named here.
The SQL check includes **17/17** real PostgreSQL cases.

The published text logs now use plain PASS/FAIL markers, preserving outcomes and
numbers. [Nine quick checks passed](evidence/finance-quick-corrected-2026-10-27.json),
including all 399 unit cases and the documentation rule. New text evidence is
normalized by `tools/normalize-evidence.mjs`; original structured payloads remain
on GitHub, with Unicode escaped in published JSON. No assertion was weakened.

Management pages now use the existing persistent Studio folding behavior.
The unchanged freeze-report check passed locally in 58 seconds; its root cause on
GitHub is not yet established. Additional failure diagnostics and CI artifact
retention preserve earlier freeze reports and pending queue state for the next
full run. Passing an isolated local check does not establish a passing full suite.


### Studio contract corrections

[Correction suite](evidence/finance-studio-correction-suite-2026-10-27.json):
**5/5 passed**, including authenticated management/finance, types, documentation
rule, unchanged freeze-report check and the Studio-wide folding audit.
[Actual folding observations](evidence/finance-studio-folds-2026-10-27.json):
82 page/device combinations, 928 sections, 758 close/reopen checks, no loose
headings, stuck content, thin explanations, persistence failures or browser errors.
Finance is included in the page discovery. The first partial correction exposed
short help text; [its failed observations are retained](evidence/finance-fold-first-correction-2026-10-27.json).

Each management page now explains its evidence, defaults and effect in EN/VI.
The final small adjustment also folds status-first report cards without hiding
the preceding status badge; a real authenticated regression exercises its hidden
and visible facts on all three device sizes in both languages.

[Final status-card regression](evidence/finance-status-card-regression-2026-10-27.json): **3/3 passed** (authenticated EN/VI management/finance, types and documentation rule) after that last adjustment. Eighteen refreshed runtime captures were inspected on phone, tablet and computer.


### Comprehensive mode selected

Run `40457933192` checked the corrected source `35bffe6a`; its real PostgreSQL
job passed all 17 cases. It was superseded before the browser shards completed
so the replacement run could use `all=true`. A cancelled run is not full-suite
pass evidence. The legacy slow-check selector still matches `.js` for some film
and voice sources, while maintained sources are now TypeScript. The comprehensive
mode explicitly checks every reading item, film and voice area, bypassing rotating
samples without weakening an assertion or changing application code. Final
evidence must name that comprehensive run.


The comprehensive run's [actual SQL job evidence](evidence/finance-final-github-postgres-2026-10-27.json)
records 17 passed cases on PostgreSQL 17.11 for exact app `35bffe6a`. The full browser
result is still pending. [Synthetic CSV verification](evidence/finance-csv-artifact-2026-10-27.json)
round-tripped five unreconciled example rows without database writes.
[Static package verification](evidence/finance-static-package-2026-10-27.json)
checked ZIP integrity and recorded its hash; that archive contains no Studio or
Functions. The offline guide passed 21 browser cases at 390/820/1280 pixels.


[Existing live public-site baseline](evidence/finance-live-baseline-2026-10-27.json),
observed 27 October 2026 at 17:32 AEDT: the game root, parent website and Studio
login each returned HTTP200; the public build script reports v1.02. These are
read-only HTTP observations, without private sign-in or a database probe. They
validate neither deployment of this branch nor production SQL readiness.


The 399 passed unit cases are not a claim of zero exclusions. The existing
[legacy C-layout unit case](evidence/finance-unit-exclusion-2026-10-27.json) is
intentionally conditional and does not run for the current D3 map. The contemporary
bank-layout assertion remains enabled. This round adds no skip and does not
change that test. Full-suite-level skipped checks are reported separately from
this known legacy unit exclusion.


### Comprehensive run completed — failed, retained

[Full structured evidence](evidence/finance-comprehensive-github-2026-10-27.json)
records **249/250** on `35bffe6a`, with no rotating SAMPLE checks.
`ownerreportedphonevi` failed, including retry, because the matched Vietnamese
Home control for historical issue181 was blocked at430×873. `hoilang` passed
only on retry. The earlier folding, documentation and freeze-report failures
passed in this run. No assertion is waived and no new skip is introduced.

The owner requested review of the whole Studio rather than concentrating on
Analytics. The [all-pages review](https://github.com/nguyentuanphu/tpn/tree/review/studio-finance-20261027/docs/studio-page-review-20261027)
contains all41pages plus3sectionmenus and sign-in, at desktop/tablet/phone:
135states,267sourcePNGs and a45-page bookmarkeddesktopPDF. Synthetic preview
records only; gallery/browser checks pass, with no uncaught errors or horizontal
page overflow. Full-suite failure and production-readiness limits remain separate.


### Remaining phone-control failure — fixed and locally verified

The actual hit-test diagnostic identified the floating report icon over historical
Home control181. A deterministic modal collision failed before the fix. Further
regressions exposed decorative-layer selection and missing scroll response. All
failed stages are retained as evidence, including [initial collision](evidence/finance-report-collision-before-fix-2026-10-27.json),
[decorative layer](evidence/finance-report-decorative-layer-before-fix-2026-10-27.json),
and [scroll collision](evidence/finance-report-scroll-before-fix-2026-10-27.json).

Default placement now avoids foreground controls across visible panels and
updates after scrolling, input, transitions, animation, toggles and font loading.
Deliberate dragged positions remain preserved. Listeners and observers are
removed on unmount; the module remains tester-only. No new spoken lines or
ordinary-game startup path are introduced.

[Final focused checks](evidence/finance-report-final-local-2026-10-27.json):
**6/6 passed** — `reportcollision`, `reportfloating`, `ownerreportedphonevi`,
`testerreport`, `types`, `emoji`. The historical control is actually hit-testable
in [the replay observations](evidence/finance-reported-phone-final-2026-10-27.json).
The existing floating-report flows also pass across phone/tablet/computer in
English and Vietnamese. A fresh comprehensive GitHub run is required for this
new application code. Previous failed/cancelled runs do not become pass evidence.
