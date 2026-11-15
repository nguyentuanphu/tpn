# BASELINE COMPARISON — PNG WIP

**18/20 bbox có hiện tượng tương ứng trong cả baseline và 99. N6/F12: dải răng trắng ngang dài chỉ thấy ở 99; baseline vẫn có mép nối nhỏ.**

Kết luận REJECT99 gốc được giữ nguyên. Có baseline không đồng nghĩa sạch: các bậc lông/phiến nhọn vẫn làm bề mặt má, mõm và cổ thiếu liền lạc. Đây là phân loại hiện tượng nhìn thấy, không xác nhận nguồn gốc kỹ thuật.

## Phạm vi và giới hạn

- Chỉ xem PNG nguyên ảnh qua view_image. Đã mở 24 PNG: 12 baseline và mở lại đủ 12 ảnh 99. Không crop, resize, montage, browser hoặc Blender.
- Không đọc code/log/docs/báo cáo trên đĩa. ID và bbox được lấy từ phần đánh giá đã có trong hội thoại, rồi kiểm lại trực tiếp trên PNG.
- Hai bộ cùng tên camera theo yêu cầu nhưng hình quan sát lệch ngang vài pixel, có chỗ khoảng 10–20 px; đối chiếu theo đặc điểm tương ứng, không giả định pixel trùng tuyệt đối. Bbox baseline chỉ là vùng tương ứng ước lượng bằng mắt.
- BOTH chỉ xác nhận hiện tượng tương ứng đã nhìn thấy trong baseline và 99; không chứng minh nguồn gốc kỹ thuật, cùng dữ liệu, hoặc thứ tự thay đổi.
- ONLY_99_FOR_SPECIFIC_SHAPE chỉ nói dải răng trắng ngang dài của N6/F12 không thấy ở baseline trong các PNG này. Baseline vẫn có mép nhỏ; không suy ra cơ chế hay trách nhiệm implementation.
- F1/F13 chỉ xác nhận phần hiện tượng nhìn được ở cả hai; vùng phẳng quanh mắt baseline che một phần nên các chi tiết con tại đó chưa xác định được.
- Không xác nhận lỗ xuyên nền. Mảng đen/trắng tự nó là pattern; nét mắt/miệng cartoon được chấp nhận. Các mép ghép rõ vẫn có ảnh hưởng dù cùng hiện diện ở baseline.
- Chẩn đoán WIP, không phải approval cuối. Hai báo cáo gốc BLIND-REVIEW.md và blind-reviewed.json cùng kết luận REJECT99 được giữ nguyên; không mở hoặc ghi lại chúng.

## Từng bbox đã đối chiếu

Tọa độ gốc trên trái, pixel native1024, bbox `(xmin,ymin)–(xmax,ymax)`. Cột baseline là vùng tương ứng ước lượng; không phải kết quả đăng ký ảnh hoặc đo tự động. Tên ảnh áp dụng cho cả hai thư mục.

| ID | PNG | Bbox 99 | Bbox baseline tương ứng | Phân loại |
|---|---|---|---|---|
| N1 | `cow-near-cheer-p07.png` | `[553, 649, 594, 709]` | `[562, 649, 605, 709]` | BOTH |
| N2 | `cow-near-cheer-m07.png` | `[413, 666, 457, 711]` | `[410, 666, 454, 711]` | BOTH |
| N3 | `cow-near-cheer-left.png` | `[344, 527, 413, 714]` | `[336, 527, 407, 714]` | BOTH |
| N4 | `cow-near-cheer-left.png` | `[544, 661, 601, 713]` | `[534, 661, 593, 713]` | BOTH |
| N5 | `cow-near-cheer-right.png` | `[582, 602, 720, 756]` | `[594, 602, 735, 756]` | BOTH |
| N6 | `cow-near-cheer-right.png` | `[379, 530, 455, 569]` | `[394, 526, 469, 576]` | ONLY_99_FOR_SPECIFIC_SHAPE |
| F1 | `cow-far-cheer-front.png` | `[443, 374, 508, 522]` | `[443, 374, 515, 522]` | BOTH |
| F2 | `cow-far-cheer-front.png` | `[397, 748, 566, 862]` | `[397, 748, 566, 862]` | BOTH |
| F3 | `cow-far-cheer-p07.png` | `[682, 481, 790, 624]` | `[690, 481, 801, 624]` | BOTH |
| F4 | `cow-far-cheer-p07.png` | `[535, 712, 748, 858]` | `[539, 712, 757, 858]` | BOTH |
| F5 | `cow-far-cheer-m07.png` | `[216, 633, 312, 811]` | `[212, 633, 308, 811]` | BOTH |
| F6 | `cow-far-cheer-m07.png` | `[290, 716, 442, 787]` | `[286, 716, 438, 787]` | BOTH |
| F7 | `cow-far-cheer-left.png` | `[333, 376, 418, 694]` | `[325, 376, 410, 694]` | BOTH |
| F8 | `cow-far-cheer-left.png` | `[166, 628, 291, 839]` | `[158, 628, 283, 839]` | BOTH |
| F9 | `cow-far-cheer-left.png` | `[542, 664, 653, 722]` | `[533, 664, 645, 722]` | BOTH |
| F10 | `cow-far-cheer-right.png` | `[588, 491, 741, 640]` | `[601, 491, 754, 640]` | BOTH |
| F11 | `cow-far-cheer-right.png` | `[510, 635, 747, 804]` | `[522, 635, 760, 804]` | BOTH |
| F12 | `cow-far-cheer-right.png` | `[373, 528, 463, 578]` | `[393, 526, 476, 582]` | ONLY_99_FOR_SPECIFIC_SHAPE |
| F13 | `cow-far-sleep-front.png` | `[411, 345, 508, 549]` | `[411, 343, 511, 546]` | BOTH |
| F14 | `cow-far-sleep-front.png` | `[530, 783, 667, 911]` | `[530, 778, 667, 906]` | BOTH |

