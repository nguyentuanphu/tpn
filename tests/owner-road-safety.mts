// Physical road signs: placement, real canvas/touch taps, bilingual guidance and reachable child controls.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { launch, open, clear } from './harness.mts';
const browser=await launch(),rows=[];fs.mkdirSync('out/owner-road-safety',{recursive:true});
try {
 for(const [w,h,lang,touch] of [[390,844,'en',true],[320,640,'vi',true],[820,1180,'en',true],[1280,800,'en',false],[844,390,'vi',true]]) {
  const P=await open(browser,{w,h,lang,touch,settings:{voice:false,music:false,sound:false,autoPack:false,camMode:'free'}});await clear(P.page);
  const plan=await P.page.evaluate(()=>__sv.crossings);assert.ok(plan,'Crossing warnings must be built');if(plan.missing.length){const spots=await P.page.evaluate(async()=>{const G=__sv,W=await import('/js/world.js'),c=G.crossings.list.find(c=>c.id==='aussie'),rows=[];for(let x=c.x-10;x<=c.x+10;x+=.2)for(let z=c.z+4.6;z<=c.z+7;z+=.4){if(![[0,0],[-1.25,0],[1.25,0],[0,-.25],[0,.25]].every(([dx,dz])=>G.goodSpot(x+dx,z+dz)))continue;const d=W.roadDist(x,z);if(d.road&&d.d<=d.road.w/2+.5)continue;const near=G.interactables.map(i=>({id:i.id,bubble:!!i.bubble,d:Math.hypot(i.x-x,i.z-z)})).sort((a,b)=>a.d-b.d).slice(0,3);rows.push({x,z,near});}return rows;});fs.writeFileSync('out/owner-road-safety/placement-probe.json',JSON.stringify(spots,null,2));}assert.deepEqual(plan.missing,[],'Missing safe sign placement: '+JSON.stringify(await P.page.evaluate(()=>({plan:__sv.crossings,near:__sv.interactables.filter(i=>i.bubble&&i.x< -80&&i.x> -125&&i.z< -45&&i.z> -85).map(i=>({id:i.id,x:i.x,z:i.z}))}))));assert.equal(plan.list.length,2);
  for(const crossing of plan.list){assert.equal(crossing.signs.length,2);for(const sign of crossing.signs){
   assert.ok(Math.abs(sign.x-crossing.x)>=1.79,'Keep the central3.2m crossing approach clear of posts');
   assert.ok(Math.abs(sign.z-crossing.z)>=crossing.halfRoad+1,'A warning must stand off the carriageway');
   const approach=await P.page.evaluate(async({crossing,sign})=>{
    const G=__sv,W=await import('/js/world.js'),h=G.heroes[0];let at=null;
    for(const dz of [1,1.3,.7])for(const dx of [0,-1,1,-1.5,1.5]){const x=sign.x+dx,z=sign.z-sign.side*dz,d=W.roadDist(x,z);if(Math.hypot(dx,dz)<2.3&&Math.abs(z-crossing.z)>crossing.halfRoad+.15&&G.goodSpot(x,z)&&(!d.road||d.d>d.road.w/2)){at={x,z};break;}if(at)break;}
    if(!at)return null;G.paused=false;h.goal=null;h.speed=0;h.camYaw=Math.atan2(at.x-sign.x,at.z-sign.z);h.camPitch=innerHeight<500?-.08:.12;h.camDist=5.8;h.view='follow';h.manualCamT=1000000;h.place(at.x,at.z);return at;
   },{crossing,sign});assert.ok(approach,'Sign needs a dry, unblocked approach beside the road: '+JSON.stringify(sign));
   await P.page.waitForTimeout(1400);await clear(P.page);await P.page.waitForTimeout(300);
   const target=await P.page.evaluate(async id=>{const G=__sv,h=G.heroes[0],{THREE}=await import('/js/gfx.js');G.scene.updateMatrixWorld(true);const panels=G.tapTargets.filter(o=>o.userData.it?.id===id&&o.geometry?.type==='PlaneGeometry').map(o=>({o,p:o.getWorldPosition(new THREE.Vector3())})).sort((a,b)=>b.p.y-a.p.y||a.p.distanceTo(h.cam.position)-b.p.distanceTo(h.cam.position));const candidates=panels.map(board=>{const p=board.p.clone().project(h.cam),ray=new THREE.Raycaster();ray.setFromCamera(new THREE.Vector2(p.x,p.y),h.cam);const hits=ray.intersectObjects([...(G.bubbleIcons||[]),...G.tapTargets],false).filter(v=>v.object.visible).slice(0,5).map(v=>({id:v.object.userData.it?.id,d:v.distance,type:v.object.type}));const x=(p.x+1)/2*innerWidth,y=(1-p.y)/2*innerHeight,n=document.elementFromPoint(x,y);return {x,y,boardY:board.p.y,hits,front:p.z<1,inViewport:Math.abs(p.x)<.95&&Math.abs(p.y)<.95,canvas:n===G.renderer.domElement,hit:n?.className||n?.tagName};});return candidates.find(c=>c.front&&c.inViewport&&c.canvas&&c.hits[0]?.id===id)||{candidates};},sign.interaction);
   assert.ok(target?.front&&target.inViewport&&target.canvas&&target.hits[0]?.id===sign.interaction,'Real sign tap is hidden or covered: '+JSON.stringify({sign,target}));
   if(touch)await P.page.touchscreen.tap(target.x,target.y);else await P.page.mouse.click(target.x,target.y);
   await P.page.waitForSelector('.dialog .dtext',{timeout:10000});
   const dialog=await P.page.evaluate(()=>{const m=document.querySelector('.dialog'),r=m.getBoundingClientRect(),n=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);return {text:m.textContent,button:{w:r.width,h:r.height},extraButtons:m.querySelectorAll('.dch').length,reachable:r.x>=0&&r.y>=0&&r.right<=innerWidth+1&&r.bottom<=innerHeight+1&&(n===m||m.contains(n))};});
   assert.match(dialog.text,lang==='vi'?/cả hai phía/:/both ways/);assert.match(dialog.text,lang==='vi'?/người lớn/:/grown-up/);assert.ok(dialog.extraButtons===0&&dialog.reachable&&dialog.button.w>=64&&dialog.button.h>=64,'R74 speech-box dismissal must remain reachable without an extra OK button: '+JSON.stringify(dialog));
   if(sign===crossing.signs[0])await P.page.screenshot({path:`out/owner-road-safety/${w}-${h}-${lang}-${crossing.id}-guidance.png`});
   await P.page.locator('.dialog .dtext').click();await P.page.waitForSelector('.dialog',{state:'detached'});rows.push({w,h,lang,crossing:crossing.id,side:sign.side,approach,target,dialog});
  }}
  // Real existing bus choices expose the shared under-5 action targets; no new warning OK button.
  await P.page.evaluate(()=>{const G=__sv,h=G.heroes[0],it=G.interactables.find(i=>/^ride_/.test(i.id)&&G.traffic.slots[+i.id.slice(5)].id==='bus');if(!it)throw Error('Missing real bus interaction');h.place(it.x+2,it.z);window.__roadBus=it.act(h,G);});
  await P.page.waitForSelector('.dialog .dch');const choices=await P.page.locator('.dialog .dch').evaluateAll(nodes=>nodes.map(n=>{const r=n.getBoundingClientRect();return {w:r.width,h:r.height};}));assert.ok(choices.length>=2&&choices.every(r=>r.w>=64&&r.h>=64),'Real under-5 bus choices need64px targets: '+JSON.stringify(choices));await P.page.locator('.dialog .dch').last().click();await P.page.evaluate(()=>window.__roadBus);await P.page.waitForSelector('.dialog',{state:'detached'});
  assert.deepEqual(P.errors,[]);await P.ctx.close();
 }
}finally{await browser.close();fs.writeFileSync('out/owner-road-safety/results.json',JSON.stringify(rows,null,2)+'\n');}
console.log(JSON.stringify({cases:rows.length,views:5,scope:'two existing crossings,20 actual sign taps; Chromium emulation, no physical-device or map-wide claim'}));
