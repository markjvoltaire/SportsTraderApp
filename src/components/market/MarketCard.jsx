import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Animated,
} from "react-native";
import React, { useEffect, useRef, useMemo } from "react";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import {
  Colors,
  Spacing,
  Typography,
  BorderRadius,
} from "../../../constants/theme";

const normalizeMarket = (market) => {
  if (!market) return null;

  let outcomes = [];
  let prices = [];
  let clobIds = [null, null];

  try {
    outcomes = JSON.parse(market.outcomes || "[]");
  } catch {
    outcomes = market.outcomeNames || [];
  }

  try {
    prices = JSON.parse(market.outcomePrices || "[]");
  } catch {}

  try {
    const parsed = JSON.parse(market.clobTokenIds || "[]");
    clobIds = [parsed?.[0]?.toString(), parsed?.[1]?.toString()];
  } catch {}

  const awayTeam = market?.teams?.[0] || market.awayTeam;
  const homeTeam = market?.teams?.[1] || market.homeTeam;

  return {
    id: market.id || market.conditionId,
    title: market.question || market.title || "Market",
    description: market.description,
    sportsMarketType: market.sportsMarketType,
    awayTeam: {
      name: awayTeam?.name || outcomes[0] || "Away",
      abbreviation: awayTeam?.abbreviation || extractAbbreviation(outcomes[0]),
      record: awayTeam?.record || null,
      price: prices[0] ? parseFloat(prices[0]) : null,
      clobTokenId: clobIds[0],
      color: awayTeam?.color || "#4CAF50",
    },
    homeTeam: {
      name: homeTeam?.name || outcomes[1] || "Home",
      abbreviation: homeTeam?.abbreviation || extractAbbreviation(outcomes[1]),
      record: homeTeam?.record || null,
      price: prices[1] ? parseFloat(prices[1]) : null,
      clobTokenId: clobIds[1],
      color: homeTeam?.color || "#2196F3",
    },
    volume: market.volume24hr || market.volume || 0,
    gameStartTime: market.gameStartTime || market.gameTime || market.date,
    raw: market,
  };
};

const extractAbbreviation = (name) => {
  if (!name) return null;
  const words = name.split(/\s+/);
  if (words.length > 1) {
    return words
      .map((w) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 3);
  }
  return name.substring(0, 3).toUpperCase();
};

const formatPrice = (price) => {
  if (!price) return "—";
  const percentage = (price * 100).toFixed(0);
  return `${percentage}¢`;
};

const formatVolume = (volume) => {
  // Handle undefined, null, or non-numeric values
  const numVolume = parseFloat(volume);
  if (!numVolume || isNaN(numVolume) || numVolume === 0) return "$0";

  if (numVolume >= 1000000) {
    return `${(numVolume / 1000000).toFixed(1)}M`;
  }
  if (numVolume >= 1000) {
    return `${(numVolume / 1000).toFixed(1)}K`;
  }
  return `${numVolume.toFixed(0)}`;
};

