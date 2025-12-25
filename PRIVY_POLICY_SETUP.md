# Privy Policy ID Setup

## Overview

Policy IDs are required for server-side wallet operations (like signing token approvals). The backend needs these policy IDs to authorize transactions on behalf of users.

## Getting Your Policy ID

The Privy Policy ID should be found in one of these places:

1. **Privy Dashboard:**
   - Go to your Privy Dashboard
   - Navigate to Policies section
   - Find the policy that allows `eth_sendTransaction` for token contract approvals
   - Copy the Policy ID (format: `dea4xu1iqj2lauk3n5s7f9e1`)

2. **Backend Configuration:**
   - Check your backend's `TESTING_PRIVY.md` or environment variables
   - Look for `PRIVY_POLICY_ID` or similar configuration
   - The backend might have the policy ID in its config

3. **Backend API:**
   - Some backends expose an endpoint to get configuration
   - Check if there's a `/api/config` or similar endpoint

## Setup

1. **Add to Environment Variables:**
   
   Create or update your `.env` file in the root directory:
   ```
   EXPO_PUBLIC_PRIVY_POLICY_ID=your-policy-id-here
   ```

   Replace `your-policy-id-here` with your actual Privy Policy ID.

2. **Restart the App:**
   
   After adding the environment variable, restart your Expo development server:
   ```bash
   npm start
   # or
   npx expo start
   ```

## How It Works

- When a wallet is created client-side, the app sends the policy IDs to the backend setup endpoint
- The backend uses these policy IDs to authorize server-side operations on the wallet
- Without policy IDs, you'll get a 401 error: "No valid authorization keys or user signing keys available"

## Troubleshooting

- **If policy ID is not set:** You'll see a warning in the logs: `⚠️ EXPO_PUBLIC_PRIVY_POLICY_ID not set`
- **If backend still gets 401:** Verify the policy ID is correct and the policy allows the required operations
- **To verify it's working:** Check the logs for `📡 Calling setupPrivyUser with wallet info:` - it should show your policy IDs

