-- Additive namespace expansion. No existing event, family save or financial record is deleted.
ALTER TABLE management_records DROP CONSTRAINT management_records_namespace_check;
ALTER TABLE management_records ADD CONSTRAINT management_records_namespace_check CHECK (namespace IN
 ('configs','config_versions','changes','projection_jobs','receipts','audit','attention','operations',
  'finance_lines','finance_versions','finance_settings','finance_budgets','finance_batches'));
