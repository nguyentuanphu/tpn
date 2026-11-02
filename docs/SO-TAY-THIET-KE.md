# Sổ tay thiết kế · Sparkle Valley Design Handbook

The one place for **how Sparkle Valley must look, sound, behave and be built**. Every round (human or AI) reads it with `HANDOFF.md` before changing anything.

- **HARD** means never broken without the owner saying so in writing.
- **Checked by `x`** means a test in `tests/run.mjs` fails if the rule is broken. A new rule should get a check whenever it can be measured.
- Rules marked **(to decide)** are proposals the owner has not chosen yet: ask before building them (HANDOFF rule 14).

Sources merged here:
- the owner's ground rules (HANDOFF §0);
- the owner's "Vietnamese Village Hard Prompts" (round 30, G0–G11, R1–R12);
- the measurable rules the game already enforces;
- the useful parts of an outside technical assessment (round 30, reviewed in §14).

---

## 1. Who it is for · Dành cho ai

- Children aged **2–8**, girls and boys, playing in **English and Vietnamese**, on phones, tablets and computers, alone, with a sibling on the same screen, or with family online.
- **One world, two depths:**
  - **Little ones (2–4, "under-5 mode")**: explore, tap, hear, discover. No reading needed, no losing, no timers.
  - **Big kids (5–8)**: the same places with more to do: counting, reading, puzzles, building, quests.
- A child should be able to **start, explore, finish an activity and come back without a grown-up explaining anything**.

## 2. Style · Phong cách (G0, G1, G9)

