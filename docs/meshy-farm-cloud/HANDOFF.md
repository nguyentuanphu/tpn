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

### Tiếp tục 14/11/2026 18:39 AEDT — chưa đủ cổng R17

Sau gián đoạn phiên, fetch xác nhận remote ở `0ac09b378`; giữ nguyên nhánh/thay đổi, không reset. Các bản thử 20–23 vẫn chưa đạt: lỗi tam giác do biến UV bị ghi đè đã sửa, nhưng ảnh 1024px còn vệt sáng mép mi và mắt mở chưa tròn tự nhiên. Runtime hiện là thử 23, không phải R17 được duyệt. Hai GLB 803596/402992 byte, 20 bone/10 clip; gốc/30k/9k và thư mục chứng cứ R16 không đổi.

Đã bổ sung kiểm metadata, coverage ID mắt, silhouette thêm/mất pixel và selftest có control cùng pose; plant dùng tên vật liệu thật. Parent bắt model thiếu và không cho biến baseline khiến child kiểm nhầm R16. Cần chạy lại cả máy soi/selftest và soi ảnh; không tuyên bố các sửa bộ kiểm đã đạt. Đã viết công cụ phát MP4 thật tới ended ở 1x, không seek, lưu callback/ảnh frame; chưa dùng nó làm bằng chứng cuối. Không gọi Meshy, không chi credit mới; số dư xác nhận gần nhất vẫn1574. Sheep/chicken dừng.

### Checkpoint 14/11/2026 19:39 AEDT — vẫn đang sửa, chưa hỏi duyệt

Bỏ cách dịch iris bằng frontal reprojection: đối chiếu độc lập chứng minh cách đó làm méo iris trước cả bake UV. Giữ UV/texture iris gốc, dịch lưới trong Blender bằng trường trơn, giảm độ nhô và tinh chỉnh lưới riêng quanh mắt. Runtime thử35: gần713716 byte/38376 tam giác, xa357128 byte/15008 tam giác (nguồn xa12k rồi tinh chỉnh mắt cục bộ), 20 bone/10 clip. Hai GLB đạt trần800/400KiB và kiểm alpha. Thử36 là dựng lại sau dọn mã/đổi tên cấu hình; chưa thay runtime.

Mi dùng ảnh liên tục256/192px trên bề mặt đầu thật, giữ toàn bộ RGBA (không palette hóa), giữ RGB ở pixel trong suốt sát mép để tránh viền đen do lọc LINEAR. Nén PNG lossless bằng Zopfli, assert RGBA trước/sau bằng nhau. Khung ảnh mắt được đo từ component chính; bỏ đốm lông bị nhận nhầm là sclera. Probe dùng50µm dung sai lượng tử thay1mm đã lấn vào lông tự nhiên; vẫn ngưỡng6pixel và phải chạy lại selftest mắt. Không tăng ngưỡng kiểm để qua.

Selftest mặt trên thử27/28 đã bắt đủ8plant có so control cùng pose; phải chạy lại sau các sửa mới. Selftest tear cũ từng đếm nhầm lỗ vòng chuông là caught: so control mới phát hiện MISSED. Đã đặt plant theo lưới tai thật và đổi thành lỗ xuyên hai mặt; chưa xác nhận phép thử mới đạt. Máy soi đầy đủ còn chưa đạt (thử31 còn lỗi mi/mép/stray); thử35 đang kiểm nhanh. Agent hình độc lập được giao mở18ảnh native1024 của thử35, không đọc code/lịch sử hoặc biết nội dung sửa; đang chờ kết quả. Chưa có phim/ảnh thiết bị R17, chưa đủ cổng chủ, chưa approval. Không Meshy/API/credit mới; sheep/chicken vẫn dừng.

### Checkpoint 14/11/2026 20:39 AEDT — đang sửa, chưa R17

