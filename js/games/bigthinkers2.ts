// Original learning activities, using the existing frame, art and gentle retry rules.
import { register, choiceButtons, untilRight } from './frame.js';
import { T } from '../i18n.js';
import { pic } from '../art.js';
import { el, shuffle, wait } from '../util.js';

// (r79 learning, I1) the frame's tier follows the child inside the game (api.tier); simple test frames fall back to the level
const tier = api => api.tier ? api.tier() : api.little ? 0 : api.level >= 3 ? 3 : api.level >= 2 ? 2 : 1;
const nextRound = api => api.nextRound ? api.nextRound() : tier(api);
import { REASON_INTRO as INTRO } from './learning-meta.js';
function repeat(api, speak) {
  const button = el('button', 'btn bt-repeat', pic('🔁') + T('Hear again', 'Nghe lại'));
  button.style.minHeight = '64px'; button.onclick = speak; api.stage.appendChild(button); return button;
}
const SYMBOLS = ['🍎', '🌸', '🐶', '🍌'];
const NAMES = {'🍎':['Apple','Táo'],'🌸':['Flower','Hoa'],'🐶':['Dog','Chó'],'🍌':['Banana','Chuối'],'🌱':['Seedling','Cây non'],'💧':['Water','Nước'],'🌳':['Tree','Cây'],'🐝':['Bee','Con ong'],'🦋':['Butterfly','Con bướm'],'🍄':['Mushroom','Cây nấm']};
register({ id: 'patternpicnic', icon: '🧺', learn: true, name: () => T('Pattern Picnic', 'Dã Ngoại Quy Luật'), async run(api) {
  const patterns = [['🍎','🌸'], ['🍎','🍎','🌸'], ['🍎','🌸','🐶'], ['🍎','🌸','🌸','🐶']];
  const rounds = tier(api) === 0 ? 3 : 4;
  for (let round = 0; round < rounds; round++) {
    if (api.closed) return; api.stage.innerHTML = ''; api.dots(rounds, round);
    // (points 46-48) each level has its own run of patterns; Medium and Hard no longer open with the under-5 pattern
    // (r79 learning, I1) the level can move between rounds
    const level = round ? nextRound(api) : tier(api);
    const rule = patterns[[[0, 0, 0], [0, 1, 0, 1], [1, 2, 1, 2], [2, 3, 2, 3]][level][round] ?? [0, 1, 1, 2][level]];
    const shift = round % rule.length, model = Array.from({ length: rule.length * 2 }, (_, i) => rule[(i + shift) % rule.length]);
    const answer = rule[(model.length + shift) % rule.length];
    const row = el('div', 'seq', model.map(value => `<span class="seq-item">${pic(value)}</span>`).join('') + '<span class="seq-item q">?</span>');
    api.stage.appendChild(row); repeat(api, () => api.say(...INTRO.patternpicnic)); api.say(...INTRO.patternpicnic);
    // (levels) Talent: a fifth picture (the tree) joins the choices
    const options = shuffle([answer, ...SYMBOLS.concat(api.talent ? ['🌳'] : []).filter(value => value !== answer).slice(0, level === 0 ? 1 : level === 3 ? (api.talent ? 4 : 3) : 2)]);
    const buttons = choiceButtons(api, options, value => pic(value)); buttons.forEach(b=>b.setAttribute('aria-label',T(...NAMES[(b._v as string)])));
    if (!await untilRight(api, buttons, b => b._v === answer)) return;
    row.lastElementChild.innerHTML = pic(answer); api.praise(); await wait(300);
  }
  return api.win();
} });

