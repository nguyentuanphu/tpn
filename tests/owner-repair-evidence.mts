// Matching synthetic-data evidence; run on the pinned baseline and repair candidate.
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { launch, open, start, clear } from './harness.mts';
import { URL as gameURL } from './harness.mts';
import { fileURLToPath } from 'node:url';
const repoRoot = fileURLToPath(new URL('../', import.meta.url));
const phase = process.argv[2] || 'baseline';
// a BEFORE capture (the approved release, or any folder named baseline… or …before…) records what is there; the repair's own assertions apply only to AFTER captures
const isBaseline = /^baseline|before/.test(phase);
const settingsOnly = process.argv.includes('--settings-only');
const audioOnly = process.argv.includes('--audio-only');
const transportOnly = process.argv.includes('--transport-only');
const learningOnly = process.argv.includes('--learning-only');
const activityOnly = process.argv.includes('--activity-only');
const crossingsOnly = process.argv.includes('--crossings-only');
const crossingTargets=process.env.SV_CROSSING_TARGETS?JSON.parse(fs.readFileSync(process.env.SV_CROSSING_TARGETS,'utf8')):null;
if(crossingTargets)for(const set of crossingTargets.town?[crossingTargets]:Object.values(crossingTargets))for(const id of ['town','aussie'])if(!Number.isFinite(set[id]?.x)||!Number.isFinite(set[id]?.z))throw Error('Missing fixed crossing detail target: '+id);
const sourceCommit = execFileSync('git', ['-C', repoRoot, 'rev-parse', '--verify', process.env.SV_EVIDENCE_COMMIT || 'HEAD'], {encoding:'utf8'}).trim();
const sourceFingerprints = {};
// Verify the served code, rather than attributing old pictures from a build label alone.
const servedFiles=execFileSync('git',['-C',repoRoot,'ls-tree','-r','--name-only',sourceCommit,'--','js','css','vendor','fonts','icons','index.html','sw.js','voices/manifest.json','voices/areas.json'],{encoding:'utf8'}).trim().split('\n').filter(Boolean);
if (!servedFiles.length) throw new Error('No source files found for evidence attribution');
for (const file of servedFiles) {
  const expected = execFileSync('git', ['-C', repoRoot, 'show', `${sourceCommit}:${file}`], {maxBuffer:8*1024*1024});
  const response = await fetch(new URL(file, gameURL));
  if (!response.ok) throw new Error(`Evidence source unavailable: ${file} (${response.status})`);
  const actual = Buffer.from(await response.arrayBuffer());
  if (!actual.equals(expected)) throw new Error(`Served evidence source differs from ${sourceCommit}: ${file}`);
  sourceFingerprints[file] = createHash('sha256').update(actual).digest('hex');
}
const dir = path.join(repoRoot, 'docs/owner-repair-20261014/evidence', phase);
fs.mkdirSync(dir, { recursive: true });
const browser = await launch(), results = [];
try {
  const views=[['phone',390,844,true,'en'],['phone',390,844,true,'vi'],['tablet',820,1180,true,'en'],['computer',1280,800,false,'en']];
  if(learningOnly||activityOnly)views.push(['phone-small',320,640,true,'en'],['phone-small',320,640,true,'vi'],['phone-landscape',844,390,true,'vi']);
  for (const [device,w,h,touch,lang] of views) {
    const label = `${device}-${lang}`;
    const P = await open(browser, { w,h,touch,lang,play:false,fast:!crossingsOnly, route:async ctx => {
      await ctx.route('**/content/custom.json*', rt => rt.fulfill({ contentType:'application/json',body:'{}' }));
      await ctx.route('**/api/tester**', rt => rt.fulfill({contentType:'application/json',body:JSON.stringify({ok:true,k:'0123456789abcdef',rid:'evidence-receipt',mine:[],open:[],reports:0})}));
      await ctx.route('**/api/live**', rt => rt.fulfill({contentType:'application/json',body:JSON.stringify({releases:{tester:{on:true,devices:['tester000001']},autoplay:{on:true,devices:['tester000001']}},festivals:{}})}));
      await ctx.route('**/api/hello**', rt => rt.fulfill({status:204}));
    },pre:() => {
      const ps=JSON.parse(localStorage.getItem('sv2_profiles')||'[]'); ps.forEach((p,i)=>{p.name=`Demo ${i+1}`;p.photo=null;}); localStorage.setItem('sv2_profiles',JSON.stringify(ps));
      localStorage.setItem('sv2_playerid','tester000001');localStorage.setItem('sv2_tester',JSON.stringify({at:1,b:'r1'}));localStorage.setItem('sv2_live',JSON.stringify({releases:{tester:{on:true,devices:['tester000001']},autoplay:{on:true,devices:['tester000001']}},festivals:{}}));
    }});
    const shot = async name => { await P.page.evaluate(() => document.fonts.ready); await P.page.waitForTimeout(550); await P.page.screenshot({path:path.join(dir,`${label}-${name}.png`)}); };
    if(crossingsOnly) {
      await start(P.page);await clear(P.page);const states=[];
      for(const id of ['town','aussie']) {
        const state=await P.page.evaluate(async id=>{
          const G=__sv,h=G.heroes[0],W=await import('/js/world.js'),S=(await import('/js/state.js')).settings,p=id==='town'?W.TOWN:W.AUSSIE;
          S.camMode='free';G.paused=false;G.world.time=.4;h.goal=null;h.speed=0;h.view='follow';h.zoom=1;G.zoom=1;h.camYaw=-2.5;h.camPitch=.55;h.camDist=innerWidth<500?24:18;h.manualCamT=1000000;h.place(p.x-6,p.roadZ-5);
          return {id,crossing:{x:p.x-4,z:p.roadZ},hero:{x:h.pos.x,z:h.pos.z},camera:{yaw:h.camYaw,pitch:h.camPitch,distance:h.camDist},warnings:G.crossings?.list.find(c=>c.id===id)?.signs||[],missing:G.crossings?.missing||[],renderPixelRatio:G.renderer.getPixelRatio()};
        },id);
        await P.page.waitForTimeout(2500);await clear(P.page);await P.page.waitForTimeout(1000);
        state.actualFrame=await P.page.evaluate(async id=>{const G=__sv,h=G.heroes[0],W=await import('/js/world.js'),{THREE}=await import('/js/gfx.js'),p=id==='town'?W.TOWN:W.AUSSIE,projected=new THREE.Vector3(p.x-4,W.heightAt(p.x-4,p.roadZ)+.1,p.roadZ).project(h.cam);return {avatar:{x:h.av.root.position.x,z:h.av.root.position.z},hero:{x:h.pos.x,z:h.pos.z},camera:{x:h.cam.position.x,y:h.cam.position.y,z:h.cam.position.z},crossingProjection:{x:projected.x,y:projected.y,z:projected.z},paused:G.paused};},id);
        const f=state.actualFrame;if(Math.hypot(f.avatar.x-f.hero.x,f.avatar.z-f.hero.z)>.2||Math.abs(f.crossingProjection.x)>.9||Math.abs(f.crossingProjection.y)>.9||f.crossingProjection.z>1)throw Error('Crossing capture fixture is not actually framing the crossing: '+JSON.stringify(f));
        state.inspectionViews=[];
        for(const detail of [false,true]) {
          const inspection=await P.page.evaluate(async({id,detail,fixed})=>{
            const G=__sv,h=G.heroes[0],W=await import('/js/world.js'),{THREE}=await import('/js/gfx.js'),p=id==='town'?W.TOWN:W.AUSSIE,x=p.x-4,z=p.roadZ,y=W.heightAt(x,z),phone=innerWidth<500;
            G.paused=true;h.goal=null;
            const target=detail?(fixed?new THREE.Vector3(fixed.x,W.heightAt(fixed.x,fixed.z)+2.3,fixed.z):new THREE.Vector3(x+5.2,y+2.2,z-5)):new THREE.Vector3(x,y+.15,z);
            const position=detail?new THREE.Vector3(target.x+3,target.y+2.3,target.z+7):new THREE.Vector3(x+(phone?18:14),y+(phone?30:23),z+(phone?24:19));
            h.cam.position.copy(position);h.cam.lookAt(target);h.cam.updateMatrixWorld(true);h.camPos.copy(position);h.camLook=target.clone();
            G.scene.updateMatrixWorld(true);
            const distance=position.distanceTo(target),ray=new THREE.Raycaster(position,target.clone().sub(position).normalize(),.1,distance-.25);
            const meshes=[];G.scene.traverse(o=>{if(o.isMesh)meshes.push(o);});
            const blocker=ray.intersectObjects(meshes,false).find(hit=>{const o=hit.object;if(!o.isMesh)return false;for(let q=o;q;q=q.parent)if(!q.visible)return false;const mats=Array.isArray(o.material)?o.material:[o.material];return mats.some(m=>m&&m.visible!==false&&(m.opacity??1)>.95);});
            if(blocker)throw Error('Inspection camera target occluded by actual geometry at '+JSON.stringify({distance:blocker.distance,point:blocker.point}));
            return {detail,target:{x:target.x,y:target.y,z:target.z},position:{x:position.x,y:position.y,z:position.z},clearLineOfSight:true};
          },{id,detail,fixed:crossingTargets?.[label]?.[id]||crossingTargets?.[id]||state.warnings.find(s=>s.side===-1)||null});
          await shot('crossing-'+id+(detail?'-approach':'-overview'));
          const actual=await P.page.evaluate(()=>({x:__sv.heroes[0].cam.position.x,y:__sv.heroes[0].cam.position.y,z:__sv.heroes[0].cam.position.z}));
          if(Math.hypot(actual.x-inspection.position.x,actual.y-inspection.position.y,actual.z-inspection.position.z)>.05)throw Error('Inspection camera moved during screenshot');state.inspectionViews.push({...inspection,actual});
        }
        states.push(state);
      }
      results.push({device,w,h,lang,sourceCommit,sourceFingerprints,capturedAt:new Date().toISOString(),states,crossingTargets,fixture:'Actual existing road crossings; fixed inspection camera, verified avatar/target line of sight and camera pose, daytime, synthetic Demo players; normal renderer resolution',errors:P.errors});
      if(P.errors.length)throw Error('Page errors in attributed crossing evidence: '+P.errors.join(' | '));
      console.log(`${phase} ${label}: captured actual crossing overviews and approaches`);await P.ctx.close();continue;
    }
    if(learningOnly||activityOnly) {
      await start(P.page);await clear(P.page);const states=[];
      for(const id of activityOnly?['counting']:['patternpicnic','shapebuilders','remembergarden']) {
        const available=await P.page.evaluate(async id=>!!(await import('/js/games/frame.js')).GAMES[id],id);
        if(!available){states.push({id,available:false,note:'New activity has no gameplay in this source; no Before image manufactured'});continue;}
        if(activityOnly){await P.page.evaluate(async()=>{const V=await import('/js/voice.js'),S=await import('/js/state.js');V.spoken.forEach(f=>f(S.settings.lang==='vi'?'Một món quà bất ngờ đang đợi con trong thung lũng.':'A surprise gift is waiting in the valley.'));});await P.page.waitForTimeout(30);}
        await P.page.evaluate(id=>{const random=Math.random;Math.random=()=>.5;try{const p=__sv.heroes[0].profile;p.age='little';p.levels[id]=1;p.gameDiff={...p.gameDiff,[id]:'easy'};window.__captureGame=__sv.playGame(0,id,'replay');}finally{Math.random=random;}},id);await P.page.waitForSelector('.gl-stage');await shot(id+'-initial');
        const layout=await P.page.evaluate(()=>{const rect=s=>{const e=document.querySelector(s);if(!e)return null;const r=e.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height};};return {header:rect('.gl-head'),guidance:rect('.gl-help'),stage:rect('.gl-stage'),stars:rect('.gl .starbox'),worldCaption:!!document.querySelector('.caption.show')};});
        if(learningOnly&&id==='shapebuilders') {
          await P.page.locator('.bt-piece').filter({has:P.page.locator('svg path')}).first().click();await P.page.waitForFunction(()=>!!document.querySelector('.bt-slot:not([disabled])')?.onclick);await P.page.locator('.bt-slot:not([disabled])').click();await P.page.waitForFunction(()=>document.querySelector('.bt-slot')?.disabled);await shot(id+'-placed-piece');
        }
        states.push({id,available:true,mode:'under-5',layout});await P.page.locator('.gl-x').click();await P.page.waitForSelector('.gl',{state:'detached'});await clear(P.page);
        if(learningOnly&&id==='remembergarden') {
          await P.page.evaluate(id=>{const p=__sv.heroes[0].profile;p.age='big';p.levels[id]=1;p.gameDiff[id]='medium';window.__captureGame=__sv.playGame(0,id,'replay');},id);await P.page.waitForSelector('.gl-stage');await shot(id+'-model');
          await P.page.getByRole('button',{name:/Ready to try|Sẵn sàng thử/}).click();await shot(id+'-recall');await P.page.getByRole('button',{name:/Show again|Xem lại/}).click();await shot(id+'-replay');
          await P.page.locator('.gl-x').click();await P.page.waitForSelector('.gl',{state:'detached'});await clear(P.page);
        }
      }
      results.push({device,w,h,lang,sourceCommit,sourceFingerprints,capturedAt:new Date().toISOString(),states,fixture:activityOnly?'Controlled queued valley caption and deterministic real counting activity entrance':'New learning activities through the real game entrance; deterministic choices; model/place/recall/replay states',errors:P.errors});
      if(P.errors.length)throw Error('Page errors in attributed evidence: '+P.errors.join(' | '));
      console.log(`${phase} ${label}: captured ${states.length} activity states`);await P.ctx.close();continue;
    }
    if (settingsOnly) {
      await P.page.evaluate(async () => (await import('/js/ui.js')).openGrownups()); await P.page.waitForSelector('.grownups #gDone');
      await shot('settings');
      await P.page.evaluate(() => { const root = document.querySelector('.grownups-body') || document.querySelector('.grownups'); root.scrollTop = root.scrollHeight; }); await shot('settings-note');
      results.push({device,w,h,lang,sourceCommit,sourceFingerprints,capturedAt:new Date().toISOString(),state:'grownups-settings-and-bottom-note',errors:P.errors});
      console.log(`${phase} ${label}: captured settings and bottom note`); await P.ctx.close(); continue;
    }
    if (transportOnly) {
      await start(P.page); await clear(P.page);
      const rides=[];
      for(const kind of ['bus','busAU','tramModern']) {
        await P.page.evaluate(kind=>{const G=__sv,h=G.heroes[0],it=G.interactables.find(i=>/^ride_/.test(i.id)&&G.traffic.slots[+i.id.slice(5)].id===kind);if(!it)throw Error('Missing transport '+kind);h.place(it.x+2,it.z);window.__evidenceRide=it.act(h,G);},kind);
        await P.page.locator('.dialog .dchoices button').first().click();
        await P.page.locator('.stoppick [data-next]').click();
        await P.page.evaluate(async()=>{await window.__evidenceRide;const G=__sv,h=G.heroes[0],sl=G.traffic.slots.find(s=>s.passenger===h);if(!sl)throw Error('Not boarded');sl.mover.wait=100;});
        await P.page.waitForTimeout(1600);await shot(`transport-${kind}-rider`);
        const state=await P.page.evaluate(()=>{const G=__sv,h=G.heroes[0],sl=G.traffic.slots.find(s=>s.passenger===h);return {pov:h._pov,carried:!!h.carry,vehicle:sl?.id,age:h.profile.age};});
        if(!state.pov||state.vehicle!==kind)throw Error('Missing actual rider view '+kind);
        await P.page.evaluate(()=>{const G=__sv,h=G.heroes[0];h.update(1/60,{cdx:0,cdy:0,mx:0,mz:0,jump:()=>true},0,G);});
        await P.page.waitForTimeout(1600);await shot(`transport-${kind}-exit`);rides.push({kind,state});
      }
      results.push({device,w,h,lang,sourceCommit,sourceFingerprints,capturedAt:new Date().toISOString(),rides,errors:P.errors});
      console.log(`${phase} ${label}: actual bus/busAU/tram rider and exit captures`);await P.ctx.close();continue;
    }
    if (audioOnly) {
      await start(P.page);await clear(P.page);
      await P.page.evaluate(()=>__sv.openSound(document.querySelector('.dk.snd')));
      await shot('audio-off');
      for(const k of ['music','sound','voice'])await P.page.locator(`.audio-tray [data-k="${k}"]`).click();
      await shot('audio-on');
      const bounds=await P.page.locator('.audio-tray').boundingBox();
      results.push({device,w,h,lang,sourceCommit,sourceFingerprints,capturedAt:new Date().toISOString(),state:'three-audio-icons-off-and-on',bounds,errors:P.errors});
      console.log(`${phase} ${label}: captured Audio off/on`);await P.ctx.close();continue;
    }
    await shot('welcome');
    await P.page.click('.screen.title .press', {force:true}); await P.page.waitForSelector('.screen.who');
    await P.page.waitForTimeout(650); await shot('selection');
    const bounds = () => P.page.evaluate(() => { const r=document.querySelector('.who-card').getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height}; });
    const before=await bounds(); await P.page.locator('.pick[data-id]').first().click(); await P.page.waitForTimeout(150);const after=await bounds();
    if (!isBaseline && (Math.abs(before.y-after.y)>1 || Math.abs(before.height-after.height)>1)) throw new Error('Selection shell moved across redraw');
    const selection=await P.page.evaluate(()=>({scrollHeight:document.querySelector('.who-body')?.scrollHeight,height:document.querySelector('.who-body')?.clientHeight,labels:[...document.querySelectorAll('.pick span:last-of-type')].map(x=>({text:x.textContent,y:x.getBoundingClientRect().y,height:x.getBoundingClientRect().height}))}));
    await P.page.evaluate(async () => { const S=await import('/js/state.js'); S.profiles.forEach(p=>p.screen='valley'); __sv._owlAuto=true; }); await P.page.click('.who .go'); await P.page.waitForFunction(()=>__sv.heroes.length>0);
    await clear(P.page);
    for (const [name,action] of [['bag',()=>__sv.openPad(0,'bag')],['shop',()=>{__sv.openPad(0,'bag');document.querySelector('.pad [data-t="shop"]').click();}],['audio',()=>__sv.openSound(document.querySelector('.dk.snd'))]]) {
      await clear(P.page); await P.page.evaluate(action); await P.page.waitForTimeout(550); await shot(name);
      if(name==='shop' && !isBaseline) {
        const optical=await P.page.evaluate(async()=>{const img=document.querySelector('.shop-preview');await img.decode();const c=document.createElement('canvas');c.width=img.naturalWidth;c.height=img.naturalHeight;const x=c.getContext('2d');x.drawImage(img,0,0);const d=x.getImageData(0,0,c.width,c.height).data,bg=[d[0],d[1],d[2]];let minY=c.height,maxY=0;for(let y=0;y<c.height;y++)for(let px=0;px<c.width;px++){const i=(y*c.width+px)*4;if(Math.max(...bg.map((v,k)=>Math.abs(d[i+k]-v)))>45){minY=Math.min(minY,y);maxY=Math.max(maxY,y);}}return {height:c.height,visibleHeight:maxY-minY};});
        if(optical.visibleHeight<optical.height*.55)throw new Error('Outfit preview remains optically too small: '+JSON.stringify(optical));
      }
      if (name==='audio' && !isBaseline) {if(await P.page.locator('.dk.mus:visible').count())throw new Error('Duplicate Music entrance');const r=await P.page.locator('.audio-tray').boundingBox();if(r.x<11 || r.x+r.width>w-11 || r.y<11 || r.y+r.height>h-11)throw new Error('Audio outside safe viewport: '+JSON.stringify(r));}
      if (name==='bag') await P.page.waitForSelector('.pad', {state:'visible'});
      if(name==='shop'){await P.page.click('[data-go="wardrobe"]');await P.page.waitForTimeout(400);await shot('mirror');await P.page.evaluate(()=>document.querySelectorAll('.wardrobe').forEach(x=>x.remove()));}
    }
    await clear(P.page); await P.page.waitForFunction(()=>__sv.tester&&__sv.autoplay,{timeout:15000});
    await P.page.evaluate(()=>__sv.tester.openPanel(0));await P.page.waitForSelector('.tpanel');await shot('tester');
    if(!isBaseline && await P.page.locator('.audio-tray').count())throw new Error('Audio competes with reporting panel');
    if(!isBaseline) {
      await P.page.fill('.tpanel textarea','Synthetic report draft');await P.page.click('[data-test-tab="autoplay"]');await shot('autoplay');
      await P.page.click('[data-test-tab="tester"]');
      if(await P.page.inputValue('.tpanel textarea')!=='Synthetic report draft')throw new Error('Report draft lost across tabs');
    }
    const build=await P.page.evaluate(async()=>(await import('/js/build.js')).BUILD);
    results.push({device,w,h,lang,build,sourceCommit,sourceFingerprints,capturedAt:new Date().toISOString(),before,after,selection,errors:P.errors});
    console.log(`${phase} ${label}: captured welcome, selection, bag, shop, audio`);
    await P.ctx.close();
  }
} finally { await browser.close();fs.writeFileSync(path.join(dir,crossingsOnly?'crossing-results.json':learningOnly?'learning-results.json':activityOnly?'activity-results.json':transportOnly ? 'transport-results.json' : settingsOnly ? 'settings-results.json' : audioOnly ? 'audio-results.json' : 'results.json'),JSON.stringify(results,null,2)); }
