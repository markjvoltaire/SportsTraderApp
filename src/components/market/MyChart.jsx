import React, { useState, useMemo, useCallback, useEffect } from "react";
import { View, Text, StyleSheet } from "react-native";
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
import { useRoute } from "@react-navigation/native";
import API_BASE_URL from "../../config/api";
import { formatSharePrice } from "../../utils/formatters";
import { getTeamColor } from "../../utils/teamColors";
import ChartSkeleton from "./ChartSkeleton";
import { normalize, widthPercentage } from "../../utils/dimensions";

export default function MyChart({ onTimestampChange }) {
  const route = useRoute();
  const market = route.params?.game || route.params?.market;

  const chartPadding = {
    top: normalize(20),
    bottom: normalize(40),
    left: normalize(20),
    right: normalize(20), // Reduced right padding since we now flip tooltips
  };

  const chartWidth = widthPercentage(100); // use full device width for larger plot area
  const chartHeight = normalize(360);
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

        let response = await fetch(url);

        if (!response.ok && response.status === 400) {
          url = `${API_BASE_URL}/api/candlesticks/${marketData.conditionId}`;
          response = await fetch(url);
        }

        if (!response.ok) {
          throw new Error(
            `Candlesticks HTTP error! status: ${response.status}`
          );
        }

        const data = await response.json();
        let candlesticks = [];

        if (Array.isArray(data)) {
          candlesticks = data;
        } else if (data?.candlesticks && Array.isArray(data.candlesticks)) {
          candlesticks = data.candlesticks;
        } else if (data?.data && Array.isArray(data.data)) {
          candlesticks = data.data;
        }

        const extractTokenData = (tokenId) => {
          const tokenCandlesticks = [];

          candlesticks.forEach((item) => {
            let candlestickArray = null;
            let itemTokenId = null;

            if (Array.isArray(item) && item.length >= 2) {
              candlestickArray = item[0];
              const metadata = item[1];
              itemTokenId = metadata?.token_id || metadata?.tokenId || null;
            } else if (typeof item === "object" && item !== null) {
              itemTokenId = item.token_id || item.tokenId || null;
              candlestickArray = Array.isArray(item.candlesticks)
                ? item.candlesticks
                : [item];
            }

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
                  0;

                if (price > 1) price = price / 100;

                if (price > 0) {
                  tokenCandlesticks.push({
                    x: tokenCandlesticks.length,
                    y: price,
                    timestamp:
                      candle?.timestamp ||
                      candle?.time ||
                      candle?.end_period_ts ||
                      candle?.ts,
                  });
                }
              });
            }
          });

          tokenCandlesticks.sort((a, b) => a.timestamp - b.timestamp);
          return tokenCandlesticks.map((point, index) => ({
            x: index,
            y: point.y,
            timestamp: point.timestamp,
          }));
        };

        const awayHistoryData = marketData.awayTeam.tokenId
          ? extractTokenData(marketData.awayTeam.tokenId)
          : [];
        const homeHistoryData = marketData.homeTeam.tokenId
          ? extractTokenData(marketData.homeTeam.tokenId)
          : [];

        const maxLength = Math.max(
          awayHistoryData.length,
          homeHistoryData.length
        );

        while (awayHistoryData.length < maxLength) {
          const lastPrice =
            awayHistoryData.length > 0
              ? awayHistoryData[awayHistoryData.length - 1].y
              : marketData.awayTeam.price;
          awayHistoryData.push({ x: awayHistoryData.length, y: lastPrice });
        }

        while (homeHistoryData.length < maxLength) {
          const lastPrice =
            homeHistoryData.length > 0
              ? homeHistoryData[homeHistoryData.length - 1].y
              : marketData.homeTeam.price;
          homeHistoryData.push({ x: homeHistoryData.length, y: lastPrice });
        }

        setAwayHistory(awayHistoryData);
        setHomeHistory(homeHistoryData);
      } catch (err) {
        console.error("Error fetching price history:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPriceHistory();
  }, [
    marketData.conditionId,
    marketData.awayTeam.tokenId,
    marketData.homeTeam.tokenId,
  ]);

  // Process chart data from price history
  const chartData = useMemo(() => {
    if (
      !awayHistory ||
      !homeHistory ||
      awayHistory.length === 0 ||
      homeHistory.length === 0
    ) {
      return [
        {
          x: 0,
          awayPrice: marketData.awayTeam.price,
          homePrice: marketData.homeTeam.price,
          timestamp: Date.now() / 1000,
        },
      ];
    }

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

  const yDomain = useMemo(() => {
    if (!chartData || chartData.length === 0) return [0, 1];
    const allPrices = chartData.flatMap((d) => [d.awayPrice, d.homePrice]);
    const priceMin = Math.min(...allPrices);
    const priceMax = Math.max(...allPrices);
    const priceRange = priceMax - priceMin;
    const minRange = 0.1;
    const padding = Math.max(priceRange * 0.1, (minRange - priceRange) / 2);
    const domainMin = Math.max(0, priceMin - padding);
    const domainMax = Math.min(1, priceMax + padding);
    return [domainMin, domainMax];
  }, [chartData]);

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

      const clampedX = Math.max(0, Math.min(plotWidth, xPos));
      const normalizedX = clampedX / plotWidth;
      const maxIndex = chartData.length - 1;
      const dataIndex = normalizedX * maxIndex;

      const index = Math.floor(dataIndex);
      const nextIndex = Math.min(index + 1, chartData.length - 1);
      const currentPoint = chartData[index];
      const nextPoint = chartData[nextIndex];

      const t = dataIndex - index;
      const interpolatedAwayPrice =
        currentPoint.awayPrice +
        (nextPoint.awayPrice - currentPoint.awayPrice) * t;
      const interpolatedHomePrice =
        currentPoint.homePrice +
        (nextPoint.homePrice - currentPoint.homePrice) * t;
      const interpolatedTimestamp = currentPoint.timestamp
        ? currentPoint.timestamp +
          (nextPoint.timestamp - currentPoint.timestamp) * t
        : null;

      const domainPaddingY = 10;
      const effectivePlotHeight = plotHeight - domainPaddingY * 2;
      const [domainMin, domainMax] = yDomain;
      const domainRange = domainMax - domainMin || 1;

      const normalizedYAway = (interpolatedAwayPrice - domainMin) / domainRange;
      const normalizedYHome = (interpolatedHomePrice - domainMin) / domainRange;

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

  const updateCursorData = useCallback(
    (xPos) => {
      if (xPos < 0) {
        setShowTooltip(false);
        if (onTimestampChange) onTimestampChange(null);
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

      if (onTimestampChange) onTimestampChange(data.timestamp);
    },
    [getValueAtX, cursorYHigh, cursorYLow, onTimestampChange, marketData]
  );

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
          cursorX.value = plotWidth;
          runOnJS(updateCursorData)(plotWidth);
        }),
    [chartPadding.left, plotWidth, cursorX, isActive, updateCursorData]
  );

  useEffect(() => {
    if (chartData && chartData.length > 0 && cursorX.value === -1) {
      cursorX.value = plotWidth;
      updateCursorData(plotWidth);
      isActive.value = false;
      setShowTooltip(true);
    }
  }, [chartData, plotWidth, cursorX, updateCursorData, isActive]);

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
    return { opacity: chartOpacity.value };
  });

  const animatedCursorStyle = useAnimatedStyle(() => {
    const opacity = isActive.value ? 1 : cursorX.value >= 0 ? 0.5 : 0;
    return {
      opacity,
      transform: [{ translateX: cursorX.value - 1 }],
    };
  });

  // Helper to flip tooltip to left if it's too close to the right edge
  const getTooltipXPosition = (cursorValue) => {
    "worklet";
    // Check if cursor is in the right 50% of the chart
    if (cursorValue > plotWidth * 0.5) {
      return cursorValue - 90; // Shift left (approx tooltip width)
    }
    return cursorValue + 10; // Shift right
  };

  const animatedTooltipHighStyle = useAnimatedStyle(() => {
    const opacity = isActive.value ? 1 : cursorX.value >= 0 ? 0.7 : 0;
    return {
      opacity,
      transform: [
        { translateX: getTooltipXPosition(cursorX.value) },
        { translateY: cursorYHigh.value - 30 },
      ],
    };
  });

  const animatedTooltipLowStyle = useAnimatedStyle(() => {
    const opacity = isActive.value ? 1 : cursorX.value >= 0 ? 0.7 : 0;
    return {
      opacity,
      transform: [
        { translateX: getTooltipXPosition(cursorX.value) },
        { translateY: cursorYLow.value - 30 },
      ],
    };
  });

  const animatedDateTooltipStyle = useAnimatedStyle(() => {
    const opacity = isActive.value ? 1 : 0;
    // Position date at the very top of the chart
    return {
      opacity,
      transform: [
        { translateX: getTooltipXPosition(cursorX.value) - 10 },
        { translateY: 0 }, // Fixed at top of chart area
      ],
    };
  });

  const formatDateTooltip = (timestamp) => {
    if (!timestamp) return "";
    const date = new Date(timestamp * 1000);
    if (Number.isNaN(date.getTime())) return "";

    const month = date.toLocaleDateString(undefined, { month: "short" });
    const day = date.getDate();
    const time = date
      .toLocaleTimeString(undefined, {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      })
      .toLowerCase();

    return `${month} ${day}, ${time}`;
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
                    axis: { stroke: "transparent" },
                    tickLabels: { fill: "transparent" },
                    grid: { stroke: "transparent" },
                    ticks: { stroke: "transparent" },
                  }}
                />
                <VictoryAxis
                  dependentAxis
                  style={{
                    axis: { stroke: "transparent" },
                    tickLabels: { fill: "transparent" },
                    grid: { stroke: "transparent" },
                    ticks: { stroke: "transparent" },
                  }}
                />
                <VictoryLine
                  data={chartData}
                  x="x"
                  y="awayPrice"
                  interpolation="linear"
                  style={{
                    data: {
                      stroke: marketData.awayTeam.color,
                      strokeWidth: 1.5,
                      strokeLinecap: "round",
                      strokeLinejoin: "round",
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
                  interpolation="linear"
                  style={{
                    data: {
                      stroke: marketData.homeTeam.color,
                      strokeWidth: 1.5,
                      strokeLinecap: "round",
                      strokeLinejoin: "round",
                    },
                  }}
                  animate={{
                    duration: 400,
                    onLoad: { duration: 400 },
                    easing: "quadInOut",
                  }}
                />
              </VictoryChart>

              {/* Cursor Line */}
              <Animated.View
                style={[styles.cursorLine, animatedCursorStyle]}
                pointerEvents="none"
              />

              {/* Tooltips */}
              {showTooltip && (
                <>
                  {/* Date Tooltip (New) */}
                  <Animated.View
                    style={[
                      styles.tooltip,
                      styles.dateTooltip,
                      animatedDateTooltipStyle,
                    ]}
                    pointerEvents="none"
                  >
                    <Text style={styles.dateText}>
                      {formatDateTooltip(tooltipData.timestamp)}
                    </Text>
                  </Animated.View>

                  {/* Away Team Tooltip */}
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
                        styles.tooltipPrice,
                        { color: marketData.awayTeam.color },
                      ]}
                    >
                      {formatSharePrice(tooltipData.awayPrice)}
                    </Text>
                    <Text
                      style={[
                        styles.tooltipLabel,
                        { color: marketData.awayTeam.color },
                      ]}
                    >
                      {marketData.awayTeam.abbreviation}
                    </Text>
                  </Animated.View>

                  {/* Home Team Tooltip */}
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
                        styles.tooltipPrice,
                        { color: marketData.homeTeam.color },
                      ]}
                    >
                      {formatSharePrice(tooltipData.homePrice)}
                    </Text>
                    <Text
                      style={[
                        styles.tooltipLabel,
                        { color: marketData.homeTeam.color },
                      ]}
                    >
                      {marketData.homeTeam.abbreviation}
                    </Text>
                  </Animated.View>
                </>
              )}
            </View>
          </GestureDetector>
        </GestureHandlerRootView>
      </Animated.View>
    </View>
  );
}

