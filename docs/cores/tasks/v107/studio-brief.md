# v1.07 brief: studio

Name: studio. Branch: work/v107-studio.

Studio is the owner's admin app (`studio/`). It has two tasks:

1. **Make the first page fast:** "Today in Sparkle Valley", as described in `docs/cores/tasks/studio-home-20261030.md`.
   - Show a quick summary first.
   - Load the slow pages only after the owner picks a date.
   - Pages share one fetch instead of each fetching on its own.
   - Measure the time before and after.
2. **Bring the connected redesign into the real Studio:** the designs are in `docs/studio-connected-concept-20261027/`, `docs/studio-owner-desk-20261027/` and `docs/studio-management-foundation/`.
   - Read their README first. Take the parts that are designed and checked: Owner's Desk, the graphs, and the richer People detail.
   - Use real data only. Where data is missing, show the empty state the design describes, never made-up numbers.
   - This is the owner's private admin. Keep every privacy rule (PRIV-...): no child's data leaves where it is now.

Also convert `studio/ui/vi.js`, the last Studio `.js`, to TypeScript if that is simple.

Checks: `studio` and the Studio checks in `tests/run.mjs`, `--changed`. Take screenshots on computer and tablet. Ask the owner with a pop-up before any change in what a page shows by default.
