# v1.08e vehicles: status

**ready for Release** (6 Nov 2026, 04:40 AEDT): the remake. The owner saw the first models ("They need to have better refinement, need to have souls and more real, atm looks like ugly toys") and chose "stylised real". Every vehicle and boat is now modelled anew in Blender. Branch `work/v108e-vehicles` (from `origin/integrate/v108`). Brief: `vehicles-brief.md`.

## Every vehicle (ridden or seen)

All 28 code vehicles of `js/vehicles.ts` (`VEHICLES`) and the two boats of `js/ferry.ts` have a Blender model in
`models/world/`:

| Model | Code shape | Where a child meets it | Ridden |
|---|---|---|---|
| `veh-honda67`, `veh-cub`, `veh-dream`, `veh-scooter` | Vietnamese motorbikes | traffic (`js/traffic.ts`) | seen (riders on them) |
| `veh-xichlo` | xích lô | traffic, the fare ride | passenger |
| `veh-baGac` | xe ba gác máy | traffic | seen |
| `veh-postie`, `veh-trailBike`, `veh-quadBike` | Australian motorbikes | traffic, the farm | seen |
| `veh-roadster`, `veh-miniBike`, `veh-roadBike`, `veh-bmx`, `veh-kidsBike`, `veh-packBike` | bicycles | bike spots, traffic | ridden |
| `veh-sedan`, `veh-taxi`, `veh-ute`, `veh-suv`, `veh-tamTruck` | cars, cậu Tâm's truck | traffic, parked | ridden (drive) |
| `veh-bus`, `veh-busAU`, `veh-coach` | buses, the coach | traffic, the Huệ Nghi yard | fare rides |
| `veh-tram`, `veh-tramModern` | trams | traffic | fare rides |
| `veh-touristCart` | the Hồ Gươm electric cart | traffic | fare rides |
| `veh-dumpTruck`, `veh-excavator` | the Huệ Nghi yard | the yard story | the story drives them |
| `boat-ferry` | the Mirror Lake ferry and the harbour ferry (Southern Coast Boat) | `js/ferry.ts` | ridden |
| `boat-raft` | the bamboo rafts (river crossings, the river line, the Mekong) | `js/ferry.ts` | ridden |

Not remade: the lotus pond's teal bicycle (`js/lotus.ts`, its own colour) and any vehicle in the older children's
real look keep their code shapes (see "Assumed").

## How they are made (the remake)

1. `tools/vehicle-blueprints.mts`: the frame from the game's code shapes: each wheel's hub and size, the seat, handle
   and pedal points, the moving parts' pivots and the overall box. Nothing of the code shapes' look is reused.
2. `tools/blender/world-vehicles.py` (Blender 4.2.3) models each vehicle anew inside that frame:
   - cars, buses, trams, the coach and the truck cab: bodies lofted from cross-sections and smoothed, with wheel arches,
     tinted glass in the window openings (crisp edges), lamps with chrome bowls and lenses, grilles, bumpers, mirrors,
     door handles, wipers, plates, seats, dashboards and steering wheels inside, a dark lining behind bus windows;
   - motorbikes: teardrop tanks, leg shields, finned engines, upswept exhausts, forks with gaiters, rear shocks with
     springs, chrome mudguards, mirrors, levers and grips, spoked wheels with drums;
   - bicycles: thin tubes, forks, saddles with springs, chainrings, chains, cranks and pedals, mudguards, racks,
     wicker baskets, lamps and bells, training wheels;
   - tyres with rounded shoulders, alloy rims with arms and caps, knobbly tyres on the farm machines;
   - the ferry's curved hull, cabin with windows, funnel, rails, benches and life ring; the raft's jointed bamboo.
   Wheels and moving parts are their own nodes; the named points stay. Soft shadows (Cycles ambient occlusion) are
   baked into the corner colours. Thinning keeps every edge between two colours or kinds in place.
3. gltfpack 0.20 (meshopt). `tools/make-world-vehicles.mts` runs all three.

Sizes: 33-93 KB each (2.0 MB for all 30). Triangles: bicycles and motorbikes 4,100-6,900, cars 7,700, buses and
trams 10,200-13,000, boats 4,200-5,500.

