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

  // Get wallet context
  const walletContext = useEmbeddedEthereumWallet();
  const wallets = walletContext?.wallets ?? [];
  const createWallet = walletContext?.create ?? null; // Fix: should be 'create', not 'createWallet'
  const embeddedWallet =
    Array.isArray(wallets) && wallets.length > 0 ? wallets[0] : null;

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

  // Log Privy user for debugging
  useEffect(() => {
    console.log("🔐 Privy User:", JSON.stringify(privyUser, null, 2));
  }, [privyUser]);

  // Log wallet info for debugging
  useEffect(() => {
    console.log("💼 Privy Wallets:", {
      walletCount: wallets?.length || 0,
      wallets: wallets?.map((w) => ({
        id: w.id,
        address: w.address,
      })),
      createWalletAvailable: !!createWallet,
      backendSetupStatus: backendSetup.status,
      backendSetupData: backendSetup.data ? "✅ Present" : "❌ Null",
    });
  }, [wallets, createWallet, backendSetup.status]);

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
      console.log(
        "🔄 AuthContext useEffect triggered - checking if ready to setup wallet"
      );
      console.log(
        "  isReady:",
        isReady,
        "privyUser:",
        privyUser ? privyUser.id : "null"
      );

      if (!isReady || !privyUser) {
        console.log("❌ Not ready - skipping backend setup");
        return;
      }

      if (
        backendSetup.status === "pending" ||
        backendSetup.status === "success"
      ) {
        console.log(
          "⏳ Backend setup already",
          backendSetup.status,
          "- skipping"
        );
        return;
      }

      const privyUserId = privyUser.id;
      const setupKey = `${privyUserId}`;
      console.log("🚀 Starting backend setup for user:", privyUserId);

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
            // If getAccessToken doesn't exist, check what methods are available for debugging
            console.log(
              "🔍 getAccessToken returned null/undefined. Available token/auth methods:",
              Object.keys(privy).filter(
                (k) =>
                  k.includes("token") ||
                  k.includes("Token") ||
                  k.includes("auth") ||
                  k.includes("Auth")
              )
            );

            // Try getAuthToken as fallback (but NOT getIdToken)
            if (typeof privy.getAuthToken === "function") {
              privyUserJwt = await privy.getAuthToken?.();
            }
          }

          if (privyUserJwt) {
            const jwtPreview =
              privyUserJwt.length > 12
                ? `${privyUserJwt.slice(0, 6)}...${privyUserJwt.slice(-6)}`
                : "***";
            console.log("✅ Privy access token retrieved:", {
              length: privyUserJwt.length,
              preview: jwtPreview,
              source:
                privyUserJwt === (await privy.getAccessToken?.())
                  ? "getAccessToken"
                  : "getAuthToken",
            });
          } else {
            throw new Error(
              "Could not retrieve Privy access token. getAccessToken() returned null/undefined. " +
                "Backend wallet creation will fail. Do NOT use getIdToken() as it won't work."
            );
          }
        } catch (jwtError) {
          console.error(
            "❌ Error retrieving Privy access token:",
            jwtError?.message || jwtError
          );
          throw jwtError; // Re-throw so setup fails if we can't get access token
        }

        // Step 2: Get policy IDs for server-side wallet authorization
        const policyIds = getPolicyIds();

        if (policyIds.length === 0) {
          console.warn(
            "⚠️ No policy IDs available - backend server-side operations may fail with 401 error"
          );
        } else {
          console.log("✅ Policy IDs loaded:", policyIds);
        }

        console.log("📡 Calling backend to create wallet:", {
          policyIds: policyIds.length > 0 ? policyIds : "⚠️ None",
          hasJwt: !!privyUserJwt,
          sponsorGas: true,
          linkPolymarket: true,
        });

        // ============================================================
        // 🎯 STEP 3: BACKEND WALLET CREATION CALL - ACTUAL HTTP REQUEST
        // ============================================================
        // This is the actual HTTP fetch call to the backend endpoint
        // that creates the wallet server-side

        const userIdEnc = encodeURIComponent(privyUserId);
        const requestUrl = `${API_BASE_URL}/api/users/${userIdEnc}/setup`;

        console.log("privyUserJwt", privyUserJwt);

        const requestBody = {
          policyIds: policyIds,
          sponsorGas: true,
          linkPolymarket: true,
          privyUserJwt: privyUserJwt, // Backend uses this JWT to create wallet
        };

        console.log("🌐 Making HTTP request to:", requestUrl);
        console.log("📦 Request body:", JSON.stringify(requestBody, null, 2));

        const response = await fetch(requestUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestBody),
        });

        console.log("📥 Response received:", {
          status: response.status,
          statusText: response.statusText,
          ok: response.ok,
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
        console.log("📄 Response JSON:", data);

        // Response should contain:
        // {
        //   "success": true,
        //   "privyWalletId": "eyqxjeb9gaqk23oavdfnxyqk",
        //   "walletAddress": "0x9Af167C1E68eA357aFeF103C1B8f391d98D57777",
        //   "chainType": "ethereum",
        //   "alreadyLinked": false,
        //   "polymarketLinked": false
        // }

        // No error if we got here - response was successful
        console.log("✅ Backend wallet creation response:", {
          success: data?.success,
          hasWalletId: !!data?.privyWalletId,
          hasWalletAddress: !!data?.walletAddress,
        });

        console.log("✅ Backend setup success:", data);
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
        console.warn(
          "⚠️ Backend setup failed (expected until backend is ready):",
          message
        );
        console.log("❌ Backend setup error details:", {
          error: e,
          message: message,
          privyUserId: privyUser?.id,
        });
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
      console.error("Sign out error:", error);
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
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
