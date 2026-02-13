-- Add one column per Privy user key (run on existing table).
-- Run in Supabase: SQL Editor → New query → paste → Run.

-- Add columns for each Privy user field
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS privy_created_at bigint,
  ADD COLUMN IF NOT EXISTS privy_has_accepted_terms boolean,
  ADD COLUMN IF NOT EXISTS privy_is_guest boolean,
  ADD COLUMN IF NOT EXISTS privy_linked_accounts jsonb,
  ADD COLUMN IF NOT EXISTS privy_mfa_methods jsonb;

-- Optional: remove the single-jsonb column after migrating
-- ALTER TABLE public.users DROP COLUMN IF EXISTS privy_user;
