// The map of the valley (round T, ARCHITECTURE §12 step 3): the one place that holds world coordinates.
// Plain data with no imports, so Node can read it too (tests/unit/map.test.mjs). js/world.js builds its exported
// places (VILLAGE, TOWN, CITIES, RIVER, BRIDGE…) from it, and every builder places its things as an offset from its
// place's anchor, so moving a place here moves everything in it.
// x runs east, z runs south (north is −z); 1 unit = 1 m.
// MAP_VERSION names the layout: 'C' is the valley as it was up to round S; 'D1' is Concept D stage T1 and 'D2' stage T2 (new rivers and lakes; a few places moved) (the owner's
// approved map, docs/concept-d/index.html: two banks, the home island with its ring road, mountains in the north, the
// coast in the south). A saved spot (profile.pos) is stamped with it (profile.posMap), so a later layout knows the spot
// belongs to an older map (js/main.js).
export const MAP_VERSION = 'D3';
// Heritage grounds belong to their district, beyond the small residential centre.
// Keep house anchors, IDs, saved positions and the D3 layout stamp unchanged.
export const HERITAGE_GROUNDS = {
  china: { radius: 52, south: -174 },
  india: { radius: 54, south: -174 }
} as const;
export function inHeritageGrounds(place: string, x: number, z: number): boolean {
  const ground = HERITAGE_GROUNDS[place];
  if (!ground) return false;
  const [cx, cz] = anchorOf(place);
  return z <= ground.south && z >= -WORLD.size/2+12 && Math.abs(x) <= WORLD.size/2-12 && Math.hypot(x - cx, z - cz) <= ground.radius;
}
// Is a saved spot, or the family's Studio content, made on this layout? Anything saved before round T has no stamp: it
// belongs to map 'C'. (A spot or Studio edit from an older layout is never used at the wrong place: js/main.js, js/world.js.)
export const onThisMap = stamp => (stamp || 'C') === MAP_VERSION;

// Road classes and their widths (rule R1 / ROAD-001; owner, 10 Oct AEST: asphalt 6.4 m, as the Concept D drawings show)
// (round T2, Concept D "B", owner: tinted asphalt) each asphalt road is tinted in its region's colour, white lines kept:
// red Vietnam, orange Australia, purple to the mountains, blue along the coast; 'home' is the plain grey of the island and its ring
export const ROAD_TONES = { home: null, vn: '#c0392b', au: '#e07b26', mountain: '#7d4fb0', coast: '#2f7ac8' };
export const ROAD_WIDTH = { asphalt: 6.4, dirt: 3.4, footpath: 1.6 };

// (Concept D map: drawing units × 8/7 = metres, the drawing's middle (210, 210) is (0, 0); north up)
export const WORLD = {
  size: 480, north: '-z', water: 0, riverDepth: 1.25,
  edge: [222, 252],                                // the wall of hills on the east, west and north rises between these distances from the middle
  coast: { z: 194, sea: -5 },                      // the southern coast: the sea from about z, with a sandy beach before it
  mountains: { z0: -150, z1: -238, pines: -150, region: -172 }, // the snowy belt in the north: starts rising at z0, full at z1; pines north of `pines`; "Snowcap Peaks" north of `region`
  wild: { x0: -215, x1: 215, z0: -150, z1: 180 },  // where wild dig spots, bushes and rocks are scattered (js/gather.js)
  summit: { x0: -220, x1: 220, z0: -236, z1: -176, zMin: -234 }, // where the snowman looks for the highest summit (js/secrets.js)
  keepLeft: [[-1e9, -76, -1e9, 1e9]],              // [x0, x1, z0, z1]: traffic keeps left here, as in Australia (the west bank; js/traffic.js)
  rooms: [-226, -226, 420],                        // [x, z, height]: inside a house, the room is built high above the far north-west corner, where nothing else is (js/homes.js)
  ramp: 40                                         // the gentle walk down from the Dawn Plateau runs this far south of its edge
};

