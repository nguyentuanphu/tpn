import { T } from '../i18n.js';
import { reduceMotion } from '../state.js';
import { FLOWER_STACKS, trongNuReady } from './trongnu-rules.js';
import { paradeInput } from './fruitparade-input.js';

type JumpApi = { stage: HTMLElement; closed: boolean; tier(): number; onCleanup(fn: () => void): void; say(en: string, vi: string): void; show(en: string, vi: string): void; right(element?: HTMLElement): void; dots(n: number, done: number): void; sfx: { tap(): void }; plan(fn: () => Element | null, options: { maxActions: number }): void; win(extra: { title: string; titleVi: string }): Promise<unknown> };
const W = 'stroke="#3b2a4f" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"';
const child = (shirt: string, seated = false) => `<circle cx="0" cy="-60" r="17" fill="#ffc99b" ${W}/><path d="M-16-63q16-24 32 0" fill="#624352" ${W}/><circle cx="-5" cy="-59" r="2" fill="#3b2a4f"/><circle cx="6" cy="-59" r="2" fill="#3b2a4f"/><path d="M-4-52q4 4 8 0" fill="none" ${W}/><path d="M-12-40h24l6 27h-36z" fill="${shirt}" ${W}/>${seated ? `<path d="M-8-13q25-9 43 3l40-5M5-13q23 15 40 5l25-3" fill="none" ${W}/>` : `<path d="M-10-13l-5 15h-10M10-13l5 15h10" fill="none" ${W}/>`}<path d="M-13-36l-16 15M13-36l16 15" fill="none" ${W}/>`;
function drawing(level: number) {
  return `<svg viewBox="90 50 380 285" role="img" aria-label="${T('Two seated friends build a foot and hand stack for a friend to jump over', 'Hai bạn ngồi chồng chân và tay để bạn cùng nhảy qua')}">
    <rect x="8" y="8" width="624" height="324" rx="40" fill="#e3f5ff"/><path d="M12 245q130-55 300 0t316-8v90H12z" fill="#bce8bb"/><path d="M40 288h558" stroke="#73b775" stroke-width="6" stroke-linecap="round"/>
    <g transform="translate(245 250)">${child('#bc9fee', true)}</g><g transform="translate(390 250) scale(-1 1)">${child('#ffb66d', true)}</g>
    <g class="tn-stack"><path d="M302 264v-27q-5-8-1-14q3-5 8-3q-2-13 6-13q7 0 7 11q7-7 11-1q3 5-2 13q-7 16-3 34z" fill="#ffcd9b" ${W}/>${level >= 1 ? `<path d="M317 237v-26q0-10 10-10h15v36z" fill="#ffcd9b" ${W}/>` : ''}${level >= 2 ? `<path d="M315 211v-19q0-5 5-5l3 11v-20q0-5 5-5l3 25 3-16q1-5 5-3l3 25-7 15z" fill="#ffc99b" ${W}/>` : ''}${level >= 3 ? `<path d="M316 183l-9-14q-3-8 4-10l13 14-1-26q1-8 8-5l5 27 7-20q3-7 9-2l-5 27 13-10q7-3 9 4l-24 24z" fill="#ffc99b" ${W}/><circle cx="335" cy="177" r="8" fill="#ff7eb8" ${W}/>` : ''}</g>
    <g transform="translate(150 260)"><g class="tn-jumper">${child('#73c5e7')}</g></g>
    <path d="M66 310h110m-12-10 12 10-12 10M466 310h110m-12-10 12 10-12 10" stroke="#6c6193" stroke-width="5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
    <circle class="tn-ready-ring" cx="420" cy="145" r="32" fill="#fff9ef" stroke="#9d80c2" stroke-width="6"/><path class="tn-ready-check" d="M403 145l12 12 23-25" stroke="#409d77" stroke-width="8" fill="none" stroke-linecap="round"/>
    </svg>`;
}
export async function playTrongNu(api: JumpApi) {
  const root = document.createElement('div');root.className = 'tn-game';root.dataset.game = 'trongnu';api.stage.classList.add('tn-stage');
  const style = document.createElement('style');style.textContent = `
  .gl-stage.tn-stage{display:block;padding:12px;overflow:auto}.tn-game{width:min(100%,850px);padding:10px;margin:auto;text-align:center;color:#3b2a4f}.tn-game svg{display:block;width:100%;min-height:210px;max-height:40vh;margin:auto}.tn-game h2{font-size:clamp(22px,5vw,32px);margin:8px}.tn-game p{font-size:clamp(18px,4vw,23px);margin:8px}.tn-game button{min-height:72px;min-width:160px;padding:12px 24px;border:3px solid #70548f;border-radius:24px;background:#ffe094;color:#3b2a4f;font:inherit;font-size:26px;font-weight:800;box-shadow:0 5px 0 #c8b7dc;touch-action:manipulation}.tn-game button:focus-visible{outline:4px solid #3579c8;outline-offset:4px}.tn-game button:disabled{opacity:.65}.tn-game .tn-feedback{min-height:2.4em}.tn-game .tn-picture{background:#fff9ef;border:3px solid #baa0dc;border-radius:30px;overflow:hidden}.tn-hop{animation:tn-hop .8s ease-in-out forwards}@keyframes tn-hop{0%{transform:translate(0,0)}48%{transform:translate(145px,-125px)}100%{transform:translate(290px,0)}}.tn-game[data-calm=true] .tn-hop{animation:none;transform:translate(290px,0)}.tn-levels{display:flex;justify-content:center;gap:12px;margin:10px}.tn-levels i{width:22px;height:22px;border:3px solid #70548f;border-radius:50%;background:#fff}.tn-levels i.done{background:#5fd39a}.tn-game .tn-ready-check{visibility:hidden}.tn-game[data-ready=true] .tn-ready-check{visibility:visible}.tn-game[data-ready=true] .tn-ready-ring{stroke:#409d77}.gl:has(.tn-game)>.mascot,.gl:has(.tn-game)>.mascot-say{display:none}
  `;
  const heading = document.createElement('h2'), board = document.createElement('div');board.className = 'tn-picture';
  const levels = document.createElement('div');levels.className = 'tn-levels';
  const cue = document.createElement('p'), feedback = document.createElement('p');feedback.className = 'tn-feedback';feedback.setAttribute('role', 'status');
  const jump = document.createElement('button');jump.type = 'button';jump.dataset.tnJump = 'true';jump.textContent = T('JUMP!', 'NHẢY NÀO!');
  root.append(style, heading, levels, board, cue, jump, feedback);api.stage.append(root);
  const calm = reduceMotion();root.dataset.calm = String(calm);
  let level = 0, elapsed = 0, previous = 0, frame = 0, busy = false, dead = false, timer: ReturnType<typeof setTimeout> | undefined;
  let finish: () => void = () => {};const done = new Promise<void>(resolve => { finish = resolve; });
  function paint() {
    heading.textContent = T(FLOWER_STACKS[level].en, FLOWER_STACKS[level].vi);board.innerHTML = drawing(level);
    levels.replaceChildren(...FLOWER_STACKS.map((_, i) => { const dot = document.createElement('i');dot.className = i < level ? 'done' : '';dot.setAttribute('aria-label', T(`Stage ${i + 1}`, `Mức ${i + 1}`));return dot; }));
    api.dots(4, level);elapsed = 0;jump.disabled = false;feedback.textContent = T('Help our friend jump over the feet and hands.', 'Giúp bạn nhảy qua những bàn chân và bàn tay nhé.');
  }
  jump.onclick = () => {
    if (dead || busy || api.closed) return;
    const ready = trongNuReady(elapsed % 3400 / 3400, api.tier(), calm);
    if (!ready) { feedback.textContent = T('Watch the tick. We can try whenever we are ready.', 'Nhìn dấu tích nhé. Mình sẵn sàng thì nhảy, không cần vội.');api.sfx.tap();return; }
    busy = true;jump.disabled = true;api.sfx.tap();board.querySelector('.tn-jumper')?.classList.add('tn-hop');
    feedback.textContent = T('Over the stack! Lovely jumping!', 'Qua chồng chân tay rồi! Nhảy giỏi quá!');api.right(jump);
    timer = setTimeout(() => {
      if (dead || api.closed) return;
      if (++level < 4) { busy = false;paint(); }
      else void api.win({ title: T('Our flower stack is complete!', 'Mình trồng nụ trồng hoa xong rồi!'), titleVi: 'Mình trồng nụ trồng hoa xong rồi!' }).finally(finish);
    }, calm ? 350 : 950);
  };
  const keyboard = (event: KeyboardEvent) => {
    if (event.code !== 'Space' || event.repeat || !root.isConnected || event.target instanceof Element && event.target.closest('input,textarea,[contenteditable]')) return;
    event.preventDefault();event.stopPropagation();jump.click();
  };
  addEventListener('keydown', keyboard, true);
  const input = paradeInput(root, () => [0], () => jump.click());
  function animate(now: number) {
    if (dead || api.closed) return;
    const dt = previous ? Math.min(100, now - previous) : 0;previous = now;
    if (!busy && !document.hidden) elapsed += dt;
    const ready = trongNuReady(elapsed % 3400 / 3400, api.tier(), calm);root.dataset.ready = String(ready);
    const text = ready ? T('Ready… jump!', 'Sẵn sàng… nhảy nào!') : T('Watch for the tick…', 'Chờ dấu tích nhé…');if (cue.textContent !== text) cue.textContent = text;
    input.poll();frame = requestAnimationFrame(animate);
  }
  api.onCleanup(() => { dead = true;clearTimeout(timer);cancelAnimationFrame(frame);removeEventListener('keydown', keyboard, true);input.dispose();jump.onclick = null;api.stage.classList.remove('tn-stage');finish(); });
  api.plan(() => !busy && trongNuReady(elapsed % 3400 / 3400, api.tier(), calm) ? jump : null, { maxActions: 8 });
  api.say('Two friends stack their feet and hands. Help our friend jump over them!', 'Hai bạn chồng chân và tay lên nhau. Giúp bạn cùng nhảy qua nhé!');
  paint();frame = requestAnimationFrame(animate);return done;
}
