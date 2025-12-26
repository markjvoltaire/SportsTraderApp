import { checkPolymarketStatus } from "../services/walletService";
import API_BASE_URL from "../config/api";

async function fetchJson(path, { method = "GET", body, authToken } = {}) {
  const headers = {};
  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
  }
  if (authToken) {
    headers.Authorization = `Bearer ${authToken}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    let message = `Request failed (${response.status})`;
    try {
      const errorJson = await response.json();
      message =
        errorJson?.message || errorJson?.details || errorJson?.error || message;
    } catch (_e) {
      // ignore json parsing errors
    }
    throw new Error(message);
  }

  try {
    const jsonData = await response.json();
    return jsonData;
  } catch (_e) {
    return null;
  }
}

/**
 * Get user wallet information from backend
 * Note: This requires an auth token, but for compatibility with existing code,
 * it will try to get wallet info from the backend API
 */
export async function getUserWallet(privyUserId, authToken = null) {
  try {
    // Try to get wallet from backend setup endpoint
    const userIdEnc = encodeURIComponent(privyUserId);
    
    if (authToken) {
      try {
        const data = await fetchJson(`/api/users/${userIdEnc}/setup`, {
          method: "GET",
          authToken,
        });
        
        if (data && (data.walletAddress || data.wallet_address)) {
          return {
            hasWallet: true,
            walletAddress: data.walletAddress || data.wallet_address,
            privyWalletId: data.privyWalletId || data.privy_wallet_id || data.walletAddress || data.wallet_address,
          };
        }
      } catch (error) {
        // Could not fetch wallet from backend
      }
    }
    
    // Fallback: return no wallet (component should use embedded wallet or backendSetup from AuthContext)
    return {
      hasWallet: false,
      walletAddress: null,
      privyWalletId: null,
    };
  } catch (error) {
    return {
      hasWallet: false,
      walletAddress: null,
      privyWalletId: null,
    };
  }
}

/**
 * Check if user is linked to Polymarket
 * Uses backend API to check Polymarket link status
 */
export async function isPolymarketLinked(privyUserId, authToken = null) {
  try {
    if (authToken) {
      const userIdEnc = encodeURIComponent(privyUserId);
      const data = await fetchJson(
        `/api/orders/users/${userIdEnc}/polymarket-status`,
        {
          method: "GET",
          authToken,
        }
      );
      
      if (data) {
        return {
          linked: data.linked || data.polymarketLinked || false,
          linkedAt: data.linkedAt || data.linked_at || null,
        };
      }
    }
    
    // Fallback: return not linked
    return {
      linked: false,
      linkedAt: null,
    };
  } catch (error) {
    return {
      linked: false,
      linkedAt: null,
    };
  }
}

