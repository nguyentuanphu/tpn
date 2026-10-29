Current continuation: [Studio function controls](../studio-functions-20261029/README.md) supersedes the A pending-work/CI status below. The two-chat ownership split remains in force.

# Current checkpoint and workstream handoff

29 October 2026 AEDT. Runtime/test implementation0409b5d9; clean-source catalogue9efa00f6. Branch review/studio-finance-20261027. This chat remains workstream A; the owner starts chat B with SECOND-CHAT-PROMPT.md. No deployment/version/main merge or live migration.

## Implemented in A

- Plain-language game/story workspace: global item availability, game-only Simple-screen Hide/area/under-5 listing, before/proposed values, scoped private proposals, resume/review/publish, source consumers, release/unlock dependencies and static website-guide limits.
- An item workspace is separate from reporting reads. A failing reporting source does not automatically remove its source/settings view. Missing SQL/current configuration keeps editing disabled; no unknown value becomes On or zero.
- Typed content.itemAvailability keys game:ID/story:ID, booleans, default allow. Distinct from Simple-screen Hide. Shared launch checks block item Off before frame/story loading. Game entry also checks release/progress gates; item On does not grant access through group Off. Story theatre also respects held group state. Active activity can finish; offline clients keep their last fetched configuration.
- Item proposals are built server-side from the winning baseline, preserve other items/settings, carry itemKey, and cannot be overwritten through a different item or generic editor. Save uses baseline hash/revision checks; review/publish use the existing exact revision/hash transaction mechanism. Matching configure/content-edit grants are enforced server-side.
- js/tales.js converted to js/tales.ts under repo policy; served import remains js/tales.js. Existing local profile unlock/progress fields now have explicit type declarations. No new game tracking, child data, polling, migration or external dependencies.

## Actual validation

-424unit cases passed; types passed (78server/Studio/tool modules), architecture no cycles, emoji audit passed.
- Existing secondset and rollout checks passed in the expanded batch:27switch probes, preserved progress, schedules, tester cases, held menus and entry behaviour.
- Corrected ownerdesk passes21s:48EN/VI views at3sizes, actual private item save/resume/review/publish and public snapshot read-back.
- Actual game module probe:207listed game definitions present; Off blocks207game frames and92story theatres without opening layers; On restores an ordinary frame; group Off still blocks selected second-set/money/reading cases; saved profile preserved. This is launch-boundary evidence, not completion/playability proof for every game.26declared-only records remain blocked from enable in the workspace.
- Initial failures preserved: type errors revealed by theatre TypeScript conversion; old allowlist fixture needed the new validated section; a new fixture accidentally cleared an unrelated activities override; new runtime probe incorrectly called the liveBoot promise as a function. All were corrected. No failing runtime assertion was waived or test weakened.

Source provenance in browser-validation.json predates the clean generated catalogue commit but records the same implementation. Current catalogue generation from0409b5d9 is clean; node tools/export-management-catalogue.mts --check should pass.

## Still pending for A

Broader phone/contract/film/story/reading/online regression and exact-current-source exhaustive GitHub results; screenshots visual inspection and plain-language polish; detailed item field/control contract completion and unavailable/conflict flows; additional group/device control effects and delivery; Collect/Process/Show switches; remaining graphs/People/marketing/Work/Money; live Netlify Database binding/grants/recovery/retention; final combined-tree website review and physical devices. Do not call this full-suite green or release-ready.

## Assigned to B

Concrete content integration/playability for intended26pending IDs; complete public13-domain source/dependency inventory; website content/art/source alignment; per-item gameplay/voice/layout evidence. B branches from the uploaded A checkpoint and preserves A's shared control/runtime/API files. Exact ownership and integration order: TWO-CHAT-PLAN.md.

## CI observation at upload

Earlier exact-source draft run40793180243 reports completed/success for06483b71; its complete artifact audit still belongs to A and is not proof of the new runtime. New all=true run40814664317 targetsb4ad5beb (0409b5d9 runtime plus9efa00f6 catalogue and docs): https://github.com/nguyentuanphu/tpn/actions/runs/40814664317. It is queued/running, not yet a full pass. Inspect its actual artifacts/collector before claiming success.
