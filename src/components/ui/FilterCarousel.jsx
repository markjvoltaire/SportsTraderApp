import React, { useRef } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  Image,
  View,
  Pressable,
} from "react-native";
import { Colors, Spacing, Typography } from "../../constants/theme";

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
        return (
          <Pressable
            key={option.key}
            style={({ pressed }) => [
              styles.button,
              pressed && styles.buttonPressed,
            ]}
            onPressIn={handlePressIn}
            onPressOut={(e) => handlePressOut(option.key, e)}
          >
            {option.icon ? (
              <Image
                source={option.icon}
                style={[styles.icon, isActive && styles.iconActive]}
                resizeMode="contain"
              />
            ) : (
              <View style={styles.iconPlaceholder}>
                <Text
                  style={[styles.iconText, isActive && styles.iconTextActive]}
                >
                  {option.label.charAt(0)}
                </Text>
              </View>
            )}
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  carousel: {
    marginBottom: Spacing.lg,
    top: 10,
  },
  content: {
    paddingRight: Spacing.xl,
  },
  button: {
    width: 70,
    height: 70,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    marginRight: Spacing.sm,
    backgroundColor: Colors.surface,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden", // Ensure icon doesn't extend beyond button bounds
  },
  buttonPressed: {
    opacity: 0.8,
  },
  icon: {
    width: 63,
    height: 63,
    opacity: 0.7,
  },
  iconActive: {
    opacity: 1,
  },
  iconPlaceholder: {
    width: 32,
    height: 32,
    marginBottom: Spacing.xs,
    alignItems: "center",
    justifyContent: "center",
  },
  iconText: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.textSecondary,
    opacity: 0.7,
  },
  iconTextActive: {
    color: "#FFFFFF",
    opacity: 1,
  },
  label: {
    fontSize: 11,
    fontWeight: "600",
    color: Colors.textSecondary,
    marginTop: 2,
    textAlign: "center",
  },
  labelActive: {
    color: "#FFFFFF",
  },
});
