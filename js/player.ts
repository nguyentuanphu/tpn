// The explorer: walking, running, jumping, gliding, climbing slopes, swimming and riding,
// with a stamina wheel. Nothing here can really hurt a child; long falls only cost a heart.
import { seatRider } from './vehicles.js';
import { vehicleEye } from './rideview.js';
import { THREE } from './gfx.js';
import { buildAvatar } from './avatar.js';
import { WATER, heightAt, surfaceAt } from './world.js';
import { clamp, lerp, angleLerp } from './util.js';
import { SFX } from './audio.js';

const _ray = new THREE.Raycaster(), _dir = new THREE.Vector3();
// (round R, owner: "the camera angles give a headache when it moves") every automatic turn of the camera eases in and
// never goes faster than a slow, steady pace, however far it has to turn
const easeYaw = (cur, want, dt, rate, maxSpeed) => { const d = Math.atan2(Math.sin(want - cur), Math.cos(want - cur)), step = d * Math.min(1, dt * rate), cap = maxSpeed * dt; return cur + Math.max(-cap, Math.min(cap, step)); };
const GRAV = 22, WALK = 5.5, RUN = 9.5, SWIM = 3.4, CLIMB = 2.6, GLIDE = 8, RIDE = 11.5;

import type { Profile } from '../types/save.js';
export type RideVehicle = { o: THREE.Object3D, wheels: THREE.Object3D[], wr: number, seat: number[], grips?: number[][], feet?: number[][], wheelAt?: number[],
  cabin?: { width: number, length: number, bottom: number, top: number, color: string } };
type RideMount = { mesh: THREE.Object3D, shadow: THREE.Object3D, yaw: number, rider?: Hero | null, speed?: number, quiet?: boolean,
  tx?: number, tz?: number, back?: boolean, home?: number[], slot?: { taken: unknown }, vehicle?: RideVehicle, firstPersonHide?: THREE.Object3D[] };
type CarryResult = { x: number, y: number, z: number, yaw?: number, swim?: boolean, state?: string, rest?: boolean, speed?: number, rideY?: number, vehicle?: RideVehicle };
type HeroPad = { mx: number, mz: number, cdx: number, cdy: number, run?: boolean, jump(): boolean, act?(): boolean };
export interface Hero {
  i: number; profile: Profile; scene: THREE.Scene; world: ReturnType<typeof import('./world.js').createWorld>;
  pos: THREE.Vector3; lastSafe: THREE.Vector3; camPos: THREE.Vector3; camLook?: THREE.Vector3; cam: THREE.PerspectiveCamera;
  av: ReturnType<typeof buildAvatar>; yaw: number; vy: number; camYaw: number; camPitch: number; camDist: number;
  state: string; speed: number; onGround: boolean; stamina: number; exhausted: boolean; bonusStamina: number; hearts: number;
  fallStart?: number; towerClimb?: { tw: { id: string, x: number, z: number }, top: number, ax: number, az: number }; riding?: RideMount;
  safeTimer: number; stepTimer: number; emoteT: number; manualCamT: number; cheerT: number;
  easyT?: number; stillT?: number; steerYaw?: number; goal?: { x: number, z: number }; goalT?: number; view?: string; zoom?: number;
  autoRun?: boolean; gliding?: boolean; climbing?: boolean; _swimSfx?: boolean; _dancing?: boolean; _pov?: boolean;
  _camFreeT?: number; _camHitRay?: boolean; _camK?: number; _camLift?: number; _lmF?: number; _lm?: { x: number, z: number };
  _houseFront?: { x: number, z: number, rot: number, d: number }; indoors?: unknown; ferry?: unknown;
  carry?: (dt: number, t: number, pad: HeroPad) => CarryResult | void; carryVehicle?: RideVehicle;
}
export class Hero {
  constructor(index, profile, scene, world) {
    this.i = index; this.profile = profile; this.scene = scene; this.world = world;
    this.pos = new THREE.Vector3(); this.vy = 0; this.yaw = 0;
    this.camYaw = Math.PI; this.camPitch = .3; this.camDist = 5.8; this.camPos = new THREE.Vector3();
    this.cam = new THREE.PerspectiveCamera(55, 1, .3, 1200);
    this.state = 'idle'; this.speed = 0; this.onGround = true;
    this.stamina = profile.staminaMax; this.exhausted = false; this.bonusStamina = 0;
    this.hearts = profile.hearts; this.lastSafe = new THREE.Vector3(); this.fallStart = null; this.towerClimb = null; this.riding = null;
    this.safeTimer = 0; this.stepTimer = 0; this.emoteT = 0; this.manualCamT = 0; this.cheerT = 0;
    this.buildModel();
  }
  buildModel() {
    if (this.av) this.scene.remove(this.av.root);
    this.av = buildAvatar(this.profile.look, this.profile.photo); this.av.root.userData.own = true; // (Round V) a child's own character, never a villager (js/villagertalk.js)
    this.scene.add(this.av.root);
  }
  place(x, z, y?: number) {
    // ground, bridge or deck, but not a tower top (those are reached by climbing)
    let g = this.world.groundAt(x, z); if (y == null && g - heightAt(x, z) > 12) g = this.world.groundAt(x, z, heightAt(x, z) + 10);
    this.pos.set(x, y != null ? y : g, z); this.vy = 0; this.lastSafe.copy(this.pos);
    this.camPos.set(x + Math.sin(this.camYaw) * this.camDist, this.pos.y + 4, z + Math.cos(this.camYaw) * this.camDist); this.camLook = null;
  }
  get staminaMax() { return this.profile.staminaMax + this.bonusStamina; }
  useStamina(a) {
    if (this.bonusStamina > 0 && this.stamina > this.profile.staminaMax) { this.stamina -= a; this.bonusStamina = Math.max(0, this.stamina - this.profile.staminaMax); return; }
    this.stamina = Math.max(0, this.stamina - a); if (this.stamina <= 0) { this.exhausted = true; }
  }

