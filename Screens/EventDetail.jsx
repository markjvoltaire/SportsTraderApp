import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Image,
  ScrollView,
} from "react-native";
import React, { useEffect, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import {
  Colors,
  Spacing,
  Typography,
  BorderRadius,
} from "../src/constants/theme";
import EventChartData from "../src/components/market/EventChartData";
import Orders from "../src/components/market/Orders";
import API_BASE_URL from "../src/config/api";
import { useCallback, useMemo } from "react";
import LottieView from "lottie-react-native";

export default function EventDetail() {
  const navigation = useNavigation();
  const route = useRoute();
  const event = route.params.event;


  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [candlestickData1, setCandlestickData1] = useState(null);
  const [candlestickData2, setCandlestickData2] = useState(null);
  const [top2Markets, setTop2Markets] = useState([]);

  // Helper function to get top 2 markets consistently
  const getTop2Markets = useCallback((markets) => {
    if (!markets || !Array.isArray(markets)) return [];
    return [...markets]
      .sort((a, b) => {
        const priceA = parseFloat(a.yesBid) || parseFloat(a.yesAsk) || 0;
        const priceB = parseFloat(b.yesBid) || parseFloat(b.yesAsk) || 0;
        return priceB - priceA;
      })
      .slice(0, 2);
  }, []);

  // Build about section from event data (similar to ChartScreen)
  const aboutText = useMemo(() => {
    let about =
      event?.description ||
      `Predict the outcome of "${event?.title || "this event"}".`;

    // Use rules from event markets if available
    if (event?.markets && event.markets.length > 0) {
      const firstMarket = event.markets[0];
      const aboutParts = [];

      // Only include rulesSecondary (the paragraph starting with "The following")
      if (firstMarket.rulesSecondary) {
        aboutParts.push(firstMarket.rulesSecondary);
      }

      if (event.settlementSources && event.settlementSources.length > 0) {
        const sources = event.settlementSources
          .map((source) => {
            if (source.url) {
              return `${source.name} (${source.url})`;
            }
            return source.name;
          })
          .join(", ");
        if (sources) {
          aboutParts.push(`Settlement source: ${sources}`);
        }
      }

      if (aboutParts.length > 0) {
        about = aboutParts.join("\n\n");
      }
    }

    return about;
  }, [event]);

  useEffect(() => {
    if (event?.markets && Array.isArray(event.markets)) {
      const top2 = getTop2Markets(event.markets);
      setTop2Markets(top2);
    }
  }, [event, getTop2Markets]);

  useEffect(() => {
    const fetchCandlestickData = async () => {
      if (!event?.markets || event.markets.length < 2) {
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const top2 = getTop2Markets(event.markets);
        setTop2Markets(top2);

        const marketTickers = top2.map((market) => market.ticker);

        if (marketTickers.length < 2) {
          setLoading(false);
          return;
        }

        const marketTicker1 = marketTickers[0];
        const marketTicker2 = marketTickers[1];

        const endTs = Math.floor(Date.now() / 1000);
        const startTs = endTs - 5 * 24 * 60 * 60;
        const periodInterval = 60;
        const queryParams = `?startTs=${startTs}&endTs=${endTs}&periodInterval=${periodInterval}`;

        const url1 = `${API_BASE_URL}/api/candlesticksbyticker/${encodeURIComponent(marketTicker1)}${queryParams}`;
        const url2 = `${API_BASE_URL}/api/candlesticksbyticker/${encodeURIComponent(marketTicker2)}${queryParams}`;

        const [response1, response2] = await Promise.all([
          fetch(url1),
          fetch(url2),
        ]);

        if (!response1.ok || !response2.ok) {
          throw new Error(
            `Failed to fetch candlestick data: ${
              response1.status || response2.status
            }`
          );
        }

        const data1 = await response1.json();
        const data2 = await response2.json();

        const candlesticks1 = Array.isArray(data1)
          ? data1
          : data1.candlesticks || data1.data || [];
        const candlesticks2 = Array.isArray(data2)
          ? data2
          : data2.candlesticks || data2.data || [];

        setCandlestickData1(candlesticks1);
        setCandlestickData2(candlesticks2);
      } catch (err) {
        console.error("Error fetching candlestick data:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchCandlestickData();
  }, [event?.markets, getTop2Markets]);

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.topBarIcon}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={22} color="white" />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Image
            source={require("../assets/images/ScoretradeBlack.png")}
            style={styles.logoImage}
            resizeMode="contain"
          />
        </View>

        <TouchableOpacity style={styles.topBarIcon}>
          <Ionicons name="share-outline" size={20} color="white" />
        </TouchableOpacity>
      </View>
      {/* Header */}

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text
          style={{
            color: "#FFFFFF",
            fontWeight: "700",
            fontSize: 30,
            marginBottom: 15,
            padding: 10,
          }}
        >
          {event.title}
        </Text>

        {loading && (
          <View style={styles.skeletonContainer}>
            <LottieView
              source={require("../assets/lottie/Loading.json")}
              autoPlay
              loop
              style={{ height: 200, width: 200, alignSelf: "center" }}
            />
          </View>
        )}

        {candlestickData1 && candlestickData2 && (
          <EventChartData
            candlestickData1={candlestickData1}
            candlestickData2={candlestickData2}
            market1Name={top2Markets[0]?.yesSubTitle || "Market 1"}
            market2Name={top2Markets[1]?.yesSubTitle || "Market 2"}
            market1Color="#9333EA"
            market2Color="#3B82F6"
            market1Ticker={top2Markets[0]?.ticker || null}
            market2Ticker={top2Markets[1]?.ticker || null}
          />
        )}

        {/* Orders/Trades Section */}
        <Orders event={event} />

        {/* About Section */}
        <View style={styles.about}>
          <Text style={styles.aboutTitle}>About</Text>
          <Text style={styles.aboutBody}>{aboutText}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "black",
  },
  logoImage: {
    width: 54,
    height: 54,
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
  topBarIcon: {
    width: 38,
    height: 38,
    borderRadius: BorderRadius.round,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  headerCenter: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 60,
  },
  headerTitle: {
    ...Typography.body,
    fontSize: 16,
    fontWeight: "600",
    color: "white",
    textAlign: "center",
  },
  content: {
    flex: 1,
  },
  placeholderText: {
    ...Typography.body,
    color: "white",
  },
  marketsContainer: {
    marginTop: Spacing.lg,
  },
  marketsTitle: {
    ...Typography.body,
    fontSize: 20,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: Spacing.md,
  },
  marketCard: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  marketName: {
    ...Typography.body,
    fontSize: 18,
    fontWeight: "600",
    color: "#FFFFFF",
    marginBottom: Spacing.xs,
  },
  marketTicker: {
    ...Typography.caption,
    fontSize: 12,
    color: "rgba(255,255,255,0.6)",
    marginBottom: Spacing.sm,
  },
  marketInfo: {
    marginBottom: Spacing.xs,
  },
  marketPrice: {
    ...Typography.body,
    fontSize: 14,
    color: "rgba(255,255,255,0.8)",
    marginBottom: Spacing.xs / 2,
  },
  marketVolume: {
    ...Typography.caption,
    fontSize: 12,
    color: "rgba(255,255,255,0.6)",
    marginTop: Spacing.xs,
  },
  about: {
    paddingBottom: Spacing.lg,
    marginTop: Spacing.lg,
    padding: 10,
  },
  aboutTitle: {
    ...Typography.bodyLarge,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
    fontWeight: "700",
  },
  aboutBody: {
    ...Typography.body,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
});
