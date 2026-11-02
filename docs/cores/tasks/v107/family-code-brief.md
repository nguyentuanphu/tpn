# v1.07 brief: family-code

Name: family-code. Branch: work/v107-family-code.

Save/Load Copy and the family code: `docs/cores/tasks/save-copy-family-code.md` and part 7 of `docs/cores/tasks/r91-open-points.md`.

1. First, find out what is already built:
   - Is Part 1 (save copy) live?
   - What is left of Part 2 (a family code made and shared inside the game)?
   
   Write this in your status file.
2. Part 2 touches family data and the server (`netlify/`). It cannot be undone, so CLAUDE.md says to wait for the owner. Write the plan:
   - what the child and the grown-up see;
   - what the server stores and for how long;
   - privacy;
   - how an old family code keeps working.
   
   Then ask the owner with a pop-up: "Build Part 2 as planned (Recommended)" / "Change the plan" / "Not now".
   
   Do not assume here, even after 15 minutes. Wait for the answer, and meanwhile do the parts that touch no data: screens behind a switch that is off, tests with made-up families, docs.
3. Never delete or overwrite a family's save or code. Use only test services and test families (`tests/services`).

Checks: the family, save and copy checks in `tests/run.mjs`, `--changed`, and the online checks with `node tests/services/start.cjs`.
