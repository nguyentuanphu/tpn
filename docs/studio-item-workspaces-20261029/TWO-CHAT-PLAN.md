# Two-chat ownership and remaining work

29 October 2026 AEDT. The owner requested two workstreams. This chat is A; the owner starts a separate chat B with the linked prompt. No deployment authority is added.

| Owner | Remaining work |
|---|---|
| A — this chat | Finish Studio item workspaces and shared runtime control boundaries; private proposals/review/publication/delivery; Collect/Process/Show policies; remaining graphs, People and marketing, Work/services and Money; Netlify binding/recovery preparation; combined integration, validation and release handoff |
| B — second chat | Resolve and integrate intended declared-only games; verify individual implementations, art, voices, age/difficulty, launch/finish/exit/progress; complete public content inventory and dependency records; align website guides and source/art/reward descriptions; deliver tests, screenshots and an integration handoff |

## Boundaries

A owns studio/ui/*, netlify/lib/management/*, netlify/lib/admins.mts, netlify/lib/live.mts, js/custom.ts, js/main.ts, js/games/frame.ts, js/learn.ts, js/tales.ts, js/content/unlocks.ts, types/save.d.ts and A tests. B proposes shared-contract changes in its handoff instead of replacing these files.

B owns concrete content modules including drawing2.ts/crafts.ts, js/games/catalog.ts, content metadata and second-set declarations, home/*, website tools/review documentation, source extraction and B tests. In shared js/content/activities.ts, B may change GAME_INFO metadata only; preserve A's gameInfo/item gate changes. Required offline/preload additions must preserve the version. Keep management catalogue schema/fields compatible, especially typed kind:id, coverage.discovery, source hashes, guide alignment and unlock dependencies.

Both chats keep evidence in their own dated folders and reconcile board additions during integration. Do not overwrite frozen screenshots/ZIPs or official check maps/timing. Do not label metadata as proven playability. Missing or ambiguous IDs remain explicit; never silently alias rongran to dragon or delete either ID.

## Integration order

1. A uploads the current checkpoint and records tests and unfinished verification in STATUS.md.
2. B branches from that uploaded checkpoint into work/studio-content-website-20261029, records its starting SHA, and works independently.
3. B pushes its completed branch and supplies exact source SHA, changed files, screenshots, actual test outcomes, unresolved items and shared-contract requests.
4. A reviews and integrates B's branch, regenerates combined source facts, and reviews website explanations/art against the combined source. A review lock is evidence of an actual review, not a way to silence drift.
5. Final exact-source CI and local/device/recovery checks establish release readiness. No main merge, deploy, version change or production migration without the relevant owner approval.

Read [the second-chat prompt](SECOND-CHAT-PROMPT.md), [current status](STATUS.md), and [the master design](../studio-revamp-master-20261027/README.md). A can continue Studio controls and business views while B owns concrete games and website files.
