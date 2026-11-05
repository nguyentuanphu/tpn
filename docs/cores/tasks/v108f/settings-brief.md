# v1.08f settings: Grown-ups tidy-up, relay wording hidden

Read first: `README.md` (this folder) and the two screenshots in `pics/`, `js/ui-settings.ts`, `js/ui/grownups.ts`, `js/state.ts`, `js/relay.ts`, `js/net.ts`, `CLAUDE.md`.

## What to build

1. **Captions:** default **off** for new families. Existing families keep the choice they made, unless they never changed it; then it reads as off too. Show the default in the Grown-ups setting.
2. **Hide the AI chat voice offer:** the Grown-ups or Welcome card or button that offers the AI voice chat (talking with Lumi or the AI by voice).
   - Hidden everywhere a child or grown-up sees it.
   - Keep the code behind a switch that is off, so it can come back.
3. **One line each** in Grown-ups:
   - "Two players on one device": Automatic, Face to face, Side by side;
   - "Fit the screen": Automatic, Whole screen, Fit inside;
   - "Money": Same as the language, AUD $, VND đ.

   On a phone held upright the three choices sit in one row: smaller padding, text that shrinks or wraps inside each button. They stay 44 px or more tall, and readable in English and Vietnamese.
4. **The jump:** tapping the choice that is already on (for example "Same as the language" under Money) jumps the Grown-ups panel to the top. Find the cause, probably a re-render that resets the scroll. Keep the scroll where it is for every choice in Grown-ups, whether or not it is already on.
5. **The TURN relay stays; its wording and link are hidden** (owner, 6 Nov 2026 AEDT, corrected: "the turn function stays but the wording and the link there to hide").
   - Keep the relay working exactly as it is: `iceServers` and the credentials.
   - Hide only what a grown-up or child sees about it: the text about the voice relay or TURN server connection, and its link or button in Grown-ups or Settings.
   - Hidden behind a switch that is off, not deleted.

## Checks

- **Yours:** a new `grownupsrow` check:
  - the three settings each fit one row at 390 px in EN and VI;
  - tapping the current choice keeps the scroll;
  - captions are off on a fresh start;
  - no AI voice offer is shown.
- **Also run:** `phone`, `bilingual`, `online` (or the voice and online checks that exist; they may say skipped), `types`, `boot`.
- **Screenshots** on phone, tablet and computer.

## Status file

`docs/cores/tasks/v108f/settings.md`
