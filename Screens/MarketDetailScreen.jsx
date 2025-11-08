import React, { useMemo } from "react";
import {
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  Pressable,
  ScrollView,
} from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";

import { BorderRadius, Colors, Spacing, Typography } from "../constants/theme";

const DEFAULT_MARKET = {
  id: "nvda",
  symbol: "NVDA",
  title: "NVIDIA",
  price: 189.5,
  changeToday: 0.18,
  changeTodayPct: 0.1,
  changeAfterHours: 1.24,
  changeAfterHoursPct: 0.66,
  volume: 263_894_974,
};

const TIMEFRAMES = ["1D", "1W", "1M", "3M", "YTD", "1Y", "ALL"];

function formatCurrency(value) {
  return `$${value.toLocaleString(undefined, {
    maximumFractionDigits: 2,
  })}`;
}

function formatNumber(value) {
  return value.toLocaleString();
}

export default function MarketDetailScreen() {
  const navigation = useNavigation();
  const { params } = useRoute();
  const market = useMemo(() => {
    if (params?.market) {
      const { title, price, change } = params.market;
      return {
        ...DEFAULT_MARKET,
        title,
        price,
        changeToday: change,
        changeTodayPct: change,
      };
    }
    return DEFAULT_MARKET;
  }, [params]);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerRow}>
          <Pressable
            style={styles.iconButton}
            onPress={() => navigation.goBack()}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Text style={styles.iconText}>‹</Text>
          </Pressable>
          <View style={styles.headerActions}>
            <Pressable style={styles.roundButton}>
              <Text style={styles.iconText}>⧉</Text>
            </Pressable>
            <Pressable style={styles.roundButton}>
              <Text style={styles.iconText}>🔔</Text>
            </Pressable>
            <Pressable style={[styles.roundButton, styles.roundButtonActive]}>
              <Text style={[styles.iconText, styles.iconTextActive]}>✓</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.marketHeader}>
          <Text style={styles.symbol}>{market.symbol}</Text>
          <Text style={styles.title}>{market.title}</Text>
          <View style={styles.priceRow}>
            <Text style={styles.price}>{formatCurrency(market.price)}</Text>
            <Text style={styles.priceIcon}>↗</Text>
          </View>
          <View style={styles.changeRow}>
            <Text style={styles.changePositive}>
              ▲ {formatCurrency(market.changeToday)} (
              {market.changeTodayPct.toFixed(2)}%) Today
            </Text>
            <Text style={styles.changePositive}>
              ▲ {formatCurrency(market.changeAfterHours)} (
              {market.changeAfterHoursPct.toFixed(2)}%) After-hours
            </Text>
          </View>
        </View>

        <View style={styles.chartContainer}>
          <View style={styles.chartLine} />
          <View style={styles.chartDot} />
        </View>

        <View style={styles.timeframeRow}>
          {TIMEFRAMES.map((label, index) => {
            const isActive = index === 0;
            return (
              <Pressable
                key={label}
                style={[
                  styles.timeframeButton,
                  isActive ? styles.timeframeButtonActive : null,
                ]}
              >
                <Text
                  style={[
                    styles.timeframeLabel,
                    isActive ? styles.timeframeLabelActive : null,
                  ]}
                >
                  {label}
                </Text>
              </Pressable>
            );
          })}
          <Pressable style={styles.advancedButton}>
            <Text style={styles.advancedLabel}>Advanced</Text>
          </Pressable>
        </View>
      </ScrollView>
      <View style={styles.bottomContainer}>
        <View style={styles.positionCard}>
          <View style={styles.positionDetails}>
            <Text style={styles.sectionTitle}>Your position</Text>
            <Text style={styles.subtitle}>Today's volume</Text>
            <Text style={styles.value}>{formatNumber(market.volume)}</Text>
          </View>
          <Pressable style={styles.tradeButton}>
            <Text style={styles.tradeLabel}>Trade</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: 160,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.xxl + Spacing.sm,
  },
  iconButton: {
    width: Spacing.xxxl,
    height: Spacing.xxxl,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  roundButton: {
    width: Spacing.xxxl - 6,
    height: Spacing.xxxl - 6,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: Spacing.md,
  },
  roundButtonActive: {
    backgroundColor: Colors.primary,
  },
  iconText: {
    color: Colors.textSecondary,
    fontSize: 16,
  },
  iconTextActive: {
    color: Colors.background,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  marketHeader: {
    marginBottom: Spacing.xxl,
  },
  symbol: {
    ...Typography.label,
    color: Colors.textMuted,
    marginBottom: Spacing.md,
  },
  title: {
    ...Typography.pageTitle,
    marginBottom: Spacing.md,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  price: {
    ...Typography.heroPrice,
  },
  priceIcon: {
    color: Colors.primary,
    fontSize: 20,
    marginLeft: Spacing.md,
  },
  changeRow: {
    marginTop: Spacing.lg,
  },
  changePositive: {
    color: Colors.primaryLight,
    fontSize: 15,
    marginBottom: Spacing.xs,
  },
  chartContainer: {
    height: 200,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.xxl,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    justifyContent: "flex-end",
    paddingBottom: Spacing.xl,
    paddingHorizontal: Spacing.lg,
  },
  chartLine: {
    height: 110,
    borderRadius: 110,
    backgroundColor: Colors.primary,
    marginHorizontal: -100,
    opacity: 0.22,
  },
  chartDot: {
    position: "absolute",
    right: Spacing.xl,
    bottom: Spacing.xxl,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: Colors.primary,
    borderWidth: 2,
    borderColor: Colors.background,
  },
  timeframeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    marginBottom: Spacing.xxl,
  },
  timeframeButton: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginRight: Spacing.md,
    marginBottom: Spacing.md,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  timeframeButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  timeframeLabel: {
    color: Colors.textSecondary,
    fontSize: 14,
    fontWeight: "600",
  },
  timeframeLabelActive: {
    color: Colors.background,
  },
  advancedButton: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  advancedLabel: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: "600",
  },
  bottomContainer: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xxl,
    paddingTop: Spacing.md,
    backgroundColor: Colors.background,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  positionCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: Spacing.xl,
  },
  positionDetails: {
    flex: 1,
  },
  sectionTitle: {
    ...Typography.sectionTitle,
    fontSize: 20,
    marginBottom: Spacing.sm,
  },
  subtitle: {
    color: Colors.textTertiary,
    fontSize: 14,
    marginBottom: Spacing.xs,
  },
  value: {
    color: Colors.textPrimary,
    fontSize: 22,
    fontWeight: "600",
  },
  tradeButton: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.xl,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xl + Spacing.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  tradeLabel: {
    color: "#041010",
    fontSize: 15,
    fontWeight: "700",
  },
});
