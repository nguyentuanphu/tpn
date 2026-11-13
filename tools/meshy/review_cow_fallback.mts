// Verify actual creature fallback with both cow GLBs unavailable; no model changes.
import {launch,open,clear} from '../../tests/harness.mts';
import {writeFileSync} from 'node:fs';
const browser=await launch();
try {
 const P=await open(browser,{fast:true,route:async ctx=>{await ctx.route('**/models/world/creature-cow*.glb',r=>r.abort());}});
 await clear(P.page);
 const result=await P.page.evaluate(async()=>{
  const G=(window as any).__sv,A=await import(String('/js/animals.js')),K=await import(String('/js/modelkit.js'));
  const hero=G.heroes[0],cow=A.animalModel('cow');cow.position.set(hero.pos.x+2,hero.pos.y,hero.pos.z);G.scene.add(cow);
  for(let n=0;n<150;n++){
   G.paused=false;document.querySelectorAll('.storybook,.dialog,.modal,.reward').forEach(e=>e.remove());
   if(K.worldModelFailed('creature-cow-hd')&&K.worldModelFailed('creature-cow'))break;
   await new Promise(r=>setTimeout(r,100));
  }
  const r=cow.userData.rig;
  if(!r.asked||r.model||!r.root.visible||!K.worldModelFailed('creature-cow-hd')||!K.worldModelFailed('creature-cow'))throw Error('cow fallback failed');
  return {nearFailed:true,farFailed:true,fallbackVisible:r.root.visible,modelAttached:!!r.model};
 });
 if(P.errors.length)throw Error(P.errors.join('; '));
 writeFileSync(process.argv[2],JSON.stringify({...result,errors:P.errors},null,2)+'\n');
 console.log(JSON.stringify(result));await P.ctx.close();
}finally{await browser.close();}
