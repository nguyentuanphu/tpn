// Interpolate rest-world positions through geometry.color, independently of skinning.
// Non-eye fragments remain opaque black so cheek/ear rays occlude the aperture.
export function createCowEyeProbeMaterial(THREE,apertures){
 const mask=new THREE.MeshBasicMaterial({vertexColors:true,side:THREE.DoubleSide});
 mask.customProgramCacheKey=()=> 'cow-real-aperture-ids-v1';
 mask.onBeforeCompile=sh=>{
  let declarations='',functions='';
  for(let eye=0;eye<2;eye++){
    const a=apertures[eye],count=a.H.length/2;
    for(const key of ['C','S','U','N'])sh.uniforms[`svE${eye}${key}`]={value:new THREE.Vector3(...a[key])};
    sh.uniforms[`svE${eye}D`]={value:new THREE.Vector2(...a.D)};
    sh.uniforms[`svE${eye}Count`]={value:count};
    sh.uniforms[`svE${eye}Hull`]={value:Array.from({length:64},(_,j)=>new THREE.Vector2(...a.H.slice((j%count)*2,(j%count)*2+2)))};
    declarations+=`uniform vec3 svE${eye}C,svE${eye}S,svE${eye}U,svE${eye}N; uniform vec2 svE${eye}D;
      uniform int svE${eye}Count; uniform vec2 svE${eye}Hull[64];\n`;
    functions+=`bool svInside${eye}(vec3 p){
      vec3 d=p-svE${eye}C;vec2 q=vec2(dot(d,svE${eye}S),dot(d,svE${eye}U));
      for(int k=0;k<64;k++){if(k>=svE${eye}Count)break;int j=k+1;if(j>=svE${eye}Count)j=0;
        vec2 a=svE${eye}Hull[k],b=svE${eye}Hull[j],edge=b-a;
        // 50 micrometres covers packed-position rounding, not native fur.
        if(edge.x*(q.y-a.y)-edge.y*(q.x-a.x)<-.00005*length(edge))return false;}
      float depth=dot(d,svE${eye}N);return depth>svE${eye}D.x&&depth<svE${eye}D.y;}
    `;
  }
  sh.fragmentShader=declarations+functions+sh.fragmentShader;
  sh.fragmentShader=sh.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
    diffuseColor.rgb=svInside0(vColor.xyz)?vec3(1.,0.,0.):svInside1(vColor.xyz)?vec3(0.,1.,0.):vec3(0.);`);
 };
 return mask;
}

// Call before animation: metadata and these vertices share the loaded rest-world frame.
export function cowEyeRestPositions(THREE,body){
 let root=body;while(root.parent)root=root.parent;root.updateMatrixWorld(true);
 body.skeleton.update();
 const pos=body.geometry.getAttribute('position'),rest=new Float32Array(pos.count*3),v=new THREE.Vector3();
 for(let i=0;i<pos.count;i++){
  v.fromBufferAttribute(pos,i);(body.applyBoneTransform||body.boneTransform).call(body,i,v);v.applyMatrix4(body.matrixWorld);v.toArray(rest,i*3);
 }
 return new THREE.BufferAttribute(rest,3);
}

export function decodeCowEyeIds(pixels){
 const ids=new Uint8Array(pixels.length/4);
 for(let i=0;i<ids.length;i++){
  if(pixels[i*4]>128&&pixels[i*4+1]<64)ids[i]=1;
  if(pixels[i*4+1]>128&&pixels[i*4]<64)ids[i]=2;
 }
 return ids;
}

// Keep every occluder in the depth pass, including alpha-cut lid/lash children.
export function readCowReferenceEyeIds(THREE,scene,body,restPositions,apertures,read,cam){
 const saved=[],temporary=[],oldColor=body.geometry.getAttribute('color');
 const black=new THREE.MeshBasicMaterial({color:0,side:THREE.DoubleSide});
 const probe=createCowEyeProbeMaterial(THREE,apertures);temporary.push(black,probe);
 const occluder=original=>{
  if(!((original.transparent&&original.map)||original.polygonOffset))return black;
  const mat=new THREE.MeshBasicMaterial({color:0,map:original.transparent?original.map:null,alphaMap:original.alphaMap,
   alphaTest:original.transparent?.95:original.alphaTest,side:original.side,
   polygonOffset:original.polygonOffset,polygonOffsetFactor:original.polygonOffsetFactor,polygonOffsetUnits:original.polygonOffsetUnits});
  temporary.push(mat);return mat;
 };
 try{
  scene.traverse(o=>{if(o.isMesh){saved.push([o,o.material]);o.material=Array.isArray(o.material)?o.material.map(occluder):occluder(o.material);}});
  body.geometry.setAttribute('color',restPositions);body.material=probe;
  return decodeCowEyeIds(read(cam));
 }finally{
  if(oldColor)body.geometry.setAttribute('color',oldColor);else body.geometry.deleteAttribute('color');
  for(const [o,material]of saved)o.material=material;
  for(const mat of temporary)mat.dispose();
 }
}
