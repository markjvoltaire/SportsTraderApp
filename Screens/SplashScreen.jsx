import React, { useEffect, useRef } from "react";
import { View, Image, StyleSheet, Animated, Dimensions } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useAuth } from "../src/contexts/AuthContext";
import { Colors } from "../src/constants/theme";

const { width, height } = Dimensions.get("window");

export default function SplashScreen() {
  const navigation = useNavigation();
  const { session, loading } = useAuth();
  const fadeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Only proceed with fade and navigation once auth has finished loading
    if (loading) return;

    // Fade out animation after showing logo for 2 seconds (from when auth finishes loading)
    const minDisplayTime = 2000; // Minimum 2 seconds to show logo
    const fadeDuration = 800;

    const timer = setTimeout(() => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: fadeDuration,
        useNativeDriver: true,
      }).start(() => {
        // Navigate to appropriate screen based on auth status
        if (session) {
          navigation.replace("Home");
        } else {
          navigation.replace("Auth");
        }
      });
    }, minDisplayTime);

    return () => clearTimeout(timer);
  }, [navigation, fadeAnim, session, loading]);

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
