import { Pool } from 'pg';
import { managementConnection, managementBinding } from '../netlify/lib/management/connection.mts';
import { managementPreflight } from '../netlify/lib/management/preflight.mts';
const binding = managementBinding(name => process.env[name]);
if (!binding) { console.error(JSON.stringify({ ready: false, code: 'management_database_not_configured' })); process.exitCode = 2; }
else {
  let pool;
  try {
    const configured = managementConnection(binding); pool = new Pool({ ...configured.options, max: 1 });
    const result = await managementPreflight(pool, { local: configured.local }); console.log(JSON.stringify(result, null, 2));
    if (!result.ready) process.exitCode = 1;
  } catch { console.error(JSON.stringify({ ready: false, code: 'management_database_preflight_failed' })); process.exitCode = 1; }
  finally { await pool?.end(); }
}
