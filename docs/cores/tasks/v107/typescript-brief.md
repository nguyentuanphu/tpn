# v1.07 brief: typescript

Name: typescript. Branch: work/v107-typescript.

Continue "TypeScript everywhere" (docs/cores/tasks/typescript-plan-20261016.md and docs/plans/bugs-typescript-20261019.md). About 75 game files in `js/*.js` and 60 in `js/content/*.js` are still JavaScript. `ls js/*.js js/content/*.js` lists the ones that have no `.ts` twin. The build is `node tools/build.mts`: the `.ts` file is the source, and the `.js` beside it is generated.

This round:
1. Convert `js/content/*.js` and the non-map `js/*.js` files. Leave the World core's map files for a later round: `js/cities.js`, `js/regions.js`, `js/places.js`, `js/homes.js`, `js/hawkers.js`, `js/regionsites.js`, `js/realworld.js`, `js/ferry.js`, `js/houses.js`, `js/animalhomes.js`, `js/powerlines.js`, `js/signposts.js`, `js/reeds.js`. Leave `js/vendor` too.
2. Follow the plan's method, in batches of about 15 to 25 files. For each batch:
   - (a) A rename-only commit (`git mv x.js x.ts`, with the generated `.js` rebuilt), so git follows the rename.
   - (b) A second commit with type notes and fixes, until the light type check (`node tests/run.mjs` check `types`, or whatever the repo's types check uses) shows 0 errors for those files.
   - In the same batch, update paths in tests, docs, `tests/check-map.json`, the preload list (`node tools/preload.mts`) and `sw.ts`'s file list if a path changes.
3. No behaviour change at all. Do not tidy logic while converting.
4. Run `--changed` per batch. Because it will pick the full suite, start the GitHub full suite after every 2 or 3 batches, not after each one.
5. If time is left, write a plan for strict checking: which files are strict-clean already, and a ratchet list. Do not turn strict on.

Report how many `.js` files are left, by core.
