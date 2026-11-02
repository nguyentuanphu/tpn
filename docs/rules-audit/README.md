# Rules audit (v1.07, 2 Nov 2026 AEDT)

Helper "rules", branch `work/v107-rules`. Every game in Play that copies a real game (traditional Vietnamese and Australian games, board and card games, playground games, Tết crafts) was read in code and compared with:
1. the real rules of the game,
2. its guide text (`js/howto-data.ts`, `js/howto-data2.ts`: origin, steps, "for real"),
3. its in-game words (spoken intro, rules box) and its guide film in `js/content/films.js` (only Ô Ăn Quan and Bắn Bi have one).

Verdicts:
- **Correct**: the code plays the real rules (or the real core of them) and the guide says the same.
- **Simpler, said**: made simpler for children on purpose, and the game or its guide says so.
- **Simpler, not said**: made simpler on purpose, but nothing tells the player. Allowed; listed so a guide line can be added later.
- **Wrong**: the code broke a real rule or contradicted its own guide. Every "wrong" was fixed in this round (column "Fix"), each in that game's own file.

Level settings (number of rounds, speed, board size) are the levels helper's work and are not judged here. There is no Bầu Cua game in the catalogue.

Checks for the fixes: `tests/unit/rules-audit.test.mjs` (Cờ Cá Ngựa home slots, Picture Sudoku one answer); the other fixes are played by the existing game checks (`games`, `autoplay`, `levels`).

## Board and card games

