# Helper brief: platform (lighter offline, light start, open bugs, roads, Studio speed)

Branch `work/v108b-platform`. Plan: `docs/plans/v109-extras.md` ("Lighter offline", "Downloads on demand, festival packs ahead", "Waiting items joining v1.09"). Open bugs: GitHub issues listed there (#507–556, #577, #566, #350, #375, #355, #341, #652, #634, #36, #34) and `docs/concept-d/`, `docs/roads-concept-d/` for the roads.

Do:
1. **Voices in Opus:** every recording also made as Opus (16–20 kbps mono, about 40–50% smaller), MP3 kept for devices that can't play it (`canPlayType`); the voice pack, `sw.ts`, the pack maker (`tools/make-voice-pack.mts`) and the voice checks learn the second format. Female voices only (HoaiMy, Natasha); `voices-aside/` stays untouched.
2. **Three offline levels in Grown-ups:** Light (core lines and the child's area, about 30–50 MB), Automatic (default, as today), Full (everything), each showing the space used; a smaller level frees space.
3. **Downloads on demand:** new areas, features and games download when switched on and visited. **Festival packs** (decorations, festival game, voice lines) download on Wi-Fi a few days before the decorations; removed after the festival on Light, kept on Full.
4. **Light first download and a valley that builds as the child walks:** firstKB back under 1030 KB; the child walks in after the essentials; areas built as the child comes near (tasks #25, #32, #39, #41). Checks `startup`, `perf`, `battery`, `longplaymem` must pass; do not raise their limits.
5. **Open bugs:** games that would not open, #566 stale chunk, #350 rules, #375 tester report screen, #355 white screen on restart, #341 slow frames, #652, #634; and the game-rules audit across all games (`docs/rules-audit/`). Close each with a note on the issue when fixed (GitHub comments end with the Claude footer).
6. **Roads and dirt roads redrawn to the Concept D drawings** (#34): `js/roads.ts`, with `roads` and `solid` checks.
7. **Faster Studio:** the first page (summary) opens fast, the heavy pages load after a date is chosen, one shared fetch (`studio/ui/app.ts`, netlify functions). Check `studio` and `studiofast`.
8. **Checks:** `voicepack`, `voicearea`, `offline`, `swupdate`, `preload`, `startup`, `perf`, `battery`, `longplaymem`, `roads`, `solid`, `studio`, new `offlinelevels`, `festivalpack`.
