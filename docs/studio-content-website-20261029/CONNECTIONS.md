# Definitions, consumers and record boundaries

29 October 2026 AEDT. The public file manifest and import graph are in source-inventory.json and source-connections.json. Static/literal dynamic imports are evidence of references, not delivery or control effects. The explicit-declaration inventory remains under public-definitions/. Counts never combine definitions, runtime instances, private records or provider evidence into a readiness percentage.

| Domain | Public source and real consumer path | Records / remaining boundary |
|---|---|---|
| Games and learning | games/catalog.ts → games/all.ts → registry/frame.ts; content/activities.ts supplies area/age/difficulty; content/unlocks.ts checks secondset and profile wins; main.ts updates completion | Catalogue discovery is distinct from launching/finishing. This branch's art evidence is in browser-validation and progress-validation, not inferred from metadata |
| Stories | learn.ts + talesdata.ts → tales.ts theatre; chapters/story modules supply progression; website story and quest sections use reviewed snapshots | Family-authored stories/questions are separate private content; no extraction of their records |
| Quests and missions | data.js/story.js; content/chapters.ts, adventures.js, familymissions.js and jobs.js → their game consumers → quest-snapshot.json → full bilingual guides | Definitions are enumerable; a device's selected/current quest and job instance are save/runtime state |
| Rewards/economy/unlocks | content/shop.js, stickers.js, adventures.js WEEK_PRIZES, games/registry.ts SKILLS and content/unlocks.ts → caller rewards/save → reward-snapshot.json and reward-content.mjs | Stars, local coins and actual paid money are distinct; no revenue claim. Item On does not grant progress prerequisites |
| Festivals/schedules | content/festcal.js + festival-visibility.ts → festivals.ts/festival-live.ts → public festival projection; home/festivals.ts applies that public projection | This is a real website live consumer. It is not evidence that generic item availability rewrites all static guides |
| World/transport | content/map.js and concrete world/region/vehicle modules → runtime world creation and interactions | Stable definitions and source builders are listed; generated NPC/building/road instances are not individually enumerated or remotely edited here |
| Multiplayer/social | games/shared-board-session.ts and net/relay/family modules → session transport / private family service | Session seats, pairings, photos and recovery credentials are private/runtime records; no public participant inventory or identity join |
| Voice/media | art.ts + bundled fonts; voices manifest-en/vi + packhash/voice modules → game rendering/playback; website uses the same immutable source's artSVG/fonts | Manifest membership is not audible playback. New line gaps are in VOICE.md. Family recordings/photos are not scanned |
| Website/marketing | reviewed source → refresh-quest-snapshot/build-preview/art-content/navigation → tools/build-website.mts → home/index.html; home/site/analytics handle optional standalone observations | Embedded observations are disabled by existing code. No child name/device identifier is added to marketing. A Play click does not prove game start, attendance or conversion |
| People/devices | players/management telemetry and hello-clean → protected management/read | Public schemas are inventoried; actual installation/profile records are excluded. A first name is installation-associated, not a global person key |
| Quality/releases | workflows + build/version/sw source → tests/CI and approved release packaging | Tests, exact source, deployed build and device observations stay separate. No version changes or main merge in B |
| Services/operations | netlify functions + management connection/operations source → protected services | Source bindings do not prove a live provider is configured or healthy. No credentials, production migration or paid provisioning used |
| Finance | management/finance, finance-values/import and transactional schema → private manual ledger/service | Invoice evidence, balances, budgets, payments and provider costs are not enumerable public content. No payment or reconciliation of real records performed |

## Art guide alignment

`art-content.mjs` extracts names, age/difficulty, second-set membership and icons from the same immutable source selected for the three existing website snapshots. It fails for missing art or metadata. Its reviewed mode descriptions explain actual tools and completion: twelve marks, then Keep in Album, newest twelve local pictures. Open-ended guide painting is not described as a scored puzzle, physical craft simulation, paid prize or remote upload. Details deep-link as `/home/#art-ID` under Play & Learn; top-level destinations remain Discover, Play & Learn, Guides & Rewards, For Parents.

Management export uses each actual `art-ID` anchor when present, preserving the existing typed keys, schema version, catalogued/declared-only discovery, source hashes, guide alignment and unlock dependencies. An anchor's existence is only a link check. The global game-review-lock.json is unchanged: A's pending shared changes still need combined editorial/art review. B's scoped review records source hashes and actual screenshots; it cannot make the combined drift gate green.

## Availability contract

Individual item Off is read by the existing shared launch boundary after the public configuration reaches the device. Active activities can finish; offline devices retain their last fetched configuration. Item On does not override a held group, a schedule or progress requirements. Simple-screen Hide only removes that listing. Private draft Save, approved publication, public projection, device receipt and actual entry blocking are distinct steps owned by A. The static art guide explains these limits and does not call private endpoints or infer current device availability. Existing festival live projection is a separate supported website consumer.

## Integration requests for A

No shared runtime change is needed for the twenty-two integrated items. Keep the four pending IDs declared-only and disabled for enable in Studio. Review any future intentional implementation of those four before moving them to the real catalogue. Retain the shared gate implementation unchanged. Regenerate management facts after combining branches; review website explanations/art against the combined source before updating the global fingerprint lock. Do not reuse frozen historical ZIPs as current runtime evidence.
