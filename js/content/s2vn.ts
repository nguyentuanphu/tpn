// (v1.08d s2vn, owner 3 and 5 Nov 2026 AEDT: docs/cores/tasks/v108d/s2vn-brief.md) Season 2, Vietnam: after Tết the
// lantern story goes on to four more places of Vietnam: the Mekong's floating markets, Hạ Long Bay, the Sapa rice
// terraces and the Central Highlands' gongs. Each region is a small new area on free ground beside a road (no place on
// the map moves), with a landmark, a new friend, a local food (a seller for the food passport and a recipe for cooking),
// three games, a bus stop and a place to fly to; its lantern-story chapter is js/content/chapter6.ts to chapter9.ts.
// A region opens on its day in the release calendar (js/content/releasecal-core.ts: "region:<id>"; testers 7 days
// early). js/s2vn.ts builds it. Pure data with no imports, so the voice tool reads every line; none has a child's name.

export type S2Look = { style: string; color: string; hair: string; hairStyle: string; hat?: string; skin: string; age?: string; back?: string; glider?: number };
export type S2Region = {
  id: string;                       // mekong, halong, sapa, taynguyen
  key: string;                      // the place id (fly list, region name, the story's visit): s2_<id>
  icon: string;                     // a drawing in js/art/s2vn.ts
  name: [string, string];
  at: [number, number]; r: number;  // the area's middle and its radius (a clearing: js/content/map.ts CLEARINGS)
  welcome: [string, string];        // said once as a child first walks in
  festival: [string, string];       // the real festival or season the region's opening is linked to
  landmark: { id: string; icon: string; name: [string, string]; fact: [string, string] };
  friend: { id: string; name: string; look: S2Look; hello: [string, string]; lines: [string, string][] };
  food: { id: string; seller: string; look: S2Look; food: [string, string, string, number]; greet: [string, string]; recipe: { id: string; icon: string; need: string[]; name: [string, string]; heal: number; bonus: number } };
  games: string[];
  chapter: string;
};

