# Validation and release limits

29 October 2026 AEDT. This is a workstream A implementation checkpoint, not a complete Studio or release approval. Runtime/test source and latest exact-source CI are recorded in CI.json / SOURCE-PROVENANCE.json at upload.

## Local evidence

| Check set | Actual result |
|---|---|
| Item regression pass before policy changes | contract21s, phone176s (10screens at phone/tablet/desktop), managementstudio41s passed. Local filmstart turned out to be exhaustive all-film/all-page work; it was deliberately stopped, not passed or skipped. Reading had not run in that interrupted batch. Exact partial log retained |
| Initial function implementation |5/6:432units, types, architecture, rules, emoji passed. ownerdesk failed404 versus expected410 because the synthetic Netlify server did not route the real management ingestion handler. The fixture was extended to mount the actual handler and shared synthetic database; no assertion was weakened |
| Corrected function batch |4/4: ownerdesk25s, managementstudio47s,432units, types. Private proposal/resume/review/publish, server shutoff and parent/expiry checks passed |
| Expanded function batch |7/7:433units, types, architecture, rules, emoji, ownerdesk26s and managementstudio49s. UI controls fit54EN/VI views across3sizes; supplementary editor captures show readable controls |
| Shared game and reading regression |4/4: games273s (206eligible fixture games opened), ownerdesk26s, types, reading346s. Reading is explicitly SAMPLE: each original reading game once per language with a rotating level/age; not every age/level combination |
| Real PostgreSQL |22/22 actual local SQL cases. Adds function-scoped proposal/publication, collection independent from processing, stale-client rejection, expiry and retained event preservation to the existing migration/config/finance/receipt cases. Actual server version and named cases in evidence/postgres-evidence.json |
| Final function focused checks |3/3:434unit cases, ownerdesk26s and types; see evidence/final-suite.json. This repeats only checks affected by final cache fail-closed, Home/status, expiry-label and test-fixture changes; it is not a local full suite |

The all-games implementation fixture now explicitly sets unlockAll on synthetic profiles. It already enables release/tester access to inspect all implementations; the strengthened shared launch boundary now enforces progression too. This is not an ordinary-child access fixture. A separate real-module probe proves a normal locked profile is blocked and becomes eligible only after every prerequisite is earned. Group Off still overrides administrative/remembered access in the selected probes. No runtime access guard was weakened to make the content check pass.

The206launch check excludes conditional Family Quiz when there are no family questions. The separate actual-module probe registers207listed definitions with synthetic quiz questions, verifies Off across207game frames and92story theatres, restores a normal frame and preserves progress. Launch-boundary coverage is not proof of completion/playability for every listed or declared game.

The new policy unit cases cover malformed/unsupported/expired input, malformed cached scalar policy, private draft/review, independent collection/processing/visibility,24hour bounds across ordinary and advanced writes, expired proposal rejection, unavailable/read-only states, device-target redaction, permissions, server410 stopping retry and optional-request abort. Existing consent/name opt-out, acknowledgement/deduplication and finance tests remain. The pre-existing legacy unit exclusion remains; no new test skips.

Actual browser checks cover no optional module/download/upload when Off at startup, parent Analytics Off winning over Studio permission, real timer expiry clearing only optional queues and preserving profiles, and ordinary navigation after a private Save without a false global dirty warning. The maximum expiry is checked server-side; no browser-only control is treated as enforcement.

## Follow-up from actual CI failures

Old item sourceb4ad5beb run40814664317 exposed97available results:94passed,3failed (games, folkplay, netgames), all3also failed their isolated retries. Remaining shares were not complete. These are retained failures, not a full-green baseline.

- games: the stricter launch boundary refused second-set entries for locked synthetic profiles. The dedicated all-games fixture now explicitly authorises its implementation-only profiles;206eligible games opened locally. Ordinary locked/earned-access probes remain separate and strict.
- folkplay: its six second-set Vietnamese games also need their original category prerequisites. The fixture now earns those original wins, keeping runtime guards intact. Follow-up passes211s: actual completion in both age modes plus36EN/VI/device layouts.
- netgames: old CI timed out waiting for an invitation. Local real-broker play-through passed86s. Cleanup was then strengthened to wait for the celebration's tap listener and require the actual frame/network session to close, instead of removing live HTML; the changed test passed85s. Stage-labelled diagnostics retain peer/session/frame facts on future invitation timeouts. This is not a waiver of the CI failure; new exact-source CI must confirm it.
- preload: a focused check found the new shared policy module missing from index.html's generated preload block. Regenerated with tools/preload.mts;142scripts pass. No version or visual layout was changed.
- Online eligibility: a blocked online start now returns before pausing or emitting ActivityStarted, preventing a false reported attempt. The real-game browser check verifies no frame, no counter increment and unchanged progress/pause.

Final follow-up result is preserved in evidence/final-followup.json. Full all-film playback remains a GitHub responsibility; the interrupted local film check is not silently considered passed.

## Exact-source GitHub evidence

Historical draft source06483b71, run40793180243, is now fully audited:253/253top-level checks from all9share artifacts, successful collector, no retry/sample/suite-level-skip markers;20real SQL cases. Its unit suite still has the documented legacy exclusion. This is a historical baseline, not a full pass for item controls or function policies.

Earlier item run40814664317 onb4ad5beb remained incomplete and had the failures above; its actual available observation is preserved. Do not infer a full pass from a passing shard. The first function-source run40819282654 on113a0e5b was superseded after preload and regression follow-ups; its available result is separate from the final source. A new exhaustive all=true run for the uploaded function implementation is recorded in CI.json; inspect its exact source, artifacts, collector and all failure/retry/sample/skip markers before claiming green. Import official check maps/timings only from the appropriate completed run, not local measurements or the older source.

## Remaining gates

All-family producer/consumer coverage, device/cohort/role policy scope, measured comparable startup/traffic/memory/battery budgets, remaining graphs and business views, complete combined-source website review, existing Netlify Database binding/preview grants/recovery/retention/deletion validation, physical devices and current exact-source exhaustive CI remain. No paid service, production database, external message, deployment/main/version change or destructive family action was performed.

Local generated timing/voice and historical screenshot outputs are preserved before restoring their original tracked bytes. Actual new synthetic review pictures live in this dated folder; the frozen master package and other chat's content files are not replaced.
