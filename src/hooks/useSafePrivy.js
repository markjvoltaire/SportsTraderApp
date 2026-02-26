import { usePrivy, useEmbeddedSolanaWallet } from "@privy-io/expo";

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
  }

  try {
    walletContext = useEmbeddedSolanaWallet();
  } catch (err) {
    if (!error) {
      error = err;
    }
  }

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