  update(dt, pad, t, game) {
    const W = this.world, p = this.pos;
    // camera control
    // Easy camera (default): a high view that gently turns to look the way the child walks. Drag does nothing.
    // Explorer camera: drag to look around, as in big open-world games.
    const easy = game.settings.camMode !== 'free';
    if (easy) { pad.cdx = 0; pad.cdy = 0; }
    if (pad.cdx || pad.cdy) this.manualCamT = 2.5;
    this.camYaw -= pad.cdx * .006 * (game.settings.camSpeed || 1); this.camPitch = clamp(this.camPitch + pad.cdy * .004, -.1, 1.1);
    pad.cdx = 0; pad.cdy = 0;
    this.manualCamT -= dt;

    if (this.towerClimb) return this.updateTowerClimb(dt, t, game);
    // something else is moving the explorer: a pet towing them to shore, or the ferry
    if (this.carry) {
      const c = this.carry(dt, t, pad);
      this.carryVehicle = c && c.vehicle;
      if (c) {
        this.pos.set(c.x, c.y, c.z); if (c.yaw != null) this.yaw = c.yaw;
        this.vy = 0; this.onGround = !c.swim && c.state !== 'swim'; this.gliding = false; this.fallStart = null; this.goal = null;
        if (c.rest) { this.stamina = Math.min(this.staminaMax, this.stamina + dt * .45); if (this.stamina >= this.profile.staminaMax * .999) this.exhausted = false; }
        this.state = c.state || 'idle'; this.speed = c.speed || 0; this.finish(dt, t, game, c.rideY || 0); return;
      }
    }

    // The stick steers relative to the camera as it was when the child started pushing, so the Easy
    // camera swinging round behind them never bends their path into circles.
    const held = Math.abs(pad.mx) + Math.abs(pad.mz) > .05;
    if (!held || this.steerYaw === undefined || !easy) this.steerYaw = this.camYaw;
    const sy = easy ? this.steerYaw : this.camYaw;
    const f = [-Math.sin(sy), -Math.cos(sy)], r = [Math.cos(sy), -Math.sin(sy)];
    let mx = f[0] * pad.mz + r[0] * pad.mx, mz = f[1] * pad.mz + r[1] * pad.mx;
    // tap-to-walk: head for the tapped spot when the stick is not being used
    if (pad.mx || pad.mz) this.goal = null;
    else if (this.goal) {
      const gx = this.goal.x - this.pos.x, gz = this.goal.z - this.pos.z, gd = Math.hypot(gx, gz);
      if (gd < .7 || (this.goalT = (this.goalT || 0) + dt) > 25) { this.goal = null; this.goalT = 0; }
      else { mx = gx / gd; mz = gz / gd; if (gd < 2) { mx *= gd / 2 + .2; mz *= gd / 2 + .2; } }
    }
    const len = Math.hypot(mx, mz), mag = Math.min(1, len); if (len > .01) { mx /= len; mz /= len; }
    const ground = W.groundAt(p.x, p.z, p.y + .5);
    const swimming = ground < WATER - .9 && p.y <= WATER - .5;
    const jump = pad.jump();

    // riding the water buffalo
    if (this.riding) {
      if (jump || pad.act()) { this.dismount(); }
      else {
        const b0 = this.riding, sp = (b0.speed || RIDE) * mag; this.speed = lerp(this.speed, sp, Math.min(1, dt * 4));
        if (mag > .05) this.yaw = angleLerp(this.yaw, Math.atan2(mx, mz), Math.min(1, dt * 6));
        const nx = p.x + Math.sin(this.yaw) * this.speed * dt, nz = p.z + Math.cos(this.yaw) * this.speed * dt;
        // (#354, owner 17 Oct AEDT: "all animals and vehicles can travel anywhere") the real ground under the next step, as
        // walking uses it: a bridge's deck, a pier or a platform counts, not the river bed below it; deep water still stops
        const g = W.groundAt(nx, nz, p.y + .5);
        if (g > WATER - .4 && Math.abs(g - ground) < 1.5) { p.x = nx; p.z = nz; }
        // (#354) a ride takes 0.8 m each side, about a bicycle's or a buffalo's width: wide enough not to brush through
        // walls, narrow enough for every bridge a child walks over (Chùa Cầu's covered bridge is 3.2 m wide; 1.2 m did not fit)
        W.collide(p, .8); p.y = W.groundAt(p.x, p.z, p.y + .5);
        const b = this.riding; b.mesh.position.set(p.x, p.y, p.z); b.mesh.rotation.y = this.yaw; b.shadow.position.set(p.x, p.y + .05, p.z);
        // (round R) a bicycle: its wheels roll, and the child sits on its saddle with hands on the grips and feet on the pedals
        if (b.vehicle) { const v = b.vehicle; v.wheels.forEach(w => { w.rotation.x += this.speed * dt / v.wr; }); this.state = 'ride'; this.finish(dt, t, game, 0);
          this.av.rig.position.y = 0; b.mesh.updateMatrixWorld(true); seatRider(this.av, v, v.seat, v.grips, v.feet, this.av.root.scale.x, false); return; }
        this.state = 'ride'; this.finish(dt, t, game, 1.6); return;
      }
    }

    let speed = 0, want = 'idle';
    if (swimming) {
      this.onGround = false; this.gliding = false; this.fallStart = null;
      speed = SWIM * mag; if (mag > .05) this.useStamina(dt * .06);
      p.y = lerp(p.y, WATER - .55, Math.min(1, dt * 5)); this.vy = 0; want = 'swim';
      if (this.stamina <= 0) { game.rescue(this); return; }
      if (!this._swimSfx) { SFX.splash(); this._swimSfx = true; }
    } else {
      this._swimSfx = false;
      // jumping and gliding
      if (jump) {
        if (this.onGround) { this.vy = 8.5; this.onGround = false; SFX.jump(); }
        else if (this.gliding) this.gliding = false;
        else if (this.profile.glider && !this.exhausted && this.stamina > 0) { this.gliding = true; SFX.glide(); game.onGlide(this); }
      }
      if (this.gliding && (this.exhausted || this.stamina <= 0)) this.gliding = false;
      const running = (pad.run || this.autoRun) && !this.exhausted && this.onGround && mag > .3; // (autoRun: the auto play check's Quick speed, like a child holding Run)
      speed = (running ? RUN : WALK) * mag;
      if (running) this.useStamina(dt * .22);
      if (this.gliding) { speed = GLIDE; this.vy = Math.max(this.vy - GRAV * dt, -2.2); this.useStamina(dt * .1); want = 'glide'; if (mag < .05) { mx = Math.sin(this.yaw); mz = Math.cos(this.yaw); } }
      else this.vy -= GRAV * dt;
      if (!this.onGround && !this.gliding) want = 'air'; else if (speed > .3) want = 'walk';
    }
    if (mag > .05 && !this.gliding) this.yaw = angleLerp(this.yaw, Math.atan2(mx, mz), Math.min(1, dt * 12));
    if (this.gliding) this.yaw = angleLerp(this.yaw, Math.atan2(mx, mz), Math.min(1, dt * 3));

    // horizontal move with slope climbing
    let nx = p.x + mx * speed * dt, nz = p.z + mz * speed * dt;
    if (speed > 0) {
      const gN = W.groundAt(nx, nz, p.y + .5), run = Math.hypot(nx - p.x, nz - p.z), rise = gN - ground;
      if (this.onGround && !swimming && rise / Math.max(run, 1e-4) > 1.1) {
        // too steep to walk: climb it with stamina, like scaling a cliff
        if (this.stamina > 0 && !this.exhausted) {
          const k = Math.min(1, CLIMB / speed); nx = p.x + (nx - p.x) * k; nz = p.z + (nz - p.z) * k;
          this.useStamina(dt * .16); want = 'climb'; this.climbing = true;
        } else { nx = p.x; nz = p.z; want = 'idle'; game.hint(this, 'tired'); }
      } else this.climbing = false;
    } else this.climbing = false;
    p.x = nx; p.z = nz; W.collide(p, .45);
    p.y += this.vy * dt;
    const g = W.groundAt(p.x, p.z, p.y + .5);
    if (!swimming) {
      if (p.y <= g + .02 || (this.onGround && this.vy <= 0 && p.y - g < .6)) {
        if (!this.onGround) this.land(game);
        p.y = g; this.vy = 0; this.onGround = true; this.gliding = false;
      } else if (this.onGround && p.y > g + .6) { this.onGround = false; this.fallStart = p.y; }
      if (!this.onGround && this.fallStart == null) this.fallStart = p.y;
      if (this.gliding) this.fallStart = p.y;
    }
    // recover stamina when resting on the ground
    const resting = (this.onGround && !(pad.run && mag > .3) && !this.climbing) || this.riding;
    if (resting && !swimming) { this.stamina = Math.min(this.staminaMax, this.stamina + dt * (this.exhausted ? .3 : .45)); if (this.stamina >= this.profile.staminaMax * .999) this.exhausted = false; }
    // remember a safe place to come back to
    this.safeTimer -= dt;
    if (this.onGround && !swimming && g > WATER + .5 && this.safeTimer <= 0) { this.lastSafe.copy(p); this.safeTimer = 1; }
    if (want === 'walk' && this.onGround) { this.stepTimer -= dt * speed; if (this.stepTimer <= 0) { SFX.step(surfaceAt(p.x, p.z, p.y)); this.stepTimer = 2.2; game.stats(this, speed); } }

    this.speed = speed; this.state = this.cheerT > 0 ? 'cheer' : this.emoteT > 0 && want === 'idle' ? 'wave' : want === 'idle' && this._dancing ? 'dance' : want;
    this.cheerT -= dt; this.emoteT -= dt;
    this.finish(dt, t, game, 0);
  }

