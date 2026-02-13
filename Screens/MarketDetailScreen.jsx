import React, { useMemo, useEffect, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  useColorScheme,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Spacing, Typography, BorderRadius } from "../constants/theme";
import MyChart from "../src/components/market/MyChart";
import ButtonRow from "../src/components/market/ButtonRow";
import TeamHeader from "../src/components/market/TeamHeader";
import MarketChart from "../src/components/market/MarketChart";

/* =======================
   Logic Helpers
======================= */

const extractAbbreviation = (name) => {
  if (!name) return null;
  const words = name.split(/\s+/);
  if (words.length > 1) {
    return words
      .map((w) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 3);
  }
  return name.substring(0, 3).toUpperCase();
};

const formatGameStartTime = (timeString) => {
  if (!timeString) return null;

  try {
    // Handle format like "2026-01-04 21:25:00+00"
    const date = new Date(timeString.replace("+00", "Z") || timeString);

    const options = {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    };

    return date.toLocaleString("en-US", options);
  } catch (error) {
    return timeString;
  }
};

const formatCountdown = (timeString) => {
  if (!timeString) return null;

  try {
    // Handle format like "2026-01-04 21:25:00+00"
    const gameDate = new Date(timeString.replace("+00", "Z") || timeString);
    const now = new Date();
    const diff = gameDate - now;

    if (diff <= 0) {
      return "Game Started";
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    if (days > 0) {
      return `${days}d ${hours}h ${minutes}m`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m ${seconds}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    } else {
      return `${seconds}s`;
    }
  } catch (error) {
    return null;
  }
};

const normalizeMarket = (market) => {
  if (!market) return null;

  let outcomes = [];
  let prices = [];
  let clobIds = [null, null];

  try {
    outcomes = JSON.parse(market.outcomes || "[]");
  } catch {
    outcomes = market.outcomeNames || [];
  }

  try {
    prices = JSON.parse(market.outcomePrices || "[]");
  } catch {}

  try {
    const parsed = JSON.parse(market.clobTokenIds || "[]");
    clobIds = [parsed?.[0]?.toString(), parsed?.[1]?.toString()];
  } catch {}

  const awayTeam = market?.teams?.[0] || market.awayTeam;
  const homeTeam = market?.teams?.[1] || market.homeTeam;

  return {
    id: market.id || market.conditionId,
    title: market.question || market.title || "Market",
    description: market.description,
    sportsMarketType: market.sportsMarketType,
    awayTeam: {
      name: awayTeam?.name || outcomes[0] || "Away",
      abbreviation: awayTeam?.abbreviation || extractAbbreviation(outcomes[0]),
      record: awayTeam?.record || null,
      price: prices[0] ? parseFloat(prices[0]) : null,
      clobTokenId: clobIds[0],
      color: awayTeam?.color || "#4CAF50",
    },
    homeTeam: {
      name: homeTeam?.name || outcomes[1] || "Home",
      abbreviation: homeTeam?.abbreviation || extractAbbreviation(outcomes[1]),
      record: homeTeam?.record || null,
      price: prices[1] ? parseFloat(prices[1]) : null,
      clobTokenId: clobIds[1],
      color: homeTeam?.color || "#2196F3",
    },
    volume: market.volume24hr || market.volume || 0,
    gameStartTime: market.gameStartTime || market.gameTime || market.date,
    raw: market,
  };
};

/* =======================
   Screen
======================= */

export default function MarketDetailScreen({ route: routeProp }) {
  const isDarkMode = useColorScheme() !== "light";
  const theme = isDarkMode ? DARK_THEME : LIGHT_THEME;
  const styles = useMemo(() => createStyles(theme), [theme]);

  const navigation = useNavigation();
  const routeHook = useRoute();
  const rawData = routeHook?.params?.market || routeProp?.params?.market;

  const market = useMemo(() => {
    if (!rawData) return null;
    const items = Array.isArray(rawData)
      ? rawData
      : rawData.markets || [rawData];

    const moneyline = items.find((m) => m?.sportsMarketType === "moneyline");

    return moneyline ? normalizeMarket(moneyline) : null;
  }, [rawData]);

  const [countdown, setCountdown] = useState(null);

  useEffect(() => {
    if (!market?.gameStartTime) return;

    const updateCountdown = () => {
      const formatted = formatCountdown(market.gameStartTime);
      setCountdown(formatted);
    };

    // Update immediately
    updateCountdown();

    // Update every second
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [market?.gameStartTime]);

  if (!market) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <Text style={styles.emptyText}>No moneyline market found</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={22} color={theme.textPrimary} />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          {countdown && (
            <Text style={styles.countdownText}>Begins in {countdown}</Text>
          )}
        </View>

        <TouchableOpacity style={styles.headerButton}>
          <Ionicons name="share-outline" size={20} color={theme.textPrimary} />
        </TouchableOpacity>
      </View>

      <TeamHeader market={market} textColor={theme.textPrimary} />
      <MarketChart market={market} theme={theme} />

      {/* Trade buttons - Buy Away / Buy Home */}
      <View style={styles.tradeSection}>
        <ButtonRow
          market={market}
          onBuyAway={({ team, price }) => {
            // TODO: open purchase modal or navigate to buy flow
            console.log("Buy away:", team, price);
          }}
          onBuyHome={({ team, price }) => {
            // TODO: open purchase modal or navigate to buy flow
            console.log("Buy home:", team, price);
          }}
        />
      </View>
    </SafeAreaView>
  );
}

/* =======================
   Styles
======================= */

const DARK_THEME = {
  background: "#000000",
  textPrimary: "#FFFFFF",
  textSecondary: "#CCCCCC",
  headerButtonBg: "rgba(255,255,255,0.06)",
  headerButtonBorder: "rgba(255,255,255,0.08)",
  guideLineColor: "rgba(255,255,255,0.12)",
};

const LIGHT_THEME = {
  background: "#F5F7FB",
  textPrimary: "#111827",
  textSecondary: "#4B5563",
  headerButtonBg: "rgba(17,24,39,0.06)",
  headerButtonBorder: "rgba(17,24,39,0.12)",
  guideLineColor: "rgba(17,24,39,0.18)",
};

const createStyles = (theme) =>
  StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.lg,
    position: "relative",
  },
  headerButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.headerButtonBg,
    borderWidth: 1,
    borderColor: theme.headerButtonBorder,
  },
  headerCenter: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  gameTimeText: {
    ...Typography.body,
    fontSize: 14,
    fontWeight: "600",
    color: Colors.textPrimary,
    textAlign: "center",
  },
  countdownText: {
    fontSize: 14,
    fontWeight: "700",
    color: theme.textPrimary,
    letterSpacing: 0.3,
    textAlign: "center",
  },
  countdown: {
    fontSize: 16,
    fontWeight: "700",
    color: theme.textPrimary,
    letterSpacing: 0.3,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.xl,
  },
  tradeSection: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  emptyText: {
    ...Typography.body,
    color: theme.textSecondary,
    textAlign: "center",
  },
});