// Places: `at` is the anchor [x, z]. Circles have r; boxes have w, d (half the width and depth, like the cities), so
// the box runs from at − w to at + w. h is the one flat level of a village, town or city (HANDOFF rule 10).
// street.roadZ: where a street place's main street runs, from the anchor. gates: road ends, from the anchor.
// A place with `place` instead of `at` sits at an offset (`off`) from that place's anchor.
// (Round U: Đà Nẵng 4.3 m and Brisbane 4.2 m, the height of the Dragon and Story bridges 6 m past their gates, so the road
// from the gate onto the bridge has no step; was 3 m)
export const PLACES = [
  // the home island in the middle of the river (owner's decisions 1 and 2): Ông Cú's plateau, Phố Hai Quê across it in
  // line with the two island bridges, Sunny Farm in the south
  { id: 'island', kind: 'island', cc: 'home', at: [9, -14], rx: 52, rz: 88 },
  { id: 'plateau', kind: 'site', cc: 'home', at: [9, -76], r: 24, h: 8 },   // the Dawn Plateau, Ông Cú's home (lowered so the path down stays gentle)
  { id: 'town', kind: 'street', cc: 'home', at: [9, -22], w: 26, d: 21, h: 4.6, street: { roadZ: -6 } },   // Two Homes Street (Phố Hai Quê): Bà Rịa meets a Sydney suburb
  { id: 'home', kind: 'village', cc: 'home', at: [9, 40], r: 28, h: 4 },   // Sunny Farm: house, field, barn and Mr. Bear's market
  // the east bank: Vietnam, north to south (Hà Nội, Bắc Ninh north-east of it, Làng Sen, Đà Nẵng, Hội An, Chợ Ba Miền, TP. HCM)
  { id: 'hanoi', kind: 'city', cc: 'vn', at: [153, -135], w: 13, d: 13, h: 5, icon: '🐢', name: ['Hà Nội', 'Hà Nội'], gates: [[0, 13]] },
  { id: 'bacninh', kind: 'city', cc: 'vn', at: [200, -172], w: 16, d: 13, h: 6, icon: '🕰️', name: ['Bắc Ninh', 'Bắc Ninh'], gates: [[-16, 0]] },
  { id: 'paddies', kind: 'site', cc: 'vn', at: [210, -98], r: 16, h: 3 },   // the rice fields (round T2: a little south-east, clear of Sông Hồng)
  { id: 'village', kind: 'village', cc: 'vn', at: [204, -42], r: 34, h: 2.4 },   // Lotus Village (Làng Sen)
  { id: 'lake', kind: 'lake', at: [120, -74], r: 22 },   // Mirror Lake (Hồ Gương) by Làng Sen, with Hạ Long Bay and the reef inside
  { id: 'danang', kind: 'city', cc: 'vn', at: [153, 7], w: 13, d: 11, h: 4.3, icon: '🐉', name: ['Đà Nẵng', 'Đà Nẵng'], gates: [[0, -11], [0, 11], [-13, 0]] },
  { id: 'hoian', kind: 'site', cc: 'vn', at: [170, 90], r: 14 },   // Hội An (the old town comes in a later stage; for now its landmark)
  { id: 'market', kind: 'street', cc: 'vn', at: [197, 114], w: 25, d: 13, h: 6, street: { roadZ: 0 } },   // Chợ Ba Miền, the Three Regions market
  { id: 'saigon', kind: 'city', cc: 'vn', at: [153, 151], w: 13, d: 11, h: 4, icon: '🛵', name: ['Hồ Chí Minh City', 'TP. Hồ Chí Minh'], gates: [[0, -11], [13, -6]] },
  // (round T3) Bà Rịa–Vũng Tàu, the seaside town south-east of TP. HCM: the lighthouse on the beach, Bạch Dinh, the kite
  // flyers of Bãi Sau, bánh khọt; reached by the red road from TP. HCM and by the boat down Sông Sài Gòn
  { id: 'vungtau', kind: 'city', cc: 'vn', at: [205, 151], w: 13, d: 11, h: 3.5, icon: '🏖️', name: ['Bà Rịa–Vũng Tàu', 'Bà Rịa–Vũng Tàu'], gates: [[-13, 0]] },
  // the west bank: Australia, north to south (Brisbane, Aussie Corner, Sydney, Melbourne; Uluru in the outback beyond the Great Dividing Range)
  { id: 'brisbane', kind: 'city', cc: 'au', at: [-132, -137], w: 13, d: 11, h: 4.2, icon: '🐨', name: ['Brisbane', 'Brisbane'], gates: [[0, 11], [0, -11]] },
  { id: 'aussie', kind: 'street', cc: 'au', at: [-100, -65], w: 18, d: 28, h: 4, street: { roadZ: 0 } },   // Aussie Corner (round T2: 6 m south, clear of the Brisbane River)
  { id: 'sydney', kind: 'city', cc: 'au', at: [-132, -4], w: 13, d: 13, h: 4, icon: '⛴️', name: ['Sydney', 'Sydney'], gates: [[0, -13], [0, 13]] },
  { id: 'melbourne', kind: 'city', cc: 'au', at: [-132, 126], w: 13, d: 13, h: 4, icon: '🚋', name: ['Melbourne', 'Melbourne'], gates: [[0, -13]] },
  { id: 'uluru', kind: 'site', cc: 'au', at: [-196, 62] },   // Uluru, the big red rock in the outback
  { id: 'apostles', kind: 'site', cc: 'au', at: [-160, 182] },   // the Twelve Apostles on the southern coast (js/regionsites.js): kept free of trees
  { id: 'bamboo', kind: 'site', at: [-186, -112], r: 28 },   // Whispering Bamboo
  // the northern mountains: China Town and India Village, on the mountain road from Brisbane to Hà Nội
  { id: 'china', kind: 'village', cc: 'asia', at: [107, -200], r: 22, h: 5.5 },
  { id: 'india', kind: 'village', cc: 'asia', at: [-94, -200], r: 22, h: 5.5 },
  // festival grounds (js/vnfun.js), kept free of trees: the buffalo pushing ring near Hà Nội and Bắc Ninh, the bull-race field west of Sài Gòn
  { id: 'choitrau', kind: 'ground', cc: 'vn', at: [75, -146] },   // (round T2: north of the ring road; Hồ Gươm took its old place)
  { id: 'duabo', kind: 'ground', cc: 'vn', at: [76, 110] },     // (round T3: outside the ring road's south-east bend; the eastern Memory Village took its old place)
  // (round T3) the two Memory Villages (Làng Kỷ Niệm), one on each bank: lanes of garden plots where families will put
  // the homes they remember (PLOTS below); the anchor is where the first lane leaves the main road
  { id: 'memory_e', kind: 'plots', cc: 'vn', at: [153, 90], name: ['Memory Village (east)', 'Làng Kỷ Niệm (bờ đông)'] },
  { id: 'memory_w', kind: 'plots', cc: 'au', at: [-129, 44], name: ['Memory Village (west)', 'Làng Kỷ Niệm (bờ tây)'] },     // (round T2: between the ring road and the Vietnam road; Sông Sài Gòn and the Mekong took its old place)
  // places inside places
  { id: 'playground', kind: 'site', place: 'town', off: [-4, 9], r: 13, h: 4.6 },   // the park on Two Homes Street, where kids from Australia and Vietnam play
  // (round R story) bà Huệ and ông Nghi's yard (js/yard.js): its own levelled plot behind the north row of Two Homes
  // Street, east of the houses, facing the street (+z)
  { id: 'yard', kind: 'plot', place: 'town', off: [28, -30], w: 15.5, d: 12, rot: 0, h: 4.6 }
];

