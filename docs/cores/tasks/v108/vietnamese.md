# v1.08 helper: vietnamese (status)

Branch `work/v108-vietnamese`, made from `origin/release/v1.08` (a10eae26) on 3 Nov 2026 AEDT. Brief: `vietnamese-brief.md`.

## Plan

Ten new games for Học vui › Tiếng Việt (`hv_vi`), next to the two that are there (Tone Detective `vi_tones`, Build a Syllable `vi_build`). The brief's list starts with Dấu thanh and Ghép vần, which those two already cover, so the new tone and rhyme games teach a different part of each:

| id | English name | Vietnamese name | What the child does | The brief's item |
|---|---|---|---|---|
| `vi_tonemean` | One Word, Many Tones | Dấu Thanh Đổi Nghĩa | hears cá / cà / ca and taps the right picture: a tone mark changes the word | Dấu thanh |
| `vi_rhyme` | Rhyme Pairs | Tìm Vần Giống Nhau | finds the word that has the same rhyme (vần) as mèo: kẹo | Ghép vần |
| `vi_letters` | Vietnamese Letters | Chữ Cái Việt | fills the missing letter of trăng, cây, đèn, dê, ô, cơm, mưa from a, ă, â and the others | Chữ cái Việt |
| `vi_opposite` | Opposite Pairs | Nối Từ Trái Nghĩa | matches Vietnamese opposites (to / nhỏ, nóng / lạnh) on cards | Từ trái nghĩa |
| `vi_cadao` | Folk Rhymes | Ca Dao Đồng Dao | fills the missing word of a line of ca dao or đồng dao | Ca dao, đồng dao |
| `vi_tucngu` | Picture Sayings | Tục Ngữ Có Hình | completes a saying (tục ngữ, thành ngữ) with a picture, then hears what it means | Tục ngữ |
| `vi_readalong` | Read Along | Bé Đọc To | taps each word of a sentence as it is read | Đọc to |
| `vi_sentence` | Make a Sentence | Bé Đặt Câu | puts word cards in order to say what the picture shows | Đặt câu |
| `vi_dictation` | Listen and Spell | Nghe Và Viết | hears a word and taps its letters in order | Nghe và viết |
| `vi_riddle` | Folk Riddles | Câu Đố Dân Gian | hears a riddle and taps the answer's picture | Câu đố |

Every game:
- Levels: under-5s (two choices, nobody can lose, the right one wiggles), Easy, Medium, Hard, Talent; each sets its real values on the stage (`data-lv`) and Talent shows more choices or cards than Easy.
- English mode: with English chosen, instructions and meanings are in English and the Vietnamese words are always said by the Vietnamese voice, so the game teaches Vietnamese.
- Its own icon drawing (`js/art/tiengviet2.ts`); the content pictures are the existing drawings of those things.
- A How to play guide (the TV button) with three steps in both languages (`js/games/tiengviet2-meta.ts`).
- The map pin goes to Trường Học Vui (the school, where Cô Tam opens the Học vui tab).
- Voice: every fixed line in both languages, and every Vietnamese word, line, riddle and sentence said alone, recorded with Azure.

Files:
- New: `js/content/tiengviet2.ts` (the words, lines and the voice list), `js/games/tiengviet2.ts` (the ten games), `js/games/tiengviet2-meta.ts` (guides), `js/art/tiengviet2.ts` (icons).
- Shared, one marked block each `// (v1.08 vietnamese)`: `js/content/activities.ts` GAME_INFO, `js/games/catalog.ts` (catalogue and loader), `js/games/registry.ts` (imports the guides), `js/art.ts` (imports the icons), `js/school.ts` (the pin), `tools/make-voice-pack.mts` (records the Vietnamese words), `tests/checks/learning.mts` (the `hocvui` check plays the new games to a win at Easy and Talent).

Checks: `cd tests && node suite.mts --changed` (if it picks the full suite: push and start `full-suite.yml` on the branch), plus `hocvui`, `guides`, `voicecover`, `noemoji`, `bilingual`, `games`, phone, tablet and computer screenshots.

## Progress

(filled in as the work goes)
