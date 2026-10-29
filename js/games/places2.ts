// Places additions (owner, 23 Oct 2026 AEDT):
// Cyclo Ride, North-South Train, Vung Tau Lighthouse, Opera House Seats,
// Outback Road Trip, Cai Rang Floating Market, Airport Helper, Postcards Home.
import { register, untilRight } from './frame.js';
import { T } from '../i18n.js';
import { pic } from '../art.js';
import { el, wait } from '../util.js';

let styled = false;
function style() {
  if (styled) return; styled = true;
  document.head.appendChild(el('style', '', `
.pl2-board { display: flex; flex-direction: column; align-items: center; gap: 14px; padding: 12px; margin: 0 auto; max-width: 96vw; }
.pl2-stage { width: min(380px, 88vw); min-height: 200px; background: #fffdf6; border-radius: 20px; box-shadow: 0 4px 16px rgba(40, 30, 60, .14); display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; padding: 14px; text-align: center; }
.pl2-controls { display: flex; flex-wrap: wrap; gap: 10px; justify-content: center; max-width: 400px; }
.pl2-btn { min-width: 64px; min-height: 64px; padding: 10px 18px; border-radius: 999px; border: 2px solid #3b2a4f; background: #fff; box-shadow: 0 3px 0 rgba(59, 42, 79, .2); font: 800 17px var(--font, sans-serif); color: #3b2a4f; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; gap: 8px; touch-action: manipulation; }
.pl2-btn:active { transform: translateY(2px); box-shadow: 0 1px 0 rgba(59, 42, 79, .2); }
.pl2-big { font-size: 64px; line-height: 1; text-align: center; }
.pl2-desc { font: 700 16px/1.3 var(--font, sans-serif); color: #534168; max-width: 320px; }
.gl.little .pl2-btn { min-width: 64px; min-height: 64px; }
`));
}

async function runPlaceRounds(api: any, icon: string, prompt: [string, string], qs: Array<{ show: string; desc: [string, string]; choices: string[][]; answer: number | 'any' }>, done: [string, string]) {
  style(); api.say(prompt[0], prompt[1]); api.dots(qs.length, 0);
  const wrap = el('div', 'pl2-board'), stage = el('div', 'pl2-stage'), controls = el('div', 'pl2-controls');
  api.stage.appendChild(wrap); wrap.append(stage, controls);
  await wait(1500);
  let k = 0;
  while (k < qs.length) {
    const q = qs[k];
    stage.innerHTML = `<div class="pl2-big">${pic(q.show)}</div><div class="pl2-desc">${T(q.desc[0], q.desc[1])}</div>`;
    api.say(q.desc[0], q.desc[1]);
    controls.innerHTML = '';
    const btns = q.choices.map((c, i) => {
      const b = el('button', 'pl2-btn', `<span>${T(c[0], c[1])}</span>`);
      b.dataset.i = String(i);
      return b;
    });
    // (owner, 29 Oct 2026 AEDT audit) the right answer was nearly always first: the buttons are mixed now, and a free
    // choice (which way to ride, what to drink) takes either answer
    [...btns].sort(() => Math.random() - .5).forEach(b => controls.appendChild(b));
    const target = q.answer === 'any' ? btns[0] : btns[q.answer];
    api.plan(() => target, { maxActions: 6 });
    const clicked = await untilRight(api, btns, (e: HTMLElement) => q.answer === 'any' || e === target);
    if (!clicked || api.closed) return;
    api.sfx.ding();
    k++; api.dots(qs.length, k);
    await wait(300);
  }
  api.say(done[0], done[1]);
  await wait(900);
  return api.win({ title: T(done[0], done[1]) });
}

