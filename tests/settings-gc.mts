import fs from 'node:fs';
import type { Browser } from 'playwright';
import { open, clear, noWelcome } from './harness.mts';
export async function settingsGcCheck(browser: Browser): Promise<string> {
  const P=await open(browser,{w:390,h:844,touch:true});
  try {
    await clear(P.page);await noWelcome(P.page);
    const refs=await P.page.evaluateHandle(()=>new Set<WeakRef<Element>>());
    for(let i=0;i<3;i++){
      await P.page.evaluate(async()=>{await (await import('../js/ui.js')).openGrownups(()=>{});});
      await P.page.locator('.modal.grownups').waitFor();
      await P.page.locator('.modal.grownups').evaluate((node,refs)=>{refs.add(new WeakRef(node));},refs);
      await P.page.locator('.modal.grownups .x').click();await P.page.waitForSelector('.modal.grownups',{state:'detached'});
    }
    // Resume with a different real control so Chromium's last-interacted-element cache no longer owns a settings button.
    await P.page.evaluate(()=>{window.__sv.paused=false;window.__sv.openPad(0,'map');});await P.page.locator('.modal.pad').waitFor();
    await P.page.locator('.modal.pad .pad-head .x').click();await P.page.locator('.modal.pad').waitFor({state:'detached'});
    const cdp=await P.ctx.newCDPSession(P.page);await P.page.waitForTimeout(16000);await cdp.send('Runtime.discardConsoleEntries');await cdp.send('HeapProfiler.collectGarbage');await P.page.waitForTimeout(100);await cdp.send('HeapProfiler.collectGarbage');
    const sources=await P.page.evaluate(async()=>({install:(await import('../js/install.js')).installButton.toString().includes('WeakRef'),voice:(await import('../js/voice.js')).onVoices.toString().includes('delete'),modal:(await import('../js/popups.js')).modal.toString().includes('sv-modal-close')}));
    const retained=await refs.evaluate(refs=>[...refs].filter(ref=>ref.deref()).length);
    if(process.env.SV_HEAP_SNAPSHOT){const parts:string[]=[];cdp.on('HeapProfiler.addHeapSnapshotChunk',({chunk})=>parts.push(chunk));await cdp.send('HeapProfiler.takeHeapSnapshot',{reportProgress:false});fs.writeFileSync(process.env.SV_HEAP_SNAPSHOT,parts.join(''));}
    await cdp.detach();
    if(retained)throw Error(`${retained}/3 closed settings windows retained after GC: ${JSON.stringify(sources)}`);
    if(P.errors.length)throw Error(P.errors.join(' | '));return 'three closed settings windows collected; no stale voice/window callbacks';
  } finally {await P.ctx.close();}
}
