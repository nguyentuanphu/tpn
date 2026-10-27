# Next-chat takeover

This handoff records the owner’s one-hour checkpoint. Read the source snapshot/run status and package provenance saved alongside it; do not infer deployment or a green suite from this documentation.

Runtime source is **35bcb63c0c9682bb9d32885063c8b7dc7b3c86df**. The current comprehensive **all=true** run is **40500953581**: https://github.com/nguyentuanphu/tpn/actions/runs/40500953581. Read `DELIVERY.json` for the latest observation at the hour boundary and package hashes. Everything after this runtime commit should be documentation/artifact changes unless a later handoff explicitly records another code fix.

**Takeover state:** source and both ZIPs are pushed. Public downloads were fetched back, hash-matched and CRC-checked. Local corrected5/5 and final3/3 checks pass;404 unit passes plus the existing legacy exclusion;17 actual PostgreSQL checks pass. At23:20 AEDT the eight GitHub browser shares were still running and the collector had not produced a full result. There are no local suites still running and no uncommitted runtime edits. Do not restart the suite just because this chat ended; inspect the existing run first. The broader26-graph/contextual-editor suite is still unfinished.

## Copy-paste prompt

```text
Continue the Sparkle Valley Studio project in nguyentuanphu/tpn on branch review/studio-finance-20261027. Work with one agent. Do not merge main, deploy Netlify, change the version, provision paid services, make payments, or delete/overwrite family saves without the relevant explicit owner authority.

Read CLAUDE.md, docs/README.md, docs/cores/BOARD.md and docs/cores/release.md, then docs/studio-owner-desk-20261027/README.md, VALIDATION.md and NEXT-CHAT.md. Follow the managed cloud runtime skill when resuming. The exact checkpoint commit, current CI URL/status and package hashes are recorded in the delivery notes in this folder.

The owner approved implementing the connected Owner’s Desk concept, with the actual game’s artwork/fonts/colour tokens and visual consistency. The owner then timeboxed this round to one hour and asked for a packaged/uploaded checkpoint and takeover prompt. Existing Netlify Database is the chosen SQL provider; use its private per-context NETLIFY_DB_URL binding, with MANAGEMENT_DATABASE_URL only as an isolated development fallback. No live binding/provider credentials are available in this workspace; never request or paste credentials in chat.

The first slice implements Today, People, Game & website, Work and Money with Settings separate. It retains all old tool routes, adds accessible source-backed graph components, daily reporting series, scoped device/problem connections and current-device configuration receipts, and makes Finance presentation quieter. It reuses /studio/game/css/fonts.css, reads game palette tokens without importing canvas CSS, and uses the existing illustrated renderer and valley artwork. No global child identity or website visitor-to-child link is inferred.

First inspect git status and the exact comprehensive all=true run in the final handoff. Collect actual artifacts and collector outcome, distinguish retries/unknown/missing results, and fix failures. Do not rely on a shard’s success status. Import that run’s tests/check-map.json and check-times.json only when appropriate. Never run concurrent local suites/browser tests; use tests/suite.mjs. In this environment set PLAYWRIGHT_BROWSERS_PATH=/workspace/.cache/ms-playwright. The game server is normally on8765; verify existing services before starting duplicates.

Then continue the implementation against docs/studio-connected-concept-20261027/README.md and BUILD-AND-ACCEPTANCE.md. The register contains279 management entries,26 graph contracts,17 controls and13 connections, with historical/current/proposed status separated. Do not mistake those documentation counts for completed runtime features. Prioritise one complete contextual game-and-website editor with honest draft/review/publication semantics, more useful graphs from real compatible sources, and clearer control impact/confirmation. Preserve name opt-out, server permissions, exact finance/audit rules and current global-publication limits. A saved config, public snapshot, deployed build and device acknowledgement are different facts.

Keep the handbook, route/field map, board and source evidence current. Capture actual changed pages in EN/VI on phone/tablet/desktop with synthetic records, and provide verified public GitHub HTTPS review/download links; workspace/PDF/gallery links previously failed for this owner. Finish concrete review work before any deployment question. Report exactly what is done and what remains; do not restart the completed foundation or focus solely on analytics.
```

## Immediate remaining work

1. Inspect/collect the final comprehensive run and fix real failures. Local focused checks and synthetic SQL evidence are not a full release pass.
2. Finish contextual content editors, shared game/website impact previews, real draft/review persistence and revision-safe specialised saves. The current config POST publishes a revision; it must not masquerade as a private Save draft action.
3. Build the remaining graph concepts with source-specific filters, definitions, coverage and accessible drilldown. Mature cohorts, real handoff measurement and obligation due dates require new contracts; do not infer them from current counters.
4. Extend fine control targeting deliberately: HTTP revisioned publication is currently global; device selection inside an existing release rule is a different mechanism.
5. Verify actual Netlify Database/server bindings and permissions, retention/deletion and backup/restore before activating new detailed real-family collection. Never put preview code against a production database by copying its URL.
6. Complete physical-device and Windows verification, source/website review alignment and outstanding rendering work before release approval. Existing finance is manual records, not bank integration or a complete statutory ledger.

## Working-directory and evidence hygiene

Local browser tests can overwrite historical screenshot paths under docs/studio-management-foundation/screenshots/implementation and docs/v1.02-report-control. Preserve new outputs in this round’s evidence folder and restore historical tracked bytes only after preserving them. Preserve other uncommitted user work. Local suite timings may modify tests/check-times.json; preserve the local evidence but use GitHub collector artifacts for the committed release map.

All original screenshots, concept files and prior plans remain in Git history/repository. Source checkpoint archives intentionally exclude nested ZIP downloads and unchanged base artwork; their README identifies the exact base checkout required. The full review branch is the preferred resumption source.
