# Kế hoạch hoàn thiện Sparkle Valley trước khi đông người chơi

Viết ngày 1/11/2026 (AEDT) theo yêu cầu của chủ dự án: "làm cho game hoàn thiện nhất có thể khi người chơi chưa nhiều, vì sau này người chơi nhiều sẽ khó chỉnh sửa hơn".

Kế hoạch có ba trọng tâm do chủ dự án chọn:
1. Khởi động dưới 3 giây.
2. Độ khó đồng đều ở mọi game.
3. Tách các file lớn.

Hai phần đi kèm là dọn lỗi tồn đọng và chuẩn bị ra mắt dịp Tết 2027.

## Hiện trạng (đo ngày 1/11/2026)

| Mục | Hiện tại | Ghi chú |
|---|---|---|
| Khởi động lần đầu (máy kiểm tra) | 35–47 giây tới khi chơi được | Bản v1.04 có Welcome trong khoảng 2 giây, nhưng thung lũng còn dựng lâu |
| Tải lần đầu | khoảng 1016–1035 KB | Ngân sách 1030 KB |
| Độ khó | Khoảng 115/230 game không dùng độ khó; khoảng 30 game chỉ đổi rất ít | Phần lõi đã sửa trong v1.06: mỗi mức có khoảng riêng, thêm Talent |
| File lớn | `js/main.ts` 208 KB, 2.112 dòng; `js/ui.ts` 119 KB; `js/world.ts` 121 KB; `js/art.ts` 170 KB; `tests/run.mjs` 786 KB, 7.732 dòng | Có những dòng dài hơn 400 ký tự |
| TypeScript | 202 file `.ts`, còn 136 file `.js` chưa chuyển | |
| Lỗi đang mở | Khoảng 45 issue sau khi dọn ngày 1/11 | Bug robot kẹt ở tất cả |
| Bộ kiểm tra | 282 bài; khoảng 30 phút trên 8 máy GitHub | Sửa một file lớn là phải chạy cả bộ |

## Nguyên tắc trong thời gian hoàn thiện

- **Hạn chế tính năng mới:** mỗi bản chỉ thêm tối đa một tính năng mới đã được duyệt. Tab Học vui và trường học là ngoại lệ đã được duyệt. Phần còn lại là sửa lỗi, tăng tốc và dọn code.
- **Tách file không đổi hành vi:** mỗi lần tách là một bước riêng, chạy đủ bộ kiểm tra trên GitHub, và không sửa logic cùng lúc.
- **Ngân sách tốc độ thành luật:** một bản làm chậm khởi động hơn ngân sách thì không được phát hành, giống như lỗi bài kiểm tra.
- **Đo trên máy thật:** dùng số liệu khởi động ẩn danh mà game đã gửi về Studio ("helper ms, start page ms, page readable ms" trong mỗi báo cáo), không chỉ đo trên máy kiểm tra.

## Trọng tâm 1: Khởi động dưới 3 giây

### Mục tiêu đo được
- **Lần mở lại** (đã từng chơi, có cache), trên máy tầm trung: thấy Welcome dưới 1 giây; bé chạm được vào game, Simple screen hoặc đi lại trong thung lũng, dưới 3 giây.
- **Lần đầu tiên**, mạng 4G: thấy Welcome dưới 2 giây; chơi được dưới 6 giây.
- **Máy chậm** (iPad cũ, Android rẻ): chơi được dưới 6 giây khi mở lại.

### Các bước
1. **Đo nền (tuần 1):**
   - Lấy số khởi động thật từ Studio, chia theo loại máy: p50 và p90.
   - Thêm một mốc đo "chơi được", tức thời điểm bé chạm được lần đầu.
   - Chọn 3 máy chuẩn: iPhone, iPad và một Android tầm trung.
2. **Đường găng (tuần 1–2):**
   - Lập bản đồ những module tải trước khi bé chơi được.
   - Chỉ tải phần khởi động, Welcome và Simple screen; mọi thứ khác tải sau.
   - Simple screen không cần thế giới 3D, nên phải mở được ngay.
