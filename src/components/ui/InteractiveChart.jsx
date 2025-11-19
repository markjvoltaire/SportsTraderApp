import React, { useMemo, useState, useCallback } from "react";
import { View, StyleSheet, Dimensions, Text } from "react-native";
import { Gesture, GestureDetector, GestureHandlerRootView } from "react-native-gesture-handler";
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
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  useAnimatedReaction,
  withDecay,
  withTiming,
  Easing,
  runOnJS,
} from "react-native-reanimated";
import { getSmoothPath, getYforX, scaleDataToCanvas, interpolateColor } from "../../utils/chartUtils";
import { Colors, Spacing } from "../../constants/theme";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

/**
 * Hook to handle graph touch gestures
 * Manages cursor position with activation threshold and momentum
 */
function useGraphTouchHandler(chartWidth, cursorX, cursorY, isActive, onActivate, onDeactivate) {
  const chartWidthValue = useSharedValue(chartWidth);
  const offsetX = useSharedValue(0);

  // Update chartWidthValue when chartWidth changes
  React.useEffect(() => {
    chartWidthValue.value = chartWidth;
  }, [chartWidth, chartWidthValue]);

  const gesture = useMemo(
    () =>
      Gesture.Pan()
        .onStart((event) => {
          "worklet";
          const touchX = event.x || 0;
          const touchY = event.y || 0;
          const currentX = cursorX.value;
          const currentY = cursorY.value;

          // Calculate distance from touch point to current cursor (if visible)
          let distance = Number.MAX_SAFE_INTEGER;
          if (currentX >= 0 && currentY >= 0) {
            const dx = touchX - currentX;
            const dy = touchY - currentY;
            distance = Math.sqrt(dx * dx + dy * dy);
          }

          // Activation threshold: 50px, or if cursor is hidden (initial touch)
          const threshold = 50;
          if (distance < threshold || currentX < 0) {
            if (onActivate) {
              runOnJS(onActivate)();
            }
            // Clamp touch position to chart bounds
            const clampedX = Math.max(0, Math.min(chartWidthValue.value, touchX));
            cursorX.value = clampedX;
            offsetX.value = clampedX - touchX;
            isActive.value = true;
          }
        })
        .onUpdate((event) => {
          "worklet";
          if (isActive.value && event.x !== undefined) {
            const clampedX = Math.max(0, Math.min(chartWidthValue.value, event.x + offsetX.value));
            cursorX.value = clampedX;
          }
        })
        .onEnd((event) => {
          "worklet";
          if (isActive.value) {
            // Apply momentum with decay using velocity if available
            const velocity = event.velocityX || 0;
            cursorX.value = withDecay(
              {
                velocity: velocity,
                clamp: [0, chartWidthValue.value],
                deceleration: 0.998,
              },
              () => {
                "worklet";
                // Optional: deactivate after momentum ends
                // runOnJS(onDeactivate)();
              }
            );
          }
        }),
    [chartWidthValue, cursorX, cursorY, isActive, onActivate, onDeactivate, offsetX]
  );

  return gesture;
}

/**
 * Interactive Skia Chart Component
 */
