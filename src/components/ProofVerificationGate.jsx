import React from "react";

/**
 * Identity verification (Proof KYC) is only shown:
 * - During onboarding
 * - When the user attempts to deposit
 * This gate no longer redirects on load.
 */
export default function ProofVerificationGate({ children }) {
  return children;
}
