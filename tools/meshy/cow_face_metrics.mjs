// Cow adaptation of lid/mouth/stray face passes in audit.mts, meshy-audit-coverage
// 5f13d4b3b (13–14 Nov). Same HSV lid criterion, 4-connected group floor,
// 1px neighbourhood colour tolerance and mouth lip/core grouping; coat-aware
// brightness and the rim residual extend coverage to black/white animal fur.
export function cowFaceMetrics(current,reference,width,height,eyes,mouth,closed,mouthOpen=false,eyeIds=null){
 const N=width*height,flags={lid:new Uint8Array(N),mouth:new Uint8Array(N),stray:new Uint8Array(N),rim:new Uint8Array(N)};
 const val=(p,i)=>Math.max(p[4*i],p[4*i+1],p[4*i+2])/255;
 const sat=(p,i)=>{const a=val(p,i);return a?(a-Math.min(p[4*i],p[4*i+1],p[4*i+2])/255)/a:0;};
 const dist=(a,i,b,j)=>Math.hypot(a[4*i]-b[4*j],a[4*i+1]-b[4*j+1],a[4*i+2]-b[4*j+2])/255;
 const median=a=>{a.sort((x,y)=>x-y);return a[a.length>>1]??0;};
 const groups=mask=>{const seen=new Uint8Array(N),out=[];for(let i=0;i<N;i++)if(mask[i]&&!seen[i]){const g=[],st=[i];seen[i]=1;while(st.length){const j=st.pop();g.push(j);const x=j%width,y=j/width|0;for(const [dx,dy]of[[1,0],[-1,0],[0,1],[0,-1]]){const u=x+dx,v=y+dy,k=v*width+u;if(u>=0&&u<width&&v>=0&&v<height&&mask[k]&&!seen[k]){seen[k]=1;st.push(k);}}}out.push(g);}return out.sort((a,b)=>b.length-a.length);};
 const count=mask=>{for(const g of groups(mask))if(g.length<4)for(const i of g)mask[i]=0;return mask.reduce((a,b)=>a+b,0);};
 // Match audit.mts: eye zone comes from actual visible whites + iris/lashes,
 // then the box grows 35% each way (at least 6px). Anatomical coordinates seed
 // the search; on black fur the isolated sclera bounds the iris, not a flood
 // through the whole dark coat. This is not an allowance for a wide mood patch.
 const eyeZone=new Uint8Array(N),eyeData=[];
 const featureBox=e=>{
  const feature=new Uint8Array(N);
  for(let y=Math.max(0,Math.floor(e.y-e.ry*3.2));y<Math.min(height,e.y+e.ry*3.2);y++)for(let x=Math.max(0,Math.floor(e.x-e.rx*3.2));x<Math.min(width,e.x+e.rx*3.2);x++){
   const i=y*width+x;if(!reference[4*i+3])continue;const v=val(reference,i),s=sat(reference,i);
   if(e.coat==='dark'?v>.70&&s<.4:v<.45)feature[i]=1;
  }
  for(const g of groups(feature)){
   if(g.length<6)continue;const xs=g.map(i=>i%width),ys=g.map(i=>i/width|0),x0=Math.min(...xs),x1=Math.max(...xs),y0=Math.min(...ys),y1=Math.max(...ys);
   if(x0<=e.x-e.rx*3.1||x1>=e.x+e.rx*3.1||y0<=e.y-e.ry*3.1||y1>=e.y+e.ry*3.1)continue;
   const mx=xs.reduce((a,b)=>a+b,0)/g.length,my=ys.reduce((a,b)=>a+b,0)/g.length;if(Math.hypot((mx-e.x)/e.rx,(my-e.y)/e.ry)>1.5)continue;
   if(e.coat==='dark'){const rx=Math.max(Math.abs(x0-e.x),Math.abs(x1-e.x)),ry=Math.max(Math.abs(y0-e.y),Math.abs(y1-e.y));return {...e,rx,ry,featurePixels:g.length};}
   return {...e,x:(x0+x1)/2,y:(y0+y1)/2,rx:Math.max(2,(x1-x0)/2),ry:Math.max(2,(y1-y0)/2),featurePixels:g.length};
  }
  return {...e,featurePixels:0};
 };
 for(const seed of eyes){const e=featureBox(seed),vv=[],ss=[],mx=Math.max(6,e.rx*.7),my=Math.max(6,e.ry*.7);
  for(let y=0;y<height;y++)for(let x=0;x<width;x++){
   const i=y*width+x,d=Math.hypot((x-e.x)/e.rx,(y-e.y)/e.ry);
   if(Math.abs(x-e.x)<e.rx+mx&&Math.abs(y-e.y)<e.ry+my)eyeZone[i]=1;
   if(d>1.5&&d<2.05&&current[4*i+3]){const v=val(current,i);if(e.coat==='dark'?v<.32:v>.5){vv.push(v);ss.push(sat(current,i));}}
  }
  eyeData.push({e,v:median(vv),s:median(ss),measured:vv.length});
 }
 const mouthZone=(x,y,pad=0)=>Math.abs(x-mouth.x)<=mouth.rx+pad&&Math.abs(y-mouth.y)<=mouth.ry+pad;
 const close=(i)=>{const x=i%width,y=i/width|0;for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const u=x+dx,v=y+dy;if(u>=0&&u<width&&v>=0&&v<height&&dist(current,i,reference,v*width+u)<.08)return true;}return false;};
 if(closed)for(const {e,v,s,measured}of eyeData){if(measured<8)continue;for(let y=0;y<height;y++)for(let x=0;x<width;x++){
  const i=y*width+x;if(eyeIds&&eyeIds[i]!==e.index+1)continue;const dx=(x-e.x)/e.rx,dy=(y-e.y)/e.ry,d=Math.hypot(dx,dy);if(!current[4*i+3])continue;
  // The narrow lash arc itself may contrast with the coat; a broad patch may not.
  const lash=Math.abs(dy)<.32&&Math.abs(dx)<.9;
  const cv=val(current,i),cs=sat(current,i);
  if(d<1.3&&!lash&&((cv>v-.1&&cs<s-.12)||(e.coat==='dark'?cv>v+.075:cv<v-.18)))flags.lid[i]=1;
  if(d>1.15&&d<1.85&&!lash){for(const j of [i-1,i+1,i-width,i+width])if(j>=0&&j<N&&current[4*j+3]&&reference[4*j+3]){const residual=dist(current,i,current,j)-dist(reference,i,reference,j);if(residual>.065){flags.rim[i]=1;break;}}}
 }}
 // A mood may only change the eye zones and mouth (+3px), never nose, fur or fringe.
 for(let i=0;i<N;i++){const x=i%width,y=i/width|0;if(!current[4*i+3]||!reference[4*i+3]||eyeZone[i]||mouthZone(x,y,3))continue;if(!close(i))flags.stray[i]=1;}
 // Closed mouths must agree with the neutral mouth. Open mouths have one main lip
 // core; isolated old lips outside its 3px neighbourhood are faults (audit.mts).
 const lips=new Uint8Array(N),core=new Uint8Array(N);
 for(let i=0;i<N;i++){const x=i%width,y=i/width|0;if(!mouthZone(x,y))continue;const r=current[4*i]/255,g=current[4*i+1]/255,b=current[4*i+2]/255;if(val(current,i)<.32&&r>g*1.1){lips[i]=1;if(val(current,i)<.23)core[i]=1;}if(!mouthOpen&&!close(i))flags.mouth[i]=1;}
 if(mouthOpen){const gs=groups(core),main=gs[0]||[],mask=new Uint8Array(N);for(const i of main)mask[i]=1;for(let i=0;i<N;i++)if(lips[i]){const x=i%width,y=i/width|0;let near=false;for(let dy=-3;dy<=3;dy++)for(let dx=-3;dx<=3;dx++){const u=x+dx,v=y+dy;if(u>=0&&u<width&&v>=0&&v<height&&mask[v*width+u])near=true;}if(!near)flags.mouth[i]=1;}}
 const counts=Object.fromEntries(Object.entries(flags).map(([k,v])=>[k,count(v)]));
 return {counts,flags,eyeData};
}