// Water: one sea-level plane, and channels carved below it. The main river runs from the northern mountains to the sea,
// splitting round the home island; Sông Hàn comes in from the east at Đà Nẵng (the other rivers come in stage T2).
export const WATERS = [
  { id: 'main_n', kind: 'river', pts: [[-7, -252], [-3, -200], [2, -160], [6, -126], [9, -104]] },
  { id: 'main_w', kind: 'river', pts: [[9, -104], [-25, -96], [-47, -70], [-54, -14], [-47, 42], [-25, 74], [9, 86]] },
  { id: 'main_e', kind: 'river', pts: [[9, -104], [43, -96], [65, -70], [72, -14], [65, 42], [43, 74], [9, 86]] },
  { id: 'main_s', kind: 'river', pts: [[9, 86], [12, 120], [14, 160], [12, 200], [10, 252]] },
  { id: 'han', kind: 'river', pts: [[252, 37], [200, 36], [153, 37], [116, 37]] },
  { id: 'lake', kind: 'lake', place: 'lake' },
  // (round T2, the Concept D map) w: width against the main river's; tone: a tinted surface
  // Vietnam: Sông Hồng (the red river) from the north-east hills, past Hà Nội's south under Long Biên, through Hồ Gương and
  // under the ring road into the main river; the Hội An canal off Sông Hàn, under the Vietnam road and Chùa Cầu; Sông
  // Sài Gòn from the main river past TP. HCM to the sea; two Mekong channels down to the sea
  { id: 'hong', kind: 'river', w: .9, tone: '#b0643c', pts: [[238, -142], [196, -140], [180, -114], [166, -100], [140, -100], [126, -86], [110, -66], [104, -62], [66, -62]] },
  { id: 'hoian_canal', kind: 'river', w: .45, pts: [[125, 37], [125, 72], [238, 76]] },
  { id: 'saigon_r', kind: 'river', w: .8, pts: [[14, 142], [60, 140], [110, 140], [128, 146], [130, 160], [132, 186], [134, 204]] },
  { id: 'mekong1', kind: 'river', w: .45, pts: [[90, 140], [86, 170], [84, 204]] },
  { id: 'mekong2', kind: 'river', w: .45, pts: [[112, 140], [110, 172], [106, 204]] },
  // Australia: the Brisbane River from the western hills under the Story Bridge to the main river; Sydney Harbour, wide,
  // from the main river to Sydney under the Harbour Bridge; the Yarra under Princes Bridge; the Murray to the main river
  { id: 'brisbane_r', kind: 'river', w: .75, pts: [[-238, -66], [-196, -70], [-170, -84], [-156, -100], [-148, -106], [-116, -106], [-96, -114], [-70, -134], [-40, -150], [1, -156]] },
  { id: 'sydney_harbour', kind: 'river', w: 1.2, pts: [[-102, -2], [-54, -2]] },   // (its west end stops short of Sydney's square, which stays level and dry)
  { id: 'yarra', kind: 'river', w: .6, pts: [[-156, 84], [-146, 90], [-118, 90], [-96, 98], [-70, 118], [-36, 130], [12, 136]] },
  { id: 'murray', kind: 'river', w: .7, pts: [[-238, 150], [-190, 154], [-132, 154], [-80, 156], [-30, 162], [14, 168]] },
  // small round lakes: Hồ Gươm (Hoàn Kiếm Lake) by Hà Nội with the Turtle Tower in it; a billabong in the outback
  { id: 'hoguom', kind: 'pond', place: 'hanoi', off: [-29, 3], r: 10.5, islet: 2.6, depth: .8 },   // (the Turtle Tower stands on its little island; r89, owner: bigger and shallow enough to wade in)
  { id: 'billabong', kind: 'pond', at: [-204, 22], r: 8 }
];

// Bridges run along the x or the z axis, never diagonally: from a0 to a1 along it, centred on c across it; h is the deck.
export const BRIDGES = [
  { id: 'haique', axis: 'x', a0: 54, a1: 84, c: -28, w: 7.6, h: 3.7, bankOut: 26, over: 'main_e', style: 'plain', name: ['Phố Hai Quê Bridge', 'Cầu Phố Hai Quê'] },   // the home island's east bridge, from Phố Hai Quê to the ring road (round T2: the Harbour Bridge moved to Sydney)
  { id: 'island_w', axis: 'x', a0: -68, a1: -38, c: -28, w: 7.6, h: 4.9, over: 'main_w', style: 'plain' },   // the home island's west bridge (Round U: at the ring road's height, which it meets 7 m past its end)
  { id: 'ring_n', axis: 'x', a0: -10, a1: 18, c: -130, w: 7.6, h: 5.4, over: 'main_n', style: 'plain', name: ['North Ring Bridge', 'Cầu Vành Đai Bắc'] },   // the ring road over the river, north of the island
  { id: 'ring_s', axis: 'x', a0: -2, a1: 26, c: 104, w: 7.6, h: 5.4, over: 'main_s', style: 'plain', name: ['South Ring Bridge', 'Cầu Vành Đai Nam'] },   // and south of it
  { id: 'north', axis: 'x', a0: -12, a1: 16, c: -172, w: 7.6, h: 6, over: 'main_n', style: 'plain', name: ['Mountain Road Bridge', 'Cầu Đường Núi'] },   // the mountain road over the river
  { id: 'rong', axis: 'z', a0: 24, a1: 52, c: 153, w: 7.6, h: 4.4, over: 'han', style: 'dragon', landmark: 'dragonbridge' },   // Đà Nẵng's golden Dragon Bridge carrying the Vietnam road south over Sông Hàn
  // (round T2) every bridge landmark over its real water, and plain bridges where roads cross the new rivers
  { id: 'longbien', axis: 'z', a0: -113, a1: -87, c: 153, w: 7.6, h: 4.8, over: 'hong', style: 'longbien', landmark: 'longbien' },   // Long Biên: the Vietnam road over Sông Hồng, south of Hà Nội
  { id: 'ring_e', axis: 'z', a0: -75, a1: -49, c: 96, w: 7.6, h: 4.4, over: 'hong', style: 'plain' },   // the ring road over Sông Hồng
  { id: 'hoian_rd', axis: 'z', a0: 61, a1: 83, c: 153, w: 7.6, h: 4.3, over: 'hoian_canal', style: 'plain' },   // the Vietnam road over the Hội An canal (Round U: near the Dragon Bridge's height, 9 m away, so the road between them stays gentle)
  { id: 'chuacau', axis: 'z', a0: 65, a1: 79, c: 170, w: 3.2, h: 2.6, over: 'hoian_canal', style: 'chuacau', landmark: 'chuacau', foot: true },   // Chùa Cầu, the covered footbridge in Hội An, beside the road (owner, T2)
  { id: 'harbour', axis: 'z', a0: -22, a1: 18, c: -78, w: 7.6, h: 5.2, over: 'sydney_harbour', style: 'harbour', landmark: 'harbour' },   // the Sydney Harbour Bridge: the ring road over the harbour
  { id: 'story', axis: 'z', a0: -119, a1: -93, c: -132, w: 7.6, h: 4.4, over: 'brisbane_r', style: 'story', landmark: 'storybridge' },   // the Story Bridge: the Australia road over the Brisbane River
  { id: 'princes', axis: 'z', a0: 78, a1: 102, c: -132, w: 7.6, h: 4, over: 'yarra', style: 'princes', landmark: 'princes' }   // Princes Bridge: the Australia road over the Yarra, north of Melbourne
];

