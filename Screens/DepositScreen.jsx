import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Modal,
  ActivityIndicator,
  useColorScheme,
} from "react-native";
import React, { useState, useMemo, useCallback } from "react";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../src/contexts/AuthContext";
import { Spacing, Typography, BorderRadius } from "../src/constants/theme";
import { normalizeFont } from "../src/utils/dimensions";
import {
  CoinflowPurchase,
} from "@coinflowlabs/react-native";
import API_BASE_URL from "../src/config/api";

export default function DepositScreen() {
  const isDarkMode = useColorScheme() !== "light";
  const theme = isDarkMode ? DARK_THEME : LIGHT_THEME;
  const styles = useMemo(() => createStyles(theme), [theme]);

  const navigation = useNavigation();
  const route = useRoute();
  const { user } = useAuth();

  const walletAddress =
    route.params?.walletAddress ||
    user?.linked_accounts?.find(
      (account) =>
        account.type === "wallet" && account.wallet_client_type === "privy"
    )?.address ||
    user?.linked_accounts?.[1]?.address;
  const userId = user?.id;

  const [amount, setAmount] = useState("");
  const [showCoinflow, setShowCoinflow] = useState(false);
  const [paymentMode, setPaymentMode] = useState(null);
  const [coinflowConfig, setCoinflowConfig] = useState(null);
  const [loading, setLoading] = useState(false);

  const numAmount = parseFloat(amount) || 0;
  const amountCents = Math.round(numAmount * 100);
  const isValidAmount = numAmount > 0;

  const fetchSessionKey = useCallback(async () => {
    if (!walletAddress) {
      console.warn("[DepositScreen] No wallet address available");
      return null;
    }

    console.log("[DepositScreen] Fetching Coinflow session key for wallet:", walletAddress);
    const url = `${API_BASE_URL}/api/coinflow/auth/session-key?walletAddress=${encodeURIComponent(walletAddress)}`;
    const res = await fetch(url);
    const data = await res.json();
    console.log("[DepositScreen] Coinflow response:", res.status, JSON.stringify(data));

    if (!res.ok) throw new Error(`Coinflow request failed (${res.status})`);

    const key = data?.sessionKey ?? data?.key ?? data?.session_key;
    if (!key || !data?.merchantId) {
      throw new Error("Missing sessionKey or merchantId in response");
    }

    return {
      sessionKey: key,
      merchantId: "scoretrade",
      env: data.env || "sandbox",
    };
  }, [walletAddress]);

  const openCheckout = useCallback(async (mode) => {
    if (!isValidAmount) return;
    setLoading(true);
    setPaymentMode(mode);

    try {
      // Always fetch a fresh session key to avoid stale/expired keys
      const config = await fetchSessionKey();
      if (!config) {
        setLoading(false);
        setPaymentMode(null);
        return;
      }
      setCoinflowConfig(config);
      console.log("[DepositScreen] Opening Coinflow checkout with config:", JSON.stringify(config));
      setShowCoinflow(true);
    } catch (err) {
      console.error("[DepositScreen] Failed to start checkout:", err?.message);
      setCoinflowConfig(null);
      alert("Unable to set up payment. Please try again.");
      setPaymentMode(null);
    } finally {
      setLoading(false);
    }
  }, [isValidAmount, fetchSessionKey]);

  const handleCoinflowSuccess = (result) => {
    const paymentId = typeof result === "string" ? result : result?.paymentId;
    console.log("[Deposit] Coinflow payment success:", paymentId);
    setShowCoinflow(false);
    setPaymentMode(null);
    navigation.goBack();
  };

  const allowedMethods =
    paymentMode === "applePay" ? ["applePay"] : ["card"];

  const quickAmounts = [25, 50, 100, 250, 500];

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="chevron-back" size={22} color={theme.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Deposit</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.content}>
            <Text style={styles.title}>Add Funds</Text>
            <Text style={styles.subtitle}>
              Enter the amount you'd like to deposit to your wallet
            </Text>

            {/* Amount Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.currencySymbol}>$</Text>
              <TextInput
                style={styles.input}
                placeholder="0.00"
                placeholderTextColor={theme.textTertiary}
                value={amount}
                onChangeText={setAmount}
                keyboardType="decimal-pad"
                autoFocus
              />
            </View>

            {/* Quick Amount Buttons */}
            <View style={styles.quickAmountsContainer}>
              <Text style={styles.quickAmountsLabel}>Quick amounts:</Text>
              <View style={styles.quickAmountsRow}>
                {quickAmounts.map((qa) => (
                  <TouchableOpacity
                    key={qa}
                    style={[
                      styles.quickAmountButton,
                      amount === qa.toString() && styles.quickAmountButtonActive,
                    ]}
                    onPress={() => setAmount(qa.toString())}
                  >
                    <Text
                      style={[
                        styles.quickAmountText,
                        amount === qa.toString() && styles.quickAmountTextActive,
                      ]}
                    >
                      ${qa}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.paymentButtons}>
              {/* Apple Pay Button */}
              {Platform.OS === "ios" && (
                <TouchableOpacity
                  style={[
                    styles.applePayButton,
                    (!isValidAmount || loading) && styles.buttonDisabled,
                  ]}
                  onPress={() => openCheckout("applePay")}
                  disabled={!isValidAmount || loading}
                  activeOpacity={0.85}
                >
                  {loading && paymentMode === "applePay" ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Ionicons name="logo-apple" size={20} color="#FFFFFF" />
                  )}
                  <Text style={styles.applePayButtonText}>
                    {loading && paymentMode === "applePay"
                      ? "Setting up…"
                      : `Pay with Apple Pay${isValidAmount ? ` — $${numAmount.toFixed(2)}` : ""}`}
                  </Text>
                </TouchableOpacity>
              )}

              {/* Card Payment Button */}
              <TouchableOpacity
                style={[
                  styles.cardButton,
                  (!isValidAmount || loading) && styles.buttonDisabled,
                ]}
                onPress={() => openCheckout("card")}
                disabled={!isValidAmount || loading}
                activeOpacity={0.85}
              >
                {loading && paymentMode === "card" ? (
                  <ActivityIndicator size="small" color={theme.textPrimary} />
                ) : (
                  <Ionicons
                    name="card-outline"
                    size={20}
                    color={theme.textPrimary}
                  />
                )}
                <Text style={styles.cardButtonText}>
                  {loading && paymentMode === "card"
                    ? "Setting up…"
                    : `Pay with Card${isValidAmount ? ` — $${numAmount.toFixed(2)}` : ""}`}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Coinflow Checkout Modal */}
      <Modal
        visible={showCoinflow}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => {
          setShowCoinflow(false);
          setPaymentMode(null);
        }}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => {
                setShowCoinflow(false);
                setPaymentMode(null);
              }}
            >
              <Ionicons name="close" size={24} color={theme.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              {paymentMode === "applePay" ? "Apple Pay" : "Card Payment"} — $
              {numAmount.toFixed(2)}
            </Text>
            <View style={{ width: 40 }} />
          </View>

          {coinflowConfig?.sessionKey && coinflowConfig?.merchantId ? (
            <CoinflowPurchase
              sessionKey={coinflowConfig.sessionKey}
              merchantId={coinflowConfig.merchantId}
              blockchain="solana"
              env={coinflowConfig.env || "sandbox"}
              subtotal={{ cents: amountCents, currency: "USD" }}
              settlementType="Credits"
              allowedPaymentMethods={allowedMethods}
              onSuccess={handleCoinflowSuccess}
              onLoad={() => console.log("[DepositScreen] Coinflow WebView loaded")}
              chargebackProtectionData={[
                {
                  productName: "Wallet Funding",
                  productType: "topUp",
                  quantity: 1,
                },
              ]}
              loaderBackground={isDarkMode ? "#000000" : "#FFFFFF"}
              style={styles.coinflowWebView}
            />
          ) : (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={theme.textPrimary} />
              <Text style={styles.loadingText}>Loading payment...</Text>
            </View>
          )}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const DARK_THEME = {
  background: "#000000",
  textPrimary: "#FFFFFF",
  textSecondary: "#D1D5DB",
  textTertiary: "#9CA3AF",
  border: "rgba(255, 255, 255, 0.12)",
  surface: "rgba(255, 255, 255, 0.1)",
  subtleSurface: "rgba(255, 255, 255, 0.05)",
  accent: "#6366F1",
  accentMuted: "rgba(99, 102, 241, 0.15)",
};

const LIGHT_THEME = {
  background: "#F5F7FB",
  textPrimary: "#111827",
  textSecondary: "#374151",
  textTertiary: "#6B7280",
  border: "rgba(17, 24, 39, 0.15)",
  surface: "rgba(17, 24, 39, 0.06)",
  subtleSurface: "rgba(17, 24, 39, 0.04)",
  accent: "#6366F1",
  accentMuted: "rgba(99, 102, 241, 0.1)",
};

const createStyles = (theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    keyboardView: {
      flex: 1,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: Spacing.xl,
      paddingTop: Spacing.md,
      paddingBottom: Spacing.md,
    },
    backButton: {
      width: 40,
      height: 40,
      justifyContent: "center",
      alignItems: "flex-start",
    },
    headerTitle: {
      ...Typography.sectionTitle,
      fontSize: normalizeFont(20),
      color: theme.textPrimary,
      fontWeight: "600",
    },
    headerSpacer: {
      width: 40,
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      flexGrow: 1,
      paddingBottom: Spacing.xxxl,
    },
    content: {
      flex: 1,
      paddingHorizontal: Spacing.xl,
      paddingTop: Spacing.lg,
    },
    title: {
      ...Typography.pageTitle,
      fontSize: normalizeFont(32),
      color: theme.textPrimary,
      marginBottom: Spacing.sm,
    },
    subtitle: {
      ...Typography.body,
      fontSize: normalizeFont(16),
      color: theme.textSecondary,
      marginBottom: Spacing.xl,
      lineHeight: 22,
    },
    inputContainer: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: theme.surface,
      borderRadius: BorderRadius.md,
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.xl,
      marginBottom: Spacing.xl,
      borderWidth: 1,
      borderColor: theme.border,
    },
    currencySymbol: {
      ...Typography.sectionTitle,
      fontSize: normalizeFont(28),
      color: theme.textPrimary,
      marginRight: Spacing.sm,
    },
    input: {
      flex: 1,
      ...Typography.sectionTitle,
      fontSize: normalizeFont(36),
      color: theme.textPrimary,
      padding: 0,
    },
    quickAmountsContainer: {
      marginBottom: Spacing.xl,
    },
    quickAmountsLabel: {
      ...Typography.caption,
      fontSize: normalizeFont(12),
      color: theme.textTertiary,
      marginBottom: Spacing.sm,
      textTransform: "uppercase",
      letterSpacing: 1.2,
    },
    quickAmountsRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: Spacing.sm,
    },
    quickAmountButton: {
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.md,
      borderRadius: BorderRadius.sm,
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.border,
    },
    quickAmountButtonActive: {
      backgroundColor: theme.accentMuted,
      borderColor: theme.accent,
    },
    quickAmountText: {
      ...Typography.body,
      fontSize: normalizeFont(16),
      color: theme.textSecondary,
      fontWeight: "600",
    },
    quickAmountTextActive: {
      color: theme.accent,
    },
    paymentButtons: {
      gap: Spacing.md,
    },
    applePayButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "#000000",
      borderRadius: BorderRadius.md,
      paddingVertical: Spacing.lg,
      gap: Spacing.sm,
    },
    applePayButtonText: {
      fontSize: normalizeFont(16),
      fontWeight: "600",
      color: "#FFFFFF",
    },
    cardButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.surface,
      borderRadius: BorderRadius.md,
      paddingVertical: Spacing.lg,
      gap: Spacing.sm,
      borderWidth: 1,
      borderColor: theme.border,
    },
    cardButtonText: {
      ...Typography.body,
      fontSize: normalizeFont(16),
      fontWeight: "600",
      color: theme.textPrimary,
    },
    buttonDisabled: {
      opacity: 0.4,
    },
    modalContainer: {
      flex: 1,
      backgroundColor: theme.background,
    },
    modalHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    modalCloseButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.surface,
      alignItems: "center",
      justifyContent: "center",
    },
    modalTitle: {
      ...Typography.sectionTitle,
      fontSize: normalizeFont(16),
      color: theme.textPrimary,
      fontWeight: "600",
    },
    coinflowWebView: {
      flex: 1,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    loadingText: {
      ...Typography.body,
      fontSize: normalizeFont(14),
      color: theme.textSecondary,
      marginTop: Spacing.md,
    },
  });