export default function InteractiveChart({
  datasets = [],
  height = 220,
  width = SCREEN_WIDTH - Spacing.xl * 2,
  padding = { top: 20, bottom: 30, left: 44, right: 12 },
  colorStart = Colors.success,
  colorEnd = Colors.primary,
  onValueChange,
  formatValue = (value) => `${(value * 100).toFixed(1)}¢`,
}) {
  const [selectedDatasetIndex, setSelectedDatasetIndex] = useState(0);
  const selectedDatasetIndexValue = useSharedValue(0);
  const transitionValue = useSharedValue(0);
  const cursorX = useSharedValue(-1); // -1 means cursor is hidden
  const cursorY = useSharedValue(0);
  const isActive = useSharedValue(false);

  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  // Sync state with shared value
  React.useEffect(() => {
    selectedDatasetIndexValue.value = selectedDatasetIndex;
  }, [selectedDatasetIndex, selectedDatasetIndexValue]);

  // Convert datasets to scaled canvas coordinates
  const scaledDatasets = useMemo(() => {
    return datasets.map((dataset) => scaleDataToCanvas(dataset, width, height, padding));
  }, [datasets, width, height, padding]);

  // Generate paths for all datasets
  const paths = useMemo(() => {
    return scaledDatasets.map((scaledData) => {
      if (!scaledData || scaledData.length === 0) return null;
      return getSmoothPath(scaledData);
    });
  }, [scaledDatasets]);

  // Convert paths to Skia Path objects
  const skiaPaths = useMemo(() => {
    return paths.map((pathData) => {
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
    });
  }, [paths]);

  // Create interpolated path based on transition value
  const interpolatedPath = useDerivedValue(() => {
    "worklet";
    if (!skiaPaths || skiaPaths.length === 0) return null;
    
    const index = Math.max(0, Math.min(skiaPaths.length - 1, selectedDatasetIndexValue.value));
    const currentPath = skiaPaths[index];
    if (!currentPath) return null;

    // If transition is complete or no transition, return current path
    if (transitionValue.value === 0) {
      return currentPath;
    }

    // Find next path (for morphing between datasets)
    const nextIndex = (index + 1) % skiaPaths.length;
    const nextPath = skiaPaths[nextIndex];

    if (!nextPath || transitionValue.value === 1) {
      return nextPath || currentPath;
    }

    // Interpolate between paths
    try {
      return currentPath.interpolate(nextPath, transitionValue.value);
    } catch (e) {
      // Fallback if interpolation fails
      return currentPath;
    }
  }, [skiaPaths, selectedDatasetIndexValue, transitionValue]);

  // Store padding and chartWidth as constants for worklet access
  const paddingLeft = padding.left;
  const paddingTop = padding.top;
  const chartWidthValue = chartWidth;

  // Calculate cursor Y position based on X position
  const cursorData = useDerivedValue(() => {
    "worklet";
    if (cursorX.value < 0) {
      return { x: -1, y: 0, value: null, color: colorStart };
    }

    if (!paths || paths.length === 0) {
      return { x: cursorX.value, y: 0, value: null, color: colorStart };
    }
    const index = Math.max(0, Math.min(paths.length - 1, selectedDatasetIndexValue.value));
    const currentPathData = paths[index];
    if (!currentPathData || !currentPathData.segments) {
      return { x: cursorX.value, y: 0, value: null, color: colorStart };
    }

    // Adjust x to account for padding
    const adjustedX = cursorX.value + paddingLeft;
    const y = getYforX(currentPathData.segments, adjustedX);

    if (y === null || y === undefined) {
      return { x: cursorX.value, y: 0, value: null, color: colorStart };
    }

    // Find original value by inverse scaling
    if (!scaledDatasets || scaledDatasets.length === 0) {
      return { x: cursorX.value, y: y - paddingTop, value: null, color: colorStart };
    }
    const safeIndex = Math.max(0, Math.min(scaledDatasets.length - 1, index));
    const scaledData = scaledDatasets[safeIndex];
    if (!scaledData || scaledData.length === 0) {
      return { x: cursorX.value, y: y - paddingTop, value: null, color: colorStart };
    }

    // Find closest data point to get original value
    let closestPoint = scaledData[0];
    if (!closestPoint || closestPoint.x === undefined) {
      return { x: cursorX.value, y: y - paddingTop, value: null, color: colorStart };
    }

    let minDist = Math.abs(adjustedX - closestPoint.x);

    for (let i = 1; i < scaledData.length; i++) {
      const point = scaledData[i];
      if (!point || point.x === undefined) continue;
      const dist = Math.abs(adjustedX - point.x);
      if (dist < minDist) {
        minDist = dist;
        closestPoint = point;
      }
    }

    // Interpolate color based on x position (0 to chartWidth maps to colorStart to colorEnd)
    const t = Math.max(0, Math.min(1, cursorX.value / chartWidthValue));
    const color = interpolateColor(colorStart, colorEnd, t);

    const result = {
      x: cursorX.value,
      y: y - paddingTop,
      value: closestPoint.originalY !== undefined ? closestPoint.originalY : null,
      color,
    };

    cursorY.value = result.y;
    return result;
  }, [cursorX, cursorY, paths, selectedDatasetIndexValue, scaledDatasets, chartWidthValue, paddingLeft, paddingTop, colorStart, colorEnd]);

  // Handle dataset selection with animation
  const handleDatasetChange = useCallback(
    (index) => {
      if (index === selectedDatasetIndex) return;

      // Reset transition
      transitionValue.value = 0;
      selectedDatasetIndexValue.value = index;

      // Animate transition
      transitionValue.value = withTiming(
        1,
        {
          duration: 1000,
          easing: Easing.inOut(Easing.cubic),
        },
        (finished) => {
          "worklet";
          if (finished) {
            runOnJS(setSelectedDatasetIndex)(index);
            transitionValue.value = 0;
          }
        }
      );
    },
    [selectedDatasetIndex, transitionValue, selectedDatasetIndexValue]
  );

  const handleActivate = useCallback(() => {
    // Cursor activated
  }, []);

  const handleDeactivate = useCallback(() => {
    // Cursor deactivated
    isActive.value = false;
    cursorX.value = -1;
  }, [isActive, cursorX]);

  // Gesture handler
  const gesture = useGraphTouchHandler(
    chartWidth,
    cursorX,
    cursorY,
    isActive,
    handleActivate,
    handleDeactivate
  );

  // Update parent when cursor value changes
  useAnimatedReaction(
    () => cursorData.value,
    (data) => {
      if (data && data.value !== null && onValueChange) {
        runOnJS(onValueChange)(data.value, data);
      }
    }
  );

  // Render cursor and label
  const cursorGroup = useDerivedValue(() => {
    "worklet";
    if (cursorX.value < 0 || !isActive.value) {
      return { x: -1, y: 0, value: null, color: colorStart, visible: false };
    }

    const data = cursorData.value;
    if (data.x < 0 || data.value === null) {
      return { x: -1, y: 0, value: null, color: colorStart, visible: false };
    }

    return {
      x: data.x + paddingLeft,
      y: data.y + paddingTop,
      color: data.color,
      value: data.value,
      visible: true,
    };
  }, [cursorX, cursorY, cursorData, isActive, paddingLeft, paddingTop, colorStart]);

  // Derived value for path visibility (always render if path exists)
  const shouldShowPath = useMemo(() => {
    return skiaPaths && skiaPaths.length > 0 && skiaPaths[selectedDatasetIndex];
  }, [skiaPaths, selectedDatasetIndex]);

  // Store current path in state to avoid reading .value during render
  const [currentPath, setCurrentPath] = React.useState(null);

  useAnimatedReaction(
    () => interpolatedPath.value,
    (path) => {
      runOnJS(setCurrentPath)(path);
    }
  );

  // State for cursor visibility (updated via useAnimatedReaction to avoid reading .value in render)
  const [showCursor, setShowCursor] = React.useState(false);
  
  useAnimatedReaction(
    () => {
      const group = cursorGroup.value;
      return group && group.visible && isActive.value;
    },
    (visible) => {
      runOnJS(setShowCursor)(visible);
    }
  );

  return (
    <GestureHandlerRootView style={{ width, height }}>
      <GestureDetector gesture={gesture}>
        <View style={[styles.container, { width, height }]}>
          <Canvas style={styles.canvas}>
            {/* Grid lines */}
            <Group>
              {/* Horizontal grid lines */}
              {[0, 0.25, 0.5, 0.75, 1].map((t) => {
                const y = padding.top + t * chartHeight;
                return (
                  <Line
                    key={`h-${t}`}
                    p1={vec(padding.left, y)}
                    p2={vec(width - padding.right, y)}
                    color={Colors.border}
                    strokeWidth={0.5}
                  />
                );
              })}
            </Group>

            {/* Chart path with gradient */}
            {shouldShowPath && currentPath && (
              <Group>
                {/* Gradient definition */}
                <LinearGradient
                  start={vec(0, padding.top)}
                  end={vec(0, height - padding.bottom)}
                  colors={[colorStart, colorEnd]}
                />
                <Path
                  path={currentPath}
                  style="stroke"
                  strokeWidth={2}
                  color={Colors.primary}
                />
              </Group>
            )}

            {/* Cursor - always render but conditionally show */}
            <CursorRenderer
              cursorGroup={cursorGroup}
              showCursor={showCursor}
              paddingTop={padding.top}
              paddingBottom={padding.bottom}
              height={height}
            />
          </Canvas>

          {/* Cursor label */}
          <CursorLabel
            cursorGroup={cursorGroup}
            isActive={isActive}
            formatValue={formatValue}
          />
        </View>
      </GestureDetector>
    </GestureHandlerRootView>
  );
}

