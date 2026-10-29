import { T } from '../i18n.js';
import { el,esc,wait } from '../util.js';
import { settings } from '../state.js';
import { ac,animalRecording,loadAnimalCalls } from '../audio.js';
import { goatCircle,goatListen,goatCue,goatStep,goatCatch,GOAT_DIRECTIONS,type GoatDirection } from './goat-core.js';
import {goatChildArt,goatArrowArt,GOAT_LISTEN_ART,GOAT_CATCH_ART} from './goat-art.js';

type GoatApi={stage:HTMLElement;level:number;little:boolean;readonly closed:boolean;sfx:Record<string,(...args:any[])=>void>;say(en:string,vi:string):void;show(en:string,vi:string):void;dots(n:number,done:number):void;praise():void;win():unknown;plan(f:()=>HTMLElement|null,opts?:{maxActions:number}):void;onCleanup(f:()=>void):void};
const CUES:Record<GoatDirection,[string,string]>={
 nw:['Up and left!','Lên trên, sang trái nhé!'],n:['Up!','Lên trên nhé!'],ne:['Up and right!','Lên trên, sang phải nhé!'],
 w:['Left!','Sang trái nhé!'],e:['Right!','Sang phải nhé!'],
 sw:['Down and left!','Xuống dưới, sang trái nhé!'],s:['Down!','Xuống dưới nhé!'],se:['Down and right!','Xuống dưới, sang phải nhé!']
};
const STYLE=`.goat-circle-game{width:min(100%,430px);display:grid;gap:8px;justify-items:center;align-content:start}.goat-circle-game .goat-field{display:block;width:100%;height:min(30vh,240px);min-height:165px}.goat-circle-game .goat-listen{min-height:64px;display:flex;align-items:center;justify-content:center;gap:8px;padding:6px 18px}.goat-circle-game .goat-listen svg{width:40px;height:40px}.goat-circle-game .goat-pad{display:grid;grid-template-columns:repeat(3,64px);gap:8px}.goat-circle-game .goat-pad button{width:64px;min-width:64px;height:64px;min-height:64px;padding:5px;border-radius:20px;display:flex;align-items:center;justify-content:center}.goat-circle-game .goat-pad svg{width:42px;height:42px}.goat-circle-game .goat-pad .goat-catch{background:#f7d5e7}.goat-circle-game .goat-pad button.goat-guide{outline:4px solid #ffbb49;outline-offset:1px}.goat-circle-game .goat-cue{min-height:26px;display:flex;align-items:center;justify-content:center;gap:6px;margin:0;text-align:center;font-size:16px}.goat-circle-game .goat-cue svg{width:26px;height:26px}.goat-circle-game .goat-round{font-size:14px;text-align:center;margin:0}.goat-circle-game .goat-ring{fill:none;stroke:#f2b739;stroke-width:3}.goat-circle-game .goat-path{stroke:#d6f0c4;stroke-width:3;stroke-dasharray:5 8;fill:none}`;

