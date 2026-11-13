// (v1.08b friends) The four friends' light 3D models (models/<id>.glb, made by tools/make-friends.mts from the Blender
// script). They load only after a child starts playing, never in the first download (check startup); until a model has
// arrived (or when it cannot load: an old phone, no network on the very first start) the child is drawn by the code
// builder in that friend's colours (js/avatar.ts), so the game never stops.
// The model does not play its own moves: each frame its joints copy the turns of the code person's joints (same names:
// torso, head, armL, elbowL, legL, kneeL ...), so walking, jumping, riding (seatRider) and the films' poses work as before,
// and the hats, necklaces and backs the code person wears sit on the model.
import { THREE, P, personLook, outlineSkinned } from './gfx.js';
import { friendLook } from './content/friends.js';
import type { FriendId } from './content/friends.js';

type Loaded = { scene: THREE.Object3D, clone: (o: THREE.Object3D) => THREE.Object3D };
/** (v1.08e) a "lit-" part whose gallery light is in its corner colours: lit mostly by them (emissive), a little by the valley */
function litCorners(name: string) {
  const m = new THREE.MeshToonMaterial({ name, vertexColors: true, emissive: '#fff0dc', emissiveIntensity: .9, color: '#8a8070' });
  m.userData.cornerLight = true;
  m.onBeforeCompile = sh => { sh.fragmentShader = sh.fragmentShader.replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n#ifdef USE_COLOR\ntotalEmissiveRadiance *= vColor.rgb;\n#endif'); };
  return m;
}
/** (Meshy characters) a face picture whose skin texels (alpha below .9) take the child's tone, relative to the painted one */
function faceTint(m) {
  m.userData.faceTint = true; m.userData.tint = { value: new THREE.Color(1, 1, 1) };
  m.onBeforeCompile = sh => { sh.uniforms.uTint = m.userData.tint;
    sh.fragmentShader = 'uniform vec3 uTint;\n' + sh.fragmentShader
      .replace('#include <map_fragment>', '#include <map_fragment>\nfloat skT = diffuseColor.a < .9 ? 1.0 : 0.0;\nif (skT > .5) diffuseColor.rgb *= uTint;\ndiffuseColor.a = 1.0;')
      .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\nif (skT > .5) totalEmissiveRadiance *= uTint;'); }; // (a baked picture's own light takes the tone too)
  return m;
}
// (Meshy characters, owner 8 Nov 2026: "all friends and villagers have facial issues") a Meshy model is one painted picture
// with its light already painted in, its hair thin cards and its face a picture layer just in front of the head. Drawn
// like the code people it went wrong in the game: the toon bands on top of the painted light made the skin orange-red,
// one-sided cards showed the scalp through the hair, and the ink shell poked through the hair and the face as black
// slivers and black eyes. So such a model ("baked": it has face pictures) is drawn by its own light (emissive, as the
// gallery villagers' "lit-" pictures are) with a little of the valley's light on top, both sides, and with no ink shell.
// The valley's light on top is smooth (Lambert): the toon steps drew hard bright and dark bands across faces and necks.
const BAKED_EMISSIVE = .95, BAKED_COLOR = new THREE.Color('#262524'); // (its own painted light, as painted; owner 8 Nov 2026: .72 drew the faces too dark)
// (owner 8 Nov 2026: Lumi's ears, neck, collar and nose in patches) the child's skin tone was put on whole triangles marked
// skin, so a collar triangle marked skin turned skin-coloured and a neck or ear triangle left out kept the painted tone.
// Now every part of a Meshy model takes the tone texel by texel, as much as each texel's colour is the painted skin's
// (its hue and mix of colours, at any brightness): skin everywhere follows the tone, clothes, hair and eyes never do.
function skinTint(m, paintHex: string) {
  m.userData.skinTint = true; m.userData.paintHex = paintHex; const lax = /^(skin|face-)/.test(m.name || ''); // (parts marked skin: blush, shine and shade follow the tone too; clothes only their skin-coloured texels)
  m.userData.tint = { value: new THREE.Color(1, 1, 1) }; m.userData.paint = { value: new THREE.Color(paintHex) };
  const cover = !!m.userData.cover; m.userData.coverU = { value: 0 };
  const kit = cover && m.userData.kit_waist != null, eyes = !cover && Array.isArray(m.userData.eye_boxes) && !!m.userData.deq; m.userData.kitU = { top: { value: new THREE.Color(1, 1, 1) }, bot: { value: new THREE.Color(1, 1, 1) }, on: { value: 0 }, waist: { value: m.userData.kit_waist || 0 }, neck: { value: m.userData.kit_neck || 0 }, grey: { value: m.userData.kit_grey || .7 }, shut: { value: 0 }, eyeA: { value: new THREE.Vector4(...((m.userData.eye_boxes || [0, 0, 0, 0]).slice(0, 4))) }, eyeB: { value: new THREE.Vector4(...((m.userData.eye_boxes || [0, 0, 0, 0, 0, 0, 0, 0]).slice(4, 8))) }, lid: { value: 0 }, lidHalf: Number(m.userData.lid_half) || 0, lidSad: Number(m.userData.lid_sad) || 0, eyeSkin: { value: Array.isArray(m.userData.eye_skin) ? new THREE.Color().setRGB(m.userData.eye_skin[0], m.userData.eye_skin[1], m.userData.eye_skin[2], THREE.SRGBColorSpace) : null }, ovA: { value: new THREE.Vector4(...((m.userData.eye_ovals || [0, 0, 0, 0]).slice(0, 4))) }, ovB: { value: new THREE.Vector4(...((m.userData.eye_ovals || [0, 0, 0, 0, 0, 0, 0, 0]).slice(4, 8))) }, deq: { value: new THREE.Matrix4().fromArray(m.userData.deq || [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]) }, covCol: { value: Array.from({ length: 8 }, () => new THREE.Color(1, 1, 1)) }, covRank: { value: new Array(8).fill(99) } };
  m.onBeforeCompile = sh => { sh.uniforms.uTint = m.userData.tint; sh.uniforms.uPaint = m.userData.paint;
    // (owner 9 Nov 2026: the swim kit and skin showed through the tops in spots) a body point covered by a garment being
    // worn (its bits, from tools/meshy/make_clothes.py, in the alpha of the skin mark; the worn garments' bits in uCover) is
    // not drawn: a triangle goes only when all three of its corners are covered, so the body round hems and cuffs stays
    if (cover) {
      sh.uniforms.uCover = m.userData.coverU;
      sh.vertexShader = 'uniform float uCover;\nvarying float vCov;\nuniform vec3 uCovCol[8];\nuniform float uCovRank[8];\nvarying vec3 vCovCol;\n' + sh.vertexShader.replace('#include <color_vertex>', `#include <color_vertex>
float cb_ = floor(color.a * 255.0 + .5); vCov = 0.0; float best_ = 99.0; vCovCol = vec3(1.0);
for (int k = 0; k < 8; k++) { float p_ = exp2(float(k)); if (mod(floor(cb_ / p_), 2.0) > .5 && mod(floor(uCover / p_), 2.0) > .5) { vCov = 1.0; if (uCovRank[k] < best_) { best_ = uCovRank[k]; vCovCol = uCovCol[k]; } } }
vec3 kp_ = (uDeq * vec4(position, 1.0)).xyz; vKitY = kp_.y; vKitX = kp_.x; // (10 Nov 2026: in metres; gltfpack stores positions as whole numbers, 0 to 16383, so the eye areas, waist and neck never matched)
`).replace('void main() {', 'varying float vKitY;\nvarying float vKitX;\nuniform float uKitOn;\nuniform float uKitNeck;\nuniform mat4 uDeq;\nvoid main() {').replace('#include <project_vertex>', `#include <project_vertex>
if (uKitOn > .5 && color.r < .5 && color.a * 255.0 < .5 && vKitY < uKitNeck) { mvPosition.xyz -= normalize(mvPosition.xyz) * .012; gl_Position = projectionMatrix * mvPosition; }`); // (dressed: hair hanging below the neck, Clara's braids, drawn in front of the clothes it lies on)
      sh.fragmentShader = 'varying float vCov;\nvarying vec3 vCovCol;\nvarying float vKitY;\nuniform vec3 uKitTop;\nuniform vec3 uKitBot;\nuniform float uKitOn;\nuniform float uKitWaist;\nuniform float uKitGrey;\nuniform float uKitNeck;\nuniform float uShut;\nuniform vec4 uEyeA;\nuniform vec4 uEyeB;\nvarying float vKitX;\n' + sh.fragmentShader;
      Object.assign(sh.uniforms, { uKitTop: m.userData.kitU.top, uKitBot: m.userData.kitU.bot, uKitOn: m.userData.kitU.on, uKitWaist: m.userData.kitU.waist, uKitNeck: m.userData.kitU.neck, uKitGrey: m.userData.kitU.grey, uShut: m.userData.kitU.shut, uEyeA: m.userData.kitU.eyeA, uEyeB: m.userData.kitU.eyeB, uDeq: m.userData.kitU.deq, uCovCol: m.userData.kitU.covCol, uCovRank: m.userData.kitU.covRank });
    }
    // (13 Nov 2026, regional villagers at three-quarters: the open eye showed beside every shut lid, on the socket's sides the
    // front-laid mood pieces do not reach) a model with eye areas but no code-made clothes (a villager) gets the shut-eye paint
    // too: it lived only in the clothes' branch above, and a villager's positions were never turned into metres (uDeq)
    if (eyes) {
      sh.vertexShader = sh.vertexShader.replace('void main() {', 'varying float vKitY;\nvarying float vKitX;\nvarying vec3 vEyeN_;\nuniform mat4 uDeq;\nvoid main() {').replace('#include <begin_vertex>', `#include <begin_vertex>
vec3 kp_ = (uDeq * vec4(position, 1.0)).xyz; vKitY = kp_.y; vKitX = kp_.x;`).replace('#include <skinnormal_vertex>', `#include <skinnormal_vertex>
#ifdef USE_SKINNING
vEyeN_ = normalize(normalMatrix * (skinMatrix * vec4(0.0, 0.0, 1.0, 0.0)).xyz);
#else
vEyeN_ = normalize(normalMatrix * vec3(0.0, 0.0, 1.0));
#endif`);   // (13 Nov 2026: the head's forward, for the shut eye's light below)
      sh.fragmentShader = 'varying float vKitY;\nvarying float vKitX;\nvarying vec3 vEyeN_;\nuniform float uShut;\nuniform vec4 uEyeA;\nuniform vec4 uEyeB;\nuniform vec4 uOvA;\nuniform float uLid;\nuniform vec3 uEyeSkin;\nuniform float uEyeSkinOn;\nuniform vec4 uOvB;\nfloat eyeOv_(vec4 o) { if (o.z <= 0.0) return 0.0; vec2 d = vec2((vKitX - o.x) / o.z, (vKitY - o.y) / o.w); float h = o.w / .8; return (1.0 - smoothstep(.85, 1.0, length(d))) * (uShut > .5 ? 1.0 : smoothstep(-.04 * h, .04 * h, vKitY - (o.y + o.w - .28 * h - uLid * h) - .06 * h)); }\nfloat eyeBrow_(vec4 o) { if (o.z <= 0.0) return 0.0; float h = o.w / .8; return smoothstep(.04 * h, .1 * h, vKitY - (o.y + o.w - .28 * h)); }\nvec4 eyeIn_(vec4 b) { b.w -= .25 * (b.w - b.z); return b; }\n' + sh.fragmentShader;   // (13 Nov 2026: the fit's eye areas reach the brows and the temples' hair; their pale highlights turned skin-coloured on every blink, r045: the top quarter is left out; the outer fifth too left the white at the outer corner showing from the side)
      Object.assign(sh.uniforms, { uShut: m.userData.kitU.shut, uEyeA: m.userData.kitU.eyeA, uEyeB: m.userData.kitU.eyeB, uOvA: m.userData.kitU.ovA, uOvB: m.userData.kitU.ovB, uLid: m.userData.kitU.lid, uEyeSkin: { value: m.userData.kitU.eyeSkin.value || new THREE.Color(1, 1, 1) }, uEyeSkinOn: { value: m.userData.kitU.eyeSkin.value ? 1 : 0 }, uDeq: m.userData.kitU.deq });
      sh.fragmentShader = sh.fragmentShader.replace('#include <normal_fragment_maps>', '#include <normal_fragment_maps>\nnormal = normalize(mix(normal, vEyeN_, eyeK_));');   // (13 Nov 2026, r084 at three-quarters: the skin painted over a shut eye lay on the eyeball's dome, lit lighter above and below it and darker at the side than the lid piece and the face round it, a ring: the shut eye is lit as if flat, facing the head's forward like the piece)
    }
    sh.fragmentShader = 'uniform vec3 uTint;\nuniform vec3 uPaint;\n' + (eyes ? 'float eyeK_ = 0.0;\n' : '') + sh.fragmentShader
      .replace('#include <map_fragment>', `#include <map_fragment>
vec3 pc_ = uPaint / (uPaint.r + uPaint.g + uPaint.b); vec3 tx_ = sampledDiffuseColor.rgb; float sm_ = tx_.r + tx_.g + tx_.b + 1e-4;
#ifdef USE_COLOR
// (the triangles marked skin when the model was made, tools/meshy/fit_people.py: red of the corner colour) times a loose
// per-texel test on them, so eyes, brows, lashes and painted lines on skin triangles stay as painted
float lb_ = clamp(vColor.g - vColor.b, 0.0, 1.0); float w_ = vColor.r * mix((1.0 - smoothstep(.16, .32, distance(tx_ / sm_, pc_))) * smoothstep(.06, .16, sm_) * smoothstep(.15, .25, (max(tx_.r, max(tx_.g, tx_.b)) - min(tx_.r, min(tx_.g, tx_.b))) / max(max(tx_.r, max(tx_.g, tx_.b)), 1e-4)), 1.0, lb_); // (owner 9 Nov 2026: blush and the nose tip are redder than the skin and stayed pink on dark tones; the mark already keeps hair out, eye whites are kept by their paleness) // (owner 9 Nov 2026: freckles and shade on Sol's arms stayed orange on dark tones; arms, legs and neck (green above blue in the mark: bare skin, nothing painted on them) take the tone whole; the face keeps its fine test)
#else
float w_ = (1.0 - smoothstep(${lax ? '.16, .32' : '.025, .06'}, distance(tx_ / sm_, pc_))) * smoothstep(.03, .1, sm_) * (${lax ? 'smoothstep(.46, .56, (max(tx_.r, max(tx_.g, tx_.b)) - min(tx_.r, min(tx_.g, tx_.b))) / max(tx_.r, max(max(tx_.g, tx_.b), 1e-4)))' : '1.0'});   // (skin is strongly coloured; a cream blouse marked skin is not) (owner 9 Nov 2026: the face pieces' blush stayed pink on dark tones: .10-.24 widened)
#endif // (the picture's own colour: the material colour is near black)
vec3 k_ = mix(vec3(1.0), uTint, w_);
#ifdef USE_COLOR
// (owner 9 Nov 2026, the skin tones: Meshy's painted light strokes on bare arms kept their orange under a dark tone) an arm or
// leg takes the tone's colour, keeping only the painted light and shade (its brightness against the painted skin's)
vec3 lim_ = uTint * uPaint * (sm_ / (uPaint.r + uPaint.g + uPaint.b + 1e-4)) / max(tx_, vec3(.02));
k_ = mix(k_, lim_, lb_ * vColor.r * smoothstep(.06, .16, sm_));
#endif
${kit ? `#ifdef USE_COLOR_ALPHA
// (owner 9 Nov 2026: the grey swim kit showed in the armpits and up the sleeves) while dressed, the kit (not skin, under some
// garment) is painted in the worn clothes' colours, above the waist the top's, below it the trousers', keeping its own folds
// and shade: looking into a sleeve or an armpit shows the clothes' inside, never the swimsuit
// (owner 9 Nov 2026, the auditor: from the side, the far eye's white showed past the closed-lid piece) while the eyes are shut,
// the painted eye whites on the face (pale, colourless, skin-marked, above the neck) take the skin's own colour
bool inEye_ = (vKitX > uEyeA.x && vKitX < uEyeA.y && vKitY > uEyeA.z && vKitY < uEyeA.w) || (vKitX > uEyeB.x && vKitX < uEyeB.y && vKitY > uEyeB.z && vKitY < uEyeB.w);
float ski_ = (1.0 - smoothstep(.06, .14, distance(tx_ / sm_, pc_))) * smoothstep(.9, 1.3, sm_);   // (10 Nov 2026: only what is not skin, lashes, iris and whites, is painted over: a flat box showed as a lighter square once the eye areas really worked)
if (uShut > .5 && vColor.r > .5 && inEye_) k_ = mix(uTint * uPaint / max(tx_, vec3(.02)), k_, ski_);   // (the whole painted eye, rim and lashes too, inside the eye areas: owner circled Lumi's faint rim)
if (uShut > .5 && vColor.r > .5 && vKitY > uKitNeck && max(tx_.r, max(tx_.g, tx_.b)) > .78 && (max(tx_.r, max(tx_.g, tx_.b)) - min(tx_.r, min(tx_.g, tx_.b))) < .2 * max(tx_.r, max(tx_.g, tx_.b))) k_ = uTint * uPaint / max(tx_, vec3(.02));
if (uKitOn > .5 && vColor.r < .5 && vColor.a * 255.0 > .5 && vKitY > uKitWaist - .40) k_ = (vCov > .5 ? vCovCol : (vKitY > uKitWaist ? uKitTop : uKitBot)) * .95 / max(tx_, vec3(.02));   // (flat: the kit's own painted trims and folds showed as dark streaks in the cloth's colour) (10 Nov 2026, the auditor's new bite count: discarded, the kit left see-through holes where no cloth lay behind it, Clara's armpit as she cheered; it is painted in the innermost worn garment's colour over it, or the top's above the waist and the trousers' below)   // (10 Nov 2026: .40 now that the height is in metres: the swim shorts reach 28 cm below the waist, they showed under trousers when climbing)   // (the swimsuit's own height only, trunk and thigh tops: at the ankles a non-skin point under a trouser cuff left a hole, the auditor)   // (owner 9 Nov 2026, circled dark patches in shirts' sides and the auditor's gaps at armpits and crotches: the swim kit is always under the clothes, so while dressed it is not drawn at all; a gap shows the inside of the clothes, never the swimsuit, painted or not)
#endif` : ''}
${eyes ? `#ifdef USE_COLOR
vec4 eA_ = eyeIn_(uEyeA), eB_ = eyeIn_(uEyeB); bool inEye_ = (vKitX > eA_.x && vKitX < eA_.y && vKitY > eA_.z && vKitY < eA_.w) || (vKitX > eB_.x && vKitX < eB_.y && vKitY > eB_.z && vKitY < eB_.w);
vec3 sx_ = sqrt(tx_); float emx_ = max(sx_.r, max(sx_.g, sx_.b)), esat_ = (emx_ - min(sx_.r, min(sx_.g, sx_.b))) / max(emx_, 1e-4);   // (near the screen's colours: in linear colour her rosy skin is .74 saturated)
vec3 ed_ = sx_ - sqrt(uEyeSkin); float esk_ = uEyeSkinOn > .5 ? 1.0 - smoothstep(.08, .14, max(max(abs(ed_.r) - (ed_.r < 0.0 ? .1 : 0.0), ed_.g > 0.0 ? ed_.g : max(0.0, -ed_.g - .16)), ed_.b > 0.0 ? ed_.b : max(0.0, -ed_.b - .16))) * smoothstep(.2, .3, (max(tx_.r, max(tx_.g, tx_.b)) - min(tx_.r, min(tx_.g, tx_.b))) / max(max(tx_.r, max(tx_.g, tx_.b)), 1e-4)) : 0.0;   // (and coloured like skin in linear colour: the grey rim round r057's eyes passed as a pale skin)   // (13 Nov 2026, r057 from the front: the oval laid flat skin over the blush just under each eye, a pale crescent) texels near the skin round the eyes, a little darker or pinker (shade, blush), stay as painted; the iris, lashes, whites and grey rim are far from it
eyeK_ = ((uShut > .5 || uLid > 0.0) && vColor.r > .5) ? max(max(eyeOv_(uOvA), eyeOv_(uOvB)) * (1.0 - esk_) * (1.0 - max(eyeBrow_(uOvA), eyeBrow_(uOvB)) * (1.0 - smoothstep(.4, .55, emx_))), uShut > .5 && inEye_ ? max((1.0 - smoothstep(.12, .2, esat_)) * smoothstep(.5, .65, emx_), smoothstep(.72, .82, esat_)) : 0.0) : 0.0;   // (13 Nov 2026, second reviewers, all six: the iris, lashes and pale rim of the open eye showed round every shut lid from the side, above and below, and the far eye past the nose; the colour test caught only the whites: each eye's own oval, out to its lashes (the fit's eye_ovals), is skin outright; skin-marked texels only, so a lock of hair across it stays)   // (light greys too: the old eye's pale outline showed round the shut lid from the side, r050, r057, r084)   // (not dark texels: r084's curly hair and brows inside the eye areas turned skin-coloured on every blink; a dark lash edge reads as a crease)   // (and strongly coloured, past any skin: an amber or green iris; r084's dark skin is .58)   // (the eye's own texels only, whites and grey lines (pale) or lashes and pupil (dark), in linear colour: the friends' skin test painted blush and freckles flat too, a hard-edged band across a villager's cheeks)
#endif` : ''}
${cover ? `// (10 Nov 2026, owner circled bites out of the legs: the back of a bent knee, a calf under Lumi's skirt) the body under worn
// clothes is no longer hidden: where it bulged past them as a joint bent it was a see-through bite. It is painted in the
// colour of the innermost worn garment over it, keeping the painted light and shade, so it looks like that cloth
#ifdef USE_COLOR
if (vCov > ${BODY_CUT} && vColor.r > .5) k_ = vCovCol * clamp(sm_ / (uPaint.r + uPaint.g + uPaint.b + 1e-4), .85, 1.05) / max(tx_, vec3(.02));   // (skin only: the swim kit has its own flat paint above)
#endif` : ''}
diffuseColor.rgb *= k_;${eyes ? '\ndiffuseColor.rgb = mix(diffuseColor.rgb, diffuse * (uEyeSkinOn > .5 ? uEyeSkin * uTint : uTint * uPaint), eyeK_);' : ''}`)
      .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\ntotalEmissiveRadiance *= k_;' + (eyes ? '\ntotalEmissiveRadiance = mix(totalEmissiveRadiance, emissive * (uEyeSkinOn > .5 ? uEyeSkin * uTint : uTint * uPaint), eyeK_);' : ''))   // (13 Nov 2026: a shut villager eye takes the skin's colour outright: scaling a lash's near-black texel up gave coloured noise)
      .replace('#include <color_fragment>', ''); }; // (the corner colour is the skin mark, not a colour)
  m.customProgramCacheKey = () => 'meshy-skintint' + (lax ? '-lax' : '') + (m.vertexColors ? '-mark' : '') + (cover ? '-cover' : '') + (kit ? '-kit' : '') + (eyes ? '-eyes' : ''); m.needsUpdate = true; return m;
}
/** a child's own copy of a skin-tinted material (a clone loses the shader change and turns the colours into plain data) */
function tintCopy(m) { const c = m.clone(); return skinTint(c, m.userData.paintHex); }
/** (owner 8 Nov 2026) the skin tone choice is hidden for now and may come back: true lets a Meshy friend take the child's tone (skinTint) */
export let MESHY_TONES = false;
export const setMeshyTones = (on: boolean) => { MESHY_TONES = on; };
function baked(name: string, map: THREE.Texture) {
  const m = new THREE.MeshLambertMaterial({ name, map, emissiveMap: map, emissive: '#ffffff', emissiveIntensity: BAKED_EMISSIVE, color: BAKED_COLOR.clone(), side: THREE.DoubleSide });
  m.userData.baked = true; return m;
}
const ready: Record<string, Loaded> = {}, loading: Record<string, Promise<boolean>> = {}, failed = new Set<string>();
let bands: THREE.Texture = null;
export const friendModelReady = (id: string) => !!ready[id];
export const friendModelFailed = (id: string) => failed.has(id);
export const FRIEND_MODEL_URL = (id: string) => `models/${id}.glb`;
// (v1.08e faces, part 2) the high-detail model of a friend is loaded by the key "<id>-hd" (models/<id>-hd.glb): only the
// child's own friend, after the start (js/player.ts); the light model stays for far away, other children and the fallback
export const HD = (id: string) => id + '-hd';
/** load a friend's model (once); resolves true when it is ready, false when it could not load */
export function loadFriendModel(id: FriendId | `${FriendId}-hd`): Promise<boolean> {
  if (!id) return Promise.resolve(false);
  if (ready[id]) return Promise.resolve(true);
  if (failed.has(id)) return Promise.resolve(false);
  return loading[id] || (loading[id] = (async () => {
    try {
      const [{ GLTFLoader }, { MeshoptDecoder }, { clone }] = await Promise.all([import('../vendor/GLTFLoader.js'), import('../vendor/meshopt_decoder.module.js'), import('../vendor/SkeletonUtils.js')]);
      const l = new GLTFLoader(); l.setMeshoptDecoder(MeshoptDecoder);
      const g = await l.loadAsync(FRIEND_MODEL_URL(id));
      if (!bands) { const d = new Uint8Array([90, 170, 255]); bands = new THREE.DataTexture(d, 3, 1, THREE.RedFormat); bands.minFilter = bands.magFilter = THREE.NearestFilter; bands.needsUpdate = true; }
      // the picture-book look: toon shading in a few bands, colours from the corners; skin in one colour (set per child)
      const mats = new Map();
      let isBaked = false; g.scene.traverse((o: any) => { if (o.isMesh && /^face-/.test(o.material.name || '') && o.material.map) isBaked = true; });
      g.scene.userData.baked = isBaked;
      g.scene.traverse((o: any) => { if (!o.isMesh) return; o.frustumCulled = false; o.castShadow = true;
        const m = o.material, name = m.name || '';
        if (isBaked && m.map && !mats.has(m)) {   // (a Meshy model: see baked() above)
          const t = baked(name, m.map), ref = m.userData && m.userData.skin_ref;
          if (m.userData && m.userData.skin_mark && o.geometry.attributes.color) t.vertexColors = true; // (the skin mark from tools/meshy/fit_people.py, read by skinTint, not drawn as a colour)
          if (t.vertexColors && m.userData && m.userData.cover_mark && o.geometry.attributes.color.itemSize === 4) { t.userData.cover = true; if (m.userData.kit_waist != null) { t.userData.kit_waist = m.userData.kit_waist; t.userData.kit_neck = m.userData.kit_neck; t.userData.kit_grey = m.userData.kit_grey; if (Array.isArray(m.userData.eye_boxes)) t.userData.eye_boxes = m.userData.eye_boxes; } } // (which garments cover each body point: COVER_BIT)
          // (owner 8 Nov 2026, "Meshy's own face") an own-face mood piece: soft-edged and see-through round the eyes or
          // mouth over the painted face, taking the child's tone as a whole like the painted skin under it
          const own = name.startsWith('face-') && m.userData && m.userData.own_face;
          if (own) { t.transparent = true; t.depthWrite = false; t.userData.ownFace = true; o.renderOrder = 2; t.polygonOffset = true; t.polygonOffsetFactor = -6; t.polygonOffsetUnits = -24; } // (owner 8 Nov 2026: the curved cheek poked through the piece between its grid points as stripes and patches: the piece is drawn just on top)
          if (ref && (name.startsWith('skin-tex') || name.startsWith('face-'))) { t.userData.skinRef = ref; if (name.startsWith('face-') && !own) faceTint(t); }
          if (!t.userData.cover && t.vertexColors && m.userData && Array.isArray(m.userData.eye_boxes)) { t.userData.eye_boxes = m.userData.eye_boxes; if (Array.isArray(m.userData.eye_ovals)) t.userData.eye_ovals = m.userData.eye_ovals; if (Array.isArray(m.userData.eye_skin)) t.userData.eye_skin = m.userData.eye_skin; if (m.userData.lid_half != null) { t.userData.lid_half = m.userData.lid_half; t.userData.lid_sad = m.userData.lid_sad; } }   // (13 Nov 2026: a villager's eye areas too, for the shut-eye paint)
          if (t.userData.cover || t.userData.eye_boxes) { g.scene.updateMatrixWorld(true); t.userData.deq = g.scene.matrixWorld.clone().invert().multiply(o.matrixWorld).elements.slice(); }   // (the file's quantized positions to the model's metres: skinTint's eye areas, waist and neck)
          mats.set(m, t);
        }
      });
      // (owner 8 Nov 2026) every picture part of a Meshy model with a painted skin takes the tone texel by texel (skinTint)
      let mref = '', mpaint = '';
      g.scene.traverse((o: any) => { if (o.isMesh && o.material.userData) { mref ||= o.material.userData.skin_ref || ''; mpaint ||= o.material.userData.skin_paint || ''; } });
      if (isBaked && mref) for (const t of mats.values()) if (t.userData.baked && !t.userData.faceTint) { t.userData.skinRef = mref; skinTint(t, mpaint || mref); }
      g.scene.traverse((o: any) => { if (!o.isMesh) return;
        const m = o.material, name = m.name || '';
        if (isBaked && m.map && mats.has(m)) { o.material = mats.get(m); return; }
        // (v1.08e faces, part 2) a high-detail model's parts carry their painted picture (m.map) instead of corner colours
        // (v1.08e, owner 6 Nov: "skin-shade": the skin's corners carry its soft form shading, times the child's skin tone)
        // (Meshy characters, owner 7 Nov 2026: "skin toned phai giu nhu original", shifted from it for other tones) a model's
        // painted skin ("skin-tex", its picture) and its corner-coloured skin ("skin-shade" with extras skin_ref) are tinted
        // by the child's tone relative to the tone they were painted in, so the painted tone shows exactly as painted;
        // a "face-" picture with skin_ref marks its skin texels with alpha below .9, and only those are tinted
        const ref = m.userData && m.userData.skin_ref;
        if (!mats.has(m) && ref && (name.startsWith('skin-tex') && m.map || name.startsWith('face-') && m.map)) {
          const t = new THREE.MeshToonMaterial({ name, map: m.map, gradientMap: bands }); t.userData.skinRef = ref;
          if (name.startsWith('face-')) faceTint(t);
          mats.set(m, t);
        }
        if (!mats.has(m)) mats.set(m, name.startsWith('skin') ? new THREE.MeshToonMaterial({ name, color: '#f6c7a5', gradientMap: bands, vertexColors: name.startsWith('skin-shade') && !!(o.geometry && o.geometry.attributes.color) })
          // (v1.08e villagers) "lit-": the gallery's studio light is baked into the picture, so it is drawn mostly by its own light
          // (emissive), with a little of the valley's light on top, so day and night still show
          : name.startsWith('lit-') && m.map ? new THREE.MeshToonMaterial({ name, map: m.map, emissiveMap: m.map, emissive: '#fff0dc', emissiveIntensity: .9, color: '#8a8070', gradientMap: bands }) // (owner, 6 Nov: brighter, warmer)
          // (v1.08e, Release 6 Nov: no picture, the clothes crisp) the light is baked into the corner colours: drawn the same way
          : name.startsWith('lit-') ? litCorners(name)
          : m.map ? new THREE.MeshToonMaterial({ name, map: m.map, gradientMap: bands }) : new THREE.MeshToonMaterial({ name, vertexColors: true, gradientMap: bands }));
        if (name.startsWith('lit-g-') && m.userData) { const u = mats.get(m).userData; if (m.userData.cover_mark) u.cover = true; for (const k of ['cover_bit', 'gcover_bit', 'layer']) if (k in m.userData) u[k] = m.userData[k]; } // (an inner garment's points under outer ones; each garment's own bits, from tools/meshy/make_clothes.py)
        if (/^(cloth-(hat|hair)|lit-g-)/.test(name)) mats.get(m).side = THREE.DoubleSide; // (and a body model's clothes: a skirt's inside shows) // (v1.08e villagers) a hat is a thin shell, and a lock of hair a thin card: both sides drawn
        if (ref && !mats.get(m).userData.skinRef) mats.get(m).userData.skinRef = ref;   // (a corner-coloured "skin-shade" painted in its own tone)
        o.material = personLook(mats.get(m));
        if (o.material.userData.faceTint) o.material.customProgramCacheKey = () => 'person-facetint'; }); // (v1.08e faces, part 2) the people's soft ramp and rim light
      ready[id] = { scene: g.scene, clone };
      return true;
    } catch (e) { failed.add(id); console.warn('friend model', id, e && e.message); return false; }
  })());
}
// the code person's mood → the model's face
// (v1.08e faces) and the soft-lid faces' new ones: 'half' (the lids half down, either side of a blink), 'lookL' and 'lookR'
// (the eyes to one side); a model made before them shows its nearest face instead (NEAR)
const MOOD = { smile: 'face-smile', blink: 'face-blink', happy: 'face-happy', o: 'face-surprised', curious: 'face-curious', excited: 'face-excited', sad: 'face-sad', shy: 'face-shy',
  half: 'face-half', lookL: 'face-lookL', lookR: 'face-lookR', sleep: 'face-blink' };
const NEAR = { 'face-half': 'face-blink', 'face-lookL': 'face-smile', 'face-lookR': 'face-smile' };
// (v1.08e faces, part 3: owner 6 Nov 2026 AEDT, "like a real 3D person") a model with a sculpted face has one face mesh,
// "face3d", whose moods are its shape keys (tools/blender/lumi-face3d.py): the rest shape smiles, one key is set at a time
// (a blink passes through 'half', as the face meshes did)
const KEY = { o: 'surprised', talk: 'open' };
const JOINTS = ['torso', 'head', 'armL', 'elbowL', 'armR', 'elbowR', 'legL', 'kneeL', 'legR', 'kneeR'];
export type FriendModel = { obj: THREE.Object3D, follow: (mood?: string, riding?: boolean) => void, skin: (hex: string) => void, item: boolean, boots: boolean, face3d?: any[] | null, readonly mood?: string };
// (v1.08d polish) what a model shows besides the body: the item in the hand once the friend's quest is done
// (js/friendquest.ts), and its own boots unless the child wears shoes from the shop (then the code person's shoes stay on)
export type FriendModelWear = { item?: boolean, shoes?: boolean };
/** a copy of the friend's model inside the code person's rig, following its joints. A: the code person (js/avatar.ts) */
// (owner 8 Nov 2026, "Body + code-made clothes") a friend made as a Meshy body (tools/meshy/make_clothes.py) carries its
// clothes as parts "lit-g-<part>", shaped on that body; the outfit worn (js/content/friends.ts friendLook: style, main
// colour, legs colour, shoes) picks the parts and colours them. The parts keep Meshy's painted shading in their corner
// colours, so a colour only tints them.
const GARMENTS: Record<string, [string, 'main' | 'legs' | 'cream'][]> = {
  shirt: [['top-short', 'main'], ['trousers', 'legs']],
  tunic: [['tunic-long', 'main'], ['trousers', 'legs']],
  dress: [['bodice', 'main'], ['skirt', 'main'], ['leggings', 'legs']],
  overalls: [['top-short', 'cream'], ['shorts', 'main'], ['bib', 'main']],
  aodai: [['top-long', 'main'], ['aodai-panels', 'main'], ['trousers', 'legs']],
  hoodie: [['top-long', 'main'], ['trousers', 'legs']]
};
/** (owner 9 Nov 2026) each garment's bit in the body's cover mark (tools/meshy/make_clothes.py COVER_BIT): the body under a worn garment is not drawn */
export const COVER_BIT: Record<string, number> = { 'top-short': 1, 'top-long': 2, 'tunic-long': 4, bodice: 8, skirt: 16, shorts: 32, trousers: 64, leggings: 128 };
/** (owner 9 Nov 2026) each outer garment's bit in an inner garment's cover mark (make_clothes.py GCOVER_BIT) */
export const GCOVER_BIT: Record<string, number> = { 'top-short': 1, 'top-long': 2, 'tunic-long': 4, bodice: 8, skirt: 16, 'aodai-panels': 32, bib: 64 };
/** a garment's points under a worn outer garment are not drawn (its bits in the alpha of its corner colour) */
function garmentCover(m) {
  m.userData.coverU = { value: 0 };
  m.onBeforeCompile = sh => { sh.uniforms.uCover = m.userData.coverU;
    sh.vertexShader = 'uniform float uCover;\nvarying float vCov;\n' + sh.vertexShader.replace('#include <color_vertex>', `#include <color_vertex>
float cb_ = floor(color.a * 255.0 + .5); vCov = 0.0;
for (int k = 0; k < 8; k++) { float p_ = exp2(float(k)); if (mod(floor(cb_ / p_), 2.0) > .5 && mod(floor(uCover / p_), 2.0) > .5) vCov = 1.0; }`);
    sh.fragmentShader = 'varying float vCov;\n' + sh.fragmentShader.replace('void main() {', 'void main() {\nif (vCov > .999) discard;'); };
  m.customProgramCacheKey = () => 'meshy-garment-cover'; m.needsUpdate = true; return m;
}
/** (owner 9 Nov 2026, the poses: layers came through each other by a few millimetres when the children sat, ran and jumped)
 * each garment is drawn a little nearer the camera along its own line of sight, more for outer layers (trousers 2 mm,
 * tops 10 mm, skirts, panels and the bib 16 mm; 5 and 9 left a sitting thigh through the shirt and panels): its outline on screen is unchanged, but where two layers meet, the outer
 * one wins, the standard depth order for layered clothes */
// (10 Nov 2026, the auditor: Clara's and Finn's shins came through the áo dài trousers just above the boots, sitting and
// running) the body's triangles are large (9k model): one with two corners under worn clothes and one out kept all of it
// drawn and poked through the cloth. Where it is mostly under worn clothes it takes the cloth's colour (skinTint).
export const BODY_CUT = '.5';
const LAYER_BIAS = [.002, .018, .034, .012];   // (10 Nov 2026: skirts .034: a skirt's waistband always lies over the top tucked under it; at .026 Lumi's bodice showed over it at the back when she walked)
//   // (10 Nov 2026: boots .012: the trouser cuffs inside them showed as a ragged edge over the boot tops, Sol's)
function layerBias(m, layer: number) {
  const b = LAYER_BIAS[layer] ?? 0, prev = m.onBeforeCompile, key = m.customProgramCacheKey;
  if (!b) return m;
  m.onBeforeCompile = (sh, r) => { if (prev) prev.call(m, sh, r);
    sh.vertexShader = sh.vertexShader.replace('#include <project_vertex>', `#include <project_vertex>
mvPosition.xyz -= normalize(mvPosition.xyz) * ${b.toFixed(4)}; gl_Position = projectionMatrix * mvPosition;`); };
  m.customProgramCacheKey = () => (key ? key.call(m) : '') + '-layer' + layer; m.needsUpdate = true; return m;
}
/** shows the outfit's garments; returns the worn garments' cover bits */
function dress(parts: Record<string, any>, look, wear: FriendModelWear): { bits: number, top?: string, bot?: string, cov: string[], rank: number[] } {
  if (!Object.keys(parts).length) return { bits: 0 };
  const L = friendLook(look || {}) || {}, set = GARMENTS[L.style] || GARMENTS.shirt;
  const paint = (o, hex: string) => { const c = new THREE.Color(hex || '#9a9a9a'); o.material.emissive.copy(c).multiplyScalar(.62); o.material.emissiveIntensity = 1; o.material.color.copy(c).multiplyScalar(.55); }; // (mostly its own painted shade, some valley light: not flat)
  let bits = 0;
  let gbits = 0, top = '', bot = ''; const cov: string[] = new Array(8).fill('#ffffff'), rank: number[] = new Array(8).fill(99);
  const bitOf = (o, k: string, table: Record<string, number>, part: string) => (o.material.userData[k] ?? table[part]) || 0; // (the model's own bits; the tables only for models made before 9 Nov)
  for (const [part, from] of set) { const o = parts[part]; if (!o) continue; o.visible = true; bits |= bitOf(o, 'cover_bit', COVER_BIT, part); gbits |= bitOf(o, 'gcover_bit', GCOVER_BIT, part); const hex = from === 'main' ? L.color : from === 'legs' ? L.legs : '#f3e6c8'; paint(o, hex); const ly = o.material.userData.layer ?? (/^(trousers|shorts|leggings)$/.test(part) ? 0 : 1); if (ly === 1 && !top) top = hex; if (ly === 0 && !bot) bot = hex; const cb = bitOf(o, 'cover_bit', COVER_BIT, part); for (let k = 0; k < 8; k++) if (cb & (1 << k)) { cov[k] = hex; rank[k] = ly; } }
  if (parts.boots) { parts.boots.visible = !wear.shoes; paint(parts.boots, L.shoe || '#8a5a3a'); }
  for (const o of Object.values(parts)) if (o.material.userData.coverU) o.material.userData.coverU.value = gbits & ~bitOf(o, 'gcover_bit', GCOVER_BIT, o.material.name.slice(6)); // (never hidden by itself)
  return { bits, top: top || bot, bot: bot || top, cov, rank };
}
export function attachFriendModel(A, id: string, skinHex: string, wear: FriendModelWear = {}, hd = false): FriendModel {
  const L = ready[hd ? HD(id) : id]; if (!L) return null;
  const obj = L.clone(L.scene); obj.name = 'friend-model';
  const bones: Record<string, THREE.Bone> = {}, faces: Record<string, THREE.Object3D[]> = {}, grips: THREE.Object3D[] = [], skinMats = [], face3: any[] = [], garments: Record<string, any> = {};
  obj.traverse((o: any) => {
    if (o.isBone) bones[o.name] = o;
    if (o.isMesh) {
      const n = o.material.name || '';
      if (o.morphTargetDictionary && 'blink' in o.morphTargetDictionary) { face3.push(o); o.userData.face3d = true; }
      if (n.startsWith('face-')) (faces[n] = faces[n] || []).push(o);
      if (o.material.userData.skinTint) { o.material = tintCopy(o.material); skinMats.push(o.material); } // (Meshy: each child's own tone, texel by texel)
      else if (n.startsWith('skin')) { o.material = o.material.clone(); o.material.userData.person = false; personLook(o.material); skinMats.push(o.material); }
      // (Meshy characters) each child's copy of a skin-tinted face picture has its own tint
      else if (o.material.userData.ownFace) { const c = o.material.clone(); o.material = c; if (c.userData.skinRef) skinMats.push(c); } // (each child's own tone)
      else if (o.material.userData.faceTint) { const c = faceTint(o.material.clone()); c.userData.person = false; personLook(c); c.customProgramCacheKey = () => 'person-facetint'; o.material = c; skinMats.push(c); }
      if (n === 'skin-grip' || n === 'cloth-hands-grip') grips.push(o); // (the hands that hold handlebars: shown only when riding)
      if (n === 'cloth-item') o.visible = !!wear.item; // (v1.08d polish) the item in the hand: only once earned
      if (n === 'cloth-shoes') o.visible = !wear.shoes; // (v1.08d polish) the model's boots, unless shop shoes are worn
      if (n.startsWith('lit-g-')) { const src = o.material; o.material = src.clone(); if (src.userData.cover && o.geometry.attributes.color && o.geometry.attributes.color.itemSize === 4) garmentCover(o.material); if (src.userData.layer != null) layerBias(o.material, src.userData.layer); garments[n.slice(6)] = o; o.visible = false; } // (a body model's clothes, dressed below)
    }
  });
  const dressed = dress(garments, A.look, wear), coverBits = dressed.bits;
  obj.traverse((o: any) => { const u = o.isMesh && o.material.userData; if (!u || !u.coverU || (o.material.name || '').startsWith('lit-g-')) return; u.coverU.value = coverBits; // (the body; garments have their own, set in dress)
    if (u.kitU && dressed.top) { u.kitU.top.value.set(dressed.top); u.kitU.bot.value.set(dressed.bot); u.kitU.on.value = 1; }
    if (u.kitU && u.kitU.covCol && dressed.cov) for (let k = 0; k < 8; k++) { u.kitU.covCol.value[k].set(dressed.cov[k]); u.kitU.covRank.value[k] = dressed.rank[k]; } }); // (10 Nov 2026, owner: "như recommended") a villager (whole Meshy model, clothes painted on) has no garments: dress() gives no cov, and this loop threw, so no Meshy villager was worn
  A.rig.add(obj); A.rig.updateMatrixWorld(true);
  // (v1.08e faces, part 2) the same thin ink outline as the code people, bent by the model's bones (not on the faces);
  // each follows its part's visibility (the item in the hand, the riding hands) and hides far away with the others
  const lines: [THREE.Object3D, THREE.Object3D][] = [];
  if (!L.scene.userData.baked) obj.traverse((o: any) => { if (o.isSkinnedMesh && !o.userData.outline && !o.userData.face3d && !/^(face-|cloth-hat|cloth-hair)/.test(o.material.name || '')) lines.push([o, null]); }); // (none on a Meshy model: see baked()) // (no shell behind a thin hat, none on the face, none round the locks of hair: it poked out between them, Release 6 Nov)
  lines.forEach(l => { l[1] = outlineSkinned(l[0], .009); });
  if (Array.isArray(A.outlines)) A.outlines.push(...lines.map(l => l[1]));
  // the rest turn of each joint, the code person's and the model's (both in the rig's space)
  const rigQ = new THREE.Quaternion(), q = new THREE.Quaternion(), rest = {};
  const inRig = (o, out) => { o.getWorldQuaternion(out); return out.premultiply(rigQ.clone().invert()); };
  A.rig.getWorldQuaternion(rigQ);
  for (const j of JOINTS) if (A[j] && bones[j]) rest[j] = { c: inRig(A[j], new THREE.Quaternion()).invert(), b: inRig(bones[j], new THREE.Quaternion()) };
  const order = JOINTS.filter(j => rest[j]);
  // (owner 9 Nov 2026, the poses: legs came through skirts and the áo dài's panels) a skirt's front and back hang from two
  // driven bones (tools/meshy/make_clothes.py): the front turns with the leg swung furthest forward, the back with the leg
  // swung furthest back, so the cloth is carried by the leg instead of the leg passing through it
  const skirt = (['skirtF', 'skirtB', 'skirtF2', 'skirtB2'] as const).filter(n => bones[n] && bones[n].parent).map(n => ({ n, b: bones[n], r: inRig(bones[n], new THREE.Quaternion()) }));
  const X = new THREE.Vector3(1, 0, 0), sq = new THREE.Quaternion();
  // (10 Nov 2026, the auditor: Lumi's festival skirt sitting) the upper skirt bones turn about the hip joints' own axis, the
  // axis the thighs turn about, not about their hinge in front of (behind) the hips: about the hinge the front lay below the
  // tops of her raised thighs, they came through it and the inside of the skirt showed from the front. The hinge itself is
  // carried round that axis, so the cloth lies over the thighs like the trousers under it.
  const rigP = (o: any) => A.rig.worldToLocal(o.getWorldPosition(new THREE.Vector3()));
  const hipMid = () => bones.legL && bones.legR ? rigP(bones.legL).add(rigP(bones.legR)).multiplyScalar(.5) : null;
  const H0 = hipMid(), skirtOff: Record<string, any> = {};
  if (H0) for (const s of skirt) if (s.n === 'skirtF') skirtOff[s.n] = rigP(s.b).sub(H0);   // (the front only: about the hip axis a back swung back by the walking leg pushed its top into the bodice)
  const sp = new THREE.Vector3();
  // (the thigh's turn about the rig's side axis, measured on the model's own thigh from hip to knee: the code leg's own
  // angle missed the hips' tilt, and a sitting child's knees rose above her skirt)
  const thigh = (l: string, k: string) => bones[l] && bones[k] ? rigP(bones[k]).sub(rigP(bones[l])) : null;
  const T0 = { L: thigh('legL', 'kneeL'), R: thigh('legR', 'kneeR') };
  const thighAng = (side: 'L' | 'R', fallback: number) => { const d0 = T0[side], d = d0 && thigh('leg' + side, 'knee' + side); if (!d) return fallback;
    return Math.atan2(d0.y * d.z - d0.z * d.y, d0.y * d.y + d0.z * d.z); };
  // (owner 9 Nov 2026: keep the full poses, fix the cloth) corrective helper bones at the shoulders and hips
  // (tools/meshy/make_clothes.py): each turns half way between the trunk and its limb, so armpits and crotches bend round
  const helpers = ([['helpArmL', 'torso', 'armL'], ['helpArmR', 'torso', 'armR'], ['helpLegL', 'root', 'legL'], ['helpLegR', 'root', 'legR']] as const)
    .filter(([h, t, l]) => bones[h] && bones[h].parent && bones[t] && bones[l])
    .map(([h, t, l]) => ({ b: bones[h], t: bones[t], l: bones[l], r: inRig(bones[h], new THREE.Quaternion()), rt: inRig(bones[t], new THREE.Quaternion()).invert(), rl: inRig(bones[l], new THREE.Quaternion()).invert() }));
  const hq1 = new THREE.Quaternion(), hq2 = new THREE.Quaternion();
  let face = '', shown = 'smile';
  const follow = (mood = 'smile', riding = false) => {
    A.rig.getWorldQuaternion(rigQ); const inv = rigQ.clone().invert(), parentQ = new THREE.Quaternion();
    for (const j of order) {
      const b = bones[j], r = rest[j];
      A[j].getWorldQuaternion(q); q.premultiply(inv).multiply(r.c).multiply(r.b); // the code joint's turn from its rest, on the model's rest
      b.parent.getWorldQuaternion(parentQ); parentQ.premultiply(inv);
      b.quaternion.copy(parentQ.invert().multiply(q));
      b.updateMatrixWorld(true);
    }
    for (const h of helpers) {   // (half way between the trunk's turn and the limb's, from their rests)
      h.t.getWorldQuaternion(hq1); hq1.premultiply(inv).multiply(h.rt);
      h.l.getWorldQuaternion(hq2); hq2.premultiply(inv).multiply(h.rl);
      hq1.slerp(hq2, .5); sq.copy(hq1).multiply(h.r);
      h.b.parent.getWorldQuaternion(parentQ); parentQ.premultiply(inv);
      h.b.quaternion.copy(parentQ.invert().multiply(sq)); h.b.updateMatrixWorld(true);
    }
    if (skirt.length && A.legL && A.legR) {
      const lx = thighAng('L', A.legL.rotation.x), rx = thighAng('R', A.legR.rotation.x); // (negative is forward)
      for (const s of skirt) {
        // (the upper bone with the thigh; the lower one, below the knee, mostly hanging down: a sitting child's áo dài lies
        // over the lap and falls from the knees instead of standing out like a board)
        let ang = (s.n.startsWith('skirtF') ? Math.min(lx, rx, 0) : Math.max(lx, rx, 0)) * (s.n.endsWith('2') ? .25 : s.n === 'skirtF' ? .8 : .95);   // (the front a little less than the thighs about their own axis: the flared hem lies on the knees, Lumi's festival sitting)
        // (10 Nov 2026, the auditor: Clara's áo dài running, seen from behind) the back below the knees goes with the shin of
        // the leg kicked furthest back (thigh and knee together), or the heel came out through the back panel's hem
        if (s.n === 'skirtB2' && A.kneeL && A.kneeR) ang = Math.max(ang, Math.max(lx + A.kneeL.rotation.x, rx + A.kneeR.rotation.x, 0) * .85);
        sq.setFromAxisAngle(X, ang).multiply(s.r);
        const off = skirtOff[s.n], Hn = off && hipMid();
        if (Hn) { sp.copy(off).applyAxisAngle(X, ang).add(Hn); A.rig.localToWorld(sp); s.b.parent.worldToLocal(sp); s.b.position.copy(sp); }
        s.b.parent.getWorldQuaternion(parentQ); parentQ.premultiply(inv);
        s.b.quaternion.copy(parentQ.invert().multiply(sq)); s.b.updateMatrixWorld(true);
      }
    }
    let f = MOOD[mood] || 'face-smile'; if (!faces[f]) f = NEAR[f] || 'face-smile';
    if (f !== face) { face = f; for (const [k, list] of Object.entries(faces)) list.forEach(o => { o.visible = k === f; });
      const shut = /^face-(blink|happy)$/.test(f) ? 1 : 0; for (const m of skinMats) if (m.userData.kitU) { const u = m.userData.kitU; u.shut.value = shut; if (u.lid) u.lid.value = shut ? 1 : f === 'face-half' ? u.lidHalf : f === 'face-sad' ? u.lidSad : 0; } }   // (14 Nov 2026, gate k: a villager's half and sad lids showed the open eye's upper lash and the far eye's iris above them from above and the side: the skin paint reaches down to each lid's own depth (lid_half, lid_sad from the fit)) // (eyes shut: the painted whites hidden, see skinTint)
    if (face3.length) {
      const key = KEY[mood] || mood;
      if (key !== shown) { shown = key; for (const o of face3) { const d = o.morphTargetDictionary, inf = o.morphTargetInfluences; for (const n in d) inf[d[n]] = n === key ? 1 : 0; } }
    }
    grips.forEach(o => { o.visible = riding; });
    for (const [o, h] of lines) if (h.visible !== o.visible && A._ol !== false) h.visible = o.visible;
  };
  // (Meshy characters) a painted skin (skinRef) is tinted by the tone relative to the tone it was painted in
  const skin = (hex: string) => skinMats.forEach(m => {
    if (L.scene.userData.baked && !MESHY_TONES) hex = ''; // (owner 8 Nov 2026: a Meshy friend keeps exactly the skin Meshy painted while the tone choice is hidden)
    const r = m.userData.skinRef; if (!r) { if (hex) m.color.set(hex); return; }
    if (!hex) hex = r; // (no tone given, a villager: exactly as painted)
    const t = new THREE.Color(hex), c = new THREE.Color(r), k = new THREE.Color(t.r / Math.max(c.r, .05), t.g / Math.max(c.g, .05), t.b / Math.max(c.b, .05));
    if (m.userData.faceTint || m.userData.skinTint) m.userData.tint.value.copy(k);
    else if (m.userData.baked) { m.color.copy(BAKED_COLOR).multiply(k); m.emissive.copy(k); } // (its own light takes the tone too)
    else m.color.copy(k);
  });
  skin(skinHex); follow();
  // the joints are copied just before each drawing, after everything that moves the code person this frame (the walk, a
  // rider's seat, a film's pose): the renderer updates every object's place first, and this copy goes with the model's
  const own = obj.updateMatrixWorld.bind(obj);
  obj.updateMatrixWorld = (force?: boolean) => { if (A.rig.visible) follow(A.life && A.life.mood || 'smile'); own(force); };
  return { obj, follow, skin, item: !!wear.item, boots: !wear.shoes, face3d: face3.length ? face3 : null, get mood() { return face3.length ? shown : face.replace(/^face-/, ''); } };
}

// (v1.08b friends) glasses and a mask (head coordinates: the eyes sit at x ±.12, y -.09, the face's front at z .49)
export function faceParts(it) {
  const c = it.color, y = -.08, z = .5;
  if (it.shape === 'mask') { const st = new THREE.Shape(); for (let i = 0; i < 10; i++) { const a = Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? .09 : .2; const px = Math.cos(a) * r, py = Math.sin(a) * r + .1; i ? st.lineTo(px, py) : st.moveTo(px, py); }
    return [P(new THREE.CapsuleGeometry(.07, .2, 4, 10), c, [0, y, z - .02], [0, 0, Math.PI / 2], [1, .9, .45]), P(new THREE.ShapeGeometry(st), c, [0, y + .06, z + .015])]; }
  const ring = it.shape === 'roundglasses' ? new THREE.TorusGeometry(.085, .016, 6, 20) : new THREE.TorusGeometry(.08, .022, 4, 4);
  const out = [-1, 1].flatMap(s => [P(ring, c, [s * .12, y, z], [0, 0, it.shape === 'roundglasses' ? 0 : Math.PI / 4], it.shape === 'roundglasses' ? [1, 1, 1] : [1.25, .9, 1]),
    P(new THREE.BoxGeometry(.14, .02, .02), c, [s * .27, y + .02, z - .1], [0, s * .9, 0])]);
  if (it.shape === 'glasses') [-1, 1].forEach(s => out.push(P(new THREE.CircleGeometry(.075, 4), c, [s * .12, y, z - .002], [0, 0, Math.PI / 4], [1.25, .9, 1])));
  out.push(P(new THREE.BoxGeometry(.07, .018, .018), c, [0, y + .01, z + .005]));
  return out;
}
