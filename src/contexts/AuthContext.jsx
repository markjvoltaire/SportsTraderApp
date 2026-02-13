import React, {
  createContext,
  useContext,
  useMemo,
  useEffect,
  useRef,
  useState,
  useCallback,
} from "react";
import { Buffer } from "buffer";
import { usePrivy, useEmbeddedSolanaWallet } from "@privy-io/expo";
import { setupPrivyUser } from "../services/walletService";
import { getPolicyIds } from "../config/privy";
import API_BASE_URL from "../config/api";
import { useSupabase } from "./SupabaseContext";
import { checkProofVerification } from "../services/proofService";

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  // Use Privy as the primary authentication system
  const privy = usePrivy();
  const { user: privyUser, isReady, logout } = privy;

  // Supabase (DB) context
  const { supabase, isInitialized: supabaseInitialized } = useSupabase();

  // Embedded Solana wallet context for Proof signing.
  const solanaWalletContext = useEmbeddedSolanaWallet();

  // Supabase user row (DB user profile)
  const [supabaseUser, setSupabaseUser] = useState(null);
  const [supabaseUserStatus, setSupabaseUserStatus] = useState("idle"); // idle | loading | success | not_found | error
  const [supabaseUserError, setSupabaseUserError] = useState(null);

  // Backend setup state (user+wallet attach, Polymarket link, etc.)
  const [backendSetup, setBackendSetup] = useState({
    status: "idle", // idle | pending | success | error
    data: null,
    error: null,
    lastAttemptAt: null,
    lastSuccessAt: null,
  });

  // Proof (KYC) verification state - required for prediction market buying
  const [proofStatus, setProofStatus] = useState({
    status: "idle", // idle | loading | verified | unverified | error
    verified: null,
    lastCheckedAt: null,
  });

  // Prevent repeated backend setup calls for the same user
  const lastSetupKeyRef = useRef(null);

  // Store latest privyUser in a ref to avoid stale closures in async functions
  const privyUserRef = useRef(privyUser);
  useEffect(() => {
    privyUserRef.current = privyUser;
  }, [privyUser]);

  const refreshSupabaseUser = async () => {
    const privyUserId = privyUserRef.current?.id;
    if (!privyUserId) {
      setSupabaseUser(null);
      setSupabaseUserStatus("idle");
      setSupabaseUserError(null);
      return;
    }

    if (
      !supabaseInitialized ||
      !supabase ||
      typeof supabase.from !== "function"
    ) {
      // Not configured / not ready
      setSupabaseUser(null);
      setSupabaseUserStatus("idle");
      setSupabaseUserError(null);
      return;
    }

    setSupabaseUserStatus("loading");
    setSupabaseUserError(null);

    try {
      // IMPORTANT: Do NOT fetch `polymarket_credentials` into the client context.
      // Support both legacy users schema (wallet_address) and flat Privy schema
      // (linked_account_*_address) to avoid breaking proof/wallet flows.
      let data = null;
      let error = null;

      const legacyResult = await supabase
        .from("users")
        .select(
          "id, privy_wallet_id, wallet_address, polymarket_linked_at, created_at, updated_at, proof"
        )
        .eq("id", privyUserId)
        .single();

      const legacyErrorMessage = legacyResult?.error?.message || "";
      const hasSchemaMismatch =
        legacyErrorMessage.includes("Could not find the") ||
        legacyErrorMessage.includes("column") ||
        legacyErrorMessage.includes("schema cache");

      if (legacyResult?.error && hasSchemaMismatch) {
        const flatResult = await supabase
          .from("users")
          .select(
            "id, created_at, row_created_at, row_updated_at, proof, linked_account_0_type, linked_account_0_address, linked_account_1_type, linked_account_1_address"
          )
          .eq("id", privyUserId)
          .single();
        data = flatResult?.data ?? null;
        error = flatResult?.error ?? null;
      } else {
        data = legacyResult?.data ?? null;
        error = legacyResult?.error ?? null;
      }

      if (error) {
        // "not configured" is not an app error
        if (error?.message?.includes("not configured")) {
          setSupabaseUser(null);
          setSupabaseUserStatus("idle");
          setSupabaseUserError(null);
          return;
        }

        // "No rows" => user not present yet
        if (error.code === "PGRST116" || error?.message?.includes("No rows")) {
          setSupabaseUser(null);
          setSupabaseUserStatus("not_found");
          setSupabaseUserError(null);
          return;
        }

        setSupabaseUser(null);
        setSupabaseUserStatus("error");
        setSupabaseUserError(error?.message || "Failed to fetch user");
        return;
      }

      // Normalize wallet address regardless of which schema was returned.
      const linkedWallet =
        data?.linked_account_0_type === "wallet"
          ? data?.linked_account_0_address
          : data?.linked_account_1_type === "wallet"
            ? data?.linked_account_1_address
            : data?.linked_account_1_address || data?.linked_account_0_address;

      const normalizedUser = data
        ? {
            ...data,
            wallet_address: data?.wallet_address || linkedWallet || null,
          }
        : null;

      setSupabaseUser(normalizedUser);
      setSupabaseUserStatus(normalizedUser ? "success" : "not_found");
      setSupabaseUserError(null);
    } catch (e) {
      const message =
        e?.message || (typeof e === "string" ? e : "Failed to fetch user");
      if (message.includes("not configured")) {
        setSupabaseUser(null);
        setSupabaseUserStatus("idle");
        setSupabaseUserError(null);
        return;
      }
      setSupabaseUser(null);
      setSupabaseUserStatus("error");
      setSupabaseUserError(message);
    }
  };

  // Fetch the Supabase user row whenever the Privy user changes
  useEffect(() => {
    refreshSupabaseUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [privyUser?.id, supabaseInitialized]);

  // Privy user row sync now lives in App navigation sign-in handler,
  // where the full flattened payload is available.

  const retryBackendSetup = () => {
    // allow the next effect run to attempt again
    lastSetupKeyRef.current = null;
    setBackendSetup((prev) => ({
      ...prev,
      status: "idle",
      data: null,
      error: null,
      lastAttemptAt: null,
    }));
  };

  const privyLinkedWalletAddress = useMemo(() => {
    const linkedAccounts = Array.isArray(privyUser?.linked_accounts)
      ? privyUser.linked_accounts
      : [];
    const linkedSolanaWallet =
      linkedAccounts.find(
        (account) => account?.type === "wallet" && account?.chain_type === "solana"
      ) || linkedAccounts.find((account) => account?.type === "wallet");
    return linkedSolanaWallet?.address || null;
  }, [privyUser?.linked_accounts]);

  const walletAddress = useMemo(
    () =>
      supabaseUser?.wallet_address ||
      backendSetup?.data?.wallet_address ||
      privyLinkedWalletAddress ||
      null,
    [
      supabaseUser?.wallet_address,
      backendSetup?.data?.wallet_address,
      privyLinkedWalletAddress,
    ]
  );

  const checkProofStatus = useCallback(async () => {
    if (!walletAddress) {
      setProofStatus({ status: "idle", verified: null, lastCheckedAt: null });
      return { status: "idle", verified: null };
    }

    setProofStatus((prev) => ({ ...prev, status: "loading" }));
    try {
      const authToken = await privy.getAccessToken?.();
      if (!authToken) {
        const nextState = {
          status: "error",
          verified: false,
          lastCheckedAt: Date.now(),
        };
        setProofStatus(nextState);
        return { status: nextState.status, verified: nextState.verified };
      }

      const { data, error } = await checkProofVerification(
        walletAddress,
        authToken
      );

      if (error) {
        const nextState = {
          status: "error",
          verified: false,
          lastCheckedAt: Date.now(),
        };
        setProofStatus(nextState);
        return { status: nextState.status, verified: nextState.verified };
      }

      const verified = !!data?.verified;
      const nextState = {
        status: verified ? "verified" : "unverified",
        verified,
        lastCheckedAt: Date.now(),
      };
      setProofStatus(nextState);
      return { status: nextState.status, verified: nextState.verified };
    } catch (e) {
      const nextState = {
        status: "error",
        verified: false,
        lastCheckedAt: Date.now(),
      };
      setProofStatus(nextState);
      return { status: nextState.status, verified: nextState.verified };
    }
  }, [
    walletAddress,
    privy,
  ]);

  // After profile creation (Privy login/signup), call backend to provision wallet + optionally link Polymarket.
  // Backend should be idempotent and return wallet info if already provisioned.
  useEffect(() => {
    const run = async () => {
      if (!isReady || !privyUser) {
        return;
      }

      if (
        backendSetup.status === "pending" ||
        backendSetup.status === "success"
      ) {
        return;
      }

      const privyUserId = privyUser.id;
      const setupKey = `${privyUserId}`;

      // If we already tried for this exact key and we're still in error, don't spam.
      if (
        lastSetupKeyRef.current === setupKey &&
        backendSetup.status === "error"
      )
        return;

      lastSetupKeyRef.current = setupKey;
      setBackendSetup({
        status: "pending",
        data: null,
        error: null,
        lastAttemptAt: Date.now(),
        lastSuccessAt: null,
      });

      try {
        // Step 1: Get Privy user JWT for backend authentication
        // Backend will create the wallet and link it to the user
        // CRITICAL: Must use getAccessToken() - NOT getIdToken()
        let privyUserJwt = null;
        try {
          // Only use getAccessToken() - this is the access token needed for backend
          privyUserJwt = await privy.getAccessToken?.();

          if (!privyUserJwt) {
            // Try getAuthToken as fallback (but NOT getIdToken)
            if (typeof privy.getAuthToken === "function") {
              privyUserJwt = await privy.getAuthToken?.();
            }
          }

          if (!privyUserJwt) {
            throw new Error(
              "Could not retrieve Privy access token. getAccessToken() returned null/undefined. " +
                "Backend wallet creation will fail. Do NOT use getIdToken() as it won't work."
            );
          }
        } catch (jwtError) {
          throw jwtError; // Re-throw so setup fails if we can't get access token
        }

        // Step 2: Get policy IDs for server-side wallet authorization
        const policyIds = getPolicyIds();

        // ============================================================
        // 🎯 STEP 3: BACKEND WALLET CREATION CALL - ACTUAL HTTP REQUEST
        // ============================================================
        // This is the actual HTTP fetch call to the backend endpoint
        // that creates the wallet server-side

        const userIdEnc = encodeURIComponent(privyUserId);
        const requestUrl = `${API_BASE_URL}/api/users/${userIdEnc}/setup`;

        const requestBody = {
          policyIds: policyIds,
          sponsorGas: true,
          linkPolymarket: true,
          privyUserJwt: privyUserJwt, // Backend uses this JWT to create wallet
        };

        const response = await fetch(requestUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
          let errorMessage = `Request failed (${response.status})`;
          try {
            const errorJson = await response.json();
            errorMessage =
              errorJson?.message ||
              errorJson?.details ||
              errorJson?.error ||
              errorMessage;
          } catch (_e) {
            // Could not parse error response as JSON
          }
          throw new Error(errorMessage);
        }

        const data = await response.json();

        setBackendSetup({
          status: "success",
          data: data ?? null,
          error: null,
          lastAttemptAt: Date.now(),
          lastSuccessAt: Date.now(),
        });

        // Refresh Supabase user so we get wallet_address for Proof KYC
        refreshSupabaseUser();
      } catch (e) {
        const message =
          e?.message ||
          (typeof e === "string" ? e : "Backend setup failed (unknown error)");
        setBackendSetup({
          status: "error",
          data: null,
          error: message,
          lastAttemptAt: Date.now(),
          lastSuccessAt: null,
        });
      }
    };

    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isReady, privyUser?.id, refreshSupabaseUser]);

  // Check Proof (KYC) verification status when we have a wallet
  useEffect(() => {
    if (walletAddress && proofStatus.status === "idle") {
      checkProofStatus();
    }
  }, [
    walletAddress,
    proofStatus.status,
    checkProofStatus,
  ]);

  // Create a session-like object for compatibility with existing code
  // Session is truthy when user is authenticated, null when not
  const session = useMemo(() => {
    if (!isReady) return null;
    if (!privyUser) return null;
    // Return a session-like object for compatibility
    return {
      user: privyUser,
      access_token: null, // Privy handles tokens internally
    };
  }, [privyUser, isReady]);

  // Expose Privy user as user
  const user = privyUser;

  // Loading state based on Privy's ready state
  const loading = !isReady;

  const signOut = async () => {
    try {
      // Use Privy's logout method
      await logout();
      return { error: null };
    } catch (error) {
      return { error };
    }
  };

  const getAccessToken = useCallback(async () => {
    const token = await privy.getAccessToken?.();
    return token ?? null;
  }, [privy]);

  const getProofSigningWallet = useCallback(async () => {
    const wallets = Array.isArray(solanaWalletContext?.wallets)
      ? solanaWalletContext.wallets
      : [];
    const embeddedSolanaWallet = wallets.find(
      (wallet) => typeof wallet?.getProvider === "function" && wallet?.address
    );

    if (!embeddedSolanaWallet) {
      throw new Error(
        "No embedded Solana wallet is available. Please create or reconnect your wallet."
      );
    }

    const provider = await embeddedSolanaWallet.getProvider();

    return {
      publicKey: {
        toBase58: () => embeddedSolanaWallet.address,
      },
      signMessage: async (messageBytes) => {
        const messageBase64 = Buffer.from(messageBytes).toString("base64");
        const result = await provider.request({
          method: "signMessage",
          params: { message: messageBase64 },
        });
        const signatureBase64 = result?.signature;
        if (!signatureBase64) {
          throw new Error("Wallet signature was not returned.");
        }
        return Uint8Array.from(Buffer.from(signatureBase64, "base64"));
      },
    };
  }, [solanaWalletContext]);

  const value = {
    session,
    user,
    loading,
    signOut,
    backendSetup,
    retryBackendSetup,
    supabaseUser,
    supabaseUserStatus,
    supabaseUserError,
    refreshSupabaseUser,
    proofStatus,
    walletAddress,
    checkProofStatus,
    getAccessToken,
    getProofSigningWallet,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
