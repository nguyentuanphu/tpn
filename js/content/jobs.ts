// (Round U, owner 11 Oct: a village job board) Helping jobs on a board in each place, so a child learns what the place is
// for. kind 'find': something lost near the board, tap it; kind 'deliver': take something to a stall in `to` (a stalls
// place: market, aussie, or the place itself). learn: what the job shows about the place, said when it is done.
// Plain data (no imports). Every icon is drawn (js/art.js); no line has a child's name.
//   key: { learn: [en, vi], jobs: [{ kind, icon, en, vi, to? }] }
export const JOBS = {
  farm: { learn: ['Farms grow our food and look after animals, then take the food to the market.', 'Nông trại trồng thức ăn và chăm sóc con vật, rồi mang thức ăn ra chợ.'], jobs: [
    { kind: 'find', icon: '🐔', en: 'A hen ran away from the farm! Can you find her?', vi: 'Một cô gà mái chạy mất khỏi nông trại! Con tìm giúp được không?' },
    { kind: 'deliver', icon: '🥚', to: 'market', en: 'Please take these fresh eggs to a stall at the market.', vi: 'Con mang giỏ trứng tươi này ra một sạp ở chợ giúp nhé.' }] },
  village: { learn: ['Lotus Village makes lanterns and grows lotus flowers on its ponds.', 'Làng Sen làm đèn lồng và trồng hoa sen trên các ao.'], jobs: [
    { kind: 'find', icon: '🏮', en: 'The wind blew a lantern away. Can you find it?', vi: 'Gió thổi bay mất một chiếc đèn lồng. Con tìm giúp được không?' },
    { kind: 'deliver', icon: '🪷', to: 'village', en: 'Please take these lotus flowers to a stall in the village.', vi: 'Con mang bó hoa sen này đến một sạp trong làng giúp nhé.' }] },
  china: { learn: ['China Town has red lanterns, dumplings and dragon dances.', 'Phố Tàu có đèn lồng đỏ, bánh bao và múa rồng.'], jobs: [
    { kind: 'find', icon: '🐼', en: 'A little one lost a toy panda. Can you find it?', vi: 'Một em bé làm mất gấu trúc đồ chơi. Con tìm giúp được không?' },
    { kind: 'deliver', icon: '🥟', to: 'china', en: 'Please take these dumplings to a stall in China Town.', vi: 'Con mang đĩa bánh bao này đến một sạp ở Phố Tàu giúp nhé.' }] },
  india: { learn: ['India Village is famous for spices, bright colours and elephants.', 'Làng Ấn Độ nổi tiếng với gia vị, màu sắc rực rỡ và voi.'], jobs: [
    { kind: 'find', icon: '🐘', en: 'A toy elephant is lost. Can you find it?', vi: 'Một chú voi đồ chơi bị lạc. Con tìm giúp được không?' },
    { kind: 'deliver', icon: '🌶️', to: 'india', en: 'Please take these spices to a stall in the village.', vi: 'Con mang gói gia vị này đến một sạp trong làng giúp nhé.' }] },
  town: { learn: ['On Two Homes Street, neighbours from two countries live side by side and help each other.', 'Ở Phố Hai Quê, hàng xóm từ hai đất nước sống cạnh nhau và giúp đỡ nhau.'], jobs: [
    { kind: 'find', icon: '⚽', en: 'The neighbours lost their ball. Can you find it?', vi: 'Nhà hàng xóm làm mất quả bóng. Con tìm giúp được không?' },
    { kind: 'deliver', icon: '📦', to: 'town', en: 'A parcel came for a shop on the street. Can you take it there?', vi: 'Có một gói hàng gửi cho cửa hàng trên phố. Con mang đến giúp nhé?' }] },
  uluru: { learn: ['Uluru is a giant red rock. It is a special place for Aboriginal people.', 'Uluru là một tảng đá đỏ khổng lồ. Đây là nơi rất đặc biệt của người Thổ dân.'], jobs: [
    { kind: 'find', icon: '🦎', en: 'A little lizard is sunning itself somewhere near. Can you find it?', vi: 'Một chú thằn lằn nhỏ đang tắm nắng đâu đây. Con tìm được không?' }] },
  hanoi: { learn: ['Hà Nội is the capital of Vietnam, with old streets and a lake with a turtle tower.', 'Hà Nội là thủ đô của Việt Nam, có phố cổ và hồ có Tháp Rùa.'], jobs: [
    { kind: 'find', icon: '🐢', en: 'A little turtle wandered away from the lake. Can you find it?', vi: 'Một chú rùa nhỏ đi lạc khỏi hồ. Con tìm giúp được không?' },
    { kind: 'deliver', icon: '🍜', to: 'hanoi', en: 'Please take this bowl of phở to a stall in Hà Nội.', vi: 'Con mang bát phở này đến một sạp ở Hà Nội giúp nhé.' }] },
  bacninh: { learn: ['Bắc Ninh is the home of quan họ, folk songs sung by two groups in turn.', 'Bắc Ninh là quê hương của quan họ, những làn điệu dân ca hát đối đáp.'], jobs: [
    { kind: 'find', icon: '🎵', en: 'A singer lost her song sheet. Can you find it?', vi: 'Một cô ca sĩ làm rơi tờ bài hát. Con tìm giúp được không?' },
    { kind: 'deliver', icon: '🧺', to: 'bacninh', en: 'Please take this basket to a stall in Bắc Ninh.', vi: 'Con mang giỏ này đến một sạp ở Bắc Ninh giúp nhé.' }] },
  danang: { learn: ['Đà Nẵng is by the sea, with a dragon bridge and fishing boats.', 'Đà Nẵng nằm bên biển, có cầu Rồng và thuyền đánh cá.'], jobs: [
    { kind: 'find', icon: '🦀', en: 'A crab escaped from the fishing boat! Can you find it?', vi: 'Một chú cua trốn khỏi thuyền đánh cá! Con tìm giúp được không?' },
    { kind: 'deliver', icon: '🐟', to: 'danang', en: 'Please take the fresh fish to a stall in Đà Nẵng.', vi: 'Con mang cá tươi đến một sạp ở Đà Nẵng giúp nhé.' }] },
  saigon: { learn: ['Hồ Chí Minh City is the biggest city in Vietnam, busy with motorbikes and markets.', 'Thành phố Hồ Chí Minh là thành phố lớn nhất Việt Nam, tấp nập xe máy và chợ.'], jobs: [
    { kind: 'find', icon: '⛑️', en: 'A rider lost a helmet. Can you find it?', vi: 'Một chú chạy xe làm rơi mũ bảo hiểm. Con tìm giúp được không?' },
    { kind: 'deliver', icon: '🥖', to: 'saigon', en: 'Please take the fresh bread to a stall in the city.', vi: 'Con mang bánh mì mới ra lò đến một sạp trong thành phố giúp nhé.' }] },
  vungtau: { learn: ['Bà Rịa–Vũng Tàu has beaches, a lighthouse and fresh seafood.', 'Bà Rịa–Vũng Tàu có bãi biển, ngọn hải đăng và hải sản tươi.'], jobs: [
    { kind: 'find', icon: '🐚', en: 'A pretty shell rolled away. Can you find it?', vi: 'Một vỏ ốc xinh lăn đi mất. Con tìm giúp được không?' },
    { kind: 'deliver', icon: '🐟', to: 'vungtau', en: 'Please take the fish to a stall by the sea.', vi: 'Con mang cá đến một sạp bên biển giúp nhé.' }] },
  brisbane: { learn: ['Brisbane is sunny, with a big river and koalas nearby.', 'Brisbane đầy nắng, có dòng sông lớn và gấu koala ở gần.'], jobs: [
    { kind: 'find', icon: '🐨', en: 'A toy koala is lost. Can you find it?', vi: 'Một bạn koala đồ chơi bị lạc. Con tìm giúp được không?' },
    { kind: 'deliver', icon: '🥭', to: 'brisbane', en: 'Please take these mangoes to a stall in Brisbane.', vi: 'Con mang mấy quả xoài này đến một sạp ở Brisbane giúp nhé.' }] },
  sydney: { learn: ['Sydney has the Harbour Bridge, the Opera House and ferries on the water.', 'Sydney có Cầu Cảng, Nhà hát Opera và phà chạy trên mặt nước.'], jobs: [
    { kind: 'find', icon: '🐧', en: 'A little penguin waddled off from the harbour. Can you find it?', vi: 'Một chú chim cánh cụt nhỏ lạch bạch đi khỏi bến cảng. Con tìm giúp được không?' },
    { kind: 'deliver', icon: '🐟', to: 'sydney', en: 'Please take the fish to a stall in Sydney.', vi: 'Con mang cá đến một sạp ở Sydney giúp nhé.' }] },
  melbourne: { learn: ['Melbourne has trams, little laneways and lots of footy fans.', 'Melbourne có xe điện, những con hẻm nhỏ và rất nhiều người hâm mộ bóng bầu dục.'], jobs: [
    { kind: 'find', icon: '🧣', en: 'A footy fan lost a scarf. Can you find it?', vi: 'Một bạn hâm mộ bóng bầu dục làm mất khăn quàng. Con tìm giúp được không?' },
    { kind: 'deliver', icon: '📦', to: 'melbourne', en: 'A parcel came for a shop in Melbourne. Can you take it there?', vi: 'Có một gói hàng gửi cho cửa hàng ở Melbourne. Con mang đến giúp nhé?' }] }
};
