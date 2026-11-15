# Soi ảnh độc lập — r17-dev92

**Kết luận: CÒN LỖI. Đây là chẩn đoán WIP, không phải cổng duyệt cuối.**

Đã mở trực tiếp đủ **11/11 PNG native 1024 × 1024 bằng `view_image`**, từng file gốc. Chỉ đọc PNG ở `native-diagnostic/`; không đọc code, log, docs, lịch sử sửa, báo cáo cũ hoặc `views.json`. Không dùng browser/Blender, ảnh ghép hoặc ảnh resize thay thế. Không thay model/code.

Các lỗi nhìn thấy trong chính bộ ảnh này:

- **E1:** Nét nhắm mắt đen trên mảng lông đen thiếu tương phản. Nét trên lông trắng rõ hơn nhiều; biểu cảm hai bên không đọc cân bằng. File: `cow-near-cheer-front.png`, `cow-near-cheer-p04.png`, `cow-near-cheer-p07.png`, `cow-near-cheer-right.png`, `cow-near-cheer-neck.png`.
- **E2:** Vùng bầu dục nhạt dưới nét mắt bên lông trắng và lông kéo hướng về mũi tạo cảm giác mí tách khỏi lông mặt. File: `cow-near-cheer-front.png`, `cow-near-cheer-m04.png`, `cow-near-cheer-m07.png`, `cow-near-cheer-left.png`, `cow-near-cheer-above.png`.
- **E3:** Miệng oval đỏ sẫm/lưỡi hồng có mặt màu phẳng và cạnh sắc, thiếu chuyển tiếp độ sâu với mõm có texture. Miệng vẫn đọc được là mở. File: `cow-near-cheer-front.png`, `cow-near-cheer-below.png`, `cow-near-cheer-neck.png`.
- **E4:** Đường sáng/xám trắng mảnh tại mép trong/dưới mảng mặt đen, rõ nhất góc above. Đây là nhận xét ngoại quan về viền; ảnh không xác định nguyên nhân. File: `cow-near-cheer-above.png`, `cow-near-cheer-p04.png`, `cow-near-cheer-neck.png`.

Tọa độ dưới đây là ước lượng trên ảnh 1024 × 1024, gốc ở góc trên trái. “Trái/phải ảnh” chỉ vị trí trên ảnh, không chỉ bên giải phẫu của bò.

## cow-near-cheer-front.png

Đã thực sự xem: **có**, bản PNG gốc qua `view_image`.

- Mặt: Mặt và dáng đầu đọc rõ, mõm hồng có texture và hai lỗ mũi lõm.
- Nhắm mắt: Mắt phía trái ảnh rõ; mắt phía phải ảnh trên mảng đen rất tối, khó đọc. Dưới nét mắt trắng có vùng bầu dục nhạt, lông đổi hướng.
- Viền mặt: Đường bao đầu liền; mép trong/dưới mảng đen có đường sáng mảnh.
- Miệng: Miệng oval đỏ sẫm và lưỡi hồng có cạnh quá sắc, trông phẳng trên mõm.
- Vị trí: Mắt trắng khoảng x380–450,y455–520; mắt đen x570–645,y455–505; miệng x455–530,y675–715.
- Quyết định: **CÒN LỖI**.

## cow-near-cheer-p04.png

Đã thực sự xem: **có**, bản PNG gốc qua `view_image`.

- Mặt: Mặt ba phần tư đọc rõ, không thấy vỡ dáng đầu.
- Nhắm mắt: Mắt trên mảng đen phía phải ảnh có nét tối chìm vào lông; mắt trắng phía trái ảnh bị thu ngắn hợp góc nhìn nhưng vẫn đọc được.
- Viền mặt: Viền sáng mảnh dọc mép trong mảng đen, cạnh sống mũi.
- Miệng: Miệng có mặt màu phẳng, thiếu chuyển tiếp môi/độ sâu.
- Vị trí: Mắt đen khoảng x540–635,y450–495; viền mảng đen x515–545,y470–525; miệng x385–450,y670–715.
- Quyết định: **CÒN LỖI**.

