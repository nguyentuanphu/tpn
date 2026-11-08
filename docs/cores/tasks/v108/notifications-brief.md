# v1.08 helper: notifications

Branch: `work/v108-notifications` (from `origin/release/v1.08`). Status file: `docs/cores/tasks/v108/notifications.md`. Shared rules: `README.md` in this folder.

Push notifications for parents, from the owner's plan `docs/plans/push-notifications.md` (owner, 2 Nov 2026 AEDT: types 3, 4, 5 and 6 weekly and on by default; the others as proposed; 3+4 together on Saturday 9:30, 5+6 together on Sunday 18:00, assumed, owner can change).
- Build:
  - the parents' opt-in in Grown-ups and Studio, with a switch for each type;
  - Web Push from the service worker (`sw.ts`): `push` and `notificationclick`, opening the right screen;
  - the sending on Netlify (functions plus a scheduled function), with quiet hours (20:00 to 8:00 and school hours, the family's time zone);
  - the weekly summary built from data the game already keeps;
  - a note for iPhone that the game must be added to the Home Screen.
- Wording in English and Vietnamese. No child's data beyond what the game already sends (the owner's choice on 2 Nov: "giữ nguyên và không thay đổi gì").
- Keys: Web Push needs VAPID keys in the Netlify environment. Never create, print or commit keys. Write the steps for the owner in your report: the variable names, how to make them, and where to put them. Build everything so it switches itself off while the keys are missing.
- Checks:
  - a check `pushnotify`, with a fake push service: subscribe, the switches, quiet hours, bundling, a click opens the right place;
  - offline still works.
