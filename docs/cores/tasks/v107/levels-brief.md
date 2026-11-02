# v1.07 brief: levels

Name: levels. Branch: work/v107-levels.

Focus 2 of the owner's plan (docs/plan-hoan-thien/KE-HOACH.md): the same levels in every game. v1.06 built the core:
- Bands: Easy 1-2, Medium 2-3, Hard 4-5, Talent 5 plus each game's extra challenge.
- `api.smart` (0-3) and `api.talent` in `js/games/frame.ts`.
- The checks `levelsa`, `levelsb` and `gamelevel`.

This round:
1. Write `docs/levels/`: one table for every game in Play (name, what Easy, Medium, Hard and Talent change, for example number of choices, board size, speed, time, helper hints). Read each game's code; do not guess. This is the standard for checking games and for making new ones. Add the rule "a new game must have all four levels" to the design handbook (docs/SO-TAY-THIET-KE.md), marked as proposed for the owner to confirm.
2. Each game writes its level numbers (choices, board size, speed...) to the game frame, for example in a data attribute. Then add one check that opens every game at all four levels and fails if two levels are the same for a game where they should differ. Under-5s always play gently: the check knows that.
3. Fix games whose levels do not differ (the plan says about 30 change very little). Keep each game's fix small and in that game's file.
4. Talent stays hidden for under-5s (owner's decision).

Coordinate by files: the typescript helper renames `.js` files; most games are already `.ts`. If a game you need is still `.js`, edit it and say so in your status file; Release merges the two.
