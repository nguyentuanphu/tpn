# Sparkle Valley Studio — complete revamp handoff

This is the consolidated owner brief, design direction and implementation handoff. Studio is the centre of management for the game, website, service operations and recorded finances. It coordinates their separate authorities; it does not replace local saves, private family access, versioned source or provider records.

**Review on an iPhone:** [visual concept images](VISUALS.md). GitHub displays these as pictures. Do not open `concept.html` in GitHub expecting an application: GitHub displays HTML as source. The offline HTML is an optional interactive companion in the ZIP.

All new images are **future-design concepts with fictional example data**, not screenshots of implemented controls. Existing runtime screenshots remain in the included reference handbook.

[Download the complete handoff ZIP](Studio-revamp-complete-handoff.zip) · [Package size and SHA256](PACKAGE.json) · [Next-chat prompt](NEXT-CHAT.md). The ZIP contains the consolidated documents, detailed reference snapshots, static offline concept and pictures. It is not a deployable game/site bundle. The standalone PACKAGE.json is outside the archive to avoid a circular archive hash.

## Read in this order

1. [Visual concept](VISUALS.md): Home, People, content, Marketing, Work, Money and function switches.
2. [Master design](MASTER-DESIGN.md): full navigation, domain coverage and decisions.
3. [Done and pending](STATUS.md): exact implementation baseline and remaining work.
4. [Connections and field contract](CONNECTIONS.md): sources, routes, storage, joins, permissions and effects.
5. [Marketing and resource controls](MARKETING-AND-RESOURCES.md).
6. [Numbered build instructions](BUILD-STEPS.md), then [copy-paste takeover prompt](NEXT-CHAT.md).
7. `references/connected/`: existing 279-entry register, 26 graph definitions, 17 controls, 13 connection contracts and API map. Documentation counts are not implemented-feature counts.
8. `references/implementation/`: actual runtime/checkpoint evidence, route map and previous screenshots. `references/foundation/`: earlier foundation and finance contracts.

The machine-readable `concept.json` describes this proposal. `VALIDATION.json` records review of this artifact, not a production release certification. `MANIFEST.sha256` checks the files; `PACKAGE.json` gives ZIP provenance/hash outside the archive.

## Owner requirements retained

- Use actual game artwork, fonts, shared tokens and EN/VI support; stable understandable screens with accessible touch controls.
- Home provides a quick snapshot; details and more graphs live in contextual areas.
- Child first name stays associated with its reporting installation; no global identity merge by name.
- Cover all game and activity domains, website connections and real management controls, not only analytics.
- Finance is now in scope: recorded ledger, budgets, audit and meaningful cost reporting; payments are not authorised.
- Use existing Netlify Database. Native server `NETLIFY_DB_URL`; isolated development fallback `MANAGEMENT_DATABASE_URL`. No credentials in chat, source or artifact.
- Optional functions need independent collection, processing and visibility controls, measurable budgets and honest delivery states.
- Work with one agent. Do not merge main, deploy, bump version, provision paid services or delete/overwrite family data without relevant explicit authority.

This pack consolidates prior work rather than claiming every proposed function has been built. See STATUS.md before implementation.
