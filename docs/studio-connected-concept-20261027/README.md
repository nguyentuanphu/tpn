# Studio connected concept: owner review handbook

27 October 2026 AEDT. **Concept and documentation only.** This expands the Owner’s Desk direction in response to the owner’s request for more graphs, richer user detail, understandable controls, and explicit website–Studio–game connections. It does not implement or deploy the redesign. All visual sample records are fictional.

The goal: open any number, person/device, content item or control and understand **what it is, where the information came from, what it connects to, what you can do, and what confirms the result**.

## Read and review

| Review question | Start here |
|---|---|
| What does the connected design look like? | [Visual walkthrough](VISUALS.md), or open the downloaded [interactive concept](review.html) in a browser |
| What should each area contain? | [Screen and user-detail specification](SCREENS.md) |
| What graphs do I get, and what do their numbers mean? | [26 graph contracts](GRAPHS.md) |
| What does each control change? | [17 control contracts](CONTROLS.md) |
| How do the website, game, Studio and stores connect? | [13 connection contracts](CONNECTIONS.md) |
| Which actual endpoints back those controls? | [Current API route map and missing routes](API-MAP.md) |
| Where does an individual field go? | [Field-by-field map](DATA-MAP.md), [searchable JSON register](registry.json), [CSV register](data-connections.csv) |
| How can a builder implement this without guessing? | [Build sequence and acceptance scenarios](BUILD-AND-ACCEPTANCE.md) |
| How does this relate to earlier work? | [Earlier foundation](https://github.com/nguyentuanphu/tpn/blob/a1f82e740e95bcd491f075980b8b891be79419e7/docs/studio-management-foundation/README.md), [current implementation record](https://github.com/nguyentuanphu/tpn/blob/a1f82e740e95bcd491f075980b8b891be79419e7/docs/studio-management-foundation/IMPLEMENTATION.md), [finance record](https://github.com/nguyentuanphu/tpn/blob/a1f82e740e95bcd491f075980b8b891be79419e7/docs/studio-management-foundation/FINANCE.md), [three initial directions](https://github.com/nguyentuanphu/tpn/blob/a1f82e740e95bcd491f075980b8b891be79419e7/docs/studio-redesign-concepts-20261027/README.md) |

The five main destinations remain **Today, People, Game & website, Work, Money**, with Settings separate. More graphs belong inside these areas and their selected-item details. Today stays a short decision page. We should not recreate the old confusion by putting every graph and control on the first screen.

## The connection pattern

![The three surfaces and their allowed connections](images/system.png)

There are two main directions:

1. **Information comes back:** the website reports aggregate engagement; the game reports permitted usage, problems and outcome observations; providers report service/run evidence; operators record financial documents. Private Studio views explain and join only compatible authorised records.
2. **Approved changes go out:** Studio creates a scoped draft/change; server validation and review determine what can publish; the website/game receive the appropriate approved content or configuration; public readback and device observations confirm different stages separately.

The website does not receive child names or finance data. Studio is not a substitute for the game’s local save authority. Existing Netlify Blobs, Netlify Database SQL, versioned source and local saves have different jobs; this concept does not silently move all data into one SQL table.

## More useful graphs, with a clear place for each

![Illustrative reporting and delivery graphs](images/graphs.png)

The full catalogue covers audience, devices, usage patterns, website engagement, activity outcomes, startup, smoothness, voice, connections, content review, releases, configuration delivery, problems, jobs, costs, budgets and qualified forecasts. Each graph names its calculation, data inputs, filters, drilldown and limitations. The illustration above demonstrates four selected graph forms; it is not a render of all 26 graphs.

Every graph needs a plain-language **“What this means”** link and **“Show source data”** action. Clicking a bar or point carries its permitted scope into the detail view. It does not silently narrow to a different date basis or execute a control. Numeric zero, no samples, unavailable data and collection disabled are different states.

## Richer user detail without false identity

![Person, installation, session and attempt relationships](images/identity.png)

The People page should show the reported child first name where enabled, linked device, language/age band, game version, last observation, reported play, relevant problems and delivery state. Open a record for deeper detail and a source/coverage explanation. Permissions determine which information is visible.

The unit is usually a **reported profile on an installation**, not a globally identified child. Existing statistics links and private family membership remain separate relationships. No automatic merging by name, browser characteristics or matching activity is allowed.

## Controls that explain their consequences

![How a proposed control connects to its result](images/control.png)

Every control must show: purpose, current value, selected scope, downstream game/website effect, when it takes effect, permission, validation, audit, failure handling and confirmation. Unsupported targeting is disabled with an explanation, not presented as working.

Example: **“Reading activities: On”** identifies the feature/rule, explains that the revisioned publication is currently global, previews the rule’s supported device selection if applicable, and shows the last public projection and reporting-device acknowledgements. Saved is not the same as available; a receipt is not proof every open screen has redrawn.

## How complete is the data map?

The register preserves **all 137 earlier management field-family entries** and adds separately labelled, enumerated current-code and proposed refinements. Refinements can explain the same underlying information more precisely; their count is not a claim of new data collection. The generated validation record gives the exact counts.

This revision has **279 entries: 137 historical field families, 122 current-code refinements and 20 proposed refinements**. It also places all 38 earlier metric definitions within the graph catalogue, while noting where current implementation semantics differ.

Each entry records its source, transport, storage, join rule, permission, proposed destination, graph/control connections, evidence status, privacy, missing-data rule and retention caveat. Historical baseline definitions remain historical. For example, current voice observations use `voice.result`; the original proposal used a different event label. Current receipt coverage matches the exact revision/hash; it does not automatically credit any later revision.

This is a management-relevant register. It is **not every leaf in every gameplay save, third-party provider payload or future form**. New implementation must extend the register when it adds fields; unregistered fields are not an invitation to collect everything. Retention durations, small-group suppression rules and financial/legal record obligations need explicit category decisions rather than invented defaults.

## Known gaps that the design makes visible

- Current website analytics are aggregate; they do not establish unique visitors or a particular child’s conversion. A future short-lived handoff is documented separately as proposed, not active.
- Global revisioned configuration exists in code; dedicated device/cohort publication and friendly specialised editors remain work.
- Rich user detail links, cross-graph filtering and all redesigned graphs need implementation and permission review.
- Recording coverage is not yet audited; an existing website anchor is not proof editorial content matches the game’s source.
- Finance is a manual ledger. True obligation due dates, complete company cash, bank feeds and approved revenue attribution must not be inferred from it.
- Live Netlify SQL binding, real-provider credentials, retention/deletion/recovery and physical-device checks remain separate activation/release work. Current source references are not production-readiness claims.

No game version, main branch, live service, family record or payment is changed by this handbook. The next review should walk through the connected prototype and difficult states before runtime migration begins.
