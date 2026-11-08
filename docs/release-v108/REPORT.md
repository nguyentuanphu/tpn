# v1.08 release report (Release, 7 Nov 2026 AEDT)

Branch `release/v1.08` (pull request #807), head `48c8f6fd7`. Not on `main` until the owner's "yes, deploy".
The version number is the owner's choice (asked by pop-up).

## Tiếng Việt

### Có gì mới trong v1.08
- **Trò chơi và bài học:** 8 trò tiếng Anh và chế độ tiếng Anh trong góc Tiếng Anh; 7 trò toán mở lại và 21 trò toán
  mới; 11 trò về tiền; 12 thí nghiệm khoa học; 10 trò Tiếng Việt; Hành trình học trong tab Học vui.
- **Màn hình Simple:** mọi trò Vui chơi đều hiện; Thung lũng lên hàng trên; trò chia vào hai nút Học vui và Vui chơi.
- **Bạn đồng hành:** chip mục tiêu xu, 4 mũ mới, tab "Bạn đồng hành" trong Ba lô.
- **Nhân vật:** gối và khuỷu tay, dáng mềm, thở, chớp mắt; khuôn mặt mới (mắt tròn mở to vui, hai đốm sáng, lông mày
  cong vui, miệng chữ U to với khoé ngang như chủ nhà chọn); mắt dân làng to hơn 10%; tóc có lọn cho các bạn.
  Ảnh: `docs/world-models-v108e/faces/round3/final/`.
- **Thế giới bằng Blender:** đồ trang trí lễ hội, đạo cụ truyện và đường phố, xe hàng rong, sinh vật (rồng, chim, đàn
  chim), dân làng; 38 phim Blender (render trên máy của chủ nhà).
- **Thông báo cho phụ huynh** (bật khi có khoá VAPID, bước của chủ nhà).
- **Sửa lỗi:** máy tính bảng bị đứng (#780, #781), đồ lễ hội trong nước (#797), và các lỗi trong
  `docs/cores/tasks/v108/bugs.md`.

### Các vòng sửa trước khi phát hành (6-7 Nov)
- Bảng nút: nút của trò giữ 64 px; bàn cờ ngựa đứng yên; cửa sổ phiêu lưu vừa điện thoại.
- Thế giới: ga Flinders không chắn đường; đàn chim không bay trên đường; lục bình tránh tuyến đò.
- Giọng đọc: danh sách giọng theo ngôn ngữ giữ bản Opus nhẹ; 55 "câu" giả (hình ảnh) bị bỏ; giọng lễ hội tải sau
  giọng của nơi bé đang đứng; ghi âm thêm "From China / Từ Trung Quốc", "From India / Từ Ấn Độ".
- Điện thoại nằm ngang: các trò Úc, Một Ngày Ở Biển, Trồng nụ trồng hoa, Cùng Giúp Trong Truyện, Đếm lửa Cầu Rồng,
  màn Hướng dẫn đều vừa một màn hình; nút truyện chữ 16 px.
- Nhẹ máy hơn: thung lũng nghỉ vẽ khi mở truyện hoặc hướng dẫn; dân làng ở xa dùng bản 15.000 tam giác.
- GitHub đổi máy sang Ubuntu 26.04 (Playwright chưa chạy được): các workflow có trình duyệt chạy trên Ubuntu 24.04.

### Kiểm tra
- Full suite trên GitHub (16 máy): xem phần "Results" bên dưới.
- Kiểm tra tốc độ trên máy Release: perf đạt (khởi động 2,4 MB), battery đạt; startup: lần tải đầu 1015 KB (đạt,
  giới hạn 1025), thời gian sẵn sàng 21,6 s trên máy chậm này (v1.07 là 24-25 s trên cùng máy).
- Ảnh điện thoại, máy tính bảng, máy tính: `docs/release-v108/screens/`.

### Cho v1.09 (`docs/cores/tasks/v109/next-round.md`)
Màu da Lumi; tóc các bạn (ít lọn hơn, lọn to hơn); các kiểm tra chập chờn; phương án iPhone (vỏ App Store) và
Netlify/Cloudflare R2 cho giọng đọc và phim.

## English

v1.08 adds the English corner's English mode and 8 English games, 28 maths games, 11 money games, 12 science
experiments, 10 Tiếng Việt games, the learning journeys, the Simple screen with every Play game, the companion tab and
hats, softer character movement and the new happy faces, Blender world pieces (festivals, props, carts, creatures,
villagers), 38 Blender films, parent notifications (off until VAPID keys are set) and the bug fixes above.
Release fixes on 6-7 Nov: touch sizes, world placement, voice lists and order, sideways-phone layouts, lighter far
villagers, and the browser workflows pinned to Ubuntu 24.04.

## Results (8 Nov 2026, 11:40 am AEDT)

- **Full suite on GitHub, release head `767a52377`: 376/376 passed** (run 42424167978, 16 machines). Passed only on
  a second try: hocvui (one sampled science game, Talent vs Easy count), managementstudio (Studio page slow to draw).
- Rounds before it (6-8 Nov): 337, 46/48 (only-run), 372, 374, 373, 354 (a machine lost) then 375 on its re-run.
  Every red was fixed at its cause:
  - Studio switches for the boxes and surprises: their release dates are 7 Nov, and the checks now switch them off the
    way Studio does.
  - Repeated rounds: reading games deal their lists in turn, and Gấp Đôi Easy goes to 4.
  - Friend card: it keeps the time it came, and the meet check waits from then.
  - Film music: a story's music starts on the tap.
  - Sound switches in the valley: they open inside the tap.
  - Cờ Cá Ngựa: the board holds still mid-game, and the fit leaves out folded buttons.
  - Cloud play: a knocking friend always reaches the host, and a friend sees the right place.
  - Dragon Bridge Count on a sideways phone, and the 4 new voice lines.
  - Workflows on Ubuntu 24.04.
- Speed checks on the Release machine (head `767a52377`):
  - perf: pass (start 2.4 MB in 4.0 s; home 163 draws, village 269 draws / 774k triangles).
  - battery: pass.
  - startup: first download 1017 KB (limit 1025, pass); ready in 18.5 s, over this machine's scaled limit
    (13.8 s at speed 0.71), the same as v1.07 on this machine (24-25 s).
- Local checks on the merged fixes: types, preload, soundsw x5, filmmusic x5, cloud x5, meet x2, horsestability
  x11 (no board move), fivescreens 370 games on a sideways phone, gamefit, reading, hocvui, school, voicecover,
  voiceopus: pass.
- Screenshots (phone, tablet, computer): `docs/release-v108/screens/` (taken 7 Nov on 3185da1b1; the later fixes are
  covered by the fivescreens and gamefit checks at every size).