**G0 Style anchor**: put this at the top of every art or feature brief:
> Colourful polished Vietnamese village game art, soft warm afternoon lighting, clean toon shading with soft dark-brown outlines (#3a2a20), chunky rounded shapes, harmonious saturated pastels (pink #ff6fae, purple #8a5cf6, leaf green #43c463, gold #ffb020, sky #29b6f6, paper cream #fff6e4), no clutter, readable silhouettes, friendly for children aged 2–8.

- **G1 Toon:** `toonVC()` / MeshToonMaterial + `outline()`; rounded shapes; no realistic or PBR textures; no sharp spikes at child height.
- **G9 Detail = silhouette and colour, not polygons:** small props ≤ ~2,000 triangles; repeats use InstancedMesh; everything works at quality "Fast".
- **2D pictures (menus, icons, tales):** drawn SVG in `js/art.js`: 48×48, outline `#3b2a4f`, chunky, a small gentle animation that stops in calm mode. **HARD: no phone emoji on screen**: every picture goes through `pic()` / `labelArt()` / `sprite()` (HANDOFF rule 13).
- **G8 Safe:** no weapons, blood, scary faces, animal fights, real logos, phone numbers or addresses. House 8 shows only "8" (HARD, rule 7).
- Calm, not flashy: no strobing, no fast camera swings, few things animating at once near the child.

## 3. Scale and placement · Tỉ lệ và vị trí (G2, G4, G6, G7, G11)

- **G2:** 1 unit = 1 m.
  - People: child 1.6 m (3 heads tall), adult 2.0 m, grandparents 1.8 m and slightly bent.
  - Doors are at least 1.4 × 2.4 m; steps are at most 0.4 m.
- **G4:** everything stands on the ground (`heightAt` ± 0.05 m). Footprints are levelled (`FOOTPRINTS`, `levelUnderBuildings`). Every village, town and city is one flat level (**HARD**, checked by `flat`).
- **G6:** fronts face the nearest road or yard; the place to tap is on the road side.
- **G7 Interactables:** a floating icon, a ~2.5 m tap radius, one main action. They never sit inside something solid (checked by `solid`).
- **G11 No clutter:**
  - at most one big focal object per 10 m of street;
  - at least 40 % open ground;
  - nothing blocking a walking line.
- **Solid world (HARD, round 30):** nobody walks through houses, walls, fences, rocks, kiosks, statues or furniture.
  - `js/solids.js` makes a 0.5 m solid map from the real meshes; `world.collide` uses it.
  - New things need nothing extra, as long as they are still meshes. Things that move use their own round colliders.
  - Checked by `solid`.

## 4. Roads · Đường (R1–R12, G5)

| Rule | What | Checked |
|---|---|---|
| R1 | Classes, constant width end to end: asphalt 6.4 m (owner, 10 Oct), dirt 3.4 m, footpath 1.6 m | (footpaths to build) |
| R2 | Continuous curvature, no zigzags; min radius 10 m asphalt / 6 m dirt / 3 m footpath; no S-bends within 15 m. **Done with true circular arcs (fillets 24 m / 16 m)**, not Chaikin | `roadshape` (no step turn > 8°) |
| R3 | Surface on the ground (never > 0.3 m above it); grade limits | `roadshape`, `ground` (see §13: limits to decide) |
| R4 / G5 | Corridor `w/2 + 1.5 m` clear: no props, trees, rocks, grass, flowers, pickups, NPC spots; trees ≥ `w/2 + 2.5 m`; buildings 2–4 m back | `roads` (colliders, boxes, interactables, grass and flowers) |
| R5 | T-junctions: a side road leaves at **60–120°**, stops at the main road's edge, straight ≥ 6 m; Y only for an even split; one plain asphalt patch | `roads` (angle of every side road) |
| R6 | Outside towns only T-junctions; junctions ≥ 20 m apart; parallel roads ≥ 12 m apart; no crossing without a junction | (to add) |
| R7 | A named road end = its gate (0 m gap); surface runs 2 m through the gate; gate square, opening ≥ road + 1 m each side; bilingual sign ≥ 0.8 m letters | `roads` (gate on every named end) |
| R8 | Every village and city reachable by asphalt; dead ends only at a gate, landmark or pier; real geography north → south | `roads` |
| R9 | River crossings within ± 20° of square, straight ≥ 6 m each side; nothing on bridge decks | (to add) |
| R10 | Lines only on asphalt, plain at junctions; zebra crossings only in towns | visual review |
| R11 | Pond footpaths 1.5–2.5 m from the water, gaps end at a bench, pier or bridge | Phase 2: done (Lotus Village, checks `village`, `validate`) |
| R12 | Soft edges: a 0.3–0.5 m blend from road to grass, flowers along the verge | visual review |

- **HARD (round 29):** roads are straight runs joined by perfect curves, run straight into every gate, have every change of slope rounded, take the village's level inside it, and never fill the river.
- A test for a new road rule must be shown failing on the old world before the fix (as with R5 in round 30: 45°, 42° and 50° before; 66°+ after).

## 5. Places, buildings, people, animals · Làng, nhà, người, vật

- **Village houses (Vietnam):**
  - curved red tile roof with a small thatched porch;
  - warm wood or ochre walls with a small painted flower panel;
  - stone base, potted flowers, a short bamboo fence;
  - nothing modern in villages.
  - Cities keep their own types (tube houses, villas, weatherboards, Queenslanders).
- **Kiosks:**
  - fixed 2.4 × 1.6 m, or a wooden push cart 2.2 × 1.2 m on two wheels; counter 0.9 m;
  - in Vietnam: a red-and-yellow striped canopy, red, yellow and green paper lanterns, and ≤ 3 baskets of fruit;
  - a bilingual handwritten-style sign with letters ≥ 0.25 m;
  - along street sides, never in the road.
- **Market day (chợ phiên):** 3–6 cloth-awning stalls, aisles ≥ 3 m, one product per stall.
- **Vehicles:**
  - on dirt roads and footpaths, only buffalo carts, bicycles with baskets, and cyclos, at ≤ 1 m/s;
  - on asphalt, only buses and scooters (riders in helmets), at ≤ 6 m/s; keep right in Vietnam, left in Australia;
  - every vehicle waits for a child within 4 m ahead and never knocks anyone.
- **Animals:**
  - buffalo, hen, dog, cat, duck…: happy faces, big eyes, flat toon colours;
  - they never bite, fight or get hurt;
  - tap = sound + bilingual name.
- **People:**
  - áo bà ba, farmer clothes, nón lá; warm skin tones; gentle idle poses;
  - bilingual titles follow the language (Bà/Grandma: `NAMES_EN` / `NAMES_VI`);
  - never caricatured; they never block an entrance.
- **Village landmarks:** cây đa, giếng nước, sân đình: a banyan with a small shrine at its foot, a stone well with a tiled roof, and the village gate on its anchor. Be respectful near shrines.
- **River:**
  - a đò with a rower in nón lá, thuyền thúng, and lotus near the banks (never in ferry lanes);
  - piers ≥ 6 m with rails and a life ring;
  - children never drown; the raft lets them choose a destination.
- **Culture:** names, food, games, clothes and buildings are checked against real references and never mixed carelessly. A short spoken explanation is offered, never a forced lesson.

## 6. The two age profiles · Hai lứa tuổi

| | Little ones (2–4) | Big kids (5–8) |
|---|---|---|
| Moving | Tap-to-go and the joystick; easy camera from above | Same, plus explorer camera |
| Text | Never needed; every label is spoken | Short text + voice |
| Activities | Notice → tap → discover → hear → try again; one thing at a time | Multi-step tasks with optional hints |
| Mistakes | Never punished: no losing, no fail screens, no timers | Real challenge allowed, always "try again", never shaming |
| Rewards | A smile, a flower, a sound, a sticker | Milestones, stamps, hats; never streak pressure |
| Quests | None required | Clear start, visible goal, hints, stop and come back |

- The **under-5 mode** decides it (`little`), the same world for both.
- **(to decide)**: an explicit profile switch per child with its own defaults, and gentle adaptive help (a demo after 3 misses).

## 7. Text and language · Chữ và ngôn ngữ (G3)

- **HARD:** every text is bilingual: `T('English', 'Tiếng Việt')`; 3D signs take `['EN', 'VI']` and redraw on `onLang()`. Checked by `language`.
- Lines for little ones are **short** (aim ≤ 12 words), warm and concrete: "Mango! Quả xoài!"
- Vietnamese is natural Vietnamese, not word-for-word translation; titles and kinship words are right (ông, bà, cô, chú, con).
- Names the family renamed (Studio, `names`) win everywhere; `swapNames()` applies them before speaking.
- Never put a child's name into a line that goes into the voice pack (it would change the line's hash).

