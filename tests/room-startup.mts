import assert from 'node:assert/strict';
import type {Browser} from 'playwright';
import {open,clear} from './harness.mjs';
export async function roomStartupCheck(browser:Browser){
 const P=await open(browser,{settings:{online:false,countPlayers:false}});await clear(P.page);
 try{
  const result=await P.page.evaluate(async()=>{
   const {Net}=await import(String('/js/net.js')),{settings}=await import(String('/js/state.js'));
   const saved={Peer:window.Peer,door:Net._startDoor,members:Net._startMembers,pings:Net._startPings,wake:Net._wake,pub:Net._withPub};
   let mode='fail',pings=0,entered=false,release:()=>void=()=>{};
   const statuses:string[]=[];Net.on('status',s=>statuses.push(s.key));settings.online=true;
   window.Peer=class{
    open=true;constructor(..._args:unknown[]){}
    on(event:string,fn:(data:unknown)=>void){if(event===(mode==='fail'?'error':'open'))queueMicrotask(()=>fn(mode==='fail'?{type:'network'}:'synthetic-peer'));return this;}
    destroy(){} reconnect(){}
   };
   Net._withPub=async h=>h;Net._startMembers=async()=>{};Net._startPings=()=>{pings++;};Net._wake=()=>{};
   try{
    Net._startDoor=async()=>{Net.door=null;};
    const failed=await Net.host({name:'Fixture'}),failedSafe=failed===null&&Net.role===null&&pings===0;
    mode='open';const pending=new Promise<void>(r=>{release=r;});
    Net._startDoor=async()=>{Net.door={connected:false,close(){}};entered=true;await pending;};
    const cancelled=Net.host({name:'Fixture'});while(!entered)await new Promise(r=>setTimeout(r,0));Net.close(true);release();
    const cancelledSafe=await cancelled===null&&Net.role===null&&Net.code===null&&pings===0;
    entered=false;const oldDoor=new Promise<void>(r=>{release=r;});let calls=0;
    Net._startDoor=async()=>{calls++;Net.door={connected:calls>1,close(){}};if(calls===1){entered=true;await oldDoor;}};
    statuses.length=0;const first=Net.host({name:'First fixture'});while(!entered)await new Promise(r=>setTimeout(r,0));
    const second=await Net.host({name:'Second fixture'}),code=Net.code;release();const firstResult=await first;
    return{failedSafe,cancelledSafe,latestStartWins:typeof second==='string'&&second===code&&Net.code===code&&firstResult===null,waitingEvents:statuses.filter(x=>x==='waiting').length,pings,muted:Net.muted};
   }finally{Net.close(true);window.Peer=saved.Peer;Net._startDoor=saved.door;Net._startMembers=saved.members;Net._startPings=saved.pings;Net._wake=saved.wake;Net._withPub=saved.pub;}
  });
  assert.deepEqual(result,{failedSafe:true,cancelledSafe:true,latestStartWins:true,waitingEvents:1,pings:1,muted:true});assert.deepEqual(P.errors,[]);
  return 'Unavailable relay, close during startup and repeated Start leave no crashed or resurrected room; microphone stays muted';
 }finally{await P.ctx.close();}
}
