// The releases, festivals and content pages Sparkle Studio saved (netlify/lib/live.mts), for every device that opens the game.
// Public and small; kept for 30 seconds so many devices opening at once ask the store only now and then.
import { readLive, readContent, publicLive } from '../lib/live.mts';
const blobs = () => import('@netlify/blobs').then(m => m.getStore({ name: 'live', consistency: 'strong' }));
export const makeLive = ({ liveStore = blobs } = {}) => async () => {
  const S = await liveStore();
  const projected = await S.get('management-live', { type: 'json' }).catch(() => null);
  const m = projected?.management;
  const valid = m?.scopeKey === 'global' && Number.isSafeInteger(m.revision) && m.revision > 0 && /^[0-9a-f]{64}$/.test(m.effectiveHash || '');
  const v = valid ? { ...publicLive(projected, { content: projected.content, at: projected.contentAt }),
    management: { scopeKey: 'global', revision: m.revision, effectiveHash: m.effectiveHash } }
    : publicLive(await readLive(S).catch(() => ({ releases: {}, festivals: {} })), await readContent(S).catch(() => null));
  // (r81, owner 17 Oct AEDT) with the content pages' live sections (netlify/lib/live.mts saveContent)
  return new Response(JSON.stringify(v), { status: 200, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'public, max-age=30' } });
};
export default makeLive();
export const config = { path: '/api/live' };
