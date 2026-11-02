# v1.07 bug-robot: status

Branch: `work/v107-bug-robot` (from main v1.06). Started 2 Nov 2026, 10:56 am AEDT.

## Plan
1. Read the recent runs of `.github/workflows/bug-fixer.yml` and their job logs; find why every bug ends `robot-stuck`.
2. Fix the workflow so the reason is visible and a small bug can go through again (reproduce, fix, check, push to
   `bugfix/<core>-<issue>`, draft pull request). No new permissions: Claude keeps a read-only token and no git
   credentials, only the publish job pushes and only to `refs/heads/bugfix/*`.
3. Prove it with one run started by hand on one issue from #746-#781.
4. List the issues that could be retried (no bulk label changes).
5. List old remote branches whose content is already in `main` (no deletes).

## What was wrong (found 2 Nov 2026, 11:00 am AEDT)
- Every `work` job since about 17 Oct 2026 has the same log: "Claude works on the bug" runs 12 to 15 s, Claude Code
  starts (`model: claude-sonnet-5-5`), and its first and only answer is `is_error: true` after about 0.2 s, with
  `total_cost_usd: 0` and empty `modelUsage`. Claude never read a file. Example: run 41354618083 (2 Nov, 8:57 am AEDT),
  job "work (764, play, plan)". The run before, 41173085260 (31 Oct), is the same.
- The AI review (`ai-review.yml`) uses the same secret and fails the same way (its Claude step lasts 17 s, run
  41361862156), so the problem is the Claude key or its account, not the bug robot's own steps.
- `HAS_KEY: true`, `HAS_BACKUP: false`: a key is set, there is no backup key, so nothing else is tried.
- The action hides Claude's output ("full output hidden for security"), and "Pack up the result" then writes the
  generic "it may have run out of usage or time", so the reason never reached the issues.
- Not the cause: checkout (1 to 3 min, fine), permissions (the publish job labels and comments fine), the test
  setup step (20 to 40 s), the time limit (jobs end in 2 to 4 min). One job on 31 Oct (#718) failed in "Get the checks
  ready" and then hung 20 minutes uploading; that was a one-off.
- The label rules made it worse: every bug that got stuck stays skipped until someone takes `robot-stuck` off by hand,
  and the tester-issues workflow files bugs as `big`, so the robot only ever writes plans for them.
- Last robot pull request that worked: #139 (13 Oct 2026). No `bugfix/*` branches are left on GitHub.

## What changed (`.github/workflows/bug-fixer.yml` only)
- New step "Say why Claude stopped": reads the action's execution file and prints only the closing error message of
  each try (main and backup account), cut to 500 characters, with anything that looks like a key blanked. The
  stuck comment on the issue now carries that sentence, so the owner sees for example "Invalid API key" instead of a
  guess. The conversation itself stays hidden.
- A hand start for one issue (Run workflow, issue number) is a deliberate retry: it takes a `robot-stuck` bug again
  without taking the label off first. The timer and new or labelled issues still skip `robot-stuck` bugs.
- When a retried bug ends fixed or with a plan, `robot-stuck` is taken off.
- No new permissions, no change to who pushes or where.

## The test run
- Issue: #747 (Swap and Trade: "a button covered by something"). The cover was the game's own "Sparkle Valley is open
  in another tab" stop screen (`js/launch.ts`), so auto play should not report the game's buttons as covered while
  that screen is up. It is one file (`js/autoplay.ts`, play core), so it fits the small-bug rule; label changed from
  `big` to `small` on this one issue only. tester-bugs: the robot's branch for #747 is `bugfix/play-747`, compare
  before fixing it again.
- Result: (pending, see below)

## Old remote branches already fully in main (2 Nov 2026 AEDT; none deleted)
Test: `git merge-tree --write-tree origin/main <branch>` gives exactly main's tree, so merging the branch would add
nothing (works for squash-merged rounds). These 12 can go if the owner agrees (Release asks):
- core/play-reading (last commit 12 Oct), core/rollout (13 Oct), studio-draft (13 Oct)
- claude/studio-live-takeover-r81-yavl1q (17 Oct), work/studio-live-20261017 (17 Oct)
- fix/tester-issues-no-mentions (22 Oct)
- handoff/studio-combined-20261029, handover/release-local-20261029, review/studio-finance-20261027,
  work/studio-content-website-20261029, work/voice-bitrate-32k (all 29 Oct)
- work/studio-home-20261030 (30 Oct)

The other 62 branches would still change something if merged. For most old ones (core/front-desk, core/battery,
core/studio, voices/run, release/r84 and the October work/* branches) that is because main changed the same files
again later, not because work is missing; they need a person to look before deleting. Current: code-map,
work/after-v104-20261031, work/v107-*.

## Checks
- Workflow YAML parses (python yaml): pass.
- The error-message filter tried on a made-up execution file: prints the message and hides a key-like string: pass.

## Progress
- 2 Nov 2026, 11:30 am AEDT: cause found, workflow fixed, test run next.
