import React, { useState, useMemo } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Dimensions,
  Text,
  Image,
  TouchableOpacity,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import ScreenTemplate from "./ScreenTemplate";
import { useRoute } from "@react-navigation/native";
import MyChart from "../src/components/market/MyChart";
import ButtonRow from "../src/components/market/ButtonRow";
import GameHeader from "../src/components/market/GameHeader";
import PurchaseModal from "../src/components/market/PurchaseModal";
import { Colors, Spacing, Typography } from "../src/constants/theme";
import { formatCurrency, formatSharePrice } from "../src/utils/formatters";
import StatCard from "../src/components/market/StatCard";

export default function MarketsScreen() {
  const route = useRoute();
  const market = route.params?.game || route.params?.market;

  console.log("market", market);

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

  // State for current prices from chart cursor
  const [currentPrices, setCurrentPrices] = useState(null);

  // State for chart loading
  const [chartLoading, setChartLoading] = useState(true);

  // State for time period filter
  const [selectedPeriod, setSelectedPeriod] = useState("All");

  // State for purchase modal
  const [purchaseModalVisible, setPurchaseModalVisible] = useState(false);
  const [selectedPurchase, setSelectedPurchase] = useState(null);

  // Handler for buy buttons
  const handleBuyAway = (data) => {
    setSelectedPurchase(data);
    setPurchaseModalVisible(true);
  };

  const handleBuyHome = (data) => {
    setSelectedPurchase(data);
    setPurchaseModalVisible(true);
  };

  const handleCloseModal = () => {
    // The modal handles its own close animation and calls this when done
    setPurchaseModalVisible(false);
    setSelectedPurchase(null);
  };

  // Extract timestamp - use current timestamp if available, otherwise use game date
  const timestamp = useMemo(() => {
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
    marketVolume > 0
      ? `$${Math.round(marketVolume).toLocaleString("en-US")}`
      : "$0";

  // Extract team data - similar to MarketCard implementation
  const teamData = useMemo(() => {
    if (!market) {
      return {
        awayTeamData: null,
        homeTeamData: null,
        awayName: "Away",
        homeName: "Home",
        awayAbbreviation: "Away",
        homeAbbreviation: "Home",
        awayColor: Colors.primary,
        homeColor: Colors.accentTeal,
      };
    }

    let awayTeamData = null;
    let homeTeamData = null;
    let awayName = "Away";
    let homeName = "Home";
    let awayAbbreviation = null;
    let homeAbbreviation = null;
    let awayColor = null;
    let homeColor = null;

    // First, try to get from teams array (new API format)
    if (
      market?.teams &&
      Array.isArray(market.teams) &&
      market.teams.length >= 2
    ) {
      awayTeamData = market.teams[0];
      homeTeamData = market.teams[1];
      // Prefer alias over name (alias is shorter, e.g., "Patriots" vs "New England Patriots")
      awayName = awayTeamData.alias || awayTeamData.name || "Away";
      homeName = homeTeamData.alias || homeTeamData.name || "Home";
      awayAbbreviation = awayTeamData.abbreviation?.toUpperCase() || null;
      homeAbbreviation = homeTeamData.abbreviation?.toUpperCase() || null;
      awayColor = awayTeamData.color || null;
      homeColor = homeTeamData.color || null;
    }
    // Fallback to awayTeam/homeTeam objects
    else if (market?.awayTeam || market?.homeTeam) {
      awayTeamData = market.awayTeam;
      homeTeamData = market.homeTeam;
      awayName =
        market.awayTeam?.name || market.awayTeam?.abbreviation || "Away";
      homeName =
        market.homeTeam?.name || market.homeTeam?.abbreviation || "Home";
      awayAbbreviation = market.awayTeam?.abbreviation?.toUpperCase() || null;
      homeAbbreviation = market.homeTeam?.abbreviation?.toUpperCase() || null;
      awayColor = market.awayTeam?.color || null;
      homeColor = market.homeTeam?.color || null;
    }
    // Last resort: extract from title
    else if (market?.title) {
      const titleMatch = market.title.match(/(.+?)\s+vs\.?\s+(.+)/i);
      if (titleMatch) {
        awayName = titleMatch[1].trim().replace(/\.$/, ""); // Remove trailing period
        homeName = titleMatch[2].trim().replace(/\.$/, ""); // Remove trailing period

        // Try to extract abbreviations from slug (e.g., "nba-gsw-por" -> gsw, por)
        if (market?.slug) {
          const slugParts = market.slug.split("-");
          if (slugParts.length >= 3) {
            awayAbbreviation = slugParts[1]?.toUpperCase() || null;
            homeAbbreviation = slugParts[2]?.toUpperCase() || null;
          }
        }

        // Generate abbreviations if still missing
        if (!awayAbbreviation) {
          const awayWords = awayName.split(/\s+/);
          awayAbbreviation =
            awayWords.length > 1
              ? awayWords
                  .map((w) => w[0])
                  .join("")
                  .toUpperCase()
                  .slice(0, 3)
              : awayName.substring(0, 3).toUpperCase();
        }
        if (!homeAbbreviation) {
          const homeWords = homeName.split(/\s+/);
          homeAbbreviation =
            homeWords.length > 1
              ? homeWords
                  .map((w) => w[0])
                  .join("")
                  .toUpperCase()
                  .slice(0, 3)
              : homeName.substring(0, 3).toUpperCase();
        }
      }
    }

    // Fallback abbreviations if still missing
    awayAbbreviation =
      awayAbbreviation || awayName.substring(0, 3).toUpperCase();
    homeAbbreviation =
      homeAbbreviation || homeName.substring(0, 3).toUpperCase();

    // Get team colors - use from API if available, otherwise use default colors
    const finalAwayColor = awayColor || Colors.primary;
    const finalHomeColor = homeColor || Colors.accentTeal;

    return {
      awayTeamData,
      homeTeamData,
      awayName,
      homeName,
      awayAbbreviation,
      homeAbbreviation,
      awayColor: finalAwayColor,
      homeColor: finalHomeColor,
    };
  }, [market]);

  return (
    <>
      <ScreenTemplate header={<GameHeader market={market} />}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          scrollEventThrottle={16}
        >
          <View style={[styles.chartContainerWrapper, { top: height * 0.02 }]}>
            <MyChart
              onTimestampChange={setCurrentTimestamp}
              onPriceStatsChange={setPriceStats}
              onPriceChange={setCurrentPrices}
              onLoadingChange={setChartLoading}
              awayColor={teamData.awayColor}
              homeColor={teamData.homeColor}
            />
          </View>

          {/* Volume Display - Under Chart - Only show when chart is loaded */}
          {!chartLoading && (
            <View style={styles.volumeContainer}>
              <View>
                <Text style={styles.volumeLabel}>Total Volume</Text>
                <Text style={styles.volumeValue}>{formattedVolume}</Text>
              </View>

              <View style={styles.periodFilters}>
                {["1D", "1W", "1M", "All"].map((period) => (
                  <TouchableOpacity
                    key={period}
                    style={[
                      styles.periodButton,
                      selectedPeriod === period && styles.periodButtonActive,
                    ]}
                    onPress={() => setSelectedPeriod(period)}
                  >
                    <Text
                      style={[
                        styles.periodButtonText,
                        selectedPeriod === period &&
                          styles.periodButtonTextActive,
                      ]}
                    >
                      {period}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* High/Low Prices - Under Volume */}
          {!chartLoading && priceStats && (
            <View style={styles.priceStatsContainer}>
              <Text style={styles.priceStatsTitle}>Price History</Text>

              {/* Away Team Stats */}
              <View style={styles.teamStatsCard}>
                <LinearGradient
                  colors={[
                    `${teamData.awayColor}15`,
                    `${teamData.awayColor}00`,
                  ]}
                  start={{ x: 0, y: 0.5 }}
                  end={{ x: 1, y: 0.5 }}
                  style={styles.teamStatsGradient}
                >
                  <View style={styles.teamStatsHeader}>
                    <Text style={styles.teamStatsLabel}>
                      {teamData.awayAbbreviation}
                    </Text>
                    <View
                      style={[
                        styles.teamColorIndicator,
                        { backgroundColor: teamData.awayColor },
                      ]}
                    />
                  </View>
                  <View style={styles.statsRow}>
                    <View style={styles.statItem}>
                      <Text style={styles.statLabel}>High</Text>
                      <Text style={styles.statValue}>
                        {formatSharePrice(priceStats.awayHigh)}
                      </Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statItem}>
                      <Text style={styles.statLabel}>Low</Text>
                      <Text style={styles.statValue}>
                        {formatSharePrice(priceStats.awayLow)}
                      </Text>
                    </View>
                  </View>
                </LinearGradient>
              </View>

              {/* Home Team Stats */}
              <View style={styles.teamStatsCard}>
                <LinearGradient
                  colors={[
                    `${teamData.homeColor}00`,
                    `${teamData.homeColor}15`,
                  ]}
                  start={{ x: 0, y: 0.5 }}
                  end={{ x: 1, y: 0.5 }}
                  style={styles.teamStatsGradient}
                >
                  <View style={styles.teamStatsHeader}>
                    <Text style={styles.teamStatsLabel}>
                      {teamData.homeAbbreviation}
                    </Text>
                    <View
                      style={[
                        styles.teamColorIndicator,
                        { backgroundColor: teamData.homeColor },
                      ]}
                    />
                  </View>
                  <View style={styles.statsRow}>
                    <View style={styles.statItem}>
                      <Text style={styles.statLabel}>High</Text>
                      <Text style={styles.statValue}>
                        {formatSharePrice(priceStats.homeHigh)}
                      </Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statItem}>
                      <Text style={styles.statLabel}>Low</Text>
                      <Text style={styles.statValue}>
                        {formatSharePrice(priceStats.homeLow)}
                      </Text>
                    </View>
                  </View>
                </LinearGradient>
              </View>
            </View>
          )}

          {/* Market Description */}
          {!chartLoading && market?.description && (
            <View style={styles.descriptionContainer}>
              <View style={styles.descriptionCard}>
                <View style={styles.descriptionHeader}>
                  <Text style={styles.descriptionLabel}>📋 Market Rules</Text>
                </View>
                <Text style={styles.descriptionText}>{market.description}</Text>
              </View>
            </View>
          )}

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
        {/* Left gradient for away team */}
        <LinearGradient
          colors={[`${teamData.awayColor}33`, `${teamData.awayColor}00`]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={styles.leftGradient}
          pointerEvents="none"
        />

        {/* Right gradient for home team */}
        <LinearGradient
          colors={[`${teamData.homeColor}00`, `${teamData.homeColor}33`]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={styles.rightGradient}
          pointerEvents="none"
        />

        <View style={styles.buttonRowWrapper}>
          <ButtonRow
            market={market}
            currentPrices={currentPrices}
            loading={chartLoading}
            onBuyAway={handleBuyAway}
            onBuyHome={handleBuyHome}
          />
        </View>
      </View>

      {/* Purchase Modal */}
      {selectedPurchase && (
        <PurchaseModal
          visible={purchaseModalVisible}
          onClose={handleCloseModal}
          team={selectedPurchase.team}
          price={selectedPurchase.price}
          color={selectedPurchase.color}
          market={market}
        />
      )}
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
    marginBottom: 10,
  },
  volumeContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingLeft: Spacing.xs,
    paddingRight: Spacing.xl,
    paddingTop: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  periodFilters: {
    flexDirection: "row",
    gap: Spacing.xs,
  },
  periodButton: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: 8,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  periodButtonActive: {
    backgroundColor: "#FFFFFF",
    borderColor: Colors.border,
  },
  periodButtonText: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.textSecondary,
  },
  periodButtonTextActive: {
    color: "#000000",
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
    overflow: "hidden",
  },
  leftGradient: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 150,
    zIndex: 0,
  },
  rightGradient: {
    position: "absolute",
    right: 0,
    top: 0,
    bottom: 0,
    width: 150,
    zIndex: 0,
  },
  buttonRowWrapper: {
    zIndex: 1,
    width: "100%",
  },
  volumeLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: Colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  volumeValue: {
    fontSize: 20,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  timestamp: {
    fontSize: 16,
    fontWeight: "800",
    color: Colors.textPrimary,
    marginTop: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  priceStatsContainer: {
    paddingHorizontal: -Spacing.xl,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  priceStatsTitle: {
    fontSize: 11,
    fontWeight: "600",
    color: Colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: Spacing.sm,
  },
  teamStatsCard: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.sm,
    overflow: "hidden",
  },
  teamStatsGradient: {
    padding: Spacing.md,
    borderRadius: 12,
  },
  teamStatsHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.sm,
  },
  teamStatsLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  teamColorIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: Colors.border,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: Colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  statValue: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  descriptionContainer: {
    paddingHorizontal: -200,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.lg,
  },
  descriptionCard: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
  },
  descriptionHeader: {
    marginBottom: Spacing.md,
  },
  descriptionLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  descriptionText: {
    fontSize: 14,
    fontWeight: "400",
    color: Colors.textSecondary,
    lineHeight: 22,
  },
});
