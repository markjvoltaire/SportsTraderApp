# Privy Native App Identifier Setup

## Overview

Privy requires you to configure your app's native identifiers (Bundle ID for iOS and Package Name for Android) in the Privy dashboard. This ensures that only your authorized mobile applications can use your Privy App ID, enhancing security.

## Current App Identifiers

Based on your `app.json` configuration:

- **iOS Bundle Identifier:** `com.markjvoltaire.SportsTraderApp`
- **Android Package Name:** `com.markjvoltaire.SportsTraderApp`
- **URL Scheme:** `scoretrade`

## Setup Steps

### 1. Navigate to Privy Dashboard

1. Go to [Privy Dashboard](https://dashboard.privy.io/)
2. Log in to your account
3. Select your app

### 2. Configure App Clients

1. Navigate to the **App Clients** section (or **Settings** → **App Clients**)
2. Find your existing app client or click **Add App Client** to create a new one
3. In the app client configuration, you'll see a section for **Allowed Application Identifiers**

### 3. Add Native App Identifiers

Add the following identifiers:

**For iOS:**
```
com.markjvoltaire.SportsTraderApp
```

**For Android:**
```
com.markjvoltaire.SportsTraderApp
```

**For Development (Expo Go):**
If you're using Expo Go for development, also add:
```
host.exp.Exponent
```

### 4. Configure URL Scheme

1. In the same **App Clients** section, find the **Allowed URL Schemes** section
2. Add your app's URL scheme:
```
scoretrade
```

**For Development (Expo Go):**
If you're using Expo Go for development, also add:
```
exp
```

### 5. Save Configuration

1. Click **Save** or **Update** to save your changes
2. Wait a few moments for the changes to propagate

## Verification

After configuring the native app identifiers:

1. **Restart your app** (fully close and reopen it)
2. Try sending an SMS code again
3. The error "Native app ID has not been set as an allowed app identifier" should no longer appear

## Troubleshooting

### Error Still Appears After Configuration

1. **Wait a few minutes**: Configuration changes may take a few moments to propagate
2. **Verify the identifiers match exactly**: 
   - Check that the bundle identifier in `app.json` matches exactly what you entered in Privy
   - No extra spaces or typos
3. **Check you're using the correct Privy app**: Ensure you're configuring the same Privy app that matches your `EXPO_PUBLIC_PRIVY_APP_ID`
4. **Rebuild your app**: If you're using EAS Build, you may need to rebuild your app after configuration
5. **Clear app data**: On iOS/Android, try clearing the app's data/cache and reinstalling

### For Production Builds

When building for production:

1. Ensure your production bundle identifier matches what's configured in Privy
2. If using different bundle identifiers for staging/production, add both to Privy
3. Double-check that your `EXPO_PUBLIC_PRIVY_APP_ID` and `EXPO_PUBLIC_PRIVY_CLIENT_ID` environment variables are set correctly for production builds

### For Development with Expo Go

If you're testing with Expo Go:

- Add `host.exp.Exponent` to allowed application identifiers
- Add `exp` to allowed URL schemes
- Note: Expo Go may have limitations, consider using development builds for better SMS testing

## Additional Notes

- Each app client in Privy can have multiple allowed application identifiers
- You can add both development and production bundle identifiers to the same app client
- The URL scheme is used for deep linking and authentication callbacks
- Keep your bundle identifiers consistent across your development and production environments where possible
