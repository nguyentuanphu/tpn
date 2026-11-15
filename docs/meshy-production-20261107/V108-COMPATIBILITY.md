# What v1.08 already supports

Source reviewed: integrate/v108 d51e062e5894a2229bd62e7b429dec87a9787a8f. Release branch release/v1.08 was3185da1b179f8f732000c0657745e2258d77936b. Main was still v1.07 at4ee7d95f6019b4e24a063178f190af8af9ec7bbc. No deployment inference from a development branch.

## People

The current four friend IDs are clara, finn, sol, lumi. `js/friend-model.ts` already loads GLB through GLTFLoader, meshopt decoding and skeleton cloning. A model follows the existing code avatar's poses; it is not sufficient to ship an arbitrary rigged Meshy export.

Joint names copied by the runtime: torso, head, armL, elbowL, armR, elbowR, legL, kneeL, legR, kneeR. Inspected Clara GLB also has root. Rest transforms, bind pose and skin weights must be fitted to the runtime contract. Preserve dressing/attachment behaviour, riding grips, skin recolouring, facial animation, private photo behaviour and save compatibility.

Current materials include skin-shade/skin-grip conventions; the face3d path detects blink in its morph target dictionary. The current avatar's named mood set includes smile, blink, happy, o, curious, sad, shy, half, lookL, lookR, excited and sleep. Do not hard-code the plan's older nine-mood assumption without checking the actual fitter/export/runtime correspondence.

The light/HD workflows are tools/make-friends.mts and tools/blender/game-light.py/game-hd.py, with per-part triangle budgets and meshopt export. Existing Clara samples inspected: light146,448bytes, HD241,724bytes; each has one skin, six meshes and seven animation clips. Both sampled GLBs have zero texture objects. Texture requests to Meshy do not automatically establish the final game material pipeline.

## Animals and companions

v1.08 **already has** a Blender creature runtime: js/modelkit.ts and js/creatures.ts, procedural fallback models, delayed/proximity loading, AnimationMixer clips and head-look behaviour. The generated manifest lists24creature kinds, including pets, farm/wild animals and the firefly/dragon.

An arbitrary Meshy-animal fitting/retarget script is a separate unfinished capability. The existing world-creatures.py constructs its own geometry/rig; its presence does not mean any generated quadruped can be dropped into place. Follow the owner's puppy-first pilot before converting the rest.

The inspected puppy GLB has one mesh/skin and clips cheer, follow, idle, sad, sleep, surprised, wag, walk;108,792bytes. Companions use the supported fly/flap and mood behaviour. Match each actual species' rig and clips rather than assuming quadruped motion for birds, the joey, bear, dragon, turtle or firefly.

## Crowd and villagers

Existing targets are models/villager-<id>.glb. Named villagers and nearby crowd have their own attachment/loading policy; crowd limits are not permission to load every generated asset at startup. Preserve those controls and existing fallbacks.

## Missing external inputs and plan assumptions

- clara/clara-young-2.webp is absent from repository and attachments.
- clara/scripts/fit2.py is also not tracked in this repository. The plan refers to an external Clara fitting workflow; obtain or recreate it against the current contracts before conversion.
- D:\\WorkSpace\\meshy is the owner's Windows location, not a directory available in this Linux environment. Choose a durable raw-asset staging location before paid production; do not overwrite runtime models with raw output.
- Meshy7.1/6Lite pricing, model availability, multi-image API payloads, private settings and web retry entitlements are owner-plan claims pending current official/account verification. The old script's latest/single-image defaults do not enforce them.

This is source and GLB-metadata inspection, not a fresh rendered/physical-device performance certification.
