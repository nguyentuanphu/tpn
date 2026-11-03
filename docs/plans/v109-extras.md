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
