import { Pool } from 'pg';
import { PostgresManagementDatabase } from './storage/postgres.mts';
import { createManagementService } from './transactional/service.mts';
import { loadManagementCatalogue } from './catalogue.mts';
import { readLive, readContent } from '../live.mts';
import { managementConnection, managementBinding } from './connection.mts';

export const managementEnv = (name: string): string =>
  ((globalThis.Netlify?.env.get(name)) || process.env[name] || '').trim();
let database: PostgresManagementDatabase | undefined;
/** No HTTP request creates tables or provisions a provider. Run the migration tool first. */
export function managementDatabase() {
  const connectionString = managementBinding(managementEnv);
  if (!connectionString) return undefined;
  if (!database) {
    const pool = new Pool(managementConnection(connectionString).options);
    pool.on('error', () => { console.warn('Management database connection unavailable.'); });
    database = new PostgresManagementDatabase(pool);
  }
  return database;
}

export function managementService(liveStore, db = managementDatabase()) {
  const catalogue = loadManagementCatalogue();
  return createManagementService({ database: db,
    catalogue: { activityIds: new Set(catalogue.entries.filter(x => x.kind === 'game').map(x => x.id)),
      storyIds: new Set(catalogue.entries.filter(x => x.kind === 'story').map(x => x.id)) },
    initialConfig: async () => {
      const S = await liveStore(), live = await readLive(S), content = await readContent(S);
      return { releases: live.releases, festivals: live.festivals, content: content?.content || {} };
    },
    projector: async (record, signal) => {
      if (record.scopeKey !== 'global') throw new Error('unsupported_projection_scope');
      signal.throwIfAborted(); const S = await liveStore();
      const metadata = { scopeKey: record.scopeKey, revision: record.revision, effectiveHash: record.effectiveHash };
      const previous = await S.getWithMetadata('management-live', { type: 'json' });
      if (previous?.data?.management?.revision >= record.revision) {
        if (previous.data.management.revision !== record.revision || previous.data.management.effectiveHash !== record.effectiveHash)
          throw new Error('projection_revision_conflict');
        return previous.data.management;
      }
      signal.throwIfAborted();
      // A single atomic blob publishes content and rules together. Never include actor or child context.
      const written = await S.setJSON('management-live', { ...record.body, at: record.updatedAt,
        contentAt: record.updatedAt, management: metadata }, previous ? { onlyIfMatch: previous.etag } : { onlyIfNew: true });
      if (!written.modified) throw new Error('projection_compare_and_swap_failed');
      signal.throwIfAborted(); const observed = await S.get('management-live', { type: 'json' });
      return observed.management;
    } });
}
