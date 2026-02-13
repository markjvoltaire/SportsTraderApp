import React, { useEffect, useState, useMemo, useRef } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  useColorScheme,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import Svg, { Polyline } from "react-native-svg";
import { getNFLTeamColor, getNBATeamColor } from "../../constants/teamColors";
import { formatCurrency } from "../../utils/formatters";
import GameCardDetails from "./GameCardDetails";

const WEBSOCKET_URL = "wss://dev-prediction-markets-api.dflow.net/api/v1/ws";

// Unix time converter utilities
const unixTimeConverter = {
  // Convert Unix timestamp (seconds) to Date object
  toDate: (timestamp) => {
    if (!timestamp) return null;
    // If timestamp is a number, assume it's Unix seconds (multiply by 1000)
    if (typeof timestamp === "number") {
      // Check if it's already in milliseconds (13+ digits) or seconds (10 digits)
      if (timestamp.toString().length >= 13) {
        return new Date(timestamp);
      }
      return new Date(timestamp * 1000);
    }
    // If it's a string, try to parse it
    if (typeof timestamp === "string") {
      // Check if it's a numeric string (Unix timestamp)
      const numTimestamp = Number(timestamp);
      if (!isNaN(numTimestamp)) {
        return numTimestamp.toString().length >= 13
          ? new Date(numTimestamp)
          : new Date(numTimestamp * 1000);
      }
      // Try parsing as ISO string
      return new Date(timestamp.replace("+00", "Z") || timestamp);
    }
    return null;
  },

  // Convert Date object or timestamp to Unix timestamp (seconds)
  toUnix: (date) => {
    if (!date) return null;
    if (date instanceof Date) {
      return Math.floor(date.getTime() / 1000);
    }
    if (typeof date === "number") {
      // If already in seconds (10 digits), return as-is
      if (date.toString().length <= 10) {
        return date;
      }
      // If in milliseconds, convert to seconds
      return Math.floor(date / 1000);
    }
    if (typeof date === "string") {
      const parsed = new Date(date.replace("+00", "Z") || date);
      if (!isNaN(parsed.getTime())) {
        return Math.floor(parsed.getTime() / 1000);
      }
    }
    return null;
  },

  // Check if a value is a Unix timestamp
  isUnixTimestamp: (value) => {
    if (typeof value === "number") {
      const str = value.toString();
      return str.length === 10 || str.length === 13;
    }
    if (typeof value === "string") {
      const num = Number(value);
      if (!isNaN(num)) {
        const str = num.toString();
        return str.length === 10 || str.length === 13;
      }
    }
    return false;
  },
};

