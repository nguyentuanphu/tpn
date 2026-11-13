# Owner's feedback on the pets: every item and where it stands

Kept current by every chat working on the pets. Read it before showing the owner anything (owner, 13 Nov 2026 AEDT:
"Đọc lại hết tất cả feedbacks tao gửi đi, gửi nhiều mà sao ko đọc và không sửa là sao vậy"). Each film or picture sent
for approval must have been checked against every open line here, frame by frame, at full size.

| # | When (AEDT) | Owner's words | Pets | What it means | Status |
|---|---|---|---|---|---|
| 1 | 13 Nov early | "Kiểm tra kỹ khi chạy nhảy và các kiểu chưa" | all | look at every move in motion, not only stills | films of every move (`pet_film.mts`) |
| 2 | 13 Nov morning | "tất cả con vật khi nhảy đều nhìn quá cứng" | all | the jump is stiff | jump rebuilt from key poses with squash and follow-through |
| 3 | 13 Nov morning | "Nhảy vẫn cứng, kiểm tra lại bước nhảy đứng, cổ và chân khi đang chạy và khi gãi" | all | standing hop stiff; neck and legs in run and scratch | hop rebuilt (`hop_spring`); run head bob a beat behind; checked in `film26` (open): run neck and legs fine for all four |
| 4 | 13 Nov late morning | "chân có vấn đề khi nhảy và khi chạy nó bị nhọn ... chuyển mấy con này ra chỗ nào trống hơn, vướng cái ruộng" | all | pointed feet in jump and run; film in an open place | feet kept level (`legs(..., cap, bp)`); ONLY the four near views were moved to open grass, the game and far views stayed on the farm plots: fixed 13 Nov evening: all six views on open grass (`film26`) |
| 5 | 13 Nov | "Sao nhiều vết trắng và dưới bàn chân có lỏm vào" (panda pictures: black fur, feet, chin) | panda | white specks on black fur; dented feet and chin when begging | `repack` (fur clean); `sit_fold` 0.6 (feet); chin and feet looked at in `film26`: whole |
| 6 | 13 Nov afternoon | "Thỏ oke, nhưng khi nhảy bằng 4 chân nhìn hơi cứng" | bunny | four-leg jump stiff | `jump_spring` 0.8 |
| 7 | 13 Nov afternoon | "Bê mèo thỏ nhảy tại chỗ còn cứng quá, mấy con này có vấn đề ở chân như hình vẽ" (kitty beg: neck and hind legs; kitty dig: hind leg; calf sit: hind hooves; calf run: hooves) | calf, kitty, bunny | standing hop stiff; legs wrong where circled | hop springier; sit, beg, dig lower hind leg flat; kitty `sit_fold` 0.6; kitty beg: lower sit, head bent less (`beg_pitch` -0.65): neck no longer creased, hind paws on the ground (`film26`); calf begs with its front hooves down (`beg_paws_down`: raised, they hung as points) |
| 8 | 13 Nov evening | "Chân bị nhọn khi gãi" | calf (and all) | pointed feet in the scratch | calf scratch replaced by a flank nuzzle (`nuzzle_scratch`); kitty's paw reaches forward (`scratch_knee` 0.6, still a little bunched under the belly); panda, bunny fine (`film26`) |
| 9 | 13 Nov evening | "Chuyển mấy con thú này sang chỗ nào trống mà chụp ... Đọc lại hết tất cả feedbacks" | all | film everything in an open place; re-read all feedback | this file; all six views in the open; films `D:\WorkSpace\meshy\pets\film26\` |

Older (10-12 Nov): see PLAN.md "Owner's decisions" (puppy, dragon, firefly approved; skills; calf name "Bê con").

## Still open (13 Nov 2026 evening)
- Mid-blink or turning to happy eyes, for a frame or two the shut lid shows as a ring round the eye (panda, calf, kitty).
- Kitty scratch: the lifted hind paw stays a little bunched under the belly.
- Full audits (`make_animal.ps1` without `-Quick`) not run since these changes; no pet approved yet.
