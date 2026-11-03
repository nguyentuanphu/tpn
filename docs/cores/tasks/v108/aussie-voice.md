ready for Release

# v1.08 helper: aussie-voice (status)

Branch: `work/v108-aussie-voice` (from `origin/fix/v108-startup-art`). Brief: `aussie-voice-brief.md`. Times AEDT.

## Plan (3 Nov 2026 AEDT)

The owner: the Aussie slang taught in Vietnamese ("G'day", "arvo", "brekkie") is read by the Vietnamese voice, so "G'day" comes out as "gút dờ ay". English words inside a Vietnamese line must be said by the English (en-AU) voice.

1. `js/viwords.ts`: add `enRuns(text)` and `enMixed(text)`, the opposite of `viRuns`: a Vietnamese line cut into Vietnamese and English pieces.
   - English is found in two exact ways: (a) the slang the game teaches (`js/words.ts` AUSSIE_SLANG: the word and its example sentence) and a short list of English words the lines use (`EN_IN_VI_EXTRA`: Hello, Snap, Noughts and Crosses, One two three, Vegemite, Tim Tam...); (b) a quoted piece ("..." or “...”) with no Vietnamese letters and a word that cannot be a Vietnamese syllable. Quotes are the marking in the text.
   - Words that could also be Vietnamese ("Ta", "Roo") count only inside quotes; Chinese pinyin and Hindi words in quotes ("nǐ hǎo", "dhanyavaad") are not English.
   - `mixedSsml(..., base)` takes `'vi'` for a Vietnamese line.
2. `js/packhash.ts`: a Vietnamese line with English words gets its own pack name (`vi+en`), like the English lines with Vietnamese words (`en+vi`), so devices fetch the new recording; until it exists the old one still plays (packKey falls back).
3. `js/voice.ts` device voices: the English pieces of a Vietnamese line are said by the phone's English voice.
4. Recorded voices: `tools/make-voice-pack.mts` records these lines with the Vietnamese voice and the English en-AU voice of the same woman or man (Azure SSML); `--vi-en` records only these lines. Sparkle Studio (`studio/core.cts`, `studio/ui/app.ts`) sends and records them the same way.
5. Check `enwords` (tests/checks/code.mts, next to `viwords`).

The Lê Minh (FPT) voice has no recording under the new names, so with Lê Minh chosen these lines play the Azure two-voice recording (the English part right) instead of Lê Minh reading the English in Vietnamese.

## Progress

See the end of this file for checks and commits.

### Done (3 Nov 2026 AEDT)

- Owner via Release, 3 Nov 2026 AEDT: only female voices from now on. The new recordings are the woman's: Vietnamese vi-VN-HoaiMyNeural with English en-AU-NatashaNeural (Azure, one SSML per line). 184 Vietnamese lines with English words recorded (274 female files: lines and template parts such as "G'day" alone). 138 male files were made before that message and are kept (harmless). The old all-Vietnamese files of the 138 lines that have both new files were removed by the pack maker, as for the English lines in round R.
- Học vui Tiếng Anh hints: checked, they are Vietnamese meanings only (0 lines with English words); nothing to change.
- Found and covered: js/content/chapter3text.ts (Chi: G'day, arvo, Hello), js/content/villagerlines.ts (arvo, No worries mate, Brekkie, Fair dinkum, Barbie, hello), js/games/folk2.ts (Two Homes Words questions and answers, every slang word), js/regions.ts and js/chat-player.ts ("Ví dụ:" example sentences), js/heritage.ts (Mark!, jack, Tim Tam), js/vendors.ts (lollies), js/howto-data.ts and js/games/folk.ts (Snap, arvo, Noughts and Crosses), js/games/english-meta.ts (one, two, three), js/cities.ts (Vegemite). No text needed changing: the slang list and quotes mark the English exactly.

## Checks (3 Nov 2026 AEDT, run with --only one at a time; the full suite is left for Release)

| check | result |
|---|---|
| enwords (new) | pass: 9 lines and 48 slang words cut right; 184 Vietnamese lines with English words recorded; the phone says them with its English voice |
| viwords | pass |
| unit | pass (it first caught a lookbehind in enRuns, fixed) |
| types | pass |
| voice, voicepack, mixedhanoivoice, hanoivoice | pass |
| voiceroutes | fail, red before this branch too: about 1150 Lê Minh files missing on the base. This branch adds 274 (the new vi+en names have no Lê Minh recording, by design) and 136 male files not made (female only). Both go away when helper voices-aside sets Lê Minh and the male voices aside. |
| voicecover | fail: 12 lines of other helpers (notifications) not recorded, as on the base, plus 136 male files of this branch not made (female only). Same note: voices-aside. voicecover belongs to the fixes helper. |

`--changed` picks the full suite (.gitignore changed on the base, and voices/), so it was not run (owner, 3 Nov).

Commits: see git log of work/v108-aussie-voice.
