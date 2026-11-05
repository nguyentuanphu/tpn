# Helper brief B: voices (Opus voices, three offline levels, downloads on demand, festival packs)

**Branch:** `work/v108c-voices` from `origin/integrate/v108`.

**Plan:** `docs/plans/v109-extras.md`, the sections "Lighter offline" and "Downloads on demand, festival packs ahead". Moved here from the platform helper's brief (`docs/cores/tasks/v108b/platform-brief.md`, items 1 to 3); the platform helper keeps the light first download, the valley building as the child walks, and the open bugs.

**Where things are:**
- the voice pack: `js/voicepack.ts`, `js/voicestore.ts`, `voices/areas.json`, `voices/manifest*.json`;
- the pack tool: `tools/make-voice-pack.mts`, `tools/voice-lines.mts`, `tools/split-voice-manifest.mts`;
- the offline helper: `sw.ts`.

Female voices only. `voices-aside/` is never touched.

## Part 1 (one 5-hour window): Opus voices
- **Making the files:** every recording is also made as Opus (Ogg/WebM Opus, 16–20 kbps mono) next to its MP3. Use `ffmpeg` from the existing MP3s; no new recording is needed.
- **Choosing a format:** the game asks the browser (`canPlayType`) and uses Opus where it plays, MP3 otherwise.
- **Code that learns the second format:** the pack, the voice bundles, `sw.ts` and the manifests.
- **Size:** measure before and after, and write the numbers in your status file.
- **Checks:** `voicepack`, `voicearea`, `voice`, `unit`, `offline`.

## Part 2: three offline levels in Grown-ups
- **Light:** the core lines and the child's area, about 30–50 MB.
- **Automatic:** the default, as today.
- **Full:** everything.
- Each level shows the space used. Moving to a smaller level frees space.
- **Checks:** a new `offlinelevels` check, `phone`, `bilingual`.

## Part 3: downloads on demand and festival packs
- **On demand:** new areas, features and games download when they are switched on and visited.
- **Festival packs** (decorations, the festival game, voice lines) download on Wi-Fi a few days before the decorations. After the festival they are removed on Light and kept on Full.
- **Checks:** a new `festivalpack` check, `swupdate`, `offline`, `startup` (firstKB must not grow).
