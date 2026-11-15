# BLIND REVIEW — cow WIP

**Quyết định: REJECT cho bộ 12 ảnh này. Đây là chẩn đoán WIP, chưa phải approval cuối.**

Hai ảnh CLEAN, mười ảnh REJECT. Lý do chính: các tiếp giáp má–mõm góc cạnh ở một số ảnh near và các phiến lông/mép ghép lớn ở nhóm far. Không xác nhận miếng dán quanh mắt chỉ từ mảng lông đen; không thấy lỗ xuyên nền đủ chắc chắn.

## Phạm vi và giới hạn

- Chẩn đoán WIP của đúng 12 PNG đã mở; không phải approval cuối, không đại diện cho bản khác mà parent đang sửa/kiểm.
- Chỉ xem nguyên ảnh PNG native 1024×1024 bằng view_image; không montage, resize, crop, browser hoặc Blender.
- Không đọc code, log, docs, báo cáo lịch sử hay nội dung ngữ cảnh dự án; chỉ liệt kê tên PNG để chọn đúng bộ ảnh. Không sửa code/model.
- Tọa độ pixel ước lượng từ quan sát nguyên ảnh, gốc trên trái; bbox theo [x_min,y_min,x_max,y_max], có thể lệch vài pixel.
- Ảnh tĩnh không chứng minh nguyên nhân, độ sâu, topology, chuyển động hay chất lượng ở khoảng cách chơi thật. Tên near/far chỉ dùng để định danh ảnh, không suy ra thay đổi đã thực hiện.
- Không có lỗ xuyên nền được xác nhận chắc chắn. Rãnh tối/mép chồng được mô tả như hiện tượng nhìn thấy, không khẳng định mesh thủng.
- CLEAN nghĩa là chưa thấy lỗi chắc chắn trong ảnh thuộc phạm vi yêu cầu; không có nghĩa chứng nhận không lỗi. REJECT là cần xem lại các tiếp giáp nhìn thấy trong bộ WIP này.
- Chấp nhận phong cách stylized, nét mắt và miệng cartoon; không yêu cầu photorealism. Mảng lông đen/trắng, faceting đơn thuần và việc miệng khuất ở góc nghiêng không tự động là lỗi.

## Đúng 12 ảnh đã thực sự mở

| Ảnh trong `native-diagnostic/` | Quyết định |
|---|---|
| `cow-near-cheer-front.png` | CLEAN |
| `cow-near-cheer-p07.png` | REJECT |
| `cow-near-cheer-m07.png` | REJECT |
| `cow-near-cheer-left.png` | REJECT |
| `cow-near-cheer-right.png` | REJECT |
| `cow-near-sleep-front.png` | CLEAN |
| `cow-far-cheer-front.png` | REJECT |
| `cow-far-cheer-p07.png` | REJECT |
| `cow-far-cheer-m07.png` | REJECT |
| `cow-far-cheer-left.png` | REJECT |
| `cow-far-cheer-right.png` | REJECT |
| `cow-far-sleep-front.png` | REJECT |

## Quan sát từng ảnh

### cow-near-cheer-front.png — CLEAN

Mắt cười và miệng mở đọc rõ; đường bao đầu/mõm liền. Mảng đen bên phải ảnh có chuyển tiếp lông, chưa thấy viền miếng dán tách biệt.

Không ghi nhận lỗi chắc chắn theo các tiêu chí được yêu cầu.

### cow-near-cheer-p07.png — REJECT

Mắt gần đọc rõ, mắt phía khuất chỉ còn nét nhỏ do góc nhìn; không tự chấm nét đó là vỡ. Mảng đen lớn là pattern lông; không xác nhận viền dán quanh mắt.

- **N1**, bbox `(553, 649)–(594, 709)`: Tiếp giáp bên phải mõm trong ảnh có mấu trắng góc cạnh và bóng xám, đọc như mép chồng lên má thay vì hòa liền. Mức nhẹ nhưng thấy ở ảnh gốc.

### cow-near-cheer-m07.png — REJECT

Mắt cười và miệng còn đọc được. Đầu nhọn đen ở phía mắt khuất gần (606,512) chưa đủ để phân biệt pattern lông với mép nổi: không tính lỗi chắc chắn.

- **N2**, bbox `(413, 666)–(457, 711)`: Góc trái dưới mõm trong ảnh có nếp/mấu tam giác trắng-xám tách khỏi bề mặt má, làm tiếp giáp gãy cục bộ.

### cow-near-cheer-left.png — REJECT

Nét mắt cười rõ; miệng không thấy ở góc nghiêng này nên không kết luận miệng mất/vỡ. Đường bao đầu và hàm còn liên tục.

- **N3**, bbox `(344, 527)–(413, 714)`: Một chuỗi mép xiên/góc tam giác trên má trắng, dưới mảng đen gốc tai, tạo cảm giác các phiến lông không hòa vào mặt.
- **N4**, bbox `(544, 661)–(601, 713)`: Chân mõm có mấu tam giác trắng và rãnh xám rõ ở chỗ nối với má.

### cow-near-cheer-right.png — REJECT

Mắt màu xám đọc được trên nền lông đen nhưng tương phản thấp hơn phía mặt trắng. Không thấy một vòng viền dán khép kín quanh mắt.

- **N5**, bbox `(582, 602)–(720, 756)`: Trên má trắng dưới mảng đen có mép đa giác xiên, đổi hướng và sáng tối đột ngột thành mảng tách biệt; không chỉ là ranh màu đen/trắng.
- **N6**, bbox `(379, 530)–(455, 569)`: Chỗ nối sống mõm–mặt có các răng nhọn trắng ngang chồng lên vùng hồng, làm tiếp giáp lởm chởm.

