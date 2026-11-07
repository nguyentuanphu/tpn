// Push notifications for grown-ups: the scheduled sending (v1.08 notifications). Netlify runs this every 30 minutes;
// each family gets what is due in its own time zone, outside its quiet hours, each message once (netlify/lib/push.mts).
// Studio's switches (Releases page, group "Notifications for grown-ups") turn a kind off for everyone. Without the
// VAPID keys in the Netlify environment it does nothing.
import { run, readSwitches } from '../lib/push.mts';
import { vapidFromEnv } from '../lib/webpush.mts';

const env = (k: string) => ((globalThis as any).Netlify && (globalThis as any).Netlify.env.get(k)) || process.env[k] || '';
const store = (name: string) => () => import('@netlify/blobs').then(m => m.getStore({ name, consistency: 'strong' }));
export const makePushSend = ({ pushStore = store('push'), liveStore = store('live'), testerStore = store('testers'), now = () => Date.now(), fetchFn = fetch as typeof fetch } = {}) => async () => {
  const vapid = vapidFromEnv(env); if (!vapid) return new Response(JSON.stringify({ off: true }), { status: 200 });
  const live = await readSwitches(await liveStore()).catch(() => null);
  const r = await run(await pushStore(), { vapid, live, testers: await testerStore().catch(() => null), now: now(), fetchFn });
  return new Response(JSON.stringify(r), { status: 200, headers: { 'Content-Type': 'application/json' } });
};
export default makePushSend();
export const config = { schedule: '*/30 * * * *' };
