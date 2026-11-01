// (Round U, owner 11 Oct: "all NPCs should be able to talk and should throw facts or slangs") What a villager says when a
// child taps them, by region: a fact about the place or a saying in its own words, in English and Vietnamese. Villagers
// with their own lines (sellers, game hosts, the family in the story) keep them; everyone else picks from here.
// Plain data (no imports). Recorded by the voice pack (none has a child's name).
export const VILLAGER_LINES = {
  vn: [
    ['Did you know? Vietnam is shaped like a long letter S, from the mountains in the north to the sea in the south.', 'Con biết không? Việt Nam có hình chữ S dài, từ núi rừng phía bắc đến biển phía nam.'],
    ['In the north we say "bát" for a bowl; in the south they say "chén"!', 'Ngoài bắc gọi là "bát", trong nam lại gọi là "chén" đó con!'],
    ['Rice grows in fields full of water. The buffalo helps the farmer get them ready.', 'Lúa mọc trên những thửa ruộng đầy nước. Con trâu giúp bác nông dân cày ruộng.'],
    ['"Ăn quả nhớ kẻ trồng cây": when you eat the fruit, remember who planted the tree.', '"Ăn quả nhớ kẻ trồng cây": ăn trái cây thì nhớ đến người đã trồng cây nhé.'],
    ['The áo dài is a long dress Vietnamese people wear on special days, like Tết.', 'Áo dài là trang phục người Việt mặc vào những ngày đặc biệt, như ngày Tết.'],
    ['Tết is the lunar new year. Children get lucky red envelopes!', 'Tết là năm mới âm lịch. Các bạn nhỏ được nhận lì xì đỏ may mắn!'],
    ['Phở is a noodle soup. Some people eat it for breakfast!', 'Phở là bánh phở chan nước dùng nóng. Nhiều người ăn phở vào bữa sáng đó!'],
    ['The nón lá keeps the sun and the rain off your head. It is made of palm leaves.', 'Nón lá che nắng che mưa. Nón được làm từ lá cọ đó con.'],
    ['In the south, when something is really yummy, we say "ngon bá cháy"!', 'Trong nam, món gì ngon tuyệt thì nói "ngon bá cháy" nè!'],
    ['Hạ Long Bay has almost two thousand little islands in the sea.', 'Vịnh Hạ Long có gần hai nghìn hòn đảo nhỏ giữa biển.'],
    ['"Một cây làm chẳng nên non": one tree cannot make a hill. Together we are strong!', '"Một cây làm chẳng nên non": một cây không làm nên núi. Đoàn kết thì mạnh!'],
    ['Lotus flowers grow in muddy ponds but stay clean and pretty.', 'Hoa sen mọc trong ao bùn mà vẫn sạch và đẹp.']
  ],
  au: [
    ["G'day! In Australia, \"arvo\" means afternoon. See you this arvo!", 'Chào con! Ở Úc, "arvo" nghĩa là buổi chiều. Hẹn gặp chiều nay nhé!'],
    ['Kangaroos carry their babies, called joeys, in a pouch.', 'Chuột túi mang con của mình, gọi là joey, trong túi trước bụng.'],
    ['Koalas sleep almost all day and eat gum leaves.', 'Gấu koala ngủ gần cả ngày và ăn lá bạch đàn.'],
    ['"No worries, mate!" means it is all okay, friend.', '"No worries, mate!" nghĩa là không sao đâu bạn ơi.'],
    ['Australia is so big it has deserts, rainforests and snowy mountains.', 'Nước Úc rộng lớn lắm, có sa mạc, rừng mưa và cả núi tuyết.'],
    ['At the beach, always swim between the red and yellow flags!', 'Ở bãi biển, luôn bơi giữa hai lá cờ đỏ vàng nhé!'],
    ['A "brekkie" is breakfast. Vegemite toast, anyone?', '"Brekkie" là bữa sáng. Ai ăn bánh mì Vegemite không?'],
    ['The platypus has a beak like a duck and lays eggs, but it is not a bird!', 'Thú mỏ vịt có mỏ như con vịt và đẻ trứng, nhưng không phải là chim!'],
    ['In Australia, Christmas comes in summer. People go to the beach!', 'Ở Úc, Giáng sinh rơi vào mùa hè. Mọi người đi biển!'],
    ['"Fair dinkum" means it is really true.', '"Fair dinkum" nghĩa là thật sự đúng vậy đó.'],
    ['Aboriginal people have lived in Australia for more than sixty thousand years.', 'Người Thổ dân đã sống ở nước Úc hơn sáu mươi nghìn năm.'],
    ['A "barbie" is a barbecue. Sausages on the barbie!', '"Barbie" là tiệc nướng ngoài trời. Xúc xích nướng nào!']
  ],
  home: [
    ['Two Homes Street has a bit of Bà Rịa and a bit of Sydney, just like your family!', 'Phố Hai Quê có một chút Bà Rịa và một chút Sydney, giống như gia đình con vậy!'],
    ['You can say hello two ways: "xin chào" and "hello"!', 'Con có thể chào theo hai cách: "xin chào" và "hello"!'],
    ['Ông Cú lives on the Dawn Plateau. He knows every corner of the valley.', 'Ông Cú sống trên Cao Nguyên Bình Minh. Ông biết từng góc của thung lũng.'],
    ['The river splits around our island and meets again in the south.', 'Dòng sông chia đôi quanh đảo của mình rồi gặp lại nhau ở phía nam.'],
    ['When you help someone, the whole valley smiles.', 'Khi con giúp đỡ ai đó, cả thung lũng đều mỉm cười.'],
    ['Look for the signposts: each picture shows where the road goes.', 'Hãy nhìn các biển chỉ đường: mỗi hình cho biết con đường đi đến đâu.']
  ]
};
// (Round U, owner 11 Oct: job pictures) what each villager does, shown as a small picture over their head and as their
// name in the talk box: [icon (drawn, js/art.js), en, vi], by region, given in turn
// (owner, 1 Nov 2026 AEDT: villagers also tell science and physics facts) everyday science, the same in every region; a
// villager takes turns between a fact of their place and one of these. Short, true, and something a child can try.
export const SCIENCE_LINES = [
  ['Gravity pulls things toward the ground. That is why a ball falls when you let go.', 'Trọng lực kéo mọi vật về phía mặt đất. Vì thế, khi con buông tay, quả bóng rơi xuống.'],
  ['A push or a pull can start, stop or change the way something moves.', 'Lực đẩy hoặc lực kéo có thể làm vật chuyển động, dừng lại hoặc đổi hướng.'],
  ['Friction helps your shoes grip the ground. Slippery ground gives them less grip.', 'Ma sát giúp giày bám vào mặt đất. Mặt đất trơn làm giày bám kém hơn.'],
  ['A floating boat pushes water aside, and the water pushes the boat up.', 'Chiếc thuyền nổi chiếm chỗ của nước, và nước đẩy thuyền lên trên.'],
  ['A shadow forms when something blocks the light. Move the light and the shadow moves too.', 'Bóng xuất hiện khi một vật chắn ánh sáng. Khi nguồn sáng di chuyển, bóng cũng di chuyển theo.'],
  ['A mirror bounces light back. That is how you see your face in it.', 'Gương hắt ánh sáng trở lại. Nhờ vậy con nhìn thấy khuôn mặt mình trong gương.'],
  ['Sounds start with shaking. When a drum skin shakes, the air shakes too, and we hear it.', 'Âm thanh bắt đầu từ sự rung. Khi mặt trống rung, không khí rung theo, và tai mình nghe thấy.'],
  ['Magnets pull some metals, like iron. They do not pull every metal.', 'Nam châm hút một số kim loại, như sắt. Nam châm không hút mọi kim loại.'],
  ['A gentle ramp is a longer way up, but it makes lifting easier.', 'Dốc thoải là đường lên dài hơn, nhưng giúp đưa đồ lên cao nhẹ nhàng hơn.'],
  ['Wheels help things roll. A trolley moves a heavy load without carrying it.', 'Bánh xe giúp đồ vật lăn. Xe đẩy chở đồ nặng mà mình không phải bê.'],
  ['A puddle dries up slowly because the water turns into vapour in the air.', 'Vũng nước khô dần vì nước biến thành hơi bay vào không khí.'],
  ['Clouds are made of tiny drops of water. When the drops get heavy, they fall as rain.', 'Mây được tạo từ những giọt nước rất nhỏ. Khi giọt nước nặng lên, chúng rơi xuống thành mưa.'],
  ['Most plants use sunlight, water and air to make their own food.', 'Phần lớn cây dùng ánh nắng, nước và không khí để tự làm ra thức ăn.'],
  ['Roots hold a plant in place and drink water from the soil.', 'Rễ giữ cho cây đứng vững và hút nước từ đất.'],
  ['Washing with soap and water takes germs off your hands.', 'Rửa tay bằng xà phòng và nước giúp rửa sạch mầm bệnh trên tay.'],
  ['Turning off the tap while you brush your teeth saves water.', 'Khóa vòi nước khi đang đánh răng giúp tiết kiệm nước.'],
  ['Recycling rules are different in each place. Ask a grown-up which bin to use.', 'Mỗi nơi có cách phân loại rác khác nhau. Con hỏi người lớn nên bỏ vào thùng nào nhé.'],
  ['Stop at the edge of the road and cross with a grown-up. Keep looking and listening.', 'Dừng lại ở mép đường và qua đường cùng người lớn. Luôn nhìn và lắng nghe nhé.'],
  ['A seesaw is a lever. Sit further from the middle and you can lift a bigger friend!', 'Bập bênh là một đòn bẩy. Ngồi xa điểm giữa hơn, con có thể nâng được bạn nặng hơn!'],
  ['Heavy things and light things fall at the same speed, if the air does not slow them down.', 'Vật nặng và vật nhẹ rơi nhanh như nhau, nếu không khí không cản chúng lại.'],
  ['Light travels in straight lines. That is why you cannot see around a corner.', 'Ánh sáng đi theo đường thẳng. Vì thế con không nhìn được qua góc tường.'],
  ['Hot air rises. That is how a hot air balloon goes up into the sky.', 'Không khí nóng bay lên cao. Nhờ vậy khinh khí cầu bay lên trời.'],
  ['Ice is water that is frozen. Warm it up and it melts back into water.', 'Đá là nước bị đông lại. Làm ấm lên thì đá tan thành nước.'],
  ['A rainbow appears when sunlight shines through raindrops. The light splits into colours.', 'Cầu vồng xuất hiện khi nắng chiếu qua những giọt mưa. Ánh sáng tách ra thành nhiều màu.']
];

