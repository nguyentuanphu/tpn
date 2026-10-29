-- Private management records are independent of local saves and existing Blobs.
-- Explicit migration only: do not execute this automatically on public requests.
CREATE TABLE IF NOT EXISTS management_events (
  device_id text NOT NULL CHECK (device_id ~ '^[a-z0-9]{12}$'),
  event_id uuid NOT NULL,
  attempt_id uuid NOT NULL,
  session_id text NOT NULL CHECK (session_id ~ '^[a-z0-9]{16}$'),
  event_name text NOT NULL CHECK (event_name IN (
    'activity.started','activity.completed','activity.abandoned',
    'boot.started','boot.ready','boot.failed','story.opened','story.completed',
    'connection.attempt','connection.result','voice.result','update.result','backup.result')),
  occurred_at timestamptz NOT NULL,
  received_at timestamptz NOT NULL,
  build text NOT NULL,
  source_commit text CHECK (source_commit IS NULL OR source_commit ~ '^[0-9a-f]{40}$'),
  environment text NOT NULL CHECK (environment IN ('production','staging','local')),
  traffic text NOT NULL CHECK (traffic IN ('ordinary','authorised_test','synthetic_bot')),
  payload_hash text NOT NULL CHECK (payload_hash ~ '^[0-9a-f]{64}$'),
  payload jsonb NOT NULL CHECK (jsonb_typeof(payload)='object'),
  PRIMARY KEY (device_id,event_id)
);
CREATE INDEX IF NOT EXISTS management_events_period ON management_events(occurred_at,build,traffic);
CREATE INDEX IF NOT EXISTS management_events_attempt ON management_events(device_id,attempt_id,event_name);
CREATE TABLE IF NOT EXISTS management_event_conflicts (
  device_id text NOT NULL, event_id uuid NOT NULL,
  payload_hash text NOT NULL, received_at timestamptz NOT NULL,
  payload jsonb NOT NULL CHECK (jsonb_typeof(payload)='object'),
  PRIMARY KEY(device_id,event_id,payload_hash)
);
-- Typed namespaces share a transaction-capable document table. Each service
-- enforces its allowlist and revision semantics before writing. Config versions,
-- change/audit history and operation evidence are immutable through the service.
CREATE TABLE IF NOT EXISTS management_records (
  namespace text NOT NULL CHECK (namespace IN
    ('configs','config_versions','changes','projection_jobs','receipts','audit','attention','operations')),
  record_key text NOT NULL CHECK (length(record_key) BETWEEN 1 AND 256),
  record_json jsonb NOT NULL CHECK (jsonb_typeof(record_json)='object'),
  PRIMARY KEY(namespace,record_key)
);
CREATE INDEX IF NOT EXISTS management_records_changed ON management_records(namespace,(record_json->>'updatedAt'),record_key);
CREATE INDEX IF NOT EXISTS management_records_revision ON management_records(namespace,(record_json->>'scopeKey'),(record_json->>'revision'));
