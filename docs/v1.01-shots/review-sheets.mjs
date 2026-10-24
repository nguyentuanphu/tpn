import fs from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
const {chromium}=createRequire(new URL('../../tests/package.json',import.meta.url))('playwright');
const base=new URL('./',import.meta.url),here=fileURLToPath(base);
const panels=['settings','settings-scrolled','grownups','voices','backup','fixed-reports','simple'];
const names=['phone-en','phone-vi','tablet-en','tablet-vi','computer-en','computer-vi'];
const srv=http.createServer(async(q,r)=>{
 const u=decodeURIComponent((q.url||'/').split('?')[0]);
 const f=path.join(here,path.basename(u));
 try{const b=await fs.readFile(f);r.writeHead(200,{'Content-Type':f.endsWith('.png')?'image/png':'text/html; charset=utf-8'});r.end(b);}catch{r.writeHead(404);r.end();}
});
await new Promise(res=>srv.listen(0,'127.0.0.1',res));
const port=srv.address().port;
const browser=await chromium.launch();
try{
 const page=await browser.newPage({viewport:{width:1440,height:1640},deviceScaleFactor:1});
 for(const panel of panels){
  const html='<!doctype html><meta charset="utf-8"><style>body{margin:0;background:#e6e0f2;font:18px sans-serif;display:grid;grid-template-columns:repeat(3,480px)}article{box-sizing:border-box;width:480px;height:820px;padding:12px;text-align:center}h2{font-size:20px;margin:0 0 8px}img{max-width:456px;max-height:764px;object-fit:contain}</style>'+names.map(n=>`<article><h2>${n} · ${panel}</h2><img src="${n}-${panel}.png"></article>`).join('');
  await fs.writeFile(fileURLToPath(new URL('review-'+panel+'.html',base)),html);
  await page.goto(`http://127.0.0.1:${port}/review-${panel}.html`);
  await page.waitForFunction(()=>[...document.images].every(i=>i.complete&&i.naturalWidth));
  await page.screenshot({path:fileURLToPath(new URL('review-'+panel+'.png',base))});
 }
}finally{await browser.close();srv.close();}
console.log('Seven sheets cover all 42 native UI captures.');