// 1. Cyclo Ride (2 rounds)
register({
  id: 'cyclo', icon: '🚲',
  name: () => T('Cyclo Ride', 'Đi Xích Lô'),
  async run(api) {
    return runPlaceRounds(api, '🚲',
      ['Ride through the ancient streets on a cyclo!', 'Ngồi xích lô ngắm phố cổ thật vui!'],
      [
        {
          show: '🏛️',
          desc: ['Turn left to the Old Quarter or right to the lake?', 'Rẽ trái vào Phố Cổ hay rẽ phải ra bờ hồ?'],
          choices: [['Lake', 'Bờ Hồ'], ['Old Quarter', 'Phố Cổ']],
          answer: 'any'
        },
        {
          show: '🌸',
          desc: ['Stop for cool lotus tea or a sweet ice cream?', 'Dừng lại uống trà sen mát lành hay ăn que kem?'],
          choices: [['Lotus Tea', 'Trà Sen'], ['Ice Cream', 'Que Kem']],
          answer: 'any'
        }
      ],
      ['What a wonderful cyclo ride!', 'Chuyến xích lô dạo phố thật thú vị!']
    );
  }
});

// 2. The North–South Train (3 rounds)
register({
  id: 'reunification', icon: '🚂',
  name: () => T('The North–South Train', 'Tàu Thống Nhất'),
  async run(api) {
    return runPlaceRounds(api, '🚂',
      ['Travel the whole country on the Reunification Express!', 'Cùng lên chuyến tàu Thống Nhất xuyên suốt đất nước!'],
      [
        {
          show: '🛤️',
          desc: ['First stop from Hanoi: cross the historic bridge or sea pass?', 'Rời ga Hà Nội: tàu qua cầu Long Biên hay qua đèo Hải Vân trước?'],
          choices: [['Long Bien Bridge', 'Cầu Long Biên'], ['Hai Van Pass', 'Đèo Hải Vân']],
          answer: 0
        },
        {
          show: '🌊',
          desc: ['Midway stop: scenic coastal pass at Da Nang!', 'Đoạn đường ven biển tuyệt đẹp ngắm vịnh Đà Nẵng!'],
          choices: [['Wave to the sea', 'Vẫy tay chào biển'], ['Sleep', 'Đi ngủ']],
          answer: 0
        },
        {
          show: '🚉',
          desc: ['Final station: arrive at Saigon Station in the sunny south!', 'Ga cuối: tàu đã đến ga Sài Gòn rực rỡ nắng ấm!'],
          choices: [['Arrive in Saigon', 'Vào Ga Sài Gòn'], ['Turn back', 'Quay lại']],
          answer: 0
        }
      ],
      ['Journey complete from North to South!', 'Chuyến tàu Bắc Nam đã về đích an toàn!']
    );
  }
});

// 3. Light the Lighthouse (2 rounds)
register({
  id: 'lighthouse', icon: '🗼',
  name: () => T('Light the Lighthouse', 'Thắp Hải Đăng Vũng Tàu'),
  async run(api) {
    return runPlaceRounds(api, '🗼',
      ['Climb up and shine the beam to guide boats home!', 'Thắp sáng ngọn hải đăng Vũng Tàu dẫn đường cho tàu bè!'],
      [
        {
          show: '💡',
          desc: ['Turn the big lens switch to light up the beacon!', 'Bật công tắc quay lăng kính để đèn tỏa sáng!'],
          choices: [['Turn Lamp On', 'Bật Đèn'], ['Wait', 'Chờ'] ],
          answer: 0
        },
        {
          show: '⛵',
          desc: ['A fishing boat is heading home. Shine the light towards them!', 'Một thuyền đánh cá đang về bờ. Chiếu đèn dẫn lối nào!'],
          choices: [['Shine Light', 'Chiếu Ánh Sáng'], ['Turn Off', 'Tắt Đèn']],
          answer: 0
        }
      ],
      ['The sea is bright and the boats are safe!', 'Biển sáng lung linh, tàu bè đã cập bến an toàn!']
    );
  }
});

