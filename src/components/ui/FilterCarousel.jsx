import React from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  Image,
  View,
} from "react-native";
import { Colors, Spacing, Typography } from "../../constants/theme";

export default function FilterCarousel({ options, selectedKey, onSelect }) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.carousel}
      contentContainerStyle={styles.content}
    >
      {options.map((option) => {
        const isActive = selectedKey === option.key;
        return (
          <TouchableOpacity
            key={option.key}
            activeOpacity={0.8}
            style={styles.button}
            onPress={() => onSelect(option.key)}
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
          </TouchableOpacity>
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
    width: 55,
    height: 55,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    marginRight: Spacing.sm,
    backgroundColor: Colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },

  icon: {
    width: 100,
    height: 50,

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
