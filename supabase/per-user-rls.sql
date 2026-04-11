-- Run in Supabase SQL Editor after enabling Email auth (Authentication > Providers > Email).
-- Replaces the wide-open anon policy with per-user access: row id must equal auth.uid()::text.

ALTER TABLE expense_tracker_data ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "expense_tracker_anon_rw" ON expense_tracker_data;

-- Authenticated users only (JWT from signIn / signUp). Anon cannot read/write rows.
CREATE POLICY "expense_tracker_select_own"
  ON expense_tracker_data FOR SELECT
  TO authenticated
  USING (auth.uid()::text = id);

CREATE POLICY "expense_tracker_insert_own"
  ON expense_tracker_data FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid()::text = id);

CREATE POLICY "expense_tracker_update_own"
  ON expense_tracker_data FOR UPDATE
  TO authenticated
  USING (auth.uid()::text = id)
  WITH CHECK (auth.uid()::text = id);

-- Optional: allow users to delete their backup row
-- CREATE POLICY "expense_tracker_delete_own"
--   ON expense_tracker_data FOR DELETE
--   TO authenticated
--   USING (auth.uid()::text = id);
