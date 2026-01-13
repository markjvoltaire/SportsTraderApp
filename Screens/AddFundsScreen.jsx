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
          "https://scoretradebackend.onrender.com/api/crossmint/create-order",
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
        setError(err.message);
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
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.errorText}>Error: {error}</Text>
      </SafeAreaView>
    );
  }

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
                  buttonText: `Add $${amount}`,
                  buttonLabel: `Add $${amount}`,
                  ctaText: `Add $${amount}`,
                  // Text colors for receipt/confirmation screen - make all text white
                  primaryText: "#FFFFFF",
                  secondaryText: "#FFFFFF",
                  componentText: "#FFFFFF",
                  textPrimary: "#FFFFFF",
                  textSecondary: "#FFFFFF",
                  colorText: "#FFFFFF",
                  // Heading colors
                  headingColor: "#FFFFFF",
                  sectionHeadingColor: "#FFFFFF",
                  titleColor: "#FFFFFF",
                  // Success message colors
                  successText: "#FFFFFF",
                  successColor: "#FFFFFF",
                  successMessageColor: "#FFFFFF",
                  // Amount/price colors
                  amountColor: "#FFFFFF",
                  priceColor: "#FFFFFF",
                  // Link colors
                  linkColor: "#FFFFFF",
                  linkTextColor: "#FFFFFF",
                  // Label colors
                  labelColor: "#FFFFFF",
                  // Subtext and secondary text
                  subtextColor: "#FFFFFF",
                  subTextColor: "#FFFFFF",
                  secondaryTextColor: "#FFFFFF",
                  placeholderText: "#FFFFFF",
                  // Heading/subheading colors
                  subheadingColor: "#FFFFFF",
                  subHeadingColor: "#FFFFFF",
                  // Form label colors
                  formLabelColor: "#FFFFFF",
                  inputLabelColor: "#FFFFFF",
                  // General text overrides
                  color: "#FFFFFF",
                  textColor: "#FFFFFF",
                  fontColor: "#FFFFFF",
                },
                colors: {
                  primaryText: "#FFFFFF",
                  secondaryText: "#FFFFFF",
                  componentText: "#FFFFFF",
                  text: "#FFFFFF",
                  heading: "#FFFFFF",
                  subheading: "#FFFFFF",
                  subtext: "#FFFFFF",
                  success: "#FFFFFF",
                  link: "#FFFFFF",
                  label: "#FFFFFF",
                  placeholder: "#FFFFFF",
                  formLabel: "#FFFFFF",
                },
                strings: {
                  buttonText: `Add $${amount}`,
                },
                rules: {
                  DestinationInput: {
                    display: "hidden",
                  },
                  // Try to override text colors via CSS-like rules
                  "*": {
                    color: "#FFFFFF",
                  },
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
  header: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "flex-start",
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
