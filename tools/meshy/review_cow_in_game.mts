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
  const hero=G.heroes[0],yard=G.interactables?.find((x:any)=>x.id==='petyard');
  if(yard)hero.place(yard.x+6,yard.z+6);
  const cow=A.animalModel('cow');cow.position.set(hero.pos.x+2, G.world.groundAt(hero.pos.x+2,hero.pos.z+1,hero.pos.y+1),hero.pos.z+1);G.scene.add(cow);
  const wait=async(test:()=>boolean)=>{for(let n=0;n<150;n++){G.paused=false;document.querySelectorAll('.storybook,.dialog,.modal,.reward').forEach(e=>e.remove());if(test())return;await new Promise(r=>setTimeout(r,100));}throw Error('cow model/LOD timeout');};
  const rig=cow.userData.rig;await wait(()=>!!rig.model&&rig.hd===true);
  const start={x:hero.pos.x,z:hero.pos.z};hero.place(cow.position.x+30,cow.position.z);
  await wait(()=>rig.hd===false);hero.place(start.x,start.z);await wait(()=>rig.hd===true);
  (window as any).__cowReview=cow;
  const t=await K.loadWorldModel('creature-cow-hd');
  return {nearLoaded:true,farSwapped:true,nearRestored:true,fallbackHidden:rig.root.visible===false,clips:t.clips.map((c:any)=>c.name)};
 });
 await P.page.waitForTimeout(500);await clear(P.page);await P.page.screenshot({path:`${OUT}/cow-${device}.png`});
 results.push({device,...result,errors:P.errors});await P.ctx.close();console.log(device,JSON.stringify(results.at(-1)));
 if(P.errors.length)throw Error(P.errors.join('; '));
}}
finally{await browser.close();writeFileSync(`${OUT}/integration.json`,JSON.stringify(results,null,2)+'\n');}
