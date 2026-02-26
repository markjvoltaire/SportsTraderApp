import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  useColorScheme,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

import { useAuth } from "../src/contexts/AuthContext";
import { checkProofVerification } from "../src/services/proofService";
import LottieLoader from "../src/components/ui/LottieLoader";

import {
  Spacing,
  Typography,
  BorderRadius,
} from "../src/constants/theme";
import { normalizeFont } from "../src/utils/dimensions";

export default function ProfileScreen() {
  const isDarkMode = useColorScheme() !== "light";
  const theme = isDarkMode ? DARK_THEME : LIGHT_THEME;
  const styles = useMemo(() => createStyles(theme), [theme]);

  const { signOut, user, loading, walletAddress, checkProofStatus, proofStatus } = useAuth();
  const navigation = useNavigation();
  const [verifying, setVerifying] = useState(false);

  console.log(user);

  // Get username from user object
  const username =
    user?.username ||
    user?.email?.split("@")[0] ||
    user?.id?.slice(0, 15) ||
    "@MoonlitDragon4887";

  // Format username with @ if not already present
  const displayUsername = username.startsWith("@") ? username : `@${username}`;

  // Statistics (placeholder - would come from backend)
  const tradeVolume = "$0.00";
  const followers = 0;
  const following = 0;

  // -------------------------
  // Handle Edit Profile
  // -------------------------
  const handleEditProfile = () => {
    // TODO: Navigate to edit profile screen
    Alert.alert("Edit Profile", "Edit profile functionality coming soon");
  };

  // -------------------------
  // Handle Verify - hit Proof verify route to check KYC status
  // -------------------------
  const handleVerify = async () => {
    if (!walletAddress) {
      Alert.alert("No Wallet", "Wallet not ready yet. Please wait or try again.");
      return;
    }
    setVerifying(true);
    try {
      const { data, error } = await checkProofVerification(walletAddress);
      if (error) throw error;
      const verified = !!data?.verified;
      await checkProofStatus();
      if (verified) {
        Alert.alert("Verified", "Your wallet is Proof (KYC) verified.");
        return;
      }

      let rootNav = navigation;
      while (rootNav.getParent()) {
        rootNav = rootNav.getParent();
      }
      rootNav.navigate("ProofVerification");
    } catch (err) {
      Alert.alert("Error", err?.message || "Failed to check verification status.");
    } finally {
      setVerifying(false);
    }
  };

  // -------------------------
  // Handle Deposit - gate with Proof (KYC), then continue to deposit flow
  // -------------------------
  const handleDeposit = async () => {
    let rootNav = navigation;
    while (rootNav.getParent()) {
      rootNav = rootNav.getParent();
    }

    if (!walletAddress) {
      Alert.alert("Wallet not ready", "Please wait for wallet setup and try again.");
      return;
    }

    try {
      const proofResult =
        proofStatus?.status === "verified"
          ? { status: "verified", verified: true }
          : await checkProofStatus();

      if (proofResult?.verified || proofResult?.status === "verified") {
        let rootNav = navigation;
        while (rootNav.getParent()) rootNav = rootNav.getParent();
        rootNav.navigate("Main", { screen: "Wallet", params: { screen: "Deposit" } });
        return;
      }

      rootNav.navigate("ProofVerification");
    } catch (_err) {
      rootNav.navigate("ProofVerification");
    }
  };

  const handleFundWallet = () => {
    const embeddedWallet = user?.linked_accounts?.find(
      (account) =>
        account.type === "wallet" && account.wallet_client_type === "privy"
    );

    if (!embeddedWallet?.address) {
      Alert.alert("No wallet found", "Connect or create a wallet first.");
      return;
    }

    let rootNav = navigation;
    while (rootNav.getParent()) rootNav = rootNav.getParent();
    rootNav.navigate("Main", { screen: "Wallet", params: { screen: "Deposit" } });
  };

  // -------------------------
  // Sign Out
  // -------------------------
  const handleLogout = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
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

  // Show loading state while auth is loading or user data is being fetched
  if (loading || !user) {
    return (
      <View style={styles.container}>
        <SafeAreaView style={styles.safeArea} edges={["top"]}>
          <View style={styles.loadingContainer}>
            <LottieLoader size="large" />
            <Text style={styles.loadingText}>Loading profile...</Text>
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
          {/* Header with username */}
          <View style={styles.header}>
            <Text style={styles.headerUsername}>{displayUsername}</Text>
          </View>

          {/* Profile Section */}
          <View style={styles.profileSection}>
            {/* Profile Picture */}
            <View style={styles.profilePictureContainer}>
            <View style={styles.profilePicture}>
              <Ionicons name="headset-outline" size={48} color={theme.textPrimary} />
            </View>
            </View>

            {/* Statistics */}
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{tradeVolume}</Text>
                <Text style={styles.statLabel}>Trade Volume</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{followers}</Text>
                <Text style={styles.statLabel}>Followers</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{following}</Text>
                <Text style={styles.statLabel}>Following</Text>
              </View>
            </View>

            {/* Username */}
            <Text style={styles.username}>{displayUsername}</Text>

            {/* Action Buttons */}
            <View style={styles.actionButtonsContainer}>
              <TouchableOpacity
                style={styles.editProfileButton}
                onPress={handleEditProfile}
                activeOpacity={0.85}
              >
                <Text style={styles.editProfileText}>Edit Profile</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.shareProfileButton}
                onPress={handleDeposit}
                activeOpacity={0.85}
              >
                <Text style={styles.shareProfileText}>Deposit</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={[styles.verifyButton, verifying && styles.verifyButtonDisabled]}
              onPress={handleVerify}
              disabled={verifying}
              activeOpacity={0.85}
            >
              {verifying ? (
                <ActivityIndicator size="small" color={theme.accentTeal} />
              ) : (
                <>
                  <Ionicons name="shield-checkmark-outline" size={18} color={theme.accentTeal} style={styles.verifyIcon} />
                  <Text style={styles.verifyText}>Verify</Text>
                </>
              )}
            </TouchableOpacity>

            {/* Sign Out Button */}
            <TouchableOpacity
              style={styles.signOutButton}
              onPress={handleLogout}
              activeOpacity={0.85}
            >
              <Ionicons
                name="log-out-outline"
                size={16}
                color={theme.danger}
                style={styles.signOutIcon}
              />
              <Text style={styles.signOutText}>Sign Out</Text>
            </TouchableOpacity>
          </View>

          {/* Recent Activity Section */}
          <View style={styles.activitySection}>
            <Text style={styles.activityTitle}>Recent Activity</Text>
            <View style={styles.emptyStateContainer}>
              {/* Colorful abstract icon */}
              <View style={styles.emptyStateIcon}>
                <View style={[styles.iconShape, styles.iconShape1]} />
                <View style={[styles.iconShape, styles.iconShape2]} />
                <View style={[styles.iconShape, styles.iconShape3]} />
                <View style={[styles.iconShape, styles.iconShape4]} />
                <View style={[styles.iconShape, styles.iconShape5]} />
              </View>
              <Text style={styles.emptyStateText}>
                No activity to show yet.
              </Text>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const DARK_THEME = {
  background: "#000000",
  textPrimary: "#FFFFFF",
  textSecondary: "#D1D5DB",
  textTertiary: "#9CA3AF",
  border: "rgba(255, 255, 255, 0.12)",
  surface: "rgba(255, 255, 255, 0.1)",
  primaryButtonBg: "#FFFFFF",
  primaryButtonText: "#000000",
  danger: "#FF6B6B",
  success: "#10B981",
  warning: "#F59E0B",
  accentTeal: "#14B8A6",
  primaryLight: "#8B5CF6",
};

const LIGHT_THEME = {
  background: "#F5F7FB",
  textPrimary: "#111827",
  textSecondary: "#374151",
  textTertiary: "#6B7280",
  border: "rgba(17, 24, 39, 0.15)",
  surface: "rgba(17, 24, 39, 0.06)",
  primaryButtonBg: "#111827",
  primaryButtonText: "#FFFFFF",
  danger: "#DC2626",
  success: "#059669",
  warning: "#D97706",
  accentTeal: "#0D9488",
  primaryLight: "#7C3AED",
};

const createStyles = (theme) => StyleSheet.create({
  container: {
    flex: 1,
    width: "100%",
    height: "100%",
    backgroundColor: theme.background,
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
    justifyContent: "center",
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.md,
  },
  headerUsername: {
    ...Typography.body,
    fontSize: normalizeFont(18),
    fontWeight: "600",
    color: theme.textPrimary,
    textAlign: "center",
  },
  profileSection: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
  },
  profilePictureContainer: {
    alignItems: "flex-start",
    marginBottom: Spacing.lg,
  },
  profilePicture: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.surface,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: theme.border,
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  statItem: {
    alignItems: "center",
  },
  statValue: {
    ...Typography.body,
    fontSize: normalizeFont(18),
    fontWeight: "600",
    color: theme.textPrimary,
    marginBottom: Spacing.xs,
  },
  statLabel: {
    ...Typography.caption,
    fontSize: normalizeFont(14),
    color: theme.textTertiary,
  },
  username: {
    ...Typography.body,
    fontSize: normalizeFont(18),
    fontWeight: "600",
    color: theme.textPrimary,
    marginBottom: Spacing.lg,
  },
  actionButtonsContainer: {
    flexDirection: "row",
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  editProfileButton: {
    flex: 1,
    backgroundColor: theme.primaryButtonBg,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    alignItems: "center",
    justifyContent: "center",
  },
  editProfileText: {
    ...Typography.body,
    fontSize: normalizeFont(16),
    fontWeight: "600",
    color: theme.primaryButtonText,
  },
  shareProfileButton: {
    flex: 1,
    backgroundColor: theme.surface,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: theme.border,
  },
  shareProfileText: {
    ...Typography.body,
    fontSize: normalizeFont(16),
    fontWeight: "600",
    color: theme.textPrimary,
  },
  verifyButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.surface,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.xl,
    borderWidth: 1,
    borderColor: theme.accentTeal,
  },
  verifyButtonDisabled: {
    opacity: 0.6,
  },
  verifyIcon: {
    marginRight: Spacing.sm,
  },
  verifyText: {
    ...Typography.body,
    fontSize: normalizeFont(16),
    fontWeight: "600",
    color: theme.accentTeal,
  },
  signOutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.surface,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.xl,
    borderWidth: 1,
    borderColor: theme.danger,
  },
  signOutIcon: {
    marginRight: Spacing.sm,
  },
  signOutText: {
    ...Typography.body,
    fontSize: normalizeFont(16),
    fontWeight: "600",
    color: theme.danger,
  },
  activitySection: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xl,
  },
  activityTitle: {
    ...Typography.sectionTitle,
    fontSize: normalizeFont(20),
    fontWeight: "600",
    color: theme.textPrimary,
    marginBottom: Spacing.lg,
  },
  emptyStateContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.xxl,
  },
  emptyStateIcon: {
    width: 120,
    height: 120,
    marginBottom: Spacing.lg,
    position: "relative",
  },
  iconShape: {
    position: "absolute",
  },
  iconShape1: {
    width: 40,
    height: 40,
    backgroundColor: theme.primaryButtonBg,
    top: 10,
    left: 20,
    transform: [{ rotate: "45deg" }],
    borderRadius: 4,
  },
  iconShape2: {
    width: 30,
    height: 30,
    backgroundColor: theme.success,
    top: 30,
    right: 15,
    transform: [{ rotate: "45deg" }],
  },
  iconShape3: {
    width: 35,
    height: 35,
    backgroundColor: theme.warning,
    bottom: 30,
    left: 15,
    borderRadius: 18,
  },
  iconShape4: {
    width: 25,
    height: 25,
    backgroundColor: theme.accentTeal,
    top: 50,
    left: 50,
    transform: [{ rotate: "45deg" }],
  },
  iconShape5: {
    width: 30,
    height: 30,
    backgroundColor: theme.primaryLight,
    bottom: 20,
    right: 25,
    borderRadius: 15,
  },
  emptyStateText: {
    ...Typography.body,
    fontSize: normalizeFont(16),
    color: theme.textTertiary,
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
    color: theme.textSecondary,
    marginTop: Spacing.lg,
  },
});
