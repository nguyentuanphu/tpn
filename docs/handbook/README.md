# The Sparkle Valley Handbook

Owner's ask, 4 Nov 2026 AEDT (brief: `docs/cores/tasks/handbook-brief.md`): one page about everything in the game, rules
included, in Vietnamese and English (Vietnamese first, with a switch), with a table of contents and a search box, and a
"Then and now" part that shows how the game grew.

- The page: [index.html](index.html), with its pictures in `img/`. It is also published as a claude.ai artifact
  (https://claude.ai/artifact/PFBV9XHeEBAUqTP7HDJW33, private to the owner until shared); Release
  republishes it to the same link before every "yes, deploy" (from another chat: pass that link as the artifact `url`).
- Made by `node tools/handbook.mts` from the game's own data (games, how-to guides, levels, festivals, stories and films,
  the lantern chapters, quests, the shop, stickers, companions, villagers, Studio switches, notifications, voices, the map)
  and from the docs (`CLAUDE.md`, `docs/SO-TAY-THIET-KE.md`, the owner's decisions in `docs/cores/*.md`, `docs/plans/`,
  `docs/cores/STORY.md`, the merge history of `main`). Nothing in the game changes.
- The "now" pictures (`img/now/`) come from `node tools/handbook-shots.mts` (the game served on port 8765, see the top of
  that file): the current game, website and Studio on a phone, a tablet and a computer. Run it when the look changes;
  the generator uses whatever is there.
- The four friends' pictures are copied from `docs/artifacts/sparkle-valley-characters/` on the branch
  `work/v108-lumi-refine`; when that branch is merged, the generator still reads them from git by that name.

## Release step

Before every yes-deploy: `node tools/handbook.mts`, commit `docs/handbook/`, republish the artifact to the same URL
(also in `docs/cores/release.md`, "A round, step by step", 6a).

## What the code and docs could not fill

- The decision log and the CLAUDE.md rules are quoted as written, mostly in English; the page says so in Vietnamese.
- "Offline levels" (Light, Automatic, Full) are a v1.09 plan, shown as planned.
- Old rounds before r60 have no screenshots in the repo (the clone keeps only recent history), so "Then" starts at r60
  (11 Oct 2026).
- Studio's "now" picture is its frame without the server (a helper chat has no Studio server or key, so the page reads 404); the Studio home of 30 Oct is shown beside it.

## Progress notes

- 4 Nov 2026 AEDT, helper "handbook", branch `work/handbook` from `origin/integrate/v108`: generator, shots tool, page,
  release step and docs link. Checks (`suite.mts --changed --base origin/integrate/v108`, commit 822a419ca): types, names,
  noemoji, arch, rules, bilingual, preload pass; unit passes (516) once the root `npm install` adds `pg`; emoji fails only
  on `docs/cores/tasks/v108/fixes.md`, already on integrate/v108 and not touched here. Page looked at on phone, tablet and
  computer (no sideways scroll). Artifact published 4 Nov 2026 AEDT.
