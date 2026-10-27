# Studio Owner’s Desk — implementation checkpoint

**Latest consolidated design/handoff:** [complete revamp pack](../studio-revamp-master-20261027/README.md), including iPhone-viewable concept images, done/pending status, marketing and optional-function controls, refreshed comprehensive CI evidence and numbered build steps. This original implementation report remains the runtime checkpoint record.

27 October 2026 AEDT. The owner approved proceeding with the connected concept and required the game’s artwork and visual consistency. The owner then requested one hour of work, packaging/upload and a next-chat handoff. Work stays on `review/studio-finance-20261027`; no main merge, deployment or version bump.

This is the first runtime slice of the [connected concept](https://github.com/nguyentuanphu/tpn/blob/993e5a06e50311e835e1c2e92aa7f0d47e4448c6/docs/studio-connected-concept-20261027/README.md), not completion of every proposed graph/editor. It uses actual authenticated Studio routes; review screenshots contain synthetic records only.

## Implemented in this slice

- Five main destinations: **Today, People, Game & website, Work, Money**. Settings is a separate header control. Existing tool routes remain reachable in their corresponding area; old deep-link prefixes still resolve.
- Studio reads the game’s colour tokens from `/studio/game/css/style.css` without importing the game’s canvas layout. It reuses `/studio/game/css/fonts.css`, the existing illustrated-art renderer and actual valley launch artwork. The light theme follows the current game palette; status text uses darker mixes of the same tokens for readability.
- Today shows one decision, quiet source-backed summary figures, an audience graph and recent reports. Inventory counts no longer dominate the home page.
- People connects reported first names with installations, a scoped history graph, permitted problem evidence and current global configuration delivery. Names never become global identity keys. Summary-only accounts cannot read child details or Money.
- Game & website provides a searchable source-backed catalogue, preserves `kind:id` when opening detail, and displays website event counts and guide review evidence. Catalogue search actually hides unmatched entries; the first view is bounded to 12 matches.
- Work provides a report queue, an explanation of the review/release chain and links to existing triage/configuration/operations/testing tools. No drag-to-deploy or automatic approval is introduced.
- Money opens the existing exact-value ledger with a budget/cost/commitment graph and three quiet headline measures. Additional financial measures remain available in a named expandable section. Existing preview/commit, immutable correction/history and permissions are retained.
- Shared graphs provide definitions, source references and accessible data tables. Missing retained days remain null and visibly break lines. Negative finance values keep their sign. Filters and the originating view are restored when returning from a selected device/activity.
- Desktop executable packaging now includes the new UI modules/styles and the existing Finance module. This is a packaging-definition change, not physical Windows verification.

Unlinked desktop Studio explains that reporting requires a scoped Studio key and does not issue doomed reporting requests. Money is online-only under the current key contract; existing desktop keys do not acquire Finance permission. The five main destinations describe the fully authorised online view; accounts/modes show only their available areas.

## Graphs now connected

| Concept | Runtime view | Source |
|---|---|---|
| G01 Reporting audience | Today / People | Existing permitted usage → new dailySeries in overview |
| G02 Device mix | People | Returned device page, explicitly capped at 100 records |
| G04 Reported device play | Device detail | Device-scoped dailySeries |
| G05 Website engagement | Game & website | Existing aggregate M13/M14; not a visitor-to-child funnel |
| G15 Catalogue review evidence | Game & website | Verified guide anchor vs source alignment; recordings remain not-audited |
| G17 Configuration coverage | Configuration history | Exact revision/hash cohort receipt counts |
| G21 Budget/cost/commitments | Money | Existing server finance summary; integer minor units and incomplete-source caveats |

The other graph concepts, full contextual editors, mature cohorts, new website handoff, new obligation due dates, full route migration and advanced targeting remain work. Existing specialised editors still have their earlier revisioned-publication limitations. This checkpoint does not imply every old screen has been redesigned.

## New read contracts

| Field / route | Exact source and storage | Consumer and interpretation |
|---|---|---|
| overview.dailySeries[].date | Existing selected `d/<device-day>/<installation>` records | G01; original device-local date, not UTC event session |
| dailySeries[].reportingBuckets | Number of selected retained device-day buckets | Coverage indicator; zero buckets means unknown activity |
| dailySeries[].activeDevices | Distinct selected installations with minutes, game starts or story opens; null with no bucket | Daily distinct count, not globally unique children; do not sum daily distincts into monthly distincts |
| dailySeries[].mins / errors | Selected accepted bucket sums; null with no bucket | Device/play/error graphs; not total screen time or confirmed crash incidence |
| devices/:id.dailySeries | Same calculation restricted to selected installation | G04; never includes another installation’s minutes |
| devices/:id.relatedIssues | Existing tester records whose stored device list contains the selected ID, within the report period | Requires actual tester-source permission; capped lists can hide associations; returned list capped at 20 |
| devices/:id.delivery.target | SQL `configs/global` and matching `projection_jobs/global` | Current global revision/hash/public availability, independent of selected historical activity period; no body/actor/audit projected |
| devices/:id.delivery.receipt | SQL `receipts` key for selected installation + global revision; exact hash match | That installation’s reported persistence or rejection; no other installation’s receipt is returned |

Existing HTTP private-detail gates remain enforced before device reads. Missing SQL/feed access remains unavailable. No schema migration is needed for these additive read fields: they reuse the existing SQL namespaces and reporting stores. Existing Netlify Database/native `NETLIFY_DB_URL` remains the selected server SQL binding; no live binding is available in this workspace.

## Files and implementation ownership

| Area | Files |
|---|---|
| Routing, permissions, shared navigation, back context | `studio/ui/app.ts` |
| Game palette bridge | `studio/ui/brand.ts` |
| Connected landing views | `studio/ui/owner-desk.ts`, `owner-desk.css` |
| Accessible charts | `studio/ui/desk-charts.ts` |
| Device/delivery detail and contextual tools | `studio/ui/management.ts` |
| Finance presentation | `studio/ui/finance.ts` |
| Daily series and permitted issue association | `netlify/lib/management/read.mts` |
| Current-device receipt lookup | `netlify/lib/management/transactional/service.mts`, `http.mts` |
| Browser integration and regression | `tests/owner-desk-browser.mjs`, `tests/management-browser.mjs`, related unit checks |
| Desktop asset packaging | `studio/build-exe.sh` |

## Validation and next work

[Optional functions and resource-control design](FUNCTION-SWITCHES.md) specifies independent collection, processing and visibility switches, parent-permission precedence, offline delivery limits and numbered implementation/acceptance steps. It is proposed work, not a newly implemented control panel.

See [VALIDATION.md](VALIDATION.md) for exact results and limitations, [GALLERY.md](GALLERY.md) for desktop/tablet/phone screenshots, and [NEXT-CHAT.md](NEXT-CHAT.md) for the copy-paste takeover prompt. All screenshot records are fictional; browser emulation does not replace physical-device/Windows checks.

Repository downloads: [review handbook and screenshots](Studio-owner-review.zip) (about14MB), [cumulative source checkpoint](Studio-source-checkpoint.zip) (about82MB). The source ZIP is an overlay for the released v1.02 base, not a deployable site ZIP; the review branch is the preferred way to resume. [Package hashes and current run observation](DELIVERY.json) distinguish the packaged snapshots from later status updates. Archives intentionally omit nested ZIP copies and unchanged base media.

[ROUTE-MAP.md](ROUTE-MAP.md) inventories all45 retained/new page keys. Source runtime checkpoint: **35bcb63c0c9682bb9d32885063c8b7dc7b3c86df**. Comprehensive run: [40500953581](https://github.com/nguyentuanphu/tpn/actions/runs/40500953581). Read its observed status in the final delivery notes; a run link is not a green result.

The public game version stays v1.02. No invoice payment, paid service, production database migration, family-save overwrite, new detailed-family activation or deployment is authorised by this checkpoint.
