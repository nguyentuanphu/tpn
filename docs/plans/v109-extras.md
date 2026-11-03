# v1.09: lighter offline and the waiting items (owner, 3 Nov 2026 AEDT)

The owner asked how offline can use less bandwidth, and what else should go into v1.09. Chosen by pop-up.

## Lighter offline

Today the voices are MP3 at 32 kbps, mono. With the male voices set aside, the female English voice is about 157 MB and the female Vietnamese voice about 138 MB. The core lines come first on any connection, then the rest area by area on Wi-Fi; mobile data needs a grown-up's yes (`js/voicepack.ts`, `voices/areas.json`).

1. **Voices in Opus.**
   - Every recording is also made as Opus (about 16–20 kbps, mono), about 40–50% smaller at the same quality.
   - Devices that cannot play Opus keep the MP3. The game picks one by asking the browser what it can play (`canPlayType`).
   - The voice pack, the offline helper (`sw.ts`), the pack maker and the voice checks learn the second format.
   - MP3 stays on the site for older devices.
2. **Three offline levels in Grown-ups:**

   | Level | What it keeps |
   |---|---|
   | **Light** (Nhẹ) | The core lines and the area the child is in, about 30–50 MB. |
   | **Automatic** (Tự động, the default, as today) | The rest area by area on Wi-Fi. |
   | **Full** (Đầy đủ) | Everything, for trips. |

   The level shows how much space it uses. Moving to a smaller level frees the space.

Not chosen this time:
- only the child's language plus auto cleaning;
- the device voice reading missing lines.

## Waiting items joining v1.09
- **A light first download and a valley that builds as the child walks:**
  - the first download back under 1030 KB;
  - the child walks in after the essentials;
  - areas are built as the child comes near (tasks #25, #32, #39, #41).
- **The open bugs:**
  - games that would not open (24–25 Oct reports, #507–556, #577, #566 stale chunk);
  - #350 rules, #375 tester report screen, #355 white screen on restart, #341 slow frames, #652, #634;
  - the game-rules audit across all games.
- **Roads and dirt roads redrawn to the Concept D drawings** (#34).
- **A faster Studio:** the first page (summary) opens fast, the heavy pages load after a date is chosen, one shared fetch.

## Downloads on demand, festivals ahead (owner, 3 Nov 2026 AEDT, pop-up)
- New areas, features and games download when they are switched on and the child goes there.
- **Festival packs download ahead.** A festival pack is its decorations, its festival game and its voice lines. It downloads on Wi-Fi a few days before its decorations go up, so it is ready offline on the day.
- **After the festival:**
  - on the Light level the pack is removed, and it downloads again next year;
  - on the Full level it is kept.
- The Full level downloads everything already open.

## The lantern story to Tết (owner, 3 Nov 2026 AEDT, pop-up)

**Built today:**
- the Prologue ("The Lanterns Blow Away");
- Chapter 1, Lotus Village;
- Chapter 2, Hà Nội;
- Chapter 3, Sydney;
- the yard side story.

**In v1.09**, each one released by date in the release calendar. The order was changed by the owner (3 Nov 2026 AEDT, pop-ups). Christmas and New Year had no chapter, so they now share one, and Season 2 is not China Town and India:

| Chapter | What happens | Release |
|---|---|---|
| Chapter 4: the end-of-year festive season, Christmas to New Year's Eve, in both countries | **Australia:** a summer Christmas in Sydney (Santa on a surfboard, carols by candlelight), then the harbour fireworks at 9 pm and midnight. **Vietnam:** the cathedrals in Sài Gòn and Hà Nội, Hàng Mã street's lights and the nativity scene, then the countdown at Hồ Gươm. Each friend makes a New Year wish. | Early December, with the Christmas decorations (4 Dec) |
| Chapter 5: Huế, Đà Nẵng, Melbourne and Uluru | The dragon bridge breathing fire, lantern boats on the river; the tram ride, a desert night of stars, Uluru at sunset, the Australia Day picnic | January |
| Finale: Tết | Sài Gòn and the whole valley: every landmark lit, the flower street, lì xì, fireworks | Tết, about 6 Feb 2027 |

The chapters use the new friends and villagers. Each has an under-5 path, a festival film and a keepsake, like chapters 1–3.

**Season 2, after Tết, is not China Town and India Village.** It explores more of Vietnam and Australia (a later round):
- Vietnam: the Mekong floating markets, Hạ Long Bay, the Sapa rice terraces, the Central Highlands gongs;
- Australia: the Great Barrier Reef, Tasmania, Perth and Rottnest.

Each region brings its food, games, festivals and new friends.

## How far today's content reaches
- **Festivals:** every year, by their own dates. They never run out.
- **The feature schedule in `content/custom.json`:** its last batch is 26 Dec 2026.
- **The 111 games and 54 stories held back:** they stay as they are (opened by playing or by Studio's switch), as the owner chose.
- **The lantern story:** it currently ends at Chapter 3. With v1.09 it goes on to Tết 2027.

## TypeScript everywhere (owner, 3 Nov 2026 AEDT: "Make sure everything is built in ts")

**Checked on integrate/v108:**
- Every source file of the game, Studio, the website server, the service worker and the tools is TypeScript (795 files).
- The `types` check now reaches every game file. `js/games/fruitparade-core.ts` and `js/games/art-pending.ts` were added to `tests/tsconfig.json` (commit 4ac41d7fb).

**In v1.09 (owner, pop-up):**
- Type checking for the test code: `tests/`, 205 files, today TypeScript but not type-checked.
- Type checking for the marketing video code: `marketing/source`, 17 files.
- The website's navigation script moves out of the string templates in `docs/website-review-20261023/navigation.mts` into `home/site.ts`, so it is type-checked like the rest. It is the 10 KB inline script in `home/index.html`.

**Stays plain JavaScript, on purpose:**
- the 1 KB browser guard in `index.html`, which must run on old iPads to tell the family the device is too old;
- `studio/ui/lame.min.js`, a third-party MP3 encoder kept as its own file.
