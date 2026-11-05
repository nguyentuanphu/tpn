import assert from 'node:assert/strict';import fs from 'node:fs/promises';import type {Browser} from 'playwright';
import {open,clear,noWelcome} from './harness.mts';
// (v1.08b quality, owner 5 Nov 2026 AEDT: "when the user spawn in, the owl blocks it, better to move the camera angle to
// look at the owl instead"; docs/plans/owner-20261105/spawn-owl-blocks.jpg) when a child appears by Ông Cú, on a phone, a
// tablet and a computer: the child and the owl are both on the screen, the owl is in front of the child (further from
// the camera), and nothing large stands between the camera and the child.
const SIZES=[{name:'phone',w:390,h:844,touch:true},{name:'tablet',w:820,h:1180,touch:true},{name:'computer',w:1440,h:900,touch:false}];
export async function spawnViewCheck(browser:Browser){
 const out:string[]=[],rows:unknown[]=[];await fs.mkdir('out/spawnview',{recursive:true});
 for(const s of SIZES){
  const P=await open(browser,{w:s.w,h:s.h,touch:s.touch,lang:'vi',settings:{voice:false,sound:false,autoPack:false,online:false,countPlayers:false}});
  try{await clear(P.page);await noWelcome(P.page);
   // the start of play (a fresh child starts by the owl)
   for(const when of ['start']){
    await P.page.waitForTimeout(1500);
    const r=await P.page.evaluate(async()=>{
     const G=window.__sv,h=G.heroes[0],{THREE}=await import(String('/js/gfx.js')),owl=G.npcs.find((n:any)=>n.id==='owl');
     G.scene.updateMatrixWorld(true);const cam=h.cam;cam.updateMatrixWorld(true);
     const head=new THREE.Vector3(h.pos.x,h.pos.y+1.1,h.pos.z),owlAt=new THREE.Vector3(owl.x,owl.obj.position.y+1.4,owl.z);
     const onScreen=(v:any)=>{const p=v.clone().project(cam);return p.z<1&&p.x>-.95&&p.x<.95&&p.y>-.95&&p.y<.95;};
     const dKid=cam.position.distanceTo(head),dOwl=cam.position.distanceTo(owlAt);
     // what the camera sees first on its way to the child: something big (over 1.2 m) and not the child
     const ray=new THREE.Raycaster(cam.position,head.clone().sub(cam.position).normalize(),.1,dKid-.4);
     const mine=(o:any)=>{for(let n=o;n;n=n.parent)if(n===h.av.root)return true;return false;};
     const cover=ray.intersectObjects(G.scene.children,true).filter((x:any)=>x.object.visible&&!mine(x.object)&&x.object.isMesh&&!(x.object.material&&x.object.material.transparent&&x.object.material.opacity<.5)).map((x:any)=>{const b=new THREE.Box3().setFromObject(x.object),sz=b.getSize(new THREE.Vector3());return {name:x.object.name||x.object.parent?.name||'mesh',size:+Math.max(sz.x,sz.y,sz.z).toFixed(1)};}).filter((x:any)=>x.size>1.2);
     return {kid:onScreen(head),owl:onScreen(owlAt),inFront:dOwl>dKid,cover:cover.slice(0,3),near:+Math.hypot(owl.x-h.pos.x,owl.z-h.pos.z).toFixed(1)};});
    rows.push({size:s.name,when,...r});
    const why=[r.kid?'':'the child is off the screen',r.owl?'':'the owl is off the screen',r.inFront?'':'the owl stands between the camera and the child',r.cover.length?`covered by ${JSON.stringify(r.cover)}`:''].filter(Boolean);
    if(why.length){out.push(`${s.name} ${when}: ${why.join('; ')}`);}
    await P.page.screenshot({path:`out/spawnview/${s.name}-${when}.png`});
   }
   if(P.errors.length)out.push(`${s.name}: ${P.errors.join(' | ')}`);
  }finally{await P.ctx.close();}
 }
 await fs.writeFile('out/spawnview/rows.json',JSON.stringify(rows,null,1));
 assert.deepEqual(out,[]);
 return 'phone, tablet, computer, at the start: the child faces Ông Cú with the camera behind; both on the screen, the owl in front, nothing large covering the child';
}
