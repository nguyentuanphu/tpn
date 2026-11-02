# v1.07 brief: rules

Name: rules. Branch: work/v107-rules.

Check the game rules of every game in Play: first the traditional and folk games, then the v1.01 and v1.02 additions.

1. For each game:
   - Compare what the code does with the real rules (Vietnamese and Australian traditional games: Ô ăn quan, Cờ cá ngựa, Tiến lên, Bầu cua, Ném còn, Đá cầu, Kéo co, Rồng rắn lên mây, Bịt mắt bắt dê, Snakes and Ladders, Marbles, and the others).
   - Compare it with the game's own guide text and guide film. They must say the same as the code.
2. Write `docs/rules-audit/` with one row per game: rules correct, small difference (made simpler for children on purpose, and is that said?), or wrong.
3. Fix what is wrong, in that game's file, with a check. Simpler for little children is allowed; wrong is not.
4. A guide or a voice line that changes needs both languages. Record new lines with `node tools/make-voice-pack.mts --engine azure` if `AZURE_SPEECH_KEY` is set (never print it); otherwise list them in your status file.
5. Coordinate with the levels helper, which changes how levels work in the same games: change only the rules, not the levels.

An older rules audit exists: search `docs/` for "rules audit" and issue #350 (closed in v1.06).
