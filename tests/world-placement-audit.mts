// Inventory actual rendered positions. Reports suspicions; never relocates or alters family/Studio edits.
import fs from'node:fs/promises';
import path from'node:path';
import {launch,open,clear,noWelcome}from'./harness.mjs';
const phase=process.argv.includes('--baseline')?'baseline':'after';
const root=path.resolve(import.meta.dirname,'..'),out=path.join(root,'docs/world-placement-audit-20261027');await fs.mkdir(out,{recursive:true});
const browser=await launch();
try{
 const P=await open(browser,{w:1100,h:800,settings:{online:false,countPlayers:false,voice:false,autoPack:false}});await clear(P.page);await noWelcome(P.page);
 const data=await P.page.evaluate(async()=>{
  const G=window.__sv,W=await import(String('/js/world.js')),M=await import(String('/js/content/map.js')),R=await import(String('/js/regions.js'));G.paused=true;
  const named=M.PLACES.filter(p=>p.name||['china','india','town','market','village','aussie','home','hoian','uluru'].includes(p.id));
  const nearest=(x:number,z:number)=>named.map(p=>({id:p.id,cc:p.id==='china'?'cn':p.id==='india'?'in':p.cc,at:M.anchorOf(p.id),distance:Math.hypot(M.anchorOf(p.id)[0]-x,M.anchorOf(p.id)[1]-z)})).sort((a,b)=>a.distance-b.distance)[0];
  const landmarks=R.LANDMARKS.map(l=>{
   const x=l.mx??l.x,z=l.mz??l.z,planned=M.landmarkAt(l.id),home=M.LANDMARK_HOME[l.id],actual=nearest(x,z),expected=M.PLACES.find(p=>p.id===home);
   const expectedCountry=home==='china'?'cn':home==='india'?'in':expected?.cc;
   return{id:l.id,name:typeof l.name==='function'?l.name():l.name,declaredCountry:l.cc,home,plannedPlace:M.LANDMARK_AT[l.id]?.place,planned,model:[x,z],sign:[l.x,l.z],modelPointUsesSignFallback:l.mx==null,region:W.regionAt(x,z),nearest:actual,expectedCountry,drift:planned?Math.hypot(x-planned[0],z-planned[1]):null,countryMismatch:!!expectedCountry&&!!actual.cc&&expectedCountry!==actual.cc,homeMismatch:!!home&&actual.id!==home};
  });
  const houses=G.world.houses.map((h,i)=>{const actual=nearest(h.x,h.z),city=h.info?.city,expected=M.PLACES.find(p=>p.name&&(JSON.stringify(p.name)===JSON.stringify(city)||p.name.includes(city)));return{index:i,x:h.x,z:h.z,kind:h.kind,city,expectedCity:expected?.id,region:W.regionAt(h.x,h.z),nearest:actual,declaredCountry:h.kind==='china'?'cn':h.kind==='india'?'in':expected?.cc,studioCustom:!!h.custom};});
  const stalls=G.world.stalls.map((s,i)=>({index:i,keys:Object.keys(s),x:s.x,z:s.z,id:s.id,tap:s.tap,w:s.w,d:s.d,face:s.face,kind:s.kind,place:s.place,cc:s.cc,
    nearestHouse:G.world.houses.map(h=>({x:h.x,z:h.z,kind:h.kind,distance:Math.hypot(h.x-s.x,h.z-s.z)})).sort((a,b)=>a.distance-b.distance)[0],
    seller:G.interactables.filter(i=>i.id===s.tap).map(i=>({x:i.x,z:i.z,r:i.r})),region:W.regionAt(s.x,s.z),nearest:nearest(s.x,s.z)}));
  const interactables=G.interactables.filter(i=>Number.isFinite(i.x)&&Number.isFinite(i.z)).map(i=>({id:i.id,x:i.x,z:i.z,region:W.regionAt(i.x,i.z)}));
  const reported={x:179,z:-134}, probe={...reported,y:G.world.groundAt(reported.x,reported.z)+.1};G.world.collide(probe,.45);
  const obstruction={point:reported,ground:G.world.groundAt(reported.x,reported.z),afterCollision:probe,colliders:G.world.colliders.filter(c=>Math.hypot(c.x-reported.x,c.z-reported.z)<c.r+3),boxes:G.world.boxes.filter(b=>reported.x>b.x0-3&&reported.x<b.x1+3&&reported.z>b.z0-3&&reported.z<b.z1+3)};
  return{mapVersion:M.MAP_VERSION,myHouse:{position:[W.HOME.x,W.HOME.z+14]},obstruction,places:M.PLACES.map(p=>({...p,anchor:M.anchorOf(p.id)})),landmarks,houses,stalls,interactables};
 });
 const suspicions=data.landmarks.filter(l=>l.countryMismatch||l.drift>25||l.plannedPlace&&l.home&&l.plannedPlace!==l.home);
 await fs.writeFile(path.join(out,phase+'.json'),JSON.stringify({capturedAEDT:new Date().toLocaleString('en-AU',{timeZone:'Australia/Sydney'}),...data,suspicions,errors:P.errors},null,2)+'\n');
 for(const id of['terracotta','onepillar','turtle','bondi','myhouse','obstruction']){
  const record=id==='myhouse'?{model:data.myHouse.position}:id==='obstruction'?{model:[179,-134]}:data.landmarks.find(l=>l.id===id);if(!record)continue;
  const png=await P.page.evaluate(async({x,z,front})=>{
   const G=window.__sv,{THREE}=await import(String('/js/gfx.js')),{heightAt}=await import(String('/js/world.js'));const R=G.renderer,oldRatio=R.getPixelRatio(),oldSize=R.getSize(new THREE.Vector2()),oldViewport=R.getViewport(new THREE.Vector4());
   try{R.setPixelRatio(1);R.setSize(900,700,false);R.setViewport(0,0,900,700);const c=new THREE.PerspectiveCamera(50,900/700,.1,600),y=heightAt(x,z);c.layers.enable(1);c.position.set(x+(front?14:28),y+(front?14:30),z+(front?-18:35));c.lookAt(x,y+2,z);R.render(G.scene,c);return R.domElement.toDataURL('image/png').split(',')[1];}
   finally{R.setPixelRatio(oldRatio);R.setSize(oldSize.x,oldSize.y,false);R.setViewport(oldViewport);}
  },{x:record.model[0],z:record.model[1],front:id==='myhouse'});
  await fs.writeFile(path.join(out,id+'-'+phase+'.png'),Buffer.from(png,'base64'));
 }
 // Inspect every stall from a street-facing camera, before and after the real see-through logic.
 for(const faded of[false,true]){
  const png=await P.page.evaluate(async faded=>{
   const G=window.__sv as unknown as import('../js/main.js').SvMain,{THREE}=await import(String('/js/gfx.js')),{heightAt}=await import(String('/js/world.js'));
   const R=G.renderer,oldRatio=R.getPixelRatio(),oldSize=R.getSize(new THREE.Vector2()),sheet=document.createElement('canvas');sheet.width=1440;sheet.height=Math.ceil(G.world.stalls.length/6)*204;const ctx=sheet.getContext('2d')!;ctx.fillStyle='#fff6e7';ctx.fillRect(0,0,sheet.width,sheet.height);
   try{R.setPixelRatio(1);R.setSize(480,360,false);R.setViewport(0,0,480,360);R.setScissorTest(false);G.scene.updateMatrixWorld(true);
    for(const[index,s]of G.world.stalls.entries()){
     G.seeThrough.step(1);const y=heightAt(s.x,s.z),fx=Math.sin(s.face||0),fz=Math.cos(s.face||0),c=new THREE.PerspectiveCamera(50,4/3,.1,400);c.layers.enable(1);c.position.set(s.x+fx*11+fz*3,y+7,s.z+fz*11-fx*3);c.lookAt(s.x,y+1.4,s.z);
     if(faded){const a=new THREE.Vector3(s.x+fx*3,y+1.2,s.z+fz*3);G.seeThrough.mark(a,c.position);G.seeThrough.markNearStall(a,c.position);G.seeThrough.step(1);}
     R.setViewport(0,0,480,360);R.setScissorTest(false);R.render(G.scene,c);const x=index%6*240,z=Math.floor(index/6)*204;ctx.drawImage(R.domElement,x,z,240,180);ctx.fillStyle='#443262';ctx.font='bold 13px sans-serif';ctx.fillText(s.id+' · '+s.place,x+6,z+197,230);
    }return sheet.toDataURL('image/png').split(',')[1];
   }finally{G.seeThrough.step(1);R.setPixelRatio(oldRatio);R.setSize(oldSize.x,oldSize.y,false);R.setViewport(0,0,oldSize.x,oldSize.y);}
  },faded);
  await fs.writeFile(path.join(out,'all-stalls-'+(faded?'see-through':'normal')+'.png'),Buffer.from(png,'base64'));
 }
 await P.page.evaluate(()=>{const G=window.__sv as unknown as import('../js/main.js').SvMain,h=G.heroes[0];h.profile.houseGuideSeen=true;h.profile.homeDeco={0:'teddy',1:'lamp',2:'clock',3:'lotus',4:'rainbow',5:'painting',6:'lantern',7:'star'};G.myHouse.home.owner=h;G.homes.enter(h,G.myHouse.home);});
 await P.page.waitForTimeout(1500);
 const interior=await P.page.evaluate(async()=>{const G=window.__sv as unknown as import('../js/main.js').SvMain,{THREE}=await import(String('/js/gfx.js')),M=await import(String('/js/content/map.js')),[x,z,y]=M.WORLD.rooms,R=G.renderer;R.setPixelRatio(1);R.setSize(1000,750,false);R.setViewport(0,0,1000,750);R.setScissorTest(false);const c=new THREE.PerspectiveCamera(45,4/3,.1,300);c.layers.enable(1);c.position.set(x+9,y+15,z+17);c.lookAt(x,y+.8,z);R.render(G.scene,c);return R.domElement.toDataURL('image/png').split(',')[1];});
 await fs.writeFile(path.join(out,'myhouse-interior.png'),Buffer.from(interior,'base64'));
 await P.ctx.close();console.log(JSON.stringify({counts:{places:data.places.length,landmarks:data.landmarks.length,houses:data.houses.length,stalls:data.stalls.length,interactables:data.interactables.length},suspicions:suspicions.map(l=>({id:l.id,home:l.home,nearest:l.nearest.id,region:l.region,drift:l.drift})),errors:P.errors}));
}finally{await browser.close();}
