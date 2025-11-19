import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Colors, Spacing, Typography } from "../../constants/theme";

export default function ErrorBanner({ title = "Heads up", message }) {
  if (!message) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.dangerMuted,
    borderRadius: Spacing.md,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  title: {
    ...Typography.body,
    fontWeight: "600",
    color: Colors.danger,
    marginBottom: 2,
  },
  message: {
    ...Typography.caption,
    color: Colors.danger,
  },
});

