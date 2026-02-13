import React, { useState, useMemo, useCallback } from "react";
import {
  StyleSheet,
  View,
  Text,
  Dimensions,
  useColorScheme,
} from "react-native";
import {
  VictoryChart,
  VictoryLine,
  VictoryScatter,
  VictoryGroup,
  VictoryAxis,
  VictoryVoronoiContainer,
  VictoryClipContainer,
} from "victory-native";

const { width } = Dimensions.get("window");
const CHART_HEIGHT = 280;

const generateSmoothData = (currentVal, points = 60, volatility = 1.5) => {
  const data = [];
  let val = currentVal;
  for (let i = points - 1; i >= 0; i--) {
    data.unshift({ x: i, y: Math.round(val) });
    val += (Math.random() - 0.5) * volatility;
    if (val > 95) val = 95;
    if (val < 5) val = 5;
  }
  return data;
};

export default function MarketChart({ market, theme = null }) {
  const isDarkMode = useColorScheme() !== "light";
  const chartTheme = useMemo(
    () =>
      theme ||
      (isDarkMode
        ? {
            background: "#000000",
            guideLineColor: "rgba(255,255,255,0.12)",
            pointStroke: "#000000",
            textShadowColor: "rgba(0, 0, 0, 0.3)",
          }
        : {
            background: "#F5F7FB",
            guideLineColor: "rgba(17,24,39,0.18)",
            pointStroke: "#FFFFFF",
            textShadowColor: "rgba(255, 255, 255, 0.45)",
          }),
    [theme, isDarkMode]
  );
  const styles = useMemo(() => createStyles(chartTheme), [chartTheme]);
  const { awayTeam, homeTeam } = market;

  const awayData = useMemo(
    () => generateSmoothData(awayTeam.price * 100, 60, 2),
    [awayTeam.price]
  );
  const homeData = useMemo(
    () => generateSmoothData(homeTeam.price * 100, 60, 2),
    [homeTeam.price]
  );

  // Initialize state with the last index
  const [activeIndex, setActiveIndex] = useState(awayData.length - 1);

  const currentAway = awayData[activeIndex];
  const currentHome = homeData[activeIndex];

  // FIX: Guard clause to prevent infinite re-renders
  const handleActivated = useCallback(
    (points) => {
      if (!points || points.length === 0) return;

      const index = awayData.findIndex((p) => p.x === points[0].x);

      // Only update state if the index actually changed
      if (index !== -1 && index !== activeIndex) {
        setActiveIndex(index);
      }
    },
    [awayData, activeIndex] // activeIndex must be a dependency here
  );

  const awayVerticalPos = useMemo(() => {
    const range = CHART_HEIGHT - 80;
    const pos = range - (currentAway.y / 100) * range + 40;
    return Math.max(0, Math.min(pos, CHART_HEIGHT - 60));
  }, [currentAway.y]);

  const homeVerticalPos = useMemo(() => {
    const range = CHART_HEIGHT - 80;
    const pos = range - (currentHome.y / 100) * range + 40;
    return Math.max(0, Math.min(pos, CHART_HEIGHT - 60));
  }, [currentHome.y]);

  const awayLineStyle = useMemo(
    () => ({ data: { stroke: awayTeam.color, strokeWidth: 3.5 } }),
    [awayTeam.color]
  );

  const homeLineStyle = useMemo(
    () => ({ data: { stroke: homeTeam.color, strokeWidth: 3.5 } }),
    [homeTeam.color]
  );

  const awayScatterStyle = useMemo(
    () => ({
      data: {
        fill: awayTeam.color,
        stroke: chartTheme.pointStroke,
        strokeWidth: 1.5,
      },
    }),
    [awayTeam.color, chartTheme.pointStroke]
  );

  const homeScatterStyle = useMemo(
    () => ({
      data: {
        fill: homeTeam.color,
        stroke: chartTheme.pointStroke,
        strokeWidth: 1.5,
      },
    }),
    [homeTeam.color, chartTheme.pointStroke]
  );

  return (
    <View
      style={styles.container}
    >
      <View style={styles.chartWrapper}>
        <VictoryChart
          height={CHART_HEIGHT}
          width={width * 0.75}
          padding={{ right: 0, left: 20, top: 30, bottom: 30 }}
          containerComponent={
            <VictoryVoronoiContainer
              voronoiDimension="x"
              onActivated={handleActivated}
            />
          }
        >
          <VictoryAxis
            style={{
              axis: { stroke: "transparent" },
              tickLabels: { fill: "transparent" },
            }}
          />

          <VictoryLine
            x={() => currentAway.x}
            style={{
              data: {
                stroke: chartTheme.guideLineColor,
                strokeWidth: 1.5,
              },
            }}
          />

          <VictoryGroup>
            <VictoryLine
              data={awayData}
              interpolation="catmullRom"
              groupComponent={<VictoryClipContainer />}
              animate={{
                onLoad: { duration: 1200, easing: "cubicOut" },
                duration: 400,
                easing: "cubicInOut",
              }}
              style={awayLineStyle}
            />
            <VictoryScatter
              data={[currentAway]}
              size={6}
              style={awayScatterStyle}
            />
          </VictoryGroup>

          <VictoryGroup>
            <VictoryLine
              data={homeData}
              interpolation="catmullRom"
              groupComponent={<VictoryClipContainer />}
              animate={{
                onLoad: { duration: 1200, easing: "cubicOut" },
                duration: 400,
                easing: "cubicInOut",
              }}
              style={homeLineStyle}
            />
            <VictoryScatter
              data={[currentHome]}
              size={6}
              style={homeScatterStyle}
            />
          </VictoryGroup>
        </VictoryChart>

        <View style={styles.labelArea}>
          <View
            style={[
              styles.floatingBox,
              {
                top: awayVerticalPos,
                shadowColor: awayTeam.color,
              },
            ]}
          >
            <Text style={[styles.teamName, { color: awayTeam.color }]}>
              {awayTeam.name.toUpperCase()}
            </Text>
            <Text style={[styles.percentText, { color: awayTeam.color }]}>
              {currentAway.y}¢
            </Text>
          </View>

          <View
            style={[
              styles.floatingBox,
              {
                top: homeVerticalPos,
                shadowColor: homeTeam.color,
              },
            ]}
          >
            <Text style={[styles.teamName, { color: homeTeam.color }]}>
              {homeTeam.name.toUpperCase()}
            </Text>
            <Text style={[styles.percentText, { color: homeTeam.color }]}>
              {currentHome.y}¢
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const createStyles = (chartTheme) =>
  StyleSheet.create({
  container: {
    backgroundColor: chartTheme.background,
  },
  chartWrapper: {
    flexDirection: "row",
    height: CHART_HEIGHT,
  },
  labelArea: {
    flex: 1,
    position: "relative",
  },
  floatingBox: {
    position: "absolute",
    left: 0,
    paddingLeft: 8,
    transform: [{ translateY: -28 }],
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  teamName: {
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.5,
    opacity: 0.85,
  },
  percentText: {
    fontSize: 36,
    fontWeight: "bold",
    marginTop: -4,
    fontVariant: ["tabular-nums"],
    textShadowColor: chartTheme.textShadowColor,
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});
