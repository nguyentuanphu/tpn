// Explicit operator task. Never invoked by an HTTP request or automatically against production.
import { Pool } from 'pg';
import { migrateManagement } from '../netlify/lib/management/storage/postgres.mts';
const connectionString = process.env.MANAGEMENT_DATABASE_URL;
if (!connectionString) throw new Error('Set MANAGEMENT_DATABASE_URL securely before running migrations.');
const url = new URL(connectionString), local = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
if (!['postgres:', 'postgresql:'].includes(url.protocol)) throw new Error('Unsupported database protocol.');
for (const key of ['sslmode', 'sslcert', 'sslkey', 'sslrootcert']) url.searchParams.delete(key);
const pool = new Pool({ connectionString: url.toString(), ssl: local ? false : { rejectUnauthorized: true }, max: 1, connectionTimeoutMillis: 5000 });
try { console.log(await migrateManagement(pool)); }
catch { console.error('Management migration failed. Check provider access and migration compatibility; no credentials are logged.'); process.exitCode = 1; }
finally { await pool.end(); }
