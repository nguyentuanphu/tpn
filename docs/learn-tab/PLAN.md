# Learn space: the Học Vui tab and the valley school

1 November 2026 AEDT. The owner's decisions, from pop-up answers in the Release chat:

- **Where:** "Cả hai". There is a Học Vui (Fun Learning) tab in Play for quick entry, and a school in the valley. Both lead to the same lessons.
- **Physics:** "Thí nghiệm chơi được". Physics is taught through playable experiments: the child tries something, guesses what will happen, then sees the result.
- **Levels:** every lesson follows the game levels: Easy, Medium, Hard, and Talent, the hardest level for gifted children. Under-5s always play gently.

## The four corners

| Corner | EN / VI | Lessons (3 to 5 minutes, voiced, stars) |
|---|---|---|
| Tiếng Việt | Vietnamese / Tiếng Việt | The six tones, with the sound and the mark (a á à ả ã ạ). Building a syllable (consonant + rhyme + tone). Picture words. Short sentences. Existing reading games where they fit. |
| English | English / Tiếng Anh | Phonics and sounds. Picture words. Opposites. Short sentences. Existing reading games (`rd_*`, `firstwords`, `phonics`, `opposites`). |
| Maths | Maths / Toán | Counting, adding and taking away, the number line, comparing, time, money. Equal groups (multiplying) for Hard and Talent. Short word problems. Existing games are reused. |
| Science | Science / Khoa học | New playable experiments: float or sink, magnets, ramps and rolling, levers (the seesaw), light and shadow, sound (water bottles). |

Each experiment has three steps:
1. **Guess:** the child picks what will happen.
2. **Try:** the child drags, drops or taps, and the thing moves as it really would.
3. **See why:** one short spoken sentence explains the result.

The villagers' science facts (`SCIENCE_LINES` in `js/content/villagerlines.js`) use the same ideas, so a fact heard in the valley can be tried at school.

## The school

- **Trường Học Vui** is a small school building on Two Homes Street.
- Cô Tam is the teacher. She is the secondary-school teacher who already helps at the sugarcane cart.
- There is one door for each corner, or the classroom shows all four corners.
- Tapping Cô Tam opens the same Học Vui page as the Play tab.
- Built (phase 4, `js/school.ts`, check `school`): the school stands at the west end of Two Homes Street, on the Sydney (south) side of the island road where the street begins (`TOWN_SCHOOL` in `js/content/map.ts`). Cô Tam is still needed at the sugarcane cart, so the school has its own copy of her at the door (same look, name and family photo face). Tapping her says the greeting, then "Yes, let's learn!" opens the Play hub on the Học Vui tab. The school is on the map under Two Homes Street and in "Where is…?".

## Build order

1. The Học Vui tab in Play and on the Simple screen, with its four areas. Existing games are placed in their corner (Tiếng Việt, English and Maths).
2. The six science experiments, one game each, each with a full set of parts:
   - names, guide, guide film and autoplay plan;
   - levels, including Talent;
   - recorded voices.
3. The Tiếng Việt tones and syllable games.
4. The school building and Cô Tam's tap in the valley.

Every new line is recorded in both languages with Azure (`tools/make-voice-pack.mts --engine azure`). Every picture is our own drawing in `js/art.ts`.
