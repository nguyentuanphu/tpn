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
const result=await page.evaluate(async ([mode,baseline,debug])=>{
 const {cowFaceMetrics,validateCowEyeMetadata,validateCowLashMetadata}=await import(String('/tools/meshy/cow_face_metrics.mjs'));
 const {cowEyeRestPositions,readCowReferenceEyeIds}=await import(String('/tools/meshy/cow_eye_probe.mjs'));
 const {THREE}=await import(String('/js/gfx.js')),K=await import(String('/js/modelkit.js')),{clone}=await import(String('/vendor/SkeletonUtils.js'));
 const G=(window as any).__sv,R=G.renderer,S=512,rt=new THREE.WebGLRenderTarget(S,S),scene=new THREE.Scene();scene.add(new THREE.HemisphereLight(0xffffff,0x888888,2.2));
 const cases=[],pics={};
 const srgb=new Uint8Array(256).map((_,i)=>{const v=i/255;return Math.round(255*(v<=.0031308?v*12.92:1.055*Math.pow(v,1/2.4)-.055));});
 const read=cam=>{R.setRenderTarget(rt);R.setClearColor(0,0);R.clear();R.render(scene,cam);const p=new Uint8Array(S*S*4);R.readRenderTargetPixels(rt,0,0,S,S,p);R.setRenderTarget(null);for(let i=0;i<p.length;i++)if(i%4!==3)p[i]=srgb[p[i]];return p;};
 const png=(px,flags)=>{const cv=document.createElement('canvas');cv.width=cv.height=S;const c=cv.getContext('2d'),im=c.createImageData(S,S);for(let y=0;y<S;y++)for(let x=0;x<S;x++){const src=((S-1-y)*S+x)*4,dst=(y*S+x)*4,marked=flags&&flags[src/4];im.data[dst]=marked?255:px[src+3]?px[src]:200;im.data[dst+1]=marked?0:px[src+3]?px[src+1]:210;im.data[dst+2]=marked?255:px[src+3]?px[src+2]:220;im.data[dst+3]=255;}c.putImageData(im,0,0);return cv.toDataURL('image/png');};
 for(const tier of mode==='selftest'?['near']:['near','far']){
  const t=await K.loadWorldModel((baseline?'../../docs/meshy-farm-cloud/cow/review/':'')+'creature-cow'+(tier==='near'?'-hd':''));if(!t)throw Error('Model missing');const obj=clone(t.scene);scene.add(obj);obj.traverse(o=>{if(o.isSkinnedMesh)o.frustumCulled=false;});
  let mouthIds=new Uint8Array(S*S),mouthSurfaceIds=new Uint8Array(S*S);
  const controls=new Map(),idCache=new Map(),idRead=cam=>{
   const saved=[];
   const swap=o=>{if(!o.isMesh)return;const original=o.material;saved.push([o,original]);let id=0;const lid=/-(?:shut|joy)([01])$/.exec(original.name||'');if(lid)id=Number(lid[1])+1;else if(/-mouth$/.test(original.name||''))id=3;
    const key=(original.uuid||original.id)+':'+id;let mat=idCache.get(key);
    if(!mat){mat=new THREE.MeshBasicMaterial({color:0,map:original.map,alphaMap:original.alphaMap,transparent:original.transparent,blending:original.blending,opacity:original.opacity,alphaTest:original.alphaTest,side:original.side,depthWrite:original.depthWrite,depthTest:original.depthTest,polygonOffset:original.polygonOffset,polygonOffsetFactor:original.polygonOffsetFactor,polygonOffsetUnits:original.polygonOffsetUnits});if(id===3){mat.transparent=true;mat.blending=THREE.NoBlending;mat.alphaTest=0;}if(id){mat.onBeforeCompile=sh=>{sh.fragmentShader=sh.fragmentShader.replace('#include <map_fragment>','#include <map_fragment>\ndiffuseColor.rgb='+ (id===1?'vec3(1.,0.,0.);':id===2?'vec3(0.,1.,0.);':'vec3(diffuseColor.a,0.,1.); diffuseColor.a=1.;'));};mat.customProgramCacheKey=()=>String(id);}idCache.set(key,mat);}o.material=mat;};
   scene.traverse(swap);const pixels=read(cam);saved.forEach(([o,m])=>o.material=m);const ids=new Uint8Array(S*S);mouthIds=new Uint8Array(S*S);mouthSurfaceIds=new Uint8Array(S*S);for(let i=0;i<ids.length;i++){if(pixels[i*4+2]>128&&pixels[i*4+1]<64){mouthSurfaceIds[i]=1;if(pixels[i*4]>25)mouthIds[i]=1;}else{if(pixels[i*4]>128&&pixels[i*4+1]<64)ids[i]=1;if(pixels[i*4+1]>128&&pixels[i*4]<64)ids[i]=2;}}return ids;
  };
  const mixer=new THREE.AnimationMixer(obj),bones=['shut0','shut1','joy0','joy1','retract0','retract1','jaw'].map(n=>obj.getObjectByName(n));
  if(bones.some(o=>!o))throw Error('Missing required cow expression bone');
  const rest=bones.map(o=>({p:o.position.clone(),s:o.scale.clone(),q:o.quaternion.clone()}));
  obj.updateMatrixWorld(true);const strokes=[],apertureMetadata=[];
  const centers=bones.slice(0,2).map(o=>o.getWorldPosition(new THREE.Vector3()).toArray());
  obj.traverse(o=>{
   if(o.userData?.svEye0C)apertureMetadata.push(o.userData);
   if(o.userData?.svLash){const m=o.userData,bone=obj.getObjectByName(m.svLashBone);
    if(!bone||!bone.matrixWorld.elements.every(Number.isFinite)||!Number.isFinite(bone.matrixWorld.determinant())||bone.matrixWorld.determinant()===0)throw Error('Invalid lash bone transform');
    let materialName; o.traverse(child=>{if(child.isMesh&&child.material?.name?.endsWith('-'+m.svLashBone))materialName=child.material.name;});
    strokes.push({data:m,inv:bone.matrixWorld.clone().invert(),bone,materialName,boneCenter:bone.getWorldPosition(new THREE.Vector3()).toArray()});
   }
  });
  let apertures=null;
  if(!baseline||apertureMetadata.length||strokes.length){
   if(apertureMetadata.length!==1)throw Error('Requires one actual-eye aperture annotation');
   apertures=validateCowEyeMetadata(apertureMetadata[0],centers);validateCowLashMetadata(strokes,centers,apertures);
  }

  let body;obj.traverse(o=>{if(o.isSkinnedMesh&&(!body||o.geometry.attributes.position.count>body.geometry.attributes.position.count))body=o;});
  const restPositions=apertures?cowEyeRestPositions(THREE,body):null;
  const idle=t.clips.find(c=>c.name==='idle');let blinkAt=-1;for(let at=0;at<idle.duration;at+=1/60){mixer.stopAllAction();mixer.clipAction(idle).reset().play();mixer.setTime(at);if(bones[0].scale.x>.9){blinkAt=at;break;}}
  if(blinkAt<0)throw Error('Idle has no actual closed blink');
  const clips=mode==='selftest'?['sleep','cheer']:mode==='quick'?['cheer','sleep','sad']:t.clips.map(c=>c.name).concat('blink');
  const views=mode==='selftest'?[[0,0]]:mode==='quick'?[[0,0],[.7,0],[-.7,0]]:[[0,0],[.4,0],[-.4,0],[.7,0],[-.7,0],[Math.PI/2,0],[-Math.PI/2,0],[0,.7],[0,-.5]];
  for(const clip of clips)for(const [yaw,elevation] of views)for(const plant of mode==='selftest'?['none','lid','mouth','mouth-open','stray','rim','rim-inner','rim-inner-native','flat','eyes','silhouette-add','silhouette-cut']:['none']){
   if(mode==='selftest'&&((clip==='cheer'&&!['none','mouth-open'].includes(plant))||(clip==='sleep'&&plant==='mouth-open')))continue;
   const c=t.clips.find(c=>c.name===(clip==='blink'?'idle':clip));mixer.stopAllAction();mixer.clipAction(c).reset().play();mixer.setTime(clip==='blink'?blinkAt:c.duration*(clip==='sleep'||clip==='sad'?.5:.3));obj.updateMatrixWorld(true);
   const saved=bones.map(o=>({p:o.position.clone(),s:o.scale.clone(),q:o.quaternion.clone()}));
   const eworld=bones.slice(0,2).map(o=>o.getWorldPosition(new THREE.Vector3())),mid=eworld[0].clone().add(eworld[1]).multiplyScalar(.5);mid.y-=.035;
   const right=eworld[1].clone().sub(eworld[0]).normalize(),up=new THREE.Vector3(0,1,0),front=right.clone().cross(up).normalize();
   const dir=front.clone().multiplyScalar(Math.cos(yaw)).addScaledVector(right,Math.sin(yaw)).addScaledVector(up,elevation).normalize();const cam=new THREE.PerspectiveCamera(34,1,.01,100);cam.position.copy(mid).addScaledVector(dir,1.2);cam.lookAt(mid);cam.updateMatrixWorld(true);
   const project=p=>{const v=p.clone().project(cam);return {x:(v.x*.5+.5)*S,y:(v.y*.5+.5)*S};};
   const eyes=[];for(let i=0;i<2;i++){
    const e=eworld[i],p=project(e),horizontal=project(e.clone().addScaledVector(new THREE.Vector3().setFromMatrixColumn(cam.matrixWorld,0),.038)),vertical=project(e.clone().addScaledVector(new THREE.Vector3().setFromMatrixColumn(cam.matrixWorld,1),.047));
    const ray=new THREE.Raycaster(cam.position,e.clone().sub(cam.position).normalize());const hit=ray.intersectObject(body,false)[0];
    eyes.push({...p,centerOccluded:!!hit&&hit.distance<cam.position.distanceTo(e)-.012,requireCoverage:Math.abs(yaw)<=.4&&Math.abs(elevation)<.1,rx:Math.max(3,Math.abs(horizontal.x-p.x)),ry:Math.max(3,Math.abs(vertical.y-p.y)),coat:i?'dark':'light',index:i});
   }
   const lashMask=strokes.length?new Uint8Array(S*S):null;
   if(lashMask)for(const stroke of strokes){const {bone,data,inv}=stroke;if(bone.scale.x<.1)continue;const motion=bone.matrixWorld.clone().multiply(inv),pts=[];
    for(let k=0;k<data.svLash.length;k+=3)pts.push(new THREE.Vector3(...data.svLash.slice(k,k+3)).applyMatrix4(motion));
    let length=0;for(let j=1;j<pts.length;j++)length+=pts[j].distanceTo(pts[j-1]);if(!Number.isFinite(length)||length>.12)throw Error('Authored stroke is not an eye-sized curve');
    const pp=[];for(let j=0;j<data.svLashBand.length;j+=3)pp.push(project(new THREE.Vector3(...data.svLashBand.slice(j,j+3)).applyMatrix4(motion)));
    if(pp.some(p=>!Number.isFinite(p.x)||!Number.isFinite(p.y)))throw Error('Invalid projected surface lash band');
    const fill=(a,b,c)=>{const edge=(p,q,x,y)=>(q.x-p.x)*(y-p.y)-(q.y-p.y)*(x-p.x),area=edge(a,b,c.x,c.y);if(Math.abs(area)<1e-8)return;
     for(let y=Math.max(0,Math.floor(Math.min(a.y,b.y,c.y)));y<Math.min(S,Math.ceil(Math.max(a.y,b.y,c.y)));y++)for(let x=Math.max(0,Math.floor(Math.min(a.x,b.x,c.x)));x<Math.min(S,Math.ceil(Math.max(a.x,b.x,c.x)));x++){const e0=edge(a,b,x+.5,y+.5),e1=edge(b,c,x+.5,y+.5),e2=edge(c,a,x+.5,y+.5);if((e0>=0&&e1>=0&&e2>=0)||(e0<=0&&e1<=0&&e2<=0))lashMask[y*S+x]|=1<<data.svEyeIndex;}
    };
    for(let j=0;j+3<pp.length;j+=2){fill(pp[j],pp[j+1],pp[j+2]);fill(pp[j+1],pp[j+2],pp[j+3]);}
   }
   if(lashMask){const source=lashMask.slice();for(let y=0;y<S;y++)for(let x=0;x<S;x++){const bits=source[y*S+x];if(!bits)continue;for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const u=x+dx,v=y+dy;if(u>=0&&u<S&&v>=0&&v<S)lashMask[v*S+u]|=bits;}}}
   const jaw=bones[6].getWorldPosition(new THREE.Vector3()),mp=project(jaw),mh=project(jaw.clone().addScaledVector(right,.045)),mv=project(jaw.clone().addScaledVector(up,.025));
   const mouth={...mp,rx:Math.abs(mh.x-mp.x),ry:Math.abs(mv.y-mp.y)},closed=bones[0].scale.x>.1||bones[2].scale.x>.1,mouthOpen=bones[6].scale.x>.05;
   // A frontal width collapses to zero in profile. Measure the real bounded
   // mouth surface in the current pose, retaining the anatomical fallback.
   if(mouthOpen){const ps=[],worldBox=new THREE.Box3();obj.traverse(o=>{if(!o.isSkinnedMesh||!/-mouth$/.test(o.material.name||''))return;for(let i=0;i<o.geometry.attributes.position.count;i++){const p=new THREE.Vector3().fromBufferAttribute(o.geometry.attributes.position,i);o.applyBoneTransform(i,p);p.applyMatrix4(o.matrixWorld);worldBox.expandByPoint(p);ps.push(project(p));}});if(!ps.length||worldBox.getSize(new THREE.Vector3()).length()>.2)throw Error('Missing/oversized actual mouth surface');
    const x0=Math.min(mp.x-mouth.rx,...ps.map(p=>p.x)),x1=Math.max(mp.x+mouth.rx,...ps.map(p=>p.x)),y0=Math.min(mp.y-mouth.ry,...ps.map(p=>p.y)),y1=Math.max(mp.y+mouth.ry,...ps.map(p=>p.y));mouth.x=(x0+x1)/2;mouth.y=(y0+y1)/2;mouth.rx=(x1-x0)/2;mouth.ry=(y1-y0)/2;
   }
   // Reference has the exact same head/body pose, only its expression neutral.
   bones.forEach((o,i)=>{if(i===4||i===5)return;o.position.copy(rest[i].p);o.quaternion.copy(rest[i].q);o.scale.setScalar(.001);});obj.updateMatrixWorld(true);const reference=read(cam);
   const referenceEyeIds=apertures?readCowReferenceEyeIds(THREE,scene,body,restPositions,apertures,read,cam):null;
   bones.forEach((o,i)=>{o.position.copy(saved[i].p);o.scale.copy(saved[i].s);o.quaternion.copy(saved[i].q);});obj.updateMatrixWorld(true);
   let fault;
   if(plant!=='none'){
    let loc=plant==='mouth-open'?jaw.clone():plant==='mouth'?jaw.clone().addScaledVector(right,.023):plant==='stray'?jaw.clone().addScaledVector(up,.068):plant==='eyes'?eworld[1].clone().addScaledVector(up,.015):eworld[plant==='flat'?0:1].clone();
    if(plant==='eyes'){
     const aperture=[];if(referenceEyeIds)for(let i=0;i<referenceEyeIds.length;i++)if(referenceEyeIds[i]===2)aperture.push(i);
     if(!aperture.length)throw Error('No reference aperture for planted eyes');
     const pixel=aperture.reduce((best,i)=>Math.hypot(i%S-eyes[1].x,(i/S|0)-eyes[1].y)<Math.hypot(best%S-eyes[1].x,(best/S|0)-eyes[1].y)?i:best);
     loc=new THREE.Vector3(((pixel%S+.5)/S)*2-1,(((pixel/S|0)+.5)/S)*2-1,eworld[1].clone().project(cam).z).unproject(cam);
    }
    if(plant==='silhouette-add'){
     let spot=null,best=Infinity;
     for(let y=12;y<S-12;y+=8)for(let x=12;x<S-12;x+=8){
      const distance=Math.hypot(x-eyes[1].x,y-eyes[1].y);if(distance>=best)continue;
      let empty=true;for(let dy=-8;dy<=8&&empty;dy++)for(let dx=-8;dx<=8;dx++)if(reference[((y+dy)*S+x+dx)*4+3]){empty=false;break;}
      if(empty){spot={x,y};best=distance;}
     }
     if(!spot)throw Error('No background space for rendered silhouette plant');
     const depth=eworld[1].clone().project(cam).z;loc=new THREE.Vector3((spot.x/S)*2-1,(spot.y/S)*2-1,depth).unproject(cam);
    }
    let innerRadius=0;
    if(plant.startsWith('rim-inner')){
     let inside=Uint8Array.from(referenceEyeIds,id=>id===2?1:0),best=-1,layers=0;
     for(let step=0;step<100;step++){const next=new Uint8Array(S*S);let remaining=0;for(let y=1;y<S-1;y++)for(let x=1;x<S-1;x++){const i=y*S+x;if(inside[i]&&inside[i-1]&&inside[i+1]&&inside[i-S]&&inside[i+S]){next[i]=1;remaining++;best=i;}}if(!remaining)break;inside=next;layers++;}
     if(best<0||layers<8)throw Error('No actual aperture interior for internal rim plant');
     const depth=eworld[1].clone().project(cam).z,pixel=new THREE.Vector3(((best%S+.5)/S)*2-1,(((best/S|0)+.5)/S)*2-1,depth);loc=pixel.clone().unproject(cam);
     innerRadius=pixel.clone().add(new THREE.Vector3(layers*.45/S*2,0,0)).unproject(cam).distanceTo(loc);
    }
    const geo=plant.startsWith('rim-inner')?new THREE.RingGeometry(innerRadius*.72,innerRadius,64):plant==='rim' ?new THREE.RingGeometry(.045,.049,64):plant==='lid'?new THREE.CircleGeometry(.035,48):plant==='flat'?new THREE.CircleGeometry(.065,64):plant==='eyes'?new THREE.CircleGeometry(.012,32):new THREE.PlaneGeometry(.015,.012);
    if(plant==='mouth-open'){const vertices=[];for(const x of [-.035,.035])vertices.push(x-.006,-.006,0,x+.006,-.006,0,x+.006,.006,0,x-.006,.006,0);geo.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));geo.deleteAttribute('normal');geo.deleteAttribute('uv');geo.setIndex([0,1,2,0,2,3,4,5,6,4,6,7]);geo.computeBoundingSphere();}
    fault=new THREE.Mesh(geo,new THREE.MeshBasicMaterial({color:plant==='rim-inner-native'?0x333333:plant==='eyes'?0xffffff:plant==='flat'?0xe8d6bd:plant==='lid'||plant.startsWith('rim')?0xaaaaaa:0x220500,transparent:true,depthTest:false,depthWrite:false,side:THREE.DoubleSide}));if(plant==='silhouette-cut'){fault.material.opacity=0;fault.material.blending=THREE.NoBlending;}
    if(['lid','rim','rim-inner','rim-inner-native','flat','eyes'].includes(plant)){const eye=plant==='flat'?0:1;let source;obj.traverse(o=>{if(o.isMesh&&o.material.name?.endsWith('-'+(bones[2].scale.x>.1?'joy':'shut')+eye))source=o.material;});if(!source)throw Error('Missing real lid material name for plant');fault.material.name=source.name;}
    if(plant==='mouth-open')fault.material.name='meshy-cow-mouth';
    fault.position.copy(loc).addScaledVector(dir,.025);fault.quaternion.copy(cam.quaternion);fault.renderOrder=999;scene.add(fault);
   }
   const current=read(cam),ids=idRead(cam),m=cowFaceMetrics(current,reference,S,S,eyes,mouth,closed,mouthOpen,ids,lashMask,referenceEyeIds,mouthIds,mouthSurfaceIds);
   if(mouthOpen&&bones[6].scale.x>.4&&Math.abs(yaw)<=.4&&Math.abs(elevation)<.1&&m.mouthVisiblePixels<4)m.coverageErrors.push('Open mouth missing visible front surface');
   const cs={tier,clip,yaw,elevation,plant,closed,mouthOpen,...m.counts,textureFlat:m.textureFlat,eyeData:m.eyeData,coverageErrors:m.coverageErrors,mouthVisiblePixels:m.mouthVisiblePixels,mouthOccluded:mouthOpen&&m.mouthVisiblePixels===0};cases.push(cs);
   if(mode==='selftest'){
    const key=JSON.stringify([tier,clip,yaw,elevation]);
    if(plant==='none')controls.set(key,m.flags);
    else{
     const control=controls.get(key);if(!control||!fault)throw Error('Missing same-pose selftest control');
     // Render the planted geometry alone to locate its actual pixel footprint.
     const original=fault.material,mask=original.clone();mask.color.set(0xffffff);mask.opacity=1;mask.blending=THREE.NoBlending;
     fault.material=mask;obj.visible=false;let footprint;
     try{footprint=read(cam);}finally{obj.visible=true;fault.material=original;mask.dispose();}
     cs.plantedIncrease=Object.fromEntries(Object.keys(m.flags).map(k=>[k,m.flags[k].reduce((n,v,i)=>n+(v&&!control[k][i]&&footprint[i*4+3]?1:0),0)]));
     if(plant.startsWith('rim-inner')){let total=0,inside=0;for(let i=0;i<S*S;i++)if(footprint[4*i+3]){total++;if(referenceEyeIds[i]===2)inside++;}cs.plantedInsideAperture=inside/total;if(!total||inside/total<.95)throw Error('Internal rim plant not inside actual aperture');}
    }
   }
   for(const k of Object.keys(m.counts))if(m.counts[k]>(k==='eyes'?6:12)||plant===k)pics[`${tier}-${clip}-${yaw}-${elevation}-${plant}-${k}`]=png(current,m.flags[k]);
   if(debug){const name=`${tier}-${clip}-${yaw}-${elevation}-${plant}`;pics[name+'-current']=png(current);pics[name+'-reference']=png(reference);
    for(const [label,mask]of [['ids',ids],['reference-ids',referenceEyeIds],['lash',lashMask],['mouth-ids',mouthIds],['mouth-surface-ids',mouthSurfaceIds]] as const){if(!mask)continue;const rgba=new Uint8Array(S*S*4);for(let i=0;i<S*S;i++){rgba[4*i]=mask[i]&1?255:0;rgba[4*i+1]=mask[i]&2?255:0;rgba[4*i+3]=255;}pics[name+'-'+label]=png(rgba);}
   }
   if(fault){scene.remove(fault);fault.geometry.dispose();fault.material.dispose();}
  }
  scene.remove(obj);for(const mat of idCache.values())mat.dispose();
 }
 rt.dispose();return {cases,pics};
},[mode,process.env.COW_FACE_BASELINE==='1',process.env.COW_FACE_DEBUG==='1']);
for(const [name,data] of Object.entries(result.pics))writeFileSync(out+'/'+name+'.png',Buffer.from(String(data).split(',')[1],'base64'));
writeFileSync(out+'/cases.json',JSON.stringify(result.cases,null,2)+'\n');
const keys=['lid','mouth','stray','rim','eyes','silhouette'],limit=k=>k==='eyes'?6:12,real=result.cases.filter(c=>c.plant==='none'),fail=real.filter(c=>c.coverageErrors.length||keys.some(k=>c[k]>limit(k)));
if(!real.length)throw Error('No real cow face cases measured');
const lines=[`Cow face audit: ${real.length} cases; ${fail.length} failing (limits 12px fur/mouth/silhouette, 6px eyes; four-pixel groups)`];
for(const k of keys)lines.push(`${k}: worst ${Math.max(0,...real.map(c=>c[k]))}, failing ${real.filter(c=>c[k]>limit(k)).length}`);
for(const c of real)for(const error of c.coverageErrors)lines.push(`${c.tier}/${c.clip}/${c.yaw}/${c.elevation}: ${error}`);
if(mode==='selftest'){
 const targets={lid:'lid',mouth:'mouth','mouth-open':'mouth',stray:'stray',rim:'rim','rim-inner':'rim','rim-inner-native':'rim',flat:'textureFlat',eyes:'eyes','silhouette-add':'silhouette','silhouette-cut':'silhouette'};
 const missed=Object.entries(targets).filter(([plant,k])=>!result.cases.some(c=>{
  if(c.plant!==plant)return false;
  const control=real.find(n=>n.tier===c.tier&&n.clip===c.clip&&n.yaw===c.yaw&&n.elevation===c.elevation);
  return control&&Number.isFinite(c[k])&&c[k]-control[k]>limit(k)&&c.plantedIncrease?.[k==='textureFlat'?'rim':k]>limit(k);
 })).map(([plant])=>plant);
 lines.push('selftest: '+(missed.length?'MISSED '+missed.join(', '):'all '+Object.keys(targets).length+' rendered plants increased their metric beyond the same-pose control'));
 if(missed.length)process.exitCode=1;
}
if(fail.length)process.exitCode=1;writeFileSync(out+'/summary.txt',lines.join('\n')+'\n');console.log(lines.join('\n'));
}finally{await b.close();}
