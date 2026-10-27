// Each city stands for its whole region (Sydney for New South Wales, Đà Nẵng for central Vietnam…), and each
// region has an animal that is its symbol, living in a corner of the city square: the koala of Queensland, the
// platypus of New South Wales, Victoria's little penguins, the Hoàn Kiếm turtle of Hà Nội, the water buffalo of
// the Kinh Bắc rice fields, the elephants of the central highlands, the sarus cranes (sếu đầu đỏ) of the Mekong, plus
// the emu in Aussie Corner, the panda in China Town and the peacock in India Village. Tap one to hear it; its
// ℹ️ tells what it is, a bit of history, and shows real photos.
import { T } from './i18n.js';
import { heightAt, WATER, PONDS, CITIES, CHINA, INDIA, AUSSIE } from './world.js';
import { animalModel } from './animals.js';
import { openPhotos } from './realworld.js';

// the wider region each city stands for
export const CITY_REGION = {
  sydney: ['New South Wales (NSW)', 'bang New South Wales (NSW)'], melbourne: ['Victoria (VIC)', 'bang Victoria (VIC)'], brisbane: ['Queensland (QLD)', 'bang Queensland (QLD)'],
  hanoi: ['Northern Vietnam', 'miền Bắc'], bacninh: ['Northern Vietnam · Kinh Bắc', 'miền Bắc · xứ Kinh Bắc'], danang: ['Central Vietnam', 'miền Trung'], saigon: ['Southern Vietnam', 'miền Nam']
};
export const regionLabel = id => CITY_REGION[id] ? T(CITY_REGION[id][0], CITY_REGION[id][1]) : '';

