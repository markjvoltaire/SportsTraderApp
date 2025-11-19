import React, { useMemo, useState, useEffect, useCallback } from "react";
import {
  View,
  StyleSheet,
  Dimensions,
  Text,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from "react-native-gesture-handler";
import {
  Canvas,
  Path,
  Skia,
  Circle,
  Line,
  Group,
  LinearGradient,
  vec,
} from "@shopify/react-native-skia";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useDerivedValue,
  useAnimatedReaction,
  withTiming,
  runOnJS,
} from "react-native-reanimated";
import { getSmoothPath, scaleDataToCanvas } from "../../utils/chartUtils";
import { Colors, Spacing, Typography } from "../../../constants/theme";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CHART_HEIGHT = 280;
const CHART_PADDING = { top: 20, bottom: 50, left: 50, right: 20 };

/**
 * Generate mock price history data for demonstration
 */
function generateMockPriceHistory(startPrice, days = 30, volatility = 0.02) {
  const data = [];
  const now = Date.now();
  const oneDay = 24 * 60 * 60 * 1000;

  let currentPrice = startPrice;

  for (let i = days; i >= 0; i--) {
    const timestamp = now - i * oneDay;
    // Random walk with slight mean reversion
    const change = (Math.random() - 0.5) * volatility;
    currentPrice = Math.max(0.01, Math.min(0.99, currentPrice + change));
    data.push({
      x: timestamp,
      y: currentPrice,
      date: new Date(timestamp),
    });
  }

  return data;
}

/**
 * Scrollable Price History Chart Component
 * Displays YES and NO outcome prices over time with horizontal scrolling
 */
