# Helper brief A: blender (costume kit, story pages, five Blender films, film polish)

**Branch:** `work/v108c-blender` from `origin/work/v108b-story`. That branch already has the period dress in the tale films and the release calendar.

**Plans:**
- `docs/plans/games-one-home-and-films.md`, part B and the owner's answers (period costumes; the friends only tell the story at the start and end; five Blender films of about 1 minute each);
- `docs/cores/tasks/v108b/story-brief.md`, items 1 to 4;
- `docs/cores/tasks/v108b/story.md`, the story helper's status, to see what is done.

**Blender:** install Blender 4.2 LTS for Linux into `/opt` and run it headless, as `docs/cores/tasks/v108/lumi.md` describes. The scripts and helpers are in `tools/blender/` (`svkit.py`, `lumi.py`, `lumi-rig.py`). The gallery is in `docs/artifacts/sparkle-valley-characters/`.

## Part 1 (one 5-hour window): the costume kit
- **Period outfits and hairstyles, made once in Blender** (`tools/blender/costumes.py`) and reused:
  - Vietnamese women: áo tứ thân, yếm, váy đụp, khăn mỏ quạ, khăn vấn, hair in a bun;
  - Vietnamese men: áo the, áo nâu, khố, khăn xếp, khăn đầu rìu, topknot;
  - armour and royal robes;
  - colonial Australian dress for The Magic Pudding;
  - hanfu, sari and dhoti.
- **Renders:** a front and three-quarter render of each, kept in `docs/characters-v108/costumes/` for the owner.
- **Matching the films:** make the in-game tale-film colours and shapes match the kit wherever the story helper's period dress differs.

## Part 2: story pages redrawn
- Each tale's page pictures are redrawn as illustrations from the Blender characters, costumes and settings. Our own art, about 60–100 KB each (WebP or JPEG).
- They are loaded with the tale, never in the first download. Do the 20 Vietnamese tales first, then the rest.
- **Checks:** `tales`, `stories`, `startup` (firstKB must not grow).

## Part 3: five Blender films
- **Which:** Bánh Chưng Bánh Giầy, Chú Cuội, Tấm Cám, Thánh Gióng, The Rainbow Serpent.
- **Length:** about 1 minute each, with the same pages and narration as the in-game film.
- **Format:** 720p, about 4–6 MB each. EN and VI narration with the female voices.
- **Download:** only when the film is opened, then kept for offline. Never in the first download or the Wi-Fi pack.
- **Help moments:** the video pauses with the tap ring.
- **Fallback:** the in-game film plays when there is no network.
- **The four friends:** they appear only as storytellers at the start and end, in their own clothes.

## Part 4: in-game film polish
In `js/film.ts`:
- lips that move with the voice;
- a light depth blur;
- soft light by the time of day in the story.

**Checks:** `films`, `perf` while a film plays, `talecostume`.

## Checks at the end
`films`, `stories`, `tales`, `talecostume`, `perf`, `startup`, `types`, `noemoji`, and a new `blenderfilms` check (each of the five opens, plays, pauses for help, and falls back offline).
