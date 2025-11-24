import React from "react";
import { View, Text, StyleSheet } from "react-native";
import ScreenTemplate from "./ScreenTemplate";

export default function ProfileScreen() {
  return (
    <ScreenTemplate title="Profile" description="Your profile and settings">
      <View style={styles.container}>
        <Text style={styles.text}>Profile Screen</Text>
      </View>
    </ScreenTemplate>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  text: {
    fontSize: 16,
    color: "#666",
  },
});

