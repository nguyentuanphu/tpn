import type { GameOnline } from './frame.js';
import { T } from '../i18n.js';
import { modal, holdButton } from '../popups.js';
import { reduceMotion } from '../state.js';
import { testerArcadeAvailable } from '../content/tester-arcades.js';
import { ArcadeSession } from './arcade-session.js';
import { barStart, barApply, BAR_SYMBOLS } from './fruitbar-engine.js';
import { ARCADE_STYLE, RING_CELLS, art, control, dom } from './arcade-board.js';

/** Parent arcade owns no child profile, coins, rewards, analytics or persistent balance. */
export function openFruitBar(online?:GameOnline){
 if(!testerArcadeAvailable('sparklefruitbar',online?'multi':'single')&&(online||!testerArcadeAvailable('sparklefruitbar','multi')))return;
 const wasPaused=window.__sv?.paused;if(window.__sv)window.__sv.paused=true;
 const m=modal('parent-arcade',''),card=m.querySelector('.card') as HTMLElement;card.replaceChildren();
 const style=dom('style');style.textContent=ARCADE_STYLE;const close=control('✕',()=>finish());close.setAttribute('aria-label',T('Close','Đóng'));close.classList.add('x');
 const root=dom('div','arcade arcade-adult');root.dataset.parentArcade='';card.append(style,close,root);
 let session:ArcadeSession<ReturnType<typeof barStart>>|undefined,dead=false,helper=false,waitingAt=0;
 let timer:ReturnType<typeof setInterval>|undefined,frame=0,shown=-1,spinning=false,light=0;
 const icon=(i:number)=>i>=6?dom('b','',i===6?'7':'BAR'):art(BAR_SYMBOLS[i].art);
 function finish(){if(dead)return;dead=true;if(timer)clearInterval(timer);cancelAnimationFrame(frame);session?.close();if(online)online.leave?.();observer.disconnect();m.remove();if(window.__sv)window.__sv.paused=wasPaused||false;}
 function start(seats:number,npc:boolean,fair:boolean){helper=npc;session=new ArcadeSession(barStart(online?.seed||`parent-bar-${Date.now()}`,seats,fair),online,barApply,paint);paint();timer=setInterval(()=>{
  if(!session||dead)return;if(!testerArcadeAvailable('sparklefruitbar',session.online?'multi':'single')){finish();return;}session.poll();
  if(session.waiting){if(!waitingAt)waitingAt=performance.now();paint();}else if(waitingAt){waitingAt=0;paint();}
  if(helper&&!session.online&&session.state.turn!==0&&session.state.phase==='allocate'){const s=session.state;if(!s.bets[s.turn].some(Boolean))session.submit(20);else session.submit(900);}
 },1500);}
 const observer=new MutationObserver(()=>{if(!m.isConnected)finish();});observer.observe(document.body,{childList:true});m.addEventListener('sv-modal-close',finish,{once:true});
 const mine=()=>!!session&&(!session.online||session.mine===session.state.turn);
 let queued:number[]=[];
 const pump=()=>{if(queued.length&&!session?.busy&&mine()&&!session?.waiting){const n=queued.shift()!;session?.submit(n);}};
 const batch=(values:number[])=>{queued=values;while(queued.length&&!session?.busy){const n=queued.shift()!;if(!session?.submit(n))break;}};
 const command=(value:number)=>{if(!spinning)session?.submit(value);};
 function paint(){
  if(!session||dead)return;const s=session.state;root.replaceChildren();root.dataset.phase=s.phase;root.dataset.round=String(s.round);queueMicrotask(pump);
  root.append(dom('h2','',T('Sparkle Fruit Bar · Grown-ups','Bảng Trái Cây Lấp Lánh · Người lớn')),
   dom('p','',T('Free virtual counters only. No purchase, cash-out or exchange. Separate from children’s coins.','Chỉ dùng điểm ảo miễn phí. Không mua, đổi tiền hay trao đổi. Tách biệt với xu của trẻ.')));
  const board=dom('div','arcade-ring');for(let i=0;i<16;i++){const c=dom('div','arcade-cell');c.dataset.barCell=String(i);c.style.gridColumn=String(RING_CELLS[i][0]);c.style.gridRow=String(RING_CELLS[i][1]);c.append(icon(i%8));board.append(c);}
  const center=dom('div','arcade-center');center.append(dom('b','',T(`Round ${s.round}/${s.limit}`,`Lượt ${s.round}/${s.limit}`)));
  if(s.result!==null&&s.phase!=='allocate'){center.append(icon(s.result),dom('b','',T(BAR_SYMBOLS[s.result].en,BAR_SYMBOLS[s.result].vi)));}else center.append(dom('b','',T('Place your counters','Chọn điểm ảo')));board.append(center);root.append(board);
  const scores=dom('div','arcade-players');s.balances.forEach((balance,i)=>scores.append(dom('b','',`${online?.names[i]||T(`Player ${i+1}`,`Người chơi ${i+1}`)}: ${balance.toLocaleString()} · +${s.lastWins[i]}`)));root.append(scores);
  const status=dom('p','arcade-status',session.waiting?T('Waiting for the other grown-up…','Đang chờ người lớn bên kia…'):s.phase==='allocate'?T(`Player ${s.turn+1} chooses.`,`Người chơi ${s.turn+1} chọn.`):T('Shared round result','Kết quả lượt chơi chung'));status.setAttribute('role','status');root.append(status);
  if(s.phase==='allocate'){
   const allocations=dom('div','arcade-allocations');BAR_SYMBOLS.forEach((symbol,i)=>{
    const cell=dom('div','arcade-bet');cell.append(icon(i));const label=dom('label','',`${T(symbol.en,symbol.vi)} ×${symbol.mult}`),input=dom('input');input.type='number';input.min='0';input.max='100';input.step='1';input.value=String(s.bets[s.turn][i]);input.dataset.barBet=String(i);input.disabled=!mine()||session!.waiting||helper&&!session!.online&&s.turn!==0;input.onchange=()=>{const n=Number(input.value);if(!Number.isInteger(n)||n<0||n>100||!session!.submit(i*101+n))input.value=String(session!.state.bets[s.turn][i]);};label.append(input);cell.append(label);allocations.append(cell);
   });root.append(allocations);
   const actions=dom('div','arcade-actions');
   // One acknowledged command at a time also supports remote round-trip latency.
   const clear=control(T('Clear','Xóa'),()=>batch(s.bets[s.turn].flatMap((n,i)=>n?[i*101]:[])));
   const repeat=control(T('Repeat','Lặp lại'),()=>batch(s.previous[s.turn].flatMap((n,i)=>n!==s.bets[s.turn][i]?[i*101+n]:[])));
   const refill=control(T('Free refill to 100,000','Nạp miễn phí lên 100.000'),()=>command(902));refill.disabled=s.balances[s.turn]>=100000;
   const ready=control(T('Lock allocations / Start','Chốt điểm / Bắt đầu'),()=>command(900));ready.dataset.barReady='';ready.disabled=!s.bets[s.turn].some(Boolean);actions.append(clear,repeat,refill,ready);if(queued.length||!mine()||session.waiting||helper&&!session.online&&s.turn!==0)actions.querySelectorAll('button').forEach(b=>b.disabled=true);root.append(actions);
  }else{
   root.append(dom('p','',T(`Biggest returns: ${s.biggest.join(' · ')}`,`Điểm nhận lớn nhất: ${s.biggest.join(' · ')}`)));
   if(s.phase==='result'){const next=control(s.round>=s.limit?T('Finish session','Kết thúc phiên'):T('Next round','Lượt tiếp theo'),()=>command(901));next.dataset.barNext='';next.disabled=!mine()||session.waiting||(!reduceMotion()&&s.round!==shown);root.append(next);}
   else root.append(dom('h2','',T('Session complete. These counters stay in this arcade only.','Phiên chơi kết thúc. Điểm ảo chỉ nằm trong trò này.')));
  }
  const rules=dom('details'),summary=dom('summary','',T('Rules and exact frequencies','Luật chơi và tần suất chính xác'));rules.append(summary,dom('p','',T('Each selected counter is deducted once. Return = allocation × multiplier on the final symbol. Choose 0–100 per symbol. The default challenge lasts 20 rounds; refills are always free.','Mỗi điểm đã chọn được trừ một lần. Điểm nhận = điểm đặt × hệ số của hình cuối. Chọn 0–100 mỗi hình. Phiên mặc định có 20 lượt; nạp điểm luôn miễn phí.')),
   dom('p','',BAR_SYMBOLS.map(x=>`${T(x.en,x.vi)}: ${s.fair?'12.5':x.weight}% ×${x.mult}`).join(' · ')),dom('p','',T('Family-hosted seeded results are shared across players. This is not a ranked or cheat-proof competition. No public leaderboard or real-world value.','Kết quả theo hạt giống được chia sẻ giữa người chơi trong phòng gia đình. Đây không phải cuộc thi xếp hạng hay chống gian lận. Không có bảng xếp hạng công khai hoặc giá trị ngoài đời.')));root.append(rules);
  if(session.waiting&&performance.now()-waitingAt>=30000){const b=control(T('Continue locally','Chơi tiếp trên máy này'),()=>{session!.continueLocally();helper=false;waitingAt=0;paint();});b.dataset.barContinue='';root.append(b);}
  if(s.phase==='result'&&s.round!==shown){shown=s.round;animateResult(s.result!);}else highlight(s.result??0);
 }
 function highlight(index:number){root.querySelectorAll<HTMLElement>('[data-bar-cell]').forEach((cell,i)=>cell.classList.toggle('on',i===index));}
 function animateResult(result:number){cancelAnimationFrame(frame);if(reduceMotion()){highlight(result);return;}spinning=true;const begin=performance.now();const tick=(now:number)=>{if(dead)return;const p=Math.min(1,(now-begin)/1800);light=Math.floor(48*(1-(1-p)**3));highlight(p===1?result:light%16);if(p<1)frame=requestAnimationFrame(tick);else{spinning=false;paint();}};frame=requestAnimationFrame(tick);}
 const gate=dom('div','arcade-gate');gate.append(dom('h2','',T('Grown-up tester arcade','Khu thử nghiệm dành cho người lớn')),dom('p','',T('Hold to enter. Virtual play only; this does not change the child’s progress.','Nhấn giữ để vào. Chỉ chơi bằng điểm ảo; không thay đổi tiến trình của trẻ.')));
 const enter=control(T('Grown-ups: press and hold','Người lớn: nhấn giữ'),()=>{});enter.classList.add('grown');enter.innerHTML='<span class="ring"></span>'+T('Grown-ups: press and hold','Người lớn: nhấn giữ');enter.dataset.barGate='';gate.append(enter);root.append(gate);
 holdButton(enter,()=>{root.replaceChildren();if(online){start(Math.min(4,online.names.length),false,false);return;}root.append(dom('h2','',T('Choose a parent arcade session','Chọn phiên chơi dành cho người lớn')));for(const [label,vi,seats,npc,fair]of [['Classic solo','Một người cổ điển',1,false,false],['Equal frequencies solo','Một người tần suất bằng nhau',1,false,true],['Two adults here','Hai người lớn cùng máy',2,false,false],['With a practice helper','Cùng bạn hỗ trợ tập chơi',2,true,false]]as const){if(!testerArcadeAvailable('sparklefruitbar','single'))continue;const b=control(T(label,vi),()=>start(seats,npc,fair));b.dataset.barMode=String(seats)+(npc?'npc':fair?'fair':'');root.append(b);}if(testerArcadeAvailable('sparklefruitbar','multi'))root.append(control(T('Invite another grown-up online','Mời người lớn khác trực tuyến'),()=>{finish();window.__sv.inviteGame('sparklefruitbar',undefined,1);}));});
 return {close:finish};
}

export function confirmFruitBarInvite(name:string):Promise<boolean>{
 return new Promise(resolve=>{const m=modal('parent-arcade-invite',''),card=m.querySelector('.card')!;let done=false;const finish=(ok:boolean)=>{if(done)return;done=true;m.close();resolve(ok);};card.append(dom('h2','',T('Grown-up tester invitation','Lời mời người lớn thử nghiệm')),dom('p','',T(`${name} invites a grown-up to the virtual-counter arcade.`,`${name} mời người lớn chơi trò điểm ảo.`)));const yes=control(T('Grown-ups: hold to accept','Người lớn: giữ để đồng ý'),()=>{});yes.classList.add('grown');yes.innerHTML='<span class="ring"></span>'+T('Grown-ups: hold to accept','Người lớn: giữ để đồng ý');holdButton(yes,()=>finish(true));card.append(yes,control(T('Not now','Để sau'),()=>finish(false)));});
}
