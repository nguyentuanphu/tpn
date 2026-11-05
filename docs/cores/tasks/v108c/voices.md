# v1.08c helper B: voices (status)

Branch `work/v108c-voices`, from `origin/work/v108b-platform` (Opus voices, brief part 1, already there). Brief: `voices-brief.md`. Started 5 Nov 2026 AEDT; the owner's go is given.

A scheduled task resumes this work after each usage reset (owner, 5 Nov 2026 AEDT: 12:40 am Sydney time, then every 5 hours; `CRON_TZ=Australia/Sydney 40 0,5,10,15,20 * * *`). It stops itself once this file says "ready for Release".

## Plan

**Part 2: three offline levels in Grown-ups** (Sound and voices, "Offline voice pack")
- `js/state.ts`: `offlineLevel()` ('light' | 'auto' | 'full', unset means 'auto'); Light and Full keep voices by themselves (`autoPackOn`).
- `js/voicepack.ts`: `setOfflineLevel`, `levelSpace`, `lightGroups` (the core, the area the child is in, then the last areas while they fit in about 45 MB), `levelGroups`; Light downloads only those areas and removes everything else; `packSig` names Opus so a pack kept as MP3 is not counted as the Opus pack.
- `js/voicestore.ts`: `prune(keep)` (rewrites bundles without the removed recordings, deletes empty ones: the space really comes back) and `bytes()`.
- `js/voice-index.ts`: `moveToOpus` (a level may move a device from MP3 to Opus: Light always, Full when the pack is not all kept yet).
- `js/voice.ts`: `chooseOfflineLevel`, `offlineSpace`; "Keep all voices" is now the Full level.
- `js/extras.ts` + `css/style.css` (block at the end): three buttons (64 px, text 16 px or more) with the space each takes and what this device keeps now; a smaller level says how much it freed. The Full button keeps the old id `#xPackSave`.
- `js/ui/title.ts`, the offline note in `js/voice.ts`: point to "Offline voices → Light or Full".
- Check: new `offlinelevels` (`tests/offline-levels.mts`), then `phone`, `bilingual`, and the voice checks this touches (`voicepack`, `voicearea`, `voiceopus`, `voicebackground`).

**Part 3: downloads on demand and festival packs** (next)
- On demand: new areas, features and games download when switched on and visited.
- Festival packs (decorations, festival game, voice lines) download on Wi-Fi a few days before their decorations; removed after the festival on Light, kept on Full.
- Checks: new `festivalpack`, `swupdate`, `offline`, `startup` (firstKB must not grow).

## Assumed choices (owner can change)
- **Automatic is today's behaviour** (the 31 Oct 2026 owner decision: voices play over the internet and each line heard is kept; a device that already kept every voice keeps them up to date on Wi-Fi). The plan's table describes Automatic as "the rest area by area on Wi-Fi", written before that decision; the brief says "the default, as today". Choosing Automatic from Full frees the game lines and keeps the core, the places the children visited, the stories and the festivals.
- Light keeps the last areas too while the total stays under about 45 MB (the plan says 30–50 MB); lines heard elsewhere on Light are removed at the next tidy (start or area change).

## Progress
- Part 2: in progress.

## Checks
(filled in per part: commit, check, pass/fail/skipped, date AEDT)

## New spoken lines
None so far (the level screen is Grown-ups text, not spoken).
