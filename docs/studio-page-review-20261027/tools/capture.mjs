// Review capture only: real Studio UI/routes, synthetic records and in-memory providers.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {launch} from '../../../tests/harness.mjs';
import {fakeGitHub,routeGitHub,fakeNetlify,memoryBlobs} from '../../../tests/studio-check.mjs';
import {MemoryManagementTestDatabase} from '../../../netlify/lib/management/storage/memory-test.mts';
import {createFinanceService} from '../../../netlify/lib/management/finance.mts';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../../..');
const out=path.resolve(root,'docs/studio-page-review-20261027');
const selected=(process.argv.find(a=>a.startsWith('--only='))||'').slice(7).split(',').filter(Boolean);
const previous=selected.length&&fs.existsSync(path.join(out,'captures.json'))?JSON.parse(fs.readFileSync(path.join(out,'captures.json'),'utf8')):null;
const repo='synthetic/studio-page-review',password='synthetic-review-password-only',site='http://localhost:8798';
const app=fs.readFileSync(path.join(root,'studio/ui/app.ts'),'utf8');
const about=app.slice(app.indexOf('const ABOUT = {'),app.indexOf('\n};',app.indexOf('const ABOUT = {')));
const pages=[...about.matchAll(/^  ([a-z]+):\s*\['[^']*',\s*'((?:\\.|[^'])*)'/gm)].map(m=>({key:m[1],title:m[2].replaceAll("\\'","'")}));
if(pages.length!==41)throw Error('Expected all 41 Studio pages; discovered '+pages.length);
const groups={Home:['home'],Family:['message','missions','children','album','quiz','stories','villagers','plots','familycode'],Game:['releases','lab','festivals','looks','path','music','map','photos','play','voices','ads'],Analytics:['management','managementdevices','managementchildren','managementattention','managementactivities','managementactivity','managementdevice','managementrelease','managementoperations','managementfinance','managementchanges','players','testers'],Setup:['publish','site','check','settings','admins','security','accesslog']};
const groupOf=k=>Object.keys(groups).find(g=>groups[g].includes(k))||'Setup';
pages.sort((a,b)=>Object.keys(groups).indexOf(groupOf(a.key))-Object.keys(groups).indexOf(groupOf(b.key))||groups[groupOf(a.key)].indexOf(a.key)-groups[groupOf(b.key)].indexOf(b.key));
const files={'content/custom.json':'{}','studio/version.json':fs.readFileSync(path.join(root,'studio/version.json')),'sw.js':fs.readFileSync(path.join(root,'sw.js'))};
function scripts(dir){for(const e of fs.readdirSync(path.join(root,dir),{withFileTypes:true})){const rel=dir+'/'+e.name;if(e.isDirectory())scripts(rel);else if(e.name.endsWith('.js'))files[rel]=fs.readFileSync(path.join(root,rel));}}
scripts('js');files['content/management-catalogue.json']=fs.readFileSync(path.join(root,'content/management-catalogue.json'));
const gh=fakeGitHub(repo,files);
// Public game media is indexed lazily: accurate file counts without loading hundreds of MB for screenshots.
const media=execFileSync('git',['ls-tree','-r','35bffe6a','--','voices','photos'],{cwd:root,encoding:'utf8',maxBuffer:20e6}).trim().split('\n').filter(Boolean).map(row=>{const [meta,name]=row.split('\t');return {name,sha:meta.split(' ')[2]};});
const bySha=new Map(media.map(m=>[m.sha,m.name])),byPath=new Map(media.map(m=>[m.name,m.sha])),originalHandle=gh.handle;
gh.handle=async(method,url,body)=>{
 const u=new URL(url),p=decodeURIComponent(u.pathname);
 if(method==='GET'){
  const sha=p.split('/git/blobs/')[1],file=p.split('/contents/')[1],name=bySha.get(sha)|| (byPath.has(file)?file:null);
  if(name){const buf=fs.readFileSync(path.join(root,name));return {status:200,j:{type:'file',name:name.split('/').pop(),path:name,sha:byPath.get(name),size:buf.length,encoding:'base64',content:buf.toString('base64')}};}
  if(file&&media.some(m=>m.name.startsWith(file+'/'))){const children=new Map();for(const m of media.filter(m=>m.name.startsWith(file+'/'))){const rest=m.name.slice(file.length+1),first=rest.split('/')[0];children.set(first,{type:rest.includes('/')?'dir':'file',name:first,path:file+'/'+first,sha:m.sha});}return {status:200,j:[...children.values()]};}
 }
 const result=await originalHandle(method,url,body);
 if(method==='GET'&&p.includes('/git/trees/')&&result.j?.tree&&u.searchParams.get('recursive')){
  const sub=p.split('/git/trees/')[1].split(':')[1],prefix=sub?sub+'/':'';
  result.j.tree.push(...media.filter(m=>m.name.startsWith(prefix)).map(m=>({path:m.name.slice(prefix.length),type:'blob',sha:m.sha})));
 }
 return result;
};
const unroute=routeGitHub(gh),players=memoryBlobs(),testers=memoryBlobs(),db=new MemoryManagementTestDatabase();
const today=new Date().toISOString().slice(0,10),month=today.slice(0,7),device='review123456',profile='review-child';
await players.setJSON('info/'+device,{first:today,last:today,build:'v1.02',kind:'tablet',os:'iOS',br:'Safari'});
await players.set('label/'+device,'Synthetic review tablet');
await players.setJSON('d/'+today+'/'+device,{mins:18,tales:1,build:'v1.02',builds:{'v1.02':true},kind:'tablet',games:{oanquan:2},children:{[profile]:{n:'Demo',a:'little',m:18,g:{oanquan:[2,1,0]},t:1}}});
await testers.setJSON('p/1234567890abcdef',{k:'1234567890abcdef',title:'Synthetic review report',kind:'auto',auto:'error',n:1,status:'new',firstAt:Date.now(),lastAt:Date.now(),where:{game:'oanquan'},builds:['v1.02'],devices:[device]});
const finance=createFinanceService({database:db});await finance.configure({expectedRevision:0,reportingCurrency:'AUD',reason:'Synthetic screenshot review only'},'Synthetic owner');
const input={expectedSettingsRevision:1,lines:[{schemaVersion:1,provider:'ExampleOnly',accountAlias:'synthetic-review',sourceDocumentId:'DEMO-ONLY-INVOICE',sourceLineId:'1',kind:'actual',amountMinor:12000,currency:'AUD',taxMinor:1200,periodStart:month+'-01',periodEnd:today,recognisedAt:today+'T00:00:00Z',paidAt:null,category:'hosting',expectedRevision:0,costType:'fixed',reconciled:false,voided:false,settles:null}]};
const preview=await finance.preview(input);await finance.commit({...input,previewHash:preview.previewHash,operationId:crypto.randomUUID(),reason:'Synthetic screenshot fixture only'},'Synthetic owner');
const server=await fakeNetlify({port:8798,players,testerStore:testers,managementDatabase:db,env:{STUDIO_PASSWORD:password,GITHUB_TOKEN:'synthetic-token',GITHUB_REPO:repo,URL:site,AZURE_SPEECH_KEY:'',NETLIFY_AUTH_TOKEN:'',NETLIFY_TOKEN:''}});
const browser=await launch();const results=[],errors=[];
const states=[{key:'login',title:'Sign in',group:'Home',login:true},...pages.map(p=>({...p,group:groupOf(p.key)})),...['family','game','setup'].map(key=>({key:key+'-menu',route:key,title:key[0].toUpperCase()+key.slice(1)+' section menu',group:key[0].toUpperCase()+key.slice(1)}))];
try{
 for(const [size,width,height]of [['desktop',1440,1000],['tablet',820,1180],['phone',390,844]]){
  const dir=path.join(out,'screenshots',size);fs.mkdirSync(dir,{recursive:true});
  const ctx=await browser.newContext({viewport:{width,height},isMobile:size==='phone',hasTouch:size!=='desktop'}),pg=await ctx.newPage();
  pg.on('pageerror',e=>errors.push({size,page:pg.url(),error:e.message}));
  await ctx.route('**/*',route=>{const u=new URL(route.request().url());return ['localhost','127.0.0.1'].includes(u.hostname)||['data:','blob:'].includes(u.protocol)?route.continue():route.abort();});
  await pg.addInitScript(()=>localStorage.setItem('studioLang','en'));
  await pg.goto(site+'/studio');await pg.waitForSelector('#pw');
  await pg.screenshot({path:path.join(dir,'login.png'),fullPage:true});
  results.push({size,width,height,key:'login',title:'Sign in',group:'Home',image:'screenshots/'+size+'/login.png',notes:['Synthetic sign-in; no real password or account.']});
  await pg.fill('#pw',password);await pg.click('#si button');await pg.waitForSelector('#tabs button');
  for(const item of states.filter(s=>!s.login&&(!selected.length||selected.includes(s.key)))){
   let hash=item.route||item.key;
   if(item.key==='managementdevice')hash+='?id='+device;
   if(item.key==='managementactivity')hash+='?id=oanquan';
   if(item.key==='managementrelease')hash+='?id=v1.02';
   await pg.evaluate(hash=>{document.querySelector('#page').innerHTML='';location.hash=hash;},hash);
   const ready=await pg.waitForFunction(menu=>!!document.querySelector('#page .studio-help')||!!document.querySelector('#page .badtxt')||(menu&&!!document.querySelector('#page h2')),!!item.route,{timeout:20000}).then(()=>true,()=>false);
   await pg.waitForTimeout(item.key==='map'?1800:650);
   await pg.evaluate(()=>window.scrollTo(0,0));
   const viewport='screenshots/'+size+'/'+item.key+'-viewport.png';
   await pg.screenshot({path:path.join(out,viewport)});
   const notes=[];let collapsed=false;
   const before=await pg.evaluate(()=>document.documentElement.scrollHeight);
   if(before>14000){collapsed=true;await pg.evaluate(()=>document.querySelectorAll('#page details').forEach(d=>d.open=false));await pg.waitForTimeout(150);notes.push('Long page: full overview closes sections to show every category; viewport image preserves the default open view.');}
   if(item.key==='managementfinance'){await pg.locator('[data-fin-controls] details').evaluateAll(nodes=>nodes.forEach(n=>n.open=false));notes.push('Long finance entry forms closed in the overview; default viewport retained.');}
   const image='screenshots/'+size+'/'+item.key+'.png';
   await pg.evaluate(()=>window.scrollTo(0,0));await pg.screenshot({path:path.join(out,image),fullPage:true});
   const observation=await pg.evaluate(()=>({heading:document.querySelector('#page h2')?.textContent||'',messages:[...document.querySelectorAll('#page .badtxt,#page .mg-error')].map(e=>e.textContent.trim().slice(0,220)),overflow:document.documentElement.scrollWidth>innerWidth+1,height:document.documentElement.scrollHeight}));
   if(!ready)notes.push('Page readiness wait timed out; inspect the image.');
   if(observation.messages.length)notes.push('Unavailable/error state is shown honestly; see captured messages.');
   if(observation.overflow)notes.push('Horizontal page overflow observed; flagged for review.');
   results.push({size,width,height,key:item.key,title:item.title,group:item.group,image,viewport,ready,collapsed,...observation,notes});
   fs.writeFileSync(path.join(out,'capture-progress.json'),JSON.stringify({captured:results.length,total:states.length*3,current:size+'/'+item.key},null,2)+'\n');
   console.log('Captured '+size+' / '+item.key);
  }
  await ctx.close();
 }
}finally{
 await browser.close();unroute();await new Promise(r=>server.close(r));
 const combined=[...new Map([...(previous?.results||[]),...results].map(r=>[r.size+'/'+r.key,r])).values()];
 fs.writeFileSync(path.join(out,'captures.json'),JSON.stringify({capturedAt:new Date().toISOString(),applicationCommit:'35bffe6ad5d8ca757ed60a49be670bca08b38f86',scope:'Online Studio with real UI/routes and clearly synthetic in-memory records/providers; no production sign-in, database or writes',viewports:[1440,820,390],language:'en',pageCount:pages.length,sectionMenuCount:3,results:combined,errors:[...(previous?.errors||[]),...errors]},null,2)+'\n');
}
console.log('Finished '+results.length+' captures across all '+pages.length+' pages, 3 section menus and sign-in; browser errors: '+errors.length);
