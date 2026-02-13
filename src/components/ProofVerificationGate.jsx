import React, { useEffect } from "react";
import { useNavigation } from "@react-navigation/native";
import { useAuth } from "../contexts/AuthContext";

/**
 * Redirects to ProofVerification screen when user is signed in, has a wallet,
 * but has not completed Proof (KYC) verification.
 * Rendered inside Main stack so we can redirect after async proof status resolves.
 */
export default function ProofVerificationGate({ children }) {
  const navigation = useNavigation();
  const {
    session,
    walletAddress,
    proofStatus,
  } = useAuth();

  useEffect(() => {
    if (!session) return;

    const proofResolved =
      proofStatus.status !== "idle" && proofStatus.status !== "loading";
    const needsProof =
      walletAddress && proofResolved && proofStatus.verified === false;

    if (needsProof) {
      // Get root navigator (ProofVerification is a root-level screen)
      let rootNav = navigation;
      while (rootNav.getParent()) {
        rootNav = rootNav.getParent();
      }
      rootNav.reset({
        index: 0,
        routes: [{ name: "ProofVerification" }],
      });
    }
  }, [
    session,
    walletAddress,
    proofStatus.status,
    proofStatus.verified,
    navigation,
  ]);

  return children;
}
