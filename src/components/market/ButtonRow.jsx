import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
} from "react-native";
import React from "react";
import { formatSharePrice } from "../../utils/formatters";
import { normalize, normalizeFont } from "../../utils/dimensions";
import { Colors, Spacing } from "../../constants/theme";
import LottieLoader from "../ui/LottieLoader";

export default function ButtonRow({
  market,
  currentPrices,
  loading = false,
  onBuyAway,
  onBuyHome,
}) {
  if (!market) {
    return null;
  }

  // Extract team data - consistent with MarketCard and MarketDetailScreen
  let awayTeamData = null;
  let homeTeamData = null;
  let awayName = "Away";
  let homeName = "Home";
  let awayAbbreviation = null;
  let homeAbbreviation = null;
  let awayColor = null;
  let homeColor = null;
  let awayPrice = 0.5;
  let homePrice = 0.5;

  // First, try to get from teams array (new API format)
  if (
    market?.teams &&
    Array.isArray(market.teams) &&
    market.teams.length >= 2
  ) {
    awayTeamData = market.teams[0];
    homeTeamData = market.teams[1];
    // Prefer alias over name (alias is shorter)
    awayName = awayTeamData.alias || awayTeamData.name || "Away";
    homeName = homeTeamData.alias || homeTeamData.name || "Home";
    awayAbbreviation = awayTeamData.abbreviation || null;
    homeAbbreviation = homeTeamData.abbreviation || null;
    awayColor = awayTeamData.color || null;
    homeColor = homeTeamData.color || null;
  }
  // Fallback to awayTeam/homeTeam objects
  else if (market?.awayTeam || market?.homeTeam) {
    awayTeamData = market.awayTeam;
    homeTeamData = market.homeTeam;
    awayName = market.awayTeam?.name || market.awayTeam?.abbreviation || "Away";
    homeName = market.homeTeam?.name || market.homeTeam?.abbreviation || "Home";
    awayAbbreviation = market.awayTeam?.abbreviation || null;
    homeAbbreviation = market.homeTeam?.abbreviation || null;
    awayColor = market.awayTeam?.color || null;
    homeColor = market.homeTeam?.color || null;
  }
  // Last resort: extract from title
  else if (market?.title) {
    const titleMatch = market.title.match(/(.+?)\s+vs\.?\s+(.+)/i);
    if (titleMatch) {
      awayName = titleMatch[1].trim().replace(/\.$/, ""); // Remove trailing period
      homeName = titleMatch[2].trim().replace(/\.$/, ""); // Remove trailing period
    }
  }

  // Extract prices from prices array or team objects
  // Handle new API format with prices array
  if (
    market?.prices &&
    Array.isArray(market.prices) &&
    market.prices.length >= 2
  ) {
    // If we have team data from teams array, match by team id/abbreviation
    if (awayTeamData && homeTeamData && awayTeamData.id && homeTeamData.id) {
      for (const priceObj of market.prices) {
        const priceTeam = priceObj?.team;
        if (
          priceTeam &&
          (priceTeam.id === awayTeamData.id ||
            priceTeam.abbreviation === awayAbbreviation?.toLowerCase())
        ) {
          const rawPrice =
            parseFloat(priceObj?.sellPrice ?? priceObj?.price) || 0.5;
          awayPrice = Math.round(rawPrice * 100) / 100;
        } else if (
          priceTeam &&
          (priceTeam.id === homeTeamData.id ||
            priceTeam.abbreviation === homeAbbreviation?.toLowerCase())
        ) {
          const rawPrice =
            parseFloat(priceObj?.sellPrice ?? priceObj?.price) || 0.5;
          homePrice = Math.round(rawPrice * 100) / 100;
        }
      }
    }
    // Last resort: use array order (first = away, second = home)
    else {
      const rawAwayPrice =
        parseFloat(market.prices[0]?.sellPrice ?? market.prices[0]?.price) ||
        0.5;
      const rawHomePrice =
        parseFloat(market.prices[1]?.sellPrice ?? market.prices[1]?.price) ||
        0.5;
      awayPrice = Math.round(rawAwayPrice * 100) / 100;
      homePrice = Math.round(rawHomePrice * 100) / 100;
    }
  } else if (market?.awayTeam && market?.homeTeam) {
    // Fallback to old format with awayTeam/homeTeam objects
    const rawAwayPrice = parseFloat(market.awayTeam.price) || 0.5;
    const rawHomePrice = parseFloat(market.homeTeam.price) || 0.5;
    awayPrice = Math.round(rawAwayPrice * 100) / 100;
    homePrice = Math.round(rawHomePrice * 100) / 100;
  }

  // Get team colors - use from API if available, otherwise use default colors
  const finalAwayColor = awayColor || Colors.primary;
  const finalHomeColor = homeColor || Colors.accentTeal;

  // Use current prices from chart cursor if available, otherwise use market prices
  const finalAwayPrice =
    currentPrices?.awayPrice !== undefined
      ? parseFloat(currentPrices.awayPrice)
      : awayPrice;
  const finalHomePrice =
    currentPrices?.homePrice !== undefined
      ? parseFloat(currentPrices.homePrice)
      : homePrice;

  const handleBuyAway = () => {
    if (onBuyAway) {
      onBuyAway({
        team: awayName,
        price: finalAwayPrice,
        color: finalAwayColor,
        teamData: awayTeamData,
      });
    } else {
      console.log("Buy Away Team:", awayName, "at", finalAwayPrice);
    }
  };

  const handleBuyHome = () => {
    if (onBuyHome) {
      onBuyHome({
        team: homeName,
        price: finalHomePrice,
        color: finalHomeColor,
        teamData: homeTeamData,
      });
    } else {
      console.log("Buy Home Team:", homeName, "at", finalHomePrice);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[
          styles.button,
          { backgroundColor: finalAwayColor },
          loading && styles.buttonDisabled,
        ]}
        onPress={handleBuyAway}
        activeOpacity={0.8}
        disabled={loading}
      >
        {loading ? (
          <LottieLoader size="small" />
        ) : (
          <View style={styles.buttonContent}>
            <Text style={styles.teamName}>{awayName}</Text>
            <Text style={styles.teamPrice}>
              {formatSharePrice(finalAwayPrice)}
            </Text>
          </View>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.button,
          { backgroundColor: finalHomeColor },
          loading && styles.buttonDisabled,
        ]}
        onPress={handleBuyHome}
        activeOpacity={0.8}
        disabled={loading}
      >
        {loading ? (
          <LottieLoader size="small" />
        ) : (
          <View style={styles.buttonContent}>
            <Text style={styles.teamName}>{homeName}</Text>
            <Text style={styles.teamPrice}>
              {formatSharePrice(finalHomePrice)}
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
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 50,
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
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 0.3,
    marginBottom: Spacing.xs / 2,
  },
  teamPrice: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
    opacity: 0.9,
  },
});