/**
 * Cursor renderer for Skia Canvas
 */
function CursorRenderer({ cursorGroup, showCursor, paddingTop, paddingBottom, height }) {
  // Store cursor values in state to avoid reading .value during render
  const [cursorData, setCursorData] = React.useState({ x: 0, y: 0, color: Colors.primary, opacity: 0 });

  useAnimatedReaction(
    () => {
      const group = cursorGroup.value;
      return {
        x: group && group.visible ? group.x : 0,
        y: group && group.visible ? group.y : 0,
        color: group && group.visible ? group.color : Colors.primary,
        visible: group && group.visible && showCursor,
      };
    },
    (data) => {
      runOnJS(setCursorData)({
        x: data.x,
        y: data.y,
        color: data.color,
        opacity: data.visible ? 1 : 0,
      });
    }
  );

  // Always render but use opacity to hide when not visible
  return (
    <Group opacity={cursorData.opacity}>
      {/* Vertical line */}
      <Line
        p1={vec(cursorData.x, paddingTop)}
        p2={vec(cursorData.x, height - paddingBottom)}
        color={cursorData.color}
        strokeWidth={1}
        opacity={0.5}
      />
      {/* Cursor circle */}
      <Circle
        cx={cursorData.x}
        cy={cursorData.y}
        r={6}
        color={cursorData.color}
      />
      <Circle
        cx={cursorData.x}
        cy={cursorData.y}
        r={4}
        color={Colors.background}
      />
    </Group>
  );
}

