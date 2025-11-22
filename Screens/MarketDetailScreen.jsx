import React, { useMemo, useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRoute } from "@react-navigation/native";
import API_BASE_URL from "../src/config/api";
import { getTeamColor } from "../src/utils/teamColors";
import {
  VictoryLine,
  VictoryChart,
  VictoryAxis,
  VictoryTheme,
} from "victory-native";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const CHART_WIDTH = SCREEN_WIDTH - 32; // Minimal padding for screen edges
const CHART_HEIGHT = SCREEN_HEIGHT * 0.2; // Use 20% of screen height

/**
 * Transform market data to display format
 */
function transformMarketData(market) {
  let team1 = "Team 1";
  let team2 = "Team 2";
  let team1Color = "#552583"; // Default LAL purple
  let team2Color = "#007A33"; // Default BOS green
  let team1Price = 0.5;
  let team2Price = 0.5;
  let team1Abbreviation = null;
  let team2Abbreviation = null;

  // Extract teams from teams array (preferred)
  if (
    market?.teams &&
    Array.isArray(market.teams) &&
    market.teams.length >= 2
  ) {
    const team1Data = market.teams[0];
    const team2Data = market.teams[1];
    team1 = team1Data.name || team1Data.short || "Team 1";
    team2 = team2Data.name || team2Data.short || "Team 2";
    team1Abbreviation = team1Data.abbreviation || null;
    team2Abbreviation = team2Data.abbreviation || null;

    // Get team colors based on abbreviation or name
    team1Color = getTeamColor(team1Abbreviation, team1);
    team2Color = getTeamColor(team2Abbreviation, team2);
  }
  // Fallback: parse teams from question/title
  else if (market?.question || market?.title) {
    const title = market.question || market.title || "";
    if (title.includes(" vs ") || title.includes(" VS ")) {
      const teams = title.split(/ vs /i);
      if (teams.length === 2) {
        team1 = teams[0].trim();
        team2 = teams[1].trim();

        // Try to extract abbreviations from team names
        team1Color = getTeamColor(null, team1);
        team2Color = getTeamColor(null, team2);
      }
    }
  }

  // Extract prices from outcomePrices (JSON string)
  try {
    if (market?.outcomePrices) {
      const pricesStr =
        typeof market.outcomePrices === "string"
          ? market.outcomePrices
          : JSON.stringify(market.outcomePrices);
      const prices = JSON.parse(pricesStr);

      if (Array.isArray(prices) && prices.length >= 2) {
        team1Price = parseFloat(prices[0]) || 0.5;
        team2Price = parseFloat(prices[1]) || 0.5;
      }
    }
  } catch (e) {
    console.warn("Failed to parse outcomePrices:", e);
  }

  // Fallback: try to get prices from prices object
  if (team1Price === 0.5 && team2Price === 0.5 && market?.prices) {
    const priceValues = Object.values(market.prices);
    if (priceValues.length >= 2) {
      const price1 = parseFloat(priceValues[0]?.SELL || priceValues[0]) || 0.5;
      const price2 = parseFloat(priceValues[1]?.SELL || priceValues[1]) || 0.5;
      // Use the higher price as team1 (usually the favorite)
      if (price1 >= price2) {
        team1Price = price1;
        team2Price = price2;
      } else {
        team1Price = price2;
        team2Price = price1;
      }
    }
  }

  // Use outcomes array to match team names if available
  try {
    if (market?.outcomes) {
      const outcomesStr =
        typeof market.outcomes === "string"
          ? market.outcomes
          : JSON.stringify(market.outcomes);
      const outcomes = JSON.parse(outcomesStr);

      if (Array.isArray(outcomes) && outcomes.length >= 2) {
        // Match outcomes to team names
        const outcome1 = outcomes[0] || "";
        const outcome2 = outcomes[1] || "";

        // If team names match outcomes, use outcomes as team names
        if (
          team1 === "Team 1" ||
          outcome1.toLowerCase().includes(team1.toLowerCase().split(" ")[0])
        ) {
          team1 = outcome1;
        }
        if (
          team2 === "Team 2" ||
          outcome2.toLowerCase().includes(team2.toLowerCase().split(" ")[0])
        ) {
          team2 = outcome2;
        }
      }
    }
  } catch (e) {
    console.warn("Failed to parse outcomes:", e);
  }

  // Normalize prices to ensure they sum to 1.0
  const totalPrice = team1Price + team2Price;
  if (totalPrice > 0 && totalPrice !== 1.0) {
    team1Price = team1Price / totalPrice;
    team2Price = team2Price / totalPrice;
  }

  // If we don't have team colors yet, try to get them from team names
  if (team1Color === "#552583" && team1 !== "Team 1") {
    team1Color = getTeamColor(team1Abbreviation, team1);
  }
  if (team2Color === "#007A33" && team2 !== "Team 2") {
    team2Color = getTeamColor(team2Abbreviation, team2);
  }

  return {
    team1,
    team2,
    team1Color,
    team2Color,
    team1Price,
    team2Price,
    team1Abbreviation,
    team2Abbreviation,
  };
}

