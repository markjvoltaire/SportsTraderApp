-- Create the users table that accepts the flat Privy user payload
-- (one column per key: user-level fields + linked_account_0_*, linked_account_1_*, ...).
-- Run in Supabase: SQL Editor → New query → paste → Run.
--
-- Supports 2 linked account slots (0 and 1). Add linked_account_2_* columns if needed.

CREATE TABLE IF NOT EXISTS public.users (
  -- User-level (Privy)
  id text PRIMARY KEY,
  created_at bigint,
  has_accepted_terms boolean,
  is_guest boolean,
  mfa_methods jsonb,

  -- Linked account 0 (phone or wallet)
  linked_account_0_type text,
  linked_account_0_first_verified_at bigint,
  linked_account_0_latest_verified_at bigint,
  linked_account_0_verified_at bigint,
  linked_account_0_number text,
  linked_account_0_phoneNumber text,
  linked_account_0_address text,
  linked_account_0_chain_id text,
  linked_account_0_chain_type text,
  linked_account_0_connector_type text,
  linked_account_0_delegated boolean,
  linked_account_0_id text,
  linked_account_0_imported boolean,
  linked_account_0_public_key text,
  linked_account_0_recovery_method text,
  linked_account_0_wallet_client text,
  linked_account_0_wallet_client_type text,
  linked_account_0_wallet_index integer,

  -- Linked account 1 (phone or wallet)
  linked_account_1_type text,
  linked_account_1_first_verified_at bigint,
  linked_account_1_latest_verified_at bigint,
  linked_account_1_verified_at bigint,
  linked_account_1_number text,
  linked_account_1_phoneNumber text,
  linked_account_1_address text,
  linked_account_1_chain_id text,
  linked_account_1_chain_type text,
  linked_account_1_connector_type text,
  linked_account_1_delegated boolean,
  linked_account_1_id text,
  linked_account_1_imported boolean,
  linked_account_1_public_key text,
  linked_account_1_recovery_method text,
  linked_account_1_wallet_client text,
  linked_account_1_wallet_client_type text,
  linked_account_1_wallet_index integer,

  -- App metadata
  row_created_at timestamptz NOT NULL DEFAULT now(),
  row_updated_at timestamptz NOT NULL DEFAULT now()
);

-- Index for wallet lookups (use whichever linked_account_*_address you use as canonical)
CREATE INDEX IF NOT EXISTS idx_users_linked_account_0_address ON public.users (linked_account_0_address);
CREATE INDEX IF NOT EXISTS idx_users_linked_account_1_address ON public.users (linked_account_1_address);

-- Optional: RLS
-- ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Users can read own row" ON public.users FOR SELECT USING (true);
-- CREATE POLICY "Users can upsert own row" ON public.users FOR ALL USING (true) WITH CHECK (true);
