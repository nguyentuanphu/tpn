// (v1.08b friends) Pictures of the friends' 3D models outside the valley: the Welcome cards (the friend turning slowly, in
// the skin tone the child picks) and the round pictures of Who's playing, the HUD and Grown-ups (a portrait per friend
// and skin tone, made once on this device and kept in memory). One small drawing canvas for all of them, made the first
// time it is needed (never in the first download: js/ui/friends-ui.ts and js/ui/profile.ts load this file later).
import { THREE } from './gfx.js';
import { buildAvatar, setPortrait, loadFriendModels } from './avatar.js';

let R: THREE.WebGLRenderer = null, scene: THREE.Scene = null, cam: THREE.PerspectiveCamera = null;
const people: Record<string, any> = {};
function setup() {
  if (R) return true;
  try {
    const c = document.createElement('canvas'); c.width = 240; c.height = 312;
    R = new THREE.WebGLRenderer({ canvas: c, antialias: true, alpha: true, preserveDrawingBuffer: true }); R.outputColorSpace = THREE.SRGBColorSpace; R.setClearColor(0x000000, 0);
    scene = new THREE.Scene(); scene.add(new THREE.HemisphereLight('#ffffff', '#b8a888', 1.5)); const d = new THREE.DirectionalLight('#ffffff', 1.5); d.position.set(1.5, 3, 4); scene.add(d);
    cam = new THREE.PerspectiveCamera(26, 240 / 312, .1, 50); return true;
  } catch (e) { R = null; return false; }
}
// a friend in a skin tone, built with the model (the code person in the friend's colours stands in if it cannot load)
async function person(id: string, skin: string) {
  await loadFriendModels(id);
  const k = id + skin; if (people[k]) return people[k];
  const look = { set: id === 'clara' || id === 'lumi' ? 'girl' : 'boy', friend: id, skin };
  const A = buildAvatar(look);
  for (let i = 0; i < 10; i++) A.anim('idle', i / 30, 0);
  return (people[k] = A);
}
/** draw a friend into a 2D canvas, turned by yaw; mood: smile, happy ... ; portrait: head and shoulders */
export async function drawFriend(target: HTMLCanvasElement, id: string, skin: string, yaw = 0, mood = 'smile', portrait = false) {
  if (!setup()) return false;
  const A = await person(id, skin);
  scene.add(A.root); A.root.rotation.y = yaw; if (A.life) A.life.mood = mood;
  const w = target.width, h = target.height; R.setSize(w, h, false); cam.aspect = w / h;
  if (portrait) { cam.fov = 22; cam.position.set(0, 1.32, 3.2); cam.lookAt(0, 1.25, 0); } else { cam.fov = 26; cam.position.set(0, .95, 3.75); cam.lookAt(0, .84, 0); }
  cam.updateProjectionMatrix(); R.render(scene, cam); scene.remove(A.root);
  const x = target.getContext('2d'); x.clearRect(0, 0, w, h); x.drawImage(R.domElement, 0, 0, w, h);
  return true;
}
const portraits: Record<string, Promise<string>> = {};
/** a round picture of a friend in a skin tone (a data URL), made once; also handed to js/avatar.ts avatarURL */
export function friendPortrait(id: string, skin: string): Promise<string> {
  const k = id + skin;
  return portraits[k] || (portraits[k] = (async () => {
    const c = document.createElement('canvas'); c.width = c.height = 160;
    const x = c.getContext('2d'); x.fillStyle = '#f4ecda'; x.fillRect(0, 0, 160, 160);
    const t = document.createElement('canvas'); t.width = t.height = 160;
    if (!(await drawFriend(t, id, skin, .25, 'smile', true))) return null;
    x.drawImage(t, 0, 0); const url = c.toDataURL('image/png'); setPortrait(id, skin, url); return url;
  })());
}
/** the slow turn of a Welcome card: draws about 20 times a second while the canvas is on the page */
export function turnFriend(target: HTMLCanvasElement, id: string, getSkin: () => string, getMood: () => string) {
  let yaw = -.5, busy = false; const blinkAt = Math.random() * 3;
  const step = async () => {
    if (!target.isConnected) return;
    // (v1.08e faces) the friend blinks now and then while smiling (half, closed, half: three drawings, 150 ms)
    let mood = getMood(); const b = (performance.now() / 1000 + blinkAt) % 3.4; if (mood === 'smile' && b < .15) mood = b < .05 || b >= .1 ? 'half' : 'blink';
    if (!busy) { busy = true; yaw += .03; const ok = await drawFriend(target, id, getSkin(), Math.sin(yaw) * .9, mood); busy = false; if (!ok) return; }
    setTimeout(step, 50);
  };
  step();
}
