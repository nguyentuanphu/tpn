// Two real festivals share village/Hoian during the Lunar New Year build-up.
// Inspect the actual placement builder against the real world's colliders, not screenshots or a road-mask-only count.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { launch, open, clear } from './harness.mts';
const browser=await launch(),rows=[];
try {
 const P=await open(browser,{w:1280,h:800});await clear(P.page);
 rows.push(...await P.page.evaluate(async()=>{const G=__sv,W=await import('/js/world.js'),{createDecor}=await import('/js/festdecor.js'),{FESTCAL}=await import('/js/content/festcal.js'),C=(await import('/js/custom.js')).CUSTOM;C.festivals={...(C.festivals||{}),tet:{deco:5},ramthang1:{deco:5}};
  const free=(x,z,r=1)=>W.heightAt(x,z)>W.WATER+.3&&!G.world.colliders.some(c=>c.r>0&&c.top==null&&Math.hypot(c.x-x,c.z-z)<c.r+r)&&!G.world.boxes.some(b=>x>b.x0-r&&x<b.x1+r&&z>b.z0-r&&z<b.z1+r),shape=()=>({parts:[],glows:[]}),out=[];
  for(const [firstAmount,secondAmount,firstStage,secondStage] of [[5,5,4,4],[5,5,4,1],[5,1,4,4],[3,7,4,4]]) {const key='village',place=W.VILLAGE;C.festivals={...C.festivals,tet:{deco:firstAmount},ramthang1:{deco:secondAmount}};const D=createDecor(free),poles=[],strand=(a,b)=>{poles.push({x:a[0],z:a[2]},{x:b[0],z:b[2]});return shape();};
   const ids=['tet','ramthang1'],stages=[firstStage,secondStage],all=ids.map((id,i)=>D.decorate(key,place,FESTCAL.find(f=>f.id===id),{stage:stages[i]},shape,strand,['#ff4f9a'],'flag',[])||[]),sets=all.map(items=>items.filter(i=>i.kind==='piece')),pieces=sets.flat(),amounts=ids.map((id,i)=>{const c=D.count(key,place,FESTCAL.find(f=>f.id===id),stages[i],[]);return {planned:c.pieces+c.strings+2*c.fronts,drawn:all[i].length};});
   const overlap=pieces.filter((p,i)=>pieces.slice(0,i).some(q=>Math.hypot(p.x-q.x,p.z-q.z)<1.79)),onSupport=pieces.filter(p=>poles.some(q=>Math.hypot(p.x-q.x,p.z-q.z)<1.79));out.push({key,firstAmount,secondAmount,stages,amounts,counts:sets.map(s=>s.length),overlap:overlap.map(p=>({x:p.x,z:p.z})),onSupport:onSupport.map(p=>({x:p.x,z:p.z}))});}return out;}));
 for(const r of rows){assert.ok(r.amounts.every(a=>a.planned===a.drawn),'Keep the configured decoration amount while redistributing overlaps: '+JSON.stringify(r.amounts));assert.ok(r.counts.every(n=>n>0),'Both real festival plans must be present');assert.equal(r.onSupport.length,0,'Festival pieces must not overlap bunting supports: '+JSON.stringify(r));assert.equal(r.overlap.length,0,'Festival pieces must not occupy the same ground: '+JSON.stringify(r));}
 assert.deepEqual(P.errors,[]);await P.ctx.close();
}finally{await browser.close();fs.mkdirSync('out/owner-decor-overlap',{recursive:true});fs.writeFileSync('out/owner-decor-overlap/results.json',JSON.stringify(rows,null,2)+'\n');}
console.log(JSON.stringify(rows));