export default function MarketCard({ market: rawMarket, index = 0 }) {
  const navigation = useNavigation();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    const delay = index * 50;

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        delay: delay,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        delay: delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const market = useMemo(() => {
    if (!rawMarket) return null;
    const items = Array.isArray(rawMarket)
      ? rawMarket
      : rawMarket.markets || [rawMarket];

    const moneyline = items.find((m) => m?.sportsMarketType === "moneyline");

    return moneyline ? normalizeMarket(moneyline) : null;
  }, [rawMarket]);

  if (!market) {
    return null;
  }

  const marketInfo = useMemo(() => {
    try {
      let gameTime = null;

      if (market.gameStartTime) {
        try {
          const date = new Date(
            market.gameStartTime.replace("+00", "Z") || market.gameStartTime
          );
          gameTime = date.toLocaleString("en-US", {
            month: "short",
            day: "numeric",
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
          });
        } catch (error) {
          console.warn("Failed to parse game time:", error);
        }
      }

      if (!gameTime && market.description) {
        try {
          const scheduleMatch = market.description.match(
            /scheduled for ([^:]+):/
          );
          if (scheduleMatch) {
            const dateTimeStr = scheduleMatch[1].trim();
            const dateMatch = dateTimeStr.match(
              /([A-Za-z]+) (\d+) at (\d+):(\d+)(AM|PM) ET/
            );
            if (dateMatch) {
              const [, month, day, hour, minute, ampm] = dateMatch;
              const currentYear = new Date().getFullYear();
              const parseableDateStr = `${month} ${day}, ${currentYear} ${hour}:${minute} ${ampm}`;
              const date = new Date(parseableDateStr);
              if (!isNaN(date.getTime())) {
                gameTime = date.toLocaleString("en-US", {
                  month: "short",
                  day: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                  hour12: true,
                });
              }
            }
          }
        } catch (error) {
          console.warn("Failed to parse game time from description:", error);
        }
      }

      return {
        id: market.id,
        title: market.title,
        awayTeam: {
          name: market.awayTeam.name,
          abbreviation: market.awayTeam.abbreviation,
          price: market.awayTeam.price,
          color: market.awayTeam.color,
        },
        homeTeam: {
          name: market.homeTeam.name,
          abbreviation: market.homeTeam.abbreviation,
          price: market.homeTeam.price,
          color: market.homeTeam.color,
        },
        gameTime,
        volume: market.volume,
        description: market.description,
      };
    } catch (error) {
      console.warn("Failed to parse market data:", error);
      return {
        id: market?.id || "unknown",
        title: market?.title || "Market",
        awayTeam: {
          name: "Away",
          abbreviation: null,
          price: null,
          color: "#4CAF50",
        },
        homeTeam: {
          name: "Home",
          abbreviation: null,
          price: null,
          color: "#2196F3",
        },
        gameTime: null,
        volume: 0,
        description: null,
      };
    }
  }, [market]);

  const handlePress = () => {
    navigation.navigate("MarketDetail", {
      market: market,
    });
  };

  return (
    <Animated.View
      style={{
        opacity: fadeAnim,
        transform: [{ translateY: slideAnim }],
      }}
    >
      <TouchableOpacity
        style={styles.card}
        onPress={handlePress}
        activeOpacity={0.7}
      >
        {/* Header with game time and volume */}
        <View style={styles.header}>
          <View style={styles.metaRow}>
            {marketInfo.gameTime && (
              <View style={styles.timeContainer}>
                <Ionicons
                  name="time-outline"
                  size={12}
                  color={Colors.textSecondary}
                  style={styles.icon}
                />
                <Text style={styles.gameTime}>{marketInfo.gameTime}</Text>
              </View>
            )}
            <View style={styles.volumeContainer}>
              <Ionicons
                name="pulse-outline"
                size={12}
                color={Colors.textSecondary}
                style={styles.icon}
              />
              <Text style={styles.volume}>
                {formatVolume(marketInfo.volume)}
              </Text>
            </View>
          </View>
        </View>

        {/* Main matchup display */}
        <View style={styles.matchupContainer}>
          {/* Away Team */}
          <View style={styles.teamSection}>
            <View style={styles.teamInfo}>
              {marketInfo.awayTeam.abbreviation && (
                <View
                  style={[
                    styles.teamBadge,
                    { backgroundColor: `${marketInfo.awayTeam.color}20` },
                  ]}
                >
                  <Text
                    style={[
                      styles.teamAbbr,
                      { color: marketInfo.awayTeam.color },
                    ]}
                  >
                    {marketInfo.awayTeam.abbreviation}
                  </Text>
                </View>
              )}
              <Text style={styles.teamName} numberOfLines={1}>
                {marketInfo.awayTeam.name}
              </Text>
            </View>
            <View style={styles.priceContainer}>
              <Text style={styles.price}>
                {formatPrice(marketInfo.awayTeam.price)}
              </Text>
            </View>
          </View>

          {/* VS Divider */}
          <View style={styles.divider}>
            <Text style={styles.vsText}>VS</Text>
          </View>

          {/* Home Team */}
          <View style={styles.teamSection}>
            <View style={styles.teamInfo}>
              {marketInfo.homeTeam.abbreviation && (
                <View
                  style={[
                    styles.teamBadge,
                    { backgroundColor: `${marketInfo.homeTeam.color}20` },
                  ]}
                >
                  <Text
                    style={[
                      styles.teamAbbr,
                      { color: marketInfo.homeTeam.color },
                    ]}
                  >
                    {marketInfo.homeTeam.abbreviation}
                  </Text>
                </View>
              )}
              <Text style={styles.teamName} numberOfLines={1}>
                {marketInfo.homeTeam.name}
              </Text>
            </View>
            <View style={styles.priceContainer}>
              <Text style={styles.price}>
                {formatPrice(marketInfo.homeTeam.price)}
              </Text>
            </View>
          </View>
        </View>

        {/* Footer indicator */}
        <View style={styles.footer}>
          <Ionicons
            name="chevron-forward"
            size={16}
            color={Colors.textSecondary}
          />
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  header: {
    marginBottom: Spacing.md,
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  timeContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  volumeContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  icon: {
    marginRight: 4,
  },
  gameTime: {
    ...Typography.caption,
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: "500",
  },
  volume: {
    ...Typography.caption,
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: "500",
  },
  matchupContainer: {
    gap: Spacing.sm,
  },
  teamSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: Spacing.sm,
  },
  teamInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: Spacing.sm,
  },
  teamBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  teamAbbr: {
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  teamName: {
    ...Typography.body,
    fontSize: 16,
    fontWeight: "600",
    color: Colors.textPrimary,
    flex: 1,
  },
  priceContainer: {
    backgroundColor: Colors.background,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
    minWidth: 60,
    alignItems: "center",
  },
  price: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.primary,
  },
  divider: {
    alignItems: "center",
    paddingVertical: Spacing.xs,
  },
  vsText: {
    ...Typography.caption,
    fontSize: 11,
    fontWeight: "600",
    color: Colors.textSecondary,
    letterSpacing: 1,
  },
  footer: {
    alignItems: "flex-end",
    marginTop: Spacing.xs,
  },
});
