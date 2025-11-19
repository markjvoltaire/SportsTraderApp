import React, { useMemo } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Spacing, Typography } from "../../constants/theme";
import { getFriendlyOutcomeLabels } from "../../utils/marketUtils";
import { formatPrice, formatCurrency } from "../../utils/formatters";

// Sports prediction market colors
const TEAM_COLORS = {
  team1: "#8B5CF6", // Vibrant purple/blue
  team2: "#06B6D4", // Teal/cyan
};

/**
 * Parse team names from question
 * Handles formats like "Will Bills win?", "Bills vs Texans", etc.
 */
function parseTeams(question) {
  if (!question || typeof question !== "string") {
    return { team1: "Team 1", team2: "Team 2" };
  }

  // Try to extract from "vs" format
  const vsMatch = question.match(/(\w+)\s+vs\s+(\w+)/i);
  if (vsMatch) return { team1: vsMatch[1], team2: vsMatch[2] };

  // Try to extract from "Will [Team] win?" format
  const willMatch = question.match(/Will\s+(\w+)\s+win/i);
  if (willMatch) {
    const team2Match = question.match(/(?:vs|against|@)\s+(\w+)/i);
    return {
      team1: willMatch[1],
      team2: team2Match ? team2Match[1] : "Opponent",
    };
  }

  return { team1: "Team 1", team2: "Team 2" };
}

/**
 * Parse date from description string
 * Example: "In the upcoming NFL game, scheduled for November 23 at 1:00PM ET:"
 */
function parseDateFromDescription(description) {
  if (!description || typeof description !== "string") return null;

  // Match patterns like "November 23 at 1:00PM ET" or "Nov 23 at 1:00PM ET"
  const patterns = [
    // Full month name: "November 23 at 1:00PM ET"
    /(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d+)\s+at\s+(\d+):(\d+)(AM|PM)\s+(ET|EST|PT|PST|CT|CST)/i,
    // Short month name: "Nov 23 at 1:00PM ET"
    /(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d+)\s+at\s+(\d+):(\d+)(AM|PM)\s+(ET|EST|PT|PST|CT|CST)/i,
  ];

  for (const pattern of patterns) {
    const match = description.match(pattern);
    if (match) {
      const monthName = match[1];
      const day = parseInt(match[2], 10);
      let hour = parseInt(match[3], 10);
      const minute = parseInt(match[4], 10);
      const ampm = match[5].toUpperCase();
      const timezone = match[6].toUpperCase();

      // Convert to 24-hour format
      if (ampm === "PM" && hour !== 12) hour += 12;
      if (ampm === "AM" && hour === 12) hour = 0;

      // Map month names to numbers
      const monthMap = {
        january: 0,
        jan: 0,
        february: 1,
        feb: 1,
        march: 2,
        mar: 2,
        april: 3,
        apr: 3,
        may: 4,
        june: 5,
        jun: 5,
        july: 6,
        jul: 6,
        august: 7,
        aug: 7,
        september: 8,
        sep: 8,
        october: 9,
        oct: 9,
        november: 10,
        nov: 10,
        december: 11,
        dec: 11,
      };

      const month = monthMap[monthName.toLowerCase()];
      if (month === undefined) continue;

      // Get current year
      const currentYear = new Date().getFullYear();
      const date = new Date(currentYear, month, day, hour, minute);

      // Adjust for timezone (ET is UTC-5, EST is UTC-5, PT is UTC-8, etc.)
      // For simplicity, we'll use the date as-is and format with timezone
      return { date, timezone };
    }
  }

  return null;
}

/**
 * Format game date for display
 */
function formatGameDateTime(dateString, description) {
  // Try to parse from description first
  if (description) {
    const parsed = parseDateFromDescription(description);
    if (parsed) {
      const { date, timezone } = parsed;
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);

      const gameDate = new Date(date);
      gameDate.setHours(0, 0, 0, 0);

      if (gameDate.getTime() === tomorrow.getTime()) {
        // Format as "Tomorrow, 1:00PM ET"
        const timeStr = date.toLocaleTimeString([], {
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        });
        return `Tomorrow, ${timeStr} ${timezone}`;
      }

      // Format as "Nov 23 @ 1:00PM ET"
      const month = date.toLocaleDateString([], { month: "short" });
      const day = date.getDate();
      const timeStr = date.toLocaleTimeString([], {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
      return `${month} ${day} @ ${timeStr} ${timezone}`;
    }
  }

  // Fallback to dateString if description parsing fails
  if (!dateString) return "TBD";
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "TBD";

  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);

  const gameDate = new Date(date);
  gameDate.setHours(0, 0, 0, 0);

  if (gameDate.getTime() === tomorrow.getTime()) {
    // Format as "Tomorrow, 8:15pm EST"
    const timeStr = date.toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
    return `Tomorrow, ${timeStr} EST`;
  }

  // Format as "Nov 19 @ 9:30 PM"
  const month = date.toLocaleDateString([], { month: "short" });
  const day = date.getDate();
  const timeStr = date.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
  return `${month} ${day} @ ${timeStr}`;
}

