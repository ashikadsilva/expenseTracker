-- Run once if your table was created before per-account settings existed.
ALTER TABLE expense_tracker_data
  ADD COLUMN IF NOT EXISTS accounts JSONB;
