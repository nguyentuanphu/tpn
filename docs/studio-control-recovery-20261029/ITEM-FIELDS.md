# Exact item field connections

These are the fields implemented by workstream A. The source catalogue is a static reviewed inventory, not an assertion that every item is playable. Declared-only games have no enable editor until integration exists. The website is static reviewed content; publication does not rewrite its guide.

| Visible field | Private request | Published configuration | Actual game consumer/effect | Website effect |
|---|---|---|---|---|
| Allow new starts | `enabled` boolean | `content.itemAvailability["game:<id>" or "story:<id>"]` | `js/custom.ts` lookup; games use shared `canStartGame` plus `js/games/frame.ts`; stories use shelf/read entry and `js/tales.ts` theatre guard. Explicit Off blocks new starts, preserves progress; open activities can finish | No automatic guide rewrite |
| Simple-screen placement | `hide` boolean, games only | `content.activities[id].hide` | Simple-screen listing filter in `js/content/activities.ts`; does not globally disable the game | No automatic change |
| Simple-screen area | `area`: one approved area or null | `content.activities[id].area` | Simple-screen category placement; shared launch eligibility keeps the canonical original category for release/progress rules | No automatic change |
| Under-5 listing | `little`: boolean or null | `content.activities[id].little` | Simple-screen listing only. Does not rewrite difficulty, rewards, age, parental permission or implementation | No automatic change |
| Reason | `reason`: 3–600 characters | Private draft/configuration history | Audit evidence, no gameplay effect | Not projected |
| Saved proposal | `id`, `expectedRevision` | Private draft/version namespaces | Revision conflict checks; selecting it does not publish | None |
| Current baseline | `baseRevision`, server-derived baseline hash | Private draft reference to global configuration | Rejects stale saves/reviews/publications | None |
| Review token | `expectedRevision`, `effectiveHash` | Private recorded review | Publication must match the exact reviewed version/hash | None |

Request route: `POST management/items/<encoded kind:id>/draft`. The server builds the narrow content change in `netlify/lib/management/items.mts`; callers cannot provide arbitrary content or change draft workspace. Draft review/publication uses `management/drafts/<id>/review` and `/publish` with existing transaction locks. Effective settings are read by `GET management/items/<encoded kind:id>`.

The value null means use the game default for placement/under-5 fields. Item availability defaults to allowed when absent, subject to every other gate. On never supplies missing code or bypasses group release rules, earned prerequisites, the parent's choices, or a held `newGames` release. An explicit Off wins over remembered-use/admin access at the selected shared boundaries.

Global publication writes the existing SQL configuration change and snapshot, projects it through the existing Netlify live-content mechanism, and supplies revision/hash metadata. Devices fetch on their existing lifecycle; there is no new real-time push. Offline clients retain their previous fetched settings. Delivery cohorts contain reporting installations known at save, not every child/customer/device in existence. Optional receipts can remain unavailable after reporting stops.

The five detailed-reporting fields and their independent Collect/Process/Show consumers remain in the [function contract](../studio-functions-20261029/CONTRACT.md). Those switches do not change these item fields.
