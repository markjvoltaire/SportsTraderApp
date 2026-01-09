import { StyleSheet, Text, View } from "react-native";
import React from "react";

export default function TeamHeader({ market }) {
  return (
    <View style={styles.container}>
      <Text style={styles.teamName}>{market.awayTeam.name}</Text>
      <Text style={styles.atSymbol}>@</Text>
      <Text style={styles.teamName}>{market.homeTeam.name}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginBottom: 16,
  },
  teamName: {
    fontSize: 30,
    fontWeight: "bold",
    color: "white",
  },
  atSymbol: {
    fontSize: 20,
    fontWeight: "bold",
    color: "white",
    opacity: 0.6,
  },
});