const PriceHistoryChart = ({
  market,
  yesPrice = 0.58,
  noPrice = 0.42,
  yesLabel = "LAL",
  noLabel = "BOS",
  yesColor = "#552583",
  noColor = "#007A33",
  yesHistory = null,
  noHistory = null,
  loading = false,
}) => {
  // Process history data for chart - both lines
  const yesChartData = useMemo(() => {
    if (!yesHistory || yesHistory.length === 0) {
      // Generate sample data if no history available
      const sampleData = [];
      const points = 24;

      for (let i = 0; i < points; i++) {
        const variance = (Math.random() - 0.5) * 0.08;
        const price = Math.max(0.1, Math.min(0.9, yesPrice + variance));
        sampleData.push({ x: i, y: price });
      }

      // Ensure last point is current price
      sampleData[sampleData.length - 1].y = yesPrice;

      return sampleData;
    }

    // Use actual history data - map to Victory format
    return yesHistory.map((point, index) => ({
      x: index,
      y: point.y,
    }));
  }, [yesHistory, yesPrice]);

  const noChartData = useMemo(() => {
    if (!noHistory || noHistory.length === 0) {
      // Generate sample data if no history available
      const sampleData = [];
      const points = 24;

      for (let i = 0; i < points; i++) {
        const variance = (Math.random() - 0.5) * 0.08;
        const price = Math.max(0.1, Math.min(0.9, noPrice + variance));
        sampleData.push({ x: i, y: price });
      }

      // Ensure last point is current price
      sampleData[sampleData.length - 1].y = noPrice;

      return sampleData;
    }

    // Use actual history data - map to Victory format
    return noHistory.map((point, index) => ({
      x: index,
      y: point.y,
    }));
  }, [noHistory, noPrice]);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Market Name */}
        <View style={styles.marketInfo}>
          <Text style={styles.title}>
            {yesLabel} vs {noLabel}
          </Text>
        </View>

        {/* Chart Card */}
        <View style={styles.chartCard}>
          {/* Chart */}
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={yesColor} />
              <Text style={styles.loadingText}>Loading chart...</Text>
            </View>
          ) : (
            <View style={styles.chartContainer}>
              <VictoryChart
                width={CHART_WIDTH}
                height={CHART_HEIGHT}
                padding={{ top: 10, bottom: 20, left: 30, right: 10 }}
                theme={VictoryTheme.material}
              >
                {/* X Axis */}
                <VictoryAxis
                  style={{
                    axis: { stroke: "transparent" },
                    tickLabels: { fill: "transparent" },
                    grid: { stroke: "transparent" },
                  }}
                />

                {/* Y Axis */}
                <VictoryAxis
                  dependentAxis
                  tickFormat={(t) => `${(t * 100).toFixed(0)}¢`}
                  style={{
                    axis: { stroke: "#e5e7eb" },
                    tickLabels: {
                      fill: "#9ca3af",
                      fontSize: 10,
                      fontFamily: "System",
                    },
                    grid: {
                      stroke: "#f3f4f6",
                      strokeWidth: 1,
                    },
                  }}
                  domain={[0, 1]}
                />

                {/* {yesLabel} Line */}
                <VictoryLine
                  data={yesChartData}
                  style={{
                    data: {
                      stroke: yesColor,
                      strokeWidth: 3,
                    },
                  }}
                  interpolation="natural"
                  animate={{
                    duration: 400,
                    onLoad: { duration: 400 },
                    easing: "quadInOut",
                  }}
                />

                {/* {noLabel} Line */}
                <VictoryLine
                  data={noChartData}
                  style={{
                    data: {
                      stroke: noColor,
                      strokeWidth: 3,
                    },
                  }}
                  interpolation="natural"
                  animate={{
                    duration: 400,
                    onLoad: { duration: 400 },
                    easing: "quadInOut",
                  }}
                />
              </VictoryChart>

              {/* Legend */}
              <View style={styles.legendContainer}>
                <View style={styles.legendItem}>
                  <View
                    style={[styles.legendColor, { backgroundColor: yesColor }]}
                  />
                  <Text style={styles.legendText}>{yesLabel}</Text>
                </View>
                <View style={styles.legendItem}>
                  <View
                    style={[styles.legendColor, { backgroundColor: noColor }]}
                  />
                  <Text style={styles.legendText}>{noLabel}</Text>
                </View>
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9fafb",
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  marketInfo: {
    marginBottom: 24,
  },
  title: {
    fontSize: 30,
    fontWeight: "bold",
    color: "#111827",
  },
  chartCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  chartContainer: {
    alignItems: "center",
    marginHorizontal: -6,
  },
  loadingContainer: {
    height: 180,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    color: "#9ca3af",
    fontSize: 14,
  },
  legendContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
    gap: 16,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  legendColor: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  legendText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
  },
});