## 8. Voice and sound · Giọng và âm thanh

**HARD (rounds 29–30): the downloaded, recorded voices are the voice, on every device.**
- **Order:** a family recording of that exact line → the recorded pack (`voices/`, Azure) → a natural online voice with the grown-up's key → the device's own voice **only** for a line with no recording.
- **On iPhone and iPad:**
  - sound is woken on every tap until it works;
  - if Web Audio is still asleep, a primed plain audio player plays the same recording;
  - the voice list is served from the saved copy at once (slow phone data never means the phone voice);
  - Grown-ups shows why a recording could not play (`voiceDiag`).
  - Checked by `voice`: a recorded line never uses the phone voice, also with Web Audio asleep.
- **Every new spoken line goes into the pack in the same round:** `tools/voice-harvest.mts`, then `tools/make-voice-pack.mts --engine azure`.
  - Lines a device still says with the machine voice reach Sparkle Studio's **inbox** by themselves (never a line with a child's name).
  - One click records them.
- **Voices:** a woman's voice for women, girls and grandmas, a man's for men, boys and grandpas. Grandparents a little slower, children a little higher.
- The whole pack is kept on the device after the first visit (the child's language first), so it works offline.
- **Sound effects are synthesised** (no files), soft and short, never harsh "wrong" buzzers for little ones. Music is calm; calm mode lowers it.

## 9. Screens and controls · Màn hình và nút (G10)

- **HARD (rule 1):** the existing UI stays as it is: layout, colours, fonts, icons, button order, tabs, texts. New things go alongside. The `contract` check fails if the structure changes; re-record only when the owner asked for that UI change.
- Touch targets ≥ 56 px for main buttons (aim 56–72), well apart, never hugging the screen edge. Close/Save/Next always visible on a 320–390 px phone (checked by `phone`, `spill`).
- Every screen can be left with one obvious button, or by tapping outside. Leaving never loses progress.
- **Test desktop and phone side by side, every round** (HARD, rule 12): `phone` check + screenshots at 390 × 760 touch and 1180 × 760.
- Accessibility: calm mode (also turned on by the device's "Reduce motion"), text size, captions (≥ 16 px, contrast ≥ 4.5 : 1), touch targets ≥ 44 px (≥ 64 px for under-5s), spoken instructions for under-5s. **Decided (owner, round I):** the "simpler controls" switch is the **Simple screen**: a path of big pictures, one tap to play, under-5s start on it and every child can switch either way. Rules A11Y-001…005 in ARCHITECTURE §9.6.

## 10. Data, privacy and safety · Dữ liệu và an toàn

**HARD:** no API keys or personal data in the code or the repo (rule 6). Keys live:
- in the grown-up's device settings;
- in `%APPDATA%\SparkleStudio` for the exe;
- in Netlify environment variables online.

What may leave the device:

| What | Where | Rule |
|---|---|---|
| Player count hello | `/api/hello` (Netlify Blobs) | Random id, build, language, number of profiles, minutes, games started, stories opened, device type, installed, minutes with friends, ≤ 15 machine-voice lines without names. **Never** names, photos, places or anything typed. Off switch: Grown-ups → Advanced → Count players. **Offline play is not lost:** it waits in a small outbox on the device (per day, ≤ 14 days) and is sent when online, counted on the day it was played; a batch keeps its one-time id until the website confirms it, so a re-send counts once |
| Online play | PeerJS + cloud relay | Room code is a meeting point, **not** a secret, so **newcomers knock** (round 30): the room's starter sees the name and picture and taps Let in / No thanks; until then the newcomer gets nothing from the room and their microphone stays off. **Saved friends** (friend code on the list) come straight in. The code stays 4 digits, also shown as 4 animal pictures (0 dog · 1 cat · 2 bunny · 3 bear · 4 frog · 5 monkey · 6 duck · 7 elephant · 8 turtle · 9 fish) (the QR code was removed in round D); the join pad has a numbers/animals switch. Photos have their own pair lock (ECDH); every message is checked before use |
| Backups | The family's own Drive/iCloud | Never to our server |
| Studio online | GitHub (draft branch) | Behind `STUDIO_PASSWORD`; only `content/ voices/ photos/ tools/voice-extra.json` can change |

- Every incoming thing (network messages, backups, content packs, Studio requests) is checked for type, size and range before use.
- No ads aimed at children unless the Studio switches them on; a link opens only after a grown-up sum. No purchases, no streaks, no "come back!" pressure.
- **Decided (round 30):** knocking + saved friends straight in; 4-digit codes kept (animal pictures as the other way to enter them; the QR code was removed in round D). Still known: the cloud relay's lock comes from the room code, so someone who has the code could read room messages on the public brokers (not photos); with no QR code there is nowhere to carry a per-room secret, and the owner accepted this.

## 11. The world as data · Thế giới là dữ liệu

- **Define each thing once and use it everywhere.** Places: `CITIES`, `VILLAGE`, `TOWN`, …; roads: `ROADS`; flats: `LEVELS` / `FLATS` / `FOOTPRINTS`; landmarks: `LANDMARKS`. These feed the 3D world, the map (`paintMap`), the Studio map editor and the tests.
- Things are placed with a free-spot search (no collider, box or interactable within r; outside the road corridor).
- A family change (Studio `world.build / edits / land`) goes through the same rules and tests.
- **(to decide, recommended):** one world validator that runs in tests and in the Studio Map page:
  - duplicate IDs;
  - missing translations;
  - things outside the world;
  - unreachable activities;
  - NPCs inside buildings;
  - bridges without a valid crossing;
  - map markers with no world object.

## 12. Building and releasing · Xây dựng và phát hành

- Plain JavaScript modules, three.js, no build step, no new dependency without a clear reason. Netlify functions are the only server code.
- **One version everywhere:** `js/build.js` BUILD = the end of `sw.js` VERSION = `studio/version.json` (checked by `ground` and `studio`). Bump them every round; add new files to `FILES`.
- **Sparkle Studio** is one program in two places:
  - the exe (`studio/studio.cts`) and online (`/studio/`, `netlify/functions/studio.mts`);
  - the same pages (`studio/ui`) and the same engine (`studio/core.cts`);
  - rebuild the exe whenever `studio/` changes (checked by `studio`).
- **HARD (rule 2):** the AI never pushes or opens a pull request without the owner's "yes, push". Each round:
  1. the suite runs before and after;
  2. before/after screenshots;
  3. a local commit;
  4. the Netlify zip;
  5. a report;
  6. wait.
- The owner's own Studio Publish is the owner's explicit action. Online it saves to a draft first. **(to decide):** make the exe save to the same draft branch too, so both work the same way.
- **Definition of done:**
  - it works on phone and desktop in both languages;
  - nothing else changed;
  - data checked;
  - resources cleaned up;
  - save compatibility kept;
  - offline OK;
  - checks pass, with a new check for anything new that can be measured;
  - version bumped;
  - HANDOFF updated;
  - a rollback path exists (the previous Netlify deploy, or git revert).

## 13. Decisions still open · Cần chủ quyết định

**Decided by the owner (round 30, 4 Oct):**
- **Road grades: 8 % asphalt / 12 % dirt** (R3 as written). The `roadshape` check enforces exactly this, with no "tight spot" allowance; steep spots are flattened instead.
- **Footpaths (1.6 m): yes**, in Phase 2 (villages, round ponds).
- **Online safety:** newcomers knock, saved friends come straight in, 4 digits kept with animals (QR removed in round D); **the child who started the room taps "Let in"**.
- **Studio exe Publish goes through the draft branch**, like the online Studio.
- **Resume spot:** a child comes back where they were.
- **Voice pack:** the whole pack is downloaded, the child's language first (recorded voices are always the default).
- **What next:** Phase 2 and every unfinished item, one round at a time, the plan shown before each round.

**Decided by the owner (round D, 4 Oct):**
- **No QR code**: the room code is digits and 4 animal pictures only (so no per-room secret in it, and no in-game QR scanner).
- **No grown-up sum before the photo share sheet.**
- **Welcomes are text**, not voice (entering the valley, a village, a house); a talk box or the chat closes by itself when the child walks 6 m away.
- **Two age groups, split at 5** (details left to us): under-5s still see every game, card and strategy games too, and keep money and prices; they get bigger answer buttons and, after 10 s or two misses, the right answer wiggles; games are already gentler for them (no losing). **Only a grown-up changes difficulty** (Grown-ups → the child's card: age and Easy / Medium / Hard). Each game's own level still rises as the child wins; the owner can ask for that to stop.
- **Type checking: yes** (`// @ts-check` + JSDoc; check `types`).
- **Performance budgets are hard rules** (§15.1, PERF-001…005; check `perf`). Lotus Village is far over the draw-call budget today (≈1,300 vs 250): the check is a ratchet and a performance round brings it down.
- **Store the generated world on the device: yes** (first: the map picture, by build; start-up ≈ 8.8 → 4.5 s in the test browser).
- **One architecture step per round.**
- Watch a pull request only when the owner asks, and ask first.

**Still open:** nothing from the round-30 list.

## 14. Review of the outside assessment (round 30)

**Agrees with ours, already done:**
- the stack (JS + three.js, no rewrite, no engine change);
- offline PWA;
- the voice-first pack;
- no unnecessary dependencies;
- road and building rules backed by checks;
- Studio local-server checks (localhost Host and Origin only, safe paths, size limits);
- no-punishment under-5 mode;
- no streaks or dark patterns;
- desktop + phone testing.

**Right, and worth doing (in order):**
1. **Online safety:** a 4-digit room code is not a secret.
   - HANDOFF §7 already says so.
   - **Done (round 30):** newcomers knock and the starter lets them in (PRIV-004, check `knock`); the owner chose to keep 4 digits, with animal pictures (the QR code was removed in round D). Rate and size limits per message: `js/netmsg.js`.
2. **One world validator** (§11) running in tests and in Studio.
3. **Mini-game lifecycle:** `js/games/frame.js` is the shared frame. Add a test that opens and closes every game and checks nothing is left behind (timers, listeners, sounds).
4. **Save schema:**
   - saves carry `v: 2` and keep daily copies;
   - add explicit migrations and a test that loads an old save.
5. **Explicit age profiles** (§6) and adaptive hints.
6. **Performance budgets on a real phone:**
   - first load;
   - frames per second;
   - memory after 10 mini-games.
7. **Release discipline for Studio:** the online Studio already saves to a draft; the exe could do the same (§13.6).

**Where we disagree, and why** (the reasoning, so future chats don't re-open these without new facts):

**14.1 It reviewed HANDOFF, not the code.**
- The assessment says so itself: "based on the HANDOFF.md description, not a verified, line-by-line review of the source code". Several of its "inspect this" items are already done:

| It asks for | Already in the code |
|---|---|
| Validate every incoming network message | ids, looks, friend codes and positions from others are checked before use (`net.js`) |
| Protect photo exchange | photos have their own pair lock (ECDH, `relay.js`) |
| Constrain the Studio local server | localhost Host and Origin only, safe paths, size limits (`studio/studio.cts`) |
| Versioned saves | `v: 2` plus three safe copies; **migrations** are the real gap (ARCHITECTURE SAVE-002) |
| No punishment for little ones | under-5 mode: no losing, no timers (checked by `games`) |

- **What it got right that we had missed:** the road grade numbers disagreed (10/14 % rule vs 12.5/15.5 % allowed by `roadshape`). Settled in round 30: 8 % / 12 %, enforced exactly.
- **Lesson:** an outside review of documents is useful for finding gaps, but every item must be checked against the code before work is planned.

**14.2 TypeScript completion: approved, in progress (owner, 19 October 2026 AEDT).**
- The owner approved the [combined bug-fix and TypeScript plan](plans/bugs-typescript-20261019.md). This supersedes the earlier choice to keep plain JavaScript with JSDoc in risky modules.
- Convert remaining first-party game, world, content, UI, Studio, tooling, tests and marketing sources in bounded batches. Fix reported bugs in the affected subsystem first. Make an unchanged-content rename commit before type or behaviour edits.
- The existing browser build converts TypeScript to the JavaScript paths loaded by the browser and service worker. Build before checks or packages; include converted sources in explicit type-check configurations. Preserve IDs, saves, map coordinates, rules and EN/VI.
- Syntax conversion and full strict checking are separate deliverables. Do not hide errors with broad any types, suppressions or unchecked casts. Keep runtime validation at persistence and network boundaries. Add coverage/inventory ratchets as described in the plan.
- Generated JavaScript, reviewed vendor code, HTML/CSS, media and appropriate shell/Python scripts retain their normal formats. Approval of migration does not choose a version or approve deployment.

**14.3 "No analytics": the owner chose an anonymous counter; we built it to the spirit of the advice.**
- The advice is a sound default for a children's game, but the owner asked to know how many children play (round 29) and chose option B (round 30). Following the assessment literally would overrule the owner.
- **Built to respect both:**

| Concern behind the advice | How ours handles it |
|---|---|
| Profiling a child | One random number per device; no name, photo, place or IP address |
| Behaviour tracking | Totals only (minutes, games started, stories opened); no clicks, paths or answers |
| Parents not in control | Off switch: Grown-ups → Advanced → Count players |
| Data piling up | Per-day device records deleted after 60 days |
| Hidden data flow | The exact whitelist is a hard rule (ARCHITECTURE PRIV-002) and tested |

- **What the advice rightly warns about:** fields creep over time. Adding anything to the whitelist needs the owner's approval.

**14.4 "Don't auto-download voice packs": it contradicts the owner's HARD rule (VOICE-001).**
- **The worry is fair:** the pack is ~85 MB (139 MB on disk); a full download on mobile data or a small phone is a real cost.
- **Why we can't follow it:** the owner's rule is that downloaded voices are always the voice, never the phone's. The round-30 iPhone bug is exactly what happens when a recording isn't there in time. A small core pack would mean the phone voice for every line not yet downloaded.

| Option | Data used | Recorded voices offline | Risk of phone voice |
|---|---|---|---|
| A. Whole pack after the first visit, child's language first (**today**) | ~85 MB once | everything | lowest |
| B. Only the child's language; others on request | about half | their language only | low, unless the language is switched or bilingual mode is on |
| C. Small core pack, the rest when first needed (assessment) | least | only what was already used | high offline and on slow data |

- **Recommendation:** A (today), or B to save data. **C breaks VOICE-001** and must not be built without the owner changing that rule. This is §13.5.

**14.5 Where we agree** (already planned in `docs/ARCHITECTURE.md`):
- keep JavaScript and three.js, with no big rewrite;
- one source of truth for the world;
- a world validator;
- a standard mini-game lifecycle;
- save migrations;
- clear age profiles;
- performance measured on real phones;
- online-room safety (newcomer approval, longer codes).

The disagreements are about *how* in this particular game, not *whether* these things matter.

## 15. More rules recommended for consistency · Đề xuất thêm luật

Proposals; the owner decides.

1. **Performance budget (HARD, owner round D; PERF-001…005, check `perf`):**
   - first playable ≤ 8 s on a mid phone over 4G;
   - ≥ 30 fps at quality Auto;
   - < 250 draw calls in a village;
   - textures ≤ 1024 px;
   - one new prop ≤ 2,000 triangles;
   - a `perf` check records these every round.
2. **Asset rule:** every photo, sound or picture records its source and licence (photos already do); no file > 600 KB without a reason; names are predictable.
3. **Mini-game rule:**
   - every game has an id, both languages, a how-to film, an under-5 version (no fail), Next/Stop at the end, and cleans up after itself;
   - a `games` check opens and closes each one.
4. **Text rule:**
   - under-5 lines ≤ 12 words;
   - the Vietnamese is checked by a native speaker (the owner) for anything cultural;
   - new names go through `registerName()`.
5. **Network rule:** every message type has a size limit, a rate limit and a validator. Nothing from another device goes into the page without escaping.
6. **Save rule:** every new saved field has a default and survives loading an older save; never delete a save without a copy.
7. **Studio rule:** the exe and online are one version (checked); every action that changes the live site asks "Are you sure?"; keys never leave their place (device, `%APPDATA%`, Netlify env).
8. **Bug rule:** a bug found on a phone gets a check that reproduces it before it is fixed (as `voice` and `solid` in round 30).
9. **Screenshot rule:** fixed camera spots for before/after (junctions, gates, village centre, market, map, Grown-ups, Studio), same size, desktop and phone.
10. **Round rule:**
    - one round = one branch and one pull request;
    - the report lists what changed, how it was tested, what could not be tested, and the open suggestions;
    - the owner chooses (rule 14).


## Owner-approved interface and feature rules · 14 October 2026 AEDT

The owner approved writing these rules at 9:03 am AEDT. They apply to new work and the repair round described in docs/cores/tasks/owner-ui-audit-20261014.md. Existing violations are tracked work, not evidence of compliance. This section is the canonical specification; CLAUDE.md and HANDOFF.md link here. No deployment is authorized by approving these rules.

- **UX-001 HARD — Stable windows.** Welcome, player selection, Pad, settings, shops, wardrobe, reporting, activity and Studio panels use stable outer shells. No vertical entrance/exit movement, bouncing or recentering as content loads/changes. Anchor header and primary actions; scroll the body; reserve footer space. Keyboard, rotation, safe areas, fonts and long EN/VI text must not cover controls or lose access. World/character animation remains separate.
- **UX-002 HARD — Shared components.** Reuse established shells, trays, tabs, collapsible groups, item cards, confirmations and sizing/colour tokens. New feature-specific styles cannot bypass their layout/accessibility contracts. Normalize visible artwork size, not just the SVG box.
- **UX-003 HARD — Child readability.** EN/VI labels and appropriate spoken guidance; readable contrast and text. Tap targets at least 64 px for under-5 controls and 44 px otherwise. Discrete icons retain generous hit areas. Never use colour or an unexplained icon as the only state cue.
- **UX-004 HARD — Explicit navigation.** Each activity retains entry origin, category and scroll state. Hub launch returns to its hub; NPC launch returns to the valley. Pad tools remain inside the Pad shell. Only one competing transient tray/confirmation is active; overlays must have a predictable accessible Back/Close action.
- **UX-005 HARD — Immediate, recoverable startup.** Show a lightweight Welcome before heavy world work. Resource progress reflects real stages/counts; optional packs do not block mandatory readiness. Handle cold, cached, offline, interrupted and previous-version updates. Preserve saves and apply updates at a safe restart, with a small understandable notice.
- **UX-006 HARD — One reporting flow.** Autoplay failures and manual ladybird reports share durable local queuing, backend receipts and deduplication. Show Queued/Sending/Sent/Retry accurately; Sent requires server acknowledgement. Capture the composed game/interface at the failing moment. File export is optional, never a required parent step. Retest against the version containing a fix; reporting is not a guarantee of automatic fixing.
- **UX-007 HARD — Understandable Studio.** Every control states purpose, scope/device selection, current value and when Save/Apply takes effect. Explain defaults, disabled/loading/empty/error states and reset consequences. Essential help is visible on touch devices; advanced detail may expand. Custom access immediately exposes the permissions list; permissions are enforced server-side.
- **UX-008 HARD — Explicit feature and testing policy.** Optional functions have understandable Studio enable/disable controls. An explicit owner disable overrides previously-used feature retention for the chosen scope. Compass guidance starts hidden for this round and is controlled by the existing wayfind switch. Testing/autoplay settings and Keep/Restore policies are selectable per device, state exactly what rewards/data remain, and cannot silently change ordinary play progress. Fast checking is separated from normal-speed performance validation.
- **UX-009 HARD — Stable data.** Use persistent IDs rather than display names for identity/binding. Preserve saved purchases, ownership and progress through compatible migrations. Private family data is separate from GitHub code; hosting moves require explicit backup/migration rather than assumed automatic transfer.
- **UX-010 HARD — Demonstrated release quality.** Each feature brief names owners, dependencies, affected screens, shared contracts, entry/exit paths, failure recovery, migration and resource budgets. Use existing changed-check/full-suite policy in CLAUDE.md, relevant meaningful tests, and visual/device review. Check EN/VI, phone/tablet/computer, portrait/landscape, keyboard, overlap and cold/warm/offline/update behaviour where applicable. Record failures/skips and uncovered device cases. Do not loosen checks merely to pass or declare zero bugs from automated passes.

Enforcement status: specification approved; automated coverage and physical-device verification must be mapped during implementation. Do not label these rules already checked by a test until that coverage is implemented and verified.


## Website, parent reports and game consistency (owner, 23 October 2026 AEDT)

[Binding website/game rules](website-review-20261023/WEBSITE-RULES.md) and [exact Release handoff](website-review-20261023/RELEASE-HANDOFF.md): four main destinations, full EN/VI details, shared game art/fonts/tokens and one release source with regeneration/review gate. Explain existing parent controls and child reports without exposing saves or inventing educational scores. Keep Website on Welcome; move the in-play HUD Home entry into Settings and lift the quest bar only where measured geometry permits. The design branch has no runtime changes; Release must integrate, test and obtain release approval.


## Game levels: every game has all four (PROPOSED, v1.07 levels helper, 2 November 2026 AEDT; for the owner to confirm)

Status: proposed, not yet confirmed by the owner. Until the owner confirms it, treat it as the target for new work.

- **LV-001 PROPOSED - Four levels.** A new game joins Play only when Easy, Medium, Hard and Talent each play differently, in something the child can see or feel: more choices, a bigger board, faster speed, less time, fewer helper hints, a smarter computer player, more rounds. Easy and Talent never play the same; at least three of the four levels differ.
- **LV-002 PROPOSED - Gentle under-5s.** Under-5s always play the gentlest settings (the Easy values), cannot lose, and never see Talent (owner, 1 Nov 2026 AEDT).
- **LV-003 PROPOSED - Written down and checked.** The game writes the numbers it uses for its level on its stage as `data-lv` (for example `api.stage.dataset.lv = [choices, size, speedMs].join(',')`), using `api.smart` (0 Easy, 1 Medium, 2 Hard, 3 Talent; 0 for under-5s), `api.talent` and `api.tier()` from `js/games/frame.ts`. Its row in [the level tables](levels/README.md) says what each level changes. The check `levelsall` opens every game at all four levels and fails a game whose levels are the same.
- **LV-004 PROPOSED - Exceptions are named.** Free-play pads with no goal (drawing, music pads) may keep one setting; they are listed with the reason in `levelsall` and in the level tables.
