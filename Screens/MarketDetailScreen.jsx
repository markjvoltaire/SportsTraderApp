import React, { useState, useMemo, useCallback, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import {
  VictoryChart,
  VictoryLine,
  VictoryAxis,
  VictoryTheme,
} from "victory-native";
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from "react-native-gesture-handler";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  runOnJS,
  withTiming,
  Easing,
} from "react-native-reanimated";
import ScreenTemplate from "./ScreenTemplate";
import { useRoute } from "@react-navigation/native";
import API_BASE_URL from "../src/config/api";
import {
  formatSharePrice,
  formatTimestamp,
  formatDateTime,
} from "../src/utils/formatters";
import { getTeamColor } from "../src/utils/teamColors";
import MarketRules from "../src/components/market/MarketRules";
import ChartSkeleton from "../src/components/market/ChartSkeleton";

function MyChart({ onTimestampChange }) {
  const route = useRoute();
  const market = route.params?.game || route.params?.market;

  console.log("marketgdfgdf", market);

  const chartPadding = { top: 20, bottom: 40, left: 20, right: 100 };
  const chartWidth = 350;
  const chartHeight = 300;
  const plotWidth = chartWidth - chartPadding.left - chartPadding.right;
  const plotHeight = chartHeight - chartPadding.top - chartPadding.bottom;

  // Extract market data
  const marketData = useMemo(() => {
    if (!market) {
      return {
        awayTeam: {
          price: 0.5,
          tokenId: null,
          abbreviation: "Away",
          name: "Away",
          color: "#9333EA",
        },
        homeTeam: {
          price: 0.5,
          tokenId: null,
          abbreviation: "Home",
          name: "Home",
          color: "#06B6D4",
        },
        conditionId: null,
      };
    }
    const awayAbbreviation = market.awayTeam?.abbreviation || "Away";
    const homeAbbreviation = market.homeTeam?.abbreviation || "Home";
    const awayName = market.awayTeam?.name || awayAbbreviation;
    const homeName = market.homeTeam?.name || homeAbbreviation;

    return {
      awayTeam: {
        price: parseFloat(market.awayTeam?.price) || 0.5,
        tokenId: market.awayTeam?.tokenId || null,
        abbreviation: awayAbbreviation,
        name: awayName,
        color: getTeamColor(awayAbbreviation, awayName),
      },
      homeTeam: {
        price: parseFloat(market.homeTeam?.price) || 0.5,
        tokenId: market.homeTeam?.tokenId || null,
        abbreviation: homeAbbreviation,
        name: homeName,
        color: getTeamColor(homeAbbreviation, homeName),
      },
      conditionId: market.conditionId || market.condition_id || null,
    };
  }, [market]);

  // State for price history
  const [awayHistory, setAwayHistory] = useState(null);
  const [homeHistory, setHomeHistory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Gesture handling for cursor
  const cursorX = useSharedValue(-1); // -1 means hidden
  const cursorYHigh = useSharedValue(0);
  const cursorYLow = useSharedValue(0);
  const isActive = useSharedValue(false);

  // Animation for chart fade-in
  const chartOpacity = useSharedValue(0);
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipData, setTooltipData] = useState({
    index: 0,
    awayPrice: 0,
    homePrice: 0,
    timestamp: null,
    awayTeamName: "",
    homeTeamName: "",
  });

  // Fetch price history using candlesticks endpoint
  useEffect(() => {
    if (!marketData.conditionId) {
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

        // Fetch candlesticks using conditionId
        let url = `${API_BASE_URL}/api/candlesticks/${marketData.conditionId}?interval=1&startTs=${startTs}&endTs=${endTs}`;
        console.log("Fetching candlesticks for conditionId:", url);

        let response = await fetch(url);

        // If 400 error, try without optional parameters
        if (!response.ok && response.status === 400) {
          console.log("400 error, trying without optional parameters...");
          url = `${API_BASE_URL}/api/candlesticks/${marketData.conditionId}`;
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
          awayTokenId: marketData.awayTeam.tokenId,
          homeTokenId: marketData.homeTeam.tokenId,
        });

        // Extract token data from candlesticks
        const extractTokenData = (tokenId) => {
          const tokenCandlesticks = [];

          candlesticks.forEach((item) => {
            let candlestickArray = null;
            let itemTokenId = null;

            // Handle tuple format: [candlestick_array, token_metadata]
            if (Array.isArray(item) && item.length >= 2) {
              candlestickArray = item[0];
              const metadata = item[1];
              itemTokenId = metadata?.token_id || metadata?.tokenId || null;
            }
            // Handle object format: {token_id, prices, ...}
            else if (typeof item === "object" && item !== null) {
              itemTokenId = item.token_id || item.tokenId || null;
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
              candlestickArray.forEach((candle) => {
                let price =
                  parseFloat(candle?.close) ||
                  parseFloat(candle?.close_dollars) ||
                  parseFloat(candle?.price?.close) ||
                  parseFloat(candle?.price?.close_dollars) ||
                  parseFloat(candle?.mean) ||
                  parseFloat(candle?.mean_dollars) ||
                  parseFloat(candle?.open) ||
                  parseFloat(candle?.open_dollars) ||
                  0;

                // Normalize price to 0-1 range if it's in cents (0-100 range)
                if (price > 1) {
                  price = price / 100;
                }

                if (price > 0) {
                  tokenCandlesticks.push({
                    x: tokenCandlesticks.length,
                    y: price,
                    timestamp:
                      candle?.timestamp ||
                      candle?.time ||
                      candle?.end_period_ts ||
                      candle?.ts ||
                      tokenCandlesticks.length,
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
            timestamp: point.timestamp,
          }));
        };

        // Extract data for away and home teams
        const awayHistoryData = marketData.awayTeam.tokenId
          ? extractTokenData(marketData.awayTeam.tokenId)
          : [];
        const homeHistoryData = marketData.homeTeam.tokenId
          ? extractTokenData(marketData.homeTeam.tokenId)
          : [];

        // Ensure both arrays have the same length
        const maxLength = Math.max(
          awayHistoryData.length,
          homeHistoryData.length
        );

        // Fill missing data points
        while (awayHistoryData.length < maxLength) {
          const lastPrice =
            awayHistoryData.length > 0
              ? awayHistoryData[awayHistoryData.length - 1].y
              : marketData.awayTeam.price;
          awayHistoryData.push({
            x: awayHistoryData.length,
            y: lastPrice,
          });
        }

        while (homeHistoryData.length < maxLength) {
          const lastPrice =
            homeHistoryData.length > 0
              ? homeHistoryData[homeHistoryData.length - 1].y
              : marketData.homeTeam.price;
          homeHistoryData.push({
            x: homeHistoryData.length,
            y: lastPrice,
          });
        }

        setAwayHistory(awayHistoryData);
        setHomeHistory(homeHistoryData);

        console.log(
          `Loaded ${awayHistoryData.length} away and ${homeHistoryData.length} home price points`
        );
      } catch (err) {
        console.error("Error fetching price history:", err);
        setError(err.message);
        setAwayHistory(null);
        setHomeHistory(null);
      } finally {
        setLoading(false);
      }
    };

    fetchPriceHistory();
  }, [
    marketData.conditionId,
    marketData.awayTeam.tokenId,
    marketData.homeTeam.tokenId,
    marketData,
  ]);

  // Process chart data from price history
  const chartData = useMemo(() => {
    if (
      !awayHistory ||
      !homeHistory ||
      awayHistory.length === 0 ||
      homeHistory.length === 0
    ) {
      // Fallback to current prices if no history
      return [
        {
          x: 0,
          awayPrice: marketData.awayTeam.price,
          homePrice: marketData.homeTeam.price,
          timestamp: Date.now() / 1000,
        },
      ];
    }

    // Combine both histories, ensuring same length
    const maxLength = Math.max(awayHistory.length, homeHistory.length);
    const combined = [];

    for (let i = 0; i < maxLength; i++) {
      const awayPoint = awayHistory[i];
      const homePoint = homeHistory[i];

      combined.push({
        x: i,
        awayPrice: awayPoint?.y || marketData.awayTeam.price,
        homePrice: homePoint?.y || marketData.homeTeam.price,
        timestamp:
          awayPoint?.timestamp || homePoint?.timestamp || Date.now() / 1000,
      });
    }

    return combined;
  }, [awayHistory, homeHistory, marketData]);

  // Calculate y-axis domain based on actual price range to improve visibility
  const yDomain = useMemo(() => {
    if (!chartData || chartData.length === 0) {
      return [0, 1];
    }

    const allPrices = chartData.flatMap((d) => [d.awayPrice, d.homePrice]);
    const priceMin = Math.min(...allPrices);
    const priceMax = Math.max(...allPrices);
    const priceRange = priceMax - priceMin;

    // If prices are very close together, add padding to make them more visible
    // Add 10% padding on each side, but ensure minimum range of 0.1 (10 percentage points)
    const minRange = 0.1;
    const padding = Math.max(priceRange * 0.1, (minRange - priceRange) / 2);

    const domainMin = Math.max(0, priceMin - padding);
    const domainMax = Math.min(1, priceMax + padding);

    return [domainMin, domainMax];
  }, [chartData]);

  // Find the closest data point and its y position for a given x position
  const getValueAtX = useCallback(
    (xPos) => {
      if (!chartData || chartData.length === 0) {
        return {
          index: 0,
          awayPrice: marketData.awayTeam.price,
          homePrice: marketData.homeTeam.price,
          timestamp: null,
          yHigh: 0,
          yLow: 0,
        };
      }

      // Clamp x position to plot area
      const clampedX = Math.max(0, Math.min(plotWidth, xPos));
      const normalizedX = clampedX / plotWidth;

      // Convert normalized x to data index
      const maxIndex = chartData.length - 1;
      const dataIndex = normalizedX * maxIndex;

      // Find the two points that bracket the index value
      const index = Math.floor(dataIndex);
      const nextIndex = Math.min(index + 1, chartData.length - 1);
      const currentPoint = chartData[index];
      const nextPoint = chartData[nextIndex];

      // Linear interpolation
      const t = dataIndex - index;
      const interpolatedAwayPrice =
        currentPoint.awayPrice +
        (nextPoint.awayPrice - currentPoint.awayPrice) * t;
      const interpolatedHomePrice =
        currentPoint.homePrice +
        (nextPoint.homePrice - currentPoint.homePrice) * t;

      // Interpolate timestamp
      const interpolatedTimestamp = currentPoint.timestamp
        ? currentPoint.timestamp +
          (nextPoint.timestamp - currentPoint.timestamp) * t
        : null;

      // Prices are already in 0-1 range, so we can use them directly
      // VictoryChart adds domainPadding.y: 10, which affects the scale
      const domainPaddingY = 10;
      const effectivePlotHeight = plotHeight - domainPaddingY * 2;

      // Use the yDomain to normalize prices to the chart's actual domain
      const [domainMin, domainMax] = yDomain;
      const domainRange = domainMax - domainMin || 1;

      const normalizedYAway = (interpolatedAwayPrice - domainMin) / domainRange;
      const normalizedYHome = (interpolatedHomePrice - domainMin) / domainRange;

      // VictoryChart renders from top, so we need to invert the y coordinate
      const chartYAway =
        chartPadding.top +
        domainPaddingY +
        (1 - normalizedYAway) * effectivePlotHeight;
      const chartYHome =
        chartPadding.top +
        domainPaddingY +
        (1 - normalizedYHome) * effectivePlotHeight;

      return {
        index: dataIndex,
        awayPrice: interpolatedAwayPrice,
        homePrice: interpolatedHomePrice,
        timestamp: interpolatedTimestamp,
        yHigh: chartYAway,
        yLow: chartYHome,
      };
    },
    [plotWidth, plotHeight, chartPadding, chartData, marketData, yDomain]
  );

  // Update cursor data when position changes
  const updateCursorData = useCallback(
    (xPos) => {
      if (xPos < 0) {
        setShowTooltip(false);
        if (onTimestampChange) {
          onTimestampChange(null);
        }
        return;
      }

      const data = getValueAtX(xPos);
      setTooltipData({
        index: data.index,
        awayPrice: data.awayPrice,
        homePrice: data.homePrice,
        timestamp: data.timestamp,
        awayTeamName: marketData.awayTeam.abbreviation || "Away",
        homeTeamName: marketData.homeTeam.abbreviation || "Home",
      });
      cursorYHigh.value = data.yHigh;
      cursorYLow.value = data.yLow;
      setShowTooltip(true);

      // Notify parent component of timestamp change
      if (onTimestampChange) {
        onTimestampChange(data.timestamp);
      }
    },
    [getValueAtX, cursorYHigh, cursorYLow, onTimestampChange, marketData]
  );

  // Gesture handler - Pan for dragging cursor
  const panGesture = useMemo(
    () =>
      Gesture.Pan()
        .onStart((event) => {
          "worklet";
          const touchX = event.x - chartPadding.left;
          if (touchX >= 0 && touchX <= plotWidth) {
            cursorX.value = touchX;
            isActive.value = true;
            runOnJS(updateCursorData)(touchX);
          }
        })
        .onUpdate((event) => {
          "worklet";
          const touchX = event.x - chartPadding.left;
          if (touchX >= 0 && touchX <= plotWidth) {
            cursorX.value = touchX;
            runOnJS(updateCursorData)(touchX);
          }
        })
        .onEnd(() => {
          "worklet";
          isActive.value = false;
          // Return cursor to initial state (end of chart)
          cursorX.value = plotWidth;
          runOnJS(updateCursorData)(plotWidth);
        }),
    [chartPadding.left, plotWidth, cursorX, isActive, updateCursorData]
  );

  // Initialize cursor to end of chart when data is ready
  useEffect(() => {
    if (chartData && chartData.length > 0 && cursorX.value === -1) {
      // Set cursor to the right edge (end of chart)
      cursorX.value = plotWidth;
      // Update tooltip data with latest prices
      updateCursorData(plotWidth);
      // Show tooltip but with lower opacity initially
      isActive.value = false; // Will show with reduced opacity
      setShowTooltip(true);
    }
  }, [chartData, plotWidth, cursorX, updateCursorData, isActive]);

  // Fade in chart when data is loaded
  useEffect(() => {
    if (!loading && chartData && chartData.length > 0) {
      chartOpacity.value = withTiming(1, {
        duration: 400,
        easing: Easing.out(Easing.ease),
      });
    } else {
      chartOpacity.value = 0;
    }
  }, [loading, chartData, chartOpacity]);

  const animatedChartStyle = useAnimatedStyle(() => {
    return {
      opacity: chartOpacity.value,
    };
  });

  const animatedCursorStyle = useAnimatedStyle(() => {
    // Show cursor with full opacity when active, reduced opacity when inactive but visible
    const opacity = isActive.value ? 1 : cursorX.value >= 0 ? 0.5 : 0;
    return {
      opacity,
      transform: [{ translateX: cursorX.value - 1 }], // -1 to center the 2px line
    };
  });

  const animatedTooltipHighStyle = useAnimatedStyle(() => {
    const offset = 80; // Desired offset to the right

    // Calculate position (cursor + offset) - allow it to go outside chart
    const adjustedX = cursorX.value + offset;

    // Show tooltips with full opacity when active, reduced opacity when inactive but visible
    const opacity = isActive.value ? 1 : cursorX.value >= 0 ? 0.7 : 0;

    return {
      opacity,
      transform: [
        { translateX: adjustedX },
        { translateY: cursorYHigh.value - 40 }, // Position above the dot
      ],
    };
  });

  const animatedTooltipLowStyle = useAnimatedStyle(() => {
    const offset = 80; // Desired offset to the right

    // Calculate position (cursor + offset) - allow it to go outside chart
    const adjustedX = cursorX.value + offset;

    // Show tooltips with full opacity when active, reduced opacity when inactive but visible
    const opacity = isActive.value ? 1 : cursorX.value >= 0 ? 0.7 : 0;

    return {
      opacity,
      transform: [
        { translateX: adjustedX },
        { translateY: cursorYLow.value - 40 }, // Position above the dot
      ],
    };
  });

  // Animated style for date tooltip - positioned above both tooltips
  const animatedDateTooltipStyle = useAnimatedStyle(() => {
    const offset = 80; // Same offset as price tooltips
    const dateTooltipWidth = 180; // Approximate width of date tooltip
    const margin = 10; // Margin from right edge
    // Account for chart padding - tooltip base position is at chartPadding.left
    const rightEdge =
      chartWidth - chartPadding.left - dateTooltipWidth - margin;

    // Calculate desired position
    const desiredX = cursorX.value + offset;

    // Clamp to prevent going off screen on the right
    const adjustedX = Math.min(desiredX, rightEdge);

    // Position above the higher tooltip (away team) with more spacing
    const dateY = Math.min(cursorYHigh.value, cursorYLow.value) - 90;

    return {
      opacity: isActive.value ? 1 : 0,
      transform: [{ translateX: adjustedX }, { translateY: dateY }],
    };
  }, [chartWidth, chartPadding]);

  // Format date like "Nov 23, 2025 8:14 pm"
  const formatDateTooltip = (timestamp) => {
    if (!timestamp) return "";
    const date = new Date(timestamp * 1000);
    if (Number.isNaN(date.getTime())) return "";

    const month = date.toLocaleDateString(undefined, { month: "short" });
    const day = date.getDate();
    const year = date.getFullYear();
    const time = date
      .toLocaleTimeString(undefined, {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      })
      .toLowerCase();

    return `${month} ${day}, ${year} ${time}`;
  };

  return (
    <View style={styles.chartContainer}>
      {loading && (
        <View style={styles.skeletonContainer}>
          <ChartSkeleton />
        </View>
      )}
      <Animated.View
        style={[
          styles.chartAnimatedContainer,
          animatedChartStyle,
          loading && { opacity: 0 },
        ]}
        pointerEvents={loading ? "none" : "auto"}
      >
        <GestureHandlerRootView style={styles.chartContainer}>
          <GestureDetector gesture={panGesture}>
            <View style={styles.chartWrapper}>
              <VictoryChart
                theme={VictoryTheme.material}
                width={chartWidth}
                height={chartHeight}
                padding={chartPadding}
                domainPadding={{ x: 0, y: 10 }}
                domain={{ y: yDomain }}
              >
                <VictoryAxis
                  style={{
                    axis: { stroke: "transparent", strokeWidth: 0 },
                    tickLabels: { fill: "transparent" },
                    grid: { stroke: "transparent", strokeWidth: 0 },
                    ticks: { stroke: "transparent", strokeWidth: 0 },
                  }}
                />
                <VictoryAxis
                  dependentAxis
                  style={{
                    axis: { stroke: "transparent", strokeWidth: 0 },
                    tickLabels: { fill: "transparent" },
                    grid: { stroke: "transparent", strokeWidth: 0 },
                    ticks: { stroke: "transparent", strokeWidth: 0 },
                  }}
                />
                <VictoryLine
                  data={chartData}
                  x="x"
                  y="awayPrice"
                  interpolation="step"
                  style={{
                    data: {
                      stroke: marketData.awayTeam.color,
                      strokeWidth: 1.5,
                    },
                  }}
                  animate={{
                    duration: 400,
                    onLoad: { duration: 400 },
                    easing: "quadInOut",
                  }}
                />
                <VictoryLine
                  data={chartData}
                  x="x"
                  y="homePrice"
                  interpolation="step"
                  style={{
                    data: {
                      stroke: marketData.homeTeam.color,
                      strokeWidth: 1.5,
                    },
                  }}
                  animate={{
                    duration: 400,
                    onLoad: { duration: 400 },
                    easing: "quadInOut",
                  }}
                />
              </VictoryChart>
              {/* Cursor line - positioned absolutely over the chart */}
              <Animated.View
                style={[styles.cursorLine, animatedCursorStyle]}
                pointerEvents="none"
              />
            </View>
          </GestureDetector>
          {/* Tooltips showing pressed values - separate for each line */}
          {showTooltip && (
            <>
              {/* Away team price tooltip */}
              <Animated.View
                style={[
                  styles.tooltip,
                  styles.tooltipHigh,
                  animatedTooltipHighStyle,
                ]}
                pointerEvents="none"
              >
                <Text
                  style={[
                    styles.tooltipText,
                    {
                      color: marketData.awayTeam.color,
                      fontWeight: "bold",
                      fontSize: 20,
                    },
                  ]}
                >
                  {formatSharePrice(tooltipData.awayPrice)}
                </Text>
                <Text
                  style={[
                    styles.tooltipText,
                    {
                      color: marketData.awayTeam.color,
                      fontSize: 12,
                      marginTop: 4,
                      opacity: 0.8,
                    },
                  ]}
                >
                  {tooltipData.awayTeamName}
                </Text>
              </Animated.View>
              {/* Home team price tooltip */}
              <Animated.View
                style={[
                  styles.tooltip,
                  styles.tooltipLow,
                  animatedTooltipLowStyle,
                ]}
                pointerEvents="none"
              >
                <Text
                  style={[
                    styles.tooltipText,
                    {
                      color: marketData.homeTeam.color,
                      fontWeight: "bold",
                      fontSize: 20,
                    },
                  ]}
                >
                  {formatSharePrice(tooltipData.homePrice)}
                </Text>
                <Text
                  style={[
                    styles.tooltipText,
                    {
                      color: marketData.homeTeam.color,
                      fontSize: 12,
                      marginTop: 4,
                      opacity: 0.8,
                    },
                  ]}
                >
                  {tooltipData.homeTeamName}
                </Text>
              </Animated.View>
            </>
          )}
        </GestureHandlerRootView>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  chartContainer: {
    height: 300,
    marginVertical: 20,
    position: "relative",
  },
  skeletonContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  chartAnimatedContainer: {
    width: "100%",
    height: "100%",
  },
  chartWrapper: {
    width: 350,
    height: 300,
    position: "relative",
  },
  cursorLine: {
    position: "absolute",
    width: 2,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    height: 240, // Chart height (300) - top padding (20) - bottom padding (40)
    top: 20, // Top padding
    left: 20, // Left padding (matches chart padding)
  },
  tooltip: {
    position: "absolute",
    backgroundColor: "transparent",
    padding: 6,
    borderRadius: 4,
    minWidth: 80,
    alignItems: "center",
    top: 20, // Top padding
    left: 20, // Left padding (matches chart padding)
    marginLeft: -40, // Center the tooltip on the cursor
  },
  tooltipHigh: {
    // Additional styles if needed
  },
  tooltipLow: {
    // Additional styles if needed
  },
  dateTooltip: {
    // Date tooltip positioned above price tooltips
    alignItems: "flex-start",
    marginLeft: 0, // Remove centering for date tooltip
    minWidth: 180, // Ensure enough width for date text (e.g., "Nov 23, 2025 8:14 pm")
    paddingHorizontal: 8, // Add horizontal padding
    maxWidth: 200, // Prevent it from getting too wide
  },
  tooltipText: {
    color: "white",
    fontSize: 12,
    marginVertical: 2,
  },
  loadingContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.9)",
  },
  loadingText: {
    marginTop: 12,
    color: "#666",
    fontSize: 14,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  chartContainerWrapper: {
    marginBottom: 20,
  },
});

export default function MarketsScreen() {
  const route = useRoute();
  const market = route.params?.game || route.params?.market;

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

  return (
    <ScreenTemplate title={marketTitle} description={marketDescription}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.chartContainerWrapper}>
          <MyChart onTimestampChange={setCurrentTimestamp} />
        </View>
        <MarketRules />
      </ScrollView>
    </ScreenTemplate>
  );
}
