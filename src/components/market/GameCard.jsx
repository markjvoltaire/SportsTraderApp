import React, { useEffect, useState, useMemo } from "react";
import { StyleSheet, Text, View, TouchableOpacity, Image } from "react-native";
import { useNavigation } from "@react-navigation/native";
import Svg, { Polyline } from "react-native-svg";
import { getNFLTeamColor, getNBATeamColor } from "../../constants/teamColors";

export default function GameCard({ event }) {
  const navigation = useNavigation();

  const [chartLoading, setChartLoading] = useState(true);

  if (!event || !event.markets || event.markets.length === 0) return null;

  const market = event.markets[0];

  // Parse team names from market data
  const getTeamNames = () => {
    // For EPL style markets: 3 markets (Home, Away, Tie)
    if (event.markets && event.markets.length >= 3) {
      const teamMarkets = event.markets.filter((m) => m.yesSubTitle !== "Tie");
      const tieMarket = event.markets.find((m) => m.yesSubTitle === "Tie");

      if (teamMarkets.length >= 2 && tieMarket) {
        return {
          homeTeam: teamMarkets[0].yesSubTitle,
          awayTeam: teamMarkets[1].yesSubTitle,
          tieTeam: "Tie",
          hasThreeMarkets: true,
        };
      }
    }

    // For NFL/NBA style markets: check if event has multiple markets with yesSubTitle
    if (event.markets && event.markets.length >= 2) {
      const firstMarket = event.markets[0];
      const secondMarket = event.markets[1];

      // If both markets have yesSubTitle, these are the team names
      if (firstMarket.yesSubTitle && secondMarket.yesSubTitle) {
        return {
          yesTeam: firstMarket.yesSubTitle,
          noTeam: secondMarket.yesSubTitle,
        };
      }
    }

    // Try to get team names from structured data first
    if (market.awayTeam && market.homeTeam) {
      return {
        yesTeam: market.homeTeam.name || market.homeTeam.abbreviation || "Home",
        noTeam: market.awayTeam.name || market.awayTeam.abbreviation || "Away",
      };
    }

    // Parse from title patterns
    if (event.title) {
      // Pattern: "Team A at Team B" (NFL/NBA format)
      const atMatch = event.title.match(/(.+?)\s+at\s+(.+)/i);
      if (atMatch) {
        return {
          yesTeam: atMatch[2].trim(), // Home team (after "at")
          noTeam: atMatch[1].trim(), // Away team (before "at")
        };
      }

      // Pattern: "Team A vs Team B"
      const titleMatch = event.title.match(/(.+?)\s+vs\.?\s+(.+)/i);
      if (titleMatch) {
        return {
          yesTeam: titleMatch[2].trim(), // Home team (usually after "vs")
          noTeam: titleMatch[1].trim(), // Away team (usually before "vs")
        };
      }

      // Another pattern: "Will X beat Y" or similar
      const beatMatch = event.title.match(/Will\s+(.+?)\s+beat\s+(.+?)\?/i);
      if (beatMatch) {
        return {
          yesTeam: beatMatch[1].trim(),
          noTeam: beatMatch[2].trim(),
        };
      }
    }

    // Ultimate fallback
    return {
      yesTeam: "YES",
      noTeam: "NO",
    };
  };

  const teamData = getTeamNames();
  const { yesTeam, noTeam, homeTeam, awayTeam, tieTeam, hasThreeMarkets } =
    teamData;

  // Helper function to brighten colors
  const brightenColor = (color, boost = 0.25) => {
    if (!color) return null;
    const hex = color.replace("#", "");
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    const brightR = Math.min(255, Math.round(r + (255 - r) * boost));
    const brightG = Math.min(255, Math.round(g + (255 - g) * boost));
    const brightB = Math.min(255, Math.round(b + (255 - b) * boost));
    return `#${brightR.toString(16).padStart(2, "0")}${brightG
      .toString(16)
      .padStart(2, "0")}${brightB.toString(16).padStart(2, "0")}`;
  };

  // Get team colors for NFL/NBA
  const teamColors = useMemo(() => {
    const leagueHints = [
      market?.league,
      market?.sport,
      event?.competition,
      event?.league,
      event?.sport,
      market?.seriesTicker,
      event?.seriesTicker,
      market?.ticker,
      event?.ticker,
    ]
      .filter(Boolean)
      .join(" ");
    const isProFootball = /pro football|nfl/i.test(leagueHints);
    const isProBasketball = /pro basketball|nba/i.test(leagueHints);

    let awayColor = null;
    let homeColor = null;
    let yesColor = null;
    let noColor = null;

    if (isProFootball) {
      // For NFL, map team names to colors
      if (hasThreeMarkets) {
        awayColor =
          getNFLTeamColor(awayTeam) || getNFLTeamColor(awayTeam?.split(" ")[0]);
        homeColor =
          getNFLTeamColor(homeTeam) || getNFLTeamColor(homeTeam?.split(" ")[0]);
      } else {
        noColor =
          getNFLTeamColor(noTeam) || getNFLTeamColor(noTeam?.split(" ")[0]);
        yesColor =
          getNFLTeamColor(yesTeam) || getNFLTeamColor(yesTeam?.split(" ")[0]);
      }
    } else if (isProBasketball) {
      // For NBA, map team names to colors
      if (hasThreeMarkets) {
        awayColor =
          getNBATeamColor(awayTeam) || getNBATeamColor(awayTeam?.split(" ")[0]);
        homeColor =
          getNBATeamColor(homeTeam) || getNBATeamColor(homeTeam?.split(" ")[0]);
      } else {
        noColor =
          getNBATeamColor(noTeam) || getNBATeamColor(noTeam?.split(" ")[0]);
        yesColor =
          getNBATeamColor(yesTeam) || getNBATeamColor(yesTeam?.split(" ")[0]);
      }
    }

    // Brighten colors for better visibility
    const colorBoost = isProFootball ? 0.3 : isProBasketball ? 0.22 : 0;
    return {
      awayColor: awayColor ? brightenColor(awayColor, colorBoost) : null,
      homeColor: homeColor ? brightenColor(homeColor, colorBoost) : null,
      yesColor: yesColor ? brightenColor(yesColor, colorBoost) : null,
      noColor: noColor ? brightenColor(noColor, colorBoost) : null,
    };
  }, [teamData, market, event]);

  // Handle multiple market formats
  let yesPercentage, noPercentage, tiePercentage;
  let displayYesPercentage, displayNoPercentage, displayTiePercentage;

  if (event.markets && event.markets.length >= 3) {
    // EPL format: 3 markets (Home win, Away win, Tie)
    const homeMarket = event.markets.find(
      (m) => m.yesSubTitle === teamData.homeTeam
    );
    const awayMarket = event.markets.find(
      (m) => m.yesSubTitle === teamData.awayTeam
    );
    const tieMarket = event.markets.find((m) => m.yesSubTitle === "Tie");

    const homeTeamBid = homeMarket ? parseFloat(homeMarket.yesBid) * 100 : 0;
    const awayTeamBid = awayMarket ? parseFloat(awayMarket.yesBid) * 100 : 0;
    const tieBid = tieMarket ? parseFloat(tieMarket.yesBid) * 100 : 0;

    // Store original percentages for display
    displayYesPercentage = Math.round(homeTeamBid);
    displayNoPercentage = Math.round(awayTeamBid);
    displayTiePercentage = Math.round(tieBid);

    // Normalize percentages so they add up to 100% for progress bar visualization
    const total = homeTeamBid + awayTeamBid + tieBid;
    const normalizedTotal = total > 0 ? total : 100; // Avoid division by zero, default to 100 if all zero

    yesPercentage = Math.round((homeTeamBid / normalizedTotal) * 100);
    noPercentage = Math.round((awayTeamBid / normalizedTotal) * 100);
    tiePercentage = Math.round((tieBid / normalizedTotal) * 100);
  } else if (event.markets && event.markets.length >= 2) {
    // NFL/NBA format: 2 markets (one per team)
    const firstTeamBid = parseFloat(event.markets[0].yesBid) * 100;
    const secondTeamBid = parseFloat(event.markets[1].yesBid) * 100;
    displayYesPercentage = Math.round(firstTeamBid);
    displayNoPercentage = Math.round(secondTeamBid);
    yesPercentage = displayYesPercentage;
    noPercentage = displayNoPercentage;
    tiePercentage = null;
    displayTiePercentage = null;
  } else {
    // Single market format (fallback)
    displayYesPercentage = Math.round(parseFloat(market.yesBid) * 100);
    displayNoPercentage = 100 - displayYesPercentage;
    yesPercentage = displayYesPercentage;
    noPercentage = displayNoPercentage;
    tiePercentage = null;
    displayTiePercentage = null;
  }

  const changePercentage = 2.05; // Calculate from historical data
  const isPositive = changePercentage > 0;

  // Mock chart data - replace with actual historical price data
  const chartData = [
    38, 39, 41, 40, 42, 41, 43, 42, 41, 39, 38, 37, 39, 40, 41, 40,
  ];

  const formatCurrency = (value) => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(2)}M`;
    return `$${value.toLocaleString()}`;
  };

  const eventDate = new Date(market.closeTime * 1000);
  console.log("market", market.ticker);
  const formattedDate = eventDate.toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <TouchableOpacity
      onPress={() => {
        navigation.navigate("Chart", { event });
      }}
      activeOpacity={0.9}
    >
      <View style={styles.card}>
        {/* Header with image and title */}
        <View style={styles.header}>
          <View style={styles.imageContainer}>
            <Image
              source={
                event.seriesTicker === "KXNFLGAME" ||
                event.seriesTicker === "KXCFBGAME" ||
                event.seriesTicker === "KXCFBPLAYOFF" ||
                event.seriesTicker === "KXNCAAFGAME"
                  ? require("../../../assets/images/football.png")
                  : event.seriesTicker === "KXNBAGAME" ||
                    event.seriesTicker === "KXCBGAME" ||
                    event.seriesTicker === "KXCWBBGAME" ||
                    event.seriesTicker === "KXWNBA" ||
                    event.seriesTicker === "KXNCAAMBGAME" ||
                    event.seriesTicker === "KXNCAAWBGAME"
                  ? require("../../../assets/images/basketball.jpg")
                  : event.seriesTicker === "KXMMA" ||
                    event.seriesTicker === "KXUFCFIGHT"
                  ? require("../../../assets/images/MMA.png")
                  : { uri: event.imageUrl }
              }
              style={styles.thumbnail}
              resizeMode="cover"
            />
          </View>

          <View style={styles.titleContainer}>
            <Text style={styles.title} numberOfLines={2}>
              {event.title}
            </Text>
            <View style={styles.metaRow}>
              <Text style={styles.volume}>{formatCurrency(event.volume)}</Text>
              <Text style={styles.dot}>•</Text>
              <Text style={styles.date}>{formattedDate}</Text>
            </View>
          </View>
        </View>

        {/* Range labels */}
        <View style={styles.rangeContainer}>
          {hasThreeMarkets ? (
            <>
              <Text style={styles.rangeText}>
                {homeTeam} {displayYesPercentage}%
              </Text>
              <Text style={styles.rangeText}>
                {tieTeam} {displayTiePercentage}%
              </Text>
              <Text style={styles.rangeText}>
                {awayTeam} {displayNoPercentage}%
              </Text>
            </>
          ) : (
            <>
              <Text style={styles.rangeText}>
                {yesTeam} {displayYesPercentage}%
              </Text>
              <Text style={styles.rangeText}>
                {noTeam} {displayNoPercentage}%
              </Text>
            </>
          )}
        </View>

        {/* Progress bar */}
        <View style={styles.progressBarContainer}>
          <View style={styles.progressBarBackground}>
            {/* Team color section for yes/home percentage */}
            <View
              style={[
                styles.progressBarFill,
                {
                  width: `${yesPercentage}%`,
                  backgroundColor: hasThreeMarkets
                    ? teamColors.homeColor || "#FFFFFF"
                    : teamColors.yesColor || "#FFFFFF",
                },
              ]}
            />
            {/* Team color section for no/away percentage */}
            <View
              style={[
                styles.progressBarFill,
                {
                  width: `${noPercentage}%`,
                  backgroundColor: hasThreeMarkets
                    ? teamColors.awayColor || "#EF4444"
                    : teamColors.noColor || "#EF4444",
                  position: "absolute",
                  left: `${yesPercentage}%`,
                },
              ]}
            />
            {hasThreeMarkets && tiePercentage !== null && (
              <View
                style={[
                  styles.progressBarFill,
                  {
                    width: `${tiePercentage}%`,
                    backgroundColor: "#10c962",
                    position: "absolute",
                    left: `${yesPercentage + noPercentage}%`,
                  },
                ]}
              />
            )}
          </View>
        </View>

        {/* Action buttons */}
        <View
          style={
            hasThreeMarkets
              ? styles.threeButtonContainer
              : styles.buttonContainer
          }
        >
          <TouchableOpacity
            style={[
              styles.button,
              styles.yesButton,
              {
                backgroundColor: hasThreeMarkets
                  ? teamColors.homeColor || "#1a1f2e"
                  : teamColors.yesColor || "#1a1f2e",
              },
            ]}
          >
            <View style={styles.buttonContent}>
              <Text
                style={[
                  styles.yesButtonText,
                  (hasThreeMarkets
                    ? teamColors.homeColor
                    : teamColors.yesColor) && styles.buttonTextWhite,
                ]}
              >
                {hasThreeMarkets ? homeTeam : yesTeam}
              </Text>
              <Text
                style={[
                  styles.buttonPriceText,
                  (hasThreeMarkets
                    ? teamColors.homeColor
                    : teamColors.yesColor) && styles.buttonPriceTextWhite,
                ]}
              >
                {displayYesPercentage}¢
              </Text>
            </View>
          </TouchableOpacity>
          {hasThreeMarkets && (
            <TouchableOpacity style={[styles.button, styles.tieButton]}>
              <View style={styles.buttonContent}>
                <Text style={styles.tieButtonText}>{tieTeam}</Text>
                <Text style={styles.buttonPriceText}>
                  {displayTiePercentage}¢
                </Text>
              </View>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[
              styles.button,
              styles.noButton,
              {
                backgroundColor: hasThreeMarkets
                  ? teamColors.awayColor || "#1a1f2e"
                  : teamColors.noColor || "#1a1f2e",
              },
            ]}
          >
            <View style={styles.buttonContent}>
              <Text
                style={[
                  styles.noButtonText,
                  (hasThreeMarkets
                    ? teamColors.awayColor
                    : teamColors.noColor) && styles.buttonTextWhite,
                ]}
              >
                {hasThreeMarkets ? awayTeam : noTeam}
              </Text>
              <Text
                style={[
                  styles.buttonPriceText,
                  (hasThreeMarkets
                    ? teamColors.awayColor
                    : teamColors.noColor) && styles.buttonPriceTextWhite,
                ]}
              >
                {displayNoPercentage}¢
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 24,
    padding: 20,
    marginVertical: 8,
    borderWidth: 2,
    borderColor: "#141414",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 5,
  },
  header: { flexDirection: "row", marginBottom: 20 },
  imageContainer: { position: "relative", marginRight: 12 },
  thumbnail: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: "#1a1f2e",
  },
  badge: {
    position: "absolute",
    bottom: -4,
    right: -4,
    backgroundColor: "#1F2937",
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#0c111d",
  },
  badgeText: { fontSize: 12, color: "#fefefe" },
  titleContainer: { flex: 1, justifyContent: "center" },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: "#fefefe",
    marginBottom: 6,
    lineHeight: 24,
  },
  metaRow: { flexDirection: "row", alignItems: "center" },
  volume: { fontSize: 13, color: "#758292", fontWeight: "500" },
  dot: { fontSize: 13, color: "rgba(255, 255, 255, 0.2)", marginHorizontal: 6 },
  date: { fontSize: 13, color: "#758292" },
  outcomeSection: { marginBottom: 16 },
  outcomeLabel: {
    fontSize: 32,
    fontWeight: "700",
    color: "#fefefe",
    marginBottom: 4,
  },
  change: { fontSize: 16, fontWeight: "600", color: "#EF4444" },
  changePositive: { color: "#4ADE80" },
  chartContainer: { height: 180, marginBottom: 12 },
  rangeContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  rangeText: { fontSize: 14, color: "#758292", fontWeight: "500" },
  progressBarContainer: { marginBottom: 20 },
  progressBarBackground: {
    height: 8,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderRadius: 4,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 4,
  },
  buttonContainer: { flexDirection: "row", gap: 12 },
  threeButtonContainer: { flexDirection: "row", gap: 8 },
  button: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
    backgroundColor: "#1a1f2e",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  buttonContent: {
    alignItems: "center",
  },
  yesButton: {
    backgroundColor: "#1a1f2e",
    borderColor: "rgba(255, 255, 255, 0.15)",
  },
  noButton: {
    backgroundColor: "#1a1f2e",
    borderColor: "rgba(255, 255, 255, 0.15)",
  },
  tieButton: {
    backgroundColor: "#1a1f2e",
    borderColor: "rgba(255, 255, 255, 0.15)",
  },
  yesButtonText: { fontSize: 17, fontWeight: "600", color: "#fefefe" },
  noButtonText: { fontSize: 17, fontWeight: "600", color: "#fefefe" },
  tieButtonText: { fontSize: 17, fontWeight: "600", color: "#fefefe" },
  buttonTextWhite: { color: "#FFFFFF" },
  buttonPriceText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#758292",
    marginTop: 4,
  },
  buttonPriceTextWhite: {
    color: "#FFFFFF",
    opacity: 0.95,
  },
});
