import test from 'node:test';
import assert from 'node:assert/strict';
globalThis.window=globalThis;
globalThis.addEventListener ||= ()=>{};
globalThis.removeEventListener ||= ()=>{};
globalThis.document ||= {createElement:()=>({}),addEventListener:()=>{}};
const storage=new Map();
globalThis.localStorage ||= {getItem:k=>storage.get(k)??null,setItem:(k,v)=>storage.set(k,String(v)),removeItem:k=>storage.delete(k)};
const {Net,myPub}=await import('../../js/net.js');
const photo='data:image/jpeg;base64,YWJj';

test('encrypted photo survives a same-key hello refresh during image loading and decryption',async()=>{
 const pub=await myPub(),saved={Image:globalThis.Image,create:document.createElement,send:Net.send,emit:Net.emit};
 let complete;const sent=[],events=[];
 try{
  globalThis.Image=class{set src(v){complete=()=>this.onload()}};
  document.createElement=()=>({getContext:()=>({drawImage(){}}),toDataURL:()=>photo});
  Object.assign(Net,{role:'host',code:'123456',me:'host',hello:{photo},knocking:false,remotes:{guest:{pub}},_photoTo:new Set(),send:d=>sent.push(d),emit:(kind,r)=>events.push([kind,r])});
  const pending=Net._sendPhoto('guest');
  Net.remotes.guest={pub,name:'refreshed'};
  complete();await pending;
  assert.equal(sent.length,1,'a repeated hello must not lose an admitted recipient’s photo');
  assert.equal(sent[0].t,'photo');assert.ok(sent[0].ct);assert.equal(sent[0].photo,undefined,'only encrypted payload travels');
  const receiving=Net._openPhoto(sent[0],'guest');
  Net.remotes.guest={pub,name:'refreshed again'};
  await receiving;
  assert.equal(Net.remotes.guest.photo,photo);
  assert.deepEqual(events.map(x=>x[0]),['hello']);assert.equal(events[0][1],Net.remotes.guest);
 }finally{globalThis.Image=saved.Image;document.createElement=saved.create;Net.send=saved.send;Net.emit=saved.emit;Net.role=null;Net.remotes={};Net._photoTo=null;}
});

test('photo awaits cannot send to a removed player, new key, new room or waiting knocker',async()=>{
 const pub=await myPub(),saved={Image:globalThis.Image,create:document.createElement,send:Net.send};
 try{
  for(const change of [()=>{delete Net.remotes.guest},()=>{Net.remotes.guest={pub:'different'}},()=>{Net.code='654321'},()=>{Net.knocking=true}]){
   let complete;const sent=[];
   globalThis.Image=class{set src(v){complete=()=>this.onload()}};
   document.createElement=()=>({getContext:()=>({drawImage(){}}),toDataURL:()=>photo});
   Object.assign(Net,{role:'host',code:'123456',me:'host',hello:{photo},knocking:false,remotes:{guest:{pub}},_photoTo:new Set(),send:d=>sent.push(d)});
   const pending=Net._sendPhoto('guest');change();complete();await pending;assert.equal(sent.length,0);
  }
 }finally{globalThis.Image=saved.Image;document.createElement=saved.create;Net.send=saved.send;Net.role=null;Net.remotes={};Net._photoTo=null;Net.knocking=false;}
});