// Roads: asphalt roads join every village and city; dirt roads link the quieter places to each other.
// Each road is a list of [x, z] points. `gates` names the place at the start and at the end of the road:
// a golden welcome gate stands exactly there, across the road (js/roads.js). Roads that end on another road
// (a junction) have no gate at that end. A road with `loop` closes on itself (the ring road round the home island).
// js/world.js rounds the corners (fillets) and joins side roads onto the road they end on.
type MapRoad = { id: string; kind: string; pts: number[][]; tone?: string; loop?: boolean; gates?: (string | null)[] };
export const ROADS: MapRoad[] = [
  // the ring road round the home island (Concept D), over the river north and south of it
  { id: 'ring', kind: 'asphalt', tone: 'home', loop: true, pts: [[-30, -130], [48, -130], [96, -82], [96, 62], [48, 104], [-30, 104], [-78, 62], [-78, -82]] },
  // Phố Hai Quê runs across the island; a bridge at each end to the ring road
  { id: 'island_e', kind: 'asphalt', tone: 'home', pts: [[21, -28], [96, -28]], gates: ['town', null] },
  { id: 'island_w', kind: 'asphalt', tone: 'home', pts: [[-17, -28], [-78, -28]], gates: ['town', null] },
  // from the ring to each bank: Đà Nẵng in the east, Sydney in the west
  { id: 'link_vn', kind: 'asphalt', tone: 'vn', pts: [[96, 7], [140, 7]], gates: [null, 'danang'] },
  { id: 'link_au', kind: 'asphalt', tone: 'au', pts: [[-78, 30], [-132, 30]], gates: [null, null] },   // a square T onto the Australia road just south of Sydney
  // the Vietnam road, north to south
  { id: 'vn_north', kind: 'asphalt', tone: 'vn', pts: [[153, -122], [153, -4]], gates: ['hanoi', 'danang'] },
  { id: 'vn_south', kind: 'asphalt', tone: 'vn', pts: [[153, 18], [153, 140]], gates: ['danang', 'saigon'] },   // over Cầu Rồng
  { id: 'vn_vungtau', kind: 'asphalt', tone: 'vn', pts: [[166, 145], [174, 145], [184, 151], [192, 151]], gates: ['saigon', 'vungtau'] },
  { id: 'sg_quay', kind: 'footpath', pts: [[140, 156], [136, 156]] },   // (round T3) from TP. HCM's square to the boat's pier on Sông Sài Gòn   // (round T3) TP. HCM to Vũng Tàu
  { id: 'vt_beach', kind: 'footpath', pts: [[198, 162], [198, 181]] },
  // (round T3) the Memory Villages' lanes, off the Vietnam road and the Australia road
  { id: 'mv_e1', kind: 'dirt', pts: [[153, 90], [96, 90]] },
  { id: 'mv_e2', kind: 'dirt', pts: [[153, 110], [96, 110]] },
  { id: 'mv_w1', kind: 'dirt', pts: [[-132, 44], [-84, 44]] },
  { id: 'mv_w2', kind: 'dirt', pts: [[-132, 63], [-84, 63]] },   // (round T3) down to the Sài Gòn boat's pier on Bãi Sau
  { id: 'village_link', kind: 'asphalt', tone: 'vn', pts: [[153, -42], [171, -42]], gates: [null, null] },   // Lotus Village has its own old gate (cổng làng)
  { id: 'market_link', kind: 'asphalt', tone: 'vn', pts: [[153, 114], [172, 114]], gates: [null, null] },     // the market has its own gate
  // the Australia road, north to south
  { id: 'au_north', kind: 'asphalt', tone: 'au', pts: [[-132, -126], [-132, -17]], gates: ['brisbane', 'sydney'] },
  { id: 'au_south', kind: 'asphalt', tone: 'au', pts: [[-132, 9], [-132, 113]], gates: ['sydney', 'melbourne'] },
  { id: 'aussie_road', kind: 'asphalt', tone: 'au', pts: [[-132, -65], [-118, -65]], gates: [null, 'aussie'] },   // a square T off the Australia road (R5)
  // the mountain road over the north, from Brisbane to Hà Nội, with China Town and India Village
  { id: 'mountain', kind: 'asphalt', tone: 'mountain', pts: [[-132, -148], [-132, -172], [-104, -172], [-60, -172], [60, -172], [120, -172], [184, -172]], gates: ['brisbane', 'bacninh'] },
  { id: 'china_road', kind: 'asphalt', tone: 'mountain', pts: [[107, -172], [107, -178]], gates: [null, 'china'] },
  { id: 'india_road', kind: 'asphalt', tone: 'mountain', pts: [[-94, -172], [-94, -178]], gates: [null, 'india'] },
  // on the island: Sunny Farm, and the path up to Ông Cú
  { id: 'farm_road', kind: 'asphalt', tone: 'home', pts: [[40, -28], [40, -2], [29, 16]], gates: [null, 'home'] },
  // dirt roads
  { id: 'plateau_ramp', kind: 'dirt', pts: [[-6, -60], [-24, -44], [-24, -28]] },                  // down from the Dawn Plateau to the island road
  { id: 'village_lane', kind: 'dirt', pts: [[172, -42], [185, -42]] },                          // Lotus Village's lane, in through its old gate
  { id: 'paddies_lane', kind: 'dirt', pts: [[206, -72], [205, -86]] },                          // Lotus Village to the rice fields
  { id: 'hoian_walk', kind: 'footpath', pts: [[153, 96], [170, 96], [170, 56]] },                   // (round T2) into Hội An and north over Chùa Cầu to the canal's far bank
  // (round T2) footpaths down to the piers: the raft's stops by the bridges and the harbour ferry on the island
  { id: 'quay_north', kind: 'footpath', pts: [[22, -172], [22, -152], [12, -152]] },
  { id: 'quay_ring_n', kind: 'footpath', pts: [[24, -130], [24, -114], [16, -114]] },
  { id: 'quay_haique', kind: 'footpath', pts: [[50, -28], [50, -6], [60, -6]] },
  { id: 'quay_ring_s', kind: 'footpath', pts: [[32, 104], [32, 124], [22, 124]] },
  { id: 'quay_lake_e', kind: 'footpath', pts: [[153, -79], [139, -79]] },   // to the lake ferry's Làng Sen pier
  { id: 'quay_lake_s', kind: 'footpath', pts: [[153, -51], [124, -51]] },   // to the lake ferry's Đà Nẵng pier
  { id: 'quay_island', kind: 'footpath', pts: [[-30, -28], [-30, -3], [-37, -3]] },
  { id: 'uluru_track', kind: 'dirt', pts: [[-132, 64], [-150, 64], [-168, 56], [-184, 46]] },   // over the Great Dividing Range to Uluru
  // footpaths (R1, 1.6 m; Phase 2, round 30): Lotus Village's pond path (R11) carries on from the village lane round the
  // lotus pond's north and east sides, 8 m from its middle (1.5–2.5 m from the water), and ends at a bench; a short
  // path leaves it square (R5) to the little shrine at the foot of the banyan tree (js/lotus.js)
  ...(() => {
    const [vx, vz] = PLACES.find(p => p.id === 'village').at, cx = vx - 10, cz = vz + 4, arc = []; for (let a = 215; a <= 440; a += 15) arc.push([cx + 8 * Math.cos(a * Math.PI / 180), cz + 8 * Math.sin(a * Math.PI / 180)]);
    return [{ id: 'lv_pond', kind: 'footpath', pts: [[vx - 18, vz], ...arc] }, { id: 'lv_shrine', kind: 'footpath', pts: [[cx + 8, cz], [vx + 2.4, vz + 4]] }];
  })()
];

