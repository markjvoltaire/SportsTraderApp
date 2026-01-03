# Supabase Authentication Setup

## Configuration Steps

1. **Get your Supabase credentials:**
   - Go to your Supabase project dashboard
   - Navigate to Settings > API
   - Copy your Project URL and anon/public key

2. **Set up environment variables:**
   
   Create a `.env` file in the root directory:
   ```
   EXPO_PUBLIC_SUPABASE_URL=your_supabase_project_url
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

   Or update `src/config/supabase.js` directly with your credentials.

3. **Install dependencies (if not already installed):**
   ```bash
   npm install @supabase/supabase-js @react-native-async-storage/async-storage
   ```

4. **Configure Supabase Email Templates:**
   - Go to Authentication > Email Templates in Supabase dashboard
   - Customize the "Reset Password" template if needed
   - The redirect URL should match: `sportstraderapp://reset-password`

5. **Test the authentication flow:**
   - Run the app
   - You should see the Welcome screen first
   - Sign up with a new email
   - Check your email for verification (if email confirmation is enabled)
   - Sign in with your credentials
   - Test password reset functionality

## Features Implemented

- ✅ Welcome Screen
- ✅ Login/Sign Up Screen (toggle between modes)
- ✅ Forgot Password Screen
- ✅ Logout functionality in Profile Screen
- ✅ Automatic session management
- ✅ Protected routes (app requires authentication)

## Notes

- The app will automatically show the Welcome/Login screens if the user is not authenticated
- Sessions are persisted using AsyncStorage
- Password reset emails are sent via Supabase
- The Profile tab has been added to the bottom navigation with logout functionality












