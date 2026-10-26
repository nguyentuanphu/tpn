import {ArcadeSession,type ArcadeOnline} from './arcade-session.js';
export const BOARD_PROTOCOL={maxCommands:4997,commitOffset:5000,syncMin:9999,syncMax:10000};
const CONFIG=9997,OFFER=9998;
type Options<S extends{turn:number}>={online?:ArcadeOnline;gentle:boolean;seats:number;seed:string;initial:(gentle:boolean,seats:number,seed:string)=>S;reduce:(s:S,value:number)=>S|null;changed:()=>void;waitMs?:number};
/** Accepted seats agree on the youngest child's mode before any ordered board commands. */
export class SharedBoardSession<S extends{turn:number}>{
 core:ArcadeSession<S>|null=null;private channel:ArcadeOnline|undefined;private off:(()=>void)|undefined;private timeout:ReturnType<typeof setTimeout>|undefined;private dead=false;
 private offers=new Map<number,boolean>();private agreed:boolean|undefined;private options:Options<S>;
 readonly mine:number;readonly seats:number;
 constructor(options:Options<S>){
  this.options=options;this.channel=options.online;this.mine=this.channel?.mine||0;this.seats=options.seats;
  if(!this.channel){this.begin(options.gentle);return;}
  const off=this.channel.onMove?.((seat,n,value)=>{
   if(this.dead)return;
   if(this.mine===0&&n===OFFER&&seat>=0&&seat<this.seats&&(value===0||value===1)){
    if(!this.offers.has(seat))this.offers.set(seat,value===0);
    if(this.offers.size===this.seats)this.begin([...this.offers.values()].some(Boolean));
   }else if(this.mine!==0&&seat===0&&n===CONFIG&&(value===0||value===1))this.begin(value===0);
   else if(this.mine===0&&n===9999&&this.agreed!==undefined)this.channel?.move(CONFIG,this.agreed?0:1);
  });if(typeof off==='function')this.off=off;
  this.offers.set(this.mine,options.gentle);
  if(this.mine===0){
   for(let seat=1;seat<this.seats;seat++){const offer=this.channel.peek?.(OFFER,seat);if(offer===0||offer===1)this.offers.set(seat,offer===0);}
   if(this.offers.size===this.seats)this.begin([...this.offers.values()].some(Boolean));else this.timeout=setTimeout(()=>this.begin(true),options.waitMs??8000);
  }else{const config=this.channel.peek?.(CONFIG,0);if(config===0||config===1)this.begin(config===0);}
  this.channel.move(OFFER,options.gentle?0:1);this.poll();
 }
 private begin(gentle:boolean){
  if(this.dead||this.agreed!==undefined||this.mine!==0&&this.options.gentle&&!gentle)return;
  this.agreed=gentle;clearTimeout(this.timeout);
  this.core=new ArcadeSession(this.options.initial(gentle,this.seats,this.options.seed),this.channel,this.options.reduce,this.options.changed,BOARD_PROTOCOL);
  if(this.channel&&this.mine===0)this.channel.move(CONFIG,gentle?0:1);this.options.changed();
 }
 get state(){return this.core?.state||null;}get waiting(){return!this.core||this.core.waiting;}get busy(){return!!this.core?.busy;}get online(){return!!this.channel;}
 submit(value:number){return this.core?.submit(value)||false;}
 poll(){if(this.dead)return;if(this.core)this.core.poll();else if(this.channel){this.channel.move(OFFER,this.options.gentle?0:1);if(this.mine!==0)this.channel.move(9999,0);}}
 continueLocally(){if(this.core)this.core.continueLocally();else{this.channel?.leave?.();this.channel=undefined;this.begin(true);}this.channel=undefined;this.options.changed();}
 close(){this.dead=true;clearTimeout(this.timeout);this.off?.();this.core?.close();}
}
