// Explicit operator task. Never invoked by an HTTP request or automatically against production.
import { Pool } from 'pg';
import { migrateManagement } from '../netlify/lib/management/storage/postgres.mts';
import { managementConnection, managementBinding } from '../netlify/lib/management/connection.mts';
const connectionString = managementBinding(name => process.env[name]);
if (!connectionString) throw new Error('Attach Netlify Database (NETLIFY_DB_URL) or set the local MANAGEMENT_DATABASE_URL binding securely before running migrations.');
const pool = new Pool({ ...managementConnection(connectionString).options, max: 1 });
try { console.log(await migrateManagement(pool)); }
catch { console.error('Management migration failed. Check provider access and migration compatibility; no credentials are logged.'); process.exitCode = 1; }
finally { await pool.end(); }
