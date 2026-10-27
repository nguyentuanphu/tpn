// One HUD per player screen: hearts, money, orbs, a minimap, the current objective, the
// stamina wheel next to the hero, and big touch buttons.
import { THREE } from './gfx.js';
import { T } from './i18n.js';
import { nm } from './i18n.js';
import { ICONS } from './icons.js';
import { farm, saveProfiles } from './state.js';
import { fmt } from './money.js';
import { el, esc, clamp } from './util.js';
import { SIZE, HALF } from './world.js';
import { avatarURL } from './avatar.js';
import { pic, hasArt as hasPic } from './art.js';
import { SFX } from './audio.js';
import { say } from './voice.js';
import { explain as explainBrief } from './explain.js';
import * as feel from './feel.js';
import type { SvMain } from './main.js';
import type { Hero } from './player.js';

export const EMOTES = [
  { id: 'hi', icon: '👋', en: 'Hi!', vi: 'Xin chào!' },
  { id: 'come', icon: '🫴', en: 'Come here!', vi: 'Lại đây nè!' },
  { id: 'look', icon: '👀', en: 'Look at this!', vi: 'Nhìn này!' },
  { id: 'go', icon: '🏃', en: "Let's go!", vi: 'Đi thôi!' },
  { id: 'help', icon: '🆘', en: 'Help me please!', vi: 'Giúp tớ với!' },
  { id: 'yay', icon: '🎉', en: 'Yay! We did it!', vi: 'Hoan hô! Mình làm được rồi!' },
  { id: 'love', icon: '💖', en: 'You are my best friend!', vi: 'Bạn là bạn thân nhất của tớ!' },
  { id: 'wait', icon: '✋', en: 'Wait for me!', vi: 'Đợi tớ với!' }
];