/**
 * Format volume for display
 */
function formatVolume(volume) {
  if (!volume || volume === 0) return "—";
  if (volume >= 1000) {
    return `${(volume / 1000).toFixed(1)}k`;
  }
  return Math.round(volume).toString();
}

/**
 * Percentage Bar Component with Volume
 */
function PercentageBar({
  team1Percent,
  team2Percent,
  team1Color,
  team2Color,
  team1Volume,
  team2Volume,
}) {
  return (
    <View style={styles.percentageBarContainer}>
      <View style={styles.percentageBar}>
        <View
          style={[
            styles.percentageBarSegment,
            { width: `${team1Percent}%`, backgroundColor: team1Color },
          ]}
        >
          <Text style={styles.percentageText}>{Math.round(team1Percent)}%</Text>
        </View>
        <View
          style={[
            styles.percentageBarSegment,
            { width: `${team2Percent}%`, backgroundColor: team2Color },
          ]}
        >
          <Text style={styles.percentageText}>{Math.round(team2Percent)}%</Text>
        </View>
      </View>
      {/* Volume numbers under the bar */}
      <View style={styles.volumeRow}>
        <Text style={[styles.volumeText, { color: team1Color }]}>
          ${formatVolume(team1Volume)}
        </Text>
        <Text style={[styles.volumeText, { color: team2Color }]}>
          ${formatVolume(team2Volume)}
        </Text>
      </View>
    </View>
  );
}

