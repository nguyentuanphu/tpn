import type{ArcadeOnline}from './arcade-session.js';
export const BOARD_PROTOCOL={maxCommands:4997,commitOffset:5000,syncMin:9999,syncMax:10000};
const CONFIG=9997,OFFER=9998,ACK=4997;
type Options={online?:ArcadeOnline;gentle:boolean;seats:number;ready:(gentle:boolean)=>void;changed?:()=>void;sendConfig?:(gentle:boolean)=>void;waitMs?:number;now?:()=>number};
/** A missing age offer falls back to gentle; an agreed mode cannot be upgraded mid-game. */
export class BoardAgreement{
 private options:Options;private channel:ArcadeOnline|undefined;private off:(()=>void)|undefined;private timer:ReturnType<typeof setTimeout>|undefined;private dead=false;private offers=new Map<number,boolean>();private acks=new Set<number>([0]);private lastPoll=-Infinity;
 readonly mine:number;mode:boolean|undefined;
 constructor(options:Options){
  this.options=options;this.channel=options.online;this.mine=this.channel?.mine||0;
  if(!Number.isInteger(options.seats)||options.seats<2||options.seats>6||!Number.isInteger(this.mine)||this.mine<0||this.mine>=options.seats)throw Error('Invalid accepted board seats');
  if(!this.channel){this.begin(options.gentle);return;}
  const off=this.channel.onMove?.((seat,n,value)=>{
   if(this.dead)return;
   if(this.mine===0&&n===ACK&&value===0&&seat>=0&&seat<options.seats){if(!this.acks.has(seat)){this.acks.add(seat);options.changed?.();}}
   else if(this.mine===0&&n===OFFER&&seat>=0&&seat<options.seats&&(value===0||value===1)){
    if(!this.offers.has(seat))this.offers.set(seat,value===0);
    if(this.offers.size===options.seats)this.begin([...this.offers.values()].some(Boolean));
   }else if(this.mine!==0&&seat===0&&n===CONFIG&&(value===0||value===1)){this.begin(value===0);if(this.mode===(value===0))this.channel?.move(ACK,0);}
   else if(this.mine===0&&n===9999&&this.mode!==undefined&&!this.acks.has(seat))this.announce();
  });if(typeof off==='function')this.off=off;
  this.offers.set(this.mine,options.gentle);
  if(this.mine===0){
   for(let seat=1;seat<options.seats;seat++){const offer=this.channel.peek?.(OFFER,seat);if(offer===0||offer===1)this.offers.set(seat,offer===0);}
   if(this.offers.size===options.seats)this.begin([...this.offers.values()].some(Boolean));else this.timer=setTimeout(()=>this.begin(true),options.waitMs??8000);
  }else{const config=this.channel.peek?.(CONFIG,0);if(config===0||config===1)this.begin(config===0);}
  this.poll();
 }
 private begin(gentle:boolean){
  if(this.dead||this.mode!==undefined||this.mine!==0&&this.options.gentle&&!gentle)return;
  this.mode=gentle;clearTimeout(this.timer);this.options.ready(gentle);if(this.channel&&this.mine===0)this.announce();else if(this.channel)this.channel.move(ACK,0);
 }
 private announce(){if(this.mode===undefined)return;if(this.options.sendConfig)this.options.sendConfig(this.mode);else this.channel?.move(CONFIG,this.mode?0:1);}
 get settled(){return this.mode!==undefined&&(!this.channel||this.mine!==0||this.acks.size===this.options.seats);}
 poll(){if(this.dead||!this.channel||this.mode!==undefined)return;const now=(this.options.now||Date.now)();if(now-this.lastPoll<1000)return;this.lastPoll=now;this.channel.move(OFFER,this.options.gentle?0:1);if(this.mine!==0)this.channel.move(9999,0);}
 close(){this.dead=true;clearTimeout(this.timer);this.off?.();}
}
