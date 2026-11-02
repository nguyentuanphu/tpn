# v1.07 brief: startup

Name: startup. Branch: work/v107-startup.

Focus 1 of the owner's plan (docs/plan-hoan-thien/KE-HOACH.md): start-up under 3 seconds. Related: issue #36.

This round:
1. **Measure first.** The check `perf` reports startMB 2.73 MB against its ratchet (about 2.68 effective). v1.05 was over too, measured the same way (2.595 vs 2.637). Run `cd tests && node suite.mjs --jobs 1 --only perf,startup,battery`, one at a time. Write down the first download per module, the time to Welcome, and the time until a child can tap.
2. **Get `perf` back under its ratchet without raising it:**
   - Load later anything a child does not need before the first tap: games, films, stories, Studio parts, the school, festival extras, big content tables.
   - v1.06 already moved school, corners, companions and pet hats to load later. Continue in the same way: dynamic `import()` after the title screen.
   - Keep `sw.ts`'s offline list complete, so the game still works fully offline.
3. **The Simple screen opens without waiting for the 3D valley:** a child who uses the Simple screen can tap a game before the world is built. Add a check that measures it.
4. **Add a "can play" timing** to the anonymous start-up timings the game already sends with each report (helper ms, start page ms, page readable ms), so Studio can show real devices.
5. Do not change world positions. If you must touch the map files, keep them for the next round and say so.

Check on phone, tablet and computer screenshots that nothing looks different. Report the before and after numbers.
