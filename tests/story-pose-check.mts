import assert from 'node:assert/strict';import fs from 'node:fs/promises';
import {open} from './harness.mjs';import type {Browser} from 'playwright';
export async function storyPoseCheck(browser:Browser){
 const P=await open(browser,{play:false,w:1000,h:760,settings:{voice:false,sound:false,online:false}});
 try{
 await fs.mkdir('out/story-poses',{recursive:true});
 await P.page.evaluate(()=>{window.__svFilmRate=1e-8;document.querySelectorAll('.screen').forEach(e=>e.remove());const stage=document.createElement('div');stage.id='pose-stage';stage.style.cssText='position:fixed;inset:0;background:#ddd';document.body.append(stage);});
 const geometry=await P.page.evaluate(async()=>{
  const {createFilm}=await import(String('/js/film.js')),{taleFilm}=await import(String('/js/content/talefilms.js')),{THREE}=await import(String('/js/gfx.js'));let elephants=0,sips=0;
  for(const id of ['elephantmice','crow']){
   const f=createFilm(document.querySelector('#pose-stage'),await taleFilm(id));f.onSay=async()=>{};
   for(const k of id==='crow'?[4]:[1,2,3,4,5]){
    void f.page(k);f.narrated();const p=f.now;
    for(let step=0;step<300;step++){
     if(p.hold)p.release(false);p.tick(.04,step*.04);await Promise.resolve();p.root.updateMatrixWorld(true);
     p.root.traverse(o=>{
      const rig=o.userData.rig;if(rig?.kind==='elephant'&&step%20===0){const body=new THREE.Box3().setFromObject(rig.root.children[0]),head=new THREE.Box3().setFromObject(rig.head.children[0]);if(!body.intersectsBox(head))throw Error('Elephant head separated from body');elephants++;}
      if(o.userData.storyCrow&&o.userData.body.rotation.x>.9){const beak=o.userData.beak.getWorldPosition(new THREE.Vector3());if(Math.hypot(beak.x-1,beak.z-2)>.47||Math.abs(beak.y-1.1)>.12||Math.abs(o.position.y-1.2)>.01)throw Error('Crow sip misses water or feet leave rim');sips++;}
     });
    }
   }f.close();
  }
  return{elephants,sips};
 });
 assert.ok(geometry.elephants>=100);assert.ok(geometry.sips>=3);
 for(const [device,w,h]of [['phone',390,844],['tablet',820,1180],['computer',1280,850]]as const)for(const lang of ['en','vi']){
  await P.page.setViewportSize({width:w,height:h});
  await P.page.evaluate(async lang=>{(await import(String('/js/state.js'))).settings.lang=lang;const {createFilm}=await import(String('/js/film.js')),{taleFilm}=await import(String('/js/content/talefilms.js'));const f=createFilm(document.querySelector('#pose-stage'),await taleFilm('crow'));f.onSay=async()=>{};void f.page(4);f.narrated();const p=f.now;for(let n=0;n<300;n++){if(p.hold)p.release(false);p.tick(.025,n*.025);await Promise.resolve();let sipping=false;p.root.traverse(o=>{if(o.userData.storyCrow&&o.userData.body.rotation.x>.98)sipping=true;});if(sipping)break;}},lang);
  await P.page.evaluate(()=>new Promise<void>(r=>requestAnimationFrame(()=>requestAnimationFrame(()=>r()))));await P.page.screenshot({path:`out/story-poses/${device}-${lang}.png`});
  await P.page.evaluate(async()=>{(await import(String('/js/film.js'))).filmNow().close();});
 }
 assert.deepEqual(P.errors,[]);return`${geometry.elephants} connected elephant poses; ${geometry.sips} crow sips reach water with feet on jug rim; six bilingual/device captures`;
 }finally{await P.ctx.close();}
}
