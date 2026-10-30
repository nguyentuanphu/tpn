// More folk games from both homes:
// Đập niêu (smash the pot, blindfolded) · Thả diều (kite flying) · Nhảy bao bố / Sack race ·
// Backyard cricket · Pass the parcel · Chi chi chành chành · Two Homes Words (Aussie slang and
// the words the north, centre and south of Vietnam use).
import { register, tapOne } from './frame.js';
import { T, numWord } from '../i18n.js';
import { settings } from '../state.js';
import { sayIn } from '../voice.js';
import { tone } from '../audio.js';
import { el, wait, pick, rand, clamp, shuffle, local } from '../util.js';
import { count, rightAt, makeCanvas, EMOJI_FONT } from './folk.js';
import { AUSSIE_SLANG, VN_WORDS } from '../words.js';

// ---------- Đập niêu: blindfolded, listen to your friends and smash the right pot ----------
register({
  id: 'datnieu', icon: '🏺', origin: 'vn', name: () => T('Smash the Pot', 'Đập Niêu'),
  async run(api) {
    const rounds = 3, N = api.little ? 4 : [5, 6, 7, 8, 9][api.level - 1];
    api.say('You are blindfolded! Listen to your friends: left, right... When they shout HERE, smash the pot!', 'Con bị bịt mắt rồi! Nghe các bạn hô: sang trái, sang phải... Khi các bạn hô ĐÂY RỒI, đập niêu thôi!');
    for (let r = 0; r < rounds; r++) {
      api.dots(rounds, r); api.stage.innerHTML = '';
      const t = Math.floor(Math.random() * N); let i = Math.floor(N / 2) === t ? (t + 2) % N : Math.floor(N / 2);
      const w = el('div', 'nieu', `<div class="nieu-bar"></div><div class="nieu-pots">${Array.from({ length: N }, (_, k) => `<span class="pot" data-k="${k}">🏺</span>`).join('')}</div>
        <div class="nieu-me"><span>🙈</span><i>🪵</i></div><div class="nieu-blind ${api.little ? 'peek' : ''}"></div><div class="nieu-shout"></div>
        <div class="nieu-btns"><button class="pill big l">⬅️</button><button class="pill big hit">🔨 ${T('Smash!', 'Đập!')}</button><button class="pill big r">➡️</button></div>`);
      api.stage.appendChild(w);
      const me = w.querySelector('.nieu-me'), shout = w.querySelector('.nieu-shout'), pots = [...w.querySelectorAll('.pot')];
      const place = () => { me.style.left = `calc(${(i + .5) / N * 100}% - 30px)`; };
      const hint = () => {
        const [en, vi] = i < t ? ['Right! Go right!', 'Sang phải! Sang phải!'] : i > t ? ['Left! Go left!', 'Sang trái! Sang trái!'] : ['HERE! Smash it!', 'ĐÂY RỒI! Đập đi!'];
        shout.textContent = T(en, vi); shout.classList.remove('pop'); void shout.offsetWidth; shout.classList.add('pop'); api.say(en, vi);
      };
      place(); await wait(400); hint();
      // (r89) auto play listens like a child: it steps the way the friends shout, then smashes on "HERE"
      const btn = (c: string) => { const b = w.querySelector(`.nieu-btns .${c}`); return b instanceof HTMLElement ? b : null; };
      api.plan(() => w.isConnected ? btn(i < t ? 'r' : i > t ? 'l' : 'hit') : null, { maxActions: rounds * (N + 2) });
      for (;;) {
        const b = await tapOne([...w.querySelectorAll('.nieu-btns button')]); if (api.closed) return;
        if (b.classList.contains('l')) { i = Math.max(0, i - 1); api.sfx.tap(); place(); hint(); continue; }
        if (b.classList.contains('r')) { i = Math.min(N - 1, i + 1); api.sfx.tap(); place(); hint(); continue; }
        me.classList.remove('swing'); void me.offsetWidth; me.classList.add('swing'); await wait(300);
        if (i === t) {
          w.querySelector('.nieu-blind').classList.add('off'); pots[t].textContent = '💥'; api.sfx.pop(5); api.right(pots[t]);
          for (let k = 0; k < 10; k++) { const c = el('i', 'nieu-candy', pick(['🍬', '🍭', '🪙', '🍡', '⭐'])); c.style.left = (t + .5) / N * 100 + '%'; c.style.setProperty('--dx', rand(-80, 80) + 'px'); w.appendChild(c); }
          await wait(1600); break;
        }
        api.sfx.whoosh(); shout.textContent = T('Whoosh! Missed! Ha ha!', 'Vút! Trượt rồi! Ha ha!'); api.say('Whoosh! Missed! Listen again!', 'Vút! Trượt rồi! Nghe các bạn nhé!'); await wait(900); hint();
      }
    }
    api.dots(rounds, rounds); return api.win({ title: T('Three pots smashed! What great listening!', 'Đập trúng ba niêu! Con nghe giỏi quá!') });
  }
});

