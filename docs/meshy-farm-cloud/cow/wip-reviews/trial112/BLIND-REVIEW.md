# BLIND REVIEW — dev112 WIP

**REJECT trong phạm vi mắt/mi/chất lông quanh mắt và đường bao đầu. Chưa phải approval cuối; không chứng nhận toàn ảnh.**

Nét mắt/mi cartoon: 12/12 CLEAN. Chất lông quanh mắt: 12/12 REJECT (hai góc near trên mặt đen có mức nhẹ hơn). Đường bao đầu trong phần thấy được: 12/12 CLEAN. Lý do REJECT là mảng lông trơn và vệt kéo vòng quanh mắt; ở các ảnh far phía đen còn có đường gấp đa giác. Không dùng các lỗi má/cổ nguồn để quyết định điểm mắt.

## Phạm vi và giới hạn

- Đã mở đúng 12 PNG liệt kê trong JSON bằng view_image, nguyên ảnh native1024. Không mở ảnh bản khác trong lượt này; không crop, resize hoặc montage.
- Không đọc code, log, docs, báo cáo lịch sử hoặc nội dung sửa; không browser/Blender, không sửa model/code. Chỉ ghi hai tệp báo cáo được yêu cầu.
- Đánh giá mù theo ảnh hiện tại đối với mắt/mi, chất lông quanh mắt và đường bao đầu. Không suy luận implementation hoặc nội dung đã sửa.
- Có nhận biết từ hội thoại rằng nhóm má/cổ nguồn đã được đối chiếu trước; các ghi chú kế thừa chỉ dùng để tách phạm vi. Không khẳng định từng chi tiết má của dev112 đã có baseline khi chưa mở lại cặp baseline trong lượt này.
- Các khe tối tam giác trên má được ghi riêng với nguồn gốc chưa xác định, không tự gán kế thừa và không dùng chúng để REJECT phần mắt. Chưa xác nhận khe là lỗ xuyên, bóng hay mặt chồng chỉ từ PNG.
- Tọa độ bbox pixel ước lượng, gốc trên trái, [xmin,ymin,xmax,ymax], có thể lệch vài pixel. Không phải phép đo topology.
- Chấp nhận nét mắt/miệng cartoon và pattern lông đen/trắng. Mảng đen quanh mắt không tự nó là miếng dán. Lỗi được ghi vì có vùng trơn, vệt kéo vòng hoặc mép đa giác trong cùng màu lông; không khẳng định có miếng dán vật lý.
- CLEAN ở từng tiêu chí nghĩa là không thấy lỗi chắc chắn trong phần ảnh nhìn được; không đồng nghĩa toàn ảnh CLEAN. Nguồn má/cổ còn hạn chế và các vùng ngoài khung không được chứng nhận.
- Đây là chẩn đoán WIP, chưa phải approval cuối; ảnh tĩnh không xác minh chuyển động hoặc độ đọc ở kích thước chơi thực tế.

## Đúng 12 ảnh đã thực sự mở

Mọi tên dưới đây nằm trong `/workspace/cow-fit/r17-dev112/native-diagnostic/`. Bbox pixel nguyên ảnh, gốc trên trái.

| PNG | Mắt/mi | Lông quanh mắt | Biên đầu nhìn thấy | Bbox lông mắt chính |
|---|---|---|---|---|
| `cow-near-cheer-front.png` | CLEAN | REJECT | CLEAN | `[384, 449, 473, 523]` |
| `cow-near-cheer-p07.png` | CLEAN | REJECT | CLEAN | `[515, 443, 665, 542]` |
| `cow-near-cheer-m07.png` | CLEAN | REJECT | CLEAN | `[378, 435, 522, 525]` |
| `cow-near-cheer-left.png` | CLEAN | REJECT | CLEAN | `[463, 439, 591, 530]` |
| `cow-near-cheer-right.png` | CLEAN | REJECT | CLEAN | `[461, 439, 572, 540]` |
| `cow-near-sleep-front.png` | CLEAN | REJECT | CLEAN | `[380, 454, 480, 546]` |
| `cow-far-cheer-front.png` | CLEAN | REJECT | CLEAN | `[382, 441, 480, 526]` |
| `cow-far-cheer-p07.png` | CLEAN | REJECT | CLEAN | `[516, 392, 687, 546]` |
| `cow-far-cheer-m07.png` | CLEAN | REJECT | CLEAN | `[374, 429, 525, 532]` |
| `cow-far-cheer-left.png` | CLEAN | REJECT | CLEAN | `[459, 428, 598, 538]` |
| `cow-far-cheer-right.png` | CLEAN | REJECT | CLEAN | `[461, 393, 585, 549]` |
| `cow-far-sleep-front.png` | CLEAN | REJECT | CLEAN | `[377, 447, 483, 549]` |

