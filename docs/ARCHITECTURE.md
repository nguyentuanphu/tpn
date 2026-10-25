# Sparkle Valley — Architecture (authoritative contract)

**Status:** v1.0 · written in round 30 (build r37) · **documented and reviewed; no rewrite started.**

**Who reads this:** every development chat, human or AI, before changing code.

**How it relates to the other documents:**

| Document | What it holds |
|---|---|
| `HANDOFF.md` | How to run, deploy and test, and the owner's ground rules |
| `docs/SO-TAY-THIET-KE.md` | Design handbook: what the game looks and feels like |
| **This file** | How the code is organised, how systems talk, which rules are hard, and how we get there |

If they disagree:
- the owner's ground rules (HANDOFF §0) win;
- then the hard rules here (§9);
- then the rest.

**Tags used throughout:**

| Tag | Meaning |
|---|---|
| **[REQ]** | An existing requirement (approved by the owner; cited) |
| **[IMPL]** | What the code does today (r37) |
| **[PROP]** | The proposed architecture (this document decides it) |
| **[IMPR]** | A proposed improvement, which needs a migration step (§12) |
| **[OPEN]** | Unresolved: the owner decides. Never build an [OPEN] item without asking (HANDOFF rule 14) |

Nothing tagged [PROP] or [IMPR] adds a game feature. It only reorganises how existing, approved behaviour is built. New requirements are not invented here. Where the architecture needs a decision about behaviour, it is listed as [OPEN].

---

## 1. Architectural assessment

### 1.1 What exists [IMPL] (measured, r37)

| Fact | Value |
|---|---|
| Game code | 86 ES modules, ~1.6 MB of JavaScript (lines are long: `main.js` 107 KB, `ui.js` 109 KB, `world.js` 82 KB, `cities.js` 63 KB) |
| Build step | None. three.js r160, PeerJS (online only), Web Audio, Web Speech, IndexedDB, Cache API, service worker |
| Server pieces | 2 Netlify Functions (`hello`, `studio`) + Netlify Blobs; Sparkle Studio (Node, exe + online) sharing `studio/core.cts` |
| Shared mutable "god object" | `G`: about **95 members assigned in `main.js`** (functions, state, sub-systems: `G.heroes`, `G.npcs`, `G.dialog`, `G.give`, `G.ferries`…) and passed to almost every module |
| Shared mutable world | `world`/`W` from `createWorld()`: arrays every feature pushes into. **Feature modules write into each other's world:** `colliders.push` 68× in 18 files, `boxes.push` 14× in 9, `interactables.push` 56× in 23, `updaters.push` 65× in 24, `scene.add` 201× in 29, `heightAt()` 220× in 26 |
| Static world data | Module-level constants in `world.js`: `CITIES`, `ROADS`, `RIVER`, `VILLAGE`, `TOWN`, `MARKET`, `AUSSIE`, `SHRINES`, `TOWERS`, `FLATS`/`LEVELS`, `FOOTPRINTS` (filled at runtime) |
| Import cycles | 5: `games/frame ↔ howto`, `ui ↔ fun`, `ui ↔ snacks`, `regions → ui → snacks → regions` |
| Dead modules | None: every module is reachable from `index.html` |
| Tests | 20 browser checks (`tests/run.mjs`, Playwright), desktop + phone; strong at end-to-end; almost no unit tests; world rules checked in the browser after full startup |
| Persistence | `localStorage` (`sv2_settings`, `sv2_profiles`, `sv2_farm`, plus caches) with mirrored safe copies in IndexedDB and the Cache API; backup files carry `v: 2`; no formal migrations |
| Identifiers | Some stable (`CITIES[].id`, landmark ids, interactable ids like `'apple'+i`, voice hashes); most world objects have **no identity** beyond a mesh, a collider and an index |

### 1.2 What works well (keep)

1. **Deterministic, data-first world description.** Places and roads are data (`CITIES`, `ROADS`), and the terrain is a pure function (`heightAt`). This is the right seed for a generation layer.
2. **No build step, plain modules, offline PWA.** These suit the owner's workflow and the device mix. A heavy engine or framework rewrite is not justified.
3. **Behaviour-level regression suite on desktop + phone,** with world-rule checks (`flat`, `roads`, `roadshape`, `ground`, `solid`, `voice`, `studio`). Bugs are caught as behaviour, not style.
4. **A shared mini-game frame** (`js/games/frame.js`, `GAMES` registry) giving 67 games one shell.
5. **Strict separation where it already exists:**
   - the voice pack by content hash (`packhash.js`);
   - the family content pack (`custom.js`);
   - the Studio engine shared by the exe and online (`studio/core.cts`).

### 1.3 Structural problems (why the architecture must change)

| # | Problem | Consequence seen in practice |
|---|---|---|
| P1 | **Generation, simulation and rendering are one step.** A `createX(G)` call computes placement, builds meshes, registers colliders, interactables and updaters all at once | World rules can only be checked after a full 3D start (minutes in tests); the world can't be validated or regenerated without three.js; the Studio has to open the game in a hidden iframe to know what is where |
| P2 | **Hand-placed coordinates in ~26 files**, each calling `heightAt` itself | Moving a road broke things in other files (round 30: a shrine pillar ended up on the moved India road; round 29: a bridge bank filled the river) |
| P3 | **God object `G` and open shared arrays** | Any module can change anything; ownership is unclear; order of creation matters silently (e.g. `levelUnderBuildings` must run after every builder) |
| P4 | **No entity identity** | Save, net, Studio edits and tests refer to things by position or index; "move/remove inside a circle" is the only Studio edit possible |
| P5 | **No event model** | Cross-feature reactions are direct calls through `G` (e.g. stickers, passport, quests, counting players), so features know about each other |
| P6 | **UI owns some gameplay flow** | `ui.js` (109 KB) both renders and decides (e.g. menu actions changing profiles or coins directly); import cycles with gameplay modules |
| P7 | **Save format informal** | One blob per area, no schema version per section, no migration tests |
| P8 | **Hard rules in prose, checks spread out** | Rule names differ between documents (G1, R5, "rule 10"); there is no registry linking a rule to its check |

**Verdict:**
- **Keep** the stack, the data-first world idea, the mini-game frame and the test suite.
- **Restructure** the core into layers with:
  - a pure **WorldData** model produced by a deterministic **generator** and checked by a **validator**;
  - an **entity registry** with stable identifiers;
  - **services with contracts** instead of `G`;
  - a small **event bus**.
- Migrate **incrementally, behind the existing tests**: no big-bang rewrite (§12).

---

## 2. Proposed architecture [PROP]

### 2.1 Layers

```
L5 APP          boot · lifecycle · game loop · wiring (the only place that knows every system)
L4 PRESENTATION render (three.js) · ui (DOM) · audio playback · input devices · camera
L3 RUNTIME      world runtime · collision · navigation · entities (npc, animal, vehicle, ferry) · player ·
                interaction · activities/minigames · economy/inventory · progress/quests · save · net · voice logic
L2 GENERATION   terrain · road network · placement solver · levelling · validator   (pure, deterministic, no DOM/three)
L1 CONTENT      catalogues and specs: places, roads, building types, NPC/animal defs, tales, words, strings, rules
L0 CORE         ids · events · rng · math/geometry · result/errors · config · logging
```

**Layer rules (enforced by the `arch` check, §10):**
- **ARCH-001:** a module may import only from its own layer or lower ones. Upward imports are prohibited.
- **ARCH-002:** L0–L2 never touch `window`, `document`, three.js, `localStorage` or the network. They run in Node, which is how they get unit tests.
- **ARCH-003:** L3 owns gameplay state. L4 reads it through queries and events and sends player intent as commands; L4 is never the authority.
- **ARCH-004:** a feature system never writes another system's state. It calls that system's public interface or emits an event.
- **ARCH-005:** no import cycles.

### 2.2 Systems (names used everywhere from now on)

| Layer | System | One-line responsibility |
|---|---|---|
| L0 | `core.ids` | Make and parse identifiers (§5) |
| L0 | `core.events` | Synchronous typed event bus (§6) |
| L0 | `core.rng` | Seeded random streams per generator |
| L0 | `core.geo` | 2D/3D maths: polylines, fillets, distances, boxes, grids |
| L1 | `content` | Load and validate catalogues (places, roads spec, building types, NPC/animal defs, activities, strings) and the family content pack |
| L1 | `rules` | The hard-rule registry (§9): id → text, severity, validator id |
| L2 | `gen.terrain` | Height field: base noise + rivers, lake, levels, road beds, footprints → `heightAt` |
| L2 | `gen.roads` | Road network from the spec: fillets, junctions, profile → `Road[]`, `RoadNode[]` |
| L2 | `gen.placement` | Place every building, landmark, prop, NPC home, animal zone and vehicle route from the catalogues with a free-spot solver |
| L2 | `gen.world` | Orchestrates the generators, applies family edits, outputs **WorldData** |
| L2 | `gen.validate` | Checks WorldData against every rule with a data validator; returns a report |
| L3 | `world` | Runtime owner of WorldData: queries (`groundAt`, `entitiesNear`, `villageAt`), time of day, weather state |
| L3 | `entities` | The entity registry: spawn/despawn, components, lookup by id |
| L3 | `physics` | Collision (circles, boxes, solid map), platforms; resolves movement |
| L3 | `nav` | Reachability, paths on roads and footpaths, "go to" targets |
| L3 | `player` | Player controllers (local heroes, remote partners), movement intent → physics |
| L3 | `interaction` | What is tappable near each player; runs an entity's action |
| L3 | `actors` | NPC, animal and vehicle behaviour (idle, wander, route, wait-for-child) |
| L3 | `ferry` | River crossings, rafts and boats on routes, boarding |
| L3 | `activities` | Starts and ends activities (mini-games, tales, quests, festivals) with a lifecycle |
| L3 | `economy` | Coins, inventory, items, shops, trades |
| L3 | `progress` | Quests, passport, stickers, levels, achievements |
| L3 | `save` | Versioned persistence, migrations, safe copies, backups |
| L3 | `net` | Rooms, peers, message schema, validation, relay fallback |
| L3 | `voice` | What to say and which recording (pack, family, cloud, device); speech recognition intents |
| L3 | `settings` | Device and grown-up settings (owner of `sv2_settings`) |
| L3 | `players-count` | The anonymous hello (`js/players.js`) |
| L4 | `render` | three.js scene from WorldData + entity views; instancing; LOD; camera |
| L4 | `ui` | Screens, HUD, Pad, dialogs, Grown-ups; sends commands, listens to events |
| L4 | `audio` | Web Audio graph, music, effects, playback of voice buffers |
| L4 | `input` | Touch, joystick, keyboard, gamepads → intents |
| L5 | `app` | Boot, lifecycle, loop, wiring, error boundary |

Outside the game, sharing L0–L2 where possible:
- `studio` (exe + online, `studio/core.cts`);
- `netlify/functions` (`hello`, `studio`);
- `tools` (voice pack, harvest).

### 2.3 Communication

- **Queries** are synchronous and side-effect-free, e.g. `world.groundAt(x, z)`, `entities.get(id)`, `nav.reachable(a, b)`, `interaction.nearest(playerId)`.
- **Commands** change the callee's own state. They are called on the owning system's public interface, e.g. `economy.addCoins(profileId, n, reason)`, `activities.start(activityId, {players})`, `save.request(reason)`.
- **Events** say that something happened. They are published by the owner only and consumed by anyone, e.g. `ActivityCompleted` → `progress` awards a sticker and `players-count` counts it. A listener never mutates the publisher.
- **Services** are reached through one registry, `app.services` (`{ world, entities, physics, … }`), handed to each system's `init(services)`. Systems keep references only to the interfaces they declared as dependencies (§3).

---

## 3. System dependency diagram

