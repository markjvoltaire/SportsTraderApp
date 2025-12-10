import React, { useState, useMemo } from "react";
import { View, StyleSheet, ScrollView, Dimensions, Text } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import ScreenTemplate from "./ScreenTemplate";
import { useRoute } from "@react-navigation/native";
import MarketRules from "../src/components/market/MarketRules";
import MyChart from "../src/components/market/MyChart";
import ButtonRow from "../src/components/market/ButtonRow";
import { Colors, Spacing, Typography } from "../src/constants/theme";
import { formatCurrency, formatSharePrice } from "../src/utils/formatters";
import StatCard from "../src/components/market/StatCard";

export default function MarketsScreen() {
  const route = useRoute();
  const market = route.params?.game || route.params?.market;

  const { height } = Dimensions.get("window");

  // Get safe area insets for proper button positioning
  const insets = useSafeAreaInsets();

  // Extract market title
  const marketTitle = useMemo(() => {
    if (!market) {
      return "Markets";
    }
    // Try title first, then question, then construct from teams
    if (market.title) {
      return market.title;
    }
    if (market.question) {
      return market.question;
    }
    // Construct from team names if available
    if (market.awayTeam && market.homeTeam) {
      const awayName =
        market.awayTeam.abbreviation || market.awayTeam.name || "Away";
      const homeName =
        market.homeTeam.abbreviation || market.homeTeam.name || "Home";
      return `${awayName} vs ${homeName}`;
    }
    return "Markets";
  }, [market]);

  // State for current timestamp from chart cursor
  const [currentTimestamp, setCurrentTimestamp] = useState(null);

  // State for price stats (high/low) from chart
  const [priceStats, setPriceStats] = useState(null);

  // Extract description - use current timestamp if available, otherwise use game date
  const marketDescription = useMemo(() => {
    // If we have a timestamp from the chart cursor, use that
    if (currentTimestamp) {
      try {
        const dateObj = new Date(currentTimestamp * 1000); // Convert from seconds to milliseconds
        if (!Number.isNaN(dateObj.getTime())) {
          const dateStr = dateObj.toLocaleDateString(undefined, {
            weekday: "long",
            month: "long",
            day: "numeric",
            year: "numeric",
          });
          const timeStr = dateObj.toLocaleTimeString(undefined, {
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
          });
          return `${dateStr} ${timeStr}`;
        }
      } catch (e) {
        // Ignore date parsing errors
      }
    }

    // Otherwise, use the game date
    if (!market) {
      return "Browse all available markets.";
    }
    // Try to get a description or date
    const date =
      market.gameStartTime ||
      market.date ||
      market.eventDate ||
      market.startTime ||
      market.startDate;
    if (date) {
      try {
        const dateObj = new Date(date);
        if (!Number.isNaN(dateObj.getTime())) {
          const dateStr = dateObj.toLocaleDateString(undefined, {
            weekday: "long",
            month: "long",
            day: "numeric",
            year: "numeric",
          });
          const timeStr = dateObj.toLocaleTimeString(undefined, {
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
          });
          return `${dateStr} ${timeStr}`;
        }
      } catch (e) {
        // Ignore date parsing errors
      }
    }
    return "Market details";
  }, [market, currentTimestamp]);

  // Extract and format volume
  const marketVolume = useMemo(() => {
    if (!market) {
      return 0;
    }
    return (
      market.volume24hr ||
      market.volume?.day ||
      market.volumeNum ||
      market.volume ||
      0
    );
  }, [market]);

  const formattedVolume =
    marketVolume > 0 ? formatCurrency(marketVolume) : "$0";

  return (
    <>
      <ScreenTemplate title={marketTitle} description={marketDescription}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          scrollEventThrottle={16}
        >
          <View style={[styles.chartContainerWrapper, { top: height * 0.02 }]}>
            <MyChart
              onTimestampChange={setCurrentTimestamp}
              onPriceStatsChange={setPriceStats}
            />
          </View>

          {/* Market Stats Section */}
          <View style={styles.statsSection}>
            <Text style={styles.sectionTitle}>Market Stats</Text>

            <View style={styles.statsGrid}>
              <StatCard
                label="24hr Volume"
                value={formattedVolume}
                subtitle={
                  marketVolume > 0 ? "Total trading volume" : "No volume yet"
                }
              />
            </View>

            {/* Team High/Low Stats */}
            {priceStats && market && (
              <>
                <Text style={styles.sectionTitle}>Price Range</Text>
                <View style={styles.statsGrid}>
                  {/* Away Team Stats */}
                  {market.awayTeam && (
                    <>
                      <StatCard
                        label={`${
                          market.awayTeam.abbreviation ||
                          market.awayTeam.name ||
                          "Away"
                        } High`}
                        value={formatSharePrice(priceStats.awayHigh)}
                        subtitle="Highest price"
                      />
                      <StatCard
                        label={`${
                          market.awayTeam.abbreviation ||
                          market.awayTeam.name ||
                          "Away"
                        } Low`}
                        value={formatSharePrice(priceStats.awayLow)}
                        subtitle="Lowest price"
                      />
                    </>
                  )}

                  {/* Home Team Stats */}
                  {market.homeTeam && (
                    <>
                      <StatCard
                        label={`${
                          market.homeTeam.abbreviation ||
                          market.homeTeam.name ||
                          "Home"
                        } High`}
                        value={formatSharePrice(priceStats.homeHigh)}
                        subtitle="Highest price"
                      />
                      <StatCard
                        label={`${
                          market.homeTeam.abbreviation ||
                          market.homeTeam.name ||
                          "Home"
                        } Low`}
                        value={formatSharePrice(priceStats.homeLow)}
                        subtitle="Lowest price"
                      />
                    </>
                  )}
                </View>
              </>
            )}
          </View>

          <MarketRules market={market} />
          <View style={styles.bottomSpacer} />
        </ScrollView>
      </ScreenTemplate>
      <View
        style={[
          styles.buttonContainer,
          {
            bottom: 72, // Tab bar height
          },
        ]}
        pointerEvents="box-none"
      >
        <ButtonRow market={market} />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 120, // Space for buttons at bottom
  },
  bottomSpacer: {
    height: 200, // Extra space to ensure MarketRules is fully scrollable
  },
  chartContainerWrapper: {
    marginHorizontal: -Spacing.xl,
    marginBottom: Spacing.md,
  },
  buttonContainer: {
    position: "absolute",
    left: 0,
    right: 0,
    backgroundColor: Colors.background,
    width: "100%",
    paddingHorizontal: Spacing.xl, // Match ScreenTemplate padding
    paddingTop: Spacing.md,
    paddingBottom: Spacing.md,
    zIndex: 1000, // Ensure it's above other content
    elevation: 10, // For Android shadow/elevation
    shadowColor: "rgba(0, 0, 0, 0.5)",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  statsSection: {
    marginTop: Spacing.xl,
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    ...Typography.cardTitle,
    fontSize: 18,
    marginBottom: Spacing.md,
    marginHorizontal: Spacing.xl,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.md,
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.lg,
  },
});
