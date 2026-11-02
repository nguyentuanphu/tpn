// Focused behavioural regression for point 49, run alone after captures.
// Usage: SV_URL=http://localhost:8766 node docs/owner-repair-20261014/check-films-49.mts
import fs from 'node:fs';
import assert from 'node:assert/strict';
import { launch, open } from '../../tests/harness.mts';
const phase=process.argv[2]||'after';
const b=await launch();
try {
 const P=await open(b,{play:false,url:process.env.SV_URL||(phase==='before'?'http://localhost:8765/':'http://localhost:8766/')});
 await P.page.evaluate(()=>{__sv.renderer.render=()=>{};});
 const result=await P.page.evaluate(async()=>{
  const {FILMS,GUIDES}=await import('/js/content/films.js'), L=await import('/js/content/talefilms.js'), F=await import('/js/film.js');
  const stage=document.createElement('div');stage.style.cssText='position:fixed;inset:0;width:800px;height:500px';document.body.append(stage);
  const scripts=Object.fromEntries(Object.entries(FILMS).filter(([id])=>!id.startsWith('lantern_')));
  for(const id of Object.keys(L.TALE_FILMS))scripts[id]=await L.taleFilm(id);
  const bad=[],pages=[],disposal=[],warnings=[],animals=[];
  const kit=await import('/js/content/films/kit.js');
  for(const [name,size] of [['mouse',.42],['lion',1.5],['tiger',1.45],['jackal',1.1]]){const a=kit[name]();for(let i=0;i<20;i++)a.userData.tick(.1,i*.1);const actual=a.userData.rig.root.scale.x;animals.push({name,expected:size,actual});if(Math.abs(actual-size)>1e-8)bad.push(name+': animation lost authored size');}
  const warn=console.warn;console.warn=(...a)=>{warnings.push(a.map(String).join(' '));warn(...a);};
  for(const [id,script] of Object.entries(scripts)){
   if(!script.look){bad.push(id+': missing art direction');continue;}
   const film=F.createFilm(stage,script,{});
   for(let k=0;k<script.pages.length;k++){
    film.page(k);const p=film.now;
    const themed=[];p.root.traverse(o=>{if(o.userData.storyScenery||o.userData.storyHouse)themed.push(o);});
    if(!p.look||p.look.setting!==(script.look.pages[k]?.setting||script.look.setting))bad.push(`${id} ${k}: wrong setting`);
    // The beginning of the Rainbow Serpent must stay an empty unformed landscape.
    if(!themed.length)bad.push(`${id} ${k}: no recognizable set detail`);
    let triangles=0;for(const o of themed)if(o.geometry)triangles+=(o.geometry.index?.count||o.geometry.attributes.position.count)/3;
    if(triangles>15000)bad.push(`${id} ${k}: ${triangles} dressing triangles`);
    p.light(.01,.01);const scene=p.root.parent;
    if(scene.children.find(x=>x.isHemisphereLight).intensity<1.1)bad.push(id+': night faces too dim');
    for(const o of themed){let freed=false;o.geometry?.addEventListener('dispose',()=>{freed=true;});disposal.push(()=>!o.geometry||freed);}
    pages.push({id,page:k+1,setting:p.look.setting,house:p.look.house,triangles});
   }
   film.close();if(F.filmNow()||stage.querySelector('canvas'))bad.push(id+': renderer not closed');
  }
  // A guide still has the original lights and no story set dressing.
  const {THREE}=await import('/js/gfx.js');
  const guide=F.createFilm(stage,{pages:[S=>{S.sky('#7cc8f0','#e8f6ff');S.light(.01,.01);S.add(new THREE.Group());}]});
  guide.page(0);const p=guide.now,scene=p.root.parent;
  if(p.look||scene.children.find(x=>x.isHemisphereLight).intensity!==.65||scene.children.filter(x=>x.isDirectionalLight).length!==1)bad.push('guide appearance changed');
  guide.close();
  if(scripts.nian.look){const {settings}=await import('/js/state.js'),was=settings.calm;settings.calm=true;const quiet=F.createFilm(stage,{look:scripts.nian.look,pages:[S=>S.sky('#141a44','#34406e')]});quiet.page(0);if(quiet.now.tickers.length)bad.push('new scenery moves in Calm');quiet.close();settings.calm=was;}
  if(disposal.some(f=>!f()))bad.push('story scenery not disposed');
  console.warn=warn;stage.remove();
  return {stories:Object.keys(scripts).length,pages,animals,bad,warnings,disposed:disposal.length,guides:Object.keys(GUIDES).length};
 });
 fs.writeFileSync(`docs/owner-repair-20261014/evidence/films-49-${phase}/focused-result.json`,JSON.stringify(result,null,2)+'\n');
 assert.equal(result.stories,38);assert.deepEqual(result.bad,[]);assert.equal(result.pages.length,221);assert.deepEqual(result.warnings,[]);assert.deepEqual(P.errors,[]);
 console.log(`PASS: ${result.stories} tales, ${result.pages.length} pages, scenery disposal, readable night light, unchanged guide lighting`);
}finally{await b.close();}
