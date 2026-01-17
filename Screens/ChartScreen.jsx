import React, { useMemo, useState, useEffect, useRef } from "react";
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
  Animated as RNAnimated,
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
import BuyButtons from "../src/components/market/BuyButtons";

export default function ChartScreen() {
  const navigation = useNavigation();
  const route = useRoute();

  const [timeframe, setTimeframe] = useState("All");
  const [chatVisible, setChatVisible] = useState(false);
  const [chatInput, setChatInput] = useState("");

  // Chart state
  const [candlestickData, setCandlestickData] = useState(null);
  const [currentTimestamp, setCurrentTimestamp] = useState(null);
  const [priceStats, setPriceStats] = useState(null);
  const [currentPrices, setCurrentPrices] = useState(null);
  const [chartLoading, setChartLoading] = useState(true);

  // Trades WebSocket state
  const tradesWsRef = useRef(null);
  const [trades, setTrades] = useState([]);
  const [realtimePrices, setRealtimePrices] = useState({});

  // Separate WebSocket for prices (used directly by bottom buttons)
  const pricesWsRef = useRef(null);
  const [buttonPrices, setButtonPrices] = useState({});
  const lastCandlestickPricesRef = useRef({}); // Track last price for each ticker to detect changes

  // Volume state - initialized with event.volume, incremented with each trade
  const [volume, setVolume] = useState(() => event?.volume || 0);

  const WEBSOCKET_URL = "wss://dev-prediction-markets-api.dflow.net/api/v1/ws";

  const event = route.params?.event || null;
  const market =
    event?.markets?.[0] || route.params?.game || route.params?.market || null;

  // Get the game winner market ticker for each side
  const marketTicker1 = event?.markets?.[0]?.ticker || null;
  const marketTicker2 = event?.markets?.[1]?.ticker || null;

  // Put tickers in an array for WebSocket subscription
  const marketTickers = [marketTicker1, marketTicker2].filter(Boolean);

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

  // Reset volume when event changes
  useEffect(() => {
    setVolume(event?.volume || 0);
  }, [event?.volume]);

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

  // WebSocket connection for trades
  useEffect(() => {
    if (marketTickers.length === 0) return;

    const ws = new WebSocket(WEBSOCKET_URL);

    ws.onopen = () => {
      // Subscribe to all trade updates
      ws.send(
        JSON.stringify({
          type: "subscribe",
          channel: "trades",
          tickers: marketTickers,
        })
      );

      // Subscribe to prices channel
      ws.send(
        JSON.stringify({
          type: "subscribe",
          channel: "prices",
          tickers: marketTickers,
        })
      );
    };

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);

      if (message.channel === "trades") {
        const tradeData = {
          ticker: message.market_ticker,
          tradeId: message.trade_id,
          side: message.taker_side,
          count: message.count,
          yesPrice: message.yes_price_dollars,
          noPrice: message.no_price_dollars,
          time: new Date(message.created_time).toISOString(),
        };

        // Calculate amount spent in dollars (price per share × number of shares)
        const pricePerShare = parseFloat(
          tradeData.side === "yes" ? tradeData.yesPrice : tradeData.noPrice
        );
        const amountSpent = pricePerShare * parseInt(tradeData.count);

        // Increment volume with amount spent
        setVolume((prevVolume) => prevVolume + amountSpent);

        // Add trade to state (prepend to show newest first)
        setTrades((prevTrades) => {
          return [tradeData, ...prevTrades].slice(0, 50);
        });
      } else if (message.channel === "prices") {
        // Calculate mid-price from bid and ask
        const calculateMidPrice = (bid, ask) => {
          if (!bid && !ask) return null;
          if (!bid) return parseFloat(ask);
          if (!ask) return parseFloat(bid);
          return (parseFloat(bid) + parseFloat(ask)) / 2;
        };

        const midPrice = calculateMidPrice(message.yes_bid, message.yes_ask);

        if (midPrice !== null) {
          setRealtimePrices((prev) => ({
            ...prev,
            [message.market_ticker]: midPrice,
          }));
        }
      }
    };

    ws.onerror = (error) => {
      console.error("Trades WebSocket error:", {
        readyState: ws.readyState,
        url: ws.url,
        errorType: error?.type,
        message: error?.message || "Connection failed",
      });
    };

    ws.onclose = (event) => {
      console.log("Trades WebSocket connection closed:", {
        code: event.code,
        reason: event.reason,
        wasClean: event.wasClean,
        readyState: ws.readyState,
      });
    };

    tradesWsRef.current = ws;

    // Cleanup function
    return () => {
      if (tradesWsRef.current) {
        const wsToClose = tradesWsRef.current;

        // Remove event handlers to prevent memory leaks
        wsToClose.onopen = null;
        wsToClose.onmessage = null;
        wsToClose.onerror = null;
        wsToClose.onclose = null;

        // Unsubscribe before closing if connection is open
        if (wsToClose.readyState === WebSocket.OPEN) {
          try {
            // Unsubscribe from trades
            wsToClose.send(
              JSON.stringify({
                type: "unsubscribe",
                channel: "trades",
                tickers: marketTickers,
              })
            );
            // Unsubscribe from prices
            wsToClose.send(
              JSON.stringify({
                type: "unsubscribe",
                channel: "prices",
                tickers: marketTickers,
              })
            );
          } catch (error) {
            console.error("Error unsubscribing from channels:", error);
          }
        }

        // Close the connection
        if (
          wsToClose.readyState === WebSocket.OPEN ||
          wsToClose.readyState === WebSocket.CONNECTING
        ) {
          wsToClose.close();
        }

        tradesWsRef.current = null;
      }
    };
  }, [marketTickers.join(",")]);

  // Separate WebSocket connection for prices (for bottom buttons)
  useEffect(() => {
    if (marketTickers.length === 0) return;

    const ws = new WebSocket(WEBSOCKET_URL);

    ws.onopen = () => {
      // Subscribe to prices channel
      ws.send(
        JSON.stringify({
          type: "subscribe",
          channel: "prices",
          tickers: marketTickers,
        })
      );
    };

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);

      if (message.channel === "prices") {
        // Calculate mid-price from bid and ask
        const calculateMidPrice = (bid, ask) => {
          if (!bid && !ask) return null;
          if (!bid) return parseFloat(ask);
          if (!ask) return parseFloat(bid);
          return (parseFloat(bid) + parseFloat(ask)) / 2;
        };

        const midPrice = calculateMidPrice(message.yes_bid, message.yes_ask);

        if (midPrice !== null) {
          setButtonPrices((prev) => ({
            ...prev,
            [message.market_ticker]: midPrice,
          }));

          // Update candlestickData only if price has changed
          const lastPrice =
            lastCandlestickPricesRef.current[message.market_ticker];
          const priceChanged =
            lastPrice === undefined || lastPrice !== midPrice;

          if (priceChanged) {
            lastCandlestickPricesRef.current[message.market_ticker] = midPrice;

            setCandlestickData((prevData) => {
              if (!prevData?.market_candlesticks) return prevData;

              // Determine which market_candlestick array to update
              // marketTicker1 (markets[0]) -> market_candlesticks[0]
              // marketTicker2 (markets[1]) -> market_candlesticks[1]
              let marketIndex = -1;
              if (message.market_ticker === marketTicker1) {
                marketIndex = 0;
              } else if (message.market_ticker === marketTicker2) {
                marketIndex = 1;
              }

              if (marketIndex === -1) return prevData;

              // Create new candlestick point
              const timestamp = Math.floor(Date.now() / 1000);
              const newCandlestickPoint = {
                price: {
                  close: midPrice,
                  close_dollars: midPrice,
                },
                end_period_ts: timestamp,
                timestamp: timestamp,
                time: timestamp,
              };

              // Create updated market_candlesticks array
              const updatedMarketCandlesticks = [
                ...prevData.market_candlesticks,
              ];
              if (!updatedMarketCandlesticks[marketIndex]) {
                updatedMarketCandlesticks[marketIndex] = [];
              }

              // Add new point to the array
              updatedMarketCandlesticks[marketIndex] = [
                ...updatedMarketCandlesticks[marketIndex],
                newCandlestickPoint,
              ];

              return {
                ...prevData,
                market_candlesticks: updatedMarketCandlesticks,
              };
            });
          }
        }
      }
    };

    ws.onerror = (error) => {
      console.error("Prices WebSocket error:", error);
    };

    ws.onclose = (event) => {
      console.log("Prices WebSocket connection closed:", event.code);
    };

    pricesWsRef.current = ws;

    // Cleanup function
    return () => {
      if (pricesWsRef.current) {
        const wsToClose = pricesWsRef.current;

        // Remove event handlers to prevent memory leaks
        wsToClose.onopen = null;
        wsToClose.onmessage = null;
        wsToClose.onerror = null;
        wsToClose.onclose = null;

        // Unsubscribe before closing if connection is open
        if (wsToClose.readyState === WebSocket.OPEN) {
          try {
            wsToClose.send(
              JSON.stringify({
                type: "unsubscribe",
                channel: "prices",
                tickers: marketTickers,
              })
            );
          } catch (error) {
            console.error("Error unsubscribing from prices:", error);
          }
        }

        // Close the connection
        if (
          wsToClose.readyState === WebSocket.OPEN ||
          wsToClose.readyState === WebSocket.CONNECTING
        ) {
          wsToClose.close();
        }

        pricesWsRef.current = null;
      }
    };
  }, [marketTickers.join(",")]);

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
      return null;
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

    // Calculate percentages from event bid data or real-time WebSocket prices
    let pctAway, pctHome;
    if (event?.markets && event.markets.length >= 2) {
      // Use actual bid prices from the event
      const awayMarket = event.markets[1]; // Second market is for away team (Buffalo)
      const homeMarket = event.markets[0]; // First market is for home team (Jacksonville)

      // Use real-time WebSocket price if available, otherwise fallback to yesBid
      const awayPrice =
        awayMarket?.ticker && realtimePrices[awayMarket.ticker]
          ? realtimePrices[awayMarket.ticker]
          : parseFloat(awayMarket.yesBid) || 0;
      const homePrice =
        homeMarket?.ticker && realtimePrices[homeMarket.ticker]
          ? realtimePrices[homeMarket.ticker]
          : parseFloat(homeMarket.yesBid) || 0;

      if (awayPrice > 0 && homePrice > 0) {
        // Convert prices to percentages (prices are already in decimal format like 0.5000)
        pctAway = Math.round(awayPrice * 100);
        pctHome = Math.round(homePrice * 100);
      } else {
        // Fallback to default if price data not available
        pctAway = 50;
        pctHome = 50;
      }
    } else {
      // Fallback to calculated prices if event structure is different
      if (
        awayPrice == null ||
        homePrice == null ||
        !Number.isFinite(awayPrice) ||
        !Number.isFinite(homePrice)
      ) {
        pctAway = 50;
        pctHome = 50;
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
      market.awayScore ?? market.away_score ?? market.scoreAway ?? 0;
    const scoreHome =
      market.homeScore ?? market.home_score ?? market.scoreHome ?? 0;

    // Build about section from event data
    let about =
      market.description ||
      `Predict the outcome of “${awayName} vs. ${homeName}”.`;

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

    return {
      league: market.league || market.sport || null,
      isLive: true,
      away: {
        code: awayAbbreviation,
        name: awayName,
        record: awayTeamData?.record || null,
        color: finalAwayColor,
      },
      home: {
        code: homeAbbreviation,
        name: homeName,
        record: homeTeamData?.record || null,
        color: finalHomeColor,
      },
      score: { away: scoreAway, home: scoreHome },
      volumeUsd,
      pctAway,
      pctHome,
      chattingCount: 0,
      about,
    };
  }, [market, event, realtimePrices]);

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

  // Extract price values from dedicated prices WebSocket for bottom buttons
  const awayTickerPrice = useMemo(() => {
    if (!event?.markets || event.markets.length < 2) return null;
    const awayMarket = event.markets[1];
    return awayMarket?.ticker ? buttonPrices[awayMarket.ticker] : null;
  }, [buttonPrices, event?.markets]);

  const homeTickerPrice = useMemo(() => {
    if (!event?.markets || event.markets.length < 2) return null;
    const homeMarket = event.markets[0];
    return homeMarket?.ticker ? buttonPrices[homeMarket.ticker] : null;
  }, [buttonPrices, event?.markets]);

  // Calculate prices in cents for display - directly from prices WebSocket for faster updates
  const displayPctAway = useMemo(() => {
    if (awayTickerPrice !== null && awayTickerPrice !== undefined) {
      return Math.round(awayTickerPrice * 100);
    }
    return match.pctAway;
  }, [awayTickerPrice, match.pctAway]);

  const displayPctHome = useMemo(() => {
    if (homeTickerPrice !== null && homeTickerPrice !== undefined) {
      return Math.round(homeTickerPrice * 100);
    }
    return match.pctHome;
  }, [homeTickerPrice, match.pctHome]);

  const displayPriceAway = useMemo(() => {
    return formatPrice(displayPctAway / 100);
  }, [displayPctAway]);

  const displayPriceHome = useMemo(() => {
    return formatPrice(displayPctHome / 100);
  }, [displayPctHome]);

  return (
    <SafeAreaView style={styles.safe}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.topBarIcon}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Image
            source={require("../assets/images/ScoretradeBlack.png")}
            style={styles.logoImage}
            resizeMode="contain"
          />
        </View>

        <TouchableOpacity style={styles.topBarIcon}>
          <Ionicons name="share-outline" size={20} color={Colors.textPrimary} />
        </TouchableOpacity>
      </View>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
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

        {volume > 0 && (
          <Text
            style={{
              color: Colors.textTertiary,
              fontSize: 16,
              fontWeight: "500",
              marginBottom: 20,
            }}
          >
            Volume: {formatCurrency(volume)}
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
            realtimePrices={realtimePrices}
            colorBoost={isProFootball ? 0.3 : 0.22}
          />
        </View>

        <Orders event={event} />
        {/* About */}
        <View style={styles.about}>
          <Text style={styles.aboutTitle}>About</Text>
          <Text style={styles.aboutBody}>{match.about}</Text>
        </View>
      </ScrollView>

      {/* Bottom Bar - Buy Team Buttons */}
      <BuyButtons awayTeam={match.away} homeTeam={match.home} event={event} />
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
    paddingBottom: 100, // Extra padding for bottom bar
  },

  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: Spacing.md,
    paddingBottom: Spacing.lg,
    marginBottom: Spacing.lg,
    padding: 18,
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
    marginBottom: 16,
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
