# Sparkle Valley Studio: one-branch integration handoff

29 October 2026 AEDT. **Branch: `handoff/studio-combined-20261029`.** Both workstreams are included through a real Git merge, preserving both histories. This is a combined development checkpoint for the next integration chat, not a complete-product or production release claim.

The owner's latest instruction is to upload and combine everything so the next chat can finish integration. This folder is the current entry point. Historical handbooks and ZIPs remain intact; their older pending-work paragraphs and source counts are not current status.

## Read in order

1. [Environment and exact commands](ENVIRONMENT.md), then [current implementation and limits](STATUS.md).
2. [Owner requirements and decisions](REQUIREMENTS.md).
3. [System and data connections](SYSTEM-MAP.md).
4. [All original plans and contracts](PLAN-INDEX.md), with machine-readable PLAN-CATALOGUE.json.
5. [Every remaining work item](WORK-REGISTER.md), with machine-readable WORK-REGISTER.json.
6. [Combined-source integration record](INTEGRATION.md) and INTEGRATION-RECORD.json.
7. [Validation, failures and source provenance](VALIDATION.md), SOURCE-PROVENANCE.json and CI.json.
8. [Actual screenshots and original concepts](VISUALS.md).
9. [Copyable next-chat instructions](NEXT-CHAT.md).

Studio owns the overview and management journeys. The game owns actual play, local progress and parental choices. The website explains reviewed content and has only explicitly supported live consumers. Finance records evidence; it does not make payments. Public marketing must not identify children.

## What was completed during consolidation

- Merged workstream A's Studio/API/SQL/policy/recovery and workstream B's content/website/inventories into this branch. Resolved the offline-cache conflict by keeping A's policy module and B's three real art dependencies.
- Reconciled shared assertions with the exact four remaining declared-only games; kept fail-closed, privacy, contradictory-metadata and all-event rejection checks. Integrated art event acceptance uses a valid synthetic live-store adapter.
- Extended uncertain-write/conflict recovery to the advanced JSON editor, with explicit reload and local invalid-JSON feedback before any request.
- Diagnosed the full-profile comparison failure as an unrelated delayed welcome-sticker change. The established noWelcome fixture isolates that event; the whole-profile assertion remains. Road colour still requires the same gap, measured over plain asphalt instead of one random speckled pixel.
- Added a bounded, local on/off resource observation. Its actual results and limitations are in evidence/reporting-budget.json; they are not Netlify costs, battery tests or a zero-impact promise.
- Gathered inherited failures and current checks, refreshed combined-source exports, and assembled the complete takeover map. Exact outcomes are in VALIDATION.md; proposed work remains labelled pending.

## Important incomplete work

Four games (`spotdiff`, `hiddenpic`, `paperfold`, `rongran`), twelve guidance lines, other optional-function families, remaining business views, global combined website review, live existing-Netlify-Database activation/recovery and physical-device/release checks remain explicit tasks. Full current-source CI must be inspected; no missing recording is silently removed to make coverage green.

[Local resource observations and operating recommendation](RESOURCE-OBSERVATIONS.md).

Optional portable [review ZIP](Studio-combined-review.zip) and [package manifest/hash](PACKAGE.json). It contains review documents, registers, evidence and pictures; it is not a deployable game or a substitute for the complete source branch.
