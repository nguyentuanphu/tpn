# Implementation validation

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
