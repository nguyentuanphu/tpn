import assert from 'node:assert/strict';
import type {Browser} from 'playwright';
import {open,clear,noWelcome} from './harness.mts';
// (v1.08e water, owner 6 Nov 2026 AEDT: "all the rivers are too deep; make them shallow, cute and friendlier", pop-up:
// knee to waist deep, 0.4-0.8 m, children wade through and splash, nobody sinks or swims underwater) a child walks from the
// bank into every river, the lake, every pond and the sea (by Hạ Long, the Reef, Rottnest and Tasmania), and back out:
// the water stays at knee to waist height (never over 0.8 m, at least 0.3 m somewhere on the way), the child wades on the bed
// (never swims, never sinks under it), splash rings appear, the camera stays above the water, and the child is back on dry land.
export async function wadingCheck(browser:Browser){
 const P=await open(browser,{w:900,h:640,settings:{voice:false,sound:false,online:false,autoPack:false,countPlayers:false}});
 try{await clear(P.page);await noWelcome(P.page);
 await P.page.waitForFunction(()=>!!(window as any).__sv?.world?.splash,null,{timeout:60000});
 const rows=await P.page.evaluate(async()=>{
  const G=(window as any).__sv,W=await import(String('/js/world.js')),h=G.heroes[0],out=[];
  const dry=(x:number,z:number)=>W.heightAt(x,z)>W.WATER+.15;
  // the waters: each river by the middle of its middle piece (moved along it away from any bridge), the lake, each pond and the sea
  const waters:[string,number[][],number][]=[];
  // (a river: spots every 12 m along it, away from bridges and the map's edge; the first with a clear way in is walked)
  for(const R of W.RIVERS){const spots=[];for(let i=0;i<R.pts.length-1;i++){const [ax,az]=R.pts[i],[bx,bz]=R.pts[i+1],L=Math.hypot(bx-ax,bz-az);
    for(let t=6;t<L-3;t+=12){const x=ax+(bx-ax)*t/L,z=az+(bz-az)*t/L;if(Math.abs(x)<W.HALF-12&&Math.abs(z)<W.HALF-12&&!W.bridgeAt(x,z,12)&&!dry(x,z))spots.push([x,z]);}}
   const mid=Math.floor(spots.length/2);spots.sort((p,q)=>Math.abs(spots.indexOf(p)-mid)-Math.abs(spots.indexOf(q)-mid));waters.push([R.id,spots,0]);}
  waters.push(['lake',[[W.LAKE.x,W.LAKE.z]],5]);for(const Q of W.PONDS)waters.push([Q.id,[[Q.x,Q.z]],4]);
  waters.push(['sea (Hạ Long)',[[221,205]],5],['sea (the Reef)',[[-58,200]],5],['sea (Rottnest)',[[-232,222]],5],['sea (Tasmania)',[[-170,222]],5]);
  const pad={mx:0,mz:0,cdx:0,cdy:0,jump:()=>false,act:()=>false,run:false};G.paused=true;let rings=false;
  for(const [id,spots,inward] of waters){
   // the nearest bank whose way in is clear (no wall pushes the child), a gentle one first; a steep bank (Hồ Gươm's, the
   // Hội An canal's quay) the child climbs out of, as everywhere in the valley
   let pick=null;
   for(const [ix,iz] of spots.slice(0,12)){if(pick)break;
   for(let k=0;k<16;k++){const a=k*Math.PI/8,ux=Math.cos(a),uz=Math.sin(a);let d=0;while(d<8&&dry(ix+ux*d,iz+uz*d))d+=.5;/* (past an island) */const d0=d;while(d<40&&!dry(ix+ux*d,iz+uz*d))d+=.5;if(d>=40||d-d0<1)continue;
    const back=Math.max(d0,d-(inward||d)),cx=ix+ux*back,cz=iz+uz*back,sx=ix+ux*(d+2),sz=iz+uz*(d+2);let okWay=true,climb=false,prev=W.heightAt(sx,sz);
    for(let t=0;t<=1.001&&okWay;t+=.05){const x=sx+(cx-sx)*t,z=sz+(cz-sz)*t,g=G.world.groundAt(x,z,W.heightAt(x,z)+.5),q={x,z,y:g};G.world.collide(q,.45);
     if(Math.hypot(q.x-x,q.z-z)>.01||g>W.heightAt(x,z)+.3)okWay=false;if(Math.abs(g-prev)>.5)climb=true;prev=g;}
    if(okWay&&(!pick||(pick.climb&&!climb)||(pick.climb===climb&&d<pick.d)))pick={d,cx,cz,sx,sz,climb};}}
   if(!pick){out.push({id,bad:'no clear way in from any bank'});continue;}
   h.carry=null;h.riding=null;h.stamina=h.staminaMax;h.place(pick.sx,pick.sz);
   let maxDepth=0,swims=false,sinks=false,camLow=99,wades=false,reached=false,back=false;
   for(const [gx,gz,leg] of [[pick.cx,pick.cz,'in'],[pick.sx,pick.sz,'out']] as const){h.goal={x:gx,z:gz};h.goalT=0;
    for(let i=0;i<900;i++){h.update(1/30,pad,i/30,G);
     const g=W.heightAt(h.pos.x,h.pos.z);if(h.onGround&&g<W.WATER)maxDepth=Math.max(maxDepth,W.WATER-h.pos.y);
     swims ||= h.state==='swim';sinks ||= h.pos.y<G.world.groundAt(h.pos.x,h.pos.z,h.pos.y+.5)-.05;wades ||= (h.wading||0)>.1;rings ||= G.wading?.rings.visible;
     if(i>15)camLow=Math.min(camLow,h.cam.position.y-W.WATER);
     if(Math.hypot(h.pos.x-gx,h.pos.z-gz)<1){if(leg==='in')reached=true;else back=dry(h.pos.x,h.pos.z);break;}}}
   out.push({id,climb:pick.climb,at:[+pick.cx.toFixed(0),+pick.cz.toFixed(0)],maxDepth:+maxDepth.toFixed(2),swims,sinks,wades,reached,back,camLow:+camLow.toFixed(2)});
  }
  G.paused=false;return {out,rings};
 });
 // (#797, tester on iPhone v1.06, owner 6 Nov 2026 AEDT: "stuck, cannot walk up to the decorations in the water" at Làng Sen
 // (232, -12)) every festival decoration stands where a child can walk up to it: none past the valley's edge (where pots
 // and lamps stood over the sea beyond the drawn ground), and from (232, -12) the child walks up to each one nearby
 const deco=await P.page.evaluate(async()=>{
  const G=(window as any).__sv,W=await import(String('/js/world.js')),C=(await import(String('/js/custom.js'))).CUSTOM,h=G.heroes[0],wait=(ms:number)=>new Promise(r=>setTimeout(r,ms));
  const ymd=(await import(String('/js/content/festival-visibility.js'))).sydneyFestivalDate(),keep=C.releases;
  for(let k=0;k<40&&!G.festivals.count('village','tet',4);k++){G.festivals.rebuild();await wait(300);}
  const out:any={past:[],far:[],near:0,festivals:[]};
  for(const id of ['tet','midautumn','quockhanh']){C.releases={...(keep||{}),['fest_'+id]:{on:true,start:ymd,days:1}};G.festivals.rebuild();await wait(300);
   out.festivals.push(id);const all=G.festivals.items();
   const edge=W.EDGE??W.HALF-8;for(const q of all)if(Math.abs(q.x)>edge||Math.abs(q.z)>edge)out.past.push([id,+q.x.toFixed(1),+q.z.toFixed(1),q.kind]);
   const pad={mx:0,mz:0,cdx:0,cdy:0,jump:()=>false,act:()=>false,run:false};G.paused=true;
   for(const q of all.filter((q:any)=>q.kind!=='string'&&Math.hypot(q.x-232,q.z+12)<12)){out.near++;
    h.carry=null;h.riding=null;h.place(232,-12);h.goal={x:q.x,z:q.z};h.goalT=0;let best=99;
    for(let i=0;i<450;i++){h.update(1/30,pad,i/30,G);best=Math.min(best,Math.hypot(h.pos.x-q.x,h.pos.z-q.z));if(best<.8)break;}
    if(best>1.2)out.far.push([id,+q.x.toFixed(1),+q.z.toFixed(1),+best.toFixed(2)]);}
   G.paused=false;}
  C.releases=keep;G.festivals.rebuild();return out;});
 assert.deepEqual(deco.past,[],'festival decorations past the valley edge, where no child can reach them (#797): '+JSON.stringify(deco.past.slice(0,12)));
 assert.ok(deco.near>=3,'festival decorations near (232, -12) to walk up to: '+deco.near);
 assert.deepEqual(deco.far,[],'from (232, -12) the child cannot get within 1.2 m of these decorations (#797): '+JSON.stringify(deco.far));
 const bad=rows.out.map((r:any)=>r.bad?`${r.id}: ${r.bad}`:[!r.reached&&'did not get into the water',!r.back&&'did not get back out onto dry land',r.swims&&'swam',r.sinks&&'sank under the bed',!r.wades&&'did not wade',
  r.maxDepth>.83&&`water ${r.maxDepth} m deep (over 0.8)`,r.maxDepth<.3&&`water only ${r.maxDepth} m deep`,r.camLow<.2&&`the camera went down to ${r.camLow} m over the water`].filter(Boolean).map(w=>`${r.id}: ${w}`).join('; ')).filter(Boolean);
 assert.ok(rows.out.length>=20,'every water tried ('+rows.out.length+')');
 assert.deepEqual(bad,[],JSON.stringify(rows.out.filter((r:any)=>r.bad||!r.reached||!r.back||r.swims||r.sinks||!r.wades||r.maxDepth>.83||r.maxDepth<.3||r.camLow<.2)));
 assert.ok(rows.rings,'splash rings appear round a wading child');
 assert.deepEqual(P.errors,[]);
 const deep=Math.max(...rows.out.map((r:any)=>r.maxDepth)),low=Math.min(...rows.out.map((r:any)=>r.camLow));
 const climbs=rows.out.filter((r:any)=>r.climb).map((r:any)=>r.id);
 return `${deco.festivals.join(', ')}: no decoration past the valley edge, the child walks up to all ${deco.near} near Làng Sen (232, -12) (#797); ${rows.out.length} waters (every river, the lake, every pond, the sea by Hạ Long, the Reef, Rottnest and Tasmania): walked in and out, wading at most ${deep} m deep, never swimming or sinking, splash rings, the camera at least ${low} m over the water${climbs.length?`; a steep bank climbed at ${climbs.join(', ')}`:''}`;
 }finally{await P.ctx.close();}
}
