// Run from the repo: node docs/owner-repair-20261014/capture-films-49.mts before|after
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { launch, open, clear } from '../../tests/harness.mts';
const phase = process.argv[2];
if (!['before', 'after'].includes(phase)) throw Error('Choose before or after');
const out = path.resolve(`docs/owner-repair-20261014/evidence/films-49-${phase}`);
fs.mkdirSync(out, { recursive: true });
const sourceRoot=process.env.SV_SOURCE_ROOT||(phase==='before'?path.resolve('../films-49-baseline'):process.cwd()), lang=process.env.SV_LANG||'en';
const sources = ['js/film.js', 'js/content/films.js', 'js/content/talefilms.js', 'css/style.css', ...fs.readdirSync(path.join(sourceRoot,'js/content/films')).map(x => 'js/content/films/' + x), ...(fs.existsSync(path.join(sourceRoot,'js/content/film-looks.js')) ? ['js/content/film-looks.js'] : [])];
const fresh = { commit: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8', cwd:sourceRoot }).trim(), capturedAt: new Date().toISOString(), phase, sources: Object.fromEntries(sources.map(f => [f, crypto.createHash('sha256').update(fs.readFileSync(path.join(sourceRoot,f))).digest('hex')])), cases: [] };
const resultPath=path.join(out,lang==='en'?'results.json':'results-vi.json');
const result=!process.env.REDO&&fs.existsSync(resultPath)?JSON.parse(fs.readFileSync(resultPath,'utf8')):fresh;
if (JSON.stringify(result.sources) !== JSON.stringify(fresh.sources)) throw Error('Capture source changed; use a fresh evidence directory or REDO=1 rather than mixing versions');
const b = await launch();
try {
 for (const [device, w, h, touch] of [['phone',390,844,true],['tablet',820,1180,true],['computer',1280,800,false]]) {
  if(result.cases.filter(x=>x.device===device).length===(lang==='vi'?38:221)) continue;
  console.log('opening',device); const P = await open(b, { w, h, touch, lang, fast: true, play: false, url:process.env.SV_URL||(phase==='before'?'http://localhost:8765/':'http://localhost:8766/') });
  P.page.on('console',m=>{if(m.type()==='warning'&&m.text().startsWith('film page'))P.errors.push(m.text());});
  console.log('title ready',device); await P.page.evaluate(()=>{window.__sv.renderer.render=()=>{};const raf=requestAnimationFrame; window.requestAnimationFrame=f=>f.name==='loop'?raf(()=>setTimeout(()=>f(performance.now()),125)):raf(f);}); await P.page.evaluate(()=>{window.__sv.paused=true;}); await clear(P.page); await P.page.evaluate(()=>{window.__sv.paused=true;});
  const ids = await P.page.evaluate(async () => { const C = await import('/js/content/films.js'), T = await import('/js/content/talefilms.js'); return [...Object.keys(C.FILMS).filter(x=>!x.startsWith('lantern_')), ...Object.keys(T.TALE_FILMS)]; });
  for (const id of ids) {
   if(result.cases.filter(x=>x.id===id&&x.device===device).length) continue;
   const n = await P.page.evaluate(async id => { const { TALES } = await import('/js/learn.js'), { MORE_TALES } = await import('/js/talesdata.js'), T = await import('/js/tales.js'), F = await import('/js/film.js'); const tale = [...TALES,...MORE_TALES].find(x=>x.id===id); if(!tale) throw Error('No tale '+id); T.openTheatre(tale,{name:'Na'}); for(let i=0;i<100&&!F.filmNow();i++) await new Promise(r=>setTimeout(r,100)); if(!F.filmNow()) throw Error('No film '+id); document.querySelector('.th-pause').click(); return tale.pages.length; }, id);
   for (let k=0;k<(lang==='vi'?1:n);k++) {
    if(k) { await P.page.evaluate(()=>document.querySelector('.th-next').click()); }
    await P.page.waitForFunction(async k => (await import('/js/film.js')).filmNow()?.now?.k===k,k);
    await P.page.evaluate(()=>document.fonts.ready);
    const metrics = await P.page.evaluate(async () => { const f=(await import('/js/film.js')).filmNow(), p=f.now; p.narrated=false; p.t=0; for(let j=0;j<31;j++) p.tick(.1,j*.1); p.tickers=[]; p.tick=()=>{}; const box=s=>{const e=document.querySelector(s),r=e.getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height,font:getComputedStyle(e).fontSize};}; return {stage:box('.th-stage'),text:box('.th-text'),title:box('.th-top'),actors:p.actors.length,objects:p.root.children.length,look:p.look||null}; });
    await P.page.waitForTimeout(200);
    await P.page.screenshot({path:path.join(out,`${device}-${lang}-${id}-p${k+1}.png`),clip:{x:metrics.stage.x,y:metrics.stage.y,width:metrics.stage.w,height:metrics.stage.h},timeout:60000,animations:'disabled'});
    if(!k) await P.page.screenshot({path:path.join(out,`${device}-${lang}-${id}-shell.png`)});
    result.cases.push({id,page:k+1,device,lang,viewport:[w,h],...metrics});
   }
   await P.page.evaluate(()=>document.querySelector('.th-x').click()); await P.page.waitForSelector('.theatre',{state:'detached'});
   if(P.errors.length) throw Error(P.errors.join('\n'));
   console.log(`${phase} ${device} ${id}: ${n} pages`);
   fs.writeFileSync(path.join(out,lang==='en'?'results.json':'results-vi.json'),JSON.stringify(result,null,2)+'\n');
  }
  await P.ctx.close();
 }
} finally { await b.close(); }