// (none in this layout: the saddle where the Sydney road crossed the old plateau's ramp)
export const SADDLES = [];
// the Great Dividing Range: a low ridge between the Australian towns and the outback, with a pass for the Uluru track
export const RELIEF = [{ id: 'gdr', pts: [[-166, -96], [-166, 120]], h: 14, w: 12, pass: { at: [-166, 60], h: 4.5, w: 14 } },
  // (round T3) the Trường Sơn range between the ring road and the Vietnam road, with the Hải Vân pass where the road to
  // Đà Nẵng crosses it (a low saddle, the road at 8 % or less: owner's default 3)
  { id: 'truongson', pts: [[123, -30], [122, 30]], h: 14, w: 10, pass: { at: [122, 7], h: 4, w: 14 } }];

// Spots kept free of trees ([x, z, r]): round Uluru.
export const CLEARINGS: { id: string; place?: string; off?: number[]; at?: number[]; r: number }[] = [{ id: 'uluru', place: 'uluru', off: [0, -2], r: 34 }];

// ---------- places of interest ----------
export const SHRINES = [
  // (the first three stand on the Dawn Plateau: the quest "Solve the 3 shrines on the plateau")
  { id: 'sh_pattern', game: 'pattern', at: [-7, -84] },
  { id: 'sh_count', game: 'counting', at: [25, -86] },
  { id: 'sh_letters', game: 'letters', at: [22, -62] },
  { id: 'sh_memory', game: 'memory', at: [-104, 24] },   // (round T3: moved off the western Memory Village)
  { id: 'sh_hanoi', game: 'hanoi', at: [104, -146] },
  { id: 'sh_robot', game: 'robot', at: [64, 150] },
  { id: 'sh_goat', game: 'goat', at: [-196, 110] },
  { id: 'sh_sort', game: 'sorting', at: [200, 14] },
  { id: 'sh_shapes', game: 'shapes', at: [-60, 150] },
  { id: 'sh_colors', game: 'colors', at: [-104, -128] },   // (round T2: clear of the Brisbane River)
  { id: 'sh_maze', game: 'maze', at: [52, -150] },
  { id: 'sh_numbers', game: 'numbers', at: [-96, 84] }
];
export const TOWERS = [
  { id: 'tw_plateau', at: [10, -66] },
  { id: 'tw_bamboo', at: [-176, -100] },
  { id: 'tw_peaks', at: [40, -208] },
  { id: 'tw_lake', at: [140, -60] }   // (round T2: on the lake's east shore; Sông Hồng comes in on the north)
];
// hidden Leafies under rocks or as a sparkle (their ids are lf0, lf1… in this order: saved in profiles)
export const LEAFIES = [
  ['rock', -12, -90], ['sparkle', 30, -60], ['rock', 34, 48], ['sparkle', -100, -150], ['rock', -105, 20], ['sparkle', -186, 0], ['rock', -150, 96],
  ['sparkle', 120, -60], ['rock', 60, 130], ['sparkle', 186, 156], ['rock', 200, -14], ['sparkle', 214, -40], ['rock', 175, -125], ['sparkle', 130, -190],
  ['rock', -30, -195], ['sparkle', -60, -150], ['rock', 70, -195], ['sparkle', -200, -60], ['rock', -200, 30], ['sparkle', -30, 118], ['rock', 110, 60],
  ['sparkle', -90, 170], ['rock', 210, -200], ['sparkle', 108, 52]
].map(([kind, x, z], i) => ({ id: 'lf' + i, kind, at: [x, z], ...(i === 7 ? { inWater: true } : {}) })); // (lf7 sparkles over the middle of Hồ Gương on purpose)

