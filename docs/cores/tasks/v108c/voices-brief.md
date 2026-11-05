# Helper brief B: voices (Opus voices, three offline levels, downloads on demand, festival packs)

**Branch:** `work/v108c-voices` from `origin/work/v108b-platform` (it already has Opus voices, see Part 1).

**Plan:** `docs/plans/v109-extras.md`, the sections "Lighter offline" and "Downloads on demand, festival packs ahead". Moved here from the platform helper's brief (`docs/cores/tasks/v108b/platform-brief.md`, items 1 to 3); the platform helper keeps the light first download, the valley building as the child walks, and the open bugs.

**Where things are:**
- the voice pack: `js/voicepack.ts`, `js/voicestore.ts`, `voices/areas.json`, `voices/manifest*.json`;
- the pack tool: `tools/make-voice-pack.mts`, `tools/voice-lines.mts`, `tools/split-voice-manifest.mts`;
- the offline helper: `sw.ts`.

Female voices only. `voices-aside/` is never touched.

## Part 1: Opus voices (already done by the platform helper, do not redo)

The platform helper finished Opus before the split, on `work/v108b-platform`, in these commits:
- **577092b5a, the game side:**
  - `js/voice-index.ts`, `voiceFormatFor`;
  - `js/voice.ts`, `settleVoiceFormat`; a `.opus` that returns 404 falls back to `.mp3`;
  - `js/voicepack.ts`;
  - `sw.ts`, which serves `.opus` from the store;
  - `netlify.toml`, Content-Type `audio/ogg` for `/voices/*.opus`;
  - `tools/make-voice-opus.mts`, run at the end of `tools/make-voice-pack.mts`;
  - check devices kept on MP3 in `tests/harness.mts`;
  - the new check `voiceopus`.
- **81ae9c5d8, 6b69371b2 and 99053d02a, the files:** 19,004 `.opus` files, 119 MB against 271 MB of MP3. The manifests list `formats: ["mp3","opus"]`.

The device's chosen format is kept in localStorage `sv2_voiceFmt`. An offline level may move a device from MP3 to Opus.

Start at Part 2. Part 2 and Part 3 can share one 5-hour window.

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
