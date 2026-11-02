// Compare the actual old/current distance code on the canonical map, including exact ridge falloff heights.
import fs from 'node:fs';
import vm from 'node:vm';
import { pathToFileURL } from 'node:url';
import { WATERS, WORLD, RELIEF } from '../js/content/map.js';
import { fbm } from '../js/util.js';
import { clamp, lerp, smooth, dist2 } from '../js/core/geo.js';
const old = fs.readFileSync(new URL('./fixtures/r86-height-prefix.txt', import.meta.url), 'utf8');
// (v1.07) js/world.ts is split into js/world/*.ts (pure moves): heightAt lives in js/world/ground.ts now
const current = ['../js/world.ts', ...fs.readdirSync(new URL('../js/world/', import.meta.url)).filter(f => f.endsWith('.ts')).sort().map(f => '../js/world/' + f)]
  .map(f => fs.readFileSync(new URL(f, import.meta.url), 'utf8')).join('\n');
function probe(source: string): (x: number, z: number) => number {
  const start = source.indexOf('export function heightAt('), end = source.indexOf('// The Dawn Plateau', start);
  if (start < 0 || end < 0) throw Error('Terrain source not found');
  const helperStart=source.indexOf('const RELIEF_SEGMENTS ='), helperEnd=source.indexOf('}) }));',helperStart);
  const helper=helperStart>=0 ? source.slice(helperStart,helperEnd+7) : '';
  return vm.runInNewContext(helper+'\n'+source.slice(start,end).replace('export function','function')+'return h; }\nheightAt', {
    Math, clamp, lerp, smooth, dist2, fbm, RELIEF, MTN:WORLD.mountains, EDGE:WORLD.edge
  });
}
export function terrainMathCheck(): string {
const before = probe(old), after = probe(current), points: [number, number][] = [];
for (let x = -WORLD.size / 2; x <= WORLD.size / 2; x += 1.5) for (let z = -WORLD.size / 2; z <= WORLD.size / 2; z += 1.5) points.push([x, z]);
for (const water of WATERS.filter(w => w.kind === 'river')) for (const [x,z] of water.pts) for (const dx of [-1e-10,0,1e-10]) for (const dz of [-32,-13,-6.5,0,6.5,13,32]) points.push([x+dx,z+dz]);
for (const ridge of RELIEF) for (let i=0;i<ridge.pts.length-1;i++) {
  const [ax,az]=ridge.pts[i], [bx,bz]=ridge.pts[i+1], dx=bx-ax,dz=bz-az,len=Math.hypot(dx,dz);
  for (const t of [0,.25,.5,.75,1]) for (const width of [.35,1.4,1.5]) for(const epsilon of [-1e-9,0,1e-9]) for(const sign of [-1,1]) {
    const offset=(ridge.w*width+epsilon)*sign;
    points.push([ax+dx*t-dz/len*offset,az+dz*t+dx/len*offset]);
  }
}
for (const [x,z] of points) { const a=before(x,z), b=after(x,z); if (!Object.is(a,b)) throw Error(JSON.stringify({x,z,before:a,after:b})); }
const timed = (fn: typeof before) => { const start=performance.now(); for (const [x,z] of points) fn(x,z); return performance.now()-start; };
const runs: {beforeMs:number;afterMs:number}[]=[];
for (let i=0;i<5;i++) { if(i%2) { const afterMs=timed(after); runs.push({beforeMs:timed(before),afterMs}); } else { const beforeMs=timed(before); runs.push({beforeMs,afterMs:timed(after)}); } }
const result={points:points.length, exact:true, runs};
const dest=process.env.SV_TERRAIN_REPORT;
if(dest) fs.writeFileSync(dest,JSON.stringify(result,null,2)+'\n');
return `${points.length} exact terrain-stage heights; timings ${JSON.stringify(runs)}`;
}
if(process.argv[1] && import.meta.url===pathToFileURL(process.argv[1]).href) console.log(terrainMathCheck());
