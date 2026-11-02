# v1.08 helper: notifications (push notifications for grown-ups)

**ready for Release** (3 Nov 2026 AEDT). Draft PR #801 into `release/v1.08`.

Status: built and checked (started 3 Nov 2026, 8:05 am AEDT). Branch `work/v108-notifications` from `origin/release/v1.08`.

## Plan

Source: `docs/plans/push-notifications.md` (owner, 2 Nov 2026 AEDT) and `notifications-brief.md`.

Privacy idea that shapes the whole build: **the server never learns anything about a child.** The server keeps only the
device's push address, the kinds the grown-up switched on, quiet hours, the family's time zone and the language. A push
from the server carries only *which* kinds are due (and texts that are the same for every family: a festival, the word
of the week, a tip). Anything that depends on the child (the weekly summary, the skill balance tip, the game of the week
for the child's age, an achievement) is written on the device by the game into its own cache (`sv-notify`), and the
service worker reads it there when the push arrives. No child's name is ever shown (the summary covers all children
together).

What I build:

1. **Shared rules, pure and tested** (`js/content/notify.ts`, used by the game, the service worker's texts and the
   server): the 12 kinds with their defaults (3, 4, 5, 6 on and weekly; 1, 2, 11 on; 12 on for testers; 7 to 10 off),
   the time slots (Saturday 9:30 for 3+4, Sunday 18:00 for 5+6(+7), Monday 7:30 word, 19:00 bedtime on picked days,
   Saturday 9:30 everyday life twice a month, festival the morning before 9:30, Australian event the Saturday before
   9:30), quiet hours (20:00 to 8:00 and school hours Monday to Friday 9:00 to 15:00, changeable), the family's time
   zone, bundling (one Saturday message, one Sunday message; a festival or event in the same week leads the Saturday
   message instead of adding a third), the message texts in English and Vietnamese, and where a tap opens.
2. **Grown-ups** (`js/notify.ts`, a new folding part "Notifications" in Grown-ups, loaded only when opened): turn on
   (asks the browser, subscribes, sends the choices), a switch for each kind, quiet hours, bedtime days, turn off;
   the iPhone/iPad note "add the game to the Home Screen first" with how; switches itself off (and says so) while the
   website has no keys or the device cannot do Web Push.
