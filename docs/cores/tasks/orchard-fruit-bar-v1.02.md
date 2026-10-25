# Orchard and parent arcade implementation plan · 25 Oct 2026 AEDT

Owner explicitly requested Release to review and build both shared designs. Branch work/v1.02-fruit-parade; version v1.02 already selected, deployment not approved.

## Audit at ed9a5b0a

- sparkleorchard.ts is a 27-line welcome-only stub importing absent parade-engine.ts. No gameplay or engine exists in Git history at this head.
- Catalog registration exists but no offline list, activity integration, network definition or release switches. releases.ts adds whitespace only.
- Studio whitespace churn masks three nested details changes, with untranslated Tiles headings. No alignment rules added.
- Simple screen tools shrink to 44px, violating the 64px under-five rule. Do not collect this CSS regression.
- temp/fpt-recordings/manifest.json is explicitly dryRun true, recorded 0. Not proof of recordings. Unsafe helper recorder will not run.

## Scope

Preserve Fruit Parade three-lane game. Add separate Orchard ring board with mission collection, timing/age assist, calm mode, shared seeded turns, offline solo/helper/local and online 2–4 seats. Real original art, bilingual cues, 64px controls, cleanup, existing reward/save flow.

Add Fruit Bar through the Grown-ups page only, hidden from child lists and tester-limited even when its mode is enabled. Require existing press/hold gate for every participant. Original art, transparent weighted/equal seeded results, editable allocations, clear/repeat/free refill, finite rounds, session statistics. Counters are memory-only: no purchases, exchange, cash-out, child save/reward or public leaderboard. Single/local/online have isolated counters and shared results. Advanced alternate layouts/bonus minigames/daily global tournaments are extensions, not claims of shipped content.

Use a shared bounded ordered-command adapter over existing encrypted peer identities, with host commits/replay. This is a family session host, not a trusted backend/cryptographic anti-cheat service. Offline interruption preserves local board and offers explicit local continuation. Never silently replace an online participant.

Fix Studio analytics using existing collapsible summary components, bilingual headings and responsive equal-width/min-width layouts, preserving every statistic. Verify with synthetic empty/populated data, both languages and three device sizes. Do not import broad line-ending churn.

New TypeScript pure engine/session tests, actual browser completions and gating, phone/tablet/computer EN/VI screenshot inspection, offline module cache list, project checks, GitHub full regression. No local full suite. New voice inventory delta only after wording stabilizes; baseline 6319 inventory remains frozen.
