# v1.08 helper: voices-aside (status)

**ready for Release** (3 Nov 2026, 5:10 pm AEDT). Branch `work/v108-voices-aside`, made from `origin/fix/v108-startup-art`.

## Plan

Owner, 3 Nov 2026 AEDT: the game is getting heavy, above all the voices. Hide the male English and Vietnamese voices and the Lê Minh pack (and its working files), keep them on main in `voices-aside/`, and offer only the female voices.

1. `git mv` the four folders into `voices-aside/` with the same inside layout; a README there says what they are and how to bring them back.
2. Game: one switch `ASIDE_VOICES_ON = false` (in `js/state.ts`) keeps the male and Lê Minh code paths but never chooses them; Grown-ups shows no male or Lê Minh choice; a device that had chosen them moves to female, nothing else changes.
3. Voice lists: `voices/manifest*.json` and `voices/areas.json` name only the published voices (new `tools/voices-aside.mts`).
4. Site: Netlify's build command removes `voices-aside/` before publishing; `build-netlify.sh` leaves it out.
5. Tools and Studio: female voices only by default; `SV_ASIDE_VOICES=1` (tools, GitHub variable) brings back the male voices and the Lê Minh workflow.
6. Checks updated to the owner's decision (female only), each with a comment naming it.

## What changed

- Moved (git mv, nothing deleted): `voices/en/m` to `voices-aside/voices/en/m`, `voices/vi/m` to `voices-aside/voices/vi/m`, `voices/fpt-leminh-v1` to `voices-aside/voices/fpt-leminh-v1`, `temp/fpt-public-delta` to `voices-aside/temp/fpt-public-delta`. Copies of the old voice lists that named the male recordings: `voices-aside/voices/manifests-with-male/`. `voices-aside/README.md`: what is there and how to bring it back.
- Kept: the Chinese and Hindi voices (`voices/zh/m`, `voices/hi/m`): the only voice of those languages, and small.
- `voices/manifest.json`, `manifest-en.json`, `manifest-vi.json`: the `m` slot removed from English and Vietnamese lines, cast and voices (signatures rebuilt with `tools/voice-manifests.cts`). `voices/areas.json`: the same groups, sizes of the published files only. Made by `node tools/voices-aside.mts` (`--check` reports any list that still names a voice put aside).
- `js/state.ts`: `ASIDE_VOICES_ON = false`; `dropAsideVoice()` moves `voiceMale: true` and `voiceViVariant: 'leminh'` to false and `standard` on load and on backup import; nothing else in the settings changes.
- `js/voice.ts`: Lê Minh never selected, previewed or downloaded while the switch is off; a male character plays the female recording (still a little slower and deeper, as before); a male preview plays the female file. The mixed English/Vietnamese code still works with the female voices (check `mixedhanoivoice`).
- `js/voicepack.ts`: `packMale()` is false while the switch is off, so no male file is ever downloaded.
- `js/ui-settings.ts` (Grown-ups, Voices): only the female preview button and a note that every character speaks with the female voices; the male toggle, the Lê Minh selector and its Listen/Save offline buttons are shown only with the switch on.
- Studio (`studio/core.cts`, `studio/ui/app.ts`): `CAST` lists and records only the female English and Vietnamese voices (`ASIDE_VOICES_ON = false` there too). The per-villager "Voice: woman/man" choice in Studio's Villagers page stays: it sets how a character sounds (pitch and pace of the female recording, phone voice), not which recordings exist.
- First-run setup: had no voice choice; nothing to change.
- Website `home/index.html`: the parent-controls sentence about male voices and Lê Minh now says every character speaks with the female recorded voices (English and Vietnamese).
- `netlify.toml`: build command starts with `rm -rf voices-aside`. `build-netlify.sh`: removes `voices-aside` from its copy too (it was already not copied).
- Tools: `tools/voice-providers.mts` has `ASIDE_VOICES_ON` (env `SV_ASIDE_VOICES=1` or `--aside-voices`), `AZURE_VOICES_ALL` (the full cast, kept) and `AZURE_VOICES` (female English and Vietnamese, Chinese, Hindi by default); no Lê Minh route by default. `tools/make-voice-pack.mts` therefore records only the female voices by default (comment says how to switch). `tools/record-public-voice-delta.mts` records nothing for Lê Minh unless switched on. `tools/voice-routing-audit.mts` audits Lê Minh only when switched on.
- GitHub: `.github/workflows/fpt-arcade-delta.yml` (the Lê Minh workflow) runs only when the repository variable `SV_ASIDE_VOICES` is `1`; `.github/workflows/public-voice-delta.yml` passes that variable to the tools and runs its Lê Minh step only then. How to turn it back on: `voices-aside/README.md` step 4.
- Service worker: lists no voice files; its Lê Minh cache route stays (inert: nothing asks for those files).

## Checks changed to the owner's decision (female only; not weakened)