export const VILLAGER_JOBS = {
  vn: [['🌾', 'Rice farmer', 'Bác nông dân'], ['🎣', 'Fisher', 'Chú đánh cá'], ['🍳', 'Cook', 'Cô đầu bếp'], ['📚', 'Teacher', 'Cô giáo'], ['🧵', 'Tailor', 'Cô thợ may'], ['🔨', 'Builder', 'Chú thợ xây'], ['🛶', 'Boat rower', 'Cô chèo đò'], ['🩺', 'Doctor', 'Bác sĩ']],
  au: [['🐑', 'Sheep farmer', 'Bác nuôi cừu'], ['📚', 'Teacher', 'Cô giáo'], ['🍳', 'Cook', 'Đầu bếp'], ['🔨', 'Builder', 'Thợ xây'], ['🩺', 'Doctor', 'Bác sĩ'], ['🎣', 'Fisher', 'Người câu cá'], ['🎨', 'Painter', 'Họa sĩ'], ['🌻', 'Gardener', 'Người làm vườn']],
  home: [['🌻', 'Gardener', 'Bác làm vườn'], ['📚', 'Teacher', 'Cô giáo'], ['🩺', 'Doctor', 'Bác sĩ'], ['🧹', 'Street sweeper', 'Cô quét đường'], ['✂️', 'Hairdresser', 'Thợ cắt tóc'], ['🍳', 'Cook', 'Đầu bếp']]
};
