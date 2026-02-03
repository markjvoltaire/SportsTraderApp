import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import React, { useState } from "react";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../src/contexts/AuthContext";
import { Colors, Spacing, Typography } from "../src/constants/theme";

export default function DepositAmountScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { user } = useAuth();
  
  // Get wallet address from user
  const walletAddress = user?.linked_accounts?.[1]?.address;
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
    navigation.navigate("AddFunds", {
      amount: amount,
      walletAddress: walletAddress,
      userId: userId,
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
        {/* Back Button */}
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
        </View>

        <View style={styles.content}>
          <Text style={styles.title}>Add Funds</Text>
          <Text style={styles.subtitle}>
            Enter the amount you'd like to deposit
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

          {/* Submit Button */}
          <TouchableOpacity
            style={[
              styles.submitButton,
              (!amount || parseFloat(amount) <= 0) && styles.submitButtonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={!amount || parseFloat(amount) <= 0}
          >
            <Text style={styles.submitButtonText}>Continue</Text>
          </TouchableOpacity>
        </View>
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
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.sm,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "flex-start",
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.xl,
  },
  title: {
    ...Typography.pageTitle,
    fontSize: 32,
    marginBottom: Spacing.sm,
  },
  subtitle: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginBottom: Spacing.xl,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderRadius: 12,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.lg,
    marginBottom: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  currencySymbol: {
    ...Typography.sectionTitle,
    fontSize: 24,
    marginRight: Spacing.sm,
    color: Colors.textPrimary,
  },
  input: {
    flex: 1,
    ...Typography.sectionTitle,
    fontSize: 32,
    color: Colors.textPrimary,
    padding: 0,
  },
  quickAmountsContainer: {
    marginBottom: Spacing.xl,
  },
  quickAmountsLabel: {
    ...Typography.caption,
    color: Colors.textTertiary,
    marginBottom: Spacing.sm,
  },
  quickAmountsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  quickAmountButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: 8,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  quickAmountButtonActive: {
    backgroundColor: Colors.primaryMuted,
    borderColor: Colors.primary,
  },
  quickAmountText: {
    ...Typography.body,
    color: Colors.textSecondary,
    fontWeight: "600",
  },
  quickAmountTextActive: {
    color: Colors.primary,
  },
  submitButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: Spacing.lg,
    alignItems: "center",

    marginBottom: Spacing.xl,
  },
  submitButtonDisabled: {
    backgroundColor: Colors.surface,
    opacity: 0.5,
  },
  submitButtonText: {
    ...Typography.body,
    color: Colors.background,
    fontWeight: "600",
    fontSize: 16,
  },
});