export default function GameCard({ game, onPress, onContractPress }) {
  const yesPrice = game?.prices?.yes?.lastPrice ?? 0.5;
  const noPrice = game?.prices?.no?.lastPrice ?? 0.5;
  const { yesLabel, noLabel } = getFriendlyOutcomeLabels(game);

  // Parse teams
  const teams = useMemo(() => {
    if (yesLabel && noLabel && yesLabel !== "Yes" && noLabel !== "No") {
      return { team1: yesLabel, team2: noLabel };
    }
    return parseTeams(game?.question);
  }, [game?.question, yesLabel, noLabel]);

  // Calculate percentages
  const team1Percent = yesPrice * 100;
  const team2Percent = noPrice * 100;

  // Format contract prices in cents
  const team1Price = formatPrice(yesPrice);
  const team2Price = formatPrice(noPrice);

  // Get volume for each side
  // Check if volume is available per side, otherwise estimate from total volume
  const team1Volume = useMemo(() => {
    // Try to get volume per side if available
    if (game?.volume?.yes) return game.volume.yes;
    if (game?.volume?.yes?.day) return game.volume.yes.day;
    // Otherwise estimate from total volume based on price percentage
    if (game?.volume?.day) {
      return game.volume.day * yesPrice;
    }
    return null;
  }, [game?.volume, yesPrice]);

  const team2Volume = useMemo(() => {
    // Try to get volume per side if available
    if (game?.volume?.no) return game.volume.no;
    if (game?.volume?.no?.day) return game.volume.no.day;
    // Otherwise estimate from total volume based on price percentage
    if (game?.volume?.day) {
      return game.volume.day * noPrice;
    }
    return null;
  }, [game?.volume, noPrice]);

  // Format date (prefer description, fallback to date field)
  const gameDateTime = formatGameDateTime(game?.date, game?.description);

  // Total bets (mock - use volume if available)
  const totalBets = game?.volume?.day
    ? game.volume.day >= 1000
      ? `${(game.volume.day / 1000).toFixed(1)}k`
      : Math.round(game.volume.day)
    : "11k";

  // Team colors based on team names
  const team1Color = useMemo(() => {
    const colors = ["#8B5CF6", "#6366F1", "#7C3AED", "#9333EA"];
    const index = teams.team1.length % colors.length;
    return colors[index];
  }, [teams.team1]);

  const team2Color = useMemo(() => {
    const colors = ["#06B6D4", "#14B8A6", "#0891B2", "#0D9488"];
    const index = teams.team2.length % colors.length;
    return colors[index];
  }, [teams.team2]);

  const handleContractPress = (side) => {
    if (onContractPress) {
      onContractPress(game, side);
    } else if (onPress) {
      // Fallback to old behavior if onContractPress not provided
      onPress(game);
    }
  };

  const handleCardPress = () => {
    // Console log game, total volume, and volume on each side
    console.log("Card pressed:", {
      game,
      totalVolume: game?.volume?.day || game?.volume?.total || 0,
      team1Volume: team1Volume,
      team2Volume: team2Volume,
    });

    if (onPress) {
      onPress(game);
    }
  };

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.7}
      onPress={handleCardPress}
    >
      {/* Team Logos and Names */}
      <View style={styles.teamsRow}>
        <View style={styles.teamContainer}>
          <View style={[styles.teamLogo, { backgroundColor: team1Color }]}>
            <Text style={styles.teamLogoText}>{teams.team1.charAt(0)}</Text>
          </View>
          <Text style={styles.teamName} numberOfLines={1}>
            {teams.team1}
          </Text>
        </View>

        {/* Date between teams */}
        <View style={styles.dateBlock}>
          <Ionicons
            name="calendar-outline"
            size={12}
            color={Colors.textTertiary}
          />
          <Text style={styles.dateText} numberOfLines={1}>
            {gameDateTime}
          </Text>
        </View>

        <View style={styles.teamContainer}>
          <View style={[styles.teamLogo, { backgroundColor: team2Color }]}>
            <Text style={styles.teamLogoText}>{teams.team2.charAt(0)}</Text>
          </View>
          <Text style={styles.teamName} numberOfLines={1}>
            {teams.team2}
          </Text>
        </View>
      </View>

      {/* Percentage Bar with Volume */}
      <PercentageBar
        team1Percent={team1Percent}
        team2Percent={team2Percent}
        team1Color={team1Color}
        team2Color={team2Color}
        team1Volume={team1Volume}
        team2Volume={team2Volume}
      />

      {/* Contract Prices - Individually Selectable */}
      <View style={styles.pricesRow}>
        <TouchableOpacity
          style={styles.priceSection}
          activeOpacity={0.7}
          onPress={() => handleContractPress("yes")}
        >
          <Text style={styles.priceTeam}>{teams.team1}</Text>
          <Text style={[styles.priceValue, { color: team1Color }]}>
            {team1Price}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.priceSection}
          activeOpacity={0.7}
          onPress={() => handleContractPress("no")}
        >
          <Text style={styles.priceTeam}>{teams.team2}</Text>
          <Text style={[styles.priceValue, { color: team2Color }]}>
            {team2Price}
          </Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#F5F5F5",
    borderRadius: 16,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    shadowColor: "rgba(0, 0, 0, 0.08)",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.05)",
  },
  teamsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  teamContainer: {
    flex: 1,
    alignItems: "center",
  },
  teamLogo: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.xs,
  },
  teamLogoText: {
    fontSize: 20,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  teamName: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.textPrimary,
    textAlign: "center",
  },
  percentageBarContainer: {
    marginBottom: Spacing.md,
  },
  volumeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: Spacing.xs,
    paddingHorizontal: Spacing.xs,
  },
  percentageBar: {
    height: 32,
    borderRadius: 16,
    overflow: "hidden",
    flexDirection: "row",
    backgroundColor: "#E5E5E5",
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
  dateBlock: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    marginHorizontal: Spacing.xs,
    flexShrink: 1,
  },
  dateText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    fontSize: 11,
    marginLeft: 4,
  },
  pricesRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: Spacing.sm,
  },
  priceSection: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    padding: Spacing.sm,
    marginHorizontal: Spacing.xs,
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.05)",
    shadowColor: "rgba(0, 0, 0, 0.05)",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 2,
    elevation: 1,
  },
  priceTeam: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  priceValue: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 4,
  },
  volumeText: {
    fontSize: 12,
    fontWeight: "600",
  },
  betsIndicator: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "#FFF7ED",
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: Spacing.xs,
  },
  betsText: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.textPrimary,
    marginLeft: 4,
  },
});
