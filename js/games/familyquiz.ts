import{register}from './frame.js';
import{T}from '../i18n.js';
import{settings}from '../state.js';
import{pic}from '../art.js';
import{hush,sayPrivateFamilyLine}from '../voice.js';
import{dom,control}from './arcade-board.js';
import{familyQuizQuestions}from '../family-quiz-store.js';
import{SharedBoardSession}from './shared-board-session.js';
import{quizStart,quizCommand,type QuizState}from './familyquiz-core.js';
import type{GameOnline}from './frame.js';
import type{Profile}from '../../types/save.js';
import type{FamilyQuestion,FamilyWords}from '../content/family-quiz.js';
type Api={stage:HTMLElement;players:Profile[];little:boolean;online?:GameOnline;say(en:string,vi:string):void;show(en:string,vi:string):void;right(e?:HTMLElement):void;wrong(e?:HTMLElement):void;close():void;dots(n:number,done:number):void;plan(fn:()=>HTMLElement|null,opts:{maxActions:number}):void;onCleanup(fn:()=>void):void;win(extra:{title:string;titleVi:string}):Promise<unknown>};
const FINISH:[string,string]=['You know your family so well!','Con hiểu gia đình mình quá!'];
export async function playFamilyQuiz(api:Api){
 const root=dom('section','familyquiz'),style=dom('style');style.textContent=`.familyquiz{width:min(100%,720px);margin:auto;display:grid;gap:12px;padding:8px;color:#443262}.familyquiz button{min-width:64px;min-height:64px;white-space:normal;overflow-wrap:anywhere}.familyquiz .fq-card{background:#fff7df;border:3px solid #c5a6e2;border-radius:24px;padding:16px;display:grid;gap:14px;text-align:center}.familyquiz .fq-picture .art{width:64px;height:64px}.familyquiz .fq-question{font-size:24px;margin:0;overflow-wrap:anywhere}.familyquiz .fq-answers{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.familyquiz .fq-answers button{font:inherit;font-weight:700;min-height:72px;padding:10px}.familyquiz .fq-roster,.familyquiz .fq-actions{display:flex;justify-content:center;gap:8px;flex-wrap:wrap}.familyquiz .fq-roster>span{border:3px solid #c3a9dd;border-radius:12px;background:#fff;padding:5px;max-width:100%;overflow-wrap:anywhere}.familyquiz .fq-roster>.on{border-color:#e79a23}.familyquiz .fq-private{font-size:15px;text-align:center}.familyquiz .fq-status{min-height:1.6em;text-align:center;font-weight:700}.familyquiz [hidden]{display:none!important}`;
 const roster=dom('div','fq-roster'),status=dom('p','fq-status'),card=dom('div','fq-card'),picture=dom('div','fq-picture'),question=dom('h2','fq-question'),answers=dom('div','fq-answers'),feedback=dom('p','fq-feedback'),actions=dom('div','fq-actions'),next=control(T('Next question','Câu tiếp theo'),()=>submit(6)),leave=control(T('Leave','Rời đi'),()=>api.close());next.dataset.quizNext='true';actions.append(next,leave);card.append(picture,question,answers,feedback);
 const privacy=dom('p','fq-private',T('Invited rounds are encrypted for accepted players. The device reads custom questions; they are kept out of recording requests.','Ván được mời có mã hóa cho các bạn đã nhận lời. Giọng máy đọc câu hỏi riêng; nội dung không được gửi để thu giọng.'));root.append(style,roster,status,card,actions,privacy);api.stage.append(root);
 const online=api.online,names=(online?.names||api.players.map(p=>p.name)).map(n=>String(n).slice(0,30)),mine=online?.mine||0;
 let local:QuizState|null=null,session:SharedBoardSession<QuizState>|null=null,dead=false,won=false,spoken='',speech=0,lastRequest=-Infinity,lastKey='',finish:(v:unknown)=>void;
 const completed=new Promise<unknown>(resolve=>{finish=resolve;});
 const state=()=>session?.state||local;
 const can=()=>{const s=state();return!!s&&!s.complete&&(!session||!session.waiting&&!session.busy&&(!session.online||s.turn===mine));};
 const narrate=(pair:FamilyWords)=>{const ticket=++speech;hush();if(!settings.voice)return;const first=settings.lang,other=first==='vi'?'en':'vi';void(async()=>{await sayPrivateFamilyLine(first,pair[first==='vi'?1:0]);if(!dead&&ticket===speech&&settings.bilingual&&pair[0]!==pair[1])await sayPrivateFamilyLine(other,pair[other==='vi'?1:0]);})();};
 function submit(value:number,button?:HTMLElement){
  const s=state();if(!s||!can())return;
  if(s.phase==='answer'){const correct=value===s.questions[s.round].right;if(!correct&&s.gentle){api.wrong(button);feedback.textContent=T('Try another answer.','Thử đáp án khác nhé.');return;}correct?api.right(button):api.wrong(button);}
  if(session)session.submit(value);else{const next=quizCommand(s,value);if(next){local=next;render();}}
 }
 function render(){
  if(dead)return;const s=state();
  if(!s){card.hidden=true;next.hidden=true;status.textContent=online?T('Waiting for the private family questions…','Đang chờ câu hỏi riêng của gia đình…'):T('Ask a grown-up to add family questions in Grown-ups.','Nhờ người lớn thêm câu hỏi gia đình trong phần Người lớn.');return;}
  card.hidden=false;root.dataset.round=String(s.round);root.dataset.turn=String(s.turn);root.dataset.phase=s.phase;root.dataset.scores=s.scores.join(',');root.dataset.mode=s.gentle?'gentle':'classic';api.dots(s.questions.length,s.complete?s.questions.length:s.round);
  if(s.complete){next.hidden=true;if(!won){won=true;void api.win({title:T(...FINISH),titleVi:FINISH[1]}).then(finish);}return;}
  const q=s.questions[s.round],key=s.round+':'+s.phase,words=s.phase==='reveal'?q.answers[q.right]:q.q;
  if(spoken!==key){spoken=key;narrate(words);}api.show('Our family questions','Câu hỏi nhà mình');
  roster.replaceChildren();names.forEach((name,seat)=>roster.append(dom('span',seat===s.turn?'on':'',`${name}: ${s.scores[seat]}`)));
  picture.innerHTML=pic(q.pic||'💛');question.textContent=T(...q.q);answers.replaceChildren();feedback.textContent='';
  if(s.phase==='reveal'){feedback.textContent=T('Correct answer: ','Đáp án đúng: ')+T(...q.answers[q.right]);next.hidden=false;next.disabled=!can();next.textContent=s.round+1===s.questions.length?T('Finish','Hoàn thành'):T('Next question','Câu tiếp theo');}
  else{next.hidden=true;q.answers.forEach((answer,value)=>{const b=control(T(...answer),()=>submit(value,b));b.dataset.quizAnswer=String(value);b.disabled=!can();answers.append(b);});}
  status.textContent=session?.waiting?T('Waiting for friends. Your questions stay here.','Đang chờ bạn. Câu hỏi vẫn được giữ ở đây.'):s.phase==='reveal'?T('Look at the answer together. The host continues when everyone is ready.','Cùng xem đáp án. Bạn mời sẽ chuyển tiếp khi mọi người sẵn sàng.'):T(`${names[s.turn]}: choose an answer.`,`${names[s.turn]}: chọn một đáp án.`);
 }
 function begin(questions:FamilyQuestion[]){
  if(session||local||dead)return;
  if(online)session=new SharedBoardSession({online,gentle:api.little,seats:online.names.length,seed:online.seed||'familyquiz',initial:(gentle,seats)=>quizStart(questions,gentle,seats),reduce:quizCommand,changed:()=>queueMicrotask(render)});
  else local=quizStart(questions,true,Math.max(1,Math.min(6,names.length)));
  render();
 }
 if(!online){const qs=familyQuizQuestions();if(qs.length)begin(qs);else render();}
 else if(mine===0){const qs=familyQuizQuestions();if(qs.length&&online.shareFamilyQuiz?.(qs))begin(qs);else{render();status.textContent=T('Add family questions in Grown-ups before inviting friends. A private connection is required.','Thêm câu hỏi trong phần Người lớn trước khi mời bạn. Cần kết nối riêng để chia sẻ.');}}
 else render();
 const poll=setInterval(()=>{if(dead)return;if(online&&!session){const qs=online.familyQuiz?.();if(qs?.length)begin(qs);else if(Date.now()-lastRequest>=3000){lastRequest=Date.now();online.requestFamilyQuiz?.();}}session?.poll();const s=state(),key=[s?.round,s?.turn,s?.phase,session?.waiting,session?.busy].join(':');if(key!==lastKey){lastKey=key;render();}},500);
 api.plan(()=>{const s=state();if(!s||!can())return null;return s.phase==='reveal'?next:answers.querySelector(`[data-quiz-answer="${s.questions[s.round].right}"]`);},{maxActions:1000});
 api.onCleanup(()=>{dead=true;++speech;hush();clearInterval(poll);session?.close();finish(null);});return completed;
}
export function registerFamilyQuiz(){register({id:'familyquiz',online:true,icon:'💛',name:()=>T('Family Quiz','Đố Vui Gia Đình'),run:playFamilyQuiz});}