## Bằng chứng và ảnh hưởng còn lại

**N1 — cow-near-cheer-p07.png — BOTH.** Mấu trắng và bóng xám ở chân phải mõm có ở cả hai bộ, lệch ngang nhẹ. Tiếp giáp mõm–má vẫn đọc như mép chồng nhỏ; ảnh hưởng nhẹ, không phải bằng chứng lỗi chỉ có ở 99.

**N2 — cow-near-cheer-m07.png — BOTH.** Mấu tam giác trắng-xám tại chân trái mõm có trong baseline và 99. Cùng làm chỗ nối mõm–má gãy cục bộ.

**N3 — cow-near-cheer-left.png — BOTH.** Mép xiên và các góc phiến trắng dưới mảng đen gốc tai có ở cả hai; ở near khá nhẹ. Cảm giác lớp lông trên má chưa liền; không đủ cơ sở quy là phát sinh ở 99.

**N4 — cow-near-cheer-left.png — BOTH.** Mấu trắng và rãnh xám ở chân mõm hiện diện trong cả hai ảnh. Vẫn làm tiếp giáp mõm–má gấp góc; baseline không làm lỗi này thành sạch.

**N5 — cow-near-cheer-right.png — BOTH.** Đường biên đa giác xiên và mảng sáng tối trên má trắng dưới lông đen có cả hai bộ. Má đọc thành phiến riêng; không chỉ là ranh màu đen/trắng.

**N6 — cow-near-cheer-right.png — ONLY_99_FOR_SPECIFIC_SHAPE.** 99 có các răng trắng dài nằm ngang tiến vào vùng mõm hồng. Baseline có mép trắng ngắn/răng nhỏ theo hướng dọc ở chân sống mũi, nhưng không thấy dải răng ngang dài tương ứng. Phần nhô dài làm tiếp giáp sống mõm lởm chởm rõ hơn ở 99. Kết luận chỉ-99 áp dụng cho hình răng ngang dài; không có nghĩa baseline hoàn toàn không có lỗi mép nối.

**F1 — cow-far-cheer-front.png — BOTH.** Các phiến sáng/xám trên phần sống mũi giữa mặt vẫn thấy ở baseline. Phần sát mắt trắng trong bbox bị vùng phẳng quanh mắt baseline che, nên không thể đối chiếu đầy đủ chi tiết con ở đó. Bề mặt chia phiến có ở cả hai; không khẳng định toàn bộ từng nét trong bbox giống nhau hoặc chỉ có ở 99.

**F2 — cow-far-cheer-front.png — BOTH.** Các phiến trắng lớn và cạnh tối dưới cằm, trên vòng cổ, có ở cả hai. Cổ trông như các lá tam giác ghép rời, ảnh hưởng rõ ở native1024.

**F3 — cow-far-cheer-p07.png — BOTH.** Các mép tối/sáng và phiến nhọn ở cạnh dưới-bên phải má đen đã thấy trong baseline. Lông má đen bị chia mảng; không quy chỉ từ pattern màu và không xác nhận lỗ xuyên.

**F4 — cow-far-cheer-p07.png — BOTH.** Phiến trắng dài và rãnh tối dưới hàm xuống cổ có cả hai bộ. Tiếp giáp lông cổ gãy rõ, vẫn là hạn chế nhìn thấy của cả hai.

**F5 — cow-far-cheer-m07.png — BOTH.** Các tam giác trắng dài cạnh khe tối ở cổ trái ảnh có trong baseline và 99. Cảm giác lớp lông tách rời khỏi khối cổ; không thấy bằng chứng riêng cho phát sinh mới.

**F6 — cow-far-cheer-m07.png — BOTH.** Dải mép đa giác dưới má/hàm tương ứng có ở cả hai bộ. Làm chuyển tiếp hàm–cổ đọc như lớp chồng.

