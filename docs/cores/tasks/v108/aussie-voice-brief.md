# v1.08 helper: aussie-voice

Branch: `work/v108-aussie-voice` (from `origin/fix/v108-startup-art`). Status file: `docs/cores/tasks/v108/aussie-voice.md`. Shared rules: `README.md` in this folder.

The owner, 3 Nov 2026 AEDT: some games in Vietnamese teach Australian slang ("G'day", "arvo", "brekkie" and so on). The slang words are read by the Vietnamese voice, so "Good day" comes out as "gút dờ ay". English words inside a Vietnamese line must be spoken by the English voice (en-AU), and the Vietnamese around them by the Vietnamese voice.

1. Find every place that says English words inside Vietnamese lines. Look at least at:
   - the Aussie slang and Australian games and talks: `js/games/folk2.ts`, `js/content/chapter3text.ts`, `js/content/villagerlines.ts`, `js/villagertalk.ts`, `js/words.ts`, `js/heritage.ts`;
   - the Học vui Tiếng Anh hints;
   - anything quoting English in Vietnamese.
2. Speak these lines in mixed parts.
   - `js/voice.ts` already splits Vietnamese words out of English lines (`viRuns`, `mixed`, `mixedVoiceFragments`). Add the opposite: English words inside Vietnamese lines go to the English voice. This covers recorded lines (the voice pack: record the English parts with Azure en-AU when `AZURE_SPEECH_KEY` is set; never print the key) and the device's own voices.
   - Mark the English words in the text where needed, so the split is exact.
3. Add a check that the Vietnamese lines with English slang are spoken with the English parts in English.

Other helpers are working at the same time: layout (game screens), variety (rounds), fixes (the red checks: `voicearea` and `voicecover` are theirs, coordinate through your status file). Stay in the voice and text files.
