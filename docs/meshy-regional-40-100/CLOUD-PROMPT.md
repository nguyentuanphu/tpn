# Cloud prompt: regional villagers, pilot of 6 (10 Nov 2026)

The owner's decisions, 10 Nov 2026 (pop-up answers in the local chat that rebuilt the 11 named villagers):
- The regional villagers move to a cloud session.
- **Pilot first: 6 people, one per region, about 270 Meshy credits.** The other 42 people and the 13 animals wait for the owner's review of the pilot and a new budget.
- **Raw Meshy files go to a draft GitHub Release** on the repository, one release per batch. The branch keeps only the game models (under 500 KB each), tools and docs.

Paste everything below the line into a new cloud session on the repository `nguyentuanphu/tpn`, started from the branch `meshy-villagers`.

---

You are a helper chat for Sparkle Valley (repository TPN). Work only on a new branch `meshy-regional-cloud`, made from `origin/meshy-villagers`. Reply to the owner in Vietnamese, short and plain. Ask every question with the pop-up question tool (2 to 4 choices, the recommended one first and marked "(Recommended)").

**Read first, and follow them:** `CLAUDE.md`, `.claude/skills/meshy-characters/SKILL.md` (the rules, the pipeline, every Lessons item, and the "Villagers" section, which is the method you will use), `docs/friends-own-head-20261109/HANDOFF.md`, `docs/meshy-pipeline-20261109/PLAN.md`, and `docs/meshy-regional-40-100/` (README, RULES, GALLERY, OWNER-MESSAGES; 61 ChatGPT turnaround sheets in `reference-images/`).

**The task:** make 6 regional villagers as whole Meshy models (clothes painted on, no code clothes) on their own painted faces with mood pieces, the same way as the 11 named villagers. Check them in the game, then send the owner the in-game sheets and ask for approval. The 6 are, one per region:
- 045 Northern girl (child)
- 050 Huế grandma (elder)
- 057 Sài Gòn dad (adult)
- 064 City mum (Australia, city)
- 074 Coastal grandma: short sleeves with clear arm gaps (owner rule)
- 084 Outback boy

Numbers 088 to 100 are animals. They need a four-legged or bird rig and are not part of this pilot.

**Owner's rules (they override everything):**
- Never merge `main`, deploy, bump the version, or open a non-draft pull request.
- **Before every paid Meshy call, ask the owner with a pop-up**, even though the pilot is approved. Say which person, which step and how many credits. Never retry a paid request. Total for the pilot: at most 270 credits (per person: multi-image to 3D `meshy-7.1` 30, Remesh 30k 5, Remesh 9k `source@9000` 5, Auto-Rigging humanoid 5). Never print or commit `MESHY_API_KEY`. It must be set in this cloud environment's secrets; if it is missing, stop and tell the owner.
- Journal: every paid call is reserved, then posted once, in a SQLite journal (the same tables as `tools/meshy/overnight.ps1` uses: `jobs`, `remesh`, `rigging`). The cloud disk is lost when the session ends, so the journal file `meshy-jobs-cloud.sqlite3` is uploaded to the draft release **after every paid call**. At the start of every session, download it from the release before anything else. Never commit it.
- Raw files (Meshy's model, both remeshes, the rigged model) go to the draft release `meshy-regional-pilot-1` as assets (`gh release create --draft`, `gh release upload`). The branch gets only `models/villager-r<nnn>.glb` (under 500 KB), tools and docs.
- Do not change `js/friend-model.ts`, `tools/meshy/audit.mts`, `make_clothes.py`, `garments.json`, `models/finn|sol|clara|lumi*`, or the 11 named villagers' models. Another chat owns them.
- Nothing goes in the game for children until the owner approves. Which game role (`js/crowd-models.ts` `crowdRole`) each regional person replaces is the owner's choice: ask with a pop-up, and wire it up only after the answer.

**The cloud machine is Linux.** The tools were written for the owner's Windows PC, so port them first, without changing what they do on Windows:
1. Install Blender 4.2 LTS for Linux (`blender-4.2.x-linux-x64` from download.blender.org), PowerShell (`pwsh`) so the `.ps1` tools run, Node, Python 3 with Pillow, numpy and scipy, and Playwright with Chromium under `tests/` (`cd tests; npm ci; npx playwright install chromium`).
2. The tools hard-code `D:\WorkSpace\meshy` (raw models, fitted output, references) and the Blender path. Make them read environment variables, keeping today's values as the defaults: `SV_MESHY_ROOT` (for example `/work/meshy`) and `SV_BLENDER`. Also `PY_PICS` for the pictures Python (`D:\WorkSpace\meshy\tools\pyenv\Scripts\python.exe` on Windows). Paths are joined with `Join-Path`, never with `\`.
3. Start a page server of your own: `node <a small static server> <repo> 8793`, and set `SV_URL=http://127.0.0.1:8793/`. At most 2 browsers at once.

**Pipeline per person** (the skill's Pipeline and Villagers sections):
1. Check the sheet (`reference-images/<nnn>-<name>/front.png`, `left-side.png`, `back.png`): views agree, body only, hands empty, nothing hanging that Meshy would build twice.
2. Meshy, journal-guarded, each call asked first: multi-image to 3D, then Remesh 30k, then Remesh 9k, then Auto-Rigging. Save to `$SV_MESHY_ROOT/raw-models/{B,remesh,rigged}/r<nnn>.glb` and `r<nnn>-9000.glb`, and upload them to the release.
3. Game reference: `blender -b -P tools/blender/lumi.py -- $SV_MESHY_ROOT/work-v108 villager role=<the nearest existing role> game glb hd`. If no role fits, ask the owner.
4. Joints: `docs/meshy-production-20261107/joints/r<nnn>.json` (written by `auto_joints.py`).
5. Fit: `pwsh -File tools/meshy/fit_person.ps1 -Id r<nnn> -Villager -Ref <reference glb>` (the light model must stay under 500 KB; the script lowers the pictures by itself).
6. Audit: `tools/meshy/audit_villager.mts` covers the named villagers placed in the valley (`G.npcs`). Regional people are not NPCs yet, so add a mode that shows a model by its file (as `game_shots.mts faces` does for friends). Keep the same checks: worn, unseen, eyes, mouth, size. Keep the lessons: never audit the far "still" copy (`A.showStill(av, false)`); the camera sees every layer; shoot on a stage of its own with the valley's lights.
7. Review: in-game shots of every mood front and three-quarter, the eye moods from both sides, the back of the head, and the whole person front, three-quarter and back. Look at every picture at full size, and compare each with its ChatGPT sheet before trusting any number.

**Report to the owner:** one sheet per person (in-game pictures beside the ChatGPT front view), the audit summary, the sizes, the credits spent (from the journal) and the release link. Then ask with a pop-up: approve the 6 / fix something / stop. After approval, commit `models/` and the docs and push `meshy-regional-cloud`. Write every new lesson into the skill. Commit and push about every 2 hours.
