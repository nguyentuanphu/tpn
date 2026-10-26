// Device-reported evidence is untrusted telemetry, never proof of identity or authority.
import { managementService } from '../lib/management/runtime.mts';
import { managementBody, managementFailure, managementJson } from '../lib/management/http.mts';
import { ipOf, ipKey, count } from '../lib/guard.mts';
const store = name => () => import('@netlify/blobs').then(m => m.getStore({ name, consistency: 'strong' }));
export const makeManagement = ({ service = () => managementService(store('live')), guardStore = store('guard'), now = () => Date.now() } = {}) => async (req: Request, ctx) => {
  try {
    if (req.method !== 'POST') return managementJson({ error: 'method_not_allowed' }, 405);
    const url = new URL(req.url), path = url.pathname;
    if (!['/api/management/events', '/api/management/config-receipts'].includes(path)) return managementJson({ error: 'not_found' }, 404);
    const origin = req.headers.get('origin');
    if (origin && origin !== url.origin) return managementJson({ error: 'origin_not_allowed' }, 403);
    const instance = service();
    if (!instance.configured()) return managementJson({ error: 'management_database_not_configured' }, 503);
    const G = await guardStore(), ip = await ipKey(G, ipOf(req, ctx));
    if (!await count(G, 'management/' + ip, 120, 10 * 60000, now()))
      return managementJson({ error: 'rate_limited' }, 429);
    const body = await managementBody(req);
    return managementJson(path.endsWith('/events') ? await instance.ingestEvents(body) : await instance.receiveConfigReceipt(body));
  } catch (error) { return managementFailure(error); }
};
export default makeManagement();
export const config = { path: ['/api/management/events', '/api/management/config-receipts'] };
