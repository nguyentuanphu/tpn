// Games from the cities: Hà Nội water puppets, Bắc Ninh's Đông Hồ paintings, Đà Nẵng's fire-breathing
// Dragon Bridge, Hồ Chí Minh City traffic lights, Sydney ferries, Melbourne trams and Brisbane koalas.
// All gentle: listening, colours, counting, matching and waiting for the right moment.
import { register, tapOne } from './frame.js';
import { T, numWord } from '../i18n.js';
import { el, wait, pick, shuffle } from '../util.js';
const rand = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
// (owner, 1 Nov 2026 AEDT: "the levels often don't change anything") one value per level: under-5s keep the first, big kids
// get Easy · Medium · Hard · Talent. The values a game uses are on its stage (data-lv) for the checks.
const lv = <V>(api, little: V, easy: V, medium: V, hard: V, talent: V): V => { const v = api.little ? little : [easy, medium, hard, talent][Math.max(0, Math.min(3, api.smart || 0))]; api.lvNote?.([little, easy, medium, hard, talent], v); return v; };
const mark = (api, ...v: unknown[]) => { api.stage.dataset.lv = v.join(','); };
// Talent: a picture to remember fades away after a moment (it comes back for a moment after a wrong try)
const fadeAway = (api, e: Element | null, ms = 1800) => { if (!api.talent || !(e instanceof HTMLElement)) return; e.style.transition = 'opacity .4s'; setTimeout(() => { e.style.opacity = '0'; }, ms); };
const peek = (api, e: Element | null) => { if (!api.talent || !(e instanceof HTMLElement)) return; e.style.opacity = '1'; setTimeout(() => { e.style.opacity = '0'; }, 1200); };

// ---------- Hà Nội: water puppets (múa rối nước) — tap the puppet that is called ----------
const PUPPETS = [['🐉', 'the dragon', 'con rồng'], ['🦆', 'the duck', 'con vịt'], ['🐟', 'the fish', 'con cá'], ['🐃', 'the buffalo', 'con trâu'], ['🧑‍🌾', 'the farmer', 'chú nông dân'], ['🦊', 'the fox', 'con cáo'], ['🐸', 'the frog', 'con ếch'], ['🦢', 'the swan', 'con thiên nga']];
register({
  id: 'puppets', icon: '🎎', origin: 'vn', name: () => T('Water Puppets', 'Múa rối nước'),
  async run(api) {
    // more rounds and more puppets on the water each level (Talent: all eight)
    const rounds = lv(api, 5, 6, 8, 8, 10), many = lv(api, 2, 2, 3, 5, 7);
    mark(api, rounds, many + 1);
    api.say('In Hà Nội, puppets dance on the water! Chú Tễu calls a puppet. Tap the one he calls!', 'Ở Hà Nội, con rối múa trên mặt nước! Chú Tễu gọi con rối nào, con chạm vào con rối đó nhé!');
    await wait(2600);
    for (let r = 0; r < rounds; r++) {
      api.dots(rounds, r); api.stage.innerHTML = '';
      const pool = shuffle(PUPPETS.slice()).slice(0, many + 1), want = pick(pool);
      const pond = el('div', 'cg-pond', `<div class="cg-pavilion">🏯</div><div class="cg-water"></div>`); api.stage.appendChild(pond);
      const bs = pool.map((p, k) => { const b = el('button', 'cg-puppet', p[0]); b.style.setProperty('--d', (k * .35) + 's'); b._ok = p === want; pond.querySelector('.cg-water').appendChild(b); return b; });
      api.say(`Where is ${want[1]}?`, `${want[2].charAt(0).toUpperCase() + want[2].slice(1)} đâu rồi?`);
      for (;;) { const b = await tapOne<HTMLButtonElement & { _ok?: boolean; _c?: string; _o?: number; _v?: number }>(bs); if (api.closed) return; if (b._ok) { api.right(b); b.classList.add('jump'); api.say(`Splash! ${want[1]} dances!`, `Tõm! ${want[2]} nhảy múa!`); break; } api.wrong(b, `That is not ${want[1]}. Look again!`, `Không phải ${want[2]}. Nhìn lại nhé!`); }
      await wait(1700);
    }
    api.dots(rounds, rounds); return api.win({ title: T('Bravo, puppet master!', 'Hoan hô nghệ nhân múa rối!') });
  }
});

