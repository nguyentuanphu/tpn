import type{ArcadeOnline}from './arcade-session.js';
import{BoardAgreement}from './board-agreement.js';
import{tugStart,tugPull,tugBatch,type TugState}from './tug-core.js';
type Options={online:ArcadeOnline;gentle:boolean;changed:()=>void;now?:()=>number;waitMs?:number};
/** Concurrent seats request pulls. The inviter batches pulls into one global ordered stream at <=4 messages/s. */
export class TugSession{
 state:TugState|null=null;index=0;private options:Options;private channel:ArcadeOnline|undefined;private agreement:BoardAgreement;private off:(()=>void)|undefined;private dead=false;
 private tape:number[]=[];private expected:number[];private receipts=new Map<string,number>();private pendingRequest:number|undefined;private nextRequest=0;private queue=new Map<number,number>();private commits=new Map<number,number>();private replay=new Set<number>();private nextPump=0;private lastSync=0;private configPending:boolean|undefined;private replayTurn=false;
 readonly mine:number;readonly seats:number;
 constructor(options:Options){
  this.options=options;this.channel=options.online;this.mine=this.channel.mine;this.seats=this.channel.names.length;this.expected=Array(this.seats).fill(0);
  const off=this.channel.onMove?.((seat,n,value)=>this.receive(seat,n,value));if(typeof off==='function')this.off=off;
  this.agreement=new BoardAgreement({online:this.channel,gentle:options.gentle,seats:this.seats,waitMs:options.waitMs,now:options.now,changed:options.changed,sendConfig:gentle=>{this.configPending=gentle;},ready:gentle=>{this.state=tugStart(gentle,this.seats);this.catchup();options.changed();}});
 }
 private clock(){return(this.options.now||Date.now)();}
 get waiting(){return!this.state||!!this.channel&&!this.agreement.settled||!!this.channel&&(this.channel.connected?.()===false||this.channel.names.some((_,seat)=>this.channel?.present?.(seat)===false));}
 get busy(){return this.pendingRequest!==undefined||this.queue.has(this.mine);}get online(){return!!this.channel;}
 submit(seat=this.mine){
  if(this.dead||!this.state||this.state.complete||this.waiting||this.index>=4997||!Number.isInteger(seat)||seat<0||seat>=this.seats)return false;
  if(!this.channel){const next=tugPull(this.state,seat);if(!next)return false;this.state=next;this.index++;this.options.changed();return true;}
  if(seat!==this.mine||this.busy)return false;
  if(this.mine===0)this.queue.set(0,this.expected[0]);else{this.pendingRequest=this.nextRequest;this.channel.move(this.nextRequest,1);}
  this.options.changed();this.poll();return true;
 }
 private receive(seat:number,n:number,value:number){
  if(this.dead||!this.channel||!Number.isInteger(seat)||seat<0||seat>=this.seats||!Number.isInteger(n)||!Number.isInteger(value))return;
  if(this.mine===0){
   if(n===9999&&value>=0&&value<=this.index){for(let i=value;i<this.index;i++)this.replay.add(i);return;}
   if(n<0||n>=4997||value!==1||!this.state||this.state.complete)return;
   if(n<this.expected[seat]){const at=this.receipts.get(seat+':'+n);if(at!==undefined)this.replay.add(at);return;}
   if(n===this.expected[seat]&&!this.queue.has(seat))this.queue.set(seat,n);return;
  }
  if(seat!==0||n<5000||n>=9997||n-5000<this.index||value<1||value>=(1<<this.seats))return;
  this.commits.set(n-5000,value);this.applyCommits();
 }
 private applyCommits(){
  if(!this.state)return;
  while(this.commits.has(this.index)){const mask=this.commits.get(this.index)!,next=tugBatch(this.state,mask);if(!next)break;
   this.commits.delete(this.index);this.tape[this.index]=mask;this.state=next;this.index++;if(mask&(1<<this.mine)){this.pendingRequest=undefined;this.nextRequest++;}}
  this.options.changed();
 }
 private catchup(){if(!this.channel||this.mine===0||!this.state)return;while(true){const index=this.index,value=this.channel.peek?.(5000+index,0);if(value===undefined)break;this.receive(0,5000+index,value);if(this.index===index)break;}}
 poll(){
  if(this.dead)return;if(!this.state){this.agreement.poll();return;}if(!this.channel)return;this.catchup();
  const now=this.clock();
  if(this.mine===0&&this.configPending!==undefined&&now>=this.nextPump){this.nextPump=now+250;this.channel.move(9997,this.configPending?0:1);this.configPending=undefined;return;}
  if(this.waiting)return;
  if(this.mine!==0){if(now-this.lastSync>=1000){this.lastSync=now;if(this.pendingRequest!==undefined)this.channel.move(this.pendingRequest,1);this.channel.move(9999,this.index);}return;}
  if(now<this.nextPump)return;this.nextPump=now+250;
  // Fresh pulls and replay share the same rate budget; replay never mutates the board.
  const first=this.queue.entries().next().value;
  const resend=this.replay.values().next().value;if(resend!==undefined&&(this.replayTurn||!first||this.state.complete)){this.replay.delete(resend);this.channel.move(5000+resend,this.tape[resend]);this.replayTurn=false;return;}
  if(first&&!this.state.complete){
   let mask=0;for(const seat of this.queue.keys())mask|=1<<seat;const next=tugBatch(this.state,mask);if(!next)return;
   for(const[seat,request]of this.queue){this.receipts.set(seat+':'+request,this.index);this.expected[seat]++;}this.queue.clear();
   this.tape[this.index]=mask;this.state=next;this.channel.move(5000+this.index,mask);this.index++;this.replayTurn=true;this.options.changed();return;
  }
 }
 continueLocally(){this.channel?.leave?.();this.channel=undefined;this.agreement.close();this.queue.clear();this.pendingRequest=undefined;if(!this.state)this.state=tugStart(true,this.seats);this.options.changed();}
 close(){this.dead=true;this.off?.();this.agreement.close();this.queue.clear();this.commits.clear();this.replay.clear();}
}
