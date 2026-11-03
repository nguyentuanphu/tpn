# v1.08 helper: variety

Branch: `work/v108-variety` (from `origin/fix/v108-startup-art`). Status file: `docs/cores/tasks/v108/variety.md`. Shared rules: `README.md` in this folder.

The owner, 3 Nov 2026 AEDT: in many games the rounds are all the same, with nothing different from one round to the next.

1. Audit every game:
   - play several rounds at each level;
   - list the games where rounds repeat: the same question, picture or answer set, or the same correct position.
2. Fix them so each round differs:
   - draw from a bigger pool of items, with no repeats within a game;
   - change the place of the right answer;
   - vary the numbers, objects and pictures;
   - at higher levels, change the kind of question too.
   - Use our own drawings, and English and Vietnamese.
3. Add a check `roundvariety`: for every game, a few rounds in a row must not repeat the same content.
4. Start with the v1.08 games (science, maths, money, English, Tiếng Việt), then the older learning games.

Do not change layout. The layout helper (branch `work/v108-layout`) does that.
