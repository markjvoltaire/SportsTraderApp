import { StyleSheet, Text, View, ActivityIndicator } from "react-native";
import React, { useEffect, useState, useMemo } from "react";
import API_BASE_URL from "../../config/api";
import { Spacing, Typography, BorderRadius } from "../../constants/theme";
import { formatPrice } from "../../utils/formatters";

/**
 * Convert API orderbook (price -> size object or array) to sorted rows for display.
 * @param {Object|Array} bids - yes_bids from API (e.g. { "0.52": "100" } or [{ price, size }])
 * @param {Object|Array} asks - yes_asks from API
 * @returns {{ bids: Array<{price: number, size: number}>, asks: Array<{price: number, size: number}> }}
 */
function orderbookToRows(bids, asks) {
  const toArray = (obj) => {
    if (Array.isArray(obj)) {
      return obj.map((o) => ({
        price: parseFloat(o.price ?? o.price_per_share ?? 0),
        size: parseFloat(o.size ?? o.amount ?? 0),
      }));
    }
    if (obj && typeof obj === 'object') {
      return Object.entries(obj).map(([price, size]) => ({
        price: parseFloat(price),
        size: typeof size === 'string' ? parseFloat(size) : Number(size) || 0,
      }));
    }
    return [];
  };
  const bidArr = toArray(bids || {}).sort((a, b) => b.price - a.price);
  const askArr = toArray(asks || {}).sort((a, b) => a.price - b.price);
  return { bids: bidArr, asks: askArr };
}

const MAX_ROWS = 8;

function formatSize(value) {
  if (!Number.isFinite(value)) return "—";
  return value >= 1000 ? Math.round(value).toLocaleString() : value.toFixed(2);
}

