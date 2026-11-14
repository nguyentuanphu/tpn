// Face checks adapted from meshy-audit-coverage/audit.mts; actual game rendering.
// node tools/meshy/audit_cow_face.mts OUT [quick|selftest]
import {createRequire} from 'node:module';
import {mkdirSync,writeFileSync} from 'node:fs';
const {chromium}=createRequire(new URL('../../tests/package.json',import.meta.url))('playwright');
const [out,mode='']=process.argv.slice(2);mkdirSync(out,{recursive:true});
const b=await chromium.launch({args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
try{
const page=await b.newPage({viewport:{width:900,height:700}});page.setDefaultTimeout(600000);
await page.goto((process.env.SV_URL||'http://127.0.0.1:8798')+'/docs/meshy-farm-cloud/model-review.html');await page.waitForSelector('body[data-ready="true"]');
const result=await page.evaluate(async ([mode,baseline])=>{
 const {cowFaceMetrics}=await import(String('/tools/meshy/cow_face_metrics.mjs'));
 const {THREE}=await import(String('/js/gfx.js')),K=await import(String('/js/modelkit.js')),{clone}=await import(String('/vendor/SkeletonUtils.js'));
 const G=(window as any).__sv,R=G.renderer,S=512,rt=new THREE.WebGLRenderTarget(S,S),scene=new THREE.Scene();scene.add(new THREE.HemisphereLight(0xffffff,0x888888,2.2));
 const cases=[],pics={};
 const srgb=new Uint8Array(256).map((_,i)=>{const v=i/255;return Math.round(255*(v<=.0031308?v*12.92:1.055*Math.pow(v,1/2.4)-.055));});
 const read=cam=>{R.setRenderTarget(rt);R.setClearColor(0,0);R.clear();R.render(scene,cam);const p=new Uint8Array(S*S*4);R.readRenderTargetPixels(rt,0,0,S,S,p);R.setRenderTarget(null);for(let i=0;i<p.length;i++)if(i%4!==3)p[i]=srgb[p[i]];return p;};
 const png=(px,flags)=>{const cv=document.createElement('canvas');cv.width=cv.height=S;const c=cv.getContext('2d'),im=c.createImageData(S,S);for(let y=0;y<S;y++)for(let x=0;x<S;x++){const src=((S-1-y)*S+x)*4,dst=(y*S+x)*4,marked=flags&&flags[src/4];im.data[dst]=marked?255:px[src+3]?px[src]:200;im.data[dst+1]=marked?0:px[src+3]?px[src+1]:210;im.data[dst+2]=marked?255:px[src+3]?px[src+2]:220;im.data[dst+3]=255;}c.putImageData(im,0,0);return cv.toDataURL('image/png');};
 for(const tier of mode==='selftest'?['near']:['near','far']){
  const t=await K.loadWorldModel((baseline?'../../docs/meshy-farm-cloud/cow/review/':'')+'creature-cow'+(tier==='near'?'-hd':''));if(!t)throw Error('Model missing');const obj=clone(t.scene);scene.add(obj);obj.traverse(o=>{if(o.isSkinnedMesh)o.frustumCulled=false;});
  const idCache=new Map(),idRead=cam=>{
   const saved=[];
   const swap=o=>{if(!o.isMesh)return;const original=o.material;saved.push([o,original]);let id=0;const lid=/-(?:shut|joy)([01])$/.exec(original.name||'');if(lid)id=Number(lid[1])+1;if(o.userData.facePlant==='lid'||o.userData.facePlant==='rim')id=2;if(o.userData.facePlant==='flat')id=1;
    const key=(original.uuid||original.id)+':'+id;let mat=idCache.get(key);
    if(!mat){mat=new THREE.MeshBasicMaterial({color:0,map:id?original.map:null,transparent:original.transparent,opacity:original.opacity,alphaTest:original.alphaTest,side:original.side,depthWrite:original.depthWrite,depthTest:original.depthTest,polygonOffset:original.polygonOffset,polygonOffsetFactor:original.polygonOffsetFactor,polygonOffsetUnits:original.polygonOffsetUnits});if(id){mat.onBeforeCompile=sh=>{sh.fragmentShader=sh.fragmentShader.replace('#include <map_fragment>','#include <map_fragment>\ndiffuseColor.rgb='+ (id===1?'vec3(1.,0.,0.);':'vec3(0.,1.,0.);'));};mat.customProgramCacheKey=()=>String(id);}idCache.set(key,mat);}o.material=mat;};
   scene.traverse(swap);const pixels=read(cam);saved.forEach(([o,m])=>o.material=m);const ids=new Uint8Array(S*S);for(let i=0;i<ids.length;i++){if(pixels[i*4]>128&&pixels[i*4+1]<64)ids[i]=1;if(pixels[i*4+1]>128&&pixels[i*4]<64)ids[i]=2;}return ids;
  };
  const mixer=new THREE.AnimationMixer(obj),bones=['shut0','shut1','joy0','joy1','retract0','retract1','jaw'].map(n=>obj.getObjectByName(n));
  const rest=bones.map(o=>({p:o.position.clone(),s:o.scale.clone(),q:o.quaternion.clone()}));
  let body;obj.traverse(o=>{if(o.isSkinnedMesh&&(!body||o.geometry.attributes.position.count>body.geometry.attributes.position.count))body=o;});
  const idle=t.clips.find(c=>c.name==='idle');let blinkAt=0;for(let at=0;at<idle.duration;at+=1/60){mixer.stopAllAction();mixer.clipAction(idle).reset().play();mixer.setTime(at);if(bones[0].scale.x>.9){blinkAt=at;break;}}
  const clips=mode==='selftest'?['sleep']:mode==='quick'?['cheer','sleep','sad']:t.clips.map(c=>c.name).concat('blink');
  const views=mode==='selftest'?[[0,0]]:mode==='quick'?[[0,0],[.7,0],[-.7,0]]:[[0,0],[.4,0],[-.4,0],[.7,0],[-.7,0],[Math.PI/2,0],[-Math.PI/2,0],[0,.7],[0,-.5]];
  for(const clip of clips)for(const [yaw,elevation] of views)for(const plant of mode==='selftest'?['lid','mouth','stray','rim','flat']:['none']){
   const c=t.clips.find(c=>c.name===(clip==='blink'?'idle':clip));mixer.stopAllAction();mixer.clipAction(c).reset().play();mixer.setTime(clip==='blink'?blinkAt:c.duration*(clip==='sleep'||clip==='sad'?.5:.3));obj.updateMatrixWorld(true);
   const saved=bones.map(o=>({p:o.position.clone(),s:o.scale.clone(),q:o.quaternion.clone()}));
   const eworld=bones.slice(0,2).map(o=>o.getWorldPosition(new THREE.Vector3())),mid=eworld[0].clone().add(eworld[1]).multiplyScalar(.5);mid.y-=.035;
   const right=eworld[1].clone().sub(eworld[0]).normalize(),up=new THREE.Vector3(0,1,0),front=right.clone().cross(up).normalize();
   const dir=front.clone().multiplyScalar(Math.cos(yaw)).addScaledVector(right,Math.sin(yaw)).addScaledVector(up,elevation).normalize();const cam=new THREE.PerspectiveCamera(34,1,.01,100);cam.position.copy(mid).addScaledVector(dir,1.2);cam.lookAt(mid);cam.updateMatrixWorld(true);
   const project=p=>{const v=p.clone().project(cam);return {x:(v.x*.5+.5)*S,y:(v.y*.5+.5)*S};};
   const eyes=[];for(let i=0;i<2;i++){
    const e=eworld[i],p=project(e),horizontal=project(e.clone().addScaledVector(new THREE.Vector3().setFromMatrixColumn(cam.matrixWorld,0),.038)),vertical=project(e.clone().addScaledVector(new THREE.Vector3().setFromMatrixColumn(cam.matrixWorld,1),.047));
    const ray=new THREE.Raycaster(cam.position,e.clone().sub(cam.position).normalize());const hit=ray.intersectObject(body,false)[0];
    eyes.push({...p,centerOccluded:!!hit&&hit.point.distanceTo(e)>.012,rx:Math.max(3,Math.abs(horizontal.x-p.x)),ry:Math.max(3,Math.abs(vertical.y-p.y)),coat:i?'dark':'light',index:i});
   }
   const jaw=bones[6].getWorldPosition(new THREE.Vector3()),mp=project(jaw),mh=project(jaw.clone().addScaledVector(right,.045)),mv=project(jaw.clone().addScaledVector(up,.025));
   const mouth={...mp,rx:Math.abs(mh.x-mp.x),ry:Math.abs(mv.y-mp.y)},closed=bones[0].scale.x>.1||bones[2].scale.x>.1,mouthOpen=bones[6].scale.x>.05;
   // Reference has the exact same head/body pose, only its expression neutral.
   bones.forEach((o,i)=>{o.position.copy(rest[i].p);o.quaternion.copy(rest[i].q);o.scale.copy(i<4||i===6?new THREE.Vector3(.001,.001,.001):rest[i].s);});obj.updateMatrixWorld(true);const reference=read(cam);
   bones.forEach((o,i)=>{o.position.copy(saved[i].p);o.scale.copy(saved[i].s);o.quaternion.copy(saved[i].q);});obj.updateMatrixWorld(true);
   let fault;
   if(plant!=='none'){
    const loc=plant==='mouth'?jaw.clone().addScaledVector(right,.023):plant==='stray'?jaw.clone().addScaledVector(up,.068):eworld[plant==='flat'?0:1].clone();
    const geo=plant==='rim'?new THREE.RingGeometry(.045,.049,64):plant==='lid'?new THREE.CircleGeometry(.035,48):plant==='flat'?new THREE.CircleGeometry(.065,64):new THREE.PlaneGeometry(.015,.012);
    fault=new THREE.Mesh(geo,new THREE.MeshBasicMaterial({color:plant==='flat'?0xe8d6bd:plant==='lid'||plant==='rim'?0xaaaaaa:0x220500,transparent:true,depthTest:false,depthWrite:false,side:THREE.DoubleSide}));fault.position.copy(loc).addScaledVector(dir,.025);fault.quaternion.copy(cam.quaternion);fault.renderOrder=999;fault.userData.facePlant=plant;scene.add(fault);
   }
   const current=read(cam),ids=idRead(cam),m=cowFaceMetrics(current,reference,S,S,eyes,mouth,closed,mouthOpen,ids),cs={tier,clip,yaw,elevation,plant,closed,mouthOpen,...m.counts,textureFlat:m.textureFlat,eyeData:m.eyeData};cases.push(cs);
   for(const k of Object.keys(m.counts))if(m.counts[k]>12||plant===k)pics[`${tier}-${clip}-${yaw}-${elevation}-${plant}-${k}`]=png(current,m.flags[k]);
   if(fault){scene.remove(fault);fault.geometry.dispose();fault.material.dispose();}
  }
  scene.remove(obj);for(const mat of idCache.values())mat.dispose();
 }
 rt.dispose();return {cases,pics};
},[mode,process.env.COW_FACE_BASELINE==='1']);
for(const [name,data] of Object.entries(result.pics))writeFileSync(out+'/'+name+'.png',Buffer.from(String(data).split(',')[1],'base64'));
writeFileSync(out+'/cases.json',JSON.stringify(result.cases,null,2)+'\n');
const keys=['lid','mouth','stray','rim'],real=result.cases.filter(c=>c.plant==='none'),fail=real.filter(c=>keys.some(k=>c[k]>12));
const lines=[`Cow face audit: ${real.length} cases; ${fail.length} failing (limit 12px, four-pixel groups)`];
for(const k of keys)lines.push(`${k}: worst ${Math.max(0,...real.map(c=>c[k]))}, failing ${real.filter(c=>c[k]>12).length}`);
if(mode==='selftest'){const missed=keys.filter(k=>!result.cases.some(c=>c.plant===k&&c[k]>12));if(!result.cases.some(c=>c.plant==='flat'&&c.textureFlat>12))missed.push('flat fur');lines.push('selftest: '+(missed.length?'MISSED '+missed.join(', '):'all five rendered plants caught (including same-colour flat fur)'));if(missed.length)process.exitCode=1;}
if(fail.length)process.exitCode=1;writeFileSync(out+'/summary.txt',lines.join('\n')+'\n');console.log(lines.join('\n'));
}finally{await b.close();}
