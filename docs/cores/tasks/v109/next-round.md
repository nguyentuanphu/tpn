# v1.09: notes for the next round (Release)

Items the owner or Release set aside during v1.08, to plan into v1.09.

## Characters (from the v1.08e faces rounds, 7 Nov 2026 AEDT)

- **Lumi's skin colour changed (owner, 7 Nov 2026 AEDT).** In the v1.08e round-3 rebuild Lumi's skin reads a different, darker brown than her approved design. Bring it back to her gallery colour (`docs/characters-v108/gallery/`), in the light and the high-detail models and in the films' character kit; check it in the game's own light, not only the studio render. Likely cause: the "skin-shade" form shading baked into the skin corners (js/friend-model.ts, game-hd.py / game-light.py) multiplying her tone down. Compare against the v1.08 friends' shots before the faces work.
- Friends' hair: fewer, bigger, rounder locks for Finn, Sol and Clara (the clumps are still a little angular after thinning; Sol's side locks end in points).
- Hair helper's leftovers: bring the fringe and hairline down to meet the eyes (the eyes moved up about 4% of head height).
- A faint bake smudge remains on Mai's and Lan's skirts.
- Meshy / Tripo test models of Clara and Mai (owner's idea, 6 Nov): to compare with the script-built faces.

## Speed

- `perf` startMB (the uncompressed start) was 2.72 MB against 2.55 (+3% +0.05 leeway = 2.68). work/v108-startmb brings the measured number to about 2.5 mostly by fetching code just after the check's reading; only about 60 KB really leaves the start. The real fix: build three.js (660 KB of the start) from its unminified source so the bundler can drop the parts the game never uses.
