# Control contracts: purpose, scope, connection and confirmation

All redesigned controls are UX proposals. The backing-path column distinguishes current code from missing work. A control must expose **what it does, current value, selected scope, where it goes, when it takes effect and how to recover**. No proposed control bypasses server permissions.

## Standard control anatomy

Example (fictional): **Reading activities · On**. “Changes this feature rule in the global configuration. The rule may contain supported device selection; this is not a separate device-specific configuration publication. Devices must fetch the published revision. Existing open screens may need reopening.” Show current revision → draft changes → affected-surface preview → reason → Save/review action → saved/public readback/receipt state. Never display an unimplemented target selector as active.

## K01 · Filter and compare

- **Location:** Today / each graph.
- **What / selected scope:** Dates, build, device class, ordinary/test traffic; no write.
- **Connects to:** L01, L02, L03, L10 → Graph query only.
- **Available backing path:** Current reads; consistent cross-graph filter UI proposed.
- **Permission / validation:** Only filters supported by that source apply; unsupported filters must say so. Changing a filter never changes play.
- **Audit / recovery:** No audit for a view filter; retain Back state.
- **How the operator knows:** Inspect scope/time basis, sample size and coverage.

## K02 · Open person/device detail

- **Location:** People.
- **What / selected scope:** Selected installation and local profile context.
- **Connects to:** L01, L02, L11 → Private detail view.
- **Available backing path:** Current device/child reads; combined new layout proposed.
- **Permission / validation:** management.deviceDetail; separate family/photo grants still required.
- **Audit / recovery:** Read/access log; no data mutation.
- **How the operator knows:** Name unavailable/denied/last reported states; never merge on name.

## K03 · Change feature availability

- **Location:** Game & website / item.
- **What / selected scope:** Feature and explicit rules; publication scope currently global.
- **Connects to:** L04, L05, L06 → Approved config → public snapshot → applicable game clients.
- **Available backing path:** Current global revisioned write; friendly item editor proposed.
- **Permission / validation:** management.configure plus releases/content grant; validate expectedRevision. Proposed device/cohort projection not enabled.
- **Audit / recovery:** Reason, before/after, actor/revision; revert creates a new reviewed revision.
- **How the operator knows:** Saved/available/unconfirmed/applied shown separately; offline clients wait.

## K04 · Edit game/story public content

- **Location:** Game & website / item.
- **What / selected scope:** Selected field and EN/VI surfaces; show shared vs website-only.
- **Connects to:** L04 → Source draft → reviewed game/website build.
- **Available backing path:** Connected field editor/preview proposed; versioned source pipeline exists.
- **Permission / validation:** Existing edit/site/release permissions apply; field schema and supported write path must be inventoried.
- **Audit / recovery:** Draft revision, diff and affected-surface list; no silent publish.
- **How the operator knows:** Preview game and website; source lock must match reviewed release.

## K05 · Review recording

- **Location:** Game & website / item voice.
- **What / selected scope:** Selected static asset key/language/voice/source revision.
- **Connects to:** L04, L09 → Recording review → approved asset build.
- **Available backing path:** Contextual review proposed; existing voice tooling remains.
- **Permission / validation:** voices permission; generation credentials and billable action require appropriate authority.
- **Audit / recovery:** Asset hash/review evidence; generation does not publish by itself.
- **How the operator knows:** Not-audited/missing/failed/approved states; playback success alone is insufficient.

## K06 · Assign and update work

- **Location:** Work / problem.
- **What / selected scope:** Selected issue; owner, next action, state and evidence.
- **Connects to:** L07, L08 → Attention record + audit.
- **Available backing path:** Current follow-up write; new inspector proposed.
- **Permission / validation:** management.triage; expectedRevision; required deployment/verification evidence enforced.
- **Audit / recovery:** Actor, reason, revision; original tester status separate.
- **How the operator knows:** Conflict reload; denied write; missing evidence; inspect saved record.

## K07 · Review release

- **Location:** Work / release.
- **What / selected scope:** Exact commit/build and affected public surfaces.
- **Connects to:** L04, L09 → Approval gate → existing code/content release pipeline.
- **Available backing path:** Review concept; existing release approval policy remains.
- **Permission / validation:** Existing deploy/publish/site privileges and explicit owner approval for main/Netlify.
- **Audit / recovery:** Exact source, tests, known failures/retries and approval evidence.
- **How the operator knows:** Card movement and green mock charts never deploy; verify website and build independently.

## K08 · Inspect delivery / retry projection

- **Location:** Work / configuration change.
- **What / selected scope:** Selected revision; retry projects latest global config.
- **Connects to:** L05, L06, L09 → SQL job → conditional public snapshot; receipts later.
- **Available backing path:** Current service/project and bounded retry path.
- **Permission / validation:** management.configure; operations retry may also require operations.run.
- **Audit / recovery:** Durable operation and projection evidence; no blind resend after uncertain dispatch.
- **How the operator knows:** Readback match; failures remain pending; no receipt is unconfirmed.

## K09 · Preview and confirm invoice import

