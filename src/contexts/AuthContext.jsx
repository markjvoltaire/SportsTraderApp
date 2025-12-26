import React, {
  createContext,
  useContext,
  useMemo,
  useEffect,
  useRef,
  useState,
} from "react";
import { usePrivy, useEmbeddedEthereumWallet } from "@privy-io/expo";
import { setupPrivyUser } from "../services/walletService";
import { getPolicyIds } from "../config/privy";
import API_BASE_URL from "../config/api";
import { useSupabase } from "./SupabaseContext";

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

  // Get wallet context
  const walletContext = useEmbeddedEthereumWallet();
  const wallets = walletContext?.wallets ?? [];
  const createWallet = walletContext?.create ?? null; // Fix: should be 'create', not 'createWallet'
  const embeddedWallet =
    Array.isArray(wallets) && wallets.length > 0 ? wallets[0] : null;

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
      // IMPORTANT: Do NOT fetch `polymarket_credentials` into the client context
      const { data, error } = await supabase
        .from("users")
        .select(
          "id, privy_wallet_id, wallet_address, polymarket_linked_at, created_at, updated_at"
        )
        .eq("id", privyUserId)
        .single();

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

      setSupabaseUser(data ?? null);
      setSupabaseUserStatus(data ? "success" : "not_found");
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
  }, [isReady, privyUser?.id]);

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
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
