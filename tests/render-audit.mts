import fs from 'node:fs';
import type { Browser } from 'playwright';
import { open, clear, noWelcome } from './harness.mts';
export async function renderAudit(browser: Browser): Promise<string> {
  const P=await open(browser,{w:1024,h:700});
  try {
    await clear(P.page); await noWelcome(P.page);
    const result=await P.page.evaluate(async()=>{
      const G=window.__sv, THREE=await import('../vendor/three.module.js'), W=await import('../js/world.js');
      if(!('scene' in G) || !(G.scene instanceof THREE.Scene) || !(G.renderer instanceof THREE.WebGLRenderer)) throw Error('Missing scene/renderer');
      const scene=G.scene,R=G.renderer,hero=G.heroes[0];
      if(!('cam' in hero) || !(hero.cam instanceof THREE.PerspectiveCamera) || !('place' in hero) || typeof hero.place!=='function') throw Error('Missing hero camera/place');
      const camera=hero.cam, place=hero.place.bind(hero), wait=(ms:number)=>new Promise(r=>setTimeout(r,ms));
      const at=async(x:number,z:number)=>{
        place(x,z); for(let i=0;i<7;i++){await wait(350);document.querySelectorAll('.storybook,.dialog,.modal,.reward').forEach(e=>e.remove());G.paused=false;}
        const rows=new Map<string,{uuid:string;kind:string;root:string;rootX:number;rootZ:number;triangles:number;flags:string[]}>();
        const restore:(()=>void)[]=[];
        scene.traverse(o=>{
          if(!(o instanceof THREE.Mesh || o instanceof THREE.Sprite)) return;
          const original=o.onBeforeRender;
          o.onBeforeRender=function(...args){
            if(args[2]===camera){let root: import('../vendor/three.module.js').Object3D=o;while(root.parent&&root.parent!==scene)root=root.parent;
              const kind=o instanceof THREE.Sprite?'sprite':o.userData.outline?'outline':o instanceof THREE.InstancedMesh?'plants':root.userData.avatar?'avatar':root.userData.moving?'moving':'static';
              const g=o instanceof THREE.Mesh?o.geometry:null;
              rows.set(o.uuid,{uuid:o.uuid,kind,root:root.uuid,rootX:root.position.x,rootZ:root.position.z,triangles:g?(g.index?g.index.count:g.attributes.position.count)/3:2,flags:Object.keys(root.userData)});
            } original.apply(this,args);
          };restore.push(()=>{o.onBeforeRender=original;});
        });
        for(let i=0;i<5;i++){await wait(350);document.querySelectorAll('.storybook,.dialog,.modal,.reward').forEach(e=>e.remove());G.paused=false;}restore.forEach(f=>f());
        const byKind:Record<string,number>={},byRoot:Record<string,{draws:number;x:number;z:number;flags:string[]}>={};
        for(const row of rows.values()){byKind[row.kind]=(byKind[row.kind]||0)+1;const r=byRoot[row.root]||{draws:0,x:row.rootX,z:row.rootZ,flags:row.flags};r.draws++;byRoot[row.root]=r;}
        return {draws:rows.size,byKind,roots:Object.values(byRoot).sort((a,b)=>b.draws-a.draws).slice(0,30),rows:[...rows.values()]};
      };
      return {home:await at(W.PLATEAU.x-3,W.PLATEAU.z-4),village:await at(W.VILLAGE.x,W.VILLAGE.z+6)};
    });
    if(!result.home.draws||!result.village.draws)throw Error('No world frames captured at one of the audit locations');
    fs.mkdirSync('../docs/r87/evidence',{recursive:true});fs.writeFileSync('../docs/r87/evidence/render-audit.json',JSON.stringify(result,null,2)+'\n');
    if(P.errors.length)throw Error(P.errors.join(' | '));
    return JSON.stringify({home:result.home.byKind,village:result.village.byKind});
  } finally {await P.ctx.close();}
}
