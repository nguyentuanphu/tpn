# Studio control recovery and delivery

29 October 2026 AEDT. Workstream A, `review/studio-finance-20261027`. This continues the [function controls](../studio-functions-20261029/README.md) and [two-chat ownership plan](../studio-item-workspaces-20261029/TWO-CHAT-PLAN.md).

Item and function workspaces now explain what to do when current settings cannot be loaded, another session changed a proposal, the published baseline changed, a reporting policy expired, access was lost, or a response disappeared. Failed requests never establish that a write was rolled back. Visible fields remain available for copying; Save, Review and Publish require a fresh workspace read after failure. Selecting an old proposal cannot bypass recovery.

Both workspaces link directly to the existing configuration history and device receipt view. That view now puts its receipt graph and saved-change history before the advanced JSON editor. A pending public projection is separate from successful publication and device acknowledgement. No new polling, telemetry, database tables, game downloads or background worker is introduced by this Studio-only change.

- [Step-by-step recovery journeys](CONTROL-JOURNEYS.md)
- [Item field connections](ITEM-FIELDS.md)
- [Machine-readable state contract](RECOVERY-STATES.json)
- [Actual screenshots](VISUALS.md)
- [Validation and remaining work](VALIDATION.md)
- [Next chat](NEXT-CHAT.md)

No deployment, version change, main merge, production SQL migration or payment action. Existing Netlify Database remains selected; the current environment reports no securely configured database binding. Workstream B's concrete content integrations and website alignment remain separate.
