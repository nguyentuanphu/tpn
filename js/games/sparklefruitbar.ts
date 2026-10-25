import { register, type GameOnline } from './frame.js';
import { T } from '../i18n.js';
import { modal } from '../popups.js';
import { reduceMotion } from '../state.js';
import { testerArcadeAvailable } from '../content/tester-arcades.js';
import { ArcadeSession } from './arcade-session.js';
import { barStart, barApply, BAR_SYMBOLS } from './fruitbar-engine.js';
import { ARCADE_STYLE, RING_CELLS, art, control, dom } from './arcade-board.js';

/** Family arcade owns no profile coins, rewards or persistent balance. */
interface FruitBarApi {online?:GameOnline;little:boolean;closed:boolean;close():void;onCleanup(f:()=>void):void;}
function runFruitBar(api:FruitBarApi){
 const online=api.online;
 if(document.querySelector('.parent-arcade')){online?.leave?.();return;}
 if(!testerArcadeAvailable('sparklefruitbar',online?'multi':'single')&&(online||!testerArcadeAvailable('sparklefruitbar','multi')))return;

 const m=modal('parent-arcade',''),card=m.querySelector('.card') as HTMLElement;card.replaceChildren();
 const style=dom('style');style.textContent=ARCADE_STYLE;const close=control('✕',()=>finish());close.setAttribute('aria-label',T('Close','Đóng'));close.classList.add('x');
 const root=dom('div','arcade arcade-family');root.dataset.parentArcade='';const header=dom('div','parent-arcade-header');header.append(dom('b','',T('Sparkle Fruit Bar','Bảng Trái Cây Lấp Lánh')),close);const footer=dom('div','parent-arcade-footer');card.append(style,header,root,footer);
 let session:ArcadeSession<ReturnType<typeof barStart>>|undefined,dead=false,helper=false,waitingAt=0;
 let timer:ReturnType<typeof setInterval>|undefined,frame=0,shown=-1,spinning=false,light=0,lastView='';
 const icon=(i:number)=>i>=6?dom('b','',i===6?'7':'BAR'):art(BAR_SYMBOLS[i].art);
 function finish(){if(dead)return;dead=true;if(timer)clearInterval(timer);cancelAnimationFrame(frame);session?.close();if(online)online.leave?.();observer.disconnect();m.remove();api.close();}
 function start(seats:number,npc:boolean,fair:boolean){helper=npc;session=new ArcadeSession(barStart(online?.seed||`parent-bar-${Date.now()}`,seats,fair),online,barApply,paint);paint();timer=setInterval(()=>{
  if(!session||dead)return;if(!testerArcadeAvailable('sparklefruitbar',session.online?'multi':'single')){finish();return;}session.poll();
  if(session.waiting){if(!waitingAt)waitingAt=performance.now();paint();}else if(waitingAt){waitingAt=0;paint();}
  if(helper&&!session.online&&session.state.turn!==0&&session.state.phase==='allocate'){const s=session.state;if(!s.bets[s.turn].some(Boolean))session.submit(20);else session.submit(900);}
 },1500);}
 const observer=new MutationObserver(()=>{if(!m.isConnected)finish();});observer.observe(document.body,{childList:true});m.addEventListener('sv-modal-close',finish,{once:true});api.onCleanup(finish);
 const mine=()=>!!session&&(!session.online||session.mine===session.state.turn);
 let queued:number[]=[];
 const pump=()=>{if(queued.length&&!session?.busy&&mine()&&!session?.waiting){const n=queued.shift()!;session?.submit(n);}};
 const batch=(values:number[])=>{queued=values;while(queued.length&&!session?.busy){const n=queued.shift()!;if(!session?.submit(n))break;}};
 const command=(value:number)=>{if(!spinning)session?.submit(value);};
 function paint(){
  if(!session||dead)return;const s=session.state;const view=[s.phase,s.round,s.turn].join(':');const resetView=view!==lastView;lastView=view;root.replaceChildren();footer.replaceChildren();root.dataset.phase=s.phase;root.dataset.round=String(s.round);queueMicrotask(pump);
  root.append(dom('h2','',T('Sparkle Fruit Bar','Bảng Trái Cây Lấp Lánh')),
   dom('p','',T('Free virtual counters only. No purchase, cash-out or exchange. Separate from your game coins.','Chỉ dùng điểm ảo miễn phí. Không mua, đổi tiền hay trao đổi. Tách biệt với xu trong trò chơi.')));
  const board=dom('div','arcade-ring');for(let i=0;i<16;i++){const c=dom('div','arcade-cell');c.dataset.barCell=String(i);c.style.gridColumn=String(RING_CELLS[i][0]);c.style.gridRow=String(RING_CELLS[i][1]);c.append(icon(i%8));board.append(c);}
  const center=dom('div','arcade-center');center.append(dom('b','',T(`Round ${s.round}/${s.limit}`,`Lượt ${s.round}/${s.limit}`)));
  if(s.result!==null&&s.phase!=='allocate'){center.append(icon(s.result),dom('b','',T(BAR_SYMBOLS[s.result].en,BAR_SYMBOLS[s.result].vi)));}else center.append(dom('b','',T('Place your counters','Chọn điểm ảo')));board.append(center);root.append(board);
  const scores=dom('div','arcade-players');s.balances.forEach((balance,i)=>scores.append(dom('b','',`${online?.names[i]||T(`Player ${i+1}`,`Người chơi ${i+1}`)}: ${balance.toLocaleString()} · +${s.lastWins[i]}`)));root.append(scores);
  const status=dom('p','arcade-status',session.waiting?T('Waiting for your friend…','Đang chờ bạn…'):s.phase==='allocate'?T(`Player ${s.turn+1} chooses.`,`Người chơi ${s.turn+1} chọn.`):T('Shared round result','Kết quả lượt chơi chung'));status.setAttribute('role','status');root.append(status);
  if(s.phase==='allocate'){
   const allocations=dom('div','arcade-allocations');BAR_SYMBOLS.forEach((symbol,i)=>{
    const cell=dom('div','arcade-bet');cell.append(icon(i));const label=dom('label','',`${T(symbol.en,symbol.vi)} ×${symbol.mult}`),input=dom('input');input.type='number';input.min='0';input.max='100';input.step='1';input.value=String(s.bets[s.turn][i]);input.dataset.barBet=String(i);input.disabled=!mine()||session!.waiting||helper&&!session!.online&&s.turn!==0;input.onchange=()=>{const n=Number(input.value);if(!Number.isInteger(n)||n<0||n>100||!session!.submit(i*101+n))input.value=String(session!.state.bets[s.turn][i]);};label.append(input);cell.append(label);const adjust=dom('div','arcade-adjust');for(const [text,delta] of [['−',-1],['+',1]] as const){const button=control(text,()=>{const amount=session!.state.bets[session!.state.turn][i]+delta;if(amount>=0&&amount<=100)session!.submit(i*101+amount);});button.setAttribute('aria-label',T(delta>0?'Add one':'Take one away',delta>0?'Thêm một':'Bớt một')+' '+T(symbol.en,symbol.vi));button.dataset.barAdjust=String(i)+':'+delta;button.disabled=input.disabled||session!.busy||delta<0&&s.bets[s.turn][i]===0||delta>0&&s.bets[s.turn][i]===100;adjust.append(button);}cell.append(adjust);allocations.append(cell);
   });root.append(allocations);
   const actions=dom('div','arcade-actions');
   // One acknowledged command at a time also supports remote round-trip latency.
   const clear=control(T('Clear','Xóa'),()=>batch(s.bets[s.turn].flatMap((n,i)=>n?[i*101]:[])));
   const repeat=control(T('Repeat','Lặp lại'),()=>batch(s.previous[s.turn].flatMap((n,i)=>n!==s.bets[s.turn][i]?[i*101+n]:[])));
   const refill=control(T('Free refill to 100,000','Nạp miễn phí lên 100.000'),()=>command(902));refill.disabled=s.balances[s.turn]>=100000;
   const ready=control(T('Lock allocations / Start','Chốt điểm / Bắt đầu'),()=>command(900));ready.dataset.barReady='';ready.disabled=!s.bets[s.turn].some(Boolean)||!mine()||session.waiting||queued.length>0||helper&&!session.online&&s.turn!==0;actions.append(clear,repeat,refill);footer.append(ready);if(queued.length||!mine()||session.waiting||helper&&!session.online&&s.turn!==0)actions.querySelectorAll('button').forEach(b=>b.disabled=true);root.append(actions);
  }else{
   root.append(dom('p','',T(`Biggest returns: ${s.biggest.join(' · ')}`,`Điểm nhận lớn nhất: ${s.biggest.join(' · ')}`)));
   if(s.phase==='result'){const next=control(s.round>=s.limit?T('Finish session','Kết thúc phiên'):T('Next round','Lượt tiếp theo'),()=>command(901));next.dataset.barNext='';next.disabled=!mine()||session.waiting||spinning||(!reduceMotion()&&s.round!==shown);footer.append(next);}
   else root.append(dom('h2','',T('Session complete. These counters stay in this arcade only.','Phiên chơi kết thúc. Điểm ảo chỉ nằm trong trò này.')));
  }
  const rules=dom('details'),summary=dom('summary','',T('Rules and exact frequencies','Luật chơi và tần suất chính xác'));rules.append(summary,dom('p','',T('Each selected counter is deducted once. Return = allocation × multiplier on the final symbol. Choose 0–100 per symbol. The default challenge lasts 20 rounds; refills are always free.','Mỗi điểm đã chọn được trừ một lần. Điểm nhận = điểm đặt × hệ số của hình cuối. Chọn 0–100 mỗi hình. Phiên mặc định có 20 lượt; nạp điểm luôn miễn phí.')),
   dom('p','',BAR_SYMBOLS.map(x=>`${T(x.en,x.vi)}: ${s.fair?'12.5':x.weight}% ×${x.mult}`).join(' · ')),dom('p','',T('Family-hosted seeded results are shared across players. This is not a ranked or cheat-proof competition. No public leaderboard or real-world value.','Kết quả theo hạt giống được chia sẻ giữa người chơi trong phòng gia đình. Đây không phải cuộc thi xếp hạng hay chống gian lận. Không có bảng xếp hạng công khai hoặc giá trị ngoài đời.')));root.append(rules);
  if(session.waiting&&performance.now()-waitingAt>=30000){const b=control(T('Continue locally','Chơi tiếp trên máy này'),()=>{session!.continueLocally();helper=false;waitingAt=0;paint();});b.dataset.barContinue='';root.append(b);}
  if(resetView)root.scrollTop=0;
  if(s.phase==='result'&&s.round!==shown){shown=s.round;animateResult(s.result!);}else highlight(s.result??0);
 }
 function highlight(index:number){root.querySelectorAll<HTMLElement>('[data-bar-cell]').forEach((cell,i)=>cell.classList.toggle('on',i===index));}
 function animateResult(result:number){cancelAnimationFrame(frame);if(reduceMotion()){highlight(result);return;}spinning=true;const begin=performance.now();const tick=(now:number)=>{if(dead)return;const p=Math.min(1,(now-begin)/1800);light=Math.floor(48*(1-(1-p)**3));highlight(p===1?result:light%16);if(p<1)frame=requestAnimationFrame(tick);else{spinning=false;paint();}};frame=requestAnimationFrame(tick);}
 if(online){start(Math.min(4,online.names.length),false,false);}else{
  root.append(dom('h2','',T('Choose how to play','Chọn cách chơi')));
  for(const [label,vi,seats,npc,fair]of [['Play on my own','Chơi một mình',1,false,false],['Equal frequencies','Các hình có cơ hội bằng nhau',1,false,true],['Two players here','Hai người cùng máy',2,false,false],['With a practice helper','Cùng bạn hỗ trợ tập chơi',2,true,false]]as const){
   if(!testerArcadeAvailable('sparklefruitbar','single'))continue;const b=control(T(label,vi),()=>start(seats,npc,fair));b.dataset.barMode=String(seats)+(npc?'npc':fair?'fair':'');root.append(b);
  }
  if(testerArcadeAvailable('sparklefruitbar','multi'))root.append(control(T('Invite friends online','Mời bạn chơi trực tuyến'),()=>{finish();window.__sv.inviteGame('sparklefruitbar',undefined,1);}));
 }
 return {close:finish};
}

/** Compatibility for settings/test callers; the normal game frame owns pause/cleanup. */
export function openFruitBar(online?:GameOnline){
 const game=window.__sv as typeof window.__sv & {playGameOnline(id:string,level:number,online:GameOnline):unknown};
 if(online)return game.playGameOnline('sparklefruitbar',1,online);
 return window.__sv.playGame(0,'sparklefruitbar','replay');
}
register({id:'sparklefruitbar',icon:'🍎',online:true,name:()=>T('Sparkle Fruit Bar','Bảng Trái Cây Lấp Lánh'),run:runFruitBar});