3. **Service worker** (`sw.ts`): `push` shows the message (texts from the device's own summary where the kind needs
   it), `notificationclick` opens or focuses the game on the right screen (`?open=`), and tells the server a kind was
   opened (only the kind, for Studio's counts).
4. **Server** (Netlify): `netlify/lib/webpush.mts` (VAPID signing and aes128gcm encryption with Node's own crypto, no
   new package), `netlify/lib/push.mts` (subscriptions in the Blobs store `push`, the weekly plan, send, counts),
   `netlify/functions/push.mts` (`/api/push`: key, subscribe, change, stop, opened) and
   `netlify/functions/push-send.mts` (scheduled every 30 minutes). Everything switches itself off while the keys are
   missing.
5. **Studio**: each kind is a switch on the Releases page in a new group "Notifications for grown-ups" (off for
   everyone, or a start date and days: the existing Releases scheduling), plus Studio's "new this week" text, and the
   counts (sent and opened per kind, last 8 weeks) shown there.
6. **Check `pushnotify`** with a fake push service: subscribe, the switches, quiet hours, bundling, a real encrypted
   push decrypted again, a push delivered to the service worker shows the right text in both languages, a tap's
   target opens the right screen; plus phone, tablet and computer screenshots of the Grown-ups part. Offline: `offline`
   check run again.

Shared files touched (small): `sw.ts` (the two events and the new files in FILES), `js/ui-settings.ts` (one line to
draw the part and one to bind it), `js/content/releases.ts` (one block at the end, marked `(v1.08 notifications)`),
`js/art.ts` (a bell drawing, one block at the end), `studio/ui/app.ts` (the counts under the new group),
`netlify/functions/studio.mts` (one route for Studio's text and counts), `tests/run.mts` (the check at the end).

Left for later / other cores:
- Kind 11 (a friend's family invites): the server and service worker side are built (`POST /api/push` with
  `invite`), but sending from the friends screen needs the Online core to pass the friend's push id on its invite.
- Studio "turn off a kind few families open" stays a human decision on the counts (no automatic switch-off).

## Progress

All six parts of the plan are built:
- `js/content/notify.ts` (shared rules), `js/notify.ts` (Grown-ups part, the device's own lines, taps), `js/art/notify.ts`
  (bell and Home Screen phone drawings), `sw.ts` (`push`, `notificationclick`, new files in FILES).
- `netlify/lib/webpush.mts`, `netlify/lib/push.mts`, `netlify/functions/push.mts` (`/api/push`),
  `netlify/functions/push-send.mts` (every 30 minutes), `tools/make-vapid-keys.mts` (for the owner).
- Studio: Releases group `notify` (12 switches `push_<kind>`, `js/content/releases.ts`), the panel with counts and the
  "new this week" text (`studio/ui/app.ts`, route `/studio/api/push` in `netlify/functions/studio.mts`, permission in
  `netlify/lib/admins.mts`: reading = pages, saving = releases).
- Shared files changed (small, marked `(v1.08 notifications)`): `sw.ts`, `js/ui-settings.ts`, `js/main.ts` (one line that
  loads js/notify.js only when notifications are on or a tap opened the game), `js/content/releases.ts`, `js/art.ts`,
  `css/style.css` (a block at the end), `index.html` (preload line), `.gitignore` (built .js), `studio/ui/app.ts`,
  `netlify/functions/studio.mts`, `netlify/lib/admins.mts`, `tests/run.mts`.

Kind 11 (invites): the website and the service worker are ready (`POST /api/push { invite: <id> }`), but nothing in the
friends screen sends it yet: the Online core needs to pass the friend's push id with its invite. For Release / Online.

No new spoken lines (notifications are text only, read by the device). No version change.

Commits: 19b3e2b8, 0b04ca51, 2ee95ec6 (merge of release/v1.08), then the preload commit.

## Checks (3 Nov 2026 AEDT, this container)

- `pushnotify` (new): pass (485 s). Screenshots `tests/out/pushnotify-{phone,tablet,computer}-{en,vi}.png`, looked at.
- `unit`: pass (507 tests, including the 10 new ones in `tests/unit/push-notify.test.mts`; RFC 8291 test vector matches).
- `types`, `names`, `bilingual`, `rules`, `arch`, `noemoji`, `preload`: pass.
- `boot`, `offline` (offline still works: saved 5.4 s, offline 3.7 s, no-answer 4.9 s), `swupdate`, `contract`, `phone`: pass.
- `emoji`: **fail, not this branch's**: the emoji is in Release's `docs/plans/v108-owner-batch-20261103.md`. Left for Release.
- `suite.mts --changed` picks the full suite (`.gitignore` changed). Under Release's rule of 3 Nov 2026 AEDT (helpers never
  start the full suite) the run started at 8:55 am AEDT was cancelled, and the checks covering this change were run with
  `--only`, one at a time (above). **The full suite is left for Release.**

Note: the local `--only` run was going on while release/v1.08 was merged in (a conflict in `css/style.css`, both blocks
kept); `unit`, `preload` and `emoji` were run again after.

## Owner's decisions

- 2 Nov 2026 AEDT (plan): kinds 3, 4, 5 and 6 weekly and on; the others as proposed; 3+4 together Saturday 9:30, 5+6
  together Sunday 18:00 (assumed by Release, owner can change).
- 2 Nov 2026 AEDT: no child's data beyond what the game already sends ("giữ nguyên và không thay đổi gì").

## Keys for the owner

Nothing is sent until these three are in Netlify. Until then Grown-ups says "Notifications are not switched on for the
game's website yet", the scheduled run does nothing, and Studio's panel says sending is off.

| Variable | What it is | Secret? |
|---|---|---|
| `VAPID_PUBLIC_KEY` | the website's public push key (87 characters) | no (devices get it) |
| `VAPID_PRIVATE_KEY` | its private half (43 characters) | **yes** |
| `VAPID_SUBJECT` | a contact for the push services, `mailto:you@example.com` or the website's `https://` address | no |

How to make them (once, on your own computer, in the repo folder): `node tools/make-vapid-keys.mts`. It prints the three
lines; change the e-mail in the third. (Or `npx web-push generate-vapid-keys`, the same kind of keys.)

Where: Netlify → the site → Site configuration → Environment variables → Add a variable, one for each (scope: all, or at
least Functions). Then deploy again (Deploys → Trigger deploy). Keep the same pair for good: a new pair means every
family has to turn notifications on again. Never put them in the repo or in a chat.
