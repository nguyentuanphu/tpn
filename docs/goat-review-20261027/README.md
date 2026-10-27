# Bịt mắt bắt dê review

27 October 2026 AEDT. Replacement implemented on the work branch; not released.

The haystack guessing puzzle is replaced with children taking turns as a virtual blindfolded seeker inside a circle. Listen gives a real animal call plus accessible direction/range cues; guide the seeker with 64px direction buttons and catch only when close. A caught friend becomes the next seeker. Three rounds; no time limit, losing state or physical blindfold requirement. Original SVG child illustrations; English and Vietnamese.

Pure core tests passed5/5 in the helper audit. Browser check passes110s: three rounds completed using visible controls in all six device/language layouts, 64px targets, nearby-only catches and gameplay-plan cleanup. Captures reviewed on phone/tablet/computer in both languages. Additional keyboard/listening review and recorded speech coverage remain pending. New fixed public speech is recorded and verified by run40481288711; the batch is frozen in docs/voice-recording-delta/goat-northern-20261027.json for missing-only Azure/FPT recording. Provider routing, full decode and voice coverage passed; human listening remains pending.