TypeScript PASS (360 file explicit và108 file server/Studio; log ở workspace). Agent soát mù mở18/18 ảnh thử35, rồi36/36 ảnh hai bộ đối chứngA/B native1024: chọnB (bản thử) vì mi/mép mắt tốt hơn, **chưa xác nhận regression mới**, nhưng vẫn REJECT cảA/B do độ thô/vệt bề mặt chung ở tai/mõm/cổ/LODxa. Không ghi là blindPASS. Các điểm chung đã có ởR16; tiếp tục xử lý hai lỗi mặt chủ giao, chưa hỏi duyệt.

Đã thử và loại cách tổng hợp hai màu lông trong opening vì lan mảng trắng vào mắt đen. Source39 kiểm thân60ca0 vượt ngưỡng (eye/sink/float/mouth/flicker0; stretch748,tear21 trong giới hạn cũ); phase mặt vẫn lỗi và bản đó đã loại. Runtime hiện là thử41 (696940/344648 byte), **chưa đạt/không duyệt**. Đang đổi detector/builder từ phản chiếu sclera sang actualsclera+irispigment và thêm pixelglint/greyline bị nối vào component biên. Kiểm xây dựng mới cố ý dừng thử44–46 khi phát hiện1 brightpixel ngoài aperture; đang dựng thử47 sau bổ sung sourcepixel thật. Không nới ngưỡng: lid/rim/stray12,eyes6 giữ nguyên. H mở tới góc texel thay vì chỉ tâm; dung sai65µm có căn cứ quant14bit/1,33m (không dùng lại1mm lấn nativefur).

Đã bỏ nhánh bodyatlasreprojection khỏi fitter; dựng lại thử35/36 cho SHA rawGLB giống hệt nhau, xác nhận dọn mã không đổi kết quả. RGBA mi giữ nguyên từng byte sau nén lossless; không palette hoá. Bộ kiểm có ảnh current/reference debug để đối chiếu lỗi. Chưa chạy full cuối, selftest cuối, toàn bộ242 ảnh, phim phát thật hay ba viewport mới; source thử41 vẫn chưa đủ cổng. Credit mới0, không gọiMeshy/API, số dư xác nhận gần nhất1574 như mục trước; sheep/chicken dừng.

### Tiếp tục 14/11/2026 22:47 AEDT — chưa đủ cổng duyệt

Tiếp tục sau gián đoạn phiên, giữ nguyên worktree/nhánh. Đã dựng và cài thử48: 691776/339596 byte, 37884/14716 tam giác, 20 bone/10 clip; kiểm GLB/alpha đạt. Thử47 đã bắt đủ pixel sclera/iris/glint thực tế ở cả hai LOD; thêm opaqueguard hai pixel để xử lý lọc tuyến tính ở mép và giảm offset mi0,5mm. Thử47 vẫn còn phase thân18 ca eye vượt ngưỡng và phase mặt12/18 lỗi; không coi là đạt. Thử48 đang kiểm nhanh.

Vùng đo mắt nay hợp các component iris và viền mi nhìn thấy, không chỉ component lớn nhất; vùng mở rộng35% và mọi ngưỡng lỗi giữ nguyên. Kiểm rim nhận diện cả lông trắng có bóng (warmwhite>0,55), tránh đánh nhầm ranh hai màu lông; vẫn cần selftest cuối chứng minh bắt lỗi cài. Chưa có phim/ảnh thiết bị R17, chưa hỏi approval. Không gọi Meshy/API, không chi credit mới; sheep/chicken vẫn dừng.

### Tiếp tục 14/11/2026 23:19 AEDT — đang sửa, chưa đủ cổng R17

Thử48 qua60 ca thân nhưng11/18 ca mặt lỗi; các thử49–58 chưa sạch. Soát độc lập bằng ảnh/pixel xác nhận vừa có đường ghép thật ở ranh lông, vừa có false-positive do lông cũ có bóng hoặc mẫu màu lấy lẫn nét mi. Không tăng ngưỡng12/6, không coi ảnh/test này là duyệt. Sửa phép so hiện tại/tham chiếu trên cùng mẫu, không tính bóng lông cũ vừa sáng hơn là vùng mới tối; tiêu chí da ít bão hòa không áp lên lông đen gần đen, dùng sáng bất thường cùng kiểm phẳng/rim riêng. Mọi8 plant mặt vẽ thật đã tăng đúng metric so control ở thử59; còn cần chạy lại cuối.

