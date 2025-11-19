import { ScrollView, StyleSheet, Text, View } from "react-native";
import React from "react";
import { useRoute } from "@react-navigation/native";
import ScreenTemplate from "./ScreenTemplate";
import { Colors, Spacing, Typography } from "../constants/theme";
import PriceHistoryChart from "../src/components/ui/PriceHistoryChart";
import OutcomeColumn from "../src/components/market/OutcomeColumn";
import StatCard from "../src/components/market/StatCard";
import MetaItem from "../src/components/ui/MetaItem";
import { getFriendlyOutcomeLabels } from "../src/utils/marketUtils";
import {
  formatCurrency,
  formatDateTime,
  formatGameDate,
  truncateHash,
} from "../src/utils/formatters";

export default function MarketDetailScreen() {
  const route = useRoute();
  const game = route.params?.game;

  if (!game) {
    return (
      <ScreenTemplate>
        <Text style={styles.errorText}>No market data available</Text>
      </ScreenTemplate>
    );
  }

  const yesPrice = game?.prices?.yes?.lastPrice;
  const noPrice = game?.prices?.no?.lastPrice;
  const yesBid = game?.polymarket?.orderbook?.yes?.bestBid;
  const noBid = game?.polymarket?.orderbook?.no?.bestBid;
  const { yesLabel, noLabel } = getFriendlyOutcomeLabels(game);
  const sportLabel = (game?.sport ?? "SPORT").toUpperCase();
  const statusLabel = (game?.market_status ?? "OPEN").toUpperCase();

  return (
    <ScreenTemplate>
      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.metaRow}>
          <Text style={styles.sportTag}>{sportLabel}</Text>
          <Text style={styles.sportTag}>{statusLabel}</Text>
        </View>

        <Text style={styles.gameTitle}>{game.question}</Text>
        <Text style={styles.gameDate}>{formatGameDate(game.date)}</Text>

        {game.description ? (
          <View style={styles.descriptionCard}>
            <Text style={styles.descriptionLabel}>Market Rules</Text>
            <Text style={styles.descriptionText}>{game.description}</Text>
          </View>
        ) : null}

        <View style={styles.priceRow}>
          <OutcomeColumn
            label={yesLabel}
            description="This side wins"
            price={yesPrice}
            bid={yesBid}
            color={Colors.success}
            helper="Pays $1 if this outcome hits."
          />
          <OutcomeColumn
            label={noLabel}
            description="The other side wins"
            price={noPrice}
            bid={noBid}
            color={Colors.danger}
            align="flex-end"
            helper="Pays $1 if it doesn't happen."
          />
        </View>

        <PriceHistoryChart
          yesPrice={yesPrice}
          noPrice={noPrice}
          yesLabel={yesLabel}
          noLabel={noLabel}
          yesTokenId={game?.polymarket?.tokens?.yes}
          noTokenId={game?.polymarket?.tokens?.no}
        />

        <View style={styles.statsGrid}>
          <StatCard
            label="Liquidity"
            value={formatCurrency(game?.liquidity?.total)}
            subtitle={formatCurrency(game?.liquidity?.clob)}
          />
          <StatCard
            label="Volume (24h)"
            value={formatCurrency(game?.volume?.day)}
          />
          <StatCard
            label="Total Volume"
            value={formatCurrency(game?.volume?.total)}
          />
        </View>

        <View style={styles.metaSection}>
          <MetaItem label="Market ID" value={game.game_id} />
          <MetaItem
            label="Condition ID"
            value={truncateHash(game?.polymarket?.condition_id)}
          />
          <MetaItem label="Slug" value={game.slug} />
          {game.end_date ? (
            <MetaItem label="End Date" value={formatDateTime(game.end_date)} />
          ) : null}
          <MetaItem
            label="Validation"
            value={game.validation_passed ? "Passed" : "Pending"}
          />
        </View>

        {!game.validation_passed ? (
          <View style={styles.warningCard}>
            <Text style={styles.warningText}>Validation pending</Text>
          </View>
        ) : null}
      </ScrollView>
    </ScreenTemplate>
  );
}

const styles = StyleSheet.create({
  scrollArea: {
    alignSelf: "stretch",
  },
  scrollContent: {
    paddingBottom: Spacing.xxl * 2,
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: Spacing.sm,
  },
  sportTag: {
    ...Typography.caption,
    color: Colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  gameTitle: {
    ...Typography.sectionTitle,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  gameDate: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginBottom: Spacing.lg,
  },
  descriptionCard: {
    backgroundColor: Colors.surfaceAlt,
    borderRadius: Spacing.md,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  descriptionLabel: {
    ...Typography.caption,
    color: Colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: Spacing.xs,
  },
  descriptionText: {
    ...Typography.body,
    color: Colors.textPrimary,
    lineHeight: 22,
  },
  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: Spacing.xl,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: Spacing.xl,
    gap: Spacing.md,
  },
  metaSection: {
    backgroundColor: Colors.surface,
    borderRadius: Spacing.md,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  warningCard: {
    backgroundColor: "rgba(251, 191, 36, 0.16)",
    borderRadius: Spacing.md,
    padding: Spacing.md,
  },
  warningText: {
    ...Typography.caption,
    color: "#B45309",
  },
  errorText: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: "center",
    marginTop: Spacing.xxl,
  },
});
