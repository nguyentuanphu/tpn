> **14/11/2026: chủ đã từ chối R16. Đang sửa hai lỗi mặt và mở rộng audit; chưa có R17 đạt cổng duyệt. Các bảng/bằng chứng R16 bên dưới là lịch sử, không phải approval.**

# Sparkle Valley — cow, bản chờ chủ duyệt

Cập nhật 13/11/2026 14:46 AEDT. Nhánh `meshy-farm-cloud`, tách từ `origin/meshy-pets` (`a89a0b877`); đã hợp nhất phần chuẩn bị có sẵn của nhánh farm. **Chỉ cow; sheep/chicken tạm dừng.** Chủ đã yêu cầu tiếp tục sửa bằng Blender và kiểm tra trong game đến bản hoàn chỉnh; chỉ thị này thay phạm vi ban đầu cấm fit/sửa runtime cho riêng cow. Chưa được chủ duyệt hình thức cuối; không merge main, deploy hoặc tăng version.

## Xem và tải bản cuối R16

- [Trang duyệt: phim, ảnh game và ảnh cận mặt](cow/review/index.html).
- Phim bốn góc, đủ 10 động tác: [gần](cow/review/cow-near-review.mp4), [xa](cow/review/cow-far-review.mp4). Dùng loader/vật liệu/renderer của game trong cảnh kiểm tra nền trung tính.
- Ảnh thung lũng thật: [điện thoại](cow/review/devices/cow-phone.png), [tablet](cow/review/devices/cow-tablet.png), [máy tính](cow/review/devices/cow-computer.png). Camera đặt gần cow để kiểm tra hình thức; đã xem trực tiếp cả ba.
- [File Blender đã fit/rig](cow/review/cow-fitted.blend): 20 bone, 10 action, 6 ảnh được sử dụng đều đã pack. Đã mở lại bằng Blender 4.3.2: [kết quả](cow/review/blender-verify.json).
- GLB dùng trong game: [gần](cow/review/creature-cow-hd.glb), [xa](cow/review/creature-cow.glb), giống byte với `models/world/creature-cow{-hd,}.glb`.

| Bản runtime | Byte | Tam giác | Nguồn |
| --- | ---: | ---: | --- |
| Gần | 772492 | 33523 | Bản Meshy 30k, sửa cục bộ và thêm mặt/rig |
| Xa | 378608 | 12967 | Giảm cục bộ thân xuống khoảng 12k từ nguồn 30k đã sửa, thêm mặt/rig |

Bản xa runtime **không dùng bản Meshy 9k** vì bản trả về bị góc cạnh ở má/mõm. Giảm bằng Blender không tốn credit. Cả hai có `cheer, follow, idle, jump, run, sad, sleep, surprised, wag, walk`. Kích thước khoảng 0,724 × 1,330 × 1,368 m; chân chạm đất. Game đổi gần/xa với ngưỡng 16/24 m và có fallback hình gốc khi model chưa tải.

## Tiền và task Meshy

Mỗi POST được reserve trong SQLite riêng trước khi gửi, gửi một lần, tải ngay sau SUCCEEDED. Không gửi lại 35 model cũ; không trả tiền rigging. Việc chỉnh sửa Blender phía sau không gọi API trả tiền.

| Bước | Task ID | Credit | Số dư trước → sau |
| --- | --- | ---: | --- |
| Gốc: multi-image-to-3d Meshy 7.1, standard, texture 2k, ba ảnh | `01a1d19a-7a61-7711-9f5a-8687a2c45778` | 30 | 1614 → 1584 |
| Remesh target 30k từ gốc | `01a1d1ae-6111-76ee-b081-82919b93869b` | 5 | 1584 → 1579 |
| Remesh target 9k từ task 30k | `01a1d1b3-61f1-7650-a8ad-27d29117a9cf` | 5 | 1579 → 1574 |

**Cow đã chi 40 credit.** Sheep/chicken: 0, chưa gửi. GET balance miễn phí kiểm tra lại lúc 13/11/2026 14:43 AEDT: **1574**. Không có bước trả tiền nào còn cần cho bản cow này. Trần ban đầu ba con là 120; hiện chỉ cow hoạt động theo chỉ thị sau của chủ.

