import { StyleSheet, View, ActivityIndicator } from "react-native";
import React, { useMemo, useEffect, useState } from "react";
import {
  VictoryChart,
  VictoryLine,
  VictoryArea,
  VictoryContainer,
} from "victory-native";
import { LinearGradient, Stop, Defs } from "react-native-svg";
import API_BASE_URL from "../../config/api";
import { getNFLTeamColor, getNBATeamColor } from "../../constants/teamColors";

const DEFAULT_TEAM_COLORS = ["#3B82F6", "#F97316"]; // Blue, coral/orange

const N = 60;
const Y_MIN = 8;
const Y_MAX = 92;
const WHITE_OR_INVALID = /^#(fff|ffffff|000|000000)$/i;
function isVisibleColor(hex) {
  if (!hex || typeof hex !== "string") return false;
  const n = hex.replace("#", "");
  if (n.length !== 3 && n.length !== 6) return false;
  if (WHITE_OR_INVALID.test(hex)) return false;
  return true;
}

// Same color resolution as ChartScreen: team names from event → NFL/NBA colors; never fall back to white so list matches ChartScreen.
function getTeamColorsFromEvent(event) {
  const fallback = { homeColor: DEFAULT_TEAM_COLORS[0], awayColor: DEFAULT_TEAM_COLORS[1] };
  if (!event) return fallback;
  let homeName = "Home";
  let awayName = "Away";
  if (event.markets?.length >= 2) {
    homeName = event.markets[0]?.yesSubTitle ?? homeName;
    awayName = event.markets[1]?.yesSubTitle ?? awayName;
  }
  if (event.title) {
    const atMatch = event.title.match(/(.+?)\s+at\s+(.+)/i);
    if (atMatch) {
      awayName = atMatch[1].trim();
      homeName = atMatch[2].trim();
    } else {
      const vsMatch = event.title.match(/(.+?)\s+vs\.?\s+(.+)/i);
      if (vsMatch) {
        awayName = vsMatch[1].trim();
        homeName = vsMatch[2].trim();
      }
    }
  }
  // Match ChartScreen: include ticker/seriesTicker so list events (e.g. from /api/games/nba) still detect NBA/NFL
  const hints = [
    event?.competition,
    event?.league,
    event?.sport,
    event?.ticker,
    event?.seriesTicker,
    event?.markets?.[0]?.league,
    event?.markets?.[0]?.seriesTicker,
    event?.markets?.[0]?.sport,
  ]
    .filter(Boolean)
    .join(" ");
  const isNFL = /pro football|nfl|KXNFL/i.test(hints);
  const isNBA = /pro basketball|nba|KXNBAGAME/i.test(hints);
  const homeAbbr = homeName.substring(0, 3).toUpperCase();
  const awayAbbr = awayName.substring(0, 3).toUpperCase();
  let homeColor = null;
  let awayColor = null;
  if (isNFL) {
    homeColor = getNFLTeamColor(homeName) || getNFLTeamColor(homeAbbr);
    awayColor = getNFLTeamColor(awayName) || getNFLTeamColor(awayAbbr);
  }
  if (isNBA) {
    homeColor = getNBATeamColor(homeName) || getNBATeamColor(homeAbbr);
    awayColor = getNBATeamColor(awayName) || getNBATeamColor(awayAbbr);
  }
  return {
    homeColor: isVisibleColor(homeColor) ? homeColor : fallback.homeColor,
    awayColor: isVisibleColor(awayColor) ? awayColor : fallback.awayColor,
  };
}

// Same as ChartScreen/MyChart: extract price series from one market's candlesticks (y in 0–1)
function extractTeamData(teamCandles, yMin = Y_MIN, yMax = Y_MAX) {
  if (!teamCandles || !Array.isArray(teamCandles)) return [];
  const out = [];
  teamCandles.forEach((point, i) => {
    let price =
      parseFloat(point.price?.close) ||
      parseFloat(point.price?.close_dollars) ||
      0;
    if (price > 1) price = price / 100;
    if (price > 0) out.push({ x: i, y: yMin + (yMax - yMin) * price });
  });
  return out;
}

// Blue starts high and trends down; coral starts low and trends up. Fallback when no candlestick data.
function generateConvergingLines() {
  const line1 = [];
  const line2 = [];
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    const midY = 50;
    const converge = Math.max(0, 1 - t / 0.33);
    const baseBlue = midY + (Y_MAX - midY) * converge;
    const baseOrange = midY - (midY - Y_MIN) * converge;
    const waveBlue = Math.sin(i * 0.4) * 12 + Math.sin(i * 0.95) * 7 + Math.sin(i * 1.8) * 4;
    const waveOrange = Math.sin(i * 0.35 + 1.5) * 12 + Math.sin(i * 0.88 + 0.8) * 7 + Math.sin(i * 1.7) * 4;
    const blueY = baseBlue + waveBlue * (0.4 + 0.6 * (1 - converge));
    const orangeY = baseOrange + waveOrange * (0.4 + 0.6 * (1 - converge));
    line1.push({ x: i, y: Math.max(Y_MIN, Math.min(Y_MAX, blueY)) });
    line2.push({ x: i, y: Math.max(Y_MIN, Math.min(Y_MAX, orangeY)) });
  }
  return [line1, line2];
}