// Calculate responsive dimensions
const chartHeight = normalize(360);
const chartMargin = normalize(24);
const cursorWidth = normalize(2);
const cursorHeight = normalize(300);
const padding = normalize(20);

const styles = StyleSheet.create({
  chartContainer: {
    width: "100%",
    height: chartHeight,
    marginVertical: chartMargin,
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
    width: "100%",
    height: chartHeight,
    position: "relative",
  },
  cursorLine: {
    position: "absolute",
    width: cursorWidth,
    backgroundColor: "rgba(255, 255, 255, 0.4)", // Lighter for dark mode usually
    height: cursorHeight,
    top: padding,
    left: padding,
    zIndex: 10,
  },
  tooltip: {
    position: "absolute",
    backgroundColor: "rgba(23, 23, 23, 0.95)", // Dark background
    padding: 8,
    borderRadius: 8,
    minWidth: 80,
    alignItems: "center",
    top: padding,
    left: padding,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    zIndex: 100, // Ensure tooltips are above everything
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  dateTooltip: {
    backgroundColor: "rgba(40, 40, 40, 0.95)",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
    zIndex: 101, // Date on top of price tooltips if they overlap
    minWidth: 100,
  },
  dateText: {
    color: "#e5e5e5",
    fontSize: 11,
    fontWeight: "600",
  },
  tooltipPrice: {
    fontWeight: "bold",
    fontSize: 16,
    marginBottom: 2,
  },
  tooltipLabel: {
    fontSize: 10,
    opacity: 0.8,
  },
  // Keep these for potential reuse or if referenced elsewhere
  tooltipHigh: {},
  tooltipLow: {},
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
});
