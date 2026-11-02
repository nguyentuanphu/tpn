import fs from 'node:fs';
import type { Browser } from 'playwright';
import { open, clear, noWelcome } from './harness.mts';
import { studioPosition } from '../js/studio-position.js';
import { anchorOf, PLOTS } from '../js/content/map.js';
export async function rememberedHomesCheck(browser: Browser): Promise<string> {
  const anchor = anchorOf('town');
  const position = studioPosition({place:'town',off:[3,-4],x:999,z:999},false);
  if (!position || position.x !== anchor[0]+3 || position.z !== anchor[1]-4) throw Error('relative anchor did not win');
  for (const value of [{x:1,z:2},{place:'missing',off:[0,0]},{place:'town',off:[Infinity,0]},{place:'town',off:[0]},null]) if (studioPosition(value,false)) throw Error('invalid or stale position accepted');
  if (studioPosition({x:1,z:2},true)?.z !== 2) throw Error('matching-map legacy position lost');
  const ids = PLOTS.slice(0,8).map(p=>p.id);
  const P=await open(browser,{w:820,h:1180,route:async ctx=>{
    await ctx.route('**/content/custom.json',route=>route.fulfill({json:{world:{map:'obsolete',build:[{type:'tube2',place:'memory_e',off:[10,40],x:999,z:999,name:['Anchor house','Nhà neo']}]},npcs:[{id:'anchor_test',name:'Anchor test',place:'memory_e',off:[12,40],x:999,z:999},{id:'stale_test',name:'Stale test',x:2,z:2}],plots:{
      ...Object.fromEntries(['villa','tube','tube2','village','cottage','raised'].map((type,i)=>[ids[i],{type}])),
      [ids[0]]:{type:'villa',name:['Grandma’s home','Nhà bà'],owner:{name:'Bà Lan',line:['Welcome home!','Mừng con về nhà!']}},
      sp_hanoi_1:{type:'tube2',name:['Spare home','Nhà lô trống']},[ids[6]]:{type:'pagoda'},[ids[7]]:{type:'missing'},not_a_plot:{type:'tube'}
    }}}));
  }});
  try {
    await clear(P.page);await noWelcome(P.page);
    const {result,shot}=await P.page.evaluate(async id=>{
      const G=window.__sv, {PLOTS}=await import('../js/world.js'), {builtPlotIds, BUILD_TYPES, fitPlotHouse}=await import('../js/worldedit.js');
      const p=PLOTS.find(p=>p.id===id), home=G.homes.list.find(h=>h.hs.x===p.x && h.hs.z===p.z), obj=G.scene.children.find(o=>o.userData.plotId===id);
      if(!home || !obj)throw Error('remembered home absent');
      G.heroes[0].place(p.x+8*Math.sin(p.rot),p.z+8*Math.cos(p.rot));G.paused=false;
      await new Promise(resolve=>setTimeout(resolve,1800));
      const {heightAt}=await import('../js/world.js'), ground=heightAt(p.x,p.z);
      const foundations=G.scene.children.filter(o=>o.userData.plotId).map(o=>({id:o.userData.plotId,offset:o.position.y-heightAt(o.position.x,o.position.z)}));
      if(foundations.some(f=>Math.abs(f.offset)>.3))throw Error('home foundation does not follow ground: '+JSON.stringify(foundations));
      if(Math.abs(obj.position.y-ground)>.3)throw Error('home foundation does not meet the plot ground: '+JSON.stringify({y:obj.position.y,ground}));
      const spare=PLOTS.find(p=>p.id==='sp_hanoi_1');
      if(!spare?.occupied || !G.homes.list.some(h=>h.name()==='Spare home'))throw Error('occupied spare plot removed');
      const bounds=new (await import('../js/gfx.js')).THREE.Box3().setFromObject(obj), size=bounds.getSize(new (await import('../js/gfx.js')).THREE.Vector3());
      const anchor=(await import('../js/content/map.js')).anchorOf('memory_e');
      const anchored=G.homes.list.find(h=>h.name()==='Anchor house'), npc=G.npcs.find(n=>n.id==='fam_anchor_test');
      if(!anchored || anchored.hs.x!==anchor[0]+10 || anchored.hs.z!==anchor[1]+40 || !npc || npc.x!==anchor[0]+12 || npc.z!==anchor[1]+40 || G.npcs.some(n=>n.id==='fam_stale_test'))throw Error('game did not apply stable building/villager positions');
      const {THREE,merge,toonVC}=await import('../js/gfx.js');
      const footprints=Object.entries(BUILD_TYPES).filter(([,t])=>'home' in t && t.home).map(([id,t])=>{
        const m=t.mk({color:null}), object=m.obj||new THREE.Mesh(m.geo||merge(m.parts),toonVC());
        fitPlotHouse(object,p);const box=new THREE.Box3().setFromObject(object), size=box.getSize(new THREE.Vector3());
        return {id,width:size.x,depth:size.z};
      });
      if(footprints.some(f=>f.width>p.w || f.depth>p.d))throw Error('home style exceeds its plot: '+JSON.stringify(footprints));
      const result={foundations,footprints,name:home.name(),owner:home.people[0]?.name,people:home.people.length,built:[...builtPlotIds],gardens:G.plots.count,total:PLOTS.length,width:size.x,depth:size.z,w:p.w,d:p.d};
      const renderer=G.renderer;if(!(renderer instanceof THREE.WebGLRenderer))throw Error('No renderer');
      const camera=new THREE.PerspectiveCamera(45,4/3,.1,400), front=new THREE.Vector3(Math.sin(p.rot),0,Math.cos(p.rot));
      camera.position.set(p.x+front.x*13+7,p.h+9,p.z+front.z*13);camera.lookAt(p.x,p.h+1.5,p.z);
      const ratio=renderer.getPixelRatio(), oldSize=renderer.getSize(new THREE.Vector2());renderer.setPixelRatio(1);renderer.setSize(800,600,false);renderer.render(G.scene,camera);
      let draws=0;obj.traverse(o=>{if(o instanceof THREE.Mesh){const prior=o.onBeforeRender;o.onBeforeRender=function(...args){draws++;prior.apply(this,args);};}});renderer.render(G.scene,camera);if(!draws)throw Error('approached home was not drawn');
      const shot=renderer.domElement.toDataURL('image/png');renderer.setPixelRatio(ratio);renderer.setSize(oldSize.x,oldSize.y,false);
      G.homes.enter(G.heroes[0],home);return {result,shot};
    },ids[0]);
    fs.mkdirSync('../docs/r87/evidence',{recursive:true});fs.writeFileSync('../docs/r87/evidence/remembered-home.png',Buffer.from(shot.split(',')[1],'base64'));
    if(result.name!=='Grandma’s home'||result.owner!=='Bà Lan'||result.people!==1||result.built.length!==7||result.gardens!==result.total-7||result.width>result.w||result.depth>result.d)throw Error(JSON.stringify(result));
    await P.page.waitForFunction(()=>window.__sv.homes.isInside(window.__sv.heroes[0]));
    await P.page.evaluate(async()=>{const {settings}=await import('../js/state.js');settings.lang='vi';});
    const name=await P.page.evaluate(()=>window.__sv.homes.inside().name());if(name!=='Nhà bà')throw Error('Vietnamese home name lost');
    if(P.errors.length)throw Error(P.errors.join(' | '));
    fs.mkdirSync('../docs/r87/evidence',{recursive:true});fs.writeFileSync('../docs/r87/evidence/remembered-homes.json',JSON.stringify(result,null,2)+'\n');
    return 'remembered plot becomes a named, visitable home with its owner; invalid/empty plots stay gardens; stable anchors beat stale coordinates';
  } finally {await P.ctx.close();}
}
