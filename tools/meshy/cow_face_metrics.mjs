// Metadata is in the model's rest-world frame, not an arbitrary mesh frame.
export function validateCowEyeMetadata(metadata,centers){
 const finite=(a,n)=>Array.isArray(a)&&a.length===n&&a.every(Number.isFinite);
 const dot=(a,b)=>a.reduce((s,v,i)=>s+v*b[i],0);
 if(!metadata)throw Error('Missing actual-eye aperture metadata');
 return [0,1].map(i=>{
  const a=Object.fromEntries(['C','S','U','N','H','D','M','P','UV','B'].map(k=>[k,metadata[`svEye${i}${k}`]]));
  if(!['C','S','U','N'].every(k=>finite(a[k],3))||!finite(a.D,2)||!Array.isArray(a.H)||a.H.length<6||a.H.length>128||a.H.length%2||!a.H.every(Number.isFinite)||a.D[1]<=a.D[0]||a.D[1]-a.D[0]>.15)throw Error('Invalid actual-eye aperture metadata');
  if(!Number.isFinite(a.P)||a.P<=0||a.P>.2||!Array.isArray(a.M)||a.M.length<3||a.M.length%2!==1||!a.M.every(Number.isInteger)||a.M[0]<64||a.M[0]>512)throw Error('Missing/invalid actual-eye pixel mask');
  const pixels=a.M[0]**2;let end=0,total=0;
  for(let k=1;k<a.M.length;k+=2){const start=a.M[k],length=a.M[k+1];if(start<end||length<=0||start+length>pixels)throw Error('Invalid eye mask runs');end=start+length;total+=length;}
  if(total<64||total>pixels*.6)throw Error('Untrustworthy actual-eye mask area');
  if(!finite(centers[i],3)||Math.hypot(...a.C.map((v,j)=>v-centers[i][j]))>.002)throw Error('Eye aperture coordinate frame mismatch');
  const cross=[a.S[1]*a.U[2]-a.S[2]*a.U[1],a.S[2]*a.U[0]-a.S[0]*a.U[2],a.S[0]*a.U[1]-a.S[1]*a.U[0]];
  if(['S','U','N'].some(k=>Math.abs(dot(a[k],a[k])-1)>.002)||Math.abs(dot(a.S,a.U))>.002||dot(cross,a.N)<.998)throw Error('Invalid actual-eye basis');
  let area=0;for(let j=0;j<a.H.length;j+=2){const k=(j+2)%a.H.length;area+=a.H[j]*a.H[k+1]-a.H[k]*a.H[j+1];}
  if(area<=0)throw Error('Invalid actual-eye hull winding/area');
  if(a.UV!==undefined){
   if(!Array.isArray(a.UV)||a.UV.length<4||a.UV.length%2||!a.UV.every(Number.isInteger)||a.UV[0]<64||a.UV[0]>2048||a.UV[1]<64||a.UV[1]>2048||!finite(a.B,6))throw Error('Invalid source UV eye mask');
   let end=0,total=0;for(let k=2;k<a.UV.length;k+=2){const start=a.UV[k],length=a.UV[k+1];if(start<end||length<=0||start+length>a.UV[0]*a.UV[1])throw Error('Invalid source UV eye runs');end=start+length;total+=length;}
   if(total<8||total>a.UV[0]*a.UV[1]*.1||[0,1,2].some(k=>a.B[k]>=a.B[k+3]||a.B[k+3]-a.B[k]>.2))throw Error('Unbounded source UV eye region');
  }

  return a;
 });
}
export function validateCowLashMetadata(strokes,centers,apertures,{requireWidths=false}={}){
 const seen=new Set(),curves=new Set();
 for(const {data:m,materialName,boneCenter} of strokes){
  if(!Number.isInteger(m.svEyeIndex)||m.svEyeIndex<0||m.svEyeIndex>1||!new RegExp(`^(shut|joy)${m.svEyeIndex}$`).test(m.svLashBone)||!materialName?.endsWith('-'+m.svLashBone)||seen.has(m.svLashBone)||!Array.isArray(m.svLash)||m.svLash.length<6||m.svLash.length%3||!m.svLash.every(Number.isFinite)||!Number.isFinite(m.svLashWidth)||m.svLashWidth<.002||m.svLashWidth>.006)throw Error('Invalid/duplicate lash metadata');
  const center=centers[m.svEyeIndex];
  if(!Array.isArray(boneCenter)||boneCenter.length!==3||!boneCenter.every(Number.isFinite)||Math.hypot(...boneCenter.map((v,j)=>v-center[j]))>.002)throw Error('Lash bone coordinate frame mismatch');
  let length=0;for(let j=0;j<m.svLash.length;j+=3){if(Math.hypot(...m.svLash.slice(j,j+3).map((v,k)=>v-center[k]))>.12)throw Error('Lash curve coordinate frame mismatch');if(j)length+=Math.hypot(...m.svLash.slice(j,j+3).map((v,k)=>v-m.svLash[j-3+k]));}
  const curve=JSON.stringify(m.svLash);if(!Number.isFinite(length)||length<=0||length>.12||curves.has(curve))throw Error('Invalid/duplicate lash curve');
  if(!Array.isArray(m.svLashBand)||m.svLashBand.length!==m.svLash.length*2||!m.svLashBand.every(Number.isFinite))throw Error('Missing actual surface lash band');
  const widths=m.svLashWidths;
  if(widths===undefined){if(requireWidths)throw Error('Missing per-sample lash widths');}
  else if(!Array.isArray(widths)||widths.length!==m.svLash.length/3||!widths.every(w=>Number.isFinite(w)&&w>0&&w<=m.svLashWidth))throw Error('Invalid per-sample lash widths');
  const frame=apertures?.[m.svEyeIndex];if(!frame)throw Error('Missing lash band coordinate frame');
  for(let j=0;j<m.svLashBand.length;j+=6){const a=m.svLashBand.slice(j,j+3),b=m.svLashBand.slice(j+3,j+6),delta=b.map((v,k)=>v-a[k]),dot=v=>v.reduce((s,x,k)=>s+x*delta[k],0);
   const width=widths===undefined?m.svLashWidth:widths[j/6];
   if(Math.abs(Math.abs(dot(frame.U))-2*width)>.0015||Math.abs(dot(frame.S))>.001||Math.abs(dot(frame.N))>.03||[a,b].some(p=>Math.hypot(...p.map((v,k)=>v-center[k]))>.12))throw Error('Unbounded actual lash band');
   const c=m.svLash.slice(j/2,j/2+3);if(Math.hypot(...a.map((v,k)=>(v+b[k])/2-c[k]))>.005)throw Error('Lash band detached from authored stroke');
  }
  seen.add(m.svLashBone);curves.add(curve);
 }
 if(seen.size!==4||!['shut0','shut1','joy0','joy1'].every(k=>seen.has(k)))throw Error('Requires four distinct eye/expression strokes');
}
// A textured socket shadow can survive unchanged from the open-eye reference.
// Measure its low-frequency trough, not an RGB delta or an exact-colour ring.
// The actual visible reference aperture supplies the frame. Native fur grain
// averages out across angular sectors; both sides of a crease must be lighter.
export function cowTexturedEyeRim(current,width,height,e,eyeIds,lashMask){
 const flags=new Uint8Array(width*height),bins=Array.from({length:12},()=>[[],[],[]]);
 if(e.coat!=='light'||!(e.aperturePixels>=40)||Math.min(e.rx,e.ry)<5)return {flags,sectors:0,contrast:[]};
 const luma=i=>(.3*current[4*i]+.59*current[4*i+1]+.11*current[4*i+2])/255;
 for(let y=Math.max(0,Math.floor(e.y-e.ry*1.65));y<Math.min(height,e.y+e.ry*1.65);y++)for(let x=Math.max(0,Math.floor(e.x-e.rx*1.65));x<Math.min(width,e.x+e.rx*1.65);x++){
  const i=y*width+x;if(!current[4*i+3]||(eyeIds?.[i]===e.index+1&&(lashMask?.[i]&(1<<e.index))))continue;
  const dx=(x-e.x)/e.rx,dy=(y-e.y)/e.ry,d=Math.hypot(dx,dy),k=Math.floor((Math.atan2(dy,dx)+Math.PI)*6/Math.PI)%12;
  const band=d>=.55&&d<.8?0:d>=.9&&d<1.3?1:d>=1.4&&d<1.65?2:-1;
  if(band>=0)bins[k][band].push(i);
 }
 const means=bins.map(b=>b.map(p=>p.length>=4?p.reduce((s,i)=>s+luma(i),0)/p.length:null));
 const contrast=means.map(m=>m.some(v=>v===null)?0:Math.min(m[0],m[2])-m[1]);
 const sectors=contrast.filter(v=>v>.025).length;
 // Four angular sectors (120 degrees of support) distinguish a surrounding
 // crease from a fur fleck. Do not forgive a crease retained in reference.
 if(sectors>=4)for(let k=0;k<12;k++)if(contrast[k]>.025){const flank=Math.min(means[k][0],means[k][2]);for(const i of bins[k][1])if(luma(i)<flank-.025)flags[i]=1;}
 return {flags,sectors,contrast};
}
// Cow adaptation of lid/mouth/stray face passes in audit.mts, meshy-audit-coverage
// 5f13d4b3b (13–14 Nov). Same HSV lid criterion, 4-connected group floor,
// 1px neighbourhood colour tolerance and mouth lip/core grouping; coat-aware
// brightness and the rim residual extend coverage to black/white animal fur.
export function cowFaceMetrics(current,reference,width,height,eyes,mouth,closed,mouthOpen=false,eyeIds=null,lashMask=null,referenceEyeIds=null,mouthIds=null,mouthSurfaceIds=null){
 const N=width*height,flags={lid:new Uint8Array(N),mouth:new Uint8Array(N),stray:new Uint8Array(N),rim:new Uint8Array(N),eyes:new Uint8Array(N),silhouette:new Uint8Array(N)};
 if(!Number.isInteger(width)||!Number.isInteger(height)||width<=0||height<=0||current.length!==N*4||reference.length!==N*4||(eyeIds&&eyeIds.length!==N)||(lashMask&&lashMask.length!==N)||(referenceEyeIds&&referenceEyeIds.length!==N)||(mouthIds&&(mouthIds.length!==N||mouthIds.some(id=>id!==0&&id!==1)))||(mouthSurfaceIds&&(mouthSurfaceIds.length!==N||mouthSurfaceIds.some(id=>id!==0&&id!==1))))throw Error('Invalid face render buffers');
 for(const ids of [eyeIds,referenceEyeIds])if(ids&&ids.some(id=>id!==0&&id!==1&&id!==2))throw Error('Invalid actual-eye IDs');
 if(eyes.some(e=>![e.x,e.y,e.rx,e.ry].every(Number.isFinite)||e.rx<=0||e.ry<=0||![0,1].includes(e.index))||![mouth.x,mouth.y,mouth.rx,mouth.ry].every(Number.isFinite))throw Error('Invalid projected face frame');
 const coverageErrors=[];
 if(closed&&!eyes.length)coverageErrors.push('Missing eye regions');
 const isLash=(i,e)=>!!(eyeIds&&eyeIds[i]===e.index+1&&lashMask&&(lashMask[i]&(1<<e.index)));
 // Alpha deltas are independent of eye/mouth colour allowances, including holes.
 for(let i=0;i<N;i++)if(current[4*i+3]!==reference[4*i+3])flags.silhouette[i]=1;
 if(closed&&!eyeIds)coverageErrors.push('Missing actual-eye ID pass');
 if(closed&&!referenceEyeIds)coverageErrors.push('Missing reference actual-eye ID pass');
 const val=(p,i)=>Math.max(p[4*i],p[4*i+1],p[4*i+2])/255;
 const sat=(p,i)=>{const a=val(p,i);return a?(a-Math.min(p[4*i],p[4*i+1],p[4*i+2])/255)/a:0;};
 const dist=(a,i,b,j)=>Math.hypot(a[4*i]-b[4*j],a[4*i+1]-b[4*j+1],a[4*i+2]-b[4*j+2])/255;
 // Judge fur pigment over a 3x3 area; individual pale hair texels are not
 // a pale skin patch. Stay within the same visible lid at occlusion boundaries.
 const average=(p,i,id=0,omitLash=0,openingOnly=false)=>{const x=i%width,y=i/width|0,sum=[0,0,0];let n=0;for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const u=x+dx,v=y+dy,j=v*width+u;if(u<0||u>=width||v<0||v>=height||!p[4*j+3]||(id&&eyeIds&&eyeIds[j]!==id)||(openingOnly&&referenceEyeIds?.[j]!==id)||(omitLash&&eyeIds?.[j]===id&&(lashMask?.[j]&omitLash)))continue;for(let k=0;k<3;k++)sum[k]+=p[4*j+k]/255;n++;}return sum.map(v=>v/Math.max(1,n));};
 const colourDistance=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1],a[2]-b[2]);
 const median=a=>{a.sort((x,y)=>x-y);return a[a.length>>1]??0;};
 const groups=mask=>{const seen=new Uint8Array(N),out=[];for(let i=0;i<N;i++)if(mask[i]&&!seen[i]){const g=[],st=[i];seen[i]=1;while(st.length){const j=st.pop();g.push(j);const x=j%width,y=j/width|0;for(const [dx,dy]of[[1,0],[-1,0],[0,1],[0,-1]]){const u=x+dx,v=y+dy,k=v*width+u;if(u>=0&&u<width&&v>=0&&v<height&&mask[k]&&!seen[k]){seen[k]=1;st.push(k);}}}out.push(g);}return out.sort((a,b)=>b.length-a.length);};
 const count=mask=>{for(const g of groups(mask))if(g.length<4)for(const i of g)mask[i]=0;return mask.reduce((a,b)=>a+b,0);};
 // Match audit.mts: eye zone comes from actual visible whites + iris/lashes,
 // then the box grows 35% each way (at least 6px). Anatomical coordinates seed
 // the search; on black fur the isolated sclera bounds the iris, not a flood
 // through the whole dark coat. This is not an allowance for a wide mood patch.
 const eyeZone=new Uint8Array(N),eyeData=[],eyeFeatures=new Map();
 const featureBox=e=>{
  const feature=new Uint8Array(N);
  for(let y=Math.max(0,Math.floor(e.y-e.ry*3.2));y<Math.min(height,e.y+e.ry*3.2);y++)for(let x=Math.max(0,Math.floor(e.x-e.rx*3.2));x<Math.min(width,e.x+e.rx*3.2);x++){
   const i=y*width+x;if(!reference[4*i+3]||referenceEyeIds?.[i]!==e.index+1)continue;const v=val(reference,i),s=sat(reference,i);
   if(e.coat==='dark'?v>.70&&s<.4:v<.45)feature[i]=1;
  }
  const accepted=[];
  for(const g of groups(feature)){
   if(g.length<6)continue;const xs=g.map(i=>i%width),ys=g.map(i=>i/width|0),x0=Math.min(...xs),x1=Math.max(...xs),y0=Math.min(...ys),y1=Math.max(...ys);
   if(x0<=e.x-e.rx*3.1||x1>=e.x+e.rx*3.1||y0<=e.y-e.ry*3.1||y1>=e.y+e.ry*3.1)continue;
   const mx=xs.reduce((a,b)=>a+b,0)/g.length,my=ys.reduce((a,b)=>a+b,0)/g.length;if(Math.hypot((mx-e.x)/e.rx,(my-e.y)/e.ry)>1.5)continue;
   accepted.push(...g);
  }
  const aperture=[];
  if(referenceEyeIds)for(let i=0;i<N;i++)if(referenceEyeIds[i]===e.index+1)aperture.push(i);
  if(accepted.length||aperture.length){
   // Iris and outer lash arc may be disconnected; both bound the actual eye.
   const bounds=aperture.length?aperture:accepted,xs=bounds.map(i=>i%width),ys=bounds.map(i=>i/width|0),x0=Math.min(...xs),x1=Math.max(...xs),y0=Math.min(...ys),y1=Math.max(...ys),fm=new Uint8Array(N);
   for(const i of accepted)fm[i]=1;eyeFeatures.set(e.index,fm);
   return {...e,x:(x0+x1)/2,y:(y0+y1)/2,rx:Math.max(2,(x1-x0)/2),ry:Math.max(2,(y1-y0)/2),featurePixels:accepted.length,aperturePixels:aperture.length};
  }
  return {...e,featurePixels:0};
 };
 for(const seed of eyes){const e=featureBox(seed),vv=[],ss=[],mx=Math.max(6,e.rx*.7),my=Math.max(6,e.ry*.7);
  for(let y=0;y<height;y++)for(let x=0;x<width;x++){
   const i=y*width+x,d=Math.hypot((x-e.x)/e.rx,(y-e.y)/e.ry);
   if((e.featurePixels>0||e.aperturePixels>0)&&Math.abs(x-e.x)<e.rx+mx&&Math.abs(y-e.y)<e.ry+my)eyeZone[i]=1;
   if(d>1.5&&d<2.05&&current[4*i+3]){const v=val(current,i);if(e.coat==='dark'?v<.32:v>.5){vv.push(v);ss.push(sat(current,i));}}
  }
  let idPixels=0,uncovered=0,referencePixels=0;
  for(let i=0;i<N;i++){
   const x=i%width,y=i/width|0;if(Math.hypot((x-e.x)/e.rx,(y-e.y)/e.ry)<1.3&&eyeIds?.[i]===e.index+1)idPixels++;
   if(referenceEyeIds?.[i]===e.index+1){referencePixels++;if(eyeIds?.[i]!==e.index+1)uncovered++;}
  }
  // All visible aperture pixels need a cover, even at oblique views or when
  // no RGB feature group was found. An occluded eye contributes no aperture.
  if(closed&&uncovered>6)coverageErrors.push(`Eye ${e.index}: insufficient actual-eye ID coverage (${idPixels} pixels, ${uncovered} uncovered)`);
  if(closed&&seed.requireCoverage){
   if(referencePixels<4)coverageErrors.push(`Eye ${e.index}: missing rendered reference aperture`);
   if(!e.featurePixels)coverageErrors.push(`Eye ${e.index}: missing rendered reference feature`);
   if(idPixels<4&&uncovered<=6)coverageErrors.push(`Eye ${e.index}: insufficient actual-eye ID coverage (${idPixels} pixels, ${uncovered} uncovered)`);
   if(vv.length<8)coverageErrors.push(`Eye ${e.index}: insufficient native fur samples`);
  }
  eyeData.push({e,v:median(vv),s:median(ss),measured:vv.length,idPixels,uncovered,referencePixels});
 }
 const mouthZone=(x,y,pad=0)=>Math.abs(x-mouth.x)<=mouth.rx+pad&&Math.abs(y-mouth.y)<=mouth.ry+pad;
 const close=(i)=>{const x=i%width,y=i/width|0;for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const u=x+dx,v=y+dy;if(u>=0&&u<width&&v>=0&&v<height&&dist(current,i,reference,v*width+u)<.08)return true;}return false;};
 if(closed)for(const {e,v,s,measured}of eyeData){if(measured<8)continue;for(let y=0;y<height;y++)for(let x=0;x<width;x++){
  const i=y*width+x;if(eyeIds&&eyeIds[i]!==e.index+1)continue;const dx=(x-e.x)/e.rx,dy=(y-e.y)/e.ry,d=Math.hypot(dx,dy);if(!current[4*i+3])continue;
  // The narrow lash arc itself may contrast with the coat; a broad patch may not.
  const lash=isLash(i,e);
  const opening=referenceEyeIds?.[i]===e.index+1;
  const rgb=average(current,i,eyeIds?eyeIds[i]:0,1<<e.index,opening),cv=Math.max(...rgb),cs=cv?(cv-Math.min(...rgb))/cv:0;
  // Native hair identical in both renders is not a new lid patch. Compare
  // exactly the same ID-restricted support; no tolerance for changed seams.
  const prior=average(reference,i,eyeIds?eyeIds[i]:0,1<<e.index,opening),pv=Math.max(...prior),ps=pv?(pv-Math.min(...prior))/pv:0;
  const changed=colourDistance(rgb,prior)>1e-8;
  // Outside the original eye, an existing fur shadow that got lighter is
  // not a newly darkened lid. Within the eye, keep absolute coat checks.
  // Skin's low-saturation criterion is inappropriate for near-black hairs;
  // black-coat pale patches use brightness, plus independent flat-fur/rim.
  const bad=e.coat==='dark'?(cv>v+.075&&(opening||cv>pv)):
   ((cv>v-.1&&cs<s-.12&&(opening||(cs<ps&&cv>pv)))||(cv<v-.18&&(opening||cv<pv)));
  // Outside the actual opening, compare with native fur using the same 1px
  // registration/.08 colour tolerance as stray. Texture/filter phase shifts
  // that reproduce an existing fur colour are not a new pale/dark patch.
  if(d<1.3&&!lash&&changed&&bad&&(opening||!close(i)))flags.lid[i]=1;
  // A pre-existing cream/black coat boundary is not the rim of a grey lid.
  // Require unchanged warm white fur from the reference beside current dark fur;
  // a grey ring on black, or any new rim on a white coat, still gets counted.
  let coatEdge=false;if(e.coat==='dark'){let black=false,white=false;for(let oy=-2;oy<=2;oy++)for(let ox=-2;ox<=2;ox++){const u=x+ox,vv=y+oy,j=vv*width+u;if(u<0||u>=width||vv<0||vv>=height||!current[4*j+3])continue;if(val(current,j)<.32)black=true;if(val(current,j)>.55&&sat(current,j)>.1&&val(reference,j)>.55&&sat(reference,j)>.1&&dist(current,j,reference,j)<.08)white=true;}coatEdge=black&&white;}
  // Actual aperture IDs, rather than an ellipse through the asymmetric iris,
  // distinguish the outer material edge from ordinary replacement fur.
  // Inside it, retain anomalous-colour edges and independently detect closed
  // uniform contours below (including native-range/dark internal rings).
  const anomalous=e.coat==='dark'?cv>v+.075:cv<v-.18||(cv>v-.1&&cs<s-.12);
  let nativeMatch=false;
  if(!opening&&val(current,i)>.55&&sat(current,i)>.1){
   for(let oy=-1;oy<=1;oy++)for(let ox=-1;ox<=1;ox++){const u=x+ox,w=y+oy,j=w*width+u;if(u<0||u>=width||w<0||w>=height||!reference[4*j+3]||referenceEyeIds?.[j])continue;if(val(reference,j)>.55&&sat(reference,j)>.1&&dist(current,i,reference,j)<.08)nativeMatch=true;}
  }
  if(d>1.15&&d<1.85&&(!opening||anomalous)&&!lash&&!coatEdge&&!nativeMatch){for(const j of [i-2,i+2,i-2*width,i+2*width])if(j>=0&&j<N&&current[4*j+3]&&reference[4*j+3]){const residual=colourDistance(average(current,i),average(current,j))-colourDistance(average(reference,i),average(reference,j));if(residual>.065){flags.rim[i]=1;break;}}}
 }}
 if(closed)for(const info of eyeData){const rim=cowTexturedEyeRim(current,width,height,info.e,eyeIds,lashMask);info.texturedRim={sectors:rim.sectors,contrast:rim.contrast};for(let i=0;i<N;i++)if(rim.flags[i])flags.rim[i]=1;}
 // A hard internal ring can use colours already present in the fur. Find
 // closed uniform contours inside the measured aperture without relying on
 // brightness or the old elliptical annulus. Small fur flecks enclose no area.
 if(closed&&referenceEyeIds&&eyeIds){const seen=new Uint8Array(N);
  for(let start=0;start<N;start++){
   const id=referenceEyeIds[start],e=eyes.find(e=>e.index+1===id);if(!id||!e||seen[start]||eyeIds[start]!==id)continue;
   const group=[],stack=[start];seen[start]=1;let x0=width,x1=0,y0=height,y1=0;
   while(stack.length){const i=stack.pop(),x=i%width,y=i/width|0;group.push(i);x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y);
    for(const [dx,dy]of [[1,0],[-1,0],[0,1],[0,-1]]){const u=x+dx,v=y+dy,j=v*width+u;if(u<0||u>=width||v<0||v>=height||seen[j]||referenceEyeIds[j]!==id||eyeIds[j]!==id)continue;if(current[4*j]!==current[4*start]||current[4*j+1]!==current[4*start+1]||current[4*j+2]!==current[4*start+2])continue;seen[j]=1;stack.push(j);}
   }
   if(group.length<4||x1-x0<e.rx*.5||y1-y0<e.ry*.5)continue;
   const w=x1-x0+3,h=y1-y0+3,barrier=new Uint8Array(w*h),outside=new Uint8Array(w*h),todo=[0];
   for(const i of group)barrier[((i/width|0)-y0+1)*w+i%width-x0+1]=1;outside[0]=1;
   while(todo.length){const i=todo.pop(),x=i%w,y=i/w|0;for(const [dx,dy]of [[1,0],[-1,0],[0,1],[0,-1]]){const u=x+dx,v=y+dy,j=v*w+u;if(u<0||u>=w||v<0||v>=h||outside[j]||barrier[j])continue;outside[j]=1;todo.push(j);}}
   let enclosed=0;for(let i=0;i<w*h;i++)if(!outside[i]&&!barrier[i])enclosed++;
   if(enclosed>=4&&enclosed>group.length*.5)for(const i of group)flags.rim[i]=1;
  }
 }
 // A same-colour flat patch can have no strong colour rim. Compare its fur
 // grain with visible native fur, trimming the top 25% so a lash is not texture.
 // This catches the R16 mean-colour fill even when its average RGB matches.
 let textureFlat=0;
 const quant75=a=>{a.sort((a,b)=>a-b);return a[Math.floor(a.length*.75)]||0;};
 const luma=(p,i)=>(.3*p[4*i]+.59*p[4*i+1]+.11*p[4*i+2])/255;
 const grainAt=i=>{const x=i%width,y=i/width|0;if(x<1||x>=width-1||y<1||y>=height-1)return null;let sum=0;for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const j=i+dy*width+dx;if(!current[4*j+3])return null;sum+=luma(current,j);}return Math.abs(luma(current,i)-sum/9);};
 if(closed&&eyeIds)for(const info of eyeData){const e=info.e,inside=[],native=[],pixels=[];
  for(let y=Math.max(0,Math.floor(e.y-e.ry*2.5));y<Math.min(height,e.y+e.ry*2.5);y++)for(let x=Math.max(0,Math.floor(e.x-e.rx*2.5));x<Math.min(width,e.x+e.rx*2.5);x++){
   const i=y*width+x;if(!current[4*i+3])continue;const d=Math.hypot((x-e.x)/e.rx,(y-e.y)/e.ry),g=grainAt(i);if(g===null)continue;
   if(d<1.1&&eyeIds[i]===e.index+1&&!isLash(i,e)){inside.push(g);pixels.push(i);}
   if(d>1.6&&d<2.5&&!eyeIds[i]&&(e.coat==='dark'?val(current,i)<.32:val(current,i)>.6&&sat(current,i)>.1))native.push(g);
  }
  const actual=quant75(inside),expected=quant75(native);info.texture={actual,native:expected,samples:inside.length,referenceSamples:native.length};
  if(inside.length>=40&&native.length>=80&&expected>.003&&actual<expected*.25){for(const i of pixels)flags.rim[i]=1;textureFlat+=pixels.length;}
 }
 // Independent rendered-colour eye test: the depth probe can prove coverage
 // but cannot prove an opaque cover did not retain a painted iris or sparkle.
 // The authored 3D stroke is excluded, not a broad eye-coloured rectangle.
 if(closed)for(const {e}of eyeData){const feature=eyeFeatures.get(e.index);
  for(let i=0;i<N;i++){
   if(referenceEyeIds?.[i]!==e.index+1||!current[4*i+3]||isLash(i,e))continue;
   const v=val(current,i),s=sat(current,i);
   if(e.coat==='light'){if((v<.35&&feature?.[i])||(v>.9&&s<.08))flags.eyes[i]=1;}
   else if(v>.8&&s<.16)flags.eyes[i]=1;
  }
 }
 // A mood may only change the eye zones and mouth (+3px), never nose, fur or fringe.
 for(let i=0;i<N;i++){const x=i%width,y=i/width|0;if(!current[4*i+3]||!reference[4*i+3]||eyeZone[i]||mouthZone(x,y,3))continue;if(!close(i))flags.stray[i]=1;}
 // Closed mouths must agree with the neutral mouth. Open mouths have one main lip
 // core; isolated old lips outside its 3px neighbourhood are faults (audit.mts).
 const lips=new Uint8Array(N),core=new Uint8Array(N),visibleMouth=new Uint8Array(N);
 if(mouthIds)for(let i=0;i<N;i++)if(mouthIds[i]){const x=i%width,y=i/width|0;for(let dy=-3;dy<=3;dy++)for(let dx=-3;dx<=3;dx++){const u=x+dx,v=y+dy;if(u>=0&&u<width&&v>=0&&v<height)visibleMouth[v*width+u]=1;}}
 for(let i=0;i<N;i++){const x=i%width,y=i/width|0;if(!mouthZone(x,y)||(mouthOpen&&(mouthSurfaceIds?!mouthSurfaceIds[i]:mouthIds&&!visibleMouth[i])))continue;const r=current[4*i]/255,g=current[4*i+1]/255,b=current[4*i+2]/255;if(val(current,i)<.32&&r>g*1.1){lips[i]=1;if(val(current,i)<.23)core[i]=1;}if(!mouthOpen&&!close(i))flags.mouth[i]=1;}
 if(mouthOpen){const gs=groups(core),main=gs[0]||[],mask=new Uint8Array(N);for(const i of main)mask[i]=1;
  // A tongue can split the darkest core while its lip remains connected.
  // Keep that one physical lip; disconnected old/duplicate lips still fail.
  const connected=groups(lips).find(g=>g.some(i=>mask[i]));if(connected)for(const i of connected)mask[i]=1;
  for(let i=0;i<N;i++)if(lips[i]){const x=i%width,y=i/width|0;let near=false;for(let dy=-3;dy<=3;dy++)for(let dx=-3;dx<=3;dx++){const u=x+dx,v=y+dy;if(u>=0&&u<width&&v>=0&&v<height&&mask[v*width+u])near=true;}if(!near)flags.mouth[i]=1;}}
 const counts=Object.fromEntries(Object.entries(flags).map(([k,v])=>[k,count(v)]));
 return {counts,flags,eyeData,textureFlat,coverageErrors,mouthVisiblePixels:mouthIds?mouthIds.reduce((a,b)=>a+(b?1:0),0):null};
}
