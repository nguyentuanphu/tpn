import fs from 'node:fs/promises';
import {launch,open} from './harness.mjs';
const b=await launch();const output=process.env.STORY_POSE_PHASE||'before';
try {
 const P=await open(b,{play:false,w:1000,h:760,settings:{voice:false,sound:false,online:false}});
 try {
  await P.page.evaluate(()=>{window.__svFilmRate=1e-8;document.querySelectorAll('.screen').forEach(e=>e.remove());const stage=document.createElement('div');stage.id='pose-stage';stage.style.cssText='position:fixed;inset:0;background:#ddd';document.body.append(stage);});
  const results=[];
  for(const id of ['elephantmice','crow']){
   await P.page.evaluate(async id=>{const {createFilm}=await import(String('/js/film.js'));const {taleFilm}=await import(String('/js/content/talefilms.js'));const f=createFilm(document.querySelector('#pose-stage'),await taleFilm(id));f.onSay=async()=>{};},id);
   for(const k of id==='crow'?[1,4,5]:[1,2,3,4,5]){
    const info=await P.page.evaluate(async k=>{
     const {filmNow}=await import(String('/js/film.js'));const {THREE}=await import(String('/js/gfx.js'));const f=filmNow();void f.page(k);f.narrated();const p=f.now;const samples=[];
     for(let t=0;t<9;t+=.05){if(p.hold)p.release(false);p.tick(.05,t);await Promise.resolve();
      if(Math.round(t*20)%20===0){p.root.updateMatrixWorld(true);p.root.traverse(o=>{const r=o.userData.rig;if(r?.kind!=='elephant')return;const body=r.root.children[0],head=r.head.children[0];const a=new THREE.Box3().setFromObject(body),bb=new THREE.Box3().setFromObject(head);samples.push({time:t,headBodyOverlap:a.intersectsBox(bb),headPos:r.head.getWorldPosition(new THREE.Vector3()).toArray(),bodyBox:[a.min.toArray(),a.max.toArray()],headBox:[bb.min.toArray(),bb.max.toArray()]});});}
     }return {page:k+1,samples,objects:p.root.children.map(o=>({type:o.type,pos:o.position.toArray(),scale:o.scale.toArray(),rig:o.userData.rig?.kind})).filter(o=>o.rig||o.scale[0]===4)};
    },k);
    results.push({id,...info});await P.page.evaluate(()=>new Promise<void>(r=>requestAnimationFrame(()=>requestAnimationFrame(()=>r()))));await P.page.screenshot({path:`docs/story-pose-review-20261027/${output}-${id}-p${k+1}.png`});
   }
   await P.page.evaluate(async()=>{(await import(String('/js/film.js'))).filmNow().close();});
  }
  await fs.writeFile(`docs/story-pose-review-20261027/${output}.json`,JSON.stringify({results,errors:P.errors},null,2)+'\n');console.log(JSON.stringify({results:results.map(r=>({id:r.id,page:r.page,samples:r.samples.length,detached:r.samples.some(s=>!s.headBodyOverlap)})),errors:P.errors}));
 }finally{await P.ctx.close();}
}finally{await b.close();}