Đã xác minh bằng BVH độc lập lỗi tia lấy màu bắt đầu bên trong trán nhô: ở cả hai mắt hơn5.000 vị trí lưới192px lấy nhầm mặt sau; sửa tia bắt đầu ngoài toàn model. Lấy mẫu LINEAR sRGB thay nearest riêng cow, giữ UV/ảnh mắt mở gốc. Copy pháp tuyến corner từ đầu vào mi; giảm độ nâng mi xuống0,1mm, vẫn dùng polygon-offset có sẵn trong game. Không sửa js/ trong vòng này. Thử59: 688176/337148 byte, 37880/14708 tam giác, silhouette0, mặt vẫn8/18 ca lỗi (lid38/rim54), chưa đạt. Đang thử60 sửa chuyển RGB mi trắng mềm hơn.

Selftest59: control31 ca thân0 vượt ngưỡng, 5/6 plant thân caught; **tear MISSED**, đang sửa phép cài lỗ thật để không ăn gian bằng lỗ vòng chuông cũ. Phase mặt8/8 plant caught nhưng control sleep lid13 nên combinedFAIL. Chưa chạy full cuối, ảnh242 góc1024px cuối, soát mù cuối, phim/phát phim, hoặc ba thiết bị mới. Không hỏi approval, không ready for Release. Không Meshy/API/credit mới; số dư xác nhận gần nhất1574 như lịch sử, sheep/chicken dừng.

### Checkpoint 14/11/2026 23:46 AEDT — WIP, chưa R17 được duyệt

Runtime thử65: gần777804/xa375796 byte, 38052/14740 tam giác,20bone/10clip; GLB/alpha/dung lượng đạt. Mi432/320px, lấy chuẩn độ tương phản từ patch lông sạch thay cả ranh bóng mắt; hạt lông không còn bị khuếch đại quá mức. Độ nâng50µm và co mắt1µm; UV và khoảng cách bề mặt được kiểm số trực tiếp (không có đảo UV/lệch lớn). Kiểm nhanh mặt18ca còn4ca rim vượt ngưỡng (worst40), lidworst9 không ca vượt, mouth/stray/eyes/silhouette0. Chưa đạt, chưa hỏi chủ. Đang nhờ soát độc lập vị trí rim nằm trong opening để phân biệt chuyển màu lông hợp lệ với viền mi thật; chưa thay phép kiểm rim theo đề xuất này.

Đã sửa fixture lỗ tai theo tam giác tai thật, chọn đĩa bên trong silhouette2D với khoảng hở mép, cắt hữu hạn qua hai mặt, thêm góc cận theo pháp tuyến tai cho cả control và kiểm thật. Selftest63 bắt đủ6lỗi thân và8lỗi mặt, control31ca thân0vượt; controlmặt rim22 nên combinedFAIL. Người soi độc lập xác minh6cặp depth: mỗi lỗ mới372–376pixel đều kín, ca .85 reverse tăngtear21→373, không tính nhầm lỗ vòng chuông. Không tuyên bố mọi góc đều bắt. Ngưỡng/độ sâu/rim-bin/so control giữ nguyên; summary nay in đúng ngưỡng từng con/pose. Cần chạy lại full và selftest trên bản cuối.

Đã xem ảnh game thử63 native1024 cheer/sleep3/4, vẫn thấy vệt sắc ở khóe nên tiếp tục sửa. Chưa có bộ242ảnh cuối/phim mới/ba thiết bị/soát mù cuối. TypeScript đang chạy lại với server8799 (lần khởi động trước dùng nhầm server mặc định8765 nên dừng trước kiểm; không tính là PASS). Không gọi Meshy/API, chi mới0; sheep/chicken vẫn dừng. Push checkpoint theo lịch chủ yêu cầu, không phải approval/ready for Release.

### Đang làm 15/11/2026 00:06 AEDT — chưa đủ cổng R17

