import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

import { useAuth } from "../src/contexts/AuthContext";
import { getWalletBalance, processFiatPayment } from "../src/services/walletService";

import {
  Colors,
  Spacing,
  Typography,
  BorderRadius,
} from "../src/constants/theme";
import { normalizeFont } from "../src/utils/dimensions";

// Payment flow steps
const STEPS = {
  AMOUNT: "amount",
  PAYMENT_METHOD: "payment_method",
  PROCESSING: "processing",
  SUCCESS: "success",
  ERROR: "error",
};

// Quick amount options
const QUICK_AMOUNTS = [10, 25, 50, 100, 250, 500];

// Payment methods
const PAYMENT_METHODS = [
  {
    id: "card",
    name: "Credit or Debit Card",
    icon: "card-outline",
    description: "Visa, Mastercard, Amex",
    available: true,
  },
  {
    id: "bank",
    name: "Bank Transfer",
    icon: "business-outline",
    description: "Direct bank transfer (1-2 business days)",
    available: true,
  },
];

export default function AddFundsScreen() {
  const navigation = useNavigation();
  const { user: privyUser, supabaseUser } = useAuth();
  const [currentStep, setCurrentStep] = useState(STEPS.AMOUNT);
  const [selectedAmount, setSelectedAmount] = useState(null);
  const [customAmount, setCustomAmount] = useState("");
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null);
  const [currentBalance, setCurrentBalance] = useState(null);
  const [loadingBalance, setLoadingBalance] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [fadeAnim] = useState(new Animated.Value(1));

  // Fetch current balance
  useEffect(() => {
    const fetchBalance = async () => {
      if (!privyUser?.id || !supabaseUser?.access_token) return;

      try {
        setLoadingBalance(true);
        const { data, error } = await getWalletBalance(
          privyUser.id,
          supabaseUser.access_token
        );
        if (!error && data?.balance !== undefined) {
          setCurrentBalance(data.balance);
        }
      } catch (error) {
        console.error("Error fetching balance:", error);
      } finally {
        setLoadingBalance(false);
      }
    };

    fetchBalance();
  }, [privyUser?.id, supabaseUser?.access_token]);

  // Handle amount selection
  const handleAmountSelect = (amount) => {
    setSelectedAmount(amount);
    setCustomAmount("");
    setErrorMessage(null);
  };

  const handleCustomAmountChange = (text) => {
    // Remove non-numeric characters except decimal point
    const cleaned = text.replace(/[^0-9.]/g, "");
    setCustomAmount(cleaned);
    setSelectedAmount(null);
    setErrorMessage(null);
  };

  // Validate amount
  const getValidAmount = () => {
    if (selectedAmount) return selectedAmount;
    if (customAmount) {
      const amount = parseFloat(customAmount);
      if (isNaN(amount) || amount <= 0) return null;
      if (amount < 5) return null; // Minimum $5
      if (amount > 10000) return null; // Maximum $10,000
      return amount;
    }
    return null;
  };

  // Proceed to payment method selection
  const handleContinueToPayment = () => {
    const amount = getValidAmount();
    if (!amount) {
      setErrorMessage("Please enter an amount between $5 and $10,000");
      return;
    }
    setCurrentStep(STEPS.PAYMENT_METHOD);
  };

  // Handle payment method selection
  const handlePaymentMethodSelect = (methodId) => {
    setSelectedPaymentMethod(methodId);
  };

  // Process payment
  const handleProcessPayment = async () => {
    if (!selectedPaymentMethod) {
      setErrorMessage("Please select a payment method");
      return;
    }

    const amount = getValidAmount();
    if (!amount) {
      setErrorMessage("Invalid amount");
      return;
    }

    setCurrentStep(STEPS.PROCESSING);
    setProcessing(true);
    setErrorMessage(null);

    try {
      // Call backend endpoint for fiat-to-crypto conversion
      const { data, error } = await processFiatPayment(
        privyUser?.id,
        {
          amount: amount,
          paymentMethod: selectedPaymentMethod,
        },
        supabaseUser?.access_token
      );

      if (error) {
        throw new Error(error.message || "Payment processing failed");
      }

      // Simulate processing delay for better UX (remove in production if backend handles timing)
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Update balance
      if (data?.newBalance !== undefined) {
        setCurrentBalance(data.newBalance);
      } else if (data?.balance !== undefined) {
        setCurrentBalance(data.balance);
      }

      setCurrentStep(STEPS.SUCCESS);
    } catch (error) {
      console.error("Payment error:", error);
      setErrorMessage(
        error.message || "Unable to process payment. Please try again."
      );
      setCurrentStep(STEPS.ERROR);
    } finally {
      setProcessing(false);
    }
  };

  // Reset flow
  const handleReset = () => {
    setCurrentStep(STEPS.AMOUNT);
    setSelectedAmount(null);
    setCustomAmount("");
    setSelectedPaymentMethod(null);
    setErrorMessage(null);
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const validAmount = getValidAmount();

  return (
    <LinearGradient
      colors={["#0A0E27", "#1A1F3A", "#2D1B3D", "#1A0F2E"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.keyboardView}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => {
                if (currentStep === STEPS.AMOUNT) {
                  navigation.goBack();
                } else {
                  handleReset();
                }
              }}
              style={styles.backButton}
              activeOpacity={0.85}
            >
              <Ionicons
                name="chevron-back"
                size={normalizeFont(28)}
                color={Colors.textPrimary}
              />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Add Funds</Text>
            <View style={styles.backButton} />
          </View>

          {/* Current Balance Display */}
          <View style={styles.balanceCard}>
            <Text style={styles.balanceLabel}>Your Balance</Text>
            {loadingBalance ? (
              <ActivityIndicator size="small" color={Colors.primary} />
            ) : (
              <Text style={styles.balanceAmount}>
                {currentBalance !== null
                  ? formatCurrency(currentBalance)
                  : "$0.00"}
              </Text>
            )}
          </View>

          {/* Progress Indicator */}
          <View style={styles.progressContainer}>
            <View
              style={[
                styles.progressBar,
                {
                  width:
                    currentStep === STEPS.AMOUNT
                      ? "33%"
                      : currentStep === STEPS.PAYMENT_METHOD
                      ? "66%"
                      : "100%",
                },
              ]}
            />
          </View>

          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Step 1: Amount Selection */}
            {currentStep === STEPS.AMOUNT && (
              <Animated.View style={[styles.stepContainer, { opacity: fadeAnim }]}>
                <Text style={styles.stepTitle}>How much would you like to add?</Text>
                <Text style={styles.stepDescription}>
                  Choose a quick amount or enter a custom value
                </Text>

                {/* Quick Amount Buttons */}
                <View style={styles.quickAmountsContainer}>
                  {QUICK_AMOUNTS.map((amount) => (
                    <TouchableOpacity
                      key={amount}
                      style={[
                        styles.quickAmountButton,
                        selectedAmount === amount && styles.quickAmountButtonSelected,
                      ]}
                      onPress={() => handleAmountSelect(amount)}
                      activeOpacity={0.85}
                    >
                      <Text
                        style={[
                          styles.quickAmountText,
                          selectedAmount === amount &&
                            styles.quickAmountTextSelected,
                        ]}
                      >
                        ${amount}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Custom Amount Input */}
                <View style={styles.customAmountContainer}>
                  <Text style={styles.customAmountLabel}>Or enter custom amount</Text>
                  <View style={styles.amountInputContainer}>
                    <Text style={styles.currencySymbol}>$</Text>
                    <TextInput
                      style={styles.amountInput}
                      value={customAmount}
                      onChangeText={handleCustomAmountChange}
                      placeholder="0.00"
                      placeholderTextColor={Colors.textTertiary}
                      keyboardType="decimal-pad"
                      maxLength={8}
                    />
                  </View>
                  <Text style={styles.amountHint}>
                    Minimum $5 • Maximum $10,000
                  </Text>
                </View>

                {errorMessage && (
                  <View style={styles.errorContainer}>
                    <Ionicons
                      name="alert-circle"
                      size={normalizeFont(20)}
                      color={Colors.danger}
                    />
                    <Text style={styles.errorText}>{errorMessage}</Text>
                  </View>
                )}

                {/* Continue Button */}
                <TouchableOpacity
                  style={[
                    styles.primaryButton,
                    !validAmount && styles.primaryButtonDisabled,
                  ]}
                  onPress={handleContinueToPayment}
                  activeOpacity={0.85}
                  disabled={!validAmount}
                >
                  <Text
                    style={[
                      styles.primaryButtonText,
                      !validAmount && styles.primaryButtonTextDisabled,
                    ]}
                  >
                    Continue
                  </Text>
                  <Ionicons
                    name="arrow-forward"
                    size={normalizeFont(20)}
                    color={validAmount ? Colors.textPrimary : Colors.textTertiary}
                  />
                </TouchableOpacity>
              </Animated.View>
            )}

            {/* Step 2: Payment Method Selection */}
            {currentStep === STEPS.PAYMENT_METHOD && (
              <Animated.View style={[styles.stepContainer, { opacity: fadeAnim }]}>
                <Text style={styles.stepTitle}>Select payment method</Text>
                <Text style={styles.stepDescription}>
                  Choose how you'd like to add funds to your account
                </Text>

                {/* Payment Method Cards */}
                <View style={styles.paymentMethodsContainer}>
                  {PAYMENT_METHODS.map((method) => (
                    <TouchableOpacity
                      key={method.id}
                      style={[
                        styles.paymentMethodCard,
                        selectedPaymentMethod === method.id &&
                          styles.paymentMethodCardSelected,
                        !method.available && styles.paymentMethodCardDisabled,
                      ]}
                      onPress={() =>
                        method.available && handlePaymentMethodSelect(method.id)
                      }
                      activeOpacity={0.85}
                      disabled={!method.available}
                    >
                      <View style={styles.paymentMethodContent}>
                        <View style={styles.paymentMethodIconContainer}>
                          <Ionicons
                            name={method.icon}
                            size={normalizeFont(24)}
                            color={
                              selectedPaymentMethod === method.id
                                ? Colors.primary
                                : Colors.textSecondary
                            }
                          />
                        </View>
                        <View style={styles.paymentMethodInfo}>
                          <Text
                            style={[
                              styles.paymentMethodName,
                              selectedPaymentMethod === method.id &&
                                styles.paymentMethodNameSelected,
                            ]}
                          >
                            {method.name}
                          </Text>
                          <Text style={styles.paymentMethodDescription}>
                            {method.description}
                          </Text>
                        </View>
                        {selectedPaymentMethod === method.id && (
                          <View style={styles.checkmarkContainer}>
                            <Ionicons
                              name="checkmark-circle"
                              size={normalizeFont(24)}
                              color={Colors.primary}
                            />
                          </View>
                        )}
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Amount Summary */}
                <View style={styles.summaryCard}>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Amount to add</Text>
                    <Text style={styles.summaryValue}>
                      {formatCurrency(validAmount || 0)}
                    </Text>
                  </View>
                  <View style={[styles.summaryRow, { marginTop: Spacing.sm }]}>
                    <Text style={styles.summaryLabel}>Processing fee</Text>
                    <Text style={styles.summaryValue}>$0.00</Text>
                  </View>
                  <View style={styles.summaryDivider} />
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryTotalLabel}>Total</Text>
                    <Text style={styles.summaryTotalValue}>
                      {formatCurrency(validAmount || 0)}
                    </Text>
                  </View>
                </View>

                {errorMessage && (
                  <View style={styles.errorContainer}>
                    <Ionicons
                      name="alert-circle"
                      size={normalizeFont(20)}
                      color={Colors.danger}
                    />
                    <Text style={styles.errorText}>{errorMessage}</Text>
                  </View>
                )}

                {/* Process Payment Button */}
                <TouchableOpacity
                  style={[
                    styles.primaryButton,
                    !selectedPaymentMethod && styles.primaryButtonDisabled,
                  ]}
                  onPress={handleProcessPayment}
                  activeOpacity={0.85}
                  disabled={!selectedPaymentMethod || processing}
                >
                  <Text
                    style={[
                      styles.primaryButtonText,
                      !selectedPaymentMethod && styles.primaryButtonTextDisabled,
                    ]}
                  >
                    Add {formatCurrency(validAmount || 0)}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.backButtonText}
                  onPress={() => setCurrentStep(STEPS.AMOUNT)}
                >
                  <Text style={styles.backButtonTextLabel}>Back</Text>
                </TouchableOpacity>
              </Animated.View>
            )}

            {/* Step 3: Processing */}
            {currentStep === STEPS.PROCESSING && (
              <View style={styles.processingContainer}>
                <ActivityIndicator size="large" color={Colors.primary} />
                <Text style={styles.processingTitle}>Processing your payment</Text>
                <Text style={styles.processingDescription}>
                  Please wait while we securely process your transaction. This usually
                  takes a few seconds.
                </Text>
                <View style={styles.processingSteps}>
                  <View style={styles.processingStep}>
                    <Ionicons
                      name="checkmark-circle"
                      size={normalizeFont(20)}
                      color={Colors.success}
                    />
                    <Text style={styles.processingStepText}>
                      Payment details verified
                    </Text>
                  </View>
                  <View style={styles.processingStep}>
                    <ActivityIndicator size="small" color={Colors.primary} />
                    <Text style={styles.processingStepText}>
                      Processing transaction...
                    </Text>
                  </View>
                </View>
              </View>
            )}

            {/* Step 4: Success */}
            {currentStep === STEPS.SUCCESS && (
              <View style={styles.resultContainer}>
                <View style={styles.successIconContainer}>
                  <Ionicons
                    name="checkmark-circle"
                    size={normalizeFont(64)}
                    color={Colors.success}
                  />
                </View>
                <Text style={styles.resultTitle}>Payment Successful!</Text>
                <Text style={styles.resultDescription}>
                  {formatCurrency(validAmount || 0)} has been added to your account.
                  Your funds are available immediately.
                </Text>
                <View style={styles.successDetailsCard}>
                  <View style={styles.successDetailRow}>
                    <Text style={styles.successDetailLabel}>Amount added</Text>
                    <Text style={styles.successDetailValue}>
                      {formatCurrency(validAmount || 0)}
                    </Text>
                  </View>
                  <View style={styles.successDetailRow}>
                    <Text style={styles.successDetailLabel}>New balance</Text>
                    <Text style={styles.successDetailValue}>
                      {currentBalance !== null
                        ? formatCurrency(currentBalance)
                        : formatCurrency(validAmount || 0)}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.primaryButton}
                  onPress={() => {
                    handleReset();
                    navigation.goBack();
                  }}
                  activeOpacity={0.85}
                >
                  <Text style={styles.primaryButtonText}>Done</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Step 5: Error */}
            {currentStep === STEPS.ERROR && (
              <View style={styles.resultContainer}>
                <View style={styles.errorIconContainer}>
                  <Ionicons
                    name="close-circle"
                    size={normalizeFont(64)}
                    color={Colors.danger}
                  />
                </View>
                <Text style={styles.resultTitle}>Payment Failed</Text>
                <Text style={styles.resultDescription}>
                  {errorMessage ||
                    "We couldn't process your payment. Please try again or use a different payment method."}
                </Text>
                <TouchableOpacity
                  style={styles.primaryButton}
                  onPress={handleReset}
                  activeOpacity={0.85}
                >
                  <Text style={styles.primaryButtonText}>Try Again</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.secondaryButton}
                  onPress={() => navigation.goBack()}
                >
                  <Text style={styles.secondaryButtonText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
  safeArea: {
    flex: 1,
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
    paddingBottom: Spacing.lg,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    ...Typography.sectionTitle,
    fontSize: normalizeFont(24),
    color: Colors.textPrimary,
  },
  balanceCard: {
    backgroundColor: Colors.surface,
    marginHorizontal: Spacing.xl,
    marginBottom: Spacing.lg,
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
  },
  balanceLabel: {
    ...Typography.body,
    fontSize: normalizeFont(14),
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  balanceAmount: {
    ...Typography.heroPrice,
    fontSize: normalizeFont(32),
    color: Colors.primary,
  },
  progressContainer: {
    height: 4,
    backgroundColor: Colors.surface,
    marginHorizontal: Spacing.xl,
    marginBottom: Spacing.lg,
    borderRadius: BorderRadius.sm,
    overflow: "hidden",
  },
  progressBar: {
    height: "100%",
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.sm,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xxxl,
    flexGrow: 1,
  },
  stepContainer: {
    flex: 1,
  },
  stepTitle: {
    ...Typography.sectionTitle,
    fontSize: normalizeFont(28),
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  stepDescription: {
    ...Typography.body,
    fontSize: normalizeFont(16),
    color: Colors.textSecondary,
    marginBottom: Spacing.xl,
    lineHeight: 24,
  },
  quickAmountsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  quickAmountButton: {
    flex: 1,
    minWidth: "30%",
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.md,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  quickAmountButtonSelected: {
    backgroundColor: Colors.primaryMuted,
    borderColor: Colors.primary,
  },
  quickAmountText: {
    ...Typography.body,
    fontSize: normalizeFont(18),
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  quickAmountTextSelected: {
    color: Colors.primary,
  },
  customAmountContainer: {
    marginBottom: Spacing.xl,
  },
  customAmountLabel: {
    ...Typography.body,
    fontSize: normalizeFont(14),
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  amountInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    marginBottom: Spacing.xs,
  },
  currencySymbol: {
    ...Typography.body,
    fontSize: normalizeFont(20),
    fontWeight: "600",
    color: Colors.textPrimary,
    marginRight: Spacing.xs,
  },
  amountInput: {
    flex: 1,
    ...Typography.body,
    fontSize: normalizeFont(24),
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  amountHint: {
    ...Typography.caption,
    fontSize: normalizeFont(12),
    color: Colors.textTertiary,
    marginTop: Spacing.xs,
  },
  paymentMethodsContainer: {
    marginBottom: Spacing.xl,
    gap: Spacing.md,
  },
  paymentMethodCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  paymentMethodCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryMuted,
  },
  paymentMethodCardDisabled: {
    opacity: 0.5,
  },
  paymentMethodContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  paymentMethodIconContainer: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surfaceAlt,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  paymentMethodInfo: {
    flex: 1,
  },
  paymentMethodName: {
    ...Typography.body,
    fontSize: normalizeFont(16),
    fontWeight: "600",
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  paymentMethodNameSelected: {
    color: Colors.primary,
  },
  paymentMethodDescription: {
    ...Typography.caption,
    fontSize: normalizeFont(13),
    color: Colors.textSecondary,
  },
  checkmarkContainer: {
    marginLeft: Spacing.md,
  },
  summaryCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  summaryLabel: {
    ...Typography.body,
    fontSize: normalizeFont(14),
    color: Colors.textSecondary,
  },
  summaryValue: {
    ...Typography.body,
    fontSize: normalizeFont(14),
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  summaryDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.md,
  },
  summaryTotalLabel: {
    ...Typography.body,
    fontSize: normalizeFont(16),
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  summaryTotalValue: {
    ...Typography.body,
    fontSize: normalizeFont(18),
    fontWeight: "700",
    color: Colors.primary,
  },
  primaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    gap: Spacing.sm,
    marginBottom: Spacing.md,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  primaryButtonDisabled: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowOpacity: 0,
    elevation: 0,
  },
  primaryButtonText: {
    ...Typography.body,
    fontSize: normalizeFont(18),
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  primaryButtonTextDisabled: {
    color: Colors.textTertiary,
  },
  secondaryButton: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.md,
  },
  secondaryButtonText: {
    ...Typography.body,
    fontSize: normalizeFont(16),
    fontWeight: "600",
    color: Colors.textSecondary,
  },
  backButtonText: {
    alignItems: "center",
    paddingVertical: Spacing.md,
  },
  backButtonTextLabel: {
    ...Typography.body,
    fontSize: normalizeFont(16),
    fontWeight: "600",
    color: Colors.textSecondary,
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.dangerMuted,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  errorText: {
    ...Typography.body,
    fontSize: normalizeFont(14),
    color: Colors.danger,
    flex: 1,
  },
  processingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.xxxl,
  },
  processingTitle: {
    ...Typography.sectionTitle,
    fontSize: normalizeFont(24),
    color: Colors.textPrimary,
    marginTop: Spacing.xl,
    marginBottom: Spacing.sm,
  },
  processingDescription: {
    ...Typography.body,
    fontSize: normalizeFont(16),
    color: Colors.textSecondary,
    textAlign: "center",
    marginBottom: Spacing.xl,
    paddingHorizontal: Spacing.xl,
    lineHeight: 24,
  },
  processingSteps: {
    width: "100%",
    paddingHorizontal: Spacing.xl,
    gap: Spacing.md,
  },
  processingStep: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  processingStepText: {
    ...Typography.body,
    fontSize: normalizeFont(14),
    color: Colors.textSecondary,
  },
  resultContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.xxxl,
  },
  successIconContainer: {
    marginBottom: Spacing.xl,
  },
  errorIconContainer: {
    marginBottom: Spacing.xl,
  },
  resultTitle: {
    ...Typography.sectionTitle,
    fontSize: normalizeFont(28),
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
    textAlign: "center",
  },
  resultDescription: {
    ...Typography.body,
    fontSize: normalizeFont(16),
    color: Colors.textSecondary,
    textAlign: "center",
    marginBottom: Spacing.xl,
    paddingHorizontal: Spacing.xl,
    lineHeight: 24,
  },
  successDetailsCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
    width: "100%",
    marginBottom: Spacing.xl,
  },
  successDetailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  successDetailLabel: {
    ...Typography.body,
    fontSize: normalizeFont(14),
    color: Colors.textSecondary,
  },
  successDetailValue: {
    ...Typography.body,
    fontSize: normalizeFont(16),
    fontWeight: "600",
    color: Colors.textPrimary,
  },
});
