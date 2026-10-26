import {randomStream} from './fruitparade-engine.js';
export const LADDERS:Readonly<Record<number,number>>={3:11,8:17,14:22};
export const SNAKES:Readonly<Record<number,number>>={19:7,24:15,16:5};
export type SnakesState={gentle:boolean;positions:number[];turn:number;seed:string;rolls:number;die:number;from:number;landed:number;destination:number;winner:number|null;complete:boolean};
export function snakesStart(gentle:boolean,seats:number,seed:string):SnakesState{
 if(!Number.isInteger(seats)||seats<2||seats>4)throw Error('Snakes requires2–4 accepted seats');
 return{gentle,positions:Array(seats).fill(1),turn:0,seed,rolls:0,die:0,from:1,landed:1,destination:1,winner:null,complete:false};
}
/** 0 requests a roll; clients cannot choose the die result or another seat's position. */
export function snakesCommand(s:SnakesState,value:number):SnakesState|null{
 if(value!==0||s.complete||s.turn<0||s.turn>=s.positions.length)return null;
 const die=1+Math.floor(randomStream(s.seed+'|roll|'+s.rolls)()*(s.gentle?3:6)),from=s.positions[s.turn],landed=Math.min(25,from+die),destination=LADDERS[landed]||(!s.gentle&&SNAKES[landed])||landed;
 const positions=[...s.positions];positions[s.turn]=destination;
 const winner=s.winner??(destination===25?s.turn:null),complete=s.gentle?positions.every(p=>p===25):winner!==null;
 let turn=s.turn;if(!complete)for(let n=1;n<=positions.length;n++){const next=(s.turn+n)%positions.length;if(positions[next]<25){turn=next;break;}}
 return{...s,positions,die,from,landed,destination,winner,complete,turn,rolls:s.rolls+1};
}
