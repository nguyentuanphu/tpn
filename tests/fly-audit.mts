import assert from 'node:assert/strict';import fs from 'node:fs/promises';import type {Browser} from 'playwright';
import {open,clear,noWelcome} from './harness.mts';
// (v1.08b quality, owner 5 Nov 2026 AEDT: "when you fly to another destinations often it gets stuck behind a bus station,
// better to audit and check all"; "Including all public transport including electric car, xích lô's drop off to make
// sure it is in open area") every place a child is set down, landed on in the running game with the shared code
// (G.setDown, js/dropspot.ts): every map place and pin, every tap-to-talk and game place (the games' hosts, the shops, the
// bus stops, the shrines, the school), and the end of every bus ride. Each landing must be open ground, with a way out
// (4 of 8 directions), and the camera must see the child (a real ray through the scene, nothing big in the way).
// A failure lists the place; out/flyaudit/rows.json has every landing.
export async function flyAuditCheck(browser:Browser){
 const P=await open(browser,{w:1024,h:768,lang:'en',settings:{voice:false,sound:false,autoPack:false,online:false,countPlayers:false,busFares:true}});
 await fs.mkdir('out/flyaudit',{recursive:true});
 try{await clear(P.page);await noWelcome(P.page);
  const r=await P.page.evaluate(async()=>{
   const G=window.__sv,h=G.heroes[0],{THREE}=await import(String('/js/gfx.js')),D=await import(String('/js/dropspot.js'));
   G.paused=true;G.scene.updateMatrixWorld(true);
   const targets:{kind:string,id:string,x:number,z:number,land:[number,number],face:{x:number,z:number}|null}[]=[];
   // a flight (G.travel) lands beside its place at (x + 4.5, z + 1), facing it; G.landBy (games, villagers, shops) at (x + 1.8, z + 1.4)
   for(const p of G.PLACES||[])if(Number.isFinite(p.x))targets.push({kind:'place',id:p.id,x:p.x,z:p.z,land:[p.x+4.5,p.z+1],face:{x:p.x,z:p.z}});
   for(const it of G.interactables)if(Number.isFinite(it.x)&&(!it.visible||it.visible()))targets.push({kind:/^busstop_/.test(it.id)?'busstop':'tap',id:it.id,x:it.x,z:it.z,land:[it.x+1.8,it.z+1.4],face:{x:it.x,z:it.z}});
   // the end of a bus ride: beside the stop it was going to
   for(const [k,b] of (G.world.busStops||[]).entries())targets.push({kind:'busride',id:'stop'+k,x:b.x,z:b.z,land:[b.x+1.2,b.z+1.2],face:b.place?{x:b.place.x,z:b.place.z}:null});
   const mine=(o:any)=>{for(let n=o;n;n=n.parent)if(n===h.av.root)return true;return false;};
   const all=G.scene.children.filter((o:any)=>o.visible&&!o.isLight);
   const bad:string[]=[],rows:unknown[]=[];let covered=0;
   for(const t of targets){
    const d=G.setDown(h,t.land[0],t.land[1],t.face);
    const ways=D.waysOut(G.world,d.x,d.z),stand=D.standable(G.world,d.x,d.z);
    const head=new THREE.Vector3(d.x,h.pos.y+1.1,d.z),cam=new THREE.Vector3(d.x+Math.sin(d.camYaw)*h.camDist,h.pos.y+4,d.z+Math.cos(d.camYaw)*h.camDist);
    const dist=cam.distanceTo(head),ray=new THREE.Raycaster(cam,head.clone().sub(cam).normalize(),.1,dist-.4);
    const hit=ray.intersectObjects(all,true).find((x:any)=>x.object.isMesh&&x.object.visible&&!mine(x.object)&&!x.object.isSprite&&!(x.object.material?.transparent&&x.object.material.opacity<.5)&&(()=>{const b=new THREE.Box3().setFromObject(x.object),s=b.getSize(new THREE.Vector3());return Math.max(s.x,s.y,s.z)>1.2&&Math.max(s.x,s.z)<60;})());
    const moved=+Math.hypot(d.x-t.land[0],d.z-t.land[1]).toFixed(1);
    rows.push({...t,at:[+d.x.toFixed(1),+d.z.toFixed(1)],moved,ways,stand,ok:d.ok,hit:hit?(hit.object.name||hit.object.parent?.name||'mesh'):null});
    const why=[stand?'':'not open ground',ways>=D.WAYS_MIN?'':`only ${ways} ways out`,hit?`camera blocked by ${hit.object.name||'something big'}`:''].filter(Boolean);
    if(hit)covered++;
    if(why.length)bad.push(`${t.kind} ${t.id} (${Math.round(t.x)}, ${Math.round(t.z)}): ${why.join(', ')}`);
   }
   return {n:targets.length,kinds:[...new Set(targets.map(t=>t.kind))].map(k=>k+' '+targets.filter(t=>t.kind===k).length),bad,rows,covered};});
  await fs.writeFile('out/flyaudit/rows.json',JSON.stringify(r.rows,null,1));
  assert.deepEqual(r.bad,[],'landings that are not open ground, have no way out or no clear view');assert.deepEqual(P.errors,[]);
  return `${r.n} landings (${r.kinds.join(', ')}): every one on open ground, at least 4 ways out, the camera's view of the child clear`;
 }finally{await P.ctx.close();}
}
