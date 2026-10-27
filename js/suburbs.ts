// Each city grows out along the road from its gate: a little neighbourhood of buildings that show what the
// place is famous for (a phở shop in Hà Nội, a woodblock painting workshop in Bắc Ninh, a Queenslander in
// Brisbane…). They are ordinary visitable homes (js/homes.js): their door says whose they are, "About"
// tells what makes them special and where they are, and you can go inside and meet who lives there.
// They stand on building lots that js/world.js levels and keeps clear of trees (LOTS).
import { THREE, toonVC } from './gfx.js';
import { heightAt, CITIES, LOTS } from './world.js';
import { houseTube, houseCottage, houseVillage } from './houses.js';
import { raisedHouse } from './town.js';
import { registerName } from './i18n.js';

const look = (style, color, hair, hairStyle, hat = 'none', skin = '#e8b48c') => ({ style, color, hair, hairStyle, hat, skin, back: 'none', glider: 0 });
const BLACK = '#1d1412', GREY = '#cfcfcf';
// [model, kind, room, name [en, vi], about [en, vi], person [name, look, kid, line, [side, out]]]
const SUBURBS = {
  hanoi: [
    [() => houseTube({ wall: '#f2d6a0', sign: ['Phở', 'Phở'] }), 'tube', 'tube', ['Grandma Hạnh’s phở shop', 'Quán phở bà Hạnh'],
      ['Phở comes from the north of Vietnam. Bà Hạnh simmers the beef bones all night so the broth is ready at sunrise, then adds rice noodles, herbs and a squeeze of lime.', 'Phở là món của miền Bắc. Bà Hạnh ninh xương bò suốt đêm để sáng sớm có nước dùng, rồi chan vào bánh phở, thêm rau thơm và vắt chanh.'],
      ['Bà Hạnh', look('aodai', '#7a5a9a', GREY, 'buns'), 0, ['A hot bowl of phở for breakfast is the Hà Nội way to start the day!', 'Sáng ra làm bát phở nóng là kiểu người Hà Nội đó cháu!'], [-1.8, .7]]],
    [() => houseTube({ wall: '#ffb3a0', floors: 2, sign: ['Hàng Mã', 'Hàng Mã'] }), 'tube', 'tube', ['Hàng Mã toy shop', 'Cửa hàng đồ chơi Hàng Mã'],
      ['In Hà Nội’s Old Quarter each street once sold one thing. Hàng Mã street sells paper toys, star lanterns and masks for the Mid-Autumn Festival.', 'Ở phố cổ Hà Nội, mỗi phố ngày xưa bán một mặt hàng. Phố Hàng Mã bán đồ chơi giấy, đèn ông sao và mặt nạ cho Tết Trung Thu.'],
      ['Cô Mai', look('dress', '#e8433a', BLACK, 'long'), 0, ['Would you like a star lantern? I fold every one by hand.', 'Con thích đèn ông sao không? Cô tự tay làm từng cái đó.'], [1.8, .7]]]
  ],
  bacninh: [
    [() => houseVillage({ wall: '#f2e2c0' }), 'village', 'village', ['The Đông Hồ painting workshop', 'Xưởng tranh Đông Hồ'],
      ['Đông Hồ pictures are printed with carved wooden blocks, one colour at a time, on paper shiny with crushed seashells. Families hang them at Tết for good luck.', 'Tranh Đông Hồ được in bằng ván gỗ khắc, mỗi lần một màu, trên giấy điệp óng ánh làm từ vỏ sò. Các gia đình treo tranh ngày Tết để lấy may.'],
      ['Ông Tú', look('tunic', '#6a4a2a', GREY, 'short'), 0, ['This picture is the pig family. Press the block down… and lift! See?', 'Bức này là tranh đàn lợn. Ấn ván xuống… rồi nhấc lên! Thấy chưa cháu?'], [-2.4, .9]]],
    [() => houseVillage({ wall: '#efe0bf', tile: '#a8483a' }), 'village', 'village', ['The Quan họ singers’ house', 'Nhà liền chị Quan họ'],
      ['Quan họ singers greet guests with betel and songs. Boys and girls take turns singing sweet answers to each other, and UNESCO protects this music.', 'Liền anh liền chị Quan họ đón khách bằng trầu và câu hát. Hai bên hát đối đáp với nhau, và UNESCO đã công nhận dân ca này.'],
      ['Chị Thơm', look('aodai', '#7a4a8a', BLACK, 'buns', 'nonla'), 0, ['Người ơi người ở đừng về… stay a little longer, friend!', 'Người ơi người ở đừng về… ở lại chơi thêm chút nữa nhé!'], [2.4, .9]]]
  ],
  danang: [
    [() => houseTube({ wall: '#ffe08a', sign: ['Mì Quảng', 'Mì Quảng'] }), 'tube', 'tube', ['Auntie Liên’s Mì Quảng shop', 'Quán Mì Quảng cô Liên'],
      ['Mì Quảng is a central Vietnamese noodle dish: wide yellow noodles, a little rich broth, peanuts, and a crunchy sesame rice cracker on top.', 'Mì Quảng là món của miền Trung: sợi mì vàng to bản, ít nước dùng đậm đà, đậu phộng và bánh tráng mè giòn rụm.'],
      ['Cô Liên', look('aodai', '#ff9f43', BLACK, 'long'), 0, ['Break the sesame cracker over the noodles, like this. Crunch!', 'Bẻ bánh tráng bỏ vô tô mì như vầy nè. Giòn rụm!'], [-1.8, .7]]],
    [() => houseCottage({ yard: false, wall: '#bfe0f0' }), 'cottage', 'cottage', ['Uncle Hải’s fishing house', 'Nhà chú Hải đánh cá'],
      ['Fishing families in Đà Nẵng paddle round basket boats called thúng chai. They spin them on the waves and bring fish home at dawn.', 'Các gia đình đánh cá ở Đà Nẵng chèo thuyền thúng tròn. Họ xoay thúng trên sóng và mang cá về lúc bình minh.'],
      ['Chú Hải', look('shirt', '#3a78c8', BLACK, 'short', 'nonla'), 0, ['My basket boat is round, so it can spin like a top!', 'Thuyền thúng của chú tròn vo, xoay vòng vòng như con quay vậy!'], [2.4, 1.2]]]
  ],
  saigon: [
    [() => houseTube({ wall: '#c8e6a0', sign: ['Cơm Tấm', 'Cơm Tấm'] }), 'tube', 'tube', ['Auntie Bảy’s cơm tấm shop', 'Quán cơm tấm dì Bảy'],
      ['Cơm tấm is broken rice, a favourite in the south: grilled pork, a fried egg, pickles and sweet fish sauce. Sài Gòn eats it any time of day.', 'Cơm tấm là món khoái khẩu miền Nam: sườn nướng, trứng ốp la, đồ chua và nước mắm ngọt. Người Sài Gòn ăn giờ nào cũng được.'],
      ['Dì Bảy', look('aodai', '#e8a0c0', BLACK, 'long'), 0, ['Sườn nướng thơm phức nè con! Smell the grilled pork!', 'Sườn nướng thơm phức nè con! Ăn một dĩa cho no nha!'], [-1.8, .7]]],
    [() => houseTube({ wall: '#f2c8e0', floors: 2, sign: ['Áo Dài', 'Áo Dài'] }), 'tube', 'tube', ['Auntie Vy’s áo dài tailor', 'Tiệm may áo dài cô Vy'],
      ['An áo dài is a long silk dress over trousers, Vietnam’s special outfit. Sài Gòn tailors measure you and sew one just for you.', 'Áo dài là tà áo dài thướt tha mặc với quần, trang phục đặc biệt của Việt Nam. Thợ may Sài Gòn đo người và may riêng cho từng người.'],
      ['Cô Vy', look('aodai', '#3cb0a0', BLACK, 'buns'), 0, ['Arms out! Let me measure you for a little áo dài.', 'Dang tay ra nào! Cô đo để may cho con một chiếc áo dài nhé.'], [1.8, .7]]]
  ],
  sydney: [
    [() => houseCottage({ yard: false, wall: '#ffe08a' }), 'cottage', 'cottage', ['The surf club cottage', 'Nhà câu lạc bộ lướt sóng'],
      ['Surf lifesavers in red and yellow caps watch the beaches of Sydney. Always swim between the red and yellow flags!', 'Đội cứu hộ đội mũ đỏ vàng canh các bãi biển Sydney. Luôn bơi giữa hai lá cờ đỏ vàng nhé!'],
      ['Coach Mia', look('shirt', '#e8433a', '#c98b4a', 'ponytail', 'cap', '#ffe3d1'), 0, ['Swim between the flags, and wave if you need help!', 'Bơi giữa hai lá cờ, cần giúp thì giơ tay vẫy nhé!'], [-2.4, 1.2]]],
    [() => houseCottage({ yard: false, wall: '#f2d6c0' }), 'cottage', 'cottage', ['The Paddington terrace house', 'Nhà phố liền kề Paddington'],
      ['Old terrace houses in Sydney stand in a row, joined together, with iron lace on their balconies like a paper doily.', 'Những ngôi nhà phố cổ ở Sydney đứng thành hàng, sát vách nhau, ban công có hoa văn sắt như ren giấy.'],
      ['Mrs Patel', look('dress', '#9a6ac0', BLACK, 'long', 'none', '#c98a5a'), 0, ['Come up to the balcony: you can see the Harbour Bridge!', 'Lên ban công đi: thấy cả Cầu Cảng Sydney đó!'], [2.4, 1.2]]]
  ],
  melbourne: [
    [() => houseCottage({ yard: false, wall: '#d0d0d8' }), 'cottage', 'cottage', ['The laneway café', 'Quán cà phê trong hẻm'],
      ['Melbourne has narrow laneways full of little cafés and colourful street art painted on the walls.', 'Melbourne có những con hẻm nhỏ đầy quán cà phê và tranh vẽ đường phố nhiều màu trên tường.'],
      ['Barista Leo', look('shirt', '#2a2a2a', '#3b2618', 'short', 'none', '#e0aa80'), 0, ['Hot chocolate with a marshmallow? Coming right up!', 'Sô-cô-la nóng với kẹo dẻo hả? Có ngay!'], [-2.4, 1.2]]],
    [() => houseCottage({ yard: true, wall: '#cfe6ee' }), 'cottage', 'cottage', ['Nana Joan’s footy house', 'Nhà bà Joan mê bóng bầu dục'],
      ['In Melbourne almost everyone barracks for a footy team. On game day families wear their team scarf and cheer!', 'Ở Melbourne gần như ai cũng cổ vũ một đội bóng bầu dục Úc. Ngày thi đấu cả nhà quàng khăn của đội và reo hò!'],
      ['Nana Joan', look('dress', '#2f5aa0', GREY, 'buns', 'none', '#ffe3d1'), 0, ['Carn the Blues! Want to kick the footy with me?', 'Cố lên đội Xanh! Đá bóng với bà không?'], [2.4, 1.2]]]
  ],
  brisbane: [
    [() => raisedHouse(), 'raised', 'raised', ['Grandpa Ray’s Queenslander', 'Nhà Queenslander của ông Ray'],
      ['A Queenslander is a wooden house up on stumps, with a big verandah all round, so cool air flows under it in the hot, wet summer.', 'Nhà Queenslander là nhà gỗ dựng trên cột, hiên rộng bao quanh, để gió mát thổi bên dưới trong mùa hè nóng ẩm.'],
      ['Grandpa Ray', look('shirt', '#5a8a4a', GREY, 'short', 'cap', '#ffe3d1'), 0, ['G’day! Sit on the verandah and listen to the kookaburras laugh.', 'Chào cháu! Ngồi hiên nghe chim kookaburra cười nè.'], [-2.4, 1.2]]],
    [() => houseCottage({ yard: false, wall: '#ffd8b0' }), 'cottage', 'cottage', ['Auntie Kim’s lamington bakery', 'Tiệm bánh lamington của cô Kim'],
      ['Lamingtons are squares of sponge cake dipped in chocolate and rolled in coconut, an Aussie favourite said to come from Queensland.', 'Lamington là bánh bông lan vuông nhúng sô-cô-la rồi lăn dừa nạo, món bánh Úc nổi tiếng nghe nói có từ bang Queensland.'],
      ['Auntie Kim', look('dress', '#ff7eb8', BLACK, 'ponytail', 'none', '#e8b48c'), 0, ['Fresh lamingtons! Mind the coconut on your nose!', 'Bánh lamington mới ra lò! Coi chừng dính dừa lên mũi nha!'], [2.4, 1.2]]]
  ]
};
// (their English names are in js/i18n.js)

export function createSuburbs(G) {
  const { scene, world } = G, built = [];
  for (const c of CITIES) {
    const list = SUBURBS[c.id]; if (!list) continue;
    LOTS.filter(L => L.city === c.id).forEach((L, k) => {
      const spec = list[k]; if (!spec) return;
      const [mk, kind, room, name, about, person] = spec, m = mk(), d = m.d || 7;
      // the house stands at the front of its levelled lot, facing the road
      const fx = Math.sin(L.rot), fz = Math.cos(L.rot), x = L.x + fx * (L.d - d) / 2 * .5, z = L.z + fz * (L.d - d) / 2 * .5, y = heightAt(x, z);
      const obj = m.obj || new THREE.Mesh(m.geo, toonVC()); obj.castShadow = obj.receiveShadow = true; obj.position.set(x, y, z); obj.rotation.y = L.rot; scene.add(obj);
      const r = Math.max(m.w || 7, d) / 2 * .8; world.boxes.push({ x0: x - r, x1: x + r, z0: z - r, z1: z + r });
      registerName(person[0]);
      world.houses.push({ x, z, rot: L.rot, d, kind, info: { kind, room, name, about, people: [person], city: c.name } });
      built.push(name[0]);
    });
  }
  return built;
}
