export type TugState={gentle:boolean;seats:number;pulls:number[];balance:number;commands:number;winner:number|null;complete:boolean};
export function tugStart(gentle:boolean,seats:number):TugState{
 if(!Number.isInteger(seats)||seats<2||seats>6)throw Error('Tug requires2–6 accepted seats');
 return{gentle,seats,pulls:Array(seats).fill(0),balance:0,commands:0,winner:null,complete:false};
}
/** One bit per seat. Simultaneous equal pulls stay equal; packet order cannot favour one team. */
export function tugBatch(s:TugState,mask:number):TugState|null{
 if(s.complete||!Number.isInteger(mask)||mask<1||mask>=(1<<s.seats))return null;
 const pulls=[...s.pulls],teams=[Math.ceil(s.seats/2),Math.floor(s.seats/2)];let change=0,added=0;
 for(let seat=0;seat<s.seats;seat++)if(mask&(1<<seat)){pulls[seat]++;added++;change+=(seat%2===0?-1:1)/teams[seat%2];}
 const balance=Math.max(-12,Math.min(12,s.balance+change)),commands=s.commands+added;
 const complete=s.gentle?commands>=24&&pulls.every(n=>n>=2):Math.abs(balance)>=12-1e-8||commands>=240;
 return{...s,pulls,balance,commands,complete,winner:complete&&!s.gentle&&Math.abs(balance)>1e-8?(balance<0?0:1):null};
}
export function tugPull(s:TugState,seat:number):TugState|null{return Number.isInteger(seat)&&seat>=0&&seat<s.seats?tugBatch(s,1<<seat):null;}
