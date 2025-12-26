import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

import { useAuth } from "../src/contexts/AuthContext";
import { usePrivy, useEmbeddedEthereumWallet } from "@privy-io/expo";

import {
  Colors,
  Spacing,
  Typography,
  BorderRadius,
} from "../src/constants/theme";
import { normalizeFont } from "../src/utils/dimensions";

export default function ProfileScreen() {
  const navigation = useNavigation();
  const {
    signOut,
    user: privyUser,
    supabaseUser,
    supabaseUserStatus,
    supabaseUserError,
    refreshSupabaseUser,
  } = useAuth();
  const privy = usePrivy();
  const walletContext = useEmbeddedEthereumWallet();
  const wallets = walletContext?.wallets ?? [];
  const wallet =
    Array.isArray(wallets) && wallets.length > 0 ? wallets[0] : null;
  const isReady = privy?.isReady ?? false;
  const createWallet = walletContext?.create ?? null; // Expo SDK: `create`

  console.log("supabaseUser", supabaseUser);

  const [creatingWallet, setCreatingWallet] = useState(false);

  // Check if user has a wallet, if not create one
  useEffect(() => {
    const ensureWallet = async () => {
      if (!isReady || !privyUser?.id) return;

      if (!wallet && createWallet && !creatingWallet) {
        setCreatingWallet(true);
        try {
          await createWallet();
        } catch (error) {
          Alert.alert(
            "Wallet Creation Failed",
            "Could not create your wallet. Please try again."
          );
        } finally {
          setCreatingWallet(false);
        }
      }
    };

    ensureWallet();
  }, [isReady, privyUser?.id, wallet, createWallet, creatingWallet]);

  // -------------------------
  // Add Funds - Navigate to Add Funds Screen
  // -------------------------
  const handleAddFunds = () => {
    navigation.navigate("AddFunds");
  };

  // -------------------------
  // Sign out
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
          {/* -------------------------
              Wallet Info
          ------------------------- */}
          {creatingWallet && (
            <View style={styles.userInfoCard}>
              <ActivityIndicator size="small" color={Colors.primary} />
              <Text style={styles.loadingText}>Creating your wallet...</Text>
            </View>
          )}

          {!creatingWallet && wallet && (
            <View style={styles.userInfoCard}>
              <Text style={styles.sectionTitle}>Wallet</Text>

              <View style={styles.userInfoRow}>
                <Text style={styles.userInfoLabel}>Address:</Text>
                <Text style={styles.userInfoValue} numberOfLines={1}>
                  {wallet.address}
                </Text>
              </View>

              <View style={[styles.userInfoRow, { borderBottomWidth: 0 }]}>
                <Text style={styles.userInfoLabel}>Chain:</Text>
                <Text style={styles.userInfoValue}>
                  {wallet.chainId || "Ethereum"}
                </Text>
              </View>
            </View>
          )}

          {supabaseUserStatus === "error" && supabaseUserError && (
            <View style={styles.errorCard}>
              <Ionicons
                name="alert-circle-outline"
                size={normalizeFont(20)}
                color={Colors.danger}
              />
              <Text style={styles.errorText}>
                Could not fetch user from Supabase: {supabaseUserError}
              </Text>
            </View>
          )}

          {supabaseUserStatus === "not_found" && (
            <View style={styles.errorCard}>
              <Ionicons
                name="information-circle-outline"
                size={normalizeFont(20)}
                color={Colors.textSecondary}
              />
              <Text style={[styles.errorText, { color: Colors.textSecondary }]}>
                No user row found yet for this Privy user ID.
              </Text>
              <TouchableOpacity
                onPress={refreshSupabaseUser}
                activeOpacity={0.85}
                style={{ paddingLeft: Spacing.sm }}
              >
                <Text style={{ color: Colors.primary, fontWeight: "600" }}>
                  Refresh
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* -------------------------
              Add Funds Button
          ------------------------- */}
          <TouchableOpacity
            style={[
              styles.fundButton,
              (!wallet || !isReady) && styles.fundButtonDisabled,
            ]}
            onPress={handleAddFunds}
            activeOpacity={0.85}
            disabled={!wallet || !isReady || creatingWallet}
          >
            {creatingWallet ? (
              <>
                <ActivityIndicator size="small" color={Colors.primary} />
                <Text style={styles.fundText}>Creating Wallet...</Text>
              </>
            ) : (
              <>
                <Ionicons
                  name="wallet-outline"
                  size={normalizeFont(20)}
                  color={
                    wallet && isReady ? Colors.primary : Colors.textSecondary
                  }
                />
                <Text
                  style={[
                    styles.fundText,
                    (!wallet || !isReady) && styles.fundTextDisabled,
                  ]}
                >
                  Add Funds (USDC)
                </Text>
              </>
            )}
          </TouchableOpacity>

          {/* -------------------------
              Sign Out Button
          ------------------------- */}
          <TouchableOpacity
            style={styles.signOutButton}
            onPress={handleLogout}
            activeOpacity={0.85}
          >
            <Ionicons
              name="log-out-outline"
              size={normalizeFont(20)}
              color={Colors.danger}
            />
            <Text style={styles.signOutText}>Sign Out</Text>
          </TouchableOpacity>
        </ScrollView>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.xxxl,
    flexGrow: 1,
  },

  userInfoCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sectionTitle: {
    ...Typography.body,
    fontSize: normalizeFont(18),
    fontWeight: "700",
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  userInfoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  userInfoLabel: {
    ...Typography.body,
    fontSize: normalizeFont(14),
    color: Colors.textSecondary,
    fontWeight: "500",
    flex: 1,
  },
  userInfoValue: {
    ...Typography.body,
    fontSize: normalizeFont(14),
    color: Colors.textPrimary,
    fontWeight: "600",
    flex: 2,
    textAlign: "right",
  },
  loadingText: {
    ...Typography.body,
    fontSize: normalizeFont(14),
    color: Colors.textSecondary,
    marginTop: Spacing.sm,
  },
  errorCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.dangerMuted,
    gap: Spacing.sm,
  },
  errorText: {
    ...Typography.body,
    fontSize: normalizeFont(14),
    color: Colors.danger,
    flex: 1,
  },

  fundButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.primaryMuted,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.primary,
    marginBottom: Spacing.lg,
  },
  fundButtonDisabled: {
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    opacity: 0.5,
  },
  fundText: {
    ...Typography.body,
    fontSize: normalizeFont(16),
    fontWeight: "600",
    color: Colors.primary,
  },
  fundTextDisabled: {
    color: Colors.textSecondary,
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
});
