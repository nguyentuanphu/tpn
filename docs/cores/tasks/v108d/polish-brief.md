# Helper brief: polish (everything left for later)

**Owner, 5 Nov 2026 AEDT:** "everything that you say left for later round". The leftovers below are collected from the helpers' status files in `docs/cores/tasks/v108b/`.

## Part 1 (one 5-hour window): the friends' leftovers (see `friends.md`)
- **Items in the hand earned from each friend's quests:** Finn's compass, Sol's sun crystal, Clara's flower staff and Lumi's star lantern.
  - Each friend gets a short quest of 3 steps in the valley, in EN and VI.
  - The model carries its item only once the quest is done. Today it always carries it.
- **Shoes from the shop** swapped onto the friend models.
- **Studio:** a "Vietnamese / Australian" kind choice for villagers on the new villager page. Coordinate with the Studio redesign that is already merged.
- **Crowds:** they use the new villager heights and proportions (today they keep their own scales).
- **Checks:** `friendmodel`, `wearfit`, `friendoutfits`, `studio`, `perf`, new `frienditems`.

## Part 2: the games' leftovers (see `games.md`)
- **Richer hands-on versions** of the new picture-quiz games where a hands-on game teaches better. Two to start: wrapping bánh chưng for Tết (fold the leaves, place the filling, tie the string) and a maze builder for the thinking corner.
- **Checks:** the games' checks, `gamefit`, `fivescreens`.

## Part 3: small leftovers
- **Old voice files:** remove the 136 old mixed-line files that `tools/make-voice-pack.mts` wants to delete, and re-record the two empty Vietnamese files `voices/vi/f/2473f892-1b292ac5.mp3` and `e67396f8-2132059d.mp3` (Azure, female).
- **Checks:** `voicearea`, `voicecover`, `voicepack`, `voiceopus`.

## Part 4 (added 5 Nov from the games helper's notes)
- **Học vui on a phone:** the 8 learning-journey rows fill the whole first screen. Fold them into one row, "Hành trình học / Learning journeys", that opens the list, so the corners show first.
- **The calendar:** for a festival game outside its season, show "Sẽ quay lại vào … / Back at …" with `backOn('fg_' + festivalId)` from `js/content/festseason.ts`.
- **`roundvariety` fails on lemonade:** make its rounds differ.
- **Checks:** `hocvui`, `learningquests`, `calendartab`, `roundvariety`, `fivescreens`.
