import React, { useMemo } from "react";
import { View, StyleSheet, Dimensions, Text } from "react-native";
import {
  Canvas,
  Path,
  Skia,
  Line,
  Group,
  LinearGradient,
  vec,
} from "@shopify/react-native-skia";
import { scaleDataToCanvas } from "../../utils/chartUtils";
import { Colors, Spacing } from "../../constants/theme";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

/**
 * Orderbook Depth Chart Component
 * Displays cumulative depth for bids and asks
 */
export default function OrderbookDepthChart({
  bidsDepth = [],
  asksDepth = [],
  height = 300,
  width = SCREEN_WIDTH - Spacing.xl * 2,
  padding = { top: 20, bottom: 40, left: 50, right: 12 },
}) {
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  // Scale data to canvas coordinates
  const scaledBids = useMemo(() => {
    if (!bidsDepth || bidsDepth.length === 0) return [];
    return scaleDataToCanvas(bidsDepth, width, height, padding);
  }, [bidsDepth, width, height, padding]);

  const scaledAsks = useMemo(() => {
    if (!asksDepth || asksDepth.length === 0) return [];
    return scaleDataToCanvas(asksDepth, width, height, padding);
  }, [asksDepth, width, height, padding]);

  // Create paths for bids and asks (area charts)
  const bidsPath = useMemo(() => {
    if (scaledBids.length === 0) return null;
    const path = Skia.Path.Make();
    // Start from bottom-left (first bid price, bottom of chart)
    const firstBidX = scaledBids[0].x;
    path.moveTo(firstBidX, height - padding.bottom);
    // Draw line to first point
    path.lineTo(scaledBids[0].x, scaledBids[0].y);
    // Draw curve through all points
    for (let i = 1; i < scaledBids.length; i++) {
      path.lineTo(scaledBids[i].x, scaledBids[i].y);
    }
    // Close path to bottom-right (last bid price, bottom of chart)
    if (scaledBids.length > 0) {
      const lastBidX = scaledBids[scaledBids.length - 1].x;
      path.lineTo(lastBidX, height - padding.bottom);
      path.close();
    }
    return path;
  }, [scaledBids, height, padding.bottom]);

  const asksPath = useMemo(() => {
    if (scaledAsks.length === 0) return null;
    const path = Skia.Path.Make();
    // Start from bottom-left (first ask price, bottom of chart)
    const firstAskX = scaledAsks[0].x;
    path.moveTo(firstAskX, height - padding.bottom);
    // Draw line to first point
    path.lineTo(scaledAsks[0].x, scaledAsks[0].y);
    // Draw curve through all points
    for (let i = 1; i < scaledAsks.length; i++) {
      path.lineTo(scaledAsks[i].x, scaledAsks[i].y);
    }
    // Close path to bottom-right (last ask price, bottom of chart)
    if (scaledAsks.length > 0) {
      const lastAskX = scaledAsks[scaledAsks.length - 1].x;
      path.lineTo(lastAskX, height - padding.bottom);
      path.close();
    }
    return path;
  }, [scaledAsks, height, padding.bottom]);

  // Calculate price range for x-axis labels
  const priceRange = useMemo(() => {
    const allPrices = [
      ...bidsDepth.map((b) => b.x),
      ...asksDepth.map((a) => a.x),
    ];
    if (allPrices.length === 0) return { min: 0, max: 1 };
    return {
      min: Math.min(...allPrices),
      max: Math.max(...allPrices),
    };
  }, [bidsDepth, asksDepth]);

  // Find mid-price (spread center)
  const midPrice = useMemo(() => {
    if (priceRange.min >= priceRange.max) return priceRange.min;
    return (priceRange.min + priceRange.max) / 2;
  }, [priceRange]);

  // Calculate mid-price x position for vertical line
  const midPriceX = useMemo(() => {
    if (priceRange.min >= priceRange.max) return padding.left;
    const priceRangeSpan = priceRange.max - priceRange.min;
    if (priceRangeSpan === 0) return padding.left;
    const normalizedPrice = (midPrice - priceRange.min) / priceRangeSpan;
    return padding.left + normalizedPrice * chartWidth;
  }, [midPrice, priceRange, padding.left, chartWidth]);

  return (
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
                opacity={0.3}
              />
            );
          })}
        </Group>

        {/* Bids area (buy side) */}
        {bidsPath && (
          <Group>
            <LinearGradient
              start={vec(0, padding.top)}
              end={vec(0, height - padding.bottom)}
              colors={["rgba(0, 0, 0, 0.3)", "rgba(0, 0, 0, 0.1)"]}
            />
            <Path
              path={bidsPath}
              style="fill"
              color={Colors.primary}
              opacity={0.3}
            />
            <Path
              path={bidsPath}
              style="stroke"
              color={Colors.primary}
              strokeWidth={2}
            />
          </Group>
        )}

        {/* Asks area (sell side) */}
        {asksPath && (
          <Group>
            <LinearGradient
              start={vec(0, padding.top)}
              end={vec(0, height - padding.bottom)}
              colors={["rgba(51, 51, 51, 0.3)", "rgba(51, 51, 51, 0.1)"]}
            />
            <Path
              path={asksPath}
              style="fill"
              color={Colors.textSecondary}
              opacity={0.3}
            />
            <Path
              path={asksPath}
              style="stroke"
              color={Colors.textSecondary}
              strokeWidth={2}
            />
          </Group>
        )}

        {/* Mid-price line (spread indicator) */}
        {priceRange.min < priceRange.max && (
          <Line
            p1={vec(midPriceX, padding.top)}
            p2={vec(midPriceX, height - padding.bottom)}
            color={Colors.textPrimary}
            strokeWidth={1}
            opacity={0.5}
          />
        )}
      </Canvas>

      {/* Labels */}
      <View style={[styles.labels, { left: padding.left, right: padding.right }]}>
        <View style={styles.labelContainer}>
          <View style={[styles.labelColor, { backgroundColor: Colors.primary }]} />
          <Text style={styles.label}>Bids (Buy)</Text>
        </View>
        <View style={styles.labelContainer}>
          <View style={[styles.labelColor, { backgroundColor: Colors.textSecondary }]} />
          <Text style={styles.label}>Asks (Sell)</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "relative",
  },
  canvas: {
    flex: 1,
  },
  labels: {
    position: "absolute",
    bottom: 8,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  labelContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  labelColor: {
    width: 12,
    height: 12,
    borderRadius: 2,
  },
  label: {
    fontSize: 12,
    color: Colors.textPrimary,
    opacity: 0.7,
    fontWeight: "500",
  },
});