3. **Thung lũng dựng từng vùng (tuần 2–4, issue #36, #41):**
   - Dựng vùng bé đang đứng trước; các vùng khác dựng dần qua nhiều khung hình khi bé đang chơi.
   - Dùng bản cache địa hình, đường và vật cản đã có từ v1.04.
4. **Ăn kiêng tài nguyên (tuần 3):**
   - Hình vẽ và nội dung truyện, phim chỉ tải khi mở.
   - Giọng nói đã phát qua mạng từ v1.05.
   - Đưa lần tải đầu về dưới 1000 KB.
5. **Service worker (tuần 3):**
   - Cache sẵn phần khung, để lần mở lại không phải chờ mạng.
   - Cập nhật ở nền, không chặn lúc mở.
6. **Khóa ngân sách (tuần 4):**
   - Bài kiểm tra `startup` dùng ngưỡng mới.
   - Thêm một bài đo trên trình duyệt có giới hạn CPU, mô phỏng máy chậm.

## Trọng tâm 2: Độ khó đồng đều ở mọi game

### Đã làm (v1.06)
- Mỗi mức có khoảng riêng: Dễ 1–2, Vừa 2–3, Khó 4–5, Talent 5 cộng với thử thách thêm của từng game. Thắng nhiều không còn đẩy Dễ lên ngang Khó.
- Mức game bắt đầu theo mức đã chọn, không theo số lần thắng.
- Game nhận thêm `api.smart` (0–3, cho máy chơi và thời gian) và `api.talent`.
- Hai agent đang nối độ khó vào khoảng 115 game còn lại, kèm bài kiểm tra `levelsA` và `levelsB`.

### Còn lại
1. **Bảng quy định cho từng game** (`docs/levels/`): Dễ, Vừa, Khó và Talent thay đổi những gì. Đây là tiêu chuẩn để kiểm tra và để làm game mới.
2. **Kiểm tra toàn bộ, không chỉ mẫu:** mỗi game ghi các số đo của mình (số lựa chọn, kích thước bảng, tốc độ) lên khung game. Một bài kiểm tra mở mọi game ở cả 4 mức và so sánh số đo.
3. **Game mới phải đủ 4 mức** mới được vào bộ game. Thêm luật này vào sổ tay thiết kế.
4. **Talent cho ai:** cần anh quyết định. Có hai cách:
   - Hiện cho mọi bé lớn ngay từ đầu.
   - Chỉ mở cho game nào bé đã đạt 3 sao ở mức Khó, để Talent thành phần thưởng.
5. **Tester chơi thử:** mỗi tester chơi 10 game ở cả 4 mức và báo lại những chỗ thấy không khác nhau.

## Trọng tâm 3: Tách các file lớn

### Mục tiêu
- Không file mã nào trên 60 KB (trừ dữ liệu như truyện, phim, hình).
- Không dòng mã mới nào dài quá 200 ký tự.
- Sửa một màn hình chỉ chạy những bài kiểm tra của màn hình đó (`--changed` chọn ít hơn), để mỗi vòng nhanh hơn.

### Thứ tự tách (mỗi bước là một nhánh, chạy đủ bộ kiểm tra trên GitHub)
1. **`tests/run.mjs` (786 KB)**: tách thành `tests/checks/<nhóm>.mjs` (game, thung lũng, Simple screen, online, Studio, giọng nói...). Giữ nguyên tên từng bài kiểm tra và bản đồ kiểm tra. Làm đầu tiên vì không ảnh hưởng tới game, và giúp các bước sau nhanh hơn.
2. **`js/ui.ts` (119 KB)**: tách thành `ui/hub.ts` (Play), `ui/profile.ts` (hồ sơ bé), `ui/grownups.ts` (Phụ huynh), `ui/festivals-ui.ts`, `ui/friends.ts`.
3. **`js/main.ts` (208 KB)**: tách thành `game-launch.ts` (`playGame`, mức, phần thưởng), `heroes.ts` (nhân vật, di chuyển), `rewards.ts`, `online-glue.ts`, `festival-glue.ts`. File `main.ts` chỉ còn phần khởi động. Bước này cũng giúp khởi động nhanh, vì phần nào không cần lúc đầu thì tải sau.
4. **`js/world.ts` (121 KB)**: tách thành địa hình, nước, công trình và cây. Việc này đi cùng "dựng từng vùng" ở trọng tâm 1.
5. **Chuyển nốt 136 file `.js` sang TypeScript**, theo từng nhóm và theo kế hoạch đã có (`docs/cores/tasks/typescript-plan-20261016.md`).

## Phần đi kèm: dọn lỗi

- Đưa số issue mở về dưới 15 vào cuối kế hoạch.
- Tìm hiểu vì sao bug robot kẹt ở mọi issue (`robot-stuck`) và sửa, để lỗi nhỏ được tự sửa trở lại.
- Mỗi bản phát hành đóng các issue đã sửa kèm ghi chú phiên bản, như đã làm với nhóm ResizeObserver.

## Lịch dự kiến (AEDT; anh duyệt "yes, deploy" từng bản)

| Bản | Khoảng thời gian | Nội dung chính |
|---|---|---|
| v1.06 | tuần 1–8/11 | Đang làm: Simple screen, NPC kể kiến thức, lõi độ khó và Talent, độ khó cho khoảng 115 game, lỗi chơi cùng bạn và Túi, festivalsync, tab Học vui (phần đầu) |
| v1.07 | 9–22/11 | Đo khởi động nền, đường găng (Simple screen mở ngay), tách `run.mjs` và `ui.ts`, tab Học vui với các thí nghiệm khoa học, bảng độ khó từng game |
| v1.08 | 23/11–6/12 | Thung lũng dựng từng vùng, tách `main.ts` và `world.ts`, ngân sách tốc độ thành luật, trường học trong thung lũng |
| v1.09 | 7–18/12 | Đóng băng tính năng: chỉ sửa lỗi; issue dưới 15; tester chơi thử cả 4 mức |
| Giáng sinh | 19/12 | Nội dung lễ đã lên lịch sẵn |
| Chuẩn bị ra mắt | 20/12–10/1/2027 | Video ngắn, trang web, liên hệ trường Việt ngữ và hội chợ Tết |
| Ra mắt | khoảng 11–17/1/2027 | Khoảng 3 tuần trước Tết (6/2/2027) |

## Quảng bá (tóm tắt; kế hoạch chi tiết khi tới giai đoạn)

- **Đối tượng chính:** gia đình người Việt ở Úc có con 2–8 tuổi.
- **Kênh:**
  - Nhóm Facebook cộng đồng Việt ở Sydney và Melbourne.
  - Trường Việt ngữ cuối tuần (NSW Community Languages Schools).
  - Hội chợ Tết ở Cabramatta, Bankstown và Footscray.
  - SBS Tiếng Việt.
  - Thư viện địa phương.
  - Video ngắn 15–30 giây.
- **Lời hứa với bố mẹ:**
  - Không quảng cáo.
  - Không thu dữ liệu của trẻ.
  - Song ngữ.
  - Chơi được offline.
- **Việc có trả tiền** (quảng cáo trả phí, App Store, gian hàng) chỉ làm khi anh quyết định.

## Quyết định của anh (1/11/2026)

- Không giới hạn tính năng mới trong thời gian hoàn thiện; ưu tiên vẫn là ba trọng tâm trên.
- Talent mở cho mọi bé lớn (5–8 tuổi) ở mọi game; bé nhỏ không thấy.
- Máy chuẩn: một iPhone, một iPad và một Android tầm trung lấy từ báo cáo tester.
- Ngày ra mắt chưa cố định: hoàn thiện trước, và Studio có một công tắc để hẹn ngày ra mắt sau.

## Câu hỏi đã hỏi

1. **Hạn chế tính năng mới** trong thời gian hoàn thiện, như mục "Nguyên tắc" ở trên: có đồng ý không?
2. **Ba máy chuẩn** để đo khởi động: anh và tester đang dùng máy nào?
3. **Talent cho ai:** hiện cho mọi bé lớn, hay chỉ mở sau khi đạt 3 sao ở mức Khó?
4. **Ngày ra mắt:** khoảng giữa tháng 1/2027, trước Tết, có hợp không?
