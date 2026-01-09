import React, { useEffect, useMemo, useState, useRef } from "react";
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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// Custom Constants & Components

import EventCard from "../src/components/market/EventCard";

const { width } = Dimensions.get("window");

export default function HomeScreen() {
  const [sportsFilters, setSportsFilters] = useState(null);
  const [selectedCompetition, setSelectedCompetition] = useState("Trending");
  const [selectedScope, setSelectedScope] = useState("Games");
  const [eventsData, setEventsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const isDataBackedScope = useMemo(
    () =>
      ["Games", "Fights", "Futures", "Awards", "Draft", "Events"].includes(
        selectedScope
      ),
    [selectedScope]
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
    // Only hide these scopes on NFL ("Pro Football")
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

  // Cache for API responses
  const eventsCache = useRef(new Map());

  // Animation values
  const eventsOpacity = useRef(new Animated.Value(0)).current;
  const eventsTranslateY = useRef(new Animated.Value(20)).current;

  // Create flattened competitions list - filtered to only include desired competitions
  const flattenedCompetitions = useMemo(() => {
    if (!sportsFilters) return [];

    // Competition mapping: API name -> Display name
    const competitionMapping = {
      Trending: "Trending",
      "Pro Football": "NFL",
      "Pro Baseball": "MLB",
      "Pro Basketball (M)": "NBA",
      "College Football": "COLLEGE FB",
      "College Football Playoffs": "CFP",
      "College Basketball (M)": "COLLEGE BB (M)",
      "College Basketball (W)": "COLLEGE BB (W)",
      EPL: "EPL",
      "La Liga": "LA LIGA",
      "Ligue 1": "LIGUE 1",
      Bundesliga: "BUNDESLIGA",
      UFC: "UFC",
      "FIFA World Cup": "WORLD CUP",
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
              // Hide Receiving Yards / Rushing scopes on NFL
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
      CFP: 8,
      "COLLEGE FB": 7,
      "COLLEGE BB (M)": 9,
      "COLLEGE BB (W)": 10,
      "LIGUE 1": 11,
      BUNDESLIGA: 12,
      UFC: 13,
      "WORLD CUP": 14,
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
          "http://localhost:3000/api/sports-filters"
        );
        const data = await response.json();
        setSportsFilters(data);
      } catch (error) {
        console.error("Error fetching sports filters:", error);
      }
    };
    fetchSportsFilters();
  }, []);

  // 2. Fetch Events when sport/scope changes
  useEffect(() => {
    // Only fetch data for known scopes that have routes
    if (
      selectedScope !== "Games" &&
      selectedScope !== "Fights" &&
      selectedScope !== "Futures" &&
      selectedScope !== "Awards" &&
      selectedScope !== "Draft" &&
      selectedScope !== "Events"
    ) {
      setLoading(false);
      return;
    }

    const fetchEventsData = async (forceRefresh = false) => {
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
          return;
        }

        // Dynamic route selection for games, fights, and futures
        let url = "http://localhost:3000/api/events"; // Default fallback

        // Hit specific routes when scope is one we support
        if (
          selectedScope === "Games" ||
          selectedScope === "Fights" ||
          selectedScope === "Futures" ||
          selectedScope === "Awards" ||
          selectedScope === "Draft" ||
          selectedScope === "Events"
        ) {
          const routeMap = {
            // American Sports
            "Pro Football": "/api/games/nfl",
            "Pro Baseball": "/api/games/mlb",
            "Pro Basketball (M)": "/api/games/nba",

            // College Sports
            "College Football": "/api/games/ncaaf",
            "College Football Playoffs": "/api/games/ncaaf",
            "College Basketball (M)": "/api/games/ncaamb",
            "College Basketball (W)": "/api/games/ncaawb",

            // Soccer Leagues (from your backend)
            EPL: "/api/games/epl",
            "La Liga": "/api/games/laliga",
            "Serie A": "/api/games/seriea",
            UCL: "/api/games/ucl",
            Bundesliga: "/api/games/bundesliga",
            "Ligue 1": "/api/games/ligue1",
            Eredivisie: "/api/games/eredivisie",
            AFCON: "/api/games/afcon",
            "EFL Championship": "/api/games/efl-championship",
            "Scottish Premiership": "/api/games/scottish-prem",
            "Saudi Pro League": "/api/games/saudi-pl",
            "Liga Portugal": "/api/games/liga-portugal",
            "FA Cup": "/api/games/fa-cup",
            "Liga MX": "/api/games/liga-mx",
            "Brasileiro Serie A": "/api/games/brasileiro",
            "Australian A League": "/api/games/a-league",
            "Taca de Portugal": "/api/games/taca-portugal",

            // UFC uses MMA fights route
            UFC: "/api/games/MMA",

            // The following competitions don't have specific game routes in your backend
            // They will fall back to the general /api/events endpoint
            // "Ligue 1": no specific route
            // "UFC": no specific route
            // "FIFA World Cup": no specific route
            // "Trending": handled separately above
          };

          // Handle Futures and Awards scopes specifically
          if (selectedScope === "Futures") {
            // Specific futures routes
            const futuresRouteMap = {
              "Pro Football": "/api/futures/nfl", // NFL Futures
            };

            const futuresRoute = futuresRouteMap[selectedCompetition];
            if (futuresRoute) {
              url = `http://localhost:3000${futuresRoute}`;
            }
          } else if (selectedScope === "Awards") {
            // Specific awards routes
            const awardsRouteMap = {
              "Pro Football": "/api/awards/nfl", // NFL Awards
            };

            const awardsRoute = awardsRouteMap[selectedCompetition];
            if (awardsRoute) {
              url = `http://localhost:3000${awardsRoute}`;
            }
          } else if (selectedScope === "Draft") {
            // Specific draft routes
            const draftRouteMap = {
              "Pro Football": "/api/draft/nfl", // NFL Draft
            };

            const draftRoute = draftRouteMap[selectedCompetition];
            if (draftRoute) {
              url = `http://localhost:3000${draftRoute}`;
            }
          } else if (selectedScope === "Events") {
            // Current events routes
            const currentEventsRouteMap = {
              "Pro Football": "/api/current-events/nfl",
            };

            const currentEventsRoute =
              currentEventsRouteMap[selectedCompetition];
            if (currentEventsRoute) {
              url = `http://localhost:3000${currentEventsRoute}`;
            }
          } else {
            // Handle Games and Fights scopes
            // Find the matching route for the current competition
            const route = routeMap[selectedCompetition];
            if (route) {
              url = `http://localhost:3000${route}`;
            }
          }
        }

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
            "http://localhost:3000/api/events"
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
    };

    fetchEventsData();
  }, [selectedCompetition, selectedScope]);

  // Handle pull-to-refresh
  const handleRefresh = () => {
    console.log("Refreshing markets...");
  };

  // Animate events list when data loads
  useEffect(() => {
    if (!loading && eventsData) {
      // Reset animation values
      eventsOpacity.setValue(0);
      eventsTranslateY.setValue(20);

      // Start animation
      Animated.parallel([
        Animated.timing(eventsOpacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(eventsTranslateY, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [eventsData, loading, eventsOpacity, eventsTranslateY]);

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* HEADER SECTION (Static) */}
      <View style={styles.header}>
        <Image
          source={require("../assets/images/ScoretradeWhite.png")}
          style={styles.titleImage}
          resizeMode="contain"
        />
        {/* <View style={styles.tickerWrapper}>
          <Ticker />
        </View> */}
      </View>

      {/* STICKY FILTERS SECTION (Fixed position) */}
      <View style={styles.filterSection}>
        {/* Competitions Horizontal List */}
        {flattenedCompetitions.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.sportsCarouselContent}
          >
            {flattenedCompetitions.map((competition) => {
              const isSelected = selectedCompetition === competition.name;
              return (
                <TouchableOpacity
                  key={competition.name}
                  style={[
                    styles.sportCard,
                    isSelected && styles.sportCardSelected,
                  ]}
                  onPress={() => {
                    setSelectedCompetition(competition.name);
                    // Auto-select the first available scope for this competition
                    const firstScope = competition.scopes?.[0] || null;
                    setSelectedScope(firstScope);
                    console.log("Selected Competition:", competition.name);
                    console.log("Selected Scope:", firstScope);
                  }}
                >
                  <Text
                    style={[
                      styles.sportName,
                      isSelected && styles.sportNameSelected,
                    ]}
                  >
                    {competition.displayName}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}

        {/* Scopes Chips (Sub-filters) */}
        {selectedCompetition && (
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
                        setSelectedScope(isSelected ? null : scope);
                        console.log(
                          "Selected Competition:",
                          selectedCompetition
                        );
                        console.log(
                          "Selected Scope:",
                          isSelected ? null : scope
                        );
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
        )}
      </View>

      {/* EVENTS LIST SECTION (Scrollable with Refresh) */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.eventsScrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={["#000"]}
            tintColor="#000"
            title="Refreshing markets..."
            titleColor="#666"
          />
        }
      >
        <Animated.View
          style={[
            styles.eventsContainer,
            {
              opacity: eventsOpacity,
              transform: [{ translateY: eventsTranslateY }],
            },
          ]}
        >
          {isDataBackedScope ? (
            loading ? (
              <View style={styles.loaderContainer}>
                <ActivityIndicator size="large" color="#000" />
                <Text style={styles.loadingText}>Loading Markets...</Text>
              </View>
            ) : (
              eventsList.map((event, index) => (
                <EventCard key={event.ticker || index} event={event} />
              ))
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

          {/* Empty State - show for data-backed scopes */}
          {isDataBackedScope && !loading && eventsList.length === 0 && (
            <Text style={styles.emptyText}>
              No active markets for this selection.
            </Text>
          )}
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  header: {
    paddingHorizontal: 15,

    backgroundColor: "#FFFFFF",
  },
  titleImage: {
    width: 120,
    height: 40,
    marginBottom: 1,
    right: 30,
  },
  tickerWrapper: {
    marginTop: 15,
    marginBottom: 5,
  },
  scrollContent: {
    flexGrow: 1,
  },
  eventsScrollContent: {
    flexGrow: 1,
    paddingBottom: 100,
  },
  filterSection: {
    backgroundColor: "#FFFFFF",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  sportsCarouselContent: {
    paddingHorizontal: 20,
    paddingBottom: 5,
  },
  sportCard: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    backgroundColor: "#F5F5F5",
    borderRadius: 25,
    marginRight: 10,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  sportCardSelected: {
    backgroundColor: "#000000",
    borderColor: "#000000",
  },
  sportName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
  },
  sportNameSelected: {
    color: "#FFFFFF",
  },
  scopesWrapper: {
    marginTop: 12,
    paddingHorizontal: 20,
  },
  scopeChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: "#F8F8F8",
    marginRight: 8,
    borderWidth: 1,
    borderColor: "#EEE",
  },
  scopeChipSelected: {
    borderColor: "#666",
  },
  scopeText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#444",
  },
  scopeTextSelected: {
    color: "#000",
    fontWeight: "700",
  },
  eventsContainer: {
    padding: 20,
    flex: 1,
  },
  loaderContainer: {
    marginTop: 60,
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    color: "#666",
    fontSize: 14,
  },
  emptyText: {
    textAlign: "center",
    marginTop: 40,
    color: "#999",
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
    color: "#666",
    textAlign: "center",
    marginBottom: 12,
  },
  comingSoonSubtext: {
    fontSize: 16,
    color: "#999",
    textAlign: "center",
    lineHeight: 22,
  },
});
