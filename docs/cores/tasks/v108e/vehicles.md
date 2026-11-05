# v1.08e vehicles: status

**In progress** (6 Nov 2026, 02:10 AEDT). Branch `work/v108e-vehicles` (from `origin/integrate/v108`). Brief: `vehicles-brief.md`.

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

## How they are made

1. `tools/vehicle-blueprints.mts`: the game's own code shapes, read in a browser and written as parts (triangles,
   corner colours, each moving part's pivot). So every model has exactly the size, place and facing of its code shape.
2. `tools/blender/world-vehicles.py` (Blender 4.2.3): welds and smooths each part, thins it to its budget (body about
   2,600, a bus or tram 3,200, each wheel 130-380), bakes soft shading into the corner colours (Cycles ambient
   occlusion), adds the named points (`seat`, `seat2`, `handleL`, `handleR`, `pedalL`, `pedalR`, `handle2L/R`,
   `pedal2L/R`, `wheelAt`) and writes the parts that move as their own nodes (`wheel0..n`, `bed`, `turn`, `boom`, `arm`,
   `bucket`).
3. gltfpack 0.20 (meshopt). `tools/make-world-vehicles.mts` runs all three.

Sizes: 7-48 KB each, 3,200-4,800 triangles (the boats and the excavator less).

## In the game

- `js/vehicles.ts`: `build()` gathers everything that does not move into one group, `codeBody`. `wear(v)` asks the kit
  (`modelFor`) to swap the model in when a child first comes within 70 m; `fitModel` hides the code body, puts each
  model wheel (and moving part) inside its code wheel, so it turns as the code turns it, and reads the named points
  into the vehicle's seat, grips and feet.
- `js/traffic.ts` (every traffic, parked and rideable vehicle), `js/yard.ts` (coach, dump truck, excavator),
  `js/ferry.ts` (each boat's hull; the signs, flag, lantern and the raft's fading roof stay the code's).
- The code shape stays until the model has arrived and for good when it cannot load.
- No change to the kit (`js/modelkit.ts`).

## Assumed (owner can change)

- Models only in the toy look (the friends' picture-book look). The older children's real look (painted metal and
  chrome, owner round R) keeps its code shapes, and so does a vehicle built in its own colours (the lotus pond's bike).
- The pedals are not turned (the riders' feet rest on them); `pedalL/R` are named points.

## Progress

- 6 Nov 2026 02:10 AEDT: part 1 pushed: blueprints, Blender script, 30 models, swap-in in traffic, yard and ferries.
