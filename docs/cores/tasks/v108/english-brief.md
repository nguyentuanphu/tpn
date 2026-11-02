# v1.08 helper: english

Branch: `work/v108-english` (from `origin/release/v1.08`). Status file: `docs/cores/tasks/v108/english.md`. Shared rules: `README.md` in this folder.

Plan part C: real English lessons for children learning English (most players are Vietnamese).
1. English mode. A game opened from Học vui › Tiếng Anh plays in English: words, voice and instructions, whatever the child's language. A small Vietnamese hint sits under the instruction, and the child can tap to hear it in Vietnamese. Today every game in that section follows `settings.lang`, so a Vietnamese child plays it in Vietnamese (`js/content/hocvui.ts:17`, `js/games/learning.ts`, `js/games/reading*.ts`).
   - Support it in First Sounds, Opposites and the reading games linked there. First Words (Chinese and Hindi) is not English: move it out of the English section, to its own corner or to Đi đây đi đó.
2. At least 8 new English games of its own, with area `hv_en`:
   - Picture Words (animals, colours, numbers, family, food, body);
   - Listen and Choose;
   - Say and Match;
   - ABC Song;
   - Counting Song in English;
   - First Sentences ("I see a ...");
   - Greetings (hello, please, thank you, sorry);
   - English Colours and Shapes.
   - Each has three or more levels up to Talent.
3. English voice: the game's English voice (Azure en-AU). Vietnamese hints use the Vietnamese voice.
4. The section card shows an "English mode" badge, so parents know.
