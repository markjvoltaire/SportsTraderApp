import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import React, { useRef } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useScrollToTop } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Spacing, Typography } from "../constants/theme";
import { formatCurrency, formatPrice } from "../src/utils/formatters";

// Hard-coded portfolio data
const PORTFOLIO_DATA = {
  totalValue: 1250.75,
  totalInvested: 1000.0,
  totalPnl: 250.75,
  totalPnlPercent: 25.08,
  positions: [
    {
      id: 1,
      market: "LAL vs BOS",
      team: "LAL",
      teamName: "Lakers",
      shares: 150,
      avgPrice: 0.45,
      currentPrice: 0.62,
      invested: 67.5,
      currentValue: 93.0,
      pnl: 25.5,
      pnlPercent: 37.78,
      status: "active",
      gameTime: "2025-12-10T20:00:00Z",
    },
    {
      id: 2,
      market: "KC vs BUF",
      team: "KC",
      teamName: "Chiefs",
      shares: 200,
      avgPrice: 0.55,
      currentPrice: 0.48,
      invested: 110.0,
      currentValue: 96.0,
      pnl: -14.0,
      pnlPercent: -12.73,
      status: "active",
      gameTime: "2025-12-09T18:00:00Z",
    },
    {
      id: 3,
      market: "PHI vs LAC",
      team: "PHI",
      teamName: "76ers",
      shares: 100,
      avgPrice: 0.52,
      currentPrice: 0.68,
      invested: 52.0,
      currentValue: 68.0,
      pnl: 16.0,
      pnlPercent: 30.77,
      status: "active",
      gameTime: "2025-12-08T19:30:00Z",
    },
    {
      id: 4,
      market: "GSW vs DEN",
      team: "GSW",
      teamName: "Warriors",
      shares: 75,
      avgPrice: 0.60,
      currentPrice: 0.75,
      invested: 45.0,
      currentValue: 56.25,
      pnl: 11.25,
      pnlPercent: 25.0,
      status: "active",
      gameTime: "2025-12-11T22:00:00Z",
    },
    {
      id: 5,
      market: "DAL vs MIA",
      team: "DAL",
      teamName: "Mavericks",
      shares: 120,
      avgPrice: 0.48,
      currentPrice: 0.42,
      invested: 57.6,
      currentValue: 50.4,
      pnl: -7.2,
      pnlPercent: -12.5,
      status: "active",
      gameTime: "2025-12-09T20:30:00Z",
    },
    {
      id: 6,
      market: "NE vs NYJ",
      team: "NE",
      teamName: "Patriots",
      shares: 80,
      avgPrice: 0.35,
      currentPrice: 0.85,
      invested: 28.0,
      currentValue: 68.0,
      pnl: 40.0,
      pnlPercent: 142.86,
      status: "won",
      gameTime: "2025-12-07T13:00:00Z",
    },
    {
      id: 7,
      market: "BOS vs TOR",
      team: "BOS",
      teamName: "Celtics",
      shares: 90,
      avgPrice: 0.58,
      currentPrice: 0.0,
      invested: 52.2,
      currentValue: 0.0,
      pnl: -52.2,
      pnlPercent: -100.0,
      status: "lost",
      gameTime: "2025-12-06T19:00:00Z",
    },
  ],
};

function StatCard({ label, value, valueColor, icon }) {
  return (
    <View style={styles.statCard}>
      {icon && (
        <Ionicons
          name={icon}
          size={20}
          color={valueColor || Colors.textPrimary}
          style={styles.statIcon}
        />
      )}
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, { color: valueColor || Colors.textPrimary }]}>
        {value}
      </Text>
    </View>
  );
}

