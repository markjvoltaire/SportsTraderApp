import React, { useMemo } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  useWindowDimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import {
  VictoryChart,
  VictoryLine,
  VictoryAxis,
  VictoryScatter,
  VictoryTheme,
} from "victory-native";
import {
  Colors,
  Spacing,
  Typography,
  BorderRadius,
} from "../../constants/theme";

const TIMEFRAMES = ["1H", "1D", "1W", "1M", "YTD", "All"];

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

export default function PriceChart({ match, timeframe, onTimeframeChange }) {
  const { width } = useWindowDimensions();

  const chartW = Math.min(360, Math.max(280, width - Spacing.lg * 2));
  const chartH = 220;

  // Generate chart data in Victory format
  const chartData = useMemo(() => {
    const baseAway = timeframe === "1H" ? 58 : timeframe === "1D" ? 54 : 52;
    const baseHome = timeframe === "1H" ? 42 : timeframe === "1D" ? 46 : 48;
    const dataPoints = 28;

    return Array.from({ length: dataPoints }, (_, i) => {
      // Away team data
      const awayWave = Math.sin(i / 3.2) * 6 + Math.sin(i / 1.8) * 2;
      const awayDrift = i * 0.25;
      const awayValue = clamp(baseAway + awayWave + awayDrift, 35, 80);

      // Home team data
      const homeWave = Math.cos(i / 3.4) * 6 + Math.cos(i / 2.1) * 2;
      const homeDrift = -i * 0.18;
      const homeValue = clamp(baseHome + homeWave + homeDrift, 20, 65);

      return {
        x: i,
        awayPrice: awayValue,
        homePrice: homeValue,
      };
    });
  }, [timeframe]);

  // Calculate domain for y-axis
  const yDomain = useMemo(() => {
    const allValues = [
      ...chartData.map((d) => d.awayPrice),
      ...chartData.map((d) => d.homePrice),
    ];
    const min = Math.min(...allValues);
    const max = Math.max(...allValues);
    const padding = (max - min) * 0.1;
    return [Math.max(0, min - padding), Math.min(100, max + padding)];
  }, [chartData]);

  // Get endpoint data for markers and labels
  const endpointData = useMemo(() => {
    const lastIndex = chartData.length - 1;
    return {
      away: {
        x: chartData[lastIndex].x,
        y: chartData[lastIndex].awayPrice,
      },
      home: {
        x: chartData[lastIndex].x,
        y: chartData[lastIndex].homePrice,
      },
    };
  }, [chartData]);

  return (
    <View style={styles.chartWrap}>
      <LinearGradient
        colors={["rgba(255,255,255,0.06)", "rgba(255,255,255,0.02)"]}
        style={styles.chartCard}
      >
        <View style={styles.chartInner}>
          <VictoryChart
            theme={VictoryTheme.material}
            width={chartW}
            height={chartH}
            padding={{ top: 20, bottom: 20, left: 20, right: 80 }}
            domain={{ y: yDomain }}
            domainPadding={{ x: 0, y: 2 }}
            scale={{ x: "linear", y: "linear" }}
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
              interpolation="monotoneX"
              style={{
                data: {
                  stroke: match.away.color,
                  strokeWidth: 2.5,
                  strokeLinecap: "round",
                  strokeLinejoin: "round",
                },
              }}
            />
            <VictoryLine
              data={chartData}
              x="x"
              y="homePrice"
              interpolation="monotoneX"
              style={{
                data: {
                  stroke: match.home.color,
                  strokeWidth: 2.5,
                  strokeLinecap: "round",
                  strokeLinejoin: "round",
                },
              }}
            />
            {/* Circular markers at endpoints */}
            <VictoryScatter
              data={[endpointData.away]}
              size={6}
              style={{
                data: {
                  fill: match.away.color,
                  stroke: match.away.color,
                  strokeWidth: 0,
                },
              }}
            />
            <VictoryScatter
              data={[endpointData.home]}
              size={6}
              style={{
                data: {
                  fill: match.home.color,
                  stroke: match.home.color,
                  strokeWidth: 0,
                },
              }}
            />
          </VictoryChart>

          {/* Endpoint labels positioned to the right */}
          <View style={styles.endpointLabels}>
            <View
              style={[
                styles.endpointLabel,
                {
                  top: chartH * 0.3,
                  right: 20,
                },
              ]}
            >
              <Text style={[styles.endpointCode, { color: match.away.color }]}>
                {match.away.code}
              </Text>
              <Text style={[styles.endpointPct, { color: match.away.color }]}>
                {match.pctAway}%
              </Text>
            </View>
            <View
              style={[
                styles.endpointLabel,
                {
                  top: chartH * 0.65,
                  right: 20,
                },
              ]}
            >
              <Text style={[styles.endpointCode, { color: match.home.color }]}>
                {match.home.code}
              </Text>
              <Text style={[styles.endpointPct, { color: match.home.color }]}>
                {match.pctHome}%
              </Text>
            </View>
          </View>
        </View>

        {/* Timeframe chips */}
        <View style={styles.timeRow}>
          {TIMEFRAMES.map((t) => {
            const active = t === timeframe;
            return (
              <TouchableOpacity
                key={t}
                style={[styles.timeChip, active && styles.timeChipActive]}
                onPress={() => onTimeframeChange(t)}
              >
                <Text
                  style={[
                    styles.timeChipText,
                    active && styles.timeChipTextActive,
                  ]}
                >
                  {t}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  chartWrap: {
    marginBottom: Spacing.lg,
  },
  chartCard: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.md,
    overflow: "hidden",
    backgroundColor: Colors.background,
  },
  chartInner: {
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  endpointLabels: {
    position: "absolute",
    width: "100%",
    height: "100%",
    pointerEvents: "none",
  },
  endpointLabel: {
    position: "absolute",
    alignItems: "flex-end",
  },
  endpointCode: {
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 2,
  },
  endpointPct: {
    fontSize: 18,
    fontWeight: "800",
  },
  timeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: Spacing.md,
    paddingHorizontal: Spacing.sm,
  },
  timeChip: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: BorderRadius.round,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  timeChipActive: {
    backgroundColor: "rgba(255,255,255,0.10)",
    borderColor: "rgba(255,255,255,0.14)",
  },
  timeChipText: {
    ...Typography.caption,
    color: Colors.textMuted,
    fontWeight: "600",
  },
  timeChipTextActive: {
    color: Colors.textPrimary,
  },
});
