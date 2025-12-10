import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Spacing, Typography } from "../../constants/theme";
import { formatPrice, formatCurrency } from "../../utils/formatters";
import { getTeamColor } from "../../utils/teamColors";

export default function TopMoverCard({ market, onPress, rank }) {
  if (!market) return null;

  // Calculate price change
  const awayPrice = parseFloat(market.awayTeam?.price || 0.5);
  const homePrice = parseFloat(market.homeTeam?.price || 0.5);
  
  // Determine which team moved more (simplified - can be enhanced with historical data)
  const priceChange = Math.abs(awayPrice - 0.5); // Distance from 0.5
  const isUp = awayPrice > 0.5;
  const changePercent = Math.round(priceChange * 100);

  // Get team info
  const team1 = market.awayTeam?.abbreviation || market.awayTeam?.name || "Away";
  const team2 = market.homeTeam?.abbreviation || market.homeTeam?.name || "Home";
  const team1Color = getTeamColor(
    market.awayTeam?.abbreviation,
    market.awayTeam?.name
  );
  const team2Color = getTeamColor(
    market.homeTeam?.abbreviation,
    market.homeTeam?.name
  );

  // Get volume
  const volume =
    market.volume24hr ||
    market.volume?.day ||
    market.volumeNum ||
    market.volume ||
    0;

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.7}
      onPress={() => onPress?.(market)}
    >
      {/* Rank Badge */}
      {rank && (
        <View style={styles.rankBadge}>
          <Text style={styles.rankText}>#{rank}</Text>
        </View>
      )}

      {/* Teams */}
      <View style={styles.teamsRow}>
        <View style={styles.teamContainer}>
          <View
            style={[styles.teamIconCircle, { backgroundColor: team1Color }]}
          >
            <Text style={styles.teamIconText}>
              {(market.awayTeam?.abbreviation || team1.charAt(0)).toUpperCase()}
            </Text>
          </View>
          <Text style={styles.teamName}>{team1}</Text>
        </View>

        <Text style={styles.vsText}>VS</Text>

        <View style={styles.teamContainer}>
          <View
            style={[styles.teamIconCircle, { backgroundColor: team2Color }]}
          >
            <Text style={styles.teamIconText}>
              {(market.homeTeam?.abbreviation || team2.charAt(0)).toUpperCase()}
            </Text>
          </View>
          <Text style={styles.teamName}>{team2}</Text>
        </View>
      </View>

      {/* Price Change Info */}
      <View style={styles.priceChangeRow}>
        <View
          style={[
            styles.changeBadge,
            { backgroundColor: isUp ? Colors.successMuted : Colors.dangerMuted },
          ]}
        >
          <Ionicons
            name={isUp ? "trending-up" : "trending-down"}
            size={14}
            color={isUp ? Colors.success : Colors.danger}
          />
          <Text
            style={[
              styles.changeText,
              { color: isUp ? Colors.success : Colors.danger },
            ]}
          >
            {changePercent}%
          </Text>
        </View>
        <Text style={styles.volumeText}>
          {volume > 0 ? formatCurrency(volume) : "No volume"}
        </Text>
      </View>

      {/* Current Prices */}
      <View style={styles.pricesRow}>
        <View style={styles.priceBox}>
          <Text style={styles.priceLabel}>{team1}</Text>
          <Text style={[styles.priceValue, { color: team1Color }]}>
            {formatPrice(awayPrice)}
          </Text>
        </View>
        <View style={styles.priceBox}>
          <Text style={styles.priceLabel}>{team2}</Text>
          <Text style={[styles.priceValue, { color: team2Color }]}>
            {formatPrice(homePrice)}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    marginHorizontal: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: "rgba(0, 0, 0, 0.08)",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 3,
    position: "relative",
  },
  rankBadge: {
    position: "absolute",
    top: Spacing.md,
    right: Spacing.md,
    backgroundColor: Colors.primary,
    borderRadius: 12,
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  rankText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
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
  teamIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.xs,
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
  vsText: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.textMuted,
    marginHorizontal: Spacing.md,
  },
  priceChangeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.xs,
  },
  changeBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: 12,
    gap: Spacing.xs,
  },
  changeText: {
    fontSize: 13,
    fontWeight: "700",
  },
  volumeText: {
    fontSize: 12,
    fontWeight: "500",
    color: Colors.textTertiary,
  },
  pricesRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: Spacing.md,
  },
  priceBox: {
    flex: 1,
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: Spacing.md,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  priceLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: Colors.textTertiary,
    marginBottom: Spacing.xs,
  },
  priceValue: {
    fontSize: 18,
    fontWeight: "700",
  },
});