  land(game) {
    const fell = this.fallStart != null ? this.fallStart - this.pos.y : 0;
    this.fallStart = null;
    if (fell > 14 && !this.gliding) game.hurt(this, fell > 30 ? 2 : 1);
  }
  mount(b) { this.riding = b; b.rider = this; this.gliding = false; this.pos.copy(b.mesh.position); this.yaw = b.yaw; if (!b.quiet) SFX.moo(); }
  dismount() { const b = this.riding; if (!b) return; b.rider = null; b.tx = b.mesh.position.x; b.tz = b.mesh.position.z; if (b.home) { b.tx = b.home[0]; b.tz = b.home[1]; b.back = true; }   // (Round V, owner 13 Oct) an animal runs back home when the child gets off
    if (b.slot) b.slot.taken = null; if (b.vehicle) this.av.torso.rotation.set(0, 0, 0), this.av.torso.position.set(0, 0, 0), this.av.head.position.set(0, 1.33, 0), this.av.armL.scale.y = this.av.armR.scale.y = 1; this.riding = null; this.pos.x += Math.cos(this.yaw) * 1.8; this.pos.z -= Math.sin(this.yaw) * 1.8; this.pos.y = this.world.groundAt(this.pos.x, this.pos.z); }

  startTowerClimb(tw) {
    const m = this.world.towerMeshes[tw.id];
    const dx = this.pos.x - tw.x, dz = this.pos.z - tw.z, d = Math.hypot(dx, dz) || 1;
    this.towerClimb = { tw, top: m.y + 26 + .6, ax: tw.x + dx / d * 3.7, az: tw.z + dz / d * 3.7 };
    this.pos.x = this.towerClimb.ax; this.pos.z = this.towerClimb.az; this.yaw = Math.atan2(-dx, -dz); this.gliding = false;
  }
  updateTowerClimb(dt, t, game) {
    const c = this.towerClimb, p = this.pos;
    p.y += dt * 7;
    if (p.y >= c.top) {
      p.set(c.tw.x + (c.ax - c.tw.x) * .4, c.top, c.tw.z + (c.az - c.tw.z) * .4); this.towerClimb = null; this.onGround = true; this.vy = 0; this.fallStart = null;
      game.onTowerTop(this, c.tw);
    }
    this.state = 'climb'; this.speed = 2; this.finish(dt, t, game, 0);
  }

