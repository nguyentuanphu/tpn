# Independent blind visual review — candidate 72

**Verdict: REJECT.** The candidate has harsh closed-eye strokes and broken mouth/tongue contours. These are distinct from the accepted faceted, textured body/ears/muzzle style.

## Coverage and independence

Inspected **242/242 unique candidate PNGs**, each opened directly using `view_image` from `/workspace/cow-fit/r17-dev72/native-full` at original 1024×1024 size. No contact sheets, resized substitutes, or crops were used. PNG headers confirm all originals are 1024×1024. Coverage matches `views.json`: 11 moods × 11 angles × 2 LODs. The JSON companion contains every actual inspected filename and batch observations.

One initial tool output discarded `cow-near-sad-right.png`; I reopened it successfully in a separate call and inspected it before counting it. I also reopened `cow-near-cheer-below.png`, `cow-near-surprised-front.png`, and `cow-far-wag-below.png` to confirm mouth defects after completing all242.

I read only the supplied image directories, permitted `views.json`, PNG dimension headers, and my own review checkpoint. No source, implementation metadata, docs, logs, tests, change history, previous reports, or parent review were consulted. No browser, Blender, paid/API/network calls were used. Findings describe visible results, not inferred implementation.

Six fullsize style references were inspected in `/workspace/cow-fit/blind-comparison/A`: `cow-near-cheer-front.png`, `cow-near-cheer-m07.png`, `cow-near-sad-front.png`, `cow-near-sleep-p07.png`, `cow-far-cheer-p07.png`, and `cow-far-sleep-front.png`.

## 1. Harsh closed-eye strokes — reject

The stroke on the black face patch is a flat light beige ribbon; the opposite stroke is solid black. Their hard contours, abrupt ends, and angular bends in oblique/profile views look pasted onto the textured face. Brows and surrounding fur have softer, textured finishes. The beige stroke is especially conspicuous compared with the dark brown stroke in the accepted reference.

Exact frontal examples, covering every affected mood and both LODs:

- `cow-near-blink-front.png`, `cow-far-blink-front.png`
- `cow-near-cheer-front.png`, `cow-far-cheer-front.png`
- `cow-near-sleep-front.png`, `cow-far-sleep-front.png`
- `cow-near-wag-front.png`, `cow-far-wag-front.png`

Exact oblique/profile examples:

- `cow-near-cheer-p07.png`, `cow-far-cheer-p07.png`
- `cow-near-sleep-p07.png`, `cow-far-sleep-p07.png`
- `cow-near-blink-neck.png`, `cow-far-blink-neck.png`
- `cow-near-wag-right.png`, `cow-far-wag-right.png`

The same treatment recurs in exposed-eye angles of blink, cheer, sleep, and wag. Back views do not expose the eyes; some below views hide them behind the muzzle. Direct comparison of candidate/reference `cow-near-sleep-p07.png` and `cow-far-cheer-p07.png` makes the finish/color difference clear. This is a facial graphic problem, not an objection to the accepted facets.

**Concrete fix:** soften and taper the eyelid strokes to match the textured brows/reference, eliminate abrupt ribbon ends and profile kinks, and resolve the pale beige stroke on the black patch so the eyelid feels integrated. Maintain readability and a consistent finish across these four moods and both LODs.

## 2. Broken mouth/tongue contours — reject

The flat cartoon mouth concept is already in the reference. The defects are the notches and intrusions interrupting it:

| Exact filename | Visible defect |
| --- | --- |
| `cow-near-cheer-below.png` | Peach V-shaped notch bites into the top center of the dark opening; tiny peach intrusion also interrupts the right tongue corner. |
| `cow-near-jump-below.png` | Similar upper-mouth notch and peach wedge at the right tongue edge. |
| `cow-near-surprised-front.png` | Distinct peach triangular notch interrupts the upper dark mouth boundary, visible from the front. |
| `cow-far-cheer-below.png` | Tiny pale jagged fleck inside the dark opening immediately above the left tongue edge. |
| `cow-far-jump-below.png` | Repeated pale fleck inside the dark opening above the left tongue edge. |
| `cow-far-run-below.png` | Pale fleck intrudes at the left mouth/tongue boundary. |
| `cow-far-surprised-below.png` | Peach rectangular notch cuts the right pink tongue edge; small pale mouth speck also visible. |
| `cow-far-wag-below.png` | Clearly visible peach notch cuts the right tongue edge; small pale speck above the tongue. |

These are small fullsize defects, not large holes. The near cheer/jump upper notches, near surprised frontal notch, and far wag tongue notch are the clearest reproductions. Severity varies by angle and LOD: `cow-near-run-below.png`, `cow-near-surprised-below.png`, and `cow-near-wag-below.png` have cleaner contours than their far equivalents. The reference set has no matching below views, so I cannot establish that every mouth defect is newly introduced. They remain visible defects in this candidate.

**Concrete fix:** preserve continuous dark mouth and pink tongue silhouettes wherever exposed. Remove muzzle-colored incursions and isolated pale flecks. Recheck small and enlarged openings across the listed moods from below and front, at both LODs. Preserve the accepted textured muzzle.

## 3. Residual eye-surround joins — observation, not independently established regression

The closed-eye region still reads as a separate oval pad in `cow-near-blink-m04.png`, `cow-near-cheer-m07.png`, `cow-near-sleep-left.png`, and `cow-near-wag-left.png`. A gray lower rim and angular pale inner/lower wedge distinguish it from the cheek. Corresponding far views expose a coarser boundary. However, accepted references already contain oval closed-eye patches and lower-eye wedges, including open-eyed sad. This is a residual visible join, **not a proven new regression or an independent reason to reject the inherited art style**. If revisiting eyelids, blend the perimeter while retaining texture.

## Inherited style and other inspected areas

The far LOD's triangular fur strips, faceted ear interiors/horns, and broad muzzle color planes resemble the accepted far reference. Near ear facets and muzzle/neck patch boundaries also occur in the reference. I did not reject those simply for being faceted.

Sleep exposes heavily folded lower-body surfaces. Similar folding is visible at the lower edge of accepted `cow-far-sleep-front.png`; the available stills do not establish a new body regression there.

All profile, above, below, neck, and back views were inspected for every mood and both LODs. I found no definite background-through hole, isolated floating component, detached head/neck, or clearly severed limb in frame. Open eyes generally remain readable and attached; nostrils retain their shape. Many images crop limbs/torso, so this does not certify anatomy outside the frame, unseen surfaces, or animation continuity between stills.

Approval should wait for the closed-eye treatment and listed mouth contour defects to be corrected and rechecked at original size.
