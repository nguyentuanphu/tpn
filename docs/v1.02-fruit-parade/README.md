# v1.02 Fruit Parade and Trồng Nụ work in progress

Owner's [screen-only design](../cores/tasks/fruit-parade-owner-reference-20261025.md) and [implementation plan](../cores/tasks/fruit-parade-v1.02.md). Branch `work/v1.02-fruit-parade`, based on the collected audit at dfd46bb7. Not approved for deployment.

Implemented in TypeScript: pure deterministic mission engine, explicit symbol/wildcard/adventure configuration, age adaptation, bounded replay-safe actions, a session-host authority adapter, offline solo/NPC/local co-op rendering, three moving rows per player, original SVG art, 64px controls, calm picture selection, scoped keyboard/controller input and cleanup. Session authority validates seat, lane, round, attempt and bounded client lane-step input. It is not a new trusted backend or an anti-cheat timing service. Future music/number/colour/seasonal modes are extension work, not finished games.

The host commits shared symbols, progress, results and transitions; guests reconstruct the host's committed tape after loss/reordering. Each advertised seat receives three lanes. Reconnection retains the current board and offers local/NPC continuation after 30 seconds. The existing frame owns saves/rewards and the existing encrypted transport owns identities/invitations. Adventure results publish an adopted event; they do not falsely award unimplemented world activities or inventory.

Trồng Nụ now depicts feet and hand-buds rising through four stages for a jumper, replacing the incorrect seed/water/sun activity. This is a gentle virtual adaptation of Trồng Nụ Trồng Hoa. Under-five and calm modes have no timing penalty. The drawing was enlarged again after the first phone review; fresh captures are pending for that refinement.

## Verified so far

- Twelve Fruit Parade engine/legacy/protocol unit cases pass, including four participants, duplicate/stale/future rejection, wildcard use, shared outcomes, lost request/commit replay and offline continuation.
- Complete unit suite: 260 passed, one legacy skip. Project types pass, architecture/preload pass. The copied reference initially tripped the no-phone-emoji docs check; symbols were transcribed as names, and the unchanged check now passes.
- Real phone browser: two-player co-op completes both missions, all 13 controls measure at least 64px, progress is saved once, no page errors.
- Trồng Nụ completes four real UI jumps. Twelve EN/VI device captures exist for both games; refined larger Trồng Nụ captures will replace the first version.

NPC, keyboard/controller, two-browser completion and reconnect checks passed before the final offline/reconnect-choice extension. Existing netgames/friendstab and swupdate/offline checks pass. Still required: final extended browser check, fresh screenshot inspection after refinements, strict engine/session/type checks after final changes, website source sync, voice delta, and final GitHub regression of this rewrite. The running audit PR #580 suite checks the earlier baseline, not this working tree. Other helper-game blockers are listed in [the independent audit](../v1.02-audit/REPORT.md).

Lê Minh recording is separate: the first job stopped after 1,580 clips on HTTP 401. A one-clip diagnostic succeeded with the unchanged secret; resumed job 40175822783 has completed shards 0–2 and is recording shard 3. No API key is stored here, and the default voice has not changed.