// things to pick up (herbs, mushrooms, eggs, rice, fruit, a fish…: js/data.js GATHER, in this order): [item, place, dx, dz]
export const GATHER_AT = [
  ['herb', 'bamboo', 10, 22], ['herb', 'bamboo', -14, 6], ['herb', 'sydney', -30, 40], ['herb', 'melbourne', 30, -32], ['mushroom', 'bamboo', 2, -22], ['mushroom', 'brisbane', 30, -22], ['mushroom', 'plateau', -18, 12], ['mushroom', 'india', 30, 16],
  ['herb', 'plateau', 26, 4], ['mushroom', 'home', -30, -20], ['egg', 'village', -6, -18], ['egg', 'village', -12, -14], ['rice', 'paddies', -7, -2], ['rice', 'paddies', 6, 8], ['rice', 'paddies', -12, 10], ['banana', 'saigon', -30, -20],
  ['banana', 'saigon', -45, 10], ['banana', 'hoian', -25, 36], ['fish', 'lake', 0, -30], ['mango', 'market', 17, -22], ['mango', 'danang', 30, 18], ['leaf', 'bamboo', 20, -9], ['bean', 'paddies', 4, -8], ['herb', 'danang', -25, -35]
];

// Where each landmark stands: its place and the offset from that place's anchor (js/regions.js, js/cities.js,
// js/heritage.js). For the UNESCO sites it is only where to start looking for a clear spot (js/heritage.js).
export const LANDMARK_AT = {
  // postcards (js/regions.js)
  opera: { place: 'sydney', off: [34, 24] },     // by the water east of Sydney, like Bennelong Point
  harbour: { place: 'sydney', off: [54, 2] },    // the middle of the Harbour Bridge over Sydney Harbour (round T2; the postcard is by its south end)
  uluru: { place: 'uluru', off: [0, -16] },      // the postcard, in front of the rock
  banana: { place: 'aussie', off: [9, -6] },
  bondi: { place: 'melbourne', off: [26, 50] },  // the lifesavers' tower on the southern beach
  lighthouse: { place: 'vungtau', off: [12, 30] }, // on the beach below Vũng Tàu (round T3: moved here with Bạch Dinh)
  turtle: { place: 'hanoi', off: [-29, 3] },     // in Hồ Gươm by Hà Nội (round T2; was a small copy in the market)
  onepillar: { place: 'hanoi', off: [19, 15] },   // Hà Nội heritage garden, clear of the lake and homes
  chuacau: { place: 'hoian', off: [0, -18] },    // the middle of Chùa Cầu over the Hội An canal (round T2; was a small copy in the market)
  longbien: { place: 'hanoi', off: [0, 35] },     // the middle of Long Biên bridge
  storybridge: { place: 'brisbane', off: [0, 31] }, // the middle of the Story Bridge
  princes: { place: 'melbourne', off: [0, -36] },  // the middle of Princes Bridge
  benthanh: { place: 'market', off: [24, -4] },
  // Two Homes Street (js/cities.js)
  bachdinh: { place: 'vungtau', off: [-14, -17] },   // (round T3) on the green slope behind Vũng Tàu's square, facing it
  nhatron: { place: 'town', off: [4.5, 10.5] },
  // the UNESCO sites (js/heritage.js)
  halong: { place: 'lake', off: [-9, -5] },
  hue: { place: 'danang', off: [42, -14] },
  myson: { place: 'hoian', off: [32, -6] },
  phongnha: { place: 'paddies', off: [24, -20] },
  trangan: { place: 'hanoi', off: [-30, -22] },
  reef: { place: 'lake', off: [8, 9] },
  sisters: { place: 'sydney', off: [-30, -40] },
  exhibition: { place: 'melbourne', off: [-30, 10] },
  kakadu: { place: 'uluru', off: [10, -54] },
  forbidden: { place: 'china', off: [28, 18] },
  heaven: { place: 'china', off: [-28, 16] },
  terracotta: { place: 'china', off: [24, -14] },
  potala: { place: 'china', off: [-24, -16] },
  qutub: { place: 'india', off: [-26, 18] },
  redfort: { place: 'india', off: [26, -20] },
  konark: { place: 'india', off: [26, 16] },
  hampi: { place: 'india', off: [-26, -18] },
  mahabodhi: { place: 'india', off: [-40, 0] }
};
// which place each landmark belongs to in the real world (the Pad map lists it under that place; moved from js/ui.js)
export const LANDMARK_HOME = { bnclock: 'bacninh', chuadau: 'bacninh', butthap: 'bacninh', dendo: 'bacninh', quanho: 'bacninh',
  turtle: 'hanoi', longbien: 'hanoi', onepillar: 'hanoi', vanmieu: 'hanoi', puppettheatre: 'hanoi', thehuc: 'hanoi', halong: 'hanoi', trangan: 'hanoi',
  dragonbridge: 'danang', goldenbridge: 'danang', marble: 'danang', hoian: 'danang', chuacau: 'danang', myson: 'danang', hue: 'danang', phongnha: 'danang',
  benthanh: 'saigon', cathedral: 'saigon', postoffice: 'saigon', cairang: 'saigon', bachdinh: 'vungtau', nhatron: 'saigon', lighthouse: 'vungtau',
  wheel: 'brisbane', lonepine: 'brisbane', storybridge: 'brisbane', reef: 'brisbane', banana: 'sydney',
  opera: 'sydney', harbour: 'sydney', sydneytower: 'sydney', lunapark: 'sydney', bondi: 'sydney', sisters: 'sydney',
  flinders: 'melbourne', princes: 'melbourne', wtram: 'melbourne', exhibition: 'melbourne', apostles: 'melbourne', kakadu: 'uluru', uluru: 'uluru',
  forbidden: 'china', heaven: 'china', terracotta: 'china', potala: 'china', qutub: 'india', redfort: 'india', konark: 'india', hampi: 'india', mahabodhi: 'india' };

