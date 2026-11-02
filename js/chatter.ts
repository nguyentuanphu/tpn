// Friends who play together also talk together: when a child comes near, the players of a folk game
// take turns saying little lines to each other in speech bubbles ("Your move!", "Một, hai, ba, nhảy!"),
// turning to face the friend they talk to. Lines follow the language.
import { THREE } from './gfx.js';
import { T, onLang } from './i18n.js';
import { dist2 } from './util.js';

export const LINES = {
  board: [['Your move!', 'Đến lượt bạn!'], ['Hmm, let me think…', 'Ừm, để tớ nghĩ…'], ['Check!', 'Chiếu tướng!'], ['Good move!', 'Nước đi hay!'], ['One more game?', 'Ván nữa nhé?']],
  rope: [['One, two, three, jump!', 'Một, hai, ba, nhảy!'], ['Faster, faster!', 'Nhanh nữa nào!'], ['My turn now!', 'Đến lượt tớ!'], ['Ten jumps!', 'Mười cái rồi!']],
  shuttle: [['Kick it to me!', 'Đá sang tớ đi!'], ['Nice kick!', 'Đá hay quá!'], ['Don’t let it fall!', 'Đừng để rơi nhé!'], ['Twenty kicks!', 'Hai mươi cái rồi!']],
  kite: [['Higher, higher!', 'Cao nữa, cao nữa!'], ['The wind is strong today!', 'Hôm nay gió mạnh quá!'], ['Look at my kite!', 'Nhìn diều của tớ kìa!'], ['Hold the string tight!', 'Giữ chặt dây nhé!']],
  footy: [['Kick it to me!', 'Đá cho tớ!'], ['Mark!', 'Bắt được rồi!'], ['Great kick, mate!', 'Đá hay lắm bạn!'], ['Up the ball!', 'Bóng lên nào!']],
  bowls: [['Close to the jack!', 'Gần quả bi trắng rồi!'], ['Your turn, love.', 'Đến lượt bà đó.'], ['Lovely bowl!', 'Lăn đẹp quá!'], ['Oh, so close!', 'Ôi, suýt nữa!']],
  playground: [['What’s the time, Mr Wolf?', 'Mấy giờ rồi, ông Sói?'], ['Rồng rắn lên mây!', 'Rồng rắn lên mây!'], ['Catch the ball, then pick up a stick!', 'Bắt bóng rồi nhặt que nhé!'], ['Count with me: one, two, three!', 'Đếm cùng tớ: một, hai, ba!'], ['Your turn!', 'Đến lượt bạn!'], ['Come and play with us!', 'Lại chơi với tụi tớ đi!']],
  village: [['Ô ăn quan: I took your mandarin!', 'Ô ăn quan: tớ ăn quan của bạn rồi!'], ['Dô ta! Pull!', 'Dô ta! Kéo nào!'], ['Hop on one leg!', 'Nhảy lò cò một chân!'], ['Five in a row, I win!', 'Năm con liền, tớ thắng!'], ['One more round?', 'Chơi thêm ván nữa nhé?']],
  market: [['Buy some phở?', 'Ăn phở không?'], ['In the south we say “trái”!', 'Miền Nam gọi là “trái” đó!'], ['Răng rứa?', 'Răng rứa?'], ['Fresh coconuts!', 'Dừa tươi đây!']],
  quanho: [['Người ơi người ở đừng về…', 'Người ơi người ở đừng về…'], ['Your turn to sing!', 'Đến lượt anh hát!'], ['Beautiful song!', 'Hát hay quá!']]
};

function bubbleSprite() {
  const c = document.createElement('canvas'); c.width = 512; c.height = 128; const x = c.getContext('2d');
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, transparent: true, depthWrite: false })); s.scale.set(3, .75, 1); s.visible = false; s.renderOrder = 5;
  s.setText = text => {
    x.clearRect(0, 0, 512, 128); let f = 40; x.font = `bold ${f}px Fredoka, "Baloo 2", sans-serif`;
    while (x.measureText(text).width > 450 && f > 18) { f -= 2; x.font = `bold ${f}px Fredoka, "Baloo 2", sans-serif`; }
    const w = Math.min(500, x.measureText(text).width + 44);
    x.fillStyle = '#fffdf6'; x.strokeStyle = '#3b2a4f'; x.lineWidth = 5; x.beginPath(); x.roundRect((512 - w) / 2, 6, w, 88, 36); x.fill(); x.stroke();
    x.beginPath(); x.moveTo(238, 92); x.lineTo(256, 122); x.lineTo(274, 92); x.fill();
    x.fillStyle = '#3b2a4f'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(text, 256, 52); t.needsUpdate = true;
  };
  return s;
}

