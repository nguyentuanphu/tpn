# Every game, film and story on five screens: plan (v1.09)

Owner, 3 Nov 2026 AEDT: "Have all the games, films and stories been checked to work in landscape and portrait on mobile, tablets and PC?"

## Today (checked in `tests/checks/`)

| Part | Phone portrait | Phone landscape | Tablet portrait | Tablet landscape | Computer |
|---|---|---|---|---|---|
| Every game (`gamespace`) | yes, 390x844 | no | yes, 820x1180 | v1.08 layout helper is adding it | no |
| Guide films (TV button, `guides`) | yes | no | no | no | no |
| 39 tale films (`films`) | no | no | no | no | yes, 1000x700 |
| Story pages (`tales`) | no | no | no | no | yes, 900x640 |
| Menu screens (`phone`) | yes | no | yes | no | yes |

## Owner's answers (pop-ups, 3 Nov 2026 AEDT)

- **Phone landscape is fully playable.** Every game, film and story fits a sideways phone (about 844x390): the picture on the left, the answers on the right, and nothing needs scrolling.
- **The work is in v1.09.** v1.08 keeps phone portrait and tablet portrait and landscape for the games.

## Plan

1. A new check, `fivescreens`, opens:
   - every switched-on game (each age group);
   - every guide film;
   - every tale film page;
   - every story page,

   at five sizes:
   - phone portrait 390x844;
   - phone landscape 844x390;
   - tablet portrait 820x1180;
   - tablet landscape 1280x800;
   - computer 1440x900.

   It fails when:
   - an answer or button is outside the screen, or the page scrolls;
   - text is under the readable size;
   - a touch target is under 44 px (64 px for under-5s);
   - two things overlap (the header row, the guide, the answers, the film subtitles and buttons).

   On a failure it saves a picture of the screen.
2. Fix the layout in the shared parts first:
   - the game frame (`js/games/frame.ts`, `css/style.css`): in landscape, a two-column layout (the picture beside the answers);
   - the film player (`js/film.ts`): subtitles and buttons sized for a short screen;
   - the story book.

   Then fix the few games that draw their own layout.
3. The check is split into parts so the full suite on GitHub stays about 30 minutes.
4. The report shows phone, tablet and computer screenshots in both directions.
