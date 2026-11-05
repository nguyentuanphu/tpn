# v1.08f settings: Grown-ups tidy-up and no TURN relay

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
5. **Remove the TURN server connection:** the owner asked.
   - Take the TURN relay out of the peer connection set-up (`iceServers`, `js/relay.ts` / `js/net.ts` and any Netlify function that hands out TURN credentials). Keep STUN.
   - Any settings or Studio text about the relay goes.
   - Online play then connects directly. Where a direct connection cannot be made (some strict networks), it fails as it would without a relay. Say so plainly in your report, so the owner knows.
   - The relay is set up outside the repo (owner, 10 Oct). Do not touch accounts or keys; only stop using it.

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