const SHAPES = {
  triangle: {name: ['Triangle', 'Tam giác'], svg: '<path d="M50 12L88 85H12Z"/>'},
  square: {name: ['Square', 'Hình vuông'], svg: '<rect x="15" y="15" width="70" height="70" rx="5"/>'},
  circle: {name: ['Circle', 'Hình tròn'], svg: '<circle cx="50" cy="50" r="35"/>'},
  rectangle: {name: ['Rectangle', 'Hình chữ nhật'], svg: '<rect x="10" y="27" width="80" height="46" rx="5"/>'},
  // (levels) Talent only: an oval that fits no outline joins the shapes to choose from
  oval: {name: ['Oval', 'Hình bầu dục'], svg: '<ellipse cx="50" cy="50" rx="42" ry="27"/>'}
};
const shape = (key, filled = true, rotation = 0) => `<svg viewBox="0 0 100 100" width="100%" height="100%" aria-hidden="true"><g transform="rotate(${rotation} 50 50)" fill="${filled ? '#ffd36a' : '#fff7e8'}" stroke="${filled ? '#6a4a8a' : '#b29cc5'}" stroke-width="5" ${filled ? '' : 'stroke-dasharray="7 5"'}>${SHAPES[key].svg}</g></svg>`;
const PICTURES: [string, number, number, number, number, number?][][] = [
  [['triangle',80,4,120,88], ['square',90,75,100,112], ['circle',108,95,64,64]],
  [['triangle',70,2,140,94], ['square',86,79,108,120], ['circle',93,88,64,64], ['rectangle',126,128,64,64,90]],
  [['rectangle',10,61,192,112], ['square',152,9,110,110], ['circle',24,142,76,76], ['circle',151,142,76,76], ['square',172,28,64,64]],
  [['rectangle',105,90,70,140,90], ['triangle',39,102,90,80], ['triangle',152,117,90,80], ['circle',84,31,112,112], ['circle',24,12,100,100], ['circle',155,11,100,100]]
];
register({ id: 'shapebuilders', icon: '🧩', learn: true, name: () => T('Shape Builders', 'Ghép Tranh Hình Khối'), async run(api) {
  const pieces = PICTURES[tier(api)], board = el('div', 'bt-picture');
  const pictureHeight = Math.max(200, ...pieces.map(([,x,y,w,h]) => y+h+12));
  board.style.cssText = `position:relative;width:280px;max-width:100%;height:${pictureHeight}px;flex-shrink:0;margin:0 auto`; api.stage.appendChild(board);
  let active = null, selected = null, dragging = null;
  const slots = pieces.map(([key,x,y,w,h,rotation], i) => {
    const b = el('button', 'bt-slot', shape(key, false, rotation)); b.dataset.shape = key; b.disabled = true;
    b.setAttribute('aria-label', T(...SHAPES[key].name)); b.style.cssText = `position:absolute;left:${x/2.8}%;top:${y}px;width:${w/2.8}%;height:${h}px;min-width:64px;min-height:64px;padding:0;background:transparent;border:0;pointer-events:none`;
    board.appendChild(b); return b;
  });
  let guide = INTRO.shapebuilders; repeat(api, () => api.say(...guide)); api.say(...guide);
  const buttons = choiceButtons(api, Object.keys(SHAPES).filter(key=>(!api.little || key!=='rectangle') && (key!=='oval' || api.talent)), key => shape(key), 'choice bt-piece');
  buttons.forEach(b => { b.style.touchAction='none'; b.setAttribute('aria-label', T(...SHAPES[b._v].name)); b.onpointerdown = e => { dragging={button:b,x:e.clientX,y:e.clientY,started:false}; }; });
  const move = e => { if (!dragging) return; if (!dragging.started && Math.hypot(e.clientX-dragging.x,e.clientY-dragging.y)>8) { dragging.started=true; dragging.button.click(); } if(dragging.started)e.preventDefault(); };
  const up = e => { if (!dragging) return; const drag=dragging;dragging=null; if(drag.started && document.elementFromPoint(e.clientX,e.clientY)?.closest('.bt-slot')===active) { if(drag.button._v===active.dataset.shape) setTimeout(()=>active?.click(),0); else api.wrong(active); } };
  document.addEventListener('pointermove',move,{passive:false});document.addEventListener('pointerup',up);
  api.onCleanup(()=>{document.removeEventListener('pointermove',move);document.removeEventListener('pointerup',up);});
  api.plan(()=>selected ? active : null);
  for(let i=0;i<pieces.length;i++) {
    if(api.closed)return;buttons.forEach(b=>b.classList.remove('right','wrong','hint'));api.dots(pieces.length,i);active=slots[i];active.disabled=false;active.style.pointerEvents='auto';active.style.zIndex='10';active.style.outline='3px dashed #ffb020';
    guide = ['Choose the shape that matches the outline.', 'Chọn hình khối giống nét viền.'];api.say(...guide);
    selected=null; if(!await untilRight(api,buttons,b=>b._v===pieces[i][0]))return;selected=buttons.find(b=>b._v===pieces[i][0]);
    guide=['Tap the outline to put your shape in the picture.', 'Chạm vào nét viền để ghép hình vào tranh.'];api.say(...guide);
    await new Promise<void>(resolve=>{let done=false;const finish=()=>{if(done)return;done=true;active.onclick=null;resolve();};active.onclick=()=>{active.innerHTML=shape(pieces[i][0],true,pieces[i][5]);finish();};api.onCleanup(finish);});
    if(api.closed)return;active.disabled=true;active.style.pointerEvents='none';active.style.outline='none';active.style.zIndex=String(i+1);selected=null;api.praise();
  }
  buttons.forEach(b=>b.disabled=true);return api.win();
} });

