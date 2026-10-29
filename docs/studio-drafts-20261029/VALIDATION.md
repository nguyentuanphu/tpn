# Validation and release limits

29 October 2026 AEDT. Runtime/test implementation **06483b71** on `review/studio-finance-20261027`. Documentation/evidence commits may follow without changing that implementation.

## Actual completed checks

| Evidence | Result and limits |
|---|---|
| Initial unit/types | 411 unit cases passed; types passed before new draft tests were added |
| Expanded initial suite | 4/5: 417 units, types, rules and architecture passed. Browser failed a new test assertion that compared accumulated change history against number of config records, rather than history before Save. This was a test-author error, preserved in `evidence/initial-suite.json`; no runtime failure was waived |
| Corrected layout suite | 3/3: phone, managementstudio, emoji. Phone: 10 screens at phone/tablet/desktop, 196s. Signed-in Studio: EN/VI draft save, navigation-away/resume, Review, Publish and actual public read-back at all three sizes, 41s |
| Final focused suite | 6/6: **418 unit cases**, types, rules, architecture, emoji, managementstudio. Final signed-in Studio check 40s; screenshots include draft/actions at each EN/VI × three sizes. Existing finance, operations, private-data and isolated permission paths remain exercised |
| Real local PostgreSQL | **20/20 integration cases**, synthetic isolated loopback database only. Includes v1/v2-to-v3 migration preserving prior config/finance records; immutable draft history; concurrent single publication; atomic failure rollback; existing receipts/event/finance behaviour. `evidence/postgres-log.txt` and start log retain the actual result |
| Visual inspection | Phone English action view, tablet Vietnamese and desktop English draft review inspected. Controls fit; consistent game fonts/tokens/art. Native screenshots remain browser emulation, not a physical iPhone/Windows check |
| Changed-check selection | Full suite required; exhaustive run belongs on GitHub. Selection saved in `evidence/changed-selection.txt` |

The browser test now verifies **more stages**, including private Save and server-persisted resume before publication. Its old immediate-publication expectation was replaced because this feature explicitly changes the editor to draft/review/publish. No guard, grant or assertion was removed to bypass a runtime failure. The screenshot summary text was corrected after capture to report the actual dynamic capture count; that wording-only adjustment changes no assertions or runtime source.

Seven new unit cases cover persistence/no-public-side-effects, mandatory review and reset, stale/double publication, racing edits, public baseline conflict, legacy hash drift including a mid-publication race, content deletion, atomic rollback and HTTP grants/pending projection. The pre-existing legacy unit exclusion remains; no new unit skips were introduced.

`evidence/source-hashes.json` records the implementation/test files. `screenshots/capture-source.json` records the actual synthetic fixture and capture list. Generated timing/voice/historical image outputs were preserved under evidence before restoring the old tracked bytes; local check timing is not an official full-suite map.

## Full GitHub suite

The previous exact-source run **40789704114**, for `d15b6af4`, was still running when this new implementation was ready. Its available PostgreSQL artifact confirmed 17 cases; no browser/full collector pass had completed. `evidence/prior-ci/observation.json` records that observation. Starting the new same-branch exhaustive run supersedes the older run through the workflow's existing concurrency policy. Missing older results remain unknown, not passes.

Current exact-source exhaustive run **40793180243** ([open run](https://github.com/nguyentuanphu/tpn/actions/runs/40793180243)) details are in `CI.json` and `evidence/current-ci/` when available. **Full-suite completion is still pending**. Do not treat local 6/6 or the historical 253/253 baseline as full validation of this implementation. Inspect all result artifacts, collector, failures/retries/sample/skip markers and source SHA before recording success or importing the official check map/timing.

## Not demonstrated or authorised

- Existing live Netlify Database connection, migration003 applied in a Netlify preview, production grants or recovery/retention/deletion lifecycle. No database binding exists in the workspace.
- Complete optional-function controls, per-item controls and playability of every catalogue entry, all 104 release consumers or immediate offline/open-activity effects.
- Plain-language per-item workspace, every marketing/finance graph, website consumer/build consistency and physical-device/Windows validation.
- Main merge, production migration, deployment, payments, paid provisioning or version change.

This is a tested implementation checkpoint and handoff, not approval to release the complete Studio.
