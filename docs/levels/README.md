# Game levels: what Easy, Medium, Hard and Talent change in every game

Owner's plan Focus 2 (docs/plan-hoan-thien/KE-HOACH.md), written in round v1.07 (levels helper, 2 November 2026 AEDT).
This is the standard for checking games and for making new ones (proposed rules LV-001 to LV-004 in
[the design handbook](../SO-TAY-THIET-KE.md)). Every row was read from the game's code.

## How the levels work

- The child (or a grown-up) chooses Easy, Medium, Hard or Talent in the game's top bar. Under-5s play gently (the
  "Under-5" column), cannot lose and never see Talent (owner, 1 Nov 2026 AEDT).
- In code (`js/games/frame.ts`): `api.smart` is 0 Easy, 1 Medium, 2 Hard, 3 Talent (0 for under-5s); `api.talent` is true
  only at Talent; `api.level` is the level number inside the chosen band (Easy 1-2, Medium 2-3, Hard 4-5, Talent 5, a
  fresh child starts at the bottom); `api.tier()` is 0 under-5, 1 Easy, 2 Medium, 3 Hard and Talent, and can move one
  step with the child's answers. The tables show a fresh child's first round.
- Each file's helper `lv(api, easy, medium, hard, talent)` picks a value and notes it on the frame (`api.lvNote`, seen
  as `data-lvnote` on the game layer). Values a game sets another way are written on its stage as `data-lv`, before
  the first tap.
- The check `levelsall` (`tests/levels-all.mts`) opens every game at all four levels and as an under-5 and compares
  `data-lv | data-lvnote`: it fails a game that writes nothing, whose Easy equals Talent, or whose four levels give fewer
  than three different settings; and an under-5 who gets Talent. Exempt games are listed there with the reason
  (free painting pads, the free music pad, make-your-own book, the family quiz, the Fruit Bar game of chance).

## Making a new game

1. Pick every setting through `lv(...)` or write it with `api.stage.dataset.lv = [...].join(',')` when the game opens.
2. Make Easy and Talent clearly different and at least three of the four levels different, in something a child sees
   or feels; keep under-5s gentle.
3. Add the game's row to the table of its Play tab below, and run `levelsall`.

Columns: **Recorded as** names the values in `data-lv` / `lv(...)`; **Change this round** says what v1.07 changed.


## Learning: numbers, shapes and money

Files: js/games/numbers2.ts, shapes2.ts, money.ts, money2.ts, market.ts.

Money amounts are shown in AUD; VND uses the matching notes (for example $1 = 10.000 đồng in counting games). In `money.ts` and `market.ts` the plan row follows `api.level` (a fresh child: Easy level 1, Medium 2, Hard 4, Talent 5); a child who has moved up inside a band gets the next row.

| id | Name (EN / VI) | Under-5 | Easy | Medium | Hard | Talent | Recorded as | Change this round |
|---|---|---|---|---|---|---|---|---|
| heodat | Piggy Bank / Heo Đất | count 2-4 (or 3-5) $1 coins, 3 rounds, hint wiggles | count 2-4 $1 coins, 3 rounds | count 3-5 $1 coins, 3 rounds | save $2.50-$8 with 50c, $1, $2, 3 rounds | save $5-$15 with six kinds (10c-$5), 4 rounds | data-lv: kinds of money, lowest, highest, rounds | recorded only |
| coinnote | Coin or Note? / Xu hay Tiền Giấy? | 4 to sort from 7 kinds | 4 to sort from 7 kinds | 5 to sort from 7 kinds | 8 to sort from 11 kinds | 10 to sort from 11 kinds | data-lv: rounds, kinds in the pool | fixed: Medium sorts 5, not 4 like Easy |
| needwant | Need or Want? / Cần hay Muốn? | 4 or 5 rounds | 4 rounds | 5 rounds | 6 rounds | 10 rounds | data-lv: rounds | recorded only |
| bahu | Three Jars / Ba Hũ | 3 (or 6) coins, same in each jar, hints | 3 coins, same in each jar, 3 rounds | 6 coins, same in each jar | 10 coins, 5:3:2 or 4:4:2 or 6:3:1 | 12 coins, "half in Save, rest even", 4 rounds | data-lv: coins, splits to pick from, rounds | recorded only |
| lixi | Lucky Money Count / Đếm Lì Xì | 2-4 envelopes, count them | 2-4 envelopes, count them, 3 rounds | 3-5 envelopes of $5, add up | 3-4 envelopes of $5/$10/$20, add up | 4 envelopes, up to 2 notes each of 4 kinds, 4 rounds | data-lv: fewest, most envelopes, kinds, notes per envelope, rounds | recorded only |
| shopkeep | Little Shopkeeper / Bé Bán Hàng | price $1-$4, paid $5, change in $1 coins, said aloud | as under-5 | price $1-$4, change in $1/$2 | price $2-$19.90, 7 kinds, change not said | price $5-$45, 9 kinds, a bigger note paid, 4 rounds | data-lv: lowest, highest price, kinds of money, bigger note, rounds | recorded only |
| shoplist | Shopping List / Danh Sách Đi Chợ | 2 things from a shelf of 4, no prices | 2 of 4, no prices, 2 rounds | 3 of 5, no prices | 3 of 5, each big and small, budget fits only the cheap ones | 5 of 7, big and small, budget | data-lv: things on the list, things on the shelf, mode (0 find, 1 budget, 2 cheaper), top price | recorded only |
| cheaper | Which Is Cheaper? / Món Nào Rẻ Hơn? | 2 piles of $1 coins (1-6), 4 rounds | 2 piles of 1-6 coins, 2 apart, 5 rounds | 2 piles of 1-5 coins, 1 apart | 2 price tags 50c-$9.90 | 4 price tags 50c-$3 in 5c steps | data-lv: cards, lowest, highest, coin piles, rounds | recorded only |
| waitgrow | Wait and Grow / Chờ Cây Lớn | 2 coins +1 a day for 2 days, which is more | as under-5, 2 rounds | 4 coins +1 a day for 3 days | 10 coins +1 or +2 a day, guess the total first | 20 coins, rate said as "1 for every 10 (or 5)", guess first, 3 rounds | data-lv: coins planted, % a day, days, guess first, rounds | recorded only |
| barter | Swap and Trade / Đổi Hàng | give the 1 picture asked for | give 1 picture, 3 rounds | give 2 of the picture | make up a worth of 3-4 dots from a shelf | two things offered, worth 4-7 dots, 4 rounds | data-lv: picture swap, things given or offered, smallest worth, rounds | recorded only |
| savegoal | Saving Goal / Mục Tiêu Tiết Kiệm | 3 goals $2-$4 | 3 goals ($3, $5, $7.50), 50c/$1/$2 | 3 goals, each $1 more | 4 goals, $1 more | 4 goals, $2 more, no $2 coin | lv: rounds, extra dollars; data-lv adds kinds of coin | recorded only |
| pocketweek | Pocket Money Week / Tiền Tiêu Vặt Trong Tuần | 4 days, $1 a day, 3 answers | 4 days, $1, 3 answers | 4 days, $1, 4 answers | 5 days, $1, 4 answers | 5 days, $1.50 a day, 5 answers | lv: days, answers; data-lv: days, money a day, answers | recorded only (answers now written before the first tap) |
| pricetags | Price Tags / Gắn Giá | 4 rounds, 2 tags $1-$9 | 4 rounds, 2 tags | 5 rounds, 2 tags | 6 rounds, 3 tags | 6 rounds, 4 tags | lv: rounds, tags; data-lv: rounds, tags | recorded only |
| busfare | Pay for the Bus / Trả Tiền Xe Buýt | 3 fares, only the 3 biggest coins | 3 fares, 5 kinds of coin | 4 fares, 5 kinds | 4 fares, 4 kinds (no $2) | 4 harder fares ($1.30-$4.80), no $2 | lv: fares, no big coin; data-lv: fares, kinds of coin, first fare | fixed: Medium pays 4 fares; Hard pays without the $2 coin |
| lemonade | Lemonade Stand / Quầy Nước Chanh | 3 customers, 1-3 cups, $1 a cup, 3 answers | 3 customers, 1-5 cups, 3 answers | 4 customers, 1-5 cups, 4 answers | 4 customers, 2-8 cups, 4 answers | 5 customers, 2-8 cups, $1.50 a cup, 5 answers | lv + data-lv: customers, cup price, fewest cups, spread, answers | recorded only (cups and answers now written before the first tap) |
| party | Party on a Budget / Tiệc Tiết Kiệm | 2 things with $6 | 3 things with $10 | 3 things with $9 | 4 things with $12 | 4 things with $11 | lv: things, budget; data-lv: things, budget | fixed: Medium has $9, not $10 like Easy |
| recycle | Cans for Coins / Đổi Lon Lấy Tiền | 3 rounds, 2-4 cans, 3 answers | 3 rounds, 2-8 cans, 3 answers | 3 rounds, 2-10 cans, 4 answers | 3 rounds, 5-14 cans, 4 answers | 4 rounds, 10-19 cans, 5 answers | lv + data-lv: rounds, fewest cans, spread, answers | recorded only (cans and answers now written before the first tap) |
| tetmarket | Tết Shopping / Đi Chợ Tết | 3 things, smallest note paid, 3 answers | 3 things, 3 answers | 3 things, 4 answers | 4 things, 4 answers | 4 things, a bigger note paid, 5 answers | lv: rounds, answers; data-lv: rounds, note size, answers | recorded only (answers now written before the first tap) |
| bank | At the Bank / Ở Ngân Hàng | 4 visits, $1-$2 amounts, 3 answers | 4 visits, $1-$2, 3 answers | 5 visits, $1-$3, 4 answers | 6 visits, $1-$3 and 50c, 4 answers | 7 visits, $1-$4 and 50c, 5 answers | lv + data-lv: visits, biggest dollars, half dollars, answers | recorded only |
| sharefair | Share Fairly / Chia Đều | 2 rounds, 2 friends | 2 rounds, 2 then 3 friends | 3 rounds, 2 then 3 friends | 3 rounds, 3 friends | 3 rounds, 4 friends | lv: rounds; data-lv: rounds, friends in round 1 | recorded only |
| market | Market Helper / Bé Đi Chợ | $1 coins (or $1/$2), prices $1-$6 | $1 coins only, $1-$4, 3 rounds | $1/$2, $2-$6 | 10c-$2, 50c-$5 in 10c steps | 5c-$10, $1.05-$20 in 5c steps | data-lv: kinds of money, lowest, highest, step, rounds | recorded only |
| numline | Hop the Number Line / Nhảy Trên Tia Số | 3 rounds, frog on 0-5, 3 answers | 3 rounds, 0-8, 3 answers | 4 rounds, 0-8, 3 answers | 5 rounds, 0-9, 4 answers | 6 rounds, 0-9, 4 answers, only 0, 5, 10 written | lv: rounds, top start, wrong answers | none |
| tenframe | Ten Frame / Khung Mười | 3 rounds, 1-5 counters in order | 3 rounds, 1-10, in order, 3 answers | 4 rounds, 3 answers | 5 rounds, counters scattered, 4 answers | 6 rounds, scattered, 4 answers | lv: rounds, wrong answers; data-lv: scattered | recorded only (scattered flag) |
| dice | Dice Count / Đếm Xúc Xắc | 3 rounds, one die | 3 rounds, one die, 3 answers | 4 rounds, one die, 3 answers | 5 rounds, two dice (2-12), 4 answers | 6 rounds, two dice, 4 answers | lv: rounds, wrong answers; data-lv: dice, biggest total | recorded only (dice count) |
| evenodd | Pairs or Odd? / Chẵn Hay Lẻ? | 3 rounds, up to 9 apples in pairs | 3 rounds, up to 9 apples | 4 rounds, up to 11 | 5 rounds, up to 15 | 6 rounds, up to 19, apples in one row (no pairs) | lv: biggest pair count, rounds | none |
| measure | Measure with Blocks / Đo Bằng Khối | 3 rounds, 2-5 blocks | 3 rounds, 2-8 blocks, 3 answers | 4 rounds, 2-8, 3 answers | 5 rounds, 2-9, 4 answers | 6 rounds, 2-9, 4 answers, only the first block laid | lv: rounds, top length, wrong answers | none |
| beforeafter | Before and After / Số Trước Số Sau | 4 rounds, numbers to 9 | 4 rounds, to 19, 3 answers | 5 rounds, to 29, 3 answers | 6 rounds, to 49, 4 answers | 7 rounds, to 99, 4 answers | lv: rounds, top number, wrong answers | none |
| halves | Share in Half / Chia Đôi | 3 rounds, up to 10 slices | 3 rounds, up to 10 slices, 3 answers | 4 rounds, up to 12, 3 answers | 5 rounds, up to 16, 4 answers | 6 rounds, up to 20, 4 answers | lv: top slices, rounds, wrong answers | none |
| solids | Ball, Box, Can / Khối Cầu, Hộp, Trụ | 3 things, names shown | 3 things | 4 things | 5 things | 6 things, no names under the solids | lv: things | none |
| townshapes | Shape Hunt in Town / Tìm Hình Trong Phố | 3 rounds, 3 choices, names | 4 rounds, 3 choices | 5 rounds, 3 choices | 6 rounds, 4 choices | 6 rounds, 4 choices, no names | lv: rounds, wrong choices; data-lv: names shown | recorded only (names flag) |
| tiles | Tile the Floor / Lát Sàn | floor 3 x 3 | 3 x 3 | 4 x 3 | 4 x 4 | 4 x 5 | lv: columns, rows | none |
| turnit | Turn It Round / Xoay Hình | 3 turns, star 1-3 clicks away | 3 rounds, star 1-3 away | 4 rounds, 1-3 away | 5 rounds, 2-3 away | 6 rounds, always 3 away | lv: rounds, clicks away | none |
| shapetrain | Shape Train / Tàu Hình Khối | 3 wagons, 3 choices, names | 4 wagons, 3 choices | 5 wagons, 3 choices | 6 wagons, 4 choices | 6 wagons, 4 choices, no names | lv: wagons, wrong choices; data-lv: names shown | recorded only (names flag) |
| linescurves | Lines and Curves / Nét Thẳng Nét Cong | 3 marks | 3 marks | 4 marks | 6 marks | 8 marks | lv: extra marks | none |
| foldbox | Fold the Box / Gấp Hộp | 1 box, 4 sides | 1 box, 4 sides | 2 boxes, 4 sides | 2 boxes, 5 sides (lid) | 3 boxes, 5 sides | lv: boxes; data-lv: boxes, sides | recorded only (sides) |

