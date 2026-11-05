# Round v1.08c: helpers on the owner's second account (Release, 5 Nov 2026 AEDT)

The owner runs three more helpers on a second Pro account. They split the rest of round v1.08b so the first account is not overloaded.

**Chats across accounts cannot message each other.** The repo is the shared memory, and the owner carries messages. When you finish a part, write it in your status file and push. The owner tells Release.

**How to run (owner's choice, by pop-up):**
- Two helpers at a time.
- Each brief is split into parts that fit one 5-hour usage window.
- After every part: commit, push, and update the status file. Then start the next part.
- If the usage limit stops you, the next session starts from your last pushed part.

**Rules:** everything in `docs/cores/tasks/v108b/README.md` applies. Read CLAUDE.md, HANDOFF.md, that README and your brief first. In short:
- **Branch:** only your own branch, from the base named in your brief. Never `main`, `integrate/v108` or `release/v1.08`.
- **Merging:** never merge another helper's branch. **Only Release collects, combines, and runs the full suite and the combined checks** (owner, 5 Nov). Run only the checks for your own change, one at a time, with `cd tests && node suite.mts --changed` or `--only <names>`.
- **Voices:** female only (HoaiMy, Natasha), with Azure if `AZURE_SPEECH_KEY` is set in this account. Never print the key. If it is not set, list the lines in your status file and Release records them.
- **Every child-facing screen:**
  - English and Vietnamese;
  - our own art;
  - 44 px touch targets, 64 px for under-5s;
  - one screen on phone (portrait and landscape), tablet and computer;
  - text at least 16 px.
- **Docs:** in English, no emoji, AEDT times. Your final chat report is in Vietnamese.
- **Commits** end with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>` and `Claude-Session: <your session link>`.
- **Status file:** `docs/cores/tasks/v108c/<name>.md`, with your plan, progress per part, checks (pass/fail/skipped) and commit ids. Write "ready for Release" at the top when every part is done.

**The three helpers** (start A and B; start C when one of them finishes):
- **A. blender:** brief `blender-brief.md`, branch `work/v108c-blender`, from `origin/work/v108b-story`.
- **B. voices:** brief `voices-brief.md`, branch `work/v108c-voices`, from `origin/work/v108b-platform` (Opus is already done there).
- **C. parents:** brief `parents-brief.md`, branch `work/v108c-parents`, from `origin/integrate/v108`.
