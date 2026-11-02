# v1.07 brief: bug-robot

Name: bug-robot. Branch: work/v107-bug-robot.

The bug robot (`.github/workflows/bug-fixer.yml`; rules in docs/cores/front-desk.md) is stuck on every issue: they carry the `robot-stuck` label. The owner wants small bugs fixed by the robot again.

1. Read the recent runs of bug-fixer.yml with the GitHub tools (list the workflow runs and the job logs) and find why it gets stuck. Possible causes: usage or time limits, permissions, checkout size (the repo is large; the Netlify zip is about 500 MB), a missing key, a test step that never ends, or the label rules.
2. Fix the workflow so a small bug goes through again: it is reproduced, fixed, checked, pushed to `bugfix/<core>-<issue>` and opened as a draft pull request, as the rules describe. Do not give the robot more permission than the rules allow (never push to `main`, never merge).
3. Prove it with one real run on a small open issue, started by hand. Pick one from #746-#781 that the tester-bugs helper is unlikely to need; say which one in your status file. Leave the robot's branch for Release.
4. Do not remove `robot-stuck` labels in bulk. List which issues could be retried.
5. Also list the old remote branches that are fully in `main` already (compare by content, as rounds were squash-merged). Do not delete any: Release asks the owner.
