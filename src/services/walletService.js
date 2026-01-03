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

  // Some endpoints may return no body
  try {
    const jsonData = await response.json();
    return jsonData;
  } catch (_e) {
    return null;
  }
}

/**
 * Create a Privy wallet via backend API
 * NOTE: In the new flow, wallets are created client-side via Privy embedded wallets.
 * Keep this for optional server-side wallet creation if needed later.
 */
export async function createPrivyWallet(
  privyUserId,
  { policyIds = [] } = {},
  authToken
) {
  try {
    const userIdEnc = encodeURIComponent(privyUserId);
    const data = await fetchJson(`/api/users/${userIdEnc}/create-wallet`, {
      method: "POST",
      body: { policyIds },
      authToken,
    });
    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
}

/**
 * Link user to Polymarket via backend
 * This sets up token allowances and creates Polymarket credentials
 */
export async function linkUserToPolymarket(
  privyUserId,
  authToken,
  { sponsorGas = true, privyWalletId, walletAddress } = {}
) {
  try {
    const userIdEnc = encodeURIComponent(privyUserId);
    const data = await fetchJson(
      `/api/orders/users/${userIdEnc}/link-polymarket`,
      {
        method: "POST",
        body: {
          sponsorGas,
          ...(privyWalletId ? { privyWalletId } : {}),
          ...(walletAddress ? { walletAddress } : {}),
        },
        authToken,
      }
    );

    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
}

/**
 * Check Polymarket link status via backend
 */
export async function checkPolymarketStatus(privyUserId, authToken) {
  try {
    const userIdEnc = encodeURIComponent(privyUserId);
    const data = await fetchJson(
      `/api/orders/users/${userIdEnc}/polymarket-status`,
      {
        method: "GET",
        authToken,
      }
    );
    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
}

/**
 * Complete user setup via backend.
 * Recommended flow: call once after Privy signup/login (profile creation).
 *
 * Backend should be idempotent and return existing wallet/credentials when present.
 */
export async function setupPrivyUser(
  privyUserId,
  { 
    policyIds = [], 
    sponsorGas = true, 
    linkPolymarket = true,
    privyWalletId = null,
    walletAddress = null,
    privyUserJwt = null,
  } = {},
  authToken
  ) {
    try {
      if (!privyUserId) throw new Error("privyUserId is required");

      const userIdEnc = encodeURIComponent(privyUserId);

    const body = {
      policyIds,
      sponsorGas,
      linkPolymarket,
    };

    // Include wallet info if provided (legacy - for client-side created wallets)
    // Note: If wallet was created client-side, we'd send privyWalletId/walletAddress
    // But now backend creates wallet, so these are optional
    if (privyWalletId) {
      body.privyWalletId = privyWalletId;
    }
    if (walletAddress) {
      body.walletAddress = walletAddress;
    }
    
    // ============================================================
    // 🔑 CRITICAL: Include JWT so backend can create wallet
    // ============================================================
    // The privyUserJwt (access token) is required for backend to:
    //   1. Authenticate the user with Privy
    //   2. Create a wallet on behalf of the user
    //   3. Link the wallet to the user's Privy account
    // ============================================================
    if (privyUserJwt) {
      body.privyUserJwt = privyUserJwt;
    }

    // ============================================================
    // 📡 HTTP REQUEST - THIS SENDS THE REQUEST TO BACKEND
    // ============================================================
    // Makes POST request to backend endpoint
    // Backend receives request and creates wallet using privyUserJwt
    // ============================================================
    const data = await fetchJson(`/api/users/${userIdEnc}/setup`, {
      method: "POST",
      body,
      authToken,
    });

    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
}

/**
 * Complete wallet setup flow (legacy - use setupUser instead):
 * Kept for backward compatibility.
 */
export async function setupWalletAndPolymarket(
  privyUserId,
  { policyIds = [], sponsorGas = true, linkPolymarket = true } = {},
  authToken
) {
  return setupPrivyUser(
    privyUserId,
    { policyIds, sponsorGas, linkPolymarket },
    authToken
  );
}

/**
 * Get wallet balance
 */
export async function getWalletBalance(privyUserId, authToken) {
  try {
    const userIdEnc = encodeURIComponent(privyUserId);
    const data = await fetchJson(`/api/users/${userIdEnc}/balance`, {
      method: "GET",
      authToken,
    });
    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
}

/**
 * Process fiat payment and convert to credits/balance
 * This endpoint handles fiat-to-crypto conversion behind the scenes
 */
export async function processFiatPayment(
  privyUserId,
  { amount, paymentMethod },
  authToken
) {
  try {
    const userIdEnc = encodeURIComponent(privyUserId);
    const data = await fetchJson(`/api/onramp`, {
      method: "POST",
      body: {
        amount,
        paymentMethod,
        userId: privyUserId,
      },
      authToken,
    });
    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
}

/**
 * Deposit funds via card using Privy onramp API
 * Initiates a card-based fiat onramp via Privy (Coinbase)
 * Funds user's wallet with USDC on Base chain
 */
export async function depositCard(privyUserId, { amount, card }, authToken) {
  try {
    const data = await fetchJson(`/api/deposit-card`, {
      method: "POST",
      body: {
        user_id: privyUserId,
        amount: amount.toString(),
        card: {
          number: card.number,
          exp_month: card.exp_month,
          exp_year: card.exp_year,
          cvc: card.cvc,
        },
      },
      authToken,
    });
    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
}

// Backward compatible export name (older code may import setupUser)
export const setupUser = setupPrivyUser;