export default function PriceHistoryChart({
  yesPrice,
  noPrice,
  yesLabel = "YES",
  noLabel = "NO",
  yesTokenId,
  noTokenId,
  width = SCREEN_WIDTH - Spacing.xl * 2,
  height = CHART_HEIGHT,
}) {
  const [yesData, setYesData] = useState([]);
  const [noData, setNoData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cursorX, setCursorX] = useState(-1);
  const [selectedPoint, setSelectedPoint] = useState(null);
  const scrollX = useSharedValue(0);
  const chartWidthValue = width * 2; // 2x width for scrolling (static value)
  const chartWidth = useSharedValue(chartWidthValue);

  // Generate or fetch price history
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        // Generate mock data based on current prices
        // In production, fetch from API using yesTokenId and noTokenId
        const yesHistory = generateMockPriceHistory(yesPrice || 0.5, 30, 0.025);
        const noHistory = generateMockPriceHistory(noPrice || 0.5, 30, 0.025);

        // Ensure they sum to 1 (market constraint)
        yesHistory.forEach((point, i) => {
          const sum = point.y + noHistory[i].y;
          point.y = point.y / sum;
          noHistory[i].y = noHistory[i].y / sum;
        });

        setYesData(yesHistory);
        setNoData(noHistory);
      } catch (error) {
        console.error("Error loading price history:", error);
      } finally {
        setLoading(false);
      }
    };

    if (yesPrice !== undefined || noPrice !== undefined) {
      loadData();
    }
  }, [yesPrice, noPrice, yesTokenId, noTokenId]);

  // Scale data to canvas coordinates
  const scaledYesData = useMemo(() => {
    if (!yesData || yesData.length === 0) return [];
    return scaleDataToCanvas(yesData, chartWidthValue, height, CHART_PADDING);
  }, [yesData, chartWidthValue, height]);

  const scaledNoData = useMemo(() => {
    if (!noData || noData.length === 0) return [];
    return scaleDataToCanvas(noData, chartWidthValue, height, CHART_PADDING);
  }, [noData, chartWidthValue, height]);

  // Generate smooth paths
  const yesPath = useMemo(() => {
    if (scaledYesData.length === 0) return null;
    const pathData = getSmoothPath(scaledYesData);
    if (!pathData) return null;
    const path = Skia.Path.Make();
    pathData.commands.forEach((cmd) => {
      switch (cmd.type) {
        case "moveTo":
          path.moveTo(cmd.x, cmd.y);
          break;
        case "lineTo":
          path.lineTo(cmd.x, cmd.y);
          break;
        case "cubicTo":
          path.cubicTo(cmd.cpx1, cmd.cpy1, cmd.cpx2, cmd.cpy2, cmd.x, cmd.y);
          break;
      }
    });
    return path;
  }, [scaledYesData]);

  const noPath = useMemo(() => {
    if (scaledNoData.length === 0) return null;
    const pathData = getSmoothPath(scaledNoData);
    if (!pathData) return null;
    const path = Skia.Path.Make();
    pathData.commands.forEach((cmd) => {
      switch (cmd.type) {
        case "moveTo":
          path.moveTo(cmd.x, cmd.y);
          break;
        case "lineTo":
          path.lineTo(cmd.x, cmd.y);
          break;
        case "cubicTo":
          path.cubicTo(cmd.cpx1, cmd.cpy1, cmd.cpx2, cmd.cpy2, cmd.x, cmd.y);
          break;
      }
    });
    return path;
  }, [scaledNoData]);

  // Find point at cursor X
  const findPointAtX = useCallback(
    (x) => {
      if (scaledYesData.length === 0) return null;

      let closestPoint = null;
      let minDistance = Infinity;

      scaledYesData.forEach((point, index) => {
        const distance = Math.abs(point.x - x);
        if (distance < minDistance) {
          minDistance = distance;
          closestPoint = {
            yes: {
              ...point,
              originalY: yesData[index].y,
              date: yesData[index].date,
            },
            no: scaledNoData[index]
              ? {
                  ...scaledNoData[index],
                  originalY: noData[index].y,
                  date: noData[index].date,
                }
              : null,
          };
        }
      });

      return closestPoint;
    },
    [scaledYesData, scaledNoData, yesData, noData]
  );

  const cursorXShared = useSharedValue(-1);
  const cursorYesYShared = useSharedValue(-1);
  const cursorNoYShared = useSharedValue(-1);
  const [cursorDisplay, setCursorDisplay] = useState({
    x: -1,
    yesY: -1,
    noY: -1,
    opacity: 0,
  });

  // Handle finding closest points (runs on JS thread)
  const findClosestPoints = useCallback(
    (x, yesYShared, noYShared) => {
      if (scaledYesData.length === 0 || scaledNoData.length === 0) {
        yesYShared.value = -1;
        noYShared.value = -1;
        return;
      }

      let closestYes = scaledYesData[0];
      let minDistYes = Math.abs(closestYes?.x - x || Infinity);
      scaledYesData.forEach((p) => {
        const dist = Math.abs(p.x - x);
        if (dist < minDistYes) {
          minDistYes = dist;
          closestYes = p;
        }
      });

      let closestNo = scaledNoData[0];
      let minDistNo = Math.abs(closestNo?.x - x || Infinity);
      scaledNoData.forEach((p) => {
        const dist = Math.abs(p.x - x);
        if (dist < minDistNo) {
          minDistNo = dist;
          closestNo = p;
        }
      });

      yesYShared.value = closestYes?.y || -1;
      noYShared.value = closestNo?.y || -1;
    },
    [scaledYesData, scaledNoData]
  );

  // Handle touch/press on chart
  const gesture = useMemo(
    () =>
      Gesture.Tap().onEnd((event) => {
        "worklet";
        const x = event.x + scrollX.value;
        if (
          x >= CHART_PADDING.left &&
          x <= chartWidthValue - CHART_PADDING.right
        ) {
          cursorXShared.value = x;
          runOnJS(findClosestPoints)(x, cursorYesYShared, cursorNoYShared);
          runOnJS(setCursorX)(x);
          const point = runOnJS(findPointAtX)(x);
          runOnJS(setSelectedPoint)(point);
        }
      }),
    [
      scrollX,
      findPointAtX,
      findClosestPoints,
      chartWidth,
      cursorXShared,
      cursorYesYShared,
      cursorNoYShared,
    ]
  );

  // Update cursor display position (accounting for scroll) using animated reaction
  useAnimatedReaction(
    () => ({
      cursorX: cursorXShared.value,
      scrollX: scrollX.value,
      yesY: cursorYesYShared.value,
      noY: cursorNoYShared.value,
    }),
    ({ cursorX, scrollX: scrollVal, yesY, noY }) => {
      "worklet";
      if (cursorX < 0) {
        runOnJS(setCursorDisplay)({ x: -1, yesY: -1, noY: -1, opacity: 0 });
        return;
      }

      const displayX = cursorX - scrollVal;
      const opacity = displayX >= 0 && displayX <= width ? 1 : 0;
      runOnJS(setCursorDisplay)({
        x: displayX,
        yesY,
        noY,
        opacity,
      });
    },
    [width]
  );

  if (loading) {
    return (
      <View style={[styles.container, { width, height }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading price history...</Text>
        </View>
      </View>
    );
  }

  if (yesData.length === 0 && noData.length === 0) {
    return (
      <View style={[styles.container, { width, height }]}>
        <Text style={styles.emptyText}>No price history available</Text>
      </View>
    );
  }

  // Get Y-axis labels (0% to 100%)
  const yLabels = [0, 0.25, 0.5, 0.75, 1];
  const chartAreaHeight = height - CHART_PADDING.top - CHART_PADDING.bottom;

  return (
    <View style={[styles.container, { width, height }]}>
      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View
            style={[styles.legendDot, { backgroundColor: Colors.success }]}
          />
          <Text style={styles.legendText}>{yesLabel}</Text>
        </View>
        <View style={styles.legendItem}>
          <View
            style={[styles.legendDot, { backgroundColor: Colors.danger }]}
          />
          <Text style={styles.legendText}>{noLabel}</Text>
        </View>
      </View>

      {/* Scrollable Chart */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={true}
        scrollEventThrottle={16}
        onScroll={(event) => {
          scrollX.value = event.nativeEvent.contentOffset.x;
        }}
        contentContainerStyle={{
          width: chartWidthValue,
          height: height - 40,
        }}
        style={styles.scrollView}
      >
        <GestureHandlerRootView
          style={{ width: chartWidthValue, height: height - 40 }}
        >
          <GestureDetector gesture={gesture}>
            <View style={{ width: chartWidthValue, height: height - 40 }}>
              {/* Y-axis labels */}
              <View style={styles.yAxisLabels}>
                {yLabels.map((label, index) => {
                  const y = CHART_PADDING.top + (1 - label) * chartAreaHeight;
                  return (
                    <Text
                      key={`label-${index}`}
                      style={[styles.yAxisLabel, { top: y - 6 }]}
                    >
                      {(label * 100).toFixed(0)}%
                    </Text>
                  );
                })}
              </View>

              <Canvas style={{ width: chartWidthValue, height: height - 40 }}>
                {/* Y-axis labels - rendered outside canvas */}

                {/* Grid lines */}
                <Group>
                  {yLabels.map((label, index) => {
                    const y = CHART_PADDING.top + (1 - label) * chartAreaHeight;
                    return (
                      <Line
                        key={`grid-${index}`}
                        p1={vec(CHART_PADDING.left, y)}
                        p2={vec(chartWidthValue - CHART_PADDING.right, y)}
                        color={Colors.border}
                        strokeWidth={0.5}
                      />
                    );
                  })}
                </Group>

                {/* YES path */}
                {yesPath && (
                  <Group>
                    <LinearGradient
                      start={vec(0, CHART_PADDING.top)}
                      end={vec(0, height - CHART_PADDING.bottom)}
                      colors={[Colors.success + "40", Colors.success + "00"]}
                    />
                    <Path
                      path={yesPath}
                      style="stroke"
                      strokeWidth={2.5}
                      color={Colors.success}
                    />
                  </Group>
                )}

                {/* NO path */}
                {noPath && (
                  <Group>
                    <LinearGradient
                      start={vec(0, CHART_PADDING.top)}
                      end={vec(0, height - CHART_PADDING.bottom)}
                      colors={[Colors.danger + "40", Colors.danger + "00"]}
                    />
                    <Path
                      path={noPath}
                      style="stroke"
                      strokeWidth={2.5}
                      color={Colors.danger}
                    />
                  </Group>
                )}

                {/* Cursor line */}
                {cursorDisplay.x >= 0 && cursorDisplay.opacity > 0 && (
                  <Group>
                    <Line
                      p1={vec(cursorDisplay.x, CHART_PADDING.top)}
                      p2={vec(cursorDisplay.x, height - CHART_PADDING.bottom)}
                      color={Colors.textPrimary}
                      strokeWidth={1}
                      opacity={0.5}
                    />
                    {cursorDisplay.yesY >= 0 && (
                      <Circle
                        cx={cursorDisplay.x}
                        cy={cursorDisplay.yesY}
                        r={5}
                        color={Colors.success}
                      />
                    )}
                    {cursorDisplay.noY >= 0 && (
                      <Circle
                        cx={cursorDisplay.x}
                        cy={cursorDisplay.noY}
                        r={5}
                        color={Colors.danger}
                      />
                    )}
                  </Group>
                )}
              </Canvas>
            </View>
          </GestureDetector>
        </GestureHandlerRootView>
      </ScrollView>

      {/* Cursor info display */}
      {selectedPoint && (
        <View style={styles.cursorInfo}>
          <Text style={styles.cursorDate}>
            {selectedPoint.yes.date.toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
              hour: "numeric",
              minute: "2-digit",
            })}
          </Text>
          <View style={styles.cursorPrices}>
            <Text style={[styles.cursorPrice, { color: Colors.success }]}>
              {yesLabel}: {formatPercent(selectedPoint.yes.originalY)}
            </Text>
            <Text style={[styles.cursorPrice, { color: Colors.danger }]}>
              {noLabel}:{" "}
              {formatPercent(
                selectedPoint.no?.originalY || 1 - selectedPoint.yes.originalY
              )}
            </Text>
          </View>
        </View>
      )}

      {/* Instructions */}
      {!selectedPoint && (
        <Text style={styles.hint}>
          Tap on the chart to see price at a point
        </Text>
      )}
    </View>
  );
}

