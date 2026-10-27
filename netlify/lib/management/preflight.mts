import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import type { SqlPool } from './storage/postgres.mts';

/** Read-only: checks connectivity, encrypted transport and the exact installed migration. */
export async function managementPreflight(pool: SqlPool, { local = false } = {}) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN READ ONLY');
    await client.query("SET LOCAL statement_timeout = '5s'");
    const server = (await client.query("SELECT current_setting('server_version_num')::int AS version, EXISTS(SELECT 1 FROM pg_stat_ssl WHERE pid=pg_backend_pid() AND ssl) AS tls")).rows[0];
    const relations = (await client.query("SELECT to_regclass('management_schema_migrations') AS migrations, to_regclass('management_events') AS events, to_regclass('management_event_conflicts') AS conflicts, to_regclass('management_records') AS records")).rows[0];
    const installed = relations.migrations ? (await client.query('SELECT version,sha256 FROM management_schema_migrations ORDER BY version')).rows : [];
    const sql = await readFile(new URL('./storage/001-management.sql', import.meta.url));
    const expected = createHash('sha256').update(sql).digest('hex');
    const exact = installed.length === 1 && installed[0].version === 1 && installed[0].sha256 === expected;
    const schemaReady = exact && !!relations.events && !!relations.conflicts && !!relations.records;
    if (schemaReady) {
      await client.query('SELECT device_id,event_id,payload FROM management_events LIMIT 0');
      await client.query('SELECT namespace,record_key,record_json FROM management_records LIMIT 0');
    }
    await client.query('COMMIT');
    const tls = server.tls === true;
    return { schemaVersion: 1, checkedAt: new Date().toISOString(), connected: true,
      serverMajor: Math.floor(Number(server.version) / 10000), tls, local, schemaReady,
      migration: exact ? 'current' : installed.length ? 'mismatch' : 'not_applied',
      ready: schemaReady && (local || tls), writeAccess: 'not_tested_read_only_preflight' };
  } catch { try { await client.query('ROLLBACK'); } catch {} throw new Error('management_database_preflight_failed'); }
  finally { client.release(); }
}
