import React, { useMemo, useState, useEffect, useCallback } from "react";
import {
  View,
  StyleSheet,
  Text,
  ActivityIndicator,
  useWindowDimensions,
} from "react-native";
import { CartesianChart, Line } from "victory-native";
import { Gesture, GestureDetector, GestureHandlerRootView } from "react-native-gesture-handler";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedReaction,
  withTiming,
  runOnJS,
  useDerivedValue,
} from "react-native-reanimated";
import { Colors, Spacing, Typography } from "../../../constants/theme";

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
  yesColor,
  noColor,
  yesTokenId,
  noTokenId,
  yesHistory: providedYesHistory,
  noHistory: providedNoHistory,
  loading: providedLoading,
  width,
  height,
}) {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  // Use full screen dimensions if not provided
  const chartWidth = width || screenWidth;
  const chartHeight = height || screenHeight - 100; // Account for safe area and padding
  const [yesData, setYesData] = useState([]);
  const [noData, setNoData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Gesture handling for cursor
  const cursorX = useSharedValue(-1); // -1 means hidden
  const cursorVisible = useSharedValue(false);
  const cursorYesY = useSharedValue(0);
  const cursorNoY = useSharedValue(0);
  const [cursorData, setCursorData] = useState({
    x: -1,
    yesValue: null,
    noValue: null,
    yesY: 0,
    noY: 0,
  });

  // Chart padding (matching Victory chart padding)
  const chartPadding = { top: 20, bottom: 50, left: 50, right: 20 };
  const plotWidth = chartWidth - chartPadding.left - chartPadding.right;
  const plotHeight = chartHeight - chartPadding.top - chartPadding.bottom;

  // Use provided history data or generate mock data as fallback
  useEffect(() => {
    const loadData = async () => {
      // If loading state is provided from parent, use it
      if (providedLoading !== undefined) {
        setLoading(providedLoading);
      } else {
        setLoading(true);
      }

      try {
        // Use provided history data if available
        if (providedYesHistory && providedNoHistory && providedYesHistory.length > 0 && providedNoHistory.length > 0) {
          setYesData(providedYesHistory);
          setNoData(providedNoHistory);
          if (providedLoading === undefined) {
            setLoading(false);
          }
        } else if (providedLoading === false && (!providedYesHistory || !providedNoHistory || providedYesHistory.length === 0 || providedNoHistory.length === 0)) {
          // No data available and not loading - use fallback mock data
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
          setLoading(false);
        } else if (providedLoading === false) {
          // Loading finished but no data provided - keep existing data or use fallback
          setLoading(false);
        }
      } catch (error) {
        console.error("Error loading price history:", error);
        setLoading(false);
      }
    };

    loadData();
  }, [providedYesHistory, providedNoHistory, providedLoading, yesPrice, noPrice]);

  // Interpolate values at a given x position (timestamp) for both lines
  const getValuesAtX = useCallback((xPos) => {
    if (!yesData || !noData || yesData.length === 0 || noData.length === 0) {
      return { yesValue: null, noValue: null, yesY: 0, noY: 0 };
    }

    // Convert screen x to data x (timestamp)
    const minX = Math.min(
      yesData[0]?.x || 0,
      noData[0]?.x || 0
    );
    const maxX = Math.max(
      yesData[yesData.length - 1]?.x || 0,
      noData[noData.length - 1]?.x || 0
    );

    // Clamp x position to plot area
    const clampedX = Math.max(0, Math.min(plotWidth, xPos));
    const normalizedX = clampedX / plotWidth;
    const dataX = minX + (maxX - minX) * normalizedX;

    // Find closest data points and interpolate
    const findValue = (data) => {
      if (!data || data.length === 0) return null;

      // Find the two points that bracket the x value
      for (let i = 0; i < data.length - 1; i++) {
        const point1 = data[i];
        const point2 = data[i + 1];

        if (point1.x <= dataX && dataX <= point2.x) {
          // Linear interpolation
          const t = (dataX - point1.x) / (point2.x - point1.x);
          return {
            value: point1.y + (point2.y - point1.y) * t,
            y: point1.y + (point2.y - point1.y) * t,
          };
        }
      }

      // If outside range, return closest endpoint
      if (dataX <= data[0].x) {
        return { value: data[0].y, y: data[0].y };
      }
      if (dataX >= data[data.length - 1].x) {
        return { value: data[data.length - 1].y, y: data[data.length - 1].y };
      }

      return null;
    };

    const yesResult = findValue(yesData);
    const noResult = findValue(noData);

    if (!yesResult || !noResult) {
      return { yesValue: null, noValue: null, yesY: 0, noY: 0 };
    }

    // Convert y value (0-1) to chart y coordinate
    const yMin = 0;
    const yMax = 1;
    const yesY = chartPadding.top + plotHeight - (yesResult.y - yMin) / (yMax - yMin) * plotHeight;
    const noY = chartPadding.top + plotHeight - (noResult.y - yMin) / (yMax - yMin) * plotHeight;

    return {
      yesValue: yesResult.value,
      noValue: noResult.value,
      yesY,
      noY,
    };
  }, [yesData, noData, plotWidth, plotHeight, chartPadding]);

  // Gesture handler - Pan for dragging cursor
  const panGesture = useMemo(
    () =>
      Gesture.Pan()
        .onStart((event) => {
          "worklet";
          const touchX = event.x - chartPadding.left;
          if (touchX >= 0 && touchX <= plotWidth) {
            cursorX.value = touchX;
            cursorVisible.value = true;
          }
        })
        .onUpdate((event) => {
          "worklet";
          const touchX = event.x - chartPadding.left;
          if (touchX >= 0 && touchX <= plotWidth) {
            cursorX.value = touchX;
          } else if (touchX < 0) {
            cursorX.value = 0;
          } else {
            cursorX.value = plotWidth;
          }
        }),
    [chartPadding.left, plotWidth]
  );

  // Tap gesture to hide cursor when tapping outside
  const tapGesture = useMemo(
    () =>
      Gesture.Tap()
        .onEnd((event) => {
          "worklet";
          const touchX = event.x - chartPadding.left;
          // Hide cursor if tapping outside the chart area
          if (touchX < 0 || touchX > plotWidth) {
            cursorVisible.value = false;
            cursorX.value = -1;
          }
        }),
    [chartPadding.left, plotWidth]
  );

  // Combined gesture - pan for dragging, tap for hiding
  const combinedGesture = useMemo(
    () => Gesture.Simultaneous(panGesture, tapGesture),
    [panGesture, tapGesture]
  );

  // Function to update cursor data (called from worklet)
  const updateCursorData = useCallback((xPos) => {
    if (xPos < 0) {
      cursorYesY.value = 0;
      cursorNoY.value = 0;
      setCursorData({
        x: -1,
        yesValue: null,
        noValue: null,
        yesY: 0,
        noY: 0,
      });
      return;
    }

    const values = getValuesAtX(xPos);
    cursorYesY.value = values.yesY;
    cursorNoY.value = values.noY;
    setCursorData({
      x: xPos + chartPadding.left,
      yesValue: values.yesValue,
      noValue: values.noValue,
      yesY: values.yesY,
      noY: values.noY,
    });
  }, [getValuesAtX, chartPadding.left, cursorYesY, cursorNoY]);

  // Update cursor data when cursor position changes
  useAnimatedReaction(
    () => ({
      x: cursorX.value,
      visible: cursorVisible.value,
    }),
    ({ x, visible }) => {
      "worklet";
      if (visible && x >= 0) {
        runOnJS(updateCursorData)(x);
      } else {
        runOnJS(updateCursorData)(-1);
      }
    }
  );

  // Combined data for Victory Native chart
  // Victory Native expects data in format: [{ x: value, yesPrice: value, noPrice: value }]
  const chartData = useMemo(() => {
    if (!yesData || !noData || yesData.length === 0 || noData.length === 0) {
      return [];
    }

    // Combine yes and no data by matching timestamps
    const combined = [];
    const maxLength = Math.max(yesData.length, noData.length);

    for (let i = 0; i < maxLength; i++) {
      const yesPoint = yesData[i];
      const noPoint = noData[i];

      if (yesPoint && noPoint) {
        combined.push({
          x: yesPoint.x, // Timestamp
          yesPrice: yesPoint.y,
          noPrice: noPoint.y,
        });
      } else if (yesPoint) {
        combined.push({
          x: yesPoint.x,
          yesPrice: yesPoint.y,
          noPrice: 1 - yesPoint.y,
        });
      } else if (noPoint) {
        combined.push({
          x: noPoint.x,
          yesPrice: 1 - noPoint.y,
          noPrice: noPoint.y,
        });
      }
    }

    return combined;
  }, [yesData, noData]);

  if (loading) {
    return (
      <View style={[styles.container, { width: chartWidth, height: chartHeight }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading price history...</Text>
        </View>
      </View>
    );
  }

  if (yesData.length === 0 && noData.length === 0) {
    return (
      <View style={[styles.container, { width: chartWidth, height: chartHeight }]}>
        <Text style={styles.emptyText}>No price history available</Text>
      </View>
    );
  }

  // Use team colors if provided, otherwise fallback to default colors
  const yesLineColor = yesColor || Colors.success;
  const noLineColor = noColor || Colors.danger;

  // Animated cursor styles
  const cursorAnimatedStyle = useAnimatedStyle(() => {
    const visible = cursorVisible.value && cursorX.value >= 0;
    return {
      opacity: visible ? 1 : 0,
      left: cursorX.value + chartPadding.left,
    };
  }, []);

  const yesDotAnimatedStyle = useAnimatedStyle(() => {
    const visible = cursorVisible.value && cursorX.value >= 0;
    return {
      opacity: visible ? 1 : 0,
      top: cursorYesY.value,
      left: cursorX.value + chartPadding.left - 6,
    };
  }, []);

  const noDotAnimatedStyle = useAnimatedStyle(() => {
    const visible = cursorVisible.value && cursorX.value >= 0;
    return {
      opacity: visible ? 1 : 0,
      top: cursorNoY.value,
      left: cursorX.value + chartPadding.left - 6,
    };
  }, []);

  const tooltipAnimatedStyle = useAnimatedStyle(() => {
    const visible = cursorVisible.value && cursorX.value >= 0;
    return {
      opacity: visible ? 1 : 0,
      left: Math.max(
        chartPadding.left,
        Math.min(
          chartWidth - chartPadding.right - 100,
          (cursorX.value + chartPadding.left) - 50
        )
      ),
    };
  }, [chartWidth]);

  return (
    <GestureHandlerRootView style={[styles.container, { width: chartWidth, height: chartHeight }]}>
      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View
            style={[styles.legendDot, { backgroundColor: yesLineColor }]}
          />
          <Text style={styles.legendText}>{yesLabel}</Text>
        </View>
        <View style={styles.legendItem}>
          <View
            style={[styles.legendDot, { backgroundColor: noLineColor }]}
          />
          <Text style={styles.legendText}>{noLabel}</Text>
        </View>
      </View>

      {/* Chart Container with Gesture Handler */}
      <GestureDetector gesture={combinedGesture}>
        <View style={styles.chartWrapper}>
          {/* Victory Native Chart */}
          {chartData.length > 0 && (
            <CartesianChart
              data={chartData}
              xKey="x"
              yKeys={["yesPrice", "noPrice"]}
              domainPadding={{ top: 20, bottom: 20 }}
              padding={chartPadding}
            >
              {({ points }) => (
                <>
                  <Line
                    points={points.yesPrice}
                    color={yesLineColor}
                    strokeWidth={3}
                    curveType="natural"
                  />
                  <Line
                    points={points.noPrice}
                    color={noLineColor}
                    strokeWidth={3}
                    curveType="natural"
                  />
                </>
              )}
            </CartesianChart>
          )}

          {/* Cursor Overlay */}
          <Animated.View
            style={[
              styles.cursorLine,
              cursorAnimatedStyle,
              { height: plotHeight, top: chartPadding.top },
            ]}
            pointerEvents="none"
          />

          {/* YES Team Dot */}
          <Animated.View
            style={[
              styles.cursorDot,
              {
                backgroundColor: yesLineColor,
              },
              yesDotAnimatedStyle,
            ]}
            pointerEvents="none"
          />

          {/* NO Team Dot */}
          <Animated.View
            style={[
              styles.cursorDot,
              {
                backgroundColor: noLineColor,
              },
              noDotAnimatedStyle,
            ]}
            pointerEvents="none"
          />

          {/* Tooltip */}
          {cursorData.yesValue !== null && cursorData.noValue !== null && (
            <Animated.View
              style={[styles.tooltip, tooltipAnimatedStyle]}
              pointerEvents="none"
            >
              <View style={styles.tooltipRow}>
                <View style={[styles.tooltipDot, { backgroundColor: yesLineColor }]} />
                <Text style={styles.tooltipLabel}>{yesLabel}:</Text>
                <Text style={styles.tooltipValue}>
                  {formatPercent(cursorData.yesValue)}
                </Text>
              </View>
              <View style={styles.tooltipRow}>
                <View style={[styles.tooltipDot, { backgroundColor: noLineColor }]} />
                <Text style={styles.tooltipLabel}>{noLabel}:</Text>
                <Text style={styles.tooltipValue}>
                  {formatPercent(cursorData.noValue)}
                </Text>
              </View>
            </Animated.View>
          )}
        </View>
      </GestureDetector>
    </GestureHandlerRootView>
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
    flex: 1,
    backgroundColor: Colors.glassSurface,
    padding: Spacing.md,
  },
  chartWrapper: {
    position: "relative",
    flex: 1,
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
  cursorLine: {
    position: "absolute",
    width: 1,
    backgroundColor: Colors.textMuted,
    opacity: 0.3,
    zIndex: 10,
  },
  cursorDot: {
    position: "absolute",
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: Colors.background,
    zIndex: 11,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  tooltip: {
    position: "absolute",
    backgroundColor: Colors.background,
    borderRadius: 8,
    padding: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
    top: 10,
    zIndex: 12,
    minWidth: 120,
  },
  tooltipRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    marginBottom: Spacing.xs / 2,
  },
  tooltipDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  tooltipLabel: {
    ...Typography.caption,
    color: Colors.textSecondary,
    fontSize: 11,
    flex: 1,
  },
  tooltipValue: {
    ...Typography.caption,
    color: Colors.textPrimary,
    fontSize: 11,
    fontWeight: "600",
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