### cow-near-sleep-front.png — CLEAN

Hai nét mắt cong xuống đọc được là ngủ; không có miệng mở vẫn phù hợp biểu cảm. Mép lông trên mõm hơi răng nhỏ, chưa đủ để gọi là vỡ hay miếng dán. Đầu/mõm liền.

Không ghi nhận lỗi chắc chắn theo các tiêu chí được yêu cầu.

### cow-far-cheer-front.png — REJECT

Nét mắt/miệng vẫn rõ. Các mặt phẳng trên mõm cũng nhìn thấy nhưng không tự coi mọi faceting là lỗi; lý do REJECT là các mép ghép lông nêu trên.

- **F1**, bbox `(443, 374)–(508, 522)`: Giữa mặt trắng, cạnh mắt và sống mũi có các phiến tam giác sáng/xám đổi hướng đột ngột, làm mặt trông ghép mảng.
- **F2**, bbox `(397, 748)–(566, 862)`: Phần cổ dưới cằm có các phiến trắng tam giác lớn với mép tối sắc, không hòa vào lông xung quanh.

### cow-far-cheer-p07.png — REJECT

Mắt gần và miệng đọc được. Không suy ra nguyên nhân kỹ thuật của các mép tối; không xác nhận lỗ xuyên.

- **F3**, bbox `(682, 481)–(790, 624)`: Phần dưới/bên phải mảng lông đen có nhiều phiến nhọn và mép sáng tối rời rạc; đây là sự đứt bề mặt nhìn thấy, vượt quá một đường ranh pattern đen/trắng.
- **F4**, bbox `(535, 712)–(748, 858)`: Dưới hàm xuống cổ có các phiến trắng dài, góc nhọn và khe tối giữa các mảng, làm lông giống các lá chồng rời.

### cow-far-cheer-m07.png — REJECT

Mắt/miệng rõ; phần đen phía mắt khuất không đủ chứng cứ để gọi là miếng dán. Không thấy lỗ xuyên nền chắc chắn.

- **F5**, bbox `(216, 633)–(312, 811)`: Má/cổ bên trái ảnh có nhiều tam giác trắng dài cạnh các rãnh tối, tiếp giáp gãy rõ.
- **F6**, bbox `(290, 716)–(442, 787)`: Dưới má tới hàm có dải mép đa giác ngang/xiên, tạo cảm giác lớp lông chồng riêng trên cổ.

### cow-far-cheer-left.png — REJECT

Mắt cười đọc rõ; miệng khuất ở góc này. Biên ngoài hàm không có lỗ xuyên nền rõ.

- **F7**, bbox `(333, 376)–(418, 694)`: Từ dưới gốc tai xuống má có đường nối răng cưa lớn với các bậc tam giác trắng/xám; bề mặt mặt không liền.
- **F8**, bbox `(166, 628)–(291, 839)`: Cổ trên vòng da có các phiến lông trắng dài tách mảng với rãnh tối sâu.
- **F9**, bbox `(542, 664)–(653, 722)`: Chân mõm có các mấu tam giác lớn trắng/hồng nối góc, làm tiếp giáp mõm–má gãy.

### cow-far-cheer-right.png — REJECT

Mắt xám vẫn đọc được nhưng tương phản thấp. Không xác nhận vòng dán riêng quanh mắt hoặc lỗ xuyên nền.

- **F10**, bbox `(588, 491)–(741, 640)`: Trên má đen dưới mắt và trước tai có các phiến tối đa giác chồng nhau; góc dưới nhô sắc và khác sáng tối, không chỉ đổi màu lông.
- **F11**, bbox `(510, 635)–(747, 804)`: Má trắng/cổ có nhiều miếng tam giác mép sắc và rãnh tối, lông không hòa vào bề mặt chung.
- **F12**, bbox `(373, 528)–(463, 578)`: Mép trắng trên sống mõm thành răng cưa dài chồng vào vùng hồng.

### cow-far-sleep-front.png — REJECT

Hai nét mắt ngủ đọc rõ, không chấm nét cartoon là lỗi. Mép lông trên mõm có răng nhỏ nhưng không dùng riêng điều đó để kết luận vỡ.

- **F13**, bbox `(411, 345)–(508, 549)`: Trán xuống sống mũi trắng có các miếng tam giác sáng/xám cạnh sắc, làm lông mặt bị chia phiến.
- **F14**, bbox `(530, 783)–(667, 911)`: Vùng trắng bên phải chuông trong ảnh có các tam giác lớn đổi sáng tối và mép nối rõ, tạo cảm giác lông chắp mảnh.

## Phân biệt pattern và viền dán

Mảng đen quanh mắt bên phải ảnh front tiếp nối lên trán/gốc tai, có chi tiết lông và ranh đen–trắng; riêng điều này phù hợp pattern lông bò. Các nét cong đen trên mặt trắng và xám trên mặt đen được đọc là mắt cartoon có chủ ý; hình miệng tối với phần hồng cũng đọc được theo cùng phong cách. Chưa có bằng chứng đủ chắc cho một vòng viền miếng dán tách biệt bao quanh mắt.

Những lỗi ghi ở trên có mép nhọn, bậc đa giác hoặc đổi sáng tối nội bộ ngay trong vùng lông cùng màu, hay ở chỗ mõm nối má. Chúng được ghi là lỗi tiếp giáp nhìn thấy; không kết luận cách dựng hoặc các thay đổi từng làm. Sự khác nhau giữa hai nhóm ảnh chỉ là quan sát của bộ ảnh hiện có.