```
                         ┌─────────────── app (L5) ───────────────┐
                         │ boot · loop · wiring · error boundary  │
                         └──┬─────────┬──────────┬───────────┬────┘
              ┌─────────────┘         │          │           └──────────────┐
        render (L4)              ui (L4)     audio (L4)                 input (L4)
           │  reads                 │ commands/queries/events  │ plays          │ intents
           ▼                        ▼                          ▼                ▼
   ┌──────────────────────────────── L3 runtime ───────────────────────────────────────┐
   │ world ◄── entities ◄── actors, ferry, player, interaction                         │
   │   ▲          ▲   physics ◄── player, actors, ferry       nav ◄── actors, ui(go-to)│
   │   │          └── activities ──► economy, progress (via events)                    │
   │ settings   save ◄── (snapshots from economy, progress, settings, world edits)      │
   │ voice ──► (audio via playback port)   net ──► player(remote), activities(co-op)   │
   └──────────────────────────────────────▲────────────────────────────────────────────┘
                                          │ WorldData
                     L2 generation: gen.world ─► gen.terrain, gen.roads, gen.placement ─► gen.validate
                                          ▲
                     L1 content (catalogues, family pack, rules)   ◄── studio (edits content only)
                                          ▲
                     L0 core: ids · events · rng · geo
```

### 3.1 Dependency table

| From → To | Class | Note |
|---|---|---|
| any → L0 core | required | everyone |
| gen.* → content, core | required | |
| gen.* → three, DOM, storage, net | **prohibited** | ARCH-002 |
| world → gen.world (at load), content | required | loads or generates WorldData |
| entities → world | required | positions are world space |
| physics → world, entities | required | |
| nav → world, physics(query) | required | |
| player → physics, world, entities | required | |
| player → net | optional | remote partners appear through `net` events |
| interaction → entities, player | required | |
| actors → entities, world, physics, nav | required | |
| actors → player | optional | query only: "is a child near?" (vehicles wait) |
| ferry → entities, world, physics, player | required | |
| activities → content, entities | required | |
| activities → economy, progress | **prohibited direct** | through `ActivityCompleted` events |
| economy, progress → activities | prohibited | |
| progress → economy | optional | command: rewards |
| save → economy, progress, settings, world(edits) | required | through each system's `snapshot()`/`restore()` contract only |
| net → player, activities | optional | events and commands only |
| voice → audio | required | playback port |
| voice → settings | required | |
| ui → every L3 system | optional | commands, queries, events only; **never writes state** (ARCH-003) |
| render → world, entities | required | read-only views |
| render → anything else in L3 | prohibited | |
| L3 → ui, render | **prohibited** | L3 never calls the screen; it emits events (`DialogRequested`, `ToastRequested`) |
| app → everything | required | the only module allowed to know all systems |
| studio → content, gen.*, gen.validate | required (target) | the Studio validates edits with the same code |
| studio → L3/L4 | prohibited | |

### 3.2 Today's cycles and their fix [IMPR]

| Cycle | Fix |
|---|---|
| `games/frame ↔ howto` | `frame` emits `HowToRequested`; `ui` opens how-to |
| `ui ↔ fun`, `ui ↔ snacks`, `regions → ui → snacks → regions` | Snack/eating logic moves to `economy` (L3); `ui` only displays it |

---

## 4. Core entity / data model [PROP]

### 4.1 Conventions

- **Data vs instances:**
  - **WorldData** is plain JSON-serialisable data produced by generation. It never holds functions, meshes or DOM.
  - **Runtime entities** are records in `entities`. Each has an `id`, a `kind`, `components` (plain data) and an optional `view` handle owned by `render`.
- **Components:**
  - `pos {x,y,z,yaw}`
  - `body {r | box}`
  - `interactable {icon, label, action, r}`
  - `actor {behaviour, home, route}`
  - `speech {voiceKind}`
  - `persist {fields}`
- **Owner** means the only system allowed to create, change or delete the record.
- **Persistence:**
  - *derived*: rebuilt from seed + content each start; never saved;
  - *saved*: in the save;
  - *content*: in the family content pack;
  - *session*: memory only.

### 4.2 Entities

