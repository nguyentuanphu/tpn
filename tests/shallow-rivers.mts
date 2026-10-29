import assert from 'node:assert/strict';
import type {Browser} from 'playwright';
import {open,clear} from './harness.mjs';
export async function shallowRiversCheck(browser:Browser){
 const P=await open(browser,{w:900,h:640,settings:{voice:false,online:false}});
 try{await clear(P.page);
 const rows=await P.page.evaluate(async()=>{
  const W=await import(String('/js/world.js')),M=await import(String('/js/content/map.js'));
  return W.RIVERS.map(r=>{let samples=0,min=Infinity,max=-Infinity;const bad=[];
   for(let i=0;i<r.pts.length-1;i++){const [ax,az]=r.pts[i],[bx,bz]=r.pts[i+1],length=Math.hypot(bx-ax,bz-az),n=Math.ceil(length);
    for(let k=0;k<=n;k++){const x=ax+(bx-ax)*k/n,z=az+(bz-az)*k/n;if(Math.abs(x)>W.HALF-1||Math.abs(z)>W.HALF-1)continue;
     const depth=W.WATER-W.heightAt(x,z);samples++;min=Math.min(min,depth);max=Math.max(max,depth);if(depth>M.WORLD.riverDepth+.03||depth<.91)bad.push({x,z,depth});
    }
   }return{id:r.id,samples,min,max,bad};
  });
 });
 assert.ok(rows.length>=5);for(const r of rows){assert.ok(r.samples>5,r.id+' sampled');assert.deepEqual(r.bad,[],r.id+' stays shallow with a continuous swimming channel: '+JSON.stringify(r.bad.slice(0,5)));}
 assert.deepEqual(P.errors,[]);return rows.length+' rivers sampled along every in-world segment: shallow 1.25m bed, continuous >0.9m swimming channel; bridges/boats/underpass checks separately cover transport';
 }finally{await P.ctx.close();}
}
