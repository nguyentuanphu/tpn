// Bà Huệ and ông Nghi's yard (round R story, owner 9 Oct): when they started out, bà Huệ and ông Nghi helped the
// younger ones in the family, bringing them from Hà Tĩnh to work with them and building jobs in transport,
// construction and hauling earth and stone. In the valley they open a transport and building yard near the Huệ Nghi
// shop on Phố Hai Quê; their son Anh 2 runs it. js/yard.js runs this chain (a side story the child starts by asking
// bà Huệ; Studio switch 'story_yard'). Lesson: helping your family and giving everyone a chance.
//
// The family (owner, 9 Oct): bà Huệ and ông Nghi brought chú Thuận, chú Trung, O Thủy, anh Quân, chú Hùng, chú Sơn Diệu and
// chú Sơn Cường from Hà Tĩnh (bà Huệ also brought cậu Tâm and chị Huyền). Three of them take the yard's jobs here;
// the others come on the coach too (COACH). Cậu Tâm hauls sand and stone like chú Thuận (his wife is mợ An); chị Huyền,
// a niece, works at a school, and her husband is anh Trọng: the three come to the house-warming meal (GUESTS).
export const RELATIVES = [
  { id: 'rel_driver', name: 'Chú Thuận', job: 0, look: ['shirt', '#4a7ab8', '#2a2a2a', 'short'],
    hello: ['I can drive anything with wheels! Sand, stones, bricks: I carry them all.', 'Chú lái được mọi thứ có bánh xe! Cát, đá, gạch: chú chở hết.'] },
  { id: 'rel_builder', name: 'Chú Hùng', job: 1, look: ['shirt', '#c8503a', '#2a2a2a', 'short'],
    hello: ['I love making things with my hands. I helped build our school in Hà Tĩnh!', 'Chú thích làm mọi thứ bằng tay. Chú đã giúp xây ngôi trường ở Hà Tĩnh đó!'] },
  { id: 'rel_digger', name: 'Anh Quân', job: 2, look: ['shirt', '#5a9a4a', '#2a2a2a', 'short'],
    hello: ['I am strong and patient. I can dig a well all by myself!', 'Anh khỏe và kiên nhẫn lắm. Anh tự đào được cả một cái giếng!'] }
];
// everyone else who came on the coach (they stand by it and wave)
export const COACH = ['Chú Trung', 'O Thủy', 'Chú Sơn Diệu', 'Chú Sơn Cường'];
// who comes to the house-warming meal at the Huệ Nghi shop, and what each says
export const GUESTS = [
  { name: 'Cậu Tâm', look: ['shirt', '#5b7fbf', '#2a2a2a', 'short'], line: ['Chú Thuận and I both carry sand and stone. Next time, ride with me in my blue truck!', 'Cậu với chú Thuận đều chở cát đá. Lần sau con đi xe tải xanh với cậu nha!'] },
  { name: 'Chị Huyền', look: ['aodai', '#f2c4d8', '#2a2a2a', 'long'], line: ['I work at the school. When Grandma and Grandpa brought me here, they gave me a home to start from. Now we help each other.', 'Chị làm ở trường học. Hồi ông bà đưa chị vào, ông bà cho chị chỗ ở để bắt đầu. Giờ mọi người giúp nhau.'] },
  { name: 'Anh Trọng', look: ['shirt', '#4a8a6a', '#2a2a2a', 'short'], line: ['I am Huyền\'s husband. Well done for helping build the house!', 'Anh là chồng chị Huyền. Con giỏi lắm, đã giúp xây nhà!'] }
];
export const JOBS = [['Driver', 'Lái xe'], ['Builder', 'Thợ xây'], ['Digger operator', 'Lái máy xúc']];
export const ANH2 = { id: 'anh2', name: 'Anh 2', look: ['shirt', '#e8a83a', '#2a2a2a', 'short'] };