| Entity | Id (§5) | Owner | Lifecycle | Required state | Optional state | Relationships | Persistence | Runtime needs |
|---|---|---|---|---|---|---|---|---|
| **Entity** (base) | `kind:scope/name` | `entities` | spawn → active ⇄ dormant (far, LOD) → despawn | id, kind, pos | body, interactable, actor, view | parent (village/building) | derived unless the kind says otherwise | lookup O(1) by id; spatial index |
| **World** | `world:<genVersion>-<seed>` | `world` | generated/loaded at boot → frozen data + runtime clock | seed, genVersion, bounds (±200 m), terrain params, lists of ids for all below | weather, time of day | contains everything | derived; family edits are *content* | `groundAt` < 2 µs; spatial grid |
| **Village** (settlement: village, town, city, market, corner) | `village:<slug>` | `gen.world` → `world` | generated; never despawns | id, type, name `[en,vi]`, country, shape (circle/rect), level h, gates[] | theme, festival hosts, music key | has Buildings, Landmarks, Gates (RoadNodes), NPC homes; connected by Roads | derived (content gives new ones) | `villageAt(x,z)`; `PlayerEnteredVillage` |
| **Road** | `road:<from>-<to>` or `road:<slug>` | `gen.roads` → `world` | generated | id, class (asphalt/dirt/footpath), width, centreline (filleted), profile heights, node ids at ends | name, deck spans (bridges) | ends at RoadNodes; crosses River via Bridge | derived | `roadDist`; surface height; ribbons built by `render` |
| **RoadNode** | `node:<slug>` (named: gate, junction) or `node:<road>/<k>` | `gen.roads` | generated | id, type (gate, junction-T, junction-Y, end, deck-end), pos, level, connected road ids | gate style, sign `[en,vi]` | Gate → Village; Junction → ≥ 2 Roads | derived | nav graph vertex |
| **Building** | `bld:<village>/<slug>` | `gen.placement` → `world` | generated (content may add, move or remove) | id, type (catalogue), footprint (rect/rot), level, entrance ids, village id | name `[en,vi]`, owner NPC ids, colours, interior type | → Village; → BuildingEntrance → RoadNode/road side | derived; family additions *content* | box collider; solid map; render LOD |
| **BuildingEntrance** | `ent:<building>/<n>` | `gen.placement` | generated with its building | id, building id, pos (door), facing, access point on road side | label | → Building; → nearest Road + offset | derived | interaction point; nav target |
| **NPC** | `npc:<village>/<slug>` (named) or `npc:<village>/<role>-<n>` | `actors` (data from `gen.placement`) | spawned at entity spawn → idle/route/talk → dormant far away | id, def (look, gender, age, voiceKind), home (building/spot id), name `[en,vi]` via names registry | lines, role (host, seller, singer), schedule | → Building (home) → Village | derived; family NPCs *content*; renames *settings* | behaviour tick 10 Hz near players, 1 Hz far; never inside solids |
| **Animal** | `ani:<zone>/<kind>-<n>` · pets `pet:<profile>/<n>` | `actors` (wild/farm), `progress` (pets) | spawned in a zone; wanders inside it | id, kind, zone id | name, owner profile (pets) | → zone (Village or Region) | wild: derived; pets: *saved* | 5–10 Hz near, paused far |
| **Vehicle** | `veh:<route>/<n>` | `actors` | spawned on a route → moving ⇄ waiting (child ahead) | id, kind, route id (road id + direction), speed limit by road class | cargo, rider | → Road | derived | waits for a child within 4 m (design rule); 10 Hz |
| **River** | `river:<slug>` | `gen.terrain` → `world` | generated | id, polyline, width profile, water level | name | crossed by Bridges, served by Ferries | derived | `riverDist`; water render |
| **Bridge** | `bridge:<slug>` | `gen.roads` | generated | id, road id, deck span (x0..x1 or polyline), deck height, river id | style, name | → Road, → River | derived | platform for physics; deck clear of props |
| **Ferry** (crossing + vessel) | crossing `ferry:<slug>`; vessel `boat:<slug>/<n>` | `ferry` | crossing generated; vessel spawned → docked ⇄ sailing | crossing: river id, stops (pier pos + RoadNode/village); vessel: crossing id, state, position along route | rower NPC id, capacity | → River, → Villages via piers | derived; whether the child is aboard is *session* | the route never crosses land (validator); riders never left on water |
| **Landmark** | `lm:<slug>` | `gen.placement` | generated | id, model, pos, footprint, village/region id, real-world ref | photos key, tower top platform | → Village/Region | derived; photos are *content* | interactable; lookout platform |
| **Player** | local `player:<profileId>`; remote `player:peer/<hash>` | `player` | created on "Go" (who's playing) → active → leaves | id, profile id, controller (local/remote), pos | carry, mount, emote | → Entity under control; → Profile | profile *saved*; position *session* (resume spot optional [OPEN]) | 60 Hz movement |
| **Profile** (child) | `profile:<uuid>` | `save` | created in "who's playing" → kept | id, name, age band, looks, levels, quests | stickers, passport, pets | → Players | *saved* | — |
| **Activity** | `act:<kind>/<id>` (`act:game/caro`, `act:tale/tam-cam`, `act:fest/tet`) | `activities` | requested → loading → playing ⇄ paused → completed / abandoned → cleaned up | id, kind, players[], startedAt, state | level, partner peer, source entity id | ← started from Entity (host NPC, shrine); → Minigame/Tale def | the result is applied by listeners; the activity itself is *session* | owns the screen; the world pauses (`frame` does this today) |
| **Minigame** (definition) | `game:<id>` | `content` (registry `GAMES`) | registered at import; instantiated as an Activity | id, name `[en,vi]`, age bands, open(api) → result | how-to film, level rules, music | → Activity | *content* | must clean up all timers, listeners and audio (ACT-003) |
| **GameState** | `state:session` | `app` (composed) | boot → title → playing → paused → saved → closed | phase, players, active activity id, world id, build | net room, festival | aggregates the systems' snapshots | the save is composed of system snapshots | — |

### 4.3 Shared value types

| Type | Shape |
|---|---|
| `Vec2/Vec3` | `{x,z}` / `{x,y,z}` in metres (1 unit = 1 m) |
| `Text` | `[en, vi]` or `(lang) → string`. Never a bare string for player-facing text (STR-001) |
| `Result` | `{ ok: true, value } \| { ok: false, error: { code, message, data } }`. L0–L3 return Results for expected failures and throw only for programmer errors |

---

## 5. Identifier strategy [PROP]

**Format:** `kind:scope/name`.
- Lower-case ASCII.
- `-` inside names.
- `/` separates scope.
- Examples: `village:lotus`, `bld:lotus/house-03`, `npc:saigon/ba-tu`, `road:saigon-home`, `node:gate/saigon`, `ent:bld:lotus/house-03/1`.

| Rule | Text |
|---|---|
| **ID-001 Deterministic** | Generated ids derive from content keys, never from array position in mutable lists. Where a generator makes many of a kind (props, trees), the id is `<kind>:<scope>/<n>` with `n` from that generator's own seeded stream, and the generator's version is part of `WorldData.genVersion`. A changed generator means a new `genVersion`, and saves that reference such ids are migrated or ignored (SAVE-003) |
| **ID-002 Stable named things** | Places, roads, landmarks, named NPCs, games and tales keep their ids forever. Renaming changes the label, never the id. Today's ids are reused: `CITIES[].id`, landmark ids, `GAMES` keys, tale ids, voice hashes |
| **ID-003 Family-made things** | Studio-created objects use `fam:<kind>/<shortuuid>`, stored in `content/custom.json`, and are never reused |
| **ID-004 Remote** | Remote players and peers use `peer/<hash>` of the peer id. Raw network ids never go into WorldData or saves |
| **ID-005 References, not objects** | Systems keep ids, not object references, across frames and saves. A dangling id is a validator error in WorldData (WORLD-009) and a no-op with a log at runtime (graceful failure) |

**Relationship fields** (all ids):

| Field | Meaning |
|---|---|
| `NPC.home → bld:/spot` | where the NPC lives or stands |
| `Building.village → village:` | the settlement it belongs to |
| `Building.entrances[] → ent:` | its doors |
| `BuildingEntrance.access → {road: road:…, s: metres along}` | where the door meets a road |
| `Vehicle.route → {road, dir}` | the road it drives |
| `Ferry(crossing).river → river:` | the river it crosses |
| `Ferry.stops[] → {pier, node}` | its piers and the road nodes they connect to |
| `Player.controls → entity id` | what the player moves |
| `Activity.source → entity id` | the NPC or shrine it started from |
| `Activity.def → game:/tale:` | what it runs |

---

## 6. Event strategy [PROP]

**Bus:**
- `core.events`: synchronous `emit(name, payload)`, `on(name, fn) → off`.
- Payloads are plain data with ids, never objects.
- Errors in a listener are caught and logged; they never stop the emitter (graceful failure).
- No async events. Queueing is the listener's business.

**Only these events are adopted:** each has a real consumer today or is needed by a migration step. Per-frame or per-entity chatter (every NPC step, every vehicle move) is **not** an event: it is queried.

| Event | Publisher | Payload | Consumers (today's behaviour it replaces) |
|---|---|---|---|
| `WorldGenerated` | gen.world | `{worldId, genVersion, counts}` | validator, render, studio |
| `WorldValidated` | gen.validate | `{worldId, errors[], warnings[]}` | app (refuse BLOCKER), tests, studio |
| `WorldReady` | app | `{worldId}` | actors, ferry, net, players-count |
| `PlayerEnteredVillage` / `PlayerLeftVillage` | world (zone tracker) | `{playerId, villageId}` | audio (music by place), progress (passport visits, stickers), ui (name banner) |
| `InteractionStarted` | interaction | `{playerId, entityId, action}` | voice, ui, progress |
| `ActivityStarted` | activities | `{activityId, kind, defId, players[], source}` | world (pause), audio, net (co-op), players-count |
| `ActivityCompleted` | activities | `{activityId, defId, players[], result{won, score, level}}` | progress (levels, stickers), economy (rewards), players-count, voice |
| `ArcadeAdventureTriggered` | Fruit Parade session result | `{sourceGame, activityType, playerIds[], combination[], round, reward:null}` | extension hook for future world activities; does not itself award inventory or complete another activity |
| `ActivityAbandoned` | activities | `{activityId, reason}` | world (resume), audio |
| `ItemsChanged` / `CoinsChanged` | economy | `{profileId, delta, reason}` | ui, save (dirty), progress |
| `ProgressChanged` | progress | `{profileId, what}` | ui, save |
| `FerryDeparted` / `FerryArrived` | ferry | `{boatId, crossingId, stopId, riders[]}` | ui (camera), audio, progress |
| `VehicleBlocked` | actors | `{vehicleId, byPlayerId}` | voice (a friendly honk/line), tests |
| `SettingsChanged` | settings | `{keys[]}` | every system that reads settings |
| `LanguageChanged` | settings | `{lang}` | ui, render (3D signs redraw: `onLang()` today), voice |
| `SaveCompleted` / `SaveFailed` | save | `{reason, bytes} / {reason, error}` | ui (grown-ups notice), tests |
| `PeerJoined` / `PeerLeft` / `NetMessage<type>` | net | validated payloads only | player (remote), activities (co-op), ui |
| `DialogRequested` / `ToastRequested` / `HowToRequested` | any L3 | `{text: Text, choices?, entityId?}` | ui only (replaces L3 → ui calls) |
| `StickerEarned` (round E) | progress (`js/placebook.js`) | `{playerId, stickerId, placeId}` | tests; later the per-child report |
| `PostcardEarned` (round E) | progress (`js/familycards.js`) | `{playerId, postcardId, placeId}` | tests; later the per-child report |
| `HomeDecorated` (round E) | `js/myhouse.js` | `{playerId, spot, item, price}` | tests; later co-op visits |

**Not adopted:**
- `VillageCreated`, `BuildingCreated`, `RoadNetworkGenerated` as separate runtime events. Generation is a pure function returning WorldData, and one `WorldGenerated` covers it.
- `NPCSpawned` per NPC. Spawning is batch work inside `entities` at `WorldReady`.
- `VehicleEnteredRoad`. Vehicles never leave their route.

---

## 7. Runtime lifecycle [PROP]

| Phase | What happens | Failure behaviour |
|---|---|---|
| **BOOT** | Service worker registers; build number; `settings` loaded; content pack fetched (`content/custom.json`); voice manifest from cache first | Missing content → `{}`; missing manifest → device voice, plus Grown-ups notice (VOICE-002); storage blocked → session-only play with a notice |
| **INITIALISATION** | `core` services; `content.load()` validates catalogues and the family pack; `rules` registry | Invalid family pack → ignore the bad parts, keep the rest, log for Studio |
| **WORLD LOAD/GENERATION** | `gen.world(seed, content, genVersion)` → WorldData; `gen.validate(WorldData)`; family edits applied; validate again. May be cached per (build, content signature) like the solid map is today | BLOCKER errors: in tests and Studio, fail; on a device, drop the offending family edit and retry, then fall back to the last good world for this build. Never start an invalid world silently |
| **SYSTEM INITIALISATION** | `world`, `physics` (collision grid, solid map; time-sliced), `nav`, `entities`, `audio` graph, `net` (if online) | A system that fails to init reports, and its dependants run in degraded mode (e.g. no `net` → solo play) |
| **ENTITY SPAWNING** | NPCs, animals, vehicles, ferries, interactables from WorldData; `render` builds views (instanced where repeated); emits `WorldReady` | Missing model → placeholder view, entity still works |
| **GAME START** | Title → who's playing → profiles → players created → camera → music | — |
| **GAME LOOP** | Fixed order below | An exception in one system's update is caught; that system skips the frame and is reported; the loop continues |
| **SAVE** | On change (debounced 1 s), on activity end, on `pagehide`/`visibilitychange`, on backup export: `save` collects `snapshot()` from each system | Write fails → keep the in-memory state and the last good copy, emit `SaveFailed`, retry |
| **SHUTDOWN** | `pagehide`: flush save, `net.leave()`, players-count hello (beacon), stop audio | Best effort |

**Update order per frame:**
1. `input.poll`
2. `net.receive` (validated messages → events)
3. `player.intent` (from input, tap-to-go, nav)
4. `actors.update` (NPC, animal, vehicle; LOD rates)
5. `ferry.update`
6. `physics.resolve` (all bodies)
7. `world.zones` (enter/leave village events)
8. `interaction.update` (nearest per player)
9. `activities.update` (only the world-side parts; a full-screen activity pauses 3–8)
10. `voice/audio.update`
11. `render.camera`, then `render.draw`
12. `ui.update`
13. `net.send` (throttled)
14. `save.tick`

Today's `frame()` in `main.js` roughly follows 1–12, mixed together. Step 4 of the migration (§12) makes the order explicit.

**Time:**
- simulation `dt` is clamped (≤ 50 ms, as today);
- generation is independent of time;
- runtime randomness uses `core.rng` streams seeded per session. Gameplay never uses `Math.random` for anything a test must reproduce.

---

## 8. System interface contracts [PROP]

The template is the same for every system. Fields marked "—" mean none.

### 8.1 `gen.world` (with `gen.terrain`, `gen.roads`, `gen.placement`)
- **Responsibility:** turn `{seed, genVersion, content, familyEdits}` into WorldData; deterministic.
- **Non-responsibility:** meshes, materials, colliders as objects, DOM, runtime movement, saving.
- **Inputs:** content catalogues (places, road spec, building types, NPC defs, zones), family pack `world.build/edits/land`.
- **Outputs:** `WorldData {id, genVersion, seed, bounds, terrain, rivers[], roads[], nodes[], bridges[], ferries[], villages[], buildings[], entrances[], landmarks[], props[], npcs[], animalZones[], vehicleRoutes[], interactables[]}`.
- **Dependencies:** core (required); content (required).
- **Public interface:** `generate(params) → Result<WorldData>`; `heightAt(worldData, x, z)` (pure); `roadDist(worldData, x, z)`.
- **Events:** publishes `WorldGenerated`.
- **State:** none (pure).
- **Persistence:** none; cacheable by (build, content signature).
- **Performance:** full generation ≤ 1.5 s on a mid phone (time-sliced if needed); `heightAt` ≤ 2 µs.
- **Failure:** returns `Result.error` with rule ids; never partial output.

### 8.2 `gen.validate`
- **Responsibility:** check WorldData against every rule that has a data validator (§9).
- **Non-responsibility:** fixing data (the generator repairs; the validator only reports).
- **Inputs:** WorldData and the `rules` registry. **Outputs:** `{errors[], warnings[]}`, each `{ruleId, entityIds[], at, message}`.
- **Dependencies:** core, rules.
- **Public interface:** `validate(worldData, {only?}) → report`.
- **Events:** `WorldValidated`.
- **State:** none.
- **Persistence:** none.
- **Performance:** ≤ 2 s in Node for the whole world.
- **Failure:** a crashing validator counts as an ERROR for that rule, never as a pass.

### 8.3 `world`
- **Responsibility:** hold WorldData at runtime and answer spatial queries; zones (enter/leave); clock; weather state.
- **Non-responsibility:** creating or moving entities; drawing.
- **Inputs:** WorldData. **Outputs:** queries, zone events.
- **Dependencies:** core, gen (pure functions).
- **Public interface:**
  - `groundAt(x, z, y?)`, `heightAt(x, z)`
  - `roadDist(x, z)`, `riverDist(x, z)`
  - `villageAt(x, z)`, `get(id)`
  - `entitiesData(kind)`
  - `time()`, `isNight()`
- **Events:** publishes `PlayerEnteredVillage/Left`.
- **State:** WorldData (read-only after load), clock, weather.
- **Persistence:** none (derived), except weather and clock *session*.
- **Performance:** queries O(1)–O(log n) through grids.
- **Failure:** queries outside the bounds return the edge value; unknown id → `null`.

### 8.4 `entities`
- **Responsibility:** registry of live entities and their components; the spatial index.
- **Non-responsibility:** behaviour (actors), drawing (render), physics resolution.
- **Public interface:**
  - `spawn(def) → id`, `despawn(id)`, `get(id)`
  - `query({kind, near:{x,z,r}})`
  - `setComponent(id, name, data)`: **only the owner system of that component may call it** (ARCH-004)
- **Events:** — (batch spawn is part of `WorldReady`).
- **State:** the entity table.
- **Persistence:** none; saved things are stored by their owners as ids + fields.
- **Performance:** 5,000 entities; `query near` ≤ 0.1 ms.
- **Failure:** duplicate id → reject + log (WORLD-008).

### 8.5 `physics`
- **Responsibility:** collision (round bodies, boxes, solid map), platforms (decks, stages, towers), ground snapping.
- **Non-responsibility:** deciding where anyone wants to go (player, nav).
- **Public interface:** `resolve(body, from, to) → pos`, `isSolid(x, z)`, `platformAt(x, z, y)`, `clearSpot(x, z, r)`.
- **State:** collision grid, solid map (cached per build and content: `js/solids.js` today), platforms.
- **Persistence:** solid map cache only (`sv2_solid_*`).
- **Performance:** `resolve` ≤ 20 µs; solid map ≤ 1 s of work, time-sliced.
- **Failure:** solid map not ready → colliders only (as today); never block movement entirely.

### 8.6 `nav`
- **Responsibility:**
  - is a target reachable;
  - the path along roads and footpaths, and in open ground with obstacle avoidance;
  - "go to X" for tap-to-go, actors and grown-up "fly to".
- **Public interface:** `reachable(from, to) → bool`, `path(from, to) → Vec2[]`, `nearestAccess(entityId) → Vec2` (the entrance access point).
- **State:** the road graph (from RoadNodes) and a coarse walk grid.
- **Performance:** path ≤ 5 ms.
- **Failure:** unreachable → `Result.error` with the nearest reachable point. UI tells the child kindly (design: never let a child walk into a wall without feedback).

### 8.7 `player`
- **Responsibility:** local heroes and remote partners: movement from intents, stamina, mounts, carry, emotes; it owns Player and Profile ↔ Player binding.
- **Non-responsibility:** camera, HUD, deciding rewards.
- **Inputs:** intents (input, nav), remote states (net). **Outputs:** positions, `InteractionStarted` (through interaction).
- **Dependencies:** physics, world, entities (required); net (optional).
- **Public interface:** `create(profileId, controller)`, `intent(playerId, intent)`, `get(playerId)`, `teleport(playerId, pos)` (rescue, travel).
- **Persistence:** profile fields only (through `save`).
- **Performance:** 60 Hz.
- **Failure:** stuck detection → rescue to the nearest reachable point (today `G.rescue`).

### 8.8 `interaction`
- **Responsibility:** for each player, the nearest interactable within range, with no solid between; run its action; one main action per thing (design G7).
- **Public interface:** `nearest(playerId)`, `act(playerId, entityId)`, `register(entityId, interactableDef)` (owners of the entity call this).
- **Events:** `InteractionStarted`.
- **State:** the interactables index (by id).
- **Performance:** 10 Hz per player.
- **Failure:** an action throws → caught, kind toast, logged.

### 8.8b `ui` (L4)
- **Responsibility:** screens, HUD, Pad, dialogs and Grown-ups; turning events into views and taps into commands.
- **Non-responsibility:** owning or changing gameplay state directly (ARCH-003): coins, items, levels, quests and profiles change through `economy`/`progress`/`save` commands.
- **Inputs:** queries, events (`DialogRequested`, `ToastRequested`, `ItemsChanged`…).
- **Outputs:** commands.
- **Dependencies:** any L3 interface (optional); `audio` for UI sounds.
- **Public interface:** `ui.open(screenId, params)`, `ui.close(screenId)`.
- **Events:** consumes; publishes nothing about gameplay.
- **State:** open screens, focus.
- **Persistence:** UI preferences only, through `settings`.
- **Performance:** no layout thrash in the loop; HUD ≤ 1 ms per frame.
- **Failure:** a screen error closes that screen with a toast; the game goes on.
- **Existing UI layout is frozen** (HANDOFF rule 1, `contract` check).

### 8.9 `actors` (NPC, animal, vehicle)
- **Responsibility:**
  - behaviours: idle, wander in zone, route (sellers, vehicles), talk/bubble, festival plays;
  - vehicles wait for children;
  - NPCs keep clear of entrances.
- **Public interface:** `spawnAll(worldData)`, `say(entityId, Text)`, `setBehaviour(entityId, behaviourId)`.
- **Events:** `VehicleBlocked`.
- **State:** behaviour state per actor.
- **Persistence:** none (renames are settings; family NPCs are content).
- **Performance:** level of detail. Within 40 m of a player: 10 Hz behaviour and full animation; farther: 1 Hz behaviour and no animation.
- **Failure:** an actor stuck for 3 s → snap to the nearest free spot on its route or zone.

### 8.10 `ferry`
- **Responsibility:** crossings, boats on routes, docking, boarding, a destination choice (raft), never stranding a rider.
- **Public interface:** `board(playerId, boatId)`, `choose(playerId, stopId)`, `leave(playerId)`.
- **Events:** `FerryDeparted`, `FerryArrived`.
- **State:** boat positions and riders.
- **Persistence:** session.
- **Failure:** route blocked → return to the last stop and put riders ashore at the pier (RIVER-003).

### 8.11 `activities` (mini-games, tales, festivals, co-op quests)
- **Responsibility:**
  - the lifecycle `requested → loading → playing ⇄ paused → completed | abandoned → cleanup`;
  - one activity per screen;
  - pause the world;
  - the shared frame (`games/frame.js`).
- **Non-responsibility:** awarding (progress, economy listen); drawing the world.
- **Public interface:** `register(def)` (the `GAMES` registry), `start(defId, {players, level, source})`, `pause()`, `resume()`, `abandon(reason)`.
- **Events:** `ActivityStarted`, `ActivityCompleted`, `ActivityAbandoned`, `HowToRequested`.
- **State:** the current activity.
- **Persistence:** none (results applied by listeners).
- **Performance:** the world loop paused while full-screen (as today).
- **Failure:** a game throws → `ActivityAbandoned{reason:'error'}`, kind toast, the world resumes. ACT-003: after cleanup there are no live timers, listeners, audio nodes or DOM left from the game.

### 8.12 `economy` and `progress`
- **economy:**
  - responsibility: coins (shared family purse), items and bag, shop and stall prices, trades, food;
  - interface: `addCoins`, `spend`, `give(profileId, itemId, n)`, `take`;
  - events: `CoinsChanged`, `ItemsChanged`.
- **progress:**
  - responsibility: levels per game, quests, passport stamps, stickers, pets, hats;
  - listens to `ActivityCompleted` and `PlayerEnteredVillage`;
  - interface: `award(profileId, rewardDef)`, `status(profileId)`;
  - event: `ProgressChanged`.
- **Both:** persistence *saved* through `snapshot()`/`restore()`; failure is never a partial award (all or nothing per event).

### 8.13 `save`
- **Responsibility:** the versioned save document composed of per-system sections, migrations, safe copies (IndexedDB, Cache API), backups (export/import file), restore.
- **Interface:**
  - `register(sectionId, {version, snapshot(), restore(data), migrate(from, data)})`
  - `request(reason)`
  - `export()`, `import(file)`
- **State:** the last good document.
- **Events:** `SaveCompleted`, `SaveFailed`.
- **Performance:** debounced; ≤ 20 ms per write.
- **Failure:** never overwrites copies when the main save is unreadable (today's rule, round 26); unknown newer version → read-only, with a Grown-ups notice.

### 8.14 `net`
- **Responsibility:**
  - rooms, peers (PeerJS) and the cloud relay fallback;
  - presence, positions, chat bubbles, photos (ECDH), co-op messages;
  - schema validation and rate limits.
- **Interface:** `join(roomCode)`, `leave()`, `send(type, payload)` (schema-checked), `peers()`.
- **Events:** `PeerJoined`, `PeerLeft`, `NetMessage<type>` (validated only).
- **State:** connections and remote states.
- **Persistence:** friend codes (*saved*).
- **Performance:** positions at ≤ 10 Hz; message ≤ 2 KB (photos chunked).
- **Failure:** fall back to the relay, then to solo play; never block the game.

### 8.15 `voice` / `audio`
- **voice:**
  - which recording or voice speaks a `Text`: family recording → pack → device (VOICE-001; no online voice on the device, PRIV-010);
  - misses noted;
  - speech recognition intents;
  - interface: `say(Text, {speaker})`, `sayAsync`, `hush()`, `diag()`.
- **audio:**
  - the Web Audio graph, buses, unlock on tap, music by place, effects, buffer and plain-player playback;
  - interface: `play(buffer|url, {rate, bus})`, `music(key)`, `sfx(id)`.
- **Failure:** audio asleep → plain player; no recording → device voice for that line only, noted for the Studio inbox.

### 8.16 `render`
- **Responsibility:**
  - build three.js views from WorldData and entities;
  - instancing for repeats; LOD; outlines; sky; water; camera rigs;
  - adaptive resolution;
  - 3D signs that redraw on `LanguageChanged`.
- **Non-responsibility:** collisions (it may feed meshes to the solid-map builder as a *read-only* source; ARCH note §12 step 6), gameplay decisions.
- **Interface:** `build(worldData)`, `attachView(entityId, viewDef)`, `camera.*`, `quality(q)`.
- **Performance:** budgets PERF-001…005 (§9, owner round D), checked by `perf` against `tests/perf-baseline.json` (a ratchet towards each budget).
- **Failure:** missing texture or model → placeholder; WebGL context lost → pause + restore.

### 8.17 `settings`, `content`, `players-count`, `studio`
- **settings:** owns `sv2_settings`; `get/set`; `SettingsChanged`, `LanguageChanged`; grown-up gates.
- **content:**
  - loads and validates catalogues and the family pack (`js/custom.js` today);
  - exposes read-only data;
  - never mutated at runtime.
- **players-count:** `js/players.js`. It reads `settings` and listens to `ActivityStarted`/`InteractionStarted`, replacing the direct calls from `main.js`. The privacy whitelist is PRIV-002.
- **studio:**
  - edits content only;
  - validates with `gen.validate` before Publish ([IMPR], today via the hidden-iframe snapshot);
  - one engine for the exe and online (STUDIO-001).

---

## 9. Hard-rule framework [PROP]

**Every non-negotiable rule has a stable id `SYSTEM-NNN`.** Ids are never reused or renumbered. A rule changes only by an owner decision recorded in HANDOFF §8 with its new text, and **a rule is never weakened silently**: a check that allows more than the rule says is a bug, logged as [OPEN] until fixed.

**Severity:**
- **BLOCKER** stops a release (a test fails; generation rejects the world).
- **MAJOR** fails the test; generation repairs it.
- **MINOR** is a warning listed in the report.

**Validation:**
- **data**: a `gen.validate` validator in Node;
- **check**: an existing browser check in `tests/run.mjs`;
- **visual**: before/after screenshot review;
- **process**: a human/AI workflow rule.

**Failure behaviour** is what the game does at runtime if the rule is somehow broken.

The design-handbook aliases (G1–G11, R1–R12) map onto these ids and stay valid.

### 9.1 Process and release (from HANDOFF §0)

| Id | Rule | Reason | Sev. | Validation | Failure behaviour |
|---|---|---|---|---|---|
| PROC-001 | Nothing reaches `main` without the owner's explicit "yes, deploy" (one per round, asked by Release after the full suite is green and the round is reported); helper cores, and the bug robot (only to `bugfix/*` branches as draft PRs), push their own branches without asking (owner, 10 Oct; CLAUDE.md) | Owner control | BLOCKER | process | — |
| PROC-002 | Existing features and UI unchanged unless asked | The children know the game | BLOCKER | check `contract`, `spill`, `phone` | — |
| PROC-003 | Run the suite before and after; desktop and phone side by side | Phone-only bugs | BLOCKER | process + `phone` | — |
| PROC-004 | Bump `VERSION` (sw.js), `BUILD`, `studio/version.json` together; new files in `FILES` | Devices update | BLOCKER | check `ground`, `studio` | old version keeps running offline |
| PROC-005 | Suggestions and unfinished items go to the owner to decide | Owner control | BLOCKER | process | — |
| PROC-006 | A new measurable rule gets a check, and the check is shown failing on the old code first | Trustworthy checks | MAJOR | process | — |

### 9.2 Architecture

| Id | Rule | Sev. | Validation |
|---|---|---|---|
| ARCH-001 | Imports only to the same or a lower layer | MAJOR | check `arch` [IMPR] |
| ARCH-002 | L0–L2 free of DOM, three.js, storage and network | BLOCKER (for new code) | check `arch` |
| ARCH-003 | UI/presentation is never the authority for gameplay state | MAJOR | review + `arch` (no imports of L3 setters from L4 except interfaces) |
| ARCH-004 | No system writes another system's state | MAJOR | review; `entities.setComponent` owner check at runtime (dev mode) |
| ARCH-005 | No import cycles | MAJOR | check `arch` |

### 9.3 World and places (land)

| Id | Rule | Reason | Sev. | Validation | Failure behaviour |
|---|---|---|---|---|---|
| WORLD-001 | Every village, town and city is one flat level (only river, lake, ponds, bridge ramps, road surfaces and a building's base pad differ) | Owner HARD rule (round 29) | BLOCKER | check `flat`; data [IMPR] | generator levels the area |
| WORLD-002 | Everything stands on the ground: `heightAt ± 0.05 m`; footprints levelled (G4) | Nothing floats or sinks | MAJOR | check `ground`; data | snap to the ground |
| WORLD-003 | Nothing built over the river or the lake | Water reads as water | BLOCKER | check `ground`; data | placement rejects the spot |
| WORLD-004 | Never fill the river: banks and road beds stay off it | Rafts, ferries | BLOCKER | data (river profile) + check `features` (`river`) | generator keeps the river channel |
| WORLD-005 | Houses and objects are solid (no walking through) | Owner HARD rule (round 30) | BLOCKER | check `solid` | colliders only until the solid map is ready |
| WORLD-006 | Everything tappable has open ground within reach | No unreachable actions | MAJOR | check `solid` (interactables) | interactable radius widened (today) |
| WORLD-007 | Things to tap stand outside solids; NPCs never inside buildings | — | MAJOR | data [IMPR] | spawn moved to the nearest free spot |
| WORLD-008 | Ids unique and well-formed | References | BLOCKER | data | reject duplicate |
| WORLD-009 | Every id reference resolves | References | BLOCKER | data | drop the reference + log |
| WORLD-010 | Every activity location, entrance and landmark is reachable from the player's start | Child never stuck | MAJOR | data (nav reachability) [IMPR] | nav offers the nearest reachable point |
| WORLD-011 | Scale: child 1.6 m, adult 2.0 m, grandparent 1.8 m; doors ≥ 1.4 × 2.4 m; steps ≤ 0.4 m (G2) | Consistency | MINOR | data (catalogue) | — |
| WORLD-012 | No clutter: ≤ 1 big focal object per 10 m of street; ≥ 40 % open ground (G11) | Readability | MINOR | data [IMPR] + visual | — |
| WORLD-013 | Garden plots (round T3): at least 60 (two Memory Villages, up to three spare by each city); each level within 5 cm, off roads and water, its front within 2 m of a road's edge, a unique id and address, nothing standing on it; one garden mesh for all | Families place the homes they remember | MAJOR | check `plots` | plot kept as a garden |
| WORLD-014 | Footsteps by surface (round T4a): `surfaceAt` tells road (asphalt and town paving), dirt (dirt roads and footpaths), sand (the beach), wood (bridge decks and piers), water (the shallows) and grass apart, and a step plays that surface's sound | A child hears where they walk | MINOR | check `surface` | the step of before |

### 9.4 Roads (R1–R12)

| Id | Alias | Rule | Sev. | Validation | Failure behaviour |
|---|---|---|---|---|---|
| ROAD-001 | R1 | Classes with constant width: asphalt 6.4 m (owner, 10 Oct: was 5.2 m; the Concept D drawings), dirt 3.4 m, footpath 1.6 m (footpaths exist from round 30: Lotus Village) | MAJOR | `js/validate.js` (check `validate`) | — |
| ROAD-002 | R2 | Straight runs joined by true circular arcs; no step turn > 8°; min radius 10 / 6 / 3 m; no S-bends within 15 m | BLOCKER | check `roadshape`; data | generator fillets |
| ROAD-003 | R3 | Surface on the ground, never > 0.3 m above it; grade ≤ **8 % asphalt / 12 % dirt** (owner, round 30; `ROAD_GRADE` in roads.js), no allowance: a place too high for its road is lowered; every change of slope rounded | BLOCKER | check `roadshape`, `ground` | generator spreads the grade |
| ROAD-004 | R4/G5 | Clear corridor `w/2 + 1.5 m`: no props, trees, rocks, grass, flowers, pickups, NPC spots; trees ≥ `w/2 + 2.5`; buildings 2–4 m back | BLOCKER | check `roads` | placement rejects the spot |
| ROAD-005 | R5 | Side roads leave at 60–120°, straight ≥ 6 m before bending; Y only for even splits; one plain junction patch | BLOCKER | check `roads` | generator squares the junction |
| ROAD-006 | R6 | Outside towns only T-junctions; junctions ≥ 20 m apart on a road; parallel roads ≥ 12 m apart; no crossing without a junction | MAJOR | data [IMPR] | — |
| ROAD-007 | R7 | A named road end = its gate anchor (0 m gap); **one welcome gate per village or city** (owner, Round U, 11 Oct), across its main road (a city's first gate); other named road ends come in through a plain opening; gate square; opening ≥ road + 1 m each side; bilingual sign | BLOCKER | check `roads` (one gate per place, on its main road) + data | — |
| ROAD-008 | R8 | Every village and city reachable by asphalt; dead ends only at a gate, landmark or pier | BLOCKER | check `roads` | — |
| ROAD-017 | R3 | (Round U, owner 11 Oct) No step where roads join: along every road and 3 m into a road it joins, the ground a child walks on never jumps more than 0.06 m from one 25 cm step to the next (road to road, road to bridge deck, road to a place's level) | MAJOR | check `joins` | the road is held at a bridge deck's height over its 1.2 m apron |
| ROAD-009 | R9 | River crossings within ± 20° of square, straight ≥ 6 m each side; nothing on decks | MAJOR | data [IMPR] | — |
| ROAD-010 | R10 | Lines only on asphalt; plain at junctions; zebra only in towns | MINOR | visual | — |
| ROAD-011 | R11 | Pond footpaths 1.5–2.5 m from water (measured from the path's edge) | MINOR | checks `village`, `validate` | — |
| ROAD-012 | R12 | Soft verge blend 0.3–0.5 m with flowers along it | MINOR | visual | — |
| ROAD-013 | — | Inside a village a road takes the village's level; at a junction the side road takes the through road's exact height | BLOCKER | check `flat`, `roadshape` | — |
| ROAD-014 | — | Every asphalt road carries its region's colour (red Vietnam, orange Australia, purple mountains, blue coast, plain grey home); the ring road is closed (round T2) | MINOR | check `roadtone` | — |
| ROAD-015 | — | Road markings by region (round T4a, owner): Vietnam's asphalt a yellow centre dash, Australia's white lines with concrete kerbs; town main streets brick (Vietnam) or paving (Australia); dirt roads red earth | MINOR | check `roadtone` | — |
| ROAD-016 | — | Every gate can be walked through (r63): from 8 m outside to 3 m inside along its road nothing solid is in the way, and the ground never steps more than 25 cm; a road's end at a gate meets the place at its own level | MAJOR | check `gates` | — |

### 9.5 Buildings, NPCs, animals, vehicles, river

| Id | Rule | Sev. | Validation |
|---|---|---|---|
| BUILDING-001 | Fronts face the nearest road or yard; the entrance access point is on the road side (G6) | MAJOR | data [IMPR] |
| BUILDING-002 | Doors align with the entrance, reachable from a road or path | MAJOR | data (nav) [IMPR] |
| BUILDING-003 | No roof intersects a neighbour; no building touches a road corridor | MAJOR | check `roads`, `ground`; data |
| BUILDING-004 | House number 8 shows only "8"; the street name never appears in the game or the repo | BLOCKER | process + grep check [IMPR] |
| BUILDING-005 | Villages have no modern elements; cities keep their own building types (handbook §5) | MINOR | visual |
| STALL-001 | (T1b, owner 11 Oct) Every stall, kiosk, food van and seller's tent stands 1.5 m or more from the edge of any road or place street and 3 m or more from any building, measured on its own footprint (`STALL` in `js/content/map.js`) | MAJOR | check `stalls`, `validate` |
| STALL-002 | Neighbours keep 1.2 m of clear ground between them; each faces its street; the spot a child taps is between it and the street, never on a road | MAJOR | check `stalls`, `validate` |
| STALL-003 | One market row per place (`MARKET_ROWS`, `rowSlot` in `js/content/map.js`): every stall of a place stands in it, on one side of the main street; none stands alone in a field (at most 12 m of open ground to its neighbour) | MAJOR | check `stalls`, `validate` |
| STALL-004 | Walking sellers keep to the footpath (`walkPath`): never on a road, never through a building or a stall, never more than 3 m off the street | MAJOR | check `stalls`, `validate` |
| NPC-001 | NPCs never block an entrance, never stand in a road corridor, never inside a solid | MAJOR | data + check `roads` |
| NPC-002 | Titles follow the language (`NAMES_EN/VI`); renames win everywhere | MAJOR | check `language` |
| ANIMAL-001 | Animals stay in their zone; never bite, fight or get hurt; tap = sound + bilingual name | MAJOR | review + data (zone) |
| VEH-001 | Vehicles keep to their road class (dirt: carts, bikes, cyclos ≤ 1 m/s; asphalt: buses, scooters ≤ 6 m/s), drive on the country's side, and wait for a child within 4 m ahead; they never knock anyone | BLOCKER | check `village` (Lotus Village bicycle and buffalo cart, round 30), `validate` |
| RIVER-001 | Bridges meet both banks at valid crossing points | MAJOR | data |
| RIVER-002 | Ferry and raft routes stay on water and stop only at piers | BLOCKER | check `features` (raft) + data |
| RIVER-003 | A rider is never left on water: a blocked route returns to a pier | BLOCKER | integration [IMPR] |
| RIVER-004 | Every bridge landmark spans its own water: most of the span is over water, both ends on land, the deck walkable (round T2) | MAJOR | check `bridges` |
| RIVER-005 | Every boat route stays in water deep enough for its hull and fits under every deck it passes (round T2) | BLOCKER | check `boats` |
| RIVER-006 | Every pier's land end joins a road or footpath (round T2) | MAJOR | check `boats` |
| RIVER-007 | Every boat the map gives two piers runs between them (the Sydney Harbour ferry; the Sài Gòn boat to Vũng Tàu, round T3) | MAJOR | check `boats` |
| RIVER-008 | The water map (round T4a): every river, lake and the sea in its own colour (Sông Hồng red-brown, the sea blue), deeper water darker, a foam line along every shore; still one water plane and one draw, the picture 1024 px or smaller, painted once and read back from the device on the next start | MAJOR | check `water` |
| RIVER-009 | Reeds along the banks and water hyacinth in the quiet waters (round T4a): two instanced meshes; none on a road, bridge deck or pier, hyacinth never on a boat route | MAJOR | check `water` |

### 9.6 Activities, UI, content, voice, privacy, Studio

| Id | Rule | Sev. | Validation |
|---|---|---|---|
| ACT-001 | Under-5 mode never punishes: no losing, no timers, no reading needed | BLOCKER | check `games` |
| ACT-002 | Every game: id, both languages, how-to film, Next/Stop at the end, tap outside to exit | MAJOR | check `games`, `phone` |
| ACT-003 | After an activity ends, nothing it created stays alive (timers, listeners, audio, DOM) | MAJOR | integration [IMPR] |
| ACT-004 | Games with friends are between the children only (r63, owner): no computer players join (Tiến Lên seats just the children, 2 to 4); the child who invites chooses the level (1 to 5) for everyone, and for Caro the board (3 × 3 to 19 × 19; squares stay 44 px, a big board scrolls) | MAJOR | check `friendgames`, `unit` (netgames) |
| UI-001 | Every player-facing text is bilingual (`T()` / `[en,vi]`) | BLOCKER | check `language` |
| UI-002 | No phone emoji anywhere (game, Studio, painted signs and labels): every emoji has a drawing (`js/art.js`) and `js/emojiswap.js` swaps any emoji on the page or painted on a canvas for it (owner, round R) | MAJOR | check `emoji noemoji` |
| UI-003 | Close/Save/Next always fully on screen at 320–390 px; no sideways scroll | BLOCKER | check `phone`, `spill` |
| UI-004 | Touch targets: every button a child taps is at least 44 × 44 px; under-5 answers and the Simple screen's pictures and bar at least 64 px; sizes are the same on every screen (round I) | MAJOR | check `a11y` |
| A11Y-001 | Reduced motion: Calm mode, or the device's own "Reduce motion" setting, stops every animation that repeats for ever and cuts confetti and fireworks; nothing flashes | MAJOR | check `a11y` |
| A11Y-002 | Readable captions: every spoken line is shown as words (also with the voice off), at least 16 px, contrast at least 4.5 : 1, on screen long enough to read (≥ 2.5 s) | MAJOR | check `a11y` |
| A11Y-003 | Simple paths: each Simple screen tab is one page that scrolls down: every category has its title, then its own short road of pictures, then the next category, like the Discover (Khám phá) page; on a phone held sideways the categories sit side by side and scroll sideways (Round V, owner 13 Oct; replaces Round U's category cards, which replaced bug #30's one long road); a game or story opens straight over the screen (never through the valley), one tap away on its category's road (Discover opens a category, both pictures), and the child is brought back to it afterwards; every screen has a picture way back (✕ or a bar button), no reading needed | MAJOR | check `simple` |
| A11Y-004 | Voice instructions: for under-5s every game says what to do when it opens (says it again), and the Simple screen says what each picture is (names in the recorded pack) | MAJOR | check `a11y` |
| A11Y-005 | Age modes keep the normal screen as it is: they change sizes, hints, voice and the start screen only (the valley's layout is the `contract` check) | MAJOR | check `contract`, `simple` |
| A11Y-006 | Few choices for the youngest: an under-5 sees each category of a tab under its own title with its own short road (Round V, owner 13 Oct; before, Round U's category cards, and before that one long road per tab, bug #30), only games made for under-5s, and every stop is a drawn picture (understood before reading a word) (round J) | MAJOR | check `adventure` |
| A11Y-007 | Every tap answers at once (the picture grows, bounces and sparkles, the name is said) and a second tap while it opens never starts it twice; big kids choose with two taps; the landscape and Ông Cú stand still in Calm mode (round J) | MAJOR | check `adventure` |
| UI-005 | One activity list (`js/content/activities.js`): every game sits in exactly one area with its youngest age and how hard it is; the Simple screen's path, Discover, search, "new" markers and Studio's Simple screen page all read it (round J); the path shows progress as stars only (no difficulty marker, owner) | MAJOR | check `adventure` |
| UI-006 | Every screen is checked on a phone (390 px), a tablet (820 px) and a computer before a round is reported, and looks tidy on all three: nothing spills, words never break in the middle, windows dim the game without blurring it (owner, round P: the family plays on all three) | MAJOR | check `phone` |
| STR-001 | Player-facing strings are `Text`, never bare strings | MAJOR | review + `language` |
| VOICE-001 | Recorded (downloaded) voices always first on every device; the device voice only for a line with no recording | BLOCKER | check `voice` |
| VOICE-002 | Every new spoken line goes into the pack in the same round; misses reach the Studio inbox | MAJOR | process + Studio Voices count |
| VOICE-003 | No child's name inside a pack line | MAJOR | `players.js` filter + review |
| PRIV-001 | No API keys or personal data in code or repo | BLOCKER | process + secret scan |
| PRIV-005 | Analytics (round L; everything the game sends back to Studio is called Analytics, in the game and in Studio) keeps only: per child the first name (round N, owner: no separate switch for names in the Grown-ups screen; "Analytics" switches everything off), age group, minutes, games, places and stories; the device's kind, system, browser and screen size; the town, state and country Netlify works out from the connection (never GPS, the address itself is never kept); errors in the game's own code and stuck spots by area; how long each start took (owner, 11 Oct, #36: up to 6 a day, ms to the game's code, to a built valley and to its first picture, whether it came from the saved copy, the slowest building step's name); nothing a child typed, no photos or voices; all of it off with "Analytics" | BLOCKER | check `studio`, `unit` (startup) |
| PRIV-002 | The hello sends only the whitelisted fields (handbook §10) and stops when switched off | BLOCKER | check `studio` (no names kept) + review |
| PRIV-003 | Every incoming network, backup, content or Studio payload is validated (type, size, range) before use. Network messages: `js/netmsg.js` (one schema per kind, size and rate limits, unknown kinds dropped) | BLOCKER | check `netmsg` (+ `multiplayer`, `cloud`, `knock`); backups/content/Studio: review [IMPR] |
| PRIV-004 | Online newcomers knock: until the room's starter lets them in they get nothing from the room (no names, moves, voices, photos) and their own microphone is off; a knock carries a name, a look and a key, never a photo; only saved friends come straight in, and only when they bring the key saved with the friend and open a number locked with it (round R privacy, 9 Oct); "No thanks" keeps them out of that room. Room codes have 6 digits, shown as digits and animal pictures only (the QR code was removed, owner round D) | BLOCKER | check `knock` (+ `multiplayer`, `cloud`) |
| PRIV-006 | Online play is off until a grown-up turns it on (Grown-ups → Internet and playing online → Use the internet, behind press and hold); while off the game makes no online connection of any kind (no PeerJS, no cloud relay, no friends' status or invitations) and the Friends tab says so with no Start or Join (owner, round R privacy, 9 Oct) | BLOCKER | check `onlineoff` |
| PRIV-007 | The cloud relay's room-code channel carries only knocks and the starter's answers, each locked for the one who knocked; all room traffic goes on a channel made from a random room secret handed, locked, only to players let in (a new secret when someone is removed); a guest meets only players the starter introduces; the starter's words (door, admit, full, nope, kick, members, rekey) are believed only with the starter's key (round R privacy, 9 Oct) | BLOCKER | check `knock`, `cloud` + review |
| PRIV-008 | Friends' status says only "playing now" and a token made fresh each session; names, places and room codes go only inside notes and invitations locked for one saved friend with the key saved when they played together (the add-friend button) (round R privacy, 9 Oct) | BLOCKER | check `meet`, `cloud` + review |
| PRIV-010 | Voices are made in Studio only (owner, 9 Oct): the child's device never calls an online speech service, keeps no voice key (an old `ttsKey` is deleted on load and from a restored backup) and never copies (clones) anyone's voice; a line with no recording uses the device voice and is noted as missing for Studio | BLOCKER | check `voice` + review |
| PRIV-011 | Landmark photos are the ones listed in `photos/index.json`, shown from where they live online, Wikimedia or Flickr and no other site, or from `photos/` when Studio had to keep a copy (owner, 17 Oct AEDT: "point photos to Wikimedia"; replaces 9 Oct "only from the game's own site"); without the internet the viewer says the photos need it, and a photo seen before still shows; the credit is words, never a link; Google's map and street view of a real place open only after a grown-up's press and hold, or straight away once a grown-up has turned on Use the internet in Grown-ups (owner, 10 Oct: "if parents enable internet use then in games should not be asking again") | BLOCKER | check `realphotos` (+ `together`) |
| PRIV-012 | Family photos are family-only (owner, 9 Oct): photo faces and Family album pictures are never public files of the website or files in GitHub; Sparkle Studio keeps them in the private family store (Netlify Blobs `family-photos`, or the exe's own folder outside the game) under random names of 24+ characters, `content/custom.json` names them `family:<name>`, and `/api/family/<name>` gives one only with the family code (header `x-family-code`, compared in constant time, 10 wrong codes lock a connection for 15 minutes, `Cache-Control: private`); the game keeps them in the `sv-family` cache, the service worker never caches `api/` | BLOCKER | `unit` (privacy) + check `familyphotos` + check `studio` |
| PRIV-013 | Sparkle Studio online: every admin signs in with two steps (password, then a TOTP code: HMAC-SHA1, 30 s, one step either side, a code taken once) unless the owner chose the password only for that account in Setup → Admins (owner, 9 Oct; two-step is the default, changing it signs that person out); the owner signs in with STUDIO_PASSWORD only (owner, 11 Oct), passwords of 12 characters or more (STUDIO_PASSWORD too, or signing in is refused with the reason), 10 wrong tries on an account or from a connection lock it for 15 minutes, every sign-in and every opening of the Analytics is in the access log (town and country only, never the address), and Sign everyone out ends every cookie and exe key | BLOCKER | `unit` (privacy) + check `studio` |
| PRIV-014 | The website's public doors are limited: `/api/hello` 60 requests a connection in 10 minutes; `/api/tester` 120 requests a connection in 10 minutes, 60 reports a device and 150 a connection a day (PRIV-016); missing lines 10 a hello, 30 a device a day, 60 a connection a day, 200 new lines a day; `/api/live` never names who changed it; counters keep a keyed hash of the connection, never the address | MAJOR | `unit` (privacy) |
| PRIV-015 | The microphone is off until the child turns it on (r63, owner): starting or joining a room never asks for it; the Mic button says Mic off or Mic on; its first tap asks (inside the tap, so an iPhone shows its question) and turns it on, the next turns it off | MAJOR | check `micoff` |
| PRIV-016 | Tester devices (owner, 12 Oct): only a device Studio's Releases page makes a tester (switch `tester`, every device or the ticked ones) that has accepted the agreement (shown once, both languages, saying what is collected) sends tester reports; they may keep the players' names, ages and progress, a picture of the screen and the last 30 seconds, with no grown-up gate (an exception to PRIV-002 and PRIV-005 for tester reports only; voice lines still never say a name); nothing is sent before "I accept", "Stop being a tester" stops it at once, `/api/tester` hears only devices the switch covers, and a device that is not a tester downloads none of it | MAJOR | check `tester` + `unit` (tester) |
| PERF-001 | First playable ≤ 8 s on a mid phone over 4G: ≤ 8 MB downloaded before the title screen; slow start-up work is kept on the device by build (`js/worldcache.js`: the map picture) | MAJOR | check `perf` (download, start-up times `G.bootTimes`, map picture read back) |
| PERF-002 | ≥ 30 fps at quality Auto | MAJOR | real devices (the test browser draws in software) |
| PERF-003 | < 250 draw calls and < 300k triangles a frame in a village (today about 360 in Lotus Village and 510 at home after the battery round, 12 Oct AEDT, and 0.6–0.8 M triangles: a ratchet that may only go down) | MAJOR | check `perf` |
| PERF-006 | Battery (owner, 12 Oct AEDT): the valley is drawn at most 60 times a second on a computer (30 on Graphics Fast), 30 on phones and tablets, 60 on Pretty, as fast as the screen only on Pretty+; the title screen 20; after 15 s with nothing moving (no input, every child and camera still, no friend online) 8 times a second until any input; on Auto the picture is never sharper than 1.5x the screen's pixels; the renderer asks for the everyday graphics chip, not the "high-performance" one; far people standing still are one shape; the voice download waits for a built valley and rests between batches; each device records frames, frame time, draws, sharpness, idle minutes and battery use (where the browser gives it) only with Analytics on | MAJOR | check `battery` |
| PERF-004 | Textures ≤ 1024 px; one new prop ≤ 2,000 triangles | MAJOR | check `perf` (textures); props: review |
| PERF-005 | Memory after 10 mini-games grows < 40 MB and no page elements are left behind | MAJOR | check `perf` |
| SAFE-001 | Safe for ages 2–8: no weapons, blood, scary faces, animal fights, real logos, phone numbers or addresses (G8) | BLOCKER | visual + review |
| STUDIO-001 | The exe and online Studio are one program and the same version as the game | BLOCKER | check `studio` |
| STUDIO-002 | Online saves of the family's files wait on the website until Publish (round P), which sends them all as one commit to the draft and then live; Publish copies only the family's files. The content pages (Message, Missions, Quiz, Our stories, Villagers, Story characters, Memory Villages, Simple screen, Defaults, Ads settings, photo links) are saved live at once instead (owner, 17 Oct AEDT, r81), checked and size-limited, with content/custom.json as the fallback | BLOCKER | check `studio` |
| SAVE-001 | Never overwrite safe copies when the main save is unreadable | BLOCKER | check `saves` |
| SAVE-002 | Every save section has a version and a migration from every older version | MAJOR | unit [IMPR] |
| SAVE-003 | A save referencing unknown ids loads with those parts dropped, never crashes | MAJOR | unit [IMPR] |

### 9.7 Rule registry [IMPR]
- `js/content/rules.js` (L1) exports `RULES = { 'ROAD-005': { text, severity, check, alias: 'R5' }, … }` — **built round F**, made from this section's tables by `tools/rules-from-doc.mts` (so the two never disagree; check `rules`). `js/validate.js` gives each problem its rule's severity.
- Checks and validators report by rule id.
- The handbook and HANDOFF cite ids.
- A test fails if a rule has no validation entry, or if a check names an unknown id.

---

## 10. Testing architecture [PROP]

| Level | Where | Runs in | What |
|---|---|---|---|
| **Unit** | `tests/unit/*.test.mjs` (`node --test`) [IMPR] | Node | L0 (ids, rng, geo, events), L2 generators and validators, save migrations, net schemas, voice selection, economy/progress logic |
| **World validation** | `tests/world/validate.mjs` [IMPR] | Node | `gen.world` + `gen.validate` on the default world and on the family content pack; must be 0 BLOCKER/MAJOR |
| **Integration (browser)** | `tests/run.mjs` [IMPL] | Playwright Chromium, desktop + phone | today's 20 checks (`boot`, `spill`, `language`, `two-players`, `games`, `features`, `camera`, `contract`, `multiplayer`, `roads`, `flat`, `roadshape`, `phone`, `solid`, `voice`, `studio`, `ground`, `saves`, `meet`, `cloud`) |
| **Architecture** | `tests/arch.mjs` [IMPR] | Node | import graph: layers (ARCH-001/002), cycles (ARCH-005); baseline today: 5 cycles, then must only go down |
| **Visual regression** | `tests/visual.mjs` [IMPR] | Playwright | fixed camera spots (junctions, gates, village centre, market, map, Grown-ups, Studio) at 1180×760 and 390×760; image diff + human review |
| **Performance** | `perf` in `tests/run.mjs` [IMPL] | Playwright + real devices | PERF-001/003/004/005 against `tests/perf-baseline.json` (ratchet); fps on real devices |
| **Types** | `types` in `tests/run.mjs` [IMPL] | TypeScript (`tsc`, no build step) | files starting with `// @ts-check` against their JSDoc (`tests/tsconfig.json`): state, netmsg, worldcache, studio core; more files join as they are touched |

### 10.1 Cross-system tests (each names its rules)

| Pair | Test | Rules | Status |
|---|---|---|---|
| Road ↔ Village | every named road end at a gate; inside a village the road takes its level | ROAD-007/008/013, WORLD-001 | [IMPL] `roads`, `flat`, `roadshape` |
| Road ↔ Building | no building or collider in a corridor; entrance access on the road side | ROAD-004, BUILDING-001/003 | partly [IMPL] `roads`; access [IMPR] |
| Building ↔ NPC | every NPC home exists; no NPC inside a solid or in a doorway | NPC-001, WORLD-007/009 | [IMPR] |
| Road ↔ Vehicle | vehicles on their road class; wait for a child 4 m ahead | VEH-001 | [IMPR] (when vehicles are built) |
| River ↔ Ferry | routes on water, stops at piers, a rider is never left afloat | RIVER-002/003 | partly [IMPL] `features` (raft) |
| World ↔ Navigation | every activity, entrance and landmark reachable from start | WORLD-010 | [IMPR] |
| Gameplay ↔ UI | completing an activity updates progress and coins exactly once; UI shows it; UI can't change them directly | ARCH-003, ACT-002 | partly [IMPL] `games`; [IMPR] |
| Save ↔ WorldState | save → reload restores profile, farm and coins; unknown ids dropped; old versions migrate | SAVE-001/002/003 | partly [IMPL] `saves`; [IMPR] |
| Studio ↔ Content ↔ World | a Studio edit passes the validator before Publish | STUDIO-001/002, WORLD-* | partly [IMPL] `studio` |
| Voice ↔ Audio | recorded line plays (Web Audio awake or asleep) | VOICE-001 | [IMPL] `voice` |

---

## 11. Existing-code audit

**Classification:**

| Class | Meaning |
|---|---|
| KEEP | Fits as is, maybe moved to its layer folder |
| REFACTOR | Same job, new seams (contracts, events, no `G`) |
| MERGE | Fold into another module |
| SPLIT | Separate data / generation / runtime / view |
| REPLACE | New implementation of the same behaviour |
| DELETE | Not needed |
| UNKNOWN | Not inspected deeply enough to decide; inspect in its migration step |

Metrics are from the r37 measurement (§1.1). No module is dead code, so nothing is DELETE today. Stylistic rewrites are not proposed.

### 11.1 App, core, platform

| Module | Class | Why |
|---|---|---|
| `js/main.js` (107 KB, ~95 `G` members) | **SPLIT** | Becomes `app/boot`, `app/loop`, `app/wiring`. Its gameplay pieces move to their systems:<br>• quests and rewards → `progress`<br>• NPC spawning → `actors`<br>• tap-to-go → `nav`/`player`<br>• friends → `net`/`ui`<br>• camera views → `render`<br>• `G` shrinks to `services` |
| `js/util.js`, `js/build.js`, `js/packhash.js` | KEEP | Small, pure (L0) |
| `js/gfx.js` | KEEP | three.js helpers (L4 render) |
| `js/input.js` | KEEP | Input devices (L4) |
| `js/state.js` | **SPLIT** | `settings` (L3) and `save` (L3, versioned sections and migrations). The safe-copy logic is kept as is (SAVE-001) |
| `js/i18n.js` | KEEP | `T()`, names registry (L1/L0) |
| `js/custom.js` | KEEP | Family content pack loader (L1 `content`) |
| `js/install.js`, `js/credits.js`, `js/extras.js` | KEEP | UI features (L4) |

### 11.2 World, terrain, roads, placement

| Module | Class | Why |
|---|---|---|
| `js/world.js` (82 KB) | **SPLIT** | 1. Data (`CITIES`, `ROADS`, `RIVER`, places, `SHRINES`, `TOWERS`) → `content/places.js`, `content/roads.js`<br>2. `heightAt`, `LEVELS`, fillets → `gen/terrain.js`, `gen/roads.js`<br>3. Trees, rocks, grass, shrines and towers placement → `gen/placement.js`<br>4. Meshes, sky, water, `paintMap` → `render/world.js`<br>5. `groundAt`, `collide`, platforms, updaters → `world`/`physics` |
| `js/roads.js` | **SPLIT** | `profile()` (heights) → `gen/roads.js` (pure); ribbons, verges, gates → `render/roads.js`; gate data → content |
| `js/solids.js` | KEEP (move) | Already a clean service (`physics` solid map) with a cache; later fed from WorldData footprints and models instead of scanning the scene [IMPR] |
| `js/worldedit.js` | REFACTOR | Becomes the "family edits" pass inside `gen.world` (edits WorldData, not the scene); ids replace circles where possible |
| `js/cities.js` (63 KB), `js/regions.js`, `js/town.js`, `js/asia.js`, `js/heritage.js`, `js/suburbs.js`, `js/regionsites.js`, `js/homes.js`, `js/houses.js`, `js/places.js`, `js/symbols.js` | **SPLIT** (each) | Each mixes three layers:<br>• hand-placed data → content catalogues (places, building types, NPC defs)<br>• placement → `gen.placement` (one free-spot solver for all)<br>• mesh builders → `render/models/*`<br>• interactions → `interaction` registrations by id<br>This is where P2 (hand coordinates) lives |
| `js/realworld.js` | KEEP | Photo references and Street View links (content + UI) |
| `js/weather.js` | REFACTOR | State to `world`, view to `render` |
| `js/festivals.js` | REFACTOR | Data → content; the activity → `activities`; decorations → render models (today emoji sprites, against UI-002) |
| `js/gather.js` | REFACTOR | Uses its own `SOLID` copy of the world; moves to `gen.placement` + `interaction` + `economy` |
| `js/secrets.js`, `js/kite.js`, `js/fun.js` | REFACTOR | Small features writing `G` directly; `fun.js` is in an import cycle with `ui.js` |
| `js/showcase.js` | REFACTOR | Sets 14 `G` members; belongs to `render` camera + `ui` |

### 11.3 Actors and travel

| Module | Class | Why |
|---|---|---|
| `js/avatar.js` | KEEP | Character models and faces (render models) |
| `js/animals.js` | KEEP | Animal models and animation (render models) |
| `js/pets.js` | REFACTOR | Pet state → `progress`; behaviour → `actors`; view → render |
| `js/hawkers.js`, `js/chatter.js`, `js/folkshow.js`, `js/vnfun.js` | REFACTOR | NPC behaviours (routes, chatter, schedules, plays) → `actors` behaviours with data in content |
| `js/ferry.js` | REFACTOR | Crossing data → content/gen; boats → `ferry` system; view → render |
| `js/player.js` | REFACTOR | Movement and physics → `player` + `physics`; camera → `render` |

### 11.4 Activities, progress, economy

| Module | Class | Why |
|---|---|---|
| `js/games/frame.js` | REFACTOR | Becomes the `activities` frame with an explicit lifecycle and cleanup (ACT-003); its cycle with `howto.js` ends via `HowToRequested` |
| `js/games/*.js` (13 files, 67 games) | KEEP | Behind the `GAMES` registry; touched only to meet ACT-002/003 |
| `js/howto.js`, `js/tales.js`, `js/talesdata.js`, `js/cartoon.js`, `js/art.js`, `js/icons.js` | KEEP (`icons.js` → **MERGE** into `art.js`) | Presentation of activities; drawn art. `icons.js` (35 lines of SVG icons) overlaps `art.js` |
| `js/learn.js` | **SPLIT** | Story time, counting hunts and the rest timer: activity logic → `activities`/`progress`; views → `ui` |
| `js/story.js`, `js/passport.js` | REFACTOR | → `progress` (listens to events) |
| `js/farm.js` | **SPLIT** | Farm model (crops, growth, shared purse) → `economy`/`progress` (saved); fields and plants → render |
| `js/trade.js`, `js/money.js` | KEEP (→ `economy`) | Already logic-focused |
| `js/snacks.js` | **MERGE** into `economy` | Ends the `ui ↔ snacks ↔ regions` cycles |
| `js/data.js`, `js/words.js`, `js/words2.js` | KEEP (→ content) | Pure data |
| `js/ads.js` | KEEP | Off unless the Studio enables it; view + content |

### 11.5 Voice, audio, net, UI

| Module | Class | Why |
|---|---|---|
| `js/voice.js` | REFACTOR | Keep the behaviour (VOICE-001, fixed in round 30). Split pack, family and device providers behind `voice.say` (no cloud provider on the device: PRIV-010); diagnostics stay |
| `js/audio.js` | KEEP | Web Audio graph, unlock (L4) |
| `js/recorder.js`, `js/listen.js`, `js/commands.js` | KEEP | Family recording; speech recognition; voice intents (`commands` → emits intents, not `G` calls) |
| `js/net.js`, `js/relay.js` | REFACTOR | Keep the transport. Add one message-schema module (types, size and rate limits, validation, PRIV-003) and emit events instead of calling `G` |
| `js/players.js` | KEEP | Already isolated; switch to events (`ActivityStarted`) instead of `countPlay` calls from `main.js` |
| `js/chat.js` | KEEP | Villager chat (offline + optional key) |
| `js/ui.js` (109 KB) | **SPLIT** | Screens into `ui/screens/*` (title, who, Pad tabs, Grown-ups, dialogs, wardrobe, quick settings). Gameplay changes in it move to commands. Layout and markup unchanged (PROC-002, `contract`) |
| `js/hud.js` | REFACTOR | HUD view reads queries and events only |
| `js/weather.js` | (see 11.2) | |

### 11.6 Outside the game

| Module | Class | Why |
|---|---|---|
| `studio/core.cts`, `studio/studio.cts`, `studio/ui/*` | KEEP | One engine for the exe and online (STUDIO-001). Later [IMPR]: import `gen` + `gen.validate` (pure ESM) to validate edits instead of the hidden-iframe snapshot |
| `netlify/functions/*`, `netlify/lib/players.mts` | KEEP | Small, tested (`studio`) |
| `tools/*` (voice pack, harvest) | KEEP | — |
| `sw.js` | KEEP | Offline strategy (voices, saves, manifest cache-first) |
| `tests/run.mjs`, `tests/harness.mjs`, `tests/studio-check.mjs`, `tests/world-audit.mjs` | KEEP | Grow with §10 |
| `css/style.css` | KEEP | UI frozen (PROC-002) |
| Agent worktrees under `.claude/` | n/a | Local only, ignored by git |

---

## 12. Migration plan [IMPR]

**Principles:**
- **Strangler pattern:** new seams wrap old code; old paths are removed only when the new path is proven by tests.
- **No step changes what a child sees or hears.** Before/after screenshots must match except where a hard-rule fix is intended.
- Each step is one round: suite before and after, local commit, report, "yes, push" (PROC-001).
- Steps 0–3 are low risk and unblock everything else.

| Step | What | Done when | Risk |
|---|---|---|---|
| **0** done | Adopt this document. Add `tests/arch.mjs` (import graph, layer map, cycle count as a ratchet: may only go down) and `js/content/rules.js` (§9.7) with checks reporting rule ids | `arch` passes at baseline (round 30: **2 circle groups, 6 files**: fun ↔ regions ↔ snacks ↔ ui, frame ↔ howto; `tests/arch-baseline.json`); every rule has a validation entry. *Done:* `tests/arch.mjs` + check `arch`; `js/validate.js` reports rule ids. *Still to do:* the layer map and the rules registry | none |
| **1** done | **Core** (done round E: `js/core/{ids,events,rng,geo}.js`, `G.events`, `util.js` passes the maths and seeded random on unchanged; events PlayerEntered/LeftVillage, ActivityStarted/Completed/Abandoned, LanguageChanged, plus StickerEarned/PostcardEarned/HomeDecorated; checks `unit`, `events`): `js/core/{ids,events,rng,geo}.js`. `G.events = core.events`. The first events (`ActivityStarted/Completed`, `PlayerEnteredVillage`, `LanguageChanged`) are emitted **in addition to** today's calls | unit tests in Node; suite green | low |
| **2** done | **Break the cycles** (done round F: `js/popups.js` (modal, dialog, reward, confetti), `js/vendors.js`, `js/games/registry.js`; `arch` at 0, check `names` guards moves): snacks → economy; `fun ↔ ui`; `frame ↔ howto` via `HowToRequested`; `regions → ui` | `arch`: 0 cycles | low |
| **3** | **Content extraction (data only):** move `CITIES`, `ROADS`, `RIVER`, places, `SHRINES`, `TOWERS` from `world.js` into `js/content/*`; `world.js` re-exports them (no behaviour change) | Node can import the world description; suite green | low |
| **4** | **Pure generation:** `gen/terrain.js` (`heightAt`, levels, beds), `gen/roads.js` (fillets, profile from `roads.js`). Unit tests in Node; `tests/world/validate.mjs` for WORLD-001/003/004 and ROAD-002/003/004/005/007/008/013 in Node (seconds instead of minutes) | the same numbers as the browser checks; suite green | medium (heights must match exactly: compare 20,000 samples before/after, as was done for `roadDist`) |
| **5** | **Entity registry + ids:** `entities` with ids for places, roads, landmarks, buildings with names, NPCs with names, interactables (existing ids reused, ID-002). `interaction` reads the registry | WORLD-008/009 validators; `features` + `games` green | medium |
| **6** | **Placement solver:** one `gen.placement` with free-spot search used by new placements first, then by each place module in turn (cities, regions, town, asia, heritage, suburbs, gather), each in its own round. Rendering moves to `render/models/*` | per module: before/after screenshots identical or rule-fixing; `roads`/`solid`/`ground` green | medium–high (biggest step; done module by module) |
| **7** | **Services instead of `G`:** `app.services` with contracts; modules declare dependencies; `G` members become thin forwards, then disappear. `ui.js` split into screens; gameplay changes go through commands | the `G` member count ratchets down to 0; `contract` unchanged | medium |
| **8** | **Activities lifecycle:** `activities` system around `games/frame.js`; cleanup checks (ACT-003) | new `activities` check: open/close every game and nothing is left | low–medium |
| **9** | **Save sections and migrations:** per-system `snapshot/restore/migrate`; unit tests with saved fixtures from r30+ | SAVE-002/003 unit tests; `saves` green | medium |
| **10** done | **Net schema** module and validation tests (done round 30: `js/netmsg.js`, check `netmsg`); emitting events comes with step 1 | PRIV-003 tests; `multiplayer`/`meet`/`cloud` green | medium |
| **11** | **Studio uses `gen` + `gen.validate`** for the map editor and before Publish (the checker exists from round 30: `js/validate.js`, check `validate`; the Studio does not call it yet) | `studio` check extended | low |
| **12** | **Actors / vehicles / ferry** as systems (prerequisite for the approved Phase 2 buffalo cart, VEH-001) | integration tests for VEH-001, RIVER-003 | medium |

**Order with the owner's design phases:**
- Design **Phase 2 (Lotus Village)** can start after step 3. New objects go through ids and the placement solver from day one, so they don't add to P2.
- Phases 3–5 can follow, interleaved with steps 6–12.

---

## 13. Proposed project / file structure [PROP]

```
index.html  sw.js  manifest.webmanifest  netlify.toml  package.json
css/  fonts/  icons/  vendor/  videos/  voices/  photos/  content/          (unchanged)
js/
  core/        ids.js  events.js  rng.js  geo.js  result.js                       L0
  content/     places.js  roads.js  buildings.js  npcs.js  animals.js  activities.js
               rules.js  strings/ (i18n.js, words*.js, data.js, talesdata.js)  custom.js   L1
  gen/         terrain.js  roads.js  placement.js  world.js  validate.js            L2 (pure; also used by studio and tests)
  runtime/     world.js  entities.js  physics.js (solids.js)  nav.js  player.js
               interaction.js  actors/ (npc.js, animal.js, vehicle.js, behaviours/)
               ferry.js  activities.js  economy.js  progress.js  save.js
               settings.js  voice/ (pack.js, family.js, cloud.js, device.js, index.js)
               net/ (net.js, relay.js, schema.js)  players-count.js                L3
  render/      renderer.js  world.js  roads.js  water.js  sky.js  camera.js
               models/ (houses, cities, landmarks, avatars, animals, boats, props)  L4
  ui/          screens/ (title, who, pad/*, grownups, wardrobe, quick, dialog)
               hud.js  art.js (+icons)  cartoon.js  howto.js  tales.js  theatre/     L4
  audio/       audio.js  music.js  sfx.js                                           L4
  input/       input.js  listen.js  commands.js                                     L4
  games/       frame.js (activities frame)  *.js (unchanged)                        L3/L4
  app/         boot.js  loop.js  wiring.js  main.js                                 L5
studio/  netlify/  tools/  docs/ (ARCHITECTURE.md, SO-TAY-THIET-KE.md)
tests/   run.mjs  harness.mjs  arch.mjs  unit/  world/  visual/  perf/
```

**Moves are done in the migration step that changes the module,** never as a big renaming commit. Every move updates `sw.js` `FILES` (PROC-004).

---

## 14. Risks and unresolved decisions

### 14.1 Risks

| Risk | Mitigation |
|---|---|
| Height or placement changes while extracting generation shift the world by centimetres and break roads, levels or the solid map | Sample-compare before/after (20,000 points, exact equality) for every extracted pure function; keep the old function until equal |
| The placement solver moves objects (step 6) and the children notice | Solver seeded from today's coordinates as "preferred spots"; screenshots must match; only rule-breaking objects move |
| Two architectures coexisting for many rounds | The `arch` ratchets (cycles, `G` member count, layer violations) only go down; this document's §12 table is the checklist |
| Independent chats diverge | This file is the contract. A chat that changes a contract updates this file in the same commit, with the date |
| Tests slow on the build machine (browser checks take minutes each) | Move world rules to Node validators (step 4); keep browser checks for behaviour |
| Over-abstraction in a no-build JS codebase | Contracts are plain objects + JSDoc. No framework, no DI container, no classes required |

### 14.2 Unresolved decisions [OPEN] (owner)

1. ~~ROAD-003 grade limit~~ **decided: 8 % asphalt / 12 % dirt**, no tight-spot allowance.
2. ~~ROAD-001 footpaths~~ **decided: yes**, the 1.6 m class in Phase 2.
3. ~~Types~~ **decided: yes** (`// @ts-check` + JSDoc, check `types`; started with state, netmsg, worldcache, studio core).
4. ~~Resume spot~~ **decided: a child comes back where they were.**
5. ~~Performance budgets~~ **decided: hard rules** PERF-001…005 (§9), check `perf` as a ratchet; the village draw-call gap (≈1,300 vs 250) needs its own round (static batching).
6. ~~Online safety~~ **decided and built:** knocking (the child starter lets in), saved friends straight in, 4 digits + animals. The QR code was removed (round D), so no per-room secret; no grown-up sum before the photo share sheet.
7. ~~Studio exe Publish~~ **decided: through the draft branch**, like online.
8. ~~Generation caching~~ **decided: store on the device.** First step (round D): the map picture, the slowest start-up step, in the `sv-world` cache by build (`js/worldcache.js`); start-up ≈ 8.8 → 4.5 s in the test browser. WorldData itself follows once `gen.world` exists (step 4).
9. ~~Migration pace~~ **decided: one architecture step per round.**

### 14.3 Internal consistency check (done for v1.0)

| # | What was checked | Result |
|---|---|---|
| 1 | Every system in §2.2 has a contract in §8 or is covered by a combined one (`gen.*` → 8.1/8.2; `settings`, `content`, `players-count`, `studio` → 8.17) | done `ui` is 8.8b; `input` and `audio` are L4 device adapters covered by 8.15 and the dependency table |
| 2 | Every dependency in §3.1 respects the layer order in §2.1 (no L3 → L4; `voice → audio` is L3 → L4) | Exception is deliberate: `voice` reaches `audio` only through a playback **port** (an interface `app` injects), so the import direction stays L4 → L3. Recorded here so it is not read as a violation |
| 3 | Every event in §6 has a publisher that owns the state it announces | done |
| 4 | Every rule id in §9 is unique; aliases G/R map one-to-one; the handbook's numbers still hold | ROAD-003 is explicitly [OPEN], not weakened done |
| 5 | Every [IMPR] in §9–§11 has a migration step in §12 | done (perf → [OPEN] 5) |
| 6 | No new gameplay requirement is introduced | Vehicles (VEH-001) come from the approved design-rules Phase 2 (buffalo cart); co-op activities and stickers were requested by the owner (round 30) done |