// ---------- Bắc Ninh: Đông Hồ paintings — colour the woodblock picture like the sample ----------
// Each picture is made of shapes; the painter's natural colours come from flowers, shells and leaves.
const DH_COLS = { red: ['#c8402c', 'red', 'đỏ (gỗ vang)'], yellow: ['#e8b830', 'yellow', 'vàng (hoa hòe)'], green: ['#4f8a3a', 'green', 'xanh (lá chàm)'], black: ['#2b2621', 'black', 'đen (than lá tre)'], white: ['#f4ead2', 'white', 'trắng (vỏ sò điệp)'] };
const DH_PICS = [
  { en: 'the pig', vi: 'con lợn', parts: [['ellipse', 50, 58, 30, 20, 'black'], ['circle', 76, 50, 10, 0, 'black'], ['circle', 42, 56, 8, 0, 'white'], ['circle', 58, 64, 6, 0, 'red'], ['rect', 30, 74, 8, 12, 'black'], ['rect', 62, 74, 8, 12, 'black']] },
  { en: 'the rooster', vi: 'con gà trống', parts: [['ellipse', 46, 60, 22, 16, 'red'], ['circle', 66, 40, 9, 0, 'yellow'], ['polygon', '62,30 66,22 70,30', 0, 0, 0, 'red'], ['polygon', '24,52 10,34 18,62', 0, 0, 0, 'green'], ['rect', 44, 74, 4, 14, 'yellow'], ['polygon', '74,40 82,43 74,46', 0, 0, 0, 'yellow']] },
  { en: 'the carp', vi: 'cá chép', parts: [['ellipse', 48, 50, 28, 14, 'yellow'], ['polygon', '76,50 92,36 92,64', 0, 0, 0, 'red'], ['circle', 30, 46, 3, 0, 'black'], ['ellipse', 50, 38, 10, 4, 'red'], ['ellipse', 50, 62, 10, 4, 'green']] },
  { en: 'the children with a toad', vi: 'em bé ôm cóc', parts: [['circle', 50, 30, 12, 0, 'white'], ['rect', 36, 42, 28, 30, 'red'], ['ellipse', 50, 62, 12, 8, 'green'], ['rect', 38, 72, 8, 14, 'yellow'], ['rect', 54, 72, 8, 14, 'yellow'], ['circle', 50, 22, 6, 0, 'black']] }
];
const dhShape = (s, fill, extra = '') => {
  const [k, a, b, c, d] = s;
  const st = `fill="${fill}" stroke="#2b2238" stroke-width="1.6" ${extra}`;
  if (k === 'ellipse') return `<ellipse cx="${a}" cy="${b}" rx="${c}" ry="${d}" ${st}/>`;
  if (k === 'circle') return `<circle cx="${a}" cy="${b}" r="${c}" ${st}/>`;
  if (k === 'rect') return `<rect x="${a}" y="${b}" width="${c}" height="${d}" rx="2" ${st}/>`;
  return `<polygon points="${a}" ${st}/>`;
};
register({
  id: 'dongho', icon: '🖼️', origin: 'vn', name: () => T('Đông Hồ Paintings', 'Tranh Đông Hồ'),
  async run(api) {
    // more pictures and more colours to choose from each level; on Talent the sample fades, so remember it
    const pics = lv(api, 2, 2, 3, 4, 4), wrongCols = lv(api, 1, 2, 3, 4, 4);
    mark(api, pics, wrongCols + 1, api.talent ? 'memory' : '');
    api.say('In Đông Hồ village in Bắc Ninh, painters print pictures with wooden blocks and natural colours. Paint your picture like the sample!', 'Ở làng Đông Hồ, Bắc Ninh, các nghệ nhân in tranh bằng khuôn gỗ và màu tự nhiên. Con tô bức tranh giống tranh mẫu nhé!');
    await wait(2600);
    const order = shuffle(DH_PICS.slice());
    for (let r = 0; r < pics; r++) {
      api.dots(pics, r); api.stage.innerHTML = '';
      const pic = order[r], parts = api.little ? pic.parts.slice(0, 3) : pic.parts;
      const sample = `<svg viewBox="0 0 100 100" class="dh-svg">${pic.parts.map(s => dhShape(s, DH_COLS[s[5]][0])).join('')}</svg>`;
      const wrap = el('div', 'dh-wrap', `<div class="dh-card"><small>${T('Sample', 'Tranh mẫu')}</small>${sample}</div><div class="dh-card mine"><small>${T('Your painting', 'Tranh của con')}</small><svg viewBox="0 0 100 100" class="dh-svg">${pic.parts.map((s, k) => dhShape(s, k < parts.length ? '#f8f1df' : DH_COLS[s[5]][0], `data-k="${k}"`)).join('')}</svg></div>`);
      api.stage.appendChild(wrap);
      const mine = wrap.querySelector('.mine svg'), sampleCard = wrap.querySelector('.dh-card');
      fadeAway(api, sampleCard, 3500);
      for (let k = 0; k < parts.length; k++) {
        const shape = mine.querySelector(`[data-k="${k}"]`); shape.classList.add('dh-now');
        const want = parts[k][5], choices = shuffle(Object.keys(DH_COLS).filter(c => c !== want)).slice(0, wrongCols).concat(want);
        const row = el('div', 'choices'); const bs = shuffle(choices).map(c => { const b = el('button', 'choice dh-col', `<i style="background:${DH_COLS[c][0]}"></i>`); b._c = c; row.appendChild(b); return b; });
        wrap.querySelector('.dh-pal')?.remove(); row.classList.add('dh-pal'); api.stage.appendChild(row);
        api.show('Which colour goes on the glowing part?', 'Phần đang sáng tô màu gì?');
        for (;;) { const b = await tapOne<HTMLButtonElement & { _ok?: boolean; _c?: string; _o?: number; _v?: number }>(bs); if (api.closed) return; if (b._c === want) { api.right(b); shape.setAttribute('fill', DH_COLS[want][0]); shape.classList.remove('dh-now'); api.say(T(DH_COLS[want][1], DH_COLS[want][2]), DH_COLS[want][2]); break; } api.wrong(b, 'Look at the sample picture!', 'Nhìn tranh mẫu nhé!'); peek(api, sampleCard); }
        row.remove(); await wait(700);
      }
      api.say(`Beautiful! You printed ${pic.en}, just like Đông Hồ painters.`, `Đẹp quá! Con đã in tranh ${pic.vi}, giống nghệ nhân Đông Hồ.`);
      await wait(2200);
    }
    api.dots(pics, pics); return api.win({ title: T('A real Đông Hồ painter!', 'Nghệ nhân tranh Đông Hồ!') });
  }
});

