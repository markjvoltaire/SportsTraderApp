import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  Animated,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useNavigation } from "@react-navigation/native";

import ScreenTemplate from "./ScreenTemplate";
import { Colors, Spacing, Typography } from "../constants/theme";
import SearchBar from "../src/components/ui/SearchBar";
import FilterCarousel from "../src/components/ui/FilterCarousel";
import ErrorBanner from "../src/components/ui/ErrorBanner";
import MarketSection from "../src/components/market/MarketSection";
import { filterGames } from "../src/utils/marketUtils";
import { formatTimestamp } from "../src/utils/formatters";

const FEATURED_SPORTS = [
  { sport: "nfl", label: "NFL Spotlight", chipLabel: "Football" },
  { sport: "nba", label: "NBA Primetime", chipLabel: "Basketball" },
  { sport: "nhl", label: "NHL Ice Picks", chipLabel: "Hockey" },
];

const FILTER_OPTIONS = [
  { key: "trending", label: "Trending" },
  ...FEATURED_SPORTS.map(({ sport, chipLabel }) => ({
    key: sport,
    label: chipLabel,
  })),
];

const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL ??
  process.env.API_BASE_URL ??
  "http://localhost:3000";

const WARNING_SURFACE = "rgba(0, 0, 0, 0.1)";
const WARNING_TEXT = "#000000";

export default function HomeScreen() {
  const [marketData, setMarketData] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [selectedFilter, setSelectedFilter] = useState("trending");
  const sectionsOpacity = useRef(new Animated.Value(0)).current;
  const animatingRef = useRef(false);
  const [searchQuery, setSearchQuery] = useState("");
  const navigation = useNavigation();
  const normalizedQuery = useMemo(
    () => searchQuery.trim().toLowerCase(),
    [searchQuery]
  );

  const fetchFeaturedMarkets = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const responses = await Promise.all(
        FEATURED_SPORTS.map(async ({ sport }) => {
          const res = await fetch(`${API_BASE_URL}/api/markets?sport=${sport}`);
          if (!res.ok) {
            throw new Error(
              `Unable to load ${sport.toUpperCase()} markets (${res.status})`
            );
          }
          const payload = await res.json();

          return {
            sport,
            games: payload.games ?? [],
            issues: payload.issues ?? [],
            generatedAt: payload.generated_at,
          };
        })
      );

      const nextData = responses.reduce((acc, { sport, ...rest }) => {
        acc[sport] = rest;
        return acc;
      }, {});

      setMarketData(nextData);
    } catch (err) {
      setError(err.message ?? "Unable to load markets right now.");
      setMarketData({});
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchFeaturedMarkets();
  }, [fetchFeaturedMarkets]);

  useEffect(() => {
    if (loading) {
      sectionsOpacity.setValue(0);
      return;
    }
    Animated.timing(sectionsOpacity, {
      toValue: 1,
      duration: 280,
      useNativeDriver: true,
    }).start();
  }, [loading, sectionsOpacity]);

  const topMarkets = useMemo(() => {
    if (selectedFilter !== "trending") {
      return [];
    }
    const combined = FEATURED_SPORTS.flatMap(
      ({ sport }) => marketData?.[sport]?.games ?? []
    );
    const filtered = filterGames(combined, normalizedQuery);
    return filtered
      .slice()
      .sort((a, b) => (b?.volume?.day ?? 0) - (a?.volume?.day ?? 0))
      .slice(0, 5);
  }, [marketData, selectedFilter, normalizedQuery]);

  const sections = useMemo(() => {
    const perSport = FEATURED_SPORTS.map((section) => ({
      ...section,
      games: filterGames(
        marketData?.[section.sport]?.games ?? [],
        normalizedQuery
      ).slice(0, 3),
      generatedAt: marketData?.[section.sport]?.generatedAt,
      issues: marketData?.[section.sport]?.issues ?? [],
    }));
    if (selectedFilter === "trending" && topMarkets.length > 0) {
      return [
        {
          sport: "all-top",
          label: "Trending by volume",
          games: topMarkets,
          generatedAt: new Date().toISOString(),
          issues: [],
        },
        ...perSport,
      ];
    }
    return perSport;
  }, [marketData, selectedFilter, topMarkets, normalizedQuery]);

  const visibleSections = useMemo(() => {
    if (selectedFilter === "trending") {
      return sections;
    }
    return sections.filter((section) => section.sport === selectedFilter);
  }, [sections, selectedFilter]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    fetchFeaturedMarkets();
  }, [fetchFeaturedMarkets]);

  const handleSelectFilter = useCallback(
    (key) => {
      if (key === selectedFilter || animatingRef.current) {
        return;
      }
      animatingRef.current = true;
      Animated.timing(sectionsOpacity, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }).start(() => {
        setSelectedFilter(key);
        Animated.timing(sectionsOpacity, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
        }).start(() => {
          animatingRef.current = false;
        });
      });
    },
    [sectionsOpacity, selectedFilter]
  );

  const sectionsWithMatches = useMemo(
    () => visibleSections.filter((section) => section.games.length > 0),
    [visibleSections]
  );
  const hasMatches = sectionsWithMatches.length > 0;

  return (
    <ScreenTemplate>
      {loading ? (
        <View style={styles.loadingState}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingCopy}>Fetching live markets…</Text>
        </View>
      ) : (
        <>
          <SearchBar
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search teams, matchups, questions"
          />

          <FilterCarousel
            options={FILTER_OPTIONS}
            selectedKey={selectedFilter}
            onSelect={handleSelectFilter}
          />

          <ScrollView
            style={styles.scrollArea}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                tintColor={Colors.primary}
                refreshing={refreshing}
                onRefresh={handleRefresh}
              />
            }
          >
            <ErrorBanner message={error} />

            <Animated.View style={{ opacity: sectionsOpacity }}>
              {!hasMatches ? (
                <Text style={styles.emptyState}>
                  {normalizedQuery
                    ? `No markets match "${searchQuery}".`
                    : "No markets available for this sport right now."}
                </Text>
              ) : null}

              {sectionsWithMatches.map((section) => (
                <MarketSection
                  key={section.sport}
                  section={section}
                  onGamePress={(game) =>
                    navigation.navigate("MarketDetail", { game })
                  }
                />
              ))}
            </Animated.View>
          </ScrollView>
        </>
      )}
    </ScreenTemplate>
  );
}

const styles = StyleSheet.create({
  scrollArea: {
    alignSelf: "stretch",
    marginBottom: Spacing.xxl * 2,
  },
  scrollContent: {
    paddingBottom: 120,
  },
  loadingState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.xxl,
  },
  loadingCopy: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginTop: Spacing.sm,
  },
  emptyState: {
    ...Typography.caption,
    color: Colors.textTertiary,
  },
});
