import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from "react-native";
import React, { useEffect, useState, useMemo, useRef } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useScrollToTop } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from "react-native-reanimated";
import API_BASE_URL from "../src/config/api";
import TopMoverCard from "../src/components/market/TopMoverCard";
import NewsCard from "../src/components/market/NewsCard";
import { Colors, Spacing, Typography } from "../constants/theme";

// Animated wrapper for cards
function AnimatedCard({ children, index }) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(20);

  useEffect(() => {
    opacity.value = 0;
    translateY.value = 20;

    const delay = index * 50;
    const timeoutId = setTimeout(() => {
      opacity.value = withTiming(1, {
        duration: 400,
        easing: Easing.out(Easing.ease),
      });
      translateY.value = withTiming(0, {
        duration: 400,
        easing: Easing.out(Easing.ease),
      });
    }, delay);

    return () => clearTimeout(timeoutId);
  }, [index]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return <Animated.View style={animatedStyle}>{children}</Animated.View>;
}

export default function MarketsScreen() {
  const navigation = useNavigation();
  const scrollViewRef = useRef(null);
  useScrollToTop(scrollViewRef);
  const [markets, setMarkets] = useState(null);
  const [news, setNews] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const fetchMarkets = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/markets/gameWinners`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const jsonData = await response.json();

      // Handle different response formats
      let marketsArray = [];
      if (Array.isArray(jsonData)) {
        marketsArray = jsonData;
      } else if (jsonData?.markets && Array.isArray(jsonData.markets)) {
        marketsArray = jsonData.markets;
      } else if (jsonData?.games && Array.isArray(jsonData.games)) {
        marketsArray = jsonData.games;
      } else if (jsonData?.data && Array.isArray(jsonData.data)) {
        marketsArray = jsonData.data;
      }

      setMarkets(marketsArray);
    } catch (err) {
      console.error("Error fetching markets:", err);
      setError(err.message);
    }
  };

  const fetchNews = async () => {
    try {
      // Try to fetch news from API, fallback to mock data
      const response = await fetch(`${API_BASE_URL}/api/news`);
      if (response.ok) {
        const newsData = await response.json();
        setNews(Array.isArray(newsData) ? newsData : newsData?.news || []);
      } else {
        // Mock news data for now
        setNews([
          {
            id: 1,
            title: "Major Trade Shakes Up NBA Playoff Race",
            source: "ESPN",
            timestamp: Date.now() - 3600000, // 1 hour ago
            category: "NBA",
            isBreaking: true,
          },
          {
            id: 2,
            title: "Injury Update: Star Quarterback Cleared to Play",
            source: "NFL Network",
            timestamp: Date.now() - 7200000, // 2 hours ago
            category: "NFL",
            isBreaking: false,
          },
          {
            id: 3,
            title: "Championship Game Time Changed Due to Weather",
            source: "SportsTrader",
            timestamp: Date.now() - 10800000, // 3 hours ago
            category: "CFB",
            isBreaking: false,
          },
        ]);
      }
    } catch (err) {
      // Use mock data on error
      setNews([
        {
          id: 1,
          title: "Major Trade Shakes Up NBA Playoff Race",
          source: "ESPN",
          timestamp: Date.now() - 3600000,
          category: "NBA",
          isBreaking: true,
        },
        {
          id: 2,
          title: "Injury Update: Star Quarterback Cleared to Play",
          source: "NFL Network",
          timestamp: Date.now() - 7200000,
          category: "NFL",
          isBreaking: false,
        },
        {
          id: 3,
          title: "Championship Game Time Changed Due to Weather",
          source: "SportsTrader",
          timestamp: Date.now() - 10800000,
          category: "CFB",
          isBreaking: false,
        },
      ]);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    await Promise.all([fetchMarkets(), fetchNews()]);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  // Calculate top movers based on price volatility and volume
  const topMovers = useMemo(() => {
    if (!markets || !Array.isArray(markets)) return [];

    return markets
      .map((market) => {
        const awayPrice = parseFloat(market.awayTeam?.price || 0.5);
        const homePrice = parseFloat(market.homeTeam?.price || 0.5);
        const volume =
          market.volume24hr ||
          market.volume?.day ||
          market.volumeNum ||
          market.volume ||
          0;

        // Calculate movement score (distance from 0.5 * volume)
        const priceChange = Math.abs(awayPrice - 0.5);
        const movementScore = priceChange * volume;

        return {
          ...market,
          movementScore,
          priceChange,
        };
      })
      .filter((m) => m.movementScore > 0)
      .sort((a, b) => b.movementScore - a.movementScore)
      .slice(0, 10); // Top 10 movers
  }, [markets]);

  const handleMarketPress = (market) => {
    navigation.navigate("MarketDetail", { game: market });
  };

  const handleNewsPress = (newsItem) => {
    // Navigate to news detail or open link
    console.log("News pressed:", newsItem);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Explore</Text>
          <Text style={styles.subtitle}>Top movers and breaking news</Text>
        </View>

        {error && !loading && (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={24} color={Colors.danger} />
            <Text style={styles.errorText}>Error loading data</Text>
            <TouchableOpacity style={styles.retryButton} onPress={fetchData}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {!error && (
          <>
            {/* Breaking News Section */}
            {news && news.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Ionicons
                    name="flame"
                    size={20}
                    color={Colors.danger}
                    style={styles.sectionIcon}
                  />
                  <Text style={styles.sectionTitle}>Breaking News</Text>
                </View>
                {news.map((newsItem, index) => (
                  <AnimatedCard key={newsItem.id || index} index={index}>
                    <NewsCard news={newsItem} onPress={handleNewsPress} />
                  </AnimatedCard>
                ))}
              </View>
            )}

            {/* Top Movers Section */}
            {topMovers && topMovers.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Ionicons
                    name="trending-up"
                    size={20}
                    color={Colors.success}
                    style={styles.sectionIcon}
                  />
                  <Text style={styles.sectionTitle}>Top Movers</Text>
                </View>
                {topMovers.map((market, index) => (
                  <AnimatedCard
                    key={
                      market.id || market.market_id || market.game_id || index
                    }
                    index={index + (news?.length || 0)}
                  >
                    <TopMoverCard
                      market={market}
                      onPress={handleMarketPress}
                      rank={index + 1}
                    />
                  </AnimatedCard>
                ))}
              </View>
            )}

            {loading && (
              <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>Loading...</Text>
              </View>
            )}

            {!loading &&
              (!topMovers || topMovers.length === 0) &&
              (!news || news.length === 0) && (
                <View style={styles.emptyContainer}>
                  <Ionicons
                    name="search-outline"
                    size={48}
                    color={Colors.textTertiary}
                  />
                  <Text style={styles.emptyText}>No data available</Text>
                </View>
              )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: Spacing.xxl,
  },
  header: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  title: {
    ...Typography.pageTitle,
    fontSize: 32,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    ...Typography.body,
    color: Colors.textTertiary,
  },
  section: {
    marginTop: Spacing.xl,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.md,
  },
  sectionIcon: {
    marginRight: Spacing.sm,
  },
  sectionTitle: {
    ...Typography.sectionTitle,
    fontSize: 24,
  },
  errorContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.xxl,
    paddingHorizontal: Spacing.xl,
  },
  errorText: {
    fontSize: 16,
    color: Colors.danger,
    fontWeight: "600",
    marginTop: Spacing.md,
    marginBottom: Spacing.lg,
  },
  retryButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: 12,
  },
  retryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  loadingContainer: {
    alignItems: "center",
    paddingVertical: Spacing.xxl,
  },
  loadingText: {
    fontSize: 16,
    color: Colors.textTertiary,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.xxl,
    paddingHorizontal: Spacing.xl,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginTop: Spacing.md,
  },
});
