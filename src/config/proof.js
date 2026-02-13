/**
 * Proof KYC Configuration
 * @see https://pond.dflow.net/build/proof/introduction
 *
 * Proof is DFlow's identity verification service for prediction markets.
 * Required for Kalshi compliance - unverified wallets cannot buy after Feb 20, 2026.
 */

// Proof base URL (DFlow production)
const PROOF_BASE_URL =
  process.env.EXPO_PUBLIC_PROOF_BASE_URL || "https://proof.dflow.net";

/** DFlow Verify Address API: GET {base}/verify/{address} */
export const getProofVerifyUrl = (address) =>
  `${PROOF_BASE_URL}/verify/${encodeURIComponent(String(address))}`;

// App deep link scheme for Proof return (must match app.json scheme)
const APP_SCHEME = "scoretrade";

// Return path when Proof redirects back to the app
export const PROOF_RETURN_PATH = `${APP_SCHEME}://proof-return`;

export default {
  baseUrl: PROOF_BASE_URL,
  returnPath: PROOF_RETURN_PATH,
  appScheme: APP_SCHEME,
};