// 4. Seats at the Opera House (4 rounds)
register({
  id: 'operaseats', icon: '🎭',
  name: () => T('Seats at the Opera House', 'Xếp Chỗ Nhà Hát'),
  async run(api) {
    return runPlaceRounds(api, '🎭',
      ['Help families find their seats under the white sails!', 'Giúp mọi người tìm đúng ghế trong nhà hát con sò!'],
      [
        {
          show: '🎟️',
          desc: ['Ticket says: Row A for Grandpa Owl!', 'Vé ghi: Hàng A cho Ông Cú!'],
          choices: [['Row A', 'Hàng A'], ['Row B', 'Hàng B'], ['Row C', 'Hàng C']],
          answer: 0
        },
        {
          show: '🎟️',
          desc: ['Ticket says: Row B for Little Possum!', 'Vé ghi: Hàng B cho Bé Thú Có Túi!'],
          choices: [['Row A', 'Hàng A'], ['Row B', 'Hàng B'], ['Row C', 'Hàng C']],
          answer: 1
        },
        {
          show: '🎟️',
          desc: ['Ticket says: Row C for Koala family!', 'Vé ghi: Hàng C cho gia đình Koala!'],
          choices: [['Row A', 'Hàng A'], ['Row B', 'Hàng B'], ['Row C', 'Hàng C']],
          answer: 2
        },
        {
          show: '🎶',
          desc: ['Everyone is seated! Ready for the orchestra curtain to open?', 'Mọi người đã ngồi đủ chỗ! Kéo rèm biểu diễn nhé!'],
          choices: [['Curtain Open', 'Mở Màn'], ['Sit Down', 'Ngồi Xuống']],
          answer: 0
        }
      ],
      ['The music begins under the sails!', 'Khúc nhạc du dương vang lên trong nhà hát!']
    );
  }
});

// 5. Outback Road Trip (4 rounds)
register({
  id: 'outback', icon: '🦘',
  name: () => T('Outback Road Trip', 'Đường Xuyên Úc'),
  async run(api) {
    return runPlaceRounds(api, '🦘',
      ['Pack your hat and explorer boots for the red Outback!', 'Mang mũ và ủng thám hiểm khám phá vùng Outback nước Úc!'],
      [
        {
          show: '🚙',
          desc: ['Pack water and a broad sun hat in the camper van!', 'Chuẩn bị bình nước và mũ rộng vành lên xe nào!'],
          choices: [['Pack Water', 'Xếp Bình Nước'], ['Leave empty', 'Để trống']],
          answer: 0
        },
        {
          show: '🦘',
          desc: ['Look! Kangaroos jumping across the red sand dunes!', 'Nhìn kìa! Đàn chuột túi đang nhảy qua đồi cát đỏ!'],
          choices: [['Watch Kangaroos', 'Ngắm Chuột Túi'], ['Honk loud', 'Bấm còi to']],
          answer: 0
        },
        {
          show: '🪨',
          desc: ['Giant red rock Uluru glowing at sunset!', 'Núi đá đỏ Uluru rực rỡ dưới ánh hoàng hôn!'],
          choices: [['Snap Photo', 'Chụp Ảnh'], ['Drive away', 'Lái đi']],
          answer: 0
        },
        {
          show: '🌌',
          desc: ['Look at the bright Southern Cross stars tonight!', 'Ngắm chòm sao Chữ Thập Phương Nam sáng lấp lánh!'],
          choices: [['Star Gaze', 'Ngắm Sao Trời'], ['Go indoors', 'Vào nhà']],
          answer: 0
        }
      ],
      ['What an unforgettable Outback adventure!', 'Một chuyến phiêu lưu miền đất đỏ thật tuyệt vời!']
    );
  }
});