export default function GameCard({ event, competitionFallback }) {
  const isDarkMode = useColorScheme() !== "light";
  const theme = useMemo(
    () =>
      isDarkMode
        ? {
            cardBackground: "#000000",
            cardBorder: "rgba(255, 255, 255, 0.1)",
            primaryText: "#FFFFFF",
            secondaryText: "rgba(255, 255, 255, 0.7)",
            subtleText: "rgba(255, 255, 255, 0.6)",
            accentText: "#6552FE",
            buttonBackground: "rgba(0, 0, 0, 0.3)",
            buttonBorder: "#FFFFFF",
            progressTrack: "rgba(255, 255, 255, 0.1)",
            tradeButtonBackground: "#FFFFFF",
            tradeButtonText: "#000000",
          }
        : {
            cardBackground: "#FFFFFF",
            cardBorder: "rgba(17, 24, 39, 0.12)",
            primaryText: "#111827",
            secondaryText: "#4B5563",
            subtleText: "#6B7280",
            accentText: "#8E7BFF",
            buttonBackground: "#F3F4F6",
            buttonBorder: "rgba(17, 24, 39, 0.2)",
            progressTrack: "rgba(17, 24, 39, 0.12)",
            tradeButtonBackground: "#111827",
            tradeButtonText: "#FFFFFF",
          },
    [isDarkMode]
  );
  const styles = useMemo(() => createStyles(theme), [theme]);

  const navigation = useNavigation();

  const [chartLoading, setChartLoading] = useState(true);
  const pricesWsRef = useRef(null);
  const [realtimePrices, setRealtimePrices] = useState({});
  const [countdown, setCountdown] = useState(null);

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

  // Get market tickers for WebSocket subscription
  const marketTickers = useMemo(() => {
    if (!event?.markets) return [];
    return event.markets.map((m) => m.ticker).filter(Boolean);
  }, [event?.markets]);

  // WebSocket connection for prices
  useEffect(() => {
    if (marketTickers.length === 0) return;

    const ws = new WebSocket(WEBSOCKET_URL);

    ws.onopen = () => {
      // Subscribe to prices channel
      ws.send(
        JSON.stringify({
          type: "subscribe",
          channel: "prices",
          tickers: marketTickers,
        })
      );
    };

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);

      if (message.channel === "prices") {
        // Calculate mid-price from bid and ask
        const calculateMidPrice = (bid, ask) => {
          if (!bid && !ask) return null;
          if (!bid) return parseFloat(ask);
          if (!ask) return parseFloat(bid);
          return (parseFloat(bid) + parseFloat(ask)) / 2;
        };

        const midPrice = calculateMidPrice(message.yes_bid, message.yes_ask);

        if (midPrice !== null) {
          setRealtimePrices((prev) => ({
            ...prev,
            [message.market_ticker]: midPrice,
          }));
        }
      }
    };

    ws.onerror = (error) => {
      console.error("GameCard WebSocket error:", error);
    };

    ws.onclose = (event) => {
      console.log("GameCard WebSocket connection closed:", event.code);
    };

    pricesWsRef.current = ws;

    // Cleanup function
    return () => {
      if (pricesWsRef.current) {
        const wsToClose = pricesWsRef.current;

        // Remove event handlers to prevent memory leaks
        wsToClose.onopen = null;
        wsToClose.onmessage = null;
        wsToClose.onerror = null;
        wsToClose.onclose = null;

        // Unsubscribe before closing if connection is open
        if (wsToClose.readyState === WebSocket.OPEN) {
          try {
            wsToClose.send(
              JSON.stringify({
                type: "unsubscribe",
                channel: "prices",
                tickers: marketTickers,
              })
            );
          } catch (error) {
            console.error("Error unsubscribing from prices:", error);
          }
        }

        // Close the connection
        if (
          wsToClose.readyState === WebSocket.OPEN ||
          wsToClose.readyState === WebSocket.CONNECTING
        ) {
          wsToClose.close();
        }

        pricesWsRef.current = null;
      }
    };
  }, [marketTickers.join(",")]);

  // Countdown timer for market open time
  useEffect(() => {
    // Use event.openTime
    const openTime = event?.openTime;

    if (!openTime) return;

    const formatCountdown = (timeValue) => {
      if (!timeValue) return null;

      try {
        // Use unixTimeConverter to convert to Date
        const gameDate = unixTimeConverter.toDate(timeValue);
        if (!gameDate) return null;

        const now = new Date();
        const diff = gameDate - now;

        if (diff <= 0) {
          return "Market Open";
        }

        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor(
          (diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
        );
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        if (days > 0) {
          return `Opens in ${days}d ${hours}h ${minutes}m`;
        } else if (hours > 0) {
          return `Opens in ${hours}h ${minutes}m ${seconds}s`;
        } else if (minutes > 0) {
          return `Opens in ${minutes}m ${seconds}s`;
        } else {
          return `Opens in ${seconds}s`;
        }
      } catch (error) {
        return null;
      }
    };

    const updateCountdown = () => {
      const formatted = formatCountdown(openTime);
      setCountdown(formatted);
    };

    // Update immediately
    updateCountdown();

    // Update every second
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [event?.openTime]);

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

    // Use real-time price if available, otherwise fallback to yesBid
    const homePrice =
      homeMarket?.ticker && realtimePrices[homeMarket.ticker]
        ? realtimePrices[homeMarket.ticker] * 100
        : homeMarket
        ? parseFloat(homeMarket.yesBid) * 100
        : 0;
    const awayPrice =
      awayMarket?.ticker && realtimePrices[awayMarket.ticker]
        ? realtimePrices[awayMarket.ticker] * 100
        : awayMarket
        ? parseFloat(awayMarket.yesBid) * 100
        : 0;
    const tiePrice = tieMarket ? parseFloat(tieMarket.yesBid) * 100 : 0;

    // Store original percentages for display
    displayYesPercentage = Math.round(homePrice);
    displayNoPercentage = Math.round(awayPrice);
    displayTiePercentage = Math.round(tiePrice);

    yesPercentage = displayYesPercentage;
    noPercentage = displayNoPercentage;
    tiePercentage = displayTiePercentage;
  } else if (event.markets && event.markets.length >= 2) {
    // NFL/NBA format: 2 markets (one per team)
    const firstMarket = event.markets[0];
    const secondMarket = event.markets[1];

    // Use real-time price if available, otherwise fallback to yesBid
    const firstTeamPrice =
      firstMarket?.ticker && realtimePrices[firstMarket.ticker]
        ? realtimePrices[firstMarket.ticker] * 100
        : parseFloat(firstMarket.yesBid) * 100;
    const secondTeamPrice =
      secondMarket?.ticker && realtimePrices[secondMarket.ticker]
        ? realtimePrices[secondMarket.ticker] * 100
        : parseFloat(secondMarket.yesBid) * 100;

    displayYesPercentage = Math.round(firstTeamPrice);
    displayNoPercentage = Math.round(secondTeamPrice);
    yesPercentage = displayYesPercentage;
    noPercentage = displayNoPercentage;
    tiePercentage = null;
    displayTiePercentage = null;
  } else {
    // Single market format (fallback)
    const marketPrice =
      market?.ticker && realtimePrices[market.ticker]
        ? realtimePrices[market.ticker] * 100
        : parseFloat(market.yesBid) * 100;
    displayYesPercentage = Math.round(marketPrice);
    displayNoPercentage = 100 - displayYesPercentage;
    yesPercentage = displayYesPercentage;
    noPercentage = displayNoPercentage;
    tiePercentage = null;
    displayTiePercentage = null;
  }

  // Filter out if any percentage is NaN
  if (
    Number.isNaN(displayYesPercentage) ||
    Number.isNaN(displayNoPercentage) ||
    (displayTiePercentage !== null && Number.isNaN(displayTiePercentage))
  ) {
    return null;
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

  // Determine which team gets which position and color
  // Left team: awayTeam (3 markets) or noTeam (2 markets)
  // Right team: homeTeam (3 markets) or yesTeam (2 markets)
  const leftTeam = hasThreeMarkets ? awayTeam : noTeam;
  const rightTeam = hasThreeMarkets ? homeTeam : yesTeam;
  const leftPercentage = hasThreeMarkets
    ? displayNoPercentage
    : displayNoPercentage;
  const rightPercentage = hasThreeMarkets
    ? displayYesPercentage
    : displayYesPercentage;

  // Get colors for left and right teams
  const leftTeamColor = hasThreeMarkets
    ? teamColors.awayColor || "#FF9500"
    : teamColors.noColor || "#FF9500";
  const rightTeamColor = hasThreeMarkets
    ? teamColors.homeColor || "#FF3B30"
    : teamColors.yesColor || "#FF3B30";

  return (
    <TouchableOpacity
      onPress={() => {
        navigation.navigate("Chart", { event });
      }}
      activeOpacity={0.9}
    >
      <View style={styles.card}>
 
        {/* Competition label - top left (event data or current tab as fallback) */}
        {(event?.competition || event?.league || competitionFallback) && (
          <Text style={styles.competitionLabel} numberOfLines={1}>
            {event?.competition || event?.league || competitionFallback}
          </Text>
        )}
        {/* Market Options */}
        <View style={styles.optionsContainer}>
          {/* Left Option */}
          <View style={styles.optionLeft}>
            <Text style={styles.optionTeamName}>{leftTeam}</Text>
          </View>

          {/* Right Option */}
          <View style={styles.optionRight}>
            <Text style={styles.optionTeamName}>{rightTeam}</Text>
          </View>
        </View>
        {/* Progress Bar */}
        <View style={styles.progressBarContainer}>
          <View style={styles.progressBarBackground}>
            <View
              style={[
                styles.progressBarSegment,
                styles.progressBarLeft,
                { width: `${leftPercentage}%`, backgroundColor: leftTeamColor },
              ]}
            />
            <View style={styles.progressBarGap} />
            <View
              style={[
                styles.progressBarSegment,
                styles.progressBarRight,
                {
                  width: `${rightPercentage}%`,
                  backgroundColor: rightTeamColor,
                },
              ]}
            />
          </View>
        </View>
        {/* Price Buttons */}
        <View style={styles.pricesContainer}>
          {/* Left Price Button */}
          <TouchableOpacity
            style={styles.priceButton}
            onPress={() => {
              navigation.navigate("Chart", { event });
            }}
          >
            <Text style={styles.priceText}>{leftPercentage}¢</Text>
          </TouchableOpacity>

          {/* Right Price Button */}
          <TouchableOpacity
            style={styles.priceButton}
            onPress={() => {
              navigation.navigate("Chart", { event });
            }}
          >
            <Text style={styles.priceText}>{rightPercentage}¢</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const createStyles = (theme) =>
  StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 20,
    marginVertical: 8,
    backgroundColor: theme.cardBackground,
    borderWidth: 1,
    borderColor: theme.cardBorder,
    
  },
  eventInfo: {
    marginBottom: 16,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: theme.primaryText,
    marginBottom: 8,
    lineHeight: 22,
  },
  eventVolume: {
    fontSize: 14,
    fontWeight: "500",
    color: theme.secondaryText,
    marginBottom: 4,
  },
  countdownText: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.accentText,
    marginTop: 4,
  },
  marketTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: theme.primaryText,
    textAlign: "center",
    marginBottom: 20,
    lineHeight: 22,
  },
  competitionLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: theme.subtleText,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 8,
    bottom: 15,
    marginTop: 10
  },
  optionsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  optionLeft: {
    alignItems: "flex-start",
  },
  optionRight: {
    alignItems: "flex-end",
  },
  optionTeamName: {
    fontSize: 16,
    fontWeight: "600",
    color: theme.primaryText,
    marginBottom: 4,
  },
  optionPercentage: {
    fontSize: 16,
    fontWeight: "600",
  },
  progressBarContainer: {
    marginBottom: 28,
  },
  pricesContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 0,
  },
  priceButton: {
    backgroundColor: theme.buttonBackground,
    borderWidth: 1,
    borderColor: theme.buttonBorder,
    borderRadius: 24,
    paddingVertical: 12,
    paddingHorizontal: 32,
    minWidth: 100,
    alignItems: "center",
    justifyContent: "center",
  },
  priceText: {
    fontSize: 15,
    fontWeight: "500",
    color: theme.primaryText,
  },
  progressBarBackground: {
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.progressTrack,
    flexDirection: "row",
    overflow: "hidden",
  },
  progressBarSegment: {
    height: "100%",
  },
  progressBarGap: {
    width: 2,
    height: "100%",
  },
  progressBarLeft: {
    borderTopLeftRadius: 4,
    borderBottomLeftRadius: 4,
  },
  progressBarRight: {
    borderTopRightRadius: 4,
    borderBottomRightRadius: 4,
  },
  tradeButton: {
    backgroundColor: theme.tradeButtonBackground,
    borderRadius: 24,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  tradeButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: theme.tradeButtonText,
  },
});
