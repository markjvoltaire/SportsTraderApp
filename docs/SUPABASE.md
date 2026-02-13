# Supabase setup

The app uses **Supabase** for user profiles and wallet sync (e.g. `users` table). Connection is handled in `src/contexts/SupabaseContext.jsx`.

## 1. Environment variables

In your project root, create or edit `.env` and set:

```bash
EXPO_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

Get these from the [Supabase dashboard](https://supabase.com/dashboard): your project → **Project Settings** → **API** (Project URL and anon/public key).

Expo only exposes variables prefixed with `EXPO_PUBLIC_` to the client, so use these names exactly.

## 2. Restart after changing .env

After changing `.env`, restart the dev server:

```bash
npx expo start
```

## 3. Verifying the connection

- The app initializes Supabase on load and runs a minimal query to verify reachability.
- `useSupabase()` exposes:
  - `isConfigured` – true when both env vars are set
  - `connectionVerified` – true after a successful ping to your project
  - `error` – set if configuration is missing or the connection check fails

If `isConfigured` is false, add or fix the two env vars above. If `connectionVerified` is false but `isConfigured` is true, check your Supabase project URL/key and network.

## 4. Storing the Privy user (one column per field)

On login, the app upserts the Privy user into the `users` table so you have the full profile (id, linked_accounts, phone, etc.) in your database. This uses the columns:

- `id` – Privy user id (e.g. `did:privy:...`), primary key
- `privy_user` – JSONB, the full Privy user object
- `updated_at` – set on each sync

Add the column if it doesn’t exist (Supabase SQL editor or migration):

For an existing table, run `docs/supabase_users_privy_columns.sql` to add the per-field columns.

RLS must allow the client to insert/update its own row (e.g. by `id`). If upserts fail from the app, add a policy or perform the write from your backend after validating the Privy JWT.
