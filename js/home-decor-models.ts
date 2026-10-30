// Original low-poly furnishings for the eight saved decoration slots. No catalogue IDs or prices change.
import { THREE, P, merge, toonVC, sprite } from './gfx.js';
const FURNISHING_MATERIAL = toonVC(); FURNISHING_MATERIAL.userData.shared = true;
export function homeDecoration(key: string, icon: string, wall = false) {
  const g = new THREE.Group(), parts: ReturnType<typeof P>[] = [];
  const box = (w:number,h:number,d:number,c:string,x=0,y=h/2,z=0) => parts.push(P(new THREE.BoxGeometry(w,h,d),c,[x,y,z]));
  const ball = (r:number,c:string,x=0,y=r,z=0) => parts.push(P(new THREE.SphereGeometry(r,12,8),c,[x,y,z]));
  const cyl = (r:number,b:number,h:number,c:string,x=0,y=h/2,z=0) => parts.push(P(new THREE.CylinderGeometry(r,b,h,12),c,[x,y,z]));
  const picture = () => { const s=sprite(icon,wall?.85:.7);s.position.set(0,wall?0:1.05,.075);g.add(s); };
  if(wall) {
    // (owner, 30 Oct 2026 AEDT: "the wall hangings don't look right") a thin frame flat on the wall with the picture drawn
    // on its face, not a box with a picture floating in front that turned to the camera
    box(1.25,1.05,.05,'#b77952',0,0);box(1.08,.88,.06,'#fff9e9',0,0);
    const face=sprite(icon,.8),flat=new THREE.Mesh(new THREE.PlaneGeometry(.8,.8),new THREE.MeshBasicMaterial({map:face.material.map,transparent:true}));flat.position.set(0,0,.04);flat.userData.roomShape=true;g.add(flat);
  } else if(key==='teddy') {
    ball(.34,'#c18a5e',0,.4);ball(.29,'#dca679',0,.91);
    for(const side of[-1,1]){ball(.12,'#b67c54',side*.23,1.12);ball(.14,'#c18a5e',side*.32,.52);ball(.17,'#b67c54',side*.2,.15);ball(.035,'#382644',side*.09,.95,.26);}
    ball(.12,'#f5d7ab',0,.84,.25);ball(.035,'#382644',0,.87,.36);
  } else if(key==='clock') {
    box(.8,.18,.55,'#885840');box(.55,1.2,.4,'#bb875c',0,.7);cyl(.42,.42,.13,'#f1c76c',0,1.6);
    box(.64,.62,.09,'#fff7de',0,1.6,.25);box(.035,.22,.025,'#4a344c',0,1.7,.31);box(.2,.035,.025,'#4a344c',.08,1.6,.31);ball(.1,'#e7b953',0,.65,.24);
  } else if(key==='vase') {
    cyl(.16,.25,.15,'#8e66ae');cyl(.32,.22,.65,'#ad8bd0',0,.45);cyl(.17,.3,.25,'#8e66ae',0,.9);
  } else if(key==='lamp') {
    cyl(.3,.36,.12,'#bd8a5e');cyl(.045,.045,.9,'#d2a860',0,.55);cyl(.24,.42,.5,'#ffe6a5',0,1.2);ball(.09,'#f5b75a',0,1.51);
  } else if(key==='sunflower'||key==='lotus') {
    cyl(.3,.22,.4,'#c98268');cyl(.035,.035,.65,'#5b935e',0,.65);
    for(let i=0;i<8;i++){const a=i*Math.PI/4;ball(.14,key==='lotus'?'#f59bc7':'#ffd35f',Math.cos(a)*.23,1+Math.sin(a)*.23);}
    ball(.16,key==='lotus'?'#ffdc74':'#8e6642',0,1,.08);
  } else if(key==='balloons') {
    cyl(.28,.34,.12,'#b98b64');for(let i=0;i<3;i++){const x=(i-1)*.3;cyl(.012,.012,1.2,'#d9c7aa',x*.5,.65);ball(.25,['#ff99c5','#81d9ed','#ffd46b'][i],x,1.35+(i===1?.2:0));}
  } else {
    // Keepsakes remain the game's own illustrations, mounted as a small crafted display rather than a floating icon.
    box(.9,.12,.55,'#b7885e');box(.08,.65,.08,'#b7885e',0,.4);box(1,.85,.1,'#f6dfb4',0,1.05);picture();
  }
  const mesh=new THREE.Mesh(merge(parts),FURNISHING_MATERIAL);mesh.userData.roomShape=true;mesh.castShadow=mesh.receiveShadow=true;g.add(mesh);g.userData.homeDecoration=key;return g;
}
