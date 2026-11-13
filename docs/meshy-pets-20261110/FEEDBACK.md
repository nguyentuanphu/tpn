# Owner's feedback on the pets: every item and where it stands

Kept current by every chat working on the pets. Read it before showing the owner anything (owner, 13 Nov 2026 AEDT:
"Đọc lại hết tất cả feedbacks tao gửi đi, gửi nhiều mà sao ko đọc và không sửa là sao vậy"). Each film or picture sent
for approval must have been checked against every open line here, frame by frame, at full size.

## Approval gate (owner, 12 Nov 2026 evening AEDT, relayed by the Release chat 13 Nov)
"Tất cả dân làng và thú đều đa số bị ở mặt, mắt, hốc mắt và mũi ... rất nhiều trường hợp hỏi approve trong khi có nhiều
vấn đề ở mặt cổ và áo etc nên phải nghiêm túc xem sét ... và chỉ đưa bản tốt nhất". Do NOT ask the owner to approve a pet
until all five pass:
1. Our auditor at 0 failing (face: eyes open, shut and every mood; eyes at +-.4 and +-.7, both sides, from above and
   below; muzzle and nose; ears; neck and the head-neck joint; in jump and run), no worse than the round before.
   `audit_pets.mts` now has `lid` (a shut eye paler than the fur round it: the friends' auditor's check) and eye views at
   +-.4 and from above and below.
2. A 1024 px board per pet, every picture looked at full size: face straight, +-.4, +-.7, both sides, from above and
   below, every mood, the neck, the back of the head, the whole body in a few poses.
3. A second reviewer who does not know what was fixed: a subagent (Agent) given only the boards' paths and the check
   list, looking at full size and listing faults. Each fault it finds is fixed or written down with why it is not one.
4. Every fault the owner ever circled (FEEDBACK.md) checked again, one by one, on the new pictures.
5. Only then ask, once for the whole group, with the boards and the list of what was fixed and what is left. If not
   clean, keep working, do not ask.

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

## Gate step 3: second reviewer (subagent, 14 Nov 2026 morning AEDT), boards `D:\WorkSpace\meshy\petsoard\<kind>\`
Verdict: all four NOT clean. It opened 52 of 264 pictures. Each line must be fixed or answered with why it is not a fault.
- All four, shut eyes: the lid still reads as a disc with an edge (kitty paler, panda brown-grey inside the black patch,
  bunny smooth unfurred disc with a grey outline; calf lash specks at the inner corner of the left lid). -> socket fix
  for panda and bunny too; lash specks: `lash_spot`/`lid_out`.
- Calf: sleep front hooves long spikes and the folded legs off the ground; run/sit/beg front hooves flattened long; far
  eye looks open at right.7 while shut (check); cheer-sideL neck stretched (subtle).
- Kitty: surprised-sideL eye sticks out as a flat white disc; beg hind leg a blunt block; white specks on the fur and a
  ragged white belly edge (subtle); shut-sideR lash line broken.
- Panda: white sliver down the edge of the black shoulder; beg front paws in the air, legs tangled; white specks on black
  fur (subtle); eyebrow knob from the side (subtle).
- Bunny: beg bottom narrows to a ragged point with no hind feet; scratch ragged fringe at the rear bottom; side views the
  eye reads as a flat white plate (subtle).
- Picture problems (not model faults): some side/neck views see the back of the head; `pet_board.mts` body cameras to fix.