| Game | Verdict | Notes | Fix (v1.07) |
|---|---|---|---|
| Ô Ăn Quan (`oanquan`) | Correct | 10 squares of 5 seeds, 2 mandarin squares worth 10; sow, pick up and keep sowing, capture after one empty square, chain captures, stop at two empties or a mandarin square; refill five seeds, borrowing when short (#350); game ends when both mandarins are taken. The regional "quan non" rule is not used. | Guide had no "pick up and keep sowing / a mandarin square ends your turn" step: added. |
| Cờ Cá Ngựa (`cacuangua`) | Was wrong, now correct | Classic: 1 or 6 to leave the stable and roll again, no jumping, exact landing sends a horse back, door then home slots by number, finish in 6, 5, 4, 3. Gentle short track for under-5s and Easy: 2 horses, any roll launches, no captures (said in the rules box). | `cacuangua-core.ts`: a horse could climb onto a home slot its own horse held; now refused (unit check). Guide: "send it home" now "back to its stable", and a line for the gentle track. |
| Snakes and Ladders (`snakes`) | Was wrong, now correct | 25 squares, 3 ladders, 3 snakes, first to 25 wins; under-5s roll 1 to 3, no snakes, everyone finishes (said). Talent needs an exact landing (said when near the end). | `snakes.ts`: when a helper or a friend won, the end still said "You reached the top!"; now names the winner. |
| Tiến Lên miền Nam (`tienlen`) | Simpler, not said | Card order, combinations, chặt heo (four of a kind and pairs in a row) all right; passing locks you out of the round. Three players not four; first lead does not have to contain the 3 of spades; no tới trắng or thối heo. | None. |
| Tiến Lên miền Bắc (`tienlenbac`) | Correct | Follow suit for singles and runs, pairs by colour, a 2 beats any single, four of a kind cuts 2s; the in-game text says the same. | Guide did not say a 2 beats any card: added. |
| Caro (`caro`) | Simpler, not said | 3 in a row on 3x3, 4 on 5x5 and 6x6, 5 from 7x7; the spoken intro says how many. The "blocked at both ends does not count" rule is not used. | None. |
| Oẳn Tù Tì (`oantuti`) | Correct | Rock, paper, scissors; online draws when all three or all the same appear. | None. |
| Little Chess (`minichess`) | Correct | All six 4x4 puzzles use legal rook, bishop and knight moves. | None. |
| Cờ Tướng Nhỏ (`cotuong`) | Was wrong, now simpler, said by the name | Chariot, horse (with its blocking point) and cannon moves are right on a small 4x4 grid. | `thinking2.ts`: the red general was drawn 將 (the black general); now 帥. |
| Tower of Hanoi (`hanoi`) | Correct | One disc at a time, never big on small, to the flag pole. | Guide said "another pole"; now "the pole with the flag". |
| Picture Sudoku (`sudoku`) | Was wrong, now correct | Each picture once in each row and column (no boxes, said in the guide). | Random empty squares on 4x4 could have two right answers and the game took only one, so a right answer was called wrong (about half the Talent boards). Now the empty squares always have exactly one answer (`sudoku-core.ts`, unit check). |
| Tangram (`tangram`) | Simpler, not said | Pick the missing piece; the pieces are tangram-style, not the real seven. The "for real" line describes the real puzzle. | None. |

## Vietnamese folk games and Tết crafts

| Game | Verdict | Notes | Fix (v1.07) |
|---|---|---|---|
| Kéo Co (`tug`) | Simpler, said | Pull to move the mark over the line; under-5s always win. | Win title "An win!" for one child: now "wins". |
| Nhảy Lò Cò (`hopscotch`) | Simpler, not said | Hop up skipping the stone's square, hop back from Hard, pick the stone up on Talent; the stone lands on a random square instead of square 1, 2, 3 in turn. | None. |
| Rồng Rắn Lên Mây (`dragon`) | Correct | Rhyme "Rồng rắn lên mây, có cây lúc lắc..." and the head, middle, tail answers are right; the head guards the tail. The "xin lửa" exchange is left out. | None. |
| Đánh Chuyền (`chuyen`) | Simpler, said | Toss, pick up sticks, catch; fewer sticks than the real ten. | Guide said "one, then two, then three", true only on Medium: now "one at a time, then more each round". |
| Đá Cầu (`dacau`) | Simpler, not said | Kick to keep it up; a drop does not reset the count (real: it does). | None (kept gentle). |
| Bắn Bi (`marbles`) | Correct | Ring game: knock marbles out of the circle. Guide and film agree. | None. |
| Nhảy Dây (`skipping`) | Correct | Jump as the rope passes; under-5s: the rope waits. | None. |
| Đập Niêu (`datnieu`) | Simpler, said | Friends call left, right, here; no spinning (the "for real" line describes it). | None. |
| Thả Diều (`kite`), Nhảy Bao Bố (`sackrace`) | Correct | Skill games; no traditional rule broken. | None. |
| Chi Chi Chành Chành (`chichi`) | Correct | Rhyme right ("Ba vương" is a common form of "Tam vương"); pull out on "ập". | None. |
| Mèo Đuổi Chuột (`meochuot`) | Simpler, said | Gates and chase in gentle steps; the cat never catches. | None. |
| Cướp Cờ (`cuopco`) | Simpler, said | Number called, take the flag home; nobody is tagged. | None. |
| Kéo Cưa Lừa Xẻ (`keocua`) | Correct | Five-line rhyme right, one beat per syllable. | None. |
| Đánh Đáo (`danhdao`) | Simpler, said | Throw the disc from the line at toy coins. | Guide said "land on the line" and "three times" (Hard has more): now "from the line to hit the coins" and "hit every target". |
| Ném Còn (`nemcon`) | Correct | Throw the còn through the high ring. | None. |
| Đua Thuyền (`duathuyen`) | Simpler, said | Gentle rhythm race; strokes alternate sides. | None. |
| Trồng Nụ Trồng Hoa (`trongnu`) | Simpler, not said | Four heights to jump; touching the stack does not swap roles. Naming of the hand stage varies by region. | None. |
| Bịt Mắt Bắt Dê (`goat`) | Simpler, not said | A haystack search with arrows (owner's 30 Oct decision to keep it); the "for real" line describes the real game. | None. |
| Bịt Mắt Bắt Bạn (`blindtag`) | Correct | Follow the call, catch, the caught friend wears the blindfold next. | None. |
| Ném Lon (`nemlon`) | Simpler, not said | Throw at the cans; no chase and restack. | None. |
| Làm Bánh Chưng (`banhchung`) | Was wrong, now correct | | `vietnam2.ts`: stopped after the pork, so the pork was on top; now leaves, rice, beans, pork, beans, rice, then tie (7 steps), and the pork has the meat drawing, not chopsticks. Spoken intro and guide say the same. |
| Đèn Ông Sao (`denongsao`), Múa Lân (`mualan`), Cây Nêu (`cayneu`) | Correct | Frame, paper and trim, candle; tùng tùng cắc tùng; leaves, carp, chimes, flag. | None. |

## Australian and playground games

| Game | Verdict | Notes | Fix (v1.07) |
|---|---|---|---|
| What's the Time, Mr Wolf? (`mrwolf`) | Was wrong, now simpler, said | Ask, step that many, run home at Dinner time. Caught means a hug, not becoming the Wolf (said in the game). | Under-5s never got Dinner time (it was set past the 12 steps) although the intro and guide promise it: now they do, with all the time they need to run home. The guide said the game is "from Australia"; it came from Britain, so it now says so. |
| Snap! (`snap`) | Simpler, not said | Cards turn by themselves; tap SNAP on a match before the uncles. | None (under-5 uncle speed left to the levels helper). |
| Backyard Cricket (`cricket`) | Simpler, not said | Timing hits score 1, 2, 4 or 6; no outs. | None. |
| Pass the Parcel (`parcel`) | Was wrong, now correct | | `folk2.ts`: for older children the music never stopped on them before the last layer, so the counting question inside a layer never came; now it stops on them for some middle layers too. |
| Two Homes Words (`words`) | Was wrong, now correct | | `js/words.js`: "Footy" was glossed "Football / Bóng đá" (soccer); now "Aussie Rules football / Bóng bầu dục kiểu Úc". |
| Hide and Seek (`hideseek`) | Simpler, said | Find the friend behind a tree; the "for real" line says to count to ten. | None. |
| Duck, Duck, Goose (`duckgoose`) | Was wrong, now correct | | `outside.ts`: the goose was the friend just called Duck; now it is the next friend, and the round ends when the child runs round and sits in the goose's place. Guide and spoken line say the same. |
| Red Light, Green Light (`redgreen`) | Simpler, said | Walking on red sends you back a step, not to the start (the guide says a step). | None. |
| Simon Says (`simon`) | Simpler, not said | Act only on "Simon says"; nobody is out. | None. |
| Egg and Spoon Race (`eggspoon`) | Simpler, said | Step only while the egg sits still. | None. |
| Musical Chairs (`chairs`) | Simpler, now said | One chair fewer each round; the child always finds a seat. | Guide gets a "for real" line: one chair fewer than players, whoever has none is out. |
| Kick to Kick (`kicktokick`) | Simpler, said | Kick and catch with a friend. | None. |
| Little Nippers (`nippers`) | Correct | Raised arm means help; throw something that floats; swim between the red and yellow flags. | None. |
| Rolling Hoops (`hoops`) | Correct | No traditional rule claimed. | None. |
| Tag! (`tag`) | Simpler, not said | Tap the friend; roles do not swap. | The voice line "Tag, you are it!" claimed a swap that never happens: now "Tagged! Got you!". |
| Memory Match (`memory`) | Correct | A match keeps your turn; online, most pairs wins. | None. |
| Family Quiz (`familyquiz`) | Not a traditional game | | None. |

## Games without outside rules

Learning quizzes (numbers, letters, shapes, money, places, animals, science), drawing and art games, stories, music toys and city games copy no real game, so there are no outside rules to compare. Their wrong-answer handling is part of the levels work.

## For later (not fixed, not wrong)

- Tiến Lên miền Nam: a guide line about three players and the first lead could be added.
- Đá Cầu: a drop could reset the count for older children (would change difficulty: levels helper).
- Snap: under-5 uncles still take a missed match after about 4 seconds although the code sets "never" (levels helper).
- Ô Ăn Quan guide film does not show "pick up and keep sowing"; a new film scene would need new recordings.