// ---------- Đà Nẵng: the Dragon Bridge breathes fire — count the puffs ----------
register({
  id: 'dragonfire', icon: '🐉', origin: 'vn', name: () => T('Dragon Bridge Count', 'Đếm lửa Cầu Rồng'),
  async run(api) {
    // more rounds, more puffs and quicker puffs each level, and closer numbers to choose from
    const rounds = lv(api, 4, 5, 6, 7, 8), max = lv(api, 5, 6, 8, 12, 15), gap = lv(api, 900, 800, 650, 480, 360), wrongs = lv(api, 1, 2, 2, 3, 3);
    mark(api, rounds, max, gap, wrongs);
    api.say('On weekend nights the Dragon Bridge in Đà Nẵng breathes fire and water! Count the puffs.', 'Tối cuối tuần, Cầu Rồng ở Đà Nẵng phun lửa và phun nước! Con đếm xem rồng phun mấy lần nhé.');
    await wait(2400);
    for (let r = 0; r < rounds; r++) {
      api.dots(rounds, r); api.stage.innerHTML = '';
      const n = rand(1, max), water = !api.little && Math.random() < .4;
      const sc = el('div', 'cg-dragon', `<div class="cg-drag">🐉</div><div class="cg-puffs"></div>`); api.stage.appendChild(sc);
      api.show('Count!', 'Đếm nào!');
      for (let k = 0; k < n; k++) { if (api.closed) return; const p = el('span', 'cg-puff', water ? '💦' : '🔥'); sc.querySelector('.cg-puffs').appendChild(p); api.sfx.pop && api.sfx.pop(k); await wait(gap); }
      const opts = shuffle([n, ...shuffle([n - 1, n + 1, n + 2, n - 2].filter(x => x > 0 && x <= max + 2)).slice(0, wrongs)]);
      const row = el('div', 'choices'); const bs = opts.map(o => { const b = el('button', 'choice big', String(o)); b._o = o; row.appendChild(b); return b; }); api.stage.appendChild(row);
      api.say(`How many ${water ? 'splashes of water' : 'puffs of fire'}?`, `Rồng phun mấy lần ${water ? 'nước' : 'lửa'}?`);
      for (;;) { const b = await tapOne<HTMLButtonElement & { _ok?: boolean; _c?: string; _o?: number; _v?: number }>(bs); if (api.closed) return; if (b._o === n) { api.right(b); api.say(`${(numWord as (n: number, lang?: string) => string)(n, 'en')}! Roar!`, `${(numWord as (n: number, lang?: string) => string)(n, 'vi')}! Gầm gừ!`); break; } api.wrong(b, 'Count them again!', 'Đếm lại nhé!'); }
      await wait(1600);
    }
    api.dots(rounds, rounds); return api.win({ title: T('The dragon is your friend!', 'Rồng là bạn của con rồi!') });
  }
});