function formatPercent(value) {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return "—";
  }
  return `${(value * 100).toFixed(1)}%`;
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.glassSurface,
    borderRadius: Spacing.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    marginBottom: Spacing.lg,
  },
  legend: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginBottom: Spacing.sm,
    gap: Spacing.md,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    fontSize: 11,
  },
  scrollView: {
    borderRadius: Spacing.sm,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: Spacing.md,
  },
  loadingText: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  emptyText: {
    ...Typography.body,
    color: Colors.textTertiary,
    textAlign: "center",
    paddingVertical: Spacing.xl,
  },
  cursorInfo: {
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  cursorDate: {
    ...Typography.caption,
    color: Colors.textMuted,
    marginBottom: Spacing.xs / 2,
  },
  cursorPrices: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  cursorPrice: {
    ...Typography.caption,
    fontWeight: "600",
    fontSize: 12,
  },
  hint: {
    ...Typography.caption,
    color: Colors.textMuted,
    textAlign: "center",
    marginTop: Spacing.xs,
    fontSize: 10,
  },
  yAxisLabels: {
    position: "absolute",
    left: 0,
    top: 0,
    width: CHART_PADDING.left - 5,
    height: "100%",
    zIndex: 1,
  },
  yAxisLabel: {
    position: "absolute",
    ...Typography.caption,
    color: Colors.textMuted,
    fontSize: 10,
    right: 5,
  },
});
