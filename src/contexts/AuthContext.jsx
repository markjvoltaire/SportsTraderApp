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
import bs58 from "bs58";
import { Connection, PublicKey, VersionedTransaction } from "@solana/web3.js";
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
  // Proof token for DFlow trade authorization (set after KYC or from backend)
  const [proofToken, setProofToken] = useState(null);

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
    const addressToVerify = solanaAddress || walletAddress;
    if (!addressToVerify) {
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
        addressToVerify,
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
    solanaAddress,
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
    const addr = solanaAddress || walletAddress;
    if (addr && proofStatus.status === "idle") {
      checkProofStatus();
    }
  }, [
    solanaAddress,
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

  const solanaAddress = useMemo(() => {
    const wallets = Array.isArray(solanaWalletContext?.wallets)
      ? solanaWalletContext.wallets
      : [];
    const sw = wallets.find(
      (w) => typeof w?.getProvider === "function" && w?.address
    );
    return sw?.address || null;
  }, [solanaWalletContext]);

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
      signMessage: async (messageInput) => {
        const msgBuffer =
          typeof messageInput === "string"
            ? Buffer.from(messageInput, "utf-8")
            : Buffer.from(messageInput);
        const messageBase64 = msgBuffer.toString("base64");

        console.log("[Proof:sign] address:", embeddedSolanaWallet.address);
        console.log("[Proof:sign] msgLen:", msgBuffer.length, "b64:", messageBase64);

        const result = await provider.request({
          method: "signMessage",
          params: { message: messageBase64 },
        });

        const sig = result?.signature;
        if (!sig) {
          throw new Error("Wallet signature was not returned.");
        }

        console.log("[Proof:sign] sig type:", typeof sig, "len:", sig.length);

        let sigBytes = Buffer.from(sig, "base64");

        if (sigBytes.length !== 64) {
          console.warn(
            "[Proof:sign] base64 decode gave",
            sigBytes.length,
            "bytes (expected 64), trying raw bs58 decode"
          );
          try {
            const bs58Mod = require("bs58");
            const bs58 = bs58Mod?.default || bs58Mod;
            sigBytes = Buffer.from(bs58.decode(sig));
            console.log("[Proof:sign] bs58 decode gave", sigBytes.length, "bytes");
          } catch (_) {
            console.warn("[Proof:sign] bs58 fallback failed, using base64 result");
          }
        }

        if (sigBytes.length !== 64) {
          console.error(
            "[Proof:sign] FINAL signature is",
            sigBytes.length,
            "bytes — Ed25519 must be 64"
          );
        }

        return new Uint8Array(sigBytes);
      },
    };
  }, [solanaWalletContext]);

  const signAndSendSolanaTransaction = useCallback(
    async (transactionBase64, options = {}) => {
      console.log("[signAndSendSolanaTransaction] Starting, options:", JSON.stringify(options), "txBase64 length:", transactionBase64?.length);
      
      const wallets = Array.isArray(solanaWalletContext?.wallets)
        ? solanaWalletContext.wallets
        : [];
      const wallet = wallets.find(
        (w) => typeof w?.getProvider === "function" && w?.address
      );
      
      if (!wallet) {
        throw new Error("No embedded Solana wallet available. Please ensure your wallet is connected.");
      }
      console.log("[signAndSendSolanaTransaction] Wallet address:", wallet?.address);

      const txBuffer = Buffer.from(transactionBase64, "base64");
      const transaction = VersionedTransaction.deserialize(new Uint8Array(txBuffer));
      const provider = await wallet.getProvider();

      // Log transaction account keys and user USDC ATA for debugging
      try {
        const staticKeys = transaction.message?.staticAccountKeys || [];
        const keys = staticKeys.map((k) => k?.toBase58?.() || String(k));
        console.log("[signAndSendSolanaTransaction] Tx static account keys:", keys?.length, "keys:", keys);
        const owner = new PublicKey(wallet.address);
        const USDC_MAINNET = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
        const TOKEN_PROGRAM_ID = new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA");
        const ASSOCIATED_TOKEN_PROGRAM_ID = new PublicKey("ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL");
        const usdcMint = new PublicKey(USDC_MAINNET);
        const [ata] = PublicKey.findProgramAddressSync(
          [owner.toBuffer(), TOKEN_PROGRAM_ID.toBuffer(), usdcMint.toBuffer()],
          ASSOCIATED_TOKEN_PROGRAM_ID
        );
        const userUsdcAta = ata.toBase58();
        const ataInTx = keys?.includes(userUsdcAta);
        console.log("[signAndSendSolanaTransaction] User USDC ATA:", userUsdcAta, "in tx:", ataInTx);
      } catch (decodeErr) {
        console.warn("[signAndSendSolanaTransaction] Tx decode:", decodeErr?.message);
      }

      // Use RPC from options (e.g. devnet when backend used dev quote API), then env, then mainnet.
      const rpcUrl =
        options?.rpcUrl ||
        (typeof process !== "undefined" && process?.env?.EXPO_PUBLIC_SOLANA_RPC_URL) ||
        "https://api.mainnet-beta.solana.com";
      console.log("[signAndSendSolanaTransaction] RPC:", rpcUrl.replace(/\/$/, ""));
      const connection = new Connection(rpcUrl);

      // Log Privy wallet balance (SOL + USDC)
      try {
        const owner = new PublicKey(wallet.address);
        const solLamports = await connection.getBalance(owner);
        const solBalance = solLamports / 1e9;
        const USDC_MAINNET = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
        const USDC_DEVNET = "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU";
        const isDevnet = rpcUrl.includes("devnet");
        const usdcMint = new PublicKey(isDevnet ? USDC_DEVNET : USDC_MAINNET);
        const tokenAccounts = await connection.getParsedTokenAccountsByOwner(owner, { mint: usdcMint });
        let usdcBalance = null;
        let usdcTokenAccountAddress = null;
        if (tokenAccounts.value?.length > 0) {
          const first = tokenAccounts.value[0];
          usdcTokenAccountAddress = first?.pubkey?.toBase58?.();
          const info = first?.account?.data?.parsed?.info;
          const tokenAmount = info?.tokenAmount ?? info?.uiTokenAmount;
          usdcBalance = tokenAmount?.uiAmount ?? (tokenAmount?.amount != null ? Number(tokenAmount.amount) / 1e6 : null);
        }
        console.log("[Privy wallet] Balance:", {
          address: wallet.address,
          network: isDevnet ? "devnet" : "mainnet",
          sol: `${solBalance.toFixed(6)} SOL`,
          usdc: usdcBalance != null ? `${usdcBalance} USDC` : "no USDC account",
          usdcTokenAccount: usdcTokenAccountAddress,
        });
      } catch (balanceErr) {
        console.warn("[Privy wallet] Balance fetch failed:", balanceErr?.message);
      }

      // Refresh blockhash so the transaction is valid when sent (avoids "Blockhash not found")
      try {
        const { blockhash } = await connection.getLatestBlockhash("finalized");
        if (transaction.message && "recentBlockhash" in transaction.message) {
          transaction.message.recentBlockhash = blockhash;
        }
      } catch (blockhashErr) {
        console.warn("[signAndSendSolanaTransaction] Blockhash refresh failed:", blockhashErr?.message);
      }

      if (options?.useSponsor) {
        // Backend-sponsored flow: user signs, backend adds sponsor sig and broadcasts
        try {
          console.log("Signing for backend sponsor (user signs only)...");
          const messageBytes = transaction.message.serialize();
          const messageBase64 = Buffer.from(messageBytes).toString("base64");
          const signResult = await provider.request({
            method: "signMessage",
            params: { message: messageBase64 },
          });
          const sig = signResult?.signature;
          if (!sig) throw new Error("No signature from signMessage");
          let sigBytes = Buffer.from(sig, "base64");
          if (sigBytes.length !== 64) {
            try {
              sigBytes = Buffer.from(bs58.decode(sig));
            } catch {
              // keep sigBytes as is
            }
          }
          transaction.addSignature(new PublicKey(wallet.address), sigBytes);
          const serializedTx = transaction.serialize();
          const txBase64 = Buffer.from(serializedTx).toString("base64");
          const sponsorRes = await fetch(`${API_BASE_URL}/api/trade/sponsor-sign`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ transaction: txBase64 }),
          });
          const sponsorData = await sponsorRes.json().catch(() => ({}));
          if (!sponsorRes.ok) {
            throw new Error(sponsorData?.error || `Sponsor sign failed: ${sponsorRes.status}`);
          }
          const signature = sponsorData?.signature;
          if (!signature) throw new Error("No signature from sponsor-sign");
          console.log("Transaction sponsored and broadcast! Signature:", signature);
          return signature;
        } catch (sponsorErr) {
          console.error("[signAndSendSolanaTransaction] Sponsor flow failed:", sponsorErr?.message);
          throw sponsorErr;
        }
      }

      try {
        console.log("Requesting signature from Privy (user pays fees)...");
        
        const result = await provider.request({
          method: "signAndSendTransaction",
          params: {
            transaction,
            connection,
            options: {
              sponsor: false,
              skipPreflight: false,
              maxRetries: 3,
            },
          },
        });

        const signature = result?.signature || result;
        console.log("Transaction sent! Signature:", signature);
        
        return signature;
        
      } catch (error) {
        console.error("[signAndSendSolanaTransaction] Transaction failed:", error?.message, error);
        
        if (error?.message?.includes("reject") || error?.message?.includes("cancel")) {
          throw new Error("Transaction was cancelled.");
        }
        if (error?.message?.includes("Blockhash not found") || error?.message?.includes("blockhash")) {
          throw new Error("Transaction expired. Please try again.");
        }
        if (error?.message?.includes("no record of a prior credit") || error?.message?.includes("debit")) {
          throw new Error("Insufficient USDC balance. Please add funds to your wallet before making a purchase.");
        }
        
        throw new Error(error?.message || "Transaction failed.");
      }
    },
    [solanaWalletContext]
  );

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
    proofToken,
    setProofToken,
    walletAddress,
    solanaAddress,
    checkProofStatus,
    getAccessToken,
    getProofSigningWallet,
    signAndSendSolanaTransaction,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
