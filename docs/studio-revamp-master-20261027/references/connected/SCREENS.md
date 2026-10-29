# Screen concepts and richer People detail

The owner’s requested graphs and detail belong in a consistent product structure. This is a design specification; the exact route migration and missing backend fields still need implementation. Use the existing shared-shell/accessibility rules in the design handbook, not a separate incompatible widget system.

## Screen inventory

| Destination | First view | Selected-item view | Supporting graphs | Primary action |
|---|---|---|---|---|
| Today | One decision, short queue, compact trend and data coverage | Open the relevant record | G01 plus a selected experience/cost summary | Review the most important item |
| People | Searchable reported profiles/devices; clear unit; optional group charts | Profile-on-device detail, relevant permitted observations and reports | G01–G04, relevant G16–G18 | Open a device/problem |
| Game & website | Content list and website performance section | One game/story/page with game, website, availability, media and review sections | G05–G09, G14–G15 | Save draft / request review, appropriate to stage |
| Work | Ordered work queue, optional board, release and service sections | One problem/change/release/run with evidence | G10–G13, G16–G19, G26 | Assign next action / review evidence |
| Money | Coverage, recorded costs/income, budget and obligations | Invoice/import/budget/commitment with immutable history | G20–G25 where inputs support them | Review import or unresolved line |
| Settings | Access, connections, collection and data lifecycle | One account/service/policy | Status and freshness, not vanity counts | Review selected setting |

Each list preserves query, filters and scroll when returning from a detail. Use ordinary pages for sustained editing; a focused inspector can serve brief review. Do not nest drawers, tabs and modal confirmations into several competing navigation layers.

## People: who the owner is looking at

Always identify the record’s unit near its title: **“Reported profile on this installation”**. A first name helps the owner recognise a record but is not its identity key. Synthetic screenshots may use “Demo Linh — family tablet”; they must never imply an actual family record exists.

Legacy profile counters can contain a sanitised fallback key derived from a name when a proper profile ID was absent. Keep that provenance and possible ambiguity visible; do not retrospectively treat the fallback as a proven durable identity. New detailed events carry the explicit installation-local profile ID where permitted.

| Group | Fields to show | Meaning / exact connection | State and authority |
|---|---|---|---|
| Header | Reported first name, local profile key, linked installation, optional proposed device nickname | KID-01/02, ID-01; EV-15/16/17 where detailed reporting permitted | Hide name when disabled/denied; same name does not merge records |
| Device | Class, OS, browser, screen, observed PWA mode | ID-08–12 through L01 | Browser observations, not permanent hardware identification |
| Observation | First retained and last accepted observation, language, version, source freshness | Existing read observations plus proposed UX fields | Label first observed, not account signup; last report is not live presence |
| Use | Reported minutes, Simple-screen time, activities, stories, places, device-local pattern | DAY/KID through L01; detailed attempts through L02 separately | No inferred learning score, precise replay or total screen-time claim |
| Experience | Available FPS/startup/error evidence; reportable boot/join/voice/update/backup outcomes | G10–G14/G26 | Missing unsupported measurements remain unavailable |
| Problems | Relevant issue key/build/context, original permitted report, separate follow-up | L07/L08; ISSUE fields | Private tester text/images require testers access |
| Changes | Intended applicable revision, public availability, matching receipt, unconfirmed state | L05/L06; CFG and RCPT fields | New read-model linkage is proposed; do not simulate a real device state |
| Relationships | Explicit statistics association or authorised family membership | PRIVATE-03/06, ID-13 | Distinct relationships; no photo access from analytics hash |
| Lifecycle | Collection choice, coverage, retention/deletion request status | K14/K16 and proposed UX fields | Retention/deletion implementation remains a prerequisite for detailed real-family activation |
| History | Source-backed observations and work/change events | Compatible retained timestamps and references only | Daily counters cannot become an invented exact chronological play log |

Do not collect date of birth, home address, GPS, contacts, passwords, raw speech, message transcripts or full save contents merely to make this page richer. Current under-5/older grouping is an age band, not a verified age. Business users, family members, child profiles and website visitors are separate entities.

## Graph interaction and scope

1. Owner chooses a period and supported filters. Display applicable scope at the top and beside each source with a different basis.
2. Selecting a graph bar/point opens its corresponding permitted list or selected item.
3. Detail repeats the source unit, time basis and limitations; it retains a Back link.
4. “Show data” provides an accessible table with the same filters and missing-data state.
5. “Explain this graph” names the formula, denominator, source freshness and known gaps.
6. An authorised edit appears only in the relevant record. Selecting a graph point never triggers a write.

Current query support is not identical across sources: detailed event summaries cannot currently satisfy every child/device-class filter accepted by legacy views. An unsupported combination must say “Not available for this filter”, or show a clearly separate broader scope. Never display an unfiltered aggregate under a child-selected title.

## One content editor that connects both public surfaces

The header identifies `kind:id`, source commit, public build and draft state. Overview shows what is editable and where it appears. The editor offers game content, related website content, availability, voice/media and review. These are sections of one item, not another global menu.

Before saving, list each changed field and affected surface. Shared structured facts regenerate from their actual source; editorial descriptions and recordings require actual review. A field dependency map must be established before promising an automatic update. Family-authored private stories/photos do not become public catalogue entries by being displayed in Studio.

Preview must expose EN/VI gaps, missing assets, unsupported settings and website-source drift. Never label a preview “Live”. Save draft, request review, publish public content and deploy game code are different capabilities and permissions.

## Desktop, tablet, phone and accessibility

One sidebar on desktop; compact navigation on tablet; five short main destinations on phone with Settings accessible separately. At narrow widths, charts stack and keep readable units/labels. A wide detailed table scrolls inside its own labelled region or becomes record cards; the page itself should not overflow horizontally.

Adult actions have at least 44 px targets. Preserve readable EN/VI, visible keyboard focus, text status labels, clear errors and predictable Back/Close. Charts need table alternatives and keyboard drilldown. Respect reduced motion; avoid recentering or moving shells as content loads. Essential scope/consequence explanations remain visible without hover.

## Data-state vocabulary

| State | Meaning |
|---|---|
| 0 | Valid source/query confirmed no accepted matching observations |
| No samples | No eligible measurements; a rate is undefined |
| Not collected | Known collection choice/capability prevented observation |
| Unknown | Information does not establish the answer |
| Unavailable | Source/query failed or cannot currently support the request |
| Stale | Last known observation is older than a defined source-specific freshness rule |
| Saved | Private transaction committed |
| Available | Public snapshot read back at the expected revision/hash |
| Applied | Client reports persisting the matching revision/hash |
| Unconfirmed | Required downstream observation has not arrived |
| Verified | Named verification evidence meets the relevant work/release definition |

Status colour always accompanies these words. A missing provider feed cannot become a green service badge. A stale device cannot automatically become a confirmed failed update.
