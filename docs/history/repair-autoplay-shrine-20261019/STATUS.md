# Counting-shrine planner footprint

r88 work-in-progress on work/bugs-typescript-20261019, paused at the owner's request on 20 October 2026 AEDT. Not deployment-ready.

The baseline found 16 positions near the reported approach that goodSpot accepted but actual child collisions displaced by up to 35 cm. After an unchanged rename and zero-error typing of solids.js, an exact circle/cell footprint query was added to goodSpot/clearSpot. Existing physical collision resolution and map geometry are unchanged.

The focused check passes in 79 s: no sampled footprint mismatches; autoplay starts outside the interaction range and wins through legal answers. Its trail uses the existing flight fallback, then walking. This result does not prove a complete walking route or clear the original whole-autoplay failure. That unchanged regression has not been rerun since the repair.

Before/after JSON, images and the final check output are in evidence/. See the [pause handoff](../../cores/tasks/r88-paused-handoff-20261019.md) for the complete pending list.
