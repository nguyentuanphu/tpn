// (round T3) Garden plots: the two Memory Villages (Làng Kỷ Niệm) and up to three spare plots by the roads out of each city
// (PLOTS in js/world.js, from js/content/map.js). Until a family puts the home they remember on one (Studio's Plots page,
// on the next open), each empty plot shows a small garden: a lawn, a low hedge round the back and sides, and flowers. Every garden is one
// instance of one mesh, so all of them together are a single draw. Nothing in a garden is taller than 30 cm, so the
// plot stays open ground (the solid map starts at 35 cm) and the `plots` check finds nothing standing on it.
import { THREE, toonVC, P, merge } from './gfx.js';
import { PLOTS } from './world.js';
import { builtPlotIds } from './worldedit.js';
import { natureModel } from './nature-tag.js';

export function createPlots(G) {
  const { scene } = G;
  const gardens = PLOTS.filter(p => !builtPlotIds.has(p.id));
  if (!gardens.length) return null;
  const { w: W, d: D } = PLOTS[0], B = (x, y, z) => new THREE.BoxGeometry(x, y, z);
  // the garden for a W × D plot, its front (+z) to the lane: lawn, hedges, a path from the front, flower beds
  const parts = [P(B(W - .1, .06, D - .1), '#8fcf7a', [0, .03, 0]),
    P(B(W - .1, .3, .4), '#4f9a52', [0, .15, -D / 2 + .25]),
    ...[-1, 1].map(s => P(B(.4, .3, D - .6), '#4f9a52', [s * (W / 2 - .25), .15, -.15])),
    P(B(1.1, .07, D / 2), '#e3cf9c', [0, .045, D / 4 - .05])];
  const flowers = ['#ff7eb8', '#ffd23f', '#ffffff', '#c86bff', '#ff8a3d'];
  for (let k = 0; k < 14; k++) {
    const side = k % 2 ? 1 : -1, row = Math.floor(k / 2), x = side * (1.2 + (row % 2) * .9), z = -D / 2 + 1.1 + row * .75;
    parts.push(P(new THREE.SphereGeometry(.16, 6, 4), flowers[k % flowers.length], [x, .2, z]), P(B(.05, .16, .05), '#3f7a3a', [x, .09, z]));
  }
  const geo = merge(parts), mesh = new THREE.InstancedMesh(geo, toonVC(), gardens.length), m = new THREE.Matrix4(), q = new THREE.Quaternion(), up = new THREE.Vector3(0, 1, 0), one = new THREE.Vector3(1, 1, 1);
  gardens.forEach((p, i) => { q.setFromAxisAngle(up, p.rot); m.compose(new THREE.Vector3(p.x, p.h, p.z), q, one); mesh.setMatrixAt(i, m); });
  mesh.instanceMatrix.needsUpdate = true; mesh.computeBoundingSphere(); mesh.receiveShadow = true; mesh.userData.plots = true; natureModel(mesh, 'garden-plot'); // (v1.08e nature: models/world/garden-plot.glb near the child)
  scene.add(mesh);
  return mesh;
}
