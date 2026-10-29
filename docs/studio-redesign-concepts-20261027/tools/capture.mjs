import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import assert from 'node:assert/strict';
import {launch} from '../../../tests/harness.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const browser=await launch(),errors=[],results=[];
try{
 for(const [device,width,height]of [['desktop',1440,1000],['phone',390,1000]]){
  const page=await browser.newPage({viewport:{width,height},isMobile:device==='phone',hasTouch:device==='phone'});
  page.on('pageerror',e=>errors.push(e.message));
  for(const concept of ['a','b','c']){
   await page.goto(pathToFileURL(path.join(root,'index.html')).href+'?concept='+concept);
   await page.waitForSelector('.shell',{timeout:5000}).catch(()=>{throw Error('Concept render failed: '+errors.join(' | '));});await page.waitForTimeout(100);
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false,device+' '+concept+' overflow');
   await page.screenshot({path:path.join(root,concept+'-'+device+'.png'),fullPage:device==='desktop'});
   results.push({concept,device,width,height,screenshot:concept+'-'+device+'.png',noHorizontalOverflow:true});
  }
  await page.locator('[data-concept=a]').click();assert.match(await page.locator('h1').innerText(),/Today/);
  await page.locator('.primary').first().click();assert.match(await page.locator('.toast').innerText(),/Nothing is saved or published/);
  if(device==='phone'){await page.locator('[data-concept=c]').click();await page.locator('.stage-select select').selectOption('Ready for review');assert.equal(await page.locator('.column.active').getAttribute('data-stage'),'Ready for review');}
  await page.close();
 }
 assert.deepEqual(errors,[]);
 fs.writeFileSync(path.join(root,'validation.json'),JSON.stringify({scope:'Design concepts only; illustrative data; no application or backend changes',passed:true,results,errors,interactions:['concept switching','concept-only action notice','phone stage selection']},null,2)+'\n');
 console.log('PASS: six concept views, no overflow/errors; preview interactions work.');
}finally{await browser.close();}
