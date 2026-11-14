// In-game face proof at native 1024px. Uses the game's loader/materials/renderer.
// SV_URL=... node tools/meshy/review_cow_faces.mts OUT [quick]
import {createRequire} from 'node:module';
import {mkdirSync,writeFileSync} from 'node:fs';
const {chromium}=createRequire(new URL('../../tests/package.json',import.meta.url))('playwright');
const out=process.argv[2],quick=process.argv.includes('quick');mkdirSync(out,{recursive:true});
const b=await chromium.launch({args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
try{
const page=await b.newPage({viewport:{width:1024,height:1024}});page.setDefaultTimeout(180000);
await page.goto((process.env.SV_URL||'http://127.0.0.1:8798')+'/docs/meshy-farm-cloud/model-review.html');await page.waitForSelector('body[data-ready="true"]');
const records=[];
for(const tier of quick?['near']:['near','far']){
const clips=await page.evaluate(async ([tier,debug,baseline])=>{
 const {THREE}=await import(String('/js/gfx.js')),K=await import(String('/js/modelkit.js')),{clone}=await import(String('/vendor/SkeletonUtils.js'));
 const G=(window as any).__sv,t=await K.loadWorldModel((baseline?'../../docs/meshy-farm-cloud/cow/review/':'')+'creature-cow'+(tier==='near'?'-hd':''));if(!t)throw Error('cow not loaded');
 const obj=clone(t.scene);obj.traverse(o=>{if(o.isSkinnedMesh)o.frustumCulled=false;if(o.isMesh){const lid=/-(shut|joy)\d$/.test(o.material.name);if(debug==='lid-only')o.visible=lid;if(debug==='body-only'&&/-(shut|joy)\d$|-mouth$/.test(o.material.name))o.visible=false;if(debug==='magenta'&&lid){o.material=o.material.clone();o.material.onBeforeCompile=sh=>{sh.fragmentShader=sh.fragmentShader.replace('#include <map_fragment>','#include <map_fragment>\ndiffuseColor.rgb=vec3(1.,0.,1.);');};}}});G.scene.add(obj);G.renderer.setPixelRatio(1);G.renderer.setSize(1024,1024);
 const mixer=new THREE.AnimationMixer(obj),idle=t.clips.find(c=>c.name==='idle');let blinkAt=0;for(let at=0;at<idle.duration;at+=1/60){mixer.stopAllAction();mixer.clipAction(idle).reset().play();mixer.setTime(at);if(obj.getObjectByName('shut0').scale.x>.9){blinkAt=at;break;}};(window as any).review={G,t,obj,THREE,mixer,blinkAt};
 return [...t.clips.map(c=>c.name),'blink'];
},[tier,process.env.FACE_DEBUG||'',process.env.COW_FACE_BASELINE==='1']);
for(const clip of clips){
 if(process.env.FACE_CLIPS&&!process.env.FACE_CLIPS.split(',').includes(clip))continue;
 if(quick&&!['cheer','sleep','sad','follow','run'].includes(clip))continue;
 const views=quick?[['front',0,0],['p07',.7,0],['m07',-.7,0]]:[['front',0,0],['p04',.4,0],['m04',-.4,0],['p07',.7,0],['m07',-.7,0],['right',Math.PI/2,0],['left',-Math.PI/2,0],['above',0,.7],['below',0,-.5],['neck',.55,-.12],['back',Math.PI,0]];
 for(const [view,yaw,elev] of views){
 const meta=await page.evaluate(({clip,view,yaw,elev})=>{
  const {G,t,obj,THREE,mixer,blinkAt}=(window as any).review;
  const c=t.clips.find(c=>c.name===(clip==='blink'?'idle':clip));mixer.stopAllAction();mixer.clipAction(c).reset().play();mixer.setTime(clip==='blink'?blinkAt:c.duration*(clip==='sleep'||clip==='sad'?.5:.3));obj.updateMatrixWorld(true);

  const e0=obj.getObjectByName('shut0').getWorldPosition(new THREE.Vector3()),e1=obj.getObjectByName('shut1').getWorldPosition(new THREE.Vector3()),at=e0.clone().add(e1).multiplyScalar(.5);at.y-=.035;
  const right=e1.clone().sub(e0).normalize(),up=new THREE.Vector3(0,1,0),front=right.clone().cross(up).normalize();
  if(view==='neck'){at.y-=.16;at.addScaledVector(front,-.03);}
  const dir=front.multiplyScalar(Math.cos(yaw)).addScaledVector(right,Math.sin(yaw)).addScaledVector(up,elev).normalize();
  const cam=new THREE.PerspectiveCamera(34,1,.01,100);cam.position.copy(at).addScaledVector(dir,1.2);cam.lookAt(at);G.renderer.setScissorTest(false);G.renderer.render(G.scene,cam);
  return {camera:cam.position.toArray(),at:at.toArray(),eyes:[e0.toArray(),e1.toArray()]};
 },{clip,view,yaw,elev});
 const name=`cow-${tier}-${clip}-${view}.png`;await page.screenshot({path:out+'/'+name});records.push({name,tier,clip,view,...meta});
 }console.log(tier,clip);
}
await page.evaluate(()=>{const {G,obj}=(window as any).review;G.scene.remove(obj)});
}
writeFileSync(out+'/views.json',JSON.stringify(records,null,2)+'\n');
}finally{await b.close();}
