import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Spacing, Typography } from "../../constants/theme";

export default function NewsCard({ news, onPress }) {
  if (!news) return null;

  const { title, source, timestamp, category, isBreaking } = news;

  // Format timestamp
  const formatTime = (ts) => {
    if (!ts) return "Just now";
    const date = new Date(ts);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <TouchableOpacity
      style={[styles.card, isBreaking && styles.breakingCard]}
      activeOpacity={0.7}
      onPress={() => onPress?.(news)}
    >
      {isBreaking && (
        <View style={styles.breakingBadge}>
          <Ionicons name="flame" size={12} color="#FFFFFF" />
          <Text style={styles.breakingText}>BREAKING</Text>
        </View>
      )}

      {category && (
        <View style={styles.categoryBadge}>
          <Text style={styles.categoryText}>{category.toUpperCase()}</Text>
        </View>
      )}

      <Text style={styles.title} numberOfLines={2}>
        {title}
      </Text>

      <View style={styles.footer}>
        <Text style={styles.source}>{source || "SportsTrader"}</Text>
        <Text style={styles.timestamp}>{formatTime(timestamp)}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    marginHorizontal: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: "rgba(0, 0, 0, 0.08)",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 3,
    position: "relative",
  },
  breakingCard: {
    borderLeftWidth: 4,
    borderLeftColor: Colors.danger,
    backgroundColor: Colors.surfaceAlt,
  },
  breakingBadge: {
    position: "absolute",
    top: Spacing.md,
    right: Spacing.md,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.danger,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: 12,
    gap: Spacing.xs,
  },
  breakingText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  categoryBadge: {
    alignSelf: "flex-start",
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: 8,
    marginBottom: Spacing.sm,
  },
  categoryText: {
    color: Colors.primary,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  title: {
    ...Typography.cardTitle,
    fontSize: 18,
    marginBottom: Spacing.md,
    lineHeight: 24,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: Spacing.sm,
  },
  source: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.textSecondary,
  },
  timestamp: {
    fontSize: 12,
    fontWeight: "400",
    color: Colors.textTertiary,
  },
});

