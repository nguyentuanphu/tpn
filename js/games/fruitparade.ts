import { register } from './frame.js';
import type { GameOnline } from './frame.js';
import { T } from '../i18n.js';
import { pic } from '../art.js';
import { reduceMotion } from '../state.js';
import { events } from '../core/events.js';
import { ParadeSession } from './fruitparade-session.js';
import { laneSymbol, randomStream, symbolDef } from './fruitparade-engine.js';
import type { ParadeRound } from './fruitparade-engine.js';
import { PARADE_STYLE } from './fruitparade-style.js';
import { paradeInput } from './fruitparade-input.js';

type ParadeApi = {
  stage: HTMLElement; players: { id?: string; name?: string }[]; online?: GameOnline | null; closed: boolean;
  tier(): number; onCleanup(fn: () => void): void; dots(total: number, done: number): void;
  show(en: string, vi: string): void; say(en: string, vi: string): void; right(): void;
  sfx: { tap(): void }; win(extra: { title: string; titleVi: string }): Promise<unknown>;
  plan?(fn: () => Element | null, opts: { maxActions: number }): void;
};
function node<K extends keyof HTMLElementTagNameMap>(tag: K, cls = '', text = '') {
  const el = document.createElement(tag);el.className = cls;el.textContent = text;return el;
}
const artwork = (glyph: string) => { const el = node('span');el.innerHTML = pic(glyph);return el; };
const keyOf = (seat: number, lane: number) => `${seat}:${lane}`;

