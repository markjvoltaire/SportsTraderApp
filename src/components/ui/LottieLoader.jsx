import { StyleSheet, View } from "react-native";
import React from "react";
import LottieView from "lottie-react-native";

export default function LottieLoader({ size = "large", style }) {
  const sizeStyles = {
    large: { width: 200, height: 100 },
    small: { width: 100, height: 50 },
  };

  return (
    <View style={[styles.container, style]}>
      <LottieView
        source={require("../../../assets/lottie/Loading.json")}
        autoPlay
        loop
        style={[styles.lottie, sizeStyles[size]]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: "center",
    alignItems: "center",
  },
  lottie: {
    // Size will be set dynamically via sizeStyles
  },
});

