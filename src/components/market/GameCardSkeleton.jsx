import React, { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  interpolate,
  Easing,
} from "react-native-reanimated";
import { Colors, Spacing } from "../../constants/theme";

export default function GameCardSkeleton() {
  const shimmer = useSharedValue(0);

  useEffect(() => {
    shimmer.value = withRepeat(
      withTiming(1, {
        duration: 1500,
        easing: Easing.linear,
      }),
      -1,
      false
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      shimmer.value,
      [0, 0.5, 1],
      [0.4, 0.8, 0.4]
    );
    return {
      opacity,
    };
  });

  return (
    <View style={styles.card}>
      {/* Teams Row */}
      <View style={styles.teamsRow}>
        {/* Team 1 */}
        <View style={styles.teamContainer}>
          <Animated.View style={[styles.teamIconCircle, animatedStyle]} />
          <Animated.View style={[styles.teamNamePlaceholder, animatedStyle]} />
        </View>

        {/* VS Text Placeholder */}
        <Animated.View style={[styles.vsPlaceholder, animatedStyle]} />

        {/* Team 2 */}
        <View style={styles.teamContainer}>
          <Animated.View style={[styles.teamIconCircle, animatedStyle]} />
          <Animated.View style={[styles.teamNamePlaceholder, animatedStyle]} />
        </View>
      </View>

      {/* Percentage Bar */}
      <View style={styles.percentageBarContainer}>
        <Animated.View style={[styles.percentageBar, animatedStyle]} />
        {/* Volume Row */}
        <View style={styles.volumeRow}>
          <Animated.View style={[styles.volumePlaceholder, animatedStyle]} />
          <Animated.View style={[styles.volumePlaceholder, animatedStyle]} />
          <Animated.View style={[styles.volumePlaceholder, animatedStyle]} />
        </View>
      </View>

      {/* Price Boxes */}
      <View style={styles.priceBoxesRow}>
        <Animated.View style={[styles.priceBox, animatedStyle]} />
        <Animated.View style={[styles.priceBox, animatedStyle]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface || "#F5F5F5",
    borderRadius: 12,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    marginHorizontal: Spacing.md,
    shadowColor: "rgba(0, 0, 0, 0.08)",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.05)",
  },
  teamsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.sm,
  },
  teamContainer: {
    alignItems: "center",
    flex: 1,
  },
  teamIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.border || "#E5E7EB",
    marginBottom: Spacing.xs,
  },
  teamNamePlaceholder: {
    width: 50,
    height: 14,
    borderRadius: 4,
    backgroundColor: Colors.border || "#E5E7EB",
  },
  vsPlaceholder: {
    width: 30,
    height: 14,
    borderRadius: 4,
    backgroundColor: Colors.border || "#E5E7EB",
    marginHorizontal: Spacing.md,
  },
  percentageBarContainer: {
    marginBottom: Spacing.md,
  },
  percentageBar: {
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.border || "#E5E7EB",
    marginBottom: Spacing.xs,
  },
  volumeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.xs,
  },
  volumePlaceholder: {
    width: 60,
    height: 12,
    borderRadius: 4,
    backgroundColor: Colors.border || "#E5E7EB",
  },
  priceBoxesRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  priceBox: {
    flex: 1,
    height: 70,
    backgroundColor: Colors.border || "#E5E7EB",
    borderRadius: 8,
    marginHorizontal: Spacing.xs,
  },
});