// ---------- Hồ Chí Minh City: traffic lights — go on green, stop on red ----------
register({
  id: 'traffic', icon: '🚦', origin: 'vn', name: () => T('Scooter Traffic Lights', 'Đèn giao thông xe máy'),
  async run(api) {
    // more lights and a quicker change each level; Hard and Talent add the yellow light (slow down and stop), and on Talent
    // the light goes dark after a moment, so look quickly
    const rounds = lv(api, 6, 8, 10, 12, 14), pause = lv(api, 500, 600, 500, 350, 250), yellow = !api.little && api.smart >= 2;
    mark(api, rounds, pause, yellow ? 'yellow' : '', api.talent ? 'dark' : '');
    api.say('Sài Gòn has lots and lots of scooters! When the light is green, tap GO. When it is red, tap STOP. Safety first!', 'Sài Gòn có rất nhiều xe máy! Đèn xanh thì chạm ĐI. Đèn đỏ thì chạm DỪNG. An toàn là trên hết!');
    await wait(2800);
    api.stage.innerHTML = '';
    const sc = el('div', 'cg-traffic', `<div class="cg-light"><i class="r"></i><i class="y"></i><i class="g"></i></div><div class="cg-road"><span class="cg-moto">🛵</span></div>`);
    api.stage.appendChild(sc);
    const row = el('div', 'choices'); const go = el('button', 'choice big cg-go', '🟢 ' + T('GO', 'ĐI')), stop = el('button', 'choice big cg-stop', '🔴 ' + T('STOP', 'DỪNG')); row.append(stop, go); api.stage.appendChild(row);
    const light = sc.querySelector('.cg-light'), moto = sc.querySelector('.cg-moto'); let x = 0;
    for (let r = 0; r < rounds; r++) {
      api.dots(rounds, r);
      const col = yellow && Math.random() < .25 ? 'y' : Math.random() < .5 ? 'g' : 'r';
      light.className = 'cg-light'; await wait(pause); if (api.closed) return; light.classList.add(col);
      const lit = light.className; if (api.talent) setTimeout(() => { if (light.className === lit) light.className = 'cg-light'; }, 1100);
      for (;;) {
        const b = await tapOne([go, stop]); if (api.closed) return;
        if ((b === go) === (col === 'g')) { api.right(b); if (col === 'g') { x = Math.min(80, x + 10); moto.style.left = x + '%'; api.say('Green means go!', 'Đèn xanh thì đi!'); } else if (col === 'y') api.show('Yellow means slow down and stop.', 'Đèn vàng thì chạy chậm lại và dừng.'); else api.say('Red means stop. Well done!', 'Đèn đỏ thì dừng. Giỏi lắm!'); break; }
        if (col === 'y') { api.wrong(b, 'The light is yellow. Slow down and stop!', 'Đèn vàng rồi. Chạy chậm lại và dừng nhé!'); continue; }
        api.wrong(b, col === 'g' ? 'The light is green. We can go!' : 'The light is red. We must stop!', col === 'g' ? 'Đèn xanh rồi. Mình đi được!' : 'Đèn đỏ. Mình phải dừng lại!');
      }
      await wait(900);
    }
    api.dots(rounds, rounds); return api.win({ title: T('A safe scooter rider!', 'Người đi đường an toàn!') });
  }
});