## Bản gốc và file làm việc lưu lâu dài trên repo

| Bản Meshy giữ nguyên | Byte | Tam giác thực tế |
| --- | ---: | ---: |
| [original.glb](cow/original.glb) | 39939624 | 1293114 |
| [remesh-30000.glb](cow/remesh-30000.glb) | 11503348 | 31273 |
| [remesh-9000.glb](cow/remesh-9000.glb) | 9594340 | 9423 |

| Bản | Trước | Trái | Sau | Phải |
| --- | --- | --- | --- | --- |
| Gốc | [ảnh](cow/original-front.png) | [ảnh](cow/original-left.png) | [ảnh](cow/original-back.png) | [ảnh](cow/original-right.png) |
| 30k | [ảnh](cow/remesh-30000-front.png) | [ảnh](cow/remesh-30000-left.png) | [ảnh](cow/remesh-30000-back.png) | [ảnh](cow/remesh-30000-right.png) |
| 9k | [ảnh](cow/remesh-9000-front.png) | [ảnh](cow/remesh-9000-left.png) | [ảnh](cow/remesh-9000-back.png) | [ảnh](cow/remesh-9000-right.png) |

[Workspace ba bản gốc](cow/cow-work.blend.tar.xz) (82977008 byte) đã nén tar.xz vì file làm việc vượt 50 MB; giải nén thành `cow-work.blend`, ba collection, texture đóng gói. Đã mở lại kiểm tra trước đó; script tái tạo [save_cow_workspace.py](save_cow_workspace.py). File **đã sửa và rig cuối cùng** là `cow/review/cow-fitted.blend` ở trên, dưới 50 MB nên lưu trực tiếp. Repo là bản lưu bàn giao; không cần giữ cloud để mở lại model. [ARTIFACTS.json](ARTIFACTS.json) ghi byte/SHA256.

## Nhận xét hình thức và các sửa đã hoàn tất

- Mắt: giữ mắt nâu to của nguồn; chỉnh vị trí khớp mặt, mí bám bề mặt thật. Khi nhắm/cười, bone thu phần mắt nguồn vào trong để không xuyên qua mí; atlas có alpha và không dùng mipmap trộn giữa các ô tam giác. Xem cận mặt trong [102 ảnh](cow/review/shots/) và bốn contact sheet trên trang duyệt. Không thấy lộ con ngươi ở ảnh nhắm và audit cuối.
- Mõm/mũi: mõm hồng, hai lỗ mũi và nét miệng rõ; bake AO vào màu giúp giữ độ lõm dưới ánh sáng game. Bản gần và xa cuối giữ hình tròn hơn bản Meshy 9k; chuông/sừng vẫn có ít mặt phẳng ở mức zoom rất gần.
- Chân: đủ bốn chân/móng, sửa phân vùng bụng để bầu vú không kéo sai trọng số; đứng, đi, chạy, nhảy, gập ngủ đã kiểm tra. Chân không chìm hoặc nổi trong audit tư thế chạm đất.
- Lông: giữ texture đen/trắng, chỏm đầu và đuôi; smoothing và giảm mesh cục bộ, không tạo thêm lông hình học. Bản runtime dùng texture màu 1k để đáp ứng dung lượng; bản Meshy gốc vẫn giữ texture 2k.
- Lỗ/vỡ: không thấy khe vỡ thân lớn hoặc mặt xuyên rõ trong các ảnh/phim đã kiểm. Vòng nối chuông/cổ có lỗ cấu tạo thật; không tuyên bố toàn bộ mesh kín về topology. Ngưỡng `tear:30` riêng cow có chú thích cho chi tiết này, không che một lỗi thân chưa sửa. Bản Meshy 9k thô được giữ nguyên để đối chiếu, không trình là bản runtime đạt.

## Kiểm tra và giới hạn