Checkpoint `b20eeb42a` đã push23:46AEDT, chưa duyệt. Types chạy lại đúng server8799 và browser cache cloud: PASS360file explicit+108server/Studio/tools (1/1,35giây); hai lần trước dừng vì cấu hình server/browser, không phải kết quả đạt. File catalogue/check-times do suite tự tạo đã khôi phục, không đụng worktree gốc của chủ.

Soát độc lập65 xác nhận phép rim dùng ellipse đi xuyên vào actualaperture: nhiều gradient lông mới thay iris/sclera bị tính là mép vật liệu. Sửa phân biệt ngoài actualM và màu bất thường bên trong; flat-fur giữ riêng. Khớp lông kem ngoài opening dùng pixel nghi vấn với reference±1px, không lấy một nhân chứng trắng bất kỳ gần đó. Thêm kiểm contour đồng màu kín bên trong opening và2plantRingGeometry (xám rõ/xám gần màu lông), không cho mask hàng mi che fault vẽ đè. Selftest65 `face-boundary-selftest3` bắt10/10 plant; người soi độc lập xác nhận cả2ring203pixel flags đúng203pixel thay đổi/footprint,100%trong actualaperture; M/H/ID/coverage không đổi. Kiểm đồng màu kín không được quảng cáo bao phủ mọi viền có texture/shading.

Bản65 sau sửa classifier còn2/18ca rim lỗi (worst19), không phải đạt. Ảnh1024 mới vẫn đang được soát. Thử đổi bias/cull chỉ trong công cụ ảnh không giải quyết vệt; không sửa renderer/js của game. Đã kiểm số UV (không đảo UV) và pose (lớp mi lệch dưới0,2mm), không kết luận từ số không mà bỏ nhìn ảnh.

Thử66 đồng bộ tâm hốc sau dịch mắt: insetcenters từ−.085/.105 về−.068/.093, giữ trường dịch X gốc vì nó chọn điểm trước biến đổi. Kiểm nhanh66 còn3ca mặt vượt (nearcheer+.7rim20,nearsleep+.7lid16,farsleep+.7lid19). Đang chạy parent full120ca thân+198ca mặt, chưa có kết quả. Chưa có bộ242ảnh/phim/phát phim/ba thiết bị/soát mù cuối hay approval. Không Meshy/API/credit mới; sheep/chicken dừng.

### Tiếp tục 15/11/2026 03:58 AEDT — thử67, chưa hỏi duyệt

Tiếp tục sau gián đoạn phiên, fetch xác nhận remote `b20eeb42a`; không reset/tạo nhánh. Chủ hỏi còn bao lâu: đã báo dự kiến1–2giờ nếu vòng kiểm mới không phát hiện lỗi, chưa hứa mốc chắc chắn.

Full66:120ca thân0vượt;198ca mặt45lỗi (lid15,mouth4,stray26,rim2,silhouette3; coverage0). Dùng bbox actualaperture thay riêng các component iris/sclera bất đối xứng giảm còn39ca lỗi, rim0 nhưng chưa đạt. Đã nhìn ảnh: mouth nhìn từ trên đang nhận nhầm **vòng cổ** làm môi; mouth ROI chiếu từ bề rộng mặt thẳng bị co sai ở góc bên. Stray có vùng lông sát mi và mép hình miệng ngoài ROI cũ. Không nâng ngưỡng hay coi full này là đạt.

Thử67: sửa mouth riêng cow bằng Blender — tia cast bắt đầu ngoài toàn model, alpha chỉ giữ hình miệng thay ô da hồng đục, giảm độ nâng về0,15mm tối đa. Đo mouth bằng surface3D pose thật (giới hạn kích thước), thêm ID pass miệng nhìn thấy: vòng cổ bị miệng/mõm che không phải môi. Ghi số pixel miệng/occluded; mặt thẳng có miệng mở lớn mà không thấy phải fail coverage. Vẫn giữ ngưỡng12/6 và mọi kiểm alpha/coverage. Đo màu bên trong eye opening không trộn lông kem bên ngoài vào lông đen.

