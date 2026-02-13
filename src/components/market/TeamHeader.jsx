import { StyleSheet, Text, View } from "react-native";
import React from "react";

export default function TeamHeader({ market, textColor = "#FFFFFF" }) {
  return (
    <View style={styles.container}>
      <Text style={[styles.teamName, { color: textColor }]}>{market.awayTeam.name}</Text>
      <Text style={[styles.atSymbol, { color: textColor }]}>@</Text>
      <Text style={[styles.teamName, { color: textColor }]}>{market.homeTeam.name}</Text>
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
  },
  atSymbol: {
    fontSize: 20,
    fontWeight: "bold",
    opacity: 0.6,
  },
});
