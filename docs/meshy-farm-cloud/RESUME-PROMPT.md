Tiếp quản repo github.com/nguyentuanphu/tpn, game Sparkle Valley. Trả lời tiếng Việt ngắn, giờ Sydney AEDT.

Làm trên nhánh meshy-farm-cloud hiện có, KHÔNG tạo lại từ meshy-pets hoặc reset. Fetch/pull, kiểm tra thay đổi chưa commit trước khi sửa.
Đọc CLAUDE.md, .claude/skills/meshy-characters/SKILL.md, docs/meshy-farm-cloud/HANDOFF.md, ARTIFACTS.json, CI-RESULTS.json; khi cần lịch sử đọc docs/meshy-pets-20261110/HANDOFF.md và docs/meshy-production-20261107/BATCH-RUNNER.md.

Chỉ cow. Sheep/chicken dừng. Cow R16 đã fit/rig bằng Blender 4.3.2, 20 bone, 10 động tác, hai LOD; bản runtime gần 754 KiB, xa 370 KiB. Gốc/30k/9k giữ nguyên trong docs/meshy-farm-cloud/cow/. Bản xa runtime là giảm cục bộ khoảng 12k từ 30k, không phải bản Meshy 9k.
File làm việc cuối: docs/meshy-farm-cloud/cow/review/cow-fitted.blend (texture đã pack). Workspace nguồn lớn: cow/cow-work.blend.tar.xz.
Phim cuối: cow/review/cow-near-review.mp4 và cow-far-review.mp4, mỗi phim 20,5 giây, bốn góc và đủ 10 động tác. Ảnh thiết bị, cận mặt và audit trong cùng thư mục review/.

Chủ CHƯA duyệt model cuối. Đưa ảnh trực tiếp và link video xem được trước, rồi hỏi popup duyệt hình thức. Không coi yêu cầu push là approval model. Nếu chủ muốn sửa, thực hiện đến xong, kiểm tra lại phù hợp, báo tiến độ chủ động; không dừng giữa vòng sửa. Đừng chỉ nói đã có ảnh/video mà không đưa cho chủ xem.
Cow audit 120 ca đạt; selftest bắt đủ 6 lỗi giả; types, ba thiết bị, LOD và fallback đạt. Không hứa không có lỗi tuyệt đối. CI toàn repo trên runtime a27a31a3b, run 43360155840: 365/377 đạt, 12 lỗi. Đối chứng nhánh nguồn run 43360999514 cũng lỗi; CI-RESULTS.json phân biệt lỗi trùng và lỗi chưa xác định. KHÔNG báo CI xanh hoặc gán tất cả lỗi cho baseline. Không tự mở rộng sửa mọi phần ngoài cow.

Meshy đã chi đúng 40 credit: gốc 30 + remesh 30k 5 + remesh 9k từ 30k 5. Số dư GET xác nhận 1574 lúc 13/11/2026 14:43 AEDT. Task ID trong HANDOFF. Không có bước trả tiền còn cần; KHÔNG POST thêm hoặc chạy lại bất kỳ việc nào, kể cả 35 model cũ. Không tự làm sheep/chicken.
MESHY_API_KEY chỉ từ biến môi trường cloud, không in/commit/đưa vào lệnh. SQLite /workspace/meshy-jobs-farm.sqlite3, backup /workspace/meshy-jobs-farm-final.sqlite3, metadata /workspace/meshy-farm-account.json đều ngoài repo, không upload. Nếu cloud khác không còn các file này, không tái tạo lịch sử bằng cách gửi lại job. Trước bất kỳ chi phí mới nào phải hỏi popup và reserve trước POST; lần thử này không tự tăng trần 120.

Commit/push nhánh riêng được chủ cho phép (mỗi giờ khi làm lâu); lưu trạng thái đang chờ duyệt rõ ràng. Không merge main, deploy, tăng version hoặc force-push. Chưa được đổi trạng thái thành approved/ready for Release khi chủ chưa duyệt.

**14/11/2026 AEDT, chủ chưa duyệt R16, giao sửa tiếp:** đọc mục "Soát của chủ và Claude, 14/11/2026" trong HANDOFF.md. Sửa hai lỗi mặt (mắt nhắm phía lông đen biến mất / ô mi phẳng có viền; mắt xa nhô ra ngoài viền mặt ở góc 3/4) bằng Blender, không gọi Meshy; xác minh hình tam giác vàng trong ảnh thiết bị. Xong thì làm lại ảnh cận mọi cảm xúc ở mặt thẳng, ±.4, ±.7, hai bên, phim gần/xa, ảnh ba thiết bị, tự xem cỡ thật, nhờ một người soi thứ hai, rồi mới hỏi chủ duyệt (R17).
