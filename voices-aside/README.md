# voices-aside: voices put aside, not deleted

Owner, 3 Nov 2026 AEDT (round v1.08): "the game is getting heavy, above all the voices". The male English and Vietnamese voices and the Lê Minh pack are hidden from the game and kept here for future plans ("Thư mục riêng trong main": a folder of its own on main). Only the female voices are offered and played.

This folder is in the repository but is **never published**: the Netlify build command in `netlify.toml` removes it from Netlify's own copy before publishing, and `build-netlify.sh` leaves it out too.

## What is here

The inside layout is the same as where each folder came from, so moving it back is one `git mv` per folder.

| Folder here | Came from | What it is | Size |
|---|---|---|---|
| `voices/en/m/` | `voices/en/m/` | English male recordings (Azure en-AU-WilliamNeural) | about 134 MB |
| `voices/vi/m/` | `voices/vi/m/` | Vietnamese male recordings (Azure vi-VN-NamMinhNeural) | about 139 MB |
| `voices/fpt-leminh-v1/` | `voices/fpt-leminh-v1/` | The Lê Minh Northern Vietnamese pack (FPT Neo, FPT.AI-VITs) with its manifest | about 117 MB |
| `temp/fpt-public-delta/` | `temp/fpt-public-delta/` | Lê Minh working files: original FPT recordings and receipts of the reviewed public batches | about 77 MB |
| `voices/manifests-with-male/` | copies of `voices/manifest.json`, `manifest-en.json`, `manifest-vi.json` as they were on 3 Nov 2026 | the voice lists that still named the male recordings (`"fm"` per line) | under 1 MB |

The Chinese and Hindi voices (`voices/zh/m`, `voices/hi/m`) were not put aside: they are the only voice of those languages and small.

## What changed when they were put aside

- `voices/manifest*.json` and `voices/areas.json` name only the published voices (`node tools/voices-aside.mts`; `--check` says whether a list still names a voice that was put aside).
- The game: `ASIDE_VOICES_ON = false` in `js/state.ts`. While it is off, no male English or Vietnamese recording and no Lê Minh recording is chosen, the choices are not shown in Grown-ups, and a device that had chosen the male voices or Lê Minh moves to the female voices (nothing else in its settings changes). The code paths stay.
- Studio: `ASIDE_VOICES_ON = false` in `studio/core.cts` and `studio/ui/app.ts`: it lists and records only the female English and Vietnamese voices.
- The tools: `tools/voice-providers.mts` gives only the female English and Vietnamese voices and no Lê Minh route unless `SV_ASIDE_VOICES=1` (or `--aside-voices`). `tools/make-voice-pack.mts` records only the female voices by default; `tools/record-public-voice-delta.mts` records nothing for Lê Minh by default.
- GitHub: the Lê Minh workflow (`.github/workflows/fpt-arcade-delta.yml`) and the Lê Minh step of `.github/workflows/public-voice-delta.yml` run only when the repository variable `SV_ASIDE_VOICES` is `1`.

## How to bring them back

1. Move the folders back:
   ```
   git mv voices-aside/voices/en/m voices/en/m
   git mv voices-aside/voices/vi/m voices/vi/m
   git mv voices-aside/voices/fpt-leminh-v1 voices/fpt-leminh-v1
   git mv voices-aside/temp/fpt-public-delta temp/fpt-public-delta
   ```
2. Turn the switches on: `ASIDE_VOICES_ON = true` in `js/state.ts`, `studio/core.cts` and `studio/ui/app.ts`.
3. Rebuild the voice lists from the files on disk, with the male voices: `SV_ASIDE_VOICES=1 node tools/make-voice-pack.mts --engine azure --count` shows what is missing (lines added since 3 Nov 2026 have no male recording); with `AZURE_SPEECH_KEY` set, `SV_ASIDE_VOICES=1 node tools/make-voice-pack.mts --engine azure` records the missing male lines and writes `voices/manifest*.json` and `voices/areas.json` with both voices. (The old lists in `voices/manifests-with-male/` show what was there on 3 Nov 2026; do not copy them back over newer lists.)
4. Lê Minh on GitHub: set the repository variable `SV_ASIDE_VOICES` to `1` (Settings, Secrets and variables, Actions, Variables). Locally: `SV_ASIDE_VOICES=1 node tools/record-public-voice-delta.mts <reviewed inventory>`.
5. The checks: the voice checks name the owner's 3 Nov 2026 decision in their comments; switch their female-only expectations back.
6. Expect the published site to grow by about 390 MB again (`temp/` is published too while it is in the repository root).