// ---------- Thả diều: fly a kite over the rice fields ----------
register({
  id: 'kite', icon: '🪁', origin: 'vn', name: () => T('Kite Flying', 'Thả Diều'),
  async run(api) {
    const need = api.little ? 5 : [6, 8, 10, 12, 14][api.level - 1];
    api.say('Hold your finger down to pull the string and make the kite fly up. Move your finger to steer. Catch the stars!', 'Giữ ngón tay để kéo dây cho diều bay lên. Di ngón tay để lái diều. Bắt các ngôi sao nhé!');
    const { c, g, w, h } = makeCanvas(api, .72);
    let kx = w / 2, ky = h * .5, vx = 0, vy = 0, hold = false, fx = w / 2, got = 0, last = performance.now(), wind = 0, windT = 0, done;
    const finished = new Promise<void>(r => done = r);
    const stars = [], birds = [];
    const addStar = () => stars.push({ x: rand(30, w - 30), y: rand(20, h * .55), t: 0 });
    for (let k = 0; k < 3; k++) addStar();
    const pt = e => { const q = local(c, e); fx = q.x * w / q.r.width; };
    c.onpointerdown = e => { hold = true; pt(e); if (e.isTrusted) c.setPointerCapture(e.pointerId); api.sfx.tap(); };
    c.onpointermove = e => { if (hold) pt(e); };
    c.onpointerup = c.onpointercancel = () => { hold = false; };
    const tick = now => {
      if (api.closed) return;
      const dt = Math.min(.04, (now - last) / 1000); last = now;
      windT -= dt; if (windT < 0) { windT = rand(2, 4); wind = api.little ? rand(-15, 15) : rand(-40, 40) * (1 + api.level * .15); }
      vy += (hold ? -170 : 90) * dt; vy *= .96; vx += ((hold ? (fx - kx) * 1.6 : 0) + wind - vx) * dt * 2;
      kx = clamp(kx + vx * dt, 20, w - 20); ky = clamp(ky + vy * dt, 20, h * .78);
      if (ky >= h * .78) vy = 0;
      if (!api.little && Math.random() < dt * .25 * api.level && birds.length < 2) birds.push({ x: -20, y: rand(30, h * .5), s: rand(50, 90) });
      // sky
      const sky = g.createLinearGradient(0, 0, 0, h); sky.addColorStop(0, '#7fc4f0'); sky.addColorStop(1, '#fff1d6'); g.fillStyle = sky; g.fillRect(0, 0, w, h);
      g.fillStyle = '#a7d67c'; g.fillRect(0, h * .86, w, h * .14);
      for (let k = 0; k < 8; k++) { g.fillStyle = k % 2 ? '#8cc85e' : '#9ad46a'; g.fillRect(k * w / 8, h * .86, w / 8, h * .14); }
      g.font = `${h * .1}px ${EMOJI_FONT}`; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillText('🧒', w / 2, h * .9);
      // string and kite
      g.strokeStyle = 'rgba(80,60,40,.7)'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(w / 2 + 10, h * .88); g.quadraticCurveTo((w / 2 + kx) / 2, h * .8, kx, ky + 14); g.stroke();
      g.save(); g.translate(kx, ky); g.rotate(vx / 300);
      g.fillStyle = '#e8433a'; g.beginPath(); g.moveTo(0, -18); g.lineTo(14, 0); g.lineTo(0, 22); g.lineTo(-14, 0); g.closePath(); g.fill();
      g.fillStyle = '#ffd23f'; g.beginPath(); g.moveTo(0, -18); g.lineTo(14, 0); g.lineTo(0, 0); g.closePath(); g.fill();
      g.strokeStyle = '#3cc7e8'; g.lineWidth = 2; g.beginPath(); g.moveTo(0, 22); for (let k = 1; k < 5; k++) g.lineTo(Math.sin(now / 150 + k) * 6, 22 + k * 8); g.stroke();
      g.restore();
      // stars
      for (let k = stars.length - 1; k >= 0; k--) { const s = stars[k]; s.t += dt; g.font = `${24 + Math.sin(s.t * 4) * 3}px ${EMOJI_FONT}`; g.fillText('⭐', s.x, s.y);
        if (Math.hypot(s.x - kx, s.y - ky) < 28) { stars.splice(k, 1); got++; rightAt(api, c, s.x, s.y); count(got); api.dots(need, got); if (got >= need) { done(); return; } addStar(); } }
      for (let k = birds.length - 1; k >= 0; k--) { const b = birds[k]; b.x += b.s * dt; g.font = `26px ${EMOJI_FONT}`; g.fillText('🐦', b.x, b.y + Math.sin(now / 200) * 6);
        if (Math.hypot(b.x - kx, b.y - ky) < 26) { vy += 120; vx -= 80; api.sfx.no(); birds.splice(k, 1); continue; } if (b.x > w + 30) birds.splice(k, 1); }
      requestAnimationFrame(tick);
    };
    // (r89) auto play flies like a child: holds the string towards the nearest star while the kite is below it, a short
    // touch to steer once it is above
    api.plan(() => {
      if (!c.isConnected || !stars.length) return null;
      const s = stars.reduce((a, b) => Math.hypot(a.x - kx, a.y - ky) <= Math.hypot(b.x - kx, b.y - ky) ? a : b), r = c.getBoundingClientRect();
      return { el: c, x: r.left + s.x / w * r.width, y: r.top + r.height * .6, ms: ky > s.y ? clamp((ky - s.y) * 18 + 400, 400, 1800) : 120 };
    }, { maxActions: need * 40 });
    api.dots(need, 0); requestAnimationFrame(tick);
    await finished; if (api.closed) return;
    return api.win({ title: T('Your kite flew so high!', 'Diều của con bay cao quá!') });
  }
});

