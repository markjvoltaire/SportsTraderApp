import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Animated,
  Platform,
  Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useLoginWithOAuth } from "@privy-io/expo";
import { normalize, normalizeFont } from "../src/utils/dimensions";

const rotatingSports = [
  "Football",
  "Basketball",
  "Soccer",
  "Baseball",
  "MMA",
  "Tennis",
  "Sports",
];

export default function WelcomeScreen() {
  const navigation = useNavigation();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [currentSportIndex, setCurrentSportIndex] = useState(0);
  const sportFadeAnim = useRef(new Animated.Value(1)).current;

  // Privy OAuth hooks
  const { login: loginWithOAuth, state: oauthState } = useLoginWithOAuth();

  useEffect(() => {
    // Fade in animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  useEffect(() => {
    // Rotate through sports with fade animation
    const interval = setInterval(() => {
      Animated.sequence([
        Animated.timing(sportFadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setCurrentSportIndex((prev) => (prev + 1) % rotatingSports.length);
        Animated.timing(sportFadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }).start();
      });
    }, 1500); // Change word every 2 seconds

    return () => clearInterval(interval);
  }, [sportFadeAnim]);

  const handleSkip = () => {
    navigation.navigate("App");
  };

  const handleAppleLogin = async () => {
    try {
      await loginWithOAuth({ provider: "apple" });
    } catch (error) {
      console.error("Apple login error:", error);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await loginWithOAuth({ provider: "google" });
    } catch (error) {
      console.error("Google login error:", error);
    }
  };

  const handleEmailLogin = () => {
    navigation.navigate("Login");
  };

  return (
    <View style={styles.container}>
      {/* Space background image */}
      <Image
        source={require("../assets/space.jpeg")}
        style={styles.backgroundImage}
        resizeMode="cover"
      />
      {/* Dark overlay for better text readability */}
      <View style={styles.overlay} />

      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
          {/* Skip Button */}
          <View style={styles.skipContainer}>
            <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
              <Text style={styles.skipText}>Skip</Text>
            </TouchableOpacity>
          </View>

          {/* App Logo/Branding */}
          <View style={styles.brandingContainer}>
            <View style={styles.appNameContainer}>
              <Text style={styles.appNamePrefix}>Trade</Text>
              <Animated.Text
                style={[styles.appNameSport, { opacity: sportFadeAnim }]}
              >
                {rotatingSports[currentSportIndex]}
              </Animated.Text>
            </View>
          </View>

          {/* Authentication Buttons */}
          <View style={styles.authButtonsContainer}>
            {/* Continue with Apple */}
            <TouchableOpacity
              style={styles.authButton}
              onPress={handleAppleLogin}
              disabled={oauthState.status === "loading"}
              activeOpacity={0.8}
            >
              <Ionicons
                name="logo-apple"
                size={normalize(24)}
                color="#000000"
              />
              <Text style={styles.authButtonText}>Continue with Apple</Text>
            </TouchableOpacity>

            {/* Continue with Google */}
            <TouchableOpacity
              style={styles.authButton}
              onPress={handleGoogleLogin}
              disabled={oauthState.status === "loading"}
              activeOpacity={0.8}
            >
              <Ionicons
                name="logo-google"
                size={normalize(24)}
                color="#000000"
              />
              <Text style={styles.authButtonText}>Continue with Google</Text>
            </TouchableOpacity>

            {/* Continue with Email */}
            <TouchableOpacity
              style={styles.authButtonEmail}
              onPress={handleEmailLogin}
              activeOpacity={0.8}
            >
              <Text style={styles.authButtonEmailText}>
                Continue with Phone Number
              </Text>
            </TouchableOpacity>
          </View>

          {/* Footer Links */}
          <View style={styles.footerLinks}>
            <TouchableOpacity
              onPress={() => Linking.openURL("https://example.com/privacy")}
            >
              <Text style={styles.footerLinkText}>Privacy policy</Text>
            </TouchableOpacity>
            <Text style={styles.footerSeparator}>•</Text>
            <TouchableOpacity
              onPress={() => Linking.openURL("https://example.com/terms")}
            >
              <Text style={styles.footerLinkText}>Terms of service</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1C1C1C",
  },
  backgroundImage: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: "100%",
    height: "100%",
  },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.3)", // Subtle overlay
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: normalize(24),
  },
  skipContainer: {
    alignItems: "flex-end",
    paddingTop: normalize(16),
    paddingRight: normalize(8),
  },
  skipButton: {
    paddingVertical: normalize(8),
    paddingHorizontal: normalize(16),
  },
  skipText: {
    fontSize: normalizeFont(16),
    fontWeight: "500",
    color: "#FFFFFF",
    fontFamily: Platform.select({
      ios: "SF Pro Display",
      android: "sans-serif",
      default: "System",
    }),
  },
  brandingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: normalize(40),
  },
  logoContainer: {
    marginBottom: normalize(16),
  },
  appNameContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    left: normalize(22),
  },
  appNamePrefix: {
    fontSize: normalizeFont(36),
    fontWeight: "800",
    color: "#FFFFFF",
    fontFamily: Platform.select({
      ios: "SF Pro Display",
      android: "sans-serif",
      default: "System",
    }),
    letterSpacing: 1,
    lineHeight: normalizeFont(44),
    marginRight: normalize(8),
  },
  appNameSport: {
    fontSize: normalizeFont(36),
    fontWeight: "800",
    color: "#FFFFFF",
    fontFamily: Platform.select({
      ios: "SF Pro Display",
      android: "sans-serif",
      default: "System",
    }),
    letterSpacing: 1,
    lineHeight: normalizeFont(44),
    minWidth: normalize(220), // Fixed width to prevent shifting - increased for "Basketball"
    textAlign: "left",
  },
  authButtonsContainer: {
    paddingBottom: normalize(40),
    gap: normalize(12),
  },
  authButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    height: normalize(56),
    borderRadius: normalize(12),
    paddingHorizontal: normalize(20),
    gap: normalize(12),
  },
  authButtonText: {
    fontSize: normalizeFont(16),
    fontWeight: "600",
    color: "#000000",
    fontFamily: Platform.select({
      ios: "SF Pro Display",
      android: "sans-serif",
      default: "System",
    }),
  },
  authButtonEmail: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#1A1A1A",
    height: normalize(56),
    borderRadius: normalize(12),
    paddingHorizontal: normalize(20),
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  authButtonEmailText: {
    fontSize: normalizeFont(16),
    fontWeight: "600",
    color: "#FFFFFF",
    fontFamily: Platform.select({
      ios: "SF Pro Display",
      android: "sans-serif",
      default: "System",
    }),
  },
  footerLinks: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingBottom: normalize(32),
    gap: normalize(12),
  },
  footerLinkText: {
    fontSize: normalizeFont(14),
    fontWeight: "400",
    color: "#FFFFFF",
    fontFamily: Platform.select({
      ios: "SF Pro Display",
      android: "sans-serif",
      default: "System",
    }),
  },
  footerSeparator: {
    fontSize: normalizeFont(14),
    color: "rgba(255, 255, 255, 0.5)",
  },
});
