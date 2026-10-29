# Validation and release limits

27 October 2026 AEDT. This is an implementation checkpoint, not a production release. Final source/run identifiers and packaging hashes are recorded with the handoff.

## Observed local results

- Unit run: **404 passed; one existing intentional legacy C-map exclusion**, 405 total cases. New cases cover missing/zero daily observations, device-only report association, exact current receipt isolation, signed chart values and escaping. No new skip was introduced.
- Type check passed: 196 explicit files and 76 server/Studio/tool TypeScript files in the runner’s report.
- `ownerdesk` passed: 36 actual signed-in EN/VI views at390/820/1440, with viewport and full-page captures; source-backed graph values, five areas, shared palette/art, person/device and problem associations, restored filter and summary-only privacy.
- `managementstudio` passed: existing finance setup/preview/commit/correction/history/CSV duplicate flow, operations dispatch/result reconciliation, child/device views and same-page filters, across EN/VI and three viewports.
- `ownerstudiofolds` passed on runtime checkpoint922c56c2: 90 page/device combinations,1,000 sections,782 close/reopen checks; no thin help, loose headings, stuck folds, persistence failures or browser exceptions.
- `ownerstudioperms` passed on922c56c2: custom permissions show immediately, save and reopen on desktop/phone; all21 grants remain visible/selectable.
- Emoji, architecture and rule consistency checks passed on922c56c2. Existing assertions remain in force.

The broad local batch was **9/10** because `ownerstudiofailures` still expected the old Game-menu Lab card. It was retained as a failure, then updated to navigate through Work’s retained tool. The full legacy Studio test likewise needed its old Family/Analytics navigation updated to exercise the new routes while preserving checks for all nine family tools, analytics, save policies and server permissions. Corrected-run outcomes are recorded at the end of this document when complete.

Earlier first attempts also identified a local Playwright path omission and two fixture issues (report timestamp outside the selected period; a new custom test account still required two-step setup). They were fixed in the harness/configuration without weakening product assertions. A catalogue `hidden`-layout defect was fixed and received a real visibility regression assertion.

## Comprehensive GitHub runs

- Historical run40470635366 on56dc6e48 **failed**. Share2 terminated with exit143 and produced no result artifact. Available artifacts contained221 passing check results with `welcomevoice` passing only on retry; the SQL job passed17 cases. Missing results are unknown, not passes. This is not proof of a complete green suite.
- Initial redesign run40498565708 on922c56c2 was **superseded/cancelled** once obsolete navigation selectors were found in broader tests. It is not a release pass.
- The final handoff records the new comprehensive `all=true` run and its observed status. Never infer a pass from individual shard jobs: inspect the collector and actual `suite-result.json` artifacts. If still running at the hour boundary, the next chat must collect it and fix any failures before release. Import exact `check-map` artifacts only from the completed appropriate run, per repository policy.

## Material limits

- Browser fixtures use actual UI/server routes but synthetic in-memory stores/providers. No live Netlify private sign-in, SQL binding or provider write is established.
- No production detailed-family activation. Retention/deletion/recovery drills and actual account-grant review remain required.
- Windows packaging asset definitions are updated; an actual new executable and physical Windows test are not claimed.
- Physical iPhone/iPad/Android, keyboard/rotation edge cases beyond named automated coverage, and ordinary-game rendering debt remain open. Existing baseline draw/triangle budgets were not all met in earlier runs.
- This round changes Studio and additive management reads, not game release numbering. No source-to-website editorial lock is silently marked reviewed.
- All26 graph contracts and full specialised editing/targeting remain broader work. This slice implements seven graph families with actual available inputs; it does not invent unavailable funnels, quotas, due dates or global child identity.

## Corrected-run result

The corrected focused run passed **5/5**: `studio`, `ownerstudiofailures`, `managementstudio`, `ownerdesk`, and `types`. The legacy `studio` check covered20 pages online and through the desktop server at three sizes,25 pages’ touch targets,99 bilingual server messages, authentication, permissions, save/publish, update, photo and testing flows. The Lab recovery assertions still verify preservation of unseen device policy and that late Analytics cannot overwrite Releases.

The final small run passed **3/3**: `ownerdesk`, `unit`, `types` after the last canonical public website-link change. It also checks the actual game fonts and that every new visible pictograph has game artwork. Unit count remains404 passes and the existing one legacy exclusion. Evidence files `local-broad-*`, `local-corrected-*` and `local-final-*` preserve separate outcomes; the9/10 broad run is not rewritten as a pass.

Final runtime source: **35bcb63c0c9682bb9d32885063c8b7dc7b3c86df**. Fresh comprehensive **all=true** run: [40500953581](https://github.com/nguyentuanphu/tpn/actions/runs/40500953581). It contains the corrected navigation tests and the new `ownerdesk` check. Its latest observed state is recorded in the delivery notes; do not equate the local focused results with a completed green full suite.
