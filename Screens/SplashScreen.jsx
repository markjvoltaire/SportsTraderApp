import React, { useEffect, useRef } from "react";
import { View, Image, StyleSheet, Animated, Dimensions } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useAuth } from "../src/contexts/AuthContext";
import { Colors } from "../src/constants/theme";
import * as NativeSplashScreen from "expo-splash-screen";

const { width, height } = Dimensions.get("window");

export default function SplashScreen() {
  const navigation = useNavigation();
  const {
    session,
    loading,
    walletAddress,
    proofStatus,
  } = useAuth();
  const fadeAnim = useRef(new Animated.Value(1)).current;

  // Hide the native splash screen when this component mounts
  useEffect(() => {
    const hideSplash = async () => {
      try {
        await NativeSplashScreen.hideAsync();
      } catch (error) {
        console.warn("Error hiding splash screen:", error);
      }
    };
    hideSplash();
  }, []);

  useEffect(() => {
    // Only proceed with fade and navigation once auth has finished loading
    if (loading) return;

    // Fade out animation after showing logo
    const minDisplayTime = 1000;
    const fadeDuration = 800;

    const timer = setTimeout(() => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: fadeDuration,
        useNativeDriver: true,
      }).start(() => {
        if (!session) {
          navigation.replace("Auth");
          return;
        }

        // Signed in: check if Proof KYC verification is needed
        const proofResolved =
          proofStatus.status !== "idle" && proofStatus.status !== "loading";
        const needsProof =
          walletAddress && proofResolved && proofStatus.verified === false;

        if (needsProof) {
          navigation.replace("ProofVerification");
        } else {
          navigation.replace("Main");
        }
      });
    }, minDisplayTime);

    return () => clearTimeout(timer);
  }, [
    navigation,
    fadeAnim,
    session,
    loading,
    walletAddress,
    proofStatus.status,
    proofStatus.verified,
  ]);

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.logoContainer,
          {
            opacity: fadeAnim,
          },
        ]}
      >
        <Image
          source={require("../assets/images/ScoretradeBlack.png")}
          style={styles.logo}
          resizeMode="contain"
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: "center",
    alignItems: "center",
  },
  logoContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  logo: {
    width: width * 0.6,
    height: width * 0.6,
    maxWidth: 300,
    maxHeight: 300,
  },
});
