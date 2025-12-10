import { StyleSheet, Text, View, TouchableOpacity } from "react-native";
import React from "react";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Spacing, Typography } from "../../constants/theme";
import { formatCurrency } from "../../utils/formatters";

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
  console.log("market", market);

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

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.7}
      onPress={() => onPress?.(market)}
    >
      {/* Date Row */}
      <View style={styles.dateRow}>
        <Ionicons name="time-outline" size={14} color={Colors.textTertiary} />
        <Text style={styles.dateText}>{gameTimeString}</Text>
      </View>

      {/* Title */}
      <Text style={styles.title} numberOfLines={2}>
        {title}
      </Text>

      {/* Volume Row */}
      <View style={styles.volumeRow}>
        <Ionicons
          name="trending-up-outline"
          size={14}
          color={Colors.textTertiary}
        />
        <Text style={styles.volumeText}>{formattedVolume}</Text>
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
    shadowColor: "rgba(0, 0, 0, 0.5)",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  dateText: {
    fontSize: 13,
    fontWeight: "400",
    color: Colors.textSecondary,
    marginLeft: Spacing.xs,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
    lineHeight: 24,
  },
  volumeRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  volumeText: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.textSecondary,
    marginLeft: Spacing.xs,
  },
  errorText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: "center",
  },
});
