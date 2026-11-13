// Four-view animation evidence using the game loader and materials; no paid calls.
// Usage: SV_URL=http://127.0.0.1:PORT node --experimental-strip-types tools/meshy/film_cow_review.mts OUT near|far
import {createRequire} from 'node:module';
import {mkdirSync,writeFileSync} from 'node:fs';
const {chromium}=createRequire(new URL('../../tests/package.json',import.meta.url))('playwright');
const out=process.argv[2],tier=process.argv[3]||'near';mkdirSync(out+'/frames',{recursive:true});
const b=await chromium.launch({args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const page=await b.newPage({viewport:{width:1000,height:840}});await page.goto((process.env.SV_URL||'http://127.0.0.1:8797')+'/docs/meshy-farm-cloud/model-review.html');await page.waitForSelector('body[data-ready="true"]');
const clips=await page.evaluate(async tier=>{
 const {THREE}=await import(String('/js/gfx.js')),K=await import(String('/js/modelkit.js')),{clone}=await import(String('/vendor/SkeletonUtils.js'));
 const t=await K.loadWorldModel('creature-cow'+(tier==='near'?'-hd':''));if(!t)throw Error('cow missing');
 const G=(window as any).__sv,obj=clone(t.scene);G.scene.add(obj);obj.traverse(o=>{if(o.isSkinnedMesh)o.frustumCulled=false});
 G.renderer.setSize(1000,800);G.renderer.setScissorTest(true);
 const floor=new THREE.Mesh(new THREE.PlaneGeometry(12,12),new THREE.MeshLambertMaterial({color:0xb5c2ab}));floor.rotation.x=-Math.PI/2;floor.position.y=-.005;G.scene.add(floor);
 const cams=[0,.72,Math.PI/2,Math.PI].map(yaw=>{const c=new THREE.PerspectiveCamera(32,1.25,.01,100);c.position.set(Math.sin(yaw)*3.9,.95,Math.cos(yaw)*3.9);c.lookAt(0,.85,0);return c});
 (window as any).review={G,obj,t,mixer:new THREE.AnimationMixer(obj),cams};
 const lab=document.createElement('div');lab.id='label';lab.style.cssText='height:40px;font:20px sans-serif;padding:4px;box-sizing:border-box;background:#fff';document.body.prepend(lab);
 return t.clips.map(c=>({name:c.name,duration:c.duration}));
},tier);
let n=0;
for(const {name,duration} of clips){for(let f=0;f<Math.ceil(Math.min(3,duration)*12);f++){
 await page.evaluate(({name,u,tier})=>{const {G,obj,t,mixer,cams}=(window as any).review;const clip=t.clips.find(c=>c.name===name);mixer.stopAllAction();mixer.clipAction(clip).reset().play();mixer.setTime(clip.duration*u);obj.updateMatrixWorld(true);const R=G.renderer;
 for(let k=0;k<4;k++){const x=k%2*500,y=(1-Math.floor(k/2))*400;R.setViewport(x,y,500,400);R.setScissor(x,y,500,400);R.render(G.scene,cams[k]);}
 document.querySelector('#label').textContent=`Cow ${tier} · ${name} · front / three-quarter / side / back`;
 },{name,u:f/(duration*12),tier});
 await page.screenshot({path:out+'/frames/'+String(n++).padStart(5,'0')+'.png'});
 }console.log(tier,name,n)}await b.close();