// [where, animal model, scale, sound, icon, name, about (what it is), history / story, photos (Wikipedia)]
type SymbolDefinition = [where: string, kind: string, scale: number, sound: string, icon: string, name: [string,string], about: [string,string], story: [string,string], wiki: string[]];
const SYMBOLS: SymbolDefinition[] = [
  ['brisbane', 'koala', 1.7, 'sniff', '🐨', ['The koala, symbol of Queensland', 'Gấu koala, biểu tượng bang Queensland'],
    ['Koalas live in gum trees and eat only eucalyptus leaves. They sleep up to 20 hours a day! A baby koala is called a joey and rides in its mum’s pouch.', 'Koala sống trên cây bạch đàn và chỉ ăn lá bạch đàn. Chúng ngủ tới 20 tiếng một ngày! Koala con gọi là joey, nằm trong túi của mẹ.'],
    ['In 1971 Queensland made the koala its animal emblem. Lone Pine in Brisbane, opened in 1927, is the world’s oldest koala sanctuary.', 'Năm 1971 bang Queensland chọn koala làm con vật biểu tượng. Lone Pine ở Brisbane, mở năm 1927, là khu bảo tồn koala lâu đời nhất thế giới.'], ['en:Koala']],
  ['sydney', 'platypus', 1.8, 'squeak', '🦫', ['The platypus, symbol of New South Wales', 'Thú mỏ vịt, biểu tượng bang New South Wales'],
    ['The platypus has a bill like a duck, a tail like a beaver and lays eggs, even though it is a mammal! It finds food in rivers with its eyes closed.', 'Thú mỏ vịt có mỏ như vịt, đuôi như hải ly và đẻ trứng, dù là động vật có vú! Nó nhắm mắt khi tìm mồi dưới sông.'],
    ['When scientists in England first saw a platypus in 1799, they thought someone had sewn a duck’s bill on as a joke! It became the animal emblem of New South Wales.', 'Năm 1799 lần đầu các nhà khoa học ở Anh thấy thú mỏ vịt, họ tưởng có người khâu mỏ vịt vào để đùa! Sau này nó thành con vật biểu tượng của bang New South Wales.'], ['en:Platypus']],
  ['melbourne', 'penguin', 2, 'honk', '🐧', ['The little penguins of Victoria', 'Chim cánh cụt nhỏ của bang Victoria'],
    ['Little penguins are the smallest penguins in the world, only about 33 cm tall. Every evening at sunset on Phillip Island, near Melbourne, they waddle home from the sea in a “penguin parade”.', 'Chim cánh cụt nhỏ là loài cánh cụt nhỏ nhất thế giới, chỉ cao khoảng 33 cm. Chiều nào lúc hoàng hôn ở đảo Phillip gần Melbourne, chúng lạch bạch từ biển về nhà trong “cuộc diễu hành cánh cụt”.'],
    ['People have watched the penguin parade since the 1920s. Victoria bought back the houses on the island to give the land to the penguins.', 'Người ta xem cuộc diễu hành cánh cụt từ những năm 1920. Bang Victoria đã mua lại nhà cửa trên đảo để trả đất cho chim cánh cụt.'], ['en:Little penguin', 'en:Phillip Island']],
  ['hanoi', 'turtle', 1.6, 'splash', '🐢', ['The golden turtle of Hoàn Kiếm Lake', 'Rùa vàng hồ Hoàn Kiếm'],
    ['Big soft-shell turtles lived in Hoàn Kiếm Lake in the middle of Hà Nội. The little Turtle Tower stands on an island in the lake.', 'Những cụ rùa mai mềm khổng lồ từng sống ở hồ Hoàn Kiếm giữa Hà Nội. Tháp Rùa nhỏ đứng trên đảo giữa hồ.'],
    ['The legend: King Lê Lợi borrowed a magic sword to free the country. After the war a golden turtle rose from the lake and took the sword back, so the lake was named Hoàn Kiếm, “Returned Sword”.', 'Truyền thuyết kể: vua Lê Lợi mượn gươm thần để đánh giặc cứu nước. Thắng giặc rồi, rùa vàng nổi lên đòi lại gươm, nên hồ có tên Hoàn Kiếm, nghĩa là “trả gươm”.'], ['en:Hoan Kiem turtle', 'en:Hoàn Kiếm Lake']],
  ['bacninh', 'calf', 1.7, 'moo', '🐃', ['The water buffalo of the northern rice fields', 'Con trâu của đồng lúa miền Bắc'],
    ['Water buffaloes pull the plough through the muddy rice fields and love to cool off in ponds. In the north, children ride on their backs and fly kites.', 'Trâu kéo cày trên ruộng lúa lầy lội và rất thích ngâm mình dưới ao. Ở miền Bắc, trẻ chăn trâu ngồi trên lưng trâu thả diều.'],
    ['“Con trâu là đầu cơ nghiệp”: the buffalo is the start of a farmer’s fortune. The Đông Hồ pictures of Bắc Ninh often show buffaloes, and Đồ Sơn holds a famous buffalo festival.', '“Con trâu là đầu cơ nghiệp”. Tranh Đông Hồ của Bắc Ninh hay vẽ con trâu, còn Đồ Sơn có lễ hội chọi trâu nổi tiếng.'], ['en:Water buffalo', 'en:Đông Hồ painting']],
  ['danang', 'elephant', .85, 'trumpet', '🐘', ['The elephants of central Vietnam', 'Voi của miền Trung và Tây Nguyên'],
    ['Asian elephants live in the forests of the Central Highlands. They are clever, gentle and remember friends for many years. A baby elephant drinks milk for two years.', 'Voi châu Á sống trong rừng Tây Nguyên. Voi thông minh, hiền lành và nhớ bạn bè rất lâu. Voi con bú sữa mẹ tới hai năm.'],
    ['Long ago the kings of Huế, the old capital of central Vietnam, rode elephants, and the Hai Bà Trưng sisters led their army on elephants. Today in Buôn Đôn people care for elephants and the Elephant Festival is held every spring.', 'Ngày xưa vua chúa ở kinh đô Huế cưỡi voi, còn Hai Bà Trưng cưỡi voi ra trận. Ngày nay ở Buôn Đôn người ta chăm sóc voi, mùa xuân có Lễ hội Voi.'], ['en:Asian elephant', 'en:Buôn Đôn district']],
  ['saigon', 'crane', 1.45, 'honk', '🦩', ['The sarus cranes of the Mekong', 'Sếu đầu đỏ miền Nam'],
    ['Sarus cranes are the tallest flying birds in the world, as tall as a grown-up. Their bright red heads give them their Vietnamese name, “red-headed crane”. They dance to find a partner!', 'Sếu đầu đỏ là loài chim biết bay cao nhất thế giới, cao bằng người lớn. Cái đầu đỏ tươi cho chúng cái tên “sếu đầu đỏ”. Chúng nhảy múa để tìm bạn!'],
    ['Every dry season they fly to Tràm Chim park in Đồng Tháp, in the Mekong Delta. The park was made in 1994 to keep their wetland safe.', 'Mùa khô hằng năm sếu bay về vườn quốc gia Tràm Chim ở Đồng Tháp, đồng bằng sông Cửu Long. Vườn được lập năm 1994 để giữ vùng đất ngập nước cho sếu.'], ['en:Sarus crane', 'en:Tràm Chim National Park']],
  ['aussie', 'emu', 1, 'chuff', '🪶', ['The emu of Australia', 'Chim đà điểu emu của Úc'],
    ['Emus are tall birds that cannot fly, but they can run very fast. The dad emu sits on the eggs and looks after the chicks.', 'Emu là loài chim cao không biết bay nhưng chạy rất nhanh. Bố emu ấp trứng và chăm chim con.'],
    ['The emu and the kangaroo are on Australia’s coat of arms because neither can walk backwards: the country always goes forward.', 'Emu và chuột túi có trên quốc huy nước Úc, vì cả hai không đi lùi được: đất nước luôn tiến về phía trước.'], ['en:Emu']],
  ['china', 'panda', 1.3, 'bleat', '🐼', ['The giant panda of China', 'Gấu trúc khổng lồ của Trung Quốc'],
    ['Giant pandas live in the bamboo mountains of Sichuan and eat bamboo for about 14 hours a day. A newborn panda is as small as a stick of butter!', 'Gấu trúc sống ở vùng núi tre Tứ Xuyên và ăn tre khoảng 14 tiếng mỗi ngày. Gấu trúc mới sinh chỉ nhỏ bằng thỏi bơ!'],
    ['China has sent pandas to zoos around the world as a sign of friendship, called “panda diplomacy”.', 'Trung Quốc gửi gấu trúc tới các sở thú khắp thế giới như món quà tình bạn, gọi là “ngoại giao gấu trúc”.'], ['en:Giant panda']],
  ['india', 'peacock', 1.3, 'squawk', '🦚', ['The peacock of India', 'Chim công của Ấn Độ'],
    ['The peacock is India’s national bird. To show off, he opens his tail like a giant fan covered in “eyes”. When the rain comes, peacocks dance!', 'Chim công là quốc điểu của Ấn Độ. Để khoe, công trống xòe đuôi như cái quạt lớn đầy những “con mắt”. Khi trời mưa, chim công nhảy múa!'],
    ['India made the peacock its national bird in 1963. The god Kartikeya rides a peacock, and Shah Jahan, who built the Taj Mahal, sat on the famous Peacock Throne.', 'Năm 1963 Ấn Độ chọn chim công làm quốc điểu. Thần Kartikeya cưỡi chim công, còn vua Shah Jahan, người xây đền Taj Mahal, ngồi trên Ngai Chim Công nổi tiếng.'], ['en:Indian peafowl']]
];

