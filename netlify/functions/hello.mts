// A device saying hello (js/players.js): counted in the players report, anonymously (netlify/lib/players.mts).
// (round R privacy, 9 Oct) Each connection may say hello 60 times in 10 minutes (a home's devices share one: each says
// "still here" every two minutes while playing); more is refused (429) and the device keeps its outbox for later.
// Synthetic bots (isRobot: true, traffic: 'synthetic_bot') are routed to a separate 'bot-players' store to keep
// production analytics clean.
import { hello } from '../lib/players.mts';
import { ipOf, ipKey, count } from '../lib/guard.mts';
import { ID } from '../lib/hello-clean.mts';

const blobs = () => import('@netlify/blobs').then(m => m.getStore({ name: 'players', consistency: 'strong' }));
// (Analytics Telemetry Isolation, bot-3) synthetic bot runs never reach the real players' store: they land in
// their own bucket, so report()/sumDay() in netlify/lib/players.mts can never count them
const botBlobs = () => import('@netlify/blobs').then(m => m.getStore({ name: 'bot-players', consistency: 'strong' }));
const guardBlobs = () => import('@netlify/blobs').then(m => m.getStore({ name: 'guard', consistency: 'strong' }));
// is this hello a synthetic bot's (js/players.js tags them; hello-clean.mts types the flags)?
export const isBotHello = (b): boolean => !!b && b.isRobot === true && b.traffic === 'synthetic_bot';
export const HELLO_LIMIT = 60, HELLO_WINDOW = 10 * 60e3;
export const makeHello = ({ playersStore = blobs, botStore = botBlobs, guardStore = guardBlobs, now = () => Date.now() } = {}) => async (req, ctx) => {
  if (req.method !== 'POST') return new Response('', { status: 405 });
  const G = await guardStore(), ip = await ipKey(G, ipOf(req, ctx));
  if (!await count(G, 'hello/' + ip, HELLO_LIMIT, HELLO_WINDOW, now())) return new Response('', { status: 429, headers: { 'Retry-After': '600' } });
  const text = await req.text(); if (text.length > 60000) return new Response('', { status: 413 });
  let body = null; try { body = JSON.parse(text); } catch (e) { return new Response('', { status: 400 }); }
  // roughly where (town, state, country) from the connection, worked out by Netlify; the address itself is never kept
  const g = (ctx && ctx.geo) || {}, where = { city: g.city || '', region: (g.subdivision && (g.subdivision.code || g.subdivision.name)) || '', country: (g.country && g.country.code) || '' };
  // synthetic bot telemetry is written to its own bucket (sv2_bot_telemetry on the device), never the players' one
  const S = await (isBotHello(body) ? botStore() : playersStore());
  const ok = await hello(S, body, Date.now(), where, { ip }).catch(() => false);
  // (owner, 30 Oct 2026 AEDT: one device name across Studio and the game) the name the family gave this device in Studio
  // goes back to the device, so its Settings shows the same name
  const label = ok && body && ID.test(String(body.id || '')) ? await Promise.resolve(S.get('label/' + body.id)).catch(() => null) : null;
  return new Response(null, { status: ok ? 204 : 400, headers: label ? { 'X-SV-Device-Name': encodeURIComponent(String(label).slice(0, 40)) } : {} });
};
export default makeHello();
export const config = { path: '/api/hello' };