Each has a comment naming the 3 Nov 2026 decision.
- `hanoivoice` (`tests/hanoi-voice.mts`): with the switch off it checks the files are in `voices-aside/` and not in `voices/`, the lists name only female English and Vietnamese voices, a device with male and Lê Minh saved moves to female and keeps its other settings, Grown-ups shows no male or Lê Minh choice on phone, tablet and computer (en, vi; 44 px button; no sideways scroll), nothing put aside is fetched. The original Lê Minh check runs when the switch is on.
- `mixedhanoivoice`: with the switch off, every mode (Lê Minh saved) plays the whole female recording with no Lê Minh fragment and no male file fetched.
- `voicebackground`: both previews play the female file, no male or Lê Minh choice in Grown-ups, a device that had chosen them moves to female, the offline download fetches nothing put aside.
- `viwords` (`tests/checks/code.mts`): Cô Tam's line has the female recording and no male one.
- `storyquestflow`: a man's line plays the female recording.
- unit `voice-provider-routes`: female-only routes by default, the full cast kept in `AZURE_VOICES_ALL`. Unit `voice-male-default`: `voiceMale: true` cannot switch male downloads on.
- `voicecover`, `voicearea`: no change needed: they read `CAST` and the manifests, which are now female only.

## Checks (3 Nov 2026 AEDT, on commit after 7fe729a2f)

`node suite.mts --changed` picked the full suite (`.gitignore` and many files differ from main on the base branch), so only the checks that cover this change were run with `--only`; **the full suite is left for Release**.

| Check | Result |
|---|---|
| hanoivoice, mixedhanoivoice, voicebackground, viwords, voicefirstchoice, voice, voicepack, voiceonline, storyquestflow, lighterload, boot, phone | pass |
| types, arch, emoji, noemoji, bilingual, rules, names | pass |
| unit | fail, **not from this change**: `every advertised recording exists` lists 1491 English female files named in `voices/manifest-en.json` but missing on the base branch (they were missing for both voices before). Same on the base without this change. |
| voicearea | fail, not from this change: the same 1491 missing `voices/en/f` files. |
| voiceroutes | fail, not from this change: the same 1491 files (before this change it also counted their male copies). |
| voicecover | fail, not from this change: 203 new lines of other helpers (for example notifications) not recorded yet; before this change it counted their male copies too. |
| preload | fail, not from this change: `index.html` preload list is out of date for other helpers' new files (`js/art/english.js`, `js/content/science-places.js`). |

Screenshots looked at: `tests/out/hanoi-settings/{phone,tablet,computer}-{en,vi}.png` (Grown-ups, Voices: one female preview button, no male or Lê Minh choice, tidy on all three).

## For the fixes helper

voicearea, voicecover, voiceroutes and unit now expect only the female English and Vietnamese voices. The 1491 missing `voices/en/f` files and the 203 unrecorded lines are the remaining red; nothing male needs recording any more.

## Size saved

- Repository folders moved (disk): en/m 114 MB, vi/m 121 MB, fpt-leminh-v1 101 MB, temp/fpt-public-delta 74 MB; `voices-aside/` is 466 MB in all (the brief's estimate: 134 + 139 + 117 + 77 = 467 MB).
- Published site: `voices/` was about 687 MB and is now 297 MB (259 MB of files), and `temp/fpt-public-delta` (74 MB) is no longer published: about 467 MB less on Netlify.
- Children's devices: never download male or Lê Minh files again. Lê Minh files already saved on a device stay in its `sv-voices-fpt-leminh-v1` cache (not deleted; nothing plays them).

## Spoken lines

None new.

## Added by Release (owner, 3 Nov 2026 AEDT)

- Chinese and Hindi keep their male voices (`voices/zh/m`, `voices/hi/m` stay published).
- The Chinese/Hindi "Also learn" buttons left the outside screens: the Welcome screen (`js/ui/title.ts`) and the Language section of Grown-ups (`js/ui-settings.ts`). Chinese and Hindi stay inside China Town, India Village and First Words. A saved `learnLang` (set only by those buttons) is cleared on load (`js/state.ts`), so no device is stuck hearing extra Chinese or Hindi words in every game. Checks: `welcomesteady` (`tests/checks/startup.mts`) and the steady sweep (`tests/owner-steady-sweep.mts`) no longer tap the Chinese switch and now check the buttons are gone from the Welcome screen; `hanoivoice` checks Grown-ups has none.
- The 1,092 Lê Minh recordings made by the fixes helper (branch `voices/v108-leminh`, commit 198e2e9fd) are brought into `voices-aside/voices/fpt-leminh-v1` (manifest now 8,975 lines, every file present) and their working files into `voices-aside/temp/fpt-public-delta`: kept in the repository, not published, in no game manifest or offline list. `js/content/hanoi-pack-info.ts` updated to that pack's size (shown only with the switch on).
- Checks after these additions (commit 2217bdafe, 3 Nov 2026 AEDT): hanoivoice, welcomesteady, startup, phone, boot, noemoji, names, types: all pass (8/8).
- Not in this branch: the 35 picture-only strings `tools/voice-lines.mts` reads from `js/content/english.ts` (Release handles it at merge).

## Owner's decisions

- 3 Nov 2026 AEDT: put the male English and Vietnamese voices, Lê Minh and its working files aside in `voices-aside/` on main ("Thư mục riêng trong main"); female voices only, as the default.
- Assumed, owner can change: the Chinese and Hindi voices (one male voice each, small) stay published; Studio's per-villager "woman/man" choice stays (it shapes how the female recording sounds, it does not choose a male recording).
