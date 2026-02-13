import React, { useState, useMemo, useEffect, useRef } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  useColorScheme,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Spacing } from "../../constants/theme";
import { formatPrice } from "../../utils/formatters";
import API_BASE_URL from "../../config/api";

const WEBSOCKET_URL = "wss://dev-prediction-markets-api.dflow.net/api/v1/ws";

export default function BuyButtons({
  awayTeam,
  homeTeam,
  event,
  onSideSelect,
}) {
  const isDarkMode = useColorScheme() !== "light";
  const theme = useMemo(
    () =>
      isDarkMode
        ? {
            background: "#000000",
            borderTop: "rgba(255, 255, 255, 0.1)",
            selectionBorder: "#FFFFFF",
            buttonText: "#FFFFFF",
          }
        : {
            background: "#F5F7FB",
            borderTop: "rgba(17, 24, 39, 0.15)",
            selectionBorder: "#111827",
            buttonText: "#FFFFFF",
          },
    [isDarkMode]
  );
  const styles = useMemo(() => createStyles(theme), [theme]);

  const [selectedSide, setSelectedSide] = useState(null);
  const wsRef = useRef(null);
  const [realtimePrices, setRealtimePrices] = useState({});
  const [loadingPrices, setLoadingPrices] = useState(true);

  // Extract tickers and yes prices from event markets
  const {
    awayTicker,
    homeTicker,
    awayYesBid,
    awayYesAsk,
    homeYesBid,
    homeYesAsk,
  } = useMemo(() => {
    if (!event?.markets || event.markets.length < 2) {
      return {
        awayTicker: null,
        homeTicker: null,
        awayYesBid: null,
        awayYesAsk: null,
        homeYesBid: null,
        homeYesAsk: null,
      };
    }

    // event.markets[0] is home team, event.markets[1] is away team
    const homeMarket = event.markets[0];
    const awayMarket = event.markets[1];

    return {
      awayTicker: awayMarket?.ticker || null,
      homeTicker: homeMarket?.ticker || null,
      awayYesBid: awayMarket?.yesBid || null,
      awayYesAsk: awayMarket?.yesAsk || null,
      homeYesBid: homeMarket?.yesBid || null,
      homeYesAsk: homeMarket?.yesAsk || null,
    };
  }, [event?.markets]);

  // Get real-time prices for display
  const awayPrice = useMemo(() => {
    if (awayTicker && realtimePrices[awayTicker] !== undefined) {
      return realtimePrices[awayTicker];
    }
    // Fallback to yesBid if available
    if (awayYesBid) return parseFloat(awayYesBid);
    return null;
  }, [awayTicker, realtimePrices, awayYesBid]);

  const homePrice = useMemo(() => {
    if (homeTicker && realtimePrices[homeTicker] !== undefined) {
      return realtimePrices[homeTicker];
    }
    // Fallback to yesBid if available
    if (homeYesBid) return parseFloat(homeYesBid);
    return null;
  }, [homeTicker, realtimePrices, homeYesBid]);

  // Format prices for display
  const displayAwayPrice = useMemo(() => {
    if (awayPrice !== null && awayPrice !== undefined) {
      return formatPrice(awayPrice);
    }
    return "TBD";
  }, [awayPrice]);

  const displayHomePrice = useMemo(() => {
    if (homePrice !== null && homePrice !== undefined) {
      return formatPrice(homePrice);
    }
    return "TBD";
  }, [homePrice]);

  // Fetch initial prices from batch API
  useEffect(() => {
    const marketTickers = [];
    if (awayTicker) marketTickers.push(awayTicker);
    if (homeTicker) marketTickers.push(homeTicker);

    if (marketTickers.length === 0) return;

    const fetchInitialPrices = async () => {
      try {
        setLoadingPrices(true);
        const response = await fetch(
          `${API_BASE_URL}/api/v1/markets/batch`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              tickers: marketTickers,
            }),
          }
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log("Batch API response:", data);

        // Process the response and set initial prices
        // Assuming the response is an array of market objects with ticker and prices
        if (Array.isArray(data)) {
          const initialPrices = {};
          data.forEach((market) => {
            if (market.ticker && (market.yes_bid || market.yes_ask)) {
              const calculateMidPrice = (bid, ask) => {
                if (!bid && !ask) return null;
                if (!bid) return parseFloat(ask);
                if (!ask) return parseFloat(bid);
                return (parseFloat(bid) + parseFloat(ask)) / 2;
              };
              const midPrice = calculateMidPrice(
                market.yes_bid,
                market.yes_ask
              );
              if (midPrice !== null) {
                initialPrices[market.ticker] = midPrice;
              }
            }
          });

          if (Object.keys(initialPrices).length > 0) {
            // Set initial prices from fetch response
            setRealtimePrices(initialPrices);
          }
        }
      } catch (error) {
        console.error("Error fetching initial prices:", error);
      } finally {
        setLoadingPrices(false);
      }
    };

    fetchInitialPrices();
  }, [awayTicker, homeTicker]);

  // WebSocket connection for prices
  useEffect(() => {
    const marketTickers = [];
    if (awayTicker) marketTickers.push(awayTicker);
    if (homeTicker) marketTickers.push(homeTicker);

    if (marketTickers.length === 0) return;

    const ws = new WebSocket(WEBSOCKET_URL);

    ws.onopen = () => {
      console.log("Connected to WebSocket");

      // Subscribe to specific tickers for prices
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
          setRealtimePrices((prev) => ({
            ...prev,
            [message.market_ticker]: midPrice,
          }));
        }
      }
    };

    ws.onerror = (error) => {
      console.error("BuyButtons WebSocket error:", error);
    };

    ws.onclose = (event) => {
      console.log("BuyButtons WebSocket connection closed:", event.code);
    };

    wsRef.current = ws;

    // Cleanup function
    return () => {
      if (wsRef.current) {
        const wsToClose = wsRef.current;
        wsToClose.onopen = null;
        wsToClose.onmessage = null;
        wsToClose.onerror = null;
        wsToClose.onclose = null;
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
        if (
          wsToClose.readyState === WebSocket.OPEN ||
          wsToClose.readyState === WebSocket.CONNECTING
        ) {
          wsToClose.close();
        }
        wsRef.current = null;
      }
    };
  }, [awayTicker, homeTicker]);

  const handleSideSelect = (side) => {
    setSelectedSide(side);
    if (onSideSelect) {
      onSideSelect(side);
    }
  };

  return (
    <SafeAreaView edges={["bottom"]} style={styles.container}>
      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={[
            styles.button,
            { backgroundColor: awayTeam.color },
            selectedSide === "away" && styles.buttonSelected,
          ]}
          onPress={() => handleSideSelect("away")}
        >
          <Text style={styles.buttonText}>
            Buy {awayTeam.code} {displayAwayPrice}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.button,
            { backgroundColor: homeTeam.color },
            selectedSide === "home" && styles.buttonSelected,
          ]}
          onPress={() => handleSideSelect("home")}
        >
          <Text style={styles.buttonText}>
            Buy {homeTeam.code} {displayHomePrice}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const createStyles = (theme) =>
  StyleSheet.create({
  container: {
    backgroundColor: theme.background,
    borderTopWidth: 1,
    borderTopColor: theme.borderTop,
  },
  buttonRow: {
    flexDirection: "row",
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: theme.background,
  },
  button: {
    flex: 1,
    borderRadius: 30,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonSelected: {
    borderWidth: 3,
    borderColor: theme.selectionBorder,
  },
  buttonText: {
    fontSize: 15,
    fontWeight: "800",
    color: theme.buttonText,
    letterSpacing: 0.2,
  },
});
