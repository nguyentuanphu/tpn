// The festival hunt (owner, 13 Oct 2026 AEDT): in a festival's last week and on its day, five festival things are hidden
// among the decorations of its first place; finding all five gives a keepsake for the child's house and a festival
// badge in the Passport (js/festhunt.js). Each festival: what is hidden (its shape and its name, English and
// Vietnamese) and the line Ông Cú says when a child first comes to the festival's place (recorded; never a name).
export const HUNT = {
  tet: { shape: 'envelope', en: 'red envelopes', vi: 'bao lì xì', say: ['Five red envelopes are hidden among the Tết decorations. Can you find them?', 'Có năm bao lì xì giấu giữa đồ trang trí Tết. Con tìm được không?'] },
  ramthang1: { shape: 'lantern', en: 'little lanterns', vi: 'chiếc đèn lồng nhỏ', say: ['Five little lanterns are hidden for the First Full Moon. Can you find them?', 'Có năm chiếc đèn lồng nhỏ giấu cho Rằm tháng Giêng. Con tìm được không?'] },
  giotohung: { shape: 'flower', en: 'yellow flowers', vi: 'bông hoa vàng', say: ['Five yellow flowers are hidden for Hùng Kings’ Day. Can you find them gently?', 'Có năm bông hoa vàng giấu cho ngày Giỗ Tổ. Con nhẹ nhàng tìm nhé?'] },
  doanngo: { shape: 'dumpling', en: 'rice dumplings', vi: 'chiếc bánh ú', say: ['Five rice dumplings are hidden for Đoan Ngọ. Can you find them?', 'Có năm chiếc bánh ú giấu cho Tết Đoan Ngọ. Con tìm được không?'] },
  vulan: { shape: 'flower', en: 'red roses', vi: 'bông hồng đỏ', say: ['Five red roses are hidden for Vu Lan, to thank our parents. Can you find them?', 'Có năm bông hồng đỏ giấu cho lễ Vu Lan, để cảm ơn cha mẹ. Con tìm được không?'] },
  midautumn: { shape: 'mooncake', en: 'mooncakes', vi: 'chiếc bánh trung thu', say: ['Five mooncakes are hidden among the Mid-Autumn lanterns. Can you find them?', 'Có năm chiếc bánh trung thu giấu giữa những chiếc đèn Trung Thu. Con tìm được không?'] },
  ongtao: { shape: 'carp', en: 'golden carp', vi: 'chú cá chép vàng', say: ['Five golden carp are hidden for the Kitchen Gods’ Day. Can you find them?', 'Có năm chú cá chép vàng giấu cho ngày Ông Công Ông Táo. Con tìm được không?'] },
  thieunhi: { shape: 'balloon', en: 'balloons', vi: 'quả bóng bay', say: ['Five balloons are hidden for Children’s Day. Can you find them?', 'Có năm quả bóng bay giấu cho ngày Thiếu nhi. Con tìm được không?'] },
  quockhanh: { shape: 'star', en: 'gold stars', vi: 'ngôi sao vàng', say: ['Five gold stars are hidden for National Day. Can you find them?', 'Có năm ngôi sao vàng giấu cho ngày Quốc khánh. Con tìm được không?'] },
  nhagiao: { shape: 'flower', en: 'flowers for the teachers', vi: 'bông hoa tặng thầy cô', say: ['Five flowers for the teachers are hidden in town. Can you find them?', 'Có năm bông hoa tặng thầy cô giấu trong phố. Con tìm được không?'] },
  easter: { shape: 'egg', en: 'painted eggs', vi: 'quả trứng tô màu', say: ['Five painted eggs are hidden for Easter. Can you find them?', 'Có năm quả trứng tô màu giấu cho lễ Phục Sinh. Con tìm được không?'] },
  mothersday: { shape: 'heart', en: 'hearts for Mum', vi: 'trái tim tặng mẹ', say: ['Five hearts for Mum are hidden near home. Can you find them?', 'Có năm trái tim tặng mẹ giấu gần nhà. Con tìm được không?'] },
  fathersday: { shape: 'heart', en: 'hearts for Dad', vi: 'trái tim tặng bố', say: ['Five hearts for Dad are hidden near home. Can you find them?', 'Có năm trái tim tặng bố giấu gần nhà. Con tìm được không?'] },
  halloween: { shape: 'sweet', en: 'wrapped sweets', vi: 'viên kẹo', say: ['Five wrapped sweets are hidden among the pumpkins. Can you find them?', 'Có năm viên kẹo giấu giữa những quả bí ngô. Con tìm được không?'] },
  christmas: { shape: 'gift', en: 'little presents', vi: 'món quà nhỏ', say: ['Five little presents are hidden among the Christmas decorations. Can you find them?', 'Có năm món quà nhỏ giấu giữa đồ trang trí Giáng Sinh. Con tìm được không?'] },
  newyear: { shape: 'star', en: 'sparkly stars', vi: 'ngôi sao lấp lánh', say: ['Five sparkly stars are hidden for New Year’s Eve. Can you find them?', 'Có năm ngôi sao lấp lánh giấu cho đêm Giao thừa. Con tìm được không?'] },
  ausday: { shape: 'star', en: 'gold stars', vi: 'ngôi sao vàng', say: ['Five gold stars are hidden for Australia Day. Can you find them?', 'Có năm ngôi sao vàng giấu cho Ngày Nước Úc. Con tìm được không?'] },
  cleanup: { shape: 'litter', en: 'bits of litter', vi: 'mẩu rác', say: ['Five bits of litter are left lying about. Can you find them and tidy up?', 'Có năm mẩu rác bị bỏ lại. Con tìm và dọn sạch giúp nhé?'] },
  harmony: { shape: 'balloon', en: 'orange balloons', vi: 'quả bóng cam', say: ['Five orange balloons are hidden for Harmony Day. Can you find them?', 'Có năm quả bóng màu cam giấu cho Ngày Hòa hợp. Con tìm được không?'] },
  holi: { shape: 'paint', en: 'pots of colour', vi: 'hũ bột màu', say: ['Five pots of colour are hidden for Holi. Can you find them?', 'Có năm hũ bột màu giấu cho lễ Holi. Con tìm được không?'] },
  anzac: { shape: 'flower', en: 'red poppies', vi: 'bông anh túc đỏ', say: ['Five red poppies are hidden for Anzac Day. Can you find them quietly?', 'Có năm bông anh túc đỏ giấu cho Ngày Anzac. Con nhẹ nhàng tìm nhé?'] },
  reconciliation: { shape: 'hand', en: 'painted hands', vi: 'bàn tay tô màu', say: ['Five painted hands are hidden for Reconciliation Week. Can you find them?', 'Có năm bàn tay tô màu giấu cho Tuần lễ Hòa giải. Con tìm được không?'] },
  naidoc: { shape: 'boomerang', en: 'little boomerangs', vi: 'chiếc boomerang nhỏ', say: ['Five little boomerangs are hidden for NAIDOC Week. Can you find them?', 'Có năm chiếc boomerang nhỏ giấu cho Tuần lễ NAIDOC. Con tìm được không?'] },
  diwali: { shape: 'diya', en: 'little lamps', vi: 'ngọn đèn dầu nhỏ', say: ['Five little lamps are hidden for Diwali. Can you find them?', 'Có năm ngọn đèn dầu nhỏ giấu cho lễ Diwali. Con tìm được không?'] }
};
export const HUNT_LINES = {
  found: ['You found one! Keep looking.', 'Con tìm được một cái rồi! Tìm tiếp nhé.'],
  again: ['You found this one already. Look for another!', 'Cái này con tìm rồi. Tìm cái khác nhé!'],
  done: ['You found all five! Here is a keepsake for your house and a festival badge for your Passport.', 'Con tìm đủ năm rồi! Đây là quà lưu niệm cho nhà con và một huy hiệu lễ hội trong Hộ chiếu.']
};
