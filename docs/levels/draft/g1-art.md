### Art and drawing (js/games/drawing.ts, drawing2.ts, crafts.ts)

`js/games/art-pending.ts` holds unregistered proposals (spotdiff, hiddenpic ...): no rows. `js/games/art-pad.ts` registers
no game itself; it is the shared pad that every game in drawing2.ts and crafts.ts runs.

| id | Name (EN / VI) | Under-5 | Easy | Medium | Hard | Talent | Recorded as | Change this round |
|---|---|---|---|---|---|---|---|---|
| dotdot | Dot to Dot / Nối Điểm | 6 dots, 2 pictures, next dot pulses | 8 dots (10 at level 2), 2 pictures | 10 dots (12 at level 3), 2 pictures | 15 dots (20 at level 5), 2 pictures | 20 dots, 3 pictures | data-lv rounds,dots | none |
| trace | Trace the Picture / Tô Theo Nét | 2 pictures, path 30 px wide, cover 85 % | 2 pictures, 26 px, 80 % | 3 pictures, 20 px, 85 % | 3 pictures, 15 px, 90 % | 4 pictures, 12 px, 93 % | lv() + data-lv rounds,tolerance,cover | none |
| mirror | Mirror Painting / Vẽ Đối Xứng | 2 pictures, brush 16, paint 1.5 widths, 3 colours | 2 pictures, brush 13, 1.2 widths, 6 colours | 2 pictures, brush 11, 1.5 widths | 3 pictures, brush 8, 2.2 widths | 3 pictures, brush 6, 3 widths, guide lines hidden | lv() + data-lv rounds,brush,fill,noguide | none |
| colournum | Colour by Number / Tô Màu Theo Số | 1 picture, 3 numbers | 1 picture, 4 numbers | 2 pictures, 5 numbers | 2 pictures, 6 numbers | 3 pictures, 6 numbers | lv() + data-lv rounds,numbers | none |
| lanternart | Decorate a Lantern / Trang Trí Đèn Lồng | paint 2 parts, 0 stickers | 2 parts, 0 stickers | 3 parts, 1 sticker | 4 parts, 2 stickers | 4 parts, 3 stickers | lv() + data-lv parts,stickers | none |
| card | Make a Card / Làm Thiệp | 2 things on the card | 2 things | 3 things | 4 things | 5 things | lv() + data-lv need | none |
| sand | Sand Drawing / Vẽ Trên Cát | 3 drawings, 0.8 widths each, stick 12 | 2 drawings, 0.6 widths, stick 10 | 3, 0.8, stick 8 | 4, 1.2, stick 6 | 5, 1.6, stick 5 | lv() + data-lv rounds,amount,line | none |
| drawpath | Draw the Way / Vẽ Đường Đi | 3 ducklings, 2 rocks, wide gaps (30 px) | 3 ducklings, 3 rocks (4 at level 2), gaps 22 px | 3 ducklings, 4 rocks (5 at level 3) | 3 ducklings, 6 rocks (7 at level 5) | 4 ducklings, 8 rocks, tight gaps (15 px) | data-lv rounds,rocks,tight | none |
| shapedraw | Draw a Shape / Vẽ Hình | 3 shapes, circle and square only | 3 shapes, circle and square only | 4 shapes, circle, triangle, square | 5 shapes, all three | 6 shapes, all three | lv() + data-lv rounds,kinds | none |
| copygrid | Copy the Picture / Vẽ Lại Tranh | 2 pictures, grid 4 x 4, 1 colour | 2 pictures, 4 x 4, 1 colour (2 at level 2) | 2 pictures, 4 x 4 with 2 colours (5 x 5 at level 3) | 2 pictures, 5 x 5, 3 colours | 3 pictures, 5 x 5, 4 colours | data-lv rounds,size,colours | none |
| stamps | Potato Stamps / In Hình | free pad, 12 marks, stamp 14 | free pad, 12 marks, stamp 10 | same | same | same | nothing (art-pad.ts) | exception: free stamping pad, nothing to get right |
| weave | Weave a Mat / Đan Chiếu | free pad, 12 marks, brush 16 | 12 marks, brush 10 | same | same | same | nothing | exception: free painting on a mat, no pattern checked |
| mosaic | Bát Tràng Tiles / Ghép Gốm Bát Tràng | free tile grid 8 across, 12 marks | grid 12 across, 12 marks | same | same | same | nothing | exception: free tile painting, no target |
| nonla | Paint a Nón Lá / Vẽ Nón Lá | free pad, 12 marks, brush 16 | 12 marks, brush 10 | same | same | same | nothing | exception: free painting |
| aodai | Áo Dài Designer / Thiết Kế Áo Dài | free pad, 12 marks, brush 16 | 12 marks, brush 10 | same | same | same | nothing | exception: free painting |
| kitepaint | Design a Kite / Trang Trí Diều | free pad, 12 marks, brush 16 | 12 marks, brush 10 | same | same | same | nothing | exception: free painting |
| shades | Light and Dark Colours / Màu Đậm Màu Nhạt | free pad, 12 marks, brush 16 | 12 marks, brush 10 | same | same | same | nothing | exception: free painting on shaded bands, nothing checked |
| shadowpic | Light and Shadow / Bóng và Hình | free pad, 12 marks, brush 16 | 12 marks, brush 10 | same | same | same | nothing | NOT DONE: says "trace around the shadow" but the code checks nothing; needs art-pad.ts (see note) |
| finishpic | Finish the Picture / Vẽ Nốt Bức Tranh | free pad, 12 marks, brush 16 | 12 marks, brush 10 | same | same | same | nothing | NOT DONE: says "draw the missing side" but the code checks nothing; needs art-pad.ts (see note) |
| scene | Sticker Scene / Dán Tranh Cảnh | free pad, 12 triangle stickers | 12 stickers | same | same | same | nothing | exception: free sticker scene |
| lacquer | Lacquer Painting / Tranh Sơn Mài | free gold brush, 12 marks, brush 16 | 12 marks, brush 10 | same | same | same | nothing | exception: free painting, one colour |
| scratch | Scratch Art / Tranh Cào | free scratch, 12 marks | 12 marks | same | same | same | nothing | exception: free scratching, nothing hidden to find |
| bubblepaint | Bubble Paint / Vẽ Bong Bóng | free rings, 12 marks, ring 14 | 12 marks, ring 10 | same | same | same | nothing | exception: free painting |
| fingerpaint | Finger Painting / Vẽ Bằng Ngón Tay | free pad, 12 marks, brush 16 | 12 marks, brush 10 | same | same | same | nothing | exception: free finger painting |
| weatherpaint | Colour the Weather / Tô Màu Thời Tiết | free pad, 12 marks, brush 16 | 12 marks, brush 10 | same | same | same | nothing | exception: free painting |
| thocam | Brocade Patterns / Hoa Văn Thổ Cẩm | free pad, 12 marks, brush 16 | 12 marks, brush 10 | same | same | same | nothing | exception: free painting, no pattern to copy |
| pixelpic | Pixel Picture / Tranh Ô Vuông | free grid 8 across, 12 squares | grid 12 across, 12 squares | same | same | same | nothing | exception: free square painting, no target picture |
| fireworks | Fireworks Painter / Vẽ Pháo Hoa | free bursts, 12 marks | 12 marks | same | same | same | nothing | exception: free painting |
| masks | Mid-Autumn Masks / Làm Mặt Nạ Trung Thu | free pad, 12 marks, brush 16 | 12 marks, brush 10 | same | same | same | nothing | exception: free painting |
| makeface | Make a Face / Ghép Khuôn Mặt | free pad, 12 marks, brush 16 | 12 marks, brush 10 | same | same | same | nothing | exception: free painting, no face parts to place |
| gallery | My Little Gallery / Phòng Tranh Của Em | free pad, 12 marks, brush 16 | 12 marks, brush 10 | same | same | same | nothing | exception: free painting |
| leafrub | Leaf Rubbings / In Lá | free rubbing, 12 marks | 12 marks | same | same | same | nothing | exception: free rubbing |

Note: the 22 art-pad games run entirely in `js/games/art-pad.ts` (`runArtPad`): the same pad for every level, only "make
12 marks then keep in Album"; under-5s get a thicker brush (16 against 10) and a coarser grid. Nothing is checked, so they
are free pads, and today they write nothing to `data-lv` (the levels check will see an empty signature unless they are on
its exception list). A ready proposal that records each pad's one setting and gives finishpic and shadowpic real levels
(marks needed 12/12/18/24/30, brush 16/10/8/6/5) is in
`/tmp/claude-0/-home-user-tpn/fea01edd-8866-5ac7-ba51-40953cf17065/scratchpad/s1/art-pad-levels-proposal.md`.
