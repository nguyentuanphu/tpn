import assert from 'node:assert/strict';
import fs from 'node:fs';
import { launch, open, clear } from './harness.mjs';
fs.mkdirSync('out/owner-round',{recursive:true});
const browser = await launch();
try {
 const P = await open(browser,{w:390,h:844,touch:true}); await clear(P.page);
 const result = await P.page.evaluate(async () => {
   const panel = document.createElement('div'); panel.className='modal'; panel.style.cssText='position:fixed;inset:120px 30px auto;height:100px;background:rgb(240,20,180);z-index:9000;color:white'; panel.textContent='Visible report panel'; document.body.appendChild(panel);
   // Capture the fully visible panel, not the initial opacity-zero frame of its CSS entry animation.
   await Promise.all(panel.getAnimations().map(animation=>animation.finished));
   const visiblePanel = document.elementFromPoint(70,160) === panel && getComputedStyle(panel).opacity === '1';
   const canvas=document.createElement('canvas'); canvas.width=390;canvas.height=844; const g=canvas.getContext('2d');g.fillStyle='rgb(20,180,80)';g.fillRect(0,0,390,844);
   const {captureScreen}=await import('/js/screencapture.js'); const full=await captureScreen(canvas), scene=await captureScreen(canvas,{sceneOnly:true});
   const pixels=async url=>{const img=new Image(); img.src=url; await img.decode(); const c=document.createElement('canvas'); c.width=img.width;c.height=img.height;const x=c.getContext('2d');x.drawImage(img,0,0);return {pixel:[...x.getImageData(70,160,1,1).data],width:c.width,height:c.height};};
   return {visiblePanel,full, scene,fullSample:await pixels(full),sceneSample:await pixels(scene)};
 });
 assert.ok(result.visiblePanel, 'The synthetic report panel must actually cover the sampled pixel before capture');
 fs.writeFileSync('out/owner-round/composed-report.jpg',Buffer.from(result.full.split(',')[1],'base64'));
 assert.ok(result.fullSample.pixel[0]>180 && result.fullSample.pixel[2]>100 && result.fullSample.pixel[1]<90,JSON.stringify(result.fullSample));
 assert.ok(result.sceneSample.pixel[1]>140 && result.sceneSample.pixel[0]<80,JSON.stringify(result.sceneSample));

 assert.deepEqual(P.errors,[]); console.log('PASS: composed report includes the visible panel; scene-only capture excludes it');
} finally {await browser.close();}
