# Helper C: parents (round v1.08c), status

Branch `work/v108c-parents` from `origin/integrate/v108`. Brief: `parents-brief.md`. Owner's go given (5 Nov 2026 AEDT).
A scheduled resume is set for 6 Nov 2026 12:41 AM AEDT in case the usage limit stops this session (owner, 5 Nov 2026 8:05 pm AEDT).

## Plan
- **Part 1: learning report and difficulty by subject**
  - `js/content/subjects.ts` (new, pure): the five subjects (Vietnamese, English, Maths, Science, Money) from GAME_INFO areas
    and the Học vui corner links; the per-subject step that follows the child (5 good wins out of 6: one step harder;
    3 poor results: one step easier; at most two steps, never to Talent by itself; under-5s unchanged); the grown-up's
    own level per subject always wins (setting it forgets the child's earlier in-game picks in that subject); the week
    per subject, what went well and one game for next week.
  - `js/report.ts`: each solo game of a subject also counts per day (`day.sub`, `day.gp`) and feeds the step.
  - `js/main.ts` (one line and one import): a game starts at its subject's level unless the child picked a level in it.
  - `js/learnreport.ts` (new): the report window, the picture to save or share (drawn with our own art, nothing sent),
    and the Grown-ups part "Learning: report and levels by subject".
  - `js/ui-settings.ts` (two small edits), `css/style.css` (one block at the end).
  - Checks: new `learningreport` and `subjectlevel`, plus `phone`, `bilingual`.
- **Part 2: Lumi as the guide** (welcome, new things, week's news, voice of the Simple screen; check `lumiguide`, `simple`, `voicecover`).
- **Part 3: play together and gentle play time** (checks `playtogether`, `playtime`, `phone`).

## Progress
- Part 1: in progress.

## Shared files touched
- `js/main.ts`, `js/ui-settings.ts`, `js/report.ts`, `css/style.css` (end block), `tests/run.mts` (end block), `.gitignore` (build adds the new .js files).
