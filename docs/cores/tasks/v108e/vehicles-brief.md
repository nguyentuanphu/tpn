# v1.08e vehicles: every vehicle in Blender

Read first: `README.md` (this folder), `docs/cores/tasks/v108b/README.md`, `CLAUDE.md`, `js/modelkit.ts`, `js/vehicles.ts`, `js/traffic.ts`, `js/ferry.ts`, `tools/blender/vehicles.py`.

`tools/blender/vehicles.py` already holds the bicycle, the motorbike and the bus with the friends riding (gallery work). Start from it.

## What to build

1. **List every vehicle** in your status file, ridden or only seen:
   - **Ridden:** bicycle, motorbike, xích lô, electric car, the cart, the buses, the boats and the ferries (`ferry.ts`, the Southern Coast Boat), the sampan of the Mekong.
   - **Seen:** the traffic cars and trucks, trams, trains, the parked vehicles.
2. **Make each one in Blender** (`tools/blender/world-vehicles.py`):
   - Picture-book style, toon look.
   - About 1,500-5,000 triangles.
   - Wheels and pedals as their own parts, so the code can turn them.
   - Named seat points (`seat`, `seat2`, `handleL`, `handleR`, `pedalL`, `pedalR`) for `seatRider` in `js/vehicles.ts`, so the new friends and the code people sit and hold on properly.
3. **Swap them in** with `modelFor`. Traffic cars are many copies: use one InstancedMesh per kind, or the code shape when far.
4. **Keep everything that works today:**
   - fading parked vehicles;
   - drive-off;
   - drop-off on open ground (`flyaudit`, `boats`);
   - the ferry's piers and the riding view (`rideview.ts`).

## Checks

- **Yours:** add `worldvehicles` (`tests/world-vehicles.mts`, at the end of `tests/run.mts`):
  - each vehicle loads;
  - a rider sits on the seat point with hands on the handles;
  - the wheels turn;
  - the fallback shows when blocked.
- **Existing:** `vehicles`, `boats`, `flyaudit`, `traffic` (if present), `perf`, `battery`, `startup`, `boot`, `types`.
- **Screenshots** on phone, tablet and computer, with a friend riding each one.

## Status file

`docs/cores/tasks/v108e/vehicles.md`
