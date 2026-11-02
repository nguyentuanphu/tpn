import { THREE, toonSmooth, P, merge } from '../../js/gfx.js';
import { VEHICLES, seatRider, build } from '../../js/vehicles.js';
import { buildAvatar, animate } from '../../js/avatar.js';
const q = new URLSearchParams(location.search), only = q.get('only'), riders = q.get('riders') !== '0';
const W = innerWidth, H = innerHeight;
const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true }); renderer.setSize(W, H); renderer.setPixelRatio(1); renderer.shadowMap.enabled = true; document.body.appendChild(renderer.domElement);
const scene = new THREE.Scene(); scene.background = new THREE.Color('#cfe8f2');
{ const pm = new THREE.PMREMGenerator(renderer), env = new THREE.Scene(); env.background = new THREE.Color('#dfeef6'); env.add(new THREE.HemisphereLight('#ffffff', '#8a8070', 2)); scene.environment = pm.fromScene(env).texture; }
scene.add(new THREE.HemisphereLight('#ffffff', '#9fb88a', 1.5));
const sun = new THREE.DirectionalLight('#fff3e0', 2.3); sun.position.set(8, 14, 10); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); Object.assign(sun.shadow.camera, { left: -20, right: 20, top: 20, bottom: -20 }); scene.add(sun);
scene.add(new THREE.Mesh(merge([P(new THREE.PlaneGeometry(80, 80), '#b9b3a6', [0, 0, 0], [-Math.PI / 2, 0, 0])]), toonSmooth())); scene.children.at(-1).receiveShadow = true;
const look = (style, color, hair, hairStyle, hat = 'none', skin = '#e0aa80') => ({ style, color, hair, hairStyle, hat, skin, back: 'none', glider: 0 });
const RIDER = { honda67: look('shirt', '#3a78c8', '#1d1412', 'short', 'cap'), cub: look('aodai', '#ffffff', '#1d1412', 'long', 'nonla'), dream: look('shirt', '#e8c25a', '#1d1412', 'short'),
  scooter: look('shirt', '#ff7eb8', '#1d1412', 'ponytail'), xichlo: look('shirt', '#2f6b3a', '#1d1412', 'short', 'nonla'), postie: look('shirt', '#ffd23f', '#6a4a2a', 'short', 'cap', '#f2c9a8'),
  trailBike: look('shirt', '#3a78c8', '#a86a3a', 'short', 'cap', '#f2c9a8'), quadBike: look('shirt', '#5a8a3a', '#6a4a2a', 'short', 'cap', '#f2c9a8'), roadster: look('shirt', '#f4f4ee', '#1d1412', 'short'),
  miniBike: look('aodai', '#ff9ab8', '#1d1412', 'long'), roadBike: look('shirt', '#2f8fd8', '#a86a3a', 'short', 'cap', '#f2c9a8'), bmx: look('shirt', '#38b54a', '#6a4a2a', 'short', 'cap', '#f2c9a8'), kidsBike: look('shirt', '#ff7a3a', '#1d1412', 'ponytail'), packBike: look('shirt', '#5a6a8a', '#1d1412', 'short', 'nonla') };
const ids = only ? [only] : Object.keys(VEHICLES), tags = [];
const cols = only ? 1 : 5, gapX = 3.6, gapZ = 3.3;
ids.forEach((id, i) => {
  const v = build(id, { real: q.get('real') === '1' }); const g = v.o; g.rotation.y = -Math.PI / 2 + (only ? .5 : .35);
  const cx = (i % cols - (cols - 1) / 2) * gapX, cz = Math.floor(i / cols) * gapZ - (only ? 0 : 4);
  g.position.set(cx, 0, cz - (only ? 0 : 1.5)); g.traverse(o => { if (o.isMesh) o.castShadow = true; }); scene.add(g);
  if (riders) {
    const mk = lk => { const a = buildAvatar(lk); animate(a, 'idle', 0, 0); return a; };
    if (v.seat) seatRider(mk(RIDER[id] || look('shirt', '#5a6a8a', '#1d1412', 'short')), v, v.seat, v.grips, v.feet);
    if (v.passenger) seatRider(mk(look('aodai', '#e8433a', '#1d1412', 'long')), v, v.passenger, v.pgrips, v.pfeet, .86);
    if (v.walk) { const a = mk(RIDER[id]); a.root.position.set(...v.walk); a.root.scale.setScalar(.9); g.add(a.root); g.updateMatrixWorld(true); seatRider(a, v, [v.walk[0], .54, v.walk[2]], v.wgrips, null); a.root.position.y = 0; }
  }
  tags.push([g, v.name[1] + ' · ' + v.name[0]]);
});
const cam = new THREE.PerspectiveCamera(only ? 30 : 30, W / H, .1, 200);
if (only) { const big = ['xichlo', 'quadBike', 'packBike', 'baGac'].includes(only), huge = ['sedan', 'taxi', 'ute', 'suv', 'touristCart'].includes(only) ? 2.1 : ['bus', 'busAU', 'tram', 'tramModern'].includes(only) ? 4.2 : 1; cam.position.set(3.2 * (big ? 1.2 : 1) * huge, 2.0 * (big ? 1.15 : 1) * Math.sqrt(huge), 4.4 * (big ? 1.2 : 1) * huge); cam.lookAt(0, .8 * Math.sqrt(huge), 0); } else { cam.position.set(0, 6.5, 15.5); cam.lookAt(0, .3, -1.4); }
renderer.render(scene, cam);
for (const [g, t] of tags) { const p = new THREE.Vector3(g.position.x, -.15, g.position.z).project(cam); const d = document.createElement('div'); d.className = 'tag'; d.textContent = t; d.style.left = ((p.x + 1) / 2 * W) + 'px'; d.style.top = ((1 - p.y) / 2 * H) + 'px'; if (only) { d.style.left = '50%'; d.style.top = '14px'; d.style.fontSize = '22px'; } document.body.appendChild(d); }
window.done = true;
