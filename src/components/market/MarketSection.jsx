import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Colors, Spacing, Typography } from "../../constants/theme";
import GameCard from "./GameCard";
import { formatTimestamp } from "../../utils/formatters";

const WARNING_SURFACE = "rgba(0, 0, 0, 0.1)";
const WARNING_TEXT = "#000000";

export default function MarketSection({ section, onGamePress }) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{section.label}</Text>
        <Text style={styles.meta}>
          Updated {formatTimestamp(section.generatedAt)}
        </Text>
      </View>

      {section.issues.length > 0 ? (
        <Text style={styles.issuePill}>
          {section.issues.length} market issue
          {section.issues.length > 1 ? "s" : ""} flagged
        </Text>
      ) : null}

      {section.games.length === 0 ? (
        <Text style={styles.emptyState}>
          No active moneyline games right now.
        </Text>
      ) : (
        section.games.map((game) => (
          <GameCard
            key={game.game_id}
            game={game}
            onPress={() => onGamePress?.(game)}
            onContractPress={(game, side) => {
              // Pass game and which contract side was selected (yes/no)
              // side will be "yes" for team1 or "no" for team2
              console.log("Contract pressed:", { game, side });
              onGamePress?.({ ...game, selectedContract: side });
            }}
          />
        ))
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.xl,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.sm,
    paddingHorizontal: Spacing.xs,
  },
  title: {
    ...Typography.body,
    fontWeight: "700",
    color: Colors.textPrimary,
    fontSize: 16,
  },
  meta: {
    ...Typography.caption,
    color: Colors.textTertiary,
    fontSize: 12,
  },
  issuePill: {
    ...Typography.caption,
    color: WARNING_TEXT,
    backgroundColor: WARNING_SURFACE,
    alignSelf: "flex-start",
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: 999,
    marginBottom: Spacing.sm,
  },
  emptyState: {
    ...Typography.caption,
    color: Colors.textTertiary,
  },
});
