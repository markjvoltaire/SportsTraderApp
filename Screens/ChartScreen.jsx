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

  // MyChart state (same pattern as MarketDetailScreen)
  const [currentTimestamp, setCurrentTimestamp] = useState(null);
  const [priceStats, setPriceStats] = useState(null);
  const [currentPrices, setCurrentPrices] = useState(null);
  const [chartLoading, setChartLoading] = useState(true);

  const market = route.params?.game || route.params?.market || null;

  console.log("market", market);

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

    // Derive team data similar to MarketDetailScreen
    let awayTeamData = null;
    let homeTeamData = null;
    let awayName = "Away";
    let homeName = "Home";
    let awayAbbreviation = null;
    let homeAbbreviation = null;
    let awayColor = null;
    let homeColor = null;

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

    // Calculate percentages from prices (prices are typically 0-1 decimals)
    let pctAway, pctHome;
    if (
      awayPrice == null ||
      homePrice == null ||
      !Number.isFinite(awayPrice) ||
      !Number.isFinite(homePrice)
    ) {
      // Fallback to dummy if prices not available
      pctAway = DUMMY_MATCH.pctAway;
      pctHome = DUMMY_MATCH.pctHome;
    } else {
      // Prices are decimals (0-1), convert to percentages and normalize to sum to 100%
      const sum = awayPrice + homePrice || 1;
      pctAway = Math.round((awayPrice / sum) * 100);
      pctHome = 100 - pctAway;
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
  }, [market]);

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

  const formattedVolume = useMemo(() => {
    const n = match.volumeUsd;
    return `$${Math.round(n).toLocaleString("en-US")} Vol.`;
  }, [match.volumeUsd]);

  // Animated styles for team blocks
  const awayTeamAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: awayTeamTranslateX.value }],
      opacity: awayTeamOpacity.value,
    };
  });

  const homeTeamAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: homeTeamTranslateX.value }],
      opacity: homeTeamOpacity.value,
    };
  });

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

          <View style={styles.livePill}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>LIVE</Text>
          </View>

          <TouchableOpacity style={styles.topBarIcon}>
            <Ionicons
              name="share-outline"
              size={20}
              color={Colors.textPrimary}
            />
          </TouchableOpacity>
        </View>

        {/* Match header */}
        <View style={styles.matchHeader}>
          <Animated.View style={[styles.teamBlockLeft, awayTeamAnimatedStyle]}>
            <Text style={[styles.teamCode, { color: match.away.color }]}>
              {match.away.code}
            </Text>
            <Text style={styles.teamName}>{match.away.name}</Text>
            <Text style={styles.teamRecord}>{match.away.record}</Text>
          </Animated.View>

          <View style={styles.scoreBlock}>
            <Text style={styles.scoreText}>
              {match.score.away} <Text style={styles.scoreDash}>-</Text>{" "}
              {match.score.home}
            </Text>

            <View style={styles.volumeRow}>
              <View style={styles.pctBar}>
                <View
                  style={[
                    styles.pctBarLeft,
                    {
                      width: `${match.pctAway}%`,
                      backgroundColor: match.away.color,
                    },
                  ]}
                />
                <View
                  style={[
                    styles.pctBarRight,
                    {
                      width: `${match.pctHome}%`,
                      backgroundColor: match.home.color,
                    },
                  ]}
                />
              </View>
              <Text style={styles.volumeText}>{formattedVolume}</Text>
            </View>
          </View>

          <Animated.View style={[styles.teamBlockRight, homeTeamAnimatedStyle]}>
            <Text style={[styles.teamCode, { color: match.home.color }]}>
              {match.home.code}
            </Text>
            <Text style={styles.teamName}>{match.home.name}</Text>
            <Text style={styles.teamRecord}>{match.home.record}</Text>
          </Animated.View>
        </View>

        {/* Chart */}
        <View style={{ right: 15 }}>
          <MyChart
            market={market}
            onTimestampChange={setCurrentTimestamp}
            onPriceStatsChange={setPriceStats}
            onPriceChange={setCurrentPrices}
            onLoadingChange={setChartLoading}
            timeFrame={chartTimeFrame}
            awayColor={match.away.color}
            homeColor={match.home.color}
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
            <Text style={styles.pickButtonText}>
              {match.away.code} {match.pctAway}%
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
            <Text style={[styles.pickButtonText]}>
              {match.home.code} {match.pctHome}%
            </Text>
          </TouchableOpacity>
        </View>

        {/* Chat row */}
        <View style={styles.chatRowOuter}>
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
        </View>

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
              {/* Prediction chips */}
              <View style={styles.modalBottomBar}>
                <TouchableOpacity
                  style={[
                    styles.modalPickButton,
                    styles.modalPickLeft,
                    { backgroundColor: match.away.color },
                  ]}
                >
                  <Text style={styles.modalPickText}>{match.away.code}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.modalPickButton,
                    styles.modalPickRight,
                    { backgroundColor: match.home.color },
                  ]}
                >
                  <Text
                    style={[styles.modalPickText, styles.modalPickTextDark]}
                  >
                    {match.home.code}
                  </Text>
                </TouchableOpacity>
              </View>

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
    backgroundColor: Colors.background,
  },
  container: {
    flex: 1,
    backgroundColor: Colors.background,
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
    color: "white",
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
    borderWidth: 2,
    borderColor: Colors.textPrimary,
  },
  pickButtonText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: 0.2,
  },
  pickButtonTextDark: {
    color: "#111111",
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
    color: "#000000",
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
  modalBottomSection: {
    marginTop: Spacing.sm,
  },
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
  },
  modalSendButton: {
    marginLeft: Spacing.sm,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
  },
});
