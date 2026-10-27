import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import type {Browser} from 'playwright';
import {open,clear,noWelcome} from './harness.mjs';
export async function worldPlacementCheck(browser:Browser){
 const baseline=JSON.parse(await fs.readFile(new URL('../docs/world-placement-audit-20261027/baseline.json',import.meta.url),'utf8'));
 const P=await open(browser,{w:900,h:700,settings:{voice:false,online:false}});
 try{await clear(P.page);await noWelcome(P.page);
 const out=await P.page.evaluate(async()=>{
  const G=window.__sv as unknown as {paused:boolean;world:{houses:{x:number;z:number;kind:string}[]};myHouse?:{home:unknown}},M=await import(String('/js/content/map.js')),W=await import(String('/js/world.js')),R=await import(String('/js/regions.js')),{THREE}=await import(String('/js/gfx.js')),{createSeeThrough}=await import(String('/js/seethrough.js'));
  G.paused=true;const errors:string[]=[];
  const sites={china:['terracotta','forbidden','heaven','potala'],india:['qutub','redfort','konark','hampi','mahabodhi']};
  for(const [place,ids]of Object.entries(sites))for(const id of ids){const l=R.LANDMARKS.find(l=>l.id===id);if(!l){errors.push('missing '+id);continue;}const x=l.mx??l.x,z=l.mz??l.z;
   if(!M.inHeritageGrounds(place,x,z)||W.regionAt(x,z)!==place)errors.push(id+' outside '+place);
   if(Math.abs(x)>W.HALF-9||Math.abs(z)>W.HALF-9)errors.push(id+' clips world boundary');
   if(W.heightAt(x,z)<=W.WATER+1.2)errors.push(id+' submerged');
   const rd=W.roadDist(x,z);if(rd.d<rd.road.w/2+6)errors.push(id+' on road');
  }
  { const p=M.landmarkAt('onepillar'),h=M.anchorOf('hanoi');if(Math.hypot(p[0]-h[0],p[1]-h[1])>35)errors.push('pagoda outside Hanoi'); }
  // A real instanced tree whose ground was raised after the original planting list was made.
  const fixture=(kind:string)=>{
   const scene=new THREE.Scene(),geometry=new THREE.BoxGeometry(2,4,2),material=new THREE.MeshToonMaterial({color:'#58a25a'}),im=new THREE.InstancedMesh(geometry,material,1),matrix=new THREE.Matrix4().makeTranslation(0,12,5);
   im.setMatrixAt(0,matrix);im.userData={kind,list:[[0,0,5,0,1]]};im.computeBoundingSphere();scene.add(im);
   const person=new THREE.Group(),body=new THREE.Mesh(geometry,material);person.userData.avatar=true;person.position.set(0,12,2);person.add(body);scene.add(person);scene.updateMatrixWorld(true);
   const S=createSeeThrough({scene,heroes:[],world:{plants:[im]}});const a=new THREE.Vector3(0,12,0),b=new THREE.Vector3(0,12,10);
   S.mark(a,b);S.step(1);const first=S.active();S.mark(a,b);S.step(1);const kept=S.active();S.step(1);const restored=S.active();im.getMatrixAt(0,matrix);
   geometry.dispose();material.dispose();return{first,kept,restored,y:matrix.elements[13],personOpaque:body.material===material};
  };
  const reported={x:179,z:-134},point={...reported,y:runtimeGround()};
  function runtimeGround(){return (window.__sv as unknown as import('../js/main.js').SvMain).world.groundAt(179,-134)+.1;}
  (window.__sv as unknown as import('../js/main.js').SvMain).world.collide(point,.45);
  if(Math.hypot(point.x-reported.x,point.z-reported.z)>.01)errors.push('invisible collision beside Hanoi house at 179,-134');
  const U=await import(String('/js/ui-settings.js')),runtime=window.__sv as unknown as import('../js/main.js').SvMain,parents=runtime.parents;
  try{runtime.parents=undefined;void U.openGrownups();if(!document.querySelector('#gFamilyQuiz')?.closest('[data-sec=family]'))errors.push('family questions unavailable before mission service starts');}
  finally{runtime.parents=parents;document.querySelector<HTMLButtonElement>('.grownups .x')?.click();}
  const pond=W.PONDS.find(p=>p.id==='hoguom'),{createSymbols}=await import(String('/js/symbols.js'));
  const probe={scene:new THREE.Scene(),world:{updaters:[]},interactables:[],heroes:[{pos:{x:pond.x,z:pond.z}}],clearSpot:(x:number,z:number)=>[x,z]};
  createSymbols(probe,{sfx:{},dialog:async()=>1});const info=probe.interactables.find(i=>i.id==='sym_hanoi');let turtle;probe.scene.traverse(o=>{if(o.userData.rig?.kind==='turtle')turtle=o.position;});if(!turtle)throw Error('Turtle body missing');if(W.heightAt(info.x,info.z)<W.WATER+.3)errors.push('turtle information spot is not on dry bank');
  for(let k=0;k<500;k++){for(const update of probe.world.updaters)update(.25);const distance=Math.hypot(turtle.x-pond.x,turtle.z-pond.z);if(distance<pond.islet+1.6||distance>pond.r*.75||W.heightAt(turtle.x,turtle.z)>=W.WATER)errors.push('Hoan Kiem turtle left its lake');}
  return{errors,houses:G.world.houses.map((h,i)=>({index:i,x:h.x,z:h.z,kind:h.kind})),tree:fixture('oak'),rock:fixture('rock'),mine:!!G.myHouse?.home};
 });
 assert.deepEqual(out.errors,[]);for(const h of baseline.houses){assert.deepEqual(out.houses[h.index],{index:h.index,x:h.x,z:h.z,kind:h.kind},'saved home index '+h.index+' must stay put');}
 for(const key of['tree','rock'])assert.deepEqual(out[key],{first:1,kept:1,restored:0,y:12,personOpaque:true},key+' fades after ground reshaping and restores its original matrix');
 assert.ok(out.mine);assert.deepEqual(P.errors,[]);return'9 heritage sites in correct districts; Hanoi pagoda; 37 saved home indices preserved; Hoan Kiem turtle stays in its lake over 125 simulated seconds; raised trees/rocks fade without fading people';
 }finally{await P.ctx.close();}
}
