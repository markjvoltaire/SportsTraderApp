import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import React, { useEffect, useState, useRef } from "react";
import { useNavigation, useScrollToTop } from "@react-navigation/native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from "react-native-reanimated";
import API_BASE_URL from "../src/config/api";
import GameCard from "../src/components/market/GameCard";
import GameCardSkeleton from "../src/components/market/GameCardSkeleton";
import FilterCarousel from "../src/components/ui/FilterCarousel";
import SearchBar from "../src/components/ui/SearchBar";
import { Colors, Spacing } from "../constants/theme";
import ScreenTemplate from "./ScreenTemplate";
import MarketCard from "../src/components/market/MarketCard";

// Animated wrapper component for GameCard with fade-in
function AnimatedGameCard({ market, onPress, index }) {
  const opacity = useSharedValue(0);

  useEffect(() => {
    // Reset animation value
    opacity.value = 0;

    // Stagger the animation based on index
    const delay = index * 50; // 50ms delay between each card

    const timeoutId = setTimeout(() => {
      opacity.value = withTiming(1, {
        duration: 400,
        easing: Easing.out(Easing.ease),
      });
    }, delay);

    return () => clearTimeout(timeoutId);
  }, [market.id || market.market_id || market.game_id]); // Re-animate when market changes

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
    };
  });

  return (
    <Animated.View style={animatedStyle}>
      {/* <GameCard market={market} onPress={onPress} /> */}
      <MarketCard market={market} onPress={onPress} />
    </Animated.View>
  );
}

const FILTER_OPTIONS = [
  {
    key: "all",
    label: "All",
    icon: require("../assets/sportsIcons/ForYou.png"),
  },
  {
    key: "nfl",
    label: "NFL",
    icon: require("../assets/sportsIcons/NFL.png"),
  },
  {
    key: "nba",
    label: "NBA",
    icon: require("../assets/sportsIcons/NBA.png"),
  },
  {
    key: "nhl",
    label: "NHL",
    icon: require("../assets/sportsIcons/NHL.png"),
  },
  {
    key: "ufc",
    label: "UFC",
    icon: require("../assets/sportsIcons/UFC.png"),
  },
  {
    key: "soccer",
    label: "Soccer",
    icon: require("../assets/sportsIcons/Soccer.png"),
  },
  {
    key: "cfb",
    label: "CFB",
    icon: require("../assets/sportsIcons/CFB.png"),
  },
  {
    key: "boxing",
    label: "Boxing",
    icon: require("../assets/sportsIcons/Boxing.png"),
  },
  {
    key: "cbb",
    label: "CBB",
    icon: require("../assets/sportsIcons/CBB.png"),
  },
  {
    key: "wbna",
    label: "WNBA",
    icon: require("../assets/sportsIcons/WNBA.png"),
  },
];

// Cache for markets by category
const marketsCache = {};

