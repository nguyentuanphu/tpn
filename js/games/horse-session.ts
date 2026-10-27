import {ArcadeSession,type ArcadeOnline} from './arcade-session.js';
import {horseCommand,initialState,type GameState,type Mode} from './cacuangua-core.js';
// Three reserved slots leave 4,997 request/commit pairs for a long classic match.
export const HORSE_PROTOCOL={maxCommands:4997,commitOffset:5000,syncMin:9999,syncMax:10000};
const CONFIG=9997,OFFER=9998;
type HorseOptions={online?:ArcadeOnline;mode:Mode;seats:number;seed:string;changed:()=>void;waitMs?:number};
/** The youngest invited child determines the shared rules; only the host commits moves. */
export class HorseSession{
 core:ArcadeSession<GameState>|null=null;
 private channel:ArcadeOnline|undefined;private off:(()=>void)|undefined;private timeout:ReturnType<typeof setTimeout>|undefined;
 private offers=new Map<number,Mode>();private mode:Mode|null=null;private dead=false;
 private options:HorseOptions;
 readonly mine:number;readonly seats:number;readonly seed:string;
 constructor(options:HorseOptions){
  this.options=options;
  this.channel=options.online;this.mine=this.channel?.mine||0;this.seats=options.seats;this.seed=options.seed;
  if(!this.channel){this.begin(options.mode);return;}
  const off=this.channel.onMove?.((seat,n,value)=>{
   if(this.dead)return;
   if(this.mine===0&&n===OFFER&&seat>=0&&seat<this.seats&&(value===0||value===1)){
    if(!this.offers.has(seat))this.offers.set(seat,value===0?'beginner':'full');
    if(this.offers.size===this.seats)this.begin([...this.offers.values()].includes('beginner')?'beginner':'full');
   }else if(this.mine!==0&&seat===0&&n===CONFIG&&(value===0||value===1))this.begin(value===0?'beginner':'full');
   else if(this.mine===0&&n===9999&&this.mode)this.channel?.move(CONFIG,this.mode==='beginner'?0:1);
  });if(typeof off==='function')this.off=off;
  this.offers.set(this.mine,options.mode);
  if(this.mine===0){
   for(let s=1;s<this.seats;s++){const v=this.channel.peek?.(OFFER,s);if(v===0||v===1)this.offers.set(s,v===0?'beginner':'full');}
   if(this.offers.size===this.seats)this.begin([...this.offers.values()].includes('beginner')?'beginner':'full');
   else this.timeout=setTimeout(()=>this.begin('beginner'),options.waitMs??8000);
  }else{const v=this.channel.peek?.(CONFIG,0);if(v===0||v===1)this.begin(v===0?'beginner':'full');}
  this.channel.move(OFFER,options.mode==='beginner'?0:1);this.poll();
 }
 private begin(mode:Mode){
  if(this.dead||this.mode||this.mine!==0&&this.options.mode==='beginner'&&mode==='full')return;
  this.mode=mode;clearTimeout(this.timeout);
  this.core=new ArcadeSession(initialState(mode,this.seats,this.seed),this.channel,horseCommand,this.options.changed,HORSE_PROTOCOL);
  if(this.channel&&this.mine===0)this.channel.move(CONFIG,mode==='beginner'?0:1);
  this.options.changed();
 }
 get state(){return this.core?.state||null;}
 get waiting(){return!this.core||this.core.waiting;}
 get online(){return!!this.channel;}
 get busy(){return!!this.core?.busy;}
 submit(value:number){return this.core?.submit(value)||false;}
 poll(){if(this.dead)return;if(this.core)this.core.poll();else if(this.channel){this.channel.move(OFFER,this.options.mode==='beginner'?0:1);if(this.mine!==0)this.channel.move(9999,0);}}
 continueLocally(){if(this.core)this.core.continueLocally();else{this.channel?.leave?.();this.channel=undefined;this.begin('beginner');}this.channel=undefined;this.options.changed();}
 close(){this.dead=true;clearTimeout(this.timeout);this.off?.();this.core?.close();}
}
