// Netlify invokes this function internally every five minutes; no public HTTP route or Studio token is exposed.
import core from '../../studio/core.cts';
import { cleanBotConfig, dueBotSlot } from '../lib/child-bots.mts';

const env = (key: string) => ((globalThis.Netlify && globalThis.Netlify.env.get(key)) || process.env[key] || '').trim();
const isEngine = (m: unknown): m is StudioEngine => typeof m === 'object' && m !== null && 'ghApi' in m;
if (!isEngine(core)) throw new Error('studio/core.cts: the Studio engine did not load');
const engine = core as unknown as StudioEngine;
export const runScheduledBots = async ({ liveStore, dispatch, now = new Date() }: {
  liveStore: { get(key: string, options: { type: 'json' }): Promise<unknown>, setJSON(key: string, value: unknown): Promise<unknown> },
  dispatch: (slot: string, config: NonNullable<ReturnType<typeof cleanBotConfig>>) => Promise<unknown>, now?: Date
}) => {
  const config = cleanBotConfig(await liveStore.get('bot-schedule', { type: 'json' }).catch(() => null));
  const slot = dueBotSlot(config, now);
  if (!slot || !config) return { dispatched: false };
  if (await liveStore.get('bot-last-slot', { type: 'json' }).catch(() => null) === slot) return { dispatched: false };
  await dispatch(slot, config);
  await liveStore.setJSON('bot-last-slot', slot);
  return { dispatched: true, slot };
};
export default async () => {
  const token = env('GITHUB_TOKEN'), repo = env('GITHUB_REPO') || 'nguyentuanphu/tpn';
  if (!token || !/^[\w.-]+\/[\w.-]+$/.test(repo)) throw new Error('Bot schedule requires a valid GitHub token and repository');
  const { getStore } = await import('@netlify/blobs');
  const liveStore = getStore({ name: 'live', consistency: 'strong' });
  const gh = engine.ghApi(token);
  return runScheduledBots({ liveStore, dispatch: (slot, config) => gh(`/repos/${repo}/actions/workflows/nightly-child-bots.yml/dispatches`, {
    method: 'POST', body: JSON.stringify({ ref: env('GITHUB_BRANCH') || 'main', inputs: { count: String(config.count), profile: config.profile, duration: String(config.duration), slot } })
  }) });
};
export const config = { schedule: '*/5 * * * *' };
