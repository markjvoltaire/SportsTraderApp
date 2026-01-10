import React, { useMemo } from "react";
import { StyleSheet, Text, View, TouchableOpacity, Image } from "react-native";
import { useNavigation } from "@react-navigation/native";
import {
  Colors,
  Spacing,
  Typography,
  BorderRadius,
} from "../../constants/theme";

export default function EventCard({ event }) {
  const navigation = useNavigation();

  const model = useMemo(() => {
    if (!event) return null;

    const title =
      event.title ||
      event.question ||
      event.name ||
      event.marketTitle ||
      "Event";

    const seriesTicker = String(event?.seriesTicker || "").toUpperCase();
    const titleLower = String(title || "").toLowerCase();
    const isFootballRelated =
      seriesTicker.includes("NFL") ||
      seriesTicker.includes("CFB") ||
      seriesTicker.includes("NCAAF") ||
      titleLower.includes("football") ||
      titleLower.includes("nfl");

    const parseOutcomePrices = (outcomePrices) => {
      if (!outcomePrices) return null;
      if (Array.isArray(outcomePrices)) return outcomePrices;
      if (typeof outcomePrices === "string") {
        try {
          const parsed = JSON.parse(outcomePrices);
          return Array.isArray(parsed) ? parsed : null;
        } catch {
          return null;
        }
      }
      return null;
    };

    const normalizeAskToPercent = (raw) => {
      const num = Number(raw);
      if (!Number.isFinite(num) || num <= 0) return null;
      // Most of our feeds use 0-1 probabilities; sometimes 0-100.
      if (num <= 1) return Math.round(num * 100);
      if (num <= 100) return Math.round(num);
      return null;
    };

    const toPercentText = (percent) => {
      if (!Number.isFinite(Number(percent))) return "—";
      return `${Math.round(Number(percent))}%`;
    };

    const allMarketsRaw = Array.isArray(event.markets) ? event.markets : [];
    const topMarkets = allMarketsRaw
      .map((m, idx) => {
        const label =
          m?.yesSubTitle || m?.title || m?.question || `Market ${idx + 1}`;
        const rawAsk =
          m?.yesAsk ??
          m?.yesAskPrice ??
          m?.ask ??
          m?.askPrice ??
          m?.yesPrice ??
          parseOutcomePrices(m?.outcomePrices)?.[0];
        const askPercent = normalizeAskToPercent(rawAsk);
        return { label, askPercent, askPriceText: toPercentText(askPercent) };
      })
      .sort((a, b) => (b.askPercent ?? -1) - (a.askPercent ?? -1))
      .slice(0, 2);
    const remainingMarketsCount = Math.max(
      0,
      allMarketsRaw.length - topMarkets.length
    );

    const volumeRaw =
      event.volume ?? event.volume24hr ?? event.totalVolume ?? event.liquidity;
    const volume = Number.isFinite(Number(volumeRaw)) ? Number(volumeRaw) : 0;

    const closeTime =
      event?.markets?.[0]?.closeTime ?? event.closeTime ?? event.date;
    const date =
      typeof closeTime === "number"
        ? new Date(closeTime * 1000)
        : closeTime
        ? new Date(closeTime)
        : null;

    const subtitle = date && !isNaN(date.getTime()) ? date.toDateString() : "";

    return {
      title,
      volume,
      subtitle,
      topMarkets,
      remainingMarketsCount,
      isFootballRelated,
    };
  }, [event]);

  if (!model) return null;

  const formatCurrency = (value) => {
    if (!value) return "$0";
    if (value >= 1000000) return `$${(value / 1000000).toFixed(2)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(1)}K`;
    return `$${Math.round(value).toLocaleString()}`;
  };

  return (
    <TouchableOpacity
      onPress={() => {
        navigation.navigate("EventDetail", { event });
      }}
      activeOpacity={0.9}
    >
      <View style={styles.card}>
        <View style={styles.titleRow}>
          {model.isFootballRelated && (
            <Image
              source={require("../../../assets/images/football.png")}
              style={styles.sportIcon}
              resizeMode="cover"
            />
          )}
          <Text style={styles.title} numberOfLines={2}>
            {model.title}
          </Text>
        </View>

        {/* Top 2 markets */}
        {model.topMarkets?.length > 0 && (
          <View style={styles.topMarkets}>
            {model.topMarkets.map((m, idx) => (
              <View
                key={`${m.label}-${idx}`}
                style={[
                  styles.marketRow,
                  idx === model.topMarkets.length - 1 && styles.marketRowLast,
                ]}
              >
                <Text style={styles.marketLabel} numberOfLines={1}>
                  {m.label}
                </Text>
                <Text style={styles.marketAsk}>{m.askPriceText}</Text>
              </View>
            ))}

            {/* View all markets */}
            {model.remainingMarketsCount > 0 && (
              <View style={styles.viewAllRow}>
                <Text style={styles.viewAllText}>
                  View all markets ({model.remainingMarketsCount})
                </Text>
              </View>
            )}
          </View>
        )}

        <View style={styles.metaRow}>
          <Text style={styles.metaText}>{formatCurrency(model.volume)}</Text>
          {!!model.subtitle && (
            <>
              <Text style={styles.dot}>•</Text>
              <Text style={styles.metaText}>{model.subtitle}</Text>
            </>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#0c111d",
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.06)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 5,
  },
  title: {
    ...Typography.bodyLarge,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
    flex: 1,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  sportIcon: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.md,
    marginRight: Spacing.md,
    backgroundColor: "#1a1f2e",
  },
  topMarkets: {
    marginBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  viewAllRow: {
    paddingTop: Spacing.sm,
  },
  viewAllText: {
    ...Typography.caption,
    color: Colors.textTertiary,
    fontWeight: "500",
  },
  marketRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.06)",
  },
  marketRowLast: {
    borderBottomWidth: 0,
  },
  marketLabel: {
    flex: 1,
    ...Typography.body,
    color: Colors.textPrimary,
    marginRight: Spacing.md,
    fontWeight: "500",
  },
  marketAsk: {
    ...Typography.body,
    color: Colors.textPrimary,
    fontWeight: "700",
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  metaText: {
    ...Typography.caption,
    color: Colors.textTertiary,
    fontWeight: "500",
  },
  dot: {
    ...Typography.caption,
    color: "rgba(255, 255, 255, 0.2)",
    marginHorizontal: Spacing.sm,
  },
});
