# Branch maintenance · 27 October2026 AEDT

Owner asked to clear unused GitHub branches. Eight historical branches were archived and removed after proving their exact tip was either the head of a merged PR or an ancestor of live main. Every tip is preserved under archive/2026-10-27/<original-branch-name>. Remote tag creation and branch deletion were one atomic push, with per-branch SHA leases protecting against concurrent changes.

Archived: integration/r88-20261021, release/r82, release/r87, release/r89, release/r90-launch, release/r91, plan/save-copy-family-code and work/family-website-20261023.

The inventory had75 branches;67 were retained. Those include active PR/worktree branches, core workflow branches, main, code-map, studio-draft, studio-exe, daily voice automation and original FPT recording sources. Other tips without exact merge proof were retained rather than guessing that their post-merge changes were disposable. This cleanup does not claim every retained branch is still needed.

The full SHA/PR evidence and retained reasons are in branch-cleanup-20261027.json. To restore an archived branch without losing its exact tip:

    git push origin refs/tags/archive/2026-10-27/<name>:refs/heads/<name>

No game code or live deployment changed in this cleanup.