type HudRect = { x: number, y: number, w: number, h: number, rot?: number };
type HudLast = { act?: string | null, little?: boolean, where?: boolean, h?: string, m?: string, o?: string, fm?: string, c?: string, f?: string, sig?: string };
type MiniMarker = { x: number, z: number, icon: string, size?: number, pin?: boolean, friend?: string };
export class Hud {
  i: number; hero: Hero; game: SvMain; root: HTMLElement; q: (s: string) => HTMLElement;
  mini: CanvasRenderingContext2D; wheel: HTMLCanvasElement; wctx: CanvasRenderingContext2D; navWatch: ResizeObserver; navFitFrame = 0;
  last: HudLast; nums?: number[]; rect?: HudRect; regionT: number; toastT: number; _miniT?: number; _musHeld?: boolean; _tt?: ReturnType<typeof setTimeout>; wheelA?: number;
  constructor(i: number, hero: Hero, game: SvMain) {
    this.i = i; this.hero = hero; this.game = game;
    const root = this.root = el('div', 'hud');
    root.innerHTML = `
      <div class="hud-tl">
        <div class="pcard" role="button" aria-label="${T('Settings', 'Cài đặt')}"><img class="pav" alt=""><i class="pgear">${ICONS.gear}</i><div class="pinfo"><b class="pname"></b><div class="hearts"></div></div></div>
        <div class="chips"><button class="chip c-money" data-chip="money" title="${T('Coins', 'Đồng xu')}"></button><button class="chip c-orbs" data-chip="orbs" title="${T('Sparkle Orbs', 'Ngọc Lấp Lánh')}"></button><button class="chip c-leafy" data-chip="leafy" title="${T('Leafies', 'Bạn Lá')}"></button></div>
        <div class="hud-btns">
          <button class="simplesw" aria-label="${T('Big pictures screen', 'Màn hình hình to')}"><span>${ICONS.bigTiles}</span><b>${T('Big pictures', 'Hình to')}</b></button>
        </div>
      </div>
      <div class="quest">
        <button class="q-say" aria-label="${T('Hear the goal again', 'Nghe lại nhiệm vụ')}"><span class="q-icon">📍</span><span class="q-text"></span></button>
        <button class="q-go">▶ ${T('Go', 'Đi')}<kbd class="kb">F</kbd></button>
        <button class="q-fam" hidden></button>
      </div>
      <div class="hud-tr">
        <div class="mini-wrap"><canvas class="mini" width="200" height="200"></canvas><i class="mini-n">N</i><i class="mini-me"></i></div>
        <div class="zoom"><span class="clock"></span></div>
        <button class="friendchip" hidden><span class="fc-arrow">➤</span><span class="fc-txt"></span><span class="fc-sig"></span></button>
        <div class="tools"></div>
      </div>
      <div class="zoomer"><button class="z-tray" aria-expanded="false" aria-label="${T('View: zoom, camera and where', 'Xem: phóng to, góc nhìn và chỉ đường')}">${ICONS.view}<small>${T('View', 'Xem')}</small></button><div class="ztray"><button class="z-in" aria-label="${T('Zoom in', 'Phóng to')}">${ICONS.zoomIn}<kbd class="kb">+</kbd></button><button class="z-out" aria-label="${T('Zoom out', 'Thu nhỏ')}">${ICONS.zoomOut}<kbd class="kb">−</kbd></button><button class="z-view" aria-label="${T('Camera view', 'Góc nhìn')}">${pic('🎥')}<kbd class="kb">V</kbd></button><button class="z-where" aria-label="${T('Where is…? Show me the way', 'Ở đâu? Chỉ đường cho con')}" title="${T('Where is…?', 'Ở đâu?')}">${pic('🧭')}<kbd class="kb">Y</kbd></button></div></div>
      <div class="region"></div>
      <div class="htoast"></div>
      <canvas class="wheel" width="96" height="96"></canvas>
      <div class="dock">
        <button class="dk games" aria-label="${T('Play: games, festivals, stories and songs', 'Vui chơi: trò chơi, lễ hội, truyện và bài hát')}"><span>${ICONS.games}</span><small>${T('Play', 'Vui chơi')}</small><kbd class="kb">G</kbd></button>
        <button class="dk map"><span>${ICONS.map}</span><small>${T('Map', 'Bản đồ')}</small><kbd class="kb">M</kbd></button>
        <button class="dk bag"><span>${ICONS.bag}</span><small>${T('Bag', 'Ba lô')}</small><kbd class="kb">B</kbd></button>
        <button class="dk voicecmd" hidden><span>${ICONS.ask}</span><small>${T('Ask', 'Hỏi')}</small><kbd class="kb">K</kbd></button>
        <button class="dk chat"><span>${ICONS.talk}</span><small>${T('Talk', 'Nói')}</small><kbd class="kb">T</kbd></button>
        <button class="dk call" hidden><span>${ICONS.callOff}</span><small>${T('Mic off', 'Micrô tắt')}</small><kbd class="kb">C</kbd></button>
        <button class="dk mus" hidden><span>${ICONS.music}</span><small>${T('Music', 'Nhạc')}</small><kbd class="kb">N</kbd></button>
        <button class="dk snd"><span>${ICONS.sound}</span><small>${T('Sound', 'Tiếng')}</small><kbd class="kb">O</kbd></button>
      </div>
      <button class="act" hidden><span class="ai"></span><span class="al"></span><kbd class="kb">E</kbd></button>
      <div class="hud-br">
        <div class="moves"><button class="mv run">${ICONS.run}<small>${T('Run', 'Chạy')}</small><kbd class="kb">Shift</kbd></button><button class="mv jump">${ICONS.jump}<small>${T('Jump', 'Nhảy')}</small><kbd class="kb">Space</kbd></button></div>
      </div>
      <div class="emotes" hidden></div>
      <button class="bigprompt" hidden></button>`;
    document.getElementById('huds').appendChild(root);
    this.q = s => root.querySelector(s);
    { const mc = root.querySelector('.mini'), wc = root.querySelector('.wheel'); if (!(mc instanceof HTMLCanvasElement) || !(wc instanceof HTMLCanvasElement)) throw Error('the HUD has no map or stamina picture');
      this.mini = mc.getContext('2d'); this.wheel = wc; this.wctx = wc.getContext('2d'); }
    const pad = game.pads[i];
    const hold = (b, k) => {
      b.addEventListener('pointerdown', e => { e.preventDefault(); pad[k] = true; if (k === '_btnJump') pad._jump = true; b.classList.add('down'); });
      const up = () => { pad[k] = false; b.classList.remove('down'); };
      b.addEventListener('pointerup', up); b.addEventListener('pointercancel', up); b.addEventListener('pointerleave', up);
    };
    hold(this.q('.mv.run'), '_btnRun'); hold(this.q('.mv.jump'), '_btnJump');
    this.q('.act').addEventListener('pointerdown', e => { e.preventDefault(); pad._act = true; });
    this.q('.dk.games').onclick = () => game.openGamesHub(i);
    // the Simple screen (js/simple.js): one player on this device only. Round O (owner): a clear "Big pictures" switch
    // up by the player's card, away from the play buttons (it used to be a teddy in the dock)
    this.q('.simplesw').hidden = game.mode === 'split' || i > 0;
    this.q('.simplesw').onclick = () => { SFX.tap(); game.simple && game.simple.show(); };
    this.q('.pcard').onclick = () => game.openQuick(i);
    // (owner, 16 Oct AEDT, point 50: "keep, explain on tap") the hearts explain themselves instead of opening Settings
    { const hb = this.q('.hearts'), HEARTS: [string, string] = ['Hearts show how strong you are. Little ones never lose them.', 'Trái tim cho biết con khỏe thế nào. Các bé không bao giờ mất tim.']
      hb.setAttribute('role', 'button'); hb.tabIndex = 0; hb.setAttribute('aria-label', T('What do the hearts mean?', 'Trái tim có nghĩa là gì?'));
      // (owner, 16 Oct) a short note and a short spoken line, each with its own Studio switch (js/explain.js)
      const explain = e => { e.stopPropagation(); e.preventDefault(); SFX.tap && SFX.tap(); explainBrief(this, 'hearts', HEARTS); };
      hb.onclick = explain; hb.onkeydown = e => { if (e.key === 'Enter' || e.key === ' ') explain(e); }; }
    this.q('.dk.map').onclick = () => game.openPad(i, 'map');
    this.q('.dk.bag').onclick = () => game.openPad(i, 'bag');
    // (tester's notes, 12 Oct; owner: "bottom bar") the clothes shop has its own button beside the Bag (it was inside
    // the Bag, Bug #29); only while the shop is switched on and one child plays on this device. It opens right here.
    this.q('.dk.chat').onclick = () => this.toggleEmotes();
    this.q('.dk.voicecmd').hidden = !game.voiceControlOn();
    this.q('.dk.voicecmd').onclick = () => game.voiceCommand(i);
    this.q('.dk.call').onclick = () => game.toggleMute();
    this.q('.dk.mus').onclick = () => { if (this._musHeld) { this._musHeld = false; return; } game.toggleAudio('music'); };
    // press and hold Music: the Songs page (round O)
    { const b = this.q('.dk.mus'); let t: ReturnType<typeof setTimeout> | undefined; b.addEventListener('pointerdown', () => { clearTimeout(t); t = setTimeout(() => { this._musHeld = true; game.openSongs && game.openSongs(); }, 650); }); for (const ev of ['pointerup', 'pointercancel', 'pointerleave']) b.addEventListener(ev, () => clearTimeout(t)); }
    this.q('.z-where').onclick = () => game.openWhere && game.openWhere(i);   // (Round U) "Where is…?" sparkles
    this.q('.dk.snd').onclick = () => game.openSound(this.q('.dk.snd'));   // (Round U) the three Sound switches: music, sounds, voice
    this.q('.friendchip').onclick = () => { const r = game.findFriend(i); if (r) game.say && game.say(r[0], r[1]); };
    // (r89, owner 23 Oct AEDT) the family website moved from this corner into Settings (js/ui.ts openQuick, js/website.ts)
    // (Round V, owner 13 Oct) a tap on the quest folds it to a small chip and hides its arrow and sparkles; a tap on the chip
    // opens it again and says the goal (remembered per child)
    this.q('.q-say').onclick = () => { const p = this.hero.profile; p.questFold = !p.questFold; saveProfiles(); this.foldQuest(); if (!p.questFold) game.sayObjective(i); };
    this.q('.q-go').onclick = () => game.goToObjective(i);
    this.q('.q-fam').onclick = () => game.openPad(i, 'log');   // (Round V) the family mission: its page in Adventures
    // pointerdown (not click) so zoom still works while another finger is on the joystick
    const zb = (b, f) => b.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); game.zoomBy(i, f); });
    zb(this.q('.z-in'), .8); zb(this.q('.z-out'), 1.25);
    this.q('.z-view').addEventListener('pointerdown', e => { e.preventDefault(); game.cycleView(i); });
    // (owner, 13 Oct AEDT: too many buttons down one side) zoom, camera view and Where is sit in a tray behind one View
    // button; it closes by itself after a while, or with a tap on View again (their keys work all the time)
    { const zr = this.q('.zoomer'), tb = this.q('.z-tray'); let t: ReturnType<typeof setTimeout> | undefined;
      const open = on => { zr.classList.toggle('open', on); tb.setAttribute('aria-expanded', String(on)); clearTimeout(t); if (on) { document.querySelector<HTMLElement & { close?(): void }>('.audio-tray')?.close?.(); document.querySelectorAll('.zoomer.open').forEach(z => { if (z !== zr) { z.classList.remove('open'); z.querySelector('.z-tray')?.setAttribute('aria-expanded', 'false'); } }); t = setTimeout(() => open(false), 8000); } };
      tb.addEventListener('pointerdown', e => e.stopPropagation());
      tb.onclick = e => { e.stopPropagation(); open(!zr.classList.contains('open')); };
      this.q('.ztray').addEventListener('pointerdown', () => open(true), true); }
    this.refreshAudio();
    const em = this.q('.emotes');
    EMOTES.forEach(e => { const b = el('button', 'em', `<span>${e.icon}</span><small>${esc(T(e.en, e.vi))}</small>`); b.onclick = () => { this.toggleEmotes(false); game.emote(i, e.id); }; em.appendChild(b); });
    this.regionT = 0; this.toastT = 0; this.last = {};
    this.refreshWho();
    // Layout writes belong to the next frame, outside ResizeObserver delivery.
    // Coalesce all three observed boxes; resizing the quest inside its own delivery
    // otherwise produces the repeated browser loop-delivery notices.
    this.navWatch = new ResizeObserver(() => { if (!this.navFitFrame) this.navFitFrame = requestAnimationFrame(() => { this.navFitFrame = 0; if (this.root.isConnected) this.fitQuest(); }); }); this.navWatch.observe(this.q('.hud-tr')); this.navWatch.observe(this.q('.hud-tl')); this.navWatch.observe(this.q('.quest')); // (r80: the adventure card and the language change their widths)
    // (daily adventure, chat C, 16 Oct AEDT) the goal card: js/adventure.js is loaded once, for every player's HUD
    if (!game.adventure && !game._advLoad) game._advLoad = import('./adventure.js').then(m => m.createAdventure(game)).catch(e => console.warn('daily adventure', e));
  }
  refreshAudio() {
    const s = this.game.settings, m = this.q('.dk.mus'), d = this.q('.dk.snd');
    m.classList.toggle('off', !s.music); const active = s.music || s.sound || s.voice; d.classList.toggle('off', !active); d.querySelector('span').innerHTML = active ? ICONS.sound : ICONS.soundOff; d.querySelector('small').textContent = T('Audio', 'Âm thanh'); d.setAttribute('aria-label', T('Audio: music, sounds and voice', 'Âm thanh: nhạc, tiếng động và giọng nói'));
  }
  foldQuest() { const f = !!this.hero.profile.questFold, q = this.q('.quest'); q.classList.toggle('fold', f); this.q('.q-say').setAttribute('aria-label', f ? T('Show the goal', 'Hiện nhiệm vụ') : T('Hide the goal', 'Ẩn nhiệm vụ')); this.fitQuest(); }
  fitQuest() {
    const root = this.root, nav = this.q('.hud-tr'), quest = this.q('.quest');
    // (r80, GitHub run 66: on a tablet in Vietnamese the goal row, made wider by the adventure card, sat over the Leafy
    // chip) bigger screens: the goal row stays centred, unless that would reach the corners: then it fills the space
    // between them (the coins and the player card on the left, the map and buttons on the right)
    if (!root.classList.contains('small')) {
      root.classList.remove('quest-below-nav', 'quest-gap');
      // (its width from the layout, not from the screen: the goal row's arrival animation scales it)
      const rr = root.getBoundingClientRect(), tl = this.q('.hud-tl').getBoundingClientRect(), tr = nav.getBoundingClientRect(), w = quest.offsetWidth, mid = root.clientWidth / 2;
      const L = tl.right - rr.left + 12, R = tr.left - rr.left - 12;
      if (w && (mid - w / 2 < L || mid + w / 2 > R)) { root.style.setProperty('--quest-x', Math.round((L + R) / 2) + 'px'); root.style.setProperty('--quest-gap-w', Math.max(200, Math.round(R - L)) + 'px'); root.classList.add('quest-gap'); }
      return;
    }
    // (r89, owner 23 Oct AEDT: the goal row moves up into the space the Home button left) on a phone the goal row sits just
    // under what the left corner really holds now (the player card, Big pictures, the companion row), measured, not a
    // fixed height: it moves up when that corner is shorter and down when it is taller, in each player's own half
    { const tl = this.q('.hud-tl'); let bottom = 0;
      for (const c of tl.children) if (c instanceof HTMLElement && !c.hidden && c.offsetWidth && c.offsetHeight) bottom = Math.max(bottom, c.offsetTop + c.offsetHeight);
      if (bottom) root.style.setProperty('--quest-tl-below', Math.round(tl.offsetTop + bottom) + 'px'); else root.style.removeProperty('--quest-tl-below'); }
    const reserve = nav.offsetWidth + (parseFloat(getComputedStyle(nav).right) || 0) + (parseFloat(getComputedStyle(quest).left) || 0) + 14;
    root.style.setProperty('--quest-nav-reserve', reserve + 'px');
    root.style.setProperty('--quest-below-top', (nav.offsetTop + nav.offsetHeight + 12) + 'px');
    root.classList.toggle('quest-below-nav', !quest.classList.contains('fold') && root.clientWidth - reserve < 180);
  }
  refreshWho() { const p = this.hero.profile, av = this.q('.pav'); if (av instanceof HTMLImageElement) av.src = avatarURL(p); this.q('.pname').textContent = nm(p.name); this.q('.pname').classList.toggle('starname', !!(p.look && p.look.star)); } // (owner, 12 Oct: this week's star tester gets a gold star by the name)
  toggleEmotes(v?: boolean) { const e = this.q('.emotes'); e.hidden = v == null ? !e.hidden : !v; }
  layout(r: HudRect, two?: boolean) {
    Object.assign(this.root.style, { left: r.x + 'px', top: r.y + 'px', width: r.w + 'px', height: r.h + 'px', transform: r.rot ? `rotate(${r.rot}deg)` : '' });
    this.root.classList.toggle('far', r.rot === 180);   // (two players face to face: this half is turned to the far end)
    const small = two || r.w < 560 || r.h < 420; this.root.classList.toggle('small', small); this.rect = r;
    // Audio and the microphone always stay below navigation, on desktop as on phones.
    const tools = this.q('.tools'), chat = this.q('.dk.chat');
    // (r79, owner 16 Oct: "move chat up there too") on every screen the chat button sits beside the speaker under the map,
    // so the Audio switches line up under the two of them the same way on a phone, a tablet and a computer
    if (chat.parentNode !== tools) tools.appendChild(chat);
    for (const k of ['snd', 'call', 'mus']) { const b = this.q('.dk.' + k); if (b.parentNode !== tools) tools.appendChild(b); }
    { const audio = this.q('.dk.snd'); if (tools.firstElementChild !== audio) tools.prepend(audio); if (chat.previousElementSibling !== audio) tools.insertBefore(chat, audio.nextSibling); }
    this.fitQuest();
  }
  showRegion(name: string) { const e = this.q('.region'); e.textContent = name; e.classList.remove('show'); void e.offsetWidth; e.classList.add('show'); }
  toast(msg: string, o: { explain?: boolean } = {}) { const e = this.q('.htoast'); e.textContent = msg; e.classList.toggle('explain', !!o.explain); e.classList.add('show'); clearTimeout(this._tt); this._tt = setTimeout(() => e.classList.remove('show'), Math.max(3200, msg.length * 30)); }
  setAction(it) {
    const b = this.q('.act');
    if (!it) { b.hidden = true; this.last.act = null; return; }
    const lab = it.label();
    if (this.last.act !== lab) { b.hidden = false; this.q('.act .ai').innerHTML = hasPic(it.icon) ? pic(it.icon) : esc(it.icon || '✋'); this.q('.act .al').textContent = lab; b.classList.toggle('long', lab.length > 18); b.classList.toggle('vlong', lab.length > 34); this.last.act = lab; }
  }
  // a big pulsing button in the middle of the screen (pet rescue, ferry). bigPrompt(null) hides it.
  bigPrompt(html: string | null, onTap?: () => void) {
    const b = this.q('.bigprompt'); b.hidden = !html; if (!html) return;
    b.innerHTML = html; b.classList.toggle('wait', !onTap);
    b.onpointerdown = e => { e.preventDefault(); e.stopPropagation(); if (onTap) { b.classList.remove('hit'); void b.offsetWidth; b.classList.add('hit'); onTap(); } };
  }
  setCall(on: boolean, talking?: boolean, muted?: boolean) { const b = this.q('.dk.call'); b.hidden = !on; b.querySelector('span').innerHTML = muted ? ICONS.callOff : ICONS.call; b.querySelector('small').textContent = muted ? T('Mic off', 'Micrô tắt') : T('Mic on', 'Micrô bật'); b.classList.toggle('talking', !!talking); b.classList.toggle('mute', !!muted); }   // (r63: it says whether the microphone is on)

  update(dt: number, camera: THREE.Camera, fogMap: HTMLCanvasElement | (() => HTMLCanvasElement), markers: MiniMarker[] | (() => MiniMarker[])) {
    const h = this.hero, p = h.profile;
    // under-5s: the action button's picture breathes (css: feel and sound)
    { const lt = p.age !== 'big'; if (this.last.little !== lt) { this.root.classList.toggle('little', lt); this.last.little = lt; } }
    // (batch rollout) the "Where is…?" button waits for its batch day (Studio switch 'wayfind'), unless a child playing used it
    { const w = !this.game.keep || this.game.keep('wayfind'); if (this.last.where !== w) { const b = this.q('.z-where'); if (b) b.style.display = w ? '' : 'none'; this.last.where = w; } }
    // hearts
    const hk = h.hearts + '/' + p.hearts;
    if (this.last.h !== hk) {
      let s = ''; for (let i = 0; i < p.hearts; i++) { const f = clamp(h.hearts - i, 0, 1); s += `<i class="heart" style="--f:${f}"></i>`; }
      this.q('.hearts').innerHTML = s; this.last.h = hk;
    }
    const mk = fmt(farm.coins) + '|' + p.orbs + '|' + Object.keys(p.leafies).length;
    if (this.last.m !== mk) {
      this.q('.chip.c-money').innerHTML = '<i>🪙</i>' + fmt(farm.coins); this.q('.chip.c-orbs').innerHTML = '<i>🔮</i>' + p.orbs; this.q('.chip.c-leafy').innerHTML = '<i>🍃</i>' + Object.keys(p.leafies).length;
      if (this.last.m) this.q('.chips').classList.add('bump'), setTimeout(() => this.q('.chips').classList.remove('bump'), 400);
      // (feel and sound, owner plan 16 Oct AEDT) what was earned flies into its counter from where the child last
      // tapped (js/feel.js). Coins are shared, so only the first player's screen shows them flying.
      const nums = [farm.coins, p.orbs, Object.keys(p.leafies).length];
      if (this.last.m && this.nums) [['coin', '.chip.c-money'], ['orb', '.chip.c-orbs'], ['leaf', '.chip.c-leafy']].forEach(([kind, sel], k) => {
        const d = nums[k] - this.nums[k]; if (d <= 0 || (k === 0 && this.i !== 0)) return;
        // a phone hides the counters: then they fly into the player's card
        const chip = this.q(sel), to = chip && chip.getClientRects().length && getComputedStyle(chip).visibility !== 'hidden' ? chip : this.q('.pcard');
        feel.reward(kind, null, to, k === 0 ? Math.ceil(Math.min(d, 50) / 10) : d);
      });
      this.nums = nums; this.last.m = mk;
    }
    // objective + clock
    const obj = this.game.objective(h), qi = this.game.objectiveIcon(h);
    if (this.last.o !== obj) { this.q('.q-text').textContent = obj || ''; this.q('.q-icon').textContent = qi || '📍'; this.q('.quest').hidden = !obj; this.last.o = obj; this.q('.quest').classList.remove('new'); void this.q('.quest').offsetWidth; this.q('.quest').classList.add('new'); this.foldQuest(); }
    this.q('.q-go').hidden = !this.game.questTarget(h);
    if (this.game.adventure) this.game.adventure.hud(this);   // (daily adventure) the goal card takes the goal row while today's adventure is on
    // (Round V, owner 13 Oct) a family mission that has started (told to the child, not done yet) shows under the quest too
    const P = this.game.parents, fm = P && P.openFor ? P.openFor(p).find(m => (p.missionsSeen || []).includes(m.id)) : null, fk = fm ? fm.id + ':' + T('e', 'v') : '';
    if (this.last.fm !== fk) { this.last.fm = fk; const b = this.q('.q-fam'); b.hidden = !fm; if (fm) { b.innerHTML = `${pic(fm.icon || '📝')}<span><b>${esc(T('Family mission', 'Nhiệm vụ gia đình'))}</b> ${esc(T(fm.en, fm.vi))}</span>`; b.setAttribute('aria-label', T('Family mission: ', 'Nhiệm vụ gia đình: ') + T(fm.en, fm.vi)); } }
    const night = this.game.world.isNight(), tt = this.game.world.time, hr = Math.floor(tt * 24), mn = Math.floor((tt * 24 - hr) * 60 / 10) * 10;
    const ck = (night ? '🌙 ' : '☀️ ') + String(hr).padStart(2, '0') + ':' + String(mn).padStart(2, '0');
    if (this.last.c !== ck) { this.q('.clock').textContent = ck; this.last.c = ck; }
    this.updateFriend(camera);
    // the minimap is redrawn about 15 times a second, not every frame (canvas text is slow on phones)
    this._miniT = (this._miniT || 0) - dt;
    if (this._miniT <= 0) { this._miniT = .066; this.drawMini(typeof fogMap === 'function' ? fogMap() : fogMap, typeof markers === 'function' ? markers() : markers); }
    this.drawWheel(camera);
  }

  drawMini(fogMap: HTMLCanvasElement, markers: MiniMarker[]) {
    const x = this.mini, S = 200, h = this.hero, view = 110; // metres across radius
    const k = fogMap.width / SIZE, sx = (h.pos.x + HALF) * k, sz = (h.pos.z + HALF) * k, r = view * k;
    x.clearRect(0, 0, S, S); x.save(); x.beginPath(); x.arc(S / 2, S / 2, S / 2, 0, Math.PI * 2); x.clip();
    x.fillStyle = '#cfe9f5'; x.fillRect(0, 0, S, S);
    x.drawImage(fogMap, sx - r, sz - r, r * 2, r * 2, 0, 0, S, S);
    const toMini = (wx, wz) => [S / 2 + (wx - h.pos.x) / view * S / 2, S / 2 + (wz - h.pos.z) / view * S / 2];
    for (const m of markers) {
      const [mx, my] = toMini(m.x, m.z); const off = Math.hypot(mx - S / 2, my - S / 2) > S / 2 - 10;
      if (off && !m.pin && !m.friend) continue;
      let px = mx, py = my;
      if (off) { const a = Math.atan2(my - S / 2, mx - S / 2); px = S / 2 + Math.cos(a) * (S / 2 - 12); py = S / 2 + Math.sin(a) * (S / 2 - 12); }
      if (m.friend) { // a friend online: a blue dot with their first letter, kept on the edge when far away
        x.fillStyle = '#2fa8ff'; x.beginPath(); x.arc(px, py, 11, 0, Math.PI * 2); x.fill(); x.strokeStyle = '#fff'; x.lineWidth = 3; x.stroke();
        x.fillStyle = '#fff'; x.font = 'bold 13px Fredoka, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(String(m.friend).charAt(0).toUpperCase(), px, py + 1); continue;
      }
      if (m.pin) { const pulse = 9 + Math.sin(performance.now() / 180) * 2; x.fillStyle = '#ff3b6b'; x.beginPath(); x.arc(px, py, pulse, 0, Math.PI * 2); x.fill(); x.strokeStyle = '#fff'; x.lineWidth = 3; x.stroke(); x.fillStyle = '#fff'; x.font = 'bold 12px sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('★', px, py + 1); continue; }
      x.font = (m.size || 20) + 'px sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(m.icon, px, py);
    }
    x.restore();
    x.strokeStyle = '#ffffff'; x.lineWidth = 6; x.beginPath(); x.arc(S / 2, S / 2, S / 2 - 3, 0, Math.PI * 2); x.stroke();
    this.q('.mini-me').style.transform = `translate(-50%,-50%) rotate(${-h.yaw + Math.PI}rad)`;
  }

  // the nearest online friend: name, distance and an arrow pointing their way (relative to the camera)
  updateFriend(camera: THREE.Camera) {
    const b = this.q('.friendchip'), h = this.hero;
    const list = Object.values(this.game.partners || {}).filter(P => P.pos.y > -40);
    if (!list.length) { if (!b.hidden) b.hidden = true; return; }
    const P = list.sort((a, c) => Math.hypot(a.pos.x - h.pos.x, a.pos.z - h.pos.z) - Math.hypot(c.pos.x - h.pos.x, c.pos.z - h.pos.z))[0];
    const d = Math.hypot(P.pos.x - h.pos.x, P.pos.z - h.pos.z), near = d < 6;
    b.hidden = false; b.classList.toggle('near', near);
    const pn = nm(P.name), txt = near ? T(`${pn} is here!`, `${pn} ở đây!`) : `${pn} · ${Math.round(d)} m`;
    if (this.last.f !== txt) { this.q('.fc-txt').textContent = txt; this.last.f = txt; }
    const q = this.game.netQuality && this.game.netQuality(P.id), sk = q ? q.bars + (q.route || '') : '';
    if (this.last.sig !== sk) { this.q('.fc-sig').innerHTML = q ? this.game.barsHTML(q.bars) + (q.route === 'cloud' ? '☁️' : '') : ''; this.last.sig = sk; }
    const camA = Math.atan2(camera.position.x - h.pos.x, camera.position.z - h.pos.z) + Math.PI; // the way the camera looks
    const a = Math.atan2(P.pos.x - h.pos.x, P.pos.z - h.pos.z) - camA;
    this.q('.fc-arrow').style.transform = `rotate(${-a - Math.PI / 2}rad)`;
  }
  drawWheel(camera: THREE.Camera) {
    const h = this.hero, c = this.wctx, max = h.staminaMax, full = h.stamina >= max - .001 && !h.exhausted;
    this.wheelA = clamp((this.wheelA || 0) + (full ? -.05 : .2), 0, 1);
    this.wheel.style.opacity = String(this.wheelA);
    if (this.wheelA <= 0 || !this.rect) return;
    const v = new THREE.Vector3(h.pos.x, h.pos.y + 1.6, h.pos.z).project(camera);
    const px = (v.x * .5 + .5) * this.rect.w, py = (-v.y * .5 + .5) * this.rect.h;
    this.wheel.style.transform = `translate(${px + 40}px, ${py - 60}px)`;
    c.clearRect(0, 0, 96, 96); c.lineCap = 'round';
    const base = h.profile.staminaMax;
    for (let w = 0; w < Math.ceil(max); w++) {
      const R = 36 - w * 9, cap = Math.min(1, max - w), val = clamp(h.stamina - w, 0, cap); if (R <= 4) break;
      c.lineWidth = 8; c.strokeStyle = 'rgba(0,0,0,.35)'; c.beginPath(); c.arc(48, 48, R, -Math.PI / 2, -Math.PI / 2 + cap * Math.PI * 2); c.stroke();
      c.strokeStyle = h.exhausted ? '#ff5a4a' : w >= base ? '#ffd23f' : '#7ee35a';
      c.beginPath(); c.arc(48, 48, R, -Math.PI / 2, -Math.PI / 2 + val * Math.PI * 2); c.stroke();
    }
  }
  destroy() { this.navWatch?.disconnect(); cancelAnimationFrame(this.navFitFrame); this.navFitFrame = 0; this.root.remove(); }
}

// The explorer's map. The whole valley is always shown (much easier for children to find things);
// places are labelled with big pictures.
export function fogMapFor(profile, baseMap) {
  const c = document.createElement('canvas'); c.width = c.height = baseMap.width; const x = c.getContext('2d');
  x.drawImage(baseMap, 0, 0);
  return c;
}
