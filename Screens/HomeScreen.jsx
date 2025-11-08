import React, { useMemo } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";

import ScreenTemplate from "./ScreenTemplate";
import { BorderRadius, Colors, Spacing, Typography } from "../constants/theme";

const DUMMY_MARKETS = [
  {
    id: "bills-dolphins",
    title: "Bills vs Dolphins",
    volume: "$2.7k Vol.",
    price: 58.83,
    change: 13.8,
  },
  {
    id: "chiefs-jets",
    title: "Chiefs vs Jets",
    volume: "$1.9k Vol.",
    price: 42.15,
    change: -4.2,
  },
  {
    id: "lakers-celtics",
    title: "Lakers vs Celtics",
    volume: "$3.4k Vol.",
    price: 65.22,
    change: 7.5,
  },
  {
    id: "ufc-289-main",
    title: "UFC 289 Main Event",
    volume: "$4.1k Vol.",
    price: 71.4,
    change: 9.1,
  },
];

const PORTFOLIO_PERFORMANCE = [12540, 12610, 12780, 12420, 12950, 13120, 13385];

function formatCurrency(value) {
  return `$${value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function PortfolioHeader({ summary }) {
  const { value, change, changePct } = summary;
  const positive = change >= 0;
  const sign = positive ? "+" : "−";

  return (
    <View style={styles.portfolioCard}>
      <View style={styles.portfolioHeaderRow}>
        <View>
          <Text style={styles.portfolioLabel}>Portfolio value</Text>
          <Text style={styles.portfolioValue}>{formatCurrency(value)}</Text>
        </View>
        <View
          style={[
            styles.portfolioChip,
            positive
              ? styles.portfolioChipPositive
              : styles.portfolioChipNegative,
          ]}
        >
          <Text
            style={[
              styles.portfolioChipText,
              positive
                ? styles.portfolioChipTextPositive
                : styles.portfolioChipTextNegative,
            ]}
          >
            {sign}
            {formatCurrency(Math.abs(change))} ({sign}
            {Math.abs(changePct).toFixed(1)}%)
          </Text>
        </View>
      </View>
      <View style={styles.portfolioSubtitleRow}>
        <Text style={styles.portfolioSubtitle}>
          Performance past 7 sessions
        </Text>
        <Text style={styles.portfolioDateLabel}>Updated just now</Text>
      </View>
      <View style={styles.portfolioChart}>
        <View style={styles.portfolioChartLine} />
        <View
          style={[
            styles.portfolioChartDot,
            positive
              ? styles.portfolioChartDotPositive
              : styles.portfolioChartDotNegative,
          ]}
        />
      </View>
    </View>
  );
}

function MarketCard({ title, volume, price, change, onPress }) {
  const changeColor = change >= 0 ? styles.positive : styles.negative;
  const formattedChange = `${change >= 0 ? "+" : ""}${change.toFixed(1)}%`;

  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        pressed ? styles.cardPressed : null,
      ]}
      onPress={onPress}
    >
      <View style={styles.cardHeader}>
        <View style={styles.cardMeta}>
          <View style={styles.avatar} />
          <View>
            <Text style={styles.cardTitle}>{title}</Text>
            <Text style={styles.cardSubtitle}>{volume}</Text>
          </View>
        </View>
        <View style={styles.cardNumbers}>
          <Text style={styles.price}>{price.toFixed(2)}</Text>
          <Text style={[styles.change, changeColor]}>{formattedChange}</Text>
        </View>
      </View>
      <View style={styles.sparklinePlaceholder}>
        <View style={styles.sparklineOverlay} />
      </View>
    </Pressable>
  );
}

export default function HomeScreen() {
  const data = useMemo(() => DUMMY_MARKETS, []);
  const portfolioSummary = useMemo(() => {
    const first = PORTFOLIO_PERFORMANCE[0];
    const latest = PORTFOLIO_PERFORMANCE[PORTFOLIO_PERFORMANCE.length - 1];
    const change = latest - first;
    const changePct = (change / first) * 100;

    return {
      value: latest,
      change,
      changePct,
    };
  }, []);
  const navigation = useNavigation();

  return (
    <ScreenTemplate
      title="Home"
      description="Watch the markets you follow at a glance."
    >
      <FlatList
        data={data}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <MarketCard
            {...item}
            onPress={() =>
              navigation.navigate("MarketDetail", {
                market: item,
              })
            }
          />
        )}
        ListHeaderComponent={<PortfolioHeader summary={portfolioSummary} />}
        ListHeaderComponentStyle={styles.listHeader}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </ScreenTemplate>
  );
}

const styles = StyleSheet.create({
  listHeader: {
    marginBottom: Spacing.xxl,
  },
  listContent: {
    paddingBottom: Spacing.xxl,
  },
  portfolioCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  portfolioHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  portfolioLabel: {
    ...Typography.label,
    marginBottom: Spacing.xs,
  },
  portfolioValue: {
    ...Typography.heroPrice,
    fontSize: 32,
  },
  portfolioChip: {
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  portfolioChipPositive: {
    backgroundColor: "rgba(47, 221, 127, 0.14)",
  },
  portfolioChipNegative: {
    backgroundColor: "rgba(242, 107, 107, 0.14)",
  },
  portfolioChipText: {
    fontSize: 13,
    fontWeight: "600",
  },
  portfolioChipTextPositive: {
    color: Colors.primary,
  },
  portfolioChipTextNegative: {
    color: Colors.danger,
  },
  portfolioSubtitleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  portfolioSubtitle: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
  portfolioDateLabel: {
    ...Typography.caption,
    color: Colors.textTertiary,
  },
  portfolioChart: {
    height: 140,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surfaceAlt,
    borderWidth: 1,
    borderColor: Colors.border,
    justifyContent: "flex-end",
    paddingBottom: Spacing.lg,
    paddingHorizontal: Spacing.md,
  },
  portfolioChartLine: {
    height: 90,
    borderRadius: 90,
    backgroundColor: Colors.primary,
    marginHorizontal: -80,
    opacity: 0.22,
  },
  portfolioChartDot: {
    position: "absolute",
    right: Spacing.lg,
    bottom: Spacing.xl,
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: Colors.background,
  },
  portfolioChartDotPositive: {
    backgroundColor: Colors.primary,
  },
  portfolioChartDotNegative: {
    backgroundColor: Colors.danger,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardPressed: {
    transform: [{ scale: 0.99 }],
    opacity: 0.95,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: Spacing.lg,
  },
  cardMeta: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 44,
    height: 48,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surfaceAlt,
    marginRight: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardTitle: {
    ...Typography.cardTitle,
    fontSize: 18,
  },
  cardSubtitle: {
    color: Colors.textTertiary,
    marginTop: Spacing.xs,
    fontSize: 14,
  },
  cardNumbers: {
    alignItems: "flex-end",
  },
  price: {
    color: Colors.textPrimary,
    fontSize: 20,
    fontWeight: "600",
  },
  change: {
    marginTop: Spacing.xs,
    fontSize: 14,
    fontWeight: "600",
  },
  positive: {
    color: Colors.primary,
  },
  negative: {
    color: Colors.danger,
  },
  sparklinePlaceholder: {
    height: 80,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surfaceAlt,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: "hidden",
    justifyContent: "flex-end",
  },
  sparklineOverlay: {
    height: 48,
    borderRadius: 48,
    marginHorizontal: -40,
    backgroundColor: Colors.primary,
    opacity: 0.28,
  },
});
