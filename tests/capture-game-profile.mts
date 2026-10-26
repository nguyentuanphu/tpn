import fs from 'node:fs/promises';
import {launch,open,clear,noWelcome} from './harness.mjs';
const browser=await launch();
try{
 const P=await open(browser,{w:1024,h:768,settings:{online:false,countPlayers:false},route:async ctx=>{
  await ctx.route('**/js/screencapture.js',async r=>{
   const response=await r.fetch();let body=await response.text();
   body=body.replace('export async function captureScreen(source, { sceneOnly = false } = {}) {',"export async function captureScreen(source, { sceneOnly = false } = {}) { const trace=k=>(window.__captureProfile??=[]).push({stage:k,at:performance.now()});trace('start');");
   body=body.replace('const body = await clone(document.body, source);',"const body = await clone(document.body, source);trace('cloned');");
   body=body.replace("const i = await image('data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg));","const i = await image('data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg));trace('image');");
   body=body.replace('return shot;',"trace('done');return shot;");await r.fulfill({response,body});
  });
 }});await clear(P.page);await noWelcome(P.page);
 const result=await P.page.evaluate(async()=>{
  const w=window as any;w.__sv.tester?.unmount();w.__captureProfile=[];
  const nodes=document.querySelectorAll('*').length,images=[...document.images].filter(i=>i.getBoundingClientRect().width>0).map(i=>({kind:i.src.startsWith('data:')?'data':'url',width:i.width,height:i.height}));
  const module=await import(String('/js/screencapture.js'));await module.captureScreen(w.__sv.renderer.domElement);
  const base=w.__captureProfile[0].at;return{nodes,images,timings:w.__captureProfile.map((r:any)=>({stage:r.stage,ms:Math.round(r.at-base)}))};
 });await fs.writeFile(new URL('../docs/v1.02-report-control/capture-game-profile.json',import.meta.url),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result));await P.ctx.close();
}finally{await browser.close();}
