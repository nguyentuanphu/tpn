import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {stripTypeScriptTypes} from 'node:module';
import {launch} from './harness.mjs';

const original=stripTypeScriptTypes(execFileSync('git',['show','3e07f2077:js/screencapture.ts'],{encoding:'utf8'}));
const browser=await launch();
try{
 const page=await browser.newPage({viewport:{width:1024,height:768}});
 await page.route('**/__old_capture__.js',r=>r.fulfill({contentType:'text/javascript',body:original}));
 await page.route('**/__capture_style__',r=>r.fulfill({contentType:'text/html',body:`<!doctype html><style>:root{--tone:#b34290}body{margin:0;background:#ebf8ff}.modal{position:fixed;inset:0;padding:24px;background:#ddeaff}.card{display:grid;grid-template-columns:repeat(8,1fr);gap:6px;padding:12px;background:white;border:3px solid #632360;border-radius:24px}.tile{height:68px;background:var(--tone);border:2px solid #123456;border-radius:8px;display:flex;align-items:center;justify-content:center;box-shadow:1px 2px 2px #12345655}svg{width:48px;height:48px}p{color:#152639;font:bold 24px sans-serif}</style><canvas width="1024" height="768" id="world"></canvas><img width="42" height="42" style="position:fixed;z-index:2;left:20px;top:20px" src="data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2242%22 height=%2242%22%3E%3Ccircle cx=%2221%22 cy=%2221%22 r=%2220%22 fill=%22blue%22/%3E%3C/svg%3E"><div class="modal"><p>Resolved styles, original SVG geometry and inherited colours</p><div class="card">${Array.from({length:64},()=>'<div class="tile"><svg viewBox="0 0 50 50"><circle cx="25" cy="25" r="22" fill="#f4d363"/><path d="M10 30L25 8L40 30Z" fill="#347cb8"/><circle cx="20" cy="25" r="3"/><circle cx="31" cy="25" r="3"/></svg></div>').join('')}</div></div>`}));
 await page.goto('http://localhost:8765/__capture_style__');
 const result=await page.evaluate(async()=>{
  const old=await import(String('/__old_capture__.js')),fresh=await import(String('/js/screencapture.js'));
  const canvas=document.querySelector<HTMLCanvasElement>('#world')!,ctx=canvas.getContext('2d')!;ctx.fillStyle='#2cbb63';ctx.fillRect(0,0,1024,768);
  const started=performance.now(),a=await old.captureScreen(canvas),middle=performance.now(),b=await fresh.captureScreen(canvas),ended=performance.now();
  const pixels=async(src:string)=>{const i=new Image();i.src=src;await i.decode();const c=document.createElement('canvas');c.width=i.width;c.height=i.height;const x=c.getContext('2d')!;x.drawImage(i,0,0);return x.getImageData(0,0,c.width,c.height).data;};
  const x=await pixels(a),y=await pixels(b);let changed=0;for(let i=0;i<x.length;i++)if(x[i]!==y[i])changed++;
  return{oldMs:Math.round(middle-started),newMs:Math.round(ended-middle),changedPixelChannels:changed,channels:x.length};
 });
 assert.equal(result.changedPixelChannels,0,'batch style assignment preserves the complete captured picture');
 await fs.writeFile(new URL('../docs/v1.02-report-control/capture-style-benchmark.json',import.meta.url),JSON.stringify(result,null,2)+'\n');console.log(result);
}finally{await browser.close();}
