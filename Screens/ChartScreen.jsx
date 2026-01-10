import React, { useMemo, useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Modal,
  FlatList,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import MyChart from "../src/components/market/MyChart";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from "react-native-reanimated";
import {
  Colors,
  Spacing,
  Typography,
  BorderRadius,
} from "../src/constants/theme";
import { getNFLTeamColor, getNBATeamColor } from "../src/constants/teamColors";
import { formatCurrency, formatPrice } from "../src/utils/formatters";
import Orders from "../src/components/market/Orders";

const DUMMY_MATCH = {
  league: "NBA",
  isLive: true,
  away: {
    code: "PHI",
    name: "Philadelphia",
    record: "13-10",
    color: "#3B82F6",
  },
  home: {
    code: "LAL",
    name: "Los Angeles L",
    record: "17-8",
    color: "#FBBF24",
  },
  score: { away: 17, home: 9 },
  volumeUsd: 7021038,
  pctAway: 61,
  pctHome: 39,
  chattingCount: 132,
  about:
    "Predict the outcome of “Philadelphia vs. Los Angeles L”. Earn $1 per contract when you’re right, or close your position before the event.",
};

const DUMMY_MESSAGES = [
  {
    id: "1",
    handle: "@ballislife21",
    badge: null,
    text: "I can already tell this is gonna be a close one",
  },
  {
    id: "2",
    handle: "@phillyfan764",
    badge: "PHI 61%",
    text: "Maxey with the THREE POINTER 🔥",
  },
  {
    id: "3",
    handle: "@ghost",
    badge: null,
    text: "go 76ers go!",
  },
  {
    id: "4",
    handle: "@whaletrader",
    badge: "LAL 39%",
    text: "Got a good feeling with Doncic being back 😏",
  },
  {
    id: "5",
    handle: "@CatSpring",
    badge: "PHI 61%",
    text: "sold",
  },
  {
    id: "6",
    handle: "@WhaleSong",
    badge: "LAL 39%",
    text: "LEBRON LEBRON LEBRON LEBRON LEBRON LEBRON LEBRON",
  },
  {
    id: "7",
    handle: "@iiiiiwwwww",
    badge: null,
    text: "I'm still leaning towards Philly...",
  },
  {
    id: "8",
    handle: "@Lakers23",
    badge: "LAL 39%",
    text: "Lakers defense looking STRONG",
  },
  {
    id: "9",
    handle: "@ballislife21",
    badge: "PHI 61%",
    text: "If LA keeps this tempo, Philly's in trouble",
  },
];

export default function ChartScreen() {
  const navigation = useNavigation();
  const route = useRoute();

  const [timeframe, setTimeframe] = useState("All");
  const [selectedSide, setSelectedSide] = useState(null);
  const [chatVisible, setChatVisible] = useState(false);
  const [chatInput, setChatInput] = useState("");

  // Chart state
  const [candlestickData, setCandlestickData] = useState(null);
  const [currentTimestamp, setCurrentTimestamp] = useState(null);
  const [priceStats, setPriceStats] = useState(null);
  const [currentPrices, setCurrentPrices] = useState(null);
  const [chartLoading, setChartLoading] = useState(true);

  const event = route.params?.event || null;
  const market =
    event?.markets?.[0] || route.params?.game || route.params?.market || null;

  const leagueHints = useMemo(
    () =>
      [
        market?.league,
        market?.sport,
        event?.competition,
        event?.league,
        event?.sport,
        market?.seriesTicker,
        event?.seriesTicker,
        market?.ticker,
        event?.ticker,
      ]
        .filter(Boolean)
        .join(" "),
    [market, event]
  );

  const isProFootball = /pro football|nfl/i.test(leagueHints);
  const isProBasketball = /pro basketball|nba/i.test(leagueHints);

  // Fetch candlestick data when event changes
  useEffect(() => {
    const fetchCandlesticks = async () => {
      if (!event?.ticker) return;
      try {
        setChartLoading(true);
        const response = await fetch(
          `https://scoretradebackend.onrender.com/api/game/candlestick/${event.ticker}`
        );
        const data = await response.json();

        setCandlestickData(data);
      } catch (error) {
        console.error("Error fetching candlesticks:", error);
      } finally {
        setChartLoading(false);
      }
    };
    fetchCandlesticks();
  }, [event?.ticker]);

  // Animation values for team blocks sliding in
  const awayTeamTranslateX = useSharedValue(-200);
  const homeTeamTranslateX = useSharedValue(200);
  const awayTeamOpacity = useSharedValue(0);
  const homeTeamOpacity = useSharedValue(0);

  // Trigger slide-in animation on mount
  useEffect(() => {
    awayTeamTranslateX.value = withTiming(0, {
      duration: 400,
      easing: Easing.out(Easing.ease),
    });
    homeTeamTranslateX.value = withTiming(0, {
      duration: 400,
      easing: Easing.out(Easing.ease),
    });
    awayTeamOpacity.value = withTiming(1, {
      duration: 400,
      easing: Easing.out(Easing.ease),
    });
    homeTeamOpacity.value = withTiming(1, {
      duration: 400,
      easing: Easing.out(Easing.ease),
    });
  }, []);

  const match = useMemo(() => {
    if (!market) {
      return DUMMY_MATCH;
    }

    // Helper function to extract team names from event
    const getTeamNames = () => {
      if (!event?.markets || event.markets.length === 0)
        return { yesTeam: "Team 1", noTeam: "Team 2" };

      const market = event.markets[0];

      // For NFL/NBA style markets: check if event has multiple markets with yesSubTitle
      if (event.markets && event.markets.length >= 2) {
        const firstMarket = event.markets[0];
        const secondMarket = event.markets[1];

        // If both markets have yesSubTitle, these are the team names
        if (firstMarket.yesSubTitle && secondMarket.yesSubTitle) {
          return {
            yesTeam: firstMarket.yesSubTitle,
            noTeam: secondMarket.yesSubTitle,
          };
        }
      }

      // Try to get team names from structured data first
      if (market.awayTeam && market.homeTeam) {
        return {
          yesTeam:
            market.homeTeam.name || market.homeTeam.abbreviation || "Home",
          noTeam:
            market.awayTeam.name || market.awayTeam.abbreviation || "Away",
        };
      }

      // Parse from title patterns
      if (event.title) {
        // Pattern: "Team A at Team B" (NFL/NBA format)
        const atMatch = event.title.match(/(.+?)\s+at\s+(.+)/i);
        if (atMatch) {
          return {
            yesTeam: atMatch[2].trim(), // Home team (after "at")
            noTeam: atMatch[1].trim(), // Away team (before "at")
          };
        }

        // Pattern: "Team A vs Team B"
        const titleMatch = event.title.match(/(.+?)\s+vs\.?\s+(.+)/i);
        if (titleMatch) {
          return {
            yesTeam: titleMatch[2].trim(), // Home team (usually after "vs")
            noTeam: titleMatch[1].trim(), // Away team (usually before "vs")
          };
        }
      }

      // Ultimate fallback
      return {
        yesTeam: "YES",
        noTeam: "NO",
      };
    };

    // Derive team data similar to MarketDetailScreen
    let awayTeamData = null;
    let homeTeamData = null;
    let awayName = "Away";
    let homeName = "Home";
    let awayAbbreviation = null;
    let homeAbbreviation = null;
    let awayColor = null;
    let homeColor = null;

    // Extract team names from event if available
    if (event) {
      const teamData = getTeamNames();
      awayName = teamData.noTeam;
      homeName = teamData.yesTeam;
      awayAbbreviation = awayName.substring(0, 3).toUpperCase();
      homeAbbreviation = homeName.substring(0, 3).toUpperCase();
      awayColor = "#EF4444"; // Red for away team
      homeColor = "#3B82F6"; // Blue for home team
    }

    if (
      market?.teams &&
      Array.isArray(market.teams) &&
      market.teams.length >= 2
    ) {
      awayTeamData = market.teams[0];
      homeTeamData = market.teams[1];
      awayName = awayTeamData.alias || awayTeamData.name || "Away";
      homeName = homeTeamData.alias || homeTeamData.name || "Home";
      awayAbbreviation = awayTeamData.abbreviation?.toUpperCase() || null;
      homeAbbreviation = homeTeamData.abbreviation?.toUpperCase() || null;
      awayColor = awayTeamData.color || null;
      homeColor = homeTeamData.color || null;
    } else if (market?.awayTeam || market?.homeTeam) {
      awayTeamData = market.awayTeam;
      homeTeamData = market.homeTeam;
      awayName =
        market.awayTeam?.name || market.awayTeam?.abbreviation || "Away";
      homeName =
        market.homeTeam?.name || market.homeTeam?.abbreviation || "Home";
      awayAbbreviation = market.awayTeam?.abbreviation?.toUpperCase() || null;
      homeAbbreviation = market.homeTeam?.abbreviation?.toUpperCase() || null;
      awayColor = market.awayTeam?.color || null;
      homeColor = market.homeTeam?.color || null;
    } else if (market?.title) {
      const titleMatch = market.title.match(/(.+?)\s+vs\.?\s+(.+)/i);
      if (titleMatch) {
        awayName = titleMatch[1].trim().replace(/\.$/, "");
        homeName = titleMatch[2].trim().replace(/\.$/, "");
      }
    }

    // Fallback abbreviations
    if (!awayAbbreviation) {
      const words = awayName.split(/\s+/);
      awayAbbreviation =
        words.length > 1
          ? words
              .map((w) => w[0])
              .join("")
              .toUpperCase()
              .slice(0, 3)
          : awayName.substring(0, 3).toUpperCase();
    }
    if (!homeAbbreviation) {
      const words = homeName.split(/\s+/);
      homeAbbreviation =
        words.length > 1
          ? words
              .map((w) => w[0])
              .join("")
              .toUpperCase()
              .slice(0, 3)
          : homeName.substring(0, 3).toUpperCase();
    }

    if (isProFootball) {
      const mappedAwayColor =
        getNFLTeamColor(awayName) || getNFLTeamColor(awayAbbreviation);
      const mappedHomeColor =
        getNFLTeamColor(homeName) || getNFLTeamColor(homeAbbreviation);

      if (mappedAwayColor) {
        awayColor = mappedAwayColor;
      }
      if (mappedHomeColor) {
        homeColor = mappedHomeColor;
      }
    }
    if (isProBasketball) {
      const mappedAwayColor =
        getNBATeamColor(awayName) || getNBATeamColor(awayAbbreviation);
      const mappedHomeColor =
        getNBATeamColor(homeName) || getNBATeamColor(homeAbbreviation);

      if (mappedAwayColor) {
        awayColor = mappedAwayColor;
      }
      if (mappedHomeColor) {
        homeColor = mappedHomeColor;
      }
    }

    const finalAwayColor = awayColor || Colors.primary;
    const finalHomeColor = homeColor || Colors.accentTeal;

    // Extract prices from market.prices array
    // Prices array structure: [{price: 0.53, team: {...}, tokenId: "..."}, {price: 0.49, team: {...}, tokenId: "..."}]
    let awayPrice = null;
    let homePrice = null;

    if (
      market.prices &&
      Array.isArray(market.prices) &&
      market.prices.length >= 2
    ) {
      // Match prices to teams by index (first price = away team, second = home team)
      // Or match by tokenId if teamTokenIds array exists
      if (market.teamTokenIds && Array.isArray(market.teamTokenIds)) {
        // Match by tokenId
        const awayTokenId = market.teamTokenIds[0];
        const homeTokenId = market.teamTokenIds[1];

        const awayPriceObj = market.prices.find(
          (p) =>
            p.tokenId === awayTokenId ||
            p.tokenId?.toString() === awayTokenId?.toString()
        );
        const homePriceObj = market.prices.find(
          (p) =>
            p.tokenId === homeTokenId ||
            p.tokenId?.toString() === homeTokenId?.toString()
        );

        awayPrice = awayPriceObj ? parseFloat(awayPriceObj.price) : null;
        homePrice = homePriceObj ? parseFloat(homePriceObj.price) : null;
      } else {
        // Fallback to index-based matching (first price = away, second = home)
        awayPrice = parseFloat(market.prices[0]?.price) || null;
        homePrice = parseFloat(market.prices[1]?.price) || null;
      }
    } else {
      // Fallback to old structure if prices array doesn't exist
      awayPrice = parseFloat(market.awayTeam?.price) || null;
      homePrice = parseFloat(market.homeTeam?.price) || null;
    }

    // Calculate percentages from event bid data
    let pctAway, pctHome;
    if (event?.markets && event.markets.length >= 2) {
      // Use actual bid prices from the event
      const awayMarket = event.markets[1]; // Second market is for away team (Buffalo)
      const homeMarket = event.markets[0]; // First market is for home team (Jacksonville)

      const awayBid = parseFloat(awayMarket.yesBid) || 0;
      const homeBid = parseFloat(homeMarket.yesBid) || 0;

      if (awayBid > 0 && homeBid > 0) {
        // Convert bids to percentages (bids are already in decimal format like 0.5000)
        pctAway = Math.round(awayBid * 100);
        pctHome = Math.round(homeBid * 100);
      } else {
        // Fallback to dummy if bid data not available
        pctAway = DUMMY_MATCH.pctAway;
        pctHome = DUMMY_MATCH.pctHome;
      }
    } else {
      // Fallback to calculated prices if event structure is different
      if (
        awayPrice == null ||
        homePrice == null ||
        !Number.isFinite(awayPrice) ||
        !Number.isFinite(homePrice)
      ) {
        pctAway = DUMMY_MATCH.pctAway;
        pctHome = DUMMY_MATCH.pctHome;
      } else {
        const sum = awayPrice + homePrice || 1;
        pctAway = Math.round((awayPrice / sum) * 100);
        pctHome = 100 - pctAway;
      }
    }

    const volumeUsd =
      market.volume24hr ||
      market.volume?.day ||
      market.volumeNum ||
      market.volume ||
      0;

    const scoreAway =
      market.awayScore ??
      market.away_score ??
      market.scoreAway ??
      DUMMY_MATCH.score.away;
    const scoreHome =
      market.homeScore ??
      market.home_score ??
      market.scoreHome ??
      DUMMY_MATCH.score.home;

    const about =
      market.description ||
      `Predict the outcome of “${awayName} vs. ${homeName}”.`;

    return {
      league: market.league || market.sport || DUMMY_MATCH.league,
      isLive: true,
      away: {
        code: awayAbbreviation,
        name: awayName,
        record: awayTeamData?.record || DUMMY_MATCH.away.record,
        color: finalAwayColor,
      },
      home: {
        code: homeAbbreviation,
        name: homeName,
        record: homeTeamData?.record || DUMMY_MATCH.home.record,
        color: finalHomeColor,
      },
      score: { away: scoreAway, home: scoreHome },
      volumeUsd,
      pctAway,
      pctHome,
      chattingCount: DUMMY_MATCH.chattingCount,
      about,
    };
  }, [market, event]);

  // Map UI timeframes to MyChart expected values
  const chartTimeFrame = useMemo(() => {
    switch (timeframe) {
      case "1H":
        return "1H";
      case "1D":
        return "24H";
      case "1W":
        return "7D";
      case "1M":
        return "30D";
      case "YTD":
        return "ALL";
      case "All":
      default:
        return "ALL";
    }
  }, [timeframe]);

  const competitionLabel =
    event?.competition || event?.league || market?.league || match.league;

  const displayPctAway = useMemo(() => {
    if (
      currentPrices?.awayPrice !== undefined &&
      currentPrices?.homePrice !== undefined
    ) {
      return Math.round(Number(currentPrices.awayPrice) * 100);
    }
    return match.pctAway;
  }, [currentPrices, match.pctAway]);

  const displayPctHome = useMemo(() => {
    if (
      currentPrices?.awayPrice !== undefined &&
      currentPrices?.homePrice !== undefined
    ) {
      return Math.round(Number(currentPrices.homePrice) * 100);
    }
    return match.pctHome;
  }, [currentPrices, match.pctHome]);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Top bar */}
        <View style={styles.topBar}>
          <TouchableOpacity
            style={styles.topBarIcon}
            onPress={() => navigation.goBack()}
          >
            <Ionicons
              name="chevron-back"
              size={22}
              color={Colors.textPrimary}
            />
          </TouchableOpacity>

          <View style={styles.headerCenter}>
            <Image
              source={require("../assets/images/ScoretradeBlack.png")}
              style={styles.logoImage}
              resizeMode="contain"
            />
          </View>

          <TouchableOpacity style={styles.topBarIcon}>
            <Ionicons
              name="share-outline"
              size={20}
              color={Colors.textPrimary}
            />
          </TouchableOpacity>
        </View>

        {!!competitionLabel && (
          <View style={styles.competitionRow}>
            <Text style={styles.competitionText}>{competitionLabel}</Text>
          </View>
        )}

        <Text
          style={{
            color: "#FFFFFF",
            fontWeight: "700",
            fontSize: 30,
            marginBottom: 15,
          }}
        >
          {event.title}
        </Text>

        {event.volume && (
          <Text
            style={{
              color: Colors.textTertiary,
              fontSize: 16,
              fontWeight: "500",
              marginBottom: 20,
            }}
          >
            Volume: {formatCurrency(event.volume)}
          </Text>
        )}

        {/* Chart */}
        <View style={{ right: 15 }}>
          <MyChart
            market={market}
            event={event}
            candlestickData={candlestickData}
            onTimestampChange={setCurrentTimestamp}
            onPriceStatsChange={setPriceStats}
            onPriceChange={setCurrentPrices}
            onLoadingChange={setChartLoading}
            timeFrame={chartTimeFrame}
            awayColor={match.away.color}
            homeColor={match.home.color}
            colorBoost={isProFootball ? 0.3 : 0.22}
          />
        </View>

        {/* Prediction */}
        <Text style={styles.predictionTitle}>Make your prediction</Text>
        <View style={styles.pickRow}>
          <TouchableOpacity
            style={[
              styles.pickButton,
              { backgroundColor: match.away.color },
              selectedSide === "away" && styles.pickButtonSelected,
            ]}
            onPress={() => setSelectedSide("away")}
          >
            <Text style={[styles.pickButtonText, styles.pickButtonTextWhite]}>
              {match.away.code} {displayPctAway}%
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.pickButton,
              { backgroundColor: match.home.color },
              selectedSide === "home" && styles.pickButtonSelected,
            ]}
            onPress={() => setSelectedSide("home")}
          >
            <Text style={[styles.pickButtonText, styles.pickButtonTextWhite]}>
              {match.home.code} {displayPctHome}%
            </Text>
          </TouchableOpacity>
        </View>

        {/* Chat row */}
        {/* <View style={styles.chatRowOuter}>
          <BlurView intensity={18} tint="dark" style={styles.chatRow}>
            <View style={styles.chatLeft}>
              <View style={styles.chatAvatars}>
                <View
                  style={[
                    styles.chatAvatar,
                    { backgroundColor: match.away.color },
                  ]}
                />
                <View
                  style={[
                    styles.chatAvatar,
                    { backgroundColor: match.home.color, marginLeft: -8 },
                  ]}
                />
                <View
                  style={[
                    styles.chatAvatar,
                    { backgroundColor: Colors.primary, marginLeft: -8 },
                  ]}
                />
              </View>
              <Text style={styles.chatText}>
                {match.chattingCount} chatting...
              </Text>
            </View>

            <TouchableOpacity
              style={styles.joinChatButton}
              onPress={() => setChatVisible(true)}
            >
              <Text style={styles.joinChatText}>Join Chat</Text>
            </TouchableOpacity>
          </BlurView>
        </View> */}

        <Orders />
        {/* About */}
        <View style={styles.about}>
          <Text style={styles.aboutTitle}>About</Text>
          <Text style={styles.aboutBody}>{match.about}</Text>
        </View>
      </ScrollView>

      {/* Chat bottom sheet */}
      <Modal
        visible={chatVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setChatVisible(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View style={styles.modalSheet}>
            {/* Modal header */}
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderText}>
                <Text style={styles.modalTitle}>
                  {DUMMY_MATCH.away.name} vs. {DUMMY_MATCH.home.name}
                </Text>
                <Text style={styles.modalSubtitle}>
                  {DUMMY_MATCH.chattingCount} chatting
                </Text>
              </View>
              <TouchableOpacity
                style={styles.modalClose}
                onPress={() => setChatVisible(false)}
              >
                <Ionicons name="close" size={22} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Messages list */}
            <FlatList
              data={DUMMY_MESSAGES}
              keyExtractor={(item) => item.id}
              style={styles.messageList}
              contentContainerStyle={styles.messageListContent}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => (
                <View style={styles.messageRow}>
                  <View style={styles.messageTextBlock}>
                    <Text style={styles.messageHandle}>{item.handle}</Text>
                    <Text style={styles.messageBody}>{item.text}</Text>
                  </View>
                  {item.badge && (
                    <View
                      style={[
                        styles.messageBadge,
                        item.badge.startsWith("PHI")
                          ? styles.messageBadgeAway
                          : styles.messageBadgeHome,
                      ]}
                    >
                      <Text style={styles.messageBadgeText}>{item.badge}</Text>
                    </View>
                  )}
                </View>
              )}
            />

            {/* Bottom section: prediction buttons + input */}
            <View style={styles.modalBottomSection}>
              {/* Chat input */}
              <View style={styles.modalInputRow}>
                <TextInput
                  style={styles.modalInput}
                  placeholder="Type a message..."
                  placeholderTextColor={Colors.textMuted}
                  value={chatInput}
                  onChangeText={setChatInput}
                  returnKeyType="send"
                  onSubmitEditing={() => {
                    if (!chatInput.trim()) return;
                    console.log("Sending chat message:", chatInput.trim());
                    setChatInput("");
                  }}
                />
                <TouchableOpacity
                  style={styles.modalSendButton}
                  onPress={() => {
                    if (!chatInput.trim()) return;
                    console.log("Sending chat message:", chatInput.trim());
                    setChatInput("");
                  }}
                >
                  <Ionicons
                    name="send"
                    size={18}
                    color={
                      chatInput.trim() ? Colors.textPrimary : Colors.textMuted
                    }
                  />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "black",
  },
  container: {
    flex: 1,
    backgroundColor: "black",
  },
  content: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xxxl,
  },

  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: Spacing.md,
    paddingBottom: Spacing.lg,
    marginBottom: Spacing.lg,
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
    flexDirection: "row",
    gap: Spacing.sm,
  },
  logoImage: {
    width: 54,
    height: 54,
  },
  headerTitle: {
    ...Typography.body,
    fontSize: 16,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  competitionRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  competitionPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.round,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
  },
  competitionText: {
    color: Colors.textSecondary,
    fontWeight: "500",
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  livePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: BorderRadius.round,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.danger,
  },
  liveText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    fontWeight: "600",
    letterSpacing: 1.2,
  },

  matchHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: Spacing.lg,
  },
  teamBlockLeft: { width: "28%" },
  teamBlockRight: { width: "28%", alignItems: "flex-end" },
  teamCode: {
    fontSize: 22,
    fontWeight: "800",
  },
  teamName: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  teamRecord: {
    ...Typography.caption,
    color: Colors.textMuted,
    marginTop: 2,
  },
  scoreBlock: {
    width: "44%",
    alignItems: "center",
  },
  scoreText: {
    fontSize: 26,
    fontWeight: "800",
    color: Colors.textPrimary,
    letterSpacing: 0.5,
  },
  scoreDash: {
    color: Colors.textTertiary,
  },
  volumeRow: {
    width: "100%",
    alignItems: "center",
    marginTop: 10,
  },
  pctBar: {
    width: "100%",
    height: 8,
    borderRadius: 8,
    overflow: "hidden",
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  pctBarLeft: { height: "100%" },
  pctBarRight: { height: "100%" },
  volumeText: {
    ...Typography.caption,
    color: "#FFFFFF",
    marginTop: 8,
  },

  predictionTitle: {
    ...Typography.bodyLarge,
    color: Colors.textPrimary,
    marginTop: Spacing.md,
    marginBottom: Spacing.md,
  },
  pickRow: {
    flexDirection: "row",
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  pickButton: {
    flex: 1,
    borderRadius: BorderRadius.round,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  pickButtonSelected: {
    borderWidth: 3,
    borderColor: "#FFFFFF",
  },
  pickButtonText: {
    fontSize: 14,
    fontWeight: "800",
    color: "black",
    letterSpacing: 0.2,
  },
  pickButtonTextWhite: {
    color: "#FFFFFF",
  },
  pickButtonTextDark: {
    color: "#111111",
  },

  highLowContainer: {
    marginTop: Spacing.md,
    marginBottom: Spacing.lg,
  },
  highLowRow: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  highLowCard: {
    flex: 1,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,

    borderWidth: 1,
  },
  highLowLabel: {
    fontSize: 12,
    fontWeight: "700",
    marginBottom: Spacing.sm,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  highLowValues: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  highLowItem: {
    flex: 1,
    alignItems: "center",
  },
  highLowTitle: {
    ...Typography.caption,
    color: Colors.textMuted,
    fontSize: 11,
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  highLowPrice: {
    ...Typography.body,
    color: Colors.textPrimary,
    fontWeight: "700",
    fontSize: 14,
  },
  highLowDivider: {
    width: 1,
    height: 32,
    backgroundColor: "rgba(255,255,255,0.08)",
    marginHorizontal: Spacing.sm,
  },

  chatRowOuter: {
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    marginTop: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  chatRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    backgroundColor: "rgba(15,15,15,0.65)",
  },
  chatLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  chatAvatars: {
    flexDirection: "row",
    alignItems: "center",
  },
  chatAvatar: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: "rgba(0,0,0,0.35)",
  },
  chatText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    fontWeight: "600",
  },
  joinChatButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: BorderRadius.round,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  joinChatText: {
    ...Typography.caption,
    color: Colors.textPrimary,
    fontWeight: "700",
  },

  about: {
    paddingBottom: Spacing.lg,
  },
  aboutTitle: {
    ...Typography.bodyLarge,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  aboutBody: {
    ...Typography.body,
    color: Colors.textSecondary,
    lineHeight: 22,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    backgroundColor: "#040404",
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    paddingTop: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
    maxHeight: "88%",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.md,
  },
  modalHeaderText: {
    flex: 1,
    paddingRight: Spacing.md,
  },
  modalTitle: {
    ...Typography.bodyLarge,
    color: Colors.textPrimary,
  },
  modalSubtitle: {
    ...Typography.caption,
    color: Colors.textMuted,
    marginTop: 2,
  },
  modalClose: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  messageList: {
    flexGrow: 0,
    marginBottom: Spacing.md,
  },
  messageListContent: {
    paddingBottom: Spacing.lg,
  },
  messageRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.04)",
  },
  messageTextBlock: {
    flex: 1,
    paddingRight: Spacing.sm,
  },
  messageHandle: {
    ...Typography.caption,
    color: Colors.textMuted,
    marginBottom: 2,
  },
  messageBody: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
  messageBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.round,
    alignSelf: "center",
  },
  messageBadgeAway: {
    backgroundColor: DUMMY_MATCH.away.color,
  },
  messageBadgeHome: {
    backgroundColor: DUMMY_MATCH.home.color,
  },
  messageBadgeText: {
    ...Typography.caption,
    color: "#FFFFFF",
    fontWeight: "700",
  },
  modalBottomBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: Spacing.sm,
  },
  modalPickButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  modalPickLeft: {
    borderTopLeftRadius: BorderRadius.round,
    borderBottomLeftRadius: BorderRadius.round,
    marginRight: 4,
  },
  modalPickRight: {
    borderTopRightRadius: BorderRadius.round,
    borderBottomRightRadius: BorderRadius.round,
    marginLeft: 4,
  },
  modalPickText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  modalPickTextDark: {
    color: "#111111",
  },
  modalBottomSection: {},
  modalInputRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: Spacing.sm,
  },
  modalInput: {
    flex: 1,
    height: 40,
    borderRadius: BorderRadius.round,
    paddingHorizontal: Spacing.md,
    backgroundColor: "rgba(255,255,255,0.06)",
    color: Colors.textPrimary,
    fontSize: 14,
    bottom: 20,
  },
  modalSendButton: {
    marginLeft: Spacing.sm,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
    bottom: 20,
  },
});
