# Helper brief: story (costumes, films, chapters, calendar, website news, install gift)

Branch `work/v108b-story`. Plans: `docs/plans/games-one-home-and-films.md` part B, `docs/plans/v109-extras.md` ("The lantern story to Tết", chapter order changed by the owner), `docs/plans/links-rollout-install.md` parts 2, 3, 4, the calendar section and the website section, and `docs/cores/STORY.md`.

Do:
1. **Costume kit** (Blender, `tools/blender/`): period outfits and hairstyles made once and reused: Vietnamese (áo tứ thân, yếm, váy đụp, khăn mỏ quạ, khăn vấn, bun; áo the, áo nâu, khố, khăn xếp, khăn đầu rìu, topknot; armour and royal robes), colonial Australian for The Magic Pudding, hanfu, sari and dhoti. Inside the 39 tale films only the tale's people appear, in period dress; the four friends appear only as storytellers at the start and the end, in their own clothes. New check `talecostume`: no modern outfit and no friend inside a folk-tale page.
2. **Smoother films in the game** (`js/film.ts`): the new walk/run/wave/mood faces (from the friends helper's builder), lips that move with the voice, eased camera moves, soft light by time of day, light depth blur, particles, fades between scenes. `films`, `stories`, `perf` while a film plays must pass.
3. **Story pages redrawn** from the Blender characters and settings as illustrations (our own art, about 60–100 KB each).
4. **Five Blender films** about 1 minute each (same pages and narration as the game film): Bánh Chưng Bánh Giầy, Chú Cuội, Tấm Cám, Thánh Gióng, The Rainbow Serpent. 720p, 4–6 MB, EN and VI voices (female), downloaded only when opened and then kept for offline, never in the first download or the Wi-Fi pack; the help moments pause with the tap ring; the in-game film is the fallback.
5. **Lantern chapters** (release by date through the release calendar): Chapter 4 the end-of-year festive season, Christmas to New Year's Eve, both countries (summer Christmas in Sydney, harbour fireworks 9 pm and midnight; the cathedrals in Sài Gòn and Hà Nội, Hàng Mã, the countdown at Hồ Gươm; each friend's New Year wish), released with the Christmas decorations on 4 Dec; Chapter 5 Huế, Đà Nẵng, Melbourne and Uluru (January); the Finale at Tết (about 6 Feb 2027). Each with an under-5 path, a festival film and a keepsake, like chapters 1–3. Season 2 is not in this round.
6. **Release calendar in Studio** ("Lịch phát hành"): every held-back game and story and every new thing of this round placed in a week (fill it first; the owner can drag items between weeks); items open by date through the existing start-date mechanism; games and stories already open stay as they are. The "Coming soon" tile says what opens next week.
7. **Calendar tab in the pad**, renamed "Lịch: Lễ hội và Có gì mới": per festival a timeline (decorations, hunt, day, festival game open → put away, adventures) with start, end and days left; tap a step to fly there; below it "This week's new things", "Opens next week", "Ending soon". Nothing extra on the play or Simple screen. Ending soon also in a Grown-ups "What's new" card; no push for endings. Saturday's push "Tuần này có gì mới" is written from the calendar.
8. **Website:** a strip under the hero (Happening now, New this week, Coming up) and a Calendar part inside Discover (festivals, new chapters with a picture, new games and stories, festival games and when they come back), from the same calendar data; the four destinations stay (`docs/website-review-20261023/WEBSITE-RULES.md`).
9. **Install gift:** the first time the game runs installed (display-mode standalone), every child on the device gets once: the "Mũ Ngôi Nhà / Home hat" (own drawing), 100 coins, a sticker, told in EN and VI; the install chip text in Grown-ups mentions it; nothing pushes children to install.
10. **Checks:** `talecostume`, `films`, `stories`, `chapter4`, `chapter5`, `finale`, `releasecalendar`, `calendartab`, `website`, `installgift`.

## Added by the owner, 5 Nov 2026 AEDT: the calendar is too wordy

Screenshot: `docs/plans/owner-20261105/calendar-too-long.png`. Owner: "The festivals descriptions look too long which may confuse the eyes, you are an experienced UX, fix this."

Today every festival is a tall card with five boxes. Each box has a heading, a date range and "in X days" ("Festival game, then put away until next year / 10 Dec – 3 Jan / in 35 days"). Three of these cards sit side by side, and the empty "This week / Opens next week / Ending soon" sections stay on screen.

**Redesign:**
- **One compact row per festival:** its picture, its name, its date, and one short status chip in plain words.
  - Examples: "Trang trí từ 10/12" (decorations from 10 Dec), "Đang diễn ra · còn 3 ngày" (on now, 3 days left), "Trò chơi lễ hội đến 3/1" (festival game until 3 Jan).
  - The chip shows only the one thing that matters now: the next step that starts, or the one now running.
- **A thin timeline bar under the name**, with small dots for decorations, hunt, day and game, and a marker for today. No text per step.
- **Tap a row to open the details:** each step with its own picture, start, end and days left, in short words such as "Săn đồ: 24/12 – 31/12". One row open at a time.
- **Order:** the festival happening now first, then the next ones by date. Show the next 4; "Xem thêm / See more" opens the rest.
- **The three lists:** "This week / Opens next week / Ending soon" show only when they have something, as one short line each with pictures. Never as three "Nothing ..." lines.
- **Wording:** "Festival game, then put away until next year" becomes "Trò chơi lễ hội / Festival game". The return date is shown only in the open details ("Quay lại năm sau / Back next year").
- **Text:** at least 16 px. One screen on phone (portrait and landscape), tablet and computer. No sideways scroll. Bilingual.
- **Checks:** `calendartab` and `fivescreens`. Look at the phone, tablet and computer screenshots before reporting.
