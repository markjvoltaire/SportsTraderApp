import { StyleSheet, Text, View, TouchableOpacity } from "react-native";
import React from "react";
import { getTeamColor } from "../../utils/teamColors";
import { formatSharePrice } from "../../utils/formatters";

export default function ButtonRow({ market }) {
  if (!market) {
    return null;
  }

  // Extract team data
  const awayTeam = market.awayTeam || {
    name: "Away",
    abbreviation: "Away",
    price: 0.5,
    color: "#9333EA",
  };
  const homeTeam = market.homeTeam || {
    name: "Home",
    abbreviation: "Home",
    price: 0.5,
    color: "#06B6D4",
  };

  const awayName = awayTeam.abbreviation || awayTeam.name || "Away";
  const homeName = homeTeam.abbreviation || homeTeam.name || "Home";
  const awayPrice = parseFloat(awayTeam.price) || 0.5;
  const homePrice = parseFloat(homeTeam.price) || 0.5;
  const awayColor = getTeamColor(awayTeam.abbreviation, awayName);
  const homeColor = getTeamColor(homeTeam.abbreviation, homeName);

  const handleBuyAway = () => {
    console.log("Buy Away Team:", awayName, "at", awayPrice);
    // Add your buy logic here
  };

  const handleBuyHome = () => {
    console.log("Buy Home Team:", homeName, "at", homePrice);
    // Add your buy logic here
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.button, { backgroundColor: awayColor }]}
        onPress={handleBuyAway}
        activeOpacity={0.8}
      >
        <Text style={styles.teamName}>
          {awayName} {formatSharePrice(awayPrice)}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, { backgroundColor: homeColor }]}
        onPress={handleBuyHome}
        activeOpacity={0.8}
      >
        <Text style={styles.teamName}>
          {homeName} {formatSharePrice(homePrice)}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    padding: 6,
    gap: 6,
    width: "100%",
  },
  button: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 45,
  },
  teamName: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "600",
  },
});
