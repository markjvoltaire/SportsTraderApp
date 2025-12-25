import React, { useRef, useEffect } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  Pressable,
  Platform,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  interpolateColor,
} from "react-native-reanimated";
import { Colors, Spacing, Typography, BorderRadius } from "../../constants/theme";

// Animated filter button component
function AnimatedFilterButton({ option, isActive, onPressIn, onPressOut }) {
  const activeProgress = useSharedValue(isActive ? 1 : 0);
  const scale = useSharedValue(1);

  useEffect(() => {
    activeProgress.value = withTiming(isActive ? 1 : 0, {
      duration: 250,
    });
  }, [isActive]);

  // Get color for border
  const getBorderColor = (key) => {
    const colorMap = {
      all: "#10B981", // Green for Explore
      nba: "#8B5CF6", // Purple for NBA
      nfl: "#F87171", // Pink/Red for NFL
      nhl: "#3B82F6", // Blue for NHL
      ufc: "#F59E0B", // Orange for UFC
      soccer: "#10B981", // Green for Soccer
      cfb: "#06B6D4", // Cyan for CFB
      boxing: "#EF4444", // Red for Boxing
      cbb: "#8B5CF6", // Purple for CBB
      wbna: "#EC4899", // Pink for WNBA
    };
    return colorMap[key] || Colors.primary;
  };

  const borderColor = getBorderColor(option.key);

  const animatedButtonStyle = useAnimatedStyle(() => {
    const backgroundColor = "transparent";

    // Interpolate border width from 1 to 2
    const borderWidth = 1 + activeProgress.value;

    const borderColorAnimated = interpolateColor(
      activeProgress.value,
      [0, 1],
      ["rgba(255, 255, 255, 0.1)", borderColor]
    );

    return {
      backgroundColor,
      borderWidth,
      borderColor: borderColorAnimated,
      transform: [{ scale: scale.value }],
    };
  });

  const animatedTextStyle = useAnimatedStyle(() => {
    // Interpolate opacity from 0.7 to 1.0
    const opacity = 0.7 + activeProgress.value * 0.3;

    return {
      opacity,
    };
  });

  return (
    <Pressable
      style={styles.buttonContainer}
      onPressIn={(e) => {
        scale.value = withSpring(0.95, { damping: 15 });
        onPressIn(e);
      }}
      onPressOut={(e) => {
        scale.value = withSpring(1, { damping: 15 });
        onPressOut(option.key, e);
      }}
    >
      <Animated.View style={[styles.button, animatedButtonStyle]}>
        <Animated.Text style={[styles.label, animatedTextStyle]}>
          {option.label}
        </Animated.Text>
      </Animated.View>
    </Pressable>
  );
}

export default function FilterCarousel({ options, selectedKey, onSelect }) {
  const scrollViewRef = useRef(null);
  const pressStartTimeRef = useRef(0);
  const pressStartXRef = useRef(0);
  const pressStartYRef = useRef(0);

  const handlePressIn = (event) => {
    pressStartTimeRef.current = Date.now();
    pressStartXRef.current = event.nativeEvent.pageX;
    pressStartYRef.current = event.nativeEvent.pageY;
  };

  const handlePressOut = (optionKey, event) => {
    const pressDuration = Date.now() - pressStartTimeRef.current;
    const deltaX = Math.abs(event.nativeEvent.pageX - pressStartXRef.current);
    const deltaY = Math.abs(event.nativeEvent.pageY - pressStartYRef.current);
    
    // Only trigger selection if it was a tap (not a scroll)
    // A tap is: short duration (< 300ms) and small movement (< 10px)
    if (pressDuration < 300 && deltaX < 10 && deltaY < 10) {
      onSelect(optionKey);
    }
  };

  return (
    <ScrollView
      ref={scrollViewRef}
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.carousel}
      contentContainerStyle={styles.content}
      scrollEventThrottle={16}
      decelerationRate="fast"
    >
      {options.map((option) => {
        return (
          <AnimatedFilterButton
            key={option.key}
            option={option}
            isActive={selectedKey === option.key}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
          />
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  carousel: {
    marginBottom: Spacing.md,
  },
  content: {
    paddingRight: Spacing.xl,
    paddingLeft: Spacing.sm,
  },
  buttonContainer: {
    marginRight: Spacing.sm,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    minHeight: 44,
    gap: Spacing.sm,
  },
  label: {
    ...Typography.caption,
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 14,
    fontFamily: Platform.select({
      ios: "SF Pro Display",
      android: "sans-serif",
      default: "System",
    }),
  },
});
