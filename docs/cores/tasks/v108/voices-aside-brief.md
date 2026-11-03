# v1.08 helper: voices-aside

Branch: `work/v108-voices-aside` (from `origin/fix/v108-startup-art`). Status file: `docs/cores/tasks/v108/voices-aside.md`. Shared rules: `README.md` in this folder.

The owner, 3 Nov 2026 AEDT: the game is getting heavy, above all the voices.
- Hide the male English and Vietnamese voices (`voices/en/m`, `voices/vi/m`), the Lê Minh Hanoi pack (`voices/fpt-leminh-v1`) and its working files (`temp/fpt-public-delta`).
- Do not delete them: put them aside for future plans, in a folder of their own on main, `voices-aside/` (owner's choice: "Thư mục riêng trong main"). It keeps the same inside layout, so they can be moved back later.
- Offer and show only the female voices, as the default.
- The saving is about 467 MB of the published site (134 + 139 + 117 + 77 MB).

Do:
1. Move the folders with `git mv` into `voices-aside/`: en-m, vi-m, fpt-leminh-v1, fpt-public-delta. Add a README there saying what they are and how to bring them back.
2. The game:
   - only female voices;
   - the voice choice (male or female, Lê Minh) no longer shows in Grown-ups, Studio or the first-run setup;
   - a device that had chosen male or Lê Minh moves to female without losing anything else;
   - the mixed-voice code still works with the female voices only.
   - Keep the code paths for male and Lê Minh behind a switch, off, so they can come back.
3. The site:
   - the service worker and offline lists, preloads and voice manifests no longer list the hidden files;
   - Netlify must not publish `voices-aside/`: the build command in `netlify.toml` removes it from Netlify's own copy before publishing;
   - `build-netlify.sh` leaves it out too.
4. The tools:
   - `tools/make-voice-pack.mts` records only the female voices by default;
   - the Lê Minh workflow stays but is off by default; say how to turn it back on.
5. The checks: update the voice checks (voicecover, voicearea, voiceroutes, hanoivoice, unit's recording test and the others that expect male or Lê Minh files) to the owner's decision: female only. This is an owner decision, not a weakened check. Say so in each changed check's comment.

Other helpers working now:
- fixes: the red checks, including voicearea and voicecover. Tell it in your status file what changed.
- aussie-voice: English words in Vietnamese lines, recording en-AU female only.
- layout, variety.

Report the size saved (repo folder sizes and the published site).
