# Resume the environment step by step

Observed toolchain: Node v24.19.0, Python3.12.14, Playwright1.56.1, TypeScript5.9.3. CI uses the workflow's pinned setup. Keep the inherited proxy/CA configuration and read the managed cloud runtime skill when available. Do not print environment values or credential files.

## Get the one branch

A shallow/single-branch checkout may only fetch main. Fetch the exact handoff ref explicitly:

```sh
git fetch origin refs/heads/handoff/studio-combined-20261029:refs/remotes/origin/handoff/studio-combined-20261029
git switch --track origin/handoff/studio-combined-20261029
git status --short
```

If the local branch already exists, switch to it and pull without force. Preserve user edits. Confirm both source ancestries against INTEGRATION-RECORD.json before changing anything. Do not reset to an old per-chat checkpoint.

## Install only locked development dependencies

```sh
npm ci
npm ci --prefix tests
npm ci --prefix tests/services
npm ci --prefix netlify/functions
node tools/build.mts
```

Use the installed Playwright browser at `/workspace/.cache/ms-playwright` where present. Otherwise follow the pinned tests/package.json Playwright installation and system-library requirements. Do not silently select a different browser version or disable TLS/proxy verification.

The existing local server may already be on port8765. Check before starting another. To serve source from the repository root:

```sh
python3 -m http.server 8765 --bind 127.0.0.1
```

Use a separate command session. Synthetic multiplayer checks need the existing local services:

```sh
node tests/services/start.cjs
```

This uses local Peer9000/MQTT9001. Do not point synthetic multiplayer tests at real users. Never run two suites beside one another.

## Focused validation

Run from the repository root with explicit capture paths, each batch after the previous one finishes:

```sh
PLAYWRIGHT_BROWSERS_PATH=/workspace/.cache/ms-playwright STUDIO_OWNER_REVIEW_DIR=/tmp/studio-review/screenshots STUDIO_MANAGEMENT_REVIEW_DIR=/tmp/studio-review/management node tests/suite.mjs --jobs 1 --only unit,types,ownerdesk,managementstudio
```

Other relevant checks: managementbudget, contentart, contentpair, contentcaptures, contentprogress, contentvoice, contentwebsite, games, folkplay, a11y, offline, preload, arch, rules. B's content tests write its dated evidence folder; preserve new outputs before restoring historical tracked bytes. Set STUDIO_BUDGET_RESULT for a separate resource-report path. Preserve local tests/check-times.json as evidence, then restore original tracked timing; official timing/maps come only from appropriate completed GitHub artifacts.

```sh
node tests/suite.mjs --changed --list
gh workflow run full-suite.yml --ref handoff/studio-combined-20261029 -f all=true
```

If changed selection expands to full, do not run it locally. Exhaustive films/reading/full suites belong on GitHub. Keep exact source, run ID, raw failure/retry evidence and collector state.

## Generate current public facts

After committing relevant source:

```sh
node tools/export-management-catalogue.mts
node tools/export-content-source-inventory.mts docs/studio-combined-handoff-20261029/source
node docs/studio-revamp-progress-20261029/tools/audit.mts docs/studio-combined-handoff-20261029/source/public-definitions
python3 docs/studio-combined-handoff-20261029/tools/build-plan-register.py
python3 docs/studio-combined-handoff-20261029/tools/build-work-register.py
```

The exporter copies public definitions and import/media evidence only. It does not enumerate private/provider records or prove runtime/control completeness. Website sync needs an explicit immutable SV_WEBSITE_SOURCE, reviewed facts and an honest editorial gate. Do not use --record-reviewed until the actual combined review is complete.

## Unavailable bindings

Read-only readiness:

```sh
node tools/check-management-database.mts
```

Current observation is exit2 / management_database_not_configured. Existing Netlify Database is the chosen service. Bind it securely to the correct preview context before live checks; never copy a production URL into preview. Migrations001–003 and tools/migrate-management.mts exist, but running a production migration is not authorised here. Review backup/restore, grants, retention and deletion before activation.

AZURE_SPEECH_KEY is also absent. The approved recording workflow is tools/make-voice-pack.mts with --engine azure and the secure binding; see its documented region/cast/limits. Do not paste keys, provision a paid substitute or replace missing recordings with removed text.
