# Push notifications for grown-ups (plan, for v1.08 to v1.09)

Written on 2 November 2026 AEDT by Release, from the owner's answers in chat. Nothing is built yet.

## The rule

Notifications are for grown-ups, never for the child. They help a family use the game well and never pull a child back:
- no "you have not played for 3 days";
- no streaks;
- no child's name on the lock screen.

They are in English or Vietnamese, the language the grown-up chose.

## The list (owner, 2 Nov 2026 AEDT: "3456 1 tuần 1 lần và bật, mấy cái như đề xuất")

| # | Kind | How often | When (Sydney time) | Default |
|---|---|---|---|---|
| 1 | Vietnamese festival starts (Tết, Rằm tháng Giêng, Giỗ Tổ, Đoan Ngọ, Trung Thu) | about 5 a year, one per festival | the morning before, 9:30 | on |
| 2 | Event in Australia (Lunar New Year Sydney, Harmony Day, Book Week, Mother's Day, Father's Day) | about 5 a year | the Saturday before, 9:30 | on |
| 3 | New content (games, stories, experiments) | **once a week** | Saturday 9:30 | **on** |
| 4 | Game of the week (for the child's age and skills) | **once a week** | Saturday 9:30 | **on** |
| 5 | Weekly summary for grown-ups (minutes, words learnt, games played) | **once a week** | Sunday 18:00 | **on** |
| 6 | Skill balance tip ("lots of maths this week: try Tiếng Việt") | **once a week** | Sunday 18:00 | **on** |
| 7 | Level up or achievement (Hard level, a full passport page, 10 stories) | at most once a week | in the Sunday summary | off |
| 8 | Bilingual word of the week | once a week | Monday 7:30 | off |
| 9 | Bedtime story | at most 2 evenings a week, on days the grown-up picks | 19:00 | off |
| 10 | Everyday life (rainy weekend, school holidays, market day, calling grandparents) | at most twice a month | Saturday 9:30 | off |
| 11 | A friend's family invites the child to play together | only for a real invite | at once, outside quiet hours | on |
| 12 | Testers: the problem you reported is fixed, try again | when the fix is live, at most once a day | 18:00 | on (testers only) |

## Keeping it to a few messages

- **Saturday message:** 3 and 4 go out together ("New this week + game of the week").
- **Sunday message:** 5 and 6 go out together, with 7 when it is on.
- **Bundling** keeps a family with the defaults to 2 messages a week, plus about 10 festivals or events a year and any real play invites. (Assumed by Release, owner can change.)
- **Festival weeks:** a festival or Australian event in the same week leads the Saturday message instead of adding a third.
- **Quiet hours:** 20:00 to 8:00, and school hours (Monday to Friday, 9:00 to 15:00). The grown-up can change them.
- **Switches and Studio:**
  - Every kind has its own switch in Grown-ups.
  - Studio can turn each kind off for everyone, schedules them and shows how many were opened.
  - A kind few families open gets turned off.

## How it works

- **Sending:** Web Push through the game's service worker. The Netlify server keeps the subscriptions.
- **iPhone and iPad:** notifications work only when the game has been added to the Home Screen (iOS 16.4 and later). When the game asks to turn notifications on, it also shows how to add it.
- **Privacy:** nothing about the child is stored for this. The server keeps only the device's push address and the kinds the grown-up chose.
- **Checks to add:**
  - the Grown-ups switches on phone, tablet and computer, in both languages;
  - the weekly cap and quiet hours;
  - Studio's switches;
  - each message's text in both languages.