function PositionCard({ position, onPress }) {
  const isPositive = position.pnl >= 0;
  const isWon = position.status === "won";
  const isLost = position.status === "lost";
  const teamColor = Colors.primary;

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  return (
    <TouchableOpacity
      style={styles.positionCard}
      activeOpacity={0.7}
      onPress={() => onPress?.(position)}
    >
      {/* Header */}
      <View style={styles.positionHeader}>
        <View style={styles.positionTitleRow}>
          <View style={[styles.teamBadge, { backgroundColor: teamColor }]}>
            <Text style={styles.teamBadgeText}>{position.team}</Text>
          </View>
          <View style={styles.positionTitle}>
            <Text style={styles.marketName}>{position.market}</Text>
            <Text style={styles.teamName}>{position.teamName}</Text>
          </View>
        </View>
        {isWon && (
          <View style={styles.statusBadge}>
            <Ionicons name="trophy" size={14} color={Colors.success} />
            <Text style={styles.statusText}>Won</Text>
          </View>
        )}
        {isLost && (
          <View style={[styles.statusBadge, styles.lostBadge]}>
            <Ionicons name="close-circle" size={14} color={Colors.danger} />
            <Text style={[styles.statusText, { color: Colors.danger }]}>
              Lost
            </Text>
          </View>
        )}
      </View>

      {/* Stats Row */}
      <View style={styles.positionStats}>
        <View style={styles.positionStat}>
          <Text style={styles.positionStatLabel}>Shares</Text>
          <Text style={styles.positionStatValue}>{position.shares}</Text>
        </View>
        <View style={styles.positionStat}>
          <Text style={styles.positionStatLabel}>Avg Price</Text>
          <Text style={styles.positionStatValue}>
            {formatPrice(position.avgPrice)}
          </Text>
        </View>
        <View style={styles.positionStat}>
          <Text style={styles.positionStatLabel}>Current</Text>
          <Text style={[styles.positionStatValue, { color: teamColor }]}>
            {isLost ? "$0.00" : formatPrice(position.currentPrice)}
          </Text>
        </View>
      </View>

      {/* Value Row */}
      <View style={styles.positionValueRow}>
        <View>
          <Text style={styles.valueLabel}>Invested</Text>
          <Text style={styles.valueAmount}>
            {formatCurrency(position.invested)}
          </Text>
        </View>
        <View style={styles.valueArrow}>
          <Ionicons
            name="arrow-forward"
            size={16}
            color={Colors.textTertiary}
          />
        </View>
        <View>
          <Text style={styles.valueLabel}>Value</Text>
          <Text style={styles.valueAmount}>
            {formatCurrency(position.currentValue)}
          </Text>
        </View>
        <View style={styles.pnlContainer}>
          <View
            style={[
              styles.pnlBadge,
              {
                backgroundColor: isPositive
                  ? Colors.successMuted
                  : Colors.dangerMuted,
              },
            ]}
          >
            <Ionicons
              name={isPositive ? "trending-up" : "trending-down"}
              size={12}
              color={isPositive ? Colors.success : Colors.danger}
            />
            <Text
              style={[
                styles.pnlText,
                { color: isPositive ? Colors.success : Colors.danger },
              ]}
            >
              {isPositive ? "+" : ""}
              {formatCurrency(position.pnl)} ({isPositive ? "+" : ""}
              {position.pnlPercent.toFixed(2)}%)
            </Text>
          </View>
        </View>
      </View>

      {/* Game Time */}
      <View style={styles.gameTimeRow}>
        <Ionicons name="time-outline" size={12} color={Colors.textTertiary} />
        <Text style={styles.gameTimeText}>
          {isWon || isLost
            ? `Game ended ${formatDate(position.gameTime)}`
            : `Game: ${formatDate(position.gameTime)}`}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

export default function PortfolioScreen() {
  const navigation = useNavigation();
  const scrollViewRef = useRef(null);
  useScrollToTop(scrollViewRef);
  const portfolio = PORTFOLIO_DATA;
  const isPositive = portfolio.totalPnl >= 0;

  const handlePositionPress = (position) => {
    // Navigate to market detail if available
    console.log("Position pressed:", position);
    // You could navigate to market detail here if you have market data
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Portfolio</Text>
          <Text style={styles.subtitle}>Your positions and performance</Text>
        </View>

        {/* Total Value Card */}
        <View style={styles.totalValueCard}>
          <Text style={styles.totalValueLabel}>Total Portfolio Value</Text>
          <Text style={styles.totalValueAmount}>
            {formatCurrency(portfolio.totalValue)}
          </Text>
          <View style={styles.totalPnlRow}>
            <View
              style={[
                styles.totalPnlBadge,
                {
                  backgroundColor: isPositive
                    ? Colors.successMuted
                    : Colors.dangerMuted,
                },
              ]}
            >
              <Ionicons
                name={isPositive ? "trending-up" : "trending-down"}
                size={16}
                color={isPositive ? Colors.success : Colors.danger}
              />
              <Text
                style={[
                  styles.totalPnlText,
                  { color: isPositive ? Colors.success : Colors.danger },
                ]}
              >
                {isPositive ? "+" : ""}
                {formatCurrency(portfolio.totalPnl)} ({isPositive ? "+" : ""}
                {portfolio.totalPnlPercent.toFixed(2)}%)
              </Text>
            </View>
          </View>
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <StatCard
            label="Total Invested"
            value={formatCurrency(portfolio.totalInvested)}
            icon="wallet-outline"
          />
          <StatCard
            label="Active Positions"
            value={portfolio.positions.filter((p) => p.status === "active").length.toString()}
            icon="list-outline"
          />
        </View>

        {/* Positions Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons
              name="briefcase"
              size={20}
              color={Colors.primary}
              style={styles.sectionIcon}
            />
            <Text style={styles.sectionTitle}>Your Positions</Text>
          </View>

          {portfolio.positions.map((position) => (
            <PositionCard
              key={position.id}
              position={position}
              onPress={handlePositionPress}
            />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: Spacing.xxl,
  },
  header: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  title: {
    ...Typography.pageTitle,
    fontSize: 32,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    ...Typography.body,
    color: Colors.textTertiary,
  },
  totalValueCard: {
    backgroundColor: Colors.surface,
    marginHorizontal: Spacing.xl,
    marginTop: Spacing.lg,
    marginBottom: Spacing.md,
    padding: Spacing.xl,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: "rgba(0, 0, 0, 0.08)",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 3,
    alignItems: "center",
  },
  totalValueLabel: {
    ...Typography.label,
    marginBottom: Spacing.sm,
    color: Colors.textTertiary,
  },
  totalValueAmount: {
    ...Typography.heroPrice,
    fontSize: 48,
    marginBottom: Spacing.md,
  },
  totalPnlRow: {
    marginTop: Spacing.sm,
  },
  totalPnlBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: 16,
    gap: Spacing.xs,
  },
  totalPnlText: {
    fontSize: 16,
    fontWeight: "700",
  },
  statsRow: {
    flexDirection: "row",
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.lg,
    gap: Spacing.md,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    padding: Spacing.lg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
  },
  statIcon: {
    marginBottom: Spacing.xs,
  },
  statLabel: {
    ...Typography.label,
    marginBottom: Spacing.xs,
    color: Colors.textTertiary,
  },
  statValue: {
    ...Typography.cardTitle,
    fontSize: 20,
  },
  section: {
    marginTop: Spacing.lg,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.md,
  },
  sectionIcon: {
    marginRight: Spacing.sm,
  },
  sectionTitle: {
    ...Typography.sectionTitle,
    fontSize: 24,
  },
  positionCard: {
    backgroundColor: Colors.surface,
    marginHorizontal: Spacing.xl,
    marginBottom: Spacing.md,
    padding: Spacing.lg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: "rgba(0, 0, 0, 0.08)",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 3,
  },
  positionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: Spacing.md,
  },
  positionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  teamBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  teamBadgeText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  positionTitle: {
    flex: 1,
  },
  marketName: {
    ...Typography.cardTitle,
    fontSize: 18,
    marginBottom: Spacing.xs / 2,
  },
  teamName: {
    ...Typography.body,
    fontSize: 14,
    color: Colors.textTertiary,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.successMuted,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: 12,
    gap: Spacing.xs,
  },
  lostBadge: {
    backgroundColor: Colors.dangerMuted,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.success,
  },
  positionStats: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: Spacing.md,
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: Colors.border,
  },
  positionStat: {
    alignItems: "center",
    flex: 1,
  },
  positionStatLabel: {
    ...Typography.label,
    fontSize: 10,
    marginBottom: Spacing.xs,
    color: Colors.textTertiary,
  },
  positionStatValue: {
    ...Typography.cardTitle,
    fontSize: 16,
  },
  positionValueRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  valueLabel: {
    ...Typography.label,
    fontSize: 11,
    marginBottom: Spacing.xs,
    color: Colors.textTertiary,
  },
  valueAmount: {
    ...Typography.cardTitle,
    fontSize: 16,
  },
  valueArrow: {
    marginHorizontal: Spacing.md,
    marginTop: Spacing.md,
  },
  pnlContainer: {
    marginLeft: "auto",
  },
  pnlBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: 12,
    gap: Spacing.xs,
  },
  pnlText: {
    fontSize: 13,
    fontWeight: "700",
  },
  gameTimeRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderColor: Colors.border,
  },
  gameTimeText: {
    ...Typography.caption,
    fontSize: 12,
    marginLeft: Spacing.xs,
    color: Colors.textTertiary,
  },
});
