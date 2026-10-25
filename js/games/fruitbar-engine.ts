import { randomStream } from './fruitparade-engine.js';
export const BAR_SYMBOLS=[{art:'🍎',en:'Apple',vi:'Táo',mult:5,weight:30},{art:'🍊',en:'Orange',vi:'Cam',mult:8,weight:23},{art:'🍋',en:'Lemon',vi:'Chanh',mult:10,weight:18},{art:'🍉',en:'Watermelon',vi:'Dưa hấu',mult:12,weight:12},{art:'🔔',en:'Bell',vi:'Chuông',mult:15,weight:8},{art:'⭐',en:'Star',vi:'Sao',mult:20,weight:5},{art:'7',en:'Seven',vi:'Số bảy',mult:40,weight:3},{art:'BAR',en:'BAR',vi:'BAR',mult:60,weight:1}]as const;
export interface BarState{seed:string;seats:number;turn:number;round:number;limit:number;fair:boolean;phase:'allocate'|'result'|'complete';bets:number[][];previous:number[][];balances:number[];lastWins:number[];biggest:number[];result:number|null;}
export function barStart(seed:string,seats:number,fair=false,limit=20):BarState{if(!Number.isInteger(seats)||seats<1||seats>4)throw new Error('Bar seats must be 1–4');return{seed,seats,turn:0,round:0,limit,fair,phase:'allocate',bets:Array.from({length:seats},()=>Array(8).fill(0)),previous:Array.from({length:seats},()=>Array(8).fill(0)),balances:Array(seats).fill(100000),lastWins:Array(seats).fill(0),biggest:Array(seats).fill(0),result:null};}
export function barResult(seed:string,round:number,fair:boolean){const rand=randomStream(`${seed}:bar:${round}`);let n=rand()*100;if(fair)return Math.floor(n*8/100);for(let i=0;i<8;i++){n-=BAR_SYMBOLS[i].weight;if(n<0)return i;}return 7;}
export function barApply(s:BarState,value:number):BarState|null{
 if(!Number.isInteger(value)||value<0||s.phase==='complete')return null;
 if(s.phase==='result'){if(value!==901)return null;return{...s,phase:s.round>=s.limit?'complete':'allocate',turn:0,bets:s.bets.map(()=>Array(8).fill(0))};}
 if(value===902){if(s.balances[s.turn]>=100000)return null;const balances=[...s.balances];balances[s.turn]=100000;return{...s,balances};}
 if(value<808){const symbol=Math.floor(value/101),amount=value%101;const bets=s.bets.map(row=>[...row]);bets[s.turn][symbol]=amount;if(bets[s.turn].reduce((a,b)=>a+b,0)>s.balances[s.turn])return null;return{...s,bets};}
 if(value!==900||!s.bets[s.turn].some(Boolean))return null;
 if(s.turn<s.seats-1)return{...s,turn:s.turn+1};
 const result=barResult(s.seed,s.round,s.fair),lastWins=s.bets.map(row=>row[result]*BAR_SYMBOLS[result].mult),balances=s.balances.map((b,i)=>b-s.bets[i].reduce((a,n)=>a+n,0)+lastWins[i]);
 return{...s,turn:0,round:s.round+1,phase:'result',result,lastWins,balances,biggest:s.biggest.map((n,i)=>Math.max(n,lastWins[i])),previous:s.bets.map(row=>[...row])};
}
