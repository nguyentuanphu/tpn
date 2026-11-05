# Helper brief: quality (five-screen check, TypeScript everywhere, parents: report, Lumi guide, play together)

Branch `work/v108b-quality`. Plans: `docs/plans/five-screens-check.md`, `docs/plans/v109-extras.md` ("TypeScript everywhere"), `docs/plans/links-rollout-install.md` part 5 ideas chosen by the owner (learning report by subject with difficulty by subject; Lumi as the guide and the voice of news; play together with Mum and Dad and a gentle play time).

Do:
1. **`fivescreens` check:** every switched-on game (each age group), every guide film, every tale film page and every story page at phone portrait 390x844, phone landscape 844x390, tablet portrait 820x1180, tablet landscape 1280x800 and computer 1440x900. Fails when anything is outside the screen or scrolls, text is under 16 px, a touch target is under 44 px (64 px for under-5s), or things overlap; saves a picture on failure. Split into parts so the full suite stays about 30 minutes. Then fix the shared parts first: the game frame in landscape (two columns, picture beside answers), the film player (subtitles and buttons on a short screen), the story book; then the few games that draw their own layout. Phone landscape is fully playable (owner's choice), never a "turn your phone" hint.
2. **TypeScript everywhere:** type checking for `tests/` (205 files) and `marketing/source` (17 files) in the `types` check; the website navigation script moves out of `docs/website-review-20261023/navigation.mts` templates into `home/site.ts` and is type-checked (the 1 KB browser guard in `index.html` and `studio/ui/lame.min.js` stay as they are, on purpose). Fix what the checker finds at the root.
3. **Learning report by subject** in Grown-ups: what the child practised this week in Vietnamese, English, Maths, Science and Money, what went well, one game suggested for next week; shareable as a picture. **Difficulty by subject:** the level follows the child per subject (strong in Maths, new to English); the parent's setting still wins.
4. **Lumi as the guide:** Lumi welcomes new children, explains new things, carries the week's news, and is the voice of the Simple screen (recorded lines, EN and VI, female voice).
5. **Play together:** a "Chơi cùng bố mẹ / Play with Mum and Dad" list of games two people can play on one device, with a short guide for the grown-up. **Gentle play time:** a parent-set play time with a soft goodbye from Lumi ("Hẹn mai chơi tiếp nhé!"), never a hard cut mid-game.
6. **Roads and dirt roads redrawn to the Concept D drawings** (#34; `docs/concept-d/`, `docs/roads-concept-d/`): `js/roads.ts`, with `roads` and `solid` checks (moved here from the platform helper, 5 Nov).
7. **Checks:** `roads`, `solid`, `fivescreens`, `types`, `arch`, `learningreport`, `subjectlevel`, `lumiguide`, `playtogether`, `playtime`, plus `phone`, `gamespace`, `gamefit`.

## Added by the owner, 5 Nov 2026 AEDT: spawn camera and stuck flights

Screenshot: `docs/plans/owner-20261105/spawn-owl-blocks.jpg`.

1. **The owl blocks the view at spawn** (owner: "when the user spawn in, the owl blocks it, better to move the camera angle to look at the owl instead").
   - When a child first appears (start of play, after loading a save, after Welcome), the camera stands behind the child and looks towards Grandpa Owl. The child and the owl are both in view, with the owl in front, not between the camera and the child.
   - The same rule applies when the goal is "Talk to Grandpa Owl" and the child is placed beside him.
   - New check `spawnview`: at spawn the child and the owl are both on screen, and no large object covers the child, on phone, tablet and computer.
2. **Flying to a destination gets stuck behind bus stations** (owner: "when you fly to another destinations often it gets stuck behind a bus station, better to audit and check all").
   - Audit every fly-to target: map pins and "Go there", every game place and host, quests, the Simple screen's Places, the calendar's tap-to-fly, chapters and landmarks.
   - For each target, the landing spot must be open ground (not inside or behind a bus stop, shelter, sign, fence, wall or building).
   - The child must be able to walk away from the landing spot, and the camera must see the child with nothing covering them.
   - Fix the landing spots and the shared landing code (the nearest open ground facing the target), not one by one.
   - Bus stops and shelters: check their colliders and the open ground around them.
   - New check `flyaudit`: every fly target is landed on in the running game and checked for open ground, a walkable way out and a clear camera view. Keep it fast enough to stay in the full suite; split it if needed.
   - Coordinate with the games helper, which adds places for every game: run your audit over their places too once their branch is ready.