// (points 46-48, 16 Oct AEDT) garden pictures that are not in the row join the choices (one for under-5s and Easy, two
// from Medium), so the last picture is never the only one left to tap
const EXTRA=['🐝','🦋','🍄','🍎','🌸','🐶'];
register({ id: 'remembergarden', icon: '🌱', learn: true, name: () => T('Remember the Garden', 'Nhớ Khu Vườn'), async run(api) {
  const pool=['🌱','💧','🌸','🍎','🌳','🐶'];
  for(let round=0;round<3;round++) {
    // (r79 learning, I1) the row's length and the extra pictures follow the level between rounds
    const level=round?nextRound(api):tier(api),length=[2,3,4,6][level];
    if(api.closed)return;api.stage.innerHTML='';api.dots(3,round);const order=api.talent?shuffle(pool).slice(0,length):Array.from({length},(_,i)=>pool[(i+round)%pool.length]);   // (levels) Talent: the garden row comes in a mixed order, with three extra pictures
    const model=el('div','seq',order.map(v=>`<span class="seq-item">${pic(v)}</span>`).join(''));api.stage.appendChild(model);
    repeat(api,()=>api.say(...INTRO.remembergarden));api.say(...INTRO.remembergarden);
    if(level>0){const ready=el('button','btn',T('Ready to try', 'Sẵn sàng thử'));ready.style.minHeight='64px';api.stage.appendChild(ready);api.plan(()=>ready.isConnected?ready:null);
      await new Promise<void>(resolve=>{ready.onclick=resolve;api.onCleanup(resolve);});if(api.closed)return;ready.remove();model.querySelectorAll('.seq-item').forEach(b=>b.innerHTML='?');}
    const show=el('button','btn',pic('🔁')+T('Show again', 'Xem lại'));show.style.minHeight='64px';show.onclick=()=>{model.querySelectorAll('.seq-item').forEach((b,i)=>b.innerHTML=pic(order[i]));api.say(...INTRO.remembergarden);};api.stage.appendChild(show);
    const done=el('div','seq');api.stage.appendChild(done);const controls=el('div');api.stage.appendChild(controls);
    for(let i=0;i<order.length;i++){if(api.closed)return;controls.innerHTML='';const old=api.stage;api.stage=controls;const options=shuffle([...new Set(order.slice(i)),...shuffle(EXTRA.filter(v=>!order.includes(v))).slice(0,api.talent?3:level>=2?2:1)]);const buttons=choiceButtons(api,options,v=>pic(v));buttons.forEach(b=>b.setAttribute('aria-label',T(...NAMES[b._v as string])));api.stage=old;
      const wrong=api.wrong;api.wrong=e=>{const line=order.includes(e._v)?['That one comes later. Which picture was before it?','Hình đó ở sau. Hình nào đứng trước nó?']:['That picture was not in the garden row. Tap Show again to look.','Hình đó không có trong hàng. Chạm Xem lại để nhìn nhé.'];wrong(e,...line);api.show(...line);};
      const got=await untilRight(api,buttons,b=>b._v===order[i]);api.wrong=wrong;if(!got)return;done.appendChild(el('span','seq-item',pic(order[i])));api.praise();}
  }
  return api.win();
} });
