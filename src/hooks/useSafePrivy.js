import { usePrivy, useEmbeddedEthereumWallet } from "@privy-io/expo";

/**
 * Safe wrapper for Privy hooks that handles cases where PrivyProvider
 * isn't properly initialized or configured
 */
export function useSafePrivy() {
  let privyContext = null;
  let walletContext = null;
  let error = null;

  try {
    privyContext = usePrivy();
  } catch (err) {
    error = err;
    console.warn("Privy context error:", err?.message || "PrivyProvider not properly initialized");
  }

  try {
    walletContext = useEmbeddedEthereumWallet();
  } catch (err) {
    // If wallet context fails, that's okay - we'll continue without it
    if (!error) {
      error = err;
    }
    console.warn("Embedded wallet context error:", err?.message || "PrivyProvider not properly initialized");
  }

  // Safely extract values with null checks
  // Privy Expo SDK uses 'isReady' (not 'ready') and 'user' for authentication status
  const privyReady = privyContext?.isReady ?? false;
  const privyAuthenticated = !!privyContext?.user;
  const privyWallets = walletContext?.wallets ?? null;
  const createWallet = walletContext?.create ?? null;

  // Check if Privy is actually available (not just placeholder)
  const isPrivyAvailable = privyContext !== null && !error;

  return {
    privyContext,
    walletContext,
    privyReady,
    privyAuthenticated,
    privyWallets,
    createWallet,
    isPrivyAvailable,
    error,
  };
}

