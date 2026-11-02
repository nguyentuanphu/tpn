import { chromium } from '../../../tests/node_modules/playwright/index.mjs';
import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';
const root=path.resolve('docs/studio-revamp-master-20261027');
const browser=await chromium.launch({headless:true});const errors=[],checks=[];
try{
for(const [width,height,name] of [[390,844,'phone'],[820,1180,'tablet'],[1440,1000,'desktop']]){
const context=await browser.newContext({viewport:{width,height},deviceScaleFactor:1,isMobile:width===390,hasTouch:width<1000});const page=await context.newPage();
page.on('pageerror',e=>errors.push(e.message));page.on('requestfailed',r=>errors.push(r.url()+': '+r.failure()?.errorText));
page.on('request',r=>{assert.ok(r.url().startsWith('http://127.0.0.1:8899/'),'No external services or API requests');});
await page.goto('http://127.0.0.1:8899/concept.html');await page.evaluate(()=>document.fonts.ready);
for(const key of ['home','people','game','marketing','work','money','settings']){
 await page.goto('http://127.0.0.1:8899/concept.html#'+key);await page.waitForSelector('[data-page="'+key+'"]:visible');
 const m=await page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth,visible:[...document.querySelectorAll('[data-page]')].filter(e=>!e.hidden).length}));
 assert.ok(m.scroll<=m.width,`${key}/${name}: horizontal overflow`);assert.equal(m.visible,1);
 const captureStyle=await page.addStyleTag({content:'body{position:relative}nav{position:absolute;bottom:0}'});
 await page.screenshot({path:path.join(root,'images',`${key}-${name}.png`),fullPage:true});
 await captureStyle.evaluate(e=>e.remove());
 if(key==='home')await page.screenshot({path:path.join(root,'images',`home-${name}-viewport.png`)});
 if(key==='settings'){const toggle=page.locator('.toggle').first();assert.equal(await toggle.getAttribute('aria-checked'),'false');await toggle.click();assert.equal(await toggle.getAttribute('aria-checked'),'true');await toggle.click();assert.equal(await toggle.getAttribute('aria-checked'),'false');}
 checks.push({page:key,size:name,width,height,horizontalOverflow:false,visiblePages:1});
}
await page.locator('nav a[href="#people"]').click();await page.waitForSelector('[data-page="people"]:visible');assert.equal(await page.locator('nav a[href="#people"]').getAttribute('aria-current'),'page');
await context.close();}
assert.equal(errors.length,0,JSON.stringify(errors));
fs.writeFileSync(path.join(root,'VALIDATION.json'),JSON.stringify({artifactOnly:true,allExamplesFictional:true,language:'English concept; EN/VI runtime requirement retained',browserEmulationNotPhysicalDevices:true,checks,errors,network:'Local static assets only; no API or external requests',limitations:['Not an implemented application screenshot','No production or live Netlify validation','No new runtime code tested by this artifact review']},null,2)+'\n');console.log(JSON.stringify({views:checks.length,errors}));
}finally{await browser.close()}