## cow-near-cheer-m04.png

Đã thực sự xem: **có**, bản PNG gốc qua `view_image`.

- Mặt: Mặt và mõm liên tục, biểu cảm vui có thể nhận ra.
- Nhắm mắt: Mắt trắng rõ nhưng nằm trên vùng bầu dục nhạt có vân lông chạy khác hướng. Mắt đen nhỏ và thiếu tương phản.
- Viền mặt: Không thấy lỗ; mép mảng đen sát sống mũi hơi sáng.
- Miệng: Miệng như đồ họa oval dán lên mặt mõm.
- Vị trí: Mắt trắng x390–480,y455–525; mắt đen x595–635,y455–495; miệng x535–600,y675–715.
- Quyết định: **CÒN LỖI**.

## cow-near-cheer-p07.png

Đã thực sự xem: **có**, bản PNG gốc qua `view_image`.

- Mặt: Đầu nhìn nghiêng ba phần tư liền khối; mắt xa phần lớn khuất là phù hợp góc nhìn.
- Nhắm mắt: Nét nhắm mắt trên mảng đen khó tách khỏi nền lông; nhìn được khi chú ý nhưng yếu.
- Viền mặt: Mép trong mảng đen phía sống mũi có gờ/đường sáng mảnh; không thấy xuyên nền.
- Miệng: Miệng vẫn là mảng phẳng rõ cạnh ở đầu mõm.
- Vị trí: Mắt gần x515–615,y450–495; mép mảng x485–505,y470–530; miệng x345–405,y670–710.
- Quyết định: **CÒN LỖI**.

## cow-near-cheer-m07.png

Đã thực sự xem: **có**, bản PNG gốc qua `view_image`.

- Mặt: Mặt trắng chiếm chính, dáng đầu/mõm rõ.
- Nhắm mắt: Mắt trắng có nét nhắm rõ nhưng vùng ngay dưới là bầu dục nhạt và lông xoáy/kéo hướng. Mắt xa bị che gần hết.
- Viền mặt: Đường bao má/hàm liền, không thấy lỗ.
- Miệng: Miệng oval/lưỡi vẫn phẳng.
- Vị trí: Mắt trắng x410–510,y455–525; miệng x590–650,y675–715.
- Quyết định: **CÒN LỖI**.

## cow-near-cheer-right.png

Đã thực sự xem: **có**, bản PNG gốc qua `view_image`.

- Mặt: Profile bên mảng đen, đầu–hàm–cổ liên tục.
- Nhắm mắt: Nét mắt đen mảnh, rất ít tương phản; vùng lông quanh mắt khá tối.
- Viền mặt: Ranh đen/trắng dưới mắt có chuyển tiếp sáng; không thấy lỗ hay đứt silhouette.
- Miệng: Miệng phía trước mõm bị che bởi góc profile, không đủ thấy để kết luận ở ảnh này.
- Vị trí: Mắt x430–505,y450–490; mép mảng dưới mắt khoảng x415–700,y535–640.
- Quyết định: **CÒN LỖI**.

## cow-near-cheer-left.png

Đã thực sự xem: **có**, bản PNG gốc qua `view_image`.

- Mặt: Profile bên trắng, mặt/mõm không có lỗ rõ.
- Nhắm mắt: Mắt đọc được; ngay dưới nét mắt có vùng hình lá/bầu dục nhạt, vân lông bị kéo về sống mũi, tạo cảm giác mí gắn riêng.
- Viền mặt: Bao má và hàm liền; mảng đen cạnh tai không gây mất dáng đầu.
- Miệng: Miệng không thấy ở góc profile, không chấm sạch phần bị khuất.
- Vị trí: Mắt và vùng mí khoảng x520–610,y450–540, sát sống mũi phía phải ảnh.
- Quyết định: **CÒN LỖI**.

## cow-near-cheer-above.png

