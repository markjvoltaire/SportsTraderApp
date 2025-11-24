import React, { useState, useMemo } from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import ScreenTemplate from "./ScreenTemplate";
import { useRoute } from "@react-navigation/native";
import MarketRules from "../src/components/market/MarketRules";
import MyChart from "../src/components/market/MyChart";
import ButtonRow from "../src/components/market/ButtonRow";
import { Spacing } from "../src/constants/theme";

export default function MarketsScreen() {
  const route = useRoute();
  const market = route.params?.game || route.params?.market;

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

  // Extract description - use current timestamp if available, otherwise use game date
  const marketDescription = useMemo(() => {
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

  return (
    <View style={styles.container}>
      <ScreenTemplate title={marketTitle} description={marketDescription}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.chartContainerWrapper}>
            <MyChart onTimestampChange={setCurrentTimestamp} />
          </View>

          <MarketRules market={market} />
        </ScrollView>
      </ScreenTemplate>
      <View
        style={[
          styles.buttonContainer,
          {
            top: 688 + insets.bottom + Spacing.md, // Tab bar height (72) + safe area bottom + padding
          },
        ]}
        pointerEvents="box-none"
      >
        <ButtonRow market={market} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 200, // Space for buttons at bottom
  },
  chartContainerWrapper: {},
  buttonContainer: {
    position: "absolute",
    left: 0,
    right: 0,
    backgroundColor: "white",
    width: "100%",
    paddingHorizontal: Spacing.xl, // Match ScreenTemplate padding
    zIndex: 1000, // Ensure it's above other content
    elevation: 10, // For Android shadow/elevation
  },
});
