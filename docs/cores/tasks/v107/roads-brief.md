# v1.07 brief: roads

Name: roads. Branch: work/v107-roads.

Issue #34: roads and dirt roads look poor, not like the Concept D drawings. Find the Concept D drawings in `docs/` (search for "Concept D"), and read the issue and its comments.

1. Make the roads and dirt roads match Concept D: road surface, edges, lines, dirt paths and crossings. Use our own drawing and textures only.
2. **Do not move any place.** World positions stay the same. If a road must change course, ask the owner first with a pop-up, and show before and after pictures.
3. Mind speed. The checks `perf`, `startup` and `battery` must not get worse; run them one at a time with `--jobs 1`. Build cost goes into the existing road cache from v1.04, if it applies.
4. Take before and after screenshots at five or more well-known spots (town, village, the island road, a dirt path, a crossing) on phone, tablet and computer. Put them in `docs/roads-concept-d/` and link them from your status file.
5. Before you finish, ask the owner with a pop-up whether the new look is right. Give 2 or 3 choices, with the after pictures described.

Existing road checks (`roads`, `ground`, `padmap`, `mapcoords` and the like) must stay green.
