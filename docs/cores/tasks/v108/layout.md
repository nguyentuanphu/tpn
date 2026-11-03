# v1.08 helper: layout (fit one screen, level and stars on the title row)

**Status: ready for Release** (3 Nov 2026 AEDT). Branch `work/v108-layout`, from `origin/fix/v108-startup-art`.

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
   portrait 800x1280 and computer 1440x900 (297 games, three screen sizes at a time, about 33 minutes here). It fails
   when any button or choice is outside the window, the stage or the game layer scrolls, the level or stars are not on
   the title row, (landscape) answers are stacked, or (Release's ask, CLAUDE.md "One screen, big clear text") any game
   text is under 16 px as drawn.
6. **Text at least 16 px** (Release's ask, 3 Nov AEDT): the frame raises any game text under 16 px as drawn (its size
   times the stage's zoom) and gives it back its own size when the stage grows; on a phone the guide line, the level
   button, the stars and the English mode's Vietnamese hint are 16 px.
5. **The "ê" after each line break**: looked for, not found yet (see below).

## Shared files changed
- `js/games/frame.ts`: the top bar's markup (status moved into `.gl-head`), `fit()` (shrinks too, keeps buttons 44/64
  px, phones may grow 1.4x, a new round may shrink it after the first tap, a change inside the game may not), the text
  floor (`floorText`), the first tap keeps the board where it is.
- `css/style.css`: blocks at the end marked `(v1.08 layout)`: the title row, phone sizes (16 px guide, level, stars),
  under-5s on a phone show the game's picture without its written name, the English hint in the guide row, and Cờ Cá
  Ngựa's two grown-up folds sharing a row on a phone (the only game-specific rule, so its under-5 board fits).
- `js/englishmode.ts` (english helper's file, one line): the Vietnamese hint row goes inside the guide row, so the
  English games' top band passes `gamespace`.
- `tests/checks/games.mts`: one line registering `gamefit`; `tests/gamefit-browser.mts` is new.

## Checks (3 Nov 2026 AEDT, local, `cd tests && node run.mts <names>`)
`suite.mts --changed` picks the full suite (shared test code changed), which is left for Release. Run one by one:
- gamefit: pass (297 games x 6 sizes, 33 min; after the last CSS change cacuangua re-run alone at phone, under-5 phone
  and tablet upright: pass)
- gamespace: pass (it was red: the English games' top band 152 px, now within 130)
- games, phone, boot, contract, horsestability, gamelevel, gameflow, englishmode, ownerlearninglayout,
  ownerlearningcomposition, owneractivityshell, arch: pass
- gamewinlayout: fail, not from this branch: `openGame` now waits for the v1.08 pictures (base commit 59bfd6e6f,
  `js/games/frame.ts` openGame/moreArt), so the check's `.gl` is not there yet when it reads it. Left to the fixes helper.
- unit, types: fail in this container only (no `pg` package, no `@types/node`); not related.
- Note: once, a single-game gamefit run overlapped the long run for two minutes.

Screenshots looked at: `docs/cores/tasks/v108/layout-shots/` (Seesaw, Float or Sink, Word and Picture on phone, tablet
sideways 1280x800, tablet upright 800x1280, computer 1440x900).

## The "ê" after each line break: not found
Looked for: CSS `::before`/`::after` content, `attr()`, `hyphens`, `white-space: pre`, `<br>` joins (only Ca Dao's
verse lines, checked), `\n` in game text, combining marks (only the tone-mark lists, NFC-normalised), emoji drawings with
an ê (only the Tiếng Việt corner icon), canvas text wrapping, every text node of the reading, Tiếng Việt and English
games opened on a phone (screenshots: no stray ê). Not reproduced in Chromium here. Next step: a photo or the game's name
from the owner, or a look on the Android tablet (its own fonts). No new spoken lines; no new drawings.

## Owner's decisions
- None new in this chat. Release's message (3 Nov AEDT): the check also covers text size (no game text under 16 px).
