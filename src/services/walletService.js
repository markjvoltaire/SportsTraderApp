import API_BASE_URL from "../config/api";

async function fetchJson(path, { method = "GET", body, authToken } = {}) {
  console.log("📡 fetchJson called:", {
    url: `${API_BASE_URL}${path}`,
    method,
    hasBody: !!body,
    hasAuthToken: !!authToken
  });

  if (body) {
    console.log("📦 Request body:", JSON.stringify(body, null, 2));
  }

  const headers = {};
  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
  }
  if (authToken) {
    headers.Authorization = `Bearer ${authToken}`;
  }

  console.log("⏳ Making HTTP request...");
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  console.log("📥 Response received:", {
    status: response.status,
    statusText: response.statusText,
    ok: response.ok
  });

  if (!response.ok) {
    console.log("❌ HTTP request failed:", response.status, response.statusText);
    let message = `Request failed (${response.status})`;
    try {
      const errorJson = await response.json();
      console.log("❌ Error response JSON:", errorJson);
      message =
        errorJson?.message || errorJson?.details || errorJson?.error || message;
    } catch (_e) {
      console.log("❌ Could not parse error response as JSON");
      // ignore json parsing errors
    }
    console.log("💥 Throwing error:", message);
    throw new Error(message);
  }

  // Some endpoints may return no body
  try {
    const jsonData = await response.json();
    console.log("📄 Response JSON:", jsonData);
    return jsonData;
  } catch (_e) {
    console.log("⚠️ Response was not JSON");
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
    console.error("Error creating Privy wallet:", error);
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
    console.error("Error linking to Polymarket:", error);
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
    console.error("Error checking Polymarket status:", error);
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
  console.log("🔧 setupPrivyUser called with:", {
    privyUserId: privyUserId?.substring(0, 8) + "...",
    policyIds,
    sponsorGas,
    linkPolymarket,
    privyWalletId: privyWalletId ? privyWalletId.substring(0, 8) + "..." : "null",
    walletAddress: walletAddress || "null",
    hasJwt: !!privyUserJwt,
    hasAuthToken: !!authToken
  });

  try {
    if (!privyUserId) throw new Error("privyUserId is required");

    const userIdEnc = encodeURIComponent(privyUserId);
    
    // ============================================================
    // 🌐 BACKEND API ENDPOINT - WALLET CREATION REQUEST
    // ============================================================
    // This is the actual HTTP request to the backend
    // Endpoint: POST /api/users/:userId/setup
    // The backend endpoint at this URL will create the wallet
    // ============================================================
    console.log("🌐 Making API call to:", `/api/users/${userIdEnc}/setup`);

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

    console.log("✅ setupPrivyUser success:", { data: data ? "present" : "null" });
    return { data, error: null };
  } catch (error) {
    console.error("❌ Error in Privy user setup:", error);
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
    console.error("Error getting wallet balance:", error);
    return { data: null, error };
  }
}

// Backward compatible export name (older code may import setupUser)
export const setupUser = setupPrivyUser;
