# Owner corrections — 7 November 2026, Sydney

## Clara

Current sheet: [Clara turnaround](reference-images/01-clara/turnaround.png). Both long braids hang in front of the shoulders. The back view shows the back of the head and nape, with no braid hanging down the back. Preserve the face, outfit, colours and overall relaxed pose.

The historical generated style anchor remains unchanged to preserve the source used for the original roster. For future Clara braid placement and 3D fitting, use the corrected current turnaround, not the historical anchor's rear braid geometry.

## Coastal grandmother (regional 74)

Current sheet: [Coastal grandmother turnaround](../meshy-regional-40-100/reference-images/074-coastal-grandma/turnaround.png). Kaftan sleeves now end above the elbows, with visible grey-background clearance between arms and body in front, profile and back. The continuous kaftan side, floral design/colours, hem/tassels, face and accessories are retained. The profile arm was adjusted minimally within the relaxed pose to make the clearance visible.

The first generated edit introduced an unwanted large side slit and was rejected. That attempt and both prior sheets are retained for provenance; they are not production inputs. Final owner approval is still pending.

## Derived files and validation

All six affected view crops were regenerated, hashes and a separate current-reference draft specification refreshed, and both galleries rebuilt. Source images and exact edit prompts are saved in each affected folder's generation.json. Overall inventory remains 104 sheets / 311 separate views; this correction made no additional Meshy jobs, spending, new GLBs or deployment. Concurrent work through 48a4fdca8 contains the existing Clara pilot/revision/remesh/rig and 70-credit ledger; those records were preserved.

## Short next-chat prompt

Continue on meshy-production-20261107. Read docs/CHARACTER-PRODUCTION-TAKEOVER.md and docs/meshy-production-20261107/OWNER-CORRECTIONS-20261107.md. Preserve the corrected Clara braids (front of shoulders, none down the back) and regional-074 coastal grandmother's short sleeves/clear arm gaps. Use the current sheets/crops and refreshed manifest/job hashes; historical attempts are not production inputs. Preserve the existing Clara pilot/revision/remesh/rig records and 70-credit ledger; resume from CLARA-PILOT.md after verifying the live journal. Do not resubmit completed tasks.

## Submitted job history is immutable

The incoming pilot work already submitted the OLD Clara images. job-specifications/01-clara.json and 01-clara-r2.json retain those original submitted hashes. Current corrected images are recorded in 01-clara-current-reference.json, an unsubmitted draft requiring separate authorization; no new paid revision is implied. A hash mismatch against an old submitted specification is expected after this image correction and must not be bypassed by resetting its task ID.

Do not rerun build_reference_pack.py until it preserves submitted specifications: its original writer would overwrite submitted metadata. This history-protection improvement remains a handoff task. The galleries already point to the corrected images and require no rebuild.