Fit to the game's box (Blender prints it): bikes and cars within 5 cm (the ute, SUV and Tâm's truck within 13 cm);
buses, trams, coach and truck stand out 25-27 cm only by their mirrors on arms and roof units; on the ground within
2 cm everywhere.

## In the game

- `js/vehicles.ts`: `build()` gathers everything that does not move into one group, `codeBody`. `wear(v)` asks the kit
  (`modelFor`) to swap the model in when a child first comes within 70 m; `fitModel` hides the code body, puts each
  model wheel (and moving part) inside its code wheel, so it turns as the code turns it, and reads the named points
  into the vehicle's seat, grips and feet. Each surface kind gets its look: glossy paint, matte rubber and seats,
  shiny chrome (the scene's reflections), see-through tinted glass; no ink outline (stylised real).
- `js/traffic.ts` (every traffic, parked and rideable vehicle), `js/yard.ts` (coach, dump truck, excavator),
  `js/ferry.ts` (each boat's hull; the signs, flag, lantern and the raft's fading roof stay the code's).
- The code shape stays until the model has arrived and for good when it cannot load.
- The fitting itself is in `js/vehicle-models.ts`, loaded after the start (not in the first download); `sw.ts` lists it
  and all 30 models in its FILES list for offline (no apostrophes).
- No change to the kit (`js/modelkit.ts`). `js/ferry.ts`: `ferryBoat` and `bambooRaft` are now exported (for the
  blueprints).

## Owner's decisions

- 6 Nov 2026 AEDT (pop-ups): the remake is **stylised real**: real shapes and proportions, smooth curved panels, shiny
  paint, chrome, rubber tyres, see-through glass, lights and small details, like an animated film, still fitting the
  valley. **All at once**: every vehicle and boat remade, then shown together.

## Assumed (owner can change)

- Models only in the toy look (the friends' picture-book look). The older children's real look (painted metal and
  chrome, owner round R) keeps its code shapes, and so does a vehicle built in its own colours (the lotus pond's bike).
- The pedals are not turned (the riders' feet rest on them); `pedalL/R` are named points.

## Checks (remake, 6 Nov 2026 AEDT, one at a time)

| Check | Result |
|---|---|
| `worldvehicles` | pass: 28 models in place (size within 30 cm, ground within 2 cm), 96/96 wheels on their hubs and turning, riders seated on the model's points, 85 traffic vehicles and 5 boats swapped, blocked models keep the code shape |
| `vehicles` | pass |
| `types` | pass |
| `perf` | pass: village 335 draws (was 291; limit 420), home 175; 684k triangles (was 605k; noted, not a gate) |
| `battery` | pass |
| `boot` | pass |
| before the remake: `flyaudit`, `startup`, `offline`, `swupdate` | pass (the remake changed no code they run except the look) |
| `boats` | fails the same on `origin/integrate/v108` (Season 2 harbour ferry), not from this work |

## Screenshots

`docs/world-models-v108e/vehicles/`: `phone-`, `tablet-`, `computer-` `before.png` (code shapes) and `after.png` (the
remake), every vehicle with a friend riding; close-ups: `closeup-motorbikes.png`, `closeup-bicycles.png`,
`closeup-cars.png`, `closeup-big.png`, `closeup-boats.png`.

Seen in both before and after (not from this work): in the car, taxi and tourist cart the friend's hair comes through
the roof (`seatRider` sinks the code avatar under the roof, but not all of a friend's model).

## Progress

- 6 Nov 2026 02:10 AEDT: part 1 pushed: blueprints, Blender script, 30 models, swap-in in traffic, yard and ferries.
- 6 Nov 2026 02:50 AEDT: check `worldvehicles`, fitting moved to `js/vehicle-models.ts`, screenshots, ready for Release.
- 6 Nov 2026 03:20 AEDT: merged `origin/integrate/v108`; the 30 models added to the `sw.ts` FILES list; `offline`, `swupdate`, `worldvehicles` pass.
- 6 Nov 2026 04:40 AEDT: the remake (stylised real) pushed, checks pass, ready for Release.
