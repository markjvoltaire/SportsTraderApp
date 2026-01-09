import React from "react";
import { StyleSheet, Text, View, TouchableOpacity, Image } from "react-native";
import Svg, { Polyline } from "react-native-svg";

export default function EventCard({ event }) {
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

  // Handle multiple market formats
  let yesPercentage, noPercentage, tiePercentage;

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

    yesPercentage = Math.round(homeTeamBid);
    noPercentage = Math.round(awayTeamBid);
    tiePercentage = Math.round(tieBid);
  } else if (event.markets && event.markets.length >= 2) {
    // NFL/NBA format: 2 markets (one per team)
    const firstTeamBid = parseFloat(event.markets[0].yesBid) * 100;
    const secondTeamBid = parseFloat(event.markets[1].yesBid) * 100;
    yesPercentage = Math.round(firstTeamBid);
    noPercentage = Math.round(secondTeamBid);
    tiePercentage = null;
  } else {
    // Single market format (fallback)
    yesPercentage = Math.round(parseFloat(market.yesBid) * 100);
    noPercentage = 100 - yesPercentage;
    tiePercentage = null;
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
  const formattedDate = eventDate.toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  // Generate SVG path points
  const generateChartPoints = (data, width, height) => {
    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min;

    return data
      .map((value, index) => {
        const x = (index / (data.length - 1)) * width;
        const y = height - ((value - min) / range) * height;
        return `${x},${y}`;
      })
      .join(" ");
  };

  return (
    <TouchableOpacity
      onPress={() => {
        console.log("Event seriesTicker:", event.seriesTicker);
        console.log(event);
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
                {homeTeam} {yesPercentage}%
              </Text>
              <Text style={styles.rangeText}>
                {tieTeam} {tiePercentage}%
              </Text>
              <Text style={styles.rangeText}>
                {awayTeam} {noPercentage}%
              </Text>
            </>
          ) : (
            <>
              <Text style={styles.rangeText}>
                {yesTeam} {yesPercentage}%
              </Text>
              <Text style={styles.rangeText}>
                {noTeam} {noPercentage}%
              </Text>
            </>
          )}
        </View>

        {/* Progress bar */}
        <View style={styles.progressBarContainer}>
          <View style={styles.progressBarBackground}>
            {/* Black section for yes percentage */}
            <View
              style={[
                styles.progressBarFill,
                {
                  width: `${yesPercentage}%`,
                  backgroundColor: "#000000",
                },
              ]}
            />
            {/* Red section for no percentage */}
            <View
              style={[
                styles.progressBarFill,
                {
                  width: `${noPercentage}%`,
                  backgroundColor: "#EF4444",
                  position: "absolute",
                  left: `${yesPercentage}%`,
                },
              ]}
            />
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
          <TouchableOpacity style={[styles.button, styles.yesButton]}>
            <View style={styles.buttonContent}>
              <Text style={styles.yesButtonText}>
                {hasThreeMarkets ? homeTeam : yesTeam}
              </Text>
              <Text style={styles.buttonPriceText}>
                {Math.round(yesPercentage)}¢
              </Text>
            </View>
          </TouchableOpacity>
          {hasThreeMarkets && (
            <TouchableOpacity style={[styles.button, styles.tieButton]}>
              <View style={styles.buttonContent}>
                <Text style={styles.tieButtonText}>{tieTeam}</Text>
                <Text style={styles.buttonPriceText}>
                  {Math.round(tiePercentage)}¢
                </Text>
              </View>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={[styles.button, styles.noButton]}>
            <View style={styles.buttonContent}>
              <Text style={styles.noButtonText}>
                {hasThreeMarkets ? awayTeam : noTeam}
              </Text>
              <Text style={styles.buttonPriceText}>
                {Math.round(noPercentage)}¢
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
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 20,
    marginVertical: 8,

    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  header: { flexDirection: "row", marginBottom: 20 },
  imageContainer: { position: "relative", marginRight: 12 },
  thumbnail: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: "#F0F0F0",
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
    borderColor: "#FFFFFF",
  },
  badgeText: { fontSize: 12 },
  titleContainer: { flex: 1, justifyContent: "center" },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 6,
    lineHeight: 24,
  },
  metaRow: { flexDirection: "row", alignItems: "center" },
  volume: { fontSize: 13, color: "#9CA3AF", fontWeight: "500" },
  dot: { fontSize: 13, color: "#D1D5DB", marginHorizontal: 6 },
  date: { fontSize: 13, color: "#9CA3AF" },
  outcomeSection: { marginBottom: 16 },
  outcomeLabel: {
    fontSize: 32,
    fontWeight: "700",
    color: "#1F2937",
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
  rangeText: { fontSize: 14, color: "#9CA3AF", fontWeight: "500" },
  progressBarContainer: { marginBottom: 20 },
  progressBarBackground: {
    height: 8,
    backgroundColor: "#F3F4F6",
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
  },
  buttonContent: {
    alignItems: "center",
  },
  yesButton: { backgroundColor: "#000000" },
  noButton: { backgroundColor: "#000000" },
  tieButton: { backgroundColor: "#000000" },
  yesButtonText: { fontSize: 17, fontWeight: "600", color: "#FFFFFF" },
  noButtonText: { fontSize: 17, fontWeight: "600", color: "#FFFFFF" },
  tieButtonText: { fontSize: 17, fontWeight: "600", color: "#FFFFFF" },
  buttonPriceText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#FFFFFF",
    opacity: 0.8,
    marginTop: 4,
  },
});
