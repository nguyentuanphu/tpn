import test from 'node:test';
import assert from 'node:assert/strict';
import {mountRenderRecovery} from '../../js/render-recovery.js';
const wait=()=>new Promise(r=>setTimeout(r,8));
function fixture(){
 const before={document:globalThis.document,add:globalThis.addEventListener,remove:globalThis.removeEventListener};
 const doc=new EventTarget(),page=new EventTarget(),canvas=new EventTarget();doc.hidden=false;
 globalThis.document=doc;globalThis.addEventListener=page.addEventListener.bind(page);globalThis.removeEventListener=page.removeEventListener.bind(page);
 const calls={refresh:0,restore:0,save:0,show:0,hide:0,reload:0};let isLost=false,retry;
 let closed=false;
 const dispose=mountRenderRecovery({canvas,lost:()=>isLost,restore:()=>calls.restore++,refresh:()=>calls.refresh++,save:()=>calls.save++,show:f=>{calls.show++;retry=f;},hide:()=>calls.hide++,reload:()=>calls.reload++});
 return {doc,page,canvas,calls,lost:v=>isLost=v,retry:()=>retry(),close:()=>{if(closed)return;closed=true;dispose();globalThis.document=before.document;globalThis.addEventListener=before.add;globalThis.removeEventListener=before.remove;}};
}
test('returning to a suspended healthy window restarts its drawing clock without reloading',()=>{const f=fixture();try{f.page.dispatchEvent(new Event('pageshow'));assert.equal(f.calls.refresh,1);assert.equal(f.calls.reload,0);assert.equal(f.calls.show,0);}finally{f.close();}});
test('hidden context loss saves progress and waits until visible before restoring',async()=>{const f=fixture();try{f.doc.hidden=true;f.lost(true);const e=new Event('webglcontextlost',{cancelable:true});f.canvas.dispatchEvent(e);assert.equal(e.defaultPrevented,true);await wait();assert.equal(f.calls.save,1);assert.equal(f.calls.restore,0);f.doc.hidden=false;f.doc.dispatchEvent(new Event('visibilitychange'));await wait();assert.equal(f.calls.restore,1);assert.equal(f.calls.show,1);assert.equal(f.calls.reload,0);f.lost(false);f.canvas.dispatchEvent(new Event('webglcontextrestored'));assert.equal(f.calls.hide,1);assert.equal(f.calls.refresh,2);}finally{f.close();}});
test('leaving cancels pending GPU work; explicit retry saves, and disposal removes resume listeners',async()=>{const f=fixture();try{f.lost(true);f.canvas.dispatchEvent(new Event('webglcontextlost',{cancelable:true}));f.page.dispatchEvent(new Event('pagehide'));await wait();assert.equal(f.calls.restore,0);assert.equal(f.calls.reload,0);const saves=f.calls.save;f.retry();assert.equal(f.calls.save,saves+1);assert.equal(f.calls.reload,1);const refreshes=f.calls.refresh;f.close();f.page.dispatchEvent(new Event('pageshow'));assert.equal(f.calls.refresh,refreshes);}finally{f.close();}});
