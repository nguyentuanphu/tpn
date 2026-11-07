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

## Update from Release (6 Nov 2026 AEDT): faces with feeling (the owner's decision)

The owner says the new friends' and the villagers' faces look stiff and scary: eyes wide open all round, never closing.

**The new style for every face, everywhere:** soft eyes with lids.
- The upper lid covers part of the eye, and little white shows.
- The iris is big, with two sparkles.
- The cheeks have a pink blush.
- Every face blinks, looks at whoever it talks to, smiles, and changes with its mood: happy, surprised, curious, excited, sad, shy.

**For your work:**
1. **The costume kit and the tale people:**
   - Use the soft eyes with lids and the blush on every face.
   - No round staring eyes.
   - Every person keeps the eyes at their own size: grown-ups, grandparents, children.
2. **The story pages:**
   - Each page shows the feeling of its moment: Tấm crying by the well, Cám sly, the king surprised, Cuội homesick on the moon.
   - Use the eyes, brows and mouth, not only the pose.
   - Nobody stares straight out with wide eyes.
3. **The five animated films:**
   - Every character blinks every 2-6 seconds.
   - Characters look at whoever is speaking.
   - Their faces change with the story.
4. **The in-game film polish (`js/film.ts`):**
   - Keep the lips that follow the words.
   - Use the faces helper's moods and blinks, so film faces match the game.

**The faces helper (first account, branch `work/v108e-faces`)** owns the face drawings and the blink code for the friends and the villagers. Its brief is `docs/cores/tasks/v108e/faces-brief.md`, its notes are `docs/cores/tasks/v108e/faces.md`, and its Blender setup is in `tools/blender/` on its branch. Use its eye shapes and colours so the films and pages match the game. Pull its branch to see them, but do not merge it into yours: Release merges both.

**The 11 named villagers** become real models, made by the villagers helper (`docs/cores/tasks/v108e/villagers-brief.md`). Once they exist, your films and pages can use them in place of the code-built people.

**Redo** the story pages and costume renders you already made that have the old eyes, and say so in your status file.