// ---------- Sydney: harbour ferries — send each ferry to the wharf with the same picture ----------
const WHARVES = [['🎭', 'the Opera House', 'Nhà hát Opera'], ['🌉', 'the Harbour Bridge', 'Cầu Cảng'], ['🎡', 'Luna Park', 'Công viên Luna'], ['🦘', 'the zoo', 'sở thú'], ['🏖️', 'Manly Beach', 'bãi biển Manly'], ['🐠', 'the aquarium', 'thủy cung']];
register({
  id: 'ferries', icon: '⛴️', origin: 'au', name: () => T('Harbour Ferries', 'Phà Cảng Sydney'),
  async run(api) {
    // more ferries and more wharves each level; on Talent the picture on the ferry fades, so listen and remember
    const rounds = lv(api, 5, 6, 8, 8, 10), many = lv(api, 2, 2, 3, 4, 5);
    mark(api, rounds, many + 1, api.talent ? 'memory' : '');
    api.say('Green and yellow ferries carry people across Sydney Harbour. Send each ferry to the wharf with the same picture!', 'Những chiếc phà xanh vàng chở mọi người qua Cảng Sydney. Con đưa phà đến bến có hình giống nhé!');
    await wait(2400);
    for (let r = 0; r < rounds; r++) {
      api.dots(rounds, r); api.stage.innerHTML = '';
      const ws = shuffle(WHARVES.slice()).slice(0, many + 1), want = pick(ws);
      api.stage.appendChild(el('div', 'cg-ferry', `<div class="cg-boat">⛴️<b>${want[0]}</b></div>`));
      const row = el('div', 'choices'); const bs = ws.map(w => { const b = el('button', 'choice cg-wharf', `<span>${w[0]}</span><small>${T('Wharf', 'Bến')}</small>`); b._ok = w === want; row.appendChild(b); return b; }); api.stage.appendChild(row);
      api.say(`This ferry goes to ${want[1]}. Which wharf?`, `Phà này đi ${want[2]}. Bến nào nhỉ?`);
      const sign = api.stage.querySelector('.cg-boat b'); fadeAway(api, sign);
      for (;;) { const b = await tapOne<HTMLButtonElement & { _ok?: boolean; _c?: string; _o?: number; _v?: number }>(bs); if (api.closed) return; if (b._ok) { api.right(b); api.stage.querySelector('.cg-boat').classList.add('sail'); api.say('Toot toot! All aboard!', 'Tu tu! Lên phà nào!'); break; } api.wrong(b, 'Look at the picture on the ferry!', 'Nhìn hình trên phà nhé!'); peek(api, sign); }
      await wait(1600);
    }
    api.dots(rounds, rounds); return api.win({ title: T('Ferry captain!', 'Thuyền trưởng giỏi!') });
  }
});

// ---------- Melbourne: trams — ring the bell at the right stop ----------
register({
  id: 'tram', icon: '🚋', origin: 'au', name: () => T('Tram Stops', 'Tàu điện Melbourne'),
  async run(api) {
    // more stops and a faster tram each level; on Talent the stops have no numbers, so count them
    const rounds = lv(api, 4, 5, 6, 6, 7), stops = lv(api, 5, 6, 8, 10, 12), ms = lv(api, 1500, 1400, 1100, 800, 600);
    mark(api, rounds, stops, ms, api.talent ? 'count' : '');
    api.say('Melbourne has the most trams in the world! The tram goes stop by stop. Ring the bell at the right stop!', 'Melbourne có nhiều tàu điện nhất thế giới! Tàu đi từng trạm một. Con bấm chuông đúng trạm nhé!');
    await wait(2400);
    for (let r = 0; r < rounds; r++) {
      api.dots(rounds, r); api.stage.innerHTML = '';
      const want = rand(2, stops);
      const sc = el('div', 'cg-tramline', `<div class="cg-stops">${Array.from({ length: stops }, (_, k) => `<i>${api.talent && k ? '' : k + 1}</i>`).join('')}</div><span class="cg-tram">🚋</span>`); api.stage.appendChild(sc);
      const bell = el('button', 'choice big cg-bell', '🔔 ' + T('Ding ding!', 'Leng keng!')); const row = el('div', 'choices'); row.appendChild(bell); api.stage.appendChild(row);
      api.say(`Ring the bell at stop number ${want}!`, `Bấm chuông ở trạm số ${want} nhé!`);
      let at = 1; const tram = sc.querySelector('.cg-tram'), cells = sc.querySelectorAll('.cg-stops i');
      const place = () => { tram.style.left = ((at - .5) / stops * 100) + '%'; cells.forEach((c, k) => c.classList.toggle('on', k + 1 === at)); };
      place(); let done = false, mov = true;
      const tick = async () => { while (!done && !api.closed) { await wait(ms); if (done || api.closed) return; if (mov) { at = at >= stops ? 1 : at + 1; place(); } } };
      tick();
      // (r89) auto play rings the bell when the tram is at the stop asked for, and waits otherwise
      api.plan(() => !done && at === want ? bell : null, { maxActions: rounds * 2 });
      for (;;) {
        await tapOne([bell]); if (api.closed) return;
        if (at === want) { done = true; api.right(bell); api.say(`Stop ${want}! Everybody off!`, `Trạm ${want}! Mời xuống tàu!`); break; }
        mov = false; api.wrong(bell, `This is stop ${at}. Wait for stop ${want}!`, `Đây là trạm ${at}. Đợi đến trạm ${want} nhé!`); await wait(900); mov = true;
      }
      await wait(1500);
    }
    api.dots(rounds, rounds); return api.win({ title: T('Tram driver!', 'Bác lái tàu điện giỏi!') });
  }
});

