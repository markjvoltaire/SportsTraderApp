import React, {
  useEffect,
  useMemo,
  useState,
  useRef,
  useCallback,
} from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  Image,
  Animated,
  RefreshControl,
  Linking,
  useColorScheme,
  InteractionManager,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// Custom Constants & Components

import GameCard from "../src/components/market/GameCard";
import EventCard from "../src/components/market/EventCard";
import Trending from "../src/components/trending/Trending";
import LottieView from "lottie-react-native";
import Ticker from "../src/components/ui/Ticker";
import API_BASE_URL from "../src/config/api";

const { width } = Dimensions.get("window");

const COMPETITION_TO_SLUG = {
  "Pro Football": "nfl",
  "Pro Baseball": "mlb",
  "Pro Basketball (M)": "nba",
  "Pro Hockey": "nhl",
  "College Basketball (M)": "ncaamb",
  "College Basketball (W)": "ncaawb",
  "College Football": "ncaaf",
  EPL: "epl",
  "La Liga": "laliga",
  "Serie A": "seriea",
  UCL: "ucl",
  Bundesliga: "bundesliga",
  "Ligue 1": "ligue1",
  Eredivisie: "eredivisie",
  AFCON: "afcon",
  "EFL Championship": "efl-championship",
  "Scottish Premiership": "scottish-prem",
  "Saudi Pro League": "saudi-pl",
  "Liga Portugal": "liga-portugal",
  "FA Cup": "fa-cup",
  "Liga MX": "liga-mx",
  "Brasileiro Serie A": "brasileiro",
  "Australian A League": "a-league",
  "Taca de Portugal": "taca-portugal",
  UFC: "MMA",
  Boxing: "boxing",
};

