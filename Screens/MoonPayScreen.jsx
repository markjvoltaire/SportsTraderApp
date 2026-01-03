import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  TouchableOpacity,
} from "react-native";
import React, { useState } from "react";
import { useNavigation, useRoute } from "@react-navigation/native";
import { WebView } from "react-native-webview";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../src/contexts/AuthContext";
import { Colors, Spacing } from "../src/constants/theme";
import LottieLoader from "../src/components/ui/LottieLoader";

export default function MoonPayScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { user } = useAuth();

  // Get values from route params
  const amount = route.params?.amount || "100";
  const walletAddress =
    route.params?.walletAddress || user?.linked_accounts?.[1]?.address;
  const userId = route.params?.userId || user?.id;

  const [loading, setLoading] = useState(true);

  // MoonPay API key from environment
  const MOONPAY_API_KEY =
    process.env.EXPO_PUBLIC_MOONPAY_API_KEY || "pk_test_...";

  // Build MoonPay widget URL
  const buildMoonPayUrl = () => {
    const baseUrl = "https://buy.moonpay.com";
    const params = new URLSearchParams({
      apiKey: MOONPAY_API_KEY,
      currencyCode: "usdc", // USDC on Base
      walletAddress: walletAddress,
      baseCurrencyAmount: amount,
      baseCurrencyCode: "usd",
      externalCustomerId: userId || "",
      colorCode: "#FFFFFF", // Match app theme
      theme: "dark",
    });

    return `${baseUrl}?${params.toString()}`;
  };

  const moonPayUrl = buildMoonPayUrl();

  return (
    <SafeAreaView style={styles.container}>
      {/* Back Button */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
      </View>

      {/* Loading Indicator */}
      {loading && (
        <View style={styles.loadingContainer}>
          <LottieLoader size="large" />
          <Text style={styles.loadingText}>Loading MoonPay...</Text>
        </View>
      )}

      {/* MoonPay WebView */}
      <WebView
        source={{ uri: moonPayUrl }}
        style={styles.webview}
        onLoadStart={() => setLoading(true)}
        onLoadEnd={() => setLoading(false)}
        onError={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent;
          console.error("WebView error: ", nativeEvent);
        }}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
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
  loadingContainer: {
    position: "absolute",
    top: 100,
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 1,
  },
  loadingText: {
    color: Colors.textSecondary,
    fontSize: 16,
    marginTop: Spacing.sm,
  },
  webview: {
    flex: 1,
    backgroundColor: Colors.background,
  },
});
