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

## Results

(filled in when the final full suite on the release head finishes)
