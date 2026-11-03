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