// MarketDetailScreen wrapper component that receives market from route params
export default function MarketDetailScreen() {
  const route = useRoute();
  const market = route.params?.game || route.params?.market;

  const [yesHistory, setYesHistory] = useState(null);
  const [noHistory, setNoHistory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Transform market data
  const marketData = useMemo(() => {
    if (!market) {
      // Return default data if no market provided
      return {
        team1: "LAL",
        team2: "BOS",
        team1Color: "#552583",
        team2Color: "#007A33",
        team1Price: 0.58,
        team2Price: 0.42,
      };
    }
    return transformMarketData(market);
  }, [market]);

  // Extract conditionId and token IDs from market
  const { conditionId, tokenIds } = useMemo(() => {
    if (!market) return { conditionId: null, tokenIds: null };

    let conditionId = null;
    let tokenIds = null;

    try {
      // Get conditionId (required for candlesticks endpoint)
      // Dome API expects format: 0x followed by 64 hexadecimal characters
      conditionId = market.conditionId || market.condition_id || null;

      // Ensure conditionId has 0x prefix if it's a hex string
      if (conditionId && !conditionId.startsWith("0x")) {
        // If it's already a hex string without 0x, add it
        if (/^[0-9a-fA-F]{64}$/.test(conditionId)) {
          conditionId = `0x${conditionId}`;
        }
      }

      // Also extract token IDs for matching data in response
      let clobTokenIds = market.clobTokenIds;

      // If it's a string, parse it
      if (typeof clobTokenIds === "string") {
        clobTokenIds = JSON.parse(clobTokenIds);
      }

      // If it's an array with at least 2 tokens
      if (Array.isArray(clobTokenIds) && clobTokenIds.length >= 2) {
        tokenIds = {
          yesTokenId: clobTokenIds[0],
          noTokenId: clobTokenIds[1],
        };
      } else if (market.prices && typeof market.prices === "object") {
        // Fallback: try to get from prices object keys
        const priceKeys = Object.keys(market.prices);
        if (priceKeys.length >= 2) {
          tokenIds = {
            yesTokenId: priceKeys[0],
            noTokenId: priceKeys[1],
          };
        }
      }
    } catch (e) {
      console.warn("Failed to extract conditionId or token IDs:", e);
    }

    return { conditionId, tokenIds };
  }, [market]);

  // Fetch price history using candlesticks endpoint
  useEffect(() => {
    // Need conditionId for candlesticks endpoint (Dome API requirement)
    if (!conditionId) {
      console.warn("No conditionId found in market, cannot fetch candlesticks");
      setLoading(false);
      return;
    }

    const fetchPriceHistory = async () => {
      try {
        setLoading(true);
        setError(null);

        // Calculate time range (last 24 hours)
        const now = Math.floor(Date.now() / 1000);
        const startTs = now - 24 * 60 * 60; // 24 hours ago
        const endTs = now;

        // Log conditionId and token IDs for debugging
        console.log("Market data:", {
          conditionId: conditionId,
          yesTokenId: tokenIds?.yesTokenId,
          noTokenId: tokenIds?.noTokenId,
        });

        // Fetch candlesticks using conditionId (not token IDs)
        // Dome API candlesticks endpoint requires conditionId format: 0x + 64 hex chars
        let url = `${API_BASE_URL}/api/candlesticks/${conditionId}?interval=1&startTs=${startTs}&endTs=${endTs}`;
        console.log("Fetching candlesticks for conditionId:", url);

        let response = await fetch(url);

        // If 400 error, try without optional parameters
        if (!response.ok && response.status === 400) {
          console.log("400 error, trying without optional parameters...");
          url = `${API_BASE_URL}/api/candlesticks/${conditionId}`;
          console.log("Retrying with minimal URL:", url);
          response = await fetch(url);
        }

        if (!response.ok) {
          let errorText = "";
          try {
            errorText = await response.text();
          } catch (e) {
            errorText = "Could not read error response";
          }
          console.error("Candlesticks error response:", errorText);

          // Handle rate limiting specifically
          if (response.status === 429) {
            throw new Error(
              "Rate limit exceeded. The backend needs to add Dome API authentication. Please contact the backend developer."
            );
          }

          throw new Error(
            `Candlesticks HTTP error! status: ${
              response.status
            }, message: ${errorText.substring(0, 200)}`
          );
        }

        // Parse JSON response
        const data = await response.json();

        // Transform candlestick data for chart
        // Response format from Dome API: array of candlesticks for all tokens in condition
        // Each candlestick may be: [candlestick_data, token_metadata] or { token_id, prices, ... }
        let candlesticks = [];

        // Handle different response formats
        if (Array.isArray(data)) {
          candlesticks = data;
        } else if (data?.candlesticks && Array.isArray(data.candlesticks)) {
          candlesticks = data.candlesticks;
        } else if (data?.data && Array.isArray(data.data)) {
          candlesticks = data.data;
        }

        console.log("Candlesticks response structure:", {
          totalCandlesticks: candlesticks.length,
          firstItem: candlesticks[0],
          tokenIds: tokenIds,
        });

        // Extract YES and NO token data from candlesticks
        // Format: [[candlestick_array, token_metadata], ...]
        // Where candlestick_array is an array of candlestick objects
        const extractTokenData = (tokenId, label) => {
          const tokenCandlesticks = [];

          candlesticks.forEach((item) => {
            let candlestickArray = null;
            let itemTokenId = null;

            // Handle tuple format: [candlestick_array, token_metadata]
            if (Array.isArray(item) && item.length >= 2) {
              candlestickArray = item[0]; // Array of candlesticks
              const metadata = item[1]; // Metadata with token_id
              itemTokenId = metadata?.token_id || metadata?.tokenId || null;
            }
            // Handle object format: {token_id, prices, ...}
            else if (typeof item === "object" && item !== null) {
              itemTokenId = item.token_id || item.tokenId || null;
              // If it's a single object, wrap it in an array
              candlestickArray = Array.isArray(item.candlesticks)
                ? item.candlesticks
                : [item];
            }

            // Match by token ID
            if (
              itemTokenId &&
              itemTokenId.toString() === tokenId?.toString() &&
              Array.isArray(candlestickArray)
            ) {
              // Iterate through each candlestick in the array
              candlestickArray.forEach((candle, candleIndex) => {
                // Extract price from candlestick object
                const price =
                  parseFloat(candle?.close) ||
                  parseFloat(candle?.close_dollars) ||
                  parseFloat(candle?.price?.close) ||
                  parseFloat(candle?.price?.close_dollars) ||
                  parseFloat(candle?.mean) ||
                  parseFloat(candle?.mean_dollars) ||
                  parseFloat(candle?.open) ||
                  parseFloat(candle?.open_dollars) ||
                  0;

                if (price > 0) {
                  tokenCandlesticks.push({
                    x: tokenCandlesticks.length,
                    y: price,
                    timestamp:
                      candle?.timestamp ||
                      candle?.time ||
                      candle?.end_period_ts ||
                      candle?.ts ||
                      candleIndex,
                  });
                }
              });
            }
          });

          // Sort by timestamp
          tokenCandlesticks.sort((a, b) => a.timestamp - b.timestamp);

          // Re-index x values after sorting
          return tokenCandlesticks.map((point, index) => ({
            x: index,
            y: point.y,
          }));
        };

        // Extract data for YES and NO tokens
        const yesHistoryData = tokenIds?.yesTokenId
          ? extractTokenData(tokenIds.yesTokenId, "YES")
          : [];
        const noHistoryData = tokenIds?.noTokenId
          ? extractTokenData(tokenIds.noTokenId, "NO")
          : [];

        // Ensure both arrays have the same length
        const maxLength = Math.max(yesHistoryData.length, noHistoryData.length);

        // Fill missing data points
        while (yesHistoryData.length < maxLength) {
          const lastPrice =
            yesHistoryData.length > 0
              ? yesHistoryData[yesHistoryData.length - 1].y
              : marketData.team1Price;
          yesHistoryData.push({
            x: yesHistoryData.length,
            y: lastPrice,
          });
        }

        while (noHistoryData.length < maxLength) {
          const lastPrice =
            noHistoryData.length > 0
              ? noHistoryData[noHistoryData.length - 1].y
              : marketData.team2Price;
          noHistoryData.push({
            x: noHistoryData.length,
            y: lastPrice,
          });
        }

        setYesHistory(yesHistoryData);
        setNoHistory(noHistoryData);

        console.log(
          `Loaded ${yesHistoryData.length} YES and ${noHistoryData.length} NO price points`
        );
      } catch (err) {
        console.error("Error fetching price history:", err);
        setError(err.message);
        // Keep sample data on error
        setYesHistory(null);
        setNoHistory(null);
      } finally {
        setLoading(false);
      }
    };

    fetchPriceHistory();
  }, [conditionId, tokenIds, marketData]);

  return (
    <PriceHistoryChart
      yesPrice={marketData.team1Price}
      noPrice={marketData.team2Price}
      yesLabel={marketData.team1}
      noLabel={marketData.team2}
      yesColor={marketData.team1Color}
      noColor={marketData.team2Color}
      yesHistory={yesHistory}
      noHistory={noHistory}
      loading={loading}
      market={market}
    />
  );
}
