import {ArcadeSession,type ArcadeOnline}from './arcade-session.js';
import {BoardAgreement,BOARD_PROTOCOL}from './board-agreement.js';
export{BOARD_PROTOCOL}from './board-agreement.js';
type Options<S extends{turn:number}>={online?:ArcadeOnline;gentle:boolean;seats:number;seed:string;initial:(gentle:boolean,seats:number,seed:string)=>S;reduce:(s:S,value:number)=>S|null;changed:()=>void;waitMs?:number};
/** Accepted seats agree on the youngest child's mode before any ordered board commands. */
export class SharedBoardSession<S extends{turn:number}>{
 core:ArcadeSession<S>|null=null;private channel:ArcadeOnline|undefined;private agreement:BoardAgreement;private options:Options<S>;private dead=false;
 readonly mine:number;readonly seats:number;
 constructor(options:Options<S>){
  this.options=options;this.channel=options.online;this.mine=this.channel?.mine||0;this.seats=options.seats;
  this.agreement=new BoardAgreement({...options,ready:gentle=>this.begin(gentle)});
 }
 private begin(gentle:boolean){if(this.dead||this.core)return;this.core=new ArcadeSession(this.options.initial(gentle,this.seats,this.options.seed),this.channel,this.options.reduce,this.options.changed,BOARD_PROTOCOL);this.options.changed();}
 get state(){return this.core?.state||null;}get waiting(){return!this.core||this.core.waiting||!!this.channel&&!this.agreement.settled;}get busy(){return!!this.core?.busy;}get online(){return!!this.channel;}
 submit(value:number){return this.core?.submit(value)||false;}
 poll(){if(this.dead)return;if(this.core)this.core.poll();else this.agreement.poll();}
 continueLocally(){this.agreement.close();if(this.core)this.core.continueLocally();else{this.agreement.close();this.channel?.leave?.();this.channel=undefined;this.begin(true);}this.channel=undefined;this.options.changed();}
 close(){this.dead=true;this.agreement.close();this.core?.close();}
}
