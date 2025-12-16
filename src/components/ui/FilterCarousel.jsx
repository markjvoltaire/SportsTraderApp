import React, { useRef } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  Image,
  View,
  Pressable,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Spacing, Typography, BorderRadius } from "../../constants/theme";

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
        const isActive = selectedKey === option.key;
        
        // Get icon name for sports
        const getIconName = (key) => {
          const iconMap = {
            nba: "basketball-outline",
            nfl: "football-outline",
            nhl: "ice-hockey-outline",
            ufc: "fitness-outline",
            soccer: "football-outline",
            cfb: "school-outline",
            boxing: "fitness-outline",
            cbb: "basketball-outline",
            wbna: "basketball-outline",
            all: "compass-outline",
          };
          return iconMap[key] || "ellipse-outline";
        };

        // Get color for icon background
        const getIconColor = (key) => {
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

        const iconColor = getIconColor(option.key);
        const iconName = getIconName(option.key);

        return (
          <Pressable
            key={option.key}
            style={({ pressed }) => [
              styles.buttonContainer,
              pressed && styles.buttonPressed,
            ]}
            onPressIn={handlePressIn}
            onPressOut={(e) => handlePressOut(option.key, e)}
          >
            <View
              style={[
                styles.button,
                isActive && [
                  styles.buttonActive,
                  { borderColor: iconColor },
                ],
              ]}
            >
              {/* Colored square icon area */}
              <View
                style={[
                  styles.iconContainer,
                  { backgroundColor: iconColor },
                  isActive && styles.iconContainerActive,
                ]}
              >
                <Ionicons
                  name={iconName}
                  size={18}
                  color="#000000"
                />
              </View>
              {/* Text label */}
              <Text
                style={[
                  styles.label,
                  isActive && styles.labelActive,
                ]}
              >
                {option.label}
              </Text>
            </View>
          </Pressable>
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
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    minHeight: 44,
    gap: Spacing.sm,
  },
  buttonActive: {
    backgroundColor: "rgba(255, 255, 255, 0.12)",
    borderWidth: 2,
  },
  buttonPressed: {
    opacity: 0.8,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  iconContainerActive: {
    width: 34,
    height: 34,
    borderRadius: 9,
  },
  label: {
    ...Typography.caption,
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 14,
    opacity: 0.7,
  },
  labelActive: {
    opacity: 1,
    fontWeight: "700",
  },
});
