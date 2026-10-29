import {contentEvidence} from './content-evidence.mjs';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {URL} from './harness.mjs';
const folder='../docs/studio-content-website-20261029';
export async function contentWebsiteCheck(browser){
 const provenance=contentEvidence(browser,['home/index.html', 'docs/website-review-20261023/art-content.mjs', 'docs/website-review-20261023/navigation.mjs']);
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
 fs.writeFileSync(folder+'/website-validation.json',JSON.stringify({provenance,results},null,2)+'\n');return `${results.length} website language/layout/deep-link checks`;
}
export async function contentVoiceCheck(browser){
 const provenance=contentEvidence(browser,['voices/manifest-en.json','voices/manifest-vi.json','js/voicepack.ts','js/packhash.ts']);
 const audit=JSON.parse(fs.readFileSync(folder+'/voice-audit.json')),urls=[];
 for(const line of audit.lines.filter(l=>l.recorded)){
  const manifest=JSON.parse(fs.readFileSync(`../voices/manifest-${line.lang}.json`));
  for(const voice of manifest.lines[line.hash]){const url=`voices/${line.lang}/${voice}/${line.hash}.mp3`;assert.ok(fs.existsSync('../'+url),url);urls.push(url);}
 }
 const context=await browser.newContext(),page=await context.newPage();
 await context.route('**/__content-voice',r=>r.fulfill({contentType:'text/html',body:'<!doctype html><title>Synthetic voice asset validation</title>'}));
 try{
  await page.goto(URL+'__content-voice');
  const results=await page.evaluate(async urls=>{
   const audio=new AudioContext(),results=[];
   try{for(const url of urls){const response=await fetch('/'+url);if(!response.ok)throw Error(url+' HTTP '+response.status);const buffer=await audio.decodeAudioData(await response.arrayBuffer());if(!(buffer.duration>0))throw Error(url+' empty recording');results.push({url,duration:buffer.duration,sampleRate:buffer.sampleRate});}}
   finally{await audio.close();}return results;
  },[...new Set(urls)]);
  assert.ok(results.length>0);fs.writeFileSync(folder+'/voice-validation.json',JSON.stringify({provenance,decoded:results.length,results,missingLines:audit.lines.filter(l=>!l.recorded)},null,2)+'\n');return `${results.length} shipped guidance recordings fetched and decoded; ${audit.lines.filter(l=>!l.recorded).length} lines still need recording; physical listening separate`;
 }finally{await context.close();}
}
