import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Spacing, Typography } from "../../constants/theme";

export default function MarketRules() {
  const rules = [
    {
      icon: "trophy-outline",
      title: "Winner Takes All",
      description: "The team that wins the game receives the full payout.",
    },
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

  return (
    <View style={styles.container}>
      <Text style={styles.title}>How It Works</Text>
      <View style={styles.rulesList}>
        {rules.map((rule, index) => (
          <View key={index} style={styles.ruleItem}>
            <View style={styles.iconContainer}>
              <Ionicons
                name={rule.icon}
                size={20}
                color={Colors.primary}
              />
            </View>
            <View style={styles.ruleContent}>
              <Text style={styles.ruleTitle}>{rule.title}</Text>
              <Text style={styles.ruleDescription}>{rule.description}</Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: Spacing.xl,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    marginHorizontal: Spacing.md,
  },
  title: {
    ...Typography.sectionTitle,
    marginBottom: Spacing.md,
    fontSize: 18,
    fontWeight: "700",
  },
  rulesList: {
    gap: Spacing.md,
  },
  ruleItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: Spacing.sm,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primary + "20",
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
    marginTop: 2,
  },
  ruleContent: {
    flex: 1,
  },
  ruleTitle: {
    ...Typography.body,
    fontWeight: "600",
    marginBottom: Spacing.xs,
    fontSize: 15,
  },
  ruleDescription: {
    ...Typography.body,
    color: Colors.textTertiary,
    fontSize: 13,
    lineHeight: 18,
  },
});

