import React, { useMemo } from "react";
import { StyleSheet, Text, TouchableOpacity, View, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Spacing, Typography } from "../../constants/theme";
import { formatPrice, formatCurrency } from "../../utils/formatters";
import { getTeamColor } from "../../utils/teamColors";

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
 * Format date as "Nov 20 @ 7:00 PM"
 */
function formatGameDateTime(dateString) {
  if (!dateString) return "TBD";

  const normalizedDate = normalizeDateString(dateString);
  const date = new Date(normalizedDate);

  if (Number.isNaN(date.getTime())) return "TBD";

  const month = date.toLocaleDateString(undefined, { month: "short" });
  const day = date.getDate();
  const time = date.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  return `${month} ${day} @ ${time}`;
}

/**
 * Extract team names from title or question
 */
function parseTeams(title) {
  if (!title || typeof title !== "string") {
    return { team1: "Team 1", team2: "Team 2" };
  }

  // Try to extract from "vs" format
  const vsMatch = title.match(/(.+?)\s+vs\s+(.+)/i);
  if (vsMatch) {
    return {
      team1: vsMatch[1].trim(),
      team2: vsMatch[2].trim(),
    };
  }

  return { team1: "Team 1", team2: "Team 2" };
}

/**
 * Get first letter of team name for circular badge
 */
function getTeamInitial(teamName) {
  if (!teamName || typeof teamName !== "string") return "T";
  // Get first letter, handling multi-word team names
  const words = teamName.trim().split(/\s+/);
  if (words.length > 1) {
    // For names like "Kansas City Chiefs", use first letter of each word
    return words
      .map((w) => w[0]?.toUpperCase() || "")
      .join("")
      .slice(0, 2);
  }
  return teamName[0]?.toUpperCase() || "T";
}


/**
 * Transform market data to display format
 */
function transformMarketData(market) {
  let team1 = "Team 1";
  let team2 = "Team 2";
  let team1Color = "#9333EA"; // Default purple
  let team2Color = "#06B6D4"; // Default teal
  let team1Price = 0.5;
  let team2Price = 0.5;
  let team1Abbreviation = null;
  let team2Abbreviation = null;

  // Extract teams from teams array (preferred)
  if (
    market?.teams &&
    Array.isArray(market.teams) &&
    market.teams.length >= 2
  ) {
    const team1Data = market.teams[0];
    const team2Data = market.teams[1];
    team1 = team1Data.name || team1Data.short || "Team 1";
    team2 = team2Data.name || team2Data.short || "Team 2";
    team1Abbreviation = team1Data.abbreviation || null;
    team2Abbreviation = team2Data.abbreviation || null;

    // Get team colors based on abbreviation or name
    team1Color = getTeamColor(team1Abbreviation, team1);
    team2Color = getTeamColor(team2Abbreviation, team2);
  }
  // Fallback: parse teams from question/title
  else if (market?.question || market?.title) {
    const title = market.question || market.title || "";
    if (title.includes(" vs ") || title.includes(" VS ")) {
      const teams = title.split(/ vs /i);
      if (teams.length === 2) {
        team1 = teams[0].trim();
        team2 = teams[1].trim();

        // Try to extract abbreviations from team names
        team1Color = getTeamColor(null, team1);
        team2Color = getTeamColor(null, team2);
      }
    }
  }

  // Extract prices from outcomePrices (JSON string)
  try {
    if (market?.outcomePrices) {
      const pricesStr =
        typeof market.outcomePrices === "string"
          ? market.outcomePrices
          : JSON.stringify(market.outcomePrices);
      const prices = JSON.parse(pricesStr);

      if (Array.isArray(prices) && prices.length >= 2) {
        team1Price = parseFloat(prices[0]) || 0.5;
        team2Price = parseFloat(prices[1]) || 0.5;
      }
    }
  } catch (e) {
    console.warn("Failed to parse outcomePrices:", e);
  }

  // Fallback: try to get prices from prices object
  if (team1Price === 0.5 && team2Price === 0.5 && market?.prices) {
    const priceValues = Object.values(market.prices);
    if (priceValues.length >= 2) {
      const price1 = parseFloat(priceValues[0]?.SELL || priceValues[0]) || 0.5;
      const price2 = parseFloat(priceValues[1]?.SELL || priceValues[1]) || 0.5;
      // Use the higher price as team1 (usually the favorite)
      if (price1 >= price2) {
        team1Price = price1;
        team2Price = price2;
      } else {
        team1Price = price2;
        team2Price = price1;
      }
    }
  }

  // Use outcomes array to match team names if available
  try {
    if (market?.outcomes) {
      const outcomesStr =
        typeof market.outcomes === "string"
          ? market.outcomes
          : JSON.stringify(market.outcomes);
      const outcomes = JSON.parse(outcomesStr);

      if (Array.isArray(outcomes) && outcomes.length >= 2) {
        // Match outcomes to team names
        const outcome1 = outcomes[0] || "";
        const outcome2 = outcomes[1] || "";

        // If team names match outcomes, use outcomes as team names
        if (
          team1 === "Team 1" ||
          outcome1.toLowerCase().includes(team1.toLowerCase().split(" ")[0])
        ) {
          team1 = outcome1;
        }
        if (
          team2 === "Team 2" ||
          outcome2.toLowerCase().includes(team2.toLowerCase().split(" ")[0])
        ) {
          team2 = outcome2;
        }
      }
    }
  } catch (e) {
    console.warn("Failed to parse outcomes:", e);
  }

  // Normalize prices to ensure they sum to 1.0
  const totalPrice = team1Price + team2Price;
  if (totalPrice > 0 && totalPrice !== 1.0) {
    team1Price = team1Price / totalPrice;
    team2Price = team2Price / totalPrice;
  }

  // If we don't have team colors yet, try to get them from team names
  if (team1Color === "#9333EA" && team1 !== "Team 1") {
    team1Color = getTeamColor(team1Abbreviation, team1);
  }
  if (team2Color === "#06B6D4" && team2 !== "Team 2") {
    team2Color = getTeamColor(team2Abbreviation, team2);
  }

  return {
    team1,
    team2,
    team1Color,
    team2Color,
    team1Price,
    team2Price,
    team1Abbreviation,
    team2Abbreviation,
  };
}

