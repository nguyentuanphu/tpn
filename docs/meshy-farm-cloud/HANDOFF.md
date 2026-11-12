# Sparkle Valley — ba gia súc cloud

Cập nhật 13/11/2026 07:09 AEDT (Sydney). Nhánh `meshy-farm-cloud`, tách trực tiếp
`origin/meshy-pets`. **Đang chờ secret cloud, chưa tạo model.**

## Duyệt và giới hạn

Chủ duyệt 13/11/2026 AEDT: cow (25), sheep (26), chicken (24), tối đa 120 credit.
Mỗi con: multi-image-to-3d Meshy 7.1 standard geometry/texture 2k (30), remesh 30k (5),
remesh 9k từ task 30k (5). Không rigging, không thêm con. Hỏi pop-up trước từng POST
trả tiền; duyệt trần không thay thế duyệt từng lệnh. Không fit, sửa js/models, merge main,
deploy, tăng version hay force-push. Commit/push nhánh mỗi giờ.

## Đã chuẩn bị

- Ba job spec giữ ảnh/SHA256; thêm tierOverride 7.1, plannedCredits 30 và approval.
- Override chỉ nhận ba asset này, cần allowlist `approvedTierOverrides` trong metadata riêng.
  Nhóm khác giữ tier/giá cũ. Farm không cần pilot Clara hoặc số dư 1000 của batch cũ.
- Remesh farm kiểm tra metadata, đúng hai bước; 9k lấy task 30k thành công.
- Tổng reserve jobs + remesh không quá 120, giữ dự phòng 10 credit. Job lỗi/ambiguous
  chặn tiếp tục, không giả định hoàn tiền. Reserve trước POST, tuyệt đối không POST lại.
- SQLite mới `/workspace/meshy-jobs-farm.sqlite3`, 0 job; metadata pending
  `/workspace/meshy-account-farm.json`, cờ xác minh false; quyền 0600. Không commit/upload.
  Journal này không đại diện cho 35 model cũ; không gửi lại chúng.
- Cloud chưa có biến `MESHY_API_KEY`. Chỉ thêm qua secrets môi trường, không chat/lệnh/log.

## Tiền và task

| Con | Task gốc | Task 30k | Task 9k | Credit đã tiêu |
| --- | --- | --- | --- | --- |
| cow | chưa gửi | chưa gửi | chưa gửi | 0 |
| sheep | chưa gửi | chưa gửi | chưa gửi | 0 |
| chicken | chưa gửi | chưa gửi | chưa gửi | 0 |

Tổng **0/120**. Số dư trước/sau **chưa đọc được**. Chưa có GLB hoặc ảnh xem trước.
Mắt, mõm/mũi, chân, lông/len, lỗ/vỡ: **chưa đánh giá**.

## Tiếp tục

1. Khi có key môi trường: GET `https://api.meshy.ai/openapi/v1/balance` không tốn credit.
   Dùng Python lấy key trực tiếp từ môi trường, không truyền key trên command line.
   Ghi `verifiedAt` ISO múi giờ Sydney, `apiCreditBalanceConfirmed: true`, số `balance`
   vào `batchStartingAPIBalance` của metadata ngoài repo. Xác minh riêng account/private/pricing
   trước khi đặt các cờ true. Giữ `approvedTierOverrides: ["cow", "sheep", "chicken"]`,
   `creditCap: 120`. Không tự nhận đã xác minh khi chưa có bằng chứng.
2. Hỏi duyệt POST cow 30 credit, rồi dùng:
   `python tools/meshy/run_batch.py submit --asset cow --journal /workspace/meshy-jobs-farm.sqlite3 --account /workspace/meshy-account-farm.json`
3. Poll GET, tải ngay khi thành công qua download, `--raw-root /workspace/meshy-farm-raw`.
   Timeout/lỗi: dừng đối chiếu, giữ reservation, không gửi lại.
4. Hỏi trước từng remesh: `remesh_once.py submit --source-asset cow --polycount 30000`,
   rồi `--source-asset cow@9000 --polycount 9000`; cùng journal/account; thêm `--approved`
   chỉ sau khi chủ duyệt bước đó. Poll/download ngay từng bước. Lặp đúng sheep/chicken.
5. GET balance sau từng bước; cập nhật task IDs, khoản reserve/charge thực tế ở trên.
   Không chạy ledger_sync mặc định: journal farm thiếu lịch sử 35 model và bảng rigging;
   dùng sổ farm riêng, không ghi đè ledger chung.
6. Giao GLB gốc/30k/9k trong thư mục con từng con ở đây, file >50 MB nén tar và ghi đường dẫn.
   Chụp front/left/back/right bằng viewer không Blender, ghi model được chụp; xem kỹ mắt,
   mõm/mũi, chân, lông/len, lỗ/vỡ. Không coi ảnh thô là duyệt trong game.

## Kiểm tra

14/14 test offline pass (`python tools/meshy/test_batch.py`), gồm allowlist, trần tính remesh,
nguồn 30k cho 9k và chặn POST trùng. `run_batch.py check` cả ba con pass, SHA256 ảnh đúng,
30 credit, không network. Chưa kiểm chứng API thật hoặc chất lượng model.
