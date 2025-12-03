import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  useAnimatedStyle,
  withTiming,
  useSharedValue,
} from "react-native-reanimated";
import { Colors, Spacing, Typography } from "../../constants/theme";
import { normalize, normalizeFont } from "../../utils/dimensions";

export default function MarketRules({ market }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const rotation = useSharedValue(0);
  const opacity = useSharedValue(0);
  const height = useSharedValue(0);

  const rules = [
    {
      icon: "time-outline",
      title: "Settlement Time",
      description: "Markets settle immediately after the game ends.",
    },
    {
      icon: "cash-outline",
      title: "Price Movement",
      description: "Prices update in real-time based on market activity.",
    },
    {
      icon: "shield-checkmark-outline",
      title: "Fair Play",
      description: "All markets are based on official game results.",
    },
  ];

  const marketDescription = market?.marketData?.description || null;

  const toggleExpanded = () => {
    const newExpanded = !isExpanded;
    setIsExpanded(newExpanded);
    rotation.value = withTiming(newExpanded ? 180 : 0, { duration: 300 });
    opacity.value = withTiming(newExpanded ? 1 : 0, { duration: 300 });
    height.value = withTiming(newExpanded ? 1000 : 0, { duration: 300 });
  };

  const animatedChevronStyle = useAnimatedStyle(() => {
    return {
      transform: [{ rotate: `${rotation.value}deg` }],
    };
  });

  const animatedContentStyle = useAnimatedStyle(() => {
    return {
      maxHeight: height.value,
      opacity: opacity.value,
    };
  });

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.header}
        onPress={toggleExpanded}
        activeOpacity={0.7}
      >
        <Text style={styles.title}>How It Works</Text>
        <Animated.View style={animatedChevronStyle}>
          <Ionicons
            name="chevron-down"
            size={20}
            color={Colors.textSecondary}
          />
        </Animated.View>
      </TouchableOpacity>

      {marketDescription && (
        <Animated.View style={animatedContentStyle}>
          <Text style={styles.marketDescription}>{marketDescription}</Text>
        </Animated.View>
      )}

      <Animated.View style={[styles.rulesList, animatedContentStyle]}>
        {rules.map((rule, index) => (
          <View key={index} style={styles.ruleItem}>
            <View style={styles.iconContainer}>
              <Ionicons name={rule.icon} size={18} color={Colors.primary} />
            </View>
            <View style={styles.ruleContent}>
              <Text style={styles.ruleTitle}>{rule.title}</Text>
              <Text style={styles.ruleDescription}>{rule.description}</Text>
            </View>
          </View>
        ))}
      </Animated.View>
    </View>
  );
}

// Calculate responsive dimensions
const containerRadius = normalize(12);
const iconSize = normalize(32);
const iconRadius = normalize(16);
const iconMarginTop = normalize(2);
const titleFontSize = normalizeFont(18);
const descFontSize = normalizeFont(14);
const descLineHeight = normalize(20);
const descMarginBottom = normalize(30);
const ruleTitleFontSize = normalizeFont(15);
const ruleDescFontSize = normalizeFont(13);
const ruleDescLineHeight = normalize(18);

const styles = StyleSheet.create({
  container: {
    marginTop: Spacing.xl,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    backgroundColor: Colors.surface,
    borderRadius: containerRadius,
    marginHorizontal: Spacing.md,
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  title: {
    ...Typography.sectionTitle,
    fontSize: titleFontSize,
    fontWeight: "700",
  },
  marketDescription: {
    ...Typography.body,
    color: Colors.textSecondary,
    fontSize: descFontSize,
    lineHeight: descLineHeight,
    marginBottom: descMarginBottom,
  },
  rulesList: {
    gap: Spacing.md,
    overflow: "hidden",
  },
  ruleItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: Spacing.sm,
  },
  iconContainer: {
    width: iconSize,
    height: iconSize,
    borderRadius: iconRadius,
    backgroundColor: Colors.primary + "20",
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
    marginTop: iconMarginTop,
  },
  ruleContent: {
    flex: 1,
  },
  ruleTitle: {
    ...Typography.body,
    fontWeight: "600",
    marginBottom: Spacing.xs,
    fontSize: ruleTitleFontSize,
  },
  ruleDescription: {
    ...Typography.body,
    color: Colors.textTertiary,
    fontSize: ruleDescFontSize,
    lineHeight: ruleDescLineHeight,
  },
});
