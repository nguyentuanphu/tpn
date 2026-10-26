import assert from 'node:assert/strict';
import type {Browser} from 'playwright';
import {open, clear, noWelcome} from './harness.mjs';
const PRIVATE_QUESTION = 'Where is our private family picnic?';
const PRIVATE_ANSWER = 'Beside our secret purple tree';
const PRIVATE_VI = 'Chỗ riêng của gia đình mình ở đâu?';
declare global {
  interface Window {__quizReportSerializations?:string[];__quizReportPaint?:string[];}
}

/** Real private-game controls, tester replay, auto report and both composed-capture render paths. */
export async function familyReportPrivacyCheck(browser:Browser):Promise<string>{
  const posted:Record<string,unknown>[]=[];
  const P=await open(browser,{w:390,h:844,touch:true,settings:{voice:false,sound:false,music:false,online:false,countPlayers:false},route:async ctx=>{
    await ctx.route('**/content/custom.json*',r=>r.fulfill({json:{}}));
    await ctx.route('**/api/live**',r=>r.fulfill({json:{releases:{tester:{on:true,devices:['tester000001']}}}}));
    await ctx.route('**/api/tester**',r=>{
      if(r.request().method()!=='POST')return r.fulfill({json:{ok:true,mine:[],open:[]}});
      const body=r.request().postDataJSON();posted.push(body);
      return r.fulfill({json:{ok:true,rid:'private-fixture-'+String(body.clientId),k:'private-fixture'}});
    });
  },pre:()=>{
    localStorage.setItem('sv2_playerid','tester000001');
    localStorage.setItem('sv2_tester',JSON.stringify({at:1,b:'r87'}));
    localStorage.setItem('sv2_live',JSON.stringify({releases:{tester:{on:true,devices:['tester000001']}}}));
  }});
  try{
    await clear(P.page);await noWelcome(P.page);await P.page.waitForFunction(()=>!!window.__sv.tester);
    await P.page.evaluate(async({question,answer,vi})=>{
      window.__sv.paused=true;
      const S=await import(String('/js/state.js'));
      S.settings.familyQuiz=[{q:[question,vi],answers:[[answer,'Dưới cây tím riêng'],['At the beach','Bên bãi biển']],right:1,pic:'💛'}];
      const M=await import(String('/js/games/familyquiz.js'));M.registerFamilyQuiz();
      const native=XMLSerializer.prototype.serializeToString;
      window.__quizReportSerializations=[];
      XMLSerializer.prototype.serializeToString=function(node:Node){const text=native.call(this,node);window.__quizReportSerializations!.push(text);return text;};
      void window.__sv.playGame(0,'familyquiz','replay');
    },{question:PRIVATE_QUESTION,answer:PRIVATE_ANSWER,vi:PRIVATE_VI});
    await P.page.locator('.familyquiz [data-quiz-answer="0"]').waitFor();
    assert.equal(await P.page.locator('.familyquiz .fq-card').getAttribute('data-capture-private'),'true','private question and answer card must request screenshot redaction');
    await P.page.locator('.familyquiz [data-quiz-answer="0"]').click();
    const reportId=await P.page.evaluate(async()=>{
      const T=await import(String('/js/tester.js'));
      return await T.autoReport('freeze','Synthetic private quiz capture');
    });
    assert.ok(reportId,'automatic report was queued through the real tester');
    await P.page.waitForFunction(()=>JSON.parse(localStorage.getItem('sv2_tester_out')||'[]').length===0);
    const report=posted.find(p=>p.detail==='Synthetic private quiz capture');assert.ok(report,'real automatic report reached the synthetic endpoint');
    assert.ok(typeof report.shot==='string'&&report.shot.startsWith('data:image/'),'report keeps a useful redacted screenshot');
    const payload=JSON.stringify(report);
    for(const text of[PRIVATE_QUESTION,PRIVATE_ANSWER,PRIVATE_VI])assert.equal(payload.includes(text),false,'private question/answer absent from automatic report and replay');
    assert.ok(payload.includes('Private family content'),'replay retains a useful generic private-control tap');
    const serialized=await P.page.evaluate(()=>window.__quizReportSerializations!);
    assert.ok(serialized.some(s=>s.includes('familyquiz')),'actual composed game UI was serialized');
    for(const text of[PRIVATE_QUESTION,PRIVATE_ANSWER,PRIVATE_VI])assert.equal(serialized.some(s=>s.includes(text)),false,'foreign-object capture strips private content before serialization');
    const fallback=await P.page.evaluate(async()=>{
      const M=await import(String('/js/screencapture.js'));
      const nativeSerialize=XMLSerializer.prototype.serializeToString,nativePaint=CanvasRenderingContext2D.prototype.fillText;
      window.__quizReportPaint=[];
      XMLSerializer.prototype.serializeToString=function(node:Node){if(node instanceof HTMLBodyElement)throw Error('Synthetic foreign-object failure');return nativeSerialize.call(this,node);};
      CanvasRenderingContext2D.prototype.fillText=function(text:string,x:number,y:number,maxWidth?:number){window.__quizReportPaint!.push(String(text));if(maxWidth===undefined)return nativePaint.call(this,text,x,y);return nativePaint.call(this,text,x,y,maxWidth);};
      try{
        const canvas=document.createElement('canvas');canvas.width=390;canvas.height=844;
        const shot=await M.captureScreen(canvas);return{shot,paint:window.__quizReportPaint!};
      }finally{XMLSerializer.prototype.serializeToString=nativeSerialize;CanvasRenderingContext2D.prototype.fillText=nativePaint;}
    });
    assert.ok(fallback.shot.startsWith('data:image/'));
    assert.ok(fallback.paint.includes('••••'),'canvas fallback actually redacts a private subtree');
    for(const text of[PRIVATE_QUESTION,PRIVATE_ANSWER,PRIVATE_VI])assert.equal(fallback.paint.some(s=>s.includes(text)),false,'canvas fallback never paints private question/answers');
    await P.page.locator('.gl .gl-x').click();await P.page.locator('.gl').waitFor({state:'detached'});
    await P.page.evaluate(async()=>{window.__sv.paused=true;(await import(String('/js/family-quiz-editor.js'))).openFamilyQuestions();});
    await P.page.locator('.family-questions').waitFor();
    assert.equal(await P.page.locator('.family-questions .fq-edit-body').getAttribute('data-capture-private'),'true','private parent draft fields request capture redaction');
    const editorCapture=await P.page.evaluate(async()=>{
      window.__quizReportSerializations=[];const canvas=document.createElement('canvas');canvas.width=390;canvas.height=844;
      const M=await import(String('/js/screencapture.js'));await M.captureScreen(canvas);return window.__quizReportSerializations!;
    });
    for(const text of[PRIVATE_QUESTION,PRIVATE_ANSWER,PRIVATE_VI])assert.equal(editorCapture.some(s=>s.includes(text)),false,'parent draft is stripped before report serialization');
    assert.deepEqual(P.errors,[]);
    return 'Actual private quiz tap/automatic report/replay uses a generic label; foreign-object and canvas fallback redact question/answers; parent draft capture redacts too, with useful screenshots retained';
  }finally{await P.ctx.close();}
}
