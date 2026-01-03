/**
 * Crossmint API Service
 * Handles user registration, document upload, and document retrieval
 */

import API_BASE_URL from "../config/api";

const CROSSMINT_API_BASE = __DEV__
  ? "https://staging.crossmint.com/api/2025-06-09"
  : "https://www.crossmint.com/api/2025-06-09";

const CROSSMINT_API_KEY =
  process.env.EXPO_PUBLIC_CROSSMINT_API_KEY || "<x-api-key>";

// Helper function for backend API calls
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
 * Create or update a user with Crossmint
 * @param {string} userLocator - Unique identifier for the user (e.g., "userId:johnd-123")
 * @param {Object} userDetails - User personal details
 * @param {Object} kycData - KYC compliance data
 * @returns {Promise<Object>} Response from Crossmint API
 */
export async function createOrUpdateUser(userLocator, userDetails, kycData) {
  const url = `${CROSSMINT_API_BASE}/users/${userLocator}`;

  const options = {
    method: "PUT",
    headers: {
      "X-API-KEY": CROSSMINT_API_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      userDetails,
      kycData,
    }),
  };

  try {
    const response = await fetch(url, options);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data?.message || data?.error || `Request failed (${response.status})`
      );
    }

    return data;
  } catch (error) {
    throw new Error(
      error.message || "Failed to create/update user with Crossmint"
    );
  }
}

/**
 * Upload a document for a user
 * @param {string} userLocator - Unique identifier for the user
 * @param {string} documentType - Type of document (e.g., "id-passport", "id-ssn", etc.)
 * @param {string} base64Data - Base64-encoded image data
 * @param {string} expiresAt - Expiration date in YYYY-MM-DD format (optional)
 * @returns {Promise<Object>} Response containing documentId
 */
export async function uploadDocument(
  userLocator,
  documentType,
  base64Data,
  expiresAt = null
) {
  const url = `${CROSSMINT_API_BASE}/documents`;

  const body = {
    userLocator,
    documentType,
    data: base64Data,
  };

  if (expiresAt) {
    body.expiresAt = expiresAt;
  }

  const options = {
    method: "POST",
    headers: {
      "X-API-KEY": CROSSMINT_API_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  };

  try {
    const response = await fetch(url, options);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data?.message || data?.error || `Request failed (${response.status})`
      );
    }

    return data;
  } catch (error) {
    throw new Error(error.message || "Failed to upload document");
  }
}

/**
 * Get document details by documentId
 * @param {string} documentId - The document ID returned from upload
 * @returns {Promise<Object>} Document details
 */
export async function getDocument(documentId) {
  const url = `${CROSSMINT_API_BASE}/documents/${documentId}`;

  const options = {
    method: "GET",
    headers: {
      "X-API-KEY": CROSSMINT_API_KEY,
    },
  };

  try {
    const response = await fetch(url, options);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data?.message || data?.error || `Request failed (${response.status})`
      );
    }

    return data;
  } catch (error) {
    throw new Error(error.message || "Failed to fetch document");
  }
}

/**
 * Create an onramp order for fiat-to-crypto conversion
 * Calls backend endpoint which proxies to Crossmint API
 * @param {string} recipientWalletAddress - The wallet address to receive the funds
 * @param {string} userLocator - Unique identifier for the user (e.g., "userId:johnd-123")
 * @param {Object} options - Order options
 * @param {string} options.amount - Amount to purchase (as string, e.g., "100")
 * @param {string} options.currency - Currency code (e.g., "USD")
 * @param {string} options.chain - Blockchain network (e.g., "ethereum", "base")
 * @param {string} options.tokenSymbol - Token symbol to purchase (e.g., "ETH", "USDC")
 * @param {string} authToken - Optional auth token for the backend request
 * @returns {Promise<Object>} Response containing orderId, clientSecret, and checkoutUrl
 */
export async function createOnrampOrder(
  recipientWalletAddress,
  userLocator,
  options = {},
  authToken = null
) {
  const {
    amount = "100",
    currency = "USD",
    chain = "base",
    tokenSymbol = "USDC",
  } = options;

  const body = {
    recipientWalletAddress,
    userLocator,
    amount,
    currency,
    chain,
    tokenSymbol,
  };

  try {
    const data = await fetchJson(`/api/crossmint/create-order`, {
      method: "POST",
      body,
      authToken,
    });

    return data;
  } catch (error) {
    throw new Error(
      error.message || "Failed to create onramp order with Crossmint"
    );
  }
}

/**
 * Get order details by orderId
 * Calls backend endpoint which proxies to Crossmint API
 * @param {string} orderId - The order ID
 * @param {string} authToken - Optional auth token for the backend request
 * @returns {Promise<Object>} Order details
 */
export async function getOnrampOrder(orderId, authToken = null) {
  try {
    const data = await fetchJson(`/api/crossmint/orders/${orderId}`, {
      method: "GET",
      authToken,
    });

    return data;
  } catch (error) {
    throw new Error(error.message || "Failed to fetch onramp order");
  }
}

/**
 * Supported document types
 */
export const DocumentTypes = {
  IDENTITY: {
    SSN: "id-ssn",
    PASSPORT: "id-passport",
    ID_CARD_FRONT: "id-idcard-front",
    ID_CARD_BACK: "id-idcard-back",
  },
  SUPPORTING: {
    PROOF_OF_ADDRESS: "proof-of-address",
    PROOF_OF_INCOME: "proof-of-income",
  },
};