- **Location:** Money.
- **What / selected scope:** CSV rows, settings revision, original currency/source identity.
- **Connects to:** L10 → Preview → atomic ledger transaction.
- **Available backing path:** Current finance preview/commit; redesigned flow proposed.
- **Permission / validation:** finance.write; explicit currency setup; ≤200 rows/180k chars; strict source IDs.
- **Audit / recovery:** Preview hash, stable operationId, expected revisions; immutable corrections.
- **How the operator knows:** New/duplicate/correction/errors visible; lost acknowledgement retries same operation identity.

## K10 · Correct/void/reconcile a line

- **Location:** Money / invoice.
- **What / selected scope:** One source line and expected revision; reason.
- **Connects to:** L10 → New ledger version; original history preserved.
- **Available backing path:** Current finance commit path.
- **Permission / validation:** finance.write; settlement and currency constraints; linked commitments cannot be silently invalidated.
- **Audit / recovery:** New version + audit; never delete previous financial version.
- **How the operator knows:** Totals recomputed or unavailable; inspect history and coverage.

## K11 · Set budget / coverage

- **Location:** Money.
- **What / selected scope:** Month, minor units, reporting currency, coverageThrough.
- **Connects to:** L10 → Budget + audit → qualified finance summaries.
- **Available backing path:** Current budget write.
- **Permission / validation:** finance.write; no future coverage assertion; expectedRevision.
- **Audit / recovery:** Revision and reason; coverage is operator assertion, not verified provider ingestion.
- **How the operator knows:** Show coverage basis and how it enables/suppresses forecasts.

## K12 · Run bounded maintenance

- **Location:** Work / services.
- **What / selected scope:** Kind, selected inputs, operationId and scope.
- **Connects to:** L09 → Durable operation → permitted provider or database check.
- **Available backing path:** Current limited bot/db/read/projection operations.
- **Permission / validation:** operations.run plus required underlying bot/config permission; not arbitrary command execution.
- **Audit / recovery:** Audit and provider match; uncertain dispatch stays unknown.
- **How the operator knows:** Queued/running/terminal/unknown; refresh observes, it does not guarantee retry safety.

## K13 · Manage account access

- **Location:** Settings / access.
- **What / selected scope:** Named account and explicit grants.
- **Connects to:** L12 → Server account permission record.
- **Available backing path:** Existing access tools; redesigned screen proposed.
- **Permission / validation:** Account administration privilege; show effective permissions immediately for custom access.
- **Audit / recovery:** Record authorised access changes; revocation semantics documented per credential.
- **How the operator knows:** Device details, tester images, finance and family photos have separate boundaries.

## K14 · Change analytics/name reporting

- **Location:** Game grown-up settings; Studio displays observation.
- **What / selected scope:** That device’s analytics/reportNames choice.
- **Connects to:** L01, L02 → Local producer eligibility → future reports.
- **Available backing path:** Existing device setting; remote override not proposed.
- **Permission / validation:** Authorised local grown-up flow; Studio must respect opt-out.
- **Audit / recovery:** Opt-out is not retroactive deletion; deletion/retention workflow must be built separately.
- **How the operator knows:** Not collected ≠ zero. Existing retained data needs explicit lifecycle policy.

## K15 · Export records

- **Location:** Relevant area.
- **What / selected scope:** Selected permitted scope and explicit coverage.
- **Connects to:** L01, L02, L03, L10 → Authorised export artifact.
- **Available backing path:** Finance CSV exists; general snapshot export proposed.
- **Permission / validation:** Same server permissions as displayed data; never embed secrets or unrelated families.
- **Audit / recovery:** Record export scope/time and retention handling; CSV spreadsheet safety required.
- **How the operator knows:** Bounded scan limits explicit; no silent partial export labelled complete.

## K16 · Request deletion / recovery

- **Location:** Settings / data; authorised family detail.
- **What / selected scope:** Explicit data categories, identity, scope and consequences.
- **Connects to:** L01, L02, L07, L10, L11 → PROPOSED retention/deletion/restore workflow.
- **Available backing path:** Proposed; real-family detailed collection gate.
- **Permission / validation:** Separate authority per data class; legal/financial retention and backup obligations assessed.
- **Audit / recovery:** Preview affected stores, confirmation, job/evidence and exceptions; never silently remove saves.
- **How the operator knows:** Unknown backup coverage visible; restore drill required, not just a backup-result event.

## K17 · Enable optional website handoff measurement

- **Location:** Settings / collection.
- **What / selected scope:** Future short-lived handoff, purpose, opt-out and retention.
- **Connects to:** L13 → PROPOSED L13 → matched aggregate chart.
- **Available backing path:** Proposed only; no endpoint created.
- **Permission / validation:** Explicit collection design/security review; no child names in URLs, logs or public content.
- **Audit / recovery:** Document schema, expiry and deletion; aggregation must prevent small-group exposure.
- **How the operator knows:** Without this, G06 stays separate unmatched populations.

## Required states for every write

Loading; existing value; unsaved draft; invalid; permission denied; stale-revision conflict; request in flight; saved; downstream pending; confirmed downstream; failed; unknown after a lost acknowledgement. Preserve the draft after a recoverable error. For an uncertain non-idempotent provider request, observe before retrying. Destructive save/family actions still require explicit informed authority.

A future simulation control must say “Expected result from these rules” and list unknown device-local progress/cache inputs. It cannot say “This child can play now” without the necessary observed evidence. A future due-date control requires a real obligation schema; service period end is not a due date.
