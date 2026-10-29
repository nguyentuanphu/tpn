import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import type {Browser} from 'playwright';
import {open,clear,noWelcome,URL} from './harness.mjs';

export async function resumeRecoveryCheck(browser:Browser,packedURL:string){
 const P=await open(browser,{w:820,h:1180,touch:true,settings:{voice:false,sound:false,online:false,autoPack:false},pre:()=>{
  const request=window.requestAnimationFrame.bind(window);(window as any).__testFrames=new Set<number>();
  window.requestAnimationFrame=callback=>{let id=0;id=request(time=>{(window as any).__testFrames.delete(id);callback(time);});(window as any).__testFrames.add(id);return id;};
 }});
 try{
  await clear(P.page);await noWelcome(P.page);await fs.mkdir('out/resume-recovery',{recursive:true});
  const original=await P.page.evaluate(()=>{const G=window.__sv as any;localStorage.setItem('resume-save-sentinel','kept');return {id:G.heroes[0].profile.id,frames:G.renderer.info.render.frame};});
  let navigations=0;P.page.on('framenavigated',frame=>{if(frame===P.page.mainFrame())navigations++;});
  // Reproduce the suspended installed window: pending callbacks are gone and its drawing buffer was discarded.
  await P.page.evaluate(()=>{for(const id of(window as any).__testFrames)cancelAnimationFrame(id);const c=(window.__sv as any).renderer.domElement;c.width=1;c.height=1;dispatchEvent(new PageTransitionEvent('pageshow',{persisted:true}));});
  await P.page.waitForFunction(frames=>(window.__sv as any).renderer.info.render.frame>frames+2,original.frames);
  assert.ok(await P.page.evaluate(()=>(window.__sv as any).renderer.domElement.width>1),'resume rebuilds the drawing buffer');
  await P.page.screenshot({path:'out/resume-recovery/tablet-return.png'});
  // Actual WebGL context loss must restore without a reload or throwing away the save.
  const savedPosition=await P.page.evaluate(()=>{const G=window.__sv as any,h=G.heroes[0];h.profile.pos={x:h.lastSafe.x+.25,z:h.lastSafe.z};(window as any).__goodSpot=G.goodSpot;G.goodSpot=()=>false;const position={...h.profile.pos};const extension=G.renderer.getContext().getExtension('WEBGL_lose_context');if(!extension)throw Error('test browser lacks real WebGL loss extension');(window as any).__restored=false;G.renderer.domElement.addEventListener('webglcontextrestored',()=>{(window as any).__restored=true;},{once:true});extension.loseContext();return position;});
  await P.page.waitForFunction(()=>(window as any).__restored&&!(window.__sv as any).renderer.getContext().isContextLost(),null,{timeout:30000});
  await P.page.waitForFunction(()=>!document.querySelector('.ctxlost'));
  assert.deepEqual(await P.page.evaluate(()=>(window.__sv as any).heroes[0].profile.pos),savedPosition,'recovery must not replace the last saved position with rejected ground');
  await P.page.evaluate(()=>{(window.__sv as any).goodSpot=(window as any).__goodSpot;});
  assert.equal(navigations,0,'normal return and GPU restoration never reload the installed game');
  assert.equal(await P.page.evaluate(()=>localStorage.getItem('resume-save-sentinel')),'kept');
  assert.equal(await P.page.evaluate(()=>(window.__sv as any).heroes[0].profile.id),original.id);
  assert.deepEqual(P.errors,[]);
 }finally{await P.ctx.close();}
 // Recovery remains usable when main failed before it could create a scene, including a missing old shell child.
 for(const [name,url,w,h,lang,graphics]of[
  ['phone',URL,390,844,'en',true],['tablet',URL,1024,768,'vi',true],['computer',packedURL,1280,800,'en',false]
 ]as const){
  const ctx=await browser.newContext({viewport:{width:w,height:h}}),page=await ctx.newPage();
  try{
   await page.addInitScript(lang=>{localStorage.setItem('sv2_settings',JSON.stringify({lang}));localStorage.setItem('resume-save-sentinel','kept');},lang);
   if(graphics)await ctx.route('**/js/main.js',r=>r.fulfill({contentType:'text/javascript',body:"document.getElementById('boot').innerHTML='<p>Missing picture</p>';const error=new Error('fixture WebGL unavailable');error.name='GraphicsUnavailableError';throw error;"}));
   else await ctx.route('**/bundle/c-*.js',r=>r.abort());
   await page.goto(url);const retry=page.locator('[data-launch-retry]');await retry.waitFor();
   const detail=await page.locator('#boot p').innerText();assert.ok(detail.length>20);assert.doesNotMatch(detail,/check your connection|kiểm tra kết nối/i);
   if(graphics)assert.match(detail,/3D/);
   assert.equal(await page.evaluate(()=>localStorage.getItem('resume-save-sentinel')),'kept');
   const bad=await page.locator('#boot p,[data-launch-retry]').evaluateAll(nodes=>nodes.map(e=>e.getBoundingClientRect()).filter(r=>r.left<0||r.top<0||r.right>innerWidth+1||r.bottom>innerHeight+1));assert.equal(bad.length,0,'failure copy and64px retry fit '+name);
   const size=await retry.boundingBox();assert.ok(size&&size.height>=64);
   await page.screenshot({path:`out/resume-recovery/${name}-${lang}-failure.png`});
  }finally{await ctx.close();}
 }
 return 'installed-window return restarts lost frame callbacks and buffer; real GPU loss restores without reload; saves retained; graphics and packed import errors retain visible bilingual recovery';
}
