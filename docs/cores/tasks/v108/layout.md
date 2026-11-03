# v1.08 helper: layout (fit one screen, level and stars on the title row)

**Status: in progress** (3 Nov 2026 AEDT). Branch `work/v108-layout`, from `origin/fix/v108-startup-art`.

## Plan
1. **Level and stars on the title row** (`js/games/frame.ts`, `css/style.css`): the level button and the star box move
   from the guide row into `.gl-head`, between the round dots and the guide film (TV). The guide row is the question
   alone. On a phone (600 px wide or less) the round dots sit just under the row so the name keeps its room; under-5s on
   a phone (64 px buttons) keep the game's picture and leave out the written name (the voice says it).
2. **Fit one screen, no scrolling** (`js/games/frame.ts` `fit()`): the stage already grew a small game to fill a
   tablet (at most 2.4x). It now also shrinks a game that is taller or wider than the playing area, on every screen
   (phone too), down to 0.62x at most so a choice stays a good finger size. It fits again when a round adds its answers
   (a new round that would not fit shrinks it even after the first tap; growing still stops at the first tap, so a cheer
   never moves the board under a finger). Cause of the owner's photos: the stage grew to 2.4x on the first, small screen
   of the game and never shrank when the answers came in.
3. **Answers side by side on a landscape screen**: the shared `.choices` row already wraps side by side; with the stage
   no longer over-grown the two or three answers stand in one row under the picture, and the picture shrinks with the
   stage. The new check fails a landscape game whose two to four answers are stacked in a column.
4. **New check `gamefit`** (`tests/gamefit-browser.mts`, in `tests/checks/games.mts`): every game in the catalogue
   and the reading corner, at phone 390x844 (big kid and under-5), tablet landscape 1280x800 and 1340x800, tablet
   portrait 800x1280 and computer 1440x900. It fails when any button or choice is outside the window, the stage or the
   game layer scrolls, the level or stars are not on the title row, or (landscape) answers are stacked.
5. **The "ê" after each line break**: looked for, see below.

## Shared files changed
- `js/games/frame.ts`: the top bar's markup (status moved into `.gl-head`) and `fit()`.
- `css/style.css`: one block at the end, marked `(v1.08 layout)`.
- `tests/checks/games.mts`: one line registering `gamefit`.

## Progress and checks
(filled in below as they run)