export default function HomeScreen() {
  const isDarkMode = useColorScheme() !== "light";
  const theme = isDarkMode ? DARK_THEME : LIGHT_THEME;
  const styles = useMemo(() => createStyles(theme), [theme]);

  const [sportsFilters, setSportsFilters] = useState(null);
  const [selectedCompetition, setSelectedCompetition] = useState("Trending");
  const [selectedScope, setSelectedScope] = useState("Games");
  const [eventsData, setEventsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const isDataBackedScope = useMemo(
    () =>
      selectedCompetition === "Pro Football" ||
      [
        "Games",
        "Fights",
        "Futures",
        "Awards",
        "Draft",
        "Events",
        "Win totals",
        "Divisions",
        "League Leader",
      ].includes(selectedScope),
    [selectedScope, selectedCompetition]
  );

  const eventsList = useMemo(() => {
    if (!eventsData) return [];
    if (Array.isArray(eventsData)) return eventsData;
    if (Array.isArray(eventsData.events)) return eventsData.events;
    if (Array.isArray(eventsData.data)) return eventsData.data;
    if (Array.isArray(eventsData.currentEvents))
      return eventsData.currentEvents;
    return [];
  }, [eventsData]);

  const shouldHideScopeForCompetition = (competitionName, scope) => {
    // Only hide these scopes on NFL ("Pro Football") - Games is shown like NBA
    if (competitionName !== "Pro Football") return false;
    const normalized = String(scope || "")
      .trim()
      .toLowerCase();
    return (
      normalized === "receiving yards" ||
      normalized === "rushing yards" ||
      normalized === "rushing"
    );
  };

  // Check if competition is Soccer related
  const isSoccerCompetition = (competitionName) => {
    const soccerCompetitions = [
      "EPL",
      "La Liga",
      "Ligue 1",
      "Bundesliga",
      "Serie A",
      "UCL",
      "FIFA World Cup",
      "Eredivisie",
      "AFCON",
      "EFL Championship",
      "Scottish Premiership",
      "Saudi Pro League",
      "Liga Portugal",
      "FA Cup",
      "Liga MX",
      "Brasileiro Serie A",
      "Australian A League",
      "Taca de Portugal",
    ];
    return soccerCompetitions.includes(competitionName);
  };

  // Cache for API responses
  const eventsCache = useRef(new Map());

  // Animation values
  const eventsOpacity = useRef(new Animated.Value(0)).current;

  // Ref for ScrollView to scroll to top when competition/scope changes
  const scrollViewRef = useRef(null);

  // Position tracking for category tabs (if needed for future features)
  const categoryItemPositions = useRef({});

  // Create flattened competitions list - filtered to only include desired competitions
  const flattenedCompetitions = useMemo(() => {
    if (!sportsFilters) return [];

    // Competition mapping: API name -> Display name
    const competitionMapping = {
      Trending: "Trending",
      "Pro Football": "NFL",
      "Pro Baseball": "MLB",
      "Pro Basketball (M)": "NBA",
      "College Basketball (M)": "COLLEGE BB (M)",
      "College Basketball (W)": "COLLEGE BB (W)",
      EPL: "EPL",
      "La Liga": "LA LIGA",
      "Ligue 1": "LIGUE 1",
      Bundesliga: "BUNDESLIGA",
      UFC: "UFC",
      "Serie A": "SERIE A",
      UCL: "UCL",
    };

    const allowedCompetitions = Object.keys(competitionMapping);

    const competitions = [];

    // Add "Trending" as a special case (not from API)
    competitions.push({
      name: "Trending",
      displayName: "Trending",
      sport: "Special",
      scopes: ["Games", "Futures", "Events"],
    });

    // Add competitions from the API response
    Object.entries(sportsFilters.filtersBySports).forEach(
      ([sportName, sportData]) => {
        if (sportName === "All sports") return;

        Object.keys(sportData.competitions || {}).forEach((competitionName) => {
          // Only include competitions that are in our allowed list (excluding Trending which we added above)
          if (
            allowedCompetitions.includes(competitionName) &&
            competitionName !== "Trending"
          ) {
            // Override scopes for specific competitions
            let competitionScopes =
              sportData.competitions[competitionName].scopes || [];
            if (competitionName === "UFC") {
              competitionScopes = ["Fights"]; // Override UFC to use "Fights" instead of "Games"
            } else if (competitionName === "Pro Football") {
              // Hide Receiving Yards / Rushing scopes on NFL (Games is shown)
              competitionScopes = competitionScopes.filter(
                (scope) =>
                  !shouldHideScopeForCompetition(competitionName, scope)
              );
            }

            competitions.push({
              name: competitionName,
              displayName: competitionMapping[competitionName],
              sport: sportName,
              scopes: competitionScopes,
            });
          }
        });
      }
    );

    // Define custom order priority (lower number = higher priority)
    const competitionOrder = {
      Trending: 1,
      NFL: 2,
      NBA: 3,
      MLB: 4,
      EPL: 5,
      "LA LIGA": 6,
      "COLLEGE BB (M)": 9,
      "COLLEGE BB (W)": 10,
      "LIGUE 1": 11,
      BUNDESLIGA: 12,
      UFC: 13,
      "SERIE A": 15,
      UCL: 16,
    };

    // Sort competitions by custom order, then alphabetically as fallback
    competitions.sort((a, b) => {
      const orderA = competitionOrder[a.displayName] || 999;
      const orderB = competitionOrder[b.displayName] || 999;

      if (orderA !== orderB) {
        return orderA - orderB; // Lower number = higher priority
      }

      // If same priority, sort alphabetically
      return a.displayName.localeCompare(b.displayName);
    });

    return competitions;
  }, [sportsFilters]);

  // 1. Fetch Sports Filters on Mount
  useEffect(() => {
    const fetchSportsFilters = async () => {
      try {
        const response = await fetch(
          `${API_BASE_URL}/api/sports-filters`
        );
        const data = await response.json();
     
        setSportsFilters(data);
      } catch (error) {
       
      }
    };
    fetchSportsFilters();
  }, []);

  const buildApiUrl = useCallback((competition, scope) => {
    if (competition === "Trending") {
      return `${API_BASE_URL}/api/v1/sports/nba/events?scope=Games`;
    }
    const slug = COMPETITION_TO_SLUG[competition];
    if (!slug) return `${API_BASE_URL}/api/events`;
    const s = encodeURIComponent(scope || "Games");
    return `${API_BASE_URL}/api/v1/sports/${slug}/events?scope=${s}`;
  }, []);

  // Fetch Events function - can be called from anywhere
  const fetchEventsData = useCallback(
    async (forceRefresh = false) => {
      // NFL has no scope selection - always fetch. Others need a valid scope.
      const hasValidScope = [
        "Games",
        "Fights",
        "Futures",
        "Awards",
        "Draft",
        "Events",
        "Win totals",
        "Divisions",
        "League Leader",
      ].includes(selectedScope);
      if (selectedCompetition !== "Pro Football" && !hasValidScope) {
        setLoading(false);
        return;
      }

      if (!forceRefresh) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      try {
        // Create cache key
        const cacheKey = `${selectedCompetition}-${selectedScope}`;

        // Check cache first (unless forcing refresh)
        if (!forceRefresh && eventsCache.current.has(cacheKey)) {
          console.log(`Using cached data for: ${cacheKey}`);
          setEventsData(eventsCache.current.get(cacheKey));
          setLoading(false);
          return;
        }

        // Build URL based on current competition and scope
        const url = buildApiUrl(selectedCompetition, selectedScope);

        console.log(
          `${
            forceRefresh ? "Refreshing" : "Fetching"
          } from: ${url} (Competition: ${selectedCompetition}, Scope: ${selectedScope})`
        );

        const response = await fetch(url);
        const data = await response.json();

        // Cache the response
        eventsCache.current.set(cacheKey, data);
        setEventsData(data);
      } catch (error) {
        console.error("Error fetching events data:", error);
        // Fallback to general events if specific route fails
        try {
          const fallbackResponse = await fetch(
            `${API_BASE_URL}/api/events`
          );
          const fallbackData = await fallbackResponse.json();

          // Cache fallback data too
          const cacheKey = `${selectedCompetition}-${selectedScope}`;
          eventsCache.current.set(cacheKey, fallbackData);
          setEventsData(fallbackData);
        } catch (fallbackError) {
          console.error("Fallback also failed:", fallbackError);
        }
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [selectedCompetition, selectedScope, buildApiUrl]
  );

  // 2. Fetch Events when sport/scope changes (defer so tab/scope highlight updates first)
  useEffect(() => {
    const task = InteractionManager.runAfterInteractions(() => {
      fetchEventsData();
    });
    return () => task.cancel();
  }, [fetchEventsData]);

  // Scroll to top when competition or scope changes
  useEffect(() => {
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollTo({ y: 0, animated: true });
    }
  }, [selectedCompetition, selectedScope]);

  // Handle pull-to-refresh
  const handleRefresh = useCallback(() => {
    console.log(
      `Refreshing markets for ${selectedCompetition} - ${selectedScope}...`
    );
    // Force refresh by bypassing cache and fetching fresh data
    fetchEventsData(true);
  }, [selectedCompetition, selectedScope, fetchEventsData]);

  // Animate events list when data loads
  useEffect(() => {
    if (!loading && eventsData) {
      // Reset animation values
      eventsOpacity.setValue(0);

      // Start fade in animation
      Animated.timing(eventsOpacity, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }).start();
    }
  }, [eventsData, loading, eventsOpacity]);

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* HEADER SECTION */}
      <View style={styles.header}>
        {/* Top Row: Logo + Name, Discord */}
        <View style={styles.headerTopRow}>
          {/* Left: Logo + Scoretrade */}
          <View style={styles.headerBrand}>
            <Image
              source={
                isDarkMode
                  ? require("../assets/images/whiteTrade.png")
                  : require("../assets/images/blackTrade.png")
              }
              style={styles.headerLogo}
              resizeMode="contain"
            />
            <Text style={styles.headerBrandName}>Scoretrade</Text>
          </View>

          <View style={styles.headerSpacer} />

          {/* Right: Discord Icon */}
          <TouchableOpacity
            style={styles.settingsIcon}
            onPress={() => Linking.openURL("https://discord.gg/e7zGDnNcRF")}
          >
            <Image
              source={
                isDarkMode
                  ? require("../assets/images/discord.png")
                  : require("../assets/images/DiscordBlack.png")
              }
              style={styles.discordIcon}
              resizeMode="contain"
            />
          </TouchableOpacity>
        </View>

        {/* Category Navigation Row */}
        {flattenedCompetitions.length > 0 && (
          <View style={styles.categoryContainer}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoryRow}
            >
              {flattenedCompetitions.map((competition, index) => {
                const isSelected = selectedCompetition === competition.name;
                return (
                  <TouchableOpacity
                    key={competition.name}
                    style={styles.categoryItem}
                    onLayout={(event) => {
                      const { x, width } = event.nativeEvent.layout;
                      categoryItemPositions.current[competition.name] = {
                        x,
                        width,
                      };
                    }}
                    onPress={() => {
                      setSelectedCompetition(competition.name);
                      const scopes = competition.scopes || [];
                      const scope = scopes[0] || null;
                      setSelectedScope(scope);
                    }}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.categoryText,
                        isSelected && styles.categoryTextActive,
                      ]}
                    >
                      {competition.displayName}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}
      </View>

      {/* EVENTS LIST SECTION (Scrollable with Refresh) */}
      <ScrollView
        ref={scrollViewRef}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.eventsScrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[theme.accent]}
            tintColor={theme.accent}
            title="Refreshing markets..."
            titleColor={theme.secondaryText}
          />
        }
      >
        {/* Scopes Row or Ticker */}
        {selectedCompetition === "Trending" ? (
          <View style={styles.tickerWrapper}>
            <Ticker />
          </View>
        ) : (
          selectedCompetition &&
          selectedCompetition !== "Pro Football" && (
            <View style={styles.scopesContainer}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.scopesRow}
              >
                {flattenedCompetitions
                  .find((comp) => comp.name === selectedCompetition)
                  ?.scopes?.filter(
                    (scope) => {
                      // For soccer competitions, only show "Games" scope
                      if (isSoccerCompetition(selectedCompetition)) {
                        return scope === "Games";
                      }
                      // For MLB, exclude "Events" scope
                      if (selectedCompetition === "Pro Baseball") {
                        const allowedScopes = ["Games", "Futures", "Awards"];
                        return (
                          allowedScopes.includes(scope) &&
                          !shouldHideScopeForCompetition(selectedCompetition, scope)
                        );
                      }
                      // For other competitions, show allowed scopes
                      const allowedScopes = ["Games", "Futures", "Awards", "Events"];
                      return (
                        allowedScopes.includes(scope) &&
                        !shouldHideScopeForCompetition(selectedCompetition, scope)
                      );
                    }
                  )
                  .map((scope) => {
                    const isSelected = selectedScope === scope;
                    return (
                      <TouchableOpacity
                        key={scope}
                        style={[
                          styles.scopeButton,
                          isSelected && styles.scopeButtonActive,
                        ]}
                        onPress={() => {
                          setSelectedScope(scope);
                        }}
                        activeOpacity={0.7}
                      >
                        <Text
                          style={[
                            styles.scopeButtonText,
                            isSelected && styles.scopeButtonTextActive,
                          ]}
                        >
                          {scope}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
              </ScrollView>
            </View>
          )
        )}

        {/* Scopes Chips (Sub-filters) */}
        {/* {selectedCompetition && (
          <View style={styles.scopesWrapper}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {flattenedCompetitions
                .find((comp) => comp.name === selectedCompetition)
                ?.scopes?.filter(
                  (scope) =>
                    !shouldHideScopeForCompetition(selectedCompetition, scope)
                )
                .map((scope) => {
                  const isSelected = selectedScope === scope;
                  return (
                    <TouchableOpacity
                      key={scope}
                      style={[
                        styles.scopeChip,
                        isSelected && styles.scopeChipSelected,
                      ]}
                      onPress={() => {
                        setSelectedScope(scope);
                        console.log(
                          "Selected Competition:",
                          selectedCompetition
                        );
                        console.log("Selected Scope:", scope);
                      }}
                    >
                      <Text
                        style={[
                          styles.scopeText,
                          isSelected && styles.scopeTextSelected,
                        ]}
                      >
                        {scope}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
            </ScrollView>
          </View>
        )} */}
        <Animated.View
          style={[
            styles.eventsContainer,
            {
              opacity: eventsOpacity,
            },
          ]}
        >
          {selectedCompetition === "Trending" ? (
            <Trending events={eventsList} loading={loading} competition="PRO BASKETBALL (M)" />
          ) : isDataBackedScope ? (
            loading ? (
              <View style={styles.loaderContainer}>
                <LottieView
                  source={require("../assets/lottie/Loading.json")}
                  autoPlay
                  loop
                  style={{ height: 200, width: 200 }}
                />
              </View>
            ) : (
              eventsList.map((event, index) =>
                selectedCompetition !== "Pro Football" &&
                selectedScope === "Games" &&
                !isSoccerCompetition(selectedCompetition) ? (
                <View style={{margin: 10}} key={event.ticker || event.id || index}>
                  <GameCard
                    key={event.ticker || event.id || index}
                    event={event}
                    competitionFallback={selectedCompetition}
                  />
                  </View>
                ) : (
                  <View style={{margin: 10}} key={event.ticker || event.id || index}>
                    <EventCard event={event} />
                  </View>
                )
              )
            )
          ) : (
            <View style={styles.comingSoonContainer}>
              <Text style={styles.comingSoonText}>Markets coming soon</Text>
              <Text style={styles.comingSoonSubtext}>
                We're working on bringing you {selectedScope.toLowerCase()}{" "}
                markets for {selectedCompetition}.
              </Text>
            </View>
          )}

          {/* Empty State - show for data-backed scopes (non-Trending) */}
          {selectedCompetition !== "Trending" &&
            isDataBackedScope &&
            !loading &&
            eventsList.length === 0 && (
              <Text style={styles.emptyText}>
                No active markets for this selection.
              </Text>
            )}
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const DARK_THEME = {
  background: "#000000",
  headerBackground: "#000000",
  primaryText: "#FFFFFF",
  secondaryText: "#CCCCCC",
  mutedText: "#AAAAAA",
  subtleText: "#8A8A8A",
  categoryBorder: "rgba(255, 255, 255, 0.1)",
  chipBackground: "#18181B",
  chipActiveBackground: "#FFFFFF",
  chipText: "#FFFFFF",
  chipActiveText: "#000000",
  accent: "#BB86FC",
  scopeChipBorder: "#555555",
  scopeChipSelectedBorder: "#000000",
  scopeChipSelectedBackground: "#FFFFFF",
  scopeChipText: "#CCCCCC",
  scopeChipSelectedText: "#000000",
};

const LIGHT_THEME = {
  background: "#F5F7FB",
  headerBackground: "#FFFFFF",
  primaryText: "#111827",
  secondaryText: "#4B5563",
  mutedText: "#6B7280",
  subtleText: "#6B7280",
  categoryBorder: "rgba(0, 0, 0, 0.1)",
  chipBackground: "#E5E7EB",
  chipActiveBackground: "#111827",
  chipText: "#111827",
  chipActiveText: "#FFFFFF",
  accent: "#7C3AED",
  scopeChipBorder: "#D1D5DB",
  scopeChipSelectedBorder: "#111827",
  scopeChipSelectedBackground: "#111827",
  scopeChipText: "#6B7280",
  scopeChipSelectedText: "#FFFFFF",
};

const createStyles = (theme) =>
  StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  header: {
    backgroundColor: theme.headerBackground,
    paddingTop: 8,
    paddingBottom: 12,
  },
  headerTopRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    marginBottom: 12,
    gap: 12,
  },
  headerBrand: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  headerLogo: {
    width: 20,
    height: 20,

      },
  headerBrandName: {
    fontSize: 18,
    fontWeight: "700",
    color: theme.primaryText,
  },
  headerSpacer: {
    flex: 1,
  },
  settingsIcon: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  discordIcon: {
    width: 22,
    height: 22,
  },
  categoryContainer: {
    position: "relative",
    borderBottomWidth: 1,
    borderBottomColor: theme.categoryBorder,
  },
  categoryRow: {
    paddingHorizontal: 16,
    gap: 24,
  },
  categoryItem: {
    paddingVertical: 4,
    marginBottom: 5,
  },
  categoryText: {
    fontSize: 16,
    color: theme.subtleText,
    fontWeight: "700",
  },
  categoryTextActive: {
    fontWeight: "700",
    color: theme.primaryText,
  },
  scopesContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 1,
    marginBottom: 10,
    gap: 12,
  },
  competitionLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: theme.primaryText,
    minWidth: 50,
  },
  scopesRow: {
    flexDirection: "row",
    gap: 8,
  },
  scopeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 0,
    backgroundColor: theme.chipBackground,
  },
  scopeButtonActive: {
    backgroundColor: theme.chipActiveBackground,
  },
  scopeButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: theme.chipText,
  },
  scopeButtonTextActive: {
    color: theme.chipActiveText,
    fontWeight: "700",
  },
  tickerWrapper: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  titleImage: {
    width: 120,
    height: 40,
    marginBottom: 1,
    right: 30,
  },
  scrollContent: {
    flexGrow: 1,
  },
  eventsScrollContent: {
    flexGrow: 1,
    paddingBottom: 100,
  },
  scopesWrapper: {
    marginTop: 12,
    paddingHorizontal: 20,
  },
  scopeChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,

    marginRight: 8,
    borderWidth: 1,
    borderColor: theme.scopeChipBorder,
  },
  scopeChipSelected: {
    borderColor: theme.scopeChipSelectedBorder,
    backgroundColor: theme.scopeChipSelectedBackground,
  },
  scopeText: {
    fontSize: 12,
    fontWeight: "500",
    color: theme.scopeChipText,
  },
  scopeTextSelected: {
    color: theme.scopeChipSelectedText,
    fontWeight: "700",
  },
  eventsContainer: {
    padding: 0,
    flex: 1,
  },
  loaderContainer: {
    marginTop: 60,
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    color: theme.secondaryText,
    fontSize: 14,
  },
  emptyText: {
    textAlign: "center",
    marginTop: 40,
    color: theme.mutedText,
    fontSize: 16,
  },
  comingSoonContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  comingSoonText: {
    fontSize: 24,
    fontWeight: "600",
    color: theme.secondaryText,
    textAlign: "center",
    marginBottom: 12,
  },
  comingSoonSubtext: {
    fontSize: 16,
    color: theme.mutedText,
    textAlign: "center",
    lineHeight: 22,
  },
});
