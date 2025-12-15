import React, { useEffect, useRef } from "react";
import { View, Text, Image, StyleSheet, Animated } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Colors, Spacing, Typography } from "../../constants/theme";

/**
 * Normalize date string to ISO format
 */
function normalizeDateString(dateString) {
  if (!dateString) return null;

  // Handle format like "2025-11-23 18:00:00+00" by converting to ISO
  if (
    typeof dateString === "string" &&
    dateString.includes(" ") &&
    dateString.includes("+")
  ) {
    // Replace space with T and ensure Z or timezone is handled
    const normalized = dateString.replace(" ", "T");
    // If it ends with +00 or similar, replace with Z for UTC
    if (normalized.match(/\+00(:00)?$/)) {
      return normalized.replace(/\+00(:00)?$/, "Z");
    }
    return normalized;
  }

  return dateString;
}

/**
 * Format game date as "Dec 12"
 */
function formatGameDate(dateString) {
  if (!dateString) return "TBD";

  const normalizedDate = normalizeDateString(dateString);
  const date = new Date(normalizedDate);

  if (Number.isNaN(date.getTime())) return "TBD";

  // Use EST timezone
  const estOptions = {
    timeZone: "America/New_York",
    month: "short",
    day: "numeric",
  };

  return date.toLocaleDateString("en-US", estOptions);
}

/**
 * Format game time as "10:00 PM"
 */
function formatGameTime(dateString) {
  if (!dateString) return "TBD";

  const normalizedDate = normalizeDateString(dateString);
  const date = new Date(normalizedDate);

  if (Number.isNaN(date.getTime())) return "TBD";

  // Use EST timezone
  const estOptions = {
    timeZone: "America/New_York",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  };

  return date.toLocaleTimeString("en-US", estOptions);
}