// (round T3) Memory Village plots: { id, village, size, off: [dx, dz] from the village's anchor, rot (the way the front
// faces: 0 = +z, π = −z), w (along the lane), d (deep), address: [en, vi] }. Each is levelled, joined to a lane
// (`mv_*` in ROADS), and shows a garden until a family puts a home on it (js/plots.js; Studio's Plots page later).
// Numbered like a street along each lane: odd on the north side, even on the south side.
export const PLOTS = (() => {
  const out = [], W = 6, D = 7, LANE = 1.7, GAP = .5;
  // one lane: `xs` are the plots' middles along it, from the village's anchor (the lane's line); the same on both sides
  const lane = (id, li, dz, xs, en, vi) => xs.forEach((x, k) => { for (const side of [-1, 1]) {
    const n = k * 2 + (side < 0 ? 1 : 2);
    out.push({ id: `${id}_${li}_${n}`, village: id, size: 'house', off: [x, dz + side * (LANE + GAP + D / 2)], rot: side < 0 ? 0 : Math.PI, w: W, d: D,
      address: [`${n} ${en} ${li}`, `Số ${n}, ${vi} ${li}`] }); } });
  // east (where Concept D draws it): two lanes west of the Vietnam road, between the Hội An canal and Sông Sài Gòn
  for (const li of [1, 2]) lane('memory_e', li, (li - 1) * 20, [-8, -14.5, -21, -27.5, -34, -40.5, -47, -53.5], 'Memory Lane', 'ngõ Kỷ Niệm');
  // west: two lanes east of the Australia road, south of Sydney
  for (const li of [1, 2]) lane('memory_w', li, (li - 1) * 19, [7, 13.5, 20, 26.5, 33, 39.5], 'Wattle Lane', 'ngõ Keo Vàng');   // (golden wattle, Australia's flower)
  return out;
})();

// Boats (js/ferry.js): the lake ferry's piers (degrees round the lake, 0 = east, 90 = south) and the river rafts.
export const BOATS = [
  { id: 'lakeferry', water: 'lake', docks: [{ id: 'village', a: 345 }, { id: 'danang', a: 80 }] },   // (round T2: Sông Hồng and the ring road's bridge took the north and island shores; each pier has a footpath to the Vietnam road)
  { id: 'raft', water: ['main_n', 'main_e', 'main_s'], stops: 'places',   // the raft line down the river past the island's east side, stopping by the towns (under the bridges)
    // (round T2, Concept D) and by every bridge it passes under: each pier's land end, joined to the road by a footpath
    bridgeStops: [{ bridge: 'north', at: [12, -152] }, { bridge: 'ring_n', at: [16, -114] }, { bridge: 'haique', at: [60, -6] }, { bridge: 'ring_s', at: [22, 124] }] },
  // (round T2) the Sydney Harbour ferry: from Sydney's quay by the road to the ring, under the Harbour Bridge, to the home island
  { id: 'harbourferry', water: 'sydney_harbour', via: [[-106, -2], [-54, -2]], piers: [{ id: 'sydney', at: [-108, 24], to: [-106, 1], name: ['Sydney Harbour', 'Bến cảng Sydney'] }, { id: 'island', at: [-37, -3], to: [-48, -3], name: ['Two Homes Island', 'Đảo Hai Quê'] }] },
  // (round T3) the boat from TP. HCM down Sông Sài Gòn and along the coast to Bãi Sau at Vũng Tàu
  { id: 'vtboat', water: 'saigon_r', via: [[131, 196], [198, 198]], piers: [{ id: 'saigon', at: [136, 156], to: [131, 156], name: ['TP. Hồ Chí Minh', 'TP. Hồ Chí Minh'] }, { id: 'vungtau', at: [198, 181], to: [198, 190], name: ['Bãi Sau, Vũng Tàu', 'Bãi Sau, Vũng Tàu'] }] },
  { id: 'crossing', water: 'main_n', count: 0 }            // (round T2, Concept D: no crossing rafts; bridges join every bank and the raft line stops by each)
];

