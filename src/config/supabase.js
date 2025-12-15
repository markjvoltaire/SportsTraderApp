import { createClient } from "@supabase/supabase-js";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Supabase project URL and anon key
// You can find the anon key in your Supabase project settings > API
// Support both EXPO_PUBLIC_ prefixed and non-prefixed env vars
const SUPABASE_URL =
  process.env.EXPO_PUBLIC_SUPABASE_URL ||
  process.env.SUPABASE_URL ||
  "https://tuoumlfvwmittqlnzpvg.supabase.co";
const SUPABASE_ANON_KEY =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  "YOUR_SUPABASE_ANON_KEY";

// Debug: Log configuration (only first few chars of key for security)
console.log("🔧 Supabase Config:", {
  url: SUPABASE_URL,
  hasAnonKey:
    !!SUPABASE_ANON_KEY && SUPABASE_ANON_KEY !== "YOUR_SUPABASE_ANON_KEY",
  keyPreview: SUPABASE_ANON_KEY?.substring(0, 20) + "...",
  envUrlExpo: process.env.EXPO_PUBLIC_SUPABASE_URL ? "✅ Set" : "❌ Not set",
  envUrl: process.env.SUPABASE_URL ? "✅ Set" : "❌ Not set",
  envKeyExpo: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
    ? "✅ Set"
    : "❌ Not set",
  envKey: process.env.SUPABASE_ANON_KEY ? "✅ Set" : "❌ Not set",
});

// Validate configuration
if (!SUPABASE_URL || SUPABASE_URL.includes("YOUR_SUPABASE")) {
  console.warn("⚠️ Supabase URL is not configured properly");
}

const isAnonKeyConfigured =
  SUPABASE_ANON_KEY && SUPABASE_ANON_KEY !== "YOUR_SUPABASE_ANON_KEY";

if (!isAnonKeyConfigured) {
  console.error(
    "❌ Supabase anon key is not configured!\n" +
      "Please do one of the following:\n" +
      "1. Create a .env file with: EXPO_PUBLIC_SUPABASE_ANON_KEY=your_key_here\n" +
      "2. Or update src/config/supabase.js directly\n" +
      "Get your key from: Supabase Dashboard > Project Settings > API > anon public key"
  );
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Export a helper to check if configured
export const isSupabaseConfigured = () => isAnonKeyConfigured;