export async function runGoat(api:GoatApi){
 const rounds=3;let nextSeeker=0;
 api.say('Play Bịt mắt bắt dê! Guide the blindfolded friend. Listen, follow the call, then catch a friend nearby.', 'Cùng chơi Bịt mắt bắt dê! Dẫn bạn bịt mắt đi nào. Nghe tiếng gọi, đi theo, rồi bắt bạn ở gần nhé.');
 // Loading never blocks the controls; visual and spoken cues also work when sound is off/unavailable.
 const calls=loadAnimalCalls();let closed=false;
 api.onCleanup(()=>{closed=true;});
 for(let round=0;round<rounds;round++){
  if(api.closed||closed)return;
  api.dots(rounds,round);api.stage.innerHTML='';
  const state=goatCircle(nextSeeker,api.little);
  const wrap=el('div','goat-circle-game') as HTMLDivElement;wrap.dataset.round=String(round);
  wrap.innerHTML=`<style>${STYLE}</style><p class="goat-round">${esc(T('Friends take turns wearing the blindfold.','Các bạn lần lượt làm người bịt mắt.'))}</p><div class="goat-scene"></div><p class="goat-cue" role="status" aria-live="polite"></p><button class="pill goat-listen">${GOAT_LISTEN_ART}<span>${T('Listen','Nghe')}</span></button><div class="goat-pad"></div>`;
  api.stage.appendChild(wrap);
  const scene=wrap.querySelector<HTMLElement>('.goat-scene')!,status=wrap.querySelector<HTMLElement>('.goat-cue')!,listen=wrap.querySelector<HTMLButtonElement>('.goat-listen')!,pad=wrap.querySelector<HTMLElement>('.goat-pad')!;
  scene.style.width='100%';
  let active=true,callVersion=0,timer:ReturnType<typeof setTimeout>|undefined,source:AudioBufferSourceNode|null=null;
  const stopCall=()=>{callVersion++;clearTimeout(timer);try{source?.stop();}catch{}source=null;};
  const buttons={} as Record<GoatDirection,HTMLButtonElement>;
  const catchButton=el('button','pill goat-catch',GOAT_CATCH_ART) as HTMLButtonElement;catchButton.setAttribute('aria-label',T('Catch a nearby friend','Bắt bạn ở gần'));
  for(const key of ['nw','n','ne','w','catch','e','sw','s','se']){
   if(key==='catch'){pad.appendChild(catchButton);continue;}
   const d=key as GoatDirection,[dx,dy]=GOAT_DIRECTIONS[d];
   const b=el('button','pill',goatArrowArt(dx,dy)) as HTMLButtonElement;b.dataset.goatDirection=d;b.setAttribute('aria-label',T(...CUES[d]));buttons[d]=b;pad.appendChild(b);
  }
  const draw=()=>{
   const cue=goatCue(state),visible=state.heard||api.little;
   scene.innerHTML=`<svg class="goat-field" viewBox="0 0 400 260" role="img" aria-label="${esc(T('Four friends playing inside a marked circle. The seeker wears a blindfold.','Bốn bạn chơi trong vòng tròn. Bạn đi bắt có khăn bịt mắt.'))}"><rect x="5" y="5" width="390" height="250" rx="34" fill="#eef7d9"/><ellipse cx="200" cy="139" rx="166" ry="102" fill="#d8edba" stroke="#fcfcf0" stroke-width="7"/><ellipse class="goat-path" cx="200" cy="139" rx="140" ry="83"/>
   ${state.children.map(c=>{const x=200+c.x*166,y=139+c.y*102,caller=c.id===state.caller&&state.heard;return `<g data-goat-child="${c.id}" transform="translate(${x} ${y})" opacity="${c.id===state.seeker||visible?1:.4}">${caller?'<ellipse class="goat-ring" cy="-12" rx="24" ry="31"/><path class="goat-ring" d="M25-27q13 12 0 24M31-32q18 17 0 34"/>':''}${goatChildArt(c.id,c.id===state.seeker)}</g>`;}).join('')}</svg>`;
   Object.values(buttons).forEach(b=>b.classList.remove('goat-guide'));catchButton.classList.remove('goat-guide');
   if(!state.heard){status.innerHTML=`${GOAT_LISTEN_ART}<span>${T('Listen for your friend.','Nghe tiếng bạn gọi nhé.')}</span>`;return;}
   if(cue.near){status.innerHTML=`${GOAT_CATCH_ART}<span>${T('Your friend is close. Catch!','Bạn ở gần rồi. Bắt nào!')}</span>`;if(api.little)catchButton.classList.add('goat-guide');}
   else{const[dx,dy]=GOAT_DIRECTIONS[cue.direction];status.innerHTML=goatArrowArt(dx,dy)+`<span>${esc(T(...CUES[cue.direction]))}</span>`;if(api.little)buttons[cue.direction].classList.add('goat-guide');}
  };
  const sayCue=()=>{if(!active||closed||api.closed)return;const cue=goatCue(state);if(cue.near)api.say('Your friend is close. Catch!', 'Bạn ở gần rồi. Bắt nào!');else api.say(...CUES[cue.direction]);};
  const call=async()=>{
   stopCall();goatListen(state);draw();const version=callVersion;
   await calls;if(!active||closed||api.closed||version!==callVersion)return;
   let duration=0;
   const context=ac(),buffer=animalRecording('baa') as AudioBuffer|null;
   if(settings.sound&&context&&buffer&&!document.hidden){
    source=context.createBufferSource();source.buffer=buffer;
    const gain=context.createGain();gain.gain.value=.3;
    const pan=context.createStereoPanner();pan.pan.value=goatCue(state).pan;
    const own=source;source.connect(pan);pan.connect(gain);gain.connect(context.destination);
    own.onended=()=>{own.disconnect();pan.disconnect();gain.disconnect();if(source===own)source=null;};own.start();duration=buffer.duration*1000;
   }
   timer=setTimeout(()=>{if(version===callVersion)sayCue();},duration+30);
  };
  listen.onclick=()=>{void call();};
  const done=await new Promise<boolean>(resolve=>{
   const finish=(caught:boolean)=>{if(!active)return;active=false;stopCall();resolve(caught);};
   api.onCleanup(()=>{finish(false);window.removeEventListener('keydown',key);});
   Object.entries(buttons).forEach(([d,b])=>{b.onclick=()=>{if(!active)return;goatStep(state,d as GoatDirection);api.sfx.step();draw();};});
   catchButton.onclick=()=>{
    if(!active)return;
    const caught=goatCatch(state);
    if(caught!==null){nextSeeker=caught;wrap.dataset.caught=String(caught);api.sfx.chime();api.say('Caught! Now your friend wears the blindfold.', 'Bắt được rồi! Giờ đến lượt bạn bịt mắt.');finish(true);}
    else{goatListen(state);draw();api.say('Not close enough yet. Follow the call!', 'Chưa đủ gần đâu. Đi theo tiếng gọi nhé!');}
   };
   const key=(e:KeyboardEvent)=>{if(!active||e.target instanceof HTMLElement&&e.target.closest('input,textarea,select,button'))return;const d=({ArrowUp:'n',ArrowDown:'s',ArrowLeft:'w',ArrowRight:'e'} as Record<string,GoatDirection>)[e.key];if(d){e.preventDefault();buttons[d].click();}else if(e.key===' '){e.preventDefault();listen.click();}else if(e.key==='Enter'){e.preventDefault();catchButton.click();}};
   window.addEventListener('keydown',key);
   // The planner follows the same heard direction/range cue and activates real visible controls.
   api.plan(()=>{if(!active||api.closed)return null;if(!state.heard)return listen;const cue=goatCue(state);return cue.near?catchButton:buttons[cue.direction];},{maxActions:rounds*80});
   draw();
  });
  if(!done||api.closed||closed)return;
  await wait(1000);
 }
 api.dots(rounds,rounds);return api.win();
}
