// (v1.08e water) the before and after pictures of the water (not a check): from the repo, with the game served on 8765,
// node tools/water-shots.mts <before|after> [river,lake,halong,reef]
import fs from 'node:fs/promises';
import {launch,open,clear,noWelcome} from '../tests/harness.mts';
const tag=process.argv[2]||'before',dir=`docs/world-models-v108e/water/${tag}`;await fs.mkdir(dir,{recursive:true});
const SPOTS0:[string,number,number,number][]=[['river',72,-14,Math.PI/2],['lake',106,-74,-Math.PI/2],['halong',221,204,Math.PI],['reef',-58,194,0]];const SPOTS=process.argv[3]?SPOTS0.filter(s=>process.argv[3].split(',').includes(s[0])):SPOTS0;
const SIZES:[string,number,number,boolean][]=[['phone',390,844,true],['tablet',820,1180,true],['computer',1440,900,false]];
const b=await launch();
for(const [name,w,h,touch] of SIZES){
 const P=await open(b,{w,h,touch,lang:'en',settings:{voice:false,sound:false,autoPack:false,online:false,countPlayers:false}});
 await clear(P.page);await noWelcome(P.page);await P.page.waitForTimeout(1500);
 for(const [id,x,z,yaw] of SPOTS){
  const info=await P.page.evaluate(async([x,z,yaw])=>{const G=window.__sv,h=G.heroes[0],W=await import('/js/world.js');h.place(x,z);h.yaw=yaw;h.camYaw=yaw+Math.PI;h.steerYaw=yaw;return {ground:W.heightAt(x,z),y:h.pos.y};},[x,z,yaw]);
  await P.page.waitForTimeout(2500);
  const st=await P.page.evaluate(()=>{const h=window.__sv.heroes[0];return {state:h.state,y:+h.pos.y.toFixed(2),cam:+h.cam.position.y.toFixed(2)};});
  console.log(name,id,JSON.stringify(info),JSON.stringify(st));
  await P.page.screenshot({path:`${dir}/${id}-${name}.jpg`,quality:82});
 }
 if(P.errors.length)console.log('errors',P.errors.slice(0,3));
 await P.ctx.close();
}
await b.close();
