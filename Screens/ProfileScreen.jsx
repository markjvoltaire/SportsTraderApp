import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
  TextInput,
} from "react-native";
import * as WebBrowser from "expo-web-browser";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { usePrivy, useEmbeddedEthereumWallet } from "@privy-io/expo";
import { useAuth } from "../src/contexts/AuthContext";
import {
  Colors,
  Spacing,
  Typography,
  BorderRadius,
  Shadows,
  CommonStyles,
} from "../src/constants/theme";
import { normalize, normalizeFont } from "../src/utils/dimensions";
// Using Privy embedded wallet when available; otherwise fallback to backend-provisioned wallet info.

export default function ProfileScreen() {
  const { user, signOut, backendSetup, retryBackendSetup } = useAuth();

  // Privy hooks must be called unconditionally (React Rules of Hooks)
  // These hooks may throw errors if PrivyProvider isn't properly initialized
  // The error "Cannot read property 'isReady' of null" suggests Privy's internal code
  // is trying to access a property on null - this happens when PrivyProvider fails to initialize
  // We need to ensure PrivyProvider is properly configured with a valid appId

  // Check if Privy is configured before calling hooks
  const PRIVY_APP_ID = process.env.EXPO_PUBLIC_PRIVY_APP_ID;
  const PRIVY_CLIENT_ID = process.env.EXPO_PUBLIC_PRIVY_CLIENT_ID;
  const isPrivyConfigured =
    !!PRIVY_APP_ID &&
    PRIVY_APP_ID.trim() !== "" &&
    !!PRIVY_CLIENT_ID &&
    PRIVY_CLIENT_ID.trim() !== "";

  // Only call hooks if Privy is configured - but hooks must be called unconditionally
  // So we'll call them anyway and handle null/errors gracefully
  // Privy Expo SDK uses 'isReady' property (not 'ready') and 'user' for authentication status
  const privyContext = usePrivy();
  const privyReady = privyContext?.isReady ?? false;
  const privyAuthenticated = !!privyContext?.user;
  const walletContext = useEmbeddedEthereumWallet();
  const privyWallets = walletContext?.wallets ?? null;
  const createWallet = walletContext?.create ?? null;

  // Find embedded wallet from Privy
  const embeddedWallet =
    privyWallets && Array.isArray(privyWallets) && privyWallets.length > 0
      ? privyWallets[0]
      : null;

  const [walletStatus, setWalletStatus] = useState({
    hasWallet: false,
    walletAddress: null,
    privyWalletId: null,
  });
  const [polymarketStatus, setPolymarketStatus] = useState({
    linked: false,
    linkedAt: null,
  });
  const [loading, setLoading] = useState(true);
  const [linkingPolymarket, setLinkingPolymarket] = useState(false);
  const [depositAmount, setDepositAmount] = useState("");
  const [depositing, setDepositing] = useState(false);
  const [depositStatus, setDepositStatus] = useState(null);
  const [walletBalance, setWalletBalance] = useState(null);
  const [loadingBalance, setLoadingBalance] = useState(false);
  const [showDepositModal, setShowDepositModal] = useState(false);

  useEffect(() => {
    // Load user status when Privy wallet is available
    if (privyReady) {
      loadUserStatus();
    }
  }, [privyReady, embeddedWallet?.address]);

  // Sync embedded wallet address when Privy wallet is available
  useEffect(() => {
    if (embeddedWallet?.address) {
      setWalletStatus((prev) => ({
        ...prev,
        walletAddress: embeddedWallet.address,
        hasWallet: true,
        privyWalletId: embeddedWallet.id || embeddedWallet.address,
      }));
    }
  }, [embeddedWallet?.address, embeddedWallet?.id]);

  const loadUserStatus = async () => {
    setLoading(true);
    try {
      // Prefer embedded wallet if present; otherwise use backend-provisioned wallet info (from AuthContext)
      const backendWalletAddress =
        backendSetup?.data?.walletAddress ||
        backendSetup?.data?.wallet_address ||
        null;
      const backendPrivyWalletId =
        backendSetup?.data?.privyWalletId ||
        backendSetup?.data?.privy_wallet_id ||
        null;

      const hasEmbedded = !!embeddedWallet?.address;
      const hasBackend = !!backendWalletAddress;

      if (hasEmbedded) {
        setWalletStatus({
          hasWallet: true,
          walletAddress: embeddedWallet.address,
          privyWalletId: embeddedWallet.id || embeddedWallet.address,
        });
      } else if (hasBackend) {
        setWalletStatus({
          hasWallet: true,
          walletAddress: backendWalletAddress,
          privyWalletId: backendPrivyWalletId || backendWalletAddress,
        });
      } else {
        setWalletStatus({
          hasWallet: false,
          walletAddress: null,
          privyWalletId: null,
        });
      }

      // For Polymarket status, we'll try to get it from Supabase if we have a way to map Privy user to Supabase user
      // For now, set default values
      setPolymarketStatus({
        linked: false,
        linkedAt: null,
      });

      console.log("💰 Privy Wallet Info:", {
        hasEmbeddedWallet: !!embeddedWallet?.address,
        embeddedWalletAddress: embeddedWallet?.address,
        embeddedPrivyWalletId: embeddedWallet?.id,
        hasBackendWallet: hasBackend,
        backendWalletAddress,
        backendPrivyWalletId,
      });
    } catch (error) {
      console.error("Error loading user status:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLinkPolymarket = async () => {
    if (!walletStatus.hasWallet || !walletStatus.walletAddress) {
      Alert.alert("Error", "Wallet not found. Please contact support.");
      return;
    }

    Alert.alert(
      "Polymarket Linking",
      "Polymarket linking functionality requires backend integration. Please contact support."
    );
  };

  const handleDeposit = async () => {
    if (!user?.id || !depositAmount || parseFloat(depositAmount) <= 0) {
      Alert.alert("Error", "Please enter a valid deposit amount");
      return;
    }

    if (!walletStatus.hasWallet && !embeddedWallet?.address) {
      Alert.alert("Error", "Wallet not found. Please contact support.");
      return;
    }

    const walletAddress = embeddedWallet?.address || walletStatus.walletAddress;
    if (!walletAddress) {
      Alert.alert("Error", "Wallet address not found.");
      return;
    }

    setDepositing(true);

    // Deposit functionality has been removed
    Alert.alert(
      "Deposit Unavailable",
      "Deposit functionality is currently unavailable."
    );
    setDepositing(false);
  };

  const handleLogout = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          const { error } = await signOut();
          if (error) {
            Alert.alert("Error", error.message);
          }
        },
      },
    ]);
  };

  const formatWalletAddress = (address) => {
    if (!address) return "Not available";
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <LinearGradient
      colors={["#0A0E27", "#1A1F3A", "#2D1B3D", "#1A0F2E"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Profile</Text>
          </View>

          {/* User Card */}
          {user && (
            <View style={styles.userCard}>
              <View style={styles.avatarContainer}>
                <View style={styles.avatar}>
                  <Ionicons
                    name="person"
                    size={normalize(32)}
                    color="#FFFFFF"
                  />
                </View>
              </View>
              <Text style={styles.email}>
                {(() => {
                  // Try to get primary email/phone from linked accounts first
                  if (user.linked_accounts && user.linked_accounts.length > 0) {
                    const emailAccount = user.linked_accounts.find(
                      (acc) => acc.type === "email"
                    );
                    if (emailAccount?.address) return emailAccount.address;
                    const phoneAccount = user.linked_accounts.find(
                      (acc) => acc.type === "phone"
                    );
                    if (phoneAccount?.number) return phoneAccount.number;
                  }
                  // Fallback to legacy properties
                  return (
                    user.email?.address ||
                    user.phone?.number ||
                    user.google?.email ||
                    user.apple?.email ||
                    "User Account"
                  );
                })()}
              </Text>
            </View>
          )}

          {/* Account Details Section */}
          {user && (
            <View style={styles.accountDetailsCard}>
              <Text style={styles.sectionTitle}>Account Details</Text>

              {/* User ID */}
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>User ID</Text>
                <Text
                  style={styles.detailValue}
                  numberOfLines={1}
                  ellipsizeMode="middle"
                >
                  {user.id || "N/A"}
                </Text>
              </View>

              {/* Linked Accounts */}
              {user.linked_accounts && user.linked_accounts.length > 0 && (
                <View style={styles.detailSection}>
                  <Text style={styles.detailSectionTitle}>Linked Accounts</Text>
                  {user.linked_accounts.map((account, index) => {
                    let accountInfo = null;
                    let icon = "link-outline";

                    if (account.type === "email") {
                      accountInfo = account.address || "Email";
                      icon = "mail-outline";
                    } else if (account.type === "phone") {
                      accountInfo = account.number || "Phone";
                      icon = "call-outline";
                    } else if (account.type === "wallet") {
                      const address =
                        account.address || account.walletClientType;
                      accountInfo = address
                        ? `${address.slice(0, 6)}...${address.slice(-4)}`
                        : "Wallet";
                      icon = "wallet-outline";
                    } else if (account.type === "google_oauth") {
                      accountInfo =
                        account.email || account.name || "Google Account";
                      icon = "logo-google";
                    } else if (account.type === "apple_oauth") {
                      accountInfo =
                        account.email || account.name || "Apple Account";
                      icon = "logo-apple";
                    } else {
                      accountInfo =
                        account.email ||
                        account.address ||
                        account.number ||
                        account.type;
                    }

                    const typeLabel = account.type
                      .replace(/_/g, " ")
                      .replace(/oauth/gi, "OAuth")
                      .split(" ")
                      .map(
                        (word) => word.charAt(0).toUpperCase() + word.slice(1)
                      )
                      .join(" ");

                    return (
                      <View
                        key={account.id || index}
                        style={styles.linkedAccountRow}
                      >
                        <Ionicons
                          name={icon}
                          size={normalize(18)}
                          color={Colors.textSecondary}
                        />
                        <View style={styles.linkedAccountInfo}>
                          <Text style={styles.linkedAccountText}>
                            {accountInfo}
                          </Text>
                          <Text style={styles.linkedAccountType}>
                            {typeLabel}
                          </Text>
                        </View>
                      </View>
                    );
                  })}
                </View>
              )}

              {/* Created At */}
              {user.created_at && (
                <View style={[styles.detailRow, { borderBottomWidth: 0 }]}>
                  <Text style={styles.detailLabel}>Member Since</Text>
                  <Text style={styles.detailValue}>
                    {new Date(user.created_at).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </Text>
                </View>
              )}

              {/* Backend setup status (wallet attach + Polymarket link) */}
              <View style={[styles.detailRow, { borderBottomWidth: 0 }]}>
                <Text style={styles.detailLabel}>Backend Setup</Text>
                <Text style={styles.detailValue}>
                  {backendSetup?.status || "unknown"}
                </Text>
              </View>

              {backendSetup?.status === "error" && (
                <View style={{ marginTop: Spacing.sm }}>
                  <Text style={[styles.detailLabel, { flex: undefined }]}>
                    Error: {backendSetup?.error}
                  </Text>
                  {typeof retryBackendSetup === "function" && (
                    <TouchableOpacity
                      style={[styles.linkButton, { marginTop: Spacing.sm }]}
                      onPress={retryBackendSetup}
                      activeOpacity={0.8}
                    >
                      <Ionicons
                        name="refresh-outline"
                        size={normalize(20)}
                        color="#FFFFFF"
                      />
                      <Text style={styles.linkButtonText}>Retry Setup</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </View>
          )}

          {/* Status Cards */}
          {!loading && (
            <View style={styles.statusSection}>
              {/* Wallet Status Card */}
              <View style={styles.statusCard}>
                <View style={styles.statusHeader}>
                  <Ionicons
                    name={walletStatus.hasWallet ? "wallet" : "wallet-outline"}
                    size={normalize(24)}
                    color={
                      walletStatus.hasWallet ? Colors.success : Colors.textMuted
                    }
                  />
                  <Text style={styles.statusTitle}>Wallet</Text>
                </View>
                <Text style={styles.statusValue}>
                  {walletStatus.hasWallet ? "Connected" : "Not Connected"}
                </Text>
                {walletStatus.walletAddress && (
                  <Text style={styles.walletAddress}>
                    {formatWalletAddress(walletStatus.walletAddress)}
                  </Text>
                )}
              </View>

              {/* Polymarket Status Card */}
              <View style={styles.statusCard}>
                <View style={styles.statusHeader}>
                  <Ionicons
                    name={
                      polymarketStatus.linked
                        ? "checkmark-circle"
                        : "close-circle-outline"
                    }
                    size={normalize(24)}
                    color={
                      polymarketStatus.linked
                        ? Colors.success
                        : Colors.textMuted
                    }
                  />
                  <Text style={styles.statusTitle}>Polymarket</Text>
                </View>
                <Text style={styles.statusValue}>
                  {polymarketStatus.linked ? "Linked" : "Not Linked"}
                </Text>
              </View>
            </View>
          )}

          {/* Wallet Balance Section */}

          {/* Link to Polymarket Button */}
          {!loading && walletStatus.hasWallet && !polymarketStatus.linked && (
            <TouchableOpacity
              style={styles.linkButton}
              onPress={handleLinkPolymarket}
              disabled={linkingPolymarket}
              activeOpacity={0.8}
            >
              {linkingPolymarket ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons
                    name="link-outline"
                    size={normalize(20)}
                    color="#FFFFFF"
                  />
                  <Text style={styles.linkButtonText}>Link to Polymarket</Text>
                </>
              )}
            </TouchableOpacity>
          )}

          {/* Sign Out Button */}
          <TouchableOpacity
            style={styles.signOutButton}
            onPress={handleLogout}
            activeOpacity={0.8}
          >
            <Ionicons
              name="log-out-outline"
              size={normalize(20)}
              color={Colors.danger}
            />
            <Text style={styles.signOutText}>Sign Out</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const avatarSize = normalize(80);
const titleFontSize = normalizeFont(32);
const emailFontSize = normalizeFont(16);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
  safeArea: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.xxxl,
  },
  header: {
    marginBottom: Spacing.xxl,
  },
  title: {
    ...Typography.sectionTitle,
    fontSize: titleFontSize,
    color: Colors.textPrimary,
    fontWeight: "800",
  },
  userCard: {
    ...CommonStyles.card,
    alignItems: "center",
    paddingVertical: Spacing.xxl,
    marginBottom: Spacing.xl,
  },
  avatarContainer: {
    marginBottom: Spacing.lg,
  },
  avatar: {
    width: avatarSize,
    height: avatarSize,
    borderRadius: avatarSize / 2,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: Colors.primaryLight,
    ...Shadows.primaryGlow,
  },
  email: {
    ...Typography.body,
    fontSize: emailFontSize,
    color: Colors.textSecondary,
    fontWeight: "600",
  },
  statusSection: {
    flexDirection: "row",
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  statusCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.subtleShadow,
  },
  statusHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  statusTitle: {
    ...Typography.caption,
    fontSize: normalizeFont(12),
    color: Colors.textTertiary,
    fontWeight: "600",
  },
  statusValue: {
    ...Typography.body,
    fontSize: normalizeFont(14),
    color: Colors.textPrimary,
    fontWeight: "600",
    marginTop: Spacing.xs,
  },
  walletAddress: {
    ...Typography.caption,
    fontSize: normalizeFont(10),
    color: Colors.textMuted,
    marginTop: Spacing.xs,
    fontFamily: "monospace",
  },
  linkButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
    ...Shadows.primaryGlow,
  },
  linkButtonText: {
    ...Typography.body,
    fontSize: normalizeFont(16),
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  signOutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.dangerMuted,
  },
  signOutText: {
    ...Typography.body,
    fontSize: normalizeFont(16),
    fontWeight: "600",
    color: Colors.danger,
  },
  balanceCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.subtleShadow,
  },
  balanceHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  balanceTitle: {
    ...Typography.body,
    fontSize: normalizeFont(14),
    color: Colors.textSecondary,
    fontWeight: "600",
  },
  balanceAmount: {
    ...Typography.body,
    fontSize: normalizeFont(24),
    color: Colors.textPrimary,
    fontWeight: "700",
    marginTop: Spacing.xs,
  },
  depositSection: {
    marginBottom: Spacing.lg,
  },
  depositButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.success,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    gap: Spacing.sm,
    ...Shadows.subtleShadow,
  },
  depositButtonText: {
    ...Typography.body,
    fontSize: normalizeFont(16),
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  depositForm: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  depositFormTitle: {
    ...Typography.body,
    fontSize: normalizeFont(16),
    fontWeight: "700",
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  depositInput: {
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.sm,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    color: Colors.textPrimary,
    fontSize: normalizeFont(16),
  },
  paymentMethodContainer: {
    marginBottom: Spacing.md,
  },
  paymentMethodLabel: {
    ...Typography.caption,
    fontSize: normalizeFont(12),
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
    fontWeight: "600",
  },
  paymentMethodButtons: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  paymentMethodButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.xs,
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.sm,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  paymentMethodButtonActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.surface,
  },
  paymentMethodText: {
    ...Typography.caption,
    fontSize: normalizeFont(14),
    color: Colors.textMuted,
    fontWeight: "500",
  },
  paymentMethodTextActive: {
    color: Colors.primary,
    fontWeight: "600",
  },
  paymentMethodNote: {
    ...Typography.caption,
    fontSize: normalizeFont(11),
    color: Colors.textMuted,
    marginTop: Spacing.xs,
    fontStyle: "italic",
  },
  depositButtons: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cancelButtonText: {
    ...Typography.body,
    fontSize: normalizeFont(16),
    fontWeight: "600",
    color: Colors.textSecondary,
  },
  confirmDepositButton: {
    flex: 1,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    alignItems: "center",
    ...Shadows.primaryGlow,
  },
  confirmDepositButtonText: {
    ...Typography.body,
    fontSize: normalizeFont(16),
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  depositStatus: {
    marginTop: Spacing.md,
    padding: Spacing.md,
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.sm,
  },
  depositStatusText: {
    ...Typography.caption,
    fontSize: normalizeFont(12),
    color: Colors.textSecondary,
    textAlign: "center",
  },
  polBalance: {
    ...Typography.caption,
    fontSize: normalizeFont(12),
    color: Colors.textMuted,
    marginTop: Spacing.xs,
  },
  accountDetailsCard: {
    ...CommonStyles.card,
    marginBottom: Spacing.xl,
    padding: Spacing.lg,
  },
  sectionTitle: {
    ...Typography.body,
    fontSize: normalizeFont(18),
    fontWeight: "700",
    color: Colors.textPrimary,
    marginBottom: Spacing.lg,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  detailLabel: {
    ...Typography.body,
    fontSize: normalizeFont(14),
    color: Colors.textSecondary,
    fontWeight: "500",
    flex: 1,
  },
  detailValue: {
    ...Typography.body,
    fontSize: normalizeFont(14),
    color: Colors.textPrimary,
    fontWeight: "600",
    flex: 2,
    textAlign: "right",
  },
  detailSection: {
    marginTop: Spacing.md,
    marginBottom: Spacing.md,
  },
  detailSectionTitle: {
    ...Typography.body,
    fontSize: normalizeFont(14),
    fontWeight: "600",
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  linkedAccountRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.xs,
    gap: Spacing.sm,
  },
  linkedAccountInfo: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  linkedAccountText: {
    ...Typography.body,
    fontSize: normalizeFont(14),
    color: Colors.textPrimary,
    fontWeight: "500",
    flex: 1,
  },
  linkedAccountType: {
    ...Typography.caption,
    fontSize: normalizeFont(11),
    color: Colors.textMuted,
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xs,
  },
});
