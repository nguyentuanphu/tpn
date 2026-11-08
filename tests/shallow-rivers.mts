import assert from 'node:assert/strict';
import type {Browser} from 'playwright';
import {open,clear} from './harness.mts';
// (v1.08e water, owner 6 Nov 2026 AEDT: "all the rivers are too deep; make them shallow, cute and friendlier", pop-up:
// knee to waist deep, 0.4-0.8 m, children wade, nobody sinks or swims) was: a 1.25 m river bed with a continuous swimming
// channel deeper than 0.9 m. Now: (1) along every river the middle of the bed is 0.4-0.8 m below the water, with no gap;
// (2) nowhere in the whole valley (rivers, the lake, every pond, the sea) is the water deeper than 0.8 m; (3) no sudden drops:
// under the water, no step of 1 m along the bed goes down more than 0.75 m (a child walks up 1.1; the steepest
// today is 0.69, at Rottnest's shore; walking in and out of every water: `wading`).
export async function shallowRiversCheck(browser:Browser){
 const P=await open(browser,{w:900,h:640,settings:{voice:false,online:false}});
 try{await clear(P.page);
 const r=await P.page.evaluate(async()=>{
  const W=await import(String('/js/world.js')),M=await import(String('/js/content/map.js')),lo=M.WORLD.wade.min,hi=M.WORLD.wade.max;
  const rivers=W.RIVERS.map(r=>{let samples=0,min=Infinity,max=-Infinity;const bad=[];
   for(let i=0;i<r.pts.length-1;i++){const [ax,az]=r.pts[i],[bx,bz]=r.pts[i+1],length=Math.hypot(bx-ax,bz-az),n=Math.ceil(length);
    for(let k=0;k<=n;k++){const x=ax+(bx-ax)*k/n,z=az+(bz-az)*k/n;if(Math.abs(x)>W.HALF-1||Math.abs(z)>W.HALF-1)continue;
     const depth=W.WATER-W.heightAt(x,z);samples++;min=Math.min(min,depth);max=Math.max(max,depth);if(depth>hi+.03||depth<lo)bad.push({x,z,depth:+depth.toFixed(2)});
    }
   }return{id:r.id,samples,min,max,bad};
  });
  // the whole valley, every metre: the deepest water, and the steepest step where there is water or a bank
  const deep=[],steep=[];let wet=0;const H=W.HALF-2;
  for(let z=-H;z<=H;z+=1)for(let x=-H;x<=H;x+=1){const h=W.heightAt(x,z);if(h>=W.WATER+1)continue;if(h<W.WATER)wet++;
   if(W.WATER-h>.83&&deep.length<8)deep.push({x,z,depth:+(W.WATER-h).toFixed(2)});
   if(h>=W.WATER)continue;for(const [hx,hz] of [[x+1,z],[x,z+1]]){const h2=W.heightAt(hx,hz);if(h2<W.WATER&&Math.abs(h2-h)>.75&&steep.length<8)steep.push({x,z,rise:+Math.abs(h2-h).toFixed(2)});}}
  return{rivers,deep,steep,wet};
 });
 assert.ok(r.rivers.length>=5);for(const v of r.rivers){assert.ok(v.samples>5,v.id+' sampled');assert.deepEqual(v.bad,[],v.id+' stays 0.4-0.8 m deep along its middle: '+JSON.stringify(v.bad.slice(0,5)));}
 assert.ok(r.wet>2000,'the valley still has its water ('+r.wet+' m2)');
 assert.deepEqual(r.deep,[],'no water deeper than 0.8 m anywhere: '+JSON.stringify(r.deep));
 assert.deepEqual(r.steep,[],'no sudden drop in the water bed (0.75 m per metre at most): '+JSON.stringify(r.steep));
 assert.deepEqual(P.errors,[]);return r.rivers.length+' rivers 0.4-0.8 m deep along every in-world segment; '+r.wet+' m2 of water in the valley, none deeper than 0.8 m; no sudden drop in any bed (0.75 m per metre at most)';
 }finally{await P.ctx.close();}
}
