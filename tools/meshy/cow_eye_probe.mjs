// Interpolate rest-world positions through geometry.color, independently of skinning.
// Non-eye fragments remain opaque black so cheek/ear rays occlude the aperture.
export function createCowEyeProbeMaterial(THREE,apertures,bodyMap=null){
 const mask=new THREE.MeshBasicMaterial({vertexColors:true,side:THREE.DoubleSide,map:bodyMap}),textures=[];
 mask.addEventListener('dispose',()=>textures.forEach(t=>t.dispose()));
 mask.customProgramCacheKey=()=> 'cow-real-aperture-ids-v2-'+apertures.some(a=>a.UV);
 if(apertures.some(a=>a.UV)&&!bodyMap)throw Error('Source UV probe requires actual body map transform');
 if(apertures.some(a=>a.UV&&(a.UV[0]!==bodyMap.image.width||a.UV[1]!==bodyMap.image.height)))throw Error('Source UV mask/body image dimensions differ');
 mask.onBeforeCompile=sh=>{
  let declarations='',functions='';
  for(let eye=0;eye<2;eye++){
    const a=apertures[eye],count=a.H.length/2;
    // Stored masks use Blender image rows; glTF reverses source UV V.
    if(a.UV){
     const [w,h]=a.UV,data=new Uint8Array(w*h*4);
     for(let k=2;k<a.UV.length;k+=2)for(let j=a.UV[k];j<a.UV[k]+a.UV[k+1];j++){data[j*4]=255;data[j*4+3]=255;}
     const texture=new THREE.DataTexture(data,w,h,THREE.RGBAFormat,THREE.UnsignedByteType);texture.magFilter=texture.minFilter=THREE.NearestFilter;texture.generateMipmaps=false;texture.needsUpdate=true;textures.push(texture);
     sh.uniforms[`svE${eye}UV`]={value:texture};sh.uniforms[`svE${eye}Min`]={value:new THREE.Vector3(...a.B.slice(0,3))};sh.uniforms[`svE${eye}Max`]={value:new THREE.Vector3(...a.B.slice(3))};
     declarations+=`uniform sampler2D svE${eye}UV;uniform vec3 svE${eye}Min,svE${eye}Max;\n`;
     functions+=`bool svInside${eye}(vec3 p,vec2 uv){return all(greaterThanEqual(p,svE${eye}Min))&&all(lessThanEqual(p,svE${eye}Max))&&texture2D(svE${eye}UV,vec2(uv.x,1.-uv.y)).r>.5;}\n`;
     if(a.F){
      const fur=new Uint8Array(w*h*4);for(let k=2;k<a.F.length;k+=2)for(let j=a.F[k];j<a.F[k]+a.F[k+1];j++)fur[j*4]=255;
      const ftex=new THREE.DataTexture(fur,w,h,THREE.RGBAFormat,THREE.UnsignedByteType);ftex.magFilter=ftex.minFilter=THREE.LinearFilter;ftex.generateMipmaps=false;ftex.needsUpdate=true;textures.push(ftex);sh.uniforms[`svE${eye}F`]={value:ftex};declarations+=`uniform sampler2D svE${eye}F;\n`;
      // The source component marks real cream blaze hairs, not sclera. Its
      // mixed edge must not become an absolute black-coat lid colour failure.
      functions=functions.replace(`texture2D(svE${eye}UV,vec2(uv.x,1.-uv.y)).r>.5;`,`texture2D(svE${eye}UV,vec2(uv.x,1.-uv.y)).r>.5&&texture2D(svE${eye}F,vec2(uv.x,1.-uv.y)).r<.25;`);
     }
     continue;
    }

    for(const key of ['C','S','U','N'])sh.uniforms[`svE${eye}${key}`]={value:new THREE.Vector3(...a[key])};
    sh.uniforms[`svE${eye}D`]={value:new THREE.Vector2(...a.D)};
    const size=a.M[0],data=new Uint8Array(size*size*4);
    for(let k=1;k<a.M.length;k+=2)for(let j=a.M[k];j<a.M[k]+a.M[k+1];j++){data[j*4]=255;data[j*4+3]=255;}
    const texture=new THREE.DataTexture(data,size,size,THREE.RGBAFormat,THREE.UnsignedByteType);texture.magFilter=texture.minFilter=THREE.NearestFilter;texture.generateMipmaps=false;texture.needsUpdate=true;textures.push(texture);
    sh.uniforms[`svE${eye}Mask`]={value:texture};sh.uniforms[`svE${eye}P`]={value:a.P};

    sh.uniforms[`svE${eye}Count`]={value:count};
    sh.uniforms[`svE${eye}Hull`]={value:Array.from({length:64},(_,j)=>new THREE.Vector2(...a.H.slice((j%count)*2,(j%count)*2+2)))};
    declarations+=`uniform vec3 svE${eye}C,svE${eye}S,svE${eye}U,svE${eye}N; uniform vec2 svE${eye}D; uniform float svE${eye}P; uniform sampler2D svE${eye}Mask;
      uniform int svE${eye}Count; uniform vec2 svE${eye}Hull[64];\n`;
    functions+=`bool svInside${eye}(vec3 p,vec2 sourceUV){
      vec3 d=p-svE${eye}C;vec2 q=vec2(dot(d,svE${eye}S),dot(d,svE${eye}U));
      for(int k=0;k<64;k++){if(k>=svE${eye}Count)break;int j=k+1;if(j>=svE${eye}Count)j=0;
        vec2 a=svE${eye}Hull[k],b=svE${eye}Hull[j],edge=b-a;
        // 14-bit positions over 1.33m need ~58 micrometres at diagonal edges.
        if(edge.x*(q.y-a.y)-edge.y*(q.x-a.x)<-.000065*length(edge))return false;}
      float depth=dot(d,svE${eye}N);vec2 uv=q/(2.*svE${eye}P)+.5;return depth>svE${eye}D.x&&depth<svE${eye}D.y&&all(greaterThanEqual(uv,vec2(0.)))&&all(lessThanEqual(uv,vec2(1.)))&&texture2D(svE${eye}Mask,uv).r>.5;}
    `;
  }
  sh.fragmentShader=declarations+functions+sh.fragmentShader;
  sh.fragmentShader=sh.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
    vec2 svSourceUV=vec2(0.);
    #ifdef USE_MAP
    svSourceUV=vMapUv;
    #endif
    diffuseColor.rgb=svInside0(vColor.xyz,svSourceUV)?vec3(1.,0.,0.):svInside1(vColor.xyz,svSourceUV)?vec3(0.,1.,0.):vec3(0.);`);
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
 const probe=createCowEyeProbeMaterial(THREE,apertures,body.material.map);temporary.push(black,probe);
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
