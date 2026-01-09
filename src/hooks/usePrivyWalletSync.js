import { useEffect, useState } from "react";
import { usePrivy, useEmbeddedEthereumWallet } from "@privy-io/expo";
import { useAuth } from "../contexts/AuthContext";
import { syncPrivyWalletToBackend } from "../utils/privyWalletSync";

/**
 * Hook to sync Privy embedded wallet with backend when user logs in
 */
export function usePrivyWalletSync() {
  const { user: supabaseUser } = useAuth();
  const { ready: privyReady, authenticated: privyAuthenticated } = usePrivy();
  const { wallets, createWallet } = useEmbeddedEthereumWallet();
  const [syncing, setSyncing] = useState(false);
  const [synced, setSynced] = useState(false);

  useEffect(() => {
    async function syncWallet() {
      // Wait for both Supabase user and Privy to be ready
      if (!supabaseUser?.id || !privyReady || syncing || synced) {
        return;
      }

      // Find embedded wallet
      const embeddedWallet = wallets && wallets.length > 0 ? wallets[0] : null;

      if (embeddedWallet && embeddedWallet.address) {
        // Wallet exists - sync it to backend
        setSyncing(true);
        try {
          // For Privy Expo SDK, wallet.id might be the privy_wallet_id
          // We'll use the wallet address to identify it
          const walletId = embeddedWallet.id || embeddedWallet.address;
          const result = await syncPrivyWalletToBackend(
            supabaseUser.id,
            walletId,
            embeddedWallet.address
          );
          if (result.success) {
            setSynced(true);
          }
        } catch (error) {
          // Error syncing wallet
        } finally {
          setSyncing(false);
        }
      } else if (privyAuthenticated && createWallet) {
        // No embedded wallet yet - create one
        setSyncing(true);
        try {
          const newWallet = await createWallet();
          if (newWallet && newWallet.address) {
            // Sync the newly created wallet
            const walletId = newWallet.id || newWallet.address;
            const result = await syncPrivyWalletToBackend(
              supabaseUser.id,
              walletId,
              newWallet.address
            );
            if (result.success) {
              setSynced(true);
            }
          }
        } catch (error) {
          // Error creating wallet
        } finally {
          setSyncing(false);
        }
      }
    }

    syncWallet();
  }, [supabaseUser?.id, privyReady, wallets, privyAuthenticated, syncing, synced, createWallet]);

  return { syncing, synced };
}






