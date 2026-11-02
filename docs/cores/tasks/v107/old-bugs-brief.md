# v1.07 brief: old-bugs

Name: old-bugs. Branch: work/v107-old-bugs.

Fix the oldest open bugs that are not tester auto play reports. The tester-bugs helper has #746 to #781.

- **#355:** the game restarts by itself or goes to a white screen while playing (iPhone and computer).
- **#341:** slow frames on a tester's computer (3 to 17 a second, r82).
- **#739:** a 2.3 s freeze on the iPhone Friends page. It was not reproduced at 6x slower CPU. From v1.06, the room steps write timing lines into the report's last 30 seconds (`svTrail` in `js/tester.ts`, timing in `js/net.ts` host()).

For each:
1. Read the issue, its reports and Studio data where you can reach them.
2. Look for causes. For #355: memory growth, WebGL context loss, the service worker update path, out-of-memory on iPhone, an error that reloads. For #341: per-frame costs and devices without a GPU.
3. Reproduce in the browser with CPU throttling, memory pressure and long play (for example 30 minutes of auto play). Measure the memory curve.
4. Fix what you find and add a check for each fix. For example, a long-play memory check, or a WebGL context loss that recovers without a white screen.
5. Where you cannot reproduce, add the logging that would show the cause next time, as v1.06 did for #739.

Do not close the issues; Release does that. Run speed checks one at a time with `--jobs 1`.
