import { randomStream } from './fruitparade-engine.js';
export type OrchardSymbol = 'apple'|'berry'|'banana'|'flower'|'ladybird'|'star'|'rainbow'|'dragon'|'key';
export const ORCHARD_SYMBOLS: ReadonlyArray<{id:OrchardSymbol;art:string;en:string;vi:string}> = [
  {id:'apple',art:'🍎',en:'Apple',vi:'Táo'},{id:'berry',art:'🍓',en:'Strawberry',vi:'Dâu tây'},
  {id:'banana',art:'🍌',en:'Banana',vi:'Chuối'},{id:'flower',art:'🌻',en:'Flower',vi:'Hoa'},
  {id:'ladybird',art:'🐞',en:'Ladybird',vi:'Bọ rùa'},{id:'star',art:'⭐',en:'Star',vi:'Ngôi sao'},
  {id:'rainbow',art:'🌈',en:'Rainbow',vi:'Cầu vồng'},{id:'dragon',art:'🐉',en:'Dragon',vi:'Rồng'},
  {id:'key',art:'🗝️',en:'Key',vi:'Chìa khóa'}
];
export interface OrchardState {seed:string;seats:number;turn:number;tier:number;board:OrchardSymbol[];mission:OrchardSymbol[];found:boolean[];moves:number;misses:number;last:OrchardSymbol|null;complete:boolean;collection:OrchardSymbol[];combo:'ladybird'|'dragon'|'treasure'|null;}
export const orchardSymbol=(id:OrchardSymbol)=>ORCHARD_SYMBOLS.find(s=>s.id===id)!;
export function orchardStart(seed:string,seats:number,tier:number):OrchardState {
  if(!Number.isInteger(seats)||seats<1||seats>4)throw new Error('Orchard seats must be 1–4');
  const rand=randomStream(seed), board:OrchardSymbol[]=[];
  for(let i=0;i<16;i++)board.push(ORCHARD_SYMBOLS[Math.floor(rand()*ORCHARD_SYMBOLS.length)].id);
  // Every required picture really exists on the board, including repeated goals.
  const mission=Array.from({length:tier===0?3:5},()=>board[Math.floor(rand()*board.length)]);
  return {seed,seats,turn:0,tier,board,mission,found:mission.map(()=>false),moves:0,misses:0,last:null,complete:false,collection:[],combo:null};
}
export function orchardStop(s:OrchardState,value:number):OrchardState|null {
  if(s.complete||!Number.isInteger(value)||value<0||value>=s.board.length)return null;
  let symbol=s.board[value];const found=[...s.found];let i=s.mission.findIndex((id,n)=>!found[n]&&id===symbol);
  // A star helps common pictures only; rare adventure combinations must be real.
  if(i<0&&symbol==='star')i=s.mission.findIndex((id,n)=>!found[n]&&['apple','berry','banana','flower'].includes(id));
  if(i<0&&s.tier===0){for(const offset of [-1,1]){const near=s.board[(value+offset+s.board.length)%s.board.length];const j=s.mission.findIndex((id,n)=>!found[n]&&id===near);if(j>=0){symbol=near;i=j;break;}}}
  if(i<0&&s.misses>=3){i=found.indexOf(false);symbol=s.mission[i];}
  if(i>=0)found[i]=true;
  const collection=[...s.collection,symbol];let combo=s.combo;
  if(collection.filter(x=>x==='ladybird').length>=3)combo='ladybird';
  if(collection.includes('dragon')&&collection.filter(x=>x==='star').length>=2)combo='dragon';
  if(collection.includes('key')&&collection.includes('rainbow')&&collection.includes('star'))combo='treasure';
  return {...s,turn:(s.turn+1)%s.seats,found,moves:s.moves+1,misses:i>=0?0:s.misses+1,last:symbol,collection,combo,complete:found.every(Boolean)};
}
