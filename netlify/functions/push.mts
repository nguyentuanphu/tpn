// Push notifications for grown-ups (v1.08 notifications; netlify/lib/push.mts, js/content/notify.ts).
//   GET  /api/push                          { on, key }: whether the website can send (the keys are set) and its public key
//   POST /api/push { sub, prefs }           turn on, or change the choices
//   POST /api/push { stop: endpoint }       turn off on this device
//   POST /api/push { opened: kind }         a notification was tapped (only the kind is counted, for Studio)
//   POST /api/push { invite: id }           kind 11, a friend's family invites (held in that family's quiet hours)
// Without VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY in the Netlify environment it answers { on: false } and keeps nothing.
import { subscribe, unsubscribe, opened, invite, readSwitches, PLIMITS } from '../lib/push.mts';
import { vapidFromEnv, type Vapid } from '../lib/webpush.mts';
import { ipOf, ipKey, count } from '../lib/guard.mts';

const env = (k: string) => ((globalThis as any).Netlify && (globalThis as any).Netlify.env.get(k)) || process.env[k] || '';
const store = (name: string) => () => import('@netlify/blobs').then(m => m.getStore({ name, consistency: 'strong' }));
const json = (o: unknown, status = 200) => new Response(JSON.stringify(o), { status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' } });
export const PUSH_LIMIT = 60, PUSH_WINDOW = 10 * 60e3;
export const makePush = ({ pushStore = store('push'), liveStore = store('live'), guardStore = store('guard'), vapid = (): Vapid | null => vapidFromEnv(env), now = () => Date.now(), fetchFn = fetch as typeof fetch, extraHost = '' } = {}) => async (req: Request, ctx?: unknown) => {
  const v = vapid();
  if (req.method === 'GET') return json(v ? { on: true, key: v.publicKey } : { on: false });
  if (req.method !== 'POST') return new Response('', { status: 405 });
  if (!v) return json({ on: false }, 503);
  const G = await guardStore(), ip = await ipKey(G, ipOf(req, ctx));
  if (!await count(G, 'push/' + ip, PUSH_LIMIT, PUSH_WINDOW, now())) return new Response('', { status: 429, headers: { 'Retry-After': '600' } });
  const text = await req.text(); if (text.length > PLIMITS.body) return new Response('', { status: 413 });
  let b: any = null; try { b = JSON.parse(text); } catch { return new Response('', { status: 400 }); }
  if (!b || typeof b !== 'object') return new Response('', { status: 400 });
  const S = await pushStore();
  if (b.opened) return (await opened(S, b.opened, now())) ? new Response(null, { status: 204 }) : new Response('', { status: 400 });
  if (b.stop) return (await unsubscribe(S, b.stop)) ? new Response(null, { status: 204 }) : new Response('', { status: 400 });
  if (b.invite) { const live = await readSwitches(await liveStore()).catch(() => null); const r = await invite(S, b.invite, { vapid: v, now: now(), fetchFn, live }); return json(r, r.ok ? 200 : r.status || 400); }
  const r = await subscribe(S, b, now(), extraHost || undefined);
  return r.ok ? json({ ok: true, id: r.id, prefs: r.prefs }) : json({ error: r.error }, r.status);
};
export default makePush();
export const config = { path: '/api/push' };