  finish(dt, t, game, rideY) {
    const A = this.av, p = this.pos;
    A.root.position.set(p.x, p.y + rideY, p.z); A.root.rotation.y = this.yaw;
    A.anim(this.state, t, this.speed);
    A.root.children[1].visible = this.state !== 'swim'; // blob shadow
    // camera: follow behind, gently swinging round when the child is just walking forward
    const easy = game.settings.camMode !== 'free';
    // Easy camera: high and a little further back, and it slowly swings round behind the way the child
    // is walking, so what's ahead is always on screen (it used to stay fixed facing north, which hid
    // everything when walking towards the camera). It waits a moment so small turns don't spin it.
    // (tester's notes, 12 Oct) inside a house: the camera stays inside the room, close and looking down, and does not
    // swing round, so the child does not keep walking into the walls or out of the door
    if (easy && this.indoors) { this.easyT = 0; this.camPitch += (.95 - this.camPitch) * Math.min(1, dt * 2); }
    else if (easy) {
      if (this.speed > .8 && !this.towerClimb && this.manualCamT <= 0) { this.easyT = (this.easyT || 0) + dt; this.stillT = 0; // calmer: only after walking the same way for a moment, slowly, and it stops once roughly behind
        const off = Math.abs(Math.atan2(Math.sin(this.yaw + Math.PI - this.camYaw), Math.cos(this.yaw + Math.PI - this.camYaw)));
        if (this.easyT > 1.5 && off > .35) this.camYaw = easeYaw(this.camYaw, this.yaw + Math.PI, dt, .5, .45); }
      else { this.easyT = 0; this.stillT = (this.stillT || 0) + dt; }
      // standing still in front of a house: turn round to see its front (door, windows, shop sign). A house right
      // in front wins over a landmark further away; the choice is checked again if the child is moved (Go, travel).
      const facing = hs => { const fx = Math.sin(hs.rot), fz = Math.cos(hs.rot), vx = p.x - hs.x, vz = p.z - hs.z, ahead = vx * fx + vz * fz, side = Math.abs(vx * fz - vz * fx); return ahead > hs.d * .4 && ahead < hs.d * .5 + 7 && side < hs.d * .5 + 1.5; };
      // (Round V, owner 13 Oct: "next to a building the camera is very slow to turn to the angle I can see") it starts after
      // 0.8 s standing still (was 2 s) and turns about three times faster, still easing in and out
      const calm = this.stillT > .8 && this.manualCamT <= 0 && !this.towerClimb;
      if (!calm) this._houseFront = null;
      else if (!this._houseFront || !facing(this._houseFront)) this._houseFront = (this.world.houses || []).filter(facing).sort((a, b) => Math.hypot(p.x - a.x, p.z - a.z) - Math.hypot(p.x - b.x, p.z - b.z))[0] || null;
      if (calm && this._houseFront) this.camYaw = easeYaw(this.camYaw, this._houseFront.rot, dt, 2, 1.3);
      // standing still next to a landmark: slowly turn so it is in front of the camera
      else if (this._lm && (this._lmF || 0) > .25 && Math.hypot(p.x - this._lm.x, p.z - this._lm.z) > 2 && this.stillT > 2 && this.manualCamT <= 0 && !this.towerClimb) this.camYaw = easeYaw(this.camYaw, Math.atan2(p.x - this._lm.x, p.z - this._lm.z), dt, .6, .35);
      // near a landmark, step back and look more level so the whole building fits on screen
      const lf = this._lmF = lerp(this._lmF || 0, game.landmarkFrame ? game.landmarkFrame(this) : 0, Math.min(1, dt * 1.5));
      // camera views (🎥 button): behind (normal), high up, at street level, or the child's face
      const view = this.view || 'follow', base = view === 'high' ? 1.05 : view === 'street' ? .12 : .55;
      this.camPitch += ((this.towerClimb ? .25 : game.lookUpT > 0 ? .1 : base - lf * .12 + Math.max(0, (this.zoom || 1) - 1) * .45) - this.camPitch) * Math.min(1, dt * 1.5);
    }
    else if (this.manualCamT <= 0 && this.speed > 1 && !this.towerClimb) this.camYaw = easeYaw(this.camYaw, this.yaw + Math.PI, dt, .4, .4);
    // wardrobe close-up, or the "face" camera view while the child stands still
    const close = game.closeUp === this.i || (this.view === 'face' && this.speed < .6 && !this.towerClimb && !this.gliding);
    if (close) { this.camYaw = angleLerp(this.camYaw, this.yaw, Math.min(1, dt * 4)); this.camPitch += (.08 - this.camPitch) * Math.min(1, dt * 4); }
    const vk = this.view === 'high' ? 1.6 : this.view === 'street' ? .62 : 1;
    const dist = close ? 2.8 : this.indoors ? 5.5 * (this.zoom || 1) : (easy ? 11.5 * (1 + (this._lmF || 0) * .55) : this.camDist) * vk * (this.gliding ? 1.25 : this.riding ? 1.15 : 1) * (this.zoom || 1) * (game.zoom || 1);
    const target = new THREE.Vector3(p.x, p.y + (close ? (this.view === 'face' && game.closeUp !== this.i ? 1.05 : .2) : this.view === 'street' ? 1.6 : 1.15) + rideY, p.z);
    const want = new THREE.Vector3(p.x + Math.sin(this.camYaw) * Math.cos(this.camPitch) * dist, target.y + Math.sin(this.camPitch) * dist, p.z + Math.cos(this.camYaw) * Math.cos(this.camPitch) * dist);
    // keep the camera out of houses: if a wall is between the child and the camera, move the camera in
    // front of it. Worked out as one "how much of the distance is free" number (k), then smoothed: the camera
    // comes in quickly when something is in the way but goes back out slowly and only after a short pause,
    // so walking past houses and trees no longer makes it jump in and out.
    // rise a little over whatever was in the way (decided last frame), before checking for walls, so the lift never pokes into a roof
    if (!close && this._camLift) want.y += this._camLift * 2.2;
    let k = 1, lift = 0;
    // (round R) a hillside behind the child: come in closer along the line to the child (smoothly, below) instead of
    // shooting up over the hill, which swung the whole picture up and down
    if (!close && !this.ferry) for (let tt = 1; tt >= .3; tt -= .1) { const x = target.x + (want.x - target.x) * tt, z = target.z + (want.z - target.z) * tt, y = target.y + (want.y - target.y) * tt;
      if (this.world.groundAt(x, z) + .7 > y) k = Math.max(.3, tt - .12); }
    // (bug #33) houses, stalls, trees and other solid things between the child and the camera no longer pull the camera in:
    // they fade to see-through instead (js/seethrough.js), and the camera stays where it is
    if (!close && game.seeThrough) { game.seeThrough.mark(target, want); game.seeThrough.markNearStall(target, want); }
    if (close) { this._camK = 1; this._camLift = 0; this._camFreeT = 0; }
    else {
      const ck = this._camK == null ? k : this._camK;
      if (k < ck - .01) { this._camK = ck + (k - ck) * Math.min(1, dt * 4); this._camFreeT = 0; }
      else { this._camFreeT = (this._camFreeT || 0) + dt; this._camK = this._camFreeT > .6 ? ck + (k - ck) * Math.min(1, dt * 1.1) : ck; }
      this._camLift = (this._camLift || 0) + (lift - (this._camLift || 0)) * Math.min(1, dt * (lift ? 2.5 : .8));
      const kk = this._camK;
      if (kk < .999) { want.x = target.x + (want.x - target.x) * kk; want.z = target.z + (want.z - target.z) * kk; want.y = target.y + (want.y - target.y) * (this._camHitRay ? kk : Math.max(kk, .55)); }
    }
    // on a boat the camera stays under a bridge's deck (it used to jump on top of the deck: nothing to see)
    let gy;
    if (this.ferry) { gy = Math.max(WATER, heightAt(want.x, want.z)) + .7; for (const pl of this.world.platforms) if (pl.y > target.y + 1.5 && want.x > pl.x0 - 1 && want.x < pl.x1 + 1 && want.z > pl.z0 - 1 && want.z < pl.z1 + 1) want.y = Math.min(want.y, pl.y - .8); }
    else gy = this.world.groundAt(want.x, want.z) + .7;
    if (want.y < gy) want.y = gy;
    // (Round V, owner 13 Oct: "the camera angle should be point of view") riding an animal or a vehicle, or sitting in a bus,
    // tram, taxi or xích lô: the camera rides at the child's eyes, looking ahead (the grown-ups' switch ridePov turns it off)
    const pov = !close && (!this.view || this.view === 'follow') && (this.riding || (this.carry && this.state === 'sit')) && game.settings.ridePov !== false;
    // In first person zoom changes the lens, not an eye position that must stay in the seat.
    const z = clamp((this.zoom || 1) * (game.zoom || 1), .35, 2.2);
    const field = pov ? (z <= 1 ? 35 + (z - .35) / .65 * 20 : 55 + (z - 1) / 1.2 * 30) : 55;
    const fov = this.cam.fov + (field - this.cam.fov) * (1 - Math.exp(-dt * 6));
    if (Math.abs(fov - this.cam.fov) > .001) { this.cam.fov = fov; this.cam.updateProjectionMatrix(); }
    if (pov) {
      const fx = Math.sin(this.yaw), fz = Math.cos(this.yaw), sc = this.av.root.scale.x || 1, ey = p.y + (rideY || 0) + 1.45 * sc;
      const vehicle = this.riding && this.riding.vehicle;
      let eye = new THREE.Vector3(p.x + fx * .4, ey, p.z + fz * .4);
      if (vehicle && vehicle.seat) eye = vehicleEye(vehicle, sc);
      const passenger = this.carry && this.carryVehicle;
      if (passenger && passenger.cabin && passenger.seat) eye = vehicleEye(passenger, sc, true);
      const look = new THREE.Vector3(eye.x + fx * 12, eye.y - .9, eye.z + fz * 12);
      this.camPos.lerp(eye, 1 - Math.exp(-dt * 8)); if (!this.camLook) this.camLook = look.clone(); this.camLook.lerp(look, 1 - Math.exp(-dt * 6));
      this.camYaw = this.yaw + Math.PI; this._pov = true;
      this.cam.position.copy(this.camPos); this.cam.lookAt(this.camLook); return;
    }
    if (this._pov) { this._pov = false; this.camLook = null; }   // (back behind the child after getting off)
    // the camera glides (the same smoothness at any frame rate), and the point it looks at glides too, more slowly up and
    // down, so jumps, steps, slopes and bumps never jerk the picture
    this.camPos.lerp(want, 1 - Math.exp(-dt * 3.5));
    if (!this.camLook) this.camLook = target.clone();
    const kxz = 1 - Math.exp(-dt * 6), ky = 1 - Math.exp(-dt * (this.onGround || this.riding || close ? 2.5 : .8));
    this.camLook.x += (target.x - this.camLook.x) * kxz; this.camLook.z += (target.z - this.camLook.z) * kxz; this.camLook.y += (target.y - this.camLook.y) * ky;
    if (this.camLook.distanceTo(target) > 12) this.camLook.copy(target);   // (moved far away at once: Go, travel)
    this.cam.position.copy(this.camPos); this.cam.lookAt(this.camLook);
  }
}
