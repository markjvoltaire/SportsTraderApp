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
import * as Haptics from "expo-haptics";
import { normalize } from "../../utils/dimensions";
import {
  Colors,
  Spacing,
  BorderRadius,
  Typography,
} from "../../constants/theme";
import ChartSkeleton from "./ChartSkeleton";
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

const WEBSOCKET_URL = "wss://dev-prediction-markets-api.dflow.net/api/v1/ws";

export default function EventChartData({
  candlestickData1,
  candlestickData2,
  candlestickData3,
  market1Name = "Market 1",
  market2Name = "Market 2",
  market3Name = "Market 3",
  market1Color = "#9333EA",
  market2Color = "#3B82F6",
  market3Color = "#10B981",
  colorBoost = 0.22,
  market1Ticker = null,
  market2Ticker = null,
  market3Ticker = null,
}) {
  const { width } = Dimensions.get("window");

  // State for price history for each market
  const [history1, setHistory1] = useState(null);
  const [history2, setHistory2] = useState(null);
  const [history3, setHistory3] = useState(null);
  const [loading, setLoading] = useState(true);

  // WebSocket ref and previous prices tracking
  const tradesWsRef = useRef(null);
  const previousPricesRef = useRef({
    market1: null,
    market2: null,
    market3: null,
  });
  const PRICE_CHANGE_THRESHOLD = 0.001; // 0.1% change threshold

  // Process candlestick data when it changes
  useEffect(() => {
    // Set loading to true if we don't have all data or if arrays are empty
    if (
      !candlestickData1 ||
      !candlestickData2 ||
      !candlestickData3 ||
      !Array.isArray(candlestickData1) ||
      !Array.isArray(candlestickData2) ||
      !Array.isArray(candlestickData3) ||
      candlestickData1.length === 0 ||
      candlestickData2.length === 0 ||
      candlestickData3.length === 0
    ) {
      setLoading(true);
      return;
    }

    const extractMarketData = (marketData, marketIndex) => {
      const processedData = [];

      // Ensure marketData is an array
      if (!marketData || !Array.isArray(marketData)) {
        console.warn(
          `Market data at index ${marketIndex} is not an array:`,
          marketData
        );
        return processedData;
      }

      marketData.forEach((point, pointIndex) => {
        // Try to get yes price from various possible structures
        // Priority: yes_bid.close_dollars > yes_bid.close > yes_ask.close_dollars > yes_ask.close
        // Then fall back to other formats
        let price =
          parseFloat(point.yes_bid?.close_dollars) ||
          parseFloat(point.yes_bid?.close) ||
          parseFloat(point.yes_ask?.close_dollars) ||
          parseFloat(point.yes_ask?.close) ||
          parseFloat(point.price?.yes) ||
          parseFloat(point.price?.yesPrice) ||
          parseFloat(point.yes) ||
          parseFloat(point.price?.close) ||
          parseFloat(point.price?.close_dollars) ||
          parseFloat(point.close) ||
          parseFloat(point.close_dollars) ||
          0;

        // Handle different price formats:
        // - If price is > 1, it might be in cents or percentage, convert to decimal
        // - If price is between 0 and 1, it's already in decimal format
        if (price > 1) {
          price = price / 100;
        }

        // Ensure price is between 0 and 1
        if (price > 1) price = 1;
        if (price < 0) price = 0;

        // Log first few points for debugging
        if (pointIndex < 3 && marketIndex === 0) {
          console.log(`Market ${marketIndex + 1} Point ${pointIndex}:`, {
            yesBidClose: point.yes_bid?.close,
            yesBidCloseDollars: point.yes_bid?.close_dollars,
            yesAskClose: point.yes_ask?.close,
            yesAskCloseDollars: point.yes_ask?.close_dollars,
            processedPrice: price,
            pricePercent: (price * 100).toFixed(2) + "%",
          });
        }

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

    // Log raw data structure for first market to debug
    if (candlestickData1 && candlestickData1.length > 0) {
      console.log(
        "Sample candlestick data point (Market 1):",
        JSON.stringify(candlestickData1[0], null, 2)
      );
    }

    // Extract data for all 3 markets
    const market1Data = candlestickData1
      ? extractMarketData(candlestickData1, 0)
      : [];
    const market2Data = candlestickData2
      ? extractMarketData(candlestickData2, 1)
      : [];
    const market3Data = candlestickData3
      ? extractMarketData(candlestickData3, 2)
      : [];

    // Ensure all markets have the same number of data points
    const maxLength = Math.max(
      market1Data.length,
      market2Data.length,
      market3Data.length
    );

    // Pad shorter arrays with last known values
    const padArray = (arr, targetLength) => {
      const padded = [...arr];
      while (padded.length < targetLength) {
        const lastPrice = padded.length > 0 ? padded[padded.length - 1].y : 0.5;
        const lastTimestamp =
          padded.length > 0 ? padded[padded.length - 1].timestamp : null;
        padded.push({
          x: padded.length,
          y: lastPrice,
          timestamp: lastTimestamp,
        });
      }
      return padded;
    };

    const padded1 = padArray(market1Data, maxLength);
    const padded2 = padArray(market2Data, maxLength);
    const padded3 = padArray(market3Data, maxLength);

    // Only set loading to false if we have valid data
    if (
      maxLength > 0 &&
      (padded1.length > 0 || padded2.length > 0 || padded3.length > 0)
    ) {
      setHistory1(padded1);
      setHistory2(padded2);
      setHistory3(padded3);
      setLoading(false);
    } else {
      // If no data, keep loading state
      setLoading(true);
    }
  }, [candlestickData1, candlestickData2, candlestickData3]);

  // WebSocket connection for trades - updates chart data when percentages change
  useEffect(() => {
    const marketTickers = [market1Ticker, market2Ticker, market3Ticker].filter(
      (ticker) => ticker !== null && ticker !== undefined
    );

    if (marketTickers.length === 0) return;

    const ws = new WebSocket(WEBSOCKET_URL);

    ws.onopen = () => {
      // Subscribe to trades channel for all market tickers
      ws.send(
        JSON.stringify({
          type: "subscribe",
          channel: "trades",
          tickers: marketTickers,
        })
      );
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);

        if (message.channel === "trades") {
          const ticker = message.market_ticker;
          const yesPrice = parseFloat(message.yes_price_dollars) || 0;
          const noPrice = parseFloat(message.no_price_dollars) || 0;

          // Determine which market this trade belongs to
          let marketIndex = -1;
          if (ticker === market1Ticker) marketIndex = 0;
          else if (ticker === market2Ticker) marketIndex = 1;
          else if (ticker === market3Ticker) marketIndex = 2;

          if (marketIndex === -1) return;

          // Use yes_price_dollars for the market (convert to 0-1 range if needed)
          let price = yesPrice;
          if (price > 1) price = price / 100; // Convert from percentage to decimal
          if (price > 1) price = 1; // Cap at 1
          if (price < 0) price = 0; // Cap at 0

          // Get the previous price for this market
          const prevPriceKey = `market${marketIndex + 1}`;
          const previousPrice = previousPricesRef.current[prevPriceKey];

          // Only update if the percentage has changed significantly
          const priceChanged =
            previousPrice === null ||
            Math.abs(price - previousPrice) >= PRICE_CHANGE_THRESHOLD;

          if (priceChanged) {
            // Update previous price
            previousPricesRef.current[prevPriceKey] = price;

            // Get current timestamp
            const now = Math.floor(Date.now() / 1000);

            // Update the corresponding history state
            if (marketIndex === 0) {
              setHistory1((prev) => {
                // If no previous data, initialize with the new point
                if (!prev || prev.length === 0) {
                  return [
                    {
                      x: 0,
                      y: price,
                      timestamp: now,
                    },
                  ];
                }
                const newPoint = {
                  x: prev.length,
                  y: price,
                  timestamp: now,
                };
                // Keep only the last 120 points (2 hours at 1-minute intervals)
                const updated = [...prev, newPoint];
                return updated.slice(-120);
              });
            } else if (marketIndex === 1) {
              setHistory2((prev) => {
                if (!prev || prev.length === 0) {
                  return [
                    {
                      x: 0,
                      y: price,
                      timestamp: now,
                    },
                  ];
                }
                const newPoint = {
                  x: prev.length,
                  y: price,
                  timestamp: now,
                };
                const updated = [...prev, newPoint];
                return updated.slice(-120);
              });
            } else if (marketIndex === 2) {
              setHistory3((prev) => {
                if (!prev || prev.length === 0) {
                  return [
                    {
                      x: 0,
                      y: price,
                      timestamp: now,
                    },
                  ];
                }
                const newPoint = {
                  x: prev.length,
                  y: price,
                  timestamp: now,
                };
                const updated = [...prev, newPoint];
                return updated.slice(-120);
              });
            }
          }
        }
      } catch (error) {
        console.error("Error processing WebSocket trade message:", error);
      }
    };

    ws.onerror = (error) => {
      console.error("EventChartData WebSocket error:", error);
    };

    ws.onclose = (event) => {
      console.log("EventChartData WebSocket connection closed:", event.code);
    };

    tradesWsRef.current = ws;

    // Cleanup function
    return () => {
      if (tradesWsRef.current) {
        const wsToClose = tradesWsRef.current;

        // Remove event handlers
        wsToClose.onopen = null;
        wsToClose.onmessage = null;
        wsToClose.onerror = null;
        wsToClose.onclose = null;

        // Unsubscribe before closing
        if (wsToClose.readyState === WebSocket.OPEN) {
          try {
            wsToClose.send(
              JSON.stringify({
                type: "unsubscribe",
                channel: "trades",
                tickers: marketTickers,
              })
            );
          } catch (e) {
            console.error("Error unsubscribing from trades:", e);
          }
        }

        // Close connection
        if (
          wsToClose.readyState === WebSocket.OPEN ||
          wsToClose.readyState === WebSocket.CONNECTING
        ) {
          wsToClose.close();
        }

        tradesWsRef.current = null;
      }
    };
  }, [market1Ticker, market2Ticker, market3Ticker]);

  const chartPadding = {
    top: Spacing.md,
    bottom: Spacing.md,
    left: Spacing.xl,
    right: Spacing.xl,
  };

  const chartWidth = width;
  const chartHeight = normalize(200);
  const plotWidth = chartWidth - chartPadding.left - chartPadding.right;
  const plotHeight = chartHeight - chartPadding.top - chartPadding.bottom;

  // Process chart data from price history
  const chartData = useMemo(() => {
    if (
      !history1 ||
      !history2 ||
      !history3 ||
      history1.length === 0 ||
      history2.length === 0 ||
      history3.length === 0
    ) {
      return [];
    }

    const maxLength = Math.max(
      history1.length,
      history2.length,
      history3.length
    );
    const combined = [];

    for (let i = 0; i < maxLength; i++) {
      const point1 = history1[i];
      const point2 = history2[i];
      const point3 = history3[i];
      combined.push({
        x: i,
        price1: point1?.y || 0.5,
        price2: point2?.y || 0.5,
        price3: point3?.y || 0.5,
        timestamp:
          point1?.timestamp ||
          point2?.timestamp ||
          point3?.timestamp ||
          Date.now() / 1000,
      });
    }

    return combined;
  }, [history1, history2, history3]);

  // Determine animation settings
  const animationConfig = useMemo(() => {
    const dataSize = chartData.length;

    if (dataSize > 500) {
      return {
        enabled: false,
        interpolation: "natural",
      };
    }

    if (dataSize > 200) {
      return {
        enabled: true,
        duration: 600,
        interpolation: "natural",
      };
    }

    return {
      enabled: true,
      duration: 450,
      interpolation: "cardinal",
    };
  }, [chartData.length]);

  const yDomain = useMemo(() => {
    if (!chartData || chartData.length === 0) return [0, 1];
    const allPrices = chartData
      .flatMap((d) => [d.price1, d.price2, d.price3])
      .filter((p) => p > 0 && p <= 1);

    if (allPrices.length === 0) return [0, 1];

    const priceMin = Math.min(...allPrices);
    const priceMax = Math.max(...allPrices);
    const priceRange = priceMax - priceMin;

    const paddingPercent = 0.15;
    const minPadding = 0.05;
    const padding = Math.max(priceRange * paddingPercent, minPadding);

    const domainMin = Math.max(0, priceMin - padding);
    const domainMax = Math.min(1, priceMax + padding);

    if (domainMax <= domainMin) {
      return [Math.max(0, priceMin - 0.1), Math.min(1, priceMax + 0.1)];
    }

    return [domainMin, domainMax];
  }, [chartData]);

  // Gesture handling for cursor
  const cursorX = useSharedValue(-1);
  const cursorY1 = useSharedValue(0);
  const cursorY2 = useSharedValue(0);
  const cursorY3 = useSharedValue(0);
  const isActive = useSharedValue(false);

  const chartOpacity = useSharedValue(0);
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipData, setTooltipData] = useState({
    index: 0,
    price1: 0,
    price2: 0,
    price3: 0,
    timestamp: null,
  });

  const getValueAtX = useCallback(
    (xPos) => {
      if (!chartData || chartData.length === 0) {
        return {
          index: 0,
          price1: 0.5,
          price2: 0.5,
          price3: 0.5,
          timestamp: null,
          y1: 0,
          y2: 0,
          y3: 0,
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
      const interpolatedPrice1 =
        currentPoint.price1 + (nextPoint.price1 - currentPoint.price1) * t;
      const interpolatedPrice2 =
        currentPoint.price2 + (nextPoint.price2 - currentPoint.price2) * t;
      const interpolatedPrice3 =
        currentPoint.price3 + (nextPoint.price3 - currentPoint.price3) * t;
      const interpolatedTimestamp = currentPoint.timestamp
        ? currentPoint.timestamp +
          (nextPoint.timestamp - currentPoint.timestamp) * t
        : null;

      const domainPaddingY = 20;
      const effectivePlotHeight = plotHeight - domainPaddingY * 2;
      const [domainMin, domainMax] = yDomain;
      const domainRange = domainMax - domainMin || 1;

      const normalizedY1 = (interpolatedPrice1 - domainMin) / domainRange;
      const normalizedY2 = (interpolatedPrice2 - domainMin) / domainRange;
      const normalizedY3 = (interpolatedPrice3 - domainMin) / domainRange;

      const chartY1 =
        chartPadding.top +
        domainPaddingY +
        (1 - normalizedY1) * effectivePlotHeight;
      const chartY2 =
        chartPadding.top +
        domainPaddingY +
        (1 - normalizedY2) * effectivePlotHeight;
      const chartY3 =
        chartPadding.top +
        domainPaddingY +
        (1 - normalizedY3) * effectivePlotHeight;

      return {
        index: dataIndex,
        price1: interpolatedPrice1,
        price2: interpolatedPrice2,
        price3: interpolatedPrice3,
        timestamp: interpolatedTimestamp,
        y1: chartY1,
        y2: chartY2,
        y3: chartY3,
      };
    },
    [plotWidth, plotHeight, chartPadding, chartData, yDomain]
  );

  const lastUpdateTimeRef = useRef(0);
  const THROTTLE_MS = 16;

  const updateCursorData = useCallback(
    (xPos) => {
      if (xPos < 0) {
        setShowTooltip(false);
        return;
      }

      const now = Date.now();
      if (
        chartData.length > 200 &&
        now - lastUpdateTimeRef.current < THROTTLE_MS
      ) {
        return;
      }
      lastUpdateTimeRef.current = now;

      const data = getValueAtX(xPos);

      setTooltipData({
        index: data.index,
        price1: data.price1,
        price2: data.price2,
        price3: data.price3,
        timestamp: data.timestamp,
      });
      cursorY1.value = data.y1;
      cursorY2.value = data.y2;
      cursorY3.value = data.y3;
      setShowTooltip(true);
    },
    [getValueAtX, cursorY1, cursorY2, cursorY3, chartData.length]
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

  const tooltipOffset = normalize(42);
  const dateTooltipBottom = normalize(-20);
  const minSpacing = normalize(12);
  const dateTooltipOffset = normalize(10);
  const dateTooltipXOffset = normalize(8);
  const tooltipWidth = 110;
  const tooltipMargin = normalize(8);

  const animatedCursorStyle = useAnimatedStyle(() => {
    const opacity = isActive.value ? 1 : cursorX.value >= 0 ? 0.6 : 0;
    return {
      opacity,
      transform: [{ translateX: cursorX.value - 1 }],
    };
  });

  const getTooltipXPosition = (cursorValue) => {
    "worklet";
    if (cursorValue > plotWidth * 0.5) {
      return cursorValue - tooltipWidth;
    }
    return cursorValue + tooltipMargin;
  };

  const displayColor1 = lightenColor(market1Color, colorBoost);
  const displayColor2 = lightenColor(market2Color, colorBoost);
  const displayColor3 = lightenColor(market3Color, colorBoost);

  const animatedTooltip1Style = useAnimatedStyle(() => {
    const opacity = isActive.value ? 1 : cursorX.value >= 0 ? 0.8 : 0;
    const tooltipY = cursorY1.value - tooltipOffset;
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

  const animatedTooltip2Style = useAnimatedStyle(() => {
    const opacity = isActive.value ? 1 : cursorX.value >= 0 ? 0.8 : 0;
    return {
      opacity,
      transform: [
        { translateX: getTooltipXPosition(cursorX.value) },
        { translateY: cursorY2.value - tooltipOffset },
      ],
    };
  });

  const animatedTooltip3Style = useAnimatedStyle(() => {
    const opacity = isActive.value ? 1 : cursorX.value >= 0 ? 0.8 : 0;
    return {
      opacity,
      transform: [
        { translateX: getTooltipXPosition(cursorX.value) },
        { translateY: cursorY3.value - tooltipOffset },
      ],
    };
  });

  const animatedDateTooltipStyle = useAnimatedStyle(() => {
    const opacity = isActive.value ? 1 : 0;
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

  const padding = Spacing.xl;

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
                domainPadding={{ x: 0, y: 20 }}
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
                    key="market1"
                    data={chartData}
                    x="x"
                    y="price1"
                    interpolation={animationConfig.interpolation}
                    style={{
                      data: {
                        stroke: displayColor1,
                        strokeWidth: 3,
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
                    key="market2"
                    data={chartData}
                    x="x"
                    y="price2"
                    interpolation={animationConfig.interpolation}
                    style={{
                      data: {
                        stroke: displayColor2,
                        strokeWidth: 3,
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
                    key="market3"
                    data={chartData}
                    x="x"
                    y="price3"
                    interpolation={animationConfig.interpolation}
                    style={{
                      data: {
                        stroke: displayColor3,
                        strokeWidth: 3,
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

                  {/* Market 1 Tooltip */}
                  <Animated.View
                    style={[
                      styles.tooltip,
                      styles.tooltipHigh,
                      animatedTooltip1Style,
                      { borderLeftColor: displayColor1 },
                    ]}
                    pointerEvents="none"
                  >
                    <Text
                      style={[styles.tooltipPrice, { color: displayColor1 }]}
                    >
                      {`${Math.round(
                        (Number(tooltipData.price1) || 0) * 100
                      )}%`}
                    </Text>
                    <Text
                      style={{ ...Typography.label,
                        fontSize: 10,
                        color: "#FFFFFF",
                        textAlign: "center",
                        fontWeight: "900",}}
                      numberOfLines={2}
                      ellipsizeMode="tail"
                    >
                      {market1Name}
                    </Text>
                  </Animated.View>

                  {/* Market 2 Tooltip */}
                  <Animated.View
                    style={[
                      styles.tooltip,
                      styles.tooltipLow,
                      animatedTooltip2Style,
                      { borderLeftColor: displayColor2 },
                    ]}
                    pointerEvents="none"
                  >
                    <Text
                      style={[styles.tooltipPrice, { color: displayColor2 }]}
                    >
                      {`${Math.round(
                        (Number(tooltipData.price2) || 0) * 100
                      )}%`}
                    </Text>
                    <Text
                      style={styles.tooltipLabel}
                      numberOfLines={2}
                      ellipsizeMode="tail"
                    >
                      {market2Name}
                    </Text>
                  </Animated.View>

                  {/* Market 3 Tooltip */}
                  <Animated.View
                    style={[
                      styles.tooltip,
                      styles.tooltipLow,
                      animatedTooltip3Style,
                      { borderLeftColor: displayColor3 },
                    ]}
                    pointerEvents="none"
                  >
                    <Text
                      style={[styles.tooltipPrice, { color: displayColor3 }]}
                    >
                      {`${Math.round(
                        (Number(tooltipData.price3) || 0) * 100
                      )}%`}
                    </Text>
                    <Text
                      style={styles.tooltipLabel}
                      numberOfLines={2}
                      ellipsizeMode="tail"
                    >
                      {market3Name}
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
    minHeight: normalize(200),
  },
  skeletonContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
    backgroundColor: Colors.background,
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
