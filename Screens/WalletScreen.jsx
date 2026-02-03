import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { usePrivy, useEmbeddedEthereumWallet } from "@privy-io/expo";

import { useAuth } from "../src/contexts/AuthContext";
import LottieLoader from "../src/components/ui/LottieLoader";
import {
  Colors,
  Spacing,
  Typography,
  BorderRadius,
} from "../src/constants/theme";
import { normalizeFont } from "../src/utils/dimensions";
import { truncateHash, formatCurrency } from "../src/utils/formatters";
import { getWalletBalance } from "../src/services/walletService";

export default function WalletScreen() {
  const { user, session } = useAuth();
  const navigation = useNavigation();
  const { user: privyUser } = usePrivy();
  const { wallets } = useEmbeddedEthereumWallet();
  
  const [balance, setBalance] = useState(null);
  const [loadingBalance, setLoadingBalance] = useState(false);
  const [walletAddress, setWalletAddress] = useState(null);

  // Log wallet address when it changes
  useEffect(() => {
    if (walletAddress) {
      console.log("💼 Wallet Address (state):", walletAddress);
    }
  }, [walletAddress]);

  // Get wallet address from Privy
  useEffect(() => {
    const embeddedWallet = privyUser?.linked_accounts?.find(
      (account) =>
        account.type === "wallet" && account.wallet_client_type === "privy"
    ) || wallets?.[0];

    if (embeddedWallet?.address) {
      console.log("💼 Wallet Address:", embeddedWallet.address);
      setWalletAddress(embeddedWallet.address);
    } else {
      console.log("⚠️ No wallet address found");
    }
  }, [privyUser, wallets]);

  // Fetch wallet balance
  useEffect(() => {
    if (user?.id && session?.access_token) {
      fetchBalance();
    }
  }, [user?.id, session?.access_token]);

  const fetchBalance = async () => {
    if (!user?.id || !session?.access_token) return;
    
    setLoadingBalance(true);
    try {
      const { data, error } = await getWalletBalance(
        user.id,
        session.access_token
      );
      if (error) {
        console.error("Error fetching balance:", error);
        setBalance(0);
      } else {
        setBalance(data?.balance || data?.amount || 0);
      }
    } catch (error) {
      console.error("Error fetching balance:", error);
      setBalance(0);
    } finally {
      setLoadingBalance(false);
    }
  };

  const handleDeposit = () => {
    Alert.alert("Coming Soon", "Deposit functionality is coming soon.");
  };

  const handleCopyAddress = () => {
    if (!walletAddress) return;
    // In a real app, you'd use Clipboard from expo-clipboard
    Alert.alert("Address copied", walletAddress);
  };

  const handleRefresh = () => {
    fetchBalance();
  };

  if (!user) {
    return (
      <View style={styles.container}>
        <SafeAreaView style={styles.safeArea} edges={["top"]}>
          <View style={styles.loadingContainer}>
            <LottieLoader size="large" />
            <Text style={styles.loadingText}>Loading wallet...</Text>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Wallet</Text>
            <TouchableOpacity
              style={styles.refreshButton}
              onPress={handleRefresh}
              disabled={loadingBalance}
            >
              <Ionicons
                name="refresh"
                size={20}
                color={Colors.textPrimary}
                style={loadingBalance && styles.refreshing}
              />
            </TouchableOpacity>
          </View>

          {/* Balance Card */}
          <View style={styles.balanceCard}>
            <Text style={styles.balanceLabel}>Available Balance</Text>
            {loadingBalance ? (
              <View style={styles.balanceLoading}>
                <LottieLoader size="small" />
              </View>
            ) : (
              <Text style={styles.balanceAmount}>
                {formatCurrency(balance ?? 0)}
              </Text>
            )}
          </View>

          {/* Wallet Address Card - hidden for now */}

          {/* Action Buttons */}
          <View style={styles.actionsContainer}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleDeposit}
              activeOpacity={0.85}
            >
              <View style={styles.actionIconContainer}>
                <Ionicons
                  name="add-circle-outline"
                  size={24}
                  color={Colors.background}
                />
              </View>
              <Text style={styles.actionButtonText}>Deposit</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.actionButtonSecondary]}
              onPress={() => {
                Alert.alert("Coming Soon", "Withdraw functionality coming soon");
              }}
              activeOpacity={0.85}
            >
              <View
                style={[
                  styles.actionIconContainer,
                  styles.actionIconContainerSecondary,
                ]}
              >
                <Ionicons
                  name="arrow-up-outline"
                  size={24}
                  color={Colors.textPrimary}
                />
              </View>
              <Text style={styles.actionButtonTextSecondary}>Withdraw</Text>
            </TouchableOpacity>
          </View>

          {/* Transaction History Section */}
          <View style={styles.transactionsSection}>
            <Text style={styles.sectionTitle}>Recent Transactions</Text>
            <View style={styles.emptyStateContainer}>
              <View style={styles.emptyStateIcon}>
                <Ionicons
                  name="receipt-outline"
                  size={48}
                  color={Colors.textTertiary}
                />
              </View>
              <Text style={styles.emptyStateText}>
                No transactions yet
              </Text>
              <Text style={styles.emptyStateSubtext}>
                Your transaction history will appear here
              </Text>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: "100%",
    height: "100%",
    backgroundColor: Colors.background,
  },
  safeArea: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: Spacing.xxxl,
    flexGrow: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  headerTitle: {
    ...Typography.pageTitle,
    fontSize: normalizeFont(32),
    color: Colors.textPrimary,
  },
  refreshButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  refreshing: {
    opacity: 0.5,
  },
  balanceCard: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    marginHorizontal: Spacing.xl,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
  },
  balanceLabel: {
    ...Typography.caption,
    fontSize: normalizeFont(14),
    color: Colors.textTertiary,
    marginBottom: Spacing.sm,
    textTransform: "uppercase",
    letterSpacing: 1.2,
  },
  balanceAmount: {
    ...Typography.heroPrice,
    fontSize: normalizeFont(48),
    color: Colors.textPrimary,
  },
  balanceLoading: {
    height: 60,
    justifyContent: "center",
    alignItems: "center",
  },
  addressCard: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginHorizontal: Spacing.xl,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  addressHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.sm,
  },
  addressLabel: {
    ...Typography.caption,
    fontSize: normalizeFont(12),
    color: Colors.textTertiary,
    textTransform: "uppercase",
    letterSpacing: 1.2,
  },
  copyButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  addressText: {
    ...Typography.body,
    fontSize: normalizeFont(16),
    color: Colors.textPrimary,
    fontFamily: "monospace",
  },
  actionsContainer: {
    flexDirection: "row",
    gap: Spacing.md,
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.xl,
  },
  actionButton: {
    flex: 1,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.md,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: Spacing.sm,
  },
  actionButtonSecondary: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  actionIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(0, 0, 0, 0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  actionIconContainerSecondary: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  actionButtonText: {
    ...Typography.body,
    fontSize: normalizeFont(16),
    fontWeight: "600",
    color: Colors.background,
  },
  actionButtonTextSecondary: {
    ...Typography.body,
    fontSize: normalizeFont(16),
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  transactionsSection: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
  },
  sectionTitle: {
    ...Typography.sectionTitle,
    fontSize: normalizeFont(20),
    fontWeight: "600",
    color: Colors.textPrimary,
    marginBottom: Spacing.lg,
  },
  emptyStateContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.xxl,
  },
  emptyStateIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.lg,
  },
  emptyStateText: {
    ...Typography.body,
    fontSize: normalizeFont(16),
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  emptyStateSubtext: {
    ...Typography.caption,
    fontSize: normalizeFont(14),
    color: Colors.textTertiary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: Spacing.xxxl,
  },
  loadingText: {
    ...Typography.body,
    fontSize: normalizeFont(16),
    color: Colors.textSecondary,
    marginTop: Spacing.lg,
  },
});
