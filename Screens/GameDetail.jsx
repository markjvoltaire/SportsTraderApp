import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  Image,
} from "react-native";
import React, { useEffect, useState, useMemo } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Spacing, Typography } from "../src/constants/theme";
import MyChart from "../src/components/market/MyChart";
import GameChart from "../src/components/market/GameChart";

const screenWidth = Dimensions.get("window").width;

export default function GameDetail() {
  const navigation = useNavigation();
  const route = useRoute();
  const event = route.params?.event;

  const [candlestickData, setCandlestickData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [marketIndex, setMarketIndex] = useState(0); // 0 = First team, 1 = Second team

  useEffect(() => {
    const fetchCandlesticks = async () => {
      if (!event?.ticker) return;
      try {
        setLoading(true);
        const response = await fetch(
          `https://scoretradebackend.onrender.com/api/game/candlestick/${event.ticker}`
        );
        const data = await response.json();
        setCandlestickData(data);
      } catch (error) {
        console.error("Error fetching candlesticks:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchCandlesticks();
  }, [event?.ticker]);

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={22} color="#000000" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Image
            source={require("../assets/images/ScoretradeWhite.png")}
            style={styles.logoImage}
            resizeMode="contain"
          />
          <Text style={styles.headerTitle}>Scoretrade</Text>
        </View>
        <TouchableOpacity style={styles.headerButton}>
          <Ionicons name="share-outline" size={20} color="#000000" />
        </TouchableOpacity>
      </View>
      <GameChart candlestickData={candlestickData} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.lg,
  },
  headerButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F3F4F6",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  headerCenter: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 60,
    flexDirection: "row",
    gap: Spacing.sm,
  },
  logoImage: {
    width: 24,
    height: 24,
  },
  headerTitle: {
    ...Typography.body,
    fontSize: 16,
    fontWeight: "600",
    color: "white",
  },
  content: { flex: 1, padding: Spacing.md },
  chartWrapper: {
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    paddingVertical: 10,
  },
  toggleContainer: {
    flexDirection: "row",
    marginBottom: 10,
    backgroundColor: "#E5E7EB",
    borderRadius: 8,
    padding: 2,
  },
  toggleButton: { paddingVertical: 6, paddingHorizontal: 16, borderRadius: 6 },
  toggleActive: {
    backgroundColor: "#FFFFFF",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  toggleText: { fontSize: 12, fontWeight: "600", color: "#6B7280" },
  toggleTextActive: { color: "#000000" },
});
