// (v1.08d s2au, owner 3 and 5 Nov 2026 AEDT: docs/cores/tasks/v108d/s2au-brief.md) Season 2, Australia: the three
// regions on the southern coast of the west bank (js/content/map.ts places gbr, tasmania, perth, rottnest). Each has a
// landmark, a friend villager (in the new style, with lines in English and Vietnamese), one local food (js/data.ts FEAST),
// three games (js/content/s2au-games.ts) at stands where the friend is their host, and a lantern chapter (10 to 12).
// A region opens on its day in the release calendar (js/content/releasecal-core.ts 'feature:s2au_<id>'); before that a
// sign says it is coming. Spots are metres from the place's anchor [dx, dz] (x east, z south). Plain data: js/s2au.ts
// places it, js/s2au-region.ts builds it when a child comes near. No names of children in any line (they are recorded).
// First Nations care (brief): the Traditional Owners are named plainly, with no invented stories.

export type Pair = [string, string];
export type S2Region = {
  id: 'gbr' | 'tas' | 'perth'; key: string; place: string; icon: string; name: Pair; chapter: string;
  friend: { id: string; name: string; look: Record<string, unknown>; at: [number, number]; greet: Pair; lines: Pair[]; host: Pair };
  food: { id: string; at: [number, number]; give: Pair; again: Pair; label: Pair };
  landmark: { id: string; icon: string; at: [number, number]; sign: [number, number]; name: Pair; fact: Pair };
  stands: [string, number, number][];    // [game id, dx, dz]
  soon: Pair;                            // the sign before its day (shown, not said)
};

export const S2_REGIONS: S2Region[] = [
  { id: 'gbr', key: 'feature:s2au_gbr', place: 'gbr', icon: 's2:reef', name: ['Great Barrier Reef', 'Rạn san hô Great Barrier'], chapter: 'ch10',
    friend: { id: 'mia', name: 'Mia', at: [-5, 1], look: { style: 'shirt', color: '#2f9a8a', hat: 'none', back: 'none', hair: '#3b2618', hairStyle: 'ponytail', skin: '#c8865a', age: 'adult', glider: 0 },
      greet: ['Hello! I am Mia, a ranger on the Great Barrier Reef. It is the biggest coral reef in the world!', 'Chào con! Chị là Mia, kiểm lâm ở rạn san hô Great Barrier. Đây là rạn san hô lớn nhất thế giới đó!'],
      lines: [['Aboriginal and Torres Strait Islander peoples are the reef’s Traditional Owners. They have cared for it for thousands of years.', 'Người Thổ dân và người dân đảo eo biển Torres là những người chủ truyền thống của rạn san hô. Họ đã chăm sóc nó hàng nghìn năm nay.'],
        ['When you snorkel, look but do not touch. Coral is alive!', 'Khi lặn ngắm, mình chỉ nhìn chứ không chạm nhé. San hô là sinh vật sống đó!'],
        ['Sea turtles come back to the beach where they hatched, to lay their own eggs.', 'Rùa biển quay về đúng bãi cát nơi chúng nở ra để đẻ trứng.'],
        ['Swim between the red and yellow flags. That is where the lifesavers watch.', 'Con nhớ bơi ở giữa hai lá cờ đỏ vàng nhé. Đó là chỗ các chú cứu hộ trông chừng.']],
      host: ['Come and play a reef game with me!', 'Lại đây chơi trò chơi rạn san hô với chị nhé!'] },
    food: { id: 'prawns', at: [6, 1], label: ['Grilled prawns', 'Tôm nướng'], give: ['Here are some grilled prawns from Queensland. Yum!', 'Tôm nướng của bang Queensland đây. Ngon lắm!'], again: ['The prawns are all eaten today. Come back tomorrow!', 'Hôm nay hết tôm nướng rồi. Mai con quay lại nhé!'] },
    landmark: { id: 'gbreef', icon: 's2:reef', at: [0, 36], sign: [-7, 5], name: ['The Great Barrier Reef', 'Rạn san hô Great Barrier'],
      fact: ['The Great Barrier Reef in Queensland is the biggest coral reef in the world. You can even see it from space! Thousands of kinds of fish, turtles and whales live there, and its Traditional Owners have cared for it for thousands of years.', 'Rạn san hô Great Barrier ở bang Queensland là rạn san hô lớn nhất thế giới, nhìn thấy được cả từ ngoài không gian! Hàng nghìn loài cá, rùa và cá voi sống ở đó, và những người chủ truyền thống đã chăm sóc nó hàng nghìn năm nay.'] },
    stands: [['s2a_snorkel', -9, -4], ['s2a_turtle', 0, -5], ['s2a_reefquiz', 9, -4]],
    soon: ['Coming soon: the Great Barrier Reef', 'Sắp mở: Rạn san hô Great Barrier'] }
];
export const regionOfGame = (id: string): S2Region | undefined => S2_REGIONS.find(r => r.stands.some(s => s[0] === id));
