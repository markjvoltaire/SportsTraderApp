import React, { useMemo } from "react";
import { StyleSheet, Text, View, TouchableOpacity, Image } from "react-native";
import { useNavigation } from "@react-navigation/native";
import {
  Colors,
  Spacing,
  Typography,
  BorderRadius,
} from "../../constants/theme";
import { getNFLTeamColor, getNBATeamColor } from "../../constants/teamColors";

// Helper function to convert percentage to text format
const toPercentText = (percent) => {
  if (!Number.isFinite(Number(percent))) return "—";
  return `${Math.round(Number(percent))}%`;
};

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

    const toCentsText = (percent) => {
      if (!Number.isFinite(Number(percent))) return "—";
      return `${Math.round(Number(percent))}¢`;
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
      .slice(0, 3);
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

  // Helper function to brighten colors
  const brightenColor = (color, boost = 0.25) => {
    if (!color) return null;
    const hex = color.replace("#", "");
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    const brightR = Math.min(255, Math.round(r + (255 - r) * boost));
    const brightG = Math.min(255, Math.round(g + (255 - g) * boost));
    const brightB = Math.min(255, Math.round(b + (255 - b) * boost));
    return `#${brightR.toString(16).padStart(2, "0")}${brightG
      .toString(16)
      .padStart(2, "0")}${brightB.toString(16).padStart(2, "0")}`;
  };

  // Get colors for markets (2 or 3)
  const getMarketColors = () => {
    if (!model.topMarkets || model.topMarkets.length < 2) {
      return {
        colors: ["#FF9500", "#FF3B30"],
      };
    }

    // Try to get team colors based on market labels
    const seriesTicker = String(event?.seriesTicker || "").toUpperCase();
    const isProFootball = /pro football|nfl/i.test(seriesTicker);
    const isProBasketball = /pro basketball|nba/i.test(seriesTicker);

    const colorBoost = isProFootball ? 0.3 : isProBasketball ? 0.22 : 0;
    const defaultColors = ["#FF9500", "#FF3B30", "#4CAF50"];

    const colors = model.topMarkets.map((market, idx) => {
      let color = null;
      if (isProFootball) {
        color =
          getNFLTeamColor(market.label) ||
          getNFLTeamColor(market.label?.split(" ")[0]);
      } else if (isProBasketball) {
        color =
          getNBATeamColor(market.label) ||
          getNBATeamColor(market.label?.split(" ")[0]);
      }
      return color
        ? brightenColor(color, colorBoost)
        : defaultColors[idx] || defaultColors[0];
    });

    return { colors };
  };

  const marketColors = getMarketColors();

  return (
    <TouchableOpacity
      onPress={() => {
        navigation.navigate("EventDetail", { event });
      }}
      activeOpacity={0.9}
    >
      <View style={styles.card}>
        {/* Market Question Title */}
        <Text style={styles.marketTitle} numberOfLines={2}>
          {model.title}
        </Text>

        {/* Market Options */}
        {model.topMarkets && model.topMarkets.length > 0 && (
          <>
            <View style={styles.marketsList}>
              {model.topMarkets.map((market, idx) => (
                <View key={idx} style={styles.marketItem}>
                  <Text style={styles.marketLabel}>{market.label}</Text>
                  <View style={styles.percentagePill}>
                    <Text style={styles.percentagePillText}>
                      {toPercentText(market.askPercent || 0)}
                    </Text>
                  </View>
                </View>
              ))}
            </View>

            {/* Trade Button */}
            {/* <TouchableOpacity style={styles.tradeButton}>
              <Text style={styles.tradeButtonText}>Trade</Text>
            </TouchableOpacity> */}
          </>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 20,
    marginVertical: 8,
    backgroundColor: "#000000",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  marketTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
    textAlign: "center",
    marginBottom: 20,
    lineHeight: 22,
  },
  marketsList: {
    marginBottom: 20,
    gap: 12,
  },
  marketItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  marketLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
    flex: 1,
  },
  marketPercentage: {
    fontSize: 16,
    fontWeight: "600",
  },
  percentagePill: {
    backgroundColor: "#000000",
    borderWidth: 1,
    borderColor: "#FFFFFF",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    minWidth: 50,
    alignItems: "center",
    justifyContent: "center",
  },
  percentagePillText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  tradeButton: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  tradeButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#000000",
  },
});
