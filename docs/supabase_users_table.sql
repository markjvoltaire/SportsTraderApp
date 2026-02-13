-- Create the users table for Privy + Supabase sync.
-- Run this in Supabase: SQL Editor → New query → paste → Run.
--
-- Privy user shape → columns (one column per key):
--   id                    → id (PK)
--   created_at            → privy_created_at (bigint, unix)
--   has_accepted_terms    → privy_has_accepted_terms
--   is_guest              → privy_is_guest
--   linked_accounts       → privy_linked_accounts (phone, wallet, etc.)
--   mfa_methods           → privy_mfa_methods
-- App backend / other:
--   privy_wallet_id, wallet_address, polymarket_linked_at, created_at, updated_at

CREATE TABLE IF NOT EXISTS public.users (
  id text PRIMARY KEY,
  privy_wallet_id text,
  wallet_address text,
  polymarket_linked_at timestamptz,
  privy_created_at bigint,
  privy_has_accepted_terms boolean,
  privy_is_guest boolean,
  privy_linked_accounts jsonb,
  privy_mfa_methods jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Optional: index for looking up by wallet_address
CREATE INDEX IF NOT EXISTS idx_users_wallet_address ON public.users (wallet_address);

-- Optional: enable RLS and allow anon to read/upsert their own row by id
-- (Adjust policy to match your auth: e.g. use a custom claim or allow service role only.)
-- ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Users can read own row" ON public.users FOR SELECT USING (true);
-- CREATE POLICY "Users can upsert own row" ON public.users FOR ALL USING (true) WITH CHECK (true);
