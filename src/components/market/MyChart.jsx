import React, {
  useState,
  useMemo,
  useCallback,
  useEffect,
  useRef,
} from "react";
import { View, Text, StyleSheet, Dimensions } from "react-native";
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
import * as Haptics from "expo-haptics";
import ChartSkeleton from "./ChartSkeleton";
import { normalize, widthPercentage } from "../../utils/dimensions";
import {
  Colors,
  Spacing,
  BorderRadius,
  Typography,
} from "../../constants/theme";
import LottieView from "lottie-react-native";

// Lighten a hex color by mixing with white (amount 0-1)
const lightenColor = (hex, amount = 0.2) => {
  if (typeof hex !== "string") return hex;
  const normalized = hex.replace("#", "");
  if (![3, 6].includes(normalized.length)) return hex;

  const full =
    normalized.length === 3
      ? normalized
          .split("")
          .map((c) => c + c)
          .join("")
      : normalized;

  const num = parseInt(full, 16);
  if (Number.isNaN(num)) return hex;

  const r = (num >> 16) & 0xff;
  const g = (num >> 8) & 0xff;
  const b = num & 0xff;

  const mix = (channel) =>
    Math.min(255, Math.round(channel + (255 - channel) * amount));

  const toHex = (channel) => channel.toString(16).padStart(2, "0");

  return `#${toHex(mix(r))}${toHex(mix(g))}${toHex(mix(b))}`;
};

