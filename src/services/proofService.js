import { PROOF_RETURN_PATH, getProofVerifyUrl } from "../config/proof";

/** Deep link base for Proof KYC */
const PROOF_DEEP_LINK_BASE =
  process.env.EXPO_PUBLIC_PROOF_DEEP_LINK_BASE || "https://dflow.net/proof";
const PROOF_VERIFY_MAX_ATTEMPTS = 2;
const PROOF_VERIFY_RETRY_DELAY_MS = 600;

/**
 * Proof KYC Service
 * @see https://pond.dflow.net/build/proof/partner-integration
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
  const encoded = bs58.encode(bytes);

  if (__DEV__) {
    const roundTrip = bs58.decode(encoded);
    if (roundTrip.length !== bytes.length) {
      console.error("[Proof:bs58] roundtrip length mismatch:", bytes.length, "→", roundTrip.length);
    }
  }

  return encoded;
}

/**
 * Build a Proof KYC deep link URL on the client.
 * Guarantees the timestamp in the URL exactly matches what was signed.
 *
 * @param {{ wallet: string, signature?: string, timestamp?: number|string }} opts
 * @returns {string}
 */
export function buildProofDeepLinkUrl({ wallet, signature, timestamp }) {
  const params = new URLSearchParams({
    wallet,
    redirect_uri: PROOF_RETURN_PATH,
  });
  if (signature && timestamp != null) {
    params.set("signature", String(signature));
    params.set("timestamp", String(timestamp));
  }
  return `${PROOF_DEEP_LINK_BASE}?${params.toString()}`;
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