- Audit cow R16: **120 ca, 0 ca vượt ngưỡng**, hai LOD, chuyển động và biểu cảm; [summary](cow/review/audit-summary.txt), [cases](cow/review/audit-cases.json). Eye leak worst 0; sink/float/mouth 0. Stretch worst 750 trong tư thế gập (ngưỡng 900); tear worst 20 dưới ngoại lệ vòng chuông 30; flicker worst 1 dưới 12. Tiêu đề summary in ngưỡng chung; ngưỡng riêng thực tế nằm trong config cow và cases.
- [Selftest](cow/review/audit-selftest.txt): phát hiện đủ 6 lỗi cố ý chèn (stretch, tear, eyes, sink, hat, mouth). Cow không có mũ/trò chó trong gameplay; selftest vẫn kiểm detector mũ.
- [Kiểm tra GLB](cow/review/glb-verify.jsonl): header/size, 20 bone, 10 clip, alpha mí và sampler sau đóng gói đều đạt; gần <800 KiB, xa <400 KiB.
- [Tích hợp ba thiết bị](cow/review/devices/integration.json): kích thước/chân, gần → xa → gần, ẩn fallback khi model tải xong, 10 clip, không lỗi trình duyệt. [Fallback khi chặn cả hai GLB](cow/review/fallback.json) cũng PASS: hình gốc vẫn hiện, không gắn model hỏng.
- TypeScript cuối R16 PASS (360 file explicit + server/tools); boot và phone suite đã PASS trong vòng này. Các test batch/farm offline đã PASS trước khi gửi API.
- CI toàn repo [`43360155840`](https://github.com/nguyentuanphu/tpn/actions/runs/43360155840) trên runtime commit `a27a31a3b`: **365/377 đạt, 12 không đạt**. Đối chứng chọn 10 check cũ trên nhánh nguồn `meshy-pets`, run [`43360999514`](https://github.com/nguyentuanphu/tpn/actions/runs/43360999514), cũng không đạt. Cùng thất bại ở: `boxes`, `contract`, `r79hudtrays`, `surprises`, `voicecover`, `worldcreatures`, `worldvehicles`; riêng `worldcreatures` cùng dừng tại calf (z 0,76 so với 1,20). Các lỗi farm còn chưa được chứng minh nguồn gốc: `areastream`, `cloud`, `roundvariety`, `saves`, `soundsw`. Không gọi tất cả là lỗi có sẵn và không tuyên bố CI xanh. Chi tiết [CI-RESULTS.json](CI-RESULTS.json). Bản cow đã qua các kiểm tra riêng nêu trên; chưa được phát hành.

## Tái tạo cục bộ, không gọi Meshy

Dùng Blender 4.3.2 CPU (tắt denoising vì bản cloud thiếu OpenImageDenoise), Python có numpy/Pillow, gltfpack 0.20.0. Không sửa ba GLB đầu vào.

```sh
blender -b -t 4 -P tools/meshy/prepare_cow.py -- docs/meshy-farm-cloud/cow/remesh-30000.glb /workspace/cow-rebuild/source
blender -b -t 4 -P tools/meshy/fit_animal.py -- cow /workspace/cow-rebuild/source/cow-quality.glb /workspace/cow-rebuild/source/cow-quality-light.glb /workspace/cow-rebuild/fitted debug
# Với mỗi GLB fitted: compact_cow_lids.py INPUT OUTPUT, rồi gltfpack -cc -kn -km -ke.
# Giữ sampler mí minFilter=9729 sau đóng gói, kiểm tra bằng:
python tools/meshy/verify_cow.py models/world/creature-cow-hd.glb models/world/creature-cow.glb
# Sau khi build/serve repo, quay lại bằng loader game:
SV_URL=http://127.0.0.1:PORT node --experimental-strip-types tools/meshy/film_cow_review.mts /workspace/cow-review near
```

Các sửa mặc định chung giữ tương thích thú trước; ngoại lệ giải phẫu/mí/config chỉ cow. Runner vẫn chỉ cho tierOverride Meshy 7.1 khi spec có plannedCredits=30, approval và assetId nằm trong metadata allowlist; không đổi tier nhóm khác.

## Soát của chủ và Claude, 14/11/2026 AEDT: chưa duyệt, sửa tiếp (giao lại ChatGPT)

Claude (máy của chủ) đã xem các bảng ảnh, 102 ảnh cận, ảnh ba thiết bị và cả hai phim ở cỡ thật (phim phát thật, không tua: hai phim đủ 10 động tác, chuyển động ổn). Dáng, chân, móng, đuôi, sừng, chuông, lông ổn. **Hai lỗi mặt thật, chưa được duyệt:**

1. **Mắt nhắm phía mảng lông đen gần như biến mất** (cheer, wag, sleep, blink; rõ nhất `shots/cow-hd-cheer-face.png`, `cow-hd-sleep-facetq.png`): hàng mi đen chìm vào lông đen, còn lại một ô mi xám phẳng hơi khác màu, ở góc 3/4 thành hình bầu dục có viền cứng. Mắt nhắm bên lông trắng thì hàng mi mảnh và nhạt. Cần: mi nhắm cùng màu, cùng chất lông với vùng quanh mắt (đen thì đen, trắng thì trắng, không ô phẳng, không viền), và một nét mi nhìn rõ trên cả lông đen (ví dụ nét sáng hơn hoặc nét có bóng) lẫn lông trắng.
2. **Mắt phía xa nhô ra ngoài viền mặt ở góc 3/4** (rõ nhất `shots/cow-hd-sad-facetq.png`; cũng thấy ở follow/run facetq): mắt xa phải nằm trong đường viền đầu, như con mắt thật nằm trong hốc.

Còn cần xác minh: hình tam giác vàng phẳng sát mõm bò trong cả ba ảnh thiết bị (`devices/cow-*.png`). Có thể là ô đánh dấu chỗ trồng của game (nút Plant đang hiện), không phải của bò; phải chụp lại ở chỗ khác hoặc tắt ô đánh dấu để chắc.

**Cổng duyệt của chủ** (mọi model): máy soi 0 và không lùi; bảng ảnh 1024 px xem cỡ thật (mặt thẳng, ±.4, ±.7, hai bên, từ trên/dưới, mọi cảm xúc, cổ, sau đầu, toàn thân); một người soi thứ hai không biết đã sửa gì; mọi lỗi chủ từng khoanh xem lại; chỉ khi sạch mới hỏi duyệt. Máy soi bò hiện báo 0 cho cả hai lỗi trên, nên không được dựa vào số 0: phải nhìn ảnh.

## Dữ liệu riêng và quyết định của chủ

API key chỉ từ biến cloud `MESHY_API_KEY`. SQLite `/workspace/meshy-jobs-farm.sqlite3`, backup `/workspace/meshy-jobs-farm-final.sqlite3`, metadata `/workspace/meshy-farm-account.json`: **ngoài repo, không commit/upload**. Allowlist hiện chỉ cow. Không đưa signed download URL vào bàn giao.

Chủ đã duyệt chi 40 cho ba bước cow và yêu cầu làm tiếp Blender/game đến bản đẹp, sạch để duyệt cuối. Những việc này đã hoàn thành tới bản R16 cùng bằng chứng trên. Chờ **duyệt hình thức cow cuối**; sheep/chicken vẫn dừng, không merge/deploy/tăng version, không tự chi thêm credit.


## Đang sửa theo soát của chủ — 14/11/2026 10:48 AEDT

Chưa có R17 đủ cổng duyệt. Đã pull `883bb005d`, giữ nguyên gốc/30k/9k và bằng chứng R16 bị từ chối. Không gọi Meshy, không chi thêm. Đang sửa trong Blender: giảm độ nhô dựa trên đường cong mặt liên tục, giữ texture mắt nhưng đưa hình mắt vào trong hốc, thay mảng mi khuếch tán phẳng bằng texture lông lấy trên bề mặt thật. Các bản thử đầu còn vệt/rìa nên đã loại, không coi là đạt.

Đã lấy logic lid/mouth/stray từ `origin/meshy-audit-coverage` (`5f13d4b3b`) để thích ứng riêng cow, thêm kiểm mép mi mới. R16 cũ đã bị bộ kiểm này đánh dấu lỗi; vẫn cần hoàn thiện selftest (lỗi được vẽ thật trong renderer), kiểm không lùi và nhìn ảnh cỡ thật. Kiểm mép chỉ đếm cạnh mới xuất hiện; dùng trị tuyệt đối sẽ đánh nhầm cạnh iris cũ vừa được xóa là lỗi mới. Không tăng ngưỡng để qua.

Xác định hình vàng là **mũi tên nhiệm vụ** (`setupGuides`, `js/main/interactables.ts`, ConeGeometry và màu `#ffd23f`), không phải bộ phận cow. Sẽ xác minh bằng ảnh game tắt mũi tên/hướng dẫn và chụp lại ba thiết bị. Chưa hỏi duyệt; còn ảnh mọi góc/cảm xúc 1024px, người soi thứ hai độc lập không biết nội dung sửa, phim phát thật và đối chiếu mọi lỗi chủ khoanh.

### Checkpoint 14/11/2026 11:27 AEDT — đang sửa, chưa R17

Đã thử và loại các bản còn lỗi. Agent độc lập Locke đã xem 15/15 ảnh thử 1024px, không đọc code/lịch sử, kết luận chưa sạch; tiếp tục sửa, chưa hỏi chủ. Các lỗi gồm mi, hình mắt mở và đường ghép. Bộ kiểm mặt mới có bốn plant vẽ bằng renderer thật và bắt đủ bốn; đang bổ sung ID vật liệu để chỉ kiểm mi nhìn thấy (mặt bên kia có thể bị đầu che), giữ stray xét cả đầu. Kết quả quick gần nhất còn 9/18 ca vượt ngưỡng, không phải bản đạt.

Đã chẩn đoán vệt mảnh trên lớp mi bằng cách vẽ riêng lớp: các đỉnh UV trùng vị trí được đẩy theo các pháp tuyến khác nhau, tạo khe thật. Bản thử đang dựng hàn điểm trùng và lấy pháp tuyến chung. Dùng UV 14 bit thay mặc định 12 cho atlas cow để giảm lệch texel; còn kiểm lại dung lượng. Runtime hiện là bản thử, các file R16 bị từ chối vẫn giữ nguyên trong `cow/review/` làm đối chứng. Không có R17 hoàn chỉnh để duyệt/phát hành. Không Meshy/credit mới.

### Checkpoint 14/11/2026 12:31 AEDT — vẫn chưa đủ cổng R17

Đã hàn các đỉnh UV trùng của lớp mi, hết các khe sáng mảnh trong ảnh thử. Dùng mắt thật (iris/sclera) để giới hạn mi, giữ hạt lông; JPEG thân được chốt trước khi lấy mẫu cho mi để tránh lệch màu. Đang sửa bóng AO mắt cũ trong texture nền, không chỉ che ở mood. Bản thử 15: 18 ca kiểm mặt còn 10 ca vượt ngưỡng; hai GLB đạt dung lượng. Mã/bản thử 16 đang dựng và chưa được xác nhận đạt. Không hỏi approval.

Bộ kiểm mặt nay lấy ảnh 512px, thêm kiểm mảng cùng màu nhưng phẳng thiếu lông; selftest đã bắt đủ 5 plant vẽ thật, gồm flat-fur (trước lần điều chỉnh so màu hạt lông cuối, cần chạy lại). Đối chứng R16 cùng bộ kiểm: 12/18 ca lỗi, lid worst550, stray310, rim4516. Đã tích hợp phase mặt bắt buộc vào `audit_pets.mts` khi có cow, sau khi đóng browser phase thân; không đổi ngưỡng thân/kiểm thú khác. Full face sẽ có ±.4, ±.7, hai bên, trên/dưới; ảnh native vẫn1024px. Còn: đồng bộ và chạy lại cả hai phase + selftest, types/thiết bị, toàn bộ ảnh mọi góc, agent soát độc lập lần cuối, phim phát thật và cập nhật gói bàn giao.