// a step: id, icon, en/vi (the goal shown), tale [pictures, who, en, vi] (said as the step starts), at (where the arrow points)
export const YARD_STEPS = [
  { id: 'y_start', icon: '👵', en: 'Ask Bà Huệ about the new yard', vi: 'Hỏi bà Huệ về công trường mới', at: 'hue' },
  { id: 'y_coach', icon: '🚌', en: 'Meet the coach from Hà Tĩnh', vi: 'Đón xe khách từ Hà Tĩnh', at: 'coach',
    tale: ['👵🚌', 'Bà Huệ', 'When Grandpa Nghi and I started out, we brought the young ones from Hà Tĩnh to work with us. Today more of the family are coming! Please meet their coach.', 'Hồi bà với ông Nghi mới lập nghiệp, ông bà đưa các em từ Hà Tĩnh vào làm cùng. Hôm nay lại có thêm người nhà vào! Con ra đón xe khách giúp bà nhé.'] },
  { id: 'y_jobs', icon: '👷', en: 'Give everyone a job', vi: 'Giao việc cho mọi người', at: 'relatives',
    tale: ['👷🏗️', 'Anh 2', 'Welcome to the yard! Ask each of them what they are good at, then give them the right job.', 'Chào mừng đến công trường! Con hỏi mỗi người giỏi việc gì, rồi giao cho họ việc phù hợp nhé.'] },
  { id: 'y_truck', icon: '🚚', en: 'Drive the dump truck with earth and stone', vi: 'Lái xe ben chở đất đá', at: 'truck',
    tale: ['🚚🪨', 'Chú Thuận', 'Jump in, we will drive together! Load up at the stone pile, then tip it out at the building site.', 'Lên xe nào, mình cùng lái nhé! Xúc đá ở bãi đá, rồi đổ xuống chỗ xây nhà.'] },
  { id: 'y_dig', icon: '🏗️', en: 'Dig the foundations with the excavator', vi: 'Đào móng bằng máy xúc', at: 'digger',
    tale: ['🏗️💪', 'Anh Quân', 'A strong house needs deep foundations. Pull the levers with me and dig!', 'Nhà chắc phải có móng sâu. Con kéo cần cùng anh rồi đào nhé!'] },
  { id: 'y_build', icon: '🧱', en: 'Build the house together', vi: 'Cùng nhau xây nhà', at: 'site',
    tale: ['🧱🏠', 'Chú Hùng', 'Brick by brick, everyone together! Then we lift the roof on.', 'Từng viên gạch, mọi người cùng làm! Rồi mình lợp mái nhé.'] },
  { id: 'y_party', icon: '🍲', en: 'Come to the house-warming meal at the Huệ Nghi shop', vi: 'Về tiệm Huệ Nghi ăn mừng nhà mới', at: 'hue',
    tale: ['🏠🎉', 'Anh 2', 'The house is finished! Mum is cooking a big meal at the shop. Let us all go and eat together!', 'Nhà xong rồi! Mẹ đang nấu một bữa thật ngon ở tiệm. Mình cùng về ăn mừng nhé!'] }
];

// what is said along the way ([en, vi]; the child's name is never in a spoken line so the recordings fit everyone)
export const YARD_LINES = {
  start: [['A long time ago, Grandpa Nghi and I started with one old truck. We carried bricks and steel all over Bà Rịa.', 'Ngày xưa, ông Nghi với bà bắt đầu chỉ với một chiếc xe tải cũ. Ông bà chở gạch, sắt thép đi khắp Bà Rịa.'],
    ['When we had work, we brought the young ones from Hà Tĩnh to work with us. Family helps family.', 'Có việc rồi, ông bà đưa các em từ Hà Tĩnh vào làm cùng. Người nhà thì giúp nhau.'],
    ['Now our son, Anh 2, has opened a yard here. Will you help us?', 'Giờ con trai bà, Anh 2, mở một công trường ở đây. Con giúp ông bà nhé?']],
  startShort: [['Grandpa Nghi and I brought the family from Hà Tĩnh to work with us. Will you help our new yard?', 'Ông bà đưa người nhà từ Hà Tĩnh vào làm cùng. Con giúp công trường mới nhé?']],
  coach: [['Phew, what a long ride from Hà Tĩnh! Thank you for meeting us!', 'Phù, đi từ Hà Tĩnh vào xa ghê! Cảm ơn con đã ra đón!']],
  jobAsk: ['What job should they do?', 'Người này nên làm việc gì?'],
  jobRight: ['That is just right for me. Thank you!', 'Đúng việc mình thích rồi. Cảm ơn con!'],
  jobWrong: ['Hmm, I think another job suits me better. Listen to what I am good at!', 'Hừm, chắc việc khác hợp với mình hơn. Con nghe xem mình giỏi gì nha!'],
  truckGo: ['Here we go to the building site!', 'Mình chạy tới chỗ xây nhà nào!'],
  truckTip: ['Tip it out!', 'Đổ xuống!'],
  truckDone: ['Well done! The earth and stone are on the site.', 'Giỏi quá! Đất đá đã về tới chỗ xây.'],
  dig: ['Dig!', 'Đào!'],
  digDone: ['The foundations are dug. Great digging!', 'Móng đào xong rồi. Đào giỏi lắm!'],
  brick: ['Lay the bricks!', 'Xây gạch!'],
  roof: ['Lift the roof!', 'Lợp mái!'],
  handLoad: ['Tap the stones to load the truck!', 'Chạm vào đá để xúc lên xe!'],
  handDrive: ['Hold the pedal to drive!', 'Giữ bàn đạp để lái xe!'],
  handTip: ['Pull the lever down to tip it out!', 'Kéo cần xuống để đổ đất đá!'],
  handDig: ['Drag down to dig, then up to lift!', 'Kéo xuống để đào, rồi kéo lên!'],
  handBrick: ['Tap to lay the bricks!', 'Chạm để xây gạch!'],
  handRoof: ['Drag the roof down onto the house!', 'Kéo mái nhà xuống lợp lên nhà!'],
  buildDone: ['We built it together! A new house for the family.', 'Mình cùng nhau xây xong rồi! Một ngôi nhà mới cho cả nhà.'],
  party: [['Come, eat! When we help each other, everyone has a chance to do well.', 'Vào ăn đi con! Khi mình giúp nhau, ai cũng có cơ hội làm nên.'],
    ['The yard is always open for you. Drive the truck and dig any time you like!', 'Công trường lúc nào cũng mở cho con. Con lái xe ben, đào đất lúc nào cũng được nhé!']]
};
