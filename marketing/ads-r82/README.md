# Sparkle Valley: ten ads for r82 (English and Tiếng Việt)

Twenty vertical videos (1080 x 1920, 30 fps, H.264 + AAC, about 25 to 40 s each): ten ads, each made once fully in
English and once fully in Vietnamese (voice and captions). Made 17 Oct 2026 (Sydney time, AEDT) from real screenshots of
the live game (r81) and Sparkle Studio. The voice is Azure neural speech (English: en-AU Natasha; Vietnamese: vi-VN Hoài
My); the music is the ad kit's own generated jingle. For TikTok, Instagram Reels, YouTube Shorts and Facebook Stories.
These replace every earlier ad video (owner, 17 Oct AEDT: "clear all previous videos").

**Every video has a cover** (owner: "the video thumbnails should describe what the video is about"): `<video>-thumb.jpg`
next to it, with the ad's headline in its own language, two real screens of that feature, the logo and
sparklevalley.au. It is also built into each mp4 as its cover picture. Upload it as the cover on TikTok, Reels, Shorts
and Facebook.

| # | Ad | Cover headline (English / Tiếng Việt) | Files | Best for |
|---|---|---|---|---|
| 1 | Two homes, one valley | Vietnam and Australia in one valley / Việt Nam và Úc trong một thung lũng | `sparkle-valley-homes-en.mp4`, `-vi.mp4` | General reach, Stories |
| 2 | English and Vietnamese | English and Vietnamese, spoken aloud / Tiếng Việt và tiếng Anh, đọc thành tiếng | `sparkle-valley-bilingual-en.mp4`, `-vi.mp4` | Bilingual and overseas Vietnamese families |
| 3 | Family tasks | Family tasks, set from your phone / Việc nhà, đặt ngay trên điện thoại | `sparkle-valley-family-en.mp4`, `-vi.mp4` | Parent groups |
| 4 | Little learners | Made for under-fives / Dành cho bé dưới 5 tuổi | `sparkle-valley-little-en.mp4`, `-vi.mp4` | Parents of toddlers and preschoolers |
| 5 | Learning | Reading, counting and money / Đọc chữ, đếm số và tiêu tiền | `sparkle-valley-learn-en.mp4`, `-vi.mp4` | Parents of 4 to 8 year olds |
| 6 | Heritage | Folk games and festivals / Trò chơi dân gian và lễ hội | `sparkle-valley-heritage-en.mp4`, `-vi.mp4` | Vietnamese-Australian families, festival season |
| 7 | Stories | Fairy tales, read aloud / Truyện cổ tích, kể thành tiếng | `sparkle-valley-stories-en.mp4`, `-vi.mp4` | Bedtime, grandparents |
| 8 | Daily adventures and stickers | Daily adventures and stickers / Phiêu lưu mỗi ngày và hình dán | `sparkle-valley-rewards-en.mp4`, `-vi.mp4` | Kids' interest, return play |
| 9 | Play together | Play together, near or far / Chơi cùng nhau, dù gần hay xa | `sparkle-valley-together-en.mp4`, `-vi.mp4` | Siblings, cousins and grandparents far away |
| 10 | For parents | Screen time you can feel good about / Giờ chơi màn hình bố mẹ yên tâm | `sparkle-valley-parents-en.mp4`, `-vi.mp4` | Paid ads to parents |

## What each ad says (all true of r81, live 17 Oct AEDT)

1. **Two homes, one valley:** eight cities with real landmarks (Hà Nội, Bắc Ninh, Đà Nẵng, Hồ Chí Minh City,
   Bà Rịa–Vũng Tàu; Sydney, Melbourne, Brisbane), Hội An's Chùa Cầu, joined by roads, rivers and bridges; ages 2 to 8.
2. **English and Vietnamese:** one tap switches language; every word is spoken aloud; letters and words in both.
3. **Family tasks:** 15 ready-made family missions (day, week, bedtime) in Grown-ups; parents write their own in
   Sparkle Studio; a new mission or a family message reaches the child's game in seconds (r81: live without Publish);
   a done task is ticked together and celebrated.
4. **Little learners:** the Simple screen with big pictures and a voice; under-fives never lose and never race a clock;
   Easy, Medium and Hard as they grow.
5. **Learning:** the reading corner (trace letters, sounds, first words), counting, money in AUD and VND (Piggy Bank),
   thinking, memory, shapes and music.
6. **Heritage:** Ô ăn quan and kite flying; Trung Thu and Tết in their real season; Hà Nội's lake and red bridge.
7. **Stories:** fairy tales read aloud with moving pictures (Thánh Gióng and more); the lantern story chapter by chapter.
8. **Daily adventures and stickers:** a three-step adventure each day with a chest; the sticker book; coins for clothes.
9. **Play together:** two children on one tablet; family far away joins with a six-digit code; the microphone stays
   off until they are let in and online play starts only when a grown-up allows it.
10. **For parents:** rest time and a gentle bedtime; Sparkle Studio sets messages, missions and settings from a phone;
    works offline; family photos stay private.

## Post captions (copy and paste)

**English**
> Sparkle Valley is a gentle 3D world for children aged 2 to 8, in English and Vietnamese, with Vietnam and Australia
> in one valley. Play in your browser at sparklevalley.au and tap "Add to Home Screen".

**Tiếng Việt**
> Thung Lũng Lấp Lánh là thế giới 3D hiền hoà cho bé từ 2 đến 8 tuổi, bằng tiếng Việt và tiếng Anh, có cả Việt Nam và
> Úc trong một thung lũng. Chơi ngay trên trình duyệt tại sparklevalley.au rồi bấm "Thêm vào màn hình chính".

**Hashtags:** #SparkleValley #ThungLungLapLanh #VietnameseAustralian #NguoiVietOUc #BilingualKids #SongNgu
#LearnVietnamese #HocTiengViet #KidsGames #TroChoiDanGian #FamilyTime #Preschool

## Making them again

The source is in `marketing/source/`: the scripts and words in `ads10.js`, the screenshots in `stills10/`
(`capture10.mts`), the voices in `voice10/` (`voice10.mts`, needs `AZURE_SPEECH_KEY` and `AZURE_SPEECH_REGION`).

```bash
cd marketing/source
node capture10.mts en && node capture10.mts vi   # game served on :8765
node voice10.mts                                 # only lines not recorded yet
python3 -m http.server 8770 &                    # serves the stage
./make10.sh                                      # or ./make10.sh family; writes out10/
```
