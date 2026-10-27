// Playing together from several devices: one device starts a room (a 6-digit code) and up to 5
// friends join it, peer-to-peer through the free PeerJS service. The room's starter passes messages
// between everyone, and everyone hears everyone through a live voice call.
// Friends: each device can have a friend code. If the grown-ups switch "friends can invite me" on, the
// game listens on that code while it is open, so a friend who is hosting a room can send an invite.
// Nothing goes through a server of ours: only names, outfits, positions and the player photos travel.
// When the direct link can't open (different networks, mobile data), the room carries on through the cloud
// relay (relay.js): encrypted messages through free public MQTT brokers. Voice needs the direct link or a
// TURN relay. Everyone pings everyone every 2 s, so the game can show each friend's signal and ping.
// (round R privacy, 9 Oct, owner) Online play is off until a grown-up turns it on (settings.online): until then no
// connection of any kind is made. Two cloud channels per room:
//  · the door (made from the room code): only knocks and the starter's answers. Everyone who guesses the code can
//    read it, so a knock carries a name, a look and a key, never a photo, and every answer from the starter is locked
//    for the one who knocked (their key, ECDH → AES-GCM), so nobody can say "go away" or "come in" in its name;
//  · the members' channel (made from a random 32-byte room secret): everything else. The secret is handed only to
//    those let in, locked for each of them; when someone is removed the starter makes a new one for the others.
// A guest meets only players the starter introduces (directly, or on the members' list it sends locked to them).
// Photos go only after being let in, locked for each player. Saved friends come straight in only if they bring the
// key saved with the friend AND open a number locked with it; anyone else knocks.
import { settings } from './state.js';
import { managementEvidence } from './core/events.js';
import { micMode } from './audio.js';
import { Channel } from './relay.js';
import { checkMsg } from './netmsg.js';
import type { Remote } from '../types/net.js';
import { MAP_VERSION } from './content/map.js';
const PREFIX = 'sparkle-valley-v2-';
export const MAX_ROOM = 6;
// (round R privacy, 9 Oct) room codes have 6 digits (4 were easy to guess)
export const ROOM_LEN = 6;
export const okRoom = c => new RegExp(`^\\d{${ROOM_LEN}}$`).test(String(c || ''));
const newRoomCode = () => String(10 ** (ROOM_LEN - 1) + crypto.getRandomValues(new Uint32Array(1))[0] % (9 * 10 ** (ROOM_LEN - 1)));
let loading = null;
function loadPeer() {
  if (window.Peer) return Promise.resolve();
  if (!loading) loading = new Promise((res, rej) => { const s = document.createElement('script'); s.src = 'vendor/peerjs.min.js'; s.onload = res; s.onerror = rej; document.head.appendChild(s); });
  return loading;
}
// How two devices find each other. STUN servers tell each device its public address, which is enough on
// most home Wi-Fi. When one friend is on mobile data or behind a strict router, the devices also need a
// relay (TURN) server to pass the game along. Free public relays are tried by default; a grown-up can paste
// their own relay in Grown-ups (a link from a free TURN service, or a turn: address with a name and password).
const STUN: RTCIceServer[] = [{ urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'] }, { urls: 'stun:stun.cloudflare.com:3478' }];
// (the old free "Open Relay" TURN service now needs an account, so it is still tried but may not answer;
// the cloud relay below keeps the game working anyway, and a grown-up can add their own TURN for voice)
const PUBLIC_TURN = [{ urls: ['turn:openrelay.metered.ca:80', 'turn:openrelay.metered.ca:443', 'turn:openrelay.metered.ca:443?transport=tcp'], username: 'openrelayproject', credential: 'openrelayproject' }];
let fetched = null;
export async function iceServers() {
  const r = (settings.turnUrl || '').trim();
  if (/^https:\/\//i.test(r)) { // a link that hands out relay details (e.g. Metered's free plan)
    if (!fetched || fetched.url !== r) { try { const res = await fetch(r); const j = await res.json(); fetched = { url: r, list: Array.isArray(j) ? j : j.iceServers || [] }; } catch (e) { fetched = { url: r, list: [] }; } }
    if (fetched.list.length) return STUN.concat(fetched.list);
  } else if (/^turns?:/i.test(r)) return STUN.concat([{ urls: r.split(/[\s,]+/).filter(Boolean), username: settings.turnUser || '', credential: settings.turnPass || '' }]);
  // the family's own relay, set up once on the website (round O: netlify/functions/turn.mjs gives each game details
  // that last a few hours; the key itself never leaves Netlify)
  const own = await siteTurn(); if (own.length) return STUN.concat(own);
  return STUN.concat(PUBLIC_TURN);
}
let siteTurnAt = 0, siteTurnList = [];
async function siteTurn() {
  if (!/^https:$/.test(location.protocol) && !window.SV_TURN_TEST) return [];
  if (Date.now() - siteTurnAt < 30 * 60e3) return siteTurnList;
  try {
    const ctl = new AbortController(), t = setTimeout(() => ctl.abort(), 4000);
    const r = await fetch((window.SV_TURN_TEST || '') + '/api/turn', { signal: ctl.signal }); clearTimeout(t);
    const j = r.ok ? await r.json() : {}; siteTurnList = Array.isArray(j.iceServers) ? j.iceServers.filter(x => x && x.urls) : [];
  } catch (e) { siteTurnList = []; }
  siteTurnAt = Date.now(); return siteTurnList;
}
// PeerJS settings (the free public PeerJS server by default; tests can point it at a local one)
let ICE = STUN.concat(PUBLIC_TURN);
const peerOpts = () => Object.assign({ debug: 0, config: { iceServers: ICE, iceCandidatePoolSize: 2 } }, window.SV_PEER || {});
const prepare = async () => { await loadPeer(); ICE = await iceServers(); };
// (audit, 9 Oct) a photo goes into <img src="…">, so only a plain base64 picture is accepted: no quotes, spaces or
// anything else that could close the attribute and add code
export const okPhoto = p => typeof p === 'string' && p.length < 120000 && /^data:image\/(png|jpeg|webp|gif);base64,[A-Za-z0-9+/]+={0,2}$/.test(p) ? p : null;
// ids and friend codes go into the page, so only plain letters, digits and dashes are accepted
const okId = id => typeof id === 'string' && /^[\w-]{1,64}$/.test(id);
// (round R privacy, 9 Oct) a player's key: a P-256 point, 65 bytes in base64; a room secret: 32 bytes in base64
export const okPub = p => typeof p === 'string' && /^[A-Za-z0-9+/]{87}=$/.test(p);
const okSecret = s => typeof s === 'string' && /^[A-Za-z0-9+/]{43}=$/.test(s);
const okCode = c => typeof c === 'string' && /^[A-Z0-9]{4,8}$/i.test(c);
const okLook = l => l && typeof l === 'object' && !Array.isArray(l) ? Object.fromEntries(Object.entries(l).filter(([k, v]) => /^\w{1,16}$/.test(k) && (typeof v === 'number' ? Number.isFinite(v) : typeof v === 'string' && v.length < 40 && /^[#\w -]*$/.test(v)))) : {};
// (round R privacy, 9 Oct) a hello never carries a photo: the photo goes after admission, locked for each player
const cleanHello = (d, from) => ({ id: from, name: String(d.name || '').slice(0, 20), look: okLook(d.look), photo: null, friend: okCode(d.friend) ? d.friend.toUpperCase() : null, pub: okPub(d.pub) ? d.pub : null, s: null });
// a friend on this device's list (by friend code)
const noPhoto = h => { const o = Object.assign({}, h || {}); delete o.photo; delete o.w; return o; };
const friendEntry = code => (Array.isArray(settings.friends) ? settings.friends : []).find(f => f && f.code === String(code || '').toUpperCase()) || null;
// ---- the private pair keys (ECDH P-256 → AES-GCM) ----
const b64 = buf => btoa(String.fromCharCode(...new Uint8Array(buf))), unb64 = s => Uint8Array.from(atob(s), c => c.charCodeAt(0));
const rnd = n => crypto.getRandomValues(new Uint8Array(n)), hex = b => [...b].map(x => x.toString(16).padStart(2, '0')).join('');
// (round R privacy, 9 Oct) one key pair per device, kept on the device (its own place, not in backups), so a friend who
// saved my key knows it is really me next time. (Before, a new pair was made each time the game opened.)
const ID_KEY = 'sv2_idkey', EC = { name: 'ECDH', namedCurve: 'P-256' };
let keyPair = null;
const myKeys = () => keyPair || (keyPair = (async () => {
  try {
    const j = JSON.parse(localStorage.getItem(ID_KEY) || 'null');
    if (j && j.d && j.x && j.y) return { privateKey: await crypto.subtle.importKey('jwk', j, EC, false, ['deriveKey']), publicKey: await crypto.subtle.importKey('jwk', { kty: 'EC', crv: 'P-256', x: j.x, y: j.y, ext: true }, EC, true, []) };
  } catch (e) { }
  const k = await crypto.subtle.generateKey(EC, true, ['deriveKey']);
  try { localStorage.setItem(ID_KEY, JSON.stringify(await crypto.subtle.exportKey('jwk', k.privateKey))); } catch (e) { }
  return k;
})());
let pubB64 = null;
export async function myPub() { return pubB64 || (pubB64 = b64(await crypto.subtle.exportKey('raw', (await myKeys()).publicKey))); }
const pairKeys = new Map();
async function pairKey(pub) {
  if (pairKeys.size > 64) pairKeys.clear(); // (strangers' keys at the door are not kept for ever)
  if (!pairKeys.has(pub)) pairKeys.set(pub, (async () => { const k = await crypto.subtle.importKey('raw', unb64(pub), EC, false, []); return crypto.subtle.deriveKey({ name: 'ECDH', public: k }, (await myKeys()).privateKey, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']); })());
  return pairKeys.get(pub);
}
// lock words for the holder of one key (only they, or I, can open them); open words locked for me
async function sealFor(pub, obj) { const iv = rnd(12), ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, await pairKey(pub), new TextEncoder().encode(JSON.stringify(obj))); return { iv: b64(iv), ct: b64(ct) }; }
async function openFrom(pub, d) { try { if (!okPub(pub) || typeof d.iv !== 'string' || typeof d.ct !== 'string') return null; const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: unb64(d.iv) }, await pairKey(pub), unb64(d.ct)); const o = JSON.parse(new TextDecoder().decode(pt)); return o && typeof o === 'object' ? o : null; } catch (e) { return null; } }
// a smaller copy of the photo for the other players (about 5 KB)
function smallPhoto(src, size = 128) {
  return new Promise<string | null>(res => { const im = new Image(); im.onload = () => { try { const c = document.createElement('canvas'); c.width = c.height = size; c.getContext('2d').drawImage(im, 0, 0, size, size); res(c.toDataURL('image/jpeg', .72)); } catch (e) { res(null); } }; im.onerror = () => res(null); im.src = src; });
}
// the members' list a guest gets from the starter (each entry checked again here)
const cleanRoster = list => Array.isArray(list) ? list.slice(0, MAX_ROOM).filter(m => m && okId(m.id)).map(m => ({ id: m.id, name: String(m.name || '').slice(0, 20), friend: okCode(m.friend) ? m.friend.toUpperCase() : null, pub: okPub(m.pub) ? m.pub : null, via: m.via === 'cloud' ? 'cloud' : 'direct', at: Number.isFinite(m.at) ? m.at : null, host: m.host === true })) : [];
// the starter's words to one player that must be locked (a guest checks each with the starter's key)
const HOSTONLY = /^(door|admit|chal|full|nope|kick|rekey|members)$/;

export const Net = {
  // (Online, r57, ROUND-T §4) positions travel as raw x, z, so two devices play together only on the same map layout.
  // The knock carries it; every word the starter locks for a knocker carries the starter's; a word or knock without one
  // comes from a game older than r57, which can't be told apart: r56 already has map 'D1', so it plays as before (owner,
  // 11 Oct: "let them in"; a game older still updates itself the next time it opens online). (Tests may change it.)
  mapVersion: MAP_VERSION,
  sameMap(m) { return m == null || m === this.mapVersion; },
  peer: null, conns: new Map(), calls: new Map(), cloud: null, door: null, cloudOn: false, _seen: new Set(), hostId: null, audios: new Map(), mic: null, code: null, role: null, muted: true, me: null, hello: null,
  knocking: false,           // (a newcomer) waiting at the door for the room's starter
  knocks: new Map(),         // (the room's starter) who is at the door: id -> {id, name, look, friend, pub, via, d}
  _chal: new Map(),          // (the room's starter) saved friends proving who they are: id -> {n, h, msg, t}
  _admitted: new Set(),
  members: new Map(),        // (the room's starter) everyone let in: id -> {id, name, friend, pub, via, at, known}
  roster: null,              // (a guest) the members' list the starter sent, locked for me
  secret: null,              // the room secret (the members' channel); hostPub: the starter's key (a guest)
  hostPub: null as string | null,
  // (TypeScript, batch 3) the fields set along the way, declared here so each has a type; they start undefined, as before
  pub: undefined as string | null | undefined,                 // my public key (js/net.ts myPub)
  _since: undefined as number | undefined, _sT: undefined as number | undefined, _heard: undefined as number | undefined,
  _n: undefined as number | undefined,
  _banned: undefined as Set<string> | null | undefined,        // (the room's starter) ids sent away for good
  _photoTo: undefined as Set<string> | null | undefined,       // whom my photo went to (id + their key)
  _asked: undefined as Record<string, number> | null | undefined, // photos asked for: id -> times
  _pending: undefined as any[] | undefined,
  _micAsking: undefined as Promise<any> | null | undefined,
  _lock: undefined as WakeLockSentinel | null | undefined,     // the screen kept on during a call
  _quiet: undefined as MediaStream | undefined,                // a silent stream (iPhone keeps a call's sound going)
  _mt: undefined as ReturnType<typeof setInterval> | null | undefined, _pt: undefined as ReturnType<typeof setInterval> | undefined,
  _askT: undefined as ReturnType<typeof setTimeout> | undefined,
  _pinWeak: undefined as boolean | undefined, _noDirect: undefined as boolean | undefined, _slowTold: undefined as boolean | undefined,
  _managementDirect: undefined as ((outcome:'success'|'timeout'|'rejected'|'failed')=>unknown)|undefined,
  _managementRelay: undefined as ((outcome:'success'|'timeout'|'rejected'|'failed')=>unknown)|undefined,
  _managementStarted: 0,
  _managementFailure(outcome:'timeout'|'rejected'|'failed') { this._managementDirect?.(outcome);this._managementRelay?.(outcome); },
  remotes: {} as Record<string, Remote>, // everyone else in the room: id -> {id, name, look, photo, friend, s:{x,y,z,yaw,st}}
  beacon: null,              // the friend-code listener
  handlers: {},
  on(type, f) { (this.handlers[type] = this.handlers[type] || []).push(f); },
  off(type, f) { const l = this.handlers[type]; if (l) this.handlers[type] = l.filter(x => x !== f); },
  emit(type, d?) { (this.handlers[type] || []).forEach(f => { try { f(d); } catch (e) { console.warn(e); } }); },
  get connected() { return !this.knocking && ([...this.conns.values()].some(c => c.open) || (this.cloudOn && !!this.cloud && Object.keys(this.remotes).length > 0)); },
  get count() { return 1 + Object.keys(this.remotes).length; },
  get remote() { return Object.values(this.remotes)[0] || null; },  // older code: the first friend

  // The microphone (owner's iPhone bug, round F: "no microphone" although the phone has one). iPhones only open the
  // microphone straight after a tap, so a try without one can fail; that says "tap 🎙️ Microphone on" and only a phone
  // with really no microphone hears "no microphone"; a blocked one gets how to allow it. Round O (owner: the Friends
  // screen got stuck and the microphone never came on): it no longer tries again on every tap anywhere on the screen
  // (each try could bring the iPhone's question up again); the child taps the 🎙️ button in Friends or the call button.
  micError: null,
  // Bug #55: on iPhone an earlier try made without a tap can stay pending for ever, and every later tap was handed that
  // same pending answer (nothing happened, no question). A tap (`fromTap`) now drops the old try and starts a fresh one;
  // getUserMedia is called before any await, so it still runs inside the tap. An old try that answers late never opens a
  // second microphone (its stream is stopped) and says nothing while a newer try is still asking. Every outcome of a tap
  // is said on screen (asking, on, blocked with how to allow it, none, iPhone too old), as nobody can test it on a real
  // iPhone but the owner. Home-screen games on iPhone get a microphone only from iOS 14.3.
  // (Round V, owner 13 Oct: "when I tap on mic, nothing appears", with no call anywhere) the iPhone ends the microphone
  // when the game goes to the background (switching apps to send the room code, a call, Siri, the screen locking), but
  // the game kept that dead microphone, so every tap only flipped mute on it and nothing showed. A microphone counts only
  // while its track is live; a dead one is dropped and the tap asks again.
  get micLive() { const t = this.mic && this.mic.active && this.mic.getAudioTracks()[0]; return !!(t && t.readyState === 'live' && !t.muted); },
  _dropMic() { if (!this.mic) return; try { this.mic.getTracks().forEach(t => t.stop()); } catch (e) { } this.mic = null; micMode('call', false); },
  _watchMic(s) {
    const t = s.getAudioTracks()[0]; if (!t) return;
    const dead = () => { if (this.mic !== s) return; this._dropMic(); this.emit('status', { key: 'micstop' }); this.emit('micchange'); };
    t.addEventListener('ended', dead);
  },
  async getMic(fromTap) {
    if (this.mic && (this.micLive || !fromTap)) return this.mic;
    this._dropMic();
    if (this._micAsking && !fromTap) return this._micAsking;
    const md = navigator.mediaDevices, ios = /iP(hone|ad|od)/.test(navigator.userAgent) || (/Macintosh/.test(navigator.userAgent) && navigator.maxTouchPoints > 1);
    const asking = this._micAsking = (async () => {
      if (!md || !md.getUserMedia) { this.micError = 'nomedia'; this.emit('status', { key: ios ? 'micold' : 'nomic' }); return null; }
      const stale = () => this._micAsking && this._micAsking !== asking;   // a newer tap is asking now
      micMode('call', true);   // (Round V) before asking: iPhone never asks in its play-only mode
      let err = null, first = md.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }, video: false });
      if (fromTap) this.emit('status', { key: 'micask' });
      // the iPhone sometimes never answers at all (no Allow box): after 10 seconds say what to do instead of nothing
      const slow = fromTap ? setTimeout(() => { if (!this.mic && this._micAsking === asking) this.emit('status', { key: 'micstuck' }); }, 10000) : null;
      for (const audio of [null, true]) {
        try {
          const s = await (audio ? md.getUserMedia({ audio, video: false }) : first);
          if (this.mic && this.mic !== s) { s.getTracks().forEach(t => t.stop()); return this.mic; }
          clearTimeout(slow); this.mic = s; this._watchMic(s); this.micError = null; if (fromTap) this.muted = false; this._micOn(); return s;   // (r63: a tap asks for it to be on)
        } catch (e) { clearTimeout(slow); err = e; if (this.mic || (e && /^(NotFoundError|NotAllowedError|NotReadableError|AbortError)$/.test(e.name))) break; }   // (Round V: a busy microphone is not asked again without a tap)
      }
      if (this.mic || stale()) return this.mic;   // (another try got it, or is still asking: it speaks for itself)
      micMode('call', false);
      const name = (err && err.name) || 'Error', tapped = !!fromTap || !!(navigator.userActivation && navigator.userActivation.isActive);
      this.micError = name;
      if (name === 'NotFoundError' || name === 'OverconstrainedError') this.emit('status', { key: 'nomic' });
      // (Round V, owner's iPhone notes 13 Oct: on a FaceTime call the microphone never came on) another app or a call is
      // using the microphone: say so, instead of asking the child to tap again and again
      else if (name === 'NotReadableError' || name === 'AbortError') this.emit('status', { key: 'micbusy' });
      else this.emit('status', { key: name === 'NotAllowedError' && tapped ? 'micdenied' : 'mictap' });
      return null;
    })();
    try { return await asking; } finally { if (this._micAsking === asking) this._micAsking = null; }
  },
  // the microphone arrived after the calls started (they carried silence): send it in every open call
  _micOn() {
    const track = this.mic && this.mic.getAudioTracks()[0]; if (!track) return;
    track.enabled = !this.muted && !this.knocking;
    for (const call of this.calls.values()) {
      const pc = call && call.peerConnection; if (!pc || !pc.getSenders) continue;
      const snd = pc.getSenders().find(x => x.track && x.track.kind === 'audio') || pc.getSenders().find(x => !x.track);
      if (snd && snd.track !== track) snd.replaceTrack(track).catch(() => { });
    }
    this.emit('status', { key: 'micon' });
  },
  // (round R privacy, 9 Oct) nothing connects until a grown-up has turned online play on
  _off() { if (settings.online) return false; this.emit('status', { key: 'off' }); return true; },

  async host(hello) {
    if (this._off()) return null;
    // (r63, owner: "the microphone should always be off until the child turns it on"; on iPhone a try without a tap
    // could hang and every later tap did nothing) the microphone is asked for only by a tap on Mic (HUD) or in Friends
    await prepare().catch(() => { }); if (!this.mic) this.emit('status', { key: 'mictap' });
    this.close(true); this.setMuted(true);   // (Round V, owner 13 Oct) the microphone is always off when a room is made or joined: a tap turns it on
    this.role = 'host'; this.hello = await this._withPub(hello); this._since = Date.now();
    this.secret = b64(rnd(32));
    for (let tries = 0; tries < 4 && window.Peer; tries++) {
      this.code = newRoomCode();
      const ok = await new Promise(res => {
        const p = new window.Peer(PREFIX + this.code, peerOpts());
        const t = setTimeout(() => { try { p.destroy(); } catch (e) { } res('down'); }, 9000);   // the meeting service is not answering
        p.on('open', id => { clearTimeout(t); this.peer = p; this.me = id; res(true); });
        p.on('error', err => { clearTimeout(t); if (err.type === 'unavailable-id') { p.destroy(); res(false); } else { this.emit('status', { key: 'error', err }); res(true); } });
      });
      if (ok === true || ok === 'down') break;
    }
    if (!this.code) this.code = newRoomCode();
    if (!this.me) this.me = PREFIX + this.code;   // cloud relay only
    if (this.peer) {
      this.peer.on('connection', c => this._hostConn(c));
      this.peer.on('call', call => { if (!this._admitted.has(call.peer)) { try { call.close(); } catch (e) { } return; } call.answer(this.mic || this._silence()); this._call(call); });
      this.peer.on('disconnected', () => { try { this.peer.reconnect(); } catch (e) { } });
    }
    await Promise.all([this._startDoor(), this._startMembers()]);
    if (!this.peer && !this.door.connected) { this.emit('status', { key: 'error' }); return null; }
    this._startPings(); this._wake(true);
    this.emit('status', { key: 'waiting', code: this.code });
    return this.code;
  },
  // opts.hostPub: the starter's key when it is known beforehand (an invitation or note from a saved friend who starts the
  // room): only answers locked with that key are believed
  async join(code, hello, opts: { hostPub?: string } = {}) {
    if (this._off() || !okRoom(code)) return;
    // (r63, owner: "the microphone should always be off until the child turns it on"; on iPhone a try without a tap
    // could hang and every later tap did nothing) the microphone is asked for only by a tap on Mic (HUD) or in Friends
    await prepare().catch(() => { }); if (!this.mic) this.emit('status', { key: 'mictap' });
    this.close(true); this.setMuted(true);   // (Round V, owner 13 Oct) the microphone is always off when a room is made or joined: a tap turns it on
    hello = await this._withPub(hello);
    this._managementStarted=Date.now(); this._managementDirect=managementEvidence.connection('direct');
    this.role = 'guest'; this.code = code; this.hello = hello; this.hostId = PREFIX + code;
    this.hostPub = okPub(opts.hostPub) ? opts.hostPub : null; this._pinWeak = false;
    this._knock(true); this._heard = 0;
    this.emit('status', { key: 'connecting' });
    // the door on the cloud relay opens at the same time, so there is a second way in from the very start
    const doorReady = this._startDoor();
    let p = null;
    if (window.Peer) {
      p = new window.Peer(peerOpts()); this.peer = p;
      p.on('error', err => { if (err.type === 'peer-unavailable') this._noDirect = true; });
      // calls only from players the starter introduced (the introduction can arrive a moment after the call rings)
      p.on('call', call => { let n = 0; const tryIt = () => { if (this.peer !== p) return; if (this.remotes[call.peer] && !this.knocking) { call.answer(this.mic || this._silence()); this._call(call); } else if (++n > 20) { try { call.close(); } catch (e) { } } else setTimeout(tryIt, 200); }; tryIt(); });
      p.on('disconnected', () => { try { p.reconnect(); } catch (e) { } });
      this.me = await new Promise(res => { const t = setTimeout(() => res(null), 7000); p.on('open', id => { clearTimeout(t); res(id); }); });
    }
    if (!this.me) this.me = 'sv-c-' + hex(rnd(5));
    await doorReady;
    const host = this.hostId;
    if (p && p.open) {
      const c = p.connect(host, { reliable: true }); this.conns.set(host, c);
      c.on('open', () => c.send(Object.assign({ t: 'hello' }, this._knockHello()))); // a knock (no photo): the call starts once we are let in
      c.on('data', d => this._recv(d, host));
      // the direct link broke: carry on through the cloud relay if the room is still there
      c.on('close', () => { this.conns.delete(host); if (this.role !== 'guest') return; if (this.knocking) { this._knockCloud(); return; } this._useCloud(); this._helloCloud(); this.emit('status', { key: 'cloud' }); setTimeout(() => { if (this.role === 'guest' && !this._hostSeen(15000)) { Object.keys(this.remotes).forEach(id => this._gone(id)); this.emit('status', { key: 'left' }); } }, 15000); });
    }
    // after 7 s without a direct link, knock through the cloud relay; explain, and give up with tips after 30 s
    // (knocking: the starter has heard the knock, so keep knocking for up to 2 minutes)
    const t0 = Date.now(); this._slowTold = false; let viaCloud = false;
    const watch = setInterval(() => {
      if (this.role !== 'guest' || this.code !== code) { clearInterval(watch); return; }
      const c = this.conns.get(host), s = (Date.now() - t0) / 1000, tick = Math.floor(s);
      if (this.remotes[host]) { clearInterval(watch); return; }
      // let in, waiting for the starter's welcome on the members' channel: say hello there until it answers
      if (!this.knocking) { if (!(c && c.open) && tick % 2 === 0) this._helloCloud(); if (s > 150) { clearInterval(watch); this._managementFailure('timeout'); this.emit('status', { key: 'stuck' }); this.close(true); } return; }
      if (this._heard) { if (!(c && c.open) && tick % 4 === 0) this._knockCloud(); if (Date.now() - this._heard > 120000) { clearInterval(watch); this._managementFailure('timeout'); this.emit('status', { key: 'noanswer' }); this.close(true); } return; }
      if (c && c.open) return;
      if ((s > 7 || !p || !p.open || (c && c.peerConnection && c.peerConnection.iceConnectionState === 'failed')) && !viaCloud) { viaCloud = true; this._knockCloud(); }
      else if (viaCloud && s > 3 && tick % 4 === 0) this._knockCloud();
      if (s > 12 && !this._slowTold) { this._slowTold = true; this.emit('status', { key: 'slow' }); }
      if (s > 30) { clearInterval(watch); this._managementFailure('timeout'); this.emit('status', { key: this._noDirect && this.door && this.door.connected ? 'nocode' : 'stuck' }); this.close(true); }
    }, 1000);
    this._startPings(); this._wake(true);
  },

  // the room's starter: welcome a new friend, introduce everyone, and pass messages along
  _hostConn(c) {
    c.on('open', () => {
      if (Object.keys(this.remotes).length >= MAX_ROOM - 1 || (this._banned && this._banned.has(c.peer))) { setTimeout(() => c.close(), 300); return; }
      this.conns.set(c.peer, c);   // (a knock until let in: the welcome waits for admit())
      if (this._admitted.has(c.peer)) this._welcome(c.peer);
    });
    c.on('data', raw => {
      if (!raw || typeof raw !== 'object') return;
      raw.from = c.peer;                                  // the host decides who a message is from
      if (this._dup(raw)) return;                         // (a copy that also came through the cloud relay)
      const d = checkMsg(raw, c.peer); if (!d) return;    // checked once, before it is passed on to anyone (netmsg.js)
      if (!this._admitted.has(c.peer)) { this._atDoorMsg(d, c.peer, c.peer); return; } // at the door: only the knock (and a friend's proof)
      if (d.to && d.to !== this.me) { const t = this.conns.get(d.to); if (t && t.open && this._admitted.has(d.to)) t.send(d); return; }
      if (!d.to) for (const [id, o] of this.conns) if (id !== c.peer && o.open && this._admitted.has(id)) o.send(d);
      this._recv(d, c.peer, true);
    });
    c.on('close', () => { this.conns.delete(c.peer); this._goneKnock(c.peer); this._gone(c.peer); for (const o of this.conns.values()) if (o.open) o.send({ t: 'bye', from: c.peer }); });
  },

  // the members' channel (via 'cloud'), the direct link (via: the other device's id), or a message already checked
  _recv(d, via, checked?) {
    if (!d || typeof d !== 'object') return;
    const from = d.from || via;
    if (!checked && typeof d.to === 'string' && d.to !== this.me) return; // (for another player: not counted against the sender's rate)
    if (!checked) { if (this._dup(d)) return; d = checkMsg(d, from); if (!d) return; } // every message: known kind, right fields, sizes and rate (netmsg.js; copies are not counted twice)
    if (d.to && d.to !== this.me) return;
    if (from === this.me || !okId(from)) return;
    if (this._banned && this._banned.has(from)) return;
    // the room's starter: only players let in; knocks come through the door (or the direct link, _hostConn)
    if (this.role === 'host' && !this._admitted.has(from)) return;
    // the starter's own words to one player: a guest opens them with the starter's key (nobody else can make them)
    if (HOSTONLY.test(d.t)) { if (this.role === 'guest' && from === this.hostId) this._hostSays(d, via); return; }
    if (this.role === 'guest') {
      if (this.knocking) return; // a newcomer at the door hears nothing of the room
      // (round R privacy, 9 Oct) a guest meets only players the starter introduces: on the direct link everything comes
      // through the starter; on the cloud a player must be on the starter's locked members' list, with the same key
      if (via === 'cloud' && from !== this.hostId && !this.remotes[from]) { if (d.t !== 'hello') return; const m = (this.roster || []).find(x => x.id === from); if (!m || (m.pub && d.pub !== m.pub)) { this._pend(d, from); return; } }
      if (via !== 'cloud' && via !== this.hostId) return;
      if (d.t === 'hello' && from === this.hostId && this.hostPub && d.pub !== this.hostPub) return; // someone using the starter's name
    }
    if (d.t === 's' && ![d.x, d.y, d.z, d.yaw].every(Number.isFinite)) return;
    if (d.mid) { if (this._seen.has(d.mid)) return; this._seen.add(d.mid); if (this._seen.size > 800) this._seen = new Set([...this._seen].slice(-400)); }
    if (this.remotes[from]) { this.remotes[from].last = Date.now(); if (via !== 'cloud') this.remotes[from].direct = Date.now(); }
    if (d.t === 'cloudon') { this._useCloud(); return; }
    if (d.t === 'ping') { this.send({ t: 'pong', to: from, ts: d.ts }); return; }
    if (d.t === 'pong') { const r = this.remotes[from]; if (r) { const rtt = Date.now() - d.ts; r.rtt = r.rtt ? Math.round(r.rtt * .6 + rtt * .4) : rtt; r.route = via === 'cloud' ? 'cloud' : 'direct'; this.emit('quality', r); } return; }
    if (d.t === 'hello') {
      const known = this.remotes[from];
      if (known && known.pub && d.pub !== known.pub) return; // someone pretending to be a friend already here
      // a player let in through the cloud: the welcome (again, if they say they have not heard it: w)
      if (via === 'cloud' && this.role === 'host' && (!known || d.w)) { this._useCloud(); this._welcome(from, 'cloud'); if (!known) this.emit('status', { key: 'cloud' }); }
      else if (this.role === 'host' && known && d.w) this._welcome(from); // (the direct welcome went out while they were still opening "come in")
      const r = this.remotes[from] = Object.assign(cleanHello(d, from), { last: Date.now(), route: via === 'cloud' ? 'cloud' : (known && known.route) || 'direct', rtt: known && known.rtt, s: known && known.s, direct: known && known.direct, gotPhoto: known && known.gotPhoto, at: (known && known.at) || Date.now() });
      if (known && known.photo) r.photo = known.photo;
      if (known && !r.pub) r.pub = known.pub;
      // only rebuild the friend's character when something about them changed
      if (!known || known.name !== r.name || JSON.stringify(known.look) !== JSON.stringify(r.look)) this.emit('hello', r);
      // the room's starter introduces a newcomer to everyone already there (cloud friends included), and sends the list
      if (!known && this.role === 'host') { const m = this.members.get(from); if (m) m.name = r.name; this.send({ t: 'hello', from, name: r.name, look: r.look, friend: r.friend, pub: r.pub }); this._shareMembers(); }
      // my photo, locked for this player
      this._sendPhoto(from);
      if(this.role==='guest'&&from===this.hostId&&!this.knocking){if(via==='cloud')this._managementRelay?.('success');else this._managementDirect?.('success');}
      if (known) return;
      // guests call each other too, so everyone hears everyone (the newer one rings)
      if (this.role === 'guest' && from !== via && this.me > from && !this.calls.has(from) && this.peer && this.peer.open) { const call = this.peer.call(from, this.mic || this._silence()); if (call) this._call(call); }
      return;
    }
    if (d.t === 'bye') { this._gone(from); return; }
    if (d.t === 'photo') { this._openPhoto(d, from); return; }
    if (d.t === 'photoreq') { if (this.remotes[from] && this._photoTo) { const r = this.remotes[from]; this._photoTo.delete(from + r.pub); } this._sendPhoto(from); return; }
    if (d.t === 's') { if (this.remotes[from]) this.remotes[from].s = d; return; }
    if (!this.remotes[from]) return; // (game messages only from players in the room)
    this.emit(d.t, Object.assign({}, d, { from }));
  },
  // (a guest) a hello on the cloud from a player not on the starter's list yet: kept a moment, the list may follow
  _pend(d, from) { this._pending = (this._pending || []).filter(x => x.from !== from).concat({ d, from, at: Date.now() }).slice(-8); },
  _flushPending() { const p = (this._pending || []).filter(x => Date.now() - x.at < 20000); this._pending = []; for (const x of p) this._recv(x.d, 'cloud', true); },
  // ---------- knocking ----------
  // (a newcomer) waiting at the door: the microphone stays off until the room's starter lets us in
  _knock(on) { this.knocking = on; if (!on) this._heard = 0; if (this.mic) this.mic.getAudioTracks().forEach(t => t.enabled = !on && !this.muted); },
  // what a knock says: name, look, friend code and key (round R privacy: never the photo)
  _knockHello() { const h = this.hello || {}; return { name: h.name, look: h.look, friend: h.friend, pub: this.pub, map: this.mapVersion }; },
  _knockCloud() { if(this.role==='guest'&&!this._managementRelay){this._managementRelay=managementEvidence.connection('relay');} this._doorSend(Object.assign({ t: 'hello', to: this.hostId }, this._knockHello())); },
  // (a guest) the starter's words to me: each one locked for me with the starter's key. The first key that answers my knock
  // is kept (the direct link to the room's own id outranks the cloud, a saved friend's key outranks both), and every
  // later word must come with the same key.
  _pin(pub, direct) {
    if (this.hostPub === pub) { if (direct) this._pinWeak = false; return true; }
    if (this.hostPub && (!this._pinWeak || !direct)) return false;
    this.hostPub = pub; this._pinWeak = !direct; return true;
  },
  async _hostSays(d, via) {
    if (this.role !== 'guest' || !okPub(d.pub)) return;
    const direct = via === this.hostId, o = await openFrom(d.pub, d);
    if (!o || o.k !== d.t || o.id !== this.me || this.role !== 'guest' || !this._pin(d.pub, direct)) return;
    // (r57) the room is on another map layout: don't come in; the child is told to ask a grown-up to update
    if (this.knocking && !this.sameMap(o.map)) { this._managementFailure('rejected'); this.emit('status', { key: 'oldmap' }); this.close(true); return; }
    if (d.t === 'door') { if (this.knocking) { if (!this._heard) this.emit('status', { key: 'knocking' }); this._heard = Date.now(); } return; }
    if (d.t === 'chal') { if (this.knocking && typeof o.n === 'string' && /^[0-9a-f]{32}$/.test(o.n)) this._toHost({ t: 'chalr', n: o.n }, direct); return; }
    if (d.t === 'admit') { if (o.code === this.code && okSecret(o.s) && (this.knocking || o.s !== this.secret)) this._letIn(o.s, direct); return; }
    if (d.t === 'full') { if (this.knocking) { this._managementFailure('rejected'); this.emit('status', { key: 'full' }); this.close(true); } return; }
    if (d.t === 'nope') { if (this.knocking) { this._managementFailure('rejected'); this.emit('status', { key: 'denied' }); this.close(true); } return; }
    if (d.t === 'kick') { this.emit('status', { key: 'removed' }); this.close(true); return; }
    if (this.knocking) return;
    if (d.t === 'rekey') { if (okSecret(o.s)) { this.secret = o.s; this._startMembers(); } return; }
    if (d.t === 'members') { this.roster = cleanRoster(o.list); this._flushPending(); this.emit('roster', this.roster); this._askPhotos(); }
  },
  // (a guest at the door) answer the starter: on the direct link, or through the door
  _toHost(d, direct) { const c = this.conns.get(this.hostId); if (direct && c && c.open) { try { c.send(d); } catch (e) { } } else this._doorSend(Object.assign({ to: this.hostId }, d)); },
  // (a guest) let in: the room secret opens the members' channel; the microphone comes on, the call starts, and my hello
  // (and then my photo, locked for each player) goes to the room
  _letIn(secret, direct) {
    this.secret = secret; this._knock(false);
    this._startMembers();
    const c = this.conns.get(this.hostId), linked = c && c.open;
    if (!linked) this._useCloud();
    this.emit('status', { key: linked ? 'connected' : 'cloud' });
    if (linked && this.peer && this.peer.open && !this.calls.has(this.hostId)) { const call = this.peer.call(this.hostId, this.mic || this._silence()); if (call) this._call(call); }
    this.send(Object.assign({ t: 'hello' }, this.hello || {}, { w: true }));
    if (!linked) this._helloCloud();
  },
  // (the room's starter) a message at the door (the cloud door, or a direct link not let in yet)
  _atDoorMsg(d, id, via) {
    if (d.t === 'hello') this._doorHello(d, id, via);
    else if (d.t === 'chalr') this._chalr(d, id);
    else if (d.t === 'bye') this._goneKnock(id);
  },
  // (the room's starter) someone knocked. A saved friend who brings the key saved with them is asked to prove it (a number
  // locked with that key) and then comes straight in; anyone else waits for "Let in"
  async _doorHello(d, id, via) {
    if (this.role !== 'host' || (this._banned && this._banned.has(id))) return;
    const h = Object.assign(cleanHello(d, id), { via, d: Object.assign({}, d, { photo: undefined }) });
    if (!h.pub) return; // (a knock must bring its key: every answer is locked with it)
    // (r57) a knock from another map layout is turned away without a knock card; the answer carries my layout, so the
    // knocker's game (r57 or later) shows "Ask a grown-up to update"
    if (!this.sameMap(d.map)) { this._toDoor(id, await this._seal('nope', id, h.pub), via); return; }
    const m = this.members.get(id);
    if (this._admitted.has(id)) { if (m && m.pub === h.pub) this._toDoor(id, await this._seal('admit', id, h.pub, { s: this.secret, code: this.code }), via); return; } // (the answer got lost: say it again)
    const ch = this._chal.get(id), was = this.knocks.get(id) || (ch && ch.h);
    if (was && was.pub !== h.pub) return; // (someone else using that id)
    if (Object.keys(this.remotes).length >= MAX_ROOM - 1) { this._toDoor(id, await this._seal('full', id, h.pub), via); return; }
    if (ch) { this._toDoor(id, ch.msg, via); return; } // (still proving: ask again)
    const f = friendEntry(h.friend);
    if (!was && f && okPub(f.pub) && f.pub === h.pub) {
      const n = hex(rnd(16)), msg = await this._seal('chal', id, h.pub, { n });
      if (this.role !== 'host' || this._chal.has(id)) return;
      this._chal.set(id, { n, h, msg, t: setTimeout(() => { const c = this._chal.get(id); if (c) { this._chal.delete(id); this._knockCard(id, c.h); } }, 6000) });
      this._toDoor(id, msg, via); return;
    }
    this._knockCard(id, h, was);
  },
  _knockCard(id, h, was?) {
    if (this.role !== 'host') return;
    this.knocks.set(id, was ? Object.assign(was, h, { at: was.at }) : Object.assign(h, { at: Date.now() }));
    this._seal('door', id, h.pub).then(m => this._toDoor(id, m, h.via));
    if (!was) this.emit('knock', this.knocks.get(id));
  },
  // a saved friend opened the number: straight in
  _chalr(d, id) { const c = this._chal.get(id); if (!c || d.n !== c.n) return; clearTimeout(c.t); this._chal.delete(id); this.knocks.set(id, Object.assign(c.h, { at: Date.now(), proven: true })); this.admit(id); },
  // the starter's words for one player, locked for them
  async _seal(kind, id, pub, extra?) { return Object.assign({ t: kind, pub: this.pub }, await sealFor(pub, Object.assign({ k: kind, id, map: this.mapVersion }, extra || {}))); },
  _toDoor(id, d, via) { const c = this.conns.get(id); if (c && c.open) { try { c.send(Object.assign({ from: this.me }, d)); } catch (e) { } } if (this.door && (via === 'cloud' || !c || !c.open)) this._doorSend(Object.assign({ to: id }, d)); },
  // the welcome: my hello and everyone already in the room
  _welcome(id, via?) {
    if (via === 'cloud') {
      this._cloudSend(Object.assign({ t: 'hello', to: id }, noPhoto(this.hello)));
      // (everyone else a moment later: the cloud may not keep the order, and a newcomer listens to the starter first)
      setTimeout(() => { if (this.role === 'host') for (const r of Object.values(this.remotes)) if (r.id !== id) this._cloudSend({ t: 'hello', to: id, from: r.id, name: r.name, look: r.look, friend: r.friend, pub: r.pub }); }, 700);
      this._shareMembers();
      return;
    }
    const c = this.conns.get(id); if (!c || !c.open) return;
    if (this.cloudOn) c.send({ t: 'cloudon', from: this.me });
    c.send(Object.assign({ t: 'hello', from: this.me }, noPhoto(this.hello)));
    for (const r of Object.values(this.remotes)) if (r.id !== id) c.send({ t: 'hello', from: r.id, name: r.name, look: r.look, friend: r.friend, pub: r.pub });
    this._shareMembers();
    this.emit('status', { key: 'connected' });
  },
  async admit(id) {
    if (this.role !== 'host') return;
    const k = this.knocks.get(id); this.knocks.delete(id);
    if (!k || !k.pub) { this.emit('knock', null); return; }
    this._admitted.add(id);
    const f = friendEntry(k.friend);
    this.members.set(id, { id, name: k.name, friend: k.friend, pub: k.pub, via: k.via === 'cloud' ? 'cloud' : 'direct', at: Date.now(), known: !!(k.proven || (f && f.pub && f.pub === k.pub)) });
    this.emit('knock', null);
    // the room secret, locked for them (nobody else at the door can open it, or make one in my name for them)
    const msg = await this._seal('admit', id, k.pub, { s: this.secret, code: this.code });
    if (this.role !== 'host' || !this._admitted.has(id)) return;
    this._toDoor(id, msg, k.via);
    const c = this.conns.get(id);
    if (c && c.open) this._welcome(id); else if (k.via === 'cloud') this._useCloud();
    this._recv(k.d, k.via, true);  // now in: the room meets them (the cloud welcome goes out from here)
  },
  async deny(id) {
    if (this.role !== 'host') return;
    const k = this.knocks.get(id); this.knocks.delete(id);
    (this._banned = this._banned || new Set()).add(id);
    if (k && k.pub) this._toDoor(id, await this._seal('nope', id, k.pub), k.via);
    const c = this.conns.get(id); if (c) setTimeout(() => { try { c.close(); } catch (e) { } }, 400);
    this.emit('knock', null);
  },
  _goneKnock(id) { const c = this._chal.get(id); if (c) { clearTimeout(c.t); this._chal.delete(id); } if (this.knocks.delete(id)) this.emit('knock', null); },
  _dup(d) { return typeof d.mid === 'string' && this._seen.has(d.mid); },
  _gone(id) {
    if (!this.remotes[id]) return;
    const r = this.remotes[id]; delete this.remotes[id];
    if (this.role === 'host') this._shareMembers();
    const call = this.calls.get(id); try { call && call.close(); } catch (e) { } this.calls.delete(id);
    const a = this.audios.get(id); if (a) { a.srcObject = null; this.audios.delete(id); }
    this.emit('left', r);
  },
  // (the room's starter) the members' list, locked for each guest: who they may meet, and what the grown-ups' list shows
  async _shareMembers() {
    if (this.role !== 'host') return;
    const h = this.hello || {}, list = ([{ id: this.me, name: String(h.name || '').slice(0, 20), friend: h.friend || null, pub: this.pub, via: 'direct', at: this._since, host: true }] as Array<Record<string, any>>)
      .concat([...this.members.values()].filter(m => this._admitted.has(m.id) && this.remotes[m.id]).map(m => { const r = this.remotes[m.id]; return { id: m.id, name: (r && r.name) || m.name, friend: m.friend, pub: m.pub, via: (r && r.route) || m.via, at: m.at }; }));
    for (const m of this.members.values()) if (this._admitted.has(m.id) && this.remotes[m.id] && m.pub) { const msg = await this._seal('members', m.id, m.pub, { list }); if (this.role === 'host' && this._admitted.has(m.id)) this.send(Object.assign({ to: m.id }, msg)); }
  },
  // (round R privacy, 9 Oct) who is in the room, for the grown-ups (Grown-ups → Playing online): name, friend or new, direct
  // or cloud, when they came. The starter knows; a guest shows the list the starter sent.
  who() {
    if (!this.role || this.knocking) return [];
    const isFriend = m => { const f = friendEntry(m.friend); return !!f && (!f.pub || !m.pub || f.pub === m.pub); };
    const list = this.role === 'host' ? [...this.members.values()].filter(m => this.remotes[m.id]).map(m => ({ id: m.id, name: this.remotes[m.id].name || m.name, friend: m.friend, pub: m.pub, via: this.remotes[m.id].route || m.via, at: m.at, known: m.known }))
      : (this.roster || []).filter(m => m.id !== this.me);
    return [{ id: this.me, me: true, host: this.role === 'host', name: (this.hello || {}).name || '', via: 'direct', at: this.role === 'host' ? this._since : null }].concat(list.map(m => Object.assign({}, m, { friend: isFriend(m), canRemove: this.role === 'host' && !m.host })));
  },

  _call(call) {
    this.calls.set(call.peer, call);
    call.on('stream', stream => {
      let a = this.audios.get(call.peer);
      if (!a) { a = new Audio(); a.autoplay = true; a.setAttribute('playsinline', ''); this.audios.set(call.peer, a); }
      a.srcObject = stream; a.play().catch(() => this.emit('status', { key: 'tapaudio' }));
      this.emit('voice', true);
      this._meter(stream, call.peer);
    });
    call.on('close', () => { this.calls.delete(call.peer); this.emit('voice', this.calls.size > 0); });
  },
  // A silent stream so a child without a microphone can still hear their friends.
  // (r63) one for every call (an iPhone allows only a few sound contexts); an answer carries it too, so the microphone
  // a child turns on later replaces it in every call
  _silence() { if (this._quiet && this._quiet.active) return this._quiet; try { const a = new (window.AudioContext || window.webkitAudioContext)(); const d = a.createMediaStreamDestination(); return (this._quiet = d.stream); } catch (e) { return undefined; } },
  // Report when anyone is talking (to light up the speech icon).
  _meters: new Map(),
  _meter(stream, id) {
    try {
      const a = new (window.AudioContext || window.webkitAudioContext)(), src = a.createMediaStreamSource(stream), an = a.createAnalyser(); an.fftSize = 256; src.connect(an);
      const buf = new Uint8Array(an.frequencyBinCount);
      this._meters.set(id, () => { an.getByteTimeDomainData(buf); let m = 0; for (const v of buf) m = Math.max(m, Math.abs(v - 128)); return m > 14; });
      if (!this._mt) this._mt = setInterval(() => { let on = false; for (const f of this._meters.values()) on = f() || on; this.emit('talking', on); }, 150);
    } catch (e) { }
  },

  // the room's starter can ask someone to leave (a grown-up's tool if anyone is unkind)
  // (works for friends on the direct link and on the cloud relay; they can't come back into this room)
  async kick(id) {
    if (this.role !== 'host') return;
    (this._banned = this._banned || new Set()).add(id);
    const m = this.members.get(id), msg = m && m.pub ? await this._seal('kick', id, m.pub) : null;
    const c = this.conns.get(id); if (c && c.open) { if (msg) try { c.send(Object.assign({ from: this.me }, msg)); } catch (e) { } setTimeout(() => { try { c.close(); } catch (e) { } }, 400); }
    if (this.cloud && msg) this._cloudSend(Object.assign({ to: id }, msg));
    this._gone(id); this._admitted.delete(id); this.members.delete(id); this.send({ t: 'bye', from: id });
    this._rekey(); // (they knew the room secret: the others get a new one)
  },
  async _rekey() {
    if (this.role !== 'host') return;
    this.secret = b64(rnd(32));
    for (const m of this.members.values()) if (this._admitted.has(m.id) && m.pub) this.send(Object.assign({ to: m.id }, await this._seal('rekey', m.id, m.pub, { s: this.secret })));
    setTimeout(() => { if (this.role === 'host') this._startMembers(); }, 800); // (the new secret goes out on the old channel first)
  },
  setMuted(m) { this.muted = m; if (this.mic) this.mic.getAudioTracks().forEach(t => t.enabled = !m && !this.knocking); },
  resumeAudio() { for (const a of this.audios.values()) a.play().catch(() => { }); },
  // ---------- the cloud relay ----------
  // the door: made from the room code (knocks and the starter's locked answers only)
  async _startDoor() {
    if (this.door) this.door.close();
    const ch = this.door = new Channel({ kind: 'room', code: this.code, onMsg: m => { if (this.door === ch) this._doorMsg(m); } });
    await ch.start();
  },
  _doorMsg(m) {
    if (!m || typeof m !== 'object' || !okId(m.from) || m.from === this.me || (typeof m.to === 'string' && m.to !== this.me)) return;
    const d = checkMsg(m, m.from); if (!d) return;
    if (this.role === 'host') { if (!this._banned || !this._banned.has(d.from)) this._atDoorMsg(d, d.from, 'cloud'); return; }
    if (this.role === 'guest' && d.from === this.hostId && HOSTONLY.test(d.t)) this._hostSays(d, 'cloud');
  },
  // the members' channel: made from the room secret, which only those let in have
  _startMembers() {
    if (!this.secret || (this.cloud && this.cloud.code === 'm|' + this.secret)) return Promise.resolve();
    const old = this.cloud; if (old) setTimeout(() => old.close(), 1500);
    const ch = this.cloud = new Channel({ kind: 'mem', code: 'm|' + this.secret, onMsg: m => { if (this.cloud === ch) this._recv(m, 'cloud'); } });
    return ch.start();
  },
  // from now on everything also goes through the cloud (someone in the room can't link directly)
  _useCloud() {
    if (this.cloudOn) return; this.cloudOn = true;
    for (const c of this.conns.values()) if (c.open) try { c.send({ t: 'cloudon', from: this.me }); } catch (e) { }
  },
  async _withPub(hello) { try { this.pub = await myPub(); } catch (e) { this.pub = null; } return Object.assign({}, hello || {}, this.pub ? { pub: this.pub } : {}); },
  // send my photo to one player, locked with our pair key (once per player; after they are in the room only)
  async _sendPhoto(id) {
    const r = this.remotes[id], mine = this.hello && this.hello.photo, room = this.code, me = this.me; this._photoTo = this._photoTo || new Set();
    if (!r || !okPub(r.pub) || !mine || this.knocking || this._photoTo.has(id + r.pub)) return;
    this._photoTo.add(id + r.pub);
    try {
      const small = await smallPhoto(mine); if (!small) { this._photoTo.delete(id + r.pub); return; }
      const iv = rnd(12), ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, await pairKey(r.pub), new TextEncoder().encode(small));
      // A repeated hello replaces the remote record while the image/crypto awaits.
      // Admission and the recipient's key, not that temporary object's identity, bind the photo.
      if (this.code === room && this.me === me && !this.knocking && this.remotes[id]?.pub === r.pub && this.hello?.photo === mine) this.send({ t: 'photo', to: id, iv: b64(iv), ct: b64(ct), mid: 'p' + hex(rnd(5)) });
      else this._photoTo?.delete(id + r.pub);
    } catch (e) { this._photoTo.delete(id + r.pub); }
  },
  // (a newcomer's first photos can be sent while it is still opening "come in": a few seconds after joining it asks
  // anyone whose photo it has not got, twice at most each)
  _askPhotos() {
    clearTimeout(this._askT); this._askT = setTimeout(() => { this._asked = this._asked || {};
      for (const r of Object.values(this.remotes)) if (!r.photo && okPub(r.pub) && (this._asked[r.id] || 0) < 2) { this._asked[r.id] = (this._asked[r.id] || 0) + 1; this.send({ t: 'photoreq', to: r.id }); } }, 4000);
  },
  async _openPhoto(d, from) {
    const r = this.remotes[from], room = this.code, me = this.me; if (!r || !r.pub || typeof d.ct !== 'string' || d.ct.length > 160000) return;
    try {
      const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: unb64(d.iv) }, await pairKey(r.pub), unb64(d.ct)), photo = okPhoto(new TextDecoder().decode(pt));
      const current = this.remotes[from];
      if (photo && this.code === room && this.me === me && !this.knocking && current?.pub === r.pub && current.photo !== photo) { current.photo = photo; this.emit('hello', current); }
    } catch (e) { }
  },
  _cloudSend(d) { if (this.cloud) this.cloud.send(Object.assign({ from: this.me }, d)); },
  _doorSend(d) { if (this.door) this.door.send(Object.assign({ from: this.me }, d)); },
  // (a guest let in through the cloud) my hello on the members' channel; w: I have not heard the starter yet
  _helloCloud() { if (this.knocking || !this.cloud) return; const h = Object.assign(noPhoto(this.hello), { w: !this.remotes[this.hostId] }); this._cloudSend(Object.assign({ t: 'hello', to: this.hostId }, h)); },
  _hostSeen(ms) { const r = this.remotes[this.hostId]; return r && Date.now() - (r.last || 0) < ms; },
  // ping everyone every 2 s (for the signal bars), and notice friends who have gone quiet
  _startPings() {
    clearInterval(this._pt); let n = 0;
    this._pt = setInterval(() => {
      if (!this.role) return;
      this.send({ t: 'ping', ts: Date.now() });
      // Reintroduce an admitted guest after a relay outage outlasted the stale-peer timeout.
      if (this.role === 'guest' && this.cloudOn && !this.knocking) this._helloCloud();
      if (this.role === 'host' && ++n % 5 === 0) this._shareMembers(); // (the members' list again every 10 s, in case one got lost)
      for (const [id, r] of Object.entries(this.remotes)) {
        const quiet = Date.now() - (r.last || Date.now());
        if (quiet > 20000) { this._gone(id); continue; }
        r.weak = quiet > 6000;
        if (r.direct && Date.now() - r.direct > 6000 && r.route !== 'cloud') { r.route = 'cloud'; if (!this.cloudOn) this._useCloud(); }
      }
      this.emit('quality', null);
    }, 2000);
  },
  // keep the screen awake while playing together (so the phone does not sleep and drop the link)
  async _wake(on) {
    try {
      if (on && 'wakeLock' in navigator && !this._lock) { this._lock = await navigator.wakeLock.request('screen'); this._lock.addEventListener('release', () => { this._lock = null; }); }
      if (!on && this._lock) { await this._lock.release(); this._lock = null; }
    } catch (e) { this._lock = null; }
  },
  // what the game shows about the connection: signal bars, ping, route, this device's network
  quality(id) {
    const r = this.remotes[id]; if (!r) return null;
    const rtt = r.rtt || null, bars = r.weak ? 1 : rtt == null ? 2 : rtt < 150 ? 4 : rtt < 300 ? 3 : rtt < 700 ? 2 : 1;
    return { rtt, bars, route: r.route || 'direct', weak: !!r.weak };
  },
  netInfo() {
    const c = navigator.connection || navigator.mozConnection || navigator.webkitConnection || {}, ch = this.cloud || this.door;
    return { online: navigator.onLine !== false, type: c.type || '', eff: c.effectiveType || '', down: c.downlink || null, rtt: c.rtt || null, brokers: ch ? ch.connected : 0, cloud: this.cloudOn, voice: this.calls.size > 0 };
  },
  // send to everyone in the room, or to one friend with {to: id}
  send(d) {
    if (!this.role) return;
    d = Object.assign({ mid: hex(rnd(4)) + (this._n = (this._n || 0) + 1) }, d);
    let fresh = false;
    if (d.t === 'hello' && !d.from) { if (this.pub) d.pub = this.pub; const { t, mid, w, ...me } = d; const was = this.hello && this.hello.photo; this.hello = me; if (me.photo !== was) { this._photoTo = new Set(); fresh = true; } }
    if (d.t === 'hello') { d = Object.assign({}, d); delete d.photo; } // (round R privacy: photos only locked, one player at a time)
    if (this.knocking) { if (d.t === 'hello' && !d.from) { const c = this.conns.get(this.hostId); if (c && c.open) try { c.send(Object.assign({ t: 'hello' }, this._knockHello())); } catch (e) { } } return; } // (at the door: only the knock)
    if (this.cloudOn && this.cloud) {
      // positions go through the cloud 5 times a second at most
      if (d.t !== 's' || !this._sT || Date.now() - this._sT > 190) { if (d.t === 's') this._sT = Date.now(); this._cloudSend(d); }
    }
    if (fresh) for (const id of Object.keys(this.remotes)) this._sendPhoto(id);
    if (this.role === 'host') {
      const out = Object.assign({ from: this.me }, d);
      if (d.to) { const c = this.conns.get(d.to); if (c && c.open && this._admitted.has(d.to)) try { c.send(out); } catch (e) { } return; }
      for (const [id, c] of this.conns) if (c.open && this._admitted.has(id)) try { c.send(out); } catch (e) { }
    } else for (const c of this.conns.values()) if (c.open) try { c.send(d); } catch (e) { }
  },

  // ---------- friends ----------
  // (round R privacy, 9 Oct) invitations and "where I am" notes are locked for one saved friend with the key saved with
  // them (an envelope: my friend code, my key, the locked words); a friend saved without a key gets neither
  async _friendEnv(kind, f, o) { const pub = await myPub(); return Object.assign({ t: kind, from: settings.friendCode, pub }, await sealFor(f.pub, Object.assign({ k: kind, to: f.code, from: settings.friendCode, ts: Date.now(), map: this.mapVersion }, o))); },
  // an envelope from a saved friend, opened: only with the key saved with that friend, made for me, not too old
  async _openFriend(d) {
    const f = friendEntry(d.from); if (!f || !okPub(f.pub) || d.pub !== f.pub) return null;
    const o = await openFrom(f.pub, d);
    if (!o || o.k !== d.t || o.to !== settings.friendCode || o.from !== f.code || !(Math.abs(Date.now() - o.ts) < 30 * 60e3)) return null;
    return { code: f.code, name: String(o.name || '').slice(0, 20), room: okRoom(o.room) ? String(o.room) : null, at: typeof o.at === 'string' && /^[\w-]{0,24}$/.test(o.at) ? o.at : '', players: Number.isInteger(o.players) && o.players >= 0 && o.players <= MAX_ROOM ? o.players : 0, host: o.host === true, hostPub: o.host === true ? f.pub : null,
      // (TypeScript, batch 3) the friend's map version, when their note has one (none does yet: BOARD, Online)
      map: typeof o.map === 'string' && /^[\w.-]{1,16}$/.test(o.map) ? o.map : undefined };
  },
  async listenForFriends(code, onInvite) {
    this.stopListening();
    if (!code || !settings.online) return;
    try {
      await loadPeer();
      const b = new window.Peer(PREFIX + 'f-' + code, peerOpts()); this.beacon = b;
      b.on('connection', c => c.on('data', async raw => { const d = checkMsg(raw, 'b-' + c.peer); setTimeout(() => c.close(), 500); if (!d || d.t !== 'invite') return; const o = await this._openFriend(d); if (o && o.room && settings.online) onInvite(o); }));
      b.on('error', () => { });
      b.on('disconnected', () => { try { b.reconnect(); } catch (e) { } });
    } catch (e) { }
  },
  // ---------- friends' status through the cloud relay ----------
  // Each device that has "friends can see me" switched on keeps a small, encrypted status note on its friend code's topic:
  // (round R privacy, 9 Oct) only "playing now" and a token made fresh each time the game opens. It says "offline" by
  // itself when the device goes away (MQTT "last will"). Where I am and my room go locked to each saved friend's inbox;
  // invites arrive there too.
  friends: { ch: null, code: null, watching: new Set(), status: {}, onInvite: null, onChange: null, share: false, tok: null, last: null, inboxTopic: undefined as string | undefined },
  async friendsStart({ code, share, onInvite, onChange }) {
    if (!settings.online) { this.friendsStop(); return; }
    const F = this.friends; F.onInvite = onInvite; F.onChange = onChange;
    if (F.ch && F.code === code && F.share === share) return;
    // sharing switched off (or a new code): leave an "offline" note straight away, so friends stop seeing me
    if (F.ch) { const old = F.ch; if (F.share) old.send({ t: 'pres', code: F.code, online: false, ts: Date.now() }, { retain: true }); setTimeout(() => old.close(), 500); }
    F.share = share; F.tok = F.tok || hex(rnd(8));
    F.code = code; F.watching = new Set();
    F.ch = new Channel({ kind: 'pres', code, will: share ? { t: 'pres', code, online: false } : null, onMsg: m => this._friendMsg(m) });
    await F.ch.start();
    F.inboxTopic = await F.ch.watch('inbox', code);
  },
  async _friendMsg(m) {
    const F = this.friends; if (!m || typeof m !== 'object') return;
    const d = checkMsg(m, 'f-' + (m.code || m.from || 'x')); if (!d) return;
    if (d.t === 'pres' && d.code && d.code !== F.code && F.watching.has(d.code)) {
      const was = F.status[d.code] || {}, now = Date.now();
      F.status[d.code] = Object.assign({}, was, { online: !!d.online, tok: d.tok || null, seen: now, lastOnline: d.online ? now : was.lastOnline || d.ts || null }, d.online ? {} : { room: null, at: '', players: 0 });
      if (d.online && d.tok !== was.tok) this._noteTo(d.code); // (a friend just came: tell them where I am, locked for them)
      F.onChange && F.onChange(d.code); return;
    }
    if ((d.t === 'note' || d.t === 'invite') && d._topic === F.inboxTopic) {
      const o = await this._openFriend(d); if (!o || !settings.online) return;
      if (d.t === 'invite') { if (o.room) F.onInvite && F.onInvite(o); return; }
      F.status[o.code] = Object.assign({}, F.status[o.code], { name: o.name, at: o.at, room: o.room, players: o.players, host: o.host, map: o.map, noteAt: Date.now() });
      F.onChange && F.onChange(o.code);
    }
  },
  async friendsWatch(codes) { const F = this.friends; if (!F.ch) return; for (const c of codes) if (!F.watching.has(c)) { F.watching.add(c); await F.ch.watch('pres', c); } for (const c of [...F.watching]) if (!codes.includes(c)) { F.watching.delete(c); F.ch.unwatch('pres', c); } },
  // my status: { name, at, room, players, host } (only when the grown-up switched sharing on): "playing now" for everyone
  // with my friend code, the rest locked for each saved friend who is playing now
  friendsShare(st) {
    const F = this.friends; if (!F.ch || !F.share || !settings.online) return;
    F.last = st; F.ch.send({ t: 'pres', code: F.code, online: true, ts: Date.now(), tok: F.tok }, { retain: true });
    for (const f of settings.friends || []) if (okPub(f.pub) && (F.status[f.code] || {}).online) this._noteTo(f.code);
  },
  async _noteTo(code) { const F = this.friends, f = friendEntry(code); if (!F.ch || !F.share || !F.last || !f || !okPub(f.pub)) return; const env = await this._friendEnv('note', f, F.last); if (F.ch) F.ch.send(env, { kind: 'inbox', code: f.code }); },
  friendsStop() { const F = this.friends; if (F.ch) { if (F.share) F.ch.send({ t: 'pres', code: F.code, online: false, ts: Date.now() }, { retain: true }); const c = F.ch; setTimeout(() => c.close(), 500); } F.ch = null; F.code = null; },
  // can I invite this friend? (a key saved with them: the invitation is locked for them)
  canInvite(friendCode) { const f = friendEntry(friendCode); return !!f && okPub(f.pub); },
  async cloudInvite(friendCode, name) { const F = this.friends, f = friendEntry(friendCode); if (!F.ch || !this.code || !f || !okPub(f.pub)) return false; await F.ch.send(await this._friendEnv('invite', f, { name, room: this.code, host: this.role === 'host' }), { kind: 'inbox', code: f.code }); return !!F.ch && F.ch.connected > 0; },
  stopListening() { try { this.beacon && this.beacon.destroy(); } catch (e) { } this.beacon = null; },
  async invite(friendCode, name) {
    const f = friendEntry(friendCode);
    if (!this.role || !this.peer || !this.peer.open || !this.code || !f || !okPub(f.pub)) return false;
    const env = await this._friendEnv('invite', f, { name, room: this.code, host: this.role === 'host' });
    return new Promise(res => {
      const c = this.peer.connect(PREFIX + 'f-' + f.code, { reliable: true });
      const t = setTimeout(() => { try { c.close(); } catch (e) { } res(false); }, 8000);
      c.on('open', () => { c.send(env); clearTimeout(t); setTimeout(() => c.close(), 800); res(true); });
      c.on('error', () => { clearTimeout(t); res(false); });
    });
  },

  // Connection check for grown-ups: which kinds of route can this device make?
  async check() {
    const ice = await iceServers(), found = { host: false, srflx: false, relay: false };
    try {
      const pc = new RTCPeerConnection({ iceServers: ice }); pc.createDataChannel('t');
      pc.onicecandidate = e => { const c = e.candidate && e.candidate.candidate; if (!c) return; const m = / typ (\w+)/.exec(c); if (m && m[1] in found) found[m[1]] = true; };
      await pc.setLocalDescription(await pc.createOffer());
      await new Promise(r => setTimeout(r, 6000)); pc.close();
    } catch (e) { }
    let server = false; try { await loadPeer(); server = await new Promise(res => { const p = new window.Peer(peerOpts()); const t = setTimeout(() => { p.destroy(); res(false); }, 8000); p.on('open', () => { clearTimeout(t); p.destroy(); res(true); }); p.on('error', () => { clearTimeout(t); p.destroy(); res(false); }); }); } catch (e) { }
    // the cloud relay: how many public brokers answer, and how fast
    let cloud = 0, cloudMs = null; try { const t0 = Date.now(), ch = new Channel({ kind: 'check', code: 'check-' + Math.random() }); await ch.start(); cloud = ch.connected; cloudMs = Date.now() - t0; ch.close(); } catch (e) { }
    return Object.assign(found, { server, cloud, cloudMs });
  },

  close(keepMic?: boolean) {
    this._managementDirect=undefined;this._managementRelay=undefined;
    if (this.role && this.cloud && !this.knocking) try { this._cloudSend({ t: 'bye' }); } catch (e) { }
    if (this.role === 'guest' && this.knocking && this.door) try { this._doorSend({ t: 'bye', to: this.hostId }); } catch (e) { }
    const cl = this.cloud, dr = this.door; this.cloud = null; this.door = null; this.cloudOn = false; if (cl) setTimeout(() => cl.close(), 400); if (dr) setTimeout(() => dr.close(), 400);
    clearInterval(this._pt); this._wake(false); this.hostId = null; this._noDirect = false;
    clearInterval(this._mt); this._mt = null; this._meters.clear();
    for (const c of this.calls.values()) try { c.close(); } catch (e) { }
    for (const c of this.conns.values()) try { c.close(); } catch (e) { }
    try { this.peer && this.peer.destroy(); } catch (e) { }
    for (const a of this.audios.values()) a.srcObject = null;
    Object.keys(this.remotes).forEach(id => this._gone(id));
    this.calls.clear(); this.conns.clear(); this.audios.clear();
    this.peer = null; this.role = null; this.me = null; this.code = null; this._banned = null; this._photoTo = null; this._asked = null; clearTimeout(this._askT);
    this.secret = null; this.hostPub = null; this._pinWeak = false; this.roster = null; this._pending = []; this.members.clear();
    for (const c of this._chal.values()) clearTimeout(c.t); this._chal.clear();
    const hadKnocks = this.knocks.size > 0; this.knocks.clear(); this._admitted = new Set(); this.knocking = false; this._heard = 0; if (hadKnocks) this.emit('knock', null);
    if (this.mic) this.mic.getAudioTracks().forEach(t => t.enabled = !this.muted);
    if (!keepMic && this.mic) { this.mic.getTracks().forEach(t => t.stop()); this.mic = null; }
  }
};
