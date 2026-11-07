// (v1.08d polish) Each friend's own short quest of three steps in the valley (brief docs/cores/tasks/v108d/polish-brief.md,
// part 1). The item in the friend's hand (Finn's compass, Sol's sun crystal, Clara's flower staff, Lumi's star lantern) is
// carried by the 3D model only once the quest is done (js/friendquest.ts, js/friend-model.ts). Pure data, no DOM.
// Each step: the place it happens (an interactable id that stands in the valley, as in js/content/gameplace.ts), who
// speaks there, the goal shown on the bar and the Adventures page, and the line said there. No line has a child's name in
// it, so the recordings fit every child (HANDOFF rule 11).
import type { FriendId } from './friends.js';

export type FriendQuestStep = { spot: string; who: [string, string]; goal: [string, string]; line: [string, string] };
export type FriendQuest = { friend: FriendId; item: [string, string]; art: string; title: [string, string]; done: [string, string]; steps: FriendQuestStep[] };

export const FRIEND_QUESTS: Record<FriendId, FriendQuest> = {
  finn: { friend: 'finn', item: ['compass', 'la bàn'], art: 'fq:compass', title: ['Finn’s compass', 'La bàn của Finn'],
    done: ['Finn’s compass! It shines in your hand now.', 'La bàn của Finn! Giờ nó sáng lấp lánh trong tay con.'],
    steps: [
      { spot: 'npc_owl', who: ['Grandpa Owl', 'Ông Cú'], goal: ['Ask Grandpa Owl about a compass', 'Hỏi Ông Cú về chiếc la bàn'],
        line: ['Hoo hoo! An explorer needs a compass. The star that shows the way is asleep at the Lotus Statue. Go and wake it up!', 'Hú hú! Nhà thám hiểm cần một chiếc la bàn. Ngôi sao chỉ đường đang ngủ ở Tượng Sen. Con ra đánh thức nó nhé!'] },
      { spot: 'statue', who: ['Lotus Statue', 'Tượng Sen'], goal: ['Wake the star at the Lotus Statue', 'Đánh thức ngôi sao ở Tượng Sen'],
        line: ['The little star is awake! Now it needs to learn the roads. Take it to the bus stop.', 'Ngôi sao nhỏ thức dậy rồi! Giờ nó cần học đường đi. Con mang nó ra trạm xe buýt nhé.'] },
      { spot: 'busstop_1', who: ['Bus stop', 'Trạm xe buýt'], goal: ['Show the star the roads at the bus stop', 'Đưa ngôi sao ra trạm xe buýt xem đường'],
        line: ['All the roads meet here. The star knows the way now. Your compass is ready!', 'Mọi con đường gặp nhau ở đây. Ngôi sao biết đường rồi. La bàn của con xong rồi!'] }
    ] },
  sol: { friend: 'sol', item: ['sun crystal', 'pha lê mặt trời'], art: 'fq:crystal', title: ['Sol’s sun crystal', 'Viên pha lê mặt trời của Sol'],
    done: ['Sol’s sun crystal! It glows warm in your hand now.', 'Viên pha lê mặt trời của Sol! Giờ nó tỏa sáng ấm áp trong tay con.'],
    steps: [
      { spot: 'pen', who: ['Uncle Ba', 'Bác Ba'], goal: ['Catch a sunbeam at Uncle Ba’s farm', 'Lấy tia nắng ở trang trại Bác Ba'],
        line: ['Sunshine makes my rice and beans grow. Here is a warm sunbeam! Take it to the music corner and let it sing.', 'Nắng giúp lúa và đậu của bác lớn. Đây là một tia nắng ấm! Con mang nó tới góc âm nhạc cho nó hát nhé.'] },
      { spot: 'musiccorner', who: ['Music Corner', 'Góc Âm Nhạc'], goal: ['Take the sunbeam to the music corner', 'Mang tia nắng tới góc âm nhạc'],
        line: ['La la la! The sunbeam is singing. Now it wants to learn. Take it to the school.', 'La la la! Tia nắng đang hát đó. Giờ nó muốn đi học. Con mang nó tới trường nhé.'] },
      { spot: 'school', who: ['Miss Tam', 'Cô Tam'], goal: ['Take the sunbeam to school', 'Mang tia nắng tới trường'],
        line: ['The sun gives us light and warmth every day. Thank you, sunbeam! Your sun crystal is ready.', 'Mặt trời cho chúng ta ánh sáng và hơi ấm mỗi ngày. Cảm ơn tia nắng! Viên pha lê mặt trời của con xong rồi.'] }
    ] },
  clara: { friend: 'clara', item: ['flower staff', 'gậy hoa'], art: 'fq:staff', title: ['Clara’s flower staff', 'Cây gậy hoa của Clara'],
    done: ['Clara’s flower staff! It blooms in your hand now.', 'Cây gậy hoa của Clara! Giờ nó nở hoa trong tay con.'],
    steps: [
      { spot: 'npc_mai', who: ['Auntie Mai', 'Cô Mai'], goal: ['Pick a flower at Auntie Mai’s market', 'Chọn hoa ở chợ của Cô Mai'],
        line: ['Flowers from my market! Take a pink one for your staff. The art corner has the brightest colours.', 'Hoa ở chợ của cô đây! Con lấy một bông màu hồng cho cây gậy nhé. Góc vẽ có nhiều màu tươi lắm.'] },
      { spot: 'easel', who: ['Art corner', 'Góc vẽ'], goal: ['Paint the petals at the art corner', 'Tô cánh hoa ở góc vẽ'],
        line: ['The petals are bright and pretty now! A flower needs good soil to grow strong. Take it to the farm.', 'Cánh hoa tươi và đẹp rồi! Bông hoa cần đất tốt để lớn khỏe. Con mang nó ra trang trại nhé.'] },
      { spot: 'pen', who: ['Uncle Ba', 'Bác Ba'], goal: ['Plant the flower at Uncle Ba’s farm', 'Trồng hoa ở trang trại Bác Ba'],
        line: ['Good soil and a little water. Look, the flower is blooming! Your flower staff is ready.', 'Đất tốt và một chút nước. Nhìn kìa, bông hoa nở rồi! Cây gậy hoa của con xong rồi.'] }
    ] },
  lumi: { friend: 'lumi', item: ['star lantern', 'đèn lồng ngôi sao'], art: 'fq:lantern', title: ['Lumi’s star lantern', 'Đèn lồng ngôi sao của Lumi'],
    done: ['Lumi’s star lantern! It lights the way in your hand now.', 'Đèn lồng ngôi sao của Lumi! Giờ nó soi đường trong tay con.'],
    steps: [
      { spot: 'npc_teo', who: ['Tèo', 'Tèo'], goal: ['Get a lantern frame from Tèo', 'Lấy khung đèn từ Tèo'],
        line: ['I make lanterns for the Mid-Autumn Festival! Here is a frame. Now find a little light for it.', 'Tớ làm đèn cho Tết Trung Thu đó! Đây là khung đèn. Giờ cậu đi tìm một ánh sáng nhỏ cho nó nhé.'] },
      { spot: 'npc_ti', who: ['Tí', 'Tí'], goal: ['Find a little light with Tí', 'Tìm ánh sáng nhỏ cùng Tí'],
        line: ['A firefly gave me this little light! Put it in your lantern, then show it to the Lotus Statue.', 'Một bạn đom đóm cho tớ ánh sáng nhỏ này! Cậu bỏ vào đèn đi, rồi mang ra Tượng Sen nhé.'] },
      { spot: 'statue', who: ['Lotus Statue', 'Tượng Sen'], goal: ['Light the lantern at the Lotus Statue', 'Thắp đèn ở Tượng Sen'],
        line: ['The lantern glows like a star. It will light the way for little plants at night. Your star lantern is ready!', 'Chiếc đèn sáng như một ngôi sao. Nó sẽ soi đường cho cây nhỏ vào ban đêm. Đèn lồng ngôi sao của con xong rồi!'] }
    ] }
};

// ---------- the save ----------
// profile.friendQuest: { finn: 0..3, ... } (the steps done); look.fitems: the friends whose item is earned, as one string
// ("finn sol"), so it travels with the look to online friends (js/net.ts keeps only short plain strings in a look)
export const questStep = (p, f: string): number => Math.max(0, Math.min(3, +((p && p.friendQuest && p.friendQuest[f]) || 0)));
export const hasItem = (look, f: string): boolean => !!look && typeof look.fitems === 'string' && look.fitems.split(' ').includes(f);
export function giveItem(p, f: string) {
  const L = p.look || (p.look = {}), have = typeof L.fitems === 'string' ? L.fitems.split(' ').filter(Boolean) : [];
  if (!have.includes(f)) have.push(f);
  L.fitems = have.join(' ');
}
/** every spoken line of the quests, for the voice pack and the `voicecover` check */
export function friendQuestLines(): [string, string][] {
  const out: [string, string][] = [];
  for (const q of Object.values(FRIEND_QUESTS)) { out.push(q.done); q.steps.forEach(s => out.push(s.line)); }
  return out;
}
