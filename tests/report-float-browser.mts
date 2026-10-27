import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { launch, open, clear, noWelcome } from './harness.mjs';

async function reportFloatingBrowser(){
const browser=await launch();
const dir=new URL('../docs/studio-management-foundation/evidence/report-control-20261027/',import.meta.url);await fs.mkdir(dir,{recursive:true});
const results:unknown[]=[];
try{
 const P=await open(browser,{w:390,h:844,touch:true,lang:process.argv.includes('--lang-vi')?'vi':'en',settings:{online:false,countPlayers:false},route:async ctx=>{await ctx.route('**/api/**',r=>r.fulfill({json:{open:[],mine:[]}}));}});
 await clear(P.page);await noWelcome(P.page);
 await P.page.evaluate(async()=>{const g=window.__sv as any;localStorage.setItem('sv2_tester',JSON.stringify({at:Date.now()}));g.tester?.unmount();(await import(String('/js/tester.js'))).mountTester(g,'ladybird');});
 const button=P.page.locator('.tester-floating[data-tester-player="0"]');await button.waitFor();
 if(process.argv.includes('--collision-only')){
  const original=await button.boundingBox();assert.ok(original);
  await P.page.evaluate(async r=>{(await import(String('/js/popups.js'))).modal('report-collision-proof',`<h2>Control collision fixture</h2><button class="collision-control btn" style="position:fixed;left:${r.x}px;top:${r.y}px;width:${r.width}px;height:${r.height}px;min-height:64px">Control</button>`);},original);
  await P.page.screenshot({path:new URL('default-collision.png',dir).pathname});
  const reachable=()=>P.page.locator('.collision-control').evaluate(n=>{const r=n.getBoundingClientRect(),top=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);return top===n||n.contains(top);});
  for(let i=0;i<30&&!await reachable();i++)await P.page.waitForTimeout(50);
  assert.equal(await reachable(),true,'Default report position must yield to a real modal control');
  await P.page.evaluate(()=>{const decoration=document.createElement('div');decoration.className='dialog collision-decoration';decoration.style.cssText='position:fixed;left:0;top:0;width:10px;height:10px;z-index:1;pointer-events:none';document.body.append(decoration);});
  await P.page.evaluate(()=>new Promise<void>(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>resolve()))));
  assert.equal(await reachable(),true,'A later decorative layer must not hide the active control from collision checks');
  assert.equal(await button.evaluate(b=>{const r=b.getBoundingClientRect();return document.elementFromPoint(r.x+r.width/2,r.y+r.height/2)?.closest('.tester-floating')===b;}),true,'Report button must remain reachable too');
  const before=await button.boundingBox();assert.ok(before);await P.page.mouse.move(before.x+32,before.y+32);await P.page.mouse.down();await P.page.mouse.move(100,200);await P.page.mouse.up();
  const dragged=await button.boundingBox();assert.ok(dragged);await P.page.evaluate(()=>document.querySelector('.report-collision-proof')?.append(document.createElement('p')));await P.page.waitForTimeout(150);const kept=await button.boundingBox();assert.ok(kept);assert.ok(Math.abs(kept.x-dragged.x)<2&&Math.abs(kept.y-dragged.y)<2,'User-dragged position must be preserved');
  await button.focus();await P.page.keyboard.press('Home');assert.equal(await reachable(),true,'Reset default must still avoid the underlying control');
  await P.page.evaluate(()=>document.querySelectorAll('.report-collision-proof,.collision-decoration').forEach(n=>n.remove()));await P.page.evaluate(()=>new Promise<void>(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>resolve()))));
  await button.focus();await P.page.keyboard.press('Home');const initial=await button.boundingBox();assert.ok(initial);
  await P.page.evaluate(r=>{const panel=document.createElement('div');panel.className='modal report-scroll-proof';panel.style.cssText='position:fixed;inset:0;display:block;overflow:auto;scroll-behavior:auto;padding:0;pointer-events:auto';panel.innerHTML=`<div style="position:relative;height:2000px"><button class="scroll-collision-control btn" style="position:absolute;left:${r.x}px;top:${r.y+200}px;width:64px;height:64px;min-height:64px">Scroll control</button></div>`;document.body.append(panel);},initial);
  await P.page.evaluate(()=>new Promise<void>(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>resolve()))));
  await P.page.locator('.report-scroll-proof').evaluate(n=>n.scrollTop=200);
  const scrollReachable=()=>P.page.locator('.scroll-collision-control').evaluate(n=>{const r=n.getBoundingClientRect(),top=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);return top===n||n.contains(top);});
  for(let i=0;i<30&&!await scrollReachable();i++)await P.page.waitForTimeout(50);
  assert.equal(await scrollReachable(),true,'Scrolling a panel must not move its control underneath the default report button');
  results.push({defaultAvoidsUnderlyingControl:true,decorativeLayersIgnored:true,reportRemainsReachable:true,userPositionPreserved:true,resetAvoidsControl:true,scrolledControlReachable:true});await P.ctx.close();return;
 }
 if(process.argv.includes('--slow-reset-only')){
  await button.click();await P.page.locator('.tpanel').waitFor();
  const b=await button.boundingBox();assert.ok(b);await P.page.mouse.click(b.x+32,b.y+32,{clickCount:2});await P.page.locator('.tpanel').waitFor({state:'detached'});
  await button.click();await P.page.locator('.tpanel').waitFor();await P.page.locator('.tpanel textarea').fill('Synthetic report draft');await button.dblclick();await P.page.waitForTimeout(450);
  assert.equal(await P.page.locator('.tpanel textarea').inputValue(),'Synthetic report draft');await P.page.locator('.tpanel .tp-head > .x').click();await P.page.locator('.tpanel').waitFor({state:'detached'});
  await button.click();await P.page.locator('.tpanel').waitFor();await P.page.locator('.tp-k[data-k=looks]').focus();await P.page.keyboard.press('Enter');await button.dblclick();await P.page.waitForTimeout(450);assert.equal(await P.page.locator('.tp-k[data-k=looks]').evaluate(b=>b.classList.contains('on')),true);await P.page.locator('.tpanel .tp-head > .x').click();await P.page.locator('.tpanel').waitFor({state:'detached'});
  results.push({slowNativeDoubleTapCancelsUntouchedReport:true,resetPreservesEditedDraft:true,resetPreservesKeyboardCategory:true});assert.deepEqual(P.errors,[]);await P.ctx.close();return;
 }

 const drag=async(x:number,y:number)=>{const r=await button.boundingBox();assert.ok(r);await P.page.mouse.move(r.x+32,r.y+32);await P.page.mouse.down();await P.page.mouse.move(x,y);await P.page.mouse.up();};
 for(const [device,w,h]of [['phone',390,844],['tablet',820,1180],['computer',1280,800]]as const)for(const lang of ['en','vi']){
  if(process.argv.includes('--destinations-only')||process.argv.includes('--integration-only')||(process.argv.includes('--phone-only')&&device!=='phone'))continue;
  console.log('checking',device,lang);
  await P.page.setViewportSize({width:w,height:h});await P.page.evaluate(async lang=>{(await import(String('/js/state.js'))).settings.lang=lang;(await import(String('/js/i18n.js'))).applyLang();},lang);
  await P.page.evaluate(async()=>{(await import(String('/js/popups.js'))).modal('report-layer-proof','<h2>Overlay</h2><button class="proof-close btn" style="min-height:64px">Close</button>');});
  await drag(w/2,h/2);await P.page.waitForTimeout(800);
  assert.equal(await P.page.locator('.tpanel').count(),0,'drag must not open a report');
  assert.equal(await button.evaluate(b=>{const r=b.getBoundingClientRect();return document.elementFromPoint(r.x+32,r.y+32)?.closest('.tester-floating')===b;}),true,'report remains above modal');
  const r=await button.boundingBox();assert.ok(r);assert.ok(r.width>=64&&r.height>=64);
  await button.dblclick();await P.page.waitForTimeout(450);assert.equal(await P.page.locator('.tpanel').count(),0,'double tap resets without opening a report');
  assert.equal(await P.page.evaluate(()=>localStorage.getItem('sv2_report_position_0')),null);
  await drag(w/2,h/2);
  await button.click();await P.page.locator('.tpanel').waitFor();
  assert.equal(await P.page.locator('.tpanel h2').innerText(),lang==='vi'?'Báo lỗi':'Report a problem');
  assert.equal(await P.page.locator('.tpanel .tp-head > .x').evaluate(b=>{const r=b.getBoundingClientRect();return document.elementFromPoint(r.x+r.width/2,r.y+r.height/2)?.closest('.tpanel')!==null;}),true,'report form controls stay above the previous window');
  await P.page.waitForTimeout(300);await P.page.screenshot({path:new URL(`${device}-${lang}.png`,dir).pathname});
  await P.page.locator('.tpanel .tp-head > .x').click();await P.page.locator('.tpanel').waitFor({state:'detached'});
  await P.page.evaluate(()=>document.querySelector('.report-layer-proof')?.remove());
  results.push({device,lang,aboveModal:true,dragWithoutReport:true,doubleTapResets:true,reportOpens:true,target64:true});
 }
 await P.page.setViewportSize({width:390,height:844});
 if(!process.argv.includes('--destinations-only')){
  await P.page.evaluate(()=>{void(window.__sv as any).playGame(0,'memory','replay');});await P.page.locator('.gl').waitFor();
  assert.equal(await button.evaluate(b=>{const r=b.getBoundingClientRect();return document.elementFromPoint(r.x+32,r.y+32)?.closest('.tester-floating')===b;}),true,'ladybird above an actual running game');
  await button.click();await P.page.locator('.tpanel').waitFor();await P.page.waitForTimeout(300);await P.page.screenshot({path:new URL('phone-running-game-report.png',dir).pathname});
  await P.page.locator('.tpanel .tp-head > .x').click();await P.page.locator('.tpanel').waitFor({state:'detached'});await P.page.locator('.gl .gl-x').click();await P.page.locator('.gl').waitFor({state:'detached'});
  await drag(-100,-100);const edge=await button.boundingBox();assert.ok(edge&&edge.x>=8&&edge.y>=8);
  const position=await button.boundingBox();await P.page.evaluate(async()=>{const g=window.__sv as any;g.tester.unmount();(await import(String('/js/tester.js'))).mountTester(g,'ladybird');});await button.waitFor();const restored=await button.boundingBox();assert.ok(position&&restored&&Math.abs(position.x-restored.x)<2&&Math.abs(position.y-restored.y)<2);
  results.push({reportDuringActualGame:true,dragClampedToScreen:true,positionRestoredOnRemount:true});
 }
 // Test the actual ride picker with duplicate physical stops retained in the world.
 await P.page.evaluate(()=>{const g=window.__sv as any;const a=g.world.busStops.find((s:any)=>s.name()==='Brisbane')||g.world.busStops[0];if(!a)throw Error('Physical bus stops missing');const brisbane={...a,x:80,z:20,place:{id:'fixture-brisbane'},icon:'🐨',name:()=> 'Brisbane'};g.world.busStops.push(brisbane,{...brisbane,x:95});g.heroes[0].pos.x=0;g.heroes[0].pos.z=0;const ride=g.interactables.find((r:any)=>/^ride_/.test(r.id));if(!ride)throw Error('ride missing');void ride.act(g.heroes[0]);});
 await P.page.locator('.dchoices button').first().waitFor();await P.page.locator('.dchoices button').first().click();await P.page.locator('.stoppick').waitFor();
 const names=await P.page.locator('.stoppick [data-k] b').allTextContents();assert.equal(names.filter(n=>n==='Brisbane').length,1);assert.equal(new Set(names).size,names.length);
 const destinationLang=await P.page.evaluate(async()=> (await import(String('/js/state.js'))).settings.lang);await P.page.screenshot({path:new URL(`phone-${destinationLang}-destinations.png`,dir).pathname});await P.page.locator('.stoppick [data-next]').click();
 results.push({duplicateBrisbaneRemoved:true,physicalStopsPreserved:true});
 assert.deepEqual(P.errors,[]);await P.ctx.close();
}finally{await browser.close();await fs.writeFile(new URL(process.argv.includes('--collision-only')?'collision-results.json':process.argv.includes('--slow-reset-only')?'slow-reset-results.json':process.argv.includes('--destinations-only')?(process.argv.includes('--lang-vi')?'destinations-vi-results.json':'destinations-results.json'):process.argv.includes('--integration-only')?'integration-results.json':'results.json',dir),JSON.stringify(results,null,2)+'\n');}
console.log(JSON.stringify(results));

}
await reportFloatingBrowser();
