# v1.08b quality helper: status

Branch `work/v108b-quality` from `origin/integrate/v108`. Started 5 Nov 2026, 1:27 pm AEDT.

## Plan (owner's go given 3-4 Nov; brief `quality-brief.md`)

1. `fivescreens` checks: games at phone portrait/landscape (big kid and under-5) in `fivescreens`, tablet portrait,
   tablet landscape and computer in `fivescreenswide` (touch targets, overlap, text 16 px, inside the screen, no
   scrolling; built on the `gamefit` measuring, which now exports `fitGames`). Guide films, tale films and story pages
   in `fivescreensfilms`. Then fix the shared game frame for a short landscape screen first.
2. TypeScript everywhere: `tests/` and `marketing/source` type-checked by `types`.
3. Learning report by subject in Grown-ups, and difficulty by subject.
4. Lumi as the guide (welcome, new things, week's news, Simple screen voice).
5. Play together list and gentle play time.
6. Roads to Concept D.

Order: 1, 3, 5, 4, 2, 6 (the child-facing layout and the parent features first; the type work and the roads last, as
time allows). Anything not reached is listed under "Left for later".

## Progress

(filled in as work lands)
