// Read-only management input and provenance rules. No game state is written here.
import { createHash } from 'node:crypto';
import { isBuild } from '../build-number.mts';

export class ManagementReadError extends Error {
  status: number; code: string;
  constructor(code: string, message: string, status = 400) { super(message); this.name = 'ManagementReadError'; this.code = code; this.status = status; }
}
export const object = (v: unknown): Record<string, any> => v && typeof v === 'object' && !Array.isArray(v) ? v as Record<string, any> : {};
export const count = (v: unknown): number => typeof v === 'number' && Number.isFinite(v) && v >= 0 ? v : 0;
export const safeText = (v: unknown, max = 100): string => typeof v === 'string' ? v.replace(/[\u0000-\u001f<>]/g, '').slice(0, max) : '';
export const day = (now: number) => new Date(now).toISOString().slice(0, 10);
const date = (v: string) => /^\d{4}-\d{2}-\d{2}$/.test(v) && Number.isFinite(Date.parse(v + 'T00:00:00Z')) && new Date(v + 'T00:00:00Z').toISOString().slice(0, 10) === v;
export type ManagementQuery = {
  from: string; to: string; build: string; traffic: string; deviceClass: string;
  limit: number; cursor: string; search: string; child: string; status: string;
};
export function parseManagementQuery(input: URLSearchParams | Record<string, unknown> = {}, now = Date.now()): ManagementQuery {
  const o: Record<string, unknown> = {};
  if (input instanceof URLSearchParams) {
    for (const [k, v] of input) { if (k in o) throw new ManagementReadError('invalid_query', 'Repeated query parameters are not supported.'); o[k] = v; }
  } else Object.assign(o, object(input));
  const keys = new Set(['from','to','build','traffic','deviceClass','limit','cursor','search','child','status']);
  if (Object.keys(o).some(k => !keys.has(k))) throw new ManagementReadError('invalid_query', 'Unknown management query parameter.');
  const text = (k: string, fallback = '') => { const v = o[k]; if (v === undefined || v === '') return fallback; if (typeof v !== 'string') throw new ManagementReadError('invalid_query', 'Query values must be strings.'); return v; };
  const to = text('to', day(now));
  if (!date(to)) throw new ManagementReadError('invalid_period', 'Choose a valid end date.');
  const from = text('from', day(Date.parse(to + 'T00:00:00Z') - 29 * 864e5));
  if (!date(to) || !date(from) || from > to || to > day(now) || from < day(now - 59 * 864e5) || Date.parse(to) - Date.parse(from) > 30 * 864e5)
    throw new ManagementReadError('invalid_period', 'Choose a valid period of at most 31 days within the retained last 60 days.');
  const build = text('build', 'all'), traffic = text('traffic', 'ordinary'), deviceClass = text('deviceClass', 'all');
  if (build !== 'all' && !isBuild(build)) throw new ManagementReadError('invalid_build', 'Unknown build label.');
  if (!['ordinary','authorised_test','synthetic_bot'].includes(traffic)) throw new ManagementReadError('invalid_traffic', 'Unknown traffic scope.');
  if (!['all','phone','tablet','computer'].includes(deviceClass)) throw new ManagementReadError('invalid_device_class', 'Unknown device class.');
  const l = text('limit', '25'); if (!/^\d{1,3}$/.test(l) || +l < 1 || +l > 100) throw new ManagementReadError('invalid_limit', 'Page size must be between 1 and 100.');
  const cursor = text('cursor'); if (cursor.length > 1024 || (cursor && !/^[A-Za-z0-9_-]+$/.test(cursor))) throw new ManagementReadError('invalid_cursor', 'Invalid management cursor.');
  const search = text('search').trim(), child = text('child').trim(), status = text('status', 'all');
  if (search.length > 100 || child.length > 60 || /[\u0000-\u001f<>]/.test(search + child)) throw new ManagementReadError('invalid_search', 'Search is too long or contains unsupported characters.');
  if (!['all','observed','investigating','reproduced','fixing','fixed_in_code','deployed','verified','reopened','dismissed','duplicate','new','fixed','confirmed','back','notbug','dup'].includes(status)) throw new ManagementReadError('invalid_status', 'Unknown attention status.');
  return { from, to, build, traffic, deviceClass, limit: +l, cursor, search, child, status };
}
export function scopeHash(q: ManagementQuery, kind: string) {
  return createHash('sha256').update(JSON.stringify([kind,q.from,q.to,q.build,q.traffic,q.deviceClass,q.search,q.child,q.status])).digest('hex').slice(0,24);
}
export function pageRows<T extends { id: string, sortAt: string }>(rows: T[], q: ManagementQuery, kind: string) {
  const hash = scopeHash(q, kind); let after: { id: string, at: string } | null = null;
  if (q.cursor) {
    try {
      const v = JSON.parse(Buffer.from(q.cursor, 'base64url').toString('utf8'));
      if (v.v !== 1 || v.scope !== hash || typeof v.id !== 'string' || typeof v.at !== 'string' || v.id.length > 120 || v.at.length > 40) throw 0;
      after = { id: v.id, at: v.at };
    } catch { throw new ManagementReadError('invalid_cursor', 'The cursor is invalid or belongs to different filters.'); }
  }
  const sorted = [...rows].sort((a,b) => b.sortAt.localeCompare(a.sortAt) || a.id.localeCompare(b.id));
  const remaining = after ? sorted.filter(r => r.sortAt < after.at || (r.sortAt === after.at && r.id > after.id)) : sorted;
  const selected = remaining.slice(0,q.limit), last = selected[selected.length - 1];
  const nextCursor = last && remaining.length > q.limit ? Buffer.from(JSON.stringify({v:1,scope:hash,id:last.id,at:last.sortAt})).toString('base64url') : null;
  return { rows: selected, nextCursor, total: sorted.length };
}
