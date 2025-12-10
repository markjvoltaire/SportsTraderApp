import { StyleSheet, Text, View, TouchableOpacity, ActivityIndicator } from "react-native";
import React from "react";
import { getTeamColor } from "../../utils/teamColors";
import { formatSharePrice } from "../../utils/formatters";
import { normalize, normalizeFont } from "../../utils/dimensions";
import { Colors, Spacing } from "../../constants/theme";

export default function ButtonRow({ market, currentPrices, loading = false }) {
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

  // Extract team names - prioritize title extraction for accurate names
  let awayName = "Away";
  let homeName = "Home";

  // First, try to extract from market title (most reliable source)
  if (market.title) {
    const titleMatch = market.title.match(/(.+?)\s+vs\.?\s+(.+)/i);
    if (titleMatch) {
      awayName = titleMatch[1].trim();
      homeName = titleMatch[2].trim();
    }
  }

  // Fallback to team object names/abbreviations if title extraction didn't work
  if (awayName === "Away" || homeName === "Home") {
    awayName = awayTeam.name || awayTeam.abbreviation || "Away";
    homeName = homeTeam.name || homeTeam.abbreviation || "Home";
  }
  // Use current prices from chart cursor if available, otherwise use market prices
  const awayPrice = currentPrices?.awayPrice !== undefined 
    ? parseFloat(currentPrices.awayPrice) 
    : parseFloat(awayTeam.price) || 0.5;
  const homePrice = currentPrices?.homePrice !== undefined 
    ? parseFloat(currentPrices.homePrice) 
    : parseFloat(homeTeam.price) || 0.5;
  const awayColor = getTeamColor(awayTeam.abbreviation, awayName);
  const homeColor = getTeamColor(homeTeam.abbreviation, homeName);

  const handleBuyAway = () => {
    console.log("Buy Away Team:", awayName, "at", awayPrice);
    // Add your buy logic here - uses current price from chart if available
  };

  const handleBuyHome = () => {
    console.log("Buy Home Team:", homeName, "at", homePrice);
    // Add your buy logic here - uses current price from chart if available
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[
          styles.button,
          { backgroundColor: awayColor },
          loading && styles.buttonDisabled,
        ]}
        onPress={handleBuyAway}
        activeOpacity={0.8}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : (
          <View style={styles.buttonContent}>
            <Text style={styles.teamName}>{awayName}</Text>
            <Text style={styles.teamPrice}>
              {formatSharePrice(awayPrice)}
            </Text>
          </View>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.button,
          { backgroundColor: homeColor },
          loading && styles.buttonDisabled,
        ]}
        onPress={handleBuyHome}
        activeOpacity={0.8}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : (
          <View style={styles.buttonContent}>
            <Text style={styles.teamName}>{homeName}</Text>
            <Text style={styles.teamPrice}>
              {formatSharePrice(homePrice)}
            </Text>
          </View>
        )}
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
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonContent: {
    alignItems: "center",
    justifyContent: "center",
  },
  teamName: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.3,
    marginBottom: Spacing.xs / 2,
  },
  teamPrice: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
    opacity: 0.9,
  },
});
