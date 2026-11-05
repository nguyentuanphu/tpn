# The five Blender films: how to render them on a machine with a graphics card

Owner, 5 Nov 2026 AEDT (pop-up): "Animate later on a GPU". The scripts and the pictures are made in round v1.08c; the animated films are rendered later on a machine with a graphics card (the owner's computer or a render service). This page is the recipe.

Films: Bánh Chưng Bánh Giầy (`banhchung`), Chú Cuội (`chucuoi`), Tấm Cám (`tamcam`), Thánh Gióng (`thanhgiong`), The Rainbow Serpent (`rainbowserpent`).

## What is needed
- Blender 4.2 LTS with a graphics card (Eevee). Node 22 and the repo's test browser (`cd tests && npm ci`).
- The game served locally: `python3 -m http.server 8765` in the repo, then `node tools/build.mts`.
- About 12 GB of free disk for the frames.

## Steps
1. **The characters, with skeletons.** For each costume of the kit and each friend:
   - `blender -b -P tools/blender/lumi.py -- <kit dir> villager role=kit-<id> rig` (the 16 ids in `docs/characters-v108/costumes/README.md`);
   - `blender -b -P tools/blender/lumi.py -- <kit dir> <finn|clara|sol|lumi> game rig`.
2. **The film's frames out of the game**, 12 a second, every page:
   `SV_URL=http://localhost:8765/ node tools/blender/scene-export.mts <scenes dir> <id> fps=12` (writes `<id>-p<k>-frames.json`).
3. **Blender draws every frame** (Eevee, 720p):
   `blender -b -P tools/blender/storypage.py -- <scenes dir>/<id>-p<k>-frames.json <frames dir>/<id>-p<k> kit=<kit dir> res=1280x720 samples=32 engine=eevee frames`.
   Each actor is its own copy of its character, moving (walk, wave, cheer, sit) and changing face (smile, happy, sad, surprised) as in the game's film.
4. **The friends at the start and the end**: `python3 tools/blender/storyteller.py <scenes dir>/<id>-p0-0.json <id>-intro.json <id>-outro.json` (needs the one-moment export, `at=0.25,0.75`), then `storypage.py` on each.
5. **The video**: join the frames of each page with `ffmpeg` (`-r 12`, `minterpolate=fps=24` for smoothness, `libx264 -crf 28`, 720p, no sound: the game reads the words in the child's language), the intro first and the outro last; about 4-6 MB.
6. **List it in the game**: copy the video to `videos/films/<id>-v1.mp4` and add the film to `js/content/blenderfilms.ts` with each page's start and end (seconds) and the help moment (when the game's film asks the child, where the tap ring goes in % of the picture, and what is asked; `scene-export.mts` writes these as `help` in each page's file).
7. **Check**: `cd tests && node suite.mts --only blenderfilms,films,tales,story`.

## Notes from the first render (6 Nov 2026 AEDT, Windows 11, RTX 3060 Ti 8 GB, 64 GB memory)
- **Serving the game on Windows:** `python3 -m http.server` drops connections when the game loads its many files at once (the title screen never shows and `scene-export.mts` times out after 90 s). Any static server that keeps up works; a few lines of Node with `http.createServer` did.
- **No admin rights needed:** the portable Blender 4.2 LTS zip from download.blender.org (checked against its `.sha256`), Blender's own Python 3.11 (`<blender>/4.2/python/bin/python.exe`) as `python3`, and the gyan.dev ffmpeg essentials zip.
- **Speed:** `storypage.py ... frames` now renders a page as one animation (each frame set by a frame-change handler, the moves read from the actions and set on the bones by hand), so Eevee keeps the scene loaded: about 1 s a frame instead of 20. `range=a-b` renders only those frames (a quick look). All five films: about 4,400 frames.
- **Light:** the sky and the lights are at 0.82 of the old strength (`light=`, owner: "looks quite bright"); `view=`, `look=` and `exposure=` are there for trials (AgX and Filmic turned the whites grey).
- **Faces with feeling:** every face blinks every 2 to 6 s (seeded per actor, two frames, not when the eyes are already closed) and turns its head, up to about 40 degrees, towards whoever is speaking (`talk` in the frames export: the actor the film gave the lips to).
- The help moments come from the one-moment export (`<id>-p<k>.json`, no `fps=`); the frames export has `help: null`.

The player (`js/blenderfilm.ts`) is already in the game: it downloads a film only when its story opens, keeps it on the device for offline, stops for the help moments with the tap ring, and plays the game's own film when there is no internet and no kept copy.
