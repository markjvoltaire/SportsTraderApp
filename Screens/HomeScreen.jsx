import React from "react";
import { StyleSheet, Text, View } from "react-native";

import ScreenTemplate from "./ScreenTemplate";
import { Colors, Spacing, Typography } from "../constants/theme";

export default function HomeScreen() {
  return (
    <ScreenTemplate
      header={
        <View style={styles.header}>
          <Text style={styles.heading}>Home</Text>
          <Text style={styles.subheading}>
            Quick snapshot of your portfolio and the markets you follow.
          </Text>
        </View>
      }
    >
      <Text style={styles.bodyText}>Hello</Text>
    </ScreenTemplate>
  );
}

const styles = StyleSheet.create({
  header: {
    alignSelf: "stretch",
  },
  heading: {
    ...Typography.sectionTitle,
    marginBottom: Spacing.xs,
  },
  subheading: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
  bodyText: {
    ...Typography.body,
    color: Colors.textPrimary,
  },
});
