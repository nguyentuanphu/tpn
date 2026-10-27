/** Prefer Netlify's context-specific database branch over any legacy operator binding. */
export function managementBinding(read:(name:string)=>string|undefined) {
  return read('NETLIFY_DB_URL')?.trim() || read('MANAGEMENT_DATABASE_URL')?.trim() || '';
}

/** Shared operator/runtime connection rules. Never include connection strings in errors. */
export function managementConnection(connectionString: string) {
  let url: URL;
  try { url = new URL(connectionString); } catch { throw new Error('management_database_url_invalid'); }
  if (!['postgres:', 'postgresql:'].includes(url.protocol)) throw new Error('management_database_protocol');
  const local = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
  // pg connection-string SSL parameters must not replace certificate verification.
  for (const key of [...url.searchParams.keys()]) if (/^ssl|^uselibpqcompat$/i.test(key)) url.searchParams.delete(key);
  return { local, options: { connectionString: url.toString(), ssl: local ? false as const : { rejectUnauthorized: true },
    max: 3, connectionTimeoutMillis: 5000, idleTimeoutMillis: 10000, application_name: 'sparkle-studio-management' } };
}
