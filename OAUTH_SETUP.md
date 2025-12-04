# OAuth & Phone Authentication Setup Guide

## Prerequisites

All required packages have been installed:

- `expo-auth-session` - For OAuth flows
- `expo-web-browser` - For opening OAuth URLs
- `expo-crypto` - For PKCE (security)
- `expo-apple-authentication` - For Apple Sign In (iOS only)

## Supabase Configuration

### 1. Google OAuth Setup

1. **Get Google OAuth Credentials:**

   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select existing one
   - Enable Google+ API
   - Go to "Credentials" → "Create Credentials" → "OAuth client ID"
   - Create credentials for:
     - **Web application** (for Supabase)
     - **iOS** (if testing on iOS)
     - **Android** (if testing on Android)

2. **Configure in Supabase:**
   - Go to your Supabase Dashboard → Authentication → Providers
   - Enable "Google"
   - Enter your Google Client ID and Client Secret
   - Add redirect URL: `sportstraderapp://auth/callback`
   - Save

### 2. Apple Sign In Setup (iOS only)

1. **Get Apple Credentials:**

   - Go to [Apple Developer Portal](https://developer.apple.com/account/)
   - Create a Services ID
   - Create a Key for Sign in with Apple
   - Download the private key (.p8 file)

2. **Configure in Supabase:**
   - Go to Supabase Dashboard → Authentication → Providers
   - Enable "Apple"
   - Enter:
     - Services ID
     - Team ID
     - Key ID
     - Upload the private key (.p8 file)
   - Save

### 3. Phone Authentication Setup

1. **Configure SMS Provider in Supabase:**

   - Go to Supabase Dashboard → Authentication → Providers
   - Enable "Phone"
   - Configure an SMS provider:
     - **Twilio** (recommended) - Get credentials from [Twilio](https://www.twilio.com/)
     - **MessageBird** - Alternative option
   - Enter your SMS provider credentials
   - Save

2. **Note:** Phone authentication requires a paid SMS service. For development, you can use Supabase's test mode.

## App Configuration

The app is already configured with:

- URL scheme: `sportstraderapp://` (in app.json)
- OAuth redirect handling in AuthContext
- Phone number formatting in PhoneAuthScreen

## Testing

### Google Sign In:

1. Tap "Continue with Google" on Login screen
2. Browser will open for Google authentication
3. After signing in, you'll be redirected back to the app

### Apple Sign In (iOS only):

1. Tap "Continue with Apple" on Login screen
2. Apple authentication modal will appear
3. Complete authentication

### Phone Authentication:

1. Tap "Continue with Phone" on Login screen
2. Enter your phone number (format: (555) 123-4567)
3. Receive SMS code
4. Enter the 6-digit code to verify

## Troubleshooting

### Google OAuth not working:

- Check that redirect URL matches in both Google Console and Supabase
- Ensure the URL scheme is properly configured in app.json
- Check browser console for errors

### Apple Sign In not showing:

- Only available on iOS devices (not simulator in some cases)
- Ensure Apple Sign In is enabled in your Apple Developer account
- Check that bundle identifier matches

### Phone authentication not sending SMS:

- Verify SMS provider is configured in Supabase
- Check that you have credits/balance in your SMS provider account
- For development, check Supabase logs for errors

## Security Notes

- The anon key is safe to use in the frontend
- OAuth redirects are handled securely via deep linking
- Phone numbers are validated before sending OTP
- All authentication flows use Supabase's secure infrastructure

