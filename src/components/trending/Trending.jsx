import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import LottieView from "lottie-react-native";
import { Colors, Spacing, Typography } from "../../constants/theme";
import TrendingCard from "./TrendingCard";

export default function Trending({ events = [], loading = false, competition = "PRO BASKETBALL (M)" }) {
  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <LottieView
          source={require("../../../assets/lottie/Loading.json")}
          autoPlay
          loop
          style={{ height: 200, width: 200 }}
        />
        <Text style={styles.loaderText}>Loading trending markets...</Text>
      </View>
    );
  }

  if (!events || events.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons
          name="trending-up-outline"
          size={48}
          color={Colors.textTertiary}
          style={styles.emptyIcon}
        />
        <Text style={styles.emptyTitle}>No trending markets</Text>
        <Text style={styles.emptySubtext}>
          Check back soon for the latest trending markets.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.list}>
        {events.map((event, index) => (
          <TrendingCard
            key={event.ticker || event.id || index}
            event={event}
            competitionFallback={competition}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  headerIcon: {
    marginRight: Spacing.sm,
  },
  sectionTitle: {
    ...Typography.sectionTitle,
    fontSize: 24,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  list: {
    gap: 0,
  },
  loaderContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.xxxl,
  },
  loaderText: {
    ...Typography.body,
    color: Colors.textTertiary,
    marginTop: Spacing.lg,
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.xxxl,
    paddingHorizontal: Spacing.xl,
  },
  emptyIcon: {
    opacity: 0.6,
    marginBottom: Spacing.lg,
  },
  emptyTitle: {
    ...Typography.cardTitle,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
    textAlign: "center",
  },
  emptySubtext: {
    ...Typography.body,
    color: Colors.textTertiary,
    textAlign: "center",
  },
});
