# v1.08 helper: simple

Branch: `work/v108-simple` (from `origin/release/v1.08`). Status file: `docs/cores/tasks/v108/simple.md`. Shared rules: `README.md` in this folder.

Plan part F, the Simple screen (`js/simple.ts`).
1. Every switched-on Play game shows. A locked game appears as its own card with a padlock and what to do ("Chơi 3 trò để mở"), not folded into one padlock stop. Games held back by Studio stay one "Coming soon" stop.
2. The top row becomes: name, Back, Valley ("Thung lũng / Valley"), Sound, Home, Grown-ups. Valley leaves the bottom row.
3. The games are regrouped into two big buttons:
   - "Học vui / Fun Learning" holds everything about learning: the Học tab (numbers, words, reading, shapes, me, money) and Học vui (Vietnamese, English, maths, science).
   - "Vui chơi / Play" holds the rest: folk games, animals and music, drawing, places, thinking.
   - Stories and Places stay.
   - New games other helpers add this round go in by their area, so build the grouping from the areas, not a fixed list.
4. Extend the Simple checks (`simplefirst` and the Simple-screen game check) so every switched-on Play game is reachable on the Simple screen.
- Check phone, tablet and computer. Touch targets are 64 px for under-5s.
