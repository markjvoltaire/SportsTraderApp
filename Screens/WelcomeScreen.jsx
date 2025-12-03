import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Spacing, Typography } from "../src/constants/theme";
import { normalize, normalizeFont } from "../src/utils/dimensions";

export default function WelcomeScreen() {
  const navigation = useNavigation();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Ionicons name="trending-up" size={normalize(64)} color={Colors.primary} />
          <Text style={styles.title}>SportsTrader</Text>
          <Text style={styles.subtitle}>
            Trade sports markets in real-time
          </Text>
        </View>

        <View style={styles.features}>
          <View style={styles.feature}>
            <Ionicons
              name="flash-outline"
              size={normalize(24)}
              color={Colors.primary}
            />
            <Text style={styles.featureText}>Real-time prices</Text>
          </View>
          <View style={styles.feature}>
            <Ionicons
              name="shield-checkmark-outline"
              size={normalize(24)}
              color={Colors.primary}
            />
            <Text style={styles.featureText}>Secure trading</Text>
          </View>
          <View style={styles.feature}>
            <Ionicons
              name="stats-chart-outline"
              size={normalize(24)}
              color={Colors.primary}
            />
            <Text style={styles.featureText}>Live charts</Text>
          </View>
        </View>

        <View style={styles.buttons}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => navigation.navigate("Login", { initialMode: "signup" })}
            activeOpacity={0.8}
          >
            <Text style={styles.primaryButtonText}>Get Started</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => navigation.navigate("Login", { initialMode: "signin" })}
            activeOpacity={0.8}
          >
            <Text style={styles.secondaryButtonText}>Sign In</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.viewMarketsButton}
            onPress={() => navigation.navigate("App")}
            activeOpacity={0.8}
          >
            <Text style={styles.viewMarketsButtonText}>View Markets</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const buttonHeight = normalize(52);
const buttonRadius = normalize(26);
const titleFontSize = normalizeFont(40);
const subtitleFontSize = normalizeFont(16);
const buttonFontSize = normalizeFont(16);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xxxl,
    justifyContent: "space-between",
  },
  header: {
    alignItems: "center",
    marginTop: Spacing.xxxl,
  },
  title: {
    ...Typography.pageTitle,
    fontSize: titleFontSize,
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  subtitle: {
    ...Typography.body,
    fontSize: subtitleFontSize,
    color: Colors.textTertiary,
    textAlign: "center",
  },
  features: {
    marginVertical: Spacing.xxxl,
    gap: Spacing.xl,
  },
  feature: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  featureText: {
    ...Typography.body,
    fontSize: normalizeFont(16),
    color: Colors.textSecondary,
  },
  buttons: {
    gap: Spacing.md,
    marginBottom: Spacing.xxl,
  },
  primaryButton: {
    backgroundColor: Colors.primary,
    height: buttonHeight,
    borderRadius: buttonRadius,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: buttonFontSize,
    fontWeight: "700",
  },
  secondaryButton: {
    backgroundColor: Colors.surface,
    height: buttonHeight,
    borderRadius: buttonRadius,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  secondaryButtonText: {
    color: Colors.textPrimary,
    fontSize: buttonFontSize,
    fontWeight: "600",
  },
  viewMarketsButton: {
    height: buttonHeight,
    borderRadius: buttonRadius,
    alignItems: "center",
    justifyContent: "center",
    marginTop: Spacing.sm,
  },
  viewMarketsButtonText: {
    color: Colors.textTertiary,
    fontSize: buttonFontSize,
    fontWeight: "500",
    textDecorationLine: "underline",
  },
});