// ---------- Brisbane: feed the koalas — give each koala the right number of gum leaves ----------
register({
  id: 'koala', icon: '🐨', origin: 'au', name: () => T('Koala Breakfast', 'Bữa sáng của Koala'),
  async run(api) {
    // more koalas and hungrier koalas each level; on Talent the koala's number fades, so remember it
    const rounds = lv(api, 4, 5, 6, 7, 8), max = lv(api, 4, 5, 7, 9, 12);
    mark(api, rounds, max, api.talent ? 'memory' : '');
    api.say('At the koala sanctuary in Brisbane, koalas munch gum leaves. Give each koala the number of leaves it asks for!', 'Ở khu bảo tồn koala Brisbane, koala ăn lá bạch đàn. Con cho mỗi bạn koala đúng số lá bạn ấy muốn nhé!');
    await wait(2400);
    for (let r = 0; r < rounds; r++) {
      api.dots(rounds, r); api.stage.innerHTML = '';
      const want = rand(1, max);
      const sc = el('div', 'cg-koala', `<div class="cg-k">🐨<b>${want}</b></div><div class="cg-bowl"></div>`); api.stage.appendChild(sc);
      const row = el('div', 'choices'); const leaf = el('button', 'choice big', '🌿 ' + T('Give a leaf', 'Cho lá')), done = el('button', 'choice big', '✅ ' + T('Done', 'Xong')); row.append(leaf, done); api.stage.appendChild(row);
      api.say(`This koala wants ${want} ${want === 1 ? 'leaf' : 'leaves'}.`, `Bạn koala này muốn ${want} chiếc lá.`);
      let n = 0; const bowl = sc.querySelector('.cg-bowl'), sign = sc.querySelector('.cg-k b'); fadeAway(api, sign, 2200);
      // (r89) auto play counts the leaves like a child: one at a time up to the number, then Done
      api.plan(() => leaf.isConnected ? (n < want ? leaf : done) : null, { maxActions: rounds * (max + 2) });
      for (;;) {
        const b = await tapOne([leaf, done]); if (api.closed) return;
        if (b === leaf) { n++; bowl.appendChild(el('span', '', '🌿')); api.sfx.pop && api.sfx.pop(n); api.show(String(n), String(n)); if (api.little && n === want) { api.right(leaf); break; } continue; }
        if (n === want) { api.right(done); break; }
        api.wrong(done, n < want ? 'More leaves please!' : 'Too many! Let us count again.', n < want ? 'Thêm lá nữa nhé!' : 'Nhiều quá! Mình đếm lại nhé.'); n = 0; bowl.innerHTML = ''; peek(api, sign);
      }
      sc.querySelector('.cg-k').classList.add('munch'); api.say('Munch munch! Thank you!', 'Nhồm nhoàm! Cảm ơn con!');
      await wait(1600);
    }
    api.dots(rounds, rounds); return api.win({ title: T('Koala keeper!', 'Người chăm koala giỏi!') });
  }
});
