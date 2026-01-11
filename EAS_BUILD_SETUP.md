# EAS Build Setup Guide

## Environment Variables for Production Builds

To prevent crashes in TestFlight/production builds, you need to set environment variables in EAS secrets.

### Required Environment Variables

1. **Privy Configuration** (Required)
   - `EXPO_PUBLIC_PRIVY_APP_ID` - Your Privy App ID
   - `EXPO_PUBLIC_PRIVY_CLIENT_ID` - Your Privy Client ID

2. **Crossmint Configuration** (Optional)
   - `EXPO_PUBLIC_CROSSMINT_CLIENT_SIDE_API_KEY` - Crossmint API key

3. **Supabase Configuration** (Optional)
   - `EXPO_PUBLIC_SUPABASE_URL` - Your Supabase project URL
   - `EXPO_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anonymous key

## Setting Up EAS Secrets

### Option 1: Using EAS CLI (Recommended)

Run these commands to set secrets for your project:

```bash
# Set Privy secrets (REQUIRED)
eas secret:create --scope project --name EXPO_PUBLIC_PRIVY_APP_ID --value your-privy-app-id
eas secret:create --scope project --name EXPO_PUBLIC_PRIVY_CLIENT_ID --value your-privy-client-id

# Set Crossmint secret (optional)
eas secret:create --scope project --name EXPO_PUBLIC_CROSSMINT_CLIENT_SIDE_API_KEY --value your-crossmint-key

# Set Supabase secrets (optional)
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_URL --value your-supabase-url
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value your-supabase-anon-key
```

### Option 2: Using EAS Dashboard

1. Go to https://expo.dev/accounts/[your-account]/projects/[your-project]/secrets
2. Add each environment variable as a secret
3. Make sure the names match exactly (e.g., `EXPO_PUBLIC_PRIVY_APP_ID`)

### Option 3: Using eas.json (Not Recommended for Sensitive Data)

You can also set environment variables directly in `eas.json`, but this is NOT recommended for production builds as it exposes sensitive data. The current `eas.json` includes placeholders for reference.

## Verifying Secrets

After setting secrets, verify they're configured:

```bash
eas secret:list
```

## Building for Production

Once secrets are set, build your app:

```bash
# iOS production build
eas build --platform ios --profile production

# Android production build
eas build --platform android --profile production
```

## What Happens If Secrets Are Missing?

- **In Development (`__DEV__ = true`)**: The app will use placeholder values and show warnings
- **In Production (`__DEV__ = false`)**: 
  - Missing Privy credentials: The app will show a configuration error screen instead of crashing
  - Missing optional credentials: The app will still run but related features won't work

## Troubleshooting

### App Crashes in TestFlight

1. Check that all required secrets are set: `eas secret:list`
2. Verify secret names match exactly (case-sensitive)
3. Check build logs for environment variable warnings
4. The ErrorBoundary will now catch most errors and show a helpful message instead of crashing

### Configuration Error Screen Appears

This means Privy credentials are missing or invalid. Check:
- Secrets are set in EAS
- Secret names are correct
- Values are not placeholder values
- Rebuild after setting secrets

## Notes

- Environment variables prefixed with `EXPO_PUBLIC_` are embedded at build time
- Secrets are encrypted and only available during the build process
- After setting secrets, you must rebuild the app for them to take effect
- The ErrorBoundary component now wraps the entire app to catch any initialization errors

