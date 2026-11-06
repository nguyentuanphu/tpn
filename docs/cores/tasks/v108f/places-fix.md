# v1.08f places-fix: status

**ready for Release** (6 Nov 2026, 2:17 pm AEDT). Branch `work/v108f-places-fix` (from `origin/integrate/v108`). Brief: `places-fix-brief.md`.

## What changed

### 1. Name signs in front of the models

- **How the problem was found:** a browser probe looked straight at the readable face of every name sign and board (195 of them) with the code shapes and again with the Blender models. Two signs were newly covered by a model:
  - **Ben Thanh market** (`lm-benthanh`): the model's south gate is 0.7 m deep and 5 m tall, so the "BẾN THÀNH MARKET" sign (4.8-5.6 m up, 5 m wide, 5 cm in front of the code shape's wall) was inside it, under the gate's cornice and pediment.
  - **The Big Banana** (`lm-banana`): the model's striped awning sat over the "THE BIG BANANA" sign (2.5-3.3 m up on the front wall).
- **The fix: room cut in the model, the signs stay exactly where they were** (`tools/blender/world-places.py`):
  - Ben Thanh: the gate stays deep only up to the arches' top (4.7 m); above it a shallow frieze set back behind the sign; the cornice is lifted over the sign and the pediment made low, so the clock above stays whole.
  - The Big Banana: the windows are a little lower and the awning sits under the sign.
- **Every other landmark, shop and stall sign checked:** no other model covers its sign.
  - The Aussie Corner shop signs (`js/regions.ts` `shop()`) had their top edge behind the shop's cornice, in the code shape and the model alike. Moved 17 cm forward, just in front of the cornice (front + 0.22 m instead of + 0.05 m).
  - Not changed (not a model's doing, for the roads owner): the Aussie Corner welcome sign beside the road (`welcomeSign` in `js/roads.ts`) stands half inside the milk bar's front, and the shop's awning pokes into it, with the code shape too.
- **New in `worldplaces`** (`tests/world-places.mts`): every name sign or board on a model still shows. Nothing of a model may stand in the 1.5 m just in front of a sign's readable face, unless the code shape already did (a layout matter). It fails on the v1.08e Ben Thanh model (checked) and passes now.

### 2. The Season 2 Australia landmarks (`js/s2au-region.ts`)

- **Why they had no models:** `tools/blender/places-dump.mts` placed the regions at `R.at`, which does not exist (a region sits at its place's anchor, as `js/s2au.ts` does), so they were never built in the dump. Fixed; `tools/blender/places-spec.json` now has `lm-s2au-gbr`, `lm-s2au-tas` and `lm-s2au-perth` (the other 102 entries are unchanged).
- **Drawn by hand, in the places' picture-book style** (`hand_s2au_*` in `tools/blender/world-places.py`), each in its code shape's footprint and height, colliders unchanged:
  - **The Great Barrier Reef pontoon** (5,078 triangles, 50 KB): the white floating deck on blue floats, the teal shade roof with a scalloped edge, the round underwater viewing cabin, rails, the yellow snorkel steps into the sea, life rings, sun loungers, a dive flag and a curly water slide.
  - **Cradle Mountain** (4,804 triangles, 68 KB): the grey-green massif with its jagged crown of fluted dolerite columns, highest in the middle, snow on the tops and in the hollows, buttongrass, scree and pencil pines.
  - **The Rottnest (Wadjemup) lighthouse** (3,466 triangles, 26 KB): the tall white tower with its red band and small windows, the black-railed gallery, the lantern room and red dome, and the keeper's limestone cottage with a red roof and a verandah.
  - Made with `node tools/make-places.mts lm-s2au-gbr lm-s2au-tas lm-s2au-perth` (Blender 4.2.3, gltfpack). Loaded near the child like the others; not on the install list.
- `worldplaces` now builds the three regions and checks their models like every other one (on the ground, size, facing, footprint, one draw).

### 3. A fix found on the way: the clothes stall

- `js/shop.ts`: the clothes stall's own updater switched its code shape back on every frame, so it was drawn over its Blender model (`worldplaces` failed on it now and then: "st-clothes: the code shape is still drawn"). Now, once the model is in, the model shows and hides with the shop and the code shape stays hidden.

### 4. Pictures

Before and after on phone, tablet and computer, in `docs/world-models-v108e/places/` (made by `tests/places-fix-shots.mts`):
- `benthanh-sign-*` and `banana-sign-*`: before = the v1.08e model covering the sign, after = the fixed model.
- `s2au-gbr-*`, `s2au-tas-*`, `s2au-perth-*`: before = the code shape, after = the Blender model.
- The v1.08e `benthanh-*` and `banana-*` pictures are left as they were.

## Checks

Run one at a time (`cd tests && node suite.mts --jobs 1 --only <name>`), 6 Nov 2026 AEDT, on commit `7a116f463` plus this status note. All pass:
- `types`, `boot`;
- `solid` (it failed on `sing4` on `origin/integrate/v108` before this work: it passes now);
- `worldplacement`, `flyaudit`;
- `s2au` (3 regions);
- `worldplaces` (105 models, the three Season 2 Australia ones included, and the new sign check);
- `perf`: village 288 draws, 645k triangles; home 163 draws;
- `battery`;
- `startup`: first start 1046 KB, second start 0 KB from the network.

The full suite is Release's.

## Owner's decisions / assumed

- Assumed (owner can change): the signs stay where they were; the models make room for them (the brief allowed either).
