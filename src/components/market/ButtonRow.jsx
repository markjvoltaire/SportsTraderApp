import { StyleSheet, Text, View, TouchableOpacity } from "react-native";
import React from "react";
import { getTeamColor } from "../../utils/teamColors";
import { formatSharePrice } from "../../utils/formatters";
import { normalize, normalizeFont } from "../../utils/dimensions";
import { Colors, Spacing } from "../../constants/theme";

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

// Calculate responsive dimensions
const containerPadding = normalize(6);
const containerGap = normalize(6);
const buttonPaddingV = normalize(8);
const buttonPaddingH = normalize(8);
const buttonRadius = normalize(8);
const buttonMinHeight = normalize(45);
const fontSize = normalizeFont(11);

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    padding: containerPadding,
    gap: containerGap,
    width: "100%",
  },
  button: {
    flex: 1,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.md,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 56,
    shadowColor: "rgba(0, 0, 0, 0.3)",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 4,
  },
  teamName: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
});
