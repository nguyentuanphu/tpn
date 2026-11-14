// Cow integration evidence: the real valley, loader/LOD, on phone/tablet/computer.
// node tools/meshy/review_cow_in_game.mts OUT, with SV_URL and CHROMIUM configured.
import { launch, open, clear } from '../../tests/harness.mts';
import { mkdirSync, writeFileSync } from 'node:fs';
const OUT=process.argv[2]; mkdirSync(OUT,{recursive:true});
const browser=await launch();const results=[];
try {for(const [device,w,h] of [['phone',390,844],['tablet',820,1180],['computer',1180,820]] as const){
 const P=await open(browser,{w,h,touch:device!=='computer',fast:true});await clear(P.page);
 const result=await P.page.evaluate(async()=>{
  const G=(window as any).__sv,A=await import(String('/js/animals.js')),K=await import(String('/js/modelkit.js'));
  const hero=G.heroes[0];hero.profile.questFold=true;hero.walkTo=null;const yard=G.interactables?.find((x:any)=>x.id==='petyard');
  if(yard)hero.place(yard.x+6,yard.z+6);
  const cow=A.animalModel('cow');cow.position.set(hero.pos.x+2, G.world.groundAt(hero.pos.x+2,hero.pos.z-1,hero.pos.y+1),hero.pos.z-1);G.scene.add(cow);
  const wait=async(test:()=>boolean)=>{for(let n=0;n<150;n++){G.paused=false;document.querySelectorAll('.storybook,.dialog,.modal,.reward').forEach(e=>e.remove());if(test())return;await new Promise(r=>setTimeout(r,100));}throw Error('cow model/LOD timeout');};
  const {THREE}=await import(String('/js/gfx.js'));
  const reference=A.filmAnimal('cow'); reference.updateMatrixWorld(true);
  const codeBox=new THREE.Box3().setFromObject(reference.userData.rig.root,true),codeSize=codeBox.getSize(new THREE.Vector3());
  const dimensions=[];
  for(const suffix of ['-hd','']){
   const t=await K.loadWorldModel('creature-cow'+suffix); t.scene.updateMatrixWorld(true);
   const box=new THREE.Box3().setFromObject(t.scene,true),size=box.getSize(new THREE.Vector3());
   for(const axis of ['x','y','z'])if(Math.abs(size[axis]-codeSize[axis])>(axis==='y'?.12:.3)*codeSize[axis])throw Error('cow dimension '+axis+' '+suffix+' model='+size.toArray().join(',')+' reference='+codeSize.toArray().join(','));
   if(Math.abs(box.min.y-codeBox.min.y)>.04*Math.max(codeSize.x,codeSize.y,codeSize.z))throw Error('cow feet offset');
   dimensions.push({tier:suffix||'far',size:size.toArray(),feet:box.min.y});
  }
  const rig=cow.userData.rig;await wait(()=>!!rig.model&&rig.hd===true);
  const start={x:hero.pos.x,z:hero.pos.z};hero.place(cow.position.x+30,cow.position.z);
  await wait(()=>rig.hd===false);hero.place(start.x,start.z);await wait(()=>rig.hd===true);
  (window as any).__cowReview=cow;
  const t=await K.loadWorldModel('creature-cow-hd');
  const arrows=[];G.scene.traverse(o=>{if(o.geometry?.type==='ConeGeometry'&&Math.abs(o.geometry.parameters?.radius-.45)<.001&&Math.abs(o.geometry.parameters?.height-1.1)<.001)arrows.push({visible:o.visible,color:o.material.color.getHexString()});});if(arrows.some(a=>a.visible))throw Error('Quest guide arrow still visible');
  return {questGuideArrows:arrows,dimensions,nearLoaded:true,farSwapped:true,nearRestored:true,fallbackHidden:rig.root.visible===false,clips:t.clips.map((c:any)=>c.name)};
 });
 await P.page.waitForTimeout(500);await clear(P.page);
 await P.page.evaluate(() => { window.requestAnimationFrame=()=>0; });
 await P.page.waitForTimeout(100);
 await P.page.evaluate(() => {
  const G=(window as any).__sv,cow=(window as any).__cowReview,h=G.heroes[0],R=G.renderer;
  const aspect=innerWidth/innerHeight,d=4.8*Math.max(1,1/aspect);h.cam.fov=42;h.cam.aspect=aspect;h.cam.updateProjectionMatrix();
  h.cam.position.set(cow.position.x+d*.6,cow.position.y+d*.45,cow.position.z+d*.8);
  h.cam.lookAt(cow.position.x-.8,cow.position.y+.65,cow.position.z+.3);
  R.setPixelRatio(1);R.setSize(innerWidth,innerHeight,false);R.setRenderTarget(null);R.setScissorTest(false);R.setViewport(0,0,innerWidth,innerHeight);
  R.render(G.scene,h.cam);
 });
 await P.page.screenshot({path:`${OUT}/cow-${device}.png`});
 results.push({device,...result,errors:P.errors});await P.ctx.close();console.log(device,JSON.stringify(results.at(-1)));
 if(P.errors.length)throw Error(P.errors.join('; '));
}}
finally{await browser.close();writeFileSync(`${OUT}/integration.json`,JSON.stringify(results,null,2)+'\n');}