/**
 * Cursor label component showing the current value
 */
function CursorLabel({ cursorGroup, isActive, formatValue }) {
  const labelX = useSharedValue(-1);
  const labelY = useSharedValue(0);
  const labelValue = useSharedValue(null);
  const labelColor = useSharedValue(Colors.primary);
  const labelVisible = useSharedValue(false);

  useAnimatedReaction(
    () => ({
      group: cursorGroup.value,
      active: isActive.value,
    }),
    ({ group, active }) => {
      "worklet";
      if (group && active && group.value !== null && group.x >= 0) {
        labelX.value = group.x;
        labelY.value = group.y;
        labelValue.value = group.value;
        labelColor.value = group.color;
        labelVisible.value = true;
      } else {
        labelVisible.value = false;
      }
    }
  );

  const animatedStyle = useAnimatedStyle(() => {
    "worklet";
    if (!labelVisible.value || labelValue.value === null) {
      return {
        opacity: 0,
        position: "absolute",
        left: labelX.value - 30,
        top: labelY.value - 40,
      };
    }
    return {
      position: "absolute",
      left: labelX.value - 30,
      top: labelY.value - 40,
      opacity: 1,
    };
  }, []);

  const [displayText, setDisplayText] = React.useState("");

  useAnimatedReaction(
    () => labelValue.value,
    (value) => {
      "worklet";
      if (value !== null && value !== undefined) {
        runOnJS(setDisplayText)(formatValue(value));
      } else {
        runOnJS(setDisplayText)("");
      }
    }
  );

  const borderColorStyle = useAnimatedStyle(() => ({
    borderColor: labelColor.value,
  }), []);

  const textColorStyle = useAnimatedStyle(() => ({
    color: labelColor.value,
  }), []);

  return (
    <Animated.View
      style={[
        animatedStyle,
        {
          backgroundColor: Colors.background,
          paddingHorizontal: Spacing.sm,
          paddingVertical: Spacing.xs,
          borderRadius: 6,
          borderWidth: 1,
        },
        borderColorStyle,
      ]}
      pointerEvents="none"
    >
      <Animated.Text style={[styles.labelText, textColorStyle]}>
        {displayText}
      </Animated.Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "relative",
  },
  canvas: {
    flex: 1,
  },
  labelText: {
    fontSize: 12,
    fontWeight: "600",
  },
});

