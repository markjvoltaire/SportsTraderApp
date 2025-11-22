import React, { useEffect, useState, useMemo } from "react";
import { FlatList, ScrollView, StyleSheet, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import ScreenTemplate from "./ScreenTemplate";
import GameCard from "../src/components/market/GameCard";
import { Colors, Spacing } from "../constants/theme";
import { SafeAreaView } from "react-native-safe-area-context";
import API_BASE_URL from "../src/config/api";

export default function HomeScreen() {
  const navigation = useNavigation();
  const [markets, setMarkets] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchMarkets = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch(`${API_BASE_URL}/api/markets/685150`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();

        setMarkets(data);
      } catch (err) {
        setError(err.message);
        console.error("Error fetching markets:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchMarkets();
  }, []);

  const handleGamePress = (market) => {
    navigation.navigate("MarketDetail", { game: market });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <Text style={styles.loadingText}>Loading market...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>Error: {error}</Text>
          <Text style={styles.errorDetails}>
            Make sure the API server is running on {API_BASE_URL}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!markets) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <Text style={styles.emptyText}>No market data available</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Handle both single market object and array of markets
  const marketData = Array.isArray(markets) ? markets : [markets];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {marketData.map((market) => (
          <GameCard
            key={market.id || market.market_id}
            market={market}
            onPress={() => handleGamePress(market)}
          />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: "100%",
  },
  scrollView: {
    flex: 1,
    width: "100%",
  },
  scrollContent: {
    paddingBottom: Spacing.xl,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: Spacing.xxl,
    minHeight: 200,
  },
  loadingText: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  errorText: {
    fontSize: 16,
    color: "#EF4444",
    marginBottom: Spacing.sm,
    fontWeight: "600",
  },
  errorDetails: {
    fontSize: 14,
    color: Colors.textTertiary,
    textAlign: "center",
    paddingHorizontal: Spacing.lg,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  emptySubtext: {
    fontSize: 12,
    color: Colors.textTertiary,
    marginTop: Spacing.xs,
  },
});
