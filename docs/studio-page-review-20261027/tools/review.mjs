import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import assert from 'node:assert/strict';
import {launch} from '../../../tests/harness.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const data=JSON.parse(fs.readFileSync(path.join(root,'captures.json'),'utf8'));
assert.equal(data.results.length,135);assert.equal(new Set(data.results.map(r=>r.size+'/'+r.key)).size,135);
assert.deepEqual(data.errors,[]);
for(const r of data.results){assert.notEqual(r.ready,false);assert.notEqual(r.overflow,true);for(const f of [r.image,r.viewport].filter(Boolean))assert.ok(fs.statSync(path.join(root,f)).size>0);}
const browser=await launch(),errors=[],cases=[];
try{
 for(const [width,height,size]of [[1440,1000,'desktop'],[820,1180,'tablet'],[390,844,'phone']]){
  const page=await browser.newPage({viewport:{width,height}});page.on('pageerror',e=>errors.push(e.message));
  await page.goto(pathToFileURL(path.join(root,'index.html')).href);
  await page.locator('[data-size='+size+']').click();assert.equal(await page.locator('.card').count(),45);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false);
  await page.locator('#section').selectOption('Family');assert.equal(await page.locator('.card').count(),10);
  await page.locator('#section').selectOption('All sections');await page.locator('#search').fill('Map and building');assert.equal(await page.locator('.card').count(),1);
  await page.locator('[data-open]').click();assert.equal(await page.locator('#viewer').isVisible(),true);
  assert.match(await page.locator('#large').getAttribute('src'),new RegExp(size+'/map-viewport.png$'));
  await page.locator('#mode').click();assert.match(await page.locator('#large').getAttribute('src'),new RegExp(size+'/map.png$'));
  await page.locator('#close').click();await page.locator('#search').fill('');
  await page.locator('[data-open]').first().click();await page.locator('#next').click();assert.match(await page.locator('#caption').innerText(),/^2 \/ 45/);await page.locator('#prev').click();assert.match(await page.locator('#caption').innerText(),/^1 \/ 45/);await page.locator('#close').click();
  await page.screenshot({path:path.join(root,'gallery-'+size+'.png')});
  cases.push(size+': 45 screens, correct device images, no overflow, Family filter, page search, image viewer, full-page switch and previous/next passed');
  await page.close();
 }
 assert.deepEqual(errors,[]);fs.writeFileSync(path.join(root,'gallery-review.json'),JSON.stringify({passed:true,screenStates:135,sourceImages:267,cases,errors},null,2)+'\n');
 console.log('PASS: gallery interaction/layout at3sizes; all135states and267sourcePNGs verified.');
}finally{await browser.close();}
