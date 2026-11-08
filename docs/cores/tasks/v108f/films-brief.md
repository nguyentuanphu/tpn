# v1.08f films: the Blender tale films, five for everyone, the rest for testers, and one download for all

Read first: `README.md` (this folder), `docs/cores/tasks/v108c/blender-films-gpu.md`, `js/content/blenderfilms.ts`, `js/blenderfilm.ts`, the Studio switches (`js/content/releases.ts`, Studio's release pages), `CLAUDE.md`.

## What to build

1. **Five films for everyone.** These five play their Blender video for every child:
   - Bánh Chưng Bánh Giầy;
   - Chú Cuội;
   - Tấm Cám;
   - Thánh Gióng;
   - The Rainbow Serpent.
2. **Every other tale film for testers.** The other 34 tale films are being rendered at 720p on the owner's PC, branch `work/v108c-films-gpu`. Each plays its Blender video only on tester devices while a new Studio switch, "Blender films for testers", is on.
   - Everyone else gets the in-game film, as today.
   - The switch works like the other release switches. The owner can later turn a film on for everyone, one by one.
   - Build the list from `js/content/blenderfilms.ts`, so films added later need no code change.
3. **One download for all, in the story section.** A card in the stories or tales area: "Tải tất cả phim để xem không cần mạng / Download all films for offline".
   - It shows the total size (sum the files, about 3 MB a film).
   - It downloads, in one go, every film this child may see: the five, or every film on a tester device.
   - It shows progress, can be stopped and resumed, and tells the child or grown-up when it is done.
   - On mobile data it asks first, as the voice pack does.
   - The films are kept in their own cache, so updates do not delete them, and they never go in the install list.
   - Grown-ups › Offline voices "Light" frees them, the same as voices.
4. Films still download one by one when a story is opened, and the in-game film plays when offline and not kept.
5. **English and Vietnamese** for all words. Buttons are 64 px. Everything fits one screen on phone, tablet and computer.

## Checks

- **Extend `blenderfilms`:**
  - the five play their video for everyone;
  - a sixth plays its video only for a tester with the switch on;
  - the download-all card downloads, shows progress, works offline after, and asks first on mobile data.
- **Also run:** `films` (sample), `tales`, `story`, `offline`, `swupdate`, `startup`, `phone`, `bilingual`, `types`.

## Status file

`docs/cores/tasks/v108f/films.md`
