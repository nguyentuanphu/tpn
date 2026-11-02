// (v1.07 split, pure move from js/main.ts) talking: quick phrases, speech bubbles, voice calls, the hello a child sends
// to friends. js/main.ts calls installTalking where this part stood; a friend's ride (made a moment later) and whether a
// child is playing are read through small arrows.
import { THREE, P } from '../gfx.js';
import { settings, saveSettings } from '../state.js';
import { T } from '../i18n.js';
import { say, hush } from '../voice.js';
import { SFX, Music } from '../audio.js';
import { $ } from '../util.js';
import { buildAvatar, avatarURL } from '../avatar.js';
import { EMOTES } from '../hud.js';
import { Net } from '../net.js';
import { dialog, toast, modal } from '../ui.js';
import { gameOpen } from '../games/frame.js';
import type { SvMain } from '../main.js';

export function installTalking(G: SvMain, D: { scene: SvMain['scene'], isPlaying: () => boolean, nameTag: (name: string, color?: string) => any, friendRide: (P: any, s: any) => any }) {
  const { scene, isPlaying, nameTag, friendRide } = D;
function bubble(target, text) {
  const c = document.createElement('canvas'); c.width = 512; c.height = 128; const x = c.getContext('2d');
  x.font = 'bold 44px Fredoka, "Baloo 2", sans-serif'; const w = Math.min(500, x.measureText(text).width + 50);
  x.fillStyle = '#fff'; x.strokeStyle = '#2a3a40'; x.lineWidth = 6; x.beginPath(); x.roundRect((512 - w) / 2, 6, w, 92, 40); x.fill(); x.stroke();
  x.beginPath(); x.moveTo(236, 96); x.lineTo(256, 124); x.lineTo(276, 96); x.fill();
  x.fillStyle = '#2a3a40'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(text, 256, 54);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, transparent: true, depthTest: false })); s.scale.set(3.2, .8, 1); s.renderOrder = 6;
  scene.add(s); G.bubbles.push({ s, target, until: performance.now() + 3500 });
}
G.emote = (i, id) => {
  const e = EMOTES.find(e => e.id === id), h = G.heroes[i]; if (!e || !h) return;
  bubble(h, e.icon + ' ' + T(e.en, e.vi)); h.emoteT = 2;
  say(e.en, e.vi); // (names can't be recorded: the recorded words only)
  Net.send({ t: 'emote', id });
};
// Kid-sized mute buttons: 🎵 turns music on/off, 🔊 turns sound effects and the talking voice on/off together.
G.toggleAudio = kind => {
  if (kind === 'music') { settings.music = !settings.music; if (settings.music) Music.refresh(); else Music.stop(); }
  else { const on = !(settings.sound || settings.voice); settings.sound = on; settings.voice = on; if (!on) hush(); }
  saveSettings(); SFX.tap(); G.huds.forEach(h => h.refreshAudio());
};
// (Round U) one switch at a time: music, sound effects or the talking voice (the Sound switches: js/soundsheet.js)
G.setAudio = (kind, on) => {
  settings[kind] = !!on;
  if (kind === 'music') { if (on) Music.refresh(); else Music.stop(); }
  if (kind === 'voice' && !on) hush();
  saveSettings(); G.huds.forEach(h => h.refreshAudio());
};
G.openSound = anchor => import('../soundsheet.js').then(m => m.openSoundSheet(G, anchor));
// (r63) the first tap asks for the microphone and turns it on; then each tap turns it off or on again
G.toggleMute = async () => { if (!Net.micLive) { Net.resumeAudio(); await Net.getMic(true); } else { Net.setMuted(!Net.muted); Net.resumeAudio(); } G.huds.forEach(hd => hd.setCall(Net.connected, false, Net.muted || !Net.micLive)); };
// Keyboard shortcuts on computers (shown as little key badges on the buttons). Player 1's screen.
addEventListener('keydown', e => {
  if (!isPlaying() || e.repeat || e.ctrlKey || e.metaKey || e.altKey || /INPUT|TEXTAREA|SELECT/.test((e.target instanceof Element && e.target.tagName) || '')) return;
  const k = e.code === 'KeyG' || e.key === 'g' || e.key === 'G' ? 'KeyG' : e.code;
  // Escape closes the top pop-up, chat or game card
  if (k === 'Escape') {
    // A nested dialog with its own Escape handler must never close the parent behind it.
    const modal = e.target instanceof Element ? e.target.closest('.modal') : null;
    const x = modal ? modal.querySelector<HTMLElement>('.x') : [...document.querySelectorAll<HTMLElement>('.modal:not(.out) .x, .vc-pop .vc-x, .chatwin .x, .dlg-close')].pop();
    if (x) { x.click(); e.preventDefault(); }
    return;
  }
  if (G.paused || gameOpen() || document.querySelector<HTMLElement>('.modal, .storybook, .vc-pop')) return;
  const two = G.heroes.length > 1, i = 0;
  const map = { KeyG: () => G.openGamesHub(i), KeyM: () => G.openPad(i, 'map'), KeyB: () => G.openPad(i, 'bag'), KeyK: () => G.voiceCommand(i),
    KeyT: () => G.huds[i].toggleEmotes(), KeyC: () => Net.connected && G.toggleMute(), KeyN: () => G.toggleAudio('music'), KeyO: () => G.toggleAudio('sound'),
    KeyF: () => G.goToObjective(i), KeyP: () => G.openPad(i, 'friend'), KeyV: () => G.cycleView(i), KeyY: () => G.openWhere(i),
    Equal: () => G.zoomBy(i, .8), NumpadAdd: () => G.zoomBy(i, .8), Minus: () => G.zoomBy(i, 1.25), NumpadSubtract: () => G.zoomBy(i, 1.25) };
  if (two && ['KeyK', 'KeyT'].includes(k)) return;
  const f = map[k]; if (f) { e.preventDefault(); e.stopImmediatePropagation(); f(); }
}, true);
// the photo friends see: a 160 px copy of the child's photo. The picture has to finish loading before it can
// be copied (copying straight away gave friends a black square), so the first hello may go without it and a
// second hello follows as soon as it is ready.
const helloPhotos = new Map();
function helloPhoto(src) {
  if (!src) return null;
  if (helloPhotos.has(src)) return helloPhotos.get(src);
  helloPhotos.set(src, null);
  const im = new Image();
  im.onload = () => { try { const c = document.createElement('canvas'); c.width = c.height = 160; c.getContext('2d').drawImage(im, 0, 0, 160, 160); helloPhotos.set(src, c.toDataURL('image/jpeg', .7));
    // send it again once the room is open (it may still be opening)
    const resend = (n = 0) => { if (!G.heroes[0] || G.heroes[0].profile.photo !== src) return; if (Net.role) sendHello(); else if (n < 90) setTimeout(() => resend(n + 1), 1000); }; resend(); } catch (e) { } };
  im.src = src;
  return null;
}
function sendHello() {
  const h = G.heroes[0]; if (!h) return;
  const photo = helloPhoto(h.profile.photo);
  const friend = settings.friendsOn ? settings.friendCode : null;
  Net.send({ t: 'hello', name: h.profile.name, look: h.profile.look, photo, friend });
  return { name: h.profile.name, look: h.profile.look, photo, friend };
}
G.sendHello = sendHello;
// Friends in the same room: one avatar and name tag each.
G.partners = {};
Object.defineProperty(G, 'partner', { get: () => Object.values(G.partners)[0] || null }); // older code: the first friend
Net.on('hello', r => {
  G.netGames?.rejoined(r.id);
  const old = G.partners[r.id]; if (old) { friendRide(old, {}); scene.remove(old.av.root); scene.remove(old.tag); }
  const av = buildAvatar(Object.assign({ style: 'shirt', color: '#3d7fd6', hat: 'none', back: 'none', hair: '#1d1412', hairStyle: 'short', skin: '#f6c7a5', glider: 0 }, r.look || {}), r.photo);
  scene.add(av.root); const tag = nameTag((r.name || T('Friend', 'Bạn')) + (r.look && r.look.star ? ' ★' : ''), '#9ff0ff'); // (a week's star tester: ★) scene.add(tag);
  av.root.userData.own = true; // (Round V) a friend online, never a villager
  G.partners[r.id] = { id: r.id, av, tag, pos: old ? old.pos : new THREE.Vector3(0, -50, 0), yaw: 0, st: 'idle', name: r.name, look: r.look || {}, photoURL: avatarURL({ photo: r.photo, look: Object.assign({ hair: '#1d1412', skin: '#f6c7a5' }, r.look) }) };
  if (!old) { SFX.chime(); say('Your friend is here! Say hello!', 'Bạn của con đã đến! Chào bạn đi!'); toast(T(`${r.name} is here!`, `${r.name} đã đến!`)); }
  G.huds.forEach(hd => hd.setCall(true, false, Net.muted || !Net.micLive));
  if (G.onNet) G.onNet();
});
Net.on('emote', d => { const e = EMOTES.find(e => e.id === d.id), P = G.partners[d.from]; if (!e || !P) return; bubble(P, e.icon + ' ' + T(e.en, e.vi)); say(e.en, e.vi); });
  return { helloPhoto, sendHello, bubble };
}
