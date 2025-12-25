import { StyleSheet, Text, View, TouchableOpacity, Image } from "react-native";
import React, { useState, useEffect } from "react";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  cancelAnimation,
  Easing,
} from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import {
  Colors,
  Spacing,
  Typography,
  Shadows,
  BorderRadius,
} from "../../constants/theme";
import { formatCurrency, formatSharePrice } from "../../utils/formatters";

/**
 * Normalize date string to ISO format
 */
function normalizeDateString(dateString) {
  if (!dateString) return null;

  // Handle format like "2025-11-23 18:00:00+00" by converting to ISO
  if (
    typeof dateString === "string" &&
    dateString.includes(" ") &&
    dateString.includes("+")
  ) {
    // Replace space with T and ensure Z or timezone is handled
    const normalized = dateString.replace(" ", "T");
    // If it ends with +00 or similar, replace with Z for UTC
    if (normalized.match(/\+00(:00)?$/)) {
      return normalized.replace(/\+00(:00)?$/, "Z");
    }
    return normalized;
  }

  return dateString;
}

/**
 * Format game time as "Nov 20 @ 7:00 PM" in EST timezone
 */
function formatGameTime(dateString) {
  if (!dateString) return "TBD";

  const normalizedDate = normalizeDateString(dateString);
  const date = new Date(normalizedDate);

  if (Number.isNaN(date.getTime())) return "TBD";

  // Use EST timezone (America/New_York handles both EST and EDT)
  const estOptions = {
    timeZone: "America/New_York",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  };

  // Format date and time in EST
  const dateTimeString = date.toLocaleString("en-US", estOptions);

  // Parse the formatted string to extract month, day, and time
  // Format: "Nov 20, 2024, 7:00 PM" -> "Nov 20 @ 7:00 PM"
  const parts = dateTimeString.split(", ");
  if (parts.length >= 3) {
    const monthDay = parts[0]; // "Nov 20"
    const time = parts[2]; // "7:00 PM"
    return `${monthDay} @ ${time}`;
  }

  // Fallback: use separate formatting
  const monthName = date.toLocaleDateString("en-US", {
    month: "short",
    timeZone: "America/New_York",
  });
  const day = date.toLocaleDateString("en-US", {
    day: "numeric",
    timeZone: "America/New_York",
  });
  const time = date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "America/New_York",
  });

  return `${monthName} ${day} @ ${time}`;
}

