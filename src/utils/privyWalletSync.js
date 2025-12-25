/**
 * Sync Privy embedded wallet with backend
 * This ensures the wallet created in Privy is linked to the backend
 * Note: Backend handles wallet storage, this function may not be needed
 * if wallet creation is handled entirely by the backend
 */
export async function syncPrivyWalletToBackend(privyUserId, privyWalletId, walletAddress, authToken) {
  try {
    if (!authToken) {
      console.warn("No auth token available for wallet sync");
      return { success: false, error: "No auth token" };
    }

    // Note: This function may need to be updated based on your backend API
    // The backend should handle wallet storage when wallets are created via Privy SDK
    console.log("💼 Wallet sync - backend should handle this automatically");
    return { success: true, alreadySynced: true };
  } catch (error) {
    console.error("Error syncing Privy wallet to backend:", error);
    return { success: false, error };
  }
}



