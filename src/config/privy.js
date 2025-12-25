/**
 * Privy configuration
 * Policy IDs are used to authorize server-side operations on wallets
 */

// Get Privy Policy ID from environment variable
// This should be set in your .env file as EXPO_PUBLIC_PRIVY_POLICY_ID
// You can find this in your Privy dashboard under Policies or from your backend configuration
export const PRIVY_POLICY_ID = process.env.EXPO_PUBLIC_PRIVY_POLICY_ID || null;

// Log for debugging at module load time
if (PRIVY_POLICY_ID) {
  console.log("✅ Privy Policy ID loaded:", PRIVY_POLICY_ID.substring(0, 8) + "...");
} else {
  console.warn("⚠️ EXPO_PUBLIC_PRIVY_POLICY_ID not set. Server-side wallet operations may fail.");
}

// Array of policy IDs to use for wallet operations
// Add more policy IDs here if needed (e.g., for different contract interactions)
export const PRIVY_POLICY_IDS = PRIVY_POLICY_ID ? [PRIVY_POLICY_ID] : [];

/**
 * Get policy IDs for wallet operations
 * @returns {string[]} Array of policy IDs
 */
export function getPolicyIds() {
  if (!PRIVY_POLICY_ID) {
    console.warn(
      "⚠️ EXPO_PUBLIC_PRIVY_POLICY_ID not set. Server-side wallet operations may fail."
    );
    return [];
  }
  return PRIVY_POLICY_IDS;
}