export default function GameHeader({ market }) {
  if (!market) {
    return null;
  }

  // Animation refs for slide-in effect
  const awayTeamSlide = useRef(new Animated.Value(-100)).current;
  const homeTeamSlide = useRef(new Animated.Value(100)).current;

  // Start slide-in animation on mount
  useEffect(() => {
    Animated.parallel([
      Animated.timing(awayTeamSlide, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(homeTeamSlide, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, [awayTeamSlide, homeTeamSlide]);

  // Extract team data
  let awayTeamData = null;
  let homeTeamData = null;
  let awayAbbreviation = "AWAY";
  let homeAbbreviation = "HOME";
  let awayRecord = null;
  let homeRecord = null;

  // First, try to get from teams array (new API format)
  if (
    market?.teams &&
    Array.isArray(market.teams) &&
    market.teams.length >= 2
  ) {
    awayTeamData = market.teams[0];
    homeTeamData = market.teams[1];
    awayAbbreviation = awayTeamData.abbreviation?.toUpperCase() || "AWAY";
    homeAbbreviation = homeTeamData.abbreviation?.toUpperCase() || "HOME";
    awayRecord = awayTeamData.record;
    homeRecord = homeTeamData.record;
  }
  // Fallback to awayTeam/homeTeam objects
  else if (market?.awayTeam || market?.homeTeam) {
    awayTeamData = market.awayTeam;
    homeTeamData = market.homeTeam;
    awayAbbreviation = market.awayTeam?.abbreviation?.toUpperCase() || "AWAY";
    homeAbbreviation = market.homeTeam?.abbreviation?.toUpperCase() || "HOME";
    awayRecord = market.awayTeam?.record;
    homeRecord = market.homeTeam?.record;
  }

  // Get game time
  const gameTimeString =
    market?.gameTime ||
    market?.gameStartTime ||
    market?.date ||
    market?.eventDate;
  const gameDate = formatGameDate(gameTimeString);
  const gameTime = formatGameTime(gameTimeString);

  // Get broadcast network if available
  const network = market?.network || market?.broadcast || null;

  // Get spread/line if available
  const spread = market?.spread || market?.line || null;

  // Extract team colors
  const awayColor = awayTeamData?.color || Colors.primary;
  const homeColor = homeTeamData?.color || Colors.accentTeal;

  return (
    <View style={styles.container}>
      {/* Left gradient for away team */}
      <LinearGradient
        colors={[`${awayColor}33`, `${awayColor}00`]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={styles.leftGradient}
        pointerEvents="none"
      />

      {/* Right gradient for home team */}
      <LinearGradient
        colors={[`${homeColor}00`, `${homeColor}33`]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={styles.rightGradient}
        pointerEvents="none"
      />
      {/* Away Team - Left Side */}
      <Animated.View
        style={[
          styles.teamSection,
          {
            transform: [{ translateX: awayTeamSlide }],
          },
        ]}
      >
        {awayTeamData?.logo && (
          <Image
            source={{ uri: awayTeamData.logo }}
            style={styles.teamLogo}
            resizeMode="contain"
          />
        )}
        <View style={styles.teamInfo}>
          <Text style={styles.teamAbbreviation}>{awayAbbreviation}</Text>
          {awayRecord && <Text style={styles.teamRecord}>{awayRecord}</Text>}
        </View>
      </Animated.View>

      {/* Center - Game Info */}
      <View style={styles.centerSection}>
        <Text style={styles.gameDate}>{gameDate}</Text>
        <Text style={styles.gameTime}>{gameTime}</Text>
        <View style={styles.metaRow}>
          {network && (
            <View style={styles.networkBadge}>
              <Text style={styles.networkText}>{network}</Text>
            </View>
          )}
          {spread && (
            <View style={styles.spreadBadge}>
              <Text style={styles.spreadText}>{spread}</Text>
            </View>
          )}
        </View>
      </View>

      {/* Home Team - Right Side */}
      <Animated.View
        style={[
          styles.teamSection,
          styles.teamSectionRight,
          {
            transform: [{ translateX: homeTeamSlide }],
          },
        ]}
      >
        <View style={styles.teamInfo}>
          <Text style={styles.teamAbbreviation}>{homeAbbreviation}</Text>
          {homeRecord && <Text style={styles.teamRecord}>{homeRecord}</Text>}
        </View>
        {homeTeamData?.logo && (
          <Image
            source={{ uri: homeTeamData.logo }}
            style={styles.teamLogo}
            resizeMode="contain"
          />
        )}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    marginHorizontal: -Spacing.xl, // Break out of ScreenTemplate padding
    marginTop: -100, // Extend upward to cover navigation header
    paddingTop: 100 + Spacing.sm, // Add padding to compensate
    position: "relative",
    overflow: "visible",
  },
  leftGradient: {
    position: "absolute",
    left: 0,
    top: -100, // Extend upward to cover navigation header
    bottom: 0,
    width: 150,
    zIndex: 0,
  },
  rightGradient: {
    position: "absolute",
    right: 0,
    top: -100, // Extend upward to cover navigation header
    bottom: 0,
    width: 150,
    zIndex: 0,
  },
  teamSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 15,
    flex: 1,
    zIndex: 1,
  },
  teamSectionRight: {
    justifyContent: "flex-end",
  },
  teamLogo: {
    width: 42,
    height: 42,
    borderRadius: 22,
    backgroundColor: Colors.background,
  },
  teamInfo: {
    alignItems: "center",
  },
  teamAbbreviation: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.textPrimary,
    letterSpacing: 0.5,
  },
  teamRecord: {
    fontSize: 11,
    fontWeight: "500",
    color: Colors.textSecondary,
    marginTop: 1,
  },
  centerSection: {
    alignItems: "center",
    paddingHorizontal: Spacing.sm,
    minWidth: 100,
    zIndex: 1,
  },
  gameDate: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.textPrimary,
    marginBottom: 1,
  },
  gameTime: {
    fontSize: 12,
    fontWeight: "500",
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    flexWrap: "wrap",
    justifyContent: "center",
  },
  networkBadge: {
    backgroundColor: Colors.background,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  networkText: {
    fontSize: 9,
    fontWeight: "700",
    color: Colors.textSecondary,
    letterSpacing: 0.5,
  },
  spreadBadge: {
    backgroundColor: Colors.background,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  spreadText: {
    fontSize: 9,
    fontWeight: "700",
    color: Colors.textSecondary,
  },
});