export default function Orderbook({ tickers = [], labels = [] }) {
  const [orderbooks, setOrderbooks] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const validTickers = Array.isArray(tickers) ? tickers.filter(Boolean) : [];
  const hasTickers = validTickers.length >= 1;
  const tickersKey = validTickers.join(",");

  useEffect(() => {
    if (!hasTickers) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    const abort = new AbortController();
    Promise.all(
      validTickers.map((ticker) =>
        fetch(`${API_BASE_URL}/api/orderbook/${encodeURIComponent(ticker)}`, {
          signal: abort.signal,
        }).then((r) => {
          if (!r.ok) throw new Error(`Orderbook ${ticker}: ${r.status}`);
          return r.json();
        })
      )
    )
      .then((results) => {
        const next = {};
        validTickers.forEach((ticker, i) => {
          next[ticker] = results[i] || {};
        });
        setOrderbooks(next);
      })
      .catch((err) => {
        if (err.name !== "AbortError") {
          setError(err.message || "Failed to load orderbook");
        }
      })
      .finally(() => setLoading(false));
    return () => abort.abort();
  }, [hasTickers, tickersKey]);

  const rowsByTicker = useMemo(() => {
    const out = {};
    Object.entries(orderbooks).forEach(([ticker, ob]) => {
      const yesBids = ob.yes_bids ?? ob.bids;
      const yesAsks = ob.yes_asks ?? ob.asks;
      out[ticker] = orderbookToRows(yesBids, yesAsks);
    });
    return out;
  }, [orderbooks]);

  if (!hasTickers) return null;

  if (loading) {
    return (
      <View style={styles.wrapper}>
        <Text style={styles.title}>Orderbook</Text>
        <View style={styles.loadingBox}>
          <ActivityIndicator size="small" color="rgba(255,255,255,0.75)" />
          <Text style={styles.loadingText}>Loading…</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.wrapper}>
        <Text style={styles.title}>Orderbook</Text>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.wrapper}>
      <View style={styles.header}>
        <Text style={styles.title}>Orderbook</Text>
        <View style={styles.legendRow}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, styles.bidDot]} />
            <Text style={styles.legendText}>Bids</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, styles.askDot]} />
            <Text style={styles.legendText}>Asks</Text>
          </View>
        </View>
      </View>

      <View style={styles.tablesRow}>
        {validTickers.map((ticker, index) => {
          const { bids, asks } = rowsByTicker[ticker] || { bids: [], asks: [] };
          const label =
            labels[index] ?? ticker.split("-").pop() ?? `Market ${index + 1}`;
          const bidRows = bids.slice(0, MAX_ROWS);
          const askRows = asks.slice(0, MAX_ROWS);

          return (
            <View key={ticker} style={styles.tableCard}>
              <View style={styles.tableTop}>
                <Text style={styles.tableLabel}>{label}</Text>
                <Text style={styles.depthText}>{bidRows.length + askRows.length} levels</Text>
              </View>

              <View style={styles.bookGrid}>
                <View style={styles.bookColumn}>
                  <Text style={[styles.sideTitle, styles.bidTitle]}>Bids</Text>
                  <View style={styles.columnHeader}>
                    <Text style={styles.headerCell}>Price</Text>
                    <Text style={styles.headerCell}>Size</Text>
                  </View>
                  {bidRows.length === 0 ? (
                    <Text style={styles.emptyCell}>No bids</Text>
                  ) : (
                    bidRows.map((row, i) => (
                      <View key={`b-${i}`} style={styles.row}>
                        <Text style={[styles.cell, styles.bidPrice]}>
                          {formatPrice(row.price)}
                        </Text>
                        <Text style={styles.cell}>{formatSize(row.size)}</Text>
                      </View>
                    ))
                  )}
                </View>

                <View style={styles.verticalDivider} />

                <View style={styles.bookColumn}>
                  <Text style={[styles.sideTitle, styles.askTitle]}>Asks</Text>
                  <View style={styles.columnHeader}>
                    <Text style={styles.headerCell}>Price</Text>
                    <Text style={styles.headerCell}>Size</Text>
                  </View>
                  {askRows.length === 0 ? (
                    <Text style={styles.emptyCell}>No asks</Text>
                  ) : (
                    askRows.map((row, i) => (
                      <View key={`a-${i}`} style={styles.row}>
                        <Text style={[styles.cell, styles.askPrice]}>
                          {formatPrice(row.price)}
                        </Text>
                        <Text style={styles.cell}>{formatSize(row.size)}</Text>
                      </View>
                    ))
                  )}
                </View>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginTop: Spacing.lg,
    paddingVertical: Spacing.sm,
    paddingHorizontal: 2,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.sm,
  },
  title: {
    ...Typography.body,
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  legendRow: {
    flexDirection: "row",
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: Spacing.md,
  },
  legendDot: {
    width: 7,
    height: 7,
    borderRadius: 99,
    marginRight: 6,
  },
  bidDot: {
    backgroundColor: "#22C55E",
  },
  askDot: {
    backgroundColor: "#EF4444",
  },
  legendText: {
    ...Typography.caption,
    color: "rgba(255,255,255,0.6)",
    fontSize: 11,
    fontWeight: "600",
  },
  loadingBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: Spacing.md,
  },
  loadingText: {
    fontSize: 14,
    color: "rgba(255,255,255,0.65)",
  },
  errorText: {
    fontSize: 14,
    color: "rgba(255,255,255,0.65)",
  },
  tablesRow: {
    gap: Spacing.md,
  },
  tableCard: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    padding: Spacing.sm,
  },
  tableTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.sm,
  },
  tableLabel: {
    ...Typography.caption,
    fontSize: 13,
    fontWeight: "700",
    color: "rgba(255,255,255,0.95)",
  },
  depthText: {
    ...Typography.caption,
    fontSize: 11,
    color: "rgba(255,255,255,0.55)",
  },
  bookGrid: {
    flexDirection: "row",
    alignItems: "stretch",
  },
  bookColumn: {
    flex: 1,
  },
  verticalDivider: {
    width: 1,
    backgroundColor: "rgba(255,255,255,0.08)",
    marginHorizontal: Spacing.sm,
  },
  sideTitle: {
    ...Typography.caption,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.3,
    marginBottom: 6,
  },
  bidTitle: {
    color: "#22C55E",
  },
  askTitle: {
    color: "#EF4444",
  },
  columnHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.1)",
    paddingBottom: 6,
    marginBottom: 4,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
  },
  headerCell: {
    ...Typography.caption,
    fontSize: 11,
    fontWeight: "600",
    color: "rgba(255,255,255,0.5)",
  },
  cell: {
    fontSize: 12,
    color: "rgba(255,255,255,0.88)",
    fontVariant: ["tabular-nums"],
  },
  bidPrice: {
    color: "#22C55E",
  },
  askPrice: {
    color: "#EF4444",
  },
  emptyCell: {
    fontSize: 12,
    color: "rgba(255,255,255,0.4)",
    paddingVertical: 6,
  },
});
