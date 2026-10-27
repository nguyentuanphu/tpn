// The whole valley on a real festival day: every drawn piece (place, roadside, house front, table) across all places.
// Two festivals at once (Tết and the first full moon) share places; nothing may stand on another piece or a string support.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { launch, open, clear } from './harness.mjs';
const browser=await launch();let result=null;
try {
 const P=await open(browser,{w:1280,h:800});await clear(P.page);
 result=await P.page.evaluate(async()=>{const G=__sv,C=(await import('/js/custom.js')).CUSTOM,wait=ms=>new Promise(r=>setTimeout(r,ms));
  for(let k=0;k<40&&!G.festivals.count('village','tet',4);k++){G.festivals.rebuild();await wait(300);}
  const ymd=(await import('/js/content/festival-visibility.js')).sydneyFestivalDate(),out=[];
  for(const ids of [['tet'],['tet','ramthang1'],['halloween']]){
   C.festivals={};C.releases={...(C.releases||{})};for(const id of ['tet','ramthang1','halloween'])delete C.releases['fest_'+id];
   for(const id of ids)C.releases['fest_'+id]={on:true,start:ymd,days:1};
   G.festivals.rebuild();await wait(800);
   const all=G.festivals.items(),solid=all.filter(q=>q.kind!=='string'),cells=new Map(),key=(x,z)=>Math.floor(x/2)+','+Math.floor(z/2),close=[];
   for(const q of solid){const [cx,cz]=key(q.x,q.z).split(',').map(Number);for(let dx=-1;dx<=1;dx++)for(let dz=-1;dz<=1;dz++)for(const p of cells.get((cx+dx)+','+(cz+dz))||[])if(Math.hypot(p.x-q.x,p.z-q.z)<1.79)close.push({a:p,b:q,d:+Math.hypot(p.x-q.x,p.z-q.z).toFixed(2)});const k=key(q.x,q.z);if(!cells.has(k))cells.set(k,[]);cells.get(k).push(q);}
   const kinds={};for(const q of all)kinds[q.kind]=(kinds[q.kind]||0)+1;
   const W=await import('/js/world.js'),china=Object.fromEntries(['string','piece'].map(k=>[k,all.filter(q=>q.kind===k&&Math.hypot(q.x-W.CHINA.x,q.z-W.CHINA.z)<W.CHINA.r+14).length]));out.push({china,ids,active:G.festivals.active().map(a=>a.F.id),kinds,overlaps:close.length,byKinds:close.reduce((m,c)=>{const k=[c.a.kind,c.b.kind].sort().join('+');m[k]=(m[k]||0)+1;return m;},{}),sample:close.slice(0,8),distribution:G.festivals.distribution()});
  }
  return out;});
 assert.deepEqual(P.errors,[]);await P.ctx.close();
}finally{await browser.close();fs.mkdirSync('out/owner-decor-world',{recursive:true});fs.writeFileSync('out/owner-decor-world/results.json',JSON.stringify(result,null,2)+'\n');}
for(const r of result){assert.ok(r.ids.every(id=>r.active.includes(id)),'Festival not active: '+JSON.stringify(r.active));assert.equal(r.overlaps,0,'Festival pieces share ground across the valley: '+JSON.stringify(r));const lost=r.distribution.filter(d=>d.unplaced&&!d.ring);assert.equal(lost.length,0,'Configured decoration amount not placed: '+JSON.stringify(lost));}
console.log(result.map(r=>`${r.ids.join('+')}: ${Object.entries(r.kinds).map(([k,n])=>k+' '+n).join(', ')}; 0 shared ground; ${r.distribution.filter(d=>!d.ring).length} street plans all placed (${r.distribution.filter(d=>!d.ring).reduce((a,d)=>a+d.relocated,0)} relocated); China Town ring ${r.china.piece} pieces/${r.china.string} strings; rings without streets: ${r.distribution.filter(d=>d.ring).map(d=>d.place+' '+d.festival+' '+d.placed+'/'+d.requested).join(', ')||'none'}`).join(' | '));
