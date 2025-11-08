import React, { useEffect, useMemo, useState } from "react";
import {
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useNavigation } from "@react-navigation/native";

import ScreenTemplate from "./ScreenTemplate";
import { BorderRadius, Colors, Spacing, Typography } from "../constants/theme";

const DUMMY_MARKETS = [
  {
    id: "bills-dolphins",
    title: "Bills vs Dolphins",
    volume: "$2.7k Vol.",
    price: 58.83,
    change: 13.8,
    sport: "Football",
  },
  {
    id: "chiefs-jets",
    title: "Chiefs vs Jets",
    volume: "$1.9k Vol.",
    price: 42.15,
    change: -4.2,
    sport: "Football",
  },
  {
    id: "lakers-celtics",
    title: "Lakers vs Celtics",
    volume: "$3.4k Vol.",
    price: 65.22,
    change: 7.5,
    sport: "Basketball",
  },
  {
    id: "ufc-289-main",
    title: "UFC 289 Main Event",
    volume: "$4.1k Vol.",
    price: 71.4,
    change: 9.1,
    sport: "MMA",
  },
];

function toNumber(value, fallback = 0) {
  if (typeof value === "number") {
    return value;
  }

  if (value === null || value === undefined || value === "") {
    return fallback;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function SportFilterBar({ sports, selectedSport, onSelectSport }) {
  if (!sports || sports.length === 0) {
    return null;
  }

  return (
    <View style={styles.filterContainer}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterScrollContent}
      >
        <Pressable
          style={({ pressed }) => [
            styles.filterChip,
            selectedSport === "all" && styles.filterChipActive,
            pressed && styles.filterChipPressed,
          ]}
          onPress={() => onSelectSport("all")}
        >
          <Text
            style={[
              styles.filterChipText,
              selectedSport === "all" && styles.filterChipTextActive,
            ]}
          >
            All Sports
          </Text>
        </Pressable>
        {sports.map((sport) => (
          <Pressable
            key={sport}
            style={({ pressed }) => [
              styles.filterChip,
              selectedSport === sport && styles.filterChipActive,
              pressed && styles.filterChipPressed,
            ]}
            onPress={() => onSelectSport(sport)}
          >
            <Text
              style={[
                styles.filterChipText,
                selectedSport === sport && styles.filterChipTextActive,
              ]}
            >
              {sport}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

function MarketCard({ title, volume, price, change, onPress }) {
  const changeColor = change >= 0 ? styles.positive : styles.negative;
  const formattedChange = `${change >= 0 ? "+" : ""}${change.toFixed(1)}%`;

  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        pressed ? styles.cardPressed : null,
      ]}
      onPress={onPress}
    >
      <View style={styles.cardHeader}>
        <View style={styles.cardMeta}>
          <View style={styles.avatar} />
          <View>
            <Text style={styles.cardTitle}>{title}</Text>
            <Text style={styles.cardSubtitle}>{volume}</Text>
          </View>
        </View>
        <View style={styles.cardNumbers}>
          <Text style={styles.price}>{price.toFixed(2)}</Text>
          <Text style={[styles.change, changeColor]}>{formattedChange}</Text>
        </View>
      </View>
      <View style={styles.sparklinePlaceholder}>
        <View style={styles.sparklineOverlay} />
      </View>
    </Pressable>
  );
}

export default function HomeScreen() {
  const [remoteMarkets, setRemoteMarkets] = useState([]);
  const [sportFilters, setSportFilters] = useState(null);
  const [selectedSport, setSelectedSport] = useState("all");

  const marketsEndpoint = process.env.EXPO_PUBLIC_MARKETS_URL ?? "";
  const filtersEndpoint = process.env.EXPO_PUBLIC_API_URL
    ? `${process.env.EXPO_PUBLIC_API_URL}/api/sports/filters`
    : "http://localhost:5001/api/sports/filters";
  // Fetch markets
  useEffect(() => {
    if (!marketsEndpoint) {
      return;
    }

    const controller = new AbortController();
    async function fetchMarkets() {
      try {
        const response = await fetch(marketsEndpoint, {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`Markets request failed: ${response.status}`);
        }

        const payload = await response.json();
        const markets = Array.isArray(payload) ? payload : payload?.markets;
        if (Array.isArray(markets)) {
          setRemoteMarkets(markets);
        } else {
          console.warn("Unexpected markets payload shape", payload);
          setRemoteMarkets([]);
        }
      } catch (error) {
        if (error.name !== "AbortError") {
          console.error("Unable to fetch markets", error);
        }
      }
    }

    fetchMarkets();

    return () => controller.abort();
  }, [marketsEndpoint]);

  // Fetch sport filters
  useEffect(() => {
    const controller = new AbortController();

    async function fetchSportFilters() {
      try {
        const response = await fetch(filtersEndpoint, {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`Filters request failed: ${response.status}`);
        }

        const data = await response.json();
        setSportFilters(data);
      } catch (error) {
        if (error.name !== "AbortError") {
          console.error("Unable to fetch sport filters", error);
        }
      }
    }

    fetchSportFilters();

    return () => controller.abort();
  }, [filtersEndpoint]);

  // Normalize markets data
  const normalizedMarkets = useMemo(() => {
    if (remoteMarkets.length === 0) {
      return DUMMY_MARKETS;
    }

    return remoteMarkets.map((market, index) => ({
      id: market.id ?? market.ticker ?? `remote-${index}`,
      title: market.title ?? market.name ?? "Market",
      volume:
        typeof market.volume === "number"
          ? `$${market.volume.toLocaleString()} Vol.`
          : market.volume ?? "",
      price: toNumber(
        market.last_price ??
          market.price ??
          market.lastPrice ??
          market.last_trade_price ??
          market.lastTradePrice
      ),
      change: toNumber(
        market.change_pct ??
          market.changePct ??
          market.change ??
          market.percent_change ??
          market.percentChange
      ),
      sport: market.sport ?? market.category ?? "Other",
    }));
  }, [remoteMarkets]);

  // Extract available sports from filters
  const availableSports = useMemo(() => {
    if (!sportFilters?.filters_by_sports) {
      return [];
    }

    return Object.keys(sportFilters.filters_by_sports).filter(
      (sport) => sport !== "All sports"
    );
  }, [sportFilters]);

  // Filter markets by selected sport
  const filteredMarkets = useMemo(() => {
    if (selectedSport === "all") {
      return normalizedMarkets;
    }

    return normalizedMarkets.filter(
      (market) => market.sport?.toLowerCase() === selectedSport.toLowerCase()
    );
  }, [normalizedMarkets, selectedSport]);

  const navigation = useNavigation();

  return (
    <ScreenTemplate
      title="Home"
      description="Watch the markets you follow at a glance."
    >
      <FlatList
        data={filteredMarkets}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <MarketCard
            {...item}
            onPress={() =>
              navigation.navigate("MarketDetail", {
                market: item,
              })
            }
          />
        )}
        ListHeaderComponent={
          <View style={styles.listHeader}>
            <SportFilterBar
              sports={availableSports}
              selectedSport={selectedSport}
              onSelectSport={setSelectedSport}
            />
          </View>
        }
        stickyHeaderIndices={availableSports.length > 0 ? [0] : undefined}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </ScreenTemplate>
  );
}

const styles = StyleSheet.create({
  listContent: {
    paddingBottom: Spacing.xxl,
  },
  listHeader: {
    marginBottom: Spacing.lg,
    backgroundColor: Colors.background,
    paddingBottom: Spacing.md,
  },
  filterContainer: {
    marginBottom: Spacing.sm,
    backgroundColor: Colors.background,
  },
  filterScrollContent: {
    paddingRight: Spacing.lg,
  },
  filterChip: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.full,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    marginRight: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterChipPressed: {
    opacity: 0.7,
  },
  filterChipText: {
    ...Typography.label,
    color: Colors.textSecondary,
    fontWeight: "600",
  },
  filterChipTextActive: {
    color: Colors.background,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardPressed: {
    transform: [{ scale: 0.99 }],
    opacity: 0.95,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: Spacing.lg,
  },
  cardMeta: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 44,
    height: 48,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surfaceAlt,
    marginRight: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardTitle: {
    ...Typography.cardTitle,
    fontSize: 18,
  },
  cardSubtitle: {
    color: Colors.textTertiary,
    marginTop: Spacing.xs,
    fontSize: 14,
  },
  cardNumbers: {
    alignItems: "flex-end",
  },
  price: {
    color: Colors.textPrimary,
    fontSize: 20,
    fontWeight: "600",
  },
  change: {
    marginTop: Spacing.xs,
    fontSize: 14,
    fontWeight: "600",
  },
  positive: {
    color: Colors.primary,
  },
  negative: {
    color: Colors.danger,
  },
  sparklinePlaceholder: {
    height: 80,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surfaceAlt,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: "hidden",
    justifyContent: "flex-end",
  },
  sparklineOverlay: {
    height: 48,
    borderRadius: 48,
    marginHorizontal: -40,
    backgroundColor: Colors.primary,
    opacity: 0.28,
  },
});