export const S2_REGIONS: S2Region[] = [
  { id: 'mekong', key: 's2_mekong', icon: 's2:mekong', name: ['Mekong Floating Market', 'Chợ nổi miền Tây'], at: [182, 169], r: 13,
    welcome: ['Welcome to the floating market! Boats come from every river of the Mekong to sell their fruit.', 'Chào mừng con đến chợ nổi miền Tây! Ghe xuồng từ khắp sông rạch đổ về đây bán trái cây.'],
    festival: ['At Tết the floating market is full of flowers, and boats carry yellow apricot blossoms down the river.', 'Ngày Tết chợ nổi đầy hoa, ghe chở mai vàng xuôi theo dòng sông.'],
    landmark: { id: 's2l_caukhi', icon: 's2:caukhi', name: ['The Monkey Bridge', 'Cầu khỉ'], fact: ['A monkey bridge is a thin bamboo bridge over a canal, with one handrail. In the Mekong Delta children cross them every day to go to school!', 'Cầu khỉ là cây cầu tre nhỏ bắc qua kênh rạch, chỉ có một tay vịn. Ở miền Tây, nhiều bạn nhỏ đi qua cầu khỉ để đến trường mỗi ngày!'] },
    friend: { id: 's2f_uthoa', name: 'Út Hoa', look: { style: 'tunic', color: '#3cc7e8', hair: '#1d1412', hairStyle: 'ponytail', hat: 'nonla', skin: '#e0a878' },
      hello: ['Hello! I paddle my family’s little boat to the floating market every morning.', 'Chào bạn! Sáng nào mình cũng chèo xuồng nhỏ của nhà ra chợ nổi đó.'],
      lines: [['Look up at the tall poles on the boats. Each boat hangs what it sells on top: that is the cây bẹo!', 'Bạn nhìn mấy cây sào cao trên ghe kìa. Ghe bán gì thì treo cái đó lên ngọn: gọi là cây bẹo đó!'],
        ['The Mekong splits into nine rivers before it reaches the sea. People call it Cửu Long, the Nine Dragons.', 'Sông Mê Kông chia thành chín nhánh trước khi ra biển. Người ta gọi là sông Cửu Long, chín con rồng đó.'],
        ['Try the bánh xèo! It sizzles in the pan, and that is how it got its name.', 'Bạn ăn thử bánh xèo đi! Đổ bánh kêu xèo xèo, nên mới có tên như vậy đó.']] },
    food: { id: 's2v_cobay', seller: 'Cô Bảy', look: { style: 'tunic', color: '#ff9f43', hair: '#1d1412', hairStyle: 'buns', hat: 'nonla', skin: '#d89a6a', age: 'adult' },
      food: ['s2:banhxeo', 'a crispy bánh xèo (a sizzling rice pancake)', 'cái bánh xèo giòn rụm', 6],
      greet: ['Bánh xèo, hot from the pan! Wrap it in a lettuce leaf and dip it in the sauce.', 'Bánh xèo nóng hổi nè con! Cuốn với rau sống, chấm nước mắm chua ngọt nha.'],
      recipe: { id: 'banhxeo', icon: 's2:banhxeo', need: ['rice', 'bean', 'herb'], name: ['Bánh xèo (sizzling rice pancake)', 'Bánh xèo'], heal: 3, bonus: .4 } },
    games: ['mk_sampan', 'mk_caybeo', 'mk_count'], chapter: 'ch6' },
  { id: 'halong', key: 's2_halong', icon: 's2:halong', name: ['Hạ Long Bay', 'Vịnh Hạ Long'], at: [221, 166], r: 11,
    welcome: ['Welcome to Hạ Long Bay! Almost two thousand stone islands rise out of the green sea.', 'Chào mừng con đến Vịnh Hạ Long! Gần hai nghìn hòn đảo đá nhô lên giữa biển xanh.'],
    festival: ['In spring the sea is calm, and the old wooden boats sail out between the islands with their brown sails.', 'Mùa xuân biển lặng, những chiếc thuyền gỗ giương cánh buồm nâu đi giữa các đảo đá.'],
    landmark: { id: 's2l_trongmai', icon: 's2:trongmai', name: ['The Rooster and Hen Rocks', 'Hòn Trống Mái'], fact: ['Two rocks stand face to face in the sea like a rooster and a hen. People call them Hòn Trống Mái, and they have stood together for thousands of years.', 'Hai hòn đá đứng đối mặt nhau giữa biển như một con gà trống và một con gà mái. Người ta gọi là Hòn Trống Mái, chúng đứng bên nhau hàng nghìn năm rồi.'] },
    friend: { id: 's2f_hai', name: 'Hải', look: { style: 'shirt', color: '#3b6fe0', hair: '#1d1412', hairStyle: 'short', hat: 'none', skin: '#d89a6a' },
      hello: ['Hi! I am Hải. My family lives in a fishing village that floats on the bay.', 'Chào bạn! Mình là Hải. Nhà mình ở làng chài nổi trên vịnh.'],
      lines: [['Hạ Long means where the dragon came down. The old story says a dragon dropped jewels into the sea, and they became the islands.', 'Hạ Long nghĩa là nơi rồng đáp xuống. Chuyện xưa kể rồng mẹ nhả ngọc xuống biển, ngọc biến thành các hòn đảo.'],
        ['Some islands have caves inside. One is called the Surprise Cave, because it is so big!', 'Có những hòn đảo bên trong có hang động. Một hang tên là hang Sửng Sốt, vì nó to quá trời!'],
        ['In my village the houses float on rafts, and we go to school by boat.', 'Ở làng mình nhà nổi trên bè, và tụi mình đi học bằng thuyền.']] },
    food: { id: 's2v_baclam', seller: 'Bác Lâm', look: { style: 'shirt', color: '#43c463', hair: '#5a5a5a', hairStyle: 'short', hat: 'cap', skin: '#c88a5a', age: 'elder' },
      food: ['s2:chamuc', 'a golden chả mực (Hạ Long squid cake)', 'miếng chả mực vàng ươm', 7],
      greet: ['Chả mực, the famous squid cakes of Hạ Long! Crispy outside and soft inside.', 'Chả mực Hạ Long nổi tiếng đây! Ngoài giòn, trong dai, thơm lừng nghe cháu.'],
      recipe: { id: 'chamuc', icon: 's2:chamuc', need: ['fish', 'egg'], name: ['Chả mực (Hạ Long squid cake)', 'Chả mực Hạ Long'], heal: 2, bonus: .4 } },
    games: ['hl_cave', 'hl_rocks', 'hl_nets'], chapter: 'ch7' },
  { id: 'sapa', key: 's2_sapa', icon: 's2:sapa', name: ['Sapa Rice Terraces', 'Ruộng bậc thang Sapa'], at: [173, -83], r: 10,
    welcome: ['Welcome to Sapa! The rice fields climb the mountains like giant green stairs.', 'Chào mừng con đến Sapa! Ruộng lúa leo lên núi như những bậc thang xanh khổng lồ.'],
    festival: ['In spring, peach and plum flowers bloom in Sapa, and the terraces fill with water that shines like mirrors.', 'Mùa xuân, hoa đào hoa mận nở khắp Sapa, ruộng bậc thang đầy nước lấp lánh như gương.'],
    landmark: { id: 's2l_terraces', icon: 's2:terraces', name: ['The Rice Terraces', 'Ruộng bậc thang'], fact: ['The H’Mông, the Dao and the other peoples of the mountains built these terraces by hand, long ago. Water flows down from one step to the next.', 'Người H’Mông, người Dao và các dân tộc vùng núi đã đắp những thửa ruộng bậc thang này bằng tay từ rất lâu. Nước chảy từ bậc trên xuống bậc dưới.'] },
    friend: { id: 's2f_my', name: 'Mỷ', look: { style: 'dress', color: '#2a3a7a', hair: '#1d1412', hairStyle: 'long', hat: 'none', skin: '#e8b48c' },
      hello: ['Hello! I am Mỷ. My family grows rice on the terraces, high up in the mountains.', 'Chào bạn! Mình là Mỷ. Nhà mình trồng lúa trên ruộng bậc thang, ở tít trên núi cao.'],
      lines: [['In spring we plant the rice. By autumn the terraces turn gold, and then we harvest.', 'Mùa xuân tụi mình cấy lúa. Đến mùa thu ruộng bậc thang chín vàng, rồi tụi mình gặt.'],
        ['My dress is dyed blue with indigo leaves, and my grandma stitched the patterns by hand.', 'Váy của mình được nhuộm chàm từ lá cây, còn hoa văn là bà mình tự tay thêu đó.'],
        ['The tall mountain over there is Fansipan, the highest mountain in Vietnam.', 'Ngọn núi cao đằng kia là Fansipan, ngọn núi cao nhất Việt Nam đó.']] },
    food: { id: 's2v_chipao', seller: 'Chị Pao', look: { style: 'dress', color: '#3a2a5a', hair: '#1d1412', hairStyle: 'buns', hat: 'none', skin: '#e0a878', age: 'adult' },
      food: ['s2:trungnuong', 'a grilled egg on a stick (Sapa street food)', 'quả trứng nướng Sapa', 4],
      greet: ['Warm grilled eggs! On a cold mountain evening they keep your hands warm.', 'Trứng nướng nóng hổi đây em! Chiều trên núi lạnh, cầm vào ấm cả tay.'],
      recipe: { id: 'trungnuong', icon: 's2:trungnuong', need: ['egg', 'herb'], name: ['Grilled eggs, Sapa style', 'Trứng nướng Sapa'], heal: 2, bonus: .3 } },
    games: ['sp_terrace', 'sp_seasons', 'sp_brocade'], chapter: 'ch8' },
  { id: 'taynguyen', key: 's2_taynguyen', icon: 's2:taynguyen', name: ['Central Highlands', 'Tây Nguyên'], at: [188, 58], r: 12,
    welcome: ['Welcome to the Central Highlands! Listen: can you hear the gongs?', 'Chào mừng con đến Tây Nguyên! Nghe kìa: con có nghe tiếng cồng chiêng không?'],
    festival: ['The gong music of the Central Highlands is a treasure of the whole world. At the gong festival, everyone dances round the fire together.', 'Cồng chiêng Tây Nguyên là di sản của cả thế giới. Ở lễ hội cồng chiêng, mọi người cùng nhảy múa quanh đống lửa.'],
    landmark: { id: 's2l_nharong', icon: 's2:nharong', name: ['The Nhà Rông', 'Nhà rông'], fact: ['The nhà rông is the village’s house for everyone, with a roof as tall and sharp as an axe blade. The village meets, sings and tells stories inside.', 'Nhà rông là ngôi nhà chung của buôn làng, mái cao vút như lưỡi rìu. Cả làng họp, hát và kể chuyện trong đó.'] },
    friend: { id: 's2f_ydam', name: 'Y Đam', look: { style: 'tunic', color: '#3a2a2a', hair: '#1d1412', hairStyle: 'short', hat: 'none', skin: '#b8784a' },
      hello: ['Hello! I am Y Đam. In my village we play the gongs, and the elephants help us carry things.', 'Chào bạn! Mình là Y Đam. Ở buôn mình, mọi người đánh cồng chiêng, còn voi thì giúp chở đồ.'],
      lines: [['Each person plays one gong. The big gongs sing low and the small gongs sing high, and together they make music.', 'Mỗi người đánh một chiếc chiêng. Chiêng lớn kêu trầm, chiêng nhỏ kêu bổng, hòa lại thành bài nhạc.'],
        ['Coffee grows on our red hills. The grown-ups love it, but it is not for children!', 'Cà phê mọc trên những ngọn đồi đất đỏ của buôn mình. Người lớn thích lắm, nhưng trẻ em thì chưa uống đâu!'],
        ['At Buôn Đôn the elephants are our friends. We feed them bananas and sugar cane.', 'Ở Buôn Đôn, voi là bạn của buôn làng. Tụi mình cho voi ăn chuối và mía.']] },
    food: { id: 's2v_bahlinh', seller: 'Bà H’Linh', look: { style: 'tunic', color: '#5a2a2a', hair: '#e8e8e8', hairStyle: 'buns', hat: 'none', skin: '#b8784a', age: 'elder' },
      food: ['s2:comlam', 'cơm lam (sticky rice cooked in bamboo)', 'ống cơm lam', 5],
      greet: ['Cơm lam! The rice is cooked inside a bamboo tube over the fire, so it smells of bamboo.', 'Cơm lam đây cháu! Gạo nếp nấu trong ống tre trên bếp lửa, thơm mùi tre lắm.'],
      recipe: { id: 'comlam', icon: 's2:comlam', need: ['rice', 'leaf'], name: ['Cơm lam (rice cooked in bamboo)', 'Cơm lam'], heal: 2, bonus: .4 } },
    games: ['tn_gong', 'tn_nharong', 'tn_elephant'], chapter: 'ch9' }
];
/** the words the regions share */
export const S2_LINES = {
  stop: ['Here is the bus stop for this place. The bus comes along the road.', 'Đây là trạm xe buýt của nơi này. Xe buýt chạy trên con đường kia.'],
  play: ['Let us play a game here!', 'Mình chơi một trò ở đây nhé!'],
  newPlace: ['A new place has opened in the valley! Look for it on your map.', 'Một nơi mới vừa mở trong thung lũng! Con tìm trên bản đồ nhé.'],
  soon: ['This place opens soon. Come back on its day!', 'Nơi này sắp mở. Con quay lại vào ngày mở nhé!']
};
export const regionOf = (id: string): S2Region | undefined => S2_REGIONS.find(r => r.id === id || r.key === id);
export const regionOfGame = (game: string): S2Region | undefined => S2_REGIONS.find(r => r.games.includes(game));
