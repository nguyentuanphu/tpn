# Round v1.08d: the rest of the work (Release, 5 Nov 2026 AEDT)

**Owner (5 Nov 2026 AEDT):** "Proceed for the below: the valley building as the child walks (it would change where things get placed in the valley, so it needs your OK to move places), and season 2, and everything that you say left for later round. Ensure you split work evenly and dont go over the number of agents i said."

**The base:** `integrate/v108` now holds platform, games, story and friends, merged by Release on 5 Nov.

**Helpers:** the first account runs at most 5 helpers at once. The quality helper is still running there, so this round adds 4. The second account keeps its 3 (A blender, B voices, C roads).

| Helper | Brief | Branch |
|---|---|---|
| valley | `valley-brief.md` | `work/v108d-valley` |
| s2vn | `s2vn-brief.md` | `work/v108d-s2vn` |
| s2au | `s2au-brief.md` | `work/v108d-s2au` |
| polish | `polish-brief.md` | `work/v108d-polish` |

Each branch starts from `origin/integrate/v108`.

**Rules:** everything in `docs/cores/tasks/v108b/README.md` applies.
- **Only Release merges and runs the full suite** (owner, 5 Nov). Run only the checks for your own change, one at a time.
- **Push often.** After each part: commit, push, update your status file `docs/cores/tasks/v108d/<name>.md`.
- **Medium effort, few subagents.** If a usage limit stops you, carry on from your last push after the reset.
- **Moving places:** the owner has allowed it for this round. Record every place you move in your status file: old position, new position, why.
- **Done:** write "ready for Release" at the top of the status file and message Release (session_01SchVRv9GNVGszhptzXpYMs).

**Release's merge notes (5 Nov 2026):**
- `work/v108c-roads` (Concept D roads, website script in TypeScript) merged into `integrate/v108`.
- **To do when quality merges:**
  - Keep the underscore fix from `work/v108c-parents` `js/report.ts`: an event id turns "vi_tones" into "vi-tones", so games with "_" were not counted in the play report. Map the slug back to the game id.
  - Update the expected counts in `check-preview` (18, was 17) and `check-festivals` (15, was 13). They went red because content grew; the roads helper found this.