**F7 — cow-far-cheer-left.png — BOTH.** Chuỗi bậc tam giác lớn từ dưới tai xuống má đã có trong baseline. Là đường nối lông răng cưa rõ, vẫn ảnh hưởng khối mặt liền lạc.

**F8 — cow-far-cheer-left.png — BOTH.** Các phiến trắng dài trên vòng da cùng các rãnh tối có ở cả hai ảnh. Lông cổ trông thành phiến rời; không coi baseline là tiêu chuẩn sạch.

**F9 — cow-far-cheer-left.png — BOTH.** Các mấu tam giác trắng/hồng ở chân mõm thấy cả trong baseline. Tiếp giáp mõm–má vẫn gãy góc trong cả hai.

**F10 — cow-far-cheer-right.png — BOTH.** Các phiến tối đa giác dưới mắt/trước tai và góc nhọn dưới má đen có ở cả hai bộ. Mảng đen có bậc bề mặt nhìn thấy, khác với chỉ là đổi màu lông; không kết luận cấu tạo hay thủng.

**F11 — cow-far-cheer-right.png — BOTH.** Mảng trắng tam giác cạnh sắc, rãnh tối trên má/cổ xuất hiện trong cả hai. Lông vẫn không hòa liền; ảnh hưởng rõ ở native1024.

**F12 — cow-far-cheer-right.png — ONLY_99_FOR_SPECIFIC_SHAPE.** 99 có dải răng trắng dài nằm ngang trên vùng mõm hồng. Baseline có ít mép nhỏ ở chỗ trắng-hồng gần dọc, không có dải nhô ngang dài cùng hình. Dải răng dài làm chỗ nối sống mõm nổi gắt hơn ở 99. Chỉ-99 chỉ mô tả hình thái này, không chứng minh nguyên nhân hoặc loại bỏ mép nối nhỏ của baseline.

**F13 — cow-far-sleep-front.png — BOTH.** Các phiến trán/sống mũi trung tâm sáng-xám có trong baseline. Phần sát mắt trắng thấp bên trái bị vùng phẳng baseline che, nên chưa so sánh được mọi chi tiết trong bbox. Mặt chia phiến vẫn có ở cả hai; không dùng vùng bị che để khẳng định có hay không một lỗi con mới.

**F14 — cow-far-sleep-front.png — BOTH.** Các tam giác lớn bên phải chuông và mép nối sáng tối tương ứng có ở cả hai. Lông thân/cổ trông chắp mảnh, ảnh hưởng rõ và vẫn cần được xem xét dù đã có baseline.

## Vùng mắt và biểu cảm

Ở cả near và far, baseline có vùng phẳng ít/không thấy lông quanh nét mắt: mảng kem ở mắt bên trái ảnh và mảng tối quanh mắt phía đen. Trong 99, các nét mắt nằm trên vùng có chi tiết lông, không thấy vòng phẳng tương tự rõ như baseline.

Đây là khác biệt bề mặt nhìn thấy vượt quá chỉ đổi màu pattern đen/trắng; chỉ gọi là cảm giác miếng phẳng, không kết luận cách tạo. 99 hòa lông quanh mắt tốt hơn trong các cặp này. Điều này không xóa các lỗi nối mõm/má/cổ.

Mắt cheer cong lên và sleep cong xuống vẫn đọc được. Nét xám trên lông đen ở 99 dễ thấy hơn nét nâu tối trong baseline; ở góc right, điểm trắng nhỏ gần đầu mắt baseline không còn thấy tương ứng trong 99. Không coi bản thân nét cartoon là lỗi.

Ví dụ vùng phẳng baseline: `cow-near-cheer-front.png` bbox (344,398)–(456,546); `cow-near-cheer-m07.png` (333,395)–(511,547); `cow-near-cheer-right.png` (417,397)–(601,552). Đã xem cả hai ảnh mỗi ví dụ.

## Danh sách đúng các PNG đã mở trong lượt so sánh

Baseline: `/workspace/cow-fit/r17-r16-baseline-native/`  
99: `/workspace/cow-fit/r17-dev99/native-diagnostic/`

Đã mở nguyên ảnh bằng `view_image` ở cả hai thư mục cho từng tên sau (24 tệp tổng cộng):

- `cow-near-cheer-p07.png`
- `cow-near-cheer-m07.png`
- `cow-near-cheer-left.png`
- `cow-near-cheer-right.png`
- `cow-far-cheer-front.png`
- `cow-far-cheer-p07.png`
- `cow-far-cheer-m07.png`
- `cow-far-cheer-left.png`
- `cow-far-cheer-right.png`
- `cow-far-sleep-front.png`
- `cow-near-cheer-front.png`
- `cow-near-sleep-front.png`

Hai cặp `cow-near-cheer-front.png` và `cow-near-sleep-front.png` không có bbox lỗi gốc; được mở bổ sung để hoàn tất so sánh 12 cặp và kiểm vùng mắt/biểu cảm. Danh sách đường dẫn đầy đủ nằm trong JSON.