export default function GameCard({ market, onPress }) {
  if (!market) {
    return (
      <View style={styles.card}>
        <Text style={styles.errorText}>No market data</Text>
      </View>
    );
  }

  // Transform market data
  const marketData = useMemo(() => transformMarketData(market), [market]);

  // Extract basic fields - prioritize game start time
  const title = market?.title || market?.question || "";
  const date =
    market?.gameStartTime ||
    market?.date ||
    market?.eventDate ||
    market?.startTime ||
    market?.startDate ||
    null;
  const volume =
    market?.volume24hr ||
    market?.volume?.day ||
    market?.volumeNum ||
    market?.volume ||
    0;

  // Format values
  const formattedDate = formatGameDateTime(date);
  const formattedVolume = volume > 0 ? formatCurrency(volume) : "$0";
  const team1PriceFormatted = formatPrice(marketData.team1Price);
  const team2PriceFormatted = formatPrice(marketData.team2Price);
  const team1Percent = Math.round(marketData.team1Price * 100);
  const team2Percent = Math.round(marketData.team2Price * 100);

  // Colors for each team (from transformMarketData)
  const team1Color = marketData.team1Color || "#9333EA"; // Default purple
  const team2Color = marketData.team2Color || "#06B6D4"; // Default teal

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.7}
      onPress={() => onPress?.(market)}
    >
      {/* Date Row */}
      {/* <View style={styles.dateRow}>
        <Ionicons
          name="calendar-outline"
          size={14}
          color={Colors.textTertiary}
        />
        <Text style={styles.dateText}>{formattedDate}</Text>
      </View> */}

      {/* Teams Row with Icons */}
      <View style={styles.teamsRow}>
        {/* Team 1 */}
        <View style={styles.teamContainer}>
          <View
            style={[styles.teamIconCircle, { backgroundColor: team1Color }]}
          >
            <Text style={styles.teamIconText}>
              {(
                marketData.team1Abbreviation || getTeamInitial(marketData.team1)
              ).toUpperCase()}
            </Text>
          </View>
          <Text style={styles.teamName}>{marketData.team1}</Text>
        </View>

        {/* VS Text */}
        <Text style={styles.vsText}>VS</Text>

        {/* Team 2 */}
        <View style={styles.teamContainer}>
          <View
            style={[styles.teamIconCircle, { backgroundColor: team2Color }]}
          >
            <Text style={styles.teamIconText}>
              {(
                marketData.team2Abbreviation || getTeamInitial(marketData.team2)
              ).toUpperCase()}
            </Text>
          </View>
          <Text style={styles.teamName}>{marketData.team2}</Text>
        </View>
      </View>

      {/* Percentage Bar */}
      <View style={styles.percentageBarContainer}>
        <View style={styles.percentageBar}>
          <View
            style={[
              styles.percentageBarSegment,
              {
                width: `${team1Percent}%`,
                backgroundColor: team1Color,
              },
            ]}
          >
            {team1Percent >= 15 && (
              <Text style={styles.percentageText}>{team1Percent}%</Text>
            )}
          </View>
          <View
            style={[
              styles.percentageBarSegment,
              {
                width: `${team2Percent}%`,
                backgroundColor: team2Color,
              },
            ]}
          >
            {team2Percent >= 15 && (
              <Text style={styles.percentageText}>{team2Percent}%</Text>
            )}
          </View>
        </View>
        {/* Volume indicators below bar */}
        <View style={styles.volumeRow}>
          <Text style={[styles.volumeText, { color: team1Color }]}>
            {formattedVolume !== "$0"
              ? `$${Math.round((volume * marketData.team1Price) / 1000)}K`
              : "$-"}
          </Text>
          <Text style={styles.totalVolumeText}>
            {formattedVolume !== "$0" ? formattedVolume : "$-"}
          </Text>
          <Text style={[styles.volumeText, { color: team2Color }]}>
            {formattedVolume !== "$0"
              ? `$${Math.round((volume * marketData.team2Price) / 1000)}K`
              : "$-"}
          </Text>
        </View>
      </View>

      {/* Price Boxes */}
      <View style={styles.priceBoxesRow}>
        {/* Team 1 Price Box */}
        <TouchableOpacity
          style={styles.priceBox}
          activeOpacity={0.8}
          onPress={() => onPress?.({ ...market, selectedSide: "yes" })}
        >
          <Text style={styles.priceBoxTeam}>{marketData.team1}</Text>
          <Text style={[styles.priceBoxPrice, { color: team1Color }]}>
            {team1PriceFormatted}
          </Text>
        </TouchableOpacity>

        {/* Team 2 Price Box */}
        <TouchableOpacity
          style={styles.priceBox}
          activeOpacity={0.8}
          onPress={() => onPress?.({ ...market, selectedSide: "no" })}
        >
          <Text style={styles.priceBoxTeam}>{marketData.team2}</Text>
          <Text style={[styles.priceBoxPrice, { color: team2Color }]}>
            {team2PriceFormatted}
          </Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    marginHorizontal: Spacing.md,
    shadowColor: "rgba(0, 0, 0, 0.08)",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.05)",
  },
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  dateText: {
    fontSize: 13,
    fontWeight: "400",
    color: Colors.textSecondary,
    marginLeft: Spacing.xs,
  },
  teamsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.sm,
  },
  teamContainer: {
    alignItems: "center",
    flex: 1,
  },
  vsText: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.textMuted,
    marginHorizontal: Spacing.md,
    alignSelf: "center",
  },
  teamIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.xs,
  },
  teamIconImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  teamIconText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  teamName: {
    fontSize: 13,
    fontWeight: "500",
    color: Colors.textPrimary,
    textAlign: "center",
  },
  percentageBarContainer: {
    marginBottom: Spacing.md,
  },
  percentageBar: {
    height: 32,
    borderRadius: 16,
    overflow: "hidden",
    flexDirection: "row",
    backgroundColor: "#E5E5E5",
    marginBottom: Spacing.xs,
  },
  percentageBarSegment: {
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
    minWidth: 40,
  },
  percentageText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },
  volumeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.xs,
  },
  volumeText: {
    fontSize: 12,
    fontWeight: "600",
  },
  totalVolumeText: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.textSecondary,
  },
  priceBoxesRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  priceBox: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    padding: Spacing.md,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: Spacing.xs,
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.05)",
    shadowColor: "rgba(0, 0, 0, 0.05)",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 2,
    elevation: 1,
  },
  priceBoxTeam: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
    textAlign: "center",
  },
  priceBoxPrice: {
    fontSize: 20,
    fontWeight: "700",
  },
  errorText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
});