export default function HomeScreen() {
  const navigation = useNavigation();
  const scrollViewRef = useRef(null);
  useScrollToTop(scrollViewRef);
  const [markets, setMarkets] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const fetchData = async (forceRefresh = false) => {
    try {
      // Check cache first (unless forcing refresh)
      const cacheKey = selectedFilter;
      if (!forceRefresh && marketsCache[cacheKey]) {
        setMarkets(marketsCache[cacheKey]);
        setLoading(false);
        setError(null);
        return;
      }

      setLoading(true);
      setError(null);

      // Build URL based on selected filter
      // Calculate end date (10 days from now)
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 10);
      const endDateMax = endDate.toISOString().split("T")[0]; // Format as YYYY-MM-DD

      let url;
      if (selectedFilter === "all") {
        // For "all", use NBA as default
        url = `${API_BASE_URL}/api/polymarketSports/nba/events?limit=20&closed=false&endDateMax=${endDateMax}`;
      } else {
        // Use the sport-specific endpoint
        url = `${API_BASE_URL}/api/polymarketSports/${selectedFilter}/events?limit=20&closed=false&endDateMax=${endDateMax}`;
      }

      console.log("Fetching from URL:", url);

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const jsonData = await response.json();

      // Validate response is an array
      if (!Array.isArray(jsonData)) {
        console.warn("Expected array but received:", typeof jsonData);
        setMarkets([]);
        setError("Invalid response format from server");
        return;
      }

      console.log(`Received ${jsonData.length} markets`);
      console.log("All markets:", JSON.stringify(jsonData, null, 2));

      // Store in cache
      marketsCache[cacheKey] = jsonData;

      // Set markets - now expects simplified format: [{id, slug, endDate, line?}, ...]
      setMarkets(jsonData);
    } catch (err) {
      setError(err.message);
      console.error("Error fetching data:", err);
      setMarkets([]); // Clear markets on error
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchData();
  }, [selectedFilter]);

  const onRefresh = async () => {
    setRefreshing(true);
    // Force refresh - bypass cache
    await fetchData(true);
    setRefreshing(false);
  };

  const handleGamePress = (market) => {
    navigation.navigate("MarketDetail", { game: market });
  };

  // Handle both single market object and array of markets
  let marketsArray = [];
  if (markets) {
    if (Array.isArray(markets)) {
      marketsArray = markets;
    } else if (typeof markets === "object") {
      // If it's an object, check if it has a markets/games/data property
      if (markets.markets && Array.isArray(markets.markets)) {
        marketsArray = markets.markets;
      } else if (markets.games && Array.isArray(markets.games)) {
        marketsArray = markets.games;
      } else if (markets.data && Array.isArray(markets.data)) {
        marketsArray = markets.data;
      } else {
        // Treat the object itself as a single market
        marketsArray = [markets];
      }
    }
  }

  // Filter markets by search query
  const filteredMarketsArray = React.useMemo(() => {
    if (!searchQuery.trim()) {
      return marketsArray;
    }

    const query = searchQuery.toLowerCase().trim();
    return marketsArray.filter((market) => {
      // Search in team names/abbreviations (new format)
      if (market.awayTeam && market.homeTeam) {
        const awayTeamName = (
          market.awayTeam.abbreviation ||
          market.awayTeam.name ||
          ""
        ).toLowerCase();
        const homeTeamName = (
          market.homeTeam.abbreviation ||
          market.homeTeam.name ||
          ""
        ).toLowerCase();
        if (awayTeamName.includes(query) || homeTeamName.includes(query)) {
          return true;
        }
      }

      // Search in teams array (old format)
      if (market.teams && Array.isArray(market.teams)) {
        const teamMatches = market.teams.some((team) => {
          const teamName = (
            team.name ||
            team.short ||
            team.abbreviation ||
            ""
          ).toLowerCase();
          return teamName.includes(query);
        });
        if (teamMatches) return true;
      }

      // Search in title/question
      const title = (market.title || market.question || "").toLowerCase();
      if (title.includes(query)) {
        return true;
      }

      // Search in ticker
      const ticker = (market.ticker || "").toLowerCase();
      if (ticker.includes(query)) {
        return true;
      }

      return false;
    });
  }, [marketsArray, searchQuery]);

  useEffect(() => {
    if (marketsArray.length > 0) {
      console.log("Sample market:", JSON.stringify(marketsArray[0], null, 2));
      console.log("Game time:", marketsArray[0].gameTime);
    }
  }, [marketsArray]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        {/* <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search teams, matchups, questions"
        /> */}
        <FilterCarousel
          options={FILTER_OPTIONS}
          selectedKey={selectedFilter}
          onSelect={setSelectedFilter}
        />
      </View>

      {error && !loading && (
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>Error: {error}</Text>
          <Text style={styles.errorDetails}>
            Make sure the API server is running
          </Text>
        </View>
      )}

      {!error && (
        <ScrollView
          ref={scrollViewRef}
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              style={styles.refreshControl}
              refreshing={refreshing}
              onRefresh={onRefresh}
            />
          }
        >
          {loading ? (
            // Show skeleton loaders while loading
            Array.from({ length: 4 }).map((_, index) => (
              <GameCardSkeleton key={`skeleton-${index}`} />
            ))
          ) : filteredMarketsArray.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                {searchQuery
                  ? `No markets found for "${searchQuery}"`
                  : "No market data available"}
              </Text>
            </View>
          ) : (
            // Show actual game cards with fade-in animation
            filteredMarketsArray.map((market, index) => (
              <AnimatedGameCard
                key={market.id || market.market_id || market.game_id || index}
                market={market}
                onPress={handleGamePress}
                index={index}
              />
            ))
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background || "#FFFFFF",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
    backgroundColor: Colors.background || "#FFFFFF",
  },
  scrollView: {
    flex: 1,
  },

  scrollContent: {
    paddingBottom: Spacing.xl,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: Spacing.xxl,
    minHeight: 200,
  },
  errorText: {
    fontSize: 16,
    color: "#EF4444",
    fontWeight: "600",
    marginBottom: Spacing.sm,
  },
  errorDetails: {
    fontSize: 14,
    color: Colors.textTertiary || "#6B7280",
    textAlign: "center",
    paddingHorizontal: Spacing.lg,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.textSecondary || "#374151",
  },
});
