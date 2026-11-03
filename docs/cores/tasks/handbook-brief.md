# Helper brief: the Sparkle Valley Handbook (owner, 4 Nov 2026 AEDT)

**Owner's ask (chat and pop-ups):**
- "an artifact about everything in the game, including the rules, like an ultimate guide";
- all 13 parts below, with search;
- regenerated at every deploy so it always matches the game;
- bilingual, with an English/Vietnamese switch;
- a part that shows how the game improved over time: what the cities and the characters looked like at the start, and what they look like now.

**Branch:** `work/handbook`, from `origin/integrate/v108`. Never push to `main` or `release/v1.08`. Docs and tools only: nothing in the game changes. Do not start the full suite.

## What to build
1. **`tools/handbook.mts`**, a generator (TypeScript, type-checked).
   - It reads the game's own data, so the handbook always matches the code: the game catalogue and rules (`js/games/catalog.ts`, `js/content/activities.ts`, the how-to data and guide films, the levels), festivals (`js/content/festcal.ts`), tales and films, the lantern chapters, quests, the shop, companions and pets, Studio switches (`js/content/releases.ts`) and the release schedule.
   - It also reads the docs: the rules in `CLAUDE.md`, the design handbook `docs/SO-TAY-THIET-KE.md`, the owner's decisions in `docs/cores/release.md`, the plans in `docs/plans/` and `docs/cores/STORY.md`.
   - It writes **`docs/handbook/index.html`** plus `docs/handbook/img/`.
   - Run it with `node tools/handbook.mts`.
2. **The page** (one file; follow the artifact design rules; light and dark).
   - **Language:** an EN/VI switch, Vietnamese first.
   - **Navigation:** a table of contents and a search box that filters every section, game and decision.
   - **Layout:** works at phone width.
   - **Art:** our own art only. Pictures are the game's own drawings, screenshots and renders; no phone emoji in the page text.
3. **The 13 parts:**
   1. Overview: what the game is, ages, countries, version, key numbers.
   2. The owner's rules: deploy, one screen, two languages, own art, touch size, female voices, TypeScript, Sydney time, pop-up questions.
   3. The decision log: every owner decision by date, searchable.
   4. The world: map, regions, landmarks, vehicles, heights.
   5. Characters:
      - the four friends (Finn, Sol, Clara, Lumi), with the gallery pictures from `docs/artifacts/sparkle-valley-characters/` on `origin/work/v108-lumi-refine`;
      - the named villagers;
      - companions and pets.
   6. Games: every game by subject, each with its rules, ages, levels up to Talent, place in the valley and guide film.
   7. Stories and films: the 39 tales, the lantern story with its chapters and plans, and the period-costume rule.
   8. Quests, festivals and the calendar:
      - the 24 festivals;
      - the release calendar;
      - the quest kinds;
      - rewards, coins, stickers and the shop.
   9. Grown-ups and Studio: the Grown-ups section, notifications, reports, Studio switches.
   10. Voices and offline: the voices in use, voice packs, offline levels, sizes.
   11. The website: the four destinations and what it shows.
   12. How we work: the cores and helpers, branches, the full suite, speed checks, the release steps.
   13. The roadmap: what each version brought, what is in progress, what is next.
4. **"Then and now"**: how the game improved over time.
   - Pairs of pictures from early rounds and now, with dates and versions: cities and landmarks, characters, the Simple screen, game screens, the website, Studio.
   - Use the screenshots already in `docs/` (for example `docs/history/`, `docs/v1.01-shots/`, `docs/characters-v108/before-*.png` and `after-*.png`, the review folders) and old commits (`git show <old commit>:<path>`) where a picture is missing.
   - Where no old picture exists, take one now from the current game with Playwright (phone, tablet and computer), and say so.
   - Keep the folder small: compressed JPEG, about 15 MB in all.
5. **Publish** the page as a claude.ai artifact (load the artifact skills first) and give Release the link.
   - The repo copy stays in `docs/handbook/`, and `docs/README.md` links to it.
6. **Release step:** add one line to `docs/cores/release.md` under the release steps: "Before every yes-deploy: `node tools/handbook.mts`, commit `docs/handbook/`, republish the artifact to the same URL."

## Checks
- `cd tests && node suite.mts --changed` (expect quick checks only), plus `types`, `noemoji` and `names`.
- Look at the page at phone, tablet and computer sizes before reporting.

## Report to Release
In Vietnamese, plain words. Include:
- the artifact link;
- the branch and last commit;
- what each part holds;
- any part that could not be filled from the code or the docs.