// ---------- (T1b, owner 11 Oct) tidy streets: one market row per place ----------
// Every stall, kiosk, food van and seller's tent of a place stands in one row on one side of the place's main street,
// all facing it; walking sellers keep to the footpath on the other side (rules STALL-001…004, docs/ARCHITECTURE.md §9.5,
// checked by js/validate.js). STALL: the clear ground the rules ask for, in metres: from the street's edge, from any
// building, between neighbours; `path`: how far off the street's edge the walking sellers' footpath runs; `alone`: the
// most open ground between two neighbours in a row (more and a stall stands alone in a field).
export const STALL = { road: 1.5, building: 3, gap: 1.2, path: .9, alone: 12 };
// street: the main street's centre line [from, to], from the place's anchor; w: its width (ROAD_WIDTH, or a walking
// street's own paving); walking: no traffic, so customers may stand on it; side: 1 = the row is on the left of
// from → to (seen from above, north up), −1 on the right; plain: the way in from the gate, not a paved street (China
// and India; Round U: plants may grow there); at: metres from `from` to the first slot's middle; pitch: metres
// between slots' middles. The cities' rows are made from their main gate below.
type MarketRow = { place: string; street: number[][]; w: number; walking?: boolean; side: number; at: number; pitch: number; plain?: boolean; city?: boolean };
const ROWS: MarketRow[] = [
  { place: 'market', street: [[-24, 0], [24, 0]], w: 8, walking: true, side: 1, at: 2, pitch: 4 },   // north side, north to south Vietnam from the gate; the hosts and the hawker on the south
  { place: 'aussie', street: [[-18, 0], [18, 0]], w: 7, side: -1, at: 0, pitch: 1 },   // south side, facing the shops across the road; slots in metres (the crossing in the middle stays clear)
  { place: 'town', street: [[-26, -6], [26, -6]], w: ROAD_WIDTH.asphalt, side: -1, at: 26.5, pitch: 4 },   // south footpath, east of the crossing, by the park
  { place: 'village', street: [[-32, 0], [-18, 0]], w: ROAD_WIDTH.dirt, side: 1, at: 3, pitch: 4 },          // the lane in from the old gate, north side
  { place: 'china', street: [[0, 22], [0, 2]], w: ROAD_WIDTH.asphalt, side: 1, at: 1.6, pitch: 3.8, plain: true },   // just inside the gate, west side
  { place: 'india', street: [[0, 22], [0, 2]], w: ROAD_WIDTH.asphalt, side: 1, at: 1.6, pitch: 3.8, plain: true }
];
// the cities: the main street from the main gate straight through the square; the kiosks just inside the gate on the
// host's side (Bắc Ninh: the south side, clear of the Quan họ boat)
for (const p of PLACES) if (p.kind === 'city') ROWS.push({ place: p.id, street: [p.gates[0], [-p.gates[0][0], -p.gates[0][1]]], w: ROAD_WIDTH.asphalt, side: p.id === 'bacninh' ? -1 : 1, at: p.id === 'bacninh' ? 3.2 : 2.5, pitch: 3.8, city: true });
export const MARKET_ROWS = ROWS;
const ROW_OF = new Map(ROWS.map(r => [r.place, r]));
export const rowOf = place => ROW_OF.get(place) || null;
// the street of a place's row in world coordinates: { a, b, w, dx, dz, len, nx, nz } (n: the unit step from the street
// towards the row)
export function rowStreet(place) {
  const R = ROW_OF.get(place); if (!R) return null; const [ox, oz] = anchorOf(place);
  const a = [ox + R.street[0][0], oz + R.street[0][1]], b = [ox + R.street[1][0], oz + R.street[1][1]], len = Math.hypot(b[0] - a[0], b[1] - a[1]), dx = (b[0] - a[0]) / len, dz = (b[1] - a[1]) / len;
  return { place, a, b, w: R.w, walking: !!R.walking, plain: !!R.plain, len, dx, dz, nx: dz * R.side, nz: -dx * R.side };
}
// slot i of a place's row for something `d` metres deep (across the street) and `span` slots long: where its middle
// stands { x, z }, which way it faces (face: the yaw that looks at the street, as avatars and models use it), the step
// along the row (ax, az) and towards the street (fx, fz). Its front is STALL.road off the street's edge.
export function rowSlot(place, i, d = 1.6, span = 1) {
  const S = rowStreet(place), R = ROW_OF.get(place); if (!S) return null;
  const t = R.at + (i + (span - 1) / 2) * R.pitch, off = S.w / 2 + STALL.road + d / 2;
  const x = S.a[0] + S.dx * t + S.nx * off, z = S.a[1] + S.dz * t + S.nz * off;
  return { x, z, face: Math.atan2(-S.nx, -S.nz), ax: S.dx, az: S.dz, fx: -S.nx, fz: -S.nz };
}
// the walking sellers' footpath: along the street on the side away from the row (on a walking street, its far half),
// trimmed `trim` metres at each end: [[x, z], [x, z]]
export function walkPath(place, trim = 3) {
  const S = rowStreet(place); if (!S) return null;
  const off = -(S.walking ? S.w / 2 - 1.4 : S.w / 2 + STALL.path), at = t => [S.a[0] + S.dx * t + S.nx * off, S.a[1] + S.dz * t + S.nz * off];
  return [at(trim), at(S.len - trim)];
}

// ---------- looking things up ----------
const BY_ID = new Map(PLACES.map(p => [p.id, p]));
// a place's anchor [x, z] (a place inside a place: its parent's anchor plus its offset)
export function anchorOf(id) { const p = BY_ID.get(id); if (!p) return null; if (p.at) return p.at; const a = anchorOf(p.place); return a && [a[0] + p.off[0], a[1] + p.off[1]]; }
// where a landmark stands [x, z]
export function landmarkAt(id) { const L = LANDMARK_AT[id]; if (!L) return null; const a = anchorOf(L.place); return a && [a[0] + L.off[0], a[1] + L.off[1]]; }

// The anchors of earlier layouts, frozen (only for moving old saves and old Studio edits onto a new map).
export const LEGACY = Object.freeze({
  C: Object.freeze({ plateau: [0, 0], village: [110, 30], paddies: [112, -38], lake: [55, 125], bamboo: [-100, 85], home: [-26, 126], town: [32, 53], market: [121, 83], aussie: [-117, -12],
    danang: [84, -40], bacninh: [48, -124], hanoi: [4, -62], saigon: [-8, 86], brisbane: [-70, -32], melbourne: [-144, 66], sydney: [-36, 52], china: [100, -88], india: [-112, -84],
    uluru: [-128, 152], apostles: [-132, 126], choitrau: [-8, -140], duabo: [-62, 84], playground: [28, 62], yard: [43, 14.5] })
});
