import { events } from '../core/events.js';
import { register } from './frame.js';
import { T } from '../i18n.js';
import { reduceMotion } from '../state.js';
import { testerArcadeAvailable } from '../content/tester-arcades.js';
import { ArcadeSession, controlsArcadeTurn } from './arcade-session.js';
import { orchardStart, orchardStop, orchardSymbol, orchardSessionTier } from './parade-engine.js';
import { ARCADE_STYLE, RING_CELLS, art, control, dom } from './arcade-board.js';
import type { GameOnline } from './frame.js';
// A static bilingual pair keeps the completion line visible to voice inventory tooling.
const ORCHARD_COMPLETION=['Orchard mission complete!','Hoàn thành nhiệm vụ vườn quả!'] as const;
interface OrchardApi {level?:number;stage:HTMLElement;online?:GameOnline;players:{id?:string;name?:string}[];tier():number;closed:boolean;onCleanup(f:()=>void):void;say(en:string,vi:string):void;dots(n:number,k:number):void;sfx:{tap():void};win(extra:{title:string;titleVi:string}):Promise<unknown>;plan?(f:()=>Element|null,opts:{maxActions:number}):void;}
async function run(api:OrchardApi){
 if(!testerArcadeAvailable('sparkleorchard',api.online?'multi':'single')){api.say('This game is for invited testers.', 'Trò này dành cho người thử được mời.');return;}
 const style=dom('style');style.textContent=ARCADE_STYLE;const root=dom('div','arcade orchard');api.stage.append(style,root);root.tabIndex=-1;api.stage.closest('.gl')?.classList.add('gl-arcade');
 let session:ArcadeSession<ReturnType<typeof orchardStart>>|undefined,helper=false,calm=reduceMotion(),position=0,elapsed=0,dead=false,ending=false,frame=0,last=0,waitingAt=0,announced='';
 let resolve=()=>{};const done=new Promise<void>(r=>{resolve=r;});
 const mine=()=>!!session&&controlsArcadeTurn(session.state.turn,session.mine,!!session.online,helper);
 const active=()=>!!session&&!session.state.complete&&!session.waiting&&mine();
 function stop(){if(!active())return;if(session!.submit(position))api.sfx.tap();}
 function start(seats:number,npc:boolean){helper=npc;session=new ArcadeSession(orchardStart(api.online?.seed||`orchard-${Date.now()}`,seats,orchardSessionTier(api.tier(),api.online?(api.level??1):undefined)),api.online,orchardStop,paint);api.say('Find the mission pictures. Stop the light!', 'Tìm tranh trong nhiệm vụ. Dừng đèn nhé!');paint();}
 function paint(){
  if(dead||!session)return;const s=session.state;const keepFocus=root.contains(document.activeElement)||document.activeElement===document.body;root.replaceChildren();root.dataset.mode=session.online?'online':helper?'npc':s.seats>1?'local':'solo';root.dataset.moves=String(s.moves);
  root.append(dom('h2','',T('Our orchard mission','Nhiệm vụ vườn quả')));
  const mission=dom('div','arcade-mission');s.mission.forEach((id,i)=>{const a=art(orchardSymbol(id).art);if(s.found[i]){a.classList.add('found');a.append(dom('b','','✓'));}mission.append(a);});root.append(mission);api.dots(s.mission.length,s.found.filter(Boolean).length);
  const board=dom('div','arcade-ring');s.board.forEach((id,i)=>{const cell=dom('div','arcade-cell');cell.dataset.cell=String(i);cell.style.gridColumn=String(RING_CELLS[i][0]);cell.style.gridRow=String(RING_CELLS[i][1]);cell.append(art(orchardSymbol(id).art));board.append(cell);});
  const center=dom('div','arcade-center');center.append(art(s.last?orchardSymbol(s.last).art:'🌳'));const target=s.mission.find((_,i)=>!s.found[i]);if(target){center.append(dom('b','',T('Find','Tìm')),art(orchardSymbol(target).art));}board.append(center);root.append(board);
  const name=helper&&s.turn!==session.mine?T('Garden helper','Bạn vườn'):api.online?.names[s.turn]||api.players[s.turn]?.name||T(`Player ${s.turn+1}`,`Bạn ${s.turn+1}`);
  const status=dom('p','arcade-status',session.waiting?T('Waiting for your friend…','Đang chờ bạn…'):T(`${name} — ${s.found.filter(Boolean).length}/${s.mission.length} found`,`${name} — đã tìm ${s.found.filter(Boolean).length}/${s.mission.length}`));status.setAttribute('role','status');root.append(status);
  const actions=dom('div','arcade-actions');const stopButton=control(T('STOP','DỪNG'),stop);stopButton.dataset.orchardStop='';stopButton.disabled=!active();actions.append(stopButton);
  if(calm){const next=control(T('Next picture','Tranh tiếp theo'),()=>{position=(position+1)%16;highlight();});next.dataset.orchardChange='';next.disabled=!active();actions.append(next);}else actions.append(control(T('Make the light still','Cho đèn đứng yên'),()=>{calm=true;paint();}));root.append(actions);
  if(s.last){const d=orchardSymbol(s.last);status.textContent+=' · '+T(d.en,d.vi);}
  if(session.waiting&&waitingAt&&performance.now()-waitingAt>=30000){const b=control(T('Continue with a helper','Chơi tiếp với bạn hỗ trợ'),()=>{helper=true;session!.continueLocally();waitingAt=0;paint();});b.dataset.orchardContinue='';root.append(b);}
  if(s.combo){root.append(dom('p','',T('Special picture combination found!','Đã tìm thấy bộ tranh đặc biệt!')));if(announced!==s.combo){announced=s.combo;events.emit('ArcadeAdventureTriggered',{sourceGame:'sparkleorchard',activityType:s.combo,playerIds:api.players.map(p=>p.id).filter(Boolean),combination:s.collection,round:0,reward:null});}}
  highlight();if(keepFocus)root.focus({preventScroll:true});
  if(s.complete&&!ending){ending=true;void api.win({title:T(...ORCHARD_COMPLETION),titleVi:ORCHARD_COMPLETION[1]}).then(resolve);}
 }
 function highlight(){root.querySelectorAll<HTMLElement>('[data-cell]').forEach((cell,i)=>cell.classList.toggle('on',i===position));root.dataset.position=String(position);}
 const choices=dom('div','arcade-actions');if(api.online)start(Math.min(4,api.online.names.length),false);else{root.append(dom('h2','',T('Who will explore the orchard?','Ai cùng khám phá vườn quả?')));for(const [mode,en,vi,seats,npc]of [['solo','Just me','Mình con',1,false],['npc','With a helper','Cùng bạn hỗ trợ',2,true]]as const){const b=control(T(en,vi),()=>start(seats,npc));b.dataset.orchardMode=mode;choices.append(b);}root.append(choices);api.say('Who will explore the orchard?','Ai cùng khám phá vườn quả?');}
 function key(e:KeyboardEvent){if((e.code==='Space'||e.code==='Enter')&&!(e.target instanceof HTMLButtonElement)){e.preventDefault();stop();}}
 root.tabIndex=-1;root.addEventListener('keydown',key);
 let lastPoll=0,lastNpc=0,pressed=false;
 function animate(now:number){if(dead)return;const dt=last?Math.min(80,now-last):0;last=now;
  if(session){if(!testerArcadeAvailable('sparkleorchard',session.online?'multi':'single')){(api.stage.closest('.gl')?.querySelector('.gl-x') as HTMLButtonElement)?.click();return;}const s=session.state;if(!document.hidden&&!session.waiting&&!s.complete){elapsed+=dt;const interval=s.tier===0?1300:Math.max(500,1100-s.tier*150);if(!calm&&elapsed>=interval){elapsed=0;position=(position+1)%16;highlight();}
   if(helper&&!session.online&&s.turn!==session.mine&&now-lastNpc>1500){lastNpc=now;const target=s.mission.find((_,i)=>!s.found[i]);if(target)session.submit(s.board.indexOf(target));}
   const down=!!navigator.getGamepads?.()?.[0]?.buttons[0]?.pressed;if(down&&!pressed)stop();pressed=down;
  }
  if(session.waiting){if(!waitingAt){waitingAt=now;paint();}else if(now-waitingAt>=30000&&!root.querySelector('[data-orchard-continue]'))paint();}else if(waitingAt){waitingAt=0;paint();}
  if(now-lastPoll>2000){session.poll();lastPoll=now;}}
  frame=requestAnimationFrame(animate);
 }
 frame=requestAnimationFrame(animate);
 api.onCleanup(()=>{dead=true;cancelAnimationFrame(frame);session?.close();root.removeEventListener('keydown',key);resolve();});
 api.plan?.(()=>{if(!session)return root.querySelector('[data-orchard-mode=solo]');const s=session.state;if(session.waiting||!mine()||s.complete)return null;const target=s.mission.find((_,i)=>!s.found[i]);if(calm&&target&&s.board[position]!==target)return root.querySelector('[data-orchard-change]');return root.querySelector('[data-orchard-stop]');},{maxActions:300});
 return done;
}
register({id:'sparkleorchard',icon:'🌳',online:true,name:()=>T('Sparkle Orchard Quest','Nhiệm Vụ Vườn Quả Lấp Lánh'),run});
