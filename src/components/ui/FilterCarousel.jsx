import React from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity } from "react-native";
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
            style={[styles.pill, isActive && styles.pillActive]}
            onPress={() => onSelect(option.key)}
          >
            <Text style={[styles.label, isActive && styles.labelActive]}>
              {option.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  carousel: {
    marginBottom: Spacing.lg,
  },
  content: {
    paddingRight: Spacing.xl,
  },
  pill: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.sm,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: Colors.border,
    marginRight: Spacing.sm,
    backgroundColor: Colors.surface,
    overflow: "visible",
  },
  pillActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  label: {
    ...Typography.caption,
    color: Colors.textSecondary,
    fontWeight: "600",
    includeFontPadding: false,
    textAlignVertical: "center",
  },
  labelActive: {
    color: "#FFFFFF",
  },
});
