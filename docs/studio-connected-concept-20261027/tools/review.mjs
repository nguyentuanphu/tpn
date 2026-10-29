import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {launch} from '../../../tests/harness.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
fs.mkdirSync(path.join(root,'screenshots'),{recursive:true});
fs.rmSync(path.join(root,'browser-validation.json'),{force:true});
const sourceHashes=Object.fromEntries(['review.html','registry.json','tools/review.mjs'].map(file=>[file,createHash('sha256').update(fs.readFileSync(path.join(root,file))).digest('hex')]));
const browser=await launch(),errors=[],network=[],results=[];
try{
 for(const [device,width,height] of [['desktop',1440,1000],['tablet',820,1180],['phone',390,844]]){
  const page=await browser.newPage({viewport:{width,height},isMobile:device==='phone',hasTouch:device!=='desktop'});
  page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(/^https?:/.test(r.url()))network.push(r.url());});
  await page.goto(pathToFileURL(path.join(root,'review.html')).href);
  for(const view of ['graphs','people','connections','controls','data']){
   await page.locator(`[data-page="${view}"]`).click();
   assert.equal(await page.locator(`[data-view="${view}"]`).isVisible(),true);
   await page.evaluate(async()=>{await Promise.all([...document.images].map(i=>i.decode()));});
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false,device+' '+view+' page overflow');
   const screenshot=`screenshots/${view}-${device}.png`;
   await page.screenshot({path:path.join(root,screenshot),fullPage:true});
   results.push({device,view,width,height,screenshot,noPageOverflow:true});
  }
  await page.locator('#search').fill('voice.result');assert.ok(await page.locator('#fields tr').count()>0);
  assert.match(await page.locator('#fields').innerText(),/voice.result/);
  await page.locator('#lineage').selectOption('current_code_field');assert.ok(await page.locator('#fields tr').count()>0);
  await page.locator('#search').fill('no-such-field-in-this-registry');assert.equal(await page.locator('#fields tr').count(),0);assert.match(await page.locator('#result-count').innerText(),/0 matching/);
  await page.locator('[data-page="connections"]').click();await page.locator('#connection').selectOption('L13');assert.match(await page.locator('#connection-detail').innerText(),/Not implemented/);
  await page.locator('[data-page="controls"]').click();await page.locator('#control').selectOption('K09');assert.match(await page.locator('#control-detail').innerText(),/finance.write/);
  await page.locator('[data-notice]:visible').click();assert.match(await page.locator('#notice').innerText(),/Nothing is saved/);
  await page.locator('[data-page="graphs"]').click();await page.locator('#graph').selectOption('G17');assert.match(await page.locator('#graph-detail').innerText(),/Exact revision\/hash/);
  await page.getByText('Accessible table: data in the four sample charts',{exact:true}).click();assert.equal(await page.locator('[data-view="graphs"] details table').isVisible(),true);
  await page.close();
 }
 assert.deepEqual(errors,[]);assert.deepEqual(network,[]);
 fs.writeFileSync(path.join(root,'browser-validation.json'),JSON.stringify({passed:true,sourceHashes,scope:'Offline concept handbook only; fictional data; not application, database or physical-device validation',results,errors,externalRequests:network,interactions:['five-section navigation','graph definitions','connection inspection including proposed-only path','control permission/explanation','concept-only action notice','field and evidence-class search','empty search','accessible chart data table']},null,2)+'\n');
 console.log('PASS: 15 concept views, search/selectors/notice/table; no browser errors, external requests or page overflow.');
}finally{await browser.close();}
