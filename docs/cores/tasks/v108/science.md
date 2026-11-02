# v1.08 helper: science (status)

**ready for Release**

**Status: done** (branch `work/v108-science`, from `origin/release/v1.08`). Times AEDT.

## Plan (3 Nov 2026, 08:00 AEDT; the owner's go for the round covers it)

Twelve new science experiments in Học vui › Khoa học (`hv_sci`), so the corner goes from 6 to 18 games:
Grow a Plant, Water Cycle, Day and Night, Four Seasons, Animal Homes, My Body, Mixing Colours, Ice Melts,
Rainbow Light, Light the Bulb, Gears Turn, Recycle Sort.

- Each plays like the first six (guess, try, why): the child guesses, then does the experiment (taps or drags the
  thing or a tool: the calendar, the Sun, the gap in a circuit, a bin), sees it happen, hears why. After the last
  round a fact line is shown and said (English and Vietnamese).
- Levels: under-5 and Easy 3 rounds of 1 thing with 2 choices; Medium 4 rounds, harder things, more choices; Hard 5
  rounds; Talent 3 rounds of 3 things guessed before any is tried, hardest things and most choices.
- Our own drawings: `js/art/science2.ts` (12 game pictures and about 50 pictures for the things and choices); other
  things use emoji already drawn in `js/art.ts`.
- Guide films (the TV button): `js/games/science2-meta.ts`, 4 steps each plus a "For real" step.
- Places in the valley (the pin): `js/content/science-places.ts`, existing places only (nothing moved or added on
  the map); the first six science games get a place too.
- Checks: the `hocvui` check plays all 12 to a win at Easy and Talent and checks Talent shows more than Easy.
- Voice: every new line recorded with Azure.

## Files

New: `js/games/science2.ts`, `js/games/science2-meta.ts`, `js/art/science2.ts`, `js/content/science-places.ts`.

Shared files, small changes (each marked `(v1.08 science)`):
- `js/content/activities.ts`: 12 GAME_INFO entries, one block at the end.
- `js/games/catalog.ts`: 12 catalogue entries and the `science2.ts` loader, one block each after the existing ones.
- `js/art.ts`: one import line. `js/games/registry.ts`: one import line (the guides).
- `js/main/talks.ts`: one import and `|| SCIENCE_PLACES[id]` in `G.gameSpot` (World core file; no place moved).
- `js/games/science.ts`: the shared helpers are exported, and `experiment()` takes an optional fact line (the first
  six games are unchanged: they pass none).
- `tests/checks/learning.mts`: the `hocvui` check lists the 12 new games.
- `.gitignore`: the two new built `.js` files (written by `tools/build.mts`).

## Progress and checks

- 3 Nov 08:20 AEDT: `node run.mts hocvui` pass (360 s): all 20 Học vui games won by real taps at Easy and Talent;
  each new game shows 1 thing at Easy and 3 at Talent.
- Screenshots looked at: all 12 on a phone (390 x 844) at the guess, try and fact steps; Gears, Day and Night and
  Grow a Plant on a tablet (820 x 1180) and a computer (1280 x 800). No page errors.
- `tools/emoji-audit.mts`: 0 undrawn emoji.
- Voices: 1736 Azure files (434 lines x 2 voices x 2 languages) with `tools/make-voice-pack.mts --engine azure`;
  431 Lê Minh (FPT) Vietnamese clips from the reviewed batches `docs/voice-recording-delta/v108-science-1.json` and
  `-2.json` with `tools/record-public-voice-delta.mts`. No line has a child's name.
- `suite.mts --changed` picked the full suite (`.gitignore` changed). By the round rule (Release, 3 Nov AEDT) the
  full suite is **left for Release**; the checks covering this change were run alone with `--only`, 3 Nov AEDT:
  hocvui pass, guides pass, voicecover pass, voiceroutes pass (it failed until the FPT clips were recorded),
  contentpair pass, contentvoice pass, contentart pass, boot pass, games pass (249 games), phone pass, contract pass,
  hubmap pass, padmap pass, simple pass, playhub pass. Online checks: not run (nothing online changed).
- Commits: 2bd2aba9 (games), c48983c1 (Azure voices), eae542e6 (FPT voices), and this status file.

## Owner's decisions

- 3 Nov 2026 AEDT (via Release): all 12 science games go into v1.08 ("Làm hết vào 1 vòng").

## Open questions

None.
