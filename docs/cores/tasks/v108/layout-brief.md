# v1.08 helper: layout

Branch: `work/v108-layout` (from `origin/fix/v108-startup-art`). Status file: `docs/cores/tasks/v108/layout.md`. Shared rules: `README.md` in this folder.

The owner played on an Android tablet held sideways (3 Nov 2026 AEDT, photos in `docs/plans/owner-20261103b/`: Seesaw, Float or Sink, Chữ và Hình).
1. In many games the answers sit below the bottom of the screen, and the child has to scroll to see them. Everything in a game must fit on one screen with no scrolling: the question, the play area and every answer, on a phone, a tablet (portrait and landscape, about 1280x800 and 1340x800 sideways) and a computer.
2. The level button (Dễ) and the stars sit on their own row. Put them on the same row as the title and the TV (guide) button, so the play area gets that space.
3. On a wide screen, answers stack in a column. On a landscape tablet or a computer they go side by side in a row, and the play picture shrinks to fit.
4. Some game adds the letter "ê" at the start of each line after a line break (the owner does not remember which). Find it: look for text wrapping, `::before`/`::after` content, hyphenation, joined strings in the reading and Tiếng Việt games. Fix it at the cause.

Do it in the shared game frame (`js/games/frame.ts`, `css/style.css`) where you can, not game by game. Add a check that opens every game in a landscape tablet size and a phone size, and fails when any answer or button is below the fold or needs scrolling.

The fixes helper (branch `fix/v108-suite`) is fixing other red checks. The `gamespace` check (the English games' top band was too big) is yours: leave the other red checks to fixes.