`moneylogic.ts` registers no game (sums only).


## Learning and Fun learning: letters, words, reading, me, science, Tiếng Việt

Files: js/games/reading.ts, reading2.ts, storyhelp.ts, words2.ts, learning.ts, talkgames.ts, me2.ts, science.ts, tiengviet.ts, familyquiz.ts.

| id | Name (EN / VI) | Under-5 | Easy | Medium | Hard | Talent | Recorded as | Change this round |
|---|---|---|---|---|---|---|---|---|
| rd_trace | Lantern Letters / Đèn Lồng Chữ Cái | 6 letters, 3 rounds, trace 55 % of dots, wide brush | 8 letters, 4 rounds, 75 %, brush 0.11 | 14 letters, 80 %, brush 0.10 | all letters, 85 %, brush 0.09, some capitals | all letters, 92 %, brush 0.075 | data-lv: letters, rounds, share to trace, brush | recorded only |
| rd_sounds | Sound Pond / Ao Âm Thanh | 6 letters, 3 rounds, 2 fish | 6 letters, 4 rounds, 3 fish | 12 letters, 4 fish, fish swim | all letters, 5 fish | all letters, 6 fish | data-lv: letters, rounds, fish | recorded only |
| rd_build | Word Builder / Ghép Chữ | tiles in order, 3 rounds | list 1, 4 rounds, mixed, 0 spare | list 2, 1 spare tile | list 3, 2 spare | list 3, 3 spare | data-lv: word list, rounds, spare tiles, order | recorded only |
| rd_rhyme | Rhyme Time / Tìm Vần | 4 rounds, yes / no, pictures only | 5 rounds, yes / no, words shown | 5 rounds, which rhymes, 3 choices | 5 rounds, 4 choices, words only | 7 rounds, 4 choices, words only | data-lv: rounds, buttons, words, pictures | recorded only |
| rd_sight | Word Balloons / Bóng Bay Chữ | list 1, 2 balloons | list 1, 3 balloons, 5 rounds | list 2, 4 balloons | list 3, 5 balloons, 2 look-alikes | list 3, 6 balloons, 2 look-alikes | data-lv: list, rounds, balloons, look-alikes | recorded only |
| rd_tones | Tone Marks / Dấu Thanh | 4 rounds, hear a word, tap its picture | 5 rounds, 3 words (EN 2) | 5 rounds, 4 words (EN 3) | 5 rounds, pick the mark of 6 (EN 4 words) | 7 rounds, as Hard | data-lv: rounds, choices, what is asked | recorded only |
| rd_syllable | Syllable Drum / Trống Đếm Tiếng | up to 2 beats, any count is fine | up to 2 beats, exact, word shown | up to 3 beats | up to 4 beats | up to 4 beats, 6 rounds, word hidden | data-lv: most beats, rounds, word shown, count checked | recorded only |
| rd_match | Word and Picture / Chữ và Hình | 2 pictures, word said | 3 pictures | 4 pictures | read the picture, 4 words, 2 look-alikes | 6 words, 2 look-alikes | data-lv: rounds, choices, what is tapped, look-alikes, word said | recorded only |
| rd_sentence | Sentence Train / Tàu Câu | carriages in order, sentence said | list 1, 3 rounds, mixed | list 2 | list 3 | list 3, 4 rounds | data-lv: list, rounds, order, sentence said | recorded only |
| rd_readalong | Read With Me / Cùng Đọc | 3 picture answers, question said | 2 answers, pictures and words | 3 answers, pictures and words | 3 answers, words only | 3 words only, question not read aloud (ear) | data-lv: answers, pictures, question said; lv() | fixed: answers count, pictures and read-aloud now change by level |
| rd_listentouch | Listen and Touch / Nghe và Chạm | 4 rounds, 2 pictures, no words | 4 rounds, 2 pictures with words | 3 pictures | 4 pictures | 6 rounds, 5 pictures | data-lv: rounds, pictures, words | recorded only |
| rd_storychoice | Story Choices / Chọn Trong Truyện | 2 pictures, ear | 2 pictures, ear | 3 pictures, ear | 3 pictures, story told once | 4 pictures (another story's answer), told once | data-lv: rounds, pictures, ear; lv() | fixed: Easy 2 pictures, Hard no ear, Talent a fourth picture |
| rd_blend | Blend the Sounds / Ghép Âm | 3 rounds, 2 choices, glow after 1 miss | 3 rounds, 2 choices, glow after 1 miss | 3 rounds, 3 choices, glow after 2 | 4 rounds, 3 choices, no glow | 5 rounds, 4 choices, no glow | data-lv: rounds, buttons, misses before glow | fixed: rounds, choices and hint glow by level (shared in reading2) |
| rd_hats | Vowel Hats / Mũ Cho Chữ | 3 rounds, 2 choices, glow after 1 | 3, 2 choices, glow 1 | 3, 3 choices, glow 2 | 3, 3 choices, no glow | 3, 3 choices, no glow (only 3 hatted letters) | as rd_blend | fixed: as rd_blend |
| rd_endings | Word Endings / Vần Cuối | 3 rounds, 2 choices, glow 1 | 3, 2, glow 1 | 3, 3, glow 2 | 4, 3, no glow | 5, 4, no glow | as rd_blend | fixed: as rd_blend |
| rd_compound | Two Words Make One / Ghép Hai Từ | 3, 2, glow 1 | 3, 2, glow 1 | 3, 3, glow 2 | 4, 3, none | 5, 4, none | as rd_blend | fixed: as rd_blend |
| rd_labels | Label the Picture / Gắn Tên Cho Tranh | 3, 2, glow 1 | 3, 2, glow 1 | 3, 3, glow 2 | 4, 3, none | 5, 4, none | as rd_blend | fixed: as rd_blend |
| rd_signs | Signs in Town / Biển Báo Trong Phố | 3, 2, glow 1 | 3, 2, glow 1 | 3, 3, glow 2 | 4, 3, none | 5, 4, none | as rd_blend | fixed: as rd_blend |
| rd_questions | Who, What, Where / Ai, Gì, Ở Đâu | 3, 2, glow 1 | 3, 2, glow 1 | 3, 3, glow 2 | 4, 3, none | 4, 3, none (4 questions) | as rd_blend | fixed: as rd_blend |
| rd_many | One and Many / Một và Nhiều | 3 rounds, 2 choices, glow 1 | 3, glow 1 | 3, glow 2 | 4, no glow | 5, no glow | as rd_blend | fixed: rounds and hint glow by level |
| rd_caps | Big and Small Letters / Chữ Hoa Chữ Thường | 4 rounds, 2 choices, glow 1 | 4, 2, glow 1 | 4, 3, glow 2 | 5, 3, none | 6, 3, none | as rd_blend | fixed: as rd_blend |
| rd_poem | Read a Little Poem / Đọc Bài Thơ Nhỏ | 3 rounds, 2 choices, glow 1 | 3, 2, glow 1 | 3, 3, glow 2 | 3, 3, none | 3, 3, none (3 poems) | as rd_blend | fixed: as rd_blend |
| rd_missing | Missing Letter / Điền Chữ Còn Thiếu | 3, 2, glow 1 | 3, 2, glow 1 | 3, 3, glow 2 | 4, 3, none | 5, 3, none | as rd_blend | fixed: as rd_blend |
| rd_book | Make a Little Book / Làm Sách Nhỏ | 3 free choices | same | same | same | same | data-lv: 3, 3, free | exception: free creative book, no right answer |
| rd_storyhelp | Story Helpers / Cùng Giúp Trong Truyện | one thing at a time, used places named, glow | all places named, older tasks | plus instruction kept on screen | places unnamed, instruction kept | as Hard, things show pictures only | data-lv: place words, instruction kept, thing words, older tasks | recorded only |
| whichgroup | Which Group? / Thuộc Nhóm Nào? | 3 things, 3 groups | 3 things, 3 groups | 4 things, 3 groups | 5 things, 4 groups | 6 things, 5 groups | lv(): things, groups | recorded only |
| storyorder | Story in Order / Xếp Tranh Kể Chuyện | 4 cards | 4 cards | plus 1 stray card | plus 2 strays | 2 strays, no words on cards | lv(): strays; data-lv: strays, words | recorded only |
| guesswhat | Guess What I Am / Đoán Xem Tôi Là Gì | 3 animals | 3 animals | 4 | 5 | 6, words only | lv(): animals; data-lv: rounds, animals, pictures | recorded only |
| actions | Action Words / Từ Chỉ Hoạt Động | 3 words | 3 words | 4 | 5 | 5, words only | lv(): words; data-lv: rounds, words, pictures | recorded only |
| position | In, On, Under / Trong, Trên, Dưới | 3 rounds | 3 rounds | 4 | 5 | 5, buttons change places | lv(): rounds; data-lv: rounds, order | recorded only |
| clock | What's the Time? / Mấy Giờ Rồi? | o'clock, 3 times | o'clock, 3 times | o'clock and half past, 3 times | quarters, 4 times | quarters, 5 times, no words | lv(): wrong times; data-lv: rounds, minutes, words | recorded only |
| sums | Add It Up / Cộng Trừ Vui | to 5, 3 answers | to 5, 3 answers | to 8 | to 15, take-away rounds | to 30, take-away, 4 answers | lv(): wrong answers; data-lv: rounds, biggest number, take-away | recorded only |
| opposites | Opposites / Từ Trái Nghĩa | 5 rounds, 3 answers | 5 rounds, 3 answers | 6, 4 answers | 7, 4 answers | 8, 5 answers, words only | lv(): rounds, others; data-lv: rounds, pictures | recorded only |
| animalsounds | Who Says That? / Con Gì Kêu Thế? | 2 animals | 2 animals | 3 | 4 | 6 | lv(): others; data-lv: rounds, animals | recorded only (level now picked before the sounds load) |
| phonics | First Sounds / Âm Đầu Tiên | 2 letters | 2 letters | 3 | 4 | 6 | lv(): other letters | recorded only |
| vi_tones | Tone Detective / Thám Tử Dấu Thanh | 4 rounds, 2 marks | 5 rounds, 3 marks | 5 rounds, 4 marks | 6 rounds, 6 marks | 7 rounds, 6 marks, two-syllable words | data-lv: rounds, marks, two-syllable | recorded only |
| vi_build | Build a Syllable / Bé Ghép Vần | 4 rounds, 2 choices, first sound only | 4, 2, sound and rhyme | 5, 3, plus tone | 5, 4, harder words | 6, 5, hardest words, not heard first, c / k rule | data-lv: rounds, choices, steps, word band, heard first | recorded only |
| sayfind | Say It, Find It / Nói Rồi Tìm | 4 rounds, 2 pictures | 5 rounds, 4 pictures | 6 pictures | 6 pictures, big and little of one | 6 rounds, 8 pictures, big and little | data-lv: rounds, pictures, big-little (start) | recorded only |
| marketcount | Market Counting / Đếm Ở Chợ | 3 rounds, count 1-3 | 4 rounds, count 2-5 | count 5-10 | add 2 / take 1, baskets 2-5 / 3-6 | add / take, baskets 5-8 / 6-10 | data-lv: rounds, mode, amounts (start) | recorded only |
| feelings | How Do They Feel? / Bạn Thấy Thế Nào? | 3 rounds, 2 faces | 4 rounds, 4 faces with words | plus help step, 2 choices | help step, 3 choices | faces without words, help 4 choices | data-lv: rounds, faces, words, help choices (start) | recorded only |
| soundhunt | First Sound Hunt / Săn Âm Đầu | 3 rounds, 1 of 2 | 4 rounds, 2 of 4, first sound | 2-3 of 6 | end sound (VI tone), 2 of 4 | end sound, 3 of 6 | data-lv: rounds, pictures, matches, sound (start) | recorded only |
| sci_float | Float or Sink? / Nổi hay Chìm? | 3 rounds, 1 thing, easy things | 3, 1, easy | 4, 1, easy-medium | 5, 1, medium-hard | 3 rounds, 3 things guessed before trying | data-lv: rounds, things per guess, band | recorded only |
| sci_magnet | Magnet Pull / Nam Châm Hút | as sci_float | as sci_float | as sci_float | as sci_float | as sci_float | as sci_float | recorded only |
| sci_ramp | Rolling Ramps / Dốc Lăn Bóng | 3 rounds, 2 ramps | 3, 2 ramps | 3, 3 ramps | 4, 3 ramps, close heights | 3, 4 ramps, one grassy | data-lv: rounds, ramps, grass | recorded only |
| sci_seesaw | Seesaw Lift / Bập Bênh Nâng Bạn | 3 rounds, 2 seats | 3, 2 seats | 3, 3 seats | 4, 4 seats, weights shown, closest seat | 3, 5 seats, heavier loads | data-lv: rounds, seats, numbers, question | recorded only |
| sci_shadow | Lamp and Shadow / Đèn và Bóng | 3 rounds, shadow side | 3, side | 4, side and high / low | 4, high, near / far, ray drawn | 3, aim the shadow at a star, 4 rings | data-lv: rounds, kinds, rings, ray | recorded only |
| sci_sound | Bottle Music / Nhạc Chai Nước | 3 rounds, 2 bottles | 3, 2 bottles | 4, 3 bottles | 4, 4 bottles | 3, 5 bottles, match the note | data-lv: rounds, bottles, question | recorded only |
| myday | My Day / Một Ngày Của Em | 4 steps | 4 steps | 5 | 6 | 7, words only | lv() + data-lv: steps, words | none |
| plate | Healthy Plate / Đĩa Ăn Lành Mạnh | 4 foods | 4 foods | plus 1 treat | plus 2 | plus 4, words only | lv() + data-lv: buttons, words | none |
| kindchoice | Kind Choices / Việc Làm Tốt | 3 kind things | 4 kind things | plus 1 unkind | plus 2 | plus 4, words only | lv() + data-lv: buttons, words | none |
| familyquiz | Family Quiz / Đố Vui Gia Đình | gentle (try again) | gentle | gentle | gentle | gentle | none | exception: questions and answers are written by the family, read together; only listed once a grown-up adds questions |


## Folk games: play outside and Vietnamese games

Files: js/games/outside.ts, folk.ts, folk2.ts, folk-court.ts, vietnam.ts, vietnam2.ts, pending-vietnam.ts, trongnu.ts, tienlen.ts, cacuangua.ts.

| id | Name (EN / VI) | Under-5 | Easy | Medium | Hard | Talent | Recorded as | Change this round |
|---|---|---|---|---|---|---|---|---|
| hideseek | Hide and Seek / Trốn Tìm | 3 friends, 3 trees | 4 friends, 4 trees | 5 friends, 5 trees | 6 friends, 6 trees | 6 friends, 6 trees, friend may sneak to another tree | data-lv friends, trees, sneak; lv() | recorded only |
| duckgoose | Duck, Duck, Goose / Vịt, Vịt, Ngỗng | 3 rounds, 5 in circle | 3 rounds, 5 in circle | 4 rounds, 6 | 5 rounds, 7 | 6 rounds, 8, only the first friend glows | data-lv rounds, players, noglow; lv() | recorded only |
| redgreen | Red Light, Green Light / Đèn Xanh Đèn Đỏ | 4 steps, green 2.6 s, red 1.4 s | 5 steps, green 2.4 s, red 1.6 s | 6 steps, 1.8 s / 1.4 s | 8 steps, 1.3 s / 1.1 s | 10 steps, 1.0 s / 0.9 s, red step sends back 2 | data-lv steps, greenMs, redMs, back; lv() | recorded only |
| simon | Simon Says / Simon Bảo | 4 rounds, 1 other action | 5 rounds, 1 other action, 2 tricks | 6 rounds, 2 others | 8 rounds, 3 others | 10 rounds, 4 others, half the calls are tricks | data-lv rounds, others, tricks; lv() | recorded only |
| eggspoon | Egg and Spoon Race / Chạy Thìa Trứng | 4 steps, still 1.5 s | 5 steps, still 1.3 s | 6 steps, still 1.0 s | 8 steps, still 0.75 s | 9 steps, still 0.55 s, wobble step costs one back | data-lv steps, stillMs, rollMs, drop; lv() | recorded only |
| chairs | Musical Chairs / Ghế Âm Nhạc | 3 rounds, 1 friend, friend sits after 0.6 s | 3 rounds, 1 friend, 0.9 s | 4 rounds, 1 friend, 0.6 s | 5 rounds, 2 friends, 0.45 s | 6 rounds, 3 friends, 0.3 s | data-lv rounds, friendMs, friends; lv() | recorded only |
| kicktokick | Kick to Kick / Đá Bóng Qua Lại | 4 passes, ball 0.7 s | 5 passes, 0.8 s, returns to a fixed spot | 6 passes, 0.6 s, return lands anywhere | 8 passes, 0.45 s, ball bounces every 1.8 s | 10 passes, 0.35 s, bounces every 1.1 s | data-lv passes, flyS, bounceMs; lv() | recorded only |
| nippers | Little Nippers / Bé Tập Cứu Hộ Biển | 3 rescues, 3 swimmers | 4 rescues, 4 swimmers | 5, 5 | 6, 6 | 7 rescues, 6 swimmers, raised arm blinks | data-lv target, swimmers, blink; lv() | recorded only |
| hoops | Rolling Hoops / Lăn Vòng | 4 steps, no roll-back | 6 steps, no roll-back, roll 0.8 s | 6 steps, push within 2.6 s, 0.7 s | within 1.7 s, 0.55 s | within 1.1 s, 0.45 s | data-lv steps, keepMs, rollS; lv() | recorded only |
| tag | Tag! / Đuổi Bắt | 3 friends, hop 1.8 s | 4 friends, hop 1.5 s | 5, 1.2 s | 6, 0.9 s | 7, 0.7 s | data-lv target, hopMs, moveS; lv() | recorded only |
| mrwolf | What's the Time, Mr Wolf? / Mấy Giờ Rồi, Ông Sói? | auto stop, never caught, 1-2 steps | auto stop, run 3.8 s, 1-3 steps | press Stop yourself, run 3.0 s, 1-4 steps | read the clock face, run 2.0 s | read the clock, run 1.3 s, dinner comes sooner | data-lv auto, clock, runMs | recorded only |
| chuyen | Knucklebones / Đánh Chuyền | 3 sticks, pick 1-1-2, ball floats | 5 sticks, pick 1-2-2, ball 3.6 s | 1-2-3, 3.0 s | 2-3-4, 2.2 s | 6 sticks, 3-4-5, 1.6 s | data-lv need, airMs, sticks | recorded only |
| dragon | Dragon Snake to the Clouds / Rồng Rắn Lên Mây | 1 answer each, block 4, doctor 4.2 s | 2 answers, block 5, 3.6 s | block 6, 3.0 s | block 8, 2.1 s | block 11, 1.45 s | data-lv blocks, doctorMs, answers | fixed: values written at start (were written only after the chant, so empty at first) |
| marbles | Marbles / Bắn Bi | 3 out, aim help | 3 out, aim help | 4 out, no aim help | 5 out | 7 out, wider circle | data-lv need, wide | recorded only |
| skipping | Skipping Rope / Nhảy Dây | 5 jumps, rope waits | 6 jumps, turn 1.9 s | 8, 1.7 s | 12, 1.35 s | 18, 1.08 s | data-lv jumps, period | recorded only |
| snap | Snap! / Snap! (Bắt Cặp) | 3 snaps, 4 pictures, uncles never snap | 3 snaps, 5 pictures, uncles 2.4 s, match glows | 4, 6 pictures, 1.9 s | 5, 8 pictures, 1.2 s | 6, 10 pictures, 0.8 s, cards 0.85 s | data-lv need, kinds, uncleMs, flipMs | recorded only |
| dacau | Shuttlecock Kick / Đá Cầu | 6 kicks, slow fall, tap anywhere | 8 kicks, fall 380, hit 52 px | 10, 440 | 15, 560 | 22, 680, hit 44 px | data-lv kicks, gravity, hitR | recorded only |
| datnieu | Smash the Pot / Đập Niêu | 4 pots, peek | 5 pots | 6 pots | 8 pots | 10 pots, friends shout every other step | data-lv pots, quiet | recorded only |
| kite | Kite Flying / Thả Diều | 5 stars, light wind | 6 stars, 2 birds | 8 stars | 12 stars | 17 stars, gusts x1.3, 3 birds | data-lv stars, gust, birds | recorded only |
| sackrace | Sack Race / Nhảy Bao Bố | friends 0.9/0.8 hops/s, wait for you | friends 1.3 hops/s | 1.5 | 2.1 | 2.75 | data-lv friend hop rate | recorded only |
| cricket | Backyard Cricket / Cricket Sân Sau | 6 runs, endless balls, ball 0.45, window 0.22 | 8 runs, 12 balls, 0.55, 0.17 | 12 runs, 0.65, 0.14 | 20 runs, 0.85, 0.10 | 28 runs, 1.05, 0.075 | data-lv runs, speed, window | recorded only |
| parcel | Pass the Parcel / Chuyền Quà | 3 layers, beat 300 ms, no questions | 4 layers, 260 ms, 3 answers | 5 layers, 240 ms | 6 layers, 200 ms | 6 layers, 160 ms, 4 answers | data-lv layers, beatMs, answers | recorded only |
| chichi | Chi Chi Chành Chành | 3 rounds, 1.5 s to pull | 5 rounds, 1.0 s, 40 % fake pause | 0.85 s | 0.6 s | 0.44 s, 60 % fake pause | data-lv catchMs, fake | recorded only |
| words | Two Homes Words / Từ Ngữ Hai Quê | 5 words, 2 answers | 6 words, 3 answers | 8 words, 3 answers | 10 words, 4 answers | 12 words, 4 answers, no example sentence | data-lv rounds, answers, noexample | recorded only |
| meochuot | Cat and Mouse / Mèo Đuổi Chuột | gates in place, hint glow | gates in place | gate buttons change places | arms drop after 2.2 s | arms drop after 1.1 s | data-lv mixed, armsMs | recorded only |
| cuopco | Flag Relay / Cướp Cờ | 3 calls, hint glow | 3 calls | 4 calls | 5 calls, buttons change places | 6 calls, called number shown 1.5 s only | data-lv calls, mixed, memory | recorded only |
| keocua | Pull Saw Song / Kéo Cưa Lừa Xẻ | any time is on the beat | beat 1.1 s, wide window | 1.0 s | 0.85 s | 0.7 s, no pull/push reminder | data-lv beatMs, noreminder | recorded only |
| danhdao | Đánh Đáo | 3 targets, radius 38, no strength buttons | 3 targets, radius 30 | 3, 24 | 4 in new places, 18 | 5, 15, no aim line | data-lv targets, radius, noline | recorded only |
| nemcon | Throw the Còn / Ném Còn | 3 hoops, radius 38 | 3 hoops, radius 30 | 3, 24 | 4 in new places, 18 | 5, 15, no aim line | data-lv targets, radius, noline | recorded only |
| trongnu | Flower Stack Jump / Trồng Nụ Trồng Hoa | jump any time | beat 3.4 s, moment .30-.90 | 3.0 s, .38-.83 | 2.8 s, .47-.73 | 2.4 s, .52-.68 | data-lv tier, cycleMs, window | recorded only (window now written too) |
| duathuyen | Boat Race / Đua Thuyền | any time is on the beat | beat 1.1 s | 1.0 s | 0.85 s | 0.7 s, no left/right reminder | data-lv beatMs, noreminder | recorded only |
| oanquan | Ô Ăn Quan / Ô Ăn Quan | Tèo plays the gentlest move | Tèo careless 55 % | careless 20 % | always best capture | best capture minus the child's best reply | data-lv careless (or gentlest), lookahead | recorded only (under-5 now written as gentlest); online untouched |
| caro | Caro / Cờ Caro | board 3 x 3 (6 x 6 at level 2+), Bống never wins | board 3 x 3, 3 in a row | 5 x 5, 4 in a row | 6 x 6, 4 in a row, Bống builds lines 70 % | 7 x 7, 5 in a row, always builds | data-lv N, K, smart (solo only) | recorded only; online untouched |
| hopscotch | Hopscotch / Nhảy Lò Cò | court by level number (6 at level 1) | 6 squares, one way | 8 squares, one way | 10 squares, hop back | 10, hop back, pick up the stone | data-lv squares, back, pickup | recorded only |
| tug | Tug of War / Kéo Co | kids pull 1.4/s, never past the middle | kids pull 1.9/s | 2.3/s | 3.2/s | 4.1/s | data-lv kids pull rate (solo only) | fixed: rate written before the 1.2 s count-in (was written after, so empty at first); online untouched |
| tienlen | Tiến Lên (cards) / Tiến Lên miền Nam | 2 hands, hint every turn, friends lazy 45 %, 1.2 s | hint every turn at level 1, lazy 30 %, 0.9 s | lazy 12 %, play to win, 0.9 s | never lazy, 0.75 s | never lazy, 0.55 s, Hint hidden | data-lv smart, lazyP, thinkMs, hint/nohint | recorded only; online untouched |
| tienlenbac | Tiến Lên, northern rules / Tiến Lên miền Bắc | as tienlen | as tienlen | as tienlen | as tienlen | as tienlen | as tienlen | recorded only |
| banhchung | Wrap Bánh Chưng / Làm Bánh Chưng Ngày Tết | 1 cake | 1 cake | 2 cakes | 2 cakes, buttons change places | 3 cakes, mixed, words only | data-lv cakes, mixed, words; lv() | recorded only |
| denongsao | Make a Star Lantern / Làm Đèn Ông Sao | 1 lantern | 1 lantern | 2 lanterns | 2, mixed | 3, mixed, words only | data-lv lanterns, mixed, words; lv() | recorded only |
| mualan | Lion Dance Drummer / Múa Lân Rộn Ràng | 6 beats, guide on | 8 beats, guide on | 10 beats | 14 beats, guide first bar only | 16 beats, card hidden after first bar | data-lv beats, memory, hidden; lv() | recorded only |
| cayneu | Tết Pole Decorator / Trồng Cây Nêu Ngày Tết | any order | any order | asked order | asked order, mixed | asked, mixed, words only | data-lv asked, mixed, words | recorded only |
| cacuangua | Horse Racing Chess / Cờ Cá Ngựa | short track, 2 players, gentle helper | short track, 2 players, gentle helper | classic track, 2 players, thinking helper | classic, 3 players, careful helper | classic, 4 players, careful helper moves at 0.22 s | data-lv mode, players, helper | recorded only; online untouched |


## Animals, farm and nature

Files: js/games/farmgames.ts, animals2.ts, nature2.ts, more.ts.

| id | Name (EN / VI) | Under-5 | Easy | Medium | Hard | Talent | Recorded as | Change this round |
|---|---|---|---|---|---|---|---|---|
| order | Order Board / Bảng Đặt Hàng | orders up to 3, 1 extra food, one item | up to 3, 1 extra food, one item | up to 5, 2 extra foods, one item | up to 10, 2 extra foods, two items half the time | up to 12, 3 extra foods, always two items (second up to 6) | data-lv: biggest order, two-item mode (0/1/2); lv: extra foods | recorded only |
| sortout | Sort It Out / Phân Loại Nào | 2 baskets, 2 each, colours | 2 baskets, 2 each, colours | 3 baskets, 2 each, colours then kinds | 3 baskets, 3 each, kinds | 3 baskets, 4 each, kinds | data-lv: baskets, things per basket, by-kind mode (0/1/2) | recorded only |
| bunny | Feed the Bunny / Cho Thỏ Ăn | up to 3 carrots, 3 rounds | up to 3 | up to 5 | up to 10 | up to 20 | data-lv: most carrots, rounds | recorded only |
| jigsaw | Photo Puzzle / Ghép Ảnh Của Bé | 2 x 2 | 2 x 2 | 3 x 3 | 4 x 4 | 5 x 5 | data-lv: pieces per side; lv: 2,3,4,5 | fixed: Medium was 2 x 2 like Easy, Hard 3 x 3 |
| oddone | Odd One Out / Tìm Hình Khác Loại | 4 pictures (3 alike), 4 rounds | 4 pictures | 5 pictures | 6 pictures | 7 pictures | data-lv: pictures, rounds; lv: alike count | fixed: Medium was the same as Easy; Hard 5, Talent 6 alike |
| tune | Copy the Tune / Nhại Giai Điệu | 4 bars, tune of 2 notes, 3 rounds | 4 bars, 2 notes | 4 bars, 3 notes | 6 bars, 4 notes | 8 bars, 6 notes | data-lv: bars, first tune length, rounds | recorded only |
| tower | Build a Tower / Xây Tháp Cao | 3 then 4 blocks | 3 then 4 blocks | 4 then 5 | 6 then 7 | 8 then 8 | data-lv: blocks in tower 1 and 2 | recorded only |
| duckmaze | Duckling Maze / Vịt Con Tìm Mẹ | runs the maze game (strategy.ts) with ducks | maze 4 x 4 then 5 x 5, trail | 5 then 6, trail | 7 then 8, trail | 9 then 9, no trail | data-lv written by maze (strategy.ts): sizes, trail | none (owned by the maze game) |
| balloon | Balloon Flight / Khinh Khí Cầu | 5 rings, speed 0.45 | 5 rings, speed 0.45 | 6 rings, 0.45 | 10 rings, 0.5 | 15 rings, 0.6 | data-lv: rings, speed; lv: speed | recorded only |
| bubbles | Bubble Machine / Máy Thổi Bong Bóng | 10 bubbles, float 6-10 s | 10, 6-10 s | 12, 6-10 s | 18, 5-9 s | 25, 4-8 s | data-lv: bubbles to pop, base float seconds; lv: float | recorded only |
| crabwalk | Crab Walk / Cua Bò Ngang | 3 steps, fixed left-right-left, hole always shown | 4 steps, hole shown | 6 steps, hole shown | 8 steps, hole shows 1.2 s | 10 steps, hole shows 0.6 s | data-lv: steps, hole ms; lv: both | none (already recorded) |
| whohome | Who Lives Here? / Nhà Của Ai? | 3 easy questions, 2 answers | 3 easy, 2 answers | 4 (one hard), 3 answers | 6 (hard + 2 easy), 3 answers | 7 (all), 4 answers | data-lv: questions, answers; lv: set name, extra answers | recorded only (note now a short set name) |
| mumbaby | Mums and Babies / Mẹ Và Con | 3 easy, 2 answers | 3, 2 answers | 4, 3 answers | 6, 3 answers | 7, 4 answers | as whohome | recorded only (short set name) |
| feedzoo | Feed the Zoo / Cho Thú Ăn | 3 easy, 2 answers | 3, 2 answers | 4, 3 answers | 6, 3 answers | 7, 4 answers | as whohome | recorded only (short set name) |
| buffalo | Buffalo to the Field / Dắt Trâu Ra Đồng | 4 steps, forward only | 5 steps, forward only | 7 steps, turns with sign | 9 steps, turns, buttons move | 11 steps, turns, buttons move, sign 1 s | data-lv: steps, turns, mixed, sign ms; lv: steps | none (already recorded) |
| reefcount | Reef Count / Đếm Cá Rạn San Hô | 3 easy (3-5 fish), 2 answers | 3, 2 answers | 4 (up to 7 fish), 3 answers | 6, 3 answers | 7 (up to 9 fish), 4 answers | as whohome | recorded only (short set name) |
| tracks | Whose Footprints? / Dấu Chân Của Ai? | 3 easy, 2 answers | 3, 2 answers | 4, 3 answers | 5, 3 answers | 6, 4 answers | as whohome | recorded only (short set name) |
| catchfish | Catch-and-Release Fish / Vớt Cá Thơ Ngây | 3 fish, still | 4 fish, still | 5 fish, moves every 2.2 s | 7, every 1.5 s | 8, every 1 s | data-lv: fish, swim ms; lv: both | none |
| emueggs | Emu Egg Basket / Nhặt Trứng Đà Điểu | 3 eggs, no hen eggs | 4, none | 5, 1 hen egg | 6, 3 hen eggs | 7, 5 hen eggs | data-lv: emu eggs, hen eggs; lv: both | none |
| reefclean | Great Barrier Reef Cleaner / Bảo Vệ Rạn San Hô | 4 litter | 5 litter | 6 litter | 8 litter, a turtle swims by | 10 litter, turtle and fish, litter drifts 1.6 s | data-lv: litter, animals, drift ms; lv: litter, animals | none |
| moreless | More or Less? / Nhiều Hơn hay Ít Hơn? | up to 5, "more" only, 5 rounds | up to 5, "more" only | up to 6, more and less | up to 10, more and less | 6-16, sides 1-2 apart | data-lv: most per side, less questions (0/1), gap (0 any, 2) | recorded only |
| days | Days of the Week / Các Ngày Trong Tuần | 3 cards, tomorrow only, today lit | 3 cards, tomorrow only | 3 cards, yesterday every other round | 4 cards, yesterday every other | 5 cards, yesterday every other, today not lit | data-lv: cards, yesterday (0/1), today lit (0/1); lv: wrong cards | fixed: Medium was the same as Easy; Medium now asks "what was yesterday?" every other round (was Hard and Talent only) |
| bodyparts | My Body / Cơ Thể Của Em | 3 cards, "where is" only | 4 cards, "where is" | 4 cards, "what do we use" every other | 5 cards, every other | 6 cards, always "what do we use" | data-lv: cards, use-question mode (0/1/2); lv: wrong cards | recorded only |
| oantuti | Oẳn Tù Tì | 2 wins, friend always loses | 3 wins, friend loses every 3rd | 3 wins, every 4th | 4 wins, never gives one | 5 wins, never gives one, reads your hands half the time | data-lv: wins, gift every n (1 always, 0 never), reads hands; lv: wins, gift. Online path unchanged | recorded only |
| eggs | Egg Hunt / Nhặt Trứng | 12 spots, 2-3 eggs first field | 12 spots, 3-4 eggs | 12, 3-5 | 12, 3-7 | 16 spots, 5-10 | data-lv: spots, fewest and most eggs in field 1 | recorded only |
| sudoku | Picture Sudoku / Sudoku Hình | 3 x 3, 3 empty | 3 x 3, 3 empty | 4 x 4, 5 empty | 4 x 4, 7 empty | 4 x 4, 10 empty | data-lv: board size, empty squares | recorded only |
| nemlon | Can Knock-Down / Ném Lon | unlimited throws, arrow 0.35, target 0.2 | 6 throws, arrow 0.57, target 0.16 | 5, 0.69, 0.13 | 4, 0.93, 0.09 | 3, 1.25, 0.065 | data-lv: throws, arrow speed, target width | recorded only |


## Music, going places and the arcades

Files: js/games/music.ts, music2.ts, places2.ts, cities.ts, sparkleorchard.ts, sparklefruitbar.ts, fruitparade.ts.

| id | Name (EN / VI) | Under-5 | Easy | Medium | Hard | Talent | Recorded as | Change this round |
|---|---|---|---|---|---|---|---|---|
| music | Music Corner / Góc Âm Nhạc | 8 pads, 4 instruments, record up to 40 notes | same | same | same | same | data-lv `8,40,free` | exception: free music pad, no goal and nothing to get right (data-lv written so the frame is not empty) |
| dantranh | Zither Strings / Đàn Tranh | 4 notes, lit string in steps | 6 notes, follow the lit string (fixed steps) | 8 notes, lit string in any order | 10 notes, string glows only 0.7 s | 12 notes, zither plays 3 strings, child plays them back | data-lv `notes,mode`; lv(notes), lv(mode) | recorded only |
| bushband | Bush Band / Ban Nhạc Đồng Quê | 3 plays, any instrument | 5 plays, any instrument | 6 plays, leader calls one (picture stays) | 8 plays, called picture shows 1.2 s | 10 plays, two called in a row, shows 1.6 s | data-lv `plays,called/free,showMs,pairs`; lv(plays), lv(showMs) | recorded only |
| drumecho | Drum Echo / Trống Đáp | 3 rounds, 2-4 beats, 260 ms gap | 4 rounds, 2-4 beats, 260 ms | 5 rounds, 2-5 beats, 240 ms | 6 rounds, 3-6 beats, 200 ms | 7 rounds, 4-8 beats, 160 ms | data-lv `rounds,minBeats,maxBeats,gap`; lv x4 | recorded only |
| loudquiet | Loud and Quiet / To Và Nhỏ | 3 sounds, roar = loud, squeak = quiet | 4 sounds | 6 sounds | 8 sounds, roar can be soft and squeak loud | 10 sounds, mixed, loud/quiet closer (0.24 / 0.06), plays once (no replay) | data-lv `rounds,mixed,vols,once`; lv(rounds) | recorded only |
| songsteps | Song Steps / Xếp Câu Hát | 4 lines, no other-song lines | 4 lines, no decoy | 4 lines + 1 decoy line | 4 + 2 decoys, buttons reshuffle after each line | 4 + 2 decoys, reshuffle, sung lines hidden | data-lv `buttons,mixed,hidden`; lv(decoys) | recorded only |
| cyclo | Cyclo Ride / Đi Xích Lô | 2 free choices | 2 free choices | 2 free choices + "which did you see?" (3 pictures) | same, 4 pictures | 2 free choices + "which did you see first?" (4 pictures, was 3) | data-lv `extraWrong,seen/first,questions,lastChoices` | fixed: free-choice trip got its recall question from Medium (was Easy = Medium), 4 pictures on Hard and Talent |
| reunification | The North-South Train / Tàu Thống Nhất | 3 questions, 2 answers | 3 questions, 2 answers | +1 silly wrong answer each | +2 silly answers, + "which did you see?" (3 pictures) | +2 silly answers, + "which first?" (4 pictures) | data-lv `extraWrong,seen/first,questions,lastChoices` | recorded only (questions count and last-question choices added to data-lv) |
| lighthouse | Light the Lighthouse / Thắp Hải Đăng Vũng Tàu | 2 questions, 2 answers | 2 questions, 2 answers | +1 silly answer | +2 silly, + recall (3 pictures) | +2 silly, + "which first?" (4 pictures, was 3) | as above | recorded; Talent recall now always 4 pictures (short trip had 3) |
| operaseats | Seats at the Opera House / Xếp Chỗ Nhà Hát | 4 questions, 2-3 answers | 4 questions | +1 silly answer | +2 silly, + recall (3 pictures) | +2 silly, + "which first?" (4 pictures, was 3) | as above | recorded; Talent recall now always 4 pictures |
| outback | Outback Road Trip / Đường Xuyên Úc | 4 questions, 2 answers | 4 questions | +1 silly answer | +2 silly, + recall (3 pictures) | +2 silly, + "which first?" (4 pictures) | as above | recorded only |
| floating | Floating Market / Chợ Nổi Cái Răng | 3 questions, 2 answers | 3 questions | +1 silly answer | +2 silly, + recall (3 pictures) | +2 silly, + "which first?" (4 pictures) | as above | recorded only |
| airport | Airport Helper / Ở Sân Bay | 3 questions, 2 answers | 3 questions | +1 silly answer | +2 silly, + recall (3 pictures) | +2 silly, + "which first?" (4 pictures) | as above | recorded only |
| postcard | Postcards Home / Gửi Bưu Thiếp | 3 questions, 2 answers | 3 questions | +1 silly answer | +2 silly, + recall (3 pictures) | +2 silly, + "which first?" (4 pictures) | as above | recorded only |
| puppets | Water Puppets / Múa rối nước | 5 rounds, 3 puppets | 6 rounds, 3 puppets | 8 rounds, 4 puppets | 8 rounds, 6 puppets | 10 rounds, 8 puppets | data-lv `rounds,puppets`; lv x2 | recorded only |
| dongho | Đông Hồ Paintings / Tranh Đông Hồ | 2 pictures, 3 parts to paint, 2 colours | 2 pictures, 3 colours | 3 pictures, 4 colours | 4 pictures, 5 colours | 4 pictures, 5 colours, sample fades (memory) | data-lv `pictures,colours,memory`; lv x2 | recorded only |
| dragonfire | Dragon Bridge Count / Đếm lửa Cầu Rồng | 4 rounds, up to 5 puffs, 900 ms, 2 choices | 5 rounds, up to 6, 800 ms, 3 choices | 6, up to 8, 650 ms, 3 choices | 7, up to 12, 480 ms, 4 choices | 8, up to 15, 360 ms, 4 choices | data-lv `rounds,max,gap,wrongs`; lv x4 | recorded only |
| traffic | Scooter Traffic Lights / Đèn giao thông xe máy | 6 lights, 500 ms pause, red/green | 8 lights, 600 ms | 10 lights, 500 ms | 12 lights, 350 ms, + yellow | 14 lights, 250 ms, yellow, light goes dark after 1.1 s | data-lv `rounds,pause,yellow,dark`; lv x2 | recorded only |
| ferries | Harbour Ferries / Phà Cảng Sydney | 5 ferries, 3 wharves | 6 ferries, 3 wharves | 8, 4 wharves | 8, 5 wharves | 10, 6 wharves, ferry picture fades | data-lv `rounds,wharves,memory`; lv x2 | recorded only |
| tram | Tram Stops / Tàu điện Melbourne | 4 rounds, 5 stops, 1.5 s per stop | 5 rounds, 6 stops, 1.4 s | 6, 8 stops, 1.1 s | 6, 10 stops, 0.8 s | 7, 12 stops, 0.6 s, stops unnumbered | data-lv `rounds,stops,ms,count`; lv x3 | recorded only |
| koala | Koala Breakfast / Bữa sáng của Koala | 4 koalas, up to 4 leaves, ends on the right count | 5 koalas, up to 5, tap Done | 6, up to 7 | 7, up to 9 | 8, up to 12, number fades | data-lv `rounds,max,memory`; lv x2 | recorded only |
| sparkleorchard | Sparkle Orchard Quest / Nhiệm Vụ Vườn Quả Lấp Lánh | tier 0: 3 pictures, light 1.3 s, near misses count, free picture after 3 misses | tier 1: 4 pictures, 950 ms, free picture after 3 misses | tier 2: 5 pictures, 800 ms | tier 3: 5 pictures, 650 ms | tier 4: 6 pictures, 500 ms, no free picture | data-lv `tier,mission,lightMs,help/nohelp` (online: shared tier, unchanged) | fixed: level numbers now written when the game opens (were written only after "Just me" / "With a helper" was tapped) |
| sparklefruitbar | Sparkle Fruit Bar / Bảng Trái Cây Lấp Lánh | (opens like big kids) 20 rounds, free counters, seeded results | same | same | same | same | none | exception: chance-only counters game in the family arcade, no skill and nothing to get right; its rules text states the fixed odds and 20 rounds, and online seats must agree |
| fruitparade | Sparkle Fruit Parade / Diễu hành trái cây lấp lánh | tier 0: lanes 1400 ms, 1 goal per player, 2 rounds, 4 kinds, assist | tier 1: 1100 ms, 2 goals, 2 rounds, 6 kinds | tier 2: 850 ms, 3 goals, 3 rounds, 9 kinds | tier 3: 650 ms, 3 goals, 3 rounds, 9 kinds | tier 4: 500 ms, 3 goals, 3 rounds, 9 kinds | data-lv `tier,laneMs,goals,rounds,kinds,assist` (online: shared tier, unchanged) | fixed: level numbers now written when the game opens (were written only after "Play alone" / "Play with a helper") |


## Pictures: art and drawing

Files: js/games/drawing.ts, drawing2.ts, crafts.ts (pads in art-pad.ts).

`js/games/art-pending.ts` holds unregistered proposals (spotdiff, hiddenpic ...): no rows. `js/games/art-pad.ts` registers
no game itself; it is the shared pad that every game in drawing2.ts and crafts.ts runs.

| id | Name (EN / VI) | Under-5 | Easy | Medium | Hard | Talent | Recorded as | Change this round |
|---|---|---|---|---|---|---|---|---|
| dotdot | Dot to Dot / Nối Điểm | 6 dots, 2 pictures, next dot pulses | 8 dots (10 at level 2), 2 pictures | 10 dots (12 at level 3), 2 pictures | 15 dots (20 at level 5), 2 pictures | 20 dots, 3 pictures | data-lv rounds,dots | none |
| trace | Trace the Picture / Tô Theo Nét | 2 pictures, path 30 px wide, cover 85 % | 2 pictures, 26 px, 80 % | 3 pictures, 20 px, 85 % | 3 pictures, 15 px, 90 % | 4 pictures, 12 px, 93 % | lv() + data-lv rounds,tolerance,cover | none |
| mirror | Mirror Painting / Vẽ Đối Xứng | 2 pictures, brush 16, paint 1.5 widths, 3 colours | 2 pictures, brush 13, 1.2 widths, 6 colours | 2 pictures, brush 11, 1.5 widths | 3 pictures, brush 8, 2.2 widths | 3 pictures, brush 6, 3 widths, guide lines hidden | lv() + data-lv rounds,brush,fill,noguide | none |
| colournum | Colour by Number / Tô Màu Theo Số | 1 picture, 3 numbers | 1 picture, 4 numbers | 2 pictures, 5 numbers | 2 pictures, 6 numbers | 3 pictures, 6 numbers | lv() + data-lv rounds,numbers | none |
| lanternart | Decorate a Lantern / Trang Trí Đèn Lồng | paint 2 parts, 0 stickers | 2 parts, 0 stickers | 3 parts, 1 sticker | 4 parts, 2 stickers | 4 parts, 3 stickers | lv() + data-lv parts,stickers | none |
| card | Make a Card / Làm Thiệp | 2 things on the card | 2 things | 3 things | 4 things | 5 things | lv() + data-lv need | none |
| sand | Sand Drawing / Vẽ Trên Cát | 3 drawings, 0.8 widths each, stick 12 | 2 drawings, 0.6 widths, stick 10 | 3, 0.8, stick 8 | 4, 1.2, stick 6 | 5, 1.6, stick 5 | lv() + data-lv rounds,amount,line | none |
| drawpath | Draw the Way / Vẽ Đường Đi | 3 ducklings, 2 rocks, wide gaps (30 px) | 3 ducklings, 3 rocks (4 at level 2), gaps 22 px | 3 ducklings, 4 rocks (5 at level 3) | 3 ducklings, 6 rocks (7 at level 5) | 4 ducklings, 8 rocks, tight gaps (15 px) | data-lv rounds,rocks,tight | none |
| shapedraw | Draw a Shape / Vẽ Hình | 3 shapes, circle and square only | 3 shapes, circle and square only | 4 shapes, circle, triangle, square | 5 shapes, all three | 6 shapes, all three | lv() + data-lv rounds,kinds | none |
| copygrid | Copy the Picture / Vẽ Lại Tranh | 2 pictures, grid 4 x 4, 1 colour | 2 pictures, 4 x 4, 1 colour (2 at level 2) | 2 pictures, 4 x 4 with 2 colours (5 x 5 at level 3) | 2 pictures, 5 x 5, 3 colours | 3 pictures, 5 x 5, 4 colours | data-lv rounds,size,colours | none |
| stamps | Potato Stamps / In Hình | free pad, 12 marks, stamp 14 | free pad, 12 marks, stamp 10 | same | same | same | nothing (art-pad.ts) | exception: free stamping pad, nothing to get right |
| weave | Weave a Mat / Đan Chiếu | free pad, 12 marks, brush 16 | 12 marks, brush 10 | same | same | same | nothing | exception: free painting on a mat, no pattern checked |
| mosaic | Bát Tràng Tiles / Ghép Gốm Bát Tràng | free tile grid 8 across, 12 marks | grid 12 across, 12 marks | same | same | same | nothing | exception: free tile painting, no target |
| nonla | Paint a Nón Lá / Vẽ Nón Lá | free pad, 12 marks, brush 16 | 12 marks, brush 10 | same | same | same | nothing | exception: free painting |
| aodai | Áo Dài Designer / Thiết Kế Áo Dài | free pad, 12 marks, brush 16 | 12 marks, brush 10 | same | same | same | nothing | exception: free painting |
| kitepaint | Design a Kite / Trang Trí Diều | free pad, 12 marks, brush 16 | 12 marks, brush 10 | same | same | same | nothing | exception: free painting |
| shades | Light and Dark Colours / Màu Đậm Màu Nhạt | free pad, 12 marks, brush 16 | 12 marks, brush 10 | same | same | same | nothing | exception: free painting on shaded bands, nothing checked |
| shadowpic | Light and Shadow / Bóng và Hình | free pad, 12 marks, brush 16 | 12 marks, brush 10 | same | same | same | nothing | NOT DONE: says "trace around the shadow" but the code checks nothing; needs art-pad.ts (see note) |
| finishpic | Finish the Picture / Vẽ Nốt Bức Tranh | free pad, 12 marks, brush 16 | 12 marks, brush 10 | same | same | same | nothing | NOT DONE: says "draw the missing side" but the code checks nothing; needs art-pad.ts (see note) |
| scene | Sticker Scene / Dán Tranh Cảnh | free pad, 12 triangle stickers | 12 stickers | same | same | same | nothing | exception: free sticker scene |
| lacquer | Lacquer Painting / Tranh Sơn Mài | free gold brush, 12 marks, brush 16 | 12 marks, brush 10 | same | same | same | nothing | exception: free painting, one colour |
| scratch | Scratch Art / Tranh Cào | free scratch, 12 marks | 12 marks | same | same | same | nothing | exception: free scratching, nothing hidden to find |
| bubblepaint | Bubble Paint / Vẽ Bong Bóng | free rings, 12 marks, ring 14 | 12 marks, ring 10 | same | same | same | nothing | exception: free painting |
| fingerpaint | Finger Painting / Vẽ Bằng Ngón Tay | free pad, 12 marks, brush 16 | 12 marks, brush 10 | same | same | same | nothing | exception: free finger painting |
| weatherpaint | Colour the Weather / Tô Màu Thời Tiết | free pad, 12 marks, brush 16 | 12 marks, brush 10 | same | same | same | nothing | exception: free painting |
| thocam | Brocade Patterns / Hoa Văn Thổ Cẩm | free pad, 12 marks, brush 16 | 12 marks, brush 10 | same | same | same | nothing | exception: free painting, no pattern to copy |
| pixelpic | Pixel Picture / Tranh Ô Vuông | free grid 8 across, 12 squares | grid 12 across, 12 squares | same | same | same | nothing | exception: free square painting, no target picture |
| fireworks | Fireworks Painter / Vẽ Pháo Hoa | free bursts, 12 marks | 12 marks | same | same | same | nothing | exception: free painting |
| masks | Mid-Autumn Masks / Làm Mặt Nạ Trung Thu | free pad, 12 marks, brush 16 | 12 marks, brush 10 | same | same | same | nothing | exception: free painting |
| makeface | Make a Face / Ghép Khuôn Mặt | free pad, 12 marks, brush 16 | 12 marks, brush 10 | same | same | same | nothing | exception: free painting, no face parts to place |
| gallery | My Little Gallery / Phòng Tranh Của Em | free pad, 12 marks, brush 16 | 12 marks, brush 10 | same | same | same | nothing | exception: free painting |
| leafrub | Leaf Rubbings / In Lá | free rubbing, 12 marks | 12 marks | same | same | same | nothing | exception: free rubbing |

Note: the 22 art-pad games run entirely in `js/games/art-pad.ts` (`runArtPad`): the same pad for every level, only "make
12 marks then keep in Album"; under-5s get a thicker brush (16 against 10) and a coarser grid. Nothing is checked, so they
are free pads, and today they write nothing to `data-lv` (the levels check will see an empty signature unless they are on
its exception list). A ready proposal that records each pad's one setting and gives finishpic and shadowpic real levels
(marks needed 12/12/18/24/30, brush 16/10/8/6/5) is in
`/tmp/claude-0/-home-user-tpn/fea01edd-8866-5ac7-ba51-40953cf17065/scratchpad/s1/art-pad-levels-proposal.md`.


## Big thinkers: puzzles and strategy

Files: js/games/thinking.ts, thinking2.ts, strategy.ts, asia.ts, bigthinkers.ts, bigthinkers2.ts, goat.ts, snakes.ts.

| id | Name (EN / VI) | Under-5 | Easy | Medium | Hard | Talent | Recorded as | Change this round |
|---|---|---|---|---|---|---|---|---|
| pattern | What Comes Next? / Tiếp Theo Là Gì? | AB only, 3 answers, 4 rounds | AB only, 3 answers | 3 pattern kinds (AB, AAB, ABC), 3 answers | 5 kinds (AAB to ABCB), 4 answers | 8 kinds (adds ABCD, AABC, ABCDB), 5 answers | data-lv: pattern kinds, answers; lv: wrong answers | recorded only |
| counting | Count With Me / Cùng Đếm Nào | up to 5, 3 answers | up to 5, 3 answers | up to 8, 3 answers | up to 15, 3 answers | up to 30, 4 answers | data-lv: biggest number, answers; lv: wrong answers | recorded only |
| letters | Letter Hunt / Tìm Chữ Cái | first 8 letters, 3 balloons, hear-and-find | first 8 letters, 3 balloons, hear-and-find | 12 letters, 4 balloons | whole alphabet, 5 balloons, match small letter to capital | whole alphabet, 6 balloons, small letters | data-lv: letters used, choices, upper/lower | recorded only |
| numbers | Number Train / Đoàn Tàu Số | 4 cars to 5, gap always last | 4 cars to 5, gap always last | 4 cars to 10, gap anywhere | 4 cars to 20, 40 % count backwards | 5 cars to 30, 60 % backwards | data-lv: top number, cars, % backwards, gap-last flag | recorded only |
| shapes | Shadow Shapes / Bóng Hình Ai Đây | 4 shapes, 3 choices | 4 shapes, 3 choices | 6 shapes, 4 choices | 8 shapes, 5 choices | 8 shapes, 6 choices | data-lv: shapes used, choices | recorded only |
| colors | Rainbow Paints / Pha Màu Cầu Vồng | 4 balloon rounds, 3 balloons | 4 balloon rounds, 3 balloons | 2 balloon rounds (4 balloons) then mixing, 3 paints | mixing every round, 4 paints | mixing every round, 5 paints | data-lv: balloon rounds, balloon choices, paint choices; lv: both choice counts | recorded only |
| sorting | Small to Big / Từ Bé Đến Lớn | 3 then 4 things | 3 then 4 things, small first | 4 then 5 things | 5 things, last round biggest-first | 7 things, two rounds biggest-first | data-lv: first-round things, most things, biggest-first rounds | recorded only |
| memory | Memory Match / Lật Hình Ghi Nhớ | 3 pairs | 3 pairs | 4 pairs | 6 pairs | 10 pairs | data-lv: pairs (solo only; online untouched) | recorded only |
| minichess | Little Chess / Cờ Vua Nhỏ | 3 puzzles, ring on target | 3 puzzles, ring on target | 4 puzzles | 5 puzzles, extra blue piece that cannot take | 6 puzzles, extra blue piece, no ring on target | data-lv: puzzles, decoy, ring; lv: puzzles | recorded only |
| cotuong | Chinese Chess Puzzles / Cờ Tướng Nhỏ | 3 puzzles, ring on general | 3 puzzles | 4 puzzles | 5 puzzles, extra blue piece | 6 puzzles, extra blue piece, no ring | data-lv: puzzles, decoy, ring; lv: puzzles | recorded only |
| whosits | Who Sits Where? / Ai Ngồi Đâu? | 3 friends, in order, chair words | 3 friends, in order, chair words | 4 friends, in order | 5 friends, mixed order | 5 friends, mixed order, chairs show pictures only | data-lv: friends, mixed order, chair words; lv: friends | recorded only |
| pipes | Water Pipes / Nối Ống Nước | 2 boards, set start | 2 boards, set start | 3 boards | 3 boards, path pipes start turned wrong | 4 boards, path pipes three turns away | data-lv: boards, scramble (0/1/3); lv: boards | recorded only |
| hanoi | Tower Stack / Tháp Hà Nội | 2 discs, hint button | 2 discs, hint | 3 discs, hint | 4 discs, hint | 5 discs, no hint | data-lv: discs, hint | recorded only |
| robot | Robot Planner / Lập Trình Rô-bốt | 4 x 4, no rocks, path 1-3 | 4 x 4, no rocks, path 1-3 | 5 x 5, 2 rocks, path 2-6 | 5 x 5, 4 rocks, path 2-6 | 6 x 6, 8 rocks, path 5-10 | data-lv: field size, first-round rocks, shortest path least and most | recorded only |
| maze | Mountain Maze / Mê Cung Trên Núi | 4 x 4 then 5 x 5, trail | 4 x 4 then 5 x 5, trail | 5 x 5 then 6 x 6, trail | 7 x 7 then 8 x 8, trail | 9 x 9 twice, no trail | data-lv: maze sizes, trail | recorded only |
| goat | Blindfold Goat / Bịt Mắt Bắt Dê | 3 x 3 haystacks, "very close" call | 3 x 3, "very close" call | 4 x 4 | 5 x 5 | 6 x 6, no "very close" call | data-lv: grid size, near call | recorded only |
| blindtag | Blindfold Tag / Bịt Mắt Bắt Bạn | friends always shown, arrows glow, 3 rounds | friends 40 % faint, 3 rounds | 25 % faint, 3 rounds | 12 % faint, stay faint after the call, 4 rounds | friends hidden, cue without arrow, 4 rounds | data-lv: faintness %, stay-faint, rounds, cue arrow | recorded only |
| firstwords | First Words: Chinese and Hindi / Từ đầu tiên | 5 rounds, 2 pictures | 8 rounds, 3 pictures, example shown | 8 rounds, 3 pictures | 8 rounds, 4 pictures | 8 rounds, 5 pictures, no example sentence | data-lv: rounds, pictures, example; lv: wrong pictures | recorded only |
| tangram | Tangram Shapes / Xếp hình Tangram | 4 rounds, 2 pieces, never turned | 6 rounds, 3 pieces, sometimes turned, tip | 6 rounds, 3 pieces | 7 rounds, 4 pieces | 8 rounds, 5 pieces, always turned, no tip | data-lv: rounds, pieces, turn mode, tip; lv: rounds, wrong pieces | recorded only |
| snakes | Snakes and Ladders / Rắn và Thang | gentle: rolls 1-3, no snakes, everyone home | 2 seats (1 helper) | 2 seats (1 helper) | 3 seats (2 helpers) | 4 seats, exact landing on 25 | data-lv: seats, exact (solo only; online untouched) | none (already recorded; 3 different) |
| rangoli | Rangoli Patterns / Tranh Rangoli | 3 rounds, 4 x 4, 3 colours, 45 % painted | 5 rounds, 6 x 6, 4 colours, 60 % | 5 colours, 60 % | 5 colours, 75 % | 6 colours, 85 % | data-lv: rounds, grid, colours, % painted; lv: colours, fill | recorded only |
| rulefinder | Find the Rule / Tìm Quy Luật | 3 rounds, 2 examples, 2 choices | 4 rounds, 2 examples, 3 choices | 4 rounds, 3 examples, 3 choices, 1 look-alike | 4 rounds, 3 examples, 4 choices, mostly look-alikes, colour or flying rule | 5 rounds, 4 examples, 5 choices | data-lv: rounds, examples, choices, hard rule (first round; tier can move 1 step) | recorded only |
| gardenorder | Garden Steps / Các Bước Làm Vườn | 1 story, 3 steps, 1 stray | 2 stories, 4 steps, 1 stray | 2 stories, 2 strays | 3 stories, 2 strays | 4 stories, 3 strays | data-lv: stories, steps, strays | recorded only |
| steppingpath | Flower Path / Đường Hoa | 3 x 3, no dead ends | 4 x 4, no dead ends | 4 x 4, 2 dead ends | 5 x 5, 3 dead ends | 5 x 5, 5 dead ends | data-lv: field size, dead ends wanted | recorded only |
| patternpicnic | Pattern Picnic / Dã Ngoại Quy Luật | 3 rounds, AB, 2 choices | 4 rounds, starts AB, 3 choices | starts AAB, 3 choices | starts ABC, 4 choices | starts ABC, 5 choices (tree added) | data-lv: rounds, first pattern, choices | recorded only |
| shapebuilders | Shape Builders / Ghép Tranh Hình Khối | 3 pieces, 3 shapes | 4 pieces, 4 shapes | 5 pieces, 4 shapes | 6 pieces, 4 shapes | 6 pieces, 5 shapes (oval added) | data-lv: pieces, shapes to choose | recorded only |
| remembergarden | Remember the Garden / Nhớ Khu Vườn | row of 2, stays visible, 1 extra | row of 3, hidden, 1 extra | row of 4, 2 extras | row of 6, 2 extras | row of 6, mixed order, 3 extras | data-lv: row length, extras, hidden, mixed | recorded only |
