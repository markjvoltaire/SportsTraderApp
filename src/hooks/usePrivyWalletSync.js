import { useEffect, useState } from "react";
import { usePrivy, useEmbeddedSolanaWallet } from "@privy-io/expo";
import { useAuth } from "../contexts/AuthContext";
import { syncPrivyWalletToBackend } from "../utils/privyWalletSync";

/**
 * Hook to sync Privy embedded wallet with backend when user logs in
 */
export function usePrivyWalletSync() {
  const { user: supabaseUser } = useAuth();
  const { ready: privyReady, authenticated: privyAuthenticated } = usePrivy();
  const solanaWalletCtx = useEmbeddedSolanaWallet();
  const [syncing, setSyncing] = useState(false);
  const [synced, setSynced] = useState(false);

  const wallets = solanaWalletCtx?.wallets;
  const createWallet = solanaWalletCtx?.create;

  useEffect(() => {
    async function syncWallet() {
      if (!supabaseUser?.id || !privyReady || syncing || synced) {
        return;
      }

      const embeddedWallet =
        Array.isArray(wallets) && wallets.length > 0 ? wallets[0] : null;

      if (embeddedWallet && embeddedWallet.address) {
        setSyncing(true);
        try {
          const walletId = embeddedWallet.address;
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
        setSyncing(true);
        try {
          const newWallet = await createWallet();
          if (newWallet && newWallet.address) {
            const walletId = newWallet.address;
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






