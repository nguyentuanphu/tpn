import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { open, clear } from './harness.mjs';
import type { Browser } from 'playwright';

export async function bridgeUnderpassCheck(browser: Browser) {
 const P = await open(browser, {w:900,h:640}); await clear(P.page);
 try {
  const results = await P.page.evaluate(async () => {
   const G=window.__sv as unknown as import('../js/main.js').SvMain, W=await import(String('/js/world.js')); await G.solidsReady;
   const rows=[];
   for(const B of W.BRIDGES){
    const at=(u:number,v:number)=>B.axis==='z'?{x:B.c+v,z:u}:{x:u,z:B.c+v};
    const candidates=[];
    for(let u=B.a0;u<=B.a1;u+=.25){
     const points=[];for(let v=-B.w/2-2;v<=B.w/2+2;v+=.2)points.push(at(u,v));
     if(points.some(p=>W.heightAt(p.x,p.z)>=W.WATER-.9))continue;
     const blocked=points.filter(p=>{const q={...p,y:W.WATER-.55};G.world.collide(q,.45);return Math.hypot(q.x-p.x,q.z-p.z)>.01;});
     candidates.push({u,blocked:blocked.length});
    }
    const passage=candidates.find(c=>!c.blocked),center=at(passage?.u??(B.a0+B.a1)/2,0);
    const h=G.heroes[0];let swims=false,arrived=false;
    if(passage){
     G.paused=true;const start=at(passage.u,-B.w/2-2),end=at(passage.u,B.w/2+2);
     h.carry=null;h.riding=null;h.camYaw=0;h.steerYaw=0;h.stamina=h.staminaMax;h.place(start.x,start.z,W.WATER-.55);
     const pad={mx:B.axis==='z'?1:0,mz:B.axis==='z'?0:-1,cdx:0,cdy:0,jump:()=>false,act:()=>false,run:false};
     for(let i=0;i<500;i++){h.update(1/30,pad,i/30,G);swims ||= h.state==='swim';if(Math.hypot(h.pos.x-end.x,h.pos.z-end.z)<.4){arrived=true;break;}}
    }
    const rail={...at(passage?.u??(B.a0+B.a1)/2,B.w/2),y:B.h+.1},beforeRail={...rail};G.world.collide(rail,.45);const deckRailBlocks=Math.hypot(rail.x-beforeRail.x,rail.z-beforeRail.z)>.01;
    rows.push({deckRailBlocks,id:B.id,passage:passage?.u??null,blockedPaths:candidates.filter(c=>c.blocked).length,swims,arrived,underGround:G.world.groundAt(center.x,center.z,W.WATER),deck:G.world.groundAt(center.x,center.z,B.h+1)});
   }
   return rows;
  });
  await fs.mkdir('out/underpass',{recursive:true});await fs.writeFile('out/underpass/results.json',JSON.stringify(results,null,2));
  assert.deepEqual(results.filter(r=>!r.swims||!r.arrived||r.passage===null||!r.deckRailBlocks),[],JSON.stringify(results.filter(r=>!r.swims||!r.arrived||r.passage===null||!r.deckRailBlocks)));
  const shots=process.env.SV_UNDERPASS_SHOTS || 'out/underpass';await fs.mkdir(shots,{recursive:true});
  for(const [device,w,h]of[['phone',390,844],['tablet',820,1180],['computer',1280,800]]as const)for(const lang of['en','vi']){
   await P.page.setViewportSize({width:w,height:h});await P.page.evaluate(async({lang,passage})=>{
    const G=window.__sv as unknown as import('../js/main.js').SvMain,W=await import(String('/js/world.js')),S=await import(String('/js/state.js'));
    S.settings.lang=lang;(await import(String('/js/i18n.js'))).applyLang();
    const B=W.BRIDGES.find(b=>b.id==='princes'),x=B.axis==='z'?B.c:passage,z=B.axis==='z'?passage:B.c,hero=G.heroes[0];
    hero.place(x,z,W.WATER-.55);hero.update(1/30,{mx:0,mz:0,cdx:0,cdy:0,jump:()=>false,act:()=>false,run:false},performance.now()/1000,G);
    G.renderer.setPixelRatio(1);hero.cam.position.set(x+9,2.4,z+3);hero.cam.lookAt(x,.25,z);hero.cam.updateProjectionMatrix();
   },{lang,passage:results.find(r=>r.id==='princes')!.passage});
   await P.page.waitForTimeout(300);await P.page.screenshot({path:`${shots}/${device}-${lang}-underpass.png`});
  }
  assert.deepEqual(P.errors,[]); return `${results.length} bridge water crossings remain open below their walkable decks`;
 }finally{await P.ctx.close();}
}
