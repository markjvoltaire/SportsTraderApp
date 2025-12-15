import { StyleSheet, View } from "react-native";
import React from "react";
import LottieView from "lottie-react-native";

export default function ChartSkeleton() {
  return (
    <View style={styles.container}>
      <LottieView
        source={require("../../../assets/lottie/Loading.json")}
        autoPlay
        loop
        style={styles.lottie}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    minHeight: 200,
  },
  lottie: {
    width: 200,
    height: 100,
  },
});
