# v1.08f settings: status

Branch `work/v108f-settings` (from `origin/integrate/v108`). Helper: settings. Started 6 Nov 2026, 8:41 am AEDT.

## Done

1. **Captions off by default** (`js/ui/common.ts`, `js/ui-settings.ts`): captions show only when `settings.captions === true`.
   A family that never touched the box (no saved value) now reads as off; one that ticked it on keeps it on.
   The Grown-ups box says "(off unless you turn it on)". `tests/checks/screens.mts` (A11Y-002 caption size) and
   `tests/checks/learning.mts` (queued captions hidden) turn captions on before they measure them.
2. **AI chat offer hidden** (`js/state.ts` `AI_CHAT_OFFER = false`, `js/extras.ts`, `js/chat-player.ts`): the Grown-ups
   section "Villagers who chat freely (AI)" with the Anthropic key is gone, the internet list no longer mentions it,
   and `aiReady()` is false even with an old key saved. Set `AI_CHAT_OFFER` to true to bring it back.
   Assumed (owner can change): the villagers' offline 💬 Chat button (built-in answers, no AI) stays.
3. **One row** (`js/ui-settings.ts` class `row3`, `css/style.css`): Two players, Fit the screen and Money each sit on one
   row on every screen; each button shrinks (13 to 16 px text) and wraps inside itself, 48 px tall.
4. **The jump**: the part that scrolls is `.grownups-body`, which every redraw made anew, so the old
   `m.scrollTop` keep did nothing. `draw()` now keeps `.grownups-body`'s scroll for every redraw in Grown-ups.
5. **No TURN** (`js/net.ts`, `js/ui-settings.ts`, `js/extras.ts`, `netlify.toml`, `types/globals.d.ts`):
   `iceServers()` is STUN only; the public Open Relay, the website relay (`/api/turn`) and the grown-ups' own relay
   field are gone; `netlify/functions/turn.mts` deleted (its test in `tests/studio-check.mts` now checks it is gone).
   The cloud relay (MQTT, `js/relay.ts`) is not TURN and stays, so rooms still work across networks.
   **What the owner should know:** on some mobile data or strict networks two devices cannot make a direct link;
   they still play together through the cloud relay, but a voice call between those two cannot open.
   The relay account and keys outside the repo were not touched.

## Checks

New check `grownupsrow` (`tests/grownups-row.mts`, registered in `tests/run.mts`). Results below.
