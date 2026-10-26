/** Private management storage contracts. No implementation is selected implicitly. */
export type Json = null | boolean | number | string | Json[] | { [key: string]: Json };
export type JsonObject = { [key: string]: Json };
export type Namespace = 'configs' | 'config_versions' | 'changes' | 'projection_jobs' | 'receipts' | 'audit' | 'attention' | 'operations';
export type StoredEvent = {
  deviceId: string; eventId: string; attemptId: string; sessionId: string;
  eventName: string; occurredAt: string; receivedAt: string; build: string;
  sourceCommit: string | null; environment: string; traffic: string;
  payloadHash: string; payload: JsonObject;
};
export type EventQuery = { from: string; to: string; build?: string; environment?: string; traffic?: string; limit?: number };
export interface ManagementTransaction {
  get(namespace: Namespace, key: string): Promise<JsonObject | null>;
  put(namespace: Namespace, key: string, value: JsonObject): Promise<void>;
  list(namespace: Namespace, prefix?: string): Promise<Array<{ key: string; value: JsonObject }>>;
  getEvent(deviceId: string, eventId: string): Promise<StoredEvent | null>;
  insertEvent(value: StoredEvent): Promise<void>;
  quarantine(value: StoredEvent): Promise<void>;
  events(query: EventQuery): Promise<StoredEvent[]>;
}
export interface ManagementDatabase {
  /** Locks are transaction-scoped and acquired in sorted order on one SQL connection. */
  transaction<T>(locks: string[], work: (tx: ManagementTransaction) => Promise<T>): Promise<T>;
}
export class ManagementError extends Error {
  readonly status: number; readonly code: string;
  constructor(status: number, code: string) { super(code); this.name = 'ManagementError'; this.status = status; this.code = code; }
}
export const unavailable = () => new ManagementError(503, 'management_database_not_configured');
