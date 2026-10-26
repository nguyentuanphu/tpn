/** Shared Ô Ăn Quan rules, extracted unchanged from the existing local sow/refill/repay model. */
export type OaqBoard={seeds:number[];big:boolean[];score:number[];owe?:number[]};
export type OaqStep={k:'pick'|'drop';i:number}|{k:'restore'|'take';i:number;n:number};
const isQuan = i => i === 0 || i === 6;
export const owner = (i:number) => (i >= 1 && i <= 5 ? 0 : i >= 7 ? 1 : -1);
export function simulate(st:OaqBoard, from:number, dir:number) {
  const s = { seeds: st.seeds.slice(), big: st.big.slice(), score: st.score.slice(), owe: (st.owe || [0, 0]).slice() }, me = owner(from); const steps:OaqStep[] = [];
  const seen = new Set();
  let hand = s.seeds[from], pos = from; s.seeds[from] = 0; steps.push({ k: 'pick', i: from });
  for (;;) {
    // Cyclic relays must end promptly; keep every seed when ending a repeated/overlong turn.
    const key = `${pos}:${hand}:${s.seeds.join(',')}`;
    if (seen.has(key) || steps.length >= 240) {
      s.seeds[pos] += hand;
      steps.push({ k: 'restore', i: pos, n: hand });
      break;
    }
    seen.add(key);
    while (hand > 0) { pos = (pos + dir + 12) % 12; s.seeds[pos]++; hand--; steps.push({ k: 'drop', i: pos }); }
    const next = (pos + dir + 12) % 12;
    if (isQuan(next) && (s.seeds[next] > 0 || s.big[next])) break;
    if (s.seeds[next] > 0) { hand = s.seeds[next]; s.seeds[next] = 0; pos = next; steps.push({ k: 'pick', i: next }); continue; }
    let cur = next;
    for (;;) {
      const after = (cur + dir + 12) % 12, val = s.seeds[after] + (s.big[after] ? 10 : 0);
      if (s.seeds[cur] !== 0 || s.big[cur] || val === 0) break;
      s.score[me] += val; s.seeds[after] = 0; s.big[after] = false; steps.push({ k: 'take', i: after, n: val });
      cur = (after + dir + 12) % 12;
    }
    break;
  }
  return { s, steps };
}
// (#350, r85) a player whose five squares are all empty puts one seed back in each from their own pile; when the pile
// is short, the rest is borrowed from the other player (vay) and given back when the game ends, as in the real game.
// Nothing left anywhere: no seeds go out (n 0) and the game ends.
export function refill(st:OaqBoard, turn:number) {
  const range = turn === 0 ? [1, 2, 3, 4, 5] : [7, 8, 9, 10, 11], other = 1 - turn;
  const own = Math.min(5, st.score[turn]), borrow = Math.min(5 - own, st.score[other]), n = own + borrow;
  st.score[turn] -= own; st.score[other] -= borrow; st.owe = st.owe || [0, 0]; st.owe[turn] += borrow;
  range.slice(0, n).forEach(i => { st.seeds[i] = 1; });
  return { n, borrow };
}
// at the end, a borrowed seed goes back to the player it came from
export function repay(st:OaqBoard) { const o = st.owe || [0, 0]; for (const t of [0, 1]) { const back = Math.min(o[t], st.score[t]); st.score[t] -= back; st.score[1 - t] += back; } st.owe = [0, 0]; }

export type OaqState=OaqBoard&{turn:number;gentle:boolean;moves:number;complete:boolean;winner:number|null;last:{from:number;direction:number;captured:number;steps:OaqStep[]}|null};
export const oaqRange=(seat:number)=>seat===0?[1,2,3,4,5]:[7,8,9,10,11];
export function oaqStart(gentle:boolean,seats:number,_seed:string):OaqState{
 if(seats!==2)throw Error('Ô Ăn Quan requires two accepted seats');
 return{seeds:[0,5,5,5,5,5,0,5,5,5,5,5],big:[true,false,false,false,false,false,true,false,false,false,false,false],score:[0,0],owe:[0,0],turn:0,gentle,moves:0,complete:false,winner:null,last:null};
}
function oaqFinish(s:OaqState){
 for(let seat=0;seat<2;seat++)for(const pit of oaqRange(seat)){s.score[seat]+=s.seeds[pit];s.seeds[pit]=0;}
 repay(s);s.complete=true;s.winner=s.score[0]===s.score[1]?null:s.score[0]>s.score[1]?0:1;return s;
}
/** Pit*2 +0 clockwise /+1 anticlockwise. A client cannot sow an opponent's pit. */
export function oaqCommand(s:OaqState,value:number):OaqState|null{
 if(s.complete||!Number.isInteger(value)||value<0||value>23)return null;
 const from=Math.floor(value/2),direction=value%2?-1:1;if(!oaqRange(s.turn).includes(from)||s.seeds[from]<=0)return null;
 const result=simulate(s,from,direction),captured=result.s.score[s.turn]-s.score[s.turn];
 const next:OaqState={...s,...result.s,turn:1-s.turn,moves:s.moves+1,last:{from,direction,captured,steps:result.steps}};
 if(!next.big[0]&&!next.big[6]&&next.seeds[0]===0&&next.seeds[6]===0)return oaqFinish(next);
 if(oaqRange(next.turn).every(i=>next.seeds[i]===0)&&refill(next,next.turn).n===0)return oaqFinish(next);
 return next;
}
export function oaqChoose(s:OaqState,gentle=false):number|null{
 const options:Array<{value:number;gain:number}>=[];
 for(const pit of oaqRange(s.turn))if(s.seeds[pit]>0)for(const reverse of[0,1]){const value=pit*2+reverse,next=oaqCommand(s,value);if(next)options.push({value,gain:next.score[s.turn]-s.score[s.turn]});}
 options.sort((a,b)=>gentle?a.gain-b.gain:b.gain-a.gain);return options[0]?.value??null;
}
