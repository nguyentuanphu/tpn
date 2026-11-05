// The voice relay (TURN) for friends on different networks (round O, owner: "one key I make, and every player can use
// it?"). Yes: the key stays in Netlify's environment variables, never in the game; each game asks here and gets
// relay details that work for a few hours only, so nobody can take the key itself.
// Set ONE of these in Netlify → Site configuration → Environment variables, then deploy again:
//   Cloudflare (1,000 GB a month free):  CF_TURN_KEY_ID  and  CF_TURN_KEY_TOKEN  (Cloudflare → Realtime → TURN Server → Create)
//   Metered (50 GB a month free):        METERED_DOMAIN (e.g. sparkle.metered.live)  and  METERED_API_KEY
// With neither set it answers an empty list and the game uses the free public relays as before.
const env = k => ((globalThis.Netlify && globalThis.Netlify.env.get(k)) || process.env[k] || '').trim();
let kept = null; // { at, list }: one set of details is shared for an hour by the games this server answers
const HOUR = 3600e3;
const json = (o, status = 200) => new Response(JSON.stringify(o), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'private, max-age=1800' } });
const onlyTurn = list => (Array.isArray(list) ? list : [list]).filter(s => s && s.urls).map(s => ({ urls: s.urls, ...(s.username ? { username: s.username, credential: s.credential } : {}) }));

export const makeTurn = ({ fetchFn = (...a: Parameters<typeof fetch>) => fetch(...a), now = () => Date.now() } = {}) => async req => {
  if (req.method !== 'GET') return new Response('', { status: 405 });
  if (kept && now() - kept.at < HOUR) return json({ iceServers: kept.list });
  const cfId = env('CF_TURN_KEY_ID'), cfToken = env('CF_TURN_KEY_TOKEN'), mDomain = env('METERED_DOMAIN'), mKey = env('METERED_API_KEY');
  let list = [];
  try {
    if (cfId && cfToken) {
      const r = await fetchFn(`https://rtc.live.cloudflare.com/v1/turn/keys/${encodeURIComponent(cfId)}/credentials/generate-ice-servers`, { method: 'POST', headers: { Authorization: 'Bearer ' + cfToken, 'Content-Type': 'application/json' }, body: JSON.stringify({ ttl: 4 * 3600 }) });
      if (r.ok) list = onlyTurn((await r.json()).iceServers);
    } else if (mDomain && mKey && /^[\w.-]+$/.test(mDomain)) {
      const r = await fetchFn(`https://${mDomain}/api/v1/turn/credentials?apiKey=${encodeURIComponent(mKey)}`);
      if (r.ok) list = onlyTurn(await r.json());
    }
  } catch (e) { list = []; }
  if (list.length) kept = { at: now(), list };
  return json({ iceServers: list });
};
export default makeTurn();
export const config = { path: '/api/turn' };