GLB67 gần778112/xa376188byte,38060/14744tam giác,20bone/10clip, alpha/dung lượng đạt. Quick18ca mặt0lỗi (lidworst6,rim7,các mục khác0). Parent selftest67 **PASS**,6/6plant thân+11/11plant mặt (bổ sung lỗi môi trùng khi miệng mở, có control cheer đúng pose và footprint thật). Full120+198 đang chạy lại trên67, chưa kết quả. Chưa có242ảnh cuối/soát mù cuối/phim/phát phim/ba thiết bị mới. Không credit/API mới; sheep/chicken dừng; không ready for Release/approval.

### Checkpoint 15/11/2026 04:47 AEDT — máy soi đầy đủ đạt, còn soát ảnh và phim

Bản thử72 hiện trong runtime: gần747528/xa372112byte,37344/14496tam giác,20bone/10clip; kiểm GLB/alpha/dung lượng đạt. **Parent full PASS120ca thân +198ca mặt,0ca vượt ngưỡng/coverage**. Thânworststretch750 trongngưỡng300/900,tear20 trongngoạilệvòngchuông30; sink/float/flicker/mouth0,eye2. Mặtworstlid8,mouth10,rim11 trongngưỡng12; stray/eyes/silhouette0. Giữ nguyênmọingưỡng.

Các bước chốt: màu lông ngoàiactualopening được khớp reference±1px với cùngtolerance0,08 của stray (đã chứng minhcácdấu dưkhớplôngcũ); bên trongopening vẫn giữ kiểm màu/flat/rim. Dải nét mi được raycast3Dhai mép, kiểmwidth/extent và chỉ loại nét nhìnthấy đúngID; selftest cácvòngtrongmắt vẫn bắt nét vẽđè lênmi. Môi quanhlưỡi theo cùngcomponentliênthông; môi trùngrời vẫn cófixturethật. IDmiệng phânbiệt phầnink và surfacebịbodyche đểkhôngnhận vòngcổ là môi.

Sửa hìnhhọc miệng riêngcow: trụcjaw theo normalmõm, co tangentbằngs và depthbằngs², nângconstant0,4mm để da khôngxuyênqua; khôngthêm bone. Đã xác minhbađỉnhbịbáotrướccóalpha0 vàcắtcellngoàivùngink/unreferencedvertices. Thuphạmvimàumi trắng đểkhônglấnforehead ởprofile. Renderer/js game khôngđổi. Phim đượcchuẩnbị24fps, cótimeline vàSHAmodel; **chưa quayR17** trướcsoátảnh.

Selftest72 đangchạylạicuối; selftest71 đã PASS6plantthân+11plantmặt. TypesPASStrướcthayđổicuối, sẽchạylạicùngcấuhìnhcloud. Còn242ảnhnative1024/tựxem/ngườisoiđộclậpkhôngbiếtnộidungsửa, cácảnhchủkhoanh, phimnear/farphát1×tớiended, bathiếtbịvàmũitênvàngtắt, workingblend/báocáo cuối. Chưaapproval/chưa readyforRelease. KhôngMeshyAPI/creditmới; sheep/chicken dừng. SẽchạyCItoànrepo trênGitHub; khôngbáoCIxanh khi chưa cókếtquả.

### Soát ảnh 15/11/2026 04:59 AEDT — loại thử72 dù máy soi đạt

Selftest72 cuối đã đạt đủ 6 lỗi thân + 11 lỗi mặt cài thật; types và GLB đạt. Đã chụp đủ 242 ảnh native 1024px và 102 ảnh đối chiếu góc R16. Tuy nhiên parent mở ảnh nguyên cỡ phát hiện **vệt bầu dục xám còn quanh mi nhắm bên lông trắng**, rõ ở cheer m04/m07/left. Đã loại thử72, không coi máy soi 0 là đủ, không quay phim R17/hỏi duyệt. Người soi độc lập đang xem bộ72 mà không đọc code hoặc nội dung sửa; kết quả chưa có.

