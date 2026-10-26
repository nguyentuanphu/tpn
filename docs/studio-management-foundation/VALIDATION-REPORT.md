# Foundation validation report

Date: 26 October 2026, Australia/Sydney (AEDT). Product source baseline: `ac76cf6097a8071bf2da4be90fe81fd0af8201d6`.

This file records validation of the documentation and interactive guide. The management features described by the handbook are proposed; their future acceptance scenarios are not current passes.

## Package checks

Status: **passed for the documentation/artifact scope**.

| Check | Observed result | Evidence |
|---|---|---|
| Registry completeness and cross-references | 137 data entries, 38 metric definitions, 23 connections, 32 requirements, 12 build tickets, 25 acceptance scenarios resolve | [Consistency checker output](evidence/consistency-checks.txt) |
| Existing implementation provenance | 30 source-file hashes match both working files and pinned Git commit | [Source evidence](source-evidence.json) |
| JSON Schemas and examples | Four schemas valid; 16 positive records accepted; eight deliberately invalid fixtures rejected | Checker output; [examples](examples/) |
| Local links and SVG accessibility | All checked links resolve; seven SVGs parse and have accessible titles | Checker output |
| Regeneration | Repeated generation produces identical registry/HTML/SVG/example bytes | Checker output |
| Offline HTML functionality | 18 browser cases passed at 390, 820 and 1280 px; search, combined filters, lineage expansion, empty state, metric definition and hash reload work | [Browser review](evidence/browser-review.json) |
| Browser errors / network | Zero uncaught errors and zero HTTP requests while opening the guide from disk | Browser review |
| Visual inspection | Phone, tablet and desktop overview captures inspected, plus system map and proposed Home wireframe | [Phone](evidence/guide-390.png), [tablet](evidence/guide-820.png), [desktop](evidence/guide-1280.png), [Home wireframe](evidence/home-wireframe.png) |
| Repository changed checks | 9/9 passed: emoji, preload, noemoji, arch, unit, names, bilingual, rules, types | [Summary](evidence/repository-checks.txt), [structured results](evidence/repository-checks.json) |
| Unit/type detail within changed checks | 232 unit tests passed; unit runner retains one intentional legacy skip. Type check: 123 explicit files plus stricter modules and 41 server/Studio/tool TypeScript files | Structured results; existing unit runner semantics |
| Whitespace and scope | `git diff --check` passed; application source, manifests, locks and versions unchanged | Git diff/status inspection |

Changed checks ran through `tests/suite.mjs --changed` with the required local HTTP server. An initial attempt stopped at the server-readiness guard because the earlier server process was absent; the server was started and the complete run then passed. Runner timing output was restored to its exact prior content. No assertion was weakened. During document checking, schema filename resolution and one generated `.js` versus tracked `.ts` reference were corrected before the successful final run.

## Reproduce

```sh
python3 docs/studio-management-foundation/tools/validate.py
node docs/studio-management-foundation/tools/review.mjs
```

The browser checker uses the repository's pinned Playwright/browser and creates documentation screenshots. It does not require external network access. Run repository suites separately, following `CLAUDE.md`, with the local server and preserved runner-generated files as appropriate.

## Remaining limits

No proposed management API, database migration, billing integration, applied-configuration receipt, new game event protocol or production management screen was implemented or tested. The future V01–V25 scenarios are specifications. Physical-device behavior, Windows executable packaging, real provider permissions/billing and a full GitHub release suite are outside this documentation validation. Existing/proposed labels throughout the handbook preserve that distinction.

## Scope

- Documentation, diagrams, registers, schemas, examples and an offline HTML reading artifact.
- No game logic, Studio runtime logic, website runtime, dependency manifest, lockfile or release version changed.
- No production API writes, provider provisioning, credentials, publication or deployment performed.
- Prior browser onboarding results belong to the earlier environment validation and are not counted as tests of this proposed management implementation.
