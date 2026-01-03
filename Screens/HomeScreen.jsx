import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import React, { useEffect, useState, useRef } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import API_BASE_URL from "../src/config/api";
import { Colors, Spacing, Typography, BorderRadius } from "../constants/theme";
import MarketCard from "../src/components/market/MarketCard";
import Ticker from "../src/components/ui/Ticker";
import LottieLoader from "../src/components/ui/LottieLoader";

export default function HomeScreen() {
  const [markets, setMarkets] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedSport, setSelectedSport] = useState(null);
  // Cache markets by sport ID to avoid refetching
  const marketsCache = useRef({});

  // Static sports metadata object
  const sports = [
    {
      id: 10,
      description: "NFL football",
      sport: "nfl",
      image: "https://polymarket-upload.s3.us-east-2.amazonaws.com/nfl.png",
      resolution: "https://www.nfl.com/",
      ordering: "away",
      tags: "1,450,100639",
      series: "10187",
      createdAt: "2025-11-05T19:27:45.399303Z",
    },
    {
      id: 9,
      sport: "cfb",
      image:
        "https://polymarket-upload.s3.us-east-2.amazonaws.com/espn+college+football+logo.png",
      resolution: "https://www.ncaa.com/",
      ordering: "away",
      tags: "1,100351,100639",
      series: "10210",
      createdAt: "2025-11-05T19:27:45.399303Z",
    },
    {
      id: 1,
      description: "march madness",
      sport: "ncaab",
      image:
        "https://polymarket-upload.s3.us-east-2.amazonaws.com/marchmadness.jpeg",
      resolution: "https://www.ncaa.com/march-madness-live/bracket",
      ordering: "home",
      tags: "1,100149,100639",
      series: "39",
      createdAt: "2025-11-05T19:27:45.399303Z",
    },
    {
      id: 4,
      description: "college basketball",
      sport: "cbb",
      image: "https://polymarket-upload.s3.us-east-2.amazonaws.com/ncaab1.png",
      resolution: "https://www.ncaa.com/",
      ordering: "away",
      tags: "1,101178,100639,101954",
      series: "10470",
      createdAt: "2025-11-05T19:27:45.399303Z",
    },
    {
      id: 34,
      description: "NBA basketball",
      sport: "nba",
      image:
        "https://polymarket-upload.s3.us-east-2.amazonaws.com/super+cool+basketball+in+red+and+blue+wow.png",
      resolution: "https://www.nba.com/",
      ordering: "away",
      tags: "1,745,100639",
      series: "10345",
      createdAt: "2025-11-05T19:27:45.399303Z",
    },
    {
      id: 47,
      description: "College women basketball",
      sport: "cwbb",
      image:
        "https://polymarket-upload.s3.us-east-2.amazonaws.com/ncaa-c14995df96.png",
      resolution: "https://www.ncaa.com/sports/basketball-women/d1",
      ordering: "home",
      tags: "1,28,100639,102003",
      series: "10471",
      createdAt: "2025-11-07T21:09:54.771154Z",
    },
    {
      id: 6,
      description: "Women basketball",
      sport: "wnba",
      image:
        "https://polymarket-upload.s3.us-east-2.amazonaws.com/wnba-logo-PAR4befDAubM.png",
      resolution: "https://www.wnba.com/",
      ordering: "away",
      tags: "1,100639,100254",
      series: "10105",
      createdAt: "2025-11-05T19:27:45.399303Z",
    },
    {
      id: 35,
      description: "hockey",
      sport: "nhl",
      image: "https://polymarket-upload.s3.us-east-2.amazonaws.com/nhl.png",
      resolution: "https://www.nhl.com/",
      ordering: "away",
      tags: "1,899,100639",
      series: "10346",
      createdAt: "2025-11-05T19:27:45.399303Z",
    },
    {
      id: 48,
      description: "UFC",
      sport: "mma",
      image: "https://polymarket-upload.s3.us-east-2.amazonaws.com/ufc.png",
      resolution: "https://www.ufc.com/",
      ordering: "home",
      tags: "1,100639",
      series: "10500",
      createdAt: "2025-11-07T21:10:21.566359Z",
    },
    {
      id: 2,
      description: "English Premier League",
      sport: "epl",
      image:
        "https://polymarket-upload.s3.us-east-2.amazonaws.com/Repetitive-markets/premier+league.jpg",
      resolution: "https://www.premierleague.com/",
      ordering: "home",
      tags: "1,82,306,100639,100350",
      series: "10188",
      createdAt: "2025-11-05T19:27:45.399303Z",
    },
    {
      id: 3,
      description: "La liga",
      sport: "lal",
      image:
        "https://polymarket-upload.s3.us-east-2.amazonaws.com/league-lal.png",
      resolution: "https://www.laliga.com/en-GB",
      ordering: "home",
      tags: "1,780,100639,100350",
      series: "10193",
      createdAt: "2025-11-05T19:27:45.399303Z",
    },
    {
      id: 13,
      description: "Champions League",
      sport: "ucl",
      image:
        "https://polymarket-upload.s3.us-east-2.amazonaws.com/champions-league-pic-QIUFsL8vaDdq.png",
      resolution: "https://www.uefa.com/uefachampionsleague/",
      ordering: "home",
      tags: "1,100977,100639,1234,100350",
      series: "10204",
      createdAt: "2025-11-05T19:27:45.399303Z",
    },
    {
      id: 33,
      description: "Major Leauge Soccer",
      sport: "mls",
      image:
        "https://polymarket-upload.s3.us-east-2.amazonaws.com/soccer-ball-d7941ac797.jpg",
      resolution: "https://www.mls.com/",
      ordering: "home",
      tags: "1,100639,100350,100100",
      series: "10189",
      createdAt: "2025-11-05T19:27:45.399303Z",
    },
    {
      id: 7,
      description: "Bundesliga",
      sport: "bun",
      image:
        "https://polymarket-upload.s3.us-east-2.amazonaws.com/league-bun.jpg",
      resolution: "https://www.bundesliga.com/en/bundesliga",
      ordering: "home",
      tags: "1,1494,100639,100350",
      series: "10194",
      createdAt: "2025-11-05T19:27:45.399303Z",
    },
    {
      id: 11,
      description: "Ligue 1",
      sport: "fl1",
      image:
        "https://polymarket-upload.s3.us-east-2.amazonaws.com/league-fl1.png",
      resolution: "https://ligue1.com/en",
      ordering: "home",
      tags: "1,100639,102070,100350",
      series: "10195",
      createdAt: "2025-11-05T19:27:45.399303Z",
    },
    {
      id: 12,
      description: "Series A",
      sport: "sea",
      image:
        "https://polymarket-upload.s3.us-east-2.amazonaws.com/Serie-A-Logo.png",
      resolution: "https://www.legaseriea.it/en",
      ordering: "home",
      tags: "1,100639,101962,100350",
      series: "10203",
      createdAt: "2025-11-05T19:27:45.399303Z",
    },
    {
      id: 36,
      description: "Europa Leauge",
      sport: "uel",
      image: "https://polymarket-upload.s3.us-east-2.amazonaws.com/uel.png",
      resolution: "https://www.uefa.com/uefaeuropaleague/",
      ordering: "home",
      tags: "1,100639,101787,100350",
      series: "10209",
      createdAt: "2025-11-07T21:03:43.835683Z",
    },
    {
      id: 17,
      description: "FIFA",
      sport: "fif",
      image: "https://polymarket-upload.s3.us-east-2.amazonaws.com/fif.png",
      resolution: "https://www.fifa.com/en",
      ordering: "home",
      tags: "1,100639,100350,102539",
      series: "10238",
      createdAt: "2025-11-05T19:27:45.399303Z",
    },
  ];

  useEffect(() => {
    // Set first sport as selected by default
    if (sports.length > 0 && !selectedSport) {
      setSelectedSport(sports[0]);
    }
  }, []);

  useEffect(() => {
    // Load markets when a sport is selected
    if (selectedSport) {
      loadMarketsForSport(selectedSport);
    }
  }, [selectedSport]);

  useEffect(() => {
    // Debug: Log when markets state changes
    console.log("Markets state updated:", {
      markets,
      type: typeof markets,
      isArray: Array.isArray(markets),
      length: Array.isArray(markets) ? markets.length : "N/A",
      isNull: markets === null,
      isUndefined: markets === undefined,
    });
  }, [markets]);

  const loadMarketsForSport = (sport) => {
    const cacheKey = sport.id;

    // Check cache first
    if (marketsCache.current[cacheKey]) {
      console.log(`Loading markets for ${sport.sport} from cache`);
      setMarkets(marketsCache.current[cacheKey]);
      setError(null);
      setLoading(false);
      return;
    }

    // If not in cache, fetch from API
    fetchMarketsForSport(sport);
  };

  const fetchMarketsForSport = async (sport) => {
    const cacheKey = sport.id;

    try {
      setLoading(true);
      setError(null);

      const series_id = sport.series;
      // Get the first tag from the comma-separated tags string
      const tag_id = sport.tags.split(",")[0].trim();

      // Properly encode query parameters
      const params = new URLSearchParams({
        series_id,
        tag_id,
      });
      const url = `${API_BASE_URL}/api/markets?${params.toString()}`;

      console.log(
        `Fetching markets for ${sport.sport} (${
          sport.description || sport.sport
        })...`
      );
      console.log(`URL: ${url}`);

      const response = await fetch(url);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage =
          errorData.message ||
          errorData.error ||
          `Request failed (${response.status})`;
        console.error(`Error fetching markets for ${sport.sport}:`, {
          status: response.status,
          error: errorMessage,
        });
        throw new Error(errorMessage);
      }

      const data = await response.json();
      console.log(`Markets response for ${sport.sport}:`, data);
      console.log(`Response type:`, typeof data);
      console.log(`Is array:`, Array.isArray(data));
      console.log(`Is null:`, data === null);
      console.log(`Is undefined:`, data === undefined);
      console.log(
        `Data keys:`,
        data && typeof data === "object" ? Object.keys(data) : "N/A"
      );

      // Handle different response structures
      let marketsData = data;

      // If response is an object with a data/markets/events property, extract it
      if (data && typeof data === "object" && !Array.isArray(data)) {
        if (data.data) {
          marketsData = data.data;
          console.log(`Extracted data.data:`, marketsData);
        } else if (data.markets) {
          marketsData = data.markets;
          console.log(`Extracted data.markets:`, marketsData);
        } else if (data.events) {
          marketsData = data.events;
          console.log(`Extracted data.events:`, marketsData);
        }
      }

      // Handle null/empty responses
      if (marketsData === null || marketsData === undefined) {
        console.warn(`Markets data is null/undefined for ${sport.sport}`);
        // Cache null to avoid refetching
        marketsCache.current[cacheKey] = null;
        setMarkets(null);
        setError(`No markets found for ${sport.description || sport.sport}`);
      } else if (Array.isArray(marketsData) && marketsData.length === 0) {
        console.warn(`Markets array is empty for ${sport.sport}`);
        // Cache empty array to avoid refetching
        marketsCache.current[cacheKey] = [];
        setMarkets([]);
      } else {
        console.log(`Setting markets data:`, {
          type: typeof marketsData,
          isArray: Array.isArray(marketsData),
          length: Array.isArray(marketsData) ? marketsData.length : "N/A",
          firstItem:
            Array.isArray(marketsData) && marketsData.length > 0
              ? marketsData[0]
              : "N/A",
        });

        // Store in cache
        marketsCache.current[cacheKey] = marketsData;
        setMarkets(marketsData);
        setError(null);
      }
    } catch (err) {
      console.error(`Error fetching markets for ${sport.sport}:`, err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Fixed Header with Sports Carousel */}
      <View style={styles.header}>
        <Text style={styles.title}>Scoretrade</Text>

        {/* Ticker Carousel */}
        <Ticker />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.carousel}
          contentContainerStyle={styles.carouselContent}
        >
          {sports.map((sport) => {
            const isSelected = selectedSport?.id === sport.id;
            return (
              <TouchableOpacity
                key={sport.id}
                style={[
                  styles.sportCard,
                  isSelected && styles.sportCardSelected,
                ]}
                onPress={() => setSelectedSport(sport)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.sportName,
                    isSelected && styles.sportNameSelected,
                  ]}
                  numberOfLines={1}
                >
                  {sport.description || sport.sport}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Scrollable Content Area */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={styles.centerContainer}>
            <LottieLoader size="large" />
          </View>
        ) : error ? (
          <View style={styles.centerContainer}>
            <Text style={styles.errorText}>Error: {error}</Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={() =>
                selectedSport && fetchMarketsForSport(selectedSport)
              }
            >
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : markets !== null && markets !== undefined ? (
          <View style={styles.content}>
            {Array.isArray(markets) && markets.length === 0 ? (
              <View style={styles.centerContainer}>
                <Text style={styles.emptyText}>
                  No markets available for{" "}
                  {selectedSport?.description || selectedSport?.sport}
                </Text>
              </View>
            ) : (
              <View style={styles.marketsList}>
                {Array.isArray(markets) ? (
                  markets.map((market, index) => (
                    <MarketCard
                      key={market.id || index}
                      market={market}
                      index={index}
                    />
                  ))
                ) : (
                  <MarketCard market={markets} index={0} />
                )}
              </View>
            )}
          </View>
        ) : (
          <View style={styles.centerContainer}>
            <Text style={styles.emptyText}>
              {selectedSport
                ? `No markets found for ${
                    selectedSport.description || selectedSport.sport
                  }`
                : "Select a sport to view markets"}
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: Spacing.xxl,
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
    backgroundColor: Colors.background,
    zIndex: 10,
  },
  title: {
    ...Typography.pageTitle,
    marginBottom: Spacing.lg,
  },
  carousel: {
    marginHorizontal: -Spacing.lg,
  },
  carouselContent: {
    paddingHorizontal: Spacing.lg,
    paddingRight: Spacing.xl,
  },
  sportCard: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    marginRight: Spacing.md,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sportCardSelected: {
    borderColor: Colors.primary,
    borderWidth: 2,
    backgroundColor: "#FFFFFF",
  },
  sportName: {
    ...Typography.caption,
    textAlign: "center",
    color: Colors.textSecondary,
  },
  sportNameSelected: {
    color: "black",
    fontWeight: "600",
  },
  centerContainer: {
    paddingVertical: Spacing.xxxl,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
  },
  sectionTitle: {
    ...Typography.sectionTitle,
    marginBottom: Spacing.md,
  },
  dataContainer: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  marketsList: {},
  jsonContainer: {
    marginTop: Spacing.md,
    maxHeight: 400,
    backgroundColor: Colors.surfaceAlt,
    borderRadius: BorderRadius.sm,
  },
  jsonContent: {
    padding: Spacing.sm,
  },
  marketCount: {
    ...Typography.body,
    color: Colors.primary,
    marginBottom: Spacing.md,
    fontWeight: "600",
  },
  loadingText: {
    ...Typography.body,
    marginTop: Spacing.md,
    color: Colors.textSecondary,
  },
  errorText: {
    ...Typography.body,
    color: Colors.danger,
    marginBottom: Spacing.md,
    textAlign: "center",
  },
  retryButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.md,
  },
  retryButtonText: {
    ...Typography.body,
    color: Colors.textPrimary,
    fontWeight: "600",
  },
  emptyText: {
    ...Typography.body,
    color: Colors.textTertiary,
  },
  dataText: {
    fontSize: 12,
    fontFamily: "monospace",
    color: Colors.textPrimary,
    lineHeight: 20,
    flexShrink: 1,
  },
});
