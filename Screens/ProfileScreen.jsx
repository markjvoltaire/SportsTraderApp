import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

import { useAuth } from "../src/contexts/AuthContext";
import LottieLoader from "../src/components/ui/LottieLoader";

import {
  Colors,
  Spacing,
  Typography,
  BorderRadius,
} from "../src/constants/theme";
import { normalizeFont } from "../src/utils/dimensions";

export default function ProfileScreen() {
  const { signOut, user, loading } = useAuth();
  const navigation = useNavigation();

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
  // Handle Deposit
  // -------------------------
  const handleDeposit = () => {
    handleFundWallet();
  };

  // -------------------------
  // Handle Fund Wallet - Navigate to Deposit Screen
  // -------------------------
  const handleFundWallet = () => {
    // Find the embedded wallet from linked_accounts
    const embeddedWallet = user?.linked_accounts?.find(
      (account) =>
        account.type === "wallet" && account.wallet_client_type === "privy"
    );

    if (!embeddedWallet?.address) {
      Alert.alert("No wallet found", "Connect or create a wallet first.");
      return;
    }

    // Navigate to DepositAmount screen
    navigation.navigate("DepositAmount");
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
              <Ionicons name="headset-outline" size={48} color={Colors.textPrimary} />
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

            {/* Sign Out Button */}
            <TouchableOpacity
              style={styles.signOutButton}
              onPress={handleLogout}
              activeOpacity={0.85}
            >
              <Ionicons
                name="log-out-outline"
                size={16}
                color={Colors.danger}
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
    justifyContent: "center",
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.md,
  },
  headerUsername: {
    ...Typography.body,
    fontSize: normalizeFont(18),
    fontWeight: "600",
    color: Colors.textPrimary,
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
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.border,
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
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  statLabel: {
    ...Typography.caption,
    fontSize: normalizeFont(14),
    color: Colors.textTertiary,
  },
  username: {
    ...Typography.body,
    fontSize: normalizeFont(18),
    fontWeight: "600",
    color: Colors.textPrimary,
    marginBottom: Spacing.lg,
  },
  actionButtonsContainer: {
    flexDirection: "row",
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  editProfileButton: {
    flex: 1,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    alignItems: "center",
    justifyContent: "center",
  },
  editProfileText: {
    ...Typography.body,
    fontSize: normalizeFont(16),
    fontWeight: "600",
    color: Colors.background,
  },
  shareProfileButton: {
    flex: 1,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  shareProfileText: {
    ...Typography.body,
    fontSize: normalizeFont(16),
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  signOutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.danger,
  },
  signOutIcon: {
    marginRight: Spacing.sm,
  },
  signOutText: {
    ...Typography.body,
    fontSize: normalizeFont(16),
    fontWeight: "600",
    color: Colors.danger,
  },
  activitySection: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xl,
  },
  activityTitle: {
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
    backgroundColor: Colors.primary,
    top: 10,
    left: 20,
    transform: [{ rotate: "45deg" }],
    borderRadius: 4,
  },
  iconShape2: {
    width: 30,
    height: 30,
    backgroundColor: Colors.success,
    top: 30,
    right: 15,
    transform: [{ rotate: "45deg" }],
  },
  iconShape3: {
    width: 35,
    height: 35,
    backgroundColor: Colors.warning,
    bottom: 30,
    left: 15,
    borderRadius: 18,
  },
  iconShape4: {
    width: 25,
    height: 25,
    backgroundColor: Colors.accentTeal,
    top: 50,
    left: 50,
    transform: [{ rotate: "45deg" }],
  },
  iconShape5: {
    width: 30,
    height: 30,
    backgroundColor: Colors.primaryLight,
    bottom: 20,
    right: 25,
    borderRadius: 15,
  },
  emptyStateText: {
    ...Typography.body,
    fontSize: normalizeFont(16),
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
