import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Spacing, Typography } from "../src/constants/theme";
import { normalize, normalizeFont } from "../src/utils/dimensions";

const rotatingWords = [
  "Basketball",
  "Football",
  "Soccer",
  "Baseball",
  "MMA",
  "Tennis",
];

export default function WelcomeScreen() {
  const navigation = useNavigation();
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const fadeAnim = useState(new Animated.Value(1))[0];

  useEffect(() => {
    const interval = setInterval(() => {
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setCurrentWordIndex((prev) => (prev + 1) % rotatingWords.length);
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }).start();
      });
    }, 2000);

    return () => clearInterval(interval);
  }, [fadeAnim]);

  return (
    <LinearGradient
      colors={["#0A0E27", "#1A1F3A", "#2D1B3D", "#1A0F2E"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <SafeAreaView style={styles.containerOverlay}>
        <View style={styles.content}>
          {/* App Name */}
          <View style={styles.header}>
            <Text style={styles.appName}>Scoretrade</Text>
          </View>

          {/* Main Heading with Rotating Text */}
          <View style={styles.headingContainer}>
            <Text style={styles.mainHeading}>Trade </Text>
            <Animated.Text style={[styles.rotatingText, { opacity: fadeAnim }]}>
              {rotatingWords[currentWordIndex]}
            </Animated.Text>
          </View>

          {/* Buttons */}
          <View style={styles.buttons}>
            {/* Log In Button */}
            <TouchableOpacity
              style={styles.logInButton}
              onPress={() =>
                navigation.navigate("Login", { initialMode: "signin" })
              }
              activeOpacity={0.8}
            >
              <Text style={styles.logInButtonText}>Log In</Text>
            </TouchableOpacity>

            {/* Sign Up Button */}
            <TouchableOpacity
              style={styles.signUpButton}
              onPress={() =>
                navigation.navigate("Login", { initialMode: "signup" })
              }
              activeOpacity={0.8}
            >
              <Text style={styles.signUpButtonText}>Sign Up</Text>
            </TouchableOpacity>
          </View>

          {/* Legal Terms */}
          <Text style={styles.legalText}>
            By continuing, you acknowledge and agree to Scoretrade's{" "}
            <Text style={styles.legalLink}>
              legal terms, which we recommend reviewing →
            </Text>
          </Text>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

// Green color scheme matching Kalshi design
const primaryGreen = "#10C962"; // Vibrant green
const darkGreen = "#03110A"; // Dark green for app name
const lightGreen = "#A8E6CF"; // Light green for faded text
const buttonGreen = "#0DA653"; // Darker green for email button

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
  containerOverlay: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xxl,
    paddingBottom: Spacing.xl,
    justifyContent: "space-between",
  },
  header: {
    alignItems: "flex-start",
    marginTop: Spacing.xl,
  },
  appName: {
    fontSize: normalizeFont(28),
    fontWeight: "800",
    color: "white",
    letterSpacing: -0.5,
  },
  headingContainer: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    marginTop: Spacing.xxxl,
  },
  mainHeading: {
    fontSize: normalizeFont(42),
    fontWeight: "800",
    color: "#FFFFFF",
    lineHeight: normalizeFont(50),
  },
  rotatingText: {
    fontSize: normalizeFont(42),
    fontWeight: "800",
    color: "white",
    lineHeight: normalizeFont(50),
  },
  buttons: {
    gap: Spacing.md,
    marginTop: Spacing.xxxl,
  },
  logInButton: {
    backgroundColor: "#FFFFFF",
    height: normalize(56),
    borderRadius: normalize(12),
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.lg,
  },
  logInButtonText: {
    fontSize: normalizeFont(16),
    fontWeight: "600",
    color: "#000000",
  },
  signUpButton: {
    backgroundColor: "black",
    height: normalize(56),
    borderRadius: normalize(12),
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.lg,
  },
  signUpButtonText: {
    fontSize: normalizeFont(16),
    fontWeight: "600",
    color: "#FFFFFF",
  },
  loginLink: {
    alignItems: "center",
    marginTop: Spacing.lg,
  },
  loginLinkText: {
    fontSize: normalizeFont(14),
    color: lightGreen,
    textAlign: "center",
  },
  loginLinkBold: {
    fontWeight: "600",
    color: buttonGreen,
  },
  legalText: {
    fontSize: normalizeFont(12),
    color: "rgba(255, 255, 255, 0.7)",
    textAlign: "center",
    lineHeight: normalizeFont(18),
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
  },
  legalLink: {
    fontWeight: "600",
    color: "#FFFFFF",
  },
});