async function run(api: ParadeApi) {
  const style = node('style');style.textContent = PARADE_STYLE;api.stage.append(style);
  const root = node('div', 'parade');api.stage.classList.add('parade-stage');api.stage.append(root);
  api.stage.closest('.gl')?.classList.add('gl-parade');
  let session: ParadeSession | undefined, helper = false, calm = reduceMotion(), dead = false, ending = false;
  let frame = 0, previous = 0, roundAge = 0, waitingSince = 0, lastSync = 0, lastRound = '', queued = false;
  const clocks = new Map<string, number>(), strips = new Map<string, HTMLElement>(), cells = new Map<string, HTMLElement[]>();
  const pending = new Set<string>(), reported = new Set<string>();
  let finishRun: () => void = () => {};
  const done = new Promise<void>(resolve => { finishRun = resolve; });
  const owned = (seat: number) => !!session && (session.online ? seat === session.mine : !helper || seat === session.mine);
  const controlled = () => session && !session.view.state?.outcome && !session.waiting ? Array.from({ length: session.seats }, (_, seat) => seat).filter(owned) : [];
  const tick = (r: ParadeRound, seat: number, lane: number) => Math.min(1800, Math.round((clocks.get(keyOf(seat, lane)) || 0) / r.config.interval));
  const button = (text: string, action: string, cls = '') => { const b = node('button', cls, text);b.type = 'button';b.dataset.paradeAction = action;return b; };
  const schedulePaint = () => { if (queued || dead) return;queued = true;queueMicrotask(() => { queued = false;if (!dead) paint(); }); };
  function start(seats: number, withHelper: boolean) {
    helper = withHelper;api.say('Find the pictures. Stop in the middle.', 'Tìm tranh. Dừng ở giữa nhé.');
    const online = api.online;
    session = new ParadeSession({ seed: online?.seed || `parade-${Date.now()}`, tier: api.tier(), seats,
      channel: online ? { mine: online.mine, seats, seed: online.seed || 'parade', send: (n, value) => online.move(n, value),
        listen: fn => online.onMove?.(fn), read: (n, seat) => online.next?.(n, seat) || Promise.resolve(undefined),
        connected: () => online.connected?.() ?? true, present: seat => online.present?.(seat) ?? true, leave: () => online.leave?.() } : undefined,
      changed: schedulePaint });
    paint();
  }
  function stop(seat: number, lane: number) {
    const state = session?.view.state, key = keyOf(seat, lane);
    if (!session || !state || session.waiting || !owned(seat) || pending.has(key) || state.outcome || state.stops.some(s => s.seat === seat && s.lane === lane)) return;
    if (session.submit(seat, lane, tick(state.round, seat, lane))) { pending.add(key);api.sfx.tap();schedulePaint(); }
  }
  const input = paradeInput(root, controlled, stop, () => root.querySelector<HTMLButtonElement>('[data-parade-action=next],[data-parade-action=solo]')?.click());
  function paint() {
    if (!session) return;
    const state = session.view.state;
    root.replaceChildren();strips.clear();cells.clear();root.dataset.calm = String(calm);
    if (!state) { root.append(node('div', 'parade-intro', T('Getting our shared pictures ready…', 'Đang chuẩn bị tranh chung…')));return; }
    const r = state.round, roundKey = `${r.round}:${r.attempt}`;
    root.dataset.round = String(r.round);root.dataset.attempt = String(r.attempt);root.dataset.mode = session.online ? 'online' : helper ? 'npc' : session.seats > 1 ? 'local' : 'solo';
    if (roundKey !== lastRound) { lastRound = roundKey;clocks.clear();pending.clear();roundAge = 0; }
    for (const s of state.stops) pending.delete(keyOf(s.seat, s.lane));
    api.dots(r.config.rounds, r.round);
    const head = node('section', 'parade-team');head.append(node('h2', '', session.seats > 1 ? T('Find these together!', 'Cùng tìm những tranh này!') : T('Find these pictures!', 'Tìm những tranh này nhé!')));
    const mission = node('div', 'parade-mission');mission.setAttribute('aria-label', T('Our picture mission', 'Nhiệm vụ tìm tranh'));
    for (const symbol of r.goals.flat()) mission.append(artwork(symbolDef(symbol).art));
    const progress = session.view.progress, matched = progress?.matched || 0, needed = r.goals.flat().length;
    const status = node('div', 'parade-status', T(`${matched} of ${needed} pictures found`, `Đã tìm ${matched} trong ${needed} tranh`));status.setAttribute('role', 'status');
    const meter = node('div', 'parade-meter'), fill = node('i');fill.style.width = `${matched / needed * 100}%`;meter.append(fill);head.append(mission, status, meter);root.append(head);
    const tools = node('div', 'parade-tools');
    tools.append(button(calm ? T('Still pictures: tap a window to change', 'Tranh tĩnh: chạm tranh để đổi') : T('Make the pictures still', 'Cho tranh đứng yên'), 'calm'));
    root.append(tools);
    const boards = node('div', 'parade-boards');
    const seats = Array.from({ length: session.seats }, (_, seat) => seat).sort((a, b) => Number(b === session!.mine) - Number(a === session!.mine));
    for (const seat of seats) {
      const isNpc = helper && !session.online && seat !== session.mine;
      const panel = node('section', `parade-player${isNpc ? ' npc' : ''}`);panel.dataset.seat = String(seat);
      const name = isNpc ? T('Garden helper', 'Bạn vườn') : api.online?.names[seat] || api.players[seat]?.name || T(`Player ${seat + 1}`, `Bạn ${seat + 1}`);
      const title = node('h3');title.append(artwork(isNpc ? '🦉' : '🧒'), node('span', '', name));panel.append(title);
      const lanes = node('div', 'parade-lanes');
      for (let lane = 0; lane < 3; lane++) {
        const key = keyOf(seat, lane), locked = state.stops.find(s => s.seat === seat && s.lane === lane);
        const box = node('div', `parade-lane${locked ? ' locked' : ''}`);box.dataset.lane = String(lane);
        const hint = node('div', 'parade-hint');
        const target = r.goals[seat][lane];
        if (target) { hint.append(node('span', '', T('Find', 'Tìm')), artwork(symbolDef(target).art));hint.dataset.target = target; }
        else hint.textContent = T('Your choice', 'Con chọn nhé');
        const window = calm ? node('button', 'parade-window') : node('div', 'parade-window');
        if (window instanceof HTMLButtonElement) {
          window.type = 'button';window.dataset.paradeAction = 'change';window.dataset.seat = String(seat);window.dataset.lane = String(lane);
          window.disabled = !!locked || !owned(seat) || pending.has(key) || !!state.outcome || session.waiting;
        } else window.setAttribute('role', 'img');
        const strip = node('div', 'parade-strip');const row = Array.from({ length: 5 }, () => node('div', 'parade-cell'));strip.append(...row);window.append(strip);strips.set(key, strip);cells.set(key, row);
        const stopButton = button(locked ? T('Found ✓', 'Đã chọn ✓') : T(`STOP ${lane + 1}`, `DỪNG ${lane + 1}`), 'stop', 'parade-stop');
        stopButton.dataset.seat = String(seat);stopButton.dataset.lane = String(lane);stopButton.disabled = !!locked || !owned(seat) || pending.has(key) || !!state.outcome || session.waiting;
        stopButton.setAttribute('aria-label', T(`Stop lane ${lane + 1} for ${name}`, `Dừng làn ${lane + 1} của ${name}`));
        box.append(hint, window, stopButton);
        lanes.append(box);
      }
      panel.append(lanes);boards.append(panel);
    }
    root.append(boards);
    root.append(node('p', 'parade-keyboard', T('Keys 1 2 3 · Second player J K L · Controller A X Y', 'Phím 1 2 3 · Bạn thứ hai J K L · Tay cầm A X Y')));
    const connection = node('div', 'parade-connection');connection.hidden = !session.waiting;connection.setAttribute('role', 'status');
    connection.append(node('div', '', T('Waiting for our friend… Your pictures are safe.', 'Đang chờ bạn… Các tranh đã chọn vẫn được giữ.')));
    if (session.waiting && waitingSince && performance.now() - waitingSince >= 30000) connection.append(button(T('Continue alone', 'Chơi tiếp một mình'), 'alone'), button(T('Continue with a helper', 'Chơi tiếp cùng bạn máy'), 'helper'));
    root.append(connection);
    if (state.outcome) {
      const result = state.outcome, outcomeKey = `${roundKey}:result`;
      const resultBox = node('section', 'parade-result');resultBox.dataset.success = String(result.success);resultBox.setAttribute('role', 'status');
      resultBox.append(node('h3', '', result.success ? T('Wonderful teamwork!', 'Cùng nhau giỏi quá!') : T('Great try! Look at what we found!', 'Giỏi lắm! Xem mình tìm được gì nào!')));
      if (result.star) resultBox.append(artwork('⭐'));
      for (const effect of result.effects) resultBox.append(artwork(effect === 'ladybug' ? '🐞' : effect === 'dragon' ? '🐉' : '🗝️'));
      if (session.authority) {
        const retry = !result.success && r.attempt === 0;
        resultBox.append(button(retry ? T('Try together once more', 'Cùng thử thêm lần nữa') : r.round === r.config.rounds - 1 ? T('Finish our parade', 'Hoàn thành đoàn vui') : T('Next picture mission', 'Nhiệm vụ tranh tiếp'), 'next', 'parade-primary'));
      } else resultBox.append(node('p', '', T('Our friend will start the next mission.', 'Bạn sẽ mở nhiệm vụ tiếp theo.')));
      root.append(resultBox);
      if (!reported.has(outcomeKey)) {
        reported.add(outcomeKey);
        if (result.success) { api.right();api.say('Wonderful teamwork!', 'Cùng nhau giỏi quá!'); }
        else api.say('Great try! Look at what we found!', 'Giỏi lắm! Xem mình tìm được gì nào!');
        if (result.success) for (const activityType of result.effects) events.emit('ArcadeAdventureTriggered', { sourceGame: 'fruitparade', activityType, playerIds: api.players.map(player => player.id).filter(Boolean), combination: state.stops.map(s => s.symbol), round: r.round, reward: null });
      }
    }
    draw();
    if (session.view.finished && !ending) {
      ending = true;
      void api.win({ title: T('Our parade is complete!', 'Đoàn vui của mình hoàn thành rồi!'), titleVi: 'Đoàn vui của mình hoàn thành rồi!' }).finally(finishRun);
    }
  }
  function draw() {
    const state = session?.view.state;if (!state) return;
    for (let seat = 0; seat < state.round.seats; seat++) for (let lane = 0; lane < 3; lane++) {
      const key = keyOf(seat, lane), strip = strips.get(key), rows = cells.get(key);if (!strip || !rows) continue;
      const locked = state.stops.find(s => s.seat === seat && s.lane === lane), time = (clocks.get(key) || 0) / state.round.config.interval;
      const index = locked ? 0 : calm ? Math.round(time) : Math.floor(time);
      strip.style.transform = `translateY(calc(var(--parade-cell) * ${locked || calm ? 0 : -(time - index)}))`;
      rows.forEach((row, i) => {
        const symbol = locked ? locked.symbol : laneSymbol(state.round, seat, lane, index + i - 2);
        if (row.dataset.symbol !== symbol) { row.dataset.symbol = symbol;row.innerHTML = pic(symbolDef(symbol).art); }
        row.style.visibility = locked && i !== 2 ? 'hidden' : '';
      });
      const visible = locked?.symbol || laneSymbol(state.round, seat, lane, tick(state.round, seat, lane));
      strip.parentElement!.setAttribute('aria-label', calm && !locked ? T(`Next picture. Now ${symbolDef(visible).en}`, `Tranh tiếp. Hiện là ${symbolDef(visible).vi}`) : T(symbolDef(visible).en, symbolDef(visible).vi));strip.parentElement!.dataset.symbol = visible;
    }
  }
  root.onclick = event => {
    const target = event.target instanceof Element ? event.target.closest<HTMLButtonElement>('button[data-parade-action]') : null;
    if (!target || target.disabled) return;
    const action = target.dataset.paradeAction;
    if (action === 'solo') start(1, false);
    else if (action === 'npc') start(2, true);
    else if (action === 'calm') { calm = !calm;paint(); }
    else if (action === 'stop') stop(Number(target.dataset.seat), Number(target.dataset.lane));
    else if (action === 'change' && session?.view.state) { const key = keyOf(Number(target.dataset.seat), Number(target.dataset.lane));clocks.set(key, (Math.round((clocks.get(key) || 0) / session.view.state.round.config.interval) + 1) * session.view.state.round.config.interval);draw();api.sfx.tap(); }
    else if (action === 'next') { api.sfx.tap();session?.advance(); }
    else if (action === 'alone' || action === 'helper') { helper = action === 'helper';session?.continueLocally();waitingSince = 0;paint(); }
  };
  function animate(now: number) {
    if (dead || api.closed) return;
    const dt = previous ? Math.min(100, now - previous) : 0;previous = now;
    const state = session?.view.state;
    if (session?.waiting) {
      if (!waitingSince) { waitingSince = now;paint(); }
      else if (now - waitingSince >= 30000 && !root.querySelector('[data-parade-action=alone]')) paint();
    } else if (waitingSince) { waitingSince = 0;paint(); }
    if (session?.online && now - lastSync > 5000) { lastSync = now;session.resync(); }
    if (state && !state.outcome && !session?.waiting && !document.hidden) {
      roundAge += dt;
      for (let seat = 0; seat < state.round.seats; seat++) for (let lane = 0; lane < 3; lane++) {
        const key = keyOf(seat, lane);if (state.stops.some(s => s.seat === seat && s.lane === lane)) continue;
        const npc = helper && !session!.online && seat !== session!.mine;
        if (!calm || npc) clocks.set(key, Math.min(1800 * state.round.config.interval, (clocks.get(key) || 0) + dt));
        if (npc && roundAge > 1800 + lane * 700 + seat * 600) {
          const wanted = state.round.goals[seat][lane], shown = laneSymbol(state.round, seat, lane, tick(state.round, seat, lane));
          const imperfect = state.round.config.tier > 0 && randomStream(`${session!.seed}:${lastRound}:${key}:npc`)() < .2;
          if (imperfect || !wanted || shown === wanted || shown === 'rainbow' || roundAge > 16000) session!.submit(seat, lane, tick(state.round, seat, lane));
        }
      }
      draw();
    }
    input.poll();
    frame = requestAnimationFrame(animate);
  }
  api.plan?.(() => {
    if (!session) return root.querySelector('[data-parade-action=solo]');
    const state = session.view.state;if (!state) return null;
    if (state.outcome) return root.querySelector('[data-parade-action=next]');
    for (const seat of controlled()) for (let lane = 0; lane < 3; lane++) {
      if (state.stops.some(s => s.seat === seat && s.lane === lane) || pending.has(keyOf(seat, lane))) continue;
      const shown = laneSymbol(state.round, seat, lane, tick(state.round, seat, lane)), goal = state.round.goals[seat][lane];
      const selector = `[data-parade-action=stop][data-seat="${seat}"][data-lane="${lane}"]`;
      if (!goal || shown === goal || shown === 'rainbow') return root.querySelector(selector);
      if (calm) return root.querySelector(`[data-parade-action=change][data-seat="${seat}"][data-lane="${lane}"]`);
    }
    return null;
  }, { maxActions: 120 });
  api.onCleanup(() => { dead = true;cancelAnimationFrame(frame);input.dispose();session?.dispose();root.onclick = null;api.stage.classList.remove('parade-stage');api.stage.closest('.gl')?.classList.remove('gl-parade');finishRun(); });
  if (api.online) start(api.online.names.length, false);
  else {
    api.say('Who will play?', 'Ai cùng chơi nào?');
    const intro = node('section', 'parade-intro');intro.append(artwork('🍎'), node('h2', '', T('Let’s make a fruit parade!', 'Cùng làm đoàn trái cây vui nhé!')));
    const choices = node('div', 'parade-choices');
    for (const [action, art, en, vi] of [['solo', '🍎', 'Play alone', 'Chơi một mình'], ['npc', '🦉', 'Play with a helper', 'Chơi cùng bạn máy']]) {   // (owner, 31 Oct 2026 AEDT) together: in the Friends section
      const b = button(T(en, vi), action, action === 'solo' ? 'parade-primary' : 'parade-friend');b.prepend(artwork(art));choices.append(b);
    }
    intro.append(choices);root.append(intro);
  }
  frame = requestAnimationFrame(animate);
  return done;
}
register({ id: 'fruitparade', icon: '🍎', online: true, name: () => T('Sparkle Fruit Parade', 'Diễu hành trái cây lấp lánh'), run });