## Quan sát quanh mắt theo từng PNG

- **cow-near-cheer-front.png**, bbox `[384, 449, 473, 523]`: Dưới nét mắt phía mặt trắng có mảng kem trơn dạng bầu, lông quanh đó kéo thành vòng. Đây là thay đổi chất bề mặt trong cùng màu trắng, không phải chỉ pattern đen/trắng.
- **cow-near-cheer-p07.png**, bbox `[515, 443, 665, 542]`: Quanh và dưới nét mắt gần trên nền đen có vùng bầu với các vệt lông quét cong, dẹt hơn nền bên trên. Hiệu ứng nhẹ hơn phía mặt trắng nhưng vùng mắt vẫn đọc thành một khu riêng.
- **cow-near-cheer-m07.png**, bbox `[378, 435, 522, 525]`: Dưới nét mắt trên mặt trắng có vùng bầu kem ít chi tiết lông, bao bởi vệt lông dài cuộn vòng; tạo cảm giác miếng trơn gắn trên mặt.
- **cow-near-cheer-left.png**, bbox `[463, 439, 591, 530]`: Vùng dưới nét mắt trắng trơn, kéo dài về sống mõm; biên được nhận ra nhờ các vệt lông cuộn và đổi hướng, không cần một vòng viền đen.
- **cow-near-cheer-right.png**, bbox `[461, 439, 572, 540]`: Vùng bầu quanh nét mắt xám có lông bị quét thành dải cong, độ chi tiết không đồng đều với phần trán đen. Hiệu ứng nhẹ nhưng nhìn được ở ảnh gốc.
- **cow-near-sleep-front.png**, bbox `[380, 454, 480, 546]`: Dưới nét mắt ngủ phía trắng có mảng kem trơn hình lá/bầu, các vệt lông vòng theo biên và kéo xuống dưới; không hòa đều vào lông má.
- **cow-far-cheer-front.png**, bbox `[382, 441, 480, 526]`: Mảng kem trơn dưới mắt trắng và vòng lông quanh nó hiện rõ. Ở mắt đen còn có các mặt đa giác đổi sáng tối phía trên nét mắt.
- **cow-far-cheer-p07.png**, bbox `[516, 392, 687, 546]`: Quanh mắt đen có mảng tối ít chi tiết lông, đường gấp đa giác phía trên nét mắt và các mẩu sáng nhỏ. Không coi nét mắt xám là lỗi; lỗi là độ liền của bề mặt bao quanh.
- **cow-far-cheer-m07.png**, bbox `[374, 429, 525, 532]`: Vùng bầu kem dưới mắt trắng gần như trơn, có biên lông quét vòng và các mặt sáng tối; cảm giác mảng riêng rõ hơn một vùng lông liên tục.
- **cow-far-cheer-left.png**, bbox `[459, 428, 598, 538]`: Mảng trơn kem dưới nét mắt kéo về mõm, mép lông vòng quanh và chia mặt phẳng; nhìn như một phiến riêng trong cùng màu lông trắng.
- **cow-far-cheer-right.png**, bbox `[461, 393, 585, 549]`: Phần trên mắt đen có đường gấp đa giác, đoạn sáng nhỏ ở mép; phía dưới nét mắt là mảng đen trơn khác với lông xung quanh. Không đủ để gọi là lỗ nhưng bề mặt mắt chưa liền.
- **cow-far-sleep-front.png**, bbox `[377, 447, 483, 549]`: Dưới mắt ngủ trắng có mảng trơn hình lá và lông kéo vòng; trên mắt đen còn có dải mặt gấp tối với đoạn sáng nhỏ.

Các cung mắt là biểu cảm có chủ ý: cheer cong lên, sleep cong xuống. Đường nét rõ, không bị yêu cầu đổi thành mắt thật. Các mảng kem trơn nằm ngay dưới nét mắt trắng nhìn như vùng bị dẹt/kéo, có biên bằng hướng lông dù không có vòng đen khép kín. Phía đen, sự khác biệt phải xét trong cùng nền đen; không gọi toàn bộ mảng lông bò là miếng dán.

## Má/cổ nguồn — ghi riêng, không chấm vào vùng mắt