Đã thực sự xem: **có**, bản PNG gốc qua `view_image`.

- Mặt: Mặt nhìn từ trên vẫn đọc rõ; mũi che một phần phía dưới mặt.
- Nhắm mắt: Nét mắt bên trắng rõ, bên đen tối và yếu; dưới mắt trắng thấy dải bầu dục nhạt/vân lông kéo.
- Viền mặt: Viền xám trắng mảnh lộ ở chân mảng đen phía phải ảnh, sát trên mõm.
- Miệng: Miệng chỉ còn lát mỏng đỏ sẫm ở mép dưới mõm; góc này không đủ đánh giá độ sâu.
- Vị trí: Mí trắng x375–455,y480–565; mắt đen x570–650,y480–540; viền dưới mảng đen x550–655,y555–600; miệng x460–525,y745–765.
- Quyết định: **CÒN LỖI**.

## cow-near-cheer-below.png

Đã thực sự xem: **có**, bản PNG gốc qua `view_image`.

- Mặt: Mặt dưới hàm và cổ liền; mõm che bớt vùng mắt theo góc nhìn.
- Nhắm mắt: Mắt trắng thấy cung đen; mắt trên mảng đen khó đọc, một phần do tương phản và mõm che.
- Viền mặt: Không thấy lỗ xuyên nền ở hàm/cổ hoặc đường bao mặt.
- Miệng: Miệng/lưỡi phẳng, cạnh sắc và thiếu tiếp giáp môi so với mõm có texture.
- Vị trí: Mắt x380–450,y440–480 và x560–640,y440–485; miệng x455–530,y565–615.
- Quyết định: **CÒN LỖI**.

## cow-near-cheer-neck.png

Đã thực sự xem: **có**, bản PNG gốc qua `view_image`.

- Mặt: Góc chếch thấp cho thấy đầu/hàm/cổ liên tục, không thấy lỗ rõ.
- Nhắm mắt: Mắt gần trên mảng đen có nét rất tối, yếu; mắt xa chỉ còn đoạn nhỏ do khuất.
- Viền mặt: Có đường sáng mảnh ở mép trong mảng đen cạnh sống mũi; bao hàm liền.
- Miệng: Miệng đỏ/lưỡi hồng trông như đồ họa phẳng trên mõm.
- Vị trí: Mắt gần x505–605,y240–280; mép mảng x480–505,y255–305; miệng x340–405,y435–480.
- Quyết định: **CÒN LỖI**.

## cow-near-cheer-back.png

Đã thực sự xem: **có**, bản PNG gốc qua `view_image`.

- Mặt: Chỉ thấy gáy, tai, sừng và cổ; không thể chấm mặt trước.
- Nhắm mắt: Mắt bị che hoàn toàn, không đánh giá.
- Viền mặt: Đường bao gáy/tai/cổ liền ở phần thấy được; không thấy lỗ xuyên nền rõ.
- Miệng: Miệng bị che hoàn toàn, không đánh giá.
- Vị trí: Gáy giữa ảnh, mép tai hai bên và vùng cổ ngay trên vòng cổ.
- Quyết định: **SẠCH Ở PHẦN NHÌN THẤY; MẶT KHÔNG ĐÁNH GIÁ ĐƯỢC**.

## Phần đạt và giới hạn

- Mặt/mõm nhận ra là bò; màu cream/đen/hồng và texture/faceting chung được giữ làm phong cách, không bị chấm lỗi chỉ vì có facet.
- Không thấy lỗ xuyên nền rõ ở đầu/hàm/cổ trong 11 ảnh; không suy diễn vùng bị khuất là kín.
- Mắt xa bị khuất theo góc nhìn và mặt không thấy ở back là giới hạn quan sát, không tự coi là lỗi.
- Chỉ near-cheer, không có kết luận sleep/far hay animation từ bộ này.
- Không so sánh lịch sử phiên bản hoặc suy luận implementation.
- Đây là kết quả chẩn đoán WIP, không phải cổng duyệt cuối.

