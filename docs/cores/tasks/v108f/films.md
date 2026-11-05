# v1.08f films: status (films helper, started 6 Nov 2026 AEDT)

**ready for Release** (6 Nov 2026 AEDT). Branch `work/v108f-films` from `origin/integrate/v108`. Brief: `films-brief.md`. The owner's go is given (6 Nov 2026 AEDT). Only Release merges and runs the full suite.

## Where the films come from
- `work/v108c-films-gpu` (the owner's PC renders) was not on GitHub when this started, so this branch builds on the Blender branch's player: `origin/work/v108c-blender` is merged in (commit `280c07d02`, conflicts in `.gitignore`, `js/film.ts` (the Blender branch's lips and blink kept) and `tests/check-times.json` (integrate's kept)). No video files are copied.
- `js/content/blenderfilms.ts` `BLENDER_FILMS` is still empty there: nothing plays a Blender video until the PC branch lists its films. Everything below reads the list, so the PC branch's films need no code change.

## What was built
1. **Five for everyone, the rest for testers** (`js/blenderfilm.ts` `filmOpen`, `myFilms`, `isTesterDevice`):
   - a listed film plays its video when Studio's `blenderFilms` is on and either its own switch `blenderFilm_<id>` is on (default on for Bánh Chưng Bánh Giầy, Chú Cuội, Tấm Cám, Thánh Gióng, The Rainbow Serpent; off for every other film), or the device is a tester (Studio's `tester` switch, every device or the ticked ones) and the new switch **"Blender films for testers"** (`blenderFilmsTesters`, off by default) is on;
   - everyone else gets the in-game film, as today. `js/tales.ts` asks `filmOpen` (the old fixed list of five is gone).
   - Studio: `js/content/films-for-all.ts` (the five, their titles, `filmSwitch`), `js/content/releases.ts` (`blenderFilms`, `blenderFilmsTesters`, the five's switches, and `addFilmSwitches` for the other films), `studio/ui/app.ts` calls `addFilmSwitches(BLENDER_FILMS)` so every listed film gets its "Blender film for everyone" card. The game's first download never carries the films' page data (check `blenderfilms`).
   - `blenderFilms` was read by `js/tales.ts` on the Blender branch without a Studio card; it has one now.
2. **Download all films for offline** (`js/filmpack.ts`, its own file and styles, loaded only when Story time or the Play menu's Stories tab opens):
   - a one-row card "Download all films for offline / Tải tất cả phim để xem không cần mạng" above the shelves, shown only when this device has films to offer;
   - the total (`bytes` per film in `blenderfilms.ts`, about 3 MB a film without it), progress with a bar, Stop, Go on (from the films already kept), a done line and a spoken "All the films are ready" line;
   - it downloads every film this device may see (the five, or every film on a tester device with the switch on);
   - the download goes on while the game is open, also after Story time closes; any card shows it;
   - on mobile data a grown-up is asked first with a press and hold, as the voice pack does (`packNet` from `js/voicepack.ts`);
   - the films go in their own cache `sv-films` (the service worker never deletes it, never in the install list).
3. **Light frees them:** Grown-ups → Offline voices → Light also frees the kept films (`js/offlinelevels.ts`, `freeFilms`), the freed space is counted in its line.
4. One by one when a story opens and the in-game film offline with nothing kept: unchanged from the Blender branch.
5. English and Vietnamese for every word; buttons 64 px; the card is one row (two on a phone).

## Checks
- `blenderfilms` extended (`tests/story-v108c.mts`): the five; a sixth (`sontinh`) plays the in-game film for everyone, for a tester with the switch off, and for a non-tester with the switch on; its video for a tester with the switch on and for everyone with its own switch on; Download all: 5 films, about 15 MB, 64 px button, progress, Stop part way, Go on, done, all five play offline after, Light frees them, asks first on mobile data.
- `tests/unit/studioswitches.test.mts`: `blenderFilm_*` expanded from the film list; new test for the switches' defaults.
- Results (6 Nov 2026 AEDT, run one at a time):
  - pass: `blenderfilms` (extended), `types`, `tales`, `story`, `offline`, `swupdate`, `bilingual`, `startup` (first start 1043 KB), `films` (SAMPLE);
  - `tests/unit/studioswitches.test.mts`: 6 of 7 pass, the new test passes; **red on the base too**: "no switch is read in a way this check cannot see" names `js/s2vn.ts:31 isPeek(r.key` (on `integrate/v108`, not this branch's file);
  - **`phone`: red on the base too.** It fails the same way on a clean `origin/integrate/v108` (a click that waits for a page change, 30 s timeout), checked here with the same check against the base game; not from this branch (the card is not shown in that check: no film is listed yet).
- Screenshots (looked at): `pics/films-card-phone.png`, `films-card-tablet.png`, `films-card-tablet-wide.png`, `films-card-computer.png` (made by `tests/shots-v108f-films.mts` with the five as test films): one row on a tablet and a computer, two rows on a phone, the 64 px button, the shelves below.
- New spoken line (not recorded, no key here): "All the films are ready to watch with no internet!" / "Tất cả phim đã sẵn sàng để xem không cần mạng!".
- Also fixed on the way: the new small file `js/content/films-for-all.js` is in `sw.ts` FILES (it starts with the game; no apostrophes).

## Owner's decisions
- (6 Nov 2026 AEDT, in the brief) five for everyone, the rest for testers with a Studio switch; one download for all in the story section.

## Assumed (owner can change)
- The download-all card sits in both story places: Story time under the banyan tree and the Play menu's Stories tab.
- On mobile data it asks each time (the voice pack keeps the answer; a whole film set is bigger, so it asks every time).
- The download goes on after Story time closes (Stop stops it), like the voices.
