import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  TouchableOpacity,
} from "react-native";
import React, { useEffect, useState, useRef } from "react";
import {
  CrossmintProvider,
  CrossmintEmbeddedCheckout,
} from "@crossmint/client-sdk-react-native-ui";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../src/contexts/AuthContext";
import { Colors, Spacing } from "../src/constants/theme";
import LottieLoader from "../src/components/ui/LottieLoader";
import API_BASE_URL from "../src/config/api";

export default function AddFundsScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const clientApiKey =
    process.env.EXPO_PUBLIC_CROSSMINT_CLIENT_SIDE_API_KEY || "";
  const { user } = useAuth();

  // Get values from route params, fallback to user data if not provided
  const amount = route.params?.amount || "100";
  const walletAddress =
    route.params?.walletAddress || user?.linked_accounts?.[1]?.address;
  const userId = route.params?.userId || user?.id;

  const [orderData, setOrderData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [widgetLoaded, setWidgetLoaded] = useState(false);
  const heightChangeTimeoutRef = useRef(null);
  const widgetMountTimeRef = useRef(null);

  useEffect(() => {
    if (!walletAddress || !userId || !amount) {
      setError("Missing required information");
      setLoading(false);
      return;
    }

    const createOrder = async () => {
      try {
        const response = await fetch(
          `${API_BASE_URL}/api/crossmint/orders`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              amount: amount,
              chain: "base-sepolia",
              tokenSymbol: "USDC",
              walletAddress: walletAddress,
              userId: userId,
              receiptEmail: user?.email || "markvoltaire@icloud.com",
            }),
          }
        );

        if (!response.ok) {
          let errorMessage = `Request failed (${response.status})`;
          try {
            const errorData = await response.json();
            errorMessage = errorData?.error || errorData?.message || errorMessage;
          } catch (_e) {
            // Could not parse error response as JSON
          }
          setError(errorMessage);
          setLoading(false);
          return;
        }

        const data = await response.json();
        console.log("Order created:", JSON.stringify(data, null, 2));

        // Access orderId from nested order object
        if (data.order?.orderId && data.clientSecret) {
          console.log("Setting orderData with orderId:", data.order.orderId);
          setOrderData({
            orderId: data.order.orderId,
            clientSecret: data.clientSecret,
          });
        } else {
          console.log("Missing orderId or clientSecret:", data);
          setError(data.error || "Failed to create order");
        }
      } catch (err) {
        console.error("Error creating order:", err);
        setError(err.message || "Failed to connect to server. Please check your connection.");
      } finally {
        setLoading(false);
      }
    };

    createOrder();
  }, [walletAddress, userId, amount, user?.email]);

  // Track when widget is mounted
  useEffect(() => {
    if (orderData && !widgetMountTimeRef.current) {
      widgetMountTimeRef.current = Date.now();
      console.log("Crossmint widget mounted at:", new Date().toISOString());
    }
  }, [orderData]);

  // Monitor height changes to detect when widget is fully loaded
  useEffect(() => {
    if (!orderData) return;

    // Clear any existing timeout
    if (heightChangeTimeoutRef.current) {
      clearTimeout(heightChangeTimeoutRef.current);
    }

    // Set a timeout - if height doesn't change for 1 second, consider it loaded
    heightChangeTimeoutRef.current = setTimeout(() => {
      if (!widgetLoaded) {
        const loadTime = widgetMountTimeRef.current
          ? Date.now() - widgetMountTimeRef.current
          : 0;
        setWidgetLoaded(true);
        console.log(
          "✅ Crossmint widget fully loaded!",
          loadTime > 0 ? `(took ${loadTime}ms)` : ""
        );
      }
    }, 1000);

    return () => {
      if (heightChangeTimeoutRef.current) {
        clearTimeout(heightChangeTimeoutRef.current);
      }
    };
  }, [orderData, widgetLoaded]);

  console.log(
    "Render state - loading:",
    loading,
    "orderData:",
    orderData,
    "error:",
    error
  );

  if (!clientApiKey) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>
          Crossmint API key is not configured.
        </Text>
      </View>
    );
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <LottieLoader size="large" />
          <Text style={styles.loadingText}>Creating order...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    console.log("Error:", error);
    return (
      <SafeAreaView style={styles.container}>
            <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.topBarIcon}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
      </View>
        <Text style={styles.errorText}>Error: {error}</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Top bar with Back Button */}
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.topBarIcon}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <View style={styles.checkoutContainer}>
        <CrossmintProvider apiKey={clientApiKey}>
          {orderData && (
            <CrossmintEmbeddedCheckout
              orderId={orderData.orderId}
              clientSecret={orderData.clientSecret}
              payment={{
                receiptEmail: "markvoltaire@icloud.com",
                crypto: { enabled: false },
                fiat: { enabled: true },
                defaultMethod: "fiat",
              }}
              appearance={{
                 variables: {
            fontFamily: "Inter, system-ui, sans-serif",
            colors: {
              backgroundPrimary: "#1A1A1A",
              textPrimary: "#FFFFFF",
              textSecondary: "#A0A0A0",
              borderPrimary: "#333333",
              accent: "#7928CA"
            },
            Label: {
              font: {
                  family: "Inter",
                  size: "14px",
                  weight: "500",
              },
              colors: {
                  text: "#333333",
              },
          },
        },
                rules: {
                  DestinationInput: {
                    display: "hidden",
                  },
                  ReceiptEmailInput: {
                    display: "hidden"  // Hides the email input
                  }
                },
              }}

              
              onReady={() => {
                console.log("✅ Crossmint widget onReady event fired");
                setWidgetLoaded(true);
              }}
              onLoad={() => {
                console.log("✅ Crossmint widget onLoad event fired");
                setWidgetLoaded(true);
              }}
            />
          )}
        </CrossmintProvider>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: Spacing.md,
    paddingBottom: Spacing.lg,
    marginBottom: Spacing.lg,
    padding: 18,
  },
  topBarIcon: {
    width: 38,
    height: 38,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  checkoutContainer: {
    flex: 1,
    paddingHorizontal: Spacing.md,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: Colors.textSecondary,
    fontSize: 16,
    marginTop: 16,
  },
  errorText: {
    color: Colors.danger,
    fontSize: 16,
    textAlign: "center",
    marginTop: 20,
  },
});
