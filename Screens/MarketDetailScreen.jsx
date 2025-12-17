import React, { useState, useMemo, useEffect } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Dimensions,
  Text,
  Image,
  TouchableOpacity,
  Modal,
  FlatList,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { BlurView } from "expo-blur";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useRoute, useNavigation } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import MyChart from "../src/components/market/MyChart";
import ButtonRow from "../src/components/market/ButtonRow";
import PurchaseModal from "../src/components/market/PurchaseModal";
import {
  Colors,
  Spacing,
  Typography,
  BorderRadius,
} from "../src/constants/theme";
import { formatCurrency, formatSharePrice } from "../src/utils/formatters";
import StatCard from "../src/components/market/StatCard";

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

export default function MarketsScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const market = route.params?.game || route.params?.market;

  const { height } = Dimensions.get("window");

  // Get safe area insets for proper button positioning
  const insets = useSafeAreaInsets();

  // Extract market title
  const marketTitle = useMemo(() => {
    if (!market) {
      return "Markets";
    }
    // Try title first, then question, then construct from teams
    if (market.title) {
      return market.title;
    }
    if (market.question) {
      return market.question;
    }
    // Construct from team names if available
    if (market.awayTeam && market.homeTeam) {
      const awayName =
        market.awayTeam.abbreviation || market.awayTeam.name || "Away";
      const homeName =
        market.homeTeam.abbreviation || market.homeTeam.name || "Home";
      return `${awayName} vs ${homeName}`;
    }
    return "Markets";
  }, [market]);

  // State for current timestamp from chart cursor
  const [currentTimestamp, setCurrentTimestamp] = useState(null);

  // State for price stats (high/low) from chart
  const [priceStats, setPriceStats] = useState(null);

  // State for current prices from chart cursor
  const [currentPrices, setCurrentPrices] = useState(null);

  // State for chart loading
  const [chartLoading, setChartLoading] = useState(true);

  // State for time period filter
  const [selectedPeriod, setSelectedPeriod] = useState("All");

  // State for purchase modal
  const [purchaseModalVisible, setPurchaseModalVisible] = useState(false);
  const [selectedPurchase, setSelectedPurchase] = useState(null);

  // State for countdown timer
  const [timeRemaining, setTimeRemaining] = useState(null);

  // State for chat
  const [chatVisible, setChatVisible] = useState(false);
  const [chatInput, setChatInput] = useState("");

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

  // Handler for buy buttons
  const handleBuyAway = (data) => {
    setSelectedPurchase(data);
    setPurchaseModalVisible(true);
  };

  const handleBuyHome = (data) => {
    setSelectedPurchase(data);
    setPurchaseModalVisible(true);
  };

  const handleCloseModal = () => {
    // The modal handles its own close animation and calls this when done
    setPurchaseModalVisible(false);
    setSelectedPurchase(null);
  };

  // Extract timestamp - use current timestamp if available, otherwise use game date
  const timestamp = useMemo(() => {
    // If we have a timestamp from the chart cursor, use that
    if (currentTimestamp) {
      try {
        const dateObj = new Date(currentTimestamp * 1000); // Convert from seconds to milliseconds
        if (!Number.isNaN(dateObj.getTime())) {
          const dateStr = dateObj.toLocaleDateString(undefined, {
            weekday: "long",
            month: "long",
            day: "numeric",
            year: "numeric",
          });
          const timeStr = dateObj.toLocaleTimeString(undefined, {
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
          });
          return `${dateStr} ${timeStr}`;
        }
      } catch (e) {
        // Ignore date parsing errors
      }
    }

    // Otherwise, use the game date
    if (!market) {
      return "Browse all available markets.";
    }
    // Try to get a description or date
    const date =
      market.gameStartTime ||
      market.date ||
      market.eventDate ||
      market.startTime ||
      market.startDate;
    if (date) {
      try {
        const dateObj = new Date(date);
        if (!Number.isNaN(dateObj.getTime())) {
          const dateStr = dateObj.toLocaleDateString(undefined, {
            weekday: "long",
            month: "long",
            day: "numeric",
            year: "numeric",
          });
          const timeStr = dateObj.toLocaleTimeString(undefined, {
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
          });
          return `${dateStr} ${timeStr}`;
        }
      } catch (e) {
        // Ignore date parsing errors
      }
    }
    return "Market details";
  }, [market, currentTimestamp]);

  // Extract and format volume
  const marketVolume = useMemo(() => {
    if (!market) {
      return 0;
    }
    return (
      market.volume24hr ||
      market.volume?.day ||
      market.volumeNum ||
      market.volume ||
      0
    );
  }, [market]);

  const formattedVolume =
    marketVolume > 0
      ? `$${Math.round(marketVolume).toLocaleString("en-US")} Vol.`
      : "$0 Vol.";

  // Extract game start time for countdown timer
  const gameStartTime = useMemo(() => {
    if (!market) return null;

    const dateString =
      market.gameTime?.timeString ||
      market.gameTime ||
      market.gameStartTime ||
      market.date ||
      market.eventDate ||
      market.startTime ||
      market.startDate;

    if (!dateString) return null;

    // Normalize date string (similar to MarketCard)
    let normalizedDate = dateString;
    if (
      typeof dateString === "string" &&
      dateString.includes(" ") &&
      dateString.includes("+")
    ) {
      normalizedDate = dateString.replace(" ", "T");
      if (normalizedDate.match(/\+00(:00)?$/)) {
        normalizedDate = normalizedDate.replace(/\+00(:00)?$/, "Z");
      }
    }

    const date = new Date(normalizedDate);
    return Number.isNaN(date.getTime()) ? null : date;
  }, [market]);

  // Countdown timer effect
  useEffect(() => {
    if (!gameStartTime) {
      setTimeRemaining(null);
      return;
    }

    const updateTimer = () => {
      const now = new Date();
      const diff = gameStartTime.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeRemaining("LIVE");
      } else {
        setTimeRemaining(diff);
      }
    };

    // Update immediately
    updateTimer();

    // Update every second
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [gameStartTime]);

  // Format countdown time as Dd Hh Mm Ss
  const formatCountdown = (ms) => {
    if (ms === "LIVE") return "LIVE";

    const totalSeconds = Math.floor(ms / 1000);
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    // Always show days, hours, minutes, and seconds
    return `${days}d ${hours}h ${minutes}m ${seconds}s`;
  };

  // Extract prices and calculate percentages for game header
  const gameHeaderData = useMemo(() => {
    if (!market) {
      return {
        awayPrice: 0.5,
        homePrice: 0.5,
        pctAway: 50,
        pctHome: 50,
        scoreAway: 0,
        scoreHome: 0,
      };
    }

    // Extract prices from market.prices array
    let awayPrice = null;
    let homePrice = null;

    if (
      market.prices &&
      Array.isArray(market.prices) &&
      market.prices.length >= 2
    ) {
      // Match prices to teams by tokenId if teamTokenIds array exists
      if (market.teamTokenIds && Array.isArray(market.teamTokenIds)) {
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

        awayPrice = awayPriceObj
          ? parseFloat(awayPriceObj.price || awayPriceObj.sellPrice)
          : null;
        homePrice = homePriceObj
          ? parseFloat(homePriceObj.price || homePriceObj.sellPrice)
          : null;
      } else {
        // Fallback to index-based matching (first price = away, second = home)
        awayPrice = parseFloat(
          market.prices[0]?.price || market.prices[0]?.sellPrice
        );
        homePrice = parseFloat(
          market.prices[1]?.price || market.prices[1]?.sellPrice
        );
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
      pctAway = 50;
      pctHome = 50;
    } else {
      // Prices are decimals (0-1), convert to percentages and normalize to sum to 100%
      const sum = awayPrice + homePrice || 1;
      pctAway = Math.round((awayPrice / sum) * 100);
      pctHome = 100 - pctAway;
    }

    // Extract scores
    const scoreAway =
      market.awayScore ?? market.away_score ?? market.scoreAway ?? 0;
    const scoreHome =
      market.homeScore ?? market.home_score ?? market.scoreHome ?? 0;

    return {
      awayPrice: awayPrice || 0.5,
      homePrice: homePrice || 0.5,
      pctAway,
      pctHome,
      scoreAway,
      scoreHome,
    };
  }, [market]);

  // Extract team data - similar to MarketCard implementation
  const teamData = useMemo(() => {
    if (!market) {
      return {
        awayTeamData: null,
        homeTeamData: null,
        awayName: "Away",
        homeName: "Home",
        awayAbbreviation: "Away",
        homeAbbreviation: "Home",
        awayColor: Colors.primary,
        homeColor: Colors.accentTeal,
      };
    }

    let awayTeamData = null;
    let homeTeamData = null;
    let awayName = "Away";
    let homeName = "Home";
    let awayAbbreviation = null;
    let homeAbbreviation = null;
    let awayColor = null;
    let homeColor = null;

    // First, try to get from teams array (new API format)
    if (
      market?.teams &&
      Array.isArray(market.teams) &&
      market.teams.length >= 2
    ) {
      awayTeamData = market.teams[0];
      homeTeamData = market.teams[1];
      // Prefer alias over name (alias is shorter, e.g., "Patriots" vs "New England Patriots")
      awayName = awayTeamData.alias || awayTeamData.name || "Away";
      homeName = homeTeamData.alias || homeTeamData.name || "Home";
      awayAbbreviation = awayTeamData.abbreviation?.toUpperCase() || null;
      homeAbbreviation = homeTeamData.abbreviation?.toUpperCase() || null;
      awayColor = awayTeamData.color || null;
      homeColor = homeTeamData.color || null;
    }
    // Fallback to awayTeam/homeTeam objects
    else if (market?.awayTeam || market?.homeTeam) {
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
    }
    // Last resort: extract from title
    else if (market?.title) {
      const titleMatch = market.title.match(/(.+?)\s+vs\.?\s+(.+)/i);
      if (titleMatch) {
        awayName = titleMatch[1].trim().replace(/\.$/, ""); // Remove trailing period
        homeName = titleMatch[2].trim().replace(/\.$/, ""); // Remove trailing period

        // Try to extract abbreviations from slug (e.g., "nba-gsw-por" -> gsw, por)
        if (market?.slug) {
          const slugParts = market.slug.split("-");
          if (slugParts.length >= 3) {
            awayAbbreviation = slugParts[1]?.toUpperCase() || null;
            homeAbbreviation = slugParts[2]?.toUpperCase() || null;
          }
        }

        // Generate abbreviations if still missing
        if (!awayAbbreviation) {
          const awayWords = awayName.split(/\s+/);
          awayAbbreviation =
            awayWords.length > 1
              ? awayWords
                  .map((w) => w[0])
                  .join("")
                  .toUpperCase()
                  .slice(0, 3)
              : awayName.substring(0, 3).toUpperCase();
        }
        if (!homeAbbreviation) {
          const homeWords = homeName.split(/\s+/);
          homeAbbreviation =
            homeWords.length > 1
              ? homeWords
                  .map((w) => w[0])
                  .join("")
                  .toUpperCase()
                  .slice(0, 3)
              : homeName.substring(0, 3).toUpperCase();
        }
      }
    }

    // Fallback abbreviations if still missing
    awayAbbreviation =
      awayAbbreviation || awayName.substring(0, 3).toUpperCase();
    homeAbbreviation =
      homeAbbreviation || homeName.substring(0, 3).toUpperCase();

    // Get team colors - use from API if available, otherwise use default colors
    const finalAwayColor = awayColor || Colors.primary;
    const finalHomeColor = homeColor || Colors.accentTeal;

    return {
      awayTeamData,
      homeTeamData,
      awayName,
      homeName,
      awayAbbreviation,
      homeAbbreviation,
      awayColor: finalAwayColor,
      homeColor: finalHomeColor,
    };
  }, [market]);

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
    <>
      <SafeAreaView style={styles.safe} edges={["top"]}>
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

          {timeRemaining === "LIVE" ? (
            <View style={styles.livePill}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>LIVE</Text>
            </View>
          ) : (
            <Text style={styles.topBarCountdown}>
              Starts in:{" "}
              {timeRemaining !== null ? formatCountdown(timeRemaining) : "TBD"}
            </Text>
          )}

          <TouchableOpacity style={styles.topBarIcon}>
            <Ionicons
              name="share-outline"
              size={20}
              color={Colors.textPrimary}
            />
          </TouchableOpacity>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          scrollEventThrottle={16}
        >
          {/* Game Header */}
          <View style={styles.gameHeader}>
            {/* Left Team */}
            <Animated.View
              style={[styles.teamBlockLeft, awayTeamAnimatedStyle]}
            >
              <Text
                style={[styles.teamAbbreviation, { color: teamData.awayColor }]}
              >
                {teamData.awayAbbreviation}
              </Text>
              <Text style={styles.teamName}>{teamData.awayName}</Text>
              {teamData.awayTeamData?.record && (
                <Text style={styles.teamRecord}>
                  {teamData.awayTeamData.record}
                </Text>
              )}
            </Animated.View>

            {/* Center: Percentage Bar, Volume */}
            <View style={styles.scoreBlock}>
              <View style={styles.percentageBar}>
                <View
                  style={[
                    styles.percentageBarLeft,
                    {
                      width: `${gameHeaderData.pctAway}%`,
                      backgroundColor: teamData.awayColor,
                    },
                  ]}
                />
                <View
                  style={[
                    styles.percentageBarRight,
                    {
                      width: `${gameHeaderData.pctHome}%`,
                      backgroundColor: teamData.homeColor,
                    },
                  ]}
                />
              </View>

              <Text style={styles.volumeText}>{formattedVolume}</Text>
            </View>

            {/* Right Team */}
            <Animated.View
              style={[styles.teamBlockRight, homeTeamAnimatedStyle]}
            >
              <Text
                style={[styles.teamAbbreviation, { color: teamData.homeColor }]}
              >
                {teamData.homeAbbreviation}
              </Text>
              <Text style={styles.teamName}>{teamData.homeName}</Text>
              {teamData.homeTeamData?.record && (
                <Text style={styles.teamRecord}>
                  {teamData.homeTeamData.record}
                </Text>
              )}
            </Animated.View>
          </View>

          <View style={[styles.chartContainerWrapper]}>
            <MyChart
              market={market}
              onTimestampChange={setCurrentTimestamp}
              onPriceStatsChange={setPriceStats}
              onPriceChange={setCurrentPrices}
              onLoadingChange={setChartLoading}
              awayColor={teamData.awayColor}
              homeColor={teamData.homeColor}
            />
          </View>

          {/* Chat row */}
          <View style={styles.chatRowOuter}>
            <BlurView intensity={18} tint="dark" style={styles.chatRow}>
              <View style={styles.chatLeft}>
                <View style={styles.chatAvatars}>
                  <View
                    style={[
                      styles.chatAvatar,
                      { backgroundColor: teamData.awayColor },
                    ]}
                  />
                  <View
                    style={[
                      styles.chatAvatar,
                      {
                        backgroundColor: teamData.homeColor,
                        marginLeft: -8,
                      },
                    ]}
                  />
                  <View
                    style={[
                      styles.chatAvatar,
                      { backgroundColor: Colors.primary, marginLeft: -8 },
                    ]}
                  />
                </View>
                <Text style={styles.chatText}>132 chatting...</Text>
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
            <Text style={styles.aboutBody}>
              {market?.description ||
                `Predict the outcome of "${teamData.awayName} vs. ${teamData.homeName}". Earn $1 per contract when you're right, or close your position before the event.`}
            </Text>
          </View>

          <View style={styles.bottomSpacer} />
        </ScrollView>
      </SafeAreaView>
      <View
        style={[
          styles.buttonContainer,
          {
            bottom: 72, // Tab bar height
          },
        ]}
        pointerEvents="box-none"
      >
        {/* Left gradient for away team */}
        <LinearGradient
          colors={[`${teamData.awayColor}33`, `${teamData.awayColor}00`]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={styles.leftGradient}
          pointerEvents="none"
        />

        {/* Right gradient for home team */}
        <LinearGradient
          colors={[`${teamData.homeColor}00`, `${teamData.homeColor}33`]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={styles.rightGradient}
          pointerEvents="none"
        />

        <View style={styles.buttonRowWrapper}>
          <ButtonRow
            market={market}
            currentPrices={currentPrices}
            loading={chartLoading}
            onBuyAway={handleBuyAway}
            onBuyHome={handleBuyHome}
          />
        </View>
      </View>

      {/* Purchase Modal */}
      {selectedPurchase && (
        <PurchaseModal
          visible={purchaseModalVisible}
          onClose={handleCloseModal}
          team={selectedPurchase.team}
          price={selectedPurchase.price}
          color={selectedPurchase.color}
          market={market}
        />
      )}

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
                  {teamData.awayName} vs. {teamData.homeName}
                </Text>
                <Text style={styles.modalSubtitle}>132 chatting</Text>
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
                        {
                          backgroundColor: item.badge.startsWith(
                            teamData.awayAbbreviation
                          )
                            ? teamData.awayColor
                            : teamData.homeColor,
                        },
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
                    { backgroundColor: teamData.awayColor },
                  ]}
                >
                  <Text style={styles.modalPickText}>
                    {teamData.awayAbbreviation}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.modalPickButton,
                    styles.modalPickRight,
                    { backgroundColor: teamData.homeColor },
                  ]}
                >
                  <Text
                    style={[styles.modalPickText, styles.modalPickTextDark]}
                  >
                    {teamData.homeAbbreviation}
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
    </>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
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
  topBarCountdown: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.textPrimary,
    fontFamily: "Poppins-Bold",
    letterSpacing: 0.3,
  },
  gameHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  teamBlockLeft: {
    width: "28%",
    alignItems: "flex-start",
  },
  teamBlockRight: {
    width: "28%",
    alignItems: "flex-end",
  },
  teamAbbreviation: {
    fontSize: 22,
    fontWeight: "800",
    fontFamily: "Poppins-Bold",
  },
  teamName: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: 4,
    fontSize: 13,
  },
  teamRecord: {
    ...Typography.caption,
    color: Colors.textTertiary,
    marginTop: 2,
    fontSize: 11,
  },
  scoreBlock: {
    width: "44%",
    alignItems: "center",
  },
  scoreText: {
    fontSize: 32,
    fontWeight: "800",
    color: Colors.textPrimary,
    letterSpacing: 0.5,
    fontFamily: "Poppins-Bold",
  },
  countdownText: {
    fontSize: 28,
    fontWeight: "800",
    color: Colors.textPrimary,
    letterSpacing: 0.5,
    fontFamily: "Poppins-Bold",
    textAlign: "center",
  },
  scoreDash: {
    color: Colors.textTertiary,
  },
  percentageBar: {
    width: "100%",
    height: 8,
    borderRadius: 4,
    overflow: "hidden",
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.06)",
    marginTop: Spacing.md,
  },
  percentageBarLeft: {
    height: "100%",
  },
  percentageBarRight: {
    height: "100%",
  },
  volumeText: {
    ...Typography.caption,
    color: Colors.textPrimary,
    marginTop: Spacing.sm,
    fontSize: 12,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 120, // Space for buttons at bottom
  },
  bottomSpacer: {
    height: 200, // Extra space to ensure MarketRules is fully scrollable
  },
  chartContainerWrapper: {
    marginHorizontal: -Spacing.xl,
    marginBottom: 10,
  },
  volumeContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingLeft: Spacing.xs,
    paddingRight: Spacing.xl,
    paddingTop: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  periodFilters: {
    flexDirection: "row",
    gap: Spacing.xs,
  },
  periodButton: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: 8,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  periodButtonActive: {
    backgroundColor: "#FFFFFF",
    borderColor: Colors.border,
  },
  periodButtonText: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.textSecondary,
  },
  periodButtonTextActive: {
    color: "#000000",
  },
  buttonContainer: {
    position: "absolute",
    left: 0,
    right: 0,
    backgroundColor: Colors.background,
    width: "100%",
    paddingHorizontal: Spacing.xl, // Match ScreenTemplate padding
    paddingTop: Spacing.md,
    paddingBottom: Spacing.md,
    zIndex: 1000, // Ensure it's above other content
    elevation: 10, // For Android shadow/elevation
    shadowColor: "rgba(0, 0, 0, 0.5)",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    overflow: "hidden",
  },
  leftGradient: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 150,
    zIndex: 0,
  },
  rightGradient: {
    position: "absolute",
    right: 0,
    top: 0,
    bottom: 0,
    width: 150,
    zIndex: 0,
  },
  buttonRowWrapper: {
    zIndex: 1,
    width: "100%",
  },
  volumeLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: Colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  volumeValue: {
    fontSize: 20,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  timestamp: {
    fontSize: 16,
    fontWeight: "800",
    color: Colors.textPrimary,
    marginTop: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  priceStatsContainer: {
    paddingHorizontal: -Spacing.xl,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  priceStatsTitle: {
    fontSize: 11,
    fontWeight: "600",
    color: Colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: Spacing.sm,
  },
  teamStatsCard: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.sm,
    overflow: "hidden",
  },
  teamStatsGradient: {
    padding: Spacing.md,
    borderRadius: 12,
  },
  teamStatsHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.sm,
  },
  teamStatsLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  teamColorIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: Colors.border,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: Colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  statValue: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  descriptionContainer: {
    paddingHorizontal: -200,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.lg,
  },
  descriptionCard: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
  },
  descriptionHeader: {
    marginBottom: Spacing.md,
  },
  descriptionLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  descriptionText: {
    fontSize: 14,
    fontWeight: "400",
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  chatRowOuter: {
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    marginTop: Spacing.sm,
    marginBottom: Spacing.lg,
    marginHorizontal: Spacing.lg,
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
    paddingHorizontal: Spacing.lg,
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
