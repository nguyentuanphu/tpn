// #355: repeated real close actions must release UI/game resources, rather than relying on a reload.
import fs from 'node:fs';
import type { Browser } from 'playwright';
import { open, clear, noWelcome } from './harness.mts';
export async function stabilityCheck(browser: Browser): Promise<string> {
  const P=await open(browser,{w:390,h:844,touch:true});
  let navigations=0;
  P.page.on('framenavigated',frame=>{if(frame===P.page.mainFrame())navigations++;});
  const cdp=await P.ctx.newCDPSession(P.page);await cdp.send('Performance.enable');
  try {
    await clear(P.page);await noWelcome(P.page);
    await P.page.evaluate(()=>{document.documentElement.dataset.r87ContextLoss='0';document.addEventListener('webglcontextlost',()=>{const d=document.documentElement.dataset;d.r87ContextLoss=String(Number(d.r87ContextLoss||0)+1);},true);});
    const closedGrownups=await P.page.evaluateHandle(()=>new Set<WeakRef<Element>>());
    const grownupsCycle=async(track=false)=>{
      await P.page.evaluate(async()=>{window.__sv.paused=true;(await import('../js/ui.js')).openGrownups(()=>{window.__sv.paused=false;});});await P.page.locator('.modal.grownups').waitFor();
      if(track)await P.page.locator('.modal.grownups').evaluate((element,refs)=>refs.add(new WeakRef(element)),closedGrownups);
      await P.page.locator('.modal.grownups .x').click();await P.page.waitForSelector('.modal.grownups',{state:'detached'});
    };
    const tabs=['map','bag','album','friend','passport','shop'];
    const windowCycle=async(tab:string)=>{
      await P.page.evaluate(tab=>window.__sv.openPad(0,tab),tab);await P.page.locator('.modal.pad').waitFor();
      await P.page.locator('.modal.pad .pad-head .x').click();await P.page.waitForSelector('.modal.pad',{state:'detached'});
    };
    // Warm the caches once. The measured loop then detects continued growth.
    for(const tab of tabs)await windowCycle(tab);await grownupsCycle();
    const snapshot=async()=>{
      await cdp.send('Runtime.discardConsoleEntries');await cdp.send('HeapProfiler.collectGarbage');const metrics=await cdp.send('Performance.getMetrics'),domCounters=await cdp.send('Memory.getDOMCounters');
      const ui=await P.page.evaluate(async()=>{const THREE=await import('../vendor/three.module.js'),R=window.__sv.renderer;if(!(R instanceof THREE.WebGLRenderer))throw Error('No renderer');const lazyStill=new Set<import('../vendor/three.module.js').BufferGeometry>();
        if('scene' in window.__sv && window.__sv.scene instanceof THREE.Scene) window.__sv.scene.traverse(o=>{if(!(o instanceof THREE.Mesh))return;for(let parent=o.parent;parent;parent=parent.parent)if(parent.userData.still){lazyStill.add(o.geometry);break;}});
        return {lazyStillGeometries:lazyStill.size,dom:document.querySelectorAll('*').length,canvases:document.querySelectorAll('canvas').length,geometries:R.info.memory.geometries,textures:R.info.memory.textures,programs:R.info.programs.length,contextLosses:Number(document.documentElement.dataset.r87ContextLoss||0)};});
      return {...ui,nodes:domCounters.nodes,heapMB:(metrics.metrics.find(m=>m.name==='JSHeapUsedSize')?.value||0)/1048576};
    };
    const before=await snapshot();
    for(let i=0;i<30;i++){if(i%2===0)await grownupsCycle(true);else await windowCycle(tabs[i%tabs.length]);}
    const ids=['pattern','counting','letters','numbers','shapes','colors','sorting','memory','clock','sums','opposites','animalsounds','phonics','oanquan','caro','hopscotch','tug','mrwolf','market','bunny'];
    for(const id of ids){await P.page.evaluate(id=>{void window.__sv.playGame(0,id,'replay');},id);await P.page.locator('.gl').waitFor();await P.page.waitForFunction(()=>!!document.querySelector('.gl-stage')?.children.length,null,{timeout:45000});await P.page.locator('.gl-x').click();await P.page.waitForSelector('.gl',{state:'detached'});}
    await P.page.waitForTimeout(1500);await clear(P.page);const after=await snapshot();
    await P.page.waitForTimeout(100);await cdp.send('HeapProfiler.collectGarbage');
    const retainedGrownups=await closedGrownups.evaluate(refs=>[...refs].filter(ref=>ref.deref()).length);
    const growth={lazyStillGeometries:after.lazyStillGeometries-before.lazyStillGeometries,nodes:after.nodes-before.nodes,heapMB:after.heapMB-before.heapMB,dom:after.dom-before.dom,canvases:after.canvases-before.canvases,geometries:after.geometries-before.geometries,textures:after.textures-before.textures,programs:after.programs-before.programs};
    const bad=[];if(retainedGrownups)bad.push(`${retainedGrownups} closed Grown-ups windows retained`);if(growth.nodes>1000)bad.push('retained DOM node growth over 1000');
    if(growth.heapMB>40)bad.push('heap growth over 40 MB');if(growth.dom>60)bad.push('DOM growth over 60');if(growth.canvases>0)bad.push('canvas retained');
    if(growth.geometries-Math.max(0,growth.lazyStillGeometries)>8||growth.textures>8||growth.programs>8)bad.push('GPU object growth over 8');
    if(after.contextLosses||navigations||P.errors.length)bad.push(JSON.stringify({contextLosses:after.contextLosses,navigations,errors:P.errors}));
    const result={windows:30,games:ids.length,before,after,growth,navigations,retainedGrownups,bad,note:'Chromium phone viewport, not physical iPhone. GPU figures are renderer object counts, not GPU bytes.'};
    fs.mkdirSync('../docs/r87/evidence',{recursive:true});fs.writeFileSync(process.env.SV_STABILITY_REPORT || '../docs/r87/evidence/stability.json',JSON.stringify(result,null,2)+'\n');
    if(bad.length)throw Error(JSON.stringify(result));return JSON.stringify({windows:30,games:ids.length,growth,contextLosses:after.contextLosses,navigations});
  } finally {await cdp.detach().catch(()=>{});await P.ctx.close();}
}