// 6. Floating Market (3 rounds)
register({
  id: 'floating', icon: '🚣',
  name: () => T('Floating Market', 'Chợ Nổi Cái Răng'),
  async run(api) {
    return runPlaceRounds(api, '🚣',
      ['Paddle your wooden sampan along the buzzing river market!', 'Chèo xuồng ba lá khám phá chợ nổi Cái Răng nhộn nhịp!'],
      [
        {
          show: '🍉',
          desc: ['Look up at the bamboo pole: what fruit is hung up high?', 'Cây bẹo treo quả gì để khách biết xuồng đang bán?'],
          choices: [['Watermelon', 'Dưa Hấu'], ['Coconut', 'Trái Dừa']],
          answer: 0
        },
        {
          show: '🍍',
          desc: ['Trade sweet pineapples straight from boat to boat!', 'Chọn mua quả dứa mật thơm ngon từ xuồng kế bên!'],
          choices: [['Sweet Pineapple', 'Dứa Thơm'], ['Bicycle', 'Xe Đạp']],
          answer: 0
        },
        {
          show: '🍜',
          desc: ['Enjoy a hot, steaming bowl of river noodle soup!', 'Thưởng thức bát hủ tiếu nóng hổi ngay trên sông nước!'],
          choices: [['River Noodles', 'Bát Hủ Tiếu'], ['Bread', 'Bánh Mì']],
          answer: 0
        }
      ],
      ['The river market is lively and delicious!', 'Chợ nổi Cần Thơ sông nước thật thân thương!']
    );
  }
});

// 7. Airport Helper (3 rounds)
register({
  id: 'airport', icon: '✈️',
  name: () => T('Airport Helper', 'Ở Sân Bay'),
  async run(api) {
    return runPlaceRounds(api, '✈️',
      ['Help passengers navigate the airport from check-in to takeoff!', 'Giúp các bạn nhỏ làm thủ tục lên máy bay nhé!'],
      [
        {
          show: '🎫',
          desc: ['Show your boarding pass and passport at check-in counter!', 'Đưa thẻ lên tàu bay và hộ chiếu cho cô nhân viên!'],
          choices: [['Boarding Pass', 'Thẻ Lên Tàu'], ['Toy Car', 'Ô Tô Đồ Chơi']],
          answer: 0
        },
        {
          show: '🧳',
          desc: ['Put suitcase on the scale and attach luggage tag!', 'Đặt vali lên cân và dán tem hành lý cẩn thận!'],
          choices: [['Luggage Tag', 'Gắn Thẻ Hành Lý'], ['Forget bag', 'Bỏ quên']],
          answer: 0
        },
        {
          show: '🛫',
          desc: ['Walk through the gate: airplane is ready for takeoff!', 'Đi qua cửa khởi hành: máy bay đã sẵn sàng bay lên bầu trời!'],
          choices: [['Board Plane', 'Lên Máy Bay'], ['Exit airport', 'Ra về']],
          answer: 0
        }
      ],
      ['Smooth skies and safe travels!', 'Chúc mọi người một chuyến bay tốt đẹp!']
    );
  }
});

// 8. Postcards Home (3 rounds)
register({
  id: 'postcard', icon: '💌',
  name: () => T('Postcards Home', 'Gửi Bưu Thiếp'),
  async run(api) {
    return runPlaceRounds(api, '💌',
      ['Write and mail a lovely postcard to grandparents!', 'Gửi tấm bưu thiếp xinh xắn về cho ông bà yêu quý!'],
      [
        {
          show: '🏞️',
          desc: ['Choose a sunny valley picture for the front of the postcard!', 'Chọn bức ảnh thung lũng lấp lánh cho mặt trước bưu thiếp!'],
          choices: [['Sparkle Valley Photo', 'Ảnh Thung Lũng'], ['Blank paper', 'Giấy trắng']],
          answer: 0
        },
        {
          show: '📮',
          desc: ['Stick a colorful postage stamp in the top right corner!', 'Dán một con tem rực rỡ vào góc trên bên phải!'],
          choices: [['Flower Stamp', 'Tem Hoa Xinh'], ['Coin', 'Đồng Xu']],
          answer: 0
        },
        {
          show: '📬',
          desc: ['Drop the postcard into the bright red mailbox!', 'Bỏ bức thư vào thùng thư màu đỏ xinh xắn!'],
          choices: [['Mailbox', 'Thùng Thư'], ['Trash can', 'Thùng rác']],
          answer: 0
        }
      ],
      ['Grandma and Grandpa will love the postcard!', 'Ông bà sẽ rất vui khi nhận được bưu thiếp!']
    );
  }
});