- **cow-near-cheer-p07.png**, bbox `[553, 649, 594, 709]`: Mép góc cạnh ở chân mõm hoặc má/cổ còn thấy, ghi riêng với nhóm vùng nguồn đã đối chiếu; không đưa vào điểm chất lông quanh mắt.
- **cow-near-cheer-m07.png**, bbox `[413, 666, 457, 711]`: Mép góc cạnh ở chân mõm hoặc má/cổ còn thấy, ghi riêng với nhóm vùng nguồn đã đối chiếu; không đưa vào điểm chất lông quanh mắt.
- **cow-near-cheer-left.png**, bbox `[543, 661, 601, 714]`: Mép góc cạnh ở chân mõm hoặc má/cổ còn thấy, ghi riêng với nhóm vùng nguồn đã đối chiếu; không đưa vào điểm chất lông quanh mắt.
- **cow-near-cheer-right.png**, bbox `[582, 602, 720, 756]`: Mép góc cạnh ở chân mõm hoặc má/cổ còn thấy, ghi riêng với nhóm vùng nguồn đã đối chiếu; không đưa vào điểm chất lông quanh mắt.
- **cow-far-cheer-front.png**, bbox `[396, 746, 569, 864]`: Các phiến lông tam giác và mép sáng/tối ở má/cổ vẫn thấy. Ghi riêng vào nhóm hiện tượng nguồn đã được đối chiếu trước theo phạm vi người dùng; không dùng làm bằng chứng sạch của mắt hay toàn ảnh.
- **cow-far-cheer-p07.png**, bbox `[524, 711, 751, 859]`: Các phiến lông tam giác và mép sáng/tối ở má/cổ vẫn thấy. Ghi riêng vào nhóm hiện tượng nguồn đã được đối chiếu trước theo phạm vi người dùng; không dùng làm bằng chứng sạch của mắt hay toàn ảnh.
- **cow-far-cheer-m07.png**, bbox `[215, 632, 315, 813]`: Các phiến lông tam giác và mép sáng/tối ở má/cổ vẫn thấy. Ghi riêng vào nhóm hiện tượng nguồn đã được đối chiếu trước theo phạm vi người dùng; không dùng làm bằng chứng sạch của mắt hay toàn ảnh.
- **cow-far-cheer-left.png**, bbox `[165, 628, 294, 840]`: Các phiến lông tam giác và mép sáng/tối ở má/cổ vẫn thấy. Ghi riêng vào nhóm hiện tượng nguồn đã được đối chiếu trước theo phạm vi người dùng; không dùng làm bằng chứng sạch của mắt hay toàn ảnh.
- **cow-far-cheer-right.png**, bbox `[510, 635, 749, 804]`: Các phiến lông tam giác và mép sáng/tối ở má/cổ vẫn thấy. Ghi riêng vào nhóm hiện tượng nguồn đã được đối chiếu trước theo phạm vi người dùng; không dùng làm bằng chứng sạch của mắt hay toàn ảnh.
- **cow-far-sleep-front.png**, bbox `[530, 783, 668, 912]`: Các phiến lông tam giác và mép sáng/tối ở má/cổ vẫn thấy. Ghi riêng vào nhóm hiện tượng nguồn đã được đối chiếu trước theo phạm vi người dùng; không dùng làm bằng chứng sạch của mắt hay toàn ảnh.

Nhãn vùng nguồn ở đây là cách tách phạm vi theo yêu cầu, không phải kết quả mở lại baseline của dev112. Những hạn chế này vẫn có ảnh hưởng tới toàn ảnh; điểm CLEAN của nét mắt hoặc biên đầu không xóa chúng.

## Má có khe tối — chưa gán kế thừa

- **cow-near-cheer-front.png**, bbox `[672, 632, 698, 657]`: Các vết tối nhọn nhỏ trên má phải ảnh, dưới mép mảng đen.
- **cow-near-cheer-p07.png**, bbox `[621, 637, 693, 676]`: Chuỗi khe tối hình tam giác và mấu trắng ở giữa má trắng, dưới mắt đen.
- **cow-near-cheer-right.png**, bbox `[486, 644, 562, 682]`: Các khe tối và mấu trắng hình tam giác trên má trắng phía dưới mắt.
- **cow-near-sleep-front.png**, bbox `[694, 587, 713, 615]`: Vết tối nhỏ sát mép má phải ảnh; không đủ chứng cứ xác nhận xuyên nền.
- **cow-far-cheer-front.png**, bbox `[668, 625, 706, 672]`: Các khe tối nhọn trên má phải ảnh, tách khỏi vùng đánh giá mắt.
- **cow-far-cheer-p07.png**, bbox `[610, 626, 719, 687]`: Khe tối lớn hình tam giác và mấu trắng nhọn ở má dưới mắt đen.
- **cow-far-cheer-right.png**, bbox `[476, 630, 603, 695]`: Các khe tối tam giác lớn giữa má trắng và một mấu trắng nhọn ở giữa.
- **cow-far-sleep-front.png**, bbox `[689, 585, 715, 625]`: Vệt tối nhọn gần mép má phải ảnh; chưa xác nhận xuyên nền.

Các khe này đáng kiểm tra riêng vì làm má đọc thành chỗ khuyết/mép chồng. Không xác nhận lỗ xuyên nền hay gán nguồn gốc từ một ảnh tĩnh. Chúng không phải căn cứ thay thế cho lỗi lông quanh mắt đã nêu.