export default function MarketCard({ market, onPress }) {
  const [isLive, setIsLive] = useState(false);
  const liveDotOpacity = useSharedValue(1);

  // Check if market is live
  useEffect(() => {
    if (!market) {
      setIsLive(false);
      return;
    }

    const dateString =
      market.gameTime?.timeString ||
      market.gameTime ||
      market.gameStartTime ||
      market.date ||
      market.eventDate ||
      market.startTime ||
      market.startDate;

    if (!dateString) {
      setIsLive(false);
      return;
    }

    // Normalize date string
    let normalizedDate = dateString;
    if (
      typeof dateString === "string" &&
      dateString.includes(" ") &&
      dateString.includes("+")
    ) {
      normalizedDate = dateString.replace(" ", "T");
      if (normalizedDate.match(/\+00(:00)?$/)) {
        normalizedDate = normalizedDate.replace(/\+00(:00)?$/, "Z");
      }
    }

    const gameDate = new Date(normalizedDate);
    if (Number.isNaN(gameDate.getTime())) {
      setIsLive(false);
      return;
    }

    const checkLive = () => {
      const now = new Date();
      setIsLive(now >= gameDate);
    };

    // Check immediately
    checkLive();

    // Update every second
    const interval = setInterval(checkLive, 1000);

    return () => clearInterval(interval);
  }, [market]);

  // Flash animation for live dot
  useEffect(() => {
    if (isLive) {
      // Cancel any existing animation first
      cancelAnimation(liveDotOpacity);
      // Start the flashing animation
      liveDotOpacity.value = withRepeat(
        withTiming(0.3, {
          duration: 800,
          easing: Easing.inOut(Easing.ease),
        }),
        -1, // Repeat infinitely
        true // Reverse the animation (ping-pong effect)
      );
    } else {
      // Cancel animation and reset to full opacity
      cancelAnimation(liveDotOpacity);
      liveDotOpacity.value = 1;
    }
  }, [isLive]);

  // Animated style for live dot
  const liveDotAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: liveDotOpacity.value,
    };
  });

  if (!market) {
    return (
      <View style={styles.card}>
        <Text style={styles.errorText}>No market data</Text>
      </View>
    );
  }

  // Format game time - check for gameTime object first, then gameTime string
  const gameTimeString = market?.gameTime?.timeString
    ? market.gameTime.timeString
    : market?.gameTime
    ? formatGameTime(market.gameTime)
    : "TBD";

  // Extract market data
  const title = market?.title || market?.question || market?.slug || "Market";
  const volume =
    market?.volume24hr ||
    market?.volume?.day ||
    market?.volumeNum ||
    market?.volume ||
    0;
  const formattedVolume = volume > 0 ? formatCurrency(volume) : "$0";

  // Extract team data - prioritize teams array from API
  let awayTeamData = null;
  let homeTeamData = null;
  let awayName = "Away";
  let homeName = "Home";
  let awayAbbreviation = null;
  let homeAbbreviation = null;
  let awayColor = null;
  let homeColor = null;

  // First, try to get from teams array (new API format)
  if (
    market?.teams &&
    Array.isArray(market.teams) &&
    market.teams.length >= 2
  ) {
    awayTeamData = market.teams[0];
    homeTeamData = market.teams[1];
    // Prefer alias over name (alias is shorter, e.g., "Patriots" vs "New England Patriots")
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

      // Try to extract abbreviations from slug (e.g., "nba-gsw-por" -> gsw, por)
      if (market?.slug) {
        const slugParts = market.slug.split("-");
        if (slugParts.length >= 3) {
          awayAbbreviation = slugParts[1]?.toUpperCase() || null;
          homeAbbreviation = slugParts[2]?.toUpperCase() || null;
        }
      }

      // Generate abbreviations if still missing
      if (!awayAbbreviation) {
        const awayWords = awayName.split(/\s+/);
        awayAbbreviation =
          awayWords.length > 1
            ? awayWords
                .map((w) => w[0])
                .join("")
                .toUpperCase()
                .slice(0, 3)
            : awayName.substring(0, 3).toUpperCase();
      }
      if (!homeAbbreviation) {
        const homeWords = homeName.split(/\s+/);
        homeAbbreviation =
          homeWords.length > 1
            ? homeWords
                .map((w) => w[0])
                .join("")
                .toUpperCase()
                .slice(0, 3)
            : homeName.substring(0, 3).toUpperCase();
      }
    }
  }

  // Fallback abbreviations if still missing
  awayAbbreviation = awayAbbreviation || awayName.substring(0, 3).toUpperCase();
  homeAbbreviation = homeAbbreviation || homeName.substring(0, 3).toUpperCase();

  // Extract prices from prices array or team objects
  let awayPrice = 0.5;
  let homePrice = 0.5;

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
    // Fallback: match by tokenId if teamTokenIds available
    else if (
      market?.teamTokenIds &&
      Array.isArray(market.teamTokenIds) &&
      market.teamTokenIds.length >= 2
    ) {
      const awayTokenId = market.teamTokenIds[0]?.toString();
      const homeTokenId = market.teamTokenIds[1]?.toString();

      for (const priceObj of market.prices) {
        const priceTokenId = priceObj?.tokenId?.toString();
        const rawPrice =
          parseFloat(priceObj?.sellPrice ?? priceObj?.price) || 0.5;
        const price = Math.round(rawPrice * 100) / 100;

        if (priceTokenId === awayTokenId) {
          awayPrice = price;
        } else if (priceTokenId === homeTokenId) {
          homePrice = price;
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
    // Round to 2 decimal places
    awayPrice = Math.round(rawAwayPrice * 100) / 100;
    homePrice = Math.round(rawHomePrice * 100) / 100;
  }

  // Normalize prices to ensure they sum to 1.0 (fixes off-by-one cent issues)
  const totalPrice = awayPrice + homePrice;
  if (totalPrice > 0 && Math.abs(totalPrice - 1.0) > 0.001) {
    awayPrice = awayPrice / totalPrice;
    homePrice = homePrice / totalPrice;
    // Round to 2 decimal places after normalization
    awayPrice = Math.round(awayPrice * 100) / 100;
    homePrice = Math.round(homePrice * 100) / 100;
    // Adjust to ensure exact sum to 1.0
    const normalizedSum = awayPrice + homePrice;
    if (normalizedSum !== 1.0) {
      const diff = 1.0 - normalizedSum;
      homePrice = Math.round((homePrice + diff) * 100) / 100;
    }
  }

  // Get team colors - use from API if available, otherwise use default colors
  const finalAwayColor = awayColor || Colors.primary;
  const finalHomeColor = homeColor || Colors.accentTeal;

  const handleAwayPress = () => {
    // Navigate to market detail or handle away team action
    onPress?.(market);
  };

  const handleHomePress = () => {
    // Navigate to market detail or handle home team action
    onPress?.(market);
  };

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.7}
      onPress={() => onPress?.(market)}
    >
      {/* Date/Time Header */}
      <View style={styles.dateRow}>
        <View style={styles.dateRowLeft}>
          <Ionicons name="time-outline" size={14} color={Colors.textTertiary} />
          <Text style={styles.dateText}>{gameTimeString}</Text>
        </View>
        {isLive && (
          <View style={styles.livePill}>
            <Animated.View style={[styles.liveDot, liveDotAnimatedStyle]} />
            <Text style={styles.liveText}>LIVE</Text>
          </View>
        )}
      </View>

      {/* Teams Section */}
      <View style={styles.teamsContainer}>
        {/* Away Team */}
        <View style={styles.teamRow}>
          {awayTeamData?.logo && (
            <Image
              source={{ uri: awayTeamData.logo }}
              style={styles.teamLogo}
            />
          )}
          <View style={styles.teamInfo}>
            <Text style={styles.teamName}>{awayName}</Text>
            {awayTeamData?.record && (
              <Text style={styles.teamRecord}>{awayTeamData.record}</Text>
            )}
          </View>
          <View
            style={[
              styles.priceBadge,
              { borderLeftWidth: 3, borderLeftColor: finalAwayColor },
            ]}
          >
            <Text style={styles.priceText}>{formatSharePrice(awayPrice)}</Text>
          </View>
        </View>

        {/* Home Team */}
        <View style={styles.teamRow}>
          {homeTeamData?.logo && (
            <Image
              source={{ uri: homeTeamData.logo }}
              style={styles.teamLogo}
            />
          )}
          <View style={styles.teamInfo}>
            <Text style={styles.teamName}>{homeName}</Text>
            {homeTeamData?.record && (
              <Text style={styles.teamRecord}>{homeTeamData.record}</Text>
            )}
          </View>
          <View
            style={[
              styles.priceBadge,
              { borderLeftWidth: 3, borderLeftColor: finalHomeColor },
            ]}
          >
            <Text style={styles.priceText}>{formatSharePrice(homePrice)}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "transparent",
    borderRadius: 16,
    marginBottom: Spacing.md,
    marginHorizontal: Spacing.md,
    shadowColor: Shadows.cardShadow.shadowColor,
    shadowOffset: Shadows.cardShadow.shadowOffset,
    shadowOpacity: Shadows.cardShadow.shadowOpacity,
    shadowRadius: Shadows.cardShadow.shadowRadius,
    elevation: Shadows.cardShadow.elevation,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: "hidden",
    position: "relative",
  },
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
    zIndex: 1,
  },
  dateRowLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  dateText: {
    fontSize: 13,
    fontWeight: "500",
    color: Colors.textSecondary,
    marginLeft: Spacing.xs,
  },
  livePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    right: 10,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.danger,
  },
  liveText: {
    fontSize: 11,
    fontWeight: "700",
    color: Colors.danger,
    letterSpacing: 0.8,
  },
  teamsContainer: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
    zIndex: 1,
  },
  teamRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.sm,
    gap: Spacing.md,
  },
  teamLogo: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.background,
  },
  teamInfo: {
    flex: 1,
  },
  teamName: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  teamRecord: {
    fontSize: 11,
    fontWeight: "500",
    color: Colors.textTertiary,
  },
  priceBadge: {
    backgroundColor: "transparent",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.border,
    minWidth: 90,
    alignItems: "center",
    shadowColor: "rgba(0, 0, 0, 0.3)",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 2,
  },
  priceText: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.textPrimary,
    letterSpacing: 0.3,
  },
  errorText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: "center",
  },
});
