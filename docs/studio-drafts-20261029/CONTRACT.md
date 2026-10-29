# Draft contract and builder notes

## Identity, authority and permissions

Every draft has a server-generated UUID and monotonically increasing integer revision. Display names do not identify drafts. Scope is **global only**. Draft body is a validated full snapshot formed from the current configuration plus a rules or content proposal; the kind cannot change after creation. Draft reason is 3–600 characters. Actor identity comes from the authenticated Studio session.

All draft reads/writes require `management.configure` and the matching existing permission: `releases` for rules, `edit` for content. Lists filter out proposals of an unauthorised kind. `management.read`, legacy editor access, a hidden button, or a desktop key alone cannot grant draft access. Owner access uses the existing owner policy. No child names, identifiers or profile context are collected by this feature. Draft content is operator-authored configuration; operators must not put family data or secrets into it.

## API

All routes are under authenticated `/studio/api/management/`, `private, no-store`, GET or POST only. Existing request-body size and JSON validation apply.

| Route | Input / output | Effect |
|---|---|---|
| GET `drafts` | `{drafts:[...]}` newest first, maximum 100 | Private authorised proposals, including body and latest review; does not publish |
| GET `drafts/:uuid` | Latest draft | Permission checked against stored kind |
| POST `drafts` | `{id?,expectedRevision,baseRevision,kind,body,reason}` → saved draft | Creation uses expectedRevision 0. Existing UUID updates only at exact revision. Always resets review |
| POST `drafts/:uuid/review` | `{expectedRevision,effectiveHash}` → reviewed draft | Exact saved proposal acknowledged, creates immutable new draft revision |
| POST `drafts/:uuid/publish` | `{expectedRevision,effectiveHash}` → public configuration result | Exact reviewed proposal published once; reporting-installation cohort is calculated server-side at publication |

The client cannot supply a cohort, actor, approval status, public revision or arbitrary storage fields. Unknown keys fail validation. Rules/content validation reuses existing live cleaners and limits, and the UI displays the normalised proposal returned by Save.

## Record fields

| Field | Type / meaning / join |
|---|---|
| `id` | UUID, joins latest draft to immutable draft versions |
| `revision` | Positive integer; optimistic concurrency for every draft action |
| `scopeKey` | Literal `global`; no per-device or family targeting |
| `kind` | `rules` or `content`; fixes the required existing edit grant |
| `baseRevision` | Integer public config revision, 0 before first managed config |
| `baseHash` | SHA-256 of canonical baseline full body; catches legacy baseline drift even at revision 0 |
| `body` | Validated full proposed configuration; rules, festivals and content retain existing schema |
| `effectiveHash` | SHA-256 of canonical proposed full body; binds review to publication |
| `reason` | Bounded operator reason, retained in private proposal/change history |
| `actor`, `updatedAt` | Last draft author and UTC ISO timestamp; private metadata |
| `state` | `draft`, `reviewed`, `published`; saving invalidates review |
| `review` | Null or `{actor,at,effectiveHash,changedPaths,scope,websiteEffect,deviceEffect}` |
| `review.changedPaths` | Changed `releases.ID`, `festivals.ID`, `content.SECTION`; exact section difference, not device-effect proof |
| `publishedBy`, `publishedRevision`, `changeId` | On published drafts only; joins to existing global config version and change/audit/delivery evidence |

`websiteEffect=consumer-dependent`, `deviceEffect=after-fetch-and-consumer-recheck` explicitly preserve the limits of available evidence. UTC timestamps are stored; user-facing scheduling uses Australia/Sydney. Private draft history contains no real device cohort; only the existing private published change stores the fixed reporting-installation cohort.

## Transactions, conflict and recovery

Saving, reviewing and publishing hold advisory locks `config:global` and `draft:UUID` in the existing sorted-lock transaction mechanism. Publishing calls the same internal configuration writer within that transaction, avoiding nested transactions. The final computed configuration must match the reviewed hash, including if the legacy source changes between reads. Config changes, immutable versions, audits, projection job and the published draft commit together or all roll back.

Saving edits at a stale draft revision fails `draft_revision_conflict`. A changed public baseline fails `draft_baseline_conflict`; there is no automatic merge or rebase. Reload current settings and create a new proposal while consulting the old saved draft. The original proposal remains intact. An unpublished draft needs review; reviewed hash/revision mismatches fail closed. A published draft cannot be edited or published a second time.

Projection occurs after SQL commit. A failed/unconfirmed projector returns HTTP 202 and `pending_projection`; it does not falsely report device application or roll back a completed SQL publication. Retry pending publication through the existing bounded projection action. After an interrupted/uncertain write, reopen the saved draft and configuration history before repeating it; revision checks prevent a duplicate public configuration. A failed Save response before the server-generated UUID reaches the browser can leave a saved proposal; inspect the saved list before creating another.

## Storage and Netlify

Append-only migration **003-config-drafts.sql** adds `config_drafts` and `config_draft_versions` namespaces to the existing management records table. Migration 001/002 bytes remain unchanged. Draft-version inserts reject overwrites in both SQL and the synthetic memory adapter. No HTTP request runs migrations or provisions a service.

Use the owner's existing **Netlify Database** via context-specific `NETLIFY_DB_URL`. Development-only fallback remains `MANAGEMENT_DATABASE_URL`. No binding is present in this workspace. Test migration against an isolated local database and the intended Netlify preview database before any authorised production migration. Never copy production connection strings into preview or chat.

Reads retain the existing 10,000-record fail-closed storage bound, returning up to 100 drafts. Pagination/indexed draft listing, expiry/retention, deletion and operator audit-history UI are still pending before high-volume use. Immutable history is not automatically deleted in this slice. No scheduled job or unbounded background write is introduced.
