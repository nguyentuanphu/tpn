// Web Push with Node's own crypto, no extra package (v1.08 notifications, 3 Nov 2026 AEDT).
//   · VAPID (RFC 8292): a short ES256 token that proves the push comes from this website's key pair;
//   · message encryption (RFC 8291, "aes128gcm"): only the device can read what is sent; the push service sees nothing.
// The keys live only in the Netlify environment (VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT); without them
// vapidFromEnv() gives null and nothing is ever sent. The keys are never logged.
import crypto from 'node:crypto';

export type Subscription = { endpoint: string, keys: { p256dh: string, auth: string } };
export type Vapid = { publicKey: string, privateKey: string, subject: string };
const b64u = (b: Buffer | Uint8Array) => Buffer.from(b).toString('base64url');
const unb64u = (s: string) => Buffer.from(String(s || ''), 'base64url');

/** the keys from the environment, or null when one is missing or not a P-256 key (then push stays off) */
export function vapidFromEnv(get: (k: string) => string): Vapid | null {
  const publicKey = (get('VAPID_PUBLIC_KEY') || '').trim(), privateKey = (get('VAPID_PRIVATE_KEY') || '').trim();
  const subject = (get('VAPID_SUBJECT') || '').trim() || 'mailto:hello@sparklevalley.au';
  if (unb64u(publicKey).length !== 65 || unb64u(privateKey).length !== 32 || !/^(mailto:|https:)/.test(subject)) return null;
  try { privateKeyObject({ publicKey, privateKey, subject }); } catch { return null; }
  return { publicKey, privateKey, subject };
}
const privateKeyObject = (v: Vapid) => { const pub = unb64u(v.publicKey); return crypto.createPrivateKey({ format: 'jwk', key: { kty: 'EC', crv: 'P-256', d: v.privateKey, x: b64u(pub.subarray(1, 33)), y: b64u(pub.subarray(33, 65)) } }); };
/** the Authorization header for one push service (its origin is the token's audience), valid for 12 hours */
export function vapidHeader(v: Vapid, endpoint: string, nowSec = Math.floor(Date.now() / 1000)): string {
  const head = b64u(Buffer.from(JSON.stringify({ typ: 'JWT', alg: 'ES256' })));
  const body = b64u(Buffer.from(JSON.stringify({ aud: new URL(endpoint).origin, exp: nowSec + 12 * 3600, sub: v.subject })));
  const sig = crypto.sign('sha256', Buffer.from(head + '.' + body), { key: privateKeyObject(v), dsaEncoding: 'ieee-p1363' });
  return `vapid t=${head}.${body}.${b64u(sig)}, k=${v.publicKey}`;
}

const newKey = () => { const e = crypto.createECDH('prime256v1'); e.generateKeys(); return e; };
const hkdf = (salt: Buffer, ikm: Buffer, info: Buffer, n: number) => Buffer.from(crypto.hkdfSync('sha256', ikm, salt, info, n));
/** RFC 8291: one record, the plain text followed by the 0x02 end mark; salt and the server's one-time key in the header */
export function encrypt(sub: Subscription, plain: Buffer | string, { salt = crypto.randomBytes(16), ecdh = newKey() } = {}): Buffer {
  const uaPublic = unb64u(sub.keys.p256dh), auth = unb64u(sub.keys.auth);
  if (uaPublic.length !== 65 || auth.length < 16) throw new Error('bad subscription keys');
  const asPublic = ecdh.getPublicKey(), secret = ecdh.computeSecret(uaPublic);
  const ikm = hkdf(auth, secret, Buffer.concat([Buffer.from('WebPush: info\0'), uaPublic, asPublic]), 32);
  const cek = hkdf(salt, ikm, Buffer.from('Content-Encoding: aes128gcm\0'), 16), nonce = hkdf(salt, ikm, Buffer.from('Content-Encoding: nonce\0'), 12);
  const c = crypto.createCipheriv('aes-128-gcm', cek, nonce), text = Buffer.concat([Buffer.from(plain), Buffer.from([2])]);
  const body = Buffer.concat([c.update(text), c.final(), c.getAuthTag()]);
  const head = Buffer.alloc(21); salt.copy(head, 0); head.writeUInt32BE(4096, 16); head.writeUInt8(65, 20);
  return Buffer.concat([head, asPublic, body]);
}
/** the device's side of RFC 8291 (used by the checks' fake push service to prove what a device would read) */
export function decrypt(body: Buffer, uaPrivate: crypto.ECDH, auth: Buffer): string {
  const salt = body.subarray(0, 16), idlen = body.readUInt8(20), asPublic = body.subarray(21, 21 + idlen), data = body.subarray(21 + idlen);
  const uaPublic = uaPrivate.getPublicKey(), secret = uaPrivate.computeSecret(asPublic);
  const ikm = hkdf(auth, secret, Buffer.concat([Buffer.from('WebPush: info\0'), uaPublic, asPublic]), 32);
  const cek = hkdf(salt, ikm, Buffer.from('Content-Encoding: aes128gcm\0'), 16), nonce = hkdf(salt, ikm, Buffer.from('Content-Encoding: nonce\0'), 12);
  const d = crypto.createDecipheriv('aes-128-gcm', cek, nonce); d.setAuthTag(data.subarray(data.length - 16));
  const out = Buffer.concat([d.update(data.subarray(0, data.length - 16)), d.final()]);
  const end = out.lastIndexOf(2); return out.subarray(0, end).toString('utf8');
}
/** a push service address we accept: https, a known push service (or the checks' own when they say so) */
const PUSH_HOSTS = /(^|\.)(fcm\.googleapis\.com|android\.googleapis\.com|updates\.push\.services\.mozilla\.com|push\.apple\.com|notify\.windows\.com|push\.services\.mozilla\.com)$/;
export const goodEndpoint = (endpoint: unknown, extraHost?: string) => { try { const u = new URL(String(endpoint)); return String(endpoint).length < 1000 && ((u.protocol === 'https:' && PUSH_HOSTS.test(u.hostname)) || (!!extraHost && u.host === extraHost)); } catch { return false; } };
export type SendResult = { ok: boolean, status: number, gone: boolean };
/** send one push; `gone` means the device unsubscribed (404/410): its record should be removed */
export async function sendPush(v: Vapid, sub: Subscription, payload: unknown, { fetchFn = fetch, ttl = 24 * 3600, urgency = 'normal', now = Date.now() } = {}): Promise<SendResult> {
  const body = encrypt(sub, JSON.stringify(payload));
  const r = await fetchFn(sub.endpoint, { method: 'POST', body: new Uint8Array(body), headers: { 'Content-Type': 'application/octet-stream', 'Content-Encoding': 'aes128gcm', TTL: String(ttl), Urgency: urgency, Authorization: vapidHeader(v, sub.endpoint, Math.floor(now / 1000)) } });
  return { ok: r.status >= 200 && r.status < 300, status: r.status, gone: r.status === 404 || r.status === 410 };
}
