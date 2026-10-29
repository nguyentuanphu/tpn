-- Add private drafts without changing applied migration bytes or public configuration.
ALTER TABLE management_records DROP CONSTRAINT management_records_namespace_check;
ALTER TABLE management_records ADD CONSTRAINT management_records_namespace_check CHECK (namespace IN
 ('configs','config_versions','changes','projection_jobs','receipts','audit','attention','operations',
  'finance_lines','finance_versions','finance_settings','finance_budgets','finance_batches',
  'config_drafts','config_draft_versions'));
