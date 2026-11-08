// (v1.08 maths) How to play for the 21 new maths games (js/games/maths3.ts and maths4.ts), ready before a game opens: the
// TV button's guide film reads these steps aloud in both languages (recorded), with our own drawings.
import { HOWTO, type HowToGuide } from '../howto-registry.js';
const S = (pic: string, en: string, vi: string) => ({ pic, en, vi });
const GUIDES: Record<string, HowToGuide> = {
  mx_bonds: { steps: [S('mx:bonds 👀', 'The big number is made of two parts.', 'Số lớn được ghép từ hai phần.'), S('🔢 ❓', 'One part is shown. How many more make the big number?', 'Một phần đã có. Thêm mấy nữa thì thành số lớn?'), S('👆 ✅', 'Tap the missing part.', 'Chạm vào phần còn thiếu.')],
    real: S('✋ 🖐️', 'For real: hold up five fingers and hide some. How many are still up?', 'Thử thật: giơ năm ngón tay rồi giấu bớt. Còn mấy ngón đang giơ?') },
  mx_takeaway: { steps: [S('🍎 🔢', 'Count all the fruit.', 'Đếm hết số quả.'), S('mx:takeaway 👀', 'Some go away and fade.', 'Một vài quả bị lấy đi và mờ dần.'), S('👆 ✅', 'Tap how many are left.', 'Chạm số quả còn lại.')],
    real: S('🍪 🧒', 'For real: put out some biscuits, eat one, and count again.', 'Thử thật: bày vài cái bánh, ăn một cái, rồi đếm lại.') },
  mx_skip: { steps: [S('mx:skip 👀', 'The frog jumps the same number each time.', 'Chú ếch nhảy cùng một khoảng mỗi lần.'), S('🔢 ❓', 'Count in twos, fives or tens and find the gap.', 'Đếm thêm hai, năm hay mười và tìm chỗ trống.'), S('👆 ✅', 'Tap the missing number.', 'Chạm vào số còn thiếu.')] },
  mx_patterns: { steps: [S('mx:patterns 👀', 'Look at the shapes in a row.', 'Nhìn các hình xếp thành hàng.'), S('🔁 🤔', 'Find what repeats.', 'Tìm phần được lặp lại.'), S('👆 ✅', 'Tap the shape that comes next.', 'Chạm vào hình tiếp theo.')] },
  mx_shapehunt: { steps: [S('👂 mx:shapehunt', 'Listen for the shape to hunt.', 'Nghe tên hình cần tìm.'), S('🔍 👀', 'Look at every shape on the board.', 'Nhìn từng hình trên bảng.'), S('👆 ✅', 'Tap every one that matches.', 'Chạm vào tất cả các hình giống thế.')],
    real: S('🔍 🏠', 'For real: hunt for circles and squares around the house.', 'Thử thật: đi tìm hình tròn và hình vuông quanh nhà.') },
  mx_symmetry: { steps: [S('mx:symmetry 👀', 'Half a picture sits beside a red line.', 'Một nửa bức tranh nằm cạnh đường kẻ đỏ.'), S('🪞 🤔', 'The other half is like its mirror.', 'Nửa kia giống như hình soi gương.'), S('👆 ✅', 'Tap the half that matches.', 'Chạm vào nửa phù hợp.')],
    real: S('🦋 🎨', 'For real: paint on one half of a paper, fold it, and open it.', 'Thử thật: vẽ màu lên một nửa tờ giấy, gấp lại rồi mở ra.') },
  mx_heavy: { steps: [S('⚖️ 👀', 'Look at the balance.', 'Nhìn cái cân.'), S('mx:heavy 🤔', 'The heavier side goes down.', 'Bên nặng hơn sẽ chúc xuống.'), S('👆 ✅', 'Tap the heavier or the lighter one.', 'Chạm vào vật nặng hơn hoặc nhẹ hơn.')],
    real: S('🍎 🪶', 'For real: hold an apple in one hand and a feather in the other.', 'Thử thật: một tay cầm quả táo, một tay cầm lông chim.') },
  mx_full: { steps: [S('mx:full 👀', 'Look at the water in each glass.', 'Nhìn nước trong từng cốc.'), S('👂 🤔', 'Listen: full, empty, half, the most or the least?', 'Nghe kỹ: đầy, rỗng, một nửa, nhiều nhất hay ít nhất?'), S('👆 ✅', 'Tap the right glass.', 'Chạm vào cốc đúng.')],
    real: S('🥛 🫙', 'For real: pour water into cups at bath time.', 'Thử thật: rót nước vào cốc lúc tắm.') },
  mx_pizza: { steps: [S('🍕 👀', 'A pizza is cut into equal slices.', 'Bánh pizza được cắt thành các miếng bằng nhau.'), S('mx:pizza 🤔', 'Count the slices that are left.', 'Đếm số miếng còn lại.'), S('👆 ✅', 'Tap the pizza or the fraction that matches.', 'Chạm vào bánh hoặc phân số phù hợp.')] },
  mx_graph: { steps: [S('mx:graph 👀', 'Each column shows how many of one fruit.', 'Mỗi cột cho biết có bao nhiêu quả mỗi loại.'), S('🔢 🤔', 'Taller columns have more.', 'Cột cao hơn thì nhiều hơn.'), S('👆 ✅', 'Tap the answer.', 'Chạm vào câu trả lời.')] },
  mx_calendar: { steps: [S('mx:calendar 👀', 'Find today: the star or the circle.', 'Tìm hôm nay: ngôi sao hoặc vòng tròn.'), S('➡️ ⬅️', 'Tomorrow is next; yesterday is before.', 'Ngày mai ở phía sau; hôm qua ở phía trước.'), S('👆 ✅', 'Tap the day, the date or the month.', 'Chạm vào thứ, ngày hoặc tháng.')],
    real: S('📅 🏠', 'For real: cross off each day on a calendar at home.', 'Thử thật: gạch từng ngày trên tờ lịch ở nhà.') },
  mx_quarter: { steps: [S('mx:quarter 👀', 'The short hand shows the hour.', 'Kim ngắn chỉ giờ.'), S('🕒 🔢', 'The long hand shows the minutes.', 'Kim dài chỉ phút.'), S('👆 ✅', 'Tap the time the clock shows.', 'Chạm vào giờ đồng hồ đang chỉ.')],
    real: S('⏰ 🏠', 'For real: read the clock at lunch time.', 'Thử thật: xem đồng hồ vào giờ ăn trưa.') },
  mx_sudoku: { steps: [S('mx:sudoku 👀', 'Each row and each column has every number once.', 'Mỗi hàng và mỗi cột có đủ các số, mỗi số một lần.'), S('🔍 🤔', 'Look along the row and the column of the glowing square.', 'Nhìn theo hàng và cột của ô đang sáng.'), S('👆 ✅', 'Tap the number that fits.', 'Chạm vào số phù hợp.')] },
  mx_bigger: { steps: [S('mx:bigger 👀', 'Each car carries a number.', 'Mỗi chiếc xe mang một con số.'), S('🔢 🤔', 'Which number is bigger, or smaller?', 'Số nào lớn hơn, hay bé hơn?'), S('👆 🏁', 'Tap the car that wins.', 'Chạm vào chiếc xe thắng cuộc.')] },
  mx_doubles: { steps: [S('mx:doubles 👀', 'A ladybird has the same spots on both wings.', 'Bọ rùa có số chấm hai cánh bằng nhau.'), S('🔢 🔢', 'Double means the same number twice.', 'Gấp đôi là một số cộng với chính nó.'), S('👆 ✅', 'Tap the double.', 'Chạm vào số gấp đôi.')] },
  mx_tens: { steps: [S('mx:tens 👀', 'A tied bundle holds ten sticks.', 'Mỗi bó buộc dây có mười que.'), S('🔟 🔢', 'Count the bundles in tens, then the single sticks.', 'Đếm các bó theo chục, rồi đếm que lẻ.'), S('👆 ✅', 'Tap the number.', 'Chạm vào số đúng.')],
    real: S('🧱 🔟', 'For real: make towers of ten blocks and count them.', 'Thử thật: xếp các tháp mười khối rồi đếm.') },
  mx_missing: { steps: [S('mx:missing 👀', 'The number stones go in order.', 'Các viên đá số xếp theo thứ tự.'), S('🔢 ❓', 'Count on or back to find the gap.', 'Đếm tiếp hoặc đếm lùi để tìm chỗ trống.'), S('👆 ✅', 'Tap the missing number.', 'Chạm vào số còn thiếu.')] },
  mx_solids3d: { steps: [S('mx:solids3d 👀', 'Look at the thing or the solid shape.', 'Nhìn đồ vật hoặc khối hình.'), S('⚽ 🥫 📦', 'A ball is a sphere, a can is a cylinder, a box is a cuboid.', 'Quả bóng là khối cầu, cái lon là khối trụ, cái hộp là khối hộp chữ nhật.'), S('👆 ✅', 'Tap the answer.', 'Chạm vào câu trả lời.')],
    real: S('📦 🥫', 'For real: find a box, a can and a ball at home.', 'Thử thật: tìm một cái hộp, một cái lon và một quả bóng trong nhà.') },
  mx_leftright: { steps: [S('mx:leftright 👀', 'Your left hand is on this side, your right hand on that side.', 'Tay trái ở bên này, tay phải ở bên kia.'), S('⭐ 🤔', 'Some rounds have a star to start from.', 'Có lượt có ngôi sao để bắt đầu.'), S('👆 ✅', 'Tap the animal you hear.', 'Chạm vào con vật được gọi.')],
    real: S('✋ 🖐️', 'For real: wave your left hand, then your right hand.', 'Thử thật: vẫy tay trái, rồi vẫy tay phải.') },
  mx_sprint: { steps: [S('mx:sprint 👀', 'A sum appears.', 'Một phép tính hiện ra.'), S('🤔 ⏱️', 'Work it out in your head.', 'Tính nhẩm trong đầu.'), S('👆 🏁', 'Tap the answer and run to the finish.', 'Chạm vào đáp án và chạy về đích.')] },
  mx_grouping: { steps: [S('mx:grouping 👀', 'Things sit in equal groups.', 'Các đồ vật xếp thành các nhóm bằng nhau.'), S('🔢 🔢', 'Count in groups: 2, 4, 6, or 5, 10, 15.', 'Đếm theo nhóm: 2, 4, 6, hoặc 5, 10, 15.'), S('👆 ✅', 'Tap how many altogether.', 'Chạm vào tổng số.')],
    real: S('🧦 🧺', 'For real: count socks in pairs.', 'Thử thật: đếm tất theo từng đôi.') }
};
for (const [id, guide] of Object.entries(GUIDES)) if (!HOWTO[id] || (HOWTO[id].steps || []).length <= 1) HOWTO[id] = guide;