export function createSymbols(G, { sfx, dialog }) {
  const { scene, world } = G;
  const swordLake = PONDS.find(p => p.id === 'hoguom');
  const spotFor = id => {
    if (id === 'hanoi' && swordLake) return [swordLake.x+swordLake.r*.62, swordLake.z];
    const c = CITIES.find(k => k.id === id);
    if (c) { // a corner of the city square, away from the main street
      for (const [sx, sz] of [[1, -1], [-1, -1], [1, 1], [-1, 1]]) { const [x, z] = G.clearSpot(c.x + sx * (c.w - 3.5), c.z + sz * (c.d - 3.5), 1.4); if (Math.abs(x - c.x) < c.w + 4 && Math.abs(z - c.z) < c.d + 4) return [x, z]; }
      return [c.x + c.w - 3, c.z - c.d + 3];
    }
    if (id === 'china') return G.clearSpot(CHINA.x + 9, CHINA.z + 9, 1.4);
    if (id === 'india') return G.clearSpot(INDIA.x - 9, INDIA.z + 9, 1.4);
    return G.clearSpot((AUSSIE.x0 + AUSSIE.x1) / 2 + 12, AUSSIE.roadZ + 9, 1.4);
  };
  const live = [], tags = [];
  for (const [where, kind, scale, sound, icon, name, about, story, wiki] of SYMBOLS) {
    const [x, z] = spotFor(where), water = where === 'hanoi' && kind === 'turtle' ? swordLake : null, g = animalModel(kind); g.scale.setScalar(scale); g.position.set(x, water ? WATER-.12 : heightAt(x, z), z); scene.add(g);
    const A = { g, water, home: [x, z], tx: x, tz: z, wait: Math.random() * 4, speed: kind === 'turtle' || kind === 'koala' || kind === 'elephant' ? .45 : .8 };
    live.push(A);
    const speak = async () => {
      (sfx[sound] || sfx.pop)(); G.fx && G.fx(A.g.position.x, A.g.position.y + 2 * scale, A.g.position.z, '💛');
      const region = CITY_REGION[where];
      const k = await dialog(T(name[0], name[1]), [about, story, ...(region ? [[`Here it stands for all of ${region[0]}.`, `Ở đây nó đại diện cho cả ${region[1]}.`]] : [])],
        [['📷 See real photos', '📷 Xem ảnh thật'], ['👋 Bye', '👋 Tạm biệt']]);
      if (k === 0) await new Promise<void>(resolve => { const options = { icon, onClose: resolve }; openPhotos(T(name[0], name[1]), wiki, options); });
    };
    const it = { id: 'sym_' + where, x: water ? water.x + water.r + 1.2 : x, z, r: 2.6 * Math.max(1, scale * .8), icon, bubble: icon, label: () => T(name[0], name[1]), act: speak }; G.interactables.push(it); tags.push([it, A]);
  }
  // they wander a little round their spot (and the ℹ️ follows them)
  world.updaters.push((dt) => {
    for (const A of live) {
      const p = A.g.position; if (!G.heroes.some(h => Math.abs(h.pos.x - p.x) < 60 && Math.abs(h.pos.z - p.z) < 60)) continue;
      if (A.wait > 0) { A.wait -= dt; continue; }
      const dx = A.tx - p.x, dz = A.tz - p.z, d = Math.hypot(dx, dz);
      if (d < .1) {
        A.wait = 2 + Math.random() * 5;
        if (A.water) { // Stay in the eastern shallows: clear of Turtle Tower's islet and the bridge on the west.
          const a=(Math.random()-.5)*1.1, r=A.water.r*(.5+Math.random()*.15);
          A.tx=A.water.x+Math.cos(a)*r; A.tz=A.water.z+Math.sin(a)*r;
        } else { const a = Math.random() * Math.PI * 2, r = Math.random() * 2.2; [A.tx, A.tz] = G.clearSpot(A.home[0] + Math.cos(a) * r, A.home[1] + Math.sin(a) * r, .6); }
        continue;
      }
      const st = Math.min(d, A.speed * dt); p.x += dx / d * st; p.z += dz / d * st; p.y = A.water ? WATER-.12 : heightAt(p.x, p.z);
      A.g.rotation.y = Math.atan2(dx, dz);
    }
    for (const [it, A] of tags) { if (A.water) continue; it.x = A.g.position.x; it.z = A.g.position.z; }
  });
}
