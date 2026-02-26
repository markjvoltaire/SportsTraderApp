import React, {
  useState,
  useMemo,
  useCallback,
  useEffect,
  useRef,
} from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  useColorScheme,
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
  withDelay,
  withRepeat,
  withSequence,
  Easing,
} from "react-native-reanimated";
import { useRoute } from "@react-navigation/native";
import * as Haptics from "expo-haptics";
import ChartSkeleton from "./ChartSkeleton";
import { normalize, widthPercentage } from "../../utils/dimensions";
import API_BASE_URL from "../../config/api";
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

const DOT_SIZE = 8;
const RING_SIZE = 24;

function PulsingDot({ color, x, y }) {
  const scale = useSharedValue(1);
  const ringScale = useSharedValue(0.5);
  const ringOpacity = useSharedValue(0);
  const dotOpacity = useSharedValue(0);

  useEffect(() => {
    // Fade in
    dotOpacity.value = withDelay(
      400,
      withTiming(1, { duration: 400, easing: Easing.out(Easing.ease) })
    );

    // Heartbeat: quick pump up, settle back, pause, repeat
    scale.value = withDelay(
      600,
      withRepeat(
        withSequence(
          withTiming(1.45, { duration: 180, easing: Easing.out(Easing.ease) }),
          withTiming(1, { duration: 160, easing: Easing.inOut(Easing.ease) }),
          withTiming(1.25, { duration: 140, easing: Easing.out(Easing.ease) }),
          withTiming(1, { duration: 200, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 800 }) // pause
        ),
        -1
      )
    );

    // Radiating ring
    ringScale.value = withDelay(
      600,
      withRepeat(
        withSequence(
          withTiming(0.5, { duration: 0 }),
          withTiming(2.2, { duration: 900, easing: Easing.out(Easing.ease) }),
          withTiming(0.5, { duration: 0 })
        ),
        -1
      )
    );
    ringOpacity.value = withDelay(
      600,
      withRepeat(
        withSequence(
          withTiming(0.5, { duration: 0 }),
          withTiming(0, { duration: 900, easing: Easing.in(Easing.ease) }),
          withTiming(0, { duration: 0 })
        ),
        -1
      )
    );
  }, []);

  const dotStyle = useAnimatedStyle(() => ({
    opacity: dotOpacity.value,
    transform: [{ scale: scale.value }],
  }));

  const ringStyle = useAnimatedStyle(() => ({
    opacity: ringOpacity.value,
    transform: [{ scale: ringScale.value }],
  }));

  return (
    <View
      pointerEvents="none"
      style={{
        position: "absolute",
        left: x - RING_SIZE / 2,
        top: y - RING_SIZE / 2,
        width: RING_SIZE,
        height: RING_SIZE,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Animated.View
        style={[
          {
            position: "absolute",
            width: RING_SIZE,
            height: RING_SIZE,
            borderRadius: RING_SIZE / 2,
            borderWidth: 2,
            borderColor: color,
          },
          ringStyle,
        ]}
      />
      <Animated.View
        style={[
          {
            width: DOT_SIZE,
            height: DOT_SIZE,
            borderRadius: DOT_SIZE / 2,
            backgroundColor: color,
          },
          dotStyle,
        ]}
      />
    </View>
  );
}

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
  realtimePrices = {},
}) {
  const isDarkMode = useColorScheme() !== "light";
  const uiTheme = useMemo(
    () =>
      isDarkMode
        ? {
            background: "#000000",
            textPrimary: "#FFFFFF",
            textSecondary: "#D1D5DB",
            tooltipChipBg: "rgba(0, 0, 0, 0.5)",
            gridStroke: "rgba(255, 255, 255, 0.08)",
          }
        : {
            background: "#F5F7FB",
            textPrimary: "#111827",
            textSecondary: "#374151",
            tooltipChipBg: "rgba(255, 255, 255, 0.85)",
            gridStroke: "rgba(0, 0, 0, 0.08)",
          },
    [isDarkMode]
  );
  const styles = useMemo(() => createStyles(uiTheme), [uiTheme]);

  const route = useRoute();
  // Prefer explicitly passed market; fall back to navigation params
  const market = marketProp || route.params?.game || route.params?.market;
  const { width, height } = Dimensions.get("window");

  const numMarkets = event?.markets?.length ?? 0;
  const MAX_CHART_LINES = 3;

  // Pick the top 3 markets by yesBid so we only chart the highest-probability outcomes
  const topIndices = useMemo(() => {
    if (!event?.markets || event.markets.length <= MAX_CHART_LINES) {
      return event?.markets?.map((_, i) => i) ?? [];
    }
    return event.markets
      .map((m, i) => ({ i, bid: parseFloat(m?.yesBid) || 0 }))
      .sort((a, b) => b.bid - a.bid)
      .slice(0, MAX_CHART_LINES)
      .sort((a, b) => a.i - b.i)
      .map((e) => e.i);
  }, [event?.markets]);

  // State for price history - now process candlestickData directly
  const [marketHistories, setMarketHistories] = useState(null);
  const [fetchedCandlestickData, setFetchedCandlestickData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Track previous prices to detect changes
  const previousPricesRef = useRef({});
  const PRICE_CHANGE_THRESHOLD = 0.01;

  useEffect(() => {
    const fetchCandlestickData = async () => {
      if (!event?.markets || event.markets.length < 2) {
        setLoading(false);
        return;
      }

      const tickers = topIndices.map((i) => event.markets[i]?.ticker).filter(Boolean);
      if (tickers.length < 2) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const endTs = Math.floor(Date.now() / 1000);
        const startTs = endTs - 1 * 60 * 60;
        const periodInterval = 1;
        const queryParams = `?startTs=${startTs}&endTs=${endTs}&periodInterval=${periodInterval}`;

        const responses = await Promise.all(
          tickers.map((t) =>
            fetch(`${API_BASE_URL}/api/v1/market/${t}/candlesticks${queryParams}`)
          )
        );

        const failed = responses.find((r) => !r.ok);
        if (failed) throw new Error(`Failed to fetch candlestick data: ${failed.status}`);

        const allData = await Promise.all(responses.map((r) => r.json()));
        const allCandlesticks = allData.map((d) =>
          Array.isArray(d) ? d : d.candlesticks || d.data || []
        );

        setFetchedCandlestickData({ market_candlesticks: allCandlesticks });
      } catch (err) {
        console.error("Error fetching candlestick data:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchCandlestickData();
  }, [event?.markets]);

  // Update candlestick data only when prices change significantly
  useEffect(() => {
    if (!event?.markets || event.markets.length < 2 || !realtimePrices) return;

    let anyChanged = false;
    const newPrevPrices = { ...previousPricesRef.current };

    topIndices.forEach((mktIdx, localIdx) => {
      const m = event.markets[mktIdx];
      const price = m?.ticker ? realtimePrices[m.ticker] : null;
      if (price == null) return;
      const prev = previousPricesRef.current[localIdx];
      if (prev != null && Math.abs(price - prev) < PRICE_CHANGE_THRESHOLD) return;
      newPrevPrices[localIdx] = price;
      anyChanged = true;
    });

    if (!anyChanged) return;
    previousPricesRef.current = newPrevPrices;

    if (fetchedCandlestickData?.market_candlesticks) {
      setFetchedCandlestickData((prev) => {
        if (!prev?.market_candlesticks) return prev;
        const updated = { ...prev, market_candlesticks: [...prev.market_candlesticks] };
        const now = Math.floor(Date.now() / 1000);

        topIndices.forEach((mktIdx, localIdx) => {
          const m = event.markets[mktIdx];
          const price = m?.ticker ? realtimePrices[m.ticker] : null;
          if (price == null) return;
          if (!updated.market_candlesticks[localIdx]) updated.market_candlesticks[localIdx] = [];

          const arr = updated.market_candlesticks[localIdx];
          const lastPoint = arr.length > 0 ? arr[arr.length - 1] : null;
          const newPoint = {
            price: {
              close: price,
              close_dollars: price.toString(),
              open: lastPoint?.price?.close || price,
              open_dollars: (lastPoint?.price?.close || price).toString(),
              high: Math.max(price, lastPoint?.price?.close || price),
              high_dollars: Math.max(price, lastPoint?.price?.close || price).toString(),
              low: Math.min(price, lastPoint?.price?.close || price),
              low_dollars: Math.min(price, lastPoint?.price?.close || price).toString(),
            },
            end_period_ts: now,
            timestamp: now,
            time: now,
          };

          const newArr = [...arr, newPoint];
          updated.market_candlesticks[localIdx] = newArr.length > 60 ? newArr.slice(-60) : newArr;
        });

        return updated;
      });
    }
  }, [realtimePrices, event?.markets, fetchedCandlestickData]);
  // Use fetched candlestickData if available, otherwise fall back to prop
  const candlestickDataToUse = fetchedCandlestickData;

  // Process candlestickData when it changes — supports N markets
  useEffect(() => {
    if (!candlestickDataToUse?.market_candlesticks) {
      setLoading(true);
      return;
    }

    const extractTeamData = (teamData) => {
      if (!teamData || !Array.isArray(teamData)) return [];
      const out = [];
      teamData.forEach((point, idx) => {
        let price = parseFloat(point.price?.close) || parseFloat(point.price?.close_dollars) || 0;
        if (price > 1) price = price / 100;
        if (price > 0) {
          out.push({ x: idx, y: price, timestamp: point.end_period_ts || point.timestamp || point.time });
        }
      });
      return out;
    };

    const allHistories = candlestickDataToUse.market_candlesticks.map((d) => extractTeamData(d));
    const maxLength = Math.max(...allHistories.map((h) => h.length), 0);

    for (const hist of allHistories) {
      while (hist.length < maxLength) {
        const last = hist.length > 0 ? hist[hist.length - 1] : { y: 0.5, timestamp: null };
        hist.push({ x: hist.length, y: last.y, timestamp: last.timestamp });
      }
    }

    setMarketHistories(allHistories);
    setLoading(false);
  }, [candlestickDataToUse]);

  const chartPadding = {
    top: Spacing.md,
    bottom: Spacing.md,
    left: Spacing.xl,
    right: Spacing.xl + 10,
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
          color: "#3B82F6",
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

  const OUTCOME_COLORS = ["#3B82F6", "#EF4444", "#10B981", "#F59E0B", "#8B5CF6"];

  const marketOutcomes = useMemo(() => {
    if (!event?.markets || event.markets.length < 2) {
      return [
        { name: marketData.homeTeam.name, color: marketData.homeTeam.color, price: marketData.homeTeam.price, marketIdx: 0 },
        { name: marketData.awayTeam.name, color: marketData.awayTeam.color, price: marketData.awayTeam.price, marketIdx: 1 },
      ];
    }
    return topIndices.map((mktIdx, localIdx) => {
      const m = event.markets[mktIdx];
      const label = m?.yesSubTitle ?? m?.noSubTitle ?? m?.title ?? `Outcome ${mktIdx + 1}`;
      let color = OUTCOME_COLORS[localIdx % OUTCOME_COLORS.length];
      if (mktIdx === 0) color = marketData.homeTeam.color || color;
      else if (mktIdx === 1) color = marketData.awayTeam.color || color;
      else color = lightenColor(color, colorBoost);
      const bid = parseFloat(m?.yesBid);
      const ask = parseFloat(m?.yesAsk);
      const b = Number.isFinite(bid) ? bid : 0;
      const a = Number.isFinite(ask) ? ask : 0;
      const initialPrice = b && a ? (b + a) / 2 : b || a || 0.5;
      return { name: label, color, price: initialPrice, marketIdx: mktIdx };
    });
  }, [event?.markets, topIndices, marketData, colorBoost]);

  // Gesture handling for cursor
  const cursorX = useSharedValue(-1); // -1 means hidden
  const cursorYHigh = useSharedValue(0);
  const cursorYLow = useSharedValue(0);
  const isActive = useSharedValue(false);

  // Animation for chart fade-in
  const chartOpacity = useSharedValue(0);
  const [showTooltip, setShowTooltip] = useState(false);
  const [cursorXPos, setCursorXPos] = useState(-1);
  const [tooltipData, setTooltipData] = useState({
    index: 0,
    awayPrice: 0,
    homePrice: 0,
    prices: [],
    timestamp: null,
    awayTeamName: "",
    homeTeamName: "",
  });

  // Process chart data from price history — supports N markets
  const chartData = useMemo(() => {
    if (!marketHistories || marketHistories.length < 2 || marketHistories.every((h) => h.length === 0)) {
      return [];
    }
    const maxLength = Math.max(...marketHistories.map((h) => h.length));
    const combined = [];
    for (let i = 0; i < maxLength; i++) {
      const point = { x: i, timestamp: null };
      marketHistories.forEach((hist, idx) => {
        const p = hist[i];
        point[`price${idx}`] = p?.y ?? marketOutcomes[idx]?.price ?? 0.5;
        if (!point.timestamp && p?.timestamp) point.timestamp = p.timestamp;
      });
      if (!point.timestamp) point.timestamp = Date.now() / 1000;
      // Keep legacy fields for backward compat with tooltips
      point.homePrice = point.price0 ?? 0.5;
      point.awayPrice = point.price1 ?? 0.5;
      combined.push(point);
    }
    return combined;
  }, [marketHistories, marketOutcomes]);

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
    const priceKeys = Object.keys(chartData[0] || {}).filter((k) => k.startsWith("price"));
    const allPrices = chartData
      .flatMap((d) => priceKeys.map((k) => d[k]))
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
        setCursorXPos(-1);
        if (onTimestampChange) onTimestampChange(null);
        lastDataIndexRef.current = -1;
        return;
      }
      setCursorXPos(xPos);

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
      const isAtLatestPoint = currentDataIndex >= chartData.length - 1;

      // Use real-time prices if cursor is at the latest point and real-time prices are available
      let displayAwayPrice = data.awayPrice;
      let displayHomePrice = data.homePrice;

      if (isAtLatestPoint && event?.markets && event.markets.length >= 2) {
        const awayMarket = event.markets[1]; // Second market is for away team
        const homeMarket = event.markets[0]; // First market is for home team

        // Use real-time price if available, otherwise fallback to chart data
        if (
          awayMarket?.ticker &&
          realtimePrices[awayMarket.ticker] !== undefined
        ) {
          displayAwayPrice = realtimePrices[awayMarket.ticker];
        }
        if (
          homeMarket?.ticker &&
          realtimePrices[homeMarket.ticker] !== undefined
        ) {
          displayHomePrice = realtimePrices[homeMarket.ticker];
        }
      }

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

      // Build prices array for all N outcomes
      const currentPoint = chartData[Math.floor(data.index)] || {};
      const allPrices = marketOutcomes.map((outcome, localIdx) => {
        const chartPrice = currentPoint[`price${localIdx}`] ?? (localIdx === 0 ? data.homePrice : localIdx === 1 ? data.awayPrice : 0);
        const mktIdx = outcome.marketIdx;
        if (isAtLatestPoint && event?.markets?.[mktIdx]?.ticker && realtimePrices[event.markets[mktIdx].ticker] !== undefined) {
          return realtimePrices[event.markets[mktIdx].ticker];
        }
        return chartPrice;
      });

      setTooltipData({
        index: data.index,
        awayPrice: displayAwayPrice,
        homePrice: displayHomePrice,
        prices: allPrices,
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
          awayPrice: displayAwayPrice,
          homePrice: displayHomePrice,
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
      marketOutcomes,
      chartData.length,
      chartData,
      event,
      realtimePrices,
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
          // Reset cursor to initial position (rightmost) when user lets go
          cursorX.value = withTiming(plotWidth, {
            duration: 300,
            easing: Easing.out(Easing.ease),
          });
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

  // Initialize cursor position to show tooltips at the end of chart
  useEffect(() => {
    if (chartData && chartData.length > 0 && cursorX.value === -1) {
      cursorX.value = plotWidth;
      updateCursorData(plotWidth);
      isActive.value = false;
      setShowTooltip(true);
    }
  }, [chartData, plotWidth, cursorX, updateCursorData, isActive]);

  // Update tooltip with real-time prices when they change and cursor is at latest point
  useEffect(() => {
    if (!chartData || chartData.length === 0 || !showTooltip) return;
    const isAtLatestPoint = tooltipData.index >= chartData.length - 1;
    if (!isAtLatestPoint || !event?.markets || event.markets.length < 2) return;

    let changed = false;
    const newPrices = (tooltipData.prices || []).slice();

    marketOutcomes.forEach((outcome, localIdx) => {
      const m = event.markets[outcome.marketIdx];
      if (m?.ticker && realtimePrices[m.ticker] !== undefined) {
        const rtPrice = realtimePrices[m.ticker];
        if (newPrices[localIdx] !== rtPrice) {
          newPrices[localIdx] = rtPrice;
          changed = true;
        }
      }
    });

    if (changed) {
      setTooltipData((prev) => ({
        ...prev,
        prices: newPrices,
        homePrice: newPrices[0] ?? prev.homePrice,
        awayPrice: newPrices[1] ?? prev.awayPrice,
      }));
    }
  }, [realtimePrices, chartData, tooltipData.index, event, showTooltip, tooltipData.prices]);

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
    // Only show cursor line when actively scrolling (isActive is true)
    const opacity = isActive.value ? 1 : 0;
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
    // Show tooltips when cursor is visible (either scrolling or at a position)
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
    // Show tooltips when cursor is visible (either scrolling or at a position)
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
      {/* Top 3 market percentages — only for events with 3+ markets; updates on pan */}
      {event?.markets?.length >= 3 && marketOutcomes.length >= 3 && (
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 10,
            paddingHorizontal: 16,
          }}
        >
          {marketOutcomes.slice(0, 3).map((outcome, idx) => {
            const priceVal = tooltipData.prices?.[idx] ?? (idx === 0 ? tooltipData.homePrice : idx === 1 ? tooltipData.awayPrice : outcome.price);
            const pct = Math.round((Number(priceVal) ?? 0) * 100);
            const shortName = outcome.name.length > 8 ? outcome.name.slice(0, 7).trim() + "…" : outcome.name;
            return (
              <Text
                key={`header-${idx}`}
                style={{ color: outcome.color, fontSize: 14, fontWeight: "700" }}
                numberOfLines={1}
              >
                {shortName} {pct}¢
              </Text>
            );
          })}
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
                  background: { fill: uiTheme.background },
                }}
              >
                <VictoryAxis
                  style={{
                    axis: { stroke: "transparent" },
                    tickLabels: { fill: "transparent" },
                    grid: {
                      stroke: uiTheme.gridStroke,
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
                      stroke: uiTheme.gridStroke,
                    },
                    ticks: { stroke: "transparent" },
                  }}
                />
                {chartData.length > 0 &&
                  marketOutcomes.map((outcome, idx) => (
                    <VictoryLine
                      key={`line-${idx}`}
                      data={chartData}
                      x="x"
                      y={`price${idx}`}
                      interpolation={animationConfig.interpolation}
                      style={{
                        data: {
                          stroke: outcome.color,
                          strokeWidth: 2.5,
                          strokeLinecap: "butt",
                          strokeLinejoin: "butt",
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
                    />
                  ))}
              </VictoryChart>

              {/* Pulsing endpoint dots — use same Y scale as VictoryChart (full plot height, no extra inset) */}
              {chartData.length > 0 &&
                marketOutcomes.map((outcome, idx) => {
                  const lastPoint = chartData[chartData.length - 1];
                  const price = lastPoint[`price${idx}`] ?? 0.5;
                  const [dMin, dMax] = yDomain;
                  const dRange = dMax - dMin || 1;
                  const norm = (price - dMin) / dRange;
                  const yPos = chartPadding.top + (1 - norm) * plotHeight;
                  return (
                    <PulsingDot
                      key={`pulse-${idx}`}
                      color={outcome.color}
                      x={chartPadding.left + plotWidth - 1}
                      y={yPos}
                    />
                  );
                })}

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

                  {/* Outcome Tooltips — rendered at chart end for all N outcomes */}
                  {marketOutcomes.map((outcome, idx) => {
                    const priceVal = tooltipData.prices?.[idx] ?? (idx === 0 ? tooltipData.homePrice : idx === 1 ? tooltipData.awayPrice : 0);
                    const pct = Math.round((Number(priceVal) || 0) * 100);
                    const domainPaddingY = 10;
                    const effectivePlotHeight = plotHeight - domainPaddingY * 2;
                    const [domainMin, domainMax] = yDomain;
                    const domainRange = domainMax - domainMin || 1;
                    const normalized = ((Number(priceVal) || 0.5) - domainMin) / domainRange;
                    const yPos = chartPadding.top + domainPaddingY + (1 - normalized) * effectivePlotHeight;
                    const isRightHalf = cursorXPos > plotWidth * 0.5;
                    const xPos = isRightHalf ? cursorXPos - tooltipWidth : cursorXPos + tooltipMargin;
                    return (
                      <View
                        key={`tip-${idx}`}
                        style={[
                          styles.tooltip,
                          styles.tooltipHigh,
                          {
                            borderLeftColor: outcome.color,
                            opacity: cursorXPos >= 0 ? 0.8 : 0,
                            transform: [
                              { translateX: xPos },
                              { translateY: yPos - tooltipOffset },
                            ],
                          },
                        ]}
                        pointerEvents="none"
                      >
                        <Text style={[styles.tooltipPrice, { color: outcome.color }]}>
                          {pct}¢
                        </Text>
                        <Text style={styles.tooltipLabel} numberOfLines={2} ellipsizeMode="tail">
                          {outcome.name}
                        </Text>
                      </View>
                    );
                  })}
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

const createStyles = (uiTheme) =>
  StyleSheet.create({
  chartContainer: {
    width: "100%",
    position: "relative",
    backgroundColor: uiTheme.background,
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
    backgroundColor: uiTheme.textPrimary,
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
    color: uiTheme.textSecondary,
    fontWeight: "600",
    bottom: 15,
  },
  tooltipPrice: {
    ...Typography.bodyLarge,
    fontWeight: "700",
    marginBottom: Spacing.xs / 2,
    color: uiTheme.textPrimary,
    backgroundColor: uiTheme.tooltipChipBg,
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
    overflow: "hidden",
  },
  tooltipLabel: {
    ...Typography.label,
    fontSize: 10,
    color: uiTheme.textPrimary,
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
    backgroundColor: uiTheme.background,
  },
});