export default function MyChart({
  market: marketProp,
  event,
  candlestickData,
  onTimestampChange,
  onPriceStatsChange,
  onPriceChange,
  onLoadingChange,
  timeFrame = "24H",
  awayColor,
  homeColor,
  colorBoost = 0.22,
}) {
  const route = useRoute();
  // Prefer explicitly passed market; fall back to navigation params
  const market = marketProp || route.params?.game || route.params?.market;
  const { width, height } = Dimensions.get("window");

  // State for price history - now process candlestickData directly
  const [awayHistory, setAwayHistory] = useState(null);
  const [homeHistory, setHomeHistory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // Process candlestickData when it changes
  useEffect(() => {
    if (!candlestickData?.market_candlesticks) {
      setLoading(true);
      return;
    }

    const extractTeamData = (teamData, teamIndex) => {
      const processedData = [];

      teamData.forEach((point, pointIndex) => {
        let price =
          parseFloat(point.price?.close) ||
          parseFloat(point.price?.close_dollars) ||
          0;

        if (price > 1) price = price / 100;

        if (price > 0) {
          processedData.push({
            x: pointIndex,
            y: price,
            timestamp: point.end_period_ts || point.timestamp || point.time,
          });
        }
      });

      return processedData;
    };

    // Extract data for both teams
    const team1Data = candlestickData.market_candlesticks[0]
      ? extractTeamData(candlestickData.market_candlesticks[0], 0)
      : [];
    const team2Data = candlestickData.market_candlesticks[1]
      ? extractTeamData(candlestickData.market_candlesticks[1], 1)
      : [];

    // Ensure both teams have the same number of data points
    const maxLength = Math.max(team1Data.length, team2Data.length);

    // Pad shorter arrays with last known values
    while (team1Data.length < maxLength) {
      const lastPrice =
        team1Data.length > 0 ? team1Data[team1Data.length - 1].y : 0.5;
      const lastTimestamp =
        team1Data.length > 0 ? team1Data[team1Data.length - 1].timestamp : null;
      team1Data.push({
        x: team1Data.length,
        y: lastPrice,
        timestamp: lastTimestamp,
      });
    }

    while (team2Data.length < maxLength) {
      const lastPrice =
        team2Data.length > 0 ? team2Data[team2Data.length - 1].y : 0.5;
      const lastTimestamp =
        team2Data.length > 0 ? team2Data[team2Data.length - 1].timestamp : null;
      team2Data.push({
        x: team2Data.length,
        y: lastPrice,
        timestamp: lastTimestamp,
      });
    }

    setAwayHistory(team1Data);
    setHomeHistory(team2Data);
    setLoading(false);
  }, [candlestickData]);

  const chartPadding = {
    top: Spacing.md,
    bottom: Spacing.md,
    left: Spacing.xl,
    right: Spacing.xl,
  };

  // Use full screen width minus horizontal padding from parent
  const chartWidth = width; // Use full device width
  const chartHeight = normalize(200);
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
          color: "#FFFFFF",
        },
        conditionId: null,
      };
    }

    // Try multiple ways to get conditionId
    const conditionId =
      market.conditionId ||
      market.condition_id ||
      market.id || // Sometimes id is the conditionId
      null;

    // Handle new API format with teamTokenIds array
    let awayTokenId = null;
    let homeTokenId = null;
    let awayName = "Away";
    let homeName = "Home";
    let awayAbbreviation = "Away";
    let homeAbbreviation = "Home";

    // Try to derive names from event when provided
    if (event?.markets && event.markets.length >= 2) {
      const firstMarket = event.markets[0];
      const secondMarket = event.markets[1];
      if (firstMarket.yesSubTitle && secondMarket.yesSubTitle) {
        homeName = firstMarket.yesSubTitle;
        awayName = secondMarket.yesSubTitle;
      }
    } else if (event?.title) {
      const atMatch = event.title.match(/(.+?)\s+at\s+(.+)/i);
      const vsMatch = event.title.match(/(.+?)\s+vs\.?\s+(.+)/i);
      if (atMatch) {
        awayName = atMatch[1].trim();
        homeName = atMatch[2].trim();
      } else if (vsMatch) {
        awayName = vsMatch[1].trim();
        homeName = vsMatch[2].trim();
      }
    }

    if (
      market.teamTokenIds &&
      Array.isArray(market.teamTokenIds) &&
      market.teamTokenIds.length >= 2
    ) {
      // New format: extract tokenIds from array
      awayTokenId = market.teamTokenIds[0]?.toString() || null;
      homeTokenId = market.teamTokenIds[1]?.toString() || null;

      // Extract team names from title (e.g., "Suns vs. Thunder")
      if (market.title && awayName === "Away" && homeName === "Home") {
        const titleMatch = market.title.match(/(.+?)\s+vs\.?\s+(.+)/i);
        if (titleMatch) {
          awayName = titleMatch[1].trim();
          homeName = titleMatch[2].trim();
          awayAbbreviation = awayName.substring(0, 3).toUpperCase();
          homeAbbreviation = homeName.substring(0, 3).toUpperCase();
        }
      }
    } else if (
      market?.teams &&
      Array.isArray(market.teams) &&
      market.teams.length >= 2
    ) {
      awayTeamData = market.teams[0];
      homeTeamData = market.teams[1];
      awayName = awayTeamData.alias || awayTeamData.name || awayName;
      homeName = homeTeamData.alias || homeTeamData.name || homeName;
      awayAbbreviation =
        awayTeamData.abbreviation?.toUpperCase() || awayAbbreviation;
      homeAbbreviation =
        homeTeamData.abbreviation?.toUpperCase() || homeAbbreviation;
      awayColor = awayTeamData.color || awayColor;
      homeColor = homeTeamData.color || homeColor;
    } else if (market?.awayTeam || market?.homeTeam) {
      awayTeamData = market.awayTeam;
      homeTeamData = market.homeTeam;

      const candidateAwayName =
        market.awayTeam?.name || market.awayTeam?.abbreviation;
      const candidateHomeName =
        market.homeTeam?.name || market.homeTeam?.abbreviation;
      awayName = candidateAwayName || awayName;
      homeName = candidateHomeName || homeName;
      awayAbbreviation =
        market.awayTeam?.abbreviation?.toUpperCase() || awayAbbreviation;
      homeAbbreviation =
        market.homeTeam?.abbreviation?.toUpperCase() || homeAbbreviation;
      awayColor = market.awayTeam?.color || awayColor;
      homeColor = market.homeTeam?.color || homeColor;
      awayTokenId =
        market.awayTeam?.tokenId || market.awayTeam?.token_id || awayTokenId;
      homeTokenId =
        market.homeTeam?.tokenId || market.homeTeam?.token_id || homeTokenId;
    }

    // Refresh abbreviations from names if they weren't set from market
    if (!awayAbbreviation && awayName) {
      awayAbbreviation = awayName.substring(0, 3).toUpperCase();
    }
    if (!homeAbbreviation && homeName) {
      homeAbbreviation = homeName.substring(0, 3).toUpperCase();
    }

    const displayAwayColor = lightenColor(
      awayColor || Colors.primary,
      colorBoost
    );
    const displayHomeColor = lightenColor(
      homeColor || Colors.accentTeal,
      colorBoost
    );

    return {
      awayTeam: {
        price: parseFloat(market.awayTeam?.price) || 0.5,
        tokenId: awayTokenId,
        abbreviation: awayAbbreviation,
        name: awayName,
        color: displayAwayColor,
      },
      homeTeam: {
        price: parseFloat(market.homeTeam?.price) || 0.5,
        tokenId: homeTokenId,
        abbreviation: homeAbbreviation,
        name: homeName,
        color: displayHomeColor,
      },
      conditionId: conditionId,
    };
  }, [market, awayColor, homeColor, event, colorBoost]);

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

  // Process chart data from price history
  const chartData = useMemo(() => {
    // Don't show default 0.5/0.5 - only show chart when we have actual data
    if (
      !awayHistory ||
      !homeHistory ||
      awayHistory.length === 0 ||
      homeHistory.length === 0
    ) {
      // Return empty array - chart will show skeleton/loading state
      return [];
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

  // Determine animation settings based on data size for better performance
  const animationConfig = useMemo(() => {
    const dataSize = chartData.length;

    // For very large datasets, disable animation entirely but use smooth interpolation
    if (dataSize > 500) {
      return {
        enabled: false,
        interpolation: "natural", // Smooth natural spline interpolation
      };
    }

    // For medium datasets, use shorter animation with smooth interpolation
    if (dataSize > 200) {
      return {
        enabled: true,
        duration: 600,
        interpolation: "natural", // Smooth natural spline interpolation
      };
    }

    // For small datasets, use full animation with smooth interpolation
    return {
      enabled: true,
      duration: 450,
      interpolation: "cardinal", // Very smooth cardinal spline
    };
  }, [chartData.length]);

  // Calculate high/low prices for each contract
  const priceStats = useMemo(() => {
    if (!chartData || chartData.length === 0) {
      return {
        awayHigh: marketData.awayTeam.price,
        awayLow: marketData.awayTeam.price,
        homeHigh: marketData.homeTeam.price,
        homeLow: marketData.homeTeam.price,
        awayOpen: marketData.awayTeam.price,
        homeOpen: marketData.homeTeam.price,
        openingTimestamp: null,
      };
    }

    const awayPrices = chartData.map((d) => d.awayPrice).filter((p) => p > 0);
    const homePrices = chartData.map((d) => d.homePrice).filter((p) => p > 0);

    // Get opening prices (first data point) and opening timestamp
    // Since chartData is built from sorted history, the first point has the earliest timestamp
    const firstDataPoint = chartData[0];
    const openingTimestamp = firstDataPoint?.timestamp || null;

    return {
      awayHigh:
        awayPrices.length > 0
          ? Math.max(...awayPrices)
          : marketData.awayTeam.price,
      awayLow:
        awayPrices.length > 0
          ? Math.min(...awayPrices)
          : marketData.awayTeam.price,
      homeHigh:
        homePrices.length > 0
          ? Math.max(...homePrices)
          : marketData.homeTeam.price,
      homeLow:
        homePrices.length > 0
          ? Math.min(...homePrices)
          : marketData.homeTeam.price,
      awayOpen: firstDataPoint?.awayPrice || marketData.awayTeam.price,
      homeOpen: firstDataPoint?.homePrice || marketData.homeTeam.price,
      openingTimestamp,
    };
  }, [chartData, marketData]);

  // Pass price stats to parent component
  useEffect(() => {
    if (onPriceStatsChange && !loading) {
      onPriceStatsChange(priceStats);
    }
  }, [priceStats, loading, onPriceStatsChange]);

  const yDomain = useMemo(() => {
    if (!chartData || chartData.length === 0) return [0, 1];
    const allPrices = chartData
      .flatMap((d) => [d.awayPrice, d.homePrice])
      .filter((p) => p > 0 && p <= 1);

    if (allPrices.length === 0) return [0, 1];

    const priceMin = Math.min(...allPrices);
    const priceMax = Math.max(...allPrices);
    const priceRange = priceMax - priceMin;

    // Reduced padding to bring lines closer together: 2% of the range, with a minimum of 0.01
    const paddingPercent = 0.02; // 2% padding
    const minPadding = 0.01; // Minimum 1% padding
    const padding = Math.max(priceRange * paddingPercent, minPadding);

    const domainMin = Math.max(0, priceMin - padding);
    const domainMax = Math.min(1, priceMax + padding);

    // Ensure we have a valid range
    if (domainMax <= domainMin) {
      return [Math.max(0, priceMin - 0.1), Math.min(1, priceMax + 0.1)];
    }

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

  // Throttle cursor updates for better performance with large datasets
  const lastUpdateTimeRef = useRef(0);
  const THROTTLE_MS = 16; // ~60fps

  // Track last data point index for haptic feedback
  const lastDataIndexRef = useRef(-1);
  const lastHapticTimeRef = useRef(0);
  const HAPTIC_INTERVAL_MS = 50; // Minimum time between haptics (20 haptics per second max)

  const updateCursorData = useCallback(
    (xPos) => {
      if (xPos < 0) {
        setShowTooltip(false);
        if (onTimestampChange) onTimestampChange(null);
        lastDataIndexRef.current = -1;
        return;
      }

      // Throttle updates for large datasets
      const now = Date.now();
      if (
        chartData.length > 200 &&
        now - lastUpdateTimeRef.current < THROTTLE_MS
      ) {
        return;
      }
      lastUpdateTimeRef.current = now;

      const data = getValueAtX(xPos);
      const currentDataIndex = Math.floor(data.index);

      // Trigger haptic feedback when crossing data point boundaries
      if (
        currentDataIndex !== lastDataIndexRef.current &&
        currentDataIndex >= 0 &&
        currentDataIndex < chartData.length &&
        now - lastHapticTimeRef.current >= HAPTIC_INTERVAL_MS
      ) {
        lastDataIndexRef.current = currentDataIndex;
        lastHapticTimeRef.current = now;
        // Use light impact for smooth scrolling feel
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }

      setTooltipData({
        index: data.index,
        awayPrice: data.awayPrice,
        homePrice: data.homePrice,
        timestamp: data.timestamp,
        awayTeamName: marketData.awayTeam.name || "Away",
        homeTeamName: marketData.homeTeam.name || "Home",
      });
      cursorYHigh.value = data.yHigh;
      cursorYLow.value = data.yLow;
      setShowTooltip(true);

      if (onTimestampChange) onTimestampChange(data.timestamp);
      if (onPriceChange) {
        onPriceChange({
          awayPrice: data.awayPrice,
          homePrice: data.homePrice,
        });
      }
    },
    [
      getValueAtX,
      cursorYHigh,
      cursorYLow,
      onTimestampChange,
      onPriceChange,
      marketData,
      chartData.length,
    ]
  );

  const triggerHapticStart = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, []);

  const panGesture = useMemo(
    () =>
      Gesture.Pan()
        .onStart((event) => {
          "worklet";
          const touchX = event.x - chartPadding.left;
          if (touchX >= 0 && touchX <= plotWidth) {
            cursorX.value = touchX;
            isActive.value = true;
            runOnJS(triggerHapticStart)();
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
    [
      chartPadding.left,
      plotWidth,
      cursorX,
      isActive,
      updateCursorData,
      triggerHapticStart,
    ]
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

  // Calculate normalized values outside of worklets (worklets can't call JS functions)
  const tooltipOffset = normalize(42); // Reduced to bring tooltips closer to chart lines
  const dateTooltipBottom = normalize(-20);
  const minSpacing = normalize(12); // Spacing.md value
  const dateTooltipOffset = normalize(10);
  const dateTooltipXOffset = normalize(8); // Spacing.sm value
  const tooltipWidth = 110; // Approximate tooltip width (increased for longer names)
  const tooltipMargin = normalize(8); // Spacing.sm value

  const animatedCursorStyle = useAnimatedStyle(() => {
    const opacity = isActive.value ? 1 : cursorX.value >= 0 ? 0.6 : 0;
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
      return cursorValue - tooltipWidth; // Shift left (approx tooltip width)
    }
    return cursorValue + tooltipMargin; // Shift right
  };

  const animatedTooltipHighStyle = useAnimatedStyle(() => {
    const opacity = isActive.value ? 1 : cursorX.value >= 0 ? 0.8 : 0;
    // Calculate tooltip Y position - offset above the line
    const tooltipY = cursorYHigh.value - tooltipOffset;
    // If tooltip is too close to top, shift it down to avoid date tooltip overlap
    const adjustedY =
      tooltipY < dateTooltipBottom + minSpacing
        ? dateTooltipBottom + minSpacing
        : tooltipY;
    return {
      opacity,
      transform: [
        { translateX: getTooltipXPosition(cursorX.value) },
        { translateY: adjustedY },
      ],
    };
  });

  const animatedTooltipLowStyle = useAnimatedStyle(() => {
    const opacity = isActive.value ? 1 : cursorX.value >= 0 ? 0.8 : 0;
    return {
      opacity,
      transform: [
        { translateX: getTooltipXPosition(cursorX.value) },
        { translateY: cursorYLow.value - tooltipOffset },
      ],
    };
  });

  const animatedDateTooltipStyle = useAnimatedStyle(() => {
    const opacity = isActive.value ? 1 : 0;
    // Position date above the chart area to avoid overlapping with price tooltips
    return {
      opacity,
      transform: [
        {
          translateX: getTooltipXPosition(cursorX.value) - dateTooltipXOffset,
        },
        { translateY: -dateTooltipOffset },
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

  const formatCurrency = (value) => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(2)}M`;
    return `$${value.toLocaleString()}`;
  };

  return (
    <View style={styles.chartContainer}>
      {loading && (
        <View style={styles.skeletonContainer}>
          <LottieView
            source={require("../../../assets/lottie/Loading.json")}
            autoPlay
            loop
            style={{ height: 200, width: 200 }}
          />
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
                domainPadding={{ x: 0, y: 2 }}
                domain={{ y: yDomain }}
                scale={{ x: "linear", y: "linear" }}
                style={{
                  background: { fill: Colors.background },
                }}
              >
                <VictoryAxis
                  style={{
                    axis: { stroke: "transparent" },
                    tickLabels: { fill: "transparent" },
                    grid: {
                      stroke: "transparent",
                    },
                    ticks: { stroke: "transparent" },
                  }}
                />
                <VictoryAxis
                  dependentAxis
                  style={{
                    axis: { stroke: "transparent" },
                    tickLabels: { fill: "transparent" },
                    grid: {
                      stroke: "transparent",
                    },
                    ticks: { stroke: "transparent" },
                  }}
                />
                {chartData.length > 0 && [
                  <VictoryLine
                    key="away"
                    data={chartData}
                    x="x"
                    y="awayPrice"
                    interpolation={animationConfig.interpolation}
                    style={{
                      data: {
                        stroke: marketData.awayTeam.color,
                        strokeWidth: 2,
                        strokeLinecap: "round",
                        strokeLinejoin: "round",
                        strokeDasharray: "0",
                      },
                    }}
                    animate={
                      animationConfig.enabled
                        ? {
                            duration: animationConfig.duration,
                            onLoad: { duration: animationConfig.duration },
                            easing: "back",
                          }
                        : undefined
                    }
                  />,
                  <VictoryLine
                    key="home"
                    data={chartData}
                    x="x"
                    y="homePrice"
                    interpolation={animationConfig.interpolation}
                    style={{
                      data: {
                        stroke: marketData.homeTeam.color,
                        strokeWidth: 2,
                        strokeLinecap: "round",
                        strokeLinejoin: "round",
                        strokeDasharray: "0",
                      },
                    }}
                    animate={
                      animationConfig.enabled
                        ? {
                            duration: animationConfig.duration,
                            onLoad: { duration: animationConfig.duration },
                            easing: "back",
                          }
                        : undefined
                    }
                  />,
                ]}
              </VictoryChart>

              {/* Cursor Line */}
              <Animated.View
                style={[styles.cursorLine, animatedCursorStyle]}
                pointerEvents="none"
              />

              {/* Tooltips */}
              {showTooltip && (
                <>
                  {/* Date Tooltip */}
                  <Animated.View
                    style={[
                      styles.dateTooltip,
                      animatedDateTooltipStyle,
                      {
                        top: padding,
                        left: padding,
                      },
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
                      { borderLeftColor: marketData.awayTeam.color },
                    ]}
                    pointerEvents="none"
                  >
                    <Text
                      style={[
                        styles.tooltipPrice,
                        { color: marketData.awayTeam.color },
                      ]}
                    >
                      {`${Math.round(
                        (Number(tooltipData.awayPrice) || 0) * 100
                      )}%`}
                    </Text>
                    <Text
                      style={styles.tooltipLabel}
                      numberOfLines={2}
                      ellipsizeMode="tail"
                    >
                      {marketData.awayTeam.name}
                    </Text>
                  </Animated.View>

                  {/* Home Team Tooltip */}
                  <Animated.View
                    style={[
                      styles.tooltip,
                      styles.tooltipLow,
                      animatedTooltipLowStyle,
                      { borderLeftColor: marketData.homeTeam.color },
                    ]}
                    pointerEvents="none"
                  >
                    <Text
                      style={[
                        styles.tooltipPrice,
                        { color: marketData.homeTeam.color },
                      ]}
                    >
                      {`${Math.round(
                        (Number(tooltipData.homePrice) || 0) * 100
                      )}%`}
                    </Text>
                    <Text
                      style={styles.tooltipLabel}
                      numberOfLines={2}
                      ellipsizeMode="tail"
                    >
                      {marketData.homeTeam.name}
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
const chartMargin = Spacing.sm;
const cursorWidth = normalize(2);
const cursorHeight = normalize(180);
const padding = Spacing.xl;

const styles = StyleSheet.create({
  chartContainer: {
    width: "100%",
    position: "relative",
    backgroundColor: Colors.background,
  },
  skeletonContainer: {
    position: "absolute",
    top: 0,
    left: 10,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  chartAnimatedContainer: {
    width: "100%",
  },
  chartWrapper: {
    width: "100%",
    position: "relative",
    bottom: Spacing.md,
  },
  cursorLine: {
    position: "absolute",
    width: cursorWidth,
    backgroundColor: Colors.textPrimary,
    opacity: 0.5,
    height: cursorHeight,
    top: padding - 10,
    left: padding,
    zIndex: 10,
  },
  tooltip: {
    position: "absolute",
    backgroundColor: "transparent",
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    minWidth: 100,
    maxWidth: 200,
    alignItems: "center",
    justifyContent: "center",
    top: padding,
    left: padding,
    borderWidth: 0,
    borderLeftWidth: 0,
    zIndex: 100,
    shadowColor: "transparent",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  dateTooltip: {
    position: "absolute",
    backgroundColor: "transparent",
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.sm,
    zIndex: 101,
    minWidth: 100,
  },
  dateText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    fontWeight: "600",
    bottom: 15,
  },
  tooltipPrice: {
    ...Typography.bodyLarge,
    fontWeight: "700",
    marginBottom: Spacing.xs / 2,
    color: Colors.textPrimary,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
    overflow: "hidden",
  },
  tooltipLabel: {
    ...Typography.label,
    fontSize: 10,
    color: "#FFFFFF",
    textAlign: "center",
    fontWeight: "900",
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
    backgroundColor: Colors.background,
  },
});
