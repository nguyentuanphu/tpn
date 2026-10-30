import fs from 'node:fs';
import type { Browser } from 'playwright';
import { open, clear, noWelcome } from './harness.mjs';
export async function ridingCameraCheck(browser: Browser): Promise<string> {
  const P=await open(browser,{w:900,h:640});
  const oldBuffalo=fs.readFileSync('fixtures/r87-buffalo-original.txt','utf8');
  const rows=[];const dir='../docs/r87/evidence/riding-camera';fs.mkdirSync(dir,{recursive:true});
  try {
    await clear(P.page);await noWelcome(P.page);await P.page.evaluate(()=>window.__sv.renderer.setPixelRatio(1));
    const kinds=await P.page.evaluate(()=>{
      const G=window.__sv;if(!('traffic' in G)||!G.traffic||typeof G.traffic!=='object'||!('slots' in G.traffic)||!Array.isArray(G.traffic.slots))throw Error('No actual traffic slots');
      const slots=G.traffic.slots,ids=G.interactables.flatMap(i=>{const match=/^(?:bike|drive)_(\d+)$/.exec(i.id||'');return match?[slots[+match[1]]?.id]:[];}).filter((id):id is string=>typeof id==='string');
      if(!ids.length)throw Error('No actual mount actions');return ['buffalo',...new Set(ids)];
    });
    for(const age of ['little','big'])for(const kind of kinds){
      console.log(`riding case: ${age} ${kind}`);
      await P.page.setViewportSize(kind==='buffalo'&&age==='big'?{width:820,height:1180}:age==='little'?{width:390,height:844}:{width:1280,height:800});
      const row=await P.page.evaluate(async({age,kind,oldBuffalo})=>{
        const G=window.__sv,h=G.heroes[0],{THREE,P,merge}=await import('../js/gfx.js'),V=await import('../js/vehicles.js');
        G.paused=true;h.carry=null;h.profile.age=age;h.av.root.scale.setScalar(age==='little'?.72:.9);h.view='follow';
        if(kind==='buffalo')h.mount(h.world.buffalo[0]);
        else {const v=V.build(kind);v.o.userData.cameraFixture=true;v.o.position.copy(h.pos);G.scene.add(v.o);h.mount({vehicle:v,mesh:v.o,shadow:new THREE.Object3D(),yaw:0,quiet:true});}
        if(kind==='buffalo'){
          const original=new Function('THREE','P','merge',oldBuffalo+'return buffaloGeo;')(THREE,P,merge);
          const points=(geometry:import('../vendor/three.module.js').BufferGeometry)=>{
            const p=geometry.attributes.position,n=geometry.attributes.normal,c=geometry.attributes.color;
            return Array.from({length:p.count},(_,i)=>[p.getX(i),p.getY(i),p.getZ(i),n.getX(i),n.getY(i),n.getZ(i),c.getX(i),c.getY(i),c.getZ(i)].join(','));
          };
          const current:string[]=[];h.riding.mesh.traverse(o=>{if(o instanceof THREE.Mesh)current.push(...points(o.geometry));});
          if(JSON.stringify(points(original).sort())!==JSON.stringify(current.sort()))throw Error('buffalo exterior geometry changed');original.dispose();
        }
        const pad={mx:0,mz:0,cdx:0,cdy:0,jump:()=>false,act:()=>false};h.update(1/60,pad,0,G);
        // (owner, 30 Oct 2026 AEDT) getting on starts in Street view, the head stays under a car's roof; the rest of this
        // check is of Behind me (the rider's eyes), which the child chooses with View
        if(h.view!=='street')throw Error(`${age}/${kind}: getting on did not start in Street view (${h.view})`);
        if(h.riding.vehicle?.cabin){const top=h.riding.vehicle.o.worldToLocal(new THREE.Box3().setFromObject(h.av.head).max.clone()).y;if(top>h.riding.vehicle.cabin.top)throw Error(`${age}/${kind}: head ${top.toFixed(2)} above the roof ${h.riding.vehicle.cabin.top.toFixed(2)}`);}
        G.setView(0,'follow',true);for(let k=0;k<180;k++)h.update(1/60,pad,k/60,G);
        const restore=(h.riding.firstPersonHide||[]).map(o=>[o,o.visible] as const), {withRideView}=await import('../js/rideview.js');
        let renderFailed=false;try{withRideView(h,()=>{throw Error('render fixture');});}catch{renderFailed=true;}
        if(!renderFailed||restore.some(([o,visible])=>o.visible!==visible))throw Error('mount appearance not restored after render failure');
        if(kind==='buffalo'||kind==='sedan'){
          const lens=h.cam.fov,eye=h.cam.position.clone(),zoom=h.zoom;G.zoomBy(0,1.5,true);
          const pad={mx:0,mz:0,cdx:0,cdy:0,jump:()=>false,act:()=>false};for(let k=0;k<180;k++)h.update(1/60,pad,k/60,G);
          if(h.cam.fov<lens+5||h.cam.position.distanceTo(eye)>.05)throw Error('POV zoom ignored or moves eyes out of the seat');
          h.zoom=zoom;for(let k=0;k<180;k++)h.update(1/60,pad,k/60,G);
          if(Math.abs(h.cam.fov-lens)>.1)throw Error('POV zoom did not restore');
        }
        const forward=new THREE.Vector3(Math.sin(h.yaw),0,Math.cos(h.yaw)),gaze=h.cam.getWorldDirection(new THREE.Vector3()),v=h.riding.vehicle;
        const local=v?v.o.worldToLocal(h.cam.position.clone()):null;
        if(!h._pov||gaze.dot(forward)<.98)throw Error('not looking ahead from rider view');
        if(v?.cabin&&(local.y<v.cabin.bottom||local.y>v.cabin.top))throw Error('eyes outside actual windscreen');
        if(!G.getViews(0).some(v=>v[0]==='follow'&&v[2]==='Rider’s eyes'))throw Error('camera setting mislabels rider view');
        const target=new THREE.Mesh(new THREE.PlaneGeometry(4,2),new THREE.MeshBasicMaterial({color:'#ff00ff',side:THREE.DoubleSide}));
        const span=v?.cabin?v.cabin.length/2+3:5;target.position.copy(h.riding.mesh.position).addScaledVector(forward,span);target.position.y=h.cam.position.y;target.rotation.y=h.yaw;G.scene.add(target);
        // Isolate the mount's own sightline; an unrelated wall/tree is a legitimate thing to see, not a blocked windscreen.
        const hidden=G.scene.children.filter(o=>o!==h.riding.mesh&&o!==h.av.root&&o!==target&&!(o instanceof THREE.Light)).map((o):[import('../vendor/three.module.js').Object3D,boolean]=>[o,o.visible]);
        hidden.forEach(([o])=>{o.visible=false;});let seen=0;
        try {const image=new Image();image.src=G.snapshot(0,900,1);await image.decode();const c=document.createElement('canvas');c.width=image.width;c.height=image.height;const ctx=c.getContext('2d');ctx.drawImage(image,0,0);const pixels=ctx.getImageData(0,0,c.width,c.height).data;for(let i=0;i<pixels.length;i+=4)if(pixels[i]>180&&pixels[i+1]<90&&pixels[i+2]>180)seen++;}
        finally {hidden.forEach(([o,visible])=>{o.visible=visible;});G.scene.remove(target);target.geometry.dispose();target.material.dispose();}
        if(seen<200)throw Error(`${age}/${kind}: forward view blocked (${seen} pixels)`);
        return {age,kind,viewport:{width:innerWidth,height:innerHeight},seen,localEye:local?{x:local.x,y:local.y,z:local.z}:null,eyeY:h.cam.position.y,shot:['buffalo','sedan','kidsBike'].includes(kind)?G.snapshot(0,900,.9):null};
      },{age,kind,oldBuffalo});
      if(row.shot)fs.writeFileSync(`${dir}/${age}-${kind}-pov.jpg`,Buffer.from(row.shot.split(',')[1],'base64'));
      if(age==='little'&&kind==='buffalo'){
        await P.page.evaluate(async()=>{(await import('../js/ui.js')).openQuick(window.__sv,0);});
        await P.page.locator('.qs-views [data-view="high"]').click();await P.page.locator('.qsettings .x').click();
      }else await P.page.evaluate(()=>window.__sv.setView(0,'high'));
      const high=await P.page.evaluate(({kind,eyeY})=>{
        const G=window.__sv,h=G.heroes[0];G.paused=true;const pad={mx:0,mz:0,cdx:0,cdy:0,jump:()=>false,act:()=>false};for(let k=0;k<180;k++)h.update(1/60,pad,k/60,G);
        if(h._pov||h.cam.position.y<eyeY+.5||h.cam.position.distanceTo(h.pos)<3)throw Error('High up choice ignored while mounted');
        const shot=['buffalo','sedan'].includes(kind)?G.snapshot(0,900,.9):null;
        G.setView(0,'street');for(let k=0;k<180;k++)h.update(1/60,pad,k/60,G);if(h._pov||h.camPitch>.3)throw Error('Street view choice ignored while mounted');
        const v=h.riding.vehicle;h.dismount();if(v?.o.userData.cameraFixture)G.scene.remove(v.o);return {shot,y:h.cam.position.y};
      },{kind,eyeY:row.eyeY});
      if(high.shot)fs.writeFileSync(`${dir}/${age}-${kind}-high.jpg`,Buffer.from(high.shot.split(',')[1],'base64'));
      const {shot,...proof}=row;rows.push({...proof,highY:high.y});
    }
    if(P.errors.length)throw Error(P.errors.join(' | '));fs.writeFileSync(`${dir}/results.json`,JSON.stringify(rows,null,2)+'\n');
    return `${rows.length} model/age combinations: every vehicle with a mount action plus buffalo, forward view and windscreens, actual High up control, Street view and POV zoom; phone/tablet/computer photos saved`;
  }finally{await P.ctx.close();}
}
