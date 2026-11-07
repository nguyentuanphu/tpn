// Regression cases for real failures vs scroll/background/user-close false reports.
import assert from 'node:assert/strict';
import { launch } from './harness.mts';
const browser=await launch(),page=await browser.newPage({viewport:{width:390,height:844}});
try {
  await page.route('**/__fixture__',r=>r.fulfill({contentType:'text/html',body:'<!doctype html><html><body></body></html>'}));
  await page.goto('http://127.0.0.1:8765/__fixture__');
  const results=await page.evaluate(async()=>{
    const {unreachableControl,activeReportPanel,observeGameOpen}=await import('/js/tester-detection.js');
    document.body.innerHTML=`<div class="hud"><button id="background" style="position:absolute;top:1200px">Background</button></div><div class="modal" style="position:fixed;inset:0;z-index:30"><button id="outside" style="position:absolute;left:600px">Lost</button><div id="scroll" style="height:100px;width:250px;overflow-y:auto;overflow-x:hidden"><div style="height:1500px;position:relative"><button id="reachable" style="position:absolute;top:1200px">Scroll to me</button><button id="lostX" style="position:absolute;left:800px;top:200px">Lost sideways</button></div></div><button id="hidden" style="display:none">Hidden</button><button id="visible">Here</button><details id="foldbox"><summary><button id="foldsum" style="position:relative;top:2000px">Summary</button></summary><div style="height:1200px"></div><button id="folded">Folded away</button></details><details open><summary>Open</summary><div style="height:1200px"></div><button id="unfolded">Lost below</button></details><input id="input"></div>`;
    const top=activeReportPanel(document),get=id=>unreachableControl(document.getElementById(id),top);
    const controls={reachable:get('reachable'),outside:get('outside'),lostX:get('lostX'),hidden:get('hidden'),background:get('background'),visible:get('visible'),folded:get('folded'),foldSummary:get('foldsum'),unfolded:get('unfolded')};
    document.getElementById('input').focus();controls.keyboardDoesNotDisable=get('outside');
    const wait=()=>new Promise(r=>setTimeout(r,80));
    let failures=[];
    observeGameOpen('quick',()=>failures.push('quick'),{wait:40});const quick=document.createElement('div');quick.className='gl';quick.dataset.gameId='quick';document.body.append(quick);quick.remove();await wait();
    observeGameOpen('missing',()=>failures.push('missing'),{wait:40});await wait();
    observeGameOpen('wanted',()=>failures.push('wanted'),{wait:40});const other=document.createElement('div');other.className='gl';other.dataset.gameId='other';document.body.append(other);await wait();other.remove();
    const cancel=observeGameOpen('cancelled',()=>failures.push('cancelled'),{wait:40});cancel();await wait();
    const {captureFieldValue}=await import('/js/screencapture.js');
    const password=document.createElement('input');password.type='password';password.value='test-private-secret';
    const pairing=document.createElement('input');pairing.className='fd-code';pairing.value='PAIRSECRET';
    const normal=document.createElement('input');normal.value='Synthetic visible note';
    return {controls,failures,captureValues:[captureFieldValue(password),captureFieldValue(pairing),captureFieldValue(normal)]};
  });
  assert.deepEqual(results.controls,{reachable:false,outside:true,lostX:true,hidden:false,background:false,visible:false,folded:false,foldSummary:true,unfolded:true,keyboardDoesNotDisable:true});
  assert.deepEqual(results.failures,['missing','wanted']);
  assert.deepEqual(results.captureValues,['••••','••••','Synthetic visible note']);
  console.log(JSON.stringify({pass:true,...results},null,2));
} finally {await browser.close();}
