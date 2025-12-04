import React from "react";
import { View, StyleSheet, ActivityIndicator } from "react-native";
import { Colors } from "../../constants/theme";

export default function ChartSkeleton() {
  const chartWidth = 350;
  const chartHeight = 300;

  return (
    <View
      style={[styles.container, { width: chartWidth, height: chartHeight }]}
    >
      <ActivityIndicator size="large" color={Colors.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "relative",

    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
});
