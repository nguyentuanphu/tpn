// (v1.08b quality, owner 5 Nov 2026 AEDT: "when you fly to another destinations often it gets stuck behind a bus station,
// better to audit and check all", and "Including all public transport including electric car, xích lô's drop off to
// make sure it is in open area") where a child is set down: after a flight (map pins, Go there, game places, quests,
// the Simple screen's Places, the calendar, chapters) and at the end of every ride (bus, xích lô, electric cart, tram,
// taxi, motorbike, an animal). One rule for all of them, here:
//   open ground   nothing solid under or right beside the child (buildings, shelters, signs, fences, walls, trees,
//                 water, the valley's edge)
//   a way out     the child can walk off in at least WAYS_MIN of 8 directions
//   a clear view  a camera direction with nothing standing between the camera and the child
// The nearest spot that has all three wins; the camera faces the way the child is going when that view is clear.
import { heightAt, WATER, HALF } from './world.js';
import { solidCircleHit } from './solids.js';

type Box = { x0: number, x1: number, z0: number, z1: number, bottom?: number, top?: number };
type Col = { x: number, z: number, r: number, top?: number };
export type DropWorld = { colliders: Col[], boxes: Box[], solid?: Uint8Array, solidAt?: (x: number, z: number, y?: number) => boolean };
export const WAYS_MIN = 4, WAY_LEN = 2.5, CAM_DIST = 5.8;

/** nothing solid at (x, z) within r: the ground a child can stand on */
export function standable(W: DropWorld, x: number, z: number, r = .5, edge = HALF - 10): boolean {
  if (!Number.isFinite(x) || !Number.isFinite(z) || Math.abs(x) > edge || Math.abs(z) > edge) return false;
  if (heightAt(x, z) <= WATER + .3) return false;
  if (W.solidAt && (W.solidAt(x, z) || W.solidAt(x + r, z) || W.solidAt(x - r, z) || W.solidAt(x, z + r) || W.solidAt(x, z - r))) return false;
  if (solidCircleHit(W, x, z, r)) return false;
  if (W.colliders.some(c => c.r > 0 && c.top == null && Math.hypot(c.x - x, c.z - z) < c.r + r)) return false;
  return !W.boxes.some(b => b.bottom == null && x > b.x0 - r && x < b.x1 + r && z > b.z0 - r && z < b.z1 + r);
}
/** the directions (of 8) a child can walk WAY_LEN from (x, z) */
export function waysOut(W: DropWorld, x: number, z: number): number {
  let n = 0;
  for (let k = 0; k < 8; k++) { const a = k / 8 * Math.PI * 2, dx = Math.sin(a), dz = Math.cos(a); if ([.9, 1.7, WAY_LEN].every(d => standable(W, x + dx * d, z + dz * d, .35))) n++; }
  return n;
}
/** is the line from the child at (x, z) to a camera in direction camYaw (as js/player.ts places it) free of solid things */
export function viewClear(W: DropWorld, x: number, z: number, camYaw: number, dist = CAM_DIST): boolean {
  for (let d = 1; d <= dist; d += .6) { const px = x + Math.sin(camYaw) * d, pz = z + Math.cos(camYaw) * d; if (!standable(W, px, pz, .15, HALF)) { if (heightAt(px, pz) > WATER + .3 || W.solidAt?.(px, pz)) return false; } }
  return true;
}
/** the camera direction for a child at (x, z): the wanted one if its view is clear, else the nearest clear one */
export function clearCamYaw(W: DropWorld, x: number, z: number, want: number): number | null {
  for (let k = 0; k <= 8; k++) for (const s of k ? [1, -1] : [1]) { const yaw = want + s * k * Math.PI / 8; if (viewClear(W, x, z, yaw)) return yaw; }
  return null;
}
/** the nearest open spot to (x, z) with a way out and a clear view; face: where the child will go (to look that way) */
export function dropSpot(W: DropWorld, x: number, z: number, face?: { x: number, z: number } | null, rmax = 16): { x: number, z: number, yaw: number, camYaw: number, ok: boolean } {
  const try1 = (px: number, pz: number) => {
    if (!standable(W, px, pz) || waysOut(W, px, pz) < WAYS_MIN) return null;
    const yaw = face ? Math.atan2(face.x - px, face.z - pz) : 0, cam = clearCamYaw(W, px, pz, yaw + Math.PI);
    return cam == null ? null : { x: px, z: pz, yaw, camYaw: cam, ok: true };
  };
  const here = try1(x, z); if (here) return here;
  for (let r = 1; r <= rmax; r += .9) for (let k = 0; k < 20; k++) { const a = k / 20 * Math.PI * 2, got = try1(x + Math.cos(a) * r, z + Math.sin(a) * r); if (got) return got; }
  const yaw = face ? Math.atan2(face.x - x, face.z - z) : 0;
  return { x, z, yaw, camYaw: yaw + Math.PI, ok: false };
}
