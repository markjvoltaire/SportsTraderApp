import { StyleSheet, Text, View } from "react-native";
import React, { useEffect, useRef, useState } from "react";
import { Typography } from "../../constants/theme";
import { Colors } from "../../constants/theme";
import { Spacing } from "../../constants/theme";
import { formatSharePrice } from "../../utils/formatters";

const WEBSOCKET_URL = "wss://dev-prediction-markets-api.dflow.net/api/v1/ws";

export default function Orders({ event }) {
  const wsRef = useRef(null);
  const [trades, setTrades] = useState([]);
  const [orderbookData, setOrderbookData] = useState({});

  // Get the game winner market ticker for each side
  const marketTicker1 = event?.markets?.[0]?.ticker || null;
  const marketTicker2 = event?.markets?.[1]?.ticker || null;

  // Put tickers in an array for WebSocket subscription
  const marketTickers = [marketTicker1, marketTicker2].filter(Boolean);

  useEffect(() => {
    const ws = new WebSocket(WEBSOCKET_URL);

    ws.onopen = () => {
      console.log("Connected to WebSocket");

      // Subscribe to all trade updates
      ws.send(
        JSON.stringify({
          type: "subscribe",
          channel: "trades",
          tickers: marketTickers,
        })
      );

      // Subscribe to orderbook updates
      if (marketTickers.length > 0) {
        ws.send(
          JSON.stringify({
            type: "subscribe",
            channel: "orderbook",
            tickers: marketTickers,
          })
        );
      }
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

        // Add trade to state (prepend to show newest first)
        setTrades((prevTrades) => {
          return [tradeData, ...prevTrades].slice(0, 50);
        });
      } else if (message.channel === "orderbook") {
        // Handle orderbook updates
        const orderbookUpdate = {
          market_ticker: message.market_ticker,
          yes_bids: message.yes_bids || {},
          no_bids: message.no_bids || {},
          timestamp: Date.now(),
        };

        // Store orderbook data by ticker
        setOrderbookData((prevData) => ({
          ...prevData,
          [message.market_ticker]: orderbookUpdate,
        }));
      }
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", {
        readyState: ws.readyState,
        url: ws.url,
        errorType: error?.type,
        message: error?.message || "Connection failed",
      });
    };

    ws.onclose = (event) => {
      console.log("WebSocket connection closed:", {
        code: event.code,
        reason: event.reason,
        wasClean: event.wasClean,
        readyState: ws.readyState,
      });
    };

    wsRef.current = ws;

    // Cleanup function
    return () => {
      if (wsRef.current) {
        const wsToClose = wsRef.current;
        
        // Remove event handlers to prevent memory leaks
        wsToClose.onopen = null;
        wsToClose.onmessage = null;
        wsToClose.onerror = null;
        wsToClose.onclose = null;
        
        // Unsubscribe from both channels before closing if connection is open
        if (marketTickers.length > 0 && wsToClose.readyState === WebSocket.OPEN) {
          try {
            // Unsubscribe from trades
            wsToClose.send(
              JSON.stringify({
                type: "unsubscribe",
                channel: "trades",
                tickers: marketTickers,
              })
            );
            // Unsubscribe from orderbook
            wsToClose.send(
              JSON.stringify({
                type: "unsubscribe",
                channel: "orderbook",
                tickers: marketTickers,
              })
            );
          } catch (error) {
            console.error("Error unsubscribing from channels:", error);
          }
        }
        
        // Close the connection
        if (wsToClose.readyState === WebSocket.OPEN || wsToClose.readyState === WebSocket.CONNECTING) {
          wsToClose.close();
        }
        
        wsRef.current = null;
      }
    };
  }, [marketTickers.join(",")]);

  const TradeRow = ({ trade }) => {
    // Calculate amount spent in dollars (price per share × number of shares)
    const pricePerShare = parseFloat(
      trade.side === "yes" ? trade.yesPrice : trade.noPrice
    );
    const amountSpent = pricePerShare * parseInt(trade.count);

    // Extract suffix from ticker (e.g., "KXNFLGAME-26JAN11LACNE-LAC" -> "LAC")
    const tickerSuffix = trade.ticker?.split("-").pop() || trade.ticker;

    return (
      <View style={styles.tradeRow}>
        <View style={styles.tradeLeft}>
          <Text style={styles.tradeTicker}>{tickerSuffix}</Text>
          <Text style={styles.tradeSide}>{trade.count} shares</Text>
        </View>
        <View style={styles.tradeRight}>
          <Text style={styles.tradePrice}>{formatSharePrice(amountSpent)}</Text>
        </View>
      </View>
    );
  };

  // Filter out "no" trades and show exactly 3 "yes" trades at a time, newest at top
  const yesTrades = trades.filter((trade) => trade.side === "yes");
  const displayedTrades = yesTrades.slice(0, 3);

  // Don't render anything if there are no trades
  if (displayedTrades.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Recent Trades</Text>
      <View style={styles.tradesList}>
        {displayedTrades.map((trade, index) => (
          <TradeRow
            key={`${trade.tradeId}-${trade.time}-${index}`}
            trade={trade}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "black",
    borderColor: "white",
    marginBottom: Spacing.xxl,
    marginTop: Spacing.lg,
  },
  title: {
    fontWeight: "700",
    fontSize: 16,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  tradesList: {
    backgroundColor: "black",
  },
  tradesListContent: {
    paddingBottom: Spacing.sm,
  },
  tradeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    minHeight: 60,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  tradeLeft: {
    flex: 1,
    justifyContent: "center",
  },
  tradeTicker: {
    ...Typography.body,
    fontSize: 14,
    fontWeight: "900",
    color: Colors.textPrimary,
    marginBottom: 2,
    lineHeight: 18, // Fixed line height to prevent overlap
  },
  tradeSide: {
    ...Typography.caption,
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 16, // Fixed line height to prevent overlap
  },
  tradeRight: {
    alignItems: "flex-end",
  },
  tradePrice: {
    ...Typography.body,
    fontSize: 14,
    fontWeight: "600",
    color: Colors.primary,
    marginBottom: 2,
  },
  tradeTime: {
    ...Typography.caption,
    fontSize: 11,
    color: Colors.textTertiary,
  },
  emptyText: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: "center",
    paddingVertical: Spacing.lg,
  },
});