export default function MarketLineChart({
  width = 140,
  height = 52,
  color,
  data,
  /** Array of { color?, data } — one per team. If not provided, fetched from event or mock. */
  series,
  /** Event with .ticker; candlestick data fetched from same API as ChartScreen. */
  event,
}) {
  const [candlestickData, setCandlestickData] = useState(null);
  const [loading, setLoading] = useState(false);

  // Fetch candlestick data: use smaller periodInterval for more data points (5-min bars over 7 days)
  useEffect(() => {
    if (!event?.ticker) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    const fetchCandlesticks = async () => {
      try {
        const periodInterval = 5;
        const url = `${API_BASE_URL}/api/game/candlestick/${event.ticker}?periodInterval=${periodInterval}`;
        const response = await fetch(url);
        const res = await response.json();
        if (!cancelled && res?.market_candlesticks) setCandlestickData(res);
      } catch (err) {
        if (!cancelled) setCandlestickData(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchCandlesticks();
    return () => { cancelled = true; };
  }, [event?.ticker]);

  const lines = useMemo(() => {
    let list = [];
    if (series && series.length > 0) {
      list = series.map((s, i) => ({
        color: s.color ?? DEFAULT_TEAM_COLORS[i % DEFAULT_TEAM_COLORS.length],
        data: Array.isArray(s.data) ? s.data : [],
      }));
    } else if (candlestickData?.market_candlesticks && event) {
      const homeCandles = candlestickData.market_candlesticks[0] || [];
      const awayCandles = candlestickData.market_candlesticks[1] || [];
      const team1 = extractTeamData(homeCandles);
      const team2 = extractTeamData(awayCandles);
      if (team1.length > 0 || team2.length > 0) {
        const { homeColor: hColor, awayColor: aColor } = getTeamColorsFromEvent(event);
        list = [
          { color: hColor, data: team1 },
          { color: aColor, data: team2 },
        ];
      }
    } else if (data && Array.isArray(data) && data.length > 0) {
      list = [{ color: color ?? DEFAULT_TEAM_COLORS[0], data }];
    } else {
      const [line1, line2] = generateConvergingLines();
      list = [
        { color: DEFAULT_TEAM_COLORS[0], data: line1 },
        { color: DEFAULT_TEAM_COLORS[1], data: line2 },
      ];
    }
    // Show only the line with the highest (last) price
    if (list.length <= 1) return list;
    const lastPrice = (line) => (line.data.length > 0 ? line.data[line.data.length - 1].y : 0);
    const highest = list.reduce((best, cur) => (lastPrice(cur) >= lastPrice(best) ? cur : best), list[0]);
    return [highest];
  }, [series, data, color, candlestickData, event]);

  const isLoading = loading && event?.ticker && !candlestickData?.market_candlesticks;

  if (isLoading) {
    return (
      <View style={[styles.container, { width, height }]}>
        <View style={[styles.skeleton, { width, height }]} />
        <ActivityIndicator
          size="small"
          color="rgba(255,255,255,0.5)"
          style={styles.loader}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <VictoryChart
        width={width}
        height={height}
        padding={0}
        containerComponent={
          <VictoryContainer
            disableContainerEvents
            style={{ backgroundColor: "#0f0f0f" }}
          />
        }
      >
        <Defs>
          <LinearGradient id="chartGradientUnder" x1="0%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0%" stopColor={lines[0]?.color ?? DEFAULT_TEAM_COLORS[0]} stopOpacity="0.4" />
            <Stop offset="100%" stopColor={lines[0]?.color ?? DEFAULT_TEAM_COLORS[0]} stopOpacity="0" />
          </LinearGradient>
        </Defs>
        {lines.map((line, index) =>
          line.data.length > 0
            ? [
                <VictoryArea
                  key={`area-${index}`}
                  data={line.data}
                  interpolation="linear"
                  style={{
                    data: {
                      fill: "url(#chartGradientUnder)",
                      stroke: "transparent",
                    },
                  }}
                />,
                <VictoryLine
                  key={`line-${index}`}
                  data={line.data}
                  interpolation="linear"
                  style={{
                    data: {
                      stroke: line.color,
                      strokeWidth: 2,
                      strokeLinecap: "round",
                      shadowColor: line.color,
                      shadowOffset: { width: 0, height: 0 },
                      shadowOpacity: 0.8,
                      shadowRadius: 4,
                    },
                  }}
                />,
              ]
            : null
        )}
      </VictoryChart>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "black",
  },
  skeleton: {
    position: "absolute",
    borderRadius: 8,
    backgroundColor: "rgba(255, 255, 255, 0.06)",
  },
  loader: {
    position: "absolute",
  },
});