Nguyên nhân texture: mask xóa iris nhưng chưa đi hết sclera/bóng AO ấm quanh mắt; điều kiện màu chỉ nhận xám trung tính và donor boundary còn ghim bóng hốc mắt. Thử73 đang dựng: lấy thêm AO ấm nối trực tiếp với mắt trong giới hạn cũ, tăng bước lan đến hết crescent thật, chỉ ghim màu lông sạch. Giữ ranh bảo vệ lông/mày, hình mắt mở, actual aperture và mọi ngưỡng kiểm. Đang bổ sung phép kiểm vòng mi có texture vì phép kiểm contour đồng màu chưa bắt được lỗi này. Chưa có kết luận đạt cho73.

CI GitHub run43622973936 trên de621628b đang chạy, chưa báo xanh. Không Meshy/API/credit mới; sheep/chicken vẫn dừng. Bản R16 bị từ chối và các file gốc/30k/9k giữ nguyên.

### Soát độc lập 15/11/2026 05:09 AEDT — tiếp tục sửa

Người soi độc lập Boyle xem đủ **242/242 ảnh native1024** của thử72, không đọc nội dung sửa/code/log; kết luận REJECT: nét mi dạng dải cứng và một số khuyết nhỏ ở mép miệng/lưỡi (near cheer/jump below, surprised front; far cheer/jump/run/surprised/wag below). Parent đã mở ảnh xác nhận các khuyết. Báo cáo còn ghi nhận vệt nối oval quanh mắt nhưng phân biệt với style thân có sẵn. Không coi bộ72 là qua cổng.

Thử73/74 hết vệt oval rõ trong ảnh cận đã xem; máy soi nhanh còn stray ở vài điểm má của bản xa. Đang giới hạn vùng sửa theo actual aperture/bóng hốc, tránh flood xuống má hoặc lấy màu mõm chiếu lên má phía sau. Thử75 đang dựng thêm mi mềm, thuôn hai đầu, màu nâu tương phản thay dải be phẳng, và lưới miệng dày hơn/nâng 1,1mm theo normal để bỏ khuyết da xuyên. Bộ kiểm có thêm plant vòng mi mang texture, chưa chốt kết quả. Mọi ngưỡng giữ nguyên. Chưa phim/approval R17; không Meshy/credit mới.

### Tiếp tục 15/11/2026 10:33 AEDT — thử76, chưa đủ cổng duyệt

Fetch/pull nhánh hiện có, remote vẫn de621628b; giữ nguyên mọi thay đổi, không reset. Thử75/76 đã sửa khuyết miệng trong các ảnh native đã xem: tăng lưới cục bộ và nâng jaw theo normal 1,1mm; mi thuôn hai đầu, màu nâu có texture và cạnh mềm, giới hạn vùng AO theo bbox mắt thật để không lấn má. Metadata76 ghi bề rộng từng điểm của nét mi và dải 3D tương ứng, kiểm strict bắt thiếu/sai dữ liệu. Hai runtime GLB hiện là76: 777132/384984 byte, 38094/14906 tam giác, 20 bone/10 clip; GLB/alpha/dung lượng đạt.

**Kiểm nhanh76 chưa đạt: 1/18 ca rim13 vượt ngưỡng12 ở far cheer front**, các ca còn lại đạt (lid/mouth/eyes/silhouette0, stray worst5). Đã mở ảnh đánh dấu: cạnh sáng rất nhỏ ở góc trong mắt trắng, đang sửa màu chuyển tiếp; không tăng ngưỡng. Chưa chạy full/soát242ảnh/soi độc lập/phim/thiết bị cho76; không coi kết quả72 thay cho76. Báo cáo độc lập72 REJECT và danh sách242ảnh đã xem được lưu trong cow/wip-reviews/trial72/.

CI43622973936 trên runtime de621628b đã kết thúc failure ở collect; đang đọc artifact chi tiết, không báo xanh. Không Meshy/API/credit mới; số dư xác nhận cuối vẫn1574 ngày13/11, sheep/chicken dừng. WIP push không phải owner approval, không ready for Release.
