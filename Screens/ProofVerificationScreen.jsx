import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Linking,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { useAuth } from "../src/contexts/AuthContext";
import {
  createProofSignMessage,
  encodeBase58,
  buildProofDeepLinkUrl,
} from "../src/services/proofService";
import {
  Spacing,
  Typography,
  BorderRadius,
  Colors,
  CommonStyles,
} from "../src/constants/theme";

export default function ProofVerificationScreen() {
  const navigation = useNavigation();
  const {
    walletAddress,
    solanaAddress,
    getAccessToken,
    getProofSigningWallet,
  } = useAuth();
  const proofWalletAddress = solanaAddress || walletAddress;
  const [loading, setLoading] = useState(false);

  const handleStartVerification = useCallback(async () => {
    if (!proofWalletAddress) {
      Alert.alert("No Wallet", "Please wait for your wallet to be ready, or sign out and sign in again.");
      return;
    }

    setLoading(true);
    try {
      let addressForProof = proofWalletAddress;
      let url = null;

      try {
        const proofWallet = await getProofSigningWallet();
        addressForProof = proofWallet.publicKey.toBase58();
        const timestamp = Date.now();
        const message = createProofSignMessage(timestamp);

        const signatureBytes = await proofWallet.signMessage(message);
        const signature = encodeBase58(signatureBytes);

        url = buildProofDeepLinkUrl({
          wallet: addressForProof,
          signature,
          timestamp,
        });

        console.log("[Proof] url:", url);
      } catch (signErr) {
        console.warn("Proof pre-signing failed, using unsigned redirect:", signErr?.message);
        url = buildProofDeepLinkUrl({ wallet: addressForProof });
      }

      const canOpen = await Linking.canOpenURL(url);
      if (!canOpen) {
        Alert.alert(
          "Cannot Open",
          "Unable to open the verification link. Please try again or contact support."
        );
        return;
      }

      // Open the browser FIRST, then navigate away so the user
      // doesn't see a flash of the home screen.
      await Linking.openURL(url);

      let rootNav = navigation;
      while (rootNav.getParent()) {
        rootNav = rootNav.getParent();
      }
      rootNav.reset({
        index: 0,
        routes: [{ name: "Main" }],
      });
    } catch (err) {
      const rawMessage = err?.message || "Failed to start verification";
      const message =
        rawMessage.includes("User rejected") ||
        rawMessage.includes("declined") ||
        rawMessage.includes("cancel")
          ? "Verification signature was cancelled. Please approve the wallet signature to continue."
          : rawMessage;
      Alert.alert("Error", message);
    } finally {
      setLoading(false);
    }
  }, [proofWalletAddress, getProofSigningWallet, navigation]);

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <View style={styles.content}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            if (navigation.canGoBack()) {
              navigation.goBack();
              return;
            }
            navigation.navigate("Main");
          }}
          activeOpacity={0.8}
        >
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Identity Verification</Text>
        <Text style={styles.subtitle}>
          Complete KYC verification with Proof to trade on prediction markets. This
          is required for compliance.
        </Text>

        {!proofWalletAddress ? (
          <View style={styles.walletWarning}>
            <Text style={styles.walletWarningText}>
              Loading wallet...
            </Text>
            <ActivityIndicator size="small" color={Colors.primary} />
          </View>
        ) : (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Your Solana wallet</Text>
            <Text style={styles.walletAddress} numberOfLines={1}>
              {proofWalletAddress}
            </Text>
          </View>
        )}

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleStartVerification}
          disabled={loading || !proofWalletAddress}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#000" />
          ) : (
            <Text style={styles.buttonText}>Continue to Verification</Text>
          )}
        </TouchableOpacity>

        <Text style={styles.footer}>
          You will be redirected to Proof to verify your identity. After you
          complete or cancel, you will be redirected back to the app and we will
          re-check your verification status automatically.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flex: 1,
    padding: Spacing.xl,
    justifyContent: "center",
  },
  backButton: {
    alignSelf: "flex-start",
    marginBottom: Spacing.lg,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
  },
  backButtonText: {
    ...Typography.body,
    color: Colors.primary,
    fontWeight: "600",
  },
  title: {
    ...Typography.pageTitle,
    marginBottom: Spacing.sm,
  },
  subtitle: {
    ...Typography.body,
    marginBottom: Spacing.xxl,
    opacity: 0.9,
  },
  card: {
    ...CommonStyles.card,
    marginBottom: Spacing.xl,
  },
  cardTitle: {
    ...Typography.label,
    marginBottom: Spacing.xs,
  },
  walletAddress: {
    ...Typography.body,
    fontFamily: "monospace",
  },
  walletWarning: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    marginBottom: Spacing.xl,
    padding: Spacing.lg,
    backgroundColor: Colors.glassSurface,
    borderRadius: BorderRadius.md,
  },
  walletWarningText: {
    ...Typography.body,
  },
  button: {
    ...CommonStyles.primaryButton,
    backgroundColor: Colors.primary,
    marginBottom: Spacing.lg,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    ...CommonStyles.primaryButtonText,
    color: "#000",
  },
  footer: {
    ...Typography.caption,
    opacity: 0.7,
    textAlign: "center",
  },
});
