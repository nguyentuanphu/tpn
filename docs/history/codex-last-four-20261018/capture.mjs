import { chromium } from '../../../tests/node_modules/playwright/index.mjs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const root=fileURLToPath(new URL('.', import.meta.url));
const repo=fileURLToPath(new URL('../../', import.meta.url));
const b=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
const p=await b.newPage({viewport:{width:1180,height:820}});
await p.route('**/visual-fixture',r=>r.fulfill({contentType:'text/html',body:'<!doctype html><link rel="stylesheet" href="/css/fonts.css"><link rel="stylesheet" href="/css/style.css"><body></body>'}));
await p.goto('http://localhost:8765/visual-fixture');
const previous=execFileSync('git',['show','1ac883f:js/roads.js'],{cwd:repo,encoding:'utf8'}).replaceAll("from './","from 'http://localhost:8765/js/");
await p.evaluate(async previous=>{
 const S=await import('/js/state.js');Object.assign(S.settings,{voice:false,sound:false,music:false,online:false});
 const before=await import(URL.createObjectURL(new Blob([previous],{type:'text/javascript'}))),after=await import('/js/roads.js'),M=await import('/js/content/map.js');
 document.body.innerHTML='<main style="padding:24px;background:#fff6e4"><h1>Road surfaces: Concept D comparison</h1><p>Previous surfaces (left) · Revised surfaces (right)</p><div id="samples"></div></main>';
 for(const [label,kind,tint,style] of [['Vietnam asphalt','asphalt',M.ROAD_TONES.vn,'vn'],['Australia asphalt','asphalt',M.ROAD_TONES.au,'au'],['Dirt road','dirt',null,null]]){
 const row=document.createElement('section');row.innerHTML=`<h2>${label}</h2>`;row.style.marginBottom='24px';
 for(const mod of [before,after]){const c=document.createElement('canvas');c.width=512;c.height=128;c.style.cssText='width:48%;height:128px;margin-right:1%;';const g=c.getContext('2d');g.translate(512,0);g.rotate(Math.PI/2);g.drawImage(mod.roadTexture(kind,tint,style).image,0,0,128,512);row.appendChild(c);}document.querySelector('#samples').appendChild(row);}
},previous);
await p.screenshot({path:root+'/roads-before-after.png'});
for(const lang of ['en','vi'])for(const [name,width,height] of [['phone',390,844],['tablet',820,1180],['computer',1180,820],['phone-landscape',844,390]]){
 await p.setViewportSize({width,height});
 await p.evaluate(async lang=>{document.querySelector('.gl-x')?.click();document.body.innerHTML='';const S=await import('/js/state.js');S.settings.lang=lang;await import('/js/emojiswap.js');await import('/js/games/vietnam.js');const F=await import('/js/games/frame.js');F.openGame('oanquan',{players:[{id:'visual',name:lang==='vi'?'Bạn nhỏ':'Little friend'}],little:true});},lang);
 await p.waitForTimeout(350);await p.screenshot({path:root+`/oanquan-${name}-${lang}.png`});
 console.log(lang,name,await p.locator('.oaq-c.sq').first().boundingBox());
}
await b.close();
