/** One-die Cờ Cá Ngựa: launch/bonus on 1 or 6, no jumping, exact captures, home slots 6/5/4/3.
 * Beginner is explicitly a gentle short-track adaptation, without captures or blocking. No stakes. */
export type Mode='beginner'|'full';
export type Color='red'|'blue'|'green'|'yellow';
export type SquareType='normal'|'home'|'finish';
export interface Horse{id:number;pos:number;finished:boolean;}
export interface PlayerState{color:Color;horses:Horse[];finishedCount:number;}
export interface GameState{mode:Mode;players:PlayerState[];turn:number;dice:number[];winner:Color|null;pendingMove:boolean;rng:number;rolls:number;bonus:boolean;lastRoll:number;}
export const COLORS:Color[]=['red','blue','green','yellow'];
export const ringLength=(mode:Mode)=>mode==='full'?56:16;
const hash=(text:string)=>{let n=2166136261;for(const c of text)n=Math.imul(n^c.charCodeAt(0),16777619);return n>>>0;};
const step=(n:number)=>{let x=(n+0x6d2b79f5)>>>0;x=Math.imul(x^(x>>>15),x|1);x^=x+Math.imul(x^(x>>>7),x|61);return(x^(x>>>14))>>>0;};
const clone=(s:GameState):GameState=>({...s,dice:[...s.dice],players:s.players.map(p=>({...p,horses:p.horses.map(h=>({...h}))}))});
export function initialState(mode:Mode,playerCount=2,seed='game'):GameState{
 if(!['beginner','full'].includes(mode)||!Number.isInteger(playerCount)||playerCount<2||playerCount>4)throw Error('Invalid horse game configuration');
 return{mode,players:COLORS.slice(0,playerCount).map(color=>({color,horses:Array.from({length:mode==='full'?4:2},(_,id)=>({id,pos:-1,finished:false})),finishedCount:0})),turn:0,dice:[],winner:null,pendingMove:false,rng:hash(seed),rolls:0,bonus:false,lastRoll:0};
}
export function rollDice(state:GameState,fixed?:number[]):number[]{
 if(fixed){if(fixed.length!==1||!Number.isInteger(fixed[0])||fixed[0]<1||fixed[0]>6)throw Error('Invalid one-die roll');return[...fixed];}
 return[1+Math.floor(step(state.rng)/4294967296*6)];
}
export function globalPos(player:PlayerState,horse:Horse,mode:Mode):number{
 const length=ringLength(mode);return horse.pos<0||horse.pos>=length?-1:(horse.pos+COLORS.indexOf(player.color)*length/4)%length;
}
const homeTarget=(p:PlayerState)=>6-p.finishedCount;
function destination(s:GameState,horse:Horse,value:number):number|null{
 const p=s.players[s.turn],length=ringLength(s.mode),target=homeTarget(p);
 if(horse.finished)return null;
 if(horse.pos===-1){if(s.mode==='full'&&value!==1&&value!==6)return null;return 0;}
 if(s.mode==='beginner')return Math.min(length+target-1,horse.pos+value);
 if(horse.pos===length-1){if(value>target)return null;const dest=length+value-1;
  if(p.horses.some(h=>h!==horse&&h.pos>=length&&h.pos<=dest))return null;return dest;
 }
 if(horse.pos>=length){const lane=horse.pos-length+1;if(value!==lane+1||value>target)return null;return horse.pos+1;}
 const end=horse.pos+value;if(end>=length)return null;return end;
}
export function legalMoves(s:GameState):Array<{player:number;horse:number;dieIndex:number;steps:number}>{
 if(s.winner||!s.pendingMove||s.dice.length!==1||!Number.isInteger(s.dice[0])||s.dice[0]<1||s.dice[0]>6)return[];
 const p=s.players[s.turn],length=ringLength(s.mode),value=s.dice[0],out=[];
 for(const horse of p.horses){
  const dest=destination(s,horse,value);if(dest==null)continue;
  if(s.mode==='full'&&dest<length){let blocked=false;
   for(let k=Math.max(0,horse.pos+1);k<=dest;k++){
    const place=globalPos(p,{...horse,pos:k},s.mode);
    if(s.players.some((q,seat)=>q.horses.some(h=>h!==horse&&globalPos(q,h,s.mode)===place&&(k<dest||seat===s.turn)))){blocked=true;break;}
   }if(blocked)continue;
  }
  out.push({player:s.turn,horse:horse.id,dieIndex:0,steps:value});
 }return out;
}
export function applyRoll(s:GameState):GameState{
 if(s.winner||s.pendingMove||s.dice.length)throw Error('Roll not allowed');
 const n=clone(s),value=rollDice(s)[0];n.rng=step(s.rng);n.rolls++;n.dice=[value];n.lastRoll=value;n.pendingMove=true;n.bonus=n.mode==='full'&&(value===1||value===6);
 if(!legalMoves(n).length){n.dice=[];n.pendingMove=false;if(!n.bonus)n.turn=(n.turn+1)%n.players.length;}return n;
}
export function applyMove(s:GameState,horseIndex:number,dieIndex:number):GameState{
 if(!Number.isInteger(horseIndex)||dieIndex!==0||!legalMoves(s).some(m=>m.horse===horseIndex))throw Error('Illegal horse move');
 const n=clone(s),p=n.players[n.turn],h=p.horses[horseIndex],dest=destination(s,s.players[s.turn].horses[horseIndex],s.dice[0])!;
 h.pos=dest;const length=ringLength(s.mode);
 if(n.mode==='full'&&dest<length){const square=globalPos(p,h,n.mode);n.players.forEach((q,seat)=>{if(seat!==n.turn)for(const other of q.horses)if(globalPos(q,other,n.mode)===square)other.pos=-1;});}
 if(dest===length+homeTarget(p)-1){h.finished=true;p.finishedCount++;if(p.finishedCount===p.horses.length)n.winner=p.color;}
 n.dice=[];n.pendingMove=false;if(!n.winner&&!n.bonus)n.turn=(n.turn+1)%n.players.length;return n;
}
/** Ordered session commands: 0 rolls, 1..4 choose a horse. */
export function horseCommand(s:GameState,value:number):GameState|null{
 if(!Number.isInteger(value)||value<0||value>4)return null;try{return value===0?applyRoll(s):applyMove(s,value-1,0);}catch{return null;}
}
export type NPCDifficulty='easy'|'standard'|'hard';
export function npcChooseMove(s:GameState,difficulty:NPCDifficulty):{horse:number;dieIndex:number}{
 const moves=legalMoves(s);if(!moves.length)throw Error('No legal move');
 if(difficulty==='easy')return moves[hash(serialize(s))%moves.length];
 const p=s.players[s.turn],length=ringLength(s.mode);
 const score=(m:typeof moves[number])=>{const before=p.horses[m.horse],n=applyMove(s,m.horse,0),after=n.players[s.turn].horses[m.horse];let value=(after.finished?1000:0)+(before.pos<0?25:0)+(after.pos>=length?80:after.pos);
  value+=s.players.reduce((sum,q,i)=>sum+(i===s.turn?0:q.horses.filter((h,j)=>h.pos>=0&&n.players[i].horses[j].pos<0).length*100),0);
  if(difficulty==='hard'&&after.pos<length){const place=globalPos(p,after,s.mode);for(const q of s.players)if(q!==p)for(const h of q.horses){const at=globalPos(q,h,s.mode);if(at>=0&&(place-at+length)%length<=6)value-=18;}}return value;
 };return moves.reduce((best,m)=>score(m)>score(best)?m:best);
}
export const isGameOver=(s:GameState)=>s.winner!==null;
export const serialize=(s:GameState)=>JSON.stringify(s);
export function deserialize(text:string):GameState{
 const s=JSON.parse(text) as GameState;
 if(!s||!['beginner','full'].includes(s.mode)||!Array.isArray(s.players)||s.players.length<2||s.players.length>4||!Number.isInteger(s.turn)||s.turn<0||s.turn>=s.players.length||!Number.isInteger(s.rng)||s.rng<0||s.rng>4294967295||!Number.isInteger(s.rolls)||s.rolls<0||!Array.isArray(s.dice)||s.dice.length>1||s.dice.some(n=>!Number.isInteger(n)||n<1||n>6)||s.pendingMove!==!!s.dice.length||typeof s.bonus!=='boolean'||!Number.isInteger(s.lastRoll)||s.lastRoll<0||s.lastRoll>6)throw Error('Invalid horse state');
 if(new Set(s.players.map(p=>p.color)).size!==s.players.length)throw Error('Duplicate horse seats');
 for(const p of s.players)if(!COLORS.includes(p.color)||!Array.isArray(p.horses)||p.horses.length!==(s.mode==='full'?4:2)||p.horses.some((h,i)=>h.id!==i||!Number.isInteger(h.pos)||h.pos< -1||h.pos>ringLength(s.mode)+5||typeof h.finished!=='boolean')||p.finishedCount!==p.horses.filter(h=>h.finished).length)throw Error('Invalid horses');
 if(s.winner!==null&&!s.players.some(p=>p.color===s.winner&&p.finishedCount===p.horses.length))throw Error('Invalid winner');return clone(s);
}
