import assert from 'node:assert/strict';
import fs from 'node:fs';
import {URL} from './harness.mjs';
const folder='../docs/studio-content-website-20261029';
export async function contentWebsiteCheck(browser){
 const results=[];
 for(const [width,height]of [[390,844],[820,1180],[1440,900],[844,390]]){
  const context=await browser.newContext({viewport:{width,height}}),page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  try{
   await page.goto(URL+'home/#art-nonla');await page.evaluate(()=>document.fonts.ready);
   assert.equal(await page.locator('.quick-nav>a').count(),4);assert.equal(await page.locator('#art-guide details').count(),22);
   await page.waitForFunction(()=>document.querySelector('#art-nonla').open&&!document.querySelector('.learn-page').hidden);
   for(const lang of ['en','vi']){
    if(lang==='vi')await page.locator('#language-button').click();
    assert.equal(await page.locator('html').getAttribute('lang'),lang);
    assert.equal(await page.locator('#art-guide svg').count(),22);
    assert.ok((await page.locator('#art-guide').innerText()).includes(lang==='en'?'newest 12':'12 bức'));
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
    await page.locator('#art-nonla').scrollIntoViewIfNeeded();await page.screenshot({animations:'disabled',path:`${folder}/screenshots/website-art-${lang}-${width}.png`});
    assert.equal(await page.locator('#art-nonla').evaluate(e=>e.open),true);
    results.push({width,height,lang,fourDestinations:true,artItems:22,deepLink:true,noOverflow:true});
   }
   assert.deepEqual(errors,[]);
  }finally{await context.close();}
 }
 fs.writeFileSync(folder+'/website-validation.json',JSON.stringify(results,null,2)+'\n');return `${results.length} website language/layout/deep-link checks`;
}
