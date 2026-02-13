import API_BASE_URL from "../config/api";
import { PROOF_RETURN_PATH, getProofVerifyUrl } from "../config/proof";

/** Deep link base for Proof KYC (must match backend PROOF_DEEP_LINK_BASE) */
const PROOF_DEEP_LINK_BASE =
  process.env.EXPO_PUBLIC_PROOF_DEEP_LINK_BASE || "https://dflow.net/proof";
const PROOF_VERIFY_MAX_ATTEMPTS = 2;
const PROOF_VERIFY_RETRY_DELAY_MS = 600;

/**
 * Proof KYC Service
 * @see https://pond.dflow.net/build/proof/partner-integration
 *
 * The backend builds the Proof deep link (dflow.net/proof) with optional
 * pre-signed ownership proof (base58) + timestamp for DFlow verification.
 */

/** Message prefix for Proof KYC ownership proof (must match what user signs). */
export const PROOF_KYC_MESSAGE_PREFIX = "Proof KYC verification:";

/**
 * Build the message the user signs for Proof KYC (ownership proof).
 * @param {number} timestamp - Timestamp in ms (e.g. Date.now())
 * @returns {string}
 */
export function createProofSignMessage(timestamp) {
  return `${PROOF_KYC_MESSAGE_PREFIX} ${timestamp}`;
}

/**
 * Encode bytes to base58 while handling both CJS and ESM bs58 module shapes.
 * @param {Uint8Array} bytes
 * @returns {string}
 */
export function encodeBase58(bytes) {
  const bs58Module = require("bs58");
  const bs58 = bs58Module?.default || bs58Module;
  if (!bs58 || typeof bs58.encode !== "function") {
    throw new Error("Base58 encoder is unavailable.");
  }
  return bs58.encode(bytes);
}

/**
 * Create a Proof KYC deep link URL with client-side wallet signing.
 * Use when you have a Solana wallet with signMessage (e.g. from a wallet adapter).
 * Requires: bs58, @solana/web3.js
 *
 * @param {{ publicKey: { toBase58: () => string }, signMessage: (msg: Uint8Array) => Promise<Uint8Array> }} wallet - Solana wallet
 * @param {string} redirectUri - Return URL (e.g. scoretrade://proof-return)
 * @returns {Promise<string>} Deep link URL
 */
export async function createProofDeepLink(wallet, redirectUri) {
  const timestamp = Date.now();
  const message = createProofSignMessage(timestamp);
  const messageBytes = new TextEncoder().encode(message);
  const signatureBytes = await wallet.signMessage(messageBytes);
  const signature = encodeBase58(signatureBytes);
  const params = new URLSearchParams({
    wallet: wallet.publicKey.toBase58(),
    signature,
    timestamp: String(timestamp),
    redirect_uri: redirectUri,
  });
  return `${PROOF_DEEP_LINK_BASE}?${params.toString()}`;
}

/**
 * Get a Proof KYC deep link URL from the backend.
 * Optionally include signature + timestamp (pre-signed ownership proof, base58).
 *
 * @param {string} walletAddress - Solana wallet address to verify
 * @param {string} authToken - Privy JWT for auth
 * @param {{ signature?: string, timestamp?: string | number }} [options] - Optional pre-signed proof (base58) and timestamp
 * @returns {{ data: { url: string }, error: null } | { data: null, error: Error }}
 */
export async function getProofVerificationUrl(walletAddress, authToken, options = {}) {
  try {
    if (!walletAddress || !authToken) {
      throw new Error("walletAddress and authToken are required");
    }

    const body = {
      walletAddress,
      returnUrl: PROOF_RETURN_PATH,
    };
    if (options.signature != null && options.timestamp != null) {
      body.signature = String(options.signature);
      body.timestamp = String(options.timestamp);
    }
    const response = await fetch(
      `${API_BASE_URL}/api/proof/verification-url`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(body),
      }
    );

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err?.message || `Request failed (${response.status})`);
    }

    const data = await response.json();
    return { data: data?.url ? { url: data.url } : data, error: null };
  } catch (error) {
    return { data: null, error };
  }
}

/**
 * Check if a wallet is Proof (KYC) verified.
 * Calls DFlow's Verify Address API directly: GET https://proof.dflow.net/verify/{address}
 *
 * @param {string} walletAddress - Solana wallet address
 * @param {string} [authToken] - Optional; unused when calling DFlow directly
 * @returns {{ data: { verified: boolean }, error: null } | { data: null, error: Error }}
 */
export async function checkProofVerification(walletAddress, authToken) {
  try {
    if (!walletAddress) {
      throw new Error("walletAddress is required");
    }

    const verifyUrl = getProofVerifyUrl(walletAddress);
    for (let attempt = 1; attempt <= PROOF_VERIFY_MAX_ATTEMPTS; attempt += 1) {
      try {
        const response = await fetch(verifyUrl, { method: "GET" });
        if (!response.ok) {
          const err = await response.json().catch(() => ({}));
          const message = err?.message || `Request failed (${response.status})`;
          const retryable = response.status >= 500 || response.status === 429;
          if (retryable && attempt < PROOF_VERIFY_MAX_ATTEMPTS) {
            await new Promise((resolve) =>
              setTimeout(resolve, PROOF_VERIFY_RETRY_DELAY_MS)
            );
            continue;
          }
          throw new Error(message);
        }

        const data = await response.json();
        const verified = !!data?.verified;
        return { data: { verified }, error: null };
      } catch (attemptError) {
        const message = attemptError?.message || "Failed to verify wallet";
        const retryable =
          message.includes("Network request failed") ||
          message.includes("timed out") ||
          message.includes("Failed to fetch");
        if (retryable && attempt < PROOF_VERIFY_MAX_ATTEMPTS) {
          await new Promise((resolve) =>
            setTimeout(resolve, PROOF_VERIFY_RETRY_DELAY_MS)
          );
          continue;
        }
        throw attemptError;
      }
    }
    throw new Error("Failed to verify wallet");
  } catch (error) {
    return { data: null, error };
  }
}
