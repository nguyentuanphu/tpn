import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import type { EventQuery, JsonObject, ManagementDatabase, ManagementTransaction, Namespace, StoredEvent } from '../transactional/types.mts';

/** Structural pg Pool interface: callers supply the configured driver. */
export interface SqlClient {
  query(text: string, values?: unknown[]): Promise<{ rows: Record<string, unknown>[]; rowCount?: number | null }>;
  release(): void;
}
export interface SqlPool { connect(): Promise<SqlClient>; }

const object = (value: unknown): JsonObject => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('management_invalid_database_record');
  return value as JsonObject;
};
const stamp = (value: unknown) => value instanceof Date ? value.toISOString() : String(value);
function stored(row: Record<string, unknown>): StoredEvent {
  return { deviceId: String(row.device_id), eventId: String(row.event_id), attemptId: String(row.attempt_id),
    sessionId: String(row.session_id), eventName: String(row.event_name), occurredAt: stamp(row.occurred_at),
    receivedAt: stamp(row.received_at), build: String(row.build), sourceCommit: row.source_commit == null ? null : String(row.source_commit),
    environment: String(row.environment), traffic: String(row.traffic), payloadHash: String(row.payload_hash), payload: object(row.payload) };
}

function transaction(client: SqlClient): ManagementTransaction {
  return {
    async get(namespace, key) {
      const result = await client.query('SELECT record_json FROM management_records WHERE namespace=$1 AND record_key=$2', [namespace,key]);
      return result.rows[0] ? object(result.rows[0].record_json) : null;
    },
    async put(namespace, key, value) {
      const conflict = namespace === 'audit' || namespace === 'config_versions' ? '' : ' ON CONFLICT(namespace,record_key) DO UPDATE SET record_json=EXCLUDED.record_json';
      await client.query('INSERT INTO management_records(namespace,record_key,record_json) VALUES($1,$2,$3::jsonb)' + conflict, [namespace,key,JSON.stringify(value)]);
    },
    async list(namespace, prefix='') {
      const result = await client.query('SELECT record_key,record_json FROM management_records WHERE namespace=$1 AND left(record_key,length($2))=$2 ORDER BY record_key LIMIT 10001', [namespace,prefix]);
      if (result.rows.length>10000) throw new Error('management_read_scope_too_large');
      return result.rows.map(row => ({key:String(row.record_key),value:object(row.record_json)}));
    },
    async getEvent(deviceId,eventId) {
      const result = await client.query('SELECT * FROM management_events WHERE device_id=$1 AND event_id=$2',[deviceId,eventId]);
      return result.rows[0] ? stored(result.rows[0]) : null;
    },
    async insertEvent(e) {
      await client.query('INSERT INTO management_events(device_id,event_id,attempt_id,session_id,event_name,occurred_at,received_at,build,source_commit,environment,traffic,payload_hash,payload) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13::jsonb)',
        [e.deviceId,e.eventId,e.attemptId,e.sessionId,e.eventName,e.occurredAt,e.receivedAt,e.build,e.sourceCommit,e.environment,e.traffic,e.payloadHash,JSON.stringify(e.payload)]);
    },
    async quarantine(e) {
      await client.query('INSERT INTO management_event_conflicts(device_id,event_id,payload_hash,received_at,payload) VALUES($1,$2,$3,$4,$5::jsonb) ON CONFLICT DO NOTHING',[e.deviceId,e.eventId,e.payloadHash,e.receivedAt,JSON.stringify(e.payload)]);
    },
    async events(q: EventQuery) {
      const limit = Math.min(10000,Math.max(1,q.limit ?? 10000));
      const result = await client.query('SELECT * FROM management_events WHERE occurred_at >= $1 AND occurred_at < $2 AND ($3::text IS NULL OR build=$3) AND ($4::text IS NULL OR environment=$4) AND ($5::text IS NULL OR traffic=$5) ORDER BY occurred_at,device_id,event_id LIMIT $6',
        [q.from,q.to,q.build ?? null,q.environment ?? null,q.traffic ?? null,limit+1]);
      if (result.rows.length>limit) throw new Error('management_read_scope_too_large');
      return result.rows.map(stored);
    }
  };
}

export class PostgresManagementDatabase implements ManagementDatabase {
  private readonly pool: SqlPool;
  constructor(pool: SqlPool) {this.pool=pool;}
  async transaction<T>(locks: string[],work:(tx:ManagementTransaction)=>Promise<T>):Promise<T> {
    const client=await this.pool.connect();
    try {
      await client.query('BEGIN');
      await client.query("SET LOCAL statement_timeout='8s'");
      await client.query("SET LOCAL idle_in_transaction_session_timeout='15s'");
      for (const key of [...new Set(locks)].sort()) await client.query('SELECT pg_advisory_xact_lock(hashtextextended($1,0))',[key]);
      const result=await work(transaction(client));
      await client.query('COMMIT');
      return result;
    } catch (error) {
      try {await client.query('ROLLBACK');}catch {}
      throw error;
    } finally {client.release();}
  }
}

/** Run explicitly from trusted migration tooling, never from an HTTP request. */
export async function migrateManagement(pool:SqlPool):Promise<{version:number;applied:boolean}> {
  const sql=await readFile(new URL('./001-management.sql',import.meta.url),'utf8');
  const hash=createHash('sha256').update(sql).digest('hex'),client=await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query("SELECT pg_advisory_xact_lock(hashtextextended('management:migrations',0))");
    await client.query('CREATE TABLE IF NOT EXISTS management_schema_migrations(version integer PRIMARY KEY,sha256 text NOT NULL,applied_at timestamptz NOT NULL DEFAULT now())');
    const old=(await client.query('SELECT sha256 FROM management_schema_migrations WHERE version=1')).rows[0];
    if (old && old.sha256!==hash) throw new Error('management_migration_checksum_mismatch');
    if (!old) {
      await client.query(sql);
      await client.query('INSERT INTO management_schema_migrations(version,sha256) VALUES(1,$1)',[hash]);
    }
    await client.query('COMMIT');
    return {version:1,applied:!old};
  } catch(error) {try {await client.query('ROLLBACK');}catch {}throw error;}
  finally {client.release();}
}