export function createChatter(G) {
  const { scene, world } = G, groups = [];
  // members: Object3Ds (avatar roots); lines: [[en, vi], ...]; height: where the bubble sits
  G.chatGroup = (members, lines, { height = 2.6, face = true } = {}) => {
    const g = { members: members.filter(Boolean), lines, height, face, k: Math.floor(Math.random() * lines.length), who: 0, t: 1 + Math.random() * 3, show: 0, bub: bubbleSprite(), line: null };
    if (g.members.length < 1) return null;
    scene.add(g.bub); groups.push(g);
    onLang(() => { if (g.line) g.bub.setText(T(g.line[0], g.line[1])); });
    return g;
  };
  // a folk-game host on their own calls out to children passing by, and acts out their game
  const CALLS = {
    datnieu: [['Đập niêu! Who can hit the pot?', 'Đập niêu! Ai đập trúng niêu nào?'], ['Left, left, now right!', 'Trái, trái, giờ sang phải!']],
    chichi: [['Chi chi chành chành…', 'Chi chi chành chành…'], ['Quick, pull your finger away!', 'Nhanh, rút tay ra!']],
    kite: [['The wind is just right!', 'Gió vừa đẹp luôn!'], ['Let the string out slowly…', 'Thả dây từ từ thôi…']],
    words: [['Bát or chén? Both mean bowl!', 'Bát hay chén? Đều là cái bát!'], ['Learn a word with me!', 'Học một từ với cô nhé!']],
    sackrace: [['Ready, set, hop!', 'Chuẩn bị, sẵn sàng, nhảy!'], ['Hop, hop, hop!', 'Nhảy, nhảy, nhảy!']],
    parcel: [['Pass the parcel!', 'Chuyền quà nào!'], ['When the music stops, unwrap a layer!', 'Nhạc dừng thì bóc một lớp!']],
    cricket: [['Howzat!', 'Bắt được rồi!'], ['Bat first, mate!', 'Bạn đánh trước nhé!']],
    firstwords: [['Nǐ hǎo! Namaste!', 'Nǐ hǎo! Namaste!'], ['Xiè xie means thank you!', 'Xiè xie nghĩa là cảm ơn!']],
    tangram: [['Seven pieces, so many shapes!', 'Bảy mảnh, bao nhiêu là hình!'], ['Can you make a cat?', 'Con xếp được con mèo không?']],
    dragon: [['The dragon dances for good luck!', 'Rồng múa mang lại may mắn!'], ['Follow the pearl!', 'Theo viên ngọc nào!']],
    snakes: [['Roll the dice!', 'Gieo xúc xắc nào!'], ['Up the ladder!', 'Leo thang lên!']],
    rangoli: [['Coloured powder patterns for Diwali!', 'Vẽ hoa văn bột màu cho Diwali!'], ['Make both sides the same!', 'Hai bên giống nhau nhé!']]
  };
  G.hostChat = (A, game) => { const root = A.root || A; const g = G.chatGroup([root], CALLS[game] || [['Come and play with me!', 'Lại chơi với tớ đi!']], { face: false }); if (g) g.t += 3 + Math.random() * 6; if (A.anim) world.updaters.push((dt, t) => { const ph = Math.floor(t * .5 + root.position.x) % 3; A.anim(ph === 0 ? 'wave' : 'idle', t, 0); }); };
  const _p = new THREE.Vector3();
  world.updaters.push(dt => {
    const hs = G.heroes; if (!hs || !hs.length) return;
    for (const g of groups) {
      const m0 = g.members[0]; m0.getWorldPosition(_p);
      const near = hs.some(h => dist2(h.pos.x, h.pos.z, _p.x, _p.z) < 22);
      if (!near) { g.bub.visible = false; continue; }
      g.t -= dt; g.show -= dt;
      if (g.t <= 0) {
        g.t = 3.4 + Math.random() * 2; g.show = 2.8; g.who = (g.who + 1) % g.members.length; g.k = (g.k + 1) % g.lines.length;
        g.line = g.lines[g.k]; g.bub.setText(T(g.line[0], g.line[1]));
        // turn the speaker towards the friend they are talking to
        if (g.face && g.members.length > 1) { const a = g.members[g.who], b = g.members[(g.who + 1) % g.members.length], pa = a.getWorldPosition(new THREE.Vector3()), pb = b.getWorldPosition(new THREE.Vector3()); a._faceTo = Math.atan2(pb.x - pa.x, pb.z - pa.z); }
      }
      const sp = g.members[g.who]; sp.getWorldPosition(_p);
      g.bub.visible = g.show > 0; g.bub.position.set(_p.x, _p.y + g.height + Math.sin(performance.now() / 300) * .05, _p.z);
      if (sp._faceTo != null) { let d = sp._faceTo - sp.rotation.y; d = Math.atan2(Math.sin(d), Math.cos(d)); sp.rotation.y += d * Math.min(1, dt * 4); if (Math.abs(d) < .02) sp._faceTo = null; }
    }
  });
}
