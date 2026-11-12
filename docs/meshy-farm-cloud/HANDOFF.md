# Sparkle Valley — cow trên cloud

Cập nhật 13/11/2026 08:41 AEDT (Sydney). Nhánh `meshy-farm-cloud`, bắt đầu từ `origin/meshy-pets` (`a89a0b877`), đã đối chiếu và hợp nhất phần chuẩn bị có sẵn trên nhánh farm. **Chỉ làm cow; sheep/chicken tạm dừng theo chủ.**

## Kết quả và tiền

Cow đã xong phần tạo model và hai remesh Meshy. Mỗi POST được chủ duyệt, reserve trước vào SQLite mới, gửi đúng một lần. Tải ngay sau SUCCEEDED. Không trả tiền rigging hoặc làm thêm con nào.

| Bước | Task ID | Credit | Số dư trước → sau |
| --- | --- | --- | --- |
| Gốc: Meshy 7.1 standard, texture 2k, front/left-side/back | `01a1d19a-7a61-7711-9f5a-8687a2c45778` | 30 | 1614 → 1584 |
| Remesh target 30k từ gốc | `01a1d1ae-6111-76ee-b081-82919b93869b` | 5 | 1584 → 1579 |
| Remesh target 9k **từ task 30k** | `01a1d1b3-61f1-7650-a8ad-27d29117a9cf` | 5 | 1579 → 1574 |

**Tổng chi cow 40 credit**, số dư cuối đã GET xác nhận **1574**. Sheep/chicken chưa gửi, chi 0. Không gửi lại bất kỳ model/task nào đã trả tiền (kể cả 35 model cũ). Không có bước Meshy trả tiền tiếp theo cho cow.

## File đã lưu trên repo

Thư mục [cow/](cow/), thuộc nhánh này:

| File | Byte | Tam giác thực tế |
| --- | ---: | ---: |
| [original.glb](cow/original.glb) | 39939624 | 1293114 |
| [remesh-30000.glb](cow/remesh-30000.glb) | 11503348 | 31273 |
| [remesh-9000.glb](cow/remesh-9000.glb) | 9594340 | 9423 |

Target Meshy là 30000/9000, số tam giác trả về không đúng tuyệt đối. SHA256 xem [ARTIFACTS.json](ARTIFACTS.json).

Ảnh đã nhìn trực tiếp bằng viewer Three.js + Chromium, không sửa model:

| Bản | Trước | Trái | Sau | Phải |
| --- | --- | --- | --- | --- |
| Gốc | [front](cow/original-front.png) | [left](cow/original-left.png) | [back](cow/original-back.png) | [right](cow/original-right.png) |
| 30k | [front](cow/remesh-30000-front.png) | [left](cow/remesh-30000-left.png) | [back](cow/remesh-30000-back.png) | [right](cow/remesh-30000-right.png) |
| 9k | [front](cow/remesh-9000-front.png) | [left](cow/remesh-9000-left.png) | [back](cow/remesh-9000-back.png) | [right](cow/remesh-9000-right.png) |

File làm việc Blender: [cow-work.blend.tar.xz](cow/cow-work.blend.tar.xz). `.blend` vượt 50 MB nên nén tar.xz; giải nén được `cow-work.blend`. Có ba collection gốc/30k/9k, texture đã pack (7 image datablock); mặc định chỉ hiện 30k. Đã mở lại bằng Blender 4.3.2 và kiểm đủ ba collection. Script dựng lại: [save_cow_workspace.py](save_cow_workspace.py).

## Nhận xét chất lượng

- Gốc: mắt nâu rõ, viền trắng và hai mắt giữ được; mõm hồng, hai lỗ mũi và đường miệng nhìn rõ. Bốn chân/móng chẻ còn nguyên. Lông ngắn đen trắng và chỏm lông đầu/đuôi có chi tiết. Không thấy lỗ/vỡ lớn qua bốn góc tĩnh.
- 30k: giữ mắt, chân, lông và đuôi; vành lỗ mũi, mép chuông hơi góc cạnh hơn bản gốc. Chưa thấy lỗ/vỡ lớn qua bốn góc.
- 9k: giảm chất lượng rõ ở mõm/lỗ mũi, sừng, tai, chỏm lông và chuông; hình khối góc cạnh. Có vệt tối nhỏ ở má cần kiểm tra gần bằng Blender để phân biệt texture, mặt chồng hay khe mesh. Chân vẫn đủ bốn; chi tiết lông phần lớn còn trong texture, silhouette đuôi thô hơn. Không thấy thiếu bộ phận lớn, **chưa chứng minh mesh kín hoặc không có lỗi nhỏ**. Không coi bản 9k là đạt chất lượng dùng trong game.

## Blender và phần còn lại

Cloud thực tế có `/usr/bin/blender` 4.3.2. Báo trước đó rằng cloud không có Blender là sai do chưa kiểm tra. Đã import GLB gốc và render Cycles CPU thành công: [ảnh smoke](cow/blender-smoke.png). Bản cài thiếu OpenImageDenoise; phải tắt `scene.cycles.use_denoising`.

**Chưa fit, chưa rig, chưa animation/audit trong game, chưa thay js/ hay models/.** File Blender hiện là nguồn chỉnh sửa, chưa phải model sẵn dùng trong game. Quy trình fit_animal.py trên Linux chưa được chạy kiểm chứng. Bước kỹ thuật tiếp theo để đưa vào game là xử lý/đánh giá bản nhẹ, fit khớp, rig và kiểm tra chuyển động; phạm vi ban đầu cấm fit/rig nên cần chỉ thị tiếp của chủ cho giai đoạn này. Không merge main, deploy hoặc tăng version.

## Riêng tư và cơ chế an toàn

- API key chỉ từ biến cloud `MESHY_API_KEY`, không in/commit/truyền trên command line.
- SQLite: `/workspace/meshy-jobs-farm.sqlite3`; metadata `/workspace/meshy-farm-account.json`. Không commit/upload. Metadata allowlist hiện chỉ cow; trần ban đầu 120, chi thực tế 40.
- Bản tải gốc cũng còn ở `/workspace/meshy-farm-raw/`; bản làm việc chưa nén ở `/workspace/meshy-farm-viewer/cow-complete.blend`. Repo là bản bàn giao lâu dài; không dựa vào cloud để lưu bền.
- Exception tier chỉ ba asset nhóm E đã nêu, job spec có tierOverride/approval/plannedCredits=30; submit còn cần approvedTierOverrides trong metadata. Không thay tier nhóm khác. Chung trần jobs+remesh, chặn lỗi/ambiguous, không POST lại.
- 14 test_batch + test_farm offline PASS trước chạy; ba check ảnh/hash PASS. GLB kiểm header đầy đủ khi download; ảnh 12 góc đã xem, workspace mở lại đủ collection/texture. Không chạy suite game vì chưa thay runtime; lần chọn suite trước yêu cầu full do chênh nhánh nguồn với main, không chạy local full suite.
