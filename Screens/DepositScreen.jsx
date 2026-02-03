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
} from "react-native";
import React, { useState } from "react";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../src/contexts/AuthContext";
import { Colors, Spacing, Typography, BorderRadius } from "../src/constants/theme";
import { normalizeFont } from "../src/utils/dimensions";

export default function DepositScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { user } = useAuth();
  
  // Get wallet address from user's linked accounts or route params
  const walletAddress = 
    route.params?.walletAddress ||
    user?.linked_accounts?.find(
      (account) =>
        account.type === "wallet" && account.wallet_client_type === "privy"
    )?.address ||
    user?.linked_accounts?.[1]?.address;
  const userId = user?.id;

  const [amount, setAmount] = useState("");

  const handleSubmit = () => {
    // Validate amount
    const numAmount = parseFloat(amount);
    if (!amount || isNaN(numAmount) || numAmount <= 0) {
      alert("Please enter a valid amount");
      return;
    }

    if (!walletAddress || !userId) {
      alert("Wallet address or user ID not found");
      return;
    }

    // Navigate to AddFunds screen (Crossmint) with the amount, walletAddress, and userId
    navigation.navigate("Profile", {
      screen: "AddFunds",
      params: {
        amount: amount,
        walletAddress: walletAddress,
        userId: userId,
      },
    });
  };

  // Quick amount buttons
  const quickAmounts = [25, 50, 100, 250, 500];

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        {/* Header with Back Button */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons
              name="chevron-back"
              size={22}
              color={Colors.textPrimary}
            />
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
                placeholderTextColor={Colors.textTertiary}
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
                {quickAmounts.map((quickAmount) => (
                  <TouchableOpacity
                    key={quickAmount}
                    style={[
                      styles.quickAmountButton,
                      amount === quickAmount.toString() &&
                        styles.quickAmountButtonActive,
                    ]}
                    onPress={() => setAmount(quickAmount.toString())}
                  >
                    <Text
                      style={[
                        styles.quickAmountText,
                        amount === quickAmount.toString() &&
                          styles.quickAmountTextActive,
                      ]}
                    >
                      ${quickAmount}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Wallet Address Display */}
            {walletAddress && (
              <View style={styles.walletInfoContainer}>
                <Text style={styles.walletInfoLabel}>Wallet Address</Text>
                <View style={styles.walletAddressContainer}>
                  <Text style={styles.walletAddressText} numberOfLines={1}>
                    {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
                  </Text>
                  <TouchableOpacity
                    style={styles.copyButton}
                    onPress={() => {
                      // In a real app, you'd use Clipboard from expo-clipboard
                      alert("Address copied to clipboard");
                    }}
                  >
                    <Ionicons
                      name="copy-outline"
                      size={18}
                      color={Colors.textPrimary}
                    />
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Submit Button */}
            <TouchableOpacity
              style={[
                styles.submitButton,
                (!amount || parseFloat(amount) <= 0) && styles.submitButtonDisabled,
              ]}
              onPress={handleSubmit}
              disabled={!amount || parseFloat(amount) <= 0}
            >
              <Text style={styles.submitButtonText}>Continue to Payment</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
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
    color: Colors.textPrimary,
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
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  subtitle: {
    ...Typography.body,
    fontSize: normalizeFont(16),
    color: Colors.textSecondary,
    marginBottom: Spacing.xl,
    lineHeight: 22,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xl,
    marginBottom: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  currencySymbol: {
    ...Typography.sectionTitle,
    fontSize: normalizeFont(28),
    color: Colors.textPrimary,
    marginRight: Spacing.sm,
  },
  input: {
    flex: 1,
    ...Typography.sectionTitle,
    fontSize: normalizeFont(36),
    color: Colors.textPrimary,
    padding: 0,
  },
  quickAmountsContainer: {
    marginBottom: Spacing.xl,
  },
  quickAmountsLabel: {
    ...Typography.caption,
    fontSize: normalizeFont(12),
    color: Colors.textTertiary,
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
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  quickAmountButtonActive: {
    backgroundColor: Colors.primaryMuted,
    borderColor: Colors.primary,
  },
  quickAmountText: {
    ...Typography.body,
    fontSize: normalizeFont(16),
    color: Colors.textSecondary,
    fontWeight: "600",
  },
  quickAmountTextActive: {
    color: Colors.primary,
  },
  walletInfoContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  walletInfoLabel: {
    ...Typography.caption,
    fontSize: normalizeFont(12),
    color: Colors.textTertiary,
    marginBottom: Spacing.sm,
    textTransform: "uppercase",
    letterSpacing: 1.2,
  },
  walletAddressContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  walletAddressText: {
    ...Typography.body,
    fontSize: normalizeFont(14),
    color: Colors.textPrimary,
    fontFamily: "monospace",
    flex: 1,
    marginRight: Spacing.sm,
  },
  copyButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  submitButton: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.lg,
    alignItems: "center",
    justifyContent: "center",
    marginTop: Spacing.lg,
  },
  submitButtonDisabled: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    opacity: 0.5,
  },
  submitButtonText: {
    ...Typography.body,
    fontSize: normalizeFont(16),
    color: Colors.background,
    fontWeight: "600",
  },
});