// ---------- Nhảy bao bố / Sack race ----------
register({
  id: 'sackrace', icon: '🛍️', origin: 'both', name: () => T('Sack Race', 'Nhảy Bao Bố'),
  async run(api) {
    api.say('Tap Hop when you land, not while you are still in the air. Hop, hop, hop to the finish line!', 'Chạm Nhảy khi con chạm đất, đừng chạm lúc còn trên không. Nhảy, nhảy, nhảy đến vạch đích!');
    const names = [api.players[0].name, 'Noah', 'Mít'];
    const w = el('div', 'sack', `${names.map((n, k) => `<div class="lane"><span class="runner" data-k="${k}"><b>${k === 0 ? '🧒' : k === 1 ? '👦' : '👧'}</b><i>🛍️</i></span><small>${n}</small></div>`).join('')}<div class="finish"></div>`);
    const btn = el('button', 'pill big hopbtn', '⤴️ ' + T('Hop!', 'Nhảy!'));
    api.stage.append(w, btn);
    const run = [...w.querySelectorAll('.runner')], pos = [0, 0, 0], air = [0, 0, 0], place = [];
    const aiRate = api.little ? [.9, .8] : [1.3, 1.5, 1.8, 2.1, 2.4].map(x => x + (api.strong ? .3 : 0))[api.level - 1];
    const hop = k => { if (air[k] > 0 || place.includes(k)) return false; air[k] = .45; pos[k] = Math.min(100, pos[k] + (k === 0 ? 4.5 : 4.2)); return true; };
    btn.onclick = () => { if (hop(0)) api.sfx.jump(); else { api.sfx.no(); btn.classList.remove('wrong'); void btn.offsetWidth; btn.classList.add('wrong'); } };
    let last = performance.now(), aiT = [0, 0], done;
    const finished = new Promise<void>(r => done = r);
    const tick = now => {
      if (api.closed) return;
      const dt = Math.min(.05, (now - last) / 1000); last = now;
      for (let k = 0; k < 3; k++) { air[k] = Math.max(0, air[k] - dt); run[k].style.left = `calc(${pos[k] * .86}% )`; run[k].style.transform = `translateY(${-Math.sin(clamp(air[k] / .45, 0, 1) * Math.PI) * 26}px)`;
        if (pos[k] >= 100 && !place.includes(k)) { place.push(k); if (k === 0) api.sfx.ok(); } }
      for (let a = 0; a < 2; a++) { aiT[a] -= dt; const rate = Array.isArray(aiRate) ? aiRate[a] : aiRate * (a ? .92 : 1);
        // little ones: friends wait for you near the end so everyone finishes together
        const hold = api.little && pos[a + 1] > pos[0] + 8;
        if (aiT[a] <= 0 && !hold) { aiT[a] = 1 / rate * rand(.85, 1.15); hop(a + 1); } }
      if (place.includes(0)) { done(); return; }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
    // (#683, #686) auto play hops when the child's runner has landed, as a child would
    api.plan(() => !place.includes(0) && air[0] <= 0 && btn.isConnected ? btn : null, { maxActions: 30 });
    await finished; if (api.closed) return; await wait(600);
    const p = place.indexOf(0) + 1;
    return api.win({ title: p === 1 ? T('You won the sack race!', 'Con về nhất cuộc đua bao bố!') : T(`You came ${p === 2 ? '2nd' : '3rd'}! What a hopper!`, `Con về ${p === 2 ? 'nhì' : 'ba'}! Nhảy giỏi quá!`) });
  }
});

// ---------- Backyard cricket ----------
register({
  id: 'cricket', icon: '🏏', origin: 'au', name: () => T('Backyard Cricket', 'Cricket Sân Sau'),
  async run(api) {
    const need = api.little ? 6 : [8, 12, 16, 20, 24][api.level - 1], balls = api.little ? 99 : 12;
    api.say('Watch the ball come down the pitch. Tap Swing when it reaches your bat! Hit a four or a six!', 'Nhìn quả bóng lăn tới. Chạm Vung gậy khi bóng tới gậy! Đánh được bốn hoặc sáu điểm nhé!');
    const { c, g, w, h } = makeCanvas(api, .75);
    const btn = el('button', 'pill big swingbtn', '🏏 ' + T('Swing!', 'Vung gậy!')); api.stage.appendChild(btn);
    let runs = 0, ball = null, swingT = -1, msg = '', msgT = 0, bowled = 0, last = performance.now(), wait0 = 1, hitBall = null, done;
    const finished = new Promise<void>(r => done = r);
    const speed = api.little ? .45 : [.55, .65, .75, .85, .95][api.level - 1];
    const win0 = api.little ? .22 : [.17, .14, .12, .1, .09][api.level - 1];
    btn.onclick = () => { if (swingT < 0) { swingT = 0; api.sfx.whoosh(); } };
    const tick = now => {
      if (api.closed) return;
      const dt = Math.min(.04, (now - last) / 1000); last = now;
      // (audit, 9 Oct) big kids have a set number of balls; little ones keep batting until they reach the runs
      if (!ball && !hitBall) { wait0 -= dt; if (wait0 <= 0 && (api.little || bowled < balls)) { ball = { t: 0 }; bowled++; } }
      if (swingT >= 0) { swingT += dt; if (swingT > .35) swingT = -1; }
      if (ball) {
        ball.t += dt * speed;
        // hit window: the ball is at the bat when t ≈ 1
        if (swingT >= 0 && swingT < .2 && Math.abs(ball.t - 1) < win0) {
          const q = 1 - Math.abs(ball.t - 1) / win0, r = q > .7 ? 6 : q > .35 ? 4 : pick([1, 2]);
          runs += r; msg = r === 6 ? 'SIX! 🎉' : r === 4 ? 'FOUR! 👏' : T(`${r} run${r > 1 ? 's' : ''}!`, `${r} điểm!`); msgT = 1.3; api.sfx.pop(r); count(runs);
          if (r >= 4) rightAt(api, c, w / 2, h * .6); hitBall = { x: w / 2, y: h * .75, vx: rand(-1, 1) * w * .6, vy: -h * (r === 6 ? 1.6 : 1.1) }; ball = null; wait0 = 1.4;
          api.dots(need, Math.min(need, runs));
        } else if (ball.t > 1 + win0 + .05) { ball = null; wait0 = 1.1; msg = api.little ? T('Missed! Try again!', 'Trượt rồi! Thử lại!') : T('Missed!', 'Trượt rồi!'); msgT = 1; api.sfx.no(); }
      }
      if (hitBall) { hitBall.x += hitBall.vx * dt; hitBall.y += hitBall.vy * dt; hitBall.vy += h * 2 * dt; if (hitBall.y > h + 20) hitBall = null; }
      // draw
      const sky = g.createLinearGradient(0, 0, 0, h); sky.addColorStop(0, '#8ccbf0'); sky.addColorStop(.4, '#dff1ff'); sky.addColorStop(.4, '#8cc85e'); sky.addColorStop(1, '#6fb04a'); g.fillStyle = sky; g.fillRect(0, 0, w, h);
      g.fillStyle = '#d9c48a'; g.beginPath(); g.moveTo(w * .46, h * .4); g.lineTo(w * .54, h * .4); g.lineTo(w * .68, h); g.lineTo(w * .32, h); g.closePath(); g.fill();
      g.font = `${h * .08}px ${EMOJI_FONT}`; g.textAlign = 'center'; g.textBaseline = 'bottom'; g.fillStyle = '#000';
      g.fillText('🧑', w / 2, h * .42); g.fillText('🌳', w * .1, h * .42); g.fillText('🏠', w * .88, h * .42);
      g.fillStyle = '#f4efe2'; for (const x of [-6, 0, 6]) { g.fillRect(w / 2 + x - 1.5, h * .36, 3, h * .05); g.fillRect(w / 2 + x * 2.2 - 3, h * .78, 6, h * .14); }
      g.font = `${h * .2}px ${EMOJI_FONT}`; g.save(); g.translate(w * .6, h * .9); g.rotate(swingT >= 0 ? -1.2 + swingT * 7 : -.4); g.fillText('🏏', 0, 0); g.restore();
      if (ball) { const k = Math.min(1.15, ball.t), y = h * .42 + (h * .78 - h * .42) * k, r = 4 + k * 10, bounce = Math.abs(Math.sin(k * Math.PI * 1.5)) * 20 * (1 - k);
        g.fillStyle = 'rgba(0,0,0,.2)'; g.beginPath(); g.ellipse(w / 2, y, r, r * .4, 0, 0, Math.PI * 2); g.fill();
        g.fillStyle = '#c0392b'; g.beginPath(); g.arc(w / 2, y - bounce - r, r, 0, Math.PI * 2); g.fill(); }
      if (hitBall) { g.fillStyle = '#c0392b'; g.beginPath(); g.arc(hitBall.x, hitBall.y, 8, 0, Math.PI * 2); g.fill(); }
      g.font = `bold ${h * .07}px Fredoka, sans-serif`; g.fillStyle = '#1f4a2a'; g.textAlign = 'left'; g.fillText(T(`Runs: ${runs}/${need}`, `Điểm: ${runs}/${need}`), 12, h * .1);
      if (!api.little) { g.textAlign = 'right'; g.fillText(T(`Balls: ${Math.max(0, balls - bowled)}`, `Còn: ${Math.max(0, balls - bowled)} bóng`), w - 12, h * .1); }
      if (msgT > 0) { msgT -= dt; g.textAlign = 'center'; g.font = `bold ${h * .12}px Fredoka, sans-serif`; g.fillStyle = '#ff5fa2'; g.fillText(msg, w / 2, h * .3); }
      if (runs >= need || (!api.little && bowled >= balls && !ball && !hitBall && wait0 <= 0)) { done(); return; }
      requestAnimationFrame(tick);
    };
    api.dots(need, 0); requestAnimationFrame(tick);
    await finished; if (api.closed) return;
    return api.win({ title: runs >= need ? T(`${runs} runs! Howzat for batting!`, `${runs} điểm! Đánh hay quá!`) : T(`You scored ${runs} runs! Great innings!`, `Con ghi được ${runs} điểm! Giỏi lắm!`) });
  }
});

// ---------- Pass the parcel ----------
const PRIZES = ['🍬', '🎈', '🦖', '🪀', '🧸', '🍭', '🪁', '🦄', '🎨', '⭐'];
register({
  id: 'parcel', icon: '🎁', origin: 'au', name: () => T('Pass the Parcel', 'Chuyền Quà'),
  async run(api) {
    const kids = [{ e: '🧒', n: api.players[0].name }, { e: '👧', n: 'Chloe' }, { e: '👦', n: 'Liam' }, { e: '👧', n: 'Mít' }, { e: '👦', n: 'Bờm' }];
    const layers = api.little ? 3 : 4 + Math.min(2, api.level - 1);
    api.say('Pass the parcel while the music plays. When the music stops, whoever holds it rips off one layer!', 'Chuyền món quà khi nhạc vang lên. Khi nhạc dừng, ai cầm quà thì được bóc một lớp giấy!');
    const w = el('div', 'parcel', `${kids.map((k, i) => { const a = i / kids.length * Math.PI * 2 - Math.PI / 2; return `<span class="pk" style="left:calc(50% + ${(Math.cos(a) * 40).toFixed(1)}%);top:calc(50% + ${(Math.sin(a) * 40).toFixed(1)}%)"><b>${k.e}</b><small>${k.n}</small></span>`; }).join('')}<span class="pp">🎁</span><div class="pmsg"></div>`);
    api.stage.appendChild(w);
    const pp = w.querySelector('.pp'), msg = w.querySelector('.pmsg');
    let at = 0;
    const show = () => { const a = at / kids.length * Math.PI * 2 - Math.PI / 2; pp.style.left = `calc(50% + ${Math.cos(a) * 34}% - 26px)`; pp.style.top = `calc(50% + ${Math.sin(a) * 34}% - 26px)`; };
    show();
    const tune = [523, 587, 659, 523, 659, 698, 784, 698, 659, 587];
    for (let L = 0; L < layers; L++) {
      // (tester's notes, 12 Oct) the game's own tune is the only music (no background music under it), so a child hears
      // it stop; a big dancing note while it plays, a big stop sign and the child holding the gift lit up when it stops
      api.dots(layers, L); msg.innerHTML = '<b class="pnote">🎵</b>'; w.classList.add('playing'); w.querySelectorAll('.pk').forEach(k => k.classList.remove('hold'));
      // the last layer always lands with the player (it's their game!)
      const stopAt = L === layers - 1 || (api.little && L % 2 === 0) ? 0 : Math.floor(rand(1, kids.length));
      const steps = kids.length * 2 + ((stopAt - at + kids.length * 3) % kids.length);
      for (let s = 0; s < steps; s++) { if (api.closed) return; tone(tune[s % tune.length], .22, { type: 'triangle', vol: .24 }); if (s % 2 === 0) tone(tune[s % tune.length] / 2, .3, { type: 'sine', vol: .14 }); at = (at + 1) % kids.length; show(); await wait(api.little ? 300 : 240); }
      w.classList.remove('playing'); w.querySelectorAll('.pk')[at].classList.add('hold');
      msg.innerHTML = `<b class="pstop">⏸</b>${T('Music stops!', 'Nhạc dừng!')}`; api.sfx.whoosh(); await wait(900);
      if (at !== 0) {
        const pz = pick(PRIZES);
        msg.textContent = T(`${kids[at].n} rips a layer... ${pz}!`, `${kids[at].n} bóc một lớp... ${pz}!`); api.say(`${kids[at].n} found a little surprise!`, `${kids[at].n} được một món quà nhỏ!`); await wait(1800); continue;
      }
      msg.textContent = T('Your turn! Tap the present to rip the paper!', 'Đến lượt con! Chạm vào món quà để xé giấy!'); api.say('Your turn! Tap the present to rip the paper!', 'Đến lượt con! Chạm vào món quà để xé giấy!');
      pp.classList.add('mine');
      for (let tear = 0; tear < 4; tear++) { await tapOne([pp]); if (api.closed) return; api.sfx.pop(tear); pp.classList.remove('rip'); void pp.offsetWidth; pp.classList.add('rip'); }
      pp.classList.remove('mine');
      const last = L === layers - 1, pz = last ? '🏆' : pick(PRIZES);
      const card = el('div', 'pprize', `<b>${pz}</b>${last ? T('The big prize!', 'Giải thưởng lớn!') : T('A surprise!', 'Quà bất ngờ!')}`); w.appendChild(card); api.right(pp);
      // a little question hides in some layers
      if (!last && !api.little) {
        await wait(900); card.remove();
        const n = 2 + Math.floor(Math.random() * (api.level + 3)), opts = shuffle([n, n + 1, Math.max(1, n - 1)]);
        msg.innerHTML = `${T('How many?', 'Có bao nhiêu?')} <span class="pq">${pz.repeat(n)}</span>`;
        const row = el('div', 'choices'); const bs = opts.map(o => { const b = el('button', 'choice', String(o)); b._v = o; row.appendChild(b); return b; }); w.appendChild(row);
        for (;;) { const b = await tapOne<HTMLButtonElement & { _ok?: boolean; _c?: string; _o?: number; _v?: number }>(bs); if (api.closed) return; if (b._v === n) { api.right(b); break; } api.wrong(b); }
        await wait(700); row.remove();
      } else { await wait(1700); card.remove(); }
    }
    api.dots(layers, layers);
    return api.win({ title: T('Happy birthday party! You found the big prize!', 'Tiệc vui quá! Con tìm được giải thưởng lớn!') });
  }
});

// ---------- Chi chi chành chành ----------
const CHANT = [['Chi chi chành chành', 'Chi chi chành chành'], ['Cái đanh thổi lửa', 'Cái đanh thổi lửa'], ['Con ngựa chết trương', 'Con ngựa chết trương'], ['Ba vương ngũ đế', 'Ba vương ngũ đế'], ['Chấp chế đi tìm', 'Chấp chế đi tìm']];
register({
  id: 'chichi', icon: '✋', origin: 'vn', name: () => T('Chi Chi Chành Chành', 'Chi Chi Chành Chành'),
  async run(api) {
    const rounds = api.little ? 3 : 5, catchMs = api.little ? 1500 : [1000, 850, 700, 600, 520][api.level - 1];
    api.say('Put your finger in the hand and sing along. When you hear "ập", pull your finger out quickly!', 'Đặt ngón tay vào lòng bàn tay và hát theo. Khi nghe tiếng "ập", rút tay ra thật nhanh nhé!');
    let escaped = 0;
    for (let r = 0; r < rounds; r++) {
      api.dots(rounds, r); api.stage.innerHTML = '';
      const w = el('div', 'chichi', `<div class="cc-hand">🫴</div><div class="cc-finger">👆</div><div class="cc-line"></div><button class="pill big pull">✋ ${T('Pull out!', 'Rút tay!')}</button>`);
      api.stage.appendChild(w);
      const line = w.querySelector('.cc-line'), pull = w.querySelector('.pull'), hand = w.querySelector('.cc-hand'), finger = w.querySelector('.cc-finger');
      let state = 'chant', early = false;
      pull.onclick = () => { if (state === 'chant') { early = true; api.sfx.no(); line.textContent = T('Too early! Wait for "ập"!', 'Sớm quá! Chờ tiếng "ập" nhé!'); } else if (state === 'snap') { state = 'safe'; } };
      for (const [en, vi] of CHANT) { if (api.closed) return; line.textContent = vi; sayIn('vi', vi); tone(392, .12, { type: 'triangle', vol: .1 }); hand.classList.remove('bob'); void hand.offsetWidth; hand.classList.add('bob'); await wait(api.little ? 1300 : 1050); }
      // big kids sometimes get a fake "ù à ù..." pause to keep them sharp
      line.textContent = 'Ù à ù...'; sayIn('vi', 'Ù à ù'); await wait(!api.little && Math.random() < .4 ? 1400 : 700);
      if (api.closed) return;
      state = 'snap'; line.textContent = 'ẬP!'; sayIn('vi', 'Ập'); api.sfx.pop(6);
      await wait(catchMs); if (api.closed) return;
      hand.textContent = '✊';
      if (state === 'safe') { escaped++; finger.classList.add('away'); api.right(finger); line.textContent = T('You escaped!', 'Thoát rồi!'); }
      else { finger.classList.add('caught'); api.sfx.whoosh(); line.textContent = T('Caught! Hee hee!', 'Bị bắt rồi! Hi hi!'); api.say('Caught! Hee hee! Again!', 'Bị bắt rồi! Hi hi! Lại nào!'); }
      await wait(1400);
    }
    api.dots(rounds, rounds);
    return api.win({ title: T(`You escaped ${escaped} times! So quick!`, `Con thoát được ${escaped} lần! Nhanh quá!`) });
  }
});

// ---------- Two Homes Words: Aussie slang and Vietnam's regional words ----------
register({
  id: 'words', icon: '🗣️', origin: 'both', name: () => T('Two Homes Words', 'Từ Ngữ Hai Quê'),
  async run(api) {
    const rounds = api.little ? 5 : 8;
    api.say('Aussie slang and the words of north, centre and south Vietnam. Let us learn them!', 'Tiếng lóng của Úc và từ ngữ ba miền Việt Nam. Cùng học nào!');
    const REG = [['bac', 'Miền Bắc', 'the north', 2], ['trung', 'Miền Trung', 'the centre', 3], ['nam', 'Miền Nam', 'the south', 4]];
    for (let r = 0; r < rounds; r++) {
      api.dots(rounds, r); api.stage.innerHTML = '';
      const aussie = r % 2 === 0;
      if (aussie) {
        const s = pick(AUSSIE_SLANG), others = shuffle(AUSSIE_SLANG.filter(x => x !== s)).slice(0, api.little ? 1 : 2), opts = shuffle([s, ...others]);
        api.stage.appendChild(el('div', 'wq', `<div class="wq-flag">🇦🇺</div><div class="wq-word">"${s[0]}"</div><div class="wq-ex">${s[4]}</div>`));
        api.say(`What does ${s[0]} mean?`, `"${s[0]}" nghĩa là gì?`);
        const row = el('div', 'choices'); const bs = opts.map(o => { const b = el('button', 'choice wq-opt', `<b>${o[3]}</b>${T(o[1], o[2])}`); b._ok = o === s; row.appendChild(b); return b; }); api.stage.appendChild(row);
        for (;;) { const b = await tapOne<HTMLButtonElement & { _ok?: boolean; _c?: string; _o?: number; _v?: number }>(bs); if (api.closed) return; if (b._ok) { api.right(b); api.say(`Yes! ${s[0]} means ${s[1]}.`, `Đúng rồi! "${s[0]}" nghĩa là ${s[2]}.`); break; } api.wrong(b); }
      } else {
        const wd = pick(VN_WORDS.filter(x => x[2] !== x[4] || x[2] !== x[3])), rg = pick(REG), right = wd[rg[3]];
        const opts = shuffle([...new Set([wd[2], wd[3], wd[4]])]);
        api.stage.appendChild(el('div', 'wq', `<div class="wq-flag">🇻🇳</div><div class="wq-pic">${wd[0]}</div><div class="wq-word">${T(`In ${rg[2]} of Vietnam, what do people call this?`, `${rg[1]} gọi cái này là gì?`)}</div>`));
        api.say(`In ${rg[2]} of Vietnam, what do people call a ${wd[1]}?`, `${rg[1]} gọi cái này là gì?`);
        const row = el('div', 'choices'); const bs = opts.map(o => { const b = el('button', 'choice wq-opt', o); b._ok = o === right || right.split(' / ').includes(o); row.appendChild(b); return b; }); api.stage.appendChild(row);
        for (;;) { const b = await tapOne<HTMLButtonElement & { _ok?: boolean; _c?: string; _o?: number; _v?: number }>(bs); if (api.closed) return; if (b._ok) { api.right(b); break; } api.wrong(b, 'Close! Each region has its own word.', 'Gần đúng rồi! Mỗi miền có một từ riêng.'); }
        api.stage.appendChild(el('div', 'wq-all', `Bắc: <b>${wd[2]}</b> · Trung: <b>${wd[3]}</b> · Nam: <b>${wd[4]}</b>`));
        sayIn('vi', `Miền Bắc: ${wd[2]}. Miền Trung: ${wd[3]}. Miền Nam: ${wd[4]}.`);
      }
      await wait(2200);
    }
    api.dots(rounds, rounds); return api.win({ title: T('You speak like a local in both homes!', 'Con nói giỏi như người bản xứ cả hai quê!') });
  }
});
