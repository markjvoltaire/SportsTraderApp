import { StyleSheet, Text, View } from "react-native";
import React from "react";
import { Typography } from "../../constants/theme";
import { Colors } from "../../constants/theme";
import { Spacing } from "../../constants/theme";
export default function Orders() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Orders</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "black",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "white",
    marginBottom: Spacing.lg,
    marginTop: Spacing.lg,
  },
  title: {
    ...Typography.title,
    color: Colors.textPrimary,
  },
});
