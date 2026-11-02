# v1.08 helper: english (plan part C)

Branch: `work/v108-english` (from `origin/release/v1.08`). Brief: `english-brief.md`. Started 3 Nov 2026, 7:54 am AEDT.

## Plan

1. **English mode** (new `js/englishmode.ts`, small hooks in `js/games/frame.ts`, `js/ui/hub.ts`, `js/state.ts`).
   - A game opened from Học vui › Tiếng Anh (a link tile in the English corner, or any `en_` game wherever it is opened)
     plays in English: while it is open the game language is English and bilingual speech is off, so its words, voice
     and instructions are English whatever the child's language. Closing the game puts the child's language back.
     `saveSettings` always saves the child's real language, so a save during the game never keeps English.
   - Under the instruction line a small Vietnamese hint shows the same instruction in Vietnamese, with a 44 px speaker
     button that says it with the Vietnamese voice.
   - "Play again" and a level change keep English mode for the same game; opening a game from anywhere else does not.
   - Covers First Sounds, Opposites and every reading game linked in the corner (they all read `T()` / `say()`).
   - First Words (Chinese and Hindi) leaves the English corner and moves to Đi đây đi đó (area `travel`, Play hub tab
     Going places), next to the China Town and India Village games.
2. **Eight new English games**, area `hv_en`, in `js/games/english.ts` (data in `js/content/english.ts`):
   `en_words` Picture Words, `en_listen` Listen and Choose, `en_say` Say and Match, `en_abc` ABC Song,
   `en_count` Counting Song, `en_sentence` First Sentences, `en_greet` Greetings, `en_colshape` Colours and Shapes.
   Each: under-5 level (two choices, nobody loses, the right one wiggles), Easy, Medium, Hard and Talent, each level
   different (`data-lv`), own icon drawn in `js/art/english.ts`, a guide (TV button) in `js/games/english-meta.ts`,
   the map pin at the Fun Learning School (Cô Tam), English and Vietnamese text.
3. **Voice:** the English words and sentences are said by the English voice (Azure en-AU); `englishLines()` adds them
   to the voice pack (`tools/make-voice-pack.mts`), recorded with `--engine azure`. Vietnamese hints use the Vietnamese
   voice. No line has a child's name.
4. **Badge:** the English corner's heading in the Play hub shows an "English mode / Chế độ tiếng Anh" badge.
5. **Checks:** `hocvui` lists the eight new games (each won by real taps at Easy and Talent); a new check `englishmode`
   (a Vietnamese child opens Opposites from the English corner: English text and the Vietnamese hint; from Learning:
   Vietnamese; the language is back after closing; the badge shows). Then `node suite.mts --changed`.

Shared files touched (each a small block marked `(v1.08 english)`): `js/content/activities.ts`, `js/content/hocvui.ts`,
`js/games/catalog.ts`, `js/games/all.ts`, `js/art.ts`, `js/games/frame.ts`, `js/ui/hub.ts`, `js/state.ts`,
`js/main/talks.ts`, `sw.ts` (FILES only), `tools/make-voice-pack.mts`, `tests/checks/learning.mts`, `docs/levels/README.md`.

Left for later: the Simple screen marks English mode only for `en_` games (the Simple helper is rewriting
`js/simple.ts`; a linked game opened from its English area could call `markEnglish(id)` there).

## Progress

(filled in as the work goes)
