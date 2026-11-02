# v1.08 helper: vietnamese (status)

**ready for Release** (3 Nov 2026 AEDT). The full suite is left for Release (round rule, 3 Nov 2026 AEDT).

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

Checks: `cd tests && node suite.mts --changed` (if it picks the full suite, the full suite is left for Release: round rule, 3 Nov 2026 AEDT), plus `hocvui`, `guides`, `voicecover`, `noemoji`, `bilingual`, `games`, phone, tablet and computer screenshots.

## Progress

Done, 3 Nov 2026 AEDT:
- The ten games, their icons, guides, map pin (the school) and level values, as planned. Commits 511fd7bc (games), f9073509 (types; the Opposite Pairs card shows its picture), then the voice commit (568 recordings with Azure: en-AU and vi-VN, both voices; no line has a child's name).
- Shared files changed, each with one marked block `(v1.08 vietnamese)`: `js/content/activities.ts`, `js/games/catalog.ts`, `js/games/registry.ts`, `js/art.ts`, `js/school.ts`, `tools/make-voice-pack.mts`, `tests/checks/learning.mts`; `.gitignore` gained the built `js/art/tiengviet2.js` (written by the build). `voices/` holds the new recordings and manifests.

Checks (local, 3 Nov 2026 AEDT, `node run.mts <name>` one at a time):
- pass: `hocvui` (all ten won by real taps at Easy and Talent; Talent shows more: tonemean 2 to 4, rhyme 2 to 5, letters 2 to 5, opposite 4 to 10 cards, cadao 2 to 5, tucngu 2 to 5, readalong 3 to 6 words, sentence 3 to 7 cards, dictation 3 to 7 letters, riddle 2 to 5), `games` (247 games open), `guides` (247), `levelsb`, `phone`, `voicecover`, `voicepack`, `bilingual`, `names`, `types`, `validate`.
- fail, not from this branch: `emoji` finds the target emoji in `docs/plans/v108-owner-batch-20261103.md` (Release's plan file, already on `release/v1.08`).
- `suite.mts --changed` picks the full suite (`.gitignore` changed): left for Release, per the round rule.
- Screenshots looked at: all ten games on a phone (390 x 844, Vietnamese, Talent), a tablet (820 x 1180, English, Hard) and a computer (1366 x 800, English, Talent), and the Học vui tab; every button 44 px or more and on screen, no page errors.

Open questions: none